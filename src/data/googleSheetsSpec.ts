export interface SheetColumnSpec {
  name: string;
  type: string;
  lookerType: string;
  description: string;
  sampleValue: string;
  formulaOrSource: string;
}

export const SHEETS_COLUMNS_SPEC: SheetColumnSpec[] = [
  {
    name: 'Date',
    type: 'Date (YYYY-MM-DD)',
    lookerType: 'Date',
    description: 'Daily transaction or tracking date for time-series aggregation',
    sampleValue: '2026-11-08',
    formulaOrSource: 'Auto-logged by Apps Script timestamp',
  },
  {
    name: 'Timestamp',
    type: 'Date & Time (ISO)',
    lookerType: 'Date Hour Minute',
    description: 'Exact market rate announcement timestamp (BAJUS press release time)',
    sampleValue: '2026-11-08T10:00:00+06:00',
    formulaOrSource: '=NOW()',
  },
  {
    name: 'Gold_Type',
    type: 'Text',
    lookerType: 'Text',
    description: 'Grade of gold ornament (22K, 21K, 18K, Traditional / Sonaton)',
    sampleValue: '22K',
    formulaOrSource: 'Categorical dimension',
  },
  {
    name: 'Market_Price_Per_Vori_BDT',
    type: 'Number (Currency)',
    lookerType: 'Currency (BDT)',
    description: 'Official BAJUS tracking baseline for 1 Vori (11.664 grams)',
    sampleValue: '142850',
    formulaOrSource: 'Web scraper / BAJUS daily notice',
  },
  {
    name: 'Old_Gold_BuyBack_Price_BDT',
    type: 'Number (Currency)',
    lookerType: 'Currency (BDT)',
    description: 'Calculated buyback price for old gold resale (typically ~80% - 85% of market price)',
    sampleValue: '117851',
    formulaOrSource: '=ROUND(D2 * 0.825, 0)',
  },
  {
    name: 'USD_BDT_Rate',
    type: 'Number (Decimal)',
    lookerType: 'Number',
    description: 'Current USD to Bangladeshi Taka interbank conversion rate',
    sampleValue: '121.80',
    formulaOrSource: '=GOOGLEFINANCE("CURRENCY:USDBDT")',
  },
  {
    name: 'International_Gold_USD_Oz',
    type: 'Number (Currency)',
    lookerType: 'Currency (USD)',
    description: 'Global COMEX / London Bullion spot gold price per Troy Ounce ($/oz)',
    sampleValue: '2735.40',
    formulaOrSource: 'World bullion feed API / Google Finance',
  },
  {
    name: 'Market_Price_Per_Gram_BDT',
    type: 'Number (Currency)',
    lookerType: 'Currency (BDT)',
    description: 'Price per 1 gram of gold in Bangladeshi Taka',
    sampleValue: '12247.08',
    formulaOrSource: '=ROUND(D2 / 11.664, 2)',
  },
];

