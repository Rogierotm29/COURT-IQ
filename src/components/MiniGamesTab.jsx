import { useState, useEffect, useRef } from "react";
import { T } from "../theme";
import { Card, ST } from "./ui";
import { logo, tm } from "./TeamLogo";
import { pickemAPI } from "../api/pickem";
import { TRIVIA_ALL, CHAMPS, PLAYER_CLUES, FLAGS } from "../data/minigames";

const GAME_TYPES=["scorer","trivia","guess","champs","react","flags","math","memory"];

export const MiniGamesTab=({players,userCtx})=>{
  const {user}=userCtx||{};
  const [screen,setScreen]=useState("menu");
  const [game,setGame]=useState(null);

  // Scorer
  const [scorerRound,setScorerRound]=useState(0);
  const [scorerScore,setScorerScore]=useState(0);
  const [scorerPair,setScorerPair]=useState(null);
  const [scorerDone,setScorerDone]=useState(false);
  const [scorerFeedback,setScorerFeedback]=useState(null);
  // Trivia
  const [triviaQ,setTriviaQ]=useState(0);
  const [triviaScore,setTriviaScore]=useState(0);
  const [triviaDone,setTriviaDone]=useState(false);
  const [triviaFeedback,setTriviaFeedback]=useState(null);
  const [triviaSet,setTriviaSet]=useState([]);
  // Reacción
  const [reactPhase,setReactPhase]=useState("idle");
  const [reactTimes,setReactTimes]=useState([]);
  const [reactStart,setReactStart]=useState(0);
  const reactTimerRef=useRef(null);
  // Memoria
  const [memCards,setMemCards]=useState([]);
  const [memFlipped,setMemFlipped]=useState([]);
  const [memMatched,setMemMatched]=useState([]);
  const [memMoves,setMemMoves]=useState(0);
  const [memLocked,setMemLocked]=useState(false);
  const [memDone,setMemDone]=useState(false);
  // Banderas
  const [flagRound,setFlagRound]=useState(0);
  const [flagScore,setFlagScore]=useState(0);
  const [flagQ,setFlagQ]=useState(null);
  const [flagDone,setFlagDone]=useState(false);
  const [flagFeedback,setFlagFeedback]=useState(null);
  const [flagPool,setFlagPool]=useState([]);
  // Matemáticas
  const [mathRound,setMathRound]=useState(0);
  const [mathScore,setMathScore]=useState(0);
  const [mathQ,setMathQ]=useState(null);
  const [mathDone,setMathDone]=useState(false);
  const [mathFeedback,setMathFeedback]=useState(null);
  const [mathTimer,setMathTimer]=useState(5);
  const mathTimerRef=useRef(null);
  // Adivina el jugador
  const [guessRound,setGuessRound]=useState(0);
  const [guessScore,setGuessScore]=useState(0);
  const [guessQ,setGuessQ]=useState(null);
  const [guessDone,setGuessDone]=useState(false);
  const [guessFeedback,setGuessFeedback]=useState(null);
  const [guessPool,setGuessPool]=useState([]);
  // Campeones
  const [champsRound,setChampsRound]=useState(0);
  const [champsScore,setChampsScore]=useState(0);
  const [champsQ,setChampsQ]=useState(null);
  const [champsDone,setChampsDone]=useState(false);
  const [champsFeedback,setChampsFeedback]=useState(null);
  const [champsPool,setChampsPool]=useState([]);
  // Rankings
  const [scores,setScores]=useState([]);
  const [allRankings,setAllRankings]=useState(Object.fromEntries(GAME_TYPES.map(t=>[t,[]])));

  useEffect(()=>{
    Promise.allSettled(GAME_TYPES.map(t=>pickemAPI("getMiniScores",{params:{gameType:t}})))
      .then(results=>{
        const r={};
        GAME_TYPES.forEach((t,i)=>{
          const res=results[i];
          r[t]=res.status==="fulfilled"&&res.value?.ok?(res.value.scores||[]):[];
        });
        setAllRankings(r);
      });
  },[]);

  // Limpiar timers al desmontar
  useEffect(()=>()=>{clearTimeout(reactTimerRef.current);clearTimeout(mathTimerRef.current);},[]);

  const saveScore=(type,score)=>{
    if(user) pickemAPI("saveMiniScore",{body:{userId:user.id,gameType:type,score}});
    pickemAPI("getMiniScores",{params:{gameType:type}}).then(d=>{
      if(d.ok){setScores(d.scores||[]);setAllRankings(r=>({...r,[type]:d.scores||[]}));}
    });
  };

  /* ── estilos ── */
  const label={fontSize:T.font.xs,color:T.text.tertiary,textTransform:"uppercase",letterSpacing:1.2,fontWeight:600};
  const btnPrimary={background:T.accent.base,color:"#fff",borderRadius:T.radius.base,fontWeight:600};
  const btnGhost={background:T.surface[2],border:`1px solid ${T.border.base}`,color:T.text.secondary,borderRadius:T.radius.base,fontWeight:600};
  const optBase={padding:`${T.space[4]}px ${T.space[3]}px`,borderRadius:T.radius.base,textAlign:"center",background:T.surface[2],border:`1px solid ${T.border.subtle}`,color:T.text.primary,fontSize:T.font.sm,fontWeight:600,transition:"border-color .15s, background .15s"};

  // Estilo de una opción según el feedback
  const optStyle=(isCorrect,isChosen,revealed)=>{
    if(!revealed) return optBase;
    if(isCorrect) return {...optBase,background:T.success.subtle,border:`1px solid ${T.success.base}`,color:T.success.base};
    if(isChosen)  return {...optBase,background:T.danger.subtle,border:`1px solid ${T.danger.base}`,color:T.danger.base};
    return {...optBase,opacity:.5};
  };

  /* ── componentes compartidos ── */
  const Progress=({value,max})=>(
    <div style={{height:3,borderRadius:2,background:T.surface[3],overflow:"hidden",marginTop:T.space[4]}}>
      <div style={{width:`${(value/max)*100}%`,height:"100%",background:T.accent.base,transition:"width .4s"}}/>
    </div>
  );

  const Ranking=({list,suffix=""})=>(
    list.length===0?null
    :<Card style={{marginBottom:T.space[4]}}>
      <div style={{...label,marginBottom:T.space[3]}}>Ranking global</div>
      {list.slice(0,5).map((s,i)=>{
        const isMe=user&&s.users?.name===user.name;
        return<div key={i} style={{display:"flex",alignItems:"center",gap:T.space[3],padding:`${T.space[2]}px 0`,borderBottom:i<Math.min(4,list.length-1)?`1px solid ${T.border.subtle}`:"none"}}>
          <span style={{fontSize:T.font.xs,color:i===0?T.accent.base:T.text.tertiary,fontWeight:600,width:16}}>{i+1}</span>
          <span style={{fontSize:T.font.sm}}>{s.users?.avatar_emoji||"🏀"}</span>
          <span style={{flex:1,fontSize:T.font.sm,color:T.text.primary,fontWeight:isMe?600:400}}>{s.users?.name}{isMe?" (tú)":""}</span>
          <span style={{fontSize:T.font.base,fontWeight:700,color:T.text.primary}}>{s.score}{suffix}</span>
        </div>;
      })}
    </Card>
  );

  const Result=({title,score,suffix,verdict,extra,onRetry})=>(
    <div className="fade-up">
      <ST sub={title}>Resultado</ST>
      <Card style={{textAlign:"center",padding:T.space[6],marginBottom:T.space[4]}}>
        <div style={{fontSize:T.font["3xl"],fontWeight:700,color:T.text.primary,letterSpacing:-1,lineHeight:1.1}}>{score}{suffix}</div>
        <div style={{fontSize:T.font.sm,color:T.text.secondary,marginTop:T.space[2]}}>{verdict}</div>
        {extra}
      </Card>
      <Ranking list={scores} suffix={suffix}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:T.space[2]}}>
        <button className="btn" onClick={onRetry} style={{...btnPrimary,padding:T.space[3],fontSize:T.font.base}}>Repetir</button>
        <button className="btn" onClick={()=>setScreen("menu")} style={{...btnGhost,padding:T.space[3],fontSize:T.font.base}}>Volver</button>
      </div>
    </div>
  );

  const GameHeader=({sub,title,score,scoreLabel="pts"})=>(
    <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:T.space[4]}}>
      <ST sub={sub} style={{marginBottom:0}}>{title}</ST>
      <div style={{textAlign:"right"}}>
        <div style={{fontSize:T.font.xl,fontWeight:700,color:T.text.primary}}>{score}</div>
        <div style={{fontSize:T.font.xs,color:T.text.tertiary}}>{scoreLabel}</div>
      </div>
    </div>
  );

  const ExitBtn=({onExit})=>(
    <button className="btn" onClick={onExit||(()=>setScreen("menu"))} style={{...btnGhost,width:"100%",marginTop:T.space[4],padding:T.space[2],fontSize:T.font.sm}}>Salir</button>
  );

  /* ═══ LÓGICA DE JUEGOS ═══ */

  const buildClueQ=(pool,round)=>{
    const correct=pool[round];
    const others=[...PLAYER_CLUES].filter(p=>p.name!==correct.name).sort(()=>Math.random()-.5).slice(0,3);
    return{correct,opts:[correct,...others].sort(()=>Math.random()-.5)};
  };
  const startGuess=()=>{
    const pool=[...PLAYER_CLUES].sort(()=>Math.random()-.5);
    setGuessRound(0);setGuessScore(0);setGuessDone(false);setGuessFeedback(null);
    setGuessPool(pool);setGuessQ(buildClueQ(pool,0));setGame("guess");setScreen("game");
  };
  const answerGuess=(p)=>{
    if(guessFeedback!==null) return;
    const ok=p.name===guessQ.correct.name;
    setGuessFeedback({ok,chosen:p.name});
    if(ok) setGuessScore(s=>s+1);
    setTimeout(()=>{
      if(!ok){ setGuessDone(true); saveScore("guess",guessScore); return; }
      const next=guessRound+1;
      setGuessRound(next);
      setGuessQ(buildClueQ(guessPool,next%guessPool.length));
      setGuessFeedback(null);
    },1000);
  };

  const buildChampsQ=(pool,round)=>{
    const correct=pool[round];
    const seen=new Set([correct.team]);const others=[];
    for(const c of [...CHAMPS].sort(()=>Math.random()-.5)){
      if(!seen.has(c.team)){seen.add(c.team);others.push(c);}
      if(others.length===3) break;
    }
    return{correct,opts:[correct,...others].sort(()=>Math.random()-.5)};
  };
  const startChamps=()=>{
    const pool=[...CHAMPS].sort(()=>Math.random()-.5);   // sin .slice(0,10)
    setChampsRound(0);setChampsScore(0);setChampsDone(false);setChampsFeedback(null);
    setChampsPool(pool);setChampsQ(buildChampsQ(pool,0));setGame("champs");setScreen("game");
  };

  const answerChamps=(team)=>{
    if(champsFeedback!==null) return;
    const ok=team===champsQ.correct.team;
    setChampsFeedback({ok,chosen:team});
    if(ok) setChampsScore(s=>s+1);
    setTimeout(()=>{
      if(!ok){ setChampsDone(true); saveScore("champs",champsScore); return; }
      const next=champsRound+1;
      setChampsRound(next);
      setChampsQ(buildChampsQ(champsPool,next%champsPool.length));
      setChampsFeedback(null);
    },1000);
  };

  const pickPair=()=>{
    if(!players||players.length<2) return null;
    const i1=Math.floor(Math.random()*players.length);
    let i2=Math.floor(Math.random()*players.length);
    while(i2===i1) i2=Math.floor(Math.random()*players.length);
    return [players[i1],players[i2]];
  };
  const startScorer=()=>{
    setScorerRound(0);setScorerScore(0);setScorerDone(false);setScorerFeedback(null);
    setScorerPair(pickPair());setGame("scorer");setScreen("game");
  };
  const answerScorer=(chosen)=>{
    if(scorerFeedback!==null) return;
    const [p1,p2]=scorerPair;
    const ok=(chosen===0&&p1.pts>=p2.pts)||(chosen===1&&p2.pts>=p1.pts);
    setScorerFeedback({ok,chosen});
    if(ok) setScorerScore(s=>s+1);
    setTimeout(()=>{
      const next=scorerRound+1;
      if(next>=10){setScorerDone(true);saveScore("scorer",ok?scorerScore+1:scorerScore);}
      else{setScorerRound(next);setScorerPair(pickPair());setScorerFeedback(null);}
    },900);
  };

  const startTrivia=()=>{
    setTriviaSet([...TRIVIA_ALL].sort(()=>Math.random()-.5));
    setTriviaQ(0);setTriviaScore(0);setTriviaDone(false);setTriviaFeedback(null);
    setGame("trivia");setScreen("game");
  };
  const answerTrivia=(idx)=>{
    if(triviaFeedback!==null) return;
    const q=triviaSet[triviaQ%triviaSet.length];
    const ok=idx===q.a;
    setTriviaFeedback({ok,chosen:idx});
    if(ok) setTriviaScore(s=>s+1);
    setTimeout(()=>{
      if(!ok){ setTriviaDone(true); saveScore("trivia",triviaScore); return; }
      setTriviaQ(n=>n+1);
      setTriviaFeedback(null);
    },900);
  };

  const beginReactRound=()=>{
    setReactPhase("waiting");
    reactTimerRef.current=setTimeout(()=>{setReactPhase("go");setReactStart(Date.now());},1200+Math.random()*2800);
  };
  const startReact=()=>{
    setReactTimes([]);setReactPhase("idle");setGame("react");setScreen("game");
    beginReactRound();
  };
  const tapReact=()=>{
    if(reactPhase==="waiting"){
      clearTimeout(reactTimerRef.current);setReactPhase("early");
      setTimeout(beginReactRound,1200);return;
    }
    if(reactPhase!=="go") return;
    const elapsed=Date.now()-reactStart;
    const times=[...reactTimes,elapsed];
    setReactTimes(times);setReactPhase("tapped");
    if(times.length>=5){
      const avg=Math.round(times.reduce((a,b)=>a+b,0)/times.length);
      setTimeout(()=>{setReactPhase("done");saveScore("react",Math.max(0,Math.min(999,Math.round(1000-avg/2))));},800);
    } else setTimeout(beginReactRound,900);
  };

  const MEM_EMOJIS=["🏀","⚽","🎾","🏈","🎱","🥊","⚾","🏐"];
  const startMemory=()=>{
    const deck=[...MEM_EMOJIS,...MEM_EMOJIS].map((e,i)=>({id:i,emoji:e})).sort(()=>Math.random()-.5);
    setMemCards(deck);setMemFlipped([]);setMemMatched([]);setMemMoves(0);setMemLocked(false);setMemDone(false);
    setGame("memory");setScreen("game");
  };
  const flipCard=(idx)=>{
    if(memLocked||memFlipped.includes(idx)||memMatched.includes(memCards[idx]?.emoji)) return;
    const flipped=[...memFlipped,idx];
    setMemFlipped(flipped);
    if(flipped.length===2){
      setMemLocked(true);setMemMoves(m=>m+1);
      const [a,b]=flipped;
      if(memCards[a].emoji===memCards[b].emoji){
        const matched=[...memMatched,memCards[a].emoji];
        setMemMatched(matched);setMemFlipped([]);setMemLocked(false);
        if(matched.length===8){
          const moves=memMoves+1;
          setMemDone(true);
          saveScore("memory",Math.max(0,100-Math.max(0,moves-8)*4));
        }
      } else setTimeout(()=>{setMemFlipped([]);setMemLocked(false);},900);
    }
  };

  const startFlags=()=>{
    const pool=[...FLAGS].sort(()=>Math.random()-.5).slice(0,10);
    setFlagPool(pool);setFlagRound(0);setFlagScore(0);setFlagDone(false);setFlagFeedback(null);
    setFlagQ(pool[0]);setGame("flags");setScreen("game");
  };
  const answerFlag=(choice)=>{
    if(flagFeedback!==null) return;
    const ok=choice===flagQ.country;
    setFlagFeedback({ok,chosen:choice});
    if(ok) setFlagScore(s=>s+1);
    setTimeout(()=>{
      const next=flagRound+1;
      if(next>=10){setFlagDone(true);saveScore("flags",ok?flagScore+1:flagScore);}
      else{setFlagRound(next);setFlagQ(flagPool[next]);setFlagFeedback(null);}
    },1000);
  };

  const genMathQ=()=>{
    const ops=["+","−","×"];const op=ops[Math.floor(Math.random()*ops.length)];
    let a,b,ans;
    if(op==="+"){a=Math.floor(Math.random()*50)+10;b=Math.floor(Math.random()*50)+10;ans=a+b;}
    else if(op==="−"){a=Math.floor(Math.random()*50)+30;b=Math.floor(Math.random()*30)+5;ans=a-b;}
    else{a=Math.floor(Math.random()*9)+2;b=Math.floor(Math.random()*9)+2;ans=a*b;}
    const wrongs=new Set();
    while(wrongs.size<3){const w=ans+Math.floor(Math.random()*20)-10;if(w!==ans&&w>0)wrongs.add(w);}
    return{q:`${a} ${op} ${b}`,ans,opts:[ans,...wrongs].sort(()=>Math.random()-.5)};
  };
  const startMath=()=>{
    setMathRound(0);setMathScore(0);setMathDone(false);setMathFeedback(null);
    setMathQ(genMathQ());setMathTimer(5);setGame("math");setScreen("game");
  };
  useEffect(()=>{
    if(screen!=="game"||game!=="math"||mathDone||mathFeedback!==null) return;
    if(mathTimer<=0){
      setMathFeedback({ok:false,chosen:null});
      setTimeout(()=>{
        const next=mathRound+1;
        if(next>=10){setMathDone(true);saveScore("math",mathScore);}
        else{setMathRound(next);setMathQ(genMathQ());setMathFeedback(null);setMathTimer(5);}
      },900);
      return;
    }
    mathTimerRef.current=setTimeout(()=>setMathTimer(t=>t-1),1000);
    return()=>clearTimeout(mathTimerRef.current);
  },[mathTimer,screen,game,mathDone,mathFeedback]);
  const answerMath=(opt)=>{
    if(mathFeedback!==null) return;
    clearTimeout(mathTimerRef.current);
    const ok=opt===mathQ.ans;
    setMathFeedback({ok,chosen:opt});
    if(ok) setMathScore(s=>s+1);
    setTimeout(()=>{
      const next=mathRound+1;
      if(next>=10){setMathDone(true);saveScore("math",ok?mathScore+1:mathScore);}
      else{setMathRound(next);setMathQ(genMathQ());setMathFeedback(null);setMathTimer(5);}
    },900);
  };

  const GAMES=[
    {key:"react", label:"Test de reacción", desc:"Toca en cuanto cambie de color", start:startReact, max:999, cat:"general", unit:" pts"},
    {key:"memory",label:"Memoria",          desc:"Empareja las 8 parejas de cartas", start:startMemory, max:100, cat:"general", unit:" pts"},
    {key:"flags", label:"Banderas",         desc:"Reconoce 10 países por su bandera", start:startFlags, max:10, cat:"general", unit:"/10"},
    {key:"math",  label:"Mate rápido",      desc:"10 operaciones, 5 segundos cada una", start:startMath, max:10, cat:"general", unit:"/10"},
    {key:"scorer",label:"¿Quién anota más?",desc:"Adivina qué jugador promedia más puntos", start:startScorer, max:10, cat:"nba", unit:"/10"},
    {key:"trivia",label:"Trivia NBA",       desc:"¿Cuántas seguidas puedes acertar?", start:startTrivia, max:999, cat:"nba", unit:" seguidas"},
    {key:"guess", label:"Adivina el jugador",desc:"Cuatro pistas por jugador — hasta que falles", start:startGuess, max:999, cat:"nba", unit:" seguidas"},
    {key:"champs",label:"Campeones",        desc:"¿Quién ganó ese año? Hasta que falles", start:startChamps, max:999, cat:"nba", unit:" seguidas"},
  ];

  /* ═══ MENÚ ═══ */
  if(screen==="menu") return(<div className="fade-up">
    <ST sub="Mini juegos">Arcade</ST>

    {[["Generales","general"],["NBA","nba"]].map(([secLabel,cat])=><div key={cat}>
      <div style={{...label,marginBottom:T.space[3]}}>{secLabel}</div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:T.space[3],marginBottom:T.space[5]}}>
        {GAMES.filter(g=>g.cat===cat).map(g=>{
          const top=allRankings[g.key]?.[0];
          return<Card key={g.key} style={{padding:T.space[4],display:"flex",flexDirection:"column",gap:T.space[2]}}>
            <div style={{fontSize:T.font.base,fontWeight:600,color:T.text.primary}}>{g.label}</div>
            <div style={{fontSize:T.font.xs,color:T.text.tertiary,lineHeight:1.5,flex:1}}>{g.desc}</div>
            {top&&<div style={{fontSize:T.font.xs,color:T.text.tertiary,paddingTop:T.space[2],borderTop:`1px solid ${T.border.subtle}`}}>
              Mejor: {top.users?.name} · <b style={{color:T.text.secondary}}>{top.score}{g.unit}</b>
            </div>}
            <button className="btn" onClick={g.start} style={{...btnPrimary,padding:T.space[2],fontSize:T.font.sm}}>Jugar</button>
          </Card>;
        })}
      </div>
    </div>)}

    <button className="btn" onClick={()=>setScreen("rankings")} style={{...btnGhost,width:"100%",padding:T.space[3],fontSize:T.font.base}}>Ver rankings globales</button>
  </div>);

  /* ═══ RANKINGS ═══ */
  if(screen==="rankings") return(<div className="fade-up">
    <div style={{display:"flex",alignItems:"center",gap:T.space[3],marginBottom:T.space[5]}}>
      <button className="btn" onClick={()=>setScreen("menu")} style={{...btnGhost,padding:`${T.space[2]}px ${T.space[3]}px`,fontSize:T.font.sm}}>Volver</button>
      <ST sub="Mini juegos" style={{marginBottom:0}}>Rankings</ST>
    </div>
    {GAMES.map(g=>(
      <Card key={g.key} style={{marginBottom:T.space[3]}}>
        <div style={{fontSize:T.font.base,fontWeight:600,color:T.text.primary,marginBottom:T.space[3]}}>{g.label}</div>
        {allRankings[g.key].length===0
          ?<div style={{fontSize:T.font.sm,color:T.text.tertiary,padding:`${T.space[2]}px 0`}}>Aún no hay puntuaciones</div>
          :allRankings[g.key].map((s,i)=>{
            const isMe=user&&s.users?.name===user.name;
            return<div key={i} style={{display:"flex",alignItems:"center",gap:T.space[3],padding:`${T.space[2]}px ${isMe?T.space[2]:0}px`,borderBottom:i<allRankings[g.key].length-1?`1px solid ${T.border.subtle}`:"none",background:isMe?T.accent.subtle:"transparent",borderRadius:isMe?T.radius.sm:0}}>
              <span style={{fontSize:T.font.xs,color:i===0?T.accent.base:T.text.tertiary,fontWeight:600,width:16}}>{i+1}</span>
              <span style={{fontSize:T.font.sm}}>{s.users?.avatar_emoji||"🏀"}</span>
              <span style={{flex:1,fontSize:T.font.sm,color:T.text.primary,fontWeight:isMe?600:400}}>{s.users?.name}{isMe?" (tú)":""}</span>
              <span style={{fontSize:T.font.base,fontWeight:700,color:T.text.primary}}>{s.score}<span style={{fontSize:T.font.xs,color:T.text.tertiary,fontWeight:400}}>{g.unit}</span></span>
            </div>;
          })}
      </Card>
    ))}
  </div>);

  /* ═══ SCORER ═══ */
  if(screen==="game"&&game==="scorer"){
    if(scorerDone) return<Result title="¿Quién anota más?" score={scorerScore} suffix="/10"
      verdict={scorerScore>=8?"Conoces la liga":scorerScore>=5?"Nada mal":"Sigue practicando"} onRetry={startScorer}/>;
    if(!scorerPair) return<div style={{color:T.text.tertiary,textAlign:"center",padding:T.space[7],fontSize:T.font.sm}}>Cargando jugadores…</div>;
    const [p1,p2]=scorerPair;
    const revealed=scorerFeedback!==null;
    const winnerIdx=p1.pts>=p2.pts?0:1;
    return(<div className="fade-up">
      <GameHeader sub="¿Quién anota más?" title={`Ronda ${scorerRound+1} de 10`} score={scorerScore}/>
      <Card style={{marginBottom:T.space[3],textAlign:"center",padding:T.space[4]}}>
        <div style={{fontSize:T.font.sm,color:T.text.secondary}}>¿Quién promedia más puntos esta temporada?</div>
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:T.space[3]}}>
        {[p1,p2].map((p,i)=><button key={p.id} className="btn" onClick={()=>answerScorer(i)}
          style={{...optStyle(i===winnerIdx,scorerFeedback?.chosen===i,revealed),padding:T.space[5]}}>
          {logo(p.teamAbbr,36)}
          <div style={{fontSize:T.font.sm,fontWeight:600,color:T.text.primary,marginTop:T.space[2]}}>{p.name}</div>
          <div style={{fontSize:T.font.xs,color:T.text.tertiary}}>{p.teamAbbr} · {p.pos}</div>
          {revealed&&<div style={{fontSize:T.font.xl,fontWeight:700,color:T.text.primary,marginTop:T.space[2]}}>{p.pts}</div>}
        </button>)}
      </div>
      <Progress value={scorerRound} max={10}/>
      <ExitBtn/>
    </div>);
  }

  /* ═══ TRIVIA ═══ */
  if(screen==="game"&&game==="trivia"){
    if(triviaDone) return<Result title="Trivia NBA" score={triviaScore} suffix=" seguidas"
      verdict={triviaScore>=20?"Impresionante":triviaScore>=10?"Muy bien":triviaScore>=5?"Nada mal":"Sigue practicando"} onRetry={startTrivia}/>;
    const q=triviaSet[triviaQ]||triviaSet[0];
    if(!q) return null;
    const revealed=triviaFeedback!==null;
    return(<div className="fade-up">
            <GameHeader sub="Trivia NBA" title={`Racha: ${triviaScore}`} score={triviaScore} scoreLabel="seguidas"/>
      <Card style={{marginBottom:T.space[4],padding:T.space[5]}}>
        <div style={{fontSize:T.font.base,fontWeight:600,color:T.text.primary,lineHeight:1.5}}>{q.q}</div>
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:T.space[2]}}>
        {q.opts.map((opt,i)=><button key={i} className="btn" onClick={()=>answerTrivia(i)}
          style={optStyle(i===q.a,triviaFeedback?.chosen===i,revealed)}>{opt}</button>)}
      </div>
      {revealed&&!triviaFeedback.ok&&<div style={{textAlign:"center",marginTop:T.space[3],fontSize:T.font.sm,color:T.text.secondary}}>Era: {q.opts[q.a]}</div>}
      <Progress value={triviaQ} max={triviaSet.length||10}/>
      <ExitBtn/>
    </div>);
  }

  /* ═══ ADIVINA EL JUGADOR ═══ */
  if(screen==="game"&&game==="guess"){
    if(guessDone) return<Result title="Adivina el jugador" score={guessScore} suffix=" seguidas"
      verdict={guessScore>=15?"Los reconoces a todos":guessScore>=8?"Buen ojo":guessScore>=4?"Nada mal":"Ve más partidos"} onRetry={startGuess}/>;
    if(!guessQ) return null;
    const{correct,opts}=guessQ;
    const revealed=guessFeedback!==null;
    return(<div className="fade-up">
      <GameHeader sub="Adivina el jugador" title={`Racha: ${guessScore}`} score={guessScore} scoreLabel="seguidas"/>
      <Card style={{marginBottom:T.space[4],padding:T.space[5]}}>
        <div style={{...label,marginBottom:T.space[3]}}>Pistas</div>
        {correct.clues.map((clue,i)=>(
          <div key={i} style={{display:"flex",gap:T.space[3],alignItems:"flex-start",padding:`${T.space[2]}px 0`,borderBottom:i<correct.clues.length-1?`1px solid ${T.border.subtle}`:"none"}}>
            <span style={{color:T.text.tertiary,fontSize:T.font.xs,fontWeight:600,minWidth:14}}>{i+1}</span>
            <span style={{fontSize:T.font.sm,color:T.text.secondary,lineHeight:1.5}}>{clue}</span>
          </div>
        ))}
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:T.space[2]}}>
        {opts.map(p=><button key={p.name} className="btn" onClick={()=>answerGuess(p)}
          style={optStyle(p.name===correct.name,guessFeedback?.chosen===p.name,revealed)}>
          {revealed&&logo(p.team,22)}
          <div style={{marginTop:revealed?T.space[1]:0}}>{p.name}</div>
          {revealed&&<div style={{fontSize:T.font.xs,color:T.text.tertiary,marginTop:2}}>{p.team}</div>}
        </button>)}
      </div>
      <Progress value={guessRound} max={8}/>
      <ExitBtn/>
    </div>);
  }

  /* ═══ CAMPEONES ═══ */
  if(screen==="game"&&game==="champs"){
    if(champsDone) return<Result title="Campeones" score={champsScore} suffix=" seguidas"
      verdict={champsScore>=20?"Historiador de la NBA":champsScore>=10?"Buen conocimiento":champsScore>=5?"Nada mal":"A repasar"} onRetry={startChamps}/>;
    if(!champsQ) return null;
    const{correct,opts}=champsQ;
    const revealed=champsFeedback!==null;
    return(<div className="fade-up">
      <GameHeader sub="Campeones" title={`Racha: ${champsScore}`} score={champsScore} scoreLabel="seguidas"/>
      <Card style={{marginBottom:T.space[5],textAlign:"center",padding:T.space[6]}}>
        <div style={{...label,marginBottom:T.space[2]}}>¿Quién fue campeón en</div>
        <div style={{fontSize:T.font["3xl"],fontWeight:700,color:T.text.primary,letterSpacing:-1,lineHeight:1}}>{correct.year}</div>
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:T.space[2]}}>
        {opts.map(o=><button key={o.team+o.year} className="btn" onClick={()=>answerChamps(o.team)}
          style={optStyle(o.team===correct.team,champsFeedback?.chosen===o.team,revealed)}>
          {revealed&&logo(o.team,28)}
          <div style={{marginTop:revealed?T.space[1]:0}}>{o.label||tm(o.team).name||o.team}</div>
        </button>)}
      </div>
      <Progress value={champsRound} max={10}/>
      <ExitBtn/>
    </div>);
  }

  /* ═══ REACCIÓN ═══ */
  if(screen==="game"&&game==="react"){
    const avg=reactTimes.length?Math.round(reactTimes.reduce((a,b)=>a+b,0)/reactTimes.length):0;
    if(reactPhase==="done") return<Result title="Test de reacción"
      score={avg} suffix=" ms"
      verdict={avg<220?"Reflejos de campeón":avg<280?"Muy bien":avg<350?"Por encima del promedio":"Sigue practicando"}
      extra={<div style={{marginTop:T.space[4],display:"flex",gap:T.space[2],flexWrap:"wrap",justifyContent:"center"}}>
        {reactTimes.map((t,i)=><span key={i} style={{background:T.surface[2],border:`1px solid ${T.border.subtle}`,borderRadius:T.radius.sm,padding:`2px ${T.space[3]}px`,fontSize:T.font.xs,color:T.text.tertiary}}>{t} ms</span>)}
      </div>}
      onRetry={startReact}/>;

    const go=reactPhase==="go";
    const early=reactPhase==="early";
    return(<div className="fade-up">
      <GameHeader sub="Test de reacción" title={`Intento ${reactTimes.length+1} de 5`} score={avg||"—"} scoreLabel="ms promedio"/>
      <button className="btn" onClick={tapReact} style={{
        width:"100%", minHeight:220, borderRadius:T.radius.lg,
        background:go?T.success.subtle:early?T.danger.subtle:T.surface[2],
        border:`1px solid ${go?T.success.base:early?T.danger.base:T.border.base}`,
        display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:T.space[3],
        transition:"background .1s, border-color .1s", touchAction:"manipulation",
      }}>
        <div style={{fontSize:T.font.xl,fontWeight:700,color:go?T.success.base:early?T.danger.base:T.text.secondary}}>
          {go?"¡Toca ahora!":early?"Demasiado pronto":reactPhase==="tapped"?`${reactTimes[reactTimes.length-1]} ms`:"Espera…"}
        </div>
        {reactPhase==="waiting"&&<div style={{fontSize:T.font.sm,color:T.text.tertiary}}>No toques todavía</div>}
      </button>
      {reactTimes.length>0&&<div style={{display:"flex",gap:T.space[2],marginTop:T.space[3],flexWrap:"wrap",justifyContent:"center"}}>
        {reactTimes.map((t,i)=><span key={i} style={{background:T.surface[2],border:`1px solid ${T.border.subtle}`,borderRadius:T.radius.sm,padding:`2px ${T.space[3]}px`,fontSize:T.font.xs,color:T.text.tertiary}}>{t} ms</span>)}
      </div>}
      <ExitBtn onExit={()=>{clearTimeout(reactTimerRef.current);setScreen("menu");}}/>
    </div>);
  }

  /* ═══ MEMORIA ═══ */
  if(screen==="game"&&game==="memory"){
    if(memDone) return<Result title="Memoria" score={Math.max(0,100-Math.max(0,memMoves-8)*4)} suffix=" pts"
      verdict={`${memMoves} movimientos · ${memMoves<=8?"perfecto":memMoves<=14?"excelente":memMoves<=20?"bien":"lo lograste"}`}
      onRetry={startMemory}/>;
    return(<div className="fade-up">
      <GameHeader sub="Memoria" title={`${memMatched.length} de 8 parejas`} score={memMoves} scoreLabel="movimientos"/>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:T.space[2],marginBottom:T.space[4]}}>
        {memCards.map((card,idx)=>{
          const isFlipped=memFlipped.includes(idx);
          const isMatched=memMatched.includes(card.emoji);
          const shown=isFlipped||isMatched;
          return<button key={card.id} className="btn" onClick={()=>flipCard(idx)} style={{
            aspectRatio:"1", borderRadius:T.radius.base,
            background:isMatched?T.accent.subtle:T.surface[2],
            border:`1px solid ${isMatched?T.accent.base:shown?T.border.strong:T.border.subtle}`,
            fontSize:shown?26:T.font.base,
            color:T.text.disabled,
            display:"flex", alignItems:"center", justifyContent:"center",
            transition:"background .15s, border-color .15s",
            cursor:isMatched?"default":"pointer", opacity:isMatched?.65:1,
          }}>{shown?card.emoji:""}</button>;
        })}
      </div>
      <ExitBtn/>
    </div>);
  }

  /* ═══ BANDERAS ═══ */
  if(screen==="game"&&game==="flags"){
    if(flagDone) return<Result title="Banderas" score={flagScore} suffix="/10"
      verdict={flagScore===10?"Experto en geografía":flagScore>=7?"Muy buen conocimiento":flagScore>=5?"Pasable":"A repasar el mapa"}
      onRetry={startFlags}/>;
    if(!flagQ) return null;
    const revealed=flagFeedback!==null;
    return(<div className="fade-up">
      <GameHeader sub="Banderas" title={`Pregunta ${flagRound+1} de 10`} score={flagScore}/>
      <Card style={{textAlign:"center",padding:T.space[6],marginBottom:T.space[4]}}>
        <div style={{...label,marginBottom:T.space[4]}}>¿De qué país es esta bandera?</div>
        <div style={{fontSize:84,lineHeight:1}}>{flagQ.flag}</div>
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:T.space[2]}}>
        {flagQ.opts.map(opt=><button key={opt} className="btn" onClick={()=>answerFlag(opt)}
          style={optStyle(opt===flagQ.country,flagFeedback?.chosen===opt,revealed)}>{opt}</button>)}
      </div>
      <Progress value={flagRound} max={10}/>
      <ExitBtn/>
    </div>);
  }

  /* ═══ MATE RÁPIDO ═══ */
  if(screen==="game"&&game==="math"){
    if(mathDone) return<Result title="Mate rápido" score={mathScore} suffix="/10"
      verdict={mathScore===10?"Calculadora humana":mathScore>=7?"Muy rápido":mathScore>=5?"Buen intento":"Practica más"}
      onRetry={startMath}/>;
    if(!mathQ) return null;
    const revealed=mathFeedback!==null;
    return(<div className="fade-up">
      <GameHeader sub="Mate rápido" title={`Pregunta ${mathRound+1} de 10`} score={mathScore}/>
      <div style={{height:3,borderRadius:2,background:T.surface[3],overflow:"hidden",marginBottom:T.space[4]}}>
        <div style={{width:`${(mathTimer/5)*100}%`,height:"100%",background:mathTimer>1?T.accent.base:T.danger.base,transition:"width 1s linear"}}/>
      </div>
      <Card style={{textAlign:"center",padding:T.space[6],marginBottom:T.space[4]}}>
        <div style={{fontSize:T.font["2xl"],fontWeight:700,color:T.text.primary,letterSpacing:-0.8}}>{mathQ.q}</div>
        <div style={{fontSize:T.font.sm,color:T.text.tertiary,marginTop:T.space[2]}}>{mathTimer} s</div>
      </Card>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:T.space[2]}}>
        {mathQ.opts.map(opt=><button key={opt} className="btn" onClick={()=>answerMath(opt)}
          style={{...optStyle(opt===mathQ.ans,mathFeedback?.chosen===opt,revealed),fontSize:T.font.lg,fontWeight:700,padding:T.space[4]}}>{opt}</button>)}
      </div>
      <Progress value={mathRound} max={10}/>
      <ExitBtn/>
    </div>);
  }

  return null;
};
