import { useState, useEffect } from "react";

/* ─── GOOGLE FONTS ──────────────────────────────────────────────────────────── */
const FontLink = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400&family=DM+Sans:wght@300;400;500;600&display=swap');

    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #fff5f7; }

    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(24px); }
      to   { opacity: 1; transform: translateY(0); }
    }
    @keyframes pulse {
      0%,100% { transform: scale(1); }
      50%      { transform: scale(1.06); }
    }
    @keyframes shimmer {
      0%   { background-position: -400px 0; }
      100% { background-position: 400px 0; }
    }
    @keyframes spin {
      from { transform: rotate(0deg); }
      to   { transform: rotate(360deg); }
    }
    .fadeUp { animation: fadeUp 0.5s ease forwards; }
    .pulse  { animation: pulse 2s ease infinite; }

    input:focus, textarea:focus, select:focus {
      outline: none;
      border-color: #e8789a !important;
      box-shadow: 0 0 0 3px rgba(232,120,154,0.15);
    }

    .product-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 12px 40px rgba(220,90,130,0.18) !important;
    }
    .order-card:hover {
      border-color: #e8789a !important;
      transform: translateX(3px);
    }
    .add-btn:hover { background: #c94e78 !important; }
    .nav-item:hover { background: rgba(255,255,255,0.12) !important; }
  `}</style>
);

/* ─── LOCAL STORAGE ─────────────────────────────────────────────────────────── */
const useLS = (key, fallback) => {
  const [state, setState] = useState(() => {
    try { const s = localStorage.getItem(key); return s ? JSON.parse(s) : fallback; }
    catch { return fallback; }
  });
  const set = v => { setState(v); try { localStorage.setItem(key, JSON.stringify(v)); } catch {} };
  return [state, set];
};

/* ─── SEED DATA ─────────────────────────────────────────────────────────────── */
const SEED_PRODUCTS = [
  { id: 1, title: "Ovo Brigadeiro Clássico", description: "Chocolate ao leite artesanal recheado com brigadeiro cremoso e granulado belga", price: 48, stock: 20, active: true, image: "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=500&q=80" },
  { id: 2, title: "Ovo Trufa de Morango", description: "Chocolate meio amargo com recheio de trufa de morango fresco e cobertura crocante", price: 62, stock: 15, active: true, image: "https://images.unsplash.com/photo-1481391319762-47dff72954d9?w=500&q=80" },
  { id: 3, title: "Ovo Ninho com Nutella", description: "Chocolate branco recheado com creme de leite Ninho e Nutella — irresistível!", price: 72, stock: 10, active: true, image: "https://images.unsplash.com/photo-1571506165871-ee72a35bc9d4?w=500&q=80" },
];

/* ─── UTILS ─────────────────────────────────────────────────────────────────── */
const fmt     = n  => `R$ ${Number(n).toFixed(2).replace(".", ",")}`;
const padNum  = n  => `#${String(n).padStart(3, "0")}`;
const dateStr = d  => new Date(d).toLocaleDateString("pt-BR", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit" });

const STATUS = {
  pending:   { label: "Pendente",   color: "#d97706", bg: "#fef3c7", dot: "#f59e0b" },
  confirmed: { label: "Confirmado", color: "#2563eb", bg: "#dbeafe", dot: "#3b82f6" },
  ready:     { label: "Pronto! 🎉", color: "#7c3aed", bg: "#ede9fe", dot: "#8b5cf6" },
  delivered: { label: "Entregue",   color: "#059669", bg: "#d1fae5", dot: "#10b981" },
  cancelled: { label: "Cancelado",  color: "#dc2626", bg: "#fee2e2", dot: "#ef4444" },
};

/* ─── TINY SVG ICONS ────────────────────────────────────────────────────────── */
const Ico = ({ d, s=18 }) => (
  <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    {Array.isArray(d) ? d.map((p,i)=><path key={i} d={p}/>) : <path d={d}/>}
  </svg>
);

/* ════════════════════════════════════════════════════════════════════════════════
   LOGO COMPONENT
════════════════════════════════════════════════════════════════════════════════ */
const GraceliLogo = ({ size = 48 }) => (
  <div style={{ width: size, height: size, borderRadius: "50%", background: "linear-gradient(135deg, #f9c4d4, #e8789a)", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 16px rgba(232,120,154,0.4)", flexShrink: 0 }}>
    <span style={{ fontSize: size * 0.42, lineHeight: 1 }}>🍬</span>
  </div>
);

/* ════════════════════════════════════════════════════════════════════════════════
   CLIENT PAGE
════════════════════════════════════════════════════════════════════════════════ */
function ClientPage({ products, onOrder }) {
  const [cart, setCart]   = useState([]);
  const [form, setForm]   = useState({ name: "", phone: "", note: "" });
  const [step, setStep]   = useState("shop"); // shop | checkout | done
  const [orderNum, setOrderNum] = useState(null);
  const [errors, setErrors]     = useState({});

  const available = products.filter(p => p.active && p.stock > 0);
  const total     = cart.reduce((s, i) => s + i.price * i.qty, 0);

  const addToCart = p => {
    setCart(c => {
      const ex = c.find(x => x.id === p.id);
      if (ex) return ex.qty >= p.stock ? c : c.map(x => x.id===p.id ? {...x, qty: x.qty+1} : x);
      return [...c, { ...p, qty: 1 }];
    });
  };

  const changeQty = (id, delta) => {
    setCart(c => c.map(x => x.id===id ? {...x, qty: Math.max(1, x.qty+delta)} : x).filter(x => !(x.id===id && x.qty+delta < 1)));
  };

  const submit = () => {
    const e = {};
    if (!form.name.trim())  e.name  = "Informe seu nome";
    if (!form.phone.trim()) e.phone = "Informe seu WhatsApp";
    if (cart.length === 0)  return alert("Adicione pelo menos 1 produto!");
    if (Object.keys(e).length) { setErrors(e); return; }
    const num = onOrder({ ...form, items: cart, total });
    setOrderNum(num);
    setStep("done");
  };

  /* DONE SCREEN */
  if (step === "done") return (
    <div style={{ minHeight:"100vh", background:"linear-gradient(135deg,#fff0f5,#ffe4ef)", display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'DM Sans',sans-serif", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:28, padding:"48px 36px", textAlign:"center", maxWidth:400, width:"100%", boxShadow:"0 20px 60px rgba(220,90,130,0.2)" }} className="fadeUp">
        <div style={{ fontSize:72, marginBottom:16, animation:"pulse 2s ease infinite" }}>🎉</div>
        <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, color:"#c94e78", marginBottom:8 }}>Pedido realizado!</h2>
        <div style={{ background:"linear-gradient(135deg,#f9c4d4,#e8789a)", color:"#fff", fontSize:32, fontWeight:900, borderRadius:16, padding:"12px 28px", display:"inline-block", margin:"12px 0 20px", letterSpacing:3, fontFamily:"'DM Sans',sans-serif" }}>
          {padNum(orderNum)}
        </div>
        <p style={{ color:"#9b7580", lineHeight:1.7, marginBottom:28, fontSize:15 }}>
          Obrigada pela preferência! 💕<br/>Entraremos em contato pelo WhatsApp para confirmar seu pedido.
        </p>
        <p style={{ fontSize:13, color:"#c4a8b0", marginBottom:24 }}>Seg a Sab · 10h–22h · Delivery ou retirada</p>
        <button onClick={() => { setCart([]); setForm({name:"",phone:"",note:""}); setStep("shop"); setErrors({}); }}
          style={{ padding:"12px 32px", background:"linear-gradient(135deg,#e8789a,#c94e78)", color:"#fff", border:"none", borderRadius:50, cursor:"pointer", fontWeight:600, fontSize:15, fontFamily:"'DM Sans',sans-serif" }}>
          Fazer outro pedido
        </button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight:"100vh", background:"#fff5f7", fontFamily:"'DM Sans',sans-serif" }}>
      {/* HERO */}
      <div style={{ background:"linear-gradient(160deg, #2d1520 0%, #5c1f38 40%, #c94e78 100%)", color:"#fff", padding:"0 0 48px" }}>
        {/* Top bar */}
        <div style={{ padding:"18px 24px 0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.6)", letterSpacing:2, textTransform:"uppercase" }}>Seg–Sab · 10h às 22h</div>
          <div style={{ fontSize:12, color:"rgba(255,255,255,0.6)" }}>📍 Goiânia, GO</div>
        </div>
        {/* Brand */}
        <div style={{ textAlign:"center", padding:"36px 20px 0" }}>
          <GraceliLogo size={80} />
          <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:"clamp(36px,8vw,52px)", fontWeight:900, marginTop:16, lineHeight:1.1, letterSpacing:"-1px" }}>
            Gracieli Doces
          </h1>
          <p style={{ color:"rgba(255,255,255,0.75)", fontSize:16, marginTop:8, fontStyle:"italic" }}>
            Conquistando paladares desde 2019 🍫
          </p>
          {/* Easter tag */}
          <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(255,255,255,0.15)", borderRadius:50, padding:"8px 20px", marginTop:20, border:"1px solid rgba(255,255,255,0.2)", backdropFilter:"blur(8px)" }}>
            <span style={{ fontSize:20 }}>🐣</span>
            <span style={{ fontSize:14, fontWeight:600, letterSpacing:1 }}>OVOS DE PÁSCOA 2025</span>
          </div>
        </div>
      </div>

      {/* WAVE */}
      <div style={{ height:40, background:"linear-gradient(160deg,#2d1520 0%,#5c1f38 40%,#c94e78 100%)", borderRadius:"0 0 50% 50%/0 0 40px 40px", marginBottom:-2 }}/>

      <div style={{ maxWidth:860, margin:"0 auto", padding:"32px 16px 60px" }}>

        {/* PRODUCTS */}
        <div style={{ display:"flex", alignItems:"baseline", gap:12, marginBottom:28 }}>
          <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:26, color:"#2d1520" }}>Nossos Sabores</h2>
          <span style={{ fontSize:13, color:"#c4a8b0" }}>{available.length} disponíveis</span>
        </div>

        {available.length === 0 ? (
          <div style={{ textAlign:"center", padding:"60px 20px", color:"#c4a8b0", fontSize:18 }}>
            Estoque esgotado por hoje. Volte amanhã! 🐰
          </div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:20, marginBottom:40 }}>
            {available.map((p, i) => {
              const inCart = cart.find(x => x.id === p.id);
              return (
                <div key={p.id} className="product-card" style={{ background:"#fff", borderRadius:20, overflow:"hidden", boxShadow:"0 4px 20px rgba(220,90,130,0.1)", border:"1.5px solid #fce7ef", transition:"all 0.25s", animation:`fadeUp 0.4s ${i*0.07}s both` }}>
                  <div style={{ position:"relative", overflow:"hidden" }}>
                    <img src={p.image} alt={p.title} style={{ width:"100%", height:190, objectFit:"cover", display:"block" }}
                      onError={e => { e.target.src = "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=500&q=80"; }} />
                    <div style={{ position:"absolute", inset:0, background:"linear-gradient(to bottom, transparent 50%, rgba(45,21,32,0.4))" }}/>
                    {p.stock <= 5 && p.stock > 0 && (
                      <div style={{ position:"absolute", top:12, right:12, background:"#f59e0b", color:"#fff", fontSize:11, fontWeight:700, padding:"4px 10px", borderRadius:20, letterSpacing:0.5 }}>
                        Últimas {p.stock}!
                      </div>
                    )}
                    {inCart && (
                      <div style={{ position:"absolute", top:12, left:12, background:"#10b981", color:"#fff", fontSize:12, fontWeight:700, padding:"4px 12px", borderRadius:20 }}>
                        ✓ {inCart.qty} no carrinho
                      </div>
                    )}
                  </div>
                  <div style={{ padding:"16px" }}>
                    <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:17, color:"#2d1520", marginBottom:6 }}>{p.title}</h3>
                    <p style={{ fontSize:13, color:"#9b7580", lineHeight:1.6, marginBottom:14 }}>{p.description}</p>
                    <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <span style={{ fontFamily:"'Playfair Display',serif", fontSize:22, fontWeight:700, color:"#c94e78" }}>{fmt(p.price)}</span>
                      <button className="add-btn" onClick={() => addToCart(p)}
                        style={{ background:"linear-gradient(135deg,#e8789a,#c94e78)", color:"#fff", border:"none", borderRadius:50, padding:"9px 20px", cursor:"pointer", fontWeight:600, fontSize:14, fontFamily:"'DM Sans',sans-serif", transition:"background 0.2s" }}>
                        + Adicionar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CART + FORM */}
        {cart.length > 0 && (
          <div style={{ background:"#fff", borderRadius:24, padding:"28px", boxShadow:"0 8px 40px rgba(220,90,130,0.12)", border:"1.5px solid #fce7ef" }} className="fadeUp">
            {/* Cart header */}
            <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:20 }}>
              <span style={{ fontSize:24 }}>🛒</span>
              <h2 style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:"#2d1520" }}>Seu Carrinho</h2>
            </div>

            {cart.map(item => (
              <div key={item.id} style={{ display:"flex", alignItems:"center", gap:12, padding:"10px 0", borderBottom:"1px solid #fce7ef" }}>
                <img src={item.image} alt={item.title} style={{ width:48, height:48, borderRadius:12, objectFit:"cover", flexShrink:0 }}
                  onError={e => { e.target.src = "https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=100&q=80"; }} />
                <span style={{ flex:1, fontWeight:500, color:"#2d1520", fontSize:14 }}>{item.title}</span>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <button onClick={() => changeQty(item.id, -1)} style={{ width:28, height:28, borderRadius:"50%", border:"1.5px solid #fce7ef", background:"#fff5f7", cursor:"pointer", fontWeight:700, color:"#c94e78", fontSize:16 }}>−</button>
                  <span style={{ fontWeight:700, color:"#2d1520", minWidth:20, textAlign:"center" }}>{item.qty}</span>
                  <button onClick={() => changeQty(item.id, +1)} style={{ width:28, height:28, borderRadius:"50%", border:"1.5px solid #fce7ef", background:"#fff5f7", cursor:"pointer", fontWeight:700, color:"#c94e78", fontSize:16 }}>+</button>
                </div>
                <span style={{ fontWeight:700, color:"#c94e78", minWidth:72, textAlign:"right" }}>{fmt(item.price * item.qty)}</span>
              </div>
            ))}

            <div style={{ display:"flex", justifyContent:"space-between", padding:"16px 0 24px", fontSize:20, fontWeight:800 }}>
              <span style={{ color:"#2d1520", fontFamily:"'Playfair Display',serif" }}>Total</span>
              <span style={{ color:"#c94e78", fontFamily:"'Playfair Display',serif" }}>{fmt(total)}</span>
            </div>

            <div style={{ borderTop:"1.5px solid #fce7ef", paddingTop:24 }}>
              <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:18, color:"#2d1520", marginBottom:16 }}>Seus dados para contato</h3>
              <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
                <div>
                  <input value={form.name} onChange={e => setForm(f => ({...f, name:e.target.value}))}
                    placeholder="Seu nome completo *" style={{ ...IS, borderColor: errors.name ? "#ef4444" : "#fce7ef" }} />
                  {errors.name && <p style={{ color:"#ef4444", fontSize:12, marginTop:4 }}>{errors.name}</p>}
                </div>
                <div>
                  <input value={form.phone} onChange={e => setForm(f => ({...f, phone:e.target.value}))}
                    placeholder="WhatsApp com DDD *" style={{ ...IS, borderColor: errors.phone ? "#ef4444" : "#fce7ef" }} />
                  {errors.phone && <p style={{ color:"#ef4444", fontSize:12, marginTop:4 }}>{errors.phone}</p>}
                </div>
                <textarea value={form.note} onChange={e => setForm(f => ({...f, note:e.target.value}))}
                  placeholder="Alguma observação? (opcional)" style={{ ...IS, height:80, resize:"vertical" }} />
              </div>
              <button onClick={submit}
                style={{ width:"100%", marginTop:20, padding:"16px", background:"linear-gradient(135deg,#e8789a,#c94e78)", color:"#fff", border:"none", borderRadius:16, cursor:"pointer", fontWeight:700, fontSize:17, fontFamily:"'DM Sans',sans-serif", boxShadow:"0 6px 24px rgba(201,78,120,0.35)", letterSpacing:0.5 }}>
                Fazer Pedido 🐣
              </button>
            </div>
          </div>
        )}
      </div>

      {/* FOOTER */}
      <div style={{ background:"#2d1520", color:"rgba(255,255,255,0.6)", textAlign:"center", padding:"24px 20px", fontSize:13 }}>
        <p style={{ color:"#e8789a", fontFamily:"'Playfair Display',serif", fontSize:16, marginBottom:6 }}>Gracieli Doces 🍫</p>
        <p>Conquistando paladares desde 2019 · Goiânia, GO</p>
        <p style={{ marginTop:4 }}>Seg a Sab · 10h às 22h · Delivery ou retirada</p>
      </div>
    </div>
  );
}

