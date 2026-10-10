// The league's engine room: player generation, schedules, the game sim wrapper, injuries,
// coaches, the cap and the shared helpers the screens use. Pure JavaScript (no React), so it can
// be tested directly. Moved out of App.jsx.
import M27 from "./data/madden27.json" with { type: "json" };
import SPECIAL from "./data/special.json" with { type: "json" };
import REAL_SCHED from "./data/schedule2026.json" with { type: "json" };
import REAL_DC from "./data/realProspects.json" with { type: "json" };
import { depthOrderFor } from "./depth.js";
import { playerValue, pickValue as chartPickValue } from "./trade.js";
import { arrangeDL, dlAsPlayed } from "./dline.js";
import { makeSide, createGame, playGame, setLeague } from "./playsim.js";
import { unitRatings } from "./gamesim.js";
import { DATA_TO_DOLLARS, leagueCap } from "./cap.js";
import { teamSnaps } from "./snaps.js";
import { nflSchedule, divisionPlaces } from "./schedule.js";
import { aiDraftScore, devOf, rankClass, plantGems, plantBusts, gemGap, draftCollege, kpValue } from "./scouting.js";

// Contract incentives that fit the position: a quarterback's is about passing, an edge rusher's sacks.
const INCENTIVES={QB:['4,000 pass yds','30 pass TD','Pro Bowl','12+ wins'],RB:['1,000 rush yds','10 rush TD','Pro Bowl'],WR:['1,000 rec yds','8 rec TD','80 catches'],TE:['700 rec yds','60 catches','6 rec TD'],
  OL:['Pro Bowl','All-Pro','17 starts'],DL:['10 sacks','8 sacks','Pro Bowl'],LB:['100 tackles','5 sacks','Pro Bowl'],CB:['5 INT','15 pass def','Pro Bowl'],S:['4 INT','90 tackles','Pro Bowl'],K:['30 FG made','90% on FGs'],P:['45.0 yd avg','Pro Bowl']};
const INC_GROUP={LT:'OL',LG:'OL',C:'OL',RG:'OL',RT:'OL',OL:'OL',G:'OL',T:'OL',DL:'DL',DE:'DL',DT:'DL',LE:'DL',RE:'DL',EDGE:'DL',LB:'LB',MLB:'LB',OLB:'LB',ROLB:'LB',LOLB:'LB',MIKE:'LB',CB:'CB',S:'S',FS:'S',SS:'S'};
export const incentiveOptions=(pos)=>INCENTIVES[pos]||INCENTIVES[INC_GROUP[pos]]||['Pro Bowl','10+ wins'];
// Older saves picked incentives from one list for everybody; show a fitting one instead.
export const fitIncentive=(p)=>{const o=incentiveOptions(p.mpos==='EDGE'?'DL':p.pos);const th=p.bonus?.threshold;if(o.includes(th))return th;let h=0;for(const c of String(p.id))h=(h*31+c.charCodeAt(0))>>>0;return o[h%o.length];};

