import React, { useState, useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Bell, 
  DollarSign, 
  Calendar, 
  Sparkles, 
  Share2, 
  Mail, 
  SlidersHorizontal, 
  ExternalLink, 
  CheckCircle2, 
  ShieldAlert, 
  Smartphone, 
  Monitor, 
  HelpCircle,
  Clock,
  Layers,
  ArrowUpRight,
  Info
} from 'lucide-react';
import { GoldKarat, GoldPriceRecord } from '../types/gold';
import { 
  INITIAL_GOLD_DATA, 
  KARAT_INFO, 
  get30DayMetrics, 
  formatBDT, 
  toBengaliNumerals, 
  VORI_TO_GRAM 
} from '../data/goldData';

interface LookerDashboardProps {
  onOpenCalculator: () => void;
  onOpenFormulas: () => void;
  onOpenGuide: () => void;
}

export const LookerDashboard: React.FC<LookerDashboardProps> = ({
  onOpenCalculator,
  onOpenFormulas,
  onOpenGuide
}) => {
  const [data] = useState<GoldPriceRecord[]>(INITIAL_GOLD_DATA);
  const [selectedKarat, setSelectedKarat] = useState<GoldKarat>('22K');
  const [timeframe, setTimeframe] = useState<'7d' | '30d' | '90d'>('30d');
  const [targetPrice, setTargetPrice] = useState<number>(140000);
  const [buybackPercent, setBuybackPercent] = useState<number>(82.5);
  const [deviceView, setDeviceView] = useState<'desktop' | 'mobile'>('desktop');
  const [hoveredPoint, setHoveredPoint] = useState<GoldPriceRecord | null>(null);
  const [showSimModal, setShowSimModal] = useState<boolean>(false);
  const [simulatedPriceDelta, setSimulatedPriceDelta] = useState<number>(0);

  // Filter records by timeframe and selected karat
  const filteredData = useMemo(() => {
    const karatRecords = data.filter((r) => r.goldType === selectedKarat);
    const sliceCount = timeframe === '7d' ? 7 : timeframe === '30d' ? 30 : 90;
    const sliced = karatRecords.slice(-sliceCount);
    
    if (simulatedPriceDelta !== 0) {
      return sliced.map((item, idx) => {
        if (idx === sliced.length - 1) {
          const newPrice = item.marketPricePerVoriBDT + simulatedPriceDelta;
          const newBuyback = Math.round(newPrice * (buybackPercent / 100));
          return {
            ...item,
            marketPricePerVoriBDT: newPrice,
            oldGoldBuyBackPriceBDT: newBuyback,
            perGramBDT: Math.round((newPrice / VORI_TO_GRAM) * 10) / 10,
            perGramBuyBackBDT: Math.round((newBuyback / VORI_TO_GRAM) * 10) / 10,
            dayChangeBDT: item.dayChangeBDT + simulatedPriceDelta,
            dayChangePercent: Number((((item.dayChangeBDT + simulatedPriceDelta) / (item.marketPricePerVoriBDT - item.dayChangeBDT)) * 100).toFixed(2)),
          };
        }
        return item;
      });
    }
    return sliced;
  }, [data, selectedKarat, timeframe, simulatedPriceDelta, buybackPercent]);

  // Current latest active record
  const currentRecord = filteredData[filteredData.length - 1];
  const metrics30d = useMemo(() => get30DayMetrics(data, selectedKarat), [data, selectedKarat]);

  // Peak alert trigger conditions:
  // 1. Current price is at or above user's target selling threshold
  // 2. Or current price is at 30-day all-time peak
  const isTargetCrossed = currentRecord.marketPricePerVoriBDT >= targetPrice;
  const isNearTarget = !isTargetCrossed && currentRecord.marketPricePerVoriBDT >= targetPrice * 0.98;
  const isAtPeak = metrics30d.isAtPeak || isTargetCrossed;

  // Chart dimensions & scaling
  const chartHeight = 220;
  const chartWidth = 720;
  const padding = { top: 20, right: 30, bottom: 30, left: 60 };

  const { minPrice, maxPrice, pointsSvg, areaSvg, thresholdY } = useMemo(() => {
    const prices = filteredData.map((d) => d.marketPricePerVoriBDT);
    const min = Math.min(...prices, targetPrice) * 0.98;
    const max = Math.max(...prices, targetPrice) * 1.02;

    const innerWidth = chartWidth - padding.left - padding.right;
    const innerHeight = chartHeight - padding.top - padding.bottom;

    const getX = (index: number) => padding.left + (index / (filteredData.length - 1 || 1)) * innerWidth;
    const getY = (val: number) => padding.top + innerHeight - ((val - min) / (max - min || 1)) * innerHeight;

    const points = filteredData.map((d, i) => `${getX(i)},${getY(d.marketPricePerVoriBDT)}`).join(' ');
    const firstX = getX(0);
    const lastX = getX(filteredData.length - 1);
    const bottomY = padding.top + innerHeight;
    const area = `${firstX},${bottomY} ${points} ${lastX},${bottomY}`;

    const tY = getY(targetPrice);

    return { minPrice: min, maxPrice: max, pointsSvg: points, areaSvg: area, thresholdY: tY };
  }, [filteredData, targetPrice, chartWidth, chartHeight]);

  return (
    <div className="space-y-6">
      {/* Looker Studio Top BI Chrome / Canvas Header */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-xs overflow-hidden">
        {/* Looker Studio Menu Bar */}
        <div className="bg-white px-4 py-2.5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-600">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-bold text-gray-800 text-sm">
              <span className="w-5 h-5 rounded bg-[#D32F2F] text-white flex items-center justify-center font-black text-xs">G</span>
              <span>Looker Studio</span>
              <span className="text-gray-300 font-normal">|</span>
              <span className="font-semibold text-gray-700">Gold বেচে মালামাল (BAJUS Old-Gold Intelligence)</span>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 bg-[#FFE6EE] text-[#D32F2F] font-medium px-2 py-0.5 rounded-full text-[11px]">
              <span className="w-1.5 h-1.5 rounded-full bg-[#D32F2F] animate-ping" />
              Live Connected (Google Sheets)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Device Layout Switcher */}
            <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200">
              <button
                onClick={() => setDeviceView('desktop')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                  deviceView === 'desktop' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Desktop Canvas (1200px Grid)"
              >
                <Monitor className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Desktop</span>
              </button>
              <button
                onClick={() => setDeviceView('mobile')}
                className={`flex items-center gap-1 px-2 py-1 rounded text-xs font-medium transition-colors ${
                  deviceView === 'mobile' ? 'bg-white text-gray-900 shadow-xs' : 'text-gray-500 hover:text-gray-800'
                }`}
                title="Looker Mobile Responsive View"
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span className="hidden md:inline">Mobile</span>
              </button>
            </div>

            {/* Quick action buttons */}
            <button
              onClick={onOpenGuide}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-700 font-medium text-xs transition"
              title="Scheduled Email Delivery in Looker Studio"
            >
              <Mail className="w-3.5 h-3.5 text-[#D32F2F]" />
              <span className="hidden sm:inline">Schedule Alert</span>
            </button>
            <button
              onClick={() => setShowSimModal(!showSimModal)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#FFE6EE] hover:bg-[#ffd6e3] text-[#D32F2F] font-semibold text-xs transition"
              title="Simulate Market Spikes to Test Alerts"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Simulate Spike</span>
            </button>
          </div>
        </div>

        {/* Simulation Bar if toggled */}
        {showSimModal && (
          <div className="bg-[#FFE6EE]/60 px-4 py-3 border-b border-[#ffd0de] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-[#D32F2F]" />
              <span className="font-semibold text-gray-800">
                Testing Market Spike Simulator (বাজার দর বৃদ্ধির সিমুলেশন):
              </span>
              <span className="text-gray-600">
                Test how Looker Studio Peak Alert reacts when gold surges past your threshold!
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSimulatedPriceDelta(0)}
                className={`px-2.5 py-1 rounded border text-xs font-medium ${
                  simulatedPriceDelta === 0 ? 'bg-[#D32F2F] text-white' : 'bg-white text-gray-700'
                }`}
              >
                Normal Rate (৳ {formatBDT(142850)})
              </button>
              <button
                onClick={() => setSimulatedPriceDelta(3000)}
                className={`px-2.5 py-1 rounded border text-xs font-medium ${
                  simulatedPriceDelta === 3000 ? 'bg-[#D32F2F] text-white' : 'bg-white text-gray-700'
                }`}
              >
                + ৳ ৩,০০০ স্পাইক (৳ {formatBDT(145850)})
              </button>
              <button
                onClick={() => setSimulatedPriceDelta(6500)}
                className={`px-2.5 py-1 rounded border text-xs font-medium ${
                  simulatedPriceDelta === 6500 ? 'bg-[#D32F2F] text-white' : 'bg-white text-gray-700'
                }`}
              >
                🚀 অল-টাইম পিক + ৳ ৬,৫০০ (৳ {formatBDT(149350)})
              </button>
              <button
                onClick={() => setSimulatedPriceDelta(-4000)}
                className={`px-2.5 py-1 rounded border text-xs font-medium ${
                  simulatedPriceDelta === -4000 ? 'bg-gray-800 text-white' : 'bg-white text-gray-700'
                }`}
              >
                📉 দর পতন - ৳ ৪,০০০
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Canvas Container with responsive wrapper */}
      <div className={`mx-auto transition-all duration-300 ${deviceView === 'mobile' ? 'max-w-md' : 'max-w-full'}`}>
        
        {/* ======================================================== */}
        {/* 1. PEAK MARKET NOTIFICATION & SUMMARY ENGINE (BANNER)    */}
        {/* ======================================================== */}
        <div className="mb-6">
          {isTargetCrossed ? (
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#D32F2F] via-[#c62828] to-[#b71c1c] text-white p-5 md:p-6 shadow-lg border-2 border-red-300 animate-fadeIn">
              {/* Background decorative watermark */}
              <div className="absolute -right-6 -bottom-8 opacity-10 pointer-events-none text-9xl font-black">
                GOLD
              </div>
              
              <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 border border-white/30 shadow-inner">
                    <span className="text-2xl animate-bounce">🚨</span>
                  </div>
                  <div>
                    <div className="inline-flex items-center gap-2 px-2.5 py-0.5 rounded-full bg-white text-[#D32F2F] text-xs font-bold uppercase tracking-wider mb-1.5 shadow-xs">
                      <span className="w-2 h-2 rounded-full bg-[#D32F2F] animate-pulse" />
                      Calculated Field Alert Triggered
                    </div>
                    <h2 className="text-xl md:text-2xl font-black tracking-tight text-white">
                      🚨 PEAK ALERT: Excellent time to sell your old gold now!
                    </h2>
                    <p className="text-red-100 text-sm mt-1 leading-relaxed">
                      স্বর্ণ বিক্রির সেরা সুযোগ! বর্তমান বাজুস দর (<span className="font-bold text-white">৳ {formatBDT(currentRecord.marketPricePerVoriBDT)}</span>) আপনার টার্গেট মূল্য (<span className="font-bold text-yellow-300">৳ {formatBDT(targetPrice)}</span>) ছাড়িয়ে গেছে। পুরাতন সোনা ক্যাশআউট করে সর্বোচ্চ মুনাফা অর্জন করুন!
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap md:flex-col items-end gap-2 w-full md:w-auto shrink-0">
                  <button
                    onClick={onOpenCalculator}
                    className="w-full md:w-auto px-5 py-2.5 rounded-xl bg-white text-[#D32F2F] font-bold text-sm hover:bg-[#FFE6EE] transition shadow-md flex items-center justify-center gap-2"
                  >
                    <DollarSign className="w-4 h-4" />
                    <span>কত টাকা পাবেন হিসাব করুন</span>
                  </button>
                  <span className="text-[11px] text-red-200 text-right w-full">
                    Buyback Rate: ~৮২.৫% ক্যাশ ফেরত
                  </span>
                </div>
              </div>
            </div>
          ) : isNearTarget ? (
            <div className="rounded-2xl bg-amber-50 border-2 border-amber-300 p-4 md:p-5 text-amber-900 shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0 text-xl text-amber-600 font-bold">
                  ⚠️
                </div>
                <div>
                  <h3 className="font-bold text-base text-amber-900">
                    Approaching Target: Market within 2% of Peak Selling Goal
                  </h3>
                  <p className="text-amber-800 text-xs mt-0.5">
                    বাজার আপনার টার্গেট মূল্যের সন্নিকটে। বর্তমান রেট: ৳ {formatBDT(currentRecord.marketPricePerVoriBDT)} (লক্ষ্যমাত্রা: ৳ {formatBDT(targetPrice)})। প্রস্তুত থাকুন!
                  </p>
                </div>
              </div>
              <button
                onClick={onOpenCalculator}
                className="shrink-0 px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-semibold hover:bg-amber-700 transition"
              >
                প্রস্তুতি হিসাব
              </button>
            </div>
          ) : (
            <div className="rounded-2xl bg-emerald-50 border border-emerald-200 p-4 text-emerald-900 shadow-xs flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-700 font-bold shrink-0">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-emerald-200 text-emerald-800 font-bold text-[11px]">
                      🟢 Hold / Buy (ধরে রাখুন)
                    </span>
                    <span className="font-semibold text-sm text-emerald-950">
                      বাজার স্বাভাবিক ও স্থিতিশীল
                    </span>
                  </div>
                  <p className="text-emerald-800 text-xs mt-0.5">
                    বর্তমান বাজুস দর আপনার বিক্রয় টার্গেটের (৳ {formatBDT(targetPrice)}) নিচে রয়েছে। নতুন সোনা ক্রয়ের সুযোগ অথবা দীর্ঘমেয়াদে ধরে রাখার পরামর্শ।
                  </p>
                </div>
              </div>
              <div className="hidden sm:block text-right text-xs text-emerald-800">
                <span className="font-bold">Next Review:</span> বাজুস পরবর্তী বিজ্ঞপ্তি পর্যন্ত
              </div>
            </div>
          )}
        </div>

        {/* ======================================================== */}
        {/* 2. INTERACTIVE SELLING PRICE INPUT & PARAMETERS BAR      */}
        {/* ======================================================== */}
        <div className="bg-white border border-gray-200 rounded-2xl p-4 md:p-5 shadow-xs mb-6">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 pb-4 border-b border-gray-100">
            <div>
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-[#D32F2F]" />
                <h3 className="font-bold text-gray-900 text-sm">
                  Interactive Selling Price Input & Parameters (লুকার স্টুডিও প্যারামিটার কন্ট্রোল)
                </h3>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Adjust your personal expected selling price per Vori. The Peak Alert Engine and Looker badges dynamically recalculate in real-time.
              </p>
            </div>

            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[11px] font-semibold text-gray-500 mr-1">Quick Presets:</span>
              <button
                onClick={() => setTargetPrice(138000)}
                className={`px-2.5 py-1 text-xs rounded-lg border transition ${
                  targetPrice === 138000 ? 'bg-[#D32F2F] text-white border-[#D32F2F]' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                ৳ ১,৩৮,০০০
              </button>
              <button
                onClick={() => setTargetPrice(140000)}
                className={`px-2.5 py-1 text-xs rounded-lg border transition ${
                  targetPrice === 140000 ? 'bg-[#D32F2F] text-white border-[#D32F2F]' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                ৳ ১,৪০,০০০ (Standard)
              </button>
              <button
                onClick={() => setTargetPrice(144000)}
                className={`px-2.5 py-1 text-xs rounded-lg border transition ${
                  targetPrice === 144000 ? 'bg-[#D32F2F] text-white border-[#D32F2F]' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
                }`}
              >
                ৳ ১,৪৪,০০০ (30D Peak)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4">
            {/* Target Price Numeric & Range Input */}
            <div className="md:col-span-2 bg-[#FFE6EE]/30 p-3.5 rounded-xl border border-[#ffd2df]">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                  <span className="text-[#D32F2F]">●</span>
                  <span>Target Selling Price / Vori (আপনার কাঙ্ক্ষিত বিক্রয় দর):</span>
                </label>
                <div className="flex items-center gap-1 font-mono font-bold text-base text-[#D32F2F] bg-white px-2.5 py-0.5 rounded-md border border-red-200 shadow-2xs">
                  <span>৳</span>
                  <input
                    type="number"
                    value={targetPrice}
                    step="500"
                    onChange={(e) => setTargetPrice(Number(e.target.value) || 0)}
                    className="w-24 text-right bg-transparent focus:outline-hidden font-bold"
                  />
                  <span className="text-xs text-gray-500 font-sans">BDT</span>
                </div>
              </div>
              <input
                type="range"
                min="115000"
                max="160000"
                step="500"
                value={targetPrice}
                onChange={(e) => setTargetPrice(Number(e.target.value))}
                className="w-full accent-[#D32F2F] cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-gray-500 mt-1 font-mono">
                <span>Min: ৳ 115,000</span>
                <span className="font-semibold text-gray-700">Current: ৳ {formatBDT(currentRecord.marketPricePerVoriBDT)}</span>
                <span>Max: ৳ 160,000</span>
              </div>
            </div>

            {/* Buyback Percentage Setting */}
            <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-gray-800">
                  Old Gold Buyback Rate (%):
                </label>
                <span className="font-mono font-bold text-sm text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                  {buybackPercent}%
                </span>
              </div>
              <input
                type="range"
                min="78"
                max="88"
                step="0.5"
                value={buybackPercent}
                onChange={(e) => setBuybackPercent(Number(e.target.value))}
                className="w-full accent-gray-800 cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-gray-500 mt-1">
                <span>78% (High cut)</span>
                <span className="font-semibold text-emerald-700">82.5% (BAJUS Standard)</span>
                <span>88% (Exchange)</span>
              </div>
            </div>
          </div>
        </div>

        {/* ======================================================== */}
        {/* 3. LIVE PRICE TRACKER CARDS (LOOKER METRIC SCORECARDS)   */}
        {/* ======================================================== */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#D32F2F]" />
              <h3 className="font-bold text-gray-900 text-sm">
                BAJUS Official Gold Scorecards (লাইভ বাজুস গোল্ড স্কোরকার্ড)
              </h3>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Clock className="w-3.5 h-3.5" />
              <span>Latest Announcement: Today, 10:00 AM BST</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {(['22K', '21K', '18K', 'Traditional'] as GoldKarat[]).map((karat) => {
              const info = KARAT_INFO[karat];
              const isSelected = selectedKarat === karat;
              
              // Calculate specific values for this karat
              const records = data.filter((r) => r.goldType === karat);
              const last = records[records.length - 1];
              const adjustedMarket = last.marketPricePerVoriBDT + (isSelected ? simulatedPriceDelta : 0);
              const adjustedBuyback = Math.round(adjustedMarket * (buybackPercent / 100));
              const perGramMarket = Math.round((adjustedMarket / VORI_TO_GRAM) * 10) / 10;
              const perGramBuyback = Math.round((adjustedBuyback / VORI_TO_GRAM) * 10) / 10;

              // Threshold check for this specific karat (proportional)
              const karatRatio = adjustedMarket / (data.find(r => r.goldType === '22K')?.marketPricePerVoriBDT || 142850);
              const karatThreshold = targetPrice * karatRatio;
              const isKaratPeak = adjustedMarket >= karatThreshold;

              return (
                <div
                  key={karat}
                  onClick={() => setSelectedKarat(karat)}
                  className={`cursor-pointer rounded-2xl p-4.5 border-2 transition-all relative overflow-hidden ${
                    isSelected 
                      ? 'bg-white border-[#D32F2F] shadow-md ring-2 ring-[#D32F2F]/20' 
                      : 'bg-white border-gray-200 hover:border-gray-300 shadow-2xs'
                  }`}
                >
                  {/* Active Selection Indicator */}
                  {isSelected && (
                    <div className="absolute top-0 right-0 bg-[#D32F2F] text-white text-[10px] font-bold px-2.5 py-0.5 rounded-bl-lg">
                      Active BI View
                    </div>
                  )}

                  {/* Header info */}
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <span className="font-black text-lg text-gray-900 tracking-tight">{karat}</span>
                      <p className="text-[11px] font-medium text-gray-500 leading-tight">{info.banglaName}</p>
                    </div>

                    {/* Status Badge */}
                    <div className="text-right">
                      {isKaratPeak ? (
                        <span className="inline-flex items-center gap-1 bg-[#FFE6EE] text-[#D32F2F] text-[10px] font-bold px-2 py-0.5 rounded-full border border-red-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#D32F2F]" />
                          🔴 Peak - Sell!
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                          🟢 Hold / Buy
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Main Metric: Market Price Per Vori */}
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <span className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block">
                      Market Price / Vori (ভরি দর)
                    </span>
                    <div className="flex items-baseline gap-1 mt-0.5">
                      <span className="text-xs text-gray-500">৳</span>
                      <span className="text-2xl font-black text-gray-900 font-mono tracking-tight">
                        {formatBDT(adjustedMarket)}
                      </span>
                      <span className="text-xs text-gray-400 font-sans">BDT</span>
                    </div>
                  </div>

                  {/* Sub Metric: Old Gold Buyback Price */}
                  <div className="mt-2.5 bg-[#FFE6EE]/40 rounded-xl p-2.5 border border-[#ffd5e2]">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-gray-700 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D32F2F]" />
                        Old Gold Buyback:
                      </span>
                      <span className="font-mono font-bold text-[#D32F2F]">
                        ৳ {formatBDT(adjustedBuyback)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-gray-500 mt-1">
                      <span>Per Gram (গ্রাম দর):</span>
                      <span className="font-mono text-gray-700">৳ {formatBDT(perGramBuyback)}/g</span>
                    </div>
                  </div>

                  {/* Micro stats footer */}
                  <div className="mt-3 pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
                    <span>1 Vori = 11.664g</span>
                    <span className="font-medium text-gray-700">Market /g: ৳ {formatBDT(perGramMarket)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* FX Macro Bar: USD/BDT & International Gold Rate */}
        <div className="bg-white border border-gray-200 rounded-xl p-3.5 shadow-2xs mb-6 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="font-bold text-gray-800">Macro FX & Import Parity:</span>
            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-700 font-mono font-semibold">
              1 USD = ৳ {currentRecord.usdBdtRate.toFixed(2)} BDT
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200 font-mono font-semibold">
              Global Spot: ${currentRecord.internationalOunceUSD.toFixed(1)} / Troy Oz
            </span>
          </div>
          <div className="text-gray-500 text-[11px]">
            Formula: Domestic BAJUS price reflects global ounce + customs duty + VAT + bullion spread.
          </div>
        </div>

        {/* ======================================================== */}
        {/* 4. HISTORICAL TREND GRAPH (LOOKER TIME-SERIES VISUAL)     */}
        {/* ======================================================== */}
        <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#D32F2F]" />
                <h3 className="font-bold text-gray-900 text-base">
                  Historical Price Trend & High/Low Analysis ({selectedKarat} দর বিশ্লেষণ)
                </h3>
              </div>
              <p className="text-xs text-gray-500 mt-0.5">
                Looker Studio Area Chart with Soft Pink (`#FFE6EE`) gradient fill, Vibrant Red (`#D32F2F`) stroke, and dynamic target selling threshold.
              </p>
            </div>

            {/* Timeframe selector */}
            <div className="flex items-center bg-gray-100 p-1 rounded-xl border border-gray-200">
              <button
                onClick={() => setTimeframe('7d')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  timeframe === '7d' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                7 Days
              </button>
              <button
                onClick={() => setTimeframe('30d')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  timeframe === '30d' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                30 Days
              </button>
              <button
                onClick={() => setTimeframe('90d')}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition ${
                  timeframe === '90d' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                90 Days
              </button>
            </div>
          </div>

          {/* SVG Area Chart */}
          <div className="relative w-full overflow-hidden bg-gradient-to-b from-gray-50/50 to-white rounded-xl border border-gray-100 p-2">
            <svg
              viewBox={`0 0 ${chartWidth} ${chartHeight}`}
              className="w-full h-auto overflow-visible select-none"
            >
              <defs>
                {/* Looker Studio Soft Pink Gradient Area Fill */}
                <linearGradient id="lookerPinkGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#D32F2F" stopOpacity="0.35" />
                  <stop offset="60%" stopColor="#FFE6EE" stopOpacity="0.8" />
                  <stop offset="100%" stopColor="#FFE6EE" stopOpacity="0.05" />
                </linearGradient>
                {/* Glow filter */}
                <filter id="redGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#D32F2F" floodOpacity="0.25" />
                </filter>
              </defs>

              {/* Grid Lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
                const y = padding.top + (chartHeight - padding.top - padding.bottom) * ratio;
                const priceAtY = maxPrice - ratio * (maxPrice - minPrice);
                return (
                  <g key={ratio}>
                    <line
                      x1={padding.left}
                      y1={y}
                      x2={chartWidth - padding.right}
                      y2={y}
                      stroke="#E5E7EB"
                      strokeDasharray="4 4"
                      strokeWidth="1"
                    />
                    <text
                      x={padding.left - 8}
                      y={y + 4}
                      fill="#9CA3AF"
                      fontSize="9"
                      fontFamily="JetBrains Mono, monospace"
                      textAnchor="end"
                    >
                      ৳{formatBDT(Math.round(priceAtY))}
                    </text>
                  </g>
                );
              })}

              {/* User Target Selling Price Reference Line */}
              {thresholdY >= padding.top && thresholdY <= chartHeight - padding.bottom && (
                <g>
                  <line
                    x1={padding.left}
                    y1={thresholdY}
                    x2={chartWidth - padding.right}
                    y2={thresholdY}
                    stroke="#D32F2F"
                    strokeWidth="1.75"
                    strokeDasharray="6 3"
                  />
                  <rect
                    x={chartWidth - padding.right - 145}
                    y={thresholdY - 18}
                    width="145"
                    height="16"
                    rx="4"
                    fill="#D32F2F"
                  />
                  <text
                    x={chartWidth - padding.right - 72}
                    y={thresholdY - 6}
                    fill="#FFFFFF"
                    fontSize="9"
                    fontWeight="bold"
                    textAnchor="middle"
                  >
                    Target Sell: ৳{formatBDT(targetPrice)}
                  </text>
                </g>
              )}

              {/* Area Fill */}
              <polygon points={areaSvg} fill="url(#lookerPinkGradient)" />

              {/* Main Line Stroke */}
              <polyline
                points={pointsSvg}
                fill="none"
                stroke="#D32F2F"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                filter="url(#redGlow)"
              />

              {/* Data points for hover */}
              {filteredData.map((d, i) => {
                const innerWidth = chartWidth - padding.left - padding.right;
                const innerHeight = chartHeight - padding.top - padding.bottom;
                const cx = padding.left + (i / (filteredData.length - 1 || 1)) * innerWidth;
                const cy = padding.top + innerHeight - ((d.marketPricePerVoriBDT - minPrice) / (maxPrice - minPrice || 1)) * innerHeight;
                const isPeak = d.is30DayPeak;

                return (
                  <g
                    key={d.id}
                    className="cursor-pointer"
                    onMouseEnter={() => setHoveredPoint(d)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    <circle
                      cx={cx}
                      cy={cy}
                      r={isPeak ? 5 : 3.5}
                      fill={isPeak ? "#D32F2F" : "#FFFFFF"}
                      stroke="#D32F2F"
                      strokeWidth={isPeak ? 2.5 : 1.5}
                      className="hover:scale-150 transition-transform origin-center"
                    />
                    {isPeak && i === filteredData.length - 1 && (
                      <circle cx={cx} cy={cy} r="8" fill="#D32F2F" opacity="0.2" className="animate-ping" />
                    )}
                  </g>
                );
              })}
            </svg>

            {/* Hover Tooltip Overlay */}
            {hoveredPoint && (
              <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-gray-900 text-white px-3.5 py-2 rounded-xl text-xs shadow-xl flex items-center gap-4 z-20 pointer-events-none border border-gray-700 animate-fadeIn">
                <div>
                  <div className="text-[10px] text-gray-400">{hoveredPoint.date}</div>
                  <div className="font-bold text-sm text-yellow-300">
                    ৳ {formatBDT(hoveredPoint.marketPricePerVoriBDT)} / Vori
                  </div>
                </div>
                <div className="border-l border-gray-700 pl-3">
                  <div className="text-[10px] text-gray-400">Old Gold Buyback</div>
                  <div className="font-semibold text-white">
                    ৳ {formatBDT(hoveredPoint.oldGoldBuyBackPriceBDT)}
                  </div>
                </div>
                <div className="border-l border-gray-700 pl-3">
                  <div className="text-[10px] text-gray-400">Per Gram</div>
                  <div className="font-semibold text-gray-200">
                    ৳ {formatBDT(hoveredPoint.perGramBDT)}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Chart Insights Footer */}
          <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-gray-50 p-2.5 rounded-xl">
              <span className="text-[11px] text-gray-500 block">30-Day Period High</span>
              <span className="font-mono font-bold text-gray-900 text-sm">
                ৳ {formatBDT(metrics30d.high30d)}
              </span>
            </div>
            <div className="bg-gray-50 p-2.5 rounded-xl">
              <span className="text-[11px] text-gray-500 block">30-Day Period Low</span>
              <span className="font-mono font-bold text-gray-900 text-sm">
                ৳ {formatBDT(metrics30d.low30d)}
              </span>
            </div>
            <div className="bg-gray-50 p-2.5 rounded-xl">
              <span className="text-[11px] text-gray-500 block">30-Day Net Growth</span>
              <span className={`font-mono font-bold text-sm flex items-center gap-1 ${
                metrics30d.change30d >= 0 ? 'text-emerald-700' : 'text-red-700'
              }`}>
                {metrics30d.change30d >= 0 ? '+' : ''}৳ {formatBDT(metrics30d.change30d)} ({metrics30d.change30dPercent}%)
              </span>
            </div>
            <div className="bg-[#FFE6EE] p-2.5 rounded-xl border border-[#ffd1de]">
              <span className="text-[11px] text-[#D32F2F] font-semibold block">Old Gold 30D Peak Return</span>
              <span className="font-mono font-bold text-[#D32F2F] text-sm">
                ৳ {formatBDT(metrics30d.highBuyback30d)} / Vori
              </span>
            </div>
          </div>
        </div>

        {/* Quick CTA to Calculator & Looker Formulas */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div 
            onClick={onOpenCalculator}
            className="cursor-pointer bg-gradient-to-r from-red-50 to-pink-50 hover:from-red-100 hover:to-pink-100 border border-red-200 rounded-2xl p-5 transition group shadow-2xs"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-[#D32F2F] text-white text-[10px] font-bold uppercase tracking-wider mb-2">
                  Smart Cashout Tool
                </span>
                <h4 className="font-black text-gray-900 text-base group-hover:text-[#D32F2F] transition">
                  "বেচে মালামাল" Old-Gold Selling Calculator
                </h4>
                <p className="text-xs text-gray-600 mt-1">
                  ভরি, আনা, রতি ও গ্রাম অনুযায়ী আপনার পুরাতন অলংকারের নিট ক্যাশ টাকা, দোকানদারের খাদ কাটার হিসাব ও সর্বোচ্চ দাম পাওয়ার গাইড।
                </p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-[#D32F2F] group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </div>
          </div>

          <div 
            onClick={onOpenFormulas}
            className="cursor-pointer bg-gradient-to-r from-gray-50 to-red-50/40 hover:from-gray-100 hover:to-red-100/60 border border-gray-200 rounded-2xl p-5 transition group shadow-2xs"
          >
            <div className="flex items-start justify-between">
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-gray-800 text-white text-[10px] font-bold uppercase tracking-wider mb-2">
                  BI Engineering
                </span>
                <h4 className="font-black text-gray-900 text-base group-hover:text-[#D32F2F] transition">
                  Looker Studio Calculated Fields Catalog
                </h4>
                <p className="text-xs text-gray-600 mt-1">
                  CASE WHEN, IF, Parameter blends, and status badge formulas ready to copy-paste directly into your Looker Studio report canvas.
                </p>
              </div>
              <ArrowUpRight className="w-5 h-5 text-gray-800 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
