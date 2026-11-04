#!/usr/bin/env python3
"""Gemini API（gemini-omni-1.1-flash、Interactions API）で実写の素材を作る（Veo 3.1 は 2026-10-22 に終了）。
鍵は hakoyomi/.env.local の GEMINI_API_KEY（表示しない）。
  python3 omni_generate.py <prompt.txt> <out.mp4> [--prev <interaction id>]   # --prev：直前の動画を言葉で直す
"""
import argparse, base64, json, pathlib, sys, urllib.error, urllib.request

ROOT = pathlib.Path(__file__).resolve().parents[2]
key = next(l.split("=", 1)[1].strip().strip("\"'") for l in (ROOT / ".env.local").read_text().splitlines() if l.startswith("GEMINI_API_KEY="))
ap = argparse.ArgumentParser()
ap.add_argument("prompt"); ap.add_argument("out")
ap.add_argument("--prev"); ap.add_argument("--resolution", default="720p")
a = ap.parse_args()

body = {"model": "gemini-omni-1.1-flash", "input": pathlib.Path(a.prompt).read_text(),
        "response_format": {"type": "video", "aspect_ratio": "16:9", "resolution": a.resolution}}
if a.prev: body["previous_interaction_id"] = a.prev
req = urllib.request.Request("https://generativelanguage.googleapis.com/v1beta/interactions", data=json.dumps(body).encode(),
                             headers={"x-goog-api-key": key, "Content-Type": "application/json"})
try:
    res = json.load(urllib.request.urlopen(req, timeout=900))
except urllib.error.HTTPError as e:
    print("HTTP", e.code, e.read().decode()[:800]); sys.exit(1)

found = []
def walk(x):
    if isinstance(x, dict):
        if x.get("type") == "video" and isinstance(x.get("data"), str): found.append(x["data"])
        for v in x.values(): walk(v)
    elif isinstance(x, list):
        for v in x: walk(v)
walk(res)
meta = json.dumps(res, ensure_ascii=False)
for d in found: meta = meta.replace(d, "<base64>")
pathlib.Path(a.out).with_suffix(".json").write_text(meta)
if not found:
    print("動画なし：", meta[:800]); sys.exit(1)
pathlib.Path(a.out).write_bytes(base64.b64decode(found[0]))
print("saved", a.out, "id:", res.get("id"))
