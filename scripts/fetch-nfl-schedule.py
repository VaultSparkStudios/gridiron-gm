"""Download the real NFL regular-season schedule from ESPN's public scoreboard API.

Usage: python3 scripts/fetch-nfl-schedule.py 2026
Writes src/data/schedule<YEAR>.json: one entry per game with the week, home and away team
(game abbreviations), kickoff time (UTC), stadium and whether it's a neutral/international
site. Results are left out on purpose: the league plays its own games.
"""
import json, sys, urllib.request

year = int(sys.argv[1])
AB = {"WSH": "WAS"}  # ESPN -> game abbreviation
games = []
for wk in range(1, 19):
    url = f"https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?seasontype=2&week={wk}&dates={year}"
    d = json.load(urllib.request.urlopen(url, timeout=30))
    for e in d["events"]:
        c = e["competitions"][0]
        side = {t["homeAway"]: AB.get(t["team"]["abbreviation"], t["team"]["abbreviation"]) for t in c["competitors"]}
        v = c.get("venue", {})
        games.append({"wk": wk, "h": side["home"], "a": side["away"], "date": e["date"], "venue": v.get("fullName", ""),
                      "city": v.get("address", {}).get("city", ""), "country": v.get("address", {}).get("country", ""), "neutral": bool(c.get("neutralSite"))})
    print(wk, len(d["events"]))
json.dump({"season": year, "source": "ESPN", "games": games}, open(f"src/data/schedule{year}.json", "w"), separators=(",", ":"))
print(len(games), "games")
