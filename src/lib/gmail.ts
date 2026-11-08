/**
 * Gmail REST API Client for Sending Gold Intelligence Reports & Peak Alerts
 */

// Helper to convert Unicode string to UTF-8 Base64URL string for RFC 2822 email format
function base64UrlEncode(str: string): string {
  // Use TextEncoder to handle UTF-8 characters (like Bengali text) properly
  const utf8Bytes = new TextEncoder().encode(str);
  let binary = '';
  utf8Bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export interface SendEmailParams {
  accessToken: string;
  to: string;
  subject: string;
  htmlBody: string;
}

export async function sendGmailMessage({ accessToken, to, subject, htmlBody }: SendEmailParams) {
  // Build RFC 2822 compliant message
  const utf8Subject = `=?utf-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`;
  const messageParts = [
    `To: ${to}`,
    'Content-Type: text/html; charset=UTF-8',
    'MIME-Version: 1.0',
    `Subject: ${utf8Subject}`,
    '',
    htmlBody,
  ];
  const message = messageParts.join('\r\n');
  const encodedMessage = base64UrlEncode(message);

  const response = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: encodedMessage,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Failed to send email (Status ${response.status})`);
  }

  return await response.json();
}

export function generateGoldReportHtml(params: {
  isPeak: boolean;
  rate22K: number;
  rate21K: number;
  rate18K: number;
  rateSonaton: number;
  targetPrice: number;
  items: Array<{
    name: string;
    karat: string;
    weightVori: number;
    weightGrams: number;
    estimatedCash: number;
  }>;
  totalCash: number;
  totalVori: number;
  userEmail: string;
  isAutoPilot?: boolean;
}): string {
  const {
    isPeak,
    rate22K,
    rate21K,
    rate18K,
    rateSonaton,
    targetPrice,
    items,
    totalCash,
    totalVori,
    isAutoPilot = true,
  } = params;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #fafafc; margin: 0; padding: 20px; color: #1f2937; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #e5e7eb; box-shadow: 0 4px 6px rgba(0,0,0,0.05); }
    .header { background: ${isPeak ? '#D32F2F' : '#1f2937'}; color: #ffffff; padding: 24px; text-align: center; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 800; }
    .header p { margin: 6px 0 0; font-size: 13px; opacity: 0.9; }
    .autopilot-badge { display: inline-block; background: rgba(255,255,255,0.25); color: #ffffff; font-size: 11px; font-weight: bold; padding: 4px 12px; border-radius: 20px; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.5px; }
    .banner { background: #FFE6EE; border-left: 4px solid #D32F2F; padding: 14px 18px; margin: 20px; border-radius: 8px; font-size: 13px; color: #991b1b; }
    .content { padding: 0 24px 24px; }
    .rates-table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 12px; }
    .rates-table th { background: #f3f4f6; text-align: left; padding: 8px 12px; color: #4b5563; font-weight: 600; }
    .rates-table td { padding: 8px 12px; border-bottom: 1px solid #f3f4f6; }
    .highlight-card { background: #fff1f2; border: 2px solid #D32F2F; border-radius: 12px; padding: 18px; margin: 20px 0; text-align: center; }
    .highlight-card .amount { font-size: 32px; font-weight: 900; color: #D32F2F; margin: 4px 0; }
    .item-list { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
    .item-list th { text-align: left; padding: 6px 8px; border-bottom: 2px solid #e5e7eb; color: #6b7280; }
    .item-list td { padding: 8px; border-bottom: 1px solid #f3f4f6; }
    .footer { background: #f9fafb; padding: 16px 24px; font-size: 11px; text-align: center; color: #6b7280; border-top: 1px solid #e5e7eb; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      ${isAutoPilot ? '<div class="autopilot-badge">🤖 AI Auto-Pilot Automatic Dispatch</div>' : ''}
      <h1>${isPeak ? '🚨 [PEAK ALERT] Gold বেচে মালামাল' : '📜 আপনার সোনার গহনা ভ্যালুয়েশন রিপোর্ট'}</h1>
      <p>Bangladesh Gold Intelligence • বাজুস লাইভ রেট ভিত্তিক ব্যক্তিগত হিসাব</p>
    </div>

    ${isPeak ? `
    <div class="banner">
      <strong>🚨 পিক মার্কেট বিক্রয় সংকেত:</strong> আজকের ২২ ক্যারেট বাজুস দর (৳ ${rate22K.toLocaleString('en-IN')}) আপনার টার্গেট মূল্য (৳ ${targetPrice.toLocaleString('en-IN')}) অতিক্রম করেছে! পুরাতন অলংকার বিক্রি করে সর্বোচ্চ নগদ টাকা ক্যাশআউট করার এখনই সেরা সুযোগ।
    </div>
    ` : ''}

    <div class="content">
      <div class="highlight-card">
        <span style="font-size: 12px; text-transform: uppercase; color: #6b7280; font-weight: bold;">মোট ক্যাশ প্রাপ্তি (Net Cash in Hand):</span>
        <div class="amount">৳ ${totalCash.toLocaleString('en-IN')} BDT</div>
        <div style="font-size: 12px; color: #4b5563;">মোট সংরক্ষিত গহনার ওজন: <strong>${totalVori.toFixed(3)} ভরি</strong></div>
      </div>

      <h3 style="font-size: 14px; margin-bottom: 6px; color: #111827;">📊 আজকের অফিসিয়াল বাজুস রেট (BAJUS Rates)</h3>
      <table class="rates-table">
        <tr><th>ক্যারেট / মান</th><th>বাজুস বাজার দর (ভরি)</th><th>পুরাতন সোনা ক্রয় (Buyback ~৮২.৫%)</th></tr>
        <tr><td><strong>২২ ক্যারেট</strong></td><td>৳ ${rate22K.toLocaleString('en-IN')}</td><td style="color:#D32F2F; font-weight:bold;">৳ ${Math.round(rate22K * 0.825).toLocaleString('en-IN')}</td></tr>
        <tr><td><strong>২১ ক্যারেট</strong></td><td>৳ ${rate21K.toLocaleString('en-IN')}</td><td style="color:#D32F2F; font-weight:bold;">৳ ${Math.round(rate21K * 0.825).toLocaleString('en-IN')}</td></tr>
        <tr><td><strong>১৮ ক্যারেট</strong></td><td>৳ ${rate18K.toLocaleString('en-IN')}</td><td style="color:#D32F2F; font-weight:bold;">৳ ${Math.round(rate18K * 0.825).toLocaleString('en-IN')}</td></tr>
        <tr><td><strong>সনাতন পদ্ধতি</strong></td><td>৳ ${rateSonaton.toLocaleString('en-IN')}</td><td style="color:#D32F2F; font-weight:bold;">৳ ${Math.round(rateSonaton * 0.825).toLocaleString('en-IN')}</td></tr>
      </table>

      ${items.length > 0 ? `
      <h3 style="font-size: 14px; margin-top: 24px; margin-bottom: 6px; color: #111827;">💍 আপনার সংরক্ষিত গহনার তালিকা (${items.length}টি অলংকার)</h3>
      <table class="item-list">
        <tr><th>অলংকার</th><th>ক্যারেট</th><th>ওজন (ভরি / গ্রাম)</th><th style="text-align:right;">নগদ মূল্য (BDT)</th></tr>
        ${items.map(it => `
          <tr>
            <td><strong>${it.name}</strong></td>
            <td>${it.karat}</td>
            <td>${it.weightVori.toFixed(3)} ভরি (${it.weightGrams.toFixed(2)}g)</td>
            <td style="text-align:right; font-weight:bold; color:#D32F2F;">৳ ${it.estimatedCash.toLocaleString('en-IN')}</td>
          </tr>
        `).join('')}
      </table>
      ` : ''}

      <div style="margin-top: 20px; padding: 12px; background: #fefce8; border: 1px solid #fef08a; border-radius: 8px; font-size: 11px; color: #854d0e;">
        <strong>💡 দোকানদারের কাছে বিক্রির টিপস:</strong> ১ ভরি = ১১.৬৬৪ গ্রাম ডিজিটাল স্কেলে যাচাই করুন। কুন্দন বা পাথরের ওজন যেন সোনা হিসেবে বাদ দেওয়া হয় এবং পাকা ক্যাশমেমো থাকলে ১৫% এর বেশি খাদ কাটতে দেবেন না।
      </div>
    </div>

    <div class="footer">
      Gold বেচে মালামাল • ব্যক্তিগত ব্যবহারের জন্য প্রস্তুতকৃত • বাংলাদেশ জুয়েলার্স অ্যাসোসিয়েশন (BAJUS) মানদণ্ড
    </div>
  </div>
</body>
</html>
  `;
}
