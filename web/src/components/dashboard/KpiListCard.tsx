"use client";

import { ChatBubbleIcon, TargetIcon, LightningBoltIcon } from "@radix-ui/react-icons";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

const dataVolume = [{ v: 800 }, { v: 950 }, { v: 900 }, { v: 1050 }, { v: 1100 }, { v: 1150 }, { v: 1200 }];
const dataShare = [{ v: 30 }, { v: 31 }, { v: 29 }, { v: 28 }, { v: 29 }, { v: 28 }, { v: 28 }];
const dataOportunidades = [{ v: 20 }, { v: 25 }, { v: 22 }, { v: 30 }, { v: 35 }, { v: 40 }, { v: 45 }];

const kpis = [
  {
    name: "Discussões",
    value: "1.2k",
    change: "+12%",
    trend: "up",
    icon: ChatBubbleIcon,
    color: "text-blue-500",
    bg: "bg-blue-50",
    sparklineData: dataVolume,
    sparklineColor: "#3b82f6"
  },
  {
    name: "Share Fotus",
    value: "28%",
    change: "-2%",
    trend: "down",
    icon: TargetIcon,
    color: "text-emerald-500",
    bg: "bg-emerald-50",
    sparklineData: dataShare,
    sparklineColor: "#10b981"
  },
  {
    name: "Oportunidades",
    value: "45",
    change: "+8",
    trend: "up",
    icon: LightningBoltIcon,
    color: "text-purple-500",
    bg: "bg-purple-50",
    sparklineData: dataOportunidades,
    sparklineColor: "#a855f7"
  },
];

export function KpiListCard() {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col h-full justify-between gap-4">
      {kpis.map((kpi, index) => (
        <div key={kpi.name} className="flex items-center justify-between pb-4 border-b border-slate-100 last:border-0 last:pb-0 h-full">
          <div className="flex items-center gap-4">
            <div className={`p-2.5 rounded-xl ${kpi.bg}`}>
              <kpi.icon className={`w-5 h-5 ${kpi.color}`} />
            </div>
            <div className="flex flex-col justify-center">
              <h3 className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-0.5">
                {kpi.name}
              </h3>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-extrabold text-slate-900 tracking-tight leading-none">
                  {kpi.value}
                </span>
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${kpi.trend === 'up' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {kpi.change}
                </span>
              </div>
            </div>
          </div>
          
          <div className="w-16 h-8 opacity-60">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={kpi.sparklineData}>
                <defs>
                  <linearGradient id={`spark-${index}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={kpi.sparklineColor} stopOpacity={1} />
                    <stop offset="100%" stopColor={kpi.sparklineColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke={kpi.sparklineColor} strokeWidth={2} fill={`url(#spark-${index})`} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ))}
    </div>
  );
}
