import { useState } from "react";
import { runTool, imageToBase64 } from "../lib/api";
import Result from "./Result";

const ALLERGENS = ["甲殼類","芒果","花生","牛奶羊奶","蛋","堅果類","芝麻",
  "含麩質穀物","大豆","魚類","亞硫酸鹽","頭足類","螺貝類","種子類","奇異果"];

/** 每顆工具要問的欄位。photo 為 true 的走拍照，chat 為 true 的走多輪對話 */
const FORMS = {
  "label-reader":   { photo: true, fields: [], run: "判讀", loading: "正在讀標示⋯⋯" },
  "skincare-reader":{ photo: true, fields: [], run: "判讀", loading: "正在拆成分表⋯⋯" },
  "hard-talk": { fields: [
      { k: "who", l: "對方是誰", ph: "主管、我媽、同事⋯⋯" },
      { k: "situation", l: "發生什麼事", ph: "描述得越具體，講法越用得上", multi: true },
      { k: "goal", l: "你希望談完之後怎樣", ph: "想要一個結果？想被理解？還是只是想說出口" },
    ], run: "幫我準備", loading: "正在準備三種講法⋯⋯" },
  "big-decision": { fields: [
      { k: "topic", l: "你在猶豫什麼", ph: "該不該離職、搬家、分手⋯⋯", multi: true },
      { k: "pressure", l: "有時間壓力嗎", ph: "有期限？還是只是每天在想" },
    ], run: "幫我拆開", loading: "正在拆解⋯⋯" },
  "purchase-pause": { fields: [
      { k: "item", l: "想買什麼", ph: "商品名稱或描述" },
      { k: "price", l: "多少錢", ph: "3980", num: true },
    ], run: "看一下", loading: "計算中⋯⋯" },
  "commute-decompress": { chat: true, fields: [], loading: "⋯⋯" },
  "home-buying": { fields: [
      { k: "price", l: "總價（萬）", ph: "1200", num: true },
      { k: "loanRatio", l: "貸款成數（%）", ph: "80", num: true },
      { k: "rate", l: "利率（%）", ph: "2.2", num: true },
      { k: "years", l: "年限", ph: "30", num: true },
      { k: "graceYears", l: "寬限期（年，沒有填 0）", ph: "0", num: true },
      { k: "monthlyIncome", l: "家庭月收入", ph: "90000", num: true },
    ], run: "算給我看", loading: "正在算⋯⋯" },
  "gift-etiquette": { fields: [
      { k: "occasion", l: "什麼場合", ph: "喬遷、彌月、婚禮、長輩過年紅包⋯⋯" },
      { k: "relation", l: "跟對方的關係", ph: "主管、遠房親戚、好朋友、鄰居⋯⋯" },
      { k: "context", l: "還有什麼該知道的", ph: "地區習俗、對方的喜好、你們平常的交情", multi: true },
    ], run: "幫我抓金額", loading: "正在抓行情⋯⋯" },
  "style-planning": { fields: [
      { k: "wardrobe", l: "你現在有的衣服（想到什麼寫什麼）", ph: "白襯衫、牛仔褲、黑色小外套⋯⋯", multi: true },
      { k: "occasion", l: "要搭給什麼場合", ph: "上班、約會、朋友聚餐⋯⋯" },
      { k: "style", l: "喜歡的風格關鍵字（選填）", ph: "簡約、日系、通勤⋯⋯" },
    ], run: "幫我排搭配", loading: "正在排搭配⋯⋯" },
  "startup-basics": { fields: [
      { k: "offer", l: "你想賣什麼", ph: "產品、服務、課程⋯⋯，越具體越好", multi: true },
      { k: "customer", l: "想賣給誰", ph: "他們是誰、通常在哪裡出沒" },
      { k: "stage", l: "現在到哪一步了", ph: "只有想法／做出雛型／已經賣出過幾筆" },
    ], run: "幫我拆步驟", loading: "正在拆解⋯⋯" },
};

