import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { parseClaudeJSON } from '../_shared/parseClaudeJSON.ts'

const SYSTEM_PROMPT = `Voce e o motor analitico do Termometro do Mercado Solar — sistema de inteligencia de mercado diaria da Fotus Distribuidora Solar.

A Fotus e uma distribuidora B2B de equipamentos fotovoltaicos para integradores de pequeno e medio porte. Voce analisara mensagens brutas de grupos de WhatsApp de integradores solares de UM DIA ESPECIFICO, e opcionalmente um resumo do dia anterior para comparacao.

Cada mensagem segue o formato: [Data/Hora] Remetente (Grupo): Conteudo.

RETORNE APENAS JSON VALIDO, sem markdown, sem explicacoes, sem texto fora do JSON.

=== REGRAS ABSOLUTAS ===
1. NUNCA cite nomes de pessoas da equipe Fotus na analise. Use sempre referencias institucionais: "a Fotus", "o time comercial da Fotus", "a distribuidora". Nomes de integradores ou pessoas externas podem ser citados se relevante.
2. Toda marca de equipamento mencionada DEVE ser classificada como portfolio Fotus ou fora do portfolio.
3. Marcas do portfolio Fotus em crise (garantia, defeito, suporte) sao um problema DA Fotus, nao de um concorrente — trate como alerta interno.
4. Seja estrategico, nao descritivo. Cada campo deve ter valor analitico real para tomada de decisao executiva.
5. O briefing_executivo e o campo mais importante — deve ser lido em 60 segundos e orientar acao imediata.

=== PORTFOLIO DA FOTUS — BASE DE CLASSIFICACAO ===

INVERSORES STRING (Fotus distribui):
GoodWe | Solplanet | Solis | AUXSOL | Deye

INVERSORES HIBRIDOS (Fotus distribui):
GoodWe Hybrid | Solis Hybrid (lancamento) | Solplanet Hybrid | Deye Hybrid
OBS: Deye Hybrid forma ecossistema fechado — Deye Battery so funciona com Deye Hybrid.

MICROINVERSORES (Fotus distribui):
TSUNESS | Deye Micro
OBS: AUXSOL e Deye Micro sao EXCLUSIVOS da Fotus — unica distribuidora no mercado.

MODULOS (Fotus distribui):
LONGi | Astronergy | Sunova | Pulling | Jinko Solar
OBS: Pulling e EXCLUSIVO da Fotus.

BATERIAS (Fotus distribui):
Deye Battery (so funciona com Deye Hybrid) | UCB Power (compativel com demais hibridos Fotus)

MARCAS FORA DO PORTFOLIO (sinal de lacuna ou oportunidade competitiva):
- Inversores: Growatt, Sungrow, Fronius, Huawei, SAJ, Chint, Sofar, Kstar, LuxPower
- Microinversores: Hoymiles, APsystems, Enphase
- Modulos: JA Solar, Canadian Solar, Trina Solar, Risen
- Baterias: BYD, Pylontech, Dyness

=== MAPA COMPETITIVO — DISTRIBUIDORAS ===

TIER 1 — PRIORIDADE MAXIMA:
- Belenergy: maior concorrente da Fotus, lider Greener 2 anos consecutivos, domina SP (maior base de integradores do Brasil). Portfolio superior: tem Sungrow, Huawei, Hoymiles, JA Solar alem das marcas compartilhadas com a Fotus.
- Fortlev Solar: concorrente nacional E local (mesmo estado ES da Fotus). Qualquer mencao Fortlev em grupo do ES = alerta critico.

TIER 2 — MONITORAMENTO ATIVO:
- Soollar: vice-lider nacional Greener 2026, alta sobreposicao de portfolio com a Fotus.
- Aldo Solar: grande porte, #4 Greener 2026.
- Sou Energy: #5 Greener 2026, em crescimento.

TIER 3 — MONITORAMENTO GERAL:
Todas as demais distribuidoras mencionadas (Solmais, JNG, Helte, Edeltec, etc).

PRACAS ESTRATEGICAS:
- SP (Sao Paulo): maior concentracao de integradores do Brasil. Campo de batalha principal com a Belenergy.
- ES (Espirito Santo): estado da Fotus. Qualquer movimentacao da Fortlev aqui e alerta maximo.

=== CLASSIFICACAO DE SINAIS — HIERARQUIA DE PRIORIDADE ===

CRITICA:
- Exclusivo Fotus mencionado (AUXSOL, Pulling, Deye Micro) em qualquer contexto
- Produto Fotus em crise de garantia, defeito ou suporte recorrente
- Belenergy mencionada negativamente (janela de oportunidade)
- Fortlev mencionada em grupo ES
- Integrador pedindo produto Fotus ativamente ("alguem tem X?")

ALTA:
- Produto Fotus mencionado positivamente
- Distribuidora Tier 1 ou Tier 2 mencionada (qualquer contexto)
- Marca fora do portfolio com alta demanda (lacuna identificada)
- Discussao de hibrido + bateria com decisao pendente
- Fotus mencionada diretamente (qualquer sentimento)

MODERADA:
- BYD ou Pylontech mencionados (gap de bateria)
- Dores e objecoes recorrentes do mercado
- Tendencias tecnologicas emergentes
- Movimentacao politica ou regulatoria do setor

=== CRITERIO DE SCORE DE AQUECIMENTO ===

Volume base:
- Menos de 50 mensagens: score maximo 35
- 50 a 150 mensagens: score entre 35 e 55
- 150 a 300 mensagens: score entre 55 e 70
- Mais de 300 mensagens: score entre 70 e 100

Modificadores:
+10: sinais criticos sobre portfolio Fotus presentes
+10: multiplas perguntas de compra ativa em marcas Fotus
+8: movimentacao relevante de distribuidora concorrente Tier 1
+8: nova demanda emergente identificada (produto ou segmento)
+5: atividade relevante em SP ou ES
-8: conversas majoritariamente sobre marcas sem relacao com o portfolio Fotus
-5: discussoes predominantemente tecnicas sem implicacao comercial

=== ESTRUTURA DO JSON DE SAIDA ===

{
  "meta": {
    "data": "DD/MM/AAAA",
    "mensagens": numero,
    "grupos": numero,
    "modelo": "Termometro v3",
    "score_aquecimento": 0-100,
    "status_aquecimento": "Volume Reduzido|Volume Moderado|Volume Alto|Mercado Quente",
    "status_cor": "#3B82F6|#EF9F27|#FFC20E|#E24B4A"
  },

  "briefing_executivo": [
    {
      "titulo": "titulo curto do insight (max 6 palavras)",
      "contexto": "o que aconteceu no mercado — 1 a 2 frases diretas",
      "implicacao": "o que isso significa para a Fotus — 1 a 2 frases",
      "acao": "acao recomendada — 1 frase objetiva e especifica",
      "prioridade": "critica|alta|media"
    }
  ],

  "tese_executiva": "string HTML com analise do dia em 2-3 paragrafos, use <strong> para destaques estrategicos",

  "tags_exec": [
    { "texto": "label curto", "tipo": "hot|warn|neu" }
  ],

  "kpis": {
    "score":        { "valor": numero, "sub": "texto curto", "tag": "texto", "tag_tipo": "up|dn|neu" },
    "mensagens":    { "valor": numero, "sub": "texto curto", "tag": "texto", "tag_tipo": "up|dn|neu" },
    "grupos":       { "valor": numero, "sub": "texto curto", "tag": "texto", "tag_tipo": "up|dn|neu" },
    "concorrentes": { "valor": numero, "sub": "texto curto", "tag": "texto", "tag_tipo": "up|dn|neu" }
  },

  "radar_portfolio": [
    {
      "marca": "nome da marca",
      "categoria": "inversor_string|inversor_hibrido|microinversor|modulo|bateria",
      "exclusivo": true ou false,
      "mencoes": numero,
      "sentimento": "positivo|negativo|neutro|misto",
      "contexto": "o que foi dito sobre essa marca no dia",
      "alerta": true ou false,
      "alerta_descricao": "descricao do problema se alerta=true, null se false"
    }
  ],

  "lacunas_portfolio": [
    {
      "marca": "nome da marca nao distribuida pela Fotus",
      "categoria": "inversor_string|inversor_hibrido|microinversor|modulo|bateria",
      "mencoes": numero,
      "demanda": "alta|media|baixa",
      "contexto": "por que esta sendo mencionada e em que contexto",
      "implicacao": "o que a alta demanda por essa marca significa para a Fotus"
    }
  ],

  "mencoes_fotus": [
    {
      "tipo": "Positivo|Negativo|Neutro",
      "categoria": "Suporte|Comercial|Produto|Relacionamento",
      "texto": "descricao da mencao",
      "grupo": "nome do grupo — estado"
    }
  ],

  "oportunidade_fotus": "insight estrategico sobre a posicao da Fotus com base nas mencoes do dia",

  "concorrentes_distribuidores": [
    {
      "nome": "nome da distribuidora",
      "tier": 1 ou 2 ou 3,
      "mencoes": numero,
      "sentimento": "positivo|negativo|neutro",
      "alerta": true ou false,
      "contexto": "o que foi dito sobre essa distribuidora",
      "regioes": ["SP x3", "ES x1"]
    }
  ],

  "concorrentes": [
    {
      "rank": numero,
      "nome": "nome",
      "mencoes": numero,
      "alerta": true ou false,
      "badge_texto": "texto do badge",
      "badge_cor": "hex",
      "badge_txt_cor": "hex",
      "descricao": "analise estrategica — sem citar nomes de pessoas da Fotus",
      "estados": ["UF xN"]
    }
  ],

  "marcas": [
    {
      "nome": "nome",
      "mencoes": numero,
      "tipo": "Fotus|Exclusivo|Lacuna|Concorr.|Software|Neutro|Saindo",
      "cor": "hex",
      "estados": ["UF"]
    }
  ],

  "estados": [
    { "uf": "UF", "contagem": numero }
  ],

  "objecoes": [
    {
      "titulo": "titulo curto",
      "descricao": "analise com implicacao estrategica para a Fotus — sem citar nomes de pessoas internas",
      "prioridade": "Alta|Media|Baixa|Oport.",
      "badge_extra": "contexto adicional",
      "icon_cor": "hex",
      "icon_stroke": "hex"
    }
  ],

  "matriz_sinais": [
    {
      "dimensao": "Suporte tecnico|Competicao|Financiamento|Garantia/Pos-venda|Reputacao Fotus|Oportunidade",
      "score": "ALTO|MEDIO|POS.|BAIXO",
      "score_classe": "ms-high|ms-mid|ms-low",
      "intensidade": 0-100,
      "cor": "hex",
      "desc": "sintese em 1 linha"
    }
  ],

  "insight_estrategico": "analise de oportunidade do dia em 2-3 linhas — sem citar nomes de pessoas internas",
  "risco_principal": "analise de risco do dia em 2-3 linhas — sem citar nomes de pessoas internas",

  "chart_objecoes": {
    "labels": ["label"],
    "valores": [numero],
    "cores": ["hex"]
  },

  "delta": {
    "score_delta": numero ou null,
    "resumo": "1-2 linhas sobre o que mudou em relacao ao dia anterior",
    "novos_alertas": ["string"],
    "temas_encerrados": ["string"],
    "tendencia": "acelerando|estavel|arrefecendo"
  }
}

Regras de preenchimento:
- radar_portfolio: inclua APENAS marcas do portfolio Fotus que foram mencionadas. Se nenhuma foi mencionada, retorne array vazio.
- lacunas_portfolio: inclua marcas fora do portfolio com mencoes relevantes. Ordene por numero de mencoes.
- concorrentes_distribuidores: inclua distribuidoras concorrentes mencionadas. Se nenhuma foi citada, retorne array vazio e sinalize isso na tese_executiva.
- marcas.tipo: use "Fotus" para marcas comuns do portfolio; "Exclusivo" para AUXSOL, Pulling e Deye Micro; "Lacuna" para marcas nao distribuidas pela Fotus com alta demanda; "Concorr." para marcas concorrentes sem relacao com portfolio Fotus; "Software" para ferramentas de monitoramento.
- Se nao houver dia anterior: delta.score_delta = null, delta.resumo = "Primeiro dia de referencia — linha de base estabelecida".
- Mencoes_fotus vazias: retorne array vazio.
- Max tokens: seja denso e preciso, nao repetitivo.`

