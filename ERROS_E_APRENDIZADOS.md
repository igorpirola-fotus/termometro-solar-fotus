# Erros, Soluções e Aprendizados — Termômetro do Mercado Solar

Registro cronológico de todos os erros encontrados durante o desenvolvimento do projeto, como foram diagnosticados, como foram resolvidos e o que cada um ensinou.

---

## ERRO 01 — `max_tokens` insuficiente para o JSON completo

**Fase:** Deploy e validação (Fase 4)
**Data:** 16/05/2026

### O que aconteceu
A Edge Function `analyze-market` retornava resposta truncada — o JSON gerado pelo Claude era cortado no meio, causando falha no parse e relatório vazio no dashboard.

### Causa
O parâmetro `max_tokens: 4000` na chamada à API da Anthropic era insuficiente para comportar o JSON estruturado completo com todos os campos (`briefing_executivo`, `radar_portfolio`, `lacunas_portfolio`, `concorrentes_distribuidores`, etc.) em dias de alto volume de mensagens.

### Solução
Aumentar `max_tokens` de 4000 para **8000** na chamada à Anthropic dentro da Edge Function.

### Aprendizado
Sempre dimensionar `max_tokens` com folga generosa quando o output é JSON estruturado com múltiplos campos aninhados. Cálculo seguro: estimar o pior caso de output (dia com muitas mensagens, muitos concorrentes, briefing longo) e multiplicar por 1.5. O custo da diferença entre 4k e 8k é negligenciável; o custo de um relatório vazio é alto.

---

## ERRO 02 — Filtro `group_jid` incompatível com o formato da Z-API

**Fase:** Descoberta sobre os grupos (Fase 5)
**Data:** 16/05/2026

### O que aconteceu
O pipeline estava retornando muito menos mensagens do que o esperado. Em dias com centenas de mensagens nos grupos, o sistema processava apenas uma fração (às vezes 1 mensagem por dia).

### Causa
O filtro SQL usava `group_jid LIKE '%@g.us'` — formato padrão do WhatsApp nativo para identificar grupos. A integração Z-API, porém, salva o `group_jid` no formato `numero-timestamp` com hífen, sem o sufixo `@g.us`. O filtro excluía praticamente todas as mensagens válidas.

### Solução
Substituir o filtro por `group_jid LIKE '%-%'` — padrão compatível com o formato da Z-API.

Além disso, foi adicionado um filtro de exclusão para o grupo interno `[PCMK] IAMKT - FOTUS DISTRIBUIDORA SOLAR`, que gerava ruído na análise.

### Aprendizado
Nunca assumir o formato dos identificadores de uma integração de terceiros sem validar diretamente no banco. Antes de escrever qualquer filtro SQL em produção, fazer um `SELECT DISTINCT group_jid LIMIT 20` para inspecionar os valores reais. O padrão documentado nem sempre é o que chega no banco.

---

## ERRO 03 — Claude classificava produtos Fotus como concorrentes

**Fase:** Reformulação do prompt (Fase 8)
**Data:** 16/05/2026

### O que aconteceu
Os relatórios de análise indicavam que "a Fotus estava ausente do mercado" em dias com alto volume de menções a Deye, Solis e GoodWe — marcas que **são** do portfólio Fotus. O score de aquecimento ficava artificialmente baixo e os insights sugeriam ações para marcas que a Fotus já vendia.

### Causa
O prompt enviado ao Claude não deixava explícito quais marcas pertencem ao portfólio Fotus. Sem esse contexto, o modelo classificava Deye, Solis e GoodWe como marcas de mercado genéricas ou concorrentes — especialmente porque essas marcas são amplamente distribuídas por outras distribuidoras também.

### Solução
Reescrita completa do system prompt com o mapeamento explícito do portfólio:

- Inversores string próprios: GoodWe, Solplanet, Solis, AUXSOL (exclusivo), Deye
- Marcas exclusivas Fotus: AUXSOL, Pulling (módulos), Deye Micro, Deye Battery
- Marcas fora do portfólio (sinais de lacuna): Growatt, Sungrow, Fronius, Huawei, SAJ, Hoymiles, etc.

Adicionada instrução explícita: *"Marcas Fotus em crise = problema interno da Fotus, não de concorrente."*

Novo schema JSON separando `radar_portfolio` (marcas Fotus) de `lacunas_portfolio` (marcas fora do portfólio com demanda) e `concorrentes_distribuidores` (distribuidoras concorrentes, não marcas de produto).

