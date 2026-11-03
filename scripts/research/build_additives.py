"""添加物の調査結果（data/research/additives_merged.json）から src/data/additives.json を作る（L-20261104-18）。

ハラールに関わる事実（アルコール・ゼラチン等）を出すための添加物の一覧。名前は出典（KEGG MEDICUS・メーカー公式）の
とおりで、由来は出典に書かれていないので持たない。アプリはハラールかどうかを判断しない。
見つからなかった商品（販売終了の可能性）は入れない。

使い方：python3 -I scripts/research/build_additives.py ../data/research/additives_merged.json
"""

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
SKUS = ROOT / "src/data/demoSkus.json"
OUT = ROOT / "src/data/additives.json"


def main(research_path: str) -> None:
    ids = {p["id"] for p in json.loads(SKUS.read_text(encoding="utf-8"))}
    rows = json.loads(Path(research_path).read_text(encoding="utf-8"))
    out = []
    for r in sorted(rows, key=lambda r: r["id"]):
        if r["id"] not in ids:
            print(f"skip: 商品がない {r['id']}", file=sys.stderr)
            continue
        if r["additives"] is None:
            continue
        out.append(
            {
                "productId": r["id"],
                "additives": [a.strip() for a in r["additives"] if a.strip()],
                "capsule": bool(r.get("capsule")),
                "source": {
                    "kind": r["source_kind"],
                    "url": r["source_url"],
                    "checkedOn": r["checked_on"],
                    "note": r.get("note") or None,
                },
            }
        )
    OUT.write_text(json.dumps(out, ensure_ascii=False, indent=1) + "\n", encoding="utf-8")
    print(f"{len(out)} 品を書き出し → {OUT}")


if __name__ == "__main__":
    main(sys.argv[1])
