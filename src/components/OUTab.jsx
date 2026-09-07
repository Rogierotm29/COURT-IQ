import { useState, useEffect } from "react";
import { T } from "../theme";
import { Card, ST, Spin, Tag } from "./ui";
import { logo } from "./TeamLogo";
import { pickemAPI } from "../api/pickem";
import { getToday } from "../utils/date";

/* ═══ OVER/UNDER TAB ═══ */
export const OUTab=({games,userCtx})=>{
  const {user}=userCtx||{};
  const [picks,setPicks]=useState({});
  const [loading,setLoading]=useState({});
  const [msg,setMsg]=useState("");
  const [lines,setLines]=useState({});

  useEffect(()=>{
    if(!user) return;
    let saved={};
    try{
      saved=JSON.parse(localStorage.getItem(`courtiq_ou_${user.id}_${getToday()}`)||"{}");
    }catch(e){
      console.warn("No se pudieron leer los picks O/U guardados:",e.message);
    }
    setPicks(saved);

    const newLines={};
    games.forEach(g=>{
      const seed=g.id.split("").reduce((a,c)=>a+c.charCodeAt(0),0);
      newLines[g.id]=210+(seed%21);
    });
    setLines(newLines);
  },[user,games]);

  const makePick=async(game,choice)=>{
    if(!user){setMsg("Inicia sesión primero");return;}
    if(game.status!=="Upcoming"){setMsg("Solo puedes hacer picks en partidos que no han empezado");return;}
    const today=getToday();
    const next={...picks,[game.id]:choice};
    setPicks(next);
    setLoading(l=>({...l,[game.id]:true}));
    try{
      localStorage.setItem(`courtiq_ou_${user.id}_${today}`,JSON.stringify(next));
    }catch(e){
      console.warn("No se pudo guardar el pick O/U localmente:",e.message);
    }
    await pickemAPI("makeOUPick",{body:{userId:user.id,gameId:game.id,gameDate:today,choice,line:lines[game.id]}});
    setLoading(l=>({...l,[game.id]:false}));
  };

  const getResult=(game,choice)=>{
    if(game.status!=="Final"||game.awayScore==null||game.homeScore==null) return null;
    const total=(parseInt(game.awayScore)||0)+(parseInt(game.homeScore)||0);
    const line=lines[game.id]||220;
    if(total===line) return "push";
    return choice===(total>line?"over":"under")?"correct":"wrong";
  };

  const upcoming=games.filter(g=>g.status==="Upcoming");
  const finished=games.filter(g=>g.status==="Final"&&picks[g.id]);
  const label={fontSize:T.font.xs,color:T.text.tertiary,textTransform:"uppercase",letterSpacing:1.2,fontWeight:600};

  return(<div className="fade-up">
    <ST sub="Predice el total de puntos">Over / Under</ST>

    {!user&&<Card style={{textAlign:"center",padding:T.space[7]}}>
      <div style={{fontSize:T.font.base,fontWeight:600,color:T.text.primary,marginBottom:T.space[2]}}>Inicia sesión para participar</div>
      <div style={{fontSize:T.font.sm,color:T.text.tertiary}}>Necesitas una cuenta para guardar tus picks</div>
    </Card>}

    {user&&<>
      {msg&&<div style={{marginBottom:T.space[3],padding:`${T.space[3]}px ${T.space[4]}px`,background:T.surface[1],border:`1px solid ${T.border.base}`,borderLeft:`3px solid ${T.warning.base}`,borderRadius:T.radius.sm,fontSize:T.font.sm,color:T.text.secondary,display:"flex",justifyContent:"space-between",gap:T.space[3]}}>
        {msg}<button className="btn" onClick={()=>setMsg("")} style={{background:"none",color:T.text.tertiary,fontSize:T.font.base,padding:0}}>×</button>
      </div>}

      <Card style={{marginBottom:T.space[4]}}>
        <div style={{...label,marginBottom:T.space[2]}}>Cómo funciona</div>
        <div style={{fontSize:T.font.sm,color:T.text.secondary,lineHeight:1.6}}>
          Cada partido tiene una línea de puntos totales. Predice si el marcador final sumará más (<b style={{color:T.text.primary}}>over</b>) o menos (<b style={{color:T.text.primary}}>under</b>) que esa línea. Ganas 5 puntos si aciertas y pierdes 5 si fallas.
        </div>
      </Card>

      {upcoming.length>0?<>
        <div style={{...label,marginBottom:T.space[3]}}>Partidos de hoy</div>
        {upcoming.map(game=>{
          const picked=picks[game.id];
          const line=lines[game.id]||220;
          const isLoading=loading[game.id];
          return<Card key={game.id} style={{marginBottom:T.space[3],borderColor:picked?T.accent.border:T.border.subtle}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:T.space[4],gap:T.space[3]}}>
              <div style={{display:"flex",alignItems:"center",gap:T.space[2],minWidth:0}}>
                {logo(game.away,22)}
                <span style={{fontSize:T.font.sm,fontWeight:600,color:T.text.primary}}>{game.away}</span>
                <span style={{fontSize:T.font.xs,color:T.text.tertiary}}>vs</span>
                <span style={{fontSize:T.font.sm,fontWeight:600,color:T.text.primary}}>{game.home}</span>
                {logo(game.home,22)}
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:T.font.xs,color:T.text.tertiary}}>Línea</div>
                <div style={{fontSize:T.font.xl,fontWeight:700,color:T.text.primary,letterSpacing:-0.4}}>{line}</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:T.space[2]}}>
              {["over","under"].map(choice=>(
                <button key={choice} className="btn" onClick={()=>makePick(game,choice)} disabled={isLoading} style={{
                  padding:T.space[3], borderRadius:T.radius.base,
                  background:picked===choice?T.accent.subtle:T.surface[2],
                  border:`1px solid ${picked===choice?T.accent.base:T.border.subtle}`,
                  color:picked===choice?T.accent.base:T.text.secondary,
                  fontWeight:600, fontSize:T.font.sm,
                }}>
                  {choice==="over"?"Over":"Under"} {line}
                </button>
              ))}
            </div>
            {picked&&<div style={{fontSize:T.font.xs,color:T.text.tertiary,marginTop:T.space[3],textAlign:"center"}}>
              {isLoading?<Spin s={11}/>:`Predices ${picked==="over"?"más":"menos"} de ${line} puntos`}
            </div>}
          </Card>;
        })}
      </>
      :<Card style={{textAlign:"center",padding:T.space[6]}}>
        <div style={{fontSize:T.font.sm,color:T.text.tertiary}}>No hay partidos próximos hoy</div>
      </Card>}

      {finished.length>0&&<>
        <div style={{...label,marginTop:T.space[5],marginBottom:T.space[3]}}>Tus resultados</div>
        {finished.map(game=>{
          const picked=picks[game.id];
          const result=getResult(game,picked);
          const total=(parseInt(game.awayScore)||0)+(parseInt(game.homeScore)||0);
          const line=lines[game.id]||220;
          const rc=result==="correct"?T.success:result==="wrong"?T.danger:null;
          return<Card key={game.id} style={{marginBottom:T.space[2],borderColor:rc?rc.border:T.border.subtle}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:T.space[3]}}>
              <div style={{display:"flex",alignItems:"center",gap:T.space[2],minWidth:0}}>
                {logo(game.away,18)}
                <span style={{fontSize:T.font.sm,color:T.text.secondary}}>{game.away}</span>
                <span style={{fontSize:T.font.sm,fontWeight:700,color:T.text.primary}}>{game.awayScore}–{game.homeScore}</span>
                <span style={{fontSize:T.font.sm,color:T.text.secondary}}>{game.home}</span>
                {logo(game.home,18)}
              </div>
              <div style={{display:"flex",gap:T.space[3],alignItems:"center"}}>
                <span style={{fontSize:T.font.xs,color:T.text.tertiary}}>
                  Total <b style={{color:T.text.primary}}>{total}</b> · línea {line} · tu pick: {picked}
                </span>
                <Tag c={rc?rc.base:T.text.tertiary}>
                  {result==="correct"?"+5 pts":result==="wrong"?"−5 pts":result==="push"?"Empate":"Pendiente"}
                </Tag>
              </div>
            </div>
          </Card>;
        })}
      </>}
    </>}
  </div>);
};