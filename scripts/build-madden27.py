"""Build src/data/madden27.json: real NFL rosters with EA SPORTS Madden NFL 27 ratings.

Inputs (downloaded into a work dir you pass as the first argument):
  m27.json              every player from https://www.ea.com/games/madden-nfl/ratings (all pages,
                        the __NEXT_DATA__ ratingDetails.items lists)
  roster2026.csv        nflverse roster_2026.csv (draft slots), from
                        https://github.com/nflverse/nflverse-data/releases/download/rosters/roster_2026.csv
  depth/<ABBR>.json     ESPN depth charts (optional), from scripts/fetch-espn-depth.py
Usage: python3 scripts/build-madden27.py /tmp/m27
"""
import csv, hashlib, json, os, random, re, sys, unicodedata
from collections import defaultdict

SEASON = 2026
CAP = 200  # the game's cap, in $M; real deals keep their share of the cap
ROSTER, PS = 53, 10
src = sys.argv[1]
eap = json.load(open(f"{src}/m27.json"))

TEAMS = {  # EA label -> game team
  "Buffalo Bills": ("Buffalo", "Bills", "BUF", "AFC", "East", "#00338d", "#c60c30"),
  "Miami Dolphins": ("Miami", "Dolphins", "MIA", "AFC", "East", "#008e97", "#fc4c02"),
  "New England Patriots": ("New England", "Patriots", "NE", "AFC", "East", "#002244", "#c60c30"),
  "NY Jets": ("New York", "Jets", "NYJ", "AFC", "East", "#125740", "#ffffff"),
  "Baltimore Ravens": ("Baltimore", "Ravens", "BAL", "AFC", "North", "#241773", "#9e7c0c"),
  "Cincinnati Bengals": ("Cincinnati", "Bengals", "CIN", "AFC", "North", "#fb4f14", "#000000"),
  "Cleveland Browns": ("Cleveland", "Browns", "CLE", "AFC", "North", "#311d00", "#ff3c00"),
  "Pittsburgh Steelers": ("Pittsburgh", "Steelers", "PIT", "AFC", "North", "#101820", "#ffb612"),
  "Houston Texans": ("Houston", "Texans", "HOU", "AFC", "South", "#03202f", "#a71930"),
  "Indianapolis Colts": ("Indianapolis", "Colts", "IND", "AFC", "South", "#002c5f", "#a2aaad"),
  "Jacksonville Jaguars": ("Jacksonville", "Jaguars", "JAX", "AFC", "South", "#006778", "#d7a22a"),
  "Tennessee Titans": ("Tennessee", "Titans", "TEN", "AFC", "South", "#0c2340", "#4b92db"),
  "Denver Broncos": ("Denver", "Broncos", "DEN", "AFC", "West", "#fb4f14", "#002244"),
  "Kansas City Chiefs": ("Kansas City", "Chiefs", "KC", "AFC", "West", "#e31837", "#ffb81c"),
  "Las Vegas Raiders": ("Las Vegas", "Raiders", "LV", "AFC", "West", "#000000", "#a5acaf"),
  "Los Angeles Chargers": ("Los Angeles", "Chargers", "LAC", "AFC", "West", "#0080c6", "#ffc20e"),
  "Dallas Cowboys": ("Dallas", "Cowboys", "DAL", "NFC", "East", "#041e42", "#869397"),
  "NY Giants": ("New York", "Giants", "NYG", "NFC", "East", "#0b2265", "#a71930"),
  "Philadelphia Eagles": ("Philadelphia", "Eagles", "PHI", "NFC", "East", "#004c54", "#a5acaf"),
  "Washington Commanders": ("Washington", "Commanders", "WAS", "NFC", "East", "#5a1414", "#ffb612"),
  "Chicago Bears": ("Chicago", "Bears", "CHI", "NFC", "North", "#0b162a", "#c83803"),
  "Detroit Lions": ("Detroit", "Lions", "DET", "NFC", "North", "#0076b6", "#b0b7bc"),
  "Green Bay Packers": ("Green Bay", "Packers", "GB", "NFC", "North", "#203731", "#ffb612"),
  "Minnesota Vikings": ("Minnesota", "Vikings", "MIN", "NFC", "North", "#4f2683", "#ffc62f"),
  "Atlanta Falcons": ("Atlanta", "Falcons", "ATL", "NFC", "South", "#a71930", "#000000"),
  "Carolina Panthers": ("Carolina", "Panthers", "CAR", "NFC", "South", "#0085ca", "#101820"),
  "New Orleans Saints": ("New Orleans", "Saints", "NO", "NFC", "South", "#101820", "#d3bc8d"),
  "Tampa Bay Buccaneers": ("Tampa Bay", "Buccaneers", "TB", "NFC", "South", "#d50a0a", "#34302b"),
  "Arizona Cardinals": ("Arizona", "Cardinals", "ARI", "NFC", "West", "#97233f", "#ffb612"),
  "Los Angeles Rams": ("Los Angeles", "Rams", "LAR", "NFC", "West", "#003594", "#ffa300"),
  "San Francisco 49ers": ("San Francisco", "49ers", "SF", "NFC", "West", "#aa0000", "#b3995d"),
  "Seattle Seahawks": ("Seattle", "Seahawks", "SEA", "NFC", "West", "#002244", "#69be28"),
}
POS = {"QB": "QB", "HB": "RB", "FB": "RB", "WR": "WR", "TE": "TE", "LT": "LT", "LG": "LG", "C": "C", "RG": "RG", "RT": "RT",
       "LEDG": "DL", "REDG": "DL", "DT": "DL", "SAM": "LB", "MIKE": "LB", "WILL": "LB", "CB": "CB", "FS": "S", "SS": "S", "K": "K"}
