import React, { useState, useMemo } from 'react';
import { Phone, Mail, MessageCircle, MessageSquare, Save, CalendarDays, Pencil, Trash2 } from 'lucide-react';
import { Modal, Button, Avatar } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';
import { formatDateNum, formatDateShortNum, formatPrice, todayStr } from '@/lib/format';

export default function CustomerProfileModal({ customer, onClose, onEditar }) {
  const data = useStore();
  const toast = useToast();
  const [notes, setNotes] = useState(customer?.notes || '');
  // Ate 28/09/2026 aqui so se guardavam notas: nem editar nem apagar. Uma
  // ficha criada por engano nao tinha forma nenhuma de sair do painel, e era
  // aqui que se ia procurar, nao na lista.
  const [aApagar, setAApagar] = useState(false);

  const history = useMemo(() =>
    (data.appointments || []).filter(a => a.customerId === customer?.id).sort((a, b) => (b.date + b.startTime).localeCompare(a.date + b.startTime)),
    [data.appointments, customer?.id]);

  const upcoming = history.find(a => a.status !== 'cancelled' && (a.date + a.startTime) >= (todayStr() + new Date().toTimeString().slice(0, 5)));

  if (!customer) return null;

  const saveNotes = async () => {
    await dataService.updateCustomer(customer.id, { notes });
    toast.success('Notas guardadas');
  };

  const tel = (customer.phone || '').replace(/[^0-9+]/g, '');

  /*
   * A FICHA E UM CARTAO DE CONTACTO.
   *
   * Era um perfil com tres indicadores, o profissional preferido, os
   * servicos mais usados, as notas, e uma tabela de cinco colunas com o
   * historico. Tudo isso e verdade e tudo isso continua a existir nos
   * Relatorios. Mas no telemovel, quando se abre um cliente, e para lhe
   * ligar, mandar mensagem ou ver quando e que ele vem. O cartao de
   * contacto do telemovel ja resolveu este desenho: nome, quatro botoes
   * redondos, e os dados por baixo. E o que a concorrencia faz tambem.
   */
  return (
    <Modal open={!!customer} onClose={onClose} title="">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="cf">
        <div className="cf-accoes-topo">
          {onEditar && <button type="button" className="cf-ico" onClick={() => onEditar(customer)} aria-label="Editar"><Pencil size={17} /></button>}
          <button type="button" className="cf-ico" onClick={() => setAApagar(true)} aria-label="Apagar"><Trash2 size={17} /></button>
        </div>

        <div className="cf-cabeca">
          <Avatar name={customer.name} size="lg" />
          <div className="cf-nome">{customer.name}</div>
        </div>

        <div className="cf-botoes">
          <a className={`cf-btn${tel ? '' : ' off'}`} href={tel ? `tel:${tel}` : undefined}><i><Phone size={20} /></i>Ligar</a>
          <a className={`cf-btn${tel ? '' : ' off'}`} href={tel ? `https://wa.me/${tel.replace(/\D/g, '')}` : undefined} target="_blank" rel="noreferrer"><i><MessageCircle size={20} /></i>WhatsApp</a>
          <a className={`cf-btn${tel ? '' : ' off'}`} href={tel ? `sms:${tel}` : undefined}><i><MessageSquare size={20} /></i>SMS</a>
          <a className={`cf-btn${customer.email ? '' : ' off'}`} href={customer.email ? `mailto:${customer.email}` : undefined}><i><Mail size={20} /></i>E-mail</a>
        </div>

        <div className="cf-dados">
          <div className="cf-dado"><span><Phone size={15} /> Telemóvel</span><b>{customer.phone || '—'}</b></div>
          <div className="cf-dado"><span><Mail size={15} /> E-mail</span><b>{customer.email || '—'}</b></div>
          {customer.birthDate && <div className="cf-dado"><span><CalendarDays size={15} /> Aniversário</span><b>{formatDateShortNum(customer.birthDate)}</b></div>}
        </div>

        {aApagar && (
          <div className="cf-apagar">
            <b>Apagar {customer.name}?</b>
            <div style={{ display: 'flex', gap: 8 }}>
              <Button size="sm" variant="danger" onClick={async () => {
                try { await dataService.deleteCustomer(customer.id); toast.success('Cliente apagado', customer.name); setAApagar(false); onClose(); }
                catch (err) { toast.error(err.temHistorico ? 'Não dá para apagar' : 'Erro ao apagar', err.message || String(err)); setAApagar(false); }
              }}>Apagar</Button>
              <Button size="sm" variant="secondary" onClick={() => setAApagar(false)}>Cancelar</Button>
            </div>
          </div>
        )}

        {upcoming && (
          <div className="cf-proxima">
            <CalendarDays size={16} />
            <span>{formatDateNum(upcoming.date)} · {upcoming.startTime} · {data.services.find(s => s.id === upcoming.serviceId)?.name}</span>
          </div>
        )}

        <div className="cf-seccao">
          <div className="cf-h">Notas</div>
          <textarea className="textarea" rows={2} value={notes} onChange={e => setNotes(e.target.value)} />
          {notes !== (customer.notes || '') && (
            <div className="mt-8"><Button size="sm" variant="primary" onClick={saveNotes}><Save size={14} /> Guardar</Button></div>
          )}
        </div>

        {history.length > 0 && (
          <div className="cf-seccao">
            <div className="cf-h">Marcações · {history.length}</div>
            <div className="cf-hist">
              {history.slice(0, 8).map(a => {
                const svc = data.services.find(s => s.id === a.serviceId);
                return (
                  <div key={a.id} className={`cf-hist-linha ${a.status}`}>
                    <span>{formatDateShortNum(a.date)}</span>
                    <span className="cf-hist-svc">{svc?.name || '—'}</span>
                    <span>{svc ? formatPrice(svc.price) : ''}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
}

const CSS = `
.cf { position: relative; padding-top: 4px; }
.cf-accoes-topo { position: absolute; top: -6px; right: 0; display: flex; gap: 6px; }
.cf-ico {
  width: 36px; height: 36px; border-radius: 999px; display: grid; place-items: center;
  border: 1px solid var(--border); background: var(--elevated); color: var(--text-sec); cursor: pointer;
}
.cf-cabeca { text-align: center; padding: 10px 0 18px; }
.cf-cabeca .avatar { margin: 0 auto 10px; }
.cf-nome { font-size: 20px; font-weight: 700; }

.cf-botoes { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 18px; }
.cf-btn {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  font-size: 12.5px; color: var(--text-sec); text-decoration: none;
}
.cf-btn i {
  width: 50px; height: 50px; border-radius: 999px; display: grid; place-items: center;
  background: var(--elevated); border: 1px solid var(--border); color: var(--text);
}
.cf-btn.off { opacity: .35; pointer-events: none; }

.cf-dados { border-radius: 14px; background: var(--elevated); border: 1px solid var(--border); overflow: hidden; margin-bottom: 14px; }
.cf-dado {
  display: flex; align-items: center; justify-content: space-between; gap: 12px;
  min-height: 48px; padding: 0 14px; border-bottom: 1px solid var(--border); font-size: 15px;
}
.cf-dado:last-child { border-bottom: 0; }
.cf-dado span { display: flex; align-items: center; gap: 8px; color: var(--text-sec); flex-shrink: 0; }
.cf-dado b { font-weight: 600; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

.cf-apagar {
  display: flex; flex-direction: column; gap: 10px; padding: 12px 14px; border-radius: 12px;
  border: 1px solid rgba(239,68,68,.45); background: rgba(239,68,68,.08); margin-bottom: 14px;
}
.cf-proxima {
  display: flex; align-items: center; gap: 10px; padding: 11px 14px; border-radius: 12px;
  background: rgba(var(--gold-rgb), .12); border: 1px solid rgba(var(--gold-rgb), .4);
  font-size: 14.5px; font-weight: 600; margin-bottom: 14px; color: var(--text);
}
.cf-proxima svg { color: var(--gold-tinta); flex-shrink: 0; }
.cf-seccao { margin-bottom: 14px; }
.cf-h { font-size: 12px; font-weight: 700; letter-spacing: .08em; text-transform: uppercase; color: var(--text-ter); margin: 0 0 8px 2px; }
.cf-hist { border-radius: 14px; background: var(--elevated); border: 1px solid var(--border); overflow: hidden; }
.cf-hist-linha {
  display: flex; align-items: center; gap: 10px; min-height: 42px; padding: 0 14px;
  border-bottom: 1px solid var(--border); font-size: 14px;
}
.cf-hist-linha:last-child { border-bottom: 0; }
.cf-hist-linha.cancelled { opacity: .45; text-decoration: line-through; }
.cf-hist-svc { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
`;
