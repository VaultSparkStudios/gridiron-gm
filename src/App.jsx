import { useState, useCallback, useMemo, useEffect, useRef } from "react";
const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
const Rf=(a,b)=>Math.random()*(b-a)+a;
const pick=a=>a[R(0,a.length-1)];
const cl=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
const uid=()=>Math.random().toString(36).slice(2,9);
const G=(m,s)=>{let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return m+s*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);};
const Gc=(m,s,lo,hi)=>cl(Math.round(G(m,s)),lo,hi);
const htS=i=>`${Math.floor(i/12)}'${i%12}"`;
const fm=v=>typeof v==="number"?(v===0?"0":Number.isInteger(v)?String(v):v.toFixed(1)):v;
// ═══════════ DATA ═══════════
const FN=["Marcus","Tyler","Jaylen","Caleb","Darius","Malik","Jalen","DeShawn","Travis","Bryce","Carter","Aiden","Xavier","Micah","Devonte","Kyler","Lamar","Russell","Patrick","Josh","Justin","Trey","Aaron","Jordan","Brandon","Cameron","Isaiah","Ezekiel","Derrick","Andre","Chris","Ryan","Michael","Daniel","David","James","Robert","William","Zach","Elijah","DeAndre","Khalil","Tyreek","Davante","Cooper","AJ","TJ","Myles","Nick","Chase","CeeDee","Drake","Bijan","Breece","Kenneth","Saquon","Austin","Garrett","Trent","Quenton","Penei","Rashawn","Dameon","Devin","Jameson","Roquan","Fred","Bobby","Jaire","Trevon","Marlon","Budda","Derwin","Minkah","Harrison","Jake","Evan","Matt","Joe","Baker","Geno","Sam","Bo","Brock","Jayden","Amari","Stefon","Puka","Tank","Rome","Brian","George","Aidan","Jared","Maxx","Danielle","Dexter","Quinnen","Christian","Vita","Grady","Javon","Rashan","Tremaine","Terrance","Raheem","Damien","Treylon","Quentin","Jarrett","Jaxon","Luther","Ashton","Jonah","Quinn","Colston","Shemar","Mykel","Donovan","Savion","Keenan","Shilo"];
const LN=["Williams","Johnson","Smith","Brown","Jones","Davis","Miller","Wilson","Moore","Taylor","Anderson","Thomas","Jackson","White","Harris","Martin","Thompson","Robinson","Clark","Lewis","Lee","Walker","Hall","Allen","Young","King","Wright","Hill","Scott","Green","Adams","Baker","Nelson","Carter","Mitchell","Roberts","Turner","Phillips","Campbell","Parker","Evans","Edwards","Collins","Stewart","Morris","Rogers","Reed","Cook","Morgan","Bell","Murphy","Bailey","Rivera","Cooper","Richardson","Howard","Ward","Peterson","Gray","Watson","Brooks","Kelly","Sanders","Price","Bennett","Wood","Barnes","Ross","Henderson","Coleman","Jenkins","Perry","Powell","Long","Patterson","Hughes","Flores","Washington","Butler","Simmons","Foster","Bryant","Alexander","Russell","Griffin","Hayes","Ford","Hamilton","Graham","Sullivan","Wallace","Cole","Jordan","Owens","Reynolds","Fisher","Ellis","Harrison","Gibson","Marshall","Murray","Freeman","Wells","Webb","Simpson","Stevens","Tucker","Porter","Hunter","Hicks","Crawford","Henry","Boyd","Mason","Kennedy","Warren","Dixon","Burns","Gordon","Shaw","Holmes","Rice","Hunt"];
const COL=["Alabama","Ohio State","Georgia","LSU","Clemson","Michigan","Notre Dame","Oklahoma","Texas","Oregon","Penn State","USC","Florida","Auburn","Florida State","Tennessee","Wisconsin","Iowa","Stanford","UCLA","Miami","Texas A&M","Ole Miss","Arkansas","NC State","Pittsburgh","Kentucky","Minnesota","Washington","Baylor","TCU","Utah","Colorado","Arizona State","Nebraska","Missouri","South Carolina","North Carolina","Maryland","Mississippi State","Kansas State","Oklahoma State","Syracuse","BYU","Houston","Cincinnati","UCF","SMU","Tulane","Boise State","San Diego State","Fresno State"];
const POS=["QB","RB","WR","TE","LT","LG","C","RG","RT","DL","LB","CB","S","K"];
const PP={QB:{h:74.5,hs:1.8,w:220,ws:12,hR:[71,78],wR:[200,245]},RB:{h:70,hs:1.5,w:210,ws:10,hR:[66,73],wR:[185,235]},WR:{h:73,hs:2,w:195,ws:12,hR:[68,77],wR:[170,225]},TE:{h:76,hs:1.5,w:250,ws:10,hR:[73,79],wR:[235,270]},LT:{h:77,hs:1.2,w:320,ws:10,hR:[75,79],wR:[308,345]},LG:{h:76.5,hs:1.2,w:316,ws:12,hR:[74,78],wR:[298,340]},C:{h:75.5,hs:1.2,w:304,ws:10,hR:[73,78],wR:[288,322]},RG:{h:76.5,hs:1.2,w:316,ws:12,hR:[74,78],wR:[298,340]},RT:{h:77,hs:1.2,w:320,ws:10,hR:[75,79],wR:[308,345]},DL:{h:76,hs:1.5,w:290,ws:18,hR:[73,79],wR:[255,340]},LB:{h:74,hs:1.3,w:240,ws:10,hR:[72,76],wR:[225,265]},CB:{h:71,hs:1.8,w:190,ws:8,hR:[68,75],wR:[175,210]},S:{h:72,hs:1.5,w:205,ws:8,hR:[70,75],wR:[190,220]},K:{h:72,hs:1.5,w:195,ws:10,hR:[69,75],wR:[180,215]}};
const CA={QB:{f:4.85,b:18,v:32,br:112,t:7.1,s:4.35},RB:{f:4.52,b:20,v:35,br:120,t:7.0,s:4.2},WR:{f:4.48,b:14,v:36,br:122,t:6.9,s:4.15},TE:{f:4.7,b:20,v:33,br:116,t:7.1,s:4.3},LT:{f:5.22,b:26,v:28,br:104,t:7.65,s:4.72},LG:{f:5.18,b:27,v:28,br:105,t:7.58,s:4.68},C:{f:5.12,b:26,v:29,br:106,t:7.55,s:4.65},RG:{f:5.18,b:27,v:28,br:105,t:7.58,s:4.68},RT:{f:5.22,b:26,v:28,br:104,t:7.65,s:4.72},DL:{f:4.9,b:25,v:31,br:112,t:7.3,s:4.5},LB:{f:4.65,b:22,v:34,br:118,t:7.0,s:4.25},CB:{f:4.45,b:14,v:37,br:124,t:6.85,s:4.1},S:{f:4.5,b:16,v:36,br:121,t:6.95,s:4.15},K:{f:4.9,b:15,v:30,br:108,t:7.2,s:4.4}};
const TEAMS=[
  {city:"New York",name:"Titans",ab:"NYT",c:"AFC",d:"East",clr:"#1a3a5c",ac:"#c4a235"},
  {city:"Los Angeles",name:"Sharks",ab:"LAS",c:"NFC",d:"West",clr:"#0d7377",ac:"#ff6b35"},
  {city:"Chicago",name:"Blaze",ab:"CHB",c:"NFC",d:"North",clr:"#c41e3a",ac:"#ffd700"},
  {city:"Houston",name:"Outlaws",ab:"HOU",c:"AFC",d:"South",clr:"#2d1b4e",ac:"#e74c3c"},
  {city:"Phoenix",name:"Scorpions",ab:"PHX",c:"NFC",d:"West",clr:"#d35400",ac:"#2c3e50"},
  {city:"Philadelphia",name:"Ironworks",ab:"PHI",c:"NFC",d:"East",clr:"#004953",ac:"#a8d8ea"},
  {city:"San Antonio",name:"Marshals",ab:"SAM",c:"AFC",d:"South",clr:"#1b2838",ac:"#c0392b"},
  {city:"San Diego",name:"Waves",ab:"SDW",c:"AFC",d:"West",clr:"#2980b9",ac:"#f39c12"},
  {city:"Dallas",name:"Mustangs",ab:"DAL",c:"NFC",d:"East",clr:"#003366",ac:"#c0c0c0"},
  {city:"Austin",name:"Armadillos",ab:"AUS",c:"NFC",d:"South",clr:"#bf5700",ac:"#333f48"},
  {city:"Jacksonville",name:"Gators",ab:"JAX",c:"AFC",d:"South",clr:"#006778",ac:"#d7a22a"},
  {city:"Columbus",name:"Sentinels",ab:"COL",c:"AFC",d:"North",clr:"#bb0000",ac:"#666"},
  {city:"Charlotte",name:"Hornets",ab:"CLT",c:"NFC",d:"South",clr:"#1d428a",ac:"#00788c"},
  {city:"Indianapolis",name:"Engines",ab:"IND",c:"AFC",d:"South",clr:"#002244",ac:"#a2aaad"},
  {city:"Seattle",name:"Storm",ab:"SEA",c:"NFC",d:"West",clr:"#002244",ac:"#69be28"},
  {city:"Denver",name:"Altitude",ab:"DEN",c:"AFC",d:"West",clr:"#002244",ac:"#fb4f14"},
  {city:"Nashville",name:"Bandicoots",ab:"NSH",c:"AFC",d:"South",clr:"#4b2d82",ac:"#ffc72c"},
  {city:"Oklahoma City",name:"Thunder",ab:"OKC",c:"NFC",d:"North",clr:"#007ac1",ac:"#ef6020"},
  {city:"Portland",name:"Timbers",ab:"POR",c:"NFC",d:"West",clr:"#004812",ac:"#ebab38"},
  {city:"Las Vegas",name:"Aces",ab:"LVA",c:"AFC",d:"West",clr:"#1a1a2e",ac:"#e94560"},
  {city:"Miami",name:"Hurricanes",ab:"MIA",c:"AFC",d:"East",clr:"#f37021",ac:"#005778"},
  {city:"Atlanta",name:"Phoenixes",ab:"ATL",c:"NFC",d:"South",clr:"#a71930",ac:"#13274f"},
  {city:"Baltimore",name:"Knights",ab:"BAL",c:"AFC",d:"North",clr:"#241773",ac:"#9e7c0c"},
  {city:"Detroit",name:"Motors",ab:"DET",c:"NFC",d:"North",clr:"#0076b6",ac:"#b0b7bc"},
  {city:"Minneapolis",name:"Frost",ab:"MIN",c:"NFC",d:"North",clr:"#4f2683",ac:"#ffc62f"},
  {city:"Green Bay",name:"Wolves",ab:"GBW",c:"NFC",d:"North",clr:"#203731",ac:"#ffb612"},
  {city:"Kansas City",name:"Royals",ab:"KCR",c:"AFC",d:"West",clr:"#e31837",ac:"#ffb81c"},
  {city:"Pittsburgh",name:"Steel",ab:"PIT",c:"AFC",d:"North",clr:"#101820",ac:"#ffb612"},
  {city:"Tampa Bay",name:"Captains",ab:"TBB",c:"NFC",d:"South",clr:"#d50a0a",ac:"#34302b"},
  {city:"New Orleans",name:"Mystics",ab:"NOS",c:"NFC",d:"South",clr:"#101820",ac:"#d3bc8d"},
  {city:"Cleveland",name:"Hounds",ab:"CLE",c:"AFC",d:"North",clr:"#311d00",ac:"#ff3c00"},
  {city:"Cincinnati",name:"Cats",ab:"CIN",c:"AFC",d:"North",clr:"#fb4f14",ac:"#000"},
];
const PA={QB:["armStr","accuracy","pocketAwr","decisions","mobility","throwPow","touch","readDef"],RB:["vision","elusiveness","breakTkl","passBlock","receiving","burst","balance","stiffArm"],WR:["routeRun","catching","separation","release","bodyCtrl","yac","deepSpd","catchTraffic"],TE:["blocking","receiving","routeRun","redZone","passBlock","yac","seaming","toughness"],LT:["passBlock","footwork","anchor","awareness","handUse","reach","agility","toughness"],LG:["runBlock","anchor","pulling","passBlock","footwork","strength","drive","toughness"],C:["awareness","snapping","passBlock","runBlock","footwork","leadership","anchor","athleticism"],RG:["runBlock","anchor","pulling","passBlock","footwork","strength","drive","toughness"],RT:["passBlock","anchor","footwork","runBlock","handUse","power","reach","toughness"],DL:["passRush","runStop","handUse","motor","getOff","bullRush","swim","spin"],LB:["tackling","coverage","blitzing","runFit","instincts","pursuit","shedBlock","zoneAwr"],CB:["manCov","zoneCov","press","ballSkills","tackling","recovery","footwork","playRec"],S:["range","runSupport","coverage","tackling","ballHawk","blitzing","comms","versatility"],K:["legStr","accuracy","clutch","distance","hangTime","consistency","coldWx","pressure"]};
const STRS={QB:["Elite pocket presence","Exceptional arm talent","Reads defenses pre-snap","Natural leader","Anticipation throws","Deep ball accuracy","Quick release","High football IQ","Extends plays","Poised under pressure","Pro-ready mechanics"],RB:["Explosive first step","Excellent vision","Breaks arm tackles","Elite lateral agility","Reliable pass catcher","Powerful short yardage","Patient runner","Home run speed"],WR:["Creates separation","Reliable hands","Elite speed","Contested catch ability","Precise route runner","Dangerous after catch","Deep threat","Body control on sideline"],TE:["Mismatch weapon","Reliable blocker","Red zone threat","Routes like a receiver","Soft hands in traffic","Versatile inline/flexed"],LT:["Blindside protector","Elite pass set","Handles speed rushers","Quick feet in space","Longest reach in class"],LG:["Devastating run blocker","Nasty finisher","Gets to second level","Pulls well","Pancakes defenders"],C:["Makes protection calls","Crisp snaps under pressure","NFL-ready football IQ","Handles nose tackles","Natural leader"],RG:["Physical interior blocker","Strong at the point","Handles bull rush","Reliable run blocker","Consistent performer"],RT:["Solid right tackle","Sets the edge","Handles power rushers","Nasty in the run game","Versatile starter"],DL:["Explosive first step","Violent hands","Collapses pocket","Relentless motor","Pass rush repertoire","Stout vs run"],LB:["Sideline-to-sideline range","Downhill thumper","Coverage ability","Blitz timing","Wrap-up tackler","QB of defense"],CB:["Lockdown man coverage","Elite ball skills","Mirror ability","Recovery speed","Press technique"],S:["Rangey centerfielder","Hard-hitting enforcer","Box/deep versatility","Ball-hawk instincts","Closing speed"],K:["Ice water veins","50+ yard leg","Consistent mechanics","Clutch performer"]};
const WKNS={QB:["Holds ball too long","Inconsistent footwork","Limited mobility","Telegraphs throws"],RB:["Struggles pass protection","Fumble-prone","Limited route tree","Below-average speed"],WR:["Drops on contested catches","Limited blocking","Gets jammed at line","Body catcher"],TE:["Liability in pass protection","Limited speed","Drops in traffic"],LT:["Struggles vs speed edge rushers","Anchor breaks on bull rush","Beaten around the arc"],LG:["Limited in pass pro","Slow to recover on stunts","Penalty-prone"],C:["Smaller frame","Displaced by big nose tackles","Limited pulling range"],RG:["Limited in pass pro","Slow to recover on stunts","Penalty-prone"],RT:["Inconsistent anchor","Struggles with length rushers","Technical faults in pass set"],DL:["Washed out by double teams","Inconsistent motor","Limited pass rush moves"],LB:["Liability in coverage","Bad angles","Slow to shed blocks"],CB:["Grabby when beaten","Bites on double moves","Inconsistent tackling"],S:["Poor man coverage","Bad angles","Overaggressive"],K:["Struggles beyond 50","Inconsistent in wind"]};
const FACTS=["Grew up on a ranch, didn't play football until sophomore year.","State champion wrestler.","Has an identical twin brother.","First in, last out of the weight room.","Speaks three languages fluently.","Walk-on who earned a scholarship.","Set his high school's scoring record.","Ran a 4.33 forty at Pro Day.","Father played 10 seasons in the league.","Volunteers at youth camps.","Recruited as basketball player.","Turned down baseball draft.","Bench pressed 225 for 30 reps.","Overcame torn ACL in college.","High school valedictorian.","Clocked at 22.4 mph in-game.","Played both ways in high school.","Captain three consecutive years.","From a town under 2,000 people.","Studies 30+ hours of film per week.","Once scored 6 TDs in a single game."];
const RES_MAX={QB:18,WR:12,LT:12,RB:10,TE:9,LG:8,C:7,RG:8,RT:8,DL:10,LB:9,CB:10,S:8,K:5};
const LKR_EVENTS=[
  {txt:'Veteran leader speech — locker room energized',mrl:5,confP:5,confN:0,chance:1},
  {txt:'Film session exposes scheme flaws — doubt spreads',mrl:-4,confP:0,confN:-5,chance:1},
  {txt:'Breakout performer lifts the group mentality',mrl:3,confP:8,confN:0,chance:1},
  {txt:"Media criticism unsettles key players",mrl:-3,confP:0,confN:-4,chance:1},
  {txt:"Coach's pregame speech fires up the roster",mrl:4,confP:6,confN:0,chance:1},
  {txt:'Contract dispute creates locker room tension',mrl:-5,confP:0,confN:-6,chance:1},
  {txt:'Community event — team bonds off the field',mrl:4,confP:4,confN:0,chance:1},
  {txt:'Rival trash talk refocuses the squad',mrl:3,confP:3,confN:0,chance:1},
];

// Draft pick value chart — modern analytics (less steep than JJ; better R2/R3/late values)
const PICK_VAL=[0,
4000,3919,3839,3758,3677,3597,3516,3435,3355,3274,3194,3113,3032,2952,2871,2790,2710,2629,2548,2468,2387,2306,2226,2145,2065,1984,1903,1823,1742,1661,1581,1500,
1400,1377,1355,1332,1310,1287,1265,1242,1219,1197,1174,1152,1129,1106,1084,1061,1039,1016,993,971,948,926,903,880,858,835,813,790,767,745,722,700,
650,642,634,626,618,610,602,594,585,577,569,561,553,545,537,529,521,512,504,496,488,480,472,464,456,448,439,431,423,415,407,400,
380,375,370,365,360,355,350,345,340,336,331,326,321,316,311,306,301,296,292,287,282,277,272,267,262,257,252,247,243,238,233,230,
220,217,215,212,210,207,205,202,200,197,195,192,189,187,184,182,179,177,174,172,169,167,164,162,159,156,154,151,149,146,144,141,
130,129,127,126,125,124,122,121,120,118,117,116,115,113,112,111,109,108,107,105,104,103,102,100,99,98,96,95,94,92,91,90,
85,84,83,82,81,81,80,79,78,77,76,76,75,74,73,72,71,71,70,69,68,67,66,66,65,64,63,62,61,61,60,60];

// ═══════════ SVG FACE ═══════════
function genFace(){return{sk:pick(["#8d5524","#c68642","#e0ac69","#f1c27d","#ffdbac","#5c3317","#a0522d","#deb887","#3b2219","#d2a679"]),hr:pick(["#1a1a1a","#3b2f2f","#654321","#8b4513","#2c1608","#000","#4a3728","#2f1b14","#1c1008","#5c4033"]),hs:R(0,5),ew:R(3,5),eh:R(2,4),nw:R(4,7),mw:R(6,10),jw:R(18,24),bh:R(1,3),er:R(2,4),fh:R(28,34)};}
const Face=({s:se,sz=40})=>{if(!se)return null;return(<svg width={sz} height={sz} viewBox="0 0 50 50"><ellipse cx="25" cy="27" rx={se.jw/2+2} ry={se.fh/2} fill={se.sk} stroke="#0005" strokeWidth=".3"/><ellipse cx={25-se.jw/2-se.er/2} cy="27" rx={se.er} ry="4" fill={se.sk}/><ellipse cx={25+se.jw/2+se.er/2} cy="27" rx={se.er} ry="4" fill={se.sk}/>{se.hs<3?<ellipse cx="25" cy={16+se.hs} rx={se.jw/2+3} ry={10+se.hs} fill={se.hr}/>:se.hs<5?<rect x={25-se.jw/2-1} y="10" width={se.jw+2} height={12} rx="4" fill={se.hr}/>:<path d={`M${25-se.jw/2-2} 22 Q25 6 ${25+se.jw/2+2} 22`} fill={se.hr}/>}<ellipse cx="19" cy="26" rx={se.ew/2} ry={se.eh/2} fill="white" stroke="#333" strokeWidth=".3"/><circle cx="19" cy="26" r={se.eh/2-.5} fill="#3a2a1a"/><circle cx="19" cy="25.5" r=".6" fill="white"/><ellipse cx="31" cy="26" rx={se.ew/2} ry={se.eh/2} fill="white" stroke="#333" strokeWidth=".3"/><circle cx="31" cy="26" r={se.eh/2-.5} fill="#3a2a1a"/><circle cx="31" cy="25.5" r=".6" fill="white"/><line x1="16" y1={24-se.bh} x2="22" y2={23.5-se.bh} stroke={se.hr} strokeWidth="1" strokeLinecap="round"/><line x1="28" y1={23.5-se.bh} x2="34" y2={24-se.bh} stroke={se.hr} strokeWidth="1" strokeLinecap="round"/><ellipse cx="25" cy="30" rx={se.nw/3} ry="2" fill={se.sk} stroke="#0003" strokeWidth=".3"/><ellipse cx="25" cy="35" rx={se.mw/3} ry="1.5" fill="#c0392b" opacity=".7"/></svg>);};

// ═══════════ CORE FUNCTIONS ═══════════
function qbRate(c,a,y,t,i){if(!a)return 0;const aa=cl(((c/a)-.3)*5,0,2.375),b=cl(((y/a)-3)*.25,0,2.375),cc=cl((t/a)*20,0,2.375),d=cl(2.375-((i/a)*25),0,2.375);return Math.round(((aa+b+cc+d)/6)*100*10)/10;}
function calcAV(p){const s=p.ss||{};if(!s.gp)return 0;let v=0;if(p.pos==="QB")v=(s.passYds||0)/350+(s.passTD||0)*1.5-(s.passInt||0)+(s.rushYds||0)/150;else if(p.pos==="RB")v=(s.rushYds||0)/200+(s.rushTD||0)*2+(s.recYds||0)/200;else if(p.pos==="WR")v=(s.recYds||0)/200+(s.recTD||0)*2+(s.rec||0)*.2;else if(p.pos==="TE")v=(s.recYds||0)/200+(s.recTD||0)*2;else if(p.pos==="DL")v=(s.sacks||0)*2+(s.tkl||0)*.1+(s.tfl||0)*.5;else if(p.pos==="LB")v=(s.tkl||0)*.15+(s.sacks||0)*1.5+(s.ints||0)*2;else if(p.pos==="CB")v=(s.ints||0)*3+(s.pd||0)*.8;else if(p.pos==="S")v=(s.ints||0)*2.5+(s.tkl||0)*.12;else if(p.pos==="K")v=(s.fgM||0)+(s.xpM||0)*.2;else v=p.ovr*.05*(s.gp||0);return Math.round(cl(v,0,25));}
function genCombine(pos,ovr){const a=CA[pos];if(!a)return null;const oM=(ovr-60)/100;return{fortyYd:Math.round((a.f-oM*.3+Rf(-.15,.15))*100)/100,bench:Math.max(0,Math.round(a.b+oM*8+R(-4,4))),vert:Math.max(15,Math.round(a.v+oM*6+R(-3,3))),broad:Math.max(80,Math.round(a.br+oM*10+R(-5,5))),threeCone:Math.round((a.t-oM*.25+Rf(-.15,.15))*100)/100,shuttle:Math.round((a.s-oM*.15+Rf(-.1,.1))*100)/100};}
function genProDay(pos,ovr){const c=genCombine(pos,ovr);if(!c)return null;return{fortyYd:Math.round((c.fortyYd+Rf(-.05,.05))*100)/100,bench:Math.max(0,c.bench+R(-2,3)),vert:Math.max(15,c.vert+R(-2,2)),broad:Math.max(80,c.broad+R(-3,4)),threeCone:Math.round((c.threeCone+Rf(-.08,.08))*100)/100,shuttle:Math.round((c.shuttle+Rf(-.05,.05))*100)/100};}
function combToPhys(c){if(!c)return{spd:60,str:60,agi:60,end:60,acc:60,jmp:60};return{spd:cl(Math.round(80-(c.fortyYd-4.4)*30),30,99),str:cl(Math.round(40+c.bench*2.2),30,99),agi:cl(Math.round(80-(c.threeCone-6.8)*25),30,99),jmp:cl(Math.round(20+c.vert*1.8),30,99),acc:cl(Math.round(80-(c.shuttle-4.1)*30),30,99),end:cl(Gc(70,8,40,99),40,99)};}
function genPAttrs(pos,ovr){const at={};(PA[pos]||[]).forEach(a=>{at[a]=cl(Gc(ovr,8,30,99),30,99);});return at;}
function emptySS(pos){const b={gp:0,gs:0};if(pos==="QB")return{...b,comp:0,att:0,passYds:0,passTD:0,passInt:0,sk:0,skYds:0,rushAtt:0,rushYds:0,rushTD:0,fum:0,rate:0};if(pos==="RB")return{...b,rushAtt:0,rushYds:0,rushTD:0,rec:0,tgt:0,recYds:0,recTD:0,fum:0};if(pos==="WR")return{...b,tgt:0,rec:0,recYds:0,recTD:0,rushAtt:0,rushYds:0};if(pos==="TE")return{...b,tgt:0,rec:0,recYds:0,recTD:0};if(pos==="DL")return{...b,tkl:0,ast:0,sacks:0,tfl:0,ff:0,qbH:0,pd:0};if(pos==="LB")return{...b,tkl:0,ast:0,sacks:0,tfl:0,ints:0,ff:0,pd:0};if(pos==="CB")return{...b,tkl:0,ast:0,ints:0,pd:0,ff:0};if(pos==="S")return{...b,tkl:0,ast:0,ints:0,pd:0,sacks:0,ff:0};if(pos==="K")return{...b,fgM:0,fgA:0,xpM:0,xpA:0,pts:0,lng:0};return{...b};}

// College stats generation based on years played
function genColStats(pos,yrs,ovr){
  const s={gp:yrs*R(10,13),gs:0};s.gs=Math.max(0,s.gp-R(0,yrs>1?3:8));
  if(pos==="QB"){const g=s.gp;s.comp=Math.round(g*G(18+(ovr-55)*.15,4));s.att=Math.round(s.comp/cl(Rf(.58,.7),.5,.75));s.passYds=Math.round(s.comp*cl(G(9,1.5)+(ovr-55)*.04,5,14));s.passTD=Math.round(g*cl(G(1.5+(ovr-55)*.02,.5),.3,3.5));s.passInt=Math.round(g*cl(G(.6-(ovr-55)*.003,.25),.1,1.5));}
  else if(pos==="RB"){const g=s.gp;s.rushAtt=Math.round(g*G(14+(ovr-55)*.1,4));s.rushYds=Math.round(s.rushAtt*cl(G(5,1)+(ovr-55)*.02,3,7.5));s.rushTD=Math.round(g*cl(G(.7+(ovr-55)*.015,.3),.1,2));s.rec=Math.round(g*cl(G(2,.8),.3,5));s.recYds=Math.round(s.rec*G(9,3));}
  else if(pos==="WR"){const g=s.gp;s.rec=Math.round(g*cl(G(4+(ovr-55)*.04,1.5),1,8));s.recYds=Math.round(s.rec*cl(G(13,3)+(ovr-55)*.04,6,20));s.recTD=Math.round(g*cl(G(.5+(ovr-55)*.01,.25),.1,1.5));}
  else if(pos==="TE"){const g=s.gp;s.rec=Math.round(g*cl(G(2.5+(ovr-55)*.03,1),.5,5));s.recYds=Math.round(s.rec*cl(G(11,3),5,18));s.recTD=Math.round(g*cl(G(.3+(ovr-55)*.008,.2),.05,1));}
  else if(pos==="DL"||pos==="LB"){const g=s.gp;s.tkl=Math.round(g*cl(G(pos==="LB"?5:2.5,1.5)+(ovr-55)*.02,1,9));s.sacks=Math.round(g*cl(G(pos==="DL"?.4:.25,.15)+(ovr-55)*.003,.05,1)*10)/10;s.tfl=Math.round(g*cl(G(.5,.2)+(ovr-55)*.003,.1,1.5));}
  else if(pos==="CB"||pos==="S"){const g=s.gp;s.tkl=Math.round(g*cl(G(3,1),1,6));s.ints=Math.round(yrs*cl(G(1.5+(ovr-55)*.02,.6),.2,4));s.pd=Math.round(g*cl(G(.5+(ovr-55)*.005,.2),.1,1.5));}
  else if(pos==="K"){s.fgM=Math.round(s.gp*cl(G(1.3,.4),.5,2.5));s.fgA=Math.round(s.fgM/cl(Rf(.7,.9),.6,1));}
  for(const k of Object.keys(s))if(typeof s[k]==="number"&&s[k]<0)s[k]=0;
  return s;
}

// Prospect age: weighted toward younger (20-22 common, 23 less, 24 rare)
function prospectAge(){const r=Math.random();if(r<.25)return 20;if(r<.55)return 21;if(r<.80)return 22;if(r<.94)return 23;return 24;}

