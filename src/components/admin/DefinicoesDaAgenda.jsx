import React from 'react';
import { Modal } from '@/components/ui';
import { useStore } from '@/hooks/useStore';
import dataService from '@/lib/dataService';
import { useToast } from '@/components/ui/ToastContext';
import { HorasQueAbrem, AteQuandoSePodeMarcar, DiasQueFogemARegra, CSS_DEF_AG } from '@/pages/admin/Definicoes';

/*
 * AS DEFINIÇÕES DA AGENDA, NA AGENDA (15/10/2026).
 *
 * O barbeiro não vai às Definições à procura de «como abrem as horas»: está
 * na agenda e quer mudar ali. A engrenagem ao lado das vistas abre isto. São
 * os mesmos blocos de Definições › Agenda — um só código, dois sítios.
 */
export default function DefinicoesDaAgenda({ aberta, fechar }) {
  const data = useStore();
  const toast = useToast();
  const cfg = data.business?.config?.agenda || {};
  const guardar = async (updates) => {
    try { await dataService.updateConfig('agenda', updates); toast.success('Guardado'); }
    catch (e) { toast.error('Não foi possível guardar', e.message); }
  };
  return (
    <Modal open={aberta} onClose={fechar} title="Definições da agenda">
      <style dangerouslySetInnerHTML={{ __html: CSS_DEF_AG + `
        .modal .def-ag { max-width: none; gap: 0; }
        .modal .def-ag-caixa { border: 0; border-radius: 0; padding: 14px 0; border-bottom: 1px solid var(--border); box-shadow: none; background: none; }
        .modal .def-ag-caixa:first-child { padding-top: 0; }
        .modal .def-ag-caixa:last-child { border-bottom: 0; padding-bottom: 0; }
        .modal .def-ag-caixa h3 { font-size: 16px; display: flex; align-items: center; gap: 2px; }
      ` }} />
      <div className="def-ag">
        <HorasQueAbrem cfg={cfg} onGuardar={guardar} />
        <AteQuandoSePodeMarcar cfg={cfg} onGuardar={guardar} />
        <DiasQueFogemARegra cfg={cfg} onGuardar={guardar} />
      </div>
    </Modal>
  );
}
