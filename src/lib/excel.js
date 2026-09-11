/*
 * Gerador de ficheiros .xlsx, sem bibliotecas.
 *
 * Um .xlsx e um ZIP com uns quantos XML la dentro. Escreve-se aqui a mao por
 * duas razoes: o registo de pacotes esta fechado nesta maquina, e uma
 * biblioteca de folhas de calculo sao centenas de kilobytes que o barbeiro
 * descarregaria em cada visita ao painel para usar uma vez por mes.
 *
 * O ZIP e gravado sem compressao (metodo 0, "store"). E maior, mas nao precisa
 * de deflate e o Excel, o LibreOffice e o Google Sheets abrem na mesma.
 */

// ── ZIP ──────────────────────────────────────────────────────────────────────
const TABELA_CRC = (() => {
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c >>> 0;
  }
  return t;
})();

function crc32(bytes) {
  let c = 0xFFFFFFFF;
  for (let i = 0; i < bytes.length; i++) c = TABELA_CRC[(c ^ bytes[i]) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

const texto = new TextEncoder();

function zipSimples(ficheiros) {
  const partes = [];
  const central = [];
  let posicao = 0;

  const u16 = n => [n & 0xFF, (n >>> 8) & 0xFF];
  const u32 = n => [n & 0xFF, (n >>> 8) & 0xFF, (n >>> 16) & 0xFF, (n >>> 24) & 0xFF];

  for (const { nome, conteudo } of ficheiros) {
    const nomeBytes = texto.encode(nome);
    const dados = typeof conteudo === 'string' ? texto.encode(conteudo) : conteudo;
    const crc = crc32(dados);

    const cabecalho = [
      ...u32(0x04034b50), ...u16(20), ...u16(0), ...u16(0),
      ...u16(0), ...u16(0),                       // hora e data: zero, nao interessam
      ...u32(crc), ...u32(dados.length), ...u32(dados.length),
      ...u16(nomeBytes.length), ...u16(0),
    ];
    partes.push(new Uint8Array(cabecalho), nomeBytes, dados);

    central.push(new Uint8Array([
      ...u32(0x02014b50), ...u16(20), ...u16(20), ...u16(0), ...u16(0),
      ...u16(0), ...u16(0),
      ...u32(crc), ...u32(dados.length), ...u32(dados.length),
      ...u16(nomeBytes.length), ...u16(0), ...u16(0), ...u16(0), ...u16(0),
      ...u32(0), ...u32(posicao),
    ]), nomeBytes);

    posicao += cabecalho.length + nomeBytes.length + dados.length;
  }

  const inicioCentral = posicao;
  let tamanhoCentral = 0;
  for (const p of central) tamanhoCentral += p.length;

  const fim = new Uint8Array([
    ...u32(0x06054b50), ...u16(0), ...u16(0),
    ...u16(ficheiros.length), ...u16(ficheiros.length),
    ...u32(tamanhoCentral), ...u32(inicioCentral), ...u16(0),
  ]);

  const todas = [...partes, ...central, fim];
  let total = 0;
  for (const p of todas) total += p.length;
  const saida = new Uint8Array(total);
  let i = 0;
  for (const p of todas) { saida.set(p, i); i += p.length; }
  return saida;
}

// ── XML ──────────────────────────────────────────────────────────────────────
const esc = v => String(v)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  // Caracteres de controlo partem o ficheiro sem dizer porque.
  .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, '');

function letraColuna(n) {
  let s = '';
  n += 1;
  while (n > 0) { const r = (n - 1) % 26; s = String.fromCharCode(65 + r) + s; n = Math.floor((n - 1) / 26); }
  return s;
}

// O Excel conta dias desde 30/12/1899. Guardar a data como numero, e nao como
// texto, e o que permite ao contabilista ordenar e filtrar por mes.
function serieDeData(d) {
  const ms = Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes());
  return ms / 86400000 + 25569;
}

/*
 * Uma celula pode ser:
 *   'texto'                        -> texto
 *   123                            -> numero
 *   { v: 12.5, t: 'dinheiro' }     -> numero com formato de euros
 *   { v: Date, t: 'data' }         -> data
 *   { v: 'x', t: 'titulo' }        -> cabecalho a negrito
 */
