import { useState, useEffect, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

const C = { bg:"#07090f", card:"#0d1117", border:"#1a2535", muted:"#3d5166", dim:"#566880", text:"#e0eaf5", accent:"#00C2FF" };

const GS = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=Outfit:wght@400;500;600;700;800;900&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0}
    body{background:#07090f}
    ::-webkit-scrollbar{width:4px;height:4px}
    ::-webkit-scrollbar-thumb{background:#1e2d40;border-radius:4px}
    @keyframes fadeUp{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:translateY(0)}}
    @keyframes pulse{0%,100%{opacity:1}50%{opacity:.25}}
    @keyframes spin{to{transform:rotate(360deg)}}
    .fade-up{animation:fadeUp .35s ease both}
    .btn{cursor:pointer;border:none;outline:none;transition:all .15s;font-family:inherit}
    .btn:hover{filter:brightness(1.15)}
    .card{transition:transform .15s,box-shadow .15s}
    .card:hover{transform:translateY(-2px);box-shadow:0 8px 28px #00000055}
    input,select{outline:none;font-family:inherit}
    .spin{animation:spin 1s linear infinite}
  `}</style>
);

const Tag     = ({c="#00C2FF",children}) => <span style={{fontSize:10,fontWeight:700,padding:"2px 8px",borderRadius:20,background:`${c}22`,color:c,letterSpacing:.8}}>{children}</span>;
const Card    = ({children,style={}})    => <div className="card" style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:16,padding:18,...style}}>{children}</div>;
const ST      = ({children,sub})         => <div style={{marginBottom:16}}><div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:2}}>{sub}</div><div style={{fontSize:22,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1,color:C.text}}>{children}</div></div>;
const Divider = ()                       => <div style={{height:1,background:C.border,margin:"12px 0"}}/>;
const Spin    = ({s=20})                 => <div className="spin" style={{width:s,height:s,border:`2px solid ${C.border}`,borderTopColor:C.accent,borderRadius:"50%",display:"inline-block"}}/>;
const TT = ({active,payload,label}) => active&&payload?.length
  ? <div style={{background:"#0d1117",border:`1px solid ${C.border}`,borderRadius:8,padding:"8px 14px"}}><p style={{color:C.muted,fontSize:10,marginBottom:4}}>{label}</p>{payload.map((p,i)=><p key={i} style={{color:p.color,fontSize:13,fontWeight:700}}>{p.name}: {p.value}</p>)}</div>
  : null;

const LiveBadge = ({live}) => (
  <span style={{fontSize:9,fontWeight:700,padding:"2px 8px",borderRadius:20,letterSpacing:.8,
    background:live?"#00FF9D18":"#1a2535",color:live?"#00FF9D":C.muted}}>
    {live ? "🟢 LIVE API" : "📦 Datos locales"}
  </span>
);

const TM = {
  ATL:{color:"#E03A3E",logo:"🦅",name:"Atlanta Hawks",conf:"E",div:"Southeast"},
  BOS:{color:"#008348",logo:"🍀",name:"Boston Celtics",conf:"E",div:"Atlantic"},
  BKN:{color:"#6A6A6A",logo:"🕸",name:"Brooklyn Nets",conf:"E",div:"Atlantic"},
  CHA:{color:"#1D1160",logo:"🐝",name:"Charlotte Hornets",conf:"E",div:"Southeast"},
  CHI:{color:"#CE1141",logo:"🐂",name:"Chicago Bulls",conf:"E",div:"Central"},
  CLE:{color:"#860038",logo:"⚔️",name:"Cleveland Cavaliers",conf:"E",div:"Central"},
  DAL:{color:"#00538C",logo:"⭐",name:"Dallas Mavericks",conf:"W",div:"Southwest"},
  DEN:{color:"#FEC524",logo:"🏔",name:"Denver Nuggets",conf:"W",div:"Northwest"},
  DET:{color:"#C8102E",logo:"⚙️",name:"Detroit Pistons",conf:"E",div:"Central"},
  GSW:{color:"#1D428A",logo:"🌉",name:"Golden State Warriors",conf:"W",div:"Pacific"},
  HOU:{color:"#CE1141",logo:"🚀",name:"Houston Rockets",conf:"W",div:"Southwest"},
  IND:{color:"#002D62",logo:"🏎",name:"Indiana Pacers",conf:"E",div:"Central"},
  LAC:{color:"#C8102E",logo:"✂️",name:"LA Clippers",conf:"W",div:"Pacific"},
  LAL:{color:"#552583",logo:"👑",name:"Los Angeles Lakers",conf:"W",div:"Pacific"},
  MEM:{color:"#5D76A9",logo:"🐻",name:"Memphis Grizzlies",conf:"W",div:"Southwest"},
  MIA:{color:"#98002E",logo:"🔥",name:"Miami Heat",conf:"E",div:"Southeast"},
  MIL:{color:"#00471B",logo:"🦌",name:"Milwaukee Bucks",conf:"E",div:"Central"},
  MIN:{color:"#236192",logo:"🐺",name:"Minnesota Timberwolves",conf:"W",div:"Northwest"},
  NOP:{color:"#0C2340",logo:"⚜️",name:"New Orleans Pelicans",conf:"W",div:"Southwest"},
  NYK:{color:"#006BB6",logo:"🗽",name:"New York Knicks",conf:"E",div:"Atlantic"},
  OKC:{color:"#007AC1",logo:"⚡",name:"OKC Thunder",conf:"W",div:"Northwest"},
  ORL:{color:"#0077C0",logo:"🪄",name:"Orlando Magic",conf:"E",div:"Southeast"},
  PHI:{color:"#ED174C",logo:"🔔",name:"Philadelphia 76ers",conf:"E",div:"Atlantic"},
  PHX:{color:"#E56020",logo:"☀️",name:"Phoenix Suns",conf:"W",div:"Pacific"},
  POR:{color:"#E03A3E",logo:"🌹",name:"Portland Trail Blazers",conf:"W",div:"Northwest"},
  SAC:{color:"#5A2D81",logo:"♛",name:"Sacramento Kings",conf:"W",div:"Pacific"},
  SAS:{color:"#8E9093",logo:"🪖",name:"San Antonio Spurs",conf:"W",div:"Southwest"},
  TOR:{color:"#CE1141",logo:"🦖",name:"Toronto Raptors",conf:"E",div:"Atlantic"},
  UTA:{color:"#002B5C",logo:"🎵",name:"Utah Jazz",conf:"W",div:"Northwest"},
  WAS:{color:"#002B5C",logo:"🧙",name:"Washington Wizards",conf:"E",div:"Southeast"},
};
const tm = (a) => TM[a] || {color:C.accent,logo:"🏀",name:a||"?",conf:"W",div:""};
const FIX = {"GS":"GSW","NY":"NYK","SA":"SAS","NO":"NOP","WSH":"WAS","UTAH":"UTA","CHAR":"CHA","PHO":"PHX","UTH":"UTA"};
const fix = (a) => FIX[a] || a;

const ROSTERS = {
  OKC:["Shai Gilgeous-Alexander","Jalen Williams","Chet Holmgren","Lu Dort","Alex Caruso","Isaiah Hartenstein","Ajay Mitchell","Ousmane Dieng"],
  SAS:["Victor Wembanyama","De'Aaron Fox","Stephon Castle","Jeremy Sochan","Devin Vassell","Keldon Johnson","Zach Collins","Julian Champagnie"],
  LAL:["Luka Dončić","LeBron James","Austin Reaves","Rui Hachimura","D'Angelo Russell","Gabe Vincent","Cam Reddish","Jaxson Hayes"],
  MIN:["Anthony Edwards","Rudy Gobert","Julius Randle","Naz Reid","Mike Conley","Jaden McDaniels","Donte DiVincenzo","Rob Dillingham"],
  HOU:["Kevin Durant","Alperen Sengun","Jalen Green","Fred VanVleet","Amen Thompson","Dillon Brooks","Jabari Smith Jr.","Tari Eason"],
  DEN:["Nikola Jokić","Jamal Murray","Aaron Gordon","Christian Braun","Russell Westbrook","Zeke Nnaji","Peyton Watson","Reggie Jackson"],
  PHX:["Devin Booker","Bradley Beal","Jusuf Nurkic","Eric Gordon","Royce O'Neale","Grayson Allen","Josh Okogie","Mason Plumlee"],
  LAC:["Kawhi Leonard","James Harden","Norman Powell","Ivica Zubac","Terance Mann","Bones Hyland","Amir Coffey","Kris Dunn"],
  POR:["Deni Avdija","Anfernee Simons","Scoot Henderson","Shaedon Sharpe","Deandre Ayton","Jerami Grant","Toumani Camara","Dalano Banton"],
  MEM:["Ja Morant","Jaren Jackson Jr.","Santi Aldama","Marcus Smart","Luke Kennard","GG Jackson","Vince Williams Jr.","Jake LaRavia"],
  SAC:["Domantas Sabonis","Russell Westbrook","Malik Monk","Kevin Huerter","Alex Len","Keon Ellis","Trey Lyles","Colby Jones"],
  GSW:["Stephen Curry","Draymond Green","Andrew Wiggins","Brandin Podziemski","Jonathan Kuminga","Gary Payton II","Moses Moody","Kevon Looney"],
  NOP:["Zion Williamson","CJ McCollum","Herbert Jones","Jonas Valanciunas","Trey Murphy III","Jose Alvarado","Yves Missi","Jordan Hawkins"],
  DAL:["Kyrie Irving","Anthony Davis","PJ Washington","Derrick Jones Jr.","Quentin Grimes","Maxi Kleber","Naji Marshall","Jaden Hardy"],
  UTA:["Lauri Markkanen","Keyonte George","Jordan Clarkson","Collin Sexton","Walker Kessler","John Collins","Isaiah Collier","Talen Horton-Tucker"],
  CLE:["Donovan Mitchell","Darius Garland","Evan Mobley","Jarrett Allen","Max Strus","Isaac Okoro","Dean Wade","Georges Niang"],
  BOS:["Jayson Tatum","Jaylen Brown","Jrue Holiday","Derrick White","Kristaps Porzingis","Payton Pritchard","Sam Hauser","Luke Kornet"],
  NYK:["Jalen Brunson","Karl-Anthony Towns","Mikal Bridges","OG Anunoby","Josh Hart","Miles McBride","Precious Achiuwa","Landry Shamet"],
  MIA:["Bam Adebayo","Tyler Herro","Jaime Jaquez Jr.","Davion Mitchell","Haywood Highsmith","Nikola Jovic","Duncan Robinson","Terry Rozier"],
  MIL:["Giannis Antetokounmpo","Damian Lillard","Brook Lopez","Bobby Portis","Ryan Rollins","Kevin Porter Jr.","Pat Connaughton","AJ Green"],
  IND:["Pascal Siakam","Tyrese Haliburton","Myles Turner","Bennedict Mathurin","Andrew Nembhard","Aaron Nesmith","TJ McConnell","Isaiah Jackson"],
  ORL:["Paolo Banchero","Franz Wagner","Desmond Bane","Wendell Carter Jr.","Jalen Suggs","Cole Anthony","Moritz Wagner","Jonathan Isaac"],
  ATL:["Trae Young","Jalen Johnson","Dyson Daniels","Nickeil Alexander-Walker","De'Andre Hunter","Onyeka Okongwu","Larry Nance Jr.","Garrison Mathews"],
  CHI:["Josh Giddey","Nikola Vucevic","Coby White","Patrick Williams","Ayo Dosunmu","Torrey Craig","Matas Buzelis","Julian Phillips"],
  TOR:["Scottie Barnes","Brandon Ingram","Immanuel Quickley","Jakob Poeltl","RJ Barrett","Gradey Dick","Ochai Agbaji","Bruce Brown"],
  DET:["Cade Cunningham","Jalen Duren","Ausar Thompson","Kevin Huerter","Caris LeVert","Marcus Sasser","Daniss Jenkins","Chaz Lanier"],
  PHI:["Tyrese Maxey","Joel Embiid","Paul George","Kelly Oubre Jr.","Andre Drummond","VJ Edgecombe","Cameron Payne","Kyle Lowry"],
  CHA:["LaMelo Ball","Brandon Miller","Miles Bridges","Mark Williams","Grant Williams","Nick Smith Jr.","Tre Mann","JT Thor"],
  BKN:["Michael Porter Jr.","Cam Thomas","Nic Claxton","Cameron Johnson","Ben Simmons","Noah Clowney","Trendon Watford","Day'Ron Sharpe"],
  WAS:["Carlton Carrington","Alexandre Sarr","Bilal Coulibaly","Jordan Poole","Corey Kispert","Kyle Kuzma","Johnny Davis","Julian Champagnie"],
};

// ─── STANDINGS FALLBACK (verified Mar 18, 2026) ──────────────────────────────
const FB_STANDINGS = [
  {abbr:"OKC",conf:"W",w:55,l:15,streak:"W5",last5:["W","W","W","W","W"]},
  {abbr:"SAS",conf:"W",w:51,l:18,streak:"W3",last5:["W","W","W","L","W"]},
  {abbr:"LAL",conf:"W",w:44,l:25,streak:"W2",last5:["W","W","L","W","W"]},
  {abbr:"MIN",conf:"W",w:43,l:27,streak:"W1",last5:["W","L","W","W","L"]},
  {abbr:"DEN",conf:"W",w:42,l:28,streak:"W1",last5:["W","L","W","L","W"]},
  {abbr:"HOU",conf:"W",w:41,l:27,streak:"L1",last5:["L","W","W","W","L"]},
  {abbr:"PHX",conf:"W",w:39,l:30,streak:"L1",last5:["L","W","L","W","W"]},
  {abbr:"LAC",conf:"W",w:34,l:35,streak:"L2",last5:["L","L","W","W","L"]},
  {abbr:"POR",conf:"W",w:34,l:36,streak:"W1",last5:["W","L","L","W","W"]},
  {abbr:"GSW",conf:"W",w:33,l:36,streak:"L1",last5:["L","W","L","W","L"]},
  {abbr:"MEM",conf:"W",w:24,l:44,streak:"L2",last5:["L","L","W","L","L"]},
  {abbr:"NOP",conf:"W",w:24,l:46,streak:"L1",last5:["L","W","L","L","L"]},
  {abbr:"DAL",conf:"W",w:23,l:47,streak:"L3",last5:["L","L","L","W","L"]},
  {abbr:"UTA",conf:"W",w:20,l:49,streak:"L2",last5:["L","L","W","L","L"]},
  {abbr:"SAC",conf:"W",w:18,l:52,streak:"L4",last5:["L","L","L","L","W"]},
  {abbr:"DET",conf:"E",w:49,l:19,streak:"W2",last5:["W","W","L","W","W"]},
  {abbr:"BOS",conf:"E",w:46,l:23,streak:"W1",last5:["W","L","W","W","L"]},
  {abbr:"NYK",conf:"E",w:45,l:25,streak:"W1",last5:["W","L","W","W","L"]},
  {abbr:"CLE",conf:"E",w:42,l:27,streak:"W2",last5:["W","W","L","W","L"]},
  {abbr:"TOR",conf:"E",w:39,l:29,streak:"L1",last5:["L","W","W","L","W"]},
  {abbr:"ORL",conf:"E",w:38,l:30,streak:"W1",last5:["W","L","W","W","L"]},
  {abbr:"ATL",conf:"E",w:38,l:31,streak:"L1",last5:["L","W","L","W","W"]},
  {abbr:"MIA",conf:"E",w:38,l:31,streak:"W1",last5:["W","L","W","L","W"]},
  {abbr:"PHI",conf:"E",w:37,l:32,streak:"L1",last5:["L","W","W","L","W"]},
  {abbr:"CHA",conf:"E",w:35,l:34,streak:"W1",last5:["W","L","L","W","L"]},
  {abbr:"CHI",conf:"E",w:28,l:41,streak:"L1",last5:["L","W","L","W","L"]},
  {abbr:"MIL",conf:"E",w:28,l:40,streak:"L2",last5:["L","L","W","L","W"]},
  {abbr:"BKN",conf:"E",w:17,l:52,streak:"L3",last5:["L","L","L","W","L"]},
  {abbr:"WAS",conf:"E",w:16,l:52,streak:"L4",last5:["L","L","L","L","W"]},
  {abbr:"IND",conf:"E",w:15,l:55,streak:"L5",last5:["L","L","L","L","L"]},
].map(s=>({id:s.abbr,...s,...tm(s.abbr),pct:+(s.w/(s.w+s.l)).toFixed(3),players:ROSTERS[s.abbr]||[]}));

// ─── PLAYER STATS (exact ESPN Season Leaders Mar 18, 2026) ───────────────────
const FB_PLAYERS = [
  {id:1, name:"Luka Dončić",teamAbbr:"LAL",pos:"G",pts:33.7,ast:8.7,reb:8.1,blk:0.6,stl:1.5,fgPct:46.0,fg3Pct:36.5},
  {id:2, name:"Shai Gilgeous-Alexander",teamAbbr:"OKC",pos:"G",pts:31.6,ast:6.4,reb:4.4,blk:0.7,stl:1.4,fgPct:54.8,fg3Pct:39.5},
  {id:3, name:"Tyrese Maxey",teamAbbr:"PHI",pos:"G",pts:31.0,ast:7.0,reb:4.7,blk:0.9,stl:1.8,fgPct:47.5,fg3Pct:41.8},
  {id:4, name:"Donovan Mitchell",teamAbbr:"CLE",pos:"G",pts:29.8,ast:5.4,reb:4.7,blk:0.3,stl:1.5,fgPct:49.7,fg3Pct:38.5},
  {id:5, name:"Nikola Jokić",teamAbbr:"DEN",pos:"C",pts:29.6,ast:11.0,reb:12.2,blk:0.8,stl:1.4,fgPct:60.5,fg3Pct:43.0},
  {id:6, name:"Jaylen Brown",teamAbbr:"BOS",pos:"G",pts:29.6,ast:4.9,reb:6.3,blk:0.4,stl:1.1,fgPct:50.1,fg3Pct:37.4},
  {id:7, name:"Anthony Edwards",teamAbbr:"MIN",pos:"G",pts:29.4,ast:3.7,reb:5.0,blk:0.8,stl:1.4,fgPct:50.6,fg3Pct:37.8},
  {id:8, name:"Giannis Antetokounmpo",teamAbbr:"MIL",pos:"F",pts:29.3,ast:5.5,reb:10.0,blk:0.8,stl:0.9,fgPct:64.3,fg3Pct:28.0},
  {id:9, name:"Jalen Brunson",teamAbbr:"NYK",pos:"G",pts:29.2,ast:6.3,reb:3.3,blk:0.1,stl:0.8,fgPct:47.5,fg3Pct:39.5},
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
  {id:25,name:"Julius Randle",teamAbbr:"MIN",pos:"F",pts:22.3,ast:5.7,reb:6.9,blk:0.1,stl:1.1,fgPct:49.0,fg3Pct:35.0},
  {id:26,name:"Alperen Sengun",teamAbbr:"HOU",pos:"C",pts:21.8,ast:6.5,reb:9.0,blk:1.0,stl:1.5,fgPct:51.2,fg3Pct:33.0},
  {id:27,name:"Karl-Anthony Towns",teamAbbr:"NYK",pos:"C",pts:21.5,ast:2.8,reb:11.5,blk:0.6,stl:0.8,fgPct:47.1,fg3Pct:38.5},
  {id:28,name:"LeBron James",teamAbbr:"LAL",pos:"F",pts:21.2,ast:6.7,reb:5.2,blk:0.6,stl:0.9,fgPct:51.1,fg3Pct:37.0},
  {id:29,name:"Anthony Davis",teamAbbr:"DAL",pos:"F",pts:20.4,ast:2.8,reb:10.8,blk:1.7,stl:1.2,fgPct:52.2,fg3Pct:28.0},
  {id:30,name:"Scottie Barnes",teamAbbr:"TOR",pos:"F",pts:19.1,ast:5.4,reb:8.6,blk:1.5,stl:1.4,fgPct:50.6,fg3Pct:33.0},
  {id:31,name:"Josh Giddey",teamAbbr:"CHI",pos:"G",pts:19.2,ast:9.0,reb:8.9,blk:0.4,stl:0.9,fgPct:46.6,fg3Pct:34.0},
  {id:32,name:"Kevin Porter Jr.",teamAbbr:"MIL",pos:"G",pts:18.6,ast:7.8,reb:5.1,blk:0.4,stl:2.2,fgPct:46.6,fg3Pct:35.0},
].map(p=>({...p,color:tm(p.teamAbbr).color}));

// ─── API HELPERS ──────────────────────────────────────────────────────────────
async function fetchJSON(url, timeout=8000) {
  const ctrl = new AbortController();
  const t = setTimeout(()=>ctrl.abort(), timeout);
  try { const r = await fetch(url,{signal:ctrl.signal}); clearTimeout(t); if(!r.ok) throw new Error(`HTTP ${r.status}`); return await r.json(); }
  catch(e){ clearTimeout(t); throw e; }
}

async function getScoreboard() {
  try {
    const d = await fetchJSON("https://site.api.espn.com/apis/site/v2/sports/basketball/nba/scoreboard");
    return (d.events||[]).map(e=>{
      const comp=e.competitions?.[0]; const home=comp?.competitors?.find(c=>c.homeAway==="home"); const away=comp?.competitors?.find(c=>c.homeAway==="away");
      const st=comp?.status?.type; const live=st?.name==="STATUS_IN_PROGRESS"; const done=st?.completed;
      return {id:e.id,home:fix(home?.team?.abbreviation),away:fix(away?.team?.abbreviation),homeScore:parseInt(home?.score||0),awayScore:parseInt(away?.score||0),
        status:done?"Final":live?"LIVE":"Upcoming",detail:live?`Q${comp?.status?.period||"?"} ${comp?.status?.displayClock||""}`:st?.shortDetail||""};
    });
  } catch(e){console.warn("Scoreboard:",e.message);return[];}
}

async function getStandings() {
  try {
    const d = await fetchJSON("https://site.api.espn.com/apis/v2/sports/basketball/nba/standings");
    const results = [];
    const walk = (node) => {
      if(node?.standings?.entries?.length){
        node.standings.entries.forEach(entry=>{
          const abbr=fix(entry.team?.abbreviation||""); if(!TM[abbr]) return;
          const sm={}; (entry.stats||[]).forEach(s=>{sm[s.name]=s.value;sm[s.abbreviation||""]=s.value;});
          const w=Math.round(sm.wins??sm.W??0),l=Math.round(sm.losses??sm.L??0),streak=sm.streak??0;
          const fb=FB_STANDINGS.find(f=>f.abbr===abbr);
          results.push({id:abbr,abbr,...tm(abbr),w,l,pct:w+l>0?+(w/(w+l)).toFixed(3):0,
            streak:`${Number(streak)>=0?"W":"L"}${Math.abs(Number(streak))||1}`,
            last5:fb?.last5||["W","L","W","W","L"],players:ROSTERS[abbr]||[]});
        });
      }
      (node?.children||[]).forEach(walk);
    };
    walk(d);
    return results.length>=25?results:null;
  } catch(e){console.warn("Standings API:",e.message);return null;}
}

// ─── TABS ─────────────────────────────────────────────────────────────────────
const HomeTab = ({games,standings,players,live}) => {
  const east=standings.filter(t=>t.conf==="E").sort((a,b)=>b.w-a.w);
  const west=standings.filter(t=>t.conf==="W").sort((a,b)=>b.w-a.w);
  return (<div className="fade-up">
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}><ST sub="NBA 2025-26 · Hoy">Partidos del Día</ST><LiveBadge live={live.games}/></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:10,marginBottom:28}}>
      {games.length===0?<div style={{color:C.muted,fontSize:13}}>No hay partidos hoy.</div>
      :games.map(g=>(<Card key={g.id} style={{padding:14}}>
        <div style={{marginBottom:10}}>{g.status==="LIVE"?<Tag c="#ff4444">● LIVE {g.detail}</Tag>:g.status==="Final"?<Tag c={C.muted}>Final</Tag>:<Tag c={C.accent}>{g.detail||"Próximo"}</Tag>}</div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{textAlign:"center",flex:1}}><div style={{fontSize:18}}>{tm(g.away).logo}</div><div style={{fontSize:11,color:C.dim,margin:"2px 0"}}>{g.away}</div><div style={{fontSize:g.status!=="Upcoming"?26:16,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.text}}>{g.status!=="Upcoming"?g.awayScore:"—"}</div></div>
          <div style={{fontSize:10,color:C.muted,padding:"0 6px"}}>VS</div>
          <div style={{textAlign:"center",flex:1}}><div style={{fontSize:18}}>{tm(g.home).logo}</div><div style={{fontSize:11,color:C.dim,margin:"2px 0"}}>{g.home}</div><div style={{fontSize:g.status!=="Upcoming"?26:16,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.text}}>{g.status!=="Upcoming"?g.homeScore:"—"}</div></div>
        </div></Card>))}
    </div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}><ST sub="Temporada 2025-26">Top Anotadores (ESPN)</ST><LiveBadge live={false}/></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(195px,1fr))",gap:10,marginBottom:28}}>
      {players.slice(0,8).map(p=>(<Card key={p.id} style={{borderLeft:`3px solid ${p.color}`,padding:14}}>
        <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
          <div style={{width:36,height:36,borderRadius:"50%",background:`${p.color}22`,border:`2px solid ${p.color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,color:p.color,fontFamily:"'Bebas Neue',sans-serif",flexShrink:0}}>{p.name.split(" ").map(n=>n[0]).join("").slice(0,3)}</div>
          <div><div style={{fontSize:12,fontWeight:700,color:C.text,lineHeight:1.3}}>{p.name}</div><div style={{fontSize:10,color:C.muted}}>{p.teamAbbr} · {p.pos}</div></div>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:5}}>
          {[["PTS",p.pts],["AST",p.ast],["REB",p.reb]].map(([l,v])=>(<div key={l} style={{textAlign:"center",background:"#0a1018",borderRadius:7,padding:"5px 2px"}}><div style={{fontSize:16,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.text}}>{v}</div><div style={{fontSize:8,color:C.muted,textTransform:"uppercase",letterSpacing:1}}>{l}</div></div>))}
        </div></Card>))}
    </div>
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}><ST sub="NBA 2025-26">Standings</ST><LiveBadge live={live.standings}/></div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      {[["Este 🌊",east],["Oeste 🌵",west]].map(([label,teams])=>(<Card key={label}>
        <div style={{fontSize:11,fontWeight:700,color:C.dim,marginBottom:12}}>{label}</div>
        {teams.slice(0,8).map((t,i)=>(<div key={t.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:i<7?`1px solid ${C.border}`:"none"}}>
          <span style={{fontSize:10,width:16,color:i<6?"#FFB800":i<8?"#00C2FF":C.muted,fontWeight:800}}>{i+1}</span>
          <span style={{fontSize:14}}>{t.logo}</span><span style={{flex:1,fontSize:12,fontWeight:600,color:C.text}}>{t.abbr}</span>
          <span style={{fontSize:11,color:C.dim,width:44}}>{t.w}–{t.l}</span><Tag c={t.streak?.startsWith("W")?"#00FF9D":"#ff6666"}>{t.streak}</Tag>
        </div>))}</Card>))}
    </div>
  </div>);
};