/* input style */
const IS = { width:"100%", padding:"13px 16px", borderRadius:12, border:"1.5px solid #fce7ef", fontFamily:"'DM Sans',sans-serif", fontSize:15, background:"#fff9fb", color:"#2d1520" };

/* ════════════════════════════════════════════════════════════════════════════════
   ADMIN APP
════════════════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [view, setView]         = useState("client");
  const [tab, setTab]           = useState("orders");
  const [products, setProducts] = useLS("gd_products", SEED_PRODUCTS);
  const [orders, setOrders]     = useLS("gd_orders", []);
  const [nextId, setNextId]     = useState(() => {
    try { const o = JSON.parse(localStorage.getItem("gd_orders")||"[]"); return o.length ? Math.max(...o.map(x=>x.num))+1 : 1; } catch { return 1; }
  });
  const [selOrder, setSelOrder]   = useState(null);
  const [showPF, setShowPF]       = useState(false);
  const [editP, setEditP]         = useState(null);
  const [filterStatus, setFilter] = useState("all");
  const [searchQ, setSearchQ]     = useState("");

  const addOrder = data => {
    const num = nextId;
    const o = { id: Date.now(), num, ...data, status:"pending", createdAt: new Date().toISOString() };
    const updated = [...orders, o];
    setOrders(updated);
    setNextId(num+1);
    setProducts(products.map(p => {
      const item = data.items.find(i=>i.id===p.id);
      return item ? {...p, stock: Math.max(0, p.stock - item.qty)} : p;
    }));
    return num;
  };

  if (view === "client") {
    return (
      <>
        <FontLink/>
        <div style={{ position:"fixed", bottom:20, right:20, zIndex:999 }}>
          <button onClick={() => setView("admin")}
            style={{ padding:"11px 22px", background:"#2d1520", color:"#fff", border:"none", borderRadius:50, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontWeight:600, fontSize:14, boxShadow:"0 4px 20px rgba(45,21,32,0.4)", display:"flex", alignItems:"center", gap:8 }}>
            ⚙️ Admin
          </button>
        </div>
        <ClientPage products={products} onOrder={addOrder}/>
      </>
    );
  }

  /* ── ADMIN ── */
  const filteredOrders = orders
    .filter(o => filterStatus==="all" || o.status===filterStatus)
    .filter(o => !searchQ || o.name.toLowerCase().includes(searchQ.toLowerCase()) || padNum(o.num).includes(searchQ))
    .sort((a,b) => b.num - a.num);

  const updateStatus = (id, status) => {
    setOrders(orders.map(o => o.id===id ? {...o, status} : o));
    if (selOrder?.id===id) setSelOrder(s => ({...s, status}));
  };

  const totalRevenue = orders.filter(o=>o.status!=="cancelled").reduce((s,o)=>s+o.total, 0);

  return (
    <>
      <FontLink/>
      <div style={{ display:"flex", minHeight:"100vh", fontFamily:"'DM Sans',sans-serif", background:"#faf5f7" }}>

        {/* SIDEBAR */}
        <div style={{ width:220, background:"linear-gradient(180deg,#2d1520 0%,#1a0b12 100%)", color:"#fff", display:"flex", flexDirection:"column", flexShrink:0 }}>
          {/* Brand */}
          <div style={{ padding:"28px 20px 24px", borderBottom:"1px solid rgba(255,255,255,0.08)" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:4 }}>
              <GraceliLogo size={40} />
              <div>
                <div style={{ fontFamily:"'Playfair Display',serif", fontWeight:700, fontSize:15, lineHeight:1.2 }}>Gracieli Doces</div>
                <div style={{ fontSize:11, color:"#e8789a", marginTop:2, letterSpacing:1 }}>ADMIN PANEL</div>
              </div>
            </div>
          </div>

          {/* Nav */}
          <nav style={{ flex:1, padding:"16px 12px", display:"flex", flexDirection:"column", gap:4 }}>
            {[
              { key:"orders",   label:"Pedidos",   icon:"📋" },
              { key:"products", label:"Produtos",  icon:"🍫" },
            ].map(({key,label,icon}) => (
              <button key={key} className="nav-item" onClick={() => setTab(key)}
                style={{ display:"flex", alignItems:"center", gap:10, padding:"10px 14px", background: tab===key ? "linear-gradient(135deg,#e8789a,#c94e78)" : "transparent", border:"none", color:"#fff", cursor:"pointer", borderRadius:10, fontSize:14, fontFamily:"'DM Sans',sans-serif", fontWeight: tab===key ? 600 : 400, textAlign:"left", transition:"all 0.2s" }}>
                <span style={{ fontSize:18 }}>{icon}</span> {label}
                {key==="orders" && orders.filter(o=>o.status==="pending").length > 0 && (
                  <span style={{ marginLeft:"auto", background:"#f59e0b", color:"#fff", borderRadius:50, padding:"1px 7px", fontSize:11, fontWeight:700 }}>
                    {orders.filter(o=>o.status==="pending").length}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Footer */}
          <div style={{ padding:"16px 12px", borderTop:"1px solid rgba(255,255,255,0.08)" }}>
            <button onClick={() => setView("client")}
              style={{ width:"100%", padding:"9px 14px", background:"rgba(232,120,154,0.15)", border:"1px solid rgba(232,120,154,0.3)", color:"#e8789a", borderRadius:10, cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:500 }}>
              🔗 Ver loja
            </button>
          </div>
        </div>

        {/* MAIN */}
        <div style={{ flex:1, overflow:"auto", padding:"32px" }}>

          {/* ── ORDERS TAB ── */}
          {tab === "orders" && (
            <div>
              <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, color:"#2d1520", marginBottom:24 }}>Pedidos</h1>

              {/* Stats */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))", gap:14, marginBottom:28 }}>
                {[
                  { label:"Total", val: orders.length, icon:"📦", color:"#6366f1", bg:"#eef2ff" },
                  { label:"Pendentes", val: orders.filter(o=>o.status==="pending").length, icon:"⏳", color:"#d97706", bg:"#fef3c7" },
                  { label:"Prontos", val: orders.filter(o=>o.status==="ready").length, icon:"🎉", color:"#7c3aed", bg:"#ede9fe" },
                  { label:"Faturamento", val: fmt(totalRevenue), icon:"💰", color:"#059669", bg:"#d1fae5", small:true },
                ].map(s => (
                  <div key={s.label} style={{ background:s.bg, borderRadius:16, padding:"16px", boxShadow:"0 2px 8px rgba(0,0,0,0.04)" }}>
                    <div style={{ fontSize:24, marginBottom:6 }}>{s.icon}</div>
                    <div style={{ fontSize: s.small ? 16 : 24, fontWeight:800, color:s.color, fontFamily:s.small?"'DM Sans',sans-serif":"'Playfair Display',serif" }}>{s.val}</div>
                    <div style={{ fontSize:12, color:s.color, opacity:0.8, marginTop:2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Filters */}
              <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
                <input value={searchQ} onChange={e=>setSearchQ(e.target.value)} placeholder="Buscar por nome ou #número..."
                  style={{ ...IS, flex:1, minWidth:180, padding:"10px 14px" }} />
                <select value={filterStatus} onChange={e=>setFilter(e.target.value)}
                  style={{ ...IS, width:"auto", padding:"10px 14px", cursor:"pointer" }}>
                  <option value="all">Todos os status</option>
                  {Object.entries(STATUS).map(([k,v]) => <option key={k} value={k}>{v.label}</option>)}
                </select>
              </div>

              {/* Orders list */}
              {filteredOrders.length === 0 ? (
                <div style={{ textAlign:"center", padding:"60px 20px", color:"#c4a8b0", fontSize:16 }}>
                  Nenhum pedido encontrado 🐰
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                  {filteredOrders.map(o => {
                    const st = STATUS[o.status];
                    return (
                      <div key={o.id} className="order-card" onClick={() => setSelOrder(o)}
                        style={{ background:"#fff", borderRadius:16, padding:"16px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", cursor:"pointer", border:"1.5px solid #fce7ef", boxShadow:"0 2px 10px rgba(220,90,130,0.06)", transition:"all 0.2s", flexWrap:"wrap", gap:10 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:"#c94e78", minWidth:56 }}>{padNum(o.num)}</div>
                          <div>
                            <div style={{ fontWeight:600, fontSize:15, color:"#2d1520" }}>{o.name}</div>
                            <div style={{ fontSize:12, color:"#9b7580", marginTop:2 }}>📱 {o.phone}</div>
                            <div style={{ fontSize:12, color:"#c4a8b0", marginTop:1 }}>{o.items.map(i=>`${i.title} ×${i.qty}`).join(" · ")}</div>
                          </div>
                        </div>
                        <div style={{ display:"flex", flexDirection:"column", alignItems:"flex-end", gap:6 }}>
                          <div style={{ fontFamily:"'Playfair Display',serif", fontSize:18, fontWeight:700, color:"#c94e78" }}>{fmt(o.total)}</div>
                          <div style={{ padding:"4px 14px", borderRadius:50, background:st.bg, color:st.color, fontSize:12, fontWeight:600 }}>{st.label}</div>
                          <div style={{ fontSize:11, color:"#c4a8b0" }}>{dateStr(o.createdAt)}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ── PRODUCTS TAB ── */}
          {tab === "products" && (
            <div>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:28, flexWrap:"wrap", gap:12 }}>
                <h1 style={{ fontFamily:"'Playfair Display',serif", fontSize:28, color:"#2d1520" }}>Produtos</h1>
                <button onClick={() => { setEditP({ id:Date.now(), title:"", description:"", price:"", stock:10, image:"", active:true }); setShowPF(true); }}
                  style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 22px", background:"linear-gradient(135deg,#e8789a,#c94e78)", color:"#fff", border:"none", borderRadius:50, cursor:"pointer", fontWeight:600, fontSize:14, fontFamily:"'DM Sans',sans-serif", boxShadow:"0 4px 16px rgba(201,78,120,0.3)" }}>
                  + Novo Produto
                </button>
              </div>

              <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:18 }}>
                {products.map(p => (
                  <div key={p.id} style={{ background:"#fff", borderRadius:20, overflow:"hidden", boxShadow:"0 4px 16px rgba(220,90,130,0.08)", border:"1.5px solid #fce7ef", opacity: p.active ? 1 : 0.55, transition:"opacity 0.2s" }}>
                    <div style={{ position:"relative" }}>
                      <img src={p.image||"https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400&q=80"} alt={p.title}
                        style={{ width:"100%", height:150, objectFit:"cover" }}
                        onError={e => { e.target.src="https://images.unsplash.com/photo-1606312619070-d48b4c652a52?w=400&q=80"; }} />
                      <div style={{ position:"absolute", top:10, right:10, background: p.active ? "#10b981" : "#6b7280", color:"#fff", fontSize:11, fontWeight:700, padding:"3px 10px", borderRadius:50 }}>
                        {p.active ? "Ativo" : "Inativo"}
                      </div>
                    </div>
                    <div style={{ padding:16 }}>
                      <h3 style={{ fontFamily:"'Playfair Display',serif", fontSize:16, color:"#2d1520", marginBottom:4 }}>{p.title || "Sem título"}</h3>
                      <p style={{ fontSize:13, color:"#9b7580", lineHeight:1.5, marginBottom:12, minHeight:38 }}>{p.description}</p>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:14 }}>
                        <span style={{ fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:"#c94e78" }}>{fmt(p.price||0)}</span>
                        <span style={{ fontSize:13, fontWeight:600, padding:"3px 12px", borderRadius:50, background: p.stock>5 ? "#d1fae5" : p.stock>0 ? "#fef3c7" : "#fee2e2", color: p.stock>5 ? "#065f46" : p.stock>0 ? "#92400e" : "#991b1b" }}>
                          {p.stock} un.
                        </span>
                      </div>
                      <div style={{ display:"flex", gap:8 }}>
                        <button onClick={() => { setEditP({...p}); setShowPF(true); }}
                          style={{ flex:1, padding:"8px", background:"#fff5f7", border:"1.5px solid #fce7ef", borderRadius:10, cursor:"pointer", color:"#c94e78", fontWeight:600, fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>
                          ✏️ Editar
                        </button>
                        <button onClick={() => setProducts(products.map(x=>x.id===p.id ? {...x,active:!x.active} : x))}
                          style={{ flex:1, padding:"8px", background:"#f4f4f5", border:"1.5px solid #e5e7eb", borderRadius:10, cursor:"pointer", color:"#374151", fontWeight:600, fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>
                          {p.active ? "⏸ Pausar" : "▶ Ativar"}
                        </button>
                        <button onClick={() => { if(window.confirm("Excluir produto?")) setProducts(products.filter(x=>x.id!==p.id)); }}
                          style={{ padding:"8px 10px", background:"#fee2e2", border:"1.5px solid #fecaca", borderRadius:10, cursor:"pointer", color:"#dc2626" }}>
                          🗑
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── ORDER DETAIL MODAL ── */}
        {selOrder && (
          <div style={{ position:"fixed", inset:0, background:"rgba(45,21,32,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:20, backdropFilter:"blur(4px)" }}
            onClick={() => setSelOrder(null)}>
            <div style={{ background:"#fff", borderRadius:24, width:"100%", maxWidth:460, maxHeight:"90vh", overflow:"auto", boxShadow:"0 24px 80px rgba(45,21,32,0.3)" }} onClick={e=>e.stopPropagation()}>
              <div style={{ padding:"20px 24px 16px", borderBottom:"1.5px solid #fce7ef", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ fontFamily:"'Playfair Display',serif", fontSize:22, color:"#2d1520", fontWeight:700 }}>Pedido {padNum(selOrder.num)}</div>
                  <div style={{ fontSize:13, color:"#9b7580", marginTop:2 }}>{dateStr(selOrder.createdAt)}</div>
                </div>
                <button onClick={() => setSelOrder(null)} style={{ background:"#fff5f7", border:"none", borderRadius:50, width:36, height:36, cursor:"pointer", fontSize:18, color:"#c94e78", fontWeight:700 }}>×</button>
              </div>
              <div style={{ padding:"20px 24px 28px" }}>
                <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
                  {[["👤 Cliente", selOrder.name], ["📱 WhatsApp", selOrder.phone]].map(([k,v]) => (
                    <div key={k} style={{ background:"#fff5f7", borderRadius:12, padding:"12px 14px" }}>
                      <div style={{ fontSize:11, color:"#9b7580", marginBottom:4 }}>{k}</div>
                      <div style={{ fontWeight:600, color:"#2d1520", fontSize:14 }}>{v}</div>
                    </div>
                  ))}
                </div>
                {selOrder.note && (
                  <div style={{ background:"#fef9c3", borderRadius:12, padding:"12px 14px", marginBottom:16, fontSize:14, color:"#713f12" }}>
                    <b>📝 Obs:</b> {selOrder.note}
                  </div>
                )}
                <div style={{ marginBottom:4, fontWeight:600, color:"#2d1520", fontSize:14 }}>Itens do pedido:</div>
                {selOrder.items.map(i => (
                  <div key={i.id} style={{ display:"flex", justifyContent:"space-between", padding:"8px 0", borderBottom:"1px solid #fce7ef", fontSize:14 }}>
                    <span style={{ color:"#2d1520" }}>{i.title} <span style={{ color:"#9b7580" }}>×{i.qty}</span></span>
                    <span style={{ fontWeight:700, color:"#c94e78" }}>{fmt(i.price*i.qty)}</span>
                  </div>
                ))}
                <div style={{ display:"flex", justifyContent:"space-between", padding:"14px 0 0", fontFamily:"'Playfair Display',serif", fontSize:20, fontWeight:700, color:"#c94e78" }}>
                  <span>Total</span><span>{fmt(selOrder.total)}</span>
                </div>

                <div style={{ marginTop:20 }}>
                  <div style={{ fontWeight:600, color:"#2d1520", fontSize:14, marginBottom:10 }}>Atualizar status:</div>
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8 }}>
                    {Object.entries(STATUS).map(([k,v]) => (
                      <button key={k} onClick={() => updateStatus(selOrder.id, k)}
                        style={{ padding:"8px 16px", borderRadius:50, border:"none", cursor:"pointer", fontFamily:"'DM Sans',sans-serif", fontSize:13, fontWeight:600, background: selOrder.status===k ? v.dot : v.bg, color: selOrder.status===k ? "#fff" : v.color, transition:"all 0.15s" }}>
                        {v.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── PRODUCT FORM MODAL ── */}
        {showPF && editP && (
          <div style={{ position:"fixed", inset:0, background:"rgba(45,21,32,0.6)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:200, padding:20, backdropFilter:"blur(4px)" }}
            onClick={() => setShowPF(false)}>
            <div style={{ background:"#fff", borderRadius:24, width:"100%", maxWidth:460, maxHeight:"90vh", overflow:"auto", boxShadow:"0 24px 80px rgba(45,21,32,0.3)" }} onClick={e=>e.stopPropagation()}>
              <div style={{ padding:"20px 24px 16px", borderBottom:"1.5px solid #fce7ef", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div style={{ fontFamily:"'Playfair Display',serif", fontSize:20, color:"#2d1520", fontWeight:700 }}>
                  {products.find(p=>p.id===editP.id) ? "Editar Produto" : "Novo Produto"}
                </div>
                <button onClick={() => setShowPF(false)} style={{ background:"#fff5f7", border:"none", borderRadius:50, width:36, height:36, cursor:"pointer", fontSize:18, color:"#c94e78", fontWeight:700 }}>×</button>
              </div>
              <div style={{ padding:"20px 24px 28px", display:"flex", flexDirection:"column", gap:14 }}>
                {[
                  { label:"Título do produto *", key:"title", placeholder:"Ex: Ovo Trufado de Morango" },
                  { label:"URL da foto", key:"image", placeholder:"https://..." },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#2d1520", marginBottom:6 }}>{f.label}</label>
                    <input value={editP[f.key]} onChange={e=>setEditP(p=>({...p,[f.key]:e.target.value}))} placeholder={f.placeholder} style={IS}/>
                  </div>
                ))}
                <div>
                  <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#2d1520", marginBottom:6 }}>Descrição *</label>
                  <textarea value={editP.description} onChange={e=>setEditP(p=>({...p,description:e.target.value}))} placeholder="Descreva o sabor e recheio..." style={{ ...IS, height:80, resize:"vertical" }}/>
                </div>
                <div style={{ display:"flex", gap:12 }}>
                  <div style={{ flex:1 }}>
                    <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#2d1520", marginBottom:6 }}>Preço (R$) *</label>
                    <input type="number" min="0" step="0.01" value={editP.price} onChange={e=>setEditP(p=>({...p,price:e.target.value}))} placeholder="45.00" style={IS}/>
                  </div>
                  <div style={{ flex:1 }}>
                    <label style={{ display:"block", fontSize:13, fontWeight:600, color:"#2d1520", marginBottom:6 }}>Estoque *</label>
                    <input type="number" min="0" value={editP.stock} onChange={e=>setEditP(p=>({...p,stock:Number(e.target.value)}))} placeholder="10" style={IS}/>
                  </div>
                </div>
                <label style={{ display:"flex", alignItems:"center", gap:10, cursor:"pointer", fontSize:14, color:"#2d1520" }}>
                  <input type="checkbox" checked={editP.active} onChange={e=>setEditP(p=>({...p,active:e.target.checked}))} style={{ width:16, height:16, accentColor:"#c94e78" }}/>
                  Produto visível para clientes
                </label>
                {editP.image && (
                  <div style={{ borderRadius:12, overflow:"hidden" }}>
                    <img src={editP.image} alt="Preview" style={{ width:"100%", height:140, objectFit:"cover" }}
                      onError={e=>{e.target.style.display="none";}}/>
                  </div>
                )}
                <button onClick={() => {
                  if (!editP.title || !editP.price) return alert("Preencha título e preço!");
                  const exists = products.find(p=>p.id===editP.id);
                  if (exists) setProducts(products.map(p=>p.id===editP.id?editP:p));
                  else setProducts([...products, editP]);
                  setShowPF(false);
                }} style={{ padding:"14px", background:"linear-gradient(135deg,#e8789a,#c94e78)", color:"#fff", border:"none", borderRadius:14, cursor:"pointer", fontWeight:700, fontSize:16, fontFamily:"'DM Sans',sans-serif", boxShadow:"0 6px 20px rgba(201,78,120,0.3)" }}>
                  Salvar Produto 💕
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
