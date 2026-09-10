import { useState, useEffect } from "react";

const LS_KEY = "ap.gridCols";
const DEFAULT_COLS = 3;
const VALID = [3, 4, 5];

function readStored() {
  const n = Number(localStorage.getItem(LS_KEY));
  return VALID.includes(n) ? n : DEFAULT_COLS;
}

/**
 * 一列顯示幾件商品，存在 localStorage，換頁也記得。
 * 只影響桌機版（.pgrid 的 min-width:900px 那個斷點），
 * 手機版固定兩欄，這個偏好在手機上不生效——五欄擠在手機螢幕上會太小看不清楚。
 */
export function useGridCols() {
  const [cols, setColsState] = useState(readStored);

  useEffect(() => {
    localStorage.setItem(LS_KEY, String(cols));
  }, [cols]);

  const setCols = (n) => {
    if (VALID.includes(n)) setColsState(n);
  };

  return [cols, setCols];
}

/** 放在商品列表頁右上角的三顆切換鈕 */
export function GridColsToggle({ cols, setCols }) {
  return (
    <div className="gridcols" role="group" aria-label="調整一列顯示幾件商品">
      {[3, 4, 5].map((n) => (
        <button
          key={n}
          className={cols === n ? "on" : ""}
          onClick={() => setCols(n)}
          aria-label={`一列顯示 ${n} 件`}
          aria-pressed={cols === n}
        >
          {n}
        </button>
      ))}
    </div>
  );
}
