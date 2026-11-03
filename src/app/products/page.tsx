import { Suspense } from "react";
import { ProductsView } from "@/components/products-view";

// 商品：読んだ商品と比べる（L-20261103-43）。?view=compare で比べるを開く（クエリは画面側で読む）
export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsView />
    </Suspense>
  );
}
