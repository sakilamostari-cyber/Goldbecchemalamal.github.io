import React, { useState } from 'react';
import { 
  Bot, 
  Sparkles, 
  Zap, 
  CheckCircle2, 
  Clock, 
  Mail, 
  Bell, 
  ShieldCheck, 
  AlertCircle,
  Play,
  RotateCcw
} from 'lucide-react';
import { formatBDT } from '../data/goldData';

interface AIAutoPilotPanelProps {
  isAutoPilotEnabled: boolean;
  onToggleAutoPilot: (enabled: boolean) => void;
  targetPrice: number;
  currentRate22K: number;
  recipientEmail: string;
  lastAutoSentDate: string;
  isPeakActive: boolean;
  onTriggerTestAutoPilot: () => void;
  isSendingTest: boolean;
}

export const AIAutoPilotPanel: React.FC<AIAutoPilotPanelProps> = ({
  isAutoPilotEnabled,
  onToggleAutoPilot,
  targetPrice,
  currentRate22K,
  recipientEmail,
  lastAutoSentDate,
  isPeakActive,
  onTriggerTestAutoPilot,
  isSendingTest,
}) => {
  const [showDetails, setShowDetails] = useState<boolean>(false);

  return (
    <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white rounded-2xl p-5 shadow-lg border border-gray-700 space-y-4">
      {/* Header & Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-gray-700/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#D32F2F] to-pink-600 flex items-center justify-center text-white shadow-md">
            <Bot className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm md:text-base text-gray-100 flex items-center gap-1.5">
                <span>AI অটো-পাইলট স্বয়ংক্রিয় অ্যালার্ট (AI Auto-Pilot)</span>
              </h3>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                isAutoPilotEnabled 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-gray-700 text-gray-400'
              }`}>
                {isAutoPilotEnabled ? '● Active 24/7' : 'Paused'}
              </span>
            </div>
            <p className="text-[11px] text-gray-400 mt-0.5">
              কোনো বাটনে ক্লিক করতে হবে না—পিক সময় এলেই সিস্টেম স্বয়ংক্রিয়ভাবে আপনার Gmail-এ রিপোর্ট পাঠাবে।
            </p>
          </div>
        </div>

        {/* Master ON/OFF Switch */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <label className="text-xs font-semibold text-gray-300 cursor-pointer select-none flex items-center gap-2">
            <span>{isAutoPilotEnabled ? 'স্বয়ংক্রিয় মোড চালু' : 'অটো-পাইলট বন্ধ'}</span>
            <button
              type="button"
              onClick={() => onToggleAutoPilot(!isAutoPilotEnabled)}
              className={`w-12 h-6 flex items-center rounded-full p-1 transition-colors duration-300 focus:outline-hidden ${
                isAutoPilotEnabled ? 'bg-[#D32F2F]' : 'bg-gray-700'
              }`}
            >
              <div
                className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${
                  isAutoPilotEnabled ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </label>
        </div>
      </div>

      {/* Auto-Pilot Radar Status Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div className="bg-gray-950/70 p-3 rounded-xl border border-gray-800">
          <span className="text-[10px] text-gray-400 block uppercase font-medium">মনিটরিং স্ট্যাটাস</span>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`w-2 h-2 rounded-full ${isPeakActive ? 'bg-red-500 animate-ping' : 'bg-emerald-400'}`} />
            <span className="font-bold text-gray-200">
              {isPeakActive ? '🚨 পিক সময় চলছে!' : 'বাজার স্বাভাবিক স্ক্যানিং'}
            </span>
          </div>
          <span className="text-[10px] text-gray-500 block mt-0.5">
            টার্গেট: ৳ {formatBDT(targetPrice)} | বর্তমান: ৳ {formatBDT(currentRate22K)}
          </span>
        </div>

        <div className="bg-gray-950/70 p-3 rounded-xl border border-gray-800">
          <span className="text-[10px] text-gray-400 block uppercase font-medium">স্বয়ংক্রিয় প্রাপক ইমেইল</span>
          <span className="font-mono font-bold text-yellow-300 text-xs block mt-1 truncate">
            {recipientEmail}
          </span>
          <span className="text-[10px] text-gray-500 block mt-0.5">
            Gmail API অথেনটিকেশনের মাধ্যমে প্রেরিত
          </span>
        </div>

        <div className="bg-gray-950/70 p-3 rounded-xl border border-gray-800">
          <span className="text-[10px] text-gray-400 block uppercase font-medium">সর্বশেষ অটো-ডিসপ্যাচ</span>
          <span className="font-mono font-semibold text-gray-200 text-xs block mt-1">
            {lastAutoSentDate ? `✓ ${lastAutoSentDate}` : 'পিক ডিটেকশনের জন্য প্রস্তুত'}
          </span>
          <span className="text-[10px] text-emerald-400 block mt-0.5">
            স্প্যাম প্রতিরোধ: দিনে ১ বার পিক অ্যালার্ট
          </span>
        </div>
      </div>

      {/* Instant Test Dispatch Button */}
      <div className="bg-black/40 rounded-xl p-3 border border-gray-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-yellow-400 shrink-0" />
          <span className="text-gray-300 text-[11px]">
            অটো-পাইলট কাজ করছে কিনা এখনই পরীক্ষা করতে চান? টেস্ট ডিসপ্যাচে চাপ দিলে সাথে সাথে আপনার জিমেইলে ডেমো পিক অ্যালার্ট চলে যাবে।
          </span>
        </div>

        <button
          onClick={onTriggerTestAutoPilot}
          disabled={isSendingTest}
          className="px-3.5 py-1.5 bg-[#D32F2F] hover:bg-red-700 text-white rounded-lg font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-md transition disabled:opacity-50"
        >
          {isSendingTest ? (
            <>
              <RotateCcw className="w-3.5 h-3.5 animate-spin" />
              <span>ইমেইল পাঠানো হচ্ছে...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>টেস্ট অটো-পাইলট ডিসপ্যাচ</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
