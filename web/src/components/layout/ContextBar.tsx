"use client";

import { cn } from "@/lib/utils";
import { CalendarIcon, ChevronLeftIcon, ChevronRightIcon } from "@radix-ui/react-icons";

interface ContextBarProps {
  isSidebarCollapsed?: boolean;
}

export function ContextBar({ isSidebarCollapsed }: ContextBarProps) {
  return (
    <div 
      className={cn(
        "fixed top-14 left-0 right-0 h-12 bg-white/80 backdrop-blur-md border-b border-slate-200 flex items-center px-4 gap-4 z-40 transition-all duration-300",
        isSidebarCollapsed ? "md:left-16" : "md:left-64"
      )}
    >
      <div className="flex flex-col pl-2 md:pl-4">
        <h1 className="text-[14px] font-bold text-slate-900 tracking-tight">
          Visão Geral do Mercado
        </h1>
        <span className="text-[10px] text-slate-500 font-medium hidden sm:inline-block">
          Últimas 24h (Grupos de Integração)
        </span>
      </div>

      <div className="h-4 w-px bg-slate-200 mx-2 hidden sm:block" />

      <div className="hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-100 border border-slate-200 text-[10px] text-slate-600 font-bold shadow-sm">
        <CalendarIcon className="w-3 h-3 text-slate-500" />
        HOJE
      </div>

      <div className="ml-auto flex items-center gap-1">
        <button className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all">
          <ChevronLeftIcon className="w-4 h-4" />
        </button>
        <div className="px-3 text-center min-w-[70px]">
          <div className="text-[11px] font-bold text-slate-700">
            05 Jun
          </div>
        </div>
        <button className="w-7 h-7 flex items-center justify-center rounded-md bg-white border border-slate-200 shadow-sm text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all disabled:opacity-40 disabled:hover:bg-white disabled:hover:text-slate-500" disabled>
          <ChevronRightIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
