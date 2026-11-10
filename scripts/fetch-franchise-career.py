# Every club's all-time career leaders (with that club, regular season, through 2025) from StatMuse:
# the top 10 in each stat the game tracks. Writes src/data/franchiseCareer.js.
#   python3 scripts/fetch-franchise-career.py [cache_dir]
# Pages are cached in cache_dir (default /tmp/franchise-career) so a rerun only fetches what's missing.
import html, json, os, re, sys, time, urllib.request

CACHE = sys.argv[1] if len(sys.argv) > 1 else "/tmp/franchise-career"
os.makedirs(CACHE, exist_ok=True)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TEAMS = [(t["ab"], t["name"]) for t in json.load(open(os.path.join(ROOT, "src/data/madden27.json")))["teams"]]

# game stat key -> (StatMuse phrase, column header)
STATS = {
    "passYds": ("passing-yards", "YDS"), "passTD": ("passing-touchdowns", "TD"),
    "rushYds": ("rushing-yards", "YDS"), "rushTD": ("rushing-touchdowns", "TD"),
    "rec": ("receptions", "REC"), "recYds": ("receiving-yards", "YDS"), "recTD": ("receiving-touchdowns", "TD"),
    "sacks": ("sacks", "SACK"), "ints": ("interceptions", "INT"),
}

def page(slug):
    path = os.path.join(CACHE, slug + ".html")
    if not os.path.exists(path):
        req = urllib.request.Request(f"https://www.statmuse.com/nfl/ask/{slug}", headers={"User-Agent": "Mozilla/5.0"})
        for attempt in range(4):
            try:
                body = urllib.request.urlopen(req, timeout=40).read().decode("utf-8")
                break
            except Exception as e:  # network hiccup: back off and retry
                time.sleep(2 ** (attempt + 1))
        else:
            raise SystemExit(f"could not fetch {slug}")
        open(path, "w", encoding="utf-8").write(body)
        time.sleep(1.2)
    return open(path, encoding="utf-8").read()

def text(c):
    return html.unescape(re.sub(r"<[^>]+>", "", c)).strip()

def answer(s):
    # the answer sentence names the leader and his total ("... with 11,938 yards.")
    m = re.search(r'<meta name="description" content="([^"]*)"', s)
    d = html.unescape(m.group(1)) if m else ""
    num = re.search(r"with ([\d,]+(?:\.\d+)?)", d)
    return float(num.group(1).replace(",", "")) if num else None

def leaders(s, col):
    t = s[s.find("<table"):s.find("</table>", s.find("<table"))]
    rows = re.findall(r"<tr[^>]*>(.*?)</tr>", t, re.S)
    if len(rows) < 2:
        return []
    head = [text(c) for c in re.findall(r"<t[dh][^>]*>(.*?)</t[dh]>", rows[0], re.S)]
    first = [text(c).replace(",", "") for c in re.findall(r"<td[^>]*>(.*?)</td>", rows[1], re.S)]
    # the stat's column: the one where the leader's number matches the answer sentence
    want = answer(s)
    num = lambda x: float(x) if re.fullmatch(r"\d+(\.\d+)?", x) else None
    ci = next((i for i in range(3, len(first)) if want is not None and num(first[i]) == want), None)
    if ci is None:
        ci = next(i for i, h in enumerate(head) if h == col or h.endswith(" " + col))
    out = []
    for r in rows[1:]:
        cells = re.findall(r"<td[^>]*>(.*?)</td>", r, re.S)
        if len(cells) <= ci:
            continue
        m = re.search(r'title="([^"]+)"', cells[2])
        name = html.unescape(m.group(1)) if m else text(cells[2])
        v = text(cells[ci]).replace(",", "")
        if not num(v):
            continue
        out.append({"n": name, "v": float(v) if "." in v else int(v)})
        if len(out) == 10:
            break
    return out

def check(s, top):
    want = answer(s)
    return want is None or not top or abs(want - top[0]["v"]) < 0.01

data, bad = {}, []
for ab, name in TEAMS:
    nick = name.lower().replace(" ", "-")
    data[ab] = {}
    for key, (phrase, col) in STATS.items():
        s = page(f"{nick}-all-time-{phrase}-leaders-through-2025")
        top = leaders(s, col)
        if not check(s, top):
            bad.append((ab, key))
        data[ab][key] = top
    print(ab, data[ab]["passYds"][0] if data[ab]["passYds"] else None, flush=True)

with open(os.path.join(ROOT, "src/data/franchiseCareer.js"), "w") as f:
    f.write("// Every club's all-time career leaders with that club (regular season, through the 2025 season),\n")
    f.write("// top 10 per stat: { n: name, v: total }. Source: StatMuse (October 2026); franchise history counts\n")
    f.write("// as one club (the Oilers are the Titans, the St. Louis Rams are the Rams). Built by\n")
    f.write("// scripts/fetch-franchise-career.py.\n")
    f.write("export const FRANCHISE_CAREER = {\n")
    for ab in data:
        f.write(f"  {ab}: {json.dumps(data[ab], separators=(',', ':'))},\n")
    f.write("};\n")
print("mismatches:", bad)
