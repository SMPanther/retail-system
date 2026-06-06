import React, { useEffect, useState } from 'react';
import api from '../api/axios';

export default function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [showAdd, setShowAdd]     = useState(false);
  const [search, setSearch]       = useState('');
  const [msg, setMsg]             = useState({ text:'', type:'' });
  const [form, setForm]           = useState({ supplier_name:'', contact_person:'', phone:'', email:'', address:'' });

  const flash = (text, type='success') => { setMsg({text,type}); setTimeout(()=>setMsg({text:'',type:''}),3000); };

  const load = () => api.get('/suppliers').then(r => { setSuppliers(r.data); setLoading(false); });
  useEffect(() => { load(); }, []);

  const addSupplier = async e => {
    e.preventDefault();
    try {
      await api.post('/suppliers', form);
      flash('Supplier added!');
      setShowAdd(false);
      setForm({ supplier_name:'', contact_person:'', phone:'', email:'', address:'' });
      load();
    } catch (err) { flash(err.response?.data?.error || 'Error', 'error'); }
  };

  const filtered = suppliers.filter(s =>
    s.supplier_name.toLowerCase().includes(search.toLowerCase()) ||
    (s.contact_person||'').toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="loading">Loading suppliers...</div>;

  return (
    <div className="content">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
        <div>
          <h1 className="page-title">Suppliers</h1>
          <p className="page-sub">{suppliers.length} suppliers registered</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? '✕ Cancel' : '+ Add Supplier'}
        </button>
      </div>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {showAdd && (
        <div className="card" style={{ marginBottom:16, borderColor:'#bfdbfe' }}>
          <h3 style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>Add Supplier</h3>
          <form onSubmit={addSupplier}>
            <div className="form-grid">
              <div className="form-group">
                <label>Supplier Name</label>
                <input className="form-input" value={form.supplier_name}
                  onChange={e => setForm({...form, supplier_name:e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Contact Person</label>
                <input className="form-input" value={form.contact_person}
                  onChange={e => setForm({...form, contact_person:e.target.value})} />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input className="form-input" value={form.phone}
                  onChange={e => setForm({...form, phone:e.target.value})} />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input className="form-input" type="email" value={form.email}
                  onChange={e => setForm({...form, email:e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label>Address</label>
              <input className="form-input" value={form.address}
                onChange={e => setForm({...form, address:e.target.value})} />
            </div>
            <button type="submit" className="btn btn-primary btn-sm">Add Supplier</button>
          </form>
        </div>
      )}

      <input className="form-input" style={{ maxWidth:260, marginBottom:14 }}
        placeholder="Search suppliers..." value={search} onChange={e => setSearch(e.target.value)} />

      <div className="grid-3">
        {filtered.map(s => (
          <div key={s.supplier_id} className="card">
            <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10 }}>
              <div style={{ width:40, height:40, borderRadius:10, background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>🏭</div>
              <div>
                <div style={{ fontWeight:700, fontSize:14 }}>{s.supplier_name}</div>
                <div style={{ color:'#64748b', fontSize:12 }}>{s.contact_person || 'No contact'}</div>
              </div>
            </div>
            <div style={{ display:'flex', flexDirection:'column', gap:4 }}>
              {s.phone && <div style={{ fontSize:12, color:'#64748b' }}>📞 {s.phone}</div>}
              {s.email && <div style={{ fontSize:12, color:'#2563eb' }}>✉️ {s.email}</div>}
              {s.address && <div style={{ fontSize:12, color:'#64748b' }}>📍 {s.address}</div>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
