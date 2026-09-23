import React, { useState, useEffect, useRef } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { useStore } from '@/hooks/useStore';
import { useIsMobile } from '@/hooks/use-mobile';
import {
  Y, YD, TY, W, W2, BG, BD, T, T2, T3, G, R, O, Spin, Btn, Inp, Sel, Lbl, Card,
} from '@/components/design/ui';
import {
  DOMINIO_BASE, LIMITE_GALERIA,
  updateBusiness, uploadBusinessAsset, getBusiness,
  reduzirParaTamanho, tamanhoLegivel,
  listGallery, addGalleryPhoto, updateGalleryPhoto, deleteGalleryPhoto, moveGalleryPhoto,
} from '@/lib/designService';
import SugestaoDesign from '@/components/design/SugestaoDesign';
import { prepararLogotipo } from '@/lib/prepararLogotipo';

/*
 * O MEU SITE — a mesma pagina que o super admin usa para desenhar a app de
 * cliente de uma barbearia, agora dentro do painel da propria barbearia.
 *
 * O codigo abaixo veio tal e qual do super admin, para o aspeto e o
 * comportamento serem exatamente os mesmos. So muda de onde vem os dados:
 * em vez do superAdminService, que pode tocar em qualquer barbearia, usa o
 * designService, que so sabe trabalhar na barbearia de quem esta ligado.
 */

const FONTES=['Inter','Playfair Display','Montserrat','Poppins','DM Sans','Space Grotesk','Bebas Neue']
const CAMPOS_COR=[
  {k:'bg',       l:'Fundo',              d:'--bg · fundo principal da app'},
  {k:'surface',  l:'Cartões',            d:'--surface · caixas sobre o fundo'},
  {k:'elevated', l:'Elementos elevados', d:'--elevated · menus e modais'},
  {k:'gold',     l:'Cor de marca',       d:'--gold · botões, preços e destaques'},
  {k:'text',     l:'Texto',              d:'--text · texto principal'},
  {k:'textSec',  l:'Texto secundário',   d:'--text-sec · legendas'},
  {k:'border',   l:'Contornos',          d:'--border · linhas e separadores'},
]
const TEMA_OMISSAO={
  colors:{bg:'#0A0807',surface:'#141210',elevated:'#1C1915',gold:'#C9A227',
          text:'#EDE8DF',textSec:'#8A8272',border:'#221E18'},
  fonts:{heading:'Playfair Display',body:'Inter'},
  radius:12,
  appName:'',
  favicon:'',
  // Fundo animado da app de cliente. Desligado por omissao: e uma escolha de
  // estilo, nao um valor por defeito que se impoe a toda a gente.
  background:{ativo:false,cor:'#FFFFFF',intensidade:0.5,velocidade:1},
}
// Desligado por omissao. Estava ligado: gravar o site escrevia ativo:true
// no cartao, e uma barbearia que nunca o quis ficava com ele.
const LOYALTY_OMISSAO={ativo:false,stampsNeeded:10,validMonths:6}

// Aceita o formato antigo (em português) e devolve sempre o contrato novo.
function normalizarTema(t){
  const base=structuredClone(TEMA_OMISSAO)
  if(!t||typeof t!=='object')return base
  if(t.colors)return{...base,...t,colors:{...base.colors,...t.colors},fonts:{...base.fonts,...t.fonts},background:{...base.background,...(t.background||{})}}
  // migração do formato anterior desta aba
  const c=t.cores||{},tg=t.tipografia||{},fm=t.forma||{}
  return{...base,
    colors:{...base.colors,
      bg:t.fundo??c.fundo??base.colors.bg,
      surface:t.superficie??c.superficie??base.colors.surface,
      gold:t.primaria??c.primaria??base.colors.gold,
      text:t.texto??c.texto??base.colors.text,
      textSec:t.textoSec??c.textoSec??base.colors.textSec},
    fonts:{heading:tg.titulos??t.fonte??base.fonts.heading,
           body:tg.corpo??t.fonte??base.fonts.body},
    radius:fm.raio??t.raio??base.radius}
}

function LinhaCor({campo,valor,onChange}){
  return(
    <div style={{display:'flex',alignItems:'center',gap:13,padding:'11px 0',borderBottom:`1px solid ${BD}`}}>
      <label style={{width:36,height:36,borderRadius:9,flexShrink:0,cursor:'pointer',overflow:'hidden',
        background:valor,border:`1px solid ${BD}`,boxShadow:'inset 0 0 0 1px rgba(0,0,0,.3)'}}>
        <input type="color" value={valor} onChange={e=>onChange(e.target.value)}
          style={{opacity:0,width:'100%',height:'100%',cursor:'pointer'}}/>
      </label>
      <div style={{flex:1,minWidth:0}}>
        <div style={{fontSize:13,fontWeight:600,color:T}}>{campo.l}</div>
        <div style={{fontSize:11,color:T3,marginTop:1,fontFamily:'monospace'}}>{campo.d}</div>
      </div>
      <Inp value={valor} onChange={e=>onChange(e.target.value)}
        style={{width:100,fontFamily:'monospace',fontSize:12.5,textTransform:'uppercase'}}/>
    </div>
  )
}

function Interruptor({ligado,onChange}){
  return(
    <button onClick={()=>onChange(!ligado)} role="switch" aria-checked={ligado}
      style={{width:40,height:23,borderRadius:12,border:'none',cursor:'pointer',flexShrink:0,padding:0,
        background:ligado?Y:'rgba(255,255,255,.12)',position:'relative',transition:'background .18s'}}>
      <span style={{position:'absolute',top:3,left:ligado?20:3,width:17,height:17,borderRadius:'50%',
        background:ligado?TY:'#6E6757',transition:'left .18s'}}/>
    </button>
  )
}

// Editor de comodidades. Existe para resolver um problema real: se a lista
// ficar vazia, a app de cliente inventa "WiFi, estacionamento, cerveja grátis".
// As comodidades que quase todas as barbearias tem. Carregar e mais rapido e
// mais consistente do que escrever — e evita "Wi-fi", "WIFI" e "Wi-Fi" em
// barbearias diferentes.
const COMODIDADES_SUGERIDAS=[
  'Wi-Fi grátis','Estacionamento','Cartão multibanco','MB WAY','Café grátis',
  'Bebida de cortesia','Ar condicionado','Acesso a cadeira de rodas','TV',
  'Sala de espera','Espaço para crianças','Produtos à venda','Marcação online',
  'Perto do metro','Aceita animais',
]

function Comodidades({lista,onChange}){
  const[novo,setNovo]=useState('')
  const porUsar=COMODIDADES_SUGERIDAS.filter(c=>!lista.includes(c))
  const add=()=>{
    const v=novo.trim()
    if(!v||lista.includes(v))return setNovo('')
    onChange([...lista,v]);setNovo('')
  }
  return(
    <div>
      <div style={{display:'flex',flexWrap:'wrap',gap:7,marginBottom:lista.length?10:0}}>
        {lista.map(a=>(
          <span key={a} style={{display:'inline-flex',alignItems:'center',gap:7,padding:'5px 9px 5px 11px',
            borderRadius:20,background:`${Y}14`,border:`1px solid ${Y}30`,fontSize:12.5,color:T}}>
            {a}
            <button onClick={()=>onChange(lista.filter(x=>x!==a))}
              style={{background:'none',border:'none',color:T2,cursor:'pointer',fontSize:14,
                lineHeight:1,padding:0,fontFamily:'inherit'}}>×</button>
          </span>
        ))}
      </div>

      {porUsar.length>0&&(
        <div style={{marginBottom:10}}>
          <div style={{fontSize:11,color:T3,marginBottom:7}}>Carrega para acrescentar</div>
          <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
            {porUsar.map(c=>(
              <button key={c} type="button" onClick={()=>onChange([...lista,c])}
                style={{padding:'5px 11px',borderRadius:20,cursor:'pointer',fontFamily:'inherit',
                  background:'transparent',border:`1px dashed ${BD}`,color:T2,fontSize:12.5}}>
                + {c}
              </button>
            ))}
          </div>
        </div>
      )}
      <div style={{display:'flex',gap:8}}>
        <Inp value={novo} onChange={e=>setNovo(e.target.value)}
          onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();add()}}}
          placeholder="WiFi, estacionamento, pagamento MB Way…" style={{flex:1}}/>
        <Btn v="secondary" onClick={add} disabled={!novo.trim()}>Adicionar</Btn>
      </div>
      {lista.length===0&&(
        <div style={{fontSize:11.5,color:O,marginTop:8,lineHeight:1.5}}>
          Sem comodidades definidas, a app de cliente mostra uma lista inventada.
          Preenche, nem que seja com uma só.
        </div>
      )}
    </div>
  )
}

// ── Moldura de telemóvel ───────────────────────────────────────────────────
// O conteúdo é desenhado à largura lógica real de um telemóvel (390px) e
// depois reduzido com transform, para as proporções e os tamanhos de letra
// ficarem iguais aos do aparelho e não a uma versão encolhida à mão.
const TLM_L=390, TLM_A=844

/*
 * Largura do telemovel de exemplo quando ele e aberto por cima da pagina,
 * num telemovel de verdade. Ha duas medidas a respeitar e ganha a mais
 * apertada: a largura do ecra e a altura, porque um telemovel inteiro com
 * 844px de altura logica nao cabe num ecra baixo sem se cortar por baixo.
 */
