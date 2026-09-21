// dataService.js — Supabase backend
// Migrado de localStorage para Supabase (Fase 3)
// API pública idêntica — componentes não precisam de mudar.

import { supabase } from '@/lib/supabase';
import { enviarPush, EMOJI, corpoDaMarcacao, definirModoDemo } from '@/lib/push';

// Cada tipo de aviso tem o seu sinal, pela mesma razao das outras
// notificacoes: distinguir-se antes de ser lido.
const EMOJI_AVISO = {
  info: '\u{2139}\u{FE0F}', promo: '\u{1F381}', aviso: '\u{26A0}\u{FE0F}', urgente: '\u{1F6A8}',
};

// O painel fica aberto o dia inteiro no telemovel ou no balcao. Sem isto,
// carregava os dados uma vez ao abrir e ficava por ali: um cliente cancelava
// e o barbeiro continuava a ver "Confirmada" ate recarregar a pagina — e a
// guardar o lugar a alguem que ja nao vinha.
let _ultimoRefresco = 0;
let _aAtualizar = false;
const _ouvintesRefresco = new Set();

export function aoAtualizar(fn) { _ouvintesRefresco.add(fn); return () => _ouvintesRefresco.delete(fn); }
export function ultimoRefresco() { return _ultimoRefresco; }
export function estaAAtualizar() { return _aAtualizar; }
function _avisar() { _ouvintesRefresco.forEach(fn => { try { fn(); } catch {} }); }

// Ir buscar a agenda toda de 30 em 30 segundos, o dia inteiro, era a forma
// mais cara possivel de quase nunca descobrir nada: quase sempre vinha
// exactamente o mesmo, e no plano Free os 5 GB de trafego esgotados poem a
// base de dados em leitura apenas — as marcacoes param de entrar. Agora
// atualiza quando o barbeiro volta ao painel, e quando ele pede.
export async function atualizarAgora() {
  if (_aAtualizar) return;
  _aAtualizar = true;
  _avisar();
  try {
    await dataService.refreshAppointments();
    _ultimoRefresco = Date.now();
  } catch { /* rede em baixo: fica o que ja estava, e o botao volta ao normal */ }
  finally { _aAtualizar = false; _avisar(); }
}

async function refrescarSeVelho(minimoSegundos = 15) {
  if (document.hidden) return;
  if (Date.now() - _ultimoRefresco < minimoSegundos * 1000) return;
  await atualizarAgora();
}

if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => refrescarSeVelho(15));
  window.addEventListener('focus', () => refrescarSeVelho(15));
}

function notifFromRow(row) {
  return {
    id: row.id, businessId: row.business_id,
    title: row.title, message: row.message || '',
    type: row.type || 'info', active: row.is_active !== false,
    createdAt: row.created_at,
  };
}
import { buildSnapshot, assertNoConflict, canTransition, appointmentDuration, precoDaMarcacao } from '@/lib/domain/appointments';

// A base de dados tem uma barreira que impede duas marcacoes em cima uma da
// outra com o mesmo profissional. Quando ela dispara, o Postgres devolve
// 23P01 e um texto que fala de "exclusion constraint" — que nao diz nada a um
// barbeiro. Traduz-se aqui, uma vez, para nao andar espalhado pelos ecras.
function traduzirErro(error) {
  if (!error) return error;
  if (error.code === '23P01') {
    return new Error('Esse horário já está ocupado com esse profissional. Escolhe outra hora.');
  }
  // A trava do plano vive na base de dados (gatilho profissionais_dentro_do_plano).
  // Aqui só se troca a linguagem de servidor por uma frase para o barbeiro.
  // A caixa fechada e uma situacao normal, nao uma avaria: merece a frase
  // certa em vez do texto da base de dados.
  if (typeof error.message === 'string' && error.message.includes('cash_session_id')) {
    return new Error('A caixa está fechada. Abre a caixa para registar movimentos em dinheiro.');
  }
  if (typeof error.message === 'string' && error.message.includes('LIMITE_PROFISSIONAIS')) {
    return new Error('O teu plano não permite mais profissionais ativos. Desativa um, ou fala connosco para mudares de plano.');
  }
  /*
   * A trava da subscricao (gatilho marcacao_exige_subscricao). Ao barbeiro
   * diz-se a verdade inteira — e a barbearia dele, e o dinheiro e dele.
   *
   * A frase nao pede desculpa nem envergonha: ele pode ver o painel todo e
   * preparar a casa sem pagar nada, e isso e de proposito. So as marcacoes e
   * que esperam pelo cartao. E diz-se-lhe exactamente onde carregar.
   */
  if (typeof error.message === 'string' && error.message.includes('SEM_SUBSCRICAO')) {
    const e = new Error('Para começares a receber marcações falta registar o cartão. São 7 dias à experiência e só depois é que pagas — vai a Subscrição, no fim do menu.');
    e.semSubscricao = true;
    return e;
  }
  return error instanceof Error ? error : new Error(error.message || 'Erro desconhecido');
}
import { getCustomerStats, valorDoCortePack } from '@/lib/domain/finance';
import { round2 } from '@/lib/domain/money';
import { localDateStr } from '@/lib/domain/dates';
import { diaLocal } from '@/lib/format';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const DAY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

// ─── STATE ────────────────────────────────────────────────────────────────────
let BUSINESS_ID = null;
let state = {
  business: null,
  // Pagamentos por MB WAY enviados pelos clientes (MBWAY.sql).
  pagamentosMbway: [],
  // Packs vendidos (packs_clientes): entram na Caixa e na receita no dia em
  // que são pagos, e dão a base da comissão dos cortes de pack.
  packSales: [],
  professionals: [], services: [], customers: [], appointments: [],
  products: [], cashSessions: [], cashMovements: [], forms: [],
  waitlist: [], suppliers: [], stockMovements: [], commissions: [],
  // Ainda em memória (não migrados nesta fase):
  reviews: [], timeOff: [], gallery: [], notifications: [], promotions: [],
  expenses: [], typologies: _defaultTypologies(), comandas: [], sales: [],
  subscriptionPlans: [], subscriptions: [], subscriptionPayments: [],
  loyaltyMovements: [], loyaltyRewards: [],
};
let initialized = false;
const listeners = new Set();

function notify() { listeners.forEach(fn => fn(state)); }

// ─── DEFAULT DATA ─────────────────────────────────────────────────────────────
function _defaultTypologies() {
  return {
    categorias: [{id:'tc1',name:'Corte'},{id:'tc2',name:'Barba'},{id:'tc3',name:'Combo'},{id:'tc4',name:'Tratamento'}],
    pagamento: [{id:'tp1',name:'Dinheiro'},{id:'tp2',name:'Cartão'},{id:'tp3',name:'MB WAY'},{id:'tp4',name:'Transferência'},{id:'tp5',name:'Voucher'}],
    despesas: [{id:'td1',name:'Fornecedores'},{id:'td2',name:'Limpeza'},{id:'td3',name:'Marketing'},{id:'td4',name:'Outros'}],
    receitas: [{id:'tr1',name:'Serviços'},{id:'tr2',name:'Produtos'},{id:'tr3',name:'Gorjetas'},{id:'tr4',name:'Outros'}],
    fornecedores: [{id:'tf1',name:'BarberSupply'},{id:'tf2',name:'ProHair'},{id:'tf3',name:'BladeCo'}],
    remuneracoes: [{id:'trm1',name:'Comissão %'},{id:'trm2',name:'Salário fixo'},{id:'trm3',name:'Por sessão'}],
  };
}

function _defaultConfig() {
  return {
    agenda: { slotMinutes: 30, minAdvanceHours: 2, allowWaitlist: true, allowFitIns: true },
    payments: { methods: ['Dinheiro','Cartão','MB WAY','Transferência','Voucher'], tipEnabled: true },
    clients: { requirePhone: false, allowAnamnese: false },
    profissionais: {}, anamnese: {}, documentos: {}, theme: {}, params: {},
    notifications: { emailEnabled: true, smsEnabled: false, reminderHours: 2 },
  };
}

// ─── HELPERS ──────────────────────────────────────────────────────────────────
function uid(prefix = 'id') {
  return prefix + '_' + Date.now() + '_' + Math.random().toString(36).slice(2, 7);
}
function genBookingRef() {
  return 'CB-' + Math.random().toString(36).slice(2, 6).toUpperCase();
}
function toMinutes(t) {
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}
function toTime(mins) {
  const h = Math.floor(mins / 60), m = mins % 60;
  return String(h).padStart(2,'0') + ':' + String(m).padStart(2,'0');
}
// Converte timestamp Supabase (UTC) → { date, time } em hora local
function parseTs(isoStr) {
  const d = new Date(isoStr);
  return {
    date: `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`,
    time: `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`,
  };
}
// Converte data local + hora → ISO UTC para Supabase
function toTs(date, time) {
  return new Date(`${date}T${time}:00`).toISOString();
}

// ─── LOYALTY ──────────────────────────────────────────────────────────────────
const DEFAULT_LOYALTY = {
  enabled: true, title: 'Cartão Fidelidade', totalStamps: 10, reward: 'Corte grátis',
  stampEmoji: '✂️', bgColor: '#1A1208', cardColor: '#C9A84C',
  stampFilledColor: '#C9A84C', stampEmptyColor: 'rgba(255,255,255,0.08)', textColor: '#FFFFFF',
};

// As regras do cartao vivem em settings.loyalty da barbearia — e o que o
// site do cliente le. Antes viviam no localStorage deste browser (o
// "cartao ativo" decidia se o balcao carimbava e mais nada) e no config, e
// as tres copias discordavam. `enabled` e `totalStamps` ficam com os nomes
// antigos para o resto do codigo nao mudar.
function loyaltyCardConfig() {
  const l = state.business?.loyalty || {};
  return {
    ...DEFAULT_LOYALTY,
    // So com o cartao LIGADO de proposito. Antes, uma barbearia que nunca
    // tinha decidido nada carimbava na mesma, e o cliente via a animacao.
    enabled: l.ativo === true,
    totalStamps: Math.max(3, Math.min(20, Number(l.stampsNeeded) || 10)),
    reward: l.rewardName || DEFAULT_LOYALTY.reward,
  };
}

// ── Validade do cartao ──────────────────────────────────────────────────────
// O cartao dizia "valido por 6 meses" e nunca expirava nada: era uma promessa
// escrita que o codigo nao cumpria. A contagem comeca no PRIMEIRO carimbo de
// cada cartao — nao na data em que a pessoa criou conta, nem no ultimo corte.
// Quem levou o primeiro corte em Janeiro tem ate Julho para fechar o cartao.
function mesesDeValidade() {
  const n = Number(state.business?._settings?.loyalty?.validMonths);
  // 0 quer dizer sem prazo, e e uma escolha legitima.
  return Number.isFinite(n) && n >= 0 ? n : 6;
}

export function cartaoExpirou(loyalty, meses = mesesDeValidade()) {
  if (!meses || !loyalty?.startedAt) return false;
  const fim = new Date(loyalty.startedAt);
  fim.setMonth(fim.getMonth() + meses);
  return Date.now() > fim.getTime();
}

async function addLoyaltyStamp(appt, at = new Date().toISOString()) {
  if (!appt?.customerId || appt.loyaltyStamped) return;
  // Corte do pack mensal: por omissão NÃO dá carimbo no cartão de
  // fidelidade — o pack já é o desconto. A barbearia pode mudar isso em
  // Packs › «Os cortes do pack dão carimbo».
  const packSemCarimbo = appt.usaPack === true && state.business?.packs?.carimbos !== true;
  if (!loyaltyCardConfig().enabled || packSemCarimbo) {
    // Sem cartao nao ha carimbo — mas o pedido de avaliacao do corte
    // continua. Vivia so aqui dentro, e desligar o cartao calava as
    // avaliacoes sem ninguem dar por isso.
    const c = state.customers.find(x => x.id === appt.customerId);
    if (c && !c.pendingReview) {
      c.pendingReview = { appointmentId: appt.id, serviceId: appt.serviceId, professionalId: appt.professionalId };
      await guardarFidelidade(c);
    }
    return;
  }
  const customer = state.customers.find(c => c.id === appt.customerId);
  if (!customer) return;
  const cfg = loyaltyCardConfig();
  const threshold = cfg.totalStamps;
  if (!customer.loyalty) customer.loyalty = { stamps: 0, totalStamps: 0, rewardsEarned: 0, points: 0 };

  // Cartao fora do prazo: comeca um novo, vazio. O historico de vida
  // (totalStamps, rewardsEarned) fica — e o que se perde sao os carimbos
  // deste cartao, que e o que a validade quer dizer.
  if (cartaoExpirou(customer.loyalty)) {
    customer.loyalty.stamps = 0;
    customer.loyalty.startedAt = null;
  }
  // Primeiro carimbo deste cartao: e daqui que se conta o prazo.
  if (!customer.loyalty.stamps) customer.loyalty.startedAt = at;

  customer.loyalty.points = (customer.loyalty.points || 0) + 1;
  customer.loyalty.stamps = (customer.loyalty.stamps || 0) + 1;
  customer.loyalty.totalStamps = (customer.loyalty.totalStamps || 0) + 1;
  customer.loyalty.lastStampAt = at;
  let displayCount = customer.loyalty.stamps;
  let reward = false;
  if (customer.loyalty.stamps >= threshold) {
    customer.loyalty.stamps = 0;
    // Cartao fechado: o prazo do proximo so comeca no proximo carimbo.
    customer.loyalty.startedAt = null;
    customer.loyalty.rewardsEarned = (customer.loyalty.rewardsEarned || 0) + 1;
    reward = true; displayCount = threshold;
  }
  customer.pendingStamp = { count: displayCount, reward };
  customer.pendingReview = { appointmentId: appt.id, serviceId: appt.serviceId, professionalId: appt.professionalId };
  appt.loyaltyStamped = true;
  await guardarFidelidade(customer);

  // Avisar o cliente. O carimbo e o momento em que o cartao de fidelidade
  // deixa de ser uma promessa e passa a ser uma conta que ele leva na cabeca
  // — e o unico momento em que ele se lembra de que existe, se ninguem lhe
  // disser nada. A animacao esta la a espera dele quando abrir.
  if (appt.customerId) {
    const total = threshold;
    enviarPush({
      businessId: BUSINESS_ID,
      para: 'customer',
      userId: appt.customerId,
      titulo: reward
        ? '\u{1F381} Ganhou um corte grátis!'
        : `\u{2702}\u{FE0F} Mais um carimbo · ${displayCount}/${total}`,
      mensagem: reward
        ? `${state.business?.name || 'A barbearia'}\nO cartão está completo. Abra a app para levantar.`
        : `${state.business?.name || 'A barbearia'}\nFaltam ${Math.max(0, total - displayCount)} para o corte grátis.`,
      url: '/marcacoes',
      tag: 'carimbo-' + appt.id,
      // Um corte gratis merece ficar no ecra ate ser visto. Um carimbo normal
      // nao — sao dez por cartao e ninguem quer dez notificacoes presas.
      exigeAccao: !!reward,
    }).catch(e => console.warn('aviso do carimbo não enviado:', e.message));
  }
}

