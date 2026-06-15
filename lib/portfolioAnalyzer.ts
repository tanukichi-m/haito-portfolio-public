export interface Holding {
  stockCode: string;
  companyName: string;
  sector: string;
  currentPrice: number;
  annualDividend: number;
  shares: number;
  purchasePrice: number;
}

export interface SectorMaster {
  sectorName: string;
  rank: "S" | "A" | "B" | "C";
  targetRatio: number;
  maxRatio: number;
  weight: number;
}

export interface SectorRatio {
  sector: string;
  marketValue: number;
  ratio: number;
}

export interface DividendRatio {
  sector: string;
  ratio: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalDividend: number;
  totalCost: number;
}

export interface PortfolioScoreResult {
  totalScore: number;
  importanceScore: number;
  completionScore: number;
  concentrationScore: number;
  dividendRiskScore: number;
  reitScore: number;
  label: string;
}

export const sectorMaster: SectorMaster[] = [
  { sectorName: "情報・通信業",         rank: "A", targetRatio: 6,  maxRatio: 12, weight: 9  },
  { sectorName: "銀行業",               rank: "A", targetRatio: 6,  maxRatio: 12, weight: 9  },
  { sectorName: "卸売業",               rank: "A", targetRatio: 6,  maxRatio: 12, weight: 9  },
  { sectorName: "医薬品",               rank: "A", targetRatio: 6,  maxRatio: 12, weight: 9  },
  { sectorName: "食料品",               rank: "A", targetRatio: 5,  maxRatio: 12, weight: 8  },
  { sectorName: "電力・ガス業",         rank: "A", targetRatio: 6,  maxRatio: 12, weight: 9  },
  { sectorName: "小売業",               rank: "A", targetRatio: 5,  maxRatio: 12, weight: 7  },
  { sectorName: "保険業",               rank: "B", targetRatio: 4,  maxRatio: 10, weight: 7  },
  { sectorName: "不動産業",             rank: "B", targetRatio: 4,  maxRatio: 10, weight: 6  },
  { sectorName: "REIT",                 rank: "B", targetRatio: 4,  maxRatio: 10, weight: 7  },
  { sectorName: "輸送用機器",           rank: "B", targetRatio: 4,  maxRatio: 10, weight: 6  },
  { sectorName: "化学",                 rank: "B", targetRatio: 4,  maxRatio: 10, weight: 6  },
  { sectorName: "建設業",               rank: "B", targetRatio: 3,  maxRatio: 10, weight: 5  },
  { sectorName: "サービス業",           rank: "B", targetRatio: 3,  maxRatio: 10, weight: 5  },
  { sectorName: "証券・商品先物取引業", rank: "C", targetRatio: 2,  maxRatio: 8,  weight: 4  },
  { sectorName: "陸運業",               rank: "C", targetRatio: 2,  maxRatio: 8,  weight: 4  },
  { sectorName: "機械",                 rank: "C", targetRatio: 2,  maxRatio: 8,  weight: 4  },
  { sectorName: "その他金融業",         rank: "C", targetRatio: 2,  maxRatio: 6,  weight: 3  },
  { sectorName: "電気機器",             rank: "C", targetRatio: 2,  maxRatio: 8,  weight: 4  },
  { sectorName: "石油・石炭製品",       rank: "C", targetRatio: 2,  maxRatio: 6,  weight: 3  },
  { sectorName: "ゴム製品",             rank: "C", targetRatio: 2,  maxRatio: 6,  weight: 3  },
  { sectorName: "水産・農林業",         rank: "C", targetRatio: 1,  maxRatio: 5,  weight: 2  },
  { sectorName: "鉱業",                 rank: "C", targetRatio: 1,  maxRatio: 5,  weight: 2  },
  { sectorName: "繊維製品",             rank: "C", targetRatio: 1,  maxRatio: 5,  weight: 2  },
  { sectorName: "パルプ・紙",           rank: "C", targetRatio: 1,  maxRatio: 5,  weight: 2  },
  { sectorName: "ガラス・土石製品",     rank: "C", targetRatio: 1,  maxRatio: 5,  weight: 2  },
  { sectorName: "鉄鋼",                 rank: "C", targetRatio: 1,  maxRatio: 5,  weight: 2  },
  { sectorName: "非鉄金属",             rank: "C", targetRatio: 1,  maxRatio: 5,  weight: 2  },
  { sectorName: "金属製品",             rank: "C", targetRatio: 1,  maxRatio: 5,  weight: 2  },
  { sectorName: "精密機器",             rank: "C", targetRatio: 1,  maxRatio: 5,  weight: 2  },
  { sectorName: "その他製品",           rank: "C", targetRatio: 1,  maxRatio: 5,  weight: 2  },
  { sectorName: "海運業",               rank: "C", targetRatio: 1,  maxRatio: 5,  weight: 2  },
  { sectorName: "空運業",               rank: "C", targetRatio: 1,  maxRatio: 5,  weight: 2  },
  { sectorName: "倉庫・運輸関連業",     rank: "C", targetRatio: 1,  maxRatio: 5,  weight: 2  },
  { sectorName: "ETF",                  rank: "C", targetRatio: 0,  maxRatio: 20, weight: 1  },
];

const TOTAL_WEIGHT = sectorMaster.reduce((sum, s) => sum + s.weight, 0);

export const SECTOR_NAMES = sectorMaster.map((s) => s.sectorName);
export const CORE_SECTORS = ["情報・通信業", "銀行業", "医薬品", "電力・ガス業", "食料品", "REIT"];

export function getMarketValue(holding: Holding): number {
  return holding.currentPrice * holding.shares;
}

