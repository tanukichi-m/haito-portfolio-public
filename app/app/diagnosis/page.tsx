"use client";

import { useEffect, useState } from "react";
import { ScoreCard } from "@/components/ScoreCard";
import { PortfolioScoreResult, sectorMaster } from "@/lib/portfolioAnalyzer";

interface SectorData {
  sector: string; rank: string; ratio: number; targetRatio: number;
  maxRatio: number; weight: number; isDeficient: boolean; isOverweight: boolean;
}

interface DividendRatio { sector: string; ratio: number; }

interface DiagnosisData {
  score: PortfolioScoreResult;
  sectorRatios: SectorData[];
  dividendRatios: DividendRatio[];
  deficientSectors: string[];
  summary: { totalValue: number; totalDividend: number; totalCost: number };
}

const BUFFETT_CODE_MAP: Record<string, string> = {
  "水産・農林業": "https://www.buffett-code.com/industries/1",
  "鉱業": "https://www.buffett-code.com/industries/2",
  "建設業": "https://www.buffett-code.com/industries/3",
  "食料品": "https://www.buffett-code.com/industries/4",
  "繊維製品": "https://www.buffett-code.com/industries/5",
  "パルプ・紙": "https://www.buffett-code.com/industries/6",
  "化学": "https://www.buffett-code.com/industries/7",
  "医薬品": "https://www.buffett-code.com/industries/8",
  "石油・石炭製品": "https://www.buffett-code.com/industries/9",
  "ゴム製品": "https://www.buffett-code.com/industries/10",
  "ガラス・土石製品": "https://www.buffett-code.com/industries/11",
  "鉄鋼": "https://www.buffett-code.com/industries/12",
  "非鉄金属": "https://www.buffett-code.com/industries/13",
  "金属製品": "https://www.buffett-code.com/industries/14",
  "機械": "https://www.buffett-code.com/industries/15",
  "電気機器": "https://www.buffett-code.com/industries/16",
  "輸送用機器": "https://www.buffett-code.com/industries/17",
  "精密機器": "https://www.buffett-code.com/industries/18",
  "その他製品": "https://www.buffett-code.com/industries/19",
  "電力・ガス業": "https://www.buffett-code.com/industries/20",
  "陸運業": "https://www.buffett-code.com/industries/21",
  "海運業": "https://www.buffett-code.com/industries/22",
  "空運業": "https://www.buffett-code.com/industries/23",
  "倉庫・運輸関連業": "https://www.buffett-code.com/industries/24",
  "情報・通信業": "https://www.buffett-code.com/industries/25",
  "卸売業": "https://www.buffett-code.com/industries/26",
  "小売業": "https://www.buffett-code.com/industries/27",
  "銀行業": "https://www.buffett-code.com/industries/28",
  "証券・商品先物取引業": "https://www.buffett-code.com/industries/29",
  "保険業": "https://www.buffett-code.com/industries/30",
  "その他金融業": "https://www.buffett-code.com/industries/31",
  "不動産業": "https://www.buffett-code.com/industries/32",
  "サービス業": "https://www.buffett-code.com/industries/33",
  "REIT": "https://www.buffett-code.com/industries/34",
};

