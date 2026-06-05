# Pendências — Time de TI e Igor

Este documento lista os itens que requerem ação manual (acesso a painéis externos, DNS, servidor).
Código já implementado está em commits — este arquivo rastreia apenas o que falta ativar/configurar.

*Última atualização: 05/06/2026*

---

## 1. Verificação de Domínio no Resend (SMTP Corporativo)

**Status:** ⏳ Aguardando TI
**Impacto:** Hoje os emails saem de `onboarding@resend.dev`. Após setup, sairão de `termometro@fotus.com.br`.

**O que precisa ser feito:**
1. Acessar o painel Resend: [resend.com/domains](https://resend.com/domains)
2. Clicar em **Add Domain** → digitar `fotus.com.br`
3. O Resend vai fornecer 3 registros DNS para adicionar:
   - **SPF:** TXT em `fotus.com.br` → `v=spf1 include:_spf.resend.com ~all` *(combinar com SPF existente se houver)*
   - **DKIM:** CNAME fornecido pelo Resend
   - **DMARC:** TXT em `_dmarc.fotus.com.br` → `v=DMARC1; p=none; rua=mailto:dmarc@fotus.com.br`
4. Adicionar esses registros no gerenciador de DNS da Fotus (Registro.br ou Cloudflare)
5. Aguardar propagação (até 24h) e clicar em **Verify** no painel Resend
6. Após verificação, atualizar o campo `from` nos workflows n8n:
   - `n8n-workflow-newsletter.json` → nó `node-http-send-nl`: trocar `"from": "onboarding@resend.dev"` por `"from": "termometro@fotus.com.br"`
   - `n8n-workflow-newsletter.json` → nó `node-http-send-br`: idem
   - `n8n-workflow-error-handler.json` → nó `Envia Alerta por Email`: já usa `termometro@fotus.com.br` — funcionará após verificação

**Responsável Fotus:** Igor Pirola (coordena) + TI (acesso DNS)

---

## 2. Configurar Resend Webhook (bounce auto-desativação)

**Status:** ⏳ Código deployado — aguarda configuração no painel Resend
**Impacto:** Sem isso, emails que bounçam continuam sendo enviados. Com isso, o sistema desativa automaticamente o assinante.

**O que precisa ser feito:**
1. Fazer deploy da Edge Function: `supabase functions deploy resend-webhook --no-verify-jwt`
2. Acessar [resend.com/webhooks](https://resend.com/webhooks) → **Add Webhook**
3. URL: `https://<seu-projeto-ref>.supabase.co/functions/v1/resend-webhook`
   *(encontrar o `project-ref` em: Supabase Dashboard → Settings → General)*
4. Selecionar eventos:
   - ✅ `email.bounced`
   - ✅ `email.complained`
   - ✅ `email.delivered`
5. Copiar o **Signing Secret** gerado pelo Resend (começa com `whsec_...`)
6. Salvar como secret no Supabase:
   ```bash
   supabase secrets set RESEND_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxx
   ```
7. Fazer redeploy da função para ela carregar o novo secret:
   ```bash
   supabase functions deploy resend-webhook --no-verify-jwt
   ```

**Responsável Fotus:** Igor Pirola

---

## 3. Executar Migration SQL (GIN Index + Delete Fantasma)

**Status:** ⏳ Arquivo criado — aguarda execução no Supabase
**Arquivo:** `supabase/migrations/20260605_gin_index_and_cleanup.sql`

**O que precisa ser feito:**
1. Acessar: [Supabase Dashboard](https://supabase.com/dashboard) → Projeto `fotus-fop-tracking`
2. Ir em **SQL Editor**
3. Abrir o arquivo `supabase/migrations/20260605_gin_index_and_cleanup.sql` e colar o conteúdo
4. Executar e verificar:
   - GIN index criado: `SELECT indexname FROM pg_indexes WHERE tablename = 'relatorios';`
   - Registro fantasma removido (0 linhas): `SELECT * FROM relatorios WHERE data_referencia = '2099-01-01';`

**Responsável:** Igor Pirola (tem acesso ao Supabase)

---

## 4. Variável `INTERNAL_API_TOKEN` no Vercel

**Status:** ⏳ A configurar
**Impacto:** O endpoint `/api/analyze-pdf` retorna 500 sem esta variável.

**O que precisa ser feito:**
1. Gerar um token seguro (PowerShell):
   ```powershell
   -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 40 | ForEach-Object {[char]$_})
   ```
2. No painel Vercel → Project `termometro-solar-fotus` → Settings → Environment Variables
3. Adicionar: `INTERNAL_API_TOKEN` = `<token gerado>` (escopo: Production)
4. Fazer redeploy (ou aguardar próximo push)

**Responsável:** Igor Pirola

---

## 5. Configurar N8N Error Handler nos Workflows Críticos

**Status:** ⏳ Workflow criado — aguarda importação e vinculação
**Arquivo:** `n8n-workflow-error-handler.json`
**Impacto:** Sem isso, falhas nos workflows críticos são silenciosas (só visíveis no painel N8N).

**O que precisa ser feito:**
1. Acessar N8N → menu superior → **Import from File**
2. Selecionar `n8n-workflow-error-handler.json`
3. No workflow importado, verificar que a credencial **Resend API** está selecionada no nó "Envia Alerta por Email"
4. **Ativar** o workflow (toggle no canto superior direito)
5. Para cada workflow crítico, abrir → **Settings** (engrenagem) → **Error Workflow** → selecionar "🚨 Termômetro — Error Handler Global":
   - ✅ Termômetro Solar – Análise Diária
   - ✅ Termômetro – Newsletter & Briefing Diário
   - ✅ Termômetro – Instagram (se ativo)

> ⚠️ O email do remetente está configurado como `termometro@fotus.com.br`. O alerta só chegará após verificação do domínio no Resend (item 1). Antes disso, trocar temporariamente para `onboarding@resend.dev`.

**Responsável:** Igor Pirola

---

## 6. N8N — Fixar Versão no Docker Compose

**Status:** ⏳ Aguarda acesso ao servidor EasyPanel
**Impacto:** Usar `:latest` em produção pode causar quebra silenciosa em atualizações automáticas.

**O que precisa ser feito:**
1. Acessar o servidor EasyPanel → serviço N8N → editar docker-compose.yml
2. Trocar:
   ```yaml
   image: n8nio/n8n:latest
   ```
   por:
   ```yaml
   image: n8nio/n8n:2.23.4  # versão estável atual — verificar https://github.com/n8n-io/n8n/releases
   ```
3. Adicionar variáveis de ambiente recomendadas (se ainda não existirem):
   ```yaml
   environment:
     - GENERIC_TIMEZONE=America/Sao_Paulo
     - TZ=America/Sao_Paulo
     - N8N_BLOCK_ENV_ACCESS_IN_NODE=true
   ```
4. Fazer redeploy (o N8N reinicia — aguardar ~1 minuto)

**Responsável:** Igor Pirola (acesso EasyPanel)

---

## Itens Concluídos ✅

| Item | Concluído em | O que foi feito |
|---|---|---|
| CORS do `/api/analyze-pdf` | 05/06/2026 | Substituído `*` por allowlist explícita (Vercel + domínio Fotus) |
| Prompt Caching TTL 1h | 05/06/2026 | Atualizado nas Edge Functions `analyze-market` e `generate-newsletter` |
| Monitoramento stop_reason | 05/06/2026 | Detecta JSON truncado em `analyze-market`, loga alerta crítico e marca `meta.truncado` |
| Edge Function resend-webhook | 05/06/2026 | Criada — desativa assinante automaticamente em bounce/spam |
| N8N Error Handler workflow | 05/06/2026 | Workflow JSON criado — aguarda importação manual |
| Migration SQL GIN index | 05/06/2026 | Arquivo criado — aguarda execução manual no Supabase |
