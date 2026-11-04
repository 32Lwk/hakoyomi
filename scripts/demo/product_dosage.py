"""デモSKUの用法・用量の表（年齢区分・1回量・1日の回数・服用間隔の値）を作る（開発時のみ、L-20261104-22）。

既存データ（統合マスター）の用法用量から、年齢区分ごとの値だけをコードで取り出す。
「なるべく空腹時をさけて」などの文面は書き出さない（prd：添付文書本文の表示はしない、rules §4-4）。
取り出せない品は書かない（画面は「添付文書で確認」）。

使い方:
  python3 -I scripts/demo/product_dosage.py <otc_medicines_integrated.csv>
"""

import csv
import json
import re
import sys
import unicodedata
from datetime import date

OUT = "src/data/product_dosage.json"

# 年齢の書き方は product_usage.py と同じ
AGE = re.compile(
    r"(?P<range>(?P<a>\d+)[歳才]?\s*[〜~～\-－]\s*(?P<b>\d+)[歳才](?P<rkind>以上|未満)?)"
    r"|生後(?P<m>\d+)[ヵかケカ箇]?月(?P<mkind>以上|未満)?"
    r"|(?P<n>\d+)[歳才](?P<kind>以上|未満)?"
    r"|(?P<adult>成人|大人)(?!\s*\()"
)
UNIT = r"錠|カプセル|包|g|mL|ml|粒|丸|本|枚|滴|個|袋|瓶|cm|プッシュ|噴霧"
# 1回量。分数（2/3包）・小数（0.65g）・幅（2〜3錠）をそのまま取る
NUM = r"\d+(?:[./]\d+)?"
DOSE = re.compile(rf"(?<![\d./])(?P<q>{NUM}(?:\s*[〜~～]\s*{NUM})?)\s*(?P<u>{UNIT})")
NOT_USE = re.compile(r"(服用|使用|点眼|投与)(し|させ)ない")
TIMES = re.compile(r"1日\s*(?P<t>\d+(?:\s*[〜~～]\s*\d+)?)\s*回")
BAND_TIMES = re.compile(r"[:：]\s*(?:1日)?\s*(?P<t>\d+(?:\s*[〜~～]\s*\d+)?)\s*回")
INTERVAL = re.compile(r"(?P<h>\d+)\s*時間以上")


def age_label(band: list[re.Match]) -> str:
    # 「15歳未満7歳以上」は「7歳以上15歳未満」の順にそろえる
    band = sorted(band, key=lambda m: (m["kind"] or m["mkind"] or "") == "未満")
    parts = []
    for m in band:
        if m["range"]:
            parts.append(f"{m['a']}〜{m['b']}歳{m['rkind'] or ''}")
        elif m["m"]:
            parts.append(f"生後{m['m']}か月{m['mkind'] or ''}")
        elif m["n"]:
            parts.append(f"{m['n']}歳{m['kind'] or ''}")
        else:
            parts.append("15歳以上")
    return "".join(parts)


def dosage_table(text: str) -> dict | None:
    text = unicodedata.normalize("NFKC", text).replace("才", "歳")
    hits = list(AGE.finditer(text))
    if not hits:
        return None
    bands: list[list[re.Match]] = []
    for m in hits:
        # 「成人(15歳以上)」の括弧の中は成人と同じ区分
        if bands and m.start() - bands[-1][-1].end() <= 1:
            bands[-1].append(m)
        else:
            bands.append([m])
    rows = []
    for i, band in enumerate(bands):
        end = bands[i + 1][0].start() if i + 1 < len(bands) else len(text)
        body = text[band[-1].end() : end]
        if NOT_USE.search(body[:20]):
            rows.append({"age": age_label(band), "dose": None, "times": None})
            continue
        dose = DOSE.search(body)
        if not dose or dose.start() > 25:
            continue
        times = BAND_TIMES.search(body[dose.end() : dose.end() + 12])
        rows.append(
            {
                "age": age_label(band),
                "dose": re.sub(r"[~～]", "〜", re.sub(r"\s+", "", dose["q"])) + dose["u"],
                "times": f"{re.sub(r'\s+', '', times['t'])}回" if times else None,
            }
        )
    # 量のある行が1つもない・同じ年齢が重なる（「15歳以上」と「5歳以上」が並ぶなど）ものは取り出せていない
    open_ended = [r for r in rows if r["dose"] and re.fullmatch(r"\d+歳以上", r["age"])]
    if (
        not any(r["dose"] for r in rows)
        or len({r["age"] for r in rows}) != len(rows)
        or len(open_ended) > 1
    ):
        return None
    # 行ごとに回数があるときは、全体の回数は持たない（別の文の回数を拾わないため）
    times = None if any(r["times"] for r in rows) else TIMES.search(text)
    interval = INTERVAL.search(text)
    return {
        "rows": rows,
        "timesPerDay": f"{re.sub(r'\s+', '', times['t'])}回" if times else None,
        "intervalHours": int(interval["h"]) if interval else None,
    }


def main(catalog_path: str) -> None:
    rows = {r["id"]: r for r in csv.DictReader(open(catalog_path, encoding="utf-8-sig"))}
    source = open("scripts/demo/build_demo_skus.py", encoding="utf-8").read()
    med_of = dict(re.findall(r'\("([^"]+)", "(med_\d+)"', source))
    skus = json.load(open("src/data/demoSkus.json", encoding="utf-8"))
    checked = date.today().isoformat()
    out = {}
    for sku in skus:
        table = dosage_table(rows.get(med_of.get(sku["id"], ""), {}).get("用法用量", ""))
        print(sku["name"], json.dumps(table, ensure_ascii=False) if table else "-")
        if table:
            out[sku["id"]] = {
                **table,
                "source": "既存データの用法用量（年齢・1回量・回数の値のみ）",
                "checkedOn": checked,
            }
    with open(OUT, "w", encoding="utf-8") as f:
        json.dump(out, f, ensure_ascii=False, indent=2)
        f.write("\n")
    print(f"{len(out)}/{len(skus)}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: product_dosage.py <otc_medicines_integrated.csv>")
    main(sys.argv[1])
