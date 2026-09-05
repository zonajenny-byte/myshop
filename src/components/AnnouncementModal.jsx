import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAnnouncement, markSeen, hasSeen } from "../lib/announcement";
import { resolveImageUrl } from "../lib/products";

/** 首頁公告彈窗。只在首頁跳，關掉之後這次瀏覽階段不再出現。 */
export default function AnnouncementModal() {
  const [ann, setAnn] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (hasSeen()) return;
    fetchAnnouncement().then((a) => {
      if (a?.enabled) setAnn(a);
    });
  }, []);

  if (!ann) return null;

  function close() {
    markSeen();
    setAnn(null);
  }

  function onCta() {
    close();
    if (ann.ctaLink) navigate(ann.ctaLink);
  }

  const photo = resolveImageUrl(ann.image);

  return (
    <div className="ann-scrim" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className="ann-box">
        <button className="ann-close" onClick={close} aria-label="關閉公告">✕</button>
        {ann.title && <div className="ann-tag">{ann.title}</div>}
        {photo && <img className="ann-img" src={photo} alt="" />}
        <div className="ann-body">
          <h3>{ann.heading}</h3>
          {ann.body && <p>{ann.body}</p>}
          {ann.ctaText && (
            <button className="btn" onClick={onCta}>{ann.ctaText}</button>
          )}
        </div>
      </div>
    </div>
  );
}
