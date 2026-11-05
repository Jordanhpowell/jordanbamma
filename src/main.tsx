import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

const css = `
*{box-sizing:border-box}body{margin:0;background:#071b16;color:#eefbf3;font-family:Inter,system-ui,Arial,sans-serif;font-size:16px}
header{padding:18px clamp(18px,4vw,64px);border-bottom:1px solid #275243;display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap}
.brand{font-size:24px;font-weight:800;color:#76f0ad}.tag{font-size:12px;color:#a4c9b8;letter-spacing:1px}
main{max-width:1220px;margin:0 auto;padding:42px 22px}h1{font-size:clamp(32px,5vw,52px);margin:8px 0}p{color:#accbbd;line-height:1.5}
.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(270px,1fr));gap:18px;margin-top:24px}
.card{background:#103026;border:1px solid #2c5b46;border-radius:16px;padding:24px;min-width:0}h2{font-size:19px;margin:0 0 20px}
button,select{background:#174b36;color:white;border:1px solid #4b9c72;padding:12px 16px;border-radius:9px;font:inherit;cursor:pointer}
button:hover{background:#216849}.primary{background:#1e9e5d;border-color:#38ce81;font-weight:700}
.stat{font-size:34px;font-weight:800;color:#7ef0aa;margin:14px 0}.muted{color:#a4c9b8;font-size:14px}
.digits{display:grid;grid-template-columns:repeat(10,minmax(0,1fr));gap:5px;margin-top:20px}
.digit{text-align:center;font-size:13px}.bar{height:75px;background:#082018;border-radius:5px;display:flex;align-items:end;overflow:hidden}
.fill{width:100%;background:#43c681;min-height:2px}ul{padding-left:20px;line-height:2;color:#b8d8c8}
.status{display:inline-block;border-radius:20px;background:#164c36;padding:6px 12px;color:#a7f3c4;font-size:13px}
.nav{display:flex;gap:10px;flex-wrap:wrap;margin:20px 0}.nav button{font-size:14px}.nav button.active{background:#1e9e5d}
.chart{width:100%;height:210px;background:#09251c;border-radius:10px;margin-top:12px}
.form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;margin:14px 0}.form-row label{display:grid;gap:8px;color:#b5d6c5;font-size:13px}
input{min-width:0;width:100%;background:#08241b;color:#fff;border:1px solid #45765c;border-radius:8px;padding:11px}
.note{background:#123d2e;border-left:3px solid #65c998;padding:12px;margin-top:16px;color:#b7d8c6;font-size:13px}
footer{padding:25px;text-align:center;color:#82a995;font-size:12px}
`;
const markets = [{label:'Volatility 100',value:'R_100'},{label:'Volatility 75',value:'R_75'},{label:'Volatility 50',value:'R_50'},{label:'Volatility 25',value:'R_25'},{label:'Volatility 10',value:'R_10'}];
function Analyzer(){
 const [market,setMarket]=useState('R_100');
 const [ticks,setTicks]=useState<number[]>([]);
 const [status,setStatus]=useState('Connecting');
 const [builderLoading,setBuilderLoading]=useState(false);
 const [tab,setTab]=useState('Dashboard');
 const [contract,setContract]=useState('Rise / Fall');
 const [stake,setStake]=useState('1');
 useEffect(()=>{
  const appId=process.env.NEXT_PUBLIC_DERIV_APP_ID;
  if(!appId){setStatus('Deriv App ID not configured');return;}
  let ws:WebSocket;
  try{
   ws=new WebSocket('wss://ws.derivws.com/websockets/v3?app_id='+encodeURIComponent(appId));
   ws.onopen=()=>{setStatus('Connected — waiting for ticks');ws.send(JSON.stringify({ticks:market,subscribe:1}));};
   ws.onmessage=(e)=>{try{const d=JSON.parse(e.data);if(d.error){setStatus(d.error.message||'Feed error');return;}if(d.msg_type==='tick'&&d.tick){setStatus('Live');setTicks(prev=>[...prev,d.tick.quote].slice(-100));}}catch{}};
   ws.onerror=()=>setStatus('Feed unavailable');
   ws.onclose=()=>setStatus(prev=>prev==='Live'?'Disconnected':prev);
  }catch{setStatus('Connection unavailable');}
  return ()=>ws?.close();
 },[market]);
 const counts=Array(10).fill(0);
 ticks.forEach(n=>{const digit=Number(String(n).slice(-1));if(Number.isInteger(digit))counts[digit]++;});
 const max=Math.max(1,...counts);
 const latest=ticks[ticks.length-1];
 const chartPoints=ticks.map((v,i)=>{const min=Math.min(...ticks),max=Math.max(...ticks);return (i/(Math.max(1,ticks.length-1))*100)+','+(90-(v-min)/Math.max(0.000001,max-min)*80);}).join(' ');
 const appConfigured=Boolean(process.env.NEXT_PUBLIC_DERIV_APP_ID);
 const openBuilder=async()=>{
  setBuilderLoading(true);
  try{root.unmount();window.history.replaceState(null,'','#bot_builder');await import('./legacy-main');}
  catch(e){document.getElementById('root')!.innerHTML='<main><h1>Bot Builder could not start</h1><p>Please reload the page to return to the Analyzer.</p><button onclick="location.reload()">Reload</button></main>';console.error(e);}
 };
 return <><style>{css}</style><header><div><div className="brand">POWELL BAMMA</div><div className="tag">DERIV MARKET ANALYZER</div></div><button onClick={openBuilder} disabled={builderLoading}>{builderLoading?'Opening Bot Builder…':'Open Bot Builder'}</button></header>
 <main><div className="status">{status}</div><h1>Powell Bamma Analyzer</h1><p>Live market observations and your trading workspace. The Analyzer loads independently of the trading engine.</p>
 <label htmlFor="market">Synthetic market: </label> <select id="market" value={market} onChange={e=>{setTicks([]);setMarket(e.target.value);}}>{markets.map(m=><option key={m.value} value={m.value}>{m.label}</option>)}</select>
 <div className="nav">{['Dashboard','Trading','Analysis','Account'].map(name=><button key={name} className={tab===name?'active':''} onClick={()=>setTab(name)}>{name}</button>)}<button onClick={openBuilder}>Bot Builder</button></div>
 {tab==='Account'&&<div className="grid"><section className="card"><h2>Deriv Account</h2><div className="status">Not connected</div><p>Account login, balance, demo/live switching and portfolio require a registered Deriv App ID and a secure OAuth integration.</p><div className="note">{appConfigured?'App ID detected. Account authorization still needs integration.':'Deriv App ID is not configured in Vercel.'}</div></section><section className="card"><h2>Account Overview</h2><p>Balance: —</p><p>Currency: —</p><p>Open positions: —</p><p>Transaction history: unavailable until login</p></section></div>}
 {tab==='Trading'&&<div className="grid"><section className="card"><h2>Contract Ticket</h2><p className="muted">Setup preview — no orders are sent</p><div className="form-row"><label>Contract type<select value={contract} onChange={e=>setContract(e.target.value)}>{['Rise / Fall','Higher / Lower','Even / Odd','Matches / Differs','Over / Under'].map(x=><option key={x}>{x}</option>)}</select></label><label>Stake (USD)<input type="number" min="0.35" step="0.01" value={stake} onChange={e=>setStake(e.target.value)}/></label></div><button disabled>Buy disabled — connect account first</button><div className="note">Live proposal pricing and contract purchases are not yet integrated. Do not use this preview as a quote.</div></section><section className="card"><h2>Positions and Trade History</h2><p>No authenticated account is connected.</p><p>Open contracts, profit/loss and transaction history will appear after the trading API is connected.</p></section></div>}
 {tab==='Analysis'&&<div className="grid"><section className="card"><h2>Digit Analysis</h2><p>Observed sample: {ticks.length} ticks</p><p>Even: {counts.filter((_,i)=>i%2===0).reduce((a,b)=>a+b,0)} · Odd: {counts.filter((_,i)=>i%2===1).reduce((a,b)=>a+b,0)}</p><p>These are historical frequencies, not predictive signals.</p></section><section className="card"><h2>Strategy Library</h2><ul><li>Matches / Differs</li><li>Even / Odd</li><li>Over / Under</li><li>Rise / Fall</li><li>Higher / Lower</li></ul><button onClick={openBuilder}>Open visual Bot Builder</button></section></div>}
 {tab==='Dashboard'&&<><div className="grid"><section className="card" style={{gridColumn:'1 / -1'}}><h2>Market Chart · {market}</h2>{ticks.length>1?<svg className="chart" viewBox="0 0 100 100" preserveAspectRatio="none" role="img" aria-label="Live price line chart"><polyline points={chartPoints} fill="none" stroke="#64efa5" strokeWidth="1" vectorEffect="non-scaling-stroke"/></svg>:<div className="chart" style={{display:'grid',placeItems:'center',color:'#a4c9b8'}}>Waiting for live prices · {status}</div>}<p className="muted">Rolling tick chart. Not a candlestick chart.</p></section></div>
 <div className="grid"><section className="card"><h2>Market Price</h2><div className="stat">{latest??'—'}</div><div className="muted">{ticks.length} observed ticks (maximum 100)</div><p>Market information only. No trades are placed by this Analyzer.</p></section>
 <section className="card"><h2>Last Digit</h2><div className="stat">{latest===undefined?'—':String(latest).slice(-1)}</div><div className="muted">Latest received quote</div><p>Historical digit frequencies do not predict future outcomes.</p></section>
 <section className="card"><h2>Strategy Workspace</h2><ul><li>Digit Matches / Differs</li><li>Even / Odd</li><li>Over / Under</li><li>Rise / Fall</li></ul><button className="primary" onClick={openBuilder}>Build a trading bot</button></section>
 <section className="card" style={{gridColumn:'1 / -1'}}><h2>Observed Last-Digit Frequency</h2><div className="digits">{counts.map((c,i)=><div className="digit" key={i}><div>{c}</div><div className="bar"><div className="fill" style={{height:(c/max*100)+'%'}}/></div><strong>{i}</strong></div>)}</div></section></div>
 </>}
 </main><footer>Powell Bamma · Informational analysis only · Trading involves risk</footer></>;
}
const root=createRoot(document.getElementById('root')!);
root.render(<Analyzer/>);
