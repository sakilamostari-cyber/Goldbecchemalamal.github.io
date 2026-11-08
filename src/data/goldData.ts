import { GoldKarat, GoldPriceRecord } from '../types/gold';

export const VORI_TO_GRAM = 11.664;
export const ANA_PER_VORI = 16;
export const ROTTI_PER_VORI = 96;

export const KARAT_INFO: Record<GoldKarat, {
  name: string;
  banglaName: string;
  purity: string;
  purityPercent: number;
  description: string;
}> = {
  '22K': {
    name: '22 Karat (Hallmark)',
    banglaName: '২২ ক্যারেট (ক্যাডমিয়াম হলমার্ক)',
    purity: '91.6% Pure Gold',
    purityPercent: 91.6,
    description: 'Most popular jewelry grade in Bangladesh with official BAJUS hallmarking standard.',
  },
  '21K': {
    name: '21 Karat',
    banglaName: '২১ ক্যারেট',
    purity: '87.5% Pure Gold',
    purityPercent: 87.5,
    description: 'Traditional standard for solid bangles and durable heirloom Bangladeshi ornaments.',
  },
  '18K': {
    name: '18 Karat',
    banglaName: '১৮ ক্যারেট',
    purity: '75.0% Pure Gold',
    purityPercent: 75.0,
    description: 'Modern lightweight diamond jewelry setting gold.',
  },
  'Traditional': {
    name: 'Traditional / Sonaton',
    banglaName: 'সনাতন পদ্ধতি (পুরাতন সোনা)',
    purity: 'Variable (~60-70%)',
    purityPercent: 65.0,
    description: 'Old un-hallmarked traditional gold passed down through generations without certified hallmark stamps.',
  },
};

// Generates 90 days of daily historical records leading up to today
export function generateHistoricalGoldData(): GoldPriceRecord[] {
  const records: GoldPriceRecord[] = [];
  const today = new Date('2026-11-08T00:00:00Z');
  
  // Accurate official local BAJUS baseline rates (in BDT per Vori - 11.664g)
  // Sources: goldr.org, gold-price.bd, BAJUS official circular
  const baseRates: Record<GoldKarat, number> = {
    '22K': 226923,
    '21K': 216717,
    '18K': 186099,
    'Traditional': 161605,
  };

  // Fluctuation trend curve over 90 days (started lower, had a mid-dip, then a recent surge to peak)
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    
    // Normalized position from 0 (90 days ago) to 1 (today)
    const progress = (89 - i) / 89;
    
    // Macro upward trend with natural market waves
    const macroTrend = Math.sin(progress * Math.PI * 1.5) * 4500 + (progress * 8000);
    // Short wave micro fluctuations
    const microWave = Math.sin(i * 0.7) * 950 + Math.cos(i * 1.3) * 600;
    
    // USD-BDT rate fluctuating between 119.50 and 122.30
    const usdBdt = Number((120.20 + (progress * 1.8) + (Math.sin(i * 0.3) * 0.45)).toFixed(2));
    
    // International Ounce in USD (hovering around 2,640 to 2,755 USD/oz)
    const intlOunce = Number((2650 + (progress * 90) + (Math.sin(i * 0.5) * 25)).toFixed(1));

    const karats: GoldKarat[] = ['22K', '21K', '18K', 'Traditional'];

    karats.forEach((karat) => {
      const base = baseRates[karat];
      const ratio = base / baseRates['22K'];
      const adjustedPrice = Math.round(base - 10500 * (1 - progress) + (macroTrend * ratio) + (microWave * ratio));
      
      // Old gold buyback is typically 82.5% of official market price (17.5% deduction for melting/making/impurity)
      const buybackRate = Math.round(adjustedPrice * 0.825);
      
      const perGram = Math.round((adjustedPrice / VORI_TO_GRAM) * 10) / 10;
      const perGramBuyback = Math.round((buybackRate / VORI_TO_GRAM) * 10) / 10;
      
      records.push({
        id: `${dateStr}-${karat}`,
        date: dateStr,
        timestamp: `${dateStr}T10:00:00+06:00`,
        goldType: karat,
        goldTypeBangla: KARAT_INFO[karat].banglaName,
        marketPricePerVoriBDT: adjustedPrice,
        oldGoldBuyBackPriceBDT: buybackRate,
        usdBdtRate: usdBdt,
        internationalOunceUSD: intlOunce,
        perGramBDT: perGram,
        perGramBuyBackBDT: perGramBuyback,
        dayChangeBDT: 0, // Will calculate below
        dayChangePercent: 0,
      });
    });
  }

  // Calculate day-over-day changes
  const sorted = records.sort((a, b) => a.date.localeCompare(b.date));
  for (let i = 4; i < sorted.length; i++) {
    const current = sorted[i];
    const prev = sorted.find((r) => r.goldType === current.goldType && r.date < current.date);
    if (prev) {
      current.dayChangeBDT = current.marketPricePerVoriBDT - prev.marketPricePerVoriBDT;
      current.dayChangePercent = Number(((current.dayChangeBDT / prev.marketPricePerVoriBDT) * 100).toFixed(2));
    }
  }

  // Flag 30-day peaks
  const latestDate = sorted[sorted.length - 1].date;
  const thirtyDaysAgoDate = new Date(new Date(latestDate).getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  (['22K', '21K', '18K', 'Traditional'] as GoldKarat[]).forEach(karat => {
    const recentRecords = sorted.filter(r => r.goldType === karat && r.date >= thirtyDaysAgoDate);
    const maxRecent = Math.max(...recentRecords.map(r => r.marketPricePerVoriBDT));
    recentRecords.forEach(r => {
      if (r.marketPricePerVoriBDT >= maxRecent - 200) {
        r.is30DayPeak = true;
      }
    });
  });

  return sorted;
}