function larguraDaPrevia(){
  if(typeof window==='undefined')return 292
  const porLargura=window.innerWidth-52
  const porAltura=Math.floor((window.innerHeight-136)*TLM_L/TLM_A)
  return Math.max(210,Math.min(300,porLargura,porAltura))
}

function Telemovel({largura=292,children}){
  // O ecra fica DENTRO da moldura (3% de cada lado). A escala tem de ser a
  // do ecra, nao a da moldura inteira — senao o site ficava 6% mais largo
  // do que o ecra e cortava-se do lado direito.
  const moldura=largura*.03
  const e=(largura-2*moldura)/TLM_L
  const agora=new Date().toLocaleTimeString('pt-PT',{hour:'2-digit',minute:'2-digit'})
  return(
    <div style={{width:largura,height:TLM_A*e+2*moldura,position:'relative',margin:'0 auto'}}>
      <div style={{position:'absolute',inset:0,borderRadius:largura*.155,background:'#101012',
        padding:moldura,boxSizing:'border-box',
        boxShadow:'0 26px 60px rgba(0,0,0,.62), 0 0 0 1px rgba(255,255,255,.09), inset 0 0 0 1px rgba(255,255,255,.05)'}}>
        <div style={{width:'100%',height:'100%',borderRadius:largura*.125,overflow:'hidden',
          position:'relative',background:'#000'}}>
          <div style={{width:TLM_L,height:TLM_A,transform:`scale(${e})`,transformOrigin:'top left',
            overflowY:'auto',overflowX:'hidden',position:'relative'}}>
            {children}
          </div>
          {/* barra de estado e ilha, por cima do conteúdo */}
          <div style={{position:'absolute',top:0,left:0,right:0,height:44*e,pointerEvents:'none',
            display:'flex',alignItems:'center',justifyContent:'space-between',
            padding:`0 ${18*e}px`,color:'#fff',fontSize:12*e,fontWeight:600,
            textShadow:'0 1px 3px rgba(0,0,0,.6)'}}>
            <span>{agora}</span>
            <span style={{display:'flex',alignItems:'center',gap:3*e}}>
              <span style={{fontSize:10*e}}>▮▮▮</span>
              <span style={{width:20*e,height:9.5*e,borderRadius:3*e,border:`${1.3*e}px solid #fff`,
                display:'inline-block',position:'relative'}}>
                <span style={{position:'absolute',inset:1.3*e,background:'#fff',borderRadius:1.5*e,width:'62%'}}/>
              </span>
            </span>
          </div>
          <div style={{position:'absolute',top:10*e,left:'50%',transform:'translateX(-50%)',
            width:104*e,height:30*e,borderRadius:99,background:'#000',pointerEvents:'none'}}/>
          <div style={{position:'absolute',bottom:7*e,left:'50%',transform:'translateX(-50%)',
            width:132*e,height:4.5*e,borderRadius:99,background:'rgba(255,255,255,.45)',pointerEvents:'none'}}/>
        </div>
      </div>
    </div>
  )
}

// ── Pré-visualização real ──────────────────────────────────────────────────
/*
 * O site da barbearia, a sério, dentro da moldura do telemóvel. Antes era um
 * desenho parecido; agora é a própria app de cliente (com ?previa=1), por isso
 * o que o barbeiro vê é exatamente o que o cliente vai ver.
 *
 * O tema e os textos ainda por gravar vão por postMessage e aplicam-se só lá
 * dentro. Quando o barbeiro toca num elemento, a app diz qual foi e aqui
 * abre-se a cor desse elemento.
 */
function PreviaReal({endereco,tema,info,logoUrl,editar,onEditar}){
  const ref=useRef(null)
  const[pronto,setPronto]=useState(false)
  const origem=`https://${endereco}`
  const editarRef=useRef(onEditar)
  editarRef.current=onEditar
  useEffect(()=>{
    const ouvir=ev=>{
      if(ev.origin!==origem)return
      const d=ev.data||{}
      if(d.tipo==='convecta-pronto')setPronto(p=>p?p+1:1)
      if(d.tipo==='convecta-editar'&&typeof d.chave==='string')editarRef.current?.(d)
    }
    window.addEventListener('message',ouvir)
    return()=>window.removeEventListener('message',ouvir)
  },[origem])
  useEffect(()=>{
    if(!pronto)return
    ref.current?.contentWindow?.postMessage({tipo:'convecta-tema',tema,info,logoUrl},origem)
  },[tema,info,logoUrl,pronto,origem])
  useEffect(()=>{
    if(!pronto)return
    ref.current?.contentWindow?.postMessage({tipo:'convecta-modo',editar},origem)
  },[editar,pronto,origem])
  return(
    <div style={{position:'relative',width:TLM_L,height:TLM_A,background:tema?.colors?.bg||'#000'}}>
      <iframe ref={ref} src={`${origem}/?previa=1`} title="O teu site, como o cliente o vê"
        style={{width:TLM_L,height:TLM_A,border:0,display:'block'}}/>
      {!pronto&&(
        <div style={{position:'absolute',inset:0,display:'grid',placeItems:'center',color:'#bbb',fontSize:15}}>
          A abrir o teu site…
        </div>
      )}
    </div>
  )
}

// O que se pode mudar ao tocar na pré-visualização. `k` vive em
// tema.elementos (só aquele elemento); `cor` é uma das cores base.
const ALVOS_EDICAO={
  botao:   {l:'Botão principal',     campos:[{k:'botao',l:'Fundo do botão',base:'gold'},{k:'botaoTexto',l:'Texto do botão',base:'#0A0804'}]},
  preco:   {l:'Preços',              campos:[{k:'preco',l:'Cor dos preços',base:'gold'}]},
  titulo:  {l:'Títulos',             campos:[{k:'titulo',l:'Cor dos títulos',base:'text'}]},
  menu:    {l:'Menu de baixo',       campos:[{k:'menu',l:'Fundo do menu',base:'#121212'},{k:'menuAtivo',l:'Página em que estás',base:'gold'}]},
  cartao:  {l:'Cartões',             campos:[{k:'cartao',l:'Fundo dos cartões',base:'surface'}]},
  estrelas:{l:'Estrelas',            campos:[{k:'estrelas',l:'Cor das estrelas',base:'gold'}]},
  link:    {l:'Links',               campos:[{k:'link',l:'Cor dos links',base:'gold'}]},
  etiqueta:{l:'Etiqueta sobre o nome',campos:[{k:'etiqueta',l:'Cor da etiqueta',base:'gold'}]},
  texto:   {l:'Texto',               campos:[{cor:'text',l:'Texto principal'},{cor:'textSec',l:'Texto secundário'}]},
  fundo:   {l:'Fundo da página',     campos:[{cor:'bg',l:'Fundo'},{cor:'surface',l:'Caixas'},{cor:'border',l:'Contornos'}]},
}

// Contraste entre duas cores (WCAG). Abaixo de 3 lê-se mal.
function contraste(a,b){
  const lum=h=>{const m=/^#?([0-9a-f]{6})$/i.exec(h||'');if(!m)return null
    const n=parseInt(m[1],16),c=[n>>16&255,n>>8&255,n&255].map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4})
    return .2126*c[0]+.7152*c[1]+.0722*c[2]}
  const x=lum(a),y=lum(b);if(x==null||y==null)return 21
  return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)
}

/*
 * Editar UMA peça do site: a que o barbeiro tocou. Texto/ícone, fundo e
 * contorno (este só se a peça tiver contorno). Guarda-se em tema.pecas pela
 * chave que a app de cliente mandou (página + lugar da peça).
 */
// A lista de cores que aparece ao carregar em «Editar». Primeiro as cores do
// próprio site (para ficar tudo a condizer), depois uma paleta pronta.
const PALETA=['#FFFFFF','#EDE8DF','#BDBDBD','#6B6B6B','#2A2622','#000000',
  '#C9A227','#F5C542','#E67E22','#E74C3C','#C2185B','#8E44AD','#2980B9','#1ABC9C','#27AE60','#795548']

function Amostras({cores,valor,onEscolher}){
  return(
    <div style={{display:'flex',flexWrap:'wrap',gap:8,padding:'4px 0 10px'}}>
      {cores.map(c=>{
        const igual=(valor||'').toLowerCase()===c.toLowerCase()
        return(
          <button key={c} type="button" onClick={()=>onEscolher(c)} aria-label={`Cor ${c}`} title={c}
            style={{width:32,height:32,borderRadius:'50%',background:c,cursor:'pointer',padding:0,flexShrink:0,
              border:igual?`3px solid ${Y}`:'1px solid rgba(255,255,255,.25)',
              boxShadow:igual?'0 0 0 2px #000 inset':'inset 0 0 0 1px rgba(0,0,0,.25)'}}/>
        )
      })}
    </div>
  )
}

/*
 * Editar UMA peça do site: a que o barbeiro tocou e depois carregou em
 * «Editar». Aparece por cima do telemóvel, com uma lista de cores para tocar.
 * Guarda-se em tema.pecas pela chave que a app de cliente mandou.
 */
