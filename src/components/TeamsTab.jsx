import { useState, useEffect } from "react";
import { T } from "../theme";
import { ESPN_ID } from "../data/teams";
import { Card, ST, Spin, Tag } from "./ui";
import { LiveBadge } from "./feedback";
import { logo } from "./TeamLogo";
import { getSeason } from "../utils/season";

/* ═══ TEAMS TAB ═══ */
export const TeamsTab=({standings,live})=>{
  const [sel,setSel]=useState(null);
  const [liveRoster,setLiveRoster]=useState(null);
  const [rosterLoading,setRosterLoading]=useState(false);

  const east=standings.filter(t=>t.conf==="E").sort((a,b)=>b.pct-a.pct);
  const west=standings.filter(t=>t.conf==="W").sort((a,b)=>b.pct-a.pct);

  const loadLiveRoster=async(abbr)=>{
    const id=ESPN_ID[abbr];
    if(!id){setLiveRoster(null);return;}
    setRosterLoading(true);setLiveRoster(null);
    try{
      const r=await fetch(`https://site.api.espn.com/apis/site/v2/sports/basketball/nba/teams/${id}/roster`,{signal:AbortSignal.timeout(5000)});
      if(!r.ok) throw new Error(`ESPN ${r.status}`);
      const d=await r.json();
      const players=(d.athletes||[]).flatMap(g=>g.items||[g]).map(a=>`${a.firstName} ${a.lastName}`).filter(Boolean);
      if(players.length>0) setLiveRoster(players);
    }catch(e){
      console.warn("No se pudo cargar el roster de",abbr,e.message);
    }
    setRosterLoading(false);
  };

  const toggleTeam=(t)=>{
    if(sel?.id===t.id){setSel(null);setLiveRoster(null);return;}
    setSel(t);
    loadLiveRoster(t.abbr);
  };

  const statLabel={fontSize:T.font.xs,color:T.text.tertiary};

  const Row=({t,i,isLast})=>{
    const open=sel?.id===t.id;
    const roster=open?(liveRoster||t.players||[]):[];
    // 1-6 playoffs directo · 7-10 play-in
    const seedColor=i<6?T.accent.base:i<10?T.text.secondary:T.text.tertiary;
    return <div>
      <div
        onClick={()=>toggleTeam(t)}
        role="button"
        tabIndex={0}
        onKeyDown={e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();toggleTeam(t);}}}
        style={{
          display:"flex", alignItems:"center", gap:T.space[3],
          padding:`${T.space[3]}px ${T.space[2]}px`, cursor:"pointer",
          background:open?T.surface[2]:"transparent",
          borderRadius:open?`${T.radius.sm}px ${T.radius.sm}px 0 0`:T.radius.sm,
          borderBottom:isLast&&!open?"none":`1px solid ${T.border.subtle}`,
        }}
      >
        <span style={{fontSize:T.font.xs,width:18,color:seedColor,fontWeight:600,flexShrink:0}}>{i+1}</span>
        {logo(t.abbr,22)}
        <span style={{flex:1,fontSize:T.font.sm,fontWeight:600,color:T.text.primary,minWidth:0,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{t.name}</span>
        <span style={{fontSize:T.font.sm,color:T.text.secondary,width:52,textAlign:"right",flexShrink:0}}>{t.w}–{t.l}</span>
        <span style={{fontSize:T.font.xs,color:T.text.tertiary,width:44,textAlign:"right",flexShrink:0}}>{(t.pct*100).toFixed(0)}%</span>
        <span style={{width:36,textAlign:"right",flexShrink:0}}>
          <Tag c={t.streak?.startsWith("W")?T.success.base:T.danger.base}>{t.streak}</Tag>
        </span>
      </div>

      {open&&<div style={{background:T.surface[2],borderRadius:`0 0 ${T.radius.sm}px ${T.radius.sm}px`,padding:T.space[4],marginBottom:T.space[2],borderBottom:`1px solid ${T.border.subtle}`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:T.space[3]}}>
          <div style={{fontSize:T.font.xs,color:T.text.tertiary,textTransform:"uppercase",letterSpacing:1.2,fontWeight:600}}>Roster {getSeason()}</div>
          {rosterLoading?<Spin s={12}/>:<span style={{fontSize:T.font.xs,color:T.text.tertiary}}>{liveRoster?"En vivo":"Caché"}</span>}
        </div>
        {rosterLoading
          ?<div style={{padding:`${T.space[3]}px 0`,color:T.text.tertiary,fontSize:T.font.sm}}>Cargando roster…</div>
          :roster.length===0
            ?<div style={{padding:`${T.space[3]}px 0`,color:T.text.tertiary,fontSize:T.font.sm}}>Roster no disponible</div>
            :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:`${T.space[1]}px ${T.space[4]}px`}}>
              {roster.map((p,idx)=><div key={p} style={{display:"flex",alignItems:"center",gap:T.space[2],padding:`${T.space[1]}px 0`}}>
                <span style={{fontSize:T.font.xs,color:T.text.disabled,width:18,flexShrink:0}}>{idx+1}</span>
                <span style={{fontSize:T.font.sm,color:T.text.secondary}}>{p}</span>
              </div>)}
            </div>}
      </div>}
    </div>;
  };

  return(<div className="fade-up">
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:T.space[4]}}>
      <ST sub={`NBA ${getSeason()}`} style={{marginBottom:0}}>Standings</ST>
      <LiveBadge live={live.standings}/>
    </div>

    <div style={{fontSize:T.font.sm,color:T.text.tertiary,marginBottom:T.space[4]}}>
      Toca un equipo para ver su roster.
    </div>

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:T.space[4]}}>
      {[["Conferencia Este",east],["Conferencia Oeste",west]].map(([label,teams])=>
        <Card key={label} style={{padding:T.space[4]}}>
          <div style={{fontSize:T.font.xs,color:T.text.tertiary,textTransform:"uppercase",letterSpacing:1.2,fontWeight:600,marginBottom:T.space[3]}}>{label}</div>

          {/* Encabezado de columnas */}
          <div style={{display:"flex",alignItems:"center",gap:T.space[3],padding:`0 ${T.space[2]}px ${T.space[2]}px`,borderBottom:`1px solid ${T.border.base}`,...statLabel}}>
            <span style={{width:18,flexShrink:0}}>#</span>
            <span style={{width:22,flexShrink:0}}/>
            <span style={{flex:1}}>Equipo</span>
            <span style={{width:52,textAlign:"right",flexShrink:0}}>V–D</span>
            <span style={{width:44,textAlign:"right",flexShrink:0}}>PCT</span>
            <span style={{width:36,textAlign:"right",flexShrink:0}}>Racha</span>
          </div>

          {teams.map((t,i)=><Row key={t.id} t={t} i={i} isLast={i===teams.length-1}/>)}
        </Card>
      )}
    </div>
  </div>);
};