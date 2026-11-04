#!/usr/bin/env python3
"""緑の画面の実写に、ハコよみの画面を3次元の姿勢（位置・向き）から重ねる。
  python3 composite2.py <画面素材.mp4（780×1688 など、30fps）> <出力.mp4> <実写.mp4> [--debug dir]
  1. 緑の領域の輪郭に、角丸の長方形（縦横比は画面素材と同じ）の姿勢を最小二乗で当てる（指や切り欠きは外れ値として扱う）
  2. 姿勢を時間方向になめらかにする
  3. 2倍の解像度で射影変換 → 縮小（ギザギザを出さない）。動きに応じたぼかし・粒子・明るさ合わせ・縁の緑かぶり除去
  4. 緑でなくなる所（指・切り欠き）は実写のまま。画面のツヤ（映り込み）は実写から取って足す
"""
import cv2, numpy as np, json, sys, os
from scipy.optimize import least_squares
from scipy.ndimage import gaussian_filter1d

args = [a for a in sys.argv[1:] if not a.startswith("--")]
DEBUG = sys.argv[sys.argv.index("--debug") + 1] if "--debug" in sys.argv else None
if DEBUG: args = [a for a in args if a != DEBUG]; os.makedirs(DEBUG, exist_ok=True)
CONTENT, OUT, SRC = args
FPS = 24

cap = cv2.VideoCapture(SRC); frames = []
while True:
    ok, f = cap.read()
    if not ok: break
    frames.append(f)
H, W = frames[0].shape[:2]
cc = cv2.VideoCapture(CONTENT); cframes = []
while True:
    ok, f = cc.read()
    if not ok: break
    cframes.append(f)
ch, cw = cframes[0].shape[:2]
A = ch / cw                                    # 画面素材の縦/横（参考）
RAD = 0.1                                      # 画面の角の丸み（幅に対する比）

def local_rr(w, h, n=8):
    r = RAD * w; pts = []
    for (cx, cy, a0) in [(w / 2 - r, -h / 2 + r, -90), (w / 2 - r, h / 2 - r, 0), (-w / 2 + r, h / 2 - r, 90), (-w / 2 + r, -h / 2 + r, 180)]:
        for k in range(n + 1):
            t = np.deg2rad(a0 + 90 * k / n)
            pts.append([cx + r * np.cos(t), cy + r * np.sin(t)])
    return np.array(pts, np.float64)

def place(p, loc):
    cx, cy, th, w, h = p; c, s_ = np.cos(th), np.sin(th)
    return loc @ np.array([[c, -s_], [s_, c]]).T + np.array([cx, cy])

def rr_pts(p): return place(p, local_rr(p[3], p[4]))
def corners(p):
    w, h = p[3], p[4]
    return place(p, np.array([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]]))

def seg_dist(P, poly):
    """多角形の外は +、内は −（符号つきの距離）"""
    B = np.roll(poly, -1, axis=0); d = B - poly
    t = np.clip(((P[:, None, :] - poly[None]) * d[None]).sum(-1) / np.maximum((d ** 2).sum(-1), 1e-9)[None], 0, 1)
    q = poly[None] + t[..., None] * d[None]
    dist = np.sqrt(((P[:, None, :] - q) ** 2).sum(-1))
    j = dist.argmin(1); k = np.arange(len(P))
    cross = d[j, 0] * (P[:, 1] - poly[j, 1]) - d[j, 1] * (P[:, 0] - poly[j, 0])
    area = 0.5 * np.sum(poly[:, 0] * np.roll(poly[:, 1], -1) - np.roll(poly[:, 0], -1) * poly[:, 1])
    inside = cross * np.sign(area) > 0
    return np.where(inside, -dist[k, j], dist[k, j])

def residual(P, poly):
    sd = seg_dist(P, poly)
    return np.where(sd < 0, 0.12 * sd, sd)   # 指で隠れた所の輪郭は内側に来る：弱く扱い、外にはみ出すほうを強く罰する

def order(pts, prev=None):
    pts = np.array(pts, np.float32).reshape(-1, 2)
    s = pts.sum(1); d = pts[:, 0] - pts[:, 1]
    q = np.array([pts[np.argmin(s)], pts[np.argmax(d)], pts[np.argmax(s)], pts[np.argmin(d)]], np.float32)
    if prev is not None:
        best = min(range(4), key=lambda k: np.linalg.norm(np.roll(q, -k, 0) - prev))
        q = np.roll(q, -best, 0)
    return q

def greenness(f):
    b, g, r = [x.astype(np.float32) for x in cv2.split(f)]
    return g - np.maximum(r, b), r, g, b

