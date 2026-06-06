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

  const flash = (text, type='success') => { setMsg({text,type}); setTimeout(()=>setMsg({text:'',type:''}),3000); };

  const load = async () => {
    const [c, t] = await Promise.all([api.get('/customers'), api.get('/customers/top')]);
    setCustomers(c.data); setTopCustomers(t.data); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const addCustomer = async e => {
    e.preventDefault();
    try {
      await api.post('/customers', form);
      flash('Customer added! They will get 5% discount on all purchases.');
      setShowAdd(false);
      setForm({ first_name:'', last_name:'', email:'', phone:'', address:'' });
      load();
    } catch (err) { flash(err.response?.data?.error || 'Error', 'error'); }
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
          <p className="page-sub">{customers.length} registered customers — all get 5% loyalty discount</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? '✕ Cancel' : '+ Add Customer'}
        </button>
      </div>

      {/* Discount notice */}
      <div className="alert alert-success" style={{ marginBottom:16 }}>
        🎉 <strong>Loyalty Discount:</strong> All registered customers automatically receive a 5% discount on every purchase. Guest customers pay full price.
      </div>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {showAdd && (
        <div className="card" style={{ marginBottom:16, borderColor:'#bfdbfe' }}>
          <h3 style={{ fontSize:15, fontWeight:700, marginBottom:4 }}>Add Customer</h3>
          <p style={{ color:'#64748b', fontSize:12, marginBottom:14 }}>
            Registered customers will automatically receive a 5% discount on all future purchases.
          </p>
          <form onSubmit={addCustomer}>
            <div className="form-grid">
              <div className="form-group">
                <label>First Name</label>
                <input className="form-input" value={form.first_name}
                  onChange={e => setForm({...form, first_name:e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Last Name</label>
                <input className="form-input" value={form.last_name}
                  onChange={e => setForm({...form, last_name:e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Email</label>
                <input className="form-input" type="email" value={form.email}
                  onChange={e => setForm({...form, email:e.target.value})} />
              </div>
              <div className="form-group">
                <label>Phone</label>
                <input className="form-input" value={form.phone}
                  onChange={e => setForm({...form, phone:e.target.value})} />
              </div>
            </div>
            <div className="form-group">
              <label>Address</label>
              <input className="form-input" value={form.address}
                onChange={e => setForm({...form, address:e.target.value})} />
            </div>
            <button type="submit" className="btn btn-primary btn-sm">Add Customer</button>
          </form>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:16 }}>
        {['all','top'].map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{ padding:'6px 16px', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer',
              background:tab===t?'#2563eb':'white', color:tab===t?'white':'#64748b',
              border:tab===t?'1px solid #2563eb':'1px solid #e2e8f0' }}>
            {t === 'all'
              ? `All Customers (${customers.length})`
              : `⭐ Above Average Spenders (${topCustomers.length})`}
          </button>
        ))}
      </div>

      {/* Above average tab */}
      {tab === 'top' && (
        <div className="card" style={{ marginBottom:16, borderColor:'#fde047' }}>
          <div className="section-title">⭐ Customers Who Spent Above Average</div>
          <p style={{ color:'#64748b', fontSize:11, marginBottom:12, fontFamily:'monospace' }}>
            WHERE total_spent &gt; (SELECT AVG(total_amount) FROM Sale WHERE customer_id IS NOT NULL)
          </p>
          {topCustomers.length === 0 ? (
            <p style={{ color:'#94a3b8' }}>No data yet — process some sales first</p>
          ) : (
            <table>
              <thead><tr><th>Customer</th><th>Orders</th><th>Total Spent</th><th>Last Purchase</th><th>Discount</th></tr></thead>
              <tbody>
                {topCustomers.map((c,i) => (
                  <tr key={i}>
                    <td style={{ fontWeight:600 }}>{c.customer_name}</td>
                    <td>{c.total_orders}</td>
                    <td style={{ fontWeight:700, color:'#16a34a' }}>{fmt(c.total_spent)}</td>
                    <td style={{ color:'#64748b' }}>{new Date(c.last_purchase).toLocaleDateString()}</td>
                    <td><span className="badge badge-green">5% on every sale</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* All customers tab */}
      {tab === 'all' && (
        <>
          <input className="form-input" style={{ maxWidth:280, marginBottom:14 }}
            placeholder="Search by name or email..."
            value={search} onChange={e => setSearch(e.target.value)} />
          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Name</th><th>Email</th><th>Phone</th><th>Orders</th><th>Total Spent</th><th>Discount</th><th>Registered</th></tr>
                </thead>
                <tbody>
                  {filtered.map(c => (
                    <tr key={c.customer_id}>
                      <td style={{ fontWeight:600 }}>{c.first_name} {c.last_name}</td>
                      <td style={{ color:'#64748b', fontSize:12 }}>{c.email || '—'}</td>
                      <td style={{ color:'#64748b', fontSize:12 }}>{c.phone || '—'}</td>
                      <td>{c.total_orders || 0}</td>
                      <td style={{ fontWeight:600, color:'#16a34a' }}>{fmt(c.total_spent)}</td>
                      <td><span className="badge badge-green">5% off</span></td>
                      <td style={{ color:'#64748b' }}>{new Date(c.registration_date).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