const TeamsTab = ({standings,live}) => {
  const [conf,setConf]=useState("ALL");
  const [sel,setSel]=useState(standings.find(t=>t.abbr==="DET")||standings[0]);
  const visible=standings.filter(t=>conf==="ALL"||t.conf===conf).sort((a,b)=>b.w-a.w);
  return (<div className="fade-up">
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}><ST sub="NBA 2025-26">30 Equipos</ST><LiveBadge live={live.standings}/></div>
    <div style={{display:"flex",gap:8,marginBottom:14}}>
      {[["Todos","ALL"],["Este","E"],["Oeste","W"]].map(([l,v])=>(<button key={v} className="btn" onClick={()=>setConf(v)} style={{padding:"7px 16px",borderRadius:20,background:conf===v?C.accent:"#0d1117",border:`1px solid ${conf===v?C.accent:C.border}`,color:conf===v?"#07090f":C.dim,fontWeight:700,fontSize:12}}>{l}</button>))}
    </div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(84px,1fr))",gap:7,marginBottom:22}}>
      {visible.map(t=>(<button key={t.id} className="btn" onClick={()=>setSel(t)} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3,padding:"10px 6px",borderRadius:12,background:sel?.id===t.id?`${t.color}22`:"#0d1117",border:`1px solid ${sel?.id===t.id?t.color:C.border}`}}>
        <span style={{fontSize:22}}>{t.logo}</span><span style={{fontSize:11,fontWeight:800,color:sel?.id===t.id?t.color:C.dim}}>{t.abbr}</span><span style={{fontSize:9,color:C.muted}}>{t.w}–{t.l}</span>
      </button>))}
    </div>
    {sel&&<><Card style={{marginBottom:14,background:`linear-gradient(135deg,${sel.color}14,${C.card})`,borderColor:`${sel.color}44`}}>
      <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
        <div style={{fontSize:52}}>{sel.logo}</div>
        <div><div style={{fontSize:22,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:sel.color,letterSpacing:1}}>{sel.name}</div><div style={{fontSize:11,color:C.muted}}>Conf. {sel.conf==="E"?"Este":"Oeste"} · {sel.div} · 2025-26</div></div>
        <div style={{marginLeft:"auto",display:"flex",gap:18,flexWrap:"wrap"}}>
          {[[sel.w,"Wins",C.text],[sel.l,"Losses","#ff6666"],[(sel.pct*100).toFixed(1)+"%","Win%","#00FF9D"],[sel.streak,"Racha",sel.streak?.startsWith("W")?"#00FF9D":"#ff6666"]].map(([v,l,c])=>(<div key={l} style={{textAlign:"center"}}><div style={{fontSize:26,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:c}}>{v}</div><div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:1}}>{l}</div></div>))}
        </div>
      </div></Card>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
      <Card><div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>Roster 2025-26</div>
        {(sel.players||[]).map((p,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:i<sel.players.length-1?`1px solid ${C.border}`:"none"}}>
          <div style={{width:22,height:22,borderRadius:"50%",background:`${sel.color}22`,border:`1px solid ${sel.color}44`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,fontWeight:800,color:sel.color,flexShrink:0}}>{i+1}</div>
          <span style={{fontSize:12,fontWeight:600,color:C.text}}>{p}</span></div>))}</Card>
      <Card><div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>Últimos 5 · Info</div>
        <div style={{display:"flex",gap:8,marginBottom:14}}>{(sel.last5||[]).map((r,i)=>(<div key={i} style={{width:38,height:38,borderRadius:9,background:r==="W"?"#00FF9D22":"#ff444422",border:`2px solid ${r==="W"?"#00FF9D":"#ff4444"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:900,color:r==="W"?"#00FF9D":"#ff4444"}}>{r}</div>))}</div>
        <Divider/>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
          {[["Record",`${sel.w}–${sel.l}`],["Win %",`${(sel.pct*100).toFixed(1)}%`],["Conf.",sel.conf==="E"?"Este":"Oeste"],["División",sel.div]].map(([l,v])=>(<div key={l} style={{background:"#0a1018",borderRadius:8,padding:"10px"}}><div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:1,marginBottom:4}}>{l}</div><div style={{fontSize:14,fontWeight:700,color:C.text}}>{v}</div></div>))}
        </div></Card>
    </div></>}
  </div>);
};

const PlayersTab = ({players,live}) => {
  const [sel,setSel]=useState(players[0]);
  const [search,setSearch]=useState("");
  const [teamFilter,setTeamFilter]=useState("ALL");
  const filtered=players.filter(p=>{const q=search.toLowerCase();return(p.name.toLowerCase().includes(q)||p.teamAbbr?.toLowerCase().includes(q)||p.pos?.toLowerCase().includes(q))&&(teamFilter==="ALL"||p.teamAbbr===teamFilter);});
  const teams=[...new Set(players.map(p=>p.teamAbbr).filter(Boolean))].sort();
  const color=sel?tm(sel.teamAbbr).color:C.accent;
  const pts=sel?+sel.pts:20;
  const trend=sel?Array.from({length:15},(_,i)=>({g:`G${i+1}`,pts:Math.max(6,Math.round(pts+Math.sin(sel.id*3+i*2)*7))})):[];
  const monthly=sel?["Oct","Nov","Dec","Jan","Feb","Mar"].map((m,i)=>({m,pts:Math.max(8,Math.round(pts+Math.sin(sel.id+i)*3))})):[];
  const radar=sel?[{s:"PTS",v:Math.min(99,Math.round(pts/38*95))},{s:"AST",v:Math.min(99,Math.round(+(sel.ast||0)/12*95))},{s:"REB",v:Math.min(99,Math.round(+(sel.reb||0)/15*95))},{s:"BLK",v:Math.min(99,Math.round(+(sel.blk||0)/4*95))},{s:"3PT",v:Math.min(99,Math.round(+sel.fg3Pct/44*95))},{s:"FG%",v:Math.min(99,Math.round(+sel.fgPct/62*95))}]:[];
  return (<div className="fade-up">
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}><ST sub="NBA 2025-26">Explorar Jugadores</ST><LiveBadge live={live.players}/></div>
    <div style={{display:"flex",gap:8,marginBottom:10,flexWrap:"wrap"}}>
      <div style={{position:"relative",flex:"1 1 200px"}}><span style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)",fontSize:14}}>🔍</span>
        <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Busca por nombre, equipo o posición..." style={{width:"100%",background:C.card,border:`1px solid ${C.border}`,borderRadius:11,padding:"10px 12px 10px 38px",color:C.text,fontSize:13}}/></div>
      <select value={teamFilter} onChange={e=>setTeamFilter(e.target.value)} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:11,padding:"10px 14px",color:C.text,fontSize:13,cursor:"pointer"}}><option value="ALL">Todos</option>{teams.map(t=><option key={t} value={t}>{t}</option>)}</select>
    </div>
    <div style={{display:"flex",gap:6,flexWrap:"wrap",marginBottom:20}}>
      {filtered.length===0?<div style={{color:C.muted,fontSize:13,padding:"10px 0"}}>No se encontró 🤷</div>
      :filtered.map(p=>(<button key={p.id} className="btn" onClick={()=>setSel(p)} style={{padding:"6px 12px",borderRadius:9,background:sel?.id===p.id?`${tm(p.teamAbbr).color}18`:C.card,border:`1px solid ${sel?.id===p.id?tm(p.teamAbbr).color:C.border}`,color:sel?.id===p.id?tm(p.teamAbbr).color:C.dim,fontWeight:700,fontSize:11}}>{p.name} <span style={{opacity:.5,fontWeight:400}}>· {p.teamAbbr}</span></button>))}
    </div>
    {sel&&<><Card style={{marginBottom:14,borderLeft:`4px solid ${color}`}}>
      <div style={{display:"flex",alignItems:"center",gap:14,flexWrap:"wrap"}}>
        <div style={{width:52,height:52,borderRadius:"50%",background:`${color}22`,border:`2px solid ${color}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:900,color,fontFamily:"'Bebas Neue',sans-serif",flexShrink:0}}>{sel.name.split(" ").map(n=>n[0]).join("").slice(0,3)}</div>
        <div><div style={{fontSize:22,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color,letterSpacing:1}}>{sel.name}</div><div style={{fontSize:11,color:C.muted}}>{tm(sel.teamAbbr).name} · {sel.pos} · 2025-26</div></div>
        <div style={{marginLeft:"auto",display:"flex",gap:12,flexWrap:"wrap"}}>
          {[["PTS",sel.pts],["AST",sel.ast],["REB",sel.reb],["BLK",sel.blk],["STL",sel.stl],["FG%",sel.fgPct]].map(([l,v])=>(<div key={l} style={{textAlign:"center"}}><div style={{fontSize:22,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.text}}>{v}</div><div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:1}}>{l}</div></div>))}
        </div>
      </div></Card>
    <div style={{display:"grid",gridTemplateColumns:"1fr 260px",gap:14,marginBottom:14}}>
      <Card><div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:4}}>Tendencia de Puntos (sim)</div><div style={{fontSize:12,fontWeight:700,color,marginBottom:10}}>{sel.name}</div>
        <ResponsiveContainer width="100%" height={165}><AreaChart data={trend}><defs><linearGradient id="ag11" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor={color} stopOpacity={.3}/><stop offset="95%" stopColor={color} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke={C.border}/><XAxis dataKey="g" tick={{fill:C.muted,fontSize:9}} axisLine={false} tickLine={false}/><YAxis tick={{fill:C.muted,fontSize:9}} axisLine={false} tickLine={false}/><Tooltip content={<TT/>}/><Area type="monotone" dataKey="pts" name="PTS" stroke={color} strokeWidth={2.5} fill="url(#ag11)" dot={false} activeDot={{r:5}}/></AreaChart></ResponsiveContainer></Card>
      <Card><div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>Skills Radar</div>
        <ResponsiveContainer width="100%" height={185}><RadarChart data={radar}><PolarGrid stroke={C.border}/><PolarAngleAxis dataKey="s" tick={{fill:C.dim,fontSize:10}}/><PolarRadiusAxis domain={[0,100]} tick={false} axisLine={false}/><Radar dataKey="v" stroke={color} fill={color} fillOpacity={.2} strokeWidth={2}/></RadarChart></ResponsiveContainer></Card>
    </div>
    <Card><div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>Promedio por Mes (sim) · 2025-26</div>
      <ResponsiveContainer width="100%" height={145}><BarChart data={monthly}><CartesianGrid strokeDasharray="3 3" stroke={C.border} vertical={false}/><XAxis dataKey="m" tick={{fill:C.muted,fontSize:11}} axisLine={false} tickLine={false}/><YAxis tick={{fill:C.muted,fontSize:9}} axisLine={false} tickLine={false}/><Tooltip content={<TT/>}/><Bar dataKey="pts" name="PTS" fill={color} radius={[5,5,0,0]}/></BarChart></ResponsiveContainer></Card>
    </>}
  </div>);
};

