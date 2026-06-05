export function KpiCard({ title, kpiData }: { title: string, kpiData: any }) {
  if (!kpiData) return null

  // Mapeamento de severidade para cores baseadas nas classes CSS do projeto
  const severityClass = 
    kpiData.tag_tipo === 'up' ? 'pos' :
    kpiData.tag_tipo === 'dn' ? 'warn' : 'neu'

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--r-card)] p-4 relative overflow-hidden flex flex-col hover:border-[var(--border2)] transition-colors">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-semibold text-[var(--hint)] uppercase tracking-[0.08em]">
          {title}
        </span>
        <span className={`kpi-badge kpi-badge--${severityClass}`}>
          {kpiData.tag}
        </span>
      </div>
      <div className="flex items-end gap-2 mt-auto">
        <span className={`font-mono text-3xl font-semibold leading-none tracking-tight kpi-val--${severityClass}`}>
          {kpiData.valor}
        </span>
      </div>
      <div className={`text-[11px] mt-1 font-light leading-tight kpi-ctx--${severityClass}`}>
        {kpiData.sub}
      </div>
    </div>
  )
}
