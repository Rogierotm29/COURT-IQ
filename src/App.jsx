import { useState, useEffect, useCallback, useRef } from "react";
import { AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const C={bg:"#07090f",card:"#0d1117",border:"#1a2535",muted:"#3d5166",dim:"#566880",text:"#e0eaf5",accent:"#00C2FF"};
const GS=()=><style>{`@import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@400;500;600;700;800;900&display=swap');*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}body{background:#07090f}::-webkit-scrollbar{width:4px;height:4px}::-webkit-scrollbar-thumb{background:#1e2d40;border-radius:4px}@keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}@keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}@keyframes spin{to{transform:rotate(360deg)}}.fade-up{animation:fadeUp .35s ease both}.btn{cursor:pointer;border:none;outline:none;transition:all .15s;font-family:inherit}.btn:hover{filter:brightness(1.15)}.card{transition:transform .15s,box-shadow .15s}.card:hover{transform:translateY(-2px);box-shadow:0 8px 28px #00000055}input,select{outline:none;font-family:inherit}.spin{animation:spin 1s linear infinite}`}</style>;
const Tag=({c="#00C2FF",children})=><span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,background:`${c}22`,color:c,letterSpacing:.8}}>{children}</span>;
const Card=({children,style={}})=><div className="card" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:18,...style}}>{children}</div>;
const ST=({children,sub})=><div style={{marginBottom:16}}><div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:2}}>{sub}</div><div style={{fontSize:22,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1,color:C.text}}>{children}</div></div>;
const Divider=()=><div style={{height:1,background:C.border,margin:"12px 0"}}/>;
const Spin=({s=20})=><div className="spin" style={{width:s,height:s,border:`2px solid ${C.border}`,borderTopColor:C.accent,borderRadius:"50%",display:"inline-block"}}/>;
const TT=({active,payload,label})=>active&&payload?.length?<div style={{background:"#0d1117",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 14px"}}><p style={{color:C.muted,fontSize:10,marginBottom:4}}>{label}</p>{payload.map((p,i)=><p key={i} style={{color:p.color,fontSize:13,fontWeight:700}}>{p.name}: {p.value}</p>)}</div>:null;
const LiveBadge=({live})=><span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:20,letterSpacing:.8,background:live?"#00FF9D18":"#1a2535",color:live?"#00FF9D":C.muted}}>{live?"🟢 LIVE":"📦 Cache"}</span>;

/* ═══ TEAM META + LOGOS ═══ */
const ESPN_LOGO={ATL:"atl",BOS:"bos",BKN:"bkn",CHA:"cha",CHI:"chi",CLE:"cle",DAL:"dal",DEN:"den",DET:"det",GSW:"gs",HOU:"hou",IND:"ind",LAC:"lac",LAL:"lal",MEM:"mem",MIA:"mia",MIL:"mil",MIN:"min",NOP:"no",NYK:"ny",OKC:"okc",ORL:"orl",PHI:"phi",PHX:"phx",POR:"por",SAC:"sac",SAS:"sa",TOR:"tor",UTA:"utah",WAS:"wsh"};
const logo=(abbr,sz=32)=><img src={`https://a.espncdn.com/i/teamlogos/nba/500/${ESPN_LOGO[abbr]||abbr.toLowerCase()}.png`} alt={abbr} style={{width:sz,height:sz,objectFit:"contain"}} onError={e=>{e.target.style.display="none"}}/>;

