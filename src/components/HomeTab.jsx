import { useState, useEffect, useRef } from "react";
import { Card, ST, Tag } from "./ui";
import { Confetti, ResultBanner, FloatPts, LiveBadge } from "./feedback";
import { tm, logo } from "./TeamLogo";
import { pickemAPI } from "../api/pickem";
import { calcWinPct, dynPts, dynBase } from "../utils/scoring";
import { C, T, APP_URL } from "../theme";
import { getSeason } from "../utils/season";
import { getToday } from "../utils/date";

/* ═══ HOME TAB ═══ */
export const HomeTab=({games,live,userCtx,standings,picks,confidence,setConfidence,makePick,selGroup,goToBets,goToGroup})=>{
  const {user}=userCtx||{};

  const [grpPicks,setGrpPicks]=useState([]);
  const [pendingBets,setPendingBets]=useState([]);
  const [expandedCard,setExpandedCard]=useState(null);
  const [lockedPicks,setLockedPicks]=useState(false);
  const [showPctInfo,setShowPctInfo]=useState(false);
  const [bonusClaimed,setBonusClaimed]=useState(null);
  const [bonusMsg,setBonusMsg]=useState("");
  const [picksPoints,setPicksPoints]=useState({});
  const [streak,setStreak]=useState(0);
  const [weeklyStats,setWeeklyStats]=useState(null);
  const [showConfetti,setShowConfetti]=useState(false);
  const [resultBanner,setResultBanner]=useState({show:false,correct:false,pts:0,streak:0});
  const [floatingPts,setFloatingPts]=useState({});
  const prevStatusRef=useRef({});
  const prevStreakRef=useRef(streak);

  const triggerCelebration=(correctPts,str,gameId)=>{
    const cKey=`courtiq_celebrated_${user?.id}_${gameId}`;
    if(localStorage.getItem(cKey)) return;
    localStorage.setItem(cKey,"1");
    setShowConfetti(true);
    setResultBanner({show:true,correct:true,pts:correctPts,streak:str});
    setTimeout(()=>setShowConfetti(false),3500);
  };

  useEffect(()=>{
    if(!user) return;
    pickemAPI("dailyBonusStatus",{params:{userId:user.id}}).then(d=>{if(d.ok)setBonusClaimed(d.claimed);});
  },[user]);

  useEffect(()=>{
    if(!user||!selGroup) return;
    const today=getToday();
    setLockedPicks(!!localStorage.getItem(`courtiq_locked_${selGroup.id}_${today}`));

    pickemAPI("myPicks",{params:{userId:user.id,groupId:selGroup.id,date:today}}).then(r=>{
      if(!r.ok) return;
      const pts={};
      (r.picks||[]).forEach(p=>{if(p.points!=null)pts[p.game_id]=p.points;});
      setPicksPoints(pts);
      const correctPicks=(r.picks||[]).filter(p=>p.correct&&p.points>0);
      if(correctPicks.length>0){
        const yaVistos=correctPicks.every(p=>localStorage.getItem(`courtiq_celebrated_${user.id}_${p.game_id}`));
        if(!yaVistos){
          correctPicks.forEach(p=>localStorage.setItem(`courtiq_celebrated_${user.id}_${p.game_id}`,"1"));
          const totalPts=correctPicks.reduce((s,p)=>s+(p.points||0),0);
          setShowConfetti(true);
          setResultBanner({show:true,correct:true,pts:totalPts,streak:0});
          setTimeout(()=>setShowConfetti(false),3500);
        }
      }
    });

    pickemAPI("groupBets",{params:{groupId:selGroup.id}}).then(r=>{
      if(r.ok){const challenges=(r.bets||[]).filter(b=>b.status==="pending"&&b.opponent_id===user.id);setPendingBets(challenges);}
    });
    pickemAPI("getStreak",{params:{userId:user.id,groupId:selGroup.id}}).then(r=>{if(r.ok)setStreak(r.streak||0);});
    pickemAPI("periodLeaderboard",{params:{groupId:selGroup.id,period:"week"}}).then(r=>{if(r.ok){const me=(r.leaderboard||[]).find(x=>x.user_id===user.id);setWeeklyStats(me||null);}});
  },[user,selGroup]);

  // Recargar picks del grupo cuando cambia el estado de los juegos
  useEffect(()=>{
    if(!user||!selGroup) return;
    pickemAPI("groupPicks",{params:{groupId:selGroup.id}}).then(r=>{if(r.ok)setGrpPicks(r.picks||[]);});
  },[user,selGroup,games.map(g=>g.status).join(",")]);

  useEffect(()=>{
    if(streak>prevStreakRef.current&&streak>=2){
      setResultBanner({show:true,correct:true,pts:0,streak,streakOnly:true});
    }
    prevStreakRef.current=streak;
  },[streak]);

  useEffect(()=>{
    games.forEach(g=>{
      const prev=prevStatusRef.current[g.id];
      if(prev&&prev!=="Final"&&g.status==="Final"&&picks[g.id]){
        const winner=g.homeScore>g.awayScore?g.home:g.away;
        const correct=picks[g.id]===winner;
        const conf=confidence[g.id]||1;
        const pct=calcWinPct(g,picks[g.id]===g.home?"home":"away",standings);
        const pts=dynPts(pct,conf);
        const key=Date.now()+g.id;
        setFloatingPts(prev=>({...prev,[g.id]:{pts,correct,key}}));
        setTimeout(()=>setFloatingPts(prev=>{const n={...prev};delete n[g.id];return n;}),1400);
        if(correct) triggerCelebration(pts,streak,g.id);
      }
      prevStatusRef.current[g.id]=g.status;
    });
  },[games.map(g=>g.status).join(",")]);

  const lockAllPicks=()=>{
    if(!selGroup) return;
    localStorage.setItem(`courtiq_locked_${selGroup.id}_${getToday()}`,"1");
    setLockedPicks(true);
    setExpandedCard(null);
  };

  const anyStarted=games.some(g=>g.status==="LIVE"||g.status==="Final");

  const claimBonus=async()=>{
    const d=await pickemAPI("claimDailyBonus",{body:{userId:user.id}});
    if(d.ok){setBonusClaimed(true);setBonusMsg(`+${d.bonus} monedas de bonus diario`);}
    else setBonusMsg(d.error||"Error");
    setTimeout(()=>setBonusMsg(""),4000);
  };

  const shareResult=()=>{
    const finishedWithPick=games.filter(g=>g.status==="Final"&&picks[g.id]);
    if(!finishedWithPick.length) return;
    const W=1080,H=finishedWithPick.length*160+340;
    const cv=document.createElement("canvas");cv.width=W;cv.height=H;
    const ctx=cv.getContext("2d");
    ctx.fillStyle=T.surface[0];ctx.fillRect(0,0,W,H);
    ctx.fillStyle="#ffffff06";
    for(let x=0;x<W;x+=50)for(let y=0;y<H;y+=50){ctx.beginPath();ctx.arc(x,y,1.5,0,Math.PI*2);ctx.fill();}
    ctx.font="900 64px Arial Black,sans-serif";ctx.textAlign="center";ctx.fillStyle=T.text.primary;
    ctx.fillText("COURT",W/2-80,90);
    ctx.fillStyle=T.accent.base;ctx.fillText("IQ",W/2+110,90);
    ctx.fillStyle=T.text.secondary;ctx.font="500 30px sans-serif";
    const today=new Date().toLocaleDateString("es-MX",{weekday:"long",month:"long",day:"numeric"});
    ctx.fillText(`${user?.name||""} · ${today}`,W/2,140);
    ctx.fillStyle=T.border.base;ctx.fillRect(60,160,W-120,1);
    let correct=0,totalPts=0;
    finishedWithPick.forEach((g,i)=>{
      const y=200+i*160;const winner=g.homeScore>g.awayScore?g.home:g.away;const ok=picks[g.id]===winner;
      const conf=confidence[g.id]||1;const pct=picks[g.id]===g.home?calcWinPct(g,"home",standings):calcWinPct(g,"away",standings);
      const pts=picksPoints[g.id]??dynPts(pct,conf);if(ok){correct++;totalPts+=pts;}
      ctx.fillStyle=T.surface[1];ctx.beginPath();ctx.roundRect(60,y,W-120,130,16);ctx.fill();
      ctx.strokeStyle=ok?T.success.border:T.danger.border;ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(60,y,W-120,130,16);ctx.stroke();
      ctx.fillStyle=T.text.primary;ctx.font="700 36px sans-serif";ctx.textAlign="left";
      ctx.fillText(`${g.away} vs ${g.home}`,100,y+50);
      ctx.fillStyle=T.text.tertiary;ctx.font="400 26px sans-serif";
      ctx.fillText(`${g.awayScore} – ${g.homeScore}`,100,y+90);
      const bdg=ok?T.success.base:T.danger.base;
      ctx.fillStyle=ok?T.success.subtle:T.danger.subtle;ctx.beginPath();ctx.roundRect(W-280,y+20,180,52,26);ctx.fill();
      ctx.fillStyle=bdg;ctx.font="700 24px sans-serif";ctx.textAlign="center";
      ctx.fillText(ok?`+${pts} pts`:`${picks[g.id]}`,W-190,y+52);
      ctx.textAlign="left";
    });
    const sy=200+finishedWithPick.length*160+10;
    ctx.fillStyle=T.accent.subtle;ctx.beginPath();ctx.roundRect(60,sy,W-120,90,16);ctx.fill();
    ctx.strokeStyle=T.accent.border;ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(60,sy,W-120,90,16);ctx.stroke();
    ctx.fillStyle=T.text.primary;ctx.font="900 38px Arial Black,sans-serif";ctx.textAlign="center";
    ctx.fillText(`${correct}/${finishedWithPick.length} correctos · +${totalPts} pts`,W/2,sy+58);
    ctx.fillStyle=T.text.tertiary;ctx.font="400 24px sans-serif";ctx.textAlign="center";
    ctx.fillText(APP_URL,W/2,H-24);
    cv.toBlob(blob=>{
      if(!blob) return;
      const file=new File([blob],"court-iq-resultado.png",{type:"image/png"});
      if(navigator.canShare?.({files:[file]})){navigator.share({title:"Mis picks de hoy — Court IQ",files:[file]}).catch(()=>{});}
      else{const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="court-iq-resultado.png";a.click();}
    },"image/png");
  };

  return(<div className="fade-up">
    <Confetti active={showConfetti}/>
    <ResultBanner {...resultBanner} onClose={()=>setResultBanner(b=>({...b,show:false}))}/>

    {!user&&<Card style={{marginBottom:T.space[5],textAlign:"center",padding:`${T.space[6]}px ${T.space[5]}px`}}>
      <div style={{fontSize:T.font["2xl"],fontWeight:800,color:T.text.primary,marginBottom:T.space[2],letterSpacing:-0.5}}>Compite con tus amigos</div>
      <div style={{fontSize:T.font.base,color:T.text.secondary,marginBottom:T.space[1],lineHeight:1.5}}>Predice ganadores, gana puntos, sube en el ranking</div>
      <div style={{fontSize:T.font.sm,color:T.text.tertiary,marginBottom:T.space[5]}}>Sin apuestas reales · Sólo orgullo</div>
      <button className="btn" onClick={goToGroup} style={{padding:`${T.space[3]}px ${T.space[6]}px`,borderRadius:T.radius.base,background:T.accent.base,color:"#fff",fontSize:T.font.base,fontWeight:700}}>Empezar</button>
    </Card>}

    {user&&<div onClick={selGroup?goToGroup:undefined} style={{cursor:selGroup?"pointer":"default",marginBottom:pendingBets.length?T.space[3]:T.space[5]}}>
      <Card style={{padding:`${T.space[4]}px ${T.space[5]}px`}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:T.space[3]}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:T.space[2],marginBottom:T.space[1]}}>
              <div style={{fontSize:T.font.xs,color:T.text.tertiary,fontWeight:600,letterSpacing:1.2,textTransform:"uppercase"}}>Pick'em</div>
              {streak>=3&&<div style={{fontSize:T.font.xs,fontWeight:700,color:T.warning.base,background:T.warning.subtle,border:`1px solid ${T.warning.border}`,borderRadius:T.radius.full,padding:"2px 10px"}}>{streak} en racha</div>}
              {streak>=1&&streak<3&&<div style={{fontSize:T.font.xs,fontWeight:600,color:T.text.secondary,background:T.surface[2],borderRadius:T.radius.full,padding:"2px 10px"}}>{streak} correcto{streak!==1?"s":""}</div>}
            </div>
            <div style={{fontSize:T.font.lg,fontWeight:600,color:T.text.primary}}>Hola, {user.name}</div>
          </div>
          <div style={{display:"flex",gap:T.space[2],alignItems:"center",flexShrink:0}}>
            {lockedPicks&&<Tag c={T.warning.base}>Picks cerrados</Tag>}
            {selGroup?<Tag c={T.accent.base}>{selGroup.name}</Tag>:<Tag c={T.text.tertiary}>Crea un grupo</Tag>}
          </div>
        </div>
      </Card>
    </div>}

    {user&&bonusClaimed===false&&<div style={{marginBottom:T.space[4],padding:`${T.space[3]}px ${T.space[4]}px`,background:T.surface[1],border:`1px solid ${T.border.base}`,borderRadius:T.radius.base,display:"flex",alignItems:"center",justifyContent:"space-between",gap:T.space[3]}}>
      <div>
        <div style={{fontSize:T.font.sm,fontWeight:600,color:T.text.primary}}>Bonus diario disponible</div>
        <div style={{fontSize:T.font.xs,color:T.text.tertiary,marginTop:2}}>+25 monedas · entra cada día</div>
      </div>
      <button className="btn" onClick={claimBonus} style={{padding:`${T.space[2]}px ${T.space[4]}px`,borderRadius:T.radius.sm,background:T.accent.base,color:"#fff",fontSize:T.font.sm,fontWeight:600,flexShrink:0}}>Reclamar</button>
    </div>}

    {bonusMsg&&<div style={{marginBottom:T.space[3],padding:`${T.space[2]}px ${T.space[4]}px`,background:T.success.subtle,border:`1px solid ${T.success.border}`,borderRadius:T.radius.base,fontSize:T.font.sm,color:T.success.base}}>{bonusMsg}</div>}

    {user&&selGroup&&weeklyStats&&weeklyStats.total>0&&<div style={{marginBottom:T.space[4],padding:`${T.space[3]}px ${T.space[4]}px`,background:T.surface[1],border:`1px solid ${T.border.base}`,borderRadius:T.radius.base,display:"flex",alignItems:"center",gap:T.space[4]}}>
      <div style={{flex:1}}>
        <div style={{fontSize:T.font.xs,color:T.text.tertiary,fontWeight:600,letterSpacing:1.2,textTransform:"uppercase",marginBottom:T.space[1]}}>Esta semana</div>
        <div style={{display:"flex",gap:T.space[4],flexWrap:"wrap",alignItems:"baseline"}}>
          <span style={{fontSize:T.font.base,fontWeight:700,color:T.text.primary}}>{weeklyStats.correct}/{weeklyStats.total}</span>
          <span style={{fontSize:T.font.sm,color:T.text.secondary}}>{weeklyStats.points} pts</span>
          <span style={{fontSize:T.font.sm,color:T.text.tertiary}}>{weeklyStats.accuracy}% precisión</span>
          {weeklyStats.rank<=3&&<Tag c={T.accent.base}>#{weeklyStats.rank}</Tag>}
        </div>
      </div>
      <button className="btn" onClick={goToGroup} style={{padding:`${T.space[2]}px ${T.space[3]}px`,borderRadius:T.radius.sm,background:T.surface[2],border:`1px solid ${T.border.base}`,color:T.text.secondary,fontSize:T.font.xs,fontWeight:600,flexShrink:0}}>Ver</button>
    </div>}

    {user&&pendingBets.length>0&&<div style={{marginBottom:T.space[5]}}>
      {pendingBets.map(b=><div key={b.id} onClick={goToBets} style={{cursor:"pointer",padding:`${T.space[3]}px ${T.space[4]}px`,background:T.warning.subtle,border:`1px solid ${T.warning.border}`,borderRadius:T.radius.base,marginBottom:T.space[2],display:"flex",alignItems:"center",gap:T.space[3]}}>
        <div style={{flex:1}}>
          <span style={{fontSize:T.font.sm,fontWeight:600,color:T.warning.base}}>Reto de apuesta</span>
          <span style={{fontSize:T.font.sm,color:T.text.tertiary}}> · {b.away_team} vs {b.home_team} · {b.amount} monedas</span>
        </div>
        <span style={{fontSize:T.font.xs,color:T.warning.base,fontWeight:600}}>Ver</span>
      </div>)}
    </div>}

    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:T.space[4]}}>
      <ST sub={`NBA ${getSeason()}`}>Partidos del día</ST>
      <LiveBadge live={live.games}/>
    </div>

    {user&&selGroup&&anyStarted&&<div style={{marginBottom:T.space[3],padding:`${T.space[3]}px ${T.space[4]}px`,background:T.surface[1],border:`1px solid ${T.border.base}`,borderRadius:T.radius.base,fontSize:T.font.sm,color:T.text.secondary}}>Un partido ya empezó — picks cerrados para hoy</div>}

    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(300px,1fr))",gap:T.space[3],marginBottom:T.space[6]}}>
      {games.length===0?<div style={{color:T.text.tertiary,fontSize:T.font.sm}}>No hay partidos programados.</div>
      :games.map(g=>{
        const picked=picks[g.id];const isFinal=g.status==="Final";const isLive=g.status==="LIVE";
        const isUpcoming=g.startTime?new Date()<new Date(g.startTime):g.status==="Upcoming";
        const winner=isFinal?(g.homeScore>g.awayScore?g.home:g.away):null;
        const correct=isFinal&&picked===winner;
        const minsLeft=g.startTime&&isUpcoming?Math.max(0,Math.round((new Date(g.startTime)-new Date())/60000)):null;
        const showGrpSection=lockedPicks&&expandedCard===g.id;
        const gp=grpPicks.filter(p=>p.game_id===g.id);
        const forAway=gp.filter(p=>p.picked_team===g.away);
        const forHome=gp.filter(p=>p.picked_team===g.home);
        const canPick=user&&selGroup&&isUpcoming&&!lockedPicks&&!anyStarted;
        const conf=confidence[g.id]||1;
        const awayPct=calcWinPct(g,"away",standings);const homePct=calcWinPct(g,"home",standings);
        const pickedPct=picked?(picked===g.home?homePct:awayPct):50;
        const fp=floatingPts[g.id];
        return <Card key={g.id} style={{padding:T.space[4],position:"relative",borderColor:isFinal&&picked?(correct?T.success.border:T.danger.border):picked?T.accent.border:T.border.base}}>
        {fp&&<FloatPts key={fp.key} pts={fp.pts} correct={fp.correct}/>}

        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:T.space[4]}}>
          <div style={{display:"flex",gap:T.space[2],alignItems:"center"}}>
            {isLive?<Tag c={T.danger.base}>EN VIVO · {g.detail}</Tag>:isFinal?<Tag c={T.text.tertiary}>Final</Tag>
            :minsLeft!==null?(minsLeft<=1?<Tag c={T.danger.base}>Iniciando</Tag>:minsLeft<=60?<Tag c={T.warning.base}>{minsLeft} min</Tag>:<Tag c={T.text.tertiary}>{g.detail||"Hoy"}</Tag>)
            :<Tag c={T.text.tertiary}>{g.detail||"Hoy"}</Tag>}
          </div>
          <div style={{display:"flex",gap:T.space[2],alignItems:"center"}}>
            {isFinal&&picked&&(()=>{const ap=picksPoints[g.id];const c2=conf;return<Tag c={correct?T.success.base:T.danger.base}>{correct?`+${ap??dynPts(pickedPct,c2)} pts`:(c2>=2?`${ap??-dynPts(pickedPct,c2)} pts`:"0 pts")}</Tag>;})()}
            {isLive&&picked&&<Tag c={T.accent.base}>{picked}</Tag>}
            {!isFinal&&!isLive&&picked&&!lockedPicks&&<Tag c={T.success.base}>{picked} · +{dynPts(pickedPct,conf)} pts</Tag>}
            {lockedPicks&&picked&&!isFinal&&<Tag c={T.warning.base}>{picked}</Tag>}
          </div>
        </div>

        <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:T.space[3],alignItems:"center"}}>
          {[["away",g.away,g.awayScore,awayPct],["vs"],["home",g.home,g.homeScore,homePct]].map((item,idx)=>
            idx===1
              ?<div key="vs" style={{textAlign:"center",fontSize:T.font.sm,color:T.text.tertiary,fontWeight:600}}>VS</div>
              :canPick
                ?<button key={item[1]} className="btn" onClick={()=>makePick(g.id,item[1],g.home,g.away,conf,g)} style={{padding:`${T.space[4]}px ${T.space[2]}px`,borderRadius:T.radius.base,textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:T.space[2],background:picked===item[1]?T.accent.subtle:T.surface[2],border:`1px solid ${picked===item[1]?T.accent.base:T.border.subtle}`,color:T.text.primary,width:"100%"}}>
                    {logo(item[1],40)}
                    <span style={{fontSize:T.font.base,fontWeight:700}}>{item[1]}</span>
                    <span style={{fontSize:T.font.xs,color:T.text.tertiary}}>{tm(item[1]).name}</span>
                    <span style={{fontSize:T.font.xs,fontWeight:600,color:picked===item[1]?T.accent.base:T.text.tertiary}}>+{dynBase(item[3]??50)} pts</span>
                  </button>
                :<div key={item[1]} style={{textAlign:"center",padding:`${T.space[3]}px ${T.space[2]}px`,opacity:picked&&picked!==item[1]?0.4:1}}>
                    {logo(item[1],40)}
                    <div style={{fontSize:T.font.base,fontWeight:700,color:T.text.primary,marginTop:T.space[1]}}>{item[1]}</div>
                    {(isFinal||isLive)&&<div style={{fontSize:T.font["2xl"],fontWeight:800,color:isFinal&&item[1]===winner?T.success.base:T.text.primary,marginTop:T.space[1]}}>{item[2]}</div>}
                  </div>
          )}
        </div>

        {canPick&&picked&&<div style={{marginTop:T.space[3],display:"flex",alignItems:"center",gap:T.space[2],justifyContent:"center"}}>
          <span style={{fontSize:T.font.xs,color:T.text.tertiary}}>Confianza</span>
          {[1,2,3].map(c=>{const pts=dynPts(pickedPct,c);return<button key={c} className="btn" onClick={()=>{setConfidence(cf=>({...cf,[g.id]:c}));makePick(g.id,picked,g.home,g.away,c,g);}} style={{padding:`${T.space[1]}px ${T.space[3]}px`,borderRadius:T.radius.sm,background:conf===c?T.accent.subtle:T.surface[2],border:`1px solid ${conf===c?T.accent.base:T.border.subtle}`,color:conf===c?T.accent.base:T.text.tertiary,fontSize:T.font.xs,fontWeight:600}}>{c===1?`+${pts}`:`±${pts}`}</button>;})}
        </div>}

        {selGroup&&!canPick&&gp.length>0&&<div style={{marginTop:T.space[3],padding:`${T.space[2]}px ${T.space[3]}px`,background:T.surface[2],borderRadius:T.radius.sm}}>
          <div style={{display:"flex",height:4,borderRadius:2,overflow:"hidden",marginBottom:T.space[2]}}>
            <div style={{flex:forAway.length||0.01,background:T.accent.base}}/><div style={{flex:forHome.length||0.01,background:T.border.strong}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:T.font.xs,color:T.text.tertiary}}>
            <span>{g.away} {gp.length?Math.round(forAway.length/gp.length*100):0}%</span>
            <span>{gp.length} picks</span>
            <span>{gp.length?Math.round(forHome.length/gp.length*100):0}% {g.home}</span>
          </div>
        </div>}

        {lockedPicks&&selGroup&&<button className="btn" onClick={()=>setExpandedCard(showGrpSection?null:g.id)} style={{width:"100%",marginTop:T.space[2],padding:T.space[2],borderRadius:T.radius.sm,background:"transparent",border:`1px solid ${T.border.subtle}`,color:T.text.tertiary,fontSize:T.font.xs,fontWeight:600}}>
          {showGrpSection?"Ocultar":"Ver quién eligió qué"}
        </button>}

        {showGrpSection&&<div style={{marginTop:T.space[3],padding:T.space[3],background:T.surface[2],borderRadius:T.radius.base}}>
          {gp.length===0
            ?<div style={{textAlign:"center",padding:`${T.space[2]}px 0`,color:T.text.tertiary,fontSize:T.font.sm}}>Nadie hizo pick aún</div>
            :<div style={{display:"flex",flexWrap:"wrap",gap:T.space[2]}}>
                {gp.map((p,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:T.space[1],background:T.surface[3],border:`1px solid ${T.border.base}`,borderRadius:T.radius.full,padding:`${T.space[1]}px ${T.space[3]}px`}}>
                  <span style={{fontSize:T.font.sm}}>{p.users?.avatar_emoji||"🏀"}</span>
                  <span style={{fontSize:T.font.xs,color:T.text.secondary,fontWeight:600}}>{p.users?.name||"?"}</span>
                  {logo(p.picked_team,14)}
                </div>)}
              </div>}
        </div>}

        <div style={{display:"flex",alignItems:"center",gap:T.space[2],marginTop:T.space[3]}}>
          <span style={{fontSize:T.font.xs,color:T.text.tertiary,minWidth:32}}>{awayPct}%</span>
          <div style={{flex:1,height:3,borderRadius:2,background:T.surface[3],overflow:"hidden"}}>
            <div style={{width:`${awayPct}%`,height:"100%",background:T.accent.base,transition:"width .6s ease"}}/>
          </div>
          <span style={{fontSize:T.font.xs,color:T.text.tertiary,minWidth:32,textAlign:"right"}}>{homePct}%</span>
          <button className="btn" onClick={()=>setShowPctInfo(true)} style={{width:24,height:24,borderRadius:T.radius.full,background:"transparent",border:`1px solid ${T.border.base}`,color:T.text.tertiary,fontSize:T.font.xs,fontWeight:600,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>i</button>
        </div>
      </Card>;})}
    </div>

    {showPctInfo&&<div onClick={()=>setShowPctInfo(false)} style={{position:"fixed",inset:0,background:"#00000099",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:T.space[5]}}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.surface[1],border:`1px solid ${T.border.base}`,borderRadius:T.radius.lg,padding:T.space[5],maxWidth:340,width:"100%",boxShadow:T.shadow.lg}}>
        <div style={{fontSize:T.font.lg,fontWeight:700,color:T.text.primary,marginBottom:T.space[4]}}>¿Qué significan los porcentajes?</div>
        <div style={{fontSize:T.font.sm,color:T.text.secondary,lineHeight:1.7,marginBottom:T.space[3]}}>
          <b style={{color:T.text.primary}}>Partidos próximos:</b> probabilidad estimada de que gane cada equipo según su récord. El local tiene ventaja de +3%.
        </div>
        <div style={{fontSize:T.font.sm,color:T.text.secondary,lineHeight:1.7,marginBottom:T.space[5]}}>
          <b style={{color:T.text.primary}}>En vivo:</b> cambia en tiempo real según la diferencia en el marcador.
        </div>
        <button className="btn" onClick={()=>setShowPctInfo(false)} style={{width:"100%",padding:T.space[3],borderRadius:T.radius.base,background:T.accent.base,color:"#fff",fontWeight:600,fontSize:T.font.base}}>Entendido</button>
      </div>
    </div>}

    {user&&selGroup&&!lockedPicks&&Object.keys(picks).length>0&&<div style={{background:T.surface[1],border:`1px solid ${T.border.base}`,borderRadius:T.radius.lg,padding:T.space[5],marginBottom:T.space[3]}}>
      <div style={{fontSize:T.font.base,fontWeight:600,color:T.text.primary,marginBottom:T.space[1]}}>¿Listo con tus picks?</div>
      <div style={{fontSize:T.font.sm,color:T.text.secondary,marginBottom:T.space[4],lineHeight:1.5}}>Al cerrarlos podrás ver qué eligieron los demás. Ya no podrás cambiarlos.</div>
      <button className="btn" onClick={lockAllPicks} style={{width:"100%",padding:T.space[3],borderRadius:T.radius.base,background:T.accent.base,color:"#fff",fontWeight:600,fontSize:T.font.base}}>Cerrar mis picks</button>
    </div>}

    {user&&games.some(g=>g.status==="Final"&&picks[g.id])&&
      <button className="btn" onClick={shareResult} style={{width:"100%",padding:T.space[4],borderRadius:T.radius.base,background:T.surface[2],border:`1px solid ${T.border.base}`,color:T.text.primary,fontWeight:600,fontSize:T.font.base,marginBottom:T.space[3]}}>
        Compartir mis resultados
      </button>
    }
  </div>);
};