# Convecta — tudo o que este chat sabe, para o próximo chat

Escrito a 11 de setembro de 2026, no fim de uma sessão longa com o Diogo. Serve para
um chat novo começar sem perder nada. Está em português porque o Diogo trabalha em
português.

---

## 0. AVISO AO PRÓXIMO CHAT — lê isto primeiro

O Diogo quer criar um **software interno ("local") da Convecta** para gerir a própria
empresa. **Antes de criares o que quer que seja:**

1. **Percebe o que ele quer realmente.** Faz perguntas até não haver dúvida sobre o que
   é, para quem é, o que faz, o que não faz, onde corre e o que já existe que não deve
   ser duplicado (há um super admin que já faz parte disto — ver secção 4).
2. **Desenha o workflow primeiro** e valida-o com ele. Só depois de o fluxo estar
   aprovado é que se decide, se documenta e, por fim, se executa.
3. A regra dele: **clareza antes da decisão, planeamento antes da execução, dados antes
   da opinião, execução só depois da decisão.** Nada de alterações radicais por impulso.
4. Ele quer que sejas **exigente e crítico**: se achares que ele está errado, diz e
   explica porquê. Mas sem complicar: a solução tem de servir uma empresa de uma pessoa
   com três clientes, preparada para crescer.
5. Uma decisão já tomada (ver secção 7) **não se altera sem razão forte e explicada**.

