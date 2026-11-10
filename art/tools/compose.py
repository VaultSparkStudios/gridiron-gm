"""Player art tools for Gridiron GM: put a jersey number and the moody grade on a blank player sprite.

  python3 compose.py NYG Big_Dark 74 out.png      one player
  python3 compose.py --sheet NYG                  all six of a team, as NYG_sheet.png

Players: art/players/{TEAM}/{TEAM}_{Lean|Athletic|Big}_{Dark|Light}.png (1024x1536, no numbers).
Numbers: art/numbers/{TEAM}.png, a row of ten digits 0-9 (cleaned; the Giants use NYG_original.png).
"""
import os, sys
import cv2, numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
ART = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
NUMBERS = os.path.join(ART, "numbers")
def path(ab, k): return os.path.join(ART, "players", ab, f"{ab}_{k}.png")

def split10(a):
    """Ten digits from a row: each digit as its own shape when they don't touch (keeps italic and
    flared digits whole), else cut between columns."""
    al = a[:, :, 3]
    n, lab, st, _ = cv2.connectedComponentsWithStats((al > 30).astype(np.uint8), 8)
    big = [i for i in range(1, n) if st[i, 3] > al.shape[0] * 0.3]
    if len(big) == 10:
        rows = np.where((al > 60).sum(1) > 2)[0]; y0, y1 = rows[0], rows[-1] + 1
        out = {}
        for d, i in enumerate(sorted(big, key=lambda i: st[i, 0])):
            x, w = st[i, 0], st[i, 2]
            c = a[y0:y1, x:x + w].copy(); c[lab[y0:y1, x:x + w] != i, 3] = 0
            out[str(d)] = c
        return out
    return split10_cols(a)

