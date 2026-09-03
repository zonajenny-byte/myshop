import { useState } from "react";
import { Link } from "react-router-dom";
import { SKILLS, SKILL_BUNDLE, WAVE_1_IDS, COMING_SOON } from "../data/catalog";
import ProductCard from "../components/ProductCard";
import { useCart, money } from "../lib/cart";
import { notifyMe } from "../lib/api";

export default function Skills() {
  const { addAllSkills, skillsFull } = useCart();
  const [notified, setNotified] = useState({});

  async function onNotify(name) {
    const email = prompt("做好之後通知你，Email 填一下：");
    if (!email || !email.includes("@")) return;
    try {
      await notifyMe(email, name);
      setNotified((n) => ({ ...n, [name]: true }));
    } catch {
      alert("送出失敗，晚點再試一次。");
    }
  }

  const wave1 = SKILLS.filter((s) => WAVE_1_IDS.includes(s.id));
  const wave2 = SKILLS.filter((s) => !WAVE_1_IDS.includes(s.id));
  const single = wave1.length * 850;

  return (
    <>
      <section>
        <span className="pill">Wave 1 · Available Now</span>
        <h2>七顆生活工具</h2>
        <p className="sub">
          七顆都能在<Link to="/tools">工具台</Link>直接用。
          網頁版手機電腦都支援，不需要下載或安裝任何東西。
        </p>
        <div className="pgrid">
          {wave1.map((p) => <ProductCard key={p.id} p={p} />)}
        </div>

        <div className="kit">
          <div className="k-id">{SKILL_BUNDLE.id} · 7 IN 1</div>
          <h3>七顆全帶</h3>
          <p>附一份 30 天使用節奏表。不用七顆同時開始，一週開一顆，讓它們自己長進生活裡。</p>
          <ul className="kitlist">
            {wave1.map((s) => (
              <li key={s.id}><span>{s.emoji}</span><span>{s.name}</span></li>
            ))}
          </ul>
          <div className="calc">
            <div className="calc-row strike"><span>單顆 × 7</span><span>{money(single)}</span></div>
            <div className="calc-row"><span>套裝折扣</span><span>−{money(single - SKILL_BUNDLE.price)}</span></div>
            <div className="calc-row save"><span>省下</span><span>17.6%</span></div>
            <div className="calc-total">
              <span style={{ fontSize: 13, color: "var(--ink2)" }}>套裝價</span>
              <span className="price">{money(SKILL_BUNDLE.price)}</span>
            </div>
          </div>
          <button className="add" onClick={addAllSkills} disabled={skillsFull}>
            {skillsFull ? "✓ 七顆都在購物袋裡了" : "七顆全部加入"}
          </button>
        </div>
      </section>

      {wave2.length > 0 && (
        <section>
          <span className="pill mint">Wave 2 · Available Now</span>
          <h2>新上的幾顆</h2>
          <p className="sub">單顆買，還沒有套裝價。跟七顆共用同一個判讀次數池。</p>
          <div className="pgrid">
            {wave2.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      <section>
        <span className="pill mint">In Progress</span>
        <h2>還在做</h2>
        <p className="sub">寧可做好再上，也不要一次推一堆做一半的。做好會通知你，上線當天有早鳥價。</p>
        <div className="soon-grid">
          {COMING_SOON.map(([name, desc, icon]) => (
            <div className="soon" key={name}>
              <div className="orb">{icon}</div>
              <div className="soon-txt">
                <div className="soon-name">{name}</div>
                <div className="soon-desc">{desc}</div>
              </div>
              <button
                className={"soon-btn" + (notified[name] ? " done" : "")}
                onClick={() => !notified[name] && onNotify(name)}
                disabled={!!notified[name]}
              >
                {notified[name] ? "✓ 會通知你" : "通知我"}
              </button>
            </div>
          ))}
        </div>
      </section>

      <section>
        <span className="pill">Before You Buy</span>
        <h2>購買前先看這幾條</h2>
        <p className="sub">這幾條寫清楚對你我都好。</p>
        <div className="notes">
          <div className="note">
            <h4><span className="num">N01</span>買到的是什麼</h4>
            <p>可以直接使用的工具，不是一份檔案。買完登入<Link to="/tools">工具台</Link>就能用。</p>
          </div>
          <div className="note">
            <h4><span className="num">N02</span>需要什麼環境</h4>
            <p>一個瀏覽器就好，手機、平板、電腦都可以。不需要 Claude 帳號。</p>
          </div>
          <div className="note warn">
            <h4><span className="num">N03</span>兩顆判讀標示的界線</h4>
            <p>食安與保養品判讀的是包裝標示與公開資料，<b>不是實驗室檢驗</b>，無法驗出殘留、污染或標示不實，也不是皮膚科診斷。懷疑食品有問題可撥 1919；皮膚持續出狀況請看皮膚科。</p>
          </div>
          <div className="note warn">
            <h4><span className="num">N04</span>三顆陪你想事情的界線</h4>
            <p>難開口的對話不處理涉及暴力、控制或讓你感到恐懼的關係，那類請撥 113。下班的緩衝是日常收尾工具，不是心理治療。大決定拆解不提供法律、稅務或投資建議。</p>
          </div>
          <div className="note warn">
            <h4><span className="num">N05</span>買房這顆做得到什麼</h4>
            <p>只做負擔能力試算與資訊整理。<b>不預測房價、不評估增值、不出具法律意見。</b>稅費為粗估，簽約前請地政士試算。</p>
          </div>
          <div className="note warn">
            <h4><span className="num">N06</span>新上幾顆的界線</h4>
            <p>送禮與人情只給一般行情參考，不是特定習俗的正式規範。個人風格規劃不做身形或外貌評論。人生商學院不是財務顧問、律師或會計師，公司登記、稅務、合約請找專業。爆款短片生成器不保證流量或觸及，平台演算法一直在變。</p>
          </div>
          <div className="note">
            <h4><span className="num">N07</span>資料放在哪</h4>
            <p>忌口清單、等待清單、對話紀錄都留在你自己的裝置上。上傳的照片只用於當次判讀，不會存下來訓練任何東西。</p>
          </div>
          <div className="note">
            <h4><span className="num">N08</span>使用次數</h4>
            <p>買任一顆附 300 次判讀，所有已買的工具共用同一個池，不會過期。用完可以加購，不強制訂閱。</p>
          </div>
          <div className="note">
            <h4><span className="num">N09</span>更新與退款</h4>
            <p>工具持續更新，用到的永遠是新版。數位商品開通後不接受退款，下單前請確認符合 N02。</p>
          </div>
        </div>
      </section>
    </>
  );
}
