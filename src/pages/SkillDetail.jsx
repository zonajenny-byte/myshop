import { Link, useParams } from "react-router-dom";
import { SKILLS } from "../data/catalog";
import { useCart, money } from "../lib/cart";

/**
 * 所有 AI 工具共用的詳細頁。
 * 有 detail 欄位的（目前只有自媒體爆款短片生成器）會多出深度介紹區塊跟訂閱方案，
 * 沒有的就只顯示基本的功能重點與使用限制——不用為每顆工具各寫一頁。
 */
export default function SkillDetail() {
  const { toolKey } = useParams();
  const skill = SKILLS.find((s) => s.toolKey === toolKey);
  const { has, toggle, hasSubscription, toggleSubscription } = useCart();

  if (!skill) {
    return (
      <section>
        <Link to="/skills" className="back" style={{ display: "inline-block" }}>‹ 回 AI 工具</Link>
        <p className="empty">找不到這顆工具。</p>
      </section>
    );
  }

  const owned = has(skill.id);
  const subscribed = skill.subscription && hasSubscription(skill.id);
  const d = skill.detail;

  return (
    <>
      <Link to="/skills" className="back" style={{ display: "inline-block" }}>‹ 回 AI 工具</Link>

      <section className="hero" style={{ marginTop: 8 }}>
        <div className="tag">{skill.id} · AI SKILL</div>
        <h1>
          {skill.name}
          <em>{d?.hook || skill.blurb}</em>
        </h1>
        {d && <p>{skill.blurb}</p>}

        <div className="hero-cta">
          <a onClick={() => toggle(skill.id)}>
            {owned ? `✓ 已加入 · ${money(skill.price)}` : `購買 ${money(skill.price)}`}
          </a>
          {skill.subscription && (
            <a className="ghost" onClick={() => toggleSubscription(skill.id)}>
              {subscribed
                ? `✓ 已加入 · 訂閱 ${money(skill.subscription.price)}/${skill.subscription.periodLabel}`
                : `訂閱方案 ${money(skill.subscription.price)}/${skill.subscription.periodLabel}`}
            </a>
          )}
        </div>
      </section>

      {skill.feat?.length > 0 && (
        <section>
          <span className="pill">功能重點</span>
          <h2>這顆工具會做什麼</h2>
          <div className="card">
            {skill.feat.map((f) => (
              <div className="item" key={f}><div className="n">✓ {f}</div></div>
            ))}
          </div>
        </section>
      )}

      {/* 只有寫了 detail 的工具才有這幾段深度介紹 */}
      {d?.sections?.length > 0 && (
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
      )}

      {d?.forWho?.length > 0 && (
        <section>
          <span className="pill">適合你嗎</span>
          <h2>這顆特別適合</h2>
          <div className="card">
            {d.forWho.map((f, i) => (
              <div className="item" key={i}><div className="n">✓ {f}</div></div>
            ))}
          </div>
        </section>
      )}

      {skill.subscription && (
        <section>
          <span className="pill">怎麼選</span>
          <h2>兩種買法</h2>
          <p className="sub">偶爾用用選一次性，常態需要拍片選訂閱。</p>
          <div className="grid">
            <article className={"card" + (owned ? " in" : "")}>
              <div className="card-top">
                <div className="orb" style={{ background: skill.tint }}>💳</div>
                <div><div className="id">一次性</div><h3>單次購買</h3></div>
              </div>
              <p className="blurb">跟其他工具共用同一個 300 次判讀池。</p>
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
                <div><div className="id">訂閱</div><h3>不限次數</h3></div>
              </div>
              <p className="blurb">{skill.subscription.pitch}</p>
              <div className="card-foot">
                <span className="price">
                  {money(skill.subscription.price)}
                  <span style={{ fontSize: 13, color: "var(--ink2)" }}>/{skill.subscription.periodLabel}</span>
                </span>
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
      )}

      <section>
        <div className="limit">
          <b>使用限制</b>
          <p>{skill.limit}</p>
        </div>
        <p className="disc">
          買完登入<Link to="/tools">工具台</Link>就能用。一個瀏覽器就好，手機、平板、電腦都可以。
        </p>
      </section>
    </>
  );
}
