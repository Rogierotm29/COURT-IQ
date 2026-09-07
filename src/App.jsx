import { useState, useEffect, useCallback } from "react";
import { TM, fix } from "./data/teams";
import { GS, Spin } from "./components/ui";
import { C, T } from "./theme";
import { tm } from "./components/TeamLogo";
import { calcWinPct } from "./utils/scoring";
import { getToday } from "./utils/date";
import { getSeason } from "./utils/season";
import { HomeTab } from "./components/HomeTab";
import { PickemTab } from "./components/PickemTab";
import { TeamsTab } from "./components/TeamsTab";
import { PlayersTab } from "./components/PlayersTab";
import { BracketTab } from "./components/BracketTab";
import { MiniGamesTab } from "./components/MiniGamesTab";
import { ShopTab } from "./components/ShopTab";
import { SettingsTab } from "./components/SettingsTab";
import { OUTab } from "./components/OUTab";
import { FloatingChat } from "./components/FloatingChat";
import { Onboarding } from "./components/Onboarding";
import { pickemAPI, onApiHealthChange } from "./api/pickem";
import { store } from "./utils/storage";
import { CosmeticsProvider } from "./context/CosmeticsContext";

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
].map(s=>({id:s.abbr,...s,...tm(s.abbr),pct:+(s.w/(s.w+s.l)).toFixed(3),players:[]}));

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
  let d = await api("/api/scoreboard");
  if (d?.ok) return { games: d.games, seasonType: d.seasonType ?? null };

  d = await espnDirect("https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard");
  if (!d) return { games: [], seasonType: null };

  // ESPN: 1 = pretemporada, 2 = temporada regular, 3 = playoffs
  const seasonType = d.leagues?.[0]?.season?.type?.type ?? null;

  const games = (d.events||[]).map(e=>{
    const comp=e.competitions?.[0],home=comp?.competitors?.find(c=>c.homeAway==="home"),away=comp?.competitors?.find(c=>c.homeAway==="away"),st=comp?.status?.type;
    return{id:e.id,home:fix(home?.team?.abbreviation),away:fix(away?.team?.abbreviation),homeScore:parseInt(home?.score||0),awayScore:parseInt(away?.score||0),
      status:st?.completed||st?.state==="post"?"Final":st?.state==="in"?"LIVE":"Upcoming",
      startTime:e.date||null,
      detail:st?.state==="in"?`Q${comp?.status?.period||"?"} ${comp?.status?.displayClock||""}`:(st?.state==="post"?"Final":st?.shortDetail||"")};
  });

  return { games, seasonType };
}

async function loadStandings() {
  let d = await api("/api/standings");
  if (d?.ok && d.standings?.length >= 25) return d.standings.map(s=>({id:s.abbr,...s,...tm(s.abbr),pct:s.pct,players:[]}));
  d = await espnDirect("https://site.api.espn.com/apis/v2/sports/basketball/nba/standings");
  if (!d) return null;
  const results=[];
  const walk=n=>{if(n?.standings?.entries?.length)n.standings.entries.forEach(e=>{const abbr=fix(e.team?.abbreviation||"");if(!TM[abbr])return;const sm={};(e.stats||[]).forEach(s=>{sm[s.name]=s.value;});const w=Math.round(sm.wins||0),l=Math.round(sm.losses||0);results.push({id:abbr,abbr,...tm(abbr),w,l,pct:w+l>0?+(w/(w+l)).toFixed(3):0,streak:`${Number(sm.streak||0)>=0?"W":"L"}${Math.abs(Number(sm.streak||0))||1}`,players:[]});});(n?.children||[]).forEach(walk);};
  walk(d);
  return results.length>=25?results:null;
}

async function loadPlayers() {
  const d = await api("/api/players");
  if (d?.ok && d.players?.length > 10) return d.players.map((p,i)=>({...p,id:i+1,color:tm(p.teamAbbr).color}));
  return null;
}

