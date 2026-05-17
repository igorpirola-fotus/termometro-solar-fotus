# Diário de Desenvolvimento — Termômetro do Mercado Solar

---

## Fase 1 — Entendimento da infraestrutura existente (16/05/2026)

Mapeamos tudo que já existia: n8n self-hosted no EasyPanel, uma instância Z-API capturando mensagens de grupos de WhatsApp e salvando em um banco Postgres interno (`fotus_postgres`, database `fotus`, tabela `public.messages`), e um projeto no Supabase (`fotus-fop-tracking`) com o frontend já deployado no Vercel.

---

## Fase 2 — Primeiro pipeline (semanal) (16/05/2026)

Criamos um workflow n8n de 6 nós que lia mensagens do Postgres, chamava o Claude Sonnet diretamente pela API da Anthropic e salvava o resultado no Supabase. Descobrimos que o n8n na versão atual não tem o recurso de Variáveis (é pago), então substituímos por credenciais do tipo Header Auth para guardar a chave da API da Anthropic.

---

## Fase 3 — Migração para arquitetura moderna (16/05/2026)

Identificamos que o fluxo estava complexo e dependente de configurações frágeis. Decidimos migrar para **Supabase Edge Functions** — serverless, sem n8n para a parte de análise.

Problema encontrado: o banco `messages` é interno ao EasyPanel e inacessível externamente. Solução: **arquitetura híbrida** — n8n continua responsável por buscar as mensagens (ele está na mesma rede), e passa os dados para a Edge Function que faz a análise com Claude e salva no Supabase.

Pipeline final:
```
n8n (busca no Postgres interno)
  → Edge Function analyze-market
      → Claude Sonnet API
      → Supabase relatorios
  → Frontend Vercel (lê automaticamente)
```

---

## Fase 4 — Deploy e validação (16/05/2026)

- Edge Function `analyze-market` deployada via Supabase CLI
- Chave da Anthropic configurada como secret no Supabase (`supabase secrets set`)
- Primeiro erro: `max_tokens: 4000` insuficiente para o JSON completo — aumentado para 8000
- **Primeiro teste bem-sucedido:** 499 mensagens processadas, relatório salvo, dashboard carregando dados reais do Supabase
- Frontend atualizado para usar o Supabase JS client (compatível com a nova chave publishable)
- Deploy no Vercel via git push

---

## Fase 5 — Descoberta sobre os grupos (16/05/2026)

Ao analisar os dados, identificamos que o filtro `group_jid LIKE '%@g.us'` (padrão WhatsApp nativo) estava errado para a integração Z-API, que usa o formato `numero-timestamp` com hífen. Corrigido para `group_jid LIKE '%-%'`. Também excluímos o grupo interno da Fotus da análise.

---

## Fase 6 — Migração para análise diária com delta de inteligência (16/05/2026)

Decisão estratégica: em vez de uma análise semanal estática, construir uma **inteligência diária com memória**. Cada dia é analisado separadamente e comparado com o dia anterior.

O que foi implementado:

- **Edge Function atualizada** com prompt novo focado em análise diária + campo `delta`
- Coluna `data_referencia DATE` adicionada à tabela `relatorios` com índice único
- **Workflow diário** (`n8n-workflow-diario.json`): roda todo dia às 06:00 BRT
- **Workflow de backfill** (`n8n-workflow-backfill.json`): processa cada dia em loop

---

## Fase 7 — Navegação por data e card de delta (16/05/2026)

- **Navegação por data no topbar**: setas `←` / `→` para navegar entre os dias disponíveis
- **Card de delta "O que mudou hoje"**: variação de score, badge de tendência, resumo textual
- **Carregamento por data**: busca todas as datas disponíveis e carrega por data específica

---

## Fase 8 — Premissas de análise e reformulação do prompt (16/05/2026)

Sessão estratégica completa antes de redesenhar o front-end. Definido e documentado:

**Portfólio Fotus mapeado:**
- Inversores string: GoodWe, Solplanet, Solis, AUXSOL (exclusivo), Deye
- Inversores híbridos: GoodWe Hybrid, Solis Hybrid, Solplanet Hybrid, Deye Hybrid
- Microinversores: TSUNESS, Deye Micro (exclusivo)
- Módulos: LONGi, Astronergy, Sunova, Pulling (exclusivo), Jinko Solar
- Baterias: Deye Battery (ecossistema fechado), UCB Power (aberto)

