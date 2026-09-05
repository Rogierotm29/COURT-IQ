import { useState, useEffect } from "react";
import { C } from "../theme";
import { Card, ST, Spin } from "./ui";
import { SHOP_ITEMS } from "../data/shop";
import { pickemAPI } from "../api/pickem";
import { getNameColor, getNamePrefix, getBorderColor } from "../utils/cosmetics";

/* ═══ SHOP TAB ═══ */
export const ShopTab=({userCtx})=>{
  const {user}=userCtx||{};
  const [shopItems,setShopItems]=useState([]);
  const [equipped,setEquipped]=useState(()=>JSON.parse(localStorage.getItem("courtiq_equipped_"+(user?.id||""))||"{}"));
  const [balance,setBalance]=useState(null);
  const [shields,setShields]=useState(0);
  const [loading,setLoading]=useState(false);
  const [msg,setMsg]=useState("");
  const [groupId,setGroupId]=useState(null);
  const [selCat,setSelCat]=useState("Todos");
  const [showOwned,setShowOwned]=useState(false);

  useEffect(()=>{
    if(!user)return;
    const gid=localStorage.getItem("courtiq_lastgroup");
    setGroupId(gid);
    if(gid) pickemAPI("getBalance",{params:{userId:user.id,groupId:gid}}).then(d=>{if(d.ok)setBalance(d.balance);});
    pickemAPI("myShopItems",{params:{userId:user.id}}).then(d=>{if(d.ok)setShopItems(d.items||[]);});
    pickemAPI("getShields",{params:{userId:user.id}}).then(d=>{if(d.ok)setShields(d.shields||0);});
    setEquipped(JSON.parse(localStorage.getItem("courtiq_equipped_"+user.id)||"{}"));
  },[user]);

  const equip=(item)=>{
    const type=item.type;
    const cur=equipped[type];
    const next=cur===item.key?null:item.key; // toggle off if already equipped
    const updated=next?{...equipped,[type]:next}:{...equipped};
    if(!next)delete updated[type];
    setEquipped(updated);
    localStorage.setItem("courtiq_equipped_"+user.id,JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent("courtiq_equipped_changed"));
    setMsg(next?`⚡ "${item.name}" equipado en tu perfil`:`✅ Item desequipado`);
  };

  const buy=async(item)=>{
    if(!groupId){setMsg("Abre un grupo primero para gastar monedas");return;}
    if(!confirm(`¿Comprar "${item.name}" por 🪙${item.cost}?`))return;
    setLoading(true);setMsg("");
    const d=await pickemAPI("purchaseItem",{body:{userId:user.id,groupId,itemKey:item.key,itemCost:item.cost}});
    if(d.ok){
      if(item.type==="shield"){setShields(s=>s+1);setMsg("✅ +1 escudo de racha agregado");}
      else if(item.type==="extra_pick"){setMsg("✅ +1 pick extra agregado");}
      else{
        const newItems=[...shopItems,item.key];
        setShopItems(newItems);
        // Auto-equip al comprar
        const updated={...equipped,[item.type]:item.key};
        setEquipped(updated);
        localStorage.setItem("courtiq_equipped_"+user.id,JSON.stringify(updated));
        window.dispatchEvent(new CustomEvent("courtiq_items_purchased",{detail:{userId:user.id}}));
        window.dispatchEvent(new CustomEvent("courtiq_equipped_changed"));
        setMsg(`✅ ¡${item.name} comprado y equipado!`);
      }
      setBalance(b=>b-item.cost);
    }else setMsg(d.error||"Error");
    setLoading(false);
  };

  if(!user)return<div className="fade-up"><Card style={{textAlign:"center",padding:40}}><div style={{fontSize:48,marginBottom:12}}>🛍️</div><div style={{fontSize:16,fontWeight:700,color:C.text}}>Inicia sesión para acceder a la tienda</div></Card></div>;

  const cats=["Todos",...new Set(SHOP_ITEMS.map(i=>i.cat))];
  const allOwned=SHOP_ITEMS.filter(i=>i.type!=="shield"&&i.type!=="extra_pick"&&shopItems.includes(i.key));
  const filtered=(showOwned?allOwned:(selCat==="Todos"?SHOP_ITEMS:SHOP_ITEMS.filter(i=>i.cat===selCat)));

  // Preview del jugador con items equipados
  const previewColor=getNameColor(shopItems,equipped);
  const previewPrefix=getNamePrefix(shopItems,equipped);
  const previewBorder=getBorderColor(shopItems,equipped);

  return(<div className="fade-up">
    <ST sub="Personaliza tu perfil">Coin Shop 🛍️</ST>

    {/* Saldo */}
    <Card style={{marginBottom:14,background:"linear-gradient(135deg,#FFB80012,#0d1117)",borderColor:"#FFB80044",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:12}}>
      <div><div style={{fontSize:9,color:"#FFB800",textTransform:"uppercase",letterSpacing:2}}>Tu saldo</div><div style={{fontSize:40,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#FFB800"}}>{balance!==null?balance:<Spin/>} 🪙</div><div style={{fontSize:10,color:C.dim}}>Gana monedas acertando picks</div></div>
      {shields>0&&<div style={{background:"#00C2FF11",border:"1px solid #00C2FF33",borderRadius:10,padding:"10px 16px",textAlign:"center"}}><div style={{fontSize:9,color:C.accent,textTransform:"uppercase",letterSpacing:1}}>Escudos</div><div style={{fontSize:28,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.accent}}>🛡️ {shields}</div></div>}
    </Card>

    {/* Vista previa del perfil */}
    {allOwned.length>0&&<Card style={{marginBottom:14,background:"#0a1018",borderColor:C.border}}>
      <div style={{fontSize:9,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>Vista previa de tu perfil</div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:38,height:38,borderRadius:"50%",background:"#0d1117",border:`2px solid ${previewBorder||C.border}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,boxShadow:previewBorder?`0 0 10px ${previewBorder}66`:undefined}}>{user?.emoji||"🏀"}</div>
        <div>
          <div style={{fontSize:14,fontWeight:800,color:previewColor||C.text}}>{previewPrefix}{user?.name||"Tú"}</div>
          <div style={{fontSize:10,color:C.dim}}>Así te ven en el ranking</div>
        </div>
      </div>
    </Card>}

    {/* Mis items equipados */}
    {allOwned.length>0&&<Card style={{marginBottom:14,borderColor:"#FFB80033",background:"#FFB80008"}}>
      <div style={{fontSize:9,color:"#FFB800",textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>⚡ Items Equipados</div>
      {["title","color","border"].map(type=>{
        const eqKey=equipped[type];
        const ownedOfType=allOwned.filter(i=>i.type===type);
        if(ownedOfType.length===0)return null;
        return<div key={type} style={{marginBottom:8}}>
          <div style={{fontSize:9,color:C.dim,textTransform:"uppercase",letterSpacing:1,marginBottom:5}}>{type==="title"?"Título":type==="color"?"Color de nombre":"Marco"}</div>
          <div style={{display:"flex",gap:6,flexWrap:"wrap"}}>
            {ownedOfType.map(item=>{
              const isEq=equipped[type]===item.key;
              return<button key={item.key} className="btn" onClick={()=>equip(item)} style={{padding:"5px 10px",borderRadius:20,background:isEq?"#FFB80022":"#0d1117",border:`1px solid ${isEq?"#FFB800":C.border}`,color:isEq?"#FFB800":C.dim,fontSize:11,fontWeight:700,display:"flex",alignItems:"center",gap:4}}>
                <span>{item.emoji}</span><span>{item.name.replace("Título ","").replace("Nombre ","").replace("Marco ","")}</span>
                {isEq&&<span style={{fontSize:9,color:"#FFB800"}}>✓</span>}
              </button>;
            })}
          </div>
        </div>;
      })}
    </Card>}

    {msg&&<div style={{marginBottom:14,padding:"10px 14px",background:msg.startsWith("✅")||msg.startsWith("⚡")?"#00FF9D11":"#ff444411",border:`1px solid ${msg.startsWith("✅")||msg.startsWith("⚡")?"#00FF9D33":"#ff444433"}`,borderRadius:10,fontSize:12,color:msg.startsWith("✅")||msg.startsWith("⚡")?"#00FF9D":"#ff6666"}}>{msg}</div>}

    {/* Filtros */}
    <div style={{display:"flex",gap:6,overflowX:"auto",marginBottom:14,paddingBottom:4}}>
      <button className="btn" onClick={()=>{setShowOwned(o=>!o);setSelCat("Todos");}} style={{padding:"6px 14px",borderRadius:20,background:showOwned?"#FFB800":"#0d1117",border:`1px solid ${showOwned?"#FFB800":C.border}`,color:showOwned?"#07090f":C.dim,fontSize:11,fontWeight:700,whiteSpace:"nowrap",flexShrink:0}}>
        🎒 Mis items {allOwned.length>0&&`(${allOwned.length})`}
      </button>
      {!showOwned&&cats.map(c=><button key={c} className="btn" onClick={()=>setSelCat(c)} style={{padding:"6px 14px",borderRadius:20,background:selCat===c?C.accent:"#0d1117",border:`1px solid ${selCat===c?C.accent:C.border}`,color:selCat===c?"#07090f":C.dim,fontSize:11,fontWeight:700,whiteSpace:"nowrap",flexShrink:0}}>{c}</button>)}
    </div>

    {/* Grid de items */}
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:22}}>
      {filtered.map(item=>{
        const owned=item.type==="shield"||item.type==="extra_pick"?false:shopItems.includes(item.key);
        const isEquipped=owned&&equipped[item.type]===item.key;
        const canAfford=balance===null||balance>=item.cost;
        const isRainbow=item.value==="rainbow";
        return<Card key={item.key} style={{padding:"16px 12px",borderColor:isEquipped?`#FFB80077`:owned?`${C.accent}55`:C.border,position:"relative",overflow:"hidden",background:isEquipped?"#FFB80008":undefined}}>
          {isEquipped&&<div style={{position:"absolute",top:6,right:6,background:"#FFB80022",border:"1px solid #FFB80066",borderRadius:8,padding:"2px 6px",fontSize:8,fontWeight:700,color:"#FFB800"}}>⚡ PUESTO</div>}
          {owned&&!isEquipped&&<div style={{position:"absolute",top:6,right:6,background:`${C.accent}22`,border:`1px solid ${C.accent}44`,borderRadius:8,padding:"2px 6px",fontSize:8,fontWeight:700,color:C.accent}}>TUYO</div>}
          <div style={{fontSize:32,marginBottom:6,textAlign:"center"}}>{item.emoji}</div>
          <div style={{fontSize:12,fontWeight:800,color:owned?C.text:C.muted,textAlign:"center",marginBottom:4}}>{item.name}</div>
          <div style={{fontSize:9,color:C.dim,textAlign:"center",marginBottom:10,lineHeight:1.4}}>{item.desc}</div>
          {item.type==="color"&&<div style={{height:4,borderRadius:2,background:item.value,marginBottom:10}}/>}
          {item.type==="border"&&<div style={{height:4,borderRadius:2,background:isRainbow?"linear-gradient(90deg,#FF0000,#FF7F00,#FFFF00,#00FF00,#00C2FF,#8B00FF)":`linear-gradient(90deg,transparent,${item.value},transparent)`,marginBottom:10}}/>}
          {owned&&item.type!=="shield"&&item.type!=="extra_pick"
            ?<button className="btn" onClick={()=>equip(item)} style={{width:"100%",padding:"8px",borderRadius:8,background:isEquipped?"linear-gradient(135deg,#FFB800,#ff9500)":"#0d1117",color:isEquipped?"#07090f":C.muted,fontSize:11,fontWeight:900,border:`1px solid ${isEquipped?"#FFB800":C.border}`}}>
              {isEquipped?"⚡ Equipado":"Equipar"}
            </button>
            :<button className="btn" onClick={()=>buy(item)} disabled={loading||(!owned&&!canAfford)} style={{width:"100%",padding:"8px",borderRadius:8,background:canAfford?`linear-gradient(135deg,#FFB800,#ff9500)`:"#0a1018",color:canAfford?"#07090f":C.muted,fontSize:12,fontWeight:900}}>
              {item.type==="shield"?"🛡️ ":item.type==="extra_pick"?"🔄 ":""}🪙{item.cost}
            </button>
          }
        </Card>;
      })}
    </div>
    <div style={{padding:"12px 16px",background:"#0a1018",borderRadius:10,border:`1px solid ${C.border}`,fontSize:11,color:C.dim}}>
      💡 Equipa solo un título, color y marco a la vez. Se ven en el ranking de tu grupo. El escudo protege tu racha de aciertos.
    </div>
  </div>);
};