export default function DiagnosisPage() {
  const [data, setData] = useState<DiagnosisData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/score")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
      </div>
    );
  }

  const SCORE_ITEMS = [
    { label: "業種重要度", desc: "重要業種をどれだけカバーしているか（35点）", max: 35, val: data?.score.importanceScore },
    { label: "コンプリート率", desc: "全業種のカバー率（20点）", max: 20, val: data?.score.completionScore },
    { label: "集中リスク", desc: "1業種への過度な集中がないか（20点）", max: 20, val: data?.score.concentrationScore },
    { label: "配当分散", desc: "配当が特定業種に偏っていないか（20点）", max: 20, val: data?.score.dividendRiskScore },
    { label: "REIT保有", desc: "REIT（不動産投資信託）の保有（5点）", max: 5, val: data?.score.reitScore },
  ];

  const allSectors = sectorMaster.map((master) => {
    const actual = data?.sectorRatios.find((s) => s.sector === master.sectorName);
    return {
      sector: master.sectorName,
      rank: master.rank,
      ratio: actual?.ratio || 0,
      targetRatio: master.targetRatio,
      maxRatio: master.maxRatio,
      weight: master.weight,
      isDeficient: (actual?.ratio || 0) < master.targetRatio * 0.5,
      isOverweight: (actual?.ratio || 0) > master.maxRatio,
      hasHolding: (actual?.ratio || 0) > 0,
    };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">診断結果</h1>
        <p className="text-slate-400 text-sm mt-1">5軸スコアによるポートフォリオ評価</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {data && <ScoreCard score={data.score} />}
        <div className="bg-white rounded-2xl border border-slate-100 p-6 space-y-4">
          <h2 className="font-bold text-slate-800">スコアの内訳</h2>
          <div className="space-y-2 text-sm">
            {SCORE_ITEMS.map((item) => (
              <div key={item.label} className="flex items-start gap-3 p-3 rounded-xl bg-slate-50">
                <div className="flex-1">
                  <p className="font-semibold text-slate-800">{item.label}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{item.desc}</p>
                </div>
                <span className="font-black text-slate-700 text-lg whitespace-nowrap">
                  {item.val ?? 0}
                  <span className="text-xs text-slate-400 font-normal">/{item.max}</span>
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="font-bold text-slate-800 mb-4">全業種カバー状況</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {allSectors.map((s) => {
            const barPct = s.maxRatio > 0 ? Math.min((s.ratio / s.maxRatio) * 100, 100) : 0;
            let statusLabel = "未保有";
            let statusColor = "bg-slate-100 text-slate-400";
            let barColor = "bg-slate-200";
            if (s.isOverweight) {
              statusLabel = "過剰"; statusColor = "bg-red-100 text-red-600"; barColor = "bg-red-400";
            } else if (s.isDeficient && s.hasHolding) {
              statusLabel = "不足"; statusColor = "bg-amber-100 text-amber-700"; barColor = "bg-amber-400";
            } else if (s.hasHolding) {
              statusLabel = "適正"; statusColor = "bg-emerald-100 text-emerald-700"; barColor = "bg-emerald-500";
            }
            return (
              <div key={s.sector} className="rounded-xl border border-slate-100 p-3 space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className={`text-xs px-1.5 py-0.5 rounded font-bold flex-shrink-0 ${
                      s.rank === "A" ? "bg-indigo-100 text-indigo-700" :
                      s.rank === "B" ? "bg-blue-100 text-blue-700" :
                      "bg-slate-100 text-slate-500"
                    }`}>{s.rank}</span>
                    {BUFFETT_CODE_MAP[s.sector] ? (
                      <a href={BUFFETT_CODE_MAP[s.sector]} target="_blank" rel="noopener noreferrer"
                        className="text-sm font-semibold text-indigo-600 hover:text-indigo-800 hover:underline truncate transition-colors">
                        {s.sector} 🔗
                      </a>
                    ) : (
                      <span className="text-sm font-semibold text-slate-800 truncate">{s.sector}</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor}`}>{statusLabel}</span>
                    <span className="text-sm font-bold text-slate-700">{s.ratio.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${barColor}`} style={{ width: `${barPct}%` }} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-400">
                    <span>目標 {s.targetRatio}%</span>
                    <span>上限 {s.maxRatio}%</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {data && data.deficientSectors.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6">
          <h2 className="font-bold text-amber-800 mb-3">不足業種（優先度順）</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {data.deficientSectors.slice(0, 9).map((sector, i) => (
              <div key={sector} className="flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-200 text-amber-800 text-xs font-bold flex items-center justify-center flex-shrink-0">{i + 1}</span>
                {BUFFETT_CODE_MAP[sector] ? (
                  <a href={BUFFETT_CODE_MAP[sector]} target="_blank" rel="noopener noreferrer"
                    className="text-amber-900 font-medium text-sm hover:underline">{sector} 🔗</a>
                ) : (
                  <span className="text-amber-900 font-medium text-sm">{sector}</span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {data && data.dividendRatios.length > 0 && (
        <div className="bg-white rounded-2xl border border-slate-100 p-6">
          <h2 className="font-bold text-slate-800 mb-4">業種別配当比率</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {data.dividendRatios.sort((a, b) => b.ratio - a.ratio).map((d) => (
              <div key={d.sector} className="space-y-1">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-700">{d.sector}</span>
                  <span className={`font-semibold ${d.ratio > 40 ? "text-red-500" : d.ratio > 30 ? "text-amber-500" : "text-slate-700"}`}>
                    {d.ratio.toFixed(1)}%
                    {d.ratio > 40 && <span className="text-xs ml-1 text-red-400">集中注意</span>}
                  </span>
                </div>
                <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full ${d.ratio > 40 ? "bg-red-400" : d.ratio > 30 ? "bg-amber-400" : "bg-indigo-400"}`}
                    style={{ width: `${Math.min(d.ratio, 100)}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
