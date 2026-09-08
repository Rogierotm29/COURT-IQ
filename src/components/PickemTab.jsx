import { useState, useEffect } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { T, APP_URL } from "../theme";
import { Card, ST, Tag, Spin } from "./ui";
import { tm, logo } from "./TeamLogo";
import { pickemAPI } from "../api/pickem";
import { calcWinPct, dynPts, dynBase } from "../utils/scoring";
import { getNameColor, getNamePrefix, getBorderColor } from "../utils/cosmetics";
import { autoSubscribePush } from "../utils/push";
import { SHOP_ITEMS, ACHIEVEMENT_DEFS } from "../data/shop";
import { getSeason } from "../utils/season";
import { getToday } from "../utils/date";
import { store } from "../utils/storage";
import { useCosmetics } from "../context/CosmeticsContext";


export const PickemTab=({games,standings,userCtx,picks,confidence,setConfidence,makePick,selGroup,setSelGroup,initSubTab,standalone})=>{
  const {user,save}=userCtx;
  const [name,setName]=useState("");const [groups,setGroups]=useState([]);
  const [newGroupName,setNewGroupName]=useState("");const [joinCode,setJoinCode]=useState("");
  const [panel,setPanel]=useState(null);
  const [pin,setPin]=useState(["","","",""]);
  const [subTab,setSubTab]=useState(initSubTab||"ranking");
  const [msg,setMsg]=useState("");const [loading,setLoading]=useState(false);
  const [copied,setCopied]=useState(false);
  const [leaderboard,setLeaderboard]=useState([]);
  const [nameStatus,setNameStatus]=useState(null);
  const [picksPoints,setPicksPoints]=useState({});
  const [history,setHistory]=useState([]);
  const [grpPicks,setGrpPicks]=useState([]);
  const [balance,setBalance]=useState(null);
  const [bets,setBets]=useState([]);
  const [betGame,setBetGame]=useState(null);
  const [betAmt,setBetAmt]=useState(50);
  const [betTeam,setBetTeam]=useState(null);
  const [betLoading,setBetLoading]=useState(false);
  const [periodLb,setPeriodLb]=useState([]);
  const [betOpponent,setBetOpponent]=useState(null);
  const [chat,setChat]=useState([]);const [chatInput,setChatInput]=useState("");const [chatLoading,setChatLoading]=useState(false);
  const [h2hUser,setH2hUser]=useState(null);const [h2hData,setH2hData]=useState(null);
  const [streaks,setStreaks]=useState({});
  const [lbPeriod,setLbPeriod]=useState("season");
  const [dailyWinner,setDailyWinner]=useState(null);
  const [myStatsData,setMyStatsData]=useState(null);
  const [parlay,setParlay]=useState(null);const [parlaySelections,setParlaySelections]=useState({});const [parlayLoading,setParlayLoading]=useState(false);
  const [lockedPicks,setLockedPicks]=useState(false);
  const [authMode,setAuthMode]=useState("auto");
  const [recCode,setRecCode]=useState("");
  const [recInput,setRecInput]=useState("");
  const [recNewPin,setRecNewPin]=useState(["","","",""]);
  const [pendingUser,setPendingUser]=useState(null);
  const [biometricAvail,setBiometricAvail]=useState(false);
  const [regEmail,setRegEmail]=useState("");
  const [recoveryEmail,setRecoveryEmail]=useState("");
  const [recoveryCode6,setRecoveryCode6]=useState("");
  const [recoveryNewPin,setRecoveryNewPin]=useState(["","","",""]);
  const [editGroup,setEditGroup]=useState(false);const [editGroupName,setEditGroupName]=useState("");const [editGroupEmoji,setEditGroupEmoji]=useState("");
  const [profileModal,setProfileModal]=useState(null);const [profileData,setProfileData]=useState(null);
  const gameStatusKey = games.map(g=>`${g.id}:${g.status}`).join("|");
  const { items:shopItems, equipped:myEquipped, shields, useShield } = useCosmetics();
  const [confirmLeave,setConfirmLeave]=useState(false);
  const [leaveLoading,setLeaveLoading]=useState(false);

  const now=new Date();
  const upcoming=games.filter(g=>g.startTime?now<new Date(g.startTime):g.status==="Upcoming");
  const finished=games.filter(g=>g.status==="Final");const liveGames=games.filter(g=>g.status==="LIVE");
  const allGames=[...liveGames,...upcoming,...finished];
  const anyStarted=liveGames.length>0||finished.length>0;

  /* ── estilos reutilizables ── */
  const inputBase={background:T.surface[2],border:`1px solid ${T.border.base}`,borderRadius:T.radius.base,padding:`${T.space[3]}px ${T.space[4]}px`,color:T.text.primary,fontSize:T.font.sm,boxSizing:"border-box"};
  const btnPrimary={background:T.accent.base,color:"#fff",borderRadius:T.radius.base,fontWeight:600};
  const btnGhost={background:T.surface[2],border:`1px solid ${T.border.base}`,color:T.text.secondary,borderRadius:T.radius.base,fontWeight:600};
  const label={fontSize:T.font.xs,color:T.text.tertiary,textTransform:"uppercase",letterSpacing:1.2,fontWeight:600};
  const statNum={fontSize:T.font.xl,fontWeight:700,color:T.text.primary,letterSpacing:-0.4};

  useEffect(()=>{
    if(!name.trim()||name.trim().length<2){setNameStatus(null);return;}
    setNameStatus("checking");
    const t=setTimeout(async()=>{
      const d=await pickemAPI("checkUsername",{params:{name:name.trim()}});
      if(d.ok)setNameStatus(d.available?"available":"taken");
    },500);
    return()=>clearTimeout(t);
  },[name]);

  useEffect(()=>{
    if(!user) return;
    pickemAPI("myGroups",{params:{userId:user.id}}).then(d=>{
      if(d.ok&&d.groups?.length) setGroups(d.groups);
    });
    const invite=store.get("courtiq_invite_code");
    if(invite){store.remove("courtiq_invite_code");setJoinCode(invite);setPanel("join");}
  },[user]);

  useEffect(()=>{
    if(user) return;
    if(!('PasswordCredential' in window)) return;
    setBiometricAvail(true);
    navigator.credentials.get({password:true,mediation:"optional"})
      .then(cred=>{if(cred?.type==="password"){setName(cred.id);const d=cred.password.replace(/\D/g,"").slice(0,4).split("");if(d.length===4)setPin(d);}})
      .catch(()=>{});
  },[user]);

  useEffect(()=>{
    if(selGroup){
      store.set("courtiq_lastgroup",selGroup.id);
      store.setJSON("courtiq_lastgroup_obj",selGroup);
      
    }
  },[selGroup]);

  useEffect(()=>{
    if(!user||!selGroup) return;
    const today=getToday();
    setLockedPicks(!!store.get(`courtiq_locked_${selGroup.id}_${today}`));
    pickemAPI("myPicks",{params:{userId:user.id,groupId:selGroup.id,date:today}}).then(d=>{
      if(d.ok){const pts={};(d.picks||[]).forEach(p=>{if(p.points!=null)pts[p.game_id]=p.points;});setPicksPoints(pts);}
    });
    pickemAPI("leaderboard",{params:{groupId:selGroup.id}}).then(d=>{
      if(!d.ok) return;
      const lb=d.leaderboard||[];
      setLeaderboard(lb);
      // Las rachas ahora vienen en la misma respuesta — sin N+1
      setStreaks(Object.fromEntries(lb.map(r=>[r.user_id,r.streak||0])));
    });
    pickemAPI("dailyWinner",{params:{groupId:selGroup.id,date:getToday()}}).then(d=>{if(d.ok)setDailyWinner(d.winner);});
  },[user,selGroup]);

  useEffect(()=>{
    if(!selGroup||lbPeriod==="season") return;
    pickemAPI("periodLeaderboard",{params:{groupId:selGroup.id,period:lbPeriod}}).then(d=>{
      if(d.ok) setPeriodLb(d.leaderboard||[]);
    });
  },[selGroup,lbPeriod]);

  useEffect(()=>{
    if(!user||!selGroup) return;
    if(subTab==="historial") pickemAPI("pickHistory",{params:{userId:user.id,groupId:selGroup.id}}).then(d=>{if(d.ok)setHistory(d.picks||[]);});
    if(subTab==="apuestas"){
      pickemAPI("getBalance",{params:{userId:user.id,groupId:selGroup.id,date:getToday()}}).then(d=>{if(d.ok)setBalance(d.balance);});
      pickemAPI("groupBets",{params:{groupId:selGroup.id}}).then(d=>{if(d.ok)setBets(d.bets||[]);});
    }
    if(subTab==="chat") pickemAPI("getChat",{params:{groupId:selGroup.id}}).then(d=>{if(d.ok)setChat(d.messages||[]);});
    if(subTab==="estadisticas") pickemAPI("myStats",{params:{userId:user.id}}).then(d=>{if(d.ok)setMyStatsData(d.stats);});
    if(subTab==="parlay"){
      pickemAPI("myParlay",{params:{userId:user.id,groupId:selGroup.id}}).then(d=>{if(d.ok)setParlay(d.parlay);});
      pickemAPI("getBalance",{params:{userId:user.id,groupId:selGroup.id,date:getToday()}}).then(d=>{if(d.ok)setBalance(d.balance);});
    }
  },[subTab,user,selGroup]);

  useEffect(()=>{
    if(!user) return;
    pickemAPI("checkAchievements",{params:{userId:user.id,groupId:store.get("courtiq_lastgroup")||""}})
      .then(d=>{if(!d.ok)console.warn("checkAchievements:",d.error);});
  },[user]);



  useEffect(()=>{
    if(!user||!selGroup) return;
    pickemAPI("groupPicks",{params:{groupId:selGroup.id,date:getToday()}}).then(d=>{if(d.ok)setGrpPicks(d.picks||[]);});
    },[user,selGroup,gameStatusKey]);

  const register=async()=>{
    if(!name.trim()) return;
    setLoading(true);
    const rawPin=pin.join("");
    const emailToSend=regEmail.trim()||undefined;
    const d=await pickemAPI("register",{body:{name:name.trim(),pin:rawPin,email:emailToSend}});
    if(d.ok){
      if('PasswordCredential' in window){try{const c=new PasswordCredential({id:name.trim(),password:rawPin,name:name.trim()});navigator.credentials.store(c);}catch{}}
      if(!d.reconnected&&d.recoveryCode){setPendingUser(d.user);setRecCode(d.recoveryCode);}
      else{save(d.user);autoSubscribePush(d.user.id);}
    }else setMsg(d.error||"Error");
    setLoading(false);
  };

  const resetPin=async()=>{
    if(!name.trim()||recInput.length!==8||recNewPin.join("").length!==4) return;
    setLoading(true);
    const d=await pickemAPI("resetPin",{body:{name:name.trim(),recoveryCode:recInput,newPin:recNewPin.join("")}});
    if(d.ok){setAuthMode("auto");setMsg("PIN actualizado. Ya puedes entrar.");setRecInput("");setRecNewPin(["","","",""]);setPin(["","","",""]);}
    else setMsg(d.error||"Error");
    setLoading(false);
  };

  const sendForgotPin=async()=>{
    if(!recoveryEmail.trim()) return;
    setLoading(true);
    const d=await pickemAPI("forgotPin",{body:{email:recoveryEmail.trim()}});
    if(d.ok){setAuthMode("emailCode");setMsg("");}
    else setMsg(d.error||"Error");
    setLoading(false);
  };

  const confirmEmailReset=async()=>{
    if(!recoveryEmail.trim()||recoveryCode6.length!==6||recoveryNewPin.join("").length!==4) return;
    setLoading(true);
    const d=await pickemAPI("resetPinByEmail",{body:{email:recoveryEmail.trim(),code:recoveryCode6,newPin:recoveryNewPin.join("")}});
    if(d.ok){setAuthMode("auto");setMsg("PIN actualizado. Ya puedes entrar.");setRecoveryCode6("");setRecoveryNewPin(["","","",""]);}
    else setMsg(d.error||"Error");
    setLoading(false);
  };

  const createGroup=async()=>{
    if(!newGroupName.trim()) return;
    setLoading(true);
    const d=await pickemAPI("createGroup",{body:{name:newGroupName.trim(),userId:user.id}});
    if(d.ok){setGroups(g=>[...g,d.group]);setSelGroup(d.group);setPanel(null);setNewGroupName("");setMsg(`Grupo creado. Comparte el código: ${d.group.code}`);}
    else setMsg(d.error);
    setLoading(false);
  };

  const leaveGroup=async()=>{
    if(!selGroup) return;
    setLeaveLoading(true);
    const d=await pickemAPI("leaveGroup",{body:{userId:user.id,groupId:selGroup.id}});
    if(d.ok){
      const remaining=groups.filter(g=>g.id!==selGroup.id);
      setGroups(remaining);
      setSelGroup(remaining[0]||null);
      setConfirmLeave(false);
      setMsg(d.groupDeleted?"Saliste del grupo y se eliminó por quedar vacío":"Saliste del grupo");
    } else setMsg(d.error);
    setLeaveLoading(false);
  };

  const joinGroup=async()=>{
    if(!joinCode.trim()) return;
    setLoading(true);
    const d=await pickemAPI("joinGroup",{body:{code:joinCode.trim(),userId:user.id}});
    if(d.ok){
      if(!d.already){setGroups(g=>[...g,d.group]);setMsg("Te uniste al grupo");}
      else setMsg("Ya estás en este grupo");
      setSelGroup(d.group);setPanel(null);setJoinCode("");
    } else setMsg(d.error);
    setLoading(false);
  };

  const copyCode=()=>{
    if(!selGroup) return;
    navigator.clipboard?.writeText(selGroup.code).then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);}).catch(()=>{});
  };

  const shareGroup=()=>{
    if(!selGroup) return;
    const url=`${window.location.origin}?join=${selGroup.code}`;
    const text=`Únete a mi grupo "${selGroup.name}" en Court IQ. Código: ${selGroup.code}\n${url}`;
    if(navigator.share){navigator.share({title:"Court IQ — "+selGroup.name,text,url}).catch(()=>{});}
    else{window.open(`https://wa.me/?text=${encodeURIComponent(text)}`,"_blank");}
  };

  const doBet=async()=>{
    if(!betGame||!betTeam||betAmt<10) return;
    setBetLoading(true);
    const d=await pickemAPI("createBet",{body:{userId:user.id,groupId:selGroup.id,gameId:betGame.id,amount:betAmt,pickedTeam:betTeam,homeTeam:betGame.home,awayTeam:betGame.away}});
    if(d.ok){
      setBalance(b=>b-betAmt);
      pickemAPI("groupBets",{params:{groupId:selGroup.id}}).then(r=>{if(r.ok)setBets(r.bets||[]);});
      setBetGame(null);setBetTeam(null);setMsg(`Apuesta de ${betAmt} monedas enviada al grupo`);
    } else setMsg(d.error);
    setBetLoading(false);
  };

  const doAcceptBet=async(bet)=>{
    setBetLoading(true);
    const d=await pickemAPI("acceptBet",{body:{userId:user.id,betId:bet.id}});
    if(d.ok){
      setBalance(b=>b-bet.amount);
      setBets(prev=>prev.map(b=>b.id===bet.id?{...b,status:"active",opponent_id:user.id}:b));
      setMsg("Apuesta aceptada");
    } else setMsg(d.error);
    setBetLoading(false);
  };

  const doCancelBet=async(bet)=>{
    const d=await pickemAPI("cancelBet",{body:{userId:user.id,betId:bet.id}});
    if(d.ok){setBets(prev=>prev.filter(b=>b.id!==bet.id));setBalance(b=>b+bet.amount);setMsg("Apuesta cancelada");}
    else setMsg(d.error);
  };

  const sendChat=async()=>{
    if(!chatInput.trim()||!selGroup) return;
    setChatLoading(true);
    const content=chatInput.trim();setChatInput("");
    const d=await pickemAPI("sendChat",{body:{userId:user.id,groupId:selGroup.id,content}});
    if(d.ok) setChat(prev=>[...prev,{user_id:user.id,content,users:{name:user.name,avatar_emoji:user.avatar_emoji||"🏀"},created_at:new Date().toISOString()}]);
    setChatLoading(false);
  };

  const loadH2H=async(r)=>{
    setH2hUser(r);setH2hData(null);
    const d=await pickemAPI("headToHead",{params:{userId:user.id,opponentId:r.user_id,groupId:selGroup.id}});
    if(d.ok) setH2hData(d);
  };

  const openProfile=async(r)=>{
    setProfileModal(r);setProfileData(null);
    const d=await pickemAPI("userProfile",{params:{userId:user.id,targetId:r.user_id}});
    if(d.ok) setProfileData(d);
  };

  const sharePicksImage=(date,dayPicks)=>{
    const W=400,ROW=52,HEADER=80,FOOTER=50;
    const H=HEADER+dayPicks.length*ROW+FOOTER;
    const canvas=document.createElement("canvas");
    canvas.width=W*2;canvas.height=H*2;
    const ctx=canvas.getContext("2d");
    ctx.scale(2,2);
    ctx.fillStyle=T.surface[0];ctx.fillRect(0,0,W,H);
    ctx.fillStyle=T.accent.base;ctx.fillRect(0,0,W,3);
    ctx.fillStyle=T.text.primary;ctx.font="bold 15px Arial,sans-serif";ctx.fillText("Court IQ",16,28);
    ctx.fillStyle=T.text.tertiary;ctx.font="11px Arial,sans-serif";
    ctx.fillText(new Date(date+"T12:00:00").toLocaleDateString("es",{weekday:"long",month:"short",day:"numeric"}),16,46);
    const correct=dayPicks.filter(p=>p.correct).length;
    const pts=dayPicks.reduce((s,p)=>s+(p.points||0),0);
    ctx.fillStyle=T.accent.base;ctx.font="bold 11px Arial,sans-serif";ctx.textAlign="right";
    ctx.fillText(`${correct}/${dayPicks.length}  +${pts} pts`,W-16,28);
    ctx.textAlign="left";
    dayPicks.forEach((p,i)=>{
      const y=HEADER+i*ROW;
      const rival=p.picked_team===p.home_team?p.away_team:p.home_team;
      const accent=p.scored?(p.correct?T.success.base:T.danger.base):T.text.disabled;
      ctx.fillStyle=T.surface[1];ctx.fillRect(0,y,W,ROW-2);
      ctx.fillStyle=accent;ctx.fillRect(0,y,3,ROW-2);
      ctx.fillStyle=T.text.primary;ctx.font="bold 14px Arial,sans-serif";ctx.fillText(p.picked_team,16,y+22);
      ctx.fillStyle=T.text.tertiary;ctx.font="11px Arial,sans-serif";ctx.fillText(`vs ${rival}`,16,y+38);
      if(p.scored){ctx.fillStyle=accent;ctx.font="bold 12px Arial,sans-serif";ctx.textAlign="right";ctx.fillText(p.correct?`+${p.points||0}`:`${p.points||0}`,W-16,y+26);ctx.textAlign="left";}
    });
    ctx.fillStyle=T.surface[1];ctx.fillRect(0,H-FOOTER,W,FOOTER);
    ctx.fillStyle=T.text.tertiary;ctx.font="10px Arial,sans-serif";ctx.textAlign="center";ctx.fillText(APP_URL,W/2,H-16);ctx.textAlign="left";
    canvas.toBlob(async blob=>{
      if(navigator.share&&blob&&navigator.canShare?.({files:[new File([blob],"picks.png",{type:"image/png"})]})){
        try{await navigator.share({files:[new File([blob],"picks.png",{type:"image/png"})],title:"Mis picks Court IQ"});return;}catch(_){}
      }
      const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download=`picks-${date}.png`;a.click();URL.revokeObjectURL(url);
    },"image/png");
  };

  const doChallengeBet=async()=>{
    if(!betGame||!betTeam||betAmt<10||!betOpponent) return;
    setBetLoading(true);
    const d=await pickemAPI("challengeBet",{body:{userId:user.id,groupId:selGroup.id,gameId:betGame.id,amount:betAmt,pickedTeam:betTeam,homeTeam:betGame.home,awayTeam:betGame.away,opponentId:betOpponent.userId}});
    if(d.ok){setBalance(b=>b-betAmt);setBetGame(null);setBetTeam(null);setBetOpponent(null);setMsg(`Reto enviado a ${betOpponent.name}`);pickemAPI("groupBets",{params:{groupId:selGroup.id}}).then(r=>{if(r.ok)setBets(r.bets||[]);});}
    else setMsg(d.error);
    setBetLoading(false);
  };

  const myRank=leaderboard.findIndex(r=>r.user_id===user?.id);
  const myLbStats=leaderboard.find(r=>r.user_id===user?.id);

  const pinBox=(arr,setArr,prefix)=>(
    <div style={{display:"flex",gap:T.space[2],justifyContent:"center",marginBottom:T.space[4]}}>
      {[0,1,2,3].map(i=><input key={i} id={`${prefix}-${i}`} type="tel" maxLength={1} value={arr[i]||""}
        onChange={e=>{const v=e.target.value.replace(/\D/g,"");if(v.length<=1){const np=[...arr];np[i]=v;setArr(np);if(v&&i<3)document.getElementById(`${prefix}-${i+1}`)?.focus();}}}
        onKeyDown={e=>{if(e.key==="Backspace"&&!arr[i]&&i>0)document.getElementById(`${prefix}-${i-1}`)?.focus();}}
        style={{width:50,height:54,background:T.surface[2],border:`1px solid ${arr[i]?T.accent.base:T.border.base}`,borderRadius:T.radius.base,color:T.text.primary,fontSize:T.font.xl,fontWeight:700,textAlign:"center"}}/>)}
    </div>
  );

  // ─── NO REGISTRADO ───
  if(!user) return(<div className="fade-up">
    <ST sub="Pick'em">Court IQ</ST>

    {recCode&&pendingUser&&<Card style={{maxWidth:420,margin:"0 auto",textAlign:"center",padding:T.space[6]}}>
      <div style={{fontSize:T.font.xl,fontWeight:700,color:T.text.primary,marginBottom:T.space[2]}}>Cuenta creada</div>
      <div style={{fontSize:T.font.sm,color:T.text.secondary,marginBottom:T.space[5],lineHeight:1.5}}>Guarda este código de recuperación. Lo necesitarás si olvidas tu PIN.</div>
      <div style={{background:T.surface[2],border:`1px dashed ${T.accent.border}`,borderRadius:T.radius.base,padding:`${T.space[5]}px ${T.space[5]}px`,marginBottom:T.space[4]}}>
        <div style={{...label,marginBottom:T.space[2]}}>Código de recuperación</div>
        <div style={{fontSize:T.font["2xl"],fontWeight:700,letterSpacing:6,color:T.accent.base}}>{recCode}</div>
      </div>
      <div style={{fontSize:T.font.xs,color:T.warning.base,marginBottom:T.space[5],padding:`${T.space[2]}px ${T.space[3]}px`,background:T.warning.subtle,border:`1px solid ${T.warning.border}`,borderRadius:T.radius.sm}}>Toma captura ahora. No se puede recuperar después.</div>
      <button className="btn" onClick={()=>{save(pendingUser);autoSubscribePush(pendingUser.id);setRecCode("");setPendingUser(null);}} style={{...btnPrimary,width:"100%",padding:T.space[3],fontSize:T.font.base}}>Entrar</button>
    </Card>}

    {!recCode&&authMode==="emailRecovery"&&<Card style={{maxWidth:420,margin:"0 auto",textAlign:"center",padding:T.space[6]}}>
      <div style={{fontSize:T.font.xl,fontWeight:700,color:T.text.primary,marginBottom:T.space[2]}}>Recuperar PIN</div>
      <div style={{fontSize:T.font.sm,color:T.text.secondary,marginBottom:T.space[5],lineHeight:1.5}}>Te mandaremos un código de 6 dígitos al correo vinculado a tu cuenta.</div>
      <input value={recoveryEmail} onChange={e=>setRecoveryEmail(e.target.value)} type="email" placeholder="tu@correo.com" style={{...inputBase,width:"100%",textAlign:"center",marginBottom:T.space[4]}}/>
      <button className="btn" onClick={sendForgotPin} disabled={loading||!recoveryEmail.trim()} style={{...(recoveryEmail.trim()?btnPrimary:btnGhost),width:"100%",padding:T.space[3],fontSize:T.font.base,marginBottom:T.space[3]}}>{loading?<Spin s={14}/>:"Enviar código"}</button>
      <button className="btn" onClick={()=>{setAuthMode("auto");setMsg("");}} style={{background:"none",color:T.text.tertiary,fontSize:T.font.sm,padding:T.space[2]}}>Volver</button>
      {msg&&<div style={{marginTop:T.space[3],fontSize:T.font.sm,color:T.danger.base}}>{msg}</div>}
    </Card>}

    {!recCode&&authMode==="emailCode"&&<Card style={{maxWidth:420,margin:"0 auto",textAlign:"center",padding:T.space[6]}}>
      <div style={{fontSize:T.font.xl,fontWeight:700,color:T.text.primary,marginBottom:T.space[2]}}>Revisa tu correo</div>
      <div style={{fontSize:T.font.sm,color:T.text.secondary}}>Enviamos un código a</div>
      <div style={{fontSize:T.font.sm,fontWeight:600,color:T.accent.base,marginBottom:T.space[5]}}>{recoveryEmail}</div>
      <div style={{...label,textAlign:"left",marginBottom:T.space[2]}}>Código de 6 dígitos</div>
      <input value={recoveryCode6} onChange={e=>setRecoveryCode6(e.target.value.replace(/\D/g,"").slice(0,6))} type="tel" placeholder="000000" maxLength={6} style={{...inputBase,width:"100%",fontSize:T.font.xl,fontWeight:700,textAlign:"center",letterSpacing:8,marginBottom:T.space[4],borderColor:recoveryCode6.length===6?T.accent.base:T.border.base}}/>
      <div style={{...label,textAlign:"left",marginBottom:T.space[2]}}>Nuevo PIN</div>
      {pinBox(recoveryNewPin,setRecoveryNewPin,"epin")}
      <button className="btn" onClick={confirmEmailReset} disabled={loading||recoveryCode6.length!==6||recoveryNewPin.join("").length!==4} style={{...(recoveryCode6.length===6&&recoveryNewPin.join("").length===4?btnPrimary:btnGhost),width:"100%",padding:T.space[3],fontSize:T.font.base,marginBottom:T.space[3]}}>{loading?<Spin s={14}/>:"Cambiar PIN"}</button>
      <button className="btn" onClick={()=>{setAuthMode("emailRecovery");setMsg("");}} style={{background:"none",color:T.text.tertiary,fontSize:T.font.sm,padding:T.space[1]}}>Reenviar código</button>
      {msg&&<div style={{marginTop:T.space[3],fontSize:T.font.sm,color:msg.includes("actualizado")?T.success.base:T.danger.base}}>{msg}</div>}
    </Card>}

    {!recCode&&authMode==="recovery"&&<Card style={{maxWidth:420,margin:"0 auto",textAlign:"center",padding:T.space[6]}}>
      <div style={{fontSize:T.font.xl,fontWeight:700,color:T.text.primary,marginBottom:T.space[2]}}>Recuperar con código</div>
      <div style={{fontSize:T.font.sm,color:T.text.secondary,marginBottom:T.space[5],lineHeight:1.5}}>Ingresa tu nombre y el código de 8 caracteres que guardaste al registrarte.</div>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="Tu nombre" style={{...inputBase,width:"100%",textAlign:"center",marginBottom:T.space[3]}}/>
      <input value={recInput} onChange={e=>setRecInput(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g,""))} placeholder="CÓDIGO" maxLength={8} style={{...inputBase,width:"100%",fontSize:T.font.lg,fontWeight:700,textAlign:"center",letterSpacing:5,marginBottom:T.space[3],borderColor:recInput.length===8?T.accent.base:T.border.base}}/>
      <div style={{...label,textAlign:"left",marginBottom:T.space[2]}}>Nuevo PIN</div>
      {pinBox(recNewPin,setRecNewPin,"rpin")}
      <button className="btn" onClick={resetPin} disabled={loading||!name.trim()||recInput.length!==8||recNewPin.join("").length!==4} style={{...(name.trim()&&recInput.length===8&&recNewPin.join("").length===4?btnPrimary:btnGhost),width:"100%",padding:T.space[3],fontSize:T.font.base,marginBottom:T.space[3]}}>{loading?<Spin s={14}/>:"Recuperar cuenta"}</button>
      <button className="btn" onClick={()=>{setAuthMode("auto");setMsg("");}} style={{background:"none",color:T.text.tertiary,fontSize:T.font.sm,padding:T.space[2]}}>Volver</button>
      {msg&&<div style={{marginTop:T.space[3],fontSize:T.font.sm,color:msg.includes("actualizado")?T.success.base:T.danger.base}}>{msg}</div>}
    </Card>}

    {!recCode&&authMode==="auto"&&<Card style={{maxWidth:420,margin:"0 auto",textAlign:"center",padding:T.space[6]}}>
      <div style={{fontSize:T.font.xl,fontWeight:700,color:T.text.primary,marginBottom:T.space[2]}}>{nameStatus==="taken"?"Bienvenido de vuelta":"Únete al Pick'em"}</div>
      <div style={{fontSize:T.font.sm,color:T.text.secondary,marginBottom:T.space[5],lineHeight:1.5}}>{nameStatus==="taken"?"Ingresa tu PIN para entrar.":"Elige un nombre y un PIN para crear tu cuenta."}</div>
      <input value={name} onChange={e=>setName(e.target.value)} placeholder="Tu nombre" style={{...inputBase,width:"100%",textAlign:"center",borderColor:nameStatus==="available"?T.success.base:nameStatus==="taken"?T.accent.base:T.border.base,marginBottom:T.space[2]}}/>
      {nameStatus==="checking"&&<div style={{fontSize:T.font.xs,color:T.text.tertiary,marginBottom:T.space[2]}}>Verificando…</div>}
      {nameStatus==="available"&&<div style={{fontSize:T.font.xs,color:T.success.base,marginBottom:T.space[2]}}>Nombre disponible</div>}
      {nameStatus==="taken"&&<div style={{fontSize:T.font.xs,color:T.accent.base,marginBottom:T.space[2]}}>Cuenta encontrada — ingresa tu PIN</div>}
      <div style={{...label,textAlign:"left",marginBottom:T.space[2]}}>PIN de 4 dígitos</div>
      {pinBox(pin,setPin,"pin")}
      {nameStatus==="available"&&<div style={{marginBottom:T.space[4]}}>
        <div style={{...label,textAlign:"left",marginBottom:T.space[2]}}>Correo (opcional)</div>
        <input value={regEmail} onChange={e=>setRegEmail(e.target.value)} type="email" placeholder="tu@correo.com" style={{...inputBase,width:"100%",textAlign:"center"}}/>
      </div>}
      <button className="btn" onClick={register} disabled={loading||nameStatus==="checking"||!name.trim()} style={{...(pin.join("").length===4&&name.trim()?btnPrimary:btnGhost),width:"100%",padding:T.space[3],fontSize:T.font.base}}>{loading?<Spin s={14}/>:nameStatus==="taken"?"Entrar":"Crear cuenta"}</button>
      {nameStatus==="taken"&&<div style={{marginTop:T.space[3],display:"flex",flexDirection:"column",gap:T.space[2],alignItems:"center"}}>
        {biometricAvail&&<button className="btn" onClick={()=>navigator.credentials.get({password:true,mediation:"required"}).then(cred=>{if(cred?.type==="password"){setName(cred.id);const d=cred.password.replace(/\D/g,"").slice(0,4).split("");if(d.length===4)setPin(d);}}).catch(()=>{})} style={{...btnGhost,width:"100%",padding:T.space[3],fontSize:T.font.sm}}>Usar huella o desbloqueo</button>}
        <div style={{display:"flex",gap:T.space[4]}}>
          <button className="btn" onClick={()=>{setAuthMode("emailRecovery");setMsg("");}} style={{background:"none",color:T.accent.base,fontSize:T.font.xs,padding:T.space[1]}}>Recuperar por correo</button>
          <button className="btn" onClick={()=>{setAuthMode("recovery");setMsg("");}} style={{background:"none",color:T.text.tertiary,fontSize:T.font.xs,padding:T.space[1]}}>Tengo código</button>
        </div>
      </div>}
      {msg&&<div style={{marginTop:T.space[3],fontSize:T.font.sm,color:T.danger.base}}>{msg}</div>}
    </Card>}
  </div>);

  // ─── VISTA PRINCIPAL ───
  return(<div className="fade-up">
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:T.space[4]}}>
      <div>
        <div style={label}>Hola {user.name}</div>
        <div style={{fontSize:T.font.xl,fontWeight:700,color:T.text.primary,letterSpacing:-0.4}}>Pick'em</div>
      </div>
      <div style={{display:"flex",gap:T.space[2]}}>
        <button className="btn" onClick={()=>setPanel(panel==="join"?null:"join")} style={{padding:`${T.space[2]}px ${T.space[3]}px`,borderRadius:T.radius.sm,background:panel==="join"?T.accent.subtle:T.surface[2],border:`1px solid ${panel==="join"?T.accent.base:T.border.base}`,color:panel==="join"?T.accent.base:T.text.secondary,fontSize:T.font.xs,fontWeight:600}}>Unirse</button>
        <button className="btn" onClick={()=>setPanel(panel==="create"?null:"create")} style={{padding:`${T.space[2]}px ${T.space[3]}px`,borderRadius:T.radius.sm,background:panel==="create"?T.accent.subtle:T.surface[2],border:`1px solid ${panel==="create"?T.accent.base:T.border.base}`,color:panel==="create"?T.accent.base:T.text.secondary,fontSize:T.font.xs,fontWeight:600}}>Crear</button>
      </div>
    </div>

    {msg&&<div style={{marginBottom:T.space[3],padding:`${T.space[3]}px ${T.space[4]}px`,background:T.surface[1],border:`1px solid ${T.border.base}`,borderLeft:`3px solid ${T.accent.base}`,borderRadius:T.radius.sm,fontSize:T.font.sm,color:T.text.secondary,display:"flex",justifyContent:"space-between",alignItems:"center",gap:T.space[3]}}>{msg}<button className="btn" onClick={()=>setMsg("")} style={{background:"none",color:T.text.tertiary,fontSize:T.font.base,padding:0}}>×</button></div>}

    {panel==="create"&&<Card style={{marginBottom:T.space[4]}}>
      <div style={{fontSize:T.font.base,fontWeight:600,color:T.text.primary,marginBottom:T.space[3]}}>Crear nuevo grupo</div>
      <div style={{display:"flex",gap:T.space[2],flexWrap:"wrap"}}>
        <input value={newGroupName} onChange={e=>setNewGroupName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&createGroup()} placeholder="Nombre del grupo" style={{...inputBase,flex:1}}/>
        <button className="btn" onClick={createGroup} disabled={loading} style={{...btnPrimary,padding:`${T.space[3]}px ${T.space[5]}px`,fontSize:T.font.sm}}>{loading?<Spin s={13}/>:"Crear"}</button>
      </div>
      <div style={{fontSize:T.font.xs,color:T.text.tertiary,marginTop:T.space[2]}}>Se generará un código para invitar amigos</div>
    </Card>}

    {panel==="join"&&<Card style={{marginBottom:T.space[4]}}>
      <div style={{fontSize:T.font.base,fontWeight:600,color:T.text.primary,marginBottom:T.space[3]}}>Unirse a un grupo</div>
      <div style={{display:"flex",gap:T.space[2],flexWrap:"wrap"}}>
        <input value={joinCode} onChange={e=>setJoinCode(e.target.value.toUpperCase())} onKeyDown={e=>e.key==="Enter"&&joinGroup()} placeholder="CÓDIGO" maxLength={6} style={{...inputBase,flex:1,fontSize:T.font.lg,fontWeight:700,letterSpacing:5,textAlign:"center"}}/>
        <button className="btn" onClick={joinGroup} disabled={loading} style={{...btnPrimary,padding:`${T.space[3]}px ${T.space[5]}px`,fontSize:T.font.sm}}>{loading?<Spin s={13}/>:"Entrar"}</button>
      </div>
      <div style={{fontSize:T.font.xs,color:T.text.tertiary,marginTop:T.space[2]}}>Pide el código de 6 letras al creador del grupo</div>
    </Card>}

    {groups.length>0&&<div style={{display:"flex",marginBottom:T.space[4],borderBottom:`1px solid ${T.border.subtle}`,overflowX:"auto"}}>
      {groups.map(g=><button key={g.id} className="btn" onClick={()=>{setSelGroup(g);setSubTab("picks");}} style={{flex:1,padding:`${T.space[3]}px ${T.space[2]}px`,background:"transparent",borderBottom:selGroup?.id===g.id?`2px solid ${T.accent.base}`:"2px solid transparent",color:selGroup?.id===g.id?T.text.primary:T.text.tertiary,fontSize:T.font.sm,fontWeight:600,whiteSpace:"nowrap"}}>
        {g.name}{g.memberCount?<span style={{fontSize:T.font.xs,color:T.text.disabled,marginLeft:T.space[1]}}>{g.memberCount}</span>:null}
      </button>)}
    </div>}

    {groups.length===0&&<Card style={{textAlign:"center",padding:T.space[7],marginBottom:T.space[5]}}>
      <div style={{fontSize:T.font.lg,fontWeight:600,color:T.text.primary,marginBottom:T.space[2]}}>Empieza a competir</div>
      <div style={{fontSize:T.font.sm,color:T.text.secondary,marginBottom:T.space[5]}}>Crea un grupo o únete a uno con un código</div>
      <div style={{display:"flex",gap:T.space[3],justifyContent:"center"}}>
        <button className="btn" onClick={()=>setPanel("create")} style={{...btnPrimary,padding:`${T.space[3]}px ${T.space[5]}px`,fontSize:T.font.sm}}>Crear grupo</button>
        <button className="btn" onClick={()=>setPanel("join")} style={{...btnGhost,padding:`${T.space[3]}px ${T.space[5]}px`,fontSize:T.font.sm}}>Tengo un código</button>
      </div>
    </Card>}

    {selGroup&&(()=>{
      const histByDate=history.reduce((a,p)=>({...a,[p.game_date]:[...(a[p.game_date]||[]),p]}),{});
      const activeLb=lbPeriod==="season"?leaderboard:periodLb;
      return <>
      {/* Cabecera del grupo */}
      <Card style={{marginBottom:T.space[4]}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:T.space[3]}}>
          <div>
            <div style={{fontSize:T.font.lg,fontWeight:600,color:T.text.primary}}>{selGroup.name}</div>
            <div style={{fontSize:T.font.xs,color:T.text.tertiary,marginTop:2}}>{selGroup.memberCount||"?"} miembros · {allGames.length} partidos hoy</div>
          </div>
          <div style={{display:"flex",gap:T.space[2],alignItems:"center",flexWrap:"wrap"}}>
            {balance!==null&&<div style={{background:T.surface[2],border:`1px solid ${T.border.subtle}`,borderRadius:T.radius.sm,padding:`${T.space[1]}px ${T.space[3]}px`}}>
              <span style={{fontSize:T.font.xs,color:T.text.tertiary}}>Saldo </span>
              <span style={{fontSize:T.font.base,fontWeight:700,color:T.text.primary}}>{balance}</span>
            </div>}
            {shields>0&&<div style={{background:T.surface[2],border:`1px solid ${T.border.subtle}`,borderRadius:T.radius.sm,padding:`${T.space[1]}px ${T.space[3]}px`,cursor:"pointer"}} onClick={async()=>{if(!confirm(`¿Usar un escudo de racha? Te quedan ${shields}.`))return;const d=await pickemAPI("useShield",{body:{userId:user.id}});if(d.ok){useShield(d.shieldsLeft);setMsg("Escudo usado — tu racha está protegida");}}} title="Escudo de racha">
              <span style={{fontSize:T.font.xs,color:T.text.tertiary}}>Escudos </span>
              <span style={{fontSize:T.font.base,fontWeight:700,color:T.accent.base}}>{shields}</span>
            </div>}
            <div style={{background:T.surface[2],border:`1px solid ${T.border.subtle}`,borderRadius:T.radius.sm,padding:`${T.space[1]}px ${T.space[2]}px`,display:"flex",alignItems:"center",gap:T.space[2]}}>
              <span style={{fontSize:T.font.sm,fontWeight:700,letterSpacing:2,color:T.text.primary}}>{selGroup.code}</span>
              <button className="btn" onClick={copyCode} style={{background:"transparent",borderRadius:T.radius.sm,padding:`2px ${T.space[2]}px`,color:copied?T.success.base:T.text.tertiary,fontSize:T.font.xs,fontWeight:600}}>{copied?"Copiado":"Copiar"}</button>
              <button className="btn" onClick={shareGroup} style={{background:"transparent",borderRadius:T.radius.sm,padding:`2px ${T.space[2]}px`,color:T.text.tertiary,fontSize:T.font.xs,fontWeight:600}}>Compartir</button>
              {selGroup.owner_id===user.id&&<button className="btn" onClick={()=>{setEditGroup(p=>!p);setEditGroupName(selGroup.name);setEditGroupEmoji(selGroup.emoji||"🏀");}} style={{background:"transparent",borderRadius:T.radius.sm,padding:`2px ${T.space[2]}px`,color:T.text.tertiary,fontSize:T.font.xs,fontWeight:600}}>Editar</button>}
              <button className="btn" onClick={()=>setConfirmLeave(true)} style={{background:"transparent",borderRadius:T.radius.sm,padding:`2px ${T.space[2]}px`,color:T.text.tertiary,fontSize:T.font.xs,fontWeight:600}}>Salir</button>
            </div>
            </div>
          </div>
        {myLbStats&&<div style={{display:"flex",gap:T.space[6],marginTop:T.space[4],paddingTop:T.space[3],borderTop:`1px solid ${T.border.subtle}`}}>
          {[["Posición",`#${myRank+1}`],["Aciertos",`${myLbStats.correct_picks}/${myLbStats.total_picks}`],["Precisión",`${myLbStats.accuracy}%`],["Puntos",myLbStats.total_points]].map(([l,v])=>
            <div key={l}><div style={{fontSize:T.font.xs,color:T.text.tertiary}}>{l}</div><div style={{fontSize:T.font.lg,fontWeight:700,color:T.text.primary}}>{v}</div></div>)}
        </div>}
      </Card>

      {dailyWinner&&games.length>0&&games.every(g=>g.status==="Final")&&<Card style={{marginBottom:T.space[4],textAlign:"center",padding:`${T.space[3]}px ${T.space[5]}px`}}>
        <div style={{...label,marginBottom:T.space[1]}}>Ganador del día</div>
        <div style={{fontSize:T.font.lg,fontWeight:700,color:T.text.primary}}>{dailyWinner.name}</div>
        <div style={{fontSize:T.font.sm,color:T.text.tertiary}}>{dailyWinner.correct}/{dailyWinner.total} aciertos · {dailyWinner.points} pts</div>
      </Card>}

      {editGroup&&<Card style={{marginBottom:T.space[4]}}>
        <div style={{fontSize:T.font.base,fontWeight:600,color:T.text.primary,marginBottom:T.space[3]}}>Editar grupo</div>
        <div style={{display:"flex",gap:T.space[2],marginBottom:T.space[3],flexWrap:"wrap"}}>
          {["🏀","🏆","🔥","⭐","🦁","🐯","🎯","💎","🚀","👑"].map(e=><button key={e} className="btn" onClick={()=>setEditGroupEmoji(e)} style={{fontSize:T.font.lg,background:editGroupEmoji===e?T.accent.subtle:T.surface[2],border:`1px solid ${editGroupEmoji===e?T.accent.base:T.border.subtle}`,borderRadius:T.radius.sm,padding:`${T.space[1]}px ${T.space[2]}px`}}>{e}</button>)}
        </div>
        <div style={{display:"flex",gap:T.space[2]}}>
          <input value={editGroupName} onChange={e=>setEditGroupName(e.target.value)} style={{...inputBase,flex:1}}/>
          <button className="btn" onClick={async()=>{const d=await pickemAPI("updateGroup",{body:{userId:user.id,groupId:selGroup.id,name:editGroupName,emoji:editGroupEmoji}});if(d.ok){setGroups(gs=>gs.map(g=>g.id===selGroup.id?{...g,name:editGroupName,emoji:editGroupEmoji}:g));setSelGroup(s=>({...s,name:editGroupName,emoji:editGroupEmoji}));setEditGroup(false);setMsg("Grupo actualizado");}else setMsg(d.error);}} style={{...btnPrimary,padding:`${T.space[3]}px ${T.space[5]}px`,fontSize:T.font.sm}}>Guardar</button>
        </div>
      </Card>}

      {!standalone&&<div style={{display:"flex",marginBottom:T.space[4],overflowX:"auto",borderBottom:`1px solid ${T.border.subtle}`}}>
        {[["picks","Picks"],["ranking","Ranking"],["historial","Historial"],["grupo","Grupo"],["estadisticas","Stats"],["chat","Chat"]].map(([id,l])=>
          <button key={id} className="btn" onClick={()=>setSubTab(id)} style={{padding:`${T.space[2]}px ${T.space[3]}px`,background:"transparent",borderBottom:subTab===id?`2px solid ${T.accent.base}`:"2px solid transparent",color:subTab===id?T.text.primary:T.text.tertiary,fontSize:T.font.sm,fontWeight:600,whiteSpace:"nowrap"}}>{l}</button>)}
      </div>}

      {/* ─── PICKS ─── */}
      {subTab==="picks"&&<>
        {(anyStarted||lockedPicks)&&<div style={{padding:`${T.space[3]}px ${T.space[4]}px`,background:T.surface[1],border:`1px solid ${T.border.base}`,borderRadius:T.radius.base,marginBottom:T.space[4],fontSize:T.font.sm,color:T.text.secondary}}>{anyStarted?"Un partido ya empezó — picks cerrados para hoy":"Picks cerrados para hoy"}</div>}
        {allGames.length===0?<Card style={{textAlign:"center",padding:T.space[7]}}><div style={{fontSize:T.font.base,color:T.text.secondary}}>No hay partidos hoy</div></Card>
        :allGames.map(g=>{
          const picked=picks[g.id];const isFinal=g.status==="Final";const isLive=g.status==="LIVE";
          const isUpcoming=g.startTime?new Date()<new Date(g.startTime):g.status==="Upcoming";
          const winner=isFinal?(g.homeScore>g.awayScore?g.home:g.away):null;
          const correct=isFinal&&picked===winner;
          const minsLeft=g.startTime&&isUpcoming?Math.max(0,Math.round((new Date(g.startTime)-new Date())/60000)):null;
          return <Card key={g.id} style={{marginBottom:T.space[3],borderColor:isFinal&&picked?(correct?T.success.border:T.danger.border):picked?T.accent.border:T.border.subtle}}>
            <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:T.space[3]}}>
              <div style={{display:"flex",gap:T.space[2]}}>
                {isLive?<Tag c={T.danger.base}>EN VIVO · {g.detail}</Tag>:isFinal?<Tag c={T.text.tertiary}>Final</Tag>
                :minsLeft!==null?(minsLeft<=1?<Tag c={T.danger.base}>Iniciando</Tag>:minsLeft<=60?<Tag c={T.warning.base}>{minsLeft} min</Tag>:<Tag c={T.text.tertiary}>{g.detail||"Próximo"}</Tag>)
                :<Tag c={T.text.tertiary}>{g.detail||"Próximo"}</Tag>}
              </div>
              {isFinal&&picked&&(()=>{const c2=confidence[g.id]||1;const ap=picksPoints[g.id];const pPct=picked===g.home?calcWinPct(g,"home",standings):calcWinPct(g,"away",standings);return<Tag c={correct?T.success.base:T.danger.base}>{correct?`+${ap??dynPts(pPct,c2)} pts`:(c2>=2?`${ap??-dynPts(pPct,c2)} pts`:"0 pts")}</Tag>;})()}
              {isLive&&picked&&<Tag c={T.accent.base}>{picked}</Tag>}
              {isUpcoming&&picked&&<Tag c={T.success.base}>{picked}</Tag>}
              {isUpcoming&&!picked&&<Tag c={T.accent.base}>Elige</Tag>}
              {isLive&&!picked&&<Tag c={T.text.tertiary}>Sin pick</Tag>}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"1fr auto 1fr",gap:T.space[3],alignItems:"center"}}>
              {[["away",g.away,g.awayScore],["vs"],["home",g.home,g.homeScore]].map((item,idx)=>
                idx===1?<div key="vs" style={{textAlign:"center",fontSize:T.font.sm,color:T.text.tertiary,fontWeight:600}}>VS</div>
                :isUpcoming&&!lockedPicks&&!anyStarted?
                  <button key={item[1]} className="btn" onClick={()=>makePick(g.id,item[1],g.home,g.away,confidence[g.id]||1,g)} style={{padding:`${T.space[3]}px ${T.space[2]}px`,borderRadius:T.radius.base,textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:T.space[1],background:picked===item[1]?T.accent.subtle:T.surface[2],border:`1px solid ${picked===item[1]?T.accent.base:T.border.subtle}`,color:T.text.primary,width:"100%"}}>
                    {logo(item[1],36)}
                    <span style={{fontSize:T.font.base,fontWeight:700}}>{item[1]}</span>
                    <span style={{fontSize:T.font.xs,color:T.text.tertiary}}>{tm(item[1]).name}</span>
                    <span style={{fontSize:T.font.xs,fontWeight:600,color:picked===item[1]?T.accent.base:T.text.tertiary}}>+{dynBase(calcWinPct(g,item[0],standings))} pts</span>
                  </button>
                :<div key={item[1]} style={{textAlign:"center",padding:`${T.space[3]}px ${T.space[2]}px`,opacity:picked&&picked!==item[1]?0.4:1}}>
                    {logo(item[1],36)}
                    <div style={{fontSize:T.font.base,fontWeight:700,color:T.text.primary,marginTop:T.space[1]}}>{item[1]}</div>
                    {(isFinal||isLive)&&<div style={{fontSize:T.font.xl,fontWeight:700,color:isFinal&&item[1]===winner?T.success.base:T.text.primary,marginTop:T.space[1]}}>{item[2]}</div>}
                  </div>
              )}
            </div>
          </Card>;
        })}
      </>}

      {/* ─── RANKING ─── */}
      {subTab==="ranking"&&<>
        {lbPeriod==="season"&&activeLb.length>=3&&<Card style={{marginBottom:T.space[3]}}>
          <div style={{...label,marginBottom:T.space[4]}}>{getSeason()} · Top 3</div>
          <div style={{display:"flex",gap:T.space[3],justifyContent:"center",alignItems:"flex-end"}}>
            {[1,0,2].map(pos=>{
              const r=activeLb[pos];if(!r)return null;
              const h=pos===0?84:pos===1?62:48;            // ← altura por posición real
              const isFirst=pos===0;
              const rItems=r.user_id===user.id?[...shopItems,...(r.shopItems||[])]:r.shopItems||[];
              const nameClr=getNameColor(rItems,r.user_id===user.id?myEquipped:(r.equipped||{}));
              return<div key={pos} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:T.space[2]}}>
                <div style={{fontSize:T.font.xs,fontWeight:600,color:nameClr||T.text.secondary,maxWidth:76,textAlign:"center",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</div>
                <div style={{width:64,height:h,background:isFirst?T.accent.subtle:T.surface[2],border:`1px solid ${isFirst?T.accent.base:T.border.base}`,borderRadius:`${T.radius.sm}px ${T.radius.sm}px 0 0`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:2}}>
                  <div style={{fontSize:T.font.lg,fontWeight:700,color:isFirst?T.accent.base:T.text.primary}}>{r.total_points??0}</div>
                  <div style={{fontSize:T.font.xs,color:T.text.tertiary}}>#{pos+1}</div>
                </div>
              </div>;
            })}
          </div>
        </Card>}

        <div style={{display:"flex",gap:T.space[2],marginBottom:T.space[4]}}>
          {[["season","Temporada"],["month","Mes"],["week","Semana"]].map(([p,l])=>
            <button key={p} className="btn" onClick={()=>setLbPeriod(p)} style={{padding:`${T.space[2]}px ${T.space[4]}px`,borderRadius:T.radius.full,background:lbPeriod===p?T.accent.subtle:T.surface[2],border:`1px solid ${lbPeriod===p?T.accent.base:T.border.subtle}`,color:lbPeriod===p?T.accent.base:T.text.tertiary,fontWeight:600,fontSize:T.font.xs}}>{l}</button>)}
        </div>

        <Card>
          <div style={{...label,marginBottom:T.space[4]}}>{lbPeriod==="week"?"Esta semana":lbPeriod==="month"?"Este mes":"Temporada"}</div>
          {activeLb.length===0?<div style={{textAlign:"center",padding:T.space[6],color:T.text.tertiary,fontSize:T.font.sm}}>Aún no hay picks</div>
          :activeLb.map((r,i)=>{
            const isMe=r.user_id===user.id;
            const rItems=isMe?[...shopItems,...(r.shopItems||[])]:r.shopItems||[];
            const rEquipped=isMe?myEquipped:(r.equipped||{});
            const nameClr=getNameColor(rItems,rEquipped);const prefix=getNamePrefix(rItems,rEquipped);const bdClr=getBorderColor(rItems,rEquipped);
            return <div key={r.user_id||i} style={{display:"flex",alignItems:"center",gap:T.space[3],padding:`${T.space[3]}px ${T.space[2]}px`,borderRadius:T.radius.sm,background:isMe?T.accent.subtle:"transparent",borderBottom:`1px solid ${T.border.subtle}`}}>
              <div style={{width:26,textAlign:"center",fontSize:T.font.sm,fontWeight:700,color:i===0?T.accent.base:T.text.tertiary,flexShrink:0}}>{i+1}</div>
              <div style={{width:32,height:32,borderRadius:"50%",background:T.surface[2],border:`1px solid ${bdClr||T.border.base}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:T.font.base,flexShrink:0}}>{isMe?(user.avatar_emoji||"🏀"):(r.avatar_emoji||"🏀")}</div>
              <div style={{flex:1,minWidth:0,cursor:isMe?undefined:"pointer"}} onClick={()=>!isMe&&openProfile(r)}>
                <div style={{fontSize:T.font.sm,fontWeight:600,color:nameClr||T.text.primary}}>{prefix}{r.name||r.user_name}{isMe?" (tú)":""}</div>
                <div style={{fontSize:T.font.xs,color:T.text.tertiary}}>{r.correct_picks??r.correct??0} aciertos · {r.accuracy}%{(streaks[r.user_id]||0)>=3&&<span style={{color:T.warning.base,fontWeight:600}}> · {streaks[r.user_id]} en racha</span>}</div>
              </div>
              <div style={{textAlign:"right",flexShrink:0}}>
                <div style={{fontSize:T.font.lg,fontWeight:700,color:T.text.primary}}>{r.total_points??r.points??0}</div>
                {!isMe&&<button className="btn" onClick={()=>loadH2H(r)} style={{padding:`2px ${T.space[2]}px`,borderRadius:T.radius.sm,background:"transparent",border:`1px solid ${T.border.base}`,color:T.text.tertiary,fontSize:T.font.xs,fontWeight:600,marginTop:2}}>H2H</button>}
              </div>
            </div>;
          })}
        </Card>

        {h2hUser&&<Card style={{marginTop:T.space[3]}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:T.space[3]}}>
            <div style={{fontSize:T.font.base,fontWeight:600,color:T.text.primary}}>H2H vs {h2hUser.name||h2hUser.user_name}</div>
            <button className="btn" onClick={()=>{setH2hUser(null);setH2hData(null);}} style={{background:"none",color:T.text.tertiary,fontSize:T.font.lg}}>×</button>
          </div>
          {!h2hData?<div style={{textAlign:"center",padding:T.space[5]}}><Spin/></div>
          :<><div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:T.space[2],textAlign:"center",marginBottom:T.space[3]}}>
            {[["Tú",T.success.base,h2hData.iWon],["Ambos",T.accent.base,h2hData.bothCorrect],["Ellos",T.danger.base,h2hData.theyWon],["Nadie",T.text.tertiary,h2hData.neither]].map(([l,c,v])=>(
              <div key={l} style={{background:T.surface[2],borderRadius:T.radius.sm,padding:`${T.space[3]}px ${T.space[1]}px`}}>
                <div style={{fontSize:T.font.xl,fontWeight:700,color:c}}>{v}</div>
                <div style={{fontSize:T.font.xs,color:T.text.tertiary,marginTop:2}}>{l}</div>
              </div>
            ))}
          </div>
          <div style={{fontSize:T.font.xs,color:T.text.tertiary,textAlign:"center"}}>{h2hData.total} picks comparados</div></>}
        </Card>}
      </>}

      {/* ─── HISTORIAL ─── */}
      {subTab==="historial"&&(()=>{
        const allScoredPicks=history.filter(p=>p.scored);
        const totalCorrect=allScoredPicks.filter(p=>p.correct).length;
        const totalPts=allScoredPicks.reduce((s,p)=>s+(p.points||0),0);
        const overallAcc=allScoredPicks.length?Math.round(totalCorrect/allScoredPicks.length*100):0;
        return<>
          {allScoredPicks.length>0&&<Card style={{marginBottom:T.space[4]}}>
            <div style={{...label,marginBottom:T.space[3]}}>Últimos 30 días</div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:T.space[3],marginBottom:T.space[4]}}>
              {[[totalCorrect+"/"+allScoredPicks.length,"Aciertos"],[totalPts+" pts","Puntos"],[overallAcc+"%","Precisión"]].map(([v,l])=>(
                <div key={l} style={{background:T.surface[2],borderRadius:T.radius.sm,padding:`${T.space[3]}px ${T.space[2]}px`,textAlign:"center"}}>
                  <div style={statNum}>{v}</div>
                  <div style={{fontSize:T.font.xs,color:T.text.tertiary,marginTop:2}}>{l}</div>
                </div>
              ))}
            </div>
            {Object.keys(histByDate).length>0&&(()=>{
              const chartData=Object.entries(histByDate).slice(-14).map(([date,dp])=>({
                day:new Date(date+"T12:00:00").toLocaleDateString("es",{weekday:"short",day:"numeric"}),
                pct:dp.length?Math.round(dp.filter(p=>p.correct).length/dp.length*100):0,
              }));
              return<ResponsiveContainer width="100%" height={110}>
                <BarChart data={chartData} margin={{top:4,right:4,left:-24,bottom:0}}>
                  <CartesianGrid strokeDasharray="2 4" stroke={T.border.subtle} vertical={false}/>
                  <XAxis dataKey="day" tick={{fill:T.text.tertiary,fontSize:10}} axisLine={false} tickLine={false}/>
                  <YAxis domain={[0,100]} tick={{fill:T.text.tertiary,fontSize:10}} axisLine={false} tickLine={false}/>
                  <Tooltip cursor={{fill:T.surface[2]}} content={({active,payload,label:lb})=>active&&payload?.length?<div style={{background:T.surface[2],border:`1px solid ${T.border.base}`,borderRadius:T.radius.sm,padding:`${T.space[2]}px ${T.space[3]}px`}}><p style={{color:T.text.tertiary,fontSize:T.font.xs,marginBottom:2}}>{lb}</p><p style={{color:T.text.primary,fontSize:T.font.sm,fontWeight:600}}>{payload[0].value}% precisión</p></div>:null}/>
                  <Bar dataKey="pct" fill={T.accent.base} radius={[3,3,0,0]} maxBarSize={26}/>
                </BarChart>
              </ResponsiveContainer>;
            })()}
          </Card>}
          {Object.keys(histByDate).length===0?<Card style={{textAlign:"center",padding:T.space[7]}}><div style={{fontSize:T.font.base,fontWeight:600,color:T.text.primary}}>Sin historial aún</div><div style={{fontSize:T.font.sm,color:T.text.tertiary,marginTop:T.space[2]}}>Tus picks de los últimos 30 días aparecerán aquí</div></Card>
          :Object.entries(histByDate).map(([date,dayPicks])=>{
            const correct=dayPicks.filter(p=>p.correct).length;
            const pts=dayPicks.reduce((s,p)=>s+(p.points||0),0);
            return <Card key={date} style={{marginBottom:T.space[3]}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:T.space[3]}}>
                <div style={{fontSize:T.font.sm,fontWeight:600,color:T.text.primary}}>{new Date(date+"T12:00:00").toLocaleDateString("es",{weekday:"long",month:"short",day:"numeric"})}</div>
                <div style={{display:"flex",gap:T.space[2],alignItems:"center"}}>
                  <Tag c={correct===dayPicks.length&&dayPicks.length>0?T.success.base:T.text.tertiary}>{correct}/{dayPicks.length}</Tag>
                  <Tag c={T.accent.base}>{pts>=0?"+":""}{pts} pts</Tag>
                  <button className="btn" onClick={()=>sharePicksImage(date,dayPicks)} style={{padding:`2px ${T.space[2]}px`,borderRadius:T.radius.sm,background:"transparent",border:`1px solid ${T.border.base}`,color:T.text.tertiary,fontSize:T.font.xs,fontWeight:600}}>Compartir</button>
                </div>
              </div>
              {dayPicks.map(p=><div key={p.id} style={{display:"flex",alignItems:"center",gap:T.space[2],padding:`${T.space[2]}px 0`,borderBottom:`1px solid ${T.border.subtle}`}}>
                {logo(p.picked_team,20)}<span style={{flex:1,fontSize:T.font.sm,color:T.text.primary}}>{p.picked_team}</span>
                <span style={{fontSize:T.font.xs,color:T.text.tertiary}}>vs {p.picked_team===p.home_team?p.away_team:p.home_team}</span>
                {p.confidence>1&&<Tag c={T.text.tertiary}>{p.confidence}x</Tag>}
                {p.scored?<Tag c={p.correct?T.success.base:T.danger.base}>{p.correct?`+${p.points||0}`:`${p.points||0}`}</Tag>:<Tag c={T.text.tertiary}>Pend.</Tag>}
              </div>)}
            </Card>;
          })}
        </>;
      })()}

      {/* ─── GRUPO ─── */}
      {subTab==="grupo"&&<>
        <div style={{...label,marginBottom:T.space[4]}}>Miembros de {selGroup.name}</div>
        {leaderboard.length===0
          ?<Card style={{textAlign:"center",padding:T.space[6]}}><div style={{fontSize:T.font.sm,color:T.text.tertiary}}>Sin miembros aún</div></Card>
          :leaderboard.map((r,i)=>{
            const isMe=r.user_id===user.id;
            const rItems=isMe?[...shopItems,...(r.shopItems||[])]:r.shopItems||[];
            const rEquipped=isMe?myEquipped:(r.equipped||{});
            const nameClr=getNameColor(rItems,rEquipped);const prefix=getNamePrefix(rItems,rEquipped);const bdClr=getBorderColor(rItems,rEquipped);
            const streak=streaks[r.user_id]||0;
            return <Card key={r.user_id} style={{marginBottom:T.space[2],borderColor:isMe?T.accent.border:T.border.subtle}}>
              <div style={{display:"flex",alignItems:"center",gap:T.space[3]}}>
                <div style={{width:40,height:40,borderRadius:"50%",background:T.surface[2],border:`1px solid ${bdClr||T.border.base}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:T.font.lg,flexShrink:0}}>
                  {isMe?(user.avatar_emoji||"🏀"):(r.avatar_emoji||"🏀")}
                </div>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{fontSize:T.font.base,fontWeight:600,color:nameClr||T.text.primary}}>{prefix}{r.name||"?"}{isMe?" (tú)":""}</div>
                  <div style={{display:"flex",gap:T.space[3],marginTop:2}}>
                    <span style={{fontSize:T.font.xs,color:T.text.tertiary}}>{r.correct_picks??0} aciertos</span>
                    <span style={{fontSize:T.font.xs,color:T.text.tertiary}}>{r.accuracy??0}%</span>
                    {streak>=3&&<span style={{fontSize:T.font.xs,color:T.warning.base,fontWeight:600}}>{streak} en racha</span>}
                  </div>
                </div>
                <div style={{textAlign:"right",flexShrink:0}}>
                  <div style={{fontSize:T.font.xl,fontWeight:700,color:T.text.primary}}>{r.total_points??0}</div>
                  <div style={{fontSize:T.font.xs,color:T.text.tertiary}}>#{i+1}</div>
                </div>
              </div>
            </Card>;
          })}
      </>}

      {/* ─── APUESTAS ─── */}
      {subTab==="apuestas"&&<>
        <Card style={{marginBottom:T.space[4],textAlign:"center",padding:T.space[5]}}>
          <div style={{...label,marginBottom:T.space[2]}}>Tu saldo</div>
          <div style={{fontSize:T.font["3xl"],fontWeight:700,color:T.text.primary,letterSpacing:-1}}>{balance!==null?balance:<Spin/>}</div>
          <div style={{fontSize:T.font.xs,color:T.text.tertiary,marginTop:T.space[1]}}>Empiezas con 500 · +100/día si tienes menos de 200</div>
        </Card>

        {bets.filter(b=>b.status==="pending"&&b.opponent_id===user.id).length>0&&<div style={{marginBottom:T.space[4]}}>
          <div style={{...label,marginBottom:T.space[2]}}>Retos pendientes para ti</div>
          {bets.filter(b=>b.status==="pending"&&b.opponent_id===user.id).map(b=>{
            const betGameObj=games.find(g=>g.id===b.game_id);
            const gameExpired=betGameObj?betGameObj.status!=="Upcoming":true;
            return <Card key={b.id} style={{marginBottom:T.space[2],borderColor:gameExpired?T.border.subtle:T.warning.border}}>
              <div style={{fontSize:T.font.xs,color:gameExpired?T.text.tertiary:T.warning.base,fontWeight:600,marginBottom:T.space[2]}}>{gameExpired?"Partido ya empezó — reto expirado":"Te retaron"}</div>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:T.space[2]}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:T.space[2],marginBottom:T.space[1]}}>{logo(b.picked_team,20)}<span style={{fontSize:T.font.sm,fontWeight:600,color:T.text.primary}}>{b.picked_team} gana</span></div>
                  <div style={{fontSize:T.font.xs,color:T.text.tertiary}}>{b.away_team} vs {b.home_team} · {b.amount} monedas</div>
                </div>
                {gameExpired
                  ?<Tag c={T.text.tertiary}>Expirada</Tag>
                  :<button className="btn" onClick={()=>doAcceptBet(b)} disabled={betLoading||(balance!==null&&b.amount>balance)} style={{...btnPrimary,padding:`${T.space[2]}px ${T.space[4]}px`,fontSize:T.font.sm}}>Aceptar reto</button>}
              </div>
            </Card>;
          })}
        </div>}

        {upcoming.length>0&&!betGame&&<Card style={{marginBottom:T.space[4]}}>
          <div style={{fontSize:T.font.base,fontWeight:600,color:T.text.primary,marginBottom:T.space[3]}}>Nueva apuesta — elige un partido</div>
          {upcoming.map(g=><button key={g.id} className="btn" onClick={()=>{setBetGame(g);setBetTeam(null);}} style={{display:"flex",alignItems:"center",gap:T.space[2],width:"100%",padding:`${T.space[3]}px ${T.space[3]}px`,marginBottom:T.space[2],background:T.surface[2],border:`1px solid ${T.border.subtle}`,borderRadius:T.radius.base,color:T.text.primary,fontSize:T.font.sm,fontWeight:600}}>
            {logo(g.away,18)}{g.away} vs {g.home}{logo(g.home,18)}<span style={{marginLeft:"auto",color:T.text.tertiary,fontSize:T.font.xs}}>{g.detail}</span>
          </button>)}
        </Card>}

        {betGame&&<Card style={{marginBottom:T.space[4],borderColor:T.accent.border}}>
          <div style={{fontSize:T.font.base,fontWeight:600,color:T.text.primary,marginBottom:T.space[3]}}>{betGame.away} vs {betGame.home} — ¿Quién gana?</div>
          {betTeam&&<div style={{fontSize:T.font.xs,color:T.text.tertiary,marginBottom:T.space[3],padding:`${T.space[2]}px ${T.space[3]}px`,background:T.surface[2],borderRadius:T.radius.sm}}>
            {betOpponent?<>Tú apuestas por <b style={{color:T.text.primary}}>{betTeam}</b> · {betOpponent.name} por <b style={{color:T.text.primary}}>{betTeam===betGame.home?betGame.away:betGame.home}</b></>
            :<>Apuestas por <b style={{color:T.text.primary}}>{betTeam}</b> · quien acepte irá por <b style={{color:T.text.primary}}>{betTeam===betGame.home?betGame.away:betGame.home}</b></>}
          </div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:T.space[2],marginBottom:T.space[3]}}>
            {[betGame.away,betGame.home].map(team=><button key={team} className="btn" onClick={()=>setBetTeam(team)} style={{padding:`${T.space[4]}px ${T.space[2]}px`,borderRadius:T.radius.base,textAlign:"center",background:betTeam===team?T.accent.subtle:T.surface[2],border:`1px solid ${betTeam===team?T.accent.base:T.border.subtle}`,color:T.text.primary}}>
              {logo(team,36)}<div style={{fontSize:T.font.base,fontWeight:700,marginTop:T.space[1]}}>{team}</div>
            </button>)}
          </div>
          <div style={{marginBottom:T.space[3]}}>
            <div style={{...label,marginBottom:T.space[2]}}>Monto</div>
            <div style={{display:"flex",gap:T.space[2],flexWrap:"wrap"}}>
              {[25,50,100,200].map(a=><button key={a} className="btn" onClick={()=>setBetAmt(a)} style={{padding:`${T.space[1]}px ${T.space[4]}px`,borderRadius:T.radius.full,background:betAmt===a?T.accent.subtle:T.surface[2],border:`1px solid ${betAmt===a?T.accent.base:T.border.subtle}`,color:betAmt===a?T.accent.base:T.text.tertiary,fontSize:T.font.sm,fontWeight:600}}>{a}</button>)}
            </div>
          </div>
          <div style={{marginBottom:T.space[4]}}>
            <div style={{...label,marginBottom:T.space[2]}}>Retar a (opcional)</div>
            <div style={{display:"flex",gap:T.space[2],flexWrap:"wrap"}}>
              <button className="btn" onClick={()=>setBetOpponent(null)} style={{padding:`${T.space[1]}px ${T.space[3]}px`,borderRadius:T.radius.full,background:!betOpponent?T.accent.subtle:T.surface[2],border:`1px solid ${!betOpponent?T.accent.base:T.border.subtle}`,color:!betOpponent?T.accent.base:T.text.tertiary,fontSize:T.font.xs,fontWeight:600}}>Abierta</button>
              {(selGroup?.members||[]).filter(m=>m.userId!==user.id).map(m=>(
                <button key={m.userId} className="btn" onClick={()=>setBetOpponent(m)} style={{padding:`${T.space[1]}px ${T.space[3]}px`,borderRadius:T.radius.full,background:betOpponent?.userId===m.userId?T.accent.subtle:T.surface[2],border:`1px solid ${betOpponent?.userId===m.userId?T.accent.base:T.border.subtle}`,color:betOpponent?.userId===m.userId?T.accent.base:T.text.tertiary,fontSize:T.font.xs,fontWeight:600}}>{m.name}</button>
              ))}
            </div>
          </div>
          <div style={{display:"flex",gap:T.space[2]}}>
            <button className="btn" onClick={()=>{setBetGame(null);setBetTeam(null);setBetOpponent(null);}} style={{...btnGhost,flex:1,padding:T.space[3],fontSize:T.font.sm}}>Cancelar</button>
            <button className="btn" onClick={betOpponent?doChallengeBet:doBet} disabled={!betTeam||betLoading||(balance!==null&&betAmt>balance)} style={{...(betTeam&&!betLoading?btnPrimary:btnGhost),flex:2,padding:T.space[3],fontSize:T.font.sm}}>{betLoading?<Spin s={13}/>:betOpponent?`Retar a ${betOpponent.name} · ${betAmt}`:`Apostar ${betAmt} por ${betTeam||"…"}`}</button>
          </div>
        </Card>}

        {bets.filter(b=>b.status!=="settled").length>0&&<>
          <div style={{...label,marginBottom:T.space[3]}}>Apuestas activas</div>
          {[...bets].filter(b=>b.status!=="settled").sort((a,b)=>{const aC=a.status==="pending"&&a.opponent_id===user.id?-1:0;const bC=b.status==="pending"&&b.opponent_id===user.id?-1:0;return aC-bC;}).map(b=>{
            const isMe=b.requester_id===user.id;const canAccept=!isMe&&b.status==="open";const isChallenge=b.status==="pending"&&b.opponent_id===user.id;
            const betGameObj=games.find(g=>g.id===b.game_id);const gameExpired=!betGameObj||betGameObj.status!=="Upcoming";
            const opponentTeam=b.home_team===b.picked_team?b.away_team:b.home_team;
            const myTeam=isMe?b.picked_team:opponentTeam;
            return <Card key={b.id} style={{marginBottom:T.space[2],borderColor:isChallenge?T.warning.border:b.status==="active"?T.success.border:T.border.subtle}}>
              {isChallenge&&<div style={{fontSize:T.font.xs,color:T.warning.base,fontWeight:600,marginBottom:T.space[2]}}>{b.requester?.name||"Alguien"} te reta</div>}
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:T.space[2]}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:T.space[3],marginBottom:T.space[1]}}>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>{logo(b.picked_team,20)}<span style={{fontSize:T.font.xs,color:T.text.tertiary}}>{b.requester?.name||"?"}</span></div>
                    <span style={{fontSize:T.font.xs,color:T.text.tertiary,fontWeight:600}}>VS</span>
                    <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:2}}>{logo(opponentTeam,20)}<span style={{fontSize:T.font.xs,color:T.text.tertiary}}>{b.status==="active"?(b.opponent?.name||"?"):"Rival"}</span></div>
                  </div>
                  <div style={{fontSize:T.font.xs,color:T.text.tertiary}}>{b.away_team} @ {b.home_team} · {b.amount} monedas{isMe?` · tú: ${myTeam}`:isChallenge?` · tú: ${opponentTeam}`:""}</div>
                </div>
                <div style={{display:"flex",gap:T.space[2],flexWrap:"wrap"}}>
                  {canAccept&&(gameExpired?<Tag c={T.text.tertiary}>Expirada</Tag>:<button className="btn" onClick={()=>doAcceptBet(b)} disabled={betLoading||(balance!==null&&b.amount>balance)} style={{...btnPrimary,padding:`${T.space[2]}px ${T.space[4]}px`,fontSize:T.font.sm}}>Aceptar</button>)}
                  {isChallenge&&(gameExpired?<Tag c={T.text.tertiary}>Expirada</Tag>:<button className="btn" onClick={()=>doAcceptBet(b)} disabled={betLoading||(balance!==null&&b.amount>balance)} style={{...btnPrimary,padding:`${T.space[2]}px ${T.space[4]}px`,fontSize:T.font.sm}}>Aceptar ({opponentTeam})</button>)}
                  {isMe&&(b.status==="open"||b.status==="pending")&&<button className="btn" onClick={()=>doCancelBet(b)} style={{...btnGhost,padding:`${T.space[2]}px ${T.space[4]}px`,fontSize:T.font.sm}}>Cancelar</button>}
                  {b.status==="active"&&<Tag c={T.success.base}>Activa</Tag>}
                </div>
              </div>
            </Card>;
          })}
        </>}

        {bets.filter(b=>b.status==="settled").length>0&&<>
          <div style={{...label,marginBottom:T.space[3],marginTop:T.space[5]}}>Historial de apuestas</div>
          {bets.filter(b=>b.status==="settled").sort((a,b)=>new Date(b.updated_at||b.created_at)-new Date(a.updated_at||a.created_at)).map(b=>{
            const isMe=b.requester_id===user.id;
            const opponentTeam=b.home_team===b.picked_team?b.away_team:b.home_team;
            const myTeam=isMe?b.picked_team:opponentTeam;
            const iWon=b.winner_id===user.id;
            return <Card key={b.id} style={{marginBottom:T.space[2],borderColor:iWon?T.success.border:T.border.subtle,opacity:.9}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:T.space[2]}}>
                <div style={{flex:1,minWidth:0}}>
                  <div style={{display:"flex",alignItems:"center",gap:T.space[2],marginBottom:2}}>
                    {logo(myTeam,20)}<span style={{fontSize:T.font.sm,fontWeight:600,color:iWon?T.success.base:T.danger.base}}>{iWon?"Ganaste":"Perdiste"}</span>
                  </div>
                  <div style={{fontSize:T.font.xs,color:T.text.tertiary}}>{b.away_team} @ {b.home_team} · ganó {b.actual_winner}</div>
                  <div style={{fontSize:T.font.xs,color:T.text.tertiary,marginTop:2}}>vs {isMe?(b.opponent?.name||"rival"):(b.requester?.name||"rival")}</div>
                </div>
                <div style={{fontSize:T.font.lg,fontWeight:700,color:iWon?T.success.base:T.danger.base}}>{iWon?`+${b.amount*2}`:`-${b.amount}`}</div>
              </div>
            </Card>;
          })}
        </>}

        {bets.length===0&&upcoming.length===0&&!betGame&&<Card style={{textAlign:"center",padding:T.space[6]}}><div style={{fontSize:T.font.sm,color:T.text.tertiary}}>No hay partidos para apostar hoy</div></Card>}
      </>}

      {/* ─── CHAT ─── */}
      {subTab==="chat"&&<>
        <div style={{display:"flex",flexDirection:"column",gap:T.space[3],marginBottom:T.space[4],maxHeight:380,overflowY:"auto"}}>
          {chat.length===0
          ?<Card style={{textAlign:"center",padding:T.space[6]}}><div style={{fontSize:T.font.sm,color:T.text.tertiary}}>Sin mensajes aún</div></Card>
          :chat.map((m)=>{
            const isMe=m.user_id===user.id;
            return<div key={m.id||m.created_at} style={{display:"flex",gap:T.space[2],alignItems:"flex-end",flexDirection:isMe?"row-reverse":"row"}}>
              <div style={{width:26,height:26,borderRadius:"50%",background:T.surface[3],border:`1px solid ${T.border.subtle}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:T.font.sm,flexShrink:0}}>{isMe?(user.avatar_emoji||"🏀"):(m.users?.avatar_emoji||"🏀")}</div>
              <div style={{maxWidth:"76%"}}>
                {!isMe&&<div style={{fontSize:T.font.xs,color:T.text.tertiary,marginBottom:3,fontWeight:600}}>{m.users?.name}</div>}
                <div style={{background:isMe?T.accent.base:T.surface[2],border:isMe?"none":`1px solid ${T.border.subtle}`,borderRadius:T.radius.base,padding:`${T.space[2]}px ${T.space[3]}px`,fontSize:T.font.sm,color:isMe?"#fff":T.text.primary,lineHeight:1.45,wordBreak:"break-word"}}>{m.content}</div>
                <div style={{fontSize:T.font.xs,color:T.text.disabled,marginTop:3,textAlign:isMe?"right":"left"}}>{new Date(m.created_at).toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"})}</div>
              </div>
            </div>;
          })}
        </div>
        <div style={{display:"flex",gap:T.space[2]}}>
          <input value={chatInput} onChange={e=>setChatInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&sendChat()} placeholder="Escribe un mensaje" style={{...inputBase,flex:1,borderColor:chatInput?T.accent.border:T.border.base}}/>
          <button className="btn" onClick={sendChat} disabled={!chatInput.trim()||chatLoading} style={{...(chatInput.trim()?btnPrimary:btnGhost),padding:`${T.space[2]}px ${T.space[4]}px`,fontSize:T.font.sm}}>Enviar</button>
        </div>
      </>}

      {/* ─── ESTADÍSTICAS ─── */}
      {subTab==="estadisticas"&&<>
        <button className="btn" onClick={()=>pickemAPI("checkAchievements",{params:{userId:user.id,groupId:selGroup.id}}).then(d=>{if(d.ok&&d.newAchievements?.length)setMsg("Nuevo logro desbloqueado");})} style={{...btnGhost,width:"100%",marginBottom:T.space[4],padding:T.space[3],fontSize:T.font.sm}}>Verificar logros y racha</button>
        {!myStatsData?<Card style={{textAlign:"center",padding:T.space[7]}}><div style={{fontSize:T.font.sm,color:T.text.tertiary}}>Aún no tienes picks con resultado</div></Card>
        :<>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:T.space[2],marginBottom:T.space[4]}}>
            {[["Picks totales",myStatsData.totalPicks],["Aciertos",myStatsData.totalCorrect],["Precisión",`${myStatsData.accuracy}%`],["Puntos",myStatsData.totalPoints]].map(([l,v])=>
              <Card key={l} style={{textAlign:"center",padding:`${T.space[3]}px ${T.space[2]}px`}}><div style={{fontSize:T.font.xs,color:T.text.tertiary,marginBottom:T.space[1]}}>{l}</div><div style={statNum}>{v}</div></Card>)}
          </div>
          {myStatsData.favoriteTeam&&<Card style={{marginBottom:T.space[3]}}>
            <div style={{...label,marginBottom:T.space[3]}}>Equipos</div>
            <div style={{display:"flex",gap:T.space[3],flexWrap:"wrap"}}>
              {[["Más pickeado",myStatsData.favoriteTeam],["Mejor precisión",myStatsData.bestTeam],["Peor precisión",myStatsData.worstTeam]].filter(x=>x[1]).map(([l,t])=>
                <div key={l} style={{display:"flex",alignItems:"center",gap:T.space[2],background:T.surface[2],borderRadius:T.radius.sm,padding:`${T.space[2]}px ${T.space[3]}px`,flex:1,minWidth:120}}>
                  {logo(t.team,26)}<div><div style={{fontSize:T.font.xs,color:T.text.tertiary}}>{l}</div><div style={{fontSize:T.font.sm,fontWeight:600,color:T.text.primary}}>{t.team}</div><div style={{fontSize:T.font.xs,color:T.text.tertiary}}>{t.correct}/{t.total} · {t.acc}%</div></div>
                </div>)}
            </div>
          </Card>}
          <Card>
            <div style={{...label,marginBottom:T.space[3]}}>Top equipos</div>
            {myStatsData.topTeams?.slice(0,8).map(t=><div key={t.team} style={{display:"flex",alignItems:"center",gap:T.space[2],marginBottom:T.space[2]}}>
              {logo(t.team,18)}<span style={{fontSize:T.font.xs,fontWeight:600,color:T.text.secondary,width:36}}>{t.team}</span>
              <div style={{flex:1,height:4,borderRadius:2,background:T.surface[3],overflow:"hidden"}}><div style={{width:`${t.acc}%`,height:"100%",background:T.accent.base}}/></div>
              <span style={{fontSize:T.font.xs,color:T.text.tertiary,width:64,textAlign:"right"}}>{t.correct}/{t.total} · {t.acc}%</span>
            </div>)}
          </Card>
        </>}
      </>}

      {/* ─── PARLAY ─── */}
      {subTab==="parlay"&&(()=>{
        const weekGames=upcoming.filter(g=>g.startTime);
        const saveParlay=async()=>{
          const sel=Object.entries(parlaySelections).map(([gameId,pickedTeam])=>{const g=allGames.find(x=>x.id===gameId);return{game_id:gameId,picked_team:pickedTeam,home_team:g?.home,away_team:g?.away,game_date:getToday()};});
          if(sel.length<3||sel.length>5){setMsg("Selecciona entre 3 y 5 juegos");return;}
          setParlayLoading(true);
          const d=await pickemAPI("createParlay",{body:{userId:user.id,groupId:selGroup.id,parlayPicks:sel}});
          if(d.ok){setMsg("Parlay guardado");pickemAPI("myParlay",{params:{userId:user.id,groupId:selGroup.id}}).then(r=>{if(r.ok)setParlay(r.parlay);});}
          else setMsg(d.error);
          setParlayLoading(false);
        };
        return <>
          <Card style={{marginBottom:T.space[4]}}>
            <div style={{fontSize:T.font.base,fontWeight:600,color:T.text.primary,marginBottom:T.space[1]}}>Parlay de la semana</div>
            <div style={{fontSize:T.font.sm,color:T.text.secondary,lineHeight:1.5}}>Selecciona de 3 a 5 partidos. Si aciertas todos, ganas 30 monedas por pick. Se reinicia cada semana.</div>
          </Card>
          {parlay?<Card style={{marginBottom:T.space[4],borderColor:parlay.status==="won"?T.success.border:parlay.status==="lost"?T.danger.border:T.border.base}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:T.space[3]}}>
              <div style={{fontSize:T.font.base,fontWeight:600,color:T.text.primary}}>Tu parlay</div>
              <Tag c={parlay.status==="won"?T.success.base:parlay.status==="lost"?T.danger.base:T.text.tertiary}>{parlay.status==="won"?"Ganó":parlay.status==="lost"?"Perdió":"En curso"}</Tag>
            </div>
            {(parlay.picks||[]).map((p,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:T.space[2],marginBottom:T.space[2],padding:`${T.space[2]}px ${T.space[3]}px`,background:T.surface[2],borderRadius:T.radius.sm}}>
              {logo(p.picked_team,18)}<span style={{fontSize:T.font.sm,fontWeight:600,color:T.text.primary,flex:1}}>{p.picked_team}</span>
              <span style={{fontSize:T.font.xs,color:T.text.tertiary}}>{p.away_team} @ {p.home_team}</span>
              {p.scored?<Tag c={p.correct?T.success.base:T.danger.base}>{p.correct?"Acierto":"Falló"}</Tag>:<Tag c={T.text.tertiary}>Pend.</Tag>}
            </div>)}
            {parlay.status==="won"&&<div style={{marginTop:T.space[2],fontSize:T.font.sm,color:T.success.base,fontWeight:600,textAlign:"center"}}>Ganaste {parlay.bonus_earned} monedas</div>}
            <button className="btn" onClick={()=>setParlay(null)} style={{...btnGhost,width:"100%",marginTop:T.space[2],padding:T.space[2],fontSize:T.font.xs}}>Cambiar selecciones</button>
          </Card>
          :<>
            {weekGames.length===0?<Card style={{textAlign:"center",padding:T.space[7]}}><div style={{fontSize:T.font.sm,color:T.text.tertiary}}>No hay partidos próximos disponibles</div></Card>
            :<>
              <div style={{...label,marginBottom:T.space[3]}}>{Object.keys(parlaySelections).length}/5 seleccionados {Object.keys(parlaySelections).length<3&&"· mínimo 3"}</div>
              {weekGames.map(g=><Card key={g.id} style={{marginBottom:T.space[2],borderColor:parlaySelections[g.id]?T.accent.border:T.border.subtle}}>
                <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:T.space[2]}}>
                  <span style={{fontSize:T.font.xs,color:T.text.tertiary}}>{g.away} @ {g.home}</span>
                  <div style={{display:"flex",gap:T.space[2]}}>
                    {[g.away,g.home].map(t=><button key={t} className="btn" onClick={()=>setParlaySelections(s=>{if(s[g.id]===t){const n={...s};delete n[g.id];return n;}if(Object.keys(s).length>=5&&!s[g.id]){setMsg("Máximo 5 juegos en el parlay");return s;}return {...s,[g.id]:t};})} style={{padding:`${T.space[1]}px ${T.space[3]}px`,borderRadius:T.radius.sm,background:parlaySelections[g.id]===t?T.accent.subtle:T.surface[2],border:`1px solid ${parlaySelections[g.id]===t?T.accent.base:T.border.subtle}`,color:parlaySelections[g.id]===t?T.accent.base:T.text.secondary,fontSize:T.font.xs,fontWeight:600,display:"flex",alignItems:"center",gap:T.space[1]}}>{logo(t,16)}{t}</button>)}
                  </div>
                </div>
              </Card>)}
              <button className="btn" onClick={saveParlay} disabled={Object.keys(parlaySelections).length<3||parlayLoading} style={{...(Object.keys(parlaySelections).length>=3?btnPrimary:btnGhost),width:"100%",padding:T.space[3],fontSize:T.font.base,marginTop:T.space[2]}}>{parlayLoading?<Spin s={13}/>:`Guardar parlay (${Object.keys(parlaySelections).length})`}</button>
            </>}
          </>}
        </>;
      })()}
    </>;
    })()}

    <Card style={{marginTop:T.space[5]}}>
      <div style={{...label,marginBottom:T.space[3]}}>Sistema de puntos</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:T.space[2]}}>
        {[["1x — seguro","10 pts"],["2x — riesgo","20 pts"],["3x — alto riesgo","30 pts"]].map(([l,v])=>
          <div key={l} style={{background:T.surface[2],borderRadius:T.radius.sm,padding:T.space[3],textAlign:"center"}}>
            <div style={{fontSize:T.font.xs,color:T.text.tertiary,marginBottom:T.space[1]}}>{l}</div>
            <div style={{fontSize:T.font.base,fontWeight:700,color:T.text.primary}}>{v}</div>
          </div>)}
      </div>
    </Card>

    {confirmLeave&&<div onClick={()=>!leaveLoading&&setConfirmLeave(false)} role="dialog" aria-modal="true" style={{position:"fixed",inset:0,background:"#00000099",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:T.space[5]}}>
      <div onClick={e=>e.stopPropagation()} style={{background:T.surface[1],border:`1px solid ${T.border.base}`,borderRadius:T.radius.lg,padding:T.space[5],maxWidth:340,width:"100%",boxShadow:T.shadow.lg}}>
        <div style={{fontSize:T.font.lg,fontWeight:700,color:T.text.primary,marginBottom:T.space[2]}}>¿Salir de {selGroup?.name}?</div>
        <div style={{fontSize:T.font.sm,color:T.text.secondary,lineHeight:1.6,marginBottom:T.space[5]}}>
          Dejarás de aparecer en el ranking. Tus apuestas abiertas se cancelarán y se te devolverán las monedas. Puedes volver a entrar con el código.
        </div>
        <div style={{display:"flex",gap:T.space[2]}}>
          <button className="btn" onClick={()=>setConfirmLeave(false)} disabled={leaveLoading} style={{...btnGhost,flex:1,padding:T.space[3],fontSize:T.font.sm}}>Cancelar</button>
          <button className="btn" onClick={leaveGroup} disabled={leaveLoading} style={{flex:1,padding:T.space[3],borderRadius:T.radius.base,background:T.danger.base,color:"#fff",fontSize:T.font.sm,fontWeight:600}}>{leaveLoading?<Spin s={13}/>:"Salir"}</button>
        </div>
      </div>
    </div>}

    {/* ─── PERFIL ─── */}
    {profileModal&&(()=>{
      const pItems=profileData?.shopItems||[];
      const pNameClr=getNameColor(pItems);
      const pPrefix=getNamePrefix(pItems);
      const pBorder=getBorderColor(pItems);
      const curStreak=streaks[profileModal.user_id]||0;
      return<div style={{position:"fixed",inset:0,zIndex:2000,background:"#00000099",display:"flex",alignItems:"flex-end"}} onClick={()=>{setProfileModal(null);setProfileData(null);}}>
        <div style={{background:T.surface[1],borderTop:`1px solid ${T.border.base}`,borderRadius:`${T.radius.xl}px ${T.radius.xl}px 0 0`,padding:T.space[5],width:"100%",maxHeight:"82vh",overflowY:"auto",boxShadow:T.shadow.lg}} onClick={e=>e.stopPropagation()}>
          <div style={{width:36,height:4,borderRadius:2,background:T.border.strong,margin:`0 auto ${T.space[4]}px`}}/>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:T.space[4]}}>
            <div style={{display:"flex",alignItems:"center",gap:T.space[3]}}>
              <div style={{width:48,height:48,borderRadius:"50%",background:T.surface[2],border:`1px solid ${pBorder||T.border.base}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:T.font.xl,flexShrink:0}}>{profileModal.avatar_emoji||"🏀"}</div>
              <div>
                <div style={{fontSize:T.font.xl,fontWeight:700,color:pNameClr||T.text.primary,letterSpacing:-0.4}}>{pPrefix}{profileModal.name||profileModal.user_name}</div>
                <div style={{display:"flex",gap:T.space[3],flexWrap:"wrap",marginTop:2}}>
                  {curStreak>=3&&<span style={{fontSize:T.font.xs,color:T.warning.base,fontWeight:600}}>{curStreak} en racha</span>}
                  {profileData?.stats?.bestStreak>=5&&<span style={{fontSize:T.font.xs,color:T.text.tertiary}}>Mejor: {profileData.stats.bestStreak}</span>}
                </div>
              </div>
            </div>
            <button className="btn" onClick={()=>{setProfileModal(null);setProfileData(null);}} style={{background:"none",color:T.text.tertiary,fontSize:T.font.xl,lineHeight:1}}>×</button>
          </div>

          {!profileData?<div style={{textAlign:"center",padding:T.space[6]}}><Spin/></div>:<>
            <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:T.space[2],marginBottom:T.space[4]}}>
              {[[profileData.stats?.totalPicks||0,"Picks"],[profileData.stats?.totalCorrect||0,"Aciertos"],[`${profileData.stats?.accuracy||0}%`,"Precisión"],[profileData.stats?.totalPoints||0,"Puntos"],[profileData.stats?.bestStreak||0,"Racha"]].map(([v,l])=>
                <div key={l} style={{background:T.surface[2],borderRadius:T.radius.sm,padding:`${T.space[3]}px ${T.space[1]}px`,textAlign:"center"}}>
                  <div style={{fontSize:T.font.base,fontWeight:700,color:T.text.primary}}>{v}</div>
                  <div style={{fontSize:T.font.xs,color:T.text.tertiary,marginTop:2}}>{l}</div>
                </div>)}
            </div>

            {pItems.length>0&&<div style={{marginBottom:T.space[4]}}>
              <div style={{...label,marginBottom:T.space[2]}}>Items de tienda</div>
              <div style={{display:"flex",gap:T.space[2],flexWrap:"wrap"}}>
                {pItems.map(key=>{
                  const def=SHOP_ITEMS.find(i=>i.key===key);
                  return def?<div key={key} style={{background:T.surface[2],border:`1px solid ${T.border.subtle}`,borderRadius:T.radius.full,padding:`3px ${T.space[3]}px`,fontSize:T.font.xs,color:T.text.secondary}}>
                    {def.name.replace("Título ","").replace("Nombre ","").replace("Marco ","")}
                  </div>:null;
                })}
              </div>
            </div>}

            {(profileData.stats?.topTeams||[]).length>0&&<div style={{marginBottom:T.space[4]}}>
              <div style={{...label,marginBottom:T.space[2]}}>Equipos favoritos</div>
              <div style={{display:"flex",gap:T.space[2],flexWrap:"wrap"}}>
                {profileData.stats.topTeams.slice(0,5).map(t=><div key={t.team} style={{background:T.surface[2],border:`1px solid ${T.border.subtle}`,borderRadius:T.radius.full,padding:`4px ${T.space[3]}px`,display:"flex",alignItems:"center",gap:T.space[2]}}>
                  {logo(t.team,16)}<span style={{fontSize:T.font.xs,fontWeight:600,color:T.text.secondary}}>{t.team}</span><span style={{fontSize:T.font.xs,color:T.text.tertiary}}>{t.acc}%</span>
                </div>)}
              </div>
            </div>}

            {profileData.achievements?.filter(a=>!a.achievement_key.startsWith("shop_")).length>0&&<div style={{marginBottom:T.space[4]}}>
              <div style={{...label,marginBottom:T.space[2]}}>Logros</div>
              <div style={{display:"flex",gap:T.space[2],flexWrap:"wrap"}}>
                {profileData.achievements.filter(a=>!a.achievement_key.startsWith("shop_")).map(a=>{
                  const def=ACHIEVEMENT_DEFS.find(d=>d.key===a.achievement_key);
                  return def?<div key={a.achievement_key} style={{background:T.surface[2],border:`1px solid ${T.border.subtle}`,borderRadius:T.radius.sm,padding:`${T.space[2]}px ${T.space[3]}px`}} title={def.desc}>
                    <div style={{fontSize:T.font.xs,color:T.text.secondary}}>{def.name}</div>
                  </div>:null;
                })}
              </div>
            </div>}

            <button className="btn" onClick={()=>loadH2H(profileModal)} style={{...btnGhost,width:"100%",padding:T.space[3],fontSize:T.font.sm}}>Ver H2H</button>
          </>}
        </div>
      </div>;
    })()}
  </div>);
};