const PickemTab = ({games}) => {
  const [picks,setPicks]=useState({}); const [submitted,setSubmitted]=useState(false);
  const upcoming=games.filter(g=>g.status==="Upcoming"); const done=upcoming.filter(g=>picks[g.id]).length;
  return (<div className="fade-up"><ST sub="Compite con amigos">Pick'em Daily 🎯</ST>
    <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:10}}>Picks de Hoy — {done}/{upcoming.length}</div>
    {upcoming.length===0?<Card style={{textAlign:"center",padding:30,color:C.muted}}>No hay partidos próximos hoy 🏖</Card>
    :upcoming.map(g=>(<Card key={g.id} style={{marginBottom:10}}>
      <div style={{fontSize:9,color:C.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:1.5}}>⏰ Elige al ganador</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:8,alignItems:"center"}}>
        {[g.away,null,g.home].map((item,idx)=>idx===1?<div key="vs" style={{fontSize:11,color:C.muted,fontWeight:700,textAlign:"center"}}>VS</div>
        :<button key={item} className="btn" onClick={()=>!submitted&&setPicks(p=>({...p,[g.id]:item}))} style={{padding:"12px",borderRadius:11,textAlign:"center",background:picks[g.id]===item?`${tm(item).color}22`:C.card,border:`2px solid ${picks[g.id]===item?tm(item).color:C.border}`,color:picks[g.id]===item?tm(item).color:C.text,fontSize:16,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",width:"100%"}}>{tm(item).logo} {picks[g.id]===item&&"✓ "}{item}</button>)}
      </div></Card>))}
    {done>0&&!submitted&&<button className="btn" onClick={()=>setSubmitted(true)} style={{width:"100%",marginTop:6,padding:"13px",borderRadius:11,background:`linear-gradient(135deg,${C.accent},#0066ff)`,border:"none",color:"#07090f",fontSize:14,fontWeight:900}}>🎯 Confirmar {done} pick{done>1?"s":""}</button>}
    {submitted&&<Card style={{marginTop:10,background:"#00FF9D10",borderColor:"#00FF9D44",textAlign:"center",padding:22}}><div style={{fontSize:26,marginBottom:6}}>🎉</div><div style={{fontSize:15,fontWeight:800,color:"#00FF9D"}}>¡Picks enviados!</div></Card>}
  </div>);
};

