# Headshots for the game's real coaches, from each club's official coaching-staff page (head coach,
# coordinators and special teams; every club's site runs on the same NFL platform). A photo only counts
# if it sits inside that coach's own card on the page, so nobody gets a neighbor's face. Coaches no
# club lists (between jobs) fall back to ESPN, which has head coaches past and present. Writes
# src/data/coachHeadshots.js; anyone still without a photo keeps the drawn face.
#   python3 scripts/build-coach-headshots.py
import json, os, re, urllib.request
from html import unescape
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITES = {
    "ARI": "azcardinals.com", "ATL": "atlantafalcons.com", "BAL": "baltimoreravens.com", "BUF": "buffalobills.com",
    "CAR": "panthers.com", "CHI": "chicagobears.com", "CIN": "bengals.com", "CLE": "clevelandbrowns.com",
    "DAL": "dallascowboys.com", "DEN": "denverbroncos.com", "DET": "detroitlions.com", "GB": "packers.com",
    "HOU": "houstontexans.com", "IND": "colts.com", "JAX": "jaguars.com", "KC": "chiefs.com",
    "LV": "raiders.com", "LAC": "chargers.com", "LAR": "therams.com", "MIA": "miamidolphins.com",
    "MIN": "vikings.com", "NE": "patriots.com", "NO": "neworleanssaints.com", "NYG": "giants.com",
    "NYJ": "newyorkjets.com", "PHI": "philadelphiaeagles.com", "PIT": "steelers.com", "SF": "49ers.com",
    "SEA": "seahawks.com", "TB": "buccaneers.com", "TEN": "tennesseetitans.com", "WAS": "commanders.com",
}
ESPN = "https://sports.core.api.espn.com/v2/sports/football/leagues/nfl"
CARD = re.compile(r'class="d3-o-media-object[ "]')  # a card itself, not its __title / __body parts
IMG = re.compile(r"static\.clubs\.nfl\.com/image/(upload|private)/(?:[^/\s\"']+/)*?f_[a-z]+/(?:v\d+/)?([a-z0-9]+/[A-Za-z0-9_-]+\.(?:jpg|jpeg|png))")
TITLE = re.compile(r'__title">\s*([^<]+?)\s*<')  # the name heading inside the card

def get(url, js=False):
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    with urllib.request.urlopen(req, timeout=40) as r:
        b = r.read()
    return json.loads(b) if js else b.decode("utf-8", "replace")

def norm(name):
    n = re.sub(r"[.'’]", "", name.lower())
    n = re.sub(r"\b(jr|sr|ii|iii|iv|v)\b", "", n)
    return re.sub(r"[^a-z]+", " ", n).strip()

src = open(os.path.join(ROOT, "src/data/realCoaches.js")).read()
staff_src = src.split("export const REAL_STAFF", 1)[1].split("};", 1)[0]
staff = {ab: re.findall(r'"([^"]+)"', names) for ab, names in re.findall(r"(\w+): \[([^\]]*)\]", staff_src)}
everyone = {n for names in staff.values() for n in names}

def page(ab):
    for path in ("/team/coaches-roster/", "/team/coaches/"):
        try:
            return ab, get(f"https://www.{SITES[ab]}{path}")
        except Exception:
            pass
    return ab, ""

# every card on a page: the name in it and the photo in it (none if the card has no photo)
def cards(html):
    out = {}
    starts = [c.start() for c in CARD.finditer(html)] + [len(html)]
    for a, b in zip(starts, starts[1:]):
        chunk = html[a:b]
        t, im = TITLE.search(chunk), IMG.findall(chunk)
        if t and im:
            out.setdefault(norm(unescape(t.group(1))), "/".join(im[-1]))
    return out

out = {}
with ThreadPoolExecutor(8) as ex:
    pages = dict(ex.map(page, SITES))
found = {ab: cards(h) for ab, h in pages.items() if h}
for ab, names in staff.items():
    for n in names:
        # his own club first, then any club (a coach who moved since the staffs were written)
        p = found.get(ab, {}).get(norm(n)) or next((f[norm(n)] for f in found.values() if norm(n) in f), None)
        if p:
            out[n] = p
print(f"club sites: {len(out)} of {len(everyone)}")

# ESPN for anyone the clubs don't show (head coaches only)
missing = {norm(n): n for n in everyone if n not in out}
if missing:
    ids = set()
    for yr in range(2010, 2027):
        for tid in range(1, 35):
            try:
                ids |= {i["$ref"].split("?")[0].rsplit("/", 1)[1] for i in get(f"{ESPN}/seasons/{yr}/teams/{tid}/coaches", True)["items"]}
            except Exception:
                pass
    def coach(cid):
        try:
            return get(f"{ESPN}/coaches/{cid}", True)
        except Exception:
            return None
    with ThreadPoolExecutor(8) as ex:
        for c in ex.map(coach, sorted(ids)):
            href = (c or {}).get("headshot", {}).get("href", "")
            n = norm(f'{(c or {}).get("firstName", "")} {(c or {}).get("lastName", "")}')
            if href and n in missing:
                out[missing[n]] = "espn:" + href.split("/coaches/", 1)[1]
print(f"with ESPN: {len(out)} of {len(everyone)}; still drawn: {sorted(everyone - set(out))}")

with open(os.path.join(ROOT, "src/data/coachHeadshots.js"), "w") as f:
    f.write("// Real coaches' headshots, by name: a club-site image (\"upload/\" or \"private/\" and its path on\n")
    f.write("// static.clubs.nfl.com), or \"espn:\" and a\n")
    f.write("// path under ESPN's coach headshots. Built by scripts/build-coach-headshots.py.\n")
    f.write("export const COACH_HEADSHOTS = " + json.dumps(dict(sorted(out.items())), indent=0) + ";\n")
