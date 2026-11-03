import { redirect } from "next/navigation";

// 比べるは「商品」の中に移した（L-20261103-43）
export default function ComparePage() {
  redirect("/products?view=compare");
}