function EditorDePeca({peca,tema,onMudar,onRepor,onFechar}){
  const atual=tema.pecas?.[peca.chave]||{}
  const oculto=atual.oculto===true
  const forma=peca.forma||'caixa'
  const campos=[
    {k:'cor',l:forma==='icone'?'Cor do ícone':'Cor do texto',show:forma!=='caixa'||!!peca.cor},
    {k:'fundo',l:'Fundo',show:true},
    {k:'borda',l:'Contorno',show:!!peca.borda||!!atual.borda},
  ].filter(c=>c.show)
  const[campo,setCampo]=useState(campos[0].k)
  useEffect(()=>{setCampo(campos[0].k)// eslint-disable-next-line
  },[peca.chave])
  const valor=k=>atual[k]||peca[k]||(k==='fundo'?(tema.colors.surface||'#141210'):'#FFFFFF')
  const doSite=[tema.colors.gold,tema.colors.text,tema.colors.textSec,tema.colors.bg,tema.colors.surface].filter(Boolean)
  const cores=[...new Set([...doSite,...PALETA].map(c=>c.toUpperCase()))]
  const fraco=forma!=='caixa'&&contraste(valor('cor'),atual.fundo||peca.fundo||tema.colors.bg)<3
  return(
    <div style={{background:'#16130F',border:`1px solid ${Y}66`,borderRadius:16,padding:'12px 14px',
      boxShadow:'0 -8px 40px rgba(0,0,0,.6)',maxHeight:'100%',overflowY:'auto'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
        <div style={{minWidth:0}}>
          <div style={{fontSize:10.5,color:T3,fontWeight:700,letterSpacing:'.6px'}}>
            {peca.global?'EM TODAS AS PÁGINAS':'SÓ ESTA PEÇA'}
          </div>
          <div style={{fontSize:14.5,fontWeight:700,color:T,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{peca.nome}</div>
        </div>
        <button onClick={onFechar} style={{background:Y,border:'none',color:'#111',fontWeight:700,fontSize:13,
          cursor:'pointer',padding:'7px 14px',borderRadius:99,fontFamily:'inherit',flexShrink:0}}>Feito</button>
      </div>
      {campos.length>1&&(
        <div style={{display:'flex',gap:6,margin:'12px 0 8px'}}>
          {campos.map(c=>(
            <button key={c.k} onClick={()=>setCampo(c.k)}
              style={{flex:1,padding:'8px 6px',borderRadius:9,cursor:'pointer',fontFamily:'inherit',fontSize:12.5,fontWeight:700,
                border:`1px solid ${campo===c.k?Y:BD}`,background:campo===c.k?`${Y}22`:'transparent',color:campo===c.k?Y:T2,
                display:'flex',alignItems:'center',justifyContent:'center',gap:6}}>
              <span style={{width:12,height:12,borderRadius:'50%',background:valor(c.k),border:'1px solid rgba(255,255,255,.3)'}}/>
              {c.l}
            </button>
          ))}
        </div>
      )}
      {campos.length===1&&<div style={{fontSize:12.5,color:T2,margin:'10px 0 6px',fontWeight:600}}>{campos[0].l}</div>}
      <Amostras cores={cores} valor={valor(campo)} onEscolher={v=>onMudar(peca.chave,campo,v)}/>
      <LinhaCor campo={{l:'Outra cor',d:'toca no círculo para escolher qualquer cor'}}
        valor={valor(campo)} onChange={v=>onMudar(peca.chave,campo,v)}/>
      {fraco&&<div style={{fontSize:12,color:O,marginTop:8}}>Com estas cores o texto lê-se mal.</div>}

      {/* Tirar a peça do site. Fica meio transparente aqui, para se poder
          voltar a mostrar; no site do cliente desaparece. */}
      <button onClick={()=>onMudar(peca.chave,'oculto',!oculto)}
        style={{marginTop:12,width:'100%',padding:'10px 12px',borderRadius:10,cursor:'pointer',fontFamily:'inherit',
          fontSize:13.5,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:8,
          border:`1px solid ${oculto?G:'#E74C3C88'}`,background:oculto?`${G}1A`:'rgba(231,76,60,.10)',color:oculto?G:'#F08A7E'}}>
        {oculto?'👁  Voltar a mostrar no site':'🗑  Remover do site'}
      </button>
      {oculto
        ?<div style={{fontSize:11.5,color:T3,marginTop:6,lineHeight:1.5}}>Os clientes já não veem esta peça. Aqui aparece meio transparente para a poderes voltar a mostrar.</div>
        :peca.forma!=='caixa'&&/marcar|continuar|confirmar/i.test(peca.nome||'')&&
          <div style={{fontSize:11.5,color:O,marginTop:6,lineHeight:1.5}}>Atenção: sem este botão os clientes podem não conseguir marcar.</div>}

      {Object.keys(atual).length>0&&(
        <button onClick={()=>onRepor(peca.chave)}
          style={{marginTop:10,background:'none',border:'none',color:T2,fontSize:12.5,cursor:'pointer',
            textDecoration:'underline',padding:0,fontFamily:'inherit'}}>
          Voltar ao que estava
        </button>
      )}
    </div>
  )
}

function EditorDeElemento({alvo,tema,onElemento,onCor,onRepor,onFechar}){
  // No telemovel o editor aparece por cima da moldura: traz-se para o ecra.
  const caixa=useRef(null)
  useEffect(()=>{caixa.current?.scrollIntoView?.({block:'nearest',behavior:'smooth'})},[alvo])
  const def=ALVOS_EDICAO[alvo];if(!def)return null
  const valorDe=c=>{
    if(c.cor)return tema.colors[c.cor]
    const v=tema.elementos?.[c.k];if(v)return v
    return c.base.startsWith('#')?c.base:tema.colors[c.base]
  }
  const mudou=def.campos.some(c=>c.k&&tema.elementos?.[c.k])
  const aviso=alvo==='botao'&&contraste(valorDe(def.campos[0]),valorDe(def.campos[1]))<3
  return(
    <div ref={caixa} style={{background:W2,border:`1px solid ${Y}55`,borderRadius:14,padding:'12px 14px',marginBottom:12,
      boxShadow:'0 10px 30px rgba(0,0,0,.4)'}}>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10}}>
        <div>
          <div style={{fontSize:10.5,color:T3,fontWeight:700,letterSpacing:'.6px'}}>A MUDAR</div>
          <div style={{fontSize:14.5,fontWeight:700,color:T}}>{def.l}</div>
        </div>
        <button onClick={onFechar} aria-label="Fechar"
          style={{background:'none',border:'none',color:T2,fontSize:18,cursor:'pointer',padding:4}}>✕</button>
      </div>
      {def.campos.map(c=>(
        <LinhaCor key={c.k||c.cor} campo={{l:c.l,d:c.k?'só este elemento':'cor base do site'}}
          valor={valorDe(c)} onChange={v=>c.k?onElemento(c.k,v):onCor(c.cor,v)}/>
      ))}
      {aviso&&<div style={{fontSize:12,color:O,marginTop:8}}>O texto do botão lê-se mal com esta cor de fundo.</div>}
      {mudou&&(
        <button onClick={()=>onRepor(def.campos.filter(c=>c.k).map(c=>c.k))}
          style={{marginTop:10,background:'none',border:'none',color:T2,fontSize:12.5,cursor:'pointer',
            textDecoration:'underline',padding:0,fontFamily:'inherit'}}>
          Voltar à cor base
        </button>
      )}
    </div>
  )
}

// ── Pré-visualização (desenho antigo, já não usado) ────────────────────────
function Previsualizacao({tema,info,biz,endereco}){
  const c=tema.colors,r=tema.radius
  const nome=tema.appName||biz.name||'Barbearia'
  return(
    <div style={{minHeight:'100%',background:c.bg,
      fontFamily:`'${tema.fonts.body}', system-ui, sans-serif`}}>

      <div style={{position:'relative',height:230,display:'flex',alignItems:'flex-end',padding:'16px 18px 18px',
        background:info.coverImageUrl
          ?`linear-gradient(to top, ${c.bg}F2, ${c.bg}44), url(${info.coverImageUrl}) center/cover`
          :`linear-gradient(150deg, ${c.gold}3A, ${c.surface})`}}>
        <div style={{display:'flex',alignItems:'center',gap:11}}>
          {biz.logo_url
            ?<img src={biz.logo_url} alt="" style={{height:42,width:'auto',maxWidth:130,objectFit:'contain',borderRadius:8,display:'block'}}/>
            :<div style={{width:38,height:38,borderRadius:9,background:c.gold,display:'grid',
                placeItems:'center',color:c.bg,fontWeight:800,fontSize:16}}>{nome[0].toUpperCase()}</div>}
          <div>
            <div style={{fontSize:19,fontWeight:700,color:c.text,lineHeight:1.15,
              fontFamily:`'${tema.fonts.heading}', serif`}}>{nome}</div>
            <div style={{fontSize:11.5,color:c.textSec,marginTop:2}}>
              {info.tagline||'Marcações online'}
            </div>
          </div>
        </div>
      </div>

      <div style={{padding:16}}>
        {info.description&&(
          <div style={{fontSize:12,color:c.textSec,lineHeight:1.6,marginBottom:16}}>{info.description}</div>
        )}

        <div style={{fontSize:10.5,color:c.textSec,fontWeight:700,letterSpacing:'.6px',marginBottom:9}}>SERVIÇOS</div>
        {[{n:'Corte de Cabelo',d:'30 min',p:'15,00 €'},{n:'Corte + Barba',d:'45 min',p:'22,00 €'}].map(s=>(
          <div key={s.n} style={{background:c.surface,borderRadius:r,padding:'12px 14px',marginBottom:9,
            border:`1px solid ${c.border}`,display:'flex',alignItems:'center',gap:10}}>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:600,color:c.text}}>{s.n}</div>
              <div style={{fontSize:11,color:c.textSec,marginTop:2}}>{s.d}</div>
            </div>
            <div style={{fontSize:13,fontWeight:700,color:c.gold}}>{s.p}</div>
          </div>
        ))}

        {info.amenities.length>0&&(
          <div style={{marginTop:16}}>
            <div style={{fontSize:10.5,color:c.textSec,fontWeight:700,letterSpacing:'.6px',marginBottom:9}}>COMODIDADES</div>
            <div style={{display:'flex',flexWrap:'wrap',gap:6}}>
              {info.amenities.map(a=>(
                <span key={a} style={{fontSize:11,color:c.textSec,background:c.elevated,
                  border:`1px solid ${c.border}`,borderRadius:r*.6,padding:'4px 9px'}}>{a}</span>
              ))}
            </div>
          </div>
        )}

        <div style={{marginTop:16,background:c.elevated,borderRadius:r,padding:'13px 15px',
          border:`1px solid ${c.border}`}}>
          <div style={{fontSize:11.5,color:c.text,fontWeight:600,marginBottom:8}}>
            Cartão de fidelidade
          </div>
          <div style={{display:'flex',gap:4,flexWrap:'wrap'}}>
            {Array.from({length:Math.min(info.loyalty.stampsNeeded,12)},(_,i)=>(
              <span key={i} style={{width:15,height:15,borderRadius:'50%',
                border:`1.5px solid ${i<3?c.gold:c.border}`,background:i<3?c.gold:'transparent'}}/>
            ))}
          </div>
          <div style={{fontSize:10.5,color:c.textSec,marginTop:7}}>
            3 de {info.loyalty.stampsNeeded} · válido {info.loyalty.validMonths} meses
          </div>
        </div>

        <button style={{width:'100%',marginTop:16,padding:13,borderRadius:r,border:'none',
          background:c.gold,color:c.bg,fontSize:14,fontWeight:700,cursor:'default',
          fontFamily:'inherit'}}>Marcar agora</button>
        <div style={{textAlign:'center',fontSize:10.5,color:c.textSec,marginTop:11}}>{endereco}</div>
      </div>
    </div>
  )
}

