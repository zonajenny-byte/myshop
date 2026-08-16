import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { SKILLS } from "../data/catalog";
import { DEMO, token, sendMagicLink, fetchEntitlements } from "../lib/api";
import ToolRunner from "../tools/ToolRunner";

export default function Tools() {
  const [signedIn, setSignedIn] = useState(!!token.get());
  const [email, setEmail] = useState(localStorage.getItem("ap.email") || "");
  const [sent, setSent] = useState(false);
  const [owned, setOwned] = useState([]);
  const [credits, setCredits] = useState(null);
  const [active, setActive] = useState(null);
  const [err, setErr] = useState(null);

  // 信件連結回來：/tools?token=xxx
  useEffect(() => {
    const t = new URLSearchParams(location.search).get("token");
    if (t) {
      token.set(t);
      setSignedIn(true);
      history.replaceState({}, "", location.pathname);
    }
  }, []);

  useEffect(() => {
    if (!signedIn) return;
    fetchEntitlements()
      .then((d) => { setOwned(d.skill_ids || []); setCredits(d.credits ?? null); })
      .catch(() => setOwned([]));
  }, [signedIn]);

  async function login() {
    if (!email.includes("@")) return setErr("請填一個有效的 Email。");
    setErr(null);
    localStorage.setItem("ap.email", email);
    try { await sendMagicLink(email); setSent(true); }
    catch (e) { setErr(e.message); }
  }

  function demoIn() {
    token.set("demo");
    setSignedIn(true);
  }

  function signOut() {
    token.clear();
    setSignedIn(false);
    setOwned([]);
    setCredits(null);
    setActive(null);
  }

  if (!signedIn) {
    return (
      <section>
        <div className="hero">
          <div className="tag">工具台</div>
          <h1>你買的工具，在這裡用<em>不用下載，手機電腦打開就能用</em></h1>
        </div>
        <div className="card" style={{ maxWidth: 520 }}>
          <div className="flabel">你買東西時填的 Email</div>
          <input className="field" type="email" value={email}
            onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" />
          <button className="btn" onClick={login}>寄登入連結給我</button>
          <p className="msg">
            我們會寄一封信，點開信裡的連結就會回到這裡，不需要記密碼。
          </p>
          {err && <p className="msg err">{err}</p>}
          {sent && <p className="msg ok">信寄出去了。沒收到的話看一下垃圾郵件。</p>}
          {DEMO && (
            <button className="btn soft" onClick={demoIn}>用預覽帳號進去看</button>
          )}
        </div>
      </section>
    );
  }

  if (active) {
    return (
      <section>
        <ToolRunner
          skill={active}
          onBack={() => setActive(null)}
          onCredits={setCredits}
        />
      </section>
    );
  }

  const mine = SKILLS.filter((s) => owned.includes(s.id));
  const locked = SKILLS.filter((s) => !owned.includes(s.id));

  return (
    <section>
      <div className="hero">
        <div className="tag">{mine.length} / {SKILLS.length} 顆可用</div>
        <h1>今天要用哪一個？<em>七顆共用同一個判讀次數池</em></h1>
        <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
          {credits !== null && (
            <span className={"credit" + (credits < 20 ? " low" : "")}>剩 {credits} 次</span>
          )}
          <button className="credit" onClick={signOut}>登出</button>
        </div>
      </div>

      <div className="grid">
        {mine.map((s) => (
          <button className="tool" key={s.id} onClick={() => setActive(s)}>
            <span className="orb" style={{ background: s.tint }}>{s.emoji}</span>
            <span style={{ flex: 1 }}>
              <span className="id">{s.id}</span>
              <h3>{s.name}</h3>
              <span className="d">{s.blurb}</span>
            </span>
          </button>
        ))}
      </div>

      {locked.length > 0 && (
        <>
          <h2 style={{ marginTop: 30 }}>還沒買的</h2>
          <p className="sub">單顆 NT$850，七顆全帶 NT$4,900。<Link to="/skills">去看看 →</Link></p>
          <div className="grid">
            {locked.map((s) => (
              <button className="tool" key={s.id} disabled>
                <span className="orb" style={{ background: "#F4F1F6" }}>{s.emoji}</span>
                <span style={{ flex: 1 }}>
                  <span className="id">{s.id}</span>
                  <h3>{s.name}</h3>
                  <span className="d">還沒購買 · NT$850</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      <p className="disc">
        這些是生活輔助工具，不提供醫療、營養、心理治療、法律或投資服務。<br />
        情緒持續影響生活時，找心理師或身心科會比工具有用；緊急時安心專線 1925，24 小時。
      </p>
    </section>
  );
}