### Aprendizado
LLMs precisam de contexto de domínio explícito. O modelo não sabe quem é a Fotus, quais marcas ela distribui e qual é a diferença entre "marca concorrente" e "marca do portfólio". Quanto mais específico o domínio, mais o prompt precisa de um "manual de contexto" antes da tarefa. Separar no schema os diferentes tipos de entidade (produto próprio × produto concorrente × distribuidora concorrente) força o modelo a pensar em categorias corretas.

---

## ERRO 04 — n8n não tem recurso de Variáveis (feature paga)

**Fase:** Primeiro pipeline (Fase 2)
**Data:** 16/05/2026

### O que aconteceu
Ao tentar armazenar a chave da API da Anthropic como variável de ambiente no n8n self-hosted, o recurso não estava disponível na interface — aparecia como feature do plano pago.

### Causa
O n8n self-hosted na versão instalada no EasyPanel não inclui o gerenciador de Variáveis por padrão — é um recurso do plano Enterprise/Cloud.

### Solução
Substituir o uso de variáveis por **credenciais do tipo Header Auth** no n8n — recurso disponível em todas as versões. A chave da Anthropic foi armazenada como uma credencial Header Auth e referenciada nos nós HTTP.

### Aprendizado
Antes de projetar o fluxo de secrets em uma ferramenta de automação, verificar o que está disponível na versão instalada. Header Auth credentials são uma alternativa robusta e universal para armazenar chaves de API no n8n — e têm a vantagem adicional de aparecer criptografadas no banco do n8n.

---

## ERRO 05 — `splitInBatches` (loop n8n) não executa nós downstream no webhook de produção

**Fase:** Reprocessamento com schema v3 (Fase 10)
**Data:** 16/05/2026

### O que aconteceu
O workflow de backfill funcionava perfeitamente no modo de teste do n8n (execução manual), mas ao ser acionado via webhook de produção, completava em ~15ms sem processar nenhuma mensagem — o loop `splitInBatches` simplesmente não executava os nós filhos.

### Causa
Comportamento documentado mas pouco conhecido do n8n: webhooks de produção têm timeout de resposta imediata. O nó `splitInBatches` requer contexto de execução síncrona para propagar dados entre as iterações — em webhooks de produção, o fluxo de execução é diferente e o loop não propaga corretamente para nós downstream.

### Solução
Criação de um **Path B flat** no workflow de backfill: `Webhook → Query Postgres (ontem) → Prepara Payload → Edge Function`, sem nenhum loop ou `splitInBatches`. Simples, sem estado, sem dependência de contexto de execução.

O Path A (loop completo de datas) foi mantido para uso via trigger manual.

### Aprendizado
`splitInBatches` no n8n é confiável apenas em execuções manuais ou agendadas. Para webhooks de produção, preferir flows lineares sem loops internos. Quando precisar iterar sobre múltiplos itens via webhook, usar um flow que processa um item por chamada e chamar o webhook N vezes externamente.

---

## ERRO 06 — Cálculo incorreto de `Engaj. médio` na página Instagram

**Fase:** Auditoria UI/UX (17/05/2026)
**Data:** 17/05/2026
**Arquivo:** `public/index.html` — função `buildIgPageHTML`

### O que aconteceu
O KPI "Engaj. médio" da página Instagram · Concorrentes mostrava **223** quando o valor correto era **228**.

### Causa
O cálculo somava o `engajamento_medio_por_post` de cada concorrente e dividia pelo número de concorrentes (`rows.length`), sem ponderar pelo número de posts de cada um.

```js
// ERRADO
const totalEngaj = rows.reduce((s,r) => s + (r.payload?.atividade?.engajamento_medio_por_post || 0), 0);
const avgEngaj = rows.length ? Math.round(totalEngaj / rows.length) : 0;
```

Soollar tinha 2 posts com média de 24 eng/post (= 48 total), mas o código contabilizava apenas 24 — tratando Soollar igual a concorrentes com 1 post. Além disso, Belenergy (0 posts) entrava no denominador, diluindo a média sem contribuir com nada.

Cálculo real com os dados do dia:
- Fortlev: 1044 × 1 = 1044
- Soollar: 24 × **2** = **48** (código usava 24)
- Belenergy: 0 × 0 = 0
- Sol Fácil: 12 × 1 = 12
- Sou Energy: 35 × 1 = 35
- **Total correto: 1139 / 5 posts = 228**