NEED = {"QB": 2, "RB": 3, "WR": 5, "TE": 3, "LT": 1, "LG": 1, "C": 1, "RG": 1, "RT": 1, "DL": 7, "LB": 5, "CB": 5, "S": 4, "K": 1}

def avg(*xs): return round(sum(xs) / len(xs))
OL = lambda s: {"passBlock": s["passBlock"], "footwork": s["passBlockFinesse"], "anchor": s["passBlockPower"], "awareness": s["awareness"],
  "handUse": s["runBlockFinesse"], "reach": s["impactBlocking"], "agility": s["agility"], "toughness": s["toughness"], "runBlock": s["runBlock"],
  "pulling": avg(s["runBlockFinesse"], s["agility"]), "strength": s["strength"], "drive": s["runBlockPower"], "snapping": s["awareness"],
  "leadership": s["awareness"], "athleticism": avg(s["speed"], s["agility"]), "power": s["runBlockPower"]}
ATTRS = {  # the game's position skills, from Madden's ratings
  "QB": lambda s: {"armStr": s["throwPower"], "accuracy": avg(s["throwAccuracyShort"], s["throwAccuracyMid"]), "pocketAwr": s["throwUnderPressure"],
    "decisions": s["awareness"], "mobility": avg(s["speed"], s["throwOnTheRun"]), "touch": s["throwAccuracyDeep"], "readDef": s["playRecognition"]},
  "RB": lambda s: {"vision": s["bCVision"], "elusiveness": s["jukeMove"], "breakTkl": s["breakTackle"], "passBlock": s["passBlock"], "receiving": s["catching"],
    "burst": s["acceleration"], "balance": avg(s["breakTackle"], s["carrying"]), "stiffArm": s["stiffArm"]},
  "WR": lambda s: {"routeRun": avg(s["shortRouteRunning"], s["mediumRouteRunning"], s["deepRouteRunning"]), "catching": s["catching"],
    "separation": avg(s["changeOfDirection"], s["mediumRouteRunning"]), "release": s["release"], "bodyCtrl": s["spectacularCatch"], "yac": s["bCVision"],
    "deepSpd": s["speed"], "catchTraffic": s["catchInTraffic"]},
  "TE": lambda s: {"blocking": s["runBlock"], "receiving": s["catching"], "routeRun": avg(s["shortRouteRunning"], s["mediumRouteRunning"]),
    "redZone": s["spectacularCatch"], "passBlock": s["passBlock"], "yac": s["breakTackle"], "seaming": s["deepRouteRunning"], "toughness": s["toughness"]},
  "DL": lambda s: {"passRush": avg(s["powerMoves"], s["finesseMoves"]), "runStop": s["blockShedding"], "handUse": s["finesseMoves"], "motor": s["stamina"],
    "getOff": s["acceleration"], "bullRush": s["powerMoves"], "swim": s["finesseMoves"], "spin": avg(s["finesseMoves"], s["agility"])},
  "LB": lambda s: {"tackling": s["tackle"], "coverage": avg(s["zoneCoverage"], s["manCoverage"]), "blitzing": avg(s["powerMoves"], s["finesseMoves"]),
    "runFit": s["playRecognition"], "instincts": s["awareness"], "pursuit": s["pursuit"], "shedBlock": s["blockShedding"], "zoneAwr": s["zoneCoverage"]},
  "CB": lambda s: {"manCov": s["manCoverage"], "zoneCov": s["zoneCoverage"], "press": s["press"], "ballSkills": s["catching"], "tackling": s["tackle"],
    "recovery": s["speed"], "footwork": s["agility"], "playRec": s["playRecognition"]},
  "S": lambda s: {"range": s["speed"], "runSupport": s["hitPower"], "coverage": s["zoneCoverage"], "tackling": s["tackle"], "ballHawk": s["catching"],
    "blitzing": s["finesseMoves"], "comms": s["awareness"], "versatility": s["manCoverage"]},
  "K": lambda s: {"legStr": s["kickPower"], "accuracy": s["kickAccuracy"], "clutch": s["awareness"], "distance": s["kickPower"], "hangTime": s["kickPower"],
    "consistency": s["kickAccuracy"], "coldWx": s["toughness"], "pressure": s["awareness"]},
}
for p in ("LT", "LG", "C", "RG", "RT"): ATTRS[p] = OL

