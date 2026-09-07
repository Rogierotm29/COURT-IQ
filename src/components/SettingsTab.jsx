import { useState, useEffect } from "react";
import { T } from "../theme";
import { Card, ST, Spin, Tag } from "./ui";
import { SHOP_ITEMS, ACHIEVEMENT_DEFS } from "../data/shop";
import { pickemAPI } from "../api/pickem";
import { getNameColor, getNamePrefix, getBorderColor } from "../utils/cosmetics";
import { isIOS, autoSubscribePush } from "../utils/push";
import { useCosmetics } from "../context/CosmeticsContext";
/* ═══ SETTINGS TAB ═══ */
const EMOJI_OPTS=["🏀","🏆","🔥","⭐","💎","👑","🦁","🐺","🦅","🐯","💪","🎯","🚀","✨","🌟","🎮","🃏","🥇","🎖️","🏅","🧠","💫","⚡","🎪","🦎","🐻","🏟️","🔮","🎲","🌊"];

const NOTIF_OPTS=[
  ["picks_reminder","Recordatorio de picks","30 minutos antes del primer partido"],
  ["win_notify","Cuando aciertes","Aviso por cada predicción correcta"],
  ["loss_notify","Cuando falles","Aviso cuando un pick no salga"],
  ["daily_summary","Resumen del día","Precisión y puntos al cerrar la jornada"],
];

