export interface Holding {
  id: string;
  user_id: string;
  stock_code: string;
  company_name: string;
  sector: string;
  shares: number;
  purchase_price: number;
  annual_dividend: number;
  account_type: string;
  created_at: string;
  // Live data
  current_price?: number;
  dividend_yield?: number;
}

export interface HoldingWithValue extends Holding {
  current_value: number;
  annual_dividend_total: number;
  annual_dividend_total_after_tax: number;
  gain_loss: number;
  gain_loss_pct: number;
}

// 税引後配当計算
// NISA: 非課税
// 特定口座: 20.315%課税
export function calcAfterTaxDividend(dividend: number, accountType: string): number {
  if (accountType === "NISA") return dividend;
  return dividend * (1 - 0.20315);
}