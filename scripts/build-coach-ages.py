# Birth years for the game's real coaches, from ESPN (it lists head coaches past and present, and the
# coordinators who were once head coaches). Writes src/data/coachAges.js; coaches it doesn't list get
# an estimated age by role in the game.
#   python3 scripts/build-coach-ages.py
import json, os, re, urllib.request
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ESPN = "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl"

def get(url):
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"}), timeout=40) as r:
        return json.load(r)

def norm(name):
    n = re.sub(r"[.'’]", "", name.lower())
    n = re.sub(r"\b(jr|sr|ii|iii|iv|v)\b", "", n)
    return re.sub(r"[^a-z]+", " ", n).strip()

src = open(os.path.join(ROOT, "src/data/realCoaches.js")).read()
staff_src = src.split("export const REAL_STAFF", 1)[1].split("};", 1)[0]
want = {norm(n): n for n in re.findall(r'"([^"]+)"', staff_src)}

def team_season(arg):
    yr, tid = arg
    try:
        return {i["$ref"].split("?")[0].rsplit("/", 1)[1] for i in get(f"{ESPN}/seasons/{yr}/teams/{tid}/coaches")["items"]}
    except Exception:
        return set()
ids = set()
with ThreadPoolExecutor(12) as ex:
    for s in ex.map(team_season, [(y, t) for y in range(2005, 2027) for t in range(1, 35)]):
        ids |= s

def coach(cid):
    try:
        return get(f"{ESPN}/coaches/{cid}")
    except Exception:
        return None
out = {}
with ThreadPoolExecutor(12) as ex:
    for c in ex.map(coach, sorted(ids)):
        dob = (c or {}).get("dateOfBirth", "")
        n = norm(f'{(c or {}).get("firstName", "")} {(c or {}).get("lastName", "")}')
        if dob[:4].isdigit() and n in want:
            out[want[n]] = int(dob[:4])
print(f"{len(out)} of {len(want)} coaches with a birth year")
with open(os.path.join(ROOT, "src/data/coachAges.js"), "w") as f:
    f.write("// Real coaches' birth years, from ESPN. Built by scripts/build-coach-ages.py.\n")
    f.write("export const COACH_BORN = " + json.dumps(dict(sorted(out.items())), indent=0) + ";\n")
