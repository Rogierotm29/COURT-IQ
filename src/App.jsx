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

/* ═══ HOME TAB ═══ */
const HomeTab=({games,live,userCtx,standings})=>{
  const {user}=userCtx||{};
  const [picks,setPicks]=useState({});
  const [group,setGroup]=useState(null);
  const [loaded,setLoaded]=useState(false);
  useEffect(()=>{
    if(!user)return;
    pickemAPI("myGroups",{params:{userId:user.id}}).then(d=>{
      if(d.ok&&d.groups?.length){
        const saved=localStorage.getItem("courtiq_lastgroup");
        const g=d.groups.find(x=>x.id===saved)||d.groups[0];
        setGroup(g);
        const today=new Date().toISOString().split("T")[0];
        pickemAPI("myPicks",{params:{userId:user.id,groupId:g.id,date:today}}).then(r=>{
          if(r.ok){const m={};(r.picks||[]).forEach(p=>{m[p.game_id]=p.picked_team;});setPicks(m);}
          setLoaded(true);
        });
      } else setLoaded(true);
    });
  },[user,games]);

  const anyStarted=games.some(g=>g.status==="LIVE"||g.status==="Final");
  const seasonWinPct=abbr=>{const t=standings.find(s=>s.abbr===abbr);return t&&(t.w+t.l)>0?+(t.w/(t.w+t.l)*100).toFixed(0):50;};
  const winPct=(g,side)=>{
    if(g.status==="Final") return side==="away"?(g.awayScore>g.homeScore?100:0):(g.homeScore>g.awayScore?100:0);
    if(g.status==="LIVE"){const diff=side==="away"?g.awayScore-g.homeScore:g.homeScore-g.awayScore;return Math.min(95,Math.max(5,50+diff*2.5));}
    return seasonWinPct(side==="away"?g.away:g.home);
  };

  const makePick=async(gameId,team,home,away)=>{
    if(!group||!user)return;
    setPicks(p=>({...p,[gameId]:team}));
    const today=new Date().toISOString().split("T")[0];
    await pickemAPI("makePick",{body:{userId:user.id,groupId:group.id,gameId,gameDate:today,pickedTeam:team,homeTeam:home,awayTeam:away}});
  };


  return(<div className="fade-up">
    {!user&&<Card style={{marginBottom:22,background:"linear-gradient(135deg,#00C2FF11,#0d1117)",borderColor:"#00C2FF44",textAlign:"center",padding:"30px 20px"}}>
      <div style={{fontSize:44,marginBottom:10}}>🏀🔥</div>
      <div style={{fontSize:22,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.text,marginBottom:6}}>¡QUÉ SOBRES!</div>
      <div style={{fontSize:13,color:C.dim,marginBottom:4}}>Regístrate para predecir ganadores y competir contra tus amigos</div>
      <div style={{fontSize:11,color:C.muted,marginBottom:16}}>Elige quién gana cada partido · Gana puntos · Sube en el ranking</div>
      <button className="btn" onClick={()=>{const b=document.querySelectorAll('.btn');b.forEach(x=>{if(x.textContent.includes('Grupos'))x.click();});}} style={{padding:"14px 36px",borderRadius:12,background:"linear-gradient(135deg,#00C2FF,#0066ff)",color:"#07090f",fontSize:15,fontWeight:900,letterSpacing:1}}>ENTRAR AL PICK'EM 🎯</button>
    </Card>}
    {user&&<Card style={{marginBottom:22,background:"linear-gradient(135deg,#00FF9D08,#0d1117)",borderColor:"#00FF9D33",padding:"14px 18px"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <div><div style={{fontSize:10,color:"#00FF9D",fontWeight:700,letterSpacing:2}}>PICK'EM ACTIVO</div><div style={{fontSize:14,fontWeight:700,color:C.text,marginTop:2}}>👋 {user.name} — Toca un equipo para elegir ganador</div></div>
        {group?<Tag c="#00FF9D">Grupo: {group.name}</Tag>:<Tag c="#FFB800">Ve a Grupos para crear uno</Tag>}
      </div>
    </Card>}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}><ST sub="NBA 2025-26 · Hoy">Partidos del Día</ST><LiveBadge live={live.games}/></div>
    {user&&group&&anyStarted&&games.some(g=>g.status==="Upcoming")&&<div style={{marginBottom:12,padding:"10px 14px",background:"#00C2FF11",border:"1px solid #00C2FF33",borderRadius:10,fontSize:11,color:C.accent,display:"flex",alignItems:"center",gap:8}}>🎯 Algunos partidos ya empezaron — todavía puedes elegir en los que <b>aún no han iniciado</b></div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10,marginBottom:28}}>
      {games.length===0?<div style={{color:C.muted,fontSize:13}}>No hay partidos programados.</div>
      :games.map(g=>{
        const picked=picks[g.id];const isFinal=g.status==="Final";const isLive=g.status==="LIVE";
        const isUpcoming=g.startTime?new Date()<new Date(g.startTime):g.status==="Upcoming";
        const winner=isFinal?(g.homeScore>g.awayScore?g.home:g.away):null;
        const correct=isFinal&&picked===winner;
        const awayPct=winPct(g,"away");const homePct=winPct(g,"home");
        const minsLeft=g.startTime&&isUpcoming?Math.max(0,Math.round((new Date(g.startTime)-new Date())/60000)):null;
        return <Card key={g.id} style={{padding:14,borderColor:isFinal&&picked?(correct?"#00FF9D33":"#ff444433"):picked?`${tm(picked).color}33`:C.border}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {isLive?<Tag c="#ff4444">● LIVE {g.detail}</Tag>:isFinal?<Tag c={C.muted}>Final</Tag>
            :minsLeft!==null?(minsLeft<=1?<Tag c="#ff4444">⏱ Iniciando...</Tag>:minsLeft<=60?<Tag c={minsLeft<=15?"#ff6666":"#FF6B35"}>⏱ {minsLeft} min</Tag>:<Tag c={C.accent}>{g.detail||"Próximo"}</Tag>)
            :<Tag c={C.accent}>{g.detail||"Próximo"}</Tag>}
          </div>
          {isFinal&&picked&&<Tag c={correct?"#00FF9D":"#ff4444"}>{correct?"✅ +10":"❌"}</Tag>}
          {!isFinal&&!isLive&&picked&&<Tag c="#00FF9D">✓ Pick</Tag>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:8,alignItems:"center"}}>
          {[["away",g.away,g.awayScore],["vs"],["home",g.home,g.homeScore]].map((item,idx)=>
            idx===1?<div key="vs" style={{textAlign:"center",fontSize:12,color:C.muted,fontWeight:800}}>VS</div>
            :(user&&group&&isUpcoming)?
              <button key={item[1]} className="btn" onClick={()=>makePick(g.id,item[1],g.home,g.away)} style={{padding:"12px 8px",borderRadius:12,textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:4,
                background:picked===item[1]?`${tm(item[1]).color}18`:"transparent",
                border:`2px solid ${picked===item[1]?tm(item[1]).color:C.border}`,
                color:picked===item[1]?tm(item[1]).color:C.text,width:"100%"}}>
                {logo(item[1],36)}
                <span style={{fontSize:13,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif"}}>{item[1]}</span>
                <span style={{fontSize:10,color:C.dim}}>{tm(item[1]).name}</span>
              </button>
            :<div key={item[1]} style={{textAlign:"center",padding:"12px 8px"}}>
                {logo(item[1],36)}
                <div style={{fontSize:13,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.text,marginTop:4}}>{item[1]}</div>
                {(isFinal||isLive)&&<div style={{fontSize:22,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:isFinal&&item[1]===winner?"#00FF9D":C.text,marginTop:4}}>{item[2]}</div>}
              </div>
          )}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,marginTop:8,fontSize:9}}>
          <span style={{color:tm(g.away).color,fontWeight:700,minWidth:28}}>{awayPct}%</span>
          <div style={{flex:1,height:4,borderRadius:2,background:C.border,overflow:"hidden",position:"relative"}}>
            <div style={{width:`${awayPct}%`,height:"100%",background:`linear-gradient(90deg,${tm(g.away).color},${tm(g.home).color})`,transition:"width .6s ease"}}/>
          </div>
          <span style={{color:tm(g.home).color,fontWeight:700,minWidth:28,textAlign:"right"}}>{homePct}%</span>
        </div>
        {isLive&&<div style={{fontSize:8,color:"#ff4444",textAlign:"center",marginTop:3,letterSpacing:.5}}>● Probabilidad en vivo basada en el marcador</div>}
      </Card>;})}
    </div>
  </div>);
};

