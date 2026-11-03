import { Suspense } from "react";
import { AskView } from "@/components/ask-view";

// 質問：選んだ商品、または通知・手引き全体の記載を、出典つきの抜き出しで返す（T301、L-20261103-43）。
// ?id= は商品から開いたときの対象（画面側で読む）
export default function AskPage() {
  return (
    <Suspense>
      <AskView />
    </Suspense>
  );
}
