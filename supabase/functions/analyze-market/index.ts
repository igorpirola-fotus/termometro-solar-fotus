import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SYSTEM_PROMPT = `Voce e o motor analitico do Cortex Fotus - sistema de inteligencia de mercado para a Fotus Distribuidora Solar (B2B, distribuidora de equipamentos fotovoltaicos para integradores de pequeno e medio porte).

Voce recebera mensagens brutas de grupos de WhatsApp de integradores solares. Cada linha segue o formato: [Data/Hora] Remetente (Grupo): Conteudo. Sua missao e extrair dados estruturados para um painel de inteligencia.

RETORNE APENAS JSON VALIDO, sem markdown, sem explicacoes, sem texto fora do JSON.

Campos obrigatorios no JSON de saida:
- meta: objeto com os campos data (DD/MM/AAAA), mensagens (numero), grupos (numero), modelo (string), score_aquecimento (0-100), status_aquecimento (Volume Reduzido|Volume Moderado|Volume Alto|Mercado Quente), status_cor (#3B82F6|#EF9F27|#FFC20E|#E24B4A)
- tese_executiva: string HTML com analise executiva em 2-3 paragrafos densos, use tag strong para destaques
- tags_exec: array de objetos com texto e tipo, onde tipo e hot ou warn ou neu
- kpis: objeto com score, mensagens, grupos e concorrentes - cada um com valor (numero), sub (texto curto), tag (texto) e tag_tipo (up ou dn ou neu)
- mencoes_fotus: array de objetos com tipo (Positivo|Negativo|Neutro), categoria (Suporte|Comercial|Produto|Relacionamento), texto e grupo
- oportunidade_fotus: string com insight estrategico sobre as mencoes
- concorrentes: array de objetos com rank, nome, mencoes, alerta (boolean), badge_texto, badge_cor (hex), badge_txt_cor (hex), descricao, estados (array de strings UF xN)
- marcas: array de objetos com nome, mencoes, tipo (Software|Fotus|Neutro|Concorr.|Saindo|Parceiro), cor (hex), estados (array de strings)
- estados: array de objetos com uf e contagem
- objecoes: array de objetos com titulo, descricao, prioridade (Alta|Media|Baixa|Oport.), badge_extra, icon_cor (hex), icon_stroke (hex)
- matriz_sinais: array de objetos com dimensao (Suporte tecnico|Competicao|Financiamento|Garantia/Pos-venda|Reputacao Fotus|Oportunidade), score (ALTO|MEDIO|POS.|BAIXO), score_classe (ms-high|ms-mid|ms-low), intensidade (0-100), cor (hex), desc
- insight_estrategico: string com analise de oportunidade em 2-3 linhas
- risco_principal: string com analise de risco em 2-3 linhas
- chart_objecoes: objeto com labels (array de strings), valores (array de numeros), cores (array de hex)

Regras:
- score_aquecimento: menos de 100 msgs = max 40; 100-300 = entre 40 e 65; mais de 300 = entre 65 e 100
- Seja estrategico, nao descritivo. Cada campo deve ter valor analitico para tomada de decisao
- Mencoes vazias da Fotus: retorne array vazio
- Sempre extraia insights sobre oportunidades para a Fotus converter dores de mercado`

interface Message {
  sender_name?: string
  group_name?: string
  group_jid?: string
  message_timestamp?: string
  content_text?: string
}

interface RequestBody {
  messages: Message[]
  periodo_inicio?: string
  periodo_fim?: string
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!anthropicKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' }), { status: 500 })
  }

  // 1. Recebe mensagens do n8n
  let body: RequestBody
  try {
    body = await req.json()
  } catch {
    return new Response(JSON.stringify({ error: 'Body JSON invalido' }), { status: 400 })
  }

  const msgs = body.messages
  if (!msgs || msgs.length === 0) {
    return new Response(JSON.stringify({ error: 'Nenhuma mensagem recebida' }), { status: 400 })
  }

  // 2. Formata mensagens para o Claude
  const fmt = (ts: string) => {
    try {
      return new Date(ts).toLocaleString('pt-BR', {
        day: '2-digit', month: '2-digit', year: 'numeric',
        hour: '2-digit', minute: '2-digit'
      })
    } catch { return ts }
  }

  const texto = msgs.map(m =>
    `[${fmt(m.message_timestamp || '')}] ${m.sender_name || 'Desconhecido'} (${m.group_name || m.group_jid || 'Grupo'}): ${m.content_text}`
  ).join('\n')

  // 3. Chama Claude
  const claudeRes = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-5',
      max_tokens: 8000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: texto }]
    })
  })

  if (!claudeRes.ok) {
    const err = await claudeRes.text()
    return new Response(JSON.stringify({ error: 'Claude API error', detail: err }), { status: 502 })
  }

  const claudeData = await claudeRes.json()
  const rawText = claudeData?.content?.[0]?.text || ''

  if (!rawText) {
    return new Response(JSON.stringify({ error: 'Claude nao retornou conteudo' }), { status: 502 })
  }

  // 4. Parse JSON do Claude
  let payload: unknown
  try {
    const clean = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    payload = JSON.parse(clean)
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/)
    if (!match) {
      return new Response(JSON.stringify({ error: 'Claude nao retornou JSON valido', preview: rawText.substring(0, 200) }), { status: 502 })
    }
    payload = JSON.parse(match[0])
  }

  // 5. Salva no Supabase
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const sb = createClient(supabaseUrl, supabaseKey)

  const toDate = (v?: string) => { try { return v ? new Date(v).toISOString().split('T')[0] : null } catch { return null } }

  const { error: insertError } = await sb.from('relatorios').insert({
    payload,
    total_mensagens: msgs.length,
    periodo_inicio: body.periodo_inicio ? toDate(body.periodo_inicio) : toDate(msgs[0].message_timestamp),
    periodo_fim: body.periodo_fim ? toDate(body.periodo_fim) : toDate(msgs[msgs.length - 1].message_timestamp)
  })

  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ ok: true, mensagens: msgs.length }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