export default function ToolRunner({ skill, onBack, onCredits }) {
  const form = FORMS[skill.toolKey];
  const [fields, setFields] = useState({});
  const [photo, setPhoto] = useState(null);
  const [avoid, setAvoid] = useState(() =>
    JSON.parse(localStorage.getItem("ap.avoid") || "[]"));
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [result, setResult] = useState(null);
  const [chat, setChat] = useState([]);
  const [draft, setDraft] = useState("");
  const [chatDone, setChatDone] = useState(false);

  const set = (k) => (e) => setFields({ ...fields, [k]: e.target.value });

  function toggleAvoid(a) {
    const next = avoid.includes(a) ? avoid.filter((x) => x !== a) : [...avoid, a];
    setAvoid(next);
    localStorage.setItem("ap.avoid", JSON.stringify(next));
  }

  async function onFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    // imageToBase64 內部用 canvas 重新編碼，不管原始檔案是什麼格式，輸出的一律是 JPEG，
    // 這裡的 type 要跟著寫死，不能用原始檔案的 file.type（會跟實際位元組對不上）
    setPhoto({ type: "image/jpeg", data: await imageToBase64(file) });
  }

  async function go(extraFields) {
    setBusy(true);
    setErr(null);
    try {
      const payload = {
        tool: skill.toolKey,
        fields: extraFields || fields,
        context: skill.toolKey === "label-reader" && avoid.length ? { avoidList: avoid } : {},
      };
      if (form.photo) {
        if (!photo) throw new Error("需要一張照片才能判讀。");
        payload.image = photo.data;
        payload.mediaType = photo.type;
      }
      if (form.chat) {
        payload.history = chat.map((c) => ({
          role: c.r === "u" ? "user" : "assistant", text: c.t,
        }));
      }

      const d = await runTool(payload);
      if (d.credits?.remaining != null) onCredits(d.credits.remaining);

      if (form.chat) {
        setChat((c) => [...c, { r: "a", t: d.result.reply }]);
        setResult(d.result);
        if (d.result.done || d.result.stop_flow) setChatDone(true);
      } else {
        setResult(d.result);
      }
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  }

  function send() {
    const t = draft.trim();
    if (!t || busy) return;
    setChat((c) => [...c, { r: "u", t }]);
    setDraft("");
    go({ today: t });
  }

  function reset() {
    setResult(null); setPhoto(null); setChat([]); setChatDone(false); setDraft("");
  }

  /* ---------- 多輪對話 ---------- */
  if (form.chat) {
    return (
      <>
        <button className="back" onClick={onBack}>‹ 回工具台</button>
        {chat.length === 0 && (
          <div className="rhead">
            <h2>今天怎麼樣？</h2>
            <p>打幾個字就行，罵人也可以。三分鐘結束今天。</p>
          </div>
        )}
        {chat.map((c, i) => <div className={"bub " + c.r} key={i}>{c.t}</div>)}
        {busy && <div className="spin" />}

        {chatDone && result?.stop_flow ? (
          <>
            <div className="fbox red">
              <div className="fhead" style={{ color: "var(--alert)" }}>可以打去說說話</div>
              <p style={{ fontSize: 14 }}>{result.concern}</p>
              <p style={{ fontSize: 14, marginTop: 9 }}>
                衛福部安心專線 <a href="tel:1925"><b>1925</b></a>，24 小時都有人接。不用先想好要講什麼。
              </p>
            </div>
            <button className="btn soft" onClick={reset}>回到開頭</button>
          </>
        ) : chatDone ? (
          <>
            {result?.tomorrow?.length > 0 && (
              <div className="duskwrap">
                <div className="h">明天的事</div>
                {result.tomorrow.map((t, i) => <div className="li" key={i}>{i + 1}. {t}</div>)}
              </div>
            )}
            {result?.closing && <div className="duskclose">{result.closing}</div>}
            <button className="btn" style={{ background: "var(--dusk)", color: "#fff" }} onClick={reset}>
              明天見
            </button>
          </>
        ) : (
          <div className="composer">
            <input className="field" value={draft} onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder={chat.length ? "打幾個字⋯⋯" : "今天怎麼樣⋯⋯"} />
            <button className="send" onClick={send}>↑</button>
          </div>
        )}
        {err && <p className="msg err">{err}</p>}
        <p className="disc">{skill.limit}</p>
      </>
    );
  }

  /* ---------- 結果 ---------- */
  if (result) {
    return (
      <>
        <button className="back" onClick={onBack}>‹ 回工具台</button>
        <Result skill={skill} data={result} />
        <button className="btn soft" onClick={reset}>再做一次</button>
        <p className="disc">{skill.limit}</p>
      </>
    );
  }

  /* ---------- 輸入表單 ---------- */
  return (
    <>
      <button className="back" onClick={onBack}>‹ 回工具台</button>
      <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 18 }}>
        <span className="orb" style={{ background: skill.tint }}>{skill.emoji}</span>
        <div>
          <h2 style={{ margin: 0, fontSize: 24 }}>{skill.name}</h2>
          <div style={{ fontSize: 13, color: "var(--ink2)" }}>{skill.blurb}</div>
        </div>
      </div>

      <div className="card">
        {form.photo && (
          <>
            <label className="drop" htmlFor="file">
              {photo ? (
                <>
                  <img src={`data:${photo.type};base64,${photo.data}`} alt="已選擇的照片"
                    style={{ maxHeight: 220, borderRadius: 14, margin: "0 auto" }} />
                  <div className="s" style={{ marginTop: 9 }}>點一下換一張</div>
                </>
              ) : (
                <>
                  <div className="ic">{skill.emoji}</div>
                  <div className="t">拍或選一張成分表</div>
                  <div className="s">字很小，拍近一點。看不清楚我會請你重拍</div>
                </>
              )}
            </label>
            <input id="file" type="file" accept="image/*" onChange={onFile} style={{ display: "none" }} />
          </>
        )}

        {skill.toolKey === "label-reader" && (
          <>
            <div className="flabel">要幫你比對的（命中會標紅放最前面）</div>
            <div className="chips">
              {ALLERGENS.map((a) => (
                <button key={a} className={"chip" + (avoid.includes(a) ? " on" : "")}
                  onClick={() => toggleAvoid(a)}>{a}</button>
              ))}
            </div>
            <p className="msg">法規只強制標示 11 項，另 4 項為建議標示。清單以外的成分不一定會出現在警語上。</p>
          </>
        )}

        {form.fields.map((f) => (
          <div key={f.k}>
            <div className="flabel">{f.l}</div>
            {f.multi ? (
              <textarea className="field" value={fields[f.k] || ""} onChange={set(f.k)} placeholder={f.ph} />
            ) : (
              <input className="field" value={fields[f.k] || ""} onChange={set(f.k)}
                placeholder={f.ph} type={f.num ? "number" : "text"} inputMode={f.num ? "decimal" : undefined} />
            )}
          </div>
        ))}

        <button className="btn" onClick={() => go()} disabled={busy}>
          {busy ? "處理中⋯⋯" : form.run}
        </button>
        {err && <p className="msg err">{err}</p>}
      </div>

      {busy && <><div className="spin" /><div className="loading">{form.loading}</div></>}
      <p className="disc">{skill.limit}</p>
    </>
  );
}
