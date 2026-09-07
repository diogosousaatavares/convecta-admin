import { useEffect, useRef } from 'react';
import dataService from '@/lib/dataService';

const DAY_NAMES = ['sunday','monday','tuesday','wednesday','thursday','friday','saturday'];

function toMin(t) {
  if (!t) return null;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + m;
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = 'sine';
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.6);
  } catch (_) {}
}

function sendNotification(title, body) {
  playBeep();
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') new Notification(title, { body, icon: '/favicon.ico' });
    });
  }
}

export default function useCaixaNotifications(business) {
  const firedOpenAlert = useRef(false);
  const firedCloseAlert = useRef(false);
  const lastDay = useRef(null);

  useEffect(() => {
    if (!business?.openingHours) return undefined;

    const check = async () => {
      const now = new Date();
      const todayKey = now.toISOString().slice(0, 10);
      const dow = now.getDay();
      const nowMin = now.getHours() * 60 + now.getMinutes();

      if (lastDay.current !== todayKey) {
        lastDay.current = todayKey;
        firedOpenAlert.current = false;
        firedCloseAlert.current = false;
      }

      const hours = business.openingHours.find(h => h.day === DAY_NAMES[dow]);
      if (!hours || !hours.isOpen) return;

      const openMin = toMin(hours.open);
      const closeMin = toMin(hours.close);
      if (openMin == null || closeMin == null) return;

      const session = await dataService.getOpenCashSession();

      if (!firedOpenAlert.current && nowMin >= openMin + 30 && nowMin < closeMin) {
        if (!session) {
          firedOpenAlert.current = true;
          sendNotification(
            'Caixa não foi aberta',
            `A barbearia abriu às ${hours.open} mas a caixa ainda não foi aberta. Abre a caixa agora.`
          );
        } else {
          firedOpenAlert.current = true;
        }
      }

      if (nowMin >= closeMin + 30 && session) {
        const bucket = Math.floor(nowMin / 10);
        const bucketKey = `close-${todayKey}-${bucket}`;
        if (!firedCloseAlert.current || firedCloseAlert.current !== bucketKey) {
          firedCloseAlert.current = bucketKey;
          sendNotification(
            'Caixa ainda aberta',
            `A barbearia fechou às ${hours.close} mas a caixa ainda não foi fechada. Fecha a caixa agora.`
          );
        }
      }
    };

    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    check();
    const interval = setInterval(check, 60 * 1000);
    return () => clearInterval(interval);
  }, [business]);
}