**Mapa competitivo (Greener 2026):**
- Tier 1: Belenergy + Fortlev Solar
- Tier 2: Soollar, Aldo Solar, Sou Energy

**Novo schema JSON:** adicionados `briefing_executivo`, `radar_portfolio`, `lacunas_portfolio`, `concorrentes_distribuidores`.

---

## Fase 9 — Redesign executivo do front-end (16/05/2026)

Reformulação completa do layout para os novos campos do schema v3:

1. **Hero: Briefing Executivo** — 3 cards em grid com borda lateral colorida por prioridade
2. **KPIs** (4 colunas) + Delta card
3. **Gauge de Aquecimento + Radar do Portfólio Fotus**
4. **Menções sobre a Fotus** na coluna lateral
5. **Concorrentes Distribuidores** com badge Tier
6. **Lacunas de Portfólio** com demanda Alta/Média/Baixa
7. **Backward compatibility:** relatórios antigos renderizam layout legado via `hasNewSchema` flag

---

## Fase 10 — Reprocessamento com schema v3 e ativação do workflow diário (16/05/2026)

- `splitInBatches` não funciona em webhooks de produção — criado Path B flat sem loop
- Workflow diário reformulado e ativado: roda às 06:00 BRT
- Supabase `relatorios`: 2 registros com schema v3 (16/05 e 15/05)

---

## Fase 11 — Rebuild dark mode, newsletter e refinamentos UI (17/05/2026)

### Dashboard — Rebuild completo dark mode

Substituição total do `public/index.html` por design enterprise premium:

**Design system:**
- `--bg: #0F1117`, `--surface: #161B27`, `--surface2: #1E2536`
- Tipografia: IBM Plex Mono (números) + IBM Plex Sans (textos)
- Cores semânticas: âmbar (score alto), verde (positivo), vermelho (crítico), azul (neutro)

**Novo layout (schema novo):**
- **Linha 1:** Gauge 35% + Síntese do dia 65% (sem cabeçalho, texto direto)
- **Linha 2:** Sparkline 7 dias + 3 KPIs estratégicos (Alertas críticos / Lacunas portfólio / Distribuidoras)
- **Linha 3:** Insights críticos em grid `auto-fill minmax(360px, 1fr)`
- **Linha 4:** Portfólio & Mercado (Radar / Lacunas / Distribuidoras)
- **Linha 5:** Análise (Marcas mencionadas + Objeções)
- **Linha 6:** Matriz de sinais full-width com 4 colunas
- **Linha 7:** Menções à Fotus full-width

**Toggle dark/light mode:**
- Botão no topbar com ícone SVG lua/sol
- Preferência salva em `localStorage`
- Charts rerenderizados ao trocar tema (cores adaptadas via `isLight` flag)

**Topbar com drawer:**
- Drawer lateral overlay (abre/fecha por `☰` ou clique fora / ESC)
- Navegação entre abas (Termômetro / Instagram) no topbar
- Botão "Inscrever-se na newsletter" no canto direito

### Instagram — Melhorias

- 2 cards por linha via `grid-template-columns: 1fr 1fr`
- Nome da empresa em destaque (15px, semibold) com handle abaixo (12px, muted)
- Tier badge removido
- `@@` corrigido: `handle.replace(/^@/, '')` antes de concatenar `@`
- Gráfico duplo (Score Ameaça + Engajamento) via Chart.js

### Newsletter & Briefing — Infraestrutura completa

**Tabelas Supabase criadas:**
```sql
newsletter_subscribers (email, ativo, inscrito_em)
  -- CONSTRAINT: email LIKE '%@fotus.com.br'
  -- RLS: anon pode INSERT, service_role lê/atualiza

comunicados (data_referencia, tipo, html_content, enviado_em, destinatarios_count)
```

**Edge Function `generate-newsletter` deployada:**
- Duas personas: "Cortex Solar" (newsletter, tom de colega) e analista estratégico (briefing, 150-200 palavras)
- Gera HTML completo pronto para envio (600px, inline CSS, Gmail-safe)
- Salva na tabela `comunicados`
- Deploy com `--no-verify-jwt` (autenticação opcional)