// ── Aba Design ─────────────────────────────────────────────────────────────
const PAINEIS=[{id:'sugestao',l:'Sugestão'},{id:'cores',l:'Cores'},{id:'fundo',l:'Fundo'},{id:'tipo',l:'Tipografia'},
               {id:'info',l:'Conteúdo'},{id:'galeria',l:'Galeria'},{id:'marca',l:'Marca'}]


// Pre-visualizacao do fundo animado. Repete o desenho do convecta-client em
// pequeno, para se escolher a cor a olhar para o efeito e nao para um quadrado.
// Se mexeres no desenho la, mexe aqui — sao dois sitios, nao ha volta a dar
// sem partilhar codigo entre dois repositorios.
function PreviaFundo({cor,fundo,intensidade,velocidade}){
  const ref=useRef(null)
  useEffect(()=>{
    const cv=ref.current; if(!cv) return
    const ctx=cv.getContext('2d'); if(!ctx) return
    const h=String(cor||'').replace('#',''); const full=h.length===3?h.split('').map(c=>c+c).join(''):h
    const n=/^[0-9a-f]{6}$/i.test(full)?parseInt(full,16):0xFFFFFF
    const r=(n>>16)&255,g=(n>>8)&255,b=n&255
    let raf=0
    const dpr=Math.min(window.devicePixelRatio||1,2)
    const W=cv.clientWidth,H=cv.clientHeight
    cv.width=Math.round(W*dpr); cv.height=Math.round(H*dpr)
    ctx.setTransform(dpr,0,0,dpr,0,0)
    const desenhar=(ms)=>{
      const t=ms/1000*velocidade
      ctx.globalCompositeOperation='source-over'
      ctx.fillStyle=fundo||'#0A0807'; ctx.fillRect(0,0,W,H)
      ctx.globalCompositeOperation='lighter'; ctx.lineCap='round'
      for(let i=0;i<9;i++){
        const k=i/8
        const base=H*(0.06+k*0.9)
        const a1=H*(0.05+0.05*Math.sin(i*2.1)),a2=H*0.025
        const f1=(1.1+0.35*Math.sin(i*1.7))/W*Math.PI*2, f2=2.7/W*Math.PI*2
        ctx.beginPath()
        for(let x=-14;x<=W+14;x+=8){
          const y=base+a1*Math.sin(x*f1+t*(0.16+i*0.017)*Math.PI*2+i*1.3)
                     +a2*Math.sin(x*f2-t*(0.09+i*0.011)*Math.PI*2+i*0.7)
          if(x<=0)ctx.moveTo(x,y); else ctx.lineTo(x,y)
        }
        const c=((t*(0.055+i*0.006)+i*0.11)%1.4)-0.2
        const gd=ctx.createLinearGradient(0,0,W,0)
        const cl=(al)=>`rgba(${r},${g},${b},${al})`
        const p=(x)=>Math.min(1,Math.max(0,x))
        const fr=0.22*intensidade, ft=0.95*intensidade
        gd.addColorStop(0,cl(fr)); gd.addColorStop(p(c-0.3),cl(fr))
        gd.addColorStop(p(c),cl(ft))
        gd.addColorStop(p(c+0.3),cl(fr)); gd.addColorStop(1,cl(fr))
        ctx.strokeStyle=gd
        ctx.globalAlpha=0.16; ctx.lineWidth=14; ctx.stroke()
        ctx.globalAlpha=1; ctx.lineWidth=1; ctx.stroke()
      }
      raf=requestAnimationFrame(desenhar)
    }
    raf=requestAnimationFrame(desenhar)
    return()=>cancelAnimationFrame(raf)
  },[cor,fundo,intensidade,velocidade])
  return(
    <div style={{marginTop:16}}>
      <Lbl>Pré-visualização</Lbl>
      <canvas ref={ref} style={{width:'100%',height:170,borderRadius:10,
        border:`1px solid ${BD}`,display:'block'}}/>
    </div>
  )
}

