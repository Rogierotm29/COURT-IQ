import { useState, useEffect, useRef } from "react";
import { Card, ST, Tag } from "./ui";
import { Confetti, ResultBanner, FloatPts, LiveBadge } from "./feedback";
import { tm, logo } from "./TeamLogo";
import { pickemAPI } from "../api/pickem";
import { calcWinPct, dynPts, dynBase } from "../utils/scoring";
import { C, APP_URL } from "../theme";
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
  const [floatingPts,setFloatingPts]=useState({}); // {gameId: {pts,correct,key}}
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

  // Bonus diario — no depende del grupo
  useEffect(()=>{
    if(!user) return;
    pickemAPI("dailyBonusStatus",{params:{userId:user.id}}).then(d=>{if(d.ok)setBonusClaimed(d.claimed);});
  },[user]);

  // Datos que dependen del grupo activo
  useEffect(()=>{
    if(!user||!selGroup) return;
    const today=getToday();
    setLockedPicks(!!localStorage.getItem(`courtiq_locked_${selGroup.id}_${today}`));

    pickemAPI("myPicks",{params:{userId:user.id,groupId:selGroup.id,date:today}}).then(r=>{
      if(!r.ok) return;
      const pts={};
      (r.picks||[]).forEach(p=>{if(p.points!=null)pts[p.game_id]=p.points;});
      setPicksPoints(pts);
      // Celebración al entrar si hay aciertos sin ver
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

    pickemAPI("groupPicks",{params:{groupId:selGroup.id}}).then(r=>{if(r.ok)setGrpPicks(r.picks||[]);});
    pickemAPI("groupBets",{params:{groupId:selGroup.id}}).then(r=>{
      if(r.ok){const challenges=(r.bets||[]).filter(b=>b.status==="pending"&&b.opponent_id===user.id);setPendingBets(challenges);}
    });
    pickemAPI("getStreak",{params:{userId:user.id,groupId:selGroup.id}}).then(r=>{if(r.ok)setStreak(r.streak||0);});
    pickemAPI("periodLeaderboard",{params:{groupId:selGroup.id,period:"week"}}).then(r=>{if(r.ok){const me=(r.leaderboard||[]).find(x=>x.user_id===user.id);setWeeklyStats(me||null);}});
  },[user,selGroup]);

  // Notificación de racha cuando sube
  useEffect(()=>{
    if(streak>prevStreakRef.current&&streak>=2){
      setResultBanner({show:true,correct:true,pts:0,streak,streakOnly:true});
    }
    prevStreakRef.current=streak;
  },[streak]);

  // Detect games going Final → show floating pts animation
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
    const today=getToday();
    localStorage.setItem(`courtiq_locked_${selGroup.id}_${today}`,"1");
    setLockedPicks(true);
    setExpandedCard(null);
  };

  const anyStarted=games.some(g=>g.status==="LIVE"||g.status==="Final");

  const claimBonus=async()=>{
    const d=await pickemAPI("claimDailyBonus",{body:{userId:user.id}});
    if(d.ok){setBonusClaimed(true);setBonusMsg(`🎁 +${d.bonus} 🪙 bonus diario reclamado!`);}
    else setBonusMsg(d.error||"Error");
    setTimeout(()=>setBonusMsg(""),4000);
  };

  const shareResult=()=>{
    const finishedWithPick=games.filter(g=>g.status==="Final"&&picks[g.id]);
    if(!finishedWithPick.length) return;
    const W=1080,H=finishedWithPick.length*160+340;
    const cv=document.createElement("canvas");cv.width=W;cv.height=H;
    const ctx=cv.getContext("2d");
    const bg=ctx.createLinearGradient(0,0,W,H);bg.addColorStop(0,"#07090f");bg.addColorStop(1,"#0a1520");
    ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    ctx.fillStyle="#ffffff08";
    for(let x=0;x<W;x+=50)for(let y=0;y<H;y+=50){ctx.beginPath();ctx.arc(x,y,1.5,0,Math.PI*2);ctx.fill();}
    const glow=ctx.createRadialGradient(W/2,100,0,W/2,100,300);glow.addColorStop(0,"#00C2FF18");glow.addColorStop(1,"transparent");
    ctx.fillStyle=glow;ctx.fillRect(0,0,W,200);
    ctx.font="900 64px Arial Black,sans-serif";ctx.textAlign="center";ctx.fillStyle="#ffffff";
    ctx.fillText("COURT",W/2-80,90);
    const tg=ctx.createLinearGradient(W/2,0,W/2+160,0);tg.addColorStop(0,"#00C2FF");tg.addColorStop(1,"#0066ff");
    ctx.fillStyle=tg;ctx.fillText("IQ",W/2+110,90);
    ctx.fillStyle="#94a3b8";ctx.font="500 30px sans-serif";
    const today=new Date().toLocaleDateString("es-MX",{weekday:"long",month:"long",day:"numeric"});
    ctx.fillText(`${user?.name||""} · ${today}`,W/2,140);
    const dg=ctx.createLinearGradient(60,0,W-60,0);dg.addColorStop(0,"transparent");dg.addColorStop(.5,"#00C2FF44");dg.addColorStop(1,"transparent");
    ctx.fillStyle=dg;ctx.fillRect(60,160,W-120,1);
    let correct=0,totalPts=0;
    finishedWithPick.forEach((g,i)=>{
      const y=200+i*160;const winner=g.homeScore>g.awayScore?g.home:g.away;const ok=picks[g.id]===winner;
      const conf=confidence[g.id]||1;const pct=picks[g.id]===g.home?calcWinPct(g,"home",standings):calcWinPct(g,"away",standings);
      const pts=picksPoints[g.id]??dynPts(pct,conf);if(ok){correct++;totalPts+=pts;}
      const cardBg=ctx.createLinearGradient(60,y,W-60,y+130);
      cardBg.addColorStop(0,ok?"#00FF9D0a":"#ff44440a");cardBg.addColorStop(1,"#0d1117");
      ctx.fillStyle=cardBg;ctx.beginPath();ctx.roundRect(60,y,W-120,130,16);ctx.fill();
      ctx.strokeStyle=ok?"#00FF9D44":"#ff444444";ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(60,y,W-120,130,16);ctx.stroke();
      ctx.fillStyle="#e0eaf5";ctx.font="700 36px sans-serif";ctx.textAlign="left";
      ctx.fillText(`${g.away} vs ${g.home}`,100,y+50);
      ctx.fillStyle="#64748b";ctx.font="400 26px sans-serif";
      ctx.fillText(`${g.awayScore} – ${g.homeScore}`,100,y+90);
      const bdg=ok?"#00FF9D":"#ff6666";
      ctx.fillStyle=bdg+"22";ctx.beginPath();ctx.roundRect(W-280,y+20,180,52,26);ctx.fill();
      ctx.fillStyle=bdg;ctx.font="700 24px sans-serif";ctx.textAlign="center";
      ctx.fillText(ok?`✓ +${pts} pts`:`✗ ${picks[g.id]}`,W-190,y+52);
      ctx.textAlign="left";
    });
    const sy=200+finishedWithPick.length*160+10;
    const sbg=ctx.createLinearGradient(60,sy,W-60,sy+90);sbg.addColorStop(0,"#00C2FF15");sbg.addColorStop(1,"#0066ff15");
    ctx.fillStyle=sbg;ctx.beginPath();ctx.roundRect(60,sy,W-120,90,16);ctx.fill();
    ctx.strokeStyle="#00C2FF33";ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(60,sy,W-120,90,16);ctx.stroke();
    ctx.fillStyle="#ffffff";ctx.font="900 38px Arial Black,sans-serif";ctx.textAlign="center";
    ctx.fillText(`${correct}/${finishedWithPick.length} correctos · +${totalPts} pts`,W/2,sy+58);
    ctx.fillStyle="#334155";ctx.font="400 24px sans-serif";ctx.textAlign="center";
    ctx.fillText(APP_URL,W/2,H-24);
    cv.toBlob(blob=>{
      if(!blob) return;
      const file=new File([blob],"court-iq-resultado.png",{type:"image/png"});
      if(navigator.canShare?.({files:[file]})){navigator.share({title:"Mis picks de hoy — Court IQ 🏀",files:[file]}).catch(()=>{});}
      else{const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="court-iq-resultado.png";a.click();}
    },"image/png");
  };

  return(<div className="fade-up">
    <Confetti active={showConfetti}/>
    <ResultBanner {...resultBanner} onClose={()=>setResultBanner(b=>({...b,show:false}))}/>
    {!user&&<Card style={{marginBottom:22,background:"linear-gradient(135deg,#00C2FF11,#0d1117)",borderColor:"#00C2FF44",textAlign:"center",padding:"30px 20px"}}>
      <div style={{fontSize:44,marginBottom:10}}>🏀🔥</div>
      <div style={{fontSize:22,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.text,marginBottom:6}}>¡QUÉ SOBRES!</div>
      <div style={{fontSize:13,color:C.dim,marginBottom:4}}>Regístrate para predecir ganadores y competir contra tus amigos</div>
      <div style={{fontSize:11,color:C.muted,marginBottom:16}}>Elige quién gana cada partido · Gana puntos · Sube en el ranking</div>
      <button className="btn" onClick={goToGroup} style={{padding:"14px 36px",borderRadius:12,background:"linear-gradient(135deg,#00C2FF,#0066ff)",color:"#07090f",fontSize:15,fontWeight:900,letterSpacing:1}}>ENTRAR AL PICK'EM 🎯</button>
    </Card>}
    {user&&<div onClick={selGroup?goToGroup:undefined} style={{cursor:selGroup?"pointer":"default",marginBottom:pendingBets.length?10:22}}>
      <Card style={{background:"linear-gradient(135deg,#00FF9D08,#0d1117)",borderColor:selGroup?"#00FF9D55":"#FFB80044",padding:"14px 18px",transition:"border-color .2s"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
          <div style={{flex:1,minWidth:0}}>
            <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
              <div style={{fontSize:10,color:"#00FF9D",fontWeight:700,letterSpacing:2}}>PICK'EM ACTIVO</div>
              {streak>=3&&<div style={{fontSize:10,fontWeight:900,color:"#FF6B35",background:"#FF6B3520",border:"1px solid #FF6B3544",borderRadius:20,padding:"1px 8px"}}>🔥 {streak} en racha</div>}
              {streak>=1&&streak<3&&<div style={{fontSize:10,fontWeight:700,color:"#FFB800",background:"#FFB80015",border:"1px solid #FFB80033",borderRadius:20,padding:"1px 8px"}}>⚡ {streak} correcto{streak!==1?"s":""}</div>}
            </div>
            <div style={{fontSize:15,fontWeight:700,color:C.text}}>👋 {user.name} — Toca un equipo para elegir ganador</div>
          </div>
          <div style={{display:"flex",gap:8,alignItems:"center",flexShrink:0}}>
            {lockedPicks&&<Tag c="#FF6B35">🔒 Picks cerrados</Tag>}
            {selGroup?<Tag c="#00FF9D">👥 {selGroup.name} →</Tag>:<Tag c="#FFB800">Ve a Grupos para crear uno</Tag>}
          </div>
        </div>
      </Card>
    </div>}
    {user&&bonusClaimed===false&&<div style={{marginBottom:14,padding:"10px 16px",background:"linear-gradient(135deg,#FFB80018,#0d1117)",border:"1px solid #FFB80055",borderRadius:12,display:"flex",alignItems:"center",justifyContent:"space-between",gap:10}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:22}}>🎁</span>
        <div><div style={{fontSize:12,fontWeight:800,color:"#FFB800"}}>Bonus diario disponible</div><div style={{fontSize:10,color:C.dim}}>+25 🪙 gratis — entra cada día para más</div></div>
      </div>
      <button className="btn" onClick={claimBonus} style={{padding:"8px 16px",borderRadius:10,background:"linear-gradient(135deg,#FFB800,#ff9500)",color:"#07090f",fontSize:12,fontWeight:900,flexShrink:0}}>Reclamar</button>
    </div>}
    {bonusMsg&&<div style={{marginBottom:10,padding:"8px 14px",background:"#00FF9D11",border:"1px solid #00FF9D44",borderRadius:10,fontSize:12,color:"#00FF9D"}}>{bonusMsg}</div>}
    {user&&selGroup&&weeklyStats&&weeklyStats.total>0&&<div style={{marginBottom:14,padding:"12px 16px",background:"linear-gradient(135deg,#0055ff11,#0d1117)",border:"1px solid #0055ff33",borderRadius:12,display:"flex",alignItems:"center",gap:12}}>
      <div style={{fontSize:26,lineHeight:1}}>📊</div>
      <div style={{flex:1}}>
        <div style={{fontSize:10,color:C.accent,fontWeight:700,letterSpacing:1.5,marginBottom:3}}>ESTA SEMANA</div>
        <div style={{display:"flex",gap:12,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:13,fontWeight:800,color:C.text}}>{weeklyStats.correct}/{weeklyStats.total} ✅</span>
          <span style={{fontSize:12,color:"#FFB800",fontWeight:700}}>+{weeklyStats.points} pts</span>
          <span style={{fontSize:11,color:C.dim}}>{weeklyStats.accuracy}% precisión</span>
          {weeklyStats.rank<=3&&<Tag c="#FFB800">#{weeklyStats.rank} en el grupo</Tag>}
        </div>
      </div>
      <button className="btn" onClick={goToGroup} style={{padding:"6px 12px",borderRadius:8,background:"#0055ff22",border:"1px solid #0055ff44",color:C.accent,fontSize:11,fontWeight:700,flexShrink:0}}>Ver →</button>
    </div>}
    {user&&pendingBets.length>0&&<div style={{marginBottom:22}}>
      {pendingBets.map(b=><div key={b.id} onClick={goToBets} style={{cursor:"pointer",padding:"10px 14px",background:"linear-gradient(135deg,#FFB80012,#0d1117)",border:"1px solid #FFB80055",borderRadius:10,marginBottom:6,display:"flex",alignItems:"center",gap:10}}>
        <span style={{fontSize:16}}>⚡</span>
        <div style={{flex:1}}><span style={{fontSize:12,fontWeight:700,color:"#FFB800"}}>Reto de apuesta</span><span style={{fontSize:11,color:C.dim}}> · {b.away_team} vs {b.home_team} · 🪙{b.amount}</span></div>
        <span style={{fontSize:10,color:"#FFB800",fontWeight:700}}>Ver →</span>
      </div>)}
    </div>}
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}><ST sub={`NBA ${getSeason()} · Hoy`}>Partidos del Día</ST><LiveBadge live={live.games}/></div>
    {user&&selGroup&&anyStarted&&<div style={{marginBottom:12,padding:"10px 14px",background:"#ff444411",border:"1px solid #ff444433",borderRadius:10,fontSize:11,color:"#ff6666",display:"flex",alignItems:"center",gap:8}}>🔒 Un partido ya empezó — picks cerrados para hoy</div>}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10,marginBottom:28}}>
      {games.length===0?<div style={{color:C.muted,fontSize:13}}>No hay partidos programados.</div>
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
        return <Card key={g.id} style={{padding:16,position:"relative",borderColor:isFinal&&picked?(correct?"#00FF9D55":"#ff444455"):isLive&&picked?`${tm(picked).color}55`:picked?`${tm(picked).color}44`:C.border,borderWidth:picked?2:1}}>
        {fp&&<FloatPts key={fp.key} pts={fp.pts} correct={fp.correct}/>}

        {/* Header: estado + tu pick */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {isLive?<Tag c="#ff4444">● EN VIVO {g.detail}</Tag>:isFinal?<Tag c={C.muted}>Terminado</Tag>
            :minsLeft!==null?(minsLeft<=1?<Tag c="#ff4444">⏱ Iniciando...</Tag>:minsLeft<=60?<Tag c={minsLeft<=15?"#ff6666":"#FF6B35"}>⏱ {minsLeft} min</Tag>:<Tag c={C.accent}>{g.detail||"Hoy"}</Tag>)
            :<Tag c={C.accent}>{g.detail||"Hoy"}</Tag>}
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            {isFinal&&picked&&(()=>{const ap=picksPoints[g.id];const c2=conf;return<Tag c={correct?"#00FF9D":"#ff4444"}>{correct?`✅ +${ap??dynPts(pickedPct,c2)} pts`:(c2>=2?`❌ ${ap??-dynPts(pickedPct,c2)} pts`:"❌ 0 pts")}</Tag>;})()}
            {isLive&&picked&&<Tag c={tm(picked).color}>● {picked}</Tag>}
            {!isFinal&&!isLive&&picked&&!lockedPicks&&<Tag c="#00FF9D">✓ {picked} · +{dynPts(pickedPct,conf)} pts</Tag>}
            {lockedPicks&&picked&&!isFinal&&<Tag c="#FF6B35">🔒 {picked}</Tag>}
          </div>
        </div>

        {/* Vista del juego — siempre visible */}
        <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:10,alignItems:"center"}}>
          {[["away",g.away,g.awayScore,awayPct],["vs"],["home",g.home,g.homeScore,homePct]].map((item,idx)=>
            idx===1
              ?<div key="vs" style={{textAlign:"center",fontSize:14,color:C.muted,fontWeight:900}}>VS</div>
              :canPick
                ?<button key={item[1]} className="btn" onClick={()=>makePick(g.id,item[1],g.home,g.away,conf,g)} style={{padding:"14px 8px",borderRadius:14,textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:5,background:picked===item[1]?`${tm(item[1]).color}22`:"#0a1018",border:`2.5px solid ${picked===item[1]?tm(item[1]).color:C.border}`,color:picked===item[1]?tm(item[1]).color:C.text,width:"100%",position:"relative"}}>
                    {picked===item[1]&&<div style={{position:"absolute",top:6,right:6,width:18,height:18,borderRadius:"50%",background:tm(item[1]).color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#07090f",fontWeight:900}}>✓</div>}
                    {logo(item[1],44)}
                    <span style={{fontSize:15,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif"}}>{item[1]}</span>
                    <span style={{fontSize:10,color:picked===item[1]?tm(item[1]).color:C.dim}}>{tm(item[1]).name}</span>
                    <span style={{fontSize:10,fontWeight:700,color:picked===item[1]?tm(item[1]).color:"#FFB800",background:picked===item[1]?"transparent":"#FFB80015",borderRadius:8,padding:"1px 6px",marginTop:2}}>+{dynBase(item[3]??50)} pts</span>
                  </button>
                :<div key={item[1]} style={{textAlign:"center",padding:"12px 8px",opacity:picked&&picked!==item[1]?0.35:1}}>
                    {logo(item[1],44)}
                    <div style={{fontSize:15,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:picked===item[1]?tm(item[1]).color:C.text,marginTop:5}}>{item[1]}</div>
                    {(isFinal||isLive)&&<div style={{fontSize:28,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:isFinal&&item[1]===winner?"#00FF9D":isLive&&picked===item[1]?tm(item[1]).color:C.text,marginTop:4}}>{item[2]}</div>}
                  </div>
          )}
        </div>

        {/* Confidence multiplier — visible al hacer pick */}
        {canPick&&picked&&<div style={{marginTop:10,display:"flex",alignItems:"center",gap:6,justifyContent:"center"}}>
          <span style={{fontSize:10,color:C.muted}}>Confianza:</span>
          {[1,2,3].map(c=>{const pts=dynPts(pickedPct,c);const labels={1:`✅ +${pts}`,2:`🔥 ±${pts}`,3:`⚡ ±${pts}`};const descs={1:"seguro",2:"riesgo",3:"alto riesgo"};return<button key={c} className="btn" onClick={()=>{setConfidence(cf=>({...cf,[g.id]:c}));makePick(g.id,picked,g.home,g.away,c,g);}} style={{padding:"5px 10px",borderRadius:8,background:conf===c?(c===1?`#00FF9D22`:c===2?`#FF6B3522`:`#ff444422`):"#0a1018",border:`1px solid ${conf===c?(c===1?"#00FF9D44":c===2?"#FF6B3544":"#ff444444"):C.border}`,color:conf===c?(c===1?"#00FF9D":c===2?"#FF6B35":"#ff4444"):C.muted,fontSize:10,fontWeight:700,display:"flex",flexDirection:"column",alignItems:"center",gap:1}}><span>{labels[c]}</span><span style={{fontSize:8,opacity:.7}}>{descs[c]}</span></button>;})}
        </div>}

        {/* Consenso del grupo — visible siempre cuando hay picks */}
        {selGroup&&!canPick&&gp.length>0&&<div style={{marginTop:10,padding:"8px 12px",background:"#0a1018",borderRadius:8,border:`1px solid ${C.border}`}}>
          <div style={{display:"flex",height:6,borderRadius:3,overflow:"hidden",marginBottom:6}}>
            <div style={{flex:forAway.length||0.01,background:tm(g.away).color}}/><div style={{flex:forHome.length||0.01,background:tm(g.home).color}}/>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",fontSize:10,fontWeight:700}}>
            <span style={{color:tm(g.away).color}}>{logo(g.away,12)} {gp.length?Math.round(forAway.length/gp.length*100):0}%</span>
            <span style={{color:C.muted,fontSize:9}}>{gp.length} picks del grupo</span>
            <span style={{color:tm(g.home).color}}>{gp.length?Math.round(forHome.length/gp.length*100):0}% {logo(g.home,12)}</span>
          </div>
        </div>}

        {/* Picks del grupo — solo disponible tras cerrar picks */}
        {lockedPicks&&selGroup&&<button className="btn" onClick={()=>setExpandedCard(showGrpSection?null:g.id)} style={{width:"100%",marginTop:8,padding:"8px",borderRadius:10,background:showGrpSection?`${C.accent}11`:"#0a1018",border:`1px solid ${showGrpSection?C.accent+"55":C.border}`,color:showGrpSection?C.accent:C.muted,fontSize:11,fontWeight:700,display:"flex",alignItems:"center",justifyContent:"center",gap:6}}>
          {showGrpSection?"▲ Ocultar":"👥 Ver quién eligió qué"}
        </button>}

        {showGrpSection&&<div style={{marginTop:10,padding:"12px",background:"#0a1018",borderRadius:10,border:`1px solid ${C.border}`}}>
          {gp.length===0
            ?<div style={{textAlign:"center",padding:"10px 0",color:C.muted,fontSize:12}}>Nadie en el grupo hizo pick aún</div>
            :<>
              <div style={{display:"flex",height:10,borderRadius:5,overflow:"hidden",marginBottom:8}}>
                <div style={{flex:forAway.length||0.01,background:tm(g.away).color}}/><div style={{flex:forHome.length||0.01,background:tm(g.home).color}}/>
              </div>
              <div style={{display:"flex",justifyContent:"space-between",fontSize:11,fontWeight:700,marginBottom:10}}>
                <span style={{color:tm(g.away).color,display:"flex",alignItems:"center",gap:4}}>{logo(g.away,14)} {g.away} {gp.length?Math.round(forAway.length/gp.length*100):0}%</span>
                <span style={{color:tm(g.home).color,display:"flex",alignItems:"center",gap:4}}>{gp.length?Math.round(forHome.length/gp.length*100):0}% {g.home} {logo(g.home,14)}</span>
              </div>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {gp.map((p,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:5,background:`${tm(p.picked_team).color}20`,border:`1.5px solid ${tm(p.picked_team).color}55`,borderRadius:22,padding:"4px 10px"}}>
                  <span style={{fontSize:13}}>{p.users?.avatar_emoji||"🏀"}</span>
                  <span style={{fontSize:11,color:C.text,fontWeight:700}}>{p.users?.name||"?"}</span>
                  {logo(p.picked_team,14)}
                </div>)}
              </div>
            </>}
        </div>}

        {/* Barra de probabilidad */}
        <div style={{display:"flex",alignItems:"center",gap:6,marginTop:10,fontSize:10}}>
          <span style={{color:tm(g.away).color,fontWeight:700,minWidth:34}}>{awayPct}%</span>
          <div style={{flex:1,height:5,borderRadius:3,background:C.border,overflow:"hidden"}}>
            <div style={{width:`${awayPct}%`,height:"100%",background:`linear-gradient(90deg,${tm(g.away).color},${tm(g.home).color})`,transition:"width .6s ease"}}/>
          </div>
          <span style={{color:tm(g.home).color,fontWeight:700,minWidth:34,textAlign:"right"}}>{homePct}%</span>
          <button className="btn" onClick={()=>setShowPctInfo(true)} style={{width:32,height:32,borderRadius:"50%",background:"#0a1018",border:`1px solid ${C.border}`,color:C.muted,fontSize:11,fontWeight:900,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,touchAction:"manipulation"}}>i</button>
        </div>
        {isLive&&<div style={{fontSize:9,color:"#ff4444",textAlign:"center",marginTop:4}}>● En vivo · basado en marcador</div>}
        {!isLive&&!isFinal&&<div style={{fontSize:9,color:C.muted,textAlign:"center",marginTop:4}}>% estimado de ganar este partido</div>}
        {/* Picks públicos — visible cuando hay picks del grupo */}
        {gp.length>0&&!showGrpSection&&<div style={{marginTop:10,paddingTop:10,borderTop:`1px solid ${C.border}`}}>
          <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:1.5,marginBottom:6}}>Tu grupo eligió</div>
          <div style={{display:"flex",gap:6,alignItems:"center"}}>
            <div style={{flex:1,height:6,borderRadius:3,overflow:"hidden",background:C.border,display:"flex"}}>
              <div style={{flex:forAway.length||0.01,background:tm(g.away).color,transition:"flex .5s ease"}}/>
              <div style={{flex:forHome.length||0.01,background:tm(g.home).color,transition:"flex .5s ease"}}/>
            </div>
          </div>
          <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:11,fontWeight:700}}>
            <span style={{color:tm(g.away).color}}>{g.away} {gp.length?Math.round(forAway.length/gp.length*100):0}%</span>
            <span style={{color:C.muted,fontSize:10}}>{gp.length} pick{gp.length!==1?"s":""}</span>
            <span style={{color:tm(g.home).color}}>{gp.length?Math.round(forHome.length/gp.length*100):0}% {g.home}</span>
          </div>
        </div>}
      </Card>;})}
    </div>

    {/* Modal info % */}
    {showPctInfo&&<div onClick={()=>setShowPctInfo(false)} style={{position:"fixed",inset:0,background:"#00000088",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.card,border:`1px solid ${C.border}`,borderRadius:18,padding:24,maxWidth:320,width:"100%"}}>
        <div style={{fontSize:16,fontWeight:800,color:C.text,marginBottom:14}}>ℹ️ ¿Qué significan los porcentajes?</div>
        <div style={{fontSize:13,color:C.dim,lineHeight:1.7,marginBottom:10}}>
          <b style={{color:C.accent}}>Partidos próximos:</b> calculamos qué tan probable es que gane cada equipo, usando sus victorias y derrotas en la temporada. El equipo local tiene una pequeña ventaja extra (+3%).
        </div>
        <div style={{fontSize:13,color:C.dim,lineHeight:1.7,marginBottom:10}}>
          <b style={{color:"#ff4444"}}>En vivo:</b> cambia en tiempo real según la diferencia de puntos en el marcador.
        </div>
        <div style={{fontSize:13,color:C.dim,lineHeight:1.7,marginBottom:18}}>
          <b style={{color:C.muted}}>Ejemplo:</b> si el marcador va 10-5, el equipo que va ganando tiene más % de ganar.
        </div>
        <button className="btn" onClick={()=>setShowPctInfo(false)} style={{width:"100%",padding:"12px",borderRadius:12,background:C.accent,color:"#07090f",fontWeight:800,fontSize:14}}>Entendido ✓</button>
      </div>
    </div>}

    {/* Botón global de cerrar picks */}
    {user&&selGroup&&!lockedPicks&&Object.keys(picks).length>0&&<>
      <div style={{background:"linear-gradient(135deg,#FF6B3511,#0d1117)",border:"1px solid #FF6B3533",borderRadius:14,padding:"16px 18px",marginBottom:10}}>
        <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:4}}>🔒 ¿Listo con tus picks de hoy?</div>
        <div style={{fontSize:11,color:C.dim,marginBottom:12}}>Al cerrar tus picks, podrás ver qué eligieron los demás en tu grupo. <b>Ya no podrás cambiarlos.</b></div>
        <button className="btn" onClick={lockAllPicks} style={{width:"100%",padding:"13px",borderRadius:12,background:"linear-gradient(135deg,#FF6B35,#ff9500)",color:"#07090f",fontWeight:900,fontSize:14,letterSpacing:.5}}>🔒 Cerrar mis picks y ver los del grupo</button>
      </div>
    </>}
    {user&&games.some(g=>g.status==="Final"&&picks[g.id])&&
      <button className="btn" onClick={shareResult} style={{width:"100%",padding:"14px",borderRadius:14,background:"linear-gradient(135deg,#a855f7,#7c3aed)",color:"#ffffff",fontWeight:900,fontSize:15,marginBottom:10,display:"flex",alignItems:"center",justifyContent:"center",gap:10}}>
        📤 Compartir mis resultados
      </button>
    }
  </div>);
};