def split10_cols(a):
    """Ten digit cells from a row of digits: cut at the emptiest column near each expected boundary
    (digits sometimes touch), then trim each cell to its ink."""
    al = a[:, :, 3]; ink = (al > 60).sum(0)
    cols = np.where(ink > 2)[0]; x0, x1 = cols[0], cols[-1] + 1; w = (x1 - x0) / 10
    gaps = [(p, q) for p, q in zip(cols[:-1], cols[1:]) if q - p > 4]
    if len(gaps) == 9: cuts = [x0] + [(p + q) // 2 for p, q in gaps] + [x1]   # ten clear digits
    else:                                                                     # some touch: emptiest column near each expected boundary
        cuts = [x0]
        for k in range(1, 10):
            c = int(x0 + k * w); lo, hi = int(c - w * 0.3), int(c + w * 0.3)
            cuts.append(lo + int(np.argmin(ink[lo:hi])))
        cuts.append(x1)
    rows = np.where((al > 60).sum(1) > 2)[0]; y0, y1 = rows[0], rows[-1] + 1
    out = {}
    for d in range(10):
        c = a[y0:y1, cuts[d]:cuts[d + 1]].copy()
        if d < 9: c[:, -1:, 3] = 0
        # keep the digit itself, drop slivers of its neighbours (small pieces touching the cell edge)
        n, lab, st, _ = cv2.connectedComponentsWithStats((c[:, :, 3] > 30).astype(np.uint8), 8)
        if n > 2:
            big = st[1:, 4].max()
            for i in range(1, n):
                edge = st[i, 0] == 0 or st[i, 0] + st[i, 2] >= c.shape[1]
                if st[i, 4] < big * 0.12 and edge: c[lab == i, 3] = 0
        xs = np.where((c[:, :, 3] > 60).sum(0) > 0)[0]
        out[str(d)] = c[:, xs[0]:xs[-1] + 1]
    return out

def sprites(ab):
    p = os.path.join(NUMBERS, "NYG_original.png" if ab == "NYG" else f"{ab}.png")
    return split10(np.array(Image.open(p).convert("RGBA")))

def clean_alpha(img):
    a = img[:, :, 3].copy(); a[a < 24] = 0; img = img.copy(); img[:, :, 3] = a; return img

def jersey_box(img):
    """The jersey: pixels matching the colour sampled at the middle of the chest (a little lower if
    that spot is the facemask, when the head hangs low)."""
    for f in (0.22, 0.27, 0.32):
        try: return _jersey_box(img, f)
        except IndexError: pass
    raise ValueError("no jersey found")

def _jersey_box(img, f):
    h, w = img.shape[:2]; hsv = cv2.cvtColor(img[:, :, :3], cv2.COLOR_BGR2HSV).astype(int); a = img[:, :, 3]
    ys, xs = np.where(a > 200); cx = int(np.median(xs)); top = ys.min()
    sy = top + int((ys.max() - top) * f)
    ref = np.median(hsv[sy - 10:sy + 10, cx - 30:cx + 30].reshape(-1, 3), 0)
    dh = np.minimum(np.abs(hsv[:, :, 0] - ref[0]), 180 - np.abs(hsv[:, :, 0] - ref[0]))
    if ref[1] > 60 and ref[2] > 50: m = (dh < 12) & (hsv[:, :, 1] > ref[1] * 0.5) & (a > 200)
    else:  # black, white or grey jersey: hue means nothing, match on brightness and low colour instead
        m = (np.abs(hsv[:, :, 2] - ref[2]) < 45) & (hsv[:, :, 1] < max(70, ref[1] + 40)) & (a > 200)
    m[: top + int((ys.max() - top) * 0.1)] = False; m[top + int((ys.max() - top) * 0.42):] = False
    rows = np.where(m.sum(1) > w * 0.08)[0]; cols = np.where(m[rows[0]:rows[-1]].sum(0) > 5)[0]
    return rows[0], rows[-1], cols[0], cols[-1]

def add_number(img, num, ab):
    S = sprites(ab); t, b, l, r = jersey_box(img); jh = b - t
    nh = int(jh * 0.37); cx = (l + r) // 2; cy = t + int(jh * 0.63)
    # a chest logo (NFL shield, team mark) in the middle of the chest: the number starts below it
    hsv = cv2.cvtColor(img[:, :, :3], cv2.COLOR_BGR2HSV); bw = (r - l) // 6
    band = hsv[t:t + int(jh * 0.5), cx - bw:cx + bw]
    logo = (band[:, :, 1] < 70) & (band[:, :, 2] > 150)          # white logo marks only
    rows = np.where(logo.sum(1) > 2)[0]
    if len(rows): cy = max(cy, t + rows[-1] + int(jh * 0.04) + nh // 2)
    gs = [cv2.resize(S[c], (max(1, int(S[c].shape[1] * nh / S[c].shape[0] * (0.92 if len(num) > 1 else 1))), nh), interpolation=cv2.INTER_AREA) for c in num]
    gap = max(1, int(nh * 0.04)); w = sum(g.shape[1] for g in gs) + gap * (len(gs) - 1)
    lay = np.zeros((img.shape[0], img.shape[1], 4), np.uint8); x = cx - w // 2
    for g in gs: lay[cy - nh // 2: cy - nh // 2 + nh, x:x + g.shape[1]] = g; x += g.shape[1] + gap
    m = cv2.GaussianBlur(lay[:, :, 3].astype(np.float32) / 255, (0, 0), 0.8)[:, :, None]
    rgb = lay[:, :, 2::-1].astype(np.float32)
    out = img[:, :, :3] * (1 - m) + rgb * 0.96 * m
    return np.dstack([out.astype(np.uint8), img[:, :, 3]])

def grade(img):
    h, w = img.shape[:2]; bgr = img[:, :, :3].astype(np.float32) / 255
    yy, xx = np.mgrid[0:h, 0:w].astype(np.float32)
    lit = np.clip(1.12 - (yy / h) * 0.85, 0.38, 1.05) * (1 - 0.3 * ((xx - w / 2) / (w / 2)) ** 2)
    out = np.clip(((bgr * lit[:, :, None]) - 0.5) * 1.12 + 0.5, 0, 1)
    return np.dstack([(out * 255).astype(np.uint8), img[:, :, 3]])

def card(ab, k, n, label):
    img = clean_alpha(cv2.imread(path(ab, k), cv2.IMREAD_UNCHANGED))
    im = Image.fromarray(cv2.cvtColor(grade(add_number(img, n, ab)), cv2.COLOR_BGRA2RGBA))
    bg = Image.new("RGBA", im.size, (8, 12, 24, 255)); g = Image.new("RGBA", im.size, (0, 0, 0, 0))
    ImageDraw.Draw(g).ellipse([im.size[0] * 0.1, -im.size[1] * 0.1, im.size[0] * 0.9, im.size[1] * 0.5], fill=(70, 90, 150, 80)); bg.alpha_composite(g.filter(ImageFilter.GaussianBlur(120))); bg.alpha_composite(im)
    c = bg.convert("RGB").crop((170, 0, 854, 900))           # helmet to mid-thigh, like the player card
    ImageDraw.Draw(c).text((14, 10), label, fill=(255, 255, 255), font=ImageFont.load_default())
    return c

if __name__ == "__main__":
    if sys.argv[1] == "--sheet":
        ab = sys.argv[2]; nums = dict(Lean_Dark="8", Lean_Light="13", Athletic_Dark="32", Athletic_Light="44", Big_Dark="99", Big_Light="72")
        tiles = [card(ab, k, n, f"{k.replace('_', ' ')} #{n}") for k, n in nums.items()]
        w, h = tiles[0].size; s = Image.new("RGB", (w * 3 + 20, h * 2 + 10), (7, 11, 22))
        for i, t in enumerate(tiles): s.paste(t, ((i % 3) * (w + 10), (i // 3) * (h + 10)))
        s.save(f"{ab}_sheet.png")
    else:
        ab, k, n, out = sys.argv[1:5]
        img = clean_alpha(cv2.imread(path(ab, k), cv2.IMREAD_UNCHANGED))
        cv2.imwrite(out, grade(add_number(img, n, ab)))
