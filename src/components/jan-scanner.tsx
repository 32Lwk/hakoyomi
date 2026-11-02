"use client";

import { BrowserMultiFormatReader, type IScannerControls } from "@zxing/browser";
import { BarcodeFormat, DecodeHintType } from "@zxing/library";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useStack } from "@/components/stack-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { UI_COPY } from "@/lib/guard/uiCopy";
import { cleanJan, isValidJan } from "@/lib/jan";

type Summary = { id: string; name: string; maker: string; jan: string; riskClass: string };

const HINTS = new Map([
  [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8]],
]);

// JAN の読み取り：カメラ（映像は保存・送信しない。読めた数字だけ使う）＋手入力＋品名検索
export function JanScanner() {
  const { scannerOpen, setScannerOpen, add } = useStack();
  const router = useRouter();
  const videoRef = useRef<HTMLVideoElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [cameraError, setCameraError] = useState(false);
  const [text, setText] = useState("");
  const [results, setResults] = useState<Summary[]>([]);

  function done(id: string) {
    add(id);
    setScannerOpen(false);
    setText("");
    setResults([]);
    setMessage(null);
    router.push("/");
  }

  async function lookupJan(raw: string) {
    const code = cleanJan(raw);
    if (!isValidJan(code)) {
      setMessage(UI_COPY.invalidJan);
      return;
    }
    const res = await fetch(`/api/jan?code=${code}`);
    if (res.status === 404) {
      setMessage(UI_COPY.unknownJan);
      inputRef.current?.focus();
      return;
    }
    if (!res.ok) {
      setMessage(UI_COPY.readError);
      return;
    }
    const view = (await res.json()) as { product: { id: string } };
    done(view.product.id);
  }

  // カメラは開いている間だけ動かす
  useEffect(() => {
    if (!scannerOpen) return;
    let controls: IScannerControls | null = null;
    let stopped = false;
    const reader = new BrowserMultiFormatReader(HINTS);
    // シートの描画を待ってから video 要素につなぐ
    const timer = setTimeout(() => {
      if (!videoRef.current) return;
      reader
        .decodeFromConstraints(
          { video: { facingMode: "environment" } },
          videoRef.current,
          (result) => {
            if (result && !stopped) {
              stopped = true;
              controls?.stop();
              void lookupJan(result.getText());
            }
          },
        )
        .then((c) => {
          controls = c;
          if (stopped) c.stop();
        })
        .catch(() => setCameraError(true));
    }, 150);
    return () => {
      stopped = true;
      clearTimeout(timer);
      controls?.stop();
      setCameraError(false);
    };
    // lookupJan は開いている間に変わらない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scannerOpen]);

  async function onTextChange(value: string) {
    setText(value);
    setMessage(null);
    const q = value.trim();
    // 数字だけなら JAN として扱い、それ以外は品名で探す
    if (!q || /^[\d０-９\s-]+$/.test(q)) {
      setResults([]);
      return;
    }
    const res = await fetch(`/api/products?q=${encodeURIComponent(q)}`);
    if (res.ok) setResults(((await res.json()) as { results: Summary[] }).results);
  }

  return (
    <Sheet open={scannerOpen} onOpenChange={setScannerOpen}>
      <SheetContent side="bottom" className="max-h-[92dvh] overflow-y-auto rounded-t-2xl">
        <SheetHeader>
          <SheetTitle>JANを読む</SheetTitle>
          <SheetDescription>{UI_COPY.scanning}</SheetDescription>
        </SheetHeader>
        <div className="flex flex-col gap-4 px-4 pb-6">
          <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg bg-neutral-900">
            <video ref={videoRef} className="size-full object-cover" muted playsInline />
            <div className="pointer-events-none absolute inset-x-8 top-1/2 h-24 -translate-y-1/2 rounded-md border-4 border-diff" />
            {cameraError && (
              <p className="absolute inset-x-0 bottom-0 bg-black/70 p-2 text-center text-sm text-white">
                {UI_COPY.cameraUnavailable}
              </p>
            )}
          </div>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (/^[\d０-９\s-]+$/.test(text.trim())) void lookupJan(text);
            }}
          >
            <label htmlFor="jan-input" className="sr-only">
              JAN または品名
            </label>
            <Input
              id="jan-input"
              ref={inputRef}
              value={text}
              onChange={(e) => void onTextChange(e.target.value)}
              placeholder="JAN（13桁）または品名"
              inputMode="search"
              autoComplete="off"
              className="h-12 text-base"
            />
            <Button type="submit" className="h-12 px-5">
              読む
            </Button>
          </form>
          {message && (
            <p role="status" className="rounded-md bg-muted p-3 text-sm">
              {message}
            </p>
          )}
          {results.length > 0 && (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {results.map((r) => (
                <li key={r.id}>
                  <button
                    type="button"
                    onClick={() => done(r.id)}
                    className="flex min-h-12 w-full flex-col items-start px-3 py-2 text-left"
                  >
                    <span className="font-medium">{r.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {r.maker}・{r.riskClass}・JAN {r.jan}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
