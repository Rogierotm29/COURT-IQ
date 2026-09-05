
/* ═══ WIN PROBABILITY + DYNAMIC PTS ═══ */
export const calcWinPct=(g,side,st)=>{
  if(!st?.length)return 50;
  if(g.status==="Final")return side==="away"?(g.awayScore>g.homeScore?100:0):(g.homeScore>g.awayScore?100:0);
  if(g.status==="LIVE"){const diff=side==="away"?g.awayScore-g.homeScore:g.homeScore-g.awayScore;return Math.min(95,Math.max(5,50+diff*2.5));}
  const homeT=st.find(s=>s.abbr===g.home);const awayT=st.find(s=>s.abbr===g.away);
  const hR=homeT&&(homeT.w+homeT.l)>0?homeT.w/(homeT.w+homeT.l):0.5;
  const aR=awayT&&(awayT.w+awayT.l)>0?awayT.w/(awayT.w+awayT.l):0.5;
  const hProb=Math.min(95,Math.max(5,Math.round((hR+0.03)/(hR+0.03+aR)*100)));
  return side==="home"?hProb:100-hProb;
};
export const dynBase=(pct)=>Math.min(18,Math.max(3,Math.round(10-(pct-50)/5)));
export const dynPts=(pct,conf=1)=>dynBase(pct)*conf;