Como trabalhar com o Diogo: em **português**, **passo a passo**, sem dar por adquirido
que ele sabe o que é uma base de dados ("sou analfabeto total em base de dados", diz ele,
e trabalha sozinho). Ele **não tem dinheiro para gastar agora** ("tudo o que depender de
dinheiro temos que esperar"). Ele **corre o `git push` e escreve as palavras-passe**;
o chat nunca escreve palavras-passe nem cria contas em nome dele. Nunca pôr a chave
*service role* do Supabase no frontend; a chave privada VAPID vive só nos Secrets do
Supabase. Ele gosta de perceber o *porquê* de cada coisa.

---

## 1. Quem é a Convecta

- **Diogo Sousa Tavares**, trabalhador independente, Porto. Trabalha sozinho.
- Morada: Rua Faria Guimarães, 69, 4000-206 Porto. E-mail geral@convecta.pt.
  Telefone +351 912 381 717. Instagram @convecta.pt. Site convecta.pt.
- Negócio antigo: websites para negócios locais + "Convecta Care" (manutenção mensal).
  **Abandonado.** O contrato-modelo antigo (no Desktop) ainda é o dos websites.
- Negócio atual: **Convecta Booking** — software de marcações online e gestão para
  barbearias, por subscrição.
- **Clientes reais: 3 barbearias** — RastaVillage, RCUTTS, Cabana dos Macacos.
- **Objetivo declarado: 5 barbearias até ao fim de setembro de 2026.**
- **Preço decidido: 24,99 €/mês por barbearia**, tudo incluído, sem taxa de adesão, sem
  comissões por marcação. O site diz "sem fidelização" (ver contradição na secção 8).

---

## 2. O produto — o que existe e funciona hoje

Três aplicações sobre **uma** base de dados Supabase (projeto `qtpccpiybaraneqvenfq`,
região eu-west-1, Irlanda), publicadas no Vercel:

### 2.1 Site de marcações do cliente (`convecta-client`)
Endereço `<slug>.marcacoes.app`, um por barbearia, white-label (nome, logótipo, cores,
capa da barbearia; a Convecta não aparece). Instalável como app (PWA, manifest + sw.js).
O cliente **cria conta** para marcar. Faz: marcar em três toques (serviço → barbeiro →
hora livre; só aparecem horas livres), ver próximas marcações e histórico, cancelar até
ao prazo definido pela barbearia, cartão de fidelidade (carimbos; corte grátis usado na
própria marcação, decidido no servidor), lista de espera (só em memória — não grava),
notificação push quando o barbeiro confirma/cancela. Páginas: Home, Barbershop, Booking,
Appointments, Waitlist, Profile/ProfileEdit, ChangePassword, Notifications, Help, Login,
Packages/Subscriptions (não ligados).

### 2.2 Painel da barbearia (`convecta-admin`, administrador.marcacoes.app)
Agenda por barbeiro (vista dia/lista, mobile arranjado), marcações manuais, reagendar,
lista de espera (grava), confirmação em dois toques ou automática, antecedência mínima e
prazo de cancelamento configuráveis; clientes (ficha, histórico, gastos, carimbos,
aniversários); profissionais (horários, comissão %, desempenho); serviços; checkout
(método de pagamento, desconto, gorjeta; comissão guardada com a % em vigor em
`professional_commissions`; carimbo no mesmo toque; corte grátis a zero); caixa diária
(abrir/fechar, entradas/saídas, histórico); conta-corrente por cliente e por barbeiro;
fluxo de caixa; produtos, stock, stock mínimo, movimentos, fornecedores; relatórios;
**Excel mensal para o contabilista** (resumo + serviços linha a linha, gerado à mão em
`lib/excel.js`); tema/aparência; botão "Atualizar" (sem polling automático); push ao
barbeiro a cada marcação nova e cancelamento.

**Escondido do menu por não gravar** (`lib/modulos.js` → `MODULOS_POR_ACABAR`):
comandas, subscrições, promoções/cupões, marketing, pontos e recompensas de fidelização,
categorias de serviços, tipos. Também só em memória: despesas, encaixes, bloqueios,
avaliações, cartão de visita, ~50 parâmetros. Regra: "um módulo que perde trabalho é
pior do que não existir" — só volta ao menu quando gravar.

### 2.3 Super admin da Convecta (`convecta-superadmin`, convecta.marcacoes.app)
Back office do Diogo: criar barbearia (wizard "Demonstração"/nova barbearia: cria
business, utilizador, tema); tab Design (tema guardado na BD; mesmo contrato do client);
contrato (contract_start_date/end_date) e mensalidades (`gerarMensalidades`, 12 meses,
`monthly_price`, `next_payment_date`, `payment_status`); pipeline por barbearia (painel
criado → domínio ligado → app do cliente configurada → contrato assinado → fatura
emitida); calendário de vencimentos; relatórios e cashflow; **Contactos/leads** (tabela
`leads`, fonte `demo` e `site`, estados); relatórios Excel da Convecta (resumo +
mensalidades); documentos por barbearia (fatura/contrato/proposta); avisos às barbearias;
**apagar barbearia** com travas (RPC `apagar_barbearia` + limpeza de storage pela API).
Conta: geral@convecta.pt (a palavra-passe foi escrita numa conversa e **deve ser mudada**;
nunca a escrevas num chat).

### 2.4 Demonstração pública
`demo.marcacoes.app` (cliente) e `administrador.marcacoes.app/entrar?demo=1` (painel).
Barbearia real de slug `demo`, credenciais públicas por desenho
(demo-cliente@convecta.pt / demo-admin@convecta.pt, palavra-passe demo1234, guardadas em
`businesses.settings.demo`). Formulário de contacto à entrada (RPC `pedir_demonstracao`
→ `leads`), tutorial guiado (TourDemo, passos com `data-tour`), seta do sucesso da
marcação para o painel demo, reposição de hora a hora por pg_cron (`repor-demonstracao`,
`5 * * * *`, apaga só o que tem >60 min, a partir de `demo_snapshot`). **Abre vazia** —
falta dar-lhe dados de exemplo.

### 2.5 Website (convecta.pt)
Vite/React, Vercel, repositório `Desktop/CONVECTA WEBSITE 2`. Reescrito a 11 set: só
verdade, SEO, pré-renderização (cada página sai do build em HTML completo), preço 24,99
publicado, Termos e Privacidade novos (a rever por advogado), imagem OG, ícones, sitemap,
`/demo` → demonstração. Fonte única da verdade do site: `src/lib/seo.js` (SITE, PRECO_MENSAL,
FUNCIONALIDADES). Contactos do site → RPC `pedir_contacto` (chave pública). Google
Analytics desligado (GA_ID vazio). Search Console validada a 11 set (registo TXT no cPanel),
sitemap submetido, indexação pedida; o Google ainda mostrava o site antigo ("Arquitetura de
Conversão") — muda em dias. **Pendente:** no Vercel o `convecta.pt` redireciona para `www`;
o site diz que o oficial é sem www — ou muda-se no Vercel (recomendado) ou no código.

### 2.6 O que NÃO existe (não prometer)
Lembretes na véspera (SMS/WhatsApp/e-mail); e-mail de qualquer tipo (`bookingEmail.js` é
um stub); pagamentos online; domínio próprio ligado (há a coluna `domain`, não há
processo); cópias de segurança automáticas (plano Free; há cópias manuais em
`Desktop/backups` e no Drive); monitorização (Sentry/uptime); testes automáticos;
assinaturas, pacotes, cupões, comandas.

---

## 3. Infraestrutura e ferramentas

- **Supabase** Free (spend cap ON). RLS fechado a 11 set (vistas públicas
  `businesses_public/professionals_public/services_public`; RPCs `horarios_ocupados`,
  `usar_corte_gratis`, `devolver_corte_gratis`, `resumo_barbearia`, `apagar_barbearia`,
  `fotografar_demonstracao`, `repor_demonstracao`, `pedir_demonstracao`, `pedir_contacto`;
  constraint `appointments_sem_sobreposicao` (EXCLUDE gist, sem marcações duplas);
  trigger `proteger_contrato`; `users.business_id` nulo para super admin; políticas de
  push por papel). Tabelas principais: businesses (settings jsonb: theme, loyalty, demo,
  cancelamento…), users (papel), professionals, services, customers, appointments
  (pending → confirmed → completed/no_show; cancelled), professional_commissions,
  cash_sessions, cash_movements, products, stock_movements, suppliers, waitlist, forms,
  push_subscriptions, leads, business_deletions, demo_snapshot. Edge Functions:
  create-business, create-comercial, enviar-push. pg_cron: repor-demonstracao.
- **Vercel**: 3 apps + site. Provavelmente plano Hobby (não comercial — risco a resolver).
- **Domínios**: `marcacoes.app` (apps) e `convecta.pt` (site, comprado na Dominios.pt;
  DNS no cPanel `cpanel170.dnscpanel.com`, Zone Editor; A → 76.76.21.21, www CNAME →
  Vercel; e-mail continua no cPanel, `mail.convecta.pt`).
- **Código no PC do Diogo** (Windows): `Desktop/convecta-client/convecta-client`,
  `Desktop/convecta admin/convecta-admin`, `Desktop/convecta-superadmin`,
  `Desktop/CONVECTA WEBSITE 2`. Git + GitHub; **o Diogo faz o push**. Problema recorrente:
  ficheiros `.git/HEAD.lock` e `.git/index.lock` presos — resolve-se com
  `Remove-Item .git\HEAD.lock, .git\index.lock -ErrorAction SilentlyContinue`.
- **Limitação importante para um "software local": o registo npm está bloqueado (403)
  na máquina dele** — `npm install` de coisas novas falha. Foi por isso que o Excel foi
  escrito à mão sem dependências. Antes de escolher tecnologia, testar se o npm funciona;
  se não, escolher algo que não precise de instalar pacotes (ou instalar no Vercel, que
  faz `npm install` no build).
- Ferramentas usadas pelos chats: Cowork ligado ao PC (shell numa VM Linux com as pastas
  montadas; não apaga ficheiros, mas `mv` funciona), Chrome dele (Supabase SQL Editor,
  Vercel, cPanel, Search Console). Ele corre SQL que apague coisas; o chat prepara.
- Custos fixos atuais (relatório de escala, 10 set): ≈ 264 €/mês (Claude 90, contabilista
  150, domínios 7, Workspace 8, GitHub 9). Infra: 0 €. Break-even a 24,99 €: 13
  barbearias. Próximos custos previstos: Supabase Pro 25 $/mês (backups), Vercel Pro
  20 $/mês (uso comercial).

---

## 4. Processos que já existem (informais, na cabeça do Diogo e no super admin)

1. **Lead** → formulário do site ou da demo → tabela `leads` → super admin "Contactos"
   → o Diogo liga/WhatsApp.
2. **Nova barbearia** → super admin: wizard → tema → domínio/subdomínio → app do cliente
   configurada → contrato assinado → fatura emitida (pipeline com 5 passos). O Diogo
   entrega credenciais ao barbeiro. Documentado em `claude/processo-nova-barbearia.md` e
   `claude/pipeline-onboarding.md`.
3. **Mensalidades** → `gerarMensalidades` (12), calendário de vencimentos, estado
   pago/pendente/em atraso, relatório Excel "Mensalidades" para o contabilista.
4. **Contabilista** → Excel mensal (barbearia e Convecta). Sem IVA definido ainda.
5. **Backups** → manuais (Desktop/backups, Drive). Sem rotina.
6. **Deploy** → git push → Vercel automático. Sem staging, sem testes.
7. **Demo** → reposta sozinha de hora a hora.

O que **não** tem processo: suporte (quem liga, quando, registo), incidentes, alteração
de preço, cancelamento de cliente, faturação/recebimento (MB WAY? SEPA? Stripe? — não
decidido), onboarding com checklist, backup, atualizações às barbearias.

---

## 5. A organização que o Diogo quer (dita por ele a 11 set)

Cinco áreas, por esta ordem, uma de cada vez, sem acrescentar outras:
**1 Produto/Serviço · 2 Comunicação · 3 Sistematização de processos · 4 Fluxo de caixa ·
5 Legal.** Para cada área: primeiro perguntas para conhecer a realidade; ele responde com
o que está decidido / o que existe / o que não está decidido / a opinião dele; depois
opções e recomendação (o quê, porquê, vantagens, desvantagens, custos, riscos, impacto
futuro, como implementar); ele decide; documenta-se; só depois se executa. Tudo o que for
repetitivo vira processo. Assuntos fora das cinco áreas ficam registados "para mais tarde".

Críticas que este chat lhe fez (ele ainda não respondeu): (a) o fluxo de caixa está em
4.º mas trava decisões de produto — marcar decisões "presas ao dinheiro" e desbloqueá-las
na área 4; (b) risco de planear demasiado com 3 clientes e meta de 5 — a organização
corre ao lado das vendas, e o critério provisório é "o que as três barbearias precisam".

### Perguntas da área Produto já feitas (ele ainda não respondeu)
1 cliente-alvo (só barbearias PT, 1–5 barbeiros? salão/clínica sim ou não?); 2 o que os
três clientes usam de facto (pode medir-se na BD); 3 o que pediram e quem recusou;
4 como confirmam/avisam hoje, se os clientes aceitaram push, iPhone; 5 marcar sem conta?;
6 login por barbeiro/rececionista?; 7 módulos escondidos: apagar/acabar/esperar;
8 o que fica de fora (pagamentos online, marketplace, websites, redes sociais, à medida);
9 notificações: WhatsApp extra pago vs incluído, e solução a custo zero entretanto;
10 domínio próprio; 11 o que é "acabado" antes de vender mais; 12 suporte real (horas,
fins de semana); 13 horizonte 31 dez e 1 ano.

---

## 6. O software interno — o que se percebeu até agora e o que falta perceber

O que ele disse: "criar um software local da Convecta" para gerir a empresa segundo as
cinco áreas. **Não está definido** o que é. Perguntas que o próximo chat tem de fazer
antes de tocar em código (e antes disso, o workflow):

- "Local" quer dizer o quê: um programa no PC dele (Windows, offline), uma página privada
  só para ele, ou uma parte nova do super admin?
- Para quem: só o Diogo? Alguém mais um dia?
- O que gere: leads e clientes (já está no super admin — não duplicar), mensalidades e
  recebimentos (idem), tarefas/processos/checklists, fluxo de caixa da empresa (custos,
  receitas, previsões), documentos legais/contratos, comunicação (mensagens-tipo,
  Instagram, campanhas), registo de decisões?
- Que dados já existem no Supabase que ele quer ver aí (businesses, leads, mensalidades)
  e que dados são novos (custos fixos, tarefas, processos)?
- Onde ficam os dados: no Supabase (mesma BD, tabelas novas com RLS só para o super
  admin), ficheiros locais, ou outro sítio? Como se faz cópia de segurança?
- Como é que ele quer usá-lo no dia a dia: telemóvel, PC, ambos? Quanto tempo por dia?
- O que NÃO deve ser (para não virar um ERP de 40 módulos que ninguém usa).
- Tecnologia: verificar o npm bloqueado; ele conhece Vite/React (as três apps são isso);
  reaproveitar padrões que já existem (dataService, Supabase) ou fazer algo simples e
  separado?
- Critério de sucesso: como saberemos, em 30 dias, que valeu a pena?

Recomendação honesta deste chat, para o próximo ponderar: **desenhar primeiro os
processos das cinco áreas em texto** (o que ele já começou a fazer) e só depois decidir
que parte disso precisa de software — muita coisa resolve-se com um documento, uma
checklist ou uma tabela no super admin que já existe. O maior risco é construir uma
ferramenta antes de saber o processo que ela sistematiza.

---

## 7. Decisões já tomadas (não alterar sem razão forte)

- Preço único 24,99 €/mês por barbearia, sem taxa de adesão, sem comissões.
- Público: barbearias em Portugal. Um só produto (sem versões Beauty/Clinic).
- Personalização nível 2: marca, cores, capa, endereço próprio, serviços, regras.
- Módulos que não gravam ficam escondidos do painel até gravarem.
- Demonstração pública (sem registo, com formulário à entrada) como principal ferramenta
  de venda; botão da demo em verde com brilho no site do cliente.
- O cliente final nunca vê a marca Convecta (white-label).
- Site diz só a verdade: nada de funcionalidades inexistentes, números ou testemunhos
  inventados (retirados a 11 set).
- Excel para o contabilista feito à mão, sem dependências. Sem IVA até haver taxas definidas.
- Regras técnicas: nada se dá por feito sem se ver do lado de quem recebe; uma política
  RLS sem FOR é FOR ALL; o erro de um insert lê-se sempre; um número de dinheiro tem uma
  definição num sítio só; nunca misturar toISOString() com getHours(); uma conta de super
  admin não pertence a nenhuma barbearia.

---

## 8. Em aberto / contradições / riscos conhecidos

- **Notificações** (dito pelo Diogo como "lacuna grave"): web push só chega se o cliente
  aceitou e, no iPhone, só com o site instalado; o barbeiro não sabe quem recebe.
  Custos a 600 marcações/mês: WhatsApp ≈ 8,50 €/barbearia/mês (34 % do preço),
  SMS 24–48 €, e-mail ≈ 0 € mas pouco lido, push 0 €. **Adiado por dinheiro.** Caminhos a
  custo zero antes: medir `push_subscriptions` por barbearia, mostrar no painel quem tem
  push, botão "avisar por WhatsApp" (wa.me com mensagem pronta), e-mail de confirmação.
- **Contrato vs site**: o site e os Termos dizem "sem fidelização"; o super admin gera 12
  mensalidades e tem modelo de "renovação do contrato anual". Uma das duas está errada.
- **IVA**: o site diz "acresce IVA quando aplicável"; falta decisão com o contabilista.
- **Legal**: Privacidade e Termos novos precisam de advogado; falta nome/NIF na página;
  contrato-modelo é o dos websites; RGPD como subcontratante das barbearias.
- **Supabase Free**: sem backups automáticos (25 $/mês para Pro). **Vercel Hobby**:
  uso comercial não permitido (20 $/mês Pro).
- **Forma de receber** das barbearias não decidida (MB WAY, transferência, SEPA, Stripe).
- **Defeitos por resolver**: "Os meus dados"/palavra-passe/recuperação no site do cliente;
  agenda sem janela de datas (egress); toISOString() em ~10 sítios; layouts mobile de
  Marcações/Clientes/Caixa; fidelidade com várias fontes para o limiar; owner_id nunca
  preenchido; ícones do PWA em falta; demo vazia; zero testes; sem monitorização.
- Vercel: `convecta.pt` → `www` (inconsistente com o canonical).

---

## 9. Documentos no projeto "Convecta - App Barber" (o próximo chat pode lê-los)

- `claude/contexto-tecnico.md` — arquitetura e contexto técnico.
- `claude/auditoria-2026-09-10.md` — 148 achados, os cinco que bloqueavam, padrão de bug.
- `claude/escala-2026-09-10.md` — capacidade, custos, preços de fornecedores, decisões de
  desenho (outbox de notificações, retenção, backups).
- `claude/seguranca-rls.md` — o que foi fechado na base de dados.
- `claude/pronto-para-vender.md` — estado a 11 set, aberto/fechado, incidente RCUTTS.
- `claude/demonstracao.md` — como a demo funciona e se repõe.
- `claude/pipeline-onboarding.md`, `claude/processo-nova-barbearia.md` — como entra uma
  barbearia.
- `claude/contrato-tema.md`, `claude/white-label-checklist.md` — tema e marca branca.
- `claude/website-seo.md` — o que mudou no site a 11 set, decisões e passos no Google.
- Artefactos: "Convecta, o estado do código", "Auditoria Convecta", "Convecta a 1.000".
