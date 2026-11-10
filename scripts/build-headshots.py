# ESPN headshot ids for the game's real players: every name in the game's data matched (normalized
# name, then position group and latest club to break ties) against nflverse's player table, which
# carries each player's ESPN id. Writes src/data/headshots.js. The card loads the photo from ESPN's
# image server; generated players (and anyone without a match) keep the drawn face.
#   python3 scripts/build-headshots.py [players.csv]
import csv, json, os, re, sys, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = sys.argv[1] if len(sys.argv) > 1 else "/tmp/headshots-players.csv"
if not os.path.exists(SRC):
    urllib.request.urlretrieve("https://github.com/nflverse/nflverse-data/releases/download/players/players.csv", SRC)
TEAM = {"LA": "LAR", "STL": "LAR", "OAK": "LV", "SD": "LAC", "JAC": "JAX", "WSH": "WAS"}
GROUP = {"QB": "QB", "RB": "RB", "WR": "WR", "TE": "TE", "LT": "OL", "LG": "OL", "C": "OL", "RG": "OL", "RT": "OL", "DL": "DL", "LB": "LB", "CB": "DB", "S": "DB", "K": "SPEC", "P": "SPEC"}

def norm(name):
    n = re.sub(r"[.'’]", "", name.lower())
    n = re.sub(r"\b(jr|sr|ii|iii|iv|v)\b", "", n)
    return re.sub(r"[^a-z]+", " ", n).strip()

m27 = json.load(open(os.path.join(ROOT, "src/data/madden27.json")))
want = {}
def walk(x, ab=None):
    if isinstance(x, dict):
        ab = x.get("ab", ab)
        if isinstance(x.get("name"), str) and "pos" in x:
            want.setdefault(norm(x["name"]), set()).add((GROUP.get(x["pos"]), ab))
        for v in x.values():
            walk(v, ab)
    elif isinstance(x, list):
        for v in x:
            walk(v, ab)
walk(m27)

cands = {}
with open(SRC, newline="") as f:
    for r in csv.DictReader(f):
        if not r.get("espn_id") or r["espn_id"] == "NA":
            continue
        last = r.get("last_name") or ""
        names = {norm(r.get("display_name") or "")} | {norm(f"{r.get(k) or ''} {last}") for k in ("first_name", "football_name", "common_first_name")}
        for n in names:
            if n in want:
                cands.setdefault(n, []).append(r)

out, ambiguous = {}, 0
for n, rs0 in cands.items():
  for grp, ab in want[n]:
    rs = list(rs0)
    def score(r, grp=grp, ab=ab):
        s = 0
        if r.get("position_group") == grp or (grp == "DB" and r.get("position_group") in ("DB", "CB", "S")): s += 4
        if TEAM.get(r.get("latest_team"), r.get("latest_team")) == ab: s += 3
        s += int(r.get("last_season") or 0) / 10000
        return s
    rs.sort(key=score, reverse=True)
    if len(rs) > 1: ambiguous += 1
    out[f"{n}|{grp}"] = int(float(rs[0]["espn_id"]))

with open(os.path.join(ROOT, "src/data/headshots.js"), "w") as f:
    f.write("// ESPN headshot ids for the game's real players from nflverse's player table.\n")
    f.write("// Key: normalized name | position group (QB RB WR TE OL DL LB DB SPEC). Built by scripts/build-headshots.py.\n")
    f.write("export const ESPN_IDS = " + json.dumps(out, separators=(",", ":")) + ";\n")
got = {k.split("|")[0] for k in out}
print(f"{len(got)} of {len(want)} names matched ({100*len(got)/len(want):.1f}%), {ambiguous} had more than one candidate")
missing = sorted(set(want) - got)
print("unmatched sample:", missing[:25])
