import React, { useState, useMemo } from 'react';
import { 
  DollarSign, 
  Calculator, 
  HelpCircle, 
  Check, 
  ShieldCheck, 
  AlertTriangle, 
  TrendingUp, 
  FileText, 
  Scale, 
  Info,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { GoldKarat } from '../types/gold';
import { 
  KARAT_INFO, 
  VORI_TO_GRAM, 
  ANA_PER_VORI, 
  ROTTI_PER_VORI, 
  formatBDT, 
  toBengaliNumerals 
} from '../data/goldData';

export const OldGoldCalculator: React.FC = () => {
  // Input unit mode: 'traditional' (ভরি-আনা-রতি) or 'metric' (গ্রাম)
  const [unitMode, setUnitMode] = useState<'traditional' | 'metric'>('traditional');
  
  // Weights
  const [vori, setVori] = useState<number>(2);
  const [ana, setAna] = useState<number>(4);
  const [rotti, setRotti] = useState<number>(0);
  const [grams, setGrams] = useState<number>(26.24);

  // Karat selection
  const [karat, setKarat] = useState<GoldKarat>('22K');
  
  // Custom or official baseline market price per vori (2026 BAJUS rates: goldr.org, gold-price.bd)
  const defaultMarketRates: Record<GoldKarat, number> = {
    '22K': 226923,
    '21K': 216717,
    '18K': 186099,
    'Traditional': 161605,
  };
  const [customMarketRate, setCustomMarketRate] = useState<number>(defaultMarketRates['22K']);

  // Deduction policy
  const [voucherStatus, setVoucherStatus] = useState<'hallmark_voucher' | 'no_voucher' | 'custom'>('hallmark_voucher');
  const [deductionPercent, setDeductionPercent] = useState<number>(15);

  // Original purchase price (for profit computation)
  const [originalPricePerVori, setOriginalPricePerVori] = useState<number>(62000);

  // When Karat changes, update default rate
  const handleKaratChange = (newKarat: GoldKarat) => {
    setKarat(newKarat);
    setCustomMarketRate(defaultMarketRates[newKarat]);
  };

  // Synchronize deduction percent with voucher status
  const handleVoucherStatusChange = (status: 'hallmark_voucher' | 'no_voucher' | 'custom') => {
    setVoucherStatus(status);
    if (status === 'hallmark_voucher') {
      setDeductionPercent(15);
    } else if (status === 'no_voucher') {
      setDeductionPercent(20);
    }
  };

  // Total weight in Vori and Grams
  const { totalVori, totalGrams } = useMemo(() => {
    if (unitMode === 'traditional') {
      const v = Number(vori) || 0;
      const a = Number(ana) || 0;
      const r = Number(rotti) || 0;
      const calculatedVori = v + (a / ANA_PER_VORI) + (r / ROTTI_PER_VORI);
      const calculatedGrams = calculatedVori * VORI_TO_GRAM;
      return {
        totalVori: calculatedVori,
        totalGrams: Number(calculatedGrams.toFixed(3)),
      };
    } else {
      const g = Number(grams) || 0;
      const calculatedVori = g / VORI_TO_GRAM;
      return {
        totalVori: calculatedVori,
        totalGrams: g,
      };
    }
  }, [unitMode, vori, ana, rotti, grams]);

  // Financial calculations
  const calculations = useMemo(() => {
    // Gross BAJUS market valuation
    const grossMarketValue = Math.round(totalVori * customMarketRate);
    
    // Shopkeeper deduction amount (খাদ বা অলঙ্কার কাটার চার্জ)
    const deductionAmount = Math.round(grossMarketValue * (deductionPercent / 100));
    
    // Net cash payout
    const netCashInHand = grossMarketValue - deductionAmount;
    
    // Effective net price received per Vori
    const effectivePerVori = totalVori > 0 ? Math.round(netCashInHand / totalVori) : 0;
    const effectivePerGram = totalGrams > 0 ? Math.round(netCashInHand / totalGrams) : 0;

    // Profit calculation over purchase
    const totalOriginalCost = Math.round(totalVori * originalPricePerVori);
    const netProfit = netCashInHand - totalOriginalCost;
    const profitPercentage = totalOriginalCost > 0 ? Number(((netProfit / totalOriginalCost) * 100).toFixed(1)) : 0;
    const multipleYield = totalOriginalCost > 0 ? (netCashInHand / totalOriginalCost).toFixed(2) : '1.0';

    return {
      grossMarketValue,
      deductionAmount,
      netCashInHand,
      effectivePerVori,
      effectivePerGram,
      totalOriginalCost,
      netProfit,
      profitPercentage,
      multipleYield,
    };
  }, [totalVori, totalGrams, customMarketRate, deductionPercent, originalPricePerVori]);

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-900 via-[#D32F2F] to-[#b71c1c] text-white p-6 rounded-2xl shadow-md relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-red-100 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-yellow-300" />
              <span>Smart Old-Gold Realization Calculator</span>
            </div>
            <h2 className="text-2xl md:text-3xl font-black tracking-tight">
              "Gold বেচে মালামাল" - পুরাতন স্বর্ণ বিক্রয় ক্যালকুলেটর
            </h2>
            <p className="text-red-100 text-xs md:text-sm mt-1 max-w-2xl">
              বাজারের সঠিক খাদ কর্তন হিসাব করে জানুন আপনার পুরাতন গহনা বিক্রি করলে আপনি নিশ্চিত কত টাকা নগদ হাতে পাবেন এবং আপনার মোট কত টাকা লাভ হবে।
            </p>
          </div>
          <div className="bg-white/10 backdrop-blur-md border border-white/20 p-3.5 rounded-xl text-right shrink-0">
            <span className="text-[11px] text-red-200 block">১ ভরি সোনার পরিমাপ মানদণ্ড:</span>
            <span className="text-sm font-bold font-mono text-yellow-300">১ ভরি = ১৬ আনা = ৯৬ রতি = ১১.৬৬৪ গ্রাম</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Input Form (7 cols) */}
        <div className="lg:col-span-7 space-y-5">
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <h3 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
              <Scale className="w-5 h-5 text-[#D32F2F]" />
              <span>১. স্বর্ণের ওজন ও ক্যারেট নির্বাচন করুন (Select Weight & Karat)</span>
            </h3>

            {/* Karat selector */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-700 block mb-2">
                স্বর্ণের মান / ক্যারেট (Gold Purity Karat):
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {(['22K', '21K', '18K', 'Traditional'] as GoldKarat[]).map((k) => (
                  <button
                    key={k}
                    onClick={() => handleKaratChange(k)}
                    className={`p-3 rounded-xl border text-center transition ${
                      karat === k
                        ? 'border-[#D32F2F] bg-[#FFE6EE] text-[#D32F2F] font-bold shadow-2xs'
                        : 'border-gray-200 bg-gray-50/70 text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <div className="text-sm font-black">{k}</div>
                    <div className="text-[10px] text-gray-500 mt-0.5 truncate">{KARAT_INFO[k].banglaName}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Unit Toggle */}
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-700">পরিমাপের একক নির্বাচন (Unit System):</span>
              <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-200">
                <button
                  onClick={() => setUnitMode('traditional')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    unitMode === 'traditional' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500'
                  }`}
                >
                  ভরি - আনা - রতি
                </button>
                <button
                  onClick={() => setUnitMode('metric')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                    unitMode === 'metric' ? 'bg-white text-gray-900 shadow-2xs' : 'text-gray-500'
                  }`}
                >
                  গ্রাম (Grams)
                </button>
              </div>
            </div>

            {/* Traditional Weight Inputs */}
            {unitMode === 'traditional' ? (
              <div className="grid grid-cols-3 gap-3 bg-[#FFE6EE]/20 p-4 rounded-xl border border-red-100">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    ভরি (Vori):
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={vori}
                    onChange={(e) => setVori(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 font-mono font-bold text-gray-900 focus:outline-hidden focus:border-[#D32F2F]"
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block">১ ভরি = ১১.৬৬৪ গ্রাম</span>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    আনা (Ana):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="15"
                    step="1"
                    value={ana}
                    onChange={(e) => setAna(Math.max(0, Math.min(15, parseInt(e.target.value, 10) || 0)))}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 font-mono font-bold text-gray-900 focus:outline-hidden focus:border-[#D32F2F]"
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block">১৬ আনা = ১ ভরি</span>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    রতি (Rotti):
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="5"
                    step="1"
                    value={rotti}
                    onChange={(e) => setRotti(Math.max(0, Math.min(5, parseInt(e.target.value, 10) || 0)))}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 font-mono font-bold text-gray-900 focus:outline-hidden focus:border-[#D32F2F]"
                  />
                  <span className="text-[10px] text-gray-500 mt-1 block">৬ রতি = ১ আনা</span>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  স্বর্ণের নিট ওজন (গ্রামে - Grams):
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0.1"
                    step="0.01"
                    value={grams}
                    onChange={(e) => setGrams(Math.max(0, parseFloat(e.target.value) || 0))}
                    className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 font-mono font-bold text-gray-900 focus:outline-hidden focus:border-[#D32F2F]"
                  />
                  <span className="text-sm font-semibold text-gray-600">গ্রাম</span>
                </div>
                <div className="text-[11px] text-gray-500 mt-2">
                  সমান সমান: <span className="font-mono font-bold text-gray-800">{totalVori.toFixed(3)} ভরি</span>
                </div>
              </div>
            )}

            {/* Calculated Weight Summary Pill */}
            <div className="mt-3 flex items-center justify-between text-xs bg-gray-50 px-3.5 py-2 rounded-lg border border-gray-200">
              <span className="text-gray-600">মোট হিসাবকৃত ওজন:</span>
              <span className="font-mono font-bold text-gray-900">
                {totalVori.toFixed(3)} ভরি ({totalGrams.toFixed(2)} গ্রাম)
              </span>
            </div>
          </div>

          {/* 2. Market Rate & Deduction Policy */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <h3 className="font-bold text-gray-900 text-base mb-4 flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#D32F2F]" />
              <span>২. বাজুস রেট ও দোকানদারের খাদ কর্তন পলিসি</span>
            </h3>

            {/* Current Market Rate per vori */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-gray-700">
                  বর্তমান বাজুস অফিসিয়াল ভরি দর (BDT/Vori):
                </label>
                <button
                  onClick={() => setCustomMarketRate(defaultMarketRates[karat])}
                  className="text-[11px] text-[#D32F2F] hover:underline font-semibold"
                >
                  রিসেট করুন (৳ {formatBDT(defaultMarketRates[karat])})
                </button>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-gray-400 font-bold">৳</span>
                <input
                  type="number"
                  value={customMarketRate}
                  step="500"
                  onChange={(e) => setCustomMarketRate(Number(e.target.value) || 0)}
                  className="w-full pl-8 pr-16 py-2 bg-white border border-gray-300 rounded-lg font-mono font-bold text-gray-900 focus:outline-hidden focus:border-[#D32F2F]"
                />
                <span className="absolute right-3 top-2.5 text-xs text-gray-400">BDT</span>
              </div>
            </div>

            {/* Voucher status & deduction preset */}
            <div className="mb-4">
              <label className="text-xs font-semibold text-gray-700 block mb-2">
                মেমো ও হলমার্ক স্ট্যাটাস (Deduction Policy):
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  onClick={() => handleVoucherStatusChange('hallmark_voucher')}
                  className={`p-3 rounded-xl border text-left transition ${
                    voucherStatus === 'hallmark_voucher'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-medium'
                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">হলমার্ক মেমোসহ (রসিদ আছে)</span>
                    <span className="text-[11px] font-mono font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      ১৫% খাদ
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    বাজুস অনুমোদিত যেকোনো জুয়েলারি শপে সর্বোচ্চ দাম পাবেন।
                  </p>
                </button>

                <button
                  onClick={() => handleVoucherStatusChange('no_voucher')}
                  className={`p-3 rounded-xl border text-left transition ${
                    voucherStatus === 'no_voucher'
                      ? 'border-red-400 bg-red-50 text-red-950 font-medium'
                      : 'border-gray-200 bg-white hover:bg-gray-50 text-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs">মেমো ছাড়া / সনাতন অলংকার</span>
                    <span className="text-[11px] font-mono font-bold bg-red-100 text-red-800 px-2 py-0.5 rounded-full">
                      ২০% খাদ
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 mt-1">
                    পাথর বা খাদ যাচাই করতে এসিড/কষ্টিপাথর টেস্টের মাধ্যমে কর্তন।
                  </p>
                </button>
              </div>
            </div>

            {/* Deduction Slider */}
            <div className="bg-[#FFE6EE]/30 p-3.5 rounded-xl border border-red-100">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-gray-800">
                  দোকানদারের মোট খাদ ও কাটিং কর্তন:
                </span>
                <span className="font-mono font-bold text-sm text-[#D32F2F]">
                  {deductionPercent}% কর্তন ({100 - deductionPercent}% ক্যাশব্যাক)
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="25"
                step="0.5"
                value={deductionPercent}
                onChange={(e) => {
                  setDeductionPercent(Number(e.target.value));
                  setVoucherStatus('custom');
                }}
                className="w-full accent-[#D32F2F] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-gray-500 mt-1">
                <span>১০% (বিনিময় / Exchange)</span>
                <span>১৫% (বাজুস অফিসিয়াল পলিসি)</span>
                <span>২৫% (অতিরিক্ত খাদ)</span>
              </div>
            </div>
          </div>

          {/* 3. Original Purchase Price (Profit Tracker) */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <h3 className="font-bold text-gray-900 text-base mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              <span>৩. পূর্ববর্তী ক্রয়মূল্য (মুনাফা ট্র্যাকার)</span>
            </h3>
            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="w-full">
                <label className="text-xs font-semibold text-gray-700 block mb-1">
                  যখন কিনেছিলেন প্রতি ভরি দাম কত ছিল? (BDT/Vori):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-400 font-bold">৳</span>
                  <input
                    type="number"
                    value={originalPricePerVori}
                    step="1000"
                    onChange={(e) => setOriginalPricePerVori(Number(e.target.value) || 0)}
                    className="w-full pl-8 pr-16 py-2 bg-white border border-gray-300 rounded-lg font-mono font-bold text-gray-900 focus:outline-hidden focus:border-emerald-600"
                  />
                  <span className="absolute right-3 top-2.5 text-xs text-gray-400">BDT</span>
                </div>
              </div>
              {/* Presets */}
              <div className="flex items-center gap-1.5 self-end shrink-0 pt-2 sm:pt-0">
                <button
                  onClick={() => setOriginalPricePerVori(48000)}
                  className="px-2.5 py-1 text-xs rounded border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium"
                >
                  ৳ ৪৮,০০০ (২০১৭)
                </button>
                <button
                  onClick={() => setOriginalPricePerVori(70000)}
                  className="px-2.5 py-1 text-xs rounded border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium"
                >
                  ৳ ৭০,০০০ (২০২১)
                </button>
                <button
                  onClick={() => setOriginalPricePerVori(98000)}
                  className="px-2.5 py-1 text-xs rounded border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium"
                >
                  ৳ ৯৮,০০০ (২০২৩)
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: High Impact Output Summary Cards (5 cols) */}
        <div className="lg:col-span-5 space-y-5">
          
          {/* Main "Cash In Hand" Grand Result Card */}
          <div className="bg-gradient-to-b from-[#FFE6EE] via-white to-white border-2 border-[#D32F2F] rounded-2xl p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 bg-[#D32F2F] text-white text-[11px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-wider">
              বেচে মালামাল নিট প্রাপ্তি
            </div>

            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
              Net Cash in Hand (আপনি নগদ টাকা পাবেন)
            </span>

            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-2xl text-[#D32F2F] font-bold">৳</span>
              <span className="text-4xl md:text-5xl font-black text-gray-900 font-mono tracking-tight">
                {formatBDT(calculations.netCashInHand)}
              </span>
              <span className="text-sm font-bold text-gray-500">BDT</span>
            </div>

            <p className="text-xs text-gray-600 mt-2 leading-relaxed">
              {totalVori.toFixed(3)} ভরি {karat} স্বর্ণ বিক্রি করলে খাদ কর্তন বাদে এই নগদ টাকা আপনার অ্যাকাউন্টে জমা হবে।
            </p>

            {/* Financial breakdown table */}
            <div className="mt-5 pt-4 border-t border-gray-200 space-y-2.5 text-xs">
              <div className="flex items-center justify-between text-gray-600">
                <span>মোট বাজুস বাজার দর (Gross Value):</span>
                <span className="font-mono font-semibold text-gray-900">
                  ৳ {formatBDT(calculations.grossMarketValue)}
                </span>
              </div>
              <div className="flex items-center justify-between text-red-700">
                <span>দোকানদারের খাদ কর্তন ({deductionPercent}%):</span>
                <span className="font-mono font-bold">
                  - ৳ {formatBDT(calculations.deductionAmount)}
                </span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>কার্যকর প্রতি ভরি প্রাপ্তি (Effective / Vori):</span>
                <span className="font-mono font-semibold text-gray-900">
                  ৳ {formatBDT(calculations.effectivePerVori)}
                </span>
              </div>
              <div className="flex items-center justify-between text-gray-600">
                <span>কার্যকর প্রতি গ্রাম প্রাপ্তি (Effective / Gram):</span>
                <span className="font-mono font-semibold text-gray-900">
                  ৳ {formatBDT(calculations.effectivePerGram)}
                </span>
              </div>
            </div>

            {/* Net Capital Gain / Profit Box */}
            <div className="mt-5 p-4 rounded-xl bg-emerald-50 border border-emerald-200">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-700" />
                  <span>আপনার মোট মুনাফা (Capital Profit):</span>
                </span>
                <span className="text-xs font-mono font-bold bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded">
                  {calculations.multipleYield} গুণ লাভ!
                </span>
              </div>
              <div className="mt-1 flex items-baseline gap-1">
                <span className="text-sm font-bold text-emerald-700">+ ৳</span>
                <span className="text-2xl font-black text-emerald-900 font-mono">
                  {formatBDT(calculations.netProfit)}
                </span>
                <span className="text-xs font-bold text-emerald-700 font-mono">
                  ({calculations.profitPercentage}%)
                </span>
              </div>
              <p className="text-[11px] text-emerald-800 mt-1">
                পূর্ববর্তী মোট ক্রয়মূল্য ছিল: ৳ {formatBDT(calculations.totalOriginalCost)} BDT
              </p>
            </div>
          </div>

          {/* Bangladesh Jewelry Shop Bargaining & Safety Tips */}
          <div className="bg-white border border-gray-200 rounded-2xl p-5 shadow-xs">
            <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#D32F2F]" />
              <span>পুরাতন সোনা বিক্রিতে সর্বোচ্চ দর পাওয়ার সিক্রেট টিপস:</span>
            </h4>
            <ul className="space-y-2.5 text-xs text-gray-600">
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-red-100 text-[#D32F2F] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  ১
                </span>
                <span>
                  <strong>পাথর/পুঁতি আলাদা পরিমাপ:</strong> অলংকারে পাথর বা কুন্দন থাকলে দোকানদার যেন পাথরসহ ওজন না ধরে। পাথরের ওজন বাদ দিয়ে শুধু সোনার নিট ওজন নিন।
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-red-100 text-[#D32F2F] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  ২
                </span>
                <span>
                  <strong>১ ভরি = ১১.৬৬৪ গ্রাম:</strong> সোনার ওজন সবসময় গ্রামে চেক করুন। ১ ভরি হতে পূর্ণ ১১.৬৬৪ গ্রাম হতে হবে। ডিজিটাল স্কেলে ০.০১ গ্রামও গুরুত্বপূর্ণ।
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-red-100 text-[#D32F2F] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  ৩
                </span>
                <span>
                  <strong>পাকা মেমো খুঁজুন:</strong> ক্রয় রসিদ থাকলে যে দোকান থেকে কেনা হয়েছিল সেখানে গেলে সাধারণত মাত্র ১০% থেকে ১২% কর্তন দিয়ে সর্বোচ্চ ক্যাশ পাওয়া যায়।
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-4 h-4 rounded-full bg-red-100 text-[#D32F2F] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                  ৪
                </span>
                <span>
                  <strong>বাজুস নোটিশের পিক সময়:</strong> আন্তর্জাতিক বাজারে দাম বাড়লে বাজুস সকালে দাম বাড়ানোর প্রেস বিজ্ঞপ্তি দেয়। দর বৃদ্ধি পাওয়ার দিনই বিক্রির সেরা সময়।
                </span>
              </li>
            </ul>
          </div>

        </div>
      </div>
    </div>
  );
};
