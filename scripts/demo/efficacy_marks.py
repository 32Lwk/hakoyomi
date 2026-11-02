"""逆引き（T302、L-20261103-41）の照合の印を作る（開発時のみ）。

デモSKUごとに、既存データの効能・効果の文面に承認基準の語（src/data/efficacy_standards.json の keys）が
あるかを調べ、当たった語の id だけを src/data/efficacy_marks.json に書く。効能・効果の文面は書き出さない（rules §4-4）。

使い方:
  python3 -I scripts/demo/efficacy_marks.py <otc_medicines_integrated.csv>
"""

import csv
import json
import re
import sys
import unicodedata


def norm(text: str) -> str:
    return re.sub(r"\s", "", unicodedata.normalize("NFKC", text))


def main(catalog_path: str) -> None:
    rows = {r["id"]: r for r in csv.DictReader(open(catalog_path, encoding="utf-8-sig"))}
    # build_demo_skus.py の SKUS から、デモSKU id → 既存データの id
    source = open("scripts/demo/build_demo_skus.py", encoding="utf-8").read()
    med_of = dict(re.findall(r'\("([^"]+)", "(med_\d+)"', source))
    standards = json.load(open("src/data/efficacy_standards.json", encoding="utf-8"))
    skus = json.load(open("src/data/demoSkus.json", encoding="utf-8"))

    marks, missing = {}, []
    for sku in skus:
        covering = [s for s in standards if sku["noticeGroupId"] in s["noticeGroupIds"]]
        if not covering:
            continue
        row = rows.get(med_of.get(sku["id"], ""))
        if not row or not row["効能効果"].strip():
            missing.append(sku["name"])
            continue
        efficacy = norm(row["効能効果"])
        ids = [t["id"] for s in covering for t in s["terms"] if any(norm(k) in efficacy for k in t["keys"])]
        marks[sku["id"]] = ids

    with open("src/data/efficacy_marks.json", "w", encoding="utf-8") as f:
        json.dump(dict(sorted(marks.items())), f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"{len(marks)} 品に印を付けました")
    for name in missing:
        print(f"効能・効果なし：{name}")


if __name__ == "__main__":
    main(*sys.argv[1:])