// Sem isto o selo so existia na memoria deste browser: fechada a pagina
// desaparecia, e a app do cliente — que le da base de dados — nunca chegava
// a ve-lo. Era exactamente o que estava a acontecer.
async function guardarFidelidade(customer) {
  const row = custToRow(customer);
  const { error } = await supabase.from('customers')
    .update({ loyalty_points: row.loyalty_points, metadata: row.metadata })
    .eq('id', customer.id);
  if (error) console.error('cartao de fidelidade nao gravado:', error.message);
}

function recomputeCustomer(customerId) {
  const c = state.customers.find(x => x.id === customerId);
  if (!c) return;
  const stats = getCustomerStats(state, customerId);
  c.totalAppointments = stats.visits;
  c.totalSpent = stats.totalSpent;
  c.lastVisit = stats.lastVisit;
}

// ─── Imagens ─────────────────────────────────────────────────────────────────
// As fotografias dos profissionais eram guardadas dentro da base de dados, em
// texto: uma foto de telemovel de 3 MB ficava com 4 MB numa linha, e o site do
// cliente descarregava-as todas antes de mostrar seja o que for. Passam a ir
// para o armazenamento de ficheiros, reduzidas primeiro.

async function reduzirImagem(file, ladoMaximo = 900, qualidade = 0.85) {
  if (!file.type?.startsWith('image/') || file.type === 'image/svg+xml') return file;
  try {
    const bitmap = await createImageBitmap(file);
    const escala = Math.min(1, ladoMaximo / Math.max(bitmap.width, bitmap.height));
    if (escala === 1 && file.size < 300 * 1024) { bitmap.close?.(); return file; }
    const largura = Math.round(bitmap.width * escala);
    const altura = Math.round(bitmap.height * escala);
    const canvas = document.createElement('canvas');
    canvas.width = largura; canvas.height = altura;
    canvas.getContext('2d').drawImage(bitmap, 0, 0, largura, altura);
    bitmap.close?.();
    const blob = await new Promise(r => canvas.toBlob(r, 'image/jpeg', qualidade));
    if (!blob || blob.size >= file.size) return file;
    return new File([blob], 'foto.jpg', { type: 'image/jpeg' });
  } catch { return file; }
}

/** Envia a fotografia de um profissional e devolve o endereço público. */
export async function uploadProfessionalPhoto(professionalId, file) {
  if (!BUSINESS_ID) throw new Error('Barbearia não identificada.');
  const reduzida = await reduzirImagem(file);
  const caminho = `${BUSINESS_ID}/profissional-${professionalId}.jpg`;
  const { error } = await supabase.storage
    .from('business-logos')
    .upload(caminho, reduzida, { upsert: true, contentType: 'image/jpeg' });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from('business-logos').getPublicUrl(caminho);
  return data.publicUrl + '?t=' + Date.now();
}

// ─── ADAPTERS: Supabase row ↔ app format ──────────────────────────────────────

// BUSINESS
function bizFromRow(row) {
  if (!row) return null;
  const s = row.settings || {};
  return {
    id: row.id, name: row.name, slug: row.slug,
    // O plano e o limite sao colunas da tabela, escritas pelo Super Admin.
    // Vem para aqui so para serem lidos: este painel nunca lhes toca.
    plan: row.plan || null,
    billingPeriod: row.billing_period || 'mensal',
    professionalLimit: row.professional_limit ?? null,
    logoUrl: row.logo_url || s.logoUrl || '',
    coverImageUrl: s.coverImageUrl || '',
    tagline: s.tagline || '', description: s.description || '',
    address: s.address || '', phone: s.phone || '', email: s.email || '',
    rating: s.rating || 0, reviewCount: s.reviewCount || 0,
    coords: s.coords || {}, amenities: s.amenities || [],
    social: s.social || {}, openingHours: s.openingHours || [],
    config: s.config || _defaultConfig(),
    // O cartao de fidelidade: uma so verdade, a mesma que o site do cliente le.
    loyalty: s.loyalty || {},
    // O programa de packs (Packs → interruptor no topo). Desligado por omissao.
    packs: s.packs || {},
    // MB WAY (menu MB WAY): { ativo, numero, titular, limiteMes }.
    mbway: s.mbway || {},
    // As categorias dos servicos, pela ordem que o barbeiro escolheu. Vivem
    // no settings da barbearia (o site do cliente le-as de la); antes eram
    // uma lista em memoria que desaparecia ao recarregar a pagina.
    serviceCategories: Array.isArray(s.serviceCategories) ? s.serviceCategories : [],
    // O mesmo para os produtos do inventario.
    productCategories: Array.isArray(s.productCategories) ? s.productCategories : [],
    // O Super Admin escreve chaves aqui (theme, loyalty, ...) que este admin
    // nao conhece. Guardamos o settings original para as devolver intactas
    // ao gravar - sem isto, gravar o telefone apagava o tema da barbearia.
    _settings: s,
    demo: s.demo?.ativo === true,
  };
}
function bizToRow(biz) {
  // plan / billingPeriod / professionalLimit saem fora de proposito: sao
  // colunas do contrato, nao definicoes da barbearia. Se ficassem no `rest`
  // eram copiados para dentro do settings a cada gravacao.
  const { id, name, slug, logoUrl, _settings, plan, billingPeriod, professionalLimit, ...rest } = biz;
  return { name, slug, logo_url: logoUrl, settings: { ...(_settings || {}), ...rest } };
}

// PROFESSIONAL
function proFromRow(row) {
  if (!row) return null;
  const m = row.metadata || {};
  return {
    id: row.id, businessId: row.business_id,
    // Uma ficha sem nome diz que nao tem nome. Guardar o email no lugar do
    // nome fazia-o passar por nome, e ninguem o corrigia. O cliente escreve-o
    // na primeira marcacao; ate la aparece assim.
    name: (row.name || '').trim() || 'Cliente sem nome',
    semNome: !((row.name || '').trim()),
    email: row.email || '', phone: row.phone || '',
    role: m.role || '', bio: m.bio || '', photoUrl: m.photoUrl || '',
    rating: m.rating || 0, reviewCount: m.reviewCount || 0,
    specialties: m.specialties || [],
    commission: row.commission_value ?? m.commission ?? 30,
    schedule: m.schedule || null,
    isActive: row.is_active !== false,
  };
}
function proToRow(p) {
  const { id, businessId, name, email, phone, commission, isActive, ...meta } = p;
  return {
    business_id: BUSINESS_ID, name,
    email: email || null, phone: phone || null,
    commission_type: 'percentage', commission_value: commission ?? 30,
    is_active: isActive !== false,
    metadata: meta,
  };
}

// SERVICE
function svcFromRow(row) {
  if (!row) return null;
  const m = row.metadata || {};
  return {
    id: row.id, businessId: row.business_id, name: row.name,
    description: row.description || '',
    price: Number(row.price) || 0,
    durationMinutes: row.duration_minutes || 30,
    isActive: row.is_active !== false,
    category: m.category || '', priceType: m.priceType || 'fixed', isPopular: m.isPopular || false,
  };
}
function svcToRow(s) {
  const { id, businessId, name, description, price, durationMinutes, isActive, ...meta } = s;
  return {
    business_id: BUSINESS_ID, name, description: description || null,
    price: price || 0, duration_minutes: durationMinutes || 30,
    is_active: isActive !== false, metadata: meta,
  };
}

// CUSTOMER
function custFromRow(row) {
  if (!row) return null;
  const m = row.metadata || {};
  return {
    id: row.id, businessId: row.business_id, name: row.name,
    email: row.email || '', phone: row.phone || '',
    birthDate: row.date_of_birth || null,
    totalAppointments: row.total_visits || 0,
    totalSpent: Number(row.total_spent) || 0,
    joinedAt: row.created_at?.slice(0,10) || '',
    lastVisit: m.lastVisit || null,
    loyalty: m.loyalty || { stamps: 0, totalStamps: 0, rewardsEarned: 0, points: row.loyalty_points || 0 },
    pendingStamp: m.pendingStamp || null,
    pendingReview: m.pendingReview || null,
    balance: m.balance || 0,
    // As notas do barbeiro sobre o cliente ("prefere degrade baixo"). Eram
    // escritas no ecra e deitadas fora aqui: nunca chegaram a ser gravadas.
    notes: m.notes || '',
    passwordHash: m.passwordHash || null,
    isActive: row.is_active !== false,
  };
}
function custToRow(c) {
  const { id, businessId, name, email, phone, birthDate, totalAppointments, totalSpent, isActive, ...meta } = c;
  return {
    business_id: BUSINESS_ID, name,
    email: email || null, phone: phone || null,
    date_of_birth: birthDate || null,
    total_spent: totalSpent || 0, total_visits: totalAppointments || 0,
    loyalty_points: meta.loyalty?.points || 0,
    is_active: isActive !== false,
    metadata: {
      lastVisit: meta.lastVisit, loyalty: meta.loyalty,
      pendingStamp: meta.pendingStamp, pendingReview: meta.pendingReview,
      balance: meta.balance, passwordHash: meta.passwordHash,
      notes: meta.notes || null,
    },
  };
}

// APPOINTMENT
function apptFromRow(row) {
  if (!row) return null;
  const m = row.metadata || {};
  const pd = row.payment_data || {};
  const { date, time: startTime } = parseTs(row.start_at);
  const { time: endTime } = parseTs(row.end_at);
  return {
    id: row.id, businessId: row.business_id, customerId: row.customer_id,
    professionalId: row.professional_id, serviceId: row.service_id,
    date, startTime, endTime, status: row.status,
    notes: row.notes || '', bookingRef: row.booking_ref,
    unitPriceSnapshot: row.price_snapshot != null ? Number(row.price_snapshot) : null,
    payment: pd.payment || null, paymentMethod: pd.paymentMethod || null,
    serviceNameSnapshot: m.serviceNameSnapshot,
    professionalNameSnapshot: m.professionalNameSnapshot,
    durationSnapshot: m.durationSnapshot,
    loyaltyStamped: m.loyaltyStamped || false,
    // Marcacao paga com um corte gratis do cartao de fidelidade.
    usaRecompensa: m.usaRecompensa === true,
    // Marcacao paga com um corte de um pack (PACK_MENSAL.sql). O corte foi
    // pago na venda do pack; aqui ja nao ha nada a cobrar.
    usaPack: m.usaPack === true,
    pacoteId: m.pacoteId || null,
    packDevolvido: m.packDevolvido === true,
    // Pago por MB WAY e confirmado pelo barbeiro (MBWAY.sql). Quem o escreve
    // e a base de dados, em mbway_confirmar.
    mbway: m.mbway || null,
    blocked: m.blocked || false,
    createdAt: row.created_at,
    confirmedAt: m.confirmedAt, completedAt: m.completedAt,
    cancelledAt: m.cancelledAt, attendedAt: m.attendedAt,
    // 'cliente' ou 'barbearia'. Sem isto o barbeiro nao sabia quem desmarcou.
    cancelledBy: m.cancelledBy || null,
    encaixe: m.encaixe === true,
    rescheduleHistory: m.rescheduleHistory,
  };
}
function apptToRow(a) {
  return {
    business_id: BUSINESS_ID,
    customer_id: a.customerId || null,
    professional_id: a.professionalId,
    service_id: a.serviceId || null,
    start_at: toTs(a.date, a.startTime),
    end_at: toTs(a.date, a.endTime),
    status: a.status || 'pending',
    notes: a.notes || null,
    price_snapshot: a.unitPriceSnapshot ?? null,
    booking_ref: a.bookingRef || null,
    payment_data: { payment: a.payment || null, paymentMethod: a.paymentMethod || null },
    metadata: {
      serviceNameSnapshot: a.serviceNameSnapshot,
      professionalNameSnapshot: a.professionalNameSnapshot,
      durationSnapshot: a.durationSnapshot,
      loyaltyStamped: a.loyaltyStamped,
      usaRecompensa: !!a.usaRecompensa,
      // Os tres do pack tem de viajar sempre juntos: se uma gravacao os
      // perdesse, a base de dados ja nao saberia que corte devolver.
      usaPack: a.usaPack ? true : undefined,
      pacoteId: a.pacoteId || undefined,
      packDevolvido: a.packDevolvido ? true : undefined,
      // Sem isto, a primeira gravacao do painel depois de confirmar o MB WAY
      // apagava o «pago» da marcacao.
      mbway: a.mbway || undefined,
      blocked: a.blocked,
      confirmedAt: a.confirmedAt, completedAt: a.completedAt,
      cancelledAt: a.cancelledAt, attendedAt: a.attendedAt,
      cancelledBy: a.cancelledBy || null,
      rescheduleHistory: a.rescheduleHistory,
      // Um encaixe e, por definicao, uma marcacao fora da grelha normal. A
      // barreira de sobreposicao da base de dados deixa-o passar por isto.
      encaixe: a.encaixe === true ? true : undefined,
    },
  };
}

