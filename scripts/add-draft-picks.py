"""Add each real player's overall draft pick (pk) to src/data/madden27.json, from nflverse's
roster_2026.csv (draft_number). Matching follows build-madden27.py: name + college, else name.
Usage: python3 scripts/add-draft-picks.py /path/to/roster2026.csv
"""
import csv, json, re, sys, unicodedata

def key(name):
    n = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode().lower()
    n = re.sub(r"\b(jr|sr|ii|iii|iv|v)\b\.?", "", n)
    return re.sub(r"[^a-z]", "", n)

picks, by_name = {}, {}
for r in csv.DictReader(open(sys.argv[1])):
    if (r.get("draft_number") or "").isdigit():
        n = int(r["draft_number"])
        picks[(key(r["full_name"]), r["college"].split(";")[0].strip().lower())] = n
        by_name.setdefault(key(r["full_name"]), n)

path = "src/data/madden27.json"
d = json.load(open(path))
found = total = 0
for p in [p for t in d["teams"] for p in t["roster"] + t.get("ps", [])] + d["fa"]:
    total += 1
    n = picks.get((key(p["name"]), (p.get("college") or "").lower()), by_name.get(key(p["name"])))
    p.pop("pk", None)
    if n:
        p["pk"] = n
        found += 1
json.dump(d, open(path, "w"), separators=(",", ":"))
print(f"draft picks for {found} of {total} players")
