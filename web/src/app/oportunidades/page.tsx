import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export const revalidate = 60;

export default async function OportunidadesPage() {
  const { data: latestReport } = await supabase
    .from('relatorios')
    .select('payload')
    .order('data_referencia', { ascending: false })
    .limit(1)
    .single();

  const payload = latestReport?.payload || {};
  
  // Como Oportunidades podem vir de vários lugares (briefing_executivo ações, ou lacunas_portfolio)
  // Vamos agrupar os dados relevantes para o board comercial.
  const lacunas = payload?.lacunas_portfolio || [];
  const resumoOportunidade = payload?.oportunidade_fotus || "Nenhuma oportunidade consolidada hoje.";

  return (
    <div className="animate-in fade-in duration-500 pb-20 pt-2">
      <div className="mb-8">
        <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight">Oportunidades Comerciais</h1>
        <p className="text-[13px] text-slate-500 mt-0.5 font-medium">
          Sinais de compra, lacunas de concorrentes e up-sell mapeados pela IA.
        </p>
      </div>

      <div className="bg-amber-50 rounded-2xl p-6 border border-amber-100 mb-6">
        <h2 className="text-[12px] font-bold text-amber-800 uppercase tracking-wider mb-2">Insight Estratégico do Dia</h2>
        <p className="text-[14px] text-amber-900 font-medium leading-relaxed">{resumoOportunidade}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Kanban Board Mock - A Fazer */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h3 className="text-[13px] font-bold text-slate-700">Novos Sinais (Leads)</h3>
            <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{lacunas.length}</span>
          </div>
          
          {lacunas.map((l: any, i: number) => (
            <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow cursor-grab">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded uppercase">{l.demanda} Demanda</span>
                <span className="text-[11px] font-bold text-slate-400">{l.marca}</span>
              </div>
              <p className="text-[13px] text-slate-700 mb-3">{l.contexto}</p>
              <div className="pt-3 border-t border-slate-100 flex justify-between items-center">
                <span className="text-[11px] font-medium text-slate-500 line-clamp-1">{l.implicacao}</span>
              </div>
            </div>
          ))}
          
          {lacunas.length === 0 && (
            <div className="p-4 border-2 border-dashed border-slate-200 rounded-xl text-center text-[12px] text-slate-400 font-medium">
              Nenhum sinal novo hoje.
            </div>
          )}
        </div>

        {/* Kanban Board Mock - Em Contato */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h3 className="text-[13px] font-bold text-slate-700">Em Contato</h3>
            <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">1</span>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm opacity-60">
            <p className="text-[12px] text-slate-500 italic">Área para integração futura com CRM (HubSpot/Pipefy).</p>
          </div>
        </div>

        {/* Kanban Board Mock - Convertido */}
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <h3 className="text-[13px] font-bold text-slate-700">Convertido</h3>
            <span className="bg-slate-200 text-slate-600 text-[10px] font-bold px-2 py-0.5 rounded-full">0</span>
          </div>
        </div>
      </div>
    </div>
  );
}