**Workflow n8n `Termômetro – Newsletter & Briefing Diário`:**
- Trigger: 07:50 BRT (cron `50 10 * * 1-5`)
- Busca relatório via HTTP GET à API REST do Supabase (não Postgres direto — banco correto)
- IF: relatório existe → dispara Newsletter + Briefing em paralelo; senão → para
- Gera HTML via Edge Function → envia por SMTP
- SMTP: Resend (`smtp.resend.com:465`, user: `resend`) — alternativa enquanto SMTP Fotus não disponível

**Botão de inscrição no dashboard:**
- Validação client-side: apenas `@fotus.com.br`
- Validação server-side: CHECK constraint no banco
- Upsert com `ignoreDuplicates: true` — re-inscrição sem erro

### Correções via API n8n

Usando a API REST do n8n com JWT (`X-N8N-API-KEY`):

- **Termômetro Solar – Análise Diária** (`vEfzR8M4bAGnSh6Q`): Authorization header estava com placeholder `"Bearer SUA_SUPABASE_ANON_KEY"` — corrigido para a anon key real
- **Newsletter & Briefing Diário** (`tOdqyz898qJSATwK`): `Gera HTML Newsletter` e `Gera HTML Briefing` usavam `{{$env.SUPABASE_SERVICE_KEY}}` (recurso pago) — corrigido para anon key hardcoded

**Descoberta importante:** `analyze-market` e `generate-newsletter` foram deployados com `--no-verify-jwt`, então a anon key é suficiente nos headers.

**n8n free plan não suporta Variables** — usar credenciais Header Auth ou hardcode direto no workflow para chaves não-secretas (anon key é publishable por design).

### Diagnóstico ChatGPT integrado

Diagnóstico externo apontou e confirmamos:
1. Erro de sintaxe `const items = .all()` no Prepara Payload (já estava corrigido na versão atual)
2. Missing Authorization na Edge Function — **corrigido**
3. Newsletter sem tratamento para relatório não encontrado — **corrigido com `found: false`**
4. IF node usando `$json.found` com operação `is true` — **correto**

---

## Fase 12 — Diagnóstico e correção do pipeline de email + automação via API n8n (17/05/2026)

### Problema: emails não chegavam mesmo com workflow "succeeded"

O workflow `Termômetro – Newsletter & Briefing Diário` executava com sucesso mas nenhum email chegava na caixa do Resend. Investigação revelou dois problemas em camadas:

**Problema 1 — SMTP silencioso:** os nós "Envia Newsletter" e "Envia Briefing" eram do tipo `n8n-nodes-base.emailSend`, apontando para a credencial "SMTP Fotus" (não configurada). O n8n marcava a execução como "succeeded" mesmo sem ter enviado nada — o nó SMTP engolia o erro silenciosamente.

**Solução:** substituir os nós `emailSend` por `httpRequest` chamando diretamente `POST https://api.resend.com/emails` com o header `Authorization: Bearer re_xxx` armazenado em credencial `httpHeaderAuth` ("Resend API"). Sem dependência de SMTP.

**Problema 2 — Body vazio nos 4 nós HTTP:** após inspecionar o workflow via API (`GET /api/v1/workflows/{id}`), os nós "Gera HTML Newsletter", "Gera HTML Briefing", "Envia Newsletter" e "Envia Briefing Executivo" tinham `bodyParameters: {"parameters": [{}]}` — body completamente vazio. A Edge Function e o Resend receberiam requisições sem payload.

**Causa:** quando o workflow foi criado/editado pelo UI do n8n, o campo de body não foi salvo corretamente. O parâmetro correto é `contentType: "json"` + `body: "={{ JSON.stringify({...}) }}"`, mas o UI salvou como `bodyParameters` vazio.

**Solução:** corrigido via `PUT /api/v1/workflows/{id}` com o payload completo contendo os bodies corretos para todos os 4 nós.

### Automação via API REST do n8n

Todas as correções desta fase foram aplicadas programaticamente via API REST, sem abrir o UI do n8n:

```bash
# Inspecionar workflow
GET /api/v1/workflows/tOdqyz898qJSATwK
# Header: X-N8N-API-KEY: <jwt>

# Atualizar workflow com nós corrigidos
PUT /api/v1/workflows/tOdqyz898qJSATwK
# Body: JSON completo com todos os nós

# Ativar o workflow
POST /api/v1/workflows/tOdqyz898qJSATwK/activate
```

### Resultado final

Email de teste enviado diretamente via `POST https://api.resend.com/emails` e confirmado como recebido em `igor.pirola@fotus.com.br`. Workflow está **ativo** e configurado para disparar toda segunda a sexta às 07:50 BRT.

---

## Estado atual do projeto (17/05/2026 — fim do dia)

| Componente | Status |
|---|---|
| Edge Function `analyze-market` | Deployada, `--no-verify-jwt`, funcionando |
| Edge Function `generate-newsletter` | Deployada, `--no-verify-jwt`, testada via HTTP |
| Edge Function `analyze-instagram` | Deployada e funcionando |
| Workflow diário (06:00 BRT) | Ativo, auth headers corrigidos via API |
| Workflow newsletter/briefing (07:50 BRT) | ✅ Ativo, nós HTTP corrigidos, email testado e confirmado |
| Workflow Instagram | Ativo |
| Supabase `relatorios` | Relatórios diários com schema v3 |
| Supabase `newsletter_subscribers` | Tabela criada com RLS, inscrição funcionando |
| Supabase `comunicados` | Tabela criada |
| Dashboard Vercel | Dark/light mode, 7 bugs UI/UX corrigidos, deploy feito |
| Email | Resend API configurada (`onboarding@resend.dev`), email chegou confirmado |
| SMTP Fotus (corporativo) | Pendente — requer verificação de domínio no Resend ou chamado ao TI |

---

## Próximos passos

### Imediatos
1. **Verificar execução real na segunda-feira** (19/05) às 07:50 BRT — confirmar que o email chega após o workflow diário gerar o relatório
2. **Verificar domínio no Resend** — para poder enviar para outros membros da equipe (Bruna, Breno, José João), verificar `fotus.com.br` no painel do Resend e trocar `from` para `termometro@fotus.com.br`

### Médio prazo
3. **WhatsApp para diretores** — nó Evolution API no workflow de newsletter para enviar briefing por WhatsApp (precisa de URL + instância da Evolution API)
4. **Deletar registro 2099-01-01** no Supabase (requer service role key)
5. **Resolver cobertura de grupos** — entender quais grupos o bot Z-API monitora

### Longo prazo
6. **Histórico em calendário** — visão de 30 dias com indicador de temperatura por dia
7. **Alertas proativos** — delta > 15 pontos dispara notificação WhatsApp
8. **Relatório semanal** gerado automaticamente a partir dos 7 diários

---

---

# Registro de Erros e Aprendizados

*Anteriormente em arquivo separado `ERROS_E_APRENDIZADOS.md` — consolidado aqui em 17/05/2026.*

---

## ERRO 01 — `max_tokens` insuficiente para o JSON completo

**Fase:** 4 | **Data:** 16/05/2026

### O que aconteceu
A Edge Function `analyze-market` retornava resposta truncada — o JSON gerado pelo Claude era cortado no meio, causando falha no parse e relatório vazio no dashboard.

### Causa
O parâmetro `max_tokens: 4000` na chamada à API da Anthropic era insuficiente para comportar o JSON estruturado completo com todos os campos em dias de alto volume de mensagens.

### Solução
Aumentar `max_tokens` de 4000 para **8000** na chamada à Anthropic dentro da Edge Function.

### Aprendizado
Sempre dimensionar `max_tokens` com folga generosa quando o output é JSON estruturado com múltiplos campos aninhados. O custo da diferença entre 4k e 8k é negligenciável; o custo de um relatório vazio é alto.

---

## ERRO 02 — Filtro `group_jid` incompatível com o formato da Z-API

**Fase:** 5 | **Data:** 16/05/2026

### O que aconteceu
O pipeline retornava muito menos mensagens do que o esperado — às vezes 1 mensagem por dia em dias com centenas.

