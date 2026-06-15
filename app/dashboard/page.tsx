"use client";

import { useEffect, useState } from "react";
import { PortfolioSummary } from "@/components/PortfolioSummary";
import { ScoreCard } from "@/components/ScoreCard";
import { SectorDonutChart, HoldingDonutChart, CyclicalDonutChart } from "@/components/SectorPieChart";
import { PortfolioScoreResult } from "@/lib/portfolioAnalyzer";
import Link from "next/link";

interface SectorData {
  sector: string; ratio: number; targetRatio: number; maxRatio: number;
  isDeficient: boolean; isOverweight: boolean;
}

interface HoldingData {
  id: string;
  company_name: string;
  stock_code: string;
  sector: string;
  shares: number;
  current_price: number;
  current_value: number;
  annual_dividend: number;
  annual_dividend_total: number;
}

interface DashboardData {
  score: PortfolioScoreResult;
  sectorRatios: SectorData[];
  summary: {
    totalValue: number;
    totalDividend: number;
    totalDividendAfterTax: number;
    totalCost: number;
    totalGainLoss: number;
    costYield: number;
    costYieldAfterTax: number;
  };
  holdingCount: number;
  holdings: HoldingData[];
}

export default function DashboardPage() {
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/score").then((r) => r.json()),
      fetch("/api/holdings").then((r) => r.json()),
    ])
      .then(([scoreData, holdings]) => {
        setData({
          ...scoreData,
          holdingCount: Array.isArray(holdings) ? holdings.length : 0,
          holdings: Array.isArray(holdings) ? holdings : [],
        });
      })
      .catch(() => setError("データの読み込みに失敗しました"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-slate-400 text-sm mt-3">データを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl bg-red-50 border border-red-100 p-6 text-center">
        <p className="text-red-600">{error}</p>
        <button onClick={() => window.location.reload()} className="mt-3 text-sm text-red-500 underline">
          再読み込み
        </button>
      </div>
    );
  }

  const totalValue            = data?.summary.totalValue || 0;
  const totalCost             = data?.summary.totalCost || 0;
  const totalGainLoss         = data?.summary.totalGainLoss || 0;
  const totalDividend         = data?.summary.totalDividend || 0;
  const totalDividendAfterTax = data?.summary.totalDividendAfterTax || 0;
  const dividendYield         = totalValue > 0 ? (totalDividend / totalValue) * 100 : 0;
  const dividendYieldAfterTax = totalValue > 0 ? (totalDividendAfterTax / totalValue) * 100 : 0;
  const costYield             = data?.summary.costYield || 0;
  const costYieldAfterTax     = data?.summary.costYieldAfterTax || 0;

  // 業種別配当合計
  const sectorDividendMap = new Map<string, number>();
  (data?.holdings || []).forEach((h) => {
    sectorDividendMap.set(
      h.sector,
      (sectorDividendMap.get(h.sector) || 0) + (h.annual_dividend_total || 0)
    );
  });

  // 業種構成比データ
  const sectorRatiosForChart = (data?.sectorRatios || [])
    .filter((s) => s.ratio > 0)
    .map((s) => ({
      sector: s.sector,
      ratio: s.ratio,
      annualDividend: sectorDividendMap.get(s.sector) || 0,
    }));

  // 銘柄別構成比データ
  const holdingRatiosForChart = (data?.holdings || [])
    .filter((h) => h.current_value > 0)
    .map((h) => ({
      name: h.company_name,
      code: h.stock_code,
      ratio: totalValue > 0 ? (h.current_value / totalValue) * 100 : 0,
      annualDividend: h.annual_dividend_total || 0,
    }))
    .sort((a, b) => b.ratio - a.ratio);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">ダッシュボード</h1>
        <p className="text-slate-400 text-sm mt-1">ポートフォリオの総合状況</p>
      </div>

      {data && (
        <>
          <PortfolioSummary
            totalValue={totalValue}
            totalCost={totalCost}
            totalGainLoss={totalGainLoss}
            totalDividend={totalDividend}
            totalDividendAfterTax={totalDividendAfterTax}
            holdingCount={data.holdingCount}
            dividendYield={dividendYield}
            dividendYieldAfterTax={dividendYieldAfterTax}
            costYield={costYield}
            costYieldAfterTax={costYieldAfterTax}
          />

          {data.holdingCount > 0 && (
            <>
              {/* 行1: スコアカード + 業種構成ドーナツ */}
              <div className="grid gap-6 lg:grid-cols-2">
                <ScoreCard score={data.score} />
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                  <div className="flex items-center justify-between mb-2">
                    <h2 className="font-bold text-slate-800">業種構成</h2>
                    <Link href="/diagnosis" className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors">
                      詳細 →
                    </Link>
                  </div>
                  <SectorDonutChart sectorRatios={sectorRatiosForChart} />
                </div>
              </div>

              {/* 行2: 銘柄別構成ドーナツ + 景気感応度ドーナツ */}
              <div className="grid gap-6 lg:grid-cols-2">
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                  <h2 className="font-bold text-slate-800 mb-2">銘柄別構成</h2>
                  <HoldingDonutChart holdingRatios={holdingRatiosForChart} />
                </div>
                <div className="bg-white rounded-2xl border border-slate-100 p-6">
                  <h2 className="font-bold text-slate-800 mb-2">景気感応度別構成</h2>
                  <CyclicalDonutChart sectorRatios={sectorRatiosForChart} />
                </div>
              </div>
            </>
          )}

          {data.holdingCount === 0 && (
            <div className="rounded-xl bg-indigo-50 border border-indigo-100 p-6 text-center">
              <p className="text-lg mb-1">🚀</p>
              <p className="font-semibold text-indigo-800">まずは銘柄を登録しましょう</p>
              <p className="text-sm text-indigo-600 mt-1">保有している高配当株を登録すると、ポートフォリオ分析が始まります</p>
              <Link
                href="/holdings"
                className="inline-block mt-4 bg-indigo-600 text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 transition-colors"
              >
                銘柄を登録する
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}