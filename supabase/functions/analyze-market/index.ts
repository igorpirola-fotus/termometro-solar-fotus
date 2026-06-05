import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { parseClaudeJSON } from '../_shared/parseClaudeJSON.ts' // Mantemos para fallback de parse seguro

const GEMINI_MODEL = "gemini-2.5-flash"; // Usando a versão Flash: Custo extremamente baixo, ultrarrápida e mesma janela de contexto

// Prompts dos Especialistas
const PROMPT_AGENT_CONCORRENCIA = `Você é o Agente Especialista em Concorrência (Tier 1, 2 e 3).
Sua missão é ler as mensagens do WhatsApp e extrair EXCLUSIVAMENTE os movimentos de distribuidores concorrentes da Fotus.
Foco:
- Belenergy, Fortlev Solar, Soollar, Aldo, Sou Energy, etc.
- Agressividade de preços, prazos de entrega, estoques vazios da concorrência.
- Alcance geográfico das movimentações (Ex: Fortlev dominando no ES).
Retorne um relatório textual cru e denso (bullet points), listando todas as menções relevantes e o impacto competitivo.`;

const PROMPT_AGENT_PORTFOLIO = `Você é o Agente Engenheiro de Portfólio.
Sua missão é ler as mensagens e focar EXCLUSIVAMENTE em marcas de equipamentos, defeitos, elogios e "lacunas de mercado".
Marcas Fotus: GoodWe, Solplanet, Solis, AUXSOL, Deye, TSUNESS, LONGi, Sunova, Pulling, Jinko, UCB Power.
Lacunas: Qualquer marca fora dessa lista que esteja com alta demanda (ex: Fronius, Growatt, Hoymiles).
Foco:
- Dores técnicas, erros, problemas de garantia de marcas Fotus (alerta crítico).
- Necessidades do instalador que o portfólio Fotus não atende.
Retorne um relatório textual denso listando o que os integradores precisam e o desempenho dos produtos.`;

const PROMPT_AGENT_COMERCIAL = `Você é o Agente Diretor Comercial.
Sua missão é ler as mensagens e extrair EXCLUSIVAMENTE oportunidades de venda (Leads quentes), objeções recorrentes e crises agudas.
Foco:
- Integradores pedindo produtos abertamente ("alguém tem X pra pronta entrega?").
- Reclamações sobre preço alto, suporte ruim ou frete.
- Crises de mercado que afetam a macro-economia solar.
Retorne um relatório focado em AÇÃO: quem quer comprar o quê, e quais os atritos comerciais que impedem vendas.`;

const PROMPT_MASTER_AGENT = `Você é o Master Agent (Sintetizador Executivo) do Termômetro do Mercado Solar da Fotus.
Você receberá os dossiês de 3 agentes subordinados: Concorrência, Portfólio e Comercial.
Sua missão é UNIFICAR essas perspectivas e formatar a saída OBRIGATORIAMENTE no Schema JSON V3 esperado pelo Dashboard Next.js.

Regras Absolutas:
1. Retorne APENAS o JSON V3 puro. Sem markdown, sem explicação.
2. Nunca cite nomes de pessoas internas da Fotus, apenas "a Fotus".
3. Preencha todos os campos do Schema.
4. "gaps_fotus" deve vir do Agente de Portfólio.
5. "oportunidade_fotus" deve vir do Agente Comercial.
6. "radar_concorrentes" deve vir do Agente de Concorrência.
7. As marcas exclusivas da Fotus são: AUXSOL, Pulling e Deye Micro.

Estrutura de Saída (Exemplo vazio):
{
  "meta": { "score_aquecimento": 0, "status_aquecimento": "Frio", "status_cor": "#3B82F6" },
  "briefing_executivo": [ { "titulo": "", "contexto": "", "implicacao": "", "acao": "", "prioridade": "" } ],
  "tese_executiva": { "cabecalho": "", "bullets": [], "conclusao": "" },
  "tags_exec": [],
  "kpis": { "score": {}, "mensagens": {}, "grupos": {}, "concorrentes": {} },
  "radar_portfolio": [],
  "lacunas_portfolio": [],
  "mencoes_fotus": [],
  "oportunidade_fotus": "",
  "concorrentes_distribuidores": [],
  "concorrentes": [],
  "marcas": [],
  "estados": [],
  "objecoes": [],
  "matriz_sinais": [],
  "gaps_fotus": [],
  "insight_estrategico": "",
  "risco_principal": "",
  "chart_objecoes": { "labels": [], "valores": [], "cores": [] },
  "delta": {},
  "radar_concorrentes": [],
  "marcas_mercado": []
}`;

