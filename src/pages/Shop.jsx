import { usePhysicalProducts } from "../lib/products";
import ProductCard from "../components/ProductCard";

export default function Shop() {
  const physical = usePhysicalProducts();
  return (
    <section>
      <span className="pill mint">Handmade</span>
      <h2>能量小物</h2>
      <p className="sub">
        一件一件做的，數量不多。下單後 3–5 個工作天出貨，
        單筆實體商品滿 NT$2,000 免運。
      </p>
      <div className="pgrid">
        {physical.map((p) => <ProductCard key={p.id} p={{ ...p, kind: "physical" }} />)}
      </div>

      <div className="notes" style={{ marginTop: 26 }}>
        <div className="note">
          <h4><span className="num">S01</span>出貨與運送</h4>
          <p>下單後 3–5 個工作天出貨，寄出後會寄物流單號給你。本島運費 NT$80，滿 NT$2,000 免運。</p>
        </div>
        <div className="note">
          <h4><span className="num">S02</span>手作品的差異</h4>
          <p>天然石材與手工串製，每一件的紋理與色澤都會有些不同，那不是瑕疵。</p>
        </div>
        <div className="note">
          <h4><span className="num">S03</span>退換貨</h4>
          <p>收到後七天內可退換，商品需保持完整未使用。客製品與已使用的淨化類商品不適用。</p>
        </div>
        <div className="note warn">
          <h4><span className="num">S04</span>使用安全</h4>
          <p>淨化類商品點燃時務必保持通風、使用耐熱容器，並遠離兒童與寵物。這些是生活用品，不具醫療效果。</p>
        </div>
      </div>
    </section>
  );
}
