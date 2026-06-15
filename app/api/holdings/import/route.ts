import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getStockData } from "@/lib/yahooFinance";
import { sectorMaster } from "@/lib/portfolioAnalyzer";
import { readFileSync } from "fs";
import { join } from "path";

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

// JPXの全銘柄業種データを読み込む
let jpxSectors: Record<string, string> = {};
try {
  const filePath = join(process.cwd(), "public", "jpx_sectors.json");
  jpxSectors = JSON.parse(readFileSync(filePath, "utf-8"));
} catch {
  console.error("JPXデータの読み込みに失敗しました");
}

const SECTOR_NAME_MAP: Record<string, string> = {
  "水産・農林業": "水産・農林業",
  "鉱業": "鉱業",
  "建設業": "建設業",
  "食料品": "食料品",
  "繊維製品": "繊維製品",
  "パルプ・紙": "パルプ・紙",
  "化学": "化学",
  "医薬品": "医薬品",
  "石油・石炭製品": "石油・石炭製品",
  "ゴム製品": "ゴム製品",
  "ガラス・土石製品": "ガラス・土石製品",
  "鉄鋼": "鉄鋼",
  "非鉄金属": "非鉄金属",
  "金属製品": "金属製品",
  "機械": "機械",
  "電気機器": "電気機器",
  "輸送用機器": "輸送用機器",
  "精密機器": "精密機器",
  "その他製品": "その他製品",
  "電気・ガス業": "電力・ガス業",
  "陸運業": "陸運業",
  "海運業": "海運業",
  "空運業": "空運業",
  "倉庫・運輸関連業": "倉庫・運輸関連業",
  "情報・通信業": "情報・通信業",
  "卸売業": "卸売業",
  "小売業": "小売業",
  "銀行業": "銀行業",
  "証券、商品先物取引業": "証券・商品先物取引業",
  "保険業": "保険業",
  "その他金融業": "その他金融業",
  "不動産業": "不動産業",
  "サービス業": "サービス業",
  "ETF": "ETF",
  "REIT": "REIT",
};

function getSectorFromJPX(code: string): string {
  const jpxSector = jpxSectors[code];
  if (jpxSector) {
    return SECTOR_NAME_MAP[jpxSector] || jpxSector;
  }
  return "情報・通信業";
}

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

      const cols = trimmed.split(",").map((c) => c.trim().replace(/"/g, ""));
      const stockCode     = cols[0];
      const shares        = parseInt(cols[1], 10);
      const purchasePrice = parseFloat(cols[2]);
      const annualDividend = parseFloat(cols[3]) || 0;
      const accountType   = cols[4] || "特定口座";

      if (!stockCode || isNaN(shares) || isNaN(purchasePrice)) {
        results.failed.push(stockCode || "不明");
        continue;
      }

      try {
        const stockData = await getStockData(stockCode);

        // JPXデータから業種を取得
        const sector = getSectorFromJPX(stockCode) || sectorMaster[0].sectorName;

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