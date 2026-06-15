"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface SectorData {
  sector: string;
  ratio: number;
  annualDividend?: number;
}

interface HoldingData {
  name: string;
  code: string;
  ratio: number;
  annualDividend: number;
}

const CYCLICAL_SECTORS = new Set([
  "鉄鋼", "非鉄金属", "鉱業", "石油・石炭製品", "化学", "ガラス・土石製品",
  "繊維製品", "パルプ・紙", "輸送用機器", "機械", "電気機器", "精密機器",
  "金属製品", "その他製品", "建設業", "不動産業", "卸売業", "海運業",
  "空運業", "倉庫・運輸関連業", "証券・商品先物取引業", "その他金融業",
]);

const DEFENSIVE_SECTORS = new Set([
  "REIT", "水産・農林業", "食料品", "医薬品", "電力・ガス業", "小売業",
  "情報・通信業", "銀行業", "保険業", "サービス業", "陸運業",
]);

function getCyclicalCategory(sector: string): string {
  if (CYCLICAL_SECTORS.has(sector)) return "景気敏感";
  if (DEFENSIVE_SECTORS.has(sector)) return "ディフェンシブ";
  return "その他";
}

const CYCLICAL_COLORS: Record<string, string> = {
  "景気敏感": "#f59e0b",
  "ディフェンシブ": "#10b981",
  "その他": "#94a3b8",
};

const SECTOR_COLORS = [
  "#6366f1", "#8b5cf6", "#a78bfa", "#c4b5fd",
  "#10b981", "#34d399", "#6ee7b7", "#a7f3d0",
  "#f59e0b", "#fbbf24", "#fcd34d", "#fde68a",
  "#ef4444", "#f87171", "#fca5a5", "#fecaca",
  "#3b82f6", "#60a5fa", "#93c5fd", "#bfdbfe",
];

const HOLDING_COLORS = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e",
  "#10b981", "#14b8a6", "#06b6d4", "#3b82f6",
  "#f59e0b", "#f97316", "#84cc16", "#22c55e",
  "#a855f7", "#d946ef", "#0ea5e9", "#64748b",
  "#ef4444", "#fbbf24", "#34d399", "#818cf8",
];

const fmt = (n: number) =>
  n.toLocaleString("ja-JP", { style: "currency", currency: "JPY", maximumFractionDigits: 0 });

const SectorTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const { name, value, annualDividend } = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-sm">
        <p className="font-bold text-slate-800">{name}</p>
        <p className="text-indigo-600 font-semibold">構成比: {value}%</p>
        {annualDividend > 0 && (
          <p className="text-emerald-600 text-xs">年間配当: {fmt(annualDividend)}</p>
        )}
      </div>
    );
  }
  return null;
};

const HoldingTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const { name, code, value, annualDividend } = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-sm">
        <p className="font-bold text-slate-800">{name}</p>
        <p className="text-slate-400 text-xs">{code}</p>
        <p className="text-indigo-600 font-semibold">構成比: {value}%</p>
        {annualDividend > 0 && (
          <p className="text-emerald-600 text-xs">年間配当: {fmt(annualDividend)}</p>
        )}
      </div>
    );
  }
  return null;
};

const CyclicalTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const { name, value } = payload[0].payload;
    return (
      <div className="bg-white border border-slate-200 rounded-xl px-3 py-2 shadow-lg text-sm">
        <p className="font-bold text-slate-800">{name}</p>
        <p className="text-indigo-600 font-semibold">{value}%</p>
      </div>
    );
  }
  return null;
};

const RADIAN = Math.PI / 180;
const renderCustomLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  if (percent < 0.04) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text x={x} y={y} fill="white" textAnchor="middle" dominantBaseline="central" fontSize={10} fontWeight="bold">
      {`${(percent * 100).toFixed(1)}%`}
    </text>
  );
};

