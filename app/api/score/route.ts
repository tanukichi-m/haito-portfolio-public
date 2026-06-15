import { NextResponse } from "next/server";
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
import { calcAfterTaxDividend } from "@/types/holding";

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function GET() {
  try {
    const { data: rows, error } = await supabaseAdmin
      .from("holdings")
      .select("*")
      .eq("user_id", DEMO_USER_ID);

    if (error) throw error;
    if (!rows || rows.length === 0) {
      return NextResponse.json({
        score: {
          totalScore: 0, importanceScore: 0, completionScore: 0,
          concentrationScore: 0, dividendRiskScore: 0, reitScore: 0, label: "未診断",
        },
        sectorRatios: [],
        dividendRatios: [],
        deficientSectors: [],
        summary: {
          totalValue: 0, totalDividend: 0, totalCost: 0,
          totalDividendAfterTax: 0,
        },
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

    // 税引後配当合計
    const totalDividendAfterTax = rows.reduce((sum, row) => {
      const dividend = (row.annual_dividend || 0) * row.shares;
      return sum + calcAfterTaxDividend(dividend, row.account_type || "特定口座");
    }, 0);

    const sectorRatios     = calculateSectorRatios(holdings);
    const dividendRatios   = calculateDividendRatios(holdings);
    const score            = calculatePortfolioScore(holdings);
    const summary          = summarizePortfolio(holdings);
    const deficientSectors = getDeficientSectors(sectorRatios);

    const fullSectorRatios = sectorMaster.map((master) => {
      const actual = sectorRatios.find((r) => r.sector === master.sectorName);
      return {
        sector:       master.sectorName,
        rank:         master.rank,
        targetRatio:  master.targetRatio,
        maxRatio:     master.maxRatio,
        weight:       master.weight,
        marketValue:  actual?.marketValue || 0,
        ratio:        actual?.ratio || 0,
        isDeficient:  (actual?.ratio || 0) < master.targetRatio * 0.5,
        isOverweight: (actual?.ratio || 0) > master.maxRatio,
      };
    });

    const totalGainLoss = holdings.reduce((sum, h) => {
      return sum + (h.currentPrice - h.purchasePrice) * h.shares;
    }, 0);

// 取得利回り計算（取得額ベース）
    const costYield = summary.totalCost > 0
      ? (summary.totalDividend / summary.totalCost) * 100
      : 0;
    const costYieldAfterTax = summary.totalCost > 0
      ? (totalDividendAfterTax / summary.totalCost) * 100
      : 0;

    return NextResponse.json({
      score,
      sectorRatios: fullSectorRatios,
      dividendRatios,
      deficientSectors,
      summary: {
        ...summary,
        totalDividendAfterTax,
        totalGainLoss,
        costYield,
        costYieldAfterTax,
      },
    });
  } catch (err: any) {
    console.error("GET /api/score error:", err?.message, err);
    return NextResponse.json({ error: err?.message || "スコア計算に失敗しました" }, { status: 500 });
  }
}