function celula(ref, valor) {
  if (valor == null || valor === '') return `<c r="${ref}"/>`;
  if (typeof valor === 'object' && !(valor instanceof Date)) {
    const { v, t } = valor;
    if (t === 'dinheiro') return `<c r="${ref}" s="3"><v>${Number(v) || 0}</v></c>`;
    if (t === 'data' && v) return `<c r="${ref}" s="2"><v>${serieDeData(new Date(v))}</v></c>`;
    if (t === 'titulo') return `<c r="${ref}" s="1" t="inlineStr"><is><t>${esc(v)}</t></is></c>`;
    if (t === 'percent') return `<c r="${ref}" s="4"><v>${(Number(v) || 0) / 100}</v></c>`;
    return celula(ref, v);
  }
  if (typeof valor === 'number' && Number.isFinite(valor)) return `<c r="${ref}"><v>${valor}</v></c>`;
  return `<c r="${ref}" t="inlineStr"><is><t>${esc(valor)}</t></is></c>`;
}

function folhaXml(linhas, larguras) {
  const cols = larguras?.length
    ? `<cols>${larguras.map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`).join('')}</cols>`
    : '';
  const corpo = linhas.map((linha, r) =>
    `<row r="${r + 1}">${(linha || []).map((v, c) => celula(letraColuna(c) + (r + 1), v)).join('')}</row>`
  ).join('');
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">${cols}<sheetData>${corpo}</sheetData></worksheet>`;
}

const ESTILOS = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
<numFmts count="2">
<numFmt numFmtId="164" formatCode="#,##0.00\\ &quot;€&quot;"/>
<numFmt numFmtId="165" formatCode="dd/mm/yyyy"/>
</numFmts>
<fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><name val="Calibri"/></font></fonts>
<fills count="2"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill></fills>
<borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders>
<cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
<cellXfs count="5">
<xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
<xf numFmtId="0" fontId="1" fillId="0" borderId="0" xfId="0" applyFont="1"/>
<xf numFmtId="165" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
<xf numFmtId="9" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/>
</cellXfs>
<cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles>
</styleSheet>`;

/*
 * folhas: [{ nome, linhas, larguras }]
 * Devolve um Blob pronto a descarregar.
 */
export function criarXlsx(folhas) {
  const n = folhas.length;
  const ficheiros = [
    { nome: '[Content_Types].xml', conteudo: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
<Default Extension="xml" ContentType="application/xml"/>
<Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
<Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
${folhas.map((_, i) => `<Override PartName="/xl/worksheets/sheet${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>`).join('\n')}
</Types>` },
    { nome: '_rels/.rels', conteudo: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>` },
    { nome: 'xl/workbook.xml', conteudo: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
<sheets>${folhas.map((f, i) => `<sheet name="${esc(f.nome).slice(0, 31)}" sheetId="${i + 1}" r:id="rId${i + 1}"/>`).join('')}</sheets>
</workbook>` },
    { nome: 'xl/_rels/workbook.xml.rels', conteudo: `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
${folhas.map((_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet${i + 1}.xml"/>`).join('\n')}
<Relationship Id="rId${n + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>` },
    { nome: 'xl/styles.xml', conteudo: ESTILOS },
    ...folhas.map((f, i) => ({ nome: `xl/worksheets/sheet${i + 1}.xml`, conteudo: folhaXml(f.linhas, f.larguras) })),
  ];

  return new Blob([zipSimples(ficheiros)], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

export function descarregarXlsx(nomeFicheiro, folhas) {
  const url = URL.createObjectURL(criarXlsx(folhas));
  const a = document.createElement('a');
  a.href = url;
  a.download = nomeFicheiro.endsWith('.xlsx') ? nomeFicheiro : nomeFicheiro + '.xlsx';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const dinheiro = v => ({ v: Number(v) || 0, t: 'dinheiro' });
export const data = v => ({ v, t: 'data' });
export const titulo = v => ({ v, t: 'titulo' });
