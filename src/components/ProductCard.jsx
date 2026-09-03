import { Link } from "react-router-dom";
import { useCart, money } from "../lib/cart";
import { resolveImageUrl } from "../lib/products";

/**
 * 瀏覽用的商品卡：只有圖、名稱、價格。
 * 功能說明、規格、使用限制都移到商品詳細頁，不塞在卡片裡——
 * 兩欄並排時卡片寬度只有一半，塞太多字會擠成一團。
 *
 * 整張卡是連結，點任何地方都會進詳細頁；「加入」按鈕另外處理，
 * 避免想加入購物袋卻被導走。
 */
export default function ProductCard({ p }) {
  const { has, toggle } = useCart();
  const inCart = has(p.id);
  const soldOut = p.kind === "physical" && p.stock === 0;
  const photo = resolveImageUrl(p.image);
  const href = p.kind === "physical" ? `/product/${p.id}` : `/skill/${p.toolKey}`;

  function onAdd(e) {
    // 卡片本身是連結，按鈕要擋掉冒泡，不然按加入會跟著跳頁
    e.preventDefault();
    e.stopPropagation();
    toggle(p.id);
  }

  return (
    <Link to={href} className={"pcard" + (inCart ? " in" : "")}>
      <div className="pcard-img" style={{ background: p.tint }}>
        {photo
          ? <img src={photo} alt={p.name} loading="lazy" />
          : <span className="pcard-emoji">{p.emoji}</span>}
      </div>

      <div className="pcard-body">
        <h3 className="pcard-name">{p.name}</h3>
        <div className="pcard-price">
          NT.{Math.round(p.price).toLocaleString("en-US")}
          {p.subscription && (
            <span className="pcard-sub">或 {money(p.subscription.price)}/{p.subscription.periodLabel}</span>
          )}
        </div>
        <button
          className={"pcard-add" + (inCart ? " on" : "")}
          onClick={onAdd}
          disabled={soldOut}
        >
          {soldOut ? "已售完" : inCart ? "✓ 已加入" : "加入"}
        </button>
      </div>
    </Link>
  );
}
