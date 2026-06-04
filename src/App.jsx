import { useState, useEffect, useCallback } from "react";
import { initializeApp } from "firebase/app";
import {
  getFirestore, doc, setDoc, getDoc, onSnapshot, collection, getDocs
} from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const FLAG = {
  "México":"🇲🇽","Sudáfrica":"🇿🇦","Corea del Sur":"🇰🇷","Rep. Checa":"🇨🇿",
  "Canadá":"🇨🇦","Bosnia-Herzegovina":"🇧🇦","Catar":"🇶🇦","Suiza":"🇨🇭",
  "Brasil":"🇧🇷","Marruecos":"🇲🇦","Haití":"🇭🇹","Escocia":"🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "EE.UU.":"🇺🇸","Paraguay":"🇵🇾","Australia":"🇦🇺","Turquía":"🇹🇷",
  "Alemania":"🇩🇪","Curazao":"🇨🇼","Costa de Marfil":"🇨🇮","Ecuador":"🇪🇨",
  "Países Bajos":"🇳🇱","Japón":"🇯🇵","Suecia":"🇸🇪","Túnez":"🇹🇳",
  "España":"🇪🇸","Cabo Verde":"🇨🇻","Arabia Saudita":"🇸🇦","Uruguay":"🇺🇾",
  "Bélgica":"🇧🇪","Egipto":"🇪🇬","Irán":"🇮🇷","Nueva Zelanda":"🇳🇿",
  "Francia":"🇫🇷","Senegal":"🇸🇳","Iraq":"🇮🇶","Noruega":"🇳🇴",
  "Argentina":"🇦🇷","Argelia":"🇩🇿","Austria":"🇦🇹","Jordania":"🇯🇴",
  "Portugal":"🇵🇹","Colombia":"🇨🇴","Uzbekistán":"🇺🇿","Congo RD":"🇨🇩",
  "Inglaterra":"🏴󠁧󠁢󠁥󠁮󠁧󠁿","Croacia":"🇭🇷","Ghana":"🇬🇭","Panamá":"🇵🇦",
};

