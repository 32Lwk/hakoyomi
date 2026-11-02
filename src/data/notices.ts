import { NoticeGroup, NoticeItem } from "@/lib/schema/notice";
import { KAZE_GROUP, KAZE_ITEMS } from "@/data/notice_kaze";
import bien from "@/data/notices/bien_naifuku.json";
import genetsu from "@/data/notices/genetsu_chintsu.json";

// 画面で使う通知「使用上の注意」の項目。かぜ薬Ⅰの抜粋に、解熱鎮痛薬・鼻炎用内服薬（T101 の構造化、L-20261103-28 で有効化）を足す。
// 本文・記載条件は通知の文面のまま（原文照合済み）。商品の添付文書と違う点は src/data/label_corrections.ts で補正する
const STRUCTURED = [genetsu, bien];

export const NOTICE_GROUPS: NoticeGroup[] = [
  KAZE_GROUP,
  ...STRUCTURED.map((n) => NoticeGroup.parse(n.group)),
];

export const NOTICE_ITEMS: NoticeItem[] = [
  ...KAZE_ITEMS,
  ...STRUCTURED.flatMap((n) => n.items.map((item) => NoticeItem.parse(item))),
];