### Causa
O filtro SQL usava `group_jid LIKE '%@g.us'` — formato padrão do WhatsApp nativo. A Z-API salva no formato `numero-timestamp` com hífen, sem o sufixo `@g.us`.

### Solução
Substituir por `group_jid LIKE '%-%'` + filtro de exclusão do grupo interno Fotus.

### Aprendizado
Nunca assumir o formato dos identificadores de uma integração de terceiros sem validar no banco. Sempre fazer `SELECT DISTINCT group_jid LIMIT 20` antes de escrever filtros SQL em produção.

---

## ERRO 03 — Claude classificava produtos Fotus como concorrentes

**Fase:** 8 | **Data:** 16/05/2026

### O que aconteceu
Relatórios indicavam "Fotus ausente do mercado" em dias com alto volume de menções a Deye, Solis e GoodWe — que são marcas do portfólio Fotus.

### Causa
O prompt não deixava explícito quais marcas pertencem ao portfólio Fotus. Sem esse contexto, o modelo classificava as marcas como genéricas ou concorrentes.

### Solução
Reescrita completa do system prompt com mapeamento explícito do portfólio e instrução: *"Marcas Fotus em crise = problema interno, não de concorrente."* Novo schema separando `radar_portfolio` de `lacunas_portfolio` e `concorrentes_distribuidores`.

### Aprendizado
LLMs precisam de contexto de domínio explícito. Quanto mais específico o domínio, mais o prompt precisa de um "manual de contexto" antes da tarefa.

---

## ERRO 04 — n8n não tem recurso de Variáveis (feature paga)

**Fase:** 2 | **Data:** 16/05/2026

### O que aconteceu
O gerenciador de Variáveis não estava disponível no n8n self-hosted — é recurso do plano Enterprise/Cloud.

### Solução
Usar **credenciais do tipo Header Auth** — disponíveis em todas as versões. Chaves ficam criptografadas no banco do n8n.

### Aprendizado
Antes de projetar o fluxo de secrets em ferramentas de automação, verificar o que está disponível na versão instalada. Para o n8n free, a alternativa é Header Auth credentials ou hardcode da anon key (que é publishable por design).

---

## ERRO 05 — `splitInBatches` não executa nós downstream no webhook de produção

**Fase:** 10 | **Data:** 16/05/2026

### O que aconteceu
O workflow de backfill funcionava no teste manual mas completava em ~15ms sem processar nada via webhook de produção.

### Causa
Webhooks de produção têm timeout de resposta imediata. O `splitInBatches` requer contexto de execução síncrona que não existe em webhooks.

### Solução
Criação de **Path B flat** sem loop: `Webhook → Query Postgres → Prepara Payload → Edge Function`.

### Aprendizado
`splitInBatches` é confiável apenas em execuções manuais ou agendadas. Para webhooks, usar flows lineares sem loops internos.

---

## ERRO 06 — Cálculo incorreto de `Engaj. médio` na página Instagram

**Fase:** Auditoria UI/UX | **Data:** 17/05/2026

### O que aconteceu
KPI "Engaj. médio" mostrava 223 quando o correto era 228.

### Causa
Cálculo somava `engajamento_medio_por_post` e dividia pelo número de concorrentes, sem ponderar pelo número de posts.

### Solução
```js
const totalEngaj = rows.reduce((s, r) => {
  return s + (r.payload?.atividade?.engajamento_medio_por_post || 0) * (r.posts_analisados || 0);
}, 0);
const avgEngaj = totalPosts > 0 ? Math.round(totalEngaj / totalPosts) : 0;
```

### Aprendizado
"Média de médias" só é válida com subamostras de mesmo tamanho. Com N diferente, usar média ponderada.

---

## ERRO 07 — KPI "Maior ameaça" com font-size diferente dos demais cards

**Fase:** Auditoria UI/UX | **Data:** 17/05/2026

### O que aconteceu
Card "Maior ameaça" visivelmente mais baixo que os outros três KPI cards.

### Causa
`font-size:22px` inline no `.kpi-val`, enquanto os demais usavam `32px` da classe.

### Solução
Remover o override `font-size:22px` e usar o padrão da classe.

### Aprendizado
Sobrescritas de tipografia inline em componentes repetidos são fontes silenciosas de inconsistência. Usar classes CSS, não style inline.

