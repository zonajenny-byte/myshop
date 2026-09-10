import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchArticles } from "../lib/articles";
import { fetchSocialLinks } from "../lib/socialLinks";
import { resolveImageUrl } from "../lib/products";

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" }) : "";

export default function Articles() {
  const [list, setList] = useState(null);
  const [vocusUrl, setVocusUrl] = useState("");

  useEffect(() => { fetchArticles().then(setList).catch(() => setList([])); }, []);
  useEffect(() => { fetchSocialLinks().then((s) => setVocusUrl(s.vocusUrl || "")); }, []);

  return (
    <section>
      <span className="pill">Journal</span>
      <h2>文章</h2>
      <p className="sub">做這些東西的過程、想法，還有一些用得上的整理。</p>
      {vocusUrl && (
        <p className="sub" style={{ marginTop: -8 }}>
          比較完整的文章放在<a href={vocusUrl} target="_blank" rel="noopener noreferrer">方格子</a>，這裡是精選。
        </p>
      )}

      {list === null && <p className="msg">載入中⋯⋯</p>}
      {list?.length === 0 && <p className="empty">還沒有文章。</p>}

      {list?.map((a) => {
        const cover = resolveImageUrl(a.cover);
        return (
          <Link to={`/article/${a.id}`} key={a.id} className="art-row">
            {cover
              ? <img className="art-thumb" src={cover} alt="" loading="lazy" />
              : <div className="art-thumb art-thumb-empty">✍</div>}
            <div className="art-meta">
              {a.tag && <span className="art-tag">{a.tag}</span>}
              <h3>{a.title}</h3>
              <p>{a.excerpt}</p>
              <div className="art-date">{fmtDate(a.publishedAt || a.createdAt)}</div>
            </div>
          </Link>
        );
      })}

      {vocusUrl && (
        <p style={{ marginTop: 24 }}>
          <a href={vocusUrl} target="_blank" rel="noopener noreferrer">看方格子上更多文章 →</a>
        </p>
      )}
    </section>
  );
}
