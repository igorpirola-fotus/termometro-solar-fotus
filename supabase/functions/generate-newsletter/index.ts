import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY') ?? ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? ''
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// ─── Personas ───────────────────────────────────────────────────────────────

const SYSTEM_NEWSLETTER = `Você é o "Cortex Solar" — consultor de vendas sênior com 15 anos rodando o mercado solar fotovoltaico no Brasil. Você escreve uma newsletter diária para os consultores de vendas da Fotus com o único objetivo de ajudá-los a vender mais hoje.

O leitor é um consultor de vendas B2B que vai fazer ligações e visitas nas próximas horas. Ele quer saber: qual objeção vai ouvir hoje? O que o mercado está pedindo? O que fazer diferente para fechar mais?

Tom: como um colega experiente passando um briefing rápido antes da rota — direto, prático, comercial. Sem relatório técnico, sem linguagem de tecnologia. Cada frase deve ter utilidade imediata para quem vai vender.

FOCO COMERCIAL OBRIGATÓRIO em cada seção:
- Qual objeção está circulando nos grupos que o consultor vai ouvir hoje?
- Qual produto ou marca está gerando demanda ou sendo comparada?
- O que fazer com essa informação em uma ligação ou visita?

REGRAS:
- Nunca cite nomes de pessoas da equipe Fotus — use "a Fotus", "o time Fotus"
- "Por que importa:" é obrigatório após cada notícia principal
- Máximo 350 palavras no total
- Use linguagem do método OPC: O quê aconteceu → Por quê importa → Como agir
- REVISÃO OBRIGATÓRIA: Use sempre acentuação correta em português (ã, ç, é, ê, ô, õ, í, ú, à, etc.). Nunca omita acentos. Exemplos: "inteligência", "análise", "menção", "ação", "aquecimento", "distribuição".

ESTRUTURA OBRIGATÓRIA (5 seções, use exatamente esses títulos):
1. [ABERTURA] — 1-2 frases contextualizando o dia com foco em oportunidade de venda
2. [TOP 3 DO DIA] — 3 bullets com as principais movimentações comerciais, cada um com "Por que importa:"
3. [NÚMERO DO DIA] — 1 dado numérico relevante com impacto direto em conversão ou ticket
4. [O QUE USAR HOJE] — 1 argumento ou abordagem específica para usar nas conversas de hoje (produto, comparativo, contorno de objeção)
5. [ABERTURA DE CONVERSA] — 1 frase para abrir conversa com cliente hoje, baseada no contexto do mercado

Retorne APENAS o texto editorial estruturado. Não inclua HTML, markdown, ou qualquer formatação além dos títulos entre colchetes.`

const SYSTEM_BRIEFING = `Você é um consultor comercial sênior preparando um briefing diário de mercado para o CEO e líderes comerciais de uma distribuidora de equipamentos solares. Foco exclusivo em implicações para vendas — o que aconteceu no mercado que muda alguma decisão comercial hoje.

FORMATO OBRIGATÓRIO (sem subtítulos, sem seções rotuladas, texto corrido em 3 blocos):

Bloco 1 — HEADLINE (primeira linha do texto, obrigatoriamente em maiúsculas): uma frase de até 15 palavras sobre o fato comercial mais relevante do dia.

Bloco 2 — CONTEXTO (3 bullets separados por quebra de linha, começando com •): cada bullet com um fato numérico ou concreto, máximo 20 palavras cada.

Bloco 3 — IMPLICAÇÃO COMERCIAL E AÇÃO (parágrafo final, sem label): 2-3 frases sobre o impacto nas vendas dos próximos 15-30 dias. O que o time deve fazer diferente? Qual oportunidade ou risco concreto para o portfólio? OBRIGATÓRIO incluir uma ação comercial imediata e clara.

REGRAS: voz ativa, número primeiro, foco em vendas (não em tecnologia), nunca cite nomes de pessoas da Fotus, nunca use frases genéricas como "o mercado está aquecido". Use sempre acentuação correta em português (ã, ç, é, ê, ô, õ, í, ú, à, etc.) — nunca omita acentos. Máximo 180 palavras no total.

Retorne APENAS o texto. Sem HTML, sem markdown, sem labels entre colchetes.`

// ─── Score helpers ────────────────────────────────────────────────────────────

