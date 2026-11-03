import { redirect } from "next/navigation";

// さがすは「探す」（/）に統合した（L-20261103-43）
export default function SearchPage() {
  redirect("/");
}
