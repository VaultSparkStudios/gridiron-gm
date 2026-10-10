// Shared look: colors, badges, buttons and faces used across the app.
import React from "react";

export const Face=({s:se,sz=40})=>{if(!se)return null;return(<svg width={sz} height={sz} viewBox="0 0 50 50"><ellipse cx="25" cy="27" rx={se.jw/2+2} ry={se.fh/2} fill={se.sk} stroke="#0005" strokeWidth=".3"/><ellipse cx={25-se.jw/2-se.er/2} cy="27" rx={se.er} ry="4" fill={se.sk}/><ellipse cx={25+se.jw/2+se.er/2} cy="27" rx={se.er} ry="4" fill={se.sk}/>{se.hs<3?<ellipse cx="25" cy={16+se.hs} rx={se.jw/2+3} ry={10+se.hs} fill={se.hr}/>:se.hs<5?<rect x={25-se.jw/2-1} y="10" width={se.jw+2} height={12} rx="4" fill={se.hr}/>:<path d={`M${25-se.jw/2-2} 22 Q25 6 ${25+se.jw/2+2} 22`} fill={se.hr}/>}<ellipse cx="19" cy="26" rx={se.ew/2} ry={se.eh/2} fill="white" stroke="#333" strokeWidth=".3"/><circle cx="19" cy="26" r={se.eh/2-.5} fill="#3a2a1a"/><circle cx="19" cy="25.5" r=".6" fill="white"/><ellipse cx="31" cy="26" rx={se.ew/2} ry={se.eh/2} fill="white" stroke="#333" strokeWidth=".3"/><circle cx="31" cy="26" r={se.eh/2-.5} fill="#3a2a1a"/><circle cx="31" cy="25.5" r=".6" fill="white"/><line x1="16" y1={24-se.bh} x2="22" y2={23.5-se.bh} stroke={se.hr} strokeWidth="1" strokeLinecap="round"/><line x1="28" y1={23.5-se.bh} x2="34" y2={24-se.bh} stroke={se.hr} strokeWidth="1" strokeLinecap="round"/><ellipse cx="25" cy="30" rx={se.nw/3} ry="2" fill={se.sk} stroke="#0003" strokeWidth=".3"/><ellipse cx="25" cy="35" rx={se.mw/3} ry="1.5" fill="#c0392b" opacity=".7"/></svg>);};
export const C={bg:"#080c14",cd:"#111827",bd:"#1e293b",tx:"#e0e6f0",mt:"#64748b",gn:"#22c55e",bl:"#3b82f6",gd:"#eab308",rd:"#ef4444",f:"'Segoe UI',system-ui,sans-serif"};
export const oC=o=>o>=80?"#22c55e":o>=68?"#84cc16":o>=55?"#eab308":o>=42?"#f97316":"#ef4444";
export const pC=p=>({QB:"#e74c3c",RB:"#3498db",WR:"#f39c12",TE:"#9b59b6",LT:"#1abc9c",LG:"#17a589",C:"#0e8c73",RG:"#17a589",RT:"#1abc9c",DL:"#e67e22",LB:"#2ecc71",CB:"#e91e63",S:"#00bcd4",K:"#795548",P:"#8d6e63"}[p]||"#999");
export const PA_LABELS={coffin:"Coffin Corner",armStr:"Arm Str",accuracy:"Accuracy",pocketAwr:"Pocket",decisions:"Decisions",mobility:"Mobility",touch:"Touch",readDef:"Read Def",vision:"Vision",elusiveness:"Elusive",breakTkl:"Break Tkl",passBlock:"Pass Blk",receiving:"Receiving",burst:"Burst",balance:"Balance",stiffArm:"Stiff Arm",routeRun:"Route Run",catching:"Catching",separation:"Separate",release:"Release",bodyCtrl:"Body Ctrl",yac:"YAC",deepSpd:"Deep Spd",catchTraffic:"Traffic",blocking:"Blocking",redZone:"Red Zone",seaming:"Seaming",toughness:"Toughness",footwork:"Footwork",anchor:"Anchor",awareness:"Awareness",handUse:"Hand Use",reach:"Reach",agility:"Agility",runBlock:"Run Blk",pulling:"Pulling",strength:"Strength",drive:"Drive",snapping:"Snapping",leadership:"Leadrshp",athleticism:"Athletic",power:"Power",passRush:"Pass Rush",runStop:"Run Stop",motor:"Motor",getOff:"Get Off",bullRush:"Bull Rush",swim:"Swim",spin:"Spin",tackling:"Tackling",coverage:"Coverage",blitzing:"Blitzing",runFit:"Run Fit",instincts:"Instinct",pursuit:"Pursuit",shedBlock:"Shed Blk",zoneAwr:"Zone Awr",manCov:"Man Cov",zoneCov:"Zone Cov",press:"Press",ballSkills:"Ball Sklls",recovery:"Recovery",playRec:"Play Rec",range:"Range",runSupport:"Run Supp",ballHawk:"Ball Hawk",comms:"Comms",versatility:"Versatile",legStr:"Leg Str",clutch:"Clutch",distance:"Distance",hangTime:"Hang Time",consistency:"Consist",coldWx:"Cold Wx",pressure:"Pressure"};
export const Bdg=({pos})=><span style={{background:pC(pos),color:"#fff",padding:"1px 5px",borderRadius:3,fontSize:11,fontWeight:800}}>{pos}</span>;
export const Btn=({children,onClick,disabled,bg,c:co,style:st})=><button onClick={onClick} disabled={disabled} style={{background:bg||C.bl,color:co||"#fff",border:"none",padding:"4px 10px",borderRadius:4,fontWeight:700,fontSize:13,cursor:disabled?"default":"pointer",opacity:disabled?.5:1,...(st||{})}}>{children}</button>;
export const PN=({p,setSel,style:st})=><span onClick={e=>{e.stopPropagation();setSel(p);}} style={{cursor:"pointer",fontWeight:600,textDecoration:"none",...(st||{})}} onMouseOver={e=>e.target.style.textDecoration="underline"} onMouseOut={e=>e.target.style.textDecoration="none"}>{p.name}</span>;

