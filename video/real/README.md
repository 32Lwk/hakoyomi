# 実写（Gemini 生成）への画面はめ込み

1. 実写を作る：`python3 omni_generate.py prompt_v4.txt out/gen-v4b.mp4`（gemini-omni-1.1-flash、鍵は .env.local の GEMINI_API_KEY。Veo 3.1 は 2026-10-22 に終了）。携帯の画面は緑、カメラは右横の斜め後ろ（画面が見える）、右手に携帯・左手に箱、初心者マークは白衣の背中と袖（プロンプトに明記）
2. `remotion` の `JanScreen`（390×800、16秒。実写の携帯の縦横比 約2.05 に合わせた）を `--scale=2` で書き出す（JANを読む → 商品カード）
3. `python3 composite2.py <JanScreen.mp4> <出力.mp4> <実写.mp4> [--debug dir]`（opencv-python-headless・numpy・scipy）。緑の領域の輪郭に角丸の長方形（位置・傾き・幅・高さ）を最小二乗で当て（指で隠れた所は弱く扱う）、時間方向になめらかにして、2倍の解像度で重ねる。動きに合わせたぼかし・粒子・縁の緑かぶり除去つき。`<出力>.quads.json` に追跡した四隅が残る
4. `python3 last_clean.py <出力.mp4> <quads.json> remotion/public/real/last-clean.png`（最後のコマから携帯を消した背景）。出力は `remotion/public/real/jan-real-clip.mp4` に置く
5. `JanDemo-Real` を書き出す（実写 → 端末が実写の携帯に重なって左へ → 画面収録の続き、26秒）

実写の mp4 はリポに入れない。
