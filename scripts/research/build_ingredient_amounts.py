"""分量の調査結果（data/research/merged_amounts.json）から src/data/ingredient_amounts.json を作る（L-20261104-13）。

demoSkus.json で分量のない成分だけを補う上書き表。demoSkus.json は別のスクリプトが作るので、直接は書き換えない。
- 内服：調査の基準（1包中・4錠中・1本中など）を、商品の1日最大量あたりに換算する（コードで計算。Claude は使わない）。
  同じ成分が2行（例：安中散の構成生薬と芍薬甘草湯エキスの原生薬）のときは、原生薬の量として足す
- 目薬・点鼻・外用：濃度（100mL中・100g中・% など）を、出典の基準のまま持つ（換算しない）
- 箱で確かめるまで疑わしいもの（出典どうしの食い違い・処方違いの疑い）は uncertain にする

使い方：python3 -I scripts/research/build_ingredient_amounts.py ../data/research/merged_amounts.json
"""

import json
import re
import sys
import unicodedata
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SKUS = ROOT / "src/data/demoSkus.json"
OUT = ROOT / "src/data/ingredient_amounts.json"

# 箱での確認待ち（data/research/README.md の 2.）。値は入れるが「添付文書で確認」と出す
UNCERTAIN = {
    ("サンテFXネオ", "ネオスチグミンメチル硫酸塩"): "公式ページ内で 0.005% と 0.05% の2通り（KEGG は 0.005%）",
    ("ロートCキューブm", None): "同じ JAN が成分の違う「Cキューブ a」として出ている店がある（改版の疑い）",
    ("ユンケル黄帝", None): "KEGG の今の処方が登録の成分と違う（改版の疑い）",
    ("オロナインH軟膏", "クロルヘキシジングルコン酸塩"): "「液（20%）10mg」が液の量か成分の量か出典で不明",
}

# 内服の基準の単位（1包中・4錠中・1本中・1瓶中）
DOSE = re.compile(r"^(\d+)\s*(包|錠|本|瓶|カプセル)")


def norm(s: str) -> str:
    return unicodedata.normalize("NFKC", s).replace(" ", "").lower()


def uncertain_reason(name: str, ingredient: str) -> str | None:
    return UNCERTAIN.get((name, ingredient)) or UNCERTAIN.get((name, None))


def main(research_path: str) -> None:
    skus = {p["id"]: p for p in json.loads(SKUS.read_text(encoding="utf-8"))}
    rows = json.loads(Path(research_path).read_text(encoding="utf-8"))

    grouped: dict[tuple[str, str], list[dict]] = {}
    for r in rows:
        grouped.setdefault((r["id"], r["ingredient"]), []).append(r)

    out = []
    for (pid, ingredient), rs in sorted(grouped.items()):
        p = skus.get(pid)
        if p is None:
            print(f"skip: 商品がない {pid}", file=sys.stderr)
            continue
        fact = next((f for f in p["facts"] if norm(f["ingredient"]) == norm(ingredient)), None)
        if fact is None or (fact["amountPerDay"] is not None and fact["unit"] is not None):
            continue  # 成分がない、またはすでに分量がある
        reason = uncertain_reason(p["name"], ingredient)
        first = rs[0]
        source = {
            "kind": first["source_kind"],
            "url": first["source_url"],
            "checkedOn": first["checked_on"],
            "note": "／".join(filter(None, [reason, *(r.get("note") or "" for r in rs)])) or None,
        }
        entry = {"productId": pid, "ingredient": fact["ingredient"], "uncertain": reason is not None}

        if p["route"] == "internal":
            total = 0.0
            unit = first["unit"]
            for r in rs:
                m = DOSE.match(r["basis"])
                if not m or r["unit"] != unit or r["amount"] is None:
                    sys.exit(f"換算できない：{p['name']} {ingredient} {r['basis']}")
                per = int(m.group(1))
                total += r["amount"] * p["dailyMaxUnits"] / per
            entry |= {
                "amountPerDay": round(total, 4),
                "unit": unit,
                "qualifier": first.get("qualifier") if len(rs) == 1 else "相当",
                "concentration": None,
            }
        else:
            if len(rs) > 1:
                sys.exit(f"外用で同じ成分が複数：{p['name']} {ingredient}")
            entry |= {
                "amountPerDay": None,
                "unit": None,
                "qualifier": first.get("qualifier"),
                "concentration": {
                    "amount": first["amount"],
                    "unit": first["unit"],
                    "basis": first["basis"],
                },
            }
        entry["source"] = source
        out.append(entry)

    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{len(out)} 件を書き出し（uncertain {sum(e['uncertain'] for e in out)}）→ {OUT}")


if __name__ == "__main__":
    main(sys.argv[1])
