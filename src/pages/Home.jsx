import { Link } from "react-router-dom";
import { useSkills } from "../lib/skillOverrides";
import { usePhysicalProducts } from "../lib/products";
import { CATEGORIES, WAVE_1_IDS, SKILL_BUNDLE } from "../data/catalog";
import { money } from "../lib/cart";
import ProductCard from "../components/ProductCard";

/**
 * 首頁的組合商品卡：七顆全帶，優先排在 AI 工具那列最前面。
 * 跟一般 ProductCard 不一樣的地方是雙價格——原價（單顆加總）劃線，
 * 底下才是套裝優惠價，讓客人一眼看出「這是折扣過的」。
 */
function BundleCard() {
  const singlePrice = WAVE_1_IDS.length * 850;
  return (
    <Link to="/skills" className="bundle-card">
      <div className="bc-tag">7 IN 1 · BUNDLE</div>
      <div className="bc-name">七顆全帶</div>
      <div className="bc-strike">{money(singlePrice)}</div>
      <div className="bc-price">{money(SKILL_BUNDLE.price)}</div>
    </Link>
  );
}

export default function Home() {
  const SKILLS = useSkills();
  const physical = usePhysicalProducts();

  const byCategory = (key) => physical.filter((p) => (p.category || "crystal") === key);

  return (
    <>
      <section className="hero hero-full">
        <div className="tag">AURAPLAYGROUND</div>
        <h1>
          手作的、和用得上的
          <em>水晶、能量選物，還有生活工具。都是為了讓明天好過一點。</em>
        </h1>
        <p>
          水晶與能量選物寄到你家，AI 工具買完打開就能用，手機電腦都可以。
          不用下載，也不用設定。
        </p>
        <div className="hero-cta">
          <Link to="/skills">看 AI 工具</Link>
          <Link to="/shop" className="ghost">看水晶</Link>
        </div>
      </section>

      {CATEGORIES.map((cat) => {
        const items = byCategory(cat.key).slice(0, 5);
        if (items.length === 0) return null;
        return (
          <section key={cat.key}>
            <span className="pill mint">{cat.en}</span>
            <h2 className="hover-en" data-en={cat.en}><span>{cat.name}</span></h2>
            <div className="hrow">
              {items.map((p) => <ProductCard key={p.id} p={{ ...p, kind: "physical" }} />)}
            </div>
            <p style={{ marginTop: 16 }}><Link to={cat.path}>看全部{cat.name} →</Link></p>
          </section>
        );
      })}

      <section>
        <span className="pill">AI Tools</span>
        <h2>生活工具</h2>
        <p className="sub">吃得清楚、話講得出口、大決定拆得開、錢花得清楚。</p>
        <div className="hrow">
          <BundleCard />
          {SKILLS.filter((s) => !WAVE_1_IDS.includes(s.id)).slice(0, 4).map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
        <p style={{ marginTop: 16 }}><Link to="/skills">看全部工具 →</Link></p>
      </section>
    </>
  );
}
