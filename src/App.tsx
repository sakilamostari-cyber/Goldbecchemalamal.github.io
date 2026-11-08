/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { SimplePersonalGoldApp } from './components/SimplePersonalGoldApp';

export default function App() {
  return (
    <div className="min-h-screen bg-[#FDFBFD] text-gray-900 font-sans selection:bg-[#FFE6EE] selection:text-[#D32F2F] flex flex-col antialiased">
      {/* Top Banner Ticker with Accurate 2026 BAJUS Rate */}
      <div className="bg-[#FFE6EE] border-b border-[#ffd1de] px-3 py-1.5 text-xs text-gray-800">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <span className="font-bold text-[#D32F2F] flex items-center gap-1 shrink-0">
              <span className="w-2 h-2 rounded-full bg-[#D32F2F] animate-pulse" />
              বাজুস লাইভ:
            </span>
            <span className="text-gray-900 font-semibold truncate">
              ২২ ক্যারেট <strong>৳ ২,২৬,৯২৩</strong> / ভরি
            </span>
            <span className="text-gray-400 hidden xs:inline">|</span>
            <span className="text-gray-600 hidden xs:inline truncate">
              পুরাতন সোনা বিক্রয় (Buyback): <strong className="text-[#D32F2F]">৳ ১,৮৭,২১১</strong>
            </span>
          </div>

          <div className="text-[11px] text-gray-600 shrink-0 font-medium hidden sm:block">
            ১ ভরি = ১১.৬৬৪ গ্রাম = ১৬ আনা
          </div>
        </div>
      </div>

      {/* Main Content View */}
      <main className="flex-1 w-full mx-auto">
        <SimplePersonalGoldApp />
      </main>

      {/* Aesthetic Mobile-Friendly Footer */}
      <footer className="bg-white border-t border-gray-200 py-4 text-xs text-gray-500 mb-16 sm:mb-0">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-center sm:text-left">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-gray-800">Gold বেচে মালামাল</span>
            <span>·</span>
            <span>ব্যক্তিগত ব্যবহারের জন্য প্রস্তুতকৃত</span>
          </div>
          <div className="text-[11px] text-gray-500">
            উৎস: BAJUS (gold-price.bd ও goldr.org) · Connected with Firebase & Gmail
          </div>
        </div>
      </footer>
    </div>
  );
}