export const SettingsTab=({userCtx,installPrompt,onInstalled})=>{
  const {user,logout,save}=userCtx||{};
  const [showEmojiPicker,setShowEmojiPicker]=useState(false);
  const [notifGranted,setNotifGranted]=useState(typeof Notification!=="undefined"&&Notification.permission==="granted");
  const [notifPrefs,setNotifPrefs]=useState({picks_reminder:true,win_notify:true,loss_notify:true,daily_summary:true});
  const [notifLoading,setNotifLoading]=useState(false);
  const [msg,setMsg]=useState(null);              // {text, kind}
  const [achievements,setAchievements]=useState([]);
  const [showDeleteConfirm,setShowDeleteConfirm]=useState(false);
  const [deleteLoading,setDeleteLoading]=useState(false);
  const [emailInput,setEmailInput]=useState("");
  const [emailLoading,setEmailLoading]=useState(false);
  const [emailMsg,setEmailMsg]=useState(null);
  const [myStats,setMyStats]=useState(null);
    const { items:myShopItems, equipped:myEquipped } = useCosmetics();

  const readEquipped=(uid)=>{
    try{ return JSON.parse(localStorage.getItem("courtiq_equipped_"+uid)||"{}"); }
    catch(e){ console.warn("No se pudieron leer los items equipados:",e.message); return {}; }
  };

  useEffect(()=>{
    if(!user) return;
    pickemAPI("getNotifPrefs",{params:{userId:user.id}}).then(d=>{if(d.ok)setNotifPrefs(d.prefs);});
    pickemAPI("getAchievements",{params:{userId:user.id}}).then(d=>{if(d.ok)setAchievements(d.achievements||[]);});
    pickemAPI("userProfile",{params:{userId:user.id,targetId:user.id}}).then(d=>{if(d.ok)setMyStats(d.stats);});
    if(user.email) setEmailInput(user.email);
  },[user]);

  const flash=(text,kind="ok")=>{setMsg({text,kind});setTimeout(()=>setMsg(null),4500);};

  const saveEmail=async()=>{
    setEmailLoading(true);setEmailMsg(null);
    const d=await pickemAPI("updateEmail",{body:{userId:user.id,email:emailInput.trim()}});
    if(d.ok){setEmailMsg({text:"Correo guardado",kind:"ok"});save({...user,email:emailInput.trim()||undefined});}
    else setEmailMsg({text:d.error||"No se pudo guardar",kind:"error"});
    setEmailLoading(false);
    setTimeout(()=>setEmailMsg(null),4000);
  };

  const subscribePush=async()=>{
    setNotifLoading(true);setMsg(null);
    try{
      await autoSubscribePush(user.id);
      setNotifGranted(true);
      flash("Notificaciones activadas");
    }catch(e){
      if(e.message==="iOS_NOT_INSTALLED"){
        flash("En iPhone debes instalar la app primero: Compartir → Agregar a inicio. Después activa las notificaciones.","error");
      } else flash(e.message,"error");
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
      flash("Notificaciones desactivadas");
    }catch(e){flash(e.message,"error");}
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
    if(d.ok){logout();localStorage.clear();}
    else {flash("No se pudo eliminar: "+d.error,"error");setShowDeleteConfirm(false);}
    setDeleteLoading(false);
  };

  const label={fontSize:T.font.xs,color:T.text.tertiary,textTransform:"uppercase",letterSpacing:1.2,fontWeight:600};
  const inputBase={background:T.surface[2],border:`1px solid ${T.border.base}`,borderRadius:T.radius.base,padding:`${T.space[3]}px ${T.space[4]}px`,color:T.text.primary,fontSize:T.font.sm,boxSizing:"border-box"};
  const btnPrimary={background:T.accent.base,color:"#fff",borderRadius:T.radius.base,fontWeight:600};
  const btnGhost={background:T.surface[2],border:`1px solid ${T.border.base}`,color:T.text.secondary,borderRadius:T.radius.base,fontWeight:600};

  if(!user) return(
    <div className="fade-up">
      <ST sub="Cuenta">Configuración</ST>
      <Card style={{textAlign:"center",padding:T.space[7]}}>
        <div style={{fontSize:T.font.base,fontWeight:600,color:T.text.primary,marginBottom:T.space[2]}}>Inicia sesión primero</div>
        <div style={{fontSize:T.font.sm,color:T.text.tertiary}}>Ve a Grupos para crear tu perfil</div>
      </Card>
    </div>
  );

  const nameClr=getNameColor(myShopItems,myEquipped);
  const prefix=getNamePrefix(myShopItems,myEquipped);
  const borderClr=getBorderColor(myShopItems,myEquipped);

  return(<div className="fade-up">
    {/* ─── PERFIL ─── */}
    <ST sub="Cuenta">Mi perfil</ST>
    <Card style={{marginBottom:T.space[4]}}>
      <div style={{display:"flex",alignItems:"center",gap:T.space[4]}}>
        <button className="btn" onClick={()=>setShowEmojiPicker(p=>!p)} title="Cambiar avatar" style={{
          width:52, height:52, borderRadius:"50%", background:T.surface[2],
          border:`1px solid ${borderClr||(showEmojiPicker?T.accent.base:T.border.base)}`,
          display:"flex", alignItems:"center", justifyContent:"center",
          fontSize:T.font.xl, flexShrink:0,
          boxShadow:borderClr?`0 0 8px ${borderClr}55`:undefined,
        }}>{user.avatar_emoji||"🏀"}</button>

        <div style={{flex:1,minWidth:0}}>
          <div style={{fontSize:T.font.lg,fontWeight:600,color:nameClr||T.text.primary}}>{prefix}{user.name}</div>
          <div style={{fontSize:T.font.xs,color:T.text.tertiary,marginBottom:myShopItems.length?T.space[2]:0}}>Toca el avatar para cambiarlo</div>
          {myShopItems.length>0&&<div style={{display:"flex",gap:T.space[1],flexWrap:"wrap"}}>
            {["title","color","border"].map(type=>{
              const key=myEquipped[type];
              const item=key?SHOP_ITEMS.find(i=>i.key===key):null;
              return item?<Tag key={type} c={T.text.tertiary}>{item.name.replace("Título ","").replace("Nombre ","").replace("Marco ","")}</Tag>:null;
            })}
          </div>}
        </div>

        <button className="btn" onClick={logout} style={{...btnGhost,padding:`${T.space[2]}px ${T.space[4]}px`,fontSize:T.font.sm,flexShrink:0}}>Salir</button>
      </div>

      {showEmojiPicker&&<div style={{marginTop:T.space[4],paddingTop:T.space[3],borderTop:`1px solid ${T.border.subtle}`}}>
        <div style={{...label,marginBottom:T.space[3]}}>Elige tu avatar</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:T.space[2]}}>
          {EMOJI_OPTS.map(e=><button key={e} className="btn" onClick={()=>saveEmoji(e)} style={{
            width:38, height:38, borderRadius:T.radius.sm,
            background:user.avatar_emoji===e?T.accent.subtle:T.surface[2],
            border:`1px solid ${user.avatar_emoji===e?T.accent.base:T.border.subtle}`,
            fontSize:T.font.lg,
          }}>{e}</button>)}
        </div>
      </div>}
    </Card>

    {/* ─── STATS ─── */}
    {myStats&&<Card style={{marginBottom:T.space[5]}}>
      <div style={{...label,marginBottom:T.space[3]}}>Mis estadísticas</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(84px,1fr))",gap:T.space[2]}}>
        {[[myStats.totalPicks||0,"Picks"],[myStats.totalCorrect||0,"Aciertos"],[`${myStats.accuracy||0}%`,"Precisión"],[myStats.totalPoints||0,"Puntos"],[myStats.bestStreak||0,"Mejor racha"]].map(([v,l])=>
          <div key={l} style={{background:T.surface[2],borderRadius:T.radius.sm,padding:`${T.space[3]}px ${T.space[1]}px`,textAlign:"center"}}>
            <div style={{fontSize:T.font.lg,fontWeight:700,color:T.text.primary}}>{v}</div>
            <div style={{fontSize:T.font.xs,color:T.text.tertiary,marginTop:2}}>{l}</div>
          </div>)}
      </div>
    </Card>}

    {/* ─── INSTALAR ─── */}
    {(installPrompt||isIOS())&&<>
      <ST sub="Aplicación">Instalar Court IQ</ST>
      <Card style={{marginBottom:T.space[5]}}>
        {isIOS()
          ?<div>
            <div style={{fontSize:T.font.sm,color:T.text.secondary,lineHeight:1.6,marginBottom:T.space[4]}}>
              En iPhone o iPad debes instalar la app desde Safari para recibir notificaciones.
            </div>
            <div style={{display:"flex",flexDirection:"column",gap:T.space[2]}}>
              {[["1","Toca","Compartir","en la barra inferior de Safari"],["2","Baja y elige","Agregar a pantalla de inicio",""],["3","Confirma con","Agregar","arriba a la derecha"]].map(([n,pre,bold,post])=>
                <div key={n} style={{display:"flex",gap:T.space[3],alignItems:"center",padding:`${T.space[2]}px ${T.space[3]}px`,background:T.surface[2],borderRadius:T.radius.sm}}>
                  <div style={{width:20,height:20,borderRadius:"50%",background:T.accent.base,display:"flex",alignItems:"center",justifyContent:"center",fontSize:T.font.xs,fontWeight:700,color:"#fff",flexShrink:0}}>{n}</div>
                  <div style={{fontSize:T.font.sm,color:T.text.secondary}}>{pre} <b style={{color:T.text.primary}}>{bold}</b> {post}</div>
                </div>
              )}
            </div>
          </div>
          :<div>
            <div style={{fontSize:T.font.sm,color:T.text.secondary,lineHeight:1.6,marginBottom:T.space[4]}}>
              Instálala para tener acceso directo desde tu pantalla de inicio, sin barra de navegador.
            </div>
            <button className="btn" onClick={async()=>{if(!installPrompt)return;installPrompt.prompt();const{outcome}=await installPrompt.userChoice;if(outcome==="accepted")onInstalled?.();}} style={{...btnPrimary,width:"100%",padding:T.space[3],fontSize:T.font.base}}>Instalar</button>
          </div>
        }
      </Card>
    </>}

    {/* ─── NOTIFICACIONES ─── */}
    <ST sub="Push">Notificaciones</ST>
    <Card style={{marginBottom:T.space[5]}}>
      {msg&&<div style={{
        marginBottom:T.space[4], padding:`${T.space[3]}px ${T.space[4]}px`,
        background:T.surface[2], borderLeft:`3px solid ${msg.kind==="error"?T.danger.base:T.success.base}`,
        borderRadius:T.radius.sm, fontSize:T.font.sm, color:T.text.secondary, lineHeight:1.5,
      }}>{msg.text}</div>}

      {!notifGranted
        ?<>
          <div style={{fontSize:T.font.sm,color:T.text.secondary,lineHeight:1.6,marginBottom:T.space[4]}}>
            Actívalas para recibir recordatorios antes de los partidos, avisos de resultados y tu resumen diario.
          </div>
          <button className="btn" onClick={subscribePush} disabled={notifLoading} style={{...btnPrimary,width:"100%",padding:T.space[3],fontSize:T.font.base}}>
            {notifLoading?<Spin s={14}/>:"Activar notificaciones"}
          </button>
        </>
        :<>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:T.space[4],gap:T.space[3]}}>
            <div style={{fontSize:T.font.sm,color:T.text.secondary}}>Activas — elige cuáles recibir</div>
            <button className="btn" onClick={unsubscribePush} disabled={notifLoading} style={{...btnGhost,padding:`${T.space[1]}px ${T.space[3]}px`,fontSize:T.font.xs,flexShrink:0}}>
              {notifLoading?<Spin s={11}/>:"Desactivar"}
            </button>
          </div>
          {NOTIF_OPTS.map(([key,lbl,desc],i)=>
            <div key={key} style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:T.space[3],padding:`${T.space[3]}px 0`,borderBottom:i<NOTIF_OPTS.length-1?`1px solid ${T.border.subtle}`:"none"}}>
              <div style={{minWidth:0}}>
                <div style={{fontSize:T.font.sm,fontWeight:600,color:T.text.primary}}>{lbl}</div>
                <div style={{fontSize:T.font.xs,color:T.text.tertiary,marginTop:2}}>{desc}</div>
              </div>
              <button
                className="btn"
                onClick={()=>saveNotifPref(key,!notifPrefs[key])}
                role="switch"
                aria-checked={!!notifPrefs[key]}
                aria-label={lbl}
                style={{
                  width:42, height:24, borderRadius:12, flexShrink:0, position:"relative",
                  background:notifPrefs[key]?T.accent.base:T.surface[3],
                  border:`1px solid ${notifPrefs[key]?T.accent.base:T.border.base}`,
                  transition:"background .2s",
                }}
              >
                <div style={{
                  width:16, height:16, borderRadius:"50%", background:"#fff",
                  position:"absolute", top:3, left:notifPrefs[key]?"calc(100% - 20px)":3,
                  transition:"left .2s",
                }}/>
              </button>
            </div>
          )}
        </>
      }
    </Card>

    {/* ─── LOGROS ─── */}
    <ST sub="Progreso">Logros</ST>
    {(()=>{
      const defs=ACHIEVEMENT_DEFS.filter(a=>!a.key.startsWith("shop_"));
      const unlockedCount=defs.filter(a=>achievements.some(x=>x.achievement_key===a.key)).length;
      return<>
        <div style={{fontSize:T.font.sm,color:T.text.tertiary,marginBottom:T.space[3]}}>
          {unlockedCount} de {defs.length} desbloqueados
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(150px,1fr))",gap:T.space[2],marginBottom:T.space[5]}}>
          {defs.map(a=>{
            const unlocked=achievements.some(x=>x.achievement_key===a.key);
            return<Card key={a.key} style={{padding:T.space[3],opacity:unlocked?1:.45,borderColor:unlocked?T.accent.border:T.border.subtle}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:T.space[2],marginBottom:T.space[1]}}>
                <div style={{fontSize:T.font.sm,fontWeight:600,color:T.text.primary}}>{a.name}</div>
                {unlocked&&<div style={{width:6,height:6,borderRadius:"50%",background:T.accent.base,flexShrink:0}}/>}
              </div>
              <div style={{fontSize:T.font.xs,color:T.text.tertiary,lineHeight:1.5}}>{a.desc}</div>
            </Card>;
          })}
        </div>
      </>;
    })()}

    {/* ─── CORREO ─── */}
    <ST sub="Seguridad">Correo de recuperación</ST>
    <Card style={{marginBottom:T.space[5]}}>
      <div style={{fontSize:T.font.sm,color:T.text.secondary,lineHeight:1.6,marginBottom:T.space[4]}}>
        Vincula un correo para poder recuperar tu PIN si lo olvidas.
      </div>
      <div style={{display:"flex",gap:T.space[2]}}>
        <input value={emailInput} onChange={e=>setEmailInput(e.target.value)} type="email" placeholder="tu@correo.com"
          style={{...inputBase,flex:1,minWidth:0,borderColor:user?.email?T.accent.border:T.border.base}}/>
        <button className="btn" onClick={saveEmail} disabled={emailLoading} style={{...btnPrimary,padding:`${T.space[3]}px ${T.space[4]}px`,fontSize:T.font.sm,flexShrink:0}}>
          {emailLoading?<Spin s={13}/>:"Guardar"}
        </button>
      </div>
      {user?.email&&<div style={{fontSize:T.font.xs,color:T.text.tertiary,marginTop:T.space[2]}}>Correo vinculado — puedes recuperar tu PIN por email</div>}
      {emailMsg&&<div style={{fontSize:T.font.xs,color:emailMsg.kind==="error"?T.danger.base:T.success.base,marginTop:T.space[2]}}>{emailMsg.text}</div>}
    </Card>

    {/* ─── LEGAL ─── */}
    <ST sub="Legal">Privacidad</ST>
    <Card style={{marginBottom:T.space[5]}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:T.space[3]}}>
        <div>
          <div style={{fontSize:T.font.sm,fontWeight:600,color:T.text.primary}}>Política de privacidad</div>
          <div style={{fontSize:T.font.xs,color:T.text.tertiary,marginTop:2}}>Qué datos guardamos y cómo los usamos</div>
        </div>
        <a href="/privacy.html" target="_blank" rel="noopener noreferrer" style={{
          padding:`${T.space[2]}px ${T.space[4]}px`, borderRadius:T.radius.base,
          background:T.surface[2], border:`1px solid ${T.border.base}`,
          color:T.text.secondary, fontSize:T.font.sm, fontWeight:600,
          textDecoration:"none", flexShrink:0,
        }}>Ver</a>
      </div>
    </Card>

    {/* ─── ZONA PELIGROSA ─── */}
    <ST sub="Zona peligrosa">Eliminar cuenta</ST>
    <Card style={{marginBottom:T.space[5],borderColor:T.danger.border}}>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",gap:T.space[3]}}>
        <div>
          <div style={{fontSize:T.font.sm,fontWeight:600,color:T.text.primary}}>Eliminar mi cuenta</div>
          <div style={{fontSize:T.font.xs,color:T.text.tertiary,marginTop:2}}>Borra permanentemente todos tus datos</div>
        </div>
        <button className="btn" onClick={()=>setShowDeleteConfirm(true)} style={{
          padding:`${T.space[2]}px ${T.space[4]}px`, borderRadius:T.radius.base,
          background:T.danger.subtle, border:`1px solid ${T.danger.border}`,
          color:T.danger.base, fontSize:T.font.sm, fontWeight:600, flexShrink:0,
        }}>Eliminar</button>
      </div>
    </Card>

    {/* Modal eliminar */}
    {showDeleteConfirm&&<div
      onClick={()=>!deleteLoading&&setShowDeleteConfirm(false)}
      role="dialog" aria-modal="true"
      style={{position:"fixed",inset:0,background:"#00000099",zIndex:3000,display:"flex",alignItems:"center",justifyContent:"center",padding:T.space[5]}}
    >
      <div onClick={e=>e.stopPropagation()} style={{
        background:T.surface[1], border:`1px solid ${T.danger.border}`,
        borderRadius:T.radius.lg, padding:T.space[5], maxWidth:340, width:"100%",
        boxShadow:T.shadow.lg,
      }}>
        <div style={{fontSize:T.font.lg,fontWeight:700,color:T.text.primary,marginBottom:T.space[2]}}>¿Eliminar tu cuenta?</div>
        <div style={{fontSize:T.font.sm,color:T.text.secondary,lineHeight:1.6,marginBottom:T.space[5]}}>
          Esta acción es <b style={{color:T.danger.base}}>permanente</b>. Se eliminarán todos tus picks, monedas, logros y mensajes.
        </div>
        <div style={{display:"flex",gap:T.space[2]}}>
          <button className="btn" onClick={()=>setShowDeleteConfirm(false)} disabled={deleteLoading} style={{...btnGhost,flex:1,padding:T.space[3],fontSize:T.font.sm}}>Cancelar</button>
          <button className="btn" onClick={deleteAccount} disabled={deleteLoading} style={{
            flex:1, padding:T.space[3], borderRadius:T.radius.base,
            background:T.danger.base, color:"#fff", fontSize:T.font.sm, fontWeight:600,
          }}>{deleteLoading?<Spin s={13}/>:"Eliminar"}</button>
        </div>
      </div>
    </div>}
  </div>);
};
