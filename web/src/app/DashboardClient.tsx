"use client"

import { useState } from 'react'
import { BriefingCard } from '@/components/BriefingCard'
import { KpiCard } from '@/components/KpiCard'
import { RadarCard } from '@/components/RadarCard'

export function DashboardClient({ initialData }: { initialData: any }) {
  // Controle de Abas para o Mobile
  const [activeTab, setActiveTab] = useState<'resumo' | 'radares' | 'concorrencia'>('resumo')

  const briefing = initialData?.briefing_executivo || []
  const kpis = initialData?.kpis || {}
  const radar = initialData?.radar_portfolio || []

  // 0. Bloco de KPIs Principais
  const KpisGrid = () => (
    <section className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
      <KpiCard title="Score do Mercado" kpiData={kpis.score} />
      <KpiCard title="Mensagens Lidas" kpiData={kpis.mensagens} />
      <KpiCard title="Grupos Ativos" kpiData={kpis.grupos} />
      <KpiCard title="Alertas Concorrentes" kpiData={kpis.concorrentes} />
    </section>
  )

  // 1. Bloco de Resumo (Reusado no Desktop e Mobile)
  const ResumoContent = () => (
    <section className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-xs font-bold text-[var(--hint)] uppercase tracking-[0.1em] mb-2 flex items-center gap-2">
        Briefing Executivo
        <div className="flex-1 h-[1px] bg-[var(--border)]"></div>
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {briefing.map((item: any, i: number) => (
          <BriefingCard key={i} briefing={item} />
        ))}
      </div>
    </section>
  )

  // 2. Bloco de Radares
  const RadaresContent = () => (
    <section className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-xs font-bold text-[var(--hint)] uppercase tracking-[0.1em] mb-2 flex items-center gap-2">
        Radar de Portfólio Fotus
        <div className="flex-1 h-[1px] bg-[var(--border)]"></div>
      </h2>
      <div className="p-4 bg-[var(--surface)] rounded-2xl border border-[var(--border)] shadow-sm">
        <RadarCard items={radar} />
      </div>
    </section>
  )

  // 3. Bloco de Concorrência
  const ConcorrenciaContent = () => (
    <section className="flex flex-col gap-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <h2 className="text-xs font-bold text-[var(--hint)] uppercase tracking-[0.1em] mb-2 flex items-center gap-2">
        Movimentação da Concorrência
        <div className="flex-1 h-[1px] bg-[var(--border)]"></div>
      </h2>
      <div className="p-6 bg-[var(--surface)] rounded-2xl border border-[var(--border)] text-[var(--muted)] text-sm font-light">
        Matriz de Sinais e Distribuidores (Em construção...)
      </div>
    </section>
  )

  return (
    <div className="w-full max-w-[1600px] mx-auto p-4 lg:p-8">
      
      {/* --- VISÃO DESKTOP (Mosaico Panorâmico) --- */}
      {/* hidden no mobile, vira grid em telas grandes (lg) */}
      <div className="hidden lg:grid grid-cols-1 gap-12">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[var(--text)] tracking-tight">O Termômetro Solar</h1>
          <p className="text-[var(--muted)] text-sm font-light">Visão panorâmica do mercado B2B.</p>
        </div>
        
        <KpisGrid />
        <ResumoContent />
        
        <div className="grid grid-cols-2 gap-8">
          <RadaresContent />
          <ConcorrenciaContent />
        </div>
      </div>

      {/* --- VISÃO MOBILE (Abas) --- */}
      {/* block no mobile, esconde em telas grandes (lg) */}
      <div className="block lg:hidden pb-24 pt-4">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-[var(--text)] tracking-tight">O Termômetro</h1>
        </div>

        <KpisGrid />

        {/* Renderiza apenas a aba selecionada */}
        {activeTab === 'resumo' && <ResumoContent />}
        {activeTab === 'radares' && <RadaresContent />}
        {activeTab === 'concorrencia' && <ConcorrenciaContent />}
        
        {/* Navigation Bar (Fixa no rodapé) */}
        <nav className="fixed bottom-0 left-0 right-0 h-16 bg-[var(--surface)]/80 backdrop-blur-xl border-t border-[var(--border)] flex justify-around items-center px-2 z-50">
          <button 
            onClick={() => setActiveTab('resumo')}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeTab === 'resumo' ? 'text-[var(--amber)]' : 'text-[var(--muted)]'}`}
          >
            <span className="text-xs font-semibold mt-1 tracking-wide">Resumo</span>
          </button>
          <button 
            onClick={() => setActiveTab('radares')}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeTab === 'radares' ? 'text-[var(--amber)]' : 'text-[var(--muted)]'}`}
          >
            <span className="text-xs font-semibold mt-1 tracking-wide">Radares</span>
          </button>
          <button 
            onClick={() => setActiveTab('concorrencia')}
            className={`flex flex-col items-center justify-center w-full h-full transition-colors ${activeTab === 'concorrencia' ? 'text-[var(--amber)]' : 'text-[var(--muted)]'}`}
          >
            <span className="text-xs font-semibold mt-1 tracking-wide">Mercado</span>
          </button>
        </nav>
      </div>
    </div>
  )
}
