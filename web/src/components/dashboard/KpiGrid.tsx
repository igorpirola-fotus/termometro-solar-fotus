"use client";

import { ActivityLogIcon, ChatBubbleIcon, TargetIcon, LightningBoltIcon } from "@radix-ui/react-icons";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

// Mock data para os sparklines
const dataTemperatura = [{ v: 75 }, { v: 78 }, { v: 80 }, { v: 82 }, { v: 80 }, { v: 83 }, { v: 84.2 }];
const dataVolume = [{ v: 800 }, { v: 950 }, { v: 900 }, { v: 1050 }, { v: 1100 }, { v: 1150 }, { v: 1200 }];
const dataShare = [{ v: 30 }, { v: 31 }, { v: 29 }, { v: 28 }, { v: 29 }, { v: 28 }, { v: 28 }];
const dataOportunidades = [{ v: 20 }, { v: 25 }, { v: 22 }, { v: 30 }, { v: 35 }, { v: 40 }, { v: 45 }];

const kpis = [
  {
    name: "Volume de Discussões",
    value: "1.2k",
    change: "+12%",
    trend: "up",
    icon: ChatBubbleIcon,
    color: "text-blue-500",
    bg: "bg-blue-50",
    sparklineData: dataVolume,
    sparklineColor: "#3b82f6" // blue-500
  },
  {
    name: "Share of Voice (Fotus)",
    value: "28%",
    change: "-2%",
    trend: "down",
    icon: TargetIcon,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    sparklineData: dataShare,
    sparklineColor: "#10b981" // emerald-500
  },
  {
    name: "Oportunidades Capturadas",
    value: "45",
    change: "+8",
    trend: "up",
    icon: LightningBoltIcon,
    color: "text-purple-500",
    bg: "bg-purple-50",
    sparklineData: dataOportunidades,
    sparklineColor: "#a855f7" // purple-500
  },
];

export function KpiGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 h-full">
      {kpis.map((kpi, index) => (
        <div
          key={kpi.name}
          className="relative bg-white rounded-2xl p-5 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] border border-slate-100 overflow-hidden group hover:shadow-[0_8px_24px_-8px_rgba(0,0,0,0.08)] transition-all duration-300"
        >
          {/* Sparkline Background */}
          <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20 pointer-events-none transition-opacity group-hover:opacity-30">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={kpi.sparklineData}>
                <defs>
                  <linearGradient id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={kpi.sparklineColor} stopOpacity={1} />
                    <stop offset="100%" stopColor={kpi.sparklineColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area 
                  type="monotone" 
                  dataKey="v" 
                  stroke={kpi.sparklineColor} 
                  strokeWidth={2}
                  fill={`url(#gradient-${index})`} 
                  isAnimationActive={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          <div className="flex justify-between items-start mb-4 relative z-10">
            <div className={`p-2 rounded-lg ${kpi.bg}`}>
              <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
            </div>
            <div
              className={`px-2 py-1 rounded-full text-[10px] font-bold tracking-wide ${
                kpi.trend === "up"
                  ? "bg-emerald-50 text-emerald-600"
                  : "bg-red-50 text-red-600"
              }`}
            >
              {kpi.change}
            </div>
          </div>
          
          <div className="relative z-10">
            <h3 className="text-slate-500 text-[11px] font-bold uppercase tracking-wider mb-1">
              {kpi.name}
            </h3>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-extrabold text-slate-900 tracking-tight">
                {kpi.value}
              </span>
              {kpi.format && (
                <span className="text-xl font-bold text-slate-400">
                  {kpi.format}
                </span>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
