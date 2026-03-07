import { useState, useEffect, useMemo, useCallback, createContext, useContext } from "react";
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LineChart, Line, ReferenceLine } from "recharts";

// ─── Theme ───
const themes = {
  dark: {
    bg:"#0c0c1d", bgHover:"rgba(255,255,255,.06)",
    border:"rgba(255,255,255,.07)", text:"#e8e8f0", textMuted:"#8892b0", textDim:"#555",
    navBg:"rgba(12,12,29,.94)", navBorder:"rgba(255,255,255,.06)",
    inputBg:"rgba(255,255,255,.06)", inputBorder:"rgba(255,255,255,.1)",
    cardBg:"rgba(255,255,255,.035)", barBg:"rgba(255,255,255,.06)",
    gridStroke:"rgba(255,255,255,.06)",
    tooltipBg:"#ffffff", tooltipBorder:"#e0e0e0", tooltipText:"#1a1a2e",
    inc:"#00e676", exp:"#ff5252", bal:"#feca57", ratio:"#a29bfe", sav:"#40c4ff", withdraw:"#ff9800",
    accent:"#ff6b6b", accentEnd:"#ee5a24",
    growthUp:"#00e676", growthDown:"#ff5252",
  },
  light: {
    bg:"#f3f4f8", bgHover:"#ecedf2",
    border:"#dfe1e8", text:"#1a1a2e", textMuted:"#6b7280", textDim:"#bbb",
    navBg:"rgba(255,255,255,.96)", navBorder:"#dfe1e8",
    inputBg:"#fff", inputBorder:"#d1d5db",
    cardBg:"#fff", barBg:"#e5e7eb",
    gridStroke:"#e5e7eb",
    tooltipBg:"#ffffff", tooltipBorder:"#e0e0e0", tooltipText:"#1a1a2e",
    inc:"#16a34a", exp:"#dc2626", bal:"#d97706", ratio:"#7c3aed", sav:"#0288d1", withdraw:"#e65100",
    accent:"#e94560", accentEnd:"#c81d4e",
    growthUp:"#16a34a", growthDown:"#dc2626",
  },
};
const ThemeCtx = createContext(themes.dark);

// ─── Categories ───
const EXPENSE_CATEGORIES = {
  "Daily Expenses":["Breakfast","Lunch","Dinner","Water","Snack","Stuff"],
  "Other":["Shopping","Recreation","Books","Medicine","Travel","Internet","Payment","Accommodation"],
};
const INCOME_CATEGORIES = { "Earnings":["Salary","Bonus","Other"] };
const SAVINGS_CATEGORIES = { "Deposit":["PVD Funds","Saving Personal","Investment"] };
const WITHDRAW_CATEGORIES = { "Withdrawal":["PVD Funds","Saving Personal","Investment","Emergency"] };

const COLORS_EXP=["#ff5252","#ff7b7b","#e94560","#c81d4e","#ff6e40","#ff9e80","#f44336","#ef5350","#e57373","#ef9a9a","#d32f2f"];
const COLORS_INC=["#00e676","#69f0ae","#00c853","#00bfa5","#1de9b6"];
const COLORS_SAV=["#40c4ff","#80d8ff","#00b0ff","#0091ea","#29b6f6","#4fc3f7"];
const COLORS_WD=["#ff9800","#ffb74d","#ffa726","#fb8c00","#f57c00"];

// ─── Demo data ───
function generateDemoData(){
  const txs=[],uid=()=>Math.random().toString(36).slice(2,10),now=new Date();
  for(let m=0;m<12;m++){
    const mo=new Date(now.getFullYear(),now.getMonth()-m,1);
    const dim=new Date(mo.getFullYear(),mo.getMonth()+1,0).getDate();
    const mm=String(mo.getMonth()+1).padStart(2,"0"),yy=mo.getFullYear();
    txs.push({id:uid(),date:`${yy}-${mm}-25`,type:"income",category:"Earnings",subcategory:"Salary",description:"Monthly Salary",amount:45000+Math.floor(Math.random()*5000),fundSource:"income"});
    if(m%3===0) txs.push({id:uid(),date:`${yy}-${mm}-28`,type:"income",category:"Earnings",subcategory:"Bonus",description:"Quarterly Bonus",amount:10000+Math.floor(Math.random()*5000),fundSource:"income"});
    txs.push({id:uid(),date:`${yy}-${mm}-01`,type:"savings",category:"Deposit",subcategory:"PVD Funds",description:"PVD contribution",amount:3000,fundSource:"income"});
    txs.push({id:uid(),date:`${yy}-${mm}-05`,type:"savings",category:"Deposit",subcategory:"Saving Personal",description:"Monthly savings",amount:5000+Math.floor(Math.random()*2000),fundSource:"income"});
    if(m%2===0) txs.push({id:uid(),date:`${yy}-${mm}-10`,type:"savings",category:"Deposit",subcategory:"Investment",description:"Stock purchase",amount:2000+Math.floor(Math.random()*3000),fundSource:"income"});
    // Occasional withdrawal
    if(m%4===0&&m>0) txs.push({id:uid(),date:`${yy}-${mm}-18`,type:"withdraw",category:"Withdrawal",subcategory:"Saving Personal",description:"Emergency withdrawal",amount:3000+Math.floor(Math.random()*2000),fundSource:"income"});
    for(let d=1;d<=Math.min(dim,28);d++){
      const ds=`${yy}-${mm}-${String(d).padStart(2,"0")}`;
      const meals=[{sub:"Breakfast",desc:["Coffee & toast","Egg sandwich","Congee","Oatmeal"][d%4],amt:50+Math.floor(Math.random()*60)},{sub:"Lunch",desc:["Pad Thai","Rice bowl","Noodle soup","Bento"][d%4],amt:80+Math.floor(Math.random()*80)},{sub:"Dinner",desc:["Grilled fish","Steak set","Pasta","Curry"][d%4],amt:120+Math.floor(Math.random()*130)}];
      meals.slice(0,2+(d%3===0?1:0)).forEach(ml=>txs.push({id:uid(),date:ds,type:"expense",category:"Daily Expenses",subcategory:ml.sub,description:ml.desc,amount:ml.amt,fundSource:"income"}));
      if(d%3===0) txs.push({id:uid(),date:ds,type:"expense",category:"Daily Expenses",subcategory:"Water",description:"Drinking water",amount:20+Math.floor(Math.random()*20),fundSource:"income"});
      if(d%5===0) txs.push({id:uid(),date:ds,type:"expense",category:"Daily Expenses",subcategory:"Snack",description:["Fruit","Chips","Ice cream","Bakery"][d%4],amount:30+Math.floor(Math.random()*50),fundSource:"income"});
      if(d%4===0) txs.push({id:uid(),date:ds,type:"expense",category:"Daily Expenses",subcategory:"Stuff",description:["Tissue","Soap","Toothpaste","Batteries"][d%4],amount:40+Math.floor(Math.random()*60),fundSource:"income"});
      if(d%7===0) txs.push({id:uid(),date:ds,type:"expense",category:"Other",subcategory:"Shopping",description:["Groceries","Clothes","Electronics","Books"][d%4],amount:200+Math.floor(Math.random()*800),fundSource:"income"});
      if(d===15) txs.push({id:uid(),date:ds,type:"expense",category:"Other",subcategory:"Accommodation",description:"Monthly rent",amount:8000+Math.floor(Math.random()*2000),fundSource:"income"});
      if(d===10) txs.push({id:uid(),date:ds,type:"expense",category:"Other",subcategory:"Recreation",description:["Movie","Gym","Park","Concert"][m%4],amount:200+Math.floor(Math.random()*300),fundSource:"income"});
      if(d===20) txs.push({id:uid(),date:ds,type:"expense",category:"Other",subcategory:"Medicine",description:"Pharmacy",amount:100+Math.floor(Math.random()*300),fundSource:"income"});
      // Some expenses from savings
      if(d===22&&m%2===0) txs.push({id:uid(),date:ds,type:"expense",category:"Other",subcategory:"Shopping",description:"Big purchase (from savings)",amount:2000+Math.floor(Math.random()*3000),fundSource:"savings"});
    }
  }
  return txs.sort((a,b)=>b.date.localeCompare(a.date));
}