/* ═══ TEAMS TAB ═══ */
const TeamsTab=({standings,live})=>{
  const [conf,setConf]=useState("ALL");const [sel,setSel]=useState(standings.find(t=>t.abbr==="DET")||standings[0]);
  const visible=standings.filter(t=>conf==="ALL"||t.conf===conf).sort((a,b)=>b.w-a.w);
  const east=standings.filter(t=>t.conf==="E").sort((a,b)=>b.w-a.w);
  const west=standings.filter(t=>t.conf==="W").sort((a,b)=>b.w-a.w);
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
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14,marginTop:28}}><ST sub="2025-26">Clasificación</ST><LiveBadge live={live.standings}/></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(280px,1fr))",gap:14}}>
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

async function autoSubscribePush(userId){
  try{
    if(!("Notification" in window)||!("serviceWorker" in navigator)) return;
    const perm=await Notification.requestPermission();
    if(perm!=="granted") return;
    const reg=await navigator.serviceWorker.ready;
    const sub=await reg.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:VAPID_KEY});
    await pickemAPI("subscribePush",{body:{userId,subscription:sub.toJSON()}});
  }catch(_){}
}
const PickemTab=({games,userCtx})=>{
  const {user,save}=userCtx;
  const [name,setName]=useState("");const [groups,setGroups]=useState([]);const [selGroup,setSelGroup]=useState(null);
  const [picks,setPicks]=useState({});const [leaderboard,setLeaderboard]=useState([]);
  const [newGroupName,setNewGroupName]=useState("");const [joinCode,setJoinCode]=useState("");
  const [panel,setPanel]=useState(null);
  const [pin,setPin]=useState(["","","",""]);
  const [subTab,setSubTab]=useState("ranking");
  const [msg,setMsg]=useState("");const [loading,setLoading]=useState(false);
  const [copied,setCopied]=useState(false);
  const [nameStatus,setNameStatus]=useState(null);
  // New features state
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
  },[user]);

  // Save last selected group
  useEffect(()=>{if(selGroup)localStorage.setItem("courtiq_lastgroup",selGroup.id);},[selGroup]);

  // Load picks, leaderboard, wildcard, daily winner when group changes
  useEffect(()=>{
    if(!user||!selGroup) return;
    const today=new Date().toISOString().split("T")[0];
    pickemAPI("myPicks",{params:{userId:user.id,groupId:selGroup.id,date:today}}).then(d=>{
      if(d.ok){const map={};(d.picks||[]).forEach(p=>{map[p.game_id]=p.picked_team;});setPicks(map);}
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

  // Period leaderboard
  useEffect(()=>{
    if(!selGroup||lbPeriod==="season") return;
    pickemAPI("periodLeaderboard",{params:{groupId:selGroup.id,period:lbPeriod}}).then(d=>{if(d.ok)setPeriodLb(d.leaderboard||[]);});
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
  },[subTab,user,selGroup]);

  // Refrescar grupo picks cuando cambia el status de los juegos (para que no desaparezcan los % al iniciar un partido)
  useEffect(()=>{
    if(!user||!selGroup||subTab!=="grupo") return;
    pickemAPI("groupPicks",{params:{groupId:selGroup.id}}).then(d=>{if(d.ok)setGrpPicks(d.picks||[]);});
  },[games.map(g=>g.status).join(",")]);

  const register=async()=>{
    if(!name.trim()) return;
    setLoading(true);
    const d=await pickemAPI("register",{body:{name:name.trim(),pin:pin.join("")}});
    if(d.ok){save(d.user);autoSubscribePush(d.user.id);}else setMsg(d.error||"Error");
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

  const makePick=async(gameId,team,homeTeam,awayTeam)=>{
    if(!selGroup) return;
    const today=new Date().toISOString().split("T")[0];
    setPicks(p=>({...p,[gameId]:team}));
    await pickemAPI("makePick",{body:{userId:user.id,groupId:selGroup.id,gameId,gameDate:today,pickedTeam:team,homeTeam,awayTeam}});
  };

  const copyCode=()=>{
    if(!selGroup) return;
    navigator.clipboard?.writeText(selGroup.code).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);}).catch(()=>{});
  };

  const shareGroup=()=>{
    if(!selGroup) return;
    const url=`${window.location.origin}?join=${selGroup.code}`;
    const text=`¡Únete a mi grupo "${selGroup.name}" en Court IQ y compite conmigo en los picks de la NBA! 🏀`;
    if(navigator.share){navigator.share({title:"Court IQ — "+selGroup.name,text,url}).catch(()=>{});}
    else{navigator.clipboard?.writeText(`${text}\n${url}`).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);}).catch(()=>{});}
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
  const doChallengeBet=async()=>{
    if(!betGame||!betTeam||betAmt<10||!betOpponent) return;
    setBetLoading(true);
    const d=await pickemAPI("challengeBet",{body:{userId:user.id,groupId:selGroup.id,gameId:betGame.id,amount:betAmt,pickedTeam:betTeam,homeTeam:betGame.home,awayTeam:betGame.away,opponentId:betOpponent.userId}});
    if(d.ok){setBalance(b=>b-betAmt);setBetGame(null);setBetTeam(null);setBetOpponent(null);setMsg(`⚡ ¡Reto enviado a ${betOpponent.name}!`);pickemAPI("groupBets",{params:{groupId:selGroup.id}}).then(r=>{if(r.ok)setBets(r.bets||[]);});}
    else setMsg(d.error);
    setBetLoading(false);
  };

  const myRank=leaderboard.findIndex(r=>r.user_id===user?.id);
  const myStats=leaderboard.find(r=>r.user_id===user?.id);

  // ─── NOT REGISTERED ───
    if(!user) return(<div className="fade-up">
      <ST sub="Pick'em">Crea tu perfil 🎯</ST>
      <Card style={{maxWidth:420,margin:"0 auto",textAlign:"center",padding:30}}>
        <div style={{fontSize:48,marginBottom:12}}>🏀</div>
        <div style={{fontSize:18,fontWeight:800,color:C.text,marginBottom:8}}>Únete al Pick'em</div>
        <div style={{fontSize:12,color:C.dim,marginBottom:24}}>{nameStatus==="taken"?"Ese nombre ya tiene cuenta. Ingresa tu PIN para entrar.":"Primera vez? Elige nombre y PIN para crear tu cuenta."}</div>
        <div style={{position:"relative",marginBottom:4}}>
          <input value={name} onChange={e=>setName(e.target.value)} placeholder="Tu nombre..." style={{width:"100%",background:"#0a1018",border:`1px solid ${nameStatus==="available"?"#22c55e":nameStatus==="taken"?"#f59e0b":C.border}`,borderRadius:11,padding:"14px 16px",color:C.text,fontSize:15,textAlign:"center",boxSizing:"border-box"}}/>
        </div>
        {nameStatus==="checking"&&<div style={{fontSize:11,color:C.muted,marginBottom:8,textAlign:"center"}}>Verificando...</div>}
        {nameStatus==="available"&&<div style={{fontSize:11,color:"#22c55e",marginBottom:8,textAlign:"center"}}>✓ Nombre disponible</div>}
        {nameStatus==="taken"&&<div style={{fontSize:11,color:"#f59e0b",marginBottom:8,textAlign:"center"}}>⚠️ Este nombre ya está en uso — si es tuyo, ingresa tu PIN para entrar</div>}
        {!nameStatus&&name.trim().length>0&&name.trim().length<2&&<div style={{fontSize:11,color:C.muted,marginBottom:8}}/>}
        {(!nameStatus||nameStatus==="checking"||nameStatus==="available"||nameStatus==="taken")&&<div style={{fontSize:10,color:C.muted,marginBottom:6,textAlign:"left",paddingLeft:4}}>{nameStatus==="taken"?"🔒 Ingresa tu PIN para acceder a tu cuenta":"🔒 PIN de 4 dígitos (para proteger tu cuenta)"}</div>}
        <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:16}}>
          {[0,1,2,3].map(i=><input key={i} id={`pin-${i}`} type="tel" maxLength={1} value={pin[i]||""} onChange={e=>{const v=e.target.value.replace(/\D/g,"");if(v.length<=1){const np=[...pin];np[i]=v;setPin(np);if(v&&i<3)document.getElementById(`pin-${i+1}`)?.focus();}}} onKeyDown={e=>{if(e.key==="Backspace"&&!pin[i]&&i>0)document.getElementById(`pin-${i-1}`)?.focus();}} style={{width:52,height:56,background:"#0a1018",border:`1px solid ${pin[i]?C.accent:C.border}`,borderRadius:12,color:C.accent,fontSize:24,fontWeight:900,textAlign:"center",fontFamily:"'Bebas Neue',sans-serif"}}/>)}
        </div>
        <button className="btn" onClick={register} disabled={loading||nameStatus==="checking"||!name.trim()} style={{width:"100%",padding:"14px",borderRadius:11,background:pin.join("").length===4&&name.trim()?`linear-gradient(135deg,${C.accent},#0066ff)`:`${C.border}`,color:pin.join("").length===4&&name.trim()?"#07090f":C.muted,fontSize:15,fontWeight:900}}>{loading?<Spin s={14}/>:nameStatus==="taken"?"Entrar con PIN 🔑":"Crear cuenta 🚀"}</button>
        {msg&&<div style={{marginTop:10,fontSize:12,color:"#ff6666"}}>{msg}</div>}
      </Card>
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
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            {balance!==null&&<div style={{background:"#FFB80011",border:"1px solid #FFB80033",borderRadius:8,padding:"6px 12px",display:"flex",alignItems:"center",gap:4}}><span>🪙</span><span style={{fontSize:16,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#FFB800"}}>{balance}</span></div>}
            <div style={{background:"#0a1018",borderRadius:8,padding:"8px 14px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:14,fontWeight:900,letterSpacing:3,color:"#FFB800",fontFamily:"'Bebas Neue',sans-serif"}}>{selGroup.code}</span>
              <button className="btn" onClick={copyCode} style={{background:copied?"#00FF9D22":"#ffffff11",borderRadius:6,padding:"4px 10px",color:copied?"#00FF9D":C.dim,fontSize:10,fontWeight:700,border:`1px solid ${copied?"#00FF9D44":"#ffffff11"}`}}>{copied?"✓":"📋"}</button>
              <button className="btn" onClick={shareGroup} style={{background:"#ffffff11",borderRadius:6,padding:"4px 10px",color:C.dim,fontSize:10,fontWeight:700,border:"1px solid #ffffff11"}}>🔗</button>
            </div>
          </div>
        </div>
        {myStats&&<div style={{display:"flex",gap:16,marginTop:14,paddingTop:12,borderTop:`1px solid ${C.border}`}}>
          {[["🏅 Pos",`#${myRank+1}`,"#FFB800"],["✅",`${myStats.correct_picks}/${myStats.total_picks}`,"#00FF9D"],["📊",`${myStats.accuracy}%`,C.accent],["⭐",myStats.total_points,"#FFB800"]].map(([l,v,c])=><div key={l}><div style={{fontSize:9,color:C.muted}}>{l}</div><div style={{fontSize:16,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:c}}>{v}</div></div>)}
        </div>}
      </Card>

      {/* Daily winner — solo cuando todos los partidos del día terminaron */}
      {dailyWinner&&games.length>0&&games.every(g=>g.status==="Final")&&<Card style={{marginBottom:14,background:"linear-gradient(135deg,#FFB80012,#0d1117)",borderColor:"#FFB80044",textAlign:"center",padding:"12px 18px"}}>
        <div style={{fontSize:9,color:"#FFB800",textTransform:"uppercase",letterSpacing:2,marginBottom:3}}>👑 Ganador del día</div>
        <div style={{fontSize:20,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.text}}>{dailyWinner.avatar_emoji||"🏀"} {dailyWinner.name}</div>
        <div style={{fontSize:11,color:C.dim}}>{dailyWinner.correct}/{dailyWinner.total} aciertos · {dailyWinner.points} pts</div>
      </Card>}

      {/* Sub-tabs */}
      <div style={{display:"flex",gap:0,marginBottom:14,overflowX:"auto",borderBottom:`1px solid ${C.border}`}}>
        {[["picks","🎯 Picks"],["ranking","🏆 Ranking"],["historial","📅 Historial"],["grupo","👥 Grupo"],["apuestas","🪙 Apuestas"],["chat","💬 Chat"]].map(([id,label])=><button key={id} className="btn" onClick={()=>setSubTab(id)} style={{padding:"9px 12px",background:"transparent",borderBottom:subTab===id?`2px solid ${C.accent}`:"2px solid transparent",color:subTab===id?C.accent:C.dim,fontSize:11,fontWeight:subTab===id?700:500,whiteSpace:"nowrap"}}>{label}</button>)}
      </div>

      {/* ─── PICKS ─── */}
      {subTab==="picks"&&<>
        {upcoming.length>0&&<div style={{padding:"10px 14px",background:"#00C2FF11",border:"1px solid #00C2FF33",borderRadius:10,marginBottom:14,fontSize:11,color:C.accent}}>🎯 {upcoming.length} partido{upcoming.length!==1?"s":""} abierto{upcoming.length!==1?"s":""} — toca un equipo para elegir ganador</div>}
        {anyStarted&&upcoming.length===0&&<div style={{padding:"10px 14px",background:"#ff444411",border:"1px solid #ff444433",borderRadius:10,marginBottom:14,fontSize:11,color:"#ff6666"}}>🔒 Todos los partidos de hoy ya empezaron · Los picks están cerrados</div>}
        {allGames.length===0?<Card style={{textAlign:"center",padding:40}}><div style={{fontSize:36,marginBottom:8}}>🌙</div><div style={{fontSize:15,fontWeight:700,color:C.text}}>No hay partidos hoy</div></Card>
        :allGames.map(g=>{
          const picked=picks[g.id];const isFinal=g.status==="Final";const isLive=g.status==="LIVE";
          const isUpcoming=g.startTime?new Date()<new Date(g.startTime):g.status==="Upcoming";
          const winner=isFinal?(g.homeScore>g.awayScore?g.home:g.away):null;
          const correct=isFinal&&picked===winner;
          const minsLeft=g.startTime&&isUpcoming?Math.max(0,Math.round((new Date(g.startTime)-new Date())/60000)):null;
          return <Card key={g.id} style={{marginBottom:10,borderColor:isFinal?(correct?"#00FF9D33":"#ff444433"):isLive?"#ff444433":picked?`${tm(picked).color}33`:C.border}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{display:"flex",gap:6}}>
                {isLive?<Tag c="#ff4444">● LIVE {g.detail}</Tag>:isFinal?<Tag c={C.muted}>Final</Tag>
                :minsLeft!==null?(minsLeft<=1?<Tag c="#ff4444">⏱ Iniciando...</Tag>:minsLeft<=60?<Tag c={minsLeft<=15?"#ff6666":"#FF6B35"}>⏱ {minsLeft} min</Tag>:<Tag c={C.accent}>{g.detail||"Próximo"}</Tag>)
                :<Tag c={C.accent}>{g.detail||"Próximo"}</Tag>}
              </div>
              {isFinal&&picked&&<Tag c={correct?"#00FF9D":"#ff4444"}>{correct?"✅ +10":"❌"}</Tag>}
              {isUpcoming&&picked&&<Tag c="#00FF9D">✓ Pick</Tag>}
              {isUpcoming&&!picked&&<Tag c={C.accent}>Elige</Tag>}
              {isLive&&!picked&&<Tag c="#ff6666">Sin pick</Tag>}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:10,alignItems:"center"}}>
              {[["away",g.away,g.awayScore],["vs"],["home",g.home,g.homeScore]].map((item,idx)=>
                idx===1?<div key="vs" style={{textAlign:"center",fontSize:12,color:C.muted,fontWeight:800}}>VS</div>
                :isUpcoming?
                  <button key={item[1]} className="btn" onClick={()=>makePick(g.id,item[1],g.home,g.away)} style={{padding:"12px 8px",borderRadius:12,textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:4,background:picked===item[1]?`${tm(item[1]).color}18`:"transparent",border:`2px solid ${picked===item[1]?tm(item[1]).color:C.border}`,color:picked===item[1]?tm(item[1]).color:C.text,width:"100%"}}>
                    {logo(item[1],36)}<span style={{fontSize:13,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif"}}>{item[1]}</span><span style={{fontSize:10,color:C.dim}}>{tm(item[1]).name}</span>
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
        <div style={{display:"flex",gap:8,marginBottom:14}}>
          {[["season","🏀 Temporada"],["month","📅 Mes"],["week","📆 Semana"]].map(([p,l])=><button key={p} className="btn" onClick={()=>setLbPeriod(p)} style={{padding:"7px 14px",borderRadius:20,background:lbPeriod===p?C.accent:"#0d1117",border:`1px solid ${lbPeriod===p?C.accent:C.border}`,color:lbPeriod===p?"#07090f":C.dim,fontWeight:700,fontSize:11}}>{l}</button>)}
        </div>
        <Card>
          <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:14}}>🏆 {lbPeriod==="week"?"Esta semana":lbPeriod==="month"?"Este mes":"Temporada"} — {selGroup.name}</div>
          {activeLb.length===0?<div style={{textAlign:"center",padding:30,color:C.dim}}>Aún no hay picks</div>
          :activeLb.map((r,i)=>{
            const isMe=r.user_id===user.id;const mc=["#FFB800","#C0C0C0","#CD7F32"];
            return <div key={r.user_id||i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 8px",marginBottom:4,borderRadius:10,background:isMe?`${C.accent}11`:i<3?"#FFB80008":"transparent",border:isMe?`1px solid ${C.accent}33`:"1px solid transparent"}}>
              <div style={{width:32,height:32,borderRadius:"50%",background:i<3?`${mc[i]}22`:"#0a1018",border:`2px solid ${i<3?mc[i]:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:i<3?14:12,fontWeight:900,color:i<3?mc[i]:C.dim,flexShrink:0}}>{i<3?["🥇","🥈","🥉"][i]:i+1}</div>
              <div style={{flex:1}}>
                <div style={{fontSize:13,fontWeight:isMe?800:600,color:isMe?C.accent:C.text}}>{r.avatar_emoji||"🏀"} {r.name||r.user_name}{isMe?" (tú)":""}</div>
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
      {subTab==="historial"&&<>
        {Object.keys(histByDate).length>0&&(()=>{
          const chartData=Object.entries(histByDate).slice(-7).map(([date,dp])=>({
            day:new Date(date+"T12:00:00").toLocaleDateString("es",{weekday:"short",day:"numeric"}),
            pct:dp.length?Math.round(dp.filter(p=>p.correct).length/dp.length*100):0,
            pts:dp.reduce((s,p)=>s+(p.points||0),0),
          }));
          return <Card style={{marginBottom:14}}>
            <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:1.5,marginBottom:10}}>Precisión últimos días</div>
            <ResponsiveContainer width="100%" height={110}>
              <BarChart data={chartData} margin={{top:4,right:4,left:-24,bottom:0}}>
                <CartesianGrid strokeDasharray="3 3" stroke={C.border}/>
                <XAxis dataKey="day" tick={{fill:C.muted,fontSize:9}} axisLine={false} tickLine={false}/>
                <YAxis domain={[0,100]} tick={{fill:C.muted,fontSize:9}} axisLine={false} tickLine={false}/>
                <Tooltip content={({active,payload,label})=>active&&payload?.length?<div style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px"}}><p style={{color:C.muted,fontSize:9,marginBottom:2}}>{label}</p><p style={{color:C.accent,fontSize:12,fontWeight:700}}>{payload[0].value}% precisión</p></div>:null}/>
                <Bar dataKey="pct" fill={C.accent} radius={[4,4,0,0]} maxBarSize={32}/>
              </BarChart>
            </ResponsiveContainer>
          </Card>;
        })()}
        {Object.keys(histByDate).length===0?<Card style={{textAlign:"center",padding:40}}><div style={{fontSize:36,marginBottom:8}}>📅</div><div style={{fontSize:15,fontWeight:700,color:C.text}}>Sin historial aún</div><div style={{fontSize:12,color:C.dim,marginTop:6}}>Tus picks de los últimos 7 días aparecerán aquí</div></Card>
        :Object.entries(histByDate).map(([date,dayPicks])=>{
          const correct=dayPicks.filter(p=>p.correct).length;
          const pts=dayPicks.reduce((s,p)=>s+(p.points||0),0);
          return <Card key={date} style={{marginBottom:12}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
              <div style={{fontSize:12,fontWeight:700,color:C.text}}>{new Date(date+"T12:00:00").toLocaleDateString("es",{weekday:"long",month:"short",day:"numeric"})}</div>
              <div style={{display:"flex",gap:8}}><Tag c={correct===dayPicks.length&&dayPicks.length>0?"#00FF9D":"#FFB800"}>{correct}/{dayPicks.length} ✅</Tag><Tag c={C.accent}>+{pts} pts</Tag></div>
            </div>
            {dayPicks.map(p=><div key={p.id} style={{display:"flex",alignItems:"center",gap:8,padding:"5px 0",borderBottom:`1px solid ${C.border}`}}>
              {logo(p.picked_team,20)}<span style={{flex:1,fontSize:12,color:C.text}}>{p.picked_team}</span>
              <span style={{fontSize:11,color:C.dim}}>vs {p.picked_team===p.home_team?p.away_team:p.home_team}</span>
              {p.scored?<Tag c={p.correct?"#00FF9D":"#ff6666"}>{p.correct?"✅":"❌"}</Tag>:<Tag c={C.muted}>Pend.</Tag>}
            </div>)}
          </Card>;
        })}
      </>}

      {/* ─── GRUPO ─── */}
      {subTab==="grupo"&&<>
        {allGames.length===0?<Card style={{textAlign:"center",padding:40}}><div style={{fontSize:36}}>🌙</div><div style={{fontSize:14,color:C.dim,marginTop:8}}>No hay partidos hoy</div></Card>
        :allGames.map(g=>{
          const gp=grpByGame[g.id]||[];const total=gp.length||1;
          const forAway=gp.filter(p=>p.picked_team===g.away);const forHome=gp.filter(p=>p.picked_team===g.home);
          return <Card key={g.id} style={{marginBottom:10}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>{logo(g.away,20)}<span style={{fontSize:12,fontWeight:700,color:C.text}}>{g.away}</span><span style={{fontSize:10,color:C.muted}}>vs</span>{logo(g.home,20)}<span style={{fontSize:12,fontWeight:700,color:C.text}}>{g.home}</span></div>
              <Tag c={C.accent}>{gp.length} picks</Tag>
            </div>
            {gp.length>0&&<>
              <div style={{display:"flex",height:8,borderRadius:4,overflow:"hidden",marginBottom:6}}>
                <div style={{flex:forAway.length,background:tm(g.away).color}}/><div style={{flex:forHome.length,background:tm(g.home).color}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:10,color:C.dim,marginBottom:10}}>
                <span style={{color:tm(g.away).color}}>{g.away} {Math.round(forAway.length/total*100)}%</span>
                <span style={{color:tm(g.home).color}}>{Math.round(forHome.length/total*100)}% {g.home}</span>
              </div>
            </>}
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {gp.map((p,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:4,background:`${tm(p.picked_team).color}18`,border:`1px solid ${tm(p.picked_team).color}44`,borderRadius:20,padding:"3px 8px"}}>
                <span style={{fontSize:11}}>{p.users?.avatar_emoji||"🏀"}</span><span style={{fontSize:10,color:C.text,fontWeight:600}}>{p.users?.name||"?"}</span>
              </div>)}
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
        {upcoming.length>0&&!betGame&&<Card style={{marginBottom:14}}>
          <div style={{fontSize:13,fontWeight:800,color:C.text,marginBottom:10}}>🎲 Nueva apuesta — elige un partido:</div>
          {upcoming.map(g=><button key={g.id} className="btn" onClick={()=>{setBetGame(g);setBetTeam(null);}} style={{display:"flex",alignItems:"center",gap:8,width:"100%",padding:"10px 12px",marginBottom:6,background:"#0a1018",border:`1px solid ${C.border}`,borderRadius:10,color:C.text,fontSize:12,fontWeight:600}}>
            {logo(g.away,18)}{g.away} vs {g.home}{logo(g.home,18)}<span style={{marginLeft:"auto",color:C.accent,fontSize:10}}>{g.detail}</span>
          </button>)}
        </Card>}
        {betGame&&<Card style={{marginBottom:14,borderColor:`${C.accent}44`}}>
          <div style={{fontSize:13,fontWeight:800,color:C.text,marginBottom:12}}>🎲 {betGame.away} vs {betGame.home} — ¿Quién gana?</div>
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
        {bets.length>0&&<><div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>Apuestas del grupo</div>
        {bets.map(b=>{const isMe=b.requester_id===user.id;const canAccept=!isMe&&b.status==="open";const isChallenge=b.status==="pending"&&b.opponent_id===user.id;
          return <Card key={b.id} style={{marginBottom:8,borderColor:isChallenge?"#FFB80066":b.status==="active"?"#00FF9D33":C.border,background:isChallenge?"linear-gradient(135deg,#FFB80008,#0d1117)":undefined}}>
            {isChallenge&&<div style={{fontSize:10,color:"#FFB800",fontWeight:700,marginBottom:6}}>⚡ ¡Te retaron!</div>}
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>{logo(b.picked_team,22)}<span style={{fontSize:13,fontWeight:800,color:tm(b.picked_team).color}}>{b.picked_team} gana</span></div>
                <div style={{fontSize:11,color:C.dim}}>{b.away_team} vs {b.home_team} · <span style={{color:"#FFB800",fontWeight:700}}>🪙{b.amount}</span>{isMe?" · (tu apuesta)":""}</div>
              </div>
              <div style={{display:"flex",gap:6}}>
                {canAccept&&<button className="btn" onClick={()=>doAcceptBet(b)} disabled={betLoading||(balance!==null&&b.amount>balance)} style={{padding:"8px 14px",borderRadius:10,background:"#00FF9D22",border:"1px solid #00FF9D44",color:"#00FF9D",fontSize:12,fontWeight:700}}>Aceptar 🤝</button>}
                {isChallenge&&<button className="btn" onClick={()=>doAcceptBet(b)} disabled={betLoading||(balance!==null&&b.amount>balance)} style={{padding:"8px 14px",borderRadius:10,background:"#FFB80022",border:"1px solid #FFB80044",color:"#FFB800",fontSize:12,fontWeight:700}}>⚡ Aceptar reto</button>}
                {isMe&&(b.status==="open"||b.status==="pending")&&<button className="btn" onClick={()=>doCancelBet(b)} style={{padding:"8px 14px",borderRadius:10,background:"#ff444422",border:"1px solid #ff444444",color:"#ff6666",fontSize:12,fontWeight:700}}>Cancelar</button>}
                {b.status==="active"&&<Tag c="#00FF9D">✓ Activa</Tag>}
              </div>
            </div>
          </Card>;
        })}</>}
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
              <div style={{width:28,height:28,borderRadius:"50%",background:`${C.accent}20`,border:`1px solid ${C.accent}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{m.users?.avatar_emoji||"🏀"}</div>
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

      {/* ─── AJUSTES ─── */}
    </>;
    })()}

    <Card style={{marginTop:18,background:"#0a1018"}}>
      <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>Sistema de Puntos</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        {[["✅ Acierto","10 pts"],["🪙 Apuestas","vs grupo"],["🔥 Racha","bonus"]].map(([l,v])=><div key={l} style={{background:C.card,borderRadius:9,padding:"10px",textAlign:"center"}}><div style={{fontSize:10,color:C.dim,marginBottom:4}}>{l}</div><div style={{fontSize:15,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.accent}}>{v}</div></div>)}
      </div>
    </Card>
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
const ACHIEVEMENT_DEFS=[
  {key:"first_pick",emoji:"🎯",name:"Primer Pick",desc:"Hiciste tu primera predicción"},
  {key:"first_win",emoji:"✅",name:"Primer Acierto",desc:"Atinaste una predicción"},
  {key:"streak_3",emoji:"🔥",name:"En Racha",desc:"3 picks correctos seguidos"},
  {key:"streak_5",emoji:"🔥🔥",name:"En Llamas",desc:"5 picks correctos seguidos"},
  {key:"perfect_day",emoji:"💎",name:"Día Perfecto",desc:"100% en un día (mín. 3 picks)"},
  {key:"bet_won",emoji:"🪙",name:"Apostador",desc:"Ganaste tu primera apuesta"},
  {key:"joined_group",emoji:"👥",name:"Social",desc:"Te uniste a un grupo"},
  {key:"challenge_sent",emoji:"⚡",name:"Retador",desc:"Enviaste un reto de apuesta"},
];

/* ═══ MINI GAMES TAB ═══ */
const TRIVIA=[
  {q:"¿Quién ganó las Finales NBA 2023?",opts:["Miami Heat","Denver Nuggets","Boston Celtics","LA Lakers"],a:1},
  {q:"¿Quién ganó las Finales NBA 2021?",opts:["LA Lakers","Miami Heat","Milwaukee Bucks","Phoenix Suns"],a:2},
  {q:"¿Quién fue el único MVP unánime en la historia NBA?",opts:["LeBron James","Michael Jordan","Stephen Curry","Shaquille O'Neal"],a:2},
  {q:"¿Cuántos MVPs de temporada tiene Nikola Jokić?",opts:["1","2","3","4"],a:2},
  {q:"¿Cuántos puntos anotó Kobe Bryant en su juego récord vs Toronto?",opts:["71","81","73","76"],a:1},
  {q:"¿Quién tiene el récord histórico de triple-dobles?",opts:["Magic Johnson","Oscar Robertson","Russell Westbrook","LeBron James"],a:2},
  {q:"¿En qué pick del Draft 2014 fue seleccionado Nikola Jokić?",opts:["#15","#27","#35","#41"],a:3},
  {q:"¿Quién tiene más anillos como jugador en la historia NBA?",opts:["Michael Jordan","Magic Johnson","Bill Russell","Kareem Abdul-Jabbar"],a:2},
  {q:"¿Cuántos campeonatos tiene Boston Celtics?",opts:["15","17","18","20"],a:2},
  {q:"¿Qué equipo fue el primero en ganar 70+ partidos en temporada regular?",opts:["LA Lakers 1972","Chicago Bulls 1996","Golden State 2016","Boston 1986"],a:1},
  {q:"¿Quién fue Rookie del Año 2023-24?",opts:["Chet Holmgren","Victor Wembanyama","Scoot Henderson","Brandon Miller"],a:1},
  {q:"¿En qué año entró LeBron James a la NBA?",opts:["2001","2002","2003","2004"],a:2},
  {q:"¿Cuántos puntos anotó Wilt Chamberlain en su partido récord?",opts:["81","92","100","73"],a:2},
  {q:"¿Cuántas veces ganó Michael Jordan el MVP de las Finales?",opts:["4","5","6","7"],a:2},
  {q:"¿Qué equipo ganó el campeonato NBA 2024?",opts:["Dallas Mavericks","Miami Heat","Boston Celtics","Indiana Pacers"],a:2},
].sort(()=>Math.random()-.5).slice(0,10);

const CHAMPS=[
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
  {name:"LeBron James",team:"LAL",clues:["1er pick del Draft 2003","Jugó para Cavaliers, Heat y Lakers","4 campeonatos de la NBA","4 veces MVP de la temporada regular"]},
  {name:"Stephen Curry",team:"GSW",clues:["7mo pick del Draft 2009","Ha jugado toda su carrera con Golden State Warriors","Récord de triples en una temporada (402)","El único MVP unánime en la historia de la NBA"]},
  {name:"Kevin Durant",team:"HOU",clues:["2do pick del Draft 2007","Jugó en OKC, Golden State, Brooklyn y Phoenix","Ganó 2 campeonatos con Golden State (2017, 2018)","MVP de la NBA en 2014"]},
  {name:"Giannis Antetokounmpo",team:"MIL",clues:["15vo pick del Draft 2013","Nació en Atenas, Grecia, de padres nigerianos","Campeón con Milwaukee Bucks en 2021","Doble MVP de la NBA (2019, 2020)"]},
  {name:"Nikola Jokić",team:"DEN",clues:["Pick #41 del Draft 2014 — el más bajo en ganar MVP","Ha jugado toda su carrera con Denver Nuggets","Campeón con Denver en 2023","3 veces MVP de la NBA (2021, 2022, 2024)"]},
  {name:"Michael Jordan",team:"CHI",clues:["3er pick del Draft 1984","6 campeonatos con Chicago Bulls","6 veces MVP de las Finales — todos los títulos que ganó","5 veces MVP de la temporada regular"]},
  {name:"Kobe Bryant",team:"LAL",clues:["13vo pick del Draft 1996","Jugó toda su carrera con Los Angeles Lakers","5 campeonatos con los Lakers","Anotó 81 puntos contra Toronto — 2do mayor en la historia"]},
  {name:"Shaquille O'Neal",team:"LAL",clues:["1er pick del Draft 1992","Jugó para Orlando, Lakers, Miami, Phoenix y otros","4 campeonatos — 3 con Lakers y 1 con Miami Heat","MVP de la NBA en 2000"]},
  {name:"Tim Duncan",team:"SAS",clues:["1er pick del Draft 1997","Jugó toda su carrera con San Antonio Spurs","5 campeonatos — el mayor total en la era moderna","2 veces MVP de la NBA (2002, 2003)"]},
  {name:"Dirk Nowitzki",team:"DAL",clues:["9no pick del Draft 1998 — nació en Alemania","Jugó toda su carrera con Dallas Mavericks","Campeón con Dallas en 2011 eliminando a LeBron en las Finales","MVP de la NBA en 2007 — el primero europeo en ganarlo"]},
  {name:"Magic Johnson",team:"LAL",clues:["1er pick del Draft 1979","Jugó toda su carrera con Los Angeles Lakers","5 campeonatos con los Lakers","3 veces MVP de la NBA y 3 veces MVP de las Finales"]},
  {name:"Larry Bird",team:"BOS",clues:["6to pick del Draft 1978","Jugó toda su carrera con Boston Celtics","3 campeonatos con los Celtics","3 MVPs de la NBA consecutivos (1984, 1985, 1986)"]},
  {name:"Charles Barkley",team:"PHX",clues:["5to pick del Draft 1984","Jugó para Philadelphia, Phoenix y Houston — nunca ganó un título","MVP de la NBA en 1993 sin ser el jugador más dominante físicamente","Declaró famosamente: 'I am not a role model'"]},
  {name:"Allen Iverson",team:"PHI",clues:["1er pick del Draft 1996","Jugó principalmente para Philadelphia 76ers","MVP de la NBA en 2001 — el jugador más bajo en ganarlo (183 cm)","Su apodo era 'The Answer' y popularizó el estilo streetball en la NBA"]},
  {name:"Russell Westbrook",team:"OKC",clues:["4to pick del Draft 2008","Jugó para OKC, Houston, LA Lakers, Washington y otros","Récord histórico de triple-dobles en la NBA","MVP de la NBA en 2017 con 42 triple-dobles en una temporada"]},
  {name:"Victor Wembanyama",team:"SAS",clues:["1er pick del Draft 2023 — nació en Francia","Solo ha jugado para San Antonio Spurs","Rookie del Año 2023-24 de forma unánime","Mide 2.24m con envergadura de 2.38m — considerado el más alto en talento en décadas"]},
  {name:"Luka Dončić",team:"DAL",clues:["3er pick del Draft 2018 — nació en Eslovenia","Jugó para Dallas Mavericks antes de ser tradeado a LA Lakers","Fue a las Finales NBA con Dallas en 2024","Ganó el Rookie del Año 2018-19 y fue All-Star desde su primera temporada"]},
  {name:"Kareem Abdul-Jabbar",team:"LAL",clues:["Fue elegido 1er pick en 1969 como 'Lew Alcindor'","Jugó para Milwaukee Bucks y Los Angeles Lakers","6 campeonatos de la NBA","6 veces MVP — el récord absoluto de la historia de la NBA"]},
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
  // Leaderboard
  const [scores,setScores]=useState([]);

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
        pickemAPI("getMiniScores",{params:{gameType:"guess"}}).then(d=>{if(d.ok)setScores(d.scores||[]);});
      } else {
        setGuessRound(next);setGuessQ(buildClueQ(guessPool,next));setGuessFeedback(null);
      }
    },900);
  };

  const buildChampsQ=(pool,round)=>{
    const correct=pool[round];
    const others=[...CHAMPS].filter(c=>c.team!==correct.team).sort(()=>Math.random()-.5).slice(0,3);
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
        pickemAPI("getMiniScores",{params:{gameType:"champs"}}).then(d=>{if(d.ok)setScores(d.scores||[]);});
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
        pickemAPI("getMiniScores",{params:{gameType:"scorer"}}).then(d=>{if(d.ok)setScores(d.scores||[]);});
      } else {
        setScorerRound(nextRound);setScorerPair(pickPair());setScorerFeedback(null);
      }
    },700);
  };

  const answerTrivia=(idx)=>{
    if(triviaFeedback!==null) return;
    const q=TRIVIA[triviaQ];
    const correct=idx===q.a;
    setTriviaFeedback(correct);
    if(correct) setTriviaScore(s=>s+1);
    setTimeout(()=>{
      const nextQ=triviaQ+1;
      if(nextQ>=TRIVIA.length){
        setTriviaDone(true);
        const finalScore=correct?triviaScore+1:triviaScore;
        if(user) pickemAPI("saveMiniScore",{body:{userId:user.id,gameType:"trivia",score:finalScore}});
        pickemAPI("getMiniScores",{params:{gameType:"trivia"}}).then(d=>{if(d.ok)setScores(d.scores||[]);});
      } else {
        setTriviaQ(nextQ);setTriviaFeedback(null);
      }
    },700);
  };

  if(screen==="menu") return(<div className="fade-up">
    <ST sub="Mini Juegos">Juegos NBA 🎮</ST>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
      <Card style={{textAlign:"center",padding:24,borderColor:`${C.accent}33`}}>
        <div style={{fontSize:40,marginBottom:10}}>📊</div>
        <div style={{fontSize:15,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.text,marginBottom:4}}>¿Quién anota más?</div>
        <div style={{fontSize:11,color:C.dim,marginBottom:12}}>Adivina qué jugador tiene más PPG · 10 rondas</div>
        <button className="btn" onClick={startScorer} style={{width:"100%",padding:"10px",borderRadius:10,background:`linear-gradient(135deg,${C.accent},#0066ff)`,color:"#07090f",fontWeight:900,fontSize:13}}>Jugar</button>
      </Card>
      <Card style={{textAlign:"center",padding:24,borderColor:"#FFB80033"}}>
        <div style={{fontSize:40,marginBottom:10}}>🧠</div>
        <div style={{fontSize:15,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.text,marginBottom:4}}>NBA Trivia</div>
        <div style={{fontSize:11,color:C.dim,marginBottom:12}}>10 preguntas sobre la NBA · ¿Cuántas aciertas?</div>
        <button className="btn" onClick={startTrivia} style={{width:"100%",padding:"10px",borderRadius:10,background:"linear-gradient(135deg,#FFB800,#ff9500)",color:"#07090f",fontWeight:900,fontSize:13}}>Jugar</button>
      </Card>
      <Card style={{textAlign:"center",padding:24,borderColor:"#00FF9D33"}}>
        <div style={{fontSize:40,marginBottom:10}}>🕵️</div>
        <div style={{fontSize:15,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.text,marginBottom:4}}>Adivina el Jugador</div>
        <div style={{fontSize:11,color:C.dim,marginBottom:12}}>4 pistas de carrera · 8 rondas</div>
        <button className="btn" onClick={startGuess} style={{width:"100%",padding:"10px",borderRadius:10,background:"linear-gradient(135deg,#00FF9D,#00aa66)",color:"#07090f",fontWeight:900,fontSize:13}}>Jugar</button>
      </Card>
      <Card style={{textAlign:"center",padding:24,borderColor:"#E03A3E33"}}>
        <div style={{fontSize:40,marginBottom:10}}>🏆</div>
        <div style={{fontSize:15,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.text,marginBottom:4}}>Campeones NBA</div>
        <div style={{fontSize:11,color:C.dim,marginBottom:12}}>¿Quién ganó en ese año? · 1985–2024 · 10 rondas</div>
        <button className="btn" onClick={startChamps} style={{width:"100%",padding:"10px",borderRadius:10,background:"linear-gradient(135deg,#E03A3E,#a00000)",color:"#fff",fontWeight:900,fontSize:13}}>Jugar</button>
      </Card>
    </div>
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
    const q=TRIVIA[triviaQ];
    return(<div className="fade-up">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <ST sub="NBA Trivia">Pregunta {triviaQ+1}/10</ST>
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
            {logo(p.team,28)}
            <div style={{fontSize:12,fontWeight:700,color:guessFeedback!==null&&isCorrect?"#00FF9D":C.text,marginTop:6}}>{p.name}</div>
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
            {logo(o.team,36)}
            <div style={{fontSize:12,fontWeight:700,color:champsFeedback!==null&&isCorrect?"#E03A3E":C.text,marginTop:6}}>{tm(o.team).name}</div>
          </button>;
        })}
      </div>
      {champsFeedback!==null&&<div style={{textAlign:"center",marginTop:10,fontSize:15,fontWeight:700,color:champsFeedback?"#E03A3E":"#ff6666"}}>{champsFeedback?"🏆 ¡Correcto!":"❌ Fue "+tm(correct.team).name}</div>}
      <div style={{height:5,borderRadius:3,background:C.border,overflow:"hidden",marginTop:14}}><div style={{width:`${(champsRound/10)*100}%`,height:"100%",background:"#E03A3E",transition:"width .4s"}}/></div>
    </div>);
  }

  return null;
};

/* ═══ SETTINGS TAB ═══ */
const EMOJI_OPTS=["🏀","🏆","🔥","⭐","💎","👑","🦁","🐺","🦅","🐯","💪","🎯","🚀","✨","🌟","🎮","🃏","🥇","🎖️","🏅","🧠","💫","⚡","🎪","🦎","🐻","🏟️","🔮","🎲","🌊"];
const SettingsTab=({userCtx})=>{
  const {user,logout,save}=userCtx||{};
  const [showEmojiPicker,setShowEmojiPicker]=useState(false);
  const [notifGranted,setNotifGranted]=useState(typeof Notification!=="undefined"&&Notification.permission==="granted");
  const [notifPrefs,setNotifPrefs]=useState({picks_reminder:true,win_notify:true,loss_notify:true,daily_summary:true});
  const [notifLoading,setNotifLoading]=useState(false);
  const [msg,setMsg]=useState("");
  const [achievements,setAchievements]=useState([]);

  useEffect(()=>{
    if(!user) return;
    pickemAPI("getNotifPrefs",{params:{userId:user.id}}).then(d=>{if(d.ok)setNotifPrefs(d.prefs);});
    pickemAPI("getAchievements",{params:{userId:user.id}}).then(d=>{if(d.ok)setAchievements(d.achievements||[]);});
  },[user]);

  const subscribePush=async()=>{
    setNotifLoading(true);
    try{
      await autoSubscribePush(user.id);
      const granted=typeof Notification!=="undefined"&&Notification.permission==="granted";
      setNotifGranted(granted);
      if(granted) setMsg("🔔 ¡Notificaciones activadas!");
      else setMsg("Notificaciones bloqueadas por el navegador");
    }catch(e){setMsg("Error: "+e.message);}
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
    await pickemAPI("updateProfile",{body:{userId:user.id,avatar_emoji:emoji}});
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

  return(<div className="fade-up">
    {/* Perfil */}
    <ST sub="Cuenta">Mi Perfil</ST>
    <Card style={{marginBottom:18,background:`linear-gradient(135deg,${C.accent}11,${C.card})`,borderColor:`${C.accent}33`}}>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <button className="btn" onClick={()=>setShowEmojiPicker(p=>!p)} style={{width:56,height:56,borderRadius:"50%",background:`${C.accent}20`,border:`2px solid ${showEmojiPicker?C.accent:C.accent+"44"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:26,flexShrink:0}} title="Cambiar avatar">{user.avatar_emoji||"🏀"}</button>
        <div style={{flex:1}}>
          <div style={{fontSize:20,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.text}}>{user.name}</div>
          <div style={{fontSize:10,color:C.muted,letterSpacing:1}}>Toca el emoji para cambiar avatar</div>
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
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(140px,1fr))",gap:8}}>
      {ACHIEVEMENT_DEFS.map(a=>{
        const unlocked=achievements.some(x=>x.achievement_key===a.key);
        return<Card key={a.key} style={{textAlign:"center",padding:"14px 10px",opacity:unlocked?1:0.4,borderColor:unlocked?`${C.accent}44`:C.border}}>
          <div style={{fontSize:28,marginBottom:6}}>{a.emoji}</div>
          <div style={{fontSize:11,fontWeight:800,color:unlocked?C.text:C.muted}}>{a.name}</div>
          <div style={{fontSize:9,color:C.dim,marginTop:2}}>{a.desc}</div>
          {unlocked&&<div style={{fontSize:8,color:C.accent,marginTop:4}}>✅ Desbloqueado</div>}
        </Card>;
      })}
    </div>
  </div>);
};

/* ═══ APP ROOT ═══ */
const TABS=[{id:"home",icon:"🏠",label:"Home"},{id:"teams",icon:"🏆",label:"Equipos"},{id:"players",icon:"⭐",label:"Jugadores"},{id:"pickem",icon:"👥",label:"Grupos"},{id:"bracket",icon:"🏅",label:"Playoffs"},{id:"games",icon:"🎮",label:"Juegos"},{id:"settings",icon:"⚙️",label:"Config"}];
export default function App(){
  const [tab,setTab]=useState("home");const [games,setGames]=useState([]);const [standings,setStandings]=useState(FB_ST);const [players,setPlayers]=useState(FB_PL);
  const [live,setLive]=useState({games:false,standings:false,players:false});const [loading,setLoading]=useState(false);const [lastUpd,setLastUpd]=useState(null);
  const userCtx=useUser();

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
      {tab==="home"&&<HomeTab games={games} live={live} userCtx={userCtx} standings={standings}/>}
      {tab==="teams"&&<TeamsTab standings={standings} live={live}/>}
      {tab==="players"&&<PlayersTab players={players} live={live}/>}
      {tab==="pickem"&&<PickemTab games={games} userCtx={userCtx}/>}
      {tab==="bracket"&&<BracketTab userCtx={userCtx} standings={standings}/>}
      {tab==="games"&&<MiniGamesTab players={players} userCtx={userCtx}/>}
      {tab==="settings"&&<SettingsTab userCtx={userCtx}/>}
    </div>
  </div>);
}
//
//mejora