"use client";

const fmt = (n: number) =>
  n.toLocaleString("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });

interface SummaryProps {
  totalValue: number;
  totalCost: number;
  totalGainLoss: number;
  totalDividend: number;
  totalDividendAfterTax: number;
  holdingCount: number;
  dividendYield: number;
  dividendYieldAfterTax: number;
  costYield: number;
  costYieldAfterTax: number;
}

const Stat = ({
  label,
  value,
  sub,
  sub2,
  accent,
  positive,
}: {
  label: string;
  value: string;
  sub?: string;
  sub2?: string;
  accent?: boolean;
  positive?: boolean;
}) => (
  <div className={`rounded-xl p-4 ${accent ? "bg-indigo-600 text-white" : "bg-white border border-slate-100"}`}>
    <p className={`text-xs font-medium tracking-wide uppercase ${accent ? "text-indigo-200" : "text-slate-400"}`}>
      {label}
    </p>
    <p className={`text-xl font-black mt-1 ${
      accent ? "text-white" :
      positive === true ? "text-emerald-600" :
      positive === false ? "text-red-500" :
      "text-slate-800"
    }`}>{value}</p>
    {sub && (
      <p className={`text-xs mt-0.5 ${accent ? "text-indigo-200" : "text-slate-400"}`}>{sub}</p>
    )}
    {sub2 && (
      <p className={`text-xs mt-0.5 ${accent ? "text-indigo-100" : "text-emerald-600"}`}>{sub2}</p>
    )}
  </div>
);

export function PortfolioSummary({
  totalValue,
  totalCost,
  totalGainLoss,
  totalDividend,
  totalDividendAfterTax,
  holdingCount,
  dividendYield,
  dividendYieldAfterTax,
  costYield,
  costYieldAfterTax,
}: SummaryProps) {
  const gainLossPct = totalCost > 0 ? (totalGainLoss / totalCost) * 100 : 0;
  const gainPositive = totalGainLoss >= 0;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="時価評価額" value={fmt(totalValue)} accent />
        <Stat label="取得額" value={fmt(totalCost)} sub={`${holdingCount}銘柄`} />
        <Stat
          label="評価損益"
          value={`${gainPositive ? "+" : ""}${fmt(totalGainLoss)}`}
          sub={`${gainPositive ? "+" : ""}${gainLossPct.toFixed(2)}%`}
          positive={gainPositive}
        />
        <Stat label="保有銘柄数" value={`${holdingCount}銘柄`} />
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat
          label="年間配当"
          value={fmt(totalDividend)}
          sub="税引前"
          sub2={`税引後 ${fmt(totalDividendAfterTax)}`}
        />
        <Stat
          label="現在利回り"
          value={`${dividendYield.toFixed(2)}%`}
          sub="時価ベース・税引前"
          sub2={`税引後 ${dividendYieldAfterTax.toFixed(2)}%`}
        />
        <Stat
          label="取得利回り"
          value={`${costYield.toFixed(2)}%`}
          sub="取得額ベース・税引前"
          sub2={`税引後 ${costYieldAfterTax.toFixed(2)}%`}
        />
        <Stat label="月間配当換算" value={fmt(totalDividend / 12)} sub="税引前・月額" />
      </div>
    </div>
  );
}