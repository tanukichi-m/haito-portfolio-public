import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getStockData } from "@/lib/yahooFinance";
import { sectorMaster } from "@/lib/portfolioAnalyzer";
import { z } from "zod";
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

const holdingSchema = z.object({
  stockCode: z.string().min(1).max(10),
  shares: z.number().int().positive(),
  purchasePrice: z.number().positive(),
  annualDividend: z.number().min(0).optional(),
  sector: z.string().optional(),
  accountType: z.string().optional(),
});

export async function GET() {
  try {
    const { data: holdings, error } = await supabaseAdmin
      .from("holdings")
      .select("*")
      .eq("user_id", DEMO_USER_ID)
      .order("stock_code", { ascending: true });

    if (error) throw error;
    if (!holdings || holdings.length === 0) return NextResponse.json([]);

    const enriched = await Promise.allSettled(
      holdings.map(async (h) => {
        try {
          const yahoo = await getStockData(h.stock_code);
          const currentPrice = yahoo.currentPrice || h.purchase_price;
          const annualDividend = h.annual_dividend || 0;
          return {
            ...h,
            current_price: currentPrice,
            dividend_yield: annualDividend > 0 && currentPrice > 0
              ? (annualDividend / currentPrice) * 100
              : 0,
            annual_dividend: annualDividend,
            current_value: currentPrice * h.shares,
            annual_dividend_total: annualDividend * h.shares,
            gain_loss: (currentPrice - h.purchase_price) * h.shares,
            gain_loss_pct: ((currentPrice - h.purchase_price) / h.purchase_price) * 100,
          };
        } catch {
          const annualDividend = h.annual_dividend || 0;
          return {
            ...h,
            current_price: h.purchase_price,
            dividend_yield: 0,
            annual_dividend: annualDividend,
            current_value: h.purchase_price * h.shares,
            annual_dividend_total: annualDividend * h.shares,
            gain_loss: 0,
            gain_loss_pct: 0,
          };
        }
      })
    );

    const result = enriched
      .map((r) => (r.status === "fulfilled" ? r.value : null))
      .filter(Boolean);

    return NextResponse.json(result);
  } catch (error) {
    console.error("GET /api/holdings error:", error);
    return NextResponse.json({ error: "データ取得に失敗しました" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const parsed = holdingSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "入力データが不正です" },
        { status: 400 }
      );
    }

    const { stockCode, shares, purchasePrice, annualDividend, sector, accountType } = parsed.data;

    const stockData = await getStockData(stockCode);

    // JPXデータから業種を取得、なければユーザー指定、なければデフォルト
    const finalSector = getSectorFromJPX(stockCode) || sector || sectorMaster[0].sectorName;

    await supabaseAdmin
      .from("users")
      .upsert(
        { id: DEMO_USER_ID, email: "demo@example.com" },
        { onConflict: "id" }
      );

    const { data, error } = await supabaseAdmin
      .from("holdings")
      .upsert(
        {
          user_id: DEMO_USER_ID,
          stock_code: stockCode,
          company_name: stockData.companyName,
          sector: finalSector,
          shares,
          purchase_price: purchasePrice,
          annual_dividend: annualDividend || 0,
          account_type: accountType || "特定口座",
        },
        { onConflict: "user_id,stock_code" }
      )
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    console.error("POST /api/holdings error:", error);
    return NextResponse.json(
      { error: error.message || "銘柄登録に失敗しました" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "IDが必要です" }, { status: 400 });
  }

  try {
    const body = await request.json();
    const { shares, purchasePrice, annualDividend, sector, accountType } = body;

    const updateData: any = {};
    if (shares) updateData.shares = shares;
    if (purchasePrice) updateData.purchase_price = purchasePrice;
    if (sector) updateData.sector = sector;
    if (annualDividend !== undefined) updateData.annual_dividend = annualDividend;
    if (accountType) updateData.account_type = accountType;

    const { data, error } = await supabaseAdmin
      .from("holdings")
      .update(updateData)
      .eq("id", id)
      .eq("user_id", DEMO_USER_ID)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json(data);
  } catch (error: any) {
    return NextResponse.json({ error: "更新に失敗しました" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "IDが必要です" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("holdings")
    .delete()
    .eq("id", id)
    .eq("user_id", DEMO_USER_ID);

  if (error) {
    return NextResponse.json({ error: "削除に失敗しました" }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}