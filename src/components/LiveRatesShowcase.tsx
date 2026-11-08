import React, { useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Sparkles, 
  ArrowRight, 
  ShieldCheck, 
  Clock, 
  HelpCircle,
  Coins,
  ChevronRight,
  Sliders,
  DollarSign,
  AlertTriangle
} from 'lucide-react';
import { GoldKarat } from '../types/gold';
import { 
  KARAT_INFO, 
  VORI_TO_GRAM, 
  formatBDT, 
  toBengaliNumerals 
} from '../data/goldData';

interface LiveRatesShowcaseProps {
  rates: Record<GoldKarat, number>;
  targetSellPrice: number;
  onUpdateTargetSellPrice: (price: number) => void;
  buybackPercent: number;
  onSelectKaratToSell: (karat: GoldKarat) => void;
}

export const LiveRatesShowcase: React.FC<LiveRatesShowcaseProps> = ({
  rates,
  targetSellPrice,
  onUpdateTargetSellPrice,
  buybackPercent,
  onSelectKaratToSell,
}) => {
  // Quick calculator state inside Live rates view
  const [calcKarat, setCalcKarat] = useState<GoldKarat>('22K');
  const [calcWeightUnit, setCalcWeightUnit] = useState<'vori' | 'gram'>('vori');
  const [calcWeight, setCalcWeight] = useState<string>('1');
  const [showTargetSlider, setShowTargetSlider] = useState<boolean>(false);

  // Check if current 22K rate reaches or exceeds target price
  const is22KPeak = rates['22K'] >= targetSellPrice;
  const priceDifference = rates['22K'] - targetSellPrice;

  // Rate changes (daily change baseline)
  const rateChanges: Record<GoldKarat, { changeBDT: number; changePercent: number }> = {
    '22K': { changeBDT: 1750, changePercent: 0.78 },
    '21K': { changeBDT: 1670, changePercent: 0.77 },
    '18K': { changeBDT: 1435, changePercent: 0.78 },
    'Traditional': { changeBDT: 1245, changePercent: 0.78 },
  };

  // Quick calculator computation
  const calcWeightNum = parseFloat(calcWeight) || 0;
  const calcVoriEquivalent = calcWeightUnit === 'vori' ? calcWeightNum : (calcWeightNum / VORI_TO_GRAM);
  const calcMarketTotal = Math.round(calcVoriEquivalent * rates[calcKarat]);
  const calcBuybackTotal = Math.round(calcMarketTotal * (buybackPercent / 100));

  const karatsList: GoldKarat[] = ['22K', '21K', '18K', 'Traditional'];

  return (
    <div className="space-y-4 max-w-4xl mx-auto pb-6">
      
      {/* 1. Mobile-Optimized Status & BAJUS Official Source Bar */}
      <div className="bg-white border border-gray-200 rounded-2xl p-3.5 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#FFE6EE] text-[#D32F2F] flex items-center justify-center font-bold text-xs shrink-0">
            ৳
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-gray-900 text-xs">বাংলাদেশ জুয়েলার্স অ্যাসোসিয়েশন (BAJUS)</span>
              <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.2 rounded-sm border border-emerald-200">
                লাইভ ভেরিফাইড
              </span>
            </div>
            <p className="text-[11px] text-gray-500">
              উৎস: gold-price.bd ও goldr.org · সর্বশেষ আপডেট: ৮ নভেম্বর ২০২৬, সকাল ১০:০০
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-[11px] text-gray-500 self-end sm:self-auto">
          <span>১ ভরি = ১১.৬৬৪ গ্রাম</span>
          <span>·</span>
          <span>১৬ আনা = ৯৬ রতি</span>
        </div>
      </div>

      {/* 2. THE HIGHEST PRICE TARGET HERO BANNER (The Core Focus) */}
      <div className={`rounded-2xl p-4 sm:p-5 border transition-all ${
        is22KPeak
          ? 'bg-gradient-to-br from-[#FFE6EE] via-white to-red-50 border-[#D32F2F] shadow-sm'
          : 'bg-white border-gray-200 shadow-2xs'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${is22KPeak ? 'bg-[#D32F2F] animate-ping' : 'bg-amber-500'}`} />
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                সর্বোচ্চ দামে পুরাতন সোনা বিক্রির সুযোগ
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-black text-gray-900 leading-snug">
              {is22KPeak ? (
                <span className="text-[#D32F2F] flex items-center gap-1.5">
                  <span>🚨 বিক্রির সেরা সময় (Peak Opportunity)!</span>
                </span>
              ) : (
                <span className="text-gray-900">
                  বাজার পর্যবেক্ষণ করুন (Hold or Set Target)
                </span>
              )}
            </h2>

            <p className="text-xs text-gray-600 leading-relaxed">
              {is22KPeak ? (
                <>
                  বর্তমান ২২ ক্যারেট বাজার দর (<strong className="text-gray-900">৳ {formatBDT(rates['22K'])}</strong>) আপনার কাঙ্ক্ষিত বিক্রয় টার্গেটের (<strong className="text-gray-900">৳ {formatBDT(targetSellPrice)}</strong>) চেয়ে <strong className="text-[#D32F2F] font-bold">৳ {formatBDT(priceDifference)} বেশি</strong>। পুরাতন সোনা বিক্রি করে সর্বোচ্চ নগদ টাকা পাওয়ার সুবর্ণ সুযোগ!
                </>
              ) : (
                <>
                  বর্তমান দর <strong className="text-gray-900">৳ {formatBDT(rates['22K'])}</strong>। আপনার টার্গেট <strong className="text-gray-900">৳ {formatBDT(targetSellPrice)}</strong>। পিক সময় পৌঁছা মাত্রই AI অটো-পাইলট আপনার জিমেইলে অ্যালার্ট পাঠিয়ে দেবে।
                </>
              )}
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => setShowTargetSlider(!showTargetSlider)}
              className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-xl text-xs font-bold transition shadow-2xs"
            >
              <Sliders className="w-3.5 h-3.5 text-[#D32F2F]" />
              <span>টার্গেট পরিবর্তন: ৳ {formatBDT(targetSellPrice)}</span>
            </button>
          </div>
        </div>

        {/* Expandable Target Sell Price Adjustment */}
        {showTargetSlider && (
          <div className="mt-4 pt-3 border-t border-gray-200/80 text-xs space-y-2 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-gray-700">আপনার বিক্রয় লক্ষ্যমাত্রা নির্ধারণ করুন:</span>
              <span className="font-mono font-black text-sm text-[#D32F2F]">৳ {formatBDT(targetSellPrice)} / ভরি</span>
            </div>
            <input
              type="range"
              min={200000}
              max={245000}
              step={1000}
              value={targetSellPrice}
              onChange={(e) => onUpdateTargetSellPrice(Number(e.target.value))}
              className="w-full accent-[#D32F2F] cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-gray-400 font-mono">
              <span>৳ ২,০০,০০০</span>
              <span>৳ ২,২০,০০০</span>
              <span>৳ ২,৪৫,০০০</span>
            </div>
          </div>
        )}
      </div>

      {/* 3. SIGNATURE LIVE GOLD RATES GRID (Styled like gold-price.bd) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-black text-sm text-gray-900 flex items-center gap-1.5">
            <span>আজকের সোনার লাইভ দর (Live Gold Rates)</span>
          </h3>
          <span className="text-[11px] text-gray-500 font-medium">
            প্রতি ভরি ও প্রতি গ্রাম হিসাব
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {karatsList.map((k) => {
            const marketRate = rates[k];
            const buybackRate = Math.round(marketRate * (buybackPercent / 100));
            const perGramMarket = Math.round((marketRate / VORI_TO_GRAM) * 10) / 10;
            const perGramBuyback = Math.round((buybackRate / VORI_TO_GRAM) * 10) / 10;
            const change = rateChanges[k];
            const isSelectedKarat = k === '22K';

            return (
              <div
                key={k}
                className={`bg-white rounded-2xl p-4 border transition-all relative overflow-hidden shadow-2xs hover:shadow-sm ${
                  isSelectedKarat ? 'border-[#D32F2F]/40 ring-1 ring-red-100' : 'border-gray-200'
                }`}
              >
                {/* Karat Header */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="w-8 h-8 rounded-xl bg-[#FFE6EE] text-[#D32F2F] font-black text-xs flex items-center justify-center shrink-0">
                      {k}
                    </span>
                    <div>
                      <h4 className="font-black text-sm text-gray-900 leading-tight">
                        {KARAT_INFO[k].banglaName}
                      </h4>
                      <span className="text-[10px] text-gray-500 block">
                        {KARAT_INFO[k].purity}
                      </span>
                    </div>
                  </div>

                  {/* Daily Change Badge */}
                  <div className="text-right">
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                      <TrendingUp className="w-3 h-3" />
                      <span>+৳ {formatBDT(change.changeBDT)}</span>
                    </span>
                    <span className="text-[10px] text-gray-400 block mt-0.5">
                      ({change.changePercent}% বৃদ্ধি)
                    </span>
                  </div>
                </div>

                {/* Rates Breakdown */}
                <div className="grid grid-cols-2 gap-3 py-3">
                  {/* Official Market Buying Price */}
                  <div>
                    <span className="text-[10px] text-gray-400 uppercase font-semibold block">
                      বাজুস বাজার দর (নতুন)
                    </span>
                    <div className="mt-0.5">
                      <span className="font-mono font-black text-base text-gray-900 block leading-tight">
                        ৳ {formatBDT(marketRate)}
                      </span>
                      <span className="text-[10px] text-gray-500 block mt-0.5">
                        প্রতি গ্রাম: ৳ {formatBDT(perGramMarket)}
                      </span>
                    </div>
                  </div>

                  {/* Old Gold Cashout / Resale Price */}
                  <div className="bg-[#FFE6EE]/40 p-2 rounded-xl border border-red-100">
                    <span className="text-[10px] font-bold text-[#D32F2F] block">
                      পুরাতন সোনা বিক্রি করলে পাবেন:
                    </span>
                    <div className="mt-0.5">
                      <span className="font-mono font-black text-base text-[#D32F2F] block leading-tight">
                        ৳ {formatBDT(buybackRate)}
                      </span>
                      <span className="text-[10px] text-gray-600 block mt-0.5">
                        প্রতি গ্রাম: ৳ {formatBDT(perGramBuyback)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action CTA to Sell this Karat */}
                <div className="pt-2 border-t border-gray-100 flex items-center justify-between">
                  <span className="text-[10px] text-gray-500">
                    ক্যাশব্যাক হার: ~{buybackPercent}% (মেমোসহ)
                  </span>
                  <button
                    type="button"
                    onClick={() => onSelectKaratToSell(k)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#D32F2F] hover:text-red-800 transition"
                  >
                    <span>এই সোনা বিক্রি হিসাব</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Silver Price Highlight (As requested by gold-price.bd layout) */}
        <div className="bg-white rounded-2xl p-3.5 border border-gray-200 shadow-2xs flex items-center justify-between text-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gray-100 text-gray-700 font-bold flex items-center justify-center shrink-0">
              Ag
            </div>
            <div>
              <span className="font-bold text-gray-900 block">রুপার লাইভ দর (Silver Rate)</span>
              <span className="text-[10px] text-gray-500">ক্যাডমিয়াম হলমার্ক ২২ ক্যারেট রুপা</span>
            </div>
          </div>
          <div className="text-right">
            <span className="font-mono font-bold text-gray-900 text-sm">৳ ২,১০০ / ভরি</span>
            <span className="text-[10px] text-gray-500 block">প্রতি গ্রাম: ৳ ১৮০</span>
          </div>
        </div>
      </div>

      {/* 4. INSTANT OLD GOLD RESALE CALCULATOR WIDGET */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#FFE6EE] text-[#D32F2F] flex items-center justify-center font-bold text-xs">
              ⚡
            </div>
            <h3 className="font-black text-sm text-gray-900">
              দ্রুত পুরাতন সোনার ক্যাশআউট ক্যালকুলেটর (Quick Cash Calculator)
            </h3>
          </div>
          <span className="text-[10px] text-gray-400">তাত্ক্ষণিক হিসাব</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Karat Selector */}
          <div>
            <label className="text-[11px] font-semibold text-gray-600 block mb-1">সোনার ক্যারেট:</label>
            <select
              value={calcKarat}
              onChange={(e) => setCalcKarat(e.target.value as GoldKarat)}
              className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-hidden focus:border-[#D32F2F]"
            >
              <option value="22K">২২ ক্যারেট (৳ {formatBDT(rates['22K'])})</option>
              <option value="21K">২১ ক্যারেট (৳ {formatBDT(rates['21K'])})</option>
              <option value="18K">১৮ ক্যারেট (৳ {formatBDT(rates['18K'])})</option>
              <option value="Traditional">সনাতন পদ্ধতি (৳ {formatBDT(rates['Traditional'])})</option>
            </select>
          </div>

          {/* Unit Toggle & Input */}
          <div className="sm:col-span-2">
            <div className="flex items-center justify-between mb-1">
              <label className="text-[11px] font-semibold text-gray-600">ওজন প্রদান করুন:</label>
              <div className="flex gap-1 text-[10px]">
                <button
                  type="button"
                  onClick={() => setCalcWeightUnit('vori')}
                  className={`px-2 py-0.5 rounded font-bold transition ${
                    calcWeightUnit === 'vori' ? 'bg-[#D32F2F] text-white' : 'text-gray-500 bg-gray-100'
                  }`}
                >
                  ভরি (Vori)
                </button>
                <button
                  type="button"
                  onClick={() => setCalcWeightUnit('gram')}
                  className={`px-2 py-0.5 rounded font-bold transition ${
                    calcWeightUnit === 'gram' ? 'bg-[#D32F2F] text-white' : 'text-gray-500 bg-gray-100'
                  }`}
                >
                  গ্রাম (Gram)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="0.01"
                step="0.01"
                value={calcWeight}
                onChange={(e) => setCalcWeight(e.target.value)}
                placeholder="ওজন লিখুন"
                className="w-full bg-gray-50 border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold font-mono focus:outline-hidden focus:border-[#D32F2F]"
              />
              <span className="text-xs font-bold text-gray-500 shrink-0">
                {calcWeightUnit === 'vori' ? 'ভরি' : 'গ্রাম'}
              </span>
            </div>
          </div>
        </div>

        {/* Instant Calculation Output */}
        <div className="bg-gradient-to-r from-[#FFE6EE] via-white to-red-50 p-4 rounded-xl border border-red-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] text-gray-500 uppercase font-bold block">
              পুরাতন সোনা বিক্রি করলে আপনার হাতে নগদ ক্যাশ আসবে:
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-lg text-[#D32F2F] font-black">৳</span>
              <span className="text-2xl sm:text-3xl font-black text-gray-900 font-mono">
                {formatBDT(calcBuybackTotal)}
              </span>
              <span className="text-xs font-bold text-gray-500">BDT</span>
            </div>
            <span className="text-[10px] text-gray-500 block">
              বাজুস বাজার মূল্য: ৳ {formatBDT(calcMarketTotal)} (দোকান কর্তন: ~{Number((100 - buybackPercent).toFixed(1))}%)
            </span>
          </div>

          <button
            type="button"
            onClick={() => onSelectKaratToSell(calcKarat)}
            className="w-full sm:w-auto px-4 py-2.5 bg-[#D32F2F] hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center justify-center gap-1.5 shrink-0"
          >
            <span>আমার তালিকায় যুক্ত করুন</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

    </div>
  );
};
