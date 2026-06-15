"use client";

import { useEffect, useState } from "react";
import { RecommendationCard } from "@/components/RecommendationCard";
import { Recommendation } from "@/types/sector";

interface RecommendationsData {
  recommendations: Recommendation[];
  budget: number;
  deficientSectors: string[];
}

export default function RecommendationsPage() {
  const [data, setData]         = useState<RecommendationsData | null>(null);
  const [loading, setLoading]   = useState(false);
  const [budget, setBudget]     = useState("500000");
  const [comment, setComment]   = useState<string | null>(null);
  const [diagnosing, setDiagnosing] = useState(false);

  const fetchData = (bgt: string) => {
    setLoading(true);
    fetch(`/api/recommendations?budget=${bgt}`)
      .then((r) => r.json())
      .then((json) => {
        setData({
          recommendations: Array.isArray(json.recommendations) ? json.recommendations : [],
          budget: json.budget || parseInt(bgt, 10),
          deficientSectors: Array.isArray(json.deficientSectors) ? json.deficientSectors : [],
        });
      })
      .catch(() => setData({ recommendations: [], budget: parseInt(bgt, 10), deficientSectors: [] }))
      .finally(() => setLoading(false));
  };

  const fetchDiagnosis = (bgt: string) => {
    setDiagnosing(true);
    setComment(null);
    fetch("/api/ai-diagnosis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ budget: parseInt(bgt, 10) }),
    })
      .then((r) => r.json())
      .then((json) => setComment(json.comment || "診断コメントを取得できませんでした"))
      .catch(() => setComment("診断コメントの取得に失敗しました"))
      .finally(() => setDiagnosing(false));
  };

  useEffect(() => {
    fetchData(budget);
    fetchDiagnosis(budget);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData(budget);
    fetchDiagnosis(budget);
  };

  const fmt = (n: number) =>
    n.toLocaleString("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });

  const allRecs = data?.recommendations || [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">次の一手</h1>
        <p className="text-slate-400 text-sm mt-1">不足業種を優先した投資候補とAI診断を提供します</p>
      </div>

      {/* 投資余力入力 */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="font-bold text-slate-800 mb-4">投資余力を入力</h2>
        <form onSubmit={handleSubmit} className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="block text-xs font-medium text-slate-500 mb-1.5">金額（円）</label>
            <input
              type="number"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              min="10000"
              step="10000"
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
            />
          </div>
          <button
            type="submit"
            disabled={loading || diagnosing}
            className="bg-indigo-600 text-white font-semibold px-5 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {loading || diagnosing ? "分析中..." : "提案を見る"}
          </button>
        </form>
        {budget && (
          <p className="text-xs text-slate-400 mt-2">
            投資余力: {fmt(parseInt(budget, 10))}
          </p>
        )}
      </div>

      {/* AI診断コメント */}
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xl">🤖</span>
          <h2 className="font-bold text-indigo-800">ポートフォリオ診断</h2>
        </div>
        {diagnosing ? (
          <div className="flex items-center gap-3 text-indigo-600">
            <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm">ポートフォリオを分析中...</span>
          </div>
        ) : comment ? (
          <div className="space-y-3">
            {comment.split("\n\n").map((paragraph, i) => (
              <p key={i} className="text-sm text-indigo-900 leading-relaxed">
                {paragraph}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-sm text-indigo-600">投資余力を入力して「提案を見る」を押してください</p>
        )}
      </div>

      {/* 不足業種 */}
      {data && data.deficientSectors.length > 0 && (
        <div className="bg-amber-50 border border-amber-100 rounded-2xl p-4">
          <p className="text-xs font-semibold text-amber-700 mb-2">現在の不足業種</p>
          <div className="flex flex-wrap gap-2">
            {data.deficientSectors.map((s) => (
              <span key={s} className="text-xs bg-amber-100 text-amber-800 px-2 py-1 rounded-full font-medium">
                {s}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 推奨候補 */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-7 h-7 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : allRecs.length > 0 ? (
        <div className="space-y-3">
          <h2 className="font-bold text-slate-800">推奨候補 ({allRecs.length}件)</h2>
          {allRecs.map((rec, i) => (
            <RecommendationCard key={rec.stock.stock_code} recommendation={rec} rank={i + 1} />
          ))}
        </div>
) : null}
    </div>
  );
}