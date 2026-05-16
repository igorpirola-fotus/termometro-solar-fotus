import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SYSTEM_PROMPT = `Voce e o motor analitico do Cortex Fotus - sistema de inteligencia de mercado DIARIA para a Fotus Distribuidora Solar (B2B, distribuidora de equipamentos fotovoltaicos para integradores de pequeno e medio porte).

Voce recebera mensagens de grupos de WhatsApp de integradores solares de UM DIA ESPECIFICO, e opcionalmente um resumo do dia anterior para comparacao.

Cada linha de mensagem segue o formato: [Data/Hora] Remetente (Grupo): Conteudo.

RETORNE APENAS JSON VALIDO, sem markdown, sem explicacoes, sem texto fora do JSON.

Campos obrigatorios no JSON de saida:

- meta: { data (DD/MM/AAAA), mensagens (numero), grupos (numero), modelo (string), score_aquecimento (0-100), status_aquecimento (Volume Reduzido|Volume Moderado|Volume Alto|Mercado Quente), status_cor (#3B82F6|#EF9F27|#FFC20E|#E24B4A) }

- tese_executiva: string HTML com analise do dia em 2-3 paragrafos densos, use strong para destaques

- tags_exec: array de objetos { texto, tipo } onde tipo e hot|warn|neu

- kpis: { score, mensagens, grupos, concorrentes } cada um com { valor (numero), sub (texto curto), tag (texto), tag_tipo (up|dn|neu) }

- mencoes_fotus: array de { tipo (Positivo|Negativo|Neutro), categoria (Suporte|Comercial|Produto|Relacionamento), texto, grupo }

- oportunidade_fotus: string com insight estrategico sobre mencoes da Fotus

- concorrentes: array de { rank, nome, mencoes, alerta (boolean), badge_texto, badge_cor (hex), badge_txt_cor (hex), descricao, estados (array de strings UF xN) }

- marcas: array de { nome, mencoes, tipo (Software|Fotus|Neutro|Concorr.|Saindo|Parceiro), cor (hex), estados (array de strings) }

- estados: array de { uf, contagem }

- objecoes: array de { titulo, descricao, prioridade (Alta|Media|Baixa|Oport.), badge_extra, icon_cor (hex), icon_stroke (hex) }

- matriz_sinais: array de { dimensao (Suporte tecnico|Competicao|Financiamento|Garantia/Pos-venda|Reputacao Fotus|Oportunidade), score (ALTO|MEDIO|POS.|BAIXO), score_classe (ms-high|ms-mid|ms-low), intensidade (0-100), cor (hex), desc }

- insight_estrategico: string com analise de oportunidade do dia em 2-3 linhas

- risco_principal: string com analise de risco do dia em 2-3 linhas

- chart_objecoes: { labels (array de strings), valores (array de numeros), cores (array de hex) }

- delta: objeto com comparacao ao dia anterior (null se nao houver dia anterior):
  {
    score_delta: numero (positivo = subiu, negativo = caiu, null se sem referencia),
    resumo: string com 1-2 linhas sobre o que mudou em relacao ao dia anterior,
    novos_alertas: array de strings com novos temas/alertas que surgiram hoje,
    temas_encerrados: array de strings com temas que perderam relevancia,
    tendencia: "acelerando"|"estavel"|"arrefecendo"
  }

Regras:
- score_aquecimento: menos de 50 msgs = max 40; 50-200 = entre 40 e 65; mais de 200 = entre 65 e 100
- Se nao houver resumo do dia anterior, retorne delta.score_delta como null e delta.resumo como "Primeiro dia de referencia - sem comparativo disponivel"
- Seja estrategico, nao descritivo. Cada campo deve ter valor analitico real
- Mencoes vazias da Fotus: retorne array vazio`

interface Message {
  sender_name?: string
  group_name?: string
  group_jid?: string
  message_timestamp?: string
  content_text?: string
}

interface RequestBody {
  messages: Message[]
  data_referencia: string
  periodo_inicio?: string
  periodo_fim?: string
  relatorio_anterior?: unknown
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), { status: 405 })
  }

  const anthropicKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!anthropicKey) {
    return new Response(JSON.stringify({ error: 'ANTHROPIC_API_KEY not set' }), { status: 500 })
  }

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

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const sb = createClient(supabaseUrl, supabaseKey)

  // Busca relatorio do dia anterior para delta
  let relatorioAnterior = body.relatorio_anterior ?? null
  if (!relatorioAnterior && body.data_referencia) {
    const dataAnterior = new Date(body.data_referencia)
    dataAnterior.setDate(dataAnterior.getDate() - 1)
    const dataAnteriorStr = dataAnterior.toISOString().split('T')[0]

    const { data: anterior } = await sb
      .from('relatorios')
      .select('payload')
      .eq('data_referencia', dataAnteriorStr)
      .single()

    if (anterior?.payload) {
      const p = anterior.payload as Record<string, unknown>
      relatorioAnterior = {
        data: dataAnteriorStr,
        score_aquecimento: (p.meta as Record<string, unknown>)?.score_aquecimento,
        status_aquecimento: (p.meta as Record<string, unknown>)?.status_aquecimento,
        tese_resumo: typeof p.tese_executiva === 'string'
          ? p.tese_executiva.replace(/<[^>]+>/g, '').substring(0, 500)
          : '',
        concorrentes_top: Array.isArray(p.concorrentes)
          ? (p.concorrentes as Array<Record<string, unknown>>).slice(0, 3).map(c => ({ nome: c.nome, mencoes: c.mencoes }))
          : [],
        objecoes_top: Array.isArray(p.objecoes)
          ? (p.objecoes as Array<Record<string, unknown>>).slice(0, 3).map(o => o.titulo)
          : []
      }
    }
  }

  // Formata mensagens
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

  const userContent = relatorioAnterior
    ? `RESUMO DO DIA ANTERIOR (${(relatorioAnterior as Record<string, unknown>).data}):\n${JSON.stringify(relatorioAnterior)}\n\n---\n\nMENSAGENS DO DIA ${body.data_referencia}:\n${texto}`
    : `MENSAGENS DO DIA ${body.data_referencia}:\n${texto}`

  // Chama Claude
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
      messages: [{ role: 'user', content: userContent }]
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

  let payload: unknown
  try {
    const clean = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    payload = JSON.parse(clean)
  } catch {
    const match = rawText.match(/\{[\s\S]*\}/)
    if (!match) {
      return new Response(JSON.stringify({ error: 'JSON invalido', preview: rawText.substring(0, 200) }), { status: 502 })
    }
    payload = JSON.parse(match[0])
  }

  const toDate = (v?: string) => { try { return v ? new Date(v).toISOString().split('T')[0] : null } catch { return null } }

  const { error: insertError } = await sb.from('relatorios').upsert({
    data_referencia: body.data_referencia,
    payload,
    total_mensagens: msgs.length,
    periodo_inicio: body.periodo_inicio ? toDate(body.periodo_inicio) : toDate(msgs[0].message_timestamp),
    periodo_fim: body.periodo_fim ? toDate(body.periodo_fim) : toDate(msgs[msgs.length - 1].message_timestamp)
  }, { onConflict: 'data_referencia' })

  if (insertError) {
    return new Response(JSON.stringify({ error: insertError.message }), { status: 500 })
  }

  return new Response(JSON.stringify({ ok: true, data_referencia: body.data_referencia, mensagens: msgs.length }), {
    headers: { 'Content-Type': 'application/json' }
  })
})
