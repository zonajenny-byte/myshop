import { useState, useEffect } from "react";
import { adminLogin, adminSignOut, isAdminSignedIn } from "../lib/adminApi";
import { usePhysicalProducts, adminCreate, adminUpdate, adminRemove, resetDemoData, resolveImageUrl } from "../lib/products";
import { adminGenerate, adminList, adminRevoke } from "../lib/discountCodes";
import { DEMO, imageToBase64 } from "../lib/api";
import { money } from "../lib/cart";

const EMPTY = { id: "", name: "", en: "", price: "", stock: "", blurb: "", emoji: "✦", tint: "#F3EDF9",
  image: null, spec: [["", ""], ["", ""], ["", ""]] };

export default function Admin() {
  const [signedIn, setSignedIn] = useState(isAdminSignedIn());
  const [password, setPassword] = useState("");
  const [err, setErr] = useState(null);
  const [busy, setBusy] = useState(false);

  const products = usePhysicalProducts();
  const [editing, setEditing] = useState(null); // null | "new" | product id
  const [form, setForm] = useState(EMPTY);

  const [codes, setCodes] = useState([]);
  const [codesBusy, setCodesBusy] = useState(false);

  useEffect(() => {
    if (signedIn) adminList().then(setCodes).catch(() => {});
  }, [signedIn]);

  async function generateCode() {
    setCodesBusy(true);
    try {
      await adminGenerate();
      setCodes(await adminList());
    } catch (e) {
      setErr(e.message);
    }
    setCodesBusy(false);
  }

  async function revokeCode(code) {
    if (!confirm(`確定要收回折扣碼 ${code} 嗎？`)) return;
    setCodesBusy(true);
    try {
      await adminRevoke(code);
      setCodes(await adminList());
    } catch (e) {
      setErr(e.message);
    }
    setCodesBusy(false);
  }

  async function login() {
    setErr(null); setBusy(true);
    try { await adminLogin(password); setSignedIn(true); }
    catch (e) { setErr(e.message); }
    setBusy(false);
  }

  function signOut() {
    adminSignOut();
    setSignedIn(false);
  }

  function startNew() {
    setForm(EMPTY);
    setEditing("new");
  }

  function startEdit(p) {
    setForm({
      id: p.id, name: p.name, en: p.en || "", price: p.price, stock: p.stock ?? "",
      blurb: p.blurb || "", emoji: p.emoji || "✦", tint: p.tint || "#F3EDF9",
      image: p.image || null,
      spec: [...(p.spec || []), ["", ""], ["", ""], ["", ""]].slice(0, 3),
    });
    setEditing(p.id);
  }

  function setSpec(i, col, val) {
    const spec = form.spec.map((row, ri) => (ri === i ? [col === 0 ? val : row[0], col === 1 ? val : row[1]] : row));
    setForm({ ...form, spec });
  }

  const [photoBusy, setPhotoBusy] = useState(false);

  async function onPhotoSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoBusy(true);
    try {
      // imageToBase64 固定輸出 JPEG，並已經做過壓縮，適合直接當商品照存
      const b64 = await imageToBase64(file, 1200);
      setForm((f) => ({ ...f, image: "data:image/jpeg;base64," + b64 }));
    } catch {
      setErr("這張圖片讀不了，換一張試試。");
    }
    setPhotoBusy(false);
  }

  function removePhoto() {
    setForm((f) => ({ ...f, image: null }));
  }

  async function save() {
    setErr(null); setBusy(true);
    try {
      const payload = { ...form, spec: form.spec.filter((r) => r[0] && r[1]) };
      if (editing === "new") await adminCreate(payload);
      else await adminUpdate(editing, payload);
      setEditing(null);
    } catch (e) {
      setErr(e.message);
    }
    setBusy(false);
  }

  async function del(id) {
    if (!confirm("確定要下架這個商品嗎？下架後客人就買不到了。")) return;
    setBusy(true);
    try { await adminRemove(id); }
    catch (e) { setErr(e.message); }
    setBusy(false);
  }

  if (!signedIn) {
    return (
      <section>
        <div className="hero">
          <div className="tag">後台</div>
          <h1>上架新商品<em>能量小物專用，AI 工具的商品清單不在這裡改</em></h1>
        </div>
        <div className="card" style={{ maxWidth: 420 }}>
          <div className="flabel">後台密碼</div>
          <input className="field" type="password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && login()} />
          <button className="btn" onClick={login} disabled={busy}>{busy ? "登入中⋯⋯" : "登入"}</button>
          {err && <p className="msg err">{err}</p>}
          {DEMO && (
            <p className="msg">
              預覽模式：輸入任何密碼都能進去，資料存在這台裝置的瀏覽器裡，
              不是真的上架給客人看。接上後端之後才是正式後台。
            </p>
          )}
        </div>
      </section>
    );
  }

  return (
    <section>
      <div className="hero">
        <div className="tag">後台 · {products.length} 件上架中</div>
        <h1>能量小物管理<em>加、改、下架，客人立刻看得到</em></h1>
        <div style={{ display: "flex", gap: 10, marginTop: 18, flexWrap: "wrap" }}>
          <button className="credit" onClick={signOut}>登出</button>
          {DEMO && <button className="credit" onClick={resetDemoData}>還原範例資料</button>}
        </div>
      </div>

      {DEMO && (
        <div className="note warn" style={{ marginBottom: 20 }}>
          <h4><span className="num">!</span>目前是預覽模式</h4>
          <p>
            這裡加的商品只存在你這台裝置的瀏覽器，客人看不到。
            要真的上架，請設定 <code>VITE_API_BASE</code> 指向你部署的 <code>server/</code>，
            並在該後端的 <code>.env</code> 設好 <code>ADMIN_PASSWORD</code>。
          </p>
        </div>
      )}

      {editing ? (
        <div className="card">
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>
            {editing === "new" ? "新增商品" : "編輯商品"}
          </h2>

          <div className="flabel">展示圖（選填，沒有的話會用 emoji 圓標代替）</div>
          {form.image ? (
            <div style={{ position: "relative", marginBottom: 12 }}>
              <img src={resolveImageUrl(form.image)} alt="商品預覽"
                style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 16 }} />
              <button className="add danger" onClick={removePhoto}
                style={{ position: "absolute", top: 10, right: 10, padding: "8px 16px", fontSize: 13 }}>
                移除
              </button>
            </div>
          ) : (
            <label className="drop" style={{ marginBottom: 12, padding: "24px 20px" }}>
              <div className="ic">📷</div>
              <div className="t">{photoBusy ? "處理中⋯⋯" : "點這裡選一張照片"}</div>
              <div className="s">會自動壓縮，手機拍的照片也能直接用</div>
              <input type="file" accept="image/*" onChange={onPhotoSelect}
                style={{ display: "none" }} disabled={photoBusy} />
            </label>
          )}

          <div className="flabel">名稱</div>
          <input className="field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="月相手鍊" />

          <div className="flabel">英文名（選填）</div>
          <input className="field" value={form.en} onChange={(e) => setForm({ ...form, en: e.target.value })}
            placeholder="Moon Phase Bracelet" />

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div className="flabel">價格</div>
              <input className="field" type="number" value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })} placeholder="1280" />
            </div>
            <div>
              <div className="flabel">庫存</div>
              <input className="field" type="number" value={form.stock}
                onChange={(e) => setForm({ ...form, stock: e.target.value })} placeholder="50" />
            </div>
          </div>

          <div className="flabel">一句話介紹</div>
          <textarea className="field" value={form.blurb}
            onChange={(e) => setForm({ ...form, blurb: e.target.value })}
            placeholder="月光石與黃銅，隨光線變換色澤。" />

          <div className="flabel">規格（最多三行，例如「材質」「月光石、黃銅」）</div>
          {form.spec.map((row, i) => (
            <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <input className="field" value={row[0]} onChange={(e) => setSpec(i, 0, e.target.value)} placeholder="項目" />
              <input className="field" value={row[1]} onChange={(e) => setSpec(i, 1, e.target.value)} placeholder="內容" />
            </div>
          ))}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <div className="flabel">圖示（一個 emoji）</div>
              <input className="field" value={form.emoji}
                onChange={(e) => setForm({ ...form, emoji: e.target.value })} placeholder="🌙" />
            </div>
            <div>
              <div className="flabel">卡片底色</div>
              <input className="field" type="color" value={form.tint} style={{ padding: 6, height: 48 }}
                onChange={(e) => setForm({ ...form, tint: e.target.value })} />
            </div>
          </div>

          <button className="btn" onClick={save} disabled={busy}>{busy ? "儲存中⋯⋯" : "儲存"}</button>
          <button className="btn soft" onClick={() => setEditing(null)}>取消</button>
          {err && <p className="msg err">{err}</p>}
        </div>
      ) : (
        <button className="btn" onClick={startNew} style={{ marginBottom: 20 }}>+ 新增商品</button>
      )}

      {!editing && (
        <div className="grid">
          {products.map((p) => (
            <div className="card" key={p.id}>
              {p.image ? (
                <img className="card-photo" src={resolveImageUrl(p.image)} alt={p.name} />
              ) : null}
              <div className="card-top">
                {!p.image && <div className="orb" style={{ background: p.tint }}>{p.emoji}</div>}
                <div style={{ flex: 1 }}>
                  <div className="id">{p.id}</div>
                  <h3>{p.name}</h3>
                  <div className="en">{(p.en || "").toUpperCase()}</div>
                </div>
              </div>
              <p className="blurb">{p.blurb}</p>
              <div className="card-foot">
                <span className="price">{money(p.price)}</span>
                <span style={{ fontSize: 12, color: "var(--ink2)" }}>庫存 {p.stock}</span>
                <button className="add soft" onClick={() => startEdit(p)} style={{ marginLeft: "auto" }}>編輯</button>
                <button className="add danger" onClick={() => del(p.id)}>下架</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!editing && (
        <div style={{ marginTop: 36 }}>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>折扣碼產生器</h2>
          <p className="sub">每組碼打七折，只限數位工具（不含能量小物與訂閱），用過一次就失效。</p>

          <button className="btn" onClick={generateCode} disabled={codesBusy} style={{ marginBottom: 16 }}>
            {codesBusy ? "處理中⋯⋯" : "+ 產生新折扣碼"}
          </button>

          {codes.length === 0 ? (
            <p className="msg">還沒有產生過折扣碼。</p>
          ) : (
            <div className="card">
              {[...codes].reverse().map((c) => (
                <div className="item" key={c.code}>
                  <div className="n" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span style={{ fontFamily: "var(--mono)", letterSpacing: "0.05em" }}>{c.code}</span>
                    <span style={{
                      fontSize: 11, padding: "2px 10px", borderRadius: 10,
                      background: c.used ? "var(--blush)" : "var(--mint-l)",
                      color: c.used ? "var(--rose-d)" : "var(--mint-d)",
                    }}>
                      {c.used ? "已使用" : "未使用"}
                    </span>
                    {!c.used && (
                      <button className="add danger" style={{ marginLeft: "auto", padding: "5px 14px", fontSize: 12 }}
                        onClick={() => revokeCode(c.code)}>收回</button>
                    )}
                  </div>
                  <div className="y">
                    折扣 {c.discountPercent}%
                    {c.used ? `　·　${c.usedBy || "—"} 使用於 ${new Date(c.usedAt).toLocaleString("zh-TW")}` : ""}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
