"use client";

import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip, CartesianGrid, Cell } from "recharts";

interface RankingData {
  name: string;
  fotus: number;
  mercado: number;
}

interface BrandsRankingProps {
  data: RankingData[];
}

export function BrandsRanking({ data }: BrandsRankingProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col h-full">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-[14px] font-bold text-slate-900">Força Relativa (Atributos)</h2>
          <p className="text-[11px] text-slate-500 mt-1">Comparativo direto de percepção de valor.</p>
        </div>
        <div className="flex items-center gap-3 mt-1">
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

      <div className="flex-1 min-h-[220px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }} barGap={2} barCategoryGap="25%">
            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
            <XAxis 
              type="number" 
              hide 
              domain={[0, 100]}
            />
            <YAxis 
              dataKey="name" 
              type="category" 
              axisLine={false} 
              tickLine={false} 
              tick={{ fontSize: 11, fill: '#64748b', fontWeight: 600 }}
              width={70}
            />
            <Tooltip 
              cursor={{ fill: '#f8fafc' }}
              contentStyle={{ 
                borderRadius: '12px',
                border: '1px solid #e2e8f0',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                padding: '12px',
                fontSize: '12px',
                fontWeight: 600
              }}
            />
            <Bar dataKey="fotus" fill="#f59e0b" radius={[0, 4, 4, 0]} barSize={12} />
            <Bar dataKey="mercado" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={12} />
          </BarChart>
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
