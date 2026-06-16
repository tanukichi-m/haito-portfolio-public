import { NextRequest, NextResponse } from "next/server";
import { getStockData } from "@/lib/yahooFinance";
import { getJpxSector } from "@/lib/jpxSectors";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "証券コードが必要です" }, { status: 400 });
  }

  try {
    const data = await getStockData(code);
    const sector = getJpxSector(code);
    return NextResponse.json({ ...data, sector });
  } catch (error) {
    return NextResponse.json(
      { error: `銘柄 ${code} のデータ取得に失敗しました` },
      { status: 500 }
    );
  }
}