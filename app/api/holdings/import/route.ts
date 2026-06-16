import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getStockData } from "@/lib/yahooFinance";
import { sectorMaster } from "@/lib/portfolioAnalyzer";
import { getJpxSector } from "@/lib/jpxSectors";

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { csv } = body;

    if (!csv) {
      return NextResponse.json({ error: "CSVデータがありません" }, { status: 400 });
    }

    const lines = csv.trim().split("\n");
    const results: { success: string[]; failed: string[] } = {
      success: [],
      failed: [],
    };

    const dataLines = lines[0].includes("証券コード") || lines[0].includes("code")
      ? lines.slice(1)
      : lines;

    await supabaseAdmin
      .from("users")
      .upsert(
        { id: DEMO_USER_ID, email: "demo@example.com" },
        { onConflict: "id" }
      );

    for (const line of dataLines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const cols = trimmed.split(",").map((c: string) => c.trim().replace(/"/g, ""));
      const stockCode      = cols[0];
      const shares         = parseInt(cols[1], 10);
      const purchasePrice  = parseFloat(cols[2]);
      const annualDividend = parseFloat(cols[3]) || 0;
      const accountType    = cols[4] || "特定口座";

      if (!stockCode || isNaN(shares) || isNaN(purchasePrice)) {
        results.failed.push(stockCode || "不明");
        continue;
      }

      try {
        const stockData = await getStockData(stockCode);
        const sector = getJpxSector(stockCode) || sectorMaster[0].sectorName;

        await supabaseAdmin
          .from("holdings")
          .upsert(
            {
              user_id: DEMO_USER_ID,
              stock_code: stockCode,
              company_name: stockData.companyName,
              sector,
              shares,
              purchase_price: purchasePrice,
              annual_dividend: annualDividend,
              account_type: accountType,
            },
            { onConflict: "user_id,stock_code" }
          );

        results.success.push(stockData.companyName);
      } catch {
        results.failed.push(stockCode);
      }
    }

    return NextResponse.json(results);
  } catch (error: any) {
    return NextResponse.json({ error: "インポートに失敗しました" }, { status: 500 });
  }
}