function DesignTab({biz,onGuardado}){
  // Esta pagina nasceu no super admin, que se usa num computador. Aqui e o
  // barbeiro que a abre, e o barbeiro tem o telemovel na mao.
  const telemovel=useIsMobile()
  // No telemovel a pre-visualizacao abre-se por cima, a pedido.
  const[previaAberta,setPreviaAberta]=useState(false)
  const[larguraPrevia,setLarguraPrevia]=useState(()=>larguraDaPrevia())
  const[painel,setPainel]=useState('cores')
  const[tema,setTema]=useState(()=>structuredClone(TEMA_OMISSAO))
  const[info,setInfo]=useState({tagline:'',description:'',coverImageUrl:'',
    amenities:[],social:{instagram:'',facebook:'',tiktok:''},loyalty:{...LOYALTY_OMISSAO}})
  const[settingsAtuais,setSettingsAtuais]=useState(null)
  const[carregando,setCarregando]=useState(true),[guardando,setGuardando]=useState(false)
  const[erro,setErro]=useState(''),[sucesso,setSucesso]=useState(false)
  const[copiado,setCopiado]=useState(false),[aEnviar,setAEnviar]=useState(false)

  // O listBusinesses não traz a coluna `settings`, e é lá que vivem os horários
  // e os contactos. Buscamos o registo completo para fundir em vez de esmagar.
  useEffect(()=>{
    let vivo=true
    getBusiness(biz.id)
      .then(b=>{
        if(!vivo)return
        const s=b?.settings||{}
        setSettingsAtuais(s)
        setTema(normalizarTema(s.theme))
        setInfo({
          tagline:s.tagline||'', description:s.description||'',
          coverImageUrl:s.coverImageUrl||'',
          amenities:Array.isArray(s.amenities)?s.amenities:[],
          social:{instagram:'',facebook:'',tiktok:'',...(s.social||{})},
          loyalty:{...LOYALTY_OMISSAO,...(s.loyalty||{})},
        })
      })
      .catch(e=>setErro('Não foi possível carregar: '+e.message))
      .finally(()=>{if(vivo)setCarregando(false)})
    return()=>{vivo=false}
  },[biz.id])

  useEffect(()=>{
    for(const f of new Set([tema.fonts.heading,tema.fonts.body])){
      const id='fonte-'+f.replace(/\s/g,'')
      if(document.getElementById(id))continue
      const l=document.createElement('link');l.id=id;l.rel='stylesheet'
      l.href=`https://fonts.googleapis.com/css2?family=${f.replace(/\s/g,'+')}:wght@400;500;600;700;800&display=swap`
      document.head.appendChild(l)
    }
  },[tema.fonts.heading,tema.fonts.body])

  const guardadoTema=settingsAtuais?normalizarTema(settingsAtuais.theme):null
  const guardadoInfo=settingsAtuais?{
    tagline:settingsAtuais.tagline||'', description:settingsAtuais.description||'',
    coverImageUrl:settingsAtuais.coverImageUrl||'',
    amenities:Array.isArray(settingsAtuais.amenities)?settingsAtuais.amenities:[],
    social:{instagram:'',facebook:'',tiktok:'',...(settingsAtuais.social||{})},
    loyalty:{...LOYALTY_OMISSAO,...(settingsAtuais.loyalty||{})},
  }:null
  const [iconeAEnviar,setIconeAEnviar]=useState(false)
  // O que se diz depois de encolher uma foto grande. Sem isto, a pessoa
  // larga um ficheiro de 4 MB e não percebe porque é que ficou nítido na
  // mesma — nem que o trabalho foi feito.
  const [iconeEncolhido,setIconeEncolhido]=useState('')
  // O logotipo (na forma dele) vive na coluna businesses.logo_url; o icone
  // quadrado vive em settings.theme.favicon. Os dois saem do mesmo ficheiro.
  const [logoUrl,setLogoUrl]=useState(biz.logo_url||'')
  const [logoGravado,setLogoGravado]=useState(biz.logo_url||'')
  const [logoOriginal,setLogoOriginal]=useState(null)
  const bizVisto={...biz,logo_url:logoUrl}
  const alterado=guardadoTema&&(JSON.stringify(tema)!==JSON.stringify(guardadoTema)
    ||JSON.stringify(info)!==JSON.stringify(guardadoInfo)||logoUrl!==logoGravado)
  const endereco=biz.domain||`${biz.slug||'barbearia'}.${DOMINIO_BASE}`

  // Rodar o telemovel com a pre-visualizacao aberta muda o que cabe no ecra.
  useEffect(()=>{
    if(!telemovel)return
    const medir=()=>setLarguraPrevia(larguraDaPrevia())
    medir()
    window.addEventListener('resize',medir)
    window.addEventListener('orientationchange',medir)
    return()=>{window.removeEventListener('resize',medir);window.removeEventListener('orientationchange',medir)}
  },[telemovel])

  // Com a folha aberta, a pagina por baixo nao se mexe — senao ao arrastar o
  // dedo dentro do telemovel de exemplo arrastava-se tambem o formulario.
  useEffect(()=>{
    if(!previaAberta)return
    const antes=document.body.style.overflow
    document.body.style.overflow='hidden'
    const aoTeclar=e=>{if(e.key==='Escape')setPreviaAberta(false)}
    window.addEventListener('keydown',aoTeclar)
    return()=>{document.body.style.overflow=antes;window.removeEventListener('keydown',aoTeclar)}
  },[previaAberta])

  const cor=(k,v)=>{setTema(t=>({...t,colors:{...t.colors,[k]:v}}));setSucesso(false)}
  // Cores de um elemento só (tocar na pré-visualização).
  const[alvoEdicao,setAlvoEdicao]=useState(null)
  const[tocarParaMudar,setTocarParaMudar]=useState(true)
  const elemento=(k,v)=>{setTema(t=>({...t,elementos:{...(t.elementos||{}),[k]:v}}));setSucesso(false)}
  const mudarPeca=(chave,k,v)=>{setTema(t=>({...t,pecas:{...(t.pecas||{}),[chave]:{...((t.pecas||{})[chave]||{}),[k]:v}}}));setSucesso(false)}
  const reporPeca=chave=>{setTema(t=>{const p={...(t.pecas||{})};delete p[chave];return{...t,pecas:p}});setSucesso(false)}
  const reporElementos=ks=>{setTema(t=>{const e={...(t.elementos||{})};ks.forEach(k=>delete e[k]);return{...t,elementos:e}});setSucesso(false)}
  const fundo=(patch)=>{setTema(t=>({...t,background:{...t.background,...patch}}));setSucesso(false)}
  const fonte=(k,v)=>{setTema(t=>({...t,fonts:{...t.fonts,[k]:v}}));setSucesso(false)}
  const raiz=(k,v)=>{setTema(t=>({...t,[k]:v}));setSucesso(false)}
  const inf=(k,v)=>{setInfo(i=>({...i,[k]:v}));setSucesso(false)}

  /*
   * A capa tinha o mesmo defeito do ícone: recusava acima de 4 MB, e uma
   * fotografia de telemóvel passa isso à vontade. Pior — o upload já
   * encolhia a imagem lá dentro, por isso a recusa acontecia por causa de
   * um tamanho que nunca chegaria a ser enviado.
   */
  async function enviarCapa(ficheiros){
    const original=Array.isArray(ficheiros)?ficheiros[0]:ficheiros?.target?.files?.[0]; if(!original)return
    setAEnviar(true);setErro('')
    try{
      const file=await reduzirParaTamanho(original,4*1024*1024)
      inf('coverImageUrl',await uploadBusinessAsset(biz.id,file,'capa')) }
    catch(err){setErro('Upload falhou: '+err.message+(/bucket|not found/i.test(err.message)?' — falta correr o STORAGE_SETUP.sql.':''))}
    finally{setAEnviar(false)}
  }

  /*
   * O ícone.
   *
   * Recusava tudo acima de 1 MB — e a fotografia que um barbeiro tira ao
   * logótipo com o telemóvel tem quatro ou cinco. A pessoa ficava com uma
   * mensagem a dizer o que estava mal e nenhuma forma de o resolver sem ir
   * procurar um site de comprimir imagens. A maior parte não vai: desiste
   * do ícone.
   *
   * Agora encolhe-se. E diz-se o que aconteceu, porque um trabalho feito em
   * silêncio parece um trabalho não feito.
   */
  /*
   * O barbeiro larga o logotipo como o tem — foto do cartao, print, PNG com
   * margens. O prepararLogotipo le a imagem, corta as margens, limpa o fundo
   * e devolve dois ficheiros: o logotipo na forma dele (para o topo da app)
   * e o icone quadrado (para o ecra do telemovel). «Usar como está» envia a
   * imagem sem mexer, para quando a leitura nao acerta.
   */
  async function enviarIcone(ficheiros,semAjuste=false){
    const original=Array.isArray(ficheiros)?ficheiros[0]:ficheiros?.target?.files?.[0]; if(!original)return
    setIconeAEnviar(true);setErro('');setIconeEncolhido('')
    try{
      let logo=original,icone=original,ajustes=[],pequeno=false
      if(!semAjuste)({logo,icone,ajustes,pequeno}=await prepararLogotipo(original))
      logo=await reduzirParaTamanho(logo,1024*1024)
      icone=await reduzirParaTamanho(icone,1024*1024)
      const [urlLogo,urlIcone]=await Promise.all([
        uploadBusinessAsset(biz.id,logo,'logotipo'),
        uploadBusinessAsset(biz.id,icone,'icone'),
      ])
      setLogoUrl(urlLogo);raiz('favicon',urlIcone);setLogoOriginal(original)
      const frases=semAjuste?['Ficou a imagem tal como a enviaste.']:(ajustes.length?ajustes:['O teu logótipo já estava perfeito — não foi preciso mexer.'])
      if(pequeno)frases.push('O logótipo tem pouca resolução e pode ficar um pouco desfocado. Se tiveres uma versão maior, usa essa.')
      setIconeEncolhido(frases.join(' '))
    }
    catch(err){setErro('Upload falhou: '+err.message+(/bucket|not found/i.test(err.message)?' — falta correr o STORAGE_SETUP.sql.':''))}
    finally{setIconeAEnviar(false)}
  }

  async function guardar(){
    setGuardando(true);setErro('');setSucesso(false)
    try{
      await updateBusiness(biz.id,{...(logoUrl!==logoGravado?{logo_url:logoUrl}:{}),settings:{...(settingsAtuais||{}),
        theme:tema, tagline:info.tagline, description:info.description,
        coverImageUrl:info.coverImageUrl, amenities:info.amenities,
        social:info.social, loyalty:info.loyalty}})
      setSettingsAtuais(s=>({...(s||{}),theme:tema,...info}))
      setLogoGravado(logoUrl)
      setSucesso(true);onGuardado?.()
    }catch(e){setErro('Não foi possível guardar: '+e.message)}
    finally{setGuardando(false)}
  }

  function copiar(){
    navigator.clipboard?.writeText('https://'+endereco)
      .then(()=>{setCopiado(true);setTimeout(()=>setCopiado(false),1800)}).catch(()=>{})
  }

  if(carregando)return<div style={{display:'flex',justifyContent:'center',padding:70}}><Spin size={30}/></div>

  return(
    // No computador: os controlos a esquerda, o telemovel fixo a direita.
    // No telemovel: uma coluna so — aquela segunda coluna de 360px fixos era
    // o que fazia a pagina sair do ecra para o lado.
    <div style={telemovel
      ?{display:'flex',flexDirection:'column',gap:22}
      :{display:'grid',gridTemplateColumns:'minmax(0,1fr) 360px',gap:22,alignItems:'start'}}>
      <div style={{display:'flex',flexDirection:'column',gap:18,minWidth:0}}>

        <Card style={{padding:'18px 20px'}}>
          <div style={{fontSize:12.5,color:T2,fontWeight:600,marginBottom:10}}>Link para dar ao cliente</div>
          <div style={{display:'flex',gap:10,alignItems:'center'}}>
            <div style={{flex:1,padding:'10px 13px',borderRadius:10,background:W2,border:`1px solid ${BD}`,
              fontFamily:'monospace',fontSize:12.5,color:Y,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
              https://{endereco}
            </div>
            <Btn v="secondary" onClick={copiar} style={{flexShrink:0}}>{copiado?'Copiado':'Copiar'}</Btn>
          </div>
        </Card>

        {/* Sete separadores lado a lado num telemovel davam 45px cada: os
            nomes partiam-se ao meio. Em duas linhas de quatro leem-se. */}
        <div className="sa-tira" style={telemovel
          ?{display:'grid',gridTemplateColumns:'repeat(4,minmax(0,1fr))',gap:4,padding:4,borderRadius:12,background:W2,border:`1px solid ${BD}`}
          :{display:'flex',gap:3,padding:4,borderRadius:12,background:W2,border:`1px solid ${BD}`}}>
          {PAINEIS.map(pn=>(
            <button key={pn.id} onClick={()=>setPainel(pn.id)}
              style={{flex:telemovel?undefined:1,padding:telemovel?'10px 4px':'9px 6px',
                borderRadius:9,border:'none',cursor:'pointer',fontFamily:'inherit',
                fontSize:12.5,fontWeight:painel===pn.id?700:600,
                background:painel===pn.id?`linear-gradient(100deg,${YD}33,${Y}18)`:'transparent',
                color:painel===pn.id?Y:T2,transition:'background .15s,color .15s'}}>{pn.l}</button>
          ))}
        </div>

        {painel==='sugestao'&&(
          <SugestaoDesign biz={bizVisto} logo={logoUrl||tema.favicon} endereco={endereco}
            irParaMarca={()=>setPainel('marca')}
            onExperimentar={p=>{setTema(t=>({...t,colors:{...t.colors,...p.colors},fonts:{...t.fonts,...p.fonts},radius:p.radius}));setSucesso(false)}}/>
        )}

        {painel==='cores'&&(
          <Card>
            <div style={{fontWeight:700,fontSize:15,color:T,marginBottom:4}}>Cores</div>
            <div style={{fontSize:12.5,color:T2,marginBottom:6}}>
              Cada uma corresponde a uma variável CSS da app de cliente.
            </div>
            {CAMPOS_COR.map(c=><LinhaCor key={c.k} campo={c} valor={tema.colors[c.k]} onChange={v=>cor(c.k,v)}/>)}
          </Card>
        )}

        {painel==='fundo'&&(
          <Card>
            <div style={{fontWeight:700,fontSize:15,color:T,marginBottom:4}}>Fundo animado</div>
            <div style={{fontSize:12.5,color:T2,marginBottom:14,lineHeight:1.55}}>
              Linhas de luz a atravessar o ecrã por trás de todo o site do cliente.
              Fica bem em fundos escuros; num fundo claro não se vê.
            </div>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',
              padding:'12px 0',borderBottom:`1px solid ${BD}`}}>
              <div>
                <div style={{fontSize:13,fontWeight:600,color:T}}>Ligado</div>
                <div style={{fontSize:11,color:T3,marginTop:1}}>Desligado, o fundo fica liso.</div>
              </div>
              <Interruptor ligado={tema.background.ativo}
                onChange={v=>fundo({ativo:v})}/>
            </div>

            {tema.background.ativo&&<>
              <LinhaCor campo={{l:'Cor das linhas',d:'branco é o do exemplo'}}
                valor={tema.background.cor} onChange={v=>fundo({cor:v})}/>

              <div style={{padding:'14px 0',borderBottom:`1px solid ${BD}`}}>
                <Lbl>Intensidade — {Math.round(tema.background.intensidade*100)}%</Lbl>
                <input type="range" min="5" max="100" step="5"
                  value={Math.round(tema.background.intensidade*100)}
                  onChange={e=>fundo({intensidade:Number(e.target.value)/100})}
                  style={{width:'100%',accentColor:Y}}/>
                <div style={{fontSize:11,color:T3,marginTop:4}}>
                  Quanto brilham. Alto demais rouba atenção ao conteúdo.
                </div>
              </div>

              <div style={{padding:'14px 0'}}>
                <Lbl>Velocidade — {tema.background.velocidade.toFixed(1)}×</Lbl>
                <input type="range" min="2" max="30" step="1"
                  value={Math.round(tema.background.velocidade*10)}
                  onChange={e=>fundo({velocidade:Number(e.target.value)/10})}
                  style={{width:'100%',accentColor:Y}}/>
                <div style={{fontSize:11,color:T3,marginTop:4}}>
                  Devagar lê-se como tecido; depressa lê-se como ecrã de protecção.
                </div>
              </div>

              <PreviaFundo cor={tema.background.cor} fundo={tema.colors.bg}
                intensidade={tema.background.intensidade} velocidade={tema.background.velocidade}/>
            </>}
          </Card>
        )}

        {painel==='tipo'&&(
          <Card>
            <div style={{fontWeight:700,fontSize:15,color:T,marginBottom:16}}>Tipografia e forma</div>
            <div style={{display:'grid',gridTemplateColumns:telemovel?'1fr':'1fr 1fr',gap:16,marginBottom:18}}>
              <div>
                <Lbl>Títulos — --font-head</Lbl>
                <Sel value={tema.fonts.heading} onChange={e=>fonte('heading',e.target.value)}>
                  {FONTES.map(f=><option key={f} value={f} style={{background:W2}}>{f}</option>)}
                </Sel>
              </div>
              <div>
                <Lbl>Corpo — --font-body</Lbl>
                <Sel value={tema.fonts.body} onChange={e=>fonte('body',e.target.value)}>
                  {FONTES.map(f=><option key={f} value={f} style={{background:W2}}>{f}</option>)}
                </Sel>
              </div>
            </div>
            <Lbl>Arredondamento dos cantos — {tema.radius}px</Lbl>
            <input type="range" min="0" max="28" value={tema.radius}
              onChange={e=>raiz('radius',Number(e.target.value))}
              style={{width:'100%',accentColor:Y,cursor:'pointer',marginTop:8}}/>
          </Card>
        )}

        {painel==='info'&&(
          <Card>
            <div style={{fontWeight:700,fontSize:15,color:T,marginBottom:16}}>Conteúdo</div>
            <div style={{display:'flex',flexDirection:'column',gap:15}}>
              <div>
                <Lbl>Slogan</Lbl>
                <Inp value={info.tagline} onChange={e=>inf('tagline',e.target.value)}
                  placeholder="Tradição e precisão desde 1998"/>
              </div>
              <div>
                <Lbl>Descrição</Lbl>
                <textarea value={info.description} onChange={e=>inf('description',e.target.value)}
                  placeholder="Uma barbearia com atenção ao detalhe, no coração da cidade."
                  style={{width:'100%',padding:10,borderRadius:8,border:`1px solid ${BD}`,
                    background:'rgba(255,255,255,.04)',color:T,fontSize:13,fontFamily:'inherit',
                    resize:'vertical',minHeight:70,outline:'none'}}/>
              </div>
              <div>
                <Lbl>Imagem de capa</Lbl>
                <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
                  <Largar onFicheiros={enviarCapa} aEnviar={aEnviar} titulo="Larga aqui"
                    style={{flex:1,display:'flex',alignItems:'center',gap:12,padding:8}}>
                    <div style={{width:82,height:52,borderRadius:9,flexShrink:0,border:`1px solid ${BD}`,
                      background:info.coverImageUrl?`url(${info.coverImageUrl}) center/cover`:W2,
                      display:'grid',placeItems:'center',fontSize:10.5,color:T3}}>
                      {!info.coverImageUrl&&(aEnviar?<Spin size={14}/>:'sem imagem')}
                    </div>
                    <div style={{fontSize:12.5,color:T2,lineHeight:1.5}}>
                      {aEnviar?'A enviar…':<>Larga a imagem aqui<br/><span style={{color:T3,fontSize:11.5}}>ou carrega para escolher</span></>}
                    </div>
                  </Largar>
                  {info.coverImageUrl&&(
                    <Btn v="ghost" style={{fontSize:12}} onClick={()=>inf('coverImageUrl','')}>Remover</Btn>
                  )}
                </div>
              </div>
              <div>
                <Lbl>Comodidades</Lbl>
                <Comodidades lista={info.amenities} onChange={v=>inf('amenities',v)}/>
              </div>
              <div style={{paddingTop:12,borderTop:`1px solid ${BD}`}}>
                <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:10}}>
                  <Lbl>Cartão de fidelidade</Lbl>
                  <label style={{display:'flex',alignItems:'center',gap:8,cursor:'pointer',userSelect:'none'}}>
                    <input type="checkbox" checked={info.loyalty.ativo===true}
                      onChange={e=>inf('loyalty',{...info.loyalty,ativo:e.target.checked})}
                      style={{width:16,height:16,accentColor:YD,cursor:'pointer'}}/>
                    <span style={{fontSize:12.5,color:T2}}>Mostrar no site</span>
                  </label>
                </div>
                {info.loyalty.ativo!==true&&(
                  <div style={{fontSize:11.5,color:T3,marginBottom:10,lineHeight:1.5}}>
                    Desligado, o cartão não aparece em lado nenhum do site do cliente.
                    Os carimbos já dados ficam guardados.
                  </div>
                )}
                <div style={{display:'grid',gridTemplateColumns:telemovel?'1fr':'1fr 1fr',gap:14,
                  opacity:info.loyalty.ativo!==true?.4:1,pointerEvents:info.loyalty.ativo!==true?'none':'auto'}}>
                  <div>
                    <div style={{fontSize:11.5,color:T3,marginBottom:5}}>Cortes necessários</div>
                    <Inp type="number" min="1" max="30" value={info.loyalty.stampsNeeded}
                      onChange={e=>inf('loyalty',{...info.loyalty,stampsNeeded:Number(e.target.value)||1})}/>
                  </div>
                  <div>
                    <div style={{fontSize:11.5,color:T3,marginBottom:5}}>Validade (meses)</div>
                    <Inp type="number" min="1" max="36" value={info.loyalty.validMonths}
                      onChange={e=>inf('loyalty',{...info.loyalty,validMonths:Number(e.target.value)||1})}/>
                  </div>
                </div>
              </div>
              <div style={{display:'grid',gridTemplateColumns:telemovel?'1fr':'1fr 1fr 1fr',gap:12,paddingTop:12,borderTop:`1px solid ${BD}`}}>
                {['instagram','facebook','tiktok'].map(r=>(
                  <div key={r}>
                    <Lbl>{r[0].toUpperCase()+r.slice(1)}</Lbl>
                    <Inp value={info.social[r]||''} onChange={e=>inf('social',{...info.social,[r]:e.target.value})}
                      placeholder="@utilizador"/>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}

        {painel==='galeria'&&<PainelGaleria biz={biz}/>}

        {painel==='marca'&&(
          <Card>
            <div style={{fontWeight:700,fontSize:15,color:T,marginBottom:16}}>Marca</div>
            <div style={{display:'flex',flexDirection:'column',gap:15}}>
              <div>
                <Lbl>Nome no separador do browser</Lbl>
                <Inp value={tema.appName} onChange={e=>raiz('appName',e.target.value)}
                  placeholder={biz.name||'Nome da barbearia'}/>
                <div style={{fontSize:11.5,color:T3,marginTop:6,lineHeight:1.5}}>
                  Substitui o “Convecta Barbershop” fixo no index.html e no manifest.
                  Deixa vazio para usar o nome da barbearia.
                </div>
              </div>
              <div>
                <Lbl>Logótipo</Lbl>
                <div style={{display:'flex',gap:12,alignItems:'flex-start',flexWrap:'wrap'}}>
                  <Largar onFicheiros={f=>enviarIcone(f)} aEnviar={iconeAEnviar} titulo="Larga"
                    style={{minWidth:64,height:64,maxWidth:170,flexShrink:0,overflow:'hidden',background:BG,
                      display:'flex',alignItems:'center',justifyContent:'center',padding:4}}>
                    {iconeAEnviar
                      ?<Spin size={16}/>
                      :(logoUrl||tema.favicon)
                        ?<img src={logoUrl||tema.favicon} alt="" style={{height:'100%',width:'auto',maxWidth:160,objectFit:'contain',borderRadius:6}}/>
                        :<span style={{fontSize:10,color:T3}}>sem logótipo</span>}
                  </Largar>
                  {tema.favicon&&!iconeAEnviar&&(
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',gap:3}}>
                      <img src={tema.favicon} alt="" style={{width:44,height:44,borderRadius:10,objectFit:'cover',border:`1px solid ${BD}`}}/>
                      <span style={{fontSize:10,color:T3}}>ícone</span>
                    </div>
                  )}
                  <div style={{flex:1,minWidth:180}}>
                    <div style={{fontSize:11.5,color:T3,lineHeight:1.5}}>
                      Larga aqui o teu logótipo como o tiveres — ficheiro, print ou fotografia.
                      Nós lemos a imagem, cortamos as margens, limpamos o fundo e deixamos o
                      logótipo na forma dele para o topo da app. O ícone do telemóvel sai
                      daqui também, esse em quadrado.
                    </div>
                    {iconeEncolhido&&
                      <div style={{marginTop:10,padding:'9px 11px',borderRadius:9,lineHeight:1.5,
                        background:`${G}12`,border:`1px solid ${G}35`,fontSize:11.5,color:T2}}>
                        {iconeEncolhido}
                      </div>}
                    <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:10}}>
                      {logoOriginal&&!iconeAEnviar&&
                        <Btn v="ghost" style={{padding:'7px 10px',fontSize:12}}
                          onClick={()=>enviarIcone([logoOriginal],true)}>Usar a imagem como está</Btn>}
                      {(logoUrl||tema.favicon)&&
                        <Btn v="secondary" style={{padding:'7px 12px',fontSize:12}}
                          onClick={()=>setPainel('sugestao')}>Ver design de acordo com este logótipo</Btn>}
                    </div>
                  </div>
                </div>
              </div>
              <div style={{padding:'12px 14px',borderRadius:10,background:`${O}0C`,border:`1px solid ${O}30`,
                fontSize:12,color:T2,lineHeight:1.6}}>
                As chaves gravadas aqui são exatamente as que a app de cliente vai ler
                (<b style={{color:T,fontFamily:'monospace'}}>--bg</b>,
                <b style={{color:T,fontFamily:'monospace'}}> --gold</b>,
                <b style={{color:T,fontFamily:'monospace'}}> --font-head</b>…).
                O <b style={{color:T}}>applyTheme</b> da app de cliente lê-as no arranque; basta recarregar o site depois de gravar.
              </div>
            </div>
          </Card>
        )}

        {erro&&(
          <div style={{padding:'12px 16px',borderRadius:10,background:`${R}12`,border:`1px solid ${R}38`,
            color:R,fontSize:13,lineHeight:1.5}}>{erro}</div>
        )}

        <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
          <Btn onClick={guardar} disabled={guardando||!alterado}
            style={{display:'flex',alignItems:'center',gap:8,padding:'11px 20px'}}>
            {guardando?<><Spin/>A guardar…</>:'Guardar design'}
          </Btn>
          <Btn v="secondary" onClick={()=>{setTema(structuredClone(TEMA_OMISSAO));setSucesso(false)}}>Repor cores</Btn>
          {alterado&&(
            <Btn v="ghost" onClick={()=>{setTema(guardadoTema);setInfo(guardadoInfo);setLogoUrl(logoGravado);setSucesso(false)}}>
              Descartar alterações
            </Btn>
          )}
          {sucesso&&<span style={{fontSize:13,color:G,fontWeight:600}}>Guardado.</span>}
          {alterado&&!sucesso&&<span style={{fontSize:12.5,color:T3}}>Alterações por guardar</span>}
        </div>

      </div>

      {/* A pre-visualizacao e o site verdadeiro. No computador vive ao lado,
          fixa; no telemovel fica por baixo do formulario. Tocar num elemento
          abre a cor dele por cima do telemovel. */}
      <div style={telemovel?{marginTop:26}:{position:'sticky',top:20}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:10,marginBottom:10}}>
          <div style={{fontSize:11,color:T3,fontWeight:700,letterSpacing:'.6px'}}>
            O TEU SITE{alterado?' · COM O QUE AINDA NÃO GRAVASTE':''}
          </div>
          <label style={{display:'flex',alignItems:'center',gap:8,fontSize:12,color:T2,cursor:'pointer'}}>
            Tocar para mudar
            <Interruptor ligado={tocarParaMudar} onChange={v=>{setTocarParaMudar(v);if(!v)setAlvoEdicao(null)}}/>
          </label>
        </div>

        {!alvoEdicao&&tocarParaMudar&&(
          <div style={{fontSize:12,color:T2,marginBottom:10,lineHeight:1.5}}>
            Toca numa peça do site — um título, um texto, um botão, um ícone — e depois em «Editar» para mudar a cor só dessa peça.
          </div>
        )}
        <div style={{display:'flex',justifyContent:'center',position:'relative'}}>
          <Telemovel largura={telemovel?larguraPrevia:292}>
            <PreviaReal endereco={endereco} tema={tema} info={info} logoUrl={logoUrl}
              editar={tocarParaMudar} onEditar={setAlvoEdicao}/>
          </Telemovel>
          {/* As cores abrem por cima do telemovel, onde o barbeiro esta a olhar. */}
          {alvoEdicao&&(
            <div style={{position:'absolute',left:'50%',transform:'translateX(-50%)',bottom:8,
              width:telemovel?'min(100%, 380px)':340,maxHeight:'70%',display:'flex',zIndex:5}}>
              <div style={{width:'100%'}}>
                <EditorDePeca peca={alvoEdicao} tema={tema} onMudar={mudarPeca}
                  onRepor={reporPeca} onFechar={()=>setAlvoEdicao(null)}/>
              </div>
            </div>
          )}
        </div>
        <div style={{fontSize:11.5,color:T3,marginTop:12,lineHeight:1.55,textAlign:'center'}}>
          {tocarParaMudar
            ?'Desliga «Tocar para mudar» para navegar no site como um cliente.'
            :'Estás a navegar como um cliente. Liga «Tocar para mudar» para escolher cores.'}
        </div>
      </div>
    </div>
  )
}

