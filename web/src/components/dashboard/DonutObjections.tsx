"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

interface ObjectionsData {
  name: string;
  value: number;
  color: string;
}

interface DonutObjectionsProps {
  data: ObjectionsData[];
}

export function DonutObjections({ data }: DonutObjectionsProps) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col">
      <div className="mb-4">
        <h2 className="text-[14px] font-bold text-slate-900">Distribuição de Atritos</h2>
        <p className="text-[11px] text-slate-500 mt-1">Principais objeções levantadas pelo mercado.</p>
      </div>

      <div className="flex-1 flex items-center justify-between min-h-[220px]">
        {/* Gráfico Donut */}
        <div className="w-[180px] h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={85}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  borderRadius: '12px',
                  border: '1px solid #e2e8f0',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                  padding: '8px 12px',
                  fontSize: '12px',
                  fontWeight: 600
                }}
                itemStyle={{ color: '#1e293b' }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Legenda Customizada Direita */}
        <div className="flex flex-col gap-4 pr-4">
          {data.map((item, i) => (
            <div key={i} className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-[12px] font-bold text-slate-600">{item.name}</span>
              </div>
              <span className="text-[12px] font-mono font-bold text-slate-900">{item.value}%</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-slate-900 border border-slate-800 px-3 py-2 rounded-lg shadow-xl flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: data.color }} />
        <span className="text-white text-[11px] font-medium">{data.name}</span>
        <span className="text-white text-[11px] font-bold font-mono ml-2">{data.value}%</span>
      </div>
    );
  }
  return null;
};
