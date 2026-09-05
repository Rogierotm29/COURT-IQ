import { useState, useEffect } from "react";
import { C } from "../theme";
import { ESPN_ID } from "../data/teams";
import { Card, ST, Spin, Tag } from "./ui";
import { LiveBadge } from "./feedback";
import { logo } from "./TeamLogo";


/* ═══ TEAMS TAB ═══ */
export const TeamsTab=({standings,live})=>{
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