import React, { useState, useEffect, useMemo } from 'react';
import { 
  DollarSign, 
  Sparkles, 
  Mail, 
  Trash2, 
  Plus, 
  Scale, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  LogOut, 
  User as UserIcon,
  Send,
  Loader2,
  Clock,
  ArrowRight,
  ChevronDown,
  Coins,
  LineChart,
  Bot,
  Sliders,
  Wallet
} from 'lucide-react';
import { User } from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot, 
  query, 
  serverTimestamp 
} from 'firebase/firestore';
import { 
  auth, 
  db, 
  googleSignIn, 
  logout, 
  initAuth, 
  getCachedAccessToken, 
  testFirestoreConnection,
  handleFirestoreError,
  OperationType 
} from '../lib/firebase';
import { sendGmailMessage, generateGoldReportHtml } from '../lib/gmail';
import { GoldKarat } from '../types/gold';
import { 
  KARAT_INFO, 
  VORI_TO_GRAM, 
  ANA_PER_VORI, 
  ROTTI_PER_VORI, 
  formatBDT,
  playAlertChime 
} from '../data/goldData';
import { LiveRatesShowcase } from './LiveRatesShowcase';
import { PersonalTrendChart } from './PersonalTrendChart';
import { BestTimeToSellEngine } from './BestTimeToSellEngine';
import { AIAutoPilotPanel } from './AIAutoPilotPanel';

export interface UserGoldItem {
  id: string;
  userId?: string;
  name: string;
  karat: GoldKarat;
  weightVori: number;
  weightGrams: number;
  originalPricePerVori?: number;
  hasHallmarkVoucher?: boolean;
}

