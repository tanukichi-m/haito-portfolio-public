import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getStockData } from "@/lib/yahooFinance";
import {
  Holding,
  calculateSectorRatios,
  getDeficientSectors,
} from "@/lib/portfolioAnalyzer";
import { generateRecommendations } from "@/lib/recommendationEngine";

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const budget = parseInt(searchParams.get("budget") ?? "500000", 10);

  try {
    const { data: rows, error } = await supabaseAdmin
      .from("holdings")
      .select("*")
      .eq("user_id", DEMO_USER_ID);

    if (error) throw error;

    const holdings: Holding[] = await Promise.all(
      (rows || []).map(async (row) => {
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

    const { data: dbRecommended } = await supabaseAdmin
      .from("recommended_stocks")
      .select("*")
      .order("priority");

    const sectorRatios     = calculateSectorRatios(holdings);
    const deficientSectors = getDeficientSectors(sectorRatios);

    const sectorScores = sectorRatios.map((r) => ({
      sector:      r.sector,
      ratio:       r.ratio / 100,
      targetRatio: 0.05,
      maxRatio:    0.15,
      isDeficient: deficientSectors.includes(r.sector),
      isOverweight: false,
    }));

    // SimpleHolding形式に変換
    const simpleHoldings = holdings.map((h) => ({
      stock_code:            h.stockCode,
      sector:                h.sector,
      current_value:         h.currentPrice * h.shares,
      annual_dividend_total: h.annualDividend * h.shares,
    }));

    const recommendations = generateRecommendations(
      simpleHoldings,
      sectorScores,
      budget,
      dbRecommended || []
    );

    // 推奨銘柄のライブ株価を取得
    const enriched = await Promise.allSettled(
      recommendations.map(async (rec) => {
        try {
          const yahoo = await getStockData(rec.stock.stock_code);
          return {
            ...rec,
            stock: {
              ...rec.stock,
              current_price:   yahoo.currentPrice,
              annual_dividend: yahoo.annualDividend,
              dividend_yield:  yahoo.dividendYield,
            },
            estimatedCost: yahoo.currentPrice * 100,
          };
        } catch {
          return rec;
        }
      })
    );

    const result = enriched
      .map((r) => (r.status === "fulfilled" ? r.value : null))
      .filter(Boolean);

    return NextResponse.json({ recommendations: result, budget, deficientSectors });
  } catch (err) {
    console.error("GET /api/recommendations error:", err);
    return NextResponse.json({ error: "推奨取得に失敗しました" }, { status: 500 });
  }
}