### Solução
```js
// CORRETO — ponderado por posts
const totalEngaj = rows.reduce((s, r) => {
  const engaj = r.payload?.atividade?.engajamento_medio_por_post || 0;
  const posts = r.posts_analisados || 0;
  return s + (engaj * posts);
}, 0);
const avgEngaj = totalPosts > 0 ? Math.round(totalEngaj / totalPosts) : 0;
```

### Aprendizado
Ao calcular uma média de médias, sempre verificar se as subamostras têm o mesmo peso. "Média de médias" só é válida quando todos os grupos têm o mesmo N. Quando os grupos têm tamanhos diferentes (1 post vs 2 posts), é obrigatório calcular a média ponderada multiplicando cada média pelo seu N antes de somar.

---

## ERRO 07 — KPI "Maior ameaça" com font-size diferente dos demais cards

**Fase:** Auditoria UI/UX (17/05/2026)
**Data:** 17/05/2026
**Arquivo:** `public/index.html` — linha ~1459

### O que aconteceu
Na linha de 4 KPI cards da página Instagram, o card "Maior ameaça" era visivelmente mais baixo que os outros três, criando uma linha de cards com alturas inconsistentes.

### Causa
O card "Maior ameaça" tinha um `font-size:22px` inline aplicado ao `.kpi-val`, enquanto os outros 3 cards usavam o padrão da classe `.kpi-val` que é `32px`. Diferença de 10px no tamanho do número principal causava diferença de ~15-20px na altura do card.

```html
<!-- ERRADO -->
<div class="kpi-val" style="color:var(--red);font-size:22px">${maxScore}</div>
```

### Solução
Remover o override `font-size:22px` e deixar o padrão `32px` da classe. O handle (`@fortlevsolar`) no subtítulo de 11px cabe perfeitamente abaixo do número grande.

```html
<!-- CORRETO -->
<div class="kpi-val" style="color:var(--red)">${maxScore}</div>
```

### Aprendizado
Sobrescritas de tipografia inline em componentes repetidos (cards em grid) são fontes silenciosas de inconsistência visual. Quando um componente é usado múltiplas vezes no mesmo layout, todos os seus elementos equivalentes devem usar exatamente as mesmas classes sem overrides. Se um caso específico precisar de tamanho diferente, criar uma variante via classe CSS, não via style inline.

---

## ERRO 08 — Último card solitário no grid de 2 colunas (Instagram)

**Fase:** Auditoria UI/UX (17/05/2026)
**Data:** 17/05/2026
**Arquivo:** `public/index.html` — CSS `.ig-cards-grid`

### O que aconteceu
Com 5 concorrentes no grid de 2 colunas, o 5º card (Sou Energy) ficava sozinho na última linha e se expandia para 100% da largura do grid — criando uma assimetria visual grave em relação aos demais cards que ocupavam 50%.

### Causa
O CSS do grid não tinha nenhuma regra para tratar o caso de número ímpar de itens. O comportamento padrão do CSS Grid é expandir o último item para ocupar a(s) coluna(s) disponível(eis) restante(s).

### Solução
Adicionar regra CSS específica para o último card quando estiver em posição ímpar (ou seja, quando estiver sozinho na linha):

```css
.ig-cards-grid > .ig-card:last-child:nth-child(odd) {
  grid-column: 1 / 2;
}
```

Isso força o card a ocupar apenas a primeira coluna, mantendo a consistência visual com os demais.

### Aprendizado
Grids de N colunas com dados dinâmicos precisam de tratamento explícito para número ímpar de itens. O seletor `:last-child:nth-child(odd)` é a solução CSS pura mais elegante — detecta quando o último filho está numa posição ímpar (indicando que está sozinho na linha) e corrige sua largura sem nenhuma mudança no HTML ou no JavaScript.

---

## ERRO 09 — Seções em grid `.g2` e `.g3` com alturas forçadas iguais

**Fase:** Auditoria UI/UX (17/05/2026)
**Data:** 17/05/2026
**Arquivo:** `public/index.html` — seções ANÁLISE e PORTFÓLIO & MERCADO

### O que aconteceu
Duas seções com layout em grid apresentavam espaços em branco excessivos:

1. **Seção ANÁLISE:** o gráfico "Marcas mencionadas" tem max-height de 220px e o de "Objeções e dores" tem max-height de 180px. Como o grid `.g2` usa `align-items: stretch` por padrão, o card menor se esticava para igualar o maior — criando whitespace vazio dentro do card.

2. **Seção PORTFÓLIO & MERCADO:** com apenas 1 marca no Radar do Portfólio, o card ficava muito esparso ao lado de colunas com mais conteúdo, pois o grid `.g3` igualava a altura de todos.