const MATCHES = [
  {id:1,home:"México",away:"Sudáfrica",date:"2026-06-11T14:00",group:"A"},
  {id:2,home:"Corea del Sur",away:"Rep. Checa",date:"2026-06-11T21:00",group:"A"},
  {id:3,home:"Rep. Checa",away:"Sudáfrica",date:"2026-06-18T11:00",group:"A"},
  {id:4,home:"México",away:"Corea del Sur",date:"2026-06-18T20:00",group:"A"},
  {id:5,home:"Rep. Checa",away:"México",date:"2026-06-24T20:00",group:"A"},
  {id:6,home:"Sudáfrica",away:"Corea del Sur",date:"2026-06-24T20:00",group:"A"},
  {id:7,home:"Canadá",away:"Bosnia-Herzegovina",date:"2026-06-12T14:00",group:"B"},
  {id:8,home:"Catar",away:"Suiza",date:"2026-06-13T14:00",group:"B"},
  {id:9,home:"Suiza",away:"Bosnia-Herzegovina",date:"2026-06-18T14:00",group:"B"},
  {id:10,home:"Canadá",away:"Catar",date:"2026-06-18T17:00",group:"B"},
  {id:11,home:"Suiza",away:"Canadá",date:"2026-06-24T14:00",group:"B"},
  {id:12,home:"Bosnia-Herzegovina",away:"Catar",date:"2026-06-24T14:00",group:"B"},
  {id:13,home:"Brasil",away:"Marruecos",date:"2026-06-13T17:00",group:"C"},
  {id:14,home:"Haití",away:"Escocia",date:"2026-06-13T20:00",group:"C"},
  {id:15,home:"Escocia",away:"Marruecos",date:"2026-06-19T17:00",group:"C"},
  {id:16,home:"Brasil",away:"Haití",date:"2026-06-19T20:00",group:"C"},
  {id:17,home:"Marruecos",away:"Haití",date:"2026-06-24T17:00",group:"C"},
  {id:18,home:"Escocia",away:"Brasil",date:"2026-06-24T17:00",group:"C"},
  {id:19,home:"EE.UU.",away:"Paraguay",date:"2026-06-12T20:00",group:"D"},
  {id:20,home:"Australia",away:"Turquía",date:"2026-06-13T23:00",group:"D"},
  {id:21,home:"EE.UU.",away:"Australia",date:"2026-06-19T14:00",group:"D"},
  {id:22,home:"Turquía",away:"Paraguay",date:"2026-06-19T23:00",group:"D"},
  {id:23,home:"Turquía",away:"EE.UU.",date:"2026-06-25T21:00",group:"D"},
  {id:24,home:"Paraguay",away:"Australia",date:"2026-06-25T21:00",group:"D"},
  {id:25,home:"Alemania",away:"Curazao",date:"2026-06-14T12:00",group:"E"},
  {id:26,home:"Costa de Marfil",away:"Ecuador",date:"2026-06-14T18:00",group:"E"},
  {id:27,home:"Alemania",away:"Costa de Marfil",date:"2026-06-20T15:00",group:"E"},
  {id:28,home:"Ecuador",away:"Curazao",date:"2026-06-20T19:00",group:"E"},
  {id:29,home:"Ecuador",away:"Alemania",date:"2026-06-25T15:00",group:"E"},
  {id:30,home:"Curazao",away:"Costa de Marfil",date:"2026-06-25T15:00",group:"E"},
  {id:31,home:"Países Bajos",away:"Japón",date:"2026-06-14T15:00",group:"F"},
  {id:32,home:"Suecia",away:"Túnez",date:"2026-06-14T21:00",group:"F"},
  {id:33,home:"Países Bajos",away:"Suecia",date:"2026-06-20T12:00",group:"F"},
  {id:34,home:"Túnez",away:"Japón",date:"2026-06-20T23:00",group:"F"},
  {id:35,home:"Túnez",away:"Países Bajos",date:"2026-06-25T18:00",group:"F"},
  {id:36,home:"Japón",away:"Suecia",date:"2026-06-25T18:00",group:"F"},
  {id:37,home:"España",away:"Cabo Verde",date:"2026-06-15T11:00",group:"G"},
  {id:38,home:"Arabia Saudita",away:"Uruguay",date:"2026-06-15T17:00",group:"G"},
  {id:39,home:"España",away:"Arabia Saudita",date:"2026-06-21T11:00",group:"G"},
  {id:40,home:"Uruguay",away:"Cabo Verde",date:"2026-06-21T17:00",group:"G"},
  {id:41,home:"Uruguay",away:"España",date:"2026-06-26T19:00",group:"G"},
  {id:42,home:"Cabo Verde",away:"Arabia Saudita",date:"2026-06-26T19:00",group:"G"},
  {id:43,home:"Bélgica",away:"Egipto",date:"2026-06-15T14:00",group:"H"},
  {id:44,home:"Irán",away:"Nueva Zelanda",date:"2026-06-15T20:00",group:"H"},
  {id:45,home:"Bélgica",away:"Irán",date:"2026-06-21T14:00",group:"H"},
  {id:46,home:"Nueva Zelanda",away:"Egipto",date:"2026-06-21T20:00",group:"H"},
  {id:47,home:"Nueva Zelanda",away:"Bélgica",date:"2026-06-26T22:00",group:"H"},
  {id:48,home:"Egipto",away:"Irán",date:"2026-06-26T22:00",group:"H"},
  {id:49,home:"Francia",away:"Senegal",date:"2026-06-16T14:00",group:"I"},
  {id:50,home:"Iraq",away:"Noruega",date:"2026-06-16T17:00",group:"I"},
  {id:51,home:"Francia",away:"Iraq",date:"2026-06-22T15:00",group:"I"},
  {id:52,home:"Noruega",away:"Senegal",date:"2026-06-22T19:00",group:"I"},
  {id:53,home:"Noruega",away:"Francia",date:"2026-06-26T14:00",group:"I"},
  {id:54,home:"Senegal",away:"Iraq",date:"2026-06-26T14:00",group:"I"},
  {id:55,home:"Argentina",away:"Argelia",date:"2026-06-16T20:00",group:"J"},
  {id:56,home:"Austria",away:"Jordania",date:"2026-06-16T23:00",group:"J"},
  {id:57,home:"Argentina",away:"Austria",date:"2026-06-22T12:00",group:"J"},
  {id:58,home:"Jordania",away:"Argelia",date:"2026-06-22T23:00",group:"J"},
  {id:59,home:"Jordania",away:"Argentina",date:"2026-06-27T21:00",group:"J"},
  {id:60,home:"Argelia",away:"Austria",date:"2026-06-27T21:00",group:"J"},
  {id:61,home:"Portugal",away:"Congo RD",date:"2026-06-17T12:00",group:"K"},
  {id:62,home:"Uzbekistán",away:"Colombia",date:"2026-06-17T21:00",group:"K"},
  {id:63,home:"Portugal",away:"Uzbekistán",date:"2026-06-23T12:00",group:"K"},
  {id:64,home:"Colombia",away:"Congo RD",date:"2026-06-23T21:00",group:"K"},
  {id:65,home:"Colombia",away:"Portugal",date:"2026-06-27T18:30",group:"K"},
  {id:66,home:"Congo RD",away:"Uzbekistán",date:"2026-06-27T18:30",group:"K"},
  {id:67,home:"Inglaterra",away:"Croacia",date:"2026-06-17T15:00",group:"L"},
  {id:68,home:"Ghana",away:"Panamá",date:"2026-06-17T18:00",group:"L"},
  {id:69,home:"Inglaterra",away:"Ghana",date:"2026-06-23T15:00",group:"L"},
  {id:70,home:"Panamá",away:"Croacia",date:"2026-06-23T18:00",group:"L"},
  {id:71,home:"Panamá",away:"Inglaterra",date:"2026-06-27T16:00",group:"L"},
  {id:72,home:"Croacia",away:"Ghana",date:"2026-06-27T16:00",group:"L"},
];

