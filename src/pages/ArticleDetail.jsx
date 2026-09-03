import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchArticle } from "../lib/articles";
import { resolveImageUrl } from "../lib/products";

const fmtDate = (iso) =>
  iso ? new Date(iso).toLocaleDateString("zh-TW", { year: "numeric", month: "long", day: "numeric" }) : "";

export default function ArticleDetail() {
  const { id } = useParams();
  const [a, setA] = useState(undefined); // undefined=載入中, null=找不到

  useEffect(() => { fetchArticle(id).then(setA).catch(() => setA(null)); }, [id]);

  if (a === undefined) return <section><p className="msg">載入中⋯⋯</p></section>;
  if (!a) {
    return (
      <section>
        <Link to="/articles" className="back" style={{ display: "inline-block" }}>‹ 回文章</Link>
        <p className="empty">找不到這篇文章。</p>
      </section>
    );
  }

  const cover = resolveImageUrl(a.cover);

  return (
    <>
      <Link to="/articles" className="back" style={{ display: "inline-block" }}>‹ 回文章</Link>
      <article className="art-full">
        {a.tag && <span className="art-tag">{a.tag}</span>}
        <h1>{a.title}</h1>
        <div className="art-date">{fmtDate(a.publishedAt || a.createdAt)}</div>
        {cover && <img className="art-cover" src={cover} alt="" />}
        {/* 內文用換行分段，不解析 HTML——後台是純文字輸入，直接渲染 HTML 會有 XSS 風險 */}
        <div className="art-body">
          {a.body.split(/\n\s*\n/).map((para, i) => <p key={i}>{para}</p>)}
        </div>
      </article>
    </>
  );
}
