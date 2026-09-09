// dataService.js — Supabase backend
// Migrado de localStorage para Supabase (Fase 3)
// API pública idêntica — componentes não precisam de mudar.

import { supabase } from '@/lib/supabase';
import { buildSnapshot, assertNoConflict, canTransition, appointmentDuration } from '@/lib/domain/appointments';
import { getCustomerStats } from '@/lib/domain/finance';
import { round2 } from '@/lib/domain/money';
import { localDateStr } from '@/lib/domain/dates';

// ─── CONSTANTS ────────────────────────────────────────────────────────────────
const DAY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

// ─── STATE ────────────────────────────────────────────────────────────────────
let BUSINESS_ID = null;
let state = {
  business: null,
  professionals: [], services: [], customers: [], appointments: [],
  products: [], cashSessions: [], cashMovements: [], forms: [],
  waitlist: [], suppliers: [], stockMovements: [], commissions: [],
  // Ainda em memória (não migrados nesta fase):
  reviews: [], gallery: [], notifications: [], promotions: [],
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

function loyaltyCardConfig() {
  try { return { ...DEFAULT_LOYALTY, ...(JSON.parse(localStorage.getItem('convecta_loyalty_card_config')) || {}) }; }
  catch { return { ...DEFAULT_LOYALTY }; }
}

function addLoyaltyStamp(appt, at = new Date().toISOString()) {
  if (!appt?.customerId || appt.loyaltyStamped || !loyaltyCardConfig().enabled) return;
  const customer = state.customers.find(c => c.id === appt.customerId);
  if (!customer) return;
  const cfg = loyaltyCardConfig();
  const threshold = Math.max(3, Math.min(20, Number(state.business?.config?.loyalty?.stampsThreshold ?? cfg.totalStamps ?? 10)));
  if (!customer.loyalty) customer.loyalty = { stamps: 0, totalStamps: 0, rewardsEarned: 0, points: 0 };
  customer.loyalty.points = (customer.loyalty.points || 0) + 1;
  customer.loyalty.stamps = (customer.loyalty.stamps || 0) + 1;
  customer.loyalty.totalStamps = (customer.loyalty.totalStamps || 0) + 1;
  customer.loyalty.lastStampAt = at;
  let displayCount = customer.loyalty.stamps;
  let reward = false;
  if (customer.loyalty.stamps >= threshold) {
    customer.loyalty.stamps = 0;
    customer.loyalty.rewardsEarned = (customer.loyalty.rewardsEarned || 0) + 1;
    reward = true; displayCount = threshold;
  }
  customer.pendingStamp = { count: displayCount, reward };
  customer.pendingReview = { appointmentId: appt.id, serviceId: appt.serviceId, professionalId: appt.professionalId };
  appt.loyaltyStamped = true;
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
    logoUrl: row.logo_url || s.logoUrl || '',
    coverImageUrl: s.coverImageUrl || '',
    tagline: s.tagline || '', description: s.description || '',
    address: s.address || '', phone: s.phone || '', email: s.email || '',
    rating: s.rating || 0, reviewCount: s.reviewCount || 0,
    coords: s.coords || {}, amenities: s.amenities || [],
    social: s.social || {}, openingHours: s.openingHours || [],
    config: s.config || _defaultConfig(),
    // O Super Admin escreve chaves aqui (theme, loyalty, ...) que este admin
    // nao conhece. Guardamos o settings original para as devolver intactas
    // ao gravar - sem isto, gravar o telefone apagava o tema da barbearia.
    _settings: s,
  };
}
function bizToRow(biz) {
  const { id, name, slug, logoUrl, _settings, ...rest } = biz;
  return { name, slug, logo_url: logoUrl, settings: { ...(_settings || {}), ...rest } };
}

// PROFESSIONAL
function proFromRow(row) {
  if (!row) return null;
  const m = row.metadata || {};
  return {
    id: row.id, businessId: row.business_id, name: row.name,
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
    blocked: m.blocked || false,
    createdAt: row.created_at,
    confirmedAt: m.confirmedAt, completedAt: m.completedAt,
    cancelledAt: m.cancelledAt, attendedAt: m.attendedAt,
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
      blocked: a.blocked,
      confirmedAt: a.confirmedAt, completedAt: a.completedAt,
      cancelledAt: a.cancelledAt, attendedAt: a.attendedAt,
      rescheduleHistory: a.rescheduleHistory,
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
  // Fallback dev: primeiro negócio (quando ainda não há auth / primeiro arranque)
  if (!biz) {
    const { data } = await supabase.from('businesses').select('*').limit(1).maybeSingle();
    biz = data;
  }
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
    fetchAll('commissions', commFromRow),
  ]);

  Object.assign(state, { professionals, services, customers, appointments, products, cashSessions, cashMovements, forms, waitlist, suppliers, stockMovements, commissions });
  initialized = true;
  notify();
}

