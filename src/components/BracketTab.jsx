import { useState, useEffect } from "react";
import { T } from "../theme";
import { Card, ST, Tag } from "./ui";
import { tm, logo } from "./TeamLogo";
import { pickemAPI } from "../api/pickem";
import { getSeason } from "../utils/season";

/* ═══ BRACKET TAB ═══ */
export const SERIES_OPTS=["4-0","4-1","4-2","4-3"];
export const MVP_CANDIDATES=[
  {name:"Shai Gilgeous-Alexander",team:"OKC"},{name:"Luka Dončić",team:"LAL"},{name:"Jaylen Brown",team:"BOS"},
  {name:"Cade Cunningham",team:"DET"},{name:"Donovan Mitchell",team:"CLE"},{name:"Nikola Jokić",team:"DEN"},
  {name:"Victor Wembanyama",team:"SAS"},{name:"Giannis Antetokounmpo",team:"MIL"},{name:"Anthony Edwards",team:"MIN"},
  {name:"Jayson Tatum",team:"BOS"},{name:"Jalen Brunson",team:"NYK"},{name:"Stephen Curry",team:"GSW"},
  {name:"Kevin Durant",team:"HOU"},{name:"Kawhi Leonard",team:"LAC"},{name:"Tyrese Maxey",team:"PHI"},
  {name:"Scottie Barnes",team:"TOR"},{name:"Devin Booker",team:"PHX"},{name:"Paolo Banchero",team:"ORL"},
];

/* Los playoffs sólo se desbloquean si la temporada regular terminó
   Y estamos dentro de la ventana de playoffs (abril–junio).
   Fuera de esa ventana los standings son de una temporada pasada. */
function getBracketPhase(maxGP){
  const month=new Date().getMonth(); // 0 = enero
  const inPlayoffWindow=month>=3&&month<=5; // abr, may, jun
  if(maxGP>=82&&inPlayoffWindow) return "open";
  if(maxGP>=82) return "offseason";
  return "regular";
}

