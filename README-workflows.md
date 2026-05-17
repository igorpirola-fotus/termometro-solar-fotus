# Workflows n8n — Termômetro do Mercado Solar

Instância n8n: `https://fotus-n8n-editor.mk863j.easypanel.host`

---

## Workflows Ativos

### 1. `n8n-workflow-diario.json` — Análise Diária
**Trigger:** Todo dia às 06:00 BRT (cron: `0 9 * * *` UTC)  
**Função:** Coleta mensagens WhatsApp do dia anterior e gera relatório de inteligência de mercado.

**Fluxo:**
```
Schedule (06:00 BRT)
  → Postgres (EasyPanel): SELECT mensagens das últimas 24h com filtro group_jid LIKE '%-%'
  → Code: prepara payload JSON
  → HTTP POST: Edge Function analyze-market (Claude Sonnet)
  → Supabase REST: UPSERT em relatorios (data_referencia UNIQUE)
```

**Dependências:**
- Credencial "Postgres account" (banco de mensagens WhatsApp)
- Header Auth "Supabase Anon Key"
- Edge Function `analyze-market` ativa

---

### 2. `n8n-workflow-newsletter.json` — Newsletter + Briefing
**Trigger:** Segunda a sexta às 07:50 BRT (cron: `50 10 * * 1-5` UTC)  
**Função:** Gera e envia email de newsletter (consultores) e briefing (diretoria) com base no relatório do dia.

**Fluxo:**
```
Schedule (07:50 BRT seg–sex)
  → HTTP GET: Supabase REST → busca relatorio de hoje
  → Code: extrai payload
  → HTTP POST: Edge Function generate-newsletter (tipo=newsletter)
  → HTTP POST: Edge Function generate-newsletter (tipo=briefing)
  → HTTP POST: Resend API → envia newsletter
  → HTTP POST: Resend API → envia briefing
```

**Dependências:**
- Header Auth "Supabase Anon Key"
- Header Auth "Resend API Key"
- Edge Functions `generate-newsletter` ativa
- ⏳ PENDÊNCIA TI: domínio `fotus.com.br` verificado no Resend para envio de `termometro@fotus.com.br`

---

### 3. `n8n-workflow-instagram.json` — Análise Instagram
**Trigger:** Diário (08:00 UTC)  
**Função:** Coleta posts e comentários dos concorrentes no Instagram e gera análise competitiva.

**Fluxo:**
```
Schedule (diário)
  → Loop: para cada concorrente (Belenergy, Fortlev, Soollar, Aldo, Sou Energy)
    → HTTP POST: Edge Function analyze-instagram
      → ScrapeCreators API: busca posts + comentários
      → Claude Sonnet: análise competitiva
      → Supabase: UPSERT em ig_relatorios
```

**Dependências:**
- Header Auth "Supabase Anon Key"
- Edge Function `analyze-instagram` ativa
- Credencial ScrapeCreators configurada na Edge Function

---

### 4. `n8n-workflow-backfill.json` — Reprocessamento Histórico
**Trigger:** Manual (execução sob demanda)  
**Função:** Reprocessa dias históricos — útil para recriar relatórios com schema atualizado.

**Como usar:** Ativar manualmente no painel n8n quando necessário.

---

## Workflows Arquivados

Os arquivos abaixo estão na pasta `/archive` e **não devem ser ativados**. São versões anteriores mantidas para referência histórica:

- `n8n-workflow-cortex.json` — versão inicial do pipeline (substituído pelo diário v2)
- `n8n-workflow-cortex-v2.json` — iteração intermediária (substituída pela arquitetura atual com Edge Functions)

---

## Monitoramento

Os workflows não enviam alertas automáticos de falha ainda (ver Fase 4 do roadmap). Para verificar execuções:

1. Acessar o painel n8n
2. Ir em **Executions** → filtrar por workflow
3. Verificar a última execução e status

**Sinais de falha:**
- Newsletter não chegou às 07:50 BRT → checar workflow newsletter
- Dashboard mostra dados de ontem às 10h → checar workflow diário (deve ter rodado às 06h)
- Página Instagram sem atualização → checar workflow instagram

---

*Última atualização: 17/05/2026*
