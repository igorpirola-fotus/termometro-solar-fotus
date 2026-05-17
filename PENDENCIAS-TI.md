# Pendências — Time de TI

Este documento lista os itens que requerem ação do time de TI da Fotus para completar a infraestrutura do Termômetro do Mercado Solar.

---

## 1. Verificação de Domínio no Resend (SMTP Corporativo)

**Status:** ⏳ Aguardando TI  
**Impacto:** Hoje os emails saem de `onboarding@resend.dev`. Após setup, sairão de `termometro@fotus.com.br`.

**O que precisa ser feito:**
1. Acessar o painel Resend: [resend.com/domains](https://resend.com/domains)
2. Clicar em **Add Domain** → digitar `fotus.com.br`
3. O Resend vai fornecer 3 registros DNS para adicionar:
   - **SPF:** registro TXT em `fotus.com.br`
   - **DKIM:** registro TXT em `resend._domainkey.fotus.com.br`
   - **DMARC:** registro TXT em `_dmarc.fotus.com.br`
4. Adicionar esses registros no gerenciador de DNS da Fotus (provavelmente Registro.br ou Cloudflare)
5. Aguardar propagação (até 24h) e clicar em **Verify** no painel Resend
6. Após verificação, atualizar o campo `from` nos workflows n8n:
   - `n8n-workflow-newsletter.json` → nó `node-http-send-nl`: trocar `"from": "onboarding@resend.dev"` por `"from": "termometro@fotus.com.br"`
   - `n8n-workflow-newsletter.json` → nó `node-http-send-br`: idem

**Responsável Fotus:** Igor Pirola (coordena) + TI (acesso DNS)

---

## 2. Restrição de CORS no Endpoint `/api/analyze-pdf`

**Status:** ⏳ Aguardando definição de domínio final  
**Impacto:** Hoje o endpoint aceita requisições de qualquer origem (`*`). Após setup de domínio, restringir para domínios Fotus.

**O que precisa ser feito:**
1. Definir o domínio final do dashboard (ex: `termometro.fotus.com.br` ou manter em `termometro-solar-fotus.vercel.app`)
2. Em `api/analyze-pdf.js`, substituir a linha:
   ```js
   res.setHeader('Access-Control-Allow-Origin', '*');
   ```
   por:
   ```js
   res.setHeader('Access-Control-Allow-Origin', 'https://termometro.fotus.com.br');
   ```
3. Se necessário múltiplos domínios, usar validação de origem:
   ```js
   const allowed = ['https://termometro.fotus.com.br', 'https://termometro-solar-fotus.vercel.app'];
   const origin = req.headers.origin;
   if (allowed.includes(origin)) res.setHeader('Access-Control-Allow-Origin', origin);
   ```

**Responsável Fotus:** Igor Pirola (código) + TI (DNS / domínio)

---

## 3. Variável `INTERNAL_API_TOKEN` no Vercel

**Status:** ⏳ A configurar  
**Impacto:** O endpoint `/api/analyze-pdf` agora exige autenticação por token. Sem esta variável, o endpoint retorna 500.

**O que precisa ser feito:**
1. Gerar um token seguro:
   ```bash
   openssl rand -hex 32
   ```
2. No painel Vercel → Project `termometro-solar-fotus` → Settings → Environment Variables
3. Adicionar: `INTERNAL_API_TOKEN` = `<token gerado>`
4. Fazer redeploy (ou aguardar próximo push)
5. Comunicar o token ao time que usa `/api/analyze-pdf` (se houver)

**Responsável:** Igor Pirola

---

## 4. Registro Fantasma `2099-01-01` no Supabase

**Status:** ⏳ A deletar manualmente  
**Impacto:** Aparece como primeira data na navegação do dashboard.

**O que precisa ser feito:**
1. Acessar: [Supabase Dashboard](https://supabase.com/dashboard) → Projeto `fotus-fop-tracking`
2. Ir em **SQL Editor**
3. Executar:
   ```sql
   DELETE FROM relatorios WHERE data_referencia = '2099-01-01';
   ```
4. Confirmar que 1 linha foi deletada

**Responsável:** Igor Pirola (tem acesso ao Supabase)

---

*Última atualização: 17/05/2026*
