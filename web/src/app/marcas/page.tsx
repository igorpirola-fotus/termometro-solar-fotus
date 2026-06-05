import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export const revalidate = 60;

export default async function MarcasPage() {
  const { data: latestReport } = await supabase
    .from('relatorios')
    .select('payload')
    .order('data_referencia', { ascending: false })
    .limit(1)
    .single();

  const payload = latestReport?.payload || {};
  const radarPortfolio = payload?.radar_portfolio || [];
  const lacunas = payload?.lacunas_portfolio || [];

  return (
    <div className="animate-in fade-in duration-500 pb-20 pt-2">
      <div className="mb-8">
        <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight">Marcas & Share</h1>
        <p className="text-[13px] text-slate-500 mt-0.5 font-medium">
          Monitoramento profundo do portfólio Fotus e movimentações de mercado.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Radar do Portfólio */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] border border-slate-100">
          <h2 className="text-[14px] font-bold text-slate-900 mb-4">Performance do Portfólio (Fotus)</h2>
          {radarPortfolio.length > 0 ? (
            <div className="space-y-4">
              {radarPortfolio.map((item: any, idx: number) => (
                <div key={idx} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl border border-slate-100">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800">{item.marca}</span>
                      {item.exclusivo && (
                        <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full uppercase">Exclusivo</span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1 capitalize">{item.categoria}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-[14px] font-mono font-bold text-slate-900">{item.mencoes} menções</span>
                    <span className={`text-[10px] font-bold uppercase ${
                      item.sentimento === 'positivo' ? 'text-emerald-600' :
                      item.sentimento === 'negativo' ? 'text-red-600' : 'text-slate-500'
                    }`}>
                      Sentimento {item.sentimento}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-sm font-medium">Nenhum dado capturado hoje para o portfólio.</div>
          )}
        </div>

        {/* Lacunas do Portfólio */}
        <div className="bg-white rounded-2xl p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] border border-slate-100">
          <h2 className="text-[14px] font-bold text-slate-900 mb-4">Lacunas Identificadas</h2>
          {lacunas.length > 0 ? (
            <div className="space-y-4">
              {lacunas.map((item: any, idx: number) => (
                <div key={idx} className="flex flex-col gap-2 p-4 bg-red-50/50 rounded-xl border border-red-100/50">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-800">{item.marca}</span>
                    <span className="text-[10px] font-bold bg-red-100 text-red-700 px-2 py-0.5 rounded-full uppercase">Alta Demanda</span>
                  </div>
                  <p className="text-[12px] text-slate-600 leading-relaxed">{item.contexto}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-8 text-center text-slate-400 text-sm font-medium">O portfólio parece atender bem à demanda atual.</div>
          )}
        </div>
      </div>
    </div>
  );
}