const DEADLINE_MIN=15;
function getDeadline(d){const dt=new Date(d);dt.setMinutes(dt.getMinutes()-DEADLINE_MIN);return dt;}
function isPastDeadline(d){return new Date()>getDeadline(d);}
function calcPts(pred,result){
  if(!pred||pred.home===""||pred.away==="")return null;
  if(!result||result.home===""||result.home===undefined)return null;
  const ph=+pred.home,pa=+pred.away,rh=+result.home,ra=+result.away;
  if(ph===rh&&pa===ra)return 3;
  const pw=ph>pa?"H":ph<pa?"A":"D",rw=rh>ra?"H":rh<ra?"A":"D";
  return pw===rw?1:0;
}

async function loadUsers(){try{const s=await getDoc(doc(db,"polla","users"));return s.exists()?s.data():{};}catch{return{};}}
async function saveUsers(u){try{await setDoc(doc(db,"polla","users"),u);}catch(e){console.error(e);}}
async function loadResults(){try{const s=await getDoc(doc(db,"polla","results"));return s.exists()?s.data():{};}catch{return{};}}
async function saveResults(r){try{await setDoc(doc(db,"polla","results"),r);}catch(e){console.error(e);}}
async function savePrediction(username,matchId,pred){try{await setDoc(doc(db,"predictions",username),{[String(matchId)]:pred},{merge:true});}catch(e){console.error(e);}}
async function loadAllPredictions(){
  try{
    const snap=await getDocs(collection(db,"predictions"));
    const reshaped={};
    snap.forEach(d=>{
      Object.entries(d.data()).forEach(([matchId,pred])=>{
        if(!reshaped[matchId])reshaped[matchId]={};
        reshaped[matchId][d.id]=pred;
      });
    });
    return reshaped;
  }catch{return{};}
}

function ScoreInput({value,onChange,disabled}){
  return <input type="number" min="0" max="30" value={value} onChange={e=>onChange(e.target.value)} disabled={disabled} style={{width:46,height:46,textAlign:"center",fontSize:"1.3rem",fontWeight:900,background:disabled?"rgba(255,255,255,0.04)":"rgba(255,255,255,0.13)",border:`2px solid ${disabled?"rgba(255,255,255,0.08)":"rgba(250,204,21,0.5)"}`,borderRadius:8,color:disabled?"#666":"#fff",outline:"none",cursor:disabled?"not-allowed":"text",fontFamily:"inherit"}}/>;
}