// ─── Helpers ───
const fmt=n=>n.toLocaleString("en-US",{minimumFractionDigits:0,maximumFractionDigits:0});
const fmtC=n=>"฿"+fmt(Math.abs(n));
const todayStr=()=>new Date().toISOString().split("T")[0];
// ─── API (Supabase via Vercel Functions) ───
const API="/api/transactions";
function mapRow(row){return{id:String(row.id),date:row.date,type:row.type,category:row.category,subcategory:row.subcategory,description:row.description||"",amount:parseFloat(row.amount),fundSource:row.fund_source||"income"};}
async function apiLoad(){try{const r=await fetch(API);if(!r.ok)throw new Error(r.status);const j=await r.json();return(j.data||[]).map(mapRow);}catch(e){console.error("Load error:",e);return[];}}
async function apiAdd(tx){const r=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(tx)});if(!r.ok)throw new Error(r.status);return mapRow(await r.json());}
async function apiUpdate(id,tx){const r=await fetch(API+"?id="+id,{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(tx)});if(!r.ok)throw new Error(r.status);return mapRow(await r.json());}
async function apiDelete(id){const r=await fetch(API+"?id="+id,{method:"DELETE"});if(!r.ok)throw new Error(r.status);}

const PAGE_SIZE=50;

// ─── Tooltips (always white bg) ───
function ChartTooltip({active,payload,label}){
  if(!active||!payload) return null;
  return <div style={{background:"#fff",border:"1px solid #e0e0e0",borderRadius:10,padding:"10px 16px",fontSize:12,color:"#1a1a2e",boxShadow:"0 4px 16px rgba(0,0,0,.12)",minWidth:140}}>
    {label&&<div style={{fontWeight:700,marginBottom:4,color:"#333"}}>{label}</div>}
    {payload.map((p,i)=><div key={i} style={{display:"flex",justifyContent:"space-between",gap:14,marginBottom:1}}>
      <span style={{color:p.color||p.fill||"#333"}}>{p.name}</span>
      <span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:600,color:"#1a1a2e"}}>{typeof p.value==="number"&&(p.dataKey?.includes("Growth")||p.name?.includes("Growth"))?`${p.value>0?"+":""}${p.value}%`:fmtC(p.value)}</span>
    </div>)}
  </div>;
}
function PieTooltip({active,payload}){
  if(!active||!payload?.length) return null;
  const d=payload[0];
  return <div style={{background:"#fff",border:"1px solid #e0e0e0",borderRadius:10,padding:"10px 16px",fontSize:13,color:"#1a1a2e",boxShadow:"0 4px 16px rgba(0,0,0,.12)"}}>
    <div style={{fontWeight:700,marginBottom:2}}>{d.name}</div>
    <div style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:600}}>{fmtC(d.value)}</div>
  </div>;
}

// ─── Stat Card ───
function StatCard({label,value,color,sub}){
  const T=useContext(ThemeCtx);
  return(
    <div style={{background:T.cardBg,borderRadius:14,padding:"15px 18px",flex:1,minWidth:120,borderBottom:`3px solid ${color}`,border:`1px solid ${T.border}`}}>
      <div style={{fontSize:10,color:T.textMuted,textTransform:"uppercase",letterSpacing:1.2}}>{label}</div>
      <div style={{fontSize:18,fontWeight:700,color,fontFamily:"'JetBrains Mono',monospace",marginTop:3}}>{typeof value==="string"?value:fmtC(value)}</div>
      {sub&&<div style={{fontSize:10,color:T.textMuted,marginTop:1}}>{sub}</div>}
    </div>
  );
}

