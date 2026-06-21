import { RecommendedStock, Recommendation } from "@/types/sector";
import { SectorScore } from "@/types/score";
import { sectorMaster } from "@/lib/portfolioAnalyzer";

interface SimpleHolding {
  stock_code: string;
  sector: string;
  current_value: number;
  annual_dividend_total: number;
  [key: string]: any;
}

const BUILTIN_RECOMMENDATIONS: RecommendedStock[] = [
  // 情報・通信業
  { stock_code: "9432", company_name: "日本電信電話(NTT)", sector: "情報・通信業", priority: 1 },
  { stock_code: "9433", company_name: "KDDI", sector: "情報・通信業", priority: 2 },
  { stock_code: "9434", company_name: "ソフトバンク", sector: "情報・通信業", priority: 3 },
  // 銀行業
  { stock_code: "8306", company_name: "三菱UFJフィナンシャル・グループ", sector: "銀行業", priority: 1 },
  { stock_code: "8316", company_name: "三井住友フィナンシャルグループ", sector: "銀行業", priority: 2 },
  { stock_code: "8411", company_name: "みずほフィナンシャルグループ", sector: "銀行業", priority: 3 },
  // 卸売業
  { stock_code: "8031", company_name: "三井物産", sector: "卸売業", priority: 1 },
  { stock_code: "8058", company_name: "三菱商事", sector: "卸売業", priority: 2 },
  { stock_code: "8001", company_name: "伊藤忠商事", sector: "卸売業", priority: 3 },
  // 医薬品
  { stock_code: "4502", company_name: "武田薬品工業", sector: "医薬品", priority: 1 },
  { stock_code: "4503", company_name: "アステラス製薬", sector: "医薬品", priority: 2 },
  { stock_code: "4523", company_name: "エーザイ", sector: "医薬品", priority: 3 },
  // 食料品
  { stock_code: "2914", company_name: "日本たばこ産業(JT)", sector: "食料品", priority: 1 },
  { stock_code: "2503", company_name: "キリンホールディングス", sector: "食料品", priority: 2 },
  { stock_code: "2269", company_name: "明治ホールディングス", sector: "食料品", priority: 3 },
  // 電力・ガス業
  { stock_code: "9503", company_name: "関西電力", sector: "電力・ガス業", priority: 1 },
  { stock_code: "9502", company_name: "中部電力", sector: "電力・ガス業", priority: 2 },
  { stock_code: "9531", company_name: "東京瓦斯", sector: "電力・ガス業", priority: 3 },
  // 小売業
  { stock_code: "3382", company_name: "セブン&アイ・ホールディングス", sector: "小売業", priority: 1 },
  { stock_code: "9948", company_name: "アークス", sector: "小売業", priority: 2 },
  { stock_code: "9974", company_name: "ベルク", sector: "小売業", priority: 3 },
  // 保険業
  { stock_code: "8750", company_name: "第一生命ホールディングス", sector: "保険業", priority: 1 },
  { stock_code: "8725", company_name: "MS&ADインシュアランスグループ", sector: "保険業", priority: 2 },
  { stock_code: "8766", company_name: "東京海上ホールディングス", sector: "保険業", priority: 3 },
  // 不動産業
  { stock_code: "8801", company_name: "三井不動産", sector: "不動産業", priority: 1 },
  { stock_code: "8802", company_name: "三菱地所", sector: "不動産業", priority: 2 },
  { stock_code: "8830", company_name: "住友不動産", sector: "不動産業", priority: 3 },
  // REIT
  { stock_code: "3283", company_name: "日本プロロジスリート投資法人", sector: "REIT", priority: 1 },
  { stock_code: "8951", company_name: "日本ビルファンド投資法人", sector: "REIT", priority: 2 },
  { stock_code: "8952", company_name: "ジャパンリアルエステイト投資法人", sector: "REIT", priority: 3 },
  // 輸送用機器
  { stock_code: "7203", company_name: "トヨタ自動車", sector: "輸送用機器", priority: 1 },
  { stock_code: "7267", company_name: "本田技研工業", sector: "輸送用機器", priority: 2 },
  { stock_code: "6902", company_name: "デンソー", sector: "輸送用機器", priority: 3 },
  // 化学
  { stock_code: "4063", company_name: "信越化学工業", sector: "化学", priority: 1 },
  { stock_code: "4204", company_name: "積水化学工業", sector: "化学", priority: 2 },
  { stock_code: "4188", company_name: "三菱ケミカルグループ", sector: "化学", priority: 3 },
  // 建設業
  { stock_code: "1925", company_name: "大和ハウス工業", sector: "建設業", priority: 1 },
  { stock_code: "1928", company_name: "積水ハウス", sector: "建設業", priority: 2 },
  { stock_code: "1417", company_name: "ミライト・ワン", sector: "建設業", priority: 3 },
  // サービス業
  { stock_code: "9735", company_name: "セコム", sector: "サービス業", priority: 1 },
  { stock_code: "9743", company_name: "丹青社", sector: "サービス業", priority: 2 },
  { stock_code: "9616", company_name: "共立メンテナンス", sector: "サービス業", priority: 3 },
  // 証券・商品先物取引業
  { stock_code: "8604", company_name: "野村ホールディングス", sector: "証券・商品先物取引業", priority: 1 },
  { stock_code: "8601", company_name: "大和証券グループ本社", sector: "証券・商品先物取引業", priority: 2 },
  { stock_code: "8473", company_name: "SBIホールディングス", sector: "証券・商品先物取引業", priority: 3 },
  // 陸運業
  { stock_code: "9020", company_name: "東日本旅客鉄道(JR東日本)", sector: "陸運業", priority: 1 },
  { stock_code: "9022", company_name: "東海旅客鉄道(JR東海)", sector: "陸運業", priority: 2 },
  { stock_code: "9064", company_name: "ヤマトホールディングス", sector: "陸運業", priority: 3 },
  // 機械
  { stock_code: "6301", company_name: "コマツ", sector: "機械", priority: 1 },
  { stock_code: "6326", company_name: "クボタ", sector: "機械", priority: 2 },
  { stock_code: "6367", company_name: "ダイキン工業", sector: "機械", priority: 3 },
  // その他金融業
  { stock_code: "8591", company_name: "オリックス", sector: "その他金融業", priority: 1 },
  { stock_code: "8593", company_name: "三菱HCキャピタル", sector: "その他金融業", priority: 2 },
  { stock_code: "8572", company_name: "アコム", sector: "その他金融業", priority: 3 },
  // 電気機器
  { stock_code: "6501", company_name: "日立製作所", sector: "電気機器", priority: 1 },
  { stock_code: "6752", company_name: "パナソニックホールディングス", sector: "電気機器", priority: 2 },
  { stock_code: "6702", company_name: "富士通", sector: "電気機器", priority: 3 },
  // 石油・石炭製品
  { stock_code: "5020", company_name: "ENEOSホールディングス", sector: "石油・石炭製品", priority: 1 },
  { stock_code: "5019", company_name: "出光興産", sector: "石油・石炭製品", priority: 2 },
  { stock_code: "5021", company_name: "コスモエネルギーホールディングス", sector: "石油・石炭製品", priority: 3 },
  // ゴム製品
  { stock_code: "5108", company_name: "ブリヂストン", sector: "ゴム製品", priority: 1 },
  { stock_code: "5110", company_name: "住友ゴム工業", sector: "ゴム製品", priority: 2 },
  { stock_code: "5101", company_name: "横浜ゴム", sector: "ゴム製品", priority: 3 },
  // 水産・農林業
  { stock_code: "1332", company_name: "ニッスイ", sector: "水産・農林業", priority: 1 },
  { stock_code: "1333", company_name: "マルハニチロ", sector: "水産・農林業", priority: 2 },
  { stock_code: "1301", company_name: "極洋", sector: "水産・農林業", priority: 3 },
  // 鉱業
  { stock_code: "1605", company_name: "INPEX", sector: "鉱業", priority: 1 },
  { stock_code: "1662", company_name: "石油資源開発", sector: "鉱業", priority: 2 },
  { stock_code: "5713", company_name: "住友金属鉱山", sector: "鉱業", priority: 3 },
  // 繊維製品
  { stock_code: "3402", company_name: "東レ", sector: "繊維製品", priority: 1 },
  { stock_code: "3407", company_name: "旭化成", sector: "繊維製品", priority: 2 },
  { stock_code: "3591", company_name: "ワコールホールディングス", sector: "繊維製品", priority: 3 },
  // パルプ・紙
  { stock_code: "3861", company_name: "王子ホールディングス", sector: "パルプ・紙", priority: 1 },
  { stock_code: "3863", company_name: "日本製紙", sector: "パルプ・紙", priority: 2 },
  { stock_code: "3880", company_name: "大王製紙", sector: "パルプ・紙", priority: 3 },
  // ガラス・土石製品
  { stock_code: "5201", company_name: "AGC", sector: "ガラス・土石製品", priority: 1 },
  { stock_code: "5214", company_name: "日本電気硝子", sector: "ガラス・土石製品", priority: 2 },
  { stock_code: "5233", company_name: "太平洋セメント", sector: "ガラス・土石製品", priority: 3 },
  // 鉄鋼
  { stock_code: "5401", company_name: "日本製鉄", sector: "鉄鋼", priority: 1 },
  { stock_code: "5411", company_name: "JFEホールディングス", sector: "鉄鋼", priority: 2 },
  { stock_code: "5406", company_name: "神戸製鋼所", sector: "鉄鋼", priority: 3 },
  // 非鉄金属
  { stock_code: "5802", company_name: "住友電気工業", sector: "非鉄金属", priority: 1 },
  { stock_code: "5714", company_name: "DOWAホールディングス", sector: "非鉄金属", priority: 2 },
  { stock_code: "5713", company_name: "住友金属鉱山", sector: "非鉄金属", priority: 3 },
  // 金属製品
  { stock_code: "5938", company_name: "LIXIL", sector: "金属製品", priority: 1 },
  { stock_code: "5929", company_name: "三和ホールディングス", sector: "金属製品", priority: 2 },
  { stock_code: "5930", company_name: "文化シヤッター", sector: "金属製品", priority: 3 },
  // 精密機器
  { stock_code: "7751", company_name: "キヤノン", sector: "精密機器", priority: 1 },
  { stock_code: "4543", company_name: "テルモ", sector: "精密機器", priority: 2 },
  { stock_code: "7741", company_name: "HOYA", sector: "精密機器", priority: 3 },
  // その他製品
  { stock_code: "7974", company_name: "任天堂", sector: "その他製品", priority: 1 },
  { stock_code: "7832", company_name: "バンダイナムコホールディングス", sector: "その他製品", priority: 2 },
  { stock_code: "7911", company_name: "TOPPANホールディングス", sector: "その他製品", priority: 3 },
  // 海運業
  { stock_code: "9101", company_name: "日本郵船", sector: "海運業", priority: 1 },
  { stock_code: "9104", company_name: "商船三井", sector: "海運業", priority: 2 },
  { stock_code: "9107", company_name: "川崎汽船", sector: "海運業", priority: 3 },
  // 空運業
  { stock_code: "9202", company_name: "ANAホールディングス", sector: "空運業", priority: 1 },
  { stock_code: "9201", company_name: "日本航空(JAL)", sector: "空運業", priority: 2 },
  // 倉庫・運輸関連業
  { stock_code: "9301", company_name: "三菱倉庫", sector: "倉庫・運輸関連業", priority: 1 },
  { stock_code: "9303", company_name: "住友倉庫", sector: "倉庫・運輸関連業", priority: 2 },
  { stock_code: "9364", company_name: "上組", sector: "倉庫・運輸関連業", priority: 3 },
];

