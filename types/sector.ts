export interface Sector {
  sector_name: string;
  rank: string;
  target_ratio: number;
  max_ratio: number;
  weight: number;
}

export interface RecommendedStock {
  stock_code: string;
  company_name: string;
  sector: string;
  priority: number;
  current_price?: number;
  annual_dividend?: number;
  dividend_yield?: number;
}

export interface Recommendation {
  stock: RecommendedStock;
  reason: string;
  estimatedCost: number;
  scoreImprovement: number;
}
