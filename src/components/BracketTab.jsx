import { useState, useEffect } from "react";
import { C } from "../theme";
import { Card, ST } from "./ui";
import { tm, logo } from "./TeamLogo";
import { pickemAPI } from "../api/pickem";


/* ═══ BRACKET TAB ═══ */
/* ═══ BRACKET TAB v2 (full playoff predictions) ═══ */

export const SERIES_OPTS=["4-0","4-1","4-2","4-3"];
export const MVP_CANDIDATES=[
  {name:"Shai Gilgeous-Alexander",team:"OKC"},{name:"Luka Dončić",team:"LAL"},{name:"Jaylen Brown",team:"BOS"},
  {name:"Cade Cunningham",team:"DET"},{name:"Donovan Mitchell",team:"CLE"},{name:"Nikola Jokić",team:"DEN"},
  {name:"Victor Wembanyama",team:"SAS"},{name:"Giannis Antetokounmpo",team:"MIL"},{name:"Anthony Edwards",team:"MIN"},
  {name:"Jayson Tatum",team:"BOS"},{name:"Jalen Brunson",team:"NYK"},{name:"Stephen Curry",team:"GSW"},
  {name:"Kevin Durant",team:"HOU"},{name:"Kawhi Leonard",team:"LAC"},{name:"Tyrese Maxey",team:"PHI"},
  {name:"Scottie Barnes",team:"TOR"},{name:"Devin Booker",team:"PHX"},{name:"Paolo Banchero",team:"ORL"},
];

export const BracketTab=({userCtx,standings})=>{
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

 if(SEEDS_E.length<10||SEEDS_W.length<10) return(
    <div className="fade-up">
      <Card style={{textAlign:"center",padding:30,color:C.dim}}>
        Datos de clasificación incompletos. Intenta recargar.
      </Card>
    </div>
    );

  const savePick=async(matchupId,round,teamA,teamB,winner,numGames)=>{
    if(!user) return;
    setPicks(p=>({...p,[matchupId]:winner}));
    setGames(g=>({...g,[matchupId]:numGames||4}));
    await pickemAPI("bracketPick",{body:{userId:user.id,matchupId,round,teamA,teamB,predictedWinner:winner,predictedGames:numGames||4}});
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