"""Exports the player art the game loads, into public/players/:

  {TEAM}/{Lean|Athletic|Big}_{Dark|Light}.webp   blank players, cropped helmet to mid-thigh (684x912)
  nums/{TEAM}.webp                               the team's ten digits in a row (260 px tall)
  NYG/n/{NN}.webp                                the numbered Giants renders (new Giants, 1086x1448)
  {TEAM}/c/{Last}_{NN}.webp                      custom renders of named players (any team)
  manifest.json                                  where each number goes, digit cells, which art exists

  python3 export_web.py [skin.json] [--keep]   (skin.json: ESPN ids of players with darker skin, measured from
  headshots; without it the list already in the manifest is kept)
The game adds the number and the lighting itself (src/playerArt.js), so the files stay blank.
"""
import os, re, sys, json, glob
import cv2, numpy as np
from PIL import Image
from compose import ART, sprites, clean_alpha, jersey_box, path

ROOT = os.path.join(ART, "..")
OUT = os.path.join(ROOT, "public", "players")
CROP = (170, 0, 854, 912)             # x0, y0, x1, y1 of a 1024x1536 sprite: helmet to mid-thigh
KINDS = [f"{b}_{s}" for b in ("Lean", "Athletic", "Big") for s in ("Dark", "Light")]

KEEP = "--keep" in sys.argv   # leave files that already exist (just rebuild the manifest)

# Full resolution: the spotlight shows a player up to ~1,500 screen pixels tall on a sharp display.
def webp(img_bgra, dst):
    if KEEP and os.path.exists(dst): return
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    Image.fromarray(cv2.cvtColor(img_bgra, cv2.COLOR_BGRA2RGBA)).save(dst, "WEBP", quality=84, method=4)