// 業種構成ドーナツ（真ん中に業種数）
export function SectorDonutChart({ sectorRatios }: { sectorRatios: SectorData[] }) {
  const activeRatios = sectorRatios.filter((s) => s.ratio > 0);
  const sectorCount = activeRatios.length;

const sectorData = activeRatios
    .sort((a, b) => b.ratio - a.ratio)
    .map((s) => ({
      name: s.sector,
      value: parseFloat(s.ratio.toFixed(1)),
      annualDividend: s.annualDividend || 0,
    }));

  return (
    <div>

      <div className="relative">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={sectorData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={120}
              dataKey="value"
              paddingAngle={1}
            >
              {sectorData.map((_, index) => (
                <Cell key={`sector-${index}`} fill={SECTOR_COLORS[index % SECTOR_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<SectorTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* 真ん中のテキスト */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-3xl font-black text-slate-800">{sectorCount}</p>
            <p className="text-xs text-slate-400">業種</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 銘柄別構成ドーナツ（真ん中に銘柄数）
export function HoldingDonutChart({ holdingRatios }: { holdingRatios: HoldingData[] }) {
  const holdingCount = holdingRatios.length;

  const holdingData = holdingRatios.map((h) => ({
    name: h.name,
    code: h.code,
    value: parseFloat(h.ratio.toFixed(1)),
    annualDividend: h.annualDividend,
  }));

  return (
    <div>
      <div className="relative">
        <ResponsiveContainer width="100%" height={260}>
          <PieChart>
            <Pie
              data={holdingData}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={120}
              dataKey="value"
              paddingAngle={1}
            >
              {holdingData.map((_, index) => (
                <Cell key={`holding-${index}`} fill={HOLDING_COLORS[index % HOLDING_COLORS.length]} />
              ))}
            </Pie>
            <Tooltip content={<HoldingTooltip />} />
          </PieChart>
        </ResponsiveContainer>
        {/* 真ん中のテキスト */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-3xl font-black text-slate-800">{holdingCount}</p>
            <p className="text-xs text-slate-400">銘柄</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// 景気感応度（通常の円グラフ）
export function CyclicalDonutChart({ sectorRatios }: { sectorRatios: SectorData[] }) {
  const activeRatios = sectorRatios.filter((s) => s.ratio > 0);

  const cyclicalMap = new Map<string, number>();
  activeRatios.forEach((s) => {
    const category = getCyclicalCategory(s.sector);
    cyclicalMap.set(category, (cyclicalMap.get(category) || 0) + s.ratio);
  });
  const cyclicalData = [...cyclicalMap.entries()].map(([name, value]) => ({
    name,
    value: parseFloat(value.toFixed(1)),
  }));

  return (
    <div>
      <ResponsiveContainer width="100%" height={260}>
        <PieChart>
          <Pie
            data={cyclicalData}
            cx="50%"
            cy="50%"
            outerRadius={115}
            dataKey="value"
            label={renderCustomLabel}
            labelLine={false}
          >
            {cyclicalData.map((entry) => (
              <Cell key={entry.name} fill={CYCLICAL_COLORS[entry.name] || "#94a3b8"} />
            ))}
          </Pie>
          <Tooltip content={<CyclicalTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 mt-1">
        {Object.entries(CYCLICAL_COLORS).map(([label, color]) => {
          const item = cyclicalData.find((d) => d.name === label);
          if (!item) return null;
          return (
            <div key={label} className="flex items-center gap-1 text-xs text-slate-500">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
              <span>{label} {item.value}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// デフォルトエクスポート
export function SectorPieChart({ sectorRatios, holdingRatios = [] }: { sectorRatios: SectorData[]; holdingRatios?: HoldingData[] }) {
  return (
    <div className="space-y-6">
      <SectorDonutChart sectorRatios={sectorRatios} />
      {holdingRatios.length > 0 && <HoldingDonutChart holdingRatios={holdingRatios} />}
      <CyclicalDonutChart sectorRatios={sectorRatios} />
    </div>
  );
}