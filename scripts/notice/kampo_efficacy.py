"""一般用漢方製剤製造販売承認基準から、デモSKUの処方の〔効能・効果〕を取り出す（開発時のみ、L-20261104-09）。

src/data/efficacy_standards.json の漢方製剤の項（id が kampo_ で始まるもの）を作り直す。文面は承認基準の原文のまま。
処方の一覧（通知の処方番号 → 処方名）は scripts/notice/lib.ts の KAMPO_FORMULAS から読む。

使い方:
  python3 -I scripts/notice/extract.py data/notices/0000160072.pdf data/notices/0000160072.pages.json
  python3 -I scripts/notice/kampo_efficacy.py data/notices/0000160072.pages.json
"""

import json
import re
import sys
from datetime import date

NOTICE = "薬生発0328第1号 平成29年3月28日「一般用漢方製剤製造販売承認基準について」"
URL = "https://www.mhlw.go.jp/file/06-Seisakujouhou-11120000-Iyakushokuhinkyoku/0000160072.pdf"
STANDARDS = "src/data/efficacy_standards.json"

# 承認基準の処方番号（例「２４Ａ」）。全角・半角どちらも来る
NO = r"[0-9０-９]+[A-ZＡ-Ｚ]?"


def formulas() -> list[tuple[int, str]]:
    source = open("scripts/notice/lib.ts", encoding="utf-8").read()
    block = source[source.index("const KAMPO_FORMULAS") :]
    block = block[: block.index("\n];")]
    return [(int(no), name) for no, name in re.findall(r'^\s*\[?\s*(\d+),\s*"([^"]+)"', block, re.M)]


def body_text(pages: list[dict]) -> str:
    # PDF 抽出の空白・改行と、頁の下の「-7-」を落とす（日本語の本文に意味のある空白はない）
    text = "".join(p["text"] for p in pages)
    return re.sub(r"-\d+-", "", re.sub(r"\s+", "", text))


def efficacy(text: str, name: str) -> tuple[str, str]:
    heads = list(re.finditer(rf"({NO}){re.escape(name)}〔成分・分量〕", text))
    if len(heads) != 1:
        raise SystemExit(f"{name}: 承認基準の見出しが {len(heads)} 件")
    rest = text[heads[0].end() :]
    start = rest.index("〔効能・効果〕") + len("〔効能・効果〕")
    end = re.search(rf"{NO}[^〔〕]{{1,40}}?〔成分・分量〕", rest[start:])
    body = rest[start : start + end.start()] if end else rest[start:]
    # 末尾の【注）表記については…】は製造販売業者への記載の指示なので落とす（《備考》の語の説明は残す）
    return heads[0].group(1), re.sub(r"【[^】]*】$", "", body)


def terms(standard_id: str, body: str) -> list[dict]:
    """逆引きの語：「次の諸症：」「次の症状：」より後ろを読点で区切った原文の一部（L-20261104-12）"""
    # 「血の道症注）」の注の印は語に含めない（閉じ括弧で括弧の深さが崩れるため先に除く）
    listed = body.split("《備考》")[0].rsplit("：", 1)[-1].replace("注）", "")
    # 括弧の中の読点（「高血圧の随伴症状（動悸、不安、不眠）」）では区切らない
    words, depth, cur = [], 0, ""
    for ch in listed:
        depth += {"（": 1, "）": -1}.get(ch, 0)
        if ch == "、" and depth == 0:
            words.append(cur)
            cur = ""
        else:
            cur += ch
    words.append(cur)
    out = []
    for i, word in enumerate(w for w in words if w):
        # 「蓄膿症（副鼻腔炎）」は括弧の外と中の語でも照合する
        paren = re.fullmatch(r"([^（]+)（([^）]+)）", word)
        keys = [word, *(g for g in paren.groups() if "、" not in g)] if paren else [word]
        out.append({"id": f"{standard_id}:{i + 1}", "word": word, "keys": list(dict.fromkeys(keys))})
    return out


def main(pages_path: str) -> None:
    text = body_text(json.load(open(pages_path, encoding="utf-8")))
    fetched = date.today().isoformat()
    kampo = []
    for no, name in formulas():
        kijun_no, body = efficacy(text, name)
        kampo.append(
            {
                "id": f"kampo_{no:03d}",
                "name": f"一般用漢方製剤 {name}",
                "noticeGroupIds": [f"kampo_{no:03d}"],
                "notice": NOTICE,
                "sourceUrl": URL,
                "sourcePage": None,
                "fetchedOn": fetched,
                "text": body,
                # 語の前の「比較的体力があるものの次の諸症」（漢方製剤の使い分けの前提。逆引きで語と一緒に出す）
                **({"scope": scope.rsplit("：", 1)[0]} if "：" in (scope := body.split("《備考》")[0]) else {}),
                "terms": terms(f"kampo_{no:03d}", body),
                "note": f"承認基準の処方番号 {kijun_no}",
            }
        )
        print(f"kampo_{no:03d} {name}（{kijun_no}）：{body}")
    standards = json.load(open(STANDARDS, encoding="utf-8"))
    kept = [s for s in standards if not s["id"].startswith("kampo_")]
    with open(STANDARDS, "w", encoding="utf-8") as f:
        json.dump(kept + kampo, f, ensure_ascii=False, indent=2)
        f.write("\n")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit("usage: kampo_efficacy.py <0000160072.pages.json>")
    main(sys.argv[1])
