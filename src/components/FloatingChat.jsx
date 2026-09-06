import { useEffect, useState, useRef } from "react";
import { T } from "../theme";
import { Spin } from "./ui";
import { pickemAPI } from "../api/pickem";

/* ═══ FLOATING CHAT ═══ */
export const FloatingChat=({userCtx})=>{
  const {user}=userCtx||{};
  const [open,setOpen]=useState(false);
  const [msgs,setMsgs]=useState([]);
  const [input,setInput]=useState("");
  const [sending,setSending]=useState(false);
  const [group,setGroup]=useState(null);
  const [unread,setUnread]=useState(0);
  const endRef=useRef(null);
  const groupRef=useRef(null);
  const openRef=useRef(false);

  useEffect(()=>{openRef.current=open;},[open]);

  const getLastRead=(gid)=>localStorage.getItem(`courtiq_chat_read_${gid}`)||"0";
  const markRead=(gid)=>localStorage.setItem(`courtiq_chat_read_${gid}`,new Date().toISOString());

  const loadMsgs=(g,markAsRead=false)=>{
    pickemAPI("getChat",{params:{groupId:g.id}}).then(r=>{
      if(!r.ok) return;
      const messages=r.messages||[];
      setMsgs(messages);
      if(markAsRead){
        markRead(g.id);
        setUnread(0);
      } else {
        const lastRead=new Date(getLastRead(g.id)).getTime()||0;
        const count=messages.filter(m=>m.user_id!==user.id&&new Date(m.created_at).getTime()>lastRead).length;
        setUnread(count);
      }
    });
  };

  const switchGroup=(g)=>{
    setGroup(g);groupRef.current=g;
    setUnread(0);setMsgs([]);
    loadMsgs(g,openRef.current);
  };

  useEffect(()=>{
    if(!user) return;
    const params=new URLSearchParams(window.location.search);
    const chatParam=params.get("chat");
    const gid=chatParam||localStorage.getItem("courtiq_lastgroup");
    if(!gid) return;
    if(chatParam){
      const url=new URL(window.location.href);
      url.searchParams.delete("chat");
      window.history.replaceState({},"",url.toString());
    }
    pickemAPI("myGroups",{params:{userId:user.id}}).then(d=>{
      if(d.ok&&d.groups?.length){
        const g=d.groups.find(x=>x.id===gid)||d.groups[0];
        switchGroup(g);
        if(chatParam) setOpen(true);
      }
    });
  },[user]);

  useEffect(()=>{
    if(!user) return;
    const handler=(e)=>{
      const g=e.detail;
      if(g&&g.id!==groupRef.current?.id) switchGroup(g);
    };
    window.addEventListener("courtiq_group_changed",handler);
    return()=>window.removeEventListener("courtiq_group_changed",handler);
  },[user]);

  useEffect(()=>{
    const t=setInterval(()=>{
      if(groupRef.current&&user&&!document.hidden){
        loadMsgs(groupRef.current,openRef.current);
      }
    },20000);
    return()=>clearInterval(t);
  },[user]);

  useEffect(()=>{
    if(open&&groupRef.current&&user){
      loadMsgs(groupRef.current,true);
    }
  },[open]);

  useEffect(()=>{if(open)endRef.current?.scrollIntoView({behavior:"smooth"});},[msgs,open]);

  const send=async()=>{
    if(!input.trim()||!group||!user||sending) return;
    setSending(true);
    const text=input.trim();setInput("");
    await pickemAPI("sendChat",{body:{groupId:group.id,userId:user.id,content:text}});
    loadMsgs(group,true);
    setSending(false);
  };

  const openChat=()=>{setOpen(o=>{const next=!o;if(!o&&groupRef.current)markRead(groupRef.current.id);return next;});};

  if(!user) return null;

  return(<>
    {open&&<div style={{
      position:"fixed", bottom:80, right:T.space[4],
      width:Math.min(360,window.innerWidth-32), height:460,
      background:T.surface[1], border:`1px solid ${T.border.base}`,
      borderRadius:T.radius.lg, zIndex:1500,
      display:"flex", flexDirection:"column",
      boxShadow:T.shadow.lg, overflow:"hidden",
    }}>
      {/* Header */}
      <div style={{
        padding:`${T.space[3]}px ${T.space[4]}px`,
        borderBottom:`1px solid ${T.border.subtle}`,
        display:"flex", alignItems:"center", justifyContent:"space-between",
        background:T.surface[2],
      }}>
        <div>
          <div style={{fontSize:T.font.base,fontWeight:600,color:T.text.primary}}>{group?.name||"Chat"}</div>
          <div style={{fontSize:T.font.xs,color:T.text.tertiary,marginTop:1}}>Actualiza cada 20s</div>
        </div>
        <button className="btn" onClick={()=>setOpen(false)} style={{
          width:28, height:28, borderRadius:T.radius.sm,
          background:"transparent", border:`1px solid ${T.border.base}`,
          color:T.text.tertiary, fontSize:T.font.base,
          display:"flex", alignItems:"center", justifyContent:"center",
        }}>×</button>
      </div>

      {/* Mensajes */}
      <div style={{flex:1,overflowY:"auto",padding:`${T.space[3]}px ${T.space[3]}px`,display:"flex",flexDirection:"column",gap:T.space[3]}}>
        {msgs.length===0
          ?<div style={{textAlign:"center",color:T.text.tertiary,fontSize:T.font.sm,marginTop:T.space[7]}}>Sin mensajes aún</div>
          :msgs.map((m,i)=>{
            const isMe=m.user_id===user.id;
            return<div key={i} style={{display:"flex",gap:T.space[2],alignItems:"flex-end",flexDirection:isMe?"row-reverse":"row"}}>
              <div style={{
                width:26, height:26, borderRadius:"50%",
                background:T.surface[3], border:`1px solid ${T.border.subtle}`,
                display:"flex", alignItems:"center", justifyContent:"center",
                fontSize:T.font.sm, flexShrink:0,
              }}>{isMe?(user.avatar_emoji||"🏀"):(m.users?.avatar_emoji||"🏀")}</div>
              <div style={{maxWidth:"78%"}}>
                {!isMe&&<div style={{fontSize:T.font.xs,color:T.text.tertiary,marginBottom:3,fontWeight:600}}>{m.users?.name}</div>}
                <div style={{
                  background:isMe?T.accent.base:T.surface[2],
                  border:isMe?"none":`1px solid ${T.border.subtle}`,
                  borderRadius:isMe
                    ?`${T.radius.base}px ${T.radius.base}px ${T.radius.sm}px ${T.radius.base}px`
                    :`${T.radius.base}px ${T.radius.base}px ${T.radius.base}px ${T.radius.sm}px`,
                  padding:`${T.space[2]}px ${T.space[3]}px`,
                  fontSize:T.font.sm, color:isMe?"#fff":T.text.primary, lineHeight:1.45,
                  wordBreak:"break-word",
                }}>{m.content}</div>
                <div style={{fontSize:T.font.xs,color:T.text.disabled,marginTop:3,textAlign:isMe?"right":"left"}}>
                  {new Date(m.created_at).toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"})}
                </div>
              </div>
            </div>;
          })}
        <div ref={endRef}/>
      </div>

      {/* Input */}
      <div style={{padding:T.space[3],borderTop:`1px solid ${T.border.subtle}`,display:"flex",gap:T.space[2],background:T.surface[2]}}>
        <input
          value={input}
          onChange={e=>setInput(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&send()}
          placeholder="Escribe un mensaje"
          style={{
            flex:1, background:T.surface[1],
            border:`1px solid ${input?T.accent.border:T.border.base}`,
            borderRadius:T.radius.base, padding:`${T.space[2]}px ${T.space[3]}px`,
            color:T.text.primary, fontSize:T.font.sm,
          }}
        />
        <button className="btn" onClick={send} disabled={!input.trim()||sending} style={{
          padding:`${T.space[2]}px ${T.space[4]}px`, borderRadius:T.radius.base,
          background:input.trim()?T.accent.base:T.surface[3],
          color:input.trim()?"#fff":T.text.disabled,
          fontSize:T.font.sm, fontWeight:600, minWidth:44,
        }}>{sending?<Spin s={14}/>:"Enviar"}</button>
      </div>
    </div>}

    {/* Botón flotante */}
    <button className="btn" onClick={openChat} title="Chat del grupo" style={{
      position:"fixed", bottom:T.space[4], right:T.space[4],
      height:44, padding:`0 ${T.space[4]}px`, borderRadius:T.radius.full,
      background:open?T.surface[2]:T.accent.base,
      border:`1px solid ${T.accent.base}`,
      color:open?T.accent.base:"#fff",
      fontSize:T.font.sm, fontWeight:600, zIndex:1500,
      boxShadow:T.shadow.base,
      display:"flex", alignItems:"center", gap:T.space[2],
    }}>
      {open?"Cerrar":"Chat"}
      {!open&&unread>0&&<span style={{
        minWidth:18, height:18, borderRadius:9,
        background:"#fff", color:T.accent.base,
        display:"flex", alignItems:"center", justifyContent:"center",
        fontSize:T.font.xs, fontWeight:700, padding:`0 ${T.space[1]}px`,
      }}>{unread>9?"9+":unread}</span>}
    </button>
  </>);
};