---

## ERRO 08 — Último card solitário no grid de 2 colunas (Instagram)

**Fase:** Auditoria UI/UX | **Data:** 17/05/2026

### O que aconteceu
Com 5 concorrentes, o 5º card expandia para 100% da largura.

### Solução
```css
.ig-cards-grid > .ig-card:last-child:nth-child(odd) {
  grid-column: 1 / 2;
}
```

### Aprendizado
Grids de N colunas com dados dinâmicos precisam de tratamento para número ímpar de itens.

---

## ERRO 09 — Seções em grid `.g2` e `.g3` com alturas forçadas iguais

**Fase:** Auditoria UI/UX | **Data:** 17/05/2026

### O que aconteceu
Cards com volumes de conteúdo muito diferentes criavam whitespace excessivo pelo `align-items: stretch` padrão.

### Solução
```html
<div class="g2" style="align-items:start">
<div class="g3" style="align-items:start">
```

### Aprendizado
Usar `stretch` para cards estruturalmente idênticos; `start` para seções com conteúdo variável.

---

## ERRO 10 — Empty state "Menções sobre a Fotus" desproporcional

**Fase:** Auditoria UI/UX | **Data:** 17/05/2026

### O que aconteceu
Quando sem menções, exibia texto colado ao topo de uma caixa escura sem altura mínima.

### Solução
```css
.mention-empty { min-height: 80px; display: flex; align-items: center; justify-content: center; }
```

### Aprendizado
Empty states precisam de design intencional. Centralizar sempre, definir `min-height`.

---

## ERRO 11 — Subtitle "5 perfis" ambíguo no KPI "Posts analisados"

**Fase:** Auditoria UI/UX | **Data:** 17/05/2026

### O que aconteceu
Card "Posts analisados" mostrava `5` com subtítulo `5 perfis` — ambíguo (qual dos dois é o dado?).

### Solução
Adicionar preposição: `em ${rows.length} perfis` → "Posts analisados / em 5 perfis".

### Aprendizado
Subtítulos de KPI funcionam como contexto, não como segundo número. Preposições fazem toda a diferença.

---

## ERRO 12 — "Erro ao salvar" na inscrição da newsletter (RLS bloqueando upsert)

**Fase:** 11/12 | **Data:** 17/05/2026

### O que aconteceu
Modal de inscrição exibia "Erro ao salvar. Tente novamente." ao clicar em "Inscrever-se" com um email `@fotus.com.br` válido.

### Causa
O código usava `upsert` com `{ onConflict: 'email', ignoreDuplicates: true }`. O `upsert` no Supabase exige **política RLS de UPDATE** além de INSERT. A tabela `newsletter_subscribers` só tinha política de INSERT para a role `anon` — UPDATE era reservado à `service_role`. Sem a política de UPDATE, o `upsert` falhava com erro 403.

### Solução
Substituir `upsert` por `insert` e tratar o código de erro `23505` (duplicate key = email já inscrito) como sucesso silencioso:

```js
const { error } = await sb.from('newsletter_subscribers').insert({ email, ativo: true });
if (error && error.code !== '23505') {
  errorEl.textContent = 'Erro ao salvar. Tente novamente.';
  return;
}
// error.code '23505' = já inscrito = trata como sucesso
```

### Aprendizado
`upsert` requer tanto INSERT quanto UPDATE no RLS. Se a política de UPDATE for restrita (só service_role), o upsert falhará para roles menos privilegiadas. A alternativa mais segura é `insert` + tratamento do erro `23505` (violação de UNIQUE) como sucesso — sem precisar conceder UPDATE à role anon.

---

## ERRO 13 — n8n "Postgres account" apontando para banco errado

**Fase:** 11 | **Data:** 17/05/2026

### O que aconteceu
Workflow de newsletter não encontrava as colunas `data_referencia` e `payload` na tabela `relatorios`. Erro: `column "data_referencia" does not exist`.

### Causa
A credencial "Postgres account" do n8n estava conectada a um banco diferente (provavelmente banco interno do EasyPanel), não ao Supabase `fotus-fop-tracking`. O banco conectado tinha uma tabela `relatorios` com estrutura completamente diferente (`text`, `date_time`, `concorrente`, etc.).

