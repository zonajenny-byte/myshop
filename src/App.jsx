import { useEffect } from "react";
import { Link, NavLink, Route, Routes } from "react-router-dom";
import { CartProvider, useCart } from "./lib/cart";
import { fetchPhysical } from "./lib/products";
import CartDrawer from "./components/CartDrawer";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Skills from "./pages/Skills";
import Tools from "./pages/Tools";
import Admin from "./pages/Admin";

const TAGLINE = "每天進步一點，成為更好的自己";

function Header() {
  return (
    <header className="site-head">
      <div className="wrap head-in">
        <Link to="/" className="brandbox" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="brand">AURA<b>PLAYGROUND</b></div>
          <div className="tagline">{TAGLINE}</div>
        </Link>
        <nav>
          <NavLink to="/" end className={({ isActive }) => (isActive ? "on" : "")}>首頁</NavLink>
          <NavLink to="/shop" className={({ isActive }) => (isActive ? "on" : "")}>手作小物</NavLink>
          <NavLink to="/skills" className={({ isActive }) => (isActive ? "on" : "")}>AI 工具</NavLink>
          <NavLink to="/tools" className={({ isActive }) => (isActive ? "on" : "")}>工具台</NavLink>
        </nav>
      </div>
    </header>
  );
}

/** 全站統一：不管在哪一頁，購物袋都固定在右下角 */
function CartFab() {
  const { count, setOpen } = useCart();
  return (
    <button className="fab-cart" onClick={() => setOpen(true)} aria-label="購物袋">
      <span className="fab-ic">🛍</span>
      {count > 0 && <span className="fab-count">{count}</span>}
    </button>
  );
}

function Footer() {
  return (
    <footer>
      <div className="wrap">
        <div className="fbrand">{TAGLINE}</div>
        AuraPlayground × SuperStar．價格為新台幣含稅。<br />
        AI 工具為生活輔助用途，不提供醫療、營養、心理治療、法律或投資服務。<br />
        情緒持續影響生活時，安心專線 1925，24 小時。
      </div>
    </footer>
  );
}

export default function App() {
  // 一開始就把手作小物清單拉進來，購物袋才能正確解析商品 ID，
  // 不用等到 Home 或 Shop 頁面先渲染過一次。
  useEffect(() => { fetchPhysical(); }, []);

  return (
    <CartProvider>
      <Header />
      <main className="wrap">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
      <CartFab />
      <CartDrawer />
    </CartProvider>
  );
}