function MatchCard({match,userPred,officialResult,onSave,onSetResult,isAdmin}){
  const[home,setHome]=useState(userPred?.home??"");
  const[away,setAway]=useState(userPred?.away??"");
  const[rH,setRH]=useState(officialResult?.home??"");
  const[rA,setRA]=useState(officialResult?.away??"");
  const[saving,setSaving]=useState(false);
  useEffect(()=>{setHome(userPred?.home??"");setAway(userPred?.away??"");},[userPred]);
  const locked=isPastDeadline(match.date);
  const pts=calcPts({home,away},officialResult);
  const hasPred=home!==""&&away!=="";
  const hasResult=officialResult?.home!==undefined&&officialResult?.home!=="";
  const isColombia=match.home==="Colombia"||match.away==="Colombia";
  const dateStr=new Date(match.date).toLocaleString("es-CO",{weekday:"short",day:"numeric",month:"short",hour:"2-digit",minute:"2-digit"});
  const deadlineStr=getDeadline(match.date).toLocaleTimeString("es-CO",{hour:"2-digit",minute:"2-digit"});
  const ptColor=pts===3?"#4ade80":pts===1?"#facc15":pts===0?"#f87171":"#aaa";
  async function save(){if(!hasPred||locked)return;setSaving(true);await onSave(match.id,{home,away});setSaving(false);}
  return(
    <div style={{background:isColombia?"linear-gradient(135deg,rgba(250,204,21,0.12),rgba(255,255,255,0.04))":"linear-gradient(135deg,rgba(255,255,255,0.06),rgba(255,255,255,0.02))",border:isColombia?"1px solid rgba(250,204,21,0.35)":locked?"1px solid rgba(255,255,255,0.06)":"1px solid rgba(250,204,21,0.2)",borderRadius:14,padding:"16px 18px",position:"relative"}}>
      {isColombia&&<div style={{position:"absolute",top:10,left:14,fontSize:"0.6rem",fontWeight:900,color:"#facc15",letterSpacing:2,background:"rgba(250,204,21,0.15)",padding:"2px 8px",borderRadius:20}}>🇨🇴 COLOMBIA</div>}
      <span style={{position:"absolute",top:isColombia?32:10,right:12,fontSize:"0.6rem",color:"#facc15",fontWeight:700,letterSpacing:2,background:"rgba(250,204,21,0.1)",padding:"2px 8px",borderRadius:20}}>GRP {match.group}</span>
      <div style={{fontSize:"0.7rem",color:"#666",marginBottom:10,marginTop:isColombia?16:4}}>{dateStr} · Cierre {deadlineStr}{locked&&<span style={{color:"#f87171",marginLeft:6}}>🔒</span>}</div>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{flex:1,textAlign:"right",fontSize:"0.93rem",fontWeight:700,color:"#fff"}}>{FLAG[match.home]} {match.home}</div>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <ScoreInput value={home} onChange={setHome} disabled={locked}/>
          <span style={{color:"#444",fontWeight:900,fontSize:"1.1rem"}}>–</span>
          <ScoreInput value={away} onChange={setAway} disabled={locked}/>
        </div>
        <div style={{flex:1,fontSize:"0.93rem",fontWeight:700,color:"#fff"}}>{FLAG[match.away]} {match.away}</div>
      </div>
      {hasResult&&<div style={{textAlign:"center",marginTop:8,fontSize:"0.78rem",color:"#888"}}>Resultado: <span style={{fontWeight:900,color:"#fff"}}>{officialResult.home}–{officialResult.away}</span>{pts!==null&&<span style={{marginLeft:8,fontWeight:900,color:ptColor}}>{pts===3?"🎯 +3":pts===1?"✅ +1":"❌ 0"}</span>}</div>}
      {!locked&&<button onClick={save} disabled={saving||!hasPred} style={{marginTop:12,width:"100%",padding:"9px 0",background:hasPred?"linear-gradient(90deg,#facc15,#f59e0b)":"rgba(255,255,255,0.05)",color:hasPred?"#111":"#444",border:"none",borderRadius:8,fontWeight:900,fontSize:"0.8rem",letterSpacing:1,cursor:hasPred?"pointer":"not-allowed"}}>{saving?"Guardando...":"GUARDAR PRONÓSTICO"}</button>}
      {isAdmin&&<div style={{marginTop:10,paddingTop:10,borderTop:"1px solid rgba(255,255,255,0.07)",display:"flex",alignItems:"center",gap:6}}><span style={{fontSize:"0.62rem",color:"#facc15",fontWeight:700}}>ADMIN:</span><ScoreInput value={rH} onChange={setRH} disabled={false}/><span style={{color:"#444"}}>–</span><ScoreInput value={rA} onChange={setRA} disabled={false}/><button onClick={()=>onSetResult(match.id,{home:rH,away:rA})} style={{padding:"5px 12px",background:"#facc15",border:"none",borderRadius:6,fontWeight:900,fontSize:"0.7rem",cursor:"pointer",color:"#111"}}>SET</button></div>}
    </div>
  );
}