def number_spot(img):
    """Same placement as compose.add_number: centre and height of the number, in crop units (0-1)."""
    t, b, l, r = jersey_box(img); jh = b - t
    nh = int(jh * 0.37); cx = (l + r) // 2; cy = t + int(jh * 0.63)
    hsv = cv2.cvtColor(img[:, :, :3], cv2.COLOR_BGR2HSV); bw = (r - l) // 6
    band = hsv[t:t + int(jh * 0.5), cx - bw:cx + bw]
    rows = np.where(((band[:, :, 1] < 70) & (band[:, :, 2] > 150)).sum(1) > 2)[0]
    if len(rows): cy = max(cy, t + rows[-1] + int(jh * 0.04) + nh // 2)
    x0, y0, x1, y1 = CROP
    return [round((cx - x0) / (x1 - x0), 4), round((cy - y0) / (y1 - y0), 4), round(nh / (y1 - y0), 4)]

def digits(ab, dst):
    S = sprites(ab); dh = 260; cells, ims, x = [], [], 0
    for d in "0123456789":
        g = S[d]; w = max(1, int(g.shape[1] * dh / g.shape[0]))
        ims.append(cv2.resize(g, (w, dh), interpolation=cv2.INTER_AREA)); cells.append([x, w]); x += w + 4
    strip = np.zeros((dh, x, 4), np.uint8)
    for (cx, w), g in zip(cells, ims): strip[:, cx:cx + w] = g
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if not (KEEP and os.path.exists(dst)): Image.fromarray(strip, "RGBA").save(dst, "WEBP", quality=90, method=6)   # sprites() rows are RGBA
    return {"h": dh, "cells": cells}

def render_skin(img):
    """Dark or Light: the forearms' skin angle (ITA, from L* and b*), as the headshots are measured."""
    a = img[700:1180, 120:966]; rgb = a[:, :, 2::-1][a[:, :, 3] > 200].reshape(-1, 1, 3)
    lab = cv2.cvtColor(np.ascontiguousarray(rgb), cv2.COLOR_RGB2LAB).reshape(-1, 3).astype(float)
    L, A, B = lab[:, 0] * 100 / 255, lab[:, 1] - 128, lab[:, 2] - 128
    sk = (A > 5) & (B > 8) & (L > 10) & (L < 92)
    ita = np.degrees(np.arctan2(np.median(L[sk]) - 50, np.median(B[sk])))
    return "Light" if ita > -8 else "Dark"

def norm(n):   # the game's name key (src/playerArt.js)
    n = re.sub(r"[.'’]", "", n.lower()); n = re.sub(r"\b(jr|sr|ii|iii|iv|v)\b", "", n)
    return re.sub(r"[^a-z]+", " ", n).strip()

def main():
    man = {"teams": {}, "nygNumbered": [], "nygSkin": {}, "custom": {}, "nygOriginal": [], "dark": []}
    for d in sorted(glob.glob(os.path.join(ART, "players", "*"))):
        ab = os.path.basename(d)
        if not (len(ab) <= 3 and all(os.path.exists(path(ab, k)) for k in KINDS)): continue
        spots = {}
        for k in KINDS:
            img = clean_alpha(cv2.imread(path(ab, k), cv2.IMREAD_UNCHANGED))
            spots[k] = number_spot(img)
            x0, y0, x1, y1 = CROP
            webp(img[y0:y1, x0:x1], os.path.join(OUT, ab, f"{k}.webp"))
        man["teams"][ab] = {"spots": spots, "digits": digits(ab, os.path.join(OUT, "nums", f"{ab}.webp"))}
        print(ab, "ok")
    for f in sorted(glob.glob(os.path.join(ART, "players", "NYG_numbered", "NYG_*.png"))):
        n = os.path.basename(f)[4:-4]
        img = clean_alpha(cv2.imread(f, cv2.IMREAD_UNCHANGED))
        webp(img, os.path.join(OUT, "NYG", "n", f"{n}.webp")); man["nygNumbered"].append(int(n))
        man["nygSkin"][int(n)] = render_skin(img)
    roster = json.load(open(os.path.join(ROOT, "src", "data", "madden27.json")))
    nyg = [p["name"] for t in roster["teams"] if t["ab"] == "NYG" for p in t["roster"]]
    # custom renders, any team: players/{TEAM}_custom/{TEAM}_{Last}_{NN}.png, in that team's uniform.
    # The PNGs aren't kept in git (they're big; the zips they came in are the masters): each one
    # present is exported once, and the manifest is built from the exported files, so a checkout
    # without the PNGs keeps every custom render.
    for f in sorted(glob.glob(os.path.join(ART, "players", "*_custom", "*.png"))):
        ab, rest = os.path.basename(f)[:-4].split("_", 1)
        img = clean_alpha(cv2.imread(f, cv2.IMREAD_UNCHANGED))[:1448]
        if img.shape[:2] != (1448, 1086): img = cv2.resize(img, (1086, 1448), interpolation=cv2.INTER_AREA)   # a render a pixel off the standard size
        webp(img, os.path.join(OUT, ab, "c", f"{rest}.webp"))
    for f in sorted(glob.glob(os.path.join(OUT, "*", "c", "*.webp"))):
        ab = os.path.basename(os.path.dirname(os.path.dirname(f))); last, n = os.path.basename(f)[:-5].rsplit("_", 1)
        # the player: that last name (a suffix in the file name, JohnsonJr or CookIII, dropped) and,
        # when two share it (Josh and Kyle Allen), that number; on that team's roster (practice squad
        # too), else anywhere, free agents included (he may arrive by trade or sign there)
        # (letters only, so St. Brown, Smith-Njigba and O'Neill match StBrown, Smith-Njigba, ONeill)
        key = re.sub(r"[^a-z]", "", re.sub(r"(Jr|Sr|II|III|IV|V)$", "", last).lower())
        team = [q for t in roster["teams"] if t["ab"] == ab for q in t["roster"] + t.get("ps", [])]
        anyone = [q for t in roster["teams"] for q in t["roster"] + t.get("ps", [])] + roster.get("fa", [])
        def pick(pool):
            ends = lambda nm: {"".join(re.sub(r"[^a-z ]", "", nm).split()[i:]) for i in range(1, len(nm.split()))}
            same = [q for q in pool if key in ends(norm(q["name"]))]
            return [q for q in same if q.get("num") == int(n)] or same
        # elsewhere, the one wearing that number first (Cam Heyward, a free agent, over Shaka Heyward)
        full = pick(team) or [q for q in pick(anyone) if q.get("num") == int(n)] or pick(anyone)
        if not full: sys.exit(f"no player for {ab}/c/{os.path.basename(f)}")
        man["custom"].setdefault(norm(full[0]["name"]), {})[ab] = [f"{last}_{n}", int(n)]
        print(f"  {ab} {last}_{n} -> {full[0]['name']}")
    man["nygOriginal"] = nyg
    skin = [a for a in sys.argv[1:] if not a.startswith("--")]
    if skin: man["dark"] = sorted(json.load(open(skin[0])))
    else:   # no new list: keep the one already in the manifest (it was measured from headshots once)
        prev = os.path.join(OUT, "manifest.json")
        man["dark"] = json.load(open(prev)).get("dark", []) if os.path.exists(prev) else []
    json.dump(man, open(os.path.join(OUT, "manifest.json"), "w"), separators=(",", ":"))
    print(len(man["teams"]), "teams,", len(man["nygNumbered"]), "numbered Giants,", len(man["custom"]), "custom")

if __name__ == "__main__":
    main()
