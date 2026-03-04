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
const POS=["QB","RB","WR","TE","OL","DL","LB","CB","S","K"];
const PP={QB:{h:74.5,hs:1.8,w:220,ws:12,hR:[71,78],wR:[200,245]},RB:{h:70,hs:1.5,w:210,ws:10,hR:[66,73],wR:[185,235]},WR:{h:73,hs:2,w:195,ws:12,hR:[68,77],wR:[170,225]},TE:{h:76,hs:1.5,w:250,ws:10,hR:[73,79],wR:[235,270]},OL:{h:76.5,hs:1.3,w:315,ws:12,hR:[74,79],wR:[295,345]},DL:{h:76,hs:1.5,w:290,ws:18,hR:[73,79],wR:[255,340]},LB:{h:74,hs:1.3,w:240,ws:10,hR:[72,76],wR:[225,265]},CB:{h:71,hs:1.8,w:190,ws:8,hR:[68,75],wR:[175,210]},S:{h:72,hs:1.5,w:205,ws:8,hR:[70,75],wR:[190,220]},K:{h:72,hs:1.5,w:195,ws:10,hR:[69,75],wR:[180,215]}};
const CA={QB:{f:4.85,b:18,v:32,br:112,t:7.1,s:4.35},RB:{f:4.52,b:20,v:35,br:120,t:7.0,s:4.2},WR:{f:4.48,b:14,v:36,br:122,t:6.9,s:4.15},TE:{f:4.7,b:20,v:33,br:116,t:7.1,s:4.3},OL:{f:5.2,b:26,v:28,br:104,t:7.6,s:4.7},DL:{f:4.9,b:25,v:31,br:112,t:7.3,s:4.5},LB:{f:4.65,b:22,v:34,br:118,t:7.0,s:4.25},CB:{f:4.45,b:14,v:37,br:124,t:6.85,s:4.1},S:{f:4.5,b:16,v:36,br:121,t:6.95,s:4.15},K:{f:4.9,b:15,v:30,br:108,t:7.2,s:4.4}};
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
const PA={QB:["armStr","accuracy","pocketAwr","decisions","mobility","throwPow","touch","readDef"],RB:["vision","elusiveness","breakTkl","passBlock","receiving","burst","balance","stiffArm"],WR:["routeRun","catching","separation","release","bodyCtrl","yac","deepSpd","catchTraffic"],TE:["blocking","receiving","routeRun","redZone","passBlock","yac","seaming","toughness"],OL:["passBlock","runBlock","anchor","footwork","awareness","pulling","hands","toughness"],DL:["passRush","runStop","handUse","motor","getOff","bullRush","swim","spin"],LB:["tackling","coverage","blitzing","runFit","instincts","pursuit","shedBlock","zoneAwr"],CB:["manCov","zoneCov","press","ballSkills","tackling","recovery","footwork","playRec"],S:["range","runSupport","coverage","tackling","ballHawk","blitzing","comms","versatility"],K:["legStr","accuracy","clutch","distance","hangTime","consistency","coldWx","pressure"]};
const STRS={QB:["Elite pocket presence","Exceptional arm talent","Reads defenses pre-snap","Natural leader","Anticipation throws","Deep ball accuracy","Quick release","High football IQ","Extends plays","Poised under pressure","Pro-ready mechanics"],RB:["Explosive first step","Excellent vision","Breaks arm tackles","Elite lateral agility","Reliable pass catcher","Powerful short yardage","Patient runner","Home run speed"],WR:["Creates separation","Reliable hands","Elite speed","Contested catch ability","Precise route runner","Dangerous after catch","Deep threat","Body control on sideline"],TE:["Mismatch weapon","Reliable blocker","Red zone threat","Routes like a receiver","Soft hands in traffic","Versatile inline/flexed"],OL:["Anchor against bull rush","Quick feet","Nasty finisher","Excellent hand placement","Gets to second level","Versatile positions"],DL:["Explosive first step","Violent hands","Collapses pocket","Relentless motor","Pass rush repertoire","Stout vs run"],LB:["Sideline-to-sideline range","Downhill thumper","Coverage ability","Blitz timing","Wrap-up tackler","QB of defense"],CB:["Lockdown man coverage","Elite ball skills","Mirror ability","Recovery speed","Press technique"],S:["Rangey centerfielder","Hard-hitting enforcer","Box/deep versatility","Ball-hawk instincts","Closing speed"],K:["Ice water veins","50+ yard leg","Consistent mechanics","Clutch performer"]};
const WKNS={QB:["Holds ball too long","Inconsistent footwork","Limited mobility","Telegraphs throws"],RB:["Struggles pass protection","Fumble-prone","Limited route tree","Below-average speed"],WR:["Drops on contested catches","Limited blocking","Gets jammed at line","Body catcher"],TE:["Liability in pass protection","Limited speed","Drops in traffic"],OL:["Struggles with speed rushers","Penalty-prone","Inconsistent anchor"],DL:["Washed out by double teams","Inconsistent motor","Limited pass rush moves"],LB:["Liability in coverage","Bad angles","Slow to shed blocks"],CB:["Grabby when beaten","Bites on double moves","Inconsistent tackling"],S:["Poor man coverage","Bad angles","Overaggressive"],K:["Struggles beyond 50","Inconsistent in wind"]};
const FACTS=["Grew up on a ranch, didn't play football until sophomore year.","State champion wrestler.","Has an identical twin brother.","First in, last out of the weight room.","Speaks three languages fluently.","Walk-on who earned a scholarship.","Set his high school's scoring record.","Ran a 4.33 forty at Pro Day.","Father played 10 seasons in the league.","Volunteers at youth camps.","Recruited as basketball player.","Turned down baseball draft.","Bench pressed 225 for 30 reps.","Overcame torn ACL in college.","High school valedictorian.","Clocked at 22.4 mph in-game.","Played both ways in high school.","Captain three consecutive years.","From a town under 2,000 people.","Studies 30+ hours of film per week.","Once scored 6 TDs in a single game."];

// Draft pick value chart (approximate Jimmy Johnson chart simplified)
const PICK_VAL=[0,3000,2600,2200,1800,1700,1600,1500,1400,1350,1300,1250,1200,1150,1100,1050,1000,950,900,875,850,825,800,775,750,725,700,680,660,640,620,600,580,
560,540,520,500,490,480,470,460,450,440,430,420,410,400,390,380,370,360,350,340,330,320,310,300,292,284,276,268,260,252,244,236,
228,220,212,206,200,195,190,185,180,175,170,165,160,155,150,146,142,138,134,130,126,122,118,114,110,106,102,98,96,94,92,90,
88,86,84,82,80,78,76,74,72,70,68,66,64,62,60,58,56,54,52,50,49,48,47,46,45,44,43,42,41,40,39,38,37,36,35,34,33,32,31,30,
29,28,27,26,25,24,23,22,21,20,19,18,17,16,15,14,14,13,13,12,12,11,11,10,10,9,9,8,8,7,7,6,6,5,5,5,5,4,4,4,4,3,3,3,3,2,2,2,2,2,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1,1];

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
    colStats:genColStats(pos,colYrs,ovr),colYrs,draftYear:0};
}

function genFA(){const fa=[];for(let i=0;i<30;i++){const pos=pick(POS);const p=genPlayer(pos,R(24,33));p.contract=0;fa.push(p);}return fa;}

