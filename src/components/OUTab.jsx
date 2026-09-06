import { useState, useEffect } from "react";
import { C } from "../theme";
import { Card, ST, Spin } from "./ui";
import { logo } from "./TeamLogo";
import { pickemAPI } from "../api/pickem";
import { getToday } from "../utils/date";

/* ═══ OVER/UNDER TAB ═══ */
export const OUTab=({games,userCtx})=>{
  const {user}=userCtx||{};
  const [picks,setPicks]=useState({}); // {gameId: "over"|"under"}
  const [loading,setLoading]=useState({});
  const [msg,setMsg]=useState("");
  const [lines,setLines]=useState({}); // {gameId: number}

  // Load today's OU picks and generate lines
  useEffect(()=>{
    if(!user)return;
    const savedPicks=JSON.parse(localStorage.getItem(`courtiq_ou_${user.id}_${getToday()}`)||"{}");
    setPicks(savedPicks);
    // Generate stable O/U lines from game ids (deterministic seed)
    const newLines={};
    games.filter(g=>g.status==="Upcoming"||g.status==="LIVE"||g.status==="Final").forEach(g=>{
      // Line between 210–230 based on a hash of the game id
      const seed=g.id.split("").reduce((a,c)=>a+c.charCodeAt(0),0);
      newLines[g.id]=210+((seed%21));
    });
    setLines(newLines);
  },[user,games]);

  const makePick=async(game,choice)=>{
    if(!user){setMsg("Inicia sesión primero");return;}
    const today=getToday();
    if(game.status!=="Upcoming"){setMsg("Solo puedes hacer picks en partidos próximos");return;}
    const next={...picks,[game.id]:choice};
    setPicks(next);
    setLoading(l=>({...l,[game.id]:true}));
    localStorage.setItem(`courtiq_ou_${user.id}_${today}`,JSON.stringify(next));
    // Score immediately if game is final
    await pickemAPI("makeOUPick",{body:{userId:user.id,gameId:game.id,gameDate:today,choice,line:lines[game.id]}});
    setLoading(l=>({...l,[game.id]:false}));
  };

  const getResult=(game,choice)=>{
    if(game.status!=="Final"||game.awayScore==null||game.homeScore==null)return null;
    const total=(parseInt(game.awayScore)||0)+(parseInt(game.homeScore)||0);
    const line=lines[game.id]||220;
    const actual=total>line?"over":"under";
    return choice===actual?"correct":"wrong";
  };

  const upcoming=games.filter(g=>g.status==="Upcoming");
  const finished=games.filter(g=>g.status==="Final"&&picks[g.id]);

  return(<div className="fade-up">
    <ST sub="Predice el total de puntos">Over / Under 🎰</ST>

    {!user&&<Card style={{textAlign:"center",padding:40}}>
      <div style={{fontSize:48,marginBottom:12}}>🎰</div>
      <div style={{fontSize:15,fontWeight:700,color:C.text}}>Inicia sesión para hacer picks O/U</div>
    </Card>}

    {user&&<>
      {msg&&<div style={{marginBottom:12,padding:"10px 14px",background:"#ff444411",border:"1px solid #ff444433",borderRadius:10,fontSize:12,color:"#ff6666"}}>{msg}</div>}

      {/* Cómo funciona */}
      <Card style={{marginBottom:14,background:"#0a1018",borderColor:C.border}}>
        <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>Cómo funciona</div>
        <div style={{fontSize:11,color:C.dim,lineHeight:1.7}}>
          Cada partido tiene una línea de puntos totales. Predice si el total final será <b style={{color:"#00FF9D"}}>OVER</b> (más) o <b style={{color:"#FF6B35"}}>UNDER</b> (menos). <b style={{color:"#00FF9D"}}>+5 pts</b> si aciertas, <b style={{color:"#ff4444"}}>-5 pts</b> si fallas 🎯
        </div>
      </Card>

      {/* Partidos próximos */}
      {upcoming.length>0&&<>
        <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>Partidos de hoy</div>
        {upcoming.map(game=>{
          const picked=picks[game.id];
          const line=lines[game.id]||220;
          const isLoading=loading[game.id];
          return<Card key={game.id} style={{marginBottom:10,borderColor:picked?`${C.accent}44`:C.border}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:10}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                {logo(game.away,22)}<span style={{fontSize:13,fontWeight:800,color:C.text}}>{game.away}</span>
                <span style={{fontSize:11,color:C.muted}}>vs</span>
                <span style={{fontSize:13,fontWeight:800,color:C.text}}>{game.home}</span>{logo(game.home,22)}
              </div>
              <div style={{textAlign:"right"}}>
                <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:1}}>Línea</div>
                <div style={{fontSize:20,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#FFB800"}}>{line}</div>
              </div>
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              <button className="btn" onClick={()=>makePick(game,"over")} disabled={isLoading} style={{padding:"12px",borderRadius:12,background:picked==="over"?"#00FF9D22":"#0d1117",border:`2px solid ${picked==="over"?"#00FF9D":C.border}`,color:picked==="over"?"#00FF9D":C.muted,fontWeight:900,fontSize:13}}>
                📈 OVER {line}
              </button>
              <button className="btn" onClick={()=>makePick(game,"under")} disabled={isLoading} style={{padding:"12px",borderRadius:12,background:picked==="under"?"#FF6B3522":"#0d1117",border:`2px solid ${picked==="under"?"#FF6B35":C.border}`,color:picked==="under"?"#FF6B35":C.muted,fontWeight:900,fontSize:13}}>
                📉 UNDER {line}
              </button>
            </div>
            {picked&&<div style={{textAlign:"center",fontSize:10,color:C.dim,marginTop:8}}>
              {isLoading?<Spin s={10}/>:<span>Pick guardado · {picked==="over"?"Predices más de":"Predices menos de"} {line} pts</span>}
            </div>}
          </Card>;
        })}
      </>}

      {upcoming.length===0&&<Card style={{textAlign:"center",padding:30}}><div style={{fontSize:32,marginBottom:8}}>🏀</div><div style={{fontSize:14,color:C.dim}}>No hay partidos próximos hoy</div></Card>}

      {/* Resultados */}
      {finished.length>0&&<>
        <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginTop:16,marginBottom:10}}>Tus resultados</div>
        {finished.map(game=>{
          const picked=picks[game.id];
          const result=getResult(game,picked);
          const total=(parseInt(game.awayScore)||0)+(parseInt(game.homeScore)||0);
          const line=lines[game.id]||220;
          return<Card key={game.id} style={{marginBottom:8,borderColor:result==="correct"?"#00FF9D44":result==="wrong"?"#ff444444":C.border,background:result==="correct"?"#00FF9D08":result==="wrong"?"#ff444408":undefined}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:6}}>
              <div style={{display:"flex",alignItems:"center",gap:6}}>
                {logo(game.away,18)}<span style={{fontSize:12,fontWeight:700,color:C.text}}>{game.away}</span>
                <span style={{fontSize:11,color:"#FFB800",fontWeight:900}}>{game.awayScore}–{game.homeScore}</span>
                <span style={{fontSize:12,fontWeight:700,color:C.text}}>{game.home}</span>{logo(game.home,18)}
              </div>
              <div style={{display:"flex",gap:8,alignItems:"center"}}>
                <span style={{fontSize:11,color:C.dim}}>Total: <b style={{color:total>line?"#00FF9D":"#FF6B35"}}>{total}</b> / línea {line}</span>
                <span style={{fontSize:13,fontWeight:900,color:result==="correct"?"#00FF9D":"#ff6666"}}>{result==="correct"?"✅ +5 pts":result==="wrong"?"❌ −5 pts":"⏳"}</span>
              </div>
            </div>
          </Card>;
        })}
      </>}
    </>}
  </div>);
};