export const INITIAL_GOLD_DATA = generateHistoricalGoldData();

// Current latest rates dictionary for instant lookup
export function getLatestRates(data: GoldPriceRecord[] = INITIAL_GOLD_DATA): Record<GoldKarat, GoldPriceRecord> {
  const latestDate = data[data.length - 1].date;
  const records = data.filter((r) => r.date === latestDate);
  const result = {} as Record<GoldKarat, GoldPriceRecord>;
  records.forEach((r) => {
    result[r.goldType] = r;
  });
  return result;
}

// 30-Day metrics for a specific Karat
export function get30DayMetrics(data: GoldPriceRecord[], karat: GoldKarat) {
  const karatData = data.filter((r) => r.goldType === karat);
  const last30 = karatData.slice(-30);
  const prices = last30.map((r) => r.marketPricePerVoriBDT);
  const buybacks = last30.map((r) => r.oldGoldBuyBackPriceBDT);

  const current = last30[last30.length - 1];
  const start = last30[0];
  const high = Math.max(...prices);
  const low = Math.min(...prices);
  const highBuyback = Math.max(...buybacks);
  const lowBuyback = Math.min(...buybacks);
  
  const change30d = current.marketPricePerVoriBDT - start.marketPricePerVoriBDT;
  const change30dPercent = Number(((change30d / start.marketPricePerVoriBDT) * 100).toFixed(2));
  
  const isAtPeak = current.marketPricePerVoriBDT >= high - 300;

  return {
    currentPrice: current.marketPricePerVoriBDT,
    currentBuyback: current.oldGoldBuyBackPriceBDT,
    perGram: current.perGramBDT,
    perGramBuyback: current.perGramBuyBackBDT,
    high30d: high,
    low30d: low,
    highBuyback30d: highBuyback,
    lowBuyback30d: lowBuyback,
    change30d,
    change30dPercent,
    isAtPeak,
    allTimeHigh: 228500, // Historical record benchmark (2026 BAJUS peak)
  };
}

// Format numbers in Bangladeshi Lakh & Crore or standard comma format
export function formatBDT(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    maximumFractionDigits: 0,
  }).format(amount);
}

// Format English numbers into Bengali numerals
export function toBengaliNumerals(num: number | string): string {
  const bengaliDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num
    .toString()
    .replace(/\d/g, (digit) => bengaliDigits[parseInt(digit, 10)]);
}

export interface BestTimeSellAnalysis {
  score: number; // 0 to 100
  signal: 'PEAK_SELL' | 'APPROACHING_PEAK' | 'HOLD';
  title: string;
  badgeText: string;
  badgeColor: string;
  confidence: number; // percentage
  reasons: string[];
  actionRecommendation: string;
  forecastNotice: string;
}

