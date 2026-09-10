import { useState } from "react";
import { resolveImageUrl } from "../lib/products";

/**
 * 商品詳細頁的輪播圖。
 *
 * images 是完整清單（通常是主圖 + 後台加的輪播圖），不是只有輪播圖本身——
 * 這樣只有一張圖時輪播退化成單張顯示，不用另外判斷「要不要顯示輪播控制項」。
 */
export default function ImageCarousel({ images, alt = "" }) {
  const [i, setI] = useState(0);
  const list = images.filter(Boolean);

  if (list.length === 0) return null;

  const go = (delta) => setI((cur) => (cur + delta + list.length) % list.length);

  return (
    <div className="carousel">
      <div className="carousel-frame">
        <img src={resolveImageUrl(list[i])} alt={alt} />
        {list.length > 1 && (
          <>
            <button className="carousel-arrow left" onClick={() => go(-1)} aria-label="上一張">‹</button>
            <button className="carousel-arrow right" onClick={() => go(1)} aria-label="下一張">›</button>
          </>
        )}
      </div>
      {list.length > 1 && (
        <div className="carousel-dots">
          {list.map((_, idx) => (
            <button key={idx} className={idx === i ? "on" : ""}
              onClick={() => setI(idx)} aria-label={`看第 ${idx + 1} 張`} />
          ))}
        </div>
      )}
    </div>
  );
}
