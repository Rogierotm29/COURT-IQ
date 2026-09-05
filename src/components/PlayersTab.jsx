import { useState } from "react";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { C } from "../theme";
import { Card, ST } from "./ui";
import { LiveBadge } from "./feedback";
import { tm, logo } from "./TeamLogo";


export const PlayersTab=({players,live})=>{
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