const BE=[{seed:1,s:"DET",c:"#C8102E"},{seed:2,s:"BOS",c:"#008348"},{seed:3,s:"NYK",c:"#006BB6"},{seed:4,s:"CLE",c:"#860038"},{seed:5,s:"TOR",c:"#CE1141"},{seed:6,s:"ORL",c:"#0077C0"},{seed:7,s:"ATL",c:"#E03A3E"},{seed:8,s:"MIA",c:"#98002E"}];
const BW=[{seed:1,s:"OKC",c:"#007AC1"},{seed:2,s:"SAS",c:"#8E9093"},{seed:3,s:"LAL",c:"#552583"},{seed:4,s:"MIN",c:"#236192"},{seed:5,s:"DEN",c:"#FEC524"},{seed:6,s:"HOU",c:"#CE1141"},{seed:7,s:"PHX",c:"#E56020"},{seed:8,s:"LAC",c:"#C8102E"}];

const BracketTab = () => {
  const [picks,setPicks]=useState({}); const [saved,setSaved]=useState(false);
  const pick=(k,t)=>{setSaved(false);setPicks(p=>({...p,[k]:t}));};
  const Slot=({k,t})=>{const w=picks[k];const win=t&&w===t.s;return(<button className="btn" onClick={()=>t&&pick(k,t.s)} style={{display:"flex",alignItems:"center",gap:5,width:"100%",padding:"7px 9px",borderRadius:7,background:win?`${t.c}28`:"#0a1018",border:`1px solid ${win?t.c:C.border}`,marginBottom:2}}>{t?<><span style={{fontSize:9,color:C.muted,width:12,flexShrink:0}}>{t.seed}</span><span style={{fontSize:11,fontWeight:700,color:win?t.c:C.text,flex:1,textAlign:"left"}}>{t.s}</span>{win&&<span style={{fontSize:10,color:t.c}}>✓</span>}</>:<span style={{fontSize:10,color:C.muted,flex:1,fontStyle:"italic"}}>TBD</span>}</button>);};
  const Matchup=({rk,i,t1,t2})=>(<div style={{marginBottom:10}}><Slot k={`${rk}-${i}a`} t={t1}/><Slot k={`${rk}-${i}b`} t={t2}/></div>);
  const Round=({title,rk,pairs,accent})=>(<div style={{flex:"1 1 110px",minWidth:110}}><div style={{fontSize:9,color:accent||C.muted,textTransform:"uppercase",letterSpacing:1.5,fontWeight:700,textAlign:"center",marginBottom:10,paddingBottom:6,borderBottom:`1px solid ${C.border}`}}>{title}</div>{pairs.map((p,i)=><Matchup key={i} rk={rk} i={i} t1={p[0]} t2={p[1]}/>)}</div>);
  return(<div className="fade-up"><ST sub="NBA Playoffs 2026">Arma Tu Bracket 🏅</ST>
    <div style={{fontSize:12,color:C.dim,marginBottom:18}}>Seeds: OKC #1 Oeste · DET #1 Este</div>
    <Card style={{marginBottom:14}}><div style={{fontSize:12,fontWeight:800,color:"#00C2FF",textTransform:"uppercase",letterSpacing:2,marginBottom:14}}>🌊 Conferencia Este</div><div style={{display:"flex",gap:10,flexWrap:"wrap"}}><Round title="1ª Ronda" rk="e1" accent="#00C2FF" pairs={[[BE[0],BE[7]],[BE[3],BE[4]],[BE[1],BE[6]],[BE[2],BE[5]]]}/><Round title="Semis" rk="e2" accent="#00C2FF" pairs={[[null,null],[null,null]]}/><Round title="Final Este" rk="ecf" accent="#00C2FF" pairs={[[null,null]]}/></div></Card>
    <Card style={{marginBottom:14}}><div style={{fontSize:12,fontWeight:800,color:"#FFB800",textTransform:"uppercase",letterSpacing:2,marginBottom:14}}>🌵 Conferencia Oeste</div><div style={{display:"flex",gap:10,flexWrap:"wrap"}}><Round title="1ª Ronda" rk="w1" accent="#FFB800" pairs={[[BW[0],BW[7]],[BW[3],BW[4]],[BW[1],BW[6]],[BW[2],BW[5]]]}/><Round title="Semis" rk="w2" accent="#FFB800" pairs={[[null,null],[null,null]]}/><Round title="Final Oeste" rk="wcf" accent="#FFB800" pairs={[[null,null]]}/></div></Card>
    <button className="btn" onClick={()=>setSaved(true)} style={{width:"100%",padding:"14px",borderRadius:12,background:"linear-gradient(135deg,#FFB800,#ff8800)",border:"none",color:"#07090f",fontSize:14,fontWeight:900}}>🏆 Guardar mi Bracket</button>
    {saved&&<div style={{textAlign:"center",marginTop:10,fontSize:13,color:"#00FF9D",fontWeight:700}}>✅ ¡Bracket guardado!</div>}
  </div>);
};

