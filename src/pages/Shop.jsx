import { usePhysicalProducts } from "../lib/products";
import { CATEGORIES, DEFAULT_CATEGORY } from "../data/catalog";
import ProductCard from "../components/ProductCard";

/**
 * 實體商品頁。水晶跟能量選物共用這一支，靠 categoryKey 決定顯示哪一類，
 * 不用為每個分類各寫一頁——之後要再開分類，改 catalog.js 的 CATEGORIES 就好。
 */
export default function Shop({ categoryKey = DEFAULT_CATEGORY }) {
  const physical = usePhysicalProducts();
  const cat = CATEGORIES.find((c) => c.key === categoryKey) || CATEGORIES[0];

  // 舊資料沒有 category 欄位，一律當成預設分類，不會因為多了分類就消失
  const items = physical.filter((p) => (p.category || DEFAULT_CATEGORY) === categoryKey);

  return (
    <section>
      <span className="pill mint">{cat.en}</span>
      <h2 className="hover-en" data-en={cat.en}>
        <span>{cat.name}</span>
      </h2>
      <p className="sub">
        一件一件做的，數量不多。下單後 3–5 個工作天出貨，
        單筆實體商品滿 NT$2,000 免運。
      </p>

      {items.length === 0 ? (
        <p className="empty">這個分類還沒有商品。</p>
      ) : (
        <div className="pgrid">
          {items.map((p) => <ProductCard key={p.id} p={{ ...p, kind: "physical" }} />)}
        </div>
      )}

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
