"use client";

import { useEffect, useState } from "react";
import { HoldingsTable } from "@/components/HoldingsTable";
import { HoldingWithValue } from "@/types/holding";
import { sectorMaster } from "@/lib/portfolioAnalyzer";

const SECTORS = sectorMaster.map((s) => s.sectorName);

export default function HoldingsPage() {
  const [holdings, setHoldings] = useState<HoldingWithValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [fetchingSector, setFetchingSector] = useState(false);
  const [importing, setImporting] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [csvText, setCsvText] = useState("");
  const [form, setForm] = useState({
    stockCode: "",
    shares: "",
    purchasePrice: "",
    annualDividend: "",
    sector: SECTORS[0],
    accountType: "特定口座",
    companyName: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [importResult, setImportResult] = useState<{ success: string[]; failed: string[] } | null>(null);

  const loadHoldings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/holdings");
      const data = await res.json();
      setHoldings(Array.isArray(data) ? data : []);
    } catch {
      setError("データの読み込みに失敗しました");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHoldings();
  }, []);

  const handleStockCodeBlur = async () => {
    if (!form.stockCode.trim()) return;
    setFetchingSector(true);
    try {
      const res = await fetch(`/api/yahoo?code=${form.stockCode.trim()}`);
      const data = await res.json();
      if (data.companyName) {
        setForm((prev) => ({
          ...prev,
          companyName: data.companyName,
          sector: data.sector || prev.sector,
        }));
      }
    } catch {
    } finally {
      setFetchingSector(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setSubmitting(true);

    try {
      const res = await fetch("/api/holdings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stockCode: form.stockCode.trim(),
          shares: parseInt(form.shares, 10),
          purchasePrice: parseFloat(form.purchasePrice),
          annualDividend: parseFloat(form.annualDividend) || 0,
          sector: form.sector,
          accountType: form.accountType,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "登録に失敗しました");
      } else {
        setSuccess(`${data.company_name} を登録しました`);
        setForm({
          stockCode: "", shares: "", purchasePrice: "", annualDividend: "",
          sector: SECTORS[0], accountType: "特定口座", companyName: "",
        });
        loadHoldings();
      }
    } catch {
      setError("通信エラーが発生しました");
    } finally {
      setSubmitting(false);
    }
  };

  const handleImport = async () => {
    if (!csvText.trim()) return;
    setImporting(true);
    setImportResult(null);

    try {
      const res = await fetch("/api/holdings/import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ csv: csvText }),
      });

      const data = await res.json();
      setImportResult(data);
      if (data.success?.length > 0) {
        loadHoldings();
        setCsvText("");
      }
    } catch {
      setError("インポートに失敗しました");
    } finally {
      setImporting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("この銘柄を削除しますか？")) return;
    const res = await fetch(`/api/holdings?id=${id}`, { method: "DELETE" });
    if (res.ok) loadHoldings();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-black text-slate-800">保有銘柄</h1>
        <p className="text-slate-400 text-sm mt-1">
          証券コードを入力すると銘柄名を自動取得します
        </p>
      </div>

      {/* CSV一括インポート */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800">CSV一括インポート</h2>
          <button
            onClick={() => setShowImport(!showImport)}
            className="text-xs text-indigo-500 hover:text-indigo-700 transition-colors"
          >
            {showImport ? "閉じる" : "開く"}
          </button>
        </div>

        {showImport && (
          <div className="space-y-4">
            <div className="bg-slate-50 rounded-xl p-4 text-sm text-slate-600">
              <p className="font-semibold mb-2">CSVフォーマット（1行目はヘッダー）</p>
              <code className="text-xs bg-white px-3 py-2 rounded-lg border border-slate-200 block whitespace-pre">
                {"証券コード,株数,購入単価,年間配当,口座種別\n9432,100,150,4.8,NISA\n8306,200,1200,41,特定口座"}
              </code>
              <p className="text-xs text-slate-400 mt-2">※口座種別は「NISA」または「特定口座」（省略時は特定口座）</p>
            </div>

            <textarea
              value={csvText}
              onChange={(e) => setCsvText(e.target.value)}
              placeholder={"証券コード,株数,購入単価,年間配当,口座種別\n9432,100,150,4.8,NISA\n8306,200,1200,41,特定口座"}
              rows={6}
              className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-300 transition-all"
            />

            {importResult && (
              <div className="space-y-2">
                {importResult.success.length > 0 && (
                  <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">
                    ✓ 登録成功：{importResult.success.join("、")}
                  </div>
                )}
                {importResult.failed.length > 0 && (
                  <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
                    ⚠️ 登録失敗：{importResult.failed.join("、")}
                  </div>
                )}
              </div>
            )}

            <button
              onClick={handleImport}
              disabled={importing || !csvText.trim()}
              className="w-full sm:w-auto bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {importing ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  インポート中...
                </>
              ) : (
                "一括インポート"
              )}
            </button>
          </div>
        )}
      </div>

      {/* 個別登録フォーム */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <h2 className="font-bold text-slate-800 mb-4">銘柄を追加</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                証券コード <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                value={form.stockCode}
                onChange={(e) => setForm({ ...form, stockCode: e.target.value, companyName: "" })}
                onBlur={handleStockCodeBlur}
                placeholder="例: 9432"
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
              />
              {fetchingSector && (
                <p className="text-xs text-slate-400 mt-1">銘柄情報を取得中...</p>
              )}
              {form.companyName && (
                <p className="text-xs text-indigo-600 mt-1 font-medium">✓ {form.companyName}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                業種 <span className="text-red-400">*</span>
                <span className="text-slate-400 font-normal ml-1">（自動取得・変更可）</span>
              </label>
              <select
                value={form.sector}
                onChange={(e) => setForm({ ...form, sector: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all bg-white"
              >
                {SECTORS.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                保有株数 <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={form.shares}
                onChange={(e) => setForm({ ...form, shares: e.target.value })}
                placeholder="例: 100"
                min="1"
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                購入単価（円） <span className="text-red-400">*</span>
              </label>
              <input
                type="number"
                value={form.purchasePrice}
                onChange={(e) => setForm({ ...form, purchasePrice: e.target.value })}
                placeholder="例: 150"
                min="1"
                step="0.01"
                required
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                年間配当（1株あたり・円）
                <span className="text-slate-400 font-normal ml-1">（証券会社サイトで確認）</span>
              </label>
              <input
                type="number"
                value={form.annualDividend}
                onChange={(e) => setForm({ ...form, annualDividend: e.target.value })}
                placeholder="例: 5.1"
                min="0"
                step="0.1"
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-500 mb-1.5">
                口座種別 <span className="text-red-400">*</span>
              </label>
              <select
                value={form.accountType}
                onChange={(e) => setForm({ ...form, accountType: e.target.value })}
                className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 transition-all bg-white"
              >
                <option value="特定口座">特定口座（20.315%課税）</option>
                <option value="NISA">NISA（非課税）</option>
              </select>
            </div>
          </div>

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm text-red-600">
              ⚠️ {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-100 px-4 py-3 text-sm text-emerald-700">
              ✓ {success}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full sm:w-auto bg-indigo-600 text-white font-semibold px-6 py-2.5 rounded-xl hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {submitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                登録中...
              </>
            ) : (
              "銘柄を登録"
            )}
          </button>
        </form>
      </div>

      {/* 保有銘柄一覧 */}
      <div className="bg-white rounded-2xl border border-slate-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-slate-800">
            保有銘柄一覧
            {holdings.length > 0 && (
              <span className="ml-2 text-sm font-normal text-slate-400">
                {holdings.length}銘柄
              </span>
            )}
          </h2>
          {holdings.length > 0 && (
            <button
              onClick={loadHoldings}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors"
            >
              ↻ 更新
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-7 h-7 border-4 border-indigo-400 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <HoldingsTable holdings={holdings} onDelete={handleDelete} onUpdate={loadHoldings} />
        )}
      </div>
    </div>
  );
}