### Causa
O comportamento padrão de `align-items` em CSS Grid é `stretch` — todos os itens da mesma linha se esticam para igualar a altura do maior. Quando os cards têm volumes de conteúdo muito diferentes, isso cria áreas de fundo vazias que parecem bugs.

### Solução
Adicionar `align-items:start` inline nos dois grids problemáticos:

```html
<div class="g2" style="margin-bottom:12px;align-items:start">
<div class="g3" style="align-items:start">
```

Com `align-items:start`, cada card cresce apenas o suficiente para o seu conteúdo, eliminando o whitespace artificial.

### Aprendizado
`align-items: stretch` é a escolha certa quando os cards têm conteúdo similar (ex: lista de KPIs). Mas quando o conteúdo é heterogêneo em volume (1 marca vs 4 marcas, chart de 180px vs 220px), `align-items: start` sempre produz resultado visual mais limpo. A regra prática: use `stretch` para dashboards com cards estruturalmente idênticos, use `start` para seções editoriais com conteúdo variável.

---

## ERRO 10 — Empty state "Menções sobre a Fotus" desproporcional

**Fase:** Auditoria UI/UX (17/05/2026)
**Data:** 17/05/2026
**Arquivo:** `public/index.html` — CSS `.mention-empty`

### O que aconteceu
Quando não havia menções à Fotus detectadas no dia, a seção exibia apenas uma linha de texto ("Nenhuma menção à Fotus detectada hoje.") dentro do painel com gradiente azul escuro. O resultado era uma caixa escura pequena e visualmente inacabada — sem presença nem hierarquia.

### Causa
A classe `.mention-empty` tinha apenas `padding: 14px` sem nenhum `min-height` ou centralização vertical. O texto ficava colado ao topo do elemento, que por sua vez não tinha altura mínima definida.

### Solução
```css
.mention-empty {
  /* propriedades existentes... */
  min-height: 80px;
  display: flex;
  align-items: center;
  justify-content: center;
}
```

### Aprendizado
Empty states precisam de design intencional tanto quanto estados com conteúdo. Uma mensagem de "sem dados" colada ao topo de um painel escuro parece um bug, não uma informação. O mínimo é garantir `min-height` suficiente para a caixa ter presença visual e centralizar o texto vertical e horizontalmente — comunica ao usuário que o estado é esperado, não um erro.

---

## ERRO 11 — Subtitle "5 perfis" ambíguo no KPI "Posts analisados"

**Fase:** Auditoria UI/UX (17/05/2026)
**Data:** 17/05/2026
**Arquivo:** `public/index.html` — linha ~1461

### O que aconteceu
O card KPI intitulado "Posts analisados" exibia o valor `5` com o subtítulo `5 perfis`. O subtítulo criava ambiguidade: o usuário não sabia se o `5` representava 5 posts ou 5 perfis — já que ambos os números eram iguais.

### Causa
O subtítulo foi escrito como `${rows.length} perfis` — que exibe a contagem de concorrentes (perfis), não de posts. A escolha foi feita para dar contexto ao número, mas sem preposição ficou semanticamente ambíguo.

### Solução
Adicionar a preposição `em` antes do número:

```html
<!-- ANTES -->
<div class="kpi-sub">${rows.length} perfis</div>

<!-- DEPOIS -->
<div class="kpi-sub">em ${rows.length} perfis</div>
```

"Posts analisados / **em 5 perfis**" lê claramente como "5 posts foram analisados, distribuídos em 5 perfis".

### Aprendizado
Subtítulos de KPI funcionam como unidade de contexto, não como segundo número. Quando o subtítulo é um número diferente do KPI principal, preposições e artigos fazem toda a diferença na leitura. "5 perfis" parece ser o dado principal; "em 5 perfis" deixa claro que é o contexto do dado principal.

---

## Índice rápido por tipo

| Tipo | Erros |
|------|-------|
| Backend / API | 01 (max_tokens), 04 (n8n variáveis), 05 (splitInBatches webhook) |
| Banco de dados / Query | 02 (filtro group_jid) |
| Prompt / IA | 03 (portfólio vs concorrente) |
| Cálculo / Lógica JS | 06 (média ponderada engajamento) |
| UI/UX — Tipografia | 07 (font-size inconsistente) |
| UI/UX — Layout Grid | 08 (card solitário), 09 (align-items stretch) |
| UI/UX — Empty State | 10 (mention-empty sem min-height) |
| UI/UX — Copy | 11 (subtitle ambíguo) |
