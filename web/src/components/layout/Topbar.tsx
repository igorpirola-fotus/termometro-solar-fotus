"use client";

import { HamburgerMenuIcon, MagnifyingGlassIcon, BellIcon, ChevronLeftIcon, ChevronRightIcon, CalendarIcon } from "@radix-ui/react-icons";

interface TopbarProps {
  onMenuClick: () => void;
}

export function Topbar({ onMenuClick }: TopbarProps) {
  return (
    <header className="fixed top-0 left-0 right-0 h-14 bg-white/90 backdrop-blur-md border-b border-slate-200 flex items-center px-4 z-[60]">
      <button
        onClick={onMenuClick}
        className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors mr-3 md:hidden"
      >
        <HamburgerMenuIcon className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-3">
        <div className="w-7 h-7 rounded bg-amber-500 flex items-center justify-center p-1 shadow-sm">
          <div className="w-full h-full border border-white/30 rounded-[2px]"></div>
        </div>
        <div className="flex flex-col leading-none">
          <span className="font-mono text-[11px] font-bold text-slate-900 tracking-wider">
            TERMÔMETRO DO MERCADO
          </span>
          <span className="text-[9px] text-slate-500 tracking-wider mt-0.5 font-medium">
            FOTUS SOLAR
          </span>
        </div>
      </div>

      <div className="hidden md:flex flex-col ml-8 border-l border-slate-200 pl-8">
        <div className="flex items-center gap-3 mb-0.5">
          <h1 className="text-[14px] font-bold text-slate-900 tracking-tight">
            Visão Geral do Mercado
          </h1>
          <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-[9px] text-slate-600 font-bold shadow-sm">
            <CalendarIcon className="w-3 h-3 text-slate-500" />
            HOJE
          </div>
        </div>
        <span className="text-[10px] text-slate-500 font-medium">
          Últimas 24h (Grupos de Integração)
        </span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        <div className="hidden sm:flex items-center gap-1 mr-4">
          <button className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all">
            <ChevronLeftIcon className="w-4 h-4" />
          </button>
          <div className="px-2 text-center min-w-[60px]">
            <div className="text-[11px] font-bold text-slate-700">05 Jun</div>
          </div>
          <button className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-slate-200 shadow-sm text-slate-500 disabled:opacity-40" disabled>
            <ChevronRightIcon className="w-4 h-4" />
          </button>
        </div>
        
        <button className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
          <MagnifyingGlassIcon className="w-4 h-4" />
        </button>
        <button className="w-8 h-8 flex items-center justify-center rounded-md text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors">
          <BellIcon className="w-4 h-4" />
        </button>

        <button className="hidden sm:flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white px-3 py-1.5 rounded text-[11px] font-bold transition-colors ml-2 shadow-md">
          Exportar PDF
        </button>
      </div>
    </header>
  );
}
