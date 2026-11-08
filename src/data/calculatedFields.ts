import { CalculatedFieldItem } from '../types/gold';

export const LOOKER_CALCULATED_FIELDS: CalculatedFieldItem[] = [
  {
    id: 'old_gold_buyback',
    fieldName: 'Old_Gold_BuyBack_Price_BDT',
    category: 'Metric',
    dataType: 'Number (Currency)',
    formula: 'Market_Price_Per_Vori_BDT * 0.825',
    description: 'Calculates the real old-gold cash buyback price per Vori by applying BAJUS standard ~17.5% reduction (yielding 82.5% net value).',
    exampleResult: '৳ 117,851 BDT / Vori',
  },
  {
    id: 'price_per_gram',
    fieldName: 'Market_Price_Per_Gram_BDT',
    category: 'Metric',
    dataType: 'Number (Currency)',
    formula: 'ROUND(Market_Price_Per_Vori_BDT / 11.664, 2)',
    description: 'Converts official BAJUS per-Vori (11.664 grams) price into exact international gram price in BDT.',
    exampleResult: '৳ 12,247.08 BDT / gram',
  },
  {
    id: 'old_gold_gram_buyback',
    fieldName: 'Old_Gold_BuyBack_Per_Gram_BDT',
    category: 'Metric',
    dataType: 'Number (Currency)',
    formula: 'ROUND(Old_Gold_BuyBack_Price_BDT / 11.664, 2)',
    description: 'Exact cash-in-hand value received per gram when selling old gold ornaments.',
    exampleResult: '৳ 10,103.82 BDT / gram',
  },
  {
    id: 'status_badge',
    fieldName: 'Selling_Status_Badge',
    category: 'Alert / Logic',
    dataType: 'Text',
    formula: `CASE 
  WHEN Market_Price_Per_Vori_BDT >= Target_Selling_Price_Parameter THEN '🔴 Peak - Best Time to Sell!'
  WHEN Market_Price_Per_Vori_BDT >= (Target_Selling_Price_Parameter * 0.98) THEN '🟡 Approaching Target'
  ELSE '🟢 Hold / Buy'
END`,
    description: 'Evaluates current market price against user custom selling target parameter. Yields colored status indicator in scorecard & table visual.',
    exampleResult: '🔴 Peak - Best Time to Sell!',
  },
  {
    id: 'peak_alert_banner',
    fieldName: 'Peak_Market_Notification_Banner',
    category: 'Alert / Logic',
    dataType: 'Text',
    formula: `CASE 
  WHEN Market_Price_Per_Vori_BDT >= Target_Selling_Price_Parameter 
    THEN '🚨 PEAK ALERT: Excellent time to sell your old gold now!'
  WHEN Market_Price_Per_Vori_BDT >= (Target_Selling_Price_Parameter * 0.98)
    THEN '⚠️ NEAR PEAK: Market within 2% of your target selling threshold'
  ELSE '🛡️ Market Consolidated: Hold your gold for higher returns'
END`,
    description: 'Looker Studio calculated formula feeding the prominent warning text banner at the top of the report canvas.',
    exampleResult: '🚨 PEAK ALERT: Excellent time to sell your old gold now!',
  },
  {
    id: 'total_cash_realization',
    fieldName: 'Net_Cash_Realization_BDT',
    category: 'Metric',
    dataType: 'Number (Currency)',
    formula: `(Weight_Vori_Input + (Weight_Ana_Input / 16) + (Weight_Rotti_Input / 96)) * Old_Gold_BuyBack_Price_BDT`,
    description: 'Total actual cash proceeds expected in BDT when liquidating mixed old family ornaments based on weight input parameters.',
    exampleResult: '৳ 353,553 BDT (for 3 Vori)',
  },
  {
    id: 'net_profit_estimate',
    fieldName: 'Net_Profit_Over_Purchase_BDT',
    category: 'Metric',
    dataType: 'Number (Currency)',
    formula: `Net_Cash_Realization_BDT - (Weight_Vori_Input * Original_Purchase_Price_Parameter)`,
    description: 'Lifetime capital gain in BDT earned on gold jewelry compared against historical buying price (e.g. 50,000 BDT/vori).',
    exampleResult: '+ ৳ 203,553 BDT Profit',
  },
  {
    id: 'usd_parity_premium',
    fieldName: 'USD_Import_Parity_Ratio',
    category: 'Dimension',
    dataType: 'Percent',
    formula: `ROUND(((Market_Price_Per_Vori_BDT / (International_Gold_USD_Oz * (11.664 / 31.1035) * USD_BDT_Rate)) - 1) * 100, 2)`,
    description: 'Measures local Bangladesh domestic premium over world spot gold parity (reflects duty, import tariff & local liquidity).',
    exampleResult: '12.4% Domestic Premium',
  },
];

export const LOOKER_PARAMETERS_CONFIG = [
  {
    name: 'Target_Selling_Price_Parameter',
    displayName: 'Target Selling Price / Vori (BDT)',
    dataType: 'Number (Integer)',
    defaultValue: 140000,
    range: '100,000 to 200,000 BDT',
    purpose: 'Allows report viewers to dynamically test their personal sell trigger price directly inside Looker Studio.',
  },
  {
    name: 'Weight_Vori_Input',
    displayName: 'Gold Weight in Vori (ভরি)',
    dataType: 'Number (Float)',
    defaultValue: 2.5,
    range: '0.1 to 100 Vori',
    purpose: 'User-adjustable input parameter in Looker Studio for portfolio old gold weight.',
  },
  {
    name: 'Deduction_Percentage_Parameter',
    displayName: 'Jeweller Deduction Rate (%)',
    dataType: 'Number (Float)',
    defaultValue: 17.5,
    range: '10% to 25%',
    purpose: 'Controls shopkeeper old gold buyback markdown (BAJUS baseline is 15-20%).',
  },
  {
    name: 'Original_Purchase_Price_Parameter',
    displayName: 'Original Purchase Price (BDT/Vori)',
    dataType: 'Number (Integer)',
    defaultValue: 65000,
    range: '20,000 to 140,000 BDT',
    purpose: 'Calculates historical profit yield when liquidating old inherited gold.',
  },
];
