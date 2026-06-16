import { NextRequest, NextResponse } from "next/server";
import { getStockData } from "@/lib/yahooFinance";
import { readFileSync } from "fs";
import { join } from "path";

// JPXの全銘柄業種データを読み込む
let jpxSectors: Record<string, string> = {};
try {
  const filePath = join(process.cwd(), "public", "jpx_sectors.json");
  jpxSectors = JSON.parse(readFileSync(filePath, "utf-8"));
} catch {
  console.error("JPXデータの読み込みに失敗しました");
}

// JPXの業種名をアプリの業種名に変換
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

function getSectorFromCode(code: string): string {
  const jpxSector = jpxSectors[code];
  if (jpxSector) {
    return SECTOR_NAME_MAP[jpxSector] || jpxSector;
  }
  return "情報・通信業";
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({ error: "証券コードが必要です" }, { status: 400 });
  }

  try {
    const data = await getStockData(code);
    const sector = getSectorFromCode(code);
    return NextResponse.json({ ...data, sector });
  } catch (error) {
    return NextResponse.json(
      { error: `銘柄 ${code} のデータ取得に失敗しました` },
      { status: 500 }
    );
  }
}// force redeploy 2026年 6月16日 火曜日 11時14分26秒 JST
