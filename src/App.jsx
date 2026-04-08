import { useState, useEffect, useCallback, useRef } from "react";
import { AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
//Consts
const C={bg:"#07090f",card:"#0d1117",border:"#1a2535",muted:"#3d5166",dim:"#566880",text:"#e0eaf5",accent:"#00C2FF"};
const GS=()=><style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@400;500;600;700;800;900&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{background:#07090f}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:#1e2d40;border-radius:4px}@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}@keyframes spin{to{transform:rotate(360deg)}}@keyframes bounceIn{0%{transform:scale(.85);opacity:0}60%{transform:scale(1.05)}100%{transform:scale(1);opacity:1}}@keyframes shake{0%,100%{transform:translateX(0)}20%,60%{transform:translateX(-5px)}40%,80%{transform:translateX(5px)}}@keyframes confettiFall{0%{transform:translateY(-10px) rotate(0deg);opacity:1}100%{transform:translateY(105vh) rotate(720deg);opacity:0}}@keyframes floatUp{0%{transform:translateY(0) scale(1);opacity:1}100%{transform:translateY(-70px) scale(1.2);opacity:0}}@keyframes resultPop{0%{transform:translateX(-50%) scale(.6) translateY(20px);opacity:0}60%{transform:translateX(-50%) scale(1.08) translateY(-4px)}100%{transform:translateX(-50%) scale(1) translateY(0);opacity:1}}@keyframes resultOut{0%{opacity:1;transform:translateX(-50%) scale(1)}100%{opacity:0;transform:translateX(-50%) scale(.9) translateY(10px)}}.fade-up{animation:fadeUp .35s ease both}.pick-correct{animation:bounceIn .5s ease both}.pick-wrong{animation:shake .4s ease both}.btn{cursor:pointer;border:none;outline:none;transition:all .15s;font-family:inherit}.btn:hover{filter:brightness(1.15)}.card{transition:transform .15s,box-shadow .15s}.card:hover{transform:translateY(-2px);box-shadow:0 8px 28px #00000055}input,select{outline:none;font-family:inherit}.spin{animation:spin 1s linear infinite}`}</style>;
const Tag=({c="#00C2FF",children})=><span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,background:`${c}22`,color:c,letterSpacing:.8}}>{children}</span>;
const Card=({children,style={}})=><div className="card" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:18,...style}}>{children}</div>;
const ST=({children,sub})=><div style={{marginBottom:16}}><div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:2}}>{sub}</div><div style={{fontSize:22,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1,color:C.text}}>{children}</div></div>;
const Divider=()=><div style={{height:1,background:C.border,margin:"12px 0"}}/>;
const Spin=({s=20})=><div className="spin" style={{width:s,height:s,border:`2px solid ${C.border}`,borderTopColor:C.accent,borderRadius:"50%",display:"inline-block"}}/>;
const TT=({active,payload,label})=>active&&payload?.length?<div style={{background:"#0d1117",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 14px"}}><p style={{color:C.muted,fontSize:10,marginBottom:4}}>{label}</p>{payload.map((p,i)=><p key={i} style={{color:p.color,fontSize:13,fontWeight:700}}>{p.name}: {p.value}</p>)}</div>:null;

// ─── CONFETTI ──────────────────────────────────────────────────────────────
const CONF_COLORS=['#00C2FF','#00FF9D','#FFB800','#FF6B35','#a855f7','#ffffff','#ff6b9d'];
const Confetti=({active})=>{
  if(!active) return null;
  const particles=Array.from({length:70},(_,i)=>({id:i,x:Math.random()*100,delay:Math.random()*.9,dur:1.4+Math.random()*1.2,color:CONF_COLORS[i%CONF_COLORS.length],w:5+Math.random()*9,h:3+Math.random()*6,rot:Math.random()*360}));
  return <div style={{position:'fixed',inset:0,pointerEvents:'none',zIndex:9999,overflow:'hidden'}}>
    {particles.map(p=><div key={p.id} style={{position:'absolute',left:`${p.x}%`,top:-12,width:p.w,height:p.h,background:p.color,borderRadius:2,opacity:0,animation:`confettiFall ${p.dur}s ${p.delay}s ease-in forwards`,transform:`rotate(${p.rot}deg)`}}/>)}
  </div>;
};

// ─── RESULT BANNER ─────────────────────────────────────────────────────────
const ResultBanner=({show,correct,pts,streak,streakOnly,onClose})=>{
  useEffect(()=>{if(show){const t=setTimeout(onClose,3800);return()=>clearTimeout(t);}},[show]);
  if(!show) return null;
  const bg=streakOnly?'linear-gradient(135deg,#FFB800,#ff9500)':correct?'linear-gradient(135deg,#00FF9D,#00c97a)':'linear-gradient(135deg,#ff4444,#cc2222)';
  return <div style={{position:'fixed',bottom:90,left:'50%',transform:'translateX(-50%)',background:bg,color:'#07090f',borderRadius:20,padding:'16px 28px',fontSize:20,fontWeight:900,zIndex:9998,animation:'resultPop .5s ease both',boxShadow:'0 12px 40px #00000088',display:'flex',alignItems:'center',gap:12,whiteSpace:'nowrap'}}>
    {streakOnly?<>🔥 <span>¡Racha de {streak}!</span></>:correct?<>✅ <span>+{pts} pts</span>{streak>=3&&<span style={{background:'#07090f22',borderRadius:10,padding:'2px 10px',fontSize:15}}>🔥 {streak}</span>}</>:<>❌ <span>Mala suerte</span></>}
  </div>;
};

// ─── FLOATING POINTS ───────────────────────────────────────────────────────
const FloatPts=({pts,correct})=><div style={{position:'absolute',top:'-8px',right:10,fontSize:18,fontWeight:900,color:correct?'#00FF9D':'#ff6666',pointerEvents:'none',animation:'floatUp 1.2s ease forwards',zIndex:100,textShadow:'0 2px 8px #00000088'}}>{correct?`+${pts}`:`-${pts}`}</div>;
const LiveBadge=({live})=><span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:20,letterSpacing:.8,background:live?"#00FF9D18":"#1a2535",color:live?"#00FF9D":C.muted}}>{live?"🟢 LIVE":"📦 Cache"}</span>;

/* ═══ TEAM META + LOGOS ═══ */
const ESPN_LOGO={ATL:"atl",BOS:"bos",BKN:"bkn",CHA:"cha",CHI:"chi",CLE:"cle",DAL:"dal",DEN:"den",DET:"det",GSW:"gs",HOU:"hou",IND:"ind",LAC:"lac",LAL:"lal",MEM:"mem",MIA:"mia",MIL:"mil",MIN:"min",NOP:"no",NYK:"ny",OKC:"okc",ORL:"orl",PHI:"phi",PHX:"phx",POR:"por",SAC:"sac",SAS:"sa",TOR:"tor",UTA:"utah",WAS:"wsh"};
const logo=(abbr,sz=32)=><img src={`https://a.espncdn.com/i/teamlogos/nba/500/${ESPN_LOGO[abbr]||abbr.toLowerCase()}.png`} alt={abbr} style={{width:sz,height:sz,objectFit:"contain"}} onError={e=>{e.target.style.display="none"}}/>;

const TM={
  ATL:{color:"#E03A3E",name:"Atlanta Hawks",conf:"E",div:"Southeast"},BOS:{color:"#008348",name:"Boston Celtics",conf:"E",div:"Atlantic"},BKN:{color:"#BBBBBB",name:"Brooklyn Nets",conf:"E",div:"Atlantic"},CHA:{color:"#00B2A9",name:"Charlotte Hornets",conf:"E",div:"Southeast"},CHI:{color:"#CE1141",name:"Chicago Bulls",conf:"E",div:"Central"},CLE:{color:"#860038",name:"Cleveland Cavaliers",conf:"E",div:"Central"},DAL:{color:"#00538C",name:"Dallas Mavericks",conf:"W",div:"Southwest"},DEN:{color:"#FEC524",name:"Denver Nuggets",conf:"W",div:"Northwest"},DET:{color:"#C8102E",name:"Detroit Pistons",conf:"E",div:"Central"},GSW:{color:"#1D428A",name:"Golden State Warriors",conf:"W",div:"Pacific"},HOU:{color:"#CE1141",name:"Houston Rockets",conf:"W",div:"Southwest"},IND:{color:"#FDBB30",name:"Indiana Pacers",conf:"E",div:"Central"},LAC:{color:"#C8102E",name:"LA Clippers",conf:"W",div:"Pacific"},LAL:{color:"#552583",name:"Los Angeles Lakers",conf:"W",div:"Pacific"},MEM:{color:"#5D76A9",name:"Memphis Grizzlies",conf:"W",div:"Southwest"},MIA:{color:"#98002E",name:"Miami Heat",conf:"E",div:"Southeast"},MIL:{color:"#007A33",name:"Milwaukee Bucks",conf:"E",div:"Central"},MIN:{color:"#236192",name:"Minnesota Timberwolves",conf:"W",div:"Northwest"},NOP:{color:"#C8A96E",name:"New Orleans Pelicans",conf:"W",div:"Southwest"},NYK:{color:"#006BB6",name:"New York Knicks",conf:"E",div:"Atlantic"},OKC:{color:"#007AC1",name:"OKC Thunder",conf:"W",div:"Northwest"},ORL:{color:"#0077C0",name:"Orlando Magic",conf:"E",div:"Southeast"},PHI:{color:"#ED174C",name:"Philadelphia 76ers",conf:"E",div:"Atlantic"},PHX:{color:"#E56020",name:"Phoenix Suns",conf:"W",div:"Pacific"},POR:{color:"#E03A3E",name:"Portland Trail Blazers",conf:"W",div:"Northwest"},SAC:{color:"#5A2D81",name:"Sacramento Kings",conf:"W",div:"Pacific"},SAS:{color:"#8E9093",name:"San Antonio Spurs",conf:"W",div:"Southwest"},TOR:{color:"#CE1141",name:"Toronto Raptors",conf:"E",div:"Atlantic"},UTA:{color:"#F9A01B",name:"Utah Jazz",conf:"W",div:"Northwest"},WAS:{color:"#E31837",name:"Washington Wizards",conf:"E",div:"Southeast"},
};
const tm=a=>TM[a]||{color:C.accent,name:a||"?",conf:"W",div:""};
const FIX={GS:"GSW",NY:"NYK",SA:"SAS",NO:"NOP",WSH:"WAS",UTAH:"UTA",CHAR:"CHA",PHO:"PHX",UTH:"UTA"};
const fix=a=>FIX[a]||a;

const ROSTERS={
  OKC:["Shai Gilgeous-Alexander","Jalen Williams","Chet Holmgren","Lu Dort","Alex Caruso","Isaiah Hartenstein","Ajay Mitchell","Ousmane Dieng"],
  SAS:["Victor Wembanyama","De'Aaron Fox","Stephon Castle","Jeremy Sochan","Devin Vassell","Keldon Johnson","Zach Collins","Julian Champagnie"],
  LAL:["Luka Dončić","LeBron James","Austin Reaves","Rui Hachimura","D'Angelo Russell","Gabe Vincent","Cam Reddish","Jaxson Hayes"],
  MIN:["Anthony Edwards","Rudy Gobert","Julius Randle","Naz Reid","Mike Conley","Jaden McDaniels","Donte DiVincenzo","Rob Dillingham"],
  HOU:["Kevin Durant","Alperen Sengun","Jalen Green","Fred VanVleet","Amen Thompson","Dillon Brooks","Jabari Smith Jr.","Tari Eason"],
  DEN:["Nikola Jokić","Jamal Murray","Aaron Gordon","Christian Braun","Russell Westbrook","Peyton Watson"],
  PHX:["Devin Booker","Bradley Beal","Jusuf Nurkic","Grayson Allen","Royce O'Neale","Josh Okogie"],
  LAC:["Kawhi Leonard","James Harden","Norman Powell","Ivica Zubac","Terance Mann","Bones Hyland"],
  POR:["Deni Avdija","Anfernee Simons","Scoot Henderson","Shaedon Sharpe","Deandre Ayton","Jerami Grant"],
  GSW:["Stephen Curry","Draymond Green","Andrew Wiggins","Brandin Podziemski","Jonathan Kuminga","Kevon Looney"],
  DAL:["Kyrie Irving","Anthony Davis","PJ Washington","Quentin Grimes","Naji Marshall","Jaden Hardy"],
  UTA:["Lauri Markkanen","Keyonte George","Jordan Clarkson","Collin Sexton","Walker Kessler","John Collins"],
  CLE:["Donovan Mitchell","Darius Garland","Evan Mobley","Jarrett Allen","Max Strus","Isaac Okoro"],
  BOS:["Jayson Tatum","Jaylen Brown","Jrue Holiday","Derrick White","Kristaps Porzingis","Payton Pritchard"],
  NYK:["Jalen Brunson","Karl-Anthony Towns","Mikal Bridges","OG Anunoby","Josh Hart","Miles McBride"],
  MIA:["Bam Adebayo","Tyler Herro","Jaime Jaquez Jr.","Davion Mitchell","Nikola Jovic","Duncan Robinson"],
  MIL:["Giannis Antetokounmpo","Damian Lillard","Brook Lopez","Bobby Portis","Ryan Rollins","Kevin Porter Jr."],
  IND:["Pascal Siakam","Tyrese Haliburton","Myles Turner","Bennedict Mathurin","Andrew Nembhard","Aaron Nesmith"],
  ORL:["Paolo Banchero","Franz Wagner","Desmond Bane","Wendell Carter Jr.","Jalen Suggs","Cole Anthony"],
  ATL:["Trae Young","Jalen Johnson","Dyson Daniels","Nickeil Alexander-Walker","De'Andre Hunter","Onyeka Okongwu"],
  CHI:["Josh Giddey","Nikola Vucevic","Coby White","Patrick Williams","Ayo Dosunmu","Matas Buzelis"],
  TOR:["Scottie Barnes","Brandon Ingram","Immanuel Quickley","Jakob Poeltl","RJ Barrett","Gradey Dick"],
  DET:["Cade Cunningham","Jalen Duren","Ausar Thompson","Kevin Huerter","Caris LeVert","Daniss Jenkins"],
  PHI:["Tyrese Maxey","Joel Embiid","Paul George","Kelly Oubre Jr.","VJ Edgecombe","Kyle Lowry"],
  CHA:["LaMelo Ball","Brandon Miller","Miles Bridges","Mark Williams","Grant Williams","Nick Smith Jr."],
  BKN:["Michael Porter Jr.","Cam Thomas","Nic Claxton","Cameron Johnson","Ben Simmons","Noah Clowney"],
  WAS:["Carlton Carrington","Alexandre Sarr","Bilal Coulibaly","Jordan Poole","Kyle Kuzma","Corey Kispert"],
  MEM:["Ja Morant","Jaren Jackson Jr.","Santi Aldama","Marcus Smart","GG Jackson","Vince Williams Jr."],
  SAC:["Domantas Sabonis","Russell Westbrook","Malik Monk","Kevin Huerter","Keon Ellis","Trey Lyles"],
  NOP:["Zion Williamson","CJ McCollum","Herbert Jones","Trey Murphy III","Jose Alvarado","Yves Missi"],
};

/* ═══ FALLBACK DATA ═══ */
const FB_ST=[
  {abbr:"OKC",conf:"W",w:55,l:15,streak:"W5"},{abbr:"SAS",conf:"W",w:51,l:18,streak:"W3"},{abbr:"LAL",conf:"W",w:44,l:25,streak:"W2"},
  {abbr:"MIN",conf:"W",w:43,l:27,streak:"W1"},{abbr:"DEN",conf:"W",w:42,l:28,streak:"W1"},{abbr:"HOU",conf:"W",w:41,l:27,streak:"L1"},
  {abbr:"PHX",conf:"W",w:39,l:30,streak:"L1"},{abbr:"LAC",conf:"W",w:34,l:35,streak:"L2"},{abbr:"POR",conf:"W",w:34,l:36,streak:"W1"},
  {abbr:"GSW",conf:"W",w:33,l:36,streak:"L1"},{abbr:"MEM",conf:"W",w:24,l:44,streak:"L2"},{abbr:"NOP",conf:"W",w:24,l:46,streak:"L1"},
  {abbr:"DAL",conf:"W",w:23,l:47,streak:"L3"},{abbr:"UTA",conf:"W",w:20,l:49,streak:"L2"},{abbr:"SAC",conf:"W",w:18,l:52,streak:"L4"},
  {abbr:"DET",conf:"E",w:49,l:19,streak:"W2"},{abbr:"BOS",conf:"E",w:46,l:23,streak:"W1"},{abbr:"NYK",conf:"E",w:45,l:25,streak:"W1"},
  {abbr:"CLE",conf:"E",w:42,l:27,streak:"W2"},{abbr:"TOR",conf:"E",w:39,l:29,streak:"L1"},{abbr:"ORL",conf:"E",w:38,l:30,streak:"W1"},
  {abbr:"ATL",conf:"E",w:38,l:31,streak:"L1"},{abbr:"MIA",conf:"E",w:38,l:31,streak:"W1"},{abbr:"PHI",conf:"E",w:37,l:32,streak:"L1"},
  {abbr:"CHA",conf:"E",w:35,l:34,streak:"W1"},{abbr:"CHI",conf:"E",w:28,l:41,streak:"L1"},{abbr:"MIL",conf:"E",w:28,l:40,streak:"L2"},
  {abbr:"BKN",conf:"E",w:17,l:52,streak:"L3"},{abbr:"WAS",conf:"E",w:16,l:52,streak:"L4"},{abbr:"IND",conf:"E",w:15,l:55,streak:"L5"},
].map(s=>({id:s.abbr,...s,...tm(s.abbr),pct:+(s.w/(s.w+s.l)).toFixed(3),players:ROSTERS[s.abbr]||[]}));

const FB_PL=[
  {id:1,name:"Luka Dončić",teamAbbr:"LAL",pos:"G",pts:33.7,ast:8.7,reb:8.1,blk:0.6,stl:1.5,fgPct:46.0,fg3Pct:36.5},
  {id:2,name:"Shai Gilgeous-Alexander",teamAbbr:"OKC",pos:"G",pts:31.6,ast:6.4,reb:4.4,blk:0.7,stl:1.4,fgPct:54.8,fg3Pct:39.5},
  {id:3,name:"Tyrese Maxey",teamAbbr:"PHI",pos:"G",pts:31.0,ast:7.0,reb:4.7,blk:0.9,stl:1.8,fgPct:47.5,fg3Pct:41.8},
  {id:4,name:"Donovan Mitchell",teamAbbr:"CLE",pos:"G",pts:29.8,ast:5.4,reb:4.7,blk:0.3,stl:1.5,fgPct:49.7,fg3Pct:38.5},
  {id:5,name:"Nikola Jokić",teamAbbr:"DEN",pos:"C",pts:29.6,ast:11.0,reb:12.2,blk:0.8,stl:1.4,fgPct:60.5,fg3Pct:43.0},
  {id:6,name:"Jaylen Brown",teamAbbr:"BOS",pos:"G",pts:29.6,ast:4.9,reb:6.3,blk:0.4,stl:1.1,fgPct:50.1,fg3Pct:37.4},
  {id:7,name:"Anthony Edwards",teamAbbr:"MIN",pos:"G",pts:29.4,ast:3.7,reb:5.0,blk:0.8,stl:1.4,fgPct:50.6,fg3Pct:37.8},
  {id:8,name:"Giannis Antetokounmpo",teamAbbr:"MIL",pos:"F",pts:29.3,ast:5.5,reb:10.0,blk:0.8,stl:0.9,fgPct:64.3,fg3Pct:28.0},
  {id:9,name:"Jalen Brunson",teamAbbr:"NYK",pos:"G",pts:29.2,ast:6.3,reb:3.3,blk:0.1,stl:0.8,fgPct:47.5,fg3Pct:39.5},
  {id:10,name:"Stephen Curry",teamAbbr:"GSW",pos:"G",pts:28.7,ast:4.4,reb:3.9,blk:0.4,stl:1.3,fgPct:46.4,fg3Pct:41.0},
  {id:11,name:"Kawhi Leonard",teamAbbr:"LAC",pos:"F",pts:28.1,ast:3.5,reb:6.6,blk:0.7,stl:2.1,fgPct:49.2,fg3Pct:40.2},
  {id:12,name:"Lauri Markkanen",teamAbbr:"UTA",pos:"F",pts:27.7,ast:2.1,reb:6.8,blk:0.4,stl:1.1,fgPct:47.7,fg3Pct:40.5},
  {id:13,name:"Cade Cunningham",teamAbbr:"DET",pos:"G",pts:26.7,ast:9.7,reb:6.2,blk:0.8,stl:1.5,fgPct:46.5,fg3Pct:35.0},
  {id:14,name:"Austin Reaves",teamAbbr:"LAL",pos:"G",pts:26.6,ast:6.3,reb:5.2,blk:0.2,stl:1.0,fgPct:50.7,fg3Pct:39.5},
  {id:15,name:"Deni Avdija",teamAbbr:"POR",pos:"F",pts:25.9,ast:7.1,reb:7.3,blk:0.6,stl:0.8,fgPct:46.8,fg3Pct:38.0},
  {id:16,name:"Michael Porter Jr.",teamAbbr:"BKN",pos:"F",pts:25.9,ast:3.4,reb:7.6,blk:0.2,stl:0.9,fgPct:49.5,fg3Pct:40.0},
  {id:17,name:"Kevin Durant",teamAbbr:"HOU",pos:"F",pts:25.7,ast:4.6,reb:5.1,blk:1.0,stl:0.7,fgPct:52.0,fg3Pct:41.0},
  {id:18,name:"James Harden",teamAbbr:"LAC",pos:"G",pts:25.7,ast:8.0,reb:4.8,blk:0.3,stl:1.2,fgPct:43.3,fg3Pct:37.0},
  {id:19,name:"Devin Booker",teamAbbr:"PHX",pos:"G",pts:25.7,ast:6.3,reb:4.1,blk:0.4,stl:0.9,fgPct:46.3,fg3Pct:36.5},
  {id:20,name:"Jamal Murray",teamAbbr:"DEN",pos:"G",pts:25.4,ast:7.2,reb:4.6,blk:0.3,stl:1.0,fgPct:48.0,fg3Pct:38.2},
  {id:21,name:"Victor Wembanyama",teamAbbr:"SAS",pos:"F",pts:24.3,ast:3.4,reb:11.7,blk:2.9,stl:0.8,fgPct:52.5,fg3Pct:35.8},
  {id:22,name:"Keyonte George",teamAbbr:"UTA",pos:"G",pts:24.3,ast:6.8,reb:4.2,blk:0.3,stl:0.9,fgPct:45.2,fg3Pct:38.0},
  {id:23,name:"Pascal Siakam",teamAbbr:"IND",pos:"F",pts:23.8,ast:3.8,reb:6.7,blk:0.4,stl:1.3,fgPct:48.7,fg3Pct:34.5},
  {id:24,name:"Jalen Johnson",teamAbbr:"ATL",pos:"F",pts:23.7,ast:8.4,reb:10.4,blk:0.5,stl:1.4,fgPct:52.1,fg3Pct:35.5},
].map(p=>({...p,color:tm(p.teamAbbr).color}));

/* ═══ API LAYER ═══ */
const isVercel = typeof window !== "undefined" && window.location.hostname !== "localhost" || false;

async function api(path) {
  try {
    const r = await fetch(path, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } catch { return null; }
}

async function espnDirect(url) {
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) });
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } catch { return null; }
}

async function loadGames() {
  // Try Vercel API first, fallback to ESPN direct
  let d = await api("/api/scoreboard");
  if (d?.ok) return d.games;
  d = await espnDirect("https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard");
  if (!d) return [];
  return (d.events||[]).map(e=>{
    const comp=e.competitions?.[0],home=comp?.competitors?.find(c=>c.homeAway==="home"),away=comp?.competitors?.find(c=>c.homeAway==="away"),st=comp?.status?.type;
    return{id:e.id,home:fix(home?.team?.abbreviation),away:fix(away?.team?.abbreviation),homeScore:parseInt(home?.score||0),awayScore:parseInt(away?.score||0),
      status:st?.completed||st?.state==="post"?"Final":st?.state==="in"?"LIVE":"Upcoming",
      startTime:e.date||null,
      detail:st?.state==="in"?`Q${comp?.status?.period||"?"} ${comp?.status?.displayClock||""}`:(st?.state==="post"?"Final":st?.shortDetail||"")};
  });
}

async function loadStandings() {
  let d = await api("/api/standings");
  if (d?.ok && d.standings?.length >= 25) return d.standings.map(s=>({id:s.abbr,...s,...tm(s.abbr),pct:s.pct,players:ROSTERS[s.abbr]||[]}));
  // ESPN direct fallback
  d = await espnDirect("https://site.api.espn.com/apis/v2/sports/basketball/nba/standings");
  if (!d) return null;
  const results=[];
  const walk=n=>{if(n?.standings?.entries?.length)n.standings.entries.forEach(e=>{const abbr=fix(e.team?.abbreviation||"");if(!TM[abbr])return;const sm={};(e.stats||[]).forEach(s=>{sm[s.name]=s.value;});const w=Math.round(sm.wins||0),l=Math.round(sm.losses||0);results.push({id:abbr,abbr,...tm(abbr),w,l,pct:w+l>0?+(w/(w+l)).toFixed(3):0,streak:`${Number(sm.streak||0)>=0?"W":"L"}${Math.abs(Number(sm.streak||0))||1}`,players:ROSTERS[abbr]||[]});});(n?.children||[]).forEach(walk);};
  walk(d);
  return results.length>=25?results:null;
}

async function loadPlayers() {
  const d = await api("/api/players");
  if (d?.ok && d.players?.length > 10) return d.players.map((p,i)=>({...p,id:i+1,color:tm(p.teamAbbr).color}));
  return null;
}

/* ═══ PICKEM API ═══ */
async function pickemAPI(action, opts = {}) {
  const { body, params } = opts;
  const qs = new URLSearchParams({ action, ...params }).toString();
  try {
    const r = await fetch(`/api/pickem?${qs}`, {
      method: body ? "POST" : "GET",
      headers: body ? { "Content-Type": "application/json" } : {},
      body: body ? JSON.stringify(body) : undefined,
    });
    return await r.json();
  } catch { return { ok: false, error: "Network error" }; }
}

/* ═══ USER CONTEXT (localStorage) ═══ */
function useUser() {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("courtiq_user")); } catch { return null; }
  });
  const save = (u) => { setUser(u); localStorage.setItem("courtiq_user", JSON.stringify(u)); };
  const logout = () => { setUser(null); localStorage.removeItem("courtiq_user"); };
  return { user, save, logout };
}

/* ═══ WIN PROBABILITY + DYNAMIC PTS ═══ */
const calcWinPct=(g,side,st)=>{
  if(!st?.length)return 50;
  if(g.status==="Final")return side==="away"?(g.awayScore>g.homeScore?100:0):(g.homeScore>g.awayScore?100:0);
  if(g.status==="LIVE"){const diff=side==="away"?g.awayScore-g.homeScore:g.homeScore-g.awayScore;return Math.min(95,Math.max(5,50+diff*2.5));}
  const homeT=st.find(s=>s.abbr===g.home);const awayT=st.find(s=>s.abbr===g.away);
  const hR=homeT&&(homeT.w+homeT.l)>0?homeT.w/(homeT.w+homeT.l):0.5;
  const aR=awayT&&(awayT.w+awayT.l)>0?awayT.w/(awayT.w+awayT.l):0.5;
  const hProb=Math.min(95,Math.max(5,Math.round((hR+0.03)/(hR+0.03+aR)*100)));
  return side==="home"?hProb:100-hProb;
};
const dynBase=(pct)=>Math.min(18,Math.max(3,Math.round(10-(pct-50)/5)));
const dynPts=(pct,conf=1)=>dynBase(pct)*conf;

/* ═══ HOME TAB ═══ */
const HomeTab=({games,live,userCtx,standings,goToBets,goToGroup})=>{
  const {user}=userCtx||{};
  const [picks,setPicks]=useState({});
  const [confidence,setConfidence]=useState({});
  const [group,setGroup]=useState(null);
  const [loaded,setLoaded]=useState(false);
  const [grpPicks,setGrpPicks]=useState([]);
  const [pendingBets,setPendingBets]=useState([]);
  const [expandedCard,setExpandedCard]=useState(null);
  const [lockedPicks,setLockedPicks]=useState(false);
  const [showPctInfo,setShowPctInfo]=useState(false);
  const [bonusClaimed,setBonusClaimed]=useState(null);
  const [bonusMsg,setBonusMsg]=useState("");
  const [picksPoints,setPicksPoints]=useState({});
  const [streak,setStreak]=useState(0);
  const [weeklyStats,setWeeklyStats]=useState(null);
  const [showConfetti,setShowConfetti]=useState(false);
  const [resultBanner,setResultBanner]=useState({show:false,correct:false,pts:0,streak:0});
  const [floatingPts,setFloatingPts]=useState({}); // {gameId: {pts,correct,key}}
  const prevStatusRef=useRef({});
  const prevStreakRef=useRef(streak);

  const triggerCelebration=(correctPts,str)=>{
    const today=new Date().toISOString().split("T")[0];
    const cKey=`courtiq_celebrated_${user?.id}_${today}`;
    if(localStorage.getItem(cKey)) return;
    localStorage.setItem(cKey,"1");
    setShowConfetti(true);
    setResultBanner({show:true,correct:true,pts:correctPts,streak:str});
    setTimeout(()=>setShowConfetti(false),3500);
  };

  useEffect(()=>{
    if(!user)return;
    const today=new Date().toISOString().split("T")[0];
    const savedGid=localStorage.getItem("courtiq_lastgroup");
    // Restaurar grupo del cache sincrónico — picks funcionan de inmediato
    try{const cached=localStorage.getItem("courtiq_lastgroup_obj");if(cached)setGroup(JSON.parse(cached));}catch(_){}
    if(savedGid&&localStorage.getItem(`courtiq_locked_${savedGid}_${today}`)) setLockedPicks(true);

    pickemAPI("myGroups",{params:{userId:user.id}}).then(d=>{
      if(d.ok&&d.groups?.length){
        const g=d.groups.find(x=>x.id===savedGid)||d.groups[0];
        setGroup(g);
        localStorage.setItem("courtiq_lastgroup_obj",JSON.stringify(g));
        pickemAPI("myPicks",{params:{userId:user.id,groupId:g.id,date:today}}).then(r=>{
          if(r.ok){
            const m={},pts={},conf={};
            (r.picks||[]).forEach(p=>{m[p.game_id]=p.picked_team;if(p.points!=null)pts[p.game_id]=p.points;if(p.confidence)conf[p.game_id]=p.confidence;});
            setPicks(m);setPicksPoints(pts);setConfidence(conf);
            // Trigger celebration if there are correct picks today
            const correctPicks=(r.picks||[]).filter(p=>p.correct&&p.points>0);
            if(correctPicks.length>0){
              const totalPts=correctPicks.reduce((s,p)=>s+(p.points||0),0);
              triggerCelebration(totalPts,0);
            }
          }
          setLoaded(true);
        });
        pickemAPI("groupPicks",{params:{groupId:g.id}}).then(r=>{if(r.ok)setGrpPicks(r.picks||[]);});
        pickemAPI("groupBets",{params:{groupId:g.id}}).then(r=>{
          if(r.ok){const challenges=(r.bets||[]).filter(b=>b.status==="pending"&&b.opponent_id===user.id);setPendingBets(challenges);}
        });
        pickemAPI("getStreak",{params:{userId:user.id,groupId:g.id}}).then(r=>{if(r.ok)setStreak(r.streak||0);});
        pickemAPI("periodLeaderboard",{params:{groupId:g.id,period:"week"}}).then(r=>{if(r.ok){const me=(r.leaderboard||[]).find(x=>x.user_id===user.id);setWeeklyStats(me||null);}});
        if(localStorage.getItem(`courtiq_locked_${g.id}_${today}`)) setLockedPicks(true);
      } else setLoaded(true);
    });
    pickemAPI("dailyBonusStatus",{params:{userId:user.id}}).then(d=>{if(d.ok)setBonusClaimed(d.claimed);});
  },[user]);

  // Notificación de racha cuando sube
  useEffect(()=>{
    if(streak>prevStreakRef.current&&streak>=2){
      setResultBanner({show:true,correct:true,pts:0,streak,streakOnly:true});
    }
    prevStreakRef.current=streak;
  },[streak]);

  // Detect games going Final → show floating pts animation
  useEffect(()=>{
    games.forEach(g=>{
      const prev=prevStatusRef.current[g.id];
      if(prev&&prev!=="Final"&&g.status==="Final"&&picks[g.id]){
        const winner=g.homeScore>g.awayScore?g.home:g.away;
        const correct=picks[g.id]===winner;
        const conf=confidence[g.id]||1;
        const pct=calcWinPct(g,picks[g.id]===g.home?"home":"away",standings);
        const pts=dynPts(pct,conf);
        const key=Date.now()+g.id;
        setFloatingPts(prev=>({...prev,[g.id]:{pts,correct,key}}));
        setTimeout(()=>setFloatingPts(prev=>{const n={...prev};delete n[g.id];return n;}),1400);
        if(correct) triggerCelebration(pts,streak);
      }
      prevStatusRef.current[g.id]=g.status;
    });
  },[games.map(g=>g.status).join(",")]);

  const lockAllPicks=()=>{
    if(!group) return;
    const today=new Date().toISOString().split("T")[0];
    localStorage.setItem(`courtiq_locked_${group.id}_${today}`,"1");
    setLockedPicks(true);
    setExpandedCard(null);
  };

  const anyStarted=games.some(g=>g.status==="LIVE"||g.status==="Final");

  const makePick=async(gameId,team,home,away,g)=>{
    if(!group||!user)return;
    setPicks(p=>({...p,[gameId]:team}));
    const today=new Date().toISOString().split("T")[0];
    const conf=confidence[gameId]||1;
    const pickedSide=team===home?"home":"away";
    const wPct=g?.status==="Upcoming"?calcWinPct(g,pickedSide,standings):50;
    await pickemAPI("makePick",{body:{userId:user.id,groupId:group.id,gameId,gameDate:today,pickedTeam:team,homeTeam:home,awayTeam:away,confidence:conf,winPct:wPct}});
  };

  const claimBonus=async()=>{
    const d=await pickemAPI("claimDailyBonus",{body:{userId:user.id}});
    if(d.ok){setBonusClaimed(true);setBonusMsg(`🎁 +${d.bonus} 🪙 bonus diario reclamado!`);}
    else setBonusMsg(d.error||"Error");
    setTimeout(()=>setBonusMsg(""),4000);
  };

  const shareResult=()=>{
    const finishedWithPick=games.filter(g=>g.status==="Final"&&picks[g.id]);
    if(!finishedWithPick.length) return;
    const W=1080,H=finishedWithPick.length*160+340;
    const cv=document.createElement("canvas");cv.width=W;cv.height=H;
    const ctx=cv.getContext("2d");
    // bg
    const bg=ctx.createLinearGradient(0,0,W,H);bg.addColorStop(0,"#07090f");bg.addColorStop(1,"#0a1520");
    ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    // grid dots
    ctx.fillStyle="#ffffff08";
    for(let x=0;x<W;x+=50)for(let y=0;y<H;y+=50){ctx.beginPath();ctx.arc(x,y,1.5,0,Math.PI*2);ctx.fill();}
    // header glow
    const glow=ctx.createRadialGradient(W/2,100,0,W/2,100,300);glow.addColorStop(0,"#00C2FF18");glow.addColorStop(1,"transparent");
    ctx.fillStyle=glow;ctx.fillRect(0,0,W,200);
    // logo
    ctx.font="900 64px Arial Black,sans-serif";ctx.textAlign="center";ctx.fillStyle="#ffffff";
    ctx.fillText("COURT",W/2-80,90);
    const tg=ctx.createLinearGradient(W/2,0,W/2+160,0);tg.addColorStop(0,"#00C2FF");tg.addColorStop(1,"#0066ff");
    ctx.fillStyle=tg;ctx.fillText("IQ",W/2+110,90);
    // user + date
    ctx.fillStyle="#94a3b8";ctx.font="500 30px sans-serif";
    const today=new Date().toLocaleDateString("es-MX",{weekday:"long",month:"long",day:"numeric"});
    ctx.fillText(`${user?.name||""} · ${today}`,W/2,140);
    // divider
    const dg=ctx.createLinearGradient(60,0,W-60,0);dg.addColorStop(0,"transparent");dg.addColorStop(.5,"#00C2FF44");dg.addColorStop(1,"transparent");
    ctx.fillStyle=dg;ctx.fillRect(60,160,W-120,1);
    // picks
    let correct=0,totalPts=0;
    finishedWithPick.forEach((g,i)=>{
      const y=200+i*160;const winner=g.homeScore>g.awayScore?g.home:g.away;const ok=picks[g.id]===winner;
      const conf=confidence[g.id]||1;const pct=picks[g.id]===g.home?calcWinPct(g,"home",standings):calcWinPct(g,"away",standings);
      const pts=picksPoints[g.id]??dynPts(pct,conf);if(ok){correct++;totalPts+=pts;}
      // card bg
      const cardBg=ctx.createLinearGradient(60,y,W-60,y+130);
      cardBg.addColorStop(0,ok?"#00FF9D0a":"#ff44440a");cardBg.addColorStop(1,"#0d1117");
      ctx.fillStyle=cardBg;ctx.beginPath();ctx.roundRect(60,y,W-120,130,16);ctx.fill();
      ctx.strokeStyle=ok?"#00FF9D44":"#ff444444";ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(60,y,W-120,130,16);ctx.stroke();
      // teams
      ctx.fillStyle="#e0eaf5";ctx.font="700 36px sans-serif";ctx.textAlign="left";
      ctx.fillText(`${g.away} vs ${g.home}`,100,y+50);
      ctx.fillStyle="#64748b";ctx.font="400 26px sans-serif";
      ctx.fillText(`${g.awayScore} – ${g.homeScore}`,100,y+90);
      // pick badge
      const bdg=ok?"#00FF9D":"#ff6666";
      ctx.fillStyle=bdg+"22";ctx.beginPath();ctx.roundRect(W-280,y+20,180,52,26);ctx.fill();
      ctx.fillStyle=bdg;ctx.font="700 24px sans-serif";ctx.textAlign="center";
      ctx.fillText(ok?`✓ +${pts} pts`:`✗ ${picks[g.id]}`,W-190,y+52);
      ctx.textAlign="left";
    });
    // summary bar
    const sy=200+finishedWithPick.length*160+10;
    const sbg=ctx.createLinearGradient(60,sy,W-60,sy+90);sbg.addColorStop(0,"#00C2FF15");sbg.addColorStop(1,"#0066ff15");
    ctx.fillStyle=sbg;ctx.beginPath();ctx.roundRect(60,sy,W-120,90,16);ctx.fill();
    ctx.strokeStyle="#00C2FF33";ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(60,sy,W-120,90,16);ctx.stroke();
    ctx.fillStyle="#ffffff";ctx.font="900 38px Arial Black,sans-serif";ctx.textAlign="center";
    ctx.fillText(`${correct}/${finishedWithPick.length} correctos · +${totalPts} pts`,W/2,sy+58);
    // footer
    ctx.fillStyle="#334155";ctx.font="400 24px sans-serif";ctx.textAlign="center";
    ctx.fillText("appbasket.vercel.app",W/2,H-24);
    // share
    cv.toBlob(blob=>{
      if(!blob) return;
      const file=new File([blob],"court-iq-resultado.png",{type:"image/png"});
      if(navigator.canShare?.({files:[file]})){navigator.share({title:"Mis picks de hoy — Court IQ 🏀",files:[file]}).catch(()=>{});}
      else{const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="court-iq-resultado.png";a.click();}
    },"image/png");
  };


  return(<div className="fade-up">
    <Confetti active={showConfetti}/>
    <ResultBanner {...resultBanner} onClose={()=>setResultBanner(b=>({...b,show:false}))}/>
    {!user&&<Card style={{marginBottom:22,background:"linear-gradient(135deg,#00C2FF11,#0d1117)",borderColor:"#00C2FF44",textAlign:"center",padding:"30px 20px"}}>
      <div style={{fontSize:44,marginBottom:10}}>🏀🔥</div>
      <div style={{fontSize:22,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.text,marginBottom:6}}>¡QUÉ SOBRES!</div>
      <div style={{fontSize:13,color:C.dim,marginBottom:4}}>Regístrate para predecir ganadores y competir contra tus amigos</div>
      <div style={{fontSize:11,color:C.muted,marginBottom:16}}>Elige quién gana cada partido · Gana puntos · Sube en el ranking</div>
      <button className="btn" onClick={goToGroup} style={{padding:"14px 36px",borderRadius:12,background:"linear-gradient(135deg,#00C2FF,#0066ff)",color:"#07090f",fontSize:15,fontWeight:900,letterSpacing:1}}>ENTRAR AL PICK'EM 🎯</button>
    </Card>}
    {user&&<div onClick={group?goToGroup:undefined} style={{cursor:group?"pointer":"default",marginBottom:pendingBets.length?10:22}}>
      <Card style={{background:"linear-gradient(135deg,#00FF9D08,#0d1117)",borderColor:group?"#00FF9D55":"#FFB80044",padding:"14px 18px",transition:"border-color .2s"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
              <div style={{fontSize:10,color:"#00FF9D",fontWeight:700,letterSpacing:2}}>PICK'EM ACTIVO</div>
              {streak>=3&&<div style={{fontSize:10,fontWeight:900,color:"#FF6B35",background:"#FF6B3520",border:"1px solid #FF6B3544",borderRadius:20,padding:"1px 8px"}}>🔥 {streak} en racha</div>}
              {streak>=1&&streak<3&&<div style={{fontSize:10,fontWeight:700,color:"#FFB800",background:"#FFB80015",border:"1px solid #FFB80033",borderRadius:20,padding:"1px 8px"}}>⚡ {streak} correcto{streak!==1?"s":""}</div>}
            </div>
            <div style={{fontSize:15,fontWeight:700,color:C.text}}>👋 {user.name} — Toca un equipo para elegir ganador</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
            {lockedPicks&&<Tag c="#FF6B35">🔒 Picks cerrados</Tag>}
            {group?<Tag c="#00FF9D">👥 {group.name} →</Tag>:<Tag c="#FFB800">Ve a Grupos para crear uno</Tag>}
          </div>
        </div>
      </Card>
    </div>}
    {user&&bonusClaimed===false&&<div style={{marginBottom:14,padding:"10px 16px",background:"linear-gradient(135deg,#FFB80018,#0d1117)",border:"1px solid #FFB80055",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:22}}>🎁</span>
        <div><div style={{fontSize:12,fontWeight:800,color:"#FFB800"}}>Bonus diario disponible</div><div style={{fontSize:10,color:C.dim}}>+25 🪙 gratis — entra cada día para más</div></div>
      </div>
      <button className="btn" onClick={claimBonus} style={{padding:"8px 16px",borderRadius:10,background:"linear-gradient(135deg,#FFB800,#ff9500)",color:"#07090f",fontSize:12,fontWeight:900,flexShrink:0}}>Reclamar</button>
    </div>}
    {bonusMsg&&<div style={{marginBottom:10,padding:"8px 14px",background:"#00FF9D11",border:"1px solid #00FF9D44",borderRadius:10,fontSize:12,color:"#00FF9D"}}>{bonusMsg}</div>}
    {user&&group&&weeklyStats&&weeklyStats.total>0&&<div style={{marginBottom:14,padding:"12px 16px",background:"linear-gradient(135deg,#0055ff11,#0d1117)",border:"1px solid #0055ff33",borderRadius:12,display:"flex",alignItems:"center",gap:12}}>
      <div style={{fontSize:26,lineHeight:1}}>📊</div>
      <div style={{flex:1}}>
        <div style={{fontSize:10,color:C.accent,fontWeight:700,letterSpacing:1.5,marginBottom:3}}>ESTA SEMANA</div>
        <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:13,fontWeight:800,color:C.text}}>{weeklyStats.correct}/{weeklyStats.total} ✅</span>
          <span style={{fontSize:12,color:"#FFB800",fontWeight:700}}>+{weeklyStats.points} pts</span>
          <span style={{fontSize:11,color:C.dim}}>{weeklyStats.accuracy}% precisión</span>
          {weeklyStats.rank<=3&&<Tag c="#FFB800">#{weeklyStats.rank} en el grupo</Tag>}
        </div>
      </div>
      <button className="btn" onClick={goToGroup} style={{padding:"6px 12px",borderRadius:8,background:"#0055ff22",border:"1px solid #0055ff44",color:C.accent,fontSize:11,fontWeight:700,flexShrink:0}}>Ver →</button>
    </div>}
    {user&&pendingBets.length>0&&<div style={{marginBottom:22}}>
      {pendingBets.map(b=><div key={b.id} onClick={goToBets} style={{cursor:"pointer",padding:"10px 14px",background:"linear-gradient(135deg,#FFB80012,#0d1117)",border:"1px solid #FFB80055",borderRadius:10,marginBottom:6,display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:16}}>⚡</span>
        <div style={{flex:1}}><span style={{fontSize:12,fontWeight:700,color:"#FFB800"}}>Reto de apuesta</span><span style={{fontSize:11,color:C.dim}}> · {b.away_team} vs {b.home_team} · 🪙{b.amount}</span></div>
        <span style={{fontSize:10,color:"#FFB800",fontWeight:700}}>Ver →</span>
      </div>)}
    </div>}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}><ST sub="NBA 2025-26 · Hoy">Partidos del Día</ST><LiveBadge live={live.games}/></div>
    {user&&group&&anyStarted&&<div style={{marginBottom:12,padding:"10px 14px",background:"#ff444411",border:"1px solid #ff444433",borderRadius:10,fontSize:11,color:"#ff6666",display:"flex",alignItems:"center",gap:8}}>🔒 Un partido ya empezó — picks cerrados para hoy</div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10,marginBottom:28}}>
      {games.length===0?<div style={{color:C.muted,fontSize:13}}>No hay partidos programados.</div>
      :games.map(g=>{
        const picked=picks[g.id];const isFinal=g.status==="Final";const isLive=g.status==="LIVE";
        const isUpcoming=g.startTime?new Date()<new Date(g.startTime):g.status==="Upcoming";
        const winner=isFinal?(g.homeScore>g.awayScore?g.home:g.away):null;
        const correct=isFinal&&picked===winner;
        const minsLeft=g.startTime&&isUpcoming?Math.max(0,Math.round((new Date(g.startTime)-new Date())/60000)):null;
        const showGrpSection=lockedPicks&&expandedCard===g.id;
        const gp=grpPicks.filter(p=>p.game_id===g.id);
        const forAway=gp.filter(p=>p.picked_team===g.away);
        const forHome=gp.filter(p=>p.picked_team===g.home);
        const canPick=user&&group&&isUpcoming&&!lockedPicks&&!anyStarted;
        const conf=confidence[g.id]||1;
        const awayPct=calcWinPct(g,"away",standings);const homePct=calcWinPct(g,"home",standings);
        const pickedPct=picked?(picked===g.home?homePct:awayPct):50;
        const fp=floatingPts[g.id];
        return <Card key={g.id} style={{padding:16,position:"relative",borderColor:isFinal&&picked?(correct?"#00FF9D55":"#ff444455"):isLive&&picked?`${tm(picked).color}55`:picked?`${tm(picked).color}44`:C.border,borderWidth:picked?2:1}}>
        {fp&&<FloatPts key={fp.key} pts={fp.pts} correct={fp.correct}/>}

        {/* Header: estado + tu pick */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {isLive?<Tag c="#ff4444">● EN VIVO {g.detail}</Tag>:isFinal?<Tag c={C.muted}>Terminado</Tag>
            :minsLeft!==null?(minsLeft<=1?<Tag c="#ff4444">⏱ Iniciando...</Tag>:minsLeft<=60?<Tag c={minsLeft<=15?"#ff6666":"#FF6B35"}>⏱ {minsLeft} min</Tag>:<Tag c={C.accent}>{g.detail||"Hoy"}</Tag>)
            :<Tag c={C.accent}>{g.detail||"Hoy"}</Tag>}
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {isFinal&&picked&&(()=>{const ap=picksPoints[g.id];const c2=conf;return<Tag c={correct?"#00FF9D":"#ff4444"}>{correct?`✅ +${ap??dynPts(pickedPct,c2)} pts`:(c2>=2?`❌ ${ap??-dynPts(pickedPct,c2)} pts`:"❌ 0 pts")}</Tag>;})()}
            {isLive&&picked&&<Tag c={tm(picked).color}>● {picked}</Tag>}
            {!isFinal&&!isLive&&picked&&!lockedPicks&&<Tag c="#00FF9D">✓ {picked} · +{dynPts(pickedPct,conf)} pts</Tag>}
            {lockedPicks&&picked&&!isFinal&&<Tag c="#FF6B35">🔒 {picked}</Tag>}
          </div>
        </div>

        {/* Vista del juego — siempre visible */}
        <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:10,alignItems:"center"}}>
          {[["away",g.away,g.awayScore,awayPct],["vs"],["home",g.home,g.homeScore,homePct]].map((item,idx)=>
            idx===1
              ?<div key="vs" style={{textAlign:"center",fontSize:14,color:C.muted,fontWeight:900}}>VS</div>
              :canPick
                ?<button key={item[1]} className="btn" onClick={()=>makePick(g.id,item[1],g.home,g.away,g)} style={{padding:"14px 8px",borderRadius:14,textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:5,background:picked===item[1]?`${tm(item[1]).color}22`:"#0a1018",border:`2.5px solid ${picked===item[1]?tm(item[1]).color:C.border}`,color:picked===item[1]?tm(item[1]).color:C.text,width:"100%",position:"relative"}}>
                    {picked===item[1]&&<div style={{position:"absolute",top:6,right:6,width:18,height:18,borderRadius:"50%",background:tm(item[1]).color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#07090f",fontWeight:900}}>✓</div>}
                    {logo(item[1],44)}
                    <span style={{fontSize:15,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif"}}>{item[1]}</span>
                    <span style={{fontSize:10,color:picked===item[1]?tm(item[1]).color:C.dim}}>{tm(item[1]).name}</span>
                    <span style={{fontSize:10,fontWeight:700,color:picked===item[1]?tm(item[1]).color:"#FFB800",background:picked===item[1]?"transparent":"#FFB80015",borderRadius:8,padding:"1px 6px",marginTop:2}}>+{dynBase(item[3]??50)} pts</span>
                  </button>
                :<div key={item[1]} style={{textAlign:"center",padding:"12px 8px",opacity:picked&&picked!==item[1]?0.35:1}}>
                    {logo(item[1],44)}
                    <div style={{fontSize:15,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:picked===item[1]?tm(item[1]).color:C.text,marginTop:5}}>{item[1]}</div>
                    {(isFinal||isLive)&&<div style={{fontSize:28,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:isFinal&&item[1]===winner?"#00FF9D":isLive&&picked===item[1]?tm(item[1]).color:C.text,marginTop:4}}>{item[2]}</div>}
                  </div>
          )}
        </div>

        {/* Confidence multiplier — visible al hacer pick */}
        {canPick&&picked&&<div style={{marginTop:10,display:"flex",alignItems:"center",gap:6,justifyContent:"center"}}>
          <span style={{fontSize:10,color:C.muted}}>Confianza:</span>
          {[1,2,3].map(c=>{const pts=dynPts(pickedPct,c);const labels={1:`✅ +${pts}`,2:`🔥 ±${pts}`,3:`⚡ ±${pts}`};const descs={1:"seguro",2:"riesgo",3:"alto riesgo"};return<button key={c} className="btn" onClick={()=>{setConfidence(cf=>({...cf,[g.id]:c}));pickemAPI("makePick",{body:{userId:user.id,groupId:group.id,gameId:g.id,gameDate:new Date().toISOString().split("T")[0],pickedTeam:picked,homeTeam:g.home,awayTeam:g.away,confidence:c,winPct:pickedPct}});}} style={{padding:"5px 10px",borderRadius:8,background:conf===c?(c===1?`#00FF9D22`:c===2?`#FF6B3522`:`#ff444422`):"#0a1018",border:`1px solid ${conf===c?(c===1?"#00FF9D44":c===2?"#FF6B3544":"#ff444444"):C.border}`,color:conf===c?(c===1?"#00FF9D":c===2?"#FF6B35":"#ff4444"):C.muted,fontSize:10,fontWeight:700,display:"flex",flexDirection:"column",alignItems:"center",gap:1}}><span>{labels[c]}</span><span style={{fontSize:8,opacity:.7}}>{descs[c]}</span></button>;})}
        </div>}

        {/* Consenso del grupo — visible siempre cuando hay picks */}
        {group&&!canPick&&gp.length>0&&<div style={{marginTop:10,padding:"8px 12px",background:"#0a1018",borderRadius:8,border:`1px solid ${C.border}`}}>
          <div style={{display:"flex",height:6,borderRadius:3,overflow:"hidden",marginBottom:6}}>
            <div style={{flex:forAway.length||0.01,background:tm(g.away).color}}/><div style={{flex:forHome.length||0.01,background:tm(g.home).color}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,fontWeight:700}}>
            <span style={{color:tm(g.away).color}}>{logo(g.away,12)} {gp.length?Math.round(forAway.length/gp.length*100):0}%</span>
            <span style={{color:C.muted,fontSize:9}}>{gp.length} picks del grupo</span>
            <span style={{color:tm(g.home).color}}>{gp.length?Math.round(forHome.length/gp.length*100):0}% {logo(g.home,12)}</span>
          </div>
        </div>}

        {/* Picks del grupo — solo disponible tras cerrar picks */}
        {lockedPicks&&group&&<button className="btn" onClick={()=>setExpandedCard(showGrpSection?null:g.id)} style={{width:"100%",marginTop:8,padding:"8px",borderRadius:10,background:showGrpSection?`${C.accent}11`:"#0a1018",border:`1px solid ${showGrpSection?C.accent+"55":C.border}`,color:showGrpSection?C.accent:C.muted,fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          {showGrpSection?"▲ Ocultar":"👥 Ver quién eligió qué"}
        </button>}

        {showGrpSection&&<div style={{marginTop:10,padding:"12px",background:"#0a1018",borderRadius:10,border:`1px solid ${C.border}`}}>
          {gp.length===0
            ?<div style={{textAlign:"center",padding:"10px 0",color:C.muted,fontSize:12}}>Nadie en el grupo hizo pick aún</div>
            :<>
              <div style={{display:"flex",height:10,borderRadius:5,overflow:"hidden",marginBottom:8}}>
                <div style={{flex:forAway.length||0.01,background:tm(g.away).color}}/><div style={{flex:forHome.length||0.01,background:tm(g.home).color}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,fontWeight:700,marginBottom:10}}>
                <span style={{color:tm(g.away).color,display:"flex",alignItems:"center",gap:4}}>{logo(g.away,14)} {g.away} {gp.length?Math.round(forAway.length/gp.length*100):0}%</span>
                <span style={{color:tm(g.home).color,display:"flex",alignItems:"center",gap:4}}>{gp.length?Math.round(forHome.length/gp.length*100):0}% {g.home} {logo(g.home,14)}</span>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {gp.map((p,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:5,background:`${tm(p.picked_team).color}20`,border:`1.5px solid ${tm(p.picked_team).color}55`,borderRadius:22,padding:"4px 10px"}}>
                  <span style={{fontSize:13}}>{p.users?.avatar_emoji||"🏀"}</span>
                  <span style={{fontSize:11,color:C.text,fontWeight:700}}>{p.users?.name||"?"}</span>
                  {logo(p.picked_team,14)}
                </div>)}
              </div>
            </>}
        </div>}

        {/* Barra de probabilidad */}
        <div style={{display:"flex",alignItems:"center",gap:6,marginTop:10,fontSize:10}}>
          <span style={{color:tm(g.away).color,fontWeight:700,minWidth:34}}>{awayPct}%</span>
          <div style={{flex:1,height:5,borderRadius:3,background:C.border,overflow:"hidden"}}>
            <div style={{width:`${awayPct}%`,height:"100%",background:`linear-gradient(90deg,${tm(g.away).color},${tm(g.home).color})`,transition:"width .6s ease"}}/>
          </div>
          <span style={{color:tm(g.home).color,fontWeight:700,minWidth:34,textAlign:"right"}}>{homePct}%</span>
          <button className="btn" onClick={()=>setShowPctInfo(true)} style={{width:32,height:32,borderRadius:"50%",background:"#0a1018",border:`1px solid ${C.border}`,color:C.muted,fontSize:11,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,touchAction:"manipulation"}}>i</button>
        </div>
        {isLive&&<div style={{fontSize:9,color:"#ff4444",textAlign:"center",marginTop:4}}>● En vivo · basado en marcador</div>}
        {!isLive&&!isFinal&&<div style={{fontSize:9,color:C.muted,textAlign:"center",marginTop:4}}>% estimado de ganar este partido</div>}
        {/* Picks públicos — visible cuando hay picks del grupo */}
        {gp.length>0&&!showGrpSection&&<div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${C.border}`}}>
          <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>Tu grupo eligió</div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <div style={{flex:1,height:6,borderRadius:3,overflow:"hidden",background:C.border,display:"flex"}}>
              <div style={{flex:forAway.length||0.01,background:tm(g.away).color,transition:"flex .5s ease"}}/>
              <div style={{flex:forHome.length||0.01,background:tm(g.home).color,transition:"flex .5s ease"}}/>
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:11,fontWeight:700}}>
            <span style={{color:tm(g.away).color}}>{g.away} {gp.length?Math.round(forAway.length/gp.length*100):0}%</span>
            <span style={{color:C.muted,fontSize:10}}>{gp.length} pick{gp.length!==1?"s":""}</span>
            <span style={{color:tm(g.home).color}}>{gp.length?Math.round(forHome.length/gp.length*100):0}% {g.home}</span>
          </div>
        </div>}
      </Card>;})}
    </div>

    {/* Modal info % */}
    {showPctInfo&&<div onClick={()=>setShowPctInfo(false)} style={{position:"fixed",inset:0,background:"#00000088",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:24,maxWidth:320,width:"100%"}}>
        <div style={{fontSize:16,fontWeight:800,color:C.text,marginBottom:14}}>ℹ️ ¿Qué significan los porcentajes?</div>
        <div style={{fontSize:13,color:C.dim,lineHeight:1.7,marginBottom:10}}>
          <b style={{color:C.accent}}>Partidos próximos:</b> calculamos qué tan probable es que gane cada equipo, usando sus victorias y derrotas en la temporada. El equipo local tiene una pequeña ventaja extra (+3%).
        </div>
        <div style={{fontSize:13,color:C.dim,lineHeight:1.7,marginBottom:10}}>
          <b style={{color:"#ff4444"}}>En vivo:</b> cambia en tiempo real según la diferencia de puntos en el marcador.
        </div>
        <div style={{fontSize:13,color:C.dim,lineHeight:1.7,marginBottom:18}}>
          <b style={{color:C.muted}}>Ejemplo:</b> si el marcador va 10-5, el equipo que va ganando tiene más % de ganar.
        </div>
        <button className="btn" onClick={()=>setShowPctInfo(false)} style={{width:"100%",padding:"12px",borderRadius:12,background:C.accent,color:"#07090f",fontWeight:800,fontSize:14}}>Entendido ✓</button>
      </div>
    </div>}

    {/* Botón global de cerrar picks */}
    {user&&group&&!lockedPicks&&Object.keys(picks).length>0&&<>
      <div style={{background:"linear-gradient(135deg,#FF6B3511,#0d1117)",border:"1px solid #FF6B3533",borderRadius:14,padding:"16px 18px",marginBottom:10}}>
        <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:4}}>🔒 ¿Listo con tus picks de hoy?</div>
        <div style={{fontSize:11,color:C.dim,marginBottom:12}}>Al cerrar tus picks, podrás ver qué eligieron los demás en tu grupo. <b>Ya no podrás cambiarlos.</b></div>
        <button className="btn" onClick={lockAllPicks} style={{width:"100%",padding:"13px",borderRadius:12,background:"linear-gradient(135deg,#FF6B35,#ff9500)",color:"#07090f",fontWeight:900,fontSize:14,letterSpacing:.5}}>🔒 Cerrar mis picks y ver los del grupo</button>
      </div>
    </>}
    {user&&games.some(g=>g.status==="Final"&&picks[g.id])&&
      <button className="btn" onClick={shareResult} style={{width:"100%",padding:"14px",borderRadius:14,background:"linear-gradient(135deg,#a855f7,#7c3aed)",color:"#ffffff",fontWeight:900,fontSize:15,marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
        📤 Compartir mis resultados
      </button>
    }
  </div>);
};

/* ═══ OVER/UNDER TAB ═══ */
const OUTab=({games,userCtx})=>{
  const {user}=userCtx||{};
  const [picks,setPicks]=useState({}); // {gameId: "over"|"under"}
  const [saved,setSaved]=useState({});
  const [loading,setLoading]=useState({});
  const [msg,setMsg]=useState("");
  const [lines,setLines]=useState({}); // {gameId: number}

  // Load today's OU picks and generate lines
  useEffect(()=>{
    if(!user)return;
    const savedPicks=JSON.parse(localStorage.getItem(`courtiq_ou_${user.id}_${new Date().toISOString().split("T")[0]}`)||"{}");
    setPicks(savedPicks);setSaved(savedPicks);
    // Generate stable O/U lines from game ids (deterministic seed)
    const newLines={};
    games.filter(g=>g.status==="Upcoming"||g.status==="LIVE"||g.status==="Final").forEach(g=>{
      // Line between 210–230 based on a hash of the game id
      const seed=g.id.split("").reduce((a,c)=>a+c.charCodeAt(0),0);
      newLines[g.id]=210+((seed%21));
    });
    setLines(newLines);
  },[user,games]);

  const makePick=async(game,choice)=>{
    if(!user){setMsg("Inicia sesión primero");return;}
    const today=new Date().toISOString().split("T")[0];
    if(game.status!=="Upcoming"){setMsg("Solo puedes hacer picks en partidos próximos");return;}
    const next={...picks,[game.id]:choice};
    setPicks(next);
    setLoading(l=>({...l,[game.id]:true}));
    localStorage.setItem(`courtiq_ou_${user.id}_${today}`,JSON.stringify(next));
    // Score immediately if game is final
    await pickemAPI("makeOUPick",{body:{userId:user.id,gameId:game.id,gameDate:today,choice,line:lines[game.id]}});
    setSaved(next);
    setLoading(l=>({...l,[game.id]:false}));
  };

  const getResult=(game,choice)=>{
    if(game.status!=="Final"||game.awayScore==null||game.homeScore==null)return null;
    const total=(parseInt(game.awayScore)||0)+(parseInt(game.homeScore)||0);
    const line=lines[game.id]||220;
    const actual=total>line?"over":"under";
    return choice===actual?"correct":"wrong";
  };

  const upcoming=games.filter(g=>g.status==="Upcoming");
  const finished=games.filter(g=>g.status==="Final"&&picks[g.id]);

  return(<div className="fade-up">
    <ST sub="Predice el total de puntos">Over / Under 🎰</ST>

    {!user&&<Card style={{textAlign:"center",padding:40}}>
      <div style={{fontSize:48,marginBottom:12}}>🎰</div>
      <div style={{fontSize:15,fontWeight:700,color:C.text}}>Inicia sesión para hacer picks O/U</div>
    </Card>}

    {user&&<>
      {msg&&<div style={{marginBottom:12,padding:"10px 14px",background:"#ff444411",border:"1px solid #ff444433",borderRadius:10,fontSize:12,color:"#ff6666"}}>{msg}</div>}

      {/* Cómo funciona */}
      <Card style={{marginBottom:14,background:"#0a1018",borderColor:C.border}}>
        <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>Cómo funciona</div>
        <div style={{fontSize:11,color:C.dim,lineHeight:1.7}}>
          Cada partido tiene una línea de puntos totales (ej: 218.5). Predice si el total final será <b style={{color:"#00FF9D"}}>OVER</b> (más puntos) o <b style={{color:"#FF6B35"}}>UNDER</b> (menos puntos). +5 pts si aciertas 🎯
        </div>
      </Card>

      {/* Partidos próximos */}
      {upcoming.length>0&&<>
        <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>Partidos de hoy</div>
        {upcoming.map(game=>{
          const picked=picks[game.id];
          const line=lines[game.id]||220;
          const isLoading=loading[game.id];
          return<Card key={game.id} style={{marginBottom:10,borderColor:picked?`${C.accent}44`:C.border}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                {logo(game.away,22)}<span style={{fontSize:13,fontWeight:800,color:C.text}}>{game.away}</span>
                <span style={{fontSize:11,color:C.muted}}>vs</span>
                <span style={{fontSize:13,fontWeight:800,color:C.text}}>{game.home}</span>{logo(game.home,22)}
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:1}}>Línea</div>
                <div style={{fontSize:20,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#FFB800"}}>{line}</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <button className="btn" onClick={()=>makePick(game,"over")} disabled={isLoading} style={{padding:"12px",borderRadius:12,background:picked==="over"?"#00FF9D22":"#0d1117",border:`2px solid ${picked==="over"?"#00FF9D":C.border}`,color:picked==="over"?"#00FF9D":C.muted,fontWeight:900,fontSize:13}}>
                📈 OVER {line}
              </button>
              <button className="btn" onClick={()=>makePick(game,"under")} disabled={isLoading} style={{padding:"12px",borderRadius:12,background:picked==="under"?"#FF6B3522":"#0d1117",border:`2px solid ${picked==="under"?"#FF6B35":C.border}`,color:picked==="under"?"#FF6B35":C.muted,fontWeight:900,fontSize:13}}>
                📉 UNDER {line}
              </button>
            </div>
            {picked&&<div style={{textAlign:"center",fontSize:10,color:C.dim,marginTop:8}}>
              {isLoading?<Spin s={10}/>:<span>Pick guardado · {picked==="over"?"Predices más de":"Predices menos de"} {line} pts</span>}
            </div>}
          </Card>;
        })}
      </>}

      {upcoming.length===0&&<Card style={{textAlign:"center",padding:30}}><div style={{fontSize:32,marginBottom:8}}>🏀</div><div style={{fontSize:14,color:C.dim}}>No hay partidos próximos hoy</div></Card>}

      {/* Resultados */}
      {finished.length>0&&<>
        <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginTop:16,marginBottom:10}}>Tus resultados</div>
        {finished.map(game=>{
          const picked=picks[game.id];
          const result=getResult(game,picked);
          const total=(parseInt(game.awayScore)||0)+(parseInt(game.homeScore)||0);
          const line=lines[game.id]||220;
          return<Card key={game.id} style={{marginBottom:8,borderColor:result==="correct"?"#00FF9D44":result==="wrong"?"#ff444444":C.border,background:result==="correct"?"#00FF9D08":result==="wrong"?"#ff444408":undefined}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:6}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                {logo(game.away,18)}<span style={{fontSize:12,fontWeight:700,color:C.text}}>{game.away}</span>
                <span style={{fontSize:11,color:"#FFB800",fontWeight:900}}>{game.awayScore}–{game.homeScore}</span>
                <span style={{fontSize:12,fontWeight:700,color:C.text}}>{game.home}</span>{logo(game.home,18)}
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontSize:11,color:C.dim}}>Total: <b style={{color:total>line?"#00FF9D":"#FF6B35"}}>{total}</b> / línea {line}</span>
                <span style={{fontSize:13,fontWeight:900,color:result==="correct"?"#00FF9D":"#ff6666"}}>{result==="correct"?"✅ +5 pts":"❌"}</span>
              </div>
            </div>
          </Card>;
        })}
      </>}
    </>}
  </div>);
};

/* ═══ ESPN TEAM IDs ═══ */
const ESPN_ID={ATL:1,BOS:2,NOP:3,CHI:4,CLE:5,DAL:6,DEN:7,DET:8,GSW:9,HOU:10,IND:11,LAC:12,LAL:13,MIA:14,MIL:15,MIN:16,BKN:17,NYK:18,ORL:19,PHI:20,PHX:21,POR:22,SAC:23,SAS:24,OKC:25,UTA:26,WAS:27,TOR:28,MEM:29,CHA:30};

/* ═══ TEAMS TAB ═══ */
const TeamsTab=({standings,live})=>{
  const [conf,setConf]=useState("ALL");
  const [sel,setSel]=useState(standings.find(t=>t.abbr==="DET")||standings[0]);
  const [gridOpen,setGridOpen]=useState(true);
  const [liveRoster,setLiveRoster]=useState(null);
  const [rosterLoading,setRosterLoading]=useState(false);
  const visible=standings.filter(t=>conf==="ALL"||t.conf===conf).sort((a,b)=>b.w-a.w);

  useEffect(()=>{if(sel) loadLiveRoster(sel.abbr);},[]);
  const east=standings.filter(t=>t.conf==="E").sort((a,b)=>b.w-a.w);
  const west=standings.filter(t=>t.conf==="W").sort((a,b)=>b.w-a.w);

  const loadLiveRoster=async(abbr)=>{
    const id=ESPN_ID[abbr];
    if(!id) return;
    setRosterLoading(true);setLiveRoster(null);
    try{
      const r=await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${id}/roster`,{signal:AbortSignal.timeout(5000)});
      if(!r.ok) throw new Error();
      const d=await r.json();
      const players=(d.athletes||[]).flatMap(g=>g.items||[g]).map(a=>`${a.firstName} ${a.lastName}`).filter(Boolean);
      if(players.length>0) setLiveRoster(players);
    }catch(_){}
    setRosterLoading(false);
  };

  const pickTeam=(t)=>{setSel(t);setGridOpen(false);loadLiveRoster(t.abbr);};

  return(<div className="fade-up">
    <ST sub="NBA 2025-26">30 Equipos</ST>

    {/* Selector de equipo — colapsable */}
    {!gridOpen&&sel
      ?<Card style={{marginBottom:14,background:`linear-gradient(135deg,${sel.color}14,${C.card})`,borderColor:`${sel.color}55`,padding:"12px 16px"}}>
          <div style={{display:"flex",alignItems:"center",gap:12}}>
            {logo(sel.abbr,40)}
            <div style={{flex:1}}>
              <div style={{fontSize:18,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:sel.color}}>{sel.name}</div>
              <div style={{fontSize:11,color:C.muted}}>{sel.conf==="E"?"Este":"Oeste"} · {sel.w}–{sel.l}</div>
            </div>
            <button className="btn" onClick={()=>setGridOpen(true)} style={{padding:"8px 14px",borderRadius:10,background:"#0a1018",border:`1px solid ${C.border}`,color:C.accent,fontSize:12,fontWeight:700}}>✏️ Cambiar</button>
          </div>
        </Card>
      :<>
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          {[["Todos","ALL"],["Este","E"],["Oeste","W"]].map(([l,v])=><button key={v} className="btn" onClick={()=>setConf(v)} style={{padding:"7px 16px",borderRadius:20,background:conf===v?C.accent:"#0d1117",border:`1px solid ${conf===v?C.accent:C.border}`,color:conf===v?"#07090f":C.dim,fontWeight:700,fontSize:12}}>{l}</button>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(84px,1fr))",gap:7,marginBottom:sel?14:22}}>
          {visible.map(t=><button key={t.id} className="btn" onClick={()=>pickTeam(t)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"10px 6px",borderRadius:12,background:sel?.id===t.id?`${t.color}22`:"#0d1117",border:`2px solid ${sel?.id===t.id?t.color:C.border}`}}>
            {logo(t.abbr,30)}<span style={{fontSize:10,fontWeight:800,color:sel?.id===t.id?t.color:C.dim}}>{t.abbr}</span><span style={{fontSize:9,color:C.muted}}>{t.w}–{t.l}</span>
          </button>)}
        </div>
      </>}

    {/* Info del equipo seleccionado */}
    {sel&&<><Card style={{marginBottom:14,background:`linear-gradient(135deg,${sel.color}14,${C.card})`,borderColor:`${sel.color}44`}}>
      <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
        {logo(sel.abbr,56)}
        <div><div style={{fontSize:22,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:sel.color}}>{sel.name}</div><div style={{fontSize:11,color:C.muted}}>{sel.conf==="E"?"Este":"Oeste"} · {sel.div}</div></div>
        <div style={{marginLeft:"auto",display:"flex",gap:18,flexWrap:"wrap"}}>{[[sel.w,"V",C.text],[sel.l,"D","#ff6666"],[(sel.pct*100).toFixed(1)+"%","%","#00FF9D"]].map(([v,l,c])=><div key={l} style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:c}}>{v}</div><div style={{fontSize:9,color:C.muted}}>{l}</div></div>)}</div>
      </div></Card>
    <Card style={{marginBottom:28}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
        <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2}}>Roster 2025-26</div>
        {rosterLoading?<Spin s={12}/>:liveRoster?<span style={{fontSize:9,color:"#00FF9D"}}>🟢 Live</span>:<span style={{fontSize:9,color:C.muted}}>📦 Cache</span>}
      </div>
      {rosterLoading
        ?<div style={{textAlign:"center",padding:"20px 0",color:C.dim,fontSize:12}}>Cargando roster...</div>
        :<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>
          {(liveRoster||sel.players||[]).map((p,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0"}}>
            <span style={{fontSize:9,fontWeight:800,color:sel.color,width:16}}>{i+1}</span>
            <span style={{fontSize:12,fontWeight:600,color:C.text}}>{p}</span>
          </div>)}
        </div>
      }
    </Card>
    </>}

    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}><ST sub="2025-26">Clasificación</ST><LiveBadge live={live.standings}/></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14}}>
      {[["Este",east],["Oeste",west]].map(([label,teams])=><Card key={label}>
        <div style={{fontSize:11,fontWeight:700,color:C.dim,marginBottom:12}}>{label}</div>
        {teams.slice(0,10).map((t,i)=>{
          const isSelected=sel?.id===t.id;
          return<div key={t.id} onClick={()=>pickTeam(t)} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 6px",borderRadius:8,marginBottom:2,cursor:"pointer",background:isSelected?`${t.color}18`:"transparent",border:isSelected?`1px solid ${t.color}44`:"1px solid transparent",borderBottom:!isSelected&&i<9?`1px solid ${C.border}`:"none",transition:"background .15s"}}>
            <span style={{fontSize:10,width:16,color:i<6?"#FFB800":i<8?"#00C2FF":C.muted,fontWeight:800}}>{i+1}</span>
            {logo(t.abbr,22)}<span style={{flex:1,fontSize:12,fontWeight:isSelected?800:600,color:isSelected?t.color:C.text}}>{t.abbr}</span>
            <span style={{fontSize:11,color:C.dim,width:44}}>{t.w}–{t.l}</span>
            <Tag c={t.streak?.startsWith("W")?"#00FF9D":"#ff6666"}>{t.streak}</Tag>
          </div>;
        })}</Card>)}
    </div>
  </div>);
};

/* ═══ PLAYERS TAB (all players with pagination) ═══ */
const PlayersTab=({players,live})=>{
  const [sel,setSel]=useState(null);const [search,setSearch]=useState("");const [teamF,setTeamF]=useState("ALL");const [page,setPage]=useState(0);
  const PER_PAGE=40;
  const filtered=players.filter(p=>{const q=search.toLowerCase();return(p.name?.toLowerCase().includes(q)||p.teamAbbr?.toLowerCase().includes(q))&&(teamF==="ALL"||p.teamAbbr===teamF);});
  const pageCount=Math.ceil(filtered.length/PER_PAGE);
  const paged=filtered.slice(page*PER_PAGE,(page+1)*PER_PAGE);
  const teams=[...new Set(players.map(p=>p.teamAbbr).filter(Boolean))].sort();
  const color=sel?tm(sel.teamAbbr).color:C.accent;
  const radar=sel?[{s:"PTS",v:Math.min(99,Math.round(+sel.pts/38*95))},{s:"AST",v:Math.min(99,Math.round(+(sel.ast||0)/12*95))},{s:"REB",v:Math.min(99,Math.round(+(sel.reb||0)/15*95))},{s:"BLK",v:Math.min(99,Math.round(+(sel.blk||0)/4*95))},{s:"STL",v:Math.min(99,Math.round(+(sel.stl||0)/3*95))},{s:"FG%",v:Math.min(99,Math.round(+(sel.fgPct||45)/62*95))}]:[];
  return(<div className="fade-up">
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}><ST sub="2025-26">Top Anotadores</ST><LiveBadge live={live.players}/></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(195px,1fr))",gap:10,marginBottom:28}}>
      {players.slice(0,8).map(p=><Card key={p.id} style={{borderLeft:`3px solid ${p.color}`,padding:14}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          {logo(p.teamAbbr,28)}
          <div><div style={{fontSize:12,fontWeight:700,color:C.text,lineHeight:1.3}}>{p.name}</div><div style={{fontSize:10,color:C.muted}}>{p.teamAbbr} · {p.pos}</div></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5}}>
          {[["PTS",p.pts],["AST",p.ast],["REB",p.reb]].map(([l,v])=><div key={l} style={{textAlign:"center",background:"#0a1018",borderRadius:7,padding:"5px 2px"}}><div style={{fontSize:16,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.text}}>{v}</div><div style={{fontSize:8,color:C.muted,letterSpacing:1}}>{l}</div></div>)}
        </div></Card>)}
    </div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}><ST sub="NBA 2025-26">{filtered.length} Jugadores</ST><LiveBadge live={live.players}/></div>
    <Card style={{marginBottom:16,padding:"16px 18px",background:"linear-gradient(135deg,#0a1520,#0d1117)",borderColor:`${C.accent}33`}}>
      <div style={{position:"relative",marginBottom:12}}>
        <span style={{position:"absolute",left:16,top:"50%",transform:"translateY(-50%)",fontSize:20}}>🔍</span>
        <input value={search} onChange={e=>{setSearch(e.target.value);setPage(0);setSel(null);}} placeholder="Buscar jugador o equipo..." style={{width:"100%",background:C.card,border:`2px solid ${search?C.accent:C.border}`,borderRadius:14,padding:"14px 16px 14px 48px",color:C.text,fontSize:16,fontWeight:600,transition:"border .2s"}}/>
        {search&&<button className="btn" onClick={()=>{setSearch("");setPage(0);}} style={{position:"absolute",right:14,top:"50%",transform:"translateY(-50%)",background:"none",color:C.muted,fontSize:20,padding:0}}>✕</button>}
      </div>
      <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
        <button className="btn" onClick={()=>{setTeamF("ALL");setPage(0);}} style={{padding:"6px 14px",borderRadius:20,background:teamF==="ALL"?C.accent:"#0a1018",border:`1px solid ${teamF==="ALL"?C.accent:C.border}`,color:teamF==="ALL"?"#07090f":C.dim,fontWeight:700,fontSize:11}}>Todos</button>
        {teams.map(t=><button key={t} className="btn" onClick={()=>{setTeamF(teamF===t?"ALL":t);setPage(0);}} style={{padding:"4px 8px",borderRadius:20,background:teamF===t?`${tm(t).color}22`:"#0a1018",border:`1px solid ${teamF===t?tm(t).color:C.border}`,color:teamF===t?tm(t).color:C.dim,fontSize:10,fontWeight:700,display:"flex",alignItems:"center",gap:4}}>
          {logo(t,16)}{t}
        </button>)}
      </div>
    </Card>
    <Card style={{marginBottom:14,padding:10,overflow:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>{["#","","Jugador","Equipo","PTS","AST","REB","FG%"].map(h=><th key={h} style={{padding:"8px 6px",textAlign:"left",color:C.muted,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>{h}</th>)}</tr></thead>
        <tbody>{paged.map((p,i)=><tr key={p.id} onClick={()=>setSel(sel?.id===p.id?null:p)} style={{cursor:"pointer",borderBottom:`1px solid ${C.border}`,background:sel?.id===p.id?`${tm(p.teamAbbr).color}11`:"transparent"}}>
          <td style={{padding:"8px 6px",color:C.muted,fontSize:10}}>{page*PER_PAGE+i+1}</td>
          <td style={{padding:"4px 2px"}}>{logo(p.teamAbbr,20)}</td>
          <td style={{padding:"8px 6px",fontWeight:700,color:sel?.id===p.id?tm(p.teamAbbr).color:C.text}}>{p.name}</td>
          <td style={{padding:"8px 6px",color:C.dim}}>{p.teamAbbr}</td>
          <td style={{padding:"8px 6px",fontWeight:800,color:"#FFB800"}}>{p.pts}</td>
          <td style={{padding:"8px 6px",color:C.text}}>{p.ast}</td>
          <td style={{padding:"8px 6px",color:C.text}}>{p.reb}</td>
          <td style={{padding:"8px 6px",color:C.dim}}>{p.fgPct}%</td>
        </tr>)}</tbody>
      </table>
    </Card>
    {pageCount>1&&<div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:8,marginBottom:16}}>
      <button className="btn" disabled={page===0} onClick={()=>{setPage(p=>p-1);setSel(null);}} style={{width:44,height:44,borderRadius:"50%",background:page===0?"#0a1018":C.accent,border:`2px solid ${page===0?C.border:C.accent}`,color:page===0?C.muted:"#07090f",fontSize:18,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}>←</button>
      <div style={{display:"flex",gap:4}}>{Array.from({length:pageCount},(_,i)=><button key={i} className="btn" onClick={()=>{setPage(i);setSel(null);}} style={{width:i===page?36:28,height:28,borderRadius:14,background:i===page?C.accent:"#0a1018",border:`1px solid ${i===page?C.accent:C.border}`,color:i===page?"#07090f":C.dim,fontSize:11,fontWeight:i===page?900:500,display:"flex",alignItems:"center",justifyContent:"center"}}>{i+1}</button>)}</div>
      <button className="btn" disabled={page>=pageCount-1} onClick={()=>{setPage(p=>p+1);setSel(null);}} style={{width:44,height:44,borderRadius:"50%",background:page>=pageCount-1?"#0a1018":C.accent,border:`2px solid ${page>=pageCount-1?C.border:C.accent}`,color:page>=pageCount-1?C.muted:"#07090f",fontSize:18,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center"}}>→</button>
    </div>}
    {sel&&<Card style={{borderLeft:`4px solid ${color}`}}>
      <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap",marginBottom:14}}>
        {logo(sel.teamAbbr,48)}
        <div><div style={{fontSize:22,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color}}>{sel.name}</div><div style={{fontSize:11,color:C.muted}}>{tm(sel.teamAbbr).name} · {sel.pos}</div></div>
        <div style={{marginLeft:"auto",display:"flex",gap:10,flexWrap:"wrap"}}>{[["PTS",sel.pts],["AST",sel.ast],["REB",sel.reb],["BLK",sel.blk],["STL",sel.stl],["FG%",sel.fgPct],["3P%",sel.fg3Pct]].map(([l,v])=><div key={l} style={{textAlign:"center"}}><div style={{fontSize:20,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.text}}>{v||"—"}</div><div style={{fontSize:8,color:C.muted,letterSpacing:1}}>{l}</div></div>)}</div>
      </div>
      <ResponsiveContainer width="100%" height={200}><RadarChart data={radar}><PolarGrid stroke={C.border}/><PolarAngleAxis dataKey="s" tick={{fill:C.dim,fontSize:10}}/><PolarRadiusAxis domain={[0,100]} tick={false} axisLine={false}/><Radar dataKey="v" stroke={color} fill={color} fillOpacity={.2} strokeWidth={2}/></RadarChart></ResponsiveContainer>
    </Card>}
  </div>);
};

/* ═══ PICK'EM TAB v2 ═══ */
const VAPID_KEY="BKMJ55qDz8klBdhztjHMlXcXAWbF1FecmMqFzq2j6XbFotJUe_Cwdx-WMKERkQ51qv4X_DrFjsK1wP8LFpIjz_k";

const isIOS=()=>/iPad|iPhone|iPod/.test(navigator.userAgent)&&!window.MSStream;
const isStandalone=()=>window.matchMedia("(display-mode: standalone)").matches||window.navigator.standalone===true;

async function autoSubscribePush(userId){
  if(!("Notification" in window)) throw new Error("Tu navegador no soporta notificaciones");
  if(!("serviceWorker" in navigator)) throw new Error("Tu navegador no soporta service workers");
  if(isIOS()&&!isStandalone()) throw new Error("iOS_NOT_INSTALLED");
  const perm=await Notification.requestPermission();
  if(perm==="denied") throw new Error("Bloqueaste las notificaciones en este navegador. Debes habilitarlas en Configuración del teléfono.");
  if(perm!=="granted") throw new Error("Permiso de notificaciones no otorgado");
  const reg=await navigator.serviceWorker.ready;
  const sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:VAPID_KEY});
  const result=await pickemAPI("subscribePush",{body:{userId,subscription:sub.toJSON()}});
  if(!result?.ok) throw new Error(result?.error||"Error guardando suscripción en el servidor");
}
const ACHIEVEMENT_DEFS=[
  {key:"first_pick",emoji:"🎯",name:"Primer Pick",desc:"Hiciste tu primera predicción",color:"#00C2FF"},
  {key:"first_win",emoji:"✅",name:"Primer Acierto",desc:"Atinaste una predicción",color:"#00FF9D"},
  {key:"streak_3",emoji:"🔥",name:"En Racha",desc:"3 picks correctos seguidos",color:"#FF6B35"},
  {key:"streak_5",emoji:"🔥🔥",name:"En Llamas",desc:"5 picks correctos seguidos",color:"#FF6B35"},
  {key:"streak_7",emoji:"⚡🔥",name:"Imparable",desc:"7 picks correctos seguidos — ganas un escudo",color:"#FFB800"},
  {key:"perfect_day",emoji:"💎",name:"Día Perfecto",desc:"100% en un día (mín. 2 picks)",color:"#00C2FF"},
  {key:"bet_won",emoji:"🪙",name:"Apostador",desc:"Ganaste tu primera apuesta",color:"#FFB800"},
  {key:"joined_group",emoji:"👥",name:"Social",desc:"Te uniste a un grupo",color:"#00C2FF"},
  {key:"challenge_sent",emoji:"⚡",name:"Retador",desc:"Enviaste un reto de apuesta",color:"#FFB800"},
  {key:"parlay_win",emoji:"🎰",name:"Parlay Perfecto",desc:"Acertaste todos los picks de tu parlay",color:"#FF6B35"},
];

// ─── SHOP ITEMS ─────────────────────────────────────────────────────────────
const SHOP_ITEMS=[
  // Títulos
  {key:"title_rookie",   emoji:"🐣",name:"Título Rookie",    desc:"🐣 para los que están empezando",        cost:50,  type:"title", cat:"Títulos"},
  {key:"title_fire",     emoji:"🔥",name:"Título Fuego",     desc:"🔥 antes de tu nombre",                 cost:120, type:"title", cat:"Títulos"},
  {key:"title_sniper",   emoji:"🎯",name:"Título Sniper",    desc:"🎯 puntería perfecta, junto a tu nombre",cost:150, type:"title", cat:"Títulos"},
  {key:"title_lightning",emoji:"⚡",name:"Título Rayo",      desc:"⚡ velocidad y energía",                 cost:180, type:"title", cat:"Títulos"},
  {key:"title_rey",      emoji:"👑",name:"Título Rey",       desc:"👑 antes de tu nombre en el ranking",    cost:200, type:"title", cat:"Títulos"},
  {key:"title_brain",    emoji:"🧠",name:"Título Cerebro",   desc:"🧠 el más inteligente del grupo",        cost:200, type:"title", cat:"Títulos"},
  {key:"title_lion",     emoji:"🦁",name:"Título León",      desc:"🦁 domina el ranking con fuerza",        cost:250, type:"title", cat:"Títulos"},
  {key:"title_shark",    emoji:"🦈",name:"Título Tiburón",   desc:"🦈 implacable en los picks",             cost:300, type:"title", cat:"Títulos"},
  {key:"title_legend",   emoji:"🌟",name:"Título Leyenda",   desc:"🌟 para las verdaderas leyendas",        cost:400, type:"title", cat:"Títulos"},
  {key:"title_mvp",      emoji:"🏅",name:"Título MVP",       desc:"🏅 MVP junto a tu nombre",              cost:350, type:"title", cat:"Títulos"},
  {key:"title_goat",     emoji:"🐐",name:"Título GOAT",      desc:"🐐 el más grande, junto a tu nombre",   cost:500, type:"title", cat:"Títulos"},
  {key:"title_diamond",  emoji:"💎",name:"Título Diamante",  desc:"💎 raro y exclusivo, el tope del juego", cost:600, type:"title", cat:"Títulos"},
  // Colores de nombre
  {key:"color_white",  emoji:"⬜",name:"Nombre Blanco",   desc:"Tu nombre en blanco puro",               cost:100, type:"color", cat:"Colores", value:"#FFFFFF"},
  {key:"color_fire",   emoji:"🟠",name:"Nombre Fuego",    desc:"Tu nombre en naranja en el ranking",     cost:150, type:"color", cat:"Colores", value:"#FF6B35"},
  {key:"color_red",    emoji:"🔴",name:"Nombre Rojo",     desc:"Tu nombre en rojo intenso",              cost:150, type:"color", cat:"Colores", value:"#FF4444"},
  {key:"color_green",  emoji:"🟢",name:"Nombre Verde",    desc:"Tu nombre en verde en el ranking",       cost:150, type:"color", cat:"Colores", value:"#00FF9D"},
  {key:"color_blue",   emoji:"🔵",name:"Nombre Azul",     desc:"Tu nombre en azul neón",                 cost:150, type:"color", cat:"Colores", value:"#00C2FF"},
  {key:"color_teal",   emoji:"🩵",name:"Nombre Turquesa", desc:"Tu nombre en turquesa vibrante",         cost:180, type:"color", cat:"Colores", value:"#00CED1"},
  {key:"color_purple", emoji:"🟣",name:"Nombre Violeta",  desc:"Tu nombre en violeta en el ranking",     cost:200, type:"color", cat:"Colores", value:"#9B59B6"},
  {key:"color_pink",   emoji:"🩷",name:"Nombre Rosa",     desc:"Tu nombre en rosa brillante",            cost:200, type:"color", cat:"Colores", value:"#FF69B4"},
  {key:"color_gold",   emoji:"🟡",name:"Nombre Dorado",   desc:"Tu nombre en dorado en el ranking",      cost:250, type:"color", cat:"Colores", value:"#FFB800"},
  // Marcos
  {key:"border_silver", emoji:"🔘",name:"Marco Plata",    desc:"Borde plateado en tu posición",          cost:200, type:"border", cat:"Marcos", value:"#C0C0C0"},
  {key:"border_neon",   emoji:"🔵",name:"Marco Neón",     desc:"Borde cyan neón en tu posición",         cost:250, type:"border", cat:"Marcos", value:"#00C2FF"},
  {key:"border_purple", emoji:"🟣",name:"Marco Violeta",  desc:"Borde violeta brillante",                cost:280, type:"border", cat:"Marcos", value:"#9B59B6"},
  {key:"border_gold",   emoji:"✨",name:"Marco Dorado",   desc:"Borde dorado en tu posición del ranking",cost:300, type:"border", cat:"Marcos", value:"#FFB800"},
  {key:"border_fire",   emoji:"🔴",name:"Marco Fuego",    desc:"Borde rojo en tu posición del ranking",  cost:300, type:"border", cat:"Marcos", value:"#FF4444"},
  {key:"border_electric",emoji:"⚡",name:"Marco Eléctrico",desc:"Borde eléctrico que te hace brillar",   cost:350, type:"border", cat:"Marcos", value:"#FFD700"},
  {key:"border_rainbow", emoji:"🌈",name:"Marco Arcoíris", desc:"Borde arcoíris animado — exclusivo",    cost:500, type:"border", cat:"Marcos", value:"rainbow"},
  // Poderes
  {key:"shield",         emoji:"🛡️",name:"Escudo de Racha",desc:"+1 escudo para proteger tu racha (consumible)", cost:75,  type:"shield", cat:"Poderes"},
  {key:"extra_pick",     emoji:"🔄",name:"Pick Extra",      desc:"Cambia 1 pick aunque el partido ya cerró (consumible)", cost:200, type:"extra_pick", cat:"Poderes"},
];

// Helpers para aplicar cosmetics en el leaderboard
// equipped = {color:"color_gold", title:"title_rey", border:"border_neon"} — solo 1 activo por tipo
const getNameColor=(items=[],equipped={})=>{
  // Si hay item equipado de tipo color, ese tiene prioridad
  const eq=equipped?.color;
  const key=eq&&items.includes(eq)?eq:null;
  const active=key||(()=>{
    const colorItems=SHOP_ITEMS.filter(i=>i.type==="color");
    // último comprado que tenga
    for(const ci of [...colorItems].reverse()){if(items.includes(ci.key))return ci.key;}
    return null;
  })();
  if(!active)return null;
  const found=SHOP_ITEMS.find(i=>i.key===active);
  if(found?.value)return found.value;
  // legacy keys
  if(active==="fire_color")return "#FF6B35";
  return null;
};
const getNamePrefix=(items=[],equipped={})=>{
  const eq=equipped?.title;
  const key=eq&&items.includes(eq)?eq:null;
  const active=key||(()=>{
    const titleItems=SHOP_ITEMS.filter(i=>i.type==="title");
    for(const ti of [...titleItems].reverse()){if(items.includes(ti.key))return ti.key;}
    return null;
  })();
  if(!active)return "";
  const found=SHOP_ITEMS.find(i=>i.key===active);
  if(found?.emoji)return found.emoji+" ";
  // legacy
  if(active==="crown_badge")return "👑 ";
  return "";
};
const getBorderColor=(items=[],equipped={})=>{
  const eq=equipped?.border;
  const key=eq&&items.includes(eq)?eq:null;
  const active=key||(()=>{
    const borderItems=SHOP_ITEMS.filter(i=>i.type==="border");
    for(const bi of [...borderItems].reverse()){if(items.includes(bi.key))return bi.key;}
    return null;
  })();
  if(!active)return null;
  if(active==="gold_border")return "#FFB800";
  const found=SHOP_ITEMS.find(i=>i.key===active);
  if(found?.value&&found.value!=="rainbow")return found.value;
  if(found?.value==="rainbow")return "#FF6B35"; // fallback for rainbow
  return null;
};
const PickemTab=({games,standings,userCtx,initSubTab,standalone})=>{
  const {user,save}=userCtx;
  const [name,setName]=useState("");const [groups,setGroups]=useState([]);const [selGroup,setSelGroup]=useState(null);
  const [picks,setPicks]=useState({});const [leaderboard,setLeaderboard]=useState([]);
  const [newGroupName,setNewGroupName]=useState("");const [joinCode,setJoinCode]=useState("");
  const [panel,setPanel]=useState(null);
  const [pin,setPin]=useState(["","","",""]);
  const [subTab,setSubTab]=useState(initSubTab||"ranking");
  const [msg,setMsg]=useState("");const [loading,setLoading]=useState(false);
  const [copied,setCopied]=useState(false);
  const [nameStatus,setNameStatus]=useState(null);
  // New features state
  const [picksPoints,setPicksPoints]=useState({});
  const [history,setHistory]=useState([]);
  const [grpPicks,setGrpPicks]=useState([]);
  const [balance,setBalance]=useState(null);
  const [bets,setBets]=useState([]);
  const [betGame,setBetGame]=useState(null);
  const [betAmt,setBetAmt]=useState(50);
  const [betTeam,setBetTeam]=useState(null);
  const [betLoading,setBetLoading]=useState(false);
  const [periodLb,setPeriodLb]=useState([]);
  const [betOpponent,setBetOpponent]=useState(null);
  const [chat,setChat]=useState([]);const [chatInput,setChatInput]=useState("");const [chatLoading,setChatLoading]=useState(false);
  const [h2hUser,setH2hUser]=useState(null);const [h2hData,setH2hData]=useState(null);
  const [streaks,setStreaks]=useState({});
  const [achievements,setAchievements]=useState([]);
  const [lbPeriod,setLbPeriod]=useState("season");
  const [dailyWinner,setDailyWinner]=useState(null);
  const [myStatsData,setMyStatsData]=useState(null);
  const [shields,setShields]=useState(0);
  const [parlay,setParlay]=useState(null);const [parlaySelections,setParlaySelections]=useState({});const [parlayLoading,setParlayLoading]=useState(false);
  const [shopItems,setShopItems]=useState([]);
  const [myEquipped,setMyEquipped]=useState(()=>JSON.parse(localStorage.getItem("courtiq_equipped_"+(typeof user!=="undefined"?user?.id:""))||"{}"));
  const [lockedPicks,setLockedPicks]=useState(false);
  const [confidence,setConfidence]=useState({});
  const [authMode,setAuthMode]=useState("auto"); // "auto"|"recovery"|"emailRecovery"|"emailCode"
  const [recCode,setRecCode]=useState(""); // shown once after new registration
  const [recInput,setRecInput]=useState(""); // recovery code input
  const [recNewPin,setRecNewPin]=useState(["","","",""]); // new PIN for recovery
  const [pendingUser,setPendingUser]=useState(null); // user waiting for recovery code ack
  const [biometricAvail,setBiometricAvail]=useState(false);
  const [regEmail,setRegEmail]=useState(""); // email during registration
  const [recoveryEmail,setRecoveryEmail]=useState(""); // email for PIN recovery
  const [recoveryCode6,setRecoveryCode6]=useState(""); // 6-digit code from email
  const [recoveryNewPin,setRecoveryNewPin]=useState(["","","",""]);
  const [editGroup,setEditGroup]=useState(false);const [editGroupName,setEditGroupName]=useState("");const [editGroupEmoji,setEditGroupEmoji]=useState("");
  const [profileModal,setProfileModal]=useState(null);const [profileData,setProfileData]=useState(null);
  const now=new Date();
  const upcoming=games.filter(g=>g.startTime?now<new Date(g.startTime):g.status==="Upcoming");
  const finished=games.filter(g=>g.status==="Final");const liveGames=games.filter(g=>g.status==="LIVE");
  const allGames=[...liveGames,...upcoming,...finished];
  const anyStarted=liveGames.length>0||finished.length>0;

  // Check username availability (debounced)
  useEffect(()=>{
    if(!name.trim()||name.trim().length<2){setNameStatus(null);return;}
    setNameStatus("checking");
    const t=setTimeout(async()=>{
      const d=await pickemAPI("checkUsername",{params:{name:name.trim()}});
      if(d.ok)setNameStatus(d.available?"available":"taken");
    },500);
    return()=>clearTimeout(t);
  },[name]);

  // Load groups on mount & auto-select first
  useEffect(()=>{
    if(!user) return;
    pickemAPI("myGroups",{params:{userId:user.id}}).then(d=>{
      if(d.ok&&d.groups?.length){
        setGroups(d.groups);
        const saved=localStorage.getItem("courtiq_lastgroup");
        const found=d.groups.find(g=>g.id===saved);
        setSelGroup(found||d.groups[0]);
      }
    });
    pickemAPI("getAchievements",{params:{userId:user.id}}).then(d=>{if(d.ok)setAchievements(d.achievements||[]);});
    // Auto-fill invite code if arrived via invite link
    const invite=localStorage.getItem("courtiq_invite_code");

    if(invite){localStorage.removeItem("courtiq_invite_code");setJoinCode(invite);setPanel("join");}
  },[user]);

  // Biometric auto-fill — try to pre-fill credentials from browser credential manager
  useEffect(()=>{
    if(user) return;
    if(!('PasswordCredential' in window)) return;
    setBiometricAvail(true);
    navigator.credentials.get({password:true,mediation:"optional"})
      .then(cred=>{if(cred?.type==="password"){setName(cred.id);const d=cred.password.replace(/\D/g,"").slice(0,4).split("");if(d.length===4)setPin(d);}})
      .catch(()=>{});
  },[user]);

  // Save last selected group and notify FloatingChat
  useEffect(()=>{
    if(selGroup){
      localStorage.setItem("courtiq_lastgroup",selGroup.id);
      localStorage.setItem("courtiq_lastgroup_obj",JSON.stringify(selGroup));
      window.dispatchEvent(new CustomEvent("courtiq_group_changed",{detail:selGroup}));
    }
  },[selGroup]);

  // Load picks, leaderboard, wildcard, daily winner when group changes
  useEffect(()=>{
    if(!user||!selGroup) return;
    const today=new Date().toISOString().split("T")[0];
    if(localStorage.getItem(`courtiq_locked_${selGroup.id}_${today}`)) setLockedPicks(true);
    else setLockedPicks(false);
    pickemAPI("myPicks",{params:{userId:user.id,groupId:selGroup.id,date:today}}).then(d=>{
      if(d.ok){const map={},pts={},conf={};(d.picks||[]).forEach(p=>{map[p.game_id]=p.picked_team;if(p.points!=null)pts[p.game_id]=p.points;if(p.confidence)conf[p.game_id]=p.confidence;});setPicks(map);setPicksPoints(pts);setConfidence(conf);}
    });
    pickemAPI("leaderboard",{params:{groupId:selGroup.id}}).then(d=>{
      if(d.ok){
        const lb=d.leaderboard||[];
        setLeaderboard(lb);
        lb.forEach(r=>{
          pickemAPI("getStreak",{params:{userId:r.user_id,groupId:selGroup.id}}).then(s=>{
            if(s.ok)setStreaks(prev=>({...prev,[r.user_id]:s.streak}));
          });
        });
      }
    });
    pickemAPI("dailyWinner",{params:{groupId:selGroup.id}}).then(d=>{if(d.ok)setDailyWinner(d.winner);});
  },[user,selGroup]);

  // Period leaderboard (mes/semana) — temporada usa el estado leaderboard ya cargado
  useEffect(()=>{
    if(!selGroup||lbPeriod==="season") return;
    pickemAPI("periodLeaderboard",{params:{groupId:selGroup.id,period:lbPeriod}}).then(d=>{
      if(d.ok) setPeriodLb(d.leaderboard||[]);
    });
  },[selGroup,lbPeriod]);

  // Sub-tab specific data
  useEffect(()=>{
    if(!user||!selGroup) return;
    if(subTab==="historial") pickemAPI("pickHistory",{params:{userId:user.id,groupId:selGroup.id}}).then(d=>{if(d.ok)setHistory(d.picks||[]);});
    if(subTab==="grupo") pickemAPI("groupPicks",{params:{groupId:selGroup.id}}).then(d=>{if(d.ok)setGrpPicks(d.picks||[]);});
    if(subTab==="apuestas"){
      pickemAPI("getBalance",{params:{userId:user.id,groupId:selGroup.id}}).then(d=>{if(d.ok)setBalance(d.balance);});
      pickemAPI("groupBets",{params:{groupId:selGroup.id}}).then(d=>{if(d.ok)setBets(d.bets||[]);});
    }
    if(subTab==="chat") pickemAPI("getChat",{params:{groupId:selGroup.id}}).then(d=>{if(d.ok)setChat(d.messages||[]);});
    if(subTab==="estadisticas") pickemAPI("myStats",{params:{userId:user.id}}).then(d=>{if(d.ok)setMyStatsData(d.stats);});
    if(subTab==="parlay"){
      pickemAPI("myParlay",{params:{userId:user.id,groupId:selGroup.id}}).then(d=>{if(d.ok)setParlay(d.parlay);});
      pickemAPI("getBalance",{params:{userId:user.id,groupId:selGroup.id}}).then(d=>{if(d.ok)setBalance(d.balance);});
    }
  },[subTab,user,selGroup]);

  // Load shields on mount
  useEffect(()=>{
    if(!user) return;
    pickemAPI("getShields",{params:{userId:user.id}}).then(d=>{if(d.ok)setShields(d.shields||0);});
    pickemAPI("myShopItems",{params:{userId:user.id}}).then(d=>{if(d.ok)setShopItems(d.items||[]);});
    pickemAPI("checkAchievements",{params:{userId:user.id,groupId:localStorage.getItem("courtiq_lastgroup")||""}}).catch(()=>{});
  },[user]);

  // Recargar shopItems cuando se compra algo en ShopTab
  useEffect(()=>{
    if(!user) return;
    const handler=()=>pickemAPI("myShopItems",{params:{userId:user.id}}).then(d=>{if(d.ok)setShopItems(d.items||[]);});
    const eqHandler=()=>setMyEquipped(JSON.parse(localStorage.getItem("courtiq_equipped_"+user.id)||"{}"));
    window.addEventListener("courtiq_items_purchased",handler);
    window.addEventListener("courtiq_equipped_changed",eqHandler);
    return()=>{window.removeEventListener("courtiq_items_purchased",handler);window.removeEventListener("courtiq_equipped_changed",eqHandler);};
  },[user]);

  // Refrescar grupo picks cuando cambia el status de los juegos (para que no desaparezcan los % al iniciar un partido)
  useEffect(()=>{
    if(!user||!selGroup||subTab!=="grupo") return;
    pickemAPI("groupPicks",{params:{groupId:selGroup.id}}).then(d=>{if(d.ok)setGrpPicks(d.picks||[]);});
  },[games.map(g=>g.status).join(",")]);

  const register=async()=>{
    if(!name.trim()) return;
    setLoading(true);
    const rawPin=pin.join("");
    const emailToSend=regEmail.trim()||undefined;
    const d=await pickemAPI("register",{body:{name:name.trim(),pin:rawPin,email:emailToSend}});
    if(d.ok){
      if('PasswordCredential' in window){try{const c=new PasswordCredential({id:name.trim(),password:rawPin,name:name.trim()});navigator.credentials.store(c);}catch{}}
      if(!d.reconnected&&d.recoveryCode){setPendingUser(d.user);setRecCode(d.recoveryCode);}
      else{save(d.user);autoSubscribePush(d.user.id);}
    }else setMsg(d.error||"Error");
    setLoading(false);
  };

  const resetPin=async()=>{
    if(!name.trim()||recInput.length!==8||recNewPin.join("").length!==4) return;
    setLoading(true);
    const d=await pickemAPI("resetPin",{body:{name:name.trim(),recoveryCode:recInput,newPin:recNewPin.join("")}});
    if(d.ok){setAuthMode("auto");setMsg("✅ PIN actualizado. Ya puedes entrar.");setRecInput("");setRecNewPin(["","","",""]);setPin(["","","",""]);}
    else setMsg(d.error||"Error");
    setLoading(false);
  };

  const sendForgotPin=async()=>{
    if(!recoveryEmail.trim()) return;
    setLoading(true);
    const d=await pickemAPI("forgotPin",{body:{email:recoveryEmail.trim()}});
    if(d.ok){setAuthMode("emailCode");setMsg("");}
    else setMsg(d.error||"Error");
    setLoading(false);
  };

  const confirmEmailReset=async()=>{
    if(!recoveryEmail.trim()||recoveryCode6.length!==6||recoveryNewPin.join("").length!==4) return;
    setLoading(true);
    const d=await pickemAPI("resetPinByEmail",{body:{email:recoveryEmail.trim(),code:recoveryCode6,newPin:recoveryNewPin.join("")}});
    if(d.ok){setAuthMode("auto");setMsg("✅ PIN actualizado. Ya puedes entrar.");setRecoveryCode6("");setRecoveryNewPin(["","","",""]);}
    else setMsg(d.error||"Error");
    setLoading(false);
  };

  const createGroup=async()=>{
    if(!newGroupName.trim()) return;
    setLoading(true);
    const d=await pickemAPI("createGroup",{body:{name:newGroupName.trim(),userId:user.id}});
    if(d.ok){setGroups(g=>[...g,d.group]);setSelGroup(d.group);setPanel(null);setNewGroupName("");setMsg(`¡Grupo creado! Comparte el código: ${d.group.code}`);}
    else setMsg(d.error);
    setLoading(false);
  };

  const joinGroup=async()=>{
    if(!joinCode.trim()) return;
    setLoading(true);
    const d=await pickemAPI("joinGroup",{body:{code:joinCode.trim(),userId:user.id}});
    if(d.ok){
      if(!d.already){setGroups(g=>[...g,d.group]);setMsg("¡Te uniste al grupo!");}
      else setMsg("Ya estás en este grupo");
      setSelGroup(d.group);setPanel(null);setJoinCode("");
    } else setMsg(d.error);
    setLoading(false);
  };

  const makePick=async(gameId,team,homeTeam,awayTeam,conf=1,g=null)=>{
    if(!selGroup) return;
    const today=new Date().toISOString().split("T")[0];
    setPicks(p=>({...p,[gameId]:team}));
    const pickedSide=team===homeTeam?"home":"away";
    const wPct=g?.status==="Upcoming"?calcWinPct(g,pickedSide,standings):50;
    await pickemAPI("makePick",{body:{userId:user.id,groupId:selGroup.id,gameId,gameDate:today,pickedTeam:team,homeTeam,awayTeam,confidence:conf,winPct:wPct}});
  };

  const copyCode=()=>{
    if(!selGroup) return;
    navigator.clipboard?.writeText(selGroup.code).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);}).catch(()=>{});
  };

  const shareGroup=()=>{
    if(!selGroup) return;
    const url=`${window.location.origin}?join=${selGroup.code}`;
    const text=`¡Únete a mi grupo "${selGroup.name}" en Court IQ! 🏀 Código: ${selGroup.code}\n${url}`;
    if(navigator.share){navigator.share({title:"Court IQ — "+selGroup.name,text,url}).catch(()=>{});}
    else{window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,"_blank");}
  };


  const doBet=async()=>{
    if(!betGame||!betTeam||betAmt<10) return;
    setBetLoading(true);
    const d=await pickemAPI("createBet",{body:{userId:user.id,groupId:selGroup.id,gameId:betGame.id,amount:betAmt,pickedTeam:betTeam,homeTeam:betGame.home,awayTeam:betGame.away}});
    if(d.ok){
      setBalance(b=>b-betAmt);
      pickemAPI("groupBets",{params:{groupId:selGroup.id}}).then(r=>{if(r.ok)setBets(r.bets||[]);});
      setBetGame(null);setBetTeam(null);setMsg(`✅ Apuesta de ${betAmt} 🪙 enviada al grupo`);
    } else setMsg(d.error);
    setBetLoading(false);
  };

  const doAcceptBet=async(bet)=>{
    setBetLoading(true);
    const d=await pickemAPI("acceptBet",{body:{userId:user.id,betId:bet.id}});
    if(d.ok){
      setBalance(b=>b-bet.amount);
      setBets(prev=>prev.map(b=>b.id===bet.id?{...b,status:"active",opponent_id:user.id}:b));
      setMsg("✅ ¡Apuesta aceptada!");
    } else setMsg(d.error);
    setBetLoading(false);
  };

  const doCancelBet=async(bet)=>{
    const d=await pickemAPI("cancelBet",{body:{userId:user.id,betId:bet.id}});
    if(d.ok){setBets(prev=>prev.filter(b=>b.id!==bet.id));setBalance(b=>b+bet.amount);setMsg("Apuesta cancelada");}
    else setMsg(d.error);
  };

  const sendChat=async()=>{
    if(!chatInput.trim()||!selGroup) return;
    setChatLoading(true);
    const content=chatInput.trim();setChatInput("");
    const d=await pickemAPI("sendChat",{body:{userId:user.id,groupId:selGroup.id,content}});
    if(d.ok) setChat(prev=>[...prev,{user_id:user.id,content,users:{name:user.name,avatar_emoji:user.avatar_emoji||"🏀"},created_at:new Date().toISOString()}]);
    setChatLoading(false);
  };
  const loadH2H=async(r)=>{
    setH2hUser(r);setH2hData(null);
    const d=await pickemAPI("headToHead",{params:{userId:user.id,opponentId:r.user_id,groupId:selGroup.id}});
    if(d.ok) setH2hData(d);
  };
  const openProfile=async(r)=>{
    setProfileModal(r);setProfileData(null);
    const d=await pickemAPI("userProfile",{params:{userId:user.id,targetId:r.user_id}});
    if(d.ok) setProfileData(d);
  };
  const sharePicksImage=(date,dayPicks)=>{
    const W=400,ROW=52,HEADER=80,FOOTER=50;
    const H=HEADER+dayPicks.length*ROW+FOOTER;
    const canvas=document.createElement("canvas");
    canvas.width=W*2;canvas.height=H*2; // 2x for retina
    const ctx=canvas.getContext("2d");
    ctx.scale(2,2);
    // Background
    ctx.fillStyle="#07090f";ctx.fillRect(0,0,W,H);
    // Top accent bar
    ctx.fillStyle="#00C2FF";ctx.fillRect(0,0,W,3);
    // Title
    ctx.fillStyle="#00C2FF";ctx.font="bold 15px Arial,sans-serif";ctx.fillText("🏀 Court IQ Picks",16,28);
    ctx.fillStyle="#566880";ctx.font="11px Arial,sans-serif";
    ctx.fillText(new Date(date+"T12:00:00").toLocaleDateString("es",{weekday:"long",month:"short",day:"numeric"}),16,46);
    const correct=dayPicks.filter(p=>p.correct).length;
    const pts=dayPicks.reduce((s,p)=>s+(p.points||0),0);
    ctx.fillStyle="#FFB800";ctx.font="bold 11px Arial,sans-serif";ctx.textAlign="right";
    ctx.fillText(`${correct}/${dayPicks.length} ✓  +${pts}pts`,W-16,28);
    ctx.textAlign="left";
    // Picks
    dayPicks.forEach((p,i)=>{
      const y=HEADER+i*ROW;
      const rival=p.picked_team===p.home_team?p.away_team:p.home_team;
      const accent=p.scored?(p.correct?"#00FF9D":"#ff4444"):"#3d5166";
      ctx.fillStyle=accent+"44";ctx.fillRect(0,y,W,ROW-2);
      ctx.fillStyle=accent;ctx.fillRect(0,y,3,ROW-2);
      ctx.fillStyle="#e0eaf5";ctx.font="bold 14px Arial,sans-serif";ctx.fillText(p.picked_team,16,y+22);
      ctx.fillStyle="#566880";ctx.font="11px Arial,sans-serif";ctx.fillText(`vs ${rival}`,16,y+38);
      if(p.scored){ctx.fillStyle=accent;ctx.font="bold 14px Arial,sans-serif";ctx.textAlign="right";ctx.fillText(p.correct?"✅":"❌",W-16,y+26);ctx.textAlign="left";}
    });
    // Footer
    ctx.fillStyle="#0d1117";ctx.fillRect(0,H-FOOTER,W,FOOTER);
    ctx.fillStyle="#566880";ctx.font="10px Arial,sans-serif";ctx.textAlign="center";ctx.fillText("court-iq.vercel.app",W/2,H-16);ctx.textAlign="left";
    canvas.toBlob(async blob=>{
      if(navigator.share&&blob&&navigator.canShare?.({files:[new File([blob],"picks.png",{type:"image/png"})]})){
        try{await navigator.share({files:[new File([blob],"picks.png",{type:"image/png"})],title:"Mis picks Court IQ"});return;}catch(_){}
      }
      const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`picks-${date}.png`;a.click();URL.revokeObjectURL(url);
    },"image/png");
  };
  const doChallengeBet=async()=>{
    if(!betGame||!betTeam||betAmt<10||!betOpponent) return;
    setBetLoading(true);
    const d=await pickemAPI("challengeBet",{body:{userId:user.id,groupId:selGroup.id,gameId:betGame.id,amount:betAmt,pickedTeam:betTeam,homeTeam:betGame.home,awayTeam:betGame.away,opponentId:betOpponent.userId}});
    if(d.ok){setBalance(b=>b-betAmt);setBetGame(null);setBetTeam(null);setBetOpponent(null);setMsg(`⚡ ¡Reto enviado a ${betOpponent.name}!`);pickemAPI("groupBets",{params:{groupId:selGroup.id}}).then(r=>{if(r.ok)setBets(r.bets||[]);});}
    else setMsg(d.error);
    setBetLoading(false);
  };

  const myRank=leaderboard.findIndex(r=>r.user_id===user?.id);
  const myLbStats=leaderboard.find(r=>r.user_id===user?.id);

  // ─── NOT REGISTERED ───
    if(!user) return(<div className="fade-up">
      <ST sub="Pick'em">Court IQ 🏀</ST>

      {/* ── Recovery code shown ONCE after new registration ── */}
      {recCode&&pendingUser&&<Card style={{maxWidth:420,margin:"0 auto",textAlign:"center",padding:30}}>
        <div style={{fontSize:40,marginBottom:12}}>🔑</div>
        <div style={{fontSize:18,fontWeight:800,color:C.text,marginBottom:8}}>¡Cuenta creada!</div>
        <div style={{fontSize:12,color:C.dim,marginBottom:16}}>Guarda este código de recuperación. Lo necesitarás si olvidas tu PIN.</div>
        <div style={{background:"#0a1018",border:`2px dashed ${C.accent}`,borderRadius:12,padding:"18px 24px",marginBottom:16}}>
          <div style={{fontSize:10,color:C.muted,letterSpacing:2,marginBottom:6}}>CÓDIGO DE RECUPERACIÓN</div>
          <div style={{fontSize:32,fontWeight:900,letterSpacing:8,color:C.accent,fontFamily:"'Bebas Neue',sans-serif"}}>{recCode}</div>
        </div>
        <div style={{fontSize:11,color:"#f59e0b",marginBottom:20,padding:"8px 12px",background:"#f59e0b11",border:"1px solid #f59e0b33",borderRadius:8}}>⚠️ Toma captura de pantalla ahora. No se puede recuperar después.</div>
        <button className="btn" onClick={()=>{save(pendingUser);autoSubscribePush(pendingUser.id);setRecCode("");setPendingUser(null);}} style={{width:"100%",padding:"14px",borderRadius:11,background:`linear-gradient(135deg,${C.accent},#0066ff)`,color:"#07090f",fontSize:15,fontWeight:900}}>Entendido, entrar →</button>
      </Card>}

      {/* ── Forgot PIN — step 1: enter email ── */}
      {!recCode&&authMode==="emailRecovery"&&<Card style={{maxWidth:420,margin:"0 auto",textAlign:"center",padding:30}}>
        <div style={{fontSize:40,marginBottom:12}}>📧</div>
        <div style={{fontSize:18,fontWeight:800,color:C.text,marginBottom:8}}>Recuperar PIN</div>
        <div style={{fontSize:12,color:C.dim,marginBottom:20}}>Te mandaremos un código de 6 dígitos al correo vinculado a tu cuenta.</div>
        <input value={recoveryEmail} onChange={e=>setRecoveryEmail(e.target.value)} type="email" placeholder="tu@correo.com" style={{width:"100%",background:"#0a1018",border:`1px solid ${C.border}`,borderRadius:11,padding:"14px 16px",color:C.text,fontSize:15,textAlign:"center",boxSizing:"border-box",marginBottom:16}}/>
        <button className="btn" onClick={sendForgotPin} disabled={loading||!recoveryEmail.trim()} style={{width:"100%",padding:"14px",borderRadius:11,background:recoveryEmail.trim()?`linear-gradient(135deg,${C.accent},#0066ff)`:"#1a2535",color:recoveryEmail.trim()?"#07090f":C.muted,fontSize:15,fontWeight:900,marginBottom:12}}>{loading?<Spin s={14}/>:"📨 Enviar código"}</button>
        <button className="btn" onClick={()=>{setAuthMode("auto");setMsg("");}} style={{background:"none",color:C.dim,fontSize:13,padding:"8px"}}>← Volver</button>
        {msg&&<div style={{marginTop:10,fontSize:12,color:"#ff6666"}}>{msg}</div>}
      </Card>}

      {/* ── Forgot PIN — step 2: enter code + new PIN ── */}
      {!recCode&&authMode==="emailCode"&&<Card style={{maxWidth:420,margin:"0 auto",textAlign:"center",padding:30}}>
        <div style={{fontSize:40,marginBottom:12}}>✉️</div>
        <div style={{fontSize:18,fontWeight:800,color:C.text,marginBottom:8}}>Revisa tu correo</div>
        <div style={{fontSize:12,color:C.dim,marginBottom:4}}>Te enviamos un código a</div>
        <div style={{fontSize:13,fontWeight:700,color:C.accent,marginBottom:20}}>{recoveryEmail}</div>
        <div style={{fontSize:10,color:C.muted,marginBottom:6,textAlign:"left",paddingLeft:4}}>Código de 6 dígitos</div>
        <input value={recoveryCode6} onChange={e=>setRecoveryCode6(e.target.value.replace(/\D/g,"").slice(0,6))} type="tel" placeholder="000000" maxLength={6} style={{width:"100%",background:"#0a1018",border:`1px solid ${recoveryCode6.length===6?C.accent:C.border}`,borderRadius:11,padding:"14px 16px",color:C.accent,fontSize:28,fontWeight:900,textAlign:"center",letterSpacing:10,boxSizing:"border-box",marginBottom:16}}/>
        <div style={{fontSize:10,color:C.muted,marginBottom:6,textAlign:"left",paddingLeft:4}}>🔒 Nuevo PIN de 4 dígitos</div>
        <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:16}}>
          {[0,1,2,3].map(i=><input key={i} id={`epin-${i}`} type="tel" maxLength={1} value={recoveryNewPin[i]||""} onChange={e=>{const v=e.target.value.replace(/\D/g,"");if(v.length<=1){const np=[...recoveryNewPin];np[i]=v;setRecoveryNewPin(np);if(v&&i<3)document.getElementById(`epin-${i+1}`)?.focus();}}} onKeyDown={e=>{if(e.key==="Backspace"&&!recoveryNewPin[i]&&i>0)document.getElementById(`epin-${i-1}`)?.focus();}} style={{width:52,height:56,background:"#0a1018",border:`1px solid ${recoveryNewPin[i]?"#00FF9D":C.border}`,borderRadius:12,color:"#00FF9D",fontSize:24,fontWeight:900,textAlign:"center",fontFamily:"'Bebas Neue',sans-serif"}}/>)}
        </div>
        <button className="btn" onClick={confirmEmailReset} disabled={loading||recoveryCode6.length!==6||recoveryNewPin.join("").length!==4} style={{width:"100%",padding:"14px",borderRadius:11,background:recoveryCode6.length===6&&recoveryNewPin.join("").length===4?"linear-gradient(135deg,#00FF9D,#00a366)":"#1a2535",color:recoveryCode6.length===6&&recoveryNewPin.join("").length===4?"#07090f":C.muted,fontSize:15,fontWeight:900,marginBottom:12}}>{loading?<Spin s={14}/>:"🔓 Cambiar PIN"}</button>
        <button className="btn" onClick={()=>{setAuthMode("emailRecovery");setMsg("");}} style={{background:"none",color:C.dim,fontSize:12,padding:"4px"}}>← Reenviar código</button>
        {msg&&<div style={{marginTop:10,fontSize:12,color:msg.startsWith("✅")?"#00FF9D":"#ff6666"}}>{msg}</div>}
      </Card>}

      {/* ── Recovery / forgot PIN (by recovery code) ── */}
      {!recCode&&authMode==="recovery"&&<Card style={{maxWidth:420,margin:"0 auto",textAlign:"center",padding:30}}>
        <div style={{fontSize:40,marginBottom:12}}>🔓</div>
        <div style={{fontSize:18,fontWeight:800,color:C.text,marginBottom:8}}>Recuperar con código</div>
        <div style={{fontSize:12,color:C.dim,marginBottom:20}}>Ingresa tu nombre y el código de 8 caracteres que guardaste al registrarte.</div>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Tu nombre..." style={{width:"100%",background:"#0a1018",border:`1px solid ${C.border}`,borderRadius:11,padding:"14px 16px",color:C.text,fontSize:15,textAlign:"center",boxSizing:"border-box",marginBottom:10}}/>
        <input value={recInput} onChange={e=>setRecInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,""))} placeholder="CÓDIGO (8 CARACTERES)" maxLength={8} style={{width:"100%",background:"#0a1018",border:`1px solid ${recInput.length===8?C.accent:C.border}`,borderRadius:11,padding:"14px 16px",color:C.accent,fontSize:20,fontWeight:900,textAlign:"center",letterSpacing:6,boxSizing:"border-box",marginBottom:10}}/>
        <div style={{fontSize:10,color:C.muted,marginBottom:6,textAlign:"left",paddingLeft:4}}>🔒 Nuevo PIN de 4 dígitos</div>
        <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:16}}>
          {[0,1,2,3].map(i=><input key={i} id={`rpin-${i}`} type="tel" maxLength={1} value={recNewPin[i]||""} onChange={e=>{const v=e.target.value.replace(/\D/g,"");if(v.length<=1){const np=[...recNewPin];np[i]=v;setRecNewPin(np);if(v&&i<3)document.getElementById(`rpin-${i+1}`)?.focus();}}} onKeyDown={e=>{if(e.key==="Backspace"&&!recNewPin[i]&&i>0)document.getElementById(`rpin-${i-1}`)?.focus();}} style={{width:52,height:56,background:"#0a1018",border:`1px solid ${recNewPin[i]?"#00FF9D":C.border}`,borderRadius:12,color:"#00FF9D",fontSize:24,fontWeight:900,textAlign:"center",fontFamily:"'Bebas Neue',sans-serif"}}/>)}
        </div>
        <button className="btn" onClick={resetPin} disabled={loading||!name.trim()||recInput.length!==8||recNewPin.join("").length!==4} style={{width:"100%",padding:"14px",borderRadius:11,background:name.trim()&&recInput.length===8&&recNewPin.join("").length===4?"linear-gradient(135deg,#00FF9D,#00a366)":"#1a2535",color:name.trim()&&recInput.length===8&&recNewPin.join("").length===4?"#07090f":C.muted,fontSize:15,fontWeight:900,marginBottom:12}}>{loading?<Spin s={14}/>:"🔓 Recuperar cuenta"}</button>
        <button className="btn" onClick={()=>{setAuthMode("auto");setMsg("");}} style={{background:"none",color:C.dim,fontSize:13,padding:"8px"}}>← Volver al inicio</button>
        {msg&&<div style={{marginTop:10,fontSize:12,color:msg.startsWith("✅")?"#00FF9D":"#ff6666"}}>{msg}</div>}
      </Card>}

      {/* ── Main login / register form ── */}
      {!recCode&&authMode==="auto"&&<Card style={{maxWidth:420,margin:"0 auto",textAlign:"center",padding:30}}>
        <div style={{fontSize:48,marginBottom:12}}>🏀</div>
        <div style={{fontSize:18,fontWeight:800,color:C.text,marginBottom:8}}>{nameStatus==="taken"?"Bienvenido de vuelta 👋":"Únete al Pick'em"}</div>
        <div style={{fontSize:12,color:C.dim,marginBottom:24}}>{nameStatus==="taken"?"Ingresa tu PIN para entrar a tu cuenta.":"Primera vez? Elige nombre y PIN para crear tu cuenta."}</div>
        <div style={{position:"relative",marginBottom:4}}>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Tu nombre..." style={{width:"100%",background:"#0a1018",border:`1px solid ${nameStatus==="available"?"#22c55e":nameStatus==="taken"?"#00C2FF":C.border}`,borderRadius:11,padding:"14px 16px",color:C.text,fontSize:15,textAlign:"center",boxSizing:"border-box"}}/>
        </div>
        {nameStatus==="checking"&&<div style={{fontSize:11,color:C.muted,marginBottom:8,textAlign:"center"}}>Verificando...</div>}
        {nameStatus==="available"&&<div style={{fontSize:11,color:"#22c55e",marginBottom:8,textAlign:"center"}}>✓ Nombre disponible</div>}
        {nameStatus==="taken"&&<div style={{fontSize:11,color:C.accent,marginBottom:8,textAlign:"center"}}>✓ Cuenta encontrada — ingresa tu PIN</div>}
        <div style={{fontSize:10,color:C.muted,marginBottom:6,textAlign:"left",paddingLeft:4}}>{nameStatus==="taken"?"🔒 Tu PIN de 4 dígitos":"🔒 PIN de 4 dígitos (para proteger tu cuenta)"}</div>
        <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:nameStatus==="available"?10:16}}>
          {[0,1,2,3].map(i=><input key={i} id={`pin-${i}`} type="tel" maxLength={1} value={pin[i]||""} onChange={e=>{const v=e.target.value.replace(/\D/g,"");if(v.length<=1){const np=[...pin];np[i]=v;setPin(np);if(v&&i<3)document.getElementById(`pin-${i+1}`)?.focus();}}} onKeyDown={e=>{if(e.key==="Backspace"&&!pin[i]&&i>0)document.getElementById(`pin-${i-1}`)?.focus();}} style={{width:52,height:56,background:"#0a1018",border:`1px solid ${pin[i]?C.accent:C.border}`,borderRadius:12,color:C.accent,fontSize:24,fontWeight:900,textAlign:"center",fontFamily:"'Bebas Neue',sans-serif"}}/>)}
        </div>
        {nameStatus==="available"&&<div style={{marginBottom:16}}>
          <div style={{fontSize:10,color:C.muted,marginBottom:6,textAlign:"left",paddingLeft:4}}>📧 Correo (opcional — para recuperar tu PIN)</div>
          <input value={regEmail} onChange={e=>setRegEmail(e.target.value)} type="email" placeholder="tu@correo.com" style={{width:"100%",background:"#0a1018",border:`1px solid ${C.border}`,borderRadius:11,padding:"12px 16px",color:C.text,fontSize:14,textAlign:"center",boxSizing:"border-box"}}/>
        </div>}
        <button className="btn" onClick={register} disabled={loading||nameStatus==="checking"||!name.trim()} style={{width:"100%",padding:"14px",borderRadius:11,background:pin.join("").length===4&&name.trim()?`linear-gradient(135deg,${C.accent},#0066ff)`:`${C.border}`,color:pin.join("").length===4&&name.trim()?"#07090f":C.muted,fontSize:15,fontWeight:900}}>{loading?<Spin s={14}/>:nameStatus==="taken"?"Entrar con PIN 🔑":"Crear cuenta 🚀"}</button>
        {nameStatus==="taken"&&<div style={{marginTop:12,display:"flex",flexDirection:"column",gap:8,alignItems:"center"}}>
          {biometricAvail&&<button className="btn" onClick={()=>navigator.credentials.get({password:true,mediation:"required"}).then(cred=>{if(cred?.type==="password"){setName(cred.id);const d=cred.password.replace(/\D/g,"").slice(0,4).split("");if(d.length===4)setPin(d);}}).catch(()=>{})} style={{width:"100%",padding:"12px",borderRadius:11,background:`${C.accent}15`,border:`1px solid ${C.accent}44`,color:C.accent,fontSize:14,fontWeight:700}}>🔐 Usar huella / desbloqueo</button>}
          <div style={{display:"flex",gap:16,fontSize:12,color:C.dim}}>
            <button className="btn" onClick={()=>{setAuthMode("emailRecovery");setMsg("");}} style={{background:"none",color:C.accent,fontSize:12,padding:"4px",textDecoration:"underline"}}>📧 Recuperar por correo</button>
            <button className="btn" onClick={()=>{setAuthMode("recovery");setMsg("");}} style={{background:"none",color:C.dim,fontSize:12,padding:"4px",textDecoration:"underline"}}>Tengo código de recuperación</button>
          </div>
        </div>}
        {msg&&<div style={{marginTop:10,fontSize:12,color:msg.startsWith("✅")?"#00FF9D":"#ff6666"}}>{msg}</div>}
      </Card>}
    </div>);

  // ─── MAIN PICK'EM VIEW ───
  return(<div className="fade-up">
    {/* Header */}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
      <div><div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2}}>Hola {user.name}</div><div style={{fontSize:22,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.text}}>Pick'em 🎯</div></div>
      <div style={{display:"flex",gap:6}}>
        <button className="btn" onClick={()=>setPanel(panel==="join"?null:"join")} style={{padding:"8px 14px",borderRadius:10,background:panel==="join"?C.accent:`${C.accent}22`,border:`1px solid ${C.accent}`,color:panel==="join"?"#07090f":C.accent,fontSize:11,fontWeight:700}}>🔗 Unirse</button>
        <button className="btn" onClick={()=>setPanel(panel==="create"?null:"create")} style={{padding:"8px 14px",borderRadius:10,background:panel==="create"?C.accent:`${C.accent}22`,border:`1px solid ${C.accent}`,color:panel==="create"?"#07090f":C.accent,fontSize:11,fontWeight:700}}>+ Crear</button>
      </div>
    </div>

    {/* Toast message */}
    {msg&&<div style={{marginBottom:10,padding:"10px 14px",background:"#00FF9D11",border:"1px solid #00FF9D44",borderRadius:10,fontSize:12,color:"#00FF9D",display:"flex",justifyContent:"space-between",alignItems:"center"}}>{msg}<button className="btn" onClick={()=>setMsg("")} style={{background:"none",color:C.muted,fontSize:16,padding:"0 4px"}}>×</button></div>}

    {/* Create panel */}
    {panel==="create"&&<Card style={{marginBottom:14,borderColor:`${C.accent}55`,background:"linear-gradient(135deg,#00C2FF08,#0d1117)"}}>
      <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:12}}>🆕 Crear nuevo grupo</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <input value={newGroupName} onChange={e=>setNewGroupName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&createGroup()} placeholder="Nombre del grupo (ej: Los del barrio)" style={{flex:1,background:"#0a1018",border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px",color:C.text,fontSize:13}}/>
        <button className="btn" onClick={createGroup} disabled={loading} style={{background:C.accent,borderRadius:10,padding:"12px 20px",color:"#07090f",fontSize:13,fontWeight:800}}>{loading?<Spin s={13}/>:"Crear"}</button>
      </div>
      <div style={{fontSize:11,color:C.dim,marginTop:8}}>Se generará un código para invitar amigos</div>
    </Card>}

    {/* Join panel */}
    {panel==="join"&&<Card style={{marginBottom:14,borderColor:"#FFB80055",background:"linear-gradient(135deg,#FFB80008,#0d1117)"}}>
      <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:12}}>🔗 Unirse a un grupo</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <input value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&joinGroup()} placeholder="CÓDIGO" maxLength={6} style={{flex:1,background:"#0a1018",border:`1px solid ${C.border}`,borderRadius:10,padding:"12px 14px",color:"#FFB800",fontSize:20,fontWeight:900,letterSpacing:6,textAlign:"center",textTransform:"uppercase"}}/>
        <button className="btn" onClick={joinGroup} disabled={loading} style={{background:"#FFB800",borderRadius:10,padding:"12px 20px",color:"#07090f",fontSize:13,fontWeight:800}}>{loading?<Spin s={13}/>:"Entrar"}</button>
      </div>
      <div style={{fontSize:11,color:C.dim,marginTop:8}}>Pide el código de 6 letras al creador del grupo</div>
    </Card>}

    {/* Group tabs */}
    {groups.length>0&&<div style={{display:"flex",gap:0,marginBottom:16,background:C.card,borderRadius:12,border:`1px solid ${C.border}`,overflow:"auto"}}>
      {groups.map(g=><button key={g.id} className="btn" onClick={()=>{setSelGroup(g);setSubTab("picks");}} style={{flex:1,padding:"12px 8px",background:selGroup?.id===g.id?"#0a1520":"transparent",borderBottom:selGroup?.id===g.id?`2px solid ${C.accent}`:"2px solid transparent",color:selGroup?.id===g.id?C.accent:C.dim,fontSize:13,fontWeight:selGroup?.id===g.id?800:500,textAlign:"center"}}>
        {g.emoji||"🏀"} {g.name}
        {g.memberCount&&<span style={{fontSize:9,opacity:.6,marginLeft:4}}>({g.memberCount})</span>}
      </button>)}
    </div>}

    {/* No groups state */}
    {groups.length===0&&<Card style={{textAlign:"center",padding:40,marginBottom:20}}>
      <div style={{fontSize:40,marginBottom:12}}>🏀</div>
      <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:8}}>¡Empieza a competir!</div>
      <div style={{fontSize:13,color:C.dim,marginBottom:20}}>Crea un grupo o únete a uno con un código de invitación</div>
      <div style={{display:"flex",gap:10,justifyContent:"center"}}>
        <button className="btn" onClick={()=>setPanel("create")} style={{padding:"10px 20px",borderRadius:10,background:C.accent,color:"#07090f",fontSize:13,fontWeight:800}}>+ Crear Grupo</button>
        <button className="btn" onClick={()=>setPanel("join")} style={{padding:"10px 20px",borderRadius:10,background:"#FFB800",color:"#07090f",fontSize:13,fontWeight:800}}>🔗 Tengo un código</button>
      </div>
    </Card>}

    {selGroup&&(()=>{
      const histByDate=history.reduce((a,p)=>({...a,[p.game_date]:[...(a[p.game_date]||[]),p]}),{});
      const grpByGame=grpPicks.reduce((a,p)=>({...a,[p.game_id]:[...(a[p.game_id]||[]),p]}),{});
      const activeLb=lbPeriod==="season"?leaderboard:periodLb;
      return <>
      {/* Group header */}
      <Card style={{marginBottom:14,background:"linear-gradient(135deg,#0a152066,#0d1117)",borderColor:`${C.accent}33`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontSize:16,fontWeight:800,color:C.text}}>{selGroup.emoji||"🏀"} {selGroup.name}</div>
            <div style={{fontSize:11,color:C.dim,marginTop:2}}>{selGroup.memberCount||"?"} miembros · {allGames.length} partidos hoy</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center",flexWrap:"wrap"}}>
            {balance!==null&&<div style={{background:"#FFB80011",border:"1px solid #FFB80033",borderRadius:8,padding:"6px 12px",display:"flex",alignItems:"center",gap:4}}><span>🪙</span><span style={{fontSize:16,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#FFB800"}}>{balance}</span></div>}
            {shields>0&&<div style={{background:"#00C2FF11",border:"1px solid #00C2FF33",borderRadius:8,padding:"6px 10px",display:"flex",alignItems:"center",gap:4,cursor:"pointer"}} onClick={async()=>{if(!confirm(`¿Usar un escudo de racha? Te quedan ${shields}.`))return;const d=await pickemAPI("useShield",{body:{userId:user.id}});if(d.ok){setShields(d.shieldsLeft);setMsg("🛡️ Escudo usado — tu racha está protegida");}}} title="Escudo de racha"><span>🛡️</span><span style={{fontSize:13,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.accent}}>{shields}</span></div>}
            <div style={{background:"#0a1018",borderRadius:8,padding:"8px 14px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:14,fontWeight:900,letterSpacing:3,color:"#FFB800",fontFamily:"'Bebas Neue',sans-serif"}}>{selGroup.code}</span>
              <button className="btn" onClick={copyCode} style={{background:copied?"#00FF9D22":"#ffffff11",borderRadius:6,padding:"4px 10px",color:copied?"#00FF9D":C.dim,fontSize:10,fontWeight:700,border:`1px solid ${copied?"#00FF9D44":"#ffffff11"}`}}>{copied?"✓":"📋"}</button>
              <button className="btn" onClick={shareGroup} style={{background:"#ffffff11",borderRadius:6,padding:"4px 10px",color:C.dim,fontSize:10,fontWeight:700,border:"1px solid #ffffff11"}}>🔗</button>
              {selGroup.owner_id===user.id&&<button className="btn" onClick={()=>{setEditGroup(p=>!p);setEditGroupName(selGroup.name);setEditGroupEmoji(selGroup.emoji||"🏀");}} style={{background:"#ffffff11",borderRadius:6,padding:"4px 10px",color:C.dim,fontSize:10,fontWeight:700,border:"1px solid #ffffff11"}}>✏️</button>}
            </div>
          </div>
        </div>
        {myLbStats&&<div style={{display:"flex",gap:16,marginTop:14,paddingTop:12,borderTop:`1px solid ${C.border}`}}>
          {[["🏅 Pos",`#${myRank+1}`,"#FFB800"],["✅",`${myLbStats.correct_picks}/${myLbStats.total_picks}`,"#00FF9D"],["📊",`${myLbStats.accuracy}%`,C.accent],["⭐",myLbStats.total_points,"#FFB800"]].map(([l,v,c])=><div key={l}><div style={{fontSize:9,color:C.muted}}>{l}</div><div style={{fontSize:16,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:c}}>{v}</div></div>)}
        </div>}
      </Card>

      {/* Daily winner — solo cuando todos los partidos del día terminaron */}
      {dailyWinner&&games.length>0&&games.every(g=>g.status==="Final")&&<Card style={{marginBottom:14,background:"linear-gradient(135deg,#FFB80012,#0d1117)",borderColor:"#FFB80044",textAlign:"center",padding:"12px 18px"}}>
        <div style={{fontSize:9,color:"#FFB800",textTransform:"uppercase",letterSpacing:2,marginBottom:3}}>👑 Ganador del día</div>
        <div style={{fontSize:20,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.text}}>{dailyWinner.avatar_emoji||"🏀"} {dailyWinner.name}</div>
        <div style={{fontSize:11,color:C.dim}}>{dailyWinner.correct}/{dailyWinner.total} aciertos · {dailyWinner.points} pts</div>
      </Card>}

      {/* Group admin panel */}
      {editGroup&&<Card style={{marginBottom:14,borderColor:`${C.accent}44`}}>
        <div style={{fontSize:13,fontWeight:800,color:C.text,marginBottom:10}}>✏️ Editar grupo</div>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          {["🏀","🏆","🔥","⭐","🦁","🐯","🎯","💎","🚀","👑"].map(e=><button key={e} className="btn" onClick={()=>setEditGroupEmoji(e)} style={{fontSize:18,background:editGroupEmoji===e?`${C.accent}22`:"#0a1018",border:`1px solid ${editGroupEmoji===e?C.accent:C.border}`,borderRadius:8,padding:"6px 8px"}}>{e}</button>)}
        </div>
        <div style={{display:"flex",gap:8}}>
          <input value={editGroupName} onChange={e=>setEditGroupName(e.target.value)} style={{flex:1,background:"#0a1018",border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.text,fontSize:13}}/>
          <button className="btn" onClick={async()=>{const d=await pickemAPI("updateGroup",{body:{userId:user.id,groupId:selGroup.id,name:editGroupName,emoji:editGroupEmoji}});if(d.ok){setGroups(gs=>gs.map(g=>g.id===selGroup.id?{...g,name:editGroupName,emoji:editGroupEmoji}:g));setSelGroup(s=>({...s,name:editGroupName,emoji:editGroupEmoji}));setEditGroup(false);setMsg("✅ Grupo actualizado");}else setMsg(d.error);}} style={{padding:"10px 18px",borderRadius:10,background:C.accent,color:"#07090f",fontWeight:900,fontSize:13}}>Guardar</button>
        </div>
      </Card>}

      {/* Sub-tabs — ocultos en modo standalone (Apuestas/Parlay como main tab) */}
      {!standalone&&<div style={{display:"flex",gap:0,marginBottom:14,overflowX:"auto",borderBottom:`1px solid ${C.border}`}}>
        {[["picks","🎯 Picks"],["ranking","🏆 Ranking"],["historial","📅 Historial"],["grupo","👥 Grupo"],["estadisticas","📊 Stats"],["chat","💬 Chat"]].map(([id,label])=><button key={id} className="btn" onClick={()=>setSubTab(id)} style={{padding:"9px 12px",background:"transparent",borderBottom:subTab===id?`2px solid ${C.accent}`:"2px solid transparent",color:subTab===id?C.accent:C.dim,fontSize:11,fontWeight:subTab===id?700:500,whiteSpace:"nowrap"}}>{label}</button>)}
      </div>}

      {/* ─── PICKS ─── */}
      {subTab==="picks"&&<>
        {!anyStarted&&!lockedPicks&&upcoming.length>0&&<div style={{padding:"10px 14px",background:"#00C2FF11",border:"1px solid #00C2FF33",borderRadius:10,marginBottom:14,fontSize:11,color:C.accent}}>🎯 {upcoming.length} partido{upcoming.length!==1?"s":""} abierto{upcoming.length!==1?"s":""} — toca un equipo para elegir ganador</div>}
        {(anyStarted||lockedPicks)&&<div style={{padding:"10px 14px",background:"#ff444411",border:"1px solid #ff444433",borderRadius:10,marginBottom:14,fontSize:11,color:"#ff6666"}}>🔒 {anyStarted?"Un partido ya empezó — picks":"Picks"} cerrados para hoy</div>}
        {allGames.length===0?<Card style={{textAlign:"center",padding:40}}><div style={{fontSize:36,marginBottom:8}}>🌙</div><div style={{fontSize:15,fontWeight:700,color:C.text}}>No hay partidos hoy</div></Card>
        :allGames.map(g=>{
          const picked=picks[g.id];const isFinal=g.status==="Final";const isLive=g.status==="LIVE";
          const isUpcoming=g.startTime?new Date()<new Date(g.startTime):g.status==="Upcoming";
          const winner=isFinal?(g.homeScore>g.awayScore?g.home:g.away):null;
          const correct=isFinal&&picked===winner;
          const minsLeft=g.startTime&&isUpcoming?Math.max(0,Math.round((new Date(g.startTime)-new Date())/60000)):null;
          return <Card key={g.id} className={isFinal&&picked?(correct?"pick-correct":"pick-wrong"):""} style={{marginBottom:10,borderColor:isFinal?(correct?"#00FF9D33":"#ff444433"):isLive?"#ff444433":picked?`${tm(picked).color}33`:C.border}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{display:"flex",gap:6}}>
                {isLive?<Tag c="#ff4444">● LIVE {g.detail}</Tag>:isFinal?<Tag c={C.muted}>Final</Tag>
                :minsLeft!==null?(minsLeft<=1?<Tag c="#ff4444">⏱ Iniciando...</Tag>:minsLeft<=60?<Tag c={minsLeft<=15?"#ff6666":"#FF6B35"}>⏱ {minsLeft} min</Tag>:<Tag c={C.accent}>{g.detail||"Próximo"}</Tag>)
                :<Tag c={C.accent}>{g.detail||"Próximo"}</Tag>}
              </div>
              {isFinal&&picked&&(()=>{const c2=confidence[g.id]||1;const ap=picksPoints[g.id];const pPct=picked===g.home?calcWinPct(g,"home",standings):calcWinPct(g,"away",standings);return<Tag c={correct?"#00FF9D":"#ff4444"}>{correct?`✅ +${ap??dynPts(pPct,c2)} pts`:(c2>=2?`❌ ${ap??-dynPts(pPct,c2)} pts`:"❌ 0 pts")}</Tag>;})()}
              {isLive&&picked&&<Tag c={tm(picked).color}>● {picked}</Tag>}
              {isUpcoming&&picked&&<Tag c="#00FF9D">✓ {picked}</Tag>}
              {isUpcoming&&!picked&&<Tag c={C.accent}>Elige</Tag>}
              {isLive&&!picked&&<Tag c="#ff6666">Sin pick</Tag>}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:10,alignItems:"center"}}>
              {[["away",g.away,g.awayScore],["vs"],["home",g.home,g.homeScore]].map((item,idx)=>
                idx===1?<div key="vs" style={{textAlign:"center",fontSize:12,color:C.muted,fontWeight:800}}>VS</div>
                :isUpcoming&&!lockedPicks&&!anyStarted?
                  <button key={item[1]} className="btn" onClick={()=>makePick(g.id,item[1],g.home,g.away,confidence[g.id]||1,g)} style={{padding:"12px 8px",borderRadius:12,textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:4,background:picked===item[1]?`${tm(item[1]).color}18`:"transparent",border:`2px solid ${picked===item[1]?tm(item[1]).color:C.border}`,color:picked===item[1]?tm(item[1]).color:C.text,width:"100%"}}>
                    {logo(item[1],36)}<span style={{fontSize:13,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif"}}>{item[1]}</span><span style={{fontSize:10,color:C.dim}}>{tm(item[1]).name}</span>
                    <span style={{fontSize:10,fontWeight:700,color:picked===item[1]?tm(item[1]).color:"#FFB800"}}>+{dynBase(calcWinPct(g,item[0]==="away"?"away":"home",standings))} pts</span>
                  </button>
                :<div key={item[1]} style={{textAlign:"center",padding:"12px 8px",opacity:picked&&picked!==item[1]?0.4:1}}>
                    {logo(item[1],36)}<div style={{fontSize:13,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:picked===item[1]?tm(item[1]).color:C.text,marginTop:4}}>{item[1]}</div>
                    {(isFinal||isLive)&&<div style={{fontSize:20,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:isFinal&&item[1]===winner?"#00FF9D":C.text,marginTop:4}}>{item[2]}</div>}
                  </div>
              )}
            </div>
          </Card>;
        })}
      </>}

      {/* ─── RANKING ─── */}
      {subTab==="ranking"&&<>
        {/* Banner temporada */}
        {lbPeriod==="season"&&activeLb.length>=3&&<Card style={{marginBottom:12,background:"linear-gradient(135deg,#FFB80014,#0d1117)",borderColor:"#FFB80033"}}>
          <div style={{fontSize:9,color:"#FFB800",textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>🏆 Temporada 2024–25 · Top 3</div>
          <div style={{display:"flex",gap:10,justifyContent:"center",alignItems:"flex-end",marginBottom:8}}>
            {[1,0,2].map((pos)=>{
              const r=activeLb[pos];if(!r)return null;
              const h=[56,72,48][pos];
              const mc=["#FFB800","#C0C0C0","#CD7F32"];
              const medals=["🥇","🥈","🥉"];
              const rItems=r.user_id===user.id?[...shopItems,...(r.shopItems||[])]:r.shopItems||[];
              const nameClr=getNameColor(rItems,r.user_id===user.id?myEquipped:(r.equipped||{}));
              return<div key={pos} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4}}>
                <div style={{fontSize:9,fontWeight:700,color:nameClr||C.text,maxWidth:70,textAlign:"center",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.avatar_emoji||"🏀"} {r.name}</div>
                <div style={{width:h*0.75,height:h,background:`linear-gradient(180deg,${mc[pos]}22,${mc[pos]}44)`,border:`1px solid ${mc[pos]}66`,borderRadius:"8px 8px 0 0",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-start",paddingTop:6}}>
                  <div style={{fontSize:pos===0?18:14}}>{medals[pos]}</div>
                  <div style={{fontSize:pos===0?14:11,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:mc[pos],marginTop:2}}>{r.total_points??0}</div>
                </div>
              </div>;
            })}
          </div>
          <div style={{fontSize:9,color:C.dim,textAlign:"center"}}>La temporada NBA 24–25 termina en Junio 2025 — sigue acumulando puntos 🏀</div>
        </Card>}
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          {[["season","🏀 Temporada"],["month","📅 Mes"],["week","📆 Semana"]].map(([p,l])=><button key={p} className="btn" onClick={()=>setLbPeriod(p)} style={{padding:"7px 14px",borderRadius:20,background:lbPeriod===p?C.accent:"#0d1117",border:`1px solid ${lbPeriod===p?C.accent:C.border}`,color:lbPeriod===p?"#07090f":C.dim,fontWeight:700,fontSize:11}}>{l}</button>)}
        </div>
        <Card>
          <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:14}}>🏆 {lbPeriod==="week"?"Esta semana":lbPeriod==="month"?"Este mes":"Temporada"} — {selGroup.name}</div>
          {activeLb.length===0?<div style={{textAlign:"center",padding:30,color:C.dim}}>Aún no hay picks</div>
          :activeLb.map((r,i)=>{
            const isMe=r.user_id===user.id;const mc=["#FFB800","#C0C0C0","#CD7F32"];
            // Para isMe usar shopItems del state local (siempre fresco), para otros usar el del API
            const rItems=isMe?[...shopItems,...(r.shopItems||[])]:r.shopItems||[];
            const rEquipped=isMe?myEquipped:(r.equipped||{});
            const nameClr=getNameColor(rItems,rEquipped);const prefix=getNamePrefix(rItems,rEquipped);const bdClr=getBorderColor(rItems,rEquipped);
            return <div key={r.user_id||i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 8px",marginBottom:4,borderRadius:10,background:isMe?`${C.accent}11`:i<3?"#FFB80008":"transparent",border:isMe?`1px solid ${C.accent}33`:"1px solid transparent"}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:i<3?`${mc[i]}22`:"#0a1018",border:`2px solid ${bdClr||( i<3?mc[i]:C.border)}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:i<3?14:12,fontWeight:900,color:i<3?mc[i]:C.dim,flexShrink:0,boxShadow:bdClr?`0 0 8px ${bdClr}66`:undefined}}>{i<3?["🥇","🥈","🥉"][i]:i+1}</div>
              <div style={{flex:1,cursor:isMe?undefined:"pointer"}} onClick={()=>!isMe&&openProfile(r)}>
                <div style={{fontSize:13,fontWeight:isMe?800:600,color:nameClr||(isMe?C.accent:C.text)}}>{isMe?(user.avatar_emoji||"🏀"):(r.avatar_emoji||"🏀")} {prefix}{r.name||r.user_name}{isMe?" (tú)":""}</div>
                <div style={{fontSize:10,color:C.dim}}>{r.correct_picks??r.correct??0} aciertos · {r.accuracy}% precisión{(streaks[r.user_id]||0)>=3&&<span style={{fontSize:9,color:"#FF6B35",fontWeight:700}}> 🔥{streaks[r.user_id]} en racha</span>}</div>
              </div>
              <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:2}}>
                <div style={{textAlign:"right"}}><div style={{fontSize:22,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#FFB800"}}>{r.total_points??r.points??0}</div><div style={{fontSize:8,color:C.muted,letterSpacing:1}}>PTS</div></div>
                {!isMe&&<button className="btn" onClick={()=>loadH2H(r)} style={{padding:"5px 9px",borderRadius:8,background:"#00C2FF11",border:"1px solid #00C2FF33",color:C.accent,fontSize:9,fontWeight:700,marginTop:2}}>H2H</button>}
              </div>
            </div>;
          })}
        </Card>
        {h2hUser&&<Card style={{marginTop:10,borderColor:`${C.accent}44`}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:800,color:C.text}}>⚡ H2H vs {h2hUser.name||h2hUser.user_name}</div>
            <button className="btn" onClick={()=>{setH2hUser(null);setH2hData(null);}} style={{background:"none",color:C.muted,fontSize:20}}>×</button>
          </div>
          {!h2hData?<div style={{textAlign:"center",padding:20}}><Spin/></div>
          :<><div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6,textAlign:"center",marginBottom:10}}>
            {[["🏆 Tú","#00FF9D",h2hData.iWon],["👥 Ambos","#00C2FF",h2hData.bothCorrect],["😅 Ellos","#ff6666",h2hData.theyWon],["❌ Nadie",C.muted,h2hData.neither]].map(([l,c,v])=>(
              <div key={l} style={{background:"#0a1018",borderRadius:10,padding:"10px 4px"}}>
                <div style={{fontSize:22,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:c}}>{v}</div>
                <div style={{fontSize:9,color:C.muted,marginTop:2}}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:10,color:C.dim,textAlign:"center"}}>{h2hData.total} picks comparados</div></>}
        </Card>}
      </>}

      {/* ─── HISTORIAL ─── */}
      {subTab==="historial"&&(()=>{
        const allScoredPicks=history.filter(p=>p.scored);
        const totalCorrect=allScoredPicks.filter(p=>p.correct).length;
        const totalPts=allScoredPicks.reduce((s,p)=>s+(p.points||0),0);
        const overallAcc=allScoredPicks.length?Math.round(totalCorrect/allScoredPicks.length*100):0;
        return<>
          {allScoredPicks.length>0&&<Card style={{marginBottom:14,background:"linear-gradient(135deg,#00C2FF08,#0d1117)"}}>
            <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>Últimos 30 días</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:14}}>
              {[[totalCorrect+"/"+allScoredPicks.length,"Aciertos","#00FF9D"],[totalPts+" pts","Puntos","#FFB800"],[overallAcc+"%","Precisión",C.accent]].map(([v,l,c])=>(
                <div key={l} style={{background:"#0a1018",borderRadius:10,padding:"10px 8px",textAlign:"center"}}>
                  <div style={{fontSize:20,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:c}}>{v}</div>
                  <div style={{fontSize:9,color:C.muted,marginTop:2,letterSpacing:.5}}>{l}</div>
                </div>
              ))}
            </div>
            {Object.keys(histByDate).length>0&&(()=>{
              const chartData=Object.entries(histByDate).slice(-14).map(([date,dp])=>({
                day:new Date(date+"T12:00:00").toLocaleDateString("es",{weekday:"short",day:"numeric"}),
                pct:dp.length?Math.round(dp.filter(p=>p.correct).length/dp.length*100):0,
              }));
              return<ResponsiveContainer width="100%" height={100}>
                <BarChart data={chartData} margin={{top:4,right:4,left:-24,bottom:0}}>
                  <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                  <XAxis dataKey="day" tick={{fill:C.muted,fontSize:9}} axisLine={false} tickLine={false}/>
                  <YAxis domain={[0,100]} tick={{fill:C.muted,fontSize:9}} axisLine={false} tickLine={false}/>
                  <Tooltip content={({active,payload,label})=>active&&payload?.length?<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px"}}><p style={{color:C.muted,fontSize:9,marginBottom:2}}>{label}</p><p style={{color:C.accent,fontSize:12,fontWeight:700}}>{payload[0].value}% precisión</p></div>:null}/>
                  <Bar dataKey="pct" fill={C.accent} radius={[4,4,0,0]} maxBarSize={28}/>
                </BarChart>
              </ResponsiveContainer>;
            })()}
          </Card>}
          {Object.keys(histByDate).length===0?<Card style={{textAlign:"center",padding:40}}><div style={{fontSize:36,marginBottom:8}}>📅</div><div style={{fontSize:15,fontWeight:700,color:C.text}}>Sin historial aún</div><div style={{fontSize:12,color:C.dim,marginTop:6}}>Tus picks de los últimos 30 días aparecerán aquí</div></Card>
          :Object.entries(histByDate).map(([date,dayPicks])=>{
            const correct=dayPicks.filter(p=>p.correct).length;
            const pts=dayPicks.reduce((s,p)=>s+(p.points||0),0);
            return <Card key={date} style={{marginBottom:12}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontSize:12,fontWeight:700,color:C.text}}>{new Date(date+"T12:00:00").toLocaleDateString("es",{weekday:"long",month:"short",day:"numeric"})}</div>
                <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <Tag c={correct===dayPicks.length&&dayPicks.length>0?"#00FF9D":"#FFB800"}>{correct}/{dayPicks.length} ✅</Tag><Tag c={C.accent}>{pts>=0?"+":""}{pts} pts</Tag>
                <button className="btn" onClick={()=>sharePicksImage(date,dayPicks)} style={{padding:"3px 8px",borderRadius:8,background:"#ffffff11",border:"1px solid #ffffff22",color:C.dim,fontSize:10}}>📸</button>
              </div>
              </div>
              {dayPicks.map(p=><div key={p.id} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:`1px solid ${C.border}`}}>
                {logo(p.picked_team,20)}<span style={{flex:1,fontSize:12,color:C.text}}>{p.picked_team}</span>
                <span style={{fontSize:11,color:C.dim}}>vs {p.picked_team===p.home_team?p.away_team:p.home_team}</span>
                {p.confidence>1&&<Tag c={p.confidence===2?"#FFB800":"#FF6B35"}>{p.confidence}x</Tag>}
                {p.scored?<Tag c={p.correct?"#00FF9D":"#ff6666"}>{p.correct?`✅ +${p.points||0}`:`❌ ${p.points||0}`}</Tag>:<Tag c={C.muted}>Pend.</Tag>}
              </div>)}
            </Card>;
          })}
        </>;
      })()}

      {/* ─── GRUPO — apuestas del grupo ─── */}
      {subTab==="grupo"&&<>
        <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:14}}>👥 Miembros de {selGroup.name}</div>
        {leaderboard.length===0
          ?<Card style={{textAlign:"center",padding:30}}><div style={{fontSize:36,marginBottom:8}}>👥</div><div style={{fontSize:14,color:C.dim}}>Sin miembros aún</div></Card>
          :leaderboard.map((r,i)=>{
            const isMe=r.user_id===user.id;
            const rItems=isMe?[...shopItems,...(r.shopItems||[])]:r.shopItems||[];
            const rEquipped=isMe?myEquipped:(r.equipped||{});
            const nameClr=getNameColor(rItems,rEquipped);const prefix=getNamePrefix(rItems,rEquipped);const bdClr=getBorderColor(rItems,rEquipped);
            const streak=streaks[r.user_id]||0;
            return <Card key={r.user_id} style={{marginBottom:8,borderColor:isMe?`${C.accent}44`:C.border,background:isMe?`${C.accent}08`:"#0d1117"}}>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <div style={{width:44,height:44,borderRadius:"50%",background:`${bdClr||C.border}22`,border:`2px solid ${bdClr||(isMe?C.accent:C.border)}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0,boxShadow:bdClr?`0 0 10px ${bdClr}55`:undefined}}>
                  {isMe?(user.avatar_emoji||"🏀"):(r.avatar_emoji||"🏀")}
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:14,fontWeight:800,color:nameClr||(isMe?C.accent:C.text)}}>{prefix}{r.name||"?"}{isMe?" (tú)":""}</div>
                  <div style={{display:"flex",gap:10,marginTop:3}}>
                    <span style={{fontSize:10,color:C.dim}}>✅ {r.correct_picks??0} aciertos</span>
                    <span style={{fontSize:10,color:C.dim}}>📊 {r.accuracy??0}%</span>
                    {streak>=3&&<span style={{fontSize:10,color:"#FF6B35",fontWeight:700}}>🔥{streak} racha</span>}
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:24,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#FFB800"}}>{r.total_points??0}</div>
                  <div style={{fontSize:8,color:C.muted,letterSpacing:1}}>PTS</div>
                  <div style={{fontSize:10,color:i<3?["#FFB800","#C0C0C0","#CD7F32"][i]:C.muted,fontWeight:700}}>#{i+1}</div>
                </div>
              </div>
            </Card>;
          })}
      </>}

      {/* ─── APUESTAS ─── */}
      {subTab==="apuestas"&&<>
        <Card style={{marginBottom:14,background:"linear-gradient(135deg,#FFB80012,#0d1117)",borderColor:"#FFB80044",textAlign:"center",padding:"18px"}}>
          <div style={{fontSize:9,color:"#FFB800",textTransform:"uppercase",letterSpacing:2,marginBottom:4}}>Tu saldo</div>
          <div style={{fontSize:48,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#FFB800"}}>{balance!==null?balance:<Spin/>} 🪙</div>
          <div style={{fontSize:10,color:C.dim,marginTop:4}}>Empiezas con 500 · +100/día si tienes menos de 200</div>
        </Card>
        {bets.filter(b=>b.status==="pending"&&b.opponent_id===user.id).length>0&&<div style={{marginBottom:14}}>
          <div style={{fontSize:10,color:"#FFB800",textTransform:"uppercase",letterSpacing:2,fontWeight:700,marginBottom:8}}>⚡ Retos pendientes para ti</div>
          {bets.filter(b=>b.status==="pending"&&b.opponent_id===user.id).map(b=>{
            const betGameObj=games.find(g=>g.id===b.game_id);
            const gameExpired=betGameObj?betGameObj.status!=="Upcoming":true;
            return <Card key={b.id} style={{marginBottom:8,borderColor:gameExpired?"#ff444444":"#FFB80066",background:"linear-gradient(135deg,#FFB80012,#0d1117)"}}>
              <div style={{fontSize:10,color:gameExpired?"#ff6666":"#FFB800",fontWeight:700,marginBottom:6}}>{gameExpired?"⏰ Partido ya empezó — reto expirado":"⚡ ¡Te retaron!"}</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>{logo(b.picked_team,22)}<span style={{fontSize:13,fontWeight:800,color:tm(b.picked_team).color}}>{b.picked_team} gana</span></div>
                  <div style={{fontSize:11,color:C.dim}}>{b.away_team} vs {b.home_team} · <span style={{color:"#FFB800",fontWeight:700}}>🪙{b.amount}</span></div>
                </div>
                {gameExpired
                  ?<Tag c="#ff4444">Expirada</Tag>
                  :<button className="btn" onClick={()=>doAcceptBet(b)} disabled={betLoading||(balance!==null&&b.amount>balance)} style={{padding:"8px 14px",borderRadius:10,background:"#FFB80022",border:"1px solid #FFB80044",color:"#FFB800",fontSize:12,fontWeight:700}}>⚡ Aceptar reto</button>
                }
              </div>
            </Card>;
          })}
        </div>}
        {upcoming.length>0&&!betGame&&<Card style={{marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:800,color:C.text,marginBottom:10}}>🎲 Nueva apuesta — elige un partido:</div>
          {upcoming.map(g=><button key={g.id} className="btn" onClick={()=>{setBetGame(g);setBetTeam(null);}} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"10px 12px",marginBottom:6,background:"#0a1018",border:`1px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:12,fontWeight:600}}>
            {logo(g.away,18)}{g.away} vs {g.home}{logo(g.home,18)}<span style={{marginLeft:"auto",color:C.accent,fontSize:10}}>{g.detail}</span>
          </button>)}
        </Card>}
        {betGame&&<Card style={{marginBottom:14,borderColor:`${C.accent}44`}}>
          <div style={{fontSize:13,fontWeight:800,color:C.text,marginBottom:4}}>🎲 {betGame.away} vs {betGame.home} — ¿Quién gana?</div>
          {betOpponent&&betTeam&&<div style={{fontSize:10,color:C.dim,marginBottom:10,padding:"6px 10px",background:"#0a1018",borderRadius:8,border:`1px solid ${C.border}`}}>Tú apostarás por <span style={{color:tm(betTeam).color,fontWeight:700}}>{betTeam}</span> · {betOpponent.name} apostará por <span style={{color:tm(betTeam===betGame.home?betGame.away:betGame.home).color,fontWeight:700}}>{betTeam===betGame.home?betGame.away:betGame.home}</span></div>}
          {!betOpponent&&betTeam&&<div style={{fontSize:10,color:C.dim,marginBottom:10,padding:"6px 10px",background:"#0a1018",borderRadius:8,border:`1px solid ${C.border}`}}>Apostarás por <span style={{color:tm(betTeam).color,fontWeight:700}}>{betTeam}</span> · Quien acepte apostará por <span style={{color:tm(betTeam===betGame.home?betGame.away:betGame.home).color,fontWeight:700}}>{betTeam===betGame.home?betGame.away:betGame.home}</span></div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:12}}>
            {[betGame.away,betGame.home].map(team=><button key={team} className="btn" onClick={()=>setBetTeam(team)} style={{padding:"14px 8px",borderRadius:12,textAlign:"center",background:betTeam===team?`${tm(team).color}22`:"#0a1018",border:`2px solid ${betTeam===team?tm(team).color:C.border}`,color:betTeam===team?tm(team).color:C.text}}>
              {logo(team,36)}<div style={{fontSize:13,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",marginTop:4}}>{team}</div>
            </button>)}
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11,color:C.dim,marginBottom:6}}>Monto:</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              {[25,50,100,200].map(a=><button key={a} className="btn" onClick={()=>setBetAmt(a)} style={{padding:"6px 14px",borderRadius:20,background:betAmt===a?"#FFB80022":"#0a1018",border:`1px solid ${betAmt===a?"#FFB800":C.border}`,color:betAmt===a?"#FFB800":C.dim,fontSize:12,fontWeight:700}}>🪙{a}</button>)}
            </div>
          </div>
          <div style={{marginBottom:12}}>
            <div style={{fontSize:11,color:C.dim,marginBottom:8}}>⚡ Retar a (opcional):</div>
            <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
              <button className="btn" onClick={()=>setBetOpponent(null)} style={{padding:"5px 12px",borderRadius:20,background:!betOpponent?`${C.accent}22`:"#0a1018",border:`1px solid ${!betOpponent?C.accent:C.border}`,color:!betOpponent?C.accent:C.dim,fontSize:11,fontWeight:700}}>🌍 Abierta</button>
              {(selGroup?.members||[]).filter(m=>m.userId!==user.id).map(m=>(
                <button key={m.userId} className="btn" onClick={()=>setBetOpponent(m)} style={{padding:"5px 12px",borderRadius:20,background:betOpponent?.userId===m.userId?`${C.accent}22`:"#0a1018",border:`1px solid ${betOpponent?.userId===m.userId?C.accent:C.border}`,color:betOpponent?.userId===m.userId?C.accent:C.dim,fontSize:11,fontWeight:700}}>{m.avatar_emoji||"🏀"} {m.name}</button>
              ))}
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button className="btn" onClick={()=>{setBetGame(null);setBetTeam(null);setBetOpponent(null);}} style={{flex:1,padding:"12px",borderRadius:10,background:"#0a1018",border:`1px solid ${C.border}`,color:C.dim,fontSize:13,fontWeight:700}}>Cancelar</button>
            <button className="btn" onClick={betOpponent?doChallengeBet:doBet} disabled={!betTeam||betLoading||(balance!==null&&betAmt>balance)} style={{flex:2,padding:"12px",borderRadius:10,background:betTeam&&!betLoading?"linear-gradient(135deg,#FFB800,#ff9500)":"#0a1018",color:betTeam&&!betLoading?"#07090f":C.muted,fontSize:13,fontWeight:900}}>{betLoading?<Spin s={13}/>:betOpponent?`⚡ Retar a ${betOpponent.name} 🪙${betAmt}`:`Apostar 🪙${betAmt} por ${betTeam||"..."}`}</button>
          </div>
        </Card>}
        {bets.filter(b=>b.status!=="settled").length>0&&<><div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>Apuestas activas</div>
        {[...bets].filter(b=>b.status!=="settled").sort((a,b)=>{const aChallenge=a.status==="pending"&&a.opponent_id===user.id?-1:0;const bChallenge=b.status==="pending"&&b.opponent_id===user.id?-1:0;return aChallenge-bChallenge;}).map(b=>{
          const isMe=b.requester_id===user.id;const canAccept=!isMe&&b.status==="open";const isChallenge=b.status==="pending"&&b.opponent_id===user.id;
          const betGameObj=games.find(g=>g.id===b.game_id);const gameExpired=!betGameObj||betGameObj.status!=="Upcoming";
          const opponentTeam=b.home_team===b.picked_team?b.away_team:b.home_team;
          const myTeam=isMe?b.picked_team:opponentTeam;const theirTeam=isMe?opponentTeam:b.picked_team;
          return <Card key={b.id} style={{marginBottom:8,borderColor:isChallenge?"#FFB80066":b.status==="active"?"#00FF9D33":C.border,background:isChallenge?"linear-gradient(135deg,#FFB80008,#0d1117)":undefined}}>
            {isChallenge&&<div style={{fontSize:10,color:"#FFB800",fontWeight:700,marginBottom:6}}>⚡ ¡{b.requester?.name||"Alguien"} te reta!</div>}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
              <div style={{flex:1}}>
                {/* VS display: requester's team vs opponent's team */}
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>{logo(b.picked_team,22)}<span style={{fontSize:9,fontWeight:700,color:tm(b.picked_team).color}}>{b.requester?.name||"?"}</span></div>
                  <span style={{fontSize:11,color:C.muted,fontWeight:900}}>VS</span>
                  <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>{logo(opponentTeam,22)}<span style={{fontSize:9,fontWeight:700,color:tm(opponentTeam).color}}>{b.status==="active"?(b.opponent?.name||"?"):"Rival"}</span></div>
                  <div style={{flex:1}}><span style={{fontSize:12,fontWeight:800,color:isMe?tm(myTeam).color:tm(theirTeam).color}}>{isMe?`Tú: ${myTeam}`:isChallenge?`Tú: ${opponentTeam}`:""}</span></div>
                </div>
                <div style={{fontSize:10,color:C.dim}}>{b.away_team} @ {b.home_team} · <span style={{color:"#FFB800",fontWeight:700}}>🪙{b.amount}</span>{isChallenge&&` · tú apuestas por ${opponentTeam}`}</div>
              </div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {canAccept&&(gameExpired?<Tag c="#ff6666">⏰ Expirada</Tag>:<button className="btn" onClick={()=>doAcceptBet(b)} disabled={betLoading||(balance!==null&&b.amount>balance)} style={{padding:"8px 14px",borderRadius:10,background:"#00FF9D22",border:"1px solid #00FF9D44",color:"#00FF9D",fontSize:12,fontWeight:700}}>Aceptar 🤝</button>)}
                {isChallenge&&(gameExpired?<Tag c="#ff6666">⏰ Expirada</Tag>:<button className="btn" onClick={()=>doAcceptBet(b)} disabled={betLoading||(balance!==null&&b.amount>balance)} style={{padding:"8px 14px",borderRadius:10,background:"#FFB80022",border:"1px solid #FFB80044",color:"#FFB800",fontSize:12,fontWeight:700}}>⚡ Aceptar ({opponentTeam})</button>)}
                {isMe&&(b.status==="open"||b.status==="pending")&&<button className="btn" onClick={()=>doCancelBet(b)} style={{padding:"8px 14px",borderRadius:10,background:"#ff444422",border:"1px solid #ff444444",color:"#ff6666",fontSize:12,fontWeight:700}}>Cancelar</button>}
                {b.status==="active"&&<Tag c="#00FF9D">✓ Activa</Tag>}
                {b.status==="settled"&&<Tag c={b.winner_id===user.id?"#00FF9D":"#ff4444"}>{b.winner_id===user.id?"🏆 Ganaste":"❌ Perdiste"}</Tag>}
              </div>
            </div>
          </Card>;
        })}</>}
        {bets.filter(b=>b.status==="settled").length>0&&<>
          <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:10,marginTop:18}}>📜 Historial de apuestas</div>
          {bets.filter(b=>b.status==="settled").sort((a,b)=>new Date(b.updated_at||b.created_at)-new Date(a.updated_at||a.created_at)).map(b=>{
            const isMe=b.requester_id===user.id;
            const opponentTeam=b.home_team===b.picked_team?b.away_team:b.home_team;
            const myTeam=isMe?b.picked_team:opponentTeam;
            const iWon=b.winner_id===user.id;
            return <Card key={b.id} style={{marginBottom:8,borderColor:iWon?"#00FF9D33":"#ff444433",background:iWon?"linear-gradient(135deg,#00FF9D08,#0d1117)":"linear-gradient(135deg,#ff444408,#0d1117)",opacity:0.85}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:3}}>
                    {logo(myTeam,20)}<span style={{fontSize:12,fontWeight:800,color:iWon?"#00FF9D":"#ff6666"}}>{iWon?"🏆 Ganaste":"❌ Perdiste"}</span>
                  </div>
                  <div style={{fontSize:10,color:C.dim}}>{b.away_team} @ {b.home_team} · ganó <span style={{fontWeight:700,color:C.text}}>{b.actual_winner}</span></div>
                  <div style={{fontSize:10,color:C.dim,marginTop:2}}>vs {isMe?(b.opponent?.name||"rival"):(b.requester?.name||"rival")}</div>
                </div>
                <div style={{textAlign:"right"}}>
                  <div style={{fontSize:20,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:iWon?"#00FF9D":"#ff6666"}}>{iWon?`+${b.amount*2}`:`-${b.amount}`}</div>
                  <div style={{fontSize:9,color:C.muted}}>🪙 monedas</div>
                </div>
              </div>
            </Card>;
          })}
        </>}
        {bets.length===0&&upcoming.length===0&&!betGame&&<Card style={{textAlign:"center",padding:30}}><div style={{fontSize:36,marginBottom:8}}>🌙</div><div style={{fontSize:14,color:C.dim}}>No hay partidos para apostar hoy</div></Card>}
      </>}

      {/* ─── CHAT ─── */}
      {subTab==="chat"&&<>
        <div style={{display:"flex",flexDirection:"column",gap:8,marginBottom:14,maxHeight:380,overflowY:"auto"}}>
          {chat.length===0
          ?<Card style={{textAlign:"center",padding:30}}><div style={{fontSize:36}}>💬</div><div style={{fontSize:14,color:C.dim,marginTop:8}}>Sin mensajes aún</div></Card>
          :chat.map((m,i)=>{
            const isMe=m.user_id===user.id;
            return<div key={i} style={{display:"flex",gap:8,alignItems:"flex-end",flexDirection:isMe?"row-reverse":"row"}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:`${C.accent}20`,border:`1px solid ${C.accent}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{isMe?(user.avatar_emoji||"🏀"):(m.users?.avatar_emoji||"🏀")}</div>
              <div style={{maxWidth:"75%"}}>
                <div style={{fontSize:9,color:isMe?C.accent:C.muted,marginBottom:2,textAlign:isMe?"right":"left",fontWeight:700}}>{isMe?"Tú":m.users?.name}</div>
                <div style={{background:isMe?`${C.accent}22`:"#131d29",border:`1px solid ${isMe?C.accent+"44":C.border}`,borderRadius:isMe?"14px 14px 4px 14px":"14px 14px 14px 4px",padding:"8px 12px",fontSize:13,color:C.text}}>{m.content}</div>
                <div style={{fontSize:8,color:C.muted,marginTop:2,textAlign:isMe?"right":"left"}}>{new Date(m.created_at).toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"})}</div>
              </div>
            </div>;
          })}
        </div>
        <div style={{display:"flex",gap:8}}>
          <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()} placeholder="Mensaje..." style={{flex:1,background:"#0a1018",border:`1px solid ${chatInput?C.accent:C.border}`,borderRadius:12,padding:"11px 14px",color:C.text,fontSize:13}}/>
          <button className="btn" onClick={sendChat} disabled={!chatInput.trim()||chatLoading} style={{padding:"11px 16px",borderRadius:12,background:chatInput.trim()?C.accent:"#0a1018",color:chatInput.trim()?"#07090f":C.muted,fontSize:14,fontWeight:900}}>→</button>
        </div>
      </>}

      {/* ─── ESTADÍSTICAS ─── */}
      {subTab==="estadisticas"&&<>
        <button className="btn" onClick={()=>pickemAPI("checkAchievements",{params:{userId:user.id,groupId:selGroup.id}}).then(d=>{if(d.ok&&d.newAchievements?.length)setMsg(`🏅 Nuevo logro desbloqueado`);pickemAPI("getAchievements",{params:{userId:user.id}}).then(r=>{if(r.ok)setAchievements(r.achievements||[]);})})} style={{width:"100%",marginBottom:14,padding:"10px",borderRadius:10,background:`${C.accent}11`,border:`1px solid ${C.accent}33`,color:C.accent,fontSize:12,fontWeight:700}}>🔄 Verificar logros y racha</button>
        {!myStatsData?<Card style={{textAlign:"center",padding:40}}><div style={{fontSize:36}}>📊</div><div style={{fontSize:14,color:C.dim,marginTop:8}}>Aún no tienes picks con resultado</div></Card>
        :<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:14}}>
            {[["🎯 Picks totales",myStatsData.totalPicks,C.accent],["✅ Aciertos",myStatsData.totalCorrect,"#00FF9D"],["📊 Precisión",`${myStatsData.accuracy}%`,"#FFB800"],["⭐ Puntos",myStatsData.totalPoints,"#FF6B35"]].map(([l,v,c])=><Card key={l} style={{textAlign:"center",padding:"12px 8px"}}><div style={{fontSize:9,color:C.muted,marginBottom:4}}>{l}</div><div style={{fontSize:22,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:c}}>{v}</div></Card>)}
          </div>
          {myStatsData.favoriteTeam&&<Card style={{marginBottom:10}}><div style={{fontSize:10,color:C.muted,marginBottom:8,letterSpacing:1}}>EQUIPOS FAVORITOS</div>
            <div style={{display:"flex",gap:12,flexWrap:"wrap"}}>
              {[["❤️ El que más pickeaste",myStatsData.favoriteTeam],["🏆 Mejor precisión",myStatsData.bestTeam],["💀 Peor precisión",myStatsData.worstTeam]].filter(x=>x[1]).map(([label,t])=><div key={label} style={{display:"flex",alignItems:"center",gap:8,background:"#0a1018",borderRadius:10,padding:"8px 12px",flex:1,minWidth:100}}>
                {logo(t.team,28)}<div><div style={{fontSize:9,color:C.muted}}>{label}</div><div style={{fontSize:13,fontWeight:800,color:tm(t.team).color}}>{t.team}</div><div style={{fontSize:10,color:C.dim}}>{t.correct}/{t.total} · {t.acc}%</div></div>
              </div>)}
            </div>
          </Card>}
          <Card><div style={{fontSize:10,color:C.muted,marginBottom:10,letterSpacing:1}}>TOP EQUIPOS</div>
            {myStatsData.topTeams?.slice(0,8).map(t=><div key={t.team} style={{display:"flex",alignItems:"center",gap:8,marginBottom:8}}>
              {logo(t.team,20)}<span style={{fontSize:11,fontWeight:700,color:tm(t.team).color,width:36}}>{t.team}</span>
              <div style={{flex:1,height:6,borderRadius:3,background:C.border,overflow:"hidden"}}><div style={{width:`${t.acc}%`,height:"100%",background:`linear-gradient(90deg,${tm(t.team).color},${tm(t.team).color}aa)`}}/></div>
              <span style={{fontSize:10,color:C.dim,width:60,textAlign:"right"}}>{t.correct}/{t.total} · {t.acc}%</span>
            </div>)}
          </Card>
        </>}
      </>}

      {/* ─── PARLAY ─── */}
      {subTab==="parlay"&&(()=>{
        const weekGames=upcoming.filter(g=>g.startTime);
        const saveParlay=async()=>{
          const picks=Object.entries(parlaySelections).map(([gameId,pickedTeam])=>{const g=allGames.find(x=>x.id===gameId);return{game_id:gameId,picked_team:pickedTeam,home_team:g?.home,away_team:g?.away,game_date:new Date().toISOString().split("T")[0]};});
          if(picks.length<3||picks.length>5){setMsg("Selecciona entre 3 y 5 juegos");return;}
          setParlayLoading(true);
          const d=await pickemAPI("createParlay",{body:{userId:user.id,groupId:selGroup.id,parlayPicks:picks}});
          if(d.ok){setMsg("🎰 ¡Parlay guardado!");pickemAPI("myParlay",{params:{userId:user.id,groupId:selGroup.id}}).then(r=>{if(r.ok)setParlay(r.parlay);});}
          else setMsg(d.error);
          setParlayLoading(false);
        };
        return <>
          <Card style={{marginBottom:14,background:"linear-gradient(135deg,#FFB80008,#0d1117)",borderColor:"#FFB80033"}}>
            <div style={{fontSize:13,fontWeight:800,color:"#FFB800",marginBottom:4}}>🎰 Parlay de la semana</div>
            <div style={{fontSize:11,color:C.dim,marginBottom:0}}>Selecciona 3-5 partidos. Si aciertas TODOS → bonus 🪙 (30 por pick). Se resetea cada semana.</div>
          </Card>
          {parlay?<>
            <Card style={{marginBottom:14,borderColor:parlay.status==="won"?"#00FF9D44":parlay.status==="lost"?"#ff444444":"#FFB80044"}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <div style={{fontSize:13,fontWeight:800,color:C.text}}>Tu parlay esta semana</div>
                <Tag c={parlay.status==="won"?"#00FF9D":parlay.status==="lost"?"#ff4444":"#FFB800"}>{parlay.status==="won"?"🏆 Ganó":parlay.status==="lost"?"❌ Perdió":"⏳ En curso"}</Tag>
              </div>
              {(parlay.picks||[]).map((p,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6,padding:"6px 10px",background:"#0a1018",borderRadius:8}}>
                {logo(p.picked_team,20)}<span style={{fontSize:12,fontWeight:700,color:tm(p.picked_team).color,flex:1}}>{p.picked_team}</span>
                <span style={{fontSize:10,color:C.dim}}>{p.away_team} @ {p.home_team}</span>
                {p.scored?<Tag c={p.correct?"#00FF9D":"#ff4444"}>{p.correct?"✅":""}</Tag>:<Tag c="#FFB800">⏳</Tag>}
              </div>)}
              {parlay.status==="won"&&<div style={{marginTop:8,fontSize:13,color:"#00FF9D",fontWeight:800,textAlign:"center"}}>🎉 ¡Ganaste 🪙{parlay.bonus_earned}!</div>}
              <button className="btn" onClick={()=>setParlay(null)} style={{width:"100%",marginTop:8,padding:"8px",borderRadius:8,background:"#0a1018",border:`1px solid ${C.border}`,color:C.muted,fontSize:11}}>Cambiar selecciones</button>
            </Card>
          </>:<>
            {weekGames.length===0?<Card style={{textAlign:"center",padding:40}}><div style={{fontSize:36}}>🌙</div><div style={{fontSize:14,color:C.dim}}>No hay partidos próximos disponibles</div></Card>
            :<><div style={{fontSize:10,color:C.muted,marginBottom:10,letterSpacing:1}}>ELIGE TUS {Object.keys(parlaySelections).length}/5 JUEGOS ({Math.min(Object.keys(parlaySelections).length,5)>=3?`✅ ${Object.keys(parlaySelections).length} seleccionados`:"mín. 3"}):</div>
            {weekGames.map(g=><Card key={g.id} style={{marginBottom:8,borderColor:parlaySelections[g.id]?`${tm(parlaySelections[g.id]).color}44`:C.border}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:8}}>
                <span style={{fontSize:10,color:C.muted}}>{g.away} @ {g.home}</span>
                <div style={{display:"flex",gap:6}}>
                  {[g.away,g.home].map(t=><button key={t} className="btn" onClick={()=>setParlaySelections(s=>{if(s[g.id]===t){const n={...s};delete n[g.id];return n;}if(Object.keys(s).length>=5&&!s[g.id]){setMsg("Máximo 5 juegos en el parlay");return s;}return {...s,[g.id]:t};})} style={{padding:"6px 12px",borderRadius:8,background:parlaySelections[g.id]===t?`${tm(t).color}22`:"#0a1018",border:`1.5px solid ${parlaySelections[g.id]===t?tm(t).color:C.border}`,color:parlaySelections[g.id]===t?tm(t).color:C.text,fontSize:11,fontWeight:700,display:"flex",alignItems:"center",gap:5}}>{logo(t,16)}{t}</button>)}
                </div>
              </div>
            </Card>)}
            <button className="btn" onClick={saveParlay} disabled={Object.keys(parlaySelections).length<3||parlayLoading} style={{width:"100%",padding:"13px",borderRadius:12,background:Object.keys(parlaySelections).length>=3?"linear-gradient(135deg,#FFB800,#ff9500)":"#0a1018",color:Object.keys(parlaySelections).length>=3?"#07090f":C.muted,fontSize:14,fontWeight:900,marginTop:6}}>{parlayLoading?<Spin s={13}/>:`🎰 Guardar parlay (${Object.keys(parlaySelections).length} picks)`}</button>
            </>}
          </>}
        </>;
      })()}

    </>;
    })()}

    <Card style={{marginTop:18,background:"#0a1018"}}>
      <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>Sistema de Puntos</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        {[["✅ 1x","10 pts"],["🔥 2x","20 pts"],["⚡ 3x","30 pts"]].map(([l,v])=><div key={l} style={{background:C.card,borderRadius:9,padding:"10px",textAlign:"center"}}><div style={{fontSize:10,color:C.dim,marginBottom:4}}>{l}</div><div style={{fontSize:15,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.accent}}>{v}</div></div>)}
      </div>
    </Card>

    {/* ─── PROFILE MODAL ─── */}
    {profileModal&&(()=>{
      const pItems=profileData?.shopItems||[];
      const pNameClr=getNameColor(pItems);
      const pPrefix=getNamePrefix(pItems);
      const pBorder=getBorderColor(pItems);
      const curStreak=streaks[profileModal.user_id]||0;
      return<div style={{position:"fixed",inset:0,zIndex:2000,background:"#000000bb",display:"flex",alignItems:"flex-end"}} onClick={()=>{setProfileModal(null);setProfileData(null);}}>
        <div style={{background:C.card,borderRadius:"20px 20px 0 0",padding:24,width:"100%",maxHeight:"80vh",overflowY:"auto",border:`1px solid ${C.border}`}} onClick={e=>e.stopPropagation()}>
          {/* Header */}
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
            <div style={{display:"flex",alignItems:"center",gap:12}}>
              <div style={{width:56,height:56,borderRadius:"50%",background:`${C.accent}20`,border:`2px solid ${pBorder||C.accent+"44"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0,boxShadow:pBorder?`0 0 12px ${pBorder}55`:undefined}}>{profileModal.avatar_emoji||"🏀"}</div>
              <div>
                <div style={{fontSize:22,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:pNameClr||C.text}}>{pPrefix}{profileModal.name||profileModal.user_name}</div>
                <div style={{display:"flex",gap:8,flexWrap:"wrap",marginTop:3}}>
                  {curStreak>=3&&<span style={{fontSize:11,color:"#FF6B35",fontWeight:700}}>🔥 {curStreak} en racha</span>}
                  {profileData?.stats?.bestStreak>=5&&<span style={{fontSize:11,color:"#FFB800",fontWeight:700}}>⚡ Mejor: {profileData.stats.bestStreak}</span>}
                  {pItems.length>0&&<span style={{fontSize:11,color:"#9B59B6",fontWeight:700}}>💎 {pItems.length} items</span>}
                </div>
              </div>
            </div>
            <button className="btn" onClick={()=>{setProfileModal(null);setProfileData(null);}} style={{background:"none",color:C.muted,fontSize:24,lineHeight:1}}>×</button>
          </div>

          {!profileData?<div style={{textAlign:"center",padding:30}}><Spin/></div>:<>
            {/* Stats */}
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6,marginBottom:14}}>
              {[["🎯",profileData.stats?.totalPicks||0,"Picks",C.accent],["✅",profileData.stats?.totalCorrect||0,"Aciertos","#00FF9D"],["📊",`${profileData.stats?.accuracy||0}%`,"Precisión","#FFB800"],["⭐",profileData.stats?.totalPoints||0,"Puntos","#FF6B35"],["🔥",profileData.stats?.bestStreak||0,"Mejor racha","#FF6B35"]].map(([icon,v,l,c])=><div key={l} style={{background:"#0a1018",borderRadius:10,padding:"10px 4px",textAlign:"center"}}>
                <div style={{fontSize:10,marginBottom:2}}>{icon}</div>
                <div style={{fontSize:16,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:c}}>{v}</div>
                <div style={{fontSize:8,color:C.muted,marginTop:1,lineHeight:1.2}}>{l}</div>
              </div>)}
            </div>

            {/* Cosmetics owned */}
            {pItems.length>0&&<div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>Items de tienda</div>
              <div style={{display:"flex",gap:5,flexWrap:"wrap"}}>
                {pItems.map(key=>{
                  const def=SHOP_ITEMS.find(i=>i.key===key);
                  return def?<div key={key} style={{background:"#0d1117",border:`1px solid ${C.border}`,borderRadius:16,padding:"4px 8px",fontSize:11,display:"flex",alignItems:"center",gap:3}}>
                    <span>{def.emoji}</span><span style={{color:C.dim}}>{def.name.replace("Título ","").replace("Nombre ","").replace("Marco ","")}</span>
                  </div>:null;
                })}
              </div>
            </div>}

            {/* Top teams */}
            {(profileData.stats?.topTeams||[]).length>0&&<div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>Equipos favoritos</div>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {profileData.stats.topTeams.slice(0,5).map(t=><div key={t.team} style={{background:`${tm(t.team).color}18`,border:`1px solid ${tm(t.team).color}44`,borderRadius:20,padding:"5px 10px",display:"flex",alignItems:"center",gap:6}}>
                  {logo(t.team,18)}<span style={{fontSize:11,fontWeight:700,color:tm(t.team).color}}>{t.team}</span><span style={{fontSize:9,color:C.dim}}>{t.acc}%</span>
                </div>)}
              </div>
            </div>}

            {/* Achievements */}
            {profileData.achievements?.filter(a=>!a.achievement_key.startsWith("shop_")).length>0&&<div style={{marginBottom:14}}>
              <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:1.5,marginBottom:8}}>Logros</div>
              <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
                {profileData.achievements.filter(a=>!a.achievement_key.startsWith("shop_")).map(a=>{
                  const def=ACHIEVEMENT_DEFS.find(d=>d.key===a.achievement_key);
                  return def?<div key={a.achievement_key} style={{background:`${def.color||C.accent}18`,border:`1px solid ${def.color||C.accent}44`,borderRadius:10,padding:"6px 10px",textAlign:"center"}} title={def.desc}>
                    <div style={{fontSize:18}}>{def.emoji}</div>
                    <div style={{fontSize:9,color:C.dim,marginTop:2}}>{def.name}</div>
                  </div>:null;
                })}
              </div>
            </div>}

            <div style={{display:"flex",gap:8,marginTop:14}}>
              <button className="btn" onClick={()=>loadH2H(profileModal)} style={{flex:1,padding:"10px",borderRadius:10,background:`${C.accent}22`,border:`1px solid ${C.accent}44`,color:C.accent,fontSize:12,fontWeight:700}}>⚡ Ver H2H</button>
            </div>
          </>}
        </div>
      </div>;
    })()}
  </div>);
};

/* ═══ BRACKET TAB ═══ */
/* ═══ BRACKET TAB v2 (full playoff predictions) ═══ */

const SERIES_OPTS=["4-0","4-1","4-2","4-3"];
const MVP_CANDIDATES=[
  {name:"Shai Gilgeous-Alexander",team:"OKC"},{name:"Luka Dončić",team:"LAL"},{name:"Jaylen Brown",team:"BOS"},
  {name:"Cade Cunningham",team:"DET"},{name:"Donovan Mitchell",team:"CLE"},{name:"Nikola Jokić",team:"DEN"},
  {name:"Victor Wembanyama",team:"SAS"},{name:"Giannis Antetokounmpo",team:"MIL"},{name:"Anthony Edwards",team:"MIN"},
  {name:"Jayson Tatum",team:"BOS"},{name:"Jalen Brunson",team:"NYK"},{name:"Stephen Curry",team:"GSW"},
  {name:"Kevin Durant",team:"HOU"},{name:"Kawhi Leonard",team:"LAC"},{name:"Tyrese Maxey",team:"PHI"},
  {name:"Scottie Barnes",team:"TOR"},{name:"Devin Booker",team:"PHX"},{name:"Paolo Banchero",team:"ORL"},
];

const BracketTab=({userCtx,standings})=>{
  const east=standings.filter(t=>t.conf==="E").sort((a,b)=>b.w-a.w);
  const west=standings.filter(t=>t.conf==="W").sort((a,b)=>b.w-a.w);
  const SEEDS_E=east.slice(0,10).map((t,i)=>({seed:i+1,s:t.abbr,c:tm(t.abbr).color}));
  const SEEDS_W=west.slice(0,10).map((t,i)=>({seed:i+1,s:t.abbr,c:tm(t.abbr).color}));
  const maxGP=Math.max(...standings.map(t=>t.w+t.l));
  const seasonOver=maxGP>=82;
  const {user}=userCtx;
  const [picks,setPicks]=useState({});
  const [games,setGames]=useState({});
  const [mvp,setMvp]=useState(null);
  const [mvpSearch,setMvpSearch]=useState("");
  const [lb,setLb]=useState([]);
  const [subTab,setSubTab]=useState("bracket");
  const [saving,setSaving]=useState(false);
  const [lastSaved,setLastSaved]=useState("");

  // Load picks on mount
  useEffect(()=>{
    if(!user) return;
    pickemAPI("myBracketPicks",{params:{userId:user.id}}).then(d=>{
      if(d.ok){
        const map={};const gm={};
        (d.picks||[]).forEach(p=>{map[p.matchup_id]=p.predicted_winner;gm[p.matchup_id]=p.predicted_games;});
        setPicks(map);setGames(gm);
      }
    });
    pickemAPI("myMvpPick",{params:{userId:user.id}}).then(d=>{
      if(d.ok&&d.pick)setMvp(d.pick);
    });
    pickemAPI("bracketLeaderboard").then(d=>{if(d.ok)setLb(d.leaderboard||[]);});
  },[user]);

  const savePick=async(matchupId,round,teamA,teamB,winner,numGames)=>{
    if(!user) return;
    setPicks(p=>({...p,[matchupId]:winner}));
    setGames(g=>({...g,[matchupId]:numGames||4}));
    setSaving(true);
    await pickemAPI("bracketPick",{body:{userId:user.id,matchupId,round,teamA,teamB,predictedWinner:winner,predictedGames:numGames||4}});
    setSaving(false);
    setLastSaved(matchupId);
    setTimeout(()=>setLastSaved(""),1500);
  };

  const saveMvp=async(playerName,playerTeam)=>{
    if(!user) return;
    setMvp({player_name:playerName,player_team:playerTeam});
    await pickemAPI("mvpPick",{body:{userId:user.id,playerName,playerTeam}});
  };

  const getTeam=(abbr)=>{
    const all=[...SEEDS_E,...SEEDS_W];
    return all.find(t=>t.s===abbr)||{s:abbr,c:C.muted,seed:"?"};
  };

  // ─── MATCHUP COMPONENT ───
  const Matchup=({id,round,t1,t2,label})=>{
    const picked=picks[id];
    const numGames=games[id]||4;
    const just_saved=lastSaved===id;
    if(!t1||!t2) return(
      <div style={{marginBottom:12,padding:12,background:"#0a1018",borderRadius:10,border:`1px solid ${C.border}`,opacity:.5}}>
        <div style={{fontSize:9,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>{label||"Por definir"}</div>
        <div style={{textAlign:"center",padding:10,color:C.dim,fontSize:11}}>Elige las series anteriores primero</div>
      </div>
    );
    return(
      <div style={{marginBottom:12,padding:12,background:just_saved?"#00FF9D08":"#0a1018",borderRadius:10,border:`1px solid ${just_saved?"#00FF9D44":picked?getTeam(picked).c+"44":C.border}`,transition:"all .3s"}}>
        <div style={{fontSize:9,color:C.muted,marginBottom:8,textTransform:"uppercase",letterSpacing:1,display:"flex",justifyContent:"space-between"}}>
          <span>{label||round}</span>
          {just_saved&&<span style={{color:"#00FF9D"}}>✓ Guardado</span>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:8}}>
          {[t1,t2].map(t=>{
            const team=getTeam(t);const sel=picked===t;
            return <button key={t} className="btn" onClick={()=>savePick(id,round,t1,t2,t,numGames)} style={{
              padding:"10px 6px",borderRadius:10,display:"flex",flexDirection:"column",alignItems:"center",gap:4,
              background:sel?`${team.c}18`:C.card,border:`2px solid ${sel?team.c:C.border}`,color:sel?team.c:C.text,width:"100%"
            }}>
              {logo(t,28)}
              <span style={{fontSize:13,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif"}}>{t}</span>
              <span style={{fontSize:9,color:C.dim}}>({team.seed}) {tm(t).name}</span>
            </button>;
          })}
        </div>
        {picked&&<div>
          <div style={{fontSize:9,color:C.muted,marginBottom:4}}>Score de la serie:</div>
          <div style={{display:"flex",gap:4}}>
            {SERIES_OPTS.map(opt=>{
              const n=parseInt(opt.split("-")[1])+4-parseInt(opt.split("-")[1]);
              const gamesVal=parseInt(opt.split("-")[0])+parseInt(opt.split("-")[1]);
              const isSel=numGames===gamesVal;
              return <button key={opt} className="btn" onClick={()=>savePick(id,round,t1,t2,picked,gamesVal)} style={{
                flex:1,padding:"6px 2px",borderRadius:7,fontSize:12,fontWeight:isSel?800:500,
                background:isSel?`${getTeam(picked).c}22`:C.card,border:`1px solid ${isSel?getTeam(picked).c:C.border}`,
                color:isSel?getTeam(picked).c:C.dim
              }}>{opt}</button>;
            })}
          </div>
        </div>}
      </div>
    );
  };

  // ─── PLAY-IN MATCHUP (no series score) ───
  const PlayInMatchup=({id,round,t1,t2,label})=>{
    const picked=picks[id];
    if(!t1||!t2) return null;
    return(
      <div style={{marginBottom:8,padding:10,background:"#0a1018",borderRadius:10,border:`1px solid ${picked?getTeam(picked).c+"44":C.border}`}}>
        <div style={{fontSize:9,color:C.muted,marginBottom:6,textTransform:"uppercase",letterSpacing:1}}>{label}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
          {[t1,t2].map(t=>{
            const team=getTeam(t);const sel=picked===t;
            return <button key={t} className="btn" onClick={()=>savePick(id,round,t1,t2,t,1)} style={{
              padding:"8px",borderRadius:8,display:"flex",alignItems:"center",gap:6,justifyContent:"center",
              background:sel?`${team.c}18`:C.card,border:`2px solid ${sel?team.c:C.border}`,color:sel?team.c:C.text
            }}>
              {logo(t,22)}<span style={{fontSize:12,fontWeight:800}}>{t}</span>
            </button>;
          })}
        </div>
      </div>
    );
  };

  // Derive matchups from picks
  const piE78=picks["pi-e-78"];const piE910=picks["pi-e-910"];const piEfinal=picks["pi-e-final"];
  const piW78=picks["pi-w-78"];const piW910=picks["pi-w-910"];const piWfinal=picks["pi-w-final"];
  const e7=piE78||null;const e8=piEfinal||null;
  const w7=piW78||null;const w8=piWfinal||null;

  const r1eW=[[SEEDS_E[0].s,e8],[SEEDS_E[3].s,SEEDS_E[4].s],[SEEDS_E[1].s,e7],[SEEDS_E[2].s,SEEDS_E[5].s]];
  const r1wW=[[SEEDS_W[0].s,w8],[SEEDS_W[3].s,SEEDS_W[4].s],[SEEDS_W[1].s,w7],[SEEDS_W[2].s,SEEDS_W[5].s]];

  const sf_e1=picks["r1-e-0"]||null;const sf_e2=picks["r1-e-1"]||null;
  const sf_e3=picks["r1-e-2"]||null;const sf_e4=picks["r1-e-3"]||null;
  const sf_w1=picks["r1-w-0"]||null;const sf_w2=picks["r1-w-1"]||null;
  const sf_w3=picks["r1-w-2"]||null;const sf_w4=picks["r1-w-3"]||null;

  const cf_e1=picks["sf-e-0"]||null;const cf_e2=picks["sf-e-1"]||null;
  const cf_w1=picks["sf-w-0"]||null;const cf_w2=picks["sf-w-1"]||null;

  const fin_e=picks["cf-e"]||null;const fin_w=picks["cf-w"]||null;
  const champion=picks["finals"]||null;

  if(!user) return(<div className="fade-up">
    <ST sub="Bracket 2026">Inicia sesión primero</ST>
    <Card style={{textAlign:"center",padding:30,color:C.dim}}>Ve al tab Pick'em para crear tu perfil y después regresa aquí</Card>
  </div>);

  // Count picks
  const totalPicks=Object.keys(picks).length;

  return(<div className="fade-up">
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:6}}>
      <div><div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2}}>NBA Playoffs 2026</div><div style={{fontSize:22,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.text}}>Bracket Challenge 🏆</div></div>
      <div style={{textAlign:"right"}}><div style={{fontSize:9,color:C.muted}}>Predicciones</div><div style={{fontSize:20,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.accent}}>{totalPicks}</div></div>
    </div>
    {!seasonOver&&<Card style={{marginBottom:16,background:"#FFB80011",borderColor:"#FFB80033",textAlign:"center",padding:"30px 20px"}}>
      <div style={{fontSize:40,marginBottom:10}}>🏀</div>
      <div style={{fontSize:18,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#FFB800",marginBottom:6}}>TEMPORADA EN CURSO</div>
      <div style={{fontSize:13,color:C.dim,marginBottom:8}}>Los playoffs se desbloquean cuando terminen los 82 partidos de temporada regular</div>
      <div style={{fontSize:28,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.accent}}>{maxGP} / 82</div>
      <div style={{fontSize:10,color:C.muted,marginTop:4}}>partidos jugados por el equipo líder</div>
    </Card>}

    {/* Sub tabs */}
    {seasonOver&&<><div style={{display:"flex",gap:0,marginBottom:16}}>
      {[["bracket","🏀 Mi Bracket"],["mvp","🌟 MVP"],["ranking","🏆 Ranking"]].map(([id,label])=><button key={id} className="btn" onClick={()=>setSubTab(id)} style={{padding:"9px 18px",background:"transparent",borderBottom:subTab===id?`2px solid ${C.accent}`:"2px solid transparent",color:subTab===id?C.accent:C.dim,fontSize:12,fontWeight:subTab===id?700:500}}>{label}</button>)}
    </div>

    {subTab==="bracket"&&<>
      {/* ─── PLAY-IN ─── */}
      <Card style={{marginBottom:16}}>
        <div style={{fontSize:12,fontWeight:800,color:"#FFB800",textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>⚡ Play-In Tournament</div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(250px,1fr))",gap:14}}>
          <div>
            <div style={{fontSize:10,color:C.dim,fontWeight:700,marginBottom:8}}>Este</div>
            <PlayInMatchup id="pi-e-78" round="playin" t1={SEEDS_E[6].s} t2={SEEDS_E[7].s} label="7 vs 8 → Gana = #7"/>
            <PlayInMatchup id="pi-e-910" round="playin" t1={SEEDS_E[8].s} t2={SEEDS_E[9].s} label="9 vs 10 → Pierde eliminado"/>
            {piE78&&piE910&&<PlayInMatchup id="pi-e-final" round="playin"
              t1={piE78===SEEDS_E[6].s?SEEDS_E[7].s:SEEDS_E[6].s}
              t2={piE910} label="Perdedor 7v8 vs Ganador 9v10 → #8"/>}
          </div>
          <div>
            <div style={{fontSize:10,color:C.dim,fontWeight:700,marginBottom:8}}>Oeste</div>
            <PlayInMatchup id="pi-w-78" round="playin" t1={SEEDS_W[6].s} t2={SEEDS_W[7].s} label="7 vs 8 → Gana = #7"/>
            <PlayInMatchup id="pi-w-910" round="playin" t1={SEEDS_W[8].s} t2={SEEDS_W[9].s} label="9 vs 10 → Pierde eliminado"/>
            {piW78&&piW910&&<PlayInMatchup id="pi-w-final" round="playin"
              t1={piW78===SEEDS_W[6].s?SEEDS_W[7].s:SEEDS_W[6].s}
              t2={piW910} label="Perdedor 7v8 vs Ganador 9v10 → #8"/>}
          </div>
        </div>
      </Card>

      {/* ─── FIRST ROUND ─── */}
      <Card style={{marginBottom:16}}>
        <div style={{fontSize:12,fontWeight:800,color:"#00C2FF",textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>🏀 Primera Ronda</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div>
            <div style={{fontSize:10,color:C.dim,fontWeight:700,marginBottom:8}}>Este</div>
            {r1eW.map(([a,b],i)=><Matchup key={`r1-e-${i}`} id={`r1-e-${i}`} round="r1" t1={a} t2={b} label={`(${getTeam(a).seed}) ${a} vs (${b?getTeam(b).seed:"?"}) ${b||"TBD"}`}/>)}
          </div>
          <div>
            <div style={{fontSize:10,color:C.dim,fontWeight:700,marginBottom:8}}>Oeste</div>
            {r1wW.map(([a,b],i)=><Matchup key={`r1-w-${i}`} id={`r1-w-${i}`} round="r1" t1={a} t2={b} label={`(${getTeam(a).seed}) ${a} vs (${b?getTeam(b).seed:"?"}) ${b||"TBD"}`}/>)}
          </div>
        </div>
      </Card>

      {/* ─── SEMIFINALS ─── */}
      <Card style={{marginBottom:16}}>
        <div style={{fontSize:12,fontWeight:800,color:"#9B59B6",textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>🔥 Semifinales</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div>
            <div style={{fontSize:10,color:C.dim,fontWeight:700,marginBottom:8}}>Este</div>
            <Matchup id="sf-e-0" round="semis" t1={sf_e1} t2={sf_e2} label={`${sf_e1||"?"} vs ${sf_e2||"?"}`}/>
            <Matchup id="sf-e-1" round="semis" t1={sf_e3} t2={sf_e4} label={`${sf_e3||"?"} vs ${sf_e4||"?"}`}/>
          </div>
          <div>
            <div style={{fontSize:10,color:C.dim,fontWeight:700,marginBottom:8}}>Oeste</div>
            <Matchup id="sf-w-0" round="semis" t1={sf_w1} t2={sf_w2} label={`${sf_w1||"?"} vs ${sf_w2||"?"}`}/>
            <Matchup id="sf-w-1" round="semis" t1={sf_w3} t2={sf_w4} label={`${sf_w3||"?"} vs ${sf_w4||"?"}`}/>
          </div>
        </div>
      </Card>

      {/* ─── CONFERENCE FINALS ─── */}
      <Card style={{marginBottom:16}}>
        <div style={{fontSize:12,fontWeight:800,color:"#E74C3C",textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>💎 Finales de Conferencia</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          <div>
            <div style={{fontSize:10,color:C.dim,fontWeight:700,marginBottom:8}}>Final Este</div>
            <Matchup id="cf-e" round="conf_finals" t1={cf_e1} t2={cf_e2} label={`${cf_e1||"?"} vs ${cf_e2||"?"}`}/>
          </div>
          <div>
            <div style={{fontSize:10,color:C.dim,fontWeight:700,marginBottom:8}}>Final Oeste</div>
            <Matchup id="cf-w" round="conf_finals" t1={cf_w1} t2={cf_w2} label={`${cf_w1||"?"} vs ${cf_w2||"?"}`}/>
          </div>
        </div>
      </Card>

      {/* ─── NBA FINALS ─── */}
      <Card style={{marginBottom:16,background:"linear-gradient(135deg,#FFB80008,#0d1117)",borderColor:"#FFB80044"}}>
        <div style={{fontSize:14,fontWeight:900,color:"#FFB800",textTransform:"uppercase",letterSpacing:2,marginBottom:14,textAlign:"center"}}>🏆 NBA Finals 2026</div>
        <Matchup id="finals" round="finals" t1={fin_e} t2={fin_w} label={`${fin_e||"Campeón Este"} vs ${fin_w||"Campeón Oeste"}`}/>
        {champion&&<div style={{textAlign:"center",marginTop:8}}>
          <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2}}>Tu campeón</div>
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10,marginTop:6}}>
            {logo(champion,48)}
            <div style={{fontSize:32,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#FFB800"}}>{champion}</div>
          </div>
          <div style={{fontSize:12,color:C.dim,marginTop:4}}>{tm(champion).name}</div>
        </div>}
      </Card>

      {/* Points explanation */}
      <Card style={{background:"#0a1018"}}>
        <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>Puntos del Bracket</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr 1fr",gap:6}}>
          {[["✅ Ganador","10 pts"],["🎯 Score exacto","+5 bonus"],["🏆 Campeón","+15 bonus"],["🌟 MVP","15 pts"]].map(([l,v])=>
            <div key={l} style={{background:C.card,borderRadius:9,padding:8,textAlign:"center"}}>
              <div style={{fontSize:9,color:C.dim,marginBottom:3}}>{l}</div>
              <div style={{fontSize:13,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#FFB800"}}>{v}</div>
            </div>
          )}
        </div>
      </Card>
    </>}

    {/* ─── MVP SUB-TAB ─── */}
    {subTab==="mvp"&&<Card>
      <div style={{fontSize:14,fontWeight:800,color:"#FFB800",textTransform:"uppercase",letterSpacing:2,marginBottom:16,textAlign:"center"}}>🌟 MVP de las Finales</div>
      {mvp&&<div style={{textAlign:"center",marginBottom:16,padding:16,background:`${tm(mvp.player_team).color}11`,borderRadius:12,border:`1px solid ${tm(mvp.player_team).color}33`}}>
        <div style={{fontSize:10,color:C.muted,marginBottom:4}}>Tu predicción actual</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
          {logo(mvp.player_team,36)}
          <div><div style={{fontSize:20,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#FFB800"}}>{mvp.player_name}</div><div style={{fontSize:11,color:C.dim}}>{tm(mvp.player_team).name}</div></div>
        </div>
      </div>}
      <div style={{fontSize:11,color:C.dim,marginBottom:10}}>Elige quién será el MVP de las Finales (puedes cambiar hasta que empiecen):</div>
      <input value={mvpSearch} onChange={e=>setMvpSearch(e.target.value)} placeholder="🔍 Buscar jugador..." style={{width:"100%",background:"#0a1018",border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.text,fontSize:13,marginBottom:12}}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6}}>
        {MVP_CANDIDATES.filter(p=>!mvpSearch||p.name.toLowerCase().includes(mvpSearch.toLowerCase())||p.team.toLowerCase().includes(mvpSearch.toLowerCase())).map(p=>{
          const sel=mvp?.player_name===p.name;
          return <button key={p.name} className="btn" onClick={()=>saveMvp(p.name,p.team)} style={{
            padding:"10px",borderRadius:10,display:"flex",alignItems:"center",gap:8,
            background:sel?`${tm(p.team).color}18`:C.card,border:`2px solid ${sel?tm(p.team).color:C.border}`,
            color:sel?tm(p.team).color:C.text,textAlign:"left"
          }}>
            {logo(p.team,24)}
            <div><div style={{fontSize:12,fontWeight:sel?800:600}}>{sel&&"✓ "}{p.name}</div><div style={{fontSize:9,color:C.dim}}>{tm(p.team).name}</div></div>
          </button>;
        })}
      </div>
    </Card>}

    {/* ─── RANKING SUB-TAB ─── */}
    {subTab==="ranking"&&<Card>
      <div style={{fontSize:12,fontWeight:800,color:"#FFB800",textTransform:"uppercase",letterSpacing:2,marginBottom:14}}>🏆 Ranking Global de Brackets</div>
      {lb.length===0?<div style={{textAlign:"center",padding:30,color:C.dim}}>Aún no hay predicciones calificadas</div>
      :lb.map((r,i)=>{
        const isMe=r.user_id===user.id;
        const medals=["#FFB800","#C0C0C0","#CD7F32"];
        return <div key={r.user_id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 8px",marginBottom:4,borderRadius:10,
          background:isMe?`${C.accent}11`:i<3?`${medals[i]}08`:"transparent",border:isMe?`1px solid ${C.accent}33`:"1px solid transparent"}}>
          <div style={{width:32,height:32,borderRadius:"50%",background:i<3?`${medals[i]}22`:"#0a1018",border:`2px solid ${i<3?medals[i]:C.border}`,
            display:"flex",alignItems:"center",justifyContent:"center",fontSize:i<3?14:12,fontWeight:900,color:i<3?medals[i]:C.dim,flexShrink:0}}>
            {i<3?["🥇","🥈","🥉"][i]:i+1}
          </div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:isMe?800:600,color:isMe?C.accent:C.text}}>{r.avatar_emoji} {r.name}{isMe?" (tú)":""}</div>
            <div style={{fontSize:10,color:C.dim}}>{r.correct_winners} series correctas · MVP: {r.mvp_pick||"Sin elegir"}</div>
          </div>
          <div style={{textAlign:"right"}}>
            <div style={{fontSize:22,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#FFB800"}}>{r.total_points}</div>
            <div style={{fontSize:8,color:C.muted}}>PTS</div>
          </div>
        </div>;
      })}
    </Card>}
    </>}
  </div>);
};

/* ═══ ACHIEVEMENT DEFS ═══ */
/* ═══ MINI GAMES TAB ═══ */
const TRIVIA_ALL=[
  /* ── Campeones ── */
  {q:"¿Quién ganó las Finales NBA 2023?",opts:["Miami Heat","Denver Nuggets","Boston Celtics","LA Lakers"],a:1},
  {q:"¿Quién ganó las Finales NBA 2024?",opts:["Dallas Mavericks","Miami Heat","Boston Celtics","Indiana Pacers"],a:2},
  {q:"¿Quién ganó las Finales NBA 2021?",opts:["LA Lakers","Miami Heat","Milwaukee Bucks","Phoenix Suns"],a:2},
  {q:"¿Quién ganó las Finales NBA 2016?",opts:["Golden State Warriors","Cleveland Cavaliers","Oklahoma City Thunder","San Antonio Spurs"],a:1},
  {q:"¿Quién ganó las Finales NBA 2019?",opts:["Golden State Warriors","Toronto Raptors","Cleveland Cavaliers","Milwaukee Bucks"],a:1},
  {q:"¿Quién ganó las Finales NBA 2020?",opts:["Miami Heat","LA Lakers","Denver Nuggets","Boston Celtics"],a:1},
  {q:"¿En qué año ganó Dallas Mavericks su único campeonato?",opts:["2009","2011","2013","2015"],a:1},
  {q:"¿Cuántos campeonatos tiene Boston Celtics en total?",opts:["15","17","18","20"],a:2},
  {q:"¿Cuántos campeonatos ganó Chicago Bulls con Michael Jordan?",opts:["4","5","6","7"],a:2},
  {q:"¿Qué equipo ganó 3 campeonatos consecutivos entre 2000 y 2002?",opts:["Chicago Bulls","San Antonio Spurs","Los Angeles Lakers","Boston Celtics"],a:2},
  {q:"¿Cuántos campeonatos tiene San Antonio Spurs?",opts:["4","5","6","7"],a:1},
  {q:"¿Qué equipo fue el primero en defender el campeonato en la era moderna (post-2000)?",opts:["LA Lakers","Chicago Bulls","Miami Heat","Golden State Warriors"],a:0},
  /* ── Récords ── */
  {q:"¿Cuántos puntos anotó Kobe Bryant en su juego récord vs Toronto?",opts:["71","81","73","76"],a:1},
  {q:"¿Cuántos puntos anotó Wilt Chamberlain en su partido récord?",opts:["81","92","100","73"],a:2},
  {q:"¿Quién tiene el récord histórico de triple-dobles?",opts:["Magic Johnson","Oscar Robertson","Russell Westbrook","LeBron James"],a:2},
  {q:"¿Qué equipo fue el primero en ganar 70+ partidos en temporada regular?",opts:["LA Lakers 1972","Chicago Bulls 1996","Golden State 2016","Boston 1986"],a:1},
  {q:"¿Cuántas victorias tuvo Golden State en la temporada 2015-16?",opts:["67","70","73","75"],a:2},
  {q:"¿Quién tiene el récord de más puntos en un cuarto de playoffs?",opts:["Kobe Bryant","Michael Jordan","Kyrie Irving","Stephen Curry"],a:3},
  {q:"¿Cuántos triples anotó Stephen Curry en su temporada récord?",opts:["342","376","402","421"],a:2},
  {q:"¿Quién anotó 71 puntos en un juego en 2023?",opts:["Luka Dončić","Devin Booker","Jayson Tatum","Ja Morant"],a:0},
  /* ── MVPs ── */
  {q:"¿Quién fue el único MVP unánime en la historia NBA?",opts:["LeBron James","Michael Jordan","Stephen Curry","Shaquille O'Neal"],a:2},
  {q:"¿Cuántos MVPs de temporada tiene Nikola Jokić?",opts:["1","2","3","4"],a:2},
  {q:"¿Cuántos MVPs de temporada tiene LeBron James?",opts:["3","4","5","6"],a:1},
  {q:"¿Cuántas veces ganó Michael Jordan el MVP de las Finales?",opts:["4","5","6","7"],a:2},
  {q:"¿Quién fue MVP de las Finales 2016 siendo del equipo perdedor?",opts:["Kyrie Irving","LeBron James","Kevin Durant","Stephen Curry"],a:1},
  {q:"¿Quién fue MVP de las Finales 2019?",opts:["Stephen Curry","Kevin Durant","Kawhi Leonard","Giannis Antetokounmpo"],a:2},
  {q:"¿Cuántos MVPs tiene Kareem Abdul-Jabbar?",opts:["4","5","6","7"],a:2},
  {q:"¿Quién ganó MVP de la temporada 2022-23?",opts:["Giannis Antetokounmpo","Joel Embiid","Nikola Jokić","Jayson Tatum"],a:1},
  {q:"¿Dirk Nowitzki fue el primer europeo en ganar el MVP?",opts:["Sí","No","También Arvydas Sabonis","También Peja Stojaković"],a:0},
  /* ── Draft ── */
  {q:"¿En qué pick del Draft 2014 fue seleccionado Nikola Jokić?",opts:["#27","#35","#41","#48"],a:2},
  {q:"¿En qué año entró LeBron James a la NBA?",opts:["2001","2002","2003","2004"],a:2},
  {q:"¿Quién fue el pick #1 del Draft 2003?",opts:["Carmelo Anthony","LeBron James","Chris Bosh","Dwyane Wade"],a:1},
  {q:"¿Quién fue Rookie del Año 2023-24?",opts:["Chet Holmgren","Victor Wembanyama","Scoot Henderson","Brandon Miller"],a:1},
  {q:"¿En qué pick fue seleccionado Stephen Curry en el Draft 2009?",opts:["#3","#5","#7","#10"],a:2},
  {q:"¿Quién fue el #1 del Draft 2023?",opts:["Scoot Henderson","Brandon Miller","Victor Wembanyama","Chet Holmgren"],a:2},
  {q:"¿Qué equipo seleccionó a Kobe Bryant en el Draft 1996?",opts:["Los Angeles Lakers","Charlotte Hornets","Chicago Bulls","Seattle SuperSonics"],a:1},
  {q:"¿En qué pick fue seleccionado Giannis Antetokounmpo en el Draft 2013?",opts:["#10","#12","#15","#17"],a:2},
  /* ── Jugadores ── */
  {q:"¿Quién tiene más anillos como jugador en la historia NBA?",opts:["Michael Jordan","Magic Johnson","Bill Russell","Kareem Abdul-Jabbar"],a:2},
  {q:"¿Quién es el máximo anotador en la historia de la NBA?",opts:["Kareem Abdul-Jabbar","Karl Malone","Kobe Bryant","LeBron James"],a:3},
  {q:"¿Qué posición juega Nikola Jokić?",opts:["Alero","Escolta","Pívot","Base"],a:2},
  {q:"¿De qué país es Luka Dončić?",opts:["Croacia","Serbia","Eslovenia","Bosnia"],a:2},
  {q:"¿Cuántas temporadas jugó Dirk Nowitzki, todas con Dallas?",opts:["18","19","21","23"],a:2},
  {q:"¿Qué apodo tiene Giannis Antetokounmpo?",opts:["The King","The Greek Freak","The Alphabet","Greek God"],a:1},
  {q:"¿Con cuántos puntos terminó su carrera Kareem Abdul-Jabbar?",opts:["36,928","37,440","38,112","38,387"],a:3},
  {q:"¿Quién fue el primer jugador en saltar del instituto directamente a la NBA?",opts:["Kobe Bryant","LeBron James","Kevin Garnett","Moses Malone"],a:3},
  {q:"¿Quién tiene el récord de más asistencias en la historia NBA?",opts:["Magic Johnson","John Stockton","Steve Nash","Jason Kidd"],a:1},
  {q:"¿Qué jugador popularizó el 'skyhook'?",opts:["Wilt Chamberlain","Bill Russell","Kareem Abdul-Jabbar","Shaquille O'Neal"],a:2},
  /* ── Equipos ── */
  {q:"¿En qué ciudad juegan los Suns de Phoenix?",opts:["Phoenix","Scottsdale","Tempe","Mesa"],a:0},
  {q:"¿Cuál es el apodo de los jugadores de Golden State Warriors?",opts:["Splash Brothers","Three Kings","Bay Boys","Warrior Nation"],a:0},
  {q:"¿Qué equipo tiene el logo del toro?",opts:["Orlando Magic","Chicago Bulls","Milwaukee Bucks","Memphis Grizzlies"],a:1},
  {q:"¿En qué conferencia juega Miami Heat?",opts:["Oeste","Este","Depende del año","No tiene conferencia"],a:1},
  {q:"¿Cuántos equipos hay en la NBA actualmente?",opts:["28","30","32","29"],a:1},
  {q:"¿Qué equipo del oeste jugó más finales en los años 2000?",opts:["Dallas Mavericks","San Antonio Spurs","LA Lakers","Golden State Warriors"],a:2},
  {q:"¿Cómo se llamaba el equipo de New Jersey antes de mudarse a Brooklyn?",opts:["New Jersey Nets","New Jersey Devils","NJ Knicks","NJ Blazers"],a:0},
  {q:"¿Qué equipo tiene más victorias en una sola temporada regular?",opts:["Chicago Bulls 95-96","Golden State 15-16","LA Lakers 71-72","Boston 85-86"],a:1},
  /* ── Miscelánea ── */
  {q:"¿Cuántos jugadores hay por equipo en cancha simultáneamente?",opts:["4","5","6","7"],a:1},
  {q:"¿Cuántos cuartos dura un partido de la NBA?",opts:["2","3","4","5"],a:2},
  {q:"¿Cuántos minutos dura cada cuarto en la NBA?",opts:["10","12","15","8"],a:1},
  {q:"¿Qué significa 'triple-doble'?",opts:["Anotar 30+ puntos","Dobles dígitos en 3 estadísticas","3 veces MVP","3 triples en un partido"],a:1},
  {q:"¿Cuántos segundos tiene un equipo para lanzar a canasta?",opts:["20","24","30","35"],a:1},
  {q:"¿Qué se gana cuando el tiro es desde detrás de la línea de tres?",opts:["1 punto","2 puntos","3 puntos","4 puntos"],a:2},
  {q:"¿Qué es un 'alley-oop'?",opts:["Tiro libre fallado","Pase al vuelo para mate","Triple en el buzzer","Robo de balón"],a:1},
  {q:"¿Cuántas victorias se necesitan para ganar una serie de playoffs?",opts:["3","4","5","6"],a:1},
];

const CHAMPS=[
  /* ── Era clásica ── */
  {year:1947,team:"PHW",label:"Philadelphia Warriors"},{year:1948,team:"BAB",label:"Baltimore Bullets"},
  {year:1949,team:"MNL",label:"Minneapolis Lakers"},{year:1950,team:"MNL",label:"Minneapolis Lakers"},
  {year:1951,team:"ROC",label:"Rochester Royals"},{year:1952,team:"MNL",label:"Minneapolis Lakers"},
  {year:1953,team:"MNL",label:"Minneapolis Lakers"},{year:1954,team:"MNL",label:"Minneapolis Lakers"},
  {year:1955,team:"SYN",label:"Syracuse Nationals"},{year:1956,team:"PHW",label:"Philadelphia Warriors"},
  {year:1957,team:"BOS",label:"Boston Celtics"},{year:1958,team:"STL",label:"St. Louis Hawks"},
  {year:1959,team:"BOS",label:"Boston Celtics"},{year:1960,team:"BOS",label:"Boston Celtics"},
  {year:1961,team:"BOS",label:"Boston Celtics"},{year:1962,team:"BOS",label:"Boston Celtics"},
  {year:1963,team:"BOS",label:"Boston Celtics"},{year:1964,team:"BOS",label:"Boston Celtics"},
  {year:1965,team:"BOS",label:"Boston Celtics"},{year:1966,team:"BOS",label:"Boston Celtics"},
  {year:1967,team:"PHI",label:"Philadelphia 76ers"},{year:1968,team:"BOS",label:"Boston Celtics"},
  {year:1969,team:"BOS",label:"Boston Celtics"},{year:1970,team:"NYK",label:"New York Knicks"},
  {year:1971,team:"MIL",label:"Milwaukee Bucks"},{year:1972,team:"LAL",label:"LA Lakers"},
  {year:1973,team:"NYK",label:"New York Knicks"},{year:1974,team:"BOS",label:"Boston Celtics"},
  {year:1975,team:"GSW",label:"Golden State Warriors"},{year:1976,team:"BOS",label:"Boston Celtics"},
  {year:1977,team:"POR",label:"Portland Trail Blazers"},{year:1978,team:"WAS",label:"Washington Bullets"},
  {year:1979,team:"SEA",label:"Seattle SuperSonics"},{year:1980,team:"LAL",label:"LA Lakers"},
  {year:1981,team:"BOS",label:"Boston Celtics"},{year:1982,team:"LAL",label:"LA Lakers"},
  {year:1983,team:"PHI",label:"Philadelphia 76ers"},{year:1984,team:"BOS",label:"Boston Celtics"},
  /* ── Era moderna ── */
  {year:1985,team:"LAL"},{year:1986,team:"BOS"},{year:1987,team:"LAL"},{year:1988,team:"LAL"},
  {year:1989,team:"DET"},{year:1990,team:"DET"},{year:1991,team:"CHI"},{year:1992,team:"CHI"},
  {year:1993,team:"CHI"},{year:1994,team:"HOU"},{year:1995,team:"HOU"},{year:1996,team:"CHI"},
  {year:1997,team:"CHI"},{year:1998,team:"CHI"},{year:1999,team:"SAS"},{year:2000,team:"LAL"},
  {year:2001,team:"LAL"},{year:2002,team:"LAL"},{year:2003,team:"SAS"},{year:2004,team:"DET"},
  {year:2005,team:"SAS"},{year:2006,team:"MIA"},{year:2007,team:"SAS"},{year:2008,team:"BOS"},
  {year:2009,team:"LAL"},{year:2010,team:"LAL"},{year:2011,team:"DAL"},{year:2012,team:"MIA"},
  {year:2013,team:"MIA"},{year:2014,team:"SAS"},{year:2015,team:"GSW"},{year:2016,team:"CLE"},
  {year:2017,team:"GSW"},{year:2018,team:"GSW"},{year:2019,team:"TOR"},{year:2020,team:"LAL"},
  {year:2021,team:"MIL"},{year:2022,team:"GSW"},{year:2023,team:"DEN"},{year:2024,team:"BOS"},
];

const PLAYER_CLUES=[
  /* ── Era actual ── */
  {name:"LeBron James",team:"LAL",clues:["1er pick del Draft 2003","Jugó para Cavaliers, Heat y Lakers","4 campeonatos de la NBA","Máximo anotador en la historia NBA superando a Kareem"]},
  {name:"Stephen Curry",team:"GSW",clues:["7mo pick del Draft 2009","Ha jugado toda su carrera con Golden State Warriors","Récord de triples en una temporada: 402","El único MVP unánime en la historia de la NBA"]},
  {name:"Kevin Durant",team:"HOU",clues:["2do pick del Draft 2007","Jugó en OKC, Golden State, Brooklyn y Phoenix","Ganó 2 campeonatos con Golden State (2017, 2018)","MVP de la NBA en 2014 con Oklahoma City Thunder"]},
  {name:"Giannis Antetokounmpo",team:"MIL",clues:["15vo pick del Draft 2013","Nació en Atenas, Grecia, de padres nigerianos","Campeón con Milwaukee Bucks en 2021","Doble MVP de la NBA (2019, 2020) — apodado 'The Greek Freak'"]},
  {name:"Nikola Jokić",team:"DEN",clues:["Pick #41 del Draft 2014 — el más bajo en ganar MVP","Ha jugado toda su carrera con Denver Nuggets","Campeón y MVP de Finales con Denver en 2023","3 veces MVP de la NBA (2021, 2022, 2024)"]},
  {name:"Luka Dončić",team:"LAL",clues:["3er pick del Draft 2018 — nació en Eslovenia","Fue All-Star en su primera temporada (2018-19)","Fue a las Finales NBA con Dallas en 2024","Tradeado a LA Lakers en enero de 2025"]},
  {name:"Victor Wembanyama",team:"SAS",clues:["1er pick del Draft 2023 — nació en Francia","Solo ha jugado para San Antonio Spurs","Rookie del Año 2023-24 de forma unánime","Mide 2.24m y es considerado el prospecto más especial en décadas"]},
  {name:"Jayson Tatum",team:"BOS",clues:["3er pick del Draft 2017","Ha jugado toda su carrera con Boston Celtics","Campeón NBA en 2024 con Boston","Fue MVP de las Finales 2024 con 31 años"]},
  {name:"Joel Embiid",team:"PHI",clues:["3er pick del Draft 2014 — nació en Camerún","Ha jugado casi toda su carrera con Philadelphia 76ers","MVP de la NBA en 2022-23","Tiene el apodo de 'The Process'"]},
  {name:"Kawhi Leonard",team:"LAC",clues:["15vo pick del Draft 2011","Jugó para San Antonio, Toronto, LA Clippers","Ganó el campeonato con Toronto en 2019 y fue MVP de Finales","Tiene 2 MVP de Finales con dos equipos diferentes"]},
  {name:"Shai Gilgeous-Alexander",team:"OKC",clues:["11vo pick del Draft 2018 — nació en Canadá","Empezó en LA Clippers antes de ir a Oklahoma City","Líder anotador de la temporada 2024-25","Es la franquicia de OKC Thunder junto con Chet Holmgren"]},
  {name:"Anthony Davis",team:"LAL",clues:["1er pick del Draft 2012","Jugó para New Orleans Pelicans y LA Lakers","Campeón con LA Lakers en 2020","Se le conoce por sus cejas y su apodo 'The Brow'"]},
  {name:"Damian Lillard",team:"MIL",clues:["6to pick del Draft 2012","Jugó 11 temporadas con Portland Trail Blazers","Tradeado a Milwaukee Bucks en 2023","Famoso por sus clutch shots — apodado 'Dame Time'"]},
  {name:"Ja Morant",team:"MEM",clues:["2do pick del Draft 2019","Ha jugado toda su carrera con Memphis Grizzlies","Rookie del Año 2019-20","Conocido por sus alucinantes mates y suspensiones polémicas"]},
  {name:"Devin Booker",team:"PHX",clues:["13vo pick del Draft 2015","Ha jugado toda su carrera con Phoenix Suns","Anotó 70 puntos en un partido en 2017 — a sus 20 años","Fue MVP del All-Star Game 2023"]},
  {name:"Karl-Anthony Towns",team:"NYK",clues:["1er pick del Draft 2015","Jugó 9 temporadas con Minnesota Timberwolves","Tradeado a New York Knicks en 2024","El único jugador en la historia con 50-40-90 como pivote"]},
  {name:"Tyrese Haliburton",team:"IND",clues:["12vo pick del Draft 2020","Empezó en Sacramento Kings antes de ir a Indiana","MVP del Rising Stars 2022","Fue el héroe del East All-Star que ganó Indiana en 2024"]},
  {name:"Draymond Green",team:"GSW",clues:["35vo pick del Draft 2012","Ha jugado toda su carrera con Golden State Warriors","4 campeonatos con los Warriors","No es anotador — su valor está en defensa, asistencias y liderazgo"]},
  /* ── Leyendas recientes ── */
  {name:"Kobe Bryant",team:"LAL",clues:["13vo pick del Draft 1996","Jugó toda su carrera con Los Angeles Lakers","5 campeonatos con los Lakers","Anotó 81 puntos contra Toronto — 2do mayor en la historia"]},
  {name:"Shaquille O'Neal",team:"LAL",clues:["1er pick del Draft 1992","Jugó para Orlando, Lakers, Miami, Phoenix y otros","4 campeonatos — 3 con Lakers y 1 con Miami Heat","Considerado el pivote más dominante físicamente en la historia"]},
  {name:"Tim Duncan",team:"SAS",clues:["1er pick del Draft 1997","Jugó toda su carrera con San Antonio Spurs","5 campeonatos en la era moderna","2 veces MVP de la NBA — apodado 'The Big Fundamental'"]},
  {name:"Dirk Nowitzki",team:"DAL",clues:["9no pick del Draft 1998 — nació en Würzburg, Alemania","Jugó toda su carrera con Dallas Mavericks","Campeón con Dallas en 2011 eliminando a LeBron en las Finales","MVP de la NBA en 2007 — el primer europeo en ganarlo"]},
  {name:"Dwyane Wade",team:"MIA",clues:["5to pick del Draft 2003","Jugó principalmente con Miami Heat","3 campeonatos — 2006, 2012 y 2013","MVP de las Finales 2006 a los 24 años — apodado 'Flash'"]},
  {name:"Chris Paul",team:"PHX",clues:["4to pick del Draft 2005","Jugó para New Orleans, LA Clippers, Houston, OKC y Phoenix","Nunca ganó un campeonato pese a ser uno de los mejores bases","Líder histórico en robos y uno de los mejores pasadores de todos los tiempos"]},
  {name:"Russell Westbrook",team:"OKC",clues:["4to pick del Draft 2008","Jugó para OKC, Houston, LA Lakers, Washington y otros","MVP de la NBA en 2017 con 42 triple-dobles en la temporada","Récord histórico de triple-dobles en la NBA"]},
  {name:"Allen Iverson",team:"PHI",clues:["1er pick del Draft 1996","Jugó principalmente para Philadelphia 76ers","MVP de la NBA en 2001 — a 183cm, el más bajo en ganarlo","Apodado 'The Answer' — revolucionó el estilo streetball en la NBA"]},
  {name:"Charles Barkley",team:"PHX",clues:["5to pick del Draft 1984","Jugó para Philadelphia, Phoenix y Houston — nunca ganó un título","MVP de la NBA en 1993","Famosa frase: 'I am not a role model'"]},
  {name:"Kevin Garnett",team:"MIN",clues:["5to pick del Draft 1995 — salió directo del instituto","Jugó principalmente para Minnesota y Boston","Campeón con Boston Celtics en 2008","MVP de la NBA en 2004 — apodado 'The Big Ticket'"]},
  /* ── Era dorada ── */
  {name:"Michael Jordan",team:"CHI",clues:["3er pick del Draft 1984","6 campeonatos con Chicago Bulls — 3+3 consecutivos","6 MVP de las Finales — todos los títulos que disputó","5 veces MVP de la temporada regular"]},
  {name:"Magic Johnson",team:"LAL",clues:["1er pick del Draft 1979","Jugó toda su carrera con Los Angeles Lakers","5 campeonatos con los Lakers","3 veces MVP de la NBA y 3 veces MVP de las Finales"]},
  {name:"Larry Bird",team:"BOS",clues:["6to pick del Draft 1978","Jugó toda su carrera con Boston Celtics","3 campeonatos con los Celtics","3 MVPs de la NBA consecutivos (1984, 1985, 1986)"]},
  {name:"Kareem Abdul-Jabbar",team:"LAL",clues:["1er pick en 1969 — se llamaba 'Lew Alcindor'","Jugó para Milwaukee Bucks y Los Angeles Lakers","6 campeonatos de la NBA","6 veces MVP — el récord absoluto de la NBA hasta que LeBron lo iguala"]},
  {name:"Wilt Chamberlain",team:"LAL",clues:["Entró a la NBA en 1959 con Philadelphia Warriors","Jugó para Warriors, 76ers, Lakers y Harlem Globetrotters","Anotó 100 puntos en un solo partido (2 de marzo de 1962)","2 campeonatos — con 76ers en 1967 y Lakers en 1972"]},
  {name:"Bill Russell",team:"BOS",clues:["Fue seleccionado 2do en el Draft 1956","Jugó toda su carrera con Boston Celtics","11 campeonatos en 13 temporadas — el récord absoluto","5 veces MVP y considerado el mejor defensor de la historia"]},
  {name:"Oscar Robertson",team:"MIL",clues:["1er pick del Draft 1960","Jugó para Cincinnati Royals y Milwaukee Bucks","Primer jugador en promediar triple-doble en una temporada completa (1961-62)","Campeón con Milwaukee en 1971 junto a Kareem Abdul-Jabbar"]},
  {name:"Julius Erving",team:"PHI",clues:["Apodado 'Dr. J'","Ganó 3 campeonatos ABA antes de llegar a la NBA","Campeón NBA con Philadelphia 76ers en 1983","Pionero del juego aéreo y los mates espectaculares"]},
  {name:"Isiah Thomas",team:"DET",clues:["2do pick del Draft 1981","Jugó toda su carrera con Detroit Pistons","2 campeonatos consecutivos (1989, 1990) — los 'Bad Boys'","MVP de las Finales en 1990 pese a estar lesionado"]},
  {name:"Hakeem Olajuwon",team:"HOU",clues:["1er pick del Draft 1984 — nació en Nigeria","Jugó principalmente con Houston Rockets","2 campeonatos consecutivos (1994, 1995)","MVP de la temporada y de las Finales en 1994 — apodado 'The Dream'"]},
  {name:"Patrick Ewing",team:"NYK",clues:["1er pick del Draft 1985","Jugó principalmente con New York Knicks","Nunca ganó un campeonato pese a ser considerado el mejor de su época","Llevó a los Knicks a las Finales en 1994 donde perdieron con Houston"]},
  {name:"John Stockton",team:"UTA",clues:["16vo pick del Draft 1984","Jugó toda su carrera con Utah Jazz junto a Karl Malone","Líder histórico de la NBA en asistencias Y en robos","Nunca ganó un campeonato — perdió 2 Finales ante los Bulls de Jordan"]},
  {name:"Karl Malone",team:"UTA",clues:["13vo pick del Draft 1985 — apodado 'The Mailman'","Jugó principalmente con Utah Jazz junto a John Stockton","2do máximo anotador de la historia NBA","Ganó el MVP en 1997 y 1999 pero nunca un campeonato"]},
];

const MiniGamesTab=({players,userCtx})=>{
  const {user}=userCtx||{};
  const [screen,setScreen]=useState("menu");
  const [game,setGame]=useState(null);
  // Scorer state
  const [scorerRound,setScorerRound]=useState(0);
  const [scorerScore,setScorerScore]=useState(0);
  const [scorerPair,setScorerPair]=useState(null);
  const [scorerDone,setScorerDone]=useState(false);
  const [scorerFeedback,setScorerFeedback]=useState(null);
  // Trivia state
  const [triviaQ,setTriviaQ]=useState(0);
  const [triviaScore,setTriviaScore]=useState(0);
  const [triviaDone,setTriviaDone]=useState(false);
  const [triviaFeedback,setTriviaFeedback]=useState(null);
  const [triviaSet,setTriviaSet]=useState([]);
  // Leaderboard
  const [scores,setScores]=useState([]);
  const [allRankings,setAllRankings]=useState({scorer:[],trivia:[],guess:[],champs:[]});

  useEffect(()=>{
    const types=["scorer","trivia","guess","champs"];
    Promise.all(types.map(t=>pickemAPI("getMiniScores",{params:{gameType:t}}))).then(results=>{
      const r={};
      types.forEach((t,i)=>{r[t]=results[i].ok?results[i].scores||[]:[]; });
      setAllRankings(r);
    });
  },[]);

  // Guess player state
  const [guessRound,setGuessRound]=useState(0);
  const [guessScore,setGuessScore]=useState(0);
  const [guessQ,setGuessQ]=useState(null);
  const [guessDone,setGuessDone]=useState(false);
  const [guessFeedback,setGuessFeedback]=useState(null);
  const [guessPool,setGuessPool]=useState([]);
  // Champs game state
  const [champsRound,setChampsRound]=useState(0);
  const [champsScore,setChampsScore]=useState(0);
  const [champsQ,setChampsQ]=useState(null);
  const [champsDone,setChampsDone]=useState(false);
  const [champsFeedback,setChampsFeedback]=useState(null);
  const [champsPool,setChampsPool]=useState([]);

  const buildClueQ=(pool,round)=>{
    const correct=pool[round];
    const others=[...PLAYER_CLUES].filter(p=>p.name!==correct.name).sort(()=>Math.random()-.5).slice(0,3);
    const opts=[correct,...others].sort(()=>Math.random()-.5);
    return{correct,opts};
  };

  const startGuess=()=>{
    const pool=[...PLAYER_CLUES].sort(()=>Math.random()-.5);
    setGuessRound(0);setGuessScore(0);setGuessDone(false);setGuessFeedback(null);
    setGuessPool(pool);setGuessQ(buildClueQ(pool,0));setGame("guess");setScreen("game");
  };

  const answerGuess=(p)=>{
    if(guessFeedback!==null) return;
    const isCorrect=p.name===guessQ.correct.name;
    setGuessFeedback(isCorrect);
    if(isCorrect) setGuessScore(s=>s+1);
    setTimeout(()=>{
      const next=guessRound+1;
      if(next>=8){
        setGuessDone(true);
        const final=isCorrect?guessScore+1:guessScore;
        if(user) pickemAPI("saveMiniScore",{body:{userId:user.id,gameType:"guess",score:final}});
        pickemAPI("getMiniScores",{params:{gameType:"guess"}}).then(d=>{if(d.ok){setScores(d.scores||[]);setAllRankings(r=>({...r,guess:d.scores||[]}));}});
      } else {
        setGuessRound(next);setGuessQ(buildClueQ(guessPool,next));setGuessFeedback(null);
      }
    },900);
  };

  const buildChampsQ=(pool,round)=>{
    const correct=pool[round];
    // Deduplicate by team abbr so same team never appears twice as option
    const seen=new Set([correct.team]);
    const others=[];
    const shuffled=[...CHAMPS].sort(()=>Math.random()-.5);
    for(const c of shuffled){
      if(!seen.has(c.team)){seen.add(c.team);others.push(c);}
      if(others.length===3) break;
    }
    const opts=[correct,...others].sort(()=>Math.random()-.5);
    return{correct,opts};
  };
  const startChamps=()=>{
    const pool=[...CHAMPS].sort(()=>Math.random()-.5).slice(0,10);
    setChampsRound(0);setChampsScore(0);setChampsDone(false);setChampsFeedback(null);
    setChampsPool(pool);setChampsQ(buildChampsQ(pool,0));setGame("champs");setScreen("game");
  };
  const answerChamps=(team)=>{
    if(champsFeedback!==null) return;
    const isCorrect=team===champsQ.correct.team;
    setChampsFeedback(isCorrect);
    if(isCorrect) setChampsScore(s=>s+1);
    setTimeout(()=>{
      const next=champsRound+1;
      if(next>=10){
        setChampsDone(true);
        const final=isCorrect?champsScore+1:champsScore;
        if(user) pickemAPI("saveMiniScore",{body:{userId:user.id,gameType:"champs",score:final}});
        pickemAPI("getMiniScores",{params:{gameType:"champs"}}).then(d=>{if(d.ok){setScores(d.scores||[]);setAllRankings(r=>({...r,champs:d.scores||[]}));}});
      } else {
        setChampsRound(next);setChampsQ(buildChampsQ(champsPool,next));setChampsFeedback(null);
      }
    },900);
  };

  const pickPair=()=>{
    if(!players||players.length<2) return null;
    const idx1=Math.floor(Math.random()*players.length);
    let idx2=Math.floor(Math.random()*players.length);
    while(idx2===idx1)idx2=Math.floor(Math.random()*players.length);
    return [players[idx1],players[idx2]];
  };

  const startScorer=()=>{
    setScorerRound(0);setScorerScore(0);setScorerDone(false);setScorerFeedback(null);
    setScorerPair(pickPair());
    setGame("scorer");setScreen("game");
  };

  const startTrivia=()=>{
    setTriviaSet([...TRIVIA_ALL].sort(()=>Math.random()-.5).slice(0,10));
    setTriviaQ(0);setTriviaScore(0);setTriviaDone(false);setTriviaFeedback(null);
    setGame("trivia");setScreen("game");
  };

  const answerScorer=(chosen)=>{
    if(scorerFeedback!==null) return;
    const [p1,p2]=scorerPair;
    const correct=(chosen===0&&p1.pts>=p2.pts)||(chosen===1&&p2.pts>=p1.pts);
    setScorerFeedback(correct);
    if(correct) setScorerScore(s=>s+1);
    setTimeout(()=>{
      const nextRound=scorerRound+1;
      if(nextRound>=10){
        setScorerDone(true);
        const finalScore=correct?scorerScore+1:scorerScore;
        if(user) pickemAPI("saveMiniScore",{body:{userId:user.id,gameType:"scorer",score:finalScore}});
        pickemAPI("getMiniScores",{params:{gameType:"scorer"}}).then(d=>{if(d.ok){setScores(d.scores||[]);setAllRankings(r=>({...r,scorer:d.scores||[]}));}});
      } else {
        setScorerRound(nextRound);setScorerPair(pickPair());setScorerFeedback(null);
      }
    },700);
  };

  const answerTrivia=(idx)=>{
    if(triviaFeedback!==null) return;
    const q=triviaSet[triviaQ];
    const correct=idx===q.a;
    setTriviaFeedback(correct);
    if(correct) setTriviaScore(s=>s+1);
    setTimeout(()=>{
      const nextQ=triviaQ+1;
      if(nextQ>=triviaSet.length){
        setTriviaDone(true);
        const finalScore=correct?triviaScore+1:triviaScore;
        if(user) pickemAPI("saveMiniScore",{body:{userId:user.id,gameType:"trivia",score:finalScore}});
        pickemAPI("getMiniScores",{params:{gameType:"trivia"}}).then(d=>{if(d.ok){setScores(d.scores||[]);setAllRankings(r=>({...r,trivia:d.scores||[]}));}});
      } else {
        setTriviaQ(nextQ);setTriviaFeedback(null);
      }
    },700);
  };

  const GAME_META=[
    {key:"scorer",icon:"📊",label:"¿Quién anota más?",desc:"Adivina qué jugador tiene más PPG · 10 rondas",color:C.accent,start:startScorer,max:10},
    {key:"trivia",icon:"🧠",label:"NBA Trivia",desc:"10 preguntas sobre la NBA · ¿Cuántas aciertas?",color:"#FFB800",start:startTrivia,max:10},
    {key:"guess",icon:"🕵️",label:"Adivina el Jugador",desc:"4 pistas de carrera · 8 rondas",color:"#00FF9D",start:startGuess,max:8},
    {key:"champs",icon:"🏆",label:"Campeones NBA",desc:"¿Quién ganó en ese año? · 1947–2024 · 10 rondas",color:"#E03A3E",start:startChamps,max:10},
  ];

  if(screen==="menu") return(<div className="fade-up">
    <ST sub="Mini Juegos">Juegos NBA 🎮</ST>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
      {GAME_META.map(g=>(
        <Card key={g.key} style={{textAlign:"center",padding:20,borderColor:g.color+"33",display:"flex",flexDirection:"column"}}>
          <div style={{fontSize:36,marginBottom:8}}>{g.icon}</div>
          <div style={{fontSize:14,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.text,marginBottom:4,lineHeight:1.2}}>{g.label}</div>
          <div style={{fontSize:11,color:C.dim,marginBottom:12,flex:1}}>{g.desc}</div>
          {allRankings[g.key].length>0&&(()=>{
            const top=allRankings[g.key][0];
            const myRank=user?allRankings[g.key].findIndex(s=>s.users?.name===user.name)+1:0;
            return<div style={{fontSize:10,color:C.muted,marginBottom:8,padding:"4px 8px",background:g.color+"11",borderRadius:6}}>
              👑 {top.users?.avatar_emoji||"🏀"} {top.users?.name}: {top.score}/{g.max}
              {myRank>0&&<span style={{color:g.color}}> · Tu puesto: #{myRank}</span>}
            </div>;
          })()}
          <button className="btn" onClick={g.start} style={{width:"100%",padding:"10px",borderRadius:10,background:`linear-gradient(135deg,${g.color},${g.color}aa)`,color:g.key==="champs"?"#fff":"#07090f",fontWeight:900,fontSize:13}}>Jugar</button>
        </Card>
      ))}
    </div>
    <button className="btn" onClick={()=>setScreen("rankings")} style={{width:"100%",padding:"13px",borderRadius:12,background:"#0a1018",border:`1px solid ${C.border}`,color:C.text,fontWeight:700,fontSize:14}}>🏆 Ver Rankings Globales</button>
  </div>);

  if(screen==="rankings") return(<div className="fade-up">
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
      <button className="btn" onClick={()=>setScreen("menu")} style={{padding:"8px 14px",borderRadius:8,background:"#0a1018",border:`1px solid ${C.border}`,color:C.dim,fontSize:12}}>← Volver</button>
      <ST sub="Mini Juegos" style={{margin:0}}>Rankings Globales 🌎</ST>
    </div>
    {GAME_META.map(g=>(
      <Card key={g.key} style={{marginBottom:14,borderColor:g.color+"33"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <span style={{fontSize:20}}>{g.icon}</span>
          <span style={{fontSize:14,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:g.color}}>{g.label}</span>
        </div>
        {allRankings[g.key].length===0?<div style={{fontSize:12,color:C.dim,textAlign:"center",padding:"8px 0"}}>Aún no hay puntuaciones</div>
        :allRankings[g.key].map((s,i)=>{
          const isMe=user&&s.users?.name===user.name;
          return<div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:i<allRankings[g.key].length-1?`1px solid ${C.border}`:"none",background:isMe?g.color+"11":"transparent",borderRadius:isMe?6:0,paddingLeft:isMe?6:0}}>
            <span style={{fontSize:11,color:i<3?g.color:C.muted,fontWeight:i<3?900:400,width:18}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</span>
            <span style={{fontSize:14}}>{s.users?.avatar_emoji||"🏀"}</span>
            <span style={{flex:1,fontSize:13,color:isMe?g.color:C.text,fontWeight:isMe?700:400}}>{s.users?.name}{isMe?" (tú)":""}</span>
            <span style={{fontSize:15,fontWeight:900,color:g.color}}>{s.score}<span style={{fontSize:10,color:C.muted}}>/{g.max}</span></span>
          </div>;
        })}
      </Card>
    ))}
    <button className="btn" onClick={()=>setScreen("menu")} style={{width:"100%",padding:"13px",borderRadius:12,background:C.accent,color:"#07090f",fontWeight:900,fontSize:14}}>← Volver al Menú</button>
  </div>);

  if(screen==="game"&&game==="scorer") {
    if(scorerDone) return(<div className="fade-up">
      <ST sub="¿Quién anota más?">Resultado</ST>
      <Card style={{textAlign:"center",padding:30,marginBottom:14}}>
        <div style={{fontSize:56,marginBottom:8}}>📊</div>
        <div style={{fontSize:36,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.accent}}>{scorerScore}/10</div>
        <div style={{fontSize:14,color:C.dim,marginTop:4}}>{scorerScore>=8?"¡Experto NBA! 🏆":scorerScore>=5?"¡Buen intento! 💪":"Sigue practicando 📚"}</div>
      </Card>
      {scores.length>0&&<Card style={{marginBottom:14}}><div style={{fontSize:11,color:C.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:2}}>🏆 Top Puntuaciones</div>
        {scores.map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<scores.length-1?`1px solid ${C.border}`:"none"}}><span style={{fontSize:11,color:C.muted,width:16}}>{i+1}</span><span style={{fontSize:13}}>{s.users?.avatar_emoji||"🏀"}</span><span style={{flex:1,fontSize:12,color:C.text}}>{s.users?.name}</span><span style={{fontSize:14,fontWeight:900,color:C.accent}}>{s.score}</span></div>)}
      </Card>}
      <button className="btn" onClick={()=>setScreen("menu")} style={{width:"100%",padding:"13px",borderRadius:10,background:C.accent,color:"#07090f",fontWeight:900,fontSize:14}}>← Volver</button>
    </div>);
    if(!scorerPair) return <div style={{color:C.dim,textAlign:"center",padding:40}}>Cargando jugadores...</div>;
    const [p1,p2]=scorerPair;
    return(<div className="fade-up">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <ST sub="¿Quién anota más?">Ronda {scorerRound+1}/10</ST>
        <div style={{fontSize:20,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.accent}}>{scorerScore} pts</div>
      </div>
      <Card style={{marginBottom:10,textAlign:"center"}}><div style={{fontSize:12,color:C.dim}}>¿Quién tiene más PPG esta temporada?</div></Card>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {[p1,p2].map((p,i)=><button key={p.id} className="btn" onClick={()=>answerScorer(i)} style={{padding:20,borderRadius:14,background:scorerFeedback!==null?(i===(p1.pts>=p2.pts?0:1)?"#00FF9D22":"#ff444422"):"#0a1018",border:`2px solid ${scorerFeedback!==null?(i===(p1.pts>=p2.pts?0:1)?"#00FF9D":"#ff4444"):C.border}`,textAlign:"center",transition:"all .2s"}}>
          {logo(p.teamAbbr,40)}
          <div style={{fontSize:14,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.text,marginTop:8}}>{p.name}</div>
          <div style={{fontSize:11,color:C.dim}}>{p.teamAbbr} · {p.pos}</div>
          {scorerFeedback!==null&&<div style={{fontSize:20,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#FFB800",marginTop:6}}>{p.pts} PPG</div>}
        </button>)}
      </div>
      {scorerFeedback!==null&&<div style={{textAlign:"center",marginTop:10,fontSize:16,fontWeight:700,color:scorerFeedback?"#00FF9D":"#ff6666"}}>{scorerFeedback?"✅ ¡Correcto!":"❌ Incorrecto"}</div>}
      <button className="btn" onClick={()=>setScreen("menu")} style={{width:"100%",marginTop:14,padding:"10px",borderRadius:10,background:"#0a1018",border:`1px solid ${C.border}`,color:C.dim,fontSize:12}}>Salir</button>
    </div>);
  }

  if(screen==="game"&&game==="trivia") {
    if(triviaDone) return(<div className="fade-up">
      <ST sub="NBA Trivia">Resultado</ST>
      <Card style={{textAlign:"center",padding:30,marginBottom:14}}>
        <div style={{fontSize:56,marginBottom:8}}>🧠</div>
        <div style={{fontSize:36,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#FFB800"}}>{triviaScore}/10</div>
        <div style={{fontSize:14,color:C.dim,marginTop:4}}>{triviaScore>=8?"¡Experto NBA! 🏆":triviaScore>=5?"¡Buen intento! 💪":"Sigue aprendiendo 📚"}</div>
      </Card>
      {scores.length>0&&<Card style={{marginBottom:14}}><div style={{fontSize:11,color:C.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:2}}>🏆 Top Puntuaciones</div>
        {scores.map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<scores.length-1?`1px solid ${C.border}`:"none"}}><span style={{fontSize:11,color:C.muted,width:16}}>{i+1}</span><span style={{fontSize:13}}>{s.users?.avatar_emoji||"🏀"}</span><span style={{flex:1,fontSize:12,color:C.text}}>{s.users?.name}</span><span style={{fontSize:14,fontWeight:900,color:"#FFB800"}}>{s.score}</span></div>)}
      </Card>}
      <button className="btn" onClick={()=>setScreen("menu")} style={{width:"100%",padding:"13px",borderRadius:10,background:"#FFB800",color:"#07090f",fontWeight:900,fontSize:14}}>← Volver</button>
    </div>);
    const q=triviaSet[triviaQ]||triviaSet[0];
    return(<div className="fade-up">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <ST sub="NBA Trivia">Pregunta {triviaQ+1}/{triviaSet.length||10}</ST>
        <div style={{fontSize:20,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#FFB800"}}>{triviaScore} pts</div>
      </div>
      <Card style={{marginBottom:14,textAlign:"center",padding:20}}><div style={{fontSize:15,fontWeight:700,color:C.text,lineHeight:1.4}}>{q.q}</div></Card>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {q.opts.map((opt,i)=><button key={i} className="btn" onClick={()=>answerTrivia(i)} style={{padding:"14px 10px",borderRadius:12,background:triviaFeedback!==null?(i===q.a?"#00FF9D22":triviaFeedback===false&&i!==q.a?"#ff444411":"#0a1018"):"#0a1018",border:`2px solid ${triviaFeedback!==null?(i===q.a?"#00FF9D":triviaFeedback===false&&i!==q.a?"#ff4444":C.border):C.border}`,color:triviaFeedback!==null?(i===q.a?"#00FF9D":C.dim):C.text,fontSize:13,fontWeight:600,textAlign:"center",transition:"all .2s"}}>{opt}</button>)}
      </div>
      {triviaFeedback!==null&&<div style={{textAlign:"center",marginTop:10,fontSize:16,fontWeight:700,color:triviaFeedback?"#00FF9D":"#ff6666"}}>{triviaFeedback?"✅ ¡Correcto!":"❌ Incorrecto — era: "+q.opts[q.a]}</div>}
      <button className="btn" onClick={()=>setScreen("menu")} style={{width:"100%",marginTop:14,padding:"10px",borderRadius:10,background:"#0a1018",border:`1px solid ${C.border}`,color:C.dim,fontSize:12}}>Salir</button>
    </div>);
  }

  if(screen==="game"&&game==="guess"){
    if(guessDone) return(<div className="fade-up">
      <ST sub="Adivina el Jugador">Resultado</ST>
      <Card style={{textAlign:"center",padding:30,marginBottom:14}}>
        <div style={{fontSize:56,marginBottom:8}}>🕵️</div>
        <div style={{fontSize:36,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#00FF9D"}}>{guessScore}/8</div>
        <div style={{fontSize:14,color:C.dim,marginTop:4}}>{guessScore>=7?"¡Sabes quiénes son todos! 🏆":guessScore>=5?"¡Buen ojo! 👀":"¿Ves los partidos? 😅"}</div>
      </Card>
      {scores.length>0&&<Card style={{marginBottom:14}}><div style={{fontSize:11,color:C.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:2}}>🏆 Top Puntuaciones</div>
        {scores.map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<scores.length-1?`1px solid ${C.border}`:"none"}}><span style={{fontSize:11,color:C.muted,width:16}}>{i+1}</span><span style={{fontSize:13}}>{s.users?.avatar_emoji||"🏀"}</span><span style={{flex:1,fontSize:12,color:C.text}}>{s.users?.name}</span><span style={{fontSize:14,fontWeight:900,color:"#00FF9D"}}>{s.score}/8</span></div>)}
      </Card>}
      <button className="btn" onClick={()=>setScreen("menu")} style={{width:"100%",padding:"13px",borderRadius:10,background:"#00FF9D",color:"#07090f",fontWeight:900,fontSize:14}}>← Volver</button>
    </div>);
    if(!guessQ) return null;
    const{correct,opts}=guessQ;
    return(<div className="fade-up">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <ST sub="Adivina el Jugador">Ronda {guessRound+1}/8</ST>
        <div style={{fontSize:20,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#00FF9D"}}>{guessScore} pts</div>
      </div>
      <Card style={{marginBottom:14,background:"linear-gradient(135deg,#00FF9D08,#0d1117)",borderColor:"#00FF9D33",padding:"18px 20px"}}>
        <div style={{fontSize:10,color:"#00FF9D",textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>🕵️ ¿Quién es este jugador?</div>
        {correct.clues.map((clue,i)=>(
          <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"8px 0",borderBottom:i<correct.clues.length-1?`1px solid ${C.border}`:"none"}}>
            <span style={{color:"#00FF9D",fontSize:11,fontWeight:900,minWidth:18}}>{i+1}.</span>
            <span style={{fontSize:12,color:C.text,lineHeight:1.4}}>{clue}</span>
          </div>
        ))}
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {opts.map((p)=>{
          const isCorrect=p.name===correct.name;
          return<button key={p.name} className="btn" onClick={()=>answerGuess(p)} style={{padding:"14px 10px",borderRadius:12,textAlign:"center",background:guessFeedback!==null?(isCorrect?"#00FF9D22":"#0a1018"):"#0a1018",border:`2px solid ${guessFeedback!==null?isCorrect?"#00FF9D":C.border:C.border}`,transition:"all .2s"}}>
            {guessFeedback!==null&&logo(p.team,24)}
            <div style={{fontSize:12,fontWeight:700,color:guessFeedback!==null&&isCorrect?"#00FF9D":C.text,marginTop:guessFeedback!==null?4:0}}>{p.name}</div>
            {guessFeedback!==null&&<div style={{fontSize:10,color:C.dim,marginTop:2}}>{p.team}</div>}
          </button>;
        })}
      </div>
      {guessFeedback!==null&&<div style={{textAlign:"center",marginTop:10,fontSize:15,fontWeight:700,color:guessFeedback?"#00FF9D":"#ff6666"}}>{guessFeedback?"✅ ¡Correcto!":"❌ Era "+correct.name}</div>}
      <div style={{height:5,borderRadius:3,background:C.border,overflow:"hidden",marginTop:14}}><div style={{width:`${(guessRound/8)*100}%`,height:"100%",background:"#00FF9D",transition:"width .4s"}}/></div>
    </div>);
  }

  if(screen==="game"&&game==="champs"){
    if(champsDone) return(<div className="fade-up">
      <ST sub="Campeones NBA">Resultado</ST>
      <Card style={{textAlign:"center",padding:30,marginBottom:14}}>
        <div style={{fontSize:56,marginBottom:8}}>🏆</div>
        <div style={{fontSize:36,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#E03A3E"}}>{champsScore}/10</div>
        <div style={{fontSize:14,color:C.dim,marginTop:4}}>{champsScore>=9?"¡Eres un historiador NBA! 🏆":champsScore>=6?"¡Buen conocimiento! 💪":"A repasar la historia 📚"}</div>
      </Card>
      {scores.length>0&&<Card style={{marginBottom:14}}><div style={{fontSize:11,color:C.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:2}}>🏆 Top Puntuaciones</div>
        {scores.map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<scores.length-1?`1px solid ${C.border}`:"none"}}><span style={{fontSize:11,color:C.muted,width:16}}>{i+1}</span><span style={{fontSize:13}}>{s.users?.avatar_emoji||"🏀"}</span><span style={{flex:1,fontSize:12,color:C.text}}>{s.users?.name}</span><span style={{fontSize:14,fontWeight:900,color:"#E03A3E"}}>{s.score}/10</span></div>)}
      </Card>}
      <button className="btn" onClick={()=>setScreen("menu")} style={{width:"100%",padding:"13px",borderRadius:10,background:"#E03A3E",color:"#fff",fontWeight:900,fontSize:14}}>← Volver</button>
    </div>);
    if(!champsQ) return null;
    const{correct,opts}=champsQ;
    return(<div className="fade-up">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <ST sub="Campeones NBA">Ronda {champsRound+1}/10</ST>
        <div style={{fontSize:20,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#E03A3E"}}>{champsScore} pts</div>
      </div>
      <Card style={{marginBottom:20,background:"linear-gradient(135deg,#E03A3E11,#0d1117)",borderColor:"#E03A3E44",textAlign:"center",padding:"28px 20px"}}>
        <div style={{fontSize:11,color:"#E03A3E",textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>🏆 ¿Quién fue campeón en...?</div>
        <div style={{fontSize:72,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.text}}>{correct.year}</div>
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {opts.map((o)=>{
          const isCorrect=o.team===correct.team;
          return<button key={o.team+o.year} className="btn" onClick={()=>answerChamps(o.team)} style={{padding:"16px 10px",borderRadius:12,textAlign:"center",background:champsFeedback!==null?(isCorrect?"#E03A3E22":"#0a1018"):"#0a1018",border:`2px solid ${champsFeedback!==null?isCorrect?"#E03A3E":C.border:C.border}`,transition:"all .2s"}}>
            {champsFeedback!==null&&logo(o.team,32)}
            <div style={{fontSize:12,fontWeight:700,color:champsFeedback!==null&&isCorrect?"#E03A3E":C.text,marginTop:champsFeedback!==null?4:0}}>{o.label||tm(o.team).name||o.team}</div>
          </button>;
        })}
      </div>
      {champsFeedback!==null&&<div style={{textAlign:"center",marginTop:10,fontSize:15,fontWeight:700,color:champsFeedback?"#E03A3E":"#ff6666"}}>{champsFeedback?"🏆 ¡Correcto!":"❌ Fue "+(correct.label||tm(correct.team).name||correct.team)}</div>}
      <div style={{height:5,borderRadius:3,background:C.border,overflow:"hidden",marginTop:14}}><div style={{width:`${(champsRound/10)*100}%`,height:"100%",background:"#E03A3E",transition:"width .4s"}}/></div>
    </div>);
  }

  return null;
};

/* ═══ SHOP TAB ═══ */
const ShopTab=({userCtx})=>{
  const {user}=userCtx||{};
  const [shopItems,setShopItems]=useState([]);
  const [equipped,setEquipped]=useState(()=>JSON.parse(localStorage.getItem("courtiq_equipped_"+(user?.id||""))||"{}"));
  const [balance,setBalance]=useState(null);
  const [shields,setShields]=useState(0);
  const [loading,setLoading]=useState(false);
  const [msg,setMsg]=useState("");
  const [groupId,setGroupId]=useState(null);
  const [selCat,setSelCat]=useState("Todos");
  const [showOwned,setShowOwned]=useState(false);

  useEffect(()=>{
    if(!user)return;
    const gid=localStorage.getItem("courtiq_lastgroup");
    setGroupId(gid);
    if(gid) pickemAPI("getBalance",{params:{userId:user.id,groupId:gid}}).then(d=>{if(d.ok)setBalance(d.balance);});
    pickemAPI("myShopItems",{params:{userId:user.id}}).then(d=>{if(d.ok)setShopItems(d.items||[]);});
    pickemAPI("getShields",{params:{userId:user.id}}).then(d=>{if(d.ok)setShields(d.shields||0);});
    setEquipped(JSON.parse(localStorage.getItem("courtiq_equipped_"+user.id)||"{}"));
  },[user]);

  const equip=(item)=>{
    const type=item.type;
    const cur=equipped[type];
    const next=cur===item.key?null:item.key; // toggle off if already equipped
    const updated=next?{...equipped,[type]:next}:{...equipped};
    if(!next)delete updated[type];
    setEquipped(updated);
    localStorage.setItem("courtiq_equipped_"+user.id,JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("courtiq_equipped_changed"));
    setMsg(next?`⚡ "${item.name}" equipado en tu perfil`:`✅ Item desequipado`);
  };

  const buy=async(item)=>{
    if(!groupId){setMsg("Abre un grupo primero para gastar monedas");return;}
    if(!confirm(`¿Comprar "${item.name}" por 🪙${item.cost}?`))return;
    setLoading(true);setMsg("");
    const d=await pickemAPI("purchaseItem",{body:{userId:user.id,groupId,itemKey:item.key,itemCost:item.cost}});
    if(d.ok){
      if(item.type==="shield"){setShields(s=>s+1);setMsg("✅ +1 escudo de racha agregado");}
      else if(item.type==="extra_pick"){setMsg("✅ +1 pick extra agregado");}
      else{
        const newItems=[...shopItems,item.key];
        setShopItems(newItems);
        // Auto-equip al comprar
        const updated={...equipped,[item.type]:item.key};
        setEquipped(updated);
        localStorage.setItem("courtiq_equipped_"+user.id,JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("courtiq_items_purchased",{detail:{userId:user.id}}));
        window.dispatchEvent(new CustomEvent("courtiq_equipped_changed"));
        setMsg(`✅ ¡${item.name} comprado y equipado!`);
      }
      setBalance(b=>b-item.cost);
    }else setMsg(d.error||"Error");
    setLoading(false);
  };

  if(!user)return<div className="fade-up"><Card style={{textAlign:"center",padding:40}}><div style={{fontSize:48,marginBottom:12}}>🛍️</div><div style={{fontSize:16,fontWeight:700,color:C.text}}>Inicia sesión para acceder a la tienda</div></Card></div>;

  const cats=["Todos",...new Set(SHOP_ITEMS.map(i=>i.cat))];
  const allOwned=SHOP_ITEMS.filter(i=>i.type!=="shield"&&i.type!=="extra_pick"&&shopItems.includes(i.key));
  const filtered=(showOwned?allOwned:(selCat==="Todos"?SHOP_ITEMS:SHOP_ITEMS.filter(i=>i.cat===selCat)));

  // Preview del jugador con items equipados
  const previewColor=getNameColor(shopItems,equipped);
  const previewPrefix=getNamePrefix(shopItems,equipped);
  const previewBorder=getBorderColor(shopItems,equipped);

  return(<div className="fade-up">
    <ST sub="Personaliza tu perfil">Coin Shop 🛍️</ST>

    {/* Saldo */}
    <Card style={{marginBottom:14,background:"linear-gradient(135deg,#FFB80012,#0d1117)",borderColor:"#FFB80044",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
      <div><div style={{fontSize:9,color:"#FFB800",textTransform:"uppercase",letterSpacing:2}}>Tu saldo</div><div style={{fontSize:40,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#FFB800"}}>{balance!==null?balance:<Spin/>} 🪙</div><div style={{fontSize:10,color:C.dim}}>Gana monedas acertando picks</div></div>
      {shields>0&&<div style={{background:"#00C2FF11",border:"1px solid #00C2FF33",borderRadius:10,padding:"10px 16px",textAlign:"center"}}><div style={{fontSize:9,color:C.accent,textTransform:"uppercase",letterSpacing:1}}>Escudos</div><div style={{fontSize:28,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.accent}}>🛡️ {shields}</div></div>}
    </Card>

    {/* Vista previa del perfil */}
    {allOwned.length>0&&<Card style={{marginBottom:14,background:"#0a1018",borderColor:C.border}}>
      <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>Vista previa de tu perfil</div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:38,height:38,borderRadius:"50%",background:"#0d1117",border:`2px solid ${previewBorder||C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,boxShadow:previewBorder?`0 0 10px ${previewBorder}66`:undefined}}>{user?.emoji||"🏀"}</div>
        <div>
          <div style={{fontSize:14,fontWeight:800,color:previewColor||C.text}}>{previewPrefix}{user?.name||"Tú"}</div>
          <div style={{fontSize:10,color:C.dim}}>Así te ven en el ranking</div>
        </div>
      </div>
    </Card>}

    {/* Mis items equipados */}
    {allOwned.length>0&&<Card style={{marginBottom:14,borderColor:"#FFB80033",background:"#FFB80008"}}>
      <div style={{fontSize:9,color:"#FFB800",textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>⚡ Items Equipados</div>
      {["title","color","border"].map(type=>{
        const eqKey=equipped[type];
        const eqItem=eqKey?SHOP_ITEMS.find(i=>i.key===eqKey):null;
        const ownedOfType=allOwned.filter(i=>i.type===type);
        if(ownedOfType.length===0)return null;
        return<div key={type} style={{marginBottom:8}}>
          <div style={{fontSize:9,color:C.dim,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>{type==="title"?"Título":type==="color"?"Color de nombre":"Marco"}</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {ownedOfType.map(item=>{
              const isEq=equipped[type]===item.key;
              return<button key={item.key} className="btn" onClick={()=>equip(item)} style={{padding:"5px 10px",borderRadius:20,background:isEq?"#FFB80022":"#0d1117",border:`1px solid ${isEq?"#FFB800":C.border}`,color:isEq?"#FFB800":C.dim,fontSize:11,fontWeight:700,display:"flex",alignItems:"center",gap:4}}>
                <span>{item.emoji}</span><span>{item.name.replace("Título ","").replace("Nombre ","").replace("Marco ","")}</span>
                {isEq&&<span style={{fontSize:9,color:"#FFB800"}}>✓</span>}
              </button>;
            })}
          </div>
        </div>;
      })}
    </Card>}

    {msg&&<div style={{marginBottom:14,padding:"10px 14px",background:msg.startsWith("✅")||msg.startsWith("⚡")?"#00FF9D11":"#ff444411",border:`1px solid ${msg.startsWith("✅")||msg.startsWith("⚡")?"#00FF9D33":"#ff444433"}`,borderRadius:10,fontSize:12,color:msg.startsWith("✅")||msg.startsWith("⚡")?"#00FF9D":"#ff6666"}}>{msg}</div>}

    {/* Filtros */}
    <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:14,paddingBottom:4}}>
      <button className="btn" onClick={()=>{setShowOwned(o=>!o);setSelCat("Todos");}} style={{padding:"6px 14px",borderRadius:20,background:showOwned?"#FFB800":"#0d1117",border:`1px solid ${showOwned?"#FFB800":C.border}`,color:showOwned?"#07090f":C.dim,fontSize:11,fontWeight:700,whiteSpace:"nowrap",flexShrink:0}}>
        🎒 Mis items {allOwned.length>0&&`(${allOwned.length})`}
      </button>
      {!showOwned&&cats.map(c=><button key={c} className="btn" onClick={()=>setSelCat(c)} style={{padding:"6px 14px",borderRadius:20,background:selCat===c?C.accent:"#0d1117",border:`1px solid ${selCat===c?C.accent:C.border}`,color:selCat===c?"#07090f":C.dim,fontSize:11,fontWeight:700,whiteSpace:"nowrap",flexShrink:0}}>{c}</button>)}
    </div>

    {/* Grid de items */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:22}}>
      {filtered.map(item=>{
        const owned=item.type==="shield"||item.type==="extra_pick"?false:shopItems.includes(item.key);
        const isEquipped=owned&&equipped[item.type]===item.key;
        const canAfford=balance===null||balance>=item.cost;
        const isRainbow=item.value==="rainbow";
        return<Card key={item.key} style={{padding:"16px 12px",borderColor:isEquipped?`#FFB80077`:owned?`${C.accent}55`:C.border,position:"relative",overflow:"hidden",background:isEquipped?"#FFB80008":undefined}}>
          {isEquipped&&<div style={{position:"absolute",top:6,right:6,background:"#FFB80022",border:"1px solid #FFB80066",borderRadius:8,padding:"2px 6px",fontSize:8,fontWeight:700,color:"#FFB800"}}>⚡ PUESTO</div>}
          {owned&&!isEquipped&&<div style={{position:"absolute",top:6,right:6,background:`${C.accent}22`,border:`1px solid ${C.accent}44`,borderRadius:8,padding:"2px 6px",fontSize:8,fontWeight:700,color:C.accent}}>TUYO</div>}
          <div style={{fontSize:32,marginBottom:6,textAlign:"center"}}>{item.emoji}</div>
          <div style={{fontSize:12,fontWeight:800,color:owned?C.text:C.muted,textAlign:"center",marginBottom:4}}>{item.name}</div>
          <div style={{fontSize:9,color:C.dim,textAlign:"center",marginBottom:10,lineHeight:1.4}}>{item.desc}</div>
          {item.type==="color"&&<div style={{height:4,borderRadius:2,background:item.value,marginBottom:10}}/>}
          {item.type==="border"&&<div style={{height:4,borderRadius:2,background:isRainbow?"linear-gradient(90deg,#FF0000,#FF7F00,#FFFF00,#00FF00,#00C2FF,#8B00FF)":`linear-gradient(90deg,transparent,${item.value},transparent)`,marginBottom:10}}/>}
          {owned&&item.type!=="shield"&&item.type!=="extra_pick"
            ?<button className="btn" onClick={()=>equip(item)} style={{width:"100%",padding:"8px",borderRadius:8,background:isEquipped?"linear-gradient(135deg,#FFB800,#ff9500)":"#0d1117",color:isEquipped?"#07090f":C.muted,fontSize:11,fontWeight:900,border:`1px solid ${isEquipped?"#FFB800":C.border}`}}>
              {isEquipped?"⚡ Equipado":"Equipar"}
            </button>
            :<button className="btn" onClick={()=>buy(item)} disabled={loading||(!owned&&!canAfford)} style={{width:"100%",padding:"8px",borderRadius:8,background:canAfford?`linear-gradient(135deg,#FFB800,#ff9500)`:"#0a1018",color:canAfford?"#07090f":C.muted,fontSize:12,fontWeight:900}}>
              {item.type==="shield"?"🛡️ ":item.type==="extra_pick"?"🔄 ":""}🪙{item.cost}
            </button>
          }
        </Card>;
      })}
    </div>
    <div style={{padding:"12px 16px",background:"#0a1018",borderRadius:10,border:`1px solid ${C.border}`,fontSize:11,color:C.dim}}>
      💡 Equipa solo un título, color y marco a la vez. Se ven en el ranking de tu grupo. El escudo protege tu racha de aciertos.
    </div>
  </div>);
};

/* ═══ SETTINGS TAB ═══ */
const EMOJI_OPTS=["🏀","🏆","🔥","⭐","💎","👑","🦁","🐺","🦅","🐯","💪","🎯","🚀","✨","🌟","🎮","🃏","🥇","🎖️","🏅","🧠","💫","⚡","🎪","🦎","🐻","🏟️","🔮","🎲","🌊"];

const SettingsTab=({userCtx,installPrompt,onInstalled})=>{
  const {user,logout,save}=userCtx||{};
  const [showEmojiPicker,setShowEmojiPicker]=useState(false);
  const [notifGranted,setNotifGranted]=useState(typeof Notification!=="undefined"&&Notification.permission==="granted");
  const [notifPrefs,setNotifPrefs]=useState({picks_reminder:true,win_notify:true,loss_notify:true,daily_summary:true});
  const [notifLoading,setNotifLoading]=useState(false);
  const [msg,setMsg]=useState("");
  const [achievements,setAchievements]=useState([]);
  const [showDeleteConfirm,setShowDeleteConfirm]=useState(false);
  const [deleteLoading,setDeleteLoading]=useState(false);
  const [emailInput,setEmailInput]=useState("");
  const [emailLoading,setEmailLoading]=useState(false);
  const [emailMsg,setEmailMsg]=useState("");
  const [myStats,setMyStats]=useState(null);
  const [myShopItems,setMyShopItems]=useState([]);
  const [myEquippedSettings,setMyEquippedSettings]=useState(()=>JSON.parse(localStorage.getItem("courtiq_equipped_"+(user?.id||""))||"{}"));

  useEffect(()=>{
    if(!user) return;
    pickemAPI("getNotifPrefs",{params:{userId:user.id}}).then(d=>{if(d.ok)setNotifPrefs(d.prefs);});
    pickemAPI("getAchievements",{params:{userId:user.id}}).then(d=>{if(d.ok)setAchievements(d.achievements||[]);});
    pickemAPI("userProfile",{params:{userId:user.id,targetId:user.id}}).then(d=>{if(d.ok){setMyStats(d.stats);setMyShopItems(d.shopItems||[]);}});
    setMyEquippedSettings(JSON.parse(localStorage.getItem("courtiq_equipped_"+user.id)||"{}"));
    // Pre-fill email from stored user
    if(user.email) setEmailInput(user.email);
  },[user]);

  const saveEmail=async()=>{
    setEmailLoading(true);setEmailMsg("");
    const d=await pickemAPI("updateEmail",{body:{userId:user.id,email:emailInput.trim()}});
    if(d.ok){setEmailMsg("✅ Correo guardado");save({...user,email:emailInput.trim()||undefined});}
    else setEmailMsg(d.error||"Error");
    setEmailLoading(false);
    setTimeout(()=>setEmailMsg(""),4000);
  };

  const subscribePush=async()=>{
    setNotifLoading(true);setMsg("");
    try{
      await autoSubscribePush(user.id);
      setNotifGranted(true);
      setMsg("✅ ¡Notificaciones activadas correctamente!");
    }catch(e){
      if(e.message==="iOS_NOT_INSTALLED"){
        setMsg("📲 En iPhone debes instalar la app primero: toca Compartir → 'Agregar a inicio'. Después activa las notificaciones.");
      } else {
        setMsg("❌ "+e.message);
      }
    }
    setNotifLoading(false);
  };

  const unsubscribePush=async()=>{
    setNotifLoading(true);
    try{
      const reg=await navigator.serviceWorker.ready;
      const sub=await reg.pushManager.getSubscription();
      if(sub) await sub.unsubscribe();
      await pickemAPI("unsubscribePush",{body:{userId:user.id}});
      setNotifGranted(false);
      setMsg("🔕 Notificaciones desactivadas");
    }catch(e){setMsg("Error: "+e.message);}
    setNotifLoading(false);
  };

  const saveNotifPref=(key,val)=>{
    const next={...notifPrefs,[key]:val};
    setNotifPrefs(next);
    pickemAPI("setNotifPrefs",{body:{userId:user.id,...next}});
  };

  const saveEmoji=async(emoji)=>{
    setShowEmojiPicker(false);
    save({...user,avatar_emoji:emoji});
    await pickemAPI("updateProfile",{body:{userId:user.id,avatarEmoji:emoji}});
  };

  const deleteAccount=async()=>{
    setDeleteLoading(true);
    const d=await pickemAPI("deleteAccount",{body:{userId:user.id}});
    if(d.ok){
      logout();
      localStorage.clear();
    } else {
      setMsg("Error al eliminar: "+d.error);
      setShowDeleteConfirm(false);
    }
    setDeleteLoading(false);
  };

  if(!user) return(
    <div className="fade-up">
      <Card style={{textAlign:"center",padding:"40px 20px"}}>
        <div style={{fontSize:48,marginBottom:12}}>⚙️</div>
        <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:8}}>Inicia sesión primero</div>
        <div style={{fontSize:12,color:C.dim}}>Ve a Grupos para crear tu perfil</div>
      </Card>
    </div>
  );

  const settingsNameClr=getNameColor(myShopItems,myEquippedSettings);
  const settingsPrefix=getNamePrefix(myShopItems,myEquippedSettings);
  const settingsBorder=getBorderColor(myShopItems,myEquippedSettings);

  return(<div className="fade-up">
    {/* Perfil */}
    <ST sub="Cuenta">Mi Perfil</ST>
    <Card style={{marginBottom:14,background:`linear-gradient(135deg,${C.accent}11,${C.card})`,borderColor:`${C.accent}33`}}>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <button className="btn" onClick={()=>setShowEmojiPicker(p=>!p)} style={{width:58,height:58,borderRadius:"50%",background:`${C.accent}20`,border:`2px solid ${settingsBorder||( showEmojiPicker?C.accent:C.accent+"44")}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0,boxShadow:settingsBorder?`0 0 10px ${settingsBorder}55`:undefined}} title="Cambiar avatar">{user.avatar_emoji||"🏀"}</button>
        <div style={{flex:1}}>
          <div style={{fontSize:20,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:settingsNameClr||C.text}}>{settingsPrefix}{user.name}</div>
          <div style={{fontSize:10,color:C.muted,letterSpacing:1,marginBottom:4}}>Toca el emoji para cambiar avatar</div>
          {myShopItems.length>0&&<div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {["title","color","border"].map(type=>{
              const key=myEquippedSettings[type];
              const item=key?SHOP_ITEMS.find(i=>i.key===key):null;
              return item?<span key={type} style={{fontSize:10,background:"#0d1117",border:`1px solid ${C.border}`,borderRadius:12,padding:"2px 7px",color:C.dim}}>{item.emoji} {item.name.replace("Título ","").replace("Nombre ","").replace("Marco ","")}</span>:null;
            })}
          </div>}
        </div>
        <button className="btn" onClick={logout} style={{padding:"8px 16px",borderRadius:8,background:"#ff444422",border:"1px solid #ff444444",color:"#ff6666",fontSize:12,fontWeight:700}}>Salir</button>
      </div>
      {showEmojiPicker&&<div style={{marginTop:14,paddingTop:12,borderTop:`1px solid ${C.border}`}}>
        <div style={{fontSize:10,color:C.muted,marginBottom:8,letterSpacing:1}}>ELIGE TU AVATAR</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {EMOJI_OPTS.map(e=><button key={e} className="btn" onClick={()=>saveEmoji(e)} style={{width:40,height:40,borderRadius:10,background:user.avatar_emoji===e?`${C.accent}22`:"#0a1018",border:`1px solid ${user.avatar_emoji===e?C.accent:C.border}`,fontSize:20}}>{e}</button>)}
        </div>
      </div>}
    </Card>

    {/* Stats personales */}
    {myStats&&<Card style={{marginBottom:14,background:"#0a1018"}}>
      <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>📊 Mis estadísticas</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
        {[["🎯",myStats.totalPicks||0,"Picks",C.accent],["✅",myStats.totalCorrect||0,"Aciertos","#00FF9D"],["📊",`${myStats.accuracy||0}%`,"Precisión","#FFB800"],["⭐",myStats.totalPoints||0,"Puntos","#FF6B35"],["🔥",myStats.bestStreak||0,"Mejor racha","#FF6B35"]].map(([icon,v,l,c])=><div key={l} style={{background:"#0d1117",borderRadius:10,padding:"10px 4px",textAlign:"center"}}>
          <div style={{fontSize:10,marginBottom:2}}>{icon}</div>
          <div style={{fontSize:16,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:c}}>{v}</div>
          <div style={{fontSize:8,color:C.muted,marginTop:1,lineHeight:1.2}}>{l}</div>
        </div>)}
      </div>
    </Card>}

    {/* Instalar App */}
    {(installPrompt||isIOS())&&<>
      <ST sub="PWA">Instalar App</ST>
      <Card style={{marginBottom:18,borderColor:`${C.accent}33`}}>
        {isIOS()
          ?<div>
            <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:12}}>
              <span style={{fontSize:32}}>📲</span>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:4}}>Instalar en iPhone / iPad</div>
                <div style={{fontSize:12,color:C.dim,lineHeight:1.6}}>Para instalar Court IQ y habilitar notificaciones:</div>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[["1","Toca el botón","📤 Compartir","en Safari (barra inferior)"],["2","Baja y busca","➕ Agregar a pantalla de inicio",""],["3","Toca","Agregar","en la esquina superior derecha"]].map(([n,pre,bold,post])=>
                <div key={n} style={{display:"flex",gap:10,alignItems:"center",padding:"8px 12px",background:"#0a1018",borderRadius:10,border:`1px solid ${C.border}`}}>
                  <div style={{width:24,height:24,borderRadius:"50%",background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:"#07090f",flexShrink:0}}>{n}</div>
                  <div style={{fontSize:12,color:C.text}}>{pre} <span style={{color:C.accent,fontWeight:700}}>{bold}</span> {post}</div>
                </div>
              )}
            </div>
          </div>
          :<div>
            <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:12}}>
              <span style={{fontSize:32}}>📱</span>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:2}}>Instalar Court IQ</div>
                <div style={{fontSize:12,color:C.dim}}>Acceso directo desde tu pantalla de inicio, sin navegador</div>
              </div>
            </div>
            <button className="btn" onClick={async()=>{if(!installPrompt)return;installPrompt.prompt();const{outcome}=await installPrompt.userChoice;if(outcome==="accepted")onInstalled?.();}} style={{width:"100%",padding:"13px",borderRadius:10,background:`linear-gradient(135deg,${C.accent},#0066ff)`,color:"#07090f",fontWeight:900,fontSize:14}}>📲 Instalar App</button>
          </div>
        }
      </Card>
    </>}

    {/* Notificaciones */}
    <ST sub="Push">Notificaciones</ST>
    <Card style={{marginBottom:18}}>
      {msg&&<div style={{fontSize:11,color:"#00FF9D",marginBottom:10,padding:"8px 10px",background:"#00FF9D11",borderRadius:8}}>{msg}</div>}
      {!notifGranted
        ?<>
          <div style={{fontSize:12,color:C.dim,marginBottom:12}}>Activa notificaciones para recordatorios de picks, alertas de aciertos y resúmenes diarios</div>
          <button className="btn" onClick={subscribePush} disabled={notifLoading} style={{width:"100%",padding:"13px",borderRadius:10,background:`linear-gradient(135deg,${C.accent},#0066ff)`,color:"#07090f",fontSize:13,fontWeight:900}}>{notifLoading?<Spin s={13}/>:"🔔 Activar notificaciones"}</button>
        </>
        :<>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div style={{fontSize:11,color:"#00FF9D"}}>✅ Activas — elige cuáles recibir:</div>
            <button className="btn" onClick={unsubscribePush} disabled={notifLoading} style={{padding:"6px 12px",borderRadius:8,background:"#ff444422",border:"1px solid #ff444444",color:"#ff6666",fontSize:11,fontWeight:700}}>{notifLoading?<Spin s={11}/>:"🔕 Apagar"}</button>
          </div>
          {[["picks_reminder","⏰ Recordatorio de picks","30 min antes del primer partido"],["win_notify","🎉 Cuando aciertes","Celebra cada predicción correcta"],["loss_notify","😅 Cuando falles","Para que aprendas jeje"],["daily_summary","📊 Resumen del día","Precisión y puntos al final del día"]].map(([key,label,desc])=>
            <div key={key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 0",borderBottom:`1px solid ${C.border}`}}>
              <div><div style={{fontSize:13,fontWeight:700,color:C.text}}>{label}</div><div style={{fontSize:10,color:C.dim}}>{desc}</div></div>
              <button className="btn" onClick={()=>saveNotifPref(key,!notifPrefs[key])} style={{width:46,height:26,borderRadius:13,background:notifPrefs[key]?C.accent:"#0a1018",border:`2px solid ${notifPrefs[key]?C.accent:C.border}`,position:"relative",flexShrink:0}}>
                <div style={{width:18,height:18,borderRadius:"50%",background:"#07090f",position:"absolute",top:2,left:notifPrefs[key]?"calc(100% - 22px)":2,transition:"left .2s"}}/>
              </button>
            </div>
          )}
        </>
      }
    </Card>

    {/* Puntuación */}
    <ST sub="Cómo funciona">Sistema de Puntos</ST>
    <Card style={{marginBottom:18}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        {[["✅ Acierto","10 pts","#00FF9D"],["🔥 Racha","bonus","#FF6B35"],["🪙 Apuestas","vs grupo",C.accent]].map(([l,v,c])=>
          <div key={l} style={{background:"#0a1018",borderRadius:10,padding:"12px 8px",textAlign:"center"}}>
            <div style={{fontSize:18,marginBottom:4}}>{l.split(" ")[0]}</div>
            <div style={{fontSize:10,color:C.dim,marginBottom:4}}>{l.split(" ").slice(1).join(" ")}</div>
            <div style={{fontSize:17,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:c}}>{v}</div>
          </div>
        )}
      </div>
    </Card>

    {/* Logros */}
    <ST sub="Logros">Mis Badges</ST>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:8,marginBottom:24}}>
      {ACHIEVEMENT_DEFS.filter(a=>!a.key.startsWith("shop_")).map(a=>{
        const unlocked=achievements.some(x=>x.achievement_key===a.key);
        return<Card key={a.key} style={{textAlign:"center",padding:"14px 10px",opacity:unlocked?1:0.35,borderColor:unlocked?`${C.accent}44`:C.border}}>
          <div style={{fontSize:28,marginBottom:6}}>{a.emoji}</div>
          <div style={{fontSize:11,fontWeight:800,color:unlocked?C.text:C.muted}}>{a.name}</div>
          <div style={{fontSize:9,color:C.dim,marginTop:2}}>{a.desc}</div>
          {unlocked&&<div style={{fontSize:8,color:C.accent,marginTop:4}}>✅ Desbloqueado</div>}
        </Card>;
      })}
    </div>

    {/* Legal */}
    <ST sub="Legal">Privacidad</ST>
    <Card style={{marginBottom:18}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:C.text}}>Política de Privacidad</div>
          <div style={{fontSize:10,color:C.dim,marginTop:2}}>Qué datos guardamos y cómo los usamos</div>
        </div>
        <a href="/privacy.html" target="_blank" style={{padding:"8px 14px",borderRadius:8,background:`${C.accent}15`,border:`1px solid ${C.accent}33`,color:C.accent,fontSize:12,fontWeight:700,textDecoration:"none",flexShrink:0}}>Ver →</a>
      </div>
    </Card>

    {/* Correo de recuperación */}
    <ST sub="Seguridad">Correo de recuperación</ST>
    <Card style={{marginBottom:18}}>
      <div style={{fontSize:12,color:C.dim,marginBottom:12}}>Vincula un correo para poder recuperar tu PIN si lo olvidas.</div>
      <div style={{display:"flex",gap:8}}>
        <input value={emailInput} onChange={e=>setEmailInput(e.target.value)} type="email" placeholder="tu@correo.com" style={{flex:1,background:"#0a1018",border:`1px solid ${user?.email?C.accent:C.border}`,borderRadius:10,padding:"11px 14px",color:C.text,fontSize:13,minWidth:0}}/>
        <button className="btn" onClick={saveEmail} disabled={emailLoading} style={{padding:"11px 16px",borderRadius:10,background:`linear-gradient(135deg,${C.accent},#0066ff)`,color:"#07090f",fontSize:13,fontWeight:800,flexShrink:0}}>{emailLoading?<Spin s={13}/>:"Guardar"}</button>
      </div>
      {user?.email&&<div style={{fontSize:10,color:"#22c55e",marginTop:6}}>✓ Correo vinculado — puedes recuperar tu PIN por email</div>}
      {emailMsg&&<div style={{fontSize:11,color:emailMsg.startsWith("✅")?"#22c55e":"#ff6666",marginTop:6}}>{emailMsg}</div>}
    </Card>

    {/* Zona peligrosa */}
    <ST sub="Zona peligrosa">Cuenta</ST>
    <Card style={{marginBottom:18,borderColor:"#ff444433"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:"#ff6666"}}>Eliminar cuenta</div>
          <div style={{fontSize:10,color:C.dim,marginTop:2}}>Borra permanentemente todos tus datos</div>
        </div>
        <button className="btn" onClick={()=>setShowDeleteConfirm(true)} style={{padding:"8px 14px",borderRadius:8,background:"#ff444422",border:"1px solid #ff444444",color:"#ff6666",fontSize:12,fontWeight:700,flexShrink:0}}>Eliminar</button>
      </div>
    </Card>

    {/* Modal confirmar eliminar */}
    {showDeleteConfirm&&<div onClick={()=>!deleteLoading&&setShowDeleteConfirm(false)} style={{position:"fixed",inset:0,background:"#00000099",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.card,border:"1px solid #ff444444",borderRadius:20,padding:28,maxWidth:320,width:"100%",textAlign:"center"}}>
        <div style={{fontSize:44,marginBottom:12}}>⚠️</div>
        <div style={{fontSize:17,fontWeight:900,color:C.text,marginBottom:8}}>¿Eliminar tu cuenta?</div>
        <div style={{fontSize:12,color:C.dim,lineHeight:1.6,marginBottom:20}}>Esta acción es <b style={{color:"#ff6666"}}>permanente e irreversible</b>. Se eliminarán todos tus picks, monedas, logros y mensajes.</div>
        <div style={{display:"flex",gap:10}}>
          <button className="btn" onClick={()=>setShowDeleteConfirm(false)} disabled={deleteLoading} style={{flex:1,padding:"13px",borderRadius:10,background:"#0a1018",border:`1px solid ${C.border}`,color:C.dim,fontWeight:700,fontSize:13}}>Cancelar</button>
          <button className="btn" onClick={deleteAccount} disabled={deleteLoading} style={{flex:1,padding:"13px",borderRadius:10,background:"#ff444422",border:"1px solid #ff444444",color:"#ff6666",fontWeight:900,fontSize:13}}>{deleteLoading?<Spin s={13}/>:"Sí, eliminar"}</button>
        </div>
      </div>
    </div>}
  </div>);
};

/* ═══ FLOATING CHAT ═══ */
const FloatingChat=({userCtx})=>{
  const {user}=userCtx||{};
  const [open,setOpen]=useState(false);
  const [msgs,setMsgs]=useState([]);
  const [input,setInput]=useState("");
  const [sending,setSending]=useState(false);
  const [group,setGroup]=useState(null);
  const [unread,setUnread]=useState(0);
  const endRef=useRef(null);
  const groupRef=useRef(null);

  const getLastRead=(gid)=>localStorage.getItem(`courtiq_chat_read_${gid}`)||"0";
  const markRead=(gid)=>localStorage.setItem(`courtiq_chat_read_${gid}`,new Date().toISOString());

  const loadMsgs=(g,markAsRead=false)=>{
    pickemAPI("getChat",{params:{groupId:g.id}}).then(r=>{
      if(!r.ok) return;
      const messages=r.messages||[];
      setMsgs(messages);
      if(markAsRead){
        markRead(g.id);
        setUnread(0);
      } else {
        const lastRead=getLastRead(g.id);
        const count=messages.filter(m=>m.user_id!==user.id&&m.created_at>lastRead).length;
        setUnread(count);
      }
    });
  };

  const switchGroup=(g)=>{
    setGroup(g);groupRef.current=g;
    setUnread(0);setMsgs([]);
    loadMsgs(g,open);
  };

  // Load group on mount — also handle ?chat=groupId from notification tap
  useEffect(()=>{
    if(!user) return;
    const params=new URLSearchParams(window.location.search);
    const chatParam=params.get("chat");
    const gid=chatParam||localStorage.getItem("courtiq_lastgroup");
    if(!gid) return;
    // Clean the URL param without reload
    if(chatParam){
      const url=new URL(window.location.href);
      url.searchParams.delete("chat");
      window.history.replaceState({},"",url.toString());
    }
    pickemAPI("myGroups",{params:{userId:user.id}}).then(d=>{
      if(d.ok&&d.groups?.length){
        const g=d.groups.find(x=>x.id===gid)||d.groups[0];
        switchGroup(g);
        // If opened from notification, open chat automatically
        if(chatParam) setOpen(true);
      }
    });
  },[user]);

  // React to group changes from PickemTab
  useEffect(()=>{
    if(!user) return;
    const handler=(e)=>{
      const g=e.detail;
      if(g&&g.id!==groupRef.current?.id) switchGroup(g);
    };
    window.addEventListener("courtiq_group_changed",handler);
    return()=>window.removeEventListener("courtiq_group_changed",handler);
  },[user,open]);

  // Poll every 20s for new messages
  useEffect(()=>{
    const t=setInterval(()=>{
      if(groupRef.current&&user){
        loadMsgs(groupRef.current,open);
      }
    },20000);
    return()=>clearInterval(t);
  },[user,open]);

  // When chat opens: load messages and mark as read
  useEffect(()=>{
    if(open&&groupRef.current&&user){
      loadMsgs(groupRef.current,true);
    }
  },[open]);

  useEffect(()=>{if(open)endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,open]);

  const send=async()=>{
    if(!input.trim()||!group||!user||sending) return;
    setSending(true);
    const text=input.trim();setInput("");
    await pickemAPI("sendChat",{body:{groupId:group.id,userId:user.id,content:text}});
    loadMsgs(group,true);
    setSending(false);
  };

  const openChat=()=>{setOpen(o=>{const next=!o;if(!o&&groupRef.current)markRead(groupRef.current.id);return next;});};

  if(!user) return null;
  return(<>
    {open&&<div style={{position:"fixed",bottom:82,right:16,width:Math.min(340,window.innerWidth-32),height:440,background:C.card,border:`1.5px solid ${C.border}`,borderRadius:18,zIndex:1500,display:"flex",flexDirection:"column",boxShadow:"0 12px 48px #00000099",overflow:"hidden"}}>
      <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:"#0a0f17"}}>
        <div><div style={{fontSize:14,fontWeight:800,color:C.text}}>💬 {group?.name||"Chat del grupo"}</div><div style={{fontSize:9,color:C.muted}}>Chat en tiempo real · actualiza cada 20s</div></div>
        <button className="btn" onClick={()=>setOpen(false)} style={{width:32,height:32,borderRadius:"50%",background:"#131d29",border:`1px solid ${C.border}`,color:C.muted,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"12px 10px",display:"flex",flexDirection:"column",gap:8}}>
        {msgs.length===0
          ?<div style={{textAlign:"center",color:C.muted,fontSize:13,marginTop:40}}>💬<br/>Sin mensajes aún</div>
          :msgs.map((m,i)=>{
            const isMe=m.user_id===user.id;
            return<div key={i} style={{display:"flex",gap:7,alignItems:"flex-end",flexDirection:isMe?"row-reverse":"row"}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:isMe?`${C.accent}30`:"#1a2535",border:`1.5px solid ${isMe?C.accent+"55":C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{isMe?(user.avatar_emoji||"🏀"):(m.users?.avatar_emoji||"🏀")}</div>
              <div style={{maxWidth:"78%"}}>
                <div style={{fontSize:9,color:isMe?C.accent:C.muted,marginBottom:3,textAlign:isMe?"right":"left",fontWeight:700}}>{isMe?"Tú":m.users?.name}</div>
                <div style={{background:isMe?`${C.accent}25`:"#131d29",border:`1px solid ${isMe?C.accent+"44":C.border}`,borderRadius:isMe?"14px 14px 4px 14px":"14px 14px 14px 4px",padding:"8px 12px",fontSize:13,color:C.text,lineHeight:1.4}}>{m.content}</div>
                <div style={{fontSize:8,color:C.muted,marginTop:3,textAlign:isMe?"right":"left"}}>{new Date(m.created_at).toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"})}</div>
              </div>
            </div>;
          })}
        <div ref={endRef}/>
      </div>
      <div style={{padding:"10px 12px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8,background:"#0a0f17"}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Escribe un mensaje..." style={{flex:1,background:"#131d29",border:`1.5px solid ${input?C.accent:C.border}`,borderRadius:12,padding:"10px 14px",color:C.text,fontSize:13,outline:"none"}}/>
        <button className="btn" onClick={send} disabled={!input.trim()||sending} style={{padding:"10px 16px",borderRadius:12,background:input.trim()?C.accent:"#131d29",color:input.trim()?"#07090f":C.muted,fontSize:16,fontWeight:900,minWidth:46}}>{sending?<Spin s={16}/>:"→"}</button>
      </div>
    </div>}
    <button className="btn" onClick={openChat} title="Chat del grupo" style={{position:"fixed",bottom:16,right:16,width:56,height:56,borderRadius:"50%",background:open?"#131d29":"linear-gradient(135deg,#00C2FF,#0055ff)",border:`2px solid ${open?C.border:"#00C2FF88"}`,fontSize:24,zIndex:1500,boxShadow:"0 4px 20px #00C2FF55",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>
      {open?"✕":"💬"}
      {!open&&unread>0&&<div style={{position:"absolute",top:-4,right:-4,minWidth:20,height:20,borderRadius:10,background:"#ff3b30",border:"2px solid #07090f",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,color:"#fff",padding:"0 4px"}}>{unread>9?"9+":unread}</div>}
    </button>
  </>);
};

/* ═══ APP ROOT ═══ */
const TABS=[{id:"home",icon:"🏠",label:"Home"},{id:"pickem",icon:"👥",label:"Grupos"},{id:"apuestas",icon:"🪙",label:"Apuestas"},{id:"parlay",icon:"🎰",label:"Parlay"},{id:"shop",icon:"🛍️",label:"Shop"},{id:"teams",icon:"🏆",label:"Equipos"},{id:"players",icon:"⭐",label:"Jugadores"},{id:"bracket",icon:"🏅",label:"Playoffs"},{id:"games",icon:"🎮",label:"Juegos"},{id:"settings",icon:"⚙️",label:"Config"}];
// ─── ONBOARDING ───────────────────────────────────────────────────────────────
const ONBOARD_STEPS=[
  {icon:"🎯",title:"Haz tus picks",desc:"Antes de que empiece cada partido, elige qué equipo va a ganar. Los favoritos dan menos puntos, los underdogs dan más."},
  {icon:"🏆",title:"Compite con amigos",desc:"Crea un grupo privado o únete con un código. Todos hacen sus picks y compiten en la misma tabla de posiciones."},
  {icon:"⭐",title:"Gana puntos y sube",desc:"Cada acierto suma puntos según la dificultad del pick. Mantén tu racha, apuesta monedas y llega al #1 del grupo."},
];
const Onboarding=({onDone})=>{
  const [step,setStep]=useState(0);
  const s=ONBOARD_STEPS[step];
  const last=step===ONBOARD_STEPS.length-1;
  return <div style={{position:"fixed",inset:0,background:"#000000cc",zIndex:5000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
    <div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:24,padding:32,maxWidth:360,width:"100%",textAlign:"center"}}>
      <div style={{fontSize:64,marginBottom:16}}>{s.icon}</div>
      <div style={{fontSize:22,fontWeight:900,color:C.text,marginBottom:10,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1}}>{s.title}</div>
      <div style={{fontSize:14,color:C.dim,lineHeight:1.6,marginBottom:28}}>{s.desc}</div>
      {/* dots */}
      <div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:24}}>
        {ONBOARD_STEPS.map((_,i)=><div key={i} style={{width:i===step?20:6,height:6,borderRadius:3,background:i===step?C.accent:C.border,transition:"all .3s"}}/>)}
      </div>
      <button className="btn" onClick={()=>last?onDone():setStep(s=>s+1)} style={{width:"100%",padding:"14px",borderRadius:12,background:`linear-gradient(135deg,${C.accent},#0066ff)`,color:"#07090f",fontSize:15,fontWeight:900}}>
        {last?"¡Empezar! 🚀":"Siguiente →"}
      </button>
      {!last&&<button className="btn" onClick={onDone} style={{marginTop:10,background:"none",color:C.muted,fontSize:12,padding:"6px"}}>Saltar</button>}
    </div>
  </div>;
};

export default function App(){
  const [tab,setTab]=useState("home");const [menuOpen,setMenuOpen]=useState(false);const [games,setGames]=useState([]);const [standings,setStandings]=useState(FB_ST);const [players,setPlayers]=useState(FB_PL);
  const [pickemInitSubTab,setPickemInitSubTab]=useState("picks");
  const [live,setLive]=useState({games:false,standings:false,players:false});const [loading,setLoading]=useState(false);const [lastUpd,setLastUpd]=useState(null);
  const [installPrompt,setInstallPrompt]=useState(null);
  const [isOffline,setIsOffline]=useState(!navigator.onLine);
  const [showOnboarding,setShowOnboarding]=useState(()=>!localStorage.getItem("courtiq_onboarded"));
  const userCtx=useUser();

  useEffect(()=>{
    const handler=(e)=>{e.preventDefault();setInstallPrompt(e);};
    window.addEventListener("beforeinstallprompt",handler);
    return()=>window.removeEventListener("beforeinstallprompt",handler);
  },[]);

  useEffect(()=>{
    const on=()=>setIsOffline(false);
    const off=()=>setIsOffline(true);
    window.addEventListener("online",on);
    window.addEventListener("offline",off);
    return()=>{window.removeEventListener("online",on);window.removeEventListener("offline",off);};
  },[]);

  const refreshAll=useCallback(async()=>{
    setLoading(true);
    const g=await loadGames();if(g.length>0){setGames(g);setLive(l=>({...l,games:true}));}
    const st=await loadStandings();if(st?.length>=25){setStandings(st);setLive(l=>({...l,standings:true}));}
    const pl=await loadPlayers();if(pl?.length>10){setPlayers(pl);setLive(l=>({...l,players:true}));} else {setPlayers(FB_PL);}
    setLastUpd(new Date());setLoading(false);
  },[]);

  useEffect(()=>{refreshAll();},[]);

  // Refresca cada 30s si hay juego en vivo, cada 90s si no
  useEffect(()=>{
    const hasLive=games.some(g=>g.status==="LIVE");
    const t=setInterval(refreshAll,hasLive?30000:90000);
    return()=>clearInterval(t);
  },[games.map(g=>g.status).join(","),refreshAll]);

  // Auto-score picks on load
  useEffect(()=>{pickemAPI("scoreGames").catch(()=>{});},[]);

  // Handle deep-link URL params from push notifications and invite links
  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const tabParam=params.get("tab");
    const subtabParam=params.get("subtab");
    const joinCode=params.get("join");
    const url=new URL(window.location.href);
    if(joinCode){
      // Store invite code so PickemTab auto-fills it, then navigate to Grupos
      localStorage.setItem("courtiq_invite_code",joinCode.toUpperCase());
      setTab("pickem");
      url.searchParams.delete("join");
      window.history.replaceState({},"",url.toString());
    }
    if(tabParam){
      setTab(tabParam);
      if(subtabParam&&["apuestas","parlay","picks","ranking","historial","estadisticas"].includes(subtabParam)) setTab(subtabParam);
      url.searchParams.delete("tab");url.searchParams.delete("subtab");
      window.history.replaceState({},"",url.toString());
    }
  },[]);

  const liveGame=games.find(g=>g.status==="LIVE");
  return(<div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Outfit','Segoe UI',sans-serif",color:C.text}}>
    <GS/>
    {showOnboarding&&<Onboarding onDone={()=>{localStorage.setItem("courtiq_onboarded","1");setShowOnboarding(false);}}/>}
    <div style={{background:"#0a0f17ee",borderBottom:`1px solid ${C.border}`,padding:"11px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,backdropFilter:"blur(16px)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <button className="btn" onClick={()=>setTab("home")} style={{display:"flex",alignItems:"center",gap:10,background:"none",padding:0}}>
          <div style={{width:31,height:31,borderRadius:9,background:"linear-gradient(135deg,#00C2FF,#0055ff)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🏀</div>
          <div><div style={{fontSize:15,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1,lineHeight:1}}>COURT IQ</div>
            <div style={{fontSize:8,color:C.muted,letterSpacing:2}}>{lastUpd?`Live · ${lastUpd.toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"})}`:"NBA 2025-26"}</div></div>
        </button>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        {liveGame&&<div style={{display:"flex",alignItems:"center",gap:6,background:"#0a1520",border:"1px solid #1a2c3d",borderRadius:20,padding:"5px 12px"}}><div style={{width:6,height:6,borderRadius:"50%",background:"#ff4444",animation:"pulse 1s infinite"}}/><span style={{fontSize:10,color:"#cc3333",fontWeight:700}}>LIVE</span><span style={{fontSize:10,color:C.muted}}>{liveGame.away} {liveGame.awayScore}–{liveGame.homeScore} {liveGame.home}</span></div>}
        <div style={{fontSize:11,fontWeight:700,color:C.accent,background:`${C.accent}15`,border:`1px solid ${C.accent}33`,borderRadius:8,padding:"4px 10px"}}>{TABS.find(t=>t.id===tab)?.icon} {TABS.find(t=>t.id===tab)?.label}</div>
        <button className="btn" onClick={refreshAll} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px",color:C.dim,fontSize:13}}>{loading?<Spin s={13}/>:"🔄"}</button>
        <button className="btn" onClick={()=>setMenuOpen(o=>!o)} style={{background:menuOpen?`${C.accent}22`:C.card,border:`1px solid ${menuOpen?C.accent:C.border}`,borderRadius:8,padding:"6px 12px",color:menuOpen?C.accent:C.dim,fontSize:16,fontWeight:900,lineHeight:1}}>☰</button>
      </div>
    </div>
    {menuOpen&&<div onClick={()=>setMenuOpen(false)} style={{position:"fixed",inset:0,background:"#00000077",zIndex:1200,display:"flex",alignItems:"flex-end"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxHeight:"80vh",background:"#0d1117",borderTop:`2px solid ${C.accent}33`,borderRadius:"20px 20px 0 0",padding:"20px 18px 32px",overflowY:"auto"}}>
        <div style={{width:40,height:4,borderRadius:2,background:C.border,margin:"0 auto 18px"}}/>
        <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>Inicio</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:18}}>
          {[{id:"home",icon:"🏠",label:"Home"}].map(n=><button key={n.id} className="btn" onClick={()=>{setTab(n.id);setMenuOpen(false);}} style={{padding:"14px 12px",borderRadius:12,background:tab===n.id?`${C.accent}22`:"#0a1018",border:`1.5px solid ${tab===n.id?C.accent:C.border}`,color:tab===n.id?C.accent:C.text,fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:8,gridColumn:"1/-1"}}>{n.icon} {n.label}</button>)}
        </div>
        <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>Pick'em</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:18}}>
          {[{id:"pickem",icon:"👥",label:"Grupos"},{id:"apuestas",icon:"🪙",label:"Apuestas"},{id:"parlay",icon:"🎰",label:"Parlay"},{id:"ou",icon:"🎯",label:"Over/Under"},{id:"shop",icon:"🛍️",label:"Shop"}].map(n=><button key={n.id} className="btn" onClick={()=>{setTab(n.id);setMenuOpen(false);}} style={{padding:"14px 12px",borderRadius:12,background:tab===n.id?`${C.accent}22`:"#0a1018",border:`1.5px solid ${tab===n.id?C.accent:C.border}`,color:tab===n.id?C.accent:C.text,fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:8}}>{n.icon} {n.label}</button>)}
        </div>
        <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>NBA</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:18}}>
          {[{id:"teams",icon:"🏆",label:"Equipos"},{id:"players",icon:"⭐",label:"Jugadores"},{id:"bracket",icon:"🏅",label:"Playoffs"},{id:"games",icon:"🎮",label:"Juegos"}].map(n=><button key={n.id} className="btn" onClick={()=>{setTab(n.id);setMenuOpen(false);}} style={{padding:"14px 12px",borderRadius:12,background:tab===n.id?`${C.accent}22`:"#0a1018",border:`1.5px solid ${tab===n.id?C.accent:C.border}`,color:tab===n.id?C.accent:C.text,fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:8}}>{n.icon} {n.label}</button>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr",gap:8}}>
          {[{id:"settings",icon:"⚙️",label:"Configuración"}].map(n=><button key={n.id} className="btn" onClick={()=>{setTab(n.id);setMenuOpen(false);}} style={{padding:"14px 12px",borderRadius:12,background:tab===n.id?`${C.accent}22`:"#0a1018",border:`1.5px solid ${tab===n.id?C.accent:C.border}`,color:tab===n.id?C.accent:C.text,fontSize:12,fontWeight:700,display:"flex",alignItems:"center",gap:8}}>{n.icon} {n.label}</button>)}
        </div>
      </div>
    </div>}
    {isOffline&&<div style={{background:"#ff444422",borderBottom:"1px solid #ff444444",padding:"8px 18px",display:"flex",alignItems:"center",gap:10}}>
      <span style={{fontSize:16}}>📡</span>
      <span style={{fontSize:12,color:"#ff8888",fontWeight:700}}>Sin conexión — los datos pueden estar desactualizados</span>
    </div>}
    {installPrompt&&<div style={{background:`linear-gradient(135deg,${C.accent}22,#0055ff22)`,borderBottom:`1px solid ${C.accent}33`,padding:"8px 18px",display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <span style={{fontSize:18}}>📲</span>
        <span style={{fontSize:12,color:C.text,fontWeight:600}}>Instala Court IQ en tu celular para mejor experiencia</span>
      </div>
      <div style={{display:"flex",gap:6,flexShrink:0}}>
        <button className="btn" onClick={async()=>{installPrompt.prompt();const{outcome}=await installPrompt.userChoice;if(outcome==="accepted")setInstallPrompt(null);}} style={{padding:"6px 14px",borderRadius:8,background:C.accent,color:"#07090f",fontWeight:900,fontSize:12}}>Instalar</button>
        <button className="btn" onClick={()=>setInstallPrompt(null)} style={{padding:"6px 10px",borderRadius:8,background:"#0a1018",border:`1px solid ${C.border}`,color:C.dim,fontSize:12}}>✕</button>
      </div>
    </div>}
    <div style={{maxWidth:1000,margin:"0 auto",padding:"22px 18px 100px"}}>
      {tab==="home"&&<HomeTab games={games} live={live} userCtx={userCtx} standings={standings} goToBets={()=>setTab("apuestas")} goToGroup={()=>setTab("pickem")}/>}
      {tab==="teams"&&<TeamsTab standings={standings} live={live}/>}
      {tab==="players"&&<PlayersTab players={players} live={live}/>}
      {tab==="pickem"&&<PickemTab games={games} standings={standings} userCtx={userCtx} initSubTab="picks"/>}
      {tab==="apuestas"&&<PickemTab games={games} standings={standings} userCtx={userCtx} initSubTab="apuestas" standalone/>}
      {tab==="parlay"&&<PickemTab games={games} standings={standings} userCtx={userCtx} initSubTab="parlay" standalone/>}
      {tab==="ou"&&<OUTab games={games} userCtx={userCtx}/>}
      {tab==="shop"&&<ShopTab userCtx={userCtx}/>}
      {tab==="bracket"&&<BracketTab userCtx={userCtx} standings={standings}/>}
      {tab==="games"&&<MiniGamesTab players={players} userCtx={userCtx}/>}
      {tab==="settings"&&<SettingsTab userCtx={userCtx} installPrompt={installPrompt} onInstalled={()=>setInstallPrompt(null)}/>}
    </div>
    <FloatingChat userCtx={userCtx}/>
  </div>);
}
//
//mejora