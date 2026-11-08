import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Sparkles, 
  Bell, 
  BellRing, 
  Volume2, 
  VolumeX, 
  Mail, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  Clock, 
  DollarSign, 
  Sliders, 
  HelpCircle,
  ArrowRight,
  Info
} from 'lucide-react';
import { GoldKarat } from '../types/gold';
import { 
  evaluateBestTimeToSell, 
  playAlertChime, 
  formatBDT, 
  INITIAL_GOLD_DATA 
} from '../data/goldData';

interface BestTimeToSellEngineProps {
  currentPrice: number;
  targetPrice: number;
  onTargetPriceChange: (newTarget: number) => void;
  onLocalPriceChange: (newPrice: number) => void;
  selectedKarat: GoldKarat;
  onOpenEmailModal: () => void;
}

export const BestTimeToSellEngine: React.FC<BestTimeToSellEngineProps> = ({
  currentPrice,
  targetPrice,
  onTargetPriceChange,
  onLocalPriceChange,
  selectedKarat,
  onOpenEmailModal,
}) => {
  // Browser Notification state
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(
    typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default'
  );
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [showLocalPriceModal, setShowLocalPriceModal] = useState<boolean>(false);
  const [tempLocalRate, setTempLocalRate] = useState<number>(currentPrice);
  const [localShopLocation, setLocalShopLocation] = useState<string>('ঢাকা তাঁতিবাজার (Dhaka Tantibazar)');

  // Extract last 30 prices for the selected karat
  const last30Prices = React.useMemo(() => {
    return INITIAL_GOLD_DATA
      .filter((r) => r.goldType === selectedKarat)
      .slice(-30)
      .map((r) => r.marketPricePerVoriBDT);
  }, [selectedKarat]);

  // Compute Best Time to Sell Intelligence analysis
  const analysis = React.useMemo(() => {
    return evaluateBestTimeToSell(currentPrice, targetPrice, last30Prices);
  }, [currentPrice, targetPrice, last30Prices]);

  // Trigger sound when peak triggers (if enabled)
  useEffect(() => {
    if (analysis.signal === 'PEAK_SELL' && soundEnabled) {
      playAlertChime(true);
    }
  }, [analysis.signal, soundEnabled]);

  // Request browser notification permission
  const handleEnableNotifications = async () => {
    if (!('Notification' in window)) {
      alert('আপনার ব্রাউজার ডেস্কটপ নোটিফিকেশন সাপোর্ট করে না।');
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);

      if (permission === 'granted') {
        new Notification('🚨 [Gold বেচে মালামাল] অ্যালার্ট সক্রিয় করা হয়েছে!', {
          body: `সোনার দর আপনার টার্গেট (৳ ${formatBDT(targetPrice)}) পৌঁছালে স্বয়ংক্রিয় নোটিফিকেশন পাবেন।`,
          icon: '/favicon.ico',
        });
      }
    } catch (e) {
      console.warn('Notification permission error:', e);
    }
  };

  const handleTestSound = () => {
    playAlertChime(analysis.signal === 'PEAK_SELL');
  };

  const handleSaveLocalRate = (e: React.FormEvent) => {
    e.preventDefault();
    if (tempLocalRate > 50000) {
      onLocalPriceChange(tempLocalRate);
      setShowLocalPriceModal(false);
    }
  };

  return (
    <div className="bg-white border-2 border-red-200 rounded-2xl p-5 shadow-sm space-y-4">
      {/* Top Header with Live Signal Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D32F2F] animate-ping" />
            <h3 className="font-black text-gray-900 text-lg flex items-center gap-2">
              <span>স্বর্ণ বিক্রির সেরা সময় নির্দেশক (Best Time to Sell Engine)</span>
            </h3>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            বাজারের দর বৃদ্ধি প্রবণতা, ৩০ দিনের রেকর্ড পিক এবং আপনার বিক্রয় লক্ষ্যের রিয়েল-টাইম কোয়ান্ট বিশ্লেষণ।
          </p>
        </div>

        {/* Signal Badge */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className={`px-3 py-1.5 rounded-xl font-black text-xs shadow-xs flex items-center gap-1.5 ${analysis.badgeColor}`}>
            <span>{analysis.badgeText}</span>
          </span>
          <span className="text-[11px] font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
            বিশ্বাসযোগ্যতা: {analysis.confidence}%
          </span>
        </div>
      </div>

      {/* Main Signal Spotlight Card */}
      <div className={`p-4 md:p-5 rounded-2xl border-2 transition-all ${
        analysis.signal === 'PEAK_SELL'
          ? 'bg-gradient-to-r from-red-50 via-[#FFE6EE]/60 to-red-50 border-[#D32F2F]'
          : analysis.signal === 'APPROACHING_PEAK'
            ? 'bg-amber-50/80 border-amber-300'
            : 'bg-emerald-50/80 border-emerald-300'
      }`}>
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl shrink-0 shadow-inner ${
              analysis.signal === 'PEAK_SELL'
                ? 'bg-[#D32F2F] text-white animate-bounce'
                : analysis.signal === 'APPROACHING_PEAK'
                  ? 'bg-amber-500 text-white'
                  : 'bg-emerald-600 text-white'
            }`}>
              {analysis.signal === 'PEAK_SELL' ? '🚨' : analysis.signal === 'APPROACHING_PEAK' ? '⚠️' : '🛡️'}
            </div>

            <div>
              <h4 className="font-black text-gray-900 text-base md:text-lg">
                {analysis.title}
              </h4>
              <p className="text-xs text-gray-700 mt-1 leading-relaxed">
                {analysis.actionRecommendation}
              </p>
            </div>
          </div>

          {/* Quick Actions (Email & Notification) */}
          <div className="flex items-center gap-2 w-full md:w-auto shrink-0 justify-end">
            <button
              onClick={onOpenEmailModal}
              className="px-3.5 py-2 bg-[#D32F2F] hover:bg-[#b71c1c] text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Gmail এ অ্যালার্ট পাঠান</span>
            </button>
            <button
              onClick={handleTestSound}
              className="p-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition"
              title="সাউন্ড অ্যালার্ট পরীক্ষা করুন"
            >
              <Volume2 className="w-4 h-4 text-[#D32F2F]" />
            </button>
          </div>
        </div>

        {/* 4 Supporting Analytical Reasons */}
        <div className="mt-4 pt-3 border-t border-black/10">
          <span className="text-[11px] font-bold text-gray-700 block mb-1.5 uppercase">
            কেন এই সিদ্ধান্ত? (Analytical Factors):
          </span>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
            {analysis.reasons.map((r, i) => (
              <div key={i} className="flex items-start gap-2 bg-white/70 p-2 rounded-lg border border-black/5">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#D32F2F] shrink-0 mt-0.5" />
                <span className="text-gray-800">{r}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Local Shop Rate Adjuster & Notification Controls Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 pt-1">
        
        {/* Left: Local Jeweler Custom Rate Adjuster (7 cols) */}
        <div className="lg:col-span-7 bg-gray-50 border border-gray-200 rounded-xl p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="font-bold text-gray-800 block">
              স্থানীয় স্বর্ণের দোকানের রেট ({selectedKarat}):
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-sm font-bold text-gray-500">৳</span>
              <span className="font-mono font-black text-gray-900 text-lg">
                {formatBDT(currentPrice)}
              </span>
              <span className="text-gray-500 text-[11px]">/ ভরি</span>
              <span className="text-gray-400 ml-1 text-[10px]">({localShopLocation})</span>
            </div>
          </div>

          <button
            onClick={() => {
              setTempLocalRate(currentPrice);
              setShowLocalPriceModal(true);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-100 text-gray-800 font-bold border border-gray-300 rounded-lg shadow-2xs self-start sm:self-auto transition"
          >
            <Sliders className="w-3.5 h-3.5 text-[#D32F2F]" />
            <span>দোকানের দর পরিবর্তন করুন</span>
          </button>
        </div>

        {/* Right: Instant Browser Push Notification Setting (5 cols) */}
        <div className="lg:col-span-5 bg-[#FFE6EE]/40 border border-[#ffd2df] rounded-xl p-3.5 text-xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BellRing className="w-4 h-4 text-[#D32F2F] shrink-0" />
            <div>
              <span className="font-bold text-gray-900 block text-[11px]">ডেস্কটপ পুশ নোটিফিকেশন</span>
              <span className="text-[10px] text-gray-600">
                {notificationPermission === 'granted' ? '✓ নোটিফিকেশন চালু আছে' : 'টার্গেট পূরণ হলে সরাসরি পপআপ অ্যালার্ট'}
              </span>
            </div>
          </div>

          {notificationPermission !== 'granted' ? (
            <button
              onClick={handleEnableNotifications}
              className="px-2.5 py-1 bg-[#D32F2F] hover:bg-[#b71c1c] text-white rounded-lg text-[11px] font-bold shadow-2xs shrink-0 transition"
            >
              চালু করুন
            </button>
          ) : (
            <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
              সক্রিয়
            </span>
          )}
        </div>

      </div>

      {/* Modal: Local Jeweler Price Adjuster */}
      {showLocalPriceModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-5 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between border-b border-gray-100 pb-2">
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[#D32F2F]" />
                <span>স্থানীয় জুয়েলার্সের সঠিক দর দিন</span>
              </h4>
              <button
                onClick={() => setShowLocalPriceModal(false)}
                className="text-gray-400 hover:text-gray-700 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600">
              আপনার এলাকার দোকানদার (যেমন: তাঁতিবাজার, বায়তুল মোকাররম বা চট্টগ্রামের নিউমার্কেট) যদি অফিসিয়াল বাজুস রেটের চেয়ে ভিন্ন দর অফার করে, এখানে টাইপ করুন:
            </p>

            <form onSubmit={handleSaveLocalRate} className="space-y-3 text-xs">
              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  দোকান বা বাজারের নাম/এলাকা:
                </label>
                <input
                  type="text"
                  value={localShopLocation}
                  onChange={(e) => setLocalShopLocation(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 font-medium"
                />
              </div>

              <div>
                <label className="font-semibold text-gray-700 block mb-1">
                  প্রতি ভরি রেট (BDT / Vori):
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-400 font-bold">৳</span>
                  <input
                    type="number"
                    value={tempLocalRate}
                    step="100"
                    onChange={(e) => setTempLocalRate(Number(e.target.value) || 0)}
                    className="w-full pl-8 pr-12 py-1.5 bg-white border border-gray-300 rounded-lg font-mono font-bold text-gray-900 text-sm focus:border-[#D32F2F] focus:outline-hidden"
                  />
                  <span className="absolute right-3 top-2 text-gray-400 text-xs">BDT</span>
                </div>
              </div>

              {/* Local Presets */}
              <div className="flex items-center gap-1.5 pt-1">
                <span className="text-[10px] text-gray-400">বাজুস প্রিসেট:</span>
                <button
                  type="button"
                  onClick={() => setTempLocalRate(143526)}
                  className="px-2 py-0.5 rounded border border-gray-200 bg-gray-50 text-[10px] hover:bg-gray-100"
                >
                  ২২K (৳ ১,৪৩,৫২৬)
                </button>
                <button
                  type="button"
                  onClick={() => setTempLocalRate(145000)}
                  className="px-2 py-0.5 rounded border border-gray-200 bg-gray-50 text-[10px] hover:bg-gray-100 font-bold text-[#D32F2F]"
                >
                  ৳ ১,৪৫,০০০ (পিক)
                </button>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowLocalPriceModal(false)}
                  className="px-3.5 py-1.5 rounded-lg text-gray-600 hover:bg-gray-100"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#D32F2F] hover:bg-[#b71c1c] text-white rounded-lg font-bold shadow-xs"
                >
                  সংরক্ষণ করুন (Apply Rate)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
