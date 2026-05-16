# Diário de Desenvolvimento — Termômetro do Mercado Solar
### Termômetro de Mercado Solar · 16/05/2026

---

## O que foi construído

**Ponto de partida:** Um dashboard que exigia upload manual de PDF gerado por uma agência terceira. Dependência total de um processo externo, sem autonomia, sem histórico, sem automação.

---

### Fase 1 — Entendimento da infraestrutura existente

Mapeamos tudo que já existia: n8n self-hosted no EasyPanel, uma instância Z-API capturando mensagens de grupos de WhatsApp e salvando em um banco Postgres interno (`fotus_postgres`, database `fotus`, tabela `public.messages`), e um projeto no Supabase (`fotus-fop-tracking`) com o frontend já deployado no Vercel.

---

### Fase 2 — Primeiro pipeline (semanal)

Criamos um workflow n8n de 6 nós que lia mensagens do Postgres, chamava o Claude Sonnet diretamente pela API da Anthropic e salvava o resultado no Supabase. Descobrimos que o n8n na versão atual não tem o recurso de Variáveis (é pago), então substituímos por credenciais do tipo Header Auth para guardar a chave da API da Anthropic.

---

### Fase 3 — Migração para arquitetura moderna

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

### Fase 4 — Deploy e validação

- Edge Function `analyze-market` deployada via Supabase CLI
- Chave da Anthropic configurada como secret no Supabase (`supabase secrets set`)
- Primeiro erro: `max_tokens: 4000` insuficiente para o JSON completo — aumentado para 8000
- **Primeiro teste bem-sucedido:** 499 mensagens processadas, relatório salvo, dashboard carregando dados reais do Supabase
- Frontend atualizado para usar o Supabase JS client (compatível com a nova chave publishable)
- Deploy no Vercel via git push

---

### Fase 5 — Descoberta sobre os grupos

Ao analisar os dados, identificamos que o filtro `group_jid LIKE '%@g.us'` (padrão WhatsApp nativo) estava errado para a integração Z-API, que usa o formato `numero-timestamp` com hífen. Corrigido para `group_jid LIKE '%-%'`. Também excluímos o grupo interno `[PCMK] IAMKT - FOTUS DISTRIBUIDORA SOLAR` da análise.

---

### Fase 6 — Migração para análise diária com delta de inteligência

Decisão estratégica: em vez de uma análise semanal estática, construir uma **inteligência diária com memória**. Cada dia é analisado separadamente e comparado com o dia anterior.

O que foi implementado:

- **Edge Function atualizada** com prompt novo focado em análise diária + campo `delta` (variação de score, novos alertas, temas encerrados, tendência de mercado)
- Coluna `data_referencia DATE` adicionada à tabela `relatorios` com índice único (sem duplicatas por dia)
- **Workflow diário** (`n8n-workflow-diario.json`): roda todo dia às 06:00 BRT, busca mensagens de ontem
- **Workflow de backfill** (`n8n-workflow-backfill.json`): processa cada dia de 01/05 até ontem em loop, com lógica para pular dias sem mensagens
- Backfill executado: 2 dias processados (os únicos com dados disponíveis)

---

## Estado atual

| Componente | Status |
|---|---|
| Edge Function `analyze-market` | Deployada e funcionando |
| n8n workflow diário | Criado, aguardando Publish |
| n8n workflow backfill | Executado com sucesso |
| Supabase `relatorios` | 2 registros, estrutura correta |
| Frontend Vercel | Carregando o relatório mais recente automaticamente |
| Análise diária com delta | Implementada na Edge Function |

---

---

### Fase 7 — Navegação por data e card de delta (16/05/2026)

Implementados os itens 2 e 3 da lista de próximos passos:

- **Navegação por data no topbar**: setas `←` / `→` para navegar entre os dias disponíveis, com label de data em DD/MM/AAAA e sublabel relativo (hoje/ontem/anteontem/N dias atrás). Setas desabilitadas nos extremos.
- **Card de delta "O que mudou hoje"**: aparece entre os KPIs e a tese executiva. Mostra variação de score (número colorido com ícone de seta, verde/vermelho), badge de tendência (Acelerando/Estável/Arrefecendo), resumo textual do Claude e listas de novos alertas/temas encerrados (quando presentes).
- **Carregamento por data**: `loadLatestReport` agora busca todas as datas disponíveis (`data_referencia`) e carrega por data específica — não mais pelo `created_at`. Navegação entre dias não recarrega a página.
- **Realtime atualizado**: quando um novo relatório chega, atualiza a lista de datas e vai direto para o mais recente.

Deploy: `git push origin main` → Vercel auto-deploy ativo.

---

## Próximos passos

---

### Fase 8 — Premissas de análise e reformulação do prompt (16/05/2026)

Sessão estratégica completa antes de redesenhar o front-end. Definido e documentado:

**Portfólio Fotus mapeado:**
- Inversores string: GoodWe, Solplanet, Solis, AUXSOL (exclusivo), Deye
- Inversores híbridos: GoodWe Hybrid, Solis Hybrid (lançamento), Solplanet Hybrid, Deye Hybrid
- Microinversores: TSUNESS, Deye Micro (exclusivo)
- Módulos: LONGi, Astronergy, Sunova, Pulling (exclusivo), Jinko Solar
- Baterias: Deye Battery (ecossistema fechado Deye), UCB Power (aberto)

**Marcas fora do portfólio (sinais de lacuna):** Growatt, Sungrow, Fronius, Huawei, SAJ, Chint, Hoymiles, APsystems, Enphase, JA Solar, Canadian Solar, Trina Solar, Risen, BYD, Pylontech

**Mapa competitivo (Greener 2026):**
- Tier 1: Belenergy (#1, domina SP, ganhou Greener 2 anos) + Fortlev Solar (nacional + local ES)
- Tier 2: Soollar (#2), Aldo Solar (#4), Sou Energy (#5)
- Praças estratégicas: SP (Belenergy) e ES (Fortlev + sede Fotus)

**Regras de análise estabelecidas:**
- Nunca citar nomes de pessoas da equipe Fotus na análise — sempre institucional
- Marcas Fotus em crise = problema interno, não de concorrente
- Score ponderado por relevância de portfólio, não só volume
- Cinco linhas de análise: temperatura, radar de portfólio, inteligência competitiva, sinais de demanda, percepção da Fotus

**Problema crítico identificado na análise anterior:** o Claude classificava Deye e Solis como "Concorr." quando são produtos Fotus. A análise concluía que a "Fotus estava ausente" quando na verdade estava presente como produto mas invisível como marca. Corrigido no novo prompt.

**Novo schema JSON da Edge Function:** adicionados `briefing_executivo` (3 insights acionáveis), `radar_portfolio` (marcas Fotus monitoradas), `lacunas_portfolio` (marcas demandadas fora do portfólio), `concorrentes_distribuidores` (distribuidoras separado de marcas de produto). Deploy realizado.

---

## Próximos passos

### Imediatos

1. **Publicar o workflow diário no n8n** — clicar em "Publish" no "Termômetro – Análise Diária" para ativar o agendamento automático das 06:00

### Médio prazo

4. **Resolver a cobertura de grupos** — entender por que só 12 grupos aparecem quando o contato participa de mais. Provavelmente uma configuração da instância Z-API (quais grupos o bot monitora)
5. **Histórico em calendário** — visão de 30 dias com indicador de temperatura por dia (azul/amarelo/vermelho conforme score)
6. **Alertas proativos** — quando o delta detectar mudança brusca (>15 pontos de score), enviar notificação via WhatsApp ou email

### Longo prazo

7. **Inteligência acumulada** — relatório semanal gerado automaticamente a partir dos 7 relatórios diários, com tendências da semana
8. **Rastreamento de concorrentes** — histórico de menções por concorrente ao longo do tempo
9. **Segmentação por região** — filtros por DDD/estado no dashboard