function RulesPanel(){
  return(
    <div style={{background:"linear-gradient(135deg,rgba(250,204,21,0.08),rgba(255,255,255,0.03))",border:"1px solid rgba(250,204,21,0.2)",borderRadius:16,padding:"20px 22px",marginBottom:20}}>
      <div style={{fontFamily:"Impact,sans-serif",letterSpacing:3,color:"#facc15",fontSize:"1.1rem",marginBottom:14}}>📋 REGLAS DE LA POLLA</div>
      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {[["🎯","Marcador exacto","3 puntos — adivinas el resultado exacto (ej: 2-1)","#4ade80"],["✅","Ganador correcto","1 punto — aciertas quién gana o que es empate","#facc15"],["❌","Cualquier otro caso","0 puntos","#f87171"],["⏱️","Cierre de pronósticos","15 minutos antes del inicio de cada partido","#aaa"],["⚽","Tiempo de juego","Solo se cuentan goles en 90 minutos reglamentarios (no prórrogas ni penales)","#aaa"],["🏆","Ganador","El primero en la tabla general al finalizar el torneo","#facc15"]].map(([icon,title,desc,color])=>(
          <div key={title} style={{display:"flex",gap:12,alignItems:"flex-start"}}>
            <span style={{fontSize:"1.1rem",flexShrink:0,marginTop:1}}>{icon}</span>
            <div><span style={{fontWeight:700,color,fontSize:"0.85rem"}}>{title}:</span><span style={{color:"#888",fontSize:"0.82rem",marginLeft:6}}>{desc}</span></div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Mundial2026(){
  const[screen,setScreen]=useState("login");
  const[username,setUsername]=useState("");
  const[inputUser,setInputUser]=useState("");
  const[inputPass,setInputPass]=useState("");
  const[registerMode,setRegisterMode]=useState(true);
  const[authErr,setAuthErr]=useState("");
  const[users,setUsers]=useState({});
  const[predictions,setPredictions]=useState({});
  const[results,setResults]=useState({});
  const[tab,setTab]=useState("matches");
  const[groupFilter,setGroupFilter]=useState("K");
  const[loaded,setLoaded]=useState(false);
  const[toast,setToast]=useState("");
  const[showRules,setShowRules]=useState(false);

  useEffect(()=>{
    (async()=>{
      const[u,r,p]=await Promise.all([loadUsers(),loadResults(),loadAllPredictions()]);
      setUsers(u);setResults(r);setPredictions(p);setLoaded(true);
    })();
    const unsub=onSnapshot(doc(db,"polla","results"),snap=>{if(snap.exists())setResults(snap.data());});
    return unsub;
  },[]);

  const isAdmin=users[username]?.isAdmin===true;
  function showToast(msg){setToast(msg);setTimeout(()=>setToast(""),2500);}

  async function handleLogin(){
    setAuthErr("");
    const name=inputUser.trim();
    if(!name)return setAuthErr("Ingresa tu usuario.");
    const u=users[name];
    if(!u)return setAuthErr("Usuario no encontrado. ¿Quieres registrarte?");
    if(u.password!==inputPass)return setAuthErr("Contraseña incorrecta.");
    const allPreds=await loadAllPredictions();
    setPredictions(allPreds);
    setUsername(name);setScreen("app");
  }

  async function handleRegister(){
    setAuthErr("");
    const name=inputUser.trim();
    if(name.length<2)return setAuthErr("Nombre muy corto (mín 2 caracteres).");
    const freshUsers=await loadUsers();
    if(freshUsers[name])return setAuthErr("Ese usuario ya existe.");
    if(inputPass.length<4)return setAuthErr("Contraseña muy corta (mín 4 caracteres).");
    const isFirst=Object.keys(freshUsers).length===0;
    const nu={...freshUsers,[name]:{password:inputPass,isAdmin:isFirst}};
    await saveUsers(nu);setUsers(nu);setUsername(name);setScreen("app");
  }

  async function savePred(matchId,pred){
    const key=String(matchId);
    await savePrediction(username,matchId,pred);
    setPredictions(prev=>({...prev,[key]:{...(prev[key]||{}),[username]:pred}}));
    showToast("✅ Pronóstico guardado");
  }

  async function setResult(matchId,res){
    const key=String(matchId);
    const updated={...results,[key]:res};
    await saveResults(updated);setResults(updated);showToast("✅ Resultado guardado");
  }

  const leaderboard=Object.keys(users).map(user=>{
    let pts=0,exact=0,winner=0;
    MATCHES.forEach(m=>{const p=calcPts(predictions[String(m.id)]?.[user],results[String(m.id)]);if(p===3){pts+=3;exact++;}else if(p===1){pts+=1;winner++;}});
    return{user,pts,exact,winner};
  }).sort((a,b)=>b.pts-a.pts||b.exact-a.exact);

  const allGroups=["A","B","C","D","E","F","G","H","I","J","K","L"];
  const displayMatches=groupFilter==="ALL"?MATCHES:MATCHES.filter(m=>m.group===groupFilter);

  if(!loaded)return(
    <div style={{minHeight:"100vh",background:"#090909",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:16}}>
      <div style={{fontSize:"3rem",animation:"spin 1s linear infinite"}}>⚽</div>
      <div style={{color:"#facc15",fontFamily:"Impact,sans-serif",letterSpacing:4,fontSize:"1.2rem"}}>CARGANDO...</div>
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if(screen==="login")return(
    <div style={{minHeight:"100vh",background:"radial-gradient(ellipse 80% 50% at 50% -5%,#1a1100 0%,#090909 65%)",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",fontFamily:"'Segoe UI',system-ui,sans-serif",padding:20}}>
      <div style={{textAlign:"center",marginBottom:32}}>
        <div style={{fontSize:"4rem",lineHeight:1,fontFamily:"Impact,sans-serif",letterSpacing:4,color:"#facc15",textShadow:"0 0 60px rgba(250,204,21,0.35)"}}>⚽ LA POLLA</div>
        <div style={{color:"#444",letterSpacing:8,fontSize:"0.78rem",marginTop:6}}>MUNDIAL 2026</div>
        <div style={{color:"#555",fontSize:"0.72rem",marginTop:6,letterSpacing:2}}>🇨🇴 🇲🇽 🇺🇸 🇨🇦</div>
      </div>
      <div style={{width:"100%",maxWidth:400,marginBottom:16}}>
        <button onClick={()=>setShowRules(r=>!r)} style={{width:"100%",padding:"10px 0",background:"rgba(250,204,21,0.08)",border:"1px solid rgba(250,204,21,0.2)",borderRadius:10,cursor:"pointer",color:"#facc15",fontWeight:700,fontSize:"0.8rem",letterSpacing:1}}>
          {showRules?"▲ OCULTAR REGLAS":"▼ VER REGLAS DE LA POLLA"}
        </button>
        {showRules&&<div style={{marginTop:8}}><RulesPanel/></div>}
      </div>
      <div style={{width:"100%",maxWidth:400,background:"rgba(255,255,255,0.04)",border:"1px solid rgba(250,204,21,0.18)",borderRadius:20,padding:26}}>
        <div style={{display:"flex",gap:6,marginBottom:20}}>
          {["Registrarse","Iniciar sesión"].map((t,i)=>(
            <button key={t} onClick={()=>{setRegisterMode(i===0);setAuthErr("");}} style={{flex:1,padding:"9px 0",background:(registerMode?i===0:i===1)?"#facc15":"transparent",border:"1px solid rgba(250,204,21,0.22)",borderRadius:8,cursor:"pointer",fontWeight:700,color:(registerMode?i===0:i===1)?"#111":"#666",fontSize:"0.82rem"}}>{t}</button>
          ))}
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <input placeholder="Tu apodo / nombre" value={inputUser} onChange={e=>setInputUser(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(registerMode?handleRegister():handleLogin())} style={{padding:"12px 14px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"#fff",fontSize:"0.9rem",outline:"none",width:"100%",boxSizing:"border-box",fontFamily:"inherit"}}/>
          <input type="password" placeholder="Contraseña (mín 4 caracteres)" value={inputPass} onChange={e=>setInputPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&(registerMode?handleRegister():handleLogin())} style={{padding:"12px 14px",background:"rgba(255,255,255,0.05)",border:"1px solid rgba(255,255,255,0.08)",borderRadius:10,color:"#fff",fontSize:"0.9rem",outline:"none",width:"100%",boxSizing:"border-box",fontFamily:"inherit"}}/>
          {authErr&&<div style={{color:"#f87171",fontSize:"0.78rem",textAlign:"center"}}>{authErr}</div>}
          <button onClick={registerMode?handleRegister:handleLogin} style={{padding:"13px 0",background:"linear-gradient(90deg,#facc15,#f59e0b)",border:"none",borderRadius:10,fontWeight:900,fontSize:"0.95rem",cursor:"pointer",color:"#111",letterSpacing:1,marginTop:4}}>{registerMode?"UNIRME A LA POLLA":"ENTRAR"}</button>
        </div>
        <div style={{marginTop:16,fontSize:"0.68rem",color:"#3a3a3a",textAlign:"center",lineHeight:1.8}}>🎯 Exacto = 3 pts · ✅ Ganador = 1 pt · ❌ Otro = 0 pts<br/>Cierra 15 min antes · Solo 90 minutos</div>
      </div>
    </div>
  );

  return(
    <div style={{minHeight:"100vh",background:"#090909",color:"#fff",fontFamily:"'Segoe UI',system-ui,sans-serif",paddingBottom:90}}>
      {toast&&<div style={{position:"fixed",top:14,left:"50%",transform:"translateX(-50%)",background:"#111",border:"1px solid rgba(250,204,21,0.4)",borderRadius:12,padding:"10px 20px",color:"#facc15",fontWeight:700,fontSize:"0.82rem",zIndex:999,boxShadow:"0 4px 20px rgba(0,0,0,0.6)"}}>{toast}</div>}
      <div style={{background:"#0d0c08",borderBottom:"1px solid rgba(250,204,21,0.1)",padding:"12px 16px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100}}>
        <div>
          <div style={{fontSize:"1.1rem",fontFamily:"Impact,sans-serif",letterSpacing:3,color:"#facc15"}}>⚽ LA POLLA</div>
          <div style={{fontSize:"0.55rem",color:"#333",letterSpacing:5}}>MUNDIAL 2026</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:"0.75rem"}}>👤 <span style={{fontWeight:700,color:isAdmin?"#facc15":"#fff"}}>{username}</span>{isAdmin&&<span style={{fontSize:"0.58rem",color:"#facc15",marginLeft:3}}>admin</span>}</span>
          <button onClick={()=>{setScreen("login");setUsername("");setInputUser("");setInputPass("");}} style={{background:"transparent",border:"1px solid rgba(255,255,255,0.07)",borderRadius:6,color:"#444",padding:"4px 10px",cursor:"pointer",fontSize:"0.68rem"}}>Salir</button>
        </div>
      </div>
      <div style={{display:"flex",padding:"10px 12px",gap:6,borderBottom:"1px solid rgba(255,255,255,0.05)",overflowX:"auto"}}>
        {[["matches","Partidos"],["table","Tabla"],["rules","Reglas"],...(isAdmin?[["admin","⚙️ Admin"]]:[])].map(([k,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{padding:"7px 15px",borderRadius:30,whiteSpace:"nowrap",background:tab===k?"#facc15":"rgba(255,255,255,0.05)",color:tab===k?"#111":"#666",border:"none",cursor:"pointer",fontWeight:700,fontSize:"0.78rem",flexShrink:0}}>{l}</button>
        ))}
      </div>
      <div style={{maxWidth:680,margin:"0 auto",padding:"14px 12px"}}>
        {tab==="matches"&&<>
          <div style={{display:"flex",gap:5,flexWrap:"wrap",marginBottom:14}}>
            <button onClick={()=>setGroupFilter("ALL")} style={{padding:"5px 11px",borderRadius:20,fontSize:"0.7rem",fontWeight:700,background:groupFilter==="ALL"?"#facc15":"rgba(255,255,255,0.05)",color:groupFilter==="ALL"?"#111":"#555",border:"none",cursor:"pointer"}}>Todos</button>
            {allGroups.map(g=>(
              <button key={g} onClick={()=>setGroupFilter(g)} style={{padding:"5px 11px",borderRadius:20,fontSize:"0.7rem",fontWeight:700,background:groupFilter===g?"#facc15":"rgba(255,255,255,0.05)",color:groupFilter===g?"#111":"#555",border:"none",cursor:"pointer"}}>Grupo {g}</button>
            ))}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {displayMatches.map(m=><MatchCard key={m.id} match={m} userPred={predictions[String(m.id)]?.[username]} officialResult={results[String(m.id)]} onSave={savePred} onSetResult={setResult} isAdmin={isAdmin}/>)}
          </div>
        </>}
        {tab==="table"&&<>
          <h2 style={{fontFamily:"Impact,sans-serif",letterSpacing:3,color:"#facc15",fontSize:"1.5rem",marginBottom:16}}>TABLA GENERAL</h2>
          {leaderboard.length===0?<div style={{color:"#333",textAlign:"center",paddingTop:40}}>Nadie ha registrado pronósticos aún.</div>:
          <div style={{display:"flex",flexDirection:"column",gap:8}}>
            {leaderboard.map((row,i)=>{
              const medals=["🥇","🥈","🥉"];const isMe=row.user===username;
              return(<div key={row.user} style={{display:"flex",alignItems:"center",gap:14,background:isMe?"rgba(250,204,21,0.1)":"rgba(255,255,255,0.04)",border:isMe?"1px solid rgba(250,204,21,0.35)":"1px solid rgba(255,255,255,0.05)",borderRadius:12,padding:"14px 16px"}}>
                <div style={{fontSize:"1.2rem",width:28,textAlign:"center"}}>{medals[i]??`${i+1}`}</div>
                <div style={{flex:1}}><div style={{fontWeight:700,color:isMe?"#facc15":"#fff"}}>{row.user}</div><div style={{fontSize:"0.66rem",color:"#444",marginTop:1}}>🎯 {row.exact} exactos · ✅ {row.winner} ganadores</div></div>
                <div style={{fontSize:"1.6rem",fontWeight:900,fontFamily:"Impact,sans-serif",color:i===0?"#facc15":"#fff"}}>{row.pts}</div>
                <div style={{fontSize:"0.62rem",color:"#333"}}>pts</div>
              </div>);
            })}
          </div>}
        </>}
        {tab==="rules"&&<>
          <h2 style={{fontFamily:"Impact,sans-serif",letterSpacing:3,color:"#facc15",fontSize:"1.5rem",marginBottom:16}}>REGLAS</h2>
          <RulesPanel/>
          <div style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",borderRadius:12,padding:"16px 18px",fontSize:"0.78rem",color:"#555",lineHeight:2}}>
            <strong style={{color:"#666",display:"block",marginBottom:6}}>📌 Información adicional</strong>
            El torneo corre del 11 de junio al 19 de julio de 2026.<br/>
            Hay 72 partidos en fase de grupos (12 grupos × 6 partidos).<br/>
            Los pronósticos se bloquean automáticamente 15 min antes de cada partido.<br/>
            Los resultados son ingresados por el administrador de la polla.<br/>
            Los puntos se actualizan en tiempo real para todos los participantes.<br/>
            <strong style={{color:"#facc15"}}>🇨🇴 Colombia juega: Jun 17, Jun 23 y Jun 27</strong>
          </div>
        </>}
        {tab==="admin"&&isAdmin&&<>
          <h2 style={{fontFamily:"Impact,sans-serif",letterSpacing:3,color:"#facc15",fontSize:"1.5rem",marginBottom:8}}>ADMIN — RESULTADOS</h2>
          <p style={{color:"#444",fontSize:"0.76rem",marginBottom:16}}>Ingresa resultados oficiales (solo 90 min). Los puntos se actualizan para todos.</p>
          <div style={{display:"flex",flexDirection:"column",gap:10}}>
            {MATCHES.map(m=><MatchCard key={m.id} match={m} userPred={predictions[String(m.id)]?.[username]} officialResult={results[String(m.id)]} onSave={savePred} onSetResult={setResult} isAdmin={true}/>)}
          </div>
          <div style={{marginTop:20}}>
            <h3 style={{color:"#facc15",marginBottom:10,fontFamily:"Impact,sans-serif",letterSpacing:2,fontSize:"1rem"}}>PARTICIPANTES ({Object.keys(users).length})</h3>
            {Object.keys(users).map(u=><div key={u} style={{display:"flex",justifyContent:"space-between",padding:"9px 14px",background:"rgba(255,255,255,0.04)",borderRadius:8,marginBottom:4,fontSize:"0.8rem"}}><span>{u}</span><span style={{color:"#444"}}>{users[u].isAdmin?"🔑 Admin":"Participante"}</span></div>)}
          </div>
        </>}
      </div>
      <div style={{position:"fixed",bottom:0,left:0,right:0,background:"#0d0c08",borderTop:"1px solid rgba(255,255,255,0.06)",display:"flex",padding:"10px 0 20px"}}>
        {[["matches","⚽","Partidos"],["table","🏆","Tabla"],["rules","📋","Reglas"],...(isAdmin?[["admin","⚙️","Admin"]]:[])].map(([k,ic,l])=>(
          <button key={k} onClick={()=>setTab(k)} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",gap:2,background:"none",border:"none",cursor:"pointer",color:tab===k?"#facc15":"#2a2a2a"}}>
            <span style={{fontSize:"1.15rem"}}>{ic}</span>
            <span style={{fontSize:"0.6rem",fontWeight:600}}>{l}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