function genDC(yr){
  const dc=[];const posW=[];const w={QB:4,RB:6,WR:9,TE:4,OL:10,DL:8,LB:7,CB:6,S:5,K:1};
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
  const ideal={QB:2,RB:3,WR:5,TE:2,OL:7,DL:5,LB:4,CB:4,S:3,K:1};
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

function genRoster(){const r=[];const ct={QB:3,RB:4,WR:5,TE:3,OL:8,DL:6,LB:5,CB:4,S:3,K:1};for(const[pos,n]of Object.entries(ct))for(let i=0;i<n;i++){const p=genPlayer(pos);r.push(p);}return r;}
function initTeams(ui){return TEAMS.map((t,i)=>({...t,id:i,isUser:i===ui,roster:genRoster(),w:0,l:0,t:0,pf:0,pa:0,cap:R(25,55),strat:pick(["balanced","pass-heavy","run-heavy","defensive"])}));}
function genSched(teams){const g=[];const ids=teams.map((_,i)=>i);for(let w=0;w<17;w++){const sh=[...ids].sort(()=>Math.random()-.5);for(let i=0;i<sh.length;i+=2)g.push({wk:w+1,h:sh[i],a:sh[i+1],played:false,hs:0,as:0,boxH:null,boxA:null});}return g;}

// ═══════════ PER-GAME STAT SIM ═══════════
function simPG(p){const o=p.ovr,sp=p.spd,st=p.str,ag=p.agi;const sM=(sp-65)*.004,stM=(st-65)*.003;const s={};
  if(p.pos==="QB"){const att=Math.max(15,Math.round(G(34,5)+(o-65)*.1));const cP=cl(.58+(o-50)*.003+Rf(-.06,.06),.45,.78);const comp=Math.round(att*cP);const ypa=cl(G(7.2,.8)+(o-65)*.02+sM*2,4.5,11);const yds=Math.max(0,Math.round(comp*ypa/cP*.85+G(0,20)));const td=Math.max(0,Math.round(att*cl(.04+(o-60)*.001+Rf(-.015,.015),.01,.09)+Rf(-.5,.5)));const int_=Math.random()<att*cl(.025-(o-60)*.0005,.005,.06)*2?1:0;const sk=Math.max(0,Math.round(G(2.3,1.2)-(o-60)*.02));const rA=Math.max(0,Math.round(G(3,2.5)));Object.assign(s,{comp,att,passYds:yds,passTD:td,passInt:int_,sk,skYds:sk*R(5,9),rushAtt:rA,rushYds:Math.round(rA*cl(G(4.5,2.5)+sM*10,-2,15)),rushTD:Math.random()<rA*.02?1:0,fum:Math.random()<.04?1:0});s.rate=qbRate(comp,att,yds,td,int_);}
  else if(p.pos==="RB"){const att=Math.max(3,Math.round(G(15,5)+(o-60)*.08));const ypc=cl(G(4.3,.8)+(o-60)*.015+sM*3,2,8);const td=Math.random()<.04+(o-60)*.003+stM?1:0;const tgt=Math.max(0,Math.round(G(3.5,2)));const rec=Math.round(tgt*cl(Rf(.6,.85),.4,1));Object.assign(s,{rushAtt:att,rushYds:Math.round(att*ypc),rushTD:td,rec,recYds:Math.round(rec*cl(G(8,3),2,18)),recTD:Math.random()<rec*.015?1:0,tgt,fum:Math.random()<.03?1:0});}
  else if(p.pos==="WR"){const tgt=Math.max(1,Math.round(G(7,3)+(o-60)*.06));const cR=cl(.6+(o-60)*.003+Rf(-.08,.08),.4,.85);const rec=Math.max(0,Math.round(tgt*cR));Object.assign(s,{tgt,rec,recYds:Math.round(rec*cl(G(13,3.5)+(sp-60)*.06,5,25)),recTD:Math.random()<.04+(o-65)*.003?1:0,rushAtt:Math.random()<.1?1:0,rushYds:Math.random()<.1?R(-2,15):0});}
  else if(p.pos==="TE"){const tgt=Math.max(0,Math.round(G(5,2.5)+(o-60)*.04));const rec=Math.max(0,Math.round(tgt*cl(Rf(.55,.8),.4,.9)));Object.assign(s,{tgt,rec,recYds:Math.round(rec*cl(G(11,3),4,20)),recTD:Math.random()<.03+(o-65)*.003?1:0});}
  else if(p.pos==="DL"){Object.assign(s,{tkl:Math.max(0,Math.round(G(2.5,1.5))),ast:Math.max(0,Math.round(G(1.5,1))),sacks:Math.round((Math.random()<.12+(o-60)*.004?Rf(.5,1.5):0)*10)/10,tfl:Math.random()<.15+(o-60)*.003?1:0,ff:Math.random()<.03?1:0,qbH:Math.max(0,R(0,2)),pd:Math.random()<.05?1:0});}
  else if(p.pos==="LB"){Object.assign(s,{tkl:Math.max(0,Math.round(G(5,2.5))),ast:Math.max(0,Math.round(G(2.5,1.5))),sacks:Math.round((Math.random()<.08+(o-60)*.002?Rf(.5,1):0)*10)/10,tfl:Math.random()<.1?1:0,ints:Math.random()<.03?1:0,ff:Math.random()<.03?1:0,pd:Math.random()<.08?1:0});}
  else if(p.pos==="CB"){Object.assign(s,{tkl:Math.max(0,Math.round(G(3.5,1.5))),ast:R(0,2),ints:Math.random()<.05+(o-60)*.002?1:0,pd:Math.max(0,Math.round(G(.8,.6)+(o-60)*.01)),ff:Math.random()<.02?1:0});}
  else if(p.pos==="S"){Object.assign(s,{tkl:Math.max(0,Math.round(G(4.5,2))),ast:R(0,2),ints:Math.random()<.04+(o-60)*.002?1:0,pd:Math.random()<.1?1:0,sacks:Math.random()<.03?.5:0,ff:Math.random()<.02?1:0});}
  else if(p.pos==="K"){const fga=Math.max(0,Math.round(G(2,.8)));const fgm=Math.round(fga*cl(.75+(o-60)*.004+Rf(-.1,.1),.5,1));const xpa=Math.max(0,Math.round(G(3.5,1.5)));Object.assign(s,{fgM:fgm,fgA:fga,xpM:Math.round(xpa*cl(.92+(o-60)*.002,.8,1)),xpA:xpa,pts:fgm*3+Math.round(xpa*.95),lng:fgm>0?R(25,55+(o-60)):0});}
  return s;
}
function addS(t,s){for(const[k,v]of Object.entries(s))if(typeof v==="number")t[k]=(t[k]||0)+v;}
function teamStr(t){const r=t.roster.filter(p=>!p.injured);if(!r.length)return 50;const st={QB:1,RB:1,WR:3,TE:1,OL:5,DL:4,LB:3,CB:2,S:2,K:1};const a=[];for(const[pos,n]of Object.entries(st)){const ap=r.filter(p=>p.pos===pos).sort((x,y)=>y.ovr-x.ovr);a.push(...ap.slice(0,n));}return a.length?a.reduce((s,p)=>s+p.ovr,0)/a.length:50;}
function simGame(ht,at){const hs=teamStr(ht)+2.5,as=teamStr(at);let hsc=Math.max(3,Math.round(G(17+(hs-60)*.35,7))),asc=Math.max(3,Math.round(G(17+(as-60)*.35,7)));
  const boxH={},boxA={};
  [ht,at].forEach((t,ti)=>{const box=ti===0?boxH:boxA;t.roster.forEach(p=>{if(p.injured)return;const gs=simPG(p);if(!Object.keys(gs).length)return;p.ss.gp=(p.ss.gp||0)+1;p.ss.gs=(p.ss.gs||0)+1;addS(p.ss,gs);if(p.pos==="QB"&&p.ss.att>0)p.ss.rate=qbRate(p.ss.comp,p.ss.att,p.ss.passYds,p.ss.passTD,p.ss.passInt);p.gl.push({...gs,gp:1});box[p.id]={...gs,name:p.name,pos:p.pos};if(Math.random()<.025){p.injured=true;p.injType=pick(["Hamstring","Ankle","Knee (MCL)","Shoulder","Concussion","Quad","Calf","Back"]);p.injWk=R(1,8);}});});
  return{hsc,asc,boxH,boxA};}

// ═══════════ SCOUTS ═══════════
const SC_TRAITS=["Eye for QBs","Defensive Specialist","Small School Finder","Measurables Expert","Character Evaluator","Combine Guru","Film Junkie","Late Round Wizard","OL Whisperer"];
function genScout(){return{id:uid(),name:`${pick(FN)} ${pick(LN)}`,evaluation:R(40,95),accuracy:R(40,95),speed:R(40,95),trait:pick(SC_TRAITS),salary:+(Rf(.5,3)).toFixed(1),face:genFace()};}

// ═══════════ LIVE PLAY GEN ═══════════
function genLivePlay(offTeam,defTeam,yard,down,toGo){
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
  // Penalty 5%
  if(Math.random()<.05){const pens=["False start, offense. 5-yard penalty.","Holding, offense. 10-yard penalty.","Pass interference, defense. Auto first down.","Offsides, defense. 5-yard penalty."];const pen=pick(pens);const offP=pen.includes("offense");return{text:`🚩 ${pen}`,yards:offP?-5:5,type:"penalty",player:null,newDown:offP?down:1,td:false,turnover:false};}
  // 4th down
  if(down===4){if(yard>=58&&k){const made=Math.random()<cl(.65+(k.ovr-50)*.005,.3,.95);return{text:made?`${k.name} kicks... GOOD! 3 points!`:`${k.name}'s kick is NO GOOD.`,yards:0,type:made?"fg":"fg_miss",player:k,newDown:1,td:false,turnover:!made,score:made?3:0};}return{text:"Team punts away.",yards:0,type:"punt",player:null,newDown:1,td:false,turnover:true};}
  const isRun=Math.random()<.42;
  if(isRun){const runner=rb;const oM=(runner.ovr-55)/100;const sB=(runner.spd-60)/150;
    const yds=Math.round(cl(G(3.8+oM*3+sB*4,3),-4,runner.spd>85?R(15,65):18));
    const isTD=yard+yds>=100;const fum=Math.random()<.02;
    const dir=pick(["up the middle","off left tackle","around right end"]);
    let text=fum?`${runner.name} FUMBLES! Ball is loose!`:isTD?`🏈 TOUCHDOWN! ${runner.name} scores from ${100-yard} yards out!`:`${runner.name} runs ${dir} for ${Math.abs(yds)} ${yds>=0?"yards":"yard loss"}.`;
    return{text,yards:fum?0:yds,type:isTD?"td":fum?"fumble":"run",player:runner,newDown:yds>=toGo?1:down+1,td:isTD,turnover:fum,score:isTD?7:0};}
  // Pass
  const sackCh=cl(.08-(qb.ovr-55)*.002+dl.ovr*.0015,.02,.2);
  if(Math.random()<sackCh){const loss=R(3,12);return{text:`${dl.name} SACKS ${qb.name} for a loss of ${loss}!`,yards:-loss,type:"sack",player:dl,defPlay:true,newDown:down+1,td:false,turnover:false};}
  const intCh=cl(.04-(qb.ovr-55)*.001+db.ovr*.001,.01,.12);
  if(Math.random()<intCh)return{text:`INTERCEPTED! ${db.name} picks off ${qb.name}!`,yards:0,type:"int",player:db,defPlay:true,newDown:1,td:false,turnover:true};
  const tgt=Math.random()<.55?wr:(te||wr);
  const compCh=cl(.58+(qb.ovr-50)*.004+(tgt.ovr-50)*.002,.35,.82);
  if(Math.random()>compCh)return{text:`${qb.name}'s pass to ${tgt.name} falls incomplete.`,yards:0,type:"inc",player:qb,newDown:down+1,td:false,turnover:false};
  const spdB=(tgt.spd-60)/80;const deep=Math.random()<.18+spdB*.1;
  const yds=deep?Math.round(cl(G(28+spdB*12,10),12,tgt.spd>85?R(40,75):55)):Math.round(cl(G(8+(tgt.ovr-55)*.08,4),1,22));
  const isTD=yard+yds>=100;
  const depthStr=deep?"DEEP":"short";
  let text=isTD?`🏈 TOUCHDOWN! ${qb.name} hits ${tgt.name} ${depthStr} for the score!`:`${qb.name} connects with ${tgt.name} ${depthStr} for ${yds} yards.`;
  return{text,yards:yds,type:isTD?"td":"pass",player:tgt,passer:qb,newDown:yds>=toGo?1:down+1,td:isTD,turnover:false,score:isTD?7:0};
}

// ═══════════ COLORS & LABELS ═══════════
const C={bg:"#080c14",cd:"#111827",bd:"#1e293b",tx:"#e0e6f0",mt:"#64748b",gn:"#22c55e",bl:"#3b82f6",gd:"#eab308",rd:"#ef4444",f:"'Segoe UI',system-ui,sans-serif"};
const oC=o=>o>=80?"#22c55e":o>=68?"#84cc16":o>=55?"#eab308":o>=42?"#f97316":"#ef4444";
const pC=p=>({QB:"#e74c3c",RB:"#3498db",WR:"#f39c12",TE:"#9b59b6",OL:"#1abc9c",DL:"#e67e22",LB:"#2ecc71",CB:"#e91e63",S:"#00bcd4",K:"#795548"}[p]||"#999");
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
      <td style={{padding:"2px"}}>{p.injured&&<span style={{color:C.rd,fontSize:8}}>● </span>}<PN p={p} setSel={setSel}/></td>
      <td style={{textAlign:"center"}}><Bdg pos={p.pos}/></td>
      <td style={{textAlign:"center",color:p.age>31?"#f97316":"#94a3b8",fontSize:10}}>{p.age}</td>
      <td style={{textAlign:"center",fontWeight:800,color:oC(p.ovr)}}>{p.ovr}</td>
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

// ═══════════ MAIN APP ═══════════
export default function GridironGM(){
  const[phase,setPhase]=useState("splash");
  const[teams,setTeams]=useState([]);const[ui,setUi]=useState(null);const[yr,setYr]=useState(2026);const[wk,setWk]=useState(0);
  const[sched,setSched]=useState([]);const[sp,setSp]=useState("preseason");const[tab,setTab]=useState("roster");
  const[dc,setDc]=useState({});const[fa,setFa]=useState([]);
  const[pb,setPb]=useState(null);const[msg,setMsg]=useState("");
  const[sc,setSc]=useState("ovr");const[sd,setSd]=useState(-1);const[sel,setSel]=useState(null);
  const[log,setLog]=useState([]);const[champs,setChamps]=useState([]);const[sf,setSf]=useState("passing");
  const[myScout,setMyScout]=useState(null);const[faScouts,setFaScouts]=useState([]);const[scPts,setScPts]=useState(10);const[scView,setScView]=useState(0);
  const[trTm,setTrTm]=useState(null);const[trOff,setTrOff]=useState({g:[],r:[],gPk:[],rPk:[]});
  const[draftPicks,setDraftPicks]=useState([]);const[draftIdx,setDraftIdx]=useState(0);const[draftLog,setDraftLog]=useState([]);
  const[draftTimer,setDraftTimer]=useState(120);const[draftActive,setDraftActive]=useState(false);const[draftPaused,setDraftPaused]=useState(false);
  const[rPosF,setRPosF]=useState("ALL");const[faPosF,setFaPosF]=useState("ALL");
  const[faSc,setFaSc]=useState("ovr");const[faSd,setFaSd]=useState(-1);
  // Live sim
  const[liveSim,setLiveSim]=useState(null);const[liveLog,setLiveLog]=useState([]);
  const[liveScore,setLiveScore]=useState({h:0,a:0});const[liveQtr,setLiveQtr]=useState(1);
  const[liveYard,setLiveYard]=useState(25);const[livePoss,setLivePoss]=useState("h");
  const[liveDown,setLiveDown]=useState(1);const[liveToGo,setLiveToGo]=useState(10);
  const[livePlay,setLivePlay]=useState(0);const[liveDone,setLiveDone]=useState(false);
  const[livePaused,setLivePaused]=useState(false);const[livePOG,setLivePOG]=useState(null);
  const[liveStats,setLiveStats]=useState({h:{},a:{}});const[lastLivePlay,setLastLivePlay]=useState(null);
  const[boxView,setBoxView]=useState(null);
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
    if(!liveSim||liveDone||livePaused)return;
    liveRef.current=setInterval(()=>advanceLivePlay(),1100);
    return()=>clearInterval(liveRef.current);
  },[liveSim,liveDone,livePaused,livePlay]);
  useEffect(()=>{if(logEndRef.current)logEndRef.current.scrollIntoView({behavior:"smooth"});},[liveLog]);

  function advanceLivePlay(){
    if(!liveSim||liveDone)return;
    const hTeam=teams[liveSim.h],aTeam=teams[liveSim.a];
    const offTeam=livePoss==="h"?hTeam:aTeam,defTeam=livePoss==="h"?aTeam:hTeam;
    const play=genLivePlay(offTeam,defTeam,liveYard,liveDown,liveToGo);
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
      if(play.type==="run"||play.type==="td"&&!play.passer){ps.rushYds+=play.yards;ps.rushAtt++;}
      if(play.type==="pass"||play.type==="td"&&play.passer){ps.rec++;ps.recYds+=play.yards;}
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
    setLiveLog(nLog);setLiveStats(nst);setLiveScore(ns);setLiveYard(ny);setLivePoss(np);setLiveDown(nd);setLiveToGo(ntg);setLiveQtr(nq);setLivePlay(nPlay);
  }
  function qb_id(t){const qb=t.roster.filter(p=>p.pos==="QB"&&!p.injured).sort((a,b)=>b.ovr-a.ovr)[0];return qb?.id;}
  function startLiveSim(game){setLiveSim(game);setLiveLog([]);setLiveStats({h:{},a:{}});setLiveScore({h:0,a:0});setLiveQtr(1);setLiveYard(25);setLivePoss("h");setLiveDown(1);setLiveToGo(10);setLivePlay(0);setLiveDone(false);setLivePaused(false);setLivePOG(null);setLastLivePlay(null);setTab("livesim");}

  function aiPick(){const picks=draftPicks;const idx=draftIdx;if(idx>=picks.length)return;const cur=picks[idx];const cls=dc[yr]||[];if(!cls.length)return;const bp=aiBestPick(teams[cur.owner].roster,cls);if(bp)makePick(bp);}
  function makePick(p){const picks=draftPicks;const idx=draftIdx;if(idx>=picks.length)return;const cur=picks[idx];const nt=[...teams];const np={...p,salary:Math.round((p.trueOvr/99)*Rf(1,5)*100)/100,contract:4,draftYr:yr,draftPk:cur.overall,ovr:p.trueOvr,pot:p.truePot,scoutLvl:2,ss:emptySS(p.pos),gl:[]};nt[cur.owner].roster.push(np);setTeams(nt);const ndc={...dc};ndc[yr]=ndc[yr].filter(d=>d.id!==p.id);setDc(ndc);const entry=`Rd${cur.rd} #${cur.overall} ${TEAMS[cur.owner].ab}: ${np.name} (${np.pos}, ${np.trueOvr})`;setDraftLog(prev=>[...prev,{...cur,player:np,text:entry}]);setLog(prev=>[...prev,entry]);setDraftIdx(idx+1);setDraftTimer(120);if(idx+1>=picks.length){setDraftActive(false);sm("Draft complete!");setSp("freeagency");setTab("freeagency");}}
  function simEntireDraft(){const cls=[...(dc[yr]||[])];const picks=[...draftPicks];const nt=teams.map(t=>({...t,roster:[...t.roster]}));const dl=[];for(let i=draftIdx;i<picks.length;i++){const cur=picks[i];if(!cls.length)break;const bp=cur.owner===ui?cls[0]:aiBestPick(nt[cur.owner].roster,cls);if(!bp)continue;const np={...bp,salary:Math.round((bp.trueOvr/99)*Rf(1,5)*100)/100,contract:4,draftYr:yr,draftPk:cur.overall,ovr:bp.trueOvr,pot:bp.truePot,scoutLvl:2,ss:emptySS(bp.pos),gl:[]};nt[cur.owner].roster.push(np);const ci=cls.findIndex(x=>x.id===bp.id);if(ci>=0)cls.splice(ci,1);dl.push({...cur,player:np,text:`Rd${cur.rd} #${cur.overall} ${TEAMS[cur.owner].ab}: ${np.name} (${np.pos}, ${np.trueOvr})`});}setTeams(nt);const ndc={...dc};ndc[yr]=cls;setDc(ndc);setDraftLog(prev=>[...prev,...dl]);setLog(prev=>[...prev,...dl.map(d=>d.text)]);setDraftIdx(picks.length);setDraftActive(false);sm("Draft simulated!");setSp("freeagency");setTab("freeagency");}

  const startGame=i=>{const t=initTeams(i);const dcs={[2026]:genDC(2026),[2027]:genDC(2027),[2028]:genDC(2028)};const initPk=[];const shuffled=[...Array(32)].map((_,x)=>x).sort(()=>Math.random()-.5);for(let rd=1;rd<=7;rd++)shuffled.forEach((tid,idx)=>{initPk.push({id:uid(),rd,num:idx+1,overall:(rd-1)*32+idx+1,owner:tid,orig:tid,yr:2026});});setTeams(t);setUi(i);setSched(genSched(t));setFa(genFA());setDc(dcs);setYr(2026);setWk(0);setSp("preseason");setTab("roster");setPhase("main");setMyScout(genScout());setFaScouts(Array.from({length:5},genScout));setScPts(10);setDraftPicks(initPk);setDraftLog([]);setLog([`${t[i].city} ${t[i].name}: 2026.`]);sm(`Welcome, GM!`);};
  const simWk=()=>{if(sp!=="regular")return;const nw=wk+1;const nt=[...teams];const ns=[...sched];let ur="";ns.filter(g=>g.wk===nw).forEach(g=>{const gi=ns.indexOf(g);const r=simGame(nt[g.h],nt[g.a]);ns[gi]={...g,played:true,hs:r.hsc,as:r.asc,boxH:r.boxH,boxA:r.boxA};nt[g.h].pf+=r.hsc;nt[g.h].pa+=r.asc;nt[g.a].pf+=r.asc;nt[g.a].pa+=r.hsc;if(r.hsc>r.asc){nt[g.h].w++;nt[g.a].l++;}else if(r.asc>r.hsc){nt[g.a].w++;nt[g.h].l++;}else{nt[g.h].t++;nt[g.a].t++;}if(g.h===ui||g.a===ui){const ih=g.h===ui;const us=ih?r.hsc:r.asc;const them=ih?r.asc:r.hsc;const opp=ih?nt[g.a]:nt[g.h];ur=`Wk${nw}: ${us>them?"W":"L"} ${us}-${them} vs ${opp.ab}`;}});nt.forEach(t=>t.roster.forEach(p=>{if(p.injured){p.injWk--;if(p.injWk<=0){p.injured=false;p.injWk=0;p.injType="";}}}));nt.forEach(t=>t.roster.forEach(p=>{p.av=calcAV(p);}));setScPts(pr=>pr+2);setTeams(nt);setSched(ns);setWk(nw);if(ur){setLog(p=>[...p,ur]);sm(ur);}if(nw>=17){setSp("playoffs");const sorted=[...nt].sort((a,b)=>b.w-a.w||(b.pf-b.pa)-(a.pf-a.pa));const t8=sorted.slice(0,8).map(t=>t.id);setPb({rd:1,m:[[t8[0],t8[7]],[t8[1],t8[6]],[t8[2],t8[5]],[t8[3],t8[4]]],res:[],ch:null});setTab("playoffs");}};
  const simAll=()=>{if(sp!=="regular")return;let cw=wk;const nt=teams.map(t=>({...t,roster:t.roster.map(p=>({...p,ss:{...p.ss},gl:[...p.gl]}))}));const ns=[...sched];const rl=[];while(cw<17){cw++;ns.filter(g=>g.wk===cw).forEach(g=>{const gi=ns.indexOf(g);const r=simGame(nt[g.h],nt[g.a]);ns[gi]={...g,played:true,hs:r.hsc,as:r.asc,boxH:r.boxH,boxA:r.boxA};nt[g.h].pf+=r.hsc;nt[g.h].pa+=r.asc;nt[g.a].pf+=r.asc;nt[g.a].pa+=r.hsc;if(r.hsc>r.asc){nt[g.h].w++;nt[g.a].l++;}else if(r.asc>r.hsc){nt[g.a].w++;nt[g.h].l++;}else{nt[g.h].t++;nt[g.a].t++;}if(g.h===ui||g.a===ui){const ih=g.h===ui;const us=ih?r.hsc:r.asc;const them=ih?r.asc:r.hsc;const opp=ih?nt[g.a]:nt[g.h];rl.push(`${us>them?"W":"L"} ${us}-${them} vs ${opp.ab}`);}});nt.forEach(t=>t.roster.forEach(p=>{if(p.injured){p.injWk--;if(p.injWk<=0){p.injured=false;p.injWk=0;p.injType="";}}}));}nt.forEach(t=>t.roster.forEach(p=>{p.av=calcAV(p);}));setScPts(pr=>pr+(17-wk)*2);setTeams(nt);setSched(ns);setWk(17);setLog(p=>[...p,...rl]);setSp("playoffs");const sorted=[...nt].sort((a,b)=>b.w-a.w||(b.pf-b.pa)-(a.pf-a.pa));const t8=sorted.slice(0,8).map(t=>t.id);setPb({rd:1,m:[[t8[0],t8[7]],[t8[1],t8[6]],[t8[2],t8[5]],[t8[3],t8[4]]],res:[],ch:null});setTab("playoffs");sm("Season complete!");};
  const simPR=()=>{if(!pb||pb.ch!=null)return;const nt=[...teams];const w=[];const rr=[];pb.m.forEach(([a,b])=>{const r=simGame(nt[a],nt[b]);const wi=r.hsc>=r.asc?a:b;w.push(wi);rr.push({h:a,a:b,hs:r.hsc,as:r.asc,w:wi});});setTeams(nt);const ar=[...pb.res,...rr];if(w.length===1){setPb({...pb,res:ar,ch:w[0]});setLog(p=>[...p,`🏆 ${yr}: ${nt[w[0]].city} ${nt[w[0]].name} win!`]);setChamps(p=>[...p,{yr,t:`${nt[w[0]].city} ${nt[w[0]].name}`}]);sm(`🏆 Champions!`);}else{const nm=[];for(let i=0;i<w.length;i+=2)nm.push([w[i],w[i+1]]);setPb({rd:pb.rd+1,m:nm,res:ar,ch:null});}};
  const goToCombine=()=>{const ndc={...dc};const cls=ndc[yr]||[];cls.forEach(p=>{p.combine=genCombine(p.pos,p.trueOvr);p.proDay=genProDay(p.pos,p.trueOvr);const ph=combToPhys(p.combine);Object.assign(p,ph);});ndc[yr]=[...cls];setDc(ndc);setSp("combine");setTab("draft");sm("Combine complete!");};
  const startDraft=()=>{const order=[...teams].sort((a,b)=>a.w-b.w||(a.pf-a.pa)-(b.pf-b.pa)).map(t=>t.id);const newPicks=[];const oldPicks=draftPicks.filter(pk=>pk.yr===yr);for(let rd=1;rd<=7;rd++)order.forEach((origTid,idx)=>{const overall=(rd-1)*32+idx+1;const traded=oldPicks.find(pk=>pk.orig===origTid&&pk.rd===rd);const owner=traded?traded.owner:origTid;newPicks.push({id:uid(),rd,num:idx+1,overall,owner,orig:origTid,yr});});setDraftPicks(newPicks);setDraftIdx(0);setDraftLog([]);setDraftTimer(120);setDraftActive(true);setDraftPaused(false);setSp("draft");setTab("draft");sm("Draft has begun!");};
  const newSeason=()=>{const draftOrder=[...teams].sort((a,b)=>a.w-b.w||(a.pf-a.pa)-(b.pf-b.pa)).map(t=>t.id);let nt=teams.map(t=>({...t,roster:t.roster.map(p=>{const cs={...(p.cs||{})};for(const[k,v]of Object.entries(p.ss||{}))if(typeof v==="number")cs[k]=(cs[k]||0)+v;let no=p.ovr;if(p.age<27)no=cl(p.ovr+R(-1,Math.round((p.pot-p.ovr)/4)+2),30,99);else if(p.age>30)no=cl(p.ovr-R(1,p.age>34?5:3),30,99);else no=cl(p.ovr+R(-2,2),30,99);return{...p,age:p.age+1,contract:p.contract-1,ovr:no,trueOvr:no,injured:false,injWk:0,injType:"",cs,ss:emptySS(p.pos),gl:[],av:0,tradeVal:no+Math.round((p.pot-no)*.5)-((p.age+1)>30?((p.age+1)-30)*3:0)};}).filter(p=>!(p.age>37&&Math.random()<.6)&&!(p.age>34&&p.ovr<38)&&p.contract>0),w:0,l:0,t:0,pf:0,pa:0,cap:R(25,55)}));const rm={QB:2,RB:3,WR:4,TE:2,OL:5,DL:5,LB:4,CB:3,S:2,K:1};nt.forEach(t=>{POS.forEach(pos=>{const have=t.roster.filter(p=>p.pos===pos).length;const need=(rm[pos]||2)-have;for(let i=0;i<Math.max(0,need);i++)t.roster.push(genPlayer(pos,R(21,25)));});});const ns=yr+1;const ndc={...dc};delete ndc[yr];if(!ndc[ns+2])ndc[ns+2]=genDC(ns+2);setYr(ns);setWk(0);setTeams(nt);setSched(genSched(nt));setFa(genFA());setDc(ndc);const nextPk=[];for(let rd=1;rd<=7;rd++)draftOrder.forEach((tid,idx)=>{nextPk.push({id:uid(),rd,num:idx+1,overall:(rd-1)*32+idx+1,owner:tid,orig:tid,yr:ns});});setSp("preseason");setPb(null);setTab("roster");setScPts(pr=>pr+5);setDraftPicks(nextPk);setDraftLog([]);setDraftIdx(0);setDraftActive(false);setLog(p=>[...p,`--- ${ns} Season ---`]);sm(`${ns} season!`);};
  const startSeason=()=>{setSp("regular");setWk(0);setTab("roster");sm("Season begins!");};
  const signP=p=>{const nt=[...teams];const sal=Math.round((p.ovr/99)*Rf(2,10)*100)/100;if(nt[ui].cap<sal){sm("Not enough cap!");return;}const np={...p,salary:sal,contract:R(1,3),ss:emptySS(p.pos),gl:[],scoutLvl:2};nt[ui].roster.push(np);nt[ui].cap-=sal;setTeams(nt);setFa(pr=>pr.filter(f=>f.id!==p.id));sm(`Signed ${np.name}`);};
  const releaseP=pid=>{const nt=[...teams];const idx=nt[ui].roster.findIndex(p=>p.id===pid);if(idx<0)return;const p=nt[ui].roster[idx];nt[ui].roster.splice(idx,1);nt[ui].cap+=p.salary*.5;setTeams(nt);setFa(pr=>[p,...pr]);setSel(null);sm(`Released ${p.name}`);};
  const scoutPlayer=(pid,classYr)=>{if(scPts<3){sm("Need 3 pts!");return;}if(!myScout){sm("Hire a scout!");return;}const ndc={...dc};const cls=ndc[classYr];if(!cls)return;const pi=cls.findIndex(p=>p.id===pid);if(pi<0)return;const p={...cls[pi]};const accB=(myScout.accuracy-50)/200;if(p.scoutLvl<2){p.scoutLvl=Math.min(2,p.scoutLvl+1);if(p.scoutLvl===1){p.scoutedOvr=cl(Math.round(p.trueOvr+R(-8,8)*(1-accB)),30,99);p.scoutedPot=cl(Math.round(p.truePot+R(-6,6)*(1-accB)),30,99);}else{p.scoutedOvr=cl(Math.round(p.trueOvr+R(-3,3)*(1-accB)),30,99);p.scoutedPot=cl(Math.round(p.truePot+R(-2,2)*(1-accB)),30,99);}}ndc[classYr]=[...cls.slice(0,pi),p,...cls.slice(pi+1)];setDc(ndc);setScPts(pr=>pr-3);sm(`Scouted ${p.name}`);};
  const evalTr=()=>{const gPv=trOff.g.reduce((s,p)=>s+p.tradeVal,0);const rPv=trOff.r.reduce((s,p)=>s+p.tradeVal,0);const gDv=trOff.gPk.reduce((s,pk)=>s+(PICK_VAL[pk.overall]||1)/50,0);const rDv=trOff.rPk.reduce((s,pk)=>s+(PICK_VAL[pk.overall]||1)/50,0);const gv=Math.round(gPv+gDv);const rv=Math.round(rPv+rDv);return{gv,rv,fair:Math.abs(gv-rv)<=18,d:rv-gv};};
  const execTr=()=>{if((!trOff.g.length&&!trOff.gPk.length)||(!trOff.r.length&&!trOff.rPk.length)||trTm==null)return;const ev=evalTr();if(!ev.fair&&ev.d<0){sm("Trade rejected!");return;}const nt=[...teams];const np=[...draftPicks];trOff.g.forEach(p=>{const i=nt[ui].roster.findIndex(r=>r.id===p.id);if(i>=0){const[rm]=nt[ui].roster.splice(i,1);nt[trTm].roster.push(rm);}});trOff.r.forEach(p=>{const i=nt[trTm].roster.findIndex(r=>r.id===p.id);if(i>=0){const[rm]=nt[trTm].roster.splice(i,1);nt[ui].roster.push(rm);}});trOff.gPk.forEach(pk=>{const i=np.findIndex(x=>x.id===pk.id);if(i>=0)np[i]={...np[i],owner:trTm};});trOff.rPk.forEach(pk=>{const i=np.findIndex(x=>x.id===pk.id);if(i>=0)np[i]={...np[i],owner:ui};});setTeams(nt);setDraftPicks(np);setLog(p=>[...p,`Trade with ${TEAMS[trTm].ab}`]);sm("Trade completed!");setTrOff({g:[],r:[],gPk:[],rPk:[]});};
  const tgS=col=>{if(sc===col)setSd(d=>-d);else{setSc(col);setSd(-1);}};
  const tgFS=col=>{if(faSc===col)setFaSd(d=>-d);else{setFaSc(col);setFaSd(-1);}};
  const stnd=useMemo(()=>teams.length?[...teams].sort((a,b)=>b.w-a.w||(b.pf-b.pa)-(a.pf-a.pa)):[],[teams]);
  const leaders=useMemo(()=>{if(!teams.length)return{};const cats={passing:["passYds","passTD","rate"],rushing:["rushYds","rushTD"],receiving:["recYds","recTD","rec"],defense:["tkl","sacks","ints","pd"],kicking:["fgM","pts"]};const ld={};for(const[g,stats]of Object.entries(cats)){ld[g]={};for(const st of stats){const all=[];teams.forEach(t=>t.roster.forEach(p=>{const v=p.ss?.[st];if(v!==undefined&&v>0)all.push({...p,tm:t.ab});}));all.sort((a,b)=>(b.ss?.[st]||0)-(a.ss?.[st]||0));ld[g][st]=all.slice(0,8);}}return ld;},[teams,wk]);
  const draftYears=Object.keys(dc).map(Number).sort();
  const myPicks=useMemo(()=>draftPicks.filter(pk=>pk.owner===ui),[draftPicks,ui]);
  const curPick=draftPicks[draftIdx];

  // ═══ PLAYER MODAL ═══
  const PM=({p,onClose})=>{if(!p)return null;const ss=p.ss||{};const dO=p.scoutLvl>=2?p.trueOvr:p.scoutedOvr||p.ovr;const dP=p.scoutLvl>=2?p.truePot:p.scoutedPot||p.pot;
    return(<div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.88)",zIndex:1000,display:"flex",alignItems:"center",justifyContent:"center",padding:12}} onClick={onClose}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.cd,borderRadius:14,padding:16,maxWidth:500,width:"100%",maxHeight:"85vh",overflowY:"auto",border:`1px solid ${C.bd}`}}>
        <div style={{display:"flex",gap:10,marginBottom:12}}><Face s={p.face} sz={50}/><div style={{flex:1}}><div style={{fontSize:18,fontWeight:900}}>{p.name}</div><div style={{display:"flex",gap:5,marginTop:3,alignItems:"center",flexWrap:"wrap"}}><Bdg pos={p.pos}/><span style={{color:C.mt,fontSize:10}}>Age {p.age} • {htS(p.ht_)} {p.wt}lbs • {p.bio?.college}</span></div></div><div style={{textAlign:"right"}}><div style={{fontSize:28,fontWeight:900,color:oC(dO)}}>{dO}</div><div style={{fontSize:8,color:C.mt}}>OVR</div></div></div>
        {p.injured&&<div style={{background:"#7f1d1d33",borderRadius:5,padding:"4px 8px",fontSize:10,color:"#fca5a5",marginBottom:8}}>🏥 {p.injType} — {p.injWk}wk</div>}
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:3,marginBottom:10}}>{[["OVR",dO],["POT",dP],["SPD",p.spd],["STR",p.str],["AGI",p.agi],["ACC",p.acc],["JMP",p.jmp],["END",p.end]].map(([l,v])=>(<div key={l} style={{background:C.bg,borderRadius:4,padding:"3px",textAlign:"center"}}><div style={{fontSize:7,color:C.mt}}>{l}</div><div style={{fontSize:14,fontWeight:800,color:oC(v)}}>{v}</div></div>))}</div>
        {p.posAttrs&&p.scoutLvl>=1&&<div style={{marginBottom:10}}><div style={{fontSize:8,color:C.bl,fontWeight:700,marginBottom:3}}>POSITION SKILLS</div><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:3}}>{Object.entries(p.posAttrs).slice(0,p.scoutLvl>=2?99:4).map(([k,v])=>(<div key={k} style={{background:C.bg,borderRadius:3,padding:"2px",textAlign:"center"}}><div style={{fontSize:6,color:C.mt}}>{k.slice(0,8)}</div><div style={{fontSize:11,fontWeight:700,color:oC(v)}}>{v}</div></div>))}</div></div>}
        {p.combine&&p.scoutLvl>=1&&<div style={{marginBottom:10}}><div style={{fontSize:8,color:C.gd,fontWeight:700,marginBottom:3}}>NFL COMBINE</div><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:3}}>{[["40-YD",p.combine.fortyYd+"s"],["BENCH",p.combine.bench],["VERT",p.combine.vert+'"'],["BROAD",p.combine.broad+'"'],["3-CONE",p.combine.threeCone+"s"],["SHUTTLE",p.combine.shuttle+"s"]].map(([l,v])=>(<div key={l} style={{background:C.bg,borderRadius:3,padding:"2px",textAlign:"center"}}><div style={{fontSize:6,color:C.mt}}>{l}</div><div style={{fontSize:10,fontWeight:700,color:"#cbd5e1"}}>{v}</div></div>))}</div>{p.proDay&&<><div style={{fontSize:8,color:"#a78bfa",fontWeight:700,marginTop:5,marginBottom:3}}>PRO DAY</div><div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:3}}>{[["40-YD",p.proDay.fortyYd+"s"],["BENCH",p.proDay.bench],["VERT",p.proDay.vert+'"'],["BROAD",p.proDay.broad+'"'],["3-CONE",p.proDay.threeCone+"s"],["SHUTTLE",p.proDay.shuttle+"s"]].map(([l,v])=>(<div key={`pd${l}`} style={{background:C.bg,borderRadius:3,padding:"2px",textAlign:"center"}}><div style={{fontSize:6,color:C.mt}}>{l}</div><div style={{fontSize:10,fontWeight:700,color:"#c4b5fd"}}>{v}</div></div>))}</div></>}</div>}
        {p.colStats&&<div style={{marginBottom:10}}><div style={{fontSize:8,color:"#fb923c",fontWeight:700,marginBottom:3}}>COLLEGE ({p.colYrs}yr — {p.bio?.college})</div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(48px,1fr))",gap:2}}>{Object.entries(p.colStats).filter(([,v])=>typeof v==="number"&&v>0).map(([k,v])=>(<div key={k} style={{background:C.bg,borderRadius:3,padding:"2px",textAlign:"center"}}><div style={{fontSize:6,color:C.mt}}>{sL(k)}</div><div style={{fontSize:10,fontWeight:700,color:"#fdba74"}}>{fm(v)}</div></div>))}</div></div>}
        <div style={{marginBottom:10}}><div style={{fontSize:8,color:C.gn,fontWeight:700,marginBottom:2}}>SCOUTING</div><div style={{fontSize:10,color:"#94a3b8",lineHeight:1.5}}>{p.bio?.strengths?.map((s,i)=><div key={i}>✅ {s}</div>)}{p.bio?.weaknesses?.map((w,i)=><div key={i} style={{color:"#f97316"}}>⚠️ {w}</div>)}</div>{p.bio?.fact&&<div style={{fontSize:9,color:C.mt,marginTop:3,fontStyle:"italic"}}>📝 {p.bio.fact}</div>}</div>
        {ss.gp>0&&<div style={{marginBottom:10}}><div style={{fontSize:8,color:C.bl,fontWeight:700,marginBottom:2}}>{yr} STATS • AV: <span style={{color:C.gd}}>{p.av}</span></div><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(44px,1fr))",gap:2}}>{Object.entries(ss).filter(([,v])=>typeof v==="number").map(([k,v])=>(<div key={k} style={{background:C.bg,borderRadius:3,padding:"2px",textAlign:"center"}}><div style={{fontSize:6,color:C.mt}}>{sL(k)}</div><div style={{fontSize:10,fontWeight:700,color:"#cbd5e1"}}>{fm(v)}</div></div>))}</div></div>}
        <div style={{display:"flex",gap:5}}>{ut?.roster.find(r=>r.id===p.id)&&<Btn onClick={()=>{releaseP(p.id);onClose();}} bg="#7f1d1d" c="#fca5a5" style={{flex:1}}>Release</Btn>}<Btn onClick={onClose} bg={C.bd} style={{flex:1}}>Close</Btn></div>
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
  if(phase==="splash")return(<div style={{minHeight:"100vh",background:`linear-gradient(135deg,${C.bg},#131b2e)`,display:"flex",alignItems:"center",justifyContent:"center",fontFamily:C.f,color:C.tx}}><div style={{textAlign:"center"}}><div style={{fontSize:15,letterSpacing:8,textTransform:"uppercase",color:C.gn,fontWeight:600}}>Gridiron</div><h1 style={{fontSize:68,fontWeight:900,margin:0,background:"linear-gradient(to bottom,#fff,#94a3b8)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>GM</h1><div style={{fontSize:10,color:"#475569",letterSpacing:2}}>V3.2 — LIVE SIM • BOX SCORES • FULL DRAFT</div><Btn onClick={()=>setPhase("teamSelect")} bg={C.gn} style={{padding:"12px 44px",fontSize:15,marginTop:16,borderRadius:8}}>NEW GAME</Btn></div></div>);
  if(phase==="teamSelect")return(<div style={{minHeight:"100vh",background:C.bg,fontFamily:C.f,color:C.tx,padding:24}}><h2 style={{textAlign:"center",fontSize:20,fontWeight:800,marginBottom:16}}>Choose Your Team</h2><div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:6,maxWidth:900,margin:"0 auto"}}>{TEAMS.map((t,i)=><button key={i} onClick={()=>startGame(i)} style={{background:`linear-gradient(135deg,${t.clr}cc,${t.clr})`,border:`2px solid ${t.ac}33`,borderRadius:8,padding:"10px 8px",cursor:"pointer",textAlign:"left",color:"#fff"}}><div style={{fontSize:8,textTransform:"uppercase",letterSpacing:2,opacity:.7}}>{t.city}</div><div style={{fontSize:14,fontWeight:800}}>{t.name}</div><div style={{fontSize:8,color:t.ac,fontWeight:700,marginTop:2}}>{t.ab} • {t.c} {t.d}</div></button>)}</div></div>);

  const TABS=["roster","standings","schedule","stats","scouting","trade","draft","freeagency","playoffs","log"];
  if(liveSim)TABS.push("livesim");
  const phaseFlow=sp==="regular"?`Wk ${wk}/17`:sp==="playoffs"?"Playoffs":sp==="combine"?"Combine":sp==="draft"?"Draft":sp==="freeagency"?"Free Agency":"Preseason";

  return(<div style={{minHeight:"100vh",background:C.bg,fontFamily:C.f,color:C.tx,display:"flex",flexDirection:"column"}}>
    {sel&&<PM p={sel} onClose={()=>setSel(null)}/>}
    {boxView&&<BoxModal g={boxView} onClose={()=>setBoxView(null)}/>}
    <div style={{background:"linear-gradient(90deg,#0f172a,#1e293b)",padding:"6px 12px",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:`1px solid ${C.bd}`,flexWrap:"wrap",gap:4}}>
      <div style={{display:"flex",alignItems:"center",gap:6}}><div style={{width:26,height:26,borderRadius:4,background:`linear-gradient(135deg,${ut?.clr},${ut?.ac})`,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:900,fontSize:8,color:"#fff"}}>{ut?.ab}</div><div><div style={{fontWeight:800,fontSize:12}}>{ut?.city} {ut?.name}</div><div style={{fontSize:8,color:C.mt}}>{yr} • {ut?.w}W-{ut?.l}L • Cap ${ut?.cap?.toFixed(1)}M • SP:{scPts}</div></div></div>
      <div style={{display:"flex",alignItems:"center",gap:4,flexWrap:"wrap"}}>
        <span style={{fontSize:8,padding:"2px 6px",borderRadius:10,background:`${C.bl}22`,color:C.bl,fontWeight:700}}>{phaseFlow}</span>
        {sp==="preseason"&&<Btn onClick={startSeason} bg={C.gn}>Start Season</Btn>}
        {sp==="regular"&&<><Btn onClick={simWk}>Sim Week</Btn><Btn onClick={simAll} bg="#6366f1">Sim All</Btn></>}
        {sp==="playoffs"&&pb&&!pb.ch&&<Btn onClick={simPR} bg={C.gd} c="#000">Sim Round</Btn>}
        {sp==="playoffs"&&pb?.ch!=null&&<Btn onClick={goToCombine} bg="#7c3aed">→ Combine</Btn>}
        {sp==="combine"&&<Btn onClick={startDraft} bg={C.gd} c="#000">→ Draft</Btn>}
        {sp==="draft"&&draftActive&&<><Btn onClick={()=>setDraftPaused(p=>!p)} bg={draftPaused?"#22c55e":"#f97316"}>{draftPaused?"▶ Resume":"⏸ Pause"}</Btn><Btn onClick={simEntireDraft} bg="#6366f1">⏭ Sim Draft</Btn></>}
        {sp==="freeagency"&&<Btn onClick={newSeason} bg={C.gn}>→ Next Season</Btn>}
      </div>
    </div>
    {msg&&<div style={{background:`${C.gn}12`,borderLeft:`3px solid ${C.gn}`,padding:"4px 10px",fontSize:10,color:C.gn,fontWeight:600}}>{msg}</div>}
    <div style={{display:"flex",background:"#0f172a",borderBottom:`1px solid ${C.bd}`,overflowX:"auto"}}>{TABS.map(t=><button key={t} onClick={()=>setTab(t)} style={{background:tab===t?"#1e293b":"transparent",color:tab===t?"#fff":C.mt,border:"none",borderBottom:tab===t?`2px solid ${C.gn}`:"2px solid transparent",padding:"6px 10px",fontSize:9,fontWeight:700,cursor:"pointer",textTransform:"uppercase",whiteSpace:"nowrap"}}>{t==="freeagency"?"FA":t==="livesim"?"⚡LIVE":t}</button>)}</div>
    <div style={{flex:1,padding:"8px 12px",overflowY:"auto",maxHeight:"calc(100vh - 105px)"}}>

    {/* ROSTER */}
    {tab==="roster"&&ut&&<PlayerTable players={ut.roster} setSel={setSel} sortCol={sc} sortDir={sd} onSort={tgS} posFilter={rPosF} setPosFilter={setRPosF}/>}

    {/* STANDINGS */}
    {tab==="standings"&&<div>{stnd.map((t,i)=><div key={t.id} style={{display:"flex",alignItems:"center",gap:6,padding:"4px 6px",background:t.id===ui?`${C.gn}11`:i%2?"transparent":C.cd+"44",borderRadius:3,fontSize:11}}><span style={{color:C.mt,fontWeight:700,minWidth:16}}>{i+1}</span><div style={{width:14,height:14,borderRadius:3,background:TEAMS[t.id].clr}}/><span style={{flex:1,fontWeight:t.id===ui?800:400}}>{t.city} {t.name}</span><span style={{fontWeight:700,minWidth:48}}>{t.w}-{t.l}{t.t?`-${t.t}`:""}</span><span style={{color:C.mt,fontSize:9,minWidth:55}}>PF:{t.pf} PA:{t.pa}</span></div>)}</div>}

    {/* SCHEDULE */}
    {tab==="schedule"&&<div>
      {Array.from({length:17},(_, w)=>w+1).map(week=>{const games=sched.filter(g=>g.wk===week);const ug=games.find(g=>g.h===ui||g.a===ui);
        return(<div key={week} style={{marginBottom:8}}>
          <div style={{fontSize:9,fontWeight:700,color:C.gd,marginBottom:3}}>WEEK {week}</div>
          {games.map((g,i)=>{const isU=g.h===ui||g.a===ui;
            return(<div key={i} style={{display:"flex",alignItems:"center",gap:6,padding:"3px 6px",background:isU?`${C.gn}08`:"transparent",borderLeft:isU?`3px solid ${C.gn}`:"3px solid transparent",fontSize:10}}>
              <span style={{fontWeight:g.played&&g.hs>g.as?800:400,minWidth:36}}>{teams[g.h]?.ab}</span>
              <span style={{color:C.mt,fontSize:9}}>{g.played?`${g.hs} - ${g.as}`:"vs"}</span>
              <span style={{fontWeight:g.played&&g.as>g.hs?800:400,minWidth:36}}>{teams[g.a]?.ab}</span>
              {g.played&&(g.boxH||g.boxA)&&<button onClick={()=>setBoxView(g)} style={{background:`${C.bl}22`,color:C.bl,border:`1px solid ${C.bl}44`,padding:"1px 5px",borderRadius:3,fontSize:8,fontWeight:700,cursor:"pointer"}}>📊 Box</button>}
              {!g.played&&isU&&sp==="regular"&&wk<week&&<button onClick={()=>startLiveSim(g)} style={{background:`${C.gn}22`,color:C.gn,border:`1px solid ${C.gn}44`,padding:"1px 5px",borderRadius:3,fontSize:8,fontWeight:700,cursor:"pointer"}}>⚡ Live Sim</button>}
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
      <div style={{display:"flex",gap:3,marginBottom:6}}>{draftYears.map(y=><button key={y} onClick={()=>setScView(y)} style={{background:(scView||yr)===y?"#1e293b":"transparent",color:(scView||yr)===y?"#fff":C.mt,border:`1px solid ${C.bd}`,padding:"3px 8px",borderRadius:3,fontSize:8,fontWeight:700,cursor:"pointer"}}>{y}{y===yr?" ★":""}</button>)}</div>
      {(dc[scView||yr]||[]).slice(0,30).map((p,i)=><div key={p.id} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 5px",borderBottom:`1px solid ${C.bd}11`,fontSize:10}}>
        <span style={{color:C.mt,fontWeight:700,minWidth:16}}>{i+1}</span><Face s={p.face} sz={20}/><PN p={p} setSel={setSel} style={{flex:1}}/><Bdg pos={p.pos}/>
        <span style={{color:"#94a3b8",fontSize:8}}>{p.age} • {p.bio?.college}</span>
        <span style={{color:p.scoutLvl>=2?oC(p.trueOvr):p.scoutLvl>=1?"#94a3b8":"#475569",fontWeight:700,fontSize:9}}>{p.scoutLvl>=2?p.trueOvr:p.scoutLvl>=1?`~${p.scoutedOvr}`:"??"}</span>
        {p.scoutLvl<2&&<Btn onClick={()=>scoutPlayer(p.id,scView||yr)} disabled={scPts<3||!myScout} bg={`${C.bl}22`} c={C.bl} style={{padding:"1px 5px",fontSize:8}}>Scout</Btn>}
      </div>)}
    </div>}

    {/* TRADE */}
    {tab==="trade"&&<div>
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
        {(dc[yr]||[]).slice(0,20).map((p,i)=><div key={p.id} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 5px",borderBottom:`1px solid ${C.bd}11`,fontSize:10}}>
          <span style={{color:C.mt,fontWeight:700,minWidth:16}}>{i+1}</span><Face s={p.face} sz={20}/><PN p={p} setSel={setSel} style={{flex:1}}/><Bdg pos={p.pos}/>
          <span style={{color:"#94a3b8",fontSize:8}}>{p.age} • {p.bio?.college}</span>
          <span style={{color:p.scoutLvl>=2?oC(p.trueOvr):"#94a3b8",fontWeight:700,fontSize:9}}>{p.scoutLvl>=2?p.trueOvr:p.scoutLvl>=1?`~${p.scoutedOvr}`:"??"}</span>
          {curPick.owner===ui&&<Btn onClick={()=>makePick(p)} bg={C.gn} style={{padding:"2px 6px"}}>Draft</Btn>}
        </div>)}
      </div>:<div>
        <div style={{display:"flex",gap:3,marginBottom:6}}>{draftYears.map(y=><button key={y} onClick={()=>setScView(y)} style={{background:(scView||yr)===y?"#1e293b":"transparent",color:(scView||yr)===y?"#fff":C.mt,border:`1px solid ${C.bd}`,padding:"3px 8px",borderRadius:3,fontSize:8,fontWeight:700,cursor:"pointer"}}>{y}{y===yr?" ★":""}</button>)}</div>
        {sp==="combine"&&<div style={{background:"#7c3aed22",border:"1px solid #7c3aed44",borderRadius:5,padding:"4px 8px",fontSize:9,color:"#c4b5fd",marginBottom:6}}>✅ Combine & Pro Days complete!</div>}
        {(dc[scView||yr]||[]).slice(0,30).map((p,i)=><div key={p.id} style={{display:"flex",alignItems:"center",gap:4,padding:"3px 5px",borderBottom:`1px solid ${C.bd}11`,fontSize:10}}>
          <span style={{color:C.mt,fontWeight:700,minWidth:16}}>{i+1}</span><Face s={p.face} sz={20}/><PN p={p} setSel={setSel} style={{flex:1}}/><Bdg pos={p.pos}/>
          <span style={{color:"#94a3b8",fontSize:8}}>{p.age} • {htS(p.ht_)} {p.wt} • {p.bio?.college}</span>
          <span style={{fontSize:8,color:p.scoutLvl>=2?oC(p.trueOvr):p.scoutLvl>=1?"#94a3b8":"#475569",fontWeight:700}}>{p.scoutLvl>=2?p.trueOvr:p.scoutLvl>=1?`~${p.scoutedOvr}`:"??"}</span>
        </div>)}
      </div>}
      {draftLog.length>0&&<div style={{marginTop:10}}><div style={{fontSize:9,fontWeight:700,color:C.gd,marginBottom:3}}>DRAFT LOG</div>{draftLog.slice().reverse().slice(0,15).map((d,i)=><div key={i} style={{padding:"2px 5px",fontSize:9,color:d.owner===ui?C.gn:"#94a3b8",borderLeft:d.owner===ui?`3px solid ${C.gn}`:"3px solid transparent"}}>{d.text}</div>)}</div>}
    </div>}

    {/* FREE AGENCY */}
    {tab==="freeagency"&&<div>
      <div style={{fontSize:9,color:C.mt,marginBottom:5}}>Cap: <span style={{color:C.gd,fontWeight:700}}>${ut?.cap?.toFixed(1)}M</span> • {fa.length} free agents</div>
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
          {!liveDone&&<Btn onClick={()=>setLivePaused(p=>!p)} bg={livePaused?"#22c55e":"#f97316"} style={{padding:"3px 8px"}}>{livePaused?"▶":"⏸"}</Btn>}
          <Btn onClick={()=>{setLiveSim(null);setTab("schedule");}} bg={C.bd} style={{padding:"3px 8px"}}>✕</Btn>
        </div>
      </div>
      {!liveDone&&<div style={{fontSize:9,color:C.mt,marginBottom:4}}>
        {livePoss==="h"?teams[liveSim.h]?.ab:teams[liveSim.a]?.ab} ball • {liveDown}{liveDown===1?"st":liveDown===2?"nd":liveDown===3?"rd":"th"} & {liveToGo} • Ball at {liveYard} yd line
      </div>}
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
    {tab==="log"&&<div style={{maxWidth:550}}>{log.slice().reverse().map((e,i)=><div key={i} style={{padding:"2px 6px",borderBottom:`1px solid ${C.bd}11`,fontSize:10,color:e.includes("🏆")?C.gd:e.includes("---")?C.bl:e.includes("W ")?C.gn:e.includes("L ")?C.rd:"#94a3b8"}}>{e}</div>)}</div>}

    </div>
  </div>);
}