function getScoreLabel(score: number): string {
  if (score > 80) return 'Aquecido'
  if (score > 60) return 'Parcialmente Quente'
  if (score > 40) return 'Morno'
  if (score > 20) return 'Parcialmente Frio'
  return 'Frio'
}

function getScoreColor(score: number): string {
  if (score > 80) return '#EF4444'
  if (score > 60) return '#F97316'
  if (score > 40) return '#F59E0B'
  if (score > 20) return '#3B82F6'
  return '#8B95A6'
}

// ─── HTML Templates ──────────────────────────────────────────────────────────

function buildNewsletterHTML(texto: string, dataFormatada: string, score: number): string {
  const sections = parseTextSections(texto)
  const scoreLabel = getScoreLabel(score)
  const scoreColor = getScoreColor(score)

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>O Termômetro Solar · ${dataFormatada}</title>
</head>
<body style="margin:0;padding:0;background:#F4F5F7;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F4F5F7;">
  <tr><td align="center" style="padding:24px 16px;">

    <!-- Container -->
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

      <!-- Header -->
      <tr>
        <td style="background:#0B2559;border-radius:8px 8px 0 0;padding:24px 32px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="margin:0;color:#FFC20E;font-size:11px;letter-spacing:2px;text-transform:uppercase;font-weight:700;">FOTUS DISTRIBUIDORA SOLAR</p>
                <p style="margin:4px 0 0;color:#FFFFFF;font-size:22px;font-weight:700;">O Termômetro Solar</p>
                <p style="margin:4px 0 0;color:#8B9DC3;font-size:13px;">${dataFormatada}</p>
              </td>
              <td align="right" valign="middle">
                <div style="display:inline-block;background:${scoreColor}22;border:1px solid ${scoreColor};border-radius:6px;padding:8px 14px;text-align:center;">
                  <p style="margin:0;color:${scoreColor};font-size:24px;font-weight:700;font-family:'Courier New',monospace;">${score}°</p>
                  <p style="margin:2px 0 0;color:${scoreColor};font-size:10px;letter-spacing:1px;">${scoreLabel}</p>
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="background:#FFFFFF;padding:32px;">

          ${sections.abertura ? `
          <!-- Abertura -->
          <p style="margin:0 0 24px;color:#374151;font-size:15px;line-height:1.7;font-style:italic;border-left:3px solid #FFC20E;padding-left:14px;">${sections.abertura}</p>
          ` : ''}

          ${sections.top3 ? `
          <!-- Top 3 -->
          <p style="margin:0 0 12px;color:#0B2559;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Top 3 do Dia</p>
          <div style="background:#F9FAFB;border-radius:6px;padding:20px;margin-bottom:24px;">
            ${formatBullets(sections.top3)}
          </div>
          ` : ''}

          ${sections.numero ? `
          <!-- Número do Dia -->
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
            <tr>
              <td style="background:#0B2559;border-radius:6px;padding:20px;">
                <p style="margin:0 0 6px;color:#FFC20E;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Número do Dia</p>
                <p style="margin:0;color:#FFFFFF;font-size:14px;line-height:1.6;">${sections.numero}</p>
              </td>
            </tr>
          </table>
          ` : ''}

          ${sections.oque ? `
          <!-- O Que Usar Hoje -->
          <p style="margin:0 0 10px;color:#0B2559;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">O Que Usar Hoje</p>
          <p style="margin:0 0 24px;color:#374151;font-size:14px;line-height:1.7;background:#FFFBEB;border:1px solid #FDE68A;border-radius:6px;padding:16px;">${sections.oque}</p>
          ` : ''}

          ${sections.abertura_conversa ? `
          <!-- Abertura de Conversa -->
          <p style="margin:0 0 10px;color:#0B2559;font-size:12px;font-weight:700;letter-spacing:2px;text-transform:uppercase;">Abertura de Conversa</p>
          <p style="margin:0 0 24px;color:#374151;font-size:14px;line-height:1.7;font-style:italic;">"${sections.abertura_conversa}"</p>
          ` : ''}

          <!-- CTA -->
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center" style="padding-top:8px;border-top:1px solid #E5E7EB;">
                <a href="https://termometro-solar-fotus.vercel.app" style="display:inline-block;margin-top:16px;background:#0B2559;color:#FFC20E;text-decoration:none;font-size:13px;font-weight:700;padding:12px 28px;border-radius:6px;letter-spacing:0.5px;">Ver Dashboard Completo →</a>
              </td>
            </tr>
          </table>

        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="background:#F4F5F7;border-radius:0 0 8px 8px;padding:16px 32px;border-top:1px solid #E5E7EB;">
          <p style="margin:0;color:#9CA3AF;font-size:11px;text-align:center;">Gerado pelo Termômetro · Fotus Distribuidora Solar · Para cancelar sua inscrição, fale com o time Fotus.</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

function buildBriefingHTML(texto: string, dataFormatada: string, score: number, tendencia: string): string {
  const scoreLabel = getScoreLabel(score)
  const scoreColor = getScoreColor(score)
  const lines = texto.split('\n').map(l => l.trim()).filter(Boolean)

  // Primeira linha é a headline (em maiúsculas conforme o prompt)
  const headlineLine = lines[0] ?? ''
  const restLines = lines.slice(1)

  const bodyHtml = restLines.map(line => {
    if (line.startsWith('•') || line.startsWith('-')) {
      const content = line.replace(/^[•\-]\s*/, '')
      return `<p style="margin:0 0 10px;color:#374151;font-size:14px;line-height:1.6;padding-left:16px;position:relative;"><span style="position:absolute;left:0;color:#FFC20E;font-weight:700;">▸</span>${content}</p>`
    }
    return `<p style="margin:0 0 14px;color:#374151;font-size:14px;line-height:1.7;">${line}</p>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Fotus Mercado | ${score}° ${scoreLabel} | ${dataFormatada}</title>
</head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;">
  <tr><td align="center" style="padding:24px 16px;">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

      <!-- Header -->
      <tr>
        <td style="background:#0B2559;border-radius:8px 8px 0 0;padding:20px 28px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="margin:0;color:#8B9DC3;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;">Fotus · Mercado Solar · ${dataFormatada}</p>
              </td>
              <td align="right" valign="middle">
                <span style="color:${scoreColor};font-size:18px;font-weight:700;font-family:'Courier New',monospace;">${score}° ${scoreLabel}</span>
              </td>
            </tr>
          </table>
        </td>
      </tr>

      <!-- Headline em destaque -->
      <tr>
        <td style="background:#FFFFFF;padding:24px 28px 0;">
          <p style="margin:0;color:#0B2559;font-size:18px;font-weight:700;line-height:1.4;border-left:4px solid #FFC20E;padding-left:14px;">${headlineLine}</p>
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="background:#FFFFFF;border-radius:0 0 8px 8px;padding:20px 28px 24px;border:1px solid #E5E7EB;border-top:none;">
          <hr style="border:none;border-top:1px solid #E5E7EB;margin:16px 0 20px;">
          ${bodyHtml}

          <!-- CTA -->
          <hr style="border:none;border-top:1px solid #E5E7EB;margin:16px 0 12px;">
          <a href="https://termometro-solar-fotus.vercel.app" style="color:#0B2559;font-size:12px;font-weight:700;text-decoration:none;">Ver dashboard completo →</a>
        </td>
      </tr>

      <!-- Footer -->
      <tr>
        <td style="padding:12px 0;">
          <p style="margin:0;color:#9CA3AF;font-size:10px;">Fotus Distribuidora Solar · Gerado automaticamente pelo Termômetro</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseTextSections(texto: string): Record<string, string> {
  const result: Record<string, string> = {}
  const tagMap: Record<string, string> = {
    'ABERTURA': 'abertura',
    'TOP 3 DO DIA': 'top3',
    'NÚMERO DO DIA': 'numero',
    'O QUE USAR HOJE': 'oque',
    'ABERTURA DE CONVERSA': 'abertura_conversa',
  }

  let currentKey = ''
  let currentLines: string[] = []

  for (const line of texto.split('\n')) {
    const trimmed = line.trim()
    const tagMatch = trimmed.match(/^\[(.+?)\](.*)$/)
    if (tagMatch) {
      if (currentKey) result[currentKey] = currentLines.join('\n').trim()
      const tag = tagMatch[1].trim().toUpperCase()  // normaliza para maiúsculo — Claude pode variar capitalização
      currentKey = tagMap[tag] ?? tag.toLowerCase().replace(/\s+/g, '_')
      currentLines = tagMatch[2] ? [tagMatch[2].trim()] : []
    } else if (currentKey && trimmed) {
      currentLines.push(trimmed)
    }
  }
  if (currentKey) result[currentKey] = currentLines.join('\n').trim()
  return result
}

function formatBullets(text: string): string {
  return text.split('\n')
    .filter(l => l.trim())
    .map(line => {
      const cleaned = line.replace(/^[-•·]\s*/, '')
      return `<p style="margin:0 0 12px;color:#374151;font-size:13px;line-height:1.6;padding-left:16px;position:relative;">
        <span style="position:absolute;left:0;color:#FFC20E;font-weight:700;">▸</span>
        ${cleaned}
      </p>`
    })
    .join('')
}

function formatDate(dateStr: string): string {
  const dateOnly = (dateStr ?? '').slice(0, 10)
  const d = new Date(dateOnly + 'T12:00:00Z')
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

// ─── Claude call ─────────────────────────────────────────────────────────────

function calcCustoUsd(usage: Record<string, number>): number {
  return (
    (usage.input_tokens || 0)              * 3    / 1_000_000 +
    (usage.output_tokens || 0)             * 15   / 1_000_000 +
    (usage.cache_read_input_tokens || 0)   * 0.30 / 1_000_000 +
    (usage.cache_creation_input_tokens||0) * 3.75 / 1_000_000
  )
}

async function callClaude(systemPrompt: string, userContent: string): Promise<{ text: string; custo_usd: number }> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'prompt-caching-2024-07-31,extended-cache-ttl-2025-04-11',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      // cache_control ttl:3600 = 1 hora — personas são completamente estáticas
      system: [{ type: 'text', text: systemPrompt, cache_control: { type: 'ephemeral', ttl: 3600 } }],
      messages: [{ role: 'user', content: userContent }],
    }),
  })
  const data = await response.json()
  const custo_usd = calcCustoUsd((data.usage || {}) as Record<string, number>)
  return { text: data.content?.[0]?.text ?? '', custo_usd }
}

// ─── Save to Supabase ────────────────────────────────────────────────────────

async function saveComunicado(data_referencia: string, tipo: string, html: string, destinatarios_count: number) {
  await fetch(`${SUPABASE_URL}/rest/v1/comunicados`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
    },
    body: JSON.stringify({
      data_referencia,
      tipo,
      html_content: html,
      enviado_em: new Date().toISOString(),
      destinatarios_count,
    }),
  })
}

// ─── Main handler ─────────────────────────────────────────────────────────────

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: CORS })
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 })

  try {
    const body = await req.json()
    const { payload, tipo } = body as { payload: Record<string, unknown>; tipo: 'newsletter' | 'briefing' }

    if (!payload) return new Response(JSON.stringify({ error: 'payload obrigatório' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } })
    if (!tipo || !['newsletter', 'briefing'].includes(tipo)) return new Response(JSON.stringify({ error: 'tipo deve ser newsletter ou briefing' }), { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } })

    const meta = (payload.meta as Record<string, unknown>) ?? {}
    const score = (meta.score_aquecimento as number) ?? 0
    const data_referencia = (meta.data as string) ?? (meta.data_referencia as string) ?? new Date().toISOString().slice(0, 10)
    const dataFormatada = formatDate(data_referencia)
    const tendencia = (meta.tendencia as string) ?? ''

    const userContent = `Data: ${dataFormatada}
Score de aquecimento: ${score}/100
Dados do mercado:
${JSON.stringify(payload, null, 2)}`

    const systemPrompt = tipo === 'newsletter' ? SYSTEM_NEWSLETTER : SYSTEM_BRIEFING
    const { text: texto, custo_usd } = await callClaude(systemPrompt, userContent)
    console.log(`[generate-newsletter] tipo=${tipo} custo_usd=${custo_usd.toFixed(6)}`)

    const html = tipo === 'newsletter'
      ? buildNewsletterHTML(texto, dataFormatada, score)
      : buildBriefingHTML(texto, dataFormatada, score, tendencia)

    // Salva no histórico (fire and forget)
    saveComunicado(data_referencia, tipo, html, 0).catch(console.error)

    return new Response(JSON.stringify({ html, texto, data_referencia, tipo, custo_usd }), {
      status: 200,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('[generate-newsletter] Erro:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
    })
  }
})
