export interface StockData {
  stockCode: string;
  companyName: string;
  currentPrice: number;
  dividendYield: number;
  annualDividend: number;
  sector?: string;
}

function guessSectorFromCode(code: string): string {
  const num = parseInt(code, 10);
  if (num >= 3000 && num <= 3299) return "REIT";
  if (num >= 2000 && num <= 2999) return "食料品";
  if (num >= 1300 && num <= 1999) return "建設業";
  if (num >= 4500 && num <= 4599) return "医薬品";
  if (num >= 4000 && num <= 4499) return "化学";
  if (num >= 6700 && num <= 6999) return "電気機器";
  if (num >= 6000 && num <= 6699) return "機械";
  if (num >= 7000 && num <= 7299) return "輸送用機器";
  if (num >= 7300 && num <= 7999) return "小売業";
  if (num >= 8300 && num <= 8399) return "銀行業";
  if (num >= 8400 && num <= 8499) return "保険業";
  if (num >= 8000 && num <= 8099) return "証券・商品先物取引業";
  if (num >= 8100 && num <= 8299) return "卸売業";
  if (num >= 8500 && num <= 8949) return "不動産業";
  if (num >= 8950 && num <= 8999) return "REIT";
  if (num >= 9400 && num <= 9499) return "情報・通信業";
  if (num >= 9500 && num <= 9599) return "電力・ガス業";
  if (num >= 9000 && num <= 9399) return "陸運業";
  if (num >= 9600 && num <= 9999) return "情報・通信業";
  return "情報・通信業";
}

// 株探から日本語銘柄名を取得
async function getJapaneseName(code: string): Promise<string | null> {
  try {
    const res = await fetch(`https://kabutan.jp/stock/?code=${code}`, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const html = await res.text();

    // <title>銘柄名【証券コード】株価...</title> から取得
    const titleMatch = html.match(/<title>([^【]+)【/);
    if (titleMatch) {
      return titleMatch[1].trim();
    }

    // og:titleから取得
    const ogMatch = html.match(/property="og:title" content="([^【]+)【/);
    if (ogMatch) {
      return ogMatch[1].trim();
    }

    return null;
  } catch {
    return null;
  }
}

export async function getStockData(code: string): Promise<StockData> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${code}.T?interval=1d&range=1d`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    const json = await res.json();
    const meta = json?.chart?.result?.[0]?.meta;

    if (!meta) throw new Error("データなし");

    const currentPrice = meta.regularMarketPrice ?? 0;
    const annualDividend = 0;
    const dividendYield = 0;

    // 日本語銘柄名を株探から取得
    const japaneseName = await getJapaneseName(code);
    const companyName = japaneseName || meta.longName || meta.shortName || `株式 ${code}`;
    const sector = guessSectorFromCode(code);

    return {
      stockCode: code,
      companyName,
      currentPrice,
      dividendYield,
      annualDividend,
      sector,
    };
  } catch (error) {
    console.error(`Failed to fetch data for ${code}:`, error);
    throw new Error(`銘柄コード ${code} のデータ取得に失敗しました`);
  }
}

export async function getMultipleStockData(codes: string[]): Promise<StockData[]> {
  const results = await Promise.allSettled(
    codes.map((code) => getStockData(code))
  );
  return results
    .map((result) => (result.status === "fulfilled" ? result.value : null))
    .filter(Boolean) as StockData[];
}