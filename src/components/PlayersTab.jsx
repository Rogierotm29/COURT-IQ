import { useState } from "react";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { T } from "../theme";
import { Card, ST } from "./ui";
import { LiveBadge } from "./feedback";
import { tm, logo } from "./TeamLogo";
import { getSeason } from "../utils/season";

const PER_PAGE = 25;

export const PlayersTab=({players,live})=>{
  const [sel,setSel]=useState(null);
  const [search,setSearch]=useState("");
  const [teamF,setTeamF]=useState("ALL");
  const [page,setPage]=useState(0);
  const [sortBy,setSortBy]=useState("pts");

  const filtered=players
    .filter(p=>{
      const q=search.trim().toLowerCase();
            const matchQ=!q
        ||p.name?.toLowerCase().includes(q)
        ||p.teamAbbr?.toLowerCase().includes(q)
        ||tm(p.teamAbbr).name?.toLowerCase().includes(q);
      return matchQ&&(teamF==="ALL"||p.teamAbbr===teamF);
    })
    .sort((a,b)=>(b[sortBy]??0)-(a[sortBy]??0));

  const pageCount=Math.max(1,Math.ceil(filtered.length/PER_PAGE));
  const safePage=Math.min(page,pageCount-1);
  const paged=filtered.slice(safePage*PER_PAGE,(safePage+1)*PER_PAGE);
  const teams=[...new Set(players.map(p=>p.teamAbbr).filter(Boolean))].sort();

  const reset=()=>{setPage(0);setSel(null);};

  const radarFor=p=>[
    {s:"PTS",v:Math.min(99,Math.round(+p.pts/38*95))},
    {s:"AST",v:Math.min(99,Math.round(+(p.ast||0)/12*95))},
    {s:"REB",v:Math.min(99,Math.round(+(p.reb||0)/15*95))},
    {s:"BLK",v:Math.min(99,Math.round(+(p.blk||0)/4*95))},
    {s:"STL",v:Math.min(99,Math.round(+(p.stl||0)/3*95))},
    {s:"FG%",v:Math.min(99,Math.round(+(p.fgPct||45)/62*95))},
  ];

  const COLS=[
    {key:"pts",label:"PTS"},
    {key:"ast",label:"AST"},
    {key:"reb",label:"REB"},
    {key:"fgPct",label:"FG%",suffix:"%"},
  ];

  const th={padding:`${T.space[2]}px ${T.space[2]}px`,color:T.text.tertiary,fontSize:T.font.xs,fontWeight:600,textTransform:"uppercase",letterSpacing:1,textAlign:"right",whiteSpace:"nowrap"};
  const td={padding:`${T.space[3]}px ${T.space[2]}px`,fontSize:T.font.sm,textAlign:"right",color:T.text.secondary};

  return(<div className="fade-up">
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:T.space[4]}}>
      <ST sub={`NBA ${getSeason()}`} style={{marginBottom:0}}>Líderes de la liga</ST>
      <LiveBadge live={live.players}/>
    </div>

    {/* Búsqueda y filtros */}
    <div style={{marginBottom:T.space[4]}}>
      <div style={{position:"relative",marginBottom:T.space[3]}}>
        <input
          value={search}
          onChange={e=>{setSearch(e.target.value);reset();}}
          placeholder="Buscar por jugador o equipo (ej. Curry, Lakers, GSW)"
          style={{
            width:"100%", background:T.surface[2],
            border:`1px solid ${search?T.accent.border:T.border.base}`,
            borderRadius:T.radius.base, padding:`${T.space[3]}px ${T.space[4]}px`,
            paddingRight:search?T.space[7]:T.space[4],
            color:T.text.primary, fontSize:T.font.base, boxSizing:"border-box",
          }}
        />
        {search&&<button className="btn" onClick={()=>{setSearch("");reset();}} style={{position:"absolute",right:T.space[3],top:"50%",transform:"translateY(-50%)",background:"none",color:T.text.tertiary,fontSize:T.font.base,padding:0}}>×</button>}
      </div>
      <div style={{fontSize:T.font.xs,color:T.text.tertiary,marginTop:T.space[2]}}>
        Los {players.length} mejores anotadores de la temporada.
      </div>
    </div>

    {/* Tabla */}
    <Card style={{padding:T.space[3],overflowX:"auto",marginBottom:T.space[4]}}>
      {filtered.length===0
        ?<div style={{textAlign:"center",padding:T.space[6],color:T.text.tertiary,fontSize:T.font.sm}}>
          Ningún jugador coincide con la búsqueda
        </div>
        :<table style={{width:"100%",borderCollapse:"collapse",minWidth:440}}>
          <thead>
            <tr style={{borderBottom:`1px solid ${T.border.base}`}}>
              <th style={{...th,textAlign:"left",width:28}}>#</th>
              <th style={{...th,textAlign:"left"}}>Jugador</th>
              {COLS.map(c=>(
                <th key={c.key} style={{...th,cursor:"pointer",color:sortBy===c.key?T.accent.base:T.text.tertiary}}
                    onClick={()=>{setSortBy(c.key);reset();}}
                    title={`Ordenar por ${c.label}`}>
                  {c.label}{sortBy===c.key?" ↓":""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.map((p,i)=>{
              const open=sel?.id===p.id;
              return <>
                <tr key={p.id} onClick={()=>setSel(open?null:p)} style={{cursor:"pointer",borderBottom:`1px solid ${T.border.subtle}`,background:open?T.surface[2]:"transparent"}}>
                  <td style={{...td,textAlign:"left",color:T.text.disabled,fontSize:T.font.xs}}>{safePage*PER_PAGE+i+1}</td>
                  <td style={{...td,textAlign:"left"}}>
                    <div style={{display:"flex",alignItems:"center",gap:T.space[2]}}>
                      {logo(p.teamAbbr,20)}
                      <div style={{minWidth:0}}>
                        <div style={{fontSize:T.font.sm,fontWeight:600,color:T.text.primary,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</div>
                        <div style={{fontSize:T.font.xs,color:T.text.tertiary}}>{p.teamAbbr} · {p.pos}</div>
                      </div>
                    </div>
                  </td>
                  {COLS.map(c=>(
                    <td key={c.key} style={{...td,color:sortBy===c.key?T.text.primary:T.text.secondary,fontWeight:sortBy===c.key?700:400}}>
                      {p[c.key]??"—"}{c.suffix&&p[c.key]!=null?c.suffix:""}
                    </td>
                  ))}
                </tr>
                {open&&<tr key={`${p.id}-detail`}>
                  <td colSpan={2+COLS.length} style={{padding:0,background:T.surface[2],borderBottom:`1px solid ${T.border.subtle}`}}>
                    <div style={{padding:T.space[4]}}>
                      <div style={{display:"flex",gap:T.space[5],flexWrap:"wrap",marginBottom:T.space[4]}}>
                        {[["PTS",p.pts],["AST",p.ast],["REB",p.reb],["BLK",p.blk],["STL",p.stl],["FG%",p.fgPct],["3P%",p.fg3Pct]].map(([l,v])=>
                          <div key={l}>
                            <div style={{fontSize:T.font.xs,color:T.text.tertiary}}>{l}</div>
                            <div style={{fontSize:T.font.lg,fontWeight:700,color:T.text.primary}}>{v??"—"}</div>
                          </div>)}
                      </div>
                      <ResponsiveContainer width="100%" height={180}>
                        <RadarChart data={radarFor(p)}>
                          <PolarGrid stroke={T.border.base}/>
                          <PolarAngleAxis dataKey="s" tick={{fill:T.text.tertiary,fontSize:10}}/>
                          <PolarRadiusAxis domain={[0,100]} tick={false} axisLine={false}/>
                          <Radar dataKey="v" stroke={T.accent.base} fill={T.accent.base} fillOpacity={.18} strokeWidth={1.5}/>
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </td>
                </tr>}
              </>;
            })}
          </tbody>
        </table>}
    </Card>

    {/* Paginación */}
    {pageCount>1&&<div style={{display:"flex",justifyContent:"center",alignItems:"center",gap:T.space[3],marginBottom:T.space[4]}}>
      <button className="btn" disabled={safePage===0} onClick={()=>{setPage(p=>p-1);setSel(null);}} style={{
        padding:`${T.space[2]}px ${T.space[4]}px`, borderRadius:T.radius.base,
        background:T.surface[2], border:`1px solid ${T.border.base}`,
        color:safePage===0?T.text.disabled:T.text.secondary, fontSize:T.font.sm, fontWeight:600,
      }}>Anterior</button>
      <span style={{fontSize:T.font.sm,color:T.text.tertiary}}>{safePage+1} de {pageCount}</span>
      <button className="btn" disabled={safePage>=pageCount-1} onClick={()=>{setPage(p=>p+1);setSel(null);}} style={{
        padding:`${T.space[2]}px ${T.space[4]}px`, borderRadius:T.radius.base,
        background:T.surface[2], border:`1px solid ${T.border.base}`,
        color:safePage>=pageCount-1?T.text.disabled:T.text.secondary, fontSize:T.font.sm, fontWeight:600,
      }}>Siguiente</button>
    </div>}
  </div>);
};