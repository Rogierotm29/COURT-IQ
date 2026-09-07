import { useState, useEffect, useRef, Fragment } from "react";
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from "recharts";
import { T } from "../theme";
import { Card, ST, Spin } from "./ui";
import { LiveBadge } from "./feedback";
import { tm, logo } from "./TeamLogo";
import { getSeason } from "../utils/season";
import { pickemAPI } from "../api/pickem";

const PER_PAGE = 25;

export const PlayersTab=({players,live})=>{
  const [sel,setSel]=useState(null);
  const [search,setSearch]=useState("");
  const [teamF,setTeamF]=useState("ALL");
  const [page,setPage]=useState(0);
  const [sortBy,setSortBy]=useState("pts");
  // Estadísticas cargadas bajo demanda: playerId -> stats | "loading" | "error"
  const [loadedStats,setLoadedStats]=useState({});
  const inFlight=useRef(new Set());

  const q=search.trim().toLowerCase();
  const browsing=!!q||teamF!=="ALL";   // el usuario busca algo concreto

  /* Sin búsqueda ni filtro mostramos sólo a quienes ya tienen estadísticas
     (la vista de líderes de siempre). Al buscar o filtrar por equipo se
     abre la liga completa, incluidos los que aún no tienen números. */
  const filtered=players
    .filter(p=>{
      if(teamF!=="ALL"&&p.teamAbbr!==teamF) return false;
      if(q){
        const hit=p.name?.toLowerCase().includes(q)
          ||p.teamAbbr?.toLowerCase().includes(q)
          ||p.pos?.toLowerCase()===q
          ||tm(p.teamAbbr).name?.toLowerCase().includes(q);
        if(!hit) return false;
      }
      return browsing||p.hasStats;
    })
    .sort((a,b)=>{
      // Los que tienen estadísticas van primero; entre ellos, por la columna elegida
      if(a.hasStats!==b.hasStats) return a.hasStats?-1:1;
      return (b[sortBy]??-1)-(a[sortBy]??-1);
    });

  const pageCount=Math.max(1,Math.ceil(filtered.length/PER_PAGE));
  const safePage=Math.min(page,pageCount-1);
  const paged=filtered.slice(safePage*PER_PAGE,(safePage+1)*PER_PAGE);
  const teams=[...new Set(players.map(p=>p.teamAbbr).filter(Boolean))].sort();

  const reset=()=>{setPage(0);setSel(null);};

  /* Al abrir un jugador sin estadísticas, las pedimos sólo para él.
     Evita traer las ~450 de golpe: la mayoría nunca se consultan. */
  useEffect(()=>{
    if(!sel||sel.hasStats) return;
    const id=sel.id;
    if(!id||loadedStats[id]||inFlight.current.has(id)) return;

    inFlight.current.add(id);
    setLoadedStats(s=>({...s,[id]:"loading"}));

    fetch(`/api/playerstats?playerId=${encodeURIComponent(id)}`)
      .then(r=>r.json())
      .then(d=>{
        setLoadedStats(s=>({...s,[id]:d.ok?d.stats:"error"}));
      })
      .catch(e=>{
        console.warn("playerstats:",e.message);
        setLoadedStats(s=>({...s,[id]:"error"}));
      })
      .finally(()=>inFlight.current.delete(id));
  },[sel]);

  // Devuelve las estadísticas a mostrar: las que ya venían o las cargadas
  const statsOf=(p)=>{
    if(p.hasStats) return p;
    const l=loadedStats[p.id];
    return (l&&l!=="loading"&&l!=="error")?l:null;
  };

  const radarFor=s=>[
    {s:"PTS",v:Math.min(99,Math.round((+s.pts||0)/38*95))},
    {s:"AST",v:Math.min(99,Math.round((+s.ast||0)/12*95))},
    {s:"REB",v:Math.min(99,Math.round((+s.reb||0)/15*95))},
    {s:"BLK",v:Math.min(99,Math.round((+s.blk||0)/4*95))},
    {s:"STL",v:Math.min(99,Math.round((+s.stl||0)/3*95))},
    {s:"FG%",v:Math.min(99,Math.round((+s.fgPct||45)/62*95))},
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
      <ST sub={`NBA ${getSeason()}`} style={{marginBottom:0}}>
        {browsing?"Jugadores":"Líderes de la liga"}
      </ST>
      <LiveBadge live={live.players}/>
    </div>

    {/* Búsqueda */}
    <div style={{position:"relative",marginBottom:T.space[3]}}>
      <input
        value={search}
        onChange={e=>{setSearch(e.target.value);reset();}}
        placeholder="Buscar jugador, equipo o posición"
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

    {/* Filtro por equipo */}
    <div style={{display:"flex",gap:T.space[2],overflowX:"auto",paddingBottom:T.space[2],marginBottom:T.space[3]}}>
      <button className="btn" onClick={()=>{setTeamF("ALL");reset();}} style={{
        padding:`${T.space[2]}px ${T.space[4]}px`, borderRadius:T.radius.full,
        background:teamF==="ALL"?T.accent.subtle:T.surface[2],
        border:`1px solid ${teamF==="ALL"?T.accent.base:T.border.subtle}`,
        color:teamF==="ALL"?T.accent.base:T.text.tertiary,
        fontSize:T.font.xs, fontWeight:600, whiteSpace:"nowrap", flexShrink:0,
      }}>Todos</button>
      {teams.map(t=>(
        <button key={t} className="btn" onClick={()=>{setTeamF(teamF===t?"ALL":t);reset();}} style={{
          padding:`${T.space[2]}px ${T.space[3]}px`, borderRadius:T.radius.full,
          background:teamF===t?T.accent.subtle:T.surface[2],
          border:`1px solid ${teamF===t?T.accent.base:T.border.subtle}`,
          color:teamF===t?T.accent.base:T.text.tertiary,
          fontSize:T.font.xs, fontWeight:600, whiteSpace:"nowrap", flexShrink:0,
          display:"flex", alignItems:"center", gap:T.space[1],
        }}>{logo(t,14)}{t}</button>
      ))}
    </div>

    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:T.space[3],flexWrap:"wrap",fontSize:T.font.xs,color:T.text.tertiary,marginBottom:T.space[4]}}>
      <span>
        {browsing
          ?`${filtered.length} jugador${filtered.length!==1?"es":""}${teamF!=="ALL"?` · ${tm(teamF).name}`:""}`
          :"Top anotadores · busca o elige un equipo para ver la plantilla completa"}
      </span>
      {browsing&&<span style={{color:T.text.disabled}}>Toca un jugador para ver sus estadísticas</span>}
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
              const st=statsOf(p);
              const loading=loadedStats[p.id]==="loading";
              const failed=loadedStats[p.id]==="error";
              return <Fragment key={p.id}>
                <tr onClick={()=>setSel(open?null:p)} style={{cursor:"pointer",borderBottom:`1px solid ${T.border.subtle}`,background:open?T.surface[2]:"transparent"}}>
                  <td style={{...td,textAlign:"left",color:T.text.disabled,fontSize:T.font.xs}}>{safePage*PER_PAGE+i+1}</td>
                  <td style={{...td,textAlign:"left"}}>
                    <div style={{display:"flex",alignItems:"center",gap:T.space[2]}}>
                      {logo(p.teamAbbr,20)}
                      <div style={{minWidth:0}}>
                        <div style={{fontSize:T.font.sm,fontWeight:600,color:T.text.primary,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{p.name}</div>
                        <div style={{fontSize:T.font.xs,color:T.text.tertiary}}>
                          {p.teamAbbr}{p.pos?` · ${p.pos}`:""}{p.jersey?` · #${p.jersey}`:""}
                        </div>
                      </div>
                    </div>
                  </td>
                  {COLS.map((c,ci)=>(
                    <td key={c.key} style={{...td,color:sortBy===c.key?T.text.primary:T.text.secondary,fontWeight:sortBy===c.key?700:400}}>
                      {st?.[c.key]!=null
                        ? `${st[c.key]}${c.suffix||""}`
                        : (ci===0&&!open
                            ? <span style={{color:T.accent.base,fontSize:T.font.xs,fontWeight:600}}>Ver</span>
                            : "—")}
                    </td>
                  ))}
                </tr>

                {open&&<tr>
                  <td colSpan={2+COLS.length} style={{padding:0,background:T.surface[2],borderBottom:`1px solid ${T.border.subtle}`}}>
                    <div style={{padding:T.space[4]}}>

                      {/* Ficha del jugador */}
                      {(p.height||p.age!=null||p.exp!=null)&&<div style={{display:"flex",gap:T.space[5],flexWrap:"wrap",marginBottom:T.space[4],paddingBottom:T.space[3],borderBottom:`1px solid ${T.border.subtle}`}}>
                        {[["Altura",p.height],["Peso",p.weight],["Edad",p.age],["Temporadas",p.exp]]
                          .filter(([,v])=>v!=null&&v!=="")
                          .map(([l,v])=>
                            <div key={l}>
                              <div style={{fontSize:T.font.xs,color:T.text.tertiary}}>{l}</div>
                              <div style={{fontSize:T.font.sm,fontWeight:600,color:T.text.primary}}>{v}</div>
                            </div>)}
                      </div>}

                      {loading
                        ?<div style={{textAlign:"center",padding:T.space[5]}}><Spin/></div>
                        :failed
                          ?<div style={{textAlign:"center",padding:T.space[5],color:T.text.tertiary,fontSize:T.font.sm}}>
                            No pudimos cargar sus estadísticas
                          </div>
                          :!st
                            ?<div style={{textAlign:"center",padding:T.space[5],color:T.text.tertiary,fontSize:T.font.sm}}>
                              Sin estadísticas esta temporada
                            </div>
                            :<>
                              <div style={{display:"flex",gap:T.space[5],flexWrap:"wrap",marginBottom:T.space[4]}}>
                                {[["PJ",st.gp],["MIN",st.min],["PTS",st.pts],["AST",st.ast],["REB",st.reb],["BLK",st.blk],["STL",st.stl],["FG%",st.fgPct],["3P%",st.fg3Pct],["TL%",st.ftPct]]
                                  .filter(([,v])=>v!=null)
                                  .map(([l,v])=>
                                    <div key={l}>
                                      <div style={{fontSize:T.font.xs,color:T.text.tertiary}}>{l}</div>
                                      <div style={{fontSize:T.font.lg,fontWeight:700,color:T.text.primary}}>{v}</div>
                                    </div>)}
                              </div>
                              {st.pts!=null&&<ResponsiveContainer width="100%" height={180}>
                                <RadarChart data={radarFor(st)}>
                                  <PolarGrid stroke={T.border.base}/>
                                  <PolarAngleAxis dataKey="s" tick={{fill:T.text.tertiary,fontSize:10}}/>
                                  <PolarRadiusAxis domain={[0,100]} tick={false} axisLine={false}/>
                                  <Radar dataKey="v" stroke={T.accent.base} fill={T.accent.base} fillOpacity={.18} strokeWidth={1.5}/>
                                </RadarChart>
                              </ResponsiveContainer>}
                            </>}
                    </div>
                  </td>
                </tr>}
              </Fragment>;
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
