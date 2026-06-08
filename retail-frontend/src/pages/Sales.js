import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const fmt = n => `Rs. ${Number(n).toLocaleString()}`;

export default function Sales() {
  const [sales,      setSales]      = useState([]);
  const [dailyStats, setDailyStats] = useState([]);
  const [detail,     setDetail]     = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [selectedDate, setSelectedDate] = useState('');
  const [search,     setSearch]     = useState('');
  const { user } = useAuth();
  const navigate  = useNavigate();
  const today     = new Date().toISOString().split('T')[0];

  const loadSales = async (date='') => {
    const url = date ? `/sales?date=${date}` : '/sales';
    const res = await api.get(url);
    setSales(res.data);
  };

  useEffect(() => {
    Promise.all([loadSales(), api.get('/sales/daily')])
      .then(([, daily]) => { setDailyStats(daily.data); setLoading(false); });
  }, []);

  const handleDateChange = e => {
    const d = e.target.value;
    setSelectedDate(d);
    setSearch('');
    loadSales(d);
  };

  const clearDate = () => { setSelectedDate(''); loadSales(''); };

  const viewDetail = async id => {
    const res = await api.get(`/sales/${id}`);
    setDetail(res.data);
  };

  const filtered = sales.filter(s =>
    s.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    String(s.sale_id).includes(search)
  );

  // Summary for selected day
  const dayRevenue  = sales.reduce((s,x) => s + Number(x.total_amount), 0);
  const dayGuests   = sales.filter(s => s.customer_name === 'Guest').length;
  const dayReg      = sales.filter(s => s.customer_name !== 'Guest').length;

  if (loading) return <div className="loading">Loading sales...</div>;

  return (
    <div className="content">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
        <div>
          <h1 className="page-title">Sales History</h1>
          <p className="page-sub">{sales.length} sales {selectedDate ? `on ${selectedDate}` : '(all time)'}</p>
        </div>
        {user?.role !== 'admin' && (
          <button className="btn btn-primary" onClick={() => navigate('/new-sale')}>+ New Sale</button>
        )}
      </div>

      {/* Date picker */}
      <div className="card" style={{ marginBottom:16, padding:'14px 18px' }}>
        <div style={{ display:'flex', alignItems:'center', gap:14, flexWrap:'wrap' }}>
          <div>
            <label style={{ fontSize:11, color:'#64748b', fontWeight:600, textTransform:'uppercase', display:'block', marginBottom:4 }}>
              Filter by Date
            </label>
            <input type="date" className="form-input" style={{ width:'auto' }}
              value={selectedDate} max={today}
              onChange={handleDateChange} />
          </div>
          {selectedDate && (
            <button className="btn btn-outline btn-sm" style={{ marginTop:20 }} onClick={clearDate}>
              ✕ Clear date
            </button>
          )}
          {selectedDate && (
            <div style={{ display:'flex', gap:14, marginTop:16, flexWrap:'wrap' }}>
              {[
                { label:'Revenue',    val:fmt(dayRevenue), color:'#16a34a' },
                { label:'Total Sales',val:sales.length,    color:'#2563eb' },
                { label:'Registered', val:dayReg,          color:'#7c3aed' },
                { label:'Guests',     val:dayGuests,       color:'#64748b' },
              ].map(s => (
                <div key={s.label} style={{ textAlign:'center' }}>
                  <div style={{ fontWeight:800, fontSize:18, color:s.color }}>{s.val}</div>
                  <div style={{ fontSize:11, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.05em' }}>{s.label}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Daily chart (simple table) — only when no date selected */}
      {!selectedDate && (
        <div className="card" style={{ marginBottom:16 }}>
          <div className="section-title">📅 Daily Sales Summary — vw_daily_sales</div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Date</th><th>Sales</th><th>Revenue</th><th>Registered</th><th>Guests</th></tr></thead>
              <tbody>
                {dailyStats.slice(0,10).map(d => (
                  <tr key={d.sale_day} style={{ cursor:'pointer' }}
                    onClick={() => { setSelectedDate(d.sale_day); loadSales(d.sale_day); }}>
                    <td style={{ color:'#2563eb', fontWeight:600 }}>{d.sale_day}</td>
                    <td>{d.total_sales}</td>
                    <td style={{ fontWeight:700, color:'#16a34a' }}>{fmt(d.daily_revenue)}</td>
                    <td style={{ color:'#7c3aed' }}>{d.registered_customers}</td>
                    <td style={{ color:'#64748b' }}>{d.guest_sales}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <input className="form-input" style={{ maxWidth:260, marginBottom:14 }}
        placeholder="Search by customer or sale #..."
        value={search} onChange={e => setSearch(e.target.value)} />

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>#</th><th>Date & Time</th><th>Customer</th><th>Items</th><th>Discount</th><th>Total</th><th></th></tr></thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7} style={{ textAlign:'center', color:'#94a3b8', padding:24 }}>
                  No sales found {selectedDate ? `on ${selectedDate}` : ''}
                </td></tr>
              ) : filtered.map(s => (
                <tr key={s.sale_id}>
                  <td style={{ color:'#94a3b8', fontWeight:600 }}>#{s.sale_id}</td>
                  <td style={{ color:'#64748b', fontSize:12 }}>{new Date(s.sale_date).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${s.customer_name==='Guest'?'badge-gray':'badge-blue'}`}>
                      {s.customer_name==='Guest'?'👤 Guest':`⭐ ${s.customer_name}`}
                    </span>
                  </td>
                  <td style={{ color:'#64748b' }}>{s.total_items}</td>
                  <td>{s.customer_name!=='Guest'
                    ? <span className="badge badge-green">Discount applied</span>
                    : <span style={{ color:'#94a3b8', fontSize:12 }}>—</span>}
                  </td>
                  <td style={{ fontWeight:700, color:'#16a34a' }}>{fmt(s.total_amount)}</td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => viewDetail(s.sale_id)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail modal */}
      {detail && (
        <div className="overlay" onClick={() => setDetail(null)}>
          <div className="modal" style={{ maxWidth:580 }} onClick={e => e.stopPropagation()}>
            <h3>Sale #{detail.sale_id}</h3>
            <p className="modal-sub">
              {new Date(detail.sale_date).toLocaleString()} ·{' '}
              <span className={`badge ${detail.customer_name==='Guest'?'badge-gray':'badge-blue'}`}>
                {detail.customer_name==='Guest'?'👤 Guest':`⭐ ${detail.customer_name}`}
              </span>
              {detail.is_registered==1 && <span className="badge badge-green" style={{ marginLeft:6 }}>Discount applied</span>}
            </p>
            <div className="table-wrap">
              <table style={{ marginBottom:14 }}>
                <thead><tr><th>Product</th><th>Category</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {detail.items?.map(item => (
                    <tr key={item.sale_item_id}>
                      <td style={{ fontWeight:600 }}>{item.product_name}</td>
                      <td><span className="tag" style={{ fontSize:10 }}>{item.category_name||'—'}</span></td>
                      <td>{item.quantity}</td>
                      <td style={{ color:'#64748b' }}>{fmt(item.unit_price)}</td>
                      <td style={{ fontWeight:600, color:'#16a34a' }}>{fmt(item.quantity*item.unit_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderTop:'2px solid #e2e8f0' }}>
              <span style={{ fontWeight:700 }}>Total</span>
              <span style={{ fontWeight:800, fontSize:18, color:'#16a34a' }}>{fmt(detail.total_amount)}</span>
            </div>
            <button className="btn btn-outline" style={{ marginTop:14 }} onClick={() => setDetail(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
