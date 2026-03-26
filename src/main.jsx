import React from "react";
import ReactDOM from "react-dom/client";
import GridironGM from "./App.jsx";

class ErrorBoundary extends React.Component{
  constructor(p){super(p);this.state={err:null};}
  static getDerivedStateFromError(e){return{err:e};}
  componentDidCatch(e,i){console.error("GridironGM crash:",e,i);}
  render(){
    if(this.state.err)return(
      <div style={{background:"#0f172a",minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"'Segoe UI',system-ui,sans-serif",padding:24}}>
        <div style={{background:"#111827",border:"1px solid #ef4444",borderRadius:12,padding:24,maxWidth:400,textAlign:"center"}}>
          <div style={{fontSize:32,marginBottom:8}}>🏈</div>
          <div style={{fontSize:16,fontWeight:800,color:"#ef4444",marginBottom:6}}>Something went wrong</div>
          <div style={{fontSize:12,color:"#64748b",marginBottom:16}}>Your save is safe in localStorage. Reload to recover.</div>
          <button onClick={()=>window.location.reload()} style={{background:"#22c55e",color:"#fff",border:"none",borderRadius:6,padding:"8px 20px",fontWeight:700,fontSize:13,cursor:"pointer"}}>Reload Game</button>
        </div>
      </div>
    );
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
