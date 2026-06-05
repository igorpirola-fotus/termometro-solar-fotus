export function BriefingCard({ briefing }: { briefing: any }) {
  const isCritica = briefing.prioridade === 'critica'
  const isAlta = briefing.prioridade === 'alta'
  
  return (
    <div className={`briefing-card prio-${briefing.prioridade}`}>
      <div className="briefing-top">
        <span className={`briefing-badge badge-${briefing.prioridade}`}>
          {briefing.prioridade}
        </span>
      </div>
      <h3 className="briefing-titulo">{briefing.titulo}</h3>
      <p className="briefing-contexto">{briefing.contexto}</p>
      <p className="briefing-implicacao">{briefing.implicacao}</p>
      
      {briefing.acao && (
        <div className="briefing-acao">
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          {briefing.acao}
        </div>
      )}
    </div>
  )
}