export function generateRecommendations(
  holdings: SimpleHolding[],
  sectorScores: SectorScore[],
  budget: number,
  recommendedStocks?: RecommendedStock[]
): Recommendation[] {
  const deficientSectors = sectorScores
    .filter((s) => s.isDeficient)
    .sort((a, b) => {
      const sectorA = sectorMaster.find((m) => m.sectorName === a.sector);
      const sectorB = sectorMaster.find((m) => m.sectorName === b.sector);
      return (sectorB?.weight ?? 0) - (sectorA?.weight ?? 0);
    })
    .map((s) => s.sector);

  const heldCodes = new Set(holdings.map((h) => h.stock_code));
  const stockPool = recommendedStocks?.length ? recommendedStocks : BUILTIN_RECOMMENDATIONS;
  const recommendations: Recommendation[] = [];

  for (const sector of deficientSectors.slice(0, 3)) {
    const candidates = stockPool
      .filter((s) => s.sector === sector && !heldCodes.has(s.stock_code))
      .sort((a, b) => a.priority - b.priority);

    const sectorMeta = sectorMaster.find((m) => m.sectorName === sector);
    const scoreImprovement = sectorMeta ? Math.round((sectorMeta.weight / 10) * 3) : 2;

    for (const candidate of candidates.slice(0, 3)) {
      const estimatedCost = candidate.current_price
        ? candidate.current_price * 100
        : Math.min(budget * 0.3, 200000);
      recommendations.push({
        stock: candidate,
        reason: candidate.priority === 1
          ? `${sector}が不足しています。高配当の定番銘柄です。`
          : `${sector}の候補銘柄です。`,
        estimatedCost,
        scoreImprovement: candidate.priority === 1 ? scoreImprovement : Math.max(1, scoreImprovement - 1),
      });
    }

    if (recommendations.length >= 9) break;
  }

  // 業種の優先度順に並び替え
  const sorted = deficientSectors.flatMap((sector) =>
    recommendations.filter((r) => r.stock.sector === sector)
  );

  return sorted.slice(0, 9);
}