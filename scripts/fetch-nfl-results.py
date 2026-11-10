"""Download real NFL regular-season results and player season stats from ESPN's public API.

Usage: python3 scripts/fetch-nfl-results.py [YEAR]   (default 2026; re-run any time to refresh)
Writes src/data/live<YEAR>.json:
  season, updated (UTC ISO), throughWeek (last week whose games are ALL final),
  games: [{wk,h,a,hs,as,ot}] for FINAL games only (in-progress / scheduled games are left out),
  stats: {"TEAM|Player Name": {gp, ...season totals in the game's p.ss keys}},
  injuries: [{team, name, pos, status, type, ret, note}] from ESPN's league-wide injury report
    (everyone not listed Active: Questionable, Doubtful, Out, Injured Reserve, Suspension...;
    ret: ESPN's expected return date YYYY-MM-DD when it has one).
Team abbreviations use the game's codes (ESPN WSH -> WAS). A player's totals are summed across
every team he played for this season and filed under the team he played for most recently.
"""
import json, sys, time, urllib.request, urllib.error
from datetime import datetime, timezone

YEAR = int(sys.argv[1]) if len(sys.argv) > 1 else 2026
AB = {"WSH": "WAS"}  # ESPN -> game abbreviation
BASE = "https://site.api.espn.com/apis/site/v2/sports/football/nfl"
SLEEP = 0.35


def get(url, tries=4):
    for i in range(tries):
        try:
            req = urllib.request.Request(url, headers={"User-Agent": "gridiron-gm-data/1.0"})
            with urllib.request.urlopen(req, timeout=30) as r:
                data = json.load(r)
            time.sleep(SLEEP)
            return data
        except (urllib.error.URLError, TimeoutError, ConnectionError, json.JSONDecodeError) as e:
            if i == tries - 1:
                raise
            wait = 2 * (i + 1)
            print(f"  retry {i + 1} in {wait}s: {e}", file=sys.stderr)
            time.sleep(wait)


def ab(x):
    return AB.get(x, x)


def num(s):
    try:
        return float(s)
    except (TypeError, ValueError):
        return 0.0


def pair(s):  # "19/25" or "1-11"
    for sep in ("/", "-"):
        if isinstance(s, str) and sep in s[1:]:
            a, b = s.split(sep, 1) if s[0] != "-" else (s, "0")
            return num(a), num(b)
    return 0.0, 0.0


def qb_rate(c, a, y, t, i):  # NFL passer rating, same formula as qbRate() in src/league.js
    if not a:
        return 0
    cl = lambda v: max(0.0, min(2.375, v))
    r = (cl((c / a - 0.3) * 5) + cl((y / a - 3) * 0.25) + cl(t / a * 20) + cl(2.375 - i / a * 25)) / 6 * 100
    return round(r, 1)


# ESPN boxscore category -> {ESPN key: game key}. Special-cased keys are handled in add_line().
MAP = {
    "passing": {"passingYards": "passYds", "passingTouchdowns": "passTD", "interceptions": "passInt"},
    "rushing": {"rushingAttempts": "rushAtt", "rushingYards": "rushYds", "rushingTouchdowns": "rushTD"},
    "receiving": {"receptions": "rec", "receivingYards": "recYds", "receivingTouchdowns": "recTD", "receivingTargets": "tgt"},
    "fumbles": {"fumbles": "fum"},
    "defensive": {"sacks": "sacks", "tacklesForLoss": "tfl", "passesDefended": "pd", "QBHits": "qbH"},
    "interceptions": {"interceptions": "ints"},
    "kickReturns": {"kickReturns": "kr", "kickReturnYards": "krYds", "kickReturnTouchdowns": "krTD"},
    "puntReturns": {"puntReturns": "pr", "puntReturnYards": "prYds", "puntReturnTouchdowns": "prTD"},
    "punting": {"punts": "punts", "puntYards": "puntYds", "puntsInside20": "in20"},
}


def add_line(S, cat, keys, vals):
    row = dict(zip(keys, vals))
    for ek, gk in MAP.get(cat, {}).items():
        if ek in row:
            S[gk] = S.get(gk, 0) + num(row[ek])
    if cat == "passing":
        c, a = pair(row.get("completions/passingAttempts"))
        sk, sky = pair(row.get("sacks-sackYardsLost"))
        S["comp"] = S.get("comp", 0) + c; S["att"] = S.get("att", 0) + a
        S["sk"] = S.get("sk", 0) + sk; S["skYds"] = S.get("skYds", 0) + sky
    elif cat == "defensive":  # the sim credits one tackle per play (tkl) plus assists (ast)
        tot, solo = num(row.get("totalTackles")), num(row.get("soloTackles"))
        S["tkl"] = S.get("tkl", 0) + solo; S["ast"] = S.get("ast", 0) + max(0, tot - solo)
    elif cat == "kicking":
        fm, fa = pair(row.get("fieldGoalsMade/fieldGoalAttempts"))
        xm, xa = pair(row.get("extraPointsMade/extraPointAttempts"))
        S["fgM"] = S.get("fgM", 0) + fm; S["fgA"] = S.get("fgA", 0) + fa
        S["xpM"] = S.get("xpM", 0) + xm; S["xpA"] = S.get("xpA", 0) + xa
        S["pts"] = S.get("pts", 0) + fm * 3 + xm
        if fm:
            S["lng"] = max(S.get("lng", 0), num(row.get("longFieldGoalMade")))
    if cat in ("kickReturns", "puntReturns"):  # the sim credits return TDs with 6 pts
        S["pts"] = S.get("pts", 0) + 6 * num(row.get("kickReturnTouchdowns" if cat == "kickReturns" else "puntReturnTouchdowns"))


