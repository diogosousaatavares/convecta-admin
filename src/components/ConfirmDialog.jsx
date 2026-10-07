import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal, Button } from '@/components/ui';

/*
 * `extra` é a saída. Um diálogo com duas portas — fazer e não fazer —
 * obriga a escolher entre o que se queria e nada; `extra` é o terceiro
 * botão, para a coisa que resolve o problema sem a consequência (re-agendar
 * em vez de cancelar, por exemplo).
 */
export default function ConfirmDialog({ open, onClose, onConfirm, title = 'Confirmar', message, details, extra, confirmLabel = 'Confirmar', cancelLabel = 'Voltar', danger = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={<><Button variant="ghost" onClick={onClose}>{cancelLabel}</Button><Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button></>}>
      {details && <div className="ag-detail mb-16">{details}</div>}
      {extra && <div style={{ marginBottom: 14 }}>{extra}</div>}
      <div className="flex items-start gap-12">
        {danger && <span className="alert-ico danger" style={{ flexShrink: 0 }}><AlertTriangle size={16} /></span>}
        <p className="text-sec" style={{ margin: 0 }}>{message}</p>
      </div>
    </Modal>
  );
}