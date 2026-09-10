import { useState, useEffect } from "react";
import { adminLogin, adminSignOut, isAdminSignedIn } from "../lib/adminApi";
import { usePhysicalProducts, adminCreate, adminUpdate, adminRemove, adminAddGalleryImage, adminRemoveGalleryImage, resetDemoData, resolveImageUrl } from "../lib/products";
import { adminGenerate, adminList, adminRevoke } from "../lib/discountCodes";
import { fetchAnnouncement, adminUpdateAnnouncement } from "../lib/announcement";
import { fetchSocialLinks, adminUpdateSocialLinks } from "../lib/socialLinks";
import { adminListArticles, adminGetArticle, adminCreateArticle, adminUpdateArticle, adminRemoveArticle } from "../lib/articles";
import { useSkills, adminUpdateSkill, adminResetSkill, adminAddGallerySkill, adminRemoveGallerySkill } from "../lib/skillOverrides";
import { DEMO, imageToBase64 } from "../lib/api";
import { money } from "../lib/cart";
import { CATEGORIES, DEFAULT_CATEGORY } from "../data/catalog";

const EMPTY = { id: "", name: "", en: "", price: "", stock: "", blurb: "", emoji: "✦", tint: "#F3EDF9",
  image: null, image2: null, category: DEFAULT_CATEGORY, soldOut: false, spec: [["", ""], ["", ""], ["", ""]] };

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

  const [ann, setAnn] = useState(null);
  const [annBusy, setAnnBusy] = useState(false);
  const [annMsg, setAnnMsg] = useState(null);

  useEffect(() => {
    if (signedIn) fetchAnnouncement().then(setAnn).catch(() => {});
  }, [signedIn]);

  async function saveAnnouncement() {
    setAnnBusy(true);
    setAnnMsg(null);
    try {
      const saved = await adminUpdateAnnouncement(ann);
      setAnn(saved);
      setAnnMsg({ t: "ok", m: "公告已更新，訪客下次進首頁就會看到新內容。" });
    } catch (e) {
      setAnnMsg({ t: "err", m: e.message });
    }
    setAnnBusy(false);
  }

  const [social, setSocial] = useState(null);
  const [socialBusy, setSocialBusy] = useState(false);
  const [socialMsg, setSocialMsg] = useState(null);

  useEffect(() => {
    if (signedIn) fetchSocialLinks().then(setSocial).catch(() => {});
  }, [signedIn]);

  async function saveSocial() {
    setSocialBusy(true);
    setSocialMsg(null);
    try {
      const saved = await adminUpdateSocialLinks(social);
      setSocial(saved);
      setSocialMsg({ t: "ok", m: "已更新。" });
    } catch (e) {
      setSocialMsg({ t: "err", m: e.message });
    }
    setSocialBusy(false);
  }

  const EMPTY_ART = { title: "", body: "", tag: "", cover: null, published: false };
  const [arts, setArts] = useState([]);
  const [artEditing, setArtEditing] = useState(null); // null | "new" | id
  const [artForm, setArtForm] = useState(EMPTY_ART);
  const [artBusy, setArtBusy] = useState(false);
  const [artMsg, setArtMsg] = useState(null);

  useEffect(() => {
    if (signedIn) adminListArticles().then(setArts).catch(() => {});
  }, [signedIn]);

  function startNewArticle() {
    setArtForm(EMPTY_ART);
    setArtEditing("new");
    setArtMsg(null);
  }

  async function startEditArticle(id) {
    setArtMsg(null);
    try {
      const a = await adminGetArticle(id);
      setArtForm({ title: a.title, body: a.body, tag: a.tag || "", cover: a.cover, published: a.published });
      setArtEditing(id);
    } catch (e) { setArtMsg({ t: "err", m: e.message }); }
  }

  async function onArtCover(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await imageToBase64(file, 1400);
      setArtForm((f) => ({ ...f, cover: "data:image/jpeg;base64," + b64 }));
    } catch { setArtMsg({ t: "err", m: "這張圖片讀不了，換一張試試。" }); }
  }

  async function saveArticle(publish) {
    setArtBusy(true);
    setArtMsg(null);
    try {
      const payload = { ...artForm, published: publish };
      if (artEditing === "new") await adminCreateArticle(payload);
      else await adminUpdateArticle(artEditing, payload);
      setArts(await adminListArticles());
      setArtEditing(null);
    } catch (e) { setArtMsg({ t: "err", m: e.message }); }
    setArtBusy(false);
  }

  const skills = useSkills();
  const [skillEditing, setSkillEditing] = useState(null);
  const [skillForm, setSkillForm] = useState(null);
  const [skillBusy, setSkillBusy] = useState(false);
  const [skillMsg, setSkillMsg] = useState(null);

  function startEditSkill(sk) {
    setSkillForm({
      name: sk.name, en: sk.en || "", price: sk.price,
      blurb: sk.blurb || "", feat: [...(sk.feat || []), "", "", ""].slice(0, 3),
      limit: sk.limit || "", emoji: sk.emoji || "✦", tint: sk.tint || "#F3EDF9",
      image: sk.image || null, image2: sk.image2 || null, moodImage: sk.moodImage || null,
    });
    setSkillEditing(sk.id);
    setSkillMsg(null);
  }

  async function onSkillPhoto(e, field) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const b64 = await imageToBase64(file, field === "moodImage" ? 1400 : 1200);
      setSkillForm((f) => ({ ...f, [field]: "data:image/jpeg;base64," + b64 }));
    } catch { setSkillMsg({ t: "err", m: "這張圖片讀不了，換一張試試。" }); }
  }

  async function saveSkill() {
    setSkillBusy(true);
    setSkillMsg(null);
    try {
      await adminUpdateSkill(skillEditing, skillForm);
      setSkillEditing(null);
    } catch (e) { setSkillMsg({ t: "err", m: e.message }); }
    setSkillBusy(false);
  }

  async function resetSkill(id) {
    if (!confirm("確定要還原成原本的內容嗎？你改過的文字跟圖片會被清掉。")) return;
    setSkillBusy(true);
    try {
      await adminResetSkill(id);
      setSkillEditing(null);
    } catch (e) { setSkillMsg({ t: "err", m: e.message }); }
    setSkillBusy(false);
  }

  async function onSkillGalleryAdd(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setSkillBusy(true);
    try {
      const b64 = await imageToBase64(file, 1200);
      await adminAddGallerySkill(skillEditing, "data:image/jpeg;base64," + b64);
    } catch (err) {
      setSkillMsg({ t: "err", m: err.message || "這張圖片讀不了，換一張試試。" });
    }
    setSkillBusy(false);
  }

  async function onSkillGalleryRemove(index) {
    setSkillBusy(true);
    try {
      await adminRemoveGallerySkill(skillEditing, index);
    } catch (err) {
      setSkillMsg({ t: "err", m: err.message });
    }
    setSkillBusy(false);
  }

  async function delArticle(id) {
    if (!confirm("確定要刪除這篇文章嗎？")) return;
    setArtBusy(true);
    try {
      await adminRemoveArticle(id);
      setArts(await adminListArticles());
    } catch (e) { setArtMsg({ t: "err", m: e.message }); }
    setArtBusy(false);
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
      image2: p.image2 || null,
      category: p.category || DEFAULT_CATEGORY,
      soldOut: !!p.soldOut,
      spec: [...(p.spec || []), ["", ""], ["", ""], ["", ""]].slice(0, 3),
    });
    setEditing(p.id);
  }

  function setSpec(i, col, val) {
    const spec = form.spec.map((row, ri) => (ri === i ? [col === 0 ? val : row[0], col === 1 ? val : row[1]] : row));
    setForm({ ...form, spec });
  }

  const [photoBusy, setPhotoBusy] = useState(false);

  async function onPhotoSelect(e, field = "image") {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoBusy(true);
    try {
      // imageToBase64 固定輸出 JPEG，並已經做過壓縮，適合直接當商品照存
      const b64 = await imageToBase64(file, 1200);
      setForm((f) => ({ ...f, [field]: "data:image/jpeg;base64," + b64 }));
    } catch {
      setErr("這張圖片讀不了，換一張試試。");
    }
    setPhotoBusy(false);
  }

  function removePhoto(field = "image") {
    setForm((f) => ({ ...f, [field]: null }));
  }

  const [galleryBusy, setGalleryBusy] = useState(false);

  async function onGalleryAdd(e) {
    const file = e.target.files?.[0];
    if (!file || editing === "new") return;
    setGalleryBusy(true);
    try {
      const b64 = await imageToBase64(file, 1200);
      await adminAddGalleryImage(editing, "data:image/jpeg;base64," + b64);
    } catch (err) {
      setErr(err.message || "這張圖片讀不了，換一張試試。");
    }
    setGalleryBusy(false);
  }

  async function onGalleryRemove(index) {
    setGalleryBusy(true);
    try {
      await adminRemoveGalleryImage(editing, index);
    } catch (err) {
      setErr(err.message);
    }
    setGalleryBusy(false);
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
          <h1>上架新商品<em>水晶與能量選物專用，AI 工具的商品清單不在這裡改</em></h1>
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
        <h1>商品管理<em>加、改、下架，客人立刻看得到</em></h1>
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

          <div className="flabel">主圖（選填，沒有的話會用 emoji 圓標代替）</div>
          {form.image ? (
            <div style={{ position: "relative", marginBottom: 12 }}>
              <img src={resolveImageUrl(form.image)} alt="主圖預覽"
                style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 16 }} />
              <button className="add danger" onClick={() => removePhoto("image")}
                style={{ position: "absolute", top: 10, right: 10, padding: "8px 16px", fontSize: 13 }}>
                移除
              </button>
            </div>
          ) : (
            <label className="drop" style={{ marginBottom: 12, padding: "24px 20px" }}>
              <div className="ic">📷</div>
              <div className="t">{photoBusy ? "處理中⋯⋯" : "點這裡選一張照片"}</div>
              <div className="s">會自動壓縮，手機拍的照片也能直接用</div>
              <input type="file" accept="image/*" onChange={(e) => onPhotoSelect(e, "image")}
                style={{ display: "none" }} disabled={photoBusy} />
            </label>
          )}

          <div className="flabel">第二張圖（選填，客人滑鼠移到商品上會換成這張）</div>
          {form.image2 ? (
            <div style={{ position: "relative", marginBottom: 12 }}>
              <img src={resolveImageUrl(form.image2)} alt="第二張圖預覽"
                style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 16 }} />
              <button className="add danger" onClick={() => removePhoto("image2")}
                style={{ position: "absolute", top: 10, right: 10, padding: "8px 16px", fontSize: 13 }}>
                移除
              </button>
            </div>
          ) : (
            <label className="drop" style={{ marginBottom: 12, padding: "24px 20px" }}>
              <div className="ic">🔄</div>
              <div className="t">{photoBusy ? "處理中⋯⋯" : "點這裡選第二張照片"}</div>
              <div className="s">沒有也沒關係，就不會有換圖效果</div>
              <input type="file" accept="image/*" onChange={(e) => onPhotoSelect(e, "image2")}
                style={{ display: "none" }} disabled={photoBusy} />
            </label>
          )}

          <div className="flabel">分類</div>
          <select className="field" value={form.category || DEFAULT_CATEGORY}
            onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c.key} value={c.key}>{c.name}</option>)}
          </select>

          {editing !== "new" && (
            <>
              <div className="flabel">輪播圖（選填，商品詳細頁會用主圖+這幾張輪播展示）</div>
              <div className="gallery-editor">
                {(products.find((p) => p.id === editing)?.gallery || []).map((img, i) => (
                  <div key={img} className="gallery-thumb">
                    <img src={resolveImageUrl(img)} alt="" />
                    <button className="add danger" onClick={() => onGalleryRemove(i)} disabled={galleryBusy}>✕</button>
                  </div>
                ))}
                <label className="gallery-add">
                  {galleryBusy ? "處理中" : "+ 新增"}
                  <input type="file" accept="image/*" onChange={onGalleryAdd} style={{ display: "none" }} disabled={galleryBusy} />
                </label>
              </div>
            </>
          )}
          {editing === "new" && (
            <p className="msg" style={{ marginBottom: 14 }}>先儲存商品，之後編輯時才能加輪播圖。</p>
          )}

          <label style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0 14px" }}>
            <input type="checkbox" checked={!!form.soldOut}
              onChange={(e) => setForm({ ...form, soldOut: e.target.checked })} />
            <span style={{ fontSize: 14 }}>手動標成售完（不管庫存多少，客人都無法加入購物袋）</span>
          </label>

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

      {!editing && !artEditing && !skillEditing && (
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
                <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8, background: "var(--blush)", color: "var(--rose-d)" }}>
                  {(CATEGORIES.find((c) => c.key === (p.category || DEFAULT_CATEGORY)) || CATEGORIES[0]).name}
                </span>
                <span style={{ fontSize: 12, color: "var(--ink2)" }}>庫存 {p.stock}</span>
                {p.soldOut && (
                  <span style={{ fontSize: 11, padding: "2px 8px", borderRadius: 8, background: "var(--ink)", color: "#fff" }}>
                    手動售完
                  </span>
                )}
                <button className="add soft" onClick={() => startEdit(p)} style={{ marginLeft: "auto" }}>編輯</button>
                <button className="add danger" onClick={() => del(p.id)}>下架</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {!editing && artEditing && (
        <div style={{ marginTop: 36 }}>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>
            {artEditing === "new" ? "寫新文章" : "編輯文章"}
          </h2>
          <div className="card">
            <div className="flabel">標題</div>
            <input className="field" value={artForm.title}
              onChange={(e) => setArtForm({ ...artForm, title: e.target.value })}
              placeholder="為什麼我要做這些工具" />

            <div className="flabel">分類標籤（選填）</div>
            <input className="field" value={artForm.tag}
              onChange={(e) => setArtForm({ ...artForm, tag: e.target.value })}
              placeholder="品牌故事" />

            <div className="flabel">封面圖（選填）</div>
            {artForm.cover ? (
              <div style={{ position: "relative", marginBottom: 12 }}>
                <img src={resolveImageUrl(artForm.cover)} alt="封面預覽"
                  style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 14 }} />
                <button className="add danger" onClick={() => setArtForm({ ...artForm, cover: null })}
                  style={{ position: "absolute", top: 10, right: 10, padding: "6px 14px", fontSize: 12 }}>
                  移除
                </button>
              </div>
            ) : (
              <label className="drop" style={{ marginBottom: 12, padding: "20px" }}>
                <div className="ic">🖼</div>
                <div className="t">點這裡選封面圖</div>
                <input type="file" accept="image/*" onChange={onArtCover} style={{ display: "none" }} />
              </label>
            )}

            <div className="flabel">內文（空一行分段）</div>
            <textarea className="field" value={artForm.body}
              onChange={(e) => setArtForm({ ...artForm, body: e.target.value })}
              placeholder="想說的話⋯⋯"
              style={{ minHeight: 240, lineHeight: 2 }} />

            <button className="btn" onClick={() => saveArticle(true)} disabled={artBusy}>
              {artBusy ? "儲存中⋯⋯" : "發布"}
            </button>
            <button className="btn soft" onClick={() => saveArticle(false)} disabled={artBusy}>
              存成草稿
            </button>
            <button className="btn soft" onClick={() => setArtEditing(null)}>取消</button>
            {artMsg && <p className={"msg " + artMsg.t}>{artMsg.m}</p>}
          </div>
        </div>
      )}

      {!editing && !artEditing && !skillEditing && (
        <div style={{ marginTop: 36 }}>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>文章</h2>
          <p className="sub">草稿只有你看得到，發布後才會出現在網站的文章頁。</p>

          <button className="btn" onClick={startNewArticle} style={{ marginBottom: 16 }}>
            + 寫新文章
          </button>

          {arts.length === 0 ? (
            <p className="msg">還沒有文章。</p>
          ) : (
            <div className="card">
              {arts.map((a) => (
                <div className="item" key={a.id}>
                  <div className="n" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span>{a.title}</span>
                    <span style={{
                      fontSize: 11, padding: "2px 10px", borderRadius: 10,
                      background: a.published ? "var(--mint-l)" : "var(--blush)",
                      color: a.published ? "var(--mint-d)" : "var(--rose-d)",
                    }}>
                      {a.published ? "已發布" : "草稿"}
                    </span>
                    <button className="add soft" style={{ marginLeft: "auto", padding: "5px 14px", fontSize: 12 }}
                      onClick={() => startEditArticle(a.id)}>編輯</button>
                    <button className="add danger" style={{ padding: "5px 14px", fontSize: 12 }}
                      onClick={() => delArticle(a.id)}>刪除</button>
                  </div>
                  <div className="y">{a.excerpt}</div>
                </div>
              ))}
            </div>
          )}
          {artMsg && <p className={"msg " + artMsg.t}>{artMsg.m}</p>}
        </div>
      )}

      {!editing && !artEditing && skillEditing && (
        <div style={{ marginTop: 36 }}>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>編輯 AI 工具</h2>
          <p className="sub">改的是展示內容，工具本身的判讀邏輯不受影響。</p>
          <div className="card">
            <div className="flabel">名稱</div>
            <input className="field" value={skillForm.name}
              onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div className="flabel">英文名</div>
                <input className="field" value={skillForm.en}
                  onChange={(e) => setSkillForm({ ...skillForm, en: e.target.value })} />
              </div>
              <div>
                <div className="flabel">價格</div>
                <input className="field" type="number" value={skillForm.price}
                  onChange={(e) => setSkillForm({ ...skillForm, price: e.target.value })} />
              </div>
            </div>

            <div className="flabel">一句話介紹</div>
            <textarea className="field" value={skillForm.blurb}
              onChange={(e) => setSkillForm({ ...skillForm, blurb: e.target.value })} />

            <div className="flabel">功能重點（最多三點，留空的不會顯示）</div>
            {skillForm.feat.map((f, i) => (
              <input key={i} className="field" value={f} placeholder={`第 ${i + 1} 點`}
                onChange={(e) => {
                  const feat = [...skillForm.feat];
                  feat[i] = e.target.value;
                  setSkillForm({ ...skillForm, feat });
                }} />
            ))}

            <div className="flabel">使用限制（安全界線，建議保留）</div>
            <textarea className="field" value={skillForm.limit}
              onChange={(e) => setSkillForm({ ...skillForm, limit: e.target.value })} />

            <div className="flabel">主圖（選填，顯示在商品卡片上，沒有的話會用 emoji 圓標代替）</div>
            {skillForm.image ? (
              <div style={{ position: "relative", marginBottom: 12 }}>
                <img src={resolveImageUrl(skillForm.image)} alt="主圖預覽"
                  style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 16 }} />
                <button className="add danger" onClick={() => setSkillForm({ ...skillForm, image: null })}
                  style={{ position: "absolute", top: 10, right: 10, padding: "8px 16px", fontSize: 13 }}>
                  移除
                </button>
              </div>
            ) : (
              <label className="drop" style={{ marginBottom: 12, padding: "24px 20px" }}>
                <div className="ic">📷</div>
                <div className="t">點這裡選一張照片</div>
                <div className="s">會自動壓縮，手機拍的照片也能直接用</div>
                <input type="file" accept="image/*" onChange={(e) => onSkillPhoto(e, "image")} style={{ display: "none" }} />
              </label>
            )}

            <div className="flabel">第二張圖（選填，客人滑鼠移到卡片上會換成這張）</div>
            {skillForm.image2 ? (
              <div style={{ position: "relative", marginBottom: 12 }}>
                <img src={resolveImageUrl(skillForm.image2)} alt="第二張圖預覽"
                  style={{ width: "100%", aspectRatio: "4/3", objectFit: "cover", borderRadius: 16 }} />
                <button className="add danger" onClick={() => setSkillForm({ ...skillForm, image2: null })}
                  style={{ position: "absolute", top: 10, right: 10, padding: "8px 16px", fontSize: 13 }}>
                  移除
                </button>
              </div>
            ) : (
              <label className="drop" style={{ marginBottom: 12, padding: "24px 20px" }}>
                <div className="ic">🔄</div>
                <div className="t">點這裡選第二張照片</div>
                <div className="s">沒有也沒關係，就不會有換圖效果</div>
                <input type="file" accept="image/*" onChange={(e) => onSkillPhoto(e, "image2")} style={{ display: "none" }} />
              </label>
            )}

            <div className="flabel">氛圍圖（選填，顯示在商品頁最上面）</div>
            {skillForm.moodImage ? (
              <div style={{ position: "relative", marginBottom: 12 }}>
                <img src={resolveImageUrl(skillForm.moodImage)} alt="氛圍圖預覽"
                  style={{ width: "100%", aspectRatio: "16/9", objectFit: "cover", borderRadius: 14 }} />
                <button className="add danger" onClick={() => setSkillForm({ ...skillForm, moodImage: null })}
                  style={{ position: "absolute", top: 10, right: 10, padding: "6px 14px", fontSize: 12 }}>
                  移除
                </button>
              </div>
            ) : (
              <label className="drop" style={{ marginBottom: 12, padding: "20px" }}>
                <div className="ic">🖼</div>
                <div className="t">點這裡選氛圍圖</div>
                <input type="file" accept="image/*" onChange={(e) => onSkillPhoto(e, "moodImage")} style={{ display: "none" }} />
              </label>
            )}

            <div className="flabel">輪播圖（選填，商品詳細頁會用主圖+這幾張輪播展示）</div>
            <div className="gallery-editor">
              {(skills.find((s) => s.id === skillEditing)?.gallery || []).map((img, i) => (
                <div key={img} className="gallery-thumb">
                  <img src={resolveImageUrl(img)} alt="" />
                  <button className="add danger" onClick={() => onSkillGalleryRemove(i)} disabled={skillBusy}>✕</button>
                </div>
              ))}
              <label className="gallery-add">
                {skillBusy ? "處理中" : "+ 新增"}
                <input type="file" accept="image/*" onChange={onSkillGalleryAdd} style={{ display: "none" }} disabled={skillBusy} />
              </label>
            </div>

            <button className="btn" onClick={saveSkill} disabled={skillBusy}>
              {skillBusy ? "儲存中⋯⋯" : "儲存"}
            </button>
            <button className="btn soft" onClick={() => setSkillEditing(null)}>取消</button>
            <button className="btn soft" onClick={() => resetSkill(skillEditing)} disabled={skillBusy}>
              還原成原本的內容
            </button>
            {skillMsg && <p className={"msg " + skillMsg.t}>{skillMsg.m}</p>}
          </div>
        </div>
      )}

      {!editing && !artEditing && !skillEditing && (
        <div style={{ marginTop: 36 }}>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>AI 工具</h2>
          <p className="sub">可以改名稱、介紹、價格、展示圖，跟水晶商品一樣。工具本身的判讀邏輯寫在程式裡，不會被這裡改到。</p>
          <div className="card">
            {skills.map((sk) => (
              <div className="item" key={sk.id}>
                <div className="n" style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span>{sk.emoji} {sk.name}</span>
                  <span style={{ fontFamily: "var(--sans)", fontWeight: 700 }}>{money(sk.price)}</span>
                  <button className="add soft" style={{ marginLeft: "auto", padding: "5px 14px", fontSize: 12 }}
                    onClick={() => startEditSkill(sk)}>編輯</button>
                </div>
                <div className="y">{sk.blurb}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {!editing && !artEditing && !skillEditing && ann && (
        <div style={{ marginTop: 36 }}>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>首頁公告彈窗</h2>
          <p className="sub">訪客第一次進首頁時會跳出來，關掉之後同一次瀏覽不會再跳。</p>

          <div className="card">
            <label style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
              <input type="checkbox" checked={ann.enabled}
                onChange={(e) => setAnn({ ...ann, enabled: e.target.checked })} />
              <span style={{ fontSize: 14 }}>啟用公告彈窗</span>
            </label>

            <div className="flabel">小標籤（顯示在最上面，選填）</div>
            <input className="field" value={ann.title || ""}
              onChange={(e) => setAnn({ ...ann, title: e.target.value })} placeholder="新上架" />

            <div className="flabel">標題</div>
            <input className="field" value={ann.heading || ""}
              onChange={(e) => setAnn({ ...ann, heading: e.target.value })} placeholder="自媒體爆款短片生成器" />

            <div className="flabel">內文</div>
            <textarea className="field" value={ann.body || ""}
              onChange={(e) => setAnn({ ...ann, body: e.target.value })}
              placeholder="想跟客人說的話" />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <div className="flabel">按鈕文字</div>
                <input className="field" value={ann.ctaText || ""}
                  onChange={(e) => setAnn({ ...ann, ctaText: e.target.value })} placeholder="看完整介紹" />
              </div>
              <div>
                <div className="flabel">按鈕連結</div>
                <input className="field" value={ann.ctaLink || ""}
                  onChange={(e) => setAnn({ ...ann, ctaLink: e.target.value })}
                  placeholder="/skill/viral-video-script" />
              </div>
            </div>

            <button className="btn" onClick={saveAnnouncement} disabled={annBusy}>
              {annBusy ? "儲存中⋯⋯" : "儲存公告"}
            </button>
            {annMsg && <p className={"msg " + annMsg.t}>{annMsg.m}</p>}
          </div>
        </div>
      )}

      {!editing && !artEditing && !skillEditing && social && (
        <div style={{ marginTop: 36 }}>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>外部連結</h2>
          <p className="sub">留空的連結，網站上對應的按鈕就不會顯示。</p>

          <div className="card">
            <div className="flabel">LINE 官方帳號連結</div>
            <input className="field" value={social.lineUrl || ""}
              onChange={(e) => setSocial({ ...social, lineUrl: e.target.value })}
              placeholder="https://line.me/ti/p/xxxxx" />

            <div className="flabel">Instagram 連結</div>
            <input className="field" value={social.igUrl || ""}
              onChange={(e) => setSocial({ ...social, igUrl: e.target.value })}
              placeholder="https://instagram.com/你的帳號" />

            <div className="flabel">方格子（vocus）部落格連結</div>
            <input className="field" value={social.vocusUrl || ""}
              onChange={(e) => setSocial({ ...social, vocusUrl: e.target.value })}
              placeholder="https://vocus.cc/user/xxxxx" />

            <button className="btn" onClick={saveSocial} disabled={socialBusy}>
              {socialBusy ? "儲存中⋯⋯" : "儲存"}
            </button>
            {socialMsg && <p className={"msg " + socialMsg.t}>{socialMsg.m}</p>}
          </div>
        </div>
      )}

      {!editing && !artEditing && !skillEditing && (
        <div style={{ marginTop: 36 }}>
          <h2 style={{ fontSize: 22, marginBottom: 4 }}>折扣碼產生器</h2>
          <p className="sub">每組碼打七折，只限數位工具（不含實體商品與訂閱），用過一次就失效。</p>

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
