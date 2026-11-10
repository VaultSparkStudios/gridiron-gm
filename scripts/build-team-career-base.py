# What today's real players did for each club before the league starts: regular-season totals with
# every club they played for, 2004-2025, from nflverse weekly player stats (a mid-season trade splits
# his numbers between the two clubs). Only players in the game's data are kept; when two players
# share a name (a father and son, Asante Samuel and Asante Samuel Jr.), only the ones still playing
# (2024 or later) count. Writes
# src/data/teamCareerBase.js.
#   python3 scripts/build-team-career-base.py [cache_dir]
import csv, json, os, re, sys, urllib.request

CACHE = sys.argv[1] if len(sys.argv) > 1 else "/tmp/team-career-base"
os.makedirs(CACHE, exist_ok=True)
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
YEARS = range(2004, 2026)
KEYS = ["passYds", "passTD", "rushYds", "rushTD", "rec", "recYds", "recTD", "sacks", "ints"]
COLS = ["passing_yards", "passing_tds", "rushing_yards", "rushing_tds", "receptions", "receiving_yards", "receiving_tds", "def_sacks", "def_interceptions"]
# nflverse club codes -> the game's (relocations count as one franchise)
TEAM = {"LA": "LAR", "STL": "LAR", "OAK": "LV", "SD": "LAC", "JAC": "JAX", "WSH": "WAS"}

def norm(name):
    n = re.sub(r"[.'’]", "", name.lower())
    n = re.sub(r"\b(jr|sr|ii|iii|iv|v)\b", "", n)
    return re.sub(r"[^a-z]+", " ", n).strip()

# every player name in the game's data
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

tot = {}   # (player id, name, club) -> totals
last = {}  # player id -> his last season
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
            ab = TEAM.get(r["team"], r["team"])
            pid = r.get("player_id") or n
            last[pid] = yr
            row = tot.setdefault((pid, n, ab), [0] * len(KEYS))
            for i, c in enumerate(COLS):
                v = r.get(c) or ""
                if v and v != "NA":
                    row[i] += float(v)
    os.remove(path)  # keep the disk light: each season's file is ~9MB
    print(yr, len(tot), flush=True)

# a name worn by more than one player: keep only those still playing
ids = {}
for pid, n, _ in tot:
    ids.setdefault(n, set()).add(pid)
merged = {}
for (pid, n, ab), row in tot.items():
    if len(ids[n]) > 1 and last[pid] < 2024:
        continue
    m = merged.setdefault(f"{n}|{ab}", [0] * len(KEYS))
    for i, v in enumerate(row):
        m[i] += v
out = {}
for k, row in merged.items():
    row = [round(v * 2) / 2 if i == 7 else int(round(v)) for i, v in enumerate(row)]
    if any(row):
        out[k] = row

with open(os.path.join(ROOT, "src/data/teamCareerBase.js"), "w") as f:
    f.write("// Real players' regular-season totals with each club before the league starts (2004-2025), so a\n")
    f.write("// career with one club keeps counting from where it really stood. Key: normalized name | club;\n")
    f.write(f"// values in order: {', '.join(KEYS)}. Source: nflverse weekly player stats. Built by\n")
    f.write("// scripts/build-team-career-base.py.\n")
    f.write(f"export const TEAM_CAREER_KEYS = {json.dumps(KEYS)};\n")
    f.write("export const TEAM_CAREER_BASE = " + json.dumps(out, separators=(",", ":")) + ";\n")
print(len(out), "player-club totals")
