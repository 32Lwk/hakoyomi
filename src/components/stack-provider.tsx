"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

// 読んだ商品の積み上げ（最大4品）。「読む」は current を、「比べる」「棚」は ids 全体を使う
const MAX = 4;
const STORAGE_KEY = "hakoyomi.stack";

type Stack = {
  ids: string[];
  currentId: string | null;
  add: (id: string) => void;
  remove: (id: string) => void;
  select: (id: string | null) => void;
  clear: () => void;
  scannerOpen: boolean;
  setScannerOpen: (open: boolean) => void;
  // 読めた商品をその画面で受け取る（質問の画面が話題に足す。L-20261104-02）。受け取る画面がなければ false
  setScanHandler: (handler: ((id: string) => void) | null) => void;
  handleScan: (id: string) => boolean;
};

const StackContext = createContext<Stack | null>(null);

function readSaved(): { ids?: string[]; currentId?: string | null } | null {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY) ?? "null") as {
      ids?: string[];
      currentId?: string | null;
    } | null;
  } catch {
    // 保存領域が使えない環境では保持しない
    return null;
  }
}

export function StackProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>([]);
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const scanHandler = useRef<((id: string) => void) | null>(null);
  // 復元が済むまでは保存しない（空の初期値で上書きしないため）
  const [restored, setRestored] = useState(false);

  // 同じ端末で開き直しても続きから使えるように、タブを閉じるまで保持する（お客様の情報は持たない）。
  // サーバーの描画と食い違わないよう、復元はハイドレーションの後に行う
  useEffect(() => {
    const saved = readSaved();
    /* eslint-disable react-hooks/set-state-in-effect -- 外部ストレージからの一度きりの復元 */
    if (saved?.ids) setIds(saved.ids.slice(0, MAX));
    if (saved?.currentId) setCurrentId(saved.currentId);
    setRestored(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  useEffect(() => {
    if (!restored) return;
    try {
      sessionStorage.setItem(STORAGE_KEY, JSON.stringify({ ids, currentId }));
    } catch {
      // 同上
    }
  }, [restored, ids, currentId]);

  const add = useCallback((id: string) => {
    setIds((prev) => [...prev.filter((x) => x !== id), id].slice(-MAX));
    setCurrentId(id);
  }, []);

  const remove = useCallback((id: string) => {
    setIds((prev) => prev.filter((x) => x !== id));
    setCurrentId((prev) => (prev === id ? null : prev));
  }, []);

  const value = useMemo<Stack>(
    () => ({
      ids,
      currentId,
      add,
      remove,
      select: setCurrentId,
      clear: () => {
        setIds([]);
        setCurrentId(null);
      },
      scannerOpen,
      setScannerOpen,
      setScanHandler: (handler) => {
        scanHandler.current = handler;
      },
      handleScan: (id) => {
        if (!scanHandler.current) return false;
        scanHandler.current(id);
        return true;
      },
    }),
    [ids, currentId, add, remove, scannerOpen],
  );

  return <StackContext.Provider value={value}>{children}</StackContext.Provider>;
}

export function useStack(): Stack {
  const stack = useContext(StackContext);
  if (!stack) throw new Error("useStack は StackProvider の中で使う");
  return stack;
}
