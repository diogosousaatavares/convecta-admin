# Modelos de email do Supabase

Os quatro textos que o **Supabase** manda por conta própria — não são os
nossos lembretes, esses estão nas edge functions.

Onde se colam: **Authentication → Emails → Templates**. Cada bloco vai para o
modelo com o nome indicado. Copia o HTML todo, do `<!doctype` ao `</html>`.

**Porque dizem "Marcações" e não o nome da barbearia:** este modelo é um só
para todas as barbearias da rede — o Supabase não sabe de qual delas veio o
pedido. Pôr aqui o nome de uma era mentir às outras. E, sobretudo, **não pode
dizer Convecta**: quem recebe é cliente da barbearia e não tem nada que saber
quem lhes fez o software.

O `{{ .ConfirmationURL }}` é o Supabase a pôr o link lá dentro. Não se mexe.

---

## Repor a palavra-passe

**Modelo no Supabase:** `Reset Password`

O mais usado dos quatro. É o que o cliente vê quando carrega em «Esqueci-me da palavra-passe».

```html
<!doctype html>
<html lang="pt-PT"><body style="margin:0;background:#f4f2ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#1a1714">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ee;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.06)">
  <tr><td style="padding:26px">
    <div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#8a8272">Marcações</div>
    <h1 style="margin:10px 0 12px;font-size:21px;line-height:1.3">Repor a palavra-passe</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4a4238">Pediste uma palavra-passe nova. Carrega no botão e escolhe outra — o link serve uma vez e expira dentro de uma hora.</p>
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#1a1714;color:#fff;text-decoration:none;padding:12px 20px;border-radius:9px;font-weight:600;font-size:15px">Escolher palavra-passe</a>
    <p style="margin:20px 0 0;font-size:13px;color:#6b6355;line-height:1.6">Se não foste tu que pediste, ignora esta mensagem. A tua palavra-passe fica como está e não acontece mais nada.</p>
  </td></tr>
</table></td></tr></table></body></html>
```

---

## Confirmar a conta

**Modelo no Supabase:** `Confirm signup`

Hoje não é usado — a confirmação de email é nossa, pelo Resend. Fica escrito para o dia em que o *Confirm email* do Supabase for ligado por alguma razão.

```html
<!doctype html>
<html lang="pt-PT"><body style="margin:0;background:#f4f2ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#1a1714">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ee;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.06)">
  <tr><td style="padding:26px">
    <div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#8a8272">Marcações</div>
    <h1 style="margin:10px 0 12px;font-size:21px;line-height:1.3">Confirma o teu email</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4a4238">Falta só confirmares este endereço para a tua conta ficar pronta.</p>
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#1a1714;color:#fff;text-decoration:none;padding:12px 20px;border-radius:9px;font-weight:600;font-size:15px">Confirmar email</a>
    <p style="margin:20px 0 0;font-size:13px;color:#6b6355;line-height:1.6">Se não foste tu que criaste esta conta, ignora esta mensagem — não acontece mais nada.</p>
  </td></tr>
</table></td></tr></table></body></html>
```

---

## Mudar de email

**Modelo no Supabase:** `Change Email Address`

Quando alguém troca o endereço da conta. Repara no rodapé: manda avisar a barbearia, porque uma mudança de email que a pessoa não pediu é sinal de conta invadida.

```html
<!doctype html>
<html lang="pt-PT"><body style="margin:0;background:#f4f2ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#1a1714">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ee;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.06)">
  <tr><td style="padding:26px">
    <div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#8a8272">Marcações</div>
    <h1 style="margin:10px 0 12px;font-size:21px;line-height:1.3">Confirma o endereço novo</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4a4238">Pediste para passar a usar este endereço na tua conta. Carrega no botão para confirmar que é mesmo teu.</p>
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#1a1714;color:#fff;text-decoration:none;padding:12px 20px;border-radius:9px;font-weight:600;font-size:15px">Confirmar endereço</a>
    <p style="margin:20px 0 0;font-size:13px;color:#6b6355;line-height:1.6">Se não foste tu que pediste esta mudança, ignora esta mensagem e avisa a tua barbearia — pode ser sinal de que alguém entrou na tua conta.</p>
  </td></tr>
</table></td></tr></table></body></html>
```

---

## Entrar sem palavra-passe

**Modelo no Supabase:** `Magic Link`

Só é usado se um dia ligares a entrada por link. Fica pronto.

```html
<!doctype html>
<html lang="pt-PT"><body style="margin:0;background:#f4f2ee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;color:#1a1714">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f2ee;padding:24px 12px"><tr><td align="center">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#fff;border-radius:14px;overflow:hidden;box-shadow:0 2px 10px rgba(0,0,0,.06)">
  <tr><td style="padding:26px">
    <div style="font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#8a8272">Marcações</div>
    <h1 style="margin:10px 0 12px;font-size:21px;line-height:1.3">Entrar na tua conta</h1>
    <p style="margin:0 0 20px;font-size:15px;line-height:1.6;color:#4a4238">Aqui está a tua entrada. O link serve uma vez e expira dentro de uma hora.</p>
    <a href="{{ .ConfirmationURL }}" style="display:inline-block;background:#1a1714;color:#fff;text-decoration:none;padding:12px 20px;border-radius:9px;font-weight:600;font-size:15px">Entrar</a>
    <p style="margin:20px 0 0;font-size:13px;color:#6b6355;line-height:1.6">Se não foste tu que pediste, ignora esta mensagem. Ninguém entra sem carregar neste link.</p>
  </td></tr>
</table></td></tr></table></body></html>
```

---

## Depois de colares os quatro

**Confirma o assunto de cada um.** O campo *Subject* fica por cima do HTML e
também está em inglês de fábrica. Sugestões:

| Modelo | Assunto |
|---|---|
| Reset Password | `Repor a palavra-passe` |
| Confirm signup | `Confirma o teu email` |
| Change Email Address | `Confirma o endereço novo` |
| Magic Link | `Entrar na tua conta` |

**E sobe os limites de envio.** Em *Authentication → Rate Limits*, o limite de
emails por hora vem de fábrica em **30**. Com cinquenta barbearias e uma
manhã de segunda-feira, isso enche — e quem fica de fora não recebe nada nem
percebe porquê. Põe **200**.