// Team logos, loaded from ESPN's public logo CDN (NFL marks belong to the NFL and its clubs).
// If a logo can't load, the team's colors and abbreviation stand in.
const ESPN_AB = { WAS: "wsh" };
export const logoUrl = (ab) => `https://a.espncdn.com/i/teamlogos/nfl/500/${ESPN_AB[ab] || String(ab || "").toLowerCase()}.png`;
export function TeamLogo({ t, sz = 40 }) {
  const [bad, setBad] = React.useState(false);
  if (!t) return null;
  const box = { width: sz, height: sz, flexShrink: 0, borderRadius: Math.round(sz / 5), display: "inline-flex", alignItems: "center", justifyContent: "center" };
  if (bad) return <span style={{ ...box, background: `linear-gradient(135deg,${t.clr},${t.ac})`, fontWeight: 900, fontSize: Math.max(9, Math.round(sz / 3)), color: "#fff" }}>{t.ab}</span>;
  return <img src={logoUrl(t.ab)} alt={`${t.city || ""} ${t.name || t.ab}`.trim()} title={`${t.city || ""} ${t.name || ""}`.trim()} width={sz} height={sz} loading="lazy" onError={() => setBad(true)} style={{ ...box, objectFit: "contain" }} />;
}

// "Thu, Sep 10 · 8:20 PM ET" from a real schedule's kickoff time (UTC), or "" without one.
export function kickoff(g) {
  if (!g?.date) return "";
  const d = new Date(g.date);
  if (isNaN(d)) return "";
  const day = d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "America/New_York" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/New_York" });
  return `${day} · ${time} ET`;
}
