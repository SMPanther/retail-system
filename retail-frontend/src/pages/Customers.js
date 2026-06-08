import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const fmt = n => n ? `Rs. ${Number(n).toLocaleString()}` : 'Rs. 0';

export default function Customers() {
  const [customers,    setCustomers]    = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [showAdd,      setShowAdd]      = useState(false);
  const [tab,          setTab]          = useState('all');
  const [search,       setSearch]       = useState('');
  const [msg,          setMsg]          = useState({ text:'', type:'' });
  const [form,         setForm]         = useState({ first_name:'', last_name:'', email:'', phone:'', address:'' });
  const [historyModal, setHistoryModal] = useState(null);
  const [history,      setHistory]      = useState([]);
  const [globalDiscount, setGlobalDiscount] = useState(5);
  const [discountEdit,   setDiscountEdit]   = useState(false);
  const [newDiscount,    setNewDiscount]    = useState('');

  const flash = (text, type='success') => { setMsg({text,type}); setTimeout(()=>setMsg({text:'',type:''}),3500); };

  const load = async () => {
    const [c, t, d] = await Promise.all([
      api.get('/customers'), api.get('/customers/top'),
      api.get('/customers/settings/discount'),
    ]);
    setCustomers(c.data); setTopCustomers(t.data);
    setGlobalDiscount(d.data.discount); setNewDiscount(d.data.discount);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const addCustomer = async e => {
    e.preventDefault();
    try {
      await api.post('/customers', form);
      flash('Customer added!');
      setShowAdd(false);
      setForm({ first_name:'', last_name:'', email:'', phone:'', address:'' });
      load();
    } catch (err) { flash(err.response?.data?.error || 'Error', 'error'); }
  };

  const saveDiscount = async () => {
    try {
      await api.patch('/customers/settings/discount', { discount: Number(newDiscount) });
      flash(`Global discount updated to ${newDiscount}%`);
      setDiscountEdit(false); setGlobalDiscount(Number(newDiscount));
    } catch (err) { flash(err.response?.data?.error || 'Error', 'error'); }
  };

  const openHistory = async customer => {
    setHistoryModal(customer);
    const res = await api.get(`/customers/${customer.customer_id}/history`);
    setHistory(res.data);
  };

  const filtered = customers.filter(c => {
    const name = `${c.first_name} ${c.last_name}`.toLowerCase();
    return name.includes(search.toLowerCase()) || (c.email||'').toLowerCase().includes(search.toLowerCase());
  });

  if (loading) return <div className="loading">Loading customers...</div>;

  return (
    <div className="content">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
        <div>
          <h1 className="page-title">Customers</h1>
          <p className="page-sub">{customers.length} registered customers</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? '✕ Cancel' : '+ Add Customer'}
        </button>
      </div>

      {/* Global Discount Setting */}
      <div className="card" style={{ marginBottom:16, borderColor:'#86efac', padding:'14px 18px' }}>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', flexWrap:'wrap', gap:10 }}>
          <div>
            <div style={{ fontWeight:700, fontSize:14 }}>🎉 Registered Customer Discount</div>
            <div style={{ color:'#64748b', fontSize:12, marginTop:2 }}>
              Applied automatically to all registered customer purchases
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            {discountEdit ? (
              <>
                <input className="form-input" type="number" min="0" max="100" step="0.5"
                  value={newDiscount} onChange={e => setNewDiscount(e.target.value)}
                  style={{ width:80 }} />
                <span style={{ color:'#64748b' }}>%</span>
                <button className="btn btn-success btn-sm" onClick={saveDiscount}>Save</button>
                <button className="btn btn-outline btn-sm" onClick={() => { setDiscountEdit(false); setNewDiscount(globalDiscount); }}>Cancel</button>
              </>
            ) : (
              <>
                <span style={{ fontSize:28, fontWeight:800, color:'#16a34a', fontFamily:'Plus Jakarta Sans,sans-serif' }}>{globalDiscount}%</span>
                <button className="btn btn-outline btn-sm" onClick={() => setDiscountEdit(true)}>Edit</button>
              </>
            )}
          </div>
        </div>
      </div>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {showAdd && (
        <div className="card" style={{ marginBottom:16, borderColor:'#bfdbfe' }}>
          <h3 style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>Add Customer</h3>
          <form onSubmit={addCustomer}>
            <div className="form-grid">
              <div className="form-group"><label>First Name</label>
                <input className="form-input" value={form.first_name}
                  onChange={e => setForm({...form,first_name:e.target.value})} required /></div>
              <div className="form-group"><label>Last Name</label>
                <input className="form-input" value={form.last_name}
                  onChange={e => setForm({...form,last_name:e.target.value})} required /></div>
              <div className="form-group"><label>Email</label>
                <input className="form-input" type="email" value={form.email}
                  onChange={e => setForm({...form,email:e.target.value})} /></div>
              <div className="form-group"><label>Phone</label>
                <input className="form-input" value={form.phone}
                  onChange={e => setForm({...form,phone:e.target.value})} /></div>
            </div>
            <div className="form-group"><label>Address</label>
              <input className="form-input" value={form.address}
                onChange={e => setForm({...form,address:e.target.value})} /></div>
            <button type="submit" className="btn btn-primary btn-sm">Add Customer</button>
          </form>
        </div>
      )}

      <div style={{ display:'flex', gap:6, marginBottom:16 }}>
        {['all','top'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding:'6px 16px', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer',
              background:tab===t?'#2563eb':'white', color:tab===t?'white':'#64748b',
              border:tab===t?'1px solid #2563eb':'1px solid #e2e8f0' }}>
            {t==='all'?`All (${customers.length})`:`⭐ Above Average (${topCustomers.length})`}
          </button>
        ))}
      </div>

      {tab==='top' && (
        <div className="card" style={{ marginBottom:16 }}>
          <div className="section-title">⭐ Above Average Spenders</div>
          <p style={{ color:'#64748b', fontSize:11, marginBottom:12, fontFamily:'monospace' }}>
            WHERE total_spent &gt; (SELECT AVG(total_amount) FROM Sale WHERE customer_id IS NOT NULL)
          </p>
          <table><thead><tr><th>Customer</th><th>Orders</th><th>Total Spent</th><th>Last Purchase</th></tr></thead>
            <tbody>{topCustomers.map((c,i)=>(
              <tr key={i}>
                <td style={{ fontWeight:600 }}>{c.customer_name}</td>
                <td>{c.total_orders}</td>
                <td style={{ fontWeight:700, color:'#16a34a' }}>{fmt(c.total_spent)}</td>
                <td style={{ color:'#64748b' }}>{new Date(c.last_purchase).toLocaleDateString()}</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}

      {tab==='all' && (
        <>
          <input className="form-input" style={{ maxWidth:280, marginBottom:14 }}
            placeholder="Search by name or email..." value={search} onChange={e => setSearch(e.target.value)} />
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <div className="table-wrap">
              <table>
                <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Orders</th><th>Total Spent</th><th>Discount</th><th>Registered</th><th></th></tr></thead>
                <tbody>{filtered.map(c=>(
                  <tr key={c.customer_id}>
                    <td style={{ fontWeight:600 }}>{c.first_name} {c.last_name}</td>
                    <td style={{ color:'#64748b', fontSize:12 }}>{c.email||'—'}</td>
                    <td style={{ color:'#64748b', fontSize:12 }}>{c.phone||'—'}</td>
                    <td>{c.total_orders||0}</td>
                    <td style={{ fontWeight:600, color:'#16a34a' }}>{fmt(c.total_spent)}</td>
                    <td><span className="badge badge-green">{globalDiscount}% off</span></td>
                    <td style={{ color:'#64748b', fontSize:12 }}>{new Date(c.registration_date).toLocaleDateString()}</td>
                    <td><button className="btn btn-outline btn-sm" onClick={() => openHistory(c)}>History</button></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Customer History Modal */}
      {historyModal && (
        <div className="overlay" onClick={() => setHistoryModal(null)}>
          <div className="modal" style={{ maxWidth:640 }} onClick={e=>e.stopPropagation()}>
            <h3>Purchase History</h3>
            <p className="modal-sub">{historyModal.first_name} {historyModal.last_name} · {history.length} orders</p>
            {history.length===0 ? (
              <p style={{ color:'#94a3b8' }}>No purchases yet</p>
            ) : history.map(sale => (
              <div key={sale.sale_id} style={{ marginBottom:16, border:'1px solid #e2e8f0', borderRadius:8, overflow:'hidden' }}>
                <div style={{ background:'#f8fafc', padding:'8px 14px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                  <span style={{ fontWeight:700, fontSize:13 }}>Bill #{sale.sale_id}</span>
                  <span style={{ color:'#64748b', fontSize:12 }}>{new Date(sale.sale_date).toLocaleString()}</span>
                  <span style={{ fontWeight:700, color:'#16a34a' }}>{fmt(sale.total_amount)}</span>
                </div>
                <table style={{ width:'100%', fontSize:12 }}>
                  <thead><tr><th>Product</th><th>Category</th><th>Qty</th><th>Price</th><th>Subtotal</th></tr></thead>
                  <tbody>{sale.items.map((item,i)=>(
                    <tr key={i}>
                      <td style={{ fontWeight:600 }}>{item.product_name}</td>
                      <td><span className="tag" style={{ fontSize:10 }}>{item.category_name}</span></td>
                      <td>{item.quantity}</td>
                      <td style={{ color:'#64748b' }}>{fmt(item.unit_price)}</td>
                      <td style={{ color:'#16a34a', fontWeight:600 }}>{fmt(item.quantity*item.unit_price)}</td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            ))}
            <button className="btn btn-outline" style={{ marginTop:8 }} onClick={() => setHistoryModal(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
