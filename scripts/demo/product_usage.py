"""デモSKUの剤形と「用法がある最年少の月齢」を作る（開発時のみ、L-20261104-12）。

通知の記載条件「生後３ヵ月未満の用法がある製剤」「小児の用法がある場合」「錠剤・丸剤の場合」を判定するための商品の事実。
既存データ（統合マスター）の用法用量の年齢区分から月齢の数値だけを、品名から剤形だけを取り出し、
用法・用量の文面は書き出さない（rules §4-4）。

使い方:
  python3 -I scripts/demo/product_usage.py <otc_medicines_integrated.csv>
"""

import csv
import json
import re
import sys
import unicodedata
from datetime import date

OUT = "src/data/product_usage.json"

# 品名の語 → 剤形（通知の書き分け：錠剤・丸剤・カプセル剤・それ以外）。「丸料」は煎じ薬の名で丸剤ではない
FORMS = [("カプセル", "カプセル剤"), ("錠", "錠剤"), ("顆粒", "顆粒剤"), ("細粒", "細粒剤"), ("散", "散剤")]


def dosage_form(name: str) -> str | None:
    for word, form in FORMS:
        if word in name:
            return form
    if re.search(r"丸(?!料)", name):
        return "丸剤"
    return None


# 年齢の書き方：「7〜14歳」「11才以上」「4才未満」「生後3ヵ月以上」「成人」（数字のない成人・大人は15歳以上）
AGE = re.compile(
    r"(?P<range>(?P<a>\d+)[歳才]?\s*[〜~～\-－]\s*\d+[歳才])"
    r"|生後(?P<m>\d+)[ヵかケカ箇]?月(?P<mup>以上)?"
    r"|(?P<n>\d+)[歳才](?P<kind>以上|未満)?"
    r"|(?P<adult>成人|大人)(?!\s*\()"
)


def usage_from_months(text: str) -> int | None:
    """用法がある最年少の月齢。年齢の区分ごとに下限を出し、「服用しない」区分を除いた最小。
    年齢の書きがない用法（目薬・外用の「1日数回適量」など）は None。外用の年齢の制限は用法ではなく
    使用上の注意に書かれるため、年齢を限っていないとは読まない（推測しない）"""
    text = unicodedata.normalize("NFKC", text)
    if not text.strip():
        return None
    hits = list(AGE.finditer(text))
    if not hits:
        return None
    # 続けて書かれた年齢（「11才以上15才未満」「15才未満7才以上」）は1つの区分にまとめる
    bands: list[list[re.Match]] = []
    for m in hits:
        if bands and m.start() - bands[-1][-1].end() <= 1:
            bands[-1].append(m)
        else:
            bands.append([m])
    lows, floors = [], []
    for i, band in enumerate(bands):
        end = bands[i + 1][0].start() if i + 1 < len(bands) else len(text)
        body = text[band[-1].end() : end]
        if re.search(r"(服用|使用|点眼|投与)(し|させ)ない", body):
            # 「5才未満は使用しないこと」だけのときは、その年齢から用法がある
            floors += [int(m["n"]) * 12 for m in band if m["n"] and m["kind"] == "未満"]
            continue
        low = None
        for m in band:
            if m["range"]:
                v = int(m["a"]) * 12
            elif m["m"]:
                v = int(m["m"]) if m["mup"] else 0
            elif m["n"]:
                v = int(m["n"]) * 12 if m["kind"] != "未満" else None
            else:
                v = 180
            if v is not None:
                low = v if low is None else min(low, v)
        lows.append(0 if low is None else low)
    if lows:
        return min(lows)
    return max(floors) if floors else None


def main(catalog_path: str) -> None:
    rows = {r["id"]: r for r in csv.DictReader(open(catalog_path, encoding="utf-8-sig"))}
    source = open("scripts/demo/build_demo_skus.py", encoding="utf-8").read()
    med_of = dict(re.findall(r'\("([^"]+)", "(med_\d+)"', source))
    skus = json.load(open("src/data/demoSkus.json", encoding="utf-8"))
    checked = date.today().isoformat()
    out = {}
    for sku in skus:
        row = rows.get(med_of.get(sku["id"], ""), {})
        usage = {
            "dosageForm": dosage_form(sku["name"]),
            "usageFromMonths": usage_from_months(row.get("用法用量", "")),
            "source": "既存データの用法用量（年齢区分）と品名",
            "checkedOn": checked,
        }
        out[sku["id"]] = usage
        print(sku["name"], usage["dosageForm"], usage["usageFromMonths"])
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
        f.write("\n")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: product_usage.py <otc_medicines_integrated.csv>")
    main(sys.argv[1])
