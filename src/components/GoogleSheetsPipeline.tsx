import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Download, 
  Copy, 
  Check, 
  Database, 
  ExternalLink, 
  Code, 
  RefreshCw, 
  Search, 
  Filter,
  CheckCircle2,
  Sparkles
} from 'lucide-react';
import { SHEETS_COLUMNS_SPEC, GOOGLE_APPS_SCRIPT_CODE } from '../data/googleSheetsSpec';
import { INITIAL_GOLD_DATA, formatBDT } from '../data/goldData';
import { GoldPriceRecord } from '../types/gold';

export const GoogleSheetsPipeline: React.FC = () => {
  const [copiedScript, setCopiedScript] = useState<boolean>(false);
  const [copiedTSV, setCopiedTSV] = useState<boolean>(false);
  const [filterKarat, setFilterKarat] = useState<string>('All');
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleCopyScript = () => {
    navigator.clipboard.writeText(GOOGLE_APPS_SCRIPT_CODE);
    setCopiedScript(true);
    setTimeout(() => setCopiedScript(false), 2000);
  };

  // Copy rows as TSV for direct paste into Google Sheets
  const handleCopyTSV = () => {
    const headers = ['Date', 'Timestamp', 'Gold_Type', 'Market_Price_Per_Vori_BDT', 'Old_Gold_BuyBack_Price_BDT', 'USD_BDT_Rate', 'International_Gold_USD_Oz', 'Market_Price_Per_Gram_BDT'].join('\t');
    const rows = INITIAL_GOLD_DATA.slice(-40).map((r) => [
      r.date,
      r.timestamp,
      r.goldType,
      r.marketPricePerVoriBDT,
      r.oldGoldBuyBackPriceBDT,
      r.usdBdtRate,
      r.internationalOunceUSD,
      r.perGramBDT
    ].join('\t'));
    const tsvData = [headers, ...rows].join('\n');
    navigator.clipboard.writeText(tsvData);
    setCopiedTSV(true);
    setTimeout(() => setCopiedTSV(false), 2000);
  };

  // Download as CSV
  const handleDownloadCSV = () => {
    const headers = ['Date', 'Timestamp', 'Gold_Type', 'Market_Price_Per_Vori_BDT', 'Old_Gold_BuyBack_Price_BDT', 'USD_BDT_Rate', 'International_Gold_USD_Oz', 'Market_Price_Per_Gram_BDT'].join(',');
    const rows = INITIAL_GOLD_DATA.map((r) => [
      r.date,
      `"${r.timestamp}"`,
      r.goldType,
      r.marketPricePerVoriBDT,
      r.oldGoldBuyBackPriceBDT,
      r.usdBdtRate,
      r.internationalOunceUSD,
      r.perGramBDT
    ].join(','));
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers, ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BAJUS_Gold_Daily_Tracking_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter preview records
  const filteredData = INITIAL_GOLD_DATA.slice(-32).filter((r) => {
    const matchesKarat = filterKarat === 'All' || r.goldType === filterKarat;
    const matchesSearch = r.date.includes(searchTerm) || r.goldType.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesKarat && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FFE6EE] text-[#D32F2F] text-xs font-bold mb-2">
              <Database className="w-3.5 h-3.5" />
              <span>Google Sheets Backend & Ingestion Engine</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
              Connected Google Sheets Data Source Specifications
            </h2>
            <p className="text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed">
              Standardized data schema matching Google Looker Studio connector requirements. Feed real-time BAJUS rates, automatic 82.5% old gold buyback prices, and USD/BDT forex rates directly into your Looker reports.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleCopyTSV}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition ${
                copiedTSV ? 'bg-emerald-600 text-white' : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-2xs'
              }`}
              title="Copy rows formatted for instant Ctrl+V into Google Sheets"
            >
              {copiedTSV ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5 text-gray-500" />}
              <span>{copiedTSV ? 'Copied TSV!' : 'Copy for Sheets (Paste A1)'}</span>
            </button>
            <button
              onClick={handleDownloadCSV}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold bg-[#D32F2F] hover:bg-[#b71c1c] text-white shadow-2xs transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>
      </div>

      {/* Schema Specification Table */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <h3 className="font-bold text-gray-900 text-base mb-1 flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
          <span>Google Sheets Column Schema & Field Mapping (কলাম বিবরণী)</span>
        </h3>
        <p className="text-xs text-gray-500 mb-4">
          Each column is pre-configured with precise Looker Studio data type mappings to avoid sync errors.
        </p>

        <div className="overflow-x-auto rounded-xl border border-gray-200">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-700 font-bold border-b border-gray-200">
              <tr>
                <th className="py-2.5 px-3">Column Name</th>
                <th className="py-2.5 px-3">Sheets Type</th>
                <th className="py-2.5 px-3">Looker Studio Type</th>
                <th className="py-2.5 px-3">Formula / Ingestion Source</th>
                <th className="py-2.5 px-3">Sample Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {SHEETS_COLUMNS_SPEC.map((col) => (
                <tr key={col.name} className="hover:bg-gray-50/70">
                  <td className="py-2.5 px-3 font-mono font-bold text-gray-900">
                    {col.name}
                  </td>
                  <td className="py-2.5 px-3 text-gray-600">
                    <span className="bg-gray-100 px-2 py-0.5 rounded text-[11px] font-mono">
                      {col.type}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-blue-700">
                    {col.lookerType}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-gray-600">
                    {col.formulaOrSource}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-gray-800">
                    {col.sampleValue}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Live Data Preview Table */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="font-bold text-gray-900 text-base">
              Live Google Sheets Data Stream Preview (সাম্প্রতিক ডাটা প্রিভিউ)
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Showing active rows synced with Looker Studio.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 p-1 rounded-lg border border-gray-200 text-xs">
              {['All', '22K', '21K', '18K', 'Traditional'].map((k) => (
                <button
                  key={k}
                  onClick={() => setFilterKarat(k)}
                  className={`px-2.5 py-0.5 rounded-md font-medium transition ${
                    filterKarat === k ? 'bg-white text-gray-900 shadow-2xs font-bold' : 'text-gray-600'
                  }`}
                >
                  {k}
                </button>
              ))}
            </div>

            <input
              type="text"
              placeholder="Search date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="text-xs px-2.5 py-1 bg-gray-50 border border-gray-200 rounded-lg w-32 focus:outline-hidden focus:border-[#D32F2F]"
            />
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-gray-200 max-h-72">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 text-gray-700 font-bold sticky top-0 border-b border-gray-200">
              <tr>
                <th className="py-2 px-3">Date</th>
                <th className="py-2 px-3">Gold Type</th>
                <th className="py-2 px-3">Market / Vori (BDT)</th>
                <th className="py-2 px-3 text-[#D32F2F]">Old Gold Buyback (BDT)</th>
                <th className="py-2 px-3">USD / BDT</th>
                <th className="py-2 px-3">Per Gram (BDT)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 font-mono">
              {filteredData.slice(-16).reverse().map((row) => (
                <tr key={row.id} className="hover:bg-gray-50/70">
                  <td className="py-2 px-3 text-gray-600">{row.date}</td>
                  <td className="py-2 px-3 font-bold text-gray-900">{row.goldType}</td>
                  <td className="py-2 px-3 font-semibold text-gray-900">৳ {formatBDT(row.marketPricePerVoriBDT)}</td>
                  <td className="py-2 px-3 font-bold text-[#D32F2F]">৳ {formatBDT(row.oldGoldBuyBackPriceBDT)}</td>
                  <td className="py-2 px-3 text-gray-600">{row.usdBdtRate.toFixed(2)}</td>
                  <td className="py-2 px-3 text-gray-600">৳ {formatBDT(row.perGramBDT)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Production Google Apps Script (GAS) Automation Box */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
              <Code className="w-5 h-5 text-[#D32F2F]" />
              <span>Production Google Apps Script (অটোমেটেড ডাটা স্ক্রিপ্ট)</span>
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Copy and paste this script into Google Sheets (Extensions → Apps Script) to run daily automated rates logging and peak threshold alert emails!
            </p>
          </div>

          <button
            onClick={handleCopyScript}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition shrink-0 ${
              copiedScript ? 'bg-emerald-600 text-white' : 'bg-[#D32F2F] hover:bg-[#b71c1c] text-white shadow-2xs'
            }`}
          >
            {copiedScript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedScript ? 'Copied Script!' : 'Copy Apps Script'}</span>
          </button>
        </div>

        <pre className="bg-gray-900 text-green-400 p-4 rounded-xl font-mono text-xs overflow-x-auto max-h-80 border border-gray-800 leading-relaxed">
          <code>{GOOGLE_APPS_SCRIPT_CODE}</code>
        </pre>
      </div>
    </div>
  );
};
