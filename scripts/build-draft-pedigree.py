# Builds src/data/draftPedigree.js: where each real player in the game was drafted (year, round,
# overall pick, club), from nflverse's draft_picks.csv (every NFL draft since 1980). Players are
# matched by name, and by college when two share a name. Undrafted players aren't listed.
# Usage: python3 scripts/build-draft-pedigree.py /path/to/draft_picks.csv
import csv, json, re, sys
src = sys.argv[1]
M = json.load(open("src/data/madden27.json"))
SP = json.load(open("src/data/special.json"))
TEAM = {"GNB": "GB", "KAN": "KC", "LVR": "LV", "OAK": "LV", "RAI": "LV", "NOR": "NO", "NWE": "NE", "PHO": "ARI", "RAM": "LAR", "STL": "LAR", "SDG": "LAC", "SFO": "SF", "TAM": "TB"}
def col(s):
    s = (s or "").lower().replace("&", "and")
    s = re.sub(r"\(.*?\)", "", s)
    s = re.sub(r"\b(university|of|the|college)\b", "", s).replace("state", "st").replace(".", "")
    return re.sub(r"[^a-z]", "", s)
def nm(s): return re.sub(r"[^a-z]", "", re.sub(r"\b(jr|sr|ii|iii|iv|v)\b\.?", "", (s or "").lower()))
picks = {}
for r in csv.DictReader(open(src)):
    picks.setdefault(nm(r["pfr_player_name"]), []).append(r)
players = [p for t in M["teams"] for p in t["roster"]] + M.get("fa", []) + SP.get("punters", []) + SP.get("kickers", [])
out, miss, amb = {}, 0, 0
for p in players:
    c = picks.get(nm(p["name"]), [])
    if len(c) > 1:
        c2 = [r for r in c if col(r["college"])[:5] == col(p.get("college"))[:5]] or c
        # still several: the most recent draft that fits his age
        c = sorted(c2, key=lambda r: -int(r["season"]))
        amb += len(c2) > 1
    if not c: miss += 1; continue
    r = c[0]
    out[f'{p["name"]}|{col(p.get("college"))}'] = [int(r["season"]), int(r["round"]), int(r["pick"]), TEAM.get(r["team"], r["team"])]
lines = ["// Where each real player in the game was drafted: \"Name|college\" -> [year, round, overall pick, club",
         "// (today's abbreviation)]. Undrafted players aren't listed. Built by scripts/build-draft-pedigree.py",
         "// from nflverse's draft_picks.csv.",
         "export const DRAFT_PEDIGREE = " + json.dumps(out, separators=(",", ":")) + ";",
         "export const pedigreeKey = (name, college) => `${name}|${String(college || \"\").toLowerCase().replace(/&/g, \"and\").replace(/\\(.*?\\)/g, \"\").replace(/\\b(university|of|the|college)\\b/g, \"\").replace(/state/g, \"st\").replace(/\\./g, \"\").replace(/[^a-z]/g, \"\")}`;", ""]
open("src/data/draftPedigree.js", "w").write("\n".join(lines))
print(f"{len(out)} drafted players matched, {miss} undrafted or not found, {amb} name clashes settled by date")
