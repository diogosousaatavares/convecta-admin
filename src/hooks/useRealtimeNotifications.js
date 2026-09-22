import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { atualizarAgora } from '@/lib/dataService';

export function useRealtimeNotifications(businessId) {
  const channelRef = useRef(null);

  useEffect(() => {
    if (!businessId) return;

    // Pedir permissão para notificações do browser
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Subscrever ao Realtime do Supabase
    channelRef.current = supabase
      .channel('new-appointments')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'appointments',
          filter: `business_id=eq.${businessId}`,
        },
        (payload) => {
          const appt = payload.new;
          if (!appt) return;
          // Tocar e nao mostrar era meio aviso: a agenda passa a trazer a
          // marcacao nova logo, sem carregar em «Atualizar».
          atualizarAgora();
          if (appt.metadata && appt.metadata.blocked) return;

          // Notificação no browser
          if ('Notification' in window && Notification.permission === 'granted') {
            const n = new Notification('Nova marcação! ✂️', {
              body: `${appt.status === 'confirmed' ? 'Confirmada' : 'Por confirmar'} · ${appt.start_at ? new Date(appt.start_at).toLocaleString('pt-PT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : 'breve'}`,
              icon: '/favicon.png',
              badge: '/favicon.png',
              tag: appt.id,
            });
            n.onclick = () => { window.focus(); n.close(); };
            setTimeout(() => n.close(), 8000);
          }

          // Tocar som de notificação
          try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.setValueAtTime(660, ctx.currentTime + 0.1);
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);
          } catch {}
        }
      )
      // Cancelamentos e mudanças feitas pelo cliente: só atualizar, sem som.
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'appointments', filter: `business_id=eq.${businessId}` },
        () => { atualizarAgora(); }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [businessId]);
}
