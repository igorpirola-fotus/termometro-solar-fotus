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

const SYSTEM_NEWSLETTER = `Você é o "Cortex Solar" — um especialista em mercado de energia solar fotovoltaica com 15 anos de experiência em distribuição. Você escreve uma newsletter diária para os consultores de vendas da Fotus, uma distribuidora de equipamentos solares no Espírito Santo.

Tom: como um colega experiente contando novidades no café da manhã, não um executivo em terno. Use linguagem direta, sem jargão técnico desnecessário. Seja específico — cite marcas, estados, números quando disponíveis. Evite frases genéricas como "o mercado está aquecido".

REGRAS:
- Nunca cite nomes de pessoas da equipe Fotus — use "a Fotus", "o time Fotus"
- "Por que importa:" é obrigatório após cada notícia principal
- Máximo 350 palavras no total
- Use linguagem do método OPC: O quê aconteceu → Por quê importa → Como agir

ESTRUTURA OBRIGATÓRIA (5 seções, use exatamente esses títulos):
1. [ABERTURA] — 1-2 frases contextualizando o dia (temperatura do mercado, tom geral)
2. [TOP 3 DO DIA] — 3 bullets com as principais movimentações, cada um com "Por que importa:"
3. [NÚMERO DO DIA] — 1 dado numérico relevante com contexto em 2-3 frases
4. [O QUE USAR HOJE] — 1 recomendação acionável para o time de vendas (produto, argumento, abordagem)
5. [ABERTURA DE CONVERSA] — 1 frase para abrir conversa com cliente hoje

Retorne APENAS o texto editorial estruturado. Não inclua HTML, markdown, ou qualquer formatação além dos títulos entre colchetes.`

const SYSTEM_BRIEFING = `Você é um analista estratégico de mercado preparando um briefing executivo para o CEO e heads de uma distribuidora de equipamentos solares. Seja cirúrgico: só o que muda decisões hoje. Sem histórico, sem contexto óbvio, sem enrolação.

ESTRUTURA OBRIGATÓRIA (150-200 palavras, nunca mais):
1. [HEADLINE] — 2 linhas: o que mudou hoje que importa
2. [O QUÊ] — 3 bullets de exatamente 20 palavras cada: fatos com números
3. [POR QUÊ IMPORTA] — 1 parágrafo de 40 palavras: implicação estratégica nos próximos 30-60 dias
4. [PRÓXIMO PASSO] — 1 bullet: ação ou ponto de vigília

REGRAS: voz ativa, número primeiro, jargão executivo aceito (ASP, spread, mix, tier), nunca cite nomes de pessoas da Fotus, nunca use frases genéricas.

Retorne APENAS o texto estruturado. Não inclua HTML, markdown, ou qualquer formatação além dos títulos entre colchetes.`

// ─── HTML Templates ──────────────────────────────────────────────────────────

function buildNewsletterHTML(texto: string, dataFormatada: string, score: number): string {
  const sections = parseTextSections(texto)
  const scoreLabel = score >= 70 ? 'AQUECIDO' : score >= 50 ? 'MORNO' : 'ESFRIADO'
  const scoreColor = score >= 70 ? '#F59E0B' : score >= 50 ? '#3B82F6' : '#8B95A6'

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
          <p style="margin:0;color:#9CA3AF;font-size:11px;text-align:center;">Gerado pelo Termômetro · Fotus Distribuidora Solar · Para cancelar sua inscrição, entre em contato com o time de TI.</p>
        </td>
      </tr>

    </table>
  </td></tr>
</table>
</body>
</html>`
}

function buildBriefingHTML(texto: string, dataFormatada: string, score: number, tendencia: string): string {
  const scoreLabel = score >= 70 ? 'AQUECIDO' : score >= 50 ? 'MORNO' : 'ESFRIADO'
  const scoreColor = score >= 70 ? '#F59E0B' : score >= 50 ? '#3B82F6' : '#8B95A6'
  const lines = texto.split('\n').filter(l => l.trim())
  const htmlLines = lines.map(line => {
    if (line.startsWith('[') && line.includes(']')) {
      const label = line.slice(1, line.indexOf(']'))
      const rest = line.slice(line.indexOf(']') + 1).trim()
      return `<p style="margin:0 0 4px;color:#6B7280;font-size:10px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;">${label}</p>${rest ? `<p style="margin:0 0 16px;color:#111827;font-size:14px;line-height:1.6;">${rest}</p>` : ''}`
    }
    if (line.startsWith('•') || line.startsWith('-')) {
      return `<p style="margin:0 0 8px;color:#374151;font-size:13px;line-height:1.5;padding-left:12px;">${line}</p>`
    }
    return `<p style="margin:0 0 12px;color:#374151;font-size:13px;line-height:1.6;">${line}</p>`
  }).join('')

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Fotus Mercado | ${score}° ${tendencia} | ${dataFormatada}</title>
</head>
<body style="margin:0;padding:0;background:#F9FAFB;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#F9FAFB;">
  <tr><td align="center" style="padding:24px 16px;">
    <table width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">

      <!-- Header compacto -->
      <tr>
        <td style="padding:0 0 16px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td>
                <p style="margin:0;color:#6B7280;font-size:11px;letter-spacing:1px;text-transform:uppercase;">Briefing Executivo · ${dataFormatada}</p>
                <p style="margin:2px 0 0;color:#0B2559;font-size:18px;font-weight:700;">Termômetro do Mercado Solar</p>
              </td>
              <td align="right" valign="top">
                <span style="color:${scoreColor};font-size:20px;font-weight:700;font-family:'Courier New',monospace;">${score}° ${scoreLabel}</span>
              </td>
            </tr>
          </table>
          <hr style="border:none;border-top:2px solid #0B2559;margin:12px 0 0;">
        </td>
      </tr>

      <!-- Body -->
      <tr>
        <td style="background:#FFFFFF;border-radius:6px;padding:24px;border:1px solid #E5E7EB;">
          ${htmlLines}

          <!-- CTA -->
          <hr style="border:none;border-top:1px solid #E5E7EB;margin:16px 0;">
          <a href="https://termometro-solar-fotus.vercel.app" style="color:#0B2559;font-size:12px;font-weight:700;text-decoration:none;">Dashboard completo →</a>
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
  const d = new Date(dateStr + 'T12:00:00Z')
  return d.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
}

// ─── Claude call ─────────────────────────────────────────────────────────────

async function callClaude(systemPrompt: string, userContent: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userContent }],
    }),
  })
  const data = await response.json()
  return data.content?.[0]?.text ?? ''
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
    const texto = await callClaude(systemPrompt, userContent)

    const html = tipo === 'newsletter'
      ? buildNewsletterHTML(texto, dataFormatada, score)
      : buildBriefingHTML(texto, dataFormatada, score, tendencia)

    // Salva no histórico (fire and forget)
    saveComunicado(data_referencia, tipo, html, 0).catch(console.error)

    return new Response(JSON.stringify({ html, texto, data_referencia, tipo }), {
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