export function getAnnualDividend(holding: Holding): number {
  return holding.annualDividend * holding.shares;
}

export function getCostBasis(holding: Holding): number {
  return holding.purchasePrice * holding.shares;
}

export function summarizePortfolio(holdings: Holding[]): PortfolioSummary {
  const totalValue    = holdings.reduce((sum, h) => sum + getMarketValue(h), 0);
  const totalDividend = holdings.reduce((sum, h) => sum + getAnnualDividend(h), 0);
  const totalCost     = holdings.reduce((sum, h) => sum + getCostBasis(h), 0);
  return { totalValue, totalDividend, totalCost };
}

export function calculateSectorRatios(holdings: Holding[]): SectorRatio[] {
  const totalValue = summarizePortfolio(holdings).totalValue;
  const map = new Map<string, number>();
  holdings.forEach((h) => {
    const value = getMarketValue(h);
    map.set(h.sector, (map.get(h.sector) || 0) + value);
  });
  return [...map.entries()].map(([sector, value]) => ({
    sector,
    marketValue: value,
    ratio: totalValue > 0 ? (value / totalValue) * 100 : 0,
  }));
}

export function calculateDividendRatios(holdings: Holding[]): DividendRatio[] {
  const totalDividend = holdings.reduce((sum, h) => sum + getAnnualDividend(h), 0);
  const map = new Map<string, number>();
  holdings.forEach((h) => {
    const dividend = getAnnualDividend(h);
    map.set(h.sector, (map.get(h.sector) || 0) + dividend);
  });
  return [...map.entries()].map(([sector, dividend]) => ({
    sector,
    ratio: totalDividend > 0 ? (dividend / totalDividend) * 100 : 0,
  }));
}

export function calculateImportanceScore(ratios: SectorRatio[]): number {
  let total = 0;
  sectorMaster.forEach((master) => {
    const sector = ratios.find((r) => r.sector === master.sectorName);
    const current = sector?.ratio || 0;
    const achievement = Math.min(current / master.targetRatio, 1);
    total += achievement * master.weight;
  });
  return (total / TOTAL_WEIGHT) * 35;
}

export function calculateCompletionScore(ratios: SectorRatio[]): number {
  let obtained = 0;
  sectorMaster.forEach((master) => {
    const exists = ratios.some((r) => r.sector === master.sectorName);
    if (exists) obtained += master.weight;
  });
  return (obtained / TOTAL_WEIGHT) * 20;
}

export function calculateConcentrationScore(ratios: SectorRatio[]): number {
  if (ratios.length === 0) return 0;
  const totalSectors = sectorMaster.length;
  const coveredSectors = ratios.length;
  const diversityScore = (coveredSectors / totalSectors) * 15;
  const maxRatio = Math.max(...ratios.map((r) => r.ratio));
  const penaltyScore = maxRatio > 50 ? 5 : maxRatio > 30 ? 3 : maxRatio > 20 ? 1 : 0;
  return Math.min(Math.max(diversityScore - penaltyScore, 0), 20);
}

export function calculateDividendRiskScore(
  dividendRatios: DividendRatio[],
  holdings: Holding[]
): number {
  if (holdings.length === 0) return 0;
  const holdingsWithDividend = holdings.filter((h) => h.annualDividend > 0).length;
  if (holdingsWithDividend === 0) return 0;
  const diversityBonus = Math.min((holdingsWithDividend / 10) * 15, 15);
  let penalty = 0;
  dividendRatios.forEach((d) => {
    if (d.ratio > 40)      penalty += 5;
    else if (d.ratio > 30) penalty += 3;
    else if (d.ratio > 20) penalty += 1;
  });
  return Math.min(Math.max(diversityBonus - penalty, 0), 20);
}

export function calculateReitScore(reitRatio: number): number {
  return Math.min(reitRatio / 5, 1) * 5;
}

export function calculatePortfolioScore(holdings: Holding[]): PortfolioScoreResult {
  if (holdings.length === 0) {
    return {
      totalScore: 0, importanceScore: 0, completionScore: 0,
      concentrationScore: 0, dividendRiskScore: 0, reitScore: 0, label: "未診断",
    };
  }

  const ratios         = calculateSectorRatios(holdings);
  const dividendRatios = calculateDividendRatios(holdings);
  const importance    = calculateImportanceScore(ratios);
  const completion    = calculateCompletionScore(ratios);
  const concentration = calculateConcentrationScore(ratios);
  const dividendRisk  = calculateDividendRiskScore(dividendRatios, holdings);
  const reitEntry = ratios.find((r) => r.sector === "REIT");
  const reitRatio = reitEntry?.ratio || 0;
  const reit      = calculateReitScore(reitRatio);

  const total = importance + completion + concentration + dividendRisk + reit;
  const totalScore = Math.min(Math.round(total), 100);

  const label =
    totalScore >= 85 ? "優秀" :
    totalScore >= 70 ? "良好" :
    totalScore >= 55 ? "普通" :
    totalScore >= 40 ? "要改善" : "危険";

  return {
    totalScore,
    importanceScore:    Math.round(importance),
    completionScore:    Math.round(completion),
    concentrationScore: Math.round(concentration),
    dividendRiskScore:  Math.round(dividendRisk),
    reitScore:          Math.round(reit),
    label,
  };
}

export function getDeficientSectors(ratios: SectorRatio[]): string[] {
  return sectorMaster
    .filter((master) => {
      const current = ratios.find((r) => r.sector === master.sectorName)?.ratio || 0;
      return current < master.targetRatio * 0.5;
    })
    .sort((a, b) => b.weight - a.weight)
    .map((s) => s.sectorName);
}