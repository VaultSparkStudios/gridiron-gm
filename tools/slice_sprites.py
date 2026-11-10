# Usage: python3 tools/slice_sprites.py <folder of team sheet PNGs> <out folder>; copy the .webp files to
# public/sprites/ and merge index.json (plus each atlas size) into src/pixel/teamSprites.json.
# Cut each team sheet (2 rows of 8 players on magenta) into 16 transparent players and pack them into
# one atlas per team. No repainting: background out, crop, a uniform downscale, nothing else.
import sys, glob, json, re, os
import numpy as np
from PIL import Image
src, out = sys.argv[1], sys.argv[2]
os.makedirs(out, exist_ok=True)
POSES = ["qb", "rb", "wr", "te", "ol", "dl", "lb", "db"]
SCALE = 0.5
index, problems = {}, []
for f in sorted(glob.glob(f"{src}/*/*.png")):
    ab = re.search(r"\d+_([A-Z]+)_", os.path.basename(f)).group(1)
    im = np.array(Image.open(f).convert("RGB")).astype(int)
    r, g, b = im[..., 0], im[..., 1], im[..., 2]
    # magenta and the pink fringe blended into it
    bg = (r - g > 70) & (b - g > 70) & (np.abs(r - b) < 110)
    fg = ~bg
    cells = {}
    H = im.shape[0]
    for row, (y0, y1) in enumerate([(0, H // 2), (H // 2, H)]):
        cols = fg[y0:y1].sum(0) > 2
        segs, inside = [], False
        for x, c in enumerate(list(cols) + [False]):
            if c and not inside: start, inside = x, True
            elif not c and inside: segs.append([start, x]); inside = False
        segs = [s for s in segs if s[1] - s[0] > 6]
        # glue specks to their neighbor until there are 8 players
        while len(segs) > 8:
            gaps = [segs[i + 1][0] - segs[i][1] for i in range(len(segs) - 1)]
            i = int(np.argmin(gaps)); segs[i] = [segs[i][0], segs[i + 1][1]]; del segs[i + 1]
        if len(segs) != 8: problems.append(f"{ab} row {row}: {len(segs)} players"); continue
        for k, (x0, x1) in enumerate(segs):
            m = fg[y0:y1, x0:x1]; ys = np.where(m.any(1))[0]
            a, z = y0 + ys.min(), y0 + ys.max() + 1
            crop = np.zeros((z - a, x1 - x0, 4), np.uint8)
            crop[..., :3] = im[a:z, x0:x1]; crop[..., 3] = np.where(fg[a:z, x0:x1], 255, 0)
            cells[(row, k)] = Image.fromarray(crop)
    if problems and problems[-1].startswith(ab): continue
    # one atlas: home row then away row, each player scaled the same
    sc = {kk: v.resize((max(1, round(v.width * SCALE)), max(1, round(v.height * SCALE))), Image.LANCZOS) for kk, v in cells.items()}
    W = sum(sc[(0, k)].width for k in range(8)) + 16 + max(0, sum(sc[(1, k)].width for k in range(8)) - sum(sc[(0, k)].width for k in range(8)))
    W = max(sum(sc[(r_, k)].width + 2 for k in range(8)) for r_ in (0, 1))
    Hh = [max(sc[(r_, k)].height for k in range(8)) for r_ in (0, 1)]
    atlas = Image.new("RGBA", (W, Hh[0] + Hh[1] + 2), (0, 0, 0, 0))
    meta = {"home": {}, "away": {}}
    y = 0
    for r_, kit in ((0, "home"), (1, "away")):
        x = 0
        for k, pose in enumerate(POSES):
            c = sc[(r_, k)]; atlas.paste(c, (x, y)); meta[kit][pose] = [x, y, c.width, c.height]; x += c.width + 2
        y += Hh[r_] + 2
    atlas.save(f"{out}/{ab}.webp", "WEBP", quality=90, alpha_quality=100, method=6)
    index[ab] = meta
json.dump(index, open(f"{out}/index.json", "w"), separators=(",", ":"))
print(len(index), "teams;", "problems:", problems or "none")
