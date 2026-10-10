"""Download every NFL team's current depth chart from ESPN's public site API.

Usage: python3 scripts/fetch-espn-depth.py /tmp/m27
Writes <dir>/depth/<ABBR>.json (one file per team), which build-madden27.py reads.
"""
import json, os, sys, urllib.request

out = os.path.join(sys.argv[1], "depth")
os.makedirs(out, exist_ok=True)
get = lambda u: json.load(urllib.request.urlopen(u, timeout=30))
teams = get("https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams")["sports"][0]["leagues"][0]["teams"]
for t in teams:
    t = t["team"]
    d = get(f"https://site.api.espn.com/apis/site/v2/sports/football/nfl/teams/{t['id']}/depthcharts")
    json.dump(d, open(os.path.join(out, f"{t['abbreviation']}.json"), "w"))
    print(t["abbreviation"], d.get("timestamp"))
