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

      {p.limit && (
        <div className="limit">
          <b>使用限制</b>
          <p>{p.limit}</p>
        </div>
      )}

      <div className="card-foot">
        <span className="price">{money(p.price)}</span>
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
