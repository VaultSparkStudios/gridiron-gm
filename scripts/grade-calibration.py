# Reads scripts/grade-calibration.mjs output; prints the CAL numbers for src/grades.js and checks on them.
import json,sys,statistics as st,collections
d=json.load(open(sys.argv[1]))
def corr(x,y):
    if len(x)<5: return 0
    mx,my=st.mean(x),st.mean(y); sx=sum((a-mx)**2 for a in x)**.5; sy=sum((b-my)**2 for b in y)**.5
    return sum((a-mx)*(b-my) for a,b in zip(x,y))/(sx*sy) if sx and sy else 0
MIN={"qb":250,"rc":40,"ru":100,"pr":250,"cv":25,"rd":200}
FAC=[("qb",["QB"]),("rc",["WR","TE","RB"]),("ru",["RB"]),("pr",["DL","LB"]),("cv",["CB","S","LB"]),("rd",["DL","LB","S"])]
cal={}
for f,poss in FAC:
    for pos in poss:
        rows=[r for r in d if r.get("pos")==pos and r["s"].get(f+"N",0)>=MIN[f]]
        if len(rows)<12: continue
        a=[r["s"][f+"G"]/r["s"][f+"N"] for r in rows]; n=[r["s"][f+"N"] for r in rows]
        m,sd=st.mean(a),st.pstdev(a)
        # year to year: same player, consecutive seasons
        by=collections.defaultdict(dict)
        for r in rows: by[r["id"]][r["yr"]]=r["s"][f+"G"]/r["s"][f+"N"]
        x=[];y=[]
        for pid,v in by.items():
            for yr in v:
                if yr+1 in v: x.append(v[yr]); y.append(v[yr+1])
        cal.setdefault(pos,{})[f]=[round(m,4),round(sd,4),round(st.median(n))]
        print(f"{f} {pos:3} n={len(rows):3} medN={st.median(n):5.0f} mean={m:+.4f} sd={sd:.4f} ovr r={corr(a,[r['ovr'] for r in rows]):+.2f} yr-to-yr r={corr(x,y):+.2f}")
print(json.dumps(cal))
# pressures per season
rows=[r for r in d if r.get("pos")=="DL" and r["s"].get("prN",0)>=250]
top=sorted(rows,key=lambda r:-r["s"].get("pres",0))[:6]
print("top pressure seasons:",[(r["name"],r["ovr"],r["s"].get("pres"),r["s"].get("sacks")) for r in top])
t=collections.Counter()
for r in d: t[(r['team'],r['yr'])]+=r['s'].get('pres',0)
print("team pressures/season", round(st.mean(t.values())))
# raw-stat stability for contrast
for pos,stat,den in [("WR","recYds","tgt"),("QB","passYds","att"),("RB","rushYds","rushAtt")]:
    by=collections.defaultdict(dict)
    for r in d:
        if r.get("pos")==pos and r["s"].get(den,0)>=(40 if pos=="WR" else 250 if pos=="QB" else 100): by[r["id"]][r["yr"]]=r["s"].get(stat,0)/r["s"][den]
    x=[];y=[]
    for v in by.values():
        for yr in v:
            if yr+1 in v: x.append(v[yr]); y.append(v[yr+1])
    print(f"raw {stat}/{den} {pos} yr-to-yr r={corr(x,y):+.2f}")
