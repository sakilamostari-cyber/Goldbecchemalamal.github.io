import React, { useState, useMemo } from 'react';
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  Line,
  XAxis, 
  YAxis, 
  Tooltip, 
  ReferenceLine, 
  ReferenceArea,
  CartesianGrid,
  Brush
} from 'recharts';
import { 
  TrendingUp, 
  ArrowUpRight, 
  ArrowDownRight, 
  ZoomIn, 
  ZoomOut, 
  RotateCcw, 
  Sliders, 
  Eye, 
  EyeOff,
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';
import { GoldKarat } from '../types/gold';
import { INITIAL_GOLD_DATA, formatBDT } from '../data/goldData';

interface PersonalTrendChartProps {
  targetSellPrice: number;
  currentLocalRate?: number;
  selectedKarat?: GoldKarat;
  onKaratChange?: (k: GoldKarat) => void;
}

export const PersonalTrendChart: React.FC<PersonalTrendChartProps> = ({ 
  targetSellPrice,
  currentLocalRate,
  selectedKarat: externalKarat,
  onKaratChange
}) => {
  const [internalKarat, setInternalKarat] = useState<GoldKarat>('22K');
  const activeKarat = externalKarat || internalKarat;

  const handleSelectKarat = (k: GoldKarat) => {
    if (onKaratChange) {
      onKaratChange(k);
    } else {
      setInternalKarat(k);
    }
  };

  // Timeframe window selection: 7D, 15D, 30D, 60D, 90D
  const [timeframeDays, setTimeframeDays] = useState<number>(30);

  // Zoom index range for Brush / programmatic zoom
  const [brushIndices, setBrushIndices] = useState<{ startIndex?: number; endIndex?: number }>({});

  // Display Layer Toggles
  const [showBuyback, setShowBuyback] = useState<boolean>(true);
  const [showMA7, setShowMA7] = useState<boolean>(true);
  const [showThreshold, setShowThreshold] = useState<boolean>(true);
  const [showPeakZone, setShowPeakZone] = useState<boolean>(true);

  // Generate enriched historical dataset with 7-day Moving Average (MA7)
  const fullKaratData = useMemo(() => {
    const records = INITIAL_GOLD_DATA.filter((r) => r.goldType === activeKarat);
    return records.map((r, idx, arr) => {
      const d = new Date(r.date);
      const day = d.getDate();
      const month = d.toLocaleString('en-US', { month: 'short' });
      
      // Calculate 7-day moving average
      const windowStart = Math.max(0, idx - 6);
      const windowSlice = arr.slice(windowStart, idx + 1);
      const ma7 = Math.round(
        windowSlice.reduce((sum, item) => sum + item.marketPricePerVoriBDT, 0) / windowSlice.length
      );

      // If this is the latest day and user has a custom local shop rate, blend it
      const marketPrice = (idx === arr.length - 1 && currentLocalRate && currentLocalRate > 0)
        ? currentLocalRate
        : r.marketPricePerVoriBDT;
      const buybackPrice = Math.round(marketPrice * 0.825);

      return {
        date: r.date,
        displayDate: `${day} ${month}`,
        marketPrice,
        buybackPrice,
        ma7,
        perGram: Math.round((marketPrice / 11.664) * 10) / 10,
        isPeak: r.is30DayPeak || marketPrice >= targetSellPrice,
      };
    });
  }, [activeKarat, currentLocalRate, targetSellPrice]);

  // Windowed dataset based on selected timeframe
  const activeDataset = useMemo(() => {
    return fullKaratData.slice(-timeframeDays);
  }, [fullKaratData, timeframeDays]);

  // Dynamic statistics for the active dataset
  const { minPrice, maxPrice, startPrice, currentPrice, changePrice, changePercent, peakDate } = useMemo(() => {
    if (!activeDataset.length) {
      return { minPrice: 0, maxPrice: 0, startPrice: 0, currentPrice: 0, changePrice: 0, changePercent: 0, peakDate: '' };
    }
    const prices = activeDataset.map((d) => d.marketPrice);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const peakItem = activeDataset.find((d) => d.marketPrice === max);
    const start = activeDataset[0].marketPrice;
    const current = activeDataset[activeDataset.length - 1].marketPrice;
    const diff = current - start;
    const pct = Number(((diff / start) * 100).toFixed(2));
    return {
      minPrice: min,
      maxPrice: max,
      startPrice: start,
      currentPrice: current,
      changePrice: diff,
      changePercent: pct,
      peakDate: peakItem?.displayDate || '',
    };
  }, [activeDataset]);

  // Dynamic Y-Axis scale
  const yDomain = useMemo(() => {
    const valuesToFit = [minPrice, maxPrice];
    if (showThreshold) valuesToFit.push(targetSellPrice);
    if (showBuyback) valuesToFit.push(Math.round(minPrice * 0.825));

    const floor = Math.floor(Math.min(...valuesToFit) * 0.98);
    const ceil = Math.ceil(Math.max(...valuesToFit) * 1.015);
    return [floor, ceil];
  }, [minPrice, maxPrice, targetSellPrice, showThreshold, showBuyback]);

  // Zoom controls
  const handleZoomIn = () => {
    if (timeframeDays > 7) {
      const nextTimeframe = timeframeDays <= 15 ? 7 : timeframeDays <= 30 ? 15 : timeframeDays <= 60 ? 30 : 60;
      setTimeframeDays(nextTimeframe);
    }
  };

  const handleZoomOut = () => {
    if (timeframeDays < 90) {
      const nextTimeframe = timeframeDays >= 60 ? 90 : timeframeDays >= 30 ? 60 : timeframeDays >= 15 ? 30 : 15;
      setTimeframeDays(nextTimeframe);
    }
  };

  const handleResetZoom = () => {
    setTimeframeDays(30);
    setBrushIndices({});
  };

  return (
    <div className="bg-white border-2 border-red-100 rounded-2xl p-4 md:p-5 shadow-xs space-y-4">
      {/* Header and Toolbar */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D32F2F] animate-pulse" />
            <h3 className="font-black text-gray-900 text-base flex items-center gap-1.5">
              <span>সোনার দর গ্রাফ ও জুম ট্রেন্ড এনালাইজার</span>
              <span className="text-[10px] bg-[#FFE6EE] text-[#D32F2F] font-bold px-2 py-0.5 rounded-full">
                Interactive Zoom & Pan
              </span>
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            নিচের স্লাইডার বা জুম বাটন ব্যবহার করে যেকোনো সপ্তাহের বাজার রেট ও বিক্রির পিক পয়েন্ট বড় করে দেখুন।
          </p>
        </div>

        {/* Karat Selection Pills */}
        <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl border border-gray-200 self-start lg:self-auto">
          {(['22K', '21K', '18K', 'Traditional'] as GoldKarat[]).map((k) => (
            <button
              key={k}
              onClick={() => handleSelectKarat(k)}
              className={`px-3 py-1 text-xs font-bold rounded-lg transition ${
                activeKarat === k
                  ? 'bg-[#D32F2F] text-white shadow-2xs'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
              }`}
            >
              {k}
            </button>
          ))}
        </div>
      </div>

      {/* Timeframe Presets & Zoom Buttons */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
        {/* Preset Days Buttons */}
        <div className="flex items-center gap-1 bg-gray-50 p-1 rounded-lg border border-gray-200">
          <Calendar className="w-3.5 h-3.5 text-gray-500 ml-1.5 mr-0.5" />
          {[
            { label: '৭ দিন', days: 7 },
            { label: '১৫ দিন', days: 15 },
            { label: '১ মাস (৩০D)', days: 30 },
            { label: '২ মাস (৬০D)', days: 60 },
            { label: '৩ মাস (৯০D)', days: 90 },
          ].map((preset) => (
            <button
              key={preset.days}
              onClick={() => {
                setTimeframeDays(preset.days);
                setBrushIndices({});
              }}
              className={`px-2.5 py-1 rounded-md font-bold transition text-[11px] ${
                timeframeDays === preset.days
                  ? 'bg-white text-[#D32F2F] shadow-2xs border border-red-200'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Zoom Controls & Reset */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleZoomIn}
            disabled={timeframeDays <= 7}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold border border-gray-200 disabled:opacity-30 disabled:pointer-events-none transition"
            title="জুম ইন করুন (সংক্ষিপ্ত দিন)"
          >
            <ZoomIn className="w-3.5 h-3.5 text-gray-600" />
            <span>Zoom In</span>
          </button>
          <button
            onClick={handleZoomOut}
            disabled={timeframeDays >= 90}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 font-semibold border border-gray-200 disabled:opacity-30 disabled:pointer-events-none transition"
            title="জুম আউট করুন (বেশি দিন)"
          >
            <ZoomOut className="w-3.5 h-3.5 text-gray-600" />
            <span>Zoom Out</span>
          </button>
          <button
            onClick={handleResetZoom}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white hover:bg-gray-50 text-gray-600 border border-gray-200 transition"
            title="রিসেট ভিউ"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>রিসেট</span>
          </button>
        </div>
      </div>

      {/* Stat Badges for Currently Zoomed Range */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200">
          <span className="text-[10px] text-gray-500 block uppercase font-medium">বর্তমান রেট ({activeKarat})</span>
          <span className="font-mono font-black text-gray-900 text-base">
            ৳ {formatBDT(currentPrice)}
          </span>
          <span className="text-[10px] text-gray-400 block mt-0.5">১ ভরি = ১১.৬৬৪ গ্রাম</span>
        </div>

        <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200">
          <span className="text-[10px] text-gray-500 block uppercase font-medium">{timeframeDays} দিনের পরিবর্তন</span>
          <span className={`font-mono font-black text-base flex items-center gap-0.5 ${
            changePrice >= 0 ? 'text-emerald-700' : 'text-red-700'
          }`}>
            {changePrice >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
            {changePrice >= 0 ? '+' : ''}৳ {formatBDT(changePrice)} ({changePercent}%)
          </span>
          <span className="text-[10px] text-gray-500 block mt-0.5">
            শুরুতে ছিল: ৳ {formatBDT(startPrice)}
          </span>
        </div>

        <div className="bg-red-50/60 p-2.5 rounded-xl border border-red-200">
          <span className="text-[10px] text-[#D32F2F] block uppercase font-bold">পিক রেকর্ড (সর্বোচ্চ চূড়া)</span>
          <span className="font-mono font-black text-gray-900 text-base">
            ৳ {formatBDT(maxPrice)}
          </span>
          <span className="text-[10px] text-[#D32F2F] font-semibold block mt-0.5">
            পিক তারিখ: {peakDate}
          </span>
        </div>

        <div className="bg-[#FFE6EE]/40 p-2.5 rounded-xl border border-[#ffd2df]">
          <span className="text-[10px] text-[#D32F2F] block font-bold uppercase">টার্গেট বিক্রয় মূল্য</span>
          <span className="font-mono font-black text-[#D32F2F] text-base">
            ৳ {formatBDT(targetSellPrice)}
          </span>
          <span className={`text-[10px] font-bold block mt-0.5 ${
            currentPrice >= targetSellPrice ? 'text-emerald-700' : 'text-gray-500'
          }`}>
            {currentPrice >= targetSellPrice ? '✓ টার্গেট অর্জিত!' : `টার্গেট থেকে বাকি: ৳ ${formatBDT(targetSellPrice - currentPrice)}`}
          </span>
        </div>
      </div>

      {/* Layer Toggles Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px] text-gray-600">
        <span className="font-semibold text-gray-400">গ্রাফ লেয়ার:</span>
        
        <button
          onClick={() => setShowBuyback(!showBuyback)}
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border transition ${
            showBuyback ? 'bg-amber-50 text-amber-900 border-amber-300 font-bold' : 'bg-gray-50 text-gray-400 border-gray-200'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>পুরাতন সোনা ক্যাশআউট (~৮২.৫%)</span>
        </button>

        <button
          onClick={() => setShowMA7(!showMA7)}
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border transition ${
            showMA7 ? 'bg-blue-50 text-blue-900 border-blue-300 font-bold' : 'bg-gray-50 text-gray-400 border-gray-200'
          }`}
        >
          <span className="w-2 h-0.5 bg-blue-600" />
          <span>৭-দিনের ট্রেন্ডলাইন (MA7)</span>
        </button>

        <button
          onClick={() => setShowThreshold(!showThreshold)}
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border transition ${
            showThreshold ? 'bg-red-50 text-red-900 border-red-300 font-bold' : 'bg-gray-50 text-gray-400 border-gray-200'
          }`}
        >
          <span className="w-2 h-0.5 border-b border-dashed border-[#D32F2F]" />
          <span>টার্গেট লাইন (৳ {formatBDT(targetSellPrice)})</span>
        </button>

        <button
          onClick={() => setShowPeakZone(!showPeakZone)}
          className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border transition ${
            showPeakZone ? 'bg-emerald-50 text-emerald-900 border-emerald-300 font-bold' : 'bg-gray-50 text-gray-400 border-gray-200'
          }`}
        >
          <Sparkles className="w-3 h-3 text-emerald-600" />
          <span>পিক সেল হাইলাইট জোন</span>
        </button>
      </div>

      {/* Main Recharts Container with Brush Slider for Interactive Pan & Zoom */}
      <div className="w-full h-80 pt-2 select-none">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart 
            data={activeDataset} 
            margin={{ top: 12, right: 16, left: -14, bottom: 4 }}
          >
            <defs>
              {/* Primary Market Pink Gradient */}
              <linearGradient id="zoomPinkGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#D32F2F" stopOpacity={0.35} />
                <stop offset="60%" stopColor="#FFE6EE" stopOpacity={0.5} />
                <stop offset="100%" stopColor="#FFE6EE" stopOpacity={0.02} />
              </linearGradient>

              {/* Buyback Amber Gradient */}
              <linearGradient id="zoomAmberGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#fef3c7" stopOpacity={0.01} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
            
            <XAxis 
              dataKey="displayDate" 
              tick={{ fontSize: 10, fill: '#6B7280' }} 
              tickLine={false} 
              axisLine={{ stroke: '#E5E7EB' }}
              interval="preserveStartEnd"
            />
            
            <YAxis 
              domain={yDomain}
              tick={{ fontSize: 9, fill: '#9CA3AF' }} 
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `৳${(v / 1000).toFixed(0)}k`}
            />

            <Tooltip content={<EnhancedZoomTooltip targetPrice={targetSellPrice} maxPrice={maxPrice} />} />

            {/* Visual Peak Selling Zone Highlight Area (Top 1.5% of range) */}
            {showPeakZone && maxPrice > 0 && (
              <ReferenceArea
                y1={maxPrice - 600}
                y2={maxPrice + 200}
                fill="#D32F2F"
                fillOpacity={0.08}
                stroke="#D32F2F"
                strokeOpacity={0.2}
                strokeDasharray="3 3"
              />
            )}

            {/* User Target Selling Threshold Line */}
            {showThreshold && targetSellPrice >= yDomain[0] && targetSellPrice <= yDomain[1] && (
              <ReferenceLine 
                y={targetSellPrice} 
                stroke="#D32F2F" 
                strokeDasharray="4 4" 
                strokeWidth={2}
                label={{ 
                  value: `🎯 টার্গেট: ৳${formatBDT(targetSellPrice)}`, 
                  fill: '#D32F2F', 
                  fontSize: 10, 
                  position: 'insideTopRight',
                  fontWeight: 'bold'
                }} 
              />
            )}

            {/* Old Gold Buyback Cashout Area */}
            {showBuyback && (
              <Area
                type="monotone"
                dataKey="buybackPrice"
                stroke="#d97706"
                strokeWidth={1.8}
                fillOpacity={1}
                fill="url(#zoomAmberGradient)"
                name="পুরাতন সোনা ক্যাশআউট (Buyback)"
              />
            )}

            {/* Official BAJUS Market Price Area */}
            <Area
              type="monotone"
              dataKey="marketPrice"
              stroke="#D32F2F"
              strokeWidth={2.4}
              fillOpacity={1}
              fill="url(#zoomPinkGradient)"
              activeDot={{ r: 6, fill: '#D32F2F', stroke: '#FFFFFF', strokeWidth: 2 }}
              name="অফিসিয়াল বাজার দর (Market Rate)"
            />

            {/* 7-Day Moving Average Line */}
            {showMA7 && (
              <Line
                type="monotone"
                dataKey="ma7"
                stroke="#2563eb"
                strokeWidth={1.5}
                strokeDasharray="3 3"
                dot={false}
                name="৭-দিনের মুভিং এভারেজ (MA7)"
              />
            )}

            {/* Interactive Brush Slider for Panning and Zooming Range */}
            <Brush 
              dataKey="displayDate" 
              height={26} 
              stroke="#D32F2F" 
              fill="#FFF1F2"
              tickFormatter={() => ''}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div className="flex items-center justify-between text-[11px] text-gray-500 pt-1">
        <span className="flex items-center gap-1 text-[#D32F2F] font-semibold">
          <Info className="w-3.5 h-3.5" />
          <span>টিপস: গ্রাফের নিচের বারটি (Brush) টেনে দিন বাড়াতে/কমাতে পারবেন</span>
        </span>
        <span className="text-gray-400">১ ভরি = ১১.৬৬৪ গ্রাম (BAJUS রেট অনুযায়ী)</span>
      </div>
    </div>
  );
};

interface EnhancedZoomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
  targetPrice: number;
  maxPrice: number;
}

const EnhancedZoomTooltip: React.FC<EnhancedZoomTooltipProps> = ({ 
  active, 
  payload, 
  targetPrice,
  maxPrice 
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isAboveTarget = data.marketPrice >= targetPrice;
    const isAtTopPeak = data.marketPrice >= maxPrice - 200;

    return (
      <div className="bg-gray-950 text-white rounded-xl p-3 text-xs shadow-2xl border border-gray-800 space-y-1.5 select-none min-w-[210px] animate-fadeIn">
        <div className="flex items-center justify-between border-b border-gray-800 pb-1">
          <span className="font-bold text-gray-200">{data.date}</span>
          <span className="text-[10px] text-gray-400">{data.displayDate}</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-400">বাজুস ভরি দর:</span>
          <span className="text-yellow-300 font-mono font-bold text-sm">৳ {formatBDT(data.marketPrice)}</span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <span className="text-gray-400">বিক্রি করলে পাবেন:</span>
          <span className="text-[#ff8a9a] font-mono font-bold">৳ {formatBDT(data.buybackPrice)}</span>
        </div>

        <div className="flex items-center justify-between gap-4 text-[10px] text-gray-400">
          <span>৭-দিনের গড় (MA7):</span>
          <span className="text-blue-300 font-mono">৳ {formatBDT(data.ma7)}</span>
        </div>

        <div className="flex items-center justify-between gap-4 text-[10px] text-gray-400 border-t border-gray-800/80 pt-1">
          <span>প্রতি গ্রাম রেট:</span>
          <span className="text-gray-300 font-mono">৳ {formatBDT(data.perGram)}/g</span>
        </div>

        {/* Sell Recommendation Callout */}
        {isAtTopPeak ? (
          <div className="mt-1 text-[10px] font-bold text-white bg-[#D32F2F] px-2 py-1 rounded flex items-center gap-1.5">
            <span>🚨 পিক রেট: সোনা বিক্রির সেরা সময়!</span>
          </div>
        ) : isAboveTarget ? (
          <div className="mt-1 text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800 flex items-center gap-1">
            <span>✓ টার্গেট মূল্য অর্জিত ছিল</span>
          </div>
        ) : null}
      </div>
    );
  }
  return null;
};
