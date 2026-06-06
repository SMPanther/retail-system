import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const fmt = n => `Rs. ${Number(n).toLocaleString()}`;

export default function NewSale() {
  const [products,  setProducts]  = useState([]);
  const [customers, setCustomers] = useState([]);
  const [cart,      setCart]      = useState([]);
  const [customerId, setCustomerId] = useState('');
  const [search,    setSearch]    = useState('');
  const [msg,       setMsg]       = useState({ text:'', type:'' });
  const [loading,   setLoading]   = useState(false);
  const navigate = useNavigate();

  const flash = (text, type='success') => { setMsg({text,type}); setTimeout(()=>setMsg({text:'',type:''}),3000); };

  useEffect(() => {
    Promise.all([api.get('/products'), api.get('/customers')]).then(([p,c]) => {
      setProducts(p.data); setCustomers(c.data);
    });
  }, []);

  const filtered = products.filter(p =>
    p.product_name.toLowerCase().includes(search.toLowerCase()) ||
    p.category_name.toLowerCase().includes(search.toLowerCase())
  );

  const addToCart = (product) => {
    const existing = cart.find(c => c.product_id === product.product_id);
    if (existing) {
      if (existing.quantity >= product.quantity_in_stock) {
        flash('Not enough stock!', 'error'); return;
      }
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
    if (n > prod.quantity_in_stock) { flash('Exceeds stock!', 'error'); return; }
    setCart(cart.map(c => c.product_id === id ? { ...c, quantity: n } : c));
  };

  const total = cart.reduce((sum, c) => sum + c.unit_price * c.quantity, 0);

  const submitSale = async () => {
    if (!cart.length) { flash('Add at least one item', 'error'); return; }
    setLoading(true);
    try {
      const res = await api.post('/sales', {
        customer_id: customerId || null,
        items: cart.map(c => ({ product_id: c.product_id, quantity: c.quantity }))
      });
      flash(`Sale #${res.data.sale_id} created! Total: ${fmt(total)}`);
      setCart([]); setCustomerId('');
      setTimeout(() => navigate('/sales'), 1500);
    } catch (err) {
      flash(err.response?.data?.error || 'Error', 'error');
    } finally { setLoading(false); }
  };

  return (
    <div className="content">
      <h1 className="page-title">New Sale</h1>
      <p className="page-sub">Process a sale — uses transaction + sp_add_sale_item logic</p>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      <div style={{ display:'grid', gridTemplateColumns:'1fr 340px', gap:20, alignItems:'start' }}>
        {/* Product Picker */}
        <div>
          <div className="card" style={{ marginBottom:16 }}>
            <div style={{ display:'flex', gap:10, alignItems:'center', marginBottom:14 }}>
              <input className="form-input" placeholder="Search products..."
                value={search} onChange={e => setSearch(e.target.value)} />
              <div className="form-group" style={{ marginBottom:0, minWidth:200 }}>
                <select className="form-input" value={customerId} onChange={e => setCustomerId(e.target.value)}>
                  <option value="">Guest (no customer)</option>
                  {customers.map(c => (
                    <option key={c.customer_id} value={c.customer_id}>
                      {c.first_name} {c.last_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:10 }}>
              {filtered.map(p => (
                <div key={p.product_id}
                  onClick={() => addToCart(p)}
                  style={{ border:'1px solid #e2e8f0', borderRadius:8, padding:'12px', cursor:'pointer',
                    opacity: p.quantity_in_stock===0 ? .5 : 1,
                    transition:'all .2s', background:'white' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor='#2563eb'}
                  onMouseLeave={e => e.currentTarget.style.borderColor='#e2e8f0'}>
                  <div style={{ fontSize:11, color:'#64748b', marginBottom:4 }}>
                    <span className="tag">{p.category_name}</span>
                  </div>
                  <div style={{ fontWeight:600, fontSize:13, marginBottom:4 }}>{p.product_name}</div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontWeight:700, color:'#2563eb' }}>{fmt(p.unit_price)}</span>
                    <span style={{ fontSize:11, color: p.quantity_in_stock<=10?'#dc2626':'#64748b' }}>
                      Stock: {p.quantity_in_stock}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Cart */}
        <div className="card" style={{ position:'sticky', top:76 }}>
          <h3 style={{ fontSize:16, fontWeight:700, marginBottom:14 }}>🛒 Cart</h3>
          {cart.length === 0 ? (
            <div style={{ textAlign:'center', padding:'24px 0', color:'#94a3b8' }}>
              <div style={{ fontSize:32, marginBottom:8 }}>🛍️</div>
              <p>Click products to add</p>
            </div>
          ) : (
            <>
              {cart.map(item => (
                <div key={item.product_id} style={{ borderBottom:'1px solid #f1f5f9', paddingBottom:10, marginBottom:10 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <span style={{ fontWeight:600, fontSize:13, flex:1 }}>{item.product_name}</span>
                    <button onClick={() => removeFromCart(item.product_id)}
                      style={{ background:'none', border:'none', color:'#dc2626', cursor:'pointer', fontSize:14, padding:'0 4px' }}>✕</button>
                  </div>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginTop:6 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <button onClick={() => updateQty(item.product_id, item.quantity-1)}
                        style={{ width:24, height:24, borderRadius:4, border:'1px solid #e2e8f0', background:'white', cursor:'pointer', fontSize:14 }}>−</button>
                      <input type="number" value={item.quantity} min="1"
                        onChange={e => updateQty(item.product_id, e.target.value)}
                        style={{ width:44, textAlign:'center', border:'1px solid #e2e8f0', borderRadius:4, padding:'2px 0', fontSize:13 }} />
                      <button onClick={() => updateQty(item.product_id, item.quantity+1)}
                        style={{ width:24, height:24, borderRadius:4, border:'1px solid #e2e8f0', background:'white', cursor:'pointer', fontSize:14 }}>+</button>
                    </div>
                    <span style={{ fontWeight:700, color:'#16a34a' }}>{fmt(item.unit_price * item.quantity)}</span>
                  </div>
                </div>
              ))}
              <div style={{ borderTop:'2px solid #e2e8f0', paddingTop:12, marginTop:4 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:14 }}>
                  <span style={{ fontWeight:700, fontSize:15 }}>Total</span>
                  <span style={{ fontWeight:800, fontSize:18, color:'#16a34a' }}>{fmt(total)}</span>
                </div>
                <button className="btn btn-success" style={{ width:'100%', justifyContent:'center' }}
                  onClick={submitSale} disabled={loading}>
                  {loading ? 'Processing...' : `✓ Complete Sale (${cart.length} items)`}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