INJ_URL = f"{BASE}/injuries"


def injuries():
    """Every team's current injury report (players listed Active are left out)."""
    out = []
    for t in get(INJ_URL).get("injuries", []):
        for x in t.get("injuries", []):
            st = x.get("status") or ""
            if not st or st == "Active":
                continue
            a = x.get("athlete") or {}
            d = x.get("details") or {}
            out.append({
                "team": ab((a.get("team") or {}).get("abbreviation", "")),
                "name": a.get("displayName", ""),
                "pos": (a.get("position") or {}).get("abbreviation", ""),
                "status": st,
                "type": d.get("type") or "",
                "ret": (d.get("returnDate") or "")[:10] or None,
                "note": (x.get("shortComment") or "")[:200],
            })
    return out


def main():
    games, final_ids, through = [], [], 0
    for wk in range(1, 19):
        d = get(f"{BASE}/scoreboard?seasontype=2&week={wk}&dates={YEAR}")
        evs = d.get("events", [])
        done = 0
        for e in evs:
            c = e["competitions"][0]
            st = c["status"]["type"]
            if not (st.get("completed") and st.get("state") == "post"):
                continue
            done += 1
            side = {t["homeAway"]: t for t in c["competitors"]}
            h, a = side["home"], side["away"]
            ot = len(h.get("linescores") or []) > 4 or "OT" in (st.get("detail") or "")
            games.append({"wk": wk, "h": ab(h["team"]["abbreviation"]), "a": ab(a["team"]["abbreviation"]),
                          "hs": int(num(h.get("score"))), "as": int(num(a.get("score"))), "ot": bool(ot)})
            final_ids.append((wk, e["id"], e["date"]))
        print(f"week {wk}: {done}/{len(evs)} final")
        if evs and done == len(evs) and through == wk - 1:
            through = wk
        if done == 0:
            break  # nothing final this week, so nothing later is either

    players = {}  # ESPN athlete id -> {name, team, last, ss}
    for i, (wk, gid, date) in enumerate(sorted(final_ids, key=lambda x: x[2])):
        s = get(f"{BASE}/summary?event={gid}")
        for tm in s.get("boxscore", {}).get("players", []):
            team = ab(tm["team"]["abbreviation"])
            seen = set()
            for cat in tm.get("statistics", []):
                for ath in cat.get("athletes", []):
                    aid = ath["athlete"].get("id") or ath["athlete"].get("displayName")
                    P = players.setdefault(aid, {"name": ath["athlete"].get("displayName", ""), "team": team, "last": "", "ss": {}})
                    if date >= P["last"]:
                        P["team"], P["last"] = team, date
                    if aid not in seen:
                        seen.add(aid); P["ss"]["gp"] = P["ss"].get("gp", 0) + 1
                    add_line(P["ss"], cat["name"], cat.get("keys", []), ath.get("stats", []))
        print(f"  box {i + 1}/{len(final_ids)} wk{wk} {gid}", end="\r")
    print()

    stats = {}
    for P in players.values():
        S = {k: (int(v) if float(v).is_integer() else round(v, 1)) for k, v in P["ss"].items() if v}
        if S.get("att"):
            S["rate"] = qb_rate(S.get("comp", 0), S["att"], S.get("passYds", 0), S.get("passTD", 0), S.get("passInt", 0))
        key = f'{P["team"]}|{P["name"]}'
        if key in stats:  # two ESPN ids with one name on one team: keep both by merging
            for k, v in S.items():
                stats[key][k] = max(stats[key].get(k, 0), v) if k in ("lng", "rate") else stats[key].get(k, 0) + v
        else:
            stats[key] = S

    out = {"season": YEAR, "updated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
           "throughWeek": through, "games": games, "stats": stats}
    try:
        out["injuries"] = injuries()
    except Exception as e:  # the results still matter without the injury report
        print(f"  injury report skipped: {e}", file=sys.stderr)
    path = f"src/data/live{YEAR}.json"
    with open(path, "w") as f:
        json.dump(out, f, separators=(",", ":"))
    print(f"{path}: through week {through}, {len(games)} final games, {len(stats)} players, {len(out.get('injuries', []))} injury report entries")


if __name__ == "__main__":
    main()