### Solução
Substituir os nós Postgres por nós HTTP Request que chamam a API REST do Supabase (`/rest/v1/relatorios`). Elimina dependência de credencial de banco e usa o mesmo endpoint que o dashboard já usa com sucesso.

### Aprendizado
Antes de assumir que uma credencial "Postgres" está apontando para o banco correto, validar com uma query de inspeção de schema: `SELECT column_name FROM information_schema.columns WHERE table_name = 'nome_tabela'`. Diferentes bancos podem ter tabelas com o mesmo nome e estruturas completamente diferentes.

---

## ERRO 14 — SMTP Client Host Name inválido causando falha de conexão

**Fase:** 11 | **Data:** 17/05/2026

### O que aconteceu
Credencial SMTP no n8n retornava "Couldn't connect with these settings" mesmo com host, porta e credenciais corretos.

### Causa
Campo "Client Host Name" preenchido com `SMTP Fotus` (com espaço). Este campo espera um hostname válido (ex: `fotus.com.br`) — um nome com espaço não é um hostname válido e causa falha no handshake SMTP (comando EHLO).

### Solução
Limpar o campo "Client Host Name" (deixar vazio). O n8n usa um padrão interno quando o campo está vazio.

### Aprendizado
O campo "Client Host Name" em configurações SMTP é o valor enviado no comando EHLO durante o handshake. Deve ser um domínio válido ou vazio. Nomes descritivos com espaços quebram a negociação TLS.

---

## ERRO 15 — Authorization placeholder `"Bearer SUA_SUPABASE_ANON_KEY"` em produção

**Fase:** 11 | **Data:** 17/05/2026

### O que aconteceu
Workflow "Termômetro Solar – Análise Diária" falhava com "Authorization failed — Invalid JWT" ao chamar a Edge Function `analyze-market`.

### Causa
O nó "Chama Edge Function" tinha o header `Authorization: Bearer SUA_SUPABASE_ANON_KEY` — um placeholder literal que nunca foi substituído pelo valor real.

### Solução
Corrigido via API REST do n8n (`PUT /api/v1/workflows/{id}`) substituindo pelo valor real da anon key.

### Aprendizado
Ao importar ou criar workflows com credenciais placeholder, sempre executar um teste passo a passo (`Execute step`) em cada nó HTTP antes de marcar o workflow como pronto. Placeholders literais passam na validação de schema do n8n mas falham em runtime.

---

## ERRO 16 — `{{$env.SUPABASE_SERVICE_KEY}}` sem suporte no plano free

**Fase:** 11 | **Data:** 17/05/2026

### O que aconteceu
Nós "Gera HTML Newsletter" e "Gera HTML Briefing" passavam literalmente `{{$env.SUPABASE_SERVICE_KEY}}` como header — sem resolver a variável.

### Causa
O plano free do n8n self-hosted não suporta o módulo de Variables. A sintaxe `{{$env.VAR}}` só funciona com o módulo ativo.

### Solução
Hardcode da anon key (publishable, não secreta) diretamente no header. As Edge Functions de newsletter e analyze-market foram deployadas com `--no-verify-jwt`, portanto a anon key é suficiente.

### Aprendizado
Confirmar suporte a Variables antes de projetar qualquer fluxo de secrets no n8n. No plano free: usar Header Auth credentials para chaves secretas, ou hardcode para chaves publishable (anon key é projetada para ser pública). A service key nunca deve ser hardcoded — nesse caso, mudar a Edge Function para `--no-verify-jwt` e usar a anon key.

---

## ERRO 17 — n8n `emailSend` (SMTP) executava com "succeeded" sem enviar nada

**Fase:** 12 | **Data:** 17/05/2026

### O que aconteceu
O workflow `Newsletter & Briefing Diário` marcava execução como sucesso (`"status": "success"`) mas nenhum email chegava. O Resend exibia "No sent emails yet" mesmo após diversas execuções do workflow.

