import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const fmt = n => `Rs. ${Number(n).toLocaleString()}`;

export default function Sales() {
  const [sales,   setSales]   = useState([]);
  const [detail,  setDetail]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [search,  setSearch]  = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/sales').then(r => { setSales(r.data); setLoading(false); });
  }, []);

  const viewDetail = async id => {
    const res = await api.get(`/sales/${id}`);
    setDetail(res.data);
  };

  const filtered = sales.filter(s =>
    s.customer_name.toLowerCase().includes(search.toLowerCase()) ||
    String(s.sale_id).includes(search)
  );

  if (loading) return <div className="loading">Loading sales...</div>;

  return (
    <div className="content">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
        <div>
          <h1 className="page-title">Sales History</h1>
          <p className="page-sub">{sales.length} sales — from vw_sales_summary view</p>
        </div>
        <button className="btn btn-primary" onClick={() => navigate('/new-sale')}>+ New Sale</button>
      </div>

      <input className="form-input" style={{ maxWidth:260, marginBottom:14 }}
        placeholder="Search by customer or sale #..."
        value={search} onChange={e => setSearch(e.target.value)} />

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>Date</th><th>Customer</th><th>Items</th><th>Discount</th><th>Total</th><th>Action</th></tr>
            </thead>
            <tbody>
              {filtered.map(s => (
                <tr key={s.sale_id}>
                  <td style={{ color:'#94a3b8', fontWeight:600 }}>#{s.sale_id}</td>
                  <td style={{ color:'#64748b' }}>{new Date(s.sale_date).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${s.customer_name==='Guest'?'badge-gray':'badge-blue'}`}>
                      {s.customer_name === 'Guest' ? '👤 Guest' : `⭐ ${s.customer_name}`}
                    </span>
                  </td>
                  <td style={{ color:'#64748b' }}>{s.total_items}</td>
                  <td>
                    {s.customer_name !== 'Guest' ? (
                      <span className="badge badge-green">5% off</span>
                    ) : (
                      <span style={{ color:'#94a3b8', fontSize:12 }}>—</span>
                    )}
                  </td>
                  <td style={{ fontWeight:700, color:'#16a34a' }}>{fmt(s.total_amount)}</td>
                  <td>
                    <button className="btn btn-outline btn-sm" onClick={() => viewDetail(s.sale_id)}>
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sale Detail Modal */}
      {detail && (
        <div className="overlay" onClick={() => setDetail(null)}>
          <div className="modal" style={{ maxWidth:580 }} onClick={e => e.stopPropagation()}>
            <h3>Sale #{detail.sale_id}</h3>
            <p className="modal-sub">
              {new Date(detail.sale_date).toLocaleString()} ·{' '}
              <span className={`badge ${detail.customer_name==='Guest'?'badge-gray':'badge-blue'}`}>
                {detail.customer_name === 'Guest' ? '👤 Guest' : `⭐ ${detail.customer_name}`}
              </span>
              {detail.is_registered == 1 && (
                <span className="badge badge-green" style={{ marginLeft:6 }}>5% discount applied</span>
              )}
            </p>

            <div className="table-wrap">
              <table style={{ marginBottom:14 }}>
                <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
                <tbody>
                  {detail.items?.map(item => (
                    <tr key={item.sale_item_id}>
                      <td style={{ fontWeight:600 }}>{item.product_name}</td>
                      <td>{item.quantity}</td>
                      <td style={{ color:'#64748b' }}>{fmt(item.unit_price)}</td>
                      <td style={{ fontWeight:600, color:'#16a34a' }}>{fmt(item.quantity * item.unit_price)}</td>
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
