export type GoldKarat = '22K' | '21K' | '18K' | 'Traditional';

export interface GoldPriceRecord {
  id: string;
  date: string; // YYYY-MM-DD
  timestamp: string; // ISO String
  goldType: GoldKarat;
  goldTypeBangla: string;
  marketPricePerVoriBDT: number; // Official BAJUS Rate
  oldGoldBuyBackPriceBDT: number; // ~80% - 85% of market rate
  usdBdtRate: number; // E.g., 121.80
  internationalOunceUSD: number; // E.g., 2,735 USD/oz
  perGramBDT: number; // marketPricePerVoriBDT / 11.664
  perGramBuyBackBDT: number;
  dayChangeBDT: number;
  dayChangePercent: number;
  is30DayPeak?: boolean;
}

export interface UserSellingParameters {
  targetPricePerVori: number; // Custom expected selling price
  selectedKarat: GoldKarat;
  buybackPercentage: number; // 80 to 85%
  weightVori: number;
  weightAna: number;
  weightRotti: number;
  weightGram: number;
  inputUnit: 'vori' | 'gram';
  originalPurchasePricePerVori: number;
  shopDeductionPercent: number; // Typically 15% - 20%
}

export interface CalculatedFieldItem {
  id: string;
  fieldName: string;
  category: 'Metric' | 'Dimension' | 'Alert / Logic';
  formula: string;
  description: string;
  dataType: 'Number (Currency)' | 'Text' | 'Boolean' | 'Percent';
  exampleResult: string;
}

export interface LookerStudioGuideStep {
  stepNumber: number;
  title: string;
  banglaTitle: string;
  summary: string;
  actionItems: string[];
  lookerStudioTip: string;
  troubleshootingNote?: string;
}