### Causa
Os nós de envio usavam o tipo `n8n-nodes-base.emailSend`, apontando para a credencial "SMTP Fotus" que nunca foi configurada com host/porta/senha reais. O nó SMTP do n8n **engolia o erro silenciosamente** — ao falhar a conexão SMTP, não propagava o erro para o workflow, que concluía com status "succeeded". O painel de execução do n8n mostrava verde, mas o email nunca saiu.

### Solução
Substituir os dois nós `emailSend` por `httpRequest` chamando diretamente a API REST do Resend:

```json
{
  "type": "n8n-nodes-base.httpRequest",
  "parameters": {
    "method": "POST",
    "url": "https://api.resend.com/emails",
    "authentication": "genericCredentialType",
    "genericAuthType": "httpHeaderAuth",
    "body": "={{ JSON.stringify({ from: '...', to: [...], subject: ..., html: ... }) }}"
  },
  "credentials": { "httpHeaderAuth": { "name": "Resend API" } }
}
```

A credencial `httpHeaderAuth` "Resend API" armazena `Authorization: Bearer re_xxx` de forma segura no n8n.

### Aprendizado
Nunca confiar no status "succeeded" do n8n para nós SMTP sem verificar o destino final (caixa de email, painel do provedor). O nó `emailSend` do n8n não lança exceção quando a credencial SMTP está mal configurada — falha silenciosa é o comportamento padrão. Para email transacional confiável, preferir sempre chamada HTTP direta à API REST do provedor (Resend, SendGrid, etc.) — erros HTTP (4xx/5xx) propagam corretamente para o workflow e aparecem como falha real.

---

## ERRO 18 — Body vazio nos nós HTTP do workflow de newsletter

**Fase:** 12 | **Data:** 17/05/2026

### O que aconteceu
Mesmo após substituir os nós SMTP por HTTP Request, a Edge Function `generate-newsletter` e o Resend receberiam requisições sem corpo — a Edge Function não conseguiria gerar o HTML sem o `payload` e o Resend não enviaria o email sem `from`/`to`/`subject`/`html`.

### Causa
Ao inspecionar o workflow via `GET /api/v1/workflows/{id}`, os 4 nós HTTP Request tinham:
```json
"bodyParameters": { "parameters": [{}] }
```
Body completamente vazio. Quando os nós foram criados ou editados pelo UI do n8n, a configuração de body (`contentType: "json"` + expressão `={{ JSON.stringify({...}) }}`) não foi persistida corretamente — o UI salvou `bodyParameters` vazio em vez do `body` como expressão raw.

### Solução
Correção via `PUT /api/v1/workflows/{id}` enviando o JSON completo do workflow com os parâmetros corretos nos 4 nós:

```json
"sendBody": true,
"contentType": "json",
"body": "={{ JSON.stringify({ payload: $json.payload, tipo: $json.tipo }) }}"
```

Verificado após o PUT que os 4 bodies foram salvos corretamente consultando `"contentType":"json"` e `"body":"=..."` na resposta.

### Aprendizado
Após criar ou editar nós HTTP Request no n8n via UI, sempre inspecionar o workflow via API para confirmar que o body foi salvo como esperado. O UI pode parecer correto mas não persistir a expressão. Validar via `GET /api/v1/workflows/{id}` e comparar `contentType` + `body` nos nós relevantes antes de ativar o workflow.

---

## Índice rápido por tipo

| Tipo | Erros |
|------|-------|
| Backend / API | 01 (max_tokens), 04 (n8n variáveis), 05 (splitInBatches webhook), 16 (env vars plano free) |
| Banco de dados / Query | 02 (filtro group_jid), 13 (banco errado no Postgres credential) |
| Prompt / IA | 03 (portfólio vs concorrente) |
| Cálculo / Lógica JS | 06 (média ponderada engajamento) |
| RLS / Permissões | 12 (upsert exige UPDATE policy — RLS bloqueando) |
| Configuração n8n | 14 (Client Host Name inválido), 15 (placeholder em produção), 16 (env vars), 17 (SMTP silencioso), 18 (body vazio nós HTTP) |
| UI/UX — Tipografia | 07 (font-size inconsistente) |
| UI/UX — Layout Grid | 08 (card solitário), 09 (align-items stretch) |
| UI/UX — Empty State | 10 (mention-empty sem min-height) |
| UI/UX — Copy | 11 (subtitle ambíguo) |
