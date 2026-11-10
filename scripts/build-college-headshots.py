# ESPN headshots for the game's real draft prospects (src/data/realProspects.json): each name looked
# up in ESPN's player search, matched to the college football player at his school (or the only one
# by that name), and kept only if ESPN has a photo. ESPN uses one athlete id for college and the NFL,
# so a prospect already in the league gets his NFL photo and everyone else his college one.
# Anyone not matched for certain keeps the drawn face (never a guess at the wrong man).
# Writes src/data/collegeHeadshots.js.
#   python3 scripts/build-college-headshots.py
import json, os, re, time, urllib.parse, urllib.request

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UA = {"User-Agent": "Mozilla/5.0"}

def get(url, head=False):
    req = urllib.request.Request(url, headers=UA, method="HEAD" if head else "GET")
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status if head else json.load(r)
    except Exception:
        return None

def norm(s):
    s = re.sub(r"[.'’]", "", str(s).lower())
    s = re.sub(r"\b(jr|sr|ii|iii|iv|v)\b", "", s)
    return re.sub(r"[^a-z]+", " ", s).strip()

# school names as the data writes them vs ESPN's
ALIAS = {"miami": "miami hurricanes", "usc": "usc trojans", "lsu": "lsu tigers", "ole miss": "ole miss rebels", "byu": "byu cougars", "smu": "smu mustangs", "tcu": "tcu horned frogs", "ucf": "ucf knights", "ucla": "ucla bruins", "pitt": "pittsburgh panthers", "nc state": "nc state wolfpack"}

def school_match(college, subtitle):
    c, s = norm(college), norm(subtitle)
    if not c or not s: return False
    if c in ALIAS: return s.startswith(ALIAS[c])
    return s.startswith(c + " ") or s == c

def photo(aid):
    for league in ("nfl", "college-football"):
        url = f"https://a.espncdn.com/i/headshots/{league}/players/full/{aid}.png"
        if get(url, head=True) == 200: return league
    return None

data = json.load(open(os.path.join(ROOT, "src/data/realProspects.json")))
out, miss = {}, []
for yr, lst in data.items():
    for p in lst:
        q = urllib.parse.quote(p["name"])
        d = get(f"https://site.web.api.espn.com/apis/search/v2?query={q}&limit=20&type=player") or {}
        cands = [c for g in d.get("results", []) if g.get("type") == "player" for c in g.get("contents", [])
                 if c.get("defaultLeagueSlug") in ("college-football", "nfl") and norm(c.get("displayName")) == norm(p["name"])]
        at = [c for c in cands if c.get("defaultLeagueSlug") == "college-football" and school_match(p.get("college"), c.get("subtitle"))]
        cfb = [c for c in cands if c.get("defaultLeagueSlug") == "college-football"]
        pick = at[0] if len(at) == 1 else cfb[0] if not at and len(cfb) == 1 else None
        # already drafted: one NFL player by that name (ESPN shows the pro team now)
        if not pick and not at and not cfb:
            nfl = [c for c in cands if c.get("defaultLeagueSlug") == "nfl"]
            pick = nfl[0] if len(nfl) == 1 else None
        aid = int(pick["uid"].split("a:")[-1]) if pick else None
        lg = photo(aid) if aid else None
        if lg: out[f"{norm(p['name'])}|{yr}"] = [aid, "c" if lg == "college-football" else "n"]
        else: miss.append(f"{yr} {p['name']} ({p.get('college')})")
        time.sleep(0.15)

with open(os.path.join(ROOT, "src/data/collegeHeadshots.js"), "w") as f:
    f.write("// ESPN headshots for the real draft prospects: \"name|draft year\" -> [ESPN athlete id, \"n\" NFL photo / \"c\" college photo].\n")
    f.write("// Built by scripts/build-college-headshots.py.\n")
    f.write("export const PROSPECT_PHOTOS = " + json.dumps(out, separators=(",", ":")) + ";\n")
print(f"{len(out)} matched, {len(miss)} without a sure photo")
for m in miss: print("  -", m)