function genPlayer(pos,age,ovrO,isDraft){
  const pp=PP[pos];const h_=Gc(pp.h,pp.hs,pp.hR[0],pp.hR[1]);const w_=Gc(pp.w,pp.ws,pp.wR[0],pp.wR[1]);
  const ovr=ovrO||cl(Gc(62,12,35,95),30,99);const pot=cl(ovr+R(0,20),ovr,99);age=age||R(22,32);
  const comb=isDraft?null:genCombine(pos,ovr);const phys=comb?combToPhys(comb):{spd:Gc(65,10,35,95),str:Gc(65,10,35,95),agi:Gc(65,10,35,95),end:Gc(65,10,35,95),acc:Gc(65,10,35,95),jmp:Gc(65,10,35,95)};
  const bio={strengths:[],weaknesses:[],fact:pick(FACTS),college:pick(COL)};
  const sP=[...(STRS[pos]||[])];for(let i=0;i<3&&sP.length;i++){const x=R(0,sP.length-1);bio.strengths.push(sP.splice(x,1)[0]);}
  const wP=[...(WKNS[pos]||[])];for(let i=0;i<2&&wP.length;i++){const x=R(0,wP.length-1);bio.weaknesses.push(wP.splice(x,1)[0]);}
  const colYrs=isDraft?cl(age-18,1,4):R(1,4);
  return{id:uid(),name:`${pick(FN)} ${pick(LN)}`,pos,age,ovr,pot,ht_:h_,wt:w_,...phys,posAttrs:genPAttrs(pos,ovr),
    salary:isDraft?0:Math.round((ovr/99)*Rf(2,18)*100)/100,contract:isDraft?0:R(1,4),
    injured:false,injWk:0,injType:"",bio,combine:comb,proDay:isDraft?null:null,face:genFace(),
    draftYr:0,draftPk:0,ss:emptySS(pos),cs:{},gl:[],av:0,
    tradeVal:ovr+Math.round((pot-ovr)*.5)-(age>30?(age-30)*3:0),
    scoutLvl:isDraft?0:2,trueOvr:ovr,truePot:pot,
    scoutedOvr:cl(ovr+R(-15,15),30,99),scoutedPot:cl(pot+R(-12,12),pot-5,99),
    colStats:genColStats(pos,colYrs,ovr),colYrs,draftYear:0,devG:0,
    conf:cl(Gc(60,10,40,90),40,90)};
}

function genFA(){const fa=[];for(let i=0;i<30;i++){const pos=pick(POS);const p=genPlayer(pos,R(24,33));p.contract=0;fa.push(p);}return fa;}
function genTradeOffer(teams,ui,picks){const aiIdxs=teams.map((_,i)=>i).filter(i=>i!==ui);const fromTm=aiIdxs[R(0,aiIdxs.length-1)];const aiT=teams[fromTm],usT=teams[ui];const needs=POS.filter(pos=>aiT.roster.filter(p=>p.pos===pos&&p.ovr>=65).length<2&&usT.roster.filter(p=>p.pos===pos&&p.ovr>=70).length>=3);if(!needs.length)return null;const wPos=needs[R(0,needs.length-1)];const want=usT.roster.filter(p=>p.pos===wPos&&p.ovr>=70).sort((a,b)=>a.tradeVal-b.tradeVal)[0];if(!want)return null;const wv=want.tradeVal;const aiPks=(picks||[]).filter(pk=>pk.owner===fromTm);const rng=Math.random();if(rng<0.5){const give=aiT.roster.filter(p=>p.tradeVal>=wv*.78&&p.tradeVal<=wv*1.32&&p.pos!==wPos).sort((a,b)=>Math.abs(a.tradeVal-wv)-Math.abs(b.tradeVal-wv))[0];if(!give)return null;return{fromTm,give,want,givePicks:[],wantPicks:[]};}else if(rng<0.85){const give=aiT.roster.filter(p=>p.tradeVal>=wv*.55&&p.tradeVal<wv*.85&&p.pos!==wPos).sort((a,b)=>b.tradeVal-a.tradeVal)[0];if(!give||!aiPks.length)return null;const gap=wv-give.tradeVal;const sw=aiPks.filter(pk=>(PICK_VAL[pk.overall]||0)/50>=gap*.6&&(PICK_VAL[pk.overall]||0)/50<=gap*1.6).sort((a,b)=>Math.abs((PICK_VAL[a.overall]||0)/50-gap)-Math.abs((PICK_VAL[b.overall]||0)/50-gap))[0];if(!sw)return null;return{fromTm,give,want,givePicks:[sw],wantPicks:[]};}else{if(!aiPks.length)return null;const srt=[...aiPks].sort((a,b)=>(PICK_VAL[b.overall]||0)-(PICK_VAL[a.overall]||0));const pk1=srt[0];const v1=(PICK_VAL[pk1.overall]||0)/50;if(v1>=wv*.75)return{fromTm,give:null,want,givePicks:[pk1],wantPicks:[]};const pk2=srt.find(pk=>pk.id!==pk1.id&&v1+(PICK_VAL[pk.overall]||0)/50>=wv*.75);if(!pk2)return null;return{fromTm,give:null,want,givePicks:[pk1,pk2],wantPicks:[]};}}


function genDC(yr){
  const dc=[];const posW=[];const w={QB:4,RB:6,WR:9,TE:4,LT:2,LG:2,C:1,RG:2,RT:2,DL:8,LB:7,CB:6,S:5,K:1};
  for(const[p,n]of Object.entries(w))for(let i=0;i<n;i++)posW.push(p);
  // Generate 7 rounds * 32 picks = 224 prospects (with extras)
  for(let i=0;i<240;i++){const pos=pick(posW);const p=genPlayer(pos,prospectAge(),cl(Gc(55,14,32,92),30,92),true);p.draftYear=yr;dc.push(p);}
  dc.sort((a,b)=>(b.trueOvr+b.truePot)-(a.trueOvr+a.truePot));return dc;
}

// Init draft picks: 7 rounds, each team gets 1 per round
function initPicks(teams,yr){
  const order=[...teams].sort((a,b)=>a.w-b.w||(a.pf-a.pa)-(b.pf-b.pa)).map(t=>t.id);
  const picks=[];
  for(let rd=1;rd<=7;rd++)order.forEach((tid,i)=>{picks.push({id:uid(),rd,num:i+1,overall:(rd-1)*32+i+1,owner:tid,orig:tid,yr});});
  return picks;
}

// AI positional need
function getTeamNeed(roster){
  const ideal={QB:2,RB:3,WR:5,TE:2,LT:2,LG:2,C:1,RG:2,RT:2,DL:5,LB:4,CB:4,S:3,K:1};
  const ct={};POS.forEach(p=>ct[p]=roster.filter(x=>x.pos===p).length);
  const needs=[];POS.forEach(p=>{const diff=ideal[p]-(ct[p]||0);if(diff>0)for(let i=0;i<diff;i++)needs.push(p);});
  if(!needs.length)POS.forEach(p=>needs.push(p)); // fallback
  return needs;
}
function aiBestPick(roster,available){
  const needs=getTeamNeed(roster);
  // Priority: fill needs with best available
  for(const pos of needs){const bp=available.find(p=>p.pos===pos);if(bp)return bp;}
  return available[0]; // BPA fallback
}
function gradePick(trueOvr,overall){const v=PICK_VAL[overall]||60;const ratio=trueOvr/((v/4000)*99+40);if(ratio>=1.15)return'A+';if(ratio>=1.05)return'A';if(ratio>=0.95)return'B';if(ratio>=0.85)return'C';if(ratio>=0.75)return'D';return'F';}
const scGrade=ovr=>ovr>=90?"A+":ovr>=85?"A":ovr>=78?"B":ovr>=72?"C":ovr>=65?"D":"F";

function genRoster(){const r=[];const ct={QB:3,RB:4,WR:5,TE:3,LT:2,LG:2,C:1,RG:2,RT:2,DL:6,LB:5,CB:4,S:3,K:1};for(const[pos,n]of Object.entries(ct))for(let i=0;i<n;i++){const p=genPlayer(pos);r.push(p);}return r;}
function initTeams(ui){return TEAMS.map((t,i)=>({...t,id:i,isUser:i===ui,roster:genRoster(),ps:[],ir:[],w:0,l:0,t:0,pf:0,pa:0,morale:50,streak:0,gmRep:50,strat:pick(["balanced","pass-heavy","run-heavy","defensive"]),coach:{oc:genCoach("OC"),dc:genCoach("DC"),st:genCoach("ST")}}));}
// Assign bye weeks 5-14 to each team (paired so week always has even active teams)
function genByeWeeks(ids){const byes={};const sh=[...ids].sort(()=>Math.random()-.5);const pairs=Math.floor(sh.length/2);for(let i=0;i<sh.length;i+=2){const bw=5+Math.min(9,Math.floor((i/2)*10/pairs));byes[sh[i]]=bw;if(sh[i+1]!==undefined)byes[sh[i+1]]=bw;}return byes;}
// 18-week schedule: each team plays 17 games (1 bye in weeks 5-14)
function genSched(teams,byes){const g=[];const ids=teams.map((_,i)=>i);for(let w=1;w<=18;w++){const active=ids.filter(id=>(byes||{})[id]!==w);const sh=[...active].sort(()=>Math.random()-.5);for(let i=0;i<sh.length;i+=2)g.push({wk:w,h:sh[i],a:sh[i+1],played:false,hs:0,as:0,boxH:null,boxA:null});}return g;}

// ═══════════ PER-GAME STAT SIM — calibrated to NFL averages ═══════════
// NFL targets (per game, starter): QB 255 yds 1.6 TD 0.6 INT; RB 72 rush+24 rec; WR 85 rec yds; TE 56 rec yds
// DL 4.5 tkl 0.15 sack; LB 9 tkl; CB 5 tkl; S 7 tkl; K 1.8 FGA
function simPG(p){const o=p.ovr,sp=p.spd,st=p.str;const sM=(sp-65)*.004,stM=(st-65)*.003;const s={};
  if(p.pos==="QB"){
    const att=Math.max(18,Math.round(G(35,5)+(o-65)*.12));
    const cP=cl(.60+(o-50)*.003+Rf(-.05,.05),.48,.76);
    const comp=Math.round(att*cP);
    const ypa=cl(G(7.3,.75)+(o-65)*.025+sM*2,5,11.5);
    const yds=Math.max(0,Math.round(att*ypa*.98+G(0,18)));
    const td=Math.max(0,Math.round(att*cl(.044+(o-60)*.001+Rf(-.012,.012),.012,.08)+Rf(-.4,.4)));
    const intP=cl(.58-(o-50)*.012,.05,.9);const int_=Math.random()<intP?(Math.random()<.1?2:1):0;
    const sk=Math.max(0,Math.round(G(2.2,1.1)-(o-60)*.018));
    const rA=Math.max(0,Math.round(G(3,2.2)));
    Object.assign(s,{comp,att,passYds:yds,passTD:td,passInt:int_,sk,skYds:sk*R(5,9),rushAtt:rA,rushYds:Math.round(rA*cl(G(4.5,2.5)+sM*10,-2,15)),rushTD:Math.random()<rA*.02?1:0,fum:Math.random()<.035?1:0});
    s.rate=qbRate(comp,att,yds,td,int_);
  }
  else if(p.pos==="RB"){
    const att=Math.max(4,Math.round(G(16,4.5)+(o-60)*.09));
    const ypc=cl(G(4.35,.75)+(o-60)*.016+sM*3,2.2,8);
    const td=Math.random()<.042+(o-60)*.003+stM?1:0;
    const tgt=Math.max(0,Math.round(G(3.8,1.8)));
    const rec=Math.round(tgt*cl(Rf(.65,.88),.45,1));
    Object.assign(s,{rushAtt:att,rushYds:Math.round(att*ypc),rushTD:td,rec,recYds:Math.round(rec*cl(G(9,2.8),3,18)),recTD:Math.random()<rec*.018?1:0,tgt,fum:Math.random()<.028?1:0});
  }
  else if(p.pos==="WR"){
    const tgt=Math.max(1,Math.round(G(7.8,2.8)+(o-60)*.07));
    const cR=cl(.64+(o-60)*.003+Rf(-.07,.07),.42,.86);
    const rec=Math.max(0,Math.round(tgt*cR));
    Object.assign(s,{tgt,rec,recYds:Math.round(rec*cl(G(14.5,3.5)+(sp-60)*.07,6,28)),recTD:Math.random()<.038+(o-65)*.003?1:0,rushAtt:Math.random()<.09?1:0,rushYds:Math.random()<.09?R(-1,14):0});
  }
  else if(p.pos==="TE"){
    const tgt=Math.max(0,Math.round(G(6,2.4)+(o-60)*.05));
    const rec=Math.max(0,Math.round(tgt*cl(Rf(.62,.82),.42,.92)));
    Object.assign(s,{tgt,rec,recYds:Math.round(rec*cl(G(13,2.8),5,22)),recTD:Math.random()<.032+(o-65)*.003?1:0});
  }
  else if(p.pos==="DL"){
    Object.assign(s,{tkl:Math.max(0,Math.round(G(4.5,1.8))),ast:Math.max(0,Math.round(G(2,1.2))),sacks:Math.round((Math.random()<.14+(o-60)*.004?Rf(.5,1.5):0)*10)/10,tfl:Math.random()<.18+(o-60)*.003?1:0,ff:Math.random()<.03?1:0,qbH:Math.max(0,R(0,2)),pd:Math.random()<.05?1:0});
  }
  else if(p.pos==="LB"){
    Object.assign(s,{tkl:Math.max(0,Math.round(G(8,2.5))),ast:Math.max(0,Math.round(G(3,1.5))),sacks:Math.round((Math.random()<.08+(o-60)*.002?Rf(.5,1):0)*10)/10,tfl:Math.random()<.12?1:0,ints:Math.random()<.032?1:0,ff:Math.random()<.03?1:0,pd:Math.random()<.09?1:0});
  }
  else if(p.pos==="CB"){
    Object.assign(s,{tkl:Math.max(0,Math.round(G(5,1.8))),ast:R(0,2),ints:Math.random()<.05+(o-60)*.002?1:0,pd:Math.max(0,Math.round(G(1.1,.8)+(o-60)*.012)),ff:Math.random()<.022?1:0});
  }
  else if(p.pos==="S"){
    Object.assign(s,{tkl:Math.max(0,Math.round(G(7,2))),ast:R(0,2),ints:Math.random()<.042+(o-60)*.002?1:0,pd:Math.random()<.12?1:0,sacks:Math.random()<.03?.5:0,ff:Math.random()<.022?1:0});
  }
  else if(p.pos==="K"){
    const fga=Math.max(0,Math.round(G(1.8,.7)));
    const fgm=Math.round(fga*cl(.80+(o-60)*.004+Rf(-.08,.08),.55,1));
    const xpa=Math.max(0,Math.round(G(2.5,1.0)));
    Object.assign(s,{fgM:fgm,fgA:fga,xpM:Math.round(xpa*cl(.94+(o-60)*.002,.82,1)),xpA:xpa,pts:fgm*3+Math.round(xpa*.96),lng:fgm>0?R(28,52+(o-60)):0});
  }
  return s;
}
function addS(t,s){for(const[k,v]of Object.entries(s))if(typeof v==="number")t[k]=(t[k]||0)+v;}
function teamStr(t){const r=t.roster.filter(p=>!p.injured&&!p.holdout);if(!r.length)return 50;const st={QB:1,RB:1,WR:3,TE:1,LT:1,LG:1,C:1,RG:1,RT:1,DL:4,LB:3,CB:2,S:2,K:1};const a=[];for(const[pos,n]of Object.entries(st)){const ap=r.filter(p=>p.pos===pos).sort((x,y)=>y.ovr-x.ovr);a.push(...ap.slice(0,n));}return a.length?a.reduce((s,p)=>s+p.ovr,0)/a.length:50;}
function simGame(ht,at,hPlan,aPlan){const hs=teamStr(ht)+2.5,as=teamStr(at);
  const hOC=ht.coach?.oc?(ht.coach.oc.rating-60)*.1:0,hDC=ht.coach?.dc?(ht.coach.dc.rating-60)*.1:0;
  const aOC=at.coach?.oc?(at.coach.oc.rating-60)*.1:0,aDC=at.coach?.dc?(at.coach.dc.rating-60)*.1:0;
  const hFit=getOCFit(ht)+getDCFit(ht),aFit=getOCFit(at)+getDCFit(at);
  const offB={run_heavy:{m:-1.2,s:-2},balanced:{m:0,s:0},pass_heavy:{m:1.5,s:2.5}};
  const defB={conservative:{m:-1.5,s:-2},aggressive:{m:-2.2,s:2.5},prevent:{m:-0.5,s:-3}};
  const hOM=offB[hPlan?.off]||offB.balanced,hDM=defB[hPlan?.def]||defB.conservative;
  const aOM=offB[aPlan?.off]||offB.balanced,aDM=defB[aPlan?.def]||defB.conservative;
  const hMorB=((ht.morale||50)-50)*0.06,aMorB=((at.morale||50)-50)*0.06;
  let hsc=Math.max(3,Math.round(G(22+(hs-60)*.35+hOC-aDC+hFit*.5+hOM.m+aDM.m+hMorB,Math.max(3,7+hOM.s+aDM.s))));
  let asc=Math.max(3,Math.round(G(22+(as-60)*.35+aOC-hDC+aFit*.5+aOM.m+hDM.m+aMorB,Math.max(3,7+aOM.s+hDM.s))));
  hsc=Math.min(hsc,52);asc=Math.min(asc,52);
  const boxH={},boxA={};
  [ht,at].forEach((t,ti)=>{const box=ti===0?boxH:boxA;t.roster.forEach(p=>{if(p.injured||p.holdout)return;const gs=simPG(p);if(!Object.keys(gs).length)return;p.ss.gp=(p.ss.gp||0)+1;p.ss.gs=(p.ss.gs||0)+1;addS(p.ss,gs);if(p.pos==="QB"&&p.ss.att>0)p.ss.rate=qbRate(p.ss.comp,p.ss.att,p.ss.passYds,p.ss.passTD,p.ss.passInt);p.gl.push({...gs,gp:1});box[p.id]={...gs,name:p.name,pos:p.pos};if(Math.random()<.025){p.injured=true;p.injType=pick(["Hamstring","Ankle","Knee (MCL)","Shoulder","Concussion","Quad","Calf","Back"]);const sevRoll=Math.random();if(sevRoll<0.4){p.injSev="minor";p.injRecWks=R(1,2);}else if(sevRoll<0.8){p.injSev="moderate";p.injRecWks=R(3,5);}else{p.injSev="major";p.injRecWks=R(6,8);}p.injWk=p.injRecWks;}});});
  return{hsc,asc,boxH,boxA};}

// ═══════════ SCOUTS ═══════════
const SC_TRAITS=["Eye for QBs","Defensive Specialist","Small School Finder","Measurables Expert","Character Evaluator","Combine Guru","Film Junkie","Late Round Wizard","OL Whisperer"];
function genScout(){return{id:uid(),name:`${pick(FN)} ${pick(LN)}`,evaluation:R(40,95),accuracy:R(40,95),speed:R(40,95),trait:pick(SC_TRAITS),salary:+(Rf(.5,3)).toFixed(1),face:genFace()};}

// ═══════════ COACHING ═══════════
const OC_SCHEMES=["Air Raid","West Coast","Spread","Power Run"];
const DC_SCHEMES=["3-4","4-3","Cover 2","Zone Blitz"];
const CO_TRAITS={OC:["Creative Play-Caller","Run Game Specialist","QB Whisperer","Red Zone Guru","Clock Manager","Tempo Master","Play-Action Artist","2-Minute Drill"],DC:["Blitz Specialist","Cover 2 Maestro","Run Stopper","Turnover Machine","4th Quarter D","Secondary Coach","Pressure Specialist","Bend Don't Break"],ST:["Kicker Developer","Returner Coach","Coverage Unit","Ice the Kicker"]};
function genCoach(role){const sch=role==="OC"?OC_SCHEMES:role==="DC"?DC_SCHEMES:["Standard ST"];return{id:uid(),name:`${pick(FN)} ${pick(LN)}`,face:genFace(),role,rating:Gc(65,12,40,95),trait:pick(CO_TRAITS[role]),scheme:pick(sch),salary:+(Rf(1,6)).toFixed(1),contract:R(1,3)};}
function getOCFit(t){const oc=t.coach?.oc;if(!oc)return 0;const qb=t.roster.filter(p=>p.pos==="QB"&&!p.injured).sort((a,b)=>b.ovr-a.ovr)[0];const rb=t.roster.filter(p=>p.pos==="RB"&&!p.injured).sort((a,b)=>b.ovr-a.ovr)[0];if(oc.scheme==="Air Raid"&&(qb?.ovr||0)>70)return 2;if(oc.scheme==="Power Run"&&(rb?.ovr||0)>70)return 2;if(oc.scheme==="West Coast"&&(qb?.ovr||0)>65)return 1;if(oc.scheme==="Spread"&&(qb?.spd||0)>70)return 1.5;return 0;}
function getDCFit(t){const dc=t.coach?.dc;if(!dc)return 0;const lb=t.roster.filter(p=>p.pos==="LB"&&!p.injured).sort((a,b)=>b.ovr-a.ovr)[0];const dl=t.roster.filter(p=>p.pos==="DL"&&!p.injured).sort((a,b)=>b.ovr-a.ovr)[0];if(dc.scheme==="3-4"&&(lb?.ovr||0)>70)return 2;if(dc.scheme==="4-3"&&(dl?.ovr||0)>70)return 2;if(dc.scheme==="Zone Blitz"&&(lb?.ovr||0)>65)return 1.5;return 0;}
function schemeRunPct(t){const s=t.coach?.oc?.scheme;if(s==="Power Run")return .60;if(s==="Air Raid")return .28;if(s==="Spread")return .35;return .42;}
const CAP_CEILING=200;
function capHit(t){return+((t.roster?.reduce((s,p)=>s+(p.salary||0),0)||0)+((t.coach?.oc?.salary||0)+(t.coach?.dc?.salary||0)+(t.coach?.st?.salary||0))+(t.deadCap||0)).toFixed(1);}
function capSpace(t){return+(CAP_CEILING-capHit(t)).toFixed(1);}

// ═══════════ LIVE PLAY GEN ═══════════
// uCall: undefined=auto | "run_inside"|"run_outside"|"run_screen"|"scramble"|"pass_quick"|"pass_medium"|"pass_deep"|"pass_rpo"
function genLivePlay(offTeam,defTeam,yard,down,toGo,uCall,qteBonus=1){
  const qb=offTeam.roster.filter(p=>p.pos==="QB"&&!p.injured).sort((a,b)=>b.ovr-a.ovr)[0];
  const rbs=offTeam.roster.filter(p=>p.pos==="RB"&&!p.injured).sort((a,b)=>b.ovr-a.ovr);
  const wrs=offTeam.roster.filter(p=>p.pos==="WR"&&!p.injured).sort((a,b)=>b.ovr-a.ovr);
  const tes=offTeam.roster.filter(p=>p.pos==="TE"&&!p.injured).sort((a,b)=>b.ovr-a.ovr);
  const dls=defTeam.roster.filter(p=>["DL","LB"].includes(p.pos)&&!p.injured).sort((a,b)=>b.ovr-a.ovr);
  const dbs=defTeam.roster.filter(p=>["CB","S"].includes(p.pos)&&!p.injured).sort((a,b)=>b.ovr-a.ovr);
  const k=offTeam.roster.filter(p=>p.pos==="K"&&!p.injured).sort((a,b)=>b.ovr-a.ovr)[0];
  if(!qb)return{text:"No QB available.",yards:0,type:"inc",player:null,newDown:down+1,td:false,turnover:false};
  const rb=rbs[0]||qb;const wr=pick(wrs.length?wrs:[qb]);const te=tes[0]||wr;
  const dl=pick(dls.length?dls:[{name:"Defender",ovr:55,id:"x"}]);
  const db=pick(dbs.length?dbs:[{name:"DB",ovr:55,id:"x"}]);
  if(uCall==="punt")return{text:"Team punts away.",yards:0,type:"punt",player:null,newDown:1,td:false,turnover:true};
  if(uCall==="fg"){const made=k?Math.random()<cl(.65+(k.ovr-50)*.005,.3,.95):false;return{text:made?`${k?.name||"K"} kicks... GOOD! 3 points!`:`${k?.name||"K"}'s kick is NO GOOD.`,yards:0,type:made?"fg":"fg_miss",player:k||null,newDown:1,td:false,turnover:!made,score:made?3:0};}
  // Penalty 5%
  if(Math.random()<.05){const pens=["False start, offense. 5-yard penalty.","Holding, offense. 10-yard penalty.","Pass interference, defense. Auto first down.","Offsides, defense. 5-yard penalty."];const pen=pick(pens);const offP=pen.includes("offense");return{text:`🚩 ${pen}`,yards:offP?-5:5,type:"penalty",player:null,newDown:offP?down:1,td:false,turnover:false};}
  // 4th down
  if(down===4){if(yard>=58&&k){const made=Math.random()<cl(.65+(k.ovr-50)*.005,.3,.95);return{text:made?`${k.name} kicks... GOOD! 3 points!`:`${k.name}'s kick is NO GOOD.`,yards:0,type:made?"fg":"fg_miss",player:k,newDown:1,td:false,turnover:!made,score:made?3:0};}return{text:"Team punts away.",yards:0,type:"punt",player:null,newDown:1,td:false,turnover:true};}
  // Determine play type from user call
  const isScramble=uCall==="scramble";
  const isScreen=uCall==="run_screen";
  const isRun=isScramble||isScreen||(uCall?uCall.startsWith("run_"):Math.random()<schemeRunPct(offTeam));
  const passV=uCall&&uCall.startsWith("pass_")?uCall.slice(5):null;
  if(isRun){
    const runner=isScramble?qb:rb;const oM=(runner.ovr-55)/100;const sB=(runner.spd-60)/150;
    let yds,dir;
    if(isScramble){const mob=(qb.posAttrs?.mobility||qb.ovr)/100;yds=Math.round(cl(G(3+mob*8,4),-3,qb.spd>75?R(10,35):12));dir="scrambles";}
    else if(isScreen){yds=Math.round(cl(G(5+oM*4,4),-2,rb.spd>82?R(15,45):22));dir="screen";}
    else if(uCall==="run_outside"){yds=Math.round(cl(G(3.5+oM*2+sB*6,3.5),-4,runner.spd>85?R(15,65):20));dir=pick(["around right end","around left end","on a sweep"]);}
    else{yds=Math.round(cl(G(3.8+oM*3+sB*4,3),-4,runner.spd>85?R(15,65):18));dir=pick(["up the middle","off left tackle","off right tackle"]);}
    yds=Math.round(yds*qteBonus);const isTD=yard+yds>=100;const fum=Math.random()<(isScramble?.03:.02);
    let text=fum?`${runner.name} FUMBLES! Ball is loose!`:isTD?(isScramble?`🏈 TOUCHDOWN! ${runner.name} scrambles in for the score!`:isScreen?`🏈 TOUCHDOWN! ${runner.name} takes the screen ${100-yard} yards!`:`🏈 TOUCHDOWN! ${runner.name} scores from ${100-yard} yards out!`):(isScramble?`${runner.name} scrambles for ${Math.abs(yds)} ${yds>=0?"yards":"yard loss"}.`:isScreen?`${runner.name} catches the screen for ${Math.abs(yds)} ${yds>=0?"yards":"yard loss"}.`:`${runner.name} runs ${dir} for ${Math.abs(yds)} ${yds>=0?"yards":"yard loss"}.`);
    return{text,yards:fum?0:yds,type:isTD?"td":fum?"fumble":"run",player:runner,newDown:yds>=toGo?1:down+1,td:isTD,turnover:fum,score:isTD?7:0};}
  // Pass — risk modifiers from call type; OL quality reduces sack chance
  const olStarters=offTeam.roster.filter(p=>['LT','LG','C','RG','RT'].includes(p.pos)&&!p.injured).sort((a,b)=>b.ovr-a.ovr).slice(0,5);
  const olOvr=olStarters.length?olStarters.reduce((s,p)=>s+p.ovr,0)/olStarters.length:70;
  let sackCh=cl(.08-(qb.ovr-55)*.002+dl.ovr*.0015-(olOvr-70)*.0012,.02,.2);
  let intCh=cl(.04-(qb.ovr-55)*.001+db.ovr*.001,.01,.12);
  if(passV==="quick"){sackCh*=.5;intCh*=.4;}
  if(passV==="deep"){sackCh*=.7;intCh*=1.8;}
  if(qteBonus>1.1){sackCh*=.5;intCh*=.5;}
  if(qteBonus<0.8){sackCh*=1.8;intCh*=1.8;}
  if(Math.random()<sackCh){const loss=R(3,12);return{text:`${dl.name} SACKS ${qb.name} for a loss of ${loss}!`,yards:-loss,type:"sack",player:dl,defPlay:true,newDown:down+1,td:false,turnover:false};}
  if(Math.random()<intCh)return{text:`INTERCEPTED! ${db.name} picks off ${qb.name}!`,yards:0,type:"int",player:db,defPlay:true,newDown:1,td:false,turnover:true};
  const tgt=passV==="rpo"?(Math.random()<.45?rb:wr):Math.random()<.55?wr:(te||wr);
  let compCh=cl(.58+(qb.ovr-50)*.004+(tgt.ovr-50)*.002,.35,.82);
  if(passV==="quick")compCh=cl(compCh*1.18,.5,.9);
  if(passV==="deep")compCh=cl(compCh*.72,.25,.7);
  compCh=cl(compCh*qteBonus,.2,.96);
  if(Math.random()>compCh)return{text:`${qb.name}'s pass to ${tgt.name} falls incomplete.`,yards:0,type:"inc",player:qb,newDown:down+1,td:false,turnover:false};
  const spdB=(tgt.spd-60)/80;
  const deep=passV==="deep"||(passV!=="quick"&&passV!=="medium"&&passV!=="rpo"&&Math.random()<.18+spdB*.1);
  const yds=deep?Math.round(cl(G(28+spdB*12,10),12,tgt.spd>85?R(40,75):55)):Math.round(cl(G(passV==="quick"?5:8+(tgt.ovr-55)*.08,passV==="quick"?2:4),1,22));
  const isTD=yard+yds>=100;const depthStr=deep?"DEEP":"short";
  let text=isTD?`🏈 TOUCHDOWN! ${qb.name} hits ${tgt.name} ${depthStr} for the score!`:`${qb.name} connects with ${tgt.name} ${depthStr} for ${yds} yards.`;
  return{text,yards:yds,type:isTD?"td":"pass",player:tgt,passer:qb,newDown:yds>=toGo?1:down+1,td:isTD,turnover:false,score:isTD?7:0};
}

