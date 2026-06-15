"use client";

import { Recommendation } from "@/types/sector";

interface RecommendationCardProps {
  recommendation: Recommendation;
  rank: number;
}

const fmt = (n: number) =>
  n.toLocaleString("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });

export function RecommendationCard({ recommendation: rec, rank }: RecommendationCardProps) {
  const isMain = rank === 1;

  return (
    <div
      className={`rounded-xl p-5 border transition-all ${
        isMain
          ? "border-indigo-200 bg-indigo-50 ring-2 ring-indigo-100"
          : "border-slate-100 bg-white hover:border-slate-200"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className={`flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold ${
              isMain ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500"
            }`}
          >
            {rank}
          </span>
          <div>
            <p className="font-bold text-slate-800">{rec.stock.company_name}</p>
            <p className="text-xs text-slate-400 mt-0.5">
              {rec.stock.stock_code} · {rec.stock.sector}
            </p>
          </div>
        </div>
        <div className="text-right flex-shrink-0">
          <span className="inline-flex items-center gap-1 text-xs font-semibold bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full">
            +{rec.scoreImprovement}点
          </span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-lg bg-white/60 p-2">
          <p className="text-xs text-slate-400">推定コスト</p>
          <p className="font-bold text-slate-800 text-sm mt-0.5">{fmt(rec.estimatedCost)}</p>
          <p className="text-xs text-slate-400">100株単位</p>
        </div>
        <div className="rounded-lg bg-white/60 p-2">
          <p className="text-xs text-slate-400">現在株価</p>
          <p className="font-bold text-slate-800 text-sm mt-0.5">
            {rec.stock.current_price ? fmt(rec.stock.current_price) : "—"}
          </p>
        </div>
        <div className="rounded-lg bg-white/60 p-2">
          <p className="text-xs text-slate-400">配当利回り</p>
          <p className="font-bold text-emerald-600 text-sm mt-0.5">
            {rec.stock.dividend_yield ? `${rec.stock.dividend_yield.toFixed(1)}%` : "—"}
          </p>
        </div>
      </div>

      <p className="mt-3 text-xs text-slate-500 bg-white/60 rounded-lg px-3 py-2">
        {rec.reason}
      </p>
    </div>
  );
}
