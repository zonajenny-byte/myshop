import { useState } from "react";

const money = (v) => Math.round(Number(v) || 0).toLocaleString("en-US");

export default function Result({ skill, data }) {
  const map = {
    "label-reader": FoodResult,
    "skincare-reader": SkinResult,
    "hard-talk": TalkResult,
    "big-decision": DecideResult,
    "purchase-pause": BuyResult,
    "home-buying": HomeResult,
  };
  const C = map[skill.toolKey];
  return C ? <C r={data} /> : null;
}

/* ---------- 共用 ---------- */

function FlagBox({ cls, head, items, tappable }) {
  const [open, setOpen] = useState([]);
  if (!items?.length) return null;
  return (
    <div className={"fbox " + cls}>
      <div className="fhead">{head}</div>
      {items.map((f, i) => {
        const on = open.includes(i);
        return tappable ? (
          <div className="flag tap" key={i}
            onClick={() => setOpen((o) => (on ? o.filter((x) => x !== i) : [...o, i]))}>
            <h4>{f.title}<span className="cv">{on ? "收起" : "為什麼"}</span></h4>
            {on && <p>{f.detail}</p>}
          </div>
        ) : (
          <div className="flag" key={i}><h4>{f.title}</h4><p>{f.detail}</p></div>
        );
      })}
    </div>
  );
}

function Unreadable({ reason }) {
  return (
    <div className="fbox red">
      <div className="fhead">這張看不清楚</div>
      <p style={{ fontSize: 14 }}>{reason || "成分表的字無法辨識，請對準整段文字重拍一次。"}</p>
    </div>
  );
}

/* ---------- 食安 ---------- */