const TM={
  ATL:{color:"#E03A3E",name:"Atlanta Hawks",conf:"E",div:"Southeast"},BOS:{color:"#008348",name:"Boston Celtics",conf:"E",div:"Atlantic"},BKN:{color:"#6A6A6A",name:"Brooklyn Nets",conf:"E",div:"Atlantic"},CHA:{color:"#1D1160",name:"Charlotte Hornets",conf:"E",div:"Southeast"},CHI:{color:"#CE1141",name:"Chicago Bulls",conf:"E",div:"Central"},CLE:{color:"#860038",name:"Cleveland Cavaliers",conf:"E",div:"Central"},DAL:{color:"#00538C",name:"Dallas Mavericks",conf:"W",div:"Southwest"},DEN:{color:"#FEC524",name:"Denver Nuggets",conf:"W",div:"Northwest"},DET:{color:"#C8102E",name:"Detroit Pistons",conf:"E",div:"Central"},GSW:{color:"#1D428A",name:"Golden State Warriors",conf:"W",div:"Pacific"},HOU:{color:"#CE1141",name:"Houston Rockets",conf:"W",div:"Southwest"},IND:{color:"#002D62",name:"Indiana Pacers",conf:"E",div:"Central"},LAC:{color:"#C8102E",name:"LA Clippers",conf:"W",div:"Pacific"},LAL:{color:"#552583",name:"Los Angeles Lakers",conf:"W",div:"Pacific"},MEM:{color:"#5D76A9",name:"Memphis Grizzlies",conf:"W",div:"Southwest"},MIA:{color:"#98002E",name:"Miami Heat",conf:"E",div:"Southeast"},MIL:{color:"#00471B",name:"Milwaukee Bucks",conf:"E",div:"Central"},MIN:{color:"#236192",name:"Minnesota Timberwolves",conf:"W",div:"Northwest"},NOP:{color:"#0C2340",name:"New Orleans Pelicans",conf:"W",div:"Southwest"},NYK:{color:"#006BB6",name:"New York Knicks",conf:"E",div:"Atlantic"},OKC:{color:"#007AC1",name:"OKC Thunder",conf:"W",div:"Northwest"},ORL:{color:"#0077C0",name:"Orlando Magic",conf:"E",div:"Southeast"},PHI:{color:"#ED174C",name:"Philadelphia 76ers",conf:"E",div:"Atlantic"},PHX:{color:"#E56020",name:"Phoenix Suns",conf:"W",div:"Pacific"},POR:{color:"#E03A3E",name:"Portland Trail Blazers",conf:"W",div:"Northwest"},SAC:{color:"#5A2D81",name:"Sacramento Kings",conf:"W",div:"Pacific"},SAS:{color:"#8E9093",name:"San Antonio Spurs",conf:"W",div:"Southwest"},TOR:{color:"#CE1141",name:"Toronto Raptors",conf:"E",div:"Atlantic"},UTA:{color:"#002B5C",name:"Utah Jazz",conf:"W",div:"Northwest"},WAS:{color:"#002B5C",name:"Washington Wizards",conf:"E",div:"Southeast"},
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
      status:st?.completed?"Final":st?.name==="STATUS_IN_PROGRESS"?"LIVE":"Upcoming",
      detail:st?.name==="STATUS_IN_PROGRESS"?`Q${comp?.status?.period||"?"} ${comp?.status?.displayClock||""}`:st?.shortDetail||""};
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

/* ═══ HOME TAB ═══ */
const HomeTab=({games,standings,players,live})=>{
  const east=standings.filter(t=>t.conf==="E").sort((a,b)=>b.w-a.w);
  const west=standings.filter(t=>t.conf==="W").sort((a,b)=>b.w-a.w);
  return(<div className="fade-up">
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}><ST sub="NBA 2025-26 · Hoy">Partidos del Día</ST><LiveBadge live={live.games}/></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(210px,1fr))",gap:10,marginBottom:28}}>
      {games.length===0?<div style={{color:C.muted,fontSize:13}}>No hay partidos programados.</div>
      :games.map(g=><Card key={g.id} style={{padding:14}}>
        <div style={{marginBottom:10}}>{g.status==="LIVE"?<Tag c="#ff4444">● LIVE {g.detail}</Tag>:g.status==="Final"?<Tag c={C.muted}>Final</Tag>:<Tag c={C.accent}>{g.detail||"Próximo"}</Tag>}</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          {[["away",g.away,g.awayScore],["home",g.home,g.homeScore]].map(([side,abbr,score])=><div key={side} style={{textAlign:"center",flex:1}}>
            {logo(abbr,36)}
            <div style={{fontSize:11,color:C.dim,margin:"4px 0"}}>{abbr}</div>
            <div style={{fontSize:g.status!=="Upcoming"?28:16,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.text}}>{g.status!=="Upcoming"?score:"—"}</div>
          </div>)}
        </div></Card>)}
    </div>
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
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}><ST sub="2025-26">Standings</ST><LiveBadge live={live.standings}/></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      {[["Este",east],["Oeste",west]].map(([label,teams])=><Card key={label}>
        <div style={{fontSize:11,fontWeight:700,color:C.dim,marginBottom:12}}>{label}</div>
        {teams.slice(0,10).map((t,i)=><div key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<9?`1px solid ${C.border}`:"none"}}>
          <span style={{fontSize:10,width:16,color:i<6?"#FFB800":i<8?"#00C2FF":C.muted,fontWeight:800}}>{i+1}</span>
          {logo(t.abbr,22)}<span style={{flex:1,fontSize:12,fontWeight:600,color:C.text}}>{t.abbr}</span>
          <span style={{fontSize:11,color:C.dim,width:44}}>{t.w}–{t.l}</span><Tag c={t.streak?.startsWith("W")?"#00FF9D":"#ff6666"}>{t.streak}</Tag>
        </div>)}</Card>)}
    </div>
  </div>);
};

