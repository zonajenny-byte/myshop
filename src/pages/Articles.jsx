import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { fetchArticles } from "../lib/articles";
import { resolveImageUrl } from "../lib/products";

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" }) : "";

export default function Articles() {
  const [list, setList] = useState(null);

  useEffect(() => { fetchArticles().then(setList).catch(() => setList([])); }, []);

  return (
    <section>
      <span className="pill">Journal</span>
      <h2>文章</h2>
      <p className="sub">做這些東西的過程、想法，還有一些用得上的整理。</p>

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
    </section>
  );
}