function FoodResult({ r }) {
  const [detail, setDetail] = useState(false);
  if (!r.readable) return <Unreadable reason={r.unreadable_reason} />;
  return (
    <>
      {r.allergen_hits?.length > 0 && (
        <div className="hit">
          <div className="l">⚠️ 命中你的忌口清單</div>
          <div className="v">{r.allergen_hits.join("、")}</div>
        </div>
      )}
      <div className="oneline">{r.one_line}</div>
      <FlagBox cls="red" head="⚠️ 需要注意" items={r.flags?.red} tappable />
      <button className="toggle" onClick={() => setDetail(!detail)}>
        {detail ? "收起 ▲" : "看完整判讀：成分、營養、其他觀察 ▼"}
      </button>
      {detail && (
        <>
          <div className="rhead"><h2>{r.product_name}</h2><p>{r.what_it_is}</p></div>
          <FlagBox cls="yel" head="💡 值得知道" items={r.flags?.yellow} />
          <FlagBox cls="grn" head="✓ 沒什麼問題" items={r.flags?.green} />
          {r.ingredients?.length > 0 && (
            <div className="card">
              <div className="eyebrow">成分逐項</div>
              {r.ingredients.map((i) => (
                <div className="item" key={i.name}>
                  <div className="n">{i.name}</div>
                  <div className="w">{i.what}</div>
                  <div className="y">{i.why}</div>
                </div>
              ))}
            </div>
          )}
          {r.nutrition?.available && (
            <div className="card">
              <div className="eyebrow">營養標示</div>
              <table style={{ width: "100%", borderCollapse: "collapse",
                fontFamily: "var(--mono)", fontSize: 13, marginTop: 10 }}>
                <tbody>
                  <tr style={{ fontSize: 11, color: "var(--ink2)" }}>
                    <td /><td align="right">每100g</td><td align="right">整包</td><td align="right">佔每日</td>
                  </tr>
                  {r.nutrition.rows.map((n) => (
                    <tr key={n.label}>
                      <td style={{ fontFamily: "var(--tc)", padding: "8px 0" }}>{n.label}</td>
                      <td align="right">{n.per_100}</td>
                      <td align="right">{n.whole_pack}</td>
                      <td align="right" style={{ color: n.pct_daily >= 50 ? "var(--rose-d)" : undefined }}>
                        {n.pct_daily != null ? n.pct_daily + "%" : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {r.nutrition.notes?.map((n, i) => (
                <p key={i} style={{ fontSize: 12.5, color: "var(--ink2)", marginTop: 8 }}>· {n}</p>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}

/* ---------- 保養品 ---------- */

function SkinResult({ r }) {
  const [detail, setDetail] = useState(false);
  if (!r.readable) return <Unreadable reason={r.unreadable_reason} />;
  return (
    <>
      <div className="rhead"><h2>{r.product_name}</h2><p>{r.base}</p></div>
      {r.boundary && (
        <div className="fbox lil">
          <div className="fhead">📏 1% 分界線在第 {r.boundary.index} 項</div>
          <div className="flag"><h4>{r.boundary.ingredient}</h4><p>{r.boundary.note}</p></div>
        </div>
      )}
      {r.actives?.length > 0 && (
        <div className="card">
          <div className="eyebrow">你買它的那些成分，實際在哪</div>
          {r.actives.map((a) => (
            <div className="item" key={a.name}>
              <div className="n">
                {a.name}　
                <span style={{ fontFamily: "var(--mono)", fontSize: 12,
                  color: a.after_boundary ? "var(--amber)" : "var(--mint-d)" }}>
                  第 {a.position} 位 · {a.after_boundary ? "線後" : "線前"}
                </span>
              </div>
              <div className="w">{a.typical}</div>
              <div className="y">{a.verdict}</div>
            </div>
          ))}
        </div>
      )}
      {r.unit_price && (
        <div className="numgrid">
          <div className="numcard"><div className="n">{r.unit_price.per_ml}</div><div className="u">元／每毫升</div></div>
          <div className="numcard"><div className="n">{r.unit_price.days}</div><div className="u">天　估計用得完</div></div>
        </div>
      )}
      <div className="oneline">{r.one_line}</div>
      <button className="toggle" onClick={() => setDetail(!detail)}>
        {detail ? "收起 ▲" : "看完整判讀：成分提醒、搭配、宣稱檢查 ▼"}
      </button>
      {detail && (
        <>
          {r.notes?.length > 0 && (
            <div className="card"><div className="eyebrow">值得知道</div>
              {r.notes.map((n) => (
                <div className="item" key={n.title}><div className="n">{n.title}</div><div className="y">{n.detail}</div></div>
              ))}</div>
          )}
          {r.conflicts?.length > 0 && (
            <div className="card"><div className="eyebrow">跟你手上其他罐</div>
              {r.conflicts.map((c) => (
                <div className="item" key={c.title}><div className="n">{c.title}</div><div className="y">{c.detail}</div></div>
              ))}</div>
          )}
          {r.claims?.length > 0 && (
            <div className="fbox yel"><div className="fhead">📋 包裝上的宣稱</div>
              {r.claims.map((c) => (
                <div className="flag" key={c.text}>
                  <h4>「{c.text}」</h4>
                  <p>{c.issue || "這句沒問題，屬於化粧品可以講的描述性用語。"}</p>
                </div>
              ))}</div>
          )}
        </>
      )}
    </>
  );
}

/* ---------- 難開口的對話 ---------- */

function TalkResult({ r }) {
  const [pick, setPick] = useState("A");
  if (r.safe === false) {
    return (
      <div className="fbox red">
        <div className="fhead" style={{ color: "var(--alert)" }}>這個先不用話術處理</div>
        <p style={{ fontSize: 14.5 }}>{r.safety_note}</p>
        <a className="btn" href="tel:113" style={{ background: "var(--alert)", color: "#fff" }}>
          撥打 113 保護專線
        </a>
        <p style={{ fontSize: 13, color: "var(--ink2)", marginTop: 11 }}>
          可以只是先問問看有哪些選擇，不用先決定要做什麼。
        </p>
      </div>
    );
  }
  const keys = ["A", "B", "C"].filter((k) => r.options?.[k]);
  return (
    <>
      <div className="rhead"><h2>你要的是什麼</h2><p>{r.want}</p></div>
      <div className="eyebrow" style={{ marginBottom: 10 }}>三種講法 · 點一個看接法</div>
      {keys.map((k) => {
        const o = r.options[k];
        return (
          <button className={"opt" + (pick === k ? " sel" : "")} key={k} onClick={() => setPick(k)}>
            <span className="lb">
              <span className="k">{k}. {o.kind}</span>
              <span className="tw">{o.tradeoff_label}</span>
            </span>
            <div className="script">「{o.script}」</div>
            <div className="tradeoff">{o.tradeoff}</div>
          </button>
        );
      })}
      <div className="eyebrow" style={{ margin: "20px 0 10px" }}>如果他這樣回</div>
      {r.replies?.map((x, i) => (
        <div className="reply" key={i}>
          <div className="them">「{x.them}」</div>
          <div className="you"><b>你可以說</b>「{x.you}」</div>
          <div className="tradeoff">{x.why}</div>
        </div>
      ))}
      <div className="fbox lil"><div className="fhead">怎麼收尾</div>
        <div className="script">「{r.closing}」</div></div>
      <div className="fbox grn"><div className="fhead">講完之後</div>
        <p style={{ fontSize: 13, color: "var(--ink2)" }}>{r.after}</p></div>
    </>
  );
}

/* ---------- 大決定拆解 ---------- */

function DecideResult({ r }) {
  const Bucket = ({ title, items, color, bg }) => (
    <div className="splitcol" style={bg ? { background: bg } : undefined}>
      <div className="h" style={{ color }}>{title}</div>
      {items?.map((x, i) => <div className="li" key={i}>· {x}</div>)}
    </div>
  );
  return (
    <>
      <div className="rhead"><h2>先問一句</h2><p>{r.opening_question}</p></div>
      <div className="card">
        <div className="eyebrow" style={{ marginBottom: 6 }}>你卡住的其實是這幾題</div>
        {r.questions?.map((q, i) => (
          <div className="qitem" key={i}><span className="qnum">{i + 1}</span><span>{q}</span></div>
        ))}
      </div>
      {r.reversibility && (
        <div className="fbox grn">
          <div className="fhead" style={{ color: "var(--mint-d)" }}>
            🔄 這是「{r.reversibility.kind}」的決定
          </div>
          <p style={{ fontSize: 13, color: "var(--ink2)" }}>{r.reversibility.detail}</p>
        </div>
      )}
      {r.worst_cases?.length > 0 && (
        <div className="card"><div className="eyebrow">最壞情況</div>
          {r.worst_cases.map((w, i) => (
            <div className="item" key={i}>
              <div className="n">{w.fear}</div>
              <div className="w">真的發生 → {w.if_real}</div>
              <div className="y">你能做的 → {w.you_can}</div>
            </div>
          ))}</div>
      )}
      {r.info && (
        <div className="card">
          <div className="eyebrow">可以查、可以試、不用再想</div>
          <div className="split">
            <Bucket title="去查" items={r.info.check} color="var(--mint-d)" />
            <Bucket title="去試" items={r.info.try} color="var(--lilac-d)" />
          </div>
          <div style={{ marginTop: 11 }}>
            <Bucket title="不用再想（這幾題沒有答案）" items={r.info.stop}
              color="var(--rose-d)" bg="var(--blush)" />
          </div>
        </div>
      )}
      {r.checkpoint && (
        <div className="check">
          <div className="eyebrow">檢查點</div>
          <div className="d">{r.checkpoint.date}</div>
          {r.checkpoint.actions?.map((a, i) => (
            <div key={i} style={{ fontSize: 13.5 }}>· {a}</div>
          ))}
          <p style={{ fontSize: 13, marginTop: 11, opacity: .9 }}>
            你現在不用決定。這幾件事做完，答案通常會自己浮出來。沒做完，那也是一個答案。
          </p>
        </div>
      )}
    </>
  );
}

/* ---------- 這個該不該買 ---------- */

function BuyResult({ r }) {
  if (r.out_of_scope) {
    return (
      <div className="fbox yel"><div className="fhead">這個超出範圍</div>
        <p style={{ fontSize: 14 }}>
          這顆只處理單筆消費決定。投資、保單、貸款請找合格的理財顧問或保險經紀人。
        </p></div>
    );
  }
  return (
    <>
      <div className="rhead">
        <h2>{r.item}　NT${money(r.price)}</h2>
        <p><b>{r.type}</b>　{r.type_note}</p>
      </div>
      {r.concern ? (
        <div className="fbox red">
          <p style={{ fontSize: 14.5 }}>{r.concern}</p>
          <p style={{ fontSize: 13, marginTop: 9 }}><a href="tel:1925">安心專線 1925（24 小時）</a></p>
        </div>
      ) : r.numbers?.length > 0 && (
        <div className="numgrid">
          {r.numbers.map((n, i) => (
            <div className="numcard" key={i}><div className="n">{n.value}</div><div className="u">{n.unit}</div></div>
          ))}
        </div>
      )}
      {r.questions?.length > 0 && (
        <div className="card">
          {r.questions.map((q, i) => (
            <div className="item" key={i}><div className="n">{q.q}</div><div className="y">{q.a}</div></div>
          ))}
        </div>
      )}
      {r.tactic && (
        <div className="fbox yel"><div className="fhead">⏱ 頁面在做什麼</div>
          <p style={{ fontSize: 13, color: "var(--ink2)" }}>{r.tactic}</p></div>
      )}
      <div className={"verdict " + r.verdict.kind}>
        <div className="k">{r.verdict.label}</div>
        <p>{r.verdict.detail}</p>
      </div>
    </>
  );
}

/* ---------- 買房 ---------- */

function HomeResult({ r }) {
  const [detail, setDetail] = useState(false);
  const bc = (b) => (b >= 40 ? "var(--alert)" : b >= 30 ? "var(--amber)" : "var(--mint-d)");
  return (
    <>
      <div className="cash">
        <div className="eyebrow" style={{ color: "rgba(255,255,255,.85)" }}>實際要準備的現金</div>
        <div className="big">NT${money(r.cash_needed)}</div>
        <div className="two">
          <div><span>頭期款</span>{money(r.down_payment)}</div>
          <div><span>一次性費用</span>{money(r.fee_total)}</div>
        </div>
        <button className="more" onClick={() => setDetail(!detail)}>
          {detail ? "收起明細 ▲" : "看費用明細 ▼"}
        </button>
        {detail && r.fees?.map((f) => (
          <div className="fee" key={f.name}>
            <div>{f.name}<em>{f.note}</em></div>
            <div style={{ fontFamily: "var(--mono)" }}>{money(f.amount)}</div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="eyebrow">每月要繳</div>
        <div className="payrow">
          <div>現在 {r.monthly.rate}%</div>
          <div className="amt">{money(r.monthly.amount)}
            {r.monthly.burden != null && (
              <span className="bd" style={{ color: bc(r.monthly.burden) }}>
                佔收入 {r.monthly.burden}%
              </span>)}
          </div>
        </div>
        <div className="payrow">
          <div>利率升到 {r.stress.rate}%</div>
          <div className="amt">{money(r.stress.amount)}
            {r.stress.burden != null && (
              <span className="bd" style={{ color: bc(r.stress.burden) }}>
                佔收入 {r.stress.burden}%
              </span>)}
          </div>
        </div>
        <p style={{ fontSize: 12.5, color: "var(--ink2)", marginTop: 10 }}>
          每月多 {money(r.stress.delta)} 元。做決定時用這個數字，不要用現在的利率。
        </p>
      </div>

      {r.grace && (
        <div className="gracebox">
          <div className="fhead">⚠️ 寬限期 {r.grace.years} 年之後</div>
          <div className="flow">
            <div><span>寬限期間</span>{money(r.grace.during)}</div>→
            <div><span>期滿後</span>{money(r.grace.after)}</div>
            <div className="jump">+{r.grace.jump_pct}%</div>
          </div>
          <p>很多人是到第四年才發現這件事。如果需要靠寬限期才付得起，那代表現在就是負擔不起。</p>
        </div>
      )}

      <div className="reserve">
        <b>☂ 另外要留的緩衝</b>
        失業六個月的房貸是 {money(r.reserve_6m)} 元。這筆錢不能算進頭期款裡。
      </div>

      <div className="fbox grn"><p style={{ fontSize: 14.5, fontWeight: 500 }}>{r.verdict}</p></div>

      {r.inspection?.length > 0 && (
        <div className="card">
          <div className="eyebrow" style={{ marginBottom: 8 }}>看屋要查的</div>
          {r.inspection.map((i, k) => (
            <div key={k} style={{ fontSize: 13, marginBottom: 7 }}>
              <span style={{ color: "var(--clay)" }}>·</span> {i}
            </div>
          ))}
        </div>
      )}
      {r.contract?.length > 0 && (
        <div className="card"><div className="eyebrow">契約要看的</div>
          {r.contract.map((c) => (
            <div className="item" key={c.title}><div className="n">{c.title}</div><div className="y">{c.detail}</div></div>
          ))}</div>
      )}
      {r.notes?.map((n, i) => (
        <p key={i} style={{ fontSize: 12, color: "var(--ink2)" }}>· {n}</p>
      ))}
    </>
  );
}
