import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useNavigate } from 'react-router-dom';

const fmt = n => `Rs. ${Number(n).toLocaleString()}`;

export default function Sales() {
  const [sales, setSales]     = useState([]);
  const [detail, setDetail]   = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    api.get('/sales').then(r => { setSales(r.data); setLoading(false); });
  }, []);

  const viewDetail = async id => {
    const res = await api.get(`/sales/${id}`);
    setDetail(res.data);
  };

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

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>Date</th><th>Customer</th><th>Items</th><th>Total</th><th>Action</th></tr>
            </thead>
            <tbody>
              {sales.map(s => (
                <tr key={s.sale_id}>
                  <td style={{ color:'#94a3b8' }}>#{s.sale_id}</td>
                  <td style={{ color:'#64748b' }}>{new Date(s.sale_date).toLocaleString()}</td>
                  <td>
                    <span className={`badge ${s.customer_name==='Guest'?'badge-gray':'badge-blue'}`}>
                      {s.customer_name}
                    </span>
                  </td>
                  <td style={{ color:'#64748b' }}>{s.total_items}</td>
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
          <div className="modal" style={{ maxWidth:560 }} onClick={e => e.stopPropagation()}>
            <h3>Sale #{detail.sale_id}</h3>
            <p className="modal-sub">
              {new Date(detail.sale_date).toLocaleString()} · {detail.customer_name}
            </p>
            <table style={{ width:'100%', marginBottom:16 }}>
              <thead><tr><th>Product</th><th>Qty</th><th>Unit Price</th><th>Subtotal</th></tr></thead>
              <tbody>
                {detail.items?.map(item => (
                  <tr key={item.sale_item_id}>
                    <td style={{ fontWeight:600 }}>{item.product_name}</td>
                    <td>{item.quantity}</td>
                    <td>{fmt(item.unit_price)}</td>
                    <td style={{ fontWeight:600, color:'#16a34a' }}>{fmt(item.quantity * item.unit_price)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div style={{ display:'flex', justifyContent:'space-between', padding:'10px 0', borderTop:'2px solid #e2e8f0' }}>
              <span style={{ fontWeight:700 }}>Total</span>
              <span style={{ fontWeight:800, fontSize:17, color:'#16a34a' }}>{fmt(detail.total_amount)}</span>
            </div>
            <button className="btn btn-outline" style={{ marginTop:14 }} onClick={() => setDetail(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
