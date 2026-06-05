import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export const revalidate = 60;

export default async function DistribuidoresPage() {
  const { data: latestReport } = await supabase
    .from('relatorios')
    .select('payload')
    .order('data_referencia', { ascending: false })
    .limit(1)
    .single();

  const payload = latestReport?.payload || {};
  const distribuidores = payload?.concorrentes_distribuidores || [];

  return (
    <div className="animate-in fade-in duration-500 pb-20 pt-2">
      <div className="mb-8">
        <h1 className="text-[22px] font-extrabold text-slate-900 tracking-tight">Distribuidores</h1>
        <p className="text-[13px] text-slate-500 mt-0.5 font-medium">
          Mapeamento dos concorrentes logísticos e percepção dos instaladores.
        </p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] border border-slate-100">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Concorrente</th>
                <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Tier</th>
                <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Menções</th>
                <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Regiões Afetadas</th>
                <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Contexto Principal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {distribuidores.length > 0 ? (
                distribuidores.map((d: any, i: number) => (
                  <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 pr-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-2.5 h-2.5 rounded-full ${d.alerta ? 'bg-red-500' : 'bg-slate-300'}`} />
                        <span className="font-bold text-slate-700">{d.nome}</span>
                      </div>
                    </td>
                    <td className="py-4 pr-4 text-center">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded bg-slate-100 text-slate-600 font-mono font-bold text-[11px]">
                        {d.tier}
                      </span>
                    </td>
                    <td className="py-4 pr-4">
                      <span className="font-mono font-bold text-slate-900">{d.mencoes}</span>
                    </td>
                    <td className="py-4 pr-4">
                      <div className="flex gap-1">
                        {d.regioes?.map((r: string, idx: number) => (
                          <span key={idx} className="bg-slate-100 text-slate-600 px-2 py-0.5 rounded text-[10px] font-bold">{r}</span>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 pr-4">
                      <span className="text-slate-600 max-w-[300px] truncate block" title={d.contexto}>{d.contexto}</span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400 text-sm font-medium">
                    Nenhum distribuidor mapeado no radar de hoje.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