// ─── SLOT GENERATION ──────────────────────────────────────────────────────────
function generateSlotsForDay(dateStr, professionalId, durationMinutes, existingAppointments) {
  const dow = new Date(dateStr + 'T00:00:00').getDay();
  const hours = state.business?.openingHours?.find(h => h.day === DAY_NAMES[dow]);
  if (!hours || !hours.isOpen) return [];
  const open = toMinutes(hours.open), close = toMinutes(hours.close);
  const slots = [];
  for (let t = open; t + durationMinutes <= close; t += 30) {
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
      reviews: [], gallery: [], notifications: [], promotions: [],
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
    if (error) throw error;
    state.business = { ...bizFromRow(data), config: state.business.config };
    notify(); return state.business;
  },

  // ── PROFESSIONALS ──
  listProfessionals() { return Promise.resolve(state.professionals); },
  getProfessional(id) { return Promise.resolve(state.professionals.find(p => p.id === id)); },
  async createProfessional(data) {
    const row = proToRow({ rating: 0, reviewCount: 0, specialties: [], photoUrl: '', commission: 30, ...data });
    const { data: created, error } = await supabase.from('professionals').insert(row).select().single();
    if (error) throw error;
    const p = proFromRow(created); state.professionals.push(p); notify(); return p;
  },
  async updateProfessional(id, updates) {
    const existing = state.professionals.find(p => p.id === id);
    const row = proToRow({ ...existing, ...updates });
    const { data, error } = await supabase.from('professionals').update(row).eq('id', id).select().single();
    if (error) throw error;
    const p = proFromRow(data);
    const i = state.professionals.findIndex(x => x.id === id);
    if (i >= 0) state.professionals[i] = p;
    notify(); return p;
  },
  async deleteProfessional(id) {
    const { error } = await supabase.from('professionals').delete().eq('id', id);
    if (error) throw error;
    state.professionals = state.professionals.filter(p => p.id !== id); notify(); return true;
  },

  // ── SERVICES ──
  listServices() { return Promise.resolve(state.services); },
  getActiveServices() { return Promise.resolve(state.services.filter(s => s.isActive)); },
  getService(id) { return Promise.resolve(state.services.find(s => s.id === id)); },
  async createService(data) {
    const row = svcToRow({ isActive: true, isPopular: false, ...data });
    const { data: created, error } = await supabase.from('services').insert(row).select().single();
    if (error) throw error;
    const s = svcFromRow(created); state.services.push(s); notify(); return s;
  },
  async updateService(id, updates) {
    const existing = state.services.find(s => s.id === id);
    const row = svcToRow({ ...existing, ...updates });
    const { data, error } = await supabase.from('services').update(row).eq('id', id).select().single();
    if (error) throw error;
    const s = svcFromRow(data);
    const i = state.services.findIndex(x => x.id === id);
    if (i >= 0) state.services[i] = s;
    notify(); return s;
  },
  async deleteService(id) {
    const { error } = await supabase.from('services').delete().eq('id', id);
    if (error) throw error;
    state.services = state.services.filter(s => s.id !== id); notify(); return true;
  },

  // ── CUSTOMERS ──
  listCustomers() { return Promise.resolve(state.customers); },
  getCustomer(id) { return Promise.resolve(state.customers.find(c => c.id === id)); },
  getCustomerByEmail(email) { return Promise.resolve(state.customers.find(c => c.email?.toLowerCase() === email?.toLowerCase())); },
  async createCustomer(data) {
    const row = custToRow({ totalAppointments: 0, totalSpent: 0, joinedAt: localDateStr(new Date()), lastVisit: null, loyalty: { stamps: 0, totalStamps: 0, rewardsEarned: 0, points: 0 }, pendingStamp: null, pendingReview: null, balance: 0, ...data });
    const { data: created, error } = await supabase.from('customers').insert(row).select().single();
    if (error) throw error;
    const c = custFromRow(created); state.customers.push(c); notify(); return c;
  },
  async updateCustomer(id, updates) {
    const existing = state.customers.find(c => c.id === id);
    const merged = { ...existing, ...updates };
    const row = custToRow(merged);
    const { data, error } = await supabase.from('customers').update(row).eq('id', id).select().single();
    if (error) throw error;
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
    if (error) throw error;
    const a = apptFromRow(created); state.appointments.push(a); notify(); return a;
  },
  async updateAppointment(id, updates) {
    const i = state.appointments.findIndex(a => a.id === id);
    if (i < 0) return null;
    const prev = state.appointments[i].status;
    state.appointments[i] = { ...state.appointments[i], ...updates };
    if (['confirmed','completed'].includes(state.appointments[i].status) && prev !== state.appointments[i].status) {
      addLoyaltyStamp(state.appointments[i]);
    }
    const { error } = await supabase.from('appointments').update(apptToRow(state.appointments[i])).eq('id', id);
    if (error) throw error;
    notify(); return state.appointments[i];
  },
  async confirmAppointment(id) {
    const a = state.appointments.find(x => x.id === id);
    if (!a || a.status !== 'pending' || !canTransition(a.status, 'confirmed')) return a;
    a.status = 'confirmed'; a.confirmedAt = new Date().toISOString();
    addLoyaltyStamp(a, a.confirmedAt);
    const { error } = await supabase.from('appointments').update(apptToRow(a)).eq('id', id);
    if (error) throw error;
    notify(); return a;
  },
  async cancelAppointment(id) {
    const a = state.appointments.find(x => x.id === id);
    if (!a || !canTransition(a.status, 'cancelled')) return a;
    if (a.status === 'completed' && a.payment) {
      state.commissions = (state.commissions || []).filter(c => c.appointmentId !== id);
      await supabase.from('commissions').delete().eq('appointment_id', id);
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
    a.status = 'cancelled'; a.cancelledAt = new Date().toISOString();
    const { error } = await supabase.from('appointments').update(apptToRow(a)).eq('id', id);
    if (error) throw error;
    notify(); return a;
  },
  async deleteAppointment(id) {
    const { error } = await supabase.from('appointments').delete().eq('id', id);
    if (error) throw error;
    state.appointments = state.appointments.filter(a => a.id !== id); notify(); return true;
  },
  async checkoutAppointment(apptId, payData) {
    const a = state.appointments.find(x => x.id === apptId);
    if (!a || (a.status === 'completed' && a.payment)) return a;
    if (a.status !== 'confirmed' && a.status !== 'completed') return a;
    const svc = state.services.find(s => s.id === a.serviceId);
    const pro = state.professionals.find(p => p.id === a.professionalId);
    const base = a.unitPriceSnapshot ?? (svc?.price || 0);
    const discountAmount = round2(Number(payData.discountAmount) || 0);
    const net = round2(Math.max(0, base - discountAmount));
    const tip = round2(Number(payData.tip) || 0);
    const total = round2(net + tip);
    const pct = pro?.commission || 0;
    const commissionAmount = round2(net * pct / 100);
    a.status = 'completed'; a.completedAt = new Date().toISOString();
    a.paymentMethod = payData.method;
    a.payment = { ...payData, baseAmount: round2(base), discountAmount, net, tip, total, at: new Date().toISOString() };
    // Persist commission
    const commRow = { business_id: BUSINESS_ID, appointment_id: apptId, professional_id: a.professionalId, base_amount: net, percentage: pct, amount: commissionAmount, status: 'accrued', metadata: { professionalNameSnapshot: a.professionalNameSnapshot || pro?.name, serviceNameSnapshot: a.serviceNameSnapshot, tip } };
    const { data: commCreated } = await supabase.from('commissions').insert(commRow).select().single();
    const comm = commFromRow(commCreated);
    if (!state.commissions) state.commissions = [];
    state.commissions.push(comm);
    a.payment.commission = { percentage: pct, baseAmount: net, commissionAmount };
    a.payment.commissionId = comm?.id;
    // Update appointment
    await supabase.from('appointments').update(apptToRow(a)).eq('id', apptId);
    recomputeCustomer(a.customerId);
    const updCust = state.customers.find(c => c.id === a.customerId);
    if (updCust) {
      const updRow = custToRow(updCust);
      await supabase.from('customers').update({
        total_visits: updRow.total_visits,
        total_spent: updRow.total_spent,
        metadata: updRow.metadata,
      }).eq('id', a.customerId);
    }
    addLoyaltyStamp(a, a.payment.at);
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
    if (error) throw error;
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
    if (error) throw error;
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
    const row = { business_id: BUSINESS_ID, cash_session_id: data.sessionId || data.cashSessionId, payment_id: data.paymentId || null, type: data.type, amount: data.amount || 0, description: data.description || null };
    const { data: created, error } = await supabase.from('cash_movements').insert(row).select().single();
    if (error) throw error;
    const m = cmFromRow(created); state.cashMovements.push(m); notify(); return m;
  },
  async deleteCashMovement(id) {
    const { error } = await supabase.from('cash_movements').delete().eq('id', id);
    if (error) throw error;
    state.cashMovements = state.cashMovements.filter(m => m.id !== id); notify(); return true;
  },

  // ── PRODUCTS ──
  listProducts() { return Promise.resolve([...state.products]); },
  async createProduct(data) {
    const row = prodToRow({ stock: 0, minStock: 5, cost: 0, ...data });
    const { data: created, error } = await supabase.from('products').insert(row).select().single();
    if (error) throw error;
    const p = prodFromRow(created); state.products.push(p); notify(); return p;
  },
  async updateProduct(id, updates) {
    const existing = state.products.find(p => p.id === id);
    const row = prodToRow({ ...existing, ...updates });
    const { data, error } = await supabase.from('products').update(row).eq('id', id).select().single();
    if (error) throw error;
    const p = prodFromRow(data);
    const i = state.products.findIndex(x => x.id === id);
    if (i >= 0) state.products[i] = p;
    notify(); return p;
  },
  async deleteProduct(id) {
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) throw error;
    state.products = state.products.filter(p => p.id !== id); notify(); return true;
  },
  async adjustStock(id, delta, reason) {
    const p = state.products.find(x => x.id === id);
    if (p) {
      p.stock = Math.max(0, p.stock + Number(delta));
      await supabase.from('products').update(prodToRow(p)).eq('id', id);
      const { data: mv } = await supabase.from('stock_movements').insert({ business_id: BUSINESS_ID, product_id: id, quantity: Math.abs(delta), type: delta >= 0 ? 'in' : 'out', reference: reason || '' }).select().single();
      state.stockMovements.push(smFromRow(mv));
      notify();
    }
    return p;
  },
  listStockMovements() { return Promise.resolve([...state.stockMovements].sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''))); },

  // ── FORMS ──
  getForms() { return Promise.resolve([...state.forms]); },
  async saveForm(form) {
    const existing = state.forms.find(f => f.id === form.id);
    const row = { business_id: BUSINESS_ID, name: form.name, fields: form.questions || form.fields || [], is_active: form.active !== false };
    if (existing) {
      const { data, error } = await supabase.from('forms').update(row).eq('id', form.id).select().single();
      if (error) throw error;
      const f = formFromRow(data);
      const i = state.forms.findIndex(x => x.id === form.id);
      if (i >= 0) state.forms[i] = f;
      notify(); return f;
    } else {
      const { data, error } = await supabase.from('forms').insert(row).select().single();
      if (error) throw error;
      const f = formFromRow(data); state.forms.push(f); notify(); return f;
    }
  },
  async deleteForm(id) {
    const { error } = await supabase.from('forms').delete().eq('id', id);
    if (error) throw error;
    state.forms = state.forms.filter(f => f.id !== id); notify(); return true;
  },

  // ── WAITLIST ──
  listWaitlist() { return Promise.resolve([...state.waitlist].sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''))); },
  async addWaitlist(data) {
    const row = { business_id: BUSINESS_ID, customer_id: data.customerId || null, service_id: data.serviceId || null, preferred_date: data.preferredDate || null, status: 'waiting', metadata: { priority: data.priority || 'normal' } };
    const { data: created, error } = await supabase.from('waitlist').insert(row).select().single();
    if (error) throw error;
    const w = wlFromRow(created); state.waitlist.push(w); notify(); return w;
  },
  async updateWaitlist(id, updates) {
    const existing = state.waitlist.find(w => w.id === id);
    const merged = { ...existing, ...updates };
    const { data, error } = await supabase.from('waitlist').update({ status: merged.status, preferred_date: merged.preferredDate || null, metadata: { priority: merged.priority } }).eq('id', id).select().single();
    if (error) throw error;
    const w = wlFromRow(data);
    const i = state.waitlist.findIndex(x => x.id === id);
    if (i >= 0) state.waitlist[i] = w;
    notify(); return w;
  },
  async removeWaitlist(id) {
    const { error } = await supabase.from('waitlist').delete().eq('id', id);
    if (error) throw error;
    state.waitlist = state.waitlist.filter(w => w.id !== id); notify(); return true;
  },

  // ── SUPPLIERS ──
  listSuppliers() { return Promise.resolve([...state.suppliers]); },
  async createSupplier(data) {
    const { data: created, error } = await supabase.from('suppliers').insert({ business_id: BUSINESS_ID, name: data.name, contact: data.contact || null, email: data.email || null, phone: data.phone || null, is_active: true }).select().single();
    if (error) throw error;
    const s = supFromRow(created); state.suppliers.push(s); notify(); return s;
  },
  async updateSupplier(id, updates) {
    const { data, error } = await supabase.from('suppliers').update({ name: updates.name, contact: updates.contact || null, email: updates.email || null, phone: updates.phone || null }).eq('id', id).select().single();
    if (error) throw error;
    const s = supFromRow(data);
    const i = state.suppliers.findIndex(x => x.id === id);
    if (i >= 0) state.suppliers[i] = s;
    notify(); return s;
  },
  async deleteSupplier(id) {
    const { error } = await supabase.from('suppliers').delete().eq('id', id);
    if (error) throw error;
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
    notify(); return state.business.config;
  },

  // ── COMMISSIONS ──
  listCommissions() { return Promise.resolve([...(state.commissions||[])]); },
  listExpenses(sessionId) { return Promise.resolve((state.expenses||[]).filter(e => e.sessionId === sessionId).sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''))); },
  addExpense(sessionId, data) { const e = { id: uid('exp'), sessionId, createdAt: new Date().toISOString(), ...data }; if (!state.expenses) state.expenses = []; state.expenses.push(e); notify(); return Promise.resolve(e); },
  deleteExpense(id) { state.expenses = (state.expenses||[]).filter(e => e.id !== id); notify(); return Promise.resolve(true); },

  // ── SLOTS ──
  getAvailableSlots(dateStr, professionalId, durationMinutes) {
    const appts = state.appointments.filter(a => a.status !== 'cancelled');
    if (professionalId === 'any') {
      const map = new Map();
      state.professionals.forEach(p => {
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
    let best = null, bestCount = -1;
    state.professionals.forEach(p => {
      const slots = generateSlotsForDay(dateStr, p.id, durationMinutes, appts);
      const avail = slots.filter(s => !s.isBooked && !s.isPast && s.startTime === startTime);
      const total = slots.filter(s => !s.isBooked && !s.isPast).length;
      if (avail.length > 0 && total > bestCount) { best = p; bestCount = total; }
    });
    return Promise.resolve(best || state.professionals[0]);
  },

  // ── LOYALTY ──
  getLoyaltyCardConfig() { return loyaltyCardConfig(); },
  saveLoyaltyCardConfig(cfg) {
    const next = { ...loyaltyCardConfig(), ...cfg, totalStamps: Math.max(3, Math.min(20, Number(cfg.totalStamps)||10)) };
    localStorage.setItem('convecta_loyalty_card_config', JSON.stringify(next));
    if (state.business) state.business.config = { ...state.business.config, loyalty: { ...(state.business.config.loyalty||{}), stampsThreshold: next.totalStamps, rewardName: next.reward } };
    notify(); return Promise.resolve(next);
  },
  getLoyaltyProgram() {
    const card = loyaltyCardConfig();
    return { ...(state.business?.config?.loyalty||{}), stampsThreshold: card.totalStamps, rewardName: card.reward };
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
  // REVIEWS
  listVisibleReviews() { return Promise.resolve((state.reviews||[]).filter(r => r.isVisible)); },
  listReviewsByProfessional(id) { return Promise.resolve((state.reviews||[]).filter(r => r.professionalId === id && r.isVisible)); },
  listAllReviews() { return Promise.resolve([...(state.reviews||[])].sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''))); },
  createReview(data) { const r = { id: uid('r'), createdAt: new Date().toISOString().slice(0,10), isVisible: true, ...data }; (state.reviews||[]).push(r); notify(); return Promise.resolve(r); },
  submitReview(data) { const r = { id: uid('r'), createdAt: new Date().toISOString().slice(0,10), isVisible: false, ...data }; if (!state.reviews) state.reviews=[]; state.reviews.push(r); notify(); return Promise.resolve(r); },
  updateReview(id, updates) { const i = (state.reviews||[]).findIndex(r => r.id === id); if (i >= 0) state.reviews[i] = { ...state.reviews[i], ...updates }; notify(); return Promise.resolve(state.reviews[i]); },
  deleteReview(id) { state.reviews = (state.reviews||[]).filter(r => r.id !== id); notify(); return Promise.resolve(true); },
  // GALLERY
  listGallery() { return Promise.resolve((state.gallery||[]).sort((a,b) => a.order - b.order)); },
  // NOTIFICATIONS
  listNotifications() { return Promise.resolve([...(state.notifications||[])].sort((a,b) => (b.createdAt||'').localeCompare(a.createdAt||''))); },
  createNotification(data) { const n = { id: uid('n'), type: 'info', active: true, createdAt: new Date().toISOString(), readBy: [], ...data }; if (!state.notifications) state.notifications=[]; state.notifications.push(n); notify(); return Promise.resolve(n); },
  updateNotification(id, updates) { const i = (state.notifications||[]).findIndex(n => n.id === id); if (i >= 0) state.notifications[i] = { ...state.notifications[i], ...updates }; notify(); return Promise.resolve(state.notifications[i]); },
  toggleNotification(id) { const n = (state.notifications||[]).find(x => x.id === id); if (n) { n.active = !n.active; notify(); } return Promise.resolve(n); },
  deleteNotification(id) { state.notifications = (state.notifications||[]).filter(n => n.id !== id); notify(); return Promise.resolve(true); },
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
  createSale(sale) { const record = { ...sale, id: uid('sale') }; if (!state.sales) state.sales=[]; state.sales.push(record); notify(); return Promise.resolve(record); },
  // SUBSCRIPTIONS
  listSubscriptionPlans() { return Promise.resolve([...(state.subscriptionPlans||[])]); },
  createSubscriptionPlan(data) { const p = { id: uid('pl'), active: true, ...data }; if (!state.subscriptionPlans) state.subscriptionPlans=[]; state.subscriptionPlans.push(p); notify(); return Promise.resolve(p); },
  updateSubscriptionPlan(id, updates) { const i = (state.subscriptionPlans||[]).findIndex(p => p.id === id); if (i >= 0) state.subscriptionPlans[i] = { ...state.subscriptionPlans[i], ...updates }; notify(); return Promise.resolve(state.subscriptionPlans[i]); },
  deleteSubscriptionPlan(id) { state.subscriptionPlans = (state.subscriptionPlans||[]).filter(p => p.id !== id); notify(); return Promise.resolve(true); },
  listSubscriptions() { return Promise.resolve([...(state.subscriptions||[])]); },
  createSubscription(data) { const s = { id: uid('sub'), status: 'active', startedAt: new Date().toISOString().slice(0,10), ...data }; if (!state.subscriptions) state.subscriptions=[]; state.subscriptions.push(s); notify(); return Promise.resolve(s); },
  updateSubscription(id, updates) { const i = (state.subscriptions||[]).findIndex(s => s.id === id); if (i >= 0) state.subscriptions[i] = { ...state.subscriptions[i], ...updates }; notify(); return Promise.resolve(state.subscriptions[i]); },
  deleteSubscription(id) { state.subscriptions = (state.subscriptions||[]).filter(s => s.id !== id); notify(); return Promise.resolve(true); },
  listSubscriptionPayments() { return Promise.resolve([...(state.subscriptionPayments||[])].sort((a,b) => (b.paidAt||b.createdAt||'').localeCompare(a.paidAt||a.createdAt||''))); },
  addSubscriptionPayment(data) { const p = { id: uid('sp'), status: 'paid', paidAt: new Date().toISOString().slice(0,10), ...data }; if (!state.subscriptionPayments) state.subscriptionPayments=[]; state.subscriptionPayments.push(p); notify(); return Promise.resolve(p); },

  // ── RESET ──
  async resetData() {
    initialized = false;
    state = { business: null, professionals: [], services: [], customers: [], appointments: [], products: [], cashSessions: [], cashMovements: [], forms: [], waitlist: [], suppliers: [], stockMovements: [], commissions: [], reviews: [], gallery: [], notifications: [], promotions: [], expenses: [], typologies: _defaultTypologies(), comandas: [], sales: [], subscriptionPlans: [], subscriptions: [], subscriptionPayments: [], loyaltyMovements: [], loyaltyRewards: [] };
    await init();
    return true;
  },
};

export default dataService;
