import { Link } from "react-router-dom";
import { useCart, money } from "../lib/cart";
import { resolveImageUrl } from "../lib/products";

/** 實體與數位共用同一張卡，差別只在顯示的欄位 */
export default function ProductCard({ p }) {
  const { has, toggle } = useCart();
  const inCart = has(p.id);
  const soldOut = p.kind === "physical" && p.stock === 0;
  const photo = resolveImageUrl(p.image);

  return (
    <article className={"card" + (inCart ? " in" : "")}>
      {photo ? (
        <img className="card-photo" src={photo} alt={p.name} loading="lazy" />
      ) : null}

      <div className="card-top">
        {!photo && <div className="orb" style={{ background: p.tint }}>{p.emoji}</div>}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="id">{p.id}</div>
          <h3>{p.name}</h3>
          <div className="en">{p.en?.toUpperCase()}</div>
        </div>
      </div>

      <p className="blurb">{p.blurb}</p>

      {p.feat && (
        <ul className="feat">
          {p.feat.map((f) => <li key={f}>{f}</li>)}
        </ul>
      )}

      {p.spec && (
        <div className="spec">
          {p.spec.map(([k, v]) => (
            <div key={k}><span>{k}</span><span>{v}</span></div>
          ))}
        </div>
      )}

      {/* 有 detail 內容的商品才有專屬頁面，目前只有自媒體爆款短片生成器 */}
      {p.detail && (
        <Link to={`/skill/${p.toolKey}`} style={{ fontSize: 13, marginTop: 12, display: "inline-block" }}>
          看完整介紹與訂閱方案 →
        </Link>
      )}

      {p.limit && (
        <div className="limit">
          <b>使用限制</b>
          <p>{p.limit}</p>
        </div>
      )}

      <div className="card-foot">
        <span className="price">
          {money(p.price)}
          {p.subscription && (
            <span style={{ fontSize: 11, color: "var(--ink2)", fontWeight: 400, marginLeft: 6 }}>
              或 {money(p.subscription.price)}/{p.subscription.periodLabel}
            </span>
          )}
        </span>
        <button
          className={"add" + (inCart ? " on" : "")}
          onClick={() => toggle(p.id)}
          disabled={soldOut}
        >
          {soldOut ? "已售完" : inCart ? "✓ 已加入" : "加入"}
        </button>
      </div>
    </article>
  );
}
