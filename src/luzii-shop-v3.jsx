import { useState, useEffect, useRef, useCallback } from "react";

const G = `
@import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,500;0,600;1,300;1,400&family=Jost:wght@300;400;500;600&display=swap');
*,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
html{scroll-behavior:smooth;}
body{font-family:'Jost',sans-serif;-webkit-font-smoothing:antialiased;}
input,textarea,select,button{font-family:'Jost',sans-serif;}
button{cursor:pointer;}
::-webkit-scrollbar{width:4px;}
::-webkit-scrollbar-thumb{background:#ddd;}
@keyframes fadeUp{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:translateY(0)}}
@keyframes fadeIn{from{opacity:0}to{opacity:1}}
@keyframes scaleIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
@keyframes spin{to{transform:rotate(360deg)}}
@keyframes ticker{0%{transform:translateX(0)}100%{transform:translateX(-50%)}}
@keyframes notif{0%{opacity:0;transform:translateY(-10px)}15%,85%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-10px)}}
@keyframes slideRight{from{transform:translateX(-100%)}to{transform:translateX(0)}}
@keyframes imgSlide{from{opacity:0;transform:scale(1.03)}to{opacity:1;transform:scale(1)}}
.fade-up{animation:fadeUp .5s cubic-bezier(.25,.8,.25,1) both;}
.fade-in{animation:fadeIn .3s ease both;}
.scale-in{animation:scaleIn .3s cubic-bezier(.25,.8,.25,1) both;}
.hover-lift{transition:transform .25s ease;}
.hover-lift:hover{transform:translateY(-3px);}
.img-slide{animation:imgSlide .35s ease both;}
`;

const DEFAULT_THEME = {
  cream:"#faf9f7", warm:"#f5f0e8", stone:"#e8e0d5", taupe:"#c4b5a0",
  brown:"#8b7355", bark:"#5c4a32", dark:"#2c2422", accent:"#9b7e5c",
  tickerBg:"#5c4a32", tickerText:"#ffffff",
};
const DEFAULT_SITE = {
  logoText:"Luzii", logoSub:"Official", logoImg:null, fontStyle:"serif",
  tickerMsg:"全館滿 $1999 免運費　｜　現貨商品 48小時出貨　｜　新品每週四上架　｜　",
  bannerImg:null, bannerEmoji:"👗",
  bannerTitle:"春夏\n新品上市",
  bannerSub:"全館滿 $1999 免運費\n新會員首購享 9 折優惠",
};

const SEED_CATS = [
  {id:"c1",name:"本月新品",sub:[]},
  {id:"c2",name:"甜甜價專區",sub:[]},
  {id:"c3",name:"限時．限定",sub:[]},
  {id:"c5",name:"上半身類",sub:["T恤","襯衫","針織上衣","背心"]},
  {id:"c6",name:"下半身類",sub:["牛仔褲","寬褲","裙子","短褲"]},
  {id:"c7",name:"現貨專區｜48hr",sub:[]},
];
// images: array of {id, src} — src is base64 or emoji fallback
const SEED_PRODS = [
  {id:"p1",catId:"c1",name:"奶油白純棉短袖T",price:680,origPrice:null,stock:15,tag:"新品",emoji:"👕",images:[],desc:"100% 純棉，柔軟親膚，修身剪裁，百搭首選。",sizes:["S","M","L","XL"]},
  {id:"p2",catId:"c6",name:"高腰直筒牛仔褲",price:1280,origPrice:null,stock:8,tag:"熱銷",emoji:"👖",images:[],desc:"經典高腰剪裁，顯瘦拉腿，適合各種身形。",sizes:["S","M","L","XL","2XL"]},
  {id:"p3",catId:"c2",name:"輕薄針織開襟衫",price:590,origPrice:880,stock:20,tag:"特價",emoji:"🧥",images:[],desc:"春夏必備輕薄針織，透氣舒適，可單穿或疊搭。",sizes:["S","M","L"]},
  {id:"p4",catId:"c3",name:"限定格紋寬褲",price:980,origPrice:null,stock:5,tag:"限量",emoji:"🩲",images:[],desc:"復古格紋面料，寬鬆廓形，限量發售。",sizes:["S","M","L"]},
  {id:"p5",catId:"c5",name:"法式蕾絲背心",price:490,origPrice:680,stock:12,tag:"特價",emoji:"👗",images:[],desc:"精緻蕾絲邊飾，浪漫法式風情，可內搭外穿。",sizes:["S","M","L","XL"]},
  {id:"p6",catId:"c7",name:"現貨｜亞麻寬褲",price:760,origPrice:null,stock:18,tag:"現貨",emoji:"🩳",images:[],desc:"天然亞麻材質，透氣涼爽，下單48小時出貨。",sizes:["S","M","L","XL"]},
];
const PURCHASE_NOTIFS = ["林 *** 剛購買了 高腰直筒牛仔褲","王 *** 剛購買了 奶油白純棉短袖T","陳 *** 剛購買了 法式蕾絲背心"];
const PRESET_THEMES = [
  {name:"大地米白",colors:{cream:"#faf9f7",warm:"#f5f0e8",stone:"#e8e0d5",taupe:"#c4b5a0",brown:"#8b7355",bark:"#5c4a32",dark:"#2c2422",accent:"#9b7e5c",tickerBg:"#5c4a32",tickerText:"#ffffff"}},
  {name:"霧粉玫瑰",colors:{cream:"#fff6f6",warm:"#fde8e8",stone:"#f5d0d0",taupe:"#d4a0a0",brown:"#a06060",bark:"#7a3a3a",dark:"#3a2020",accent:"#c07070",tickerBg:"#7a3a3a",tickerText:"#ffffff"}},
  {name:"森林墨綠",colors:{cream:"#f4f8f5",warm:"#e6f0ea",stone:"#c8ddd0",taupe:"#8aad98",brown:"#4a7a60",bark:"#2d5a42",dark:"#1a3028",accent:"#5a8a6e",tickerBg:"#2d5a42",tickerText:"#ffffff"}},
  {name:"午夜藍黑",colors:{cream:"#f4f6f9",warm:"#e8edf5",stone:"#c8d4e8",taupe:"#7a90b4",brown:"#3a5480",bark:"#1c3060",dark:"#0e1c38",accent:"#4a6aaa",tickerBg:"#1c3060",tickerText:"#ffffff"}},
  {name:"奶茶焦糖",colors:{cream:"#fdf8f2",warm:"#f5edde",stone:"#ead8bf",taupe:"#c8a878",brown:"#9a7040",bark:"#6a4820",dark:"#3a2810",accent:"#b08848",tickerBg:"#6a4820",tickerText:"#ffffff"}},
  {name:"純黑極簡",colors:{cream:"#ffffff",warm:"#f5f5f5",stone:"#e0e0e0",taupe:"#a0a0a0",brown:"#505050",bark:"#282828",dark:"#121212",accent:"#666666",tickerBg:"#121212",tickerText:"#ffffff"}},
];

const uid = () => Math.random().toString(36).slice(2,9);
const fmt = n => `NT$ ${Number(n).toLocaleString()}`;
const cssVars = t => Object.entries(t).map(([k,v])=>`--${k}:${v}`).join(";");

/* ─── read files as base64 ─────────────────────────────────────────────── */
function readFiles(files) {
  return Promise.all(Array.from(files).map(f => new Promise(res => {
    const r = new FileReader();
    r.onload = e => res({ id: uid(), src: e.target.result, name: f.name });
    r.readAsDataURL(f);
  })));
}

/* ─── Image display: real photo OR emoji fallback ──────────────────────── */
function ProductImg({ p, idx = 0, style = {}, className = "" }) {
  const imgs = p.images || [];
  const src = imgs[idx]?.src;
  if (src) return <img src={src} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", ...style }} className={className}/>;
  return <span style={{ fontSize: 80, display:"flex", alignItems:"center", justifyContent:"center", width:"100%", height:"100%", ...style }}>{p.emoji || "📦"}</span>;
}

