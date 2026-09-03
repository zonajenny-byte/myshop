import { Link } from "react-router-dom";
import { SKILLS } from "../data/catalog";
import { usePhysicalProducts } from "../lib/products";
import ProductCard from "../components/ProductCard";

export default function Home() {
  const physical = usePhysicalProducts();
  return (
    <>
      <section className="hero">
        <div className="tag">AURAPLAYGROUND</div>
        <h1>
          手作的、和用得上的
          <em>三樣小物，七顆工具。都是為了讓明天好過一點。</em>
        </h1>
        <p>
          能量小物寄到你家，AI 工具買完打開就能用，手機電腦都可以。
          不用下載，也不用設定。
        </p>
        <div className="hero-cta">
          <Link to="/skills">看七顆工具</Link>
          <Link to="/shop" className="ghost">看能量小物</Link>
        </div>
      </section>

      <section>
        <span className="pill mint">Handmade</span>
        <h2>能量小物</h2>
        <p className="sub">一件一件做的，數量不多。</p>
        <div className="pgrid">
          {physical.slice(0, 2).map((p) => <ProductCard key={p.id} p={{ ...p, kind: "physical" }} />)}
        </div>
        <p style={{ marginTop: 16 }}><Link to="/shop">看全部能量小物 →</Link></p>
      </section>

      <section>
        <span className="pill">AI Tools</span>
        <h2>七顆生活工具</h2>
        <p className="sub">吃得清楚、話講得出口、大決定拆得開、錢花得清楚。</p>
        <div className="pgrid">
          {SKILLS.slice(0, 2).map((p) => <ProductCard key={p.id} p={p} />)}
        </div>
        <p style={{ marginTop: 16 }}><Link to="/skills">看全部七顆 →</Link></p>
      </section>
    </>
  );
}
