import { useState, useEffect, useRef } from "react";
import { C } from "../theme";
import { Card, ST } from "./ui";
import { logo, tm } from "./TeamLogo";
import { pickemAPI } from "../api/pickem";
import { TRIVIA_ALL, CHAMPS, PLAYER_CLUES, FLAGS } from "../data/minigames";

/* ═══ ACHIEVEMENT DEFS ═══ */
export const MiniGamesTab=({players,userCtx})=>{
  const {user}=userCtx||{};
  const [screen,setScreen]=useState("menu");
  const [game,setGame]=useState(null);
  // Scorer state
  const [scorerRound,setScorerRound]=useState(0);
  const [scorerScore,setScorerScore]=useState(0);
  const [scorerPair,setScorerPair]=useState(null);
  const [scorerDone,setScorerDone]=useState(false);
  const [scorerFeedback,setScorerFeedback]=useState(null);
  // Trivia state
  const [triviaQ,setTriviaQ]=useState(0);
  const [triviaScore,setTriviaScore]=useState(0);
  const [triviaDone,setTriviaDone]=useState(false);
  const [triviaFeedback,setTriviaFeedback]=useState(null);
  const [triviaSet,setTriviaSet]=useState([]);
  // Reaction game
  const [reactPhase,setReactPhase]=useState("idle"); // idle|waiting|go|tapped|done
  const [reactTimes,setReactTimes]=useState([]);
  const [reactStart,setReactStart]=useState(0);
  const [reactTimer,setReactTimer]=useState(null);
  // Memory game
  const [memCards,setMemCards]=useState([]);
  const [memFlipped,setMemFlipped]=useState([]);
  const [memMatched,setMemMatched]=useState([]);
  const [memMoves,setMemMoves]=useState(0);
  const [memLocked,setMemLocked]=useState(false);
  const [memDone,setMemDone]=useState(false);
  // Flag quiz
  const [flagRound,setFlagRound]=useState(0);
  const [flagScore,setFlagScore]=useState(0);
  const [flagQ,setFlagQ]=useState(null);
  const [flagDone,setFlagDone]=useState(false);
  const [flagFeedback,setFlagFeedback]=useState(null);
  const [flagPool,setFlagPool]=useState([]);
  // Math game
  const [mathRound,setMathRound]=useState(0);
  const [mathScore,setMathScore]=useState(0);
  const [mathQ,setMathQ]=useState(null);
  const [mathDone,setMathDone]=useState(false);
  const [mathFeedback,setMathFeedback]=useState(null);
  const [mathTimer,setMathTimer]=useState(5);
  const mathTimerRef=useRef(null);
  // Leaderboard
  const [scores,setScores]=useState([]);
  const [allRankings,setAllRankings]=useState({scorer:[],trivia:[],guess:[],champs:[],react:[],flags:[],math:[],memory:[]});

  useEffect(()=>{
    const types=["scorer","trivia","guess","champs","react","flags","math","memory"];
    Promise.all(types.map(t=>pickemAPI("getMiniScores",{params:{gameType:t}}))).then(results=>{
      const r={};
      types.forEach((t,i)=>{r[t]=results[i].ok?results[i].scores||[]:[]; });
      setAllRankings(r);
    });
  },[]);

  // Guess player state
  const [guessRound,setGuessRound]=useState(0);
  const [guessScore,setGuessScore]=useState(0);
  const [guessQ,setGuessQ]=useState(null);
  const [guessDone,setGuessDone]=useState(false);
  const [guessFeedback,setGuessFeedback]=useState(null);
  const [guessPool,setGuessPool]=useState([]);
  // Champs game state
  const [champsRound,setChampsRound]=useState(0);
  const [champsScore,setChampsScore]=useState(0);
  const [champsQ,setChampsQ]=useState(null);
  const [champsDone,setChampsDone]=useState(false);
  const [champsFeedback,setChampsFeedback]=useState(null);
  const [champsPool,setChampsPool]=useState([]);

  const buildClueQ=(pool,round)=>{
    const correct=pool[round];
    const others=[...PLAYER_CLUES].filter(p=>p.name!==correct.name).sort(()=>Math.random()-.5).slice(0,3);
    const opts=[correct,...others].sort(()=>Math.random()-.5);
    return{correct,opts};
  };

  const startGuess=()=>{
    const pool=[...PLAYER_CLUES].sort(()=>Math.random()-.5);
    setGuessRound(0);setGuessScore(0);setGuessDone(false);setGuessFeedback(null);
    setGuessPool(pool);setGuessQ(buildClueQ(pool,0));setGame("guess");setScreen("game");
  };

  const answerGuess=(p)=>{
    if(guessFeedback!==null) return;
    const isCorrect=p.name===guessQ.correct.name;
    setGuessFeedback(isCorrect);
    if(isCorrect) setGuessScore(s=>s+1);
    setTimeout(()=>{
      const next=guessRound+1;
      if(next>=8){
        setGuessDone(true);
        const final=isCorrect?guessScore+1:guessScore;
        if(user) pickemAPI("saveMiniScore",{body:{userId:user.id,gameType:"guess",score:final}});
        pickemAPI("getMiniScores",{params:{gameType:"guess"}}).then(d=>{if(d.ok){setScores(d.scores||[]);setAllRankings(r=>({...r,guess:d.scores||[]}));}});
      } else {
        setGuessRound(next);setGuessQ(buildClueQ(guessPool,next));setGuessFeedback(null);
      }
    },900);
  };

  const buildChampsQ=(pool,round)=>{
    const correct=pool[round];
    // Deduplicate by team abbr so same team never appears twice as option
    const seen=new Set([correct.team]);
    const others=[];
    const shuffled=[...CHAMPS].sort(()=>Math.random()-.5);
    for(const c of shuffled){
      if(!seen.has(c.team)){seen.add(c.team);others.push(c);}
      if(others.length===3) break;
    }
    const opts=[correct,...others].sort(()=>Math.random()-.5);
    return{correct,opts};
  };
  const startChamps=()=>{
    const pool=[...CHAMPS].sort(()=>Math.random()-.5).slice(0,10);
    setChampsRound(0);setChampsScore(0);setChampsDone(false);setChampsFeedback(null);
    setChampsPool(pool);setChampsQ(buildChampsQ(pool,0));setGame("champs");setScreen("game");
  };
  const answerChamps=(team)=>{
    if(champsFeedback!==null) return;
    const isCorrect=team===champsQ.correct.team;
    setChampsFeedback(isCorrect);
    if(isCorrect) setChampsScore(s=>s+1);
    setTimeout(()=>{
      const next=champsRound+1;
      if(next>=10){
        setChampsDone(true);
        const final=isCorrect?champsScore+1:champsScore;
        if(user) pickemAPI("saveMiniScore",{body:{userId:user.id,gameType:"champs",score:final}});
        pickemAPI("getMiniScores",{params:{gameType:"champs"}}).then(d=>{if(d.ok){setScores(d.scores||[]);setAllRankings(r=>({...r,champs:d.scores||[]}));}});
      } else {
        setChampsRound(next);setChampsQ(buildChampsQ(champsPool,next));setChampsFeedback(null);
      }
    },900);
  };

  const pickPair=()=>{
    if(!players||players.length<2) return null;
    const idx1=Math.floor(Math.random()*players.length);
    let idx2=Math.floor(Math.random()*players.length);
    while(idx2===idx1)idx2=Math.floor(Math.random()*players.length);
    return [players[idx1],players[idx2]];
  };

  const startScorer=()=>{
    setScorerRound(0);setScorerScore(0);setScorerDone(false);setScorerFeedback(null);
    setScorerPair(pickPair());
    setGame("scorer");setScreen("game");
  };

  const startTrivia=()=>{
    setTriviaSet([...TRIVIA_ALL].sort(()=>Math.random()-.5).slice(0,10));
    setTriviaQ(0);setTriviaScore(0);setTriviaDone(false);setTriviaFeedback(null);
    setGame("trivia");setScreen("game");
  };

  const answerScorer=(chosen)=>{
    if(scorerFeedback!==null) return;
    const [p1,p2]=scorerPair;
    const correct=(chosen===0&&p1.pts>=p2.pts)||(chosen===1&&p2.pts>=p1.pts);
    setScorerFeedback(correct);
    if(correct) setScorerScore(s=>s+1);
    setTimeout(()=>{
      const nextRound=scorerRound+1;
      if(nextRound>=10){
        setScorerDone(true);
        const finalScore=correct?scorerScore+1:scorerScore;
        if(user) pickemAPI("saveMiniScore",{body:{userId:user.id,gameType:"scorer",score:finalScore}});
        pickemAPI("getMiniScores",{params:{gameType:"scorer"}}).then(d=>{if(d.ok){setScores(d.scores||[]);setAllRankings(r=>({...r,scorer:d.scores||[]}));}});
      } else {
        setScorerRound(nextRound);setScorerPair(pickPair());setScorerFeedback(null);
      }
    },700);
  };

  const answerTrivia=(idx)=>{
    if(triviaFeedback!==null) return;
    const q=triviaSet[triviaQ];
    const correct=idx===q.a;
    setTriviaFeedback(correct);
    if(correct) setTriviaScore(s=>s+1);
    setTimeout(()=>{
      const nextQ=triviaQ+1;
      if(nextQ>=triviaSet.length){
        setTriviaDone(true);
        const finalScore=correct?triviaScore+1:triviaScore;
        if(user) pickemAPI("saveMiniScore",{body:{userId:user.id,gameType:"trivia",score:finalScore}});
        pickemAPI("getMiniScores",{params:{gameType:"trivia"}}).then(d=>{if(d.ok){setScores(d.scores||[]);setAllRankings(r=>({...r,trivia:d.scores||[]}));}});
      } else {
        setTriviaQ(nextQ);setTriviaFeedback(null);
      }
    },700);
  };

  // ─── REACTION GAME ───────────────────────────────────────────────────────
  const startReact=()=>{
    setReactTimes([]);setReactPhase("idle");    setGame("react");setScreen("game");
    beginReactRound();
  };
  const beginReactRound=()=>{
    setReactPhase("waiting");    const delay=1200+Math.random()*2800;
    const t=setTimeout(()=>{
      setReactPhase("go");setReactStart(Date.now());
    },delay);
    setReactTimer(t);
  };
  const tapReact=()=>{
    if(reactPhase==="waiting"){
      clearTimeout(reactTimer);setReactPhase("early");
      setTimeout(()=>beginReactRound(),1200);
      return;
    }
    if(reactPhase!=="go") return;
    const elapsed=Date.now()-reactStart;
    const newTimes=[...reactTimes,elapsed];
    setReactTimes(newTimes);
    setReactPhase("tapped");
    if(newTimes.length>=5){
      const avg=Math.round(newTimes.reduce((a,b)=>a+b,0)/newTimes.length);
      const finalScore=Math.max(0,Math.min(999,Math.round(1000-(avg/2))));
      setTimeout(()=>{
        setReactPhase("done");
        if(user) pickemAPI("saveMiniScore",{body:{userId:user.id,gameType:"react",score:finalScore}});
        pickemAPI("getMiniScores",{params:{gameType:"react"}}).then(d=>{if(d.ok){setScores(d.scores||[]);setAllRankings(r=>({...r,react:d.scores||[]}));}});
      },800);
    } else {
      setTimeout(()=>beginReactRound(),900);
    }
  };

  // ─── MEMORY GAME ─────────────────────────────────────────────────────────
  const MEM_EMOJIS=["🏀","⚽","🎾","🏈","🎱","🥊","⚾","🏐","🎯","🚀","💎","🎮","🔥","⚡","🌟","🦁"];
  const startMemory=()=>{
    const pairs=MEM_EMOJIS.slice(0,8);
    const deck=[...pairs,...pairs].map((e,i)=>({id:i,emoji:e,matched:false})).sort(()=>Math.random()-.5);
    setMemCards(deck);setMemFlipped([]);setMemMatched([]);setMemMoves(0);setMemLocked(false);setMemDone(false);
    setGame("memory");setScreen("game");
  };
  const flipCard=(idx)=>{
    if(memLocked||memFlipped.includes(idx)||memMatched.includes(memCards[idx]?.emoji)) return;
    const newFlipped=[...memFlipped,idx];
    setMemFlipped(newFlipped);
    if(newFlipped.length===2){
      setMemLocked(true);
      setMemMoves(m=>m+1);
      const [a,b]=newFlipped;
      if(memCards[a].emoji===memCards[b].emoji){
        const newMatched=[...memMatched,memCards[a].emoji];
        setMemMatched(newMatched);
        setMemFlipped([]);setMemLocked(false);
        if(newMatched.length===8){
          const finalMoves=memMoves+1;
          setMemDone(true);
          const finalScore=Math.max(0,100-Math.max(0,finalMoves-8)*4);
          if(user) pickemAPI("saveMiniScore",{body:{userId:user.id,gameType:"memory",score:finalScore}});
          pickemAPI("getMiniScores",{params:{gameType:"memory"}}).then(d=>{if(d.ok){setScores(d.scores||[]);setAllRankings(r=>({...r,memory:d.scores||[]}));}});
        }
      } else {
        setTimeout(()=>{setMemFlipped([]);setMemLocked(false);},900);
      }
    }
  };

  // ─── FLAG QUIZ ───────────────────────────────────────────────────────────
  const startFlags=()=>{
    const pool=[...FLAGS].sort(()=>Math.random()-.5).slice(0,10);
    setFlagPool(pool);setFlagRound(0);setFlagScore(0);setFlagDone(false);setFlagFeedback(null);
    setFlagQ(pool[0]);setGame("flags");setScreen("game");
  };
  const answerFlag=(choice)=>{
    if(flagFeedback!==null) return;
    const correct=choice===flagQ.country;
    setFlagFeedback(correct?choice:"wrong:"+choice);
    if(correct) setFlagScore(s=>s+1);
    setTimeout(()=>{
      const next=flagRound+1;
      if(next>=10){
        setFlagDone(true);
        const finalScore=correct?flagScore+1:flagScore;
        if(user) pickemAPI("saveMiniScore",{body:{userId:user.id,gameType:"flags",score:finalScore}});
        pickemAPI("getMiniScores",{params:{gameType:"flags"}}).then(d=>{if(d.ok){setScores(d.scores||[]);setAllRankings(r=>({...r,flags:d.scores||[]}));}});
      } else {
        setFlagRound(next);setFlagQ(flagPool[next]);setFlagFeedback(null);
      }
    },900);
  };

  // ─── MATH GAME ───────────────────────────────────────────────────────────
  const genMathQ=()=>{
    const ops=["+","-","×"];const op=ops[Math.floor(Math.random()*ops.length)];
    let a,b,ans;
    if(op==="+"){a=Math.floor(Math.random()*50)+10;b=Math.floor(Math.random()*50)+10;ans=a+b;}
    else if(op==="-"){a=Math.floor(Math.random()*50)+30;b=Math.floor(Math.random()*30)+5;ans=a-b;}
    else{a=Math.floor(Math.random()*9)+2;b=Math.floor(Math.random()*9)+2;ans=a*b;}
    // Generate 3 wrong answers
    const wrongs=new Set();
    while(wrongs.size<3){const w=ans+Math.floor(Math.random()*20)-10;if(w!==ans&&w>0)wrongs.add(w);}
    const opts=[ans,...wrongs].sort(()=>Math.random()-.5);
    return{q:`${a} ${op} ${b}`,ans,opts};
  };
  const startMath=()=>{
    setMathRound(0);setMathScore(0);setMathDone(false);setMathFeedback(null);
    setMathQ(genMathQ());setMathTimer(5);setGame("math");setScreen("game");
  };
  useEffect(()=>{
    if(screen!=="game"||game!=="math"||mathDone||mathFeedback!==null) return;
    if(mathTimer<=0){
      // Time's up — count as wrong
      setMathFeedback(false);
      setTimeout(()=>{
        const next=mathRound+1;
        if(next>=10){setMathDone(true);if(user)pickemAPI("saveMiniScore",{body:{userId:user.id,gameType:"math",score:mathScore}}).then(()=>pickemAPI("getMiniScores",{params:{gameType:"math"}}).then(d=>{if(d.ok){setScores(d.scores||[]);setAllRankings(r=>({...r,math:d.scores||[]}));}}));}
        else{setMathRound(next);setMathQ(genMathQ());setMathFeedback(null);setMathTimer(5);}
      },700);
      return;
    }
    mathTimerRef.current=setTimeout(()=>setMathTimer(t=>t-1),1000);
    return()=>clearTimeout(mathTimerRef.current);
  },[mathTimer,screen,game,mathDone,mathFeedback]);

  const answerMath=(opt)=>{
    if(mathFeedback!==null) return;
    clearTimeout(mathTimerRef.current);
    const correct=opt===mathQ.ans;
    setMathFeedback(correct);
    if(correct) setMathScore(s=>s+1);
    setTimeout(()=>{
      const next=mathRound+1;
      if(next>=10){
        setMathDone(true);
        const finalScore=correct?mathScore+1:mathScore;
        if(user) pickemAPI("saveMiniScore",{body:{userId:user.id,gameType:"math",score:finalScore}});
        pickemAPI("getMiniScores",{params:{gameType:"math"}}).then(d=>{if(d.ok){setScores(d.scores||[]);setAllRankings(r=>({...r,math:d.scores||[]}));}});
      } else {
        setMathRound(next);setMathQ(genMathQ());setMathFeedback(null);setMathTimer(5);
      }
    },700);
  };

  const GAME_META=[
    // NBA
    {key:"scorer",  icon:"📊",label:"¿Quién anota más?",  desc:"Adivina qué jugador tiene más PPG",         color:C.accent,   start:startScorer,  max:10, cat:"nba"},
    {key:"trivia",  icon:"🧠",label:"NBA Trivia",          desc:"10 preguntas sobre la NBA",                color:"#FFB800",  start:startTrivia,  max:10, cat:"nba"},
    {key:"guess",   icon:"🕵️",label:"Adivina el Jugador", desc:"4 pistas de carrera · 8 rondas",            color:"#00FF9D",  start:startGuess,   max:8,  cat:"nba"},
    {key:"champs",  icon:"🏆",label:"Campeones NBA",       desc:"¿Quién ganó en ese año? · 1947–2024",      color:"#E03A3E",  start:startChamps,  max:10, cat:"nba"},
    // Generales
    {key:"react",   icon:"⚡",label:"Test de Reacción",    desc:"Toca cuando veas verde · ¿qué tan rápido?",color:"#FFD700",  start:startReact,   max:999,cat:"general"},
    {key:"memory",  icon:"🃏",label:"Memoria",             desc:"Voltea y empareja los pares de emojis",    color:"#9B59B6",  start:startMemory,  max:100,cat:"general"},
    {key:"flags",   icon:"🌍",label:"Adivina la Bandera",  desc:"30 países · ¿cuántas reconoces?",          color:"#00C2FF",  start:startFlags,   max:10, cat:"general"},
    {key:"math",    icon:"🔢",label:"Mate Rápido",         desc:"10 operaciones en 5 segundos cada una",    color:"#FF6B35",  start:startMath,    max:10, cat:"general"},
  ];

  if(screen==="menu") return(<div className="fade-up">
    <ST sub="Mini Juegos">Arcade 🎮</ST>

    <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>🌍 Juegos Generales</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>
      {GAME_META.filter(g=>g.cat==="general").map(g=>{
        const top=allRankings[g.key]?.[0];
        const myRank=user?allRankings[g.key]?.findIndex(s=>s.users?.name===user.name)+1:0;
        return<Card key={g.key} style={{padding:16,borderColor:g.color+"44",display:"flex",flexDirection:"column",gap:6}}>
          <div style={{fontSize:32,textAlign:"center"}}>{g.icon}</div>
          <div style={{fontSize:13,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.text,textAlign:"center",lineHeight:1.2}}>{g.label}</div>
          <div style={{fontSize:10,color:C.dim,textAlign:"center",flex:1,lineHeight:1.4}}>{g.desc}</div>
          {top&&<div style={{fontSize:9,color:C.muted,textAlign:"center",padding:"3px 6px",background:g.color+"11",borderRadius:6}}>
            👑 {top.users?.name}: {top.score}{g.key==="react"?" pts":`/${g.max}`}
            {myRank>0&&<span style={{color:g.color}}> · #{myRank}</span>}
          </div>}
          <button className="btn" onClick={g.start} style={{padding:"9px",borderRadius:9,background:`linear-gradient(135deg,${g.color},${g.color}bb)`,color:"#07090f",fontWeight:900,fontSize:12}}>Jugar</button>
        </Card>;
      })}
    </div>

    <div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>🏀 NBA</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:18}}>
      {GAME_META.filter(g=>g.cat==="nba").map(g=>{
        const top=allRankings[g.key]?.[0];
        const myRank=user?allRankings[g.key]?.findIndex(s=>s.users?.name===user.name)+1:0;
        return<Card key={g.key} style={{padding:16,borderColor:g.color+"44",display:"flex",flexDirection:"column",gap:6}}>
          <div style={{fontSize:32,textAlign:"center"}}>{g.icon}</div>
          <div style={{fontSize:13,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.text,textAlign:"center",lineHeight:1.2}}>{g.label}</div>
          <div style={{fontSize:10,color:C.dim,textAlign:"center",flex:1,lineHeight:1.4}}>{g.desc}</div>
          {top&&<div style={{fontSize:9,color:C.muted,textAlign:"center",padding:"3px 6px",background:g.color+"11",borderRadius:6}}>
            👑 {top.users?.name}: {top.score}/{g.max}
            {myRank>0&&<span style={{color:g.color}}> · #{myRank}</span>}
          </div>}
          <button className="btn" onClick={g.start} style={{padding:"9px",borderRadius:9,background:`linear-gradient(135deg,${g.color},${g.color}bb)`,color:g.key==="champs"?"#fff":"#07090f",fontWeight:900,fontSize:12}}>Jugar</button>
        </Card>;
      })}
    </div>

    <button className="btn" onClick={()=>setScreen("rankings")} style={{width:"100%",padding:"13px",borderRadius:12,background:"#0a1018",border:`1px solid ${C.border}`,color:C.text,fontWeight:700,fontSize:14}}>🏆 Ver Rankings Globales</button>
  </div>);

  if(screen==="rankings") return(<div className="fade-up">
    <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:16}}>
      <button className="btn" onClick={()=>setScreen("menu")} style={{padding:"8px 14px",borderRadius:8,background:"#0a1018",border:`1px solid ${C.border}`,color:C.dim,fontSize:12}}>← Volver</button>
      <ST sub="Mini Juegos" style={{margin:0}}>Rankings Globales 🌎</ST>
    </div>
    {GAME_META.map(g=>(
      <Card key={g.key} style={{marginBottom:14,borderColor:g.color+"33"}}>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10}}>
          <span style={{fontSize:20}}>{g.icon}</span>
          <span style={{fontSize:14,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:g.color}}>{g.label}</span>
        </div>
        {allRankings[g.key].length===0?<div style={{fontSize:12,color:C.dim,textAlign:"center",padding:"8px 0"}}>Aún no hay puntuaciones</div>
        :allRankings[g.key].map((s,i)=>{
          const isMe=user&&s.users?.name===user.name;
          return<div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 0",borderBottom:i<allRankings[g.key].length-1?`1px solid ${C.border}`:"none",background:isMe?g.color+"11":"transparent",borderRadius:isMe?6:0,paddingLeft:isMe?6:0}}>
            <span style={{fontSize:11,color:i<3?g.color:C.muted,fontWeight:i<3?900:400,width:18}}>{i===0?"🥇":i===1?"🥈":i===2?"🥉":i+1}</span>
            <span style={{fontSize:14}}>{s.users?.avatar_emoji||"🏀"}</span>
            <span style={{flex:1,fontSize:13,color:isMe?g.color:C.text,fontWeight:isMe?700:400}}>{s.users?.name}{isMe?" (tú)":""}</span>
            <span style={{fontSize:15,fontWeight:900,color:g.color}}>{s.score}<span style={{fontSize:10,color:C.muted}}>/{g.max}</span></span>
          </div>;
        })}
      </Card>
    ))}
    <button className="btn" onClick={()=>setScreen("menu")} style={{width:"100%",padding:"13px",borderRadius:12,background:C.accent,color:"#07090f",fontWeight:900,fontSize:14}}>← Volver al Menú</button>
  </div>);

  if(screen==="game"&&game==="scorer") {
    if(scorerDone) return(<div className="fade-up">
      <ST sub="¿Quién anota más?">Resultado</ST>
      <Card style={{textAlign:"center",padding:30,marginBottom:14}}>
        <div style={{fontSize:56,marginBottom:8}}>📊</div>
        <div style={{fontSize:36,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.accent}}>{scorerScore}/10</div>
        <div style={{fontSize:14,color:C.dim,marginTop:4}}>{scorerScore>=8?"¡Experto NBA! 🏆":scorerScore>=5?"¡Buen intento! 💪":"Sigue practicando 📚"}</div>
      </Card>
      {scores.length>0&&<Card style={{marginBottom:14}}><div style={{fontSize:11,color:C.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:2}}>🏆 Top Puntuaciones</div>
        {scores.map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<scores.length-1?`1px solid ${C.border}`:"none"}}><span style={{fontSize:11,color:C.muted,width:16}}>{i+1}</span><span style={{fontSize:13}}>{s.users?.avatar_emoji||"🏀"}</span><span style={{flex:1,fontSize:12,color:C.text}}>{s.users?.name}</span><span style={{fontSize:14,fontWeight:900,color:C.accent}}>{s.score}</span></div>)}
      </Card>}
      <button className="btn" onClick={()=>setScreen("menu")} style={{width:"100%",padding:"13px",borderRadius:10,background:C.accent,color:"#07090f",fontWeight:900,fontSize:14}}>← Volver</button>
    </div>);
    if(!scorerPair) return <div style={{color:C.dim,textAlign:"center",padding:40}}>Cargando jugadores...</div>;
    const [p1,p2]=scorerPair;
    return(<div className="fade-up">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <ST sub="¿Quién anota más?">Ronda {scorerRound+1}/10</ST>
        <div style={{fontSize:20,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.accent}}>{scorerScore} pts</div>
      </div>
      <Card style={{marginBottom:10,textAlign:"center"}}><div style={{fontSize:12,color:C.dim}}>¿Quién tiene más PPG esta temporada?</div></Card>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10}}>
        {[p1,p2].map((p,i)=><button key={p.id} className="btn" onClick={()=>answerScorer(i)} style={{padding:20,borderRadius:14,background:scorerFeedback!==null?(i===(p1.pts>=p2.pts?0:1)?"#00FF9D22":"#ff444422"):"#0a1018",border:`2px solid ${scorerFeedback!==null?(i===(p1.pts>=p2.pts?0:1)?"#00FF9D":"#ff4444"):C.border}`,textAlign:"center",transition:"all .2s"}}>
          {logo(p.teamAbbr,40)}
          <div style={{fontSize:14,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.text,marginTop:8}}>{p.name}</div>
          <div style={{fontSize:11,color:C.dim}}>{p.teamAbbr} · {p.pos}</div>
          {scorerFeedback!==null&&<div style={{fontSize:20,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#FFB800",marginTop:6}}>{p.pts} PPG</div>}
        </button>)}
      </div>
      {scorerFeedback!==null&&<div style={{textAlign:"center",marginTop:10,fontSize:16,fontWeight:700,color:scorerFeedback?"#00FF9D":"#ff6666"}}>{scorerFeedback?"✅ ¡Correcto!":"❌ Incorrecto"}</div>}
      <button className="btn" onClick={()=>setScreen("menu")} style={{width:"100%",marginTop:14,padding:"10px",borderRadius:10,background:"#0a1018",border:`1px solid ${C.border}`,color:C.dim,fontSize:12}}>Salir</button>
    </div>);
  }

  if(screen==="game"&&game==="trivia") {
    if(triviaDone) return(<div className="fade-up">
      <ST sub="NBA Trivia">Resultado</ST>
      <Card style={{textAlign:"center",padding:30,marginBottom:14}}>
        <div style={{fontSize:56,marginBottom:8}}>🧠</div>
        <div style={{fontSize:36,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#FFB800"}}>{triviaScore}/10</div>
        <div style={{fontSize:14,color:C.dim,marginTop:4}}>{triviaScore>=8?"¡Experto NBA! 🏆":triviaScore>=5?"¡Buen intento! 💪":"Sigue aprendiendo 📚"}</div>
      </Card>
      {scores.length>0&&<Card style={{marginBottom:14}}><div style={{fontSize:11,color:C.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:2}}>🏆 Top Puntuaciones</div>
        {scores.map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<scores.length-1?`1px solid ${C.border}`:"none"}}><span style={{fontSize:11,color:C.muted,width:16}}>{i+1}</span><span style={{fontSize:13}}>{s.users?.avatar_emoji||"🏀"}</span><span style={{flex:1,fontSize:12,color:C.text}}>{s.users?.name}</span><span style={{fontSize:14,fontWeight:900,color:"#FFB800"}}>{s.score}</span></div>)}
      </Card>}
      <button className="btn" onClick={()=>setScreen("menu")} style={{width:"100%",padding:"13px",borderRadius:10,background:"#FFB800",color:"#07090f",fontWeight:900,fontSize:14}}>← Volver</button>
    </div>);
    const q=triviaSet[triviaQ]||triviaSet[0];
    return(<div className="fade-up">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <ST sub="NBA Trivia">Pregunta {triviaQ+1}/{triviaSet.length||10}</ST>
        <div style={{fontSize:20,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#FFB800"}}>{triviaScore} pts</div>
      </div>
      <Card style={{marginBottom:14,textAlign:"center",padding:20}}><div style={{fontSize:15,fontWeight:700,color:C.text,lineHeight:1.4}}>{q.q}</div></Card>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {q.opts.map((opt,i)=><button key={i} className="btn" onClick={()=>answerTrivia(i)} style={{padding:"14px 10px",borderRadius:12,background:triviaFeedback!==null?(i===q.a?"#00FF9D22":triviaFeedback===false&&i!==q.a?"#ff444411":"#0a1018"):"#0a1018",border:`2px solid ${triviaFeedback!==null?(i===q.a?"#00FF9D":triviaFeedback===false&&i!==q.a?"#ff4444":C.border):C.border}`,color:triviaFeedback!==null?(i===q.a?"#00FF9D":C.dim):C.text,fontSize:13,fontWeight:600,textAlign:"center",transition:"all .2s"}}>{opt}</button>)}
      </div>
      {triviaFeedback!==null&&<div style={{textAlign:"center",marginTop:10,fontSize:16,fontWeight:700,color:triviaFeedback?"#00FF9D":"#ff6666"}}>{triviaFeedback?"✅ ¡Correcto!":"❌ Incorrecto — era: "+q.opts[q.a]}</div>}
      <button className="btn" onClick={()=>setScreen("menu")} style={{width:"100%",marginTop:14,padding:"10px",borderRadius:10,background:"#0a1018",border:`1px solid ${C.border}`,color:C.dim,fontSize:12}}>Salir</button>
    </div>);
  }

  if(screen==="game"&&game==="guess"){
    if(guessDone) return(<div className="fade-up">
      <ST sub="Adivina el Jugador">Resultado</ST>
      <Card style={{textAlign:"center",padding:30,marginBottom:14}}>
        <div style={{fontSize:56,marginBottom:8}}>🕵️</div>
        <div style={{fontSize:36,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#00FF9D"}}>{guessScore}/8</div>
        <div style={{fontSize:14,color:C.dim,marginTop:4}}>{guessScore>=7?"¡Sabes quiénes son todos! 🏆":guessScore>=5?"¡Buen ojo! 👀":"¿Ves los partidos? 😅"}</div>
      </Card>
      {scores.length>0&&<Card style={{marginBottom:14}}><div style={{fontSize:11,color:C.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:2}}>🏆 Top Puntuaciones</div>
        {scores.map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<scores.length-1?`1px solid ${C.border}`:"none"}}><span style={{fontSize:11,color:C.muted,width:16}}>{i+1}</span><span style={{fontSize:13}}>{s.users?.avatar_emoji||"🏀"}</span><span style={{flex:1,fontSize:12,color:C.text}}>{s.users?.name}</span><span style={{fontSize:14,fontWeight:900,color:"#00FF9D"}}>{s.score}/8</span></div>)}
      </Card>}
      <button className="btn" onClick={()=>setScreen("menu")} style={{width:"100%",padding:"13px",borderRadius:10,background:"#00FF9D",color:"#07090f",fontWeight:900,fontSize:14}}>← Volver</button>
    </div>);
    if(!guessQ) return null;
    const{correct,opts}=guessQ;
    return(<div className="fade-up">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <ST sub="Adivina el Jugador">Ronda {guessRound+1}/8</ST>
        <div style={{fontSize:20,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#00FF9D"}}>{guessScore} pts</div>
      </div>
      <Card style={{marginBottom:14,background:"linear-gradient(135deg,#00FF9D08,#0d1117)",borderColor:"#00FF9D33",padding:"18px 20px"}}>
        <div style={{fontSize:10,color:"#00FF9D",textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>🕵️ ¿Quién es este jugador?</div>
        {correct.clues.map((clue,i)=>(
          <div key={i} style={{display:"flex",gap:10,alignItems:"flex-start",padding:"8px 0",borderBottom:i<correct.clues.length-1?`1px solid ${C.border}`:"none"}}>
            <span style={{color:"#00FF9D",fontSize:11,fontWeight:900,minWidth:18}}>{i+1}.</span>
            <span style={{fontSize:12,color:C.text,lineHeight:1.4}}>{clue}</span>
          </div>
        ))}
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {opts.map((p)=>{
          const isCorrect=p.name===correct.name;
          return<button key={p.name} className="btn" onClick={()=>answerGuess(p)} style={{padding:"14px 10px",borderRadius:12,textAlign:"center",background:guessFeedback!==null?(isCorrect?"#00FF9D22":"#0a1018"):"#0a1018",border:`2px solid ${guessFeedback!==null?isCorrect?"#00FF9D":C.border:C.border}`,transition:"all .2s"}}>
            {guessFeedback!==null&&logo(p.team,24)}
            <div style={{fontSize:12,fontWeight:700,color:guessFeedback!==null&&isCorrect?"#00FF9D":C.text,marginTop:guessFeedback!==null?4:0}}>{p.name}</div>
            {guessFeedback!==null&&<div style={{fontSize:10,color:C.dim,marginTop:2}}>{p.team}</div>}
          </button>;
        })}
      </div>
      {guessFeedback!==null&&<div style={{textAlign:"center",marginTop:10,fontSize:15,fontWeight:700,color:guessFeedback?"#00FF9D":"#ff6666"}}>{guessFeedback?"✅ ¡Correcto!":"❌ Era "+correct.name}</div>}
      <div style={{height:5,borderRadius:3,background:C.border,overflow:"hidden",marginTop:14}}><div style={{width:`${(guessRound/8)*100}%`,height:"100%",background:"#00FF9D",transition:"width .4s"}}/></div>
    </div>);
  }

  if(screen==="game"&&game==="champs"){
    if(champsDone) return(<div className="fade-up">
      <ST sub="Campeones NBA">Resultado</ST>
      <Card style={{textAlign:"center",padding:30,marginBottom:14}}>
        <div style={{fontSize:56,marginBottom:8}}>🏆</div>
        <div style={{fontSize:36,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#E03A3E"}}>{champsScore}/10</div>
        <div style={{fontSize:14,color:C.dim,marginTop:4}}>{champsScore>=9?"¡Eres un historiador NBA! 🏆":champsScore>=6?"¡Buen conocimiento! 💪":"A repasar la historia 📚"}</div>
      </Card>
      {scores.length>0&&<Card style={{marginBottom:14}}><div style={{fontSize:11,color:C.muted,marginBottom:10,textTransform:"uppercase",letterSpacing:2}}>🏆 Top Puntuaciones</div>
        {scores.map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<scores.length-1?`1px solid ${C.border}`:"none"}}><span style={{fontSize:11,color:C.muted,width:16}}>{i+1}</span><span style={{fontSize:13}}>{s.users?.avatar_emoji||"🏀"}</span><span style={{flex:1,fontSize:12,color:C.text}}>{s.users?.name}</span><span style={{fontSize:14,fontWeight:900,color:"#E03A3E"}}>{s.score}/10</span></div>)}
      </Card>}
      <button className="btn" onClick={()=>setScreen("menu")} style={{width:"100%",padding:"13px",borderRadius:10,background:"#E03A3E",color:"#fff",fontWeight:900,fontSize:14}}>← Volver</button>
    </div>);
    if(!champsQ) return null;
    const{correct,opts}=champsQ;
    return(<div className="fade-up">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <ST sub="Campeones NBA">Ronda {champsRound+1}/10</ST>
        <div style={{fontSize:20,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#E03A3E"}}>{champsScore} pts</div>
      </div>
      <Card style={{marginBottom:20,background:"linear-gradient(135deg,#E03A3E11,#0d1117)",borderColor:"#E03A3E44",textAlign:"center",padding:"28px 20px"}}>
        <div style={{fontSize:11,color:"#E03A3E",textTransform:"uppercase",letterSpacing:2,marginBottom:8}}>🏆 ¿Quién fue campeón en...?</div>
        <div style={{fontSize:72,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.text}}>{correct.year}</div>
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {opts.map((o)=>{
          const isCorrect=o.team===correct.team;
          return<button key={o.team+o.year} className="btn" onClick={()=>answerChamps(o.team)} style={{padding:"16px 10px",borderRadius:12,textAlign:"center",background:champsFeedback!==null?(isCorrect?"#E03A3E22":"#0a1018"):"#0a1018",border:`2px solid ${champsFeedback!==null?isCorrect?"#E03A3E":C.border:C.border}`,transition:"all .2s"}}>
            {champsFeedback!==null&&logo(o.team,32)}
            <div style={{fontSize:12,fontWeight:700,color:champsFeedback!==null&&isCorrect?"#E03A3E":C.text,marginTop:champsFeedback!==null?4:0}}>{o.label||tm(o.team).name||o.team}</div>
          </button>;
        })}
      </div>
      {champsFeedback!==null&&<div style={{textAlign:"center",marginTop:10,fontSize:15,fontWeight:700,color:champsFeedback?"#E03A3E":"#ff6666"}}>{champsFeedback?"🏆 ¡Correcto!":"❌ Fue "+(correct.label||tm(correct.team).name||correct.team)}</div>}
      <div style={{height:5,borderRadius:3,background:C.border,overflow:"hidden",marginTop:14}}><div style={{width:`${(champsRound/10)*100}%`,height:"100%",background:"#E03A3E",transition:"width .4s"}}/></div>
    </div>);
  }

  // ─── REACTION SCREEN ────────────────────────────────────────────────────────
  if(screen==="game"&&game==="react"){
    const round=reactTimes.length;
    const avg=reactTimes.length?Math.round(reactTimes.reduce((a,b)=>a+b,0)/reactTimes.length):0;
    const finalScore=Math.max(0,Math.min(999,Math.round(1000-(avg/2))));
    if(reactPhase==="done") return(<div className="fade-up">
      <ST sub="Test de Reacción">¡Terminaste! ⚡</ST>
      <Card style={{textAlign:"center",padding:30,marginBottom:14,background:"linear-gradient(135deg,#FFD70014,#0d1117)",borderColor:"#FFD70044"}}>
        <div style={{fontSize:56,marginBottom:4}}>⚡</div>
        <div style={{fontSize:40,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#FFD700"}}>{avg} ms</div>
        <div style={{fontSize:13,color:C.dim,marginTop:4,marginBottom:10}}>Promedio de 5 intentos</div>
        <div style={{fontSize:36,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.accent}}>{finalScore} pts</div>
        <div style={{fontSize:11,color:C.dim,marginTop:4}}>{avg<220?"🔥 ¡Reflejos de campeón!":avg<280?"⚡ ¡Muy bien!":avg<350?"👍 Por encima del promedio":"📈 Sigue practicando"}</div>
        <div style={{marginTop:14,display:"flex",gap:6,flexWrap:"wrap",justifyContent:"center"}}>
          {reactTimes.map((t,i)=><div key={i} style={{background:"#0d1117",border:`1px solid ${C.border}`,borderRadius:8,padding:"4px 10px",fontSize:11,color:t<250?"#00FF9D":t<350?C.accent:"#ff6666"}}>{t}ms</div>)}
        </div>
      </Card>
      {scores.length>0&&<Card style={{marginBottom:14}}><div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>🏆 Ranking Global</div>{scores.slice(0,5).map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<Math.min(4,scores.length-1)?`1px solid ${C.border}`:"none"}}><span style={{fontSize:11,color:C.muted,width:16}}>{i+1}</span><span style={{flex:1,fontSize:12,color:C.text}}>{s.users?.avatar_emoji||"⚡"} {s.users?.name}</span><span style={{fontSize:13,fontWeight:900,color:"#FFD700"}}>{s.score} pts</span></div>)}</Card>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <button className="btn" onClick={startReact} style={{padding:"13px",borderRadius:10,background:"linear-gradient(135deg,#FFD700,#ffa500)",color:"#07090f",fontWeight:900,fontSize:14}}>Repetir</button>
        <button className="btn" onClick={()=>setScreen("menu")} style={{padding:"13px",borderRadius:10,background:"#0a1018",border:`1px solid ${C.border}`,color:C.text,fontWeight:700,fontSize:14}}>← Menú</button>
      </div>
    </div>);
    const bgGrad=reactPhase==="go"?"linear-gradient(135deg,#00FF9D22,#00c97a11)":reactPhase==="early"?"linear-gradient(135deg,#ff444422,#0d1117)":"linear-gradient(135deg,#0a1018,#0d1117)";
    return(<div className="fade-up">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <ST sub="Test de Reacción">Intento {round+1}/5 ⚡</ST>
        {reactTimes.length>0&&<div style={{fontSize:14,fontWeight:900,color:"#FFD700"}}>{Math.round(reactTimes.reduce((a,b)=>a+b,0)/reactTimes.length)}ms avg</div>}
      </div>
      <button className="btn" onClick={tapReact} style={{width:"100%",minHeight:240,borderRadius:20,background:bgGrad,border:`3px solid ${reactPhase==="go"?"#00FF9D":reactPhase==="early"?"#ff4444":C.border}`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,transition:"all .1s",cursor:"pointer",touchAction:"manipulation"}}>
        <div style={{fontSize:72}}>{reactPhase==="go"?"🟢":reactPhase==="early"?"🔴":reactPhase==="tapped"?"✅":"⏳"}</div>
        <div style={{fontSize:18,fontWeight:900,color:reactPhase==="go"?"#00FF9D":reactPhase==="early"?"#ff6666":reactPhase==="tapped"?C.accent:C.muted}}>
          {reactPhase==="go"?"¡TOCA AHORA!":reactPhase==="early"?"¡Demasiado pronto!":reactPhase==="tapped"?`${reactTimes[reactTimes.length-1]}ms ⚡`:"Espera..."}
        </div>
        {reactPhase==="waiting"&&<div style={{fontSize:11,color:C.dim}}>No toques todavía</div>}
      </button>
      {reactTimes.length>0&&<div style={{display:"flex",gap:6,marginTop:12,flexWrap:"wrap",justifyContent:"center"}}>
        {reactTimes.map((t,i)=><div key={i} style={{background:"#0d1117",border:`1px solid ${C.border}`,borderRadius:8,padding:"4px 10px",fontSize:11,color:t<250?"#00FF9D":t<350?C.accent:"#ff6666"}}>{t}ms</div>)}
      </div>}
      <button className="btn" onClick={()=>{clearTimeout(reactTimer);setScreen("menu");}} style={{width:"100%",marginTop:14,padding:"10px",borderRadius:10,background:"#0a1018",border:`1px solid ${C.border}`,color:C.dim,fontSize:12}}>Salir</button>
    </div>);
  }

  // ─── MEMORY SCREEN ───────────────────────────────────────────────────────────
  if(screen==="game"&&game==="memory"){
    if(memDone) return(<div className="fade-up">
      <ST sub="Memoria">¡Completado! 🃏</ST>
      <Card style={{textAlign:"center",padding:30,marginBottom:14,background:"linear-gradient(135deg,#9B59B611,#0d1117)",borderColor:"#9B59B644"}}>
        <div style={{fontSize:56,marginBottom:4}}>🃏</div>
        <div style={{fontSize:40,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#9B59B6"}}>{memMoves} mov</div>
        <div style={{fontSize:36,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.accent,marginTop:4}}>{Math.max(0,100-Math.max(0,memMoves-8)*4)} pts</div>
        <div style={{fontSize:12,color:C.dim,marginTop:4}}>{memMoves<=8?"🏆 ¡Perfecto!":memMoves<=14?"⚡ ¡Excelente!":memMoves<=20?"👍 ¡Bien!":"💪 ¡Lo lograste!"}</div>
      </Card>
      {scores.length>0&&<Card style={{marginBottom:14}}><div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>🏆 Ranking Global</div>{scores.slice(0,5).map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<Math.min(4,scores.length-1)?`1px solid ${C.border}`:"none"}}><span style={{fontSize:11,color:C.muted,width:16}}>{i+1}</span><span style={{flex:1,fontSize:12,color:C.text}}>{s.users?.avatar_emoji||"🃏"} {s.users?.name}</span><span style={{fontSize:13,fontWeight:900,color:"#9B59B6"}}>{s.score} pts</span></div>)}</Card>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <button className="btn" onClick={startMemory} style={{padding:"13px",borderRadius:10,background:"linear-gradient(135deg,#9B59B6,#7d3c98)",color:"#fff",fontWeight:900,fontSize:14}}>Repetir</button>
        <button className="btn" onClick={()=>setScreen("menu")} style={{padding:"13px",borderRadius:10,background:"#0a1018",border:`1px solid ${C.border}`,color:C.text,fontWeight:700,fontSize:14}}>← Menú</button>
      </div>
    </div>);
    return(<div className="fade-up">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <ST sub="Memoria">Movimientos: {memMoves} 🃏</ST>
        <div style={{fontSize:13,fontWeight:700,color:"#9B59B6"}}>{memMatched.length}/8 pares</div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8,marginBottom:14}}>
        {memCards.map((card,idx)=>{
          const isFlipped=memFlipped.includes(idx);
          const isMatched=memMatched.includes(card.emoji);
          return<button key={card.id} className="btn" onClick={()=>flipCard(idx)} style={{aspectRatio:"1",borderRadius:12,background:isMatched?"#9B59B622":isFlipped?"#0d1117":"#131d29",border:`2px solid ${isMatched?"#9B59B6":isFlipped?"#9B59B688":C.border}`,fontSize:isFlipped||isMatched?28:10,display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s",cursor:isMatched?"default":"pointer",opacity:isMatched?0.6:1}}>
            {isFlipped||isMatched?card.emoji:"?"}
          </button>;
        })}
      </div>
      <button className="btn" onClick={()=>setScreen("menu")} style={{width:"100%",padding:"10px",borderRadius:10,background:"#0a1018",border:`1px solid ${C.border}`,color:C.dim,fontSize:12}}>Salir</button>
    </div>);
  }

  // ─── FLAG SCREEN ─────────────────────────────────────────────────────────────
  if(screen==="game"&&game==="flags"){
    if(flagDone) return(<div className="fade-up">
      <ST sub="Banderas">Resultado 🌍</ST>
      <Card style={{textAlign:"center",padding:30,marginBottom:14,background:"linear-gradient(135deg,#00C2FF11,#0d1117)",borderColor:"#00C2FF44"}}>
        <div style={{fontSize:56,marginBottom:4}}>🌍</div>
        <div style={{fontSize:40,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#00C2FF"}}>{flagScore}/10</div>
        <div style={{fontSize:13,color:C.dim,marginTop:4}}>{flagScore===10?"🏆 ¡Experto en geografía!":flagScore>=7?"🌍 ¡Muy buen conocimiento!":flagScore>=5?"👍 Pasable":flagScore>=3?"📚 A estudiar el mapamundi":"🗺️ ¿Nunca has visto un atlas?"}</div>
      </Card>
      {scores.length>0&&<Card style={{marginBottom:14}}><div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>🏆 Ranking Global</div>{scores.slice(0,5).map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<Math.min(4,scores.length-1)?`1px solid ${C.border}`:"none"}}><span style={{fontSize:11,color:C.muted,width:16}}>{i+1}</span><span style={{flex:1,fontSize:12,color:C.text}}>{s.users?.avatar_emoji||"🌍"} {s.users?.name}</span><span style={{fontSize:13,fontWeight:900,color:"#00C2FF"}}>{s.score}/10</span></div>)}</Card>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <button className="btn" onClick={startFlags} style={{padding:"13px",borderRadius:10,background:"linear-gradient(135deg,#00C2FF,#0055ff)",color:"#fff",fontWeight:900,fontSize:14}}>Repetir</button>
        <button className="btn" onClick={()=>setScreen("menu")} style={{padding:"13px",borderRadius:10,background:"#0a1018",border:`1px solid ${C.border}`,color:C.text,fontWeight:700,fontSize:14}}>← Menú</button>
      </div>
    </div>);
    if(!flagQ) return null;
    return(<div className="fade-up">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <ST sub="Banderas">Pregunta {flagRound+1}/10 🌍</ST>
        <div style={{fontSize:20,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#00C2FF"}}>{flagScore} pts</div>
      </div>
      <Card style={{textAlign:"center",padding:"32px 20px",marginBottom:16,background:"linear-gradient(135deg,#00C2FF08,#0d1117)",borderColor:"#00C2FF33"}}>
        <div style={{fontSize:10,color:"#00C2FF",textTransform:"uppercase",letterSpacing:2,marginBottom:12}}>¿De qué país es esta bandera?</div>
        <div style={{fontSize:96,lineHeight:1}}>{flagQ.flag}</div>
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {flagQ.opts.map(opt=>{
          const isCorrect=opt===flagQ.country;
          const chosen=flagFeedback&&(flagFeedback===opt||flagFeedback==="wrong:"+opt);
          return<button key={opt} className="btn" onClick={()=>answerFlag(opt)} style={{padding:"14px 10px",borderRadius:12,textAlign:"center",background:flagFeedback!==null?(isCorrect?"#00C2FF22":chosen?"#ff444422":"#0a1018"):"#0a1018",border:`2px solid ${flagFeedback!==null?(isCorrect?"#00C2FF":chosen?"#ff4444":C.border):C.border}`,color:flagFeedback!==null?(isCorrect?"#00C2FF":chosen?"#ff6666":C.dim):C.text,fontWeight:700,fontSize:13,transition:"all .2s"}}>{opt}</button>;
        })}
      </div>
      {flagFeedback&&<div style={{textAlign:"center",marginTop:10,fontSize:15,fontWeight:700,color:flagFeedback===flagQ.country?"#00C2FF":"#ff6666"}}>{flagFeedback===flagQ.country?"✅ ¡Correcto!":"❌ Era "+flagQ.country}</div>}
      <div style={{height:5,borderRadius:3,background:C.border,overflow:"hidden",marginTop:14}}><div style={{width:`${(flagRound/10)*100}%`,height:"100%",background:"#00C2FF",transition:"width .4s"}}/></div>
    </div>);
  }

  // ─── MATH SCREEN ─────────────────────────────────────────────────────────────
  if(screen==="game"&&game==="math"){
    if(mathDone) return(<div className="fade-up">
      <ST sub="Mate Rápido">Resultado 🔢</ST>
      <Card style={{textAlign:"center",padding:30,marginBottom:14,background:"linear-gradient(135deg,#FF6B3511,#0d1117)",borderColor:"#FF6B3544"}}>
        <div style={{fontSize:56,marginBottom:4}}>🔢</div>
        <div style={{fontSize:40,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#FF6B35"}}>{mathScore}/10</div>
        <div style={{fontSize:13,color:C.dim,marginTop:4}}>{mathScore===10?"🏆 ¡Calculadora humana!":mathScore>=7?"⚡ ¡Muy rápido!":mathScore>=5?"💪 ¡Buen intento!":"📚 Practica más"}</div>
      </Card>
      {scores.length>0&&<Card style={{marginBottom:14}}><div style={{fontSize:10,color:C.muted,textTransform:"uppercase",letterSpacing:2,marginBottom:10}}>🏆 Ranking Global</div>{scores.slice(0,5).map((s,i)=><div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:i<Math.min(4,scores.length-1)?`1px solid ${C.border}`:"none"}}><span style={{fontSize:11,color:C.muted,width:16}}>{i+1}</span><span style={{flex:1,fontSize:12,color:C.text}}>{s.users?.avatar_emoji||"🔢"} {s.users?.name}</span><span style={{fontSize:13,fontWeight:900,color:"#FF6B35"}}>{s.score}/10</span></div>)}</Card>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <button className="btn" onClick={startMath} style={{padding:"13px",borderRadius:10,background:"linear-gradient(135deg,#FF6B35,#ff9500)",color:"#07090f",fontWeight:900,fontSize:14}}>Repetir</button>
        <button className="btn" onClick={()=>setScreen("menu")} style={{padding:"13px",borderRadius:10,background:"#0a1018",border:`1px solid ${C.border}`,color:C.text,fontWeight:700,fontSize:14}}>← Menú</button>
      </div>
    </div>);
    if(!mathQ) return null;
    const timerPct=(mathTimer/5)*100;
    const timerColor=mathTimer>2?"#00FF9D":mathTimer>1?"#FFB800":"#ff4444";
    return(<div className="fade-up">
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:14}}>
        <ST sub="Mate Rápido">Pregunta {mathRound+1}/10 🔢</ST>
        <div style={{fontSize:20,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:"#FF6B35"}}>{mathScore} pts</div>
      </div>
      {/* Timer bar */}
      <div style={{height:6,borderRadius:3,background:C.border,overflow:"hidden",marginBottom:14}}>
        <div style={{width:`${timerPct}%`,height:"100%",background:timerColor,transition:"width 1s linear"}}/>
      </div>
      <Card style={{textAlign:"center",padding:"32px 20px",marginBottom:16,background:"linear-gradient(135deg,#FF6B3508,#0d1117)",borderColor:"#FF6B3533"}}>
        <div style={{fontSize:52,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:C.text}}>{mathQ.q} = ?</div>
        <div style={{fontSize:28,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",color:timerColor,marginTop:4}}>{mathTimer}s</div>
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        {mathQ.opts.map(opt=>{
          const isCorrect=opt===mathQ.ans;
          return<button key={opt} className="btn" onClick={()=>answerMath(opt)} style={{padding:"16px",borderRadius:12,textAlign:"center",background:mathFeedback!==null?(isCorrect?"#FF6B3522":"#0a1018"):"#0a1018",border:`2px solid ${mathFeedback!==null?isCorrect?"#FF6B35":C.border:C.border}`,color:mathFeedback!==null?isCorrect?"#FF6B35":C.dim:C.text,fontSize:22,fontWeight:900,fontFamily:"'Bebas Neue',sans-serif",transition:"all .2s"}}>{opt}</button>;
        })}
      </div>
      {mathFeedback!==null&&<div style={{textAlign:"center",marginTop:10,fontSize:15,fontWeight:700,color:mathFeedback?"#FF6B35":"#ff6666"}}>{mathFeedback?"✅ ¡Correcto!":"❌ Era "+mathQ.ans}</div>}
    </div>);
  }

  return null;
};
