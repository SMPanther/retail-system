import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const fmt = n => `Rs. ${Number(n).toLocaleString()}`;

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showAdd,   setShowAdd]   = useState(false);
  const [search,    setSearch]    = useState('');
  const [msg,       setMsg]       = useState({ text:'', type:'' });
  const [form,      setForm]      = useState({ supplier_name:'', contact_person:'', phone:'', email:'', address:'' });
  const [historyModal, setHistoryModal] = useState(null);
  const [purchases,    setPurchases]    = useState([]);
  const { user } = useAuth();

  const flash = (text, type='success') => { setMsg({text,type}); setTimeout(()=>setMsg({text:'',type:''}),3000); };
  const load = () => api.get('/suppliers').then(r => { setSuppliers(r.data); setLoading(false); });
  useEffect(() => { load(); }, []);

  const addSupplier = async e => {
    e.preventDefault();
    try {
      await api.post('/suppliers', form);
      flash('Supplier added!'); setShowAdd(false);
      setForm({ supplier_name:'', contact_person:'', phone:'', email:'', address:'' });
      load();
    } catch (err) { flash(err.response?.data?.error||'Error','error'); }
  };

  const openHistory = async supplier => {
    setHistoryModal(supplier);
    const res = await api.get(`/suppliers/${supplier.supplier_id}/purchases`);
    setPurchases(res.data);
  };

  const filtered = suppliers.filter(s =>
    s.supplier_name.toLowerCase().includes(search.toLowerCase()) ||
    (s.contact_person||'').toLowerCase().includes(search.toLowerCase()) ||
    (s.categories||'').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading">Loading suppliers...</div>;

  return (
    <div className="content">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
        <div>
          <h1 className="page-title">Suppliers</h1>
          <p className="page-sub">{suppliers.length} suppliers with purchase history</p>
        </div>
        {user?.role !== 'cashier' && (
          <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? '✕ Cancel' : '+ Add Supplier'}
          </button>
        )}
      </div>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {showAdd && (
        <div className="card" style={{ marginBottom:16, borderColor:'#bfdbfe' }}>
          <h3 style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>Add Supplier</h3>
          <form onSubmit={addSupplier}>
            <div className="form-grid">
              <div className="form-group"><label>Supplier Name</label>
                <input className="form-input" value={form.supplier_name}
                  onChange={e=>setForm({...form,supplier_name:e.target.value})} required /></div>
              <div className="form-group"><label>Contact Person</label>
                <input className="form-input" value={form.contact_person}
                  onChange={e=>setForm({...form,contact_person:e.target.value})} /></div>
              <div className="form-group"><label>Phone</label>
                <input className="form-input" value={form.phone}
                  onChange={e=>setForm({...form,phone:e.target.value})} /></div>
              <div className="form-group"><label>Email</label>
                <input className="form-input" type="email" value={form.email}
                  onChange={e=>setForm({...form,email:e.target.value})} /></div>
            </div>
            <div className="form-group"><label>Address</label>
              <input className="form-input" value={form.address}
                onChange={e=>setForm({...form,address:e.target.value})} /></div>
            <button type="submit" className="btn btn-primary btn-sm">Add Supplier</button>
          </form>
        </div>
      )}

      <input className="form-input" style={{ maxWidth:280, marginBottom:16 }}
        placeholder="Search suppliers..." value={search} onChange={e=>setSearch(e.target.value)} />

      <div className="grid-3">
        {filtered.map(s => (
          <div key={s.supplier_id} className="card" style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ display:'flex', alignItems:'flex-start', gap:12 }}>
              <div style={{ width:44, height:44, borderRadius:10, background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:20, flexShrink:0 }}>🏭</div>
              <div style={{ flex:1, minWidth:0 }}>
                <div style={{ fontWeight:700, fontSize:14 }}>{s.supplier_name}</div>
                <div style={{ color:'#64748b', fontSize:12 }}>{s.contact_person||'No contact'}</div>
              </div>
              <div style={{ background:'#eff6ff', color:'#2563eb', fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:4, whiteSpace:'nowrap' }}>
                {s.product_count} products
              </div>
            </div>

            {s.categories ? (
              <div>
                <div style={{ fontSize:10, color:'#94a3b8', fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>Supplies</div>
                <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                  {s.categories.split(', ').map(cat => (
                    <span key={cat} className="tag" style={{ fontSize:10 }}>{cat}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ color:'#94a3b8', fontSize:12, fontStyle:'italic' }}>No products assigned</div>
            )}

            <div style={{ display:'flex', flexDirection:'column', gap:3, paddingTop:8, borderTop:'1px solid #f1f5f9' }}>
              {s.phone  && <div style={{ fontSize:12, color:'#64748b' }}>📞 {s.phone}</div>}
              {s.email  && <div style={{ fontSize:12, color:'#2563eb' }}>✉️ {s.email}</div>}
              {s.address && <div style={{ fontSize:12, color:'#64748b' }}>📍 {s.address}</div>}
            </div>

            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:8, borderTop:'1px solid #f1f5f9' }}>
              <div>
                <div style={{ fontSize:10, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.05em' }}>Total Purchased</div>
                <div style={{ fontWeight:700, color:'#dc2626', fontSize:13 }}>{fmt(s.total_purchased||0)}</div>
              </div>
              <button className="btn btn-outline btn-sm" onClick={() => openHistory(s)}>
                📋 History
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Supplier Purchase History Modal */}
      {historyModal && (
        <div className="overlay" onClick={() => setHistoryModal(null)}>
          <div className="modal" style={{ maxWidth:680 }} onClick={e=>e.stopPropagation()}>
            <h3>Purchase History</h3>
            <p className="modal-sub">{historyModal.supplier_name} · {purchases.length} purchases</p>
            {purchases.length===0 ? (
              <p style={{ color:'#94a3b8' }}>No purchases recorded from this supplier yet</p>
            ) : (
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Date</th><th>Product</th><th>Category</th><th>Qty</th><th>Unit Cost</th><th>Total</th><th>By</th></tr></thead>
                  <tbody>
                    {purchases.map(p => (
                      <tr key={p.purchase_id}>
                        <td style={{ fontSize:12, color:'#64748b' }}>{new Date(p.purchase_date).toLocaleString()}</td>
                        <td style={{ fontWeight:600 }}>{p.product_name}</td>
                        <td><span className="tag" style={{ fontSize:10 }}>{p.category_name}</span></td>
                        <td>{p.quantity}</td>
                        <td style={{ color:'#64748b' }}>{fmt(p.unit_cost)}</td>
                        <td style={{ fontWeight:700, color:'#dc2626' }}>{fmt(p.total_cost)}</td>
                        <td style={{ fontSize:12, color:'#94a3b8' }}>{p.purchased_by}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            <div style={{ marginTop:14, paddingTop:12, borderTop:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <span style={{ fontWeight:700 }}>Total Spent: <span style={{ color:'#dc2626' }}>{fmt(purchases.reduce((s,p)=>s+Number(p.total_cost),0))}</span></span>
              <button className="btn btn-outline btn-sm" onClick={() => setHistoryModal(null)}>Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