/* ═══ TEAMS TAB ═══ */
const TeamsTab=({standings,live})=>{
  const [conf,setConf]=useState("ALL");const [sel,setSel]=useState(standings.find(t=>t.abbr==="DET")||standings[0]);
  const visible=standings.filter(t=>conf==="ALL"||t.conf===conf).sort((a,b)=>b.w-a.w);
  return(<div className="fade-up">
    <ST sub="NBA 2025-26">30 Equipos</ST>
    <div style={{display:"flex",gap:8,marginBottom:14}}>{[["Todos","ALL"],["Este","E"],["Oeste","W"]].map(([l,v])=><button key={v} className="btn" onClick={()=>setConf(v)} style={{padding:"7px 16px",borderRadius:20,background:conf===v?C.accent:"#0d1117",border:`1px solid ${conf===v?C.accent:C.border}`,color:conf===v?"#07090f":C.dim,fontWeight:700,fontSize:12}}>{l}</button>)}</div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(84px,1fr))",gap:7,marginBottom:22}}>
      {visible.map(t=><button key={t.id} className="btn" onClick={()=>setSel(t)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:4,padding:"10px 6px",borderRadius:12,background:sel?.id===t.id?`${t.color}22`:"#0d1117",border:`1px solid ${sel?.id===t.id?t.color:C.border}`}}>
        {logo(t.abbr,30)}<span style={{fontSize:10,fontWeight:800,color:sel?.id===t.id?t.color:C.dim}}>{t.abbr}</span><span style={{fontSize:9,color:C.muted}}>{t.w}–{t.l}</span>
      </button>)}
    </div>
    {sel&&<><Card style={{marginBottom:14,background:`linear-gradient(135deg,${sel.color}14,${C.card})`,borderColor:`${sel.color}44`}}>
      <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
        {logo(sel.abbr,56)}
        <div><div style={{fontSize:22,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:sel.color}}>{sel.name}</div><div style={{fontSize:11,color:C.muted}}>{sel.conf==="E"?"Este":"Oeste"} · {sel.div}</div></div>
        <div style={{marginLeft:"auto",display:"flex",gap:18,flexWrap:"wrap"}}>{[[sel.w,"W",C.text],[sel.l,"L","#ff6666"],[(sel.pct*100).toFixed(1)+"%","%","#00FF9D"]].map(([v,l,c])=><div key={l} style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:c}}>{v}</div><div style={{fontSize:9,color:C.muted}}>{l}</div></div>)}</div>
      </div></Card>
    <Card><div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>Roster 2025-26</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:4}}>{(sel.players||[]).map((p,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0"}}><span style={{fontSize:9,fontWeight:800,color:sel.color,width:16}}>{i+1}</span><span style={{fontSize:12,fontWeight:600,color:C.text}}>{p}</span></div>)}</div></Card>
    </>}
  </div>);
};

