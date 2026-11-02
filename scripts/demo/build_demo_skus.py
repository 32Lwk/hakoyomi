"""デモSKU（src/data/demoSkus.json）を作る（L-40、開発時のみ）。

ゆうの既存データ資産（Medicine Recommend System の統合マスターと画像URL）から、下の SKUS に挙げた品だけを取り出し、
分量・内容量・JAN は公開情報で調べた値（research.json）で補う。カタログ全件・CSV はリポに入れない。
効能・効果と用法・用量の文面は取り出さない（rules §4-4。画面では PMDA へリンクアウト）。

使い方:
  python3 -I scripts/demo/build_demo_skus.py <otc_medicines_integrated.csv> <r2_medicine_image_urls.json> \
      src/data/demoSkus.json <research.json> [<research.json> ...]
"""

import csv
import json
import sys
import unicodedata

# (id, 既存データの id, 薬の種類, 通知の薬効群 ID, 効能に含まれる薬効群)
SKUS = [
    ("shin-lulu-a-s", "med_05447", "cold", "kaze_1", ["かぜ薬"]),
    ("lulu-attack-ex", "med_05597", "cold", "kaze_1", ["かぜ薬"]),
    ("benza-block-l", "med_05696", "cold", "kaze_1", ["かぜ薬"]),
    ("shin-contac-kaze", "med_05507", "cold", "kaze_1", ["かぜ薬"]),
    ("shin-estac-granule", "med_05529", "cold", "kaze_1", ["かぜ薬"]),
    ("estac-ibu-fine-ex", "med_06446", "cold", "kaze_1", ["かぜ薬"]),
    ("loxonin-s", "med_00551", "fever", "genetsu_chintsu", ["解熱鎮痛薬"]),
    ("eve-a", "med_00190", "fever", "genetsu_chintsu", ["解熱鎮痛薬"]),
    ("bufferin-a", "med_00318", "fever", "genetsu_chintsu", ["解熱鎮痛薬"]),
    ("tylenol-a", "med_00592", "fever", "genetsu_chintsu", ["解熱鎮痛薬"]),
    ("naron-ace", "med_00266", "fever", "genetsu_chintsu", ["解熱鎮痛薬"]),
    ("shin-sedes", "med_00244", "fever", "genetsu_chintsu", ["解熱鎮痛薬"]),
    ("allegra-fx", "med_05201", "rhinitis", "bien_naifuku", ["鼻炎用内服薬"]),
    ("alesion-20", "med_05105", "rhinitis", "bien_naifuku", ["鼻炎用内服薬"]),
    ("pabron-bien-ex", "med_05013", "rhinitis", "bien_naifuku", ["鼻炎用内服薬"]),
    ("stona-rhini-s", "med_05116", "rhinitis", "bien_naifuku", ["鼻炎用内服薬"]),
    ("shin-bron-ace", "med_05458", "cough", "chinga_kyotan", ["鎮咳去痰薬"]),
    ("benza-block-cough", "med_05687", "cough", "chinga_kyotan", ["鎮咳去痰薬"]),
    ("drewell", "med_04904", "sleep", "suimin_kaizen", ["催眠鎮静薬"]),
]

# 通知の記載条件「抗ヒスタミン剤を含有する製剤」に当てるための成分群
ANTIHISTAMINES = [
    "クロルフェニラミン", "クレマスチン", "ジフェンヒドラミン", "カルビノキサミン",
    "フェキソフェナジン", "エピナスチン", "メキタジン", "ケトチフェン",
]
# 眠気の注意につながる成分（抗ヒスタミン剤の一部・鎮静成分・コデイン類）。成分名の照合だけ
DROWSY = [
    "クロルフェニラミン", "クレマスチン", "ジフェンヒドラミン", "カルビノキサミン", "エピナスチン",
    "メキタジン", "ケトチフェン", "ブロモバレリル尿素", "アリルイソプロピルアセチル尿素", "コデイン",
]

# パッケージの外の文言・ロゴを切り抜いた新しい画像（ゆうが R2 に配置、L-20261103-01）。既存の対応表より優先する
IMAGE_OVERRIDE = {
    "バファリンA": "https://images.yutok.dev/otc/bufferin-a.webp?v=3ac703b8",
    "新ブロン液エース": "https://images.yutok.dev/otc/shin-bron-ace.webp?v=682d0fcb",
}

