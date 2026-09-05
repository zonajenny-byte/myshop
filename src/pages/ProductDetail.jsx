import { Link, useParams } from "react-router-dom";
import { usePhysicalProducts, resolveImageUrl } from "../lib/products";
import { CATEGORIES, DEFAULT_CATEGORY } from "../data/catalog";
import { useCart, money } from "../lib/cart";

export default function ProductDetail() {
  const { id } = useParams();
  const products = usePhysicalProducts();
  const p = products.find((x) => x.id === id);
  const { has, toggle } = useCart();

  if (!p) {
    return (
      <section>
        <Link to="/shop" className="back" style={{ display: "inline-block" }}>‹ 回商品列表</Link>
        <p className="empty">找不到這個商品，可能已經下架了。</p>
      </section>
    );
  }

  const inCart = has(p.id);
  const soldOut = p.stock === 0;
  const photo = resolveImageUrl(p.image);
  // 從哪個分類進來就回哪個分類，不要一律丟回水晶頁
  const cat = CATEGORIES.find((c) => c.key === (p.category || DEFAULT_CATEGORY)) || CATEGORIES[0];

  return (
    <>
      <Link to={cat.path} className="back" style={{ display: "inline-block" }}>‹ 回{cat.name}</Link>

      <section style={{ paddingTop: 8 }}>
        <div className="detail-hero">
          <div className="detail-img" style={{ background: p.tint }}>
            {photo
              ? <img src={photo} alt={p.name} />
              : <span style={{ fontSize: 72 }}>{p.emoji}</span>}
          </div>
          <div className="detail-info">
            <div className="id">{p.id}</div>
            <h2 style={{ margin: "6px 0 4px" }}>{p.name}</h2>
            <div className="en">{(p.en || "").toUpperCase()}</div>
            <p className="blurb" style={{ marginTop: 14 }}>{p.blurb}</p>
            <div className="price" style={{ marginTop: 18 }}>{money(p.price)}</div>
            <button className="btn" onClick={() => toggle(p.id)} disabled={soldOut}>
              {soldOut ? "已售完" : inCart ? "✓ 已加入購物袋" : "加入購物袋"}
            </button>
          </div>
        </div>

        {p.spec?.length > 0 && (
          <div className="card" style={{ marginTop: 24 }}>
            <div className="eyebrow" style={{ marginBottom: 10 }}>規格</div>
            <div className="spec">
              {p.spec.map(([k, v]) => (
                <div key={k}><span>{k}</span><span>{v}</span></div>
              ))}
            </div>
          </div>
        )}

        <div className="notes" style={{ marginTop: 20 }}>
          <div className="note">
            <h4><span className="num">S01</span>出貨與運送</h4>
            <p>下單後 3–5 個工作天出貨，寄出後會寄物流單號給你。本島運費 NT$80，滿 NT$2,000 免運。</p>
          </div>
          <div className="note">
            <h4><span className="num">S02</span>手作品的差異</h4>
            <p>天然石材與手工串製，每一件的紋理與色澤都會有些不同，那不是瑕疵。</p>
          </div>
        </div>
      </section>
    </>
  );
}