// Helper para chamar a API do Gemini via REST
async function callGemini(apiKey: string, systemPrompt: string, userPrompt: string, isJsonMode = false): Promise<string> {
  const payload: any = {
    contents: [{ role: "user", parts: [{ text: userPrompt }] }],
    systemInstruction: { parts: [{ text: systemPrompt }] },
    generationConfig: {
      temperature: 0.1,
    }
  };

  if (isJsonMode) {
    payload.generationConfig.responseMimeType = "application/json";
  }

  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`;
  
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  const data = await res.json();
  
  if (!res.ok) {
    throw new Error(data.error?.message || JSON.stringify(data));
  }
  
  if (!data.candidates || data.candidates.length === 0) {
    throw new Error('Gemini retornou zero candidatos');
  }

  return data.candidates[0].content.parts[0].text;
}

// O restante da validação mantemos idêntica para não quebrar o frontend
function validateAndNormalizePayload(raw: any, dataReferencia: string, totalMensagens: number) {
  const safePayload = typeof raw === 'object' && raw !== null ? raw : {};
  
  safePayload.meta = safePayload.meta || { score_aquecimento: 50, status_aquecimento: "Morno", status_cor: "#FFC20E" };
  safePayload.meta.data = dataReferencia;
  safePayload.meta.mensagens = totalMensagens;
  safePayload.meta.modelo = 'Termômetro v3 (Gemini Multi-Agent)';
  
  // Garante que os kpis existam e tenham os atributos .valor para não quebrar o frontend
  safePayload.kpis = safePayload.kpis || {};
  safePayload.kpis.score = safePayload.kpis.score || { valor: safePayload.meta.score_aquecimento || 50, delta: 0 };
  safePayload.kpis.mensagens = safePayload.kpis.mensagens || { valor: totalMensagens, delta: 0 };
  safePayload.kpis.grupos = safePayload.kpis.grupos || { valor: 1, delta: 0 };
  safePayload.kpis.concorrentes = safePayload.kpis.concorrentes || { valor: 0, delta: 0 };
  
  // Para evitar quebras se o array chart_objecoes vier vazio
  safePayload.chart_objecoes = safePayload.chart_objecoes || { labels: [], valores: [], cores: [] };
  
  const arrays = [
    'briefing_executivo', 'radar_portfolio', 'lacunas_portfolio', 
    'concorrentes_distribuidores', 'objecoes', 'gaps_fotus', 
    'mencoes_fotus', 'radar_concorrentes', 'marcas_mercado', 'marcas', 'estados', 'matriz_sinais', 'concorrentes'
  ];
  for (const arr of arrays) {
    if (!Array.isArray(safePayload[arr])) safePayload[arr] = [];
  }
  
  return safePayload;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });

  const geminiKey = Deno.env.get('GEMINI_API_KEY');
  if (!geminiKey) return new Response('GEMINI_API_KEY not set', { status: 500 });

  let body;
  try {
    body = await req.json();
  } catch {
    return new Response('Invalid JSON', { status: 400 });
  }

  const msgs = body.messages || [];
  if (msgs.length === 0) return new Response('Nenhuma mensagem', { status: 400 });

  const textoMensagens = msgs.map((m: any) => 
    `[${m.message_timestamp}] ${m.sender_name} (${m.group_name}): ${m.content_text}`
  ).join('\n');

  console.log(`[analyze-market] Iniciando Rede de Agentes Gemini para ${msgs.length} mensagens...`);

  try {
    // Passo 1: Execução Paralela dos 3 Agentes Especialistas (Map)
    const [dossieConcorrencia, dossiePortfolio, dossieComercial] = await Promise.all([
      callGemini(geminiKey, PROMPT_AGENT_CONCORRENCIA, `MENSAGENS DO DIA:\n${textoMensagens}`),
      callGemini(geminiKey, PROMPT_AGENT_PORTFOLIO, `MENSAGENS DO DIA:\n${textoMensagens}`),
      callGemini(geminiKey, PROMPT_AGENT_COMERCIAL, `MENSAGENS DO DIA:\n${textoMensagens}`)
    ]);

    console.log('[analyze-market] Agentes especialistas finalizaram. Iniciando Master Agent...');

    // Passo 2: Master Agent sintetiza no JSON Final (Reduce)
    const promptSintese = `
      === DOSSIÊ CONCORRÊNCIA ===
      ${dossieConcorrencia}

      === DOSSIÊ PORTFÓLIO ===
      ${dossiePortfolio}

      === DOSSIÊ COMERCIAL ===
      ${dossieComercial}

      Gere o JSON final baseando-se NESTES 3 dossiês.
    `;

    const rawJsonText = await callGemini(geminiKey, PROMPT_MASTER_AGENT, promptSintese, true);
    
    // Parse e Validação
    const parsedObj = parseClaudeJSON(rawJsonText);
    const finalPayload = validateAndNormalizePayload(parsedObj, body.data_referencia, msgs.length);

    // Salvar no Supabase
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const sb = createClient(supabaseUrl, supabaseKey);

    const { error: insertError } = await sb.from('relatorios').upsert({
      data_referencia: body.data_referencia,
      payload: finalPayload,
      total_mensagens: msgs.length,
      periodo_inicio: msgs[0]?.message_timestamp,
      periodo_fim: msgs[msgs.length - 1]?.message_timestamp
    }, { onConflict: 'data_referencia' });

    if (insertError) throw insertError;

    return new Response(JSON.stringify({
      ok: true,
      data_referencia: body.data_referencia,
      mensagens: msgs.length,
      modelo: 'Gemini Multi-Agent'
    }), { headers: { 'Content-Type': 'application/json' } });

  } catch (error: any) {
    console.error('Erro na Edge Function:', error);
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }
});
