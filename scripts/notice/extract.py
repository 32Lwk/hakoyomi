"""通知PDFをページごとのテキストにする（開発時のみ）。

使い方: python3 -I scripts/notice/extract.py data/notices/001742612.pdf data/notices/001742612.pages.json
出力は [{"page": 1, "text": "..."}, ...]。data/ はリポに入れない。
"""

import json
import sys

import pypdf


def main() -> None:
    if len(sys.argv) != 3:
        sys.exit("usage: extract.py <pdf> <out.json>")
    pdf_path, out_path = sys.argv[1], sys.argv[2]
    reader = pypdf.PdfReader(pdf_path)
    pages = [{"page": i + 1, "text": page.extract_text() or ""} for i, page in enumerate(reader.pages)]
    with open(out_path, "w", encoding="utf-8") as f:
        json.dump(pages, f, ensure_ascii=False, indent=1)
    print(f"{len(pages)} pages -> {out_path}")


if __name__ == "__main__":
    main()
