# Clean a ChatGPT digit sheet: key out a green-screen background, strip dot textures inside the
# digits, drop specks, then report the ten digit columns.
import sys, glob, os, numpy as np, cv2
from PIL import Image
ART = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
out_dir = os.path.join(ART, "numbers"); os.makedirs(out_dir, exist_ok=True)
DOTS = {"DEN", "DET"}
# the sheet's fill colour matches the home jersey, so the numbers would vanish: fill them white
# (keeping the trim). Miami's sheet came back aqua-filled for a white jersey; the home jersey is aqua.
WHITE_FILL = {"MIA": (70, 100)}   # hue range (OpenCV, 0-180) of the fill to whiten
# a plain white sheet for a team whose real numbers are coloured: recolour the fill, white outline
RECOLOR = {"CLE": (255, 60, 0)}    # Browns orange
for f in sorted(glob.glob(os.path.join(ART, "numbers", "source", "*_Home_Numbers_0-9.png"))):
    ab = os.path.basename(f).split("_")[0]
    im = np.array(Image.open(f).convert("RGBA")).astype(np.float32)
    rgb = im[:, :, :3]
    if im[:, :, 3].min() == 255:                       # green screen
        r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
        green = np.clip((g - np.maximum(r, b) - 40) / 80, 0, 1)   # 1 = pure background
        a = 255 * (1 - green)
        # despill: pull green toward the other channels at the edges
        rgb[..., 1] = np.minimum(g, np.maximum(r, b) + 10 * (1 - green))
        im[:, :, 3] = a
    if ab in DOTS:                                      # dots inside the white fill: paint them white
        hsv = cv2.cvtColor(rgb.astype(np.uint8), cv2.COLOR_RGB2HSV)
        fillish = (im[:, :, 3] > 200)
        white = fillish & (hsv[..., 1] < 40) & (hsv[..., 2] > 200)
        region = cv2.morphologyEx(white.astype(np.uint8), cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8)).astype(bool)
        dots = region & ~white
        rgb[dots] = np.median(rgb[white], 0)
    if ab in WHITE_FILL:
        lo, hi = WHITE_FILL[ab]
        hsv = cv2.cvtColor(rgb.astype(np.uint8), cv2.COLOR_RGB2HSV)
        fill = (hsv[..., 0] >= lo) & (hsv[..., 0] <= hi) & (hsv[..., 1] > 60)
        shade = (hsv[..., 2][fill].astype(np.float32) / max(1, np.percentile(hsv[..., 2][fill], 90)))
        rgb[fill] = (np.clip(shade, 0, 1)[:, None] * 248).repeat(3, 1)
    a = im[:, :, 3]; a[a < 30] = 0
    # remove specks: keep components bigger than a small threshold
    n, lab, st, _ = cv2.connectedComponentsWithStats((a > 0).astype(np.uint8), 8)
    keep = np.zeros(n, bool); keep[1:] = st[1:, 4] > 400
    a[~keep[lab]] = 0
    if ab in RECOLOR:
        k = max(3, int(im.shape[0] * 0.012))                           # outline width
        inner = cv2.erode((a > 128).astype(np.uint8), np.ones((k, k), np.uint8)).astype(bool)
        shade = rgb[..., :].mean(-1) / 255                             # keep the sheet's light and shadow
        rgb[inner] = np.array(RECOLOR[ab], np.float32) * np.clip(shade[inner], 0.75, 1)[:, None]
    res = np.dstack([np.clip(rgb, 0, 255), a]).astype(np.uint8)
    # tight crop to the digits row
    ys = np.where((a > 60).any(1))[0]; res = res[max(0, ys[0] - 4): ys[-1] + 5]
    Image.fromarray(res).save(f"{out_dir}/{ab}.png")
    al = res[:, :, 3]; cols = np.where((al > 60).sum(0) > 2)[0]
    runs = []; st_ = p = cols[0]
    for c in cols[1:]:
        if c - p > 4: runs.append((st_, p)); st_ = c
        p = c
    runs.append((st_, p))
    print(ab, "digits found:", len(runs), "height", res.shape[0])