# Salaries: the data has no contracts, so price each player like the market does: by position
# and rating, with players still on rookie deals cheap. Years left follow age and experience.
TOP = {"QB": 30, "DL": 17, "WR": 17, "LT": 15, "RT": 13, "CB": 13, "LB": 10, "S": 9, "TE": 9, "LG": 9, "RG": 9, "C": 8, "RB": 7, "K": 3}
rng = random.Random(27)
def contract(pos, ovr, age, years_pro):
    value = 1.0 + TOP[pos] * 1.25 * max(0, (ovr - 60) / 39) ** 2.2
    if years_pro <= 3: return round(min(value, 0.8 + value * 0.22), 1), max(1, 4 - years_pro)
    return round(value, 1), (rng.randint(1, 2) if age >= 31 else rng.randint(1, 5) if ovr >= 80 else rng.randint(1, 3))

# ---------- Development traits ----------
# EA's data has no development field, so young players are tiered from what it does have: how
# good he already is for his age, his X-Factor / Superstar abilities and his draft pedigree,
# then checked against NFL consensus (the lists below raise anyone the numbers undersell).
TIERS = ["late", "normal", "star", "superstar", "generational"]
GENERATIONAL = {"Arvell Reese", "Abdul Carter", "Brock Bowers", "Jahmyr Gibbs", "Bijan Robinson", "Jaxon Smith-Njigba",
                "Puka Nacua", "Malik Nabers", "Travis Hunter", "Caleb Williams", "Will Anderson Jr", "Patrick Mahomes"}
SUPERSTAR = {"Jeremiyah Love", "Caleb Downs", "Drake Maye", "Jayden Daniels", "Christian Gonzalez", "Penei Sewell",
             "Kyle Hamilton", "Derek Stingley Jr", "Trent McDuffie", "Devon Witherspoon", "Jalen Carter", "Jared Verse",
             "Tetairoa McMillan", "Joe Alt", "Cooper DeJean", "Quinyon Mitchell", "Mason Graham", "De'Von Achane", "Ashton Jeanty",
             "Rueben Bain Jr", "David Bailey", "Sonny Styles", "Fernando Mendoza", "Brian Thomas Jr", "Nick Emmanwori",
             "Will Campbell", "Ja'Marr Chase", "Aidan Hutchinson"}
STAR = {"C.J. Stroud", "Marvin Harrison Jr", "Bo Nix", "Cam Ward", "Jaxson Dart", "Jalon Walker", "Mykel Williams", "Jihaad Campbell",
        "Emeka Egbuka", "Omarion Hampton", "Kelvin Banks Jr", "Carnell Tate", "Jordyn Tyson", "Mansoor Delane", "Jermod McCoy",
        "Keldric Faulk", "Kadyn Proctor", "Spencer Fano", "Francis Mauigoa", "Ty Simpson", "Olaivavega Ioane", "Kenyon Sadiq",
        "Peter Woods", "Garrett Wilson", "Jahdae Barron"}