export const BracketTab=({userCtx,standings})=>{
  const {user}=userCtx;
  const [picks,setPicks]=useState({});
  const [games,setGames]=useState({});
  const [mvp,setMvp]=useState(null);
  const [mvpSearch,setMvpSearch]=useState("");
  const [lb,setLb]=useState([]);
  const [subTab,setSubTab]=useState("bracket");
  const [lastSaved,setLastSaved]=useState("");

  const east=standings.filter(t=>t.conf==="E").sort((a,b)=>b.pct-a.pct);
  const west=standings.filter(t=>t.conf==="W").sort((a,b)=>b.pct-a.pct);
  const SEEDS_E=east.slice(0,10).map((t,i)=>({seed:i+1,s:t.abbr}));
  const SEEDS_W=west.slice(0,10).map((t,i)=>({seed:i+1,s:t.abbr}));
  const maxGP=standings.length?Math.max(...standings.map(t=>t.w+t.l)):0;
  const phase=getBracketPhase(maxGP);

  useEffect(()=>{
    if(!user) return;
    pickemAPI("myBracketPicks",{params:{userId:user.id}}).then(d=>{
      if(d.ok){
        const map={},gm={};
        (d.picks||[]).forEach(p=>{map[p.matchup_id]=p.predicted_winner;gm[p.matchup_id]=p.predicted_games;});
        setPicks(map);setGames(gm);
      }
    });
    pickemAPI("myMvpPick",{params:{userId:user.id}}).then(d=>{if(d.ok&&d.pick)setMvp(d.pick);});
    pickemAPI("bracketLeaderboard").then(d=>{if(d.ok)setLb(d.leaderboard||[]);});
  },[user]);

  const label={fontSize:T.font.xs,color:T.text.tertiary,textTransform:"uppercase",letterSpacing:1.2,fontWeight:600};

  if(!user) return(<div className="fade-up">
    <ST sub="Playoffs">Bracket Challenge</ST>
    <Card style={{textAlign:"center",padding:T.space[7]}}>
      <div style={{fontSize:T.font.base,fontWeight:600,color:T.text.primary,marginBottom:T.space[2]}}>Inicia sesión primero</div>
      <div style={{fontSize:T.font.sm,color:T.text.tertiary}}>Ve a Grupos para crear tu perfil y regresa aquí</div>
    </Card>
  </div>);

  if(SEEDS_E.length<10||SEEDS_W.length<10) return(<div className="fade-up">
    <ST sub="Playoffs">Bracket Challenge</ST>
    <Card style={{textAlign:"center",padding:T.space[7]}}>
      <div style={{fontSize:T.font.sm,color:T.text.tertiary}}>Datos de clasificación incompletos. Intenta recargar.</div>
    </Card>
  </div>);

  const savePick=async(matchupId,round,teamA,teamB,winner,numGames)=>{
    if(phase!=="open") return;
    setPicks(p=>({...p,[matchupId]:winner}));
    setGames(g=>({...g,[matchupId]:numGames||4}));
    await pickemAPI("bracketPick",{body:{userId:user.id,matchupId,round,teamA,teamB,predictedWinner:winner,predictedGames:numGames||4}});
    setLastSaved(matchupId);
    setTimeout(()=>setLastSaved(""),1400);
  };

  const saveMvp=async(playerName,playerTeam)=>{
    if(phase!=="open") return;
    setMvp({player_name:playerName,player_team:playerTeam});
    await pickemAPI("mvpPick",{body:{userId:user.id,playerName,playerTeam}});
  };

  const getTeam=abbr=>[...SEEDS_E,...SEEDS_W].find(t=>t.s===abbr)||{s:abbr,seed:"?"};

  const Matchup=({id,round,t1,t2,label:lb2})=>{
    const picked=picks[id];
    const numGames=games[id]||4;
    const saved=lastSaved===id;
    if(!t1||!t2) return(
      <div style={{marginBottom:T.space[3],padding:T.space[3],background:T.surface[2],borderRadius:T.radius.base,border:`1px solid ${T.border.subtle}`,opacity:.5}}>
        <div style={{...label,marginBottom:T.space[2]}}>{lb2||"Por definir"}</div>
        <div style={{textAlign:"center",padding:T.space[2],color:T.text.tertiary,fontSize:T.font.xs}}>Elige las series anteriores primero</div>
      </div>
    );
    return(
      <div style={{marginBottom:T.space[3],padding:T.space[3],background:T.surface[2],borderRadius:T.radius.base,border:`1px solid ${saved?T.success.border:picked?T.accent.border:T.border.subtle}`,transition:"border-color .3s"}}>
        <div style={{...label,marginBottom:T.space[2],display:"flex",justifyContent:"space-between",gap:T.space[2]}}>
          <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{lb2||round}</span>
          {saved&&<span style={{color:T.success.base}}>Guardado</span>}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:T.space[2],marginBottom:picked?T.space[3]:0}}>
          {[t1,t2].map(t=>{
            const sel=picked===t;
            return <button key={t} className="btn" onClick={()=>savePick(id,round,t1,t2,t,numGames)} style={{
              padding:`${T.space[3]}px ${T.space[1]}px`, borderRadius:T.radius.sm,
              display:"flex", flexDirection:"column", alignItems:"center", gap:T.space[1],
              background:sel?T.accent.subtle:T.surface[1],
              border:`1px solid ${sel?T.accent.base:T.border.subtle}`,
              color:T.text.primary, width:"100%",
            }}>
              {logo(t,26)}
              <span style={{fontSize:T.font.sm,fontWeight:700}}>{t}</span>
              <span style={{fontSize:T.font.xs,color:T.text.tertiary}}>({getTeam(t).seed}) {tm(t).name}</span>
            </button>;
          })}
        </div>
        {picked&&<div>
          <div style={{fontSize:T.font.xs,color:T.text.tertiary,marginBottom:T.space[1]}}>Score de la serie</div>
          <div style={{display:"flex",gap:T.space[1]}}>
            {SERIES_OPTS.map(opt=>{
              const gv=opt.split("-").reduce((a,n)=>a+parseInt(n),0);
              const isSel=numGames===gv;
              return <button key={opt} className="btn" onClick={()=>savePick(id,round,t1,t2,picked,gv)} style={{
                flex:1, padding:`${T.space[1]}px 0`, borderRadius:T.radius.sm, fontSize:T.font.xs,
                fontWeight:600, background:isSel?T.accent.subtle:T.surface[1],
                border:`1px solid ${isSel?T.accent.base:T.border.subtle}`,
                color:isSel?T.accent.base:T.text.tertiary,
              }}>{opt}</button>;
            })}
          </div>
        </div>}
      </div>
    );
  };

  const PlayInMatchup=({id,round,t1,t2,label:lb2})=>{
    const picked=picks[id];
    if(!t1||!t2) return null;
    return(
      <div style={{marginBottom:T.space[2],padding:T.space[3],background:T.surface[2],borderRadius:T.radius.base,border:`1px solid ${picked?T.accent.border:T.border.subtle}`}}>
        <div style={{...label,marginBottom:T.space[2]}}>{lb2}</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:T.space[2]}}>
          {[t1,t2].map(t=>{
            const sel=picked===t;
            return <button key={t} className="btn" onClick={()=>savePick(id,round,t1,t2,t,1)} style={{
              padding:T.space[2], borderRadius:T.radius.sm, display:"flex", alignItems:"center",
              gap:T.space[2], justifyContent:"center",
              background:sel?T.accent.subtle:T.surface[1],
              border:`1px solid ${sel?T.accent.base:T.border.subtle}`,
              color:T.text.primary,
            }}>{logo(t,20)}<span style={{fontSize:T.font.sm,fontWeight:600}}>{t}</span></button>;
          })}
        </div>
      </div>
    );
  };

  const piE78=picks["pi-e-78"],piE910=picks["pi-e-910"],piEfinal=picks["pi-e-final"];
  const piW78=picks["pi-w-78"],piW910=picks["pi-w-910"],piWfinal=picks["pi-w-final"];
  const e7=piE78||null,e8=piEfinal||null,w7=piW78||null,w8=piWfinal||null;

  const r1eW=[[SEEDS_E[0].s,e8],[SEEDS_E[3].s,SEEDS_E[4].s],[SEEDS_E[1].s,e7],[SEEDS_E[2].s,SEEDS_E[5].s]];
  const r1wW=[[SEEDS_W[0].s,w8],[SEEDS_W[3].s,SEEDS_W[4].s],[SEEDS_W[1].s,w7],[SEEDS_W[2].s,SEEDS_W[5].s]];

  const sf_e1=picks["r1-e-0"],sf_e2=picks["r1-e-1"],sf_e3=picks["r1-e-2"],sf_e4=picks["r1-e-3"];
  const sf_w1=picks["r1-w-0"],sf_w2=picks["r1-w-1"],sf_w3=picks["r1-w-2"],sf_w4=picks["r1-w-3"];
  const cf_e1=picks["sf-e-0"],cf_e2=picks["sf-e-1"],cf_w1=picks["sf-w-0"],cf_w2=picks["sf-w-1"];
  const fin_e=picks["cf-e"],fin_w=picks["cf-w"],champion=picks["finals"];

  const totalPicks=Object.keys(picks).length;

  return(<div className="fade-up">
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:T.space[4]}}>
      <div>
        <div style={label}>Playoffs</div>
        <div style={{fontSize:T.font.xl,fontWeight:700,color:T.text.primary,letterSpacing:-0.4}}>Bracket Challenge</div>
      </div>
      {phase==="open"&&<div style={{textAlign:"right"}}>
        <div style={{fontSize:T.font.xs,color:T.text.tertiary}}>Predicciones</div>
        <div style={{fontSize:T.font.xl,fontWeight:700,color:T.text.primary}}>{totalPicks}</div>
      </div>}
    </div>

    {/* Temporada en curso */}
    {phase==="regular"&&<Card style={{textAlign:"center",padding:T.space[7]}}>
      <div style={{fontSize:T.font.lg,fontWeight:600,color:T.text.primary,marginBottom:T.space[2]}}>Temporada en curso</div>
      <div style={{fontSize:T.font.sm,color:T.text.secondary,marginBottom:T.space[5],lineHeight:1.5}}>
        El bracket se desbloquea cuando termine la temporada regular.
      </div>
      <div style={{fontSize:T.font["2xl"],fontWeight:700,color:T.text.primary,letterSpacing:-1}}>{maxGP} / 82</div>
      <div style={{fontSize:T.font.xs,color:T.text.tertiary,marginTop:T.space[1]}}>partidos jugados por el equipo líder</div>
      <div style={{marginTop:T.space[5],height:4,background:T.surface[3],borderRadius:2,overflow:"hidden"}}>
        <div style={{width:`${Math.min(100,maxGP/82*100)}%`,height:"100%",background:T.accent.base,transition:"width .6s ease"}}/>
      </div>
    </Card>}

    {/* Entre temporadas — B13 */}
    {phase==="offseason"&&<Card style={{textAlign:"center",padding:T.space[7]}}>
      <div style={{fontSize:T.font.lg,fontWeight:600,color:T.text.primary,marginBottom:T.space[2]}}>Playoffs cerrados</div>
      <div style={{fontSize:T.font.sm,color:T.text.secondary,lineHeight:1.6,maxWidth:420,margin:"0 auto"}}>
        La temporada {getSeason()} ya terminó y la siguiente aún no empieza.
        El bracket se reabrirá cuando arranquen los playoffs.
      </div>
      {totalPicks>0&&<div style={{marginTop:T.space[5],fontSize:T.font.sm,color:T.text.tertiary}}>
        Tienes {totalPicks} predicciones guardadas de la temporada anterior.
      </div>}
    </Card>}

    {phase==="open"&&<>
      <div style={{display:"flex",marginBottom:T.space[4],borderBottom:`1px solid ${T.border.subtle}`}}>
        {[["bracket","Mi bracket"],["mvp","MVP"],["ranking","Ranking"]].map(([id,l])=>
          <button key={id} className="btn" onClick={()=>setSubTab(id)} style={{
            padding:`${T.space[2]}px ${T.space[4]}px`, background:"transparent",
            borderBottom:subTab===id?`2px solid ${T.accent.base}`:"2px solid transparent",
            color:subTab===id?T.text.primary:T.text.tertiary, fontSize:T.font.sm, fontWeight:600,
          }}>{l}</button>)}
      </div>

      {subTab==="bracket"&&<>
        <Card style={{marginBottom:T.space[4]}}>
          <div style={{...label,marginBottom:T.space[3]}}>Play-In</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:T.space[4]}}>
            {[["Este",SEEDS_E,"e",piE78,piE910],["Oeste",SEEDS_W,"w",piW78,piW910]].map(([conf,S,k,p78,p910])=>
              <div key={k}>
                <div style={{fontSize:T.font.xs,color:T.text.secondary,fontWeight:600,marginBottom:T.space[2]}}>{conf}</div>
                <PlayInMatchup id={`pi-${k}-78`} round="playin" t1={S[6].s} t2={S[7].s} label="7 vs 8 — el ganador es #7"/>
                <PlayInMatchup id={`pi-${k}-910`} round="playin" t1={S[8].s} t2={S[9].s} label="9 vs 10 — el perdedor queda eliminado"/>
                {p78&&p910&&<PlayInMatchup id={`pi-${k}-final`} round="playin"
                  t1={p78===S[6].s?S[7].s:S[6].s} t2={p910} label="Por el puesto #8"/>}
              </div>)}
          </div>
        </Card>

        <Card style={{marginBottom:T.space[4]}}>
          <div style={{...label,marginBottom:T.space[3]}}>Primera ronda</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:T.space[4]}}>
            {[["Este",r1eW,"e"],["Oeste",r1wW,"w"]].map(([conf,rows,k])=>
              <div key={k}>
                <div style={{fontSize:T.font.xs,color:T.text.secondary,fontWeight:600,marginBottom:T.space[2]}}>{conf}</div>
                {rows.map(([a,b],i)=><Matchup key={`r1-${k}-${i}`} id={`r1-${k}-${i}`} round="r1" t1={a} t2={b}
                  label={`(${getTeam(a).seed}) ${a} vs (${b?getTeam(b).seed:"?"}) ${b||"TBD"}`}/>)}
              </div>)}
          </div>
        </Card>

        <Card style={{marginBottom:T.space[4]}}>
          <div style={{...label,marginBottom:T.space[3]}}>Semifinales de conferencia</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:T.space[4]}}>
            <div>
              <div style={{fontSize:T.font.xs,color:T.text.secondary,fontWeight:600,marginBottom:T.space[2]}}>Este</div>
              <Matchup id="sf-e-0" round="semis" t1={sf_e1} t2={sf_e2} label={`${sf_e1||"?"} vs ${sf_e2||"?"}`}/>
              <Matchup id="sf-e-1" round="semis" t1={sf_e3} t2={sf_e4} label={`${sf_e3||"?"} vs ${sf_e4||"?"}`}/>
            </div>
            <div>
              <div style={{fontSize:T.font.xs,color:T.text.secondary,fontWeight:600,marginBottom:T.space[2]}}>Oeste</div>
              <Matchup id="sf-w-0" round="semis" t1={sf_w1} t2={sf_w2} label={`${sf_w1||"?"} vs ${sf_w2||"?"}`}/>
              <Matchup id="sf-w-1" round="semis" t1={sf_w3} t2={sf_w4} label={`${sf_w3||"?"} vs ${sf_w4||"?"}`}/>
            </div>
          </div>
        </Card>

        <Card style={{marginBottom:T.space[4]}}>
          <div style={{...label,marginBottom:T.space[3]}}>Finales de conferencia</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))",gap:T.space[4]}}>
            <div>
              <div style={{fontSize:T.font.xs,color:T.text.secondary,fontWeight:600,marginBottom:T.space[2]}}>Final del Este</div>
              <Matchup id="cf-e" round="conf_finals" t1={cf_e1} t2={cf_e2} label={`${cf_e1||"?"} vs ${cf_e2||"?"}`}/>
            </div>
            <div>
              <div style={{fontSize:T.font.xs,color:T.text.secondary,fontWeight:600,marginBottom:T.space[2]}}>Final del Oeste</div>
              <Matchup id="cf-w" round="conf_finals" t1={cf_w1} t2={cf_w2} label={`${cf_w1||"?"} vs ${cf_w2||"?"}`}/>
            </div>
          </div>
        </Card>

        <Card style={{marginBottom:T.space[4],borderColor:champion?T.accent.border:T.border.subtle}}>
          <div style={{...label,marginBottom:T.space[3],textAlign:"center"}}>NBA Finals</div>
          <Matchup id="finals" round="finals" t1={fin_e} t2={fin_w} label={`${fin_e||"Campeón del Este"} vs ${fin_w||"Campeón del Oeste"}`}/>
          {champion&&<div style={{textAlign:"center",marginTop:T.space[3],paddingTop:T.space[4],borderTop:`1px solid ${T.border.subtle}`}}>
            <div style={{...label,marginBottom:T.space[2]}}>Tu campeón</div>
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",gap:T.space[3]}}>
              {logo(champion,40)}
              <div>
                <div style={{fontSize:T.font["2xl"],fontWeight:700,color:T.text.primary,letterSpacing:-0.8,lineHeight:1.1}}>{champion}</div>
                <div style={{fontSize:T.font.sm,color:T.text.tertiary}}>{tm(champion).name}</div>
              </div>
            </div>
          </div>}
        </Card>

        <Card>
          <div style={{...label,marginBottom:T.space[3]}}>Puntos del bracket</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(120px,1fr))",gap:T.space[2]}}>
            {[["Ganador de serie","10 pts"],["Score exacto","+5"],["Campeón","+15"],["MVP","15 pts"]].map(([l,v])=>
              <div key={l} style={{background:T.surface[2],borderRadius:T.radius.sm,padding:T.space[3],textAlign:"center"}}>
                <div style={{fontSize:T.font.xs,color:T.text.tertiary,marginBottom:T.space[1]}}>{l}</div>
                <div style={{fontSize:T.font.base,fontWeight:700,color:T.text.primary}}>{v}</div>
              </div>)}
          </div>
        </Card>
      </>}

      {subTab==="mvp"&&<Card>
        <div style={{...label,marginBottom:T.space[4]}}>MVP de las Finales</div>
        {mvp&&<div style={{marginBottom:T.space[4],padding:T.space[4],background:T.surface[2],borderRadius:T.radius.base,border:`1px solid ${T.accent.border}`,display:"flex",alignItems:"center",gap:T.space[3]}}>
          {logo(mvp.player_team,32)}
          <div>
            <div style={{fontSize:T.font.xs,color:T.text.tertiary}}>Tu predicción</div>
            <div style={{fontSize:T.font.lg,fontWeight:700,color:T.text.primary}}>{mvp.player_name}</div>
            <div style={{fontSize:T.font.xs,color:T.text.tertiary}}>{tm(mvp.player_team).name}</div>
          </div>
        </div>}
        <input value={mvpSearch} onChange={e=>setMvpSearch(e.target.value)} placeholder="Buscar jugador" style={{
          width:"100%", background:T.surface[2], border:`1px solid ${mvpSearch?T.accent.border:T.border.base}`,
          borderRadius:T.radius.base, padding:`${T.space[3]}px ${T.space[4]}px`,
          color:T.text.primary, fontSize:T.font.sm, marginBottom:T.space[3], boxSizing:"border-box",
        }}/>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:T.space[2]}}>
          {MVP_CANDIDATES.filter(p=>!mvpSearch||p.name.toLowerCase().includes(mvpSearch.toLowerCase())||p.team.toLowerCase().includes(mvpSearch.toLowerCase())||tm(p.team).name?.toLowerCase().includes(mvpSearch.toLowerCase())).map(p=>{
            const sel=mvp?.player_name===p.name;
            return <button key={p.name} className="btn" onClick={()=>saveMvp(p.name,p.team)} style={{
              padding:T.space[3], borderRadius:T.radius.base, display:"flex", alignItems:"center", gap:T.space[2],
              background:sel?T.accent.subtle:T.surface[2],
              border:`1px solid ${sel?T.accent.base:T.border.subtle}`,
              color:T.text.primary, textAlign:"left",
            }}>
              {logo(p.team,22)}
              <div style={{minWidth:0}}>
                <div style={{fontSize:T.font.sm,fontWeight:600,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</div>
                <div style={{fontSize:T.font.xs,color:T.text.tertiary}}>{tm(p.team).name}</div>
              </div>
            </button>;
          })}
        </div>
      </Card>}

      {subTab==="ranking"&&<Card>
        <div style={{...label,marginBottom:T.space[4]}}>Ranking global de brackets</div>
        {lb.length===0?<div style={{textAlign:"center",padding:T.space[6],color:T.text.tertiary,fontSize:T.font.sm}}>Aún no hay predicciones calificadas</div>
        :lb.map((r,i)=>{
          const isMe=r.user_id===user.id;
          return <div key={r.user_id} style={{display:"flex",alignItems:"center",gap:T.space[3],padding:`${T.space[3]}px ${T.space[2]}px`,borderRadius:T.radius.sm,background:isMe?T.accent.subtle:"transparent",borderBottom:`1px solid ${T.border.subtle}`}}>
            <div style={{width:24,textAlign:"center",fontSize:T.font.sm,fontWeight:700,color:i===0?T.accent.base:T.text.tertiary,flexShrink:0}}>{i+1}</div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{fontSize:T.font.sm,fontWeight:600,color:T.text.primary}}>{r.name}{isMe?" (tú)":""}</div>
              <div style={{fontSize:T.font.xs,color:T.text.tertiary}}>{r.correct_winners} series correctas · MVP: {r.mvp_pick||"sin elegir"}</div>
            </div>
            <div style={{fontSize:T.font.lg,fontWeight:700,color:T.text.primary,flexShrink:0}}>{r.total_points}</div>
          </div>;
        })}
      </Card>}
    </>}
  </div>);
};