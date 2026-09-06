import { createContext, useContext, useMemo, useState, useCallback } from "react";
import { SKILL_BUNDLE, WAVE_1_IDS, SHIPPING_FEE, FREE_SHIPPING_OVER } from "../data/catalog";
import { byId, subCartId } from "./products";
import { validate as validateDiscountCode } from "./discountCodes";

const CartCtx = createContext(null);

export function CartProvider({ children }) {
  const [ids, setIds] = useState(() => new Set());
  const [open, setOpen] = useState(false);
  const [discount, setDiscount] = useState(null); // { code, percent } | null
  const [discountError, setDiscountError] = useState(null);
  const [discountChecking, setDiscountChecking] = useState(false);

  const toggle = useCallback((id) => {
    setIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  /** 訂閱跟一次性購買是同一顆工具的兩種不同商品，切換其中一種不會動到另一種 */
  const toggleSubscription = useCallback((skillId) => {
    setIds((prev) => {
      const next = new Set(prev);
      const subId = subCartId(skillId);
      next.has(subId) ? next.delete(subId) : next.add(subId);
      return next;
    });
  }, []);

  const remove = useCallback((id) => {
    setIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  }, []);

  const addAllSkills = useCallback(() => {
    setIds((prev) => new Set([...prev, ...WAVE_1_IDS]));
  }, []);

  const clear = useCallback(() => setIds(new Set()), []);

  /** 折扣碼只打在數位工具（skills）身上，不影響能量小物或訂閱 */
  const applyDiscountCode = useCallback(async (rawCode) => {
    if (!rawCode?.trim()) return;
    setDiscountChecking(true);
    setDiscountError(null);
    try {
      const result = await validateDiscountCode(rawCode);
      if (result.valid) {
        setDiscount({ code: rawCode.trim().toUpperCase(), percent: result.discountPercent });
      } else {
        setDiscount(null);
        setDiscountError("這組折扣碼不存在或已經用過了。");
      }
    } catch {
      setDiscount(null);
      setDiscountError("驗證失敗，稍後再試一次。");
    }
    setDiscountChecking(false);
  }, []);

  const removeDiscountCode = useCallback(() => {
    setDiscount(null);
    setDiscountError(null);
  }, []);

  const value = useMemo(() => {
    const items = [...ids].map(byId).filter(Boolean);
    const physical = items.filter((i) => i.kind === "physical");
    const digital = items.filter((i) => i.kind === "digital");
    const subscriptions = items.filter((i) => i.kind === "subscription");

    // Wave 1 的七顆到齊就自動套用套裝價，其他數位商品（含新上的 Wave 2）另外算原價
    const skillsFull = WAVE_1_IDS.every((id) => ids.has(id));
    const digitalTotal = skillsFull
      ? SKILL_BUNDLE.price + digital.filter((d) => !WAVE_1_IDS.includes(d.id))
          .reduce((a, b) => a + b.price, 0)
      : digital.reduce((a, b) => a + b.price, 0);

    // 折扣碼只打在數位工具上，套裝價也算在內，不影響能量小物或訂閱
    const discountAmount = discount ? Math.round(digitalTotal * (discount.percent / 100)) : 0;
    const discountedDigitalTotal = digitalTotal - discountAmount;

    // 訂閱不算進套裝、不佔判讀次數池，也不吃折扣碼，單獨用各自的月費計價
    const subscriptionTotal = subscriptions.reduce((a, b) => a + b.price, 0);

    const physicalTotal = physical.reduce((a, b) => a + b.price, 0);
    const subtotal = physicalTotal + discountedDigitalTotal + subscriptionTotal;
    // 給畫面「小計」那行用：商品原價加總，還沒扣折扣也還沒加運費。
    // 不能用 subtotal + discountAmount 反推，那樣跟上面的商品行對不起來。
    const itemsTotal = physicalTotal + digitalTotal + subscriptionTotal;

    // 只有實體商品要運費；純數位訂單不收
    const shipping =
      physical.length === 0 || physicalTotal >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FEE;

    return {
      ids, items, physical, digital, subscriptions, skillsFull,
      digitalTotal, itemsTotal, discountAmount, discount, discountError, discountChecking,
      subtotal, shipping, total: subtotal + shipping,
      needsAddress: physical.length > 0,
      count: items.length,
      has: (id) => ids.has(id),
      hasSubscription: (skillId) => ids.has(subCartId(skillId)),
      toggle, toggleSubscription, remove, addAllSkills, clear,
      applyDiscountCode, removeDiscountCode,
      open, setOpen,
    };
  }, [ids, open, discount, discountError, discountChecking, toggle, toggleSubscription,
      remove, addAllSkills, clear, applyDiscountCode, removeDiscountCode]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart 必須包在 CartProvider 裡");
  return ctx;
};

export const money = (n) => "NT$" + Math.round(n).toLocaleString("en-US");