// ─── Category List ───
function CatList({title,items,total,colors,color}){
  const T=useContext(ThemeCtx);
  return(
    <div style={{background:T.cardBg,borderRadius:16,padding:"20px 22px",border:`1px solid ${T.border}`,flex:1,minWidth:280}}>
      <div style={{fontSize:13,fontWeight:700,color,textTransform:"uppercase",letterSpacing:1,marginBottom:16}}>{title}</div>
      {items.length===0&&<div style={{color:T.textDim,fontSize:13,padding:"20px 0",textAlign:"center"}}>No data</div>}
      {items.map(({name,value},i)=>(
        <div key={name} style={{marginBottom:14}}>
          <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:5}}>
            <span style={{display:"flex",alignItems:"center",gap:8,fontSize:14,fontWeight:600}}>
              <span style={{width:10,height:10,borderRadius:"50%",background:colors[i%colors.length],display:"inline-block",flexShrink:0}}/>{name}
            </span>
            <span style={{fontFamily:"'JetBrains Mono',monospace",fontSize:12,color:T.textMuted}}>
              {fmtC(value)} · <span style={{color}}>{total>0?((value/total)*100).toFixed(1):"0"}%</span>
            </span>
          </div>
          <div style={{height:6,borderRadius:3,background:T.barBg}}>
            <div style={{height:"100%",borderRadius:3,background:colors[i%colors.length],width:`${total>0?(value/total)*100:0}%`,transition:"width .5s ease"}}/>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Fund Source Badge ───
function FundBadge({source,T}){
  if(!source||source==="income") return <span style={{fontSize:9,padding:"2px 7px",borderRadius:10,background:`${T.inc}22`,color:T.inc,fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>Income</span>;
  return <span style={{fontSize:9,padding:"2px 7px",borderRadius:10,background:`${T.sav}22`,color:T.sav,fontWeight:600,textTransform:"uppercase",letterSpacing:.5}}>Savings</span>;
}



// ─── Main ───
export default function BookKeep(){
  const [transactions,setTransactions]=useState([]);
  const [loading,setLoading]=useState(true);
  const [view,setView]=useState("dashboard");
  const [themeName,setThemeName]=useState("dark");
  const [timeRange,setTimeRange]=useState("month");
  const [selectedDate,setSelectedDate]=useState(todayStr());
  const [filterDay,setFilterDay]=useState("");
  const [filterMonth,setFilterMonth]=useState("");
  const [filterYear,setFilterYear]=useState("");
  const [filterType,setFilterType]=useState("");
  const [filterCat,setFilterCat]=useState("");
  const [filterSource,setFilterSource]=useState("");
  const [sortCol,setSortCol]=useState("date");
  const [sortDir,setSortDir]=useState("desc");
  const [page,setPage]=useState(0);
  const [form,setForm]=useState({type:"expense",category:Object.keys(EXPENSE_CATEGORIES)[0],subcategory:EXPENSE_CATEGORIES["Daily Expenses"][0],description:"",amount:"",date:todayStr(),fundSource:"income"});
  const [editId,setEditId]=useState(null);
  const [toast,setToast]=useState(null);

  const T=themes[themeName];



  useEffect(()=>{apiLoad().then(txs=>{setTransactions(txs.length>0?txs:generateDemoData());setLoading(false);}).catch(()=>{setTransactions(generateDemoData());setLoading(false);});},[]);





  const persist=useCallback((txs)=>{setTransactions(txs);},[]);
  const showToast=(msg,err=false)=>{setToast({msg,err});setTimeout(()=>setToast(null),2200);};
  const years=useMemo(()=>[...new Set(transactions.map(t=>t.date.slice(0,4)))].sort().reverse(),[transactions]);

  // ─── Date filter ───
  const filteredByDate=useMemo(()=>transactions.filter(t=>{
    const d=new Date(t.date),sel=new Date(selectedDate);
    if(timeRange==="day") return t.date===selectedDate;
    if(timeRange==="month") return d.getFullYear()===sel.getFullYear()&&d.getMonth()===sel.getMonth();
    if(timeRange==="year") return d.getFullYear()===sel.getFullYear();
    return true;
  }),[transactions,selectedDate,timeRange]);

  // Split by type
  const dashTxs=useMemo(()=>filteredByDate.filter(t=>t.type==="income"||t.type==="expense"),[filteredByDate]);
  const savTxs=useMemo(()=>filteredByDate.filter(t=>t.type==="savings"||t.type==="withdraw"),[filteredByDate]);

  // ─── Stats ───
  const income=dashTxs.filter(t=>t.type==="income").reduce((s,t)=>s+t.amount,0);
  const expense=dashTxs.filter(t=>t.type==="expense").reduce((s,t)=>s+t.amount,0);
  const expFromIncome=dashTxs.filter(t=>t.type==="expense"&&(t.fundSource||"income")==="income").reduce((s,t)=>s+t.amount,0);
  const expFromSavings=dashTxs.filter(t=>t.type==="expense"&&t.fundSource==="savings").reduce((s,t)=>s+t.amount,0);
  const balance=income-expense;

  const totalDeposit=savTxs.filter(t=>t.type==="savings").reduce((s,t)=>s+t.amount,0);
  const totalWithdraw=savTxs.filter(t=>t.type==="withdraw").reduce((s,t)=>s+t.amount,0);
  const netSavings=totalDeposit-totalWithdraw;

  // All-time savings
  const allDeposit=transactions.filter(t=>t.type==="savings").reduce((s,t)=>s+t.amount,0);
  const allWithdraw=transactions.filter(t=>t.type==="withdraw").reduce((s,t)=>s+t.amount,0);
  const allExpFromSav=transactions.filter(t=>t.type==="expense"&&t.fundSource==="savings").reduce((s,t)=>s+t.amount,0);
  const allNetSavings=allDeposit-allWithdraw-allExpFromSav;

  // Category breakdowns
  const catData=(type,arr)=>{const map={};(arr||dashTxs).filter(t=>t.type===type).forEach(t=>{const k=t.subcategory||t.category;map[k]=(map[k]||0)+t.amount;});return Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([name,value])=>({name,value}));};
  const expByCat=useMemo(()=>catData("expense",dashTxs),[dashTxs]);
  const incByCat=useMemo(()=>catData("income",dashTxs),[dashTxs]);
  const savByCat=useMemo(()=>{const map={};savTxs.filter(t=>t.type==="savings").forEach(t=>{const k=t.subcategory||t.category;map[k]=(map[k]||0)+t.amount;});return Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([name,value])=>({name,value}));},[savTxs]);
  const wdByCat=useMemo(()=>{const map={};savTxs.filter(t=>t.type==="withdraw").forEach(t=>{const k=t.subcategory||t.category;map[k]=(map[k]||0)+t.amount;});return Object.entries(map).sort((a,b)=>b[1]-a[1]).map(([name,value])=>({name,value}));},[savTxs]);

  // ─── Growth data ───
  const growthData=useMemo(()=>{
    const months={};
    transactions.filter(t=>t.type==="income"||t.type==="expense").forEach(t=>{const mk=t.date.slice(0,7);if(!months[mk]) months[mk]={month:mk,income:0,expense:0};months[mk][t.type]+=t.amount;});
    const sorted=Object.values(months).sort((a,b)=>a.month.localeCompare(b.month));
    return sorted.map((cur,i)=>{
      const prev=i>0?sorted[i-1]:null;
      return{month:cur.month,label:new Date(cur.month+"-01").toLocaleDateString("en-US",{month:"short",year:"2-digit"}),income:cur.income,expense:cur.expense,balance:cur.income-cur.expense,
        incGrowth:prev?.income>0?Math.round((cur.income-prev.income)/prev.income*1000)/10:0,
        expGrowth:prev?.expense>0?Math.round((cur.expense-prev.expense)/prev.expense*1000)/10:0};
    }).slice(-12);
  },[transactions]);

  const savGrowthData=useMemo(()=>{
    const months={};
    transactions.filter(t=>t.type==="savings"||t.type==="withdraw").forEach(t=>{
      const mk=t.date.slice(0,7);
      if(!months[mk]) months[mk]={deposit:0,withdraw:0};
      if(t.type==="savings") months[mk].deposit+=t.amount;
      else months[mk].withdraw+=t.amount;
    });
    // Add expenses from savings
    transactions.filter(t=>t.type==="expense"&&t.fundSource==="savings").forEach(t=>{
      const mk=t.date.slice(0,7);
      if(!months[mk]) months[mk]={deposit:0,withdraw:0};
      months[mk].withdraw+=t.amount;
    });
    const sorted=Object.entries(months).sort((a,b)=>a[0].localeCompare(b[0]));
    let cum=0;
    return sorted.map(([m,d])=>{cum+=d.deposit-d.withdraw;return{month:m,label:new Date(m+"-01").toLocaleDateString("en-US",{month:"short",year:"2-digit"}),deposit:d.deposit,withdraw:d.withdraw,net:d.deposit-d.withdraw,cumulative:cum};}).slice(-12);
  },[transactions]);

  // ─── List ───
  const allListTxs=useMemo(()=>{
    const filtered=transactions.filter(t=>{
      if(filterDay&&t.date!==filterDay) return false;
      if(filterMonth&&t.date.slice(0,7)!==filterMonth) return false;
      if(filterYear&&t.date.slice(0,4)!==filterYear) return false;
      if(filterType&&t.type!==filterType) return false;
      if(filterCat&&t.category!==filterCat) return false;
      if(filterSource){
        const src=t.type==="expense"?(t.fundSource||"income"):"";
        if(filterSource==="income"&&src!=="income") return false;
        if(filterSource==="savings"&&src!=="savings") return false;
        if(filterSource==="none"&&t.type==="expense") return false;
      }
      return true;
    });
    // Sort
    const dir=sortDir==="asc"?1:-1;
    filtered.sort((a,b)=>{
      switch(sortCol){
        case "date": return a.date.localeCompare(b.date)*dir;
        case "type": return a.type.localeCompare(b.type)*dir;
        case "category": return a.category.localeCompare(b.category)*dir;
        case "subcategory": return (a.subcategory||"").localeCompare(b.subcategory||"")*dir;
        case "description": return (a.description||"").localeCompare(b.description||"")*dir;
        case "amount": return (a.amount-b.amount)*dir;
        case "source": {
          const sa=a.type==="expense"?(a.fundSource||"income"):"—";
          const sb=b.type==="expense"?(b.fundSource||"income"):"—";
          return sa.localeCompare(sb)*dir;
        }
        default: return b.date.localeCompare(a.date);
      }
    });
    return filtered;
  },[transactions,filterDay,filterMonth,filterYear,filterType,filterCat,filterSource,sortCol,sortDir]);
  const totalPages=Math.ceil(allListTxs.length/PAGE_SIZE);
  const listTxs=allListTxs.slice(page*PAGE_SIZE,(page+1)*PAGE_SIZE);

  // ─── Form ───
  const formCatMap={expense:EXPENSE_CATEGORIES,income:INCOME_CATEGORIES,savings:SAVINGS_CATEGORIES,withdraw:WITHDRAW_CATEGORIES};
  const formCats=formCatMap[form.type]||EXPENSE_CATEGORIES;
  const formSubs=formCats[form.category]||[];

  const switchFormType=(t)=>{
    const c=formCatMap[t];const ck=Object.keys(c)[0];
    setForm({...form,type:t,category:ck,subcategory:c[ck][0],fundSource:t==="expense"?"income":""});
  };

  const handleSubmit=async()=>{
    if(!form.amount||isNaN(Number(form.amount))){showToast("Enter a valid amount",true);return;}
    const tx={...form,amount:Math.abs(Number(form.amount))};
    if(tx.type!=="expense") tx.fundSource="";
    try{
      if(editId){const updated=await apiUpdate(editId,tx);persist(transactions.map(t=>t.id===editId?updated:t));setEditId(null);showToast("Updated!");}
      else{const saved=await apiAdd(tx);persist([saved,...transactions]);showToast("Saved!");}
    }catch(e){showToast("Failed to save",true);return;}
    setForm({type:"expense",category:Object.keys(EXPENSE_CATEGORIES)[0],subcategory:EXPENSE_CATEGORIES["Daily Expenses"][0],description:"",amount:"",date:todayStr(),fundSource:"income"});
    setView("list");
  };

  const startEdit=tx=>{setForm({type:tx.type,category:tx.category,subcategory:tx.subcategory,description:tx.description,amount:String(tx.amount),date:tx.date,fundSource:tx.fundSource||"income"});setEditId(tx.id);setView("add");};
  const deleteTx=async(id)=>{try{await apiDelete(id);persist(transactions.filter(t=>t.id!==id));showToast("Deleted");}catch{showToast("Failed to delete",true);}};
  const exportCSV=rows=>{const h="Date,Type,Category,Subcategory,Description,Amount,FundSource\n";const b=rows.map(r=>`${r.date},${r.type},${r.category},${r.subcategory},"${r.description}",${r.amount},${r.fundSource||""}`).join("\n");const bl=new Blob([h+b],{type:"text/csv"});const a=document.createElement("a");a.href=URL.createObjectURL(bl);a.download="bookkeep-export.csv";a.click();};

  const rangeLabel=()=>{const d=new Date(selectedDate);if(timeRange==="day") return d.toLocaleDateString("en-US",{weekday:"short",day:"numeric",month:"short",year:"numeric"});if(timeRange==="month") return d.toLocaleDateString("en-US",{month:"long",year:"numeric"});return d.getFullYear().toString();};
  const dateInput=()=>{
    if(timeRange==="day") return <input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)} style={{...S.input,width:"auto",minWidth:148}}/>;
    if(timeRange==="month") return <input type="month" value={selectedDate.slice(0,7)} onChange={e=>setSelectedDate(e.target.value+"-01")} style={{...S.input,width:"auto",minWidth:152}}/>;
    return <select value={selectedDate.slice(0,4)} onChange={e=>setSelectedDate(e.target.value+"-01-01")} style={{...S.input,width:"auto",minWidth:88}}>{years.map(y=><option key={y} value={y}>{y}</option>)}</select>;
  };

  const S={
    input:{width:"100%",padding:"10px 13px",borderRadius:10,border:`1px solid ${T.inputBorder}`,background:T.inputBg,color:T.text,fontSize:13,outline:"none",boxSizing:"border-box",fontFamily:"inherit"},
    label:{display:"block",fontSize:11,color:T.textMuted,textTransform:"uppercase",letterSpacing:1.2,marginBottom:4,marginTop:12},
    pill:a=>({padding:"7px 15px",border:"none",borderRadius:24,background:a?`${T.accent}22`:"transparent",color:a?T.accent:T.textMuted,fontWeight:600,fontSize:12,cursor:"pointer"}),
    pageBtn:a=>({padding:"6px 14px",borderRadius:8,border:`1px solid ${T.border}`,background:a?T.accent:"transparent",color:a?"#fff":T.textMuted,fontWeight:600,fontSize:12,cursor:"pointer"}),
  };

  const typeColor=t=>({income:T.inc,expense:T.exp,savings:T.sav,withdraw:T.withdraw}[t]||T.text);
  const typeLabel=t=>({income:"Income",expense:"Expense",savings:"Deposit",withdraw:"Withdraw"}[t]||t);

  if(loading) return <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:T.bg,color:T.textMuted}}>Loading...</div>;

  return(
    <ThemeCtx.Provider value={T}>
    <div style={{minHeight:"100vh",background:T.bg,color:T.text,fontFamily:"'Bricolage Grotesque','Segoe UI',sans-serif",transition:"background .3s,color .3s"}}>
      <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@300;400;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet"/>

      {toast&&<div style={{position:"fixed",bottom:24,left:"50%",transform:"translateX(-50%)",padding:"10px 24px",borderRadius:24,background:toast.err?"#ff5252":"#00e676",color:toast.err?"#fff":"#0c0c1d",fontWeight:700,fontSize:13,zIndex:100,boxShadow:"0 8px 32px rgba(0,0,0,.3)"}}>{toast.msg}</div>}

      {/* Nav */}
      <nav style={{background:T.navBg,backdropFilter:"blur(16px)",borderBottom:`1px solid ${T.navBorder}`,padding:"11px 16px",position:"sticky",top:0,zIndex:20}}>
        <div style={{maxWidth:960,margin:"0 auto",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
          <div style={{display:"flex",alignItems:"center",gap:8,fontWeight:800,fontSize:19,letterSpacing:-.8,background:"linear-gradient(135deg,#ff6b6b,#feca57)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>◈ BookKeep</div>
          <div style={{display:"flex",gap:3,alignItems:"center",flexWrap:"wrap"}}>
            {[["dashboard","📊 Dashboard"],["savings","💎 Savings"],["add","+ Add"],["list","📋 List"],["report","📈 Report"]].map(([v,l])=>
              <button key={v} style={{padding:"7px 13px",borderRadius:24,border:"none",fontWeight:600,fontSize:11,cursor:"pointer",background:view===v?`linear-gradient(135deg,${T.accent},${T.accentEnd})`:T.bgHover,color:view===v?"#fff":T.textMuted}} onClick={()=>{setView(v);if(v==="add")setEditId(null);}}>{l}</button>
            )}
            <button onClick={()=>setThemeName(p=>p==="dark"?"light":"dark")} style={{marginLeft:2,padding:"7px 11px",borderRadius:24,border:`1px solid ${T.border}`,background:"transparent",color:T.textMuted,cursor:"pointer",fontSize:13}}>{themeName==="dark"?"☀️":"🌙"}</button>

          </div>
        </div>
      </nav>

      <div style={{maxWidth:960,margin:"0 auto",padding:"20px 16px"}}>

        {/* ═══ DASHBOARD ═══ */}
        {view==="dashboard"&&<>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:16}}>
            <div style={{display:"flex",background:T.bgHover,borderRadius:24,overflow:"hidden"}}>
              {["day","month","year"].map(r=><button key={r} onClick={()=>setTimeRange(r)} style={S.pill(timeRange===r)}>{r.charAt(0).toUpperCase()+r.slice(1)}</button>)}
            </div>
            {dateInput()}
            <div style={{flex:1}}/>
            <div style={{fontSize:12,color:T.textMuted}}>{rangeLabel()}</div>
          </div>

          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:18}}>
            <StatCard label="Income" value={income} color={T.inc}/>
            <StatCard label="Expenses" value={expense} color={T.exp} sub={expFromSavings>0?`฿${fmt(expFromSavings)} from savings`:undefined}/>
            <StatCard label="Balance" value={balance} color={balance>=0?T.bal:T.exp}/>
            <StatCard label="Expense %" value={income>0?((expense/income)*100).toFixed(1)+"%":"0%"} color={T.ratio}/>
          </div>

          {/* Expense source breakdown */}
          {expFromSavings>0&&<div style={{background:T.cardBg,borderRadius:12,padding:"12px 18px",border:`1px solid ${T.border}`,marginBottom:18,display:"flex",gap:20,flexWrap:"wrap",fontSize:13}}>
            <span style={{color:T.textMuted}}>Expenses funded from:</span>
            <span><span style={{color:T.inc,fontWeight:600}}>Income:</span> <span style={{fontFamily:"'JetBrains Mono',monospace"}}>{fmtC(expFromIncome)}</span></span>
            <span><span style={{color:T.sav,fontWeight:600}}>Savings:</span> <span style={{fontFamily:"'JetBrains Mono',monospace"}}>{fmtC(expFromSavings)}</span></span>
          </div>}

          {/* Pie charts */}
          <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:20}}>
            <div style={{background:T.cardBg,borderRadius:16,padding:"20px 22px",border:`1px solid ${T.border}`,flex:1,minWidth:280}}>
              <div style={{fontSize:14,fontWeight:700,color:T.exp,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Expenses Breakdown</div>
              {expByCat.length>0?<ResponsiveContainer width="100%" height={240}>
                <PieChart><Pie data={expByCat} cx="50%" cy="50%" outerRadius={95} innerRadius={50} dataKey="value" stroke="none" label={({name,percent})=>percent>.04?`${name} ${(percent*100).toFixed(0)}%`:""} labelLine={false} fontSize={10}>
                  {expByCat.map((_,i)=><Cell key={i} fill={COLORS_EXP[i%COLORS_EXP.length]}/>)}
                </Pie><Tooltip content={<PieTooltip/>}/></PieChart>
              </ResponsiveContainer>:<div style={{padding:"60px 0",textAlign:"center",color:T.textDim}}>No expenses</div>}
            </div>
            <div style={{background:T.cardBg,borderRadius:16,padding:"20px 22px",border:`1px solid ${T.border}`,flex:1,minWidth:280}}>
              <div style={{fontSize:14,fontWeight:700,color:T.inc,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Income Breakdown</div>
              {incByCat.length>0?<ResponsiveContainer width="100%" height={240}>
                <PieChart><Pie data={incByCat} cx="50%" cy="50%" outerRadius={95} innerRadius={50} dataKey="value" stroke="none" label={({name,percent})=>percent>.04?`${name} ${(percent*100).toFixed(0)}%`:""} labelLine={false} fontSize={10}>
                  {incByCat.map((_,i)=><Cell key={i} fill={COLORS_INC[i%COLORS_INC.length]}/>)}
                </Pie><Tooltip content={<PieTooltip/>}/></PieChart>
              </ResponsiveContainer>:<div style={{padding:"60px 0",textAlign:"center",color:T.textDim}}>No income</div>}
            </div>
          </div>

          <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:24}}>
            <CatList title="Expense % by Category" items={expByCat} total={expense} colors={COLORS_EXP} color={T.exp}/>
            <CatList title="Income % by Category" items={incByCat} total={income} colors={COLORS_INC} color={T.inc}/>
          </div>

          {/* Growth */}
          {growthData.length>1&&<>
            <div style={{background:T.cardBg,borderRadius:16,padding:"20px 22px",border:`1px solid ${T.border}`,marginBottom:16}}>
              <div style={{fontSize:14,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>Monthly Income vs Expenses</div>
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={growthData} barGap={4}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.gridStroke}/>
                  <XAxis dataKey="label" tick={{fontSize:10,fill:T.textMuted}}/>
                  <YAxis tick={{fontSize:10,fill:T.textMuted}} tickFormatter={v=>v>=1000?(v/1000)+"k":v}/>
                  <Tooltip content={<ChartTooltip/>}/><Legend wrapperStyle={{fontSize:11}}/>
                  <Bar dataKey="income" fill={T.inc} radius={[3,3,0,0]} name="Income"/>
                  <Bar dataKey="expense" fill={T.exp} radius={[3,3,0,0]} name="Expense"/>
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div style={{background:T.cardBg,borderRadius:16,padding:"20px 22px",border:`1px solid ${T.border}`,marginBottom:16}}>
              <div style={{fontSize:14,fontWeight:700,color:T.ratio,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>Growth Rate %</div>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={growthData.slice(1)}>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.gridStroke}/>
                  <XAxis dataKey="label" tick={{fontSize:10,fill:T.textMuted}}/>
                  <YAxis tick={{fontSize:10,fill:T.textMuted}} tickFormatter={v=>v+"%"}/>
                  <Tooltip content={<ChartTooltip/>}/><Legend wrapperStyle={{fontSize:11}}/>
                  <ReferenceLine y={0} stroke={T.textDim} strokeDasharray="3 3"/>
                  <Line type="monotone" dataKey="incGrowth" stroke={T.inc} strokeWidth={2.5} dot={{r:4,fill:T.inc}} name="Income Growth %"/>
                  <Line type="monotone" dataKey="expGrowth" stroke={T.exp} strokeWidth={2.5} dot={{r:4,fill:T.exp}} name="Expense Growth %"/>
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div style={{background:T.cardBg,borderRadius:16,padding:"20px 22px",border:`1px solid ${T.border}`,marginBottom:16,overflowX:"auto"}}>
              <div style={{fontSize:13,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Monthly Summary</div>
              <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
                <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>
                  {["Month","Income","Expense","Balance","Inc %","Exp %"].map(h=><th key={h} style={{textAlign:"left",padding:"8px 10px",color:T.textMuted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>{h}</th>)}
                </tr></thead>
                <tbody>{[...growthData].reverse().map((r,i)=>(
                  <tr key={r.month} style={{borderBottom:`1px solid ${T.bgHover}`}}>
                    <td style={{padding:"8px 10px",fontWeight:600}}>{r.label}</td>
                    <td style={{padding:"8px 10px",fontFamily:"'JetBrains Mono',monospace",color:T.inc}}>{fmtC(r.income)}</td>
                    <td style={{padding:"8px 10px",fontFamily:"'JetBrains Mono',monospace",color:T.exp}}>{fmtC(r.expense)}</td>
                    <td style={{padding:"8px 10px",fontFamily:"'JetBrains Mono',monospace",fontWeight:600,color:r.balance>=0?T.bal:T.exp}}>{r.balance>=0?"+":"−"}{fmtC(r.balance)}</td>
                    <td style={{padding:"8px 10px",fontFamily:"'JetBrains Mono',monospace",color:r.incGrowth>=0?T.growthUp:T.growthDown,fontWeight:600}}>{i<growthData.length-1?`${r.incGrowth>0?"+":""}${r.incGrowth}%`:"—"}</td>
                    <td style={{padding:"8px 10px",fontFamily:"'JetBrains Mono',monospace",color:r.expGrowth<=0?T.growthUp:T.growthDown,fontWeight:600}}>{i<growthData.length-1?`${r.expGrowth>0?"+":""}${r.expGrowth}%`:"—"}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </>}
        </>}

        {/* ═══ SAVINGS ═══ */}
        {view==="savings"&&<>
          <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:16}}>
            <h2 style={{fontSize:20,fontWeight:700,margin:0}}>💎 Savings & Deposits</h2>
            <div style={{flex:1}}/>
            <div style={{display:"flex",background:T.bgHover,borderRadius:24,overflow:"hidden"}}>
              {["day","month","year"].map(r=><button key={r} onClick={()=>setTimeRange(r)} style={S.pill(timeRange===r)}>{r.charAt(0).toUpperCase()+r.slice(1)}</button>)}
            </div>
            {dateInput()}
          </div>

          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:18}}>
            <StatCard label="Deposits" value={totalDeposit} color={T.sav}/>
            <StatCard label="Withdrawals" value={totalWithdraw} color={T.withdraw}/>
            <StatCard label={`Net (${rangeLabel()})`} value={netSavings} color={netSavings>=0?T.sav:T.withdraw}/>
            <StatCard label="All-Time Balance" value={allNetSavings} color={allNetSavings>=0?T.sav:T.withdraw}/>
          </div>

          {/* Pie charts */}
          <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:20}}>
            <div style={{background:T.cardBg,borderRadius:16,padding:"20px 22px",border:`1px solid ${T.border}`,flex:1,minWidth:280}}>
              <div style={{fontSize:14,fontWeight:700,color:T.sav,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Deposits Breakdown</div>
              {savByCat.length>0?<ResponsiveContainer width="100%" height={220}>
                <PieChart><Pie data={savByCat} cx="50%" cy="50%" outerRadius={85} innerRadius={45} dataKey="value" stroke="none" label={({name,percent})=>percent>.04?`${name} ${(percent*100).toFixed(0)}%`:""} labelLine={false} fontSize={10}>
                  {savByCat.map((_,i)=><Cell key={i} fill={COLORS_SAV[i%COLORS_SAV.length]}/>)}
                </Pie><Tooltip content={<PieTooltip/>}/></PieChart>
              </ResponsiveContainer>:<div style={{padding:"50px 0",textAlign:"center",color:T.textDim}}>No deposits</div>}
            </div>
            <div style={{background:T.cardBg,borderRadius:16,padding:"20px 22px",border:`1px solid ${T.border}`,flex:1,minWidth:280}}>
              <div style={{fontSize:14,fontWeight:700,color:T.withdraw,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Withdrawals Breakdown</div>
              {wdByCat.length>0?<ResponsiveContainer width="100%" height={220}>
                <PieChart><Pie data={wdByCat} cx="50%" cy="50%" outerRadius={85} innerRadius={45} dataKey="value" stroke="none" label={({name,percent})=>percent>.04?`${name} ${(percent*100).toFixed(0)}%`:""} labelLine={false} fontSize={10}>
                  {wdByCat.map((_,i)=><Cell key={i} fill={COLORS_WD[i%COLORS_WD.length]}/>)}
                </Pie><Tooltip content={<PieTooltip/>}/></PieChart>
              </ResponsiveContainer>:<div style={{padding:"50px 0",textAlign:"center",color:T.textDim}}>No withdrawals</div>}
            </div>
          </div>

          <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:20}}>
            <CatList title="Deposits by Category" items={savByCat} total={totalDeposit} colors={COLORS_SAV} color={T.sav}/>
            {wdByCat.length>0&&<CatList title="Withdrawals by Category" items={wdByCat} total={totalWithdraw} colors={COLORS_WD} color={T.withdraw}/>}
          </div>

          {/* Savings growth */}
          {savGrowthData.length>1&&<div style={{background:T.cardBg,borderRadius:16,padding:"20px 22px",border:`1px solid ${T.border}`,marginBottom:16}}>
            <div style={{fontSize:14,fontWeight:700,color:T.sav,textTransform:"uppercase",letterSpacing:1,marginBottom:14}}>Savings Over Time</div>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={savGrowthData} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.gridStroke}/>
                <XAxis dataKey="label" tick={{fontSize:10,fill:T.textMuted}}/>
                <YAxis tick={{fontSize:10,fill:T.textMuted}} tickFormatter={v=>v>=1000?(v/1000)+"k":v}/>
                <Tooltip content={<ChartTooltip/>}/><Legend wrapperStyle={{fontSize:11}}/>
                <Bar dataKey="deposit" fill={T.sav} radius={[3,3,0,0]} name="Deposit"/>
                <Bar dataKey="withdraw" fill={T.withdraw} radius={[3,3,0,0]} name="Withdraw"/>
              </BarChart>
            </ResponsiveContainer>
            <div style={{marginTop:16}}/>
            <div style={{fontSize:12,fontWeight:700,color:T.bal,textTransform:"uppercase",letterSpacing:1,marginBottom:10}}>Cumulative Savings Balance</div>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={savGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.gridStroke}/>
                <XAxis dataKey="label" tick={{fontSize:10,fill:T.textMuted}}/>
                <YAxis tick={{fontSize:10,fill:T.textMuted}} tickFormatter={v=>v>=1000?(v/1000)+"k":v}/>
                <Tooltip content={<ChartTooltip/>}/>
                <Line type="monotone" dataKey="cumulative" stroke={T.bal} strokeWidth={2.5} dot={{r:4,fill:T.bal}} name="Cumulative"/>
              </LineChart>
            </ResponsiveContainer>
          </div>}

          {/* Savings transactions */}
          <div style={{background:T.cardBg,borderRadius:16,padding:"20px 22px",border:`1px solid ${T.border}`,overflowX:"auto"}}>
            <div style={{fontSize:13,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:1,marginBottom:12}}>Transactions ({savTxs.length})</div>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13}}>
              <thead><tr style={{borderBottom:`1px solid ${T.border}`}}>
                {["Date","Type","Sub","Description","Amount",""].map(h=><th key={h} style={{textAlign:"left",padding:"8px 10px",color:T.textMuted,fontWeight:600,fontSize:10,textTransform:"uppercase"}}>{h}</th>)}
              </tr></thead>
              <tbody>{savTxs.sort((a,b)=>b.date.localeCompare(a.date)).map(tx=>(
                <tr key={tx.id} style={{borderBottom:`1px solid ${T.bgHover}`}} onMouseEnter={e=>e.currentTarget.style.background=T.bgHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{padding:"8px 10px",fontFamily:"'JetBrains Mono',monospace",fontSize:11}}>{tx.date}</td>
                  <td style={{padding:"8px 10px"}}><span style={{fontSize:10,padding:"2px 8px",borderRadius:10,background:tx.type==="savings"?`${T.sav}22`:`${T.withdraw}22`,color:tx.type==="savings"?T.sav:T.withdraw,fontWeight:700}}>{tx.type==="savings"?"Deposit":"Withdraw"}</span></td>
                  <td style={{padding:"8px 10px",fontWeight:600}}>{tx.subcategory}</td>
                  <td style={{padding:"8px 10px",color:T.textMuted}}>{tx.description||"—"}</td>
                  <td style={{padding:"8px 10px",fontFamily:"'JetBrains Mono',monospace",fontWeight:600,color:tx.type==="savings"?T.sav:T.withdraw}}>{tx.type==="savings"?"+":"−"}{fmtC(tx.amount)}</td>
                  <td style={{padding:"8px 10px"}}>
                    <button onClick={()=>startEdit(tx)} style={{background:"transparent",border:`1px solid ${T.border}`,color:T.bal,borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:10,marginRight:3}}>✏️</button>
                    <button onClick={()=>deleteTx(tx.id)} style={{background:"transparent",border:`1px solid ${T.border}`,color:T.exp,borderRadius:6,padding:"3px 8px",cursor:"pointer",fontSize:10}}>✕</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
            {savTxs.length===0&&<div style={{padding:"30px 0",textAlign:"center",color:T.textDim}}>No savings transactions this period</div>}
          </div>
        </>}

        {/* ═══ ADD / EDIT ═══ */}
        {view==="add"&&(
          <div style={{background:T.cardBg,borderRadius:16,padding:28,maxWidth:520,margin:"0 auto",border:`1px solid ${T.border}`}}>
            <h2 style={{fontSize:20,fontWeight:700,marginBottom:4}}>{editId?"Edit Transaction":"New Transaction"}</h2>
            <p style={{fontSize:12,color:T.textMuted,marginBottom:16}}>Choose type, fill details, save</p>

            {/* 4-way type toggle */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:12}}>
              {[["expense","💸 Expense",T.exp],["income","💰 Income",T.inc],["savings","💎 Deposit",T.sav],["withdraw","🏧 Withdraw",T.withdraw]].map(([t,l,c])=>
                <button key={t} onClick={()=>switchFormType(t)} style={{padding:11,borderRadius:10,border:form.type===t?"none":`1px solid ${T.inputBorder}`,background:form.type===t?c:"transparent",color:form.type===t?"#fff":T.textMuted,fontWeight:700,fontSize:12,cursor:"pointer",transition:"all .2s"}}>{l}</button>
              )}
            </div>

            <label style={S.label}>Date</label>
            <input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})} style={S.input}/>
            <label style={S.label}>Category</label>
            <select value={form.category} onChange={e=>{const c=formCats[e.target.value]||[];setForm({...form,category:e.target.value,subcategory:c[0]||""});}} style={S.input}>{Object.keys(formCats).map(c=><option key={c} value={c}>{c}</option>)}</select>
            <label style={S.label}>Subcategory</label>
            <select value={form.subcategory} onChange={e=>setForm({...form,subcategory:e.target.value})} style={S.input}>{formSubs.map(s=><option key={s} value={s}>{s}</option>)}</select>
            <label style={S.label}>Description</label>
            <input placeholder="e.g. Morning coffee" value={form.description} onChange={e=>setForm({...form,description:e.target.value})} style={S.input}/>
            <label style={S.label}>Amount</label>
            <input type="number" min="0" step="0.01" placeholder="0" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})} style={{...S.input,fontFamily:"'JetBrains Mono',monospace",fontSize:20,padding:14}}/>

            {/* Fund Source — only for expenses */}
            {form.type==="expense"&&<>
              <label style={S.label}>Deduct From</label>
              <div style={{display:"flex",gap:8,marginTop:4}}>
                <button onClick={()=>setForm({...form,fundSource:"income"})} style={{flex:1,padding:10,borderRadius:10,border:(form.fundSource||"income")==="income"?"none":`1px solid ${T.inputBorder}`,background:(form.fundSource||"income")==="income"?T.inc:"transparent",color:(form.fundSource||"income")==="income"?"#fff":T.textMuted,fontWeight:700,fontSize:12,cursor:"pointer"}}>💰 Income (default)</button>
                <button onClick={()=>setForm({...form,fundSource:"savings"})} style={{flex:1,padding:10,borderRadius:10,border:form.fundSource==="savings"?"none":`1px solid ${T.inputBorder}`,background:form.fundSource==="savings"?T.sav:"transparent",color:form.fundSource==="savings"?"#fff":T.textMuted,fontWeight:700,fontSize:12,cursor:"pointer"}}>💎 Savings</button>
              </div>
              {form.fundSource==="savings"&&<div style={{marginTop:8,padding:"8px 14px",borderRadius:10,background:`${T.withdraw}15`,border:`1px solid ${T.withdraw}33`,fontSize:12,color:T.withdraw}}>⚠️ This expense will reduce your savings balance</div>}
            </>}

            <button onClick={handleSubmit} style={{width:"100%",marginTop:18,padding:14,borderRadius:12,border:"none",background:`linear-gradient(135deg,${T.accent},${T.accentEnd})`,color:"#fff",fontWeight:700,fontSize:15,cursor:"pointer"}}>{editId?"Update":"Save Transaction"}</button>
            {editId&&<button onClick={()=>{setEditId(null);setForm({type:"expense",category:Object.keys(EXPENSE_CATEGORIES)[0],subcategory:EXPENSE_CATEGORIES["Daily Expenses"][0],description:"",amount:"",date:todayStr(),fundSource:"income"});}} style={{width:"100%",marginTop:8,padding:12,borderRadius:12,border:`1px solid ${T.border}`,background:"transparent",color:T.textMuted,fontWeight:600,fontSize:13,cursor:"pointer"}}>Cancel</button>}
          </div>
        )}

        {/* ═══ LIST ═══ */}
        {view==="list"&&<>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:16,alignItems:"flex-end"}}>
            <div><label style={S.label}>Day</label><input type="date" value={filterDay} onChange={e=>{setFilterDay(e.target.value);setFilterMonth("");setFilterYear("");setPage(0);}} style={{...S.input,width:"auto",minWidth:142}}/></div>
            <div><label style={S.label}>Month</label><input type="month" value={filterMonth} onChange={e=>{setFilterMonth(e.target.value);setFilterDay("");setFilterYear("");setPage(0);}} style={{...S.input,width:"auto",minWidth:148}}/></div>
            <div><label style={S.label}>Year</label><select value={filterYear} onChange={e=>{setFilterYear(e.target.value);setFilterDay("");setFilterMonth("");setPage(0);}} style={{...S.input,width:"auto",minWidth:82}}><option value="">All</option>{years.map(y=><option key={y}>{y}</option>)}</select></div>
            <div><label style={S.label}>Type</label><select value={filterType} onChange={e=>{setFilterType(e.target.value);setPage(0);}} style={{...S.input,width:"auto",minWidth:95}}><option value="">All</option><option value="income">Income</option><option value="expense">Expense</option><option value="savings">Deposit</option><option value="withdraw">Withdraw</option></select></div>
            <div><label style={S.label}>Category</label><select value={filterCat} onChange={e=>{setFilterCat(e.target.value);setPage(0);}} style={{...S.input,width:"auto",minWidth:115}}><option value="">All</option>{[...Object.keys(EXPENSE_CATEGORIES),...Object.keys(INCOME_CATEGORIES),...Object.keys(SAVINGS_CATEGORIES),...Object.keys(WITHDRAW_CATEGORIES)].filter((v,i,a)=>a.indexOf(v)===i).map(c=><option key={c}>{c}</option>)}</select></div>
            <div><label style={S.label}>Source</label><select value={filterSource} onChange={e=>{setFilterSource(e.target.value);setPage(0);}} style={{...S.input,width:"auto",minWidth:95}}><option value="">All</option><option value="income">Income</option><option value="savings">Savings</option></select></div>
            <button onClick={()=>{setFilterDay("");setFilterMonth("");setFilterYear("");setFilterType("");setFilterCat("");setFilterSource("");setPage(0);setSortCol("date");setSortDir("desc");}} style={{padding:"9px 14px",borderRadius:10,border:`1px solid ${T.border}`,background:"transparent",color:T.accent,fontWeight:600,fontSize:11,cursor:"pointer",height:38}}>Clear All</button>
            <div style={{flex:1}}/>
            <button onClick={()=>exportCSV(allListTxs)} style={{padding:"9px 14px",borderRadius:10,border:"none",background:T.bgHover,color:T.bal,fontWeight:600,fontSize:11,cursor:"pointer",height:38}}>📥 CSV</button>
          </div>
          <div style={{fontSize:12,color:T.textMuted,marginBottom:10}}>{allListTxs.length} transactions · Page {page+1}/{Math.max(totalPages,1)} · Sorted by {sortCol} {sortDir==="asc"?"↑":"↓"}</div>
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:12}}>
              <thead><tr style={{borderBottom:`2px solid ${T.border}`}}>
                {[{key:"date",label:"Date"},{key:"type",label:"Type"},{key:"category",label:"Category"},{key:"subcategory",label:"Sub"},{key:"description",label:"Description"},{key:"amount",label:"Amount"},{key:"source",label:"Source"},{key:"",label:""}].map(col=>(
                  <th key={col.key||col.label} onClick={()=>{if(!col.key) return;if(sortCol===col.key) setSortDir(d=>d==="asc"?"desc":"asc");else{setSortCol(col.key);setSortDir("asc");}setPage(0);}} style={{textAlign:"left",padding:"9px 9px",color:sortCol===col.key?T.accent:T.textMuted,fontWeight:700,fontSize:10,textTransform:"uppercase",letterSpacing:.8,whiteSpace:"nowrap",cursor:col.key?"pointer":"default",userSelect:"none",transition:"color .2s",background:sortCol===col.key?`${T.accent}08`:"transparent",borderBottom:sortCol===col.key?`2px solid ${T.accent}`:"none"}}>
                    <span style={{display:"inline-flex",alignItems:"center",gap:4}}>
                      {col.label}
                      {col.key&&<span style={{fontSize:12,opacity:sortCol===col.key?1:0.3,transition:"opacity .2s"}}>{sortCol===col.key?(sortDir==="asc"?"▲":"▼"):"⇅"}</span>}
                    </span>
                  </th>
                ))}
              </tr></thead>
              <tbody>{listTxs.map(tx=>(
                <tr key={tx.id} style={{borderBottom:`1px solid ${T.bgHover}`}} onMouseEnter={e=>e.currentTarget.style.background=T.bgHover} onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <td style={{padding:"8px 9px",fontFamily:"'JetBrains Mono',monospace",fontSize:11,whiteSpace:"nowrap"}}>{tx.date}</td>
                  <td style={{padding:"8px 9px"}}><span style={{fontSize:10,padding:"2px 7px",borderRadius:10,background:`${typeColor(tx.type)}22`,color:typeColor(tx.type),fontWeight:700}}>{typeLabel(tx.type)}</span></td>
                  <td style={{padding:"8px 9px",fontSize:12}}>{tx.category}</td>
                  <td style={{padding:"8px 9px",color:T.textMuted,fontSize:12}}>{tx.subcategory}</td>
                  <td style={{padding:"8px 9px",color:T.textMuted,maxWidth:140,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",fontSize:12}}>{tx.description||"—"}</td>
                  <td style={{padding:"8px 9px",fontFamily:"'JetBrains Mono',monospace",fontWeight:600,color:typeColor(tx.type),whiteSpace:"nowrap"}}>{(tx.type==="expense"||tx.type==="withdraw")?"−":"+"}{fmtC(tx.amount)}</td>
                  <td style={{padding:"8px 9px"}}>{tx.type==="expense"?<FundBadge source={tx.fundSource} T={T}/>:<span style={{color:T.textDim,fontSize:10}}>—</span>}</td>
                  <td style={{padding:"8px 9px",whiteSpace:"nowrap"}}>
                    <button onClick={()=>startEdit(tx)} style={{background:"transparent",border:`1px solid ${T.border}`,color:T.bal,borderRadius:6,padding:"3px 7px",cursor:"pointer",fontSize:10,marginRight:2}}>✏️</button>
                    <button onClick={()=>deleteTx(tx.id)} style={{background:"transparent",border:`1px solid ${T.border}`,color:T.exp,borderRadius:6,padding:"3px 7px",cursor:"pointer",fontSize:10}}>✕</button>
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
          {totalPages>1&&<div style={{display:"flex",justifyContent:"center",gap:6,marginTop:18}}>
            <button disabled={page===0} onClick={()=>setPage(p=>p-1)} style={S.pageBtn(false)}>← Prev</button>
            {Array.from({length:Math.min(totalPages,7)},(_,i)=>{let p;if(totalPages<=7) p=i;else if(page<4) p=i;else if(page>=totalPages-4) p=totalPages-7+i;else p=page-3+i;return <button key={p} onClick={()=>setPage(p)} style={S.pageBtn(page===p)}>{p+1}</button>;})}
            <button disabled={page>=totalPages-1} onClick={()=>setPage(p=>p+1)} style={S.pageBtn(false)}>Next →</button>
          </div>}
        </>}

        {/* ═══ REPORT ═══ */}
        {view==="report"&&<>
          <div style={{display:"flex",alignItems:"center",gap:12,flexWrap:"wrap",marginBottom:18}}>
            <h2 style={{fontSize:20,fontWeight:700,margin:0}}>Monthly Report</h2>
            <div style={{flex:1}}/>
            <input type="month" value={selectedDate.slice(0,7)} onChange={e=>setSelectedDate(e.target.value+"-01")} style={{...S.input,width:"auto",minWidth:155}}/>
          </div>
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:18}}>
            <StatCard label="Income" value={income} color={T.inc}/>
            <StatCard label="Expenses" value={expense} color={T.exp}/>
            <StatCard label="Balance" value={balance} color={balance>=0?T.bal:T.exp}/>
            <StatCard label="Savings Net" value={netSavings} color={netSavings>=0?T.sav:T.withdraw}/>
          </div>
          {expFromSavings>0&&<div style={{background:T.cardBg,borderRadius:12,padding:"10px 16px",border:`1px solid ${T.border}`,marginBottom:16,fontSize:12,color:T.textMuted}}>
            Expenses from savings this month: <span style={{fontFamily:"'JetBrains Mono',monospace",fontWeight:600,color:T.withdraw}}>{fmtC(expFromSavings)}</span>
          </div>}
          <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:20}}>
            <CatList title="Income" items={incByCat} total={income} colors={COLORS_INC} color={T.inc}/>
            <CatList title="Expenses" items={expByCat} total={expense} colors={COLORS_EXP} color={T.exp}/>
          </div>
          <div style={{display:"flex",gap:16,flexWrap:"wrap",marginBottom:20}}>
            {savByCat.length>0&&<CatList title="Deposits" items={savByCat} total={totalDeposit} colors={COLORS_SAV} color={T.sav}/>}
            {wdByCat.length>0&&<CatList title="Withdrawals" items={wdByCat} total={totalWithdraw} colors={COLORS_WD} color={T.withdraw}/>}
          </div>
          <button onClick={()=>exportCSV([...dashTxs,...savTxs])} disabled={!dashTxs.length&&!savTxs.length} style={{width:"100%",padding:14,borderRadius:12,border:"none",background:(dashTxs.length||savTxs.length)?`linear-gradient(135deg,${T.accent},${T.accentEnd})`:"#333",color:"#fff",fontWeight:700,fontSize:15,cursor:(dashTxs.length||savTxs.length)?"pointer":"not-allowed"}}>📥 Export Report to CSV</button>
          <div style={{textAlign:"center",marginTop:30}}>
            <button onClick={()=>{if(confirm("Reset ALL data and load demo?")){const d=generateDemoData();persist(d);showToast("Reset!");}}} style={{background:"transparent",border:"none",color:T.textDim,fontSize:11,cursor:"pointer",textDecoration:"underline"}}>Reset to demo data</button>
          </div>
        </>}

      </div>
    </div>
    </ThemeCtx.Provider>
  );
}
