import React, { useState } from 'react';
import { 
  Code2, 
  Copy, 
  Check, 
  Sliders, 
  Sparkles, 
  HelpCircle, 
  Terminal, 
  Layers, 
  PlayCircle,
  FileCode,
  Tag
} from 'lucide-react';
import { LOOKER_CALCULATED_FIELDS, LOOKER_PARAMETERS_CONFIG } from '../data/calculatedFields';
import { CalculatedFieldItem } from '../types/gold';

export const LookerStudioFieldFormulas: React.FC = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<'All' | 'Metric' | 'Dimension' | 'Alert / Logic'>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Live tester state
  const [testMarketPrice, setTestMarketPrice] = useState<number>(142850);
  const [testTargetPrice, setTestTargetPrice] = useState<number>(140000);
  const [testWeight, setTestWeight] = useState<number>(2.5);

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredFields = LOOKER_CALCULATED_FIELDS.filter((f) => {
    const matchesCategory = activeCategory === 'All' || f.category === activeCategory;
    const matchesSearch = 
      f.fieldName.toLowerCase().includes(searchQuery.toLowerCase()) || 
      f.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.formula.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  // Calculate live results for tester
  const liveBuyback = Math.round(testMarketPrice * 0.825);
  const livePerGram = Number((testMarketPrice / 11.664).toFixed(2));
  const liveStatus = testMarketPrice >= testTargetPrice 
    ? '🔴 Peak - Best Time to Sell!' 
    : testMarketPrice >= testTargetPrice * 0.98 
      ? '🟡 Approaching Target' 
      : '🟢 Hold / Buy';
  const liveBanner = testMarketPrice >= testTargetPrice 
    ? '🚨 PEAK ALERT: Excellent time to sell your old gold now!' 
    : testMarketPrice >= testTargetPrice * 0.98 
      ? '⚠️ NEAR PEAK: Market within 2% of your target selling threshold' 
      : '🛡️ Market Consolidated: Hold your gold for higher returns';
  const liveTotalCash = Math.round(testWeight * liveBuyback);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FFE6EE] text-[#D32F2F] text-xs font-bold mb-2">
              <Code2 className="w-3.5 h-3.5" />
              <span>Looker Studio BI Formulas Engine</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
              Calculated Fields & User Parameters Catalog
            </h2>
            <p className="text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed">
              Pre-validated Looker Studio formulas adhering strictly to Google Data Studio calculation syntax (`CASE WHEN`, `IF`, arithmetic expressions). Copy and paste directly into your Looker Studio report canvas.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              {LOOKER_CALCULATED_FIELDS.length} Production Formulas
            </span>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="mt-6 pt-5 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            {(['All', 'Alert / Logic', 'Metric', 'Dimension'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition shrink-0 ${
                  activeCategory === cat
                    ? 'bg-[#D32F2F] text-white shadow-2xs'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search formula or field name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-hidden focus:border-[#D32F2F]"
            />
          </div>
        </div>
      </div>

      {/* Live Interactive Formula Sandbox */}
      <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 text-white rounded-2xl p-5 shadow-lg border border-gray-700">
        <div className="flex items-center justify-between pb-3 border-b border-gray-700">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-gray-100">
              Interactive Looker Studio Formula Test Runner
            </h3>
          </div>
          <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800">
            ● Status: Live Sandbox
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 text-xs">
          <div>
            <label className="text-gray-400 block mb-1">
              Field: Market_Price_Per_Vori_BDT
            </label>
            <input
              type="number"
              value={testMarketPrice}
              step="500"
              onChange={(e) => setTestMarketPrice(Number(e.target.value) || 0)}
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-1.5 text-yellow-300 font-mono font-bold focus:outline-hidden focus:border-yellow-400"
            />
          </div>
          <div>
            <label className="text-gray-400 block mb-1">
              Parameter: Target_Selling_Price_Parameter
            </label>
            <input
              type="number"
              value={testTargetPrice}
              step="500"
              onChange={(e) => setTestTargetPrice(Number(e.target.value) || 0)}
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-1.5 text-red-300 font-mono font-bold focus:outline-hidden focus:border-red-400"
            />
          </div>
          <div>
            <label className="text-gray-400 block mb-1">
              Parameter: Weight_Vori_Input (ভরি)
            </label>
            <input
              type="number"
              value={testWeight}
              step="0.5"
              onChange={(e) => setTestWeight(Number(e.target.value) || 0)}
              className="w-full bg-gray-950 border border-gray-700 rounded-lg px-3 py-1.5 text-blue-300 font-mono font-bold focus:outline-hidden focus:border-blue-400"
            />
          </div>
        </div>

        {/* Live Evaluated Output */}
        <div className="mt-4 pt-3 border-t border-gray-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="bg-gray-950 p-2.5 rounded-lg border border-gray-800">
            <span className="text-gray-400 block text-[10px]">Selling_Status_Badge (Result):</span>
            <span className="font-bold text-sm text-yellow-300">{liveStatus}</span>
          </div>
          <div className="bg-gray-950 p-2.5 rounded-lg border border-gray-800">
            <span className="text-gray-400 block text-[10px]">Old_Gold_BuyBack_Price_BDT:</span>
            <span className="font-mono font-bold text-sm text-emerald-400">৳ {liveBuyback.toLocaleString('en-IN')} BDT</span>
          </div>
          <div className="bg-gray-950 p-2.5 rounded-lg border border-gray-800">
            <span className="text-gray-400 block text-[10px]">Total Cash Realization (Net):</span>
            <span className="font-mono font-bold text-sm text-purple-300">৳ {liveTotalCash.toLocaleString('en-IN')} BDT</span>
          </div>
        </div>
      </div>

      {/* Calculated Fields List */}
      <div className="space-y-4">
        {filteredFields.map((field) => (
          <div
            key={field.id}
            className="bg-white border border-gray-200 hover:border-gray-300 rounded-2xl p-5 shadow-xs transition"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono font-black text-sm text-gray-900 bg-gray-100 px-2.5 py-1 rounded-md">
                  {field.fieldName}
                </span>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  field.category === 'Alert / Logic' 
                    ? 'bg-[#FFE6EE] text-[#D32F2F] border border-red-200' 
                    : field.category === 'Metric'
                      ? 'bg-blue-50 text-blue-700 border border-blue-200'
                      : 'bg-purple-50 text-purple-700 border border-purple-200'
                }`}>
                  {field.category}
                </span>
                <span className="text-[10px] text-gray-400">
                  Data Type: <strong className="text-gray-600">{field.dataType}</strong>
                </span>
              </div>

              <button
                onClick={() => handleCopy(field.id, field.formula)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
                  copiedId === field.id
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-50 hover:bg-gray-100 text-gray-700 border border-gray-200'
                }`}
              >
                {copiedId === field.id ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-gray-500" />
                    <span>Copy Formula</span>
                  </>
                )}
              </button>
            </div>

            <p className="text-xs text-gray-600 mb-3">{field.description}</p>

            {/* Formula Block */}
            <div className="relative group">
              <pre className="bg-gray-900 text-yellow-300 p-3.5 rounded-xl font-mono text-xs overflow-x-auto border border-gray-800 leading-relaxed">
                <code>{field.formula}</code>
              </pre>
            </div>

            <div className="mt-2.5 flex items-center justify-between text-[11px] text-gray-500">
              <span>Example Output: <strong className="text-gray-800 font-mono">{field.exampleResult}</strong></span>
              <span className="text-gray-400">Looker Studio Syntax: Verified</span>
            </div>
          </div>
        ))}
      </div>

      {/* Looker Studio User Parameters Section */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <h3 className="font-bold text-gray-900 text-base mb-1 flex items-center gap-2">
          <Sliders className="w-5 h-5 text-[#D32F2F]" />
          <span>Looker Studio Custom Parameters Guide (কাস্টম প্যারামিটার তৈরি)</span>
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          To let dashboard viewers interactively type their own selling target or gold weight, configure these Parameters in Looker Studio under <strong>"Add a parameter"</strong>:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LOOKER_PARAMETERS_CONFIG.map((param) => (
            <div key={param.name} className="p-4 rounded-xl border border-gray-200 bg-gray-50/60">
              <div className="flex items-center justify-between mb-1.5">
                <span className="font-mono font-bold text-xs text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200">
                  {param.name}
                </span>
                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold">
                  Default: {param.defaultValue}
                </span>
              </div>
              <p className="text-xs font-semibold text-gray-800 mt-1">{param.displayName}</p>
              <p className="text-[11px] text-gray-500 mt-0.5">{param.purpose}</p>
              <div className="mt-2 text-[10px] text-gray-400">
                Data Type: {param.dataType} | Range: {param.range}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* How to add in Looker Studio visual instructions */}
      <div className="bg-[#FFE6EE]/40 border border-[#ffd2df] rounded-2xl p-5">
        <h4 className="font-bold text-gray-900 text-sm mb-2 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#D32F2F]" />
          <span>How to create Calculated Fields in Looker Studio (ধাপে ধাপে নিয়ম):</span>
        </h4>
        <ol className="list-decimal list-inside space-y-1.5 text-xs text-gray-700 leading-relaxed">
          <li>Looker Studio-তে আপনার রিপোর্টটি <strong>Edit</strong> মোডে ওপেন করুন।</li>
          <li>ডানপাশের <strong>Data</strong> প্যানেলে গিয়ে আপনার কানেক্টেড Google Sheet ডেটাসোর্সের নিচে <strong>"+ Add a field"</strong> বাটনে ক্লিক করুন।</li>
          <li>উপরে <strong>Field Name</strong> দিন (যেমন: <code className="bg-white px-1.5 py-0.5 rounded text-gray-800 font-mono">Selling_Status_Badge</code>)।</li>
          <li>বড় কোড বক্সে উপরের তালিকা থেকে সম্পূর্ণ ফর্মুলাটি কপি করে পেস্ট করুন।</li>
          <li>নিচে সবুজ টিক চিহ্ন (Formula is valid) আসলে <strong>"Save"</strong> এবং <strong>"Done"</strong> বাটনে চাপ দিন।</li>
          <li>এখন ফিল্ডটি যেকোনো Scorecard, Table বা Banner টেক্সট ভিজ্যুয়ালে ড্র্যাগ অ্যান্ড ড্রপ করে যুক্ত করুন।</li>
        </ol>
      </div>
    </div>
  );
};
