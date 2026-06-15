import { RecommendedStock, Recommendation } from "@/types/sector";
import { HoldingWithValue } from "@/types/holding";
import { SectorScore } from "@/types/score";
import { SECTOR_MASTER, getDeficientSectors } from "./portfolioAnalyzer";

// Built-in recommended stocks for deficient sectors
const BUILTIN_RECOMMENDATIONS: RecommendedStock[] = [
  // 医薬品
  { stock_code: "4502", company_name: "武田薬品工業", sector: "医薬品", priority: 1 },
  { stock_code: "4519", company_name: "中外製薬", sector: "医薬品", priority: 2 },
  { stock_code: "4507", company_name: "塩野義製薬", sector: "医薬品", priority: 3 },
  // 情報・通信業
  { stock_code: "9432", company_name: "日本電信電話(NTT)", sector: "情報・通信業", priority: 1 },
  { stock_code: "9433", company_name: "KDDI", sector: "情報・通信業", priority: 2 },
  { stock_code: "9434", company_name: "ソフトバンク", sector: "情報・通信業", priority: 3 },
  // 銀行業
  { stock_code: "8306", company_name: "三菱UFJフィナンシャル・グループ", sector: "銀行業", priority: 1 },
  { stock_code: "8316", company_name: "三井住友フィナンシャルグループ", sector: "銀行業", priority: 2 },
  { stock_code: "8411", company_name: "みずほフィナンシャルグループ", sector: "銀行業", priority: 3 },
  // 食料品
  { stock_code: "2914", company_name: "日本たばこ産業(JT)", sector: "食料品", priority: 1 },
  { stock_code: "2503", company_name: "キリンホールディングス", sector: "食料品", priority: 2 },
  { stock_code: "2502", company_name: "アサヒグループホールディングス", sector: "食料品", priority: 3 },
  // REIT
  { stock_code: "3283", company_name: "日本プロロジスリート投資法人", sector: "REIT", priority: 1 },
  { stock_code: "8951", company_name: "日本ビルファンド投資法人", sector: "REIT", priority: 2 },
  { stock_code: "8952", company_name: "ジャパンリアルエステイト投資法人", sector: "REIT", priority: 3 },
  // 電気機器
  { stock_code: "6758", company_name: "ソニーグループ", sector: "電気機器", priority: 1 },
  { stock_code: "6501", company_name: "日立製作所", sector: "電気機器", priority: 2 },
  { stock_code: "6702", company_name: "富士通", sector: "電気機器", priority: 3 },
  // 卸売業
  { stock_code: "8031", company_name: "三井物産", sector: "卸売業", priority: 1 },
  { stock_code: "8058", company_name: "三菱商事", sector: "卸売業", priority: 2 },
  { stock_code: "8001", company_name: "伊藤忠商事", sector: "卸売業", priority: 3 },
  // 保険業
  { stock_code: "8750", company_name: "第一生命ホールディングス", sector: "保険業", priority: 1 },
  { stock_code: "8725", company_name: "MS&ADインシュアランスグループ", sector: "保険業", priority: 2 },
  // 不動産業
  { stock_code: "8801", company_name: "三井不動産", sector: "不動産業", priority: 1 },
  { stock_code: "8802", company_name: "三菱地所", sector: "不動産業", priority: 2 },
];

export function generateRecommendations(
  holdings: HoldingWithValue[],
  sectorScores: SectorScore[],
  budget: number,
  recommendedStocks?: RecommendedStock[]
): Recommendation[] {
  const deficientSectors = getDeficientSectors(sectorScores);
  const heldCodes = new Set(holdings.map((h) => h.stock_code));

  const stockPool = recommendedStocks?.length
    ? recommendedStocks
    : BUILTIN_RECOMMENDATIONS;

  const recommendations: Recommendation[] = [];

  for (const sector of deficientSectors.slice(0, 5)) {
    const candidates = stockPool
      .filter((s) => s.sector === sector && !heldCodes.has(s.stock_code))
      .sort((a, b) => a.priority - b.priority);

    const sectorMeta = SECTOR_MASTER.find((m) => m.sector_name === sector);
    const scoreImprovement = sectorMeta
      ? Math.round((sectorMeta.weight / 10) * 3)
      : 2;

    // Main candidate (top priority)
    const main = candidates[0];
    if (main) {
      const estimatedCost = main.current_price
        ? main.current_price * 100
        : Math.min(budget * 0.4, 200000);

      recommendations.push({
        stock: main,
        reason: `${sector}が不足しています。高配当の定番銘柄です。`,
        estimatedCost,
        scoreImprovement,
      });
    }

    // Alternatives
    for (const alt of candidates.slice(1, 3)) {
      const estimatedCost = alt.current_price
        ? alt.current_price * 100
        : Math.min(budget * 0.3, 150000);

      recommendations.push({
        stock: alt,
        reason: `${sector}の代替候補です。`,
        estimatedCost,
        scoreImprovement: Math.max(1, scoreImprovement - 1),
      });
    }

    if (recommendations.length >= 6) break;
  }

  return recommendations.slice(0, 6);
}
