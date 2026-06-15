import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getStockData } from "@/lib/yahooFinance";
import {
  Holding,
  calculateSectorRatios,
  calculateDividendRatios,
  calculatePortfolioScore,
  summarizePortfolio,
  getDeficientSectors,
  sectorMaster,
} from "@/lib/portfolioAnalyzer";

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

function generateComment(
  score: any,
  summary: any,
  deficientSectors: string[],
  sectorRatios: any[],
  dividendRatios: any[],
  holdings: Holding[],
  budget: number
): string {
  const sections: string[] = [];
  const dividendYield = summary.totalValue > 0
    ? (summary.totalDividend / summary.totalValue) * 100
    : 0;

  // ① 業種重要度（35点）
  let importanceComment = "";
  if (score.importanceScore >= 30) {
    importanceComment = `✅ 業種重要度 ${score.importanceScore}/35点\nS・Aランクの主要業種を幅広くカバーできています。高配当ポートフォリオとして非常に安定した構成です。`;
  } else if (score.importanceScore >= 20) {
    const missingImportant = sectorMaster
      .filter((m) => (m.rank === "S" || m.rank === "A") && !sectorRatios.find((r) => r.sector === m.sectorName && r.ratio > 0))
      .map((m) => m.sectorName)
      .slice(0, 3);
    importanceComment = `🔶 業種重要度 ${score.importanceScore}/35点\n主要業種のカバーがやや不足しています。${missingImportant.length > 0 ? `特に「${missingImportant.join("・")}」などの重要業種への投資を優先しましょう。` : "引き続き重要業種を追加していきましょう。"}`;
  } else if (score.importanceScore >= 10) {
    const missingS = sectorMaster
      .filter((m) => m.rank === "S" && !sectorRatios.find((r) => r.sector === m.sectorName && r.ratio > 0))
      .map((m) => m.sectorName);
    importanceComment = `❌ 業種重要度 ${score.importanceScore}/35点\n重要業種のカバーが大きく不足しています。${missingS.length > 0 ? `最優先でSランク業種「${missingS.join("・")}」への投資が必要です。` : "AランクおよびBランク業種への分散投資を急ぎましょう。"}`;
  } else {
    importanceComment = `❌ 業種重要度 ${score.importanceScore}/35点\n重要業種がほとんどカバーできていません。まずはSランク（情報・通信業、銀行業）から投資を始め、段階的にAランク業種を追加していきましょう。`;
  }
  sections.push(importanceComment);

  // ② コンプリート率（20点）
  const coveredSectors = sectorRatios.filter((r) => r.ratio > 0).length;
  const totalSectors = sectorMaster.length;
  let completionComment = "";
  if (score.completionScore >= 16) {
    completionComment = `✅ コンプリート率 ${score.completionScore}/20点\n${coveredSectors}/${totalSectors}業種をカバーしており、非常に幅広い分散投資ができています。`;
  } else if (score.completionScore >= 10) {
    const remaining = totalSectors - coveredSectors;
    completionComment = `🔶 コンプリート率 ${score.completionScore}/20点\n現在${coveredSectors}業種をカバーしています。あと${remaining}業種の追加余地があります。${holdings.length}銘柄から15〜20銘柄を目標に増やしていきましょう。`;
  } else if (score.completionScore >= 5) {
    completionComment = `❌ コンプリート率 ${score.completionScore}/20点\n${coveredSectors}業種のみのカバーで分散が不十分です。現在${holdings.length}銘柄ですが、最低でも10銘柄以上・10業種以上を目指して投資を広げていきましょう。`;
  } else {
    completionComment = `❌ コンプリート率 ${score.completionScore}/20点\n業種の分散がほとんどできていない状態です。1つの業種に集中することはリスクが非常に高く、早急に複数業種への分散が必要です。`;
  }
  sections.push(completionComment);

  // ③ 集中リスク（20点）
  const maxSector = sectorRatios.length > 0
    ? sectorRatios.reduce((max, s) => s.ratio > max.ratio ? s : max, { sector: "", ratio: 0 })
    : { sector: "", ratio: 0 };
  const overweightSectors = sectorRatios.filter((r) => {
    const master = sectorMaster.find((m) => m.sectorName === r.sector);
    return master && r.ratio > master.maxRatio;
  });
  let concentrationComment = "";
  if (score.concentrationScore >= 15) {
    concentrationComment = `✅ 集中リスク ${score.concentrationScore}/20点\n業種分散が良好で、特定業種への過度な集中がありません。最大業種「${maxSector.sector}」でも${maxSector.ratio.toFixed(1)}%と適切な水準です。`;
  } else if (score.concentrationScore >= 8) {
    concentrationComment = `🔶 集中リスク ${score.concentrationScore}/20点\n「${maxSector.sector}」への集中度が${maxSector.ratio.toFixed(1)}%とやや高めです。${overweightSectors.length > 0 ? `「${overweightSectors.map(s => s.sector).join("・")}」が上限を超えています。` : "他の業種への分散を意識して投資比率を調整しましょう。"}`;
  } else {
    concentrationComment = `❌ 集中リスク ${score.concentrationScore}/20点\n「${maxSector.sector}」に${maxSector.ratio.toFixed(1)}%と大きく偏っており、集中リスクが高い状態です。この業種が不況になった場合、ポートフォリオ全体に大きなダメージを受ける可能性があります。早急に他業種への分散が必要です。`;
  }
  sections.push(concentrationComment);

  // ④ 配当分散（20点）
  const holdingsWithDividend = holdings.filter((h) => h.annualDividend > 0).length;
  const maxDividend = dividendRatios.length > 0
    ? dividendRatios.reduce((max, d) => d.ratio > max.ratio ? d : max, { sector: "", ratio: 0 })
    : { sector: "", ratio: 0 };
  let dividendComment = "";
  if (score.dividendRiskScore >= 15) {
    dividendComment = `✅ 配当分散 ${score.dividendRiskScore}/20点\n配当が複数の業種・銘柄に分散されており、安定した配当収入が期待できます。配当利回り${dividendYield.toFixed(1)}%は良好な水準です。配当銘柄${holdingsWithDividend}銘柄からバランスよく配当を受け取れています。`;
  } else if (score.dividendRiskScore >= 8) {
    dividendComment = `🔶 配当分散 ${score.dividendRiskScore}/20点\n配当の${maxDividend.ratio.toFixed(1)}%が「${maxDividend.sector}」に集中しています。現在${holdingsWithDividend}銘柄から配当を受け取っていますが、もう少し配当源を分散させることでリスクを下げられます。`;
  } else if (holdingsWithDividend === 0) {
    dividendComment = `❌ 配当分散 ${score.dividendRiskScore}/20点\n配当金が設定されている銘柄がありません。保有銘柄の編集から年間配当を入力してください。配当金を設定することでスコアが大幅に改善されます。`;
  } else {
    dividendComment = `❌ 配当分散 ${score.dividendRiskScore}/20点\n配当が「${maxDividend.sector}」に${maxDividend.ratio.toFixed(1)}%と大きく偏っています。その業種の業績悪化や減配リスクに非常に脆弱な状態です。配当銘柄を増やして分散を図ることが急務です。`;
  }
  sections.push(dividendComment);

  // ⑤ REIT保有（5点）
  const reitHoldings = holdings.filter((h) => h.sector === "REIT");
  let reitComment = "";
  if (score.reitScore >= 4) {
    reitComment = `✅ REIT保有 ${score.reitScore}/5点\nREITを適切に保有しており、不動産からの安定した配当収入がポートフォリオを支えています。${reitHoldings.length > 0 ? `現在${reitHoldings.length}銘柄のREITを保有しています。` : ""}`;
  } else if (score.reitScore >= 1) {
    reitComment = `🔶 REIT保有 ${score.reitScore}/5点\nREITの保有比率がやや低めです。REITは不動産からの安定した配当収入が魅力で、高配当ポートフォリオとの相性が抜群です。比率を5%程度まで高めることを検討しましょう。`;
  } else {
    reitComment = `❌ REIT保有 ${score.reitScore}/5点\nREITをまだ保有していません。日本プロロジスリート（3283）、日本ビルファンド（8951）、ジャパンリアルエステイト（8952）などの高配当REITへの投資を検討してください。安定した配当収入が期待できます。`;
  }
  sections.push(reitComment);

// ⑥ 総評・投資余力アドバイス
  if (budget > 0) {
    let totalAdvice = `\n📊 総評・投資余力${budget.toLocaleString()}円の活用方法\n`;
    totalAdvice += `総合スコア${score.totalScore}点（${score.label}）`;

    if (score.totalScore >= 85) {
      totalAdvice += `で優秀なポートフォリオです。投資余力は以下の優先度で活用しましょう。\n`;
    } else if (score.totalScore >= 70) {
      totalAdvice += `で良好な状態ですが、さらなる改善のため以下の優先度で投資しましょう。\n`;
    } else if (score.totalScore >= 55) {
      totalAdvice += `です。以下の優先順位で投資することでスコアアップが期待できます。\n`;
    } else {
      totalAdvice += `で改善が必要な状態です。以下の優先順位で早急に分散投資を進めましょう。\n`;
    }

    // 各業種のギャップを計算（目標比率 - 現在比率）
    interface SectorGap {
      sector: string;
      rank: string;
      weight: number;
      currentRatio: number;
      targetRatio: number;
      gap: number;
      isReit: boolean;
    }

    const sectorGaps: SectorGap[] = sectorMaster
      .filter((master) => master.targetRatio > 0)
      .map((master) => {
        const current = sectorRatios.find((r) => r.sector === master.sectorName)?.ratio || 0;
        const gap = Math.max(master.targetRatio - current, 0);
        return {
          sector: master.sectorName,
          rank: master.rank,
          weight: master.weight,
          currentRatio: current,
          targetRatio: master.targetRatio,
          gap,
          isReit: master.sectorName === "REIT",
        };
      })
      .filter((s) => s.gap > 0)
      .sort((a, b) => {
        // ランク優先度（A > B > C）× ギャップの大きさ × weight
        const rankScore = (s: SectorGap) => {
          if (s.rank === "A") return 3;
          if (s.rank === "B") return 2;
          return 1;
        };
        const scoreA = rankScore(a) * a.gap * a.weight;
        const scoreB = rankScore(b) * b.gap * b.weight;
        return scoreB - scoreA;
      });

    // REITが未保有なら優先度を上げる
    const reitGap = sectorGaps.find((s) => s.isReit);
    if (reitGap && score.reitScore === 0) {
      const reitIndex = sectorGaps.indexOf(reitGap);
      if (reitIndex > 2) {
        sectorGaps.splice(reitIndex, 1);
        sectorGaps.splice(2, 0, reitGap);
      }
    }

    // 上位5業種を選択
    const top5 = sectorGaps.slice(0, 5);

    if (top5.length > 0) {
      // ギャップの合計を計算して配分比率を決定
      const totalGapScore = top5.reduce((sum, s) => {
        const rankScore = s.rank === "A" ? 3 : s.rank === "B" ? 2 : 1;
        return sum + rankScore * s.gap * s.weight;
      }, 0);

      let remaining = budget;
      const allocations: string[] = [];

      top5.forEach((s, i) => {
        const rankScore = s.rank === "A" ? 3 : s.rank === "B" ? 2 : 1;
        const ratio = (rankScore * s.gap * s.weight) / totalGapScore;
        const amount = i === top5.length - 1
          ? remaining
          : Math.floor(budget * ratio / 10000) * 10000;

        remaining -= amount;

        const gapText = s.currentRatio === 0
          ? "未保有"
          : `現在${s.currentRatio.toFixed(1)}%→目標${s.targetRatio}%`;

        allocations.push(
          `  優先度${i + 1}（${s.rank}ランク）${s.sector}：約${amount.toLocaleString()}円　[${gapText}]`
        );
      });

      totalAdvice += `\n推奨投資配分：\n${allocations.join("\n")}`;

      if (remaining > 0) {
        totalAdvice += `\n  残り約${remaining.toLocaleString()}円：既存高配当銘柄の買い増しまたは現金確保`;
      }
    } else {
      totalAdvice += `\n不足している業種はありません。投資余力${budget.toLocaleString()}円は以下に活用しましょう。\n`;
      totalAdvice += `  ・配当利回りの高い既存銘柄の買い増し\n`;
      totalAdvice += `  ・新規高配当銘柄の発掘\n`;
      totalAdvice += `  ・市場下落時の買い増し用として現金確保`;
    }

    sections.push(totalAdvice);
  }

  return sections.join("\n\n");
}
export async function POST(request: NextRequest) {
  try {
    const { budget } = await request.json();

    const { data: rows, error } = await supabaseAdmin
      .from("holdings")
      .select("*")
      .eq("user_id", DEMO_USER_ID);

    if (error) throw error;
    if (!rows || rows.length === 0) {
      return NextResponse.json({
        comment: "まだ銘柄が登録されていません。まずは保有銘柄を登録してください。",
      });
    }

    const holdings: Holding[] = await Promise.all(
      rows.map(async (row) => {
        try {
          const yahoo = await getStockData(row.stock_code);
          return {
            stockCode:      row.stock_code,
            companyName:    yahoo.companyName || row.company_name,
            sector:         row.sector,
            currentPrice:   yahoo.currentPrice || row.purchase_price,
            annualDividend: row.annual_dividend || 0,
            shares:         row.shares,
            purchasePrice:  row.purchase_price,
          };
        } catch {
          return {
            stockCode:      row.stock_code,
            companyName:    row.company_name,
            sector:         row.sector,
            currentPrice:   row.purchase_price,
            annualDividend: row.annual_dividend || 0,
            shares:         row.shares,
            purchasePrice:  row.purchase_price,
          };
        }
      })
    );

    const sectorRatios     = calculateSectorRatios(holdings);
    const dividendRatios   = calculateDividendRatios(holdings);
    const score            = calculatePortfolioScore(holdings);
    const summary          = summarizePortfolio(holdings);
    const deficientSectors = getDeficientSectors(sectorRatios);

    const comment = generateComment(
      score, summary, deficientSectors, sectorRatios, dividendRatios, holdings, budget || 0
    );

    return NextResponse.json({ comment, score });
  } catch (error: any) {
    console.error("AI diagnosis error:", error);
    return NextResponse.json({ error: "診断に失敗しました" }, { status: 500 });
  }
}