// PRODUCT
function prodFromRow(row) {
  if (!row) return null;
  const m = row.metadata || {};
  return {
    id: row.id, businessId: row.business_id, name: row.name,
    category: m.category || '', unit: m.unit || 'un',
    stock: Number(row.stock_quantity) || 0,
    minStock: Number(row.min_stock) || 0,
    cost: m.cost || 0, price: Number(row.price) || 0,
    supplier: m.supplier || '',
    isActive: row.is_active !== false,
  };
}
function prodToRow(p) {
  const { id, businessId, name, stock, minStock, price, isActive, ...meta } = p;
  return {
    business_id: BUSINESS_ID, name,
    stock_quantity: stock || 0, min_stock: minStock || 0,
    price: price || 0, is_active: isActive !== false,
    metadata: { category: meta.category, unit: meta.unit, cost: meta.cost, supplier: meta.supplier },
  };
}

// CASH SESSION
function csFromRow(row) {
  if (!row) return null;
  const m = row.metadata || {};
  return {
    id: row.id, openedAt: row.opened_at, closedAt: row.closed_at,
    openedBy: row.opened_by || 'admin',
    openingBalance: Number(row.opening_balance) || 0,
    closingBalance: row.closing_balance != null ? Number(row.closing_balance) : null,
    status: row.status, countedCash: m.countedCash, notes: m.notes || '',
  };
}

// CASH MOVEMENT
function cmFromRow(row) {
  if (!row) return null;
  return {
    id: row.id, sessionId: row.cash_session_id, businessId: row.business_id,
    type: row.type, amount: Number(row.amount) || 0,
    description: row.description || '', createdAt: row.created_at,
    paymentId: row.payment_id,
  };
}

// FORM
function formFromRow(row) {
  if (!row) return null;
  return {
    id: row.id, businessId: row.business_id, name: row.name,
    fields: row.fields || [], questions: row.fields || [],
    active: row.is_active !== false,
  };
}

// WAITLIST
function wlFromRow(row) {
  if (!row) return null;
  const m = row.metadata || {};
  return {
    id: row.id, businessId: row.business_id,
    customerId: row.customer_id, serviceId: row.service_id,
    preferredDate: row.preferred_date, status: row.status,
    priority: m.priority || 'normal', createdAt: row.created_at,
  };
}

// SUPPLIER
function supFromRow(row) {
  if (!row) return null;
  return {
    id: row.id, businessId: row.business_id, name: row.name,
    contact: row.contact || '', email: row.email || '', phone: row.phone || '',
    isActive: row.is_active !== false,
  };
}

// STOCK MOVEMENT
// VENDA DE PRODUTOS
function vendaFromRow(row) {
  if (!row) return null;
  return {
    id: row.id, businessId: row.business_id,
    customerId: row.customer_id || null,
    professionalId: row.professional_id || null,
    items: Array.isArray(row.items) ? row.items : [],
    total: Number(row.total) || 0,
    method: row.method || '',
    sessionId: row.cash_session_id || null,
    soldAt: row.sold_at,
    date: diaLocal(row.sold_at),
    createdAt: row.created_at,
  };
}

// DESPESA
function despFromRow(row) {
  if (!row) return null;
  return {
    id: row.id, businessId: row.business_id,
    sessionId: row.cash_session_id || null,
    description: row.description || '',
    category: row.category || '',
    amount: Number(row.amount) || 0,
    method: row.method || '',
    date: row.spent_at,
    createdAt: row.created_at,
  };
}

// AVALIACAO
function revFromRow(row) {
  if (!row) return null;
  return {
    id: row.id, businessId: row.business_id,
    appointmentId: row.appointment_id,
    customerId: row.customer_id || null,
    professionalId: row.professional_id || null,
    rating: Number(row.rating) || 0,
    comment: row.comment || '',
    isVisible: row.is_visible === true,
    createdAt: row.created_at,
    // O ecra escreve datas de calendario ('2026-09-15'); o created_at e um
    // instante com horas e fuso. Sem esta linha saia "undefined, NaN de
    // undefined" por baixo de cada avaliacao.
    date: diaLocal(row.created_at),
  };
}

// AUSENCIA (ferias)
function ausFromRow(row) {
  if (!row) return null;
  return {
    id: row.id, businessId: row.business_id,
    professionalId: row.professional_id,
    startDate: row.start_date, endDate: row.end_date,
    reason: row.reason || '',
    createdAt: row.created_at,
  };
}

function smFromRow(row) {
  if (!row) return null;
  return {
    id: row.id, productId: row.product_id, businessId: row.business_id,
    type: row.type, quantity: Number(row.quantity) || 0,
    reason: row.reference || '', createdAt: row.created_at,
  };
}

// COMMISSION
function commFromRow(row) {
  if (!row) return null;
  const m = row.metadata || {};
  return {
    id: row.id, businessId: row.business_id, appointmentId: row.appointment_id,
    professionalId: row.professional_id, paymentId: row.payment_id,
    baseAmount: Number(row.base_amount) || 0, percentage: Number(row.percentage) || 0,
    commissionAmount: Number(row.amount) || 0, status: row.status, createdAt: row.created_at,
    professionalNameSnapshot: m.professionalNameSnapshot,
    serviceNameSnapshot: m.serviceNameSnapshot, tip: m.tip || 0,
  };
}

// ─── FETCH HELPER ─────────────────────────────────────────────────────────────
async function fetchAll(table, adapter) {
  const { data, error } = await supabase.from(table).select('*').eq('business_id', BUSINESS_ID);
  if (error) { console.error(`fetchAll(${table}):`, error); return []; }
  return (data || []).map(adapter);
}

// ─── MB WAY ───────────────────────────────────────────────────────────────────
const MBWAY_LIGADO = false;
// Esta marcação ainda se pode pagar por MB WAY? (para o aviso de «confirmada»)
function mbwayParaPagar(a) {
  // Desligado a 21/09: a confirmação manual dava trabalho a mais ao barbeiro.
  if (MBWAY_LIGADO !== true) return false;
  const m = state.business?.mbway || {};
  const d = new Date();
  const mes = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  if (m.ativo !== true || String(m.numero || '').replace(/\D/g, '').length < 9 || m.limiteMes === mes) return false;
  if (a.usaPack || a.usaRecompensa || !(Number(a.unitPriceSnapshot) > 0)) return false;
  if (a.mbway?.estado === 'confirmado') return false;
  return !(state.pagamentosMbway || []).some(p => p.appointmentId === a.id && p.estado !== 'rejeitado');
}
function mbwayFromRow(r) {
  return {
    id: r.id, appointmentId: r.appointment_id, customerId: r.customer_id,
    valor: Number(r.valor) || 0, estado: r.estado,
    comprovativo: r.comprovativo || null, motivo: r.motivo || '',
    criadoEm: r.created_at || r.criado_em, resolvidoEm: r.resolvido_em,
  };
}
function vendaPackFromRow(r) {
  return {
    id: r.id, customerId: r.customer_id, nome: r.nome,
    total: Number(r.preco_pago) || 0, cortes: r.cortes_total || 0,
    method: r.metodo || '', soldAt: r.comprado_em,
    anulado: !!r.anulado_em, anuladoEm: r.anulado_em || null,
  };
}
// Sem o PACK_MENSAL.sql a tabela não existe: lista vazia, sem erro no ecrã.
async function lerVendasPacks() {
  const { data, error } = await supabase.from('packs_clientes')
    .select('id, customer_id, nome, preco_pago, cortes_total, metodo, comprado_em, anulado_em')
    .eq('business_id', BUSINESS_ID);
  if (error) return [];
  return (data || []).map(vendaPackFromRow);
}

async function lerPagamentosMbway() {
  const { data, error } = await supabase.from('pagamentos_mbway')
    .select('*').eq('business_id', BUSINESS_ID).order('criado_em', { ascending: false }).limit(500);
  if (error) return [];
  return (data || []).map(mbwayFromRow);
}

// ─── INIT ─────────────────────────────────────────────────────────────────────
async function init() {
  if (initialized) return;

  // 1. Business — carrega pelo business_id do utilizador autenticado
  let biz = null;
  const { data: authData } = await supabase.auth.getUser();
  if (authData?.user) {
    const { data: userRow } = await supabase
      .from('users').select('business_id').eq('id', authData.user.id).maybeSingle();
    if (userRow?.business_id) {
      const { data } = await supabase.from('businesses').select('*').eq('id', userRow.business_id).maybeSingle();
      biz = data;
    }
  }
  // Sem sessão não há barbearia para carregar: o ecrã de entrar não precisa
  // de nada. O antigo "fallback de desenvolvimento" ia buscar a PRIMEIRA
  // barbearia da tabela — a quem quer que abrisse o endereço, antes de entrar.
  if (!authData?.user) return;
  if (!biz) {
    console.error('[dataService] Negócio não encontrado para este utilizador');
    return;
  }
  if (!biz) {
    const seedSettings = {
      tagline: 'Tradição e estilo, ao teu ritmo.',
      description: 'A Convecta Barbershop é uma barbearia premium no coração de Lisboa. Especialistas em cortes clássicos, barbas trabalhadas e tratamentos de cabelo masculino.',
      address: 'Rua Augusta 42, 1100-053 Lisboa', phone: '+351 21 000 0000', email: 'info@convectabarbershop.pt',
      logoUrl: 'https://media.base44.com/images/public/6a96a6cf3db76ea37907fa81/a9c82e0cf_imgi_1_706016399_18077564405244501_4442771645433716327_n.png',
      coverImageUrl: '', rating: 4.9, reviewCount: 275,
      coords: { lat: 38.7128, lng: -9.1364 },
      amenities: ['WiFi','Estacionamento','Cartão de débito','Música','Cerveja grátis','TV','Ar condicionado'],
      social: { instagram: 'https://www.instagram.com/convecta.pt/', facebook: 'https://facebook.com/convectabarbershop' },
      openingHours: [
        { day: 'monday', isOpen: true, open: '09:00', close: '19:00' },
        { day: 'tuesday', isOpen: true, open: '09:00', close: '19:00' },
        { day: 'wednesday', isOpen: true, open: '09:00', close: '19:00' },
        { day: 'thursday', isOpen: true, open: '09:00', close: '20:00' },
        { day: 'friday', isOpen: true, open: '09:00', close: '20:00' },
        { day: 'saturday', isOpen: true, open: '09:00', close: '18:00' },
        { day: 'sunday', isOpen: false },
      ],
      config: _defaultConfig(),
    };
    const { data: created } = await supabase.from('businesses').insert({ name: 'Convecta Barbershop', slug: 'convecta-barbershop', logo_url: seedSettings.logoUrl, settings: seedSettings, plan: 'free', is_active: true }).select().single();
    biz = created;
  }
  BUSINESS_ID = biz.id;
  state.business = bizFromRow(biz);
  definirModoDemo(state.business.demo);

  // 2. Config (merge into business.config)
  const { data: configRow } = await supabase.from('config').select('*').eq('business_id', BUSINESS_ID).maybeSingle();
  if (configRow) {
    state.business.config = {
      ..._defaultConfig(),
      agenda: configRow.agenda || {},
      payments: configRow.payments || {},
      clients: configRow.clients || {},
      profissionais: configRow.profissionais || {},
      anamnese: configRow.anamnese || {},
      documentos: configRow.documentos || {},
      theme: configRow.theme || {},
      params: configRow.params || {},
    };
  }

  // 3. Load all tables in parallel
  const [
    professionals, services, customers, appointments, products,
    cashSessions, cashMovements, forms, waitlist, suppliers, stockMovements, commissions,
    sales, expenses, reviews, timeOff,
  ] = await Promise.all([
    fetchAll('professionals', proFromRow),
    fetchAll('services', svcFromRow),
    fetchAll('customers', custFromRow),
    fetchAll('appointments', apptFromRow),
    fetchAll('products', prodFromRow),
    fetchAll('cash_sessions', csFromRow),
    fetchAll('cash_movements', cmFromRow),
    fetchAll('forms', formFromRow),
    fetchAll('waitlist', wlFromRow),
    fetchAll('suppliers', supFromRow),
    fetchAll('stock_movements', smFromRow),
    fetchAll('professional_commissions', commFromRow),
    fetchAll('product_sales', vendaFromRow),
    fetchAll('expenses', despFromRow),
    fetchAll('reviews', revFromRow),
    fetchAll('time_off', ausFromRow),
  ]);

  Object.assign(state, { professionals, services, customers, appointments, products, cashSessions, cashMovements, forms, waitlist, suppliers, stockMovements, commissions, sales, expenses, reviews, timeOff });
  // Sem o MBWAY.sql corrido, a tabela nao existe: fica vazio e calado.
  state.pagamentosMbway = await lerPagamentosMbway();
  state.packSales = await lerVendasPacks();
  initialized = true;
  notify();
}

