import { useEffect, useState, useRef } from "react";
import { C } from "../theme";
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

  // Mantener openRef sincronizado con el estado
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

  // Load group on mount — also handle ?chat=groupId from notification tap
  useEffect(()=>{
    if(!user) return;
    const params=new URLSearchParams(window.location.search);
    const chatParam=params.get("chat");
    const gid=chatParam||localStorage.getItem("courtiq_lastgroup");
    if(!gid) return;
    // Clean the URL param without reload
    if(chatParam){
      const url=new URL(window.location.href);
      url.searchParams.delete("chat");
      window.history.replaceState({},"",url.toString());
    }
    pickemAPI("myGroups",{params:{userId:user.id}}).then(d=>{
      if(d.ok&&d.groups?.length){
        const g=d.groups.find(x=>x.id===gid)||d.groups[0];
        switchGroup(g);
        // If opened from notification, open chat automatically
        if(chatParam) setOpen(true);
      }
    });
  },[user]);

  // React to group changes from PickemTab
  useEffect(()=>{
    if(!user) return;
    const handler=(e)=>{
      const g=e.detail;
      if(g&&g.id!==groupRef.current?.id) switchGroup(g);
    };
    window.addEventListener("courtiq_group_changed",handler);
    return()=>window.removeEventListener("courtiq_group_changed",handler);
  },[user]);

  // Poll every 20s — pausa si la pestaña está oculta
  useEffect(()=>{
    const t=setInterval(()=>{
      if(groupRef.current&&user&&!document.hidden){
        loadMsgs(groupRef.current,openRef.current);
      }
    },20000);
    return()=>clearInterval(t);
  },[user]);

  // When chat opens: load messages and mark as read
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
    {open&&<div style={{position:"fixed",bottom:82,right:16,width:Math.min(340,window.innerWidth-32),height:440,background:C.card,border:`1.5px solid ${C.border}`,borderRadius:18,zIndex:1500,display:"flex",flexDirection:"column",boxShadow:"0 12px 48px #00000099",overflow:"hidden"}}>
      <div style={{padding:"14px 16px",borderBottom:`1px solid ${C.border}`,display:"flex",alignItems:"center",justifyContent:"space-between",background:"#0a0f17"}}>
        <div><div style={{fontSize:14,fontWeight:800,color:C.text}}>💬 {group?.name||"Chat del grupo"}</div><div style={{fontSize:9,color:C.muted}}>Chat en tiempo real · actualiza cada 20s</div></div>
        <button className="btn" onClick={()=>setOpen(false)} style={{width:32,height:32,borderRadius:"50%",background:"#131d29",border:`1px solid ${C.border}`,color:C.muted,fontSize:18,display:"flex",alignItems:"center",justifyContent:"center"}}>×</button>
      </div>
      <div style={{flex:1,overflowY:"auto",padding:"12px 10px",display:"flex",flexDirection:"column",gap:8}}>
        {msgs.length===0
          ?<div style={{textAlign:"center",color:C.muted,fontSize:13,marginTop:40}}>💬<br/>Sin mensajes aún</div>
          :msgs.map((m,i)=>{
            const isMe=m.user_id===user.id;
            return<div key={i} style={{display:"flex",gap:7,alignItems:"flex-end",flexDirection:isMe?"row-reverse":"row"}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:isMe?`${C.accent}30`:"#1a2535",border:`1.5px solid ${isMe?C.accent+"55":C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,flexShrink:0}}>{isMe?(user.avatar_emoji||"🏀"):(m.users?.avatar_emoji||"🏀")}</div>
              <div style={{maxWidth:"78%"}}>
                <div style={{fontSize:9,color:isMe?C.accent:C.muted,marginBottom:3,textAlign:isMe?"right":"left",fontWeight:700}}>{isMe?"Tú":m.users?.name}</div>
                <div style={{background:isMe?`${C.accent}25`:"#131d29",border:`1px solid ${isMe?C.accent+"44":C.border}`,borderRadius:isMe?"14px 14px 4px 14px":"14px 14px 14px 4px",padding:"8px 12px",fontSize:13,color:C.text,lineHeight:1.4}}>{m.content}</div>
                <div style={{fontSize:8,color:C.muted,marginTop:3,textAlign:isMe?"right":"left"}}>{new Date(m.created_at).toLocaleTimeString("es",{hour:"2-digit",minute:"2-digit"})}</div>
              </div>
            </div>;
          })}
        <div ref={endRef}/>
      </div>
      <div style={{padding:"10px 12px",borderTop:`1px solid ${C.border}`,display:"flex",gap:8,background:"#0a0f17"}}>
        <input value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&send()} placeholder="Escribe un mensaje..." style={{flex:1,background:"#131d29",border:`1.5px solid ${input?C.accent:C.border}`,borderRadius:12,padding:"10px 14px",color:C.text,fontSize:13,outline:"none"}}/>
        <button className="btn" onClick={send} disabled={!input.trim()||sending} style={{padding:"10px 16px",borderRadius:12,background:input.trim()?C.accent:"#131d29",color:input.trim()?"#07090f":C.muted,fontSize:16,fontWeight:900,minWidth:46}}>{sending?<Spin s={16}/>:"→"}</button>
      </div>
    </div>}
    <button className="btn" onClick={openChat} title="Chat del grupo" style={{position:"fixed",bottom:16,right:16,width:56,height:56,borderRadius:"50%",background:open?"#131d29":"linear-gradient(135deg,#00C2FF,#0055ff)",border:`2px solid ${open?C.border:"#00C2FF88"}`,fontSize:24,zIndex:1500,boxShadow:"0 4px 20px #00C2FF55",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .2s"}}>
      {open?"✕":"💬"}
      {!open&&unread>0&&<div style={{position:"absolute",top:-4,right:-4,minWidth:20,height:20,borderRadius:10,background:"#ff3b30",border:"2px solid #07090f",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:900,color:"#fff",padding:"0 4px"}}>{unread>9?"9+":unread}</div>}
    </button>
  </>);
};