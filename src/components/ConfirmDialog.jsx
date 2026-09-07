import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Modal, Button } from '@/components/ui';

export default function ConfirmDialog({ open, onClose, onConfirm, title = 'Confirmar', message, details, confirmLabel = 'Confirmar', cancelLabel = 'Voltar', danger = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title}
      footer={<><Button variant="ghost" onClick={onClose}>{cancelLabel}</Button><Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm}>{confirmLabel}</Button></>}>
      {details && <div className="ag-detail mb-16">{details}</div>}
      <div className="flex items-start gap-12">
        {danger && <span className="alert-ico danger" style={{ flexShrink: 0 }}><AlertTriangle size={16} /></span>}
        <p className="text-sec" style={{ margin: 0 }}>{message}</p>
      </div>
    </Modal>
  );
}