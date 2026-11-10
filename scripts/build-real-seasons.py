# Season-by-season regular-season stats for today's real players before the league starts
# (2016-2025, one line per club per season, so a mid-season trade shows as two lines), from nflverse
# weekly player stats. The player card shows them under "Before your league". Writes
# src/data/realSeasons.json (loaded only when a card opens).
#   python3 scripts/build-real-seasons.py [cache_dir]
import csv, json, os, re, sys, urllib.request

CACHE = sys.argv[1] if len(sys.argv) > 1 else "/tmp/real-seasons"
os.makedirs(CACHE, exist_ok=True)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
YEARS = range(2016, 2026)
# the card's season keys (PlayerCard.jsx SEASON_KEYS) <- nflverse weekly columns
COLS = {"comp": ["completions"], "att": ["attempts"], "passYds": ["passing_yards"], "passTD": ["passing_tds"],
        "passInt": ["passing_interceptions"], "rushAtt": ["carries"], "rushYds": ["rushing_yards"], "rushTD": ["rushing_tds"],
        "rec": ["receptions"], "recYds": ["receiving_yards"], "recTD": ["receiving_tds"],
        "tkl": ["def_tackles_solo", "def_tackle_assists"], "sacks": ["def_sacks"], "tfl": ["def_tackles_for_loss"],
        "ff": ["def_fumbles_forced"], "ints": ["def_interceptions"], "pd": ["def_pass_defended"],
        "fgM": ["fg_made"], "fgA": ["fg_att"], "xpM": ["pat_made"]}
TEAM = {"LA": "LAR", "STL": "LAR", "OAK": "LV", "SD": "LAC", "JAC": "JAX", "WSH": "WAS"}

def norm(name):
    n = re.sub(r"[.'’]", "", name.lower())
    n = re.sub(r"\b(jr|sr|ii|iii|iv|v)\b", "", n)
    return re.sub(r"[^a-z]+", " ", n).strip()

m27 = json.load(open(os.path.join(ROOT, "src/data/madden27.json")))
names = set()
def walk(x):
    if isinstance(x, dict):
        if isinstance(x.get("name"), str) and "pos" in x:
            names.add(norm(x["name"]))
        for v in x.values():
            walk(v)
    elif isinstance(x, list):
        for v in x:
            walk(v)
walk(m27)
print(len(names), "player names in the game data")

lines = {}  # (name, group) -> {(yr, team): {key: value, gp: n}}
for yr in YEARS:
    path = os.path.join(CACHE, f"w{yr}.csv")
    if not os.path.exists(path):
        urllib.request.urlretrieve(f"https://github.com/nflverse/nflverse-data/releases/download/stats_player/stats_player_week_{yr}.csv", path)
    with open(path, newline="") as f:
        for r in csv.DictReader(f):
            if r.get("season_type") != "REG":
                continue
            n = norm(r.get("player_display_name") or r.get("player_name") or "")
            if n not in names:
                continue
            g = r.get("position_group") or r.get("position") or "?"
            ab = TEAM.get(r["team"], r["team"])
            row = lines.setdefault((n, g), {}).setdefault((yr, ab), {"gp": 0})
            row["gp"] += 1
            for k, cols in COLS.items():
                for c in cols:
                    v = r.get(c) or ""
                    if v and v != "NA":
                        row[k] = row.get(k, 0) + float(v)
    os.remove(path)
    print(yr, len(lines), flush=True)

out = {}
for (n, g), seasons in lines.items():
    sl = []
    for (yr, ab), row in sorted(seasons.items()):
        o = {"y": yr, "tm": ab}
        for k, v in row.items():
            v = round(v * 2) / 2 if k == "sacks" else int(round(v))
            if v:
                o[k] = v
        sl.append(o)
    out.setdefault(n, []).append({"g": g, "s": sl})
with open(os.path.join(ROOT, "src/data/realSeasons.json"), "w") as f:
    json.dump(out, f, separators=(",", ":"))
print(len(out), "players,", os.path.getsize(os.path.join(ROOT, "src/data/realSeasons.json")) // 1024, "KB")
