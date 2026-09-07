// Email de confirmação — stub para desenvolvimento local.
// Em produção: ligar ao teu provider de email (Resend, SendGrid, etc.)
export async function sendConfirmationEmail({ appointment, customer, service, professional, business }) {
  if (!customer?.email) return { ok: false, skipped: true };
  console.log(`[bookingEmail] Confirmação para ${customer.email} — ${appointment?.bookingRef}`);
  return { ok: true, skipped: true };
}