def key(name):
    n = unicodedata.normalize("NFKD", name).encode("ascii", "ignore").decode().lower()
    n = re.sub(r"\b(jr|sr|ii|iii|iv|v)\b\.?", "", n)
    return re.sub(r"[^a-z]", "", n)
picks = {}
for r in csv.DictReader(open(f"{src}/roster2026.csv")):
    if (r.get("draft_number") or "").isdigit(): picks[(key(r["full_name"]), r["college"].split(";")[0].strip().lower())] = int(r["draft_number"])
pick_by_name = {}
for (k, _), n in picks.items(): pick_by_name.setdefault(k, n)

def at_least(t, floor): return t if TIERS.index(t) >= TIERS.index(floor) else floor

def dev_trait(p):
    name = f'{p["firstName"]} {p["lastName"]}'
    ab = [a["type"]["id"] for a in p.get("playerAbilities") or []]
    age, ovr, yp = p["age"], p["overallRating"], p["yearsPro"]
    pick = picks.get((key(name), (p["college"] or "").lower()), pick_by_name.get(key(name), 999))
    if age > 25:  # his growth years are mostly behind him
        t = "superstar" if "xFactor" in ab else "star" if ab else "normal"
    else:
        score = ovr + 2.2 * (25 - age) + (3 if "xFactor" in ab else 1.5 if ab else 0)
        if yp <= 2: score += 3 if pick <= 5 else 2 if pick <= 15 else 1 if pick <= 32 else 0
        t = "generational" if score >= 101 else "superstar" if score >= 94 else "star" if score >= 87 else "normal"
        if yp <= 1 and pick <= 5: t = at_least(t, "superstar")
        elif yp <= 2 and pick <= 32: t = at_least(t, "star")
        # A raw, overlooked youngster is sometimes a late bloomer (fixed per player).
        if t == "normal" and age <= 23 and ovr < 70 and pick > 100 and int(hashlib.md5(name.encode()).hexdigest(), 16) % 4 == 0: t = "late"
    if name in GENERATIONAL: t = "generational"
    elif name in SUPERSTAR: t = at_least(t, "superstar")
    elif name in STAR: t = at_least(t, "star")
    return t

# Ratings the game sets by hand (league consensus over EA's number).
OVERRIDES = {"C.J. Stroud": {"overallRating": 90}}

teams = defaultdict(list)
for p in eap:
    p.update(OVERRIDES.get(f'{p["firstName"]} {p["lastName"]}', {}))
    pos = POS.get(p["position"]["id"])
    if not pos or not p.get("team"): continue
    s = {k: v["value"] for k, v in p["stats"].items()}
    sal, yrs = contract(pos, p["overallRating"], p["age"], p["yearsPro"])
    dev = dev_trait(p)
    teams[p["team"]["label"]].append({
        "name": f'{p["firstName"]} {p["lastName"]}', "pos": pos, "mpos": p["position"]["id"], "ovr": p["overallRating"], "age": p["age"],
        "ht": p["height"], "wt": p["weight"], "college": p["college"] or "", "num": p["jerseyNum"], "yp": p["yearsPro"],
        "arch": (p.get("archetype") or {}).get("label", "").split(" - ")[0], "dev": dev,
        "xf": next((a["label"] for a in p.get("playerAbilities") or [] if a["type"]["id"] == "xFactor"), None),
        "spd": s["speed"], "str": s["strength"], "agi": s["agility"], "acc": s["acceleration"], "jmp": s["jumping"], "end": s["stamina"],
        "attrs": ATTRS[pos](s), "sal": sal, "yrs": yrs,
    })

