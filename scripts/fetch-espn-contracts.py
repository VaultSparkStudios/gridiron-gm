"""Real contract lengths for every NFL roster, from ESPN's public team-roster API.

Usage: python3 scripts/fetch-espn-contracts.py [SEASON]   (default 2026)
Writes src/data/contracts<SEASON>.json:
  { season, updated, players: { "TEAM|Player Name": through } }
through: the last season the player is signed for (ESPN "signedThrough"). The game uses it to set
how many years each real player has left when a league starts. Stale entries (deals that ended
before SEASON) are left out.
Team abbreviations use the game's codes (ESPN WSH -> WAS).
"""
import json, sys, time, urllib.request
from datetime import datetime, timezone

SEASON = int(sys.argv[1]) if len(sys.argv) > 1 else 2026
BASE = "https://site.api.espn.com/apis/site/v2/sports/football/nfl"
AB = {"WSH": "WAS"}


def get(url, tries=4):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "gridiron-gm-data/1.0"})
            with urllib.request.urlopen(req, timeout=30) as r:
                d = json.load(r)
            time.sleep(0.3)
            return d
        except Exception as e:  # network hiccup: retry with backoff
            if i == tries - 1:
                raise
            time.sleep(2 * (i + 1))


def main():
    teams = get(f"{BASE}/teams")["sports"][0]["leagues"][0]["teams"]
    out = {}
    for t in teams:
        t = t["team"]
        ab = AB.get(t["abbreviation"], t["abbreviation"])
        roster = get(f"{BASE}/teams/{t['id']}/roster")
        for grp in roster.get("athletes", []):
            for a in grp.get("items", []):
                c = a.get("contract") or {}
                if not c.get("signedThrough") or c["signedThrough"] < SEASON:
                    continue
                out[f"{ab}|{a['fullName']}"] = c["signedThrough"]
        print(f"  {ab}: {sum(1 for k in out if k.startswith(ab + '|'))} contracts", end="\r")
    print()
    path = f"src/data/contracts{SEASON}.json"
    with open(path, "w") as f:
        json.dump({"season": SEASON, "updated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"), "players": out}, f, separators=(",", ":"))
    print(f"{path}: {len(out)} players")


if __name__ == "__main__":
    main()
