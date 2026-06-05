"use client";

import { DotsHorizontalIcon } from "@radix-ui/react-icons";

interface MiniKpiProps {
  value: string | number;
  trend: string;
  trendUp: boolean;
}

interface ThermometerCardProps {
  value: number;
  trendText: string;
  metrics: {
    volume: MiniKpiProps;
    share: MiniKpiProps;
    oportunidades: MiniKpiProps;
  };
}

export function ThermometerCard({ value, trendText, metrics }: ThermometerCardProps) {
  const totalTicks = 24; // Número de tracinhos
  const activeTicks = Math.round((value / 100) * totalTicks);

  // Labels ao redor do gráfico (0, 25, 50, 75, 100)
  const labels = [
    { label: "0", angle: 0 },
    { label: "25", angle: 45 },
    { label: "50", angle: 90 },
    { label: "75", angle: 135 },
    { label: "100", angle: 180 },
  ];

  return (
    <div className="bg-white rounded-2xl p-6 shadow-[0_2px_12px_-4px_rgba(0,0,0,0.05)] border border-slate-100 flex flex-col items-center justify-between h-full relative">
      <div className="w-full flex items-start justify-between mb-2">
        <div>
          <h2 className="text-[15px] font-extrabold text-slate-900 tracking-tight">Termômetro</h2>
          <p className="text-[11px] text-slate-500 mt-0.5 font-medium">Temperatura térmica do mercado</p>
        </div>
        <button className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400 transition-colors">
          <DotsHorizontalIcon />
        </button>
      </div>

      {/* SVG Gauge Container */}
      <div className="relative w-full aspect-[2/1] mt-8 mb-4 max-w-[280px]">
        <svg viewBox="0 0 200 120" className="w-full h-full overflow-visible">
          {/* Ticks */}
          {Array.from({ length: totalTicks }).map((_, i) => {
            // angle de 0 a 180 (Esquerda para Direita)
            const angle = (i * 180) / (totalTicks - 1);
            const isActive = i <= activeTicks;
            
            return (
              <line
                key={i}
                x1="20"
                y1="100"
                x2="45" // Comprimento do tick
                y2="100"
                stroke={isActive ? "#0f172a" : "#f1f5f9"} // slate-900 vs slate-100
                strokeWidth="5"
                strokeLinecap="round"
                transform={`rotate(${angle}, 100, 100)`}
                className="transition-all duration-700 ease-out"
              />
            );
          })}

          {/* Labels Numericos (0, 25, 50...) */}
          {labels.map((item, i) => {
            // Posicionar usando trigonometria
            const rad = (item.angle * Math.PI) / 180;
            // Raio maior que os ticks (R = 80, labels = R=95)
            const r = 95;
            const cx = 100;
            const cy = 100;
            // Angulo 0 é esquerda (x=5), 180 é direita (x=195)
            const x = cx - r * Math.cos(rad);
            const y = cy - r * Math.sin(rad);

            return (
              <text
                key={i}
                x={x}
                y={y}
                textAnchor="middle"
                alignmentBaseline="middle"
                className="text-[9px] font-bold fill-slate-400"
              >
                {item.label}
              </text>
            );
          })}
        </svg>

        {/* Texto Central - sem fundo branco para não cortar os traços */}
        <div className="absolute bottom-[5px] left-1/2 -translate-x-1/2 flex flex-col items-center">
          <span className="text-4xl font-black text-slate-900 tracking-tighter leading-none mb-1">
            {value.toFixed(1)}<span className="text-xl text-slate-400">°</span>
          </span>
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            Temperatura
          </span>
        </div>
      </div>

      {/* Mini KPIs injetados no Termômetro */}
      <div className="grid grid-cols-3 gap-2 w-full mt-4 mb-4">
        <div className="flex flex-col items-center justify-center bg-slate-50/50 rounded-lg py-2 border border-slate-100">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Volume</span>
          <span className="text-[13px] font-extrabold text-slate-900 leading-none">{metrics.volume.value}</span>
          <span className={`text-[8px] font-bold mt-0.5 ${metrics.volume.trendUp ? 'text-emerald-600' : 'text-red-600'}`}>{metrics.volume.trend}</span>
        </div>
        <div className="flex flex-col items-center justify-center bg-slate-50/50 rounded-lg py-2 border border-slate-100">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Share</span>
          <span className="text-[13px] font-extrabold text-slate-900 leading-none">{metrics.share.value}</span>
          <span className={`text-[8px] font-bold mt-0.5 ${metrics.share.trendUp ? 'text-emerald-600' : 'text-red-600'}`}>{metrics.share.trend}</span>
        </div>
        <div className="flex flex-col items-center justify-center bg-slate-50/50 rounded-lg py-2 border border-slate-100">
          <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Oport.</span>
          <span className="text-[13px] font-extrabold text-slate-900 leading-none">{metrics.oportunidades.value}</span>
          <span className={`text-[8px] font-bold mt-0.5 ${metrics.oportunidades.trendUp ? 'text-emerald-600' : 'text-red-600'}`}>{metrics.oportunidades.trend}</span>
        </div>
      </div>

      {/* Pill Badge de Status */}
      <div className="w-full bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl text-center">
        <span className="text-[11px] font-bold text-slate-700">
          {trendText}
        </span>
      </div>
    </div>
  );
}
