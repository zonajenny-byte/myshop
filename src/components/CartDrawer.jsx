import { useState } from "react";
import { useCart, money } from "../lib/cart";
import { SKILL_BUNDLE, SHIPPING_FEE, FREE_SHIPPING_OVER } from "../data/catalog";
import { createOrder } from "../lib/api";

const COUNTIES = [
  "台北市","新北市","基隆市","桃園市","新竹市","新竹縣","苗栗縣","台中市",
  "彰化縣","南投縣","雲林縣","嘉義市","嘉義縣","台南市","高雄市","屏東縣",
  "宜蘭縣","花蓮縣","台東縣","澎湖縣","金門縣","連江縣",
];

export default function CartDrawer() {
  const cart = useCart();
  const [f, setF] = useState({
    name: "", email: "", phone: "", county: "", address: "", note: "", taxId: "",
  });
  const [msg, setMsg] = useState(null);
  const [busy, setBusy] = useState(false);

  if (!cart.open) return null;

  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function pay() {
    if (cart.count === 0) return setMsg({ t: "err", m: "購物袋是空的。" });
    if (!f.name.trim() || !f.email.includes("@"))
      return setMsg({ t: "err", m: "姓名和 Email 都要填，開通通知才寄得到。" });

    // 只有實體商品才要地址；純數位訂單不逼人填
    if (cart.needsAddress) {
      if (!/^09\d{8}$/.test(f.phone.trim()))
        return setMsg({ t: "err", m: "手機請填 09 開頭的 10 碼數字。" });
      if (!f.county) return setMsg({ t: "err", m: "請選縣市。" });
      if (f.address.trim().length < 6) return setMsg({ t: "err", m: "地址太短了，再確認一下。" });
    }

    setBusy(true);
    setMsg(null);
    try {
      const res = await createOrder({
        items: [...cart.ids],
        bundle: cart.skillsFull ? SKILL_BUNDLE.id : null,
        amount: cart.total,
        shipping: cart.shipping,
        buyer: {
          name: f.name.trim(),
          email: f.email.trim(),
          taxId: f.taxId.trim() || null,
        },
        shippingTo: cart.needsAddress
          ? { phone: f.phone.trim(), county: f.county, address: f.address.trim(), note: f.note.trim() }
          : null,
      });

      if (res.demo) {
        setMsg({
          t: "ok",
          m: `預覽模式：訂單 ${res.orderNo} 已建立，金額 ${money(cart.total)}。接上後端之後這裡會轉往藍新金流付款頁。`,
        });
      } else if (res.formHtml) {
        // 後端回傳藍新的自動送出表單
        document.body.insertAdjacentHTML("beforeend", res.formHtml);
        document.getElementById("newebpay-form")?.submit();
      }
    } catch (e) {
      setMsg({ t: "err", m: e.message });
    }
    setBusy(false);
  }

  const shortOfFree =
    cart.needsAddress && cart.shipping > 0
      ? FREE_SHIPPING_OVER - cart.physical.reduce((a, b) => a + b.price, 0)
      : 0;

  return (
    <div className="scrim" onClick={(e) => e.target === e.currentTarget && cart.setOpen(false)}>
      <div className="drawer">
        <div className="drawer-hd">
          <h3>購物袋</h3>
          <button className="x" onClick={() => cart.setOpen(false)}>關閉</button>
        </div>

        {cart.count === 0 ? (
          <p className="empty">購物袋是空的。先挑一樣試試看。</p>
        ) : (
          <>
            {cart.items.map((p) => (
              <div className="line" key={p.id}>
                <span className="l-orb" style={{ background: p.tint }}>{p.emoji}</span>
                <span>{p.name}</span>
                <span className="l-amt">
                  {cart.skillsFull && p.kind === "digital" ? "—" : money(p.price)}
                </span>
                <button className="rm" onClick={() => cart.remove(p.id)}>移除</button>
              </div>
            ))}

            {cart.skillsFull && (
              <div className="line">
                <span className="l-orb" style={{ background: "var(--go)" }}>✦</span>
                <span>七顆全帶（省 NT$1,050）</span>
                <span className="l-amt">{money(SKILL_BUNDLE.price)}</span>
              </div>
            )}

            <div style={{ marginTop: 16 }}>
              <div className="sumrow"><span>小計</span><span>{money(cart.subtotal)}</span></div>
              {cart.needsAddress && (
                <div className="sumrow">
                  <span>運費</span>
                  <span>{cart.shipping === 0 ? "免運" : money(cart.shipping)}</span>
                </div>
              )}
              {shortOfFree > 0 && (
                <div className="sumrow" style={{ color: "var(--rose-d)" }}>
                  <span>再買 {money(shortOfFree)} 免運</span><span />
                </div>
              )}
              <div className="calc-total">
                <span style={{ fontSize: 13, color: "var(--ink2)" }}>合計</span>
                <span className="price">{money(cart.total)}</span>
              </div>
            </div>

            <div className="flabel">收件人姓名</div>
            <input className="field" value={f.name} onChange={set("name")} placeholder="王小明" />

            <div className="flabel">Email（開通與發票都寄這裡）</div>
            <input className="field" type="email" value={f.email} onChange={set("email")}
              placeholder="you@example.com" />

            {cart.needsAddress && (
              <>
                <div className="flabel">手機</div>
                <input className="field" inputMode="numeric" value={f.phone} onChange={set("phone")}
                  placeholder="0912345678" />

                <div className="flabel">縣市</div>
                <select className="field" value={f.county} onChange={set("county")}>
                  <option value="">請選擇</option>
                  {COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>

                <div className="flabel">地址</div>
                <input className="field" value={f.address} onChange={set("address")}
                  placeholder="區、路、段、號、樓" />

                <div className="flabel">配送備註（選填）</div>
                <textarea className="field" value={f.note} onChange={set("note")}
                  placeholder="例如：放管理室、平日白天沒人" />
              </>
            )}

            <div className="flabel">統一編號（要報帳再填）</div>
            <input className="field" inputMode="numeric" value={f.taxId} onChange={set("taxId")}
              placeholder="選填" />

            <button className="btn" onClick={pay} disabled={busy}>
              {busy ? "處理中⋯⋯" : "用藍新金流付款"}
            </button>

            {msg && <p className={"msg " + msg.t}>{msg.m}</p>}

            <p className="msg">
              {cart.needsAddress
                ? "實體商品 3–5 個工作天出貨。數位工具付款完成後立刻開通，用同一個 Email 登入工具台即可。"
                : "數位工具付款完成後立刻開通，用同一個 Email 登入工具台即可。"}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