// ═══════════ COLORS & LABELS ═══════════
const C={bg:"#080c14",cd:"#111827",bd:"#1e293b",tx:"#e0e6f0",mt:"#64748b",gn:"#22c55e",bl:"#3b82f6",gd:"#eab308",rd:"#ef4444",f:"'Segoe UI',system-ui,sans-serif"};
const oC=o=>o>=80?"#22c55e":o>=68?"#84cc16":o>=55?"#eab308":o>=42?"#f97316":"#ef4444";
const pC=p=>({QB:"#e74c3c",RB:"#3498db",WR:"#f39c12",TE:"#9b59b6",LT:"#1abc9c",LG:"#17a589",C:"#0e8c73",RG:"#17a589",RT:"#1abc9c",DL:"#e67e22",LB:"#2ecc71",CB:"#e91e63",S:"#00bcd4",K:"#795548"}[p]||"#999");
const sL=k=>({passYds:"PYDS",passTD:"PTD",passInt:"INT",comp:"CMP",att:"ATT",rushYds:"RYDS",rushAtt:"RATT",rushTD:"RTD",recYds:"RECYDS",rec:"REC",recTD:"RECTD",tgt:"TGT",tkl:"TKL",ast:"AST",sacks:"SCK",tfl:"TFL",ints:"INT",ff:"FF",pd:"PD",qbH:"QBH",fgM:"FGM",fgA:"FGA",xpM:"XPM",xpA:"XPA",pts:"PTS",lng:"LNG",sk:"SK",skYds:"SKY",rate:"RTG",gp:"GP",gs:"GS",fum:"FUM",av:"AV"}[k]||k);
const Bdg=({pos})=><span style={{background:pC(pos),color:"#fff",padding:"1px 5px",borderRadius:3,fontSize:8,fontWeight:800}}>{pos}</span>;
const Btn=({children,onClick,disabled,bg,c:co,style:st})=><button onClick={onClick} disabled={disabled} style={{background:bg||C.bl,color:co||"#fff",border:"none",padding:"4px 10px",borderRadius:4,fontWeight:700,fontSize:10,cursor:disabled?"default":"pointer",opacity:disabled?.5:1,...(st||{})}}>{children}</button>;
const PN=({p,setSel,style:st})=><span onClick={e=>{e.stopPropagation();setSel(p);}} style={{cursor:"pointer",fontWeight:600,textDecoration:"none",...(st||{})}} onMouseOver={e=>e.target.style.textDecoration="underline"} onMouseOut={e=>e.target.style.textDecoration="none"}>{p.name}</span>;

// ═══ FIELD VISUALIZATION ═══
const FieldViz=({ballYard,offClr,defClr,lastPlay,possession})=>{
  const fW=440,fH=120,ezW=25;const yardToPx=y=>ezW+(y/100)*(fW-2*ezW);const bx=yardToPx(ballYard);
  const players=useMemo(()=>{const ps=[];for(let i=0;i<5;i++){ps.push({x:cl(bx-R(5,20),10,fW-10),y:R(25,fH-25),clr:offClr});ps.push({x:cl(bx+R(5,20),10,fW-10),y:R(25,fH-25),clr:defClr});}ps.push({x:bx-R(0,4),y:fH/2,clr:offClr});return ps;},[bx,offClr,defClr]);
  return(<svg width="100%" viewBox={`0 0 ${fW} ${fH}`} style={{borderRadius:6,display:"block",background:"#2d5016"}}>
    <defs><pattern id="grass" width="8" height="8" patternUnits="userSpaceOnUse"><rect width="8" height="8" fill="#2d5016"/><line x1="0" y1="4" x2="8" y2="4" stroke="#35601a" strokeWidth=".3"/></pattern></defs>
    <rect x="0" y="0" width={fW} height={fH} fill="url(#grass)" rx="6"/>
    <rect x="0" y="0" width={ezW} height={fH} fill="#a0522d" opacity=".25" rx="6"/>
    <rect x={fW-ezW} y="0" width={ezW} height={fH} fill="#a0522d" opacity=".25"/>
    {[10,20,30,40,50,60,70,80,90].map(y=><g key={y}><line x1={yardToPx(y)} y1="8" x2={yardToPx(y)} y2={fH-8} stroke="#fff3" strokeWidth=".8"/><text x={yardToPx(y)} y="16" textAnchor="middle" fill="#fff3" fontSize="6">{y<=50?y:100-y}</text></g>)}
    {players.map((p,i)=><circle key={i} cx={p.x} cy={p.y} r="5" fill={p.clr} stroke="#fff" strokeWidth=".6" opacity=".85"/>)}
    <ellipse cx={bx} cy={fH/2} rx="5" ry="3.5" fill="#8B4513" stroke="#fff" strokeWidth=".8"/>
    {lastPlay?.td&&<text x={fW/2} y={fH/2+5} textAnchor="middle" fill="#ffd700" fontSize="18" fontWeight="900" opacity=".9">TOUCHDOWN!</text>}
    {lastPlay?.type==="int"&&<text x={fW/2} y={fH/2+5} textAnchor="middle" fill="#ef4444" fontSize="14" fontWeight="900" opacity=".9">INTERCEPTED!</text>}
  </svg>);
};

// ═══ PLAYER TABLE (shared roster/FA) ═══
const PlayerTable=({players,setSel,sortCol,sortDir,onSort,posFilter,setPosFilter,showSign,onSign})=>{
  const cols=[{k:"name",l:"Player",w:100},{k:"pos",l:"Pos",w:30},{k:"age",l:"Age",w:26},{k:"ovr",l:"OVR",w:30},{k:"pot",l:"POT",w:30},{k:"spd",l:"SPD",w:26},{k:"str",l:"STR",w:26},{k:"agi",l:"AGI",w:26},{k:"acc",l:"ACC",w:26},{k:"jmp",l:"JMP",w:26},{k:"end",l:"END",w:26},{k:"av",l:"AV",w:26},{k:"salary",l:"$M",w:32},{k:"contract",l:"Yr",w:22}];
  const filtered=posFilter==="ALL"?players:players.filter(p=>p.pos===posFilter);
  const sorted=[...filtered].sort((a,b)=>{const av=a[sortCol]??a.ss?.[sortCol]??0;const bv=b[sortCol]??b.ss?.[sortCol]??0;if(typeof av==="string")return sortDir*av.localeCompare(bv);return sortDir*(bv-av);});
  return(<div>
    <div style={{display:"flex",gap:2,marginBottom:5,flexWrap:"wrap"}}>{["ALL",...POS].map(p=><button key={p} onClick={()=>setPosFilter(p)} style={{background:posFilter===p?C.bl+"33":"transparent",color:posFilter===p?"#fff":C.mt,border:`1px solid ${posFilter===p?C.bl:C.bd}`,padding:"2px 5px",borderRadius:3,fontSize:8,fontWeight:700,cursor:"pointer"}}>{p}</button>)}</div>
    <div style={{overflowX:"auto"}}><table style={{width:"100%",borderCollapse:"collapse",fontSize:10}}><thead><tr>
      <th style={{width:24,borderBottom:`1px solid ${C.bd}`}}></th>
      {cols.map(c=><th key={c.k} onClick={()=>onSort(c.k)} style={{cursor:"pointer",padding:"3px 2px",textAlign:"center",fontSize:8,color:sortCol===c.k?C.gn:C.mt,fontWeight:700,whiteSpace:"nowrap",width:c.w,borderBottom:`1px solid ${C.bd}`,background:C.bg}}>{c.l}{sortCol===c.k?(sortDir===-1?"▼":"▲"):""}</th>)}
      {showSign&&<th style={{width:36,borderBottom:`1px solid ${C.bd}`}}></th>}
    </tr></thead><tbody>{sorted.map(p=><tr key={p.id} style={{borderBottom:`1px solid ${C.bd}11`}} onMouseOver={e=>e.currentTarget.style.background="#1e293b44"} onMouseOut={e=>e.currentTarget.style.background="transparent"}>
      <td style={{padding:"2px",textAlign:"center"}}><Face s={p.face} sz={20}/></td>
      <td style={{padding:"2px"}}>{p.injured&&<span style={{color:C.rd,fontSize:8}}>● </span>}<PN p={p} setSel={setSel}/>{p.age<=24&&(p.pot||0)-p.ovr>=12&&<span style={{color:"#22d3ee",fontSize:7,fontWeight:800,marginLeft:2}}>⬆</span>}</td>
      <td style={{textAlign:"center"}}><Bdg pos={p.pos}/></td>
      <td style={{textAlign:"center",color:p.age>31?"#f97316":"#94a3b8",fontSize:10}}>{p.age}</td>
      <td style={{textAlign:"center",fontWeight:800,color:oC(p.ovr)}}>{p.ovr}{p.devG>0&&<span style={{color:"#22d3ee",fontSize:7,marginLeft:2}}>+{p.devG}</span>}{p.devG<0&&<span style={{color:"#f97316",fontSize:7,marginLeft:2}}>{p.devG}</span>}{p.ftag&&<span style={{fontSize:7,background:"#b4530944",color:"#fef3c7",borderRadius:2,padding:"1px 3px",fontWeight:700,marginLeft:2}}>FT</span>}</td>
      <td style={{textAlign:"center",color:C.bl,fontWeight:700}}>{p.pot}</td>
      <td style={{textAlign:"center",color:oC(p.spd),fontSize:9}}>{p.spd}</td>
      <td style={{textAlign:"center",color:oC(p.str),fontSize:9}}>{p.str}</td>
      <td style={{textAlign:"center",color:oC(p.agi),fontSize:9}}>{p.agi}</td>
      <td style={{textAlign:"center",color:oC(p.acc),fontSize:9}}>{p.acc}</td>
      <td style={{textAlign:"center",color:oC(p.jmp),fontSize:9}}>{p.jmp}</td>
      <td style={{textAlign:"center",color:oC(p.end),fontSize:9}}>{p.end}</td>
      <td style={{textAlign:"center",color:C.gd,fontWeight:700}}>{p.av}</td>
      <td style={{textAlign:"center",color:C.gd,fontSize:9}}>{typeof p.salary==="number"?`$${p.salary.toFixed(1)}`:"-"}</td>
      <td style={{textAlign:"center",color:p.contract<=1?C.rd:C.mt,fontSize:9}}>{p.contract||"FA"}</td>
      {showSign&&<td><Btn onClick={()=>onSign(p)} bg={`${C.gn}22`} c={C.gn} style={{border:`1px solid ${C.gn}44`,padding:"1px 5px",fontSize:8}}>Sign</Btn></td>}
    </tr>)}</tbody></table></div>
  </div>);
};

const DC_S={QB:1,RB:2,WR:3,TE:1,LT:1,LG:1,C:1,RG:1,RT:1,DL:4,LB:3,CB:2,S:2,K:1};
const DepthChartView=({roster,setSel,onAutoFill})=><div><div>{onAutoFill&&<div style={{display:"flex",justifyContent:"flex-end",marginBottom:4}}><button onClick={onAutoFill} style={{background:`${C.gn}22`,color:C.gn,border:`1px solid ${C.gn}44`,borderRadius:3,padding:"2px 8px",fontSize:8,fontWeight:700,cursor:"pointer"}}>⚡ Auto-Fill by OVR</button></div>}</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(185px,1fr))",gap:4}}>{POS.map(pos=>{const pl=roster.filter(p=>p.pos===pos).sort((a,b)=>b.ovr-a.ovr);const n=DC_S[pos]||2;return(<div key={pos} style={{background:C.cd,borderRadius:5,padding:"5px 7px",border:`1px solid ${C.bd}`}}><div style={{fontSize:7,fontWeight:800,color:pC(pos),marginBottom:3,letterSpacing:1}}>{pos}</div>{pl.slice(0,Math.min(pl.length,n+2)).map((p,i)=>{const isSt=i<n;return(<div key={p.id} style={{display:"flex",alignItems:"center",gap:3,padding:"1px 2px",opacity:p.injured?.45:1}}><span style={{fontSize:6,color:isSt?(!p.injured?C.gn:C.rd):C.mt,minWidth:12,fontWeight:700}}>{isSt?(!p.injured?"ST":"INJ"):"BK"}</span><PN p={p} setSel={setSel} style={{fontSize:8,flex:1}}/><span style={{fontWeight:800,color:oC(p.ovr),fontSize:8}}>{p.ovr}</span>{p.injured&&<span style={{color:C.rd,fontSize:6}}> {p.injWk}w</span>}</div>);})}{!pl.length&&<span style={{fontSize:8,color:C.mt}}>—</span>}</div>);})}</div></div>;

// ═══ ANALYTICS ═══ Privacy-safe, no PII. Set VITE_ANALYTICS_URL in .env.local to enable.
const _EP=import.meta.env.VITE_ANALYTICS_URL||'';
const track=e=>{if(!_EP)return;try{const p=JSON.stringify({e,v:'3.7',t:Date.now()});navigator.sendBeacon?navigator.sendBeacon(_EP,p):fetch(_EP,{method:'POST',body:p,keepalive:true}).catch(()=>{});}catch{}};

