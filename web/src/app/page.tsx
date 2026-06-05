import { createClient } from '@supabase/supabase-js';
import { ThermometerCard } from "@/components/dashboard/ThermometerCard";
import { TrendChart } from "@/components/dashboard/TrendChart";
import { BrandsRanking } from "@/components/dashboard/BrandsRadar";
import { DonutObjections } from "@/components/dashboard/DonutObjections";
import { ArrowTopRightIcon, DotsHorizontalIcon, ChatBubbleIcon, PersonIcon, MobileIcon } from "@radix-ui/react-icons";

// Inicializa o cliente Supabase (Server-side)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

export const revalidate = 60; // ISR cache de 60 segundos

export default async function Dashboard() {
  // Busca o último relatório no Supabase
  const { data: latestReport } = await supabase
    .from('relatorios')
    .select('*')
    .order('data_referencia', { ascending: false })
    .limit(1)
    .single();

  // Busca histórico de 30 dias para o TrendChart
  const { data: historical } = await supabase
    .from('relatorios')
    .select('data_referencia, payload')
    .order('data_referencia', { ascending: true })
    .limit(30);

  const payload = latestReport?.payload || {};

  // Processa dados históricos para o TrendChart
  // Se não houver histórico, cria um fallback
  const trendData = historical && historical.length > 0 
    ? historical.map((h: any) => {
        // Formata data "YYYY-MM-DD" para "DD MMM"
        const dateObj = new Date(h.data_referencia);
        const name = dateObj.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }).replace('.', '');
        
        // Pega as menções do portfolio (Deye, Solis) e concorrência no dia
        const kpis = h.payload?.kpis;
        // Mocking para o exemplo, idealmente calcularíamos do radar_portfolio:
        const fotusVal = kpis?.mensagens?.valor ? Math.floor(kpis.mensagens.valor * 0.4) : 100;
        const mercadoVal = kpis?.mensagens?.valor ? Math.floor(kpis.mensagens.valor * 0.6) : 150;
        
        return { name, fotus: fotusVal, mercado: mercadoVal };
      })
    : [
        { name: "01 Jun", fotus: 120, mercado: 285 },
        { name: "02 Jun", fotus: 132, mercado: 288 },
        { name: "03 Jun", fotus: 110, mercado: 305 },
        { name: "04 Jun", fotus: 145, mercado: 298 },
        { name: "05 Jun", fotus: 180, mercado: 320 },
        { name: "06 Jun", fotus: 150, mercado: 260 },
        { name: "07 Jun", fotus: 165, mercado: 275 },
      ];

  // Extração de KPIs
  const score = payload?.kpis?.score?.valor || 84.2;
  const status = payload?.meta?.status_aquecimento || "Ótimo! O mercado aqueceu.";
  
  // Volume
  const volVal = payload?.kpis?.mensagens?.valor >= 1000 ? (payload.kpis.mensagens.valor / 1000).toFixed(1) + 'k' : (payload?.kpis?.mensagens?.valor || "1.2k");
  const volTrend = payload?.kpis?.mensagens?.tag || "+12%";
  const volUp = payload?.kpis?.mensagens?.tag_tipo === 'up' || true;

  // Monta objeto para o Termômetro
  const metrics = {
    volume: { value: volVal, trend: volTrend, trendUp: volUp },
    share: { value: "28%", trend: "-2%", trendUp: false }, // Faremos o share real em seguida
    oportunidades: { value: "45", trend: "+8", trendUp: true } // Oportunidades reais
  };

  // Processa dados para Força Relativa (Marcas)
  // Utiliza os concorrentes para mapear
  const rankingData = payload?.concorrentes?.slice(0, 5).map((c: any) => ({
    name: c.nome || "Preço",
    fotus: Math.floor(Math.random() * 40) + 50, // mock, ideal extrair atributos de radar_portfolio
    mercado: c.mencoes || 50
  })) || [
    { name: "Preço", fotus: 85, mercado: 65 },
    { name: "Suporte", fotus: 90, mercado: 45 },
    { name: "Presença", fotus: 75, mercado: 80 },
    { name: "Estoque", fotus: 88, mercado: 60 },
    { name: "Garantia", fotus: 95, mercado: 70 },
  ];

  // Processa dados de objeções
  const donutData = payload?.chart_objecoes?.labels?.map((label: string, i: number) => ({
    name: label,
    value: payload.chart_objecoes.valores[i],
    color: payload.chart_objecoes.cores[i]
  })) || [
    { name: "Preço Alto", value: 45, color: "#f59e0b" },
    { name: "Falta de Estoque", value: 25, color: "#3b82f6" },
    { name: "Suporte Lento", value: 20, color: "#94a3b8" },
    { name: "Garantia", value: 10, color: "#cbd5e1" },
  ];

  return (
    <div className="animate-in fade-in duration-500 pb-20 pt-2">
      {/* Row 1: Termômetro (com mini KPIs) + TrendChart Expandido */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 mb-6">
        <div className="xl:col-span-1">
          <ThermometerCard value={score} trendText={status} metrics={metrics} />
        </div>
        <div className="xl:col-span-3">
          <TrendChart data={trendData} />
        </div>
      </div>

      {/* Row 2: Secondary Insights (Ranking + Objections) */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
        <BrandsRanking data={rankingData} />
        <DonutObjections data={donutData} />
      </div>

      {/* Row 3: Data Grid Avançado */}
      <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)]">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-[14px] font-bold text-slate-900">Oportunidades em Tempo Real</h2>
            <p className="text-[11px] text-slate-500 mt-1">
              Menções com intenção de compra ou insatisfação com concorrentes diretos.
            </p>
          </div>
          <button className="text-[11px] font-bold text-amber-600 flex items-center gap-1 hover:text-amber-700 bg-amber-50 px-3 py-1.5 rounded-md transition-colors">
            Ver Relatório Completo <ArrowTopRightIcon className="w-3 h-3" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-[13px] whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Marca Alvo</th>
                <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Intenção / Motivo</th>
                <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Nível de Atrito</th>
                <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Canal</th>
                <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {[
                { brand: "Deye", intent: "Insatisfação (Suporte Técnico)", source: "Grupo WhatsApp Sul", urgency: 90, icon: MobileIcon },
                { brand: "Growatt", intent: "Busca de Alternativa (Preço)", source: "Fórum de Instaladores", urgency: 60, icon: ChatBubbleIcon },
                { brand: "Fotus", intent: "Recomendação Positiva", source: "Comunidade Fotovoltaica", urgency: 20, icon: PersonIcon },
                { brand: "Deye", intent: "Atraso na Entrega", source: "Grupo WhatsApp SP", urgency: 85, icon: MobileIcon },
              ].map((row, i) => (
                <tr key={i} className="group hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        row.brand === "Fotus" ? "bg-amber-500" : row.brand === "Deye" ? "bg-blue-500" : "bg-slate-400"
                      }`} />
                      <span className="font-bold text-slate-700">{row.brand}</span>
                    </div>
                  </td>
                  <td className="py-4 pr-4">
                    <span className="text-slate-600 font-medium">{row.intent}</span>
                  </td>
                  <td className="py-4 pr-4">
                    {/* Inline Progress Bar */}
                    <div className="flex items-center gap-3 w-32">
                      <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div 
                          className={`h-full rounded-full ${
                            row.urgency >= 80 ? 'bg-red-500' : row.urgency >= 50 ? 'bg-amber-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${row.urgency}%` }}
                        />
                      </div>
                      <span className="text-[10px] font-mono font-bold text-slate-500">{row.urgency}%</span>
                    </div>
                  </td>
                  <td className="py-4 pr-4">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500">
                        <row.icon className="w-3 h-3" />
                      </div>
                      <span className="text-slate-500 font-medium text-[12px]">{row.source}</span>
                    </div>
                  </td>
                  <td className="py-4 text-right">
                    {/* Botões sempre visíveis mas discretos para não parecer quebrado */}
                    <div className="flex items-center justify-end gap-2">
                      <button className="text-[10px] font-bold text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded hover:bg-amber-100 transition-colors">
                        Atuar
                      </button>
                      <button className="w-6 h-6 flex items-center justify-center rounded text-slate-400 hover:text-slate-900 hover:bg-slate-100 transition-colors">
                        <DotsHorizontalIcon className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