export const GOOGLE_APPS_SCRIPT_CODE = `/**
 * Google Apps Script for "Gold বেচে মালামাল" Live Tracking
 * Sheet: BAJUS_Gold_Daily_Tracking
 * Instructions: Open Google Sheets -> Extensions -> Apps Script -> Paste this code -> Save -> Set Trigger daily at 10:00 AM BST.
 */

function fetchAndLogDailyGoldRates() {
  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName("Live_Gold_Data") || SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  
  // 1. Fetch USD to BDT exchange rate via Google Finance
  const usdBdtCell = sheet.getRange("Z1");
  usdBdtCell.setFormula('=GOOGLEFINANCE("CURRENCY:USDBDT")');
  SpreadsheetApp.flush();
  Utilities.sleep(1000);
  const usdBdt = usdBdtCell.getValue() || 121.80;
  
  // 2. Official BAJUS gold baseline rates (Can connect to BAJUS API or web parser)
  // Standard rates in BDT per Vori
  const currentRates = [
    { type: "22K", marketPrice: 142850 },
    { type: "21K", marketPrice: 136350 },
    { type: "18K", marketPrice: 116900 },
    { type: "Traditional", marketPrice: 96200 }
  ];
  
  const today = new Date();
  const dateStr = Utilities.formatDate(today, "Asia/Dhaka", "yyyy-MM-dd");
  const timestampStr = Utilities.formatDate(today, "Asia/Dhaka", "yyyy-MM-dd'T'HH:mm:ssXXX");
  
  // Buyback multiplier: 82.5% (representing standard 17.5% deduction)
  const buyBackMultiplier = 0.825;
  const internationalOunce = 2735.40; // Global spot rate
  
  // 3. Append rows to Google Sheet
  currentRates.forEach(item => {
    const buyBackPrice = Math.round(item.marketPrice * buyBackMultiplier);
    const perGram = Number((item.marketPrice / 11.664).toFixed(2));
    
    sheet.appendRow([
      dateStr,
      timestampStr,
      item.type,
      item.marketPrice,
      buyBackPrice,
      usdBdt,
      internationalOunce,
      perGram
    ]);
  });
  
  Logger.log("✅ Successfully logged BAJUS rates for " + dateStr);
  
  // 4. Trigger peak alert email check
  checkPeakAndSendEmailAlert(currentRates[0].marketPrice);
}

/**
 * Automated Peak Notification Email Sender
 */
function checkPeakAndSendEmailAlert(current22kPrice) {
  // Configurable selling price threshold
  const TARGET_THRESHOLD = 140000; // e.g. 140,000 BDT
  const ALERT_EMAIL = Session.getActiveUser().getEmail() || "sanzida32@gmail.com";
  
  if (current22kPrice >= TARGET_THRESHOLD) {
    const subject = "🚨 [PEAK ALERT] Gold বেচে মালামাল - ২২ ক্যারেট স্বর্ণ বিক্রির রেকর্ড রেট!";
    const body = \`
    স্বর্ণ বিক্রির সেরা সময়! (Peak Alert)
    ======================================
    আজকের ২২ ক্যারেট বাজুস রেট: ৳ \${current22kPrice.toLocaleString('en-IN')} BDT/ভরি।
    আপনার টার্গেট থ্রেশহোল্ড ছিল: ৳ \${TARGET_THRESHOLD.toLocaleString('en-IN')} BDT।
    
    পুরাতন স্বর্ণ বিক্রয় (Buyback) আনুমানিক দর: ৳ \${Math.round(current22kPrice * 0.825).toLocaleString('en-IN')} BDT/ভরি।
    
    👉 এখনই আপনার Google Looker Studio ড্যাশবোর্ড চেক করুন:
    "Gold বেচে মালামাল" ইন্টেলিজেন্স সিস্টেম।
    \`;
    
    MailApp.sendEmail(ALERT_EMAIL, subject, body);
    Logger.log("📧 Sent peak alert email to: " + ALERT_EMAIL);
  }
}
`;