// ═══════════ MAIN APP ═══════════
export default function GridironGM(){
  const[phase,setPhase]=useState("splash");
  const[teams,setTeams]=useState([]);const[ui,setUi]=useState(null);const[yr,setYr]=useState(2026);const[wk,setWk]=useState(0);
  const[sched,setSched]=useState([]);const[sp,setSp]=useState("preseason");const[tab,setTab]=useState("roster");
  const[dc,setDc]=useState({});const[fa,setFa]=useState([]);const[waivers,setWaivers]=useState([]);
  const[pb,setPb]=useState(null);const[msg,setMsg]=useState("");
  const[sc,setSc]=useState("ovr");const[sd,setSd]=useState(-1);const[sel,setSel]=useState(null);
  const[log,setLog]=useState([]);const[champs,setChamps]=useState([]);const[sf,setSf]=useState("passing");
  const[myScout,setMyScout]=useState(null);const[faScouts,setFaScouts]=useState([]);const[scPts,setScPts]=useState(10);const[scView,setScView]=useState(0);
  const[faCoaches,setFaCoaches]=useState([]);
  const[trTm,setTrTm]=useState(null);const[trOff,setTrOff]=useState({g:[],r:[],gPk:[],rPk:[]});
  const[draftPicks,setDraftPicks]=useState([]);const[draftIdx,setDraftIdx]=useState(0);const[draftLog,setDraftLog]=useState([]);
  const[draftTimer,setDraftTimer]=useState(120);const[draftActive,setDraftActive]=useState(false);const[draftPaused,setDraftPaused]=useState(false);
  const[rPosF,setRPosF]=useState("ALL");const[faPosF,setFaPosF]=useState("ALL");const[scPosF,setScPosF]=useState("ALL");const[drPosF,setDrPosF]=useState("ALL");
const[fourthChoice,setFourthChoice]=useState(null);const[showDepth,setShowDepth]=useState(false);const[showPS,setShowPS]=useState(false);const[showIR,setShowIR]=useState(false);const[preseasonGames,setPreseasonGames]=useState([]);
  const[trProp,setTrProp]=useState(null);const[gamePlan,setGamePlan]=useState({off:'balanced',def:'balanced'});const[byeMap,setByeMap]=useState({});
  const[faSc,setFaSc]=useState("ovr");const[faSd,setFaSd]=useState(-1);
  const[lkrOpen,setLkrOpen]=React.useState(false);const[rivalry,setRivalry]=React.useState(null);const[ftag,setFtag]=React.useState(null);
  // Live sim
  const[liveSim,setLiveSim]=useState(null);const[liveLog,setLiveLog]=useState([]);
  const[liveScore,setLiveScore]=useState({h:0,a:0});const[liveQtr,setLiveQtr]=useState(1);
  const[liveYard,setLiveYard]=useState(25);const[livePoss,setLivePoss]=useState("h");
  const[liveDown,setLiveDown]=useState(1);const[liveToGo,setLiveToGo]=useState(10);
  const[livePlay,setLivePlay]=useState(0);const[liveDone,setLiveDone]=useState(false);
  const[livePaused,setLivePaused]=useState(false);const[livePOG,setLivePOG]=useState(null);
  const[liveStats,setLiveStats]=useState({h:{},a:{}});const[lastLivePlay,setLastLivePlay]=useState(null);
  const[boxView,setBoxView]=useState(null);
  const[liveCallMode,setLiveCallMode]=useState(false);const[liveAwaitingCall,setLiveAwaitingCall]=useState(false);
  const[livePhase,setLivePhase]=useState(null);const[livePendingCall,setLivePendingCall]=useState(null);
  const[liveQteBar,setLiveQteBar]=useState(50);const[liveRecTargets,setLiveRecTargets]=useState([]);
  const liveQteDirRef=useRef(1);
  const timerRef=useRef(null);const liveRef=useRef(null);const logEndRef=useRef(null);
  const sm=useCallback(m=>{setMsg(m);setTimeout(()=>setMsg(""),3500);},[]);
  const ut=useMemo(()=>teams[ui],[teams,ui]);

  // Draft timer
  useEffect(()=>{
    if(!draftActive||sp!=="draft"||draftPaused)return;
    timerRef.current=setInterval(()=>setDraftTimer(t=>t<=1?0:t-1),1000);
    return()=>clearInterval(timerRef.current);
  },[draftActive,sp,draftPaused]);
  useEffect(()=>{
    if(sp!=="draft"||!draftActive||draftPaused)return;
    const picks=draftPicks;const idx=draftIdx;if(idx>=picks.length){setDraftActive(false);return;}
    const cur=picks[idx];
    if(cur.owner!==ui){const to=setTimeout(()=>aiPick(),400);return()=>clearTimeout(to);}
    else if(draftTimer<=0){const to=setTimeout(()=>{const cls=dc[yr]||[];if(cls.length)makePick(cls[0]);},200);return()=>clearTimeout(to);}
  },[draftIdx,draftActive,draftTimer,sp,draftPaused]);

  // Live sim ticker
  useEffect(()=>{
    if(!liveSim||liveDone||livePaused||liveAwaitingCall||livePhase)return;
    liveRef.current=setInterval(()=>advanceLivePlay(),1100);
    return()=>clearInterval(liveRef.current);
  },[liveSim,liveDone,livePaused,liveAwaitingCall,livePlay,livePhase]);
  useEffect(()=>{if(logEndRef.current)logEndRef.current.scrollIntoView({behavior:"smooth"});},[liveLog]);
  useEffect(()=>{if(livePhase!=="running")return;const id=setInterval(()=>{setLiveQteBar(v=>{const nv=v+liveQteDirRef.current*3;if(nv>=100||nv<=0)liveQteDirRef.current*=-1;return Math.max(0,Math.min(100,nv));});},40);return()=>clearInterval(id);},[livePhase]);
  useEffect(()=>{if(livePhase!=="passing")return;const id=setInterval(()=>{setLiveRecTargets(ts=>ts.map(t=>Math.random()<0.28?{...t,open:!t.open}:t));},1100);return()=>clearInterval(id);},[livePhase]);
  // Commit live sim result to game state when game ends
  useEffect(()=>{
    if(!liveDone||!liveSim)return;
    const ns=[...sched];const gi=ns.findIndex(g=>!g.played&&g.h===liveSim.h&&g.a===liveSim.a&&g.wk===liveSim.wk);
    if(gi<0)return;
    const bH={},bA={};
    Object.entries(liveStats.h||{}).forEach(([pid,s])=>{bH[pid]={...s};});
    Object.entries(liveStats.a||{}).forEach(([pid,s])=>{bA[pid]={...s};});
    ns[gi]={...ns[gi],played:true,hs:liveScore.h,as:liveScore.a,boxH:bH,boxA:bA};
    const nt=[...teams];
    if(liveScore.h>liveScore.a){nt[liveSim.h].w++;nt[liveSim.a].l++;}
    else if(liveScore.a>liveScore.h){nt[liveSim.a].w++;nt[liveSim.h].l++;}
    else{nt[liveSim.h].t++;nt[liveSim.a].t++;}
    nt[liveSim.h].pf+=liveScore.h;nt[liveSim.h].pa+=liveScore.a;
    nt[liveSim.a].pf+=liveScore.a;nt[liveSim.a].pa+=liveScore.h;
    {const isH=liveSim.h===ui;const livUs=isH?liveScore.h:liveScore.a;const livThem=isH?liveScore.a:liveScore.h;const livWon=livUs>livThem;const livTie=livUs===livThem;const nStr=livWon?Math.max(0,nt[ui].streak||0)+1:livTie?0:Math.min(0,nt[ui].streak||0)-1;nt[ui].streak=nStr;const sB=Math.abs(nStr)>=3?2:0;nt[ui].morale=cl((nt[ui].morale||50)+(livWon?4+sB:livTie?0:-(4+sB)),0,100);}
    setSched(ns);setTeams(nt);
    const isH=liveSim.h===ui;const us=isH?liveScore.h:liveScore.a;const them=isH?liveScore.a:liveScore.h;
    const oppAb=TEAMS[isH?liveSim.a:liveSim.h].ab;
    if(liveSim.h===ui||liveSim.a===ui)setLog(pr=>[...pr,`Wk${liveSim.wk}: ${us>them?"W":"L"} ${us}-${them} vs ${oppAb} (LIVE)`]);
  },[liveDone]);

  function advanceLivePlay(uCall,qteBonus=1){
    if(!liveSim||liveDone)return;
    const hTeam=teams[liveSim.h],aTeam=teams[liveSim.a];
    const offTeam=livePoss==="h"?hTeam:aTeam,defTeam=livePoss==="h"?aTeam:hTeam;
    const isUserPoss=liveCallMode&&livePoss===(liveSim.h===ui?"h":"a");
    if(isUserPoss&&uCall===undefined){setLiveAwaitingCall(true);return;}
    if(isUserPoss)setLiveAwaitingCall(false);
    const play=genLivePlay(offTeam,defTeam,liveYard,liveDown,liveToGo,uCall,qteBonus);
    setLastLivePlay(play);
    const nLog=[...liveLog,{qtr:liveQtr,text:play.text,type:play.type,poss:livePoss}];
    const ns={...liveScore};let ny=liveYard+play.yards;let nd=play.newDown;let ntg=nd===1?10:liveToGo;let np=livePoss;let nq=liveQtr;
    // Update stats
    const nst=JSON.parse(JSON.stringify(liveStats));
    if(play.player&&play.player.id!=="x"){
      const side=play.defPlay?(livePoss==="h"?"a":"h"):livePoss;
      const pid=play.player.id;
      if(!nst[side][pid])nst[side][pid]={name:play.player.name,pos:play.player.pos,passYds:0,rushYds:0,recYds:0,td:0,comp:0,att:0,rec:0,tkl:0,sack:0,int:0,rushAtt:0};
      const ps=nst[side][pid];
      if(play.type==="run"||(play.type==="td"&&!play.passer)){ps.rushYds+=play.yards;ps.rushAtt++;}
      if(play.type==="pass"||(play.type==="td"&&play.passer)){ps.rec++;ps.recYds+=play.yards;}
      if(play.type==="sack")ps.sack++;
      if(play.type==="int")ps.int++;
      if(play.td)ps.td++;
      if(play.passer&&play.passer.id!=="x"){
        const qside=livePoss;const qid=play.passer.id;
        if(!nst[qside][qid])nst[qside][qid]={name:play.passer.name,pos:"QB",passYds:0,rushYds:0,recYds:0,td:0,comp:0,att:0,rec:0,tkl:0,sack:0,int:0,rushAtt:0};
        nst[qside][qid].comp++;nst[qside][qid].att++;nst[qside][qid].passYds+=play.yards;
      }
      if(play.type==="inc"||play.type==="int"){
        const qside=livePoss;const qid=qb_id(offTeam);
        if(qid&&!nst[qside][qid])nst[qside][qid]={name:offTeam.roster.find(p=>p.id===qid)?.name||"QB",pos:"QB",passYds:0,rushYds:0,recYds:0,td:0,comp:0,att:0,rec:0,tkl:0,sack:0,int:0,rushAtt:0};
        if(qid&&nst[qside][qid])nst[qside][qid].att++;
      }
    }
    if(play.score)ns[livePoss]+=play.score;
    if(play.td||play.turnover||play.type==="punt"||play.type==="fg"||play.type==="fg_miss"){np=livePoss==="h"?"a":"h";ny=25;nd=1;ntg=10;}
    else if(nd>4){np=livePoss==="h"?"a":"h";ny=Math.max(5,100-ny);nd=1;ntg=10;}
    else ny=cl(ny,1,99);
    const nPlay=livePlay+1;
    if(nPlay%12===0)nq=Math.min(4,liveQtr+1);
    if(nPlay>=70||nq>4){
      let best=null,bestVal=0;
      for(const side of["h","a"])for(const[,ps]of Object.entries(nst[side]||{})){const val=(ps.passYds||0)+(ps.rushYds||0)+(ps.recYds||0)+(ps.td||0)*30+(ps.sack||0)*15+(ps.int||0)*25;if(val>bestVal){bestVal=val;best={...ps,side};}}
      setLivePOG(best);setLiveDone(true);
    }
    setLiveLog(nLog);setLiveStats(nst);setLiveScore(ns);setLiveYard(ny);setLivePoss(np);setLiveDown(nd);setLiveToGo(ntg);setLiveQtr(nq);setLivePlay(nPlay);setFourthChoice(null);
  }
  function qb_id(t){const qb=t.roster.filter(p=>p.pos==="QB"&&!p.injured).sort((a,b)=>b.ovr-a.ovr)[0];return qb?.id;}
  function startLiveSim(game){setLiveSim(game);setLiveLog([]);setLiveStats({h:{},a:{}});setLiveScore({h:0,a:0});setLiveQtr(1);setLiveYard(25);setLivePoss("h");setLiveDown(1);setLiveToGo(10);setLivePlay(0);setLiveDone(false);setLivePaused(false);setLivePOG(null);setLastLivePlay(null);setLiveAwaitingCall(false);setLivePhase(null);setLivePendingCall(null);setLiveQteBar(50);setLiveRecTargets([]);setTab("livesim");}

  function aiPick(){const picks=draftPicks;const idx=draftIdx;if(idx>=picks.length)return;const cur=picks[idx];const cls=dc[yr]||[];if(!cls.length)return;const bp=aiBestPick(teams[cur.owner].roster,cls);if(bp)makePick(bp);}
  function makePick(p){const picks=draftPicks;const idx=draftIdx;if(idx>=picks.length)return;const cur=picks[idx];const nt=[...teams];const np={...p,salary:Math.round((p.trueOvr/99)*Rf(1,5)*100)/100,contract:4,draftYr:yr,draftPk:cur.overall,ovr:p.trueOvr,pot:p.truePot,scoutLvl:2,ss:emptySS(p.pos),gl:[]};nt[cur.owner].roster.push(np);if(cur.owner===ui)nt[ui].gmRep=cl((nt[ui].gmRep||50)+1,0,100);setTeams(nt);const ndc={...dc};ndc[yr]=ndc[yr].filter(d=>d.id!==p.id);setDc(ndc);const entry=`Rd${cur.rd} #${cur.overall} ${TEAMS[cur.owner].ab}: ${np.name} (${np.pos}, ${np.trueOvr})`;setDraftLog(prev=>[...prev,{...cur,player:np,text:entry}]);setLog(prev=>[...prev,entry]);setDraftIdx(idx+1);setDraftTimer(120);if(idx+1>=picks.length){setDraftActive(false);sm("Draft complete!");setSp("freeagency");setTab("freeagency");setLog(pr=>{const myL=[...draftLog,{...cur,player:np,text:entry}].filter(d=>d.owner===ui);if(!myL.length)return pr;const grades=myL.map(d=>gradePick(d.player.trueOvr,d.overall));const avg=grades.filter(g=>['A+','A','B'].includes(g)).length/grades.length;const cls=avg>=.7?'A':avg>=.5?'B':avg>=.3?'C':'D';return[...pr,`📊 DRAFT GRADE: ${TEAMS[ui]?.ab} class — ${cls} | ${myL.map((d,i)=>`Rd${d.rd}:${grades[i]}`).join(' ')}`];});}}
  function simEntireDraft(){const cls=[...(dc[yr]||[])];const picks=[...draftPicks];const nt=teams.map(t=>({...t,roster:[...t.roster]}));const dl=[];for(let i=draftIdx;i<picks.length;i++){const cur=picks[i];if(!cls.length)break;const bp=cur.owner===ui?cls[0]:aiBestPick(nt[cur.owner].roster,cls);if(!bp)continue;const np={...bp,salary:Math.round((bp.trueOvr/99)*Rf(1,5)*100)/100,contract:4,draftYr:yr,draftPk:cur.overall,ovr:bp.trueOvr,pot:bp.truePot,scoutLvl:2,ss:emptySS(bp.pos),gl:[]};nt[cur.owner].roster.push(np);const ci=cls.findIndex(x=>x.id===bp.id);if(ci>=0)cls.splice(ci,1);dl.push({...cur,player:np,text:`Rd${cur.rd} #${cur.overall} ${TEAMS[cur.owner].ab}: ${np.name} (${np.pos}, ${np.trueOvr})`});}setTeams(nt);const ndc={...dc};ndc[yr]=cls;setDc(ndc);setDraftLog(prev=>[...prev,...dl]);setLog(prev=>[...prev,...dl.map(d=>d.text)]);setDraftIdx(picks.length);setDraftActive(false);sm("Draft simulated!");setSp("freeagency");setTab("freeagency");const myDL=dl.filter(d=>d.owner===ui);if(myDL.length){const grades=myDL.map(d=>gradePick(d.player.trueOvr,d.overall));const avg=grades.filter(g=>g!=='F').length/grades.length;const cls=avg>=.8?'A':avg>=.6?'B':avg>=.4?'C':'D';setLog(pr=>[...pr,`📊 DRAFT GRADE: ${TEAMS[ui]?.ab} class — ${cls} | ${myDL.map((d,i)=>`Rd${d.rd}:${grades[i]}`).join(' ')}`]);}}

  const startGame=i=>{const t=initTeams(i);const dcs={[2026]:genDC(2026),[2027]:genDC(2027),[2028]:genDC(2028)};const initPk=[];const shuffled=[...Array(32)].map((_,x)=>x).sort(()=>Math.random()-.5);for(let rd=1;rd<=7;rd++)shuffled.forEach((tid,idx)=>{initPk.push({id:uid(),rd,num:idx+1,overall:(rd-1)*32+idx+1,owner:tid,orig:tid,yr:2026});});const bm=genByeWeeks(t.map((_,x)=>x));setTeams(t);setUi(i);setByeMap(bm);setSched(genSched(t,bm));setFa(genFA());setDc(dcs);setYr(2026);setWk(0);setSp("preseason");setTab("roster");setPhase("main");setMyScout(genScout());setFaScouts(Array.from({length:5},genScout));setScPts(10);setFaCoaches([...Array.from({length:3},()=>genCoach("OC")),...Array.from({length:3},()=>genCoach("DC")),...Array.from({length:3},()=>genCoach("ST"))]);setDraftPicks(initPk);setDraftLog([]);setLog([`${t[i].city} ${t[i].name}: 2026.`]);setRivalry(null);setPreseasonGames([]);setWaivers([]);sm(`Welcome, GM!`);track('franchise_start');};
  const simWk=()=>{if(sp!=="regular")return;const nw=wk+1;const nt=[...teams];nt.forEach(t=>t.roster.forEach(p=>{p.holdout=false;}));// Cap violation check
nt.forEach((t,i)=>{if(capHit(t)>CAP_CEILING){t.deadCap=(t.deadCap||0)+5;if(i===ui){const pk3=draftPicks.find(pk=>pk.owner===ui&&pk.rd===3);if(pk3)setDraftPicks(pr=>pr.filter(p=>p.id!==pk3.id));setLog(l=>[`⚠️ CAP VIOLATION: ${t.city} over $${CAP_CEILING}M — $5M fine + ${pk3?'3rd-round pick forfeited':'no 3rd pick to forfeit'}`,...l.slice(0,149)]);}}});const ns=[...sched];let ur="";ns.filter(g=>g.wk===nw&&!g.played).forEach(g=>{const gi=ns.indexOf(g);const r=simGame(nt[g.h],nt[g.a],g.h===ui?gamePlan:{off:'balanced',def:'balanced'},g.a===ui?gamePlan:{off:'balanced',def:'balanced'});ns[gi]={...g,played:true,hs:r.hsc,as:r.asc,boxH:r.boxH,boxA:r.boxA};nt[g.h].pf+=r.hsc;nt[g.h].pa+=r.asc;nt[g.a].pf+=r.asc;nt[g.a].pa+=r.hsc;if(r.hsc>r.asc){nt[g.h].w++;nt[g.a].l++;}else if(r.asc>r.hsc){nt[g.a].w++;nt[g.h].l++;}else{nt[g.h].t++;nt[g.a].t++;}if(g.h===ui||g.a===ui){const ih=g.h===ui;const us=ih?r.hsc:r.asc;const them=ih?r.asc:r.hsc;const opp=ih?nt[g.a]:nt[g.h];ur=`Wk${nw}: ${us>them?"W":"L"} ${us}-${them} vs ${opp.ab}`;const won=us>them;const tie=us===them;const nStr=won?Math.max(0,nt[ui].streak||0)+1:tie?0:Math.min(0,nt[ui].streak||0)-1;nt[ui].streak=nStr;const sB=Math.abs(nStr)>=3?2:0;nt[ui].morale=cl((nt[ui].morale||50)+(won?4+sB:tie?0:-(4+sB)),0,100);nt[ui].gmRep=cl((nt[ui].gmRep||50)+(won?1:0),0,100);}});nt.forEach(t=>t.roster.forEach(p=>{if(p.injured){const recWks=p.injRecWks||(wk-p.injWk>=3?3:0);if(recWks>0&&nw-p.injWk+(p.injRecWks?p.injRecWks:0)>=recWks){p.injured=false;p.injWk=0;p.injType="";p.injSev="";p.injRecWks=0;}else{p.injWk=Math.max(0,(p.injWk||1)-1);if(p.injWk<=0){p.injured=false;p.injWk=0;p.injType="";p.injSev="";p.injRecWks=0;}}}}));// MAJOR INJURY IR placement
const moraleEvLogs=[];nt.forEach(t=>t.roster.forEach(p=>{if(p.injured&&p.injSev==="major"&&!(t.ir||[]).find(r=>r.id===p.id)){if((t.ir||[]).length<8){const irWk=nw;t.ir=[...(t.ir||[]),{...p,irWk,irMin:6}];t.roster=t.roster.filter(r=>r.id!==p.id);moraleEvLogs.push(`🚑 MAJOR INJURY: ${p.name} placed on IR (${p.injType})`);}}}));nt.forEach(t=>t.roster.forEach(p=>{p.av=calcAV(p);}));const repB=(nt[ui].gmRep||50)>=90?2:(nt[ui].gmRep||50)>=60?1:0;const lkrEv=Math.random()<0.15?LKR_EVENTS[R(0,LKR_EVENTS.length-1)]:null;if(lkrEv){nt[ui].morale=cl((nt[ui].morale||50)+lkrEv.mrl,0,100);nt[ui].roster.forEach(p=>{if(lkrEv.confP>0&&Math.random()<0.4)p.conf=cl((p.conf||60)+lkrEv.confP,0,100);if(lkrEv.confN<0&&Math.random()<0.35)p.conf=cl((p.conf||60)+lkrEv.confN,0,100);});}// MOVE A: Player Morale Events
nt.forEach((t,ti)=>{// Trade Request
const trReq=t.roster.find(p=>p.ovr>=80&&(p.conf||50)<35);if(trReq&&Math.random()<0.05){trReq.conf=Math.max(0,(trReq.conf||50)-15);t.morale=cl((t.morale||50)-5,0,100);moraleEvLogs.push(`🔁 TRADE REQUEST: ${trReq.name} (${trReq.pos}, OVR ${trReq.ovr}) wants out of ${t.city}`);}// Holdout
const holdout=t.roster.find(p=>p.contract===1&&p.ovr>=75);if(holdout&&Math.random()<0.04){holdout.conf=Math.max(0,(holdout.conf||50)-12);holdout.holdout=true;t.morale=cl((t.morale||50)-4,0,100);moraleEvLogs.push(`✋ HOLDOUT: ${holdout.name} (${holdout.pos}) in contract year — skipping practice`);}// Leadership Boost
const leader=t.roster.find(p=>p.ovr>=85&&(p.conf||50)>65);if(leader&&Math.random()<0.07){t.morale=cl((t.morale||50)+6,0,100);t.roster.forEach(p=>{if(p.ovr>=75)p.conf=Math.min(100,(p.conf||50)+5);});moraleEvLogs.push(`⭐ LEADERSHIP: ${leader.name} rallies ${t.city} ${t.name}`);}});// MOVE 9: FA mid-season refresh
const midSeasonFAs=[];nt.forEach((t,i)=>{if(i===ui)return;t.roster.filter(p=>p.injured&&p.ovr>=70).forEach(p=>{if(Math.random()<0.2){const nf={...p,salary:+(Math.round((p.ovr/99)*Rf(1,6)*100)/100)};midSeasonFAs.push(nf);t.roster=t.roster.filter(r=>r.id!==p.id);t.deadCap=(t.deadCap||0)+Math.round((p.salary||0)*0.5*10)/10;}});});if(midSeasonFAs.length)setFa(pr=>[...midSeasonFAs,...pr]);
// MOVE 10 rivalry record update
if(rivalry){ns.filter(g=>g.wk===nw&&g.played&&(g.h===ui||g.a===ui)).forEach(g=>{const oppId=g.h===ui?g.a:g.h;if(oppId===rivalry.teamId){const won=(g.h===ui&&g.hs>g.as)||(g.a===ui&&g.as>g.hs);setRivalry(r=>({...r,wins:won?r.wins+1:r.wins,losses:won?r.losses:r.losses+1}));const morBonus=won?5:-5;nt[ui].morale=cl((nt[ui].morale||50)+morBonus,0,100);if(won)nt[ui].gmRep=cl((nt[ui].gmRep||50)+2,0,100);setLog(l=>[`${won?'🔥 RIVALRY WIN':'💀 RIVALRY LOSS'} vs ${nt[rivalry.teamId]?.name} — morale ${won?'+5':'-5'}${won?', gmRep +2':''}`,...l.slice(0,149)]);}});}
if(nw>=12){nt.forEach((t,i)=>{if(i===ui)return;if(t.w<=3&&Math.random()<0.25){const roles=["oc","dc"];const role=roles[R(0,1)];const fired=t.coach?.[role];if(fired){const newC=genCoach(role.toUpperCase());t.coach={...t.coach,[role]:newC};setLog(l=>[`🔥 HOT SEAT: ${t.city} ${t.name} fires ${fired.name} (${role.toUpperCase()}) — ${newC.name} hired`,...l.slice(0,149)]);}}})}
// WAIVER WIRE PROCESSING
const cpuTeamsByRec=[...Array(nt.length).keys()].filter(i=>i!==ui).sort((a,b)=>nt[a].w-nt[b].w);const claimed=new Set();const wvLogs=[];waivers.forEach(wp=>{cpuTeamsByRec.forEach(ti=>{if(claimed.has(wp.id))return;const starters=nt[ti].roster.filter(p=>p.pos===wp.pos).length;if(starters<(DC_S[wp.pos]||2)&&Math.random()<0.6){nt[ti].roster.push({...wp,salary:+(Math.round((wp.ovr/99)*Rf(1,5)*100)/100),contract:1});claimed.add(wp.id);wvLogs.push(`🔄 ${nt[ti].ab||TEAMS[ti].ab} claimed ${wp.name} (${wp.pos}) off waivers`);}});});const unclaimed=waivers.filter(p=>!claimed.has(p.id));setFa(pr=>[...unclaimed,...pr]);setWaivers([]);if(wvLogs.length)setLog(l=>[...wvLogs,...l.slice(0,150-wvLogs.length)]);
setScPts(pr=>pr+2+repB);setTeams(nt);setSched(ns);setWk(nw);if(moraleEvLogs.length)setLog(l=>[...moraleEvLogs,...l.slice(0,150-moraleEvLogs.length)]);if(ur){setLog(p=>[...p,ur,...(lkrEv?[`🎭 ${lkrEv.txt}`]:[])]);sm(ur);}else if(lkrEv)setLog(p=>[...p,`🎭 ${lkrEv.txt}`]);if(!trProp&&nw<=10&&Math.random()<(nw>=8?0.44:0.22)){const off=genTradeOffer(nt,ui,draftPicks);if(off)setTrProp(off);}if(nw>=18){setSp("playoffs");const seedConf=(conf)=>{const ct=nt.filter(t=>TEAMS[t.id]?.c===conf);const divs={};ct.forEach(t=>{const dk=TEAMS[t.id]?.d||'X';(divs[dk]||(divs[dk]=[])).push(t);});Object.values(divs).forEach(d=>d.sort((a,b)=>b.w-a.w||(b.pf-b.pa)-(a.pf-a.pa)));const dw=Object.values(divs).map(d=>d[0]).sort((a,b)=>b.w-a.w||(b.pf-b.pa)-(a.pf-a.pa));const wc=ct.filter(t=>!dw.find(d=>d.id===t.id)).sort((a,b)=>b.w-a.w||(b.pf-b.pa)-(a.pf-a.pa)).slice(0,4-dw.length);return[...dw,...wc].slice(0,4).map(t=>t.id);};const af=seedConf('AFC'),nf=seedConf('NFC');setPb({rd:1,m:[[af[0],af[3]],[af[1],af[2]],[nf[0],nf[3]],[nf[1],nf[2]]],res:[],ch:null});setTab("playoffs");}};
  const simAll=()=>{if(sp!=="regular")return;let cw=wk;const nt=teams.map(t=>({...t,roster:t.roster.map(p=>({...p,ss:{...p.ss},gl:[...p.gl]}))}));const ns=[...sched];const rl=[];while(cw<18){cw++;ns.filter(g=>g.wk===cw&&!g.played).forEach(g=>{const gi=ns.indexOf(g);const r=simGame(nt[g.h],nt[g.a],g.h===ui?gamePlan:{off:'balanced',def:'balanced'},g.a===ui?gamePlan:{off:'balanced',def:'balanced'});ns[gi]={...g,played:true,hs:r.hsc,as:r.asc,boxH:r.boxH,boxA:r.boxA};nt[g.h].pf+=r.hsc;nt[g.h].pa+=r.asc;nt[g.a].pf+=r.asc;nt[g.a].pa+=r.hsc;if(r.hsc>r.asc){nt[g.h].w++;nt[g.a].l++;}else if(r.asc>r.hsc){nt[g.a].w++;nt[g.h].l++;}else{nt[g.h].t++;nt[g.a].t++;}if(g.h===ui||g.a===ui){const ih=g.h===ui;const us=ih?r.hsc:r.asc;const them=ih?r.asc:r.hsc;const opp=ih?nt[g.a]:nt[g.h];rl.push(`${us>them?"W":"L"} ${us}-${them} vs ${opp.ab}`);const won=us>them;const tie=us===them;const nStr=won?Math.max(0,nt[ui].streak||0)+1:tie?0:Math.min(0,nt[ui].streak||0)-1;nt[ui].streak=nStr;const sB=Math.abs(nStr)>=3?2:0;nt[ui].morale=cl((nt[ui].morale||50)+(won?4+sB:tie?0:-(4+sB)),0,100);}});nt.forEach(t=>t.roster.forEach(p=>{if(p.injured){p.injWk--;if(p.injWk<=0){p.injured=false;p.injWk=0;p.injType="";}}}));}nt.forEach(t=>t.roster.forEach(p=>{p.av=calcAV(p);}));setScPts(pr=>pr+(18-wk)*2);setTeams(nt);setSched(ns);setWk(18);setLog(p=>[...p,...rl]);setSp("playoffs");track('season_simmed');const seedConf2=(conf)=>{const ct=nt.filter(t=>TEAMS[t.id]?.c===conf);const divs={};ct.forEach(t=>{const dk=TEAMS[t.id]?.d||'X';(divs[dk]||(divs[dk]=[])).push(t);});Object.values(divs).forEach(d=>d.sort((a,b)=>b.w-a.w||(b.pf-b.pa)-(a.pf-a.pa)));const dw=Object.values(divs).map(d=>d[0]).sort((a,b)=>b.w-a.w||(b.pf-b.pa)-(a.pf-a.pa));const wc=ct.filter(t=>!dw.find(d=>d.id===t.id)).sort((a,b)=>b.w-a.w||(b.pf-b.pa)-(a.pf-a.pa)).slice(0,4-dw.length);return[...dw,...wc].slice(0,4).map(t=>t.id);};const af2=seedConf2('AFC'),nf2=seedConf2('NFC');setPb({rd:1,m:[[af2[0],af2[3]],[af2[1],af2[2]],[nf2[0],nf2[3]],[nf2[1],nf2[2]]],res:[],ch:null});setTab("playoffs");sm("Season complete!");};
  const simPR=()=>{if(!pb||pb.ch!=null)return;const nt=[...teams];const w=[];const rr=[];pb.m.forEach(([a,b])=>{const r=simGame(nt[a],nt[b]);const wi=r.hsc>=r.asc?a:b;w.push(wi);rr.push({h:a,a:b,hs:r.hsc,as:r.asc,w:wi});});setTeams(nt);const ar=[...pb.res,...rr];if(w.length===1){setPb({...pb,res:ar,ch:w[0]});setLog(p=>[...p,`🏆 ${yr}: ${nt[w[0]].city} ${nt[w[0]].name} win!`]);setChamps(p=>[...p,{yr,t:`${nt[w[0]].city} ${nt[w[0]].name}`}]);sm(`🏆 Champions!`);}else{const nm=[];for(let i=0;i<w.length;i+=2)nm.push([w[i],w[i+1]]);setPb({rd:pb.rd+1,m:nm,res:ar,ch:null});}};
  const goToCombine=()=>{const ndc={...dc};const cls=ndc[yr]||[];cls.forEach(p=>{p.combine=genCombine(p.pos,p.trueOvr);p.proDay=genProDay(p.pos,p.trueOvr);const ph=combToPhys(p.combine);Object.assign(p,ph);});ndc[yr]=[...cls];setDc(ndc);setSp("combine");setTab("draft");sm("Combine complete!");};
  const startDraft=()=>{const order=[...teams].sort((a,b)=>a.w-b.w||(a.pf-a.pa)-(b.pf-b.pa)).map(t=>t.id);const newPicks=[];const oldPicks=draftPicks.filter(pk=>pk.yr===yr);for(let rd=1;rd<=7;rd++)order.forEach((origTid,idx)=>{const overall=(rd-1)*32+idx+1;const traded=oldPicks.find(pk=>pk.orig===origTid&&pk.rd===rd);const owner=traded?traded.owner:origTid;newPicks.push({id:uid(),rd,num:idx+1,overall,owner,orig:origTid,yr});});setDraftPicks(newPicks);setDraftIdx(0);setDraftLog([]);setDraftTimer(120);setDraftActive(true);setDraftPaused(false);setSp("draft");setTab("draft");sm("Draft has begun!");track('draft_started');};
  const newSeason=()=>{const draftOrder=[...teams].sort((a,b)=>a.w-b.w||(a.pf-a.pa)-(b.pf-b.pa)).map(t=>t.id);let nt=teams.map(t=>({...t,roster:t.roster.map(p=>{const cs={...(p.cs||{})};for(const[k,v]of Object.entries(p.ss||{}))if(typeof v==="number")cs[k]=(cs[k]||0)+v;let no=p.ovr;if(p.age<27)no=cl(p.ovr+R(-1,Math.round((p.pot-p.ovr)/4)+2),30,99);else if(p.age>30)no=cl(p.ovr-R(1,p.age>34?5:3),30,99);else no=cl(p.ovr+R(-2,2),30,99);
// MOVE 2: extra aging decline
if(p.age+1>=34&&Math.random()<0.30){no=Math.max(no-1,40);}
else if(p.age+1>=30&&Math.random()<0.15){no=Math.max(no-1,40);}
// MOVE 8: breakout seasons
if(p.age<=24&&p.devG==='star'&&Math.random()<0.12){no=Math.min(no+3,99);}
else if(p.age<=24&&p.devG==='normal'&&Math.random()<0.05){no=Math.min(no+2,99);}
return{...p,age:p.age+1,contract:p.contract-1,ovr:no,trueOvr:no,injured:false,injWk:0,injType:"",injSev:"",injRecWks:0,cs,ss:emptySS(p.pos),gl:[],av:0,tradeVal:no+Math.round((p.pot-no)*.5)-((p.age+1)>30?((p.age+1)-30)*3:0),devG:no-p.ovr};}).filter(p=>!(p.age>37&&Math.random()<.6)&&!(p.age>34&&p.ovr<38)&&p.contract>0),ps:[],ir:[],w:0,l:0,t:0,pf:0,pa:0,morale:50,streak:0,gmRep:t.gmRep||50,deadCap:0}));nt.forEach(t=>{t.ps=(t.ps||[]).map(p=>{const no=cl(p.ovr+R(-1,1),30,99);return{...p,age:p.age+1,contract:p.contract-1,ovr:no,trueOvr:no,ss:emptySS(p.pos),gl:[],av:0};}).filter(p=>p.contract>0&&p.age<=27);});
const rm={QB:2,RB:3,WR:4,TE:2,LT:1,LG:1,C:1,RG:1,RT:1,DL:5,LB:4,CB:3,S:2,K:1};nt.forEach(t=>{POS.forEach(pos=>{const have=t.roster.filter(p=>p.pos===pos).length;const need=(rm[pos]||2)-have;for(let i=0;i<Math.max(0,need);i++)t.roster.push(genPlayer(pos,R(21,25)));});});const ns=yr+1;const ndc={...dc};delete ndc[yr];if(!ndc[ns+2])ndc[ns+2]=genDC(ns+2);const expFAs=[];teams.forEach(t=>t.roster.forEach(p=>{if(p.contract===1&&p.age<=33&&p.ovr>=42){const no=cl(p.ovr+R(-1,1),30,99);expFAs.push({...p,age:p.age+1,contract:0,salary:0,ovr:no,trueOvr:no,ss:emptySS(p.pos),gl:[],av:0,tradeVal:no});}}));// MOVE 7: AI cap management
nt.forEach((t,i)=>{if(i===ui)return;while(capSpace(t)<20&&t.roster.length>30){const worst=t.roster.filter(p=>p.contract<=1).sort((a,b)=>a.ovr-b.ovr)[0];if(!worst)break;t.deadCap=(t.deadCap||0)+Math.round(worst.salary*0.5*10)/10;t.roster=t.roster.filter(p=>p.id!==worst.id);}});
// Coach contract expiry
const expiredLogs=[];const expiredCoaches=[];nt.forEach((t,i)=>{['oc','dc','st'].forEach(role=>{const c=t.coach?.[role];if(!c)return;c.contract=Math.max(0,(c.contract||2)-1);if(c.contract<=0){if(i===ui)expiredLogs.push(`📋 CONTRACT EXPIRED: ${c.name} (${role.toUpperCase()}) — now a free agent`);expiredCoaches.push({...c,contract:R(1,2)});t.coach={...t.coach,[role]:null};}});});if(expiredCoaches.length)setFaCoaches(pr=>[...pr,...expiredCoaches]);if(expiredLogs.length)setLog(l=>[...expiredLogs,...l.slice(0,149)]);
const aiSigned=new Set();nt.forEach((t,idx)=>{if(idx===ui)return;POS.forEach(pos=>{const have=t.roster.filter(p=>p.pos===pos).length;const need=(rm[pos]||2)-have;for(let s=0;s<Math.max(0,need);s++){const top=expFAs.find(f=>f.pos===pos&&!aiSigned.has(f.id));if(!top)break;aiSigned.add(top.id);t.roster.push({...top,salary:+(top.ovr/99*Rf(2,8)).toFixed(1),contract:R(1,3),ss:emptySS(top.pos),gl:[],av:0});}});});const filteredExpFAs=expFAs.filter(f=>!aiSigned.has(f.id));const devL=[];nt[ui].roster.forEach(p=>{const old=teams[ui].roster.find(r=>r.id===p.id);if(!old)return;const diff=p.ovr-old.ovr;if(diff>=3)devL.push(`📈 ${p.name} +${diff}→${p.ovr}`);else if(diff<=-2)devL.push(`📉 ${p.name} ${diff}→${p.ovr}`);});const bm=genByeWeeks(nt.map((_,x)=>x));setYr(ns);setWk(0);setTeams(nt);setByeMap(bm);setSched(genSched(nt,bm));setFa([...filteredExpFAs,...genFA()]);setDc(ndc);const nextPk=[];for(let rd=1;rd<=7;rd++)draftOrder.forEach((tid,idx)=>{nextPk.push({id:uid(),rd,num:idx+1,overall:(rd-1)*32+idx+1,owner:tid,orig:tid,yr:ns});});setSp("preseason");setPb(null);setFtag(null);setPreseasonGames([]);setTab("roster");setScPts(pr=>pr+5);setFaCoaches([...Array.from({length:3},()=>genCoach("OC")),...Array.from({length:3},()=>genCoach("DC")),...Array.from({length:3},()=>genCoach("ST"))]);setDraftPicks(nextPk);setDraftLog([]);setDraftIdx(0);setDraftActive(false);setWaivers([]);const allSS=[];teams.forEach((t,tid)=>t.roster.forEach(p=>{if(p.ss&&p.ss.gp>0)allSS.push({...p,tmAb:TEAMS[tid].ab});}));const qbs=allSS.filter(p=>p.pos==='QB');const mvpScr=p=>qbRate(p.ss.comp||0,p.ss.att||0,p.ss.passYds||0,p.ss.passTD||0,p.ss.passInt||0);const mvp=[...qbs].sort((a,b)=>mvpScr(b)-mvpScr(a))[0];const offSk=allSS.filter(p=>['RB','WR','TE'].includes(p.pos));const oScr=p=>(p.ss.rushYds||0)+(p.ss.recYds||0)+((p.ss.rushTD||0)+(p.ss.recTD||0))*20;const opoy=[...offSk].sort((a,b)=>oScr(b)-oScr(a))[0];const defSk=allSS.filter(p=>['DL','LB','CB','S'].includes(p.pos));const dScr=p=>(p.ss.sacks||0)*15+(p.ss.tkl||0)+(p.ss.ints||0)*10+(p.ss.pd||0)*3;const dpoy=[...defSk].sort((a,b)=>dScr(b)-dScr(a))[0];const awardL=[];if(mvp)awardL.push(`🏆 MVP: ${mvp.name} (QB, ${mvp.tmAb}) — ${mvp.ss.passYds||0} yds ${mvp.ss.passTD||0} TD RTG ${mvpScr(mvp)}`);if(opoy)awardL.push(`⚡ OPOY: ${opoy.name} (${opoy.pos}, ${opoy.tmAb}) — ${(opoy.ss.rushYds||0)+(opoy.ss.recYds||0)} yds ${(opoy.ss.rushTD||0)+(opoy.ss.recTD||0)} TD`);if(dpoy)awardL.push(`🛡️ DPOY: ${dpoy.name} (${dpoy.pos}, ${dpoy.tmAb}) — ${dpoy.ss.sacks||0} sacks ${dpoy.ss.tkl||0} tkl ${dpoy.ss.ints||0} INT`);setLog(p=>[...p,...awardL,`--- ${ns} Season ---`,...(devL.length?[`Dev: ${devL.slice(0,6).join(' | ')}`]:[]),...(filteredExpFAs.filter(p=>p.tradeVal>=55).length?[`${filteredExpFAs.filter(p=>p.tradeVal>=55).length} notable FA(s) hit market`]:[])]);sm(`${ns} season!`);};
  const startSeason=()=>{setSp("regular");setWk(0);setTab("roster");sm("Season begins!");};
  const signP=p=>{const nt=[...teams];const sal=Math.round((p.ovr/99)*Rf(2,10)*100)/100;if(capSpace(nt[ui])<sal){sm("Not enough cap space!");return;}const np={...p,salary:sal,contract:R(1,3),ss:emptySS(p.pos),gl:[],scoutLvl:2};nt[ui].roster.push(np);if(p.ovr>=75)nt[ui].morale=cl((nt[ui].morale||50)+3,0,100);setTeams(nt);setFa(pr=>pr.filter(f=>f.id!==p.id));sm(`Signed ${np.name} — $${sal}M/yr`);};
  const releaseP=pid=>{const nt=[...teams];const idx=nt[ui].roster.findIndex(p=>p.id===pid);if(idx<0)return;const p=nt[ui].roster[idx];const dead=+(p.salary*(p.contract>1?0.5:0)).toFixed(1);nt[ui].roster.splice(idx,1);nt[ui].deadCap=(nt[ui].deadCap||0)+dead;setTeams(nt);if(sp==='regular'){setWaivers(pr=>[{...p,contract:0,waiverWk:wk},...pr]);setSel(null);sm(`Released ${p.name} → WAIVERS (wk ${wk})${dead>0?` — $${dead}M dead cap`:""}`);setLog(l=>[`Released ${p.name} → WAIVERS (wk ${wk})`,...l.slice(0,149)]);}else{setFa(pr=>[{...p,contract:0},...pr]);setSel(null);sm(`Released ${p.name}${dead>0?` — $${dead}M dead cap`:""}`);}};;
  const moveToPracticeSquad=pid=>{const nt=[...teams];const idx=nt[ui].roster.findIndex(p=>p.id===pid);if(idx<0)return;if((nt[ui].ps||[]).length>=10){sm("Practice squad full (10/10)!");return;}const[p]=nt[ui].roster.splice(idx,1);nt[ui].ps=[...(nt[ui].ps||[]),{...p,salary:0}];setTeams(nt);setSel(null);sm(`${p.name} → Practice Squad`);};
  const promoteFromPS=pid=>{const nt=[...teams];const psi=(nt[ui].ps||[]).findIndex(p=>p.id===pid);if(psi<0)return;const[p]=nt[ui].ps.splice(psi,1);const sal=+(Math.round((p.ovr/99)*Rf(0.5,2)*100)/100);nt[ui].roster.push({...p,salary:sal});setTeams(nt);sm(`${p.name} promoted to roster ($${sal}M)`);};
  const releasePSPlayer=pid=>{const nt=[...teams];nt[ui].ps=(nt[ui].ps||[]).filter(p=>p.id!==pid);const rel=teams[ui].ps?.find(p=>p.id===pid);setTeams(nt);if(rel)setFa(pr=>[{...rel,contract:0},...pr]);sm("Released from PS");};
  const moveToIR=pid=>{const nt=[...teams];const idx=nt[ui].roster.findIndex(p=>p.id===pid);if(idx<0)return;if(!nt[ui].roster[idx].injured){sm("Only injured players can be placed on IR!");return;}if((nt[ui].ir||[]).length>=8){sm("IR full (8/8)!");return;}const[p]=nt[ui].roster.splice(idx,1);nt[ui].ir=[...(nt[ui].ir||[]),{...p,irWk:wk,irMin:8}];setTeams(nt);setSel(null);sm(`${p.name} → IR (8-wk minimum)`);};
  const activateFromIR=pid=>{const nt=[...teams];const p=(nt[ui].ir||[]).find(r=>r.id===pid);if(!p)return;const wksElapsed=(wk-(p.irWk||0));if(wksElapsed<(p.irMin||8)){sm(`IR minimum not met — ${(p.irMin||8)-wksElapsed} wk(s) remaining`);return;}nt[ui].ir=(nt[ui].ir||[]).filter(r=>r.id!==pid);nt[ui].roster.push({...p,injured:false,injWk:0,injType:""});setTeams(nt);sm(`${p.name} activated from IR`);};
  const restructureP=pid=>{const nt=[...teams];const p=nt[ui].roster.find(r=>r.id===pid);if(!p){sm("Player not found");return;}if(p.ovr<80){sm("Restructure only available for 80+ OVR players");return;}if(p.contract<2){sm("Player must have 2+ years remaining");return;}if(p.restructured){sm("Already restructured this contract");return;}const bonus=+(p.salary*0.4).toFixed(1);p.salary=+(p.salary-bonus).toFixed(1);nt[ui].deadCap=+((nt[ui].deadCap||0)+bonus).toFixed(1);p.restructured=true;setTeams(nt);setSel(pr=>pr?.id===pid?{...p}:pr);sm(`Restructured ${p.name} — $${bonus}M bonus → dead cap, salary now $${p.salary}M`);};;;
  const extendContract=(pid,addYrs)=>{if(sp!=="regular")return sm("Only available during regular season");if(scPts<1)return sm("Need 1 Scout Pt to extend");const nt=[...teams];const p=nt[ui].roster.find(r=>r.id===pid);if(!p||p.contract<1)return sm("Player not found or no contract");p.contract=p.contract+addYrs;setTeams(nt);setScPts(pr=>pr-1);setSel(pr=>pr?.id===pid?{...p}:pr);sm(`Extended ${p.name} contract +${addYrs}yr`);};
  const acceptTrade=()=>{if(!trProp)return;if(wk>=10&&sp==='regular'){sm("Trade deadline passed!");setTrProp(null);return;}const nt=[...teams];const np=[...draftPicks];if(trProp.give){const gi=nt[trProp.fromTm].roster.findIndex(p=>p.id===trProp.give.id);if(gi>=0){const[gp]=nt[trProp.fromTm].roster.splice(gi,1);nt[ui].roster.push({...gp,ss:emptySS(gp.pos),gl:[],av:0});}}const wi=nt[ui].roster.findIndex(p=>p.id===trProp.want.id);if(wi>=0){const[wp]=nt[ui].roster.splice(wi,1);nt[trProp.fromTm].roster.push(wp);}(trProp.givePicks||[]).forEach(pk=>{const i=np.findIndex(x=>x.id===pk.id);if(i>=0)np[i]={...np[i],owner:ui};});(trProp.wantPicks||[]).forEach(pk=>{const i=np.findIndex(x=>x.id===pk.id);if(i>=0)np[i]={...np[i],owner:trProp.fromTm};});nt[ui].morale=cl((nt[ui].morale||50)+2,0,100);nt[ui].gmRep=cl((nt[ui].gmRep||50)+1,0,100);setTeams(nt);setDraftPicks(np);const gStr=trProp.give?`${trProp.give.name} (${trProp.give.pos} ${trProp.give.ovr})`:'';const pkStr=(trProp.givePicks||[]).map(pk=>`R${pk.rd}#${pk.overall}`).join('+');setLog(pr=>[...pr,`Trade: Got ${[gStr,pkStr].filter(Boolean).join('+')} from ${TEAMS[trProp.fromTm].ab}`]);sm(`Trade done!`);setTrProp(null);setSel(null);};;
  const scoutPlayer=(pid,classYr)=>{if(scPts<3){sm("Need 3 pts!");return;}if(!myScout){sm("Hire a scout!");return;}const ndc={...dc};const cls=ndc[classYr];if(!cls)return;const pi=cls.findIndex(p=>p.id===pid);if(pi<0)return;const p={...cls[pi]};const accB=(myScout.accuracy-50)/200;if(p.scoutLvl<2){p.scoutLvl=Math.min(2,p.scoutLvl+1);if(p.scoutLvl===1){p.scoutedOvr=cl(Math.round(p.trueOvr+R(-8,8)*(1-accB)),30,99);p.scoutedPot=cl(Math.round(p.truePot+R(-6,6)*(1-accB)),30,99);}else{p.scoutedOvr=cl(Math.round(p.trueOvr+R(-3,3)*(1-accB)),30,99);p.scoutedPot=cl(Math.round(p.truePot+R(-2,2)*(1-accB)),30,99);}}ndc[classYr]=[...cls.slice(0,pi),p,...cls.slice(pi+1)];setDc(ndc);setScPts(pr=>pr-3);sm(`Scouted ${p.name}`);};
  const evalTr=()=>{const gPv=trOff.g.reduce((s,p)=>s+p.tradeVal,0);const rPv=trOff.r.reduce((s,p)=>s+p.tradeVal,0);const gDv=trOff.gPk.reduce((s,pk)=>s+(PICK_VAL[pk.overall]||1)/50,0);const rDv=trOff.rPk.reduce((s,pk)=>s+(PICK_VAL[pk.overall]||1)/50,0);const gv=Math.round(gPv+gDv);const rv=Math.round(rPv+rDv);return{gv,rv,fair:Math.abs(gv-rv)<=18,d:rv-gv};};
  const execTr=()=>{if(wk>=10&&sp==='regular'){sm("Trade deadline passed — Week 10!");return;}if((!trOff.g.length&&!trOff.gPk.length)||(!trOff.r.length&&!trOff.rPk.length)||trTm==null)return;const ev=evalTr();if(!ev.fair&&ev.d<0){sm("Trade rejected!");return;}const nt=[...teams];const np=[...draftPicks];trOff.g.forEach(p=>{const i=nt[ui].roster.findIndex(r=>r.id===p.id);if(i>=0){const[rm]=nt[ui].roster.splice(i,1);nt[trTm].roster.push(rm);}});trOff.r.forEach(p=>{const i=nt[trTm].roster.findIndex(r=>r.id===p.id);if(i>=0){const[rm]=nt[trTm].roster.splice(i,1);nt[ui].roster.push(rm);}});trOff.gPk.forEach(pk=>{const i=np.findIndex(x=>x.id===pk.id);if(i>=0)np[i]={...np[i],owner:trTm};});trOff.rPk.forEach(pk=>{const i=np.findIndex(x=>x.id===pk.id);if(i>=0)np[i]={...np[i],owner:ui};});setTeams(nt);setDraftPicks(np);setLog(p=>[...p,`Trade with ${TEAMS[trTm].ab}`]);sm("Trade completed!");setTrOff({g:[],r:[],gPk:[],rPk:[]});};
  const hireCoach=(coach)=>{const nt=[...teams];if(capSpace(nt[ui])<coach.salary){sm("Not enough cap space!");return;}const cur=nt[ui].coach?.[coach.role.toLowerCase()];const newCoach={...coach};nt[ui]={...nt[ui],coach:{...nt[ui].coach,[coach.role.toLowerCase()]:newCoach}};if(cur)setFaCoaches(pr=>[...pr.filter(c=>c.id!==coach.id),cur]);else setFaCoaches(pr=>pr.filter(c=>c.id!==coach.id));setTeams(nt);sm(`Hired ${coach.name} (${coach.role}) — $${coach.salary}M`);};
  const fireCoach=(role)=>{const nt=[...teams];const fired=nt[ui].coach?.[role.toLowerCase()];if(!fired)return;nt[ui]={...nt[ui],coach:{...nt[ui].coach,[role.toLowerCase()]:null}};nt[ui].deadCap=+((nt[ui].deadCap||0)+(fired.salary*0.5)).toFixed(1);setFaCoaches(pr=>[...pr,fired]);setTeams(nt);sm(`Fired ${fired.name}`);};
  const upgradeCoach=(role)=>{const nt=[...teams];const c=nt[ui].coach?.[role.toLowerCase()];if(!c||c.rating>=95)return sm("Cannot upgrade further");if(scPts<2)return sm("Need 2 SP to upgrade coach");c.rating=Math.min(95,c.rating+5);setTeams(nt);setScPts(p=>p-2);sm(`Upgraded ${c.name} — RTG ${c.rating}`);setLog(l=>[`📈 Upgraded ${c.name} (${role}) → RTG ${c.rating}`,...l.slice(0,149)]);};
  const reSignCoach=(role)=>{if(scPts<1)return sm("Need 1 SP");const nt=[...teams];const c=nt[ui].coach?.[role.toLowerCase()];if(!c)return;c.contract=(c.contract||1)+2;setTeams(nt);setScPts(p=>p-1);sm(`Re-signed ${c.name} +2yr`);};
  const selectCall=id=>{setLivePendingCall(id);setLivePhase("presnap");};
  const hikeSnap=()=>{
    const offT=livePoss==="h"?teams[liveSim.h]:teams[liveSim.a];
    const defT=livePoss==="h"?teams[liveSim.a]:teams[liveSim.h];
    const isPass=livePendingCall?.startsWith("pass_");
    if(isPass){
      const wrs=offT.roster.filter(p=>p.pos==="WR"&&!p.injured).sort((a,b)=>b.ovr-a.ovr).slice(0,2);
      const te=offT.roster.find(p=>p.pos==="TE"&&!p.injured);
      const rb=offT.roster.find(p=>p.pos==="RB"&&!p.injured);
      const dbs=defT.roster.filter(p=>["CB","S"].includes(p.pos)&&!p.injured).sort((a,b)=>b.ovr-a.ovr);
      const tgts=[...wrs,te,rb].filter(Boolean).slice(0,4).map((p,i)=>{const cb=dbs[i]||dbs[0]||{name:"CB",ovr:55};const open=(p.spd||70)>(cb.ovr||55)&&Math.random()<0.55+((p.spd||70)-(cb.ovr||55))/200;return{...p,num:i+1,open,cbName:cb.name,cbOvr:cb.ovr};});
      setLiveRecTargets(tgts);setLivePhase("passing");
    }else{setLiveQteBar(50);liveQteDirRef.current=1;setLivePhase("running");}
  };
  const resolveQte=(bonus)=>{setLivePhase(null);setLiveRecTargets([]);advanceLivePlay(livePendingCall,bonus);setLivePendingCall(null);};
  const throwTo=t=>{resolveQte(t.open?1.2+Math.random()*0.2:0.45+Math.random()*0.15);};
  const hitQteBar=()=>{const v=liveQteBar;const bonus=v>=42&&v<=58?1.4:v>=28&&v<=72?1.1:0.65;resolveQte(bonus);};
  // ═══ P5: GM ↔ PLAY BRIDGE ═══
  const exportGameToPlay=(game)=>{const oppId=game.h===ui?game.a:game.h;const opp=teams[oppId];const ut=teams[ui];const fmt=t=>({name:`${t.city} ${t.name}`,ab:t.ab,clr:t.clr,ac:t.ac,ocScheme:t.coach?.oc?.scheme||null,dcScheme:t.coach?.dc?.scheme||null,record:`${t.w}-${t.l}`,players:t.roster.filter(p=>!p.injured).map(p=>({id:p.id,name:p.name,pos:p.pos,ovr:p.ovr,spd:p.spd||70,str:p.str||70,salary:p.salary||0}))});const data={team:fmt(ut),opponent:fmt(opp),week:game.wk,season:yr,gameId:`${game.wk}-${game.h}-${game.a}`};try{localStorage.setItem('gm_roster_export',JSON.stringify(data));window.open('https://vaultsparkstudios.com/gridiron-gm-play/','_blank');sm(`Week ${game.wk} vs ${opp.ab} exported → Play`);track('play_exported');}catch{sm("Export failed");}};
  const exportToPlay=()=>{const ut=teams[ui];const opp=teams[(ui+1)%teams.length];const fmt=t=>({name:`${t.city} ${t.name}`,ab:t.ab,clr:t.clr,ac:t.ac,ocScheme:t.coach?.oc?.scheme||null,dcScheme:t.coach?.dc?.scheme||null,record:`${t.w}-${t.l}`,players:t.roster.filter(p=>!p.injured).map(p=>({id:p.id,name:p.name,pos:p.pos,ovr:p.ovr,spd:p.spd||70,str:p.str||70}))});try{localStorage.setItem('gm_roster_export',JSON.stringify({team:fmt(ut),opponent:fmt(opp)}));sm("Exported to Play ✓");}catch{sm("Export failed");}};
  const importPlayResult=()=>{try{const raw=localStorage.getItem('gm_game_result');if(!raw){sm("No game result found.");return;}const res=JSON.parse(raw);const nt=[...teams];(res.playerDeltas||[]).forEach(d=>{const p=nt[ui].roster.find(r=>r.id===d.id);if(!p)return;if(d.passYds){p.ss.passYds=(p.ss.passYds||0)+d.passYds;p.ss.att=(p.ss.att||0)+(d.att||Math.ceil(d.passYds/8));p.ss.comp=(p.ss.comp||0)+(d.comp||Math.ceil(d.passYds/12));p.ss.passTD=(p.ss.passTD||0)+(d.passTD||0);}if(d.rushYds){p.ss.rushYds=(p.ss.rushYds||0)+d.rushYds;p.ss.rushAtt=(p.ss.rushAtt||0)+(d.rushAtt||Math.ceil(d.rushYds/4));p.ss.rushTD=(p.ss.rushTD||0)+(d.rushTD||0);}if(d.recYds){p.ss.recYds=(p.ss.recYds||0)+d.recYds;p.ss.rec=(p.ss.rec||0)+(d.rec||Math.ceil(d.recYds/9));p.ss.recTD=(p.ss.recTD||0)+(d.recTD||0);}p.ss.gp=(p.ss.gp||0)+1;});(res.injuries||[]).forEach(inj=>{const p=nt[ui].roster.find(r=>r.id===inj.id);if(p&&!p.injured){p.injured=true;p.injWk=inj.weeks;p.injType="Game injury";}});const ts=res.score?.team||0,os=res.score?.opp||0;if(ts>os)nt[ui].w++;else if(os>ts)nt[ui].l++;else nt[ui].t++;nt[ui].pf+=ts;nt[ui].pa+=os;setTeams(nt);// Mark the matching scheduled game as played
    if(res.gameId){const[wkS,hS,aS]=res.gameId.split('-').map(Number);const ns=[...sched];const gi=ns.findIndex(g=>g.wk===wkS&&g.h===hS&&g.a===aS);if(gi>=0){const isHome=hS===ui;ns[gi]={...ns[gi],played:true,hs:isHome?ts:os,as:isHome?os:ts};setSched(ns);}}localStorage.removeItem('gm_game_result');track('play_imported');sm(`Imported: ${ts}-${os} vs ${res.oppName||"Opponent"} (Wk${res.week||"?"})`);}catch(e){sm("Import failed");}};
  const reSign=(pid,yrs)=>{const nt=[...teams];const p=nt[ui].roster.find(r=>r.id===pid);if(!p)return;const repD=(nt[ui].gmRep||50)>=75?.9:1;const dem=+(Math.round((p.ovr/99)*(RES_MAX[p.pos]||8)*repD*10)/10);if(capSpace(nt[ui])<dem){sm(`Need $${dem}M cap — not enough!`);return;}p.salary=dem;p.contract=yrs;p.holdout=false;nt[ui].morale=cl((nt[ui].morale||50)+2,0,100);nt[ui].gmRep=cl((nt[ui].gmRep||50)+2,0,100);setTeams(nt);setSel(pr=>pr?.id===pid?{...p,salary:dem,contract:yrs}:pr);sm(`Re-signed ${p.name} — $${dem}M x ${yrs}yr`);};
  const tgS=col=>{if(sc===col)setSd(d=>-d);else{setSc(col);setSd(-1);}};
  const tgFS=col=>{if(faSc===col)setFaSd(d=>-d);else{setFaSc(col);setFaSd(-1);}};
  const stnd=useMemo(()=>teams.length?[...teams].sort((a,b)=>b.w-a.w||(b.pf-b.pa)-(a.pf-a.pa)):[],[teams]);
  const leaders=useMemo(()=>{if(!teams.length)return{};const cats={passing:["passYds","passTD","rate"],rushing:["rushYds","rushTD"],receiving:["recYds","recTD","rec"],defense:["tkl","sacks","ints","pd"],kicking:["fgM","pts"]};const ld={};for(const[g,stats]of Object.entries(cats)){ld[g]={};for(const st of stats){const all=[];teams.forEach(t=>t.roster.forEach(p=>{const v=p.ss?.[st];if(v!==undefined&&v>0)all.push({...p,tm:t.ab});}));all.sort((a,b)=>(b.ss?.[st]||0)-(a.ss?.[st]||0));ld[g][st]=all.slice(0,8);}}return ld;},[teams,wk]);
  const draftYears=Object.keys(dc).map(Number).sort();
  const myPicks=useMemo(()=>draftPicks.filter(pk=>pk.owner===ui),[draftPicks,ui]);
  const curPick=draftPicks[draftIdx];

  const saveGame=()=>{const d={v:2,yr,wk,sp,ui,teams,sched,byeMap,fa,waivers,dc,draftPicks,draftIdx,draftLog,log,champs,pb,myScout,faScouts,scPts,faCoaches,rivalry,ftag};const b=new Blob([JSON.stringify(d)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(b);a.download=`gm-${yr}-wk${wk}.json`;a.click();sm("Saved!");};
  const loadGame=e=>{const f=e.target.files?.[0];if(!f)return;const r=new FileReader();r.onload=ev=>{try{const d=JSON.parse(ev.target.result);if(!d.teams||!d.v){sm("Invalid save");return;}setYr(d.yr);setWk(d.wk);setSp(d.sp);setUi(d.ui);setTeams(d.teams);setSched(d.sched||[]);setFa(d.fa||[]);setWaivers(d.waivers||[]);setDc(d.dc||{});setDraftPicks(d.draftPicks||[]);setDraftIdx(d.draftIdx||0);setDraftLog(d.draftLog||[]);setLog(d.log||[]);setChamps(d.champs||[]);setPb(d.pb||null);setMyScout(d.myScout||null);setFaScouts(d.faScouts||[]);setScPts(d.scPts||10);setFaCoaches(d.faCoaches||[]);setByeMap(d.byeMap||{});setRivalry(d.rivalry||null);setFtag(d.ftag||null);setPhase("main");setTab("roster");sm("Loaded!");}catch{sm("Load failed");}};r.readAsText(f);};
  // ═══ PLAYER MODAL ═══
  const PM=({p,onClose})=>{if(!p)return null;const ss=p.ss||{};const dO=p.scoutLvl>=2?p.trueOvr:p.scoutedOvr||p.ovr;const dP=p.scoutLvl>=2?p.truePot:p.scoutedPot||p.pot;
    return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:12}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.cd,borderRadius:14,padding:16,maxWidth:500,width:"100%",maxHeight:"85vh",overflowY:"auto",border:`1px solid ${C.bd}`}}>
        <div style={{display:"flex",gap:10,marginBottom:12}}><Face s={p.face} sz={50}/><div style={{flex:1}}><div style={{fontSize:18,fontWeight:900}}>{p.name}</div><div style={{display:"flex",gap:5,marginTop:3,alignItems:"center",flexWrap:"wrap"}}><Bdg pos={p.pos}/><span style={{color:C.mt,fontSize:10}}>Age {p.age} • {htS(p.ht_)} {p.wt}lbs • {p.bio?.college}</span></div></div><div style={{textAlign:"right"}}><div style={{fontSize:28,fontWeight:900,color:oC(dO)}}>{dO}</div><div style={{fontSize:8,color:C.mt}}>OVR</div></div></div>
        {p.injured&&<div style={{background:"#7f1d1d33",borderRadius:5,padding:"4px 8px",fontSize:10,color:"#fca5a5",marginBottom:8}}>🏥 {p.injType} — {p.injSev||"?"} ({Math.max(0,(p.injRecWks||3)-(wk-p.injWk))}wk)</div>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:3,marginBottom:10}}>{[["OVR",dO],["POT",dP],["SPD",p.spd],["STR",p.str],["AGI",p.agi],["ACC",p.acc],["JMP",p.jmp],["END",p.end],["CONF",p.conf||60]].map(([l,v])=>(<div key={l} style={{background:C.bg,borderRadius:4,padding:"3px",textAlign:"center"}}><div style={{fontSize:7,color:C.mt}}>{l}</div><div style={{fontSize:14,fontWeight:800,color:oC(v)}}>{v}</div></div>))}</div>
        {p.posAttrs&&p.scoutLvl>=1&&<div style={{marginBottom:10}}><div style={{fontSize:8,color:C.bl,fontWeight:700,marginBottom:3}}>POSITION SKILLS</div><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:3}}>{Object.entries(p.posAttrs).slice(0,p.scoutLvl>=2?99:4).map(([k,v])=>(<div key={k} style={{background:C.bg,borderRadius:3,padding:"2px",textAlign:"center"}}><div style={{fontSize:6,color:C.mt}}>{k.slice(0,8)}</div><div style={{fontSize:11,fontWeight:700,color:oC(v)}}>{v}</div></div>))}</div></div>}
        {p.combine&&p.scoutLvl>=1&&<div style={{marginBottom:10}}><div style={{fontSize:8,color:C.gd,fontWeight:700,marginBottom:3}}>NFL COMBINE</div><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:3}}>{[["40-YD",p.combine.fortyYd+"s"],["BENCH",p.combine.bench],["VERT",p.combine.vert+'"'],["BROAD",p.combine.broad+'"'],["3-CONE",p.combine.threeCone+"s"],["SHUTTLE",p.combine.shuttle+"s"]].map(([l,v])=>(<div key={l} style={{background:C.bg,borderRadius:3,padding:"2px",textAlign:"center"}}><div style={{fontSize:6,color:C.mt}}>{l}</div><div style={{fontSize:10,fontWeight:700,color:"#cbd5e1"}}>{v}</div></div>))}</div>{p.proDay&&<><div style={{fontSize:8,color:"#a78bfa",fontWeight:700,marginTop:5,marginBottom:3}}>PRO DAY</div><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:3}}>{[["40-YD",p.proDay.fortyYd+"s"],["BENCH",p.proDay.bench],["VERT",p.proDay.vert+'"'],["BROAD",p.proDay.broad+'"'],["3-CONE",p.proDay.threeCone+"s"],["SHUTTLE",p.proDay.shuttle+"s"]].map(([l,v])=>(<div key={`pd${l}`} style={{background:C.bg,borderRadius:3,padding:"2px",textAlign:"center"}}><div style={{fontSize:6,color:C.mt}}>{l}</div><div style={{fontSize:10,fontWeight:700,color:"#c4b5fd"}}>{v}</div></div>))}</div></>}</div>}
        {p.colStats&&<div style={{marginBottom:10}}><div style={{fontSize:8,color:"#fb923c",fontWeight:700,marginBottom:3}}>COLLEGE ({p.colYrs}yr — {p.bio?.college})</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(48px,1fr))",gap:2}}>{Object.entries(p.colStats).filter(([,v])=>typeof v==="number"&&v>0).map(([k,v])=>(<div key={k} style={{background:C.bg,borderRadius:3,padding:"2px",textAlign:"center"}}><div style={{fontSize:6,color:C.mt}}>{sL(k)}</div><div style={{fontSize:10,fontWeight:700,color:"#fdba74"}}>{fm(v)}</div></div>))}</div></div>}
        <div style={{marginBottom:10}}><div style={{fontSize:8,color:C.gn,fontWeight:700,marginBottom:2}}>SCOUTING</div><div style={{fontSize:10,color:"#94a3b8",lineHeight:1.5}}>{p.bio?.strengths?.map((s,i)=><div key={i}>✅ {s}</div>)}{p.bio?.weaknesses?.map((w,i)=><div key={i} style={{color:"#f97316"}}>⚠️ {w}</div>)}</div>{p.bio?.fact&&<div style={{fontSize:9,color:C.mt,marginTop:3,fontStyle:"italic"}}>📝 {p.bio.fact}</div>}</div>
        {ss.gp>0&&<div style={{marginBottom:10}}><div style={{fontSize:8,color:C.bl,fontWeight:700,marginBottom:2}}>{yr} STATS • AV: <span style={{color:C.gd}}>{p.av}</span></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(44px,1fr))",gap:2}}>{Object.entries(ss).filter(([,v])=>typeof v==="number").map(([k,v])=>(<div key={k} style={{background:C.bg,borderRadius:3,padding:"2px",textAlign:"center"}}><div style={{fontSize:6,color:C.mt}}>{sL(k)}</div><div style={{fontSize:10,fontWeight:700,color:"#cbd5e1"}}>{fm(v)}</div></div>))}</div></div>}
        {(p.cs&&Object.keys(p.cs).length>0)&&<div style={{marginBottom:10}}><div style={{fontSize:8,color:"#a78bfa",fontWeight:700,marginBottom:2}}>CAREER STATS • {p.cs.seas||1} SEASONS</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(44px,1fr))",gap:2}}>{Object.entries(p.cs).filter(([k,v])=>k!=="seas"&&typeof v==="number"&&v>0).map(([k,v])=>(<div key={k} style={{background:C.bg,borderRadius:3,padding:"2px",textAlign:"center"}}><div style={{fontSize:6,color:C.mt}}>{sL(k)}</div><div style={{fontSize:10,fontWeight:700,color:"#c4b5fd"}}>{fm(v)}</div></div>))}</div></div>}
        <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>{ut?.roster.find(r=>r.id===p.id)&&<>{p.contract===1&&[1,2,3,4].map(y=><Btn key={y} onClick={()=>reSign(p.id,y)} bg="#7c3aed" c="#e9d5ff" style={{fontSize:8,padding:"2px 5px"}}>{y}yr</Btn>)}<Btn onClick={()=>{moveToPracticeSquad(p.id);onClose();}} bg="#334155" c="#94a3b8" style={{fontSize:8,padding:"2px 5px"}}>→ PS</Btn>{p.injured&&<Btn onClick={()=>{moveToIR(p.id);onClose();}} bg="#7f1d1d" c="#fca5a5" style={{fontSize:8,padding:"2px 5px"}}>→ IR</Btn>}{ut?.roster.find(r=>r.id===p.id)&&p.ovr>=80&&p.contract>=2&&!p.restructured&&<Btn onClick={()=>restructureP(p.id)} bg="#0c4a6e" c="#7dd3fc" style={{fontSize:8,padding:"2px 6px"}}>↻ Restructure</Btn>}{sp==="regular"&&p.contract>=1&&ut?.roster.find(r=>r.id===p.id)&&<><Btn onClick={()=>extendContract(p.id,1)} disabled={scPts<1} bg="#14532d" c="#86efac" style={{fontSize:8,padding:"2px 6px"}}>+1yr (1SP)</Btn><Btn onClick={()=>extendContract(p.id,2)} disabled={scPts<1} bg="#14532d" c="#86efac" style={{fontSize:8,padding:"2px 6px"}}>+2yr (1SP)</Btn></>}{sp==="preseason"&&!ftag&&p.contract===1&&ut?.roster.find(r=>r.id===p.id)&&<Btn onClick={()=>{const nt=[...teams];const pl=nt[ui].roster.find(r=>r.id===p.id);if(pl){pl.salary=RES_MAX[pl.pos]||8;pl.contract=1;pl.ftag=true;}setTeams(nt);setFtag(p.id);setSel(pr=>pr?.id===p.id?{...pl,ftag:true}:pr);sm(`🏷️ ${p.name} franchise tagged — $${RES_MAX[p.pos]||8}M`);}} bg="#b45309" c="#fef3c7" style={{fontSize:8,padding:"2px 6px"}}>🏷️ TAG</Btn>}{!(p.ftag)&&<Btn onClick={()=>{releaseP(p.id);onClose();}} bg="#7f1d1d" c="#fca5a5" style={{flex:1}}>Release{p.contract>1?` (-$${+(p.salary*.5).toFixed(1)}M dead)`:""}</Btn>}{p.ftag&&<Btn bg="#78350f" c="#d97706" style={{flex:1,opacity:.6,cursor:"default"}}>🏷️ Tagged — Cannot Release</Btn>}</>}<Btn onClick={onClose} bg={C.bd} style={{flex:1}}>Close</Btn></div>
      </div></div>);};

  // ═══ BOX SCORE MODAL ═══
  const BoxModal=({g,onClose})=>{if(!g)return null;const ht=teams[g.h],at=teams[g.a];
    const renderBox=(box)=>Object.entries(box||{}).map(([,s])=>s).sort((a,b)=>((b.passYds||0)+(b.rushYds||0)+(b.recYds||0))-((a.passYds||0)+(a.rushYds||0)+(a.recYds||0))).slice(0,12).map((s,i)=><div key={i} style={{display:"flex",gap:3,padding:"2px 4px",fontSize:9,borderBottom:`1px solid ${C.bd}11`}}><Bdg pos={s.pos}/><span style={{flex:1,fontWeight:600}}>{s.name}</span>{s.comp>0&&<span style={{color:"#94a3b8"}}>{s.comp}/{s.att}</span>}{(s.passYds||0)>0&&<span style={{color:"#94a3b8"}}>P:{s.passYds}</span>}{(s.rushYds||0)>0&&<span style={{color:"#94a3b8"}}>R:{s.rushYds}</span>}{(s.recYds||0)>0&&<span style={{color:"#94a3b8"}}>Rec:{s.recYds}</span>}{(s.tkl||0)>0&&<span style={{color:"#94a3b8"}}>T:{s.tkl}</span>}{(s.sacks||0)>0&&<span style={{color:"#94a3b8"}}>Sk:{fm(s.sacks)}</span>}{(s.ints||0)>0&&<span style={{color:"#94a3b8"}}>I:{s.ints}</span>}</div>);
    return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:12}} onClick={onClose}><div onClick={e=>e.stopPropagation()} style={{background:C.cd,borderRadius:14,padding:16,maxWidth:560,width:"100%",maxHeight:"85vh",overflowY:"auto",border:`1px solid ${C.bd}`}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:12,height:12,borderRadius:3,background:TEAMS[g.h].clr}}/><span style={{fontWeight:800,fontSize:13}}>{ht?.ab} {g.hs}</span></div><span style={{color:C.mt,fontSize:9}}>FINAL</span><div style={{display:"flex",alignItems:"center",gap:6}}><span style={{fontWeight:800,fontSize:13}}>{g.as} {at?.ab}</span><div style={{width:12,height:12,borderRadius:3,background:TEAMS[g.a].clr}}/></div></div>
      <div style={{display:"flex",gap:10}}><div style={{flex:1}}><div style={{fontSize:8,fontWeight:700,color:TEAMS[g.h].ac,marginBottom:3}}>{ht?.name}</div>{renderBox(g.boxH)}</div><div style={{flex:1}}><div style={{fontSize:8,fontWeight:700,color:TEAMS[g.a].ac,marginBottom:3}}>{at?.name}</div>{renderBox(g.boxA)}</div></div>
      <Btn onClick={onClose} bg={C.bd} style={{marginTop:8,width:"100%"}}>Close</Btn>
    </div></div>);};

  // ═══ RENDER ═══
  if(phase==="splash")return(<div style={{minHeight:"100vh",background:`linear-gradient(135deg,${C.bg},#131b2e)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:C.f,color:C.tx}}><div style={{textAlign:"center"}}><div style={{fontSize:15,letterSpacing:8,textTransform:"uppercase",color:C.gn,fontWeight:600}}>Gridiron</div><h1 style={{fontSize:68,fontWeight:900,margin:0,background:"linear-gradient(to bottom,#fff,#94a3b8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>GM</h1><div style={{fontSize:10,color:"#475569",letterSpacing:2}}>V3.2 — LIVE SIM • BOX SCORES • FULL DRAFT</div><Btn onClick={()=>setPhase("teamSelect")} bg={C.gn} style={{padding:"12px 44px",fontSize:15,marginTop:16,borderRadius:8}}>NEW GAME</Btn>
<label style={{cursor:"pointer",display:"block",marginTop:8}}><span style={{display:"inline-block",background:"#1e293b",color:C.mt,padding:"8px 24px",borderRadius:8,fontWeight:700,fontSize:12,cursor:"pointer"}}>📂 LOAD GAME</span><input type="file" accept=".json" style={{display:"none"}} onChange={loadGame}/></label></div></div>);
  if(phase==="teamSelect")return(<div style={{minHeight:"100vh",background:C.bg,fontFamily:C.f,color:C.tx,padding:24}}><h2 style={{textAlign:"center",fontSize:20,fontWeight:800,marginBottom:16}}>Choose Your Team</h2><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:6,maxWidth:900,margin:"0 auto"}}>{TEAMS.map((t,i)=><button key={i} onClick={()=>startGame(i)} style={{background:`linear-gradient(135deg,${t.clr}cc,${t.clr})`,border:`2px solid ${t.ac}33`,borderRadius:8,padding:"10px 8px",cursor:"pointer",textAlign:"left",color:"#fff"}}><div style={{fontSize:8,textTransform:"uppercase",letterSpacing:2,opacity:.7}}>{t.city}</div><div style={{fontSize:14,fontWeight:800}}>{t.name}</div><div style={{fontSize:8,color:t.ac,fontWeight:700,marginTop:2}}>{t.ab} • {t.c} {t.d}</div></button>)}</div></div>);

  const TABS=["roster","standings","schedule","stats","scouting","coaching","trade","draft","freeagency","playoffs","log","dev"];
  if(liveSim)TABS.push("livesim");
  const phaseFlow=sp==="regular"?`Wk ${wk}/18`:sp==="playoffs"?"Playoffs":sp==="combine"?"Combine":sp==="draft"?"Draft":sp==="freeagency"?"Free Agency":"Preseason";

  return(<div style={{minHeight:"100vh",background:C.bg,fontFamily:C.f,color:C.tx,display:"flex",flexDirection:"column"}}>
    {sel&&<PM p={sel} onClose={()=>setSel(null)}/>}
    {boxView&&<BoxModal g={boxView} onClose={()=>setBoxView(null)}/>}
    <div style={{background:"linear-gradient(90deg,#0f172a,#1e293b)",padding:"6px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.bd}`,flexWrap:"wrap",gap:4}}>
      <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:26,height:26,borderRadius:4,background:`linear-gradient(135deg,${ut?.clr},${ut?.ac})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:8,color:"#fff"}}>{ut?.ab}</div><div><div style={{fontWeight:800,fontSize:12}}>{ut?.city} {ut?.name}</div><div style={{fontSize:8,color:C.mt}}>{yr} • {ut?.w}W-{ut?.l}L • Cap <span style={{color:capSpace(ut||{})>=0?C.gn:C.rd,fontWeight:700}}>${capSpace(ut||{}).toFixed(1)}M</span>/{CAP_CEILING}M • SP:{scPts} • MOR:<span style={{color:(ut?.morale||50)>=75?C.gn:(ut?.morale||50)>=45?C.gd:C.rd,fontWeight:700}}>{(ut?.morale||50)>=75?'HIGH':(ut?.morale||50)>=45?'MED':'LOW'}</span> • REP:<span style={{color:(ut?.gmRep||50)>=75?'#a78bfa':(ut?.gmRep||50)>=60?C.gd:C.mt,fontWeight:700}}>{(ut?.gmRep||50)>=90?'LEGEND':(ut?.gmRep||50)>=75?'ELITE':(ut?.gmRep||50)>=60?'RESPECTED':(ut?.gmRep||50)>=40?'VETERAN':'ROOKIE'}</span></div></div></div>
      <div style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>
        <span style={{fontSize:8,padding:"2px 6px",borderRadius:10,background:`${C.bl}22`,color:C.bl,fontWeight:700}}>{phaseFlow}</span>
        {sp==="preseason"&&<Btn onClick={startSeason} bg={C.gn}>Start Season</Btn>}
        {sp==="regular"&&<><Btn onClick={simWk}>Sim Week</Btn><Btn onClick={simAll} bg="#6366f1">Sim All</Btn></>}
        {sp==="playoffs"&&pb&&!pb.ch&&<Btn onClick={simPR} bg={C.gd} c="#000">Sim Round</Btn>}
        {sp==="playoffs"&&pb?.ch!=null&&<Btn onClick={goToCombine} bg="#7c3aed">→ Combine</Btn>}
        {sp==="combine"&&<Btn onClick={startDraft} bg={C.gd} c="#000">→ Draft</Btn>}
        {sp==="draft"&&draftActive&&<><Btn onClick={()=>setDraftPaused(p=>!p)} bg={draftPaused?"#22c55e":"#f97316"}>{draftPaused?"▶ Resume":"⏸ Pause"}</Btn><Btn onClick={simEntireDraft} bg="#6366f1">⏭ Sim Draft</Btn></>}
        {sp==="freeagency"&&<Btn onClick={newSeason} bg={C.gn}>→ Next Season</Btn>}
        <Btn onClick={saveGame} bg="#334155" style={{padding:"3px 7px",fontSize:9}}>💾</Btn><label style={{cursor:"pointer",display:"flex",alignItems:"center"}}><span style={{background:"#334155",color:C.mt,padding:"3px 7px",borderRadius:4,fontWeight:700,fontSize:9,cursor:"pointer"}}>📂</span><input type="file" accept=".json" style={{display:"none"}} onChange={loadGame}/></label>
      </div>
    </div>
    {msg&&<div style={{background:`${C.gn}12`,borderLeft:`3px solid ${C.gn}`,padding:"4px 10px",fontSize:10,color:C.gn,fontWeight:600}}>{msg}</div>}
    {trProp&&<div style={{background:"#1e293b",borderLeft:"3px solid #f59e0b",padding:"5px 10px",display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
      <span style={{color:"#f59e0b",fontSize:9,fontWeight:800}}>💰 TRADE OFFER</span>
      <span style={{color:"#94a3b8",fontSize:9}}>{TEAMS[trProp.fromTm].ab} offers{' '}
        {trProp.give&&<span style={{color:"#e2e8f0",fontWeight:700}}>{trProp.give.name} ({trProp.give.pos} {trProp.give.ovr}ovr)</span>}
        {(trProp.givePicks||[]).map((pk,i)=><span key={pk.id} style={{color:"#a78bfa",fontWeight:700}}>{(i>0||trProp.give)?' + ':''}{`R${pk.rd} #${pk.overall}`}</span>)}
        {' for your '}<span style={{color:"#e2e8f0",fontWeight:700}}>{trProp.want.name} ({trProp.want.pos} {trProp.want.ovr}ovr)</span>
      </span>
      <button onClick={acceptTrade} style={{background:"#166534",color:"#22c55e",border:"1px solid #22c55e",borderRadius:3,padding:"2px 8px",fontSize:8,fontWeight:700,cursor:"pointer"}}>Accept</button>
      <button onClick={()=>setTrProp(null)} style={{background:"#1e293b",color:"#64748b",border:"1px solid #334155",borderRadius:3,padding:"2px 8px",fontSize:8,fontWeight:700,cursor:"pointer"}}>Decline</button>
    </div>}
    <div style={{display:"flex",background:"#0f172a",borderBottom:`1px solid ${C.bd}`,overflowX:"auto"}}>{TABS.map(t=><button key={t} onClick={()=>setTab(t)} style={{background:tab===t?"#1e293b":"transparent",color:tab===t?"#fff":C.mt,border:"none",borderBottom:tab===t?`2px solid ${C.gn}`:"2px solid transparent",padding:"6px 10px",fontSize:9,fontWeight:700,cursor:"pointer",textTransform:"uppercase",whiteSpace:"nowrap"}}>{t==="freeagency"?"FA":t==="livesim"?"⚡LIVE":t==="dev"?"🔧DEV":t}</button>)}</div>
    {(()=>{
      const stageList=[{k:'preseason',lbl:'PRE'},{k:'reg',lbl:'SEASON',weeks:18},{k:'playoffs',lbl:'PLAYOFFS'},{k:'combine',lbl:'COMBINE'},{k:'draft',lbl:'DRAFT'},{k:'freeagency',lbl:'FA'}];
      const curIdx=sp==='preseason'?0:sp==='regular'?1:sp==='playoffs'?2:sp==='combine'?3:sp==='draft'?4:5;
      const byeWk=byeMap[ui];
      const wkBoxes=[];
      for(let wi=1;wi<=18;wi++){
        const isDone=sp==="regular"?wk>=wi:curIdx>1;
        const isCur=sp==="regular"&&wk+1===wi;
        const isBye=byeWk===wi;
        const bg=isDone?C.gn:isBye?"#7c3aed44":isCur?"#22c55e66":"#1e293b";
        const bdr=isDone?C.gn:isBye?"#7c3aed":isCur?C.gn:C.bd;
        const lbl=isDone?"✓":isBye?"B":isCur?String(wi):"";
        wkBoxes.push(<div key={wi} style={{width:12,height:12,borderRadius:2,background:bg,border:"1px solid "+bdr,display:"flex",alignItems:"center",justifyContent:"center",fontSize:6,color:isBye&&!isDone?"#a78bfa":"#fff"}}>{lbl}</div>);
      }
      return(<div style={{background:"#080f1e",borderBottom:"1px solid #1e293b",padding:"3px 12px",display:"flex",alignItems:"center",gap:0,overflowX:"auto"}}>
        {stageList.map((s,si)=>{
          const active=si===curIdx;const done=si<curIdx;const dotC=active?C.gn:done?"#334155":C.bd;
          const lc=active?C.gn:done?C.mt:C.bd;
          return(<div key={s.k} style={{display:"flex",alignItems:"flex-end",gap:0}}>
            <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:1}}>
              {s.weeks
                ?<div style={{display:"flex",gap:1,alignItems:"center",paddingBottom:1}}>{wkBoxes}</div>
                :<div style={{width:32,height:12,borderRadius:2,background:active?"#22c55e33":done?"#1e293b":"#080f1e",border:"1px solid "+dotC,display:"flex",alignItems:"center",justifyContent:"center"}}><div style={{width:6,height:6,borderRadius:"50%",background:dotC}}/></div>}
              <span style={{fontSize:6,fontWeight:700,color:lc,letterSpacing:.5}}>{s.lbl}</span>
            </div>
            {si<stageList.length-1&&<div style={{width:6,height:1,background:done?C.gn:C.bd,marginBottom:8,flexShrink:0}}/>}
          </div>);
        })}
      </div>);
    })()}
    <div style={{flex:1,padding:"8px 12px",overflowY:"auto",maxHeight:"calc(100vh - 120px)"}}>

    {/* ROSTER */}
    {tab==="roster"&&ut&&<div>
      <div style={{background:C.cd,borderRadius:6,padding:"6px 10px",marginBottom:6,border:`1px solid ${C.bd}`,display:"flex",gap:16,flexWrap:"wrap",alignItems:"center"}}>
        <div><span style={{fontSize:8,color:C.mt}}>CAP SPACE </span><span style={{fontSize:11,fontWeight:800,color:capSpace(ut)>=0?C.gn:C.rd}}>${capSpace(ut).toFixed(1)}M</span><span style={{fontSize:8,color:C.mt}}> / ${CAP_CEILING}M</span>{(()=>{const next1=yr+1,next2=yr+2;const proj1=+(ut.roster.filter(p=>p.contract>=2).reduce((s,p)=>s+(p.salary||0),0)+((ut.coach?.oc?.salary||0)+(ut.coach?.dc?.salary||0)+(ut.coach?.st?.salary||0))).toFixed(1);const proj2=+(ut.roster.filter(p=>p.contract>=3).reduce((s,p)=>s+(p.salary||0),0)+((ut.coach?.oc?.salary||0)+(ut.coach?.dc?.salary||0)+(ut.coach?.st?.salary||0))).toFixed(1);const exp1=ut.roster.filter(p=>p.contract===1).length;const exp2=ut.roster.filter(p=>p.contract<=2).length;return(<div style={{marginTop:4,fontSize:8,color:C.mt}}><span style={{marginRight:8}}>{next1}: <span style={{color:(CAP_CEILING-proj1)>=20?C.gn:C.rd}}>${(CAP_CEILING-proj1).toFixed(0)}M space</span> ({exp1} exp)</span><span>{next2}: <span style={{color:(CAP_CEILING-proj2)>=20?C.gn:C.rd}}>${(CAP_CEILING-proj2).toFixed(0)}M space</span> ({exp2} exp)</span></div>);})()}</div>
        <div><span style={{fontSize:8,color:C.mt}}>USED </span><span style={{fontSize:10,fontWeight:700,color:C.gd}}>${capHit(ut).toFixed(1)}M</span></div>
        <div><span style={{fontSize:8,color:C.mt}}>MORALE </span><span style={{fontSize:10,fontWeight:800,color:(ut.morale||50)>=75?C.gn:(ut.morale||50)>=45?C.gd:C.rd}}>{(ut.morale||50)>=75?'HIGH':(ut.morale||50)>=45?'MED':'LOW'}</span><span style={{fontSize:8,color:C.mt}}> {ut.morale||50}</span>{(ut.streak||0)>=3&&<span style={{fontSize:8,color:C.gn,marginLeft:3}}>W{ut.streak}</span>}{(ut.streak||0)<=-3&&<span style={{fontSize:8,color:C.rd,marginLeft:3}}>L{Math.abs(ut.streak)}</span>}</div>
        <div>{(()=>{const gr=ut.gmRep||50;const tier=gr>=90?'LEGEND':gr>=75?'ELITE':gr>=60?'RESPECTED':gr>=40?'VETERAN':'ROOKIE';const perk=gr>=90?'+2 SP/wk, 10% discount':gr>=75?'10% resign discount':gr>=60?'+1 SP/wk':'';return(<><span style={{fontSize:8,color:C.mt}}>GM REP </span><span style={{fontSize:10,fontWeight:800,color:gr>=75?'#a78bfa':gr>=60?C.gd:C.mt}}>{tier}</span><span style={{fontSize:8,color:C.mt}}> {gr}</span>{perk&&<span style={{fontSize:7,color:'#64748b',marginLeft:4}}>[{perk}]</span>}</>);})()}</div>
        {(ut.deadCap||0)>0&&<div><span style={{fontSize:8,color:C.mt}}>DEAD CAP </span><span style={{fontSize:10,fontWeight:700,color:C.rd}}>${(ut.deadCap).toFixed(1)}M</span></div>}
        <div style={{flex:1,height:6,background:C.bd,borderRadius:3,minWidth:80}}><div style={{width:`${Math.min(100,(capHit(ut)/CAP_CEILING)*100)}%`,height:"100%",background:capSpace(ut)<20?C.rd:capSpace(ut)<50?C.gd:C.gn,borderRadius:3}}/></div>
        {capSpace(ut||{})<0&&<div style={{background:"#7f1d1d22",border:"1px solid #ef4444",borderRadius:4,padding:"4px 8px",fontSize:9,color:"#ef4444",fontWeight:700,marginTop:3}}>⚠️ OVER THE CAP — $5M fine + 3rd-round pick at next simWk</div>}
        {(()=>{const exp=ut.roster.filter(p=>p.contract===1).sort((a,b)=>b.ovr-a.ovr);if(!exp.length)return null;const repD=(ut.gmRep||50)>=75?.9:1;const locked=ut.roster.filter(p=>p.contract>=2).reduce((s,p)=>s+(p.salary||0),0)+((ut.coach?.oc?.salary||0)+(ut.coach?.dc?.salary||0)+(ut.coach?.st?.salary||0));const askTotal=exp.reduce((s,p)=>s+Math.round((p.ovr/99)*(RES_MAX[p.pos]||8)*repD*10)/10,0);const spaceIfResign=+(CAP_CEILING-locked-askTotal).toFixed(1);const spaceIfCut=+(CAP_CEILING-locked).toFixed(1);return(<div style={{width:"100%",marginTop:4,background:"#0d1a2a",borderRadius:4,padding:"5px 8px",border:"1px solid #1e3a5f"}}><div style={{fontSize:8,color:"#7dd3fc",fontWeight:700,marginBottom:3}}>📋 EXPIRING ({exp.length}) — {yr+1}: <span style={{color:spaceIfResign>=0?C.gn:C.rd}}>keep all ${spaceIfResign.toFixed(0)}M</span> <span style={{color:C.mt}}>|</span> <span style={{color:C.gn}}>cut all ${spaceIfCut.toFixed(0)}M</span></div><div style={{display:"flex",flexWrap:"wrap",gap:3}}>{exp.slice(0,6).map(p=>{const ask=+(Math.round((p.ovr/99)*(RES_MAX[p.pos]||8)*repD*10)/10);const canAfford=capSpace(ut)>=ask;return(<span key={p.id} style={{fontSize:7,color:canAfford?"#94a3b8":C.rd,background:C.bg,borderRadius:2,padding:"1px 4px"}}>{p.name} <span style={{color:oC(p.ovr)}}>{p.ovr}</span> <span style={{color:canAfford?C.mt:C.rd}}>${ask}M</span></span>);})}</div></div>);})()}
        <Btn onClick={exportToPlay} bg="#7c3aed" c="#e9d5ff" style={{fontSize:7,padding:"2px 6px"}}>📤 Play</Btn>
        {localStorage.getItem('gm_game_result')&&<Btn onClick={importPlayResult} bg={C.gn} style={{fontSize:7,padding:"2px 6px"}}>📥 Results</Btn>}
      </div>
      {sp==="preseason"&&preseasonGames.length===0&&<div style={{background:C.cd,border:`1px solid ${C.bd}`,borderRadius:5,padding:"6px 8px",marginBottom:6}}><div style={{fontSize:9,fontWeight:700,color:C.gd,marginBottom:4}}>🏈 PRESEASON — 2 Exhibition Games</div><div style={{fontSize:8,color:C.mt,marginBottom:4}}>Sim preseason games to evaluate depth players. No W/L impact.</div><button onClick={()=>{const opp1=teams[(ui+1)%teams.length],opp2=teams[(ui+2)%teams.length];const g1=simGame(teams[ui],opp1),g2=simGame(teams[ui],opp2);const results=[{opp:opp1.ab,us:g1.hsc,them:g1.asc},{opp:opp2.ab,us:g2.hsc,them:g2.asc}];setPreseasonGames(results);const depthStars=teams[ui].roster.filter(p=>p.ovr<75).sort(()=>Math.random()-.5).slice(0,3).map(p=>`${p.name} (${p.pos})`);setLog(pr=>[...pr,`📋 Preseason: ${results[0].us}-${results[0].them} vs ${results[0].opp}, ${results[1].us}-${results[1].them} vs ${results[1].opp}`,`👀 Standout depth: ${depthStars.join(', ')}`]);sm("Preseason complete!");}} style={{background:`${C.gn}22`,color:C.gn,border:`1px solid ${C.gn}44`,borderRadius:4,padding:"4px 12px",fontSize:9,fontWeight:700,cursor:"pointer"}}>▶ Sim Preseason</button></div>}
      {sp==="preseason"&&preseasonGames.length>0&&<div style={{background:C.cd,border:`1px solid ${C.bd}`,borderRadius:5,padding:"5px 8px",marginBottom:6}}><div style={{fontSize:8,fontWeight:700,color:C.gd,marginBottom:2}}>PRESEASON RESULTS</div>{preseasonGames.map((g,i)=><div key={i} style={{fontSize:9,color:C.mt}}>{g.us>g.them?'✅':'❌'} {g.us}–{g.them} vs {g.opp}</div>)}</div>}
      {sp==="preseason"&&(()=>{const exp=ut.roster.filter(p=>p.contract===1).sort((a,b)=>b.ovr-a.ovr);if(!exp.length)return null;return<div style={{background:"#0d1f15",border:"1px solid #166534",borderRadius:5,padding:"6px 8px",marginBottom:6}}><div style={{fontSize:9,fontWeight:700,color:"#22c55e",marginBottom:4}}>⏰ RE-SIGN WINDOW — {exp.length} expiring</div>{exp.map(p=>{const dem=+(Math.round((p.ovr/99)*(RES_MAX[p.pos]||8)*10)/10);const ok=capSpace(ut)>=dem;return<div key={p.id} style={{display:"flex",alignItems:"center",gap:4,marginBottom:3,flexWrap:"wrap"}}><span style={{flex:1,fontSize:9,color:"#e2e8f0",minWidth:120}}>{p.name} <span style={{color:"#64748b"}}>({p.pos} {p.ovr}ovr)</span></span><span style={{fontSize:8,color:ok?"#94a3b8":"#ef4444"}}>${dem}M/yr</span>{[1,2,3,4].map(y=><button key={y} onClick={()=>reSign(p.id,y)} disabled={!ok} style={{background:ok?"#166534":"#1a2438",color:ok?"#22c55e":"#334155",border:`1px solid ${ok?"#22c55e":"#334155"}`,borderRadius:2,padding:"1px 5px",fontSize:7,cursor:ok?"pointer":"default"}}>{y}yr</button>)}</div>;})}  </div>;})()}
      {sp==="preseason"&&scPts>=3&&teams[ui]?.roster.filter(p=>p.age<=23&&(p.draftYr===yr||p.draftYr===yr-1)).length>0&&(()=>{const rookies=teams[ui].roster.filter(p=>p.age<=23&&(p.draftYr===yr||p.draftYr===yr-1)).sort((a,b)=>b.ovr-a.ovr).slice(0,5);return(<div style={{background:C.cd,border:`1px solid #7c3aed44`,borderRadius:5,padding:"5px 8px",marginBottom:6}}><div style={{fontSize:9,fontWeight:700,color:"#a78bfa",marginBottom:3}}>🎓 DEV CAMP — 3 SP</div><div style={{fontSize:8,color:C.mt,marginBottom:3}}>Select one rookie for +3 OVR boost</div><div style={{display:"flex",gap:3,flexWrap:"wrap"}}>{rookies.map(p=><button key={p.id} onClick={()=>{const nt=[...teams];const pl=nt[ui].roster.find(r=>r.id===p.id);if(!pl)return;pl.ovr=Math.min(pl.ovr+3,99);setTeams(nt);setScPts(s=>s-3);setLog(l=>[`🎓 Dev Camp: ${pl.name} (${pl.pos}) OVR ${pl.ovr-3} → ${pl.ovr}`,...l.slice(0,149)]);sm(`${pl.name} +3 OVR from Dev Camp`);}} style={{background:"#7c3aed22",color:"#c4b5fd",border:"1px solid #7c3aed44",borderRadius:3,padding:"2px 6px",fontSize:8,fontWeight:700,cursor:"pointer"}}>{p.name} {p.pos} {p.ovr}</button>)}</div></div>);})()}
      <div style={{display:"flex",gap:2,marginBottom:4}}><button onClick={()=>{setShowDepth(false);setShowPS(false);setShowIR(false);}} style={{background:!showDepth&&!showPS&&!showIR?"#1e293b":"transparent",color:!showDepth&&!showPS&&!showIR?"#fff":C.mt,border:`1px solid ${C.bd}`,padding:"2px 8px",borderRadius:3,fontSize:8,fontWeight:700,cursor:"pointer"}}>Roster</button><button onClick={()=>{setShowDepth(true);setShowPS(false);setShowIR(false);}} style={{background:showDepth&&!showPS&&!showIR?"#1e293b":"transparent",color:showDepth&&!showPS&&!showIR?"#fff":C.mt,border:`1px solid ${C.bd}`,padding:"2px 8px",borderRadius:3,fontSize:8,fontWeight:700,cursor:"pointer"}}>Depth Chart</button><button onClick={()=>{setShowPS(true);setShowDepth(false);setShowIR(false);}} style={{background:showPS&&!showIR?"#1e293b":"transparent",color:showPS&&!showIR?"#fff":C.mt,border:`1px solid ${C.bd}`,padding:"2px 8px",borderRadius:3,fontSize:8,fontWeight:700,cursor:"pointer"}}>PS ({(ut.ps||[]).length}/10)</button><button onClick={()=>{setShowIR(true);setShowPS(false);setShowDepth(false);}} style={{background:showIR?"#1e293b":"transparent",color:showIR?"#fff":C.mt,border:`1px solid ${C.bd}`,padding:"2px 8px",borderRadius:3,fontSize:8,fontWeight:700,cursor:"pointer"}}>IR ({(ut.ir||[]).length}/8)</button></div>
      {showIR?<div>{(ut.ir||[]).length===0&&<div style={{color:C.mt,fontSize:10,padding:8}}>IR empty — use "→ IR" in player modal to place injured players.</div>}{(ut.ir||[]).map(p=>{const wksElapsed=wk-(p.irWk||0);const rem=Math.max(0,(p.irMin||8)-wksElapsed);return(<div key={p.id} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 5px",borderBottom:`1px solid ${C.bd}11`,fontSize:10}}><Face s={p.face} sz={18}/><PN p={p} setSel={setSel} style={{flex:1}}/><Bdg pos={p.pos}/><span style={{fontWeight:800,color:oC(p.ovr),minWidth:22}}>{p.ovr}</span><span style={{color:C.rd,fontSize:8}}>🏥 {p.injType||"Inj"}</span>{rem>0?<span style={{color:C.mt,fontSize:7}}>{rem}wk</span>:<Btn onClick={()=>activateFromIR(p.id)} bg={`${C.gn}22`} c={C.gn} style={{fontSize:7,padding:"1px 5px"}}>Activate</Btn>}</div>);})}</div>:showPS?<div>{(ut.ps||[]).length===0&&<div style={{color:C.mt,fontSize:10,padding:8}}>Practice squad empty — use "→ PS" in player modal to assign players.</div>}{(ut.ps||[]).map(p=><div key={p.id} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 5px",borderBottom:`1px solid ${C.bd}11`,fontSize:10}}><Face s={p.face} sz={18}/><PN p={p} setSel={setSel} style={{flex:1}}/><Bdg pos={p.pos}/><span style={{fontWeight:800,color:oC(p.ovr),minWidth:22}}>{p.ovr}</span><span style={{color:C.mt,fontSize:8}}>Age:{p.age}</span><Btn onClick={()=>promoteFromPS(p.id)} bg={`${C.gn}22`} c={C.gn} style={{fontSize:7,padding:"1px 5px"}}>Promote</Btn><Btn onClick={()=>releasePSPlayer(p.id)} bg={`${C.rd}22`} c={C.rd} style={{fontSize:7,padding:"1px 5px"}}>Release</Btn></div>)}</div>:showDepth?<DepthChartView roster={ut.roster} setSel={setSel} onAutoFill={()=>{const nt=[...teams];nt[ui].roster=[...ut.roster].sort((a,b)=>b.ovr-a.ovr);setTeams(nt);sm("Depth chart auto-filled by OVR");}}/>:<PlayerTable players={ut.roster} setSel={setSel} sortCol={sc} sortDir={sd} onSort={tgS} posFilter={rPosF} setPosFilter={setRPosF}/>}
    </div>}

    {/* STANDINGS */}
    {tab==="standings"&&<div>
      {(()=>{
        const divs={};
        teams.forEach(t=>{const dk=`${TEAMS[t.id]?.c||'AFC'} ${TEAMS[t.id]?.d||'East'}`;(divs[dk]||(divs[dk]=[])).push(t);});
        Object.values(divs).forEach(d=>d.sort((a,b)=>b.w-a.w||(b.pf-b.pa)-(a.pf-a.pa)));
        const confOrder=['AFC East','AFC North','AFC South','AFC West','NFC East','NFC North','NFC South','NFC West'];
        return confOrder.filter(k=>divs[k]).map(dk=>(
          <div key={dk} style={{marginBottom:10}}>
            <div style={{fontSize:8,fontWeight:700,color:C.gd,padding:"2px 4px",background:`${C.gd}11`,borderRadius:3,marginBottom:3}}>{dk}</div>
            {divs[dk].map((t,i)=>(
              <div key={t.id} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 6px",background:t.id===ui?`${C.gn}11`:i%2?"transparent":C.cd+"44",borderRadius:3,fontSize:10}}>
                <span style={{color:C.mt,fontWeight:700,minWidth:14}}>{i+1}</span>
                {i===0&&<span style={{fontSize:7,color:C.gd,fontWeight:700}}>DIV</span>}
                <div style={{width:12,height:12,borderRadius:3,background:TEAMS[t.id]?.clr||'#22c55e'}}/>
                <span style={{flex:1,fontWeight:t.id===ui?800:400}}>{t.city} {t.name}</span>
                {rivalry&&rivalry.teamId===t.id&&<span style={{fontSize:7,color:"#f97316",fontWeight:700}}>🔥 R:{rivalry.wins}-{rivalry.losses}</span>}
                <span style={{fontWeight:700,minWidth:40}}>{t.w}-{t.l}{t.t?`-${t.t}`:""}</span>
                <span style={{color:C.mt,fontSize:8,minWidth:60}}>PF:{t.pf} PA:{t.pa}</span>
                {t.id!==ui&&<button onClick={()=>setRivalry({teamId:t.id,wins:0,losses:0})} style={{background:rivalry&&rivalry.teamId===t.id?`${"#f97316"}22`:`${C.bd}`,color:rivalry&&rivalry.teamId===t.id?"#f97316":C.mt,border:`1px solid ${rivalry&&rivalry.teamId===t.id?"#f97316":C.bd}`,borderRadius:3,padding:"1px 5px",fontSize:7,fontWeight:700,cursor:"pointer"}}>RIVAL</button>}
              </div>
            ))}
          </div>
        ));
      })()}
      <div style={{marginTop:10,borderTop:`1px solid ${C.bd}`,paddingTop:8}}>
        <div style={{fontSize:9,fontWeight:700,color:C.gd,marginBottom:5}}>PLAYOFF PICTURE</div>
        {['AFC','NFC'].map(conf=>{
          const ct=[...teams].filter(t=>TEAMS[t.id]?.c===conf);
          const divMap={};ct.forEach(t=>{const dk=TEAMS[t.id]?.d||'X';(divMap[dk]||(divMap[dk]=[])).push(t);});
          Object.values(divMap).forEach(d=>d.sort((a,b)=>b.w-a.w||(b.pf-b.pa)-(a.pf-a.pa)));
          const divWins=Object.values(divMap).map(d=>d[0]).sort((a,b)=>b.w-a.w||(b.pf-b.pa)-(a.pf-a.pa));
          const wcs=ct.filter(t=>!divWins.find(d=>d.id===t.id)).sort((a,b)=>b.w-a.w||(b.pf-b.pa)-(a.pf-a.pa)).slice(0,4-divWins.length);
          const qualifiers=[...divWins,...wcs].slice(0,4);
          return(<div key={conf} style={{marginBottom:6}}>
            <div style={{fontSize:8,color:C.mt,fontWeight:700,marginBottom:2}}>{conf}</div>
            {qualifiers.map((t,i)=>(
              <div key={t.id} style={{display:"flex",alignItems:"center",gap:5,padding:"2px 4px",fontSize:9,background:t.id===ui?`${C.gn}11`:"transparent",borderRadius:2}}>
                <span style={{color:C.mt,minWidth:12}}>{i+1}</span>
                <span style={{fontSize:7,fontWeight:700,color:i<divWins.length?C.gd:"#a78bfa",minWidth:22}}>{i<divWins.length?'DIV':'WC'}</span>
                <div style={{width:8,height:8,borderRadius:2,background:TEAMS[t.id]?.clr}}/>
                <span style={{flex:1,fontWeight:t.id===ui?800:400}}>{t.city} {t.name}</span>
                <span style={{fontWeight:700,fontSize:9}}>{t.w}-{t.l}</span>
              </div>
            ))}
          </div>);
        })}
      </div>
    </div>}

    {/* SCHEDULE */}
    {tab==="schedule"&&<div>
      {sp==="regular"&&(()=>{const nug=sched.find(g=>!g.played&&(g.h===ui||g.a===ui));if(!nug)return null;const soid=nug.h===ui?nug.a:nug.h;const so=teams[soid];if(!so)return null;const soff=so.roster.filter(p=>['QB','RB','WR','TE'].includes(p.pos)&&!p.injured).sort((a,b)=>b.ovr-a.ovr)[0];const sdef=so.roster.filter(p=>['DL','LB','CB','S'].includes(p.pos)&&!p.injured).sort((a,b)=>b.ovr-a.ovr)[0];const sgames=sched.filter(g=>g.played&&(g.h===soid||g.a===soid));const avgPF=sgames.length?Math.round(sgames.reduce((s,g)=>s+(g.h===soid?g.hs:g.as),0)/sgames.length):'-';const avgPA=sgames.length?Math.round(sgames.reduce((s,g)=>s+(g.h===soid?g.as:g.hs),0)/sgames.length):'-';const runPct=Math.round(schemeRunPct(so)*100);return(<div style={{background:C.cd,border:`1px solid #d97706`,borderRadius:5,padding:"6px 8px",marginBottom:8}}><div style={{fontSize:9,fontWeight:700,color:C.gd,marginBottom:4}}>SCOUTING REPORT — WK {nug.wk} vs {so.city} {so.name}</div><div style={{display:"flex",gap:12,flexWrap:"wrap",fontSize:9}}><div><span style={{color:C.mt}}>Record </span><span style={{fontWeight:700,color:"#e2e8f0"}}>{so.w}-{so.l}</span>  <span style={{color:C.mt}}>PF/G </span><span style={{color:C.gn}}>{avgPF}</span>  <span style={{color:C.mt}}>PA/G </span><span style={{color:C.rd}}>{avgPA}</span></div><div><span style={{color:C.mt}}>OFF </span><span style={{fontWeight:700,color:"#e2e8f0"}}>{so.coach?.oc?.scheme||'Balanced'}</span><span style={{color:C.mt}}> {runPct}% run</span>{soff&&<><span style={{color:C.mt}}> • </span><span style={{color:"#e2e8f0"}}>{soff.name} <span style={{color:oC(soff.ovr)}}>{soff.pos} {soff.ovr}</span></span></>}</div><div><span style={{color:C.mt}}>DEF </span><span style={{fontWeight:700,color:"#e2e8f0"}}>{so.coach?.dc?.scheme||'4-3'}</span>{sdef&&<><span style={{color:C.mt}}> • </span><span style={{color:"#e2e8f0"}}>{sdef.name} <span style={{color:oC(sdef.ovr)}}>{sdef.pos} {sdef.ovr}</span></span></>}</div></div></div>);})()}
      {sp==="regular"&&<div style={{background:C.cd,border:`1px solid ${C.bd}`,borderRadius:5,padding:"6px 8px",marginBottom:8}}>
        <div style={{fontSize:9,fontWeight:700,color:C.gd,marginBottom:4}}>🎯 GAME PLAN</div>
        <div style={{display:"flex",gap:3,marginBottom:4,alignItems:"center"}}>
          <span style={{fontSize:8,color:C.mt,minWidth:26}}>OFF</span>
          {[['run_heavy','🦶 Run Heavy'],['balanced','⚖️ Balanced'],['pass_heavy','🏈 Pass Heavy']].map(([v,l])=><button key={v} onClick={()=>setGamePlan(p=>({...p,off:v}))} style={{background:gamePlan.off===v?`${C.gn}33`:"transparent",color:gamePlan.off===v?C.gn:C.mt,border:`1px solid ${gamePlan.off===v?C.gn:C.bd}`,borderRadius:3,padding:"2px 7px",fontSize:8,fontWeight:700,cursor:"pointer"}}>{l}</button>)}
        </div>
        <div style={{display:"flex",gap:3,alignItems:"center"}}>
          <span style={{fontSize:8,color:C.mt,minWidth:26}}>DEF</span>
          {[['conservative','🛡️ Conservative'],['aggressive','⚡ Aggressive'],['prevent','🔒 Prevent']].map(([v,l])=><button key={v} onClick={()=>setGamePlan(p=>({...p,def:v}))} style={{background:gamePlan.def===v?`${C.gn}33`:"transparent",color:gamePlan.def===v?C.gn:C.mt,border:`1px solid ${gamePlan.def===v?C.gn:C.bd}`,borderRadius:3,padding:"2px 7px",fontSize:8,fontWeight:700,cursor:"pointer"}}>{l}</button>)}
        </div>
      </div>}
      {Array.from({length:18},(_, w)=>w+1).map(week=>{const games=sched.filter(g=>g.wk===week);const ug=games.find(g=>g.h===ui||g.a===ui);
        return(<div key={week} style={{marginBottom:8}}>
          <div style={{fontSize:9,fontWeight:700,color:C.gd,marginBottom:3}}>WEEK {week}</div>
          {!ug&&byeMap[ui]===week&&<div style={{background:"#7c3aed22",border:"1px solid #7c3aed44",borderRadius:4,padding:"4px 8px",marginBottom:3,fontSize:9,color:"#a78bfa",fontWeight:700}}>🛋️ BYE WEEK — {teams[ui]?.ab} has the week off</div>}
          {games.map((g,i)=>{const isU=g.h===ui||g.a===ui;const isRiv=isU&&rivalry&&(g.h===rivalry.teamId||g.a===rivalry.teamId);
            return(<div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 6px",background:isRiv?`${"#f97316"}12`:isU?`${C.gn}08`:"transparent",borderLeft:isRiv?`3px solid #f97316`:isU?`3px solid ${C.gn}`:"3px solid transparent",fontSize:10}}>
              {isRiv&&<span style={{fontSize:7,color:"#f97316",fontWeight:800}}>🔥 RIVALRY</span>}
              <span style={{fontWeight:g.played&&g.hs>g.as?800:400,minWidth:36}}>{teams[g.h]?.ab}</span>
              <span style={{color:C.mt,fontSize:9}}>{g.played?`${g.hs} - ${g.as}`:"vs"}</span>
              <span style={{fontWeight:g.played&&g.as>g.hs?800:400,minWidth:36}}>{teams[g.a]?.ab}</span>
              {g.played&&(g.boxH||g.boxA)&&<button onClick={()=>setBoxView(g)} style={{background:`${C.bl}22`,color:C.bl,border:`1px solid ${C.bl}44`,padding:"1px 5px",borderRadius:3,fontSize:8,fontWeight:700,cursor:"pointer"}}>📊 Box</button>}
              {!g.played&&isU&&sp==="regular"&&wk<week&&<><button onClick={()=>startLiveSim(g)} style={{background:`${C.gn}22`,color:C.gn,border:`1px solid ${C.gn}44`,padding:"1px 5px",borderRadius:3,fontSize:8,fontWeight:700,cursor:"pointer"}}>⚡ Live Sim</button><button onClick={()=>exportGameToPlay(g)} style={{background:"#7c3aed22",color:"#a78bfa",border:"1px solid #7c3aed44",padding:"1px 5px",borderRadius:3,fontSize:8,fontWeight:700,cursor:"pointer"}}>🎮 Play</button></>}
            </div>);})}
        </div>);})}
    </div>}

    {/* STATS */}
    {tab==="stats"&&<div>
      <div style={{display:"flex",gap:3,marginBottom:8,flexWrap:"wrap"}}>{["passing","rushing","receiving","defense","kicking"].map(g=><button key={g} onClick={()=>setSf(g)} style={{background:sf===g?C.bl+"33":"transparent",color:sf===g?"#fff":C.mt,border:`1px solid ${sf===g?C.bl:C.bd}`,padding:"2px 8px",borderRadius:3,fontSize:9,fontWeight:700,cursor:"pointer",textTransform:"capitalize"}}>{g}</button>)}</div>
      {leaders[sf]&&Object.entries(leaders[sf]).map(([st,pls])=><div key={st} style={{marginBottom:10}}>
        <div style={{fontSize:9,fontWeight:700,color:C.gd,marginBottom:3}}>{sL(st)}</div>
        {pls.map((p,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:4,padding:"2px 4px",fontSize:10}}>
          <span style={{color:C.mt,fontWeight:700,minWidth:14}}>{i+1}</span>
          <Face s={p.face} sz={18}/><PN p={p} setSel={setSel} style={{flex:1}}/><Bdg pos={p.pos}/>
          <span style={{color:C.mt,fontSize:9}}>{p.tm}</span>
          <span style={{fontWeight:800,color:oC(p.ss?.[st]||0),minWidth:40,textAlign:"right"}}>{fm(p.ss?.[st])}</span>
          {(p.ss?.gp||0)>0&&<span style={{color:C.mt,fontSize:7,minWidth:36,textAlign:"right"}}>{(+(p.ss?.[st]||0)/(p.ss.gp)).toFixed(1)}/g</span>}
        </div>)}</div>)}
    </div>}

    {/* SCOUTING */}
    {tab==="scouting"&&<div>
      <div style={{display:"flex",gap:8,marginBottom:8,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:9,color:C.gd}}>Scout Pts: <b>{scPts}</b></span>
        {myScout?<div style={{display:"flex",alignItems:"center",gap:4,padding:"3px 6px",background:C.cd,borderRadius:5,fontSize:10}}><Face s={myScout.face} sz={18}/><span style={{fontWeight:700}}>{myScout.name}</span><span style={{color:C.mt,fontSize:8}}>EVL:{myScout.evaluation} ACC:{myScout.accuracy}</span>
        <Btn onClick={()=>{setFaScouts(pr=>[...pr,myScout]);setMyScout(null);sm("Fired.");}} bg="#7f1d1d" c="#fca5a5">Fire</Btn></div>:<span style={{color:C.rd,fontSize:10}}>No scout hired</span>}
      </div>
      {!myScout&&faScouts.length>0&&<div style={{marginBottom:8}}><div style={{fontSize:8,color:C.mt,marginBottom:3}}>AVAILABLE SCOUTS</div>{faScouts.map(s=><div key={s.id} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 6px",fontSize:10,borderBottom:`1px solid ${C.bd}11`}}><Face s={s.face} sz={18}/><span style={{fontWeight:600,flex:1}}>{s.name}</span><span style={{color:C.mt,fontSize:8}}>EVL:{s.evaluation} ACC:{s.accuracy} SPD:{s.speed}</span><span style={{color:"#a78bfa",fontSize:8}}>{s.trait}</span><Btn onClick={()=>{setMyScout(s);setFaScouts(pr=>pr.filter(x=>x.id!==s.id));sm(`Hired ${s.name}`);}} disabled={!!myScout} bg={myScout?C.mt:`${C.gn}22`} c={myScout?C.mt:C.gn} style={{padding:"2px 6px",fontSize:8}}>Hire</Btn></div>)}</div>}
      {myScout&&(()=>{const cls=dc[scView||yr]||[];const tops=POS.map(pos=>{const sp2=cls.filter(x=>x.pos===pos&&x.scoutLvl>=1);if(!sp2.length)return null;const best=sp2.reduce((a,b)=>(b.scoutLvl>=2?b.trueOvr:b.scoutedOvr||0)>(a.scoutLvl>=2?a.trueOvr:a.scoutedOvr||0)?b:a);return{pos,p:best,ovr:best.scoutLvl>=2?best.trueOvr:best.scoutedOvr||0};}).filter(Boolean).sort((a,b)=>b.ovr-a.ovr).slice(0,5);return tops.length>0?<div style={{marginBottom:8}}><div style={{fontSize:8,color:C.gd,fontWeight:700,marginBottom:4}}>TOP PROSPECTS BY POSITION</div><div style={{display:"flex",gap:5,overflowX:"auto",paddingBottom:4}}>{tops.map((t,i)=><div key={t.pos} style={{minWidth:80,background:C.cd,borderRadius:6,padding:"5px 7px",border:`1px solid ${C.bd}`,flexShrink:0}}><div style={{display:"flex",alignItems:"center",gap:3,marginBottom:2}}><span style={{color:C.mt,fontSize:8,fontWeight:700}}>#{i+1}</span><Bdg pos={t.pos}/></div><div style={{fontSize:9,fontWeight:700,color:"#e2e8f0",marginBottom:1,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:66}}>{t.p.name}</div><div style={{display:"flex",alignItems:"center",gap:4}}><span style={{fontSize:8,color:C.mt}}>{t.p.age}yo</span><span style={{fontSize:9,fontWeight:700,padding:"1px 5px",borderRadius:3,background:t.ovr>=85?"#14532d":t.ovr>=72?"#1e3a5f":"#3b1010",color:t.ovr>=85?"#86efac":t.ovr>=72?"#7dd3fc":"#fca5a5"}}>{scGrade(t.ovr)}</span></div></div>)}</div></div>:null;})()}
      <div style={{display:"flex",gap:3,marginBottom:4}}>{draftYears.map(y=><button key={y} onClick={()=>setScView(y)} style={{background:(scView||yr)===y?"#1e293b":"transparent",color:(scView||yr)===y?"#fff":C.mt,border:`1px solid ${C.bd}`,padding:"3px 8px",borderRadius:3,fontSize:8,fontWeight:700,cursor:"pointer"}}>{y}{y===yr?" ★":""}</button>)}</div>
      <div style={{display:"flex",gap:2,marginBottom:5,flexWrap:"wrap"}}>{["ALL",...POS].map(p=><button key={p} onClick={()=>setScPosF(p)} style={{background:scPosF===p?C.bl+"33":"transparent",color:scPosF===p?"#fff":C.mt,border:`1px solid ${scPosF===p?C.bl:C.bd}`,padding:"2px 5px",borderRadius:3,fontSize:8,fontWeight:700,cursor:"pointer"}}>{p}</button>)}</div>
      {(dc[scView||yr]||[]).filter(p=>scPosF==="ALL"||p.pos===scPosF).slice(0,30).map((p,i)=><div key={p.id} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 5px",borderBottom:`1px solid ${C.bd}11`,fontSize:10}}>
        <span style={{color:C.mt,fontWeight:700,minWidth:16}}>{i+1}</span><Face s={p.face} sz={20}/><PN p={p} setSel={setSel} style={{flex:1}}/><Bdg pos={p.pos}/>
        <span style={{color:"#94a3b8",fontSize:8}}>{p.age} • {p.bio?.college}</span>
        <span style={{color:p.scoutLvl>=2?oC(p.trueOvr):p.scoutLvl>=1?"#94a3b8":"#475569",fontWeight:700,fontSize:9}}>{p.scoutLvl>=2?p.trueOvr:p.scoutLvl>=1?`~${p.scoutedOvr}`:"??"}</span>
        {p.scoutLvl<2&&<Btn onClick={()=>scoutPlayer(p.id,scView||yr)} disabled={scPts<3||!myScout} bg={`${C.bl}22`} c={C.bl} style={{padding:"1px 5px",fontSize:8}}>Scout</Btn>}
      </div>)}
    </div>}

    {/* TRADE */}
    {tab==="trade"&&<div>
      {wk>=10&&sp==='regular'&&<div style={{background:"#7f1d1d22",border:"1px solid #ef4444",borderRadius:5,padding:"5px 10px",marginBottom:6,fontSize:9,fontWeight:700,color:"#ef4444"}}>TRADE DEADLINE PASSED — No trades after Week 10</div>}
      {sp==="regular"&&wk>=7&&wk<10&&<div style={{background:"#7c3aed22",border:"1px solid #7c3aed44",borderRadius:4,padding:"5px 8px",marginBottom:6,fontSize:9,color:"#a78bfa",fontWeight:700}}>⚡ TRADE DEADLINE SURGE — Week {10-wk} week{10-wk!==1?"s":""} remaining. AI teams actively dealing!</div>}
      <div style={{display:"flex",gap:2,flexWrap:"wrap",marginBottom:6}}>{teams.filter(t=>t.id!==ui).map(t=><button key={t.id} onClick={()=>{setTrTm(t.id);setTrOff({g:[],r:[],gPk:[],rPk:[]});}} style={{background:trTm===t.id?`${t.clr}cc`:"transparent",color:trTm===t.id?"#fff":C.mt,border:`1px solid ${trTm===t.id?t.ac:C.bd}`,padding:"2px 5px",borderRadius:3,fontSize:8,fontWeight:700,cursor:"pointer"}}>{t.ab}</button>)}</div>
      {trTm!=null&&<div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        {[{label:"YOU SEND",color:C.gn,roster:ut?.roster,picks:draftPicks.filter(pk=>pk.owner===ui),sel:trOff.g,selPk:trOff.gPk,toggleP:p=>{if(trOff.g.find(x=>x.id===p.id))setTrOff(pr=>({...pr,g:pr.g.filter(x=>x.id!==p.id)}));else setTrOff(pr=>({...pr,g:[...pr.g,p]}));},togglePk:pk=>{if(trOff.gPk.find(x=>x.id===pk.id))setTrOff(pr=>({...pr,gPk:pr.gPk.filter(x=>x.id!==pk.id)}));else setTrOff(pr=>({...pr,gPk:[...pr.gPk,pk]}));}},
          {label:"YOU GET",color:C.bl,roster:teams[trTm]?.roster,picks:draftPicks.filter(pk=>pk.owner===trTm),sel:trOff.r,selPk:trOff.rPk,toggleP:p=>{if(trOff.r.find(x=>x.id===p.id))setTrOff(pr=>({...pr,r:pr.r.filter(x=>x.id!==p.id)}));else setTrOff(pr=>({...pr,r:[...pr.r,p]}));},togglePk:pk=>{if(trOff.rPk.find(x=>x.id===pk.id))setTrOff(pr=>({...pr,rPk:pr.rPk.filter(x=>x.id!==pk.id)}));else setTrOff(pr=>({...pr,rPk:[...pr.rPk,pk]}));}}
        ].map(({label,color,roster,picks,sel:s2,selPk,toggleP,togglePk})=><div key={label} style={{flex:"1 1 260px"}}>
          <div style={{fontSize:8,fontWeight:700,color,marginBottom:2}}>{label}</div>
          <div style={{maxHeight:180,overflowY:"auto"}}>{(roster||[]).sort((a,b)=>b.ovr-a.ovr).map(p=><div key={p.id} onClick={()=>toggleP(p)} style={{display:"flex",alignItems:"center",gap:3,padding:"2px 4px",cursor:"pointer",background:s2.find(x=>x.id===p.id)?`${color}22`:"transparent",borderRadius:3,fontSize:9}}>
            <Face s={p.face} sz={14}/><Bdg pos={p.pos}/><PN p={p} setSel={setSel} style={{flex:1}}/><span style={{color:oC(p.ovr),fontWeight:800}}>{p.ovr}</span><span style={{color:C.mt,fontSize:7}}>TV:{p.tradeVal}</span>
          </div>)}</div>
          {picks.length>0&&<><div style={{fontSize:7,fontWeight:700,color:C.gd,marginTop:3}}>DRAFT PICKS</div>{picks.map(pk=><div key={pk.id} onClick={()=>togglePk(pk)} style={{display:"flex",alignItems:"center",gap:3,padding:"2px 4px",cursor:"pointer",background:selPk.find(x=>x.id===pk.id)?`${C.gd}22`:"transparent",borderRadius:3,fontSize:9}}><span style={{fontWeight:700}}>Rd{pk.rd} #{pk.overall}</span><span style={{color:C.mt,fontSize:7}}>from {TEAMS[pk.orig].ab}</span><span style={{color:C.gd,fontSize:7}}>Val:{Math.round((PICK_VAL[pk.overall]||1)/50)}</span></div>)}</>}
        </div>)}
      </div>}
      {trTm!=null&&(trOff.g.length>0||trOff.r.length>0||trOff.gPk.length>0||trOff.rPk.length>0)&&(()=>{const ev=evalTr();return<div style={{marginTop:6,padding:8,background:C.cd,borderRadius:5,border:`1px solid ${C.bd}`}}>
        <div style={{display:"flex",justifyContent:"space-between",fontSize:10}}><span>Send: <b style={{color:C.rd}}>TV {ev.gv}</b></span><span>Get: <b style={{color:C.gn}}>TV {ev.rv}</b></span></div>
        <div style={{fontSize:10,margin:"3px 0",color:ev.fair?C.gn:ev.d>0?C.gn:C.rd,fontWeight:700}}>{ev.fair?"✅ Fair":ev.d>0?"✅ Good deal":"❌ Need more value"}</div>
        <Btn onClick={execTr} bg={C.gn}>Execute Trade</Btn>
      </div>;})()}
    </div>}

    {/* DRAFT */}
    {tab==="draft"&&<div>
      {sp==="draft"&&draftActive&&curPick?<div>
        <div style={{background:`linear-gradient(135deg,${TEAMS[curPick.owner].clr},#1e293b)`,borderRadius:8,padding:10,marginBottom:8,display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <div><div style={{fontSize:8,color:"#fff8",textTransform:"uppercase"}}>Round {curPick.rd} — Pick #{curPick.overall}</div>
            <div style={{fontSize:14,fontWeight:900,color:"#fff"}}>{TEAMS[curPick.owner].city} {TEAMS[curPick.owner].name}{curPick.owner===ui?" (YOU)":""}</div></div>
          <div style={{textAlign:"right"}}><div style={{fontSize:24,fontWeight:900,color:draftTimer<=10?C.rd:C.gd}}>{Math.floor(draftTimer/60)}:{String(draftTimer%60).padStart(2,"0")}</div>
            <div style={{fontSize:8,color:"#fff8"}}>{draftPaused?"PAUSED":"ON THE CLOCK"}</div></div>
        </div>
        {curPick.owner===ui&&<div style={{fontSize:9,color:C.gn,fontWeight:700,marginBottom:5}}>🎯 Your pick!</div>}
        <div style={{display:"flex",gap:2,marginBottom:4,flexWrap:"wrap"}}>{["ALL",...POS].map(p=><button key={p} onClick={()=>setDrPosF(p)} style={{background:drPosF===p?C.bl+"33":"transparent",color:drPosF===p?"#fff":C.mt,border:`1px solid ${drPosF===p?C.bl:C.bd}`,padding:"2px 5px",borderRadius:3,fontSize:8,fontWeight:700,cursor:"pointer"}}>{p}</button>)}</div>
        {(dc[yr]||[]).filter(p=>drPosF==="ALL"||p.pos===drPosF).slice(0,20).map((p,i)=><div key={p.id} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 5px",borderBottom:`1px solid ${C.bd}11`,fontSize:10}}>
          <span style={{color:C.mt,fontWeight:700,minWidth:16}}>{i+1}</span><Face s={p.face} sz={20}/><PN p={p} setSel={setSel} style={{flex:1}}/><Bdg pos={p.pos}/>
          <span style={{color:"#94a3b8",fontSize:8}}>{p.age} • {p.bio?.college}</span>
          <span style={{color:p.scoutLvl>=2?oC(p.trueOvr):"#94a3b8",fontWeight:700,fontSize:9}}>{p.scoutLvl>=2?p.trueOvr:p.scoutLvl>=1?`~${p.scoutedOvr}`:"??"}</span>
          {curPick.owner===ui&&<Btn onClick={()=>makePick(p)} bg={C.gn} style={{padding:"2px 6px"}}>Draft</Btn>}
        </div>)}
      </div>:<div>
        <div style={{display:"flex",gap:3,marginBottom:6}}>{draftYears.map(y=><button key={y} onClick={()=>setScView(y)} style={{background:(scView||yr)===y?"#1e293b":"transparent",color:(scView||yr)===y?"#fff":C.mt,border:`1px solid ${C.bd}`,padding:"3px 8px",borderRadius:3,fontSize:8,fontWeight:700,cursor:"pointer"}}>{y}{y===yr?" ★":""}</button>)}</div>
        {sp==="combine"&&<div style={{background:"#7c3aed22",border:"1px solid #7c3aed44",borderRadius:5,padding:"4px 8px",fontSize:9,color:"#c4b5fd",marginBottom:6}}>✅ Combine & Pro Days complete!</div>}
        <div style={{display:"flex",gap:2,marginBottom:5,flexWrap:"wrap"}}>{["ALL",...POS].map(p=><button key={p} onClick={()=>setDrPosF(p)} style={{background:drPosF===p?C.bl+"33":"transparent",color:drPosF===p?"#fff":C.mt,border:`1px solid ${drPosF===p?C.bl:C.bd}`,padding:"2px 5px",borderRadius:3,fontSize:8,fontWeight:700,cursor:"pointer"}}>{p}</button>)}</div>
        {(dc[scView||yr]||[]).filter(p=>drPosF==="ALL"||p.pos===drPosF).slice(0,30).map((p,i)=><div key={p.id} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 5px",borderBottom:`1px solid ${C.bd}11`,fontSize:10}}>
          <span style={{color:C.mt,fontWeight:700,minWidth:16}}>{i+1}</span><Face s={p.face} sz={20}/><PN p={p} setSel={setSel} style={{flex:1}}/><Bdg pos={p.pos}/>
          <span style={{color:"#94a3b8",fontSize:8}}>{p.age} • {htS(p.ht_)} {p.wt} • {p.bio?.college}</span>
          <span style={{fontSize:8,color:p.scoutLvl>=2?oC(p.trueOvr):p.scoutLvl>=1?"#94a3b8":"#475569",fontWeight:700}}>{p.scoutLvl>=2?p.trueOvr:p.scoutLvl>=1?`~${p.scoutedOvr}`:"??"}</span>
        </div>)}
      </div>}
      {draftLog.length>0&&<div style={{marginTop:10}}><div style={{fontSize:9,fontWeight:700,color:C.gd,marginBottom:3}}>DRAFT LOG</div>{draftLog.slice().reverse().slice(0,15).map((d,i)=><div key={i} style={{padding:"2px 5px",fontSize:9,color:d.owner===ui?C.gn:"#94a3b8",borderLeft:d.owner===ui?`3px solid ${C.gn}`:"3px solid transparent"}}>{d.text}</div>)}</div>}
    </div>}

    {/* FREE AGENCY */}
    {tab==="freeagency"&&<div>
      <div style={{fontSize:9,color:C.mt,marginBottom:5}}>Cap space: <span style={{color:capSpace(ut||{})>=0?C.gn:C.rd,fontWeight:700}}>${capSpace(ut||{}).toFixed(1)}M</span> of ${CAP_CEILING}M • Used: ${capHit(ut||{}).toFixed(1)}M{(ut?.deadCap||0)>0&&<span style={{color:C.rd}}> • Dead: ${(ut?.deadCap||0).toFixed(1)}M</span>} • {fa.length} free agents</div>
      {waivers.length>0&&<div style={{marginBottom:8}}>
        <div style={{fontSize:10,fontWeight:700,color:"#f59e0b",marginBottom:4}}>⚡ WAIVER WIRE ({waivers.length})</div>
        {waivers.map(p=><div key={p.id} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 5px",borderBottom:`1px solid ${C.bd}11`,fontSize:10}}>
          <Face s={p.face} sz={18}/><Bdg pos={p.pos}/><PN p={p} setSel={setSel} style={{flex:1}}/>
          <span style={{color:oC(p.ovr),fontWeight:800}}>{p.ovr}</span>
          <span style={{color:C.mt,fontSize:8}}>Wk{p.waiverWk}</span>
          <Btn onClick={()=>{signP(p);setWaivers(pr=>pr.filter(x=>x.id!==p.id));}} bg={C.gn} style={{padding:"2px 6px",fontSize:8}} disabled={capSpace(ut||{})<p.salary}>Claim</Btn>
        </div>)}
      </div>}
      <PlayerTable players={fa} setSel={setSel} sortCol={faSc} sortDir={faSd} onSort={tgFS} posFilter={faPosF} setPosFilter={setFaPosF} showSign={true} onSign={signP}/>
    </div>}

    {/* PLAYOFFS */}
    {tab==="playoffs"&&<div>{pb?<div>
      <div style={{fontSize:12,fontWeight:700,marginBottom:8,color:pb.ch!=null?C.gd:C.tx}}>{pb.ch!=null?`🏆 ${teams[pb.ch].city} ${teams[pb.ch].name} are Champions!`:`Round ${pb.rd}`}</div>
      {pb.res.map((r,i)=><div key={i} style={{display:"flex",gap:5,padding:"4px 6px",background:r.w===ui?`${C.gn}11`:C.cd,borderRadius:4,marginBottom:2,fontSize:10}}>
        <span style={{fontWeight:r.w===r.h?800:400}}>{teams[r.h]?.ab} {r.hs}</span><span style={{color:"#475569"}}>—</span><span style={{fontWeight:r.w===r.a?800:400}}>{r.as} {teams[r.a]?.ab}</span></div>)}
      {pb.ch==null&&pb.m.map(([a,b],i)=><div key={i} style={{display:"flex",gap:5,padding:"5px 8px",background:C.cd,borderRadius:5,marginBottom:2,fontSize:11,border:(a===ui||b===ui)?`1px solid ${C.gn}44`:`1px solid ${C.bd}`}}><span style={{fontWeight:700}}>{teams[a]?.ab}</span><span style={{color:"#475569",fontSize:9}}>vs</span><span style={{fontWeight:700}}>{teams[b]?.ab}</span></div>)}
    </div>:<div style={{color:C.mt,fontSize:11,textAlign:"center",padding:16}}>Complete the season first.</div>}</div>}

    {/* LIVE SIM */}
    {tab==="livesim"&&liveSim&&<div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:4}}><div style={{width:14,height:14,borderRadius:3,background:TEAMS[liveSim.h].clr}}/><span style={{fontWeight:900,fontSize:16}}>{teams[liveSim.h]?.ab}</span><span style={{fontWeight:900,fontSize:20,color:C.gd}}>{liveScore.h}</span></div>
          <span style={{color:C.mt,fontSize:10}}>vs</span>
          <div style={{display:"flex",alignItems:"center",gap:4}}><span style={{fontWeight:900,fontSize:20,color:C.gd}}>{liveScore.a}</span><span style={{fontWeight:900,fontSize:16}}>{teams[liveSim.a]?.ab}</span><div style={{width:14,height:14,borderRadius:3,background:TEAMS[liveSim.a].clr}}/></div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:4}}>
          <span style={{fontSize:9,padding:"2px 6px",borderRadius:8,background:liveDone?`${C.gd}22`:`${C.gn}22`,color:liveDone?C.gd:C.gn,fontWeight:700}}>Q{liveQtr}{liveDone?" FINAL":""}</span>
          {!liveDone&&<Btn onClick={()=>setLiveCallMode(m=>!m)} bg={liveCallMode?`${C.gn}33`:C.bd} c={liveCallMode?C.gn:C.mt} style={{padding:"3px 8px",border:`1px solid ${liveCallMode?C.gn:C.bd}`,fontSize:8}}>🎮{liveCallMode?" ON":" OFF"}</Btn>}
          {!liveDone&&!liveAwaitingCall&&<Btn onClick={()=>setLivePaused(p=>!p)} bg={livePaused?"#22c55e":"#f97316"} style={{padding:"3px 8px"}}>{livePaused?"▶":"⏸"}</Btn>}
          <Btn onClick={()=>{setLiveSim(null);setTab("schedule");}} bg={C.bd} style={{padding:"3px 8px"}}>✕</Btn>
        </div>
      </div>
      {!liveDone&&<div style={{fontSize:9,color:C.mt,marginBottom:4}}>
        {livePoss==="h"?teams[liveSim.h]?.ab:teams[liveSim.a]?.ab} ball • {liveDown}{liveDown===1?"st":liveDown===2?"nd":liveDown===3?"rd":"th"} & {liveToGo} • Ball at {liveYard} yd line{liveCallMode&&<span style={{marginLeft:6,color:livePhase==="passing"?C.bl:livePhase==="running"?C.gd:livePhase==="presnap"?C.rd:liveAwaitingCall?C.gn:C.mt}}>{livePhase==="presnap"?"🏈 Pre-snap":livePhase==="passing"?"🎯 Find receiver":livePhase==="running"?"💨 Break tackle":liveAwaitingCall?"🎮 Your call":"⏱ Auto"}</span>}
      </div>}
      {/* PlayCall Panel */}
      {liveCallMode&&liveAwaitingCall&&!liveDone&&!livePhase&&(()=>{
        const offT=livePoss==="h"?teams[liveSim.h]:teams[liveSim.a];
        const defT=livePoss==="h"?teams[liveSim.a]:teams[liveSim.h];
        if(liveDown===4&&!fourthChoice){const k4=offT.roster.filter(p=>p.pos==="K"&&!p.injured).sort((a,b)=>b.ovr-a.ovr)[0];const inRng=liveYard>=52;return<div style={{background:`${C.rd}12`,border:`1px solid ${C.rd}33`,borderRadius:8,padding:8,marginBottom:8}}><div style={{fontSize:8,color:C.rd,fontWeight:800,marginBottom:6,letterSpacing:1}}>4th & {liveToGo} • Yd {liveYard} — DECISION TIME</div><div style={{display:"flex",flexDirection:"column",gap:4}}><button onClick={()=>advanceLivePlay("punt")} style={{background:`${C.mt}22`,border:`1px solid ${C.mt}44`,borderRadius:5,padding:"7px 10px",cursor:"pointer",color:"#fff",fontWeight:700,fontSize:10,textAlign:"left"}}>⬆️ Punt — Give up possession</button>{inRng&&k4&&<button onClick={()=>advanceLivePlay("fg")} style={{background:`${C.gd}22`,border:`1px solid ${C.gd}44`,borderRadius:5,padding:"7px 10px",cursor:"pointer",color:"#fff",fontWeight:700,fontSize:10,textAlign:"left"}}>🎯 FG — {k4.name} ({k4.ovr} OVR)</button>}<button onClick={()=>setFourthChoice("goforit")} style={{background:`${C.gn}22`,border:`1px solid ${C.gn}44`,borderRadius:5,padding:"7px 10px",cursor:"pointer",color:C.gn,fontWeight:900,fontSize:10,textAlign:"left"}}>💪 Go For It — 4th & {liveToGo}</button></div></div>;}
        const pcQB=offT.roster.filter(p=>p.pos==="QB"&&!p.injured).sort((a,b)=>b.ovr-a.ovr)[0];
        const pcRB=offT.roster.filter(p=>p.pos==="RB"&&!p.injured).sort((a,b)=>b.ovr-a.ovr)[0];
        const pcDL=defT.roster.filter(p=>p.pos==="DL"&&!p.injured).sort((a,b)=>b.ovr-a.ovr)[0];
        const pcDB=defT.roster.filter(p=>["CB","S"].includes(p.pos)&&!p.injured).sort((a,b)=>b.ovr-a.ovr)[0];
        const CALLS=[
          {id:"run_inside",l:"Inside Run",s:"run",tip:`${pcRB?.name||"RB"} (${pcRB?.ovr||"??"}) vs DL (${pcDL?.ovr||"??"})`},
          {id:"run_outside",l:"Outside Run",s:"run",tip:`Speed: ${pcRB?.spd||"??"} SPD`},
          {id:"run_screen",l:"Screen Pass",s:"run",tip:`High YAC potential`},
          {id:"scramble",l:"QB Scramble",s:"run",tip:`${pcQB?.name||"QB"} — ${pcQB?.spd||"??"} SPD`},
          {id:"pass_quick",l:"Quick Pass",s:"pass",tip:`Safe — INT risk ▼`},
          {id:"pass_medium",l:"Medium Route",s:"pass",tip:`Balanced — ${pcQB?.name||"QB"} (${pcQB?.ovr||"??"})`},
          {id:"pass_deep",l:"Deep Shot",s:"pass",tip:`High reward — INT risk ▲`},
          {id:"pass_rpo",l:"RPO",s:"pass",tip:`Read-pass option`},
        ];
        const dnStr=["","1st","2nd","3rd","4th"][liveDown]||"";
        return<div style={{background:`${C.bl}18`,border:`1px solid ${C.bl}55`,borderRadius:8,padding:8,marginBottom:8}}>
          <div style={{fontSize:8,color:C.gn,fontWeight:800,marginBottom:3,letterSpacing:1}}>🎮 YOUR CALL — {dnStr} & {liveToGo} • Yd {liveYard}</div>
          {offT.coach?.oc&&<div style={{fontSize:7,color:"#a78bfa",marginBottom:4}}>📋 {offT.coach.oc.scheme} • {Math.round(schemeRunPct(offT)*100)}% run tendency</div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
            {["run","pass"].map(side=><div key={side}>
              <div style={{fontSize:7,color:C.mt,fontWeight:700,marginBottom:2,textTransform:"uppercase"}}>{side==="run"?"🦶 Run":"🏈 Pass"}</div>
              {CALLS.filter(c=>c.s===side).map(c=><button key={c.id} onClick={()=>selectCall(c.id)} style={{width:"100%",background:side==="run"?`${C.gd}14`:`${C.bl}14`,border:`1px solid ${side==="run"?C.gd:C.bl}33`,borderRadius:3,padding:"4px 6px",marginBottom:2,cursor:"pointer",textAlign:"left",color:"#fff",display:"block"}}>
                <div style={{fontSize:9,fontWeight:700}}>{c.l}</div>
                <div style={{fontSize:7,color:C.mt}}>{c.tip}</div>
              </button>)}
            </div>)}
          </div>
        </div>;
      })()}
      {/* Pre-snap */}
      {liveCallMode&&livePhase==="presnap"&&!liveDone&&(()=>{
        const defT=livePoss==="h"?teams[liveSim.a]:teams[liveSim.h];
        const dcScheme=defT.coach?.dc?.scheme||"4-3";
        const isZone=dcScheme==="Cover 2"||dcScheme==="Zone Blitz";
        const isBlitz=dcScheme==="Zone Blitz"||dcScheme==="3-4";
        const callLabel={run_inside:"Inside Run",run_outside:"Outside Run",run_screen:"Screen",scramble:"QB Scramble",pass_quick:"Quick Pass",pass_medium:"Medium Route",pass_deep:"Deep Shot",pass_rpo:"RPO"}[livePendingCall]||livePendingCall;
        return<div style={{background:`${C.rd}14`,border:`1px solid ${C.rd}44`,borderRadius:8,padding:8,marginBottom:8}}>
          <div style={{fontSize:8,color:C.rd,fontWeight:800,marginBottom:4,letterSpacing:1}}>🏈 PRE-SNAP READ</div>
          <div style={{fontSize:9,color:C.mt,marginBottom:6}}>Called: <b style={{color:C.tx}}>{callLabel}</b></div>
          <div style={{display:"flex",gap:4,marginBottom:8,flexWrap:"wrap"}}>
            <div style={{fontSize:9,background:C.cd,borderRadius:4,padding:"3px 7px"}}>DEF: <b>{dcScheme}</b></div>
            <div style={{fontSize:9,background:C.cd,borderRadius:4,padding:"3px 7px"}}>{isZone?"🛡 Zone":"👤 Man coverage"}</div>
            {isBlitz&&<div style={{fontSize:9,background:`${C.rd}33`,borderRadius:4,padding:"3px 7px",color:C.rd}}>⚡ Blitz likely</div>}
          </div>
          <div style={{display:"flex",gap:4}}>
            <Btn onClick={()=>setLivePhase(null)} bg={C.bd} style={{flex:1,fontSize:9}}>← Audible</Btn>
            <Btn onClick={hikeSnap} bg={C.gn} style={{flex:2,fontSize:12,fontWeight:900,letterSpacing:1}}>HIKE ▶</Btn>
          </div>
        </div>;
      })()}
      {/* Passing QTE */}
      {liveCallMode&&livePhase==="passing"&&!liveDone&&<div style={{background:`${C.bl}14`,border:`1px solid ${C.bl}55`,borderRadius:8,padding:8,marginBottom:8}}>
        <div style={{fontSize:8,color:C.bl,fontWeight:800,marginBottom:2,letterSpacing:1}}>🎯 FIND YOUR RECEIVER — tap fast!</div>
        <div style={{fontSize:7,color:C.mt,marginBottom:6}}>Open windows shift — covered throws risk INT</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
          {liveRecTargets.map(t=><button key={t.id} onClick={()=>throwTo(t)} style={{background:t.open?`${C.gn}22`:`${C.rd}18`,border:`2px solid ${t.open?C.gn:C.rd}55`,borderRadius:6,padding:"6px 8px",cursor:"pointer",textAlign:"left",color:"#fff",transition:"background 0.3s"}}>
            <div style={{fontSize:9,fontWeight:800}}>{t.name}</div>
            <div style={{fontSize:7,color:C.mt}}>{t.pos} • {t.spd||"??"} SPD</div>
            <div style={{fontSize:8,fontWeight:700,color:t.open?C.gn:C.rd,marginTop:2}}>{t.open?"🟢 OPEN":"🔴 COVERED"}</div>
            <div style={{fontSize:7,color:"#475569"}}>vs {t.cbName} ({t.cbOvr})</div>
          </button>)}
        </div>
      </div>}
      {/* Running QTE */}
      {liveCallMode&&livePhase==="running"&&!liveDone&&(()=>{
        const inPerfect=liveQteBar>=42&&liveQteBar<=58;
        const inGood=liveQteBar>=28&&liveQteBar<=72;
        return<div style={{background:`${C.gd}14`,border:`1px solid ${C.gd}44`,borderRadius:8,padding:8,marginBottom:8}}>
          <div style={{fontSize:8,color:C.gd,fontWeight:800,marginBottom:2,letterSpacing:1}}>💨 BREAK THE TACKLE</div>
          <div style={{fontSize:7,color:C.mt,marginBottom:8}}>Hit the green zone for max yards</div>
          <div style={{position:"relative",height:28,background:C.bd,borderRadius:5,marginBottom:6,overflow:"hidden"}}>
            <div style={{position:"absolute",left:"28%",width:"44%",height:"100%",background:`${C.gd}55`,borderRadius:3}}/>
            <div style={{position:"absolute",left:"42%",width:"16%",height:"100%",background:`${C.gn}99`,borderRadius:3}}/>
            <div style={{position:"absolute",top:2,bottom:2,width:8,borderRadius:4,background:"#fff",boxShadow:"0 0 8px #fff",left:`calc(${liveQteBar}% - 4px)`}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:7,color:C.mt,marginBottom:8}}>
            <span style={{color:C.rd}}>◀ Miss</span><span style={{color:C.gd}}>Good</span><span style={{color:C.gn,fontWeight:700}}>PERFECT</span><span style={{color:C.gd}}>Good</span><span style={{color:C.rd}}>Miss ▶</span>
          </div>
          <button onClick={hitQteBar} style={{width:"100%",padding:"10px",fontSize:13,fontWeight:900,borderRadius:6,border:"none",cursor:"pointer",background:inPerfect?C.gn:inGood?C.gd:C.rd,color:"#fff",letterSpacing:1}}>
            {inPerfect?"⚡ PERFECT! HIT IT!":inGood?"✅ BREAK FREE!":"❌ HIT!"}
          </button>
        </div>;
      })()}
      {/* Field */}
      <div style={{marginBottom:8}}><FieldViz ballYard={liveYard} offClr={TEAMS[livePoss==="h"?liveSim.h:liveSim.a].clr} defClr={TEAMS[livePoss==="h"?liveSim.a:liveSim.h].clr} lastPlay={lastLivePlay} possession={livePoss}/></div>
      {/* POG */}
      {liveDone&&livePOG&&<div style={{background:`linear-gradient(135deg,${C.gd}22,${C.gd}08)`,border:`1px solid ${C.gd}44`,borderRadius:8,padding:10,marginBottom:8,textAlign:"center"}}>
        <div style={{fontSize:9,color:C.gd,fontWeight:700,textTransform:"uppercase",letterSpacing:2}}>🏆 Player of the Game</div>
        <div style={{fontSize:16,fontWeight:900,marginTop:4}}>{livePOG.name}</div>
        <div style={{fontSize:10,color:C.mt,marginTop:2}}>{livePOG.pos} • {livePOG.side==="h"?teams[liveSim.h]?.ab:teams[liveSim.a]?.ab}</div>
        <div style={{display:"flex",justifyContent:"center",gap:10,marginTop:6,fontSize:10}}>
          {livePOG.passYds>0&&<span>Pass: {livePOG.passYds} yds</span>}
          {livePOG.rushYds>0&&<span>Rush: {livePOG.rushYds} yds</span>}
          {livePOG.recYds>0&&<span>Rec: {livePOG.recYds} yds</span>}
          {livePOG.td>0&&<span style={{color:C.gn}}>TD: {livePOG.td}</span>}
          {livePOG.sack>0&&<span>Sacks: {livePOG.sack}</span>}
          {livePOG.int>0&&<span>INT: {livePOG.int}</span>}
        </div>
      </div>}
      {/* Team Stats */}
      {liveDone&&<div style={{display:"flex",gap:8,marginBottom:8}}>
        {["h","a"].map(side=>{const tid=side==="h"?liveSim.h:liveSim.a;
          const stats=Object.values(liveStats[side]||{});
          const totPass=stats.reduce((s,p)=>s+(p.passYds||0),0);
          const totRush=stats.reduce((s,p)=>s+(p.rushYds||0),0);
          const totTD=stats.reduce((s,p)=>s+(p.td||0),0);
          return<div key={side} style={{flex:1,background:C.cd,borderRadius:6,padding:8}}>
            <div style={{fontSize:9,fontWeight:700,color:TEAMS[tid].ac,marginBottom:4}}>{teams[tid]?.name} Recap</div>
            <div style={{fontSize:10,color:"#94a3b8"}}>Pass Yds: {totPass} • Rush Yds: {totRush} • TDs: {totTD}</div>
          </div>;})}
      </div>}
      {/* Live Box Score */}
      <div style={{display:"flex",gap:6,marginBottom:8}}>
        {["h","a"].map(side=>{const tid=side==="h"?liveSim.h:liveSim.a;
          const stats=Object.entries(liveStats[side]||{}).map(([,s])=>s).sort((a,b)=>((b.passYds||0)+(b.rushYds||0)+(b.recYds||0)+(b.td||0)*20)-((a.passYds||0)+(a.rushYds||0)+(a.recYds||0)+(a.td||0)*20)).slice(0,8);
          return<div key={side} style={{flex:1}}>
            <div style={{fontSize:8,fontWeight:700,color:TEAMS[tid].ac,marginBottom:3}}>{teams[tid]?.ab}</div>
            {stats.map((s,i)=><div key={i} style={{display:"flex",gap:2,padding:"1px 3px",fontSize:9,borderBottom:`1px solid ${C.bd}11`}}>
              <Bdg pos={s.pos}/><span style={{flex:1,fontWeight:600}}>{s.name}</span>
              {s.passYds>0&&<span style={{color:"#94a3b8"}}>{s.comp||0}/{s.att||0} P:{s.passYds}</span>}
              {s.rushYds>0&&<span style={{color:"#94a3b8"}}>R:{s.rushYds}</span>}
              {s.recYds>0&&<span style={{color:"#94a3b8"}}>Rec:{s.recYds}</span>}
              {s.td>0&&<span style={{color:C.gn,fontWeight:700}}>TD:{s.td}</span>}
              {s.sack>0&&<span style={{color:"#f97316"}}>Sk:{s.sack}</span>}
              {s.int>0&&<span style={{color:C.rd}}>INT:{s.int}</span>}
            </div>)}
          </div>;})}
      </div>
      {/* Play-by-Play Log */}
      <div style={{fontSize:8,fontWeight:700,color:C.mt,marginBottom:3}}>PLAY-BY-PLAY</div>
      <div style={{maxHeight:200,overflowY:"auto",background:C.cd,borderRadius:6,padding:6}}>
        {liveLog.map((e,i)=><div key={i} style={{padding:"2px 4px",fontSize:9,borderLeft:`3px solid ${e.type==="td"?C.gn:e.type==="int"||e.type==="fumble"?C.rd:e.type==="fg"?C.gd:e.type==="sack"?"#f97316":"transparent"}`,marginBottom:1,color:e.type==="td"?C.gn:e.type==="int"?C.rd:"#cbd5e1"}}>
          <span style={{color:C.mt,fontSize:7}}>Q{e.qtr} </span>{e.text}
        </div>)}
        <div ref={logEndRef}/>
      </div>
    </div>}

    {/* LOG */}
    {tab==="log"&&<div style={{maxWidth:550}}>{log.slice().reverse().map((e,i)=><div key={i} style={{padding:"2px 6px",borderBottom:`1px solid ${C.bd}11`,fontSize:10,color:e.includes("🏆")?C.gd:e.includes("---")?C.bl:e.includes("W ")?C.gn:e.includes("L ")?C.rd:"#94a3b8"}}>{e}</div>)}
      <div style={{marginTop:8,border:`1px solid ${C.bd}`,borderRadius:5}}>
        <div onClick={()=>setLkrOpen(o=>!o)} style={{padding:"6px 8px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",fontSize:9,fontWeight:700,color:C.gd}}>
          <span>🏟️ LOCKER ROOM</span><span>{lkrOpen?"▲":"▼"}</span>
        </div>
        {lkrOpen&&<div style={{padding:"4px 8px 8px"}}>
          <div style={{fontSize:8,color:C.mt,marginBottom:4}}>CONF by player (your roster)</div>
          {ut&&[...ut.roster].sort((a,b)=>(a.conf||60)-(b.conf||60)).map(p=>(
            <div key={p.id} style={{display:"flex",alignItems:"center",gap:4,padding:"2px 0",fontSize:9}}>
              <span style={{minWidth:100,fontWeight:600}}>{p.name}</span>
              <Bdg pos={p.pos}/>
              <div style={{flex:1,height:6,borderRadius:3,background:C.bd,overflow:"hidden"}}>
                <div style={{width:`${p.conf||60}%`,height:"100%",background:(p.conf||60)>=60?C.gn:(p.conf||60)>=40?"#eab308":C.rd,borderRadius:3}}/>
              </div>
              <span style={{minWidth:22,textAlign:"right",fontWeight:700,color:(p.conf||60)>=60?C.gn:(p.conf||60)>=40?"#eab308":C.rd}}>{p.conf||60}</span>
            </div>
          ))}
          <div style={{marginTop:6,display:"flex",justifyContent:"flex-end"}}>
            <button onClick={()=>{if(scPts<1){sm("Need 1 SP for Team Meeting");return;}setScPts(s=>s-1);const nt=[...teams];nt[ui].roster.forEach(p=>{p.conf=cl((p.conf||60)+5,0,100);});nt[ui].morale=cl((nt[ui].morale||50)+2,0,100);setTeams(nt);setLog(l=>["Team Meeting held — all conf +5, morale +2",...l.slice(0,149)]);sm("Team Meeting: conf +5, morale +2");}} style={{background:`${C.bl}22`,color:C.bl,border:`1px solid ${C.bl}44`,borderRadius:4,padding:"3px 10px",fontSize:8,fontWeight:700,cursor:"pointer"}}>Team Meeting (1 SP)</button>
          </div>
        </div>}
      </div>
    </div>}

    {/* DEV */}
    {tab==="dev"&&(()=>{const N=200;const targets={QB:{passYds:255,passTD:1.6,passInt:0.6},RB:{rushYds:72,recYds:24},WR:{recYds:85},TE:{recYds:56},DL:{tkl:4.5,sacks:0.15},LB:{tkl:9},CB:{tkl:5},S:{tkl:7},K:{fgA:1.8}};const posRows=Object.keys(targets);const results={};const sampleP=pos=>{const p=genPlayer(pos,27,70);const s=Array.from({length:N},()=>simPG(p));const keys=Object.keys(s[0]);const avg={};keys.forEach(k=>{avg[k]=Math.round(s.reduce((a,r)=>a+(r[k]||0),0)/N*10)/10;});return avg;};posRows.forEach(pos=>{results[pos]=sampleP(pos);});const tgt=targets;return(<div style={{maxWidth:680}}>
      <div style={{fontSize:9,color:C.mt,marginBottom:8}}>Simulates {N} games per position (OVR 70) vs NFL targets. Refresh tab to re-sample.</div>
      {posRows.map(pos=>{const r=results[pos];const t=tgt[pos];return(<div key={pos} style={{marginBottom:10,background:C.cd,borderRadius:6,padding:"6px 10px",border:`1px solid ${C.bd}`}}>
        <div style={{fontSize:9,fontWeight:800,color:pC(pos),marginBottom:4}}>{pos} — sample avg</div>
        <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
          {Object.entries(t).map(([k,nfl])=>{const sim=r[k]||0;const ok=sim>=nfl*.80&&sim<=nfl*1.25;const hi=sim>nfl*1.25;return(<div key={k} style={{background:C.bg,borderRadius:4,padding:"3px 7px",textAlign:"center",minWidth:70,border:`1px solid ${ok?C.gn:hi?"#f97316":C.rd}44`}}>
            <div style={{fontSize:7,color:C.mt}}>{sL(k)}</div>
            <div style={{fontSize:12,fontWeight:800,color:ok?C.gn:hi?"#f97316":C.rd}}>{fm(sim)}</div>
            <div style={{fontSize:7,color:C.mt}}>NFL {nfl}</div>
          </div>);})}
          {Object.entries(r).filter(([k])=>!t[k]&&!['gp','gs'].includes(k)).slice(0,5).map(([k,v])=>(<div key={k} style={{background:C.bg,borderRadius:4,padding:"3px 7px",textAlign:"center",minWidth:60}}>
            <div style={{fontSize:7,color:C.mt}}>{sL(k)}</div>
            <div style={{fontSize:11,fontWeight:700,color:"#94a3b8"}}>{fm(v)}</div>
          </div>))}
        </div>
      </div>);})}
      <div style={{marginTop:10,background:C.cd,borderRadius:6,padding:"6px 10px",border:`1px solid ${C.bd}`}}>
        <div style={{fontSize:9,fontWeight:700,color:C.gd,marginBottom:4}}>GAME SCORE CHECK</div>
        <div style={{fontSize:9,color:"#94a3b8"}}>Target: ~23-24 pts/team. simGame uses G(22,...) base — check by simming a week.</div>
        <div style={{marginTop:4,fontSize:8,color:C.mt}}>Season: {sp} • Week: {wk}/18 • Teams: {teams.length} • FA: {fa.length} • Bye map entries: {Object.keys(byeMap).length}</div>
      </div>
    </div>);})()}

    {tab==="coaching"&&(()=>{const ut=teams[ui];const staff=ut?.coach||{};const CoachCard=({coach,role,onFire})=>(<div style={{background:C.cd,borderRadius:8,padding:10,border:`1px solid ${C.bd}`,display:"flex",gap:8,alignItems:"flex-start"}}><Face s={coach.face} sz={36}/><div style={{flex:1}}><div style={{fontWeight:800,fontSize:11}}>{coach.name}</div><div style={{display:"flex",gap:4,marginTop:2,flexWrap:"wrap"}}><span style={{fontSize:8,background:`${C.bl}33`,color:C.bl,borderRadius:3,padding:"1px 4px"}}>{role}</span><span style={{fontSize:8,background:"#7c3aed33",color:"#a78bfa",borderRadius:3,padding:"1px 4px"}}>{coach.scheme}</span><span style={{fontSize:8,color:C.mt}}>{coach.trait}</span></div><div style={{display:"flex",gap:8,marginTop:4}}><span style={{fontSize:9,color:C.gn}}>RTG <b>{coach.rating}</b></span><span style={{fontSize:9,color:C.gd}}>$<b>{coach.salary}M</b></span><span style={{fontSize:8,color:coach.contract<=1?C.rd:C.mt}}>{coach.contract||'?'}yr left</span></div></div><div style={{display:"flex",flexDirection:"column",gap:3}}><Btn onClick={onFire} bg="#7f1d1d" c="#fca5a5" style={{fontSize:8,padding:"2px 6px"}}>Fire</Btn><Btn onClick={()=>upgradeCoach(role)} disabled={scPts<2||coach.rating>=95} bg="#1e3a5f" c="#60a5fa" style={{fontSize:8,padding:"2px 6px"}}>⬆ ({scPts<2?"need SP":"2SP"})</Btn>{sp==="preseason"&&coach.contract<=1&&<Btn onClick={()=>reSignCoach(role.toLowerCase())} disabled={scPts<1} bg="#14532d" c="#86efac" style={{fontSize:8,padding:"2px 6px"}}>Re-sign +2yr ({scPts<1?"need SP":"1SP"})</Btn>}</div></div>);
    const EmptySlot=({role})=>(<div style={{background:C.cd,borderRadius:8,padding:10,border:`2px dashed ${C.bd}`,color:C.mt,fontSize:10,textAlign:"center"}}><div style={{fontWeight:700,marginBottom:2}}>{role} — Vacant</div><div style={{fontSize:8}}>Hire from available coaches below</div></div>);
    const FitBar=({val,max=4})=>{const pct=Math.round((val/max)*100);return<div style={{display:"flex",alignItems:"center",gap:4}}><div style={{flex:1,height:4,background:C.bd,borderRadius:2}}><div style={{width:`${pct}%`,height:"100%",background:val>=3?C.gn:val>=1.5?C.gd:C.rd,borderRadius:2}}/></div><span style={{fontSize:8,color:C.mt,minWidth:20}}>{val.toFixed(1)}</span></div>;};
    return(<div style={{maxWidth:700}}>
      <div style={{marginBottom:12}}><div style={{fontSize:12,fontWeight:800,color:C.bl,marginBottom:6}}>YOUR COACHING STAFF</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:8,marginBottom:8}}>
          {staff.oc?<CoachCard coach={staff.oc} role="OC" onFire={()=>fireCoach("OC")}/>:<EmptySlot role="Offensive Coordinator"/>}
          {staff.dc?<CoachCard coach={staff.dc} role="DC" onFire={()=>fireCoach("DC")}/>:<EmptySlot role="Defensive Coordinator"/>}
          {staff.st?<CoachCard coach={staff.st} role="ST" onFire={()=>fireCoach("ST")}/>:<EmptySlot role="Special Teams"/>}
        </div>
        <div style={{background:C.cd,borderRadius:6,padding:8,border:`1px solid ${C.bd}`,fontSize:9}}>
          <div style={{fontWeight:700,color:C.mt,marginBottom:4}}>SCHEME FIT</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
            <div><div style={{color:C.mt,marginBottom:2}}>OC Fit {staff.oc?`(${staff.oc.scheme})`:"—"}</div><FitBar val={getOCFit(ut)} max={4}/></div>
            <div><div style={{color:C.mt,marginBottom:2}}>DC Fit {staff.dc?`(${staff.dc.scheme})`:"—"}</div><FitBar val={getDCFit(ut)} max={4}/></div>
          </div>
          <div style={{marginTop:6,color:C.mt,fontSize:8}}>Run% this season: <b style={{color:C.tx}}>{Math.round(schemeRunPct(ut)*100)}%</b> | Scoring boost: <b style={{color:C.gn}}>+{((getOCFit(ut)+getDCFit(ut))*.5).toFixed(1)} pts/gm</b></div>
        </div>
      </div>
      <div><div style={{fontSize:12,fontWeight:800,color:C.bl,marginBottom:6}}>AVAILABLE COACHES ({faCoaches.length})</div>
        {faCoaches.length===0&&<div style={{color:C.mt,fontSize:10}}>No coaches available. New coaches appear each season.</div>}
        <div style={{display:"flex",flexDirection:"column",gap:4}}>
          {faCoaches.map(c=>{const canAfford=capSpace(ut)>=c.salary;return(<div key={c.id} style={{background:C.cd,borderRadius:6,padding:8,border:`1px solid ${C.bd}`,display:"flex",gap:8,alignItems:"center"}}>
            <Face s={c.face} sz={28}/>
            <div style={{flex:1}}>
              <div style={{fontWeight:700,fontSize:10}}>{c.name}</div>
              <div style={{display:"flex",gap:3,marginTop:1,flexWrap:"wrap"}}>
                <span style={{fontSize:7,background:`${C.bl}33`,color:C.bl,borderRadius:3,padding:"1px 3px"}}>{c.role}</span>
                <span style={{fontSize:7,background:"#7c3aed33",color:"#a78bfa",borderRadius:3,padding:"1px 3px"}}>{c.scheme}</span>
                <span style={{fontSize:7,color:C.mt}}>{c.trait}</span>
              </div>
            </div>
            <span style={{fontSize:9,color:C.gn}}>RTG {c.rating}</span>
            <span style={{fontSize:9,color:canAfford?C.gd:C.rd}}>${c.salary}M</span>
            <Btn onClick={()=>hireCoach(c)} bg={canAfford?C.gn:"#334155"} c={canAfford?"#fff":C.mt} style={{fontSize:8,padding:"2px 8px"}} disabled={!canAfford}>Hire</Btn>
          </div>);})}
        </div>
      </div>
    </div>);})()}

    </div>
  </div>);
}
