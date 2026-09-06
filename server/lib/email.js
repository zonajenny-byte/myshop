/**
 * 寄信（Resend）。直接用 fetch，不拉 SDK——
 * 我們只需要「送一封信」這一種呼叫，為此多一個套件依賴不划算。
 *
 * 跟 line.js 同樣的原則：這是輔助功能，不是關鍵路徑。
 * 沒設定、寄失敗、Resend 掛掉，都不該讓訂單處理跟著失敗，
 * 所以這裡的函式永遠不丟例外，失敗只印 log。
 *
 * 免費方案是每月 3000 封、但每天上限 100 封。一般訂單量夠用，
 * 如果做活動一天可能超過 100 筆，要先升級方案，不然信會寄不出去。
 */
const API_KEY = process.env.RESEND_API_KEY;
// 寄件人。網域要先在 Resend 後台驗證過才能用自己的網域，
// 還沒驗證前可以用 onboarding@resend.dev，但只能寄給你自己註冊的信箱。
const FROM = process.env.RESEND_FROM || "AuraPlayground <onboarding@resend.dev>";

export function isConfigured() {
  return !!API_KEY;
}

/** 送一封信。回傳 true/false 讓呼叫端知道結果，但不丟例外。 */
export async function send({ to, subject, html }) {
  if (!API_KEY) {
    console.log(`[email] 未設定 RESEND_API_KEY，這封信沒有寄出：${subject} → ${to}`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: [to], subject, html }),
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => "");
      console.error("[email] 寄送失敗:", res.status, errText.slice(0, 300));
      return false;
    }
    return true;
  } catch (e) {
    console.error("[email] 寄送發生錯誤:", e.message);
    return false;
  }
}

/* ---------- 信件樣板 ---------- */

const money = (n) => "NT$" + Math.round(Number(n) || 0).toLocaleString("en-US");

/** 所有信共用的外框，維持品牌一致 */
function wrap(innerHtml) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:24px;background:#FDFAFB;
    font-family:'Noto Serif TC',Georgia,serif;color:#3D3444;line-height:1.85">
    <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:20px;
      padding:32px 28px;box-shadow:0 4px 18px rgba(61,52,68,.07)">
      <div style="font-size:19px;letter-spacing:.14em;margin-bottom:4px">
        AURA<span style="color:#E05C87">PLAYGROUND</span></div>
      <div style="font-size:12px;color:#8B8296;letter-spacing:.16em;font-style:italic;
        margin-bottom:26px">每天進步一點，成為更好的自己</div>
      ${innerHtml}
      <div style="margin-top:30px;padding-top:18px;border-top:1px solid rgba(61,52,68,.1);
        font-size:12px;color:#8B8296;line-height:1.7">
        這封信由系統自動寄出。<br>
        AI 工具為生活輔助用途，不提供醫療、營養、心理治療、法律或投資服務。
      </div>
    </div></body></html>`;
}

export function magicLinkTemplate(link) {
  return {
    subject: "你的 AuraPlayground 登入連結",
    html: wrap(`
      <h1 style="font-size:22px;font-weight:400;margin:0 0 14px">登入你的工具台</h1>
      <p style="font-size:14.5px;margin:0 0 22px">
        點下面的按鈕就能進入工具台，使用你買的 AI 工具。這個連結有效期 30 天。
      </p>
      <a href="${link}" style="display:inline-block;background:#FFD633;color:#3D3444;
        text-decoration:none;padding:14px 30px;border-radius:20px;font-size:14.5px;
        letter-spacing:.1em">開啟工具台</a>
      <p style="font-size:12.5px;color:#8B8296;margin:22px 0 0">
        按鈕沒反應的話，複製這個網址貼到瀏覽器：<br>
        <span style="word-break:break-all;color:#6B7FA8">${link}</span>
      </p>
      <p style="font-size:12.5px;color:#8B8296;margin:14px 0 0">
        如果這不是你本人要求的，忽略這封信就好，沒有人能用它登入你的帳號。
      </p>
    `),
  };
}

export function orderConfirmTemplate(order) {
  const items = order.items || [];
  const digital = items.filter((id) => id.startsWith("AP-SL-") && !id.endsWith(":sub"));
  const subs = items.filter((id) => id.endsWith(":sub"));
  const physical = items.filter((id) => id.startsWith("PH-"));

  const rows = [];
  if (physical.length) rows.push(["實體商品", `${physical.length} 件，備貨後寄出`]);
  if (digital.length) rows.push(["AI 工具", `${digital.length} 顆，登入工具台即可使用`]);
  if (subs.length) rows.push(["訂閱", `${subs.length} 項，已開通一個月`]);

  const shipInfo = order.shippingTo
    ? `<div style="background:#FFEEF3;border-radius:14px;padding:14px 16px;margin-top:18px">
         <div style="font-size:12px;color:#8B8296;letter-spacing:.1em;margin-bottom:6px">收件資訊</div>
         <div style="font-size:14px">${order.shippingTo.county || ""}${order.shippingTo.address || ""}</div>
       </div>`
    : "";

  return {
    subject: `訂單成立 ${order.orderNo}｜AuraPlayground`,
    html: wrap(`
      <h1 style="font-size:22px;font-weight:400;margin:0 0 14px">謝謝你的訂購</h1>
      <p style="font-size:14.5px;margin:0 0 20px">
        ${order.buyer?.name || ""} 你好，付款已經完成，訂單成立了。
      </p>
      <div style="background:#F4F1F6;border-radius:14px;padding:16px 18px">
        <div style="font-size:12px;color:#8B8296;letter-spacing:.1em;margin-bottom:8px">訂單編號</div>
        <div style="font-family:monospace;font-size:15px;margin-bottom:14px">${order.orderNo}</div>
        ${rows.map(([k, v]) => `
          <div style="display:flex;justify-content:space-between;font-size:14px;margin-top:8px">
            <span style="color:#8B8296">${k}</span><span>${v}</span></div>`).join("")}
        <div style="display:flex;justify-content:space-between;font-size:16px;
          margin-top:14px;padding-top:12px;border-top:1px solid rgba(61,52,68,.1)">
          <span>合計</span><span>${money(order.amount)}</span></div>
      </div>
      ${shipInfo}
      ${digital.length || subs.length ? `
        <p style="font-size:14px;margin:22px 0 0">
          數位商品已經開通了。稍後會另外寄一封登入連結給你，
          或直接到網站的「工具台」用這個 Email 登入。
        </p>` : ""}
      ${physical.length ? `
        <p style="font-size:14px;margin:18px 0 0">
          實體商品會在 3–5 個工作天內出貨，寄出後會再通知你物流單號。
        </p>` : ""}
    `),
  };
}