const TABS=[{id:"home",icon:"🏠",label:"Home"},{id:"teams",icon:"🏆",label:"Equipos"},{id:"players",icon:"⭐",label:"Jugadores"},{id:"pickem",icon:"🎯",label:"Pick'em"},{id:"bracket",icon:"🏅",label:"Brackets"}];

export default function App() {
  const [tab,setTab]=useState("home");
  const [games,setGames]=useState([]);
  const [standings,setStandings]=useState(FB_STANDINGS);
  const [players]=useState(FB_PLAYERS);
  const [live,setLive]=useState({games:false,standings:false,players:false});
  const [loadingG,setLoadingG]=useState(false);
  const [lastUpd,setLastUpd]=useState(null);

  const refreshAll = useCallback(async () => {
    setLoadingG(true);
    const g = await getScoreboard();
    if(g.length>0){setGames(g);setLive(l=>({...l,games:true}));}
    const st = await getStandings();
    if(st&&st.length>=25){setStandings(st);setLive(l=>({...l,standings:true}));}
    setLastUpd(new Date());
    setLoadingG(false);
  }, []);

  useEffect(()=>{refreshAll();const t=setInterval(refreshAll,120000);return()=>clearInterval(t);},[]);

  const liveGame=games.find(g=>g.status==="LIVE");
  return (<div style={{minHeight:"100vh",background:C.bg,fontFamily:"'Outfit','Segoe UI',sans-serif",color:C.text}}>
    <GS/>
    <div style={{background:"#0a0f17ee",borderBottom:`1px solid ${C.border}`,padding:"11px 22px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,backdropFilter:"blur(16px)"}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:31,height:31,borderRadius:9,background:"linear-gradient(135deg,#00C2FF,#0055ff)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>🏀</div>
        <div><div style={{fontSize:15,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",letterSpacing:1,lineHeight:1}}>COURT IQ</div>
          <div style={{fontSize:8,color:C.muted,letterSpacing:2,textTransform:"uppercase"}}>{lastUpd?`Actualizado ${lastUpd.toLocaleTimeString("es-MX",{hour:"2-digit",minute:"2-digit"})}`:"NBA 2025-26"}</div></div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        {liveGame?<div style={{display:"flex",alignItems:"center",gap:6,background:"#0a1520",border:`1px solid #1a2c3d`,borderRadius:20,padding:"5px 12px"}}><div style={{width:6,height:6,borderRadius:"50%",background:"#ff4444",animation:"pulse 1s infinite"}}/><span style={{fontSize:10,color:"#cc3333",fontWeight:700}}>LIVE</span><span style={{fontSize:10,color:C.muted}}>{liveGame.away} {liveGame.awayScore}–{liveGame.home} {liveGame.homeScore}</span></div>
        :<div style={{fontSize:10,color:C.muted,padding:"5px 8px"}}>Sin juegos en vivo</div>}
        <button className="btn" onClick={refreshAll} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:8,padding:"6px 10px",color:C.dim,fontSize:13}}>{loadingG?<Spin s={13}/>:"🔄"}</button>
      </div>
    </div>
    <div style={{background:"#0a0f17",borderBottom:`1px solid ${C.border}`,padding:"0 22px",display:"flex",overflowX:"auto"}}>
      {TABS.map(n=>(<button key={n.id} className="btn" onClick={()=>setTab(n.id)} style={{padding:"11px 14px",background:"transparent",border:"none",borderBottom:`2px solid ${tab===n.id?C.accent:"transparent"}`,color:tab===n.id?C.accent:C.muted,fontSize:12,fontWeight:tab===n.id?700:500,whiteSpace:"nowrap"}}>{n.icon} {n.label}</button>))}
    </div>
    <div style={{maxWidth:980,margin:"0 auto",padding:"22px 18px"}}>
      {tab==="home"&&<HomeTab games={games} standings={standings} players={players} live={live}/>}
      {tab==="teams"&&<TeamsTab standings={standings} live={live}/>}
      {tab==="players"&&<PlayersTab players={players} live={live}/>}
      {tab==="pickem"&&<PickemTab games={games}/>}
      {tab==="bracket"&&<BracketTab/>}
    </div>
  </div>);
}