export const R=(a,b)=>Math.floor(Math.random()*(b-a+1))+a;
export const Rf=(a,b)=>Math.random()*(b-a)+a;
export const pick=a=>a[R(0,a.length-1)];
export const cl=(v,lo,hi)=>Math.max(lo,Math.min(hi,v));
export const uid=()=>Math.random().toString(36).slice(2,9);
export const G=(m,s)=>{let u=0,v=0;while(!u)u=Math.random();while(!v)v=Math.random();return m+s*Math.sqrt(-2*Math.log(u))*Math.cos(2*Math.PI*v);};
export const Gc=(m,s,lo,hi)=>cl(Math.round(G(m,s)),lo,hi);
export const htS=i=>`${Math.floor(i/12)}'${i%12}"`;
export const fm=v=>typeof v==="number"?(v===0?"0":Number.isInteger(v)?String(v):v.toFixed(1)):v;
// ═══════════ DATA ═══════════
export const FN=["Marcus","Tyler","Jaylen","Caleb","Darius","Malik","Jalen","DeShawn","Travis","Bryce","Carter","Aiden","Xavier","Micah","Devonte","Kyler","Lamar","Russell","Patrick","Josh","Justin","Trey","Aaron","Jordan","Brandon","Cameron","Isaiah","Ezekiel","Derrick","Andre","Chris","Ryan","Michael","Daniel","David","James","Robert","William","Zach","Elijah","DeAndre","Khalil","Tyreek","Davante","Cooper","AJ","TJ","Myles","Nick","Chase","CeeDee","Drake","Bijan","Breece","Kenneth","Saquon","Austin","Garrett","Trent","Quenton","Penei","Rashawn","Dameon","Devin","Jameson","Roquan","Fred","Bobby","Jaire","Trevon","Marlon","Budda","Derwin","Minkah","Harrison","Jake","Evan","Matt","Joe","Baker","Geno","Sam","Bo","Brock","Jayden","Amari","Stefon","Puka","Tank","Rome","Brian","George","Aidan","Jared","Maxx","Danielle","Dexter","Quinnen","Christian","Vita","Grady","Javon","Rashan","Tremaine","Terrance","Raheem","Damien","Treylon","Quentin","Jarrett","Jaxon","Luther","Ashton","Jonah","Quinn","Colston","Shemar","Mykel","Donovan","Savion","Keenan","Shilo","Deon","Nasir","Ahmad","Sterling","Dorian","Dante","Ezra","Felix","Ivan","Jasper","Leo","Orion","Seth","Theo","Victor","Zion","Clay","Eli","Flynn","Gage","Holt","Jett","Kane","Lance","Nash","Ryker","Trace","Wesley","Xander","Damon","Jabari","Kendrick","Tariq","Desmond","Leon","Roman","Jarvis","Kenan","Nate","Luke","Erik","Kyle","Blake","Dylan","Sean","Connor","Liam","Noah","Ethan","Owen","Wyatt","Logan","Declan","Landon","Colton","Reid","Troy","Cordell","Diontae","Mekhi","Pierre","Cam","Von","Ronnie","Torrey","Karon","Dre","Tavion","Leroy","Curtis","Reggie","Jimmy","Randy","Tony","Danny","Kenny","Eddie","Percy","Vincent","Clarence","Jerome","Cedric","Antoine","Terrell","Dwayne","Devon","Reginald","Kareem","Rashid","Hakeem","Abdul","Omar"];
export const LN=["Williams","Johnson","Smith","Brown","Jones","Davis","Miller","Wilson","Moore","Taylor","Anderson","Thomas","Jackson","White","Harris","Martin","Thompson","Robinson","Clark","Lewis","Lee","Walker","Hall","Allen","Young","King","Wright","Hill","Scott","Green","Adams","Baker","Nelson","Carter","Mitchell","Roberts","Turner","Phillips","Campbell","Parker","Evans","Edwards","Collins","Stewart","Morris","Rogers","Reed","Cook","Morgan","Bell","Murphy","Bailey","Rivera","Cooper","Richardson","Howard","Ward","Peterson","Gray","Watson","Brooks","Kelly","Sanders","Price","Bennett","Wood","Barnes","Ross","Henderson","Coleman","Jenkins","Perry","Powell","Long","Patterson","Hughes","Flores","Washington","Butler","Simmons","Foster","Bryant","Alexander","Russell","Griffin","Hayes","Ford","Hamilton","Graham","Sullivan","Wallace","Cole","Jordan","Owens","Reynolds","Fisher","Ellis","Harrison","Gibson","Marshall","Murray","Freeman","Wells","Webb","Simpson","Stevens","Tucker","Porter","Hunter","Hicks","Crawford","Henry","Boyd","Mason","Kennedy","Warren","Dixon","Burns","Gordon","Shaw","Holmes","Rice","Hunt","Watkins","Chambers","Pierce","Reyes","Grant","Watts","Cross","Booth","Spencer","Gaines","Brewer","Burton","Clayton","Curry","Davenport","Dean","Diaz","Dunn","Farmer","Fitzgerald","Flowers","Floyd","Glover","Graves","Hardy","Hart","Hawkins","Haynes","Herman","Hines","Hopkins","Horn","Knight","Knox","Lambert","Lane","Lawrence","Little","Lloyd","Lynch","Mack","Maxwell","McCarthy","McDaniel","McKinney","McLean","Miles","Montgomery","Moon","Moses","Moss","Nash","Norris","Norton","Oliver","Padilla","Page","Pearson","Pena","Pittman","Poole","Potter","Ramsey","Rhodes","Robbins","Rodgers","Roman","Romero","Salazar","Sanchez","Saunders","Savage","Sharp","Singh","Singleton","Soto","Stephens","Strickland","Strong","Summers","Sutton","Swanson","Tate","Terry","Thornton","Tillman","Todd","Torres","Ware","Waters","Weaver","Weber","Wheeler","Whitfield","Wilkins","Willis","Winters","Wolf","Wong","Woods","Wyatt","Yates","Chan"];
export const COL=["Alabama","Ohio State","Georgia","LSU","Clemson","Michigan","Notre Dame","Oklahoma","Texas","Oregon","Penn State","USC","Florida","Auburn","Florida State","Tennessee","Wisconsin","Iowa","Stanford","UCLA","Miami","Texas A&M","Ole Miss","Arkansas","NC State","Pittsburgh","Kentucky","Minnesota","Washington","Baylor","TCU","Utah","Colorado","Arizona State","Nebraska","Missouri","South Carolina","North Carolina","Maryland","Mississippi State","Kansas State","Oklahoma State","Syracuse","BYU","Houston","Cincinnati","UCF","SMU","Tulane","Boise State","San Diego State","Fresno State","Virginia Tech","Georgia Tech","Wake Forest","Virginia","West Virginia","Vanderbilt","Purdue","Michigan State","Iowa State","Illinois","Indiana","Rutgers","Northwestern","Duke","Louisville","Memphis","Temple","Liberty","Coastal Carolina","James Madison","Sam Houston","Troy","Marshall","Western Kentucky","Northern Illinois","Ball State","Ohio","Kent State","Central Michigan","Western Michigan","Toledo","Florida Atlantic","Middle Tennessee","UAB","Southern Miss","Charlotte","Texas State","Texas Tech","Air Force","Navy","Army","Rice","UTSA","UTEP","Appalachian State","Eastern Michigan","Old Dominion"];
export const POS=["QB","RB","WR","TE","LT","LG","C","RG","RT","DL","LB","CB","S","K","P"];
export const PP={QB:{h:74.5,hs:1.8,w:220,ws:12,hR:[71,78],wR:[200,245]},RB:{h:70,hs:1.5,w:210,ws:10,hR:[66,73],wR:[185,235]},WR:{h:73,hs:2,w:195,ws:12,hR:[68,77],wR:[170,225]},TE:{h:76,hs:1.5,w:250,ws:10,hR:[73,79],wR:[235,270]},LT:{h:77,hs:1.2,w:320,ws:10,hR:[75,79],wR:[308,345]},LG:{h:76.5,hs:1.2,w:316,ws:12,hR:[74,78],wR:[298,340]},C:{h:75.5,hs:1.2,w:304,ws:10,hR:[73,78],wR:[288,322]},RG:{h:76.5,hs:1.2,w:316,ws:12,hR:[74,78],wR:[298,340]},RT:{h:77,hs:1.2,w:320,ws:10,hR:[75,79],wR:[308,345]},DL:{h:76,hs:1.5,w:290,ws:18,hR:[73,79],wR:[255,340]},LB:{h:74,hs:1.3,w:240,ws:10,hR:[72,76],wR:[225,265]},CB:{h:71,hs:1.8,w:190,ws:8,hR:[68,75],wR:[175,210]},S:{h:72,hs:1.5,w:205,ws:8,hR:[70,75],wR:[190,220]},K:{h:72,hs:1.5,w:195,ws:10,hR:[69,75],wR:[180,215]},P:{h:74,hs:1.5,w:210,ws:10,hR:[71,77],wR:[190,235]}};
export const CA={QB:{f:4.85,b:18,v:32,br:112,t:7.1,s:4.35},RB:{f:4.52,b:20,v:35,br:120,t:7.0,s:4.2},WR:{f:4.48,b:14,v:36,br:122,t:6.9,s:4.15},TE:{f:4.7,b:20,v:33,br:116,t:7.1,s:4.3},LT:{f:5.22,b:26,v:28,br:104,t:7.65,s:4.72},LG:{f:5.18,b:27,v:28,br:105,t:7.58,s:4.68},C:{f:5.12,b:26,v:29,br:106,t:7.55,s:4.65},RG:{f:5.18,b:27,v:28,br:105,t:7.58,s:4.68},RT:{f:5.22,b:26,v:28,br:104,t:7.65,s:4.72},DL:{f:4.9,b:25,v:31,br:112,t:7.3,s:4.5},LB:{f:4.65,b:22,v:34,br:118,t:7.0,s:4.25},CB:{f:4.45,b:14,v:37,br:124,t:6.85,s:4.1},S:{f:4.5,b:16,v:36,br:121,t:6.95,s:4.15},K:{f:4.9,b:15,v:30,br:108,t:7.2,s:4.4},P:{f:4.9,b:14,v:30,br:108,t:7.2,s:4.4}};
// The 32 NFL clubs, with rosters and ratings from EA SPORTS Madden NFL 27 (see scripts/build-madden27.py).
export const TEAMS=M27.teams.map(({roster,ps,...t})=>t);
export const PA={QB:["armStr","accuracy","pocketAwr","decisions","mobility","touch","readDef"],RB:["vision","elusiveness","breakTkl","passBlock","receiving","burst","balance","stiffArm"],WR:["routeRun","catching","separation","release","bodyCtrl","yac","deepSpd","catchTraffic"],TE:["blocking","receiving","routeRun","redZone","passBlock","yac","seaming","toughness"],LT:["passBlock","footwork","anchor","awareness","handUse","reach","agility","toughness"],LG:["runBlock","anchor","pulling","passBlock","footwork","strength","drive","toughness"],C:["awareness","snapping","passBlock","runBlock","footwork","leadership","anchor","athleticism"],RG:["runBlock","anchor","pulling","passBlock","footwork","strength","drive","toughness"],RT:["passBlock","anchor","footwork","runBlock","handUse","power","reach","toughness"],DL:["passRush","runStop","handUse","motor","getOff","bullRush","swim","spin"],LB:["tackling","coverage","blitzing","runFit","instincts","pursuit","shedBlock","zoneAwr"],CB:["manCov","zoneCov","press","ballSkills","tackling","recovery","footwork","playRec"],S:["range","runSupport","coverage","tackling","ballHawk","blitzing","comms","versatility"],K:["legStr","accuracy","clutch","distance","hangTime","consistency","coldWx","pressure"],P:["power","accuracy","hangTime","coffin","consistency","coldWx","pressure","clutch"]};
export const STRS={QB:["Elite pocket presence","Exceptional arm talent","Reads defenses pre-snap","Natural leader","Anticipation throws","Deep ball accuracy","Quick release","High football IQ","Extends plays","Poised under pressure","Pro-ready mechanics"],RB:["Explosive first step","Excellent vision","Breaks arm tackles","Elite lateral agility","Reliable pass catcher","Powerful short yardage","Patient runner","Home run speed"],WR:["Creates separation","Reliable hands","Elite speed","Contested catch ability","Precise route runner","Dangerous after catch","Deep threat","Body control on sideline"],TE:["Mismatch weapon","Reliable blocker","Red zone threat","Routes like a receiver","Soft hands in traffic","Versatile inline/flexed"],LT:["Blindside protector","Elite pass set","Handles speed rushers","Quick feet in space","Longest reach in class"],LG:["Devastating run blocker","Nasty finisher","Gets to second level","Pulls well","Pancakes defenders"],C:["Makes protection calls","Crisp snaps under pressure","NFL-ready football IQ","Handles nose tackles","Natural leader"],RG:["Physical interior blocker","Strong at the point","Handles bull rush","Reliable run blocker","Consistent performer"],RT:["Solid right tackle","Sets the edge","Handles power rushers","Nasty in the run game","Versatile starter"],DL:["Explosive first step","Violent hands","Collapses pocket","Relentless motor","Pass rush repertoire","Stout vs run"],LB:["Sideline-to-sideline range","Downhill thumper","Coverage ability","Blitz timing","Wrap-up tackler","QB of defense"],CB:["Lockdown man coverage","Elite ball skills","Mirror ability","Recovery speed","Press technique"],S:["Rangey centerfielder","Hard-hitting enforcer","Box/deep versatility","Ball-hawk instincts","Closing speed"],K:["Ice water veins","50+ yard leg","Consistent mechanics","Clutch performer"],P:["Booming leg","Pins them inside the 10","Great hang time","Directional control"]};
export const WKNS={QB:["Holds ball too long","Inconsistent footwork","Limited mobility","Telegraphs throws"],RB:["Struggles pass protection","Fumble-prone","Limited route tree","Below-average speed"],WR:["Drops on contested catches","Limited blocking","Gets jammed at line","Body catcher"],TE:["Liability in pass protection","Limited speed","Drops in traffic"],LT:["Struggles vs speed edge rushers","Anchor breaks on bull rush","Beaten around the arc"],LG:["Limited in pass pro","Slow to recover on stunts","Penalty-prone"],C:["Smaller frame","Displaced by big nose tackles","Limited pulling range"],RG:["Limited in pass pro","Slow to recover on stunts","Penalty-prone"],RT:["Inconsistent anchor","Struggles with length rushers","Technical faults in pass set"],DL:["Washed out by double teams","Inconsistent motor","Limited pass rush moves"],LB:["Liability in coverage","Bad angles","Slow to shed blocks"],CB:["Grabby when beaten","Bites on double moves","Inconsistent tackling"],S:["Poor man coverage","Bad angles","Overaggressive"],K:["Struggles beyond 50","Inconsistent in wind"],P:["Line-drive punts","Outkicks his coverage","Shanks under pressure"]};
export const FACTS=["Grew up on a ranch, didn't play football until sophomore year.","State champion wrestler.","Has an identical twin brother.","First in, last out of the weight room.","Speaks three languages fluently.","Walk-on who earned a scholarship.","Set his high school's scoring record.","Ran a 4.33 forty at Pro Day.","Father played 10 seasons in the league.","Volunteers at youth camps.","Recruited as basketball player.","Turned down baseball draft.","Bench pressed 225 for 30 reps.","Overcame torn ACL in college.","High school valedictorian.","Clocked at 22.4 mph in-game.","Played both ways in high school.","Captain three consecutive years.","From a town under 2,000 people.","Studies 30+ hours of film per week.","Once scored 6 TDs in a single game.","Named team captain as a freshman.","Started a foundation for underprivileged youth.","Was a national chess champion in high school.","Raised on a military base overseas.","Went undrafted; earned his roster spot as a street free agent.","His mother attended every single college game.","Works as a volunteer firefighter in the offseason.","Learned to play guitar while recovering from injury.","Grew up speaking Spanish as his first language.","Once returned a kickoff 109 yards in a state championship game.","Recruited to three different positions before settling into his current role.","His high school team went winless his freshman year; state champions his senior year.","Graduated with a degree in aerospace engineering.","Holds a black belt in Brazilian jiu-jitsu.","His older brother plays professionally for a different team.","Ran a 4.28 forty but pulled a hamstring at the combine.","Listed as the 300th-ranked recruit; outperformed every player ranked above him.","Turned down a full wrestling scholarship to play football.","Earned All-Conference honors at two different schools.","Has never missed a practice or game due to illness.","Memorizes the entire team playbook in the first week of training camp.","Led his college team in tackles despite weighing under 200 lbs.","Was told by three scouts he was too small for his position.","Grew up without running water for two years; uses it as daily motivation.","Plays piano and credits it for his hand-eye coordination."];
// INNO I71: achievement definitions
export const ACH_DEFS=[
  {id:'first_win',label:'First Win',desc:'Win your first game',icon:'🏈'},
  {id:'first_champ',label:'Champion',desc:'Win the championship',icon:'🏆'},
  {id:'win_streak_5',label:'On Fire',desc:'Win 5 in a row',icon:'🔥'},
  {id:'shutout_def',label:'Lockdown',desc:'Hold opponent to 0 points in Play',icon:'🛡'},
  {id:'comeback_win',label:'Never Say Die',desc:'Win after trailing by 14+',icon:'💪'},
  {id:'perfect_draft',label:'War Room',desc:'Draft 3 players with A+ combine grades',icon:'📋'},
  {id:'dynasty_3',label:'Dynasty',desc:'Win 3+ consecutive championships',icon:'👑'},
  {id:'trade_master',label:'Trade Master',desc:'Complete 10 trades',icon:'🤝'},
  {id:'big_spender',label:'Cap Wizard',desc:'Sign a player for $20M+',icon:'💰'},
  {id:'scout_gem',label:'Diamond Scout',desc:'Develop a gem prospect to OVR 85+',icon:'💎'},
];
// v21: AI GM data
export const AI_GM_NAMES=["Harlan Briggs","Dez Monroe","Victor Choi","Pete Salazar","Roy Engel","Chance Webb","Marcus Holt","Daria Steele","Jim Kowalski","Tasha Burrows","Owen Payne","Ed Strickland","Lamar Voss","Sam Dubois","Nina Carver","Ted Rusk","Beau Hollins","Carmen Dix","Walt Greer","Rex Fontaine","Ida Nwosu","Kirk Patton","Sasha Tate","Lloyd Ashby","Ana Duval","Hank Pryor","Cleo Marsh","Bart Osei","Vince Lutz","Faye Cannon","Myron York","Gene Tran"];
export const AI_GM_VOICE={rebuilder:{opener:"Look, we're in a rebuild.",style:"honest"},['win-now']:{opener:"We're going for it this year.",style:"aggressive"},analytics:{opener:"The metrics strongly favor this swap.",style:"analytical"}};
export const PLAYS_POOL=[{id:'hb_dive',name:'HB Dive',type:'run',desc:'Inside run, reliable short yardage'},{id:'power_o',name:'Power O',type:'run',desc:'Off-tackle power run, big blocker lead'},{id:'draw',name:'Draw Play',type:'run',desc:'Delayed handoff; punishes blitz'},{id:'slant',name:'Slant Route',type:'pass',desc:'Quick crossing route, high % throw'},{id:'curl',name:'Curl Flat',type:'pass',desc:'Short curl combo, beats zone'},{id:'post',name:'Post Route',type:'pass',desc:'Deep dig over the middle'},{id:'four_verts',name:'4 Verticals',type:'pass',desc:'Stress coverage deep, burn safeties'},{id:'rpo',name:'RPO',type:'hybrid',desc:'Read pass-option; QB decides run/pass'},{id:'pa_boot',name:'PA Bootleg',type:'pass',desc:'Play-action roll-out, catches D off-guard'},{id:'screen',name:'Screen Pass',type:'pass',desc:'Short dump-off behind blockers'},{id:'end_around',name:'End Around',type:'run',desc:'WR jet sweep, edge attack'},{id:'hail_mary',name:'Hail Mary',type:'pass',desc:'Desperation deep ball'}];
// v20: Player Backstory arrays
export const BSTORY_CITY=["Miami","Atlanta","Dallas","Detroit","Seattle","New Orleans","Baltimore","Cleveland","Denver","Phoenix","Chicago","Portland","Houston","Pittsburgh","Memphis","Tulsa"];
export const BSTORY_ARC=["walked on after being overlooked by every major program","overcame a torn ACL in his junior year","transferred twice before finding his home","turned down a baseball scholarship to play football","grew up idolizing players who made it out of his hometown","played multiple positions before settling into his role","starred in two sports before committing to football","was the first in his family to earn a scholarship","bounced back from a broken collarbone that cost him a season","went undrafted once before reinventing himself"];
export const BSTORY_TRAIT=["Known for elite film preparation.","Coaches rave about his football IQ.","Arrives first, leaves last every day.","Plays with a chip on his shoulder.","Natural leader respected by all teammates.","Relentless work ethic praised throughout the process.","Shows elite composure in pressure situations.","His motor never stops running."];
export const LKR_EVENTS=[
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
export const PICK_VAL=[0,
4000,3919,3839,3758,3677,3597,3516,3435,3355,3274,3194,3113,3032,2952,2871,2790,2710,2629,2548,2468,2387,2306,2226,2145,2065,1984,1903,1823,1742,1661,1581,1500,
1400,1377,1355,1332,1310,1287,1265,1242,1219,1197,1174,1152,1129,1106,1084,1061,1039,1016,993,971,948,926,903,880,858,835,813,790,767,745,722,700,
650,642,634,626,618,610,602,594,585,577,569,561,553,545,537,529,521,512,504,496,488,480,472,464,456,448,439,431,423,415,407,400,
380,375,370,365,360,355,350,345,340,336,331,326,321,316,311,306,301,296,292,287,282,277,272,267,262,257,252,247,243,238,233,230,
220,217,215,212,210,207,205,202,200,197,195,192,189,187,184,182,179,177,174,172,169,167,164,162,159,156,154,151,149,146,144,141,
130,129,127,126,125,124,122,121,120,118,117,116,115,113,112,111,109,108,107,105,104,103,102,100,99,98,96,95,94,92,91,90,
85,84,83,82,81,81,80,79,78,77,76,76,75,74,73,72,71,71,70,69,68,67,66,66,65,64,63,62,61,61,60,60];
export const pkV=pk=>chartPickValue(PICK_VAL,pk);

// ═══════════ SVG FACE ═══════════
export function genFace(){return{sk:pick(["#8d5524","#c68642","#e0ac69","#f1c27d","#ffdbac","#5c3317","#a0522d","#deb887","#3b2219","#d2a679"]),hr:pick(["#1a1a1a","#3b2f2f","#654321","#8b4513","#2c1608","#000","#4a3728","#2f1b14","#1c1008","#5c4033"]),hs:R(0,5),ew:R(3,5),eh:R(2,4),nw:R(4,7),mw:R(6,10),jw:R(18,24),bh:R(1,3),er:R(2,4),fh:R(28,34)};}

// ═══════════ CORE FUNCTIONS ═══════════
export function qbRate(c,a,y,t,i){if(!a)return 0;const aa=cl(((c/a)-.3)*5,0,2.375),b=cl(((y/a)-3)*.25,0,2.375),cc=cl((t/a)*20,0,2.375),d=cl(2.375-((i/a)*25),0,2.375);return Math.round(((aa+b+cc+d)/6)*100*10)/10;}
export function calcAV(p){const s=p.ss||{};if(!s.gp)return 0;let v=0;if(p.pos==="QB")v=(s.passYds||0)/350+(s.passTD||0)*1.5-(s.passInt||0)+(s.rushYds||0)/150;else if(p.pos==="RB")v=(s.rushYds||0)/200+(s.rushTD||0)*2+(s.recYds||0)/200;else if(p.pos==="WR")v=(s.recYds||0)/200+(s.recTD||0)*2+(s.rec||0)*.2;else if(p.pos==="TE")v=(s.recYds||0)/200+(s.recTD||0)*2;else if(p.pos==="DL")v=(s.sacks||0)*2+(s.tkl||0)*.1+(s.tfl||0)*.5;else if(p.pos==="LB")v=(s.tkl||0)*.15+(s.sacks||0)*1.5+(s.ints||0)*2;else if(p.pos==="CB")v=(s.ints||0)*3+(s.pd||0)*.8;else if(p.pos==="S")v=(s.ints||0)*2.5+(s.tkl||0)*.12;else if(p.pos==="K")v=(s.fgM||0)+(s.xpM||0)*.2;else v=p.ovr*.05*(s.gp||0);return Math.round(cl(v,0,25));}
export function genCombine(pos,ovr){const a=CA[pos];if(!a)return null;const oM=(ovr-60)/100;return{fortyYd:Math.round((a.f-oM*.3+Rf(-.15,.15))*100)/100,bench:Math.max(0,Math.round(a.b+oM*8+R(-4,4))),vert:Math.max(15,Math.round(a.v+oM*6+R(-3,3))),broad:Math.max(80,Math.round(a.br+oM*10+R(-5,5))),threeCone:Math.round((a.t-oM*.25+Rf(-.15,.15))*100)/100,shuttle:Math.round((a.s-oM*.15+Rf(-.1,.1))*100)/100};}
export function genProDay(pos,ovr){const c=genCombine(pos,ovr);if(!c)return null;return{fortyYd:Math.round((c.fortyYd+Rf(-.05,.05))*100)/100,bench:Math.max(0,c.bench+R(-2,3)),vert:Math.max(15,c.vert+R(-2,2)),broad:Math.max(80,c.broad+R(-3,4)),threeCone:Math.round((c.threeCone+Rf(-.08,.08))*100)/100,shuttle:Math.round((c.shuttle+Rf(-.05,.05))*100)/100};}
export function combToPhys(c){if(!c)return{spd:60,str:60,agi:60,end:60,acc:60,jmp:60};return{spd:cl(Math.round(80-(c.fortyYd-4.4)*30),30,99),str:cl(Math.round(40+c.bench*2.2),30,99),agi:cl(Math.round(80-(c.threeCone-6.8)*25),30,99),jmp:cl(Math.round(20+c.vert*1.8),30,99),acc:cl(Math.round(80-(c.shuttle-4.1)*30),30,99),end:cl(Gc(70,8,40,99),40,99)};}
export function genPAttrs(pos,ovr){const at={};(PA[pos]||[]).forEach(a=>{at[a]=cl(Gc(ovr,8,30,99),30,99);});return at;}
export const SCREENS=new Set(['dashboard','roster','depth','schedule','standings','stats','scouting','draft','trade','freeagency','coaching','playoffs','hub','trophies','records','history','draftrecap','contracts','log','gameinfo','deadline','livesim','god','dev']);
// Game clock as m:ss.
export const gameClock=s=>{const t=Math.max(0,Math.round(s||0));return`${Math.floor(t/60)}:${String(t%60).padStart(2,'0')}`;};
export function emptySS(pos){const b={gp:0,gs:0};if(pos==="QB")return{...b,comp:0,att:0,passYds:0,passTD:0,passInt:0,sk:0,skYds:0,rushAtt:0,rushYds:0,rushTD:0,fum:0,rate:0};if(pos==="RB")return{...b,rushAtt:0,rushYds:0,rushTD:0,rec:0,tgt:0,recYds:0,recTD:0,fum:0};if(pos==="WR")return{...b,tgt:0,rec:0,recYds:0,recTD:0,rushAtt:0,rushYds:0};if(pos==="TE")return{...b,tgt:0,rec:0,recYds:0,recTD:0};if(pos==="DL")return{...b,tkl:0,ast:0,sacks:0,tfl:0,ff:0,qbH:0,pd:0};if(pos==="LB")return{...b,tkl:0,ast:0,sacks:0,tfl:0,ints:0,ff:0,pd:0};if(pos==="CB")return{...b,tkl:0,ast:0,ints:0,pd:0,ff:0};if(pos==="S")return{...b,tkl:0,ast:0,ints:0,pd:0,sacks:0,ff:0};if(pos==="K")return{...b,fgM:0,fgA:0,xpM:0,xpA:0,pts:0,lng:0};if(pos==="P")return{...b,punts:0,puntYds:0,in20:0};return{...b};}

// College stats generation based on years played
export function genColStats(pos,yrs,ovr){
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
export function prospectAge(){const r=Math.random();if(r<.25)return 20;if(r<.55)return 21;if(r<.80)return 22;if(r<.94)return 23;return 24;}

// What a player is worth in a trade. Elite players carry a steep premium, more so with an
// X-Factor or a Superstar/Generational development trait, so nobody gives them away cheaply.
export function tradeValue(p){return playerValue(p,devOf(p));}
// Saves from before the trade-value change get today's prices.
// Each real player's rookie season, from the Madden data (years pro 0 = a 2026 rookie).
export const REAL_ROOKIE_YRS=Object.fromEntries([...(M27.teams||[]).flatMap(t=>[...(t.roster||[]),...(t.ps||[])]),...(M27.fa||[])].filter(d=>d.yp!=null).map(d=>[`${d.name}|${d.pos}`,(M27.season||2026)-d.yp]));
// Each real player's overall draft pick (for fifth-year options), for saves made before it was stored.
export const REAL_PKS=Object.fromEntries([...(M27.teams||[]).flatMap(t=>[...(t.roster||[]),...(t.ps||[])]),...(M27.fa||[])].filter(d=>d.pk).map(d=>[`${d.name}|${d.pos}`,d.pk]));
// Each real player's rating when the league began (for his pre-league legacy).
export const REAL_OVR0=Object.fromEntries([...(M27.teams||[]).flatMap(t=>[...(t.roster||[]),...(t.ps||[])]),...(M27.fa||[])].map(d=>[`${d.name}|${d.pos}`,d.ovr]));
export const withRealPicks=ts=>ts.map(t=>({...t,roster:(t.roster||[]).map(p=>p.pk||p.draftPk>0||!REAL_PKS[`${p.name}|${p.pos}`]?p:{...p,pk:REAL_PKS[`${p.name}|${p.pos}`]})}));
// A wire line for an AI-to-AI trade.
export const tradeWireText=(x,ts,yr)=>{const b=ts[x.buyer],sl=ts[x.seller];const got=[...x.players.map(p=>`${p.name} (${p.pos} ${p.ovr})`),...x.picks.map(pk=>pk.yr&&pk.yr!==yr?`${pk.yr} R${pk.rd}`:`R${pk.rd}${pk.overall?` #${pk.overall}`:""}`)].join(" + ");return`📡 TRADE: ${b.city} ${b.name} acquire ${x.player.name} (${x.player.pos} ${x.player.ovr}, age ${x.player.age}) from ${sl.city} ${sl.name} for ${got}`;};
// Saves from before the line had spots: your hand-set DL order becomes edges outside, tackles inside.
export const dlSlotsMigrate=d=>{const o=d.depthOrder||{};if(d.dlSlots||!o.DL?.length)return o;const ros=(d.teams?.[d.ui]?.roster||[]).filter(p=>p.pos==="DL");const ps=o.DL.map(id=>ros.find(p=>p.id===id)).filter(Boolean);return{...o,DL:arrangeDL(ps).map(p=>p.id)};};
export const withTradeValues=ts=>(ts||[]).map(t=>({...t,pf:Math.round(t.pf||0),pa:Math.round(t.pa||0),roster:(t.roster||[]).map(p=>({...p,tradeVal:tradeValue(p)}))}));
// Football scores are whole numbers; saves from before the drive-based sim could hold fractions.
export const wholeScores=s=>(s||[]).map(g=>g.played?{...g,hs:Math.round(g.hs||0),as:Math.round(g.as||0)}:g);
export function genPlayer(pos,age,ovrO,isDraft){
  const pp=PP[pos];const h_=Gc(pp.h,pp.hs,pp.hR[0],pp.hR[1]);const w_=Gc(pp.w,pp.ws,pp.wR[0],pp.wR[1]);
  const ovr=ovrO||cl(Gc(62,12,35,95),30,99);const pot=cl(ovr+R(0,20),ovr,99);age=age||R(22,32);
  const comb=isDraft?null:genCombine(pos,ovr);const phys=comb?combToPhys(comb):{spd:Gc(65,10,35,95),str:Gc(65,10,35,95),agi:Gc(65,10,35,95),end:Gc(65,10,35,95),acc:Gc(65,10,35,95),jmp:Gc(65,10,35,95)};
  const bio={strengths:[],weaknesses:[],fact:pick(FACTS),college:pick(COL)};
  const sP=[...(STRS[pos]||[])];for(let i=0;i<3&&sP.length;i++){const x=R(0,sP.length-1);bio.strengths.push(sP.splice(x,1)[0]);}
  const wP=[...(WKNS[pos]||[])];for(let i=0;i<2&&wP.length;i++){const x=R(0,wP.length-1);bio.weaknesses.push(wP.splice(x,1)[0]);}
  const colYrs=isDraft?cl(age-18,1,4):R(1,4);
  return{id:uid(),name:`${pick(FN)} ${pick(LN)}`,pos,age,ovr,pot,ht_:h_,wt:w_,...phys,posAttrs:genPAttrs(pos,ovr),
    salary:isDraft?0:Math.round((ovr/99)*Rf(1,9)*100)/100,contract:isDraft?0:R(1,4),
    injured:false,injWk:0,injType:"",injCount:0,fragile:false,offsznExt:false,bio,combine:comb,proDay:isDraft?null:null,face:genFace(),
    draftYr:0,draftPk:0,ss:emptySS(pos),cs:{},gl:[],av:0,
    tradeVal:playerValue({pos,age,ovr,pot}),
    scoutLvl:isDraft?0:2,trueOvr:ovr,truePot:pot,
    scoutedOvr:cl(ovr+R(-15,15),30,99),scoutedPot:cl(pot+R(-12,12),pot-5,99),
    colStats:genColStats(pos,colYrs,ovr),colYrs,draftYear:0,devG:0,
    conf:cl(Gc(60,10,40,90),40,90),
    fit:(()=>{let f=R(40,85);if(pos==='QB'&&ovr>=75)f=cl(f+R(5,15),0,100);return f;})(),
    personality:pick(['Leader','Loner','Hothead','Grinder']),
    agent:pick(['Aggressive','Moderate','Passive']),
    traits:Array.from({length:R(1,2)},()=>pick(TRAITS_POOL)).filter((v,i,a)=>a.indexOf(v)===i),
    want:pick(['starter','starter','star','ring','money','money']),
    bonus:isDraft?null:(Math.random()<0.3?{type:pick(['performance','roster','pro_bowl']),amount:+(Rf(0.3,2.0)).toFixed(1),threshold:pick(incentiveOptions(pos))}:null),
    endorsed:!isDraft&&ovr>=82&&Math.random()<0.3,
    snaps:0,loyal:false,role:'rotation'};
}


// AI clubs' trade calls live in tradeOffers.js.


// Draft classes made before rookies came in closer to league ready (old saves pre-build three):
// raise each unscouted prospect's current rating to the new shape, never lowering anyone. Skips
// the class being drafted right now. Returns a new dc object.
export function reshapeDC(dc,yr,sp,draftIdx){const out={};for(const[k,cls]of Object.entries(dc||{})){if(!Array.isArray(cls)||cls.some(p=>p.ovrV)||(+k===yr&&sp==="draft"&&draftIdx>0)){out[k]=cls;continue;}
  out[k]=cls.map(p=>{if(p.scout?.lvl>0)return{...p,ovrV:2};const pt=p.truePot-gemGap(p);const room=Math.round(({20:15,21:13,22:11,23:9,24:7}[p.age]||11)*cl(0.33+(pt-64)*0.027,0.3,1.35)*Rf(0.6,1.4));const now=Math.max(p.trueOvr||p.ovr||55,cl(pt-room,55,pt));return{...p,ovr:now,trueOvr:now,ovrV:2};});}return out;}
// One generated prospect (potCap/ovrCap keep the filler of a real class below its real names).
function genProspect(yr,pos,adj,potCap=99,ovrCap=99){const age=prospectAge();const raw=cl(Gc(55,14,32,92),adj.fl,Math.min(adj.cap,potCap));const pt=cl(raw+R(0,20),raw,potCap);
  const room=Math.round(({20:15,21:13,22:11,23:9,24:7}[age]||11)*cl(0.33+(pt-64)*0.027,0.3,1.35)*Rf(0.6,1.4));const now=Math.min(cl(pt-room,55,pt),ovrCap);
  const p=genPlayer(pos,age,now,true);p.pot=p.truePot=pt;p.scoutedPot=cl(pt+R(-12,12),pt-5,99);p.tradeVal=playerValue({pos,age,ovr:now,pot:pt});p.ovrV=2;p.bio.college=draftCollege();p.draftYear=yr;p.bio.backstory=`From ${pick(BSTORY_CITY)}, ${p.name.split(' ')[0]} ${pick(BSTORY_ARC)}. ${pick(BSTORY_TRAIT)}`;return p;}
const DC_POS_W={QB:4,RB:6,WR:9,TE:4,LT:2,LG:2,C:1,RG:2,RT:2,DL:8,LB:7,CB:6,S:5,K:1,P:1};
export function genDC(yr,dcr){
  const dc=[];const posW=[];const w=DC_POS_W;
  for(const[p,n]of Object.entries(w))for(let i=0;i<n;i++)posW.push(p);
  const dcrAdj={Weak:{fl:58,cap:82,off:0},Average:{fl:60,cap:86,off:0},Strong:{fl:62,cap:89,off:0},Elite:{fl:64,cap:92,off:0}}[dcr||'Average']||{fl:60,cap:86,off:0};
  // Generate 7 rounds * 32 picks = 224 prospects (with extras)
  // Each prospect's ceiling comes first (the same spread of ceilings as ever), then how far below
  // it he is today: younger and higher-ceiling prospects are rawer, and some are more polished
  // than others. Top picks come in around 75-80, second and third rounders around 68-72 (ready
  // for real snaps, like NFL rookies), and late-rounders are low-ceiling depth.
  for(let i=0;i<240;i++)dc.push(genProspect(yr,pick(posW),dcrAdj));
  // An Elite class has a can't-miss prospect: its highest ceiling, ready from day one.
  if(dcr==='Elite'){const top=[...dc].filter(p=>p.pos!=='K'&&p.pos!=='P').sort((a,b)=>b.truePot-a.truePot)[0];if(top&&top.trueOvr<90){top.ovr=top.trueOvr=90;top.pot=top.truePot=Math.max(top.truePot,94);top.posAttrs=genPAttrs(top.pos,90);top.tradeVal=playerValue({pos:top.pos,age:top.age,ovr:90,pot:top.truePot});}}
  return plantBusts(plantGems(rankClass(dc),yr),yr);
}
// Real draft classes (src/data/realProspects.json, keyed by the season whose off-season holds the
// draft: 2026 is the April 2027 NFL Draft). Each real prospect has the board's view of him (his
// rank, OVR and ceiling) and, for some, Claude's call: "boom" (much better than his slot; a
// hidden gem the board doesn't see) or "bust" (a red flag: his real ceiling is lower). The rest
// of the 240 are generated depth below the real names.
export const REAL_DC_YEARS=Object.keys(REAL_DC).map(Number).filter(y=>REAL_DC[y]?.length);
const BUST_KIND=w=>/charact|work ethic|maturity|off-field|arrest|attitude|motor/i.test(w)?"character":/injur|medical|knee|acl|shoulder|surgery|durab|health/i.test(w)?"medical":/one[- ]year|one season|small sample|breakout/i.test(w)?"oneyear":/system|scheme|supporting cast|surrounded/i.test(w)?"system":/athlet|workout|tools|raw|tape/i.test(w)?"workout":"character";
export function genRealDC(yr){
  const list=REAL_DC[yr];if(!list?.length)return genDC(yr);
  const dc=[];let minScore=Infinity,minPot=99,minOvr=99,prev=Infinity;
  for(const d of [...list].sort((a,b)=>a.rank-b.rank)){
    const p=genPlayer(d.pos,d.age,d.ovr,true);
    Object.assign(p,{name:d.name,ht_:d.ht||p.ht_,wt:d.wt||p.wt,pot:d.pot,truePot:d.pot,trueOvr:d.ovr,ovr:d.ovr,ovrV:2,draftYear:yr,real:1});
    if(d.mpos)p.mpos=d.mpos;
    p.scoutedPot=cl(d.pot+R(-12,12),d.pot-5,99);p.bio.college=d.college;p.bio.backstory=d.note||"";
    // The consensus board follows the real boards' order.
    const kp=d.pos==="K"||d.pos==="P";const sc=kp?kpValue(d,d.pot*0.78+d.ovr*0.22):Math.min(d.pot*0.78+d.ovr*0.22,prev-0.05);if(!kp)prev=sc;p.cons={score:sc,kp:1};
    if(d.dev)p.dev=d.dev;
    if(d.boom&&d.truePot>d.pot){p.gem={gap:d.truePot-d.pot,why:d.boom};p.pot=p.truePot=d.truePot;p.dev||=d.truePot>=90?"superstar":"star";}
    else if(d.bust&&d.truePot<d.pot){p.bust={gap:d.pot-d.truePot,why:d.bust,kind:d.kind||BUST_KIND(d.bust)};p.pot=p.truePot=d.truePot;if(p.trueOvr>=d.truePot)p.ovr=p.trueOvr=Math.max(50,d.truePot-2);p.dev||="normal";}
    p.posAttrs=genPAttrs(p.pos,p.trueOvr);p.tradeVal=playerValue({pos:p.pos,age:p.age,ovr:p.trueOvr,pot:p.truePot});
    if(!kp){minScore=Math.min(minScore,sc);minPot=Math.min(minPot,d.pot);minOvr=Math.min(minOvr,d.ovr);}dc.push(p);
  }
  const posW=[];for(const[p,n]of Object.entries(DC_POS_W))for(let i=0;i<n;i++)posW.push(p);
  const adj={fl:58,cap:86};
  const taken=new Set(dc.map(p=>p.name));
  while(dc.length<240){const p=genProspect(yr,pick(posW),adj,minPot,minOvr);while(taken.has(p.name))p.name=`${pick(FN)} ${pick(LN)}`;taken.add(p.name);const sc=kpValue(p,p.truePot*0.78+p.trueOvr*0.22)+Gc(0,2,-6,6);p.cons={score:Math.min(sc,minScore-0.1-Math.random()),kp:1};dc.push(p);}
  for(const p of dc){p.gemChk=1;p.bustChk=1;}
  return rankClass(dc);
}


// AI positional need
export function getTeamNeed(roster){
  const ideal={QB:2,RB:3,WR:5,TE:2,LT:2,LG:2,C:1,RG:2,RT:2,DL:5,LB:4,CB:4,S:3,K:1,P:1};
  const ct={};POS.forEach(p=>ct[p]=roster.filter(x=>x.pos===p).length);
  const needs=[];POS.forEach(p=>{const diff=ideal[p]-(ct[p]||0);if(diff>0)for(let i=0;i<diff;i++)needs.push(p);});
  if(!needs.length)POS.forEach(p=>needs.push(p)); // fallback
  return needs;
}
// AI teams blend their own scouts' read with the consensus board and lean toward needs
export function aiBestPick(roster,available,gmStyle){
  const needs=new Set(getTeamNeed(roster));const needM=gmStyle==='rebuilder'?1.025:1.04;
  let best=null,bs=-Infinity;for(const p of available){const sc=aiDraftScore(p,gmStyle)*(needs.has(p.pos)?needM:1);if(sc>bs){bs=sc;best=p;}}
  return best||available[0];
}
export const scGrade=ovr=>ovr>=90?"A+":ovr>=85?"A":ovr>=78?"B":ovr>=72?"C":ovr>=65?"D":"F";
// FEATURE 1: Player Traits
export const TRAITS_POOL=['Clutch','Injury Prone','Leader','Ironman','Late Bloomer','Scheme Fit','Momentum Player','Film Rat','High Floor','High Ceiling'];
export const MEDIA_HEADLINES=['{player} on pace for a record-breaking season','{team} offensive line drawing league-wide attention','{player} reportedly drawing trade interest from multiple teams','{team} defense ranked bottom-5 in yards allowed','Coach puts {team} on notice after back-to-back losses','{player} limited in practice — listed as questionable','{team} fan base growing restless after slow start','{opp} coordinator calls out {team} secondary','{player} extension talks stalling amid cap concerns','{team} special teams among worst in the league','League office reviewing {team} for potential violations','{player} named to Pro Bowl watch list'];
// FEATURE 5: SOS helper
export function calcSOS(teamId,sched,teams){const played=sched.filter(g=>g.played&&(g.h===teamId||g.a===teamId));if(!played.length)return 50;const oppIds=played.map(g=>g.h===teamId?g.a:g.h);const avgWp=oppIds.reduce((s,id)=>{const t=teams[id];const gp=(t?.w||0)+(t?.l||0)+(t?.t||0);return s+(gp>0?(t?.w||0)/gp:0.5);},0)/oppIds.length;return Math.round(avgWp*100);}


// A Madden 27 player as a full game player: real name, size, ratings and position skills.
export function realPlayer(d){const p=genPlayer(d.pos,d.age,d.ovr);const devLift=d.age<=26?({generational:8,superstar:5,star:2}[d.dev]||0):0;const pot=cl((d.age<=22?d.ovr+R(5,12):d.age<=25?d.ovr+R(1,6):d.ovr)+devLift,d.ovr,99);
  Object.assign(p,{name:d.name,mpos:d.mpos,ht_:d.ht,wt:d.wt,spd:d.spd,str:d.str,agi:d.agi,acc:d.acc,jmp:d.jmp,end:d.end,posAttrs:d.attrs,salary:+((d.sal||0)*DATA_TO_DOLLARS).toFixed(1),contract:d.yrs,pot,truePot:pot,scoutedOvr:d.ovr,scoutedPot:pot,num:d.num,arch:d.arch,src:'m27',
    bio:{...p.bio,college:d.college||p.bio.college}});if(d.dev)p.dev=d.dev;if(d.xf)p.xf=d.xf;if(d.dk!=null)p.dk=d.dk;if(d.yp!=null){p.draftYr=(M27.season||2026)-d.yp;p.rkYr=p.draftYr;}if(d.pk)p.pk=d.pk;p.tradeVal=tradeValue(p);return p;}
// Real players without a club (cut from the 53 and the practice squad) are the free agents.
export function realFA(d){const p=realPlayer(d);p.contract=0;return p;}
// Punters (the roster file has none): each club's real punter joins its 53, and the club's
// lowest-rated backup (never a QB or kicker) starts the game as a free agent to make room.
const PUNTERS=SPECIAL.punters||[];
const PUNTER={};for(const p of PUNTERS)if(p.team&&!PUNTER[p.team])PUNTER[p.team]=p;
const CUT=TEAMS.map((t,i)=>PUNTER[t.ab]?[...M27.teams[i].roster].filter(d=>!["QB","K"].includes(d.pos)&&d.dk!==0).sort((a,b)=>a.ovr-b.ovr)[0]:null);
export const initialFA=()=>[...(M27.fa||[]),...CUT.filter(Boolean),...PUNTERS.filter(p=>PUNTER[p.team]!==p)].map(realFA);
// Saves from before punters: give every club its punter (aged to the save's season). Yours joins
// if you have room on the 53; otherwise he waits for you in free agency. Mutates the save; returns its teams.
export function addPunters(d){
  if(!d?.teams||d.teams.some(t=>(t.roster||[]).some(p=>p.pos==="P")))return d?.teams;
  const yrs=Math.max(0,(d.yr||2026)-2026),aged=x=>{const p=realPlayer({...x,age:x.age+yrs});return p;};
  d.fa=d.fa||[];
  d.teams.forEach((t,i)=>{const x=PUNTER[t.ab];if(!x||x.age+yrs>40)return;const p=aged(x);
    if(i===d.ui&&t.roster.length>=53){d.fa.unshift({...p,contract:0,formerTeam:i});return;}
    t.roster.push(p);
    if(i!==d.ui&&t.roster.length>53){const cut=[...t.roster].filter(q=>!["QB","K","P"].includes(q.pos)).sort((a,b)=>a.ovr-b.ovr)[0];if(cut){t.roster=t.roster.filter(q=>q!==cut);d.fa.push({...cut,contract:0});}}});
  for(const x of PUNTERS)if(PUNTER[x.team]!==x&&x.age+yrs<=40)d.fa.push({...aged(x),contract:0});
  return d.teams;
}
export function initTeams(ui){return TEAMS.map((t,i)=>({...t,id:i,isUser:i===ui,roster:[...M27.teams[i].roster.filter(d=>d!==CUT[i]),...(PUNTER[t.ab]?[PUNTER[t.ab]]:[])].map(realPlayer),ps:M27.teams[i].ps.map(realPlayer),ir:[],w:0,l:0,t:0,pf:0,pa:0,morale:50,streak:0,gmRep:50,chemistry:75,strat:pick(["balanced","pass-heavy","run-heavy","defensive"]),gmStyle:i===ui?'user':pick(['rebuilder','win-now','analytics']),coach:{oc:genCoach("OC"),dc:genCoach("DC"),st:genCoach("ST")}}));}
// Assign bye weeks 5-14 to each team (paired so week always has even active teams)
// 18-week schedule: each team plays 17 games (1 bye in weeks 5-14)
// The NFL schedule formula (src/schedule.js). prev: last season's teams, for division finishes.
// The league's first season uses the NFL's real 2026 schedule (matchups, dates, stadiums,
// international games); later seasons are built with the NFL's scheduling formula.
export function realSchedule(year){if(REAL_SCHED.season!==year)return null;const id=Object.fromEntries(TEAMS.map((t,i)=>[t.ab,i]));const out=[];for(const g of REAL_SCHED.games){const h=id[g.h],a=id[g.a];if(h==null||a==null)return null;out.push({wk:g.wk,h,a,played:false,hs:0,as:0,boxH:null,boxA:null,date:g.date,venue:g.venue,city:g.city,neutral:g.neutral,intl:g.neutral&&g.country&&g.country!=="USA"});}out.byes={};TEAMS.forEach((_,i)=>{for(let w=1;w<=18;w++)if(!out.some(g=>g.wk===w&&(g.h===i||g.a===i))){out.byes[i]=w;break;}});return out;}
export function genSched(teams,byes,year,prev){const _real=!prev&&realSchedule(year);if(_real)return _real;const meta=teams.map((_,i)=>({id:i,c:TEAMS[i].c,d:TEAMS[i].d}));
  const src=(prev||teams).map((t,i)=>({...t,...meta[i]}));const strength=t=>{const r=[...(t.roster||[])].sort((a,b)=>b.ovr-a.ovr).slice(0,22);return r.reduce((s,p)=>s+p.ovr,0)/Math.max(1,r.length);};
  const{games,byes:b}=nflSchedule(meta,year,divisionPlaces(prev?src:src.map(t=>({...t,w:0,l:0,t:0})),strength),byes);
  const out=games.map(g=>({wk:g.wk,h:g.h,a:g.a,played:false,hs:0,as:0,boxH:null,boxA:null}));out.byes=b;return out;}

// ═══════════ PER-GAME STAT SIM — calibrated to NFL averages ═══════════
// NFL targets (per game, starter): QB 255 yds 1.6 TD 0.6 INT; RB 72 rush+24 rec; WR 85 rec yds; TE 56 rec yds
// DL 4.5 tkl 0.15 sack; LB 9 tkl; CB 5 tkl; S 7 tkl; K 1.8 FGA
export function simPG(p,share=100){const o=p.ovr,sp=p.spd,st=p.str;const sM=(sp-65)*.004,stM=(st-65)*.003;const clutchB=p.traits?.includes('Clutch')?1.08:1;const cyB=p.contract===1?1.06:1;const snapPct=share/100;const s={};if(share<=0)return s;
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
    const att=Math.max(1,Math.round(G(24,5)+(o-60)*.12));
    const ypc=cl(G(4.35,.75)+(o-60)*.016+sM*3,2.2,8);
    const td=Math.random()<.042+(o-60)*.003+stM?1:0;
    const tgt=Math.max(0,Math.round(G(5,2)));
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
  if(clutchB!==1){for(const k of Object.keys(s)){if(typeof s[k]==='number'&&!['gp','gs'].includes(k))s[k]=Math.round(s[k]*clutchB);}}
  // v34: contract year boost
  if(cyB!==1){for(const k of Object.keys(s)){if(typeof s[k]==='number'&&!['gp','gs'].includes(k))s[k]=Math.round(s[k]*cyB);}}
  // v38: scale counting stats by snap share (rate stats unchanged)
  if(snapPct<1){const rateKeys=['rate','fgPct','xpPct'];for(const k of Object.keys(s)){if(typeof s[k]==='number'&&!['gp','gs',...rateKeys].includes(k))s[k]=Math.max(0,Math.round(s[k]*snapPct));}if(p.pos==='QB'&&s.att)s.rate=qbRate(s.comp,s.att,s.passYds,s.passTD,s.passInt);}
  return s;
}
export function addS(t,s){for(const[k,v]of Object.entries(s))if(typeof v==="number")t[k]=(t[k]||0)+v;}
export function teamStr(t){const r=t.roster.filter(p=>!p.injured&&!p.holdout&&!p.suspended);if(!r.length)return 50;const st={QB:1,RB:1,WR:3,TE:1,LT:1,LG:1,C:1,RG:1,RT:1,DL:4,LB:3,CB:2,S:2,K:1,P:1};const dO=t.isUser?USER_DEPTH:{};const a=[];for(const[pos,n]of Object.entries(st))a.push(...depthOrderFor(r,dO,pos,t.isUser?USER_SNAPS:null).slice(0,n));const base=a.length?a.reduce((s,p)=>s+p.ovr,0)/a.length:50;const chemBonus=((t.chemistry||75)-75)*0.2;let depthPenalty=0;for(const[pos,n]of Object.entries(st)){const available=r.filter(p=>p.pos===pos);if(available.length===0)depthPenalty+=1.5;else if(available.length<=n)depthPenalty+=0.5;}const cyBoost=a.reduce((s,p)=>s+(p.contract===1?2:0),0)/Math.max(a.length,1);const avgFit=a.length?a.reduce((s,p)=>s+(p.fit||70),0)/a.length:70;const coreBonus=a.filter(p=>p.role==='core').length*0.5;
  return base+chemBonus-depthPenalty+cyBoost+(avgFit-70)*0.05+(t._fqbBonus||0)+(t._rivBonus||0)+coreBonus+((t._schemeTransWks||0)>0?-3:0);}
export function rollGameWeather(){const r=Math.random();return r<0.70?'clear':r<0.85?'rain':r<0.95?'wind':'snow';}
// Live-game box score in the shape the live screen shows (yards, TDs, tackles...).
export function liveView(box){const out={h:{},a:{}};for(const side of["h","a"])for(const[id,l]of Object.entries(box[side]||{}))out[side][id]={name:l.name,pos:l.pos,passYds:l.passYds||0,rushYds:l.rushYds||0,recYds:l.recYds||0,td:(l.passTD||0)+(l.rushTD||0)+(l.recTD||0),comp:l.comp||0,att:l.att||0,rec:l.rec||0,tkl:l.tkl||0,sack:l.sacks||0,int:l.ints||0,rushAtt:l.rushAtt||0};return out;}
// The shared setup for quick sims and live games: each side's depth chart, snap shares and
// game-day modifiers (coaches, schemes, game plan, morale, weather, matchups, difficulty).
export function gameSetup(ht,at,hPlan,aPlan,wxOverride){
const wx=wxOverride||rollGameWeather();
  const hOC=ht.coach?.oc?(ht.coach.oc.rating-60)*.1:0,hDC=ht.coach?.dc?(ht.coach.dc.rating-60)*.1:0;
  const aOC=at.coach?.oc?(at.coach.oc.rating-60)*.1:0,aDC=at.coach?.dc?(at.coach.dc.rating-60)*.1:0;
  const hFit=getOCFit(ht)+getDCFit(ht),aFit=getOCFit(at)+getDCFit(at);
  const offB={run_heavy:{m:-1.2,s:-2},balanced:{m:0,s:0},pass_heavy:{m:1.5,s:2.5}};
  const defB={conservative:{m:-1.5,s:-2},aggressive:{m:-2.2,s:2.5},prevent:{m:-0.5,s:-3}};
  const hOM=offB[hPlan?.off]||offB.balanced,hDM=defB[hPlan?.def]||{m:0,s:0};
  const aOM=offB[aPlan?.off]||offB.balanced,aDM=defB[aPlan?.def]||{m:0,s:0};
  const hMorB=((ht.morale||50)-50)*0.06,aMorB=((at.morale||50)-50)*0.06;
  const wxM=wx==='snow'?-4:wx==='rain'?-2:wx==='wind'?-1:0;
  // Everything that tilts a game, in points for each offense (the engine turns it into play-by-play odds).
  const _pmAvg=arr=>arr.length?arr.reduce((s,p)=>s+p.ovr,0)/arr.length:70;
  const _grp=(t,ps)=>t.roster.filter(p=>ps.includes(p.pos)&&!p.injured);
  const _hRush=_pmAvg(_grp(ht,['DL','LB']))-_pmAvg(_grp(at,['LT','LG','C','RG','RT'])),_aRush=_pmAvg(_grp(at,['DL','LB']))-_pmAvg(_grp(ht,['LT','LG','C','RG','RT']));
  const _hCov=_pmAvg(_grp(ht,['CB','S']))-_pmAvg(_grp(at,['WR','TE'])),_aCov=_pmAvg(_grp(at,['CB','S']))-_pmAvg(_grp(ht,['WR','TE']));
  const _hClash=SCHEME_CLASH[ht.coach?.oc?.scheme]?.[at.coach?.dc?.scheme]||0,_aClash=SCHEME_CLASH[at.coach?.oc?.scheme]?.[ht.coach?.dc?.scheme]||0;
  const _dda=DDA;
  // A scheme change takes a couple of weeks to install: the team plays a bit worse until it's in.
  const _trans=t=>(t._schemeTransWks||0)>0?-2:0;
  let hMod=_trans(ht)+hOC-aDC+hFit*.5+hOM.m+aDM.m+hMorB+wxM+(_hRush>5?.8:0)+(_aCov>5?-1:_aCov<-5?1:0)+(hPlan?.twoPoint?.15:0)+((hPlan?.playbook?.length||0)>=3?1:0)+_hClash+(ht.isUser?_dda:0);
  let aMod=_trans(at)+aOC-hDC+aFit*.5+aOM.m+hDM.m+aMorB+wxM+(_aRush>5?.8:0)+(_hCov>5?-1:_hCov<-5?1:0)+(aPlan?.twoPoint?.15:0)+((aPlan?.playbook?.length||0)>=3?1:0)+_aClash+(at.isUser?_dda:0);
  // Who plays: AI clubs by their depth chart; yours by your depth chart with snap share overriding it.
  const _ord=t=>{const _healthy=t.roster.filter(p=>!p.injured&&!p.holdout&&!p.suspended);const _dO=t.isUser?USER_DEPTH:{};const _pt=t.isUser?USER_SNAPS:null;const memo={};return pos=>memo[pos]||(memo[pos]=depthOrderFor(_healthy,_dO,pos,_pt));};
  const hOrd=_ord(ht),aOrd=_ord(at);
  const hSnaps=teamSnaps(hOrd,ht.isUser?USER_SNAPS:{}),aSnaps=teamSnaps(aOrd,at.isUser?USER_SNAPS:{});
  // Play-calling tendency: the game plan, plus the coordinator's scheme (Air Raid throws more, Power Run runs more).
  const lean=(t,pl)=>(pl?.off==="pass_heavy"?0.07:pl?.off==="run_heavy"?-0.07:0)+(0.42-schemeRunPct(t))*0.5;
  return{wx,hSnaps,aSnaps,home:makeSide({team:ht,order:hOrd,snaps:hSnaps,mod:hMod,lean:lean(ht,hPlan)}),away:makeSide({team:at,order:aOrd,snaps:aSnaps,mod:aMod,lean:lean(at,aPlan)})};
}
// After the final whistle: season stats, games played/started and injury checks for one team.
// Returns the box score lines (with QB ratings) for the schedule.
// One week of recovery for every club: injWk is the weeks a player still has to miss. A player
// hurt this week (injNew) starts counting next week, so a 6-week injury means six missed games.
// Healed players on injured reserve come back after at least 4 weeks there (yours only if the
// roster has room). Returns log lines for your club.
export function tickInjuries(nt,nw,ui){
  const logs=[];
  nt.forEach((t,ti)=>{
    for(const p of [...t.roster,...(t.ir||[])]){if(!p.injured)continue;if(p.injNew){delete p.injNew;continue;}
      p.injWk=(p.injWk??p.injRecWks??1)-1;if(p.injWk<=0){p.injured=false;p.injWk=0;p.injType="";p.injSev="";p.injRecWks=0;}}
    if((t.ir||[]).length){const ready=t.ir.filter(p=>!p.injured&&nw-(p.irWk??0)>=4);const back=[];
      for(const p of ready){if(ti!==ui||t.roster.length+back.length<53)back.push(p);else if(!p.irReady){p.irReady=true;logs.push(`🏥 ${p.name} is healthy and ready to come off IR. Make room on the 53 to activate him.`);}}
      if(back.length){t.ir=t.ir.filter(p=>!back.includes(p));t.roster.push(...back.map(({irWk,irMin,irType,irReturnWk,irReady,...p})=>p));if(ti===ui)logs.push(...back.map(p=>`🏥 ${p.name} (${p.pos}) is back from injured reserve.`));}}
  });
  return logs;
}
// League setting: when off, nobody gets hurt anywhere (set from the Menu, saved with the franchise).
// Your depth chart, snap shares and the difficulty adjustment, as set on your screens: the sim reads
// them when it lines up your team (AI clubs use their own depth charts).
let USER_DEPTH={},USER_SNAPS={},DDA=0;
export const setUserLineup=(depth,snaps)=>{USER_DEPTH=depth||{};USER_SNAPS=snaps||{};};
export const setDifficultyAdj=v=>{DDA=+v||0;};
let INJ_ON=true;
export const setInjuries=on=>{INJ_ON=!!on;};
export const injuriesEnabled=()=>INJ_ON;
// playoff: postseason stats go to p.pss, so season totals (and the record book) stay regular season only.
export function applyGame(t,snaps,lines,playoff=false){
  const box={};
  t.roster.forEach(p=>{if(p.injured||p.holdout)return;const _sh=snaps[p.id]||0;if(_sh<=0&&!lines[p.id])return;
    const gs={...(lines[p.id]||{})};delete gs.name;delete gs.pos;if(p.pos==="QB"&&gs.att)gs.rate=qbRate(gs.comp||0,gs.att,gs.passYds||0,gs.passTD||0,gs.passInt||0);
    const S=playoff?(p.pss=p.pss||{}):p.ss;S.gp=(S.gp||0)+1;if(!playoff)p.ss.snp=(p.ss.snp||0)+_sh;if(_sh>=50)S.gs=(S.gs||0)+1;
    if(Object.keys(gs).length){addS(S,gs);if(p.pos==="QB"&&S.att>0)S.rate=qbRate(S.comp,S.att,S.passYds||0,S.passTD||0,S.passInt||0);if(!playoff)p.gl.push({...gs,gp:1});box[p.id]={...gs,name:p.name,pos:p.pos};}
    const injMult=(p.fragile?1.5:1)*(p.traits?.includes('Injury Prone')?2.5:p.traits?.includes('Ironman')?0:1);if(INJ_ON&&Math.random()<.025*injMult*Math.max(.15,_sh/100)){p.injured=true;p.injCount=(p.injCount||0)+1;p.fragile=p.injCount>=2;const injCauses=['high-impact collision','awkward landing','non-contact','blocked low','tackled from behind','turf contact','pile-up'];p.injType=`${pick(["Hamstring","Ankle","Knee (MCL)","Shoulder","Concussion","Quad","Calf","Back"])} (${pick(injCauses)})`;const sevRoll=Math.random();if(sevRoll<0.4){p.injSev="minor";p.injRecWks=R(1,2);}else if(sevRoll<0.8){p.injSev="moderate";p.injRecWks=R(3,5);}else{p.injSev="major";p.injRecWks=R(6,8);}p.injWk=p.injRecWks;p.injNew=true;}
  });
  return box;
}
// Weekly upkeep after games are played: scheme installs run down.
export function weeklyTick(teams,weeks=1){for(const t of teams||[])if((t._schemeTransWks||0)>0)t._schemeTransWks=Math.max(0,t._schemeTransWks-weeks);}
// The league's unit-rating averages and spreads, for the game engine to measure teams against.
export function calibrateLeague(teams){
  const us=(teams||[]).filter(t=>t?.roster?.length).map(t=>{const h=t.roster.filter(p=>!p.injured&&!p.holdout&&!p.suspended);const memo={};const order=pos=>memo[pos]||(memo[pos]=pos==="DL"?dlAsPlayed(depthOrderFor(h,{},"DL")):depthOrderFor(h,{},pos));return unitRatings(order);});
  if(us.length<8)return null;
  const base={};for(const k of ["pass","run","passD","runD","rush","ol"]){const xs=us.map(u=>u[k]).filter(Number.isFinite);const m=xs.reduce((a,b)=>a+b,0)/xs.length;base[k]=[m,Math.sqrt(xs.reduce((a,b)=>a+(b-m)**2,0)/xs.length)];}
  setLeague(base);return base;
}
// Sim a game start to finish on the play-by-play engine. dry: a preview that changes nothing.
export function simGame(ht,at,hPlan,aPlan,wxOverride,opts={}){
  const su=gameSetup(ht,at,hPlan,aPlan,wxOverride);
  const g=playGame(createGame(su.home,su.away,{playoff:!!opts.playoff,neutral:!!opts.neutral}));
  if(opts.dry)return{hsc:g.score.h,asc:g.score.a,boxH:g.box.h,boxA:g.box.a,wx:su.wx,game:g};
  return{hsc:g.score.h,asc:g.score.a,boxH:applyGame(ht,su.hSnaps,g.box.h,!!opts.playoff),boxA:applyGame(at,su.aSnaps,g.box.a,!!opts.playoff),wx:su.wx};
}
// ═══════════ SCOUTS ═══════════

// ═══════════ COACHING ═══════════
export const OC_SCHEMES=["Air Raid","West Coast","Spread","Power Run"];
export const DC_SCHEMES=["3-4","4-3","Cover 2","Zone Blitz"];
export const SCHEME_CLASH={'Air Raid':{'Cover 2':-2,'Zone Blitz':-1},'Power Run':{'4-3':-2,'3-4':-1},'Spread':{'Zone Blitz':-1},'West Coast':{'Cover 2':-1}};
export const POS_MARKET={QB:4.2,RB:1.8,WR:2.5,TE:1.9,LT:2.8,LG:2.2,C:1.8,RG:2.2,RT:2.8,DL:2.4,LB:1.9,CB:2.1,S:1.7,K:0.7,P:0.6};
export const glGrade=p=>{const s=p.ss||{};const g=Math.max(1,s.gp||1);if(p.pos==='QB'){const r=s.rate||0;return r>=105?'A+':r>=95?'A':r>=82?'B':r>=70?'C':r>=55?'D':'F';}if(p.pos==='RB'){const y=(s.rushYds||0)/g;return y>=85?'A+':y>=65?'A':y>=45?'B':y>=30?'C':'D';}if(['WR','TE'].includes(p.pos)){const y=(s.recYds||0)/g;return y>=80?'A+':y>=60?'A':y>=40?'B':y>=25?'C':'D';}if(['DL','LB'].includes(p.pos)){const v=(s.sacks||0)*2.5+(s.tkl||0)/g;return v>=10?'A+':v>=7?'A':v>=5?'B':v>=3?'C':'D';}if(['CB','S'].includes(p.pos)){const v=(s.ints||0)*5+(s.pd||0)*1.5+(s.tkl||0)/g;return v>=12?'A+':v>=8?'A':v>=5?'B':v>=3?'C':'D';}return 'B';};
export const CO_TRAITS={OC:["Creative Play-Caller","Run Game Specialist","QB Whisperer","Red Zone Guru","Clock Manager","Tempo Master","Play-Action Artist","2-Minute Drill"],DC:["Blitz Specialist","Cover 2 Maestro","Run Stopper","Turnover Machine","4th Quarter D","Secondary Coach","Pressure Specialist","Bend Don't Break"],ST:["Kicker Developer","Returner Coach","Coverage Unit","Ice the Kicker"]};
export function genCoach(role){const sch=role==="OC"?OC_SCHEMES:role==="DC"?DC_SCHEMES:["Standard ST"];return{id:uid(),name:`${pick(FN)} ${pick(LN)}`,face:genFace(),role,rating:Gc(65,12,40,95),trait:pick(CO_TRAITS[role]),scheme:pick(sch),salary:+(Rf(1,6)*DATA_TO_DOLLARS).toFixed(1),contract:R(1,3),xp:0};}
export function getOCFit(t){const oc=t.coach?.oc;if(!oc)return 0;const qb=t.roster.filter(p=>p.pos==="QB"&&!p.injured).sort((a,b)=>b.ovr-a.ovr)[0];const rb=t.roster.filter(p=>p.pos==="RB"&&!p.injured).sort((a,b)=>b.ovr-a.ovr)[0];if(oc.scheme==="Air Raid"&&(qb?.ovr||0)>70)return 2;if(oc.scheme==="Power Run"&&(rb?.ovr||0)>70)return 2;if(oc.scheme==="West Coast"&&(qb?.ovr||0)>65)return 1;if(oc.scheme==="Spread"&&(qb?.spd||0)>70)return 1.5;return 0;}
export function getDCFit(t){const dc=t.coach?.dc;if(!dc)return 0;const lb=t.roster.filter(p=>p.pos==="LB"&&!p.injured).sort((a,b)=>b.ovr-a.ovr)[0];const dl=t.roster.filter(p=>p.pos==="DL"&&!p.injured).sort((a,b)=>b.ovr-a.ovr)[0];if(dc.scheme==="3-4"&&(lb?.ovr||0)>70)return 2;if(dc.scheme==="4-3"&&(dl?.ovr||0)>70)return 2;if(dc.scheme==="Zone Blitz"&&(lb?.ovr||0)>65)return 1.5;return 0;}
export function schemeRunPct(t){const s=t.coach?.oc?.scheme;if(s==="Power Run")return .60;if(s==="Air Raid")return .28;if(s==="Spread")return .35;return .42;}
// Feature 7: OFF/DEF split ratings
export const OFF_POS_SET=new Set(['QB','RB','WR','TE','LT','LG','C','RG','RT']);const DEF_POS_SET=new Set(['DL','LB','CB','S']);
export function calcOffStr(t){const r=t.roster.filter(p=>!p.injured&&!p.holdout&&OFF_POS_SET.has(p.pos));return r.length?Math.round(r.reduce((s,p)=>s+p.ovr,0)/r.length):65;}
export function calcDefStr(t){const r=t.roster.filter(p=>!p.injured&&!p.holdout&&DEF_POS_SET.has(p.pos));return r.length?Math.round(r.reduce((s,p)=>s+p.ovr,0)/r.length):65;}
export function genCoachMarket(){const n=R(5,8);const roles=['OC','DC','ST'];const specs=['pass','run','defense','special'];return Array.from({length:n},()=>({id:uid(),name:`${pick(FN)} ${pick(LN)}`,pos:pick(roles),rating:R(65,85),specialty:pick(specs),cost:R(1,2),face:genFace()}));}

export function capHit(t){return+((t.roster?.reduce((s,p)=>s+(p.salary||0),0)||0)+((t.coach?.oc?.salary||0)+(t.coach?.dc?.salary||0)+(t.coach?.st?.salary||0))+(t.deadCap||0)).toFixed(1);}
// Cap room under the cap for the league year in force (see cap.js).
export function capSpace(t){return+(leagueCap()-capHit(t)).toFixed(1);}

// ═══════════ LIVE PLAY GEN ═══════════
// uCall: undefined=auto | "run_inside"|"run_outside"|"run_screen"|"scramble"|"pass_quick"|"pass_medium"|"pass_deep"|"pass_rpo"

// ═══════════ COLORS & LABELS ═══════════
export const sL=k=>({passYds:"PYDS",passTD:"PTD",passInt:"INT",comp:"CMP",att:"ATT",rushYds:"RYDS",rushAtt:"RATT",rushTD:"RTD",recYds:"RECYDS",rec:"REC",recTD:"RECTD",tgt:"TGT",tkl:"TKL",ast:"AST",sacks:"SCK",tfl:"TFL",ints:"INT",ff:"FF",pd:"PD",qbH:"QBH",fgM:"FGM",fgA:"FGA",xpM:"XPM",xpA:"XPA",pts:"PTS",lng:"LNG",sk:"SK",skYds:"SKY",rate:"RTG",gp:"GP",gs:"GS",fum:"FUM",av:"AV",kr:"KR",krYds:"KR YDS",krTD:"KR TD",pr:"PR",prYds:"PR YDS",prTD:"PR TD",punts:"PUNTS",puntYds:"PUNT YDS",in20:"IN 20"}[k]||k);


// Milliseconds per AI pick, by speed setting: first-round picks take longer, like on TV.
// Live game: milliseconds between plays.
export const LIVE_SPEEDS={Slow:2200,Normal:1100,Fast:400};
export const DRAFT_SPEEDS=["Slow","Normal","Fast"];
export const pickDelay=(speed,rd)=>({Slow:rd===1?4500:2200,Normal:rd===1?2400:1100,Fast:rd===1?500:250})[speed]||1100;
