export function RadarCard({ items }: { items: any[] }) {
  if (!items || items.length === 0) {
    return (
      <div className="p-4 text-[11px] text-[var(--hint)] bg-[var(--surface2)] rounded-lg">
        Nenhum alerta de portfólio detectado hoje.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {items.map((item, idx) => (
        <div 
          key={idx} 
          className={`flex items-start gap-3 p-3 rounded-lg bg-[var(--surface2)] border border-transparent transition-colors hover:border-[var(--border2)] ${item.alerta ? 'border-red-500/25 bg-red-500/5' : ''}`}
        >
          {/* Indicador visual de alerta */}
          <div className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${item.alerta ? 'bg-[var(--red)] animate-pulse' : 'bg-[var(--blue)]'}`} />
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium text-[var(--text)]">{item.marca}</span>
              <span className="text-[9px] text-[var(--hint)]">{item.categoria}</span>
              {item.exclusivo && (
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-[rgba(59,130,246,0.18)] text-[#93C5FD] uppercase tracking-wider">
                  Exclusivo
                </span>
              )}
            </div>
            <p className="text-[11px] text-[var(--muted)] font-light leading-snug">
              {item.contexto}
            </p>
          </div>
          
          <div className="font-mono text-[10px] text-[var(--muted)] shrink-0 pt-1">
            {item.mencoes} msgs
          </div>
        </div>
      ))}
    </div>
  )
}
