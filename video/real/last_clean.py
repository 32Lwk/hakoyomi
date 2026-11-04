# 実写の最後のコマから、携帯（画面と枠）を消した背景の止め絵を作る。composite.py の出力と quads.json を使う
#   python3 last_clean.py <composited.mp4> <quads.json> <out.png>
import cv2, json, sys, numpy as np
cap = cv2.VideoCapture(sys.argv[1]); n = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
cap.set(cv2.CAP_PROP_POS_FRAMES, n - 1); ok, f = cap.read()
q = np.array(json.load(open(sys.argv[2]))["quads"][n - 1], np.float32)
c = q.mean(0); q = c + (q - c) * 1.22          # 携帯の枠まで含めて少し大きく
m = np.zeros(f.shape[:2], np.uint8); cv2.fillConvexPoly(m, q.astype(np.int32), 255)
m = cv2.dilate(m, np.ones((9, 9), np.uint8))
cv2.imwrite(sys.argv[3], cv2.inpaint(f, m, 7, cv2.INPAINT_TELEA))
