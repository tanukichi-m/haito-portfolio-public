export interface PortfolioScore {
  total: number;
  sectorImportance: number;
  completionRate: number;
  concentrationRisk: number;
  dividendConcentration: number;
  label: string;
}

export interface SectorScore {
  sector: string;
  ratio: number;
  targetRatio: number;
  maxRatio: number;
  isDeficient: boolean;
  isOverweight: boolean;
}
