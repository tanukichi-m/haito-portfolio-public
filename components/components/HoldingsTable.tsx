"use client";

import { useState } from "react";
import { HoldingWithValue } from "@/types/holding";
import { sectorMaster } from "@/lib/portfolioAnalyzer";

const SECTORS = sectorMaster.map((s) => s.sectorName);

interface HoldingsTableProps {
  holdings: HoldingWithValue[];
  onDelete?: (id: string) => void;
  onUpdate?: () => void;
}

const fmt = (n: number) =>
  n.toLocaleString("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });

export function HoldingsTable({ holdings, onDelete, onUpdate }: HoldingsTableProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    shares: "",
    purchasePrice: "",
    annualDividend: "",
    sector: "",
    accountType: "特定口座",
  });
  const [saving, setSaving] = useState(false);

  const startEdit = (h: HoldingWithValue) => {
    setEditingId(h.id);
    setEditForm({
      shares: h.shares.toString(),
      purchasePrice: h.purchase_price.toString(),
      annualDividend: h.annual_dividend?.toString() || "0",
      sector: h.sector,
      accountType: h.account_type || "特定口座",
    });
  };

  const cancelEdit = () => setEditingId(null);

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/holdings?id=${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shares: parseInt(editForm.shares, 10),
          purchasePrice: parseFloat(editForm.purchasePrice),
          annualDividend: parseFloat(editForm.annualDividend) || 0,
          sector: editForm.sector,
          accountType: editForm.accountType,
        }),
      });
      if (res.ok) {
        setEditingId(null);
        onUpdate?.();
      }
    } finally {
      setSaving(false);
    }
  };

  if (holdings.length === 0) {
    return (
      <div className="text-center py-16 text-slate-400">
        <p className="text-4xl mb-3">📊</p>
        <p className="font-medium">まだ銘柄が登録されていません</p>
        <p className="text-sm mt-1">上のフォームから追加してください</p>
      </div>
    );
  }

return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
      {holdings.map((h) => {
        const isEditing = editingId === h.id;
        const gainPositive = h.gain_loss >= 0;
        const isNisa = h.account_type === "NISA";

        return (
          <div
            key={h.id}
            className={`rounded-xl border p-4 transition-all ${
              isEditing
                ? "border-indigo-200 bg-indigo-50"
                : "border-slate-100 bg-white hover:border-slate-200"
            }`}
          >
            {isEditing ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800">{h.company_name}</span>
                    <span className="text-slate-400 text-xs ml-1">({h.stock_code})</span>
                  </div>
                  <span className="text-xs text-indigo-600 font-medium">編集中</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">業種</label>
                    <select
                      value={editForm.sector}
                      onChange={(e) => setEditForm({ ...editForm, sector: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    >
                      {SECTORS.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">口座種別</label>
                    <select
                      value={editForm.accountType}
                      onChange={(e) => setEditForm({ ...editForm, accountType: e.target.value })}
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    >
                      <option value="特定口座">特定口座（20.315%課税）</option>
                      <option value="NISA">NISA（非課税）</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">保有株数</label>
                    <input
                      type="number"
                      value={editForm.shares}
                      onChange={(e) => setEditForm({ ...editForm, shares: e.target.value })}
                      min="1"
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">購入単価（円）</label>
                    <input
                      type="number"
                      value={editForm.purchasePrice}
                      onChange={(e) => setEditForm({ ...editForm, purchasePrice: e.target.value })}
                      min="1"
                      step="0.01"
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-slate-500 mb-1">年間配当（1株あたり・円）</label>
                    <input
                      type="number"
                      value={editForm.annualDividend}
                      onChange={(e) => setEditForm({ ...editForm, annualDividend: e.target.value })}
                      placeholder="例: 5.1"
                      min="0"
                      step="0.1"
                      className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                    />
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => saveEdit(h.id)}
                    disabled={saving}
                    className="bg-indigo-600 text-white text-sm font-semibold px-4 py-1.5 rounded-lg hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                  >
                    {saving ? "保存中..." : "保存"}
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="bg-slate-100 text-slate-600 text-sm font-medium px-4 py-1.5 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    キャンセル
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-slate-800">{h.company_name}</span>
                    <span className="text-slate-400 text-xs">({h.stock_code})</span>
                    <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                      {h.sector}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      isNisa
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {isNisa ? "🌱 NISA" : "特定口座"}
                    </span>
                  </div>
<div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-2 mt-2 text-sm">
                    <div>
                      <span className="text-slate-400 text-xs">保有株数</span>
                      <p className="font-medium text-slate-700">{h.shares.toLocaleString()}株</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs">購入単価</span>
                      <p className="font-medium text-slate-700">{fmt(h.purchase_price)}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs">取得額</span>
                      <p className="font-medium text-slate-700">{fmt(h.purchase_price * h.shares)}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs">現在値</span>
                      <p className="font-semibold text-slate-800">{fmt(h.current_price ?? h.purchase_price)}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs">評価額</span>
                      <p className="font-semibold text-slate-800">{fmt(h.current_value)}</p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs">損益</span>
                      <p className={`font-medium ${gainPositive ? "text-emerald-600" : "text-red-500"}`}>
                        {gainPositive ? "+" : ""}{fmt(h.gain_loss)}
                        <span className="text-xs ml-1">
                          ({gainPositive ? "+" : ""}{h.gain_loss_pct.toFixed(1)}%)
                        </span>
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs">年間配当</span>
                      <p className="font-medium text-emerald-600">{fmt(h.annual_dividend_total)}</p>
                    </div>
<div>
                      <span className="text-slate-400 text-xs">現在利回り</span>
                      <p className="font-medium text-emerald-600">
                        {h.current_price && h.annual_dividend > 0
                          ? `${((h.annual_dividend / h.current_price) * 100).toFixed(2)}%`
                          : "—"}
                      </p>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs">取得利回り</span>
                      <p className="font-medium text-blue-600">
                        {h.purchase_price && h.annual_dividend > 0
                          ? `${((h.annual_dividend / h.purchase_price) * 100).toFixed(2)}%`
                          : "—"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button
                    onClick={() => startEdit(h)}
                    className="text-xs text-slate-400 hover:text-indigo-600 transition-colors px-2 py-1 rounded-lg hover:bg-indigo-50"
                  >
                    編集
                  </button>
                  {onDelete && (
                    <button
                      onClick={() => onDelete(h.id)}
                      className="text-xs text-slate-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50"
                    >
                      削除
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}