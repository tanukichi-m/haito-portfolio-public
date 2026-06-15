"use client";

import { SectorScore } from "@/types/score";

interface SectorChartProps {
  sectorScores: SectorScore[];
}

export function SectorChart({ sectorScores }: SectorChartProps) {
  const active = sectorScores
    .filter((s) => s.ratio > 0 || s.isDeficient)
    .sort((a, b) => b.ratio - a.ratio)
    .slice(0, 12);

  if (active.length === 0) {
    return (
      <div className="flex items-center justify-center h-32 text-slate-400 text-sm">
        銘柄を登録すると業種分析が表示されます
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {active.map((s) => {
        const pct = (s.ratio * 100).toFixed(1);
        const target = (s.targetRatio * 100).toFixed(0);
        const barPct = Math.min(s.ratio / s.maxRatio, 1) * 100;

        let barColor = "bg-indigo-500";
        let label = "";
        if (s.isOverweight) { barColor = "bg-red-400"; label = "過剰"; }
        else if (s.isDeficient) { barColor = "bg-amber-300"; label = "不足"; }
        else if (s.ratio > 0) { label = "適正"; }
        else { barColor = "bg-slate-200"; label = "未保有"; }

        return (
          <div key={s.sector} className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-slate-700 font-medium">{s.sector}</span>
              <div className="flex items-center gap-2">
                {label && (
                  <span
                    className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                      s.isOverweight
                        ? "bg-red-100 text-red-600"
                        : s.isDeficient
                        ? "bg-amber-100 text-amber-700"
                        : s.ratio > 0
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {label}
                  </span>
                )}
                <span className="text-slate-500">
                  {pct}%
                  <span className="text-slate-300 text-xs"> / 目標{target}%</span>
                </span>
              </div>
            </div>
            <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${barColor}`}
                style={{ width: `${barPct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
