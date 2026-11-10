# Usage: python3 tools/slice_actions.py <folder with TEAM/Home|Away/*_Set_[ABC]_*.png> <out folder>
# Cut the action sheets (one row of 8 players on magenta per image, sets A, B and C, home and away)
# into transparent players and pack one atlas per team; copy the .webp files to public/sprites/act/
# and merge index.json into src/pixel/actionSprites.json.
# No repainting: background out, crop, one uniform downscale. A football drawn loose beside a player
# (a throw, a kick, a swat) is left out; the game draws its own ball in flight.
import sys, glob, json, re, os
from collections import deque
import numpy as np
from PIL import Image

src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
SCALE = 0.5
TEAM = {"NY_Giants": "NYG", "Houston_Texans": "HOU"}
index, problems = {}, []


def components(mask):
    """Connected areas of a boolean mask (4-neighbour): list of (ys, xs) arrays."""
    seen = np.zeros_like(mask)
    H, W = mask.shape
    out_ = []
    for y0, x0 in zip(*np.nonzero(mask)):
        if seen[y0, x0]: continue
        q = deque([(y0, x0)]); seen[y0, x0] = True; ys, xs = [], []
        while q:
            y, x = q.popleft(); ys.append(y); xs.append(x)
            for dy, dx in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                yy, xx = y + dy, x + dx
                if 0 <= yy < H and 0 <= xx < W and mask[yy, xx] and not seen[yy, xx]:
                    seen[yy, xx] = True; q.append((yy, xx))
        out_.append((np.array(ys), np.array(xs)))
    return out_


def cut(path):
    im = np.array(Image.open(path).convert("RGB")).astype(int)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    fg = ~((r - g > 70) & (b - g > 70) & (np.abs(r - b) < 110))
    comps = sorted(components(fg), key=lambda c: -len(c[0]))
    if len(comps) < 8: return None, f"only {len(comps)} shapes"
    # the eight biggest shapes are the players, left to right; every smaller piece (a hand drawn
    # apart from the arm, a speck) joins the player it sits closest to, except a loose football
    bodies = sorted(comps[:8], key=lambda c: c[1].mean())
    box = [(c[0].min(), c[0].max(), c[1].min(), c[1].max()) for c in bodies]
    keep = [[c] for c in bodies]
    for ys, xs in comps[8:]:
        px = im[ys, xs]
        brown = np.mean((px[:, 0] > px[:, 1] + 25) & (px[:, 1] > px[:, 2]) & (px[:, 0] < 200))
        def dist(bx):
            y0, y1, x0, x1 = bx
            dy = max(0, y0 - ys.max(), ys.min() - y1); dx = max(0, x0 - xs.max(), xs.min() - x1)
            return dx + dy
        d = [dist(bx) for bx in box]; k = int(np.argmin(d))
        if brown > 0.5 and len(ys) > 60: continue  # a loose football (a held one is part of the player)
        if d[k] > 40: continue  # stray mark far from anyone
        keep[k].append((ys, xs))
    cells = []
    for parts in keep:
        ys = np.concatenate([p[0] for p in parts]); xs = np.concatenate([p[1] for p in parts])
        a, z, l, rr = ys.min(), ys.max() + 1, xs.min(), xs.max() + 1
        crop = np.zeros((z - a, rr - l, 4), np.uint8)
        crop[ys - a, xs - l, :3] = im[ys, xs]; crop[ys - a, xs - l, 3] = 255
        img = Image.fromarray(crop)
        cells.append(img.resize((max(1, round(img.width * SCALE)), max(1, round(img.height * SCALE))), Image.LANCZOS))
    return cells, None


for team_dir in sorted(glob.glob(f"{src}/*/")):
    name = os.path.basename(team_dir.rstrip("/"))
    ab = TEAM.get(name) or re.sub(r"[^A-Z]", "", name)[:3]
    poses = {}
    for kit in ("Home", "Away"):
        for st in ("A", "B", "C"):
            f = glob.glob(f"{team_dir}{kit}/*_Set_{st}[._]*png")
            if not f: problems.append(f"{ab} {kit} set {st}: missing"); continue
            cells, err = cut(f[0])
            if err: problems.append(f"{ab} {kit} set {st}: {err}"); continue
            for k, c in enumerate(cells): poses[(kit.lower(), f"{st.lower()}{k + 1}")] = c
    if len(poses) != 48: continue
    # one atlas: a row per kit and set (home a, b, c, then away a, b, c)
    rows = [(kit, st) for kit in ("home", "away") for st in "abc"]
    W = max(sum(poses[(kit, f"{st}{k}")].width + 2 for k in range(1, 9)) for kit, st in rows)
    Hs = [max(poses[(kit, f"{st}{k}")].height for k in range(1, 9)) for kit, st in rows]
    atlas = Image.new("RGBA", (W, sum(Hs) + 2 * len(rows)), (0, 0, 0, 0))
    meta = {"home": {}, "away": {}}
    y = 0
    for (kit, st), h in zip(rows, Hs):
        x = 0
        for k in range(1, 9):
            c = poses[(kit, f"{st}{k}")]
            atlas.paste(c, (x, y + h - c.height))  # feet on the row's floor
            meta[kit][f"{st}{k}"] = [x, y + h - c.height, c.width, c.height]
            x += c.width + 2
        y += h + 2
    meta["size"] = [atlas.width, atlas.height]
    atlas.save(f"{out}/{ab}.webp", "WEBP", quality=90, alpha_quality=100, method=6)
    index[ab] = meta

json.dump(index, open(f"{out}/index.json", "w"), separators=(",", ":"))
print(len(index), "teams;", "problems:", problems or "none")