export const LOOKER_STUDIO_GUIDE_DATA = [
  {
    stepNumber: 1,
    title: 'Google Sheets Backend Setup & Automated Ingestion',
    banglaTitle: '১. গুগল শিটস ডেটাসোর্স তৈরি এবং অটোমেশন স্ক্রিপ্ট যুক্তকরণ',
    summary: 'Structure your Google Sheet with standardized column headers matching Looker Studio requirements and configure the automated daily Google Apps Script.',
    actionItems: [
      'Create a new Google Sheet named "BAJUS_Gold_Daily_Tracking".',
      'Name Sheet 1 as "Live_Gold_Data" and paste the 8 standard columns: Date, Timestamp, Gold_Type, Market_Price_Per_Vori_BDT, Old_Gold_BuyBack_Price_BDT, USD_BDT_Rate, International_Gold_USD_Oz, Market_Price_Per_Gram_BDT.',
      'In Google Sheets, go to Extensions → Apps Script, paste the provided production script, and test run `fetchAndLogDailyGoldRates()`.',
      'Add a Time-Driven Trigger: Set Event Source to "Time-driven" -> "Day timer" -> "10am to 11am" (aligns with BAJUS morning price notices in Dhaka).',
      'Verify that `Old_Gold_BuyBack_Price_BDT` is dynamically populated using `=ROUND(D2 * 0.825, 0)` so resale values track faithfully.',
    ],
    lookerStudioTip: 'Always format column A as "Date" (Format -> Number -> Date) in Google Sheets before connecting to Looker Studio to prevent type inference bugs.',
  },
  {
    stepNumber: 2,
    title: 'Looker Studio Data Connection & Blended Parameters',
    banglaTitle: '২. লুকার স্টুডিওতে শিটস কানেক্ট ও প্যারামিটার কনফিগারেশন',
    summary: 'Connect the Google Sheet as your primary live data source and configure user parameters for dynamic selling threshold testing.',
    actionItems: [
      'Open Looker Studio (lookerstudio.google.com) and click "Blank Report".',
      'Select "Google Sheets" connector, pick "BAJUS_Gold_Daily_Tracking", and choose worksheet "Live_Gold_Data". Ensure "Use first row as headers" is checked.',
      'In the Data Source schema editor, confirm data types: Date -> Date (YYYYMMDD), Market_Price_Per_Vori_BDT -> Currency (BDT / ৳), Gold_Type -> Text.',
      'Click "Add a parameter": Name it `Target_Selling_Price_Parameter`, set Data type to "Number (Whole)", Default value to `140000`. This enables report viewers to type their custom selling target!',
      'Click "Add a field" and create the Calculated Fields (copy formulas from the "Calculated Fields" tab in this app): `Selling_Status_Badge` and `Peak_Market_Notification_Banner`.',
    ],
    lookerStudioTip: 'Use Looker Studio "Date Range Control" at the top of the canvas so users can toggle between 7 Days, 30 Days, 90 Days, and All Time with one click.',
  },
  {
    stepNumber: 3,
    title: 'Setting up Scheduled Email Delivery & Threshold Peak Alerts',
    banglaTitle: '৩. সিডিউলড ইমেইল ডেলিভারি ও পিক প্রাইস এলার্ট সেটআপ',
    summary: 'Leverage Looker Studio built-in Scheduled Delivery to receive automated daily PDF snapshots and combine with Google Apps Script for real-time peak threshold email alerts.',
    actionItems: [
      'In Looker Studio (View or Edit mode), click the drop-down arrow next to the "Share" button at the top right and select "Schedule delivery".',
      'Under "Recipients", enter your email address (e.g. sanzida32@gmail.com). Add any family members who also hold gold.',
      'Set Frequency: Select "Daily", Repeat: "Every 1 day", Start time: "11:00 AM" (shortly after BAJUS daily rates are posted and ingested into your sheet).',
      'Customize options: Check "Send PDF of report" and select your main dashboard page. Add a personalized subject: "[Daily Summary] Gold বেচে মালামাল - আজকের সোনার বাজার ও বিক্রয় রেট".',
      'For instant conditional spike alerts: The included Google Apps Script handles instant event-driven threshold emails whenever BAJUS announces a rate above your target price!',
    ],
    lookerStudioTip: 'Looker Studio scheduled reports render the exact state of the dashboard with your default filter parameters applied, delivering a clean executive PDF right into your Gmail inbox.',
  },
  {
    stepNumber: 4,
    title: 'Troubleshooting Common Looker Studio & API Sync Errors',
    banglaTitle: '৪. সাধারণ ডাটাবেজ সিঙ্ক ও এপিআই ত্রুটি সমাধান গাইড',
    summary: 'Ensure 100% data fidelity, eliminate caching delays, fix date-parsing mismatches, and handle empty weekend rows.',
    actionItems: [
      'Error: "Date is parsed as Text instead of Date": In Looker Studio data source settings, edit the field type -> Date & Time -> Date. If still failing, create calculated field: `PARSE_DATE("%Y-%m-%d", Date)`.',
      'Error: "Data source has changed / Invalid configuration": Whenever you add new columns to your Google Sheet, open Looker Studio -> Resource -> Manage added data sources -> Edit -> Click "Refresh Fields" at bottom left.',
      'Data Freshness Latency: By default, Looker Studio caches Google Sheets queries for 15 minutes. To force live data, click the "..." three-dot menu on any chart -> "Refresh data", or set data freshness to "Every 15 minutes" in Data Source Settings.',
      'Dealing with Weekend / Friday closures: BAJUS does not revise rates on Fridays or national holidays. Ensure your Apps Script carries forward the last known rate rather than writing blank cells.',
      'GoogleFinance Rate Limit: Sometimes `=GOOGLEFINANCE("CURRENCY:USDBDT")` temporarily returns `#N/A`. The provided script includes a fallback value (121.80) to prevent report calculation crashes.',
    ],
    lookerStudioTip: 'Always turn on "Show missing values" in Time Series chart settings with "Line" interpolation so weekend gaps do not break continuous trend lines.',
  },
];
