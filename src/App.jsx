import { useState, useEffect, useCallback, useRef } from "react";
import { AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TRIVIA_ALL, CHAMPS, PLAYER_CLUES, FLAGS } from "./data/minigames";
import { ESPN_LOGO,ESPN_ID,TM,FIX,fix } from "./data/teams";
import { GS, Tag, Card, ST, Divider, Spin, TT } from "./components/ui";
import { C } from "./theme";
import { CONF_COLORS, Confetti,ResultBanner,FloatPts,LiveBadge } from "./components/feedback";
import { tm, logo } from "./components/TeamLogo";
import { PlayersTab } from "./components/PlayersTab";
import { TeamsTab } from "./components/TeamsTab";
import { pickemAPI } from "./api/pickem";
import { OUTab } from "./components/OUTab";
import { getNameColor, getNamePrefix, getBorderColor } from "./utils/cosmetics";
import { ShopTab } from "./components/ShopTab";
import { SettingsTab } from "./components/SettingsTab";
import { isIOS,VAPID_KEY,autoSubscribePush } from "./utils/push";
import { SHOP_ITEMS, ACHIEVEMENT_DEFS } from "./data/shop";
import { SERIES_OPTS, MVP_CANDIDATES, BracketTab } from "./components/BracketTab";
import { HomeTab } from "./components/HomeTab";
import { calcWinPct, dynPts, dynBase } from "./utils/scoring";
import { MiniGamesTab } from "./components/MiniGamesTab";
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
  if (d?.ok && d.standings?.length >= 25) return d.standings.map(s=>({id:s.abbr,...s,...tm(s.abbr),pct:s.pct,players:[]}));
  // ESPN direct fallback
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
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem("courtiq_user")); } catch { return null; }
  });
  const save = (u) => { setUser(u); localStorage.setItem("courtiq_user", JSON.stringify(u)); };
  const logout = () => { setUser(null); localStorage.removeItem("courtiq_user"); };
  return { user, save, logout };
}








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
        <button className="btn" onClick={()=>pickemAPI("checkAchievements",{params:{userId:user.id,groupId:selGroup.id}}).then(d=>{if(d.ok&&d.newAchievements?.length)setMsg(`🏅 Nuevo logro desbloqueado`);})} style={{width:"100%",marginBottom:14,padding:"10px",borderRadius:10,background:`${C.accent}11`,border:`1px solid ${C.accent}33`,color:C.accent,fontSize:12,fontWeight:700}}>🔄 Verificar logros y racha</button>
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