# ---------- Depth charts ----------
# ESPN's depth chart sets each club's pecking order: everyone on it makes the 53, starting
# offensive linemen play the spot ESPN lists them at, and each player gets a depth rank "dk"
# at his position (0 = starter). Within a depth level (ESPN's 3-4 OLBs, nickel backs and the
# like don't map one-to-one onto the game's spots) the better-rated player goes first.
ESPN_AB = {"WAS": "WSH"}
OLS = {"LT", "LG", "C", "RG", "RT"}
def espn_depth(ab, players):
    f = f"{src}/depth/{ESPN_AB.get(ab, ab)}.json"
    if not os.path.exists(f): return {}
    by = {}
    for p in players: by.setdefault(key(p["name"]), p)
    level = {}
    for chart in json.load(open(f))["depthchart"]:
        for slot, v in chart["positions"].items():
            if slot in ("pr", "kr", "h", "ls", "p"): continue
            for lvl, a in enumerate(v["athletes"]):
                p = by.get(key(a["displayName"]))
                if not p: continue
                lvl += 5 if slot == "fb" else 0  # a fullback backs up the running backs
                sp = v["position"]["abbreviation"]
                if lvl == 0 and sp in OLS and p["pos"] in OLS: p["pos"] = sp
                level[id(p)] = min(level.get(id(p), 99), lvl)
    return level

out, fa = [], []
depth_hits = 0
for label, meta in TEAMS.items():
    level = espn_depth(meta[2], teams[label])
    depth_hits += len(level)
    # Depth-chart players first, then by rating.
    ps = sorted(teams[label], key=lambda x: (id(x) not in level, -x["ovr"]))
    keep = []
    for pos, n in NEED.items(): keep += [x for x in ps if x["pos"] == pos][:n]
    keep += [x for x in ps if x not in keep][: ROSTER - len(keep)]
    for pos in NEED:
        ranked = sorted([x for x in keep if x["pos"] == pos and id(x) in level], key=lambda x: (level[id(x)], -x["ovr"]))
        for i, x in enumerate(ranked): x["dk"] = i
    rest = [x for x in ps if x not in keep]
    squad = sorted([x for x in rest if x["yp"] <= 3], key=lambda x: -x["ovr"])[:PS]
    # Keep every club playable: between $125M and $195M to start under the game's $200M cap.
    pay = sum(x["sal"] for x in keep)
    f = 195 / pay if pay > 195 else 125 / pay if pay < 125 else 1
    for x in keep + squad: x["sal"] = round(max(0.5, x["sal"] * f), 1)
    # Real players who miss the 53 and the practice squad start the game as free agents.
    for x in rest:
        if x not in squad: x["sal"], x["yrs"] = round(max(0.8, x["sal"] * 0.6), 1), 0; fa.append(x)
    city, name, ab, c, d, clr, ac = meta
    out.append({"city": city, "name": name, "ab": ab, "c": c, "d": d, "clr": clr, "ac": ac, "roster": keep, "ps": squad})
    print(f"{ab:4} {len(keep)} +{len(squad)} PS +{len([x for x in rest if x not in squad])} FA  payroll ${sum(x['sal'] for x in keep):.0f}M  top {keep[0]['name']} {keep[0]['ovr']}")
print(f"ESPN depth charts matched {depth_hits} players")
json.dump({"source": "EA SPORTS Madden NFL 27 ratings (Week 3); depth charts from ESPN", "season": SEASON, "teams": out, "fa": sorted(fa, key=lambda x: -x["ovr"])}, open("src/data/madden27.json", "w"), separators=(",", ":"))
from collections import Counter
print("development:", dict(Counter(x["dev"] for t in out for x in t["roster"] + t["ps"])))
xfs = [x for t in out for x in t["roster"] + t["ps"] if x["xf"]]
print(f"X-Factors: {len(xfs)}; all Superstar or better: {all(x['dev'] in ('superstar', 'generational') for x in xfs)}")
for tier in ("generational", "superstar"):
    print(f"{tier}:", ", ".join(f'{x["name"]} ({t["ab"]})' for t in out for x in t["roster"] + t["ps"] if x["dev"] == tier))
missing = [n for n in GENERATIONAL | SUPERSTAR | STAR if not any(x["name"] == n for t in out for x in t["roster"] + t["ps"])]
if missing: print("not on a roster:", missing)
pay = [sum(x["sal"] for x in t["roster"]) for t in out]
print(f"payroll min ${min(pay):.0f}M avg ${sum(pay)/len(pay):.0f}M max ${max(pay):.0f}M")
