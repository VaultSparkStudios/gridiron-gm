import React from "react";
import ReactDOM from "react-dom/client";
import GridironGM from "./App.jsx";
import { applyTheme, getTheme } from "./theme.js";
import { errorDetails } from "./Boundary.jsx";

// Light or dark before the first paint, so there's no flash.
applyTheme(getTheme());

// Last line of defense: shows what went wrong and ways back into the game.
class ErrorBoundary extends React.Component{
  constructor(p){super(p);this.state={err:null,info:null};}
  static getDerivedStateFromError(e){return{err:e};}
  componentDidCatch(e,i){console.error("GridironGM crash:",e,i);this.setState({info:i});}
  render(){
    if(this.state.err){
      const details=errorDetails(this.state.err,this.state.info);
      let backup=null;try{backup=localStorage.getItem("gm_backup")?localStorage.getItem("gm_backup_label")||"earlier this season":null;}catch{}
      const btn={border:"none",borderRadius:6,padding:"8px 16px",fontWeight:700,fontSize:13,cursor:"pointer"};
      return(
      <div style={{background:"#0f172a",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Segoe UI',system-ui,sans-serif",padding:24}}>
        <div style={{background:"#111827",border:"1px solid #ef4444",borderRadius:12,padding:24,maxWidth:520,width:"100%",textAlign:"center",color:"#e2e8f0"}}>
          <div style={{fontSize:32,marginBottom:8}}>🏈</div>
          <div style={{fontSize:16,fontWeight:800,color:"#ef4444",marginBottom:6}}>Something went wrong</div>
          <div style={{fontSize:13,color:"#94a3b8",marginBottom:12}}>Your save is safe. Try reloading{backup?`, or restore the backup from ${backup}`:""}.</div>
          <pre style={{fontSize:11,textAlign:"left",background:"#0b1220",border:"1px solid #1e293b",borderRadius:8,padding:10,whiteSpace:"pre-wrap",wordBreak:"break-word",color:"#fca5a5",maxHeight:150,overflow:"auto"}}>{details}</pre>
          <div style={{display:"flex",gap:8,justifyContent:"center",flexWrap:"wrap",marginTop:12}}>
            <button onClick={()=>window.location.reload()} style={{...btn,background:"#22c55e",color:"#fff"}}>Reload game</button>
            {backup&&<button onClick={()=>{if(!window.confirm(`Go back to your backup from ${backup}? Progress since then is lost.`))return;try{localStorage.setItem("gm_autosave",localStorage.getItem("gm_backup"));}catch{}window.location.reload();}} style={{...btn,background:"#1e3a5f",color:"#7dd3fc"}}>Restore backup</button>}
            <button onClick={()=>navigator.clipboard?.writeText(details)} style={{...btn,background:"#1e293b",color:"#e2e8f0"}}>Copy details</button>
          </div>
        </div>
      </div>
    );}
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ErrorBoundary>
      <GridironGM />
    </ErrorBoundary>
  </React.StrictMode>
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/gridiron-gm/sw.js').catch(() => {});
  });
}
