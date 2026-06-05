"use client";

import { useState, useMemo } from "react";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { cn } from "@/lib/utils";

interface TrendDataPoint {
  name: string;
  fotus: number;
  mercado: number;
}

interface TrendChartProps {
  data: TrendDataPoint[];
}

export function TrendChart({ data }: TrendChartProps) {
  const [period, setPeriod] = useState<"24H" | "7D" | "30D">("7D");

  const filteredData = useMemo(() => {
    if (!data || data.length === 0) return [];
    if (period === "24H") return data.slice(-1);
    if (period === "7D") return data.slice(-7);
    return data;
  }, [period, data]);

  return (
    <div className="bg-white rounded-2xl p-6 mb-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] border border-slate-100">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h2 className="text-[15px] font-extrabold text-slate-900 tracking-tight">Tendência de Discussões</h2>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">
            Volume de menções: Portfólio Fotus vs Concorrência.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex bg-slate-100/80 p-0.5 rounded-lg border border-slate-200">
            {(["24H", "7D", "30D"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setPeriod(t)}
                className={cn(
                  "px-3 py-1 text-[10px] font-bold rounded-md transition-all",
                  period === t 
                    ? "bg-white text-slate-900 shadow-sm" 
                    : "text-slate-500 hover:text-slate-700"
                )}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3 ml-2">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-[10px] font-bold text-slate-600">Portfólio Fotus</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[10px] font-bold text-slate-600">Mercado</span>
            </div>
          </div>
        </div>
      </div>

      <div className="h-[220px] w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={filteredData} margin={{ top: 10, right: 0, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="fotusGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="mercadoGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
            <XAxis 
              dataKey="name" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
              dy={10}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 10, fill: '#64748b', fontWeight: 500 }}
              tickCount={5}
            />
            <Tooltip 
              contentStyle={{ 
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                padding: '12px',
                fontSize: '12px',
                fontWeight: 600
              }}
              cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
            />
            <Area 
              type="monotone" 
              dataKey="mercado" 
              stroke="#3b82f6" 
              strokeWidth={2}
              fill="url(#mercadoGradient)" 
              activeDot={{ r: 4, strokeWidth: 2, fill: '#fff' }}
            />
            <Area 
              type="monotone" 
              dataKey="fotus" 
              stroke="#f59e0b" 
              strokeWidth={3}
              fill="url(#fotusGradient)" 
              activeDot={{ r: 5, strokeWidth: 0 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-slate-900 border border-slate-800 p-3 rounded-lg shadow-xl">
        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider mb-2">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center justify-between gap-6 mb-1 last:mb-0">
            <div className="flex items-center gap-2">
              <div 
                className="w-1.5 h-1.5 rounded-full" 
                style={{ backgroundColor: entry.color }}
              />
              <span className="text-slate-300 text-[12px] font-medium capitalize">
                {entry.name}
              </span>
            </div>
            <span className="text-white font-mono font-bold text-[12px]">
              {entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};