/* ─── Multi-image carousel ─────────────────────────────────────────────── */
function ImageCarousel({ p, height = 420 }) {
  const [idx, setIdx] = useState(0);
  const imgs = p.images || [];
  const total = imgs.length || 1;

  useEffect(() => setIdx(0), [p.id]);

  const prev = () => setIdx(i => (i - 1 + total) % total);
  const next = () => setIdx(i => (i + 1) % total);

  return (
    <div style={{ position:"relative", height, background:"var(--warm)", overflow:"hidden", userSelect:"none" }}>
      {/* Main image */}
      <div key={idx} className="img-slide" style={{ width:"100%", height:"100%", display:"flex", alignItems:"center", justifyContent:"center" }}>
        {imgs.length > 0
          ? <img src={imgs[idx].src} alt={p.name} style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
          : <span style={{ fontSize: 110 }}>{p.emoji || "📦"}</span>
        }
      </div>

      {/* Arrows (only when >1 image) */}
      {imgs.length > 1 && <>
        <button onClick={prev} style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", background:"rgba(255,255,255,.82)", border:"none", width:36, height:36, borderRadius:"50%", fontSize:16, cursor:"pointer", boxShadow:"0 2px 8px rgba(0,0,0,.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
        <button onClick={next} style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", background:"rgba(255,255,255,.82)", border:"none", width:36, height:36, borderRadius:"50%", fontSize:16, cursor:"pointer", boxShadow:"0 2px 8px rgba(0,0,0,.15)", display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>

        {/* Dot indicators */}
        <div style={{ position:"absolute", bottom:12, left:"50%", transform:"translateX(-50%)", display:"flex", gap:5 }}>
          {imgs.map((_,i) => (
            <button key={i} onClick={()=>setIdx(i)} style={{ width: i===idx?20:7, height:7, borderRadius:4, border:"none", background: i===idx?"var(--dark)":"rgba(255,255,255,.7)", cursor:"pointer", transition:"all .2s", padding:0 }}/>
          ))}
        </div>
      </>}

      {/* Image counter badge */}
      {imgs.length > 1 && (
        <div style={{ position:"absolute", top:12, right:12, background:"rgba(44,36,34,.55)", color:"#fff", fontSize:11, padding:"3px 9px", borderRadius:20, letterSpacing:"0.05em" }}>
          {idx+1} / {imgs.length}
        </div>
      )}
    </div>
  );
}

/* ─── Thumbnail strip ──────────────────────────────────────────────────── */
function ThumbnailStrip({ p, activeIdx, onSelect }) {
  const imgs = p.images || [];
  if (imgs.length <= 1) return null;
  return (
    <div style={{ display:"flex", gap:8, padding:"10px 0", overflowX:"auto" }}>
      {imgs.map((img, i) => (
        <button key={img.id} onClick={() => onSelect(i)} style={{
          flexShrink:0, width:60, height:68, border:`2px solid ${i===activeIdx?"var(--dark)":"var(--stone)"}`,
          padding:0, background:"var(--warm)", overflow:"hidden", cursor:"pointer", transition:"border .15s",
        }}>
          <img src={img.src} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
        </button>
      ))}
    </div>
  );
}

/* ─── Multi-image uploader (used in admin product form) ────────────────── */
function MultiImageUploader({ images, onChange }) {
  const fileRef = useRef();
  const [dragging, setDragging] = useState(false);

  const handleFiles = async (files) => {
    const newImgs = await readFiles(files);
    onChange([...images, ...newImgs]);
  };

  const remove = (id) => onChange(images.filter(i => i.id !== id));
  const moveLeft  = (i) => { if(i===0)return; const a=[...images]; [a[i-1],a[i]]=[a[i],a[i-1]]; onChange(a); };
  const moveRight = (i) => { if(i===images.length-1)return; const a=[...images]; [a[i],a[i+1]]=[a[i+1],a[i]]; onChange(a); };

  return (
    <div style={{ marginBottom:18 }}>
      <label style={{ display:"block", fontSize:11, letterSpacing:"0.1em", textTransform:"uppercase", color:"var(--brown)", marginBottom:8, fontWeight:500 }}>
        商品圖片（可上傳多張）
      </label>

      {/* Drop zone */}
      <div
        onDragOver={e=>{e.preventDefault();setDragging(true);}}
        onDragLeave={()=>setDragging(false)}
        onDrop={async e=>{e.preventDefault();setDragging(false);await handleFiles(e.dataTransfer.files);}}
        onClick={()=>fileRef.current.click()}
        style={{
          border:`2px dashed ${dragging?"var(--dark)":"var(--stone)"}`,
          background: dragging?"var(--warm)":"#fafafa",
          padding:"20px", textAlign:"center", cursor:"pointer",
          transition:"all .2s", marginBottom:12,
        }}
      >
        <div style={{ fontSize:28, marginBottom:6 }}>📸</div>
        <div style={{ fontSize:13, color:"var(--brown)", marginBottom:3 }}>點擊或拖曳圖片到此上傳</div>
        <div style={{ fontSize:11, color:"var(--taupe)" }}>支援 JPG、PNG、WEBP，可一次選多張</div>
        <input ref={fileRef} type="file" accept="image/*" multiple style={{ display:"none" }} onChange={e=>handleFiles(e.target.files)}/>
      </div>

      {/* Uploaded thumbnails */}
      {images.length > 0 && (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(88px,1fr))", gap:8 }}>
          {images.map((img, i) => (
            <div key={img.id} style={{ position:"relative", border:"1.5px solid var(--stone)", overflow:"hidden" }}>
              <img src={img.src} alt="" style={{ width:"100%", aspectRatio:"1", objectFit:"cover", display:"block" }}/>

              {/* First badge */}
              {i===0 && <div style={{ position:"absolute", top:4, left:4, background:"var(--dark)", color:"#fff", fontSize:9, padding:"2px 6px", letterSpacing:"0.08em" }}>封面</div>}

              {/* Controls overlay */}
              <div style={{ position:"absolute", inset:0, background:"rgba(44,36,34,.0)", display:"flex", flexDirection:"column", justifyContent:"space-between", padding:4 }}>
                <div style={{ display:"flex", justifyContent:"flex-end" }}>
                  <button onClick={()=>remove(img.id)} style={{ background:"rgba(192,57,43,.85)", border:"none", color:"#fff", width:20, height:20, fontSize:11, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", borderRadius:"50%" }}>✕</button>
                </div>
                <div style={{ display:"flex", gap:3, justifyContent:"center" }}>
                  <button onClick={()=>moveLeft(i)} disabled={i===0} style={{ background:"rgba(255,255,255,.8)", border:"none", width:20, height:20, fontSize:11, cursor:i===0?"not-allowed":"pointer", opacity:i===0?.35:1, display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
                  <button onClick={()=>moveRight(i)} disabled={i===images.length-1} style={{ background:"rgba(255,255,255,.8)", border:"none", width:20, height:20, fontSize:11, cursor:i===images.length-1?"not-allowed":"pointer", opacity:i===images.length-1?.35:1, display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
                </div>
              </div>
            </div>
          ))}
          {/* Add more button */}
          <div onClick={()=>fileRef.current.click()} style={{ border:"2px dashed var(--stone)", aspectRatio:"1", display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", cursor:"pointer", gap:4, color:"var(--taupe)", fontSize:11 }}>
            <span style={{ fontSize:22 }}>＋</span>
            <span>新增</span>
          </div>
        </div>
      )}
      {images.length > 0 && <div style={{ fontSize:11, color:"var(--taupe)", marginTop:8 }}>第一張為封面圖。拖曳 ‹ › 調整順序，✕ 刪除。</div>}
    </div>
  );
}

/* ─── Shared UI ─────────────────────────────────────────────────────────── */
function Btn({children,onClick,v="primary",size="md",full=false,disabled=false,style={}}) {
  const pad={sm:"7px 18px",md:"11px 28px",lg:"14px 40px"}[size];
  const fs={sm:11,md:13,lg:15}[size];
  const vs={
    primary:{background:"var(--dark)",color:"#fff",border:"1.5px solid var(--dark)"},
    outline:{background:"transparent",color:"var(--dark)",border:"1.5px solid var(--dark)"},
    ghost:{background:"transparent",color:"var(--brown)",border:"1.5px solid var(--stone)"},
    danger:{background:"#c0392b",color:"#fff",border:"1.5px solid #c0392b"},
    accent:{background:"var(--accent)",color:"#fff",border:"1.5px solid var(--accent)"},
  };
  return <button disabled={disabled} onClick={onClick} style={{padding:pad,fontSize:fs,fontWeight:500,letterSpacing:"0.08em",textTransform:"uppercase",borderRadius:0,transition:"all .2s",display:"inline-flex",alignItems:"center",gap:7,width:full?"100%":"auto",justifyContent:full?"center":"flex-start",opacity:disabled?.55:1,cursor:disabled?"not-allowed":"pointer",...vs[v],...style}}>{children}</button>;
}

function FInput({label,value,onChange,type="text",placeholder="",error="",required=false,hint=""}) {
  const [focus,setFocus]=useState(false);
  return (
    <div style={{marginBottom:16}}>
      {label&&<label style={{display:"block",fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--brown)",marginBottom:6,fontWeight:500}}>{label}{required&&<span style={{color:"#c0392b"}}> *</span>}</label>}
      {hint&&<div style={{fontSize:11,color:"var(--taupe)",marginBottom:5}}>{hint}</div>}
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} onFocus={()=>setFocus(true)} onBlur={()=>setFocus(false)}
        style={{width:"100%",padding:"10px 13px",fontSize:14,border:`1.5px solid ${error?"#c0392b":focus?"var(--brown)":"var(--stone)"}`,borderRadius:0,background:"#fff",outline:"none",color:"var(--dark)",transition:"border .15s"}}/>
      {error&&<div style={{fontSize:11,color:"#c0392b",marginTop:4}}>{error}</div>}
    </div>
  );
}

function Modal({show,onClose,title,children,width=520}) {
  if(!show)return null;
  return (
    <div className="fade-in" style={{position:"fixed",inset:0,background:"rgba(44,36,34,.55)",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="scale-in" style={{background:"#fff",width:"100%",maxWidth:width,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 24px 80px rgba(0,0,0,.2)"}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"20px 26px 16px",borderBottom:"1px solid var(--stone)"}}>
          <span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:19,color:"var(--dark)",letterSpacing:"0.04em"}}>{title}</span>
          <button onClick={onClose} style={{background:"none",border:"none",fontSize:18,color:"var(--taupe)",cursor:"pointer"}}>✕</button>
        </div>
        <div style={{padding:"22px 26px"}}>{children}</div>
      </div>
    </div>
  );
}

/* ─── Purchase Notif ────────────────────────────────────────────────────── */
function PurchaseNotif() {
  const [visible,setVisible]=useState(false);const[msg,setMsg]=useState("");const idx=useRef(0);
  useEffect(()=>{const show=()=>{setMsg(PURCHASE_NOTIFS[idx.current++%PURCHASE_NOTIFS.length]);setVisible(true);setTimeout(()=>setVisible(false),4500);};const t=setInterval(show,7000);setTimeout(show,2500);return()=>clearInterval(t);},[]);
  if(!visible)return null;
  return <div style={{position:"fixed",bottom:24,left:20,zIndex:1500,background:"#fff",border:"1px solid var(--stone)",padding:"12px 16px",display:"flex",alignItems:"center",gap:12,boxShadow:"0 8px 32px rgba(0,0,0,.1)",animation:"notif 4.5s ease both",maxWidth:300}}><div style={{width:34,height:34,background:"var(--warm)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:17,flexShrink:0}}>👟</div><div><div style={{fontSize:10,color:"var(--taupe)",marginBottom:2}}>6 天前</div><div style={{fontSize:12,color:"var(--dark)",fontWeight:500,lineHeight:1.4}}>{msg}</div></div></div>;
}

/* ══════════════════════════════════════════════════════════════════════════
   PRODUCT CARD
══════════════════════════════════════════════════════════════════════════ */
function ProductCard({ p, tagStyle, delay, onView }) {
  const [hov, setHov] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const imgs = p.images || [];
  const ts = tagStyle[p.tag] || { bg:"#f0ede8", c:"#8b7355" };

  // Auto-cycle on hover when multiple images
  useEffect(() => {
    if (!hov || imgs.length <= 1) return;
    const t = setInterval(() => setImgIdx(i => (i + 1) % imgs.length), 1200);
    return () => clearInterval(t);
  }, [hov, imgs.length]);
  useEffect(() => { if (!hov) setImgIdx(0); }, [hov]);

  return (
    <div className="fade-up hover-lift" style={{ animationDelay:`${delay}s`, cursor:"pointer" }} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)} onClick={onView}>
      <div style={{ position:"relative", background:"var(--warm)", aspectRatio:"3/4", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center" }}>
        {/* Image / emoji */}
        {imgs.length > 0
          ? <img key={imgIdx} src={imgs[imgIdx].src} alt={p.name} className="img-slide" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block", transition:"opacity .3s" }}/>
          : <span style={{ fontSize:76, transition:"transform .3s", transform:hov?"scale(1.07)":"scale(1)" }}>{p.emoji||"📦"}</span>
        }

        {/* Tag */}
        {p.tag && <div style={{ position:"absolute", top:11, left:11, background:ts.bg, color:ts.c, fontSize:10, letterSpacing:"0.1em", padding:"3px 9px", fontWeight:600, textTransform:"uppercase" }}>{p.tag}</div>}

        {/* Image count badge */}
        {imgs.length > 1 && <div style={{ position:"absolute", top:11, right:11, background:"rgba(44,36,34,.5)", color:"#fff", fontSize:10, padding:"2px 7px", borderRadius:12 }}>+{imgs.length}</div>}

        {/* Dot nav for multi-image */}
        {imgs.length > 1 && hov && (
          <div style={{ position:"absolute", bottom:10, left:"50%", transform:"translateX(-50%)", display:"flex", gap:4 }}>
            {imgs.map((_,i) => <span key={i} style={{ width:i===imgIdx?14:5, height:5, borderRadius:3, background:"rgba(255,255,255,.9)", transition:"width .2s", display:"block" }}/>)}
          </div>
        )}

        {hov && <div className="fade-in" style={{ position:"absolute", bottom:0, left:0, right:0, padding:"12px 14px", background:"rgba(44,36,34,.88)" }}><Btn v="ghost" full size="sm" style={{ color:"#fff", border:"1px solid rgba(255,255,255,.4)", justifyContent:"center" }}>選擇尺寸</Btn></div>}
      </div>
      <div style={{ paddingTop:12 }}>
        <div style={{ fontSize:14, fontWeight:500, marginBottom:5 }}>{p.name}</div>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <span style={{ fontSize:14, fontWeight:500 }}>{fmt(p.price)}</span>
          {p.origPrice && <span style={{ fontSize:12, color:"var(--taupe)", textDecoration:"line-through" }}>{fmt(p.origPrice)}</span>}
        </div>
        <div style={{ fontSize:11, color:"var(--taupe)", marginTop:3 }}>庫存：{p.stock} 件</div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   PRODUCT DETAIL MODAL — full carousel + thumbnail strip
══════════════════════════════════════════════════════════════════════════ */
function ProductDetailModal({ p, tagStyle, onClose, onAdd }) {
  const [size, setSize] = useState(null);
  const [err, setErr] = useState(false);
  const [imgIdx, setImgIdx] = useState(0);
  const imgs = p.images || [];
  const ts = tagStyle[p.tag] || { bg:"#f0ede8", c:"#8b7355" };

  const prevImg = () => setImgIdx(i => (i - 1 + Math.max(imgs.length,1)) % Math.max(imgs.length,1));
  const nextImg = () => setImgIdx(i => (i + 1) % Math.max(imgs.length,1));

  return (
    <div className="fade-in" style={{ position:"fixed", inset:0, background:"rgba(44,36,34,.55)", zIndex:1500, display:"flex", alignItems:"center", justifyContent:"center", padding:16 }} onClick={e=>e.target===e.currentTarget&&onClose()}>
      <div className="scale-in" style={{ background:"#fff", width:"100%", maxWidth:760, maxHeight:"92vh", display:"flex", overflow:"hidden" }}>

        {/* ── Left: image panel ── */}
        <div style={{ flex:"0 0 46%", display:"flex", flexDirection:"column", background:"var(--warm)", position:"relative" }}>
          {/* Main display */}
          <div style={{ flex:1, position:"relative", overflow:"hidden", display:"flex", alignItems:"center", justifyContent:"center", minHeight:0 }}>
            {imgs.length > 0
              ? <img key={imgIdx} src={imgs[imgIdx].src} alt={p.name} className="img-slide" style={{ width:"100%", height:"100%", objectFit:"cover" }}/>
              : <span style={{ fontSize:100 }}>{p.emoji||"📦"}</span>
            }
            {imgs.length > 1 && <>
              <button onClick={prevImg} style={{ position:"absolute", left:8, top:"50%", transform:"translateY(-50%)", background:"rgba(255,255,255,.82)", border:"none", width:32, height:32, borderRadius:"50%", fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>‹</button>
              <button onClick={nextImg} style={{ position:"absolute", right:8, top:"50%", transform:"translateY(-50%)", background:"rgba(255,255,255,.82)", border:"none", width:32, height:32, borderRadius:"50%", fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>›</button>
              <div style={{ position:"absolute", bottom:8, right:10, background:"rgba(44,36,34,.5)", color:"#fff", fontSize:10, padding:"2px 8px", borderRadius:12 }}>{imgIdx+1}/{imgs.length}</div>
            </>}
          </div>

          {/* Thumbnail strip */}
          {imgs.length > 1 && (
            <div style={{ display:"flex", gap:6, padding:"8px 10px", borderTop:"1px solid var(--stone)", overflowX:"auto", background:"#fff" }}>
              {imgs.map((img, i) => (
                <button key={img.id} onClick={()=>setImgIdx(i)} style={{ flexShrink:0, width:52, height:58, padding:0, border:`2px solid ${i===imgIdx?"var(--dark)":"var(--stone)"}`, background:"var(--warm)", overflow:"hidden", cursor:"pointer", transition:"border .15s" }}>
                  <img src={img.src} alt="" style={{ width:"100%", height:"100%", objectFit:"cover", display:"block" }}/>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Right: info panel ── */}
        <div style={{ flex:1, padding:"28px 30px", overflowY:"auto", display:"flex", flexDirection:"column" }}>
          <button onClick={onClose} style={{ alignSelf:"flex-end", background:"none", border:"none", fontSize:18, color:"var(--taupe)", marginBottom:12, cursor:"pointer" }}>✕</button>
          {p.tag && <div style={{ display:"inline-block", background:ts.bg, color:ts.c, fontSize:10, letterSpacing:"0.1em", padding:"3px 10px", marginBottom:12, fontWeight:600, textTransform:"uppercase", width:"fit-content" }}>{p.tag}</div>}
          <div style={{ fontFamily:"'Cormorant Garamond',serif", fontSize:24, fontWeight:400, marginBottom:8, letterSpacing:"0.02em" }}>{p.name}</div>
          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:14 }}>
            <span style={{ fontSize:20, fontWeight:500 }}>{fmt(p.price)}</span>
            {p.origPrice && <span style={{ fontSize:13, color:"var(--taupe)", textDecoration:"line-through" }}>{fmt(p.origPrice)}</span>}
          </div>
          <div style={{ fontSize:13, color:"var(--brown)", lineHeight:1.8, marginBottom:22 }}>{p.desc}</div>

          {/* Size picker */}
          <div style={{ marginBottom:22 }}>
            <div style={{ fontSize:11, letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--brown)", marginBottom:10 }}>選擇尺寸</div>
            <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
              {p.sizes?.map(s => (
                <button key={s} onClick={()=>{setSize(s);setErr(false);}} style={{ width:42, height:42, border:`1.5px solid ${size===s?"var(--dark)":"var(--stone)"}`, background:size===s?"var(--dark)":"#fff", color:size===s?"#fff":"var(--dark)", fontSize:12, fontWeight:500, cursor:"pointer", transition:"all .15s" }}>{s}</button>
              ))}
            </div>
            {err && <div style={{ fontSize:11, color:"#c0392b", marginTop:7 }}>請選擇尺寸</div>}
          </div>

          <Btn full size="lg" onClick={()=>{ if(!size){setErr(true);return;} onAdd(p,size); }}>加入購物袋</Btn>
          <div style={{ fontSize:11, color:"var(--taupe)", marginTop:12, lineHeight:1.7 }}>庫存：{p.stock} 件｜下單後 3-5 個工作天出貨</div>

          {/* Image counter info */}
          {imgs.length > 0 && <div style={{ fontSize:11, color:"var(--taupe)", marginTop:6 }}>共 {imgs.length} 張商品照片</div>}
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   AUTH MODAL
══════════════════════════════════════════════════════════════════════════ */
function AuthModal({show,mode,onClose,onSuccess,switchMode}) {
  const [f,setF]=useState({name:"",email:"",password:"",confirm:""});const[e,setE]=useState({});const[loading,setLoading]=useState(false);
  const val=()=>{const er={};if(mode==="register"&&!f.name.trim())er.name="請填寫姓名";if(!f.email.includes("@"))er.email="請輸入正確 Email";if(f.password.length<6)er.password="密碼至少 6 個字元";if(mode==="register"&&f.password!==f.confirm)er.confirm="密碼不一致";setE(er);return!Object.keys(er).length;};
  const submit=async()=>{if(!val())return;setLoading(true);await new Promise(r=>setTimeout(r,700));onSuccess({name:f.name||f.email.split("@")[0],email:f.email});setLoading(false);};
  if(!show)return null;
  return (
    <Modal show={show} onClose={onClose} title={mode==="login"?"登入":"註冊帳號"} width={420}>
      {mode==="register"&&<FInput label="姓名" value={f.name} onChange={v=>setF(p=>({...p,name:v}))} error={e.name} required/>}
      <FInput label="Email" type="email" value={f.email} onChange={v=>setF(p=>({...p,email:v}))} error={e.email} required/>
      <FInput label="密碼" type="password" value={f.password} onChange={v=>setF(p=>({...p,password:v}))} error={e.password} required/>
      {mode==="register"&&<FInput label="確認密碼" type="password" value={f.confirm} onChange={v=>setF(p=>({...p,confirm:v}))} error={e.confirm} required/>}
      <div style={{marginTop:6,marginBottom:18}}><Btn full size="lg" onClick={submit} disabled={loading}>{loading?<><span style={{display:"inline-block",width:13,height:13,border:"2px solid rgba(255,255,255,.4)",borderTop:"2px solid #fff",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>處理中…</>:mode==="login"?"登入":"建立帳號"}</Btn></div>
      <div style={{textAlign:"center",fontSize:12,color:"var(--taupe)"}}>{mode==="login"?<>還沒有帳號？<button onClick={()=>switchMode("register")} style={{background:"none",border:"none",color:"var(--accent)",cursor:"pointer",fontSize:12,fontWeight:600}}>立即註冊</button></>:<>已有帳號？<button onClick={()=>switchMode("login")} style={{background:"none",border:"none",color:"var(--accent)",cursor:"pointer",fontSize:12,fontWeight:600}}>返回登入</button></>}</div>
      <div style={{marginTop:18,paddingTop:16,borderTop:"1px solid var(--stone)",textAlign:"center"}}><button onClick={onClose} style={{background:"none",border:"none",color:"var(--taupe)",cursor:"pointer",fontSize:11}}>不登入，以訪客結帳 →</button></div>
    </Modal>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   STOREFRONT
══════════════════════════════════════════════════════════════════════════ */
function Storefront({cats,products,site,onAddOrder,onAdminEnter,user,setUser}) {
  const [menuOpen,setMenuOpen]=useState(false);
  const [cartOpen,setCartOpen]=useState(false);
  const [authModal,setAuthModal]=useState(null);
  const [activeCat,setActiveCat]=useState("all");
  const [search,setSearch]=useState("");
  const [cart,setCart]=useState([]);
  const [checkout,setCheckout]=useState(false);
  const [productModal,setProductModal]=useState(null);
  const [successOrder,setSuccessOrder]=useState(null);
  const [submitting,setSubmitting]=useState(false);
  const [scrolled,setScrolled]=useState(false);
  const [cf,setCf]=useState({name:"",phone:"",email:"",store:"7-ELEVEN",address:"",note:""});
  const [cfErr,setCfErr]=useState({});

  useEffect(()=>{const h=()=>setScrolled(window.scrollY>60);window.addEventListener("scroll",h);return()=>window.removeEventListener("scroll",h);},[]);
  useEffect(()=>{if(user)setCf(f=>({...f,name:user.name||"",email:user.email||""}));},[user]);

  const filtered=products.filter(p=>(activeCat==="all"||p.catId===activeCat)&&(!search||p.name.includes(search)||p.desc?.includes(search)));
  const addToCart=(p,size)=>setCart(c=>{const ex=c.find(i=>i.id===p.id&&i.size===size);return ex?c.map(i=>i.id===p.id&&i.size===size?{...i,qty:i.qty+1}:i):[...c,{...p,size,qty:1}];});
  const setQty=(id,size,qty)=>{if(qty<1){setCart(c=>c.filter(i=>!(i.id===id&&i.size===size)));return;}setCart(c=>c.map(i=>i.id===id&&i.size===size?{...i,qty}:i));};
  const cartCount=cart.reduce((s,i)=>s+i.qty,0);
  const cartSub=cart.reduce((s,i)=>s+i.price*i.qty,0);
  const shipping=cartSub>=1999?0:60;
  const cartTotal=cartSub+shipping;
  const validateCF=()=>{const e={};if(!cf.name.trim())e.name="請填寫姓名";if(!cf.phone.match(/^09\d{8}$/))e.phone="請輸入正確手機號碼";if(!cf.email.includes("@"))e.email="請輸入正確 Email";if(!cf.address.trim())e.address="請填寫取貨門市";setCfErr(e);return!Object.keys(e).length;};
  const handleCheckout=async()=>{if(!validateCF())return;setSubmitting(true);await new Promise(r=>setTimeout(r,1200));const order={id:uid().toUpperCase(),items:[...cart],total:cartTotal,subtotal:cartSub,shipping,buyer:{...cf},status:"pending",createdAt:new Date().toLocaleString("zh-TW"),paymentMethod:"藍新金流 超商取貨付款"};onAddOrder(order);setCart([]);setSubmitting(false);setCheckout(false);setCartOpen(false);setSuccessOrder(order);};

  const tagStyle={"新品":{bg:"#e8f4f0",c:"#2d7a5e"},"熱銷":{bg:"#fdf0e0",c:"#8b5e00"},"特價":{bg:"#fde8e8",c:"#c0392b"},"限量":{bg:"#ede8f5",c:"#5c3d8b"},"現貨":{bg:"#e8eff8",c:"#2d5c8b"}};
  const logoFont=site.fontStyle==="modern"?"'Jost',sans-serif":site.fontStyle==="rounded"?"system-ui,sans-serif":"'Cormorant Garamond',serif";
  const tickerText=(site.tickerMsg+" ").repeat(4);

  return (
    <div style={{minHeight:"100vh",background:"var(--cream)",color:"var(--dark)"}}>
      {/* Ticker */}
      <div style={{background:"var(--tickerBg)",color:"var(--tickerText)",fontSize:12,letterSpacing:"0.1em",overflow:"hidden",height:36,display:"flex",alignItems:"center"}}>
        <div style={{display:"flex",whiteSpace:"nowrap",animation:"ticker 32s linear infinite"}}><span style={{paddingRight:60}}>{tickerText}</span><span style={{paddingRight:60}}>{tickerText}</span></div>
      </div>

      {/* Header */}
      <header style={{position:"sticky",top:0,zIndex:500,background:scrolled?"rgba(250,249,247,.96)":"var(--cream)",borderBottom:`1px solid ${scrolled?"var(--stone)":"transparent"}`,backdropFilter:scrolled?"blur(10px)":"none",transition:"all .3s"}}>
        <div style={{maxWidth:1200,margin:"0 auto",padding:"0 24px",display:"flex",alignItems:"center",justifyContent:"space-between",height:64}}>
          <button onClick={()=>setMenuOpen(true)} style={{background:"none",border:"none",display:"flex",flexDirection:"column",gap:5,padding:"4px 6px",cursor:"pointer"}}>{[0,1,2].map(i=><span key={i} style={{display:"block",width:22,height:1.5,background:"var(--dark)"}}/>)}</button>
          <div style={{position:"absolute",left:"50%",transform:"translateX(-50%)",textAlign:"center"}}>
            {site.logoImg?<img src={site.logoImg} alt="logo" style={{height:40,objectFit:"contain"}}/>:<><div style={{fontFamily:logoFont,fontSize:28,fontWeight:400,letterSpacing:"0.15em",color:"var(--dark)",lineHeight:1}}>{site.logoText}</div><div style={{fontSize:9,letterSpacing:"0.35em",textTransform:"uppercase",color:"var(--taupe)",marginTop:2}}>{site.logoSub}</div></>}
          </div>
          <div style={{display:"flex",alignItems:"center",gap:20}}>
            <button onClick={()=>setAuthModal(user?"":"login")} style={{background:"none",border:"none",color:"var(--dark)",display:"flex",alignItems:"center",gap:5,cursor:"pointer"}}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
              {user&&<span style={{fontSize:11,color:"var(--brown)"}}>{user.name[0]}</span>}
            </button>
            <button onClick={()=>setCartOpen(true)} style={{background:"none",border:"none",position:"relative",color:"var(--dark)",cursor:"pointer"}}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
              {cartCount>0&&<span style={{position:"absolute",top:-6,right:-6,background:"var(--dark)",color:"#fff",borderRadius:"50%",width:17,height:17,fontSize:10,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:600}}>{cartCount}</span>}
            </button>
          </div>
        </div>
      </header>

      {/* Side Menu */}
      {menuOpen&&(
        <div className="fade-in" style={{position:"fixed",inset:0,zIndex:900}} onClick={()=>setMenuOpen(false)}>
          <div style={{position:"absolute",left:0,top:0,bottom:0,width:300,background:"#fff",boxShadow:"8px 0 40px rgba(0,0,0,.12)",display:"flex",flexDirection:"column",animation:"slideRight .28s ease both"}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:"20px 26px",borderBottom:"1px solid var(--stone)",display:"flex",justifyContent:"space-between",alignItems:"center"}}><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,letterSpacing:"0.12em",color:"var(--dark)"}}>Menu</div><button onClick={()=>setMenuOpen(false)} style={{background:"none",border:"none",fontSize:18,color:"var(--taupe)",cursor:"pointer"}}>✕</button></div>
            <div style={{padding:"16px 26px",borderBottom:"1px solid var(--stone)"}}><div style={{display:"flex",alignItems:"center",gap:10,border:"1px solid var(--stone)",padding:"9px 13px"}}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--taupe)" strokeWidth="1.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg><input value={search} onChange={e=>{setSearch(e.target.value);setMenuOpen(false);}} placeholder="搜尋商品…" style={{border:"none",outline:"none",fontSize:13,flex:1,color:"var(--dark)",background:"transparent"}}/></div></div>
            <nav style={{flex:1,overflowY:"auto"}}>{[{id:"all",name:"全部商品",sub:[]},...cats].map(c=><div key={c.id}><div onClick={()=>{setActiveCat(c.id);setMenuOpen(false);}} style={{padding:"14px 26px",fontSize:14,letterSpacing:"0.04em",color:"var(--dark)",cursor:"pointer",borderBottom:"1px solid var(--warm)",display:"flex",justifyContent:"space-between",alignItems:"center"}}>{c.name}</div>{c.sub?.map(s=><div key={s} style={{padding:"9px 26px 9px 44px",fontSize:12,color:"var(--taupe)",cursor:"pointer",borderBottom:"1px solid var(--warm)"}}>{s}</div>)}</div>)}</nav>
            <div style={{padding:"16px 26px",borderTop:"1px solid var(--stone)",display:"flex",gap:10}}>{user?<><div style={{fontSize:13,color:"var(--dark)"}}>{user.name}</div><button onClick={()=>{setUser(null);setMenuOpen(false);}} style={{marginLeft:"auto",background:"none",border:"none",fontSize:12,color:"var(--taupe)",cursor:"pointer"}}>登出</button></>:<><Btn v="outline" size="sm" onClick={()=>{setAuthModal("login");setMenuOpen(false);}}>登入</Btn><Btn size="sm" onClick={()=>{setAuthModal("register");setMenuOpen(false);}}>註冊</Btn></>}</div>
            <div style={{padding:"10px 26px",background:"var(--warm)"}}><button onClick={()=>{onAdminEnter();setMenuOpen(false);}} style={{background:"none",border:"none",fontSize:11,color:"var(--taupe)",letterSpacing:"0.08em",cursor:"pointer"}}>⚙ 管理後台</button></div>
          </div>
        </div>
      )}

      {/* Hero Banner */}
      <section style={{background:"var(--warm)",borderBottom:"1px solid var(--stone)",minHeight:440,display:"flex"}}>
        <div style={{flex:"0 0 55%",position:"relative",overflow:"hidden",background:"linear-gradient(135deg,var(--stone) 0%,var(--warm) 100%)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          {site.bannerImg?<img src={site.bannerImg} alt="banner" style={{width:"100%",height:"100%",objectFit:"cover",position:"absolute",inset:0}}/>:<span style={{fontSize:110}}>{site.bannerEmoji}</span>}
        </div>
        <div style={{flex:1,display:"flex",flexDirection:"column",justifyContent:"center",padding:"48px 52px"}}>
          <div className="fade-up" style={{fontSize:11,letterSpacing:"0.3em",textTransform:"uppercase",color:"var(--brown)",marginBottom:18}}>Limited Time Only</div>
          <div className="fade-up" style={{fontFamily:"'Cormorant Garamond',serif",fontSize:44,fontWeight:300,lineHeight:1.2,color:"var(--dark)",marginBottom:14,animationDelay:".1s",whiteSpace:"pre-line"}}>{site.bannerTitle}</div>
          <div className="fade-up" style={{fontSize:13,color:"var(--brown)",letterSpacing:"0.06em",marginBottom:30,lineHeight:1.9,animationDelay:".2s",whiteSpace:"pre-line"}}>{site.bannerSub}</div>
          <div className="fade-up" style={{display:"flex",gap:14,animationDelay:".3s"}}><Btn onClick={()=>setActiveCat("all")} size="lg">立即選購</Btn><Btn v="outline" onClick={()=>setActiveCat("c1")} size="lg">本月新品</Btn></div>
        </div>
      </section>

      {/* Cat tabs */}
      <div style={{background:"#fff",borderBottom:"1px solid var(--stone)",overflowX:"auto"}}><div style={{maxWidth:1200,margin:"0 auto",padding:"0 24px",display:"flex"}}>{[{id:"all",name:"全部商品"},...cats].map(c=><button key={c.id} onClick={()=>setActiveCat(c.id)} style={{padding:"15px 22px",fontSize:12,letterSpacing:"0.1em",textTransform:"uppercase",border:"none",borderBottom:`2px solid ${activeCat===c.id?"var(--dark)":"transparent"}`,background:"none",color:activeCat===c.id?"var(--dark)":"var(--taupe)",fontWeight:activeCat===c.id?600:400,cursor:"pointer",transition:"all .2s",whiteSpace:"nowrap"}}>{c.name}</button>)}</div></div>

      {/* Products */}
      <main style={{maxWidth:1200,margin:"0 auto",padding:"44px 24px 80px"}}>
        {filtered.length===0?<div style={{textAlign:"center",padding:"100px 0",color:"var(--taupe)"}}><div style={{fontSize:38,marginBottom:14}}>🔍</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22}}>找不到商品</div></div>:
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(250px,1fr))",gap:30}}>
          {filtered.map((p,i)=><ProductCard key={p.id} p={p} tagStyle={tagStyle} delay={i*0.06} onView={()=>setProductModal(p)}/>)}
        </div>}
      </main>

      {productModal&&<ProductDetailModal p={productModal} tagStyle={tagStyle} onClose={()=>setProductModal(null)} onAdd={(p,s)=>{addToCart(p,s);setProductModal(null);setCartOpen(true);}}/>}

      {/* Cart */}
      {cartOpen&&(
        <div className="fade-in" style={{position:"fixed",inset:0,background:"rgba(44,36,34,.5)",zIndex:800}} onClick={()=>setCartOpen(false)}>
          <div style={{position:"absolute",right:0,top:0,bottom:0,width:"100%",maxWidth:400,background:"#fff",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
            <div style={{padding:"20px 26px 16px",borderBottom:"1px solid var(--stone)",display:"flex",justifyContent:"space-between",alignItems:"center"}}><span style={{fontFamily:"'Cormorant Garamond',serif",fontSize:20,letterSpacing:"0.04em"}}>購物袋 ({cartCount})</span><button onClick={()=>setCartOpen(false)} style={{background:"none",border:"none",fontSize:18,color:"var(--taupe)",cursor:"pointer"}}>✕</button></div>
            <div style={{flex:1,overflowY:"auto",padding:"18px 26px"}}>
              {cart.length===0?<div style={{textAlign:"center",padding:"60px 0",color:"var(--taupe)"}}><div style={{fontSize:34,marginBottom:12}}>🛍</div><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:18}}>購物袋是空的</div></div>:
              cart.map(i=>(
                <div key={i.id+i.size} style={{display:"flex",gap:14,marginBottom:18,paddingBottom:18,borderBottom:"1px solid var(--warm)"}}>
                  <div style={{width:68,height:76,background:"var(--warm)",flexShrink:0,overflow:"hidden",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {i.images?.length>0?<img src={i.images[0].src} alt={i.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:30}}>{i.emoji}</span>}
                  </div>
                  <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,marginBottom:4}}>{i.name}</div><div style={{fontSize:11,color:"var(--taupe)",marginBottom:8}}>尺寸：{i.size}</div><div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{display:"flex",alignItems:"center",border:"1px solid var(--stone)"}}><button onClick={()=>setQty(i.id,i.size,i.qty-1)} style={{width:27,height:27,background:"none",border:"none",fontSize:15,cursor:"pointer"}}>−</button><span style={{width:27,textAlign:"center",fontSize:13}}>{i.qty}</span><button onClick={()=>setQty(i.id,i.size,i.qty+1)} style={{width:27,height:27,background:"none",border:"none",fontSize:15,cursor:"pointer"}}>＋</button></div><span style={{fontSize:13,fontWeight:500}}>{fmt(i.price*i.qty)}</span></div></div>
                </div>
              ))}
            </div>
            {cart.length>0&&<div style={{padding:"18px 26px",borderTop:"1px solid var(--stone)"}}><div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"var(--taupe)",marginBottom:6}}><span>小計</span><span>{fmt(cartSub)}</span></div><div style={{display:"flex",justifyContent:"space-between",fontSize:12,color:"var(--taupe)",marginBottom:10}}><span>運費</span><span>{shipping===0?<span style={{color:"#2d7a5e"}}>免運</span>:fmt(shipping)}</span></div>{cartSub<1999&&<div style={{fontSize:11,color:"var(--brown)",background:"var(--warm)",padding:"7px 12px",marginBottom:12}}>再購 {fmt(1999-cartSub)} 可享免運費</div>}<div style={{display:"flex",justifyContent:"space-between",fontSize:16,fontWeight:600,marginBottom:18,fontFamily:"'Cormorant Garamond',serif"}}><span>合計</span><span>{fmt(cartTotal)}</span></div><Btn full size="lg" onClick={()=>{setCartOpen(false);setCheckout(true);}}>前往結帳</Btn></div>}
          </div>
        </div>
      )}

      {/* Checkout */}
      <Modal show={checkout} onClose={()=>setCheckout(false)} title="結帳" width={560}>
        <div style={{border:"1px solid var(--stone)",padding:"13px 17px",marginBottom:22,display:"flex",gap:13}}><span style={{fontSize:20}}>🏪</span><div><div style={{fontSize:12,fontWeight:600,letterSpacing:"0.08em",textTransform:"uppercase",marginBottom:3}}>藍新金流 超商取貨付款</div><div style={{fontSize:12,color:"var(--brown)",lineHeight:1.7}}>下單後系統將以簡訊通知取貨編號，請至指定超商付款取貨。</div></div></div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 18px"}}><FInput label="取件人姓名" value={cf.name} onChange={v=>setCf(f=>({...f,name:v}))} error={cfErr.name} required/><FInput label="手機號碼" value={cf.phone} onChange={v=>setCf(f=>({...f,phone:v}))} error={cfErr.phone} required placeholder="09xxxxxxxx"/></div>
        <FInput label="Email" type="email" value={cf.email} onChange={v=>setCf(f=>({...f,email:v}))} error={cfErr.email} required/>
        <div style={{marginBottom:16}}><label style={{display:"block",fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--brown)",marginBottom:6,fontWeight:500}}>取貨超商 <span style={{color:"#c0392b"}}>*</span></label><select value={cf.store} onChange={e=>setCf(f=>({...f,store:e.target.value}))} style={{width:"100%",padding:"10px 13px",fontSize:14,border:"1.5px solid var(--stone)",borderRadius:0,background:"#fff",outline:"none",color:"var(--dark)"}}>{["7-ELEVEN","全家 FamilyMart","萊爾富 Hi-Life","OK mart"].map(s=><option key={s} value={s}>{s}</option>)}</select></div>
        <FInput label="門市地址 / 門市名稱" value={cf.address} onChange={v=>setCf(f=>({...f,address:v}))} error={cfErr.address} required placeholder="例：台北市信義區統一超商信義門市"/>
        <FInput label="備註（選填）" value={cf.note} onChange={v=>setCf(f=>({...f,note:v}))}/>
        <div style={{borderTop:"1px solid var(--stone)",paddingTop:18,marginTop:4}}>{cart.map(i=><div key={i.id+i.size} style={{display:"flex",justifyContent:"space-between",fontSize:13,marginBottom:7}}><span>{i.name}（{i.size}）× {i.qty}</span><span>{fmt(i.price*i.qty)}</span></div>)}<div style={{display:"flex",justifyContent:"space-between",fontSize:16,fontWeight:600,marginTop:12,paddingTop:12,borderTop:"1px solid var(--stone)",fontFamily:"'Cormorant Garamond',serif"}}><span>合計</span><span>{fmt(cartTotal)}</span></div></div>
        <div style={{display:"flex",gap:10,marginTop:22}}><Btn v="outline" full onClick={()=>setCheckout(false)}>返回</Btn><Btn full size="lg" onClick={handleCheckout} disabled={submitting}>{submitting?<><span style={{display:"inline-block",width:13,height:13,border:"2px solid rgba(255,255,255,.4)",borderTop:"2px solid #fff",borderRadius:"50%",animation:"spin .8s linear infinite"}}/>處理中…</>:"確認下單"}</Btn></div>
      </Modal>

      <AuthModal show={!!authModal} mode={authModal} onClose={()=>setAuthModal(null)} onSuccess={u=>{setUser(u);setAuthModal(null);}} switchMode={setAuthModal}/>

      {successOrder&&(
        <div className="fade-in" style={{position:"fixed",inset:0,background:"rgba(44,36,34,.6)",zIndex:2500,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
          <div className="scale-in" style={{background:"#fff",maxWidth:400,width:"100%",padding:"44px 38px",textAlign:"center",boxShadow:"0 24px 80px rgba(0,0,0,.2)"}}>
            <div style={{fontSize:44,marginBottom:18}}>✓</div>
            <div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:26,fontWeight:300,marginBottom:10}}>訂單已成立</div>
            <div style={{fontSize:13,color:"var(--brown)",lineHeight:1.9,marginBottom:26}}>訂單編號：<strong>#{successOrder.id}</strong><br/>我們將以簡訊通知您至 <strong>{successOrder.buyer.store}</strong> 付款取貨。</div>
            <Btn full size="lg" onClick={()=>setSuccessOrder(null)}>繼續購物</Btn>
          </div>
        </div>
      )}
      <PurchaseNotif/>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   ADMIN PANEL
══════════════════════════════════════════════════════════════════════════ */
function AdminPanel({cats,setCats,products,setProducts,orders,theme,setTheme,site,setSite,onExit}) {
  const [tab,setTab]=useState("products");
  const [showCatModal,setShowCatModal]=useState(false);
  const [showProdModal,setShowProdModal]=useState(false);
  const [editCat,setEditCat]=useState(null);
  const [editProd,setEditProd]=useState(null);
  const [catF,setCatF]=useState({name:"",emoji:""});
  const emptyPF=()=>({name:"",price:"",origPrice:"",stock:"",emoji:"👗",images:[],desc:"",catId:cats[0]?.id||"",tag:"",sizes:"S,M,L,XL"});
  const [pF,setPF]=useState(emptyPF());
  const [saved,setSaved]=useState(false);
  const logoFileRef=useRef();
  const bannerFileRef=useRef();

  const TABS=[["products",`🛍 商品 (${products.length})`],["categories","🏷 分類"],["orders",`📦 訂單 (${orders.length})`],["appearance","🎨 外觀設定"]];

  const saveCat=()=>{if(!catF.name)return;if(editCat)setCats(cs=>cs.map(c=>c.id===editCat.id?{...c,...catF}:c));else setCats(cs=>[...cs,{id:uid(),...catF,sub:[]}]);setShowCatModal(false);};
  const saveProd=()=>{
    if(!pF.name||!pF.price)return;
    const d={...pF,price:Number(pF.price),origPrice:pF.origPrice?Number(pF.origPrice):null,stock:Number(pF.stock),sizes:pF.sizes.split(",").map(s=>s.trim())};
    if(editProd)setProducts(ps=>ps.map(p=>p.id===editProd.id?{...p,...d}:p));
    else setProducts(ps=>[...ps,{id:uid(),...d}]);
    setShowProdModal(false);
  };

  const uploadImg=(key,e)=>{const file=e.target.files[0];if(!file)return;const r=new FileReader();r.onload=ev=>setSite(s=>({...s,[key]:ev.target.result}));r.readAsDataURL(file);};

  const tagColor={"熱銷":"#fdf0e0","新品":"#e8f4f0","特價":"#fde8e8","限量":"#ede8f5","現貨":"#e8eff8"};
  const statusLabel={pending:"待付款",paid:"已付款",shipped:"已出貨",cancelled:"已取消"};

  return (
    <div style={{minHeight:"100vh",background:"#f5f2ee",color:"var(--dark)"}}>
      <div style={{background:"var(--dark)",padding:"0 26px",height:56,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}><div style={{fontFamily:"'Cormorant Garamond',serif",fontSize:19,color:"#fff",letterSpacing:"0.12em"}}>{site.logoText}</div><div style={{width:1,height:14,background:"rgba(255,255,255,.2)"}}/><div style={{fontSize:10,color:"rgba(255,255,255,.45)",letterSpacing:"0.2em",textTransform:"uppercase"}}>Admin</div></div>
        <div style={{display:"flex",gap:10,alignItems:"center"}}>{saved&&<span style={{fontSize:11,color:"#7ed3b2"}}>✓ 已儲存</span>}<Btn v="ghost" size="sm" style={{color:"rgba(255,255,255,.65)",border:"1px solid rgba(255,255,255,.18)"}} onClick={onExit}>← 回前台</Btn></div>
      </div>
      <div style={{background:"#fff",borderBottom:"1px solid var(--stone)",display:"flex",padding:"0 26px",overflowX:"auto"}}>
        {TABS.map(([k,l])=><button key={k} onClick={()=>setTab(k)} style={{padding:"15px 20px",border:"none",background:"none",fontSize:12,letterSpacing:"0.08em",color:tab===k?"var(--dark)":"var(--taupe)",borderBottom:`2px solid ${tab===k?"var(--dark)":"transparent"}`,cursor:"pointer",fontWeight:tab===k?600:400,transition:"all .15s",whiteSpace:"nowrap"}}>{l}</button>)}
      </div>

      <div style={{maxWidth:1000,margin:"0 auto",padding:"30px 26px"}}>

        {/* ── Products ── */}
        {tab==="products"&&(
          <div className="fade-in">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
              <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:400}}>商品列表</h2>
              <Btn onClick={()=>{setEditProd(null);setPF(emptyPF());setShowProdModal(true);}}>＋ 新增商品</Btn>
            </div>
            {products.map(p=>{
              const cat=cats.find(c=>c.id===p.catId);
              const hasImgs=p.images?.length>0;
              return(
                <div key={p.id} style={{background:"#fff",padding:"14px 18px",marginBottom:9,display:"flex",alignItems:"center",gap:14,border:"1px solid var(--stone)"}}>
                  {/* Thumbnail preview */}
                  <div style={{width:52,height:58,background:"var(--warm)",flexShrink:0,overflow:"hidden",position:"relative",display:"flex",alignItems:"center",justifyContent:"center"}}>
                    {hasImgs?<img src={p.images[0].src} alt={p.name} style={{width:"100%",height:"100%",objectFit:"cover"}}/>:<span style={{fontSize:26}}>{p.emoji}</span>}
                    {hasImgs&&p.images.length>1&&<div style={{position:"absolute",bottom:2,right:2,background:"rgba(44,36,34,.6)",color:"#fff",fontSize:8,padding:"1px 4px",borderRadius:8}}>×{p.images.length}</div>}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:9,marginBottom:4}}>
                      <span style={{fontWeight:500,fontSize:14}}>{p.name}</span>
                      {p.tag&&<span style={{background:tagColor[p.tag]||"#f0ede8",fontSize:10,padding:"2px 8px",letterSpacing:"0.08em",color:"#5c4a32"}}>{p.tag}</span>}
                      {cat&&<span style={{fontSize:11,color:"var(--taupe)"}}>｜{cat.name}</span>}
                    </div>
                    <div style={{fontSize:12,color:"var(--taupe)"}}>{fmt(p.price)}{p.origPrice?` (原 ${fmt(p.origPrice)})`:""}　庫存：{p.stock}　圖片：{p.images?.length||0} 張</div>
                  </div>
                  <div style={{display:"flex",gap:7}}>
                    <Btn v="outline" size="sm" onClick={()=>{setEditProd(p);setPF({...p,origPrice:p.origPrice||"",sizes:p.sizes?.join(",")||"",images:p.images||[]});setShowProdModal(true);}}>編輯</Btn>
                    <Btn v="danger" size="sm" onClick={()=>setProducts(ps=>ps.filter(x=>x.id!==p.id))}>刪除</Btn>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Categories ── */}
        {tab==="categories"&&(
          <div className="fade-in">
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}><h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:400}}>分類管理</h2><Btn onClick={()=>{setEditCat(null);setCatF({name:"",emoji:""});setShowCatModal(true);}}>＋ 新增分類</Btn></div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:12}}>
              {cats.map(c=><div key={c.id} style={{background:"#fff",padding:"18px 20px",border:"1px solid var(--stone)",display:"flex",alignItems:"center",justifyContent:"space-between"}}><div style={{display:"flex",alignItems:"center",gap:10}}><span style={{fontSize:20}}>{c.emoji||"📁"}</span><span style={{fontSize:14,fontWeight:500}}>{c.name}</span></div><div style={{display:"flex",gap:6}}><Btn v="ghost" size="sm" onClick={()=>{setEditCat(c);setCatF({name:c.name,emoji:c.emoji||""});setShowCatModal(true);}}>編輯</Btn><Btn v="danger" size="sm" onClick={()=>setCats(cs=>cs.filter(x=>x.id!==c.id))}>刪</Btn></div></div>)}
            </div>
          </div>
        )}

        {/* ── Orders ── */}
        {tab==="orders"&&(
          <div className="fade-in">
            <h2 style={{fontFamily:"'Cormorant Garamond',serif",fontSize:22,fontWeight:400,marginBottom:22}}>訂單管理</h2>
            {orders.length===0?<div style={{textAlign:"center",padding:80,color:"var(--taupe)"}}>尚無訂單</div>:
            [...orders].reverse().map(o=>(
              <div key={o.id} style={{background:"#fff",padding:"18px 22px",marginBottom:10,border:"1px solid var(--stone)"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}><div><div style={{fontSize:13,fontWeight:600,letterSpacing:"0.05em",marginBottom:3}}>#{o.id}</div><div style={{fontSize:12,color:"var(--taupe)"}}>{o.createdAt}　{o.buyer.name}　{o.buyer.phone}</div></div><span style={{background:"#fdf0e0",fontSize:10,padding:"4px 12px",letterSpacing:"0.1em",textTransform:"uppercase",color:"#8b5e00"}}>{statusLabel[o.status]}</span></div>
                <div style={{fontSize:12,color:"var(--brown)",marginBottom:8}}>{o.items.map(i=>`${i.name}（${i.size}）×${i.qty}`).join("　")}</div>
                <div style={{display:"flex",justifyContent:"space-between",fontSize:14,fontWeight:600}}><span style={{fontSize:12,color:"var(--taupe)"}}>超商：{o.buyer.store}｜{o.buyer.address}</span><span>{fmt(o.total)}</span></div>
              </div>
            ))}
          </div>
        )}

        {/* ── Appearance ── */}
        {tab==="appearance"&&(
          <div className="fade-in" style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
            {/* Logo */}
            <div style={{background:"#fff",border:"1px solid var(--stone)",padding:"22px 24px",gridColumn:"1/-1"}}>
              <SectionTitle>🏷 Logo 與識別</SectionTitle>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"0 18px"}}>
                <FInput label="Logo 文字" value={site.logoText} onChange={v=>setSite(s=>({...s,logoText:v}))} placeholder="Luzii"/>
                <FInput label="Logo 副標" value={site.logoSub} onChange={v=>setSite(s=>({...s,logoSub:v}))} placeholder="Official"/>
                <div style={{marginBottom:16}}>
                  <label style={{display:"block",fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--brown)",marginBottom:6,fontWeight:500}}>字體風格</label>
                  <select value={site.fontStyle} onChange={e=>setSite(s=>({...s,fontStyle:e.target.value}))} style={{width:"100%",padding:"10px 13px",fontSize:14,border:"1.5px solid var(--stone)",borderRadius:0,background:"#fff",outline:"none",color:"var(--dark)"}}><option value="serif">Serif 優雅</option><option value="modern">Modern 現代</option></select>
                </div>
              </div>
              <div>
                <label style={{display:"block",fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--brown)",marginBottom:7,fontWeight:500}}>上傳 Logo 圖片</label>
                <div style={{display:"flex",alignItems:"center",gap:12}}>
                  <input ref={logoFileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>uploadImg("logoImg",e)}/>
                  {site.logoImg&&<img src={site.logoImg} alt="logo" style={{height:36,objectFit:"contain",border:"1px solid var(--stone)",padding:3}}/>}
                  <Btn v="outline" size="sm" onClick={()=>logoFileRef.current.click()}>📁 選擇圖片</Btn>
                  {site.logoImg&&<Btn v="ghost" size="sm" onClick={()=>setSite(s=>({...s,logoImg:null}))}>✕ 移除</Btn>}
                </div>
                <div style={{fontSize:11,color:"var(--taupe)",marginTop:6}}>PNG/SVG 透明背景效果最佳</div>
              </div>
            </div>

            {/* Banner */}
            <div style={{background:"#fff",border:"1px solid var(--stone)",padding:"22px 24px",gridColumn:"1/-1"}}>
              <SectionTitle>🖼 首頁 Banner</SectionTitle>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 20px"}}>
                <div>
                  <label style={{display:"block",fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--brown)",marginBottom:7,fontWeight:500}}>Banner 圖片</label>
                  <input ref={bannerFileRef} type="file" accept="image/*" style={{display:"none"}} onChange={e=>uploadImg("bannerImg",e)}/>
                  {site.bannerImg?<div style={{position:"relative",marginBottom:10}}><img src={site.bannerImg} alt="banner" style={{width:"100%",height:120,objectFit:"cover",border:"1px solid var(--stone)"}}/><button onClick={()=>setSite(s=>({...s,bannerImg:null}))} style={{position:"absolute",top:6,right:6,background:"rgba(44,36,34,.75)",border:"none",color:"#fff",width:22,height:22,borderRadius:"50%",fontSize:11,cursor:"pointer"}}>✕</button></div>:<div onClick={()=>bannerFileRef.current.click()} style={{width:"100%",height:90,border:"2px dashed var(--stone)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:"pointer",marginBottom:10,gap:6,color:"var(--taupe)"}}><span style={{fontSize:24}}>🖼</span><span style={{fontSize:12}}>點擊上傳</span></div>}
                  <FInput label="或使用 Emoji" value={site.bannerEmoji} onChange={v=>setSite(s=>({...s,bannerEmoji:v}))} placeholder="👗"/>
                </div>
                <div>
                  <div style={{marginBottom:14}}>
                    <label style={{display:"block",fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--brown)",marginBottom:6,fontWeight:500}}>標題</label>
                    <textarea value={site.bannerTitle} onChange={e=>setSite(s=>({...s,bannerTitle:e.target.value}))} rows={2} style={{width:"100%",padding:"10px 13px",fontSize:14,border:"1.5px solid var(--stone)",borderRadius:0,outline:"none",resize:"none",lineHeight:1.6}}/>
                  </div>
                  <div>
                    <label style={{display:"block",fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--brown)",marginBottom:6,fontWeight:500}}>副標題</label>
                    <textarea value={site.bannerSub} onChange={e=>setSite(s=>({...s,bannerSub:e.target.value}))} rows={3} style={{width:"100%",padding:"10px 13px",fontSize:14,border:"1.5px solid var(--stone)",borderRadius:0,outline:"none",resize:"none",lineHeight:1.6}}/>
                  </div>
                </div>
              </div>
              <FInput label="跑馬燈文字" value={site.tickerMsg} onChange={v=>setSite(s=>({...s,tickerMsg:v}))} hint="以「　｜　」分隔各段訊息"/>
            </div>

            {/* Colors */}
            <div style={{background:"#fff",border:"1px solid var(--stone)",padding:"22px 24px",gridColumn:"1/-1"}}>
              <SectionTitle>🎨 配色主題</SectionTitle>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:24}}>
                {PRESET_THEMES.map(pt=>(
                  <button key={pt.name} onClick={()=>setTheme(pt.colors)} style={{padding:"12px 14px",border:`2px solid ${JSON.stringify(theme)===JSON.stringify(pt.colors)?"var(--dark)":"var(--stone)"}`,background:"#fff",cursor:"pointer",textAlign:"left",transition:"border .15s"}}>
                    <div style={{display:"flex",gap:4,marginBottom:7}}>{[pt.colors.dark,pt.colors.bark,pt.colors.accent,pt.colors.warm,pt.colors.cream].map((c,i)=><div key={i} style={{width:16,height:16,borderRadius:"50%",background:c,border:"1px solid rgba(0,0,0,.07)"}}/>)}</div>
                    <div style={{fontSize:12,fontWeight:500,color:"#2c2422"}}>{pt.name}</div>
                  </button>
                ))}
              </div>
              <div style={{borderTop:"1px solid var(--stone)",paddingTop:18}}>
                <div style={{fontSize:12,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--brown)",marginBottom:14,fontWeight:600}}>自訂顏色</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:12}}>
                  {[["dark","主色"],["accent","強調"],["bark","深棕"],["cream","背景"],["warm","卡片"],["stone","邊框"],["taupe","次要文字"],["brown","標籤文字"],["tickerBg","跑馬燈底"],["tickerText","跑馬燈字"]].map(([k,label])=>(
                    <div key={k} style={{textAlign:"center"}}>
                      <div style={{position:"relative",width:40,height:40,margin:"0 auto 6px",border:"2px solid var(--stone)",borderRadius:4,overflow:"hidden",cursor:"pointer"}}>
                        <div style={{width:"100%",height:"100%",background:theme[k]}}/>
                        <input type="color" value={theme[k]} onChange={e=>setTheme(t=>({...t,[k]:e.target.value}))} style={{position:"absolute",inset:0,opacity:0,cursor:"pointer",width:"100%",height:"100%"}}/>
                      </div>
                      <div style={{fontSize:10,color:"var(--taupe)",lineHeight:1.3}}>{label}</div>
                    </div>
                  ))}
                </div>
              </div>
              <div style={{marginTop:20,display:"flex",justifyContent:"flex-end"}}>
                <Btn size="lg" onClick={()=>{setSaved(true);setTimeout(()=>setSaved(false),2000);}}>{saved?"✓ 已儲存":"儲存設定"}</Btn>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cat Modal */}
      <Modal show={showCatModal} onClose={()=>setShowCatModal(false)} title={editCat?"編輯分類":"新增分類"} width={380}>
        <FInput label="分類名稱" value={catF.name} onChange={v=>setCatF(f=>({...f,name:v}))} required/>
        <FInput label="Emoji 圖示" value={catF.emoji} onChange={v=>setCatF(f=>({...f,emoji:v}))} placeholder="例：👗"/>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:8}}><Btn v="outline" onClick={()=>setShowCatModal(false)}>取消</Btn><Btn onClick={saveCat}>儲存</Btn></div>
      </Modal>

      {/* Product Modal */}
      <Modal show={showProdModal} onClose={()=>setShowProdModal(false)} title={editProd?"編輯商品":"新增商品"} width={620}>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"0 18px"}}>
          <div style={{gridColumn:"1/-1"}}><FInput label="商品名稱" value={pF.name} onChange={v=>setPF(f=>({...f,name:v}))} required/></div>
          <FInput label="Emoji（無圖時顯示）" value={pF.emoji} onChange={v=>setPF(f=>({...f,emoji:v}))}/>
          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--brown)",marginBottom:6,fontWeight:500}}>標籤</label>
            <select value={pF.tag} onChange={e=>setPF(f=>({...f,tag:e.target.value}))} style={{width:"100%",padding:"10px 13px",fontSize:14,border:"1.5px solid var(--stone)",borderRadius:0,background:"#fff",outline:"none",color:"var(--dark)"}}><option value="">無</option>{["新品","熱銷","特價","限量","現貨"].map(t=><option key={t} value={t}>{t}</option>)}</select>
          </div>
          <FInput label="售價 (NT$)" value={pF.price} onChange={v=>setPF(f=>({...f,price:v}))} type="number" required/>
          <FInput label="原價（劃線）" value={pF.origPrice} onChange={v=>setPF(f=>({...f,origPrice:v}))} type="number"/>
          <FInput label="庫存數量" value={pF.stock} onChange={v=>setPF(f=>({...f,stock:v}))} type="number"/>
          <div style={{marginBottom:16}}>
            <label style={{display:"block",fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--brown)",marginBottom:6,fontWeight:500}}>分類</label>
            <select value={pF.catId} onChange={e=>setPF(f=>({...f,catId:e.target.value}))} style={{width:"100%",padding:"10px 13px",fontSize:14,border:"1.5px solid var(--stone)",borderRadius:0,background:"#fff",outline:"none",color:"var(--dark)"}}>{cats.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select>
          </div>
          <div style={{gridColumn:"1/-1"}}><FInput label="尺寸（逗號分隔）" value={pF.sizes} onChange={v=>setPF(f=>({...f,sizes:v}))} placeholder="S,M,L,XL"/></div>
          <div style={{gridColumn:"1/-1",marginBottom:16}}>
            <label style={{display:"block",fontSize:11,letterSpacing:"0.1em",textTransform:"uppercase",color:"var(--brown)",marginBottom:6,fontWeight:500}}>商品描述</label>
            <textarea value={pF.desc} onChange={e=>setPF(f=>({...f,desc:e.target.value}))} rows={3} style={{width:"100%",padding:"10px 13px",fontSize:14,border:"1.5px solid var(--stone)",background:"#fff",outline:"none",resize:"vertical",color:"var(--dark)",borderRadius:0}}/>
          </div>
          {/* ── Multi-image uploader ── */}
          <div style={{gridColumn:"1/-1"}}>
            <MultiImageUploader images={pF.images||[]} onChange={imgs=>setPF(f=>({...f,images:imgs}))}/>
          </div>
        </div>
        <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:4}}>
          <Btn v="outline" onClick={()=>setShowProdModal(false)}>取消</Btn>
          <Btn onClick={saveProd}>儲存商品</Btn>
        </div>
      </Modal>
    </div>
  );
}

function SectionTitle({children}) {
  return <div style={{fontSize:13,fontWeight:600,letterSpacing:"0.08em",color:"var(--dark)",marginBottom:16,paddingBottom:11,borderBottom:"1px solid var(--stone)",textTransform:"uppercase"}}>{children}</div>;
}

/* ══════════════════════════════════════════════════════════════════════════
   ROOT
══════════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [mode,setMode]=useState("store");
  const [cats,setCats]=useState(SEED_CATS);
  const [products,setProducts]=useState(SEED_PRODS);
  const [orders,setOrders]=useState([]);
  const [user,setUser]=useState(null);
  const [theme,setTheme]=useState(DEFAULT_THEME);
  const [site,setSite]=useState(DEFAULT_SITE);
  const vars=cssVars(theme);

  return (
    <div style={{["--cream"]:theme.cream,["--warm"]:theme.warm,["--stone"]:theme.stone,["--taupe"]:theme.taupe,["--brown"]:theme.brown,["--bark"]:theme.bark,["--dark"]:theme.dark,["--accent"]:theme.accent,["--tickerBg"]:theme.tickerBg,["--tickerText"]:theme.tickerText}}>
      <style>{G+`:root{${vars}}`}</style>
      {mode==="admin"
        ?<AdminPanel cats={cats} setCats={setCats} products={products} setProducts={setProducts} orders={orders} theme={theme} setTheme={setTheme} site={site} setSite={setSite} onExit={()=>setMode("store")}/>
        :<Storefront cats={cats} products={products} site={site} onAddOrder={o=>setOrders(p=>[...p,o])} onAdminEnter={()=>setMode("admin")} user={user} setUser={setUser}/>
      }
    </div>
  );
}
