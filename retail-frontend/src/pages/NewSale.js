import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const fmt = n => `Rs. ${Number(n).toLocaleString()}`;
const DISCOUNT = 0.05;

export default function NewSale() {
  const [products,   setProducts]   = useState([]);
  const [customers,  setCustomers]  = useState([]);
  const [cart,       setCart]       = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [search,     setSearch]     = useState('');
  const [msg,        setMsg]        = useState({ text:'', type:'' });
  const [loading,    setLoading]    = useState(false);
  const navigate = useNavigate();

  const flash = (text, type='success') => { setMsg({text,type}); setTimeout(()=>setMsg({text:'',type:''}),4000); };

  useEffect(() => {
    Promise.all([api.get('/products'), api.get('/customers')]).then(([p,c]) => {
      setProducts(p.data); setCustomers(c.data);
    });
  }, []);

  const isRegistered = !!customerId;
  const discountRate = isRegistered ? DISCOUNT : 0;

  const filtered = products.filter(p =>
    p.product_name.toLowerCase().includes(search.toLowerCase()) ||
    p.category_name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = product => {
    const existing = cart.find(c => c.product_id === product.product_id);
    if (existing) {
      if (existing.quantity >= product.quantity_in_stock) { flash('Not enough stock!', 'error'); return; }
      setCart(cart.map(c => c.product_id === product.product_id ? { ...c, quantity: c.quantity + 1 } : c));
    } else {
      if (product.quantity_in_stock === 0) { flash('Out of stock!', 'error'); return; }
      setCart([...cart, { ...product, quantity: 1 }]);
    }
  };

  const removeFromCart = id => setCart(cart.filter(c => c.product_id !== id));

  const updateQty = (id, qty) => {
    const n = parseInt(qty);
    if (isNaN(n) || n <= 0) return removeFromCart(id);
    const prod = products.find(p => p.product_id === id);
    if (n > prod.quantity_in_stock) { flash('Exceeds available stock!', 'error'); return; }
    setCart(cart.map(c => c.product_id === id ? { ...c, quantity: n } : c));
  };

  const subtotal = cart.reduce((sum, c) => sum + c.unit_price * c.quantity, 0);
  const discountAmt = subtotal * discountRate;
  const total = subtotal - discountAmt;

  const submitSale = async () => {
    if (!cart.length) { flash('Add at least one item', 'error'); return; }
    setLoading(true);
    try {
      const res = await api.post('/sales', {
        customer_id: customerId || null,
        items: cart.map(c => ({ product_id: c.product_id, quantity: c.quantity }))
      });
      flash(`✅ Sale #${res.data.sale_id} created! Total: ${fmt(res.data.total)}${res.data.discount_applied !== 'None' ? ` (${res.data.discount_applied} discount applied)` : ''}`);
      setCart([]); setCustomerId('');
      setTimeout(() => navigate('/sales'), 2000);
    } catch (err) {
      flash(err.response?.data?.error || 'Error creating sale', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="content">
      <h1 className="page-title">New Sale</h1>
      <p className="page-sub">Registered customers receive a 5% discount automatically</p>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:20, alignItems:'start' }}>
        {/* Left: Product picker */}
        <div>
          {/* Customer selector */}
          <div className="card" style={{ marginBottom:14, padding:'14px 16px' }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ fontWeight:600, fontSize:13, minWidth:100 }}>👤 Customer</div>
              <select className="form-input" value={customerId} onChange={e => setCustomerId(e.target.value)}
                style={{ flex:1 }}>
                <option value="">Guest (no discount)</option>
                {customers.map(c => (
                  <option key={c.customer_id} value={c.customer_id}>
                    {c.first_name} {c.last_name} — {c.email || c.phone}
                  </option>
                ))}
              </select>
              {isRegistered && (
                <span className="badge badge-green" style={{ whiteSpace:'nowrap' }}>🎉 5% Discount</span>
              )}
            </div>
          </div>

          {/* Product search */}
          <div className="card">
            <input className="form-input" placeholder="Search products or category..."
              value={search} onChange={e => setSearch(e.target.value)}
              style={{ marginBottom:14 }} />
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(190px,1fr))', gap:10 }}>
              {filtered.map(p => (
                <div key={p.product_id}
                  onClick={() => addToCart(p)}
                  style={{ border:'1px solid #e2e8f0', borderRadius:8, padding:'12px', cursor: p.quantity_in_stock===0?'not-allowed':'pointer',
                    opacity:p.quantity_in_stock===0?.5:1, transition:'all .15s', background:'white',
                    position:'relative' }}
                  onMouseEnter={e => { if(p.quantity_in_stock>0) e.currentTarget.style.borderColor='#2563eb'; }}
                  onMouseLeave={e => e.currentTarget.style.borderColor='#e2e8f0'}>
                  <div style={{ marginBottom:4 }}><span className="tag">{p.category_name}</span></div>
                  <div style={{ fontWeight:600, fontSize:13, marginBottom:6 }}>{p.product_name}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div>
                      <div style={{ fontWeight:700, color:'#2563eb', fontSize:14 }}>{fmt(p.unit_price)}</div>
                      {isRegistered && (
                        <div style={{ fontSize:11, color:'#16a34a' }}>
                          After discount: {fmt(p.unit_price * (1 - DISCOUNT))}
                        </div>
                      )}
                    </div>
                    <span style={{ fontSize:11, color:p.quantity_in_stock<=10?'#dc2626':'#64748b' }}>
                      {p.quantity_in_stock===0?'Out of stock':`${p.quantity_in_stock} left`}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Cart */}
        <div className="card" style={{ position:'sticky', top:76 }}>
          <h3 style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>🛒 Cart</h3>

          {cart.length === 0 ? (
            <div style={{ textAlign:'center', padding:'28px 0', color:'#94a3b8' }}>
              <div style={{ fontSize:32, marginBottom:8 }}>🛍️</div>
              <p style={{ fontSize:13 }}>Click products to add them</p>
            </div>
          ) : (
            <>
              {cart.map(item => (
                <div key={item.product_id} style={{ borderBottom:'1px solid #f1f5f9', paddingBottom:10, marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
                    <span style={{ fontWeight:600, fontSize:13, flex:1, lineHeight:1.3 }}>{item.product_name}</span>
                    <button onClick={() => removeFromCart(item.product_id)}
                      style={{ background:'none', border:'none', color:'#dc2626', cursor:'pointer', fontSize:14, padding:'0 4px', marginLeft:4 }}>✕</button>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                      <button onClick={() => updateQty(item.product_id, item.quantity-1)}
                        style={{ width:24, height:24, borderRadius:4, border:'1px solid #e2e8f0', background:'white', cursor:'pointer' }}>−</button>
                      <input type="number" value={item.quantity} min="1"
                        onChange={e => updateQty(item.product_id, e.target.value)}
                        style={{ width:40, textAlign:'center', border:'1px solid #e2e8f0', borderRadius:4, padding:'2px 0', fontSize:13 }} />
                      <button onClick={() => updateQty(item.product_id, item.quantity+1)}
                        style={{ width:24, height:24, borderRadius:4, border:'1px solid #e2e8f0', background:'white', cursor:'pointer' }}>+</button>
                    </div>
                    <span style={{ fontWeight:700, color:'#16a34a', fontSize:13 }}>
                      {fmt(item.unit_price * (1-discountRate) * item.quantity)}
                    </span>
                  </div>
                </div>
              ))}

              {/* Totals */}
              <div style={{ paddingTop:10, borderTop:'1px solid #e2e8f0' }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ color:'#64748b', fontSize:13 }}>Subtotal</span>
                  <span style={{ fontSize:13 }}>{fmt(subtotal)}</span>
                </div>
                {isRegistered && (
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                    <span style={{ color:'#16a34a', fontSize:13 }}>🎉 5% Customer Discount</span>
                    <span style={{ color:'#16a34a', fontSize:13 }}>− {fmt(discountAmt)}</span>
                  </div>
                )}
                <div style={{ display:'flex', justifyContent:'space-between', marginTop:8, paddingTop:8, borderTop:'2px solid #e2e8f0', marginBottom:14 }}>
                  <span style={{ fontWeight:700, fontSize:15 }}>Total</span>
                  <span style={{ fontWeight:800, fontSize:18, color:'#16a34a' }}>{fmt(total)}</span>
                </div>
                <button className="btn btn-success" style={{ width:'100%', justifyContent:'center' }}
                  onClick={submitSale} disabled={loading}>
                  {loading ? 'Processing...' : `✓ Complete Sale (${cart.length} item${cart.length>1?'s':''})`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