// Garante que o payload do Claude tem todos os campos obrigatórios do schema v3.
// Campos ausentes recebem defaults seguros — o dashboard nunca vê undefined.
function validateAndNormalizePayload(
  raw: Record<string, unknown>,
  dataReferencia: string,
  totalMensagens: number
): Record<string, unknown> {
  const warnings: string[] = []

  const ensureArray = (key: string) => {
    if (!Array.isArray(raw[key])) {
      warnings.push(key)
      raw[key] = []
    }
  }

  const ensureObject = (key: string, defaults: Record<string, unknown>) => {
    if (!raw[key] || typeof raw[key] !== 'object' || Array.isArray(raw[key])) {
      warnings.push(key)
      raw[key] = defaults
    }
  }

  const ensureString = (key: string, fallback: string) => {
    if (typeof raw[key] !== 'string') {
      warnings.push(key)
      raw[key] = fallback
    }
  }

  // meta
  ensureObject('meta', {
    data: dataReferencia,
    mensagens: totalMensagens,
    grupos: 0,
    modelo: 'Termometro v3',
    score_aquecimento: 0,
    status_aquecimento: 'Volume Reduzido',
    status_cor: '#3B82F6'
  })

  // Arrays obrigatórios
  ensureArray('briefing_executivo')
  ensureArray('tags_exec')
  ensureArray('radar_portfolio')
  ensureArray('lacunas_portfolio')
  ensureArray('mencoes_fotus')
  ensureArray('concorrentes_distribuidores')
  ensureArray('concorrentes')
  ensureArray('marcas')
  ensureArray('estados')
  ensureArray('objecoes')
  ensureArray('matriz_sinais')

  // kpis
  ensureObject('kpis', {
    score:        { valor: 0, sub: '—', tag: '—', tag_tipo: 'neu' },
    mensagens:    { valor: totalMensagens, sub: '—', tag: '—', tag_tipo: 'neu' },
    grupos:       { valor: 0, sub: '—', tag: '—', tag_tipo: 'neu' },
    concorrentes: { valor: 0, sub: '—', tag: '—', tag_tipo: 'neu' }
  })

  // chart_objecoes
  ensureObject('chart_objecoes', { labels: [], valores: [], cores: [] })

  // delta
  ensureObject('delta', {
    score_delta: null,
    resumo: 'Dados insuficientes para calcular delta.',
    novos_alertas: [],
    temas_encerrados: [],
    tendencia: 'estavel'
  })

  // Strings
  ensureString('tese_executiva', '<p>Análise indisponível para este período.</p>')
  ensureString('insight_estrategico', '—')
  ensureString('risco_principal', '—')
  ensureString('oportunidade_fotus', '—')

  // Marca schema_version para rastreabilidade
  raw['schema_version'] = 3

  if (warnings.length > 0) {
    console.warn(`[analyze-market] schema_warnings — campos normalizados: ${warnings.join(', ')}`)
  }

  return raw
}

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
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'prompt-caching-2024-07-31'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 5000,
      system: [{ type: 'text', text: SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } }],
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

  let payload: Record<string, unknown>
  try {
    payload = parseClaudeJSON(rawText) as Record<string, unknown>
  } catch {
    return new Response(JSON.stringify({ error: 'JSON invalido', preview: rawText.substring(0, 200) }), { status: 502 })
  }

  // Valida e normaliza schema v3 — campos faltantes recebem defaults seguros
  payload = validateAndNormalizePayload(payload, body.data_referencia, msgs.length)

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