// As fotos do trabalho da barbearia: aparecem na app do cliente.
function PainelGaleria({biz}){
  const[fotos,setFotos]=useState(null)
  const[aEnviar,setAEnviar]=useState(false)
  const[erro,setErro]=useState('')
  const[legenda,setLegenda]=useState({})

  async function recarregar(){
    try{ setFotos(await listGallery(biz.id)); setErro('') }
    catch(e){ setErro(/relation .* does not exist/i.test(e.message)
      ? 'A tabela da galeria ainda não existe — falta correr o GALERIA_SETUP.sql no Supabase.'
      : e.message); setFotos([]) }
  }
  useEffect(()=>{recarregar()},[biz.id])

  async function enviar(ficheiros){
    const files=Array.isArray(ficheiros)?ficheiros:[...(ficheiros?.target?.files||[])]
    if(!files.length)return
    const espaco=LIMITE_GALERIA-(fotos?.length||0)
    if(files.length>espaco)return setErro(
      espaco>0?`Só cabem mais ${espaco}. Uma galeria curta e boa vale mais do que uma longa.`
              :`A galeria já tem ${LIMITE_GALERIA} fotos. Apaga uma para acrescentar outra.`)
    setAEnviar(true);setErro('')
    try{ for(const f of files) await addGalleryPhoto(biz.id,f); await recarregar() }
    catch(err){ setErro('Upload falhou: '+err.message+(/bucket|not found/i.test(err.message)?' — falta correr o STORAGE_SETUP.sql.':'')) }
    finally{ setAEnviar(false) }
  }

  async function apagar(f){
    if(!window.confirm('Apagar esta foto da galeria?'))return
    try{ await deleteGalleryPhoto(f.id); await recarregar() }catch(e){ setErro(e.message) }
  }
  async function mover(f,d){ try{ await moveGalleryPhoto(biz.id,f.id,d); await recarregar() }catch(e){ setErro(e.message) } }
  async function gravarLegenda(f){
    try{ await updateGalleryPhoto(f.id,{caption:legenda[f.id]??f.caption??''}); await recarregar() }catch(e){ setErro(e.message) }
  }
  async function alternar(f){
    try{ await updateGalleryPhoto(f.id,{is_active:!f.is_active}); await recarregar() }catch(e){ setErro(e.message) }
  }

  return(
    <Card>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',gap:12,marginBottom:6}}>
        <div style={{fontWeight:700,fontSize:15,color:T}}>Galeria</div>
      </div>
      <div style={{fontSize:11.5,color:T3,marginBottom:12,lineHeight:1.5}}>
        Aparecem no site da barbearia, na secção de galeria. As horizontais ficam melhor.
        São reduzidas automaticamente antes de subir, por isso não te preocupes com o tamanho.
        {fotos?.length>0&&<> · <b style={{color:fotos.length>=LIMITE_GALERIA?Y:T2}}>{fotos.length} de {LIMITE_GALERIA}</b></>}
      </div>

      <Largar onFicheiros={enviar} multiplas aEnviar={aEnviar} titulo="Larga as fotos aqui"
        style={{padding:'22px 18px',marginBottom:16,textAlign:'center'}}>
        {aEnviar
          ?<div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:10,color:T2,fontSize:13}}>
             <Spin size={15}/> A enviar…
           </div>
          :<>
             <div style={{fontSize:13.5,color:T,fontWeight:600,marginBottom:3}}>Larga as fotos aqui</div>
             <div style={{fontSize:11.5,color:T3}}>ou carrega para escolher · várias de uma vez · colar também dá</div>
           </>}
      </Largar>

      {erro&&<div style={{padding:'11px 13px',borderRadius:9,marginBottom:14,fontSize:12.5,lineHeight:1.5,
        background:`${R}10`,border:`1px solid ${R}35`,color:'#F0A0A0'}}>{erro}</div>}

      {fotos===null&&<div style={{padding:'26px 0',textAlign:'center'}}><Spin/></div>}

      {fotos!==null&&fotos.length===0&&!erro&&(
        <div style={{padding:'34px 18px',textAlign:'center',border:`1px dashed ${BD}`,borderRadius:12}}>
          <div style={{fontSize:13.5,color:T2,marginBottom:4}}>Ainda sem fotos.</div>
          <div style={{fontSize:12,color:T3}}>Sem galeria, essa secção não aparece no site.</div>
        </div>
      )}

      {fotos!==null&&fotos.length>0&&(
        <div style={{display:'flex',flexDirection:'column',gap:10}}>
          {fotos.map((f,i)=>(
            <div key={f.id} style={{display:'flex',gap:12,padding:10,borderRadius:12,
              border:`1px solid ${BD}`,background:BG,opacity:f.is_active?1:.5}}>
              <img src={f.image_url} alt="" style={{width:78,height:78,objectFit:'cover',borderRadius:9,flexShrink:0}}/>
              <div style={{flex:1,minWidth:0}}>
                <Inp placeholder="Legenda (opcional)" value={legenda[f.id]??f.caption??''}
                  onChange={e=>setLegenda(l=>({...l,[f.id]:e.target.value}))}
                  onBlur={()=>gravarLegenda(f)}
                  onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur()}}/>
                <div style={{display:'flex',gap:6,marginTop:8,flexWrap:'wrap'}}>
                  <Btn v="secondary" style={{padding:'4px 9px',fontSize:11}} disabled={i===0}
                    onClick={()=>mover(f,'cima')}>↑</Btn>
                  <Btn v="secondary" style={{padding:'4px 9px',fontSize:11}} disabled={i===fotos.length-1}
                    onClick={()=>mover(f,'baixo')}>↓</Btn>
                  <Btn v="secondary" style={{padding:'4px 9px',fontSize:11}} onClick={()=>alternar(f)}>
                    {f.is_active?'Esconder':'Mostrar'}
                  </Btn>
                  <Btn v="ghost" style={{padding:'4px 9px',fontSize:11,color:R}} onClick={()=>apagar(f)}>Apagar</Btn>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  )
}

// Zona onde se pode largar uma imagem, ou carregar para escolher. Serve os
// quatro sitios que recebem fotos: logotipo, capa, icone e galeria. Aceita
// tambem colar com Ctrl+V, que e como se traz uma captura de ecra.
function Largar({onFicheiros,multiplas=false,aEnviar=false,children,style,titulo='Larga a imagem aqui'}){
  const[sobre,setSobre]=useState(false)
  const refInput=React.useRef(null)

  const soImagens=lista=>[...lista].filter(f=>f.type?.startsWith('image/'))

  function aoLargar(e){
    e.preventDefault();setSobre(false)
    if(aEnviar)return
    const fs=soImagens(e.dataTransfer?.files||[])
    if(fs.length)onFicheiros(multiplas?fs:[fs[0]])
  }
  function aoColar(e){
    if(aEnviar)return
    const fs=soImagens([...(e.clipboardData?.items||[])].map(i=>i.getAsFile?.()).filter(Boolean))
    if(fs.length){e.preventDefault();onFicheiros(multiplas?fs:[fs[0]])}
  }

  return(
    <div
      onDragOver={e=>{e.preventDefault();if(!aEnviar)setSobre(true)}}
      onDragEnter={e=>{e.preventDefault();if(!aEnviar)setSobre(true)}}
      onDragLeave={e=>{if(!e.currentTarget.contains(e.relatedTarget))setSobre(false)}}
      onDrop={aoLargar}
      onPaste={aoColar}
      onClick={()=>!aEnviar&&refInput.current?.click()}
      tabIndex={0}
      onKeyDown={e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();refInput.current?.click()}}}
      style={{position:'relative',borderRadius:12,cursor:aEnviar?'wait':'pointer',outline:'none',
        border:`1.5px dashed ${sobre?Y:BD}`,background:sobre?`${Y}0E`:'transparent',
        transition:'border-color .15s, background .15s',...style}}>
      <input ref={refInput} type="file" accept="image/*" multiple={multiplas} disabled={aEnviar}
        style={{display:'none'}}
        onChange={e=>{const fs=soImagens(e.target.files||[]);e.target.value='';if(fs.length)onFicheiros(fs)}}/>
      {children}
      {sobre&&(
        <div style={{position:'absolute',inset:0,borderRadius:12,display:'grid',placeItems:'center',
          background:'rgba(10,8,7,.82)',color:Y,fontSize:13,fontWeight:700,pointerEvents:'none'}}>
          {titulo}
        </div>
      )}
    </div>
  )
}


/* ── A pagina propriamente dita ────────────────────────────────────────────
   O super admin entrega o `biz` (a linha da barbearia) ao DesignTab. Aqui a
   barbearia e sempre a de quem esta ligado, por isso monta-se o `biz` a
   partir do que o painel ja tem carregado. */
export default function MeuSite() {
  const data = useStore();
  const b = data.business;

  if (!b?.id) {
    return (
      <AdminLayout>
        <div style={{ padding: 60, textAlign: 'center', color: T2 }}><Spin size={26} /></div>
      </AdminLayout>
    );
  }

  const biz = {
    id: b.id,
    name: b.name,
    slug: b.slug,
    domain: b._settings?.domain || b.domain || '',
    logo_url: b.logoUrl || '',
  };

  return (
    <AdminLayout>
      <div className="page-head">
        <h1>O Meu Site</h1>
        <p>Escolhe as cores, a capa, a tipografia e o que aparece aos teus clientes. Vês tudo num telemóvel antes de publicares.</p>
      </div>
      {/* O DesignTab guarda e mantem o seu proprio estado; nao ha nada para
          recarregar aqui. Fica a funcao porque e o contrato do componente. */}
      <DesignTab biz={biz} onGuardado={() => {}} />
    </AdminLayout>
  );
}