/* ═══ USER CONTEXT (localStorage) ═══ */
function useUser() {
  const [user, setUser] = useState(() => store.getJSON("courtiq_user", null));
  const save = (u) => { setUser(u); store.set("courtiq_user", JSON.stringify(u)); };
  const logout = () => { setUser(null); store.remove("courtiq_user"); };
  return { user, save, logout };
}

/* ═══ NAVEGACIÓN ═══ */
const NAV = [
  { section: "Inicio", items: [{ id:"home", label:"Inicio" }] },
  { section: "Pick'em", items: [
    { id:"pickem", label:"Grupos" },
    { id:"apuestas", label:"Apuestas" },
    { id:"parlay", label:"Parlay" },
    { id:"ou", label:"Over / Under" },
    { id:"shop", label:"Tienda" },
  ]},
  { section: "NBA", items: [
    { id:"teams", label:"Standings" },
    { id:"players", label:"Jugadores" },
    { id:"bracket", label:"Playoffs" },
    { id:"games", label:"Juegos" },
  ]},
  { section: "", items: [{ id:"settings", label:"Configuración" }] },
];
const ALL_TABS = NAV.flatMap(s => s.items);

export default function App(){
  const [tab,setTab]=useState("home");
  const [menuOpen,setMenuOpen]=useState(false);
  const [games,setGames]=useState([]);
  const [standings,setStandings]=useState(FB_ST);
  const [players,setPlayers]=useState(FB_PL);
  const [live,setLive]=useState({games:false,standings:false,players:false});
  const [loading,setLoading]=useState(false);
  const [lastUpd,setLastUpd]=useState(null);
  const [installPrompt,setInstallPrompt]=useState(null);
  const [isOffline,setIsOffline]=useState(!navigator.onLine);
  const [showOnboarding,setShowOnboarding]=useState(()=>!store.get("courtiq_onboarded"));
  const userCtx=useUser();
  const [picks,setPicks]=useState({});
  const [confidence,setConfidence]=useState({});
  const [selGroup,setSelGroup]=useState(null);
  const [groups,setGroups]=useState([]);
  const [apiDown,setApiDown]=useState(false);
  const gameStatusKey = games.map(g=>`${g.id}:${g.status}`).join("|");
  const [seasonType,setSeasonType]=useState(null);
  const makePick=useCallback(async(gameId,team,home,away,conf=1,g=null)=>{
    if(!selGroup||!userCtx.user) return;
    setPicks(p=>({...p,[gameId]:team}));
    const pickedSide=team===home?"home":"away";
    const wPct=g?.status==="Upcoming"?calcWinPct(g,pickedSide,standings):50;
    const today=getToday();
    const targets=groups.length?groups:[selGroup];
    await Promise.all(targets.map(grp=>
      pickemAPI("makePick",{body:{
        userId:userCtx.user.id, groupId:grp.id, gameId, gameDate:today,
        pickedTeam:team, homeTeam:home, awayTeam:away, confidence:conf, winPct:wPct
      }})
    ));
  },[selGroup,userCtx.user,standings,groups]);



  // Escucha la salud de la API — el cliente reporta cada fallo o recuperación
  useEffect(()=>{
    onApiHealthChange((ok)=>setApiDown(!ok));
    return()=>onApiHealthChange(null);
  },[]);

  useEffect(()=>{
    if(!userCtx.user||!selGroup){setPicks({});setConfidence({});return;}
    pickemAPI("myPicks",{params:{userId:userCtx.user.id,groupId:selGroup.id,date:getToday()}}).then(r=>{
      if(!r.ok) return;
      const m={},conf={};
      (r.picks||[]).forEach(p=>{
        m[p.game_id]=p.picked_team;
        if(p.confidence) conf[p.game_id]=p.confidence;
      });
      setPicks(m);setConfidence(conf);
    });
  },[userCtx.user,selGroup]);

  useEffect(()=>{
    if(!userCtx.user) return;
    const savedGid=store.get("courtiq_lastgroup");
    pickemAPI("myGroups",{params:{userId:userCtx.user.id}}).then(d=>{
      if(d.ok&&d.groups?.length){
        setGroups(d.groups);
        setSelGroup(d.groups.find(g=>g.id===savedGid)||d.groups[0]);
      }
    });
  },[userCtx.user]);

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
    const g=await loadGames();
    if(g.games.length>0){setGames(g.games);setLive(l=>({...l,games:true}));}
    if(g.seasonType!=null) setSeasonType(g.seasonType);
    const st=await loadStandings();if(st?.length>=25){setStandings(st);setLive(l=>({...l,standings:true}));}
    const pl=await loadPlayers();if(pl?.length>10){setPlayers(pl);setLive(l=>({...l,players:true}));} else {setPlayers(FB_PL);}
    setLastUpd(new Date());setLoading(false);
  },[]);

  useEffect(()=>{refreshAll();},[]);

  useEffect(()=>{
    const hasLive=games.some(g=>g.status==="LIVE");
    const t=setInterval(refreshAll,hasLive?30000:90000);
    return()=>clearInterval(t);
  },[gameStatusKey,refreshAll]);

  useEffect(()=>{
    pickemAPI("scoreGames").then(d=>{if(!d.ok)console.warn("scoreGames:",d.error);});
    pickemAPI("settleBets").then(d=>{if(!d.ok)console.warn("settleBets:",d.error);});
  },[]);

  useEffect(()=>{
    const params=new URLSearchParams(window.location.search);
    const tabParam=params.get("tab");
    const joinCode=params.get("join");
    const url=new URL(window.location.href);
    if(joinCode){
      store.set("courtiq_invite_code",joinCode.toUpperCase());
      setTab("pickem");
      url.searchParams.delete("join");
      window.history.replaceState({},"",url.toString());
    }
    if(tabParam){
      setTab(tabParam);
      url.searchParams.delete("tab");url.searchParams.delete("subtab");
      window.history.replaceState({},"",url.toString());
    }
  },[]);

  const liveGame=games.find(g=>g.status==="LIVE");
  const currentTab=ALL_TABS.find(t=>t.id===tab);

    return(<CosmeticsProvider userId={userCtx.user?.id}>
    <div style={{minHeight:"100vh",background:T.surface[0],fontFamily:"'Outfit','Segoe UI',sans-serif",color:T.text.primary}}>
    <GS/>
    {showOnboarding&&<Onboarding onDone={()=>{store.set("courtiq_onboarded","1");setShowOnboarding(false);}}/>}

    {/* ─── HEADER ─── */}
    <div style={{background:`${T.surface[0]}ee`,borderBottom:`1px solid ${T.border.subtle}`,padding:`${T.space[3]}px ${T.space[5]}px`,display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,backdropFilter:"blur(12px)"}}>
      <button className="btn" onClick={()=>setTab("home")} style={{display:"flex",alignItems:"baseline",gap:T.space[2],background:"none",padding:0}}>
        <span style={{fontSize:T.font.lg,fontWeight:800,color:T.text.primary,letterSpacing:-0.4}}>Court</span>
        <span style={{fontSize:T.font.lg,fontWeight:800,color:T.accent.base,letterSpacing:-0.4,marginLeft:-6}}>IQ</span>
        <span style={{fontSize:T.font.xs,color:T.text.tertiary,marginLeft:T.space[2]}}>
          {lastUpd?lastUpd.toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"}):getSeason()}
        </span>
      </button>

      <div style={{display:"flex",alignItems:"center",gap:T.space[2]}}>
        {liveGame&&<div style={{display:"flex",alignItems:"center",gap:T.space[2],background:T.surface[1],border:`1px solid ${T.border.base}`,borderRadius:T.radius.full,padding:`${T.space[1]}px ${T.space[3]}px`}}>
          <div style={{width:5,height:5,borderRadius:"50%",background:T.danger.base,animation:"pulse 1.5s infinite"}}/>
          <span style={{fontSize:T.font.xs,color:T.text.secondary}}>{liveGame.away} {liveGame.awayScore}–{liveGame.homeScore} {liveGame.home}</span>
        </div>}
        <span style={{fontSize:T.font.sm,fontWeight:600,color:T.text.secondary,padding:`0 ${T.space[2]}px`}}>{currentTab?.label}</span>
        <button className="btn" onClick={refreshAll} title="Actualizar" style={{background:"transparent",border:`1px solid ${T.border.base}`,borderRadius:T.radius.sm,padding:`${T.space[2]}px ${T.space[3]}px`,color:T.text.tertiary,fontSize:T.font.xs,fontWeight:600,minWidth:38}}>
          {loading?<Spin s={12}/>:"↻"}
        </button>
        <button className="btn" onClick={()=>setMenuOpen(o=>!o)} style={{background:menuOpen?T.accent.subtle:"transparent",border:`1px solid ${menuOpen?T.accent.base:T.border.base}`,borderRadius:T.radius.sm,padding:`${T.space[2]}px ${T.space[3]}px`,color:menuOpen?T.accent.base:T.text.secondary,fontSize:T.font.sm,fontWeight:600}}>
          Menú
        </button>
      </div>
    </div>

    {/* ─── MENÚ ─── */}
    {menuOpen&&<div onClick={()=>setMenuOpen(false)} style={{position:"fixed",inset:0,background:"#00000099",zIndex:1200,display:"flex",alignItems:"flex-end"}}>
      <div onClick={e=>e.stopPropagation()} style={{width:"100%",maxHeight:"85vh",background:T.surface[1],borderTop:`1px solid ${T.border.base}`,borderRadius:`${T.radius.xl}px ${T.radius.xl}px 0 0`,padding:`${T.space[5]}px ${T.space[5]}px ${T.space[7]}px`,overflowY:"auto",boxShadow:T.shadow.lg}}>
        <div style={{width:36,height:4,borderRadius:2,background:T.border.strong,margin:`0 auto ${T.space[5]}px`}}/>
        {NAV.map((sec,si)=><div key={si} style={{marginBottom:T.space[5]}}>
          {sec.section&&<div style={{fontSize:T.font.xs,color:T.text.tertiary,textTransform:"uppercase",letterSpacing:1.2,fontWeight:600,marginBottom:T.space[3]}}>{sec.section}</div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:T.space[2]}}>
            {sec.items.map(n=><button key={n.id} className="btn" onClick={()=>{setTab(n.id);setMenuOpen(false);}} style={{padding:`${T.space[3]}px ${T.space[4]}px`,borderRadius:T.radius.base,background:tab===n.id?T.accent.subtle:T.surface[2],border:`1px solid ${tab===n.id?T.accent.base:T.border.subtle}`,color:tab===n.id?T.accent.base:T.text.secondary,fontSize:T.font.sm,fontWeight:600,textAlign:"left",gridColumn:sec.items.length===1?"1/-1":undefined}}>{n.label}</button>)}
          </div>
        </div>)}
      </div>
    </div>}

    {/* ─── BANNERS ─── */}
    {apiDown&&!isOffline&&<div style={{background:T.surface[1],borderBottom:`1px solid ${T.border.base}`,borderLeft:`3px solid ${T.warning.base}`,padding:`${T.space[2]}px ${T.space[5]}px`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:T.space[3]}}>
      <span style={{fontSize:T.font.sm,color:T.text.secondary}}>Problemas para conectar con el servidor — algunos datos pueden no estar actualizados</span>
      <button className="btn" onClick={refreshAll} style={{padding:`${T.space[1]}px ${T.space[3]}px`,borderRadius:T.radius.sm,background:T.surface[2],border:`1px solid ${T.border.base}`,color:T.text.secondary,fontSize:T.font.xs,fontWeight:600,flexShrink:0}}>Reintentar</button>
    </div>}
    {isOffline&&<div style={{background:T.surface[1],borderBottom:`1px solid ${T.border.base}`,padding:`${T.space[2]}px ${T.space[5]}px`}}>
      <span style={{fontSize:T.font.sm,color:T.text.secondary}}>Sin conexión — los datos pueden estar desactualizados</span>
    </div>}

    {installPrompt&&<div style={{background:T.surface[1],borderBottom:`1px solid ${T.border.base}`,padding:`${T.space[2]}px ${T.space[5]}px`,display:"flex",alignItems:"center",justifyContent:"space-between",gap:T.space[3]}}>
      <span style={{fontSize:T.font.sm,color:T.text.secondary}}>Instala Court IQ para una mejor experiencia</span>
      <div style={{display:"flex",gap:T.space[2],flexShrink:0}}>
        <button className="btn" onClick={async()=>{installPrompt.prompt();const{outcome}=await installPrompt.userChoice;if(outcome==="accepted")setInstallPrompt(null);}} style={{padding:`${T.space[1]}px ${T.space[4]}px`,borderRadius:T.radius.sm,background:T.accent.base,color:"#fff",fontWeight:600,fontSize:T.font.xs}}>Instalar</button>
        <button className="btn" onClick={()=>setInstallPrompt(null)} style={{padding:`${T.space[1]}px ${T.space[3]}px`,borderRadius:T.radius.sm,background:"transparent",border:`1px solid ${T.border.base}`,color:T.text.tertiary,fontSize:T.font.xs}}>Cerrar</button>
      </div>
    </div>}

    {/* ─── CONTENIDO ─── */}
    <div style={{maxWidth:1000,margin:"0 auto",padding:`${T.space[6]}px ${T.space[4]}px 100px`}}>
      {tab==="home"&&<HomeTab games={games} live={live} userCtx={userCtx} standings={standings} picks={picks} confidence={confidence} setConfidence={setConfidence} makePick={makePick} selGroup={selGroup} goToBets={()=>setTab("apuestas")} goToGroup={()=>setTab("pickem")}/>}
      {tab==="teams"&&<TeamsTab standings={standings} live={live}/>}
      {tab==="players"&&<PlayersTab players={players} live={live}/>}
      {tab==="pickem"&&<PickemTab games={games} standings={standings} userCtx={userCtx} picks={picks} confidence={confidence} setConfidence={setConfidence} makePick={makePick} selGroup={selGroup} setSelGroup={setSelGroup} initSubTab="picks"/>}
      {tab==="apuestas"&&<PickemTab games={games} standings={standings} userCtx={userCtx} picks={picks} confidence={confidence} setConfidence={setConfidence} makePick={makePick} selGroup={selGroup} setSelGroup={setSelGroup} initSubTab="apuestas" standalone/>}
      {tab==="parlay"&&<PickemTab games={games} standings={standings} userCtx={userCtx} picks={picks} confidence={confidence} setConfidence={setConfidence} makePick={makePick} selGroup={selGroup} setSelGroup={setSelGroup} initSubTab="parlay" standalone/>}
      {tab==="ou"&&<OUTab games={games} userCtx={userCtx}/>}
      {tab==="shop"&&<ShopTab userCtx={userCtx}/>}
      {tab==="bracket"&&<BracketTab userCtx={userCtx} standings={standings}/>}
      {tab==="bracket"&&<BracketTab userCtx={userCtx} standings={standings} seasonType={seasonType}/>}
      {tab==="games"&&<MiniGamesTab players={players} userCtx={userCtx}/>}
      {tab==="settings"&&<SettingsTab userCtx={userCtx} installPrompt={installPrompt} onInstalled={()=>setInstallPrompt(null)}/>}
    </div>

    <FloatingChat userCtx={userCtx} selGroup={selGroup}/>
    </div>
  </CosmeticsProvider>);
}