export const SimplePersonalGoldApp: React.FC = () => {
  // Mobile-first active view tab
  const [activeView, setActiveView] = useState<'live' | 'portfolio' | 'trends' | 'autopilot'>('live');

  // Current user & auth state
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isSigningIn, setIsSigningIn] = useState<boolean>(false);

  // Active karat for chart and focus
  const [activeKarat, setActiveKarat] = useState<GoldKarat>('22K');

  // Accurate official local BAJUS baseline rates (in BDT / Vori - 11.664g)
  // Sources: goldr.org, gold-price.bd, BAJUS official circular
  const [rates, setRates] = useState<Record<GoldKarat, number>>({
    '22K': 226923,
    '21K': 216717,
    '18K': 186099,
    'Traditional': 161605,
  });

  // User personal target selling threshold (default near 2026 peak ৳ 2,25,000)
  const [targetSellPrice, setTargetSellPrice] = useState<number>(225000);
  const [buybackPercent, setBuybackPercent] = useState<number>(82.5); // 17.5% standard shop cut

  // AI Auto-Pilot state
  const [isAutoPilotEnabled, setIsAutoPilotEnabled] = useState<boolean>(true);
  const [lastAutoSentDate, setLastAutoSentDate] = useState<string>(() => {
    return typeof window !== 'undefined' ? (localStorage.getItem('gold_last_autopilot_date') || '') : '';
  });
  const [autoPilotNotice, setAutoPilotNotice] = useState<string | null>(null);
  const [isSendingTestAutoPilot, setIsSendingTestAutoPilot] = useState<boolean>(false);

  // Saved items list - starts clean and empty with NO unwanted default items
  const [items, setItems] = useState<UserGoldItem[]>([]);

  // Form state for adding an item
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newItemName, setNewItemName] = useState<string>('');
  const [newItemKarat, setNewItemKarat] = useState<GoldKarat>('22K');
  const [weightUnit, setWeightUnit] = useState<'traditional' | 'grams'>('traditional');
  const [inputVori, setInputVori] = useState<string>('1');
  const [inputAna, setInputAna] = useState<string>('0');
  const [inputRotti, setInputRotti] = useState<string>('0');
  const [inputGrams, setInputGrams] = useState<string>('11.66');
  const [inputPurchasePrice, setInputPurchasePrice] = useState<string>('');
  const [hasVoucher, setHasVoucher] = useState<boolean>(true);

  // Local goldsmith deduction slider state in portfolio
  const [showShopCustomizer, setShowShopCustomizer] = useState<boolean>(false);

  // Gmail modal & sending state
  const [showEmailModal, setShowEmailModal] = useState<boolean>(false);
  const [emailRecipient, setEmailRecipient] = useState<string>('sanzida32@gmail.com');
  const [emailSubject, setEmailSubject] = useState<string>('🚨 [Gold বেচে মালামাল] আমার সোনার ভ্যালুয়েশন ও বিক্রয় অ্যালার্ট');
  const [isSendingEmail, setIsSendingEmail] = useState<boolean>(false);
  const [emailSentSuccess, setEmailSentSuccess] = useState<boolean>(false);
  const [emailErrorMessage, setEmailErrorMessage] = useState<string | null>(null);

  // Initialize auth & test Firestore on mount
  useEffect(() => {
    testFirestoreConnection();
    
    const unsubscribe = initAuth(
      (currentUser, token) => {
        setUser(currentUser);
        if (token) setAccessToken(token);
        if (currentUser.email) setEmailRecipient(currentUser.email);
        setIsAuthLoading(false);
      },
      () => {
        setUser(null);
        setAccessToken(null);
        setIsAuthLoading(false);
      }
    );

    return () => unsubscribe();
  }, []);

  // Listen to Firestore for user's items when logged in
  useEffect(() => {
    if (!user) return;

    const itemsPath = `users/${user.uid}/gold_items`;
    const q = query(collection(db, itemsPath));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const loaded: UserGoldItem[] = [];
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          loaded.push({
            id: docSnap.id,
            userId: data.userId,
            name: data.name,
            karat: data.karat,
            weightVori: data.weightVori,
            weightGrams: data.weightGrams,
            originalPricePerVori: data.originalPricePerVori,
            hasHallmarkVoucher: data.hasHallmarkVoucher,
          });
        });
        if (loaded.length > 0) {
          setItems(loaded);
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, itemsPath);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Handle Google Sign In
  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      const res = await googleSignIn();
      if (res) {
        setUser(res.user);
        setAccessToken(res.accessToken);
        if (res.user.email) setEmailRecipient(res.user.email);
      }
    } catch (err: any) {
      console.error('Login error:', err);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleSignOut = async () => {
    await logout();
    setUser(null);
    setAccessToken(null);
  };

  // Peak check
  const is22KPeak = rates['22K'] >= targetSellPrice;

  // Add Item handler
  const handleAddItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;

    let vori = 0;
    let grams = 0;

    if (weightUnit === 'traditional') {
      const v = parseFloat(inputVori) || 0;
      const a = parseFloat(inputAna) || 0;
      const r = parseFloat(inputRotti) || 0;
      vori = v + (a / ANA_PER_VORI) + (r / ROTTI_PER_VORI);
      grams = vori * VORI_TO_GRAM;
    } else {
      grams = parseFloat(inputGrams) || 0;
      vori = grams / VORI_TO_GRAM;
    }

    if (vori <= 0) return;

    const newItem: UserGoldItem = {
      id: `item-${Date.now()}`,
      userId: user?.uid,
      name: newItemName.trim(),
      karat: newItemKarat,
      weightVori: Number(vori.toFixed(3)),
      weightGrams: Number(grams.toFixed(2)),
      originalPricePerVori: inputPurchasePrice ? parseFloat(inputPurchasePrice) : undefined,
      hasHallmarkVoucher: hasVoucher,
    };

    // Save locally
    setItems((prev) => [newItem, ...prev]);

    // Save to Firestore if user logged in
    if (user) {
      const docPath = `users/${user.uid}/gold_items/${newItem.id}`;
      try {
        await setDoc(doc(db, docPath), {
          ...newItem,
          userId: user.uid,
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, docPath);
      }
    }

    // Reset Form
    setNewItemName('');
    setInputVori('1');
    setInputAna('0');
    setInputRotti('0');
    setInputPurchasePrice('');
    setShowAddForm(false);
  };

  // Delete item handler
  const handleDeleteItem = async (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    if (user) {
      const docPath = `users/${user.uid}/gold_items/${id}`;
      try {
        await deleteDoc(doc(db, docPath));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, docPath);
      }
    }
  };

  // Aggregate Portfolio Calculations
  const portfolioSummary = useMemo(() => {
    let totalCash = 0;
    let totalGross = 0;
    let totalVori = 0;
    let totalGrams = 0;
    let totalOriginalCost = 0;
    let itemsWithCostCount = 0;

    const enrichedItems = items.map((it) => {
      const marketRate = rates[it.karat];
      const buybackRate = Math.round(marketRate * (buybackPercent / 100));
      const cash = Math.round(it.weightVori * buybackRate);
      const gross = Math.round(it.weightVori * marketRate);

      totalCash += cash;
      totalGross += gross;
      totalVori += it.weightVori;
      totalGrams += it.weightGrams;

      if (it.originalPricePerVori && it.originalPricePerVori > 0) {
        totalOriginalCost += it.weightVori * it.originalPricePerVori;
        itemsWithCostCount++;
      }

      return {
        ...it,
        marketRate,
        buybackRate,
        estimatedCash: cash,
        grossValue: gross,
      };
    });

    const netProfit = totalOriginalCost > 0 ? totalCash - totalOriginalCost : 0;
    const profitPercentage = totalOriginalCost > 0 ? Number(((netProfit / totalOriginalCost) * 100).toFixed(1)) : 0;

    return {
      items: enrichedItems,
      totalCash,
      totalGross,
      totalDeduction: totalGross - totalCash,
      totalVori: Number(totalVori.toFixed(3)),
      totalGrams: Number(totalGrams.toFixed(2)),
      totalOriginalCost: Math.round(totalOriginalCost),
      netProfit: Math.round(netProfit),
      profitPercentage,
      hasHistoricalCost: itemsWithCostCount > 0,
    };
  }, [items, rates, buybackPercent]);

  // Automated 24/7 AI Auto-Pilot Effect:
  // Automatically detects peak sell condition and dispatches Gmail report without manual button clicks!
  useEffect(() => {
    if (!isAutoPilotEnabled || !is22KPeak) return;

    const todayStr = new Date().toISOString().split('T')[0];
    const lastSent = typeof window !== 'undefined' ? localStorage.getItem('gold_last_autopilot_date') : '';
    if (lastSent === todayStr) return; // Prevent repeated spam; 1 peak notification per day

    const currentToken = accessToken || getCachedAccessToken();
    if (!currentToken) return; // Requires user authorization

    const executeAutoPilot = async () => {
      try {
        const htmlContent = generateGoldReportHtml({
          isPeak: true,
          rate22K: rates['22K'],
          rate21K: rates['21K'],
          rate18K: rates['18K'],
          rateSonaton: rates['Traditional'],
          targetPrice: targetSellPrice,
          items: portfolioSummary.items.map((it) => ({
            name: it.name,
            karat: it.karat,
            weightVori: it.weightVori,
            weightGrams: it.weightGrams,
            estimatedCash: it.estimatedCash,
          })),
          totalCash: portfolioSummary.totalCash,
          totalVori: portfolioSummary.totalVori,
          userEmail: emailRecipient,
          isAutoPilot: true,
        });

        await sendGmailMessage({
          accessToken: currentToken,
          to: emailRecipient,
          subject: '🤖 [AI Auto-Pilot] 🚨 PEAK ALERT: সোনার সর্বোচ্চ বাজার দরে স্বয়ংক্রিয় বিক্রয় অ্যালার্ট!',
          htmlBody: htmlContent,
        });

        localStorage.setItem('gold_last_autopilot_date', todayStr);
        setLastAutoSentDate(todayStr);
        setAutoPilotNotice(`🤖 AI অটো-পাইলট: পিক রেট পাওয়ার সাথে সাথে স্বয়ংক্রিয়ভাবে ${emailRecipient} ঠিকানায় অ্যালার্ট ইমেইল পাঠানো হয়েছে!`);
        
        // Play audio chime
        playAlertChime();

        // Browser push notification if permitted
        if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted') {
          new Notification('🚨 [Gold বেচে মালামাল] পিক সময় শুরু!', {
            body: `২২ ক্যারেট সোনার বাজার দর ৳ ${formatBDT(rates['22K'])} ছুঁয়েছে! স্বয়ংক্রিয়ভাবে Gmail-এ রিপোর্ট পাঠানো হয়েছে।`,
          });
        }
      } catch (err) {
        console.warn('Auto-pilot background dispatch error:', err);
      }
    };

    executeAutoPilot();
  }, [isAutoPilotEnabled, is22KPeak, accessToken, rates, targetSellPrice, emailRecipient, portfolioSummary]);

  // Send Email via Gmail Handler (with Workspace Confirmation)
  const handleSendEmail = async () => {
    if (!accessToken && !user) {
      await handleSignIn();
      return;
    }

    const currentToken = accessToken || getCachedAccessToken();
    if (!currentToken) {
      setEmailErrorMessage('Please sign in with Google to allow sending emails through your Gmail.');
      return;
    }

    setIsSendingEmail(true);
    setEmailErrorMessage(null);

    try {
      const htmlContent = generateGoldReportHtml({
        isPeak: is22KPeak,
        rate22K: rates['22K'],
        rate21K: rates['21K'],
        rate18K: rates['18K'],
        rateSonaton: rates['Traditional'],
        targetPrice: targetSellPrice,
        items: portfolioSummary.items.map((it) => ({
          name: it.name,
          karat: it.karat,
          weightVori: it.weightVori,
          weightGrams: it.weightGrams,
          estimatedCash: it.estimatedCash,
        })),
        totalCash: portfolioSummary.totalCash,
        totalVori: portfolioSummary.totalVori,
        userEmail: emailRecipient,
      });

      await sendGmailMessage({
        accessToken: currentToken,
        to: emailRecipient,
        subject: emailSubject,
        htmlBody: htmlContent,
      });

      // Log sent alert in Firestore if authenticated
      if (user) {
        const logId = `log-${Date.now()}`;
        const logPath = `users/${user.uid}/email_logs/${logId}`;
        try {
          await setDoc(doc(db, logPath), {
            userId: user.uid,
            recipient: emailRecipient,
            subject: emailSubject,
            marketRate22K: rates['22K'],
            totalEstimatedCash: portfolioSummary.totalCash,
            sentAt: new Date().toISOString(),
          });
        } catch (err) {
          console.warn('Logging to Firestore failed:', err);
        }
      }

      setEmailSentSuccess(true);
      setTimeout(() => {
        setEmailSentSuccess(false);
        setShowEmailModal(false);
      }, 2500);
    } catch (err: any) {
      console.error('Gmail send error:', err);
      setEmailErrorMessage(err.message || 'Failed to send email. Please check your permissions.');
    } finally {
      setIsSendingEmail(false);
    }
  };

  // Test Auto-Pilot Dispatch
  const handleTriggerTestAutoPilot = async () => {
    setIsSendingTestAutoPilot(true);
    try {
      const currentToken = accessToken || getCachedAccessToken();
      if (!currentToken) {
        await handleSignIn();
        return;
      }

      const htmlContent = generateGoldReportHtml({
        isPeak: true,
        rate22K: rates['22K'],
        rate21K: rates['21K'],
        rate18K: rates['18K'],
        rateSonaton: rates['Traditional'],
        targetPrice: targetSellPrice,
        items: portfolioSummary.items.map((it) => ({
          name: it.name,
          karat: it.karat,
          weightVori: it.weightVori,
          weightGrams: it.weightGrams,
          estimatedCash: it.estimatedCash,
        })),
        totalCash: portfolioSummary.totalCash,
        totalVori: portfolioSummary.totalVori,
        userEmail: emailRecipient,
        isAutoPilot: true,
      });

      await sendGmailMessage({
        accessToken: currentToken,
        to: emailRecipient,
        subject: '🤖 [AI Auto-Pilot] 🚨 PEAK ALERT: টেস্ট অটো-পাইলট ডিসপ্যাচ!',
        htmlBody: htmlContent,
      });

      const todayStr = new Date().toISOString().split('T')[0];
      localStorage.setItem('gold_last_autopilot_date', todayStr);
      setLastAutoSentDate(todayStr);
      setAutoPilotNotice(`✓ AI অটো-পাইলট: ${emailRecipient} ঠিকানায় টেস্ট অ্যালার্ট সফলভাবে পাঠানো হয়েছে!`);
      setTimeout(() => setAutoPilotNotice(null), 5000);
    } catch (e: any) {
      console.error('Test autopilot error:', e);
      alert(e.message || 'Auto-pilot dispatch failed');
    } finally {
      setIsSendingTestAutoPilot(false);
    }
  };

  // Quick Preset Helper for empty state
  const handleQuickPreset = (name: string, karat: GoldKarat, vori: string) => {
    setNewItemName(name);
    setNewItemKarat(karat);
    setWeightUnit('traditional');
    setInputVori(vori);
    setInputAna('0');
    setInputRotti('0');
    setShowAddForm(true);
  };

  // Handler for selecting karat from LiveRatesShowcase
  const handleSelectKaratToSell = (karat: GoldKarat) => {
    setActiveKarat(karat);
    setNewItemKarat(karat);
    setActiveView('portfolio');
    setShowAddForm(true);
  };

  // Clear All Items Handler
  const handleClearAllItems = async () => {
    if (items.length === 0) return;
    if (window.confirm('আপনি কি নিশ্চিত যে আপনার সংরক্ষিত সব গহনার তালিকা মুছে ফেলতে চান?')) {
      if (user) {
        for (const it of items) {
          const docPath = `users/${user.uid}/gold_items/${it.id}`;
          try {
            await deleteDoc(doc(db, docPath));
          } catch (e) {
            console.warn(e);
          }
        }
      }
      setItems([]);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-3 sm:px-4 pt-3 pb-24 sm:pb-8 space-y-4">
      
      {/* 1. TOP MOBILE-FIRST BRAND & AUTH BAR */}
      <div className="bg-white border border-gray-200 rounded-2xl p-3 sm:p-4 shadow-2xs flex items-center justify-between gap-2.5">
        <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveView('live')}>
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#D32F2F] text-white flex items-center justify-center font-black text-base shadow-xs shrink-0">
            <Coins className="w-5 h-5 text-yellow-200" />
          </div>
          <div>
            <h1 className="font-black text-gray-900 text-sm sm:text-base leading-tight flex items-center gap-1.5">
              <span>Gold</span>
              <span className="text-[#D32F2F]">বেচে মালামাল</span>
              <span className="text-[10px] bg-[#FFE6EE] text-[#D32F2F] px-1.5 py-0.2 rounded font-bold">
                ব্যক্তিগত
              </span>
            </h1>
            <p className="text-[11px] text-gray-500 truncate max-w-[200px] sm:max-w-none">
              পুরাতন সোনা বিক্রি করে সর্বোচ্চ নগদ টাকা পাওয়ার হিসাব
            </p>
          </div>
        </div>

        {/* Auth / Gmail Login state */}
        <div className="flex items-center gap-2 shrink-0">
          {user ? (
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-xl px-2.5 py-1.5 text-xs">
              {user.photoURL ? (
                <img src={user.photoURL} alt="" className="w-5 h-5 rounded-full" />
              ) : (
                <UserIcon className="w-4 h-4 text-gray-600" />
              )}
              <span className="font-semibold text-gray-800 max-w-[90px] sm:max-w-[130px] truncate text-[11px]">
                {user.displayName || user.email}
              </span>
              <button
                onClick={handleSignOut}
                className="text-gray-400 hover:text-red-600 ml-0.5"
                title="Sign out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleSignIn}
              disabled={isSigningIn}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-700 font-bold text-xs shadow-2xs transition"
            >
              {isSigningIn ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#D32F2F]" />
              ) : (
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
              )}
              <span className="hidden xs:inline">Gmail সাইন ইন</span>
              <span className="xs:hidden">লগইন</span>
            </button>
          )}

          {/* Quick Email Report Button */}
          <button
            onClick={() => {
              if (!user) {
                handleSignIn();
              } else {
                setShowEmailModal(true);
              }
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#D32F2F] hover:bg-[#b71c1c] text-white font-bold text-xs shadow-xs transition"
          >
            <Mail className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">ইমেইলে রিপোর্ট</span>
          </button>
        </div>
      </div>

      {/* 2. TOP SEGMENTED NAVIGATION TABS (Visible on Tablet & Desktop) */}
      <div className="hidden sm:flex items-center justify-between bg-white border border-gray-200 p-1.5 rounded-2xl shadow-2xs text-xs font-bold">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setActiveView('live')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeView === 'live' 
                ? 'bg-[#D32F2F] text-white shadow-xs' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Coins className="w-4 h-4" />
            <span>লাইভ দর (Live Rates)</span>
          </button>

          <button
            onClick={() => setActiveView('portfolio')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeView === 'portfolio' 
                ? 'bg-[#D32F2F] text-white shadow-xs' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Wallet className="w-4 h-4" />
            <span>আমার সোনার হিসাব</span>
            {items.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeView === 'portfolio' ? 'bg-white text-[#D32F2F]' : 'bg-red-100 text-[#D32F2F]'
              }`}>
                {items.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveView('trends')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeView === 'trends' 
                ? 'bg-[#D32F2F] text-white shadow-xs' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <LineChart className="w-4 h-4" />
            <span>বাজার ট্রেন্ড গ্রাফ</span>
          </button>

          <button
            onClick={() => setActiveView('autopilot')}
            className={`px-4 py-2 rounded-xl transition flex items-center gap-1.5 ${
              activeView === 'autopilot' 
                ? 'bg-[#D32F2F] text-white shadow-xs' 
                : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>AI অটো-পাইলট</span>
            {is22KPeak && (
              <span className="w-2 h-2 rounded-full bg-red-400 animate-ping" />
            )}
          </button>
        </div>

        <div className="flex items-center gap-2 px-3 text-gray-500 text-[11px]">
          <span>টার্গেট: ৳ {formatBDT(targetSellPrice)}</span>
        </div>
      </div>

      {/* Auto-Pilot Dispatch Notice if triggered */}
      {autoPilotNotice && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3 text-xs text-emerald-900 font-bold flex items-center justify-between gap-2 animate-fadeIn">
          <div className="flex items-center gap-2">
            <span className="text-base">🤖</span>
            <span>{autoPilotNotice}</span>
          </div>
          <button
            onClick={() => setAutoPilotNotice(null)}
            className="text-emerald-700 hover:text-emerald-950 font-bold text-xs"
          >
            ✕
          </button>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 1: LIVE GOLD RATES & PEAK TARGET (gold-price.bd)    */}
      {/* ======================================================== */}
      {activeView === 'live' && (
        <div className="space-y-4 animate-fadeIn">
          <LiveRatesShowcase
            rates={rates}
            targetSellPrice={targetSellPrice}
            onUpdateTargetSellPrice={setTargetSellPrice}
            buybackPercent={buybackPercent}
            onSelectKaratToSell={handleSelectKaratToSell}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: MY GOLD ITEMS & CASH VALUATION (ZERO DUMMY)      */}
      {/* ======================================================== */}
      {activeView === 'portfolio' && (
        <div className="space-y-4 animate-fadeIn">
          <div className="bg-white border-2 border-red-100 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-gray-100">
              <div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#D32F2F]" />
                  <h3 className="font-black text-gray-900 text-lg">
                    আমার সোনার অলংকার (My Gold to Sell)
                  </h3>
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  আপনার সংরক্ষিত অলংকারগুলোর হিসাব যোগ করুন এবং জানুন মোট কত নগদ টাকা পাবেন।
                  {user && <span className="text-emerald-700 font-semibold ml-1">✓ ক্লাউডে সংরক্ষিত (Firebase)</span>}
                </p>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                {items.length > 0 && (
                  <button
                    type="button"
                    onClick={handleClearAllItems}
                    className="flex items-center gap-1 px-3 py-2 bg-gray-100 hover:bg-red-50 hover:text-red-700 text-gray-600 rounded-xl text-xs font-semibold transition"
                    title="সবগুলো অলংকার মুছে ফেলুন"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>সব মুছুন</span>
                  </button>
                )}
                <button
                  onClick={() => setShowAddForm(!showAddForm)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-[#D32F2F] hover:bg-[#b71c1c] text-white rounded-xl text-xs font-bold transition shadow-2xs"
                >
                  <Plus className="w-4 h-4" />
                  <span>নতুন অলংকার যোগ করুন</span>
                </button>
              </div>
            </div>

            {/* Add Item Form (Collapsible) */}
            {showAddForm && (
              <form onSubmit={handleAddItem} className="mt-4 p-4 rounded-xl bg-[#FFE6EE]/40 border border-[#ffd1de] text-xs space-y-4 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-gray-900 text-sm">নতুন অলংকারের বিবরণ দিন:</h4>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="text-gray-400 hover:text-gray-700"
                  >
                    ✕ বাতিল
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">অলংকারের নাম:</label>
                    <input
                      type="text"
                      placeholder="যেমন: সোনার নেকলেস, চুড়ি, আংটি"
                      value={newItemName}
                      onChange={(e) => setNewItemName(e.target.value)}
                      required
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-hidden focus:border-[#D32F2F]"
                    />
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">সোনার মান / ক্যারেট:</label>
                    <select
                      value={newItemKarat}
                      onChange={(e) => setNewItemKarat(e.target.value as GoldKarat)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-hidden focus:border-[#D32F2F]"
                    >
                      <option value="22K">২২ ক্যারেট (ক্যাডমিয়াম হলমার্ক)</option>
                      <option value="21K">২১ ক্যারেট</option>
                      <option value="18K">১৮ ক্যারেট</option>
                      <option value="Traditional">সনাতন পদ্ধতি (পুরাতন সোনা)</option>
                    </select>
                  </div>

                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">ওজনের একক:</label>
                    <div className="flex bg-white rounded-lg border border-gray-300 p-0.5">
                      <button
                        type="button"
                        onClick={() => setWeightUnit('traditional')}
                        className={`flex-1 py-1 rounded text-center font-semibold transition ${
                          weightUnit === 'traditional' ? 'bg-[#D32F2F] text-white' : 'text-gray-600'
                        }`}
                      >
                        ভরি-আনা-রতি
                      </button>
                      <button
                        type="button"
                        onClick={() => setWeightUnit('grams')}
                        className={`flex-1 py-1 rounded text-center font-semibold transition ${
                          weightUnit === 'grams' ? 'bg-[#D32F2F] text-white' : 'text-gray-600'
                        }`}
                      >
                        গ্রাম (g)
                      </button>
                    </div>
                  </div>
                </div>

                {/* Weight Inputs */}
                {weightUnit === 'traditional' ? (
                  <div className="grid grid-cols-3 gap-3 bg-white p-3 rounded-xl border border-gray-200">
                    <div>
                      <label className="font-semibold text-gray-600 block mb-1">ভরি (Vori):</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={inputVori}
                        onChange={(e) => setInputVori(e.target.value)}
                        className="w-full border border-gray-300 rounded px-2.5 py-1 text-center font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-gray-600 block mb-1">আনা (Ana - ১৬ আনা=১ ভরি):</label>
                      <input
                        type="number"
                        min="0"
                        max="15"
                        step="1"
                        value={inputAna}
                        onChange={(e) => setInputAna(e.target.value)}
                        className="w-full border border-gray-300 rounded px-2.5 py-1 text-center font-mono font-bold"
                      />
                    </div>
                    <div>
                      <label className="font-semibold text-gray-600 block mb-1">রতি (Rotti - ৬ রতি=১ আনা):</label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="1"
                        value={inputRotti}
                        onChange={(e) => setInputRotti(e.target.value)}
                        className="w-full border border-gray-300 rounded px-2.5 py-1 text-center font-mono font-bold"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-3 rounded-xl border border-gray-200">
                    <label className="font-semibold text-gray-600 block mb-1">মোট ওজন গ্রামে (Grams):</label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.01"
                      value={inputGrams}
                      onChange={(e) => setInputGrams(e.target.value)}
                      className="w-full border border-gray-300 rounded px-3 py-1 font-mono font-bold"
                    />
                    <span className="text-[10px] text-gray-400 block mt-1">১ ভরি = ১১.৬৬৪ গ্রাম</span>
                  </div>
                )}

                {/* Optional Original Purchase Price */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="font-semibold text-gray-700 block mb-1">
                      কেনার সময় প্রতি ভরি দর (ঐচ্ছিক - লাভ দেখার জন্য):
                    </label>
                    <input
                      type="number"
                      placeholder="যেমন: ৬০,০০০"
                      value={inputPurchasePrice}
                      onChange={(e) => setInputPurchasePrice(e.target.value)}
                      className="w-full bg-white border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-hidden focus:border-[#D32F2F] font-mono"
                    />
                  </div>

                  <div className="flex items-center gap-2 pt-4">
                    <input
                      type="checkbox"
                      id="voucherCheck"
                      checked={hasVoucher}
                      onChange={(e) => setHasVoucher(e.target.checked)}
                      className="w-4 h-4 text-[#D32F2F] rounded accent-[#D32F2F]"
                    />
                    <label htmlFor="voucherCheck" className="text-gray-700 font-medium cursor-pointer">
                      দোকানের ক্যাশমেমো বা রসিদ আছে (কম খাদ কর্তন)
                    </label>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#D32F2F] hover:bg-[#b71c1c] text-white rounded-lg font-bold shadow-xs"
                  >
                    যোগ করুন (Save Item)
                  </button>
                </div>
              </form>
            )}

            {/* Grand Total Cash Highlight Card */}
            <div className="mt-4 bg-gradient-to-br from-[#FFE6EE] via-white to-red-50 border-2 border-[#D32F2F] rounded-2xl p-4 sm:p-5 shadow-sm text-center md:text-left flex flex-col md:flex-row items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold text-gray-500 uppercase tracking-wider block">
                  মোট ক্যাশ টাকা পাবেন (Estimated Net Cash in Hand)
                </span>
                <div className="flex items-baseline justify-center md:justify-start gap-1 mt-1">
                  <span className="text-2xl text-[#D32F2F] font-black">৳</span>
                  <span className="text-4xl sm:text-5xl font-black text-gray-900 font-mono tracking-tight">
                    {formatBDT(portfolioSummary.totalCash)}
                  </span>
                  <span className="text-sm font-bold text-gray-500">BDT</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">
                  মোট সংরক্ষিত অলংকার: <strong>{portfolioSummary.totalVori} ভরি</strong> ({portfolioSummary.totalGrams} গ্রাম)
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-2">
                {portfolioSummary.hasHistoricalCost && (
                  <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center md:text-right shrink-0">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase block">
                      আপনার মোট লাভ:
                    </span>
                    <span className="text-lg font-black text-emerald-900 font-mono">
                      + ৳ {formatBDT(portfolioSummary.netProfit)}
                    </span>
                    <span className="text-[10px] text-emerald-700 block font-semibold">
                      ({portfolioSummary.profitPercentage}% মুনাফা)
                    </span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setShowShopCustomizer(!showShopCustomizer)}
                  className="px-3 py-2 bg-white border border-gray-200 text-gray-700 rounded-xl text-xs font-bold hover:bg-gray-50 transition shadow-2xs flex items-center gap-1.5"
                >
                  <Sliders className="w-3.5 h-3.5 text-[#D32F2F]" />
                  <span>দোকানের খাদ কর্তন ({Number((100 - buybackPercent).toFixed(1))}%)</span>
                </button>
              </div>
            </div>

            {/* Expandable Local Goldsmith Deduction Rate Adjuster */}
            {showShopCustomizer && (
              <div className="mt-3 p-3.5 bg-gray-50 rounded-xl border border-gray-200 text-xs space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-gray-800">স্থানীয় দোকানের বাইব্যাক রেট (Buyback %):</span>
                  <span className="font-mono font-black text-[#D32F2F]">{buybackPercent}% ক্যাশব্যাক</span>
                </div>
                <input
                  type="range"
                  min="75"
                  max="90"
                  step="0.5"
                  value={buybackPercent}
                  onChange={(e) => setBuybackPercent(parseFloat(e.target.value))}
                  className="w-full accent-[#D32F2F]"
                />
                <div className="flex justify-between text-[10px] text-gray-500 font-medium">
                  <span>৭৫% (২৫% খাদ - সনাতন/রসিদহীন)</span>
                  <span>৮২.৫% (স্ট্যান্ডার্ড বাজুস পলিসি)</span>
                  <span>৯০% (১০% খাদ - একই দোকানের মেমো)</span>
                </div>
              </div>
            )}

            {/* Items List */}
            <div className="mt-4 space-y-2.5">
              {items.length === 0 ? (
                <div className="text-center py-8 px-4 bg-gray-50/70 rounded-2xl border border-dashed border-gray-300 text-xs space-y-3 animate-fadeIn">
                  <div className="w-12 h-12 rounded-2xl bg-[#FFE6EE] text-[#D32F2F] flex items-center justify-center mx-auto text-xl shadow-2xs">
                    💍
                  </div>
                  <div className="max-w-md mx-auto">
                    <h4 className="font-bold text-gray-900 text-sm">কোনো অলংকার তালিকায় নেই</h4>
                    <p className="text-gray-500 text-[11px] mt-1 leading-relaxed">
                      আপনার কাছে যে পুরাতন গহনাগুলো বিক্রির জন্য রয়েছে শুধুমাত্র সেগুলো যোগ করুন। কোনো অপ্রয়োজনীয় ডামি আইটেম রাখা হয়নি।
                    </p>
                  </div>

                  {/* Quick Preset Buttons */}
                  <div className="pt-2">
                    <span className="text-[10px] text-gray-400 font-semibold block uppercase tracking-wider mb-2">
                      দ্রুত এক ক্লিকে অলংকার যোগ করার প্রিসেট:
                    </span>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleQuickPreset('সোনার চেইন (Gold Chain)', '22K', '1.5')}
                        className="px-3 py-1.5 bg-white hover:bg-red-50 hover:text-[#D32F2F] hover:border-red-300 text-gray-700 rounded-xl font-bold border border-gray-200 shadow-2xs transition text-xs"
                      >
                        + সোনার চেইন (১.৫ ভরি)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickPreset('হাতের বালা (Bangles)', '21K', '2.0')}
                        className="px-3 py-1.5 bg-white hover:bg-red-50 hover:text-[#D32F2F] hover:border-red-300 text-gray-700 rounded-xl font-bold border border-gray-200 shadow-2xs transition text-xs"
                      >
                        + হাতের বালা (২.০ ভরি)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickPreset('কানের দুল (Earrings)', '22K', '0.5')}
                        className="px-3 py-1.5 bg-white hover:bg-red-50 hover:text-[#D32F2F] hover:border-red-300 text-gray-700 rounded-xl font-bold border border-gray-200 shadow-2xs transition text-xs"
                      >
                        + কানের দুল (০.৫ ভরি)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleQuickPreset('সোনার আংটি (Ring)', '22K', '0.5')}
                        className="px-3 py-1.5 bg-white hover:bg-red-50 hover:text-[#D32F2F] hover:border-red-300 text-gray-700 rounded-xl font-bold border border-gray-200 shadow-2xs transition text-xs"
                      >
                        + সোনার আংটি (০.৫ ভরি)
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                items.map((item) => {
                  const enriched = portfolioSummary.items.find((it) => it.id === item.id);
                  const cash = enriched ? enriched.estimatedCash : 0;

                  return (
                    <div
                      key={item.id}
                      className="bg-white border border-gray-200 hover:border-gray-300 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs transition shadow-2xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-red-50 text-[#D32F2F] flex items-center justify-center font-bold shrink-0">
                          💍
                        </div>
                        <div>
                          <h4 className="font-bold text-sm text-gray-900">{item.name}</h4>
                          <div className="flex items-center gap-2 text-gray-500 text-[11px] mt-0.5">
                            <span className="font-semibold text-gray-700">{item.karat}</span>
                            <span>•</span>
                            <span>{item.weightVori} ভরি ({item.weightGrams}g)</span>
                            {item.hasHallmarkVoucher && (
                              <>
                                <span>•</span>
                                <span className="text-emerald-700 font-medium">রসিদ আছে</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-4 border-t sm:border-t-0 pt-2 sm:pt-0">
                        <div className="text-right">
                          <span className="text-[10px] text-gray-400 block">বিক্রয় মূল্য পাবেন:</span>
                          <span className="font-mono font-black text-sm text-[#D32F2F]">
                            ৳ {formatBDT(cash)}
                          </span>
                        </div>

                        <button
                          onClick={() => handleDeleteItem(item.id)}
                          className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Practical Tips For Selling Gold */}
          <div className="bg-white border border-gray-200 rounded-2xl p-4 sm:p-5 shadow-xs">
            <h4 className="font-bold text-gray-900 text-sm mb-3 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[#D32F2F]" />
              <span>দোকানে পুরাতন সোনা বিক্রির সময় ঠকে না যাওয়ার ৪টি পরামর্শ:</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-gray-600">
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <strong className="text-gray-900 block mb-0.5">১. ১ ভরি = ১১.৬৬৪ গ্রাম:</strong>
                দোকানদারের ডিজিটাল স্কেলে অবশ্যই গ্রামে ওজন চেক করবেন। ১ ভরি পূর্ণ ১১.৬৬৪ গ্রাম হতে হবে।
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <strong className="text-gray-900 block mb-0.5">২. পাথরের ওজন বাদ দেওয়া:</strong>
                অলংকারে কোনো পাথর বা কুন্দন থাকলে তা আগেই খুলে বা আনুমানিক ওজন বাদ দিয়ে নিট সোনার ওজন ধরবেন।
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <strong className="text-gray-900 block mb-0.5">৩. ক্যাশমেমো ও ১৫% খাদ:</strong>
                যে দোকান থেকে কেনা হয়েছিল সেখানে গেলে সাধারণত মাত্র ১৫% খাদ কর্তনে সর্বোচ্চ নগদ টাকা পাওয়া যায়।
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <strong className="text-gray-900 block mb-0.5">৪. ৩টি দোকানে দর যাচাই:</strong>
                তাঁতিবাজার বা বায়তুল মোকাররমে বিক্রির আগে অন্তত ২টি আলাদা দোকানে কষ্টিপাথরে মান ও দর যাচাই করে নিন।
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 3: HISTORICAL RECHARTS TREND GRAPH (ZOOM & BRUSH)   */}
      {/* ======================================================== */}
      {activeView === 'trends' && (
        <div className="space-y-4 animate-fadeIn">
          <PersonalTrendChart 
            targetSellPrice={targetSellPrice} 
            currentLocalRate={rates[activeKarat]}
            selectedKarat={activeKarat}
            onKaratChange={setActiveKarat}
          />
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 4: AI AUTO-PILOT & BEST TIME TO SELL ENGINE         */}
      {/* ======================================================== */}
      {activeView === 'autopilot' && (
        <div className="space-y-4 animate-fadeIn">
          <AIAutoPilotPanel
            isAutoPilotEnabled={isAutoPilotEnabled}
            onToggleAutoPilot={setIsAutoPilotEnabled}
            targetPrice={targetSellPrice}
            currentRate22K={rates['22K']}
            recipientEmail={emailRecipient}
            lastAutoSentDate={lastAutoSentDate}
            isPeakActive={rates['22K'] >= targetSellPrice}
            onTriggerTestAutoPilot={handleTriggerTestAutoPilot}
            isSendingTest={isSendingTestAutoPilot}
          />

          <BestTimeToSellEngine
            currentPrice={rates[activeKarat]}
            targetPrice={targetSellPrice}
            onTargetPriceChange={setTargetSellPrice}
            onLocalPriceChange={(newPrice) => {
              setRates((prev) => ({
                ...prev,
                [activeKarat]: newPrice,
              }));
            }}
            selectedKarat={activeKarat}
            onOpenEmailModal={() => setShowEmailModal(true)}
          />

          {/* AI Market Advisory Card */}
          <div className="bg-gradient-to-r from-red-50/70 via-pink-50/60 to-red-50/70 border border-red-200 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#D32F2F] text-white flex items-center justify-center font-bold shrink-0 shadow-xs">
                ✨
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                  <span>এআই স্বর্ণ বিক্রয় পরামর্শক (AI Market Insights)</span>
                  <span className="text-[10px] bg-[#D32F2F] text-white font-bold px-2 py-0.5 rounded-full">
                    Live Analysis
                  </span>
                </h4>
                <p className="text-xs text-gray-700 leading-relaxed">
                  বর্তমান বাজারে ২২ ক্যারেট সোনার দর <strong className="text-gray-900 font-mono">৳ {formatBDT(rates['22K'])}</strong> / ভরি। আন্তর্জাতিক গোল্ড স্পট এবং স্থানীয় তারল্য পর্যালোচনায় দর বর্তমান ইতিহাসের শীর্ষ চূড়ায় অবস্থান করছে। আপনার বিক্রয় লক্ষ্যমাত্রা <strong className="text-[#D32F2F] font-mono">৳ {formatBDT(targetSellPrice)}</strong> থাকায় এখন পুরাতন গহনা বিক্রি করে মূলধন ক্যাশআউট করার জন্য একটি আদর্শ সময়।
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 5. FIXED BOTTOM MOBILE NAVIGATION BAR (TOUCH ERGONOMICS) */}
      {/* ======================================================== */}
      <nav 
        aria-label="Mobile Navigation"
        className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 px-2 py-1 shadow-lg flex items-center justify-around"
      >
        <button
          onClick={() => setActiveView('live')}
          className={`flex flex-col items-center justify-center min-w-[64px] min-h-[48px] px-2 py-1 rounded-xl transition ${
            activeView === 'live' ? 'text-[#D32F2F]' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Coins className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">Live দর</span>
        </button>

        <button
          onClick={() => setActiveView('portfolio')}
          className={`flex flex-col items-center justify-center min-w-[64px] min-h-[48px] px-2 py-1 rounded-xl relative transition ${
            activeView === 'portfolio' ? 'text-[#D32F2F]' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Wallet className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">বিক্রয় হিসাব</span>
          {items.length > 0 && (
            <span className="absolute top-1 right-2.5 w-4 h-4 rounded-full bg-[#D32F2F] text-white font-black text-[9px] flex items-center justify-center shadow-xs">
              {items.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveView('trends')}
          className={`flex flex-col items-center justify-center min-w-[64px] min-h-[48px] px-2 py-1 rounded-xl transition ${
            activeView === 'trends' ? 'text-[#D32F2F]' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <LineChart className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">ট্রেন্ড চার্ট</span>
        </button>

        <button
          onClick={() => setActiveView('autopilot')}
          className={`flex flex-col items-center justify-center min-w-[64px] min-h-[48px] px-2 py-1 rounded-xl relative transition ${
            activeView === 'autopilot' ? 'text-[#D32F2F]' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Bot className="w-5 h-5" />
          <span className="text-[10px] font-bold mt-0.5">অটো-পাইলট</span>
          {is22KPeak && (
            <span className="absolute top-1.5 right-3 w-2 h-2 rounded-full bg-[#D32F2F] animate-ping" />
          )}
        </button>
      </nav>

      {/* ======================================================== */}
      {/* 6. GMAIL WORKSPACE CONFIRMATION MODAL                    */}
      {/* ======================================================== */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-5 sm:p-6 shadow-2xl border border-gray-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2 text-gray-900 font-bold">
                <Mail className="w-5 h-5 text-[#D32F2F]" />
                <span>Gmail-এ রিপোর্ট পাঠানোর নিশ্চিতকরণ</span>
              </div>
              <button
                onClick={() => setShowEmailModal(false)}
                className="text-gray-400 hover:text-gray-600 font-bold"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-gray-600 leading-relaxed">
              আপনার অনুমতিক্রমে আপনার সংযুক্ত Gmail (<strong className="text-gray-900">{emailRecipient}</strong>) থেকে আপনার বর্তমান সোনার ভ্যালুয়েশন ও পিক অ্যালার্ট রিপোর্ট পাঠানো হবে।
            </p>

            <div className="bg-[#FFE6EE]/40 p-3.5 rounded-xl border border-red-100 text-xs space-y-2">
              <div>
                <span className="text-gray-500 block text-[11px]">প্রাপক (Recipient):</span>
                <input
                  type="email"
                  value={emailRecipient}
                  onChange={(e) => setEmailRecipient(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded px-2.5 py-1 font-semibold text-gray-900"
                />
              </div>
              <div>
                <span className="text-gray-500 block text-[11px]">বিষয় (Subject):</span>
                <input
                  type="text"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded px-2.5 py-1 text-gray-800"
                />
              </div>
              <div className="text-[11px] text-gray-600 pt-1">
                অন্তর্ভুক্ত: মোট ক্যাশ <strong>৳ {formatBDT(portfolioSummary.totalCash)} BDT</strong>, {portfolioSummary.items.length}টি অলংকার এবং লাইভ বাজুস রেট।
              </div>
            </div>

            {emailErrorMessage && (
              <div className="p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{emailErrorMessage}</span>
              </div>
            )}

            {emailSentSuccess && (
              <div className="p-3 bg-emerald-50 text-emerald-800 text-xs rounded-lg border border-emerald-200 flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>আপনার Gmail-এ সফলভাবে রিপোর্ট পাঠানো হয়েছে!</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowEmailModal(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-100"
              >
                বাতিল করুন (Cancel)
              </button>

              <button
                type="button"
                onClick={handleSendEmail}
                disabled={isSendingEmail || emailSentSuccess}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#D32F2F] hover:bg-[#b71c1c] text-white flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {isSendingEmail ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>পাঠানো হচ্ছে...</span>
                  </>
                ) : emailSentSuccess ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>পাঠানো সম্পন্ন!</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>নিশ্চিত করুন ও পাঠান (Confirm & Send)</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