def init_params(P):
    best = None
    for deg in range(-60, 61, 2):
        th = np.deg2rad(deg); c, s_ = np.cos(th), np.sin(th)
        Q = P @ np.array([[c, s_], [-s_, c]]).T          # -th 回す
        mn, mx = Q.min(0), Q.max(0); w, h = mx - mn
        if h < w: continue
        if best is None or w * h < best[0]:
            ctr = ((mn + mx) / 2) @ np.array([[c, -s_], [s_, c]]).T
            best = (w * h, np.array([ctr[0], ctr[1], th, w, h]))
    return best[1] if best else None

poses = [None] * len(frames); info = [None] * len(frames)
prev = None
for i, f in enumerate(frames):
    gr, r, g, b = greenness(f)
    m = (gr > 25).astype(np.uint8) * 255
    m = cv2.morphologyEx(m, cv2.MORPH_OPEN, np.ones((3, 3), np.uint8))
    m = cv2.morphologyEx(m, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25)))
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_NONE)
    cs_all = [c for c in cs if cv2.contourArea(c) > 40]
    cs = [c for c in cs_all if cv2.contourArea(c) > 700]
    if not cs: prev = None; continue
    if prev is not None:
        c = min(cs, key=lambda c: np.linalg.norm(c.reshape(-1, 2).mean(0) - prev[:2]) - 0.002 * cv2.contourArea(c))
    else:
        c = max(cs, key=cv2.contourArea)
    cen0 = c.reshape(-1, 2).mean(0)                    # 指で画面が分かれて見えるときは、近くの小さな緑の領域も同じ画面として使う
    allc = [c] + [o for o in cs_all if o is not c and np.linalg.norm(o.reshape(-1, 2).mean(0) - cen0) < 250]
    P = np.concatenate(allc).reshape(-1, 2).astype(np.float64)
    P = P[(P[:, 0] > 2) & (P[:, 0] < W - 3) & (P[:, 1] > 2) & (P[:, 1] < H - 3)]
    P = P[:: max(1, len(P) // 300)]
    p0 = init_params(P)
    if p0 is None: prev = None; continue
    anchor = prev if prev is not None else p0
    def fun(p):
        res = residual(P, rr_pts(p))
        if prev is None: return res
        return np.r_[res, 2.5 * (p[:2] - prev[:2]), 300 * (p[2] - prev[2]), 2.5 * (p[3:] - prev[3:])]
    best = None
    for st in ([p0] + ([prev] if prev is not None else [])):
        try: rs = least_squares(fun, st, loss="soft_l1", f_scale=1.5, max_nfev=80)
        except Exception: continue
        if best is None or rs.cost < best.cost: best = rs
    if best is None: prev = None; continue
    poses[i] = best.x; prev = best.x; info[i] = float(best.cost / max(1, len(P)))

# 時間方向のなめらかさ（連続した区間ごと）
idx = [i for i in range(len(frames)) if poses[i] is not None]
segs = []; cur = []
for i in idx:
    if cur and i != cur[-1] + 1: segs.append(cur); cur = []
    cur.append(i)
if cur: segs.append(cur)
for sg in segs:
    arr = np.array([poses[i] for i in sg])
    sm = gaussian_filter1d(arr, 1.3, axis=0, mode="nearest") if len(arr) > 3 else arr
    for n, i in enumerate(sg): poses[i] = sm[n]
print("frames", len(frames), "tracked", len(idx), "mean fit px", round(float(np.mean([info[i] for i in idx])), 3))

json.dump({"w": W, "h": H, "fps": FPS, "quads": [None if p is None else np.round(corners(p), 1).tolist() for p in poses]},
          open(OUT.replace(".mp4", ".quads.json"), "w"))

SS = 2
tmp = OUT + ".silent.mp4"
vw = cv2.VideoWriter(tmp, cv2.VideoWriter_fourcc(*"mp4v"), FPS, (W, H))
rng = np.random.default_rng(7)
src_rect = np.array([[0, 0], [cw, 0], [cw, ch], [0, ch]], np.float32)
prev_c = None
for i, f in enumerate(frames):
    out = f
    gr, r, g, b = greenness(f)
    if poses[i] is not None:
        quad = corners(poses[i]).astype(np.float32)
        cen = quad.mean(0)
        vel = 0.0 if prev_c is None else float(np.linalg.norm(cen - prev_c)); prev_c = cen
        # 画面素材を2倍の解像度に射影（高精細のまま INTER_LANCZOS4 で縮小してから射影）
        tw = max(16, int(np.linalg.norm(quad[1] - quad[0]) * SS * 2.0))
        cimg = cframes[min(len(cframes) - 1, int(round(i / FPS * 30)))]
        small = cv2.resize(cimg, (tw, int(tw * A)), interpolation=cv2.INTER_AREA)
        sh, sw = small.shape[:2]
        Hm = cv2.getPerspectiveTransform(np.array([[0, 0], [sw, 0], [sw, sh], [0, sh]], np.float32), quad * SS)
        wc = cv2.warpPerspective(small, Hm, (W * SS, H * SS), flags=cv2.INTER_CUBIC, borderMode=cv2.BORDER_REPLICATE)
        poly = (rr_pts(poses[i]) * SS).astype(np.int32)
        geo2 = np.zeros((H * SS, W * SS), np.uint8); cv2.fillPoly(geo2, [poly], 255, cv2.LINE_AA)
        wc = cv2.resize(wc, (W, H), interpolation=cv2.INTER_AREA).astype(np.float32)
        geo = cv2.resize(geo2, (W, H), interpolation=cv2.INTER_AREA).astype(np.float32) / 255
        geo_d = np.clip(cv2.dilate(geo, np.ones((5, 5), np.uint8)) * 1.0, 0, 1)
        # 動き・粒子・明るさ（文字が鮮明に読めるよう、ぼかしと粒子は最小限にする）
        sig = 0.25 + 0.12 * min(vel, 5.0)
        wc = cv2.GaussianBlur(wc, (0, 0), sig)
        wc = wc * 0.98 + rng.normal(0, 0.7, wc.shape).astype(np.float32)
        # 緑の度合い（アルファ）と、指・切り欠きの除外
        core = cv2.erode(geo, np.ones((7, 7), np.uint8)) > 0.9
        vals = gr[core & (gr > 20)]
        med = float(np.median(vals)) if vals.size > 50 else 120.0
        grs = cv2.GaussianBlur(gr, (0, 0), 1.4)        # 圧縮のブロック雑音をならす
        matte = np.clip((grs - 0.3 * med) / (0.3 * med), 0, 1)
        mn = np.minimum(np.minimum(r, g), b)
        glare_m = np.clip((mn - 120) / 60, 0, 1) * (g >= r - 15)
        geo_big = (cv2.dilate(geo, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (25, 25))) > 0.01).astype(np.float32)
        a = np.maximum(matte * geo_d, (matte > 0.85) * matte * geo_big)  # モデルが少しずれても、緑は必ず画面で置き換える
        a = cv2.GaussianBlur(a, (0, 0), 0.5)[..., None]
        # 画面のツヤ（映り込み）をごく控えめに足す
        base = float(np.median(mn[core & (gr > 0.6 * med)])) if (core & (gr > 0.6 * med)).any() else 30.0
        refl = np.clip(mn - base - 8, 0, 90)[..., None] * 0.22 * (geo[..., None])
        scr = np.clip(wc + refl, 0, 255)
        # 縁の緑かぶりを消す（画面の外側 3px まで）
        ring = (cv2.dilate(geo, np.ones((9, 9), np.uint8)) > 0.01)[..., None]
        bb, gg, rr_ = cv2.split(f.astype(np.float32))
        gcl = np.where(ring[..., 0], np.minimum(gg, np.maximum(rr_, bb)), gg)
        clean = cv2.merge([bb, gcl, rr_])
        comp = clean * (1 - a) + scr * a
        # 画面の光が周りに少しにじむ
        glow = cv2.GaussianBlur(scr * geo[..., None], (0, 0), 10) * 0.09 * (1 - geo[..., None])
        out = np.clip(comp + glow, 0, 255).astype(np.uint8)
        if DEBUG and i % 20 == 0:
            dbg = f.copy(); cv2.polylines(dbg, [rr_pts(poses[i]).astype(np.int32)], True, (0, 0, 255), 1, cv2.LINE_AA)
            cv2.imwrite(os.path.join(DEBUG, f"f{i:03d}.png"), dbg)
    else:
        prev_c = None
        m = (gr > 40) & (cv2.erode((gr > 25).astype(np.uint8), np.ones((3, 3), np.uint8)) > 0)
        if m.sum() > 30:                           # 追えなかったコマに緑が残らないよう、暗い画面で埋める
            mm = cv2.GaussianBlur(m.astype(np.float32), (0, 0), 0.8)[..., None]
            bb, gg, rr_ = cv2.split(f.astype(np.float32))
            clean = cv2.merge([bb, np.minimum(gg, np.maximum(rr_, bb)), rr_])
            out = np.clip(clean * (1 - mm) + 20 * mm, 0, 255).astype(np.uint8)
    vw.write(out)
vw.release()
os.system(f'ffmpeg -v error -y -i "{tmp}" -c:v libx264 -crf 14 -pix_fmt yuv420p -an "{OUT}" && rm -f "{tmp}"')
print("done", OUT)
