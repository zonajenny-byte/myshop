import { createContext, useContext, useMemo, useState, useCallback } from "react";
import { SKILLS, SKILL_BUNDLE, SHIPPING_FEE, FREE_SHIPPING_OVER } from "../data/catalog";
import { byId } from "./products";

const CartCtx = createContext(null);

export function CartProvider({ children }) {
  const [ids, setIds] = useState(() => new Set());
  const [open, setOpen] = useState(false);

  const toggle = useCallback((id) => {
    setIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const remove = useCallback((id) => {
    setIds((prev) => { const n = new Set(prev); n.delete(id); return n; });
  }, []);

  const addAllSkills = useCallback(() => {
    setIds((prev) => new Set([...prev, ...SKILLS.map((s) => s.id)]));
  }, []);

  const clear = useCallback(() => setIds(new Set()), []);

  const value = useMemo(() => {
    const items = [...ids].map(byId).filter(Boolean);
    const physical = items.filter((i) => i.kind === "physical");
    const digital = items.filter((i) => i.kind === "digital");

    // 七顆到齊就自動套用套裝價，不用另外加購物車
    const skillsFull = SKILLS.every((s) => ids.has(s.id));
    const digitalTotal = skillsFull
      ? SKILL_BUNDLE.price + digital.filter((d) => !SKILLS.some((s) => s.id === d.id))
          .reduce((a, b) => a + b.price, 0)
      : digital.reduce((a, b) => a + b.price, 0);

    const physicalTotal = physical.reduce((a, b) => a + b.price, 0);
    const subtotal = physicalTotal + digitalTotal;

    // 只有實體商品要運費；純數位訂單不收
    const shipping =
      physical.length === 0 || physicalTotal >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FEE;

    return {
      ids, items, physical, digital, skillsFull,
      subtotal, shipping, total: subtotal + shipping,
      needsAddress: physical.length > 0,
      count: items.length,
      has: (id) => ids.has(id),
      toggle, remove, addAllSkills, clear,
      open, setOpen,
    };
  }, [ids, open, toggle, remove, addAllSkills, clear]);

  return <CartCtx.Provider value={value}>{children}</CartCtx.Provider>;
}

export const useCart = () => {
  const ctx = useContext(CartCtx);
  if (!ctx) throw new Error("useCart 必須包在 CartProvider 裡");
  return ctx;
};

export const money = (n) => "NT$" + Math.round(n).toLocaleString("en-US");
