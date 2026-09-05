import { useState, useEffect } from "react";
import { C } from "../theme";
import { Card, ST, Spin } from "./ui";
import { SHOP_ITEMS, ACHIEVEMENT_DEFS } from "../data/shop";
import { pickemAPI } from "../api/pickem";
import { getNameColor, getNamePrefix, getBorderColor } from "../utils/cosmetics";
import { isIOS, autoSubscribePush } from "../utils/push";

/* ═══ SETTINGS TAB ═══ */
const EMOJI_OPTS=["🏀","🏆","🔥","⭐","💎","👑","🦁","🐺","🦅","🐯","💪","🎯","🚀","✨","🌟","🎮","🃏","🥇","🎖️","🏅","🧠","💫","⚡","🎪","🦎","🐻","🏟️","🔮","🎲","🌊"];

export const SettingsTab=({userCtx,installPrompt,onInstalled})=>{
  const {user,logout,save}=userCtx||{};
  const [showEmojiPicker,setShowEmojiPicker]=useState(false);
  const [notifGranted,setNotifGranted]=useState(typeof Notification!=="undefined"&&Notification.permission==="granted");
  const [notifPrefs,setNotifPrefs]=useState({picks_reminder:true,win_notify:true,loss_notify:true,daily_summary:true});
  const [notifLoading,setNotifLoading]=useState(false);
  const [msg,setMsg]=useState("");
  const [achievements,setAchievements]=useState([]);
  const [showDeleteConfirm,setShowDeleteConfirm]=useState(false);
  const [deleteLoading,setDeleteLoading]=useState(false);
  const [emailInput,setEmailInput]=useState("");
  const [emailLoading,setEmailLoading]=useState(false);
  const [emailMsg,setEmailMsg]=useState("");
  const [myStats,setMyStats]=useState(null);
  const [myShopItems,setMyShopItems]=useState([]);
  const [myEquippedSettings,setMyEquippedSettings]=useState(()=>JSON.parse(localStorage.getItem("courtiq_equipped_"+(user?.id||""))||"{}"));

  useEffect(()=>{
    if(!user) return;
    pickemAPI("getNotifPrefs",{params:{userId:user.id}}).then(d=>{if(d.ok)setNotifPrefs(d.prefs);});
    pickemAPI("getAchievements",{params:{userId:user.id}}).then(d=>{if(d.ok)setAchievements(d.achievements||[]);});
    pickemAPI("userProfile",{params:{userId:user.id,targetId:user.id}}).then(d=>{if(d.ok){setMyStats(d.stats);setMyShopItems(d.shopItems||[]);}});
    setMyEquippedSettings(JSON.parse(localStorage.getItem("courtiq_equipped_"+user.id)||"{}"));
    // Pre-fill email from stored user
    if(user.email) setEmailInput(user.email);
  },[user]);

  const saveEmail=async()=>{
    setEmailLoading(true);setEmailMsg("");
    const d=await pickemAPI("updateEmail",{body:{userId:user.id,email:emailInput.trim()}});
    if(d.ok){setEmailMsg("✅ Correo guardado");save({...user,email:emailInput.trim()||undefined});}
    else setEmailMsg(d.error||"Error");
    setEmailLoading(false);
    setTimeout(()=>setEmailMsg(""),4000);
  };

  const subscribePush=async()=>{
    setNotifLoading(true);setMsg("");
    try{
      await autoSubscribePush(user.id);
      setNotifGranted(true);
      setMsg("✅ ¡Notificaciones activadas correctamente!");
    }catch(e){
      if(e.message==="iOS_NOT_INSTALLED"){
        setMsg("📲 En iPhone debes instalar la app primero: toca Compartir → 'Agregar a inicio'. Después activa las notificaciones.");
      } else {
        setMsg("❌ "+e.message);
      }
    }
    setNotifLoading(false);
  };

  const unsubscribePush=async()=>{
    setNotifLoading(true);
    try{
      const reg=await navigator.serviceWorker.ready;
      const sub=await reg.pushManager.getSubscription();
      if(sub) await sub.unsubscribe();
      await pickemAPI("unsubscribePush",{body:{userId:user.id}});
      setNotifGranted(false);
      setMsg("🔕 Notificaciones desactivadas");
    }catch(e){setMsg("Error: "+e.message);}
    setNotifLoading(false);
  };

  const saveNotifPref=(key,val)=>{
    const next={...notifPrefs,[key]:val};
    setNotifPrefs(next);
    pickemAPI("setNotifPrefs",{body:{userId:user.id,...next}});
  };

  const saveEmoji=async(emoji)=>{
    setShowEmojiPicker(false);
    save({...user,avatar_emoji:emoji});
    await pickemAPI("updateProfile",{body:{userId:user.id,avatarEmoji:emoji}});
  };

  const deleteAccount=async()=>{
    setDeleteLoading(true);
    const d=await pickemAPI("deleteAccount",{body:{userId:user.id}});
    if(d.ok){
      logout();
      localStorage.clear();
    } else {
      setMsg("Error al eliminar: "+d.error);
      setShowDeleteConfirm(false);
    }
    setDeleteLoading(false);
  };

  if(!user) return(
    <div className="fade-up">
      <Card style={{textAlign:"center",padding:"40px 20px"}}>
        <div style={{fontSize:48,marginBottom:12}}>⚙️</div>
        <div style={{fontSize:16,fontWeight:700,color:C.text,marginBottom:8}}>Inicia sesión primero</div>
        <div style={{fontSize:12,color:C.dim}}>Ve a Grupos para crear tu perfil</div>
      </Card>
    </div>
  );

  const settingsNameClr=getNameColor(myShopItems,myEquippedSettings);
  const settingsPrefix=getNamePrefix(myShopItems,myEquippedSettings);
  const settingsBorder=getBorderColor(myShopItems,myEquippedSettings);

  return(<div className="fade-up">
    {/* Perfil */}
    <ST sub="Cuenta">Mi Perfil</ST>
    <Card style={{marginBottom:14,background:`linear-gradient(135deg,${C.accent}11,${C.card})`,borderColor:`${C.accent}33`}}>
      <div style={{display:"flex",alignItems:"center",gap:14}}>
        <button className="btn" onClick={()=>setShowEmojiPicker(p=>!p)} style={{width:58,height:58,borderRadius:"50%",background:`${C.accent}20`,border:`2px solid ${settingsBorder||( showEmojiPicker?C.accent:C.accent+"44")}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:28,flexShrink:0,boxShadow:settingsBorder?`0 0 10px ${settingsBorder}55`:undefined}} title="Cambiar avatar">{user.avatar_emoji||"🏀"}</button>
        <div style={{flex:1}}>
          <div style={{fontSize:20,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:settingsNameClr||C.text}}>{settingsPrefix}{user.name}</div>
          <div style={{fontSize:10,color:C.muted,letterSpacing:1,marginBottom:4}}>Toca el emoji para cambiar avatar</div>
          {myShopItems.length>0&&<div style={{display:"flex",gap:4,flexWrap:"wrap"}}>
            {["title","color","border"].map(type=>{
              const key=myEquippedSettings[type];
              const item=key?SHOP_ITEMS.find(i=>i.key===key):null;
              return item?<span key={type} style={{fontSize:10,background:"#0d1117",border:`1px solid ${C.border}`,borderRadius:12,padding:"2px 7px",color:C.dim}}>{item.emoji} {item.name.replace("Título ","").replace("Nombre ","").replace("Marco ","")}</span>:null;
            })}
          </div>}
        </div>
        <button className="btn" onClick={logout} style={{padding:"8px 16px",borderRadius:8,background:"#ff444422",border:"1px solid #ff444444",color:"#ff6666",fontSize:12,fontWeight:700}}>Salir</button>
      </div>
      {showEmojiPicker&&<div style={{marginTop:14,paddingTop:12,borderTop:`1px solid ${C.border}`}}>
        <div style={{fontSize:10,color:C.muted,marginBottom:8,letterSpacing:1}}>ELIGE TU AVATAR</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
          {EMOJI_OPTS.map(e=><button key={e} className="btn" onClick={()=>saveEmoji(e)} style={{width:40,height:40,borderRadius:10,background:user.avatar_emoji===e?`${C.accent}22`:"#0a1018",border:`1px solid ${user.avatar_emoji===e?C.accent:C.border}`,fontSize:20}}>{e}</button>)}
        </div>
      </div>}
    </Card>

    {/* Stats personales */}
    {myStats&&<Card style={{marginBottom:14,background:"#0a1018"}}>
      <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>📊 Mis estadísticas</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(5,1fr)",gap:6}}>
        {[["🎯",myStats.totalPicks||0,"Picks",C.accent],["✅",myStats.totalCorrect||0,"Aciertos","#00FF9D"],["📊",`${myStats.accuracy||0}%`,"Precisión","#FFB800"],["⭐",myStats.totalPoints||0,"Puntos","#FF6B35"],["🔥",myStats.bestStreak||0,"Mejor racha","#FF6B35"]].map(([icon,v,l,c])=><div key={l} style={{background:"#0d1117",borderRadius:10,padding:"10px 4px",textAlign:"center"}}>
          <div style={{fontSize:10,marginBottom:2}}>{icon}</div>
          <div style={{fontSize:16,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:c}}>{v}</div>
          <div style={{fontSize:8,color:C.muted,marginTop:1,lineHeight:1.2}}>{l}</div>
        </div>)}
      </div>
    </Card>}

    {/* Instalar App */}
    {(installPrompt||isIOS())&&<>
      <ST sub="PWA">Instalar App</ST>
      <Card style={{marginBottom:18,borderColor:`${C.accent}33`}}>
        {isIOS()
          ?<div>
            <div style={{display:"flex",gap:12,alignItems:"flex-start",marginBottom:12}}>
              <span style={{fontSize:32}}>📲</span>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:4}}>Instalar en iPhone / iPad</div>
                <div style={{fontSize:12,color:C.dim,lineHeight:1.6}}>Para instalar Court IQ y habilitar notificaciones:</div>
              </div>
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {[["1","Toca el botón","📤 Compartir","en Safari (barra inferior)"],["2","Baja y busca","➕ Agregar a pantalla de inicio",""],["3","Toca","Agregar","en la esquina superior derecha"]].map(([n,pre,bold,post])=>
                <div key={n} style={{display:"flex",gap:10,alignItems:"center",padding:"8px 12px",background:"#0a1018",borderRadius:10,border:`1px solid ${C.border}`}}>
                  <div style={{width:24,height:24,borderRadius:"50%",background:C.accent,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:900,color:"#07090f",flexShrink:0}}>{n}</div>
                  <div style={{fontSize:12,color:C.text}}>{pre} <span style={{color:C.accent,fontWeight:700}}>{bold}</span> {post}</div>
                </div>
              )}
            </div>
          </div>
          :<div>
            <div style={{display:"flex",gap:12,alignItems:"center",marginBottom:12}}>
              <span style={{fontSize:32}}>📱</span>
              <div>
                <div style={{fontSize:14,fontWeight:700,color:C.text,marginBottom:2}}>Instalar Court IQ</div>
                <div style={{fontSize:12,color:C.dim}}>Acceso directo desde tu pantalla de inicio, sin navegador</div>
              </div>
            </div>
            <button className="btn" onClick={async()=>{if(!installPrompt)return;installPrompt.prompt();const{outcome}=await installPrompt.userChoice;if(outcome==="accepted")onInstalled?.();}} style={{width:"100%",padding:"13px",borderRadius:10,background:`linear-gradient(135deg,${C.accent},#0066ff)`,color:"#07090f",fontWeight:900,fontSize:14}}>📲 Instalar App</button>
          </div>
        }
      </Card>
    </>}

    {/* Notificaciones */}
    <ST sub="Push">Notificaciones</ST>
    <Card style={{marginBottom:18}}>
      {msg&&<div style={{fontSize:11,color:"#00FF9D",marginBottom:10,padding:"8px 10px",background:"#00FF9D11",borderRadius:8}}>{msg}</div>}
      {!notifGranted
        ?<>
          <div style={{fontSize:12,color:C.dim,marginBottom:12}}>Activa notificaciones para recordatorios de picks, alertas de aciertos y resúmenes diarios</div>
          <button className="btn" onClick={subscribePush} disabled={notifLoading} style={{width:"100%",padding:"13px",borderRadius:10,background:`linear-gradient(135deg,${C.accent},#0066ff)`,color:"#07090f",fontSize:13,fontWeight:900}}>{notifLoading?<Spin s={13}/>:"🔔 Activar notificaciones"}</button>
        </>
        :<>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
            <div style={{fontSize:11,color:"#00FF9D"}}>✅ Activas — elige cuáles recibir:</div>
            <button className="btn" onClick={unsubscribePush} disabled={notifLoading} style={{padding:"6px 12px",borderRadius:8,background:"#ff444422",border:"1px solid #ff444444",color:"#ff6666",fontSize:11,fontWeight:700}}>{notifLoading?<Spin s={11}/>:"🔕 Apagar"}</button>
          </div>
          {[["picks_reminder","⏰ Recordatorio de picks","30 min antes del primer partido"],["win_notify","🎉 Cuando aciertes","Celebra cada predicción correcta"],["loss_notify","😅 Cuando falles","Para que aprendas jeje"],["daily_summary","📊 Resumen del día","Precisión y puntos al final del día"]].map(([key,label,desc])=>
            <div key={key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"11px 0",borderBottom:`1px solid ${C.border}`}}>
              <div><div style={{fontSize:13,fontWeight:700,color:C.text}}>{label}</div><div style={{fontSize:10,color:C.dim}}>{desc}</div></div>
              <button className="btn" onClick={()=>saveNotifPref(key,!notifPrefs[key])} style={{width:46,height:26,borderRadius:13,background:notifPrefs[key]?C.accent:"#0a1018",border:`2px solid ${notifPrefs[key]?C.accent:C.border}`,position:"relative",flexShrink:0}}>
                <div style={{width:18,height:18,borderRadius:"50%",background:"#07090f",position:"absolute",top:2,left:notifPrefs[key]?"calc(100% - 22px)":2,transition:"left .2s"}}/>
              </button>
            </div>
          )}
        </>
      }
    </Card>

    {/* Puntuación */}
    <ST sub="Cómo funciona">Sistema de Puntos</ST>
    <Card style={{marginBottom:18}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8}}>
        {[["✅ Acierto","10 pts","#00FF9D"],["🔥 Racha","bonus","#FF6B35"],["🪙 Apuestas","vs grupo",C.accent]].map(([l,v,c])=>
          <div key={l} style={{background:"#0a1018",borderRadius:10,padding:"12px 8px",textAlign:"center"}}>
            <div style={{fontSize:18,marginBottom:4}}>{l.split(" ")[0]}</div>
            <div style={{fontSize:10,color:C.dim,marginBottom:4}}>{l.split(" ").slice(1).join(" ")}</div>
            <div style={{fontSize:17,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:c}}>{v}</div>
          </div>
        )}
      </div>
    </Card>

    {/* Logros */}
    <ST sub="Logros">Mis Badges</ST>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(130px,1fr))",gap:8,marginBottom:24}}>
      {ACHIEVEMENT_DEFS.filter(a=>!a.key.startsWith("shop_")).map(a=>{
        const unlocked=achievements.some(x=>x.achievement_key===a.key);
        return<Card key={a.key} style={{textAlign:"center",padding:"14px 10px",opacity:unlocked?1:0.35,borderColor:unlocked?`${C.accent}44`:C.border}}>
          <div style={{fontSize:28,marginBottom:6}}>{a.emoji}</div>
          <div style={{fontSize:11,fontWeight:800,color:unlocked?C.text:C.muted}}>{a.name}</div>
          <div style={{fontSize:9,color:C.dim,marginTop:2}}>{a.desc}</div>
          {unlocked&&<div style={{fontSize:8,color:C.accent,marginTop:4}}>✅ Desbloqueado</div>}
        </Card>;
      })}
    </div>

    {/* Legal */}
    <ST sub="Legal">Privacidad</ST>
    <Card style={{marginBottom:18}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:C.text}}>Política de Privacidad</div>
          <div style={{fontSize:10,color:C.dim,marginTop:2}}>Qué datos guardamos y cómo los usamos</div>
        </div>
        <a href="/privacy.html" target="_blank" style={{padding:"8px 14px",borderRadius:8,background:`${C.accent}15`,border:`1px solid ${C.accent}33`,color:C.accent,fontSize:12,fontWeight:700,textDecoration:"none",flexShrink:0}}>Ver →</a>
      </div>
    </Card>

    {/* Correo de recuperación */}
    <ST sub="Seguridad">Correo de recuperación</ST>
    <Card style={{marginBottom:18}}>
      <div style={{fontSize:12,color:C.dim,marginBottom:12}}>Vincula un correo para poder recuperar tu PIN si lo olvidas.</div>
      <div style={{display:"flex",gap:8}}>
        <input value={emailInput} onChange={e=>setEmailInput(e.target.value)} type="email" placeholder="tu@correo.com" style={{flex:1,background:"#0a1018",border:`1px solid ${user?.email?C.accent:C.border}`,borderRadius:10,padding:"11px 14px",color:C.text,fontSize:13,minWidth:0}}/>
        <button className="btn" onClick={saveEmail} disabled={emailLoading} style={{padding:"11px 16px",borderRadius:10,background:`linear-gradient(135deg,${C.accent},#0066ff)`,color:"#07090f",fontSize:13,fontWeight:800,flexShrink:0}}>{emailLoading?<Spin s={13}/>:"Guardar"}</button>
      </div>
      {user?.email&&<div style={{fontSize:10,color:"#22c55e",marginTop:6}}>✓ Correo vinculado — puedes recuperar tu PIN por email</div>}
      {emailMsg&&<div style={{fontSize:11,color:emailMsg.startsWith("✅")?"#22c55e":"#ff6666",marginTop:6}}>{emailMsg}</div>}
    </Card>

    {/* Zona peligrosa */}
    <ST sub="Zona peligrosa">Cuenta</ST>
    <Card style={{marginBottom:18,borderColor:"#ff444433"}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between"}}>
        <div>
          <div style={{fontSize:13,fontWeight:700,color:"#ff6666"}}>Eliminar cuenta</div>
          <div style={{fontSize:10,color:C.dim,marginTop:2}}>Borra permanentemente todos tus datos</div>
        </div>
        <button className="btn" onClick={()=>setShowDeleteConfirm(true)} style={{padding:"8px 14px",borderRadius:8,background:"#ff444422",border:"1px solid #ff444444",color:"#ff6666",fontSize:12,fontWeight:700,flexShrink:0}}>Eliminar</button>
      </div>
    </Card>

    {/* Modal confirmar eliminar */}
    {showDeleteConfirm&&<div onClick={()=>!deleteLoading&&setShowDeleteConfirm(false)} style={{position:"fixed",inset:0,background:"#00000099",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:24}}>
      <div onClick={e=>e.stopPropagation()} style={{background:C.card,border:"1px solid #ff444444",borderRadius:20,padding:28,maxWidth:320,width:"100%",textAlign:"center"}}>
        <div style={{fontSize:44,marginBottom:12}}>⚠️</div>
        <div style={{fontSize:17,fontWeight:900,color:C.text,marginBottom:8}}>¿Eliminar tu cuenta?</div>
        <div style={{fontSize:12,color:C.dim,lineHeight:1.6,marginBottom:20}}>Esta acción es <b style={{color:"#ff6666"}}>permanente e irreversible</b>. Se eliminarán todos tus picks, monedas, logros y mensajes.</div>
        <div style={{display:"flex",gap:10}}>
          <button className="btn" onClick={()=>setShowDeleteConfirm(false)} disabled={deleteLoading} style={{flex:1,padding:"13px",borderRadius:10,background:"#0a1018",border:`1px solid ${C.border}`,color:C.dim,fontWeight:700,fontSize:13}}>Cancelar</button>
          <button className="btn" onClick={deleteAccount} disabled={deleteLoading} style={{flex:1,padding:"13px",borderRadius:10,background:"#ff444422",border:"1px solid #ff444444",color:"#ff6666",fontWeight:900,fontSize:13}}>{deleteLoading?<Spin s={13}/>:"Sí, eliminar"}</button>
        </div>
      </div>
    </div>}
  </div>);
};