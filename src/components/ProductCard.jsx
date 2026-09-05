import { Link } from "react-router-dom";
import { useCart } from "../lib/cart";
import { resolveImageUrl } from "../lib/products";

/**
 * 瀏覽用的商品卡：圖、名稱、價格，右下角一個線條購物車鈕。
 *
 * 有第二張圖的商品，滑鼠移上去會淡入換成第二張；沒有的話就維持原圖，
 * 不會因為缺圖就變成空白。
 *
 * 整張卡是連結，購物車鈕另外擋掉冒泡，避免想加入購物袋卻被導走。
 */
export default function ProductCard({ p }) {
  const { has, toggle } = useCart();
  const inCart = has(p.id);
  const soldOut = p.kind === "physical" && p.stock === 0;
  const photo = resolveImageUrl(p.image);
  const photo2 = resolveImageUrl(p.image2);
  const href = p.kind === "physical" ? `/product/${p.id}` : `/skill/${p.toolKey}`;

  function onAdd(e) {
    e.preventDefault();
    e.stopPropagation();
    toggle(p.id);
  }

  return (
    <Link to={href} className={"pcard" + (inCart ? " in" : "")}>
      <div className="pcard-img" style={{ background: p.tint }}>
        {photo ? (
          <>
            <img className="pcard-photo" src={photo} alt={p.name} loading="lazy" />
            {photo2 && (
              <img className="pcard-photo pcard-photo-alt" src={photo2} alt="" loading="lazy" aria-hidden="true" />
            )}
          </>
        ) : (
          <span className="pcard-emoji">{p.emoji}</span>
        )}
      </div>

      <div className="pcard-body">
        <div className="pcard-text">
          <h3 className="pcard-name">{p.name}</h3>
          <div className="pcard-price">
            NT.{Math.round(p.price).toLocaleString("en-US")}
            {p.subscription && (
              <span className="pcard-sub">或 NT.{p.subscription.price}/{p.subscription.periodLabel}</span>
            )}
          </div>
        </div>

        <button
          className={"pcard-cart" + (inCart ? " on" : "")}
          onClick={onAdd}
          disabled={soldOut}
          aria-label={soldOut ? "已售完" : inCart ? "已在購物袋" : `把 ${p.name} 加入購物袋`}
          title={soldOut ? "已售完" : inCart ? "已在購物袋" : "加入購物袋"}
        >
          {inCart ? (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 12.5 L9 17.5 L20 6.5" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4"
              strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M2.5 3.5h2.2l2.4 11.2a1.8 1.8 0 0 0 1.76 1.4h8.3a1.8 1.8 0 0 0 1.76-1.38l1.68-7.2H6.1" />
              <circle cx="9.5" cy="20" r="1.4" />
              <circle cx="17.5" cy="20" r="1.4" />
            </svg>
          )}
        </button>
      </div>
    </Link>
  );
}
