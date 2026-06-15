"use client";

import { PortfolioScoreResult } from "@/lib/portfolioAnalyzer";

interface ScoreCardProps {
  score: PortfolioScoreResult;
}

const scoreColor = (total: number) => {
  if (total >= 85) return { ring: "ring-emerald-400", bg: "bg-emerald-50", text: "text-emerald-700", bar: "bg-emerald-500" };
  if (total >= 70) return { ring: "ring-blue-400",   bg: "bg-blue-50",    text: "text-blue-700",    bar: "bg-blue-500"    };
  if (total >= 55) return { ring: "ring-amber-400",  bg: "bg-amber-50",   text: "text-amber-700",   bar: "bg-amber-500"   };
  return             { ring: "ring-red-400",    bg: "bg-red-50",     text: "text-red-700",     bar: "bg-red-500"     };
};

const SubScore = ({
  label, value, max, barColor,
}: {
  label: string; value: number; max: number; barColor: string;
}) => (
  <div className="space-y-1">
    <div className="flex justify-between text-sm">
      <span className="text-slate-600">{label}</span>
      <span className="font-semibold text-slate-800">
        {value}<span className="text-slate-400 font-normal">/{max}点</span>
      </span>
    </div>
    <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
      <div
        className={`h-full rounded-full transition-all duration-700 ${barColor}`}
        style={{ width: `${Math.min((value / max) * 100, 100)}%` }}
      />
    </div>
  </div>
);

export function ScoreCard({ score }: ScoreCardProps) {
  const colors = scoreColor(score.totalScore);

  return (
    <div className={`rounded-2xl ring-2 ${colors.ring} ${colors.bg} p-6 space-y-5`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium tracking-widest text-slate-500 uppercase">総合スコア</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-5xl font-black ${colors.text}`}>{score.totalScore}</span>
            <span className="text-slate-400 text-lg">/ 100</span>
          </div>
        </div>
        <div className={`px-4 py-2 rounded-xl text-sm font-bold ${colors.text} bg-white/60 ring-1 ${colors.ring}`}>
          {score.label}
        </div>
      </div>

      <div className="space-y-3 pt-2 border-t border-white/60">
        <SubScore label="業種重要度"     value={score.importanceScore}    max={35} barColor={colors.bar} />
        <SubScore label="コンプリート率" value={score.completionScore}    max={20} barColor={colors.bar} />
        <SubScore label="集中リスク"     value={score.concentrationScore} max={20} barColor={colors.bar} />
        <SubScore label="配当分散"       value={score.dividendRiskScore}  max={20} barColor={colors.bar} />
        <SubScore label="REIT保有"       value={score.reitScore}          max={5}  barColor={colors.bar} />
      </div>
    </div>
  );
}
