import { useState, useEffect } from "react";
import { T } from "../theme";
import { Card, ST, Spin, Tag } from "./ui";
import { SHOP_ITEMS } from "../data/shop";
import { pickemAPI } from "../api/pickem";
import { getNameColor, getNamePrefix, getBorderColor } from "../utils/cosmetics";

const TYPE_LABEL={title:"Título",color:"Color de nombre",border:"Marco"};

export const ShopTab=({userCtx})=>{
  const {user}=userCtx||{};
  const [shopItems,setShopItems]=useState([]);
  const [equipped,setEquipped]=useState({});
  const [balance,setBalance]=useState(null);
  const [shields,setShields]=useState(0);
  const [loading,setLoading]=useState(false);
  const [msg,setMsg]=useState(null);            // {text, kind:"ok"|"error"}
  const [groupId,setGroupId]=useState(null);
  const [selCat,setSelCat]=useState("Todos");
  const [showOwned,setShowOwned]=useState(false);
  const [confirmItem,setConfirmItem]=useState(null);

  const readEquipped=(uid)=>{
    try{ return JSON.parse(localStorage.getItem("courtiq_equipped_"+uid)||"{}"); }
    catch(e){ console.warn("No se pudieron leer los items equipados:",e.message); return {}; }
  };
  const writeEquipped=(uid,val)=>{
    try{ localStorage.setItem("courtiq_equipped_"+uid,JSON.stringify(val)); }
    catch(e){ console.warn("No se pudieron guardar los items equipados:",e.message); }
  };

  useEffect(()=>{
    if(!user) return;
    const gid=localStorage.getItem("courtiq_lastgroup");
    setGroupId(gid);
    if(gid) pickemAPI("getBalance",{params:{userId:user.id,groupId:gid}}).then(d=>{if(d.ok)setBalance(d.balance);});
    pickemAPI("myShopItems",{params:{userId:user.id}}).then(d=>{if(d.ok)setShopItems(d.items||[]);});
    pickemAPI("getShields",{params:{userId:user.id}}).then(d=>{if(d.ok)setShields(d.shields||0);});
    setEquipped(readEquipped(user.id));
  },[user]);

  const flash=(text,kind="ok")=>{setMsg({text,kind});setTimeout(()=>setMsg(null),3500);};

  const equip=(item)=>{
    const next=equipped[item.type]===item.key?null:item.key;
    const updated={...equipped};
    if(next) updated[item.type]=next; else delete updated[item.type];
    setEquipped(updated);
    writeEquipped(user.id,updated);
    window.dispatchEvent(new CustomEvent("courtiq_equipped_changed"));
    flash(next?`${item.name} equipado`:"Item desequipado");
  };

  const doBuy=async(item)=>{
    setConfirmItem(null);
    if(!groupId){flash("Abre un grupo primero para gastar monedas","error");return;}
    setLoading(true);
    const d=await pickemAPI("purchaseItem",{body:{userId:user.id,groupId,itemKey:item.key,itemCost:item.cost}});
    if(d.ok){
      if(item.type==="shield"){setShields(s=>s+1);flash("Escudo de racha agregado");}
      else if(item.type==="extra_pick"){flash("Pick extra agregado");}
      else{
        setShopItems(prev=>[...prev,item.key]);
        const updated={...equipped,[item.type]:item.key};
        setEquipped(updated);
        writeEquipped(user.id,updated);
        window.dispatchEvent(new CustomEvent("courtiq_items_purchased",{detail:{userId:user.id}}));
        window.dispatchEvent(new CustomEvent("courtiq_equipped_changed"));
        flash(`${item.name} comprado y equipado`);
      }
      setBalance(b=>b-item.cost);
    } else flash(d.error||"No se pudo completar la compra","error");
    setLoading(false);
  };

  const label={fontSize:T.font.xs,color:T.text.tertiary,textTransform:"uppercase",letterSpacing:1.2,fontWeight:600};

  if(!user) return<div className="fade-up">
    <ST sub="Personaliza tu perfil">Tienda</ST>
    <Card style={{textAlign:"center",padding:T.space[7]}}>
      <div style={{fontSize:T.font.base,fontWeight:600,color:T.text.primary,marginBottom:T.space[2]}}>Inicia sesión para acceder</div>
      <div style={{fontSize:T.font.sm,color:T.text.tertiary}}>Necesitas una cuenta para comprar y equipar items</div>
    </Card>
  </div>;

  const cats=["Todos",...new Set(SHOP_ITEMS.map(i=>i.cat))];
  const consumable=i=>i.type==="shield"||i.type==="extra_pick";
  const allOwned=SHOP_ITEMS.filter(i=>!consumable(i)&&shopItems.includes(i.key));
  const filtered=showOwned?allOwned:(selCat==="Todos"?SHOP_ITEMS:SHOP_ITEMS.filter(i=>i.cat===selCat));

  const previewColor=getNameColor(shopItems,equipped);
  const previewPrefix=getNamePrefix(shopItems,equipped);
  const previewBorder=getBorderColor(shopItems,equipped);

  return(<div className="fade-up">
    <ST sub="Personaliza tu perfil">Tienda</ST>

    {/* Saldo */}
    <Card style={{marginBottom:T.space[4],display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:T.space[4]}}>
      <div>
        <div style={label}>Tu saldo</div>
        <div style={{fontSize:T.font["2xl"],fontWeight:700,color:T.text.primary,letterSpacing:-0.8,lineHeight:1.2}}>
          {balance!==null?balance:<Spin s={20}/>}
        </div>
        <div style={{fontSize:T.font.xs,color:T.text.tertiary}}>Ganas monedas acertando picks</div>
      </div>
      {shields>0&&<div style={{background:T.surface[2],border:`1px solid ${T.border.subtle}`,borderRadius:T.radius.base,padding:`${T.space[2]}px ${T.space[4]}px`,textAlign:"center"}}>
        <div style={label}>Escudos</div>
        <div style={{fontSize:T.font.xl,fontWeight:700,color:T.accent.base}}>{shields}</div>
      </div>}
    </Card>

    {/* Vista previa */}
    {allOwned.length>0&&<Card style={{marginBottom:T.space[4]}}>
      <div style={{...label,marginBottom:T.space[3]}}>Así te ven en el ranking</div>
      <div style={{display:"flex",alignItems:"center",gap:T.space[3]}}>
        <div style={{width:36,height:36,borderRadius:"50%",background:T.surface[2],border:`1px solid ${previewBorder||T.border.base}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:T.font.lg,boxShadow:previewBorder?`0 0 8px ${previewBorder}55`:undefined}}>
          {user?.avatar_emoji||"🏀"}
        </div>
        <div style={{fontSize:T.font.base,fontWeight:600,color:previewColor||T.text.primary}}>{previewPrefix}{user?.name||"Tú"}</div>
      </div>
    </Card>}

    {/* Equipados */}
    {allOwned.length>0&&<Card style={{marginBottom:T.space[4]}}>
      <div style={{...label,marginBottom:T.space[3]}}>Items equipados</div>
      {["title","color","border"].map(type=>{
        const ownedOfType=allOwned.filter(i=>i.type===type);
        if(ownedOfType.length===0) return null;
        return<div key={type} style={{marginBottom:T.space[3]}}>
          <div style={{fontSize:T.font.xs,color:T.text.tertiary,marginBottom:T.space[2]}}>{TYPE_LABEL[type]}</div>
          <div style={{display:"flex",gap:T.space[2],flexWrap:"wrap"}}>
            {ownedOfType.map(item=>{
              const isEq=equipped[type]===item.key;
              return<button key={item.key} className="btn" onClick={()=>equip(item)} style={{
                padding:`${T.space[1]}px ${T.space[3]}px`, borderRadius:T.radius.full,
                background:isEq?T.accent.subtle:T.surface[2],
                border:`1px solid ${isEq?T.accent.base:T.border.subtle}`,
                color:isEq?T.accent.base:T.text.tertiary,
                fontSize:T.font.xs, fontWeight:600,
              }}>{item.name.replace("Título ","").replace("Nombre ","").replace("Marco ","")}</button>;
            })}
          </div>
        </div>;
      })}
      <div style={{fontSize:T.font.xs,color:T.text.tertiary,marginTop:T.space[1]}}>
        Puedes equipar un título, un color y un marco a la vez. Toca de nuevo para quitarlo.
      </div>
    </Card>}

    {msg&&<div style={{
      marginBottom:T.space[4], padding:`${T.space[3]}px ${T.space[4]}px`,
      background:T.surface[1], border:`1px solid ${T.border.base}`,
      borderLeft:`3px solid ${msg.kind==="error"?T.danger.base:T.success.base}`,
      borderRadius:T.radius.sm, fontSize:T.font.sm, color:T.text.secondary,
    }}>{msg.text}</div>}

    {/* Filtros */}
    <div style={{display:"flex",gap:T.space[2],overflowX:"auto",marginBottom:T.space[4],paddingBottom:T.space[1]}}>
      <button className="btn" onClick={()=>{setShowOwned(o=>!o);setSelCat("Todos");}} style={{
        padding:`${T.space[1]}px ${T.space[4]}px`, borderRadius:T.radius.full,
        background:showOwned?T.accent.subtle:T.surface[2],
        border:`1px solid ${showOwned?T.accent.base:T.border.subtle}`,
        color:showOwned?T.accent.base:T.text.tertiary,
        fontSize:T.font.xs, fontWeight:600, whiteSpace:"nowrap", flexShrink:0,
      }}>Mis items{allOwned.length>0?` (${allOwned.length})`:""}</button>
      {!showOwned&&cats.map(c=><button key={c} className="btn" onClick={()=>setSelCat(c)} style={{
        padding:`${T.space[1]}px ${T.space[4]}px`, borderRadius:T.radius.full,
        background:selCat===c?T.accent.subtle:T.surface[2],
        border:`1px solid ${selCat===c?T.accent.base:T.border.subtle}`,
        color:selCat===c?T.accent.base:T.text.tertiary,
        fontSize:T.font.xs, fontWeight:600, whiteSpace:"nowrap", flexShrink:0,
      }}>{c}</button>)}
    </div>

    {/* Items */}
    {filtered.length===0
      ?<Card style={{textAlign:"center",padding:T.space[6],marginBottom:T.space[5]}}>
        <div style={{fontSize:T.font.sm,color:T.text.tertiary}}>
          {showOwned?"Todavía no tienes items. Compra alguno para personalizar tu perfil.":"No hay items en esta categoría"}
        </div>
      </Card>
      :<div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:T.space[3],marginBottom:T.space[5]}}>
        {filtered.map(item=>{
          const owned=!consumable(item)&&shopItems.includes(item.key);
          const isEquipped=owned&&equipped[item.type]===item.key;
          const canAfford=balance===null||balance>=item.cost;
          const isRainbow=item.value==="rainbow";
          return<Card key={item.key} style={{padding:T.space[4],borderColor:isEquipped?T.accent.base:owned?T.accent.border:T.border.subtle,display:"flex",flexDirection:"column"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:T.space[2],marginBottom:T.space[2]}}>
              <div style={{fontSize:T.font.sm,fontWeight:600,color:T.text.primary,lineHeight:1.3}}>{item.name}</div>
              {isEquipped?<Tag c={T.accent.base}>Puesto</Tag>:owned?<Tag c={T.text.tertiary}>Tuyo</Tag>:null}
            </div>

            <div style={{fontSize:T.font.xs,color:T.text.tertiary,lineHeight:1.5,marginBottom:T.space[3],flex:1}}>{item.desc}</div>

            {/* Muestra del cosmético — aquí el color SÍ es el producto */}
            {item.type==="color"&&<div style={{height:3,borderRadius:2,background:item.value,marginBottom:T.space[3]}}/>}
            {item.type==="border"&&<div style={{height:3,borderRadius:2,marginBottom:T.space[3],background:isRainbow?"linear-gradient(90deg,#FF0000,#FF7F00,#FFFF00,#00FF00,#00C2FF,#8B00FF)":`linear-gradient(90deg,transparent,${item.value},transparent)`}}/>}

            {owned&&!consumable(item)
              ?<button className="btn" onClick={()=>equip(item)} style={{
                width:"100%", padding:T.space[2], borderRadius:T.radius.sm,
                background:isEquipped?T.accent.subtle:T.surface[2],
                border:`1px solid ${isEquipped?T.accent.base:T.border.subtle}`,
                color:isEquipped?T.accent.base:T.text.secondary,
                fontSize:T.font.xs, fontWeight:600,
              }}>{isEquipped?"Equipado":"Equipar"}</button>
              :<button className="btn" onClick={()=>setConfirmItem(item)} disabled={loading||!canAfford} style={{
                width:"100%", padding:T.space[2], borderRadius:T.radius.sm,
                background:canAfford?T.accent.base:T.surface[2],
                border:canAfford?"none":`1px solid ${T.border.subtle}`,
                color:canAfford?"#fff":T.text.disabled,
                fontSize:T.font.sm, fontWeight:600,
              }}>{canAfford?`${item.cost} monedas`:`Faltan ${item.cost-balance}`}</button>}
          </Card>;
        })}
      </div>}

    <div style={{padding:`${T.space[3]}px ${T.space[4]}px`,background:T.surface[1],border:`1px solid ${T.border.subtle}`,borderRadius:T.radius.base,fontSize:T.font.sm,color:T.text.secondary,lineHeight:1.6}}>
      Los items cosméticos se ven en el ranking de tu grupo. El escudo de racha protege una racha de aciertos cuando fallas.
    </div>

    {/* Confirmación de compra — reemplaza confirm() nativo (D8) */}
    {confirmItem&&<div
      onClick={()=>setConfirmItem(null)}
      role="dialog" aria-modal="true"
      style={{position:"fixed",inset:0,background:"#00000099",zIndex:2000,display:"flex",alignItems:"center",justifyContent:"center",padding:T.space[5]}}
    >
      <div onClick={e=>e.stopPropagation()} style={{
        background:T.surface[1], border:`1px solid ${T.border.base}`,
        borderRadius:T.radius.lg, padding:T.space[5], maxWidth:340, width:"100%",
        boxShadow:T.shadow.lg,
      }}>
        <div style={{fontSize:T.font.lg,fontWeight:700,color:T.text.primary,marginBottom:T.space[2]}}>Confirmar compra</div>
        <div style={{fontSize:T.font.sm,color:T.text.secondary,lineHeight:1.6,marginBottom:T.space[5]}}>
          Vas a comprar <b style={{color:T.text.primary}}>{confirmItem.name}</b> por {confirmItem.cost} monedas.
          {balance!==null&&<> Te quedarán {balance-confirmItem.cost}.</>}
        </div>
        <div style={{display:"flex",gap:T.space[2]}}>
          <button className="btn" onClick={()=>setConfirmItem(null)} style={{
            flex:1, padding:T.space[3], borderRadius:T.radius.base,
            background:T.surface[2], border:`1px solid ${T.border.base}`,
            color:T.text.secondary, fontSize:T.font.sm, fontWeight:600,
          }}>Cancelar</button>
          <button className="btn" onClick={()=>doBuy(confirmItem)} disabled={loading} style={{
            flex:1, padding:T.space[3], borderRadius:T.radius.base,
            background:T.accent.base, color:"#fff", fontSize:T.font.sm, fontWeight:600,
          }}>{loading?<Spin s={13}/>:"Comprar"}</button>
        </div>
      </div>
    </div>}
  </div>);
};