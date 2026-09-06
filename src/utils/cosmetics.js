import { SHOP_ITEMS } from "../data/shop";

// equipped = {color:"color_gold", title:"title_rey", border:"border_neon"} — solo 1 activo por tipo
export const getNameColor=(items=[],equipped={})=>{
  // Si hay item equipado de tipo color, ese tiene prioridad
  const eq=equipped?.color;
  const key=eq&&items.includes(eq)?eq:null;
  const active=key||(()=>{
    const colorItems=SHOP_ITEMS.filter(i=>i.type==="color");
    // último comprado que tenga
    for(const ci of [...colorItems].reverse()){if(items.includes(ci.key))return ci.key;}
    return null;
  })();
  if(!active)return null;
  const found=SHOP_ITEMS.find(i=>i.key===active);
  if(found?.value)return found.value;
  // legacy keys
  if(active==="fire_color")return "#FF6B35";
  return null;
};

export const getNamePrefix=(items=[],equipped={})=>{
  const eq=equipped?.title;
  const key=eq&&items.includes(eq)?eq:null;
  const active=key||(()=>{
    const titleItems=SHOP_ITEMS.filter(i=>i.type==="title");
    for(const ti of [...titleItems].reverse()){if(items.includes(ti.key))return ti.key;}
    return null;
  })();
  if(!active)return "";
  const found=SHOP_ITEMS.find(i=>i.key===active);
  if(found?.emoji)return found.emoji+" ";
  // legacy
  if(active==="crown_badge")return "👑 ";
  return "";
};


export const getBorderColor=(items=[],equipped={})=>{
  const eq=equipped?.border;
  const key=eq&&items.includes(eq)?eq:null;
  const active=key||(()=>{
    const borderItems=SHOP_ITEMS.filter(i=>i.type==="border");
    for(const bi of [...borderItems].reverse()){if(items.includes(bi.key))return bi.key;}
    return null;
  })();
  if(!active)return null;
  if(active==="gold_border")return "#FFB800";
  const found=SHOP_ITEMS.find(i=>i.key===active);
  if(found?.value&&found.value!=="rainbow")return found.value;
  if(found?.value==="rainbow")return "#FF6B35"; // fallback for rainbow
  return null;
};