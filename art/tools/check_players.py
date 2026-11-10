import sys, glob, numpy as np, cv2, os
from PIL import Image
ART = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "players")
for ab in sys.argv[1:]:
    files = sorted(f for f in glob.glob(os.path.join(ART if not os.path.isdir(ab) else ".", ab, "**", "*"), recursive=True) if os.path.isfile(f))
    print(f"== {ab}: {len(files)} files", [os.path.basename(f) for f in files if not f.endswith('.png')])
    rows = []
    for f in files:
        if not f.endswith(".png"): continue
        im0 = Image.open(f); im = np.array(im0.convert("RGBA")); a = im[:, :, 3]; sol = a > 200
        ys = np.where(sol.any(1))[0]; top, bot = ys[0], ys[-1]; h = bot - top
        n, _, st, _ = cv2.connectedComponentsWithStats((a > 24).astype(np.uint8), 8); ar = st[1:, 4]
        islands = int((ar[ar != ar.max()] > 30).sum())
        # multiple players? count tall components
        tall = int(sum(1 for i in range(1, n) if st[i, 3] > im.shape[0] * 0.5))
        hsv = cv2.cvtColor(im[:, :, 2::-1].copy(), cv2.COLOR_BGR2HSV); band = slice(top + int(h * .22), top + int(h * .38))
        sk = sol[band] & (hsv[band][:, :, 0] < 25) & (hsv[band][:, :, 1] > 40) & (hsv[band][:, :, 1] < 200)
        v = hsv[band][:, :, 2][sk]
        rows.append((os.path.basename(f), im0.size, im0.mode, int(a.min()), top, bot, int(sol[top + int(h * .33)].sum()), int(np.median(v)) if len(v) else -1, islands, tall))
    for r in rows: print("  %-26s %s %s minA=%d top=%d bot=%d belly=%d skin=%d islands=%d players=%d" % r)
