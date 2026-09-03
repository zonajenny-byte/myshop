import { useEffect, useState } from "react";
import { Link, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { CartProvider, useCart } from "./lib/cart";
import { fetchPhysical } from "./lib/products";
import CartDrawer from "./components/CartDrawer";
import AnnouncementModal from "./components/AnnouncementModal";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Skills from "./pages/Skills";
import Tools from "./pages/Tools";
import Admin from "./pages/Admin";
import ProductDetail from "./pages/ProductDetail";
import SkillDetail from "./pages/SkillDetail";

const TAGLINE = "每天進步一點，成為更好的自己";
const NAV = [
  ["/", "首頁", true],
  ["/shop", "能量小物", false],
  ["/skills", "AI 工具", false],
  ["/tools", "工具台", false],
];

function Header({ onMenu }) {
  return (
    <header className="site-head">
      <div className="wrap head-in">
        {/* 手機版才顯示的漢堡按鈕，桌機用下面的橫向 nav */}
        <button className="hamburger" onClick={onMenu} aria-label="開啟選單">
          <span /><span /><span />
        </button>

        <Link to="/" className="brandbox" style={{ textDecoration: "none", color: "inherit" }}>
          <div className="brand">AURA<b>PLAYGROUND</b></div>
          <div className="tagline">{TAGLINE}</div>
        </Link>

        <nav className="nav-desktop">
          {NAV.map(([to, label, end]) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => (isActive ? "on" : "")}>{label}</NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}

/** 手機版側邊選單，從左邊滑出（參考一般購物網站的做法） */
function MobileMenu({ open, onClose }) {
  const { count, setOpen: setCartOpen } = useCart();
  if (!open) return null;

  return (
    <div className="menu-scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <nav className="menu-panel">
        <div className="menu-head">
          <span className="brand" style={{ fontSize: 18 }}>AURA<b>PLAYGROUND</b></span>
          <button className="x" onClick={onClose} aria-label="關閉選單">✕</button>
        </div>

        <div className="menu-sect">選單</div>
        {NAV.map(([to, label, end]) => (
          <NavLink key={to} to={to} end={end} onClick={onClose}
            className={({ isActive }) => "menu-item" + (isActive ? " on" : "")}>
            {label}
          </NavLink>
        ))}

        <div className="menu-sect">我的</div>
        <button className="menu-item" onClick={() => { onClose(); setCartOpen(true); }}>
          購物袋{count > 0 ? `（${count}）` : ""}
        </button>
        <NavLink to="/tools" onClick={onClose} className="menu-item">我買的工具</NavLink>
      </nav>
    </div>
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

/** 公告只在首頁跳，其他頁面不打擾 */
function HomeAnnouncement() {
  const { pathname } = useLocation();
  if (pathname !== "/") return null;
  return <AnnouncementModal />;
}

export default function App() {
  const [menuOpen, setMenuOpen] = useState(false);

  // 一開始就把能量小物清單拉進來，購物袋才能正確解析商品 ID，
  // 不用等到 Home 或 Shop 頁面先渲染過一次。
  useEffect(() => { fetchPhysical(); }, []);

  return (
    <CartProvider>
      <Header onMenu={() => setMenuOpen(true)} />
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
      <main className="wrap">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/skills" element={<Skills />} />
          <Route path="/tools" element={<Tools />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/skill/:toolKey" element={<SkillDetail />} />
          <Route path="*" element={<Home />} />
        </Routes>
      </main>
      <Footer />
      <CartFab />
      <CartDrawer />
      <HomeAnnouncement />
    </CartProvider>
  );
}
