import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export const revalidate = 60;

export default async function CrisesPage() {
  const { data: latestReport } = await supabase
    .from('relatorios')
    .select('payload')
    .order('data_referencia', { ascending: false })
    .limit(1)
    .single();

  const payload = latestReport?.payload || {};
  const gaps = payload?.gaps_fotus || [];
  const riscoPrincipal = payload?.risco_principal || "Nenhum risco sistêmico mapeado.";

  // Podemos extrair alertas do radar de portfolio ou concorrentes
  const alertas = [
    ...(payload?.radar_portfolio || []).filter((r: any) => r.alerta).map((r: any) => ({
      origem: r.marca, tipo: 'Portfólio', desc: r.alerta_descricao || r.contexto
    })),
    ...(payload?.concorrentes_distribuidores || []).filter((c: any) => c.alerta).map((c: any) => ({
      origem: c.nome, tipo: 'Concorrente', desc: c.contexto
    }))
  ];

  return (
    <div className="animate-in fade-in duration-500 pb-20 pt-2">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight">Crises & Alertas</h1>
          <p className="text-[13px] text-slate-500 mt-0.5 font-medium">
            Sala de guerra: riscos iminentes e gaps operacionais que exigem atenção imediata.
          </p>
        </div>
        <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg border border-red-200 flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
          <span className="text-[12px] font-bold uppercase tracking-wider">{alertas.length} Alertas Ativos</span>
        </div>
      </div>

      <div className="bg-red-600 rounded-2xl p-6 text-white mb-6 shadow-lg shadow-red-600/20">
        <h2 className="text-[12px] font-bold text-red-200 uppercase tracking-wider mb-2">Risco Principal (War Room)</h2>
        <p className="text-[16px] font-medium leading-relaxed">{riscoPrincipal}</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Feed de Alertas */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] border border-slate-100">
          <h2 className="text-[14px] font-bold text-slate-900 mb-4">Feed de Alertas Críticos</h2>
          {alertas.length > 0 ? (
            <div className="space-y-4">
              {alertas.map((a: any, i: number) => (
                <div key={i} className="flex gap-4 p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center font-bold text-[18px] shrink-0">
                    !
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-800">{a.origem}</span>
                      <span className="text-[9px] font-bold bg-slate-200 text-slate-600 px-1.5 py-0.5 rounded-full uppercase">{a.tipo}</span>
                    </div>
                    <p className="text-[13px] text-slate-600">{a.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-sm font-medium">Radar limpo. Nenhuma crise detectada nos canais hoje.</div>
          )}
        </div>

        {/* Gaps Internos (Fotus) */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] border border-slate-100">
          <h2 className="text-[14px] font-bold text-slate-900 mb-4">Gaps e Vulnerabilidades (Interno)</h2>
          {gaps.length > 0 ? (
            <div className="space-y-4">
              {gaps.map((g: any, i: number) => (
                <div key={i} className="p-4 border border-orange-100 bg-orange-50/30 rounded-xl">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[12px] font-bold text-orange-800 capitalize">{g.tipo}</span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${
                      g.frequencia === 'alta' ? 'bg-red-100 text-red-700' : 'bg-orange-100 text-orange-700'
                    }`}>{g.frequencia} Frequência</span>
                  </div>
                  <p className="text-[13px] text-slate-700 mb-3">{g.descricao}</p>
                  
                  <div className="bg-white p-3 rounded-lg border border-orange-100">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Ação Recomendada</span>
                    <p className="text-[12px] text-slate-600 font-medium">{g.recomendacao}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-sm font-medium">Nenhum gap estrutural apontado pelo mercado hoje.</div>
          )}
        </div>
      </div>
    </div>
  );
}
