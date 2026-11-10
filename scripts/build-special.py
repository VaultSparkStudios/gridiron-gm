"""Build src/data/special.json: special teams data from EA SPORTS Madden NFL 27 ratings.

  kr       every returner's real Kick Return rating, by "Name|POS" (the game's positions), for
           players rated 40+ (anyone else is rated from his speed, acceleration and agility)
  punters  the league's punters, by club (the main roster file has no punters)

Input: the same m27.json as scripts/build-madden27.py (every player from
https://www.ea.com/games/madden-nfl/ratings, all pages, the __NEXT_DATA__ ratingDetails.items).
Usage: python3 scripts/build-special.py /tmp/m27
"""
import hashlib, json, sys

src = sys.argv[1]
eap = json.load(open(f"{src}/m27.json"))
POS = {"QB": "QB", "HB": "RB", "FB": "RB", "WR": "WR", "TE": "TE", "LT": "LT", "LG": "LG", "C": "C", "RG": "RG", "RT": "RT",
       "LEDG": "DL", "REDG": "DL", "DT": "DL", "SAM": "LB", "MIKE": "LB", "WILL": "LB", "CB": "CB", "FS": "S", "SS": "S", "K": "K", "P": "P"}
AB = {"Buffalo Bills": "BUF", "Miami Dolphins": "MIA", "New England Patriots": "NE", "NY Jets": "NYJ", "Baltimore Ravens": "BAL",
      "Cincinnati Bengals": "CIN", "Cleveland Browns": "CLE", "Pittsburgh Steelers": "PIT", "Houston Texans": "HOU", "Indianapolis Colts": "IND",
      "Jacksonville Jaguars": "JAX", "Tennessee Titans": "TEN", "Denver Broncos": "DEN", "Kansas City Chiefs": "KC", "Las Vegas Raiders": "LV",
      "Los Angeles Chargers": "LAC", "Dallas Cowboys": "DAL", "NY Giants": "NYG", "Philadelphia Eagles": "PHI", "Washington Commanders": "WAS",
      "Chicago Bears": "CHI", "Detroit Lions": "DET", "Green Bay Packers": "GB", "Minnesota Vikings": "MIN", "Atlanta Falcons": "ATL",
      "Carolina Panthers": "CAR", "New Orleans Saints": "NO", "Tampa Bay Buccaneers": "TB", "Arizona Cardinals": "ARI", "Los Angeles Rams": "LAR",
      "San Francisco 49ers": "SF", "Seattle Seahawks": "SEA"}
avg = lambda *xs: round(sum(xs) / len(xs))

kr, punters = {}, []
for p in eap:
    pos = POS.get(p["position"]["id"])
    if not pos: continue
    s = {k: v["value"] for k, v in p["stats"].items()}
    name = f'{p["firstName"]} {p["lastName"]}'
    if s.get("kickReturn", 0) >= 40 and pos != "P": kr[f"{name}|{pos}"] = s["kickReturn"]
    if pos != "P": continue
    ovr, age, yp = p["overallRating"], p["age"], p["yearsPro"]
    h = int(hashlib.md5(name.encode()).hexdigest(), 16)
    # Priced like the roster file prices kickers (a small share of the cap; rookie deals cheap).
    value = 1.0 + 3 * 1.25 * max(0, (ovr - 60) / 39) ** 2.2
    sal, yrs = (round(min(value, 0.8 + value * 0.22), 1), max(1, 4 - yp)) if yp <= 3 else (round(value, 1), 1 + (h % 2 if age >= 31 else h % 3))
    punters.append({
        "team": AB.get((p.get("team") or {}).get("label")), "name": name, "pos": "P", "mpos": "P", "ovr": ovr, "age": age,
        "ht": p["height"], "wt": p["weight"], "college": p["college"] or "", "num": p["jerseyNum"], "yp": yp,
        "arch": (p.get("archetype") or {}).get("label", "").split(" - ")[0], "dev": "normal", "xf": None,
        "spd": s["speed"], "str": s["strength"], "agi": s["agility"], "acc": s["acceleration"], "jmp": s["jumping"], "end": s["stamina"],
        "attrs": {"power": s["kickPower"], "accuracy": s["kickAccuracy"], "hangTime": avg(s["kickPower"], s["kickAccuracy"]), "coffin": s["kickAccuracy"],
                  "consistency": avg(s["kickAccuracy"], s["awareness"]), "coldWx": s["toughness"], "pressure": s["awareness"], "clutch": s["awareness"]},
        "sal": sal, "yrs": yrs,
    })
punters.sort(key=lambda x: -x["ovr"])
json.dump({"source": "EA SPORTS Madden NFL 27 ratings (Week 4)", "kr": kr, "punters": punters}, open("src/data/special.json", "w"), separators=(",", ":"))
print(f"{len(kr)} returners rated 40+, {len(punters)} punters")