// ─── SLOT GENERATION ──────────────────────────────────────────────────────────
// As horas em que um profissional pode ser marcado num dia: o seu horario
// proprio, se o tiver, senao o da barbearia — e nunca fora do da barbearia.
// Um profissional so de quarta e quinta deixa de aparecer a segunda.
function horasDoDia(dateStr, professionalId, st = state) {
  const dow = new Date(dateStr + 'T00:00:00').getDay();
  const dia = DAY_NAMES[dow];
  const loja = st.business?.openingHours?.find(h => h.day === dia);
  if (!loja || !loja.isOpen) return null;
  const pro = st.professionals?.find(p => p.id === professionalId);
  if (pro && pro.isActive === false) return null;
  // De ferias e de ferias: nesses dias nao ha horas nenhumas com ele.
  if ((st.timeOff || []).some(f => f.professionalId === professionalId && dateStr >= f.startDate && dateStr <= f.endDate)) return null;
  const proprio = Array.isArray(pro?.schedule) ? pro.schedule.find(h => h.day === dia) : null;
  if (proprio && !proprio.isOpen) return null;
  const open = Math.max(toMinutes(loja.open), proprio ? toMinutes(proprio.open) : 0);
  const close = Math.min(toMinutes(loja.close), proprio ? toMinutes(proprio.close) : 24 * 60);
  if (close <= open) return null;
  const pausas = [...(loja.breaks || []), ...(proprio?.breaks || [])]
    .filter(b => b && b.start && b.end)
    .map(b => ({ start: toMinutes(b.start), end: toMinutes(b.end) }));
  return { open, close, pausas };
}

function generateSlotsForDay(dateStr, professionalId, durationMinutes, existingAppointments) {
  const horas = horasDoDia(dateStr, professionalId);
  if (!horas) return [];
  const { open, close, pausas } = horas;
  const slots = [];
  for (let t = open; t + durationMinutes <= close; t += 30) {
    if (pausas.some(b => !(t + durationMinutes <= b.start || t >= b.end))) continue;
    const start = toTime(t), end = toTime(t + durationMinutes);
    const conflict = existingAppointments.some(a =>
      a.professionalId === professionalId && a.date === dateStr && a.status !== 'cancelled' &&
      !(toMinutes(a.endTime) <= t || toMinutes(a.startTime) >= t + durationMinutes)
    );
    slots.push({
      id: `slot_${professionalId}_${dateStr}_${start}`, professionalId,
      date: dateStr, startTime: start, endTime: end,
      isBooked: conflict, isPast: new Date(dateStr + 'T' + start + ':00') < new Date(),
    });
  }
  return slots;
}

