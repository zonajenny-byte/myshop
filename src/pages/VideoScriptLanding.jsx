import { Link } from "react-router-dom";
import { SKILLS } from "../data/catalog";
import { useCart, money } from "../lib/cart";

const SKILL_ID = "AP-SL-22";

export default function VideoScriptLanding() {
  const skill = SKILLS.find((s) => s.id === SKILL_ID);
  const { has, toggle, hasSubscription, toggleSubscription } = useCart();

  if (!skill) return null;

  const owned = has(skill.id);
  const subscribed = hasSubscription(skill.id);
  const d = skill.detail;

  return (
    <>
      <Link to="/skills" className="back" style={{ display: "inline-block" }}>‹ 回 AI 工具</Link>

      {/* ---- Hero：鉤子 + 兩個購買按鈕放最前面 ---- */}
      <section className="hero" style={{ marginTop: 8 }}>
        <div className="tag">{skill.id} · AI SKILL</div>
        <h1>
          {skill.name}
          <em>{d.hook}</em>
        </h1>
        <p>{skill.blurb}</p>

        <div className="hero-cta">
          <a onClick={() => toggle(skill.id)}>
            {owned ? "✓ 已加入 · 一次性 " + money(skill.price) : `一次性購買 ${money(skill.price)}`}
          </a>
          <a className="ghost" onClick={() => toggleSubscription(skill.id)}>
            {subscribed
              ? `✓ 已加入 · 訂閱 ${money(skill.subscription.price)}/${skill.subscription.periodLabel}`
              : `訂閱方案 ${money(skill.subscription.price)}/${skill.subscription.periodLabel}`}
          </a>
        </div>
      </section>

      {/* ---- 兩種方案比較 ---- */}
      <section>
        <span className="pill">怎麼選</span>
        <h2>兩種買法</h2>
        <p className="sub">偶爾用用選一次性，常態需要拍片選訂閱。</p>
        <div className="grid">
          <article className={"card" + (owned ? " in" : "")}>
            <div className="card-top">
              <div className="orb" style={{ background: skill.tint }}>💳</div>
              <div>
                <div className="id">一次性</div>
                <h3>單次購買</h3>
              </div>
            </div>
            <p className="blurb">
              跟其他工具共用同一個 300 次判讀池——如果你手上已經有其他工具，這顆用得少的話這樣比較划算。
            </p>
            <div className="card-foot">
              <span className="price">{money(skill.price)}</span>
              <button className={"add" + (owned ? " on" : "")} onClick={() => toggle(skill.id)}>
                {owned ? "✓ 已加入" : "加入"}
              </button>
            </div>
          </article>

          <article className={"card" + (subscribed ? " in" : "")}>
            <div className="card-top">
              <div className="orb" style={{ background: skill.tint }}>♾️</div>
              <div>
                <div className="id">訂閱</div>
                <h3>不限次數</h3>
              </div>
            </div>
            <p className="blurb">{skill.subscription.pitch}</p>
            <div className="card-foot">
              <span className="price">{money(skill.subscription.price)}<span style={{ fontSize: 13, color: "var(--ink2)" }}>/{skill.subscription.periodLabel}</span></span>
              <button className={"add" + (subscribed ? " on" : "")} onClick={() => toggleSubscription(skill.id)}>
                {subscribed ? "✓ 已加入" : "訂閱"}
              </button>
            </div>
          </article>
        </div>
        <p className="msg" style={{ marginTop: 4 }}>
          目前訂閱是「付一次、開通一個月」，還沒有接自動每月扣款——月底前這裡會清楚提醒你要不要續訂，不會不明不白扣錢。
        </p>
      </section>

      {/* ---- 深度功能介紹 ---- */}
      <section>
        <span className="pill mint">怎麼運作</span>
        <h2>三件事，決定一支短片能不能留住人</h2>
        <p className="sub">{d.story}</p>
        <div className="notes">
          {d.sections.map((s, i) => (
            <div className="note" key={i}>
              <h4><span className="num">{String(i + 1).padStart(2, "0")}</span>{s.title}</h4>
              <p>{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- 適合誰 ---- */}
      <section>
        <span className="pill">適合你嗎</span>
        <h2>這顆特別適合</h2>
        <div className="card">
          {d.forWho.map((f, i) => (
            <div className="item" key={i}>
              <div className="n">✓ {f}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- 界線 ---- */}
      <section>
        <div className="limit">
          <b>使用限制</b>
          <p>{skill.limit}</p>
        </div>
      </section>

      {/* ---- 底部再一次 CTA ---- */}
      <section>
        <div className="kit">
          <div className="k-id">{skill.id}</div>
          <h3>{skill.name}</h3>
          <p>選一個方案，馬上開始寫下一支影片的腳本。</p>
          <button className="add" onClick={() => toggle(skill.id)} style={{ width: "100%", marginTop: 16, textAlign: "center" }}>
            {owned ? "✓ 已在購物袋裡" : `一次性購買 ${money(skill.price)}`}
          </button>
        </div>
      </section>
    </>
  );
}
