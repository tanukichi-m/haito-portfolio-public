import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { getStockData } from "@/lib/yahooFinance";
import { sectorMaster } from "@/lib/portfolioAnalyzer";
import { getJpxSector } from "@/lib/jpxSectors";
import { z } from "zod";

const DEMO_USER_ID = "00000000-0000-0000-0000-000000000001";

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
    const finalSector = getJpxSector(stockCode) || sector || sectorMaster[0].sectorName;

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