import { NoticeGroup, NoticeItem } from "@/lib/schema/notice";
import { KAZE_GROUP, KAZE_ITEMS } from "@/data/notice_kaze";
import bien from "@/data/notices/bien_naifuku.json";
import chinga from "@/data/notices/chinga_kyotan.json";
import genetsu from "@/data/notices/genetsu_chintsu.json";
import ichoyakuSeisan from "@/data/notices/ichoyaku_seisan.json";
import ichoyakuKenni from "@/data/notices/ichoyaku_kenni.json";
import ichoyakuShisha from "@/data/notices/ichoyaku_shisha.json";
import chinun from "@/data/notices/chinun.json";
import gankaIppan from "@/data/notices/ganka_ippan.json";
import gankaKokin from "@/data/notices/ganka_kokin.json";
import gankaJinko from "@/data/notices/ganka_jinko.json";
import gankaSengan from "@/data/notices/ganka_sengan.json";
import vitaminB1 from "@/data/notices/vitamin_b1.json";
import vitaminB2 from "@/data/notices/vitamin_b2.json";
import vitaminC from "@/data/notices/vitamin_c.json";
import vitaminB2b6 from "@/data/notices/vitamin_b2b6.json";
import vitaminHoken from "@/data/notices/vitamin_hoken.json";
import tenbi from "@/data/notices/tenbi.json";
import gaiyoJishitsu from "@/data/notices/gaiyo_jishitsu.json";
import mizumushi from "@/data/notices/mizumushi.json";
import chinyouShoen from "@/data/notices/chinyou_shoen.json";
import gaiyoChintsu from "@/data/notices/gaiyo_chintsu.json";
import allergy from "@/data/notices/allergy.json";
import kanouHifu from "@/data/notices/kanou_hifu.json";
import shimoyake from "@/data/notices/shimoyake.json";
import kampo_002 from "@/data/notices/kampo_002.json";
import kampo_189 from "@/data/notices/kampo_189.json";
import kampo_020 from "@/data/notices/kampo_020.json";
import kampo_033 from "@/data/notices/kampo_033.json";
import kampo_051 from "@/data/notices/kampo_051.json";
import kampo_076 from "@/data/notices/kampo_076.json";
import kampo_080 from "@/data/notices/kampo_080.json";
import kampo_107 from "@/data/notices/kampo_107.json";
import kampo_110 from "@/data/notices/kampo_110.json";
import kampo_144 from "@/data/notices/kampo_144.json";
import kampo_149 from "@/data/notices/kampo_149.json";
import kampo_152 from "@/data/notices/kampo_152.json";
import kampo_208 from "@/data/notices/kampo_208.json";
import kampo_209 from "@/data/notices/kampo_209.json";
import kampo_235 from "@/data/notices/kampo_235.json";
import kampo_262 from "@/data/notices/kampo_262.json";
import kampo_264 from "@/data/notices/kampo_264.json";
import kampo_269 from "@/data/notices/kampo_269.json";
import kampo_270 from "@/data/notices/kampo_270.json";
import kampo_271 from "@/data/notices/kampo_271.json";
import kampo_273 from "@/data/notices/kampo_273.json";
import kampo_289 from "@/data/notices/kampo_289.json";

// 画面で使う通知「使用上の注意」の項目。かぜ薬Ⅰの抜粋に、解熱鎮痛薬・鼻炎用内服薬（L-20261103-28）・鎮咳去痰薬（L-20261103-29）を足す（T101 の構造化）。
// 一般用漢方製剤はデモSKUの20処方（別の通知、処方ごとに kampo_{処方番号}。L-20261104-09）。
// 本文・記載条件は通知の文面のまま（原文照合済み）。商品の添付文書と違う点は src/data/label_corrections.ts で補正する
const KAMPO = [
  kampo_002,
  kampo_189,
  kampo_020, kampo_033, kampo_051, kampo_076, kampo_080, kampo_107, kampo_110, kampo_144, kampo_149, kampo_152, kampo_208, kampo_209, kampo_235, kampo_262, kampo_264, kampo_269, kampo_270, kampo_271, kampo_273, kampo_289,
];
// 残りのデモSKUの薬効群（L-20261104-16）
const OTHERS = [
  ichoyakuSeisan, ichoyakuKenni, ichoyakuShisha, chinun, gankaIppan, gankaKokin, gankaJinko, gankaSengan, vitaminB1, vitaminB2, vitaminC, vitaminB2b6, vitaminHoken, tenbi, gaiyoJishitsu, mizumushi, chinyouShoen, gaiyoChintsu, allergy, kanouHifu, shimoyake,
];
const STRUCTURED = [genetsu, bien, chinga, ...OTHERS, ...KAMPO];

export const NOTICE_GROUPS: NoticeGroup[] = [
  KAZE_GROUP,
  ...STRUCTURED.map((n) => NoticeGroup.parse(n.group)),
];

export const NOTICE_ITEMS: NoticeItem[] = [
  ...KAZE_ITEMS,
  ...STRUCTURED.flatMap((n) => n.items.map((item) => NoticeItem.parse(item))),
];

// 厚労省通知「使用上の注意」（36薬効群・一般用漢方製剤）に項がない薬効群（L-20261104-16）。
// 「まだ取り込んでいない」ではなく「通知に項がない」と出す。使用上の注意は商品の添付文書（PMDA）で確認する
export const NO_NOTICE_GROUPS: Record<string, string> = {
  suimin_kaizen: "催眠鎮静薬（睡眠改善薬）",
  l_cysteine: "L-システイン主薬製剤",
  koukuu_spray: "口腔咽喉薬（トローチ剤以外）",
  kounaien: "口内炎用薬",
  kampo_mix: "漢方製剤（安中散と芍薬甘草湯の配合）",
};