# ゆうが実物の箱と PMDA で全品を確認した日。確認済みなので「出典が弱い値」（low）も差分とバッジに使う（L-20261103-02）
VERIFIED_ON = "2026-11-03"

RISK = {"第1類": "第1類", "指定第2類": "指定第2類", "第2類": "第2類", "第3類": "第3類"}


def norm(name: str) -> str:
    return unicodedata.normalize("NFKC", name).replace("−", "-").replace(" ", "").lower()


def doping_class(raw: str) -> str | None:
    text = unicodedata.normalize("NFKC", raw).replace("\t", "").strip()
    if not text:
        return None
    if "セクション" in text:
        timing, _, section = text.partition("セクション")
        return f"{section.lstrip(':').strip()}（{timing.split('(')[0]}）"
    return text


def main(catalog_path: str, images_path: str, out_path: str, *research_paths: str) -> None:
    rows = {r["id"]: r for r in csv.DictReader(open(catalog_path, encoding="utf-8-sig"))}
    images = json.load(open(images_path, encoding="utf-8"))
    research = {r["name"]: r for p in research_paths for r in json.load(open(p, encoding="utf-8"))}

    skus, skipped = [], []
    for sku_id, med_id, kind, group, efficacy in SKUS:
        row = rows[med_id]
        name = row["製品名"]
        found = research.get(name)
        if not found or not found.get("jan"):
            skipped.append(f"{name}（JAN 未確認）")
            continue
        ingredients = [unicodedata.normalize("NFKC", i).replace("−", "-").strip() for i in row["成分"].split("\n") if i.strip()]
        amounts = {norm(f[0]): f for f in found["facts"]}
        low = set(map(norm, found.get("low", [])))
        facts = []
        for ingredient in ingredients:
            hit = amounts.get(norm(ingredient))
            amount, unit = (hit[1], hit[2]) if hit and hit[1] is not None else (None, None)
            facts.append({
                "ingredient": ingredient,
                "ingredientClasses": ["抗ヒスタミン剤"] if any(a in ingredient for a in ANTIHISTAMINES) else [],
                "amountPerDay": amount,
                "unit": unit,
                # 量が見つからない・出典が弱い値は差分とバッジに使わない（rules §4-8）
                "uncertain": amount is None or (norm(ingredient) in low and not VERIFIED_ON),
            })
        skus.append({
            "id": sku_id,
            "jan": found["jan"],
            # 品名が変わっている品は今の品名（例：ナロンエース → ナロンエースT）
            "name": found.get("displayName") or name,
            "maker": found.get("maker") or row["メーカー名"],
            "riskClass": RISK[found.get("riskClass") or row["分類"]],
            "kind": kind,
            "noticeGroupId": group,
            "efficacyGroups": efficacy,
            "route": found.get("route", "internal"),
            "crudeDrugMain": False,
            "dailyMaxUnits": found["dailyMaxUnits"],
            "timesPerDay": found["timesPerDay"],
            "contentQty": found["contentQty"],
            "contentUnit": found["contentUnit"],
            "facts": facts,
            "pmdaUrl": row["pmda添付文書URL"],
            "docRevisedOn": None,
            "enteredBy": "ゆう（既存データ）＋公開情報",
            "verifiedOn": VERIFIED_ON,
            "imageUrl": IMAGE_OVERRIDE.get(name) or images.get(name),
            "source": {"label": "添付文書を PMDA で開く", "url": row["pmda添付文書URL"]},
            "quotes": {"efficacy": None, "ingredients": ingredients, "dosage": None},
            "flags": {
                "drowsyMention": any(d in i for i in ingredients for d in DROWSY),
                "dopingRelated": row["禁止物質あり"] == "禁止物質あり",
                "dopingClass": doping_class(row["競技会区分"]),
            },
            "research": [{"label": label, "url": url} for label, url in found["research"]],
        })

    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(skus, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"{len(skus)} 品を書き出しました")
    for s in skipped:
        print(f"除外：{s}")


if __name__ == "__main__":
    main(*sys.argv[1:])
