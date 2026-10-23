import React, { useState } from 'react';
import { Modal, Button } from '@/components/ui';
import dataService from '@/lib/dataService';

/*
 * «Houve algum erro?» (23/10/2026, pedido de um founder). Uma marcação já
 * cobrada pode ter ficado com o método errado (era MB WAY, ficou Dinheiro)
 * ou o valor errado. Corrige-se aqui, por cima: a comissão e o total do
 * cliente são recalculados e fica o registo. Abre-se da Agenda e das
 * Marcações.
 */
const METODOS = ['Dinheiro', 'Cartão', 'MB WAY', 'Transferência', 'Voucher'];

export default function CorrigirCobranca({ appointment, onClose, onFeito }) {
  const [f, setF] = useState({ method: appointment?.paymentMethod || 'Dinheiro', total: String(Number(appointment?.payment?.total) || 0), motivo: '' });
  const [aGravar, setAGravar] = useState(false);
  const [erro, setErro] = useState('');
  if (!appointment) return null;
  const gravar = async () => {
    setAGravar(true); setErro('');
    try { await dataService.corrigirCobranca(appointment.id, f); onFeito?.(); onClose(); }
    catch (e) { setErro(e.message || 'Não foi possível corrigir.'); }
    finally { setAGravar(false); }
  };
  return (
    <Modal open onClose={onClose} title="Houve algum erro?"
      footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button variant="primary" disabled={aGravar} onClick={gravar}>{aGravar ? 'A gravar…' : 'Gravar correção'}</Button></>}>
      <div className="ag-detail">
        <div className="field">
          <label className="label">Como foi pago</label>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {METODOS.map(m => (
              <button key={m} type="button" className={`btn btn-sm ${f.method === m ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setF(c => ({ ...c, method: m }))}>{m}</button>
            ))}
          </div>
        </div>
        <div className="field">
          <label className="label">Valor cobrado (€)</label>
          <input className="input" type="number" min="0" step="0.5" inputMode="decimal" value={f.total} onChange={e => setF(c => ({ ...c, total: e.target.value }))} />
          <div className="text-sm mt-8" style={{ color: 'var(--text-sec)' }}>A comissão e o total do cliente são recalculados.</div>
        </div>
        <div className="field">
          <label className="label">O que aconteceu (opcional)</label>
          <input className="input" type="text" placeholder="Ex.: era MB WAY, não dinheiro" value={f.motivo} onChange={e => setF(c => ({ ...c, motivo: e.target.value }))} />
        </div>
        {erro && <div className="text-sm" style={{ color: 'var(--error)' }}>{erro}</div>}
      </div>
    </Modal>
  );
}
