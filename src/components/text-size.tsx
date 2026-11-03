"use client";

import { useEffect, useState } from "react";

// 文字の大きさ（設定、L-20261103-43）。画面全体を rem で組んでいるので、html の文字の大きさだけ変える。
// 端末の中だけに覚える（お客様の情報ではない）
export type TextSize = "standard" | "large";
const KEY = "hakoyomi.textSize";
const EVENT = "hakoyomi:text-size";
const ROOT_SIZE: Record<TextSize, string> = { standard: "", large: "112.5%" };

function read(): TextSize {
  try {
    return localStorage.getItem(KEY) === "large" ? "large" : "standard";
  } catch {
    return "standard";
  }
}

export function useTextSize(): [TextSize, (size: TextSize) => void] {
  const [size, setSize] = useState<TextSize>("standard");
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 外部ストレージからの一度きりの復元
    setSize(read());
  }, []);
  const update = (next: TextSize) => {
    setSize(next);
    try {
      localStorage.setItem(KEY, next);
    } catch {
      // 保存領域が使えない環境では、この画面を開いている間だけ
    }
    window.dispatchEvent(new Event(EVENT));
  };
  return [size, update];
}

// 全画面で文字の大きさを当てる
export function TextSizeSync() {
  useEffect(() => {
    const apply = () => {
      document.documentElement.style.fontSize = ROOT_SIZE[read()];
    };
    apply();
    window.addEventListener(EVENT, apply);
    return () => window.removeEventListener(EVENT, apply);
  }, []);
  return null;
}
