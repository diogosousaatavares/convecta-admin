-- ════════════════════════════════════════════════════════════════════════
--  REINTENTOS — corre DEPOIS de LEMBRETES.sql
-- ════════════════════════════════════════════════════════════════════════
--
--  O problema que isto arranja:
--
--  Na primeira versão, bastava existir uma linha em avisos_enviados para a
--  marcação (ou o cliente) sair da lista para sempre. A intenção era boa —
--  ninguém quer dois lembretes da mesma marcação. Mas a linha também é
--  escrita quando a coisa CORRE MAL: o correio recusou, o domínio ainda não
--  estava verificado, o cliente não tinha forma de ser contactado. Nesses
--  casos a pessoa ficava condenada a nunca mais ser avisada, por causa de
--  uma avaria de cinco minutos.
--
--  A regra certa é outra: o que não se repete é uma entrega FEITA. Uma
--  tentativa falhada repete-se, com tempo pelo meio e com um tecto.
--
--     lembrete       →  volta a tentar de 30 em 30 minutos, até 6 vezes
--     confirmação    →  volta a tentar de 6 em 6 horas, até 5 vezes
--
--  O tecto existe para o caso do email estar simplesmente errado: ao fim de
--  algumas tentativas deixa-se em paz em vez de bater à porta para sempre.
-- ════════════════════════════════════════════════════════════════════════

-- ── 1. O índice único deixa de contar as falhas ────────────────────────
-- Antes: uma linha por (marcação, tipo), fosse ela o que fosse.
-- Agora: uma linha ENTREGUE por (marcação, tipo). As falhadas podem
-- acumular-se — e é bom que se acumulem, é o histórico que nos deixa ver
-- o que se passou, como se viu hoje.
drop index if exists public.um_aviso_por_marcacao;

create unique index if not exists um_aviso_entregue_por_marcacao
  on public.avisos_enviados (appointment_id, tipo)
  where appointment_id is not null
    and estado = 'enviado'
    and canal <> 'nenhum';

-- ── 2. Lembretes ───────────────────────────────────────────────────────
create or replace function public.lembretes_por_enviar(p_limite int default 200)
 returns table (
   appointment_id  uuid,
   business_id     uuid,
   barbearia       text,
   slug            text,
   customer_id     uuid,
   cliente         text,
   email           text,
   email_confirmado boolean,
   tem_push        boolean,
   servico         text,
   profissional    text,
   comeca_em       timestamptz,
   horas_antes     int
 )
 language sql
 stable
 security definer
 set search_path = public, pg_temp
as $$
  select
    a.id,
    b.id,
    b.name,
    b.slug,
    c.id,
    nullif(btrim(coalesce(c.name, '')), ''),
    nullif(btrim(coalesce(c.email, '')), ''),
    (c.metadata->>'emailConfirmadoEm') is not null
      and (c.metadata->>'emailInvalidoEm') is null,
    exists (
      select 1 from public.push_subscriptions p
       where p.business_id = b.id and p.user_id = c.user_id and p.papel = 'customer'
    ),
    coalesce(s.name, a.metadata->>'serviceNameSnapshot'),
    coalesce(pr.name, a.metadata->>'professionalNameSnapshot'),
    a.start_at,
    coalesce((b.settings->'reminders'->>'horasAntes')::int, 24)
  from public.appointments a
  join public.businesses b on b.id = a.business_id
  join public.customers  c on c.id = a.customer_id
  left join public.services s on s.id = a.service_id
  left join public.professionals pr on pr.id = a.professional_id
 where a.status = 'confirmed'
   and coalesce((a.metadata->>'blocked')::boolean, false) = false
   -- A barbearia tem de ter os lembretes ligados. Por omissão, não tem:
   -- ninguém começa a mandar mensagens aos clientes de outra pessoa sem
   -- essa pessoa dizer que sim.
   and coalesce((b.settings->'reminders'->>'ativo')::boolean, false) = true
   -- Está dentro da janela e ainda não aconteceu.
   and a.start_at > now()
   and a.start_at <= now() + (coalesce((b.settings->'reminders'->>'horasAntes')::int, 24) || ' hours')::interval
   -- Já foi ENTREGUE, ou falhou há pouco e ainda está a arrefecer.
   and not exists (
     select 1 from public.avisos_enviados v
      where v.appointment_id = a.id
        and v.tipo = 'lembrete'
        and (
          (v.estado = 'enviado' and v.canal <> 'nenhum')
          or v.criado_em > now() - interval '30 minutes'
        )
   )
   -- Tecto de tentativas.
   and (
     select count(*) from public.avisos_enviados v
      where v.appointment_id = a.id and v.tipo = 'lembrete'
   ) < 6
 order by a.start_at
 limit greatest(1, least(p_limite, 500));
$$;

revoke all on function public.lembretes_por_enviar(int) from public, anon, authenticated;

-- ── 3. Convites para confirmar o email ─────────────────────────────────
create or replace function public.confirmacoes_por_enviar(p_limite int default 100)
 returns table (
   customer_id uuid,
   business_id uuid,
   barbearia   text,
   slug        text,
   cliente     text,
   email       text
 )
 language sql
 stable
 security definer
 set search_path = public, pg_temp
as $$
  select c.id, b.id, b.name, b.slug,
         nullif(btrim(coalesce(c.name, '')), ''),
         btrim(c.email)
    from public.customers c
    join public.businesses b on b.id = c.business_id
   where coalesce(btrim(c.email), '') <> ''
     and c.metadata->>'emailConfirmadoEm' is null
     and c.metadata->>'emailInvalidoEm' is null
     and coalesce((b.settings->'reminders'->>'ativo')::boolean, false) = true
     -- Só a quem tem marcação — não se escreve a quem nunca lá foi.
     and exists (select 1 from public.appointments a
                  where a.customer_id = c.id and a.status in ('confirmed', 'completed'))
     -- Um convite que saiu não se repete.
     and not exists (select 1 from public.avisos_enviados v
                      where v.customer_id = c.id
                        and v.tipo = 'confirmacao-email'
                        and v.estado = 'enviado')
     -- Um que falhou deixa-se arrefecer seis horas.
     and not exists (select 1 from public.avisos_enviados v
                      where v.customer_id = c.id
                        and v.tipo = 'confirmacao-email'
                        and v.criado_em > now() - interval '6 hours')
     -- E ao fim de cinco tentativas desiste-se.
     and (select count(*) from public.avisos_enviados v
           where v.customer_id = c.id and v.tipo = 'confirmacao-email') < 5
   limit greatest(1, least(p_limite, 200));
$$;

revoke all on function public.confirmacoes_por_enviar(int) from public, anon, authenticated;

-- ── 4. Limpar as falhas de hoje ────────────────────────────────────────
-- As quatro linhas que ficaram com 'domain is not verified' foram uma
-- avaria de configuração, não um email errado. Apagam-se para as tentativas
-- recomeçarem do zero assim que o domínio estiver verificado, em vez de
-- esperar seis horas por nada.
delete from public.avisos_enviados
 where tipo = 'confirmacao-email'
   and estado = 'erro'
   and detalhe ilike '%domain is not verified%';

-- ── Conferir ───────────────────────────────────────────────────────────
--   select * from confirmacoes_por_enviar(50);
--   select * from lembretes_por_enviar(50);
