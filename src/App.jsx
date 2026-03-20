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
const HomeTab=({games,standings,players,live,userCtx})=>{
  const {user}=userCtx||{};
  const east=standings.filter(t=>t.conf==="E").sort((a,b)=>b.w-a.w);
  const west=standings.filter(t=>t.conf==="W").sort((a,b)=>b.w-a.w);
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
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10,marginBottom:28}}>
      {games.length===0?<div style={{color:C.muted,fontSize:13}}>No hay partidos programados.</div>
      :games.map(g=>{
        const picked=picks[g.id];const isFinal=g.status==="Final";const isLive=g.status==="LIVE";
        const winner=isFinal?(g.homeScore>g.awayScore?g.home:g.away):null;
        const correct=isFinal&&picked===winner;
        return <Card key={g.id} style={{padding:14,borderColor:isFinal&&picked?(correct?"#00FF9D33":"#ff444433"):picked?`${tm(picked).color}33`:C.border}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
          {isLive?<Tag c="#ff4444">● LIVE {g.detail}</Tag>:isFinal?<Tag c={C.muted}>Final</Tag>:<Tag c={C.accent}>{g.detail||"Próximo"}</Tag>}
          {isFinal&&picked&&<Tag c={correct?"#00FF9D":"#ff4444"}>{correct?"✅ +10":"❌"}</Tag>}
          {!isFinal&&!isLive&&picked&&<Tag c="#00FF9D">✓ Pick</Tag>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:8,alignItems:"center"}}>
          {[["away",g.away,g.awayScore],["vs"],["home",g.home,g.homeScore]].map((item,idx)=>
            idx===1?<div key="vs" style={{textAlign:"center",fontSize:12,color:C.muted,fontWeight:800}}>VS</div>
            :user&&group&&!isFinal&&!isLive&&!games.some(x=>x.status==="LIVE"||x.status==="Final")?
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
      </Card>;})}
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
  const [sel,setSel]=useState(null);const [search,setSearch]=useState("");const [teamF,setTeamF]=useState("ALL");const [page,setPage]=useState(0);
  const PER_PAGE=40;
  const filtered=players.filter(p=>{const q=search.toLowerCase();return(p.name?.toLowerCase().includes(q)||p.teamAbbr?.toLowerCase().includes(q))&&(teamF==="ALL"||p.teamAbbr===teamF);});
  const pageCount=Math.ceil(filtered.length/PER_PAGE);
  const paged=filtered.slice(page*PER_PAGE,(page+1)*PER_PAGE);
  const teams=[...new Set(players.map(p=>p.teamAbbr).filter(Boolean))].sort();
  const color=sel?tm(sel.teamAbbr).color:C.accent;
  const radar=sel?[{s:"PTS",v:Math.min(99,Math.round(+sel.pts/38*95))},{s:"AST",v:Math.min(99,Math.round(+(sel.ast||0)/12*95))},{s:"REB",v:Math.min(99,Math.round(+(sel.reb||0)/15*95))},{s:"BLK",v:Math.min(99,Math.round(+(sel.blk||0)/4*95))},{s:"STL",v:Math.min(99,Math.round(+(sel.stl||0)/3*95))},{s:"FG%",v:Math.min(99,Math.round(+(sel.fgPct||45)/62*95))}]:[];
  return(<div className="fade-up">
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

/* ═══ PICK'EM TAB v2 (improved UX) ═══ */
const PickemTab=({games,userCtx})=>{
  const {user,save}=userCtx;
  const [name,setName]=useState("");const [groups,setGroups]=useState([]);const [selGroup,setSelGroup]=useState(null);
  const [picks,setPicks]=useState({});const [leaderboard,setLeaderboard]=useState([]);
  const [newGroupName,setNewGroupName]=useState("");const [joinCode,setJoinCode]=useState("");
  const [panel,setPanel]=useState(null); // "create"|"join"|null
  const [pin,setPin]=useState(["","","",""]);
  const [subTab,setSubTab]=useState("ranking");// "picks"|"ranking"|"members"
  const [msg,setMsg]=useState("");const [loading,setLoading]=useState(false);
  const [copied,setCopied]=useState(false);
  const upcoming=games.filter(g=>g.status==="Upcoming");const finished=games.filter(g=>g.status==="Final");const liveGames=games.filter(g=>g.status==="LIVE");
  const allGames=[...liveGames,...upcoming,...finished];

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
  },[user]);

  // Save last selected group
  useEffect(()=>{if(selGroup)localStorage.setItem("courtiq_lastgroup",selGroup.id);},[selGroup]);

  // Load picks & leaderboard when group changes
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
    const d=await pickemAPI("register",{body:{name:name.trim(),pin:pin.join("")}});
    if(d.ok){save(d.user);}else setMsg(d.error||"Error");
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

  const myRank=leaderboard.findIndex(r=>r.user_id===user?.id);
  const myStats=leaderboard.find(r=>r.user_id===user?.id);

  // ─── NOT REGISTERED ───
    if(!user) return(<div className="fade-up">
      <ST sub="Pick'em">Crea tu perfil 🎯</ST>
      <Card style={{maxWidth:420,margin:"0 auto",textAlign:"center",padding:30}}>
        <div style={{fontSize:48,marginBottom:12}}>🏀</div>
        <div style={{fontSize:18,fontWeight:800,color:C.text,marginBottom:8}}>Únete al Pick'em</div>
        <div style={{fontSize:12,color:C.dim,marginBottom:24}}>Primera vez? Elige nombre y PIN. Ya tienes cuenta? Pon los mismos datos.</div>
        <input value={name} onChange={e=>setName(e.target.value)} placeholder="Tu nombre..." style={{width:"100%",background:"#0a1018",border:`1px solid ${C.border}`,borderRadius:11,padding:"14px 16px",color:C.text,fontSize:15,marginBottom:12,textAlign:"center"}}/>
        <div style={{fontSize:10,color:C.muted,marginBottom:6,textAlign:"left",paddingLeft:4}}>🔒 PIN de 4 dígitos (para proteger tu cuenta)</div>
        <div style={{display:"flex",gap:8,justifyContent:"center",marginBottom:16}}>
          {[0,1,2,3].map(i=><input key={i} id={`pin-${i}`} type="tel" maxLength={1} value={pin[i]||""} onChange={e=>{const v=e.target.value.replace(/\D/g,"");if(v.length<=1){const np=[...pin];np[i]=v;setPin(np);if(v&&i<3)document.getElementById(`pin-${i+1}`)?.focus();}}} onKeyDown={e=>{if(e.key==="Backspace"&&!pin[i]&&i>0)document.getElementById(`pin-${i-1}`)?.focus();}} style={{width:52,height:56,background:"#0a1018",border:`1px solid ${pin[i]?C.accent:C.border}`,borderRadius:12,color:C.accent,fontSize:24,fontWeight:900,textAlign:"center",fontFamily:"'Bebas Neue',sans-serif"}}/>)}
        </div>
        <button className="btn" onClick={register} disabled={loading} style={{width:"100%",padding:"14px",borderRadius:11,background:pin.join("").length===4?`linear-gradient(135deg,${C.accent},#0066ff)`:`${C.border}`,color:pin.join("").length===4?"#07090f":C.muted,fontSize:15,fontWeight:900}}>{loading?<Spin s={14}/>:"Entrar 🚀"}</button>
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

    {/* Selected group content */}
    {selGroup&&<>
      {/* Group header card */}
      <Card style={{marginBottom:14,background:"linear-gradient(135deg,#0a152066,#0d1117)",borderColor:`${C.accent}33`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
          <div>
            <div style={{fontSize:16,fontWeight:800,color:C.text}}>{selGroup.emoji||"🏀"} {selGroup.name}</div>
            <div style={{fontSize:11,color:C.dim,marginTop:2}}>{selGroup.memberCount||"?"} miembros · {allGames.length} partidos hoy</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center"}}>
            <div style={{background:"#0a1018",borderRadius:8,padding:"8px 14px",display:"flex",alignItems:"center",gap:8}}>
              <span style={{fontSize:14,fontWeight:900,letterSpacing:3,color:"#FFB800",fontFamily:"'Bebas Neue',sans-serif"}}>{selGroup.code}</span>
              <button className="btn" onClick={copyCode} style={{background:copied?"#00FF9D22":"#ffffff11",borderRadius:6,padding:"4px 10px",color:copied?"#00FF9D":C.dim,fontSize:10,fontWeight:700,border:`1px solid ${copied?"#00FF9D44":"#ffffff11"}`}}>{copied?"✓ Copiado":"📋 Copiar"}</button>
            </div>
          </div>
        </div>
        {/* My quick stats */}
        {myStats&&<div style={{display:"flex",gap:16,marginTop:14,paddingTop:12,borderTop:`1px solid ${C.border}`}}>
          {[["🏅 Posición",`#${myRank+1}`,"#FFB800"],["✅ Aciertos",`${myStats.correct_picks}/${myStats.total_picks}`,"#00FF9D"],["📊 Precisión",`${myStats.accuracy}%`,C.accent],["⭐ Puntos",myStats.total_points,"#FFB800"]].map(([l,v,c])=><div key={l}>
            <div style={{fontSize:9,color:C.muted}}>{l}</div>
            <div style={{fontSize:16,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:c}}>{v}</div>
          </div>)}
        </div>}
      </Card>

      {/* Sub-tabs: Picks | Ranking | Members */}
      <div style={{display:"flex",gap:0,marginBottom:14}}>
        {[["ranking","🏆 Ranking"],["members","👥 Miembros"],["picks","🎯 Mis Picks"]].map(([id,label])=><button key={id} className="btn" onClick={()=>setSubTab(id)} style={{padding:"9px 18px",background:"transparent",borderBottom:subTab===id?`2px solid ${C.accent}`:"2px solid transparent",color:subTab===id?C.accent:C.dim,fontSize:12,fontWeight:subTab===id?700:500}}>{label}</button>)}
      </div>

      {/* ─── PICKS SUB-TAB ─── */}
      {subTab==="picks"&&<>
        <div style={{padding:"10px 14px",background:"#FFB80011",border:"1px solid #FFB80033",borderRadius:10,marginBottom:14,fontSize:11,color:"#FFB800"}}>📋 Estos son tus picks de hoy. Para hacer o cambiar picks, ve a 🏠 Home antes de que empiecen los partidos.</div>
        {allGames.length===0?<Card style={{textAlign:"center",padding:40}}>
          <div style={{fontSize:36,marginBottom:8}}>🌙</div>
          <div style={{fontSize:15,fontWeight:700,color:C.text,marginBottom:6}}>No hay partidos hoy</div>
          <div style={{fontSize:12,color:C.dim}}>Vuelve mañana para hacer tus picks</div>
        </Card>
        :allGames.map(g=>{
          const picked=picks[g.id];const isFinal=g.status==="Final";const isLive=g.status==="LIVE";
          const winner=isFinal?(g.homeScore>g.awayScore?g.home:g.away):null;
          const correct=isFinal&&picked===winner;
          return <Card key={g.id} style={{marginBottom:10,borderColor:isFinal?(correct?"#00FF9D33":"#ff444433"):isLive?"#ff444433":picked?`${tm(picked).color}33`:C.border}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              {isLive?<Tag c="#ff4444">● EN VIVO {g.detail}</Tag>:isFinal?<Tag c={C.muted}>Final</Tag>:<Tag c={C.accent}>{g.detail||"Próximo"}</Tag>}
              {isFinal&&picked&&<Tag c={correct?"#00FF9D":"#ff4444"}>{correct?"✅ +10 pts":"❌ Fallaste"}</Tag>}
              {!isFinal&&!isLive&&picked&&<Tag c="#00FF9D">✓ Pick hecho</Tag>}
              {!isFinal&&!isLive&&!picked&&<Tag c="#ff6666">Sin pick</Tag>}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:10,alignItems:"center"}}>
              {[["away",g.away,g.awayScore],["vs"],["home",g.home,g.homeScore]].map((item,idx)=>
                idx===1?<div key="vs" style={{textAlign:"center",fontSize:12,color:C.muted,fontWeight:800}}>VS</div>
                :<div key={item[1]} style={{textAlign:"center",padding:"12px 8px",borderRadius:12,
                  background:picked===item[1]?`${tm(item[1]).color}18`:"transparent",
                  border:`2px solid ${picked===item[1]?tm(item[1]).color:C.border}`,
                  opacity:picked&&picked!==item[1]?0.4:1}}>
                  {logo(item[1],36)}
                  <div style={{fontSize:14,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:picked===item[1]?tm(item[1]).color:C.text,marginTop:4}}>{item[1]}</div>
                  <div style={{fontSize:10,color:C.dim}}>{tm(item[1]).name}</div>
                  {(isFinal||isLive)&&<div style={{fontSize:20,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:isFinal&&item[1]===winner?"#00FF9D":C.text,marginTop:4}}>{item[2]}</div>}
                </div>
              )}
            </div>
          </Card>;
        })}
      </>}

      {/* ─── RANKING SUB-TAB ─── */}
      {subTab==="ranking"&&<Card>
        <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:14}}>🏆 Clasificación — {selGroup.name}</div>
        {leaderboard.length===0?<div style={{textAlign:"center",padding:30,color:C.dim}}>Aún no hay picks. ¡Haz el primero!</div>
        :leaderboard.map((r,i)=>{
          const isMe=r.user_id===user.id;
          const medalColors=["#FFB800","#C0C0C0","#CD7F32"];
          return <div key={r.user_id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 8px",marginBottom:4,borderRadius:10,background:isMe?`${C.accent}11`:i<3?"#FFB80008":"transparent",border:isMe?`1px solid ${C.accent}33`:"1px solid transparent"}}>
            <div style={{width:32,height:32,borderRadius:"50%",background:i<3?`${medalColors[i]}22`:"#0a1018",border:`2px solid ${i<3?medalColors[i]:C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:i<3?14:12,fontWeight:900,color:i<3?medalColors[i]:C.dim,flexShrink:0}}>
              {i<3?["🥇","🥈","🥉"][i]:i+1}
            </div>
            <div style={{flex:1}}>
              <div style={{fontSize:13,fontWeight:isMe?800:600,color:isMe?C.accent:C.text}}>{r.avatar_emoji} {r.name}{isMe?" (tú)":""}</div>
              <div style={{fontSize:10,color:C.dim}}>{r.correct_picks} aciertos de {r.total_picks} · {r.accuracy}% precisión</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:22,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#FFB800"}}>{r.total_points}</div>
              <div style={{fontSize:8,color:C.muted,textTransform:"uppercase",letterSpacing:1}}>PTS</div>
            </div>
          </div>;
        })}
      </Card>}

      {/* ─── MEMBERS SUB-TAB ─── */}
      {subTab==="members"&&<Card>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
          <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2}}>👥 Miembros — {selGroup.name}</div>
          <div style={{display:"flex",alignItems:"center",gap:8}}>
            <span style={{fontSize:11,color:C.dim}}>Invita amigos:</span>
            <button className="btn" onClick={copyCode} style={{background:"#FFB80022",border:"1px solid #FFB80044",borderRadius:8,padding:"6px 12px",color:"#FFB800",fontSize:11,fontWeight:700}}>{copied?"✓ Copiado":`📋 ${selGroup.code}`}</button>
          </div>
        </div>
        {(selGroup.members||[]).length===0?<div style={{textAlign:"center",padding:20,color:C.dim}}>Cargando miembros...</div>
        :(selGroup.members||[]).map((m,i)=><div key={m.userId||i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:i<(selGroup.members||[]).length-1?`1px solid ${C.border}`:"none"}}>
          <div style={{width:36,height:36,borderRadius:"50%",background:`${C.accent}15`,border:`2px solid ${C.accent}33`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{m.avatar_emoji||"🏀"}</div>
          <div style={{flex:1}}>
            <div style={{fontSize:13,fontWeight:700,color:m.userId===user.id?C.accent:C.text}}>{m.name}{m.userId===user.id?" (tú)":""}</div>
            <div style={{fontSize:10,color:C.dim}}>{m.userId===selGroup.owner_id?"👑 Creador":"Miembro"}</div>
          </div>
        </div>)}
        <Divider/>
        <div style={{textAlign:"center",marginTop:8}}>
          <div style={{fontSize:11,color:C.dim,marginBottom:8}}>Comparte este código para que se unan:</div>
          <div style={{fontSize:28,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:6,color:"#FFB800"}}>{selGroup.code}</div>
        </div>
      </Card>}
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

    {/* Sub tabs */}
    <div style={{display:"flex",gap:0,marginBottom:16}}>
      {[["bracket","🏀 Mi Bracket"],["mvp","🌟 MVP"],["ranking","🏆 Ranking"]].map(([id,label])=><button key={id} className="btn" onClick={()=>setSubTab(id)} style={{padding:"9px 18px",background:"transparent",borderBottom:subTab===id?`2px solid ${C.accent}`:"2px solid transparent",color:subTab===id?C.accent:C.dim,fontSize:12,fontWeight:subTab===id?700:500}}>{label}</button>)}
    </div>

    {subTab==="bracket"&&<>
      {/* ─── PLAY-IN ─── */}
      <Card style={{marginBottom:16}}>
        <div style={{fontSize:12,fontWeight:800,color:"#FFB800",textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>⚡ Play-In Tournament</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
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
  </div>);
};

/* ═══ APP ROOT ═══ */
const TABS=[{id:"home",icon:"🏠",label:"Home"},{id:"teams",icon:"🏆",label:"Equipos"},{id:"players",icon:"⭐",label:"Jugadores"},{id:"pickem",icon:"👥",label:"Grupos"},{id:"bracket",icon:"🏅",label:"Bracket"}];
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
      {tab==="home"&&<HomeTab games={games} standings={standings} players={players} live={live} userCtx={userCtx}/>}
      {tab==="teams"&&<TeamsTab standings={standings} live={live}/>}
      {tab==="players"&&<PlayersTab players={players} live={live}/>}
      {tab==="pickem"&&<PickemTab games={games} userCtx={userCtx}/>}
      {tab==="bracket"&&<BracketTab userCtx={userCtx} standings={standings}/>}
    </div>
  </div>);
}

//mejora