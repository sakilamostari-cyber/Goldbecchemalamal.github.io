import React, { useState } from 'react';
import { 
  BookOpen, 
  CheckCircle, 
  ChevronRight, 
  AlertCircle, 
  Mail, 
  FileSpreadsheet, 
  Share2, 
  Wrench, 
  Sparkles, 
  HelpCircle,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';
import { LOOKER_STUDIO_GUIDE_DATA } from '../data/googleSheetsSpec';

export const LookerStudioAlertsGuide: React.FC = () => {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<Record<number, boolean>>({});
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const toggleStepCompleted = (stepNumber: number) => {
    setCompletedSteps(prev => ({
      ...prev,
      [stepNumber]: !prev[stepNumber]
    }));
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(id);
    setTimeout(() => setCopiedText(null), 2000);
  };

  const stepIcons = [
    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />,
    <Share2 className="w-5 h-5 text-blue-600" />,
    <Mail className="w-5 h-5 text-[#D32F2F]" />,
    <Wrench className="w-5 h-5 text-amber-600" />,
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-[#FFE6EE] text-[#D32F2F] text-xs font-bold mb-2">
              <BookOpen className="w-3.5 h-3.5" />
              <span>Production BI Implementation Manual</span>
            </div>
            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight">
              Step-by-Step Instructions: Google Sheets, Looker Studio & Automated Email Alerts
            </h2>
            <p className="text-xs text-gray-500 mt-1 max-w-2xl leading-relaxed">
              Complete blueprint for connecting your Google Sheets backend to Google Looker Studio, implementing calculated fields, and configuring Scheduled Email Delivery alerts directly to your inbox.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
              {Object.values(completedSteps).filter(Boolean).length} of 4 Steps Completed
            </span>
          </div>
        </div>

        {/* Step Navigation Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mt-6 pt-5 border-t border-gray-100">
          {LOOKER_STUDIO_GUIDE_DATA.map((s, idx) => {
            const isCurrent = activeStep === s.stepNumber;
            const isDone = completedSteps[s.stepNumber];

            return (
              <button
                key={s.stepNumber}
                onClick={() => setActiveStep(s.stepNumber)}
                className={`p-3.5 rounded-xl border text-left transition flex items-start justify-between gap-2 ${
                  isCurrent
                    ? 'border-[#D32F2F] bg-[#FFE6EE]/40 ring-2 ring-[#D32F2F]/20 shadow-xs'
                    : 'border-gray-200 bg-gray-50/60 hover:bg-gray-100 text-gray-700'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5">{stepIcons[idx]}</div>
                  <div>
                    <span className="text-[11px] font-bold text-gray-400 block uppercase tracking-wider">
                      Step {s.stepNumber}
                    </span>
                    <h4 className="font-bold text-xs text-gray-900 line-clamp-1">
                      {s.title.split('&')[0]}
                    </h4>
                  </div>
                </div>

                {isDone && (
                  <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Active Step Content */}
      {(() => {
        const current = LOOKER_STUDIO_GUIDE_DATA.find((s) => s.stepNumber === activeStep)!;
        const isCompleted = completedSteps[current.stepNumber];

        return (
          <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
              <div>
                <span className="text-xs font-black text-[#D32F2F] uppercase tracking-wider">
                  Step {current.stepNumber} of 4
                </span>
                <h3 className="text-lg md:text-xl font-black text-gray-900 mt-0.5">
                  {current.title}
                </h3>
                <p className="text-xs font-semibold text-gray-500 mt-0.5">{current.banglaTitle}</p>
              </div>

              <button
                onClick={() => toggleStepCompleted(current.stepNumber)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition shrink-0 ${
                  isCompleted
                    ? 'bg-emerald-600 text-white'
                    : 'bg-gray-100 hover:bg-gray-200 text-gray-800'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>{isCompleted ? 'Marked as Done' : 'Mark Step Complete'}</span>
              </button>
            </div>

            {/* Step Summary Callout */}
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 text-xs text-gray-700 leading-relaxed">
              <strong>Objective:</strong> {current.summary}
            </div>

            {/* Detailed Numbered Action Items */}
            <div className="space-y-3">
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <span>Detailed Execution Checklist:</span>
              </h4>
              <div className="space-y-2.5">
                {current.actionItems.map((item, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-white border border-gray-200 hover:border-gray-300 transition flex items-start gap-3 text-xs leading-relaxed"
                  >
                    <span className="w-5 h-5 rounded-full bg-[#FFE6EE] text-[#D32F2F] font-black text-[11px] flex items-center justify-center shrink-0 mt-0.5">
                      {i + 1}
                    </span>
                    <span className="text-gray-800">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Looker Studio Pro Tip */}
            <div className="bg-[#FFE6EE]/40 border border-[#ffd2df] p-4 rounded-xl flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-[#D32F2F] shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-xs text-gray-900 block">Looker Studio Pro Tip:</span>
                <p className="text-xs text-gray-700 mt-0.5 leading-relaxed">
                  {current.lookerStudioTip}
                </p>
              </div>
            </div>

            {/* Interactive Mock Scheduled Delivery Email Dialog if Step 3 */}
            {current.stepNumber === 3 && (
              <div className="mt-6 p-5 rounded-2xl bg-gradient-to-b from-gray-50 to-white border border-gray-200 shadow-2xs">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Mail className="w-4 h-4 text-[#D32F2F]" />
                    <h5 className="font-bold text-gray-900 text-xs">
                      Visual Preview: Looker Studio "Scheduled Delivery" Dialog Setup
                    </h5>
                  </div>
                  <span className="text-[10px] bg-red-100 text-[#D32F2F] px-2 py-0.5 rounded-full font-bold">
                    Official Looker UI Pattern
                  </span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-gray-200 text-xs space-y-3 font-sans">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <span className="font-semibold text-gray-500">Recipients (ইমেইল ঠিকানা):</span>
                    <div className="sm:col-span-2">
                      <span className="bg-gray-100 text-gray-900 px-2 py-1 rounded font-mono text-[11px] font-semibold border">
                        sanzida32@gmail.com
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <span className="font-semibold text-gray-500">Repeat / Frequency (সময়সূচি):</span>
                    <div className="sm:col-span-2">
                      <span className="font-medium text-gray-800">Daily at 11:00 AM (BST)</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <span className="font-semibold text-gray-500">Subject (ইমেইল বিষয়):</span>
                    <div className="sm:col-span-2">
                      <span className="text-gray-900 font-semibold">
                        [Daily Summary] Gold বেচে মালামাল - আজকের সোনার বাজার ও বিক্রয় রেট
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <span className="font-semibold text-gray-500">Attachment Format:</span>
                    <div className="sm:col-span-2">
                      <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ PDF Report of Canvas Attached
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-100">
              <button
                disabled={activeStep === 1}
                onClick={() => setActiveStep(prev => prev - 1)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-30 disabled:pointer-events-none transition"
              >
                Previous Step
              </button>

              <button
                disabled={activeStep === 4}
                onClick={() => setActiveStep(prev => prev + 1)}
                className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-[#D32F2F] hover:bg-[#b71c1c] disabled:opacity-30 disabled:pointer-events-none transition flex items-center gap-1.5"
              >
                <span>Next Step</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })()}

      {/* Quick FAQ & Assistance */}
      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-xs">
        <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-[#D32F2F]" />
          <span>Need direct help or have special BAJUS formula requirements?</span>
        </h4>
        <p className="text-xs text-gray-600 leading-relaxed">
          The formulas and data structures in this dashboard are designed to mirror 100% of Looker Studio's computational engine. You can copy any formula from the <strong>"Looker Formulas"</strong> tab or export ready-to-use CSV/TSV from the <strong>"Google Sheets Backend"</strong> tab at any time!
        </p>
      </div>
    </div>
  );
};