/* ═══ PLAYERS TAB (all players with pagination) ═══ */
const PlayersTab=({players,live})=>{
  const [sel,setSel]=useState(players[0]);const [search,setSearch]=useState("");const [teamF,setTeamF]=useState("ALL");const [page,setPage]=useState(0);
  const PER_PAGE=40;
  const filtered=players.filter(p=>{const q=search.toLowerCase();return(p.name?.toLowerCase().includes(q)||p.teamAbbr?.toLowerCase().includes(q))&&(teamF==="ALL"||p.teamAbbr===teamF);});
  const pageCount=Math.ceil(filtered.length/PER_PAGE);
  const paged=filtered.slice(page*PER_PAGE,(page+1)*PER_PAGE);
  const teams=[...new Set(players.map(p=>p.teamAbbr).filter(Boolean))].sort();
  const color=sel?tm(sel.teamAbbr).color:C.accent;const pts=sel?+sel.pts:20;
  const radar=sel?[{s:"PTS",v:Math.min(99,Math.round(pts/38*95))},{s:"AST",v:Math.min(99,Math.round(+(sel.ast||0)/12*95))},{s:"REB",v:Math.min(99,Math.round(+(sel.reb||0)/15*95))},{s:"BLK",v:Math.min(99,Math.round(+(sel.blk||0)/4*95))},{s:"STL",v:Math.min(99,Math.round(+(sel.stl||0)/3*95))},{s:"FG%",v:Math.min(99,Math.round(+(sel.fgPct||45)/62*95))}]:[];
  return(<div className="fade-up">
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}><ST sub="NBA 2025-26">{filtered.length} Jugadores</ST><LiveBadge live={live.players}/></div>
    <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
      <div style={{position:"relative",flex:"1 1 200px"}}><span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14}}>🔍</span><input value={search} onChange={e=>{setSearch(e.target.value);setPage(0);}} placeholder="Buscar jugador..." style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:11,padding:"10px 12px 10px 38px",color:C.text,fontSize:13}}/></div>
      <select value={teamF} onChange={e=>{setTeamF(e.target.value);setPage(0);}} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:11,padding:"10px 14px",color:C.text,fontSize:13}}><option value="ALL">Todos</option>{teams.map(t=><option key={t} value={t}>{t} — {tm(t).name}</option>)}</select>
    </div>
    {/* Player list as table */}
    <Card style={{marginBottom:14,padding:10,overflow:"auto"}}>
      <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
        <thead><tr style={{borderBottom:`1px solid ${C.border}`}}>{["#","","Jugador","Equipo","PTS","AST","REB","FG%"].map(h=><th key={h} style={{padding:"8px 6px",textAlign:"left",color:C.muted,fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:1}}>{h}</th>)}</tr></thead>
        <tbody>{paged.map((p,i)=><tr key={p.id} onClick={()=>setSel(p)} style={{cursor:"pointer",borderBottom:`1px solid ${C.border}`,background:sel?.id===p.id?`${tm(p.teamAbbr).color}11`:"transparent"}}>
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
    {/* Pagination */}
    {pageCount>1&&<div style={{display:"flex",justifyContent:"center",gap:6,marginBottom:16}}>
      <button className="btn" disabled={page===0} onClick={()=>setPage(p=>p-1)} style={{padding:"6px 14px",borderRadius:8,background:C.card,border:`1px solid ${C.border}`,color:page===0?C.muted:C.text,fontSize:12}}>← Ant</button>
      <span style={{padding:"6px 12px",fontSize:12,color:C.muted}}>{page+1} / {pageCount}</span>
      <button className="btn" disabled={page>=pageCount-1} onClick={()=>setPage(p=>p+1)} style={{padding:"6px 14px",borderRadius:8,background:C.card,border:`1px solid ${C.border}`,color:page>=pageCount-1?C.muted:C.text,fontSize:12}}>Sig →</button>
    </div>}
    {/* Player detail */}
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

/* ═══ PICK'EM TAB (social, real backend) ═══ */
const PickemTab=({games,userCtx})=>{
  const {user,save}=userCtx;
  const [name,setName]=useState("");const [groups,setGroups]=useState([]);const [selGroup,setSelGroup]=useState(null);
  const [picks,setPicks]=useState({});const [leaderboard,setLeaderboard]=useState([]);
  const [newGroupName,setNewGroupName]=useState("");const [joinCode,setJoinCode]=useState("");
  const [showCreate,setShowCreate]=useState(false);const [showJoin,setShowJoin]=useState(false);
  const [msg,setMsg]=useState("");const [loading,setLoading]=useState(false);
  const upcoming=games.filter(g=>g.status==="Upcoming");const finished=games.filter(g=>g.status==="Final");

  // Load groups on mount
  useEffect(()=>{
    if(!user) return;
    pickemAPI("myGroups",{params:{userId:user.id}}).then(d=>{if(d.ok)setGroups(d.groups||[]);});
  },[user]);

  // Load picks & leaderboard when group selected
  useEffect(()=>{
    if(!user||!selGroup) return;
    const today=new Date().toISOString().split("T")[0];
    pickemAPI("myPicks",{params:{userId:user.id,groupId:selGroup.id,date:today}}).then(d=>{
      if(d.ok){const map={};(d.picks||[]).forEach(p=>{map[p.game_id]=p.picked_team;});setPicks(map);}
    });
    pickemAPI("leaderboard",{params:{groupId:selGroup.id}}).then(d=>{if(d.ok)setLeaderboard(d.leaderboard||[]);});
  },[user,selGroup]);

  const register=async()=>{
    if(!name.trim()) return;
    setLoading(true);
    const d=await pickemAPI("register",{body:{name:name.trim()}});
    if(d.ok){save(d.user);setMsg("¡Bienvenido!");}else setMsg(d.error||"Error");
    setLoading(false);
  };

  const createGroup=async()=>{
    if(!newGroupName.trim()) return;
    const d=await pickemAPI("createGroup",{body:{name:newGroupName.trim(),userId:user.id}});
    if(d.ok){setGroups(g=>[...g,d.group]);setSelGroup(d.group);setShowCreate(false);setNewGroupName("");setMsg(`Grupo creado! Código: ${d.group.code}`);}
    else setMsg(d.error);
  };

  const joinGroup=async()=>{
    if(!joinCode.trim()) return;
    const d=await pickemAPI("joinGroup",{body:{code:joinCode.trim(),userId:user.id}});
    if(d.ok){if(!d.already)setGroups(g=>[...g,d.group]);setSelGroup(d.group);setShowJoin(false);setJoinCode("");setMsg(d.already?"Ya estás en este grupo":"¡Te uniste!");}
    else setMsg(d.error);
  };

  const makePick=async(gameId,team,homeTeam,awayTeam)=>{
    const today=new Date().toISOString().split("T")[0];
    setPicks(p=>({...p,[gameId]:team}));
    await pickemAPI("makePick",{body:{userId:user.id,groupId:selGroup.id,gameId,gameDate:today,pickedTeam:team,homeTeam,awayTeam}});
  };

  // Not registered
  if(!user) return(<div className="fade-up">
    <ST sub="Pick'em">Crea tu perfil 🎯</ST>
    <Card style={{maxWidth:400,margin:"0 auto",textAlign:"center",padding:30}}>
      <div style={{fontSize:48,marginBottom:12}}>🏀</div>
      <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:16}}>Únete al Pick'em</div>
      <div style={{fontSize:12,color:C.dim,marginBottom:20}}>Elige tu nombre para competir con amigos</div>
      <input value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&register()} placeholder="Tu nombre..." style={{width:"100%",background:"#0a1018",border:`1px solid ${C.border}`,borderRadius:11,padding:"12px 16px",color:C.text,fontSize:14,marginBottom:12,textAlign:"center"}}/>
      <button className="btn" onClick={register} disabled={loading} style={{width:"100%",padding:"12px",borderRadius:11,background:`linear-gradient(135deg,${C.accent},#0066ff)`,color:"#07090f",fontSize:14,fontWeight:900}}>{loading?<Spin s={14}/>:"Entrar 🚀"}</button>
      {msg&&<div style={{marginTop:10,fontSize:12,color:C.accent}}>{msg}</div>}
    </Card>
  </div>);

  return(<div className="fade-up">
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
      <ST sub={`Hola ${user.name}`}>Pick'em 🎯</ST>
      <div style={{display:"flex",gap:6}}>
        <button className="btn" onClick={()=>setShowJoin(!showJoin)} style={{padding:"7px 14px",borderRadius:10,background:`${C.accent}22`,border:`1px solid ${C.accent}`,color:C.accent,fontSize:11,fontWeight:700}}>🔗 Unirse</button>
        <button className="btn" onClick={()=>setShowCreate(!showCreate)} style={{padding:"7px 14px",borderRadius:10,background:C.accent,color:"#07090f",fontSize:11,fontWeight:700}}>+ Crear Grupo</button>
      </div>
    </div>
    {msg&&<div style={{marginBottom:10,padding:"8px 14px",background:`${C.accent}11`,border:`1px solid ${C.accent}44`,borderRadius:10,fontSize:12,color:C.accent}}>{msg}<button className="btn" onClick={()=>setMsg("")} style={{float:"right",background:"none",color:C.muted,fontSize:14}}>×</button></div>}

    {/* Create group */}
    {showCreate&&<Card style={{marginBottom:12,borderColor:`${C.accent}44`}}>
      <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:10}}>Nuevo Grupo</div>
      <div style={{display:"flex",gap:8}}><input value={newGroupName} onChange={e=>setNewGroupName(e.target.value)} placeholder="Nombre del grupo..." style={{flex:1,background:"#0a1018",border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.text,fontSize:13}}/><button className="btn" onClick={createGroup} style={{background:C.accent,borderRadius:10,padding:"10px 18px",color:"#07090f",fontSize:13,fontWeight:800}}>Crear</button></div>
    </Card>}

    {/* Join group */}
    {showJoin&&<Card style={{marginBottom:12,borderColor:`#FFB80044`}}>
      <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:10}}>Unirse con código</div>
      <div style={{display:"flex",gap:8}}><input value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} placeholder="Ej: ABC123" maxLength={6} style={{flex:1,background:"#0a1018",border:`1px solid ${C.border}`,borderRadius:10,padding:"10px 14px",color:C.text,fontSize:16,fontWeight:800,letterSpacing:4,textAlign:"center",textTransform:"uppercase"}}/><button className="btn" onClick={joinGroup} style={{background:"#FFB800",borderRadius:10,padding:"10px 18px",color:"#07090f",fontSize:13,fontWeight:800}}>Entrar</button></div>
    </Card>}

    {/* Groups */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10,marginBottom:20}}>
      {groups.length===0?<Card style={{padding:20,textAlign:"center",color:C.muted}}>Crea o únete a un grupo para empezar</Card>
      :groups.map(g=><Card key={g.id} style={{cursor:"pointer",borderColor:selGroup?.id===g.id?C.accent:C.border,background:selGroup?.id===g.id?`${C.accent}08`:C.card}} onClick={()=>setSelGroup(g)}>
        <div style={{fontSize:14,fontWeight:800,color:C.text,marginBottom:4}}>{g.emoji||"🏀"} {g.name}</div>
        <div style={{fontSize:10,color:C.muted,marginBottom:8}}>{g.memberCount||"?"} miembros</div>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
          <Tag c="#FFB800">Código: {g.code}</Tag>
          {selGroup?.id===g.id&&<Tag c="#00FF9D">Activo</Tag>}
        </div>
      </Card>)}
    </div>

    {selGroup&&<>
      {/* Leaderboard */}
      {leaderboard.length>0&&<Card style={{marginBottom:14}}>
        <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>🏆 Clasificación — {selGroup.name}</div>
        {leaderboard.map((r,i)=><div key={r.user_id} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 0",borderBottom:i<leaderboard.length-1?`1px solid ${C.border}`:"none"}}>
          <div style={{width:28,height:28,borderRadius:"50%",background:i===0?"#FFB80022":i===1?"#C0C0C022":i===2?"#CD7F3222":"#0a1018",border:`2px solid ${i===0?"#FFB800":i===1?"#C0C0C0":i===2?"#CD7F32":C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:900,color:i<3?"#FFB800":C.dim}}>{i+1}</div>
          <span style={{fontSize:13,fontWeight:r.user_id===user.id?800:600,color:r.user_id===user.id?C.accent:C.text,flex:1}}>{r.avatar_emoji} {r.name}{r.user_id===user.id?" (tú)":""}</span>
          <span style={{fontSize:10,color:C.dim}}>{r.correct_picks}/{r.total_picks} ({r.accuracy}%)</span>
          <span style={{fontSize:18,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#FFB800",width:50,textAlign:"right"}}>{r.total_points}</span>
        </div>)}
      </Card>}

      {/* Today's picks */}
      <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:10}}>Partidos de Hoy — Elige ganador</div>
      {upcoming.length===0&&finished.length===0?<Card style={{textAlign:"center",padding:30,color:C.muted}}>No hay partidos hoy 🏖</Card>:null}
      {[...upcoming,...finished].map(g=>{
        const picked=picks[g.id];const isFinal=g.status==="Final";
        const winner=isFinal?(g.homeScore>g.awayScore?g.home:g.away):null;
        const correct=isFinal&&picked===winner;
        return <Card key={g.id} style={{marginBottom:10,borderColor:isFinal?(correct?"#00FF9D44":"#ff444444"):C.border}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:8}}>
            <span style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:1.5}}>{isFinal?"Final":"⏰ Elige al ganador"}</span>
            {isFinal&&picked&&<Tag c={correct?"#00FF9D":"#ff4444"}>{correct?"✅ +10 pts":"❌ 0 pts"}</Tag>}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:8,alignItems:"center"}}>
            {[g.away,null,g.home].map((item,idx)=>idx===1
              ?<div key="vs" style={{fontSize:11,color:C.muted,fontWeight:700,textAlign:"center"}}>VS</div>
              :<button key={item} className="btn" disabled={isFinal} onClick={()=>!isFinal&&makePick(g.id,item,g.home,g.away)} style={{padding:"12px",borderRadius:11,textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:4,
                background:picked===item?`${tm(item).color}22`:C.card,
                border:`2px solid ${picked===item?tm(item).color:C.border}`,
                color:picked===item?tm(item).color:C.text,width:"100%",opacity:isFinal&&picked!==item?.5:1}}>
                {logo(item,32)}
                <span style={{fontSize:14,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif"}}>{picked===item&&"✓ "}{item}</span>
                {isFinal&&<span style={{fontSize:11,color:C.dim}}>{idx===0?g.awayScore:g.homeScore}</span>}
              </button>)}
          </div>
        </Card>;
      })}
    </>}

    {/* Points system */}
    <Card style={{marginTop:18,background:"#0a1018"}}>
      <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>Sistema de Puntos</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        {[["✅ Acierto","10 pts"],["🔥 Racha x3","15 pts"],["🎯 Semana perfecta","50 pts"]].map(([l,v])=><div key={l} style={{background:C.card,borderRadius:9,padding:"10px",textAlign:"center"}}><div style={{fontSize:10,color:C.dim,marginBottom:4}}>{l}</div><div style={{fontSize:15,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.accent}}>{v}</div></div>)}
      </div>
    </Card>
  </div>);
};

/* ═══ BRACKET TAB ═══ */
const BE=[{seed:1,s:"DET",c:"#C8102E"},{seed:2,s:"BOS",c:"#008348"},{seed:3,s:"NYK",c:"#006BB6"},{seed:4,s:"CLE",c:"#860038"},{seed:5,s:"TOR",c:"#CE1141"},{seed:6,s:"ORL",c:"#0077C0"},{seed:7,s:"ATL",c:"#E03A3E"},{seed:8,s:"MIA",c:"#98002E"}];
const BW=[{seed:1,s:"OKC",c:"#007AC1"},{seed:2,s:"SAS",c:"#8E9093"},{seed:3,s:"LAL",c:"#552583"},{seed:4,s:"MIN",c:"#236192"},{seed:5,s:"DEN",c:"#FEC524"},{seed:6,s:"HOU",c:"#CE1141"},{seed:7,s:"PHX",c:"#E56020"},{seed:8,s:"LAC",c:"#C8102E"}];
const BracketTab=()=>{const [picks,setPicks]=useState({});const [saved,setSaved]=useState(false);
  const pick=(k,t)=>{setSaved(false);setPicks(p=>({...p,[k]:t}));};
  const Slot=({k,t})=>{const w=picks[k];const win=t&&w===t.s;return <button className="btn" onClick={()=>t&&pick(k,t.s)} style={{display:"flex",alignItems:"center",gap:5,width:"100%",padding:"6px 8px",borderRadius:7,background:win?`${t.c}28`:"#0a1018",border:`1px solid ${win?t.c:C.border}`,marginBottom:2}}>{t?<>{logo(t.s,18)}<span style={{fontSize:11,fontWeight:700,color:win?t.c:C.text,flex:1}}>{t.s}</span>{win&&<span style={{fontSize:10,color:t.c}}>✓</span>}</>:<span style={{fontSize:10,color:C.muted,fontStyle:"italic"}}>TBD</span>}</button>;};
  const MU=({rk,i,t1,t2})=><div style={{marginBottom:8}}><Slot k={`${rk}-${i}a`} t={t1}/><Slot k={`${rk}-${i}b`} t={t2}/></div>;
  const Rd=({title,rk,pairs,accent})=><div style={{flex:"1 1 110px",minWidth:110}}><div style={{fontSize:9,color:accent,textTransform:"uppercase",letterSpacing:1.5,fontWeight:700,textAlign:"center",marginBottom:8,paddingBottom:6,borderBottom:`1px solid ${C.border}`}}>{title}</div>{pairs.map((p,i)=><MU key={i} rk={rk} i={i} t1={p[0]} t2={p[1]}/>)}</div>;
  return(<div className="fade-up"><ST sub="Playoffs 2026">Arma Tu Bracket 🏅</ST>
    <Card style={{marginBottom:14}}><div style={{fontSize:12,fontWeight:800,color:"#00C2FF",letterSpacing:2,marginBottom:14}}>ESTE</div><div style={{display:"flex",gap:10,flexWrap:"wrap"}}><Rd title="1ª Ronda" rk="e1" accent="#00C2FF" pairs={[[BE[0],BE[7]],[BE[3],BE[4]],[BE[1],BE[6]],[BE[2],BE[5]]]}/><Rd title="Semis" rk="e2" accent="#00C2FF" pairs={[[null,null],[null,null]]}/><Rd title="Final" rk="ecf" accent="#00C2FF" pairs={[[null,null]]}/></div></Card>
    <Card style={{marginBottom:14}}><div style={{fontSize:12,fontWeight:800,color:"#FFB800",letterSpacing:2,marginBottom:14}}>OESTE</div><div style={{display:"flex",gap:10,flexWrap:"wrap"}}><Rd title="1ª Ronda" rk="w1" accent="#FFB800" pairs={[[BW[0],BW[7]],[BW[3],BW[4]],[BW[1],BW[6]],[BW[2],BW[5]]]}/><Rd title="Semis" rk="w2" accent="#FFB800" pairs={[[null,null],[null,null]]}/><Rd title="Final" rk="wcf" accent="#FFB800" pairs={[[null,null]]}/></div></Card>
    <button className="btn" onClick={()=>setSaved(true)} style={{width:"100%",padding:"14px",borderRadius:12,background:"linear-gradient(135deg,#FFB800,#ff8800)",border:"none",color:"#07090f",fontSize:14,fontWeight:900}}>🏆 Guardar Bracket</button>
    {saved&&<div style={{textAlign:"center",marginTop:10,fontSize:13,color:"#00FF9D",fontWeight:700}}>✅ ¡Guardado!</div>}
  </div>);
};

/* ═══ APP ROOT ═══ */
const TABS=[{id:"home",icon:"🏠",label:"Home"},{id:"teams",icon:"🏆",label:"Equipos"},{id:"players",icon:"⭐",label:"Jugadores"},{id:"pickem",icon:"🎯",label:"Pick'em"},{id:"bracket",icon:"🏅",label:"Bracket"}];

export default function App(){
  const [tab,setTab]=useState("home");const [games,setGames]=useState([]);const [standings,setStandings]=useState(FB_ST);const [players,setPlayers]=useState(FB_PL);
  const [live,setLive]=useState({games:false,standings:false,players:false});const [loading,setLoading]=useState(false);const [lastUpd,setLastUpd]=useState(null);
  const userCtx=useUser();

  const refreshAll=useCallback(async()=>{
    setLoading(true);
    const g=await loadGames();if(g.length>0){setGames(g);setLive(l=>({...l,games:true}));}
    const st=await loadStandings();if(st?.length>=25){setStandings(st);setLive(l=>({...l,standings:true}));}
    const pl=await loadPlayers();if(pl?.length>10){setPlayers(pl);setLive(l=>({...l,players:true}));}
    setLastUpd(new Date());setLoading(false);
  },[]);

  useEffect(()=>{refreshAll();const t=setInterval(refreshAll,120000);return()=>clearInterval(t);},[]);

  // Auto-score picks on load
  useEffect(()=>{pickemAPI("scoreGames").catch(()=>{});},[]);

  const liveGame=games.find(g=>g.status==="LIVE");
  return(<div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Outfit','Segoe UI',sans-serif",color:C.text}}>
    <GS/>
    <div style={{background:"#0a0f17ee",borderBottom:`1px solid ${C.border}`,padding:"11px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,backdropFilter:"blur(16px)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:31,height:31,borderRadius:9,background:"linear-gradient(135deg,#00C2FF,#0055ff)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🏀</div>
        <div><div style={{fontSize:15,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1,lineHeight:1}}>COURT IQ</div>
          <div style={{fontSize:8,color:C.muted,letterSpacing:2}}>{lastUpd?`Live · ${lastUpd.toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"})}`:"NBA 2025-26"}</div></div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        {liveGame?<div style={{display:"flex",alignItems:"center",gap:6,background:"#0a1520",border:"1px solid #1a2c3d",borderRadius:20,padding:"5px 12px"}}><div style={{width:6,height:6,borderRadius:"50%",background:"#ff4444",animation:"pulse 1s infinite"}}/><span style={{fontSize:10,color:"#cc3333",fontWeight:700}}>LIVE</span><span style={{fontSize:10,color:C.muted}}>{liveGame.away} {liveGame.awayScore}–{liveGame.homeScore} {liveGame.home}</span></div>
        :<div style={{fontSize:10,color:C.muted}}>Sin juegos en vivo</div>}
        <button className="btn" onClick={refreshAll} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px",color:C.dim,fontSize:13}}>{loading?<Spin s={13}/>:"🔄"}</button>
      </div>
    </div>
    <div style={{background:"#0a0f17",borderBottom:`1px solid ${C.border}`,padding:"0 22px",display:"flex",overflowX:"auto"}}>
      {TABS.map(n=><button key={n.id} className="btn" onClick={()=>setTab(n.id)} style={{padding:"11px 14px",background:"transparent",border:"none",borderBottom:`2px solid ${tab===n.id?C.accent:"transparent"}`,color:tab===n.id?C.accent:C.muted,fontSize:12,fontWeight:tab===n.id?700:500,whiteSpace:"nowrap"}}>{n.icon} {n.label}</button>)}
    </div>
    <div style={{maxWidth:1000,margin:"0 auto",padding:"22px 18px"}}>
      {tab==="home"&&<HomeTab games={games} standings={standings} players={players} live={live}/>}
      {tab==="teams"&&<TeamsTab standings={standings} live={live}/>}
      {tab==="players"&&<PlayersTab players={players} live={live}/>}
      {tab==="pickem"&&<PickemTab games={games} userCtx={userCtx}/>}
      {tab==="bracket"&&<BracketTab/>}
    </div>
  </div>);
}
