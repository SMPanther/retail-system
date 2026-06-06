import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const fmt = n => n != null ? `Rs. ${Number(n).toLocaleString()}` : '—';

export default function Dashboard() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard').then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (!data)   return <div className="loading">Failed to load dashboard</div>;

  const { counts, lowStock, topCustomers, catRevenue, topProducts, salesSummary } = data;

  return (
    <div className="content">
      <h1 className="page-title">Dashboard</h1>
      <p className="page-sub">Live database stats — Views, JOINs, Aggregates</p>

      {/* Stats */}
      <div className="stats-grid">
        {[
          { label:'Products',      val:counts.products,           color:'#2563eb', icon:'📦' },
          { label:'Customers',     val:counts.customers,          color:'#16a34a', icon:'👥' },
          { label:'Total Sales',   val:counts.sales,              color:'#7c3aed', icon:'🧾' },
          { label:'Suppliers',     val:counts.suppliers,          color:'#ea580c', icon:'🏭' },
          { label:'Total Revenue', val:fmt(counts.total_revenue), color:'#ca8a04', icon:'💰' },
          { label:'Low Stock',     val:counts.low_stock,          color: counts.low_stock > 0 ? '#dc2626':'#16a34a', icon:'⚠️' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize:22 }}>{s.icon}</div>
            <div className="stat-val" style={{ color:s.color }}>{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Low Stock Alert — always visible */}
      <div className="card" style={{ marginBottom:20, borderColor: lowStock.length>0?'#fca5a5':'#86efac' }}>
        <div className="section-title">
          ⚠️ Low Stock Alert
          <span style={{ marginLeft:8, fontSize:12, fontWeight:400, color:'#64748b' }}>
            Products at or below reorder level
          </span>
        </div>
        <p style={{ color:'#64748b', fontSize:11, marginBottom:12, fontFamily:'monospace' }}>
          SELECT * FROM vw_low_stock — WHERE quantity_in_stock &lt;= reorder_level
        </p>
        {lowStock.length === 0 ? (
          <div className="alert alert-success">✅ All products are well stocked — no items below reorder level</div>
        ) : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>Product</th><th>Current Stock</th><th>Reorder Level</th><th>Supplier</th><th>Contact</th></tr>
              </thead>
              <tbody>
                {lowStock.map(p => (
                  <tr key={p.product_id}>
                    <td style={{ fontWeight:600 }}>{p.product_name}</td>
                    <td>
                      <span className={`badge ${p.quantity_in_stock === 0 ? 'badge-red' : 'badge-orange'}`}>
                        {p.quantity_in_stock === 0 ? '🚫 Out of Stock' : `⚠️ ${p.quantity_in_stock} left`}
                      </span>
                    </td>
                    <td style={{ color:'#64748b' }}>{p.reorder_level}</td>
                    <td style={{ color:'#2563eb' }}>{p.supplier_name}</td>
                    <td style={{ color:'#64748b', fontSize:12 }}>{p.supplier_phone}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <div className="grid-2" style={{ marginBottom:20 }}>
        {/* Revenue by Category */}
        <div className="card">
          <div className="section-title">💹 Revenue by Category</div>
          <p style={{ color:'#64748b', fontSize:11, marginBottom:12, fontFamily:'monospace' }}>
            JOIN Sale_Item + Product + Category → GROUP BY + SUM()
          </p>
          {catRevenue.length === 0 ? (
            <p style={{ color:'#94a3b8' }}>No sales yet</p>
          ) : (
            <table>
              <thead><tr><th>Category</th><th>Revenue</th></tr></thead>
              <tbody>
                {catRevenue.map(r => (
                  <tr key={r.category_name}>
                    <td><span className="tag">{r.category_name}</span></td>
                    <td style={{ fontWeight:700, color:'#16a34a' }}>{fmt(r.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Top Products */}
        <div className="card">
          <div className="section-title">🏆 Top Selling Products</div>
          <p style={{ color:'#64748b', fontSize:11, marginBottom:12, fontFamily:'monospace' }}>
            GROUP BY + SUM() + ORDER BY + LIMIT 5
          </p>
          {topProducts.length === 0 ? (
            <p style={{ color:'#94a3b8' }}>No sales yet</p>
          ) : (
            <table>
              <thead><tr><th>Product</th><th>Units Sold</th><th>Revenue</th></tr></thead>
              <tbody>
                {topProducts.map((p,i) => (
                  <tr key={p.product_name}>
                    <td><span style={{ color:'#94a3b8', fontSize:11, marginRight:6 }}>{i+1}.</span>{p.product_name}</td>
                    <td style={{ fontWeight:600 }}>{p.total_sold}</td>
                    <td style={{ color:'#2563eb' }}>{fmt(p.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="grid-2" style={{ marginBottom:20 }}>
        {/* Top Customers */}
        <div className="card">
          <div className="section-title">⭐ Top Customers — vw_customer_spend</div>
          <p style={{ color:'#64748b', fontSize:11, marginBottom:12, fontFamily:'monospace' }}>
            VIEW: Customer JOIN Sale → GROUP BY + SUM() + COUNT()
          </p>
          {topCustomers.length === 0 ? (
            <p style={{ color:'#94a3b8' }}>No registered customer purchases yet</p>
          ) : (
            <table>
              <thead><tr><th>Customer</th><th>Orders</th><th>Total Spent</th></tr></thead>
              <tbody>
                {topCustomers.map(c => (
                  <tr key={c.customer_id}>
                    <td style={{ fontWeight:600 }}>{c.customer_name}</td>
                    <td style={{ color:'#64748b' }}>{c.total_orders}</td>
                    <td style={{ fontWeight:700, color:'#16a34a' }}>{fmt(c.total_spent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Recent Sales */}
        <div className="card">
          <div className="section-title">🧾 Recent Sales — vw_sales_summary</div>
          <p style={{ color:'#64748b', fontSize:11, marginBottom:12, fontFamily:'monospace' }}>
            VIEW: Sale LEFT JOIN Customer → COALESCE + COUNT() + GROUP BY
          </p>
          <div className="table-wrap">
            <table>
              <thead><tr><th>#</th><th>Customer</th><th>Items</th><th>Total</th></tr></thead>
              <tbody>
                {salesSummary.map(s => (
                  <tr key={s.sale_id}>
                    <td style={{ color:'#94a3b8' }}>#{s.sale_id}</td>
                    <td>
                      <span className={`badge ${s.customer_name==='Guest'?'badge-gray':'badge-blue'}`}>
                        {s.customer_name}
                      </span>
                    </td>
                    <td style={{ color:'#64748b' }}>{s.total_items}</td>
                    <td style={{ fontWeight:700, color:'#16a34a' }}>{fmt(s.total_amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
