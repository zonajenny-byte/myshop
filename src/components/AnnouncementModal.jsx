import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchAnnouncement, markSeen, hasSeen } from "../lib/announcement";
import { resolveImageUrl } from "../lib/products";

/**
 * 首頁公告彈窗。只在首頁跳，關掉之後這次瀏覽階段不再出現。
 *
 * 有圖片時走「純圖片」模式：整張圖就是廣告，點圖直接進商品頁，
 * 不放按鈕也不疊文字——圖本身已經把該講的講完了。
 * 沒圖片時退回文字版，後台想用文字公告也還是可以。
 */
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

  function go() {
    close();
    if (ann.ctaLink) navigate(ann.ctaLink);
  }

  const photo = resolveImageUrl(ann.image);

  return (
    <div className="ann-scrim" onClick={(e) => e.target === e.currentTarget && close()}>
      <div className={"ann-box" + (photo ? " ann-box-img" : "")}>
        <button className="ann-close" onClick={close} aria-label="關閉公告">✕</button>

        {photo ? (
          // 整張圖可點，用 button 包住才有鍵盤操作與 aria 標籤
          <button className="ann-imglink" onClick={go} aria-label="看這個商品">
            <img className="ann-img" src={photo} alt="" />
          </button>
        ) : (
          <>
            {ann.title && <div className="ann-tag">{ann.title}</div>}
            <div className="ann-body">
              <h3>{ann.heading}</h3>
              {ann.body && <p>{ann.body}</p>}
              {ann.ctaText && <button className="btn" onClick={go}>{ann.ctaText}</button>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