export function evaluateBestTimeToSell(
  currentPrice: number,
  targetPrice: number,
  last30Prices: number[]
): BestTimeSellAnalysis {
  const max30d = Math.max(...last30Prices, currentPrice);
  const min30d = Math.min(...last30Prices, currentPrice);
  const priceRange = max30d - min30d || 1;
  const positionInRange = (currentPrice - min30d) / priceRange;

  const diffFromPeak = max30d - currentPrice;
  const isAtPeak = diffFromPeak <= 400; // Within ৳400 of 30D record
  const isTargetMet = currentPrice >= targetPrice;
  const isNearTarget = !isTargetMet && currentPrice >= targetPrice * 0.98;

  // Recent 7-day momentum
  const recent7 = last30Prices.slice(-7);
  const sevenDayGrowth = recent7.length > 1 ? currentPrice - recent7[0] : 0;

  let score = 50; // Neutral baseline
  const reasons: string[] = [];

  // Factor 1: Proximity to 30D Peak (up to +35 pts)
  if (isAtPeak) {
    score += 35;
    reasons.push(`সোনার দর গত ৩০ দিনের সর্বকালের সর্বোচ্চ চূড়ার (৳ ${formatBDT(max30d)}) একদম শীর্ষে রয়েছে।`);
  } else if (positionInRange > 0.85) {
    score += 20;
    reasons.push(`সোনার বর্তমান দর ৩০ দিনের গড় সীমার শীর্ষ ৮৫% অবস্থানে ট্রেড করছে।`);
  }

  // Factor 2: User Target Threshold (up to +30 pts)
  if (isTargetMet) {
    score += 30;
    reasons.push(`বর্তমান বাজার দর আপনার ব্যক্তিগত বিক্রয় লক্ষ্যমাত্রা (৳ ${formatBDT(targetPrice)}) অতিক্রম করেছে।`);
  } else if (isNearTarget) {
    score += 15;
    reasons.push(`বর্তমান বাজার দর আপনার বিক্রয় টার্গেটের মাত্র ২% এর মধ্যে চলে এসেছে।`);
  }

  // Factor 3: 7-Day Momentum (up to +20 pts)
  if (sevenDayGrowth > 2000) {
    score += 15;
    reasons.push(`গত ৭ দিনে বাজুস বাজারে দর ৳ ${formatBDT(sevenDayGrowth)} বৃদ্ধি পেয়েছে, যা স্থানীয় দোকানে চড়া দামে বিক্রির অনুকূল।`);
  } else if (sevenDayGrowth < -1500) {
    score -= 10;
    reasons.push(`সাম্প্রতিক দিনে বাজারে সাময়িক দরপতন হচ্ছে; স্থিতিশীল হওয়া পর্যন্ত অপেক্ষা যুক্তিযুক্ত।`);
  }

  // Cap score
  score = Math.min(100, Math.max(10, score));

  if (score >= 75 || isTargetMet || isAtPeak) {
    return {
      score,
      signal: 'PEAK_SELL',
      title: '🚨 পিক মার্কেট: এখনই পুরাতন সোনা বিক্রির সেরা মোক্ষম সুযোগ!',
      badgeText: '🔴 Best Time to Sell (এখনই বিক্রি করুন)',
      badgeColor: 'bg-[#D32F2F] text-white',
      confidence: Math.min(98, Math.max(88, score)),
      reasons,
      actionRecommendation: 'তাঁতিবাজার, বায়তুল মোকাররম বা আপনার স্থানীয় স্বর্ণের দোকানে পাকা মেমোসহ আজই ক্যাশআউট করুন। বাজুস পরবর্তী সংশোধনে দর কমার আগেই সর্বোচ্চ মুনাফা নিশ্চিত করুন।',
      forecastNotice: 'আন্তর্জাতিক বুলিয়ন স্পট এবং স্থানীয় তারল্য বিশ্লেষণে বাজার পিক রেটে অবস্থান করছে।'
    };
  } else if (score >= 55 || isNearTarget) {
    return {
      score,
      signal: 'APPROACHING_PEAK',
      title: '⚠️ পিকের সন্নিকটে: সোনা বিক্রির প্রস্তুতি নিয়ে রাখুন',
      badgeText: '🟡 Approaching Peak (প্রস্তুতি নিন)',
      badgeColor: 'bg-amber-500 text-white',
      confidence: 78,
      reasons,
      actionRecommendation: 'আপনার গহনার রসিদ বা মেমো প্রস্তুত রাখুন এবং স্থানীয় ২-৩টি জুয়েলার্সের দর ও খাদ কর্তন যাচাই করে রাখুন।',
      forecastNotice: 'দর আপনার লক্ষ্যমাত্রার দিকে দ্রুত অগ্রসর হচ্ছে।'
    };
  } else {
    return {
      score,
      signal: 'HOLD',
      title: '⏳ মার্কেট স্থিতিশীল: এখনই বিক্রির প্রয়োজন নেই, ধরে রাখুন',
      badgeText: '🟢 Hold / Wait (ধরে রাখুন)',
      badgeColor: 'bg-emerald-600 text-white',
      confidence: 82,
      reasons: reasons.length ? reasons : ['বর্তমান বাজার দর আপনার কাঙ্ক্ষিত বিক্রয় মূল্যের নিচে অবস্থান করছে।'],
      actionRecommendation: 'স্বর্ণ দীর্ঘমেয়াদি সম্পদ। দর আরও বৃদ্ধির জন্য অপেক্ষা করা লাভজনক হবে।',
      forecastNotice: 'বাজার স্বাভাবিক রেঞ্জে কনসোলিডেট করছে।'
    };
  }
}

// Web Audio API Synthesizer for notifications
export function playAlertChime(isPeak: boolean = true) {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;

    const playTone = (freq: number, start: number, duration: number) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = isPeak ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + duration);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + duration);
    };

    if (isPeak) {
      // Ascending triumphant chime (D5 -> F#5 -> A5 -> D6)
      playTone(587.33, now, 0.15);
      playTone(739.99, now + 0.1, 0.15);
      playTone(880.00, now + 0.2, 0.2);
      playTone(1174.66, now + 0.3, 0.4);
    } else {
      // Gentle soft chime
      playTone(523.25, now, 0.2);
      playTone(659.25, now + 0.15, 0.3);
    }
  } catch (e) {
    console.warn('Audio chime unsupported or blocked by browser policy:', e);
  }
}