// ─── DATA SERVICE ─────────────────────────────────────────────────────────────
const dataService = {
  subscribe(fn) { listeners.add(fn); return () => listeners.delete(fn); },
  getState() { return state; },
  init,
  reset() {
    initialized = false;
    BUSINESS_ID = null;
    state = {
      business: null,
      professionals: [], services: [], customers: [], appointments: [],
      products: [], cashSessions: [], cashMovements: [], forms: [],
      waitlist: [], suppliers: [], stockMovements: [], commissions: [],
      reviews: [], timeOff: [], gallery: [], notifications: [], promotions: [],
      expenses: [], typologies: _defaultTypologies(), comandas: [], sales: [],
      subscriptionPlans: [], subscriptions: [], subscriptionPayments: [],
      loyaltyMovements: [], loyaltyRewards: [],
    };
    notify();
  },

  // ── BUSINESS ──
  getBusiness() { return Promise.resolve(state.business); },
  async updateBusiness(updates) {
    const merged = { ...state.business, ...updates };
    const row = bizToRow(merged);
    const { data, error } = await supabase.from('businesses').update(row).eq('id', BUSINESS_ID).select().single();
    if (error) throw traduzirErro(error);
    state.business = { ...bizFromRow(data), config: state.business.config };
    notify(); return state.business;
  },

  // ── PROFESSIONALS ──
  /**
   * Quantos profissionais cabem no plano e quantos ja la estao.
   * `limite` a null significa sem limite (barbearias antigas).
   * `acima` e o caso de quem ja tinha mais do que o plano permite antes de o
   * limite existir: nao se apaga ninguem, so nao pode acrescentar.
   */
  lugaresDeProfissionais() {
    const limite = state.business?.professionalLimit ?? null;
    const ativos = state.professionals.filter(p => p.isActive !== false).length;
    return {
      limite, ativos,
      plano: state.business?.plan || null,
      cheio: limite != null && ativos >= limite,
      acima: limite != null && ativos > limite,
      restam: limite == null ? null : Math.max(0, limite - ativos),
    };
  },
  listProfessionals() { return Promise.resolve(state.professionals); },
  getProfessional(id) { return Promise.resolve(state.professionals.find(p => p.id === id)); },
  async createProfessional(data) {
    // Primeira barreira, para o barbeiro perceber antes de escrever tudo.
    // A que manda e o gatilho na base de dados.
    const lugares = dataService.lugaresDeProfissionais();
    if (lugares.cheio) {
      throw new Error(`O teu plano permite ${lugares.limite} ${lugares.limite === 1 ? 'profissional' : 'profissionais'} e já tens ${lugares.ativos}. Desativa um, ou fala connosco para mudares de plano.`);
    }
    const row = proToRow({ rating: 0, reviewCount: 0, specialties: [], photoUrl: '', commission: 30, ...data });
    const { data: created, error } = await supabase.from('professionals').insert(row).select().single();
    if (error) throw traduzirErro(error);
    const p = proFromRow(created); state.professionals.push(p); notify(); return p;
  },
  async updateProfessional(id, updates) {
    const existing = state.professionals.find(p => p.id === id);
    const row = proToRow({ ...existing, ...updates });
    const { data, error } = await supabase.from('professionals').update(row).eq('id', id).select().single();
    if (error) throw traduzirErro(error);
    const p = proFromRow(data);
    const i = state.professionals.findIndex(x => x.id === id);
    if (i >= 0) state.professionals[i] = p;
    notify(); return p;
  },
  async deleteProfessional(id) {
    const { error } = await supabase.from('professionals').delete().eq('id', id);
    if (error) throw traduzirErro(error);
    state.professionals = state.professionals.filter(p => p.id !== id); notify(); return true;
  },

  // ── SERVICES ──
  listServices() { return Promise.resolve(state.services); },
  getActiveServices() { return Promise.resolve(state.services.filter(s => s.isActive)); },
  getService(id) { return Promise.resolve(state.services.find(s => s.id === id)); },
  async createService(data) {
    const row = svcToRow({ isActive: true, isPopular: false, ...data });
    const { data: created, error } = await supabase.from('services').insert(row).select().single();
    if (error) throw traduzirErro(error);
    const s = svcFromRow(created); state.services.push(s); notify(); return s;
  },
  async updateService(id, updates) {
    const existing = state.services.find(s => s.id === id);
    const row = svcToRow({ ...existing, ...updates });
    const { data, error } = await supabase.from('services').update(row).eq('id', id).select().single();
    if (error) throw traduzirErro(error);
    const s = svcFromRow(data);
    const i = state.services.findIndex(x => x.id === id);
    if (i >= 0) state.services[i] = s;
    notify(); return s;
  },
  async deleteService(id) {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw traduzirErro(error);
    state.services = state.services.filter(s => s.id !== id); notify(); return true;
  },

  // ── CUSTOMERS ──
  listCustomers() { return Promise.resolve(state.customers); },
  getCustomer(id) { return Promise.resolve(state.customers.find(c => c.id === id)); },
  getCustomerByEmail(email) { return Promise.resolve(state.customers.find(c => c.email?.toLowerCase() === email?.toLowerCase())); },
  async createCustomer(data) {
    const row = custToRow({ totalAppointments: 0, totalSpent: 0, joinedAt: localDateStr(new Date()), lastVisit: null, loyalty: { stamps: 0, totalStamps: 0, rewardsEarned: 0, points: 0 }, pendingStamp: null, pendingReview: null, balance: 0, ...data });
    const { data: created, error } = await supabase.from('customers').insert(row).select().single();
    if (error) throw traduzirErro(error);
    const c = custFromRow(created); state.customers.push(c); notify(); return c;
  },
  async updateCustomer(id, updates) {
    const existing = state.customers.find(c => c.id === id);
    const merged = { ...existing, ...updates };
    const row = custToRow(merged);
    const { data, error } = await supabase.from('customers').update(row).eq('id', id).select().single();
    if (error) throw traduzirErro(error);
    const c = custFromRow(data);
    const i = state.customers.findIndex(x => x.id === id);
    if (i >= 0) state.customers[i] = c;
    notify(); return c;
  },
  async adjustCustomerBalance(id, delta) {
    const c = state.customers.find(x => x.id === id);
    if (c) { c.balance = (c.balance || 0) + Number(delta); await supabase.from('customers').update(custToRow(c)).eq('id', id); notify(); }
    return c;
  },

  // ── APPOINTMENTS ──
  listAppointments() { return Promise.resolve(state.appointments); },
  listAppointmentsByCustomer(customerId) { return Promise.resolve(state.appointments.filter(a => a.customerId === customerId).sort((a,b) => (b.date+b.startTime).localeCompare(a.date+a.startTime))); },
  listAppointmentsByDate(dateStr) { return Promise.resolve(state.appointments.filter(a => a.date === dateStr).sort((a,b) => a.startTime.localeCompare(b.startTime))); },
  getAppointment(id) { return Promise.resolve(state.appointments.find(a => a.id === id)); },
  async createAppointment(data) {
    const base = data.blocked
      ? { businessId: BUSINESS_ID, status: 'blocked', notes: '', createdAt: new Date().toISOString(), bookingRef: null, loyaltyStamped: false, ...data }
      : (() => {
          const snap = buildSnapshot(state, data.serviceId, data.professionalId);
          const a = { businessId: BUSINESS_ID, status: 'pending', notes: '', createdAt: new Date().toISOString(), bookingRef: genBookingRef(), ...snap, loyaltyStamped: false, ...data };
          assertNoConflict(state, a);
          return a;
        })();
    const row = apptToRow(base);
    const { data: created, error } = await supabase.from('appointments').insert(row).select().single();
    if (error) throw traduzirErro(error);
    const a = apptFromRow(created); state.appointments.push(a); notify(); return a;
  },
  async updateAppointment(id, updates) {
    const i = state.appointments.findIndex(a => a.id === id);
    if (i < 0) return null;
    const prev = state.appointments[i].status;
    state.appointments[i] = { ...state.appointments[i], ...updates };
    if (state.appointments[i].status === 'completed' && prev !== 'completed') {
      await addLoyaltyStamp(state.appointments[i]);
    }
    const { error } = await supabase.from('appointments').update(apptToRow(state.appointments[i])).eq('id', id);
    if (error) throw traduzirErro(error);
    notify(); return state.appointments[i];
  },
  async confirmAppointment(id) {
    const a = state.appointments.find(x => x.id === id);
    if (!a || a.status !== 'pending' || !canTransition(a.status, 'confirmed')) return a;
    a.status = 'confirmed'; a.confirmedAt = new Date().toISOString();
    const { error } = await supabase.from('appointments').update(apptToRow(a)).eq('id', id);
    if (error) throw traduzirErro(error);

    // Avisar o cliente. Se falhar, a marcação fica confirmada na mesma — ele
    // vê-a no site; só não recebeu o toque no telemóvel.
    if (a.customerId) {
      enviarPush({
        businessId: BUSINESS_ID,
        para: 'customer',
        userId: a.customerId,
        titulo: `${EMOJI.confirmada} Marcação confirmada`,
        mensagem: corpoDaMarcacao({
          quem: state.business?.name, servico: a.serviceNameSnapshot,
          data: a.date, hora: a.startTime,
        }) + (mbwayParaPagar(a) ? '\nPodes pagar já por MB WAY na app.' : ''),
        url: '/marcacoes',
        tag: 'marcacao-' + id,
      }).catch(e => console.warn('aviso ao cliente não enviado:', e.message));
    }

    notify(); return a;
  },
  // Volta a ler as marcacoes. So as marcacoes: e o que muda sozinho enquanto
  // o painel esta aberto.
  async refreshAppointments() {
    const { data, error } = await supabase.from('appointments')
      .select('*').eq('business_id', BUSINESS_ID);
    if (error) throw new Error(error.message);
    state.appointments = (data || []).map(apptFromRow);
    state.pagamentosMbway = await lerPagamentosMbway();
    state.packSales = await lerVendasPacks();
    notify();
    return state.appointments;
  },

  // ── MB WAY ──
  // O estado do MB WAY de uma marcacao: 'pago' (o barbeiro confirmou),
  // 'por-confirmar' (o cliente diz que enviou) ou null.
  mbwayDe(apptId) {
    const a = state.appointments.find(x => x.id === apptId);
    if (a?.mbway?.estado === 'confirmado') return { estado: 'pago', valor: Number(a.mbway.valor) || 0 };
    const p = (state.pagamentosMbway || []).find(x => x.appointmentId === apptId && x.estado === 'enviado');
    return p ? { estado: 'por-confirmar', valor: p.valor, pagamento: p } : null;
  },
  // Depois de vender, confirmar ou anular um pack (Packs, MB WAY): a Caixa e
  // os relatórios acompanham sem recarregar a página.
  async recarregarVendasPacks() {
    state.packSales = await lerVendasPacks();
    notify(); return state.packSales;
  },
  async recarregarMbway() {
    state.pagamentosMbway = await lerPagamentosMbway();
    notify(); return state.pagamentosMbway;
  },
  async confirmarMbway(pagamentoId) {
    const { data, error } = await supabase.rpc('mbway_confirmar', { p_id: pagamentoId });
    if (error) throw traduzirErro(error);
    const linha = Array.isArray(data) ? data[0] : data;
    const p = state.pagamentosMbway.find(x => x.id === pagamentoId);
    if (p) { p.estado = 'confirmado'; p.resolvidoEm = new Date().toISOString(); }
    const a = state.appointments.find(x => x.id === (linha?.appointment_id || p?.appointmentId));
    if (a) a.mbway = { estado: 'confirmado', valor: Number(linha?.valor ?? p?.valor) || 0, em: new Date().toISOString(), pagamentoId };
    if (p?.customerId) {
      enviarPush({
        businessId: BUSINESS_ID, para: 'customer', userId: p.customerId,
        titulo: '\u{2705} Pagamento recebido',
        mensagem: `${state.business?.name || 'A barbearia'}\nO teu MB WAY de ${String((p.valor || 0).toFixed(2)).replace('.', ',')} € chegou. A marcação está paga.`,
        url: '/marcacoes', tag: 'mbway-' + pagamentoId,
      }).catch(e => console.warn('aviso ao cliente não enviado:', e.message));
    }
    notify(); return p;
  },
  async rejeitarMbway(pagamentoId, motivo = '') {
    const { error } = await supabase.rpc('mbway_rejeitar', { p_id: pagamentoId, p_motivo: motivo || null });
    if (error) throw traduzirErro(error);
    const p = state.pagamentosMbway.find(x => x.id === pagamentoId);
    if (p) { p.estado = 'rejeitado'; p.motivo = motivo; p.resolvidoEm = new Date().toISOString(); }
    const a = p && state.appointments.find(x => x.id === p.appointmentId);
    if (a && a.mbway?.pagamentoId === pagamentoId) a.mbway = null;
    if (p?.customerId) {
      enviarPush({
        businessId: BUSINESS_ID, para: 'customer', userId: p.customerId,
        titulo: 'MB WAY não recebido',
        mensagem: `${state.business?.name || 'A barbearia'}\n${motivo || 'O pagamento não chegou. Paga na barbearia ou envia de novo.'}`,
        url: '/marcacoes', tag: 'mbway-' + pagamentoId,
      }).catch(e => console.warn('aviso ao cliente não enviado:', e.message));
    }
    notify(); return p;
  },
  // O print guardado no bucket privado: um link que dura 10 minutos.
  async urlDoComprovativo(caminho) {
    if (!caminho) return null;
    const { data, error } = await supabase.storage.from('comprovativos').createSignedUrl(caminho, 600);
    if (error) return null;
    return data?.signedUrl || null;
  },
  // Os prints tem nome e telemovel de quem pagou. 90 dias depois de o
  // pagamento ser tratado, apagam-se.
  async apagarComprovativosAntigos() {
    const limite = Date.now() - 90 * 86400000;
    const velhos = (state.pagamentosMbway || []).filter(p =>
      p.comprovativo && p.estado !== 'enviado' && p.resolvidoEm && new Date(p.resolvidoEm).getTime() < limite);
    for (const p of velhos) {
      const { error } = await supabase.storage.from('comprovativos').remove([p.comprovativo]);
      if (error) { console.warn('print não apagado:', error.message); continue; }
      await supabase.rpc('mbway_esquecer_comprovativo', { p_id: p.id });
      p.comprovativo = null;
    }
    if (velhos.length) notify();
    return velhos.length;
  },
  async cancelAppointment(id, opts = {}) {
    const a = state.appointments.find(x => x.id === id);
    if (!a || !canTransition(a.status, 'cancelled')) return a;
    if (a.status === 'completed' && a.payment) {
      state.commissions = (state.commissions || []).filter(c => c.appointmentId !== id);
      await supabase.from('professional_commissions').delete().eq('appointment_id', id);
      if (a.loyaltyStamped) {
        const cust = state.customers.find(c => c.id === a.customerId);
        if (cust?.loyalty) {
          cust.loyalty.stamps = Math.max(0, (cust.loyalty.stamps||0) - 1);
          cust.loyalty.totalStamps = Math.max(0, (cust.loyalty.totalStamps||0) - 1);
          cust.loyalty.points = Math.max(0, (cust.loyalty.points||0) - 1);
          a.loyaltyStamped = false;
        }
      }
      recomputeCustomer(a.customerId);
    }
    a.status = 'cancelled'; a.cancelledAt = new Date().toISOString(); a.cancelledBy = 'barbearia';
    if (opts.motivo) a.cancelReason = opts.motivo;
    const { error } = await supabase.from('appointments').update(apptToRow(a)).eq('id', id);
    if (error) throw traduzirErro(error);

    // Quem cancela sabe; quem fica à espera é que precisa de ser avisado.
    if (a.customerId) {
      enviarPush({
        businessId: BUSINESS_ID,
        para: 'customer',
        userId: a.customerId,
        titulo: `${EMOJI.cancelada} Marcação cancelada`,
        mensagem: corpoDaMarcacao({
          quem: state.business?.name, servico: a.serviceNameSnapshot,
          data: a.date, hora: a.startTime,
        }) + (opts.motivo ? ` ${opts.motivo}` : ''),
        url: '/marcacoes',
        tag: 'marcacao-' + id,
        exigeAccao: true,
      }).catch(e => console.warn('aviso ao cliente não enviado:', e.message));
    }

    notify(); return a;
  },
  async deleteAppointment(id) {
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) throw traduzirErro(error);
    state.appointments = state.appointments.filter(a => a.id !== id); notify(); return true;
  },
  async checkoutAppointment(apptId, payData) {
    const a = state.appointments.find(x => x.id === apptId);
    if (!a || (a.status === 'completed' && a.payment)) return a;
    if (a.status !== 'confirmed' && a.status !== 'completed') return a;
    const svc = state.services.find(s => s.id === a.serviceId);
    const pro = state.professionals.find(p => p.id === a.professionalId);
    // Corte gratis: o cliente escolheu gastar um do cartao ao marcar. O
    // preco e zero e a recompensa e consumida — se so se descontasse na
    // cabeca do barbeiro, o mesmo corte gratis era usado tres vezes.
    const base = precoDaMarcacao(a, svc);
    const discountAmount = round2(Number(payData.discountAmount) || 0);
    const net = round2(Math.max(0, base - discountAmount));
    const tip = round2(Number(payData.tip) || 0);
    const total = round2(net + tip);
    const pct = pro?.commission || 0;
    // Corte de pack: o cliente pagou o pack à cabeça, e aqui fica a 0 €. O
    // barbeiro ganha a percentagem dele sobre o valor do corte no pack
    // (preço pago ÷ cortes) — decisão de 21/09. A receita continua 0: já
    // contou no dia da venda do pack.
    const baseComissao = a.usaPack ? valorDoCortePack(state, a) : net;
    const commissionAmount = round2(baseComissao * pct / 100);
    a.status = 'completed'; a.completedAt = new Date().toISOString();
    a.paymentMethod = payData.method;
    a.payment = { ...payData, baseAmount: round2(base), discountAmount, net, tip, total, at: new Date().toISOString() };
    // Persist commission
    const commRow = { business_id: BUSINESS_ID, appointment_id: apptId, professional_id: a.professionalId, base_amount: baseComissao, percentage: pct, amount: commissionAmount, status: 'accrued', metadata: { professionalNameSnapshot: a.professionalNameSnapshot || pro?.name, serviceNameSnapshot: a.serviceNameSnapshot, tip, ...(a.usaPack ? { pack: true, pacoteId: a.pacoteId } : {}) } };
    // O erro desta gravacao nunca era lido. A tabela estava trocada com a do
    // CRM e falhava sempre — nenhuma comissao chegou a ser gravada, e o ecra
    // de Comissoes mostrava sempre vazio sem nunca dar sinal de nada.
    const { data: commCreated, error: erroComissao } = await supabase
      .from('professional_commissions').insert(commRow).select().single();
    if (erroComissao) {
      console.error('comissao nao gravada:', erroComissao.message);
      // O pagamento fica feito; a comissao fica a faltar. Quem esta ao balcao
      // tem de saber, senao descobre ao fim do mes quando paga a menos.
      a.payment.comissaoPorGravar = true;
    }
    const comm = commCreated ? commFromRow(commCreated) : null;
    if (!state.commissions) state.commissions = [];
    if (comm) state.commissions.push(comm);
    // A percentagem fica gravada dentro da propria marcacao. Mudar a comissao
    // de um barbeiro amanha nao altera o que ja foi feito hoje.
    a.payment.commission = { percentage: pct, baseAmount: baseComissao, commissionAmount };
    a.payment.commissionId = comm?.id || null;
    // Update appointment. Este erro nunca era lido: se a gravacao falhasse, o
    // ecra dizia "concluida", a comissao ja estava gravada e, ao recarregar,
    // a marcacao voltava a aparecer por fechar — e fechava-se outra vez, com
    // segunda comissao. Agora, se falha, desfaz-se tudo e diz-se ao balcao.
    const { error: erroMarcacao } = await supabase
      .from('appointments').update(apptToRow(a)).eq('id', apptId);
    if (erroMarcacao) {
      if (comm?.id) {
        await supabase.from('professional_commissions').delete().eq('id', comm.id);
        state.commissions = state.commissions.filter(c => c.id !== comm.id);
      }
      a.status = 'confirmed'; a.completedAt = null; a.paymentMethod = null; a.payment = null;
      notify();
      throw traduzirErro(erroMarcacao);
    }
    recomputeCustomer(a.customerId);

    if (a.usaRecompensa) {
      // A recompensa ja foi gasta no momento da marcacao, pela base de dados.
      // Descontar outra vez aqui tirava dois premios por um corte.
      // Um corte gratis tambem nao carimba: senao o cartao alimentava-se a si
      // proprio e o corte gratis dava direito ao seguinte, para sempre.
    } else {
      await addLoyaltyStamp(a, a.payment.at);
    }
    const updCust = state.customers.find(c => c.id === a.customerId);
    if (updCust) {
      const updRow = custToRow(updCust);
      await supabase.from('customers').update({
        total_visits: updRow.total_visits,
        total_spent: updRow.total_spent,
        metadata: updRow.metadata,
      }).eq('id', a.customerId);
    }
    notify(); return a;
  },
  async rescheduleAppointment(id, newDate, newStartTime) {
    const a = state.appointments.find(x => x.id === id);
    if (!a) return a;
    const dur = appointmentDuration(state, a);
    const endTime = toTime(toMinutes(newStartTime) + dur);
    assertNoConflict(state, { professionalId: a.professionalId, date: newDate, startTime: newStartTime, endTime, excludeId: id });
    a.rescheduleHistory = [...(a.rescheduleHistory||[]), { from: { date: a.date, startTime: a.startTime, endTime: a.endTime }, to: { date: newDate, startTime: newStartTime, endTime }, at: new Date().toISOString() }];
    a.date = newDate; a.startTime = newStartTime; a.endTime = endTime;
    const { error } = await supabase.from('appointments').update(apptToRow(a)).eq('id', id);
    if (error) throw traduzirErro(error);
    notify(); return a;
  },
  markAttended(id) {
    const a = state.appointments.find(x => x.id === id);
    if (a && a.status === 'confirmed') { a.attendedAt = new Date().toISOString(); notify(); }
    return Promise.resolve(a);
  },
  setAppointmentPayment(apptId, method) {
    const a = state.appointments.find(x => x.id === apptId);
    if (a) { a.paymentMethod = method; notify(); } return Promise.resolve(a);
  },

  // ── CASH REGISTER ──
  listCashSessions() { return Promise.resolve([...state.cashSessions].sort((a,b) => (b.openedAt||'').localeCompare(a.openedAt||''))); },
  getOpenCashSession() { return Promise.resolve(state.cashSessions.find(s => s.status === 'open') || null); },
  async openCashSession(openingBalance) {
    const row = { business_id: BUSINESS_ID, opening_balance: Number(openingBalance)||0, status: 'open', opened_at: new Date().toISOString() };
    const { data, error } = await supabase.from('cash_sessions').insert(row).select().single();
    if (error) throw traduzirErro(error);
    const s = csFromRow(data); state.cashSessions.unshift(s); notify(); return s;
  },
  async closeCashSession(id, countedCash, notes) {
    const s = state.cashSessions.find(x => x.id === id);
    if (s) {
      Object.assign(s, { status: 'closed', closedAt: new Date().toISOString(), countedCash: Number(countedCash)||0, notes: notes||'' });
      await supabase.from('cash_sessions').update({ status: 'closed', closed_at: s.closedAt, closing_balance: s.countedCash, metadata: { countedCash: s.countedCash, notes: s.notes } }).eq('id', id);
      notify();
    }
    return s;
  },
  listCashMovements() { return Promise.resolve([...state.cashMovements].sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''))); },
  async addCashMovement(data) {
    // Um movimento de caixa pertence sempre a uma sessao — e a base de dados
    // exige-o. Quem chama nem sempre a tem a mao (a venda avulsa, por
    // exemplo), por isso vai-se buscar a que esta aberta. Sem nenhuma aberta,
    // diz-se porque em vez de deixar a base de dados responder em ingles.
    const sessao = data.sessionId || data.cashSessionId
      || (state.cashSessions.find(s => s.status === 'open') || {}).id;
    if (!sessao) throw new Error('A caixa está fechada. Abre a caixa para registar movimentos em dinheiro.');
    const row = { business_id: BUSINESS_ID, cash_session_id: sessao, payment_id: data.paymentId || null, type: data.type, amount: data.amount || 0, description: data.description || null };
    const { data: created, error } = await supabase.from('cash_movements').insert(row).select().single();
    if (error) throw traduzirErro(error);
    const m = cmFromRow(created); state.cashMovements.push(m); notify(); return m;
  },
  async deleteCashMovement(id) {
    const { error } = await supabase.from('cash_movements').delete().eq('id', id);
    if (error) throw traduzirErro(error);
    state.cashMovements = state.cashMovements.filter(m => m.id !== id); notify(); return true;
  },

  // ── PRODUCTS ──
  listProducts() { return Promise.resolve([...state.products]); },
  async createProduct(data) {
    const row = prodToRow({ stock: 0, minStock: 5, cost: 0, ...data });
    const { data: created, error } = await supabase.from('products').insert(row).select().single();
    if (error) throw traduzirErro(error);
    const p = prodFromRow(created); state.products.push(p); notify(); return p;
  },
  async updateProduct(id, updates) {
    const existing = state.products.find(p => p.id === id);
    const row = prodToRow({ ...existing, ...updates });
    const { data, error } = await supabase.from('products').update(row).eq('id', id).select().single();
    if (error) throw traduzirErro(error);
    const p = prodFromRow(data);
    const i = state.products.findIndex(x => x.id === id);
    if (i >= 0) state.products[i] = p;
    notify(); return p;
  },
  async deleteProduct(id) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw traduzirErro(error);
    state.products = state.products.filter(p => p.id !== id); notify(); return true;
  },
  /*
   * Ajustar stock. Quando e uma COMPRA (entrada com custo), fica tambem
   * registada como despesa — senao o stock sobe, o dinheiro sai da mao do
   * barbeiro e as contas do mes nao sabem dele.
   */
  async adjustStock(id, delta, reason, opts = {}) {
    const p = state.products.find(x => x.id === id);
    if (!p) return p;
    const d = Number(delta) || 0;
    const custo = Number(opts.custo) || 0;
    const antes = Number(p.stock) || 0;
    p.stock = Math.max(0, antes + d);

    // Uma compra traz o custo consigo. Sem isto, o "valor de stock" ficava
    // na mesma: compravam-se 10 unidades por 30 euros e o inventario
    // continuava a valer zero, porque o custo unitario nunca era escrito.
    // Media ponderada: o que ja la estava ao custo antigo, o que entrou ao novo.
    if (d > 0 && custo > 0) {
      const custoAntigo = Number(p.cost) || 0;
      const novo = (antes > 0 && custoAntigo > 0)
        ? ((antes * custoAntigo) + custo) / (antes + d)
        : custo / d;
      p.cost = Math.round(novo * 100) / 100;
    }

    await supabase.from('products').update(prodToRow(p)).eq('id', id);
    const { data: mv } = await supabase.from('stock_movements').insert({ business_id: BUSINESS_ID, product_id: id, quantity: Math.abs(delta), type: delta >= 0 ? 'in' : 'out', reference: reason || '' }).select().single();
    if (mv) state.stockMovements.push(smFromRow(mv));

    if (delta > 0 && custo > 0) {
      const sessao = state.cashSessions.find(s => s.status === 'open') || null;
      try {
        await dataService.addExpense(sessao?.id || null, {
          description: `Compra de ${p.name} (${Math.abs(delta)} ${p.unit || 'un'})`,
          category: 'Fornecedores',
          amount: custo,
          method: opts.method || null,
        });
      } catch (e) { console.warn('compra não registada em despesas:', e.message); }
    }
    notify();
    return p;
  },
  /*
   * FERIAS E AUSENCIAS
   *
   * Um periodo de dias inteiros em que o barbeiro nao trabalha. Nesses dias
   * ele nao tem horas para marcar — nem aqui nem no site do cliente, que le
   * as mesmas datas pela vista publica.
   *
   * Ao criar, as marcacoes que caem dentro sao canceladas e o cliente e
   * avisado, com o motivo. Sem isto, o barbeiro ia de ferias e os clientes
   * apareciam a porta fechada.
   */
  listTimeOff() {
    return Promise.resolve([...(state.timeOff || [])]
      .sort((a, b) => (b.startDate || '').localeCompare(a.startDate || '')));
  },
  marcacoesNoPeriodo(professionalId, de, ate) {
    return (state.appointments || []).filter(a =>
      a.professionalId === professionalId &&
      a.date >= de && a.date <= ate &&
      !a.blocked &&
      (a.status === 'pending' || a.status === 'confirmed'));
  },
  async createTimeOff({ professionalId, startDate, endDate, reason }) {
    if (!professionalId || !startDate || !endDate) throw new Error('Falta o profissional ou as datas.');
    if (endDate < startDate) throw new Error('O último dia não pode ser antes do primeiro.');
    const row = {
      business_id: BUSINESS_ID, professional_id: professionalId,
      start_date: startDate, end_date: endDate, reason: (reason || '').trim() || null,
    };
    const { data, error } = await supabase.from('time_off').insert(row).select().single();
    if (error) {
      if (/ausencias_sem_sobreposicao/.test(error.message || '')) {
        throw new Error('Este profissional já tem uma ausência marcada que apanha estes dias.');
      }
      if (/time_off/.test(error.message || '') && /does not exist|schema cache/.test(error.message || '')) {
        throw new Error('A base de dados ainda não tem as ausências. Falta correr supabase/FERIAS.sql.');
      }
      throw traduzirErro(error);
    }
    const f = ausFromRow(data);
    state.timeOff = [...(state.timeOff || []), f];

    // O que estava marcado para estes dias deixa de poder acontecer.
    const pro = state.professionals.find(p => p.id === professionalId);
    const apanhadas = dataService.marcacoesNoPeriodo(professionalId, startDate, endDate);
    let canceladas = 0, porCancelar = [];
    for (const a of apanhadas) {
      try {
        await dataService.cancelAppointment(a.id, {
          motivo: `${pro?.name || 'O profissional'} vai estar ausente nesse dia.`,
        });
        canceladas++;
      } catch (e) { porCancelar.push(a); }
    }
    notify();
    return { ferias: f, canceladas, porCancelar };
  },
  async deleteTimeOff(id) {
    const { error } = await supabase.from('time_off').delete().eq('id', id);
    if (error) throw traduzirErro(error);
    state.timeOff = (state.timeOff || []).filter(f => f.id !== id);
    notify(); return true;
  },
  // O profissional esta ausente neste dia?
  ausenciaEm(professionalId, dateStr) {
    return (state.timeOff || []).find(f => f.professionalId === professionalId && dateStr >= f.startDate && dateStr <= f.endDate) || null;
  },

  listStockMovements() { return Promise.resolve([...state.stockMovements].sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''))); },

  // ── FORMS ──
  getForms() { return Promise.resolve([...state.forms]); },
  async saveForm(form) {
    const existing = state.forms.find(f => f.id === form.id);
    const row = { business_id: BUSINESS_ID, name: form.name, fields: form.questions || form.fields || [], is_active: form.active !== false };
    if (existing) {
      const { data, error } = await supabase.from('forms').update(row).eq('id', form.id).select().single();
      if (error) throw traduzirErro(error);
      const f = formFromRow(data);
      const i = state.forms.findIndex(x => x.id === form.id);
      if (i >= 0) state.forms[i] = f;
      notify(); return f;
    } else {
      const { data, error } = await supabase.from('forms').insert(row).select().single();
      if (error) throw traduzirErro(error);
      const f = formFromRow(data); state.forms.push(f); notify(); return f;
    }
  },
  async deleteForm(id) {
    const { error } = await supabase.from('forms').delete().eq('id', id);
    if (error) throw traduzirErro(error);
    state.forms = state.forms.filter(f => f.id !== id); notify(); return true;
  },

  // ── WAITLIST ──
  listWaitlist() { return Promise.resolve([...state.waitlist].sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''))); },
  async addWaitlist(data) {
    const row = { business_id: BUSINESS_ID, customer_id: data.customerId || null, service_id: data.serviceId || null, preferred_date: data.preferredDate || null, status: 'waiting', metadata: { priority: data.priority || 'normal' } };
    const { data: created, error } = await supabase.from('waitlist').insert(row).select().single();
    if (error) throw traduzirErro(error);
    const w = wlFromRow(created); state.waitlist.push(w); notify(); return w;
  },
  async updateWaitlist(id, updates) {
    const existing = state.waitlist.find(w => w.id === id);
    const merged = { ...existing, ...updates };
    const { data, error } = await supabase.from('waitlist').update({ status: merged.status, preferred_date: merged.preferredDate || null, metadata: { priority: merged.priority } }).eq('id', id).select().single();
    if (error) throw traduzirErro(error);
    const w = wlFromRow(data);
    const i = state.waitlist.findIndex(x => x.id === id);
    if (i >= 0) state.waitlist[i] = w;
    notify(); return w;
  },
  async removeWaitlist(id) {
    const { error } = await supabase.from('waitlist').delete().eq('id', id);
    if (error) throw traduzirErro(error);
    state.waitlist = state.waitlist.filter(w => w.id !== id); notify(); return true;
  },

  // ── SUPPLIERS ──
  listSuppliers() { return Promise.resolve([...state.suppliers]); },
  async createSupplier(data) {
    const { data: created, error } = await supabase.from('suppliers').insert({ business_id: BUSINESS_ID, name: data.name, contact: data.contact || null, email: data.email || null, phone: data.phone || null, is_active: true }).select().single();
    if (error) throw traduzirErro(error);
    const s = supFromRow(created); state.suppliers.push(s); notify(); return s;
  },
  async updateSupplier(id, updates) {
    const { data, error } = await supabase.from('suppliers').update({ name: updates.name, contact: updates.contact || null, email: updates.email || null, phone: updates.phone || null }).eq('id', id).select().single();
    if (error) throw traduzirErro(error);
    const s = supFromRow(data);
    const i = state.suppliers.findIndex(x => x.id === id);
    if (i >= 0) state.suppliers[i] = s;
    notify(); return s;
  },
  async deleteSupplier(id) {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) throw traduzirErro(error);
    state.suppliers = state.suppliers.filter(s => s.id !== id); notify(); return true;
  },

  // ── CONFIG ──
  getConfig() { return Promise.resolve(state.business?.config); },
  async updateConfig(section, updates) {
    const currentCfg = state.business?.config || {};
    const newSection = { ...(currentCfg[section] || {}), ...updates };
    state.business.config = { ...currentCfg, [section]: newSection };
    const { data: existing } = await supabase.from('config').select('id').eq('business_id', BUSINESS_ID).maybeSingle();
    if (existing) {
      await supabase.from('config').update({ [section]: newSection }).eq('business_id', BUSINESS_ID);
    } else {
      await supabase.from('config').insert({ business_id: BUSINESS_ID, [section]: newSection });
    }
    // A confirmacao automatica tem de chegar ao site do cliente, e o site do
    // cliente nao le a tabela config (nem deve — ha la coisas que nao sao da
    // conta de quem vai marcar). Espelha-se so este valor no settings da
    // barbearia, que ja e publico.
    // Cada um destes e uma decisao do dono da barbearia que muda o que o
    // cliente ve. Ficarem so aqui era o mesmo que nao existirem: o site
    // continuava com os valores escritos no codigo.
    const ESPELHADOS = {
      autoConfirm: v => v === true,
      allowClientCancel: v => v !== false,
      cancelMinHours: v => Math.max(0, Number(v) || 0),
    };
    const mudados = Object.keys(ESPELHADOS).filter(k =>
      Object.prototype.hasOwnProperty.call(updates, k));
    if (section === 'params' && mudados.length) {
      try {
        const { data: b } = await supabase.from('businesses').select('settings').eq('id', BUSINESS_ID).maybeSingle();
        const novas = { ...(b?.settings || {}) };
        mudados.forEach(k => { novas[k] = ESPELHADOS[k](updates[k]); });
        await supabase.from('businesses').update({ settings: novas }).eq('id', BUSINESS_ID);
      } catch (e) { console.error('parametros nao espelhados para o site:', e.message); }
    }
    notify(); return state.business.config;
  },

  // ── COMMISSIONS ──
  listCommissions() { return Promise.resolve([...(state.commissions||[])]); },
  /*
   * Despesas. Viviam na memoria do browser: escrevia-se, fechava-se o
   * separador, desapareciam. Nao precisam da caixa aberta — uma factura de
   * fornecedor e uma despesa a qualquer hora; quando a caixa esta aberta e o
   * pagamento e em dinheiro, fica ligada a sessao e sai tambem da caixa.
   */
  listExpenses(sessionId) {
    const todas = [...(state.expenses || [])].sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
    return Promise.resolve(sessionId ? todas.filter(e => e.sessionId === sessionId) : todas);
  },
  async addExpense(sessionId, data) {
    const row = {
      business_id: BUSINESS_ID,
      cash_session_id: sessionId || null,
      description: data.description || '',
      category: data.category || null,
      amount: Number(data.amount) || 0,
      method: data.method || null,
      spent_at: data.date || localDateStr(new Date()),
    };
    const { data: created, error } = await supabase.from('expenses').insert(row).select().single();
    if (error) throw traduzirErro(error);
    const e = despFromRow(created);
    if (!state.expenses) state.expenses = [];
    state.expenses.push(e);

    // A despesa ja esta escrita na tabela das despesas, e e de la que a caixa
    // a le. Criar tambem um movimento de caixa fazia-a sair duas vezes da
    // gaveta — uma pela despesa, outra pelo movimento que ela gerava.
    // Os movimentos de caixa ficam so para o que e mesmo avulso: sangrias e
    // reforcos de fundo.
    notify(); return e;
  },
  async deleteExpense(id) {
    const { error } = await supabase.from('expenses').delete().eq('id', id);
    if (error) throw traduzirErro(error);
    state.expenses = (state.expenses || []).filter(e => e.id !== id);
    notify(); return true;
  },

  // ── SLOTS ──
  getAvailableSlots(dateStr, professionalId, durationMinutes) {
    const appts = state.appointments.filter(a => a.status !== 'cancelled');
    if (professionalId === 'any') {
      const map = new Map();
      state.professionals.filter(p => p.isActive !== false).forEach(p => {
        generateSlotsForDay(dateStr, p.id, durationMinutes, appts).forEach(s => {
          if (!s.isBooked && !s.isPast) {
            if (!map.has(s.startTime)) map.set(s.startTime, { ...s, professionalId: 'any', availablePros: [p.id] });
            else map.get(s.startTime).availablePros.push(p.id);
          }
        });
      });
      return Promise.resolve(Array.from(map.values()).sort((a,b) => a.startTime.localeCompare(b.startTime)));
    }
    return Promise.resolve(generateSlotsForDay(dateStr, professionalId, durationMinutes, appts));
  },
  assignProfessionalForSlot(dateStr, startTime, durationMinutes) {
    const appts = state.appointments.filter(a => a.status !== 'cancelled');
    // Quem esta de ferias nao entra no sorteio — nem como ultimo recurso.
    const disponiveis = state.professionals.filter(p => p.isActive !== false && !dataService.ausenciaEm(p.id, dateStr));
    let best = null, bestCount = -1;
    disponiveis.forEach(p => {
      const slots = generateSlotsForDay(dateStr, p.id, durationMinutes, appts);
      const avail = slots.filter(s => !s.isBooked && !s.isPast && s.startTime === startTime);
      const total = slots.filter(s => !s.isBooked && !s.isPast).length;
      if (avail.length > 0 && total > bestCount) { best = p; bestCount = total; }
    });
    return Promise.resolve(best || disponiveis[0] || null);
  },

  // ── LOYALTY ──
  getLoyaltyCardConfig() { return loyaltyCardConfig(); },
  // Guardar e em settings.loyalty, pela pagina Fidelizacao (updateBusiness).
  saveLoyaltyCardConfig(cfg) {
    return dataService.updateBusiness({ loyalty: { ...(state.business?.loyalty || {}),
      ativo: cfg.enabled !== false, stampsNeeded: Math.max(3, Math.min(20, Number(cfg.totalStamps) || 10)), rewardName: cfg.reward } })
      .then(() => loyaltyCardConfig());
  },
  getLoyaltyProgram() {
    const card = loyaltyCardConfig();
    return { ...(state.business?.loyalty||{}), stampsThreshold: card.totalStamps, rewardName: card.reward };
  },
  saveLoyaltyProgram(cfg) {
    const card = loyaltyCardConfig();
    const totalStamps = Math.max(3, Math.min(20, Number(cfg.stampsThreshold)||card.totalStamps));
    const nextCard = { ...card, totalStamps, reward: cfg.rewardName ?? card.reward };
    localStorage.setItem('convecta_loyalty_card_config', JSON.stringify(nextCard));
    if (state.business) state.business.config = { ...state.business.config, loyalty: { ...(state.business.config.loyalty||{}), ...cfg, stampsThreshold: totalStamps, rewardName: nextCard.reward } };
    notify(); return Promise.resolve({ ...state.business?.config?.loyalty });
  },
  clearPendingStamp(customerId) { const c = state.customers.find(x => x.id === customerId); if (c) { c.pendingStamp = null; notify(); } return Promise.resolve(true); },
  clearPendingReview(customerId) { const c = state.customers.find(x => x.id === customerId); if (c) { c.pendingReview = null; notify(); } return Promise.resolve(true); },
  listLoyaltyMovements() { return Promise.resolve([...(state.loyaltyMovements||[])].sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''))); },
  addLoyaltyMovement(data) { const m = { id: uid('lm'), createdAt: new Date().toISOString(), ...data }; if (!state.loyaltyMovements) state.loyaltyMovements = []; state.loyaltyMovements.push(m); notify(); return Promise.resolve(m); },
  listLoyaltyRewards() { return Promise.resolve([...(state.loyaltyRewards||[])]); },
  createLoyaltyReward(data) { const r = { id: uid('rw'), active: true, ...data }; if (!state.loyaltyRewards) state.loyaltyRewards = []; state.loyaltyRewards.push(r); notify(); return Promise.resolve(r); },
  updateLoyaltyReward(id, updates) { const i = (state.loyaltyRewards||[]).findIndex(r => r.id === id); if (i >= 0) state.loyaltyRewards[i] = { ...state.loyaltyRewards[i], ...updates }; notify(); return Promise.resolve(state.loyaltyRewards[i]); },
  deleteLoyaltyReward(id) { state.loyaltyRewards = (state.loyaltyRewards||[]).filter(r => r.id !== id); notify(); return Promise.resolve(true); },

  // ── IN-MEMORY (não migrados nesta fase) ──
  /*
   * AVALIACOES. Eram um cenario: o cliente dava estrelas na app dele, ficava
   * na memoria do browser dele, e este ecra ficava vazio para sempre. Agora
   * vem da tabela `reviews` — quem as escreve e o cliente, pela funcao da
   * base de dados, e aqui so se aprova, esconde ou apaga.
   */
  listVisibleReviews() { return Promise.resolve((state.reviews||[]).filter(r => r.isVisible)); },
  listReviewsByProfessional(id) { return Promise.resolve((state.reviews||[]).filter(r => r.professionalId === id && r.isVisible)); },
  listAllReviews() { return Promise.resolve([...(state.reviews||[])].sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''))); },
  async updateReview(id, updates) {
    const row = {};
    if (updates.isVisible !== undefined) row.is_visible = !!updates.isVisible;
    if (updates.comment !== undefined) row.comment = updates.comment;
    const { data, error } = await supabase.from('reviews').update(row).eq('id', id).select().single();
    if (error) throw traduzirErro(error);
    const r = revFromRow(data);
    // Trocar a lista inteira, e nao so a posicao: o ecra das Avaliacoes so
    // refaz as contas quando a lista muda de identidade. A mexer na posicao,
    // a base de dados ficava certa e o ecra continuava a dizer "Por ler".
    state.reviews = (state.reviews || []).map(x => (x.id === id ? r : x));
    notify(); return r;
  },
  async deleteReview(id) {
    const { error } = await supabase.from('reviews').delete().eq('id', id);
    if (error) throw traduzirErro(error);
    state.reviews = (state.reviews||[]).filter(r => r.id !== id);
    notify(); return true;
  },
  // GALLERY
  listGallery() { return Promise.resolve((state.gallery||[]).sort((a,b) => a.order - b.order)); },
  // NOTIFICATIONS
  // ── Avisos aos clientes ───────────────────────────────────────────────
  // Escreviam-se so na memoria deste browser. A app do cliente lia a memoria
  // do browser do cliente, sempre vazia. Nunca estiveram ligados: era um
  // mural que so o proprio via. Agora vao para a base de dados, e quem tiver
  // notificacoes ligadas recebe tambem um aviso no telemovel.
  async listNotifications() {
    const { data, error } = await supabase.from('notifications')
      .select('*').eq('business_id', BUSINESS_ID).order('created_at', { ascending: false });
    if (error) { console.error('avisos nao carregados:', error.message); return state.notifications || []; }
    state.notifications = (data || []).map(notifFromRow);
    return state.notifications;
  },
  async createNotification(data) {
    const { data: criado, error } = await supabase.from('notifications').insert({
      business_id: BUSINESS_ID,
      title: data.title, message: data.message || '',
      type: data.type || 'info', is_active: true,
    }).select().single();
    if (error) throw new Error(error.message);
    const n = notifFromRow(criado);
    if (!state.notifications) state.notifications = [];
    state.notifications.unshift(n);

    // Tocar o telemovel de quem ligou as notificacoes. Se falhar, o aviso
    // fica na mesma na aba Avisos — so nao foi tocada a campainha.
    enviarPush({
      businessId: BUSINESS_ID,
      para: 'customer',
      titulo: `${EMOJI_AVISO[n.type] || EMOJI_AVISO.info} ${n.title}`,
      mensagem: n.message,
      url: '/avisos',
      tag: 'aviso-' + n.id,
    }).catch(e => console.warn('aviso não enviado por push:', e.message));

    notify(); return n;
  },
  async updateNotification(id, updates) {
    const linha = {};
    if (updates.title != null) linha.title = updates.title;
    if (updates.message != null) linha.message = updates.message;
    if (updates.type != null) linha.type = updates.type;
    if (updates.active != null) linha.is_active = updates.active;
    const { data, error } = await supabase.from('notifications').update(linha).eq('id', id).select().single();
    if (error) throw new Error(error.message);
    const i = (state.notifications || []).findIndex(n => n.id === id);
    if (i >= 0) state.notifications[i] = notifFromRow(data);
    notify(); return state.notifications[i];
  },
  async toggleNotification(id) {
    const n = (state.notifications || []).find(x => x.id === id);
    if (!n) return n;
    return dataService.updateNotification(id, { active: !n.active });
  },
  async deleteNotification(id) {
    const { error } = await supabase.from('notifications').delete().eq('id', id);
    if (error) throw new Error(error.message);
    state.notifications = (state.notifications || []).filter(n => n.id !== id);
    notify(); return true;
  },
  listNotificationsForCustomer(customerId) { return Promise.resolve((state.notifications||[]).filter(n => n.active).sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||'')).map(n => ({ ...n, read: (n.readBy||[]).includes(customerId) }))); },
  markNotificationRead(customerId, id) { const n = (state.notifications||[]).find(x => x.id === id); if (n && !(n.readBy||[]).includes(customerId)) { n.readBy = [...(n.readBy||[]), customerId]; notify(); } return Promise.resolve(true); },
  markAllNotificationsRead(customerId) { (state.notifications||[]).forEach(n => { if (n.active && !(n.readBy||[]).includes(customerId)) n.readBy = [...(n.readBy||[]), customerId]; }); notify(); return Promise.resolve(true); },
  unreadCountForCustomer(customerId) { return (state.notifications||[]).filter(n => n.active && !(n.readBy||[]).includes(customerId)).length; },
  // PROMOTIONS
  listPromotions() { return Promise.resolve([...(state.promotions||[])]); },
  createPromotion(data) { const m = { id: uid('pm'), active: true, ...data }; if (!state.promotions) state.promotions=[]; state.promotions.push(m); notify(); return Promise.resolve(m); },
  updatePromotion(id, updates) { const i = (state.promotions||[]).findIndex(p => p.id === id); if (i >= 0) state.promotions[i] = { ...state.promotions[i], ...updates }; notify(); return Promise.resolve(state.promotions[i]); },
  togglePromotion(id) { const m = (state.promotions||[]).find(x => x.id === id); if (m) { m.active = !m.active; notify(); } return Promise.resolve(m); },
  deletePromotion(id) { state.promotions = (state.promotions||[]).filter(p => p.id !== id); notify(); return Promise.resolve(true); },
  // TYPOLOGIES
  listTypology(kind) { return Promise.resolve([...((state.typologies||{})[kind]||[])]); },
  addTypology(kind, name) { if (!state.typologies) state.typologies={}; if (!state.typologies[kind]) state.typologies[kind]=[]; const t = { id: uid('t'), name }; state.typologies[kind].push(t); notify(); return Promise.resolve(t); },
  removeTypology(kind, id) { if (state.typologies?.[kind]) { state.typologies[kind] = state.typologies[kind].filter(x => x.id !== id); notify(); } return Promise.resolve(true); },
  // COMANDAS
  listComandas() { return Promise.resolve([...(state.comandas||[])].sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''))); },
  createComanda(data) { const c = { id: uid('cmd'), status: 'open', createdAt: new Date().toISOString(), items: [], discountAmount: 0, tip: 0, total: 0, ...data }; if (!state.comandas) state.comandas=[]; state.comandas.push(c); notify(); return Promise.resolve(c); },
  updateComanda(id, updates) { const i = (state.comandas||[]).findIndex(c => c.id === id); if (i >= 0) state.comandas[i] = { ...state.comandas[i], ...updates }; notify(); return Promise.resolve(state.comandas[i]); },
  deleteComanda(id) { state.comandas = (state.comandas||[]).filter(c => c.id !== id); notify(); return Promise.resolve(true); },
  // SALES
  /*
   * Uma venda de produtos deixa tres rastos, porque sao tres perguntas
   * diferentes: o que foi vendido (product_sales), o que saiu da prateleira
   * (stock_movements) e o dinheiro que entrou (cash_movements, so quando e
   * dinheiro e a caixa esta aberta). Antes ficava so na memoria do browser:
   * o stock descia e mais nada — nem movimento, nem receita, nem historico.
   */
  async createSale(sale) {
    const itens = (sale.items || []).map(i => ({
      productId: i.productId, name: i.name,
      unitPrice: Number(i.unitPrice) || 0, qty: Number(i.qty) || 0,
      subtotal: Number(i.subtotal) || 0,
    }));
    const total = Number(sale.total) || itens.reduce((s, i) => s + i.subtotal, 0);
    const sessao = state.cashSessions.find(s => s.status === 'open') || null;

    const row = {
      business_id: BUSINESS_ID,
      customer_id: sale.customerId || null,
      professional_id: sale.professionalId || null,
      items: itens, total,
      method: sale.method || null,
      cash_session_id: sale.method === 'Dinheiro' ? (sessao?.id || null) : null,
      sold_at: sale.createdAt || new Date().toISOString(),
    };
    const { data: created, error } = await supabase.from('product_sales').insert(row).select().single();
    if (error) throw traduzirErro(error);
    const v = vendaFromRow(created);
    if (!state.sales) state.sales = [];
    state.sales.push(v);

    // O que saiu da prateleira fica escrito, produto a produto.
    for (const i of itens) {
      if (!i.productId || !i.qty) continue;
      try {
        const { data: mv } = await supabase.from('stock_movements').insert({
          business_id: BUSINESS_ID, product_id: i.productId,
          quantity: i.qty, type: 'out',
          reference: `Venda${sale.customerName ? ` — ${sale.customerName}` : ''}`,
        }).select().single();
        if (mv) state.stockMovements.push(smFromRow(mv));
      } catch (e) { console.warn('movimento de stock não gravado:', e.message); }
    }

    notify();
    return v;
  },
  listSales() { return Promise.resolve([...(state.sales || [])].sort((a, b) => (b.soldAt || '').localeCompare(a.soldAt || ''))); },
  // SUBSCRIPTIONS
  listSubscriptionPlans() { return Promise.resolve([...(state.subscriptionPlans||[])]); },
  createSubscriptionPlan(data) { const p = { id: uid('pl'), active: true, ...data }; if (!state.subscriptionPlans) state.subscriptionPlans=[]; state.subscriptionPlans.push(p); notify(); return Promise.resolve(p); },
  updateSubscriptionPlan(id, updates) { const i = (state.subscriptionPlans||[]).findIndex(p => p.id === id); if (i >= 0) state.subscriptionPlans[i] = { ...state.subscriptionPlans[i], ...updates }; notify(); return Promise.resolve(state.subscriptionPlans[i]); },
  deleteSubscriptionPlan(id) { state.subscriptionPlans = (state.subscriptionPlans||[]).filter(p => p.id !== id); notify(); return Promise.resolve(true); },
  listSubscriptions() { return Promise.resolve([...(state.subscriptions||[])]); },
  createSubscription(data) { const s = { id: uid('sub'), status: 'active', startedAt: localDateStr(new Date()), ...data }; if (!state.subscriptions) state.subscriptions=[]; state.subscriptions.push(s); notify(); return Promise.resolve(s); },
  updateSubscription(id, updates) { const i = (state.subscriptions||[]).findIndex(s => s.id === id); if (i >= 0) state.subscriptions[i] = { ...state.subscriptions[i], ...updates }; notify(); return Promise.resolve(state.subscriptions[i]); },
  deleteSubscription(id) { state.subscriptions = (state.subscriptions||[]).filter(s => s.id !== id); notify(); return Promise.resolve(true); },
  listSubscriptionPayments() { return Promise.resolve([...(state.subscriptionPayments||[])].sort((a,b) => (b.paidAt||b.createdAt||'').localeCompare(a.paidAt||a.createdAt||''))); },
  addSubscriptionPayment(data) { const p = { id: uid('sp'), status: 'paid', paidAt: localDateStr(new Date()), ...data }; if (!state.subscriptionPayments) state.subscriptionPayments=[]; state.subscriptionPayments.push(p); notify(); return Promise.resolve(p); },

  /*
   * ── A SUBSCRIÇÃO DA BARBEARIA NA CONVECTA ────────────────────────────
   *
   * Nada disto tem a ver com os planos de assinatura que a barbearia vende
   * aos clientes dela (isso é o modulo `Assinaturas`). Isto é o que ELA
   * paga a nós.
   *
   * Le-se sempre da base de dados, nunca do `state`: quem escreve estes
   * campos e o webhook do Stripe, do lado do servidor, e a copia que o
   * browser tem pode ter minutos. Um barbeiro que acabou de pagar e ve
   * "sem cartao" liga-nos.
   */
  async subscricao() {
    if (!BUSINESS_ID) return null;

    const COLUNAS = 'plan, billing_period, professional_limit, subscricao_estado, trial_ends_at, current_period_end, stripe_customer_id';

    /*
     * As colunas mais recentes pedem-se primeiro, e cada uma que ainda nao
     * exista (SQL por correr) cai da lista e tenta-se outra vez — em vez de
     * devolver null.
     *
     * Devolver null aqui era pior do que o problema: `null` quer dizer «esta
     * barbearia nao tem subscricao», e o painel mostrava o ecra de VENDA a
     * quem ja esta a pagar. Um cliente a quem se pede o cartao outra vez e um
     * cliente que liga a perguntar se foi cobrado a dobrar.
     *
     * `isenta` e `is_test` (GRATIS.sql): a barbearia nao paga. Parceiros e
     * barbearias de teste. Sem elas, uma barbearia isenta via a faixa a
     * pedir o cartao e a pagina de planos — que e exactamente o que o
     * interruptor do super admin existe para evitar.
     */
    const EXTRAS = ['isenta', 'is_test', 'cancela_no_fim'];
    let extras = [...EXTRAS];
    let data, error;
    for (;;) {
      ({ data, error } = await supabase
        .from('businesses')
        .select([COLUNAS, ...extras].join(', '))
        .eq('id', BUSINESS_ID).maybeSingle());
      const emFalta = error && extras.find(c => new RegExp(c).test(error.message || ''));
      if (!emFalta) break;
      extras = extras.filter(c => c !== emFalta);
    }
    if (error) {
      // As colunas da subscricao inteiras por criar: ai sim, nao ha nada a ler.
      if (/subscricao_estado/.test(error.message || '')) return null;
      throw new Error(error.message);
    }
    if (!data) return null;
    return {
      plano: data.plan || null,
      periodo: data.billing_period || 'mensal',
      limiteProfissionais: data.professional_limit ?? null,
      // Quem nao paga nao tem estado de subscricao que interesse: esta aberto.
      estado: (data.isenta || data.is_test) ? 'gratis' : (data.subscricao_estado || 'sem_cartao'),
      fimDoTeste: data.trial_ends_at || null,
      fimDoPeriodo: data.current_period_end || null,
      temCliente: !!data.stripe_customer_id,
      // Cancelou no portal, mas continua a usar ate ao fim do periodo. Sao
      // duas coisas diferentes: o estado diz se FUNCIONA, isto diz se ACABA.
      cancelaNoFim: !!data.cancela_no_fim && !(data.isenta || data.is_test),
    };
  },

  /*
   * Os planos, como estao no Stripe neste momento.
   *
   * Nao ha aqui nenhuma tabela de precos de proposito. A regra da casa e que
   * nenhum numero de dinheiro se escreve a mao fora de `planos.js` e do site;
   * o painel seria um terceiro sitio, e um terceiro sitio com precos e um
   * sitio que um dia mostra 29,99 € a quem vai ser cobrado 34,99 €.
   *
   * Entao pergunta-se ao Stripe, que e quem vai cobrar.
   */
  async listarPlanos() {
    const { data, error } = await supabase.functions.invoke('listar-planos', { body: {} });
    if (error) {
      let motivo = '';
      try { motivo = (await error.context?.json())?.erro || ''; } catch { motivo = ''; }
      throw new Error(motivo || error.message || 'Não foi possível ler os planos.');
    }
    return data?.planos || [];
  },

  /*
   * Abre o checkout do Stripe. Devolve o endereco; quem manda la o barbeiro
   * e o ecra, com um `window.location`.
   *
   * `invoke` e nao um fetch escrito a mao: o porteiro do Supabase exige o
   * cabecalho `apikey` em todos os pedidos as funcoes, alem do token da
   * sessao. Montar o pedido a mao sem ele da um "Bad Request" seco ANTES de
   * a funcao ser chamada, e os registos dela nao mostram nada. Ja custou
   * duas horas uma vez.
   */
  /*
   * Os pagamentos feitos ao Stripe, para a lista na Subscricao. Vem do Stripe
   * de cada vez — nao ha copia nossa que possa ficar desactualizada.
   */
  async listarPagamentos() {
    const { data, error } = await supabase.functions.invoke('listar-pagamentos', { body: {} });
    if (error) {
      let motivo = '';
      try { motivo = (await error.context?.json())?.erro || ''; } catch { motivo = ''; }
      throw new Error(motivo || error.message || 'Não foi possível ler os pagamentos.');
    }
    return data?.pagamentos || [];
  },

  async abrirCheckout(preco, comTeste = true) {
    // `preco` e o objecto que veio de listarPlanos (tem lookupKey e precoId).
    // Aceita-se tambem uma string, por compatibilidade: e a chave.
    const corpo = typeof preco === 'string'
      ? { lookupKey: preco, comTeste }
      : { lookupKey: preco?.lookupKey || null, precoId: preco?.precoId || null, comTeste };
    const { data, error } = await supabase.functions.invoke('criar-sessao-pagamento', {
      body: corpo,
    });
    if (error) {
      let motivo = '';
      try { motivo = (await error.context?.json())?.erro || ''; } catch { motivo = ''; }
      throw new Error(motivo || error.message || 'Não foi possível abrir o pagamento.');
    }
    if (!data?.url) throw new Error('O Stripe não devolveu um endereço de pagamento.');
    return data.url;
  },

  /*
   * Abre o portal do cliente do Stripe: mudar cartao, ver facturas, cancelar.
   *
   * O cancelamento vive la e nao aqui de proposito. E o sitio onde um bug
   * nosso continuava a cobrar a quem ja cancelou — e isso nao e um cliente
   * perdido, e uma queixa no banco.
   */
  async abrirPortal() {
    const { data, error } = await supabase.functions.invoke('abrir-portal', { body: {} });
    if (error) {
      let motivo = '';
      try { motivo = (await error.context?.json())?.erro || ''; } catch { motivo = ''; }
      throw new Error(motivo || error.message || 'Não foi possível abrir o portal.');
    }
    if (!data?.url) throw new Error('O Stripe não devolveu um endereço do portal.');
    return data.url;
  },

  // ── RESET ──
  async resetData() {
    initialized = false;
    state = { business: null, professionals: [], services: [], customers: [], appointments: [], products: [], cashSessions: [], cashMovements: [], forms: [], waitlist: [], suppliers: [], stockMovements: [], commissions: [], reviews: [], timeOff: [], gallery: [], notifications: [], promotions: [], expenses: [], typologies: _defaultTypologies(), comandas: [], sales: [], subscriptionPlans: [], subscriptions: [], subscriptionPayments: [], loyaltyMovements: [], loyaltyRewards: [] };
    await init();
    return true;
  },
};

export default dataService;
