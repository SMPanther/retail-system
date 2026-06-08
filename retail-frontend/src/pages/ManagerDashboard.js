import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const ROLE_BADGE = {
  manager:      { bg:'#dbeafe', color:'#1d4ed8' },
  cashier:      { bg:'#dcfce7', color:'#16a34a' },
  stock_handler:{ bg:'#ffedd5', color:'#ea580c' },
  rack_manager: { bg:'#fef9c3', color:'#ca8a04' },
};
const SHIFT_COLOR = {
  morning:{ bg:'#fef9c3', color:'#92400e' },
  evening:{ bg:'#ede9fe', color:'#6d28d9' },
  night:  { bg:'#1e293b', color:'#94a3b8' },
};

export default function ManagerDashboard() {
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/dashboard/manager').then(r => { setData(r.data); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return <div className="loading">Loading manager dashboard...</div>;
  if (!data)   return <div className="loading">Failed to load</div>;
  const { lowStock, currentDuties, counts } = data;

  return (
    <div className="content">
      <h1 className="page-title">Manager Dashboard</h1>
      <p className="page-sub">Staff duties overview and inventory alerts</p>

      {/* Counts */}
      <div className="stats-grid" style={{ marginBottom:24 }}>
        {[
          { label:'Active Staff',    val:counts.active_employees, color:'#2563eb', icon:'👥' },
          { label:'On Duty',         val:counts.assigned,         color:'#16a34a', icon:'✅' },
          { label:'Unassigned',      val:counts.unassigned,       color:'#ea580c', icon:'⚠️' },
          { label:'Low Stock Items', val:counts.low_stock,        color: counts.low_stock>0?'#dc2626':'#16a34a', icon:'📦' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize:22 }}>{s.icon}</div>
            <div className="stat-val" style={{ color:s.color }}>{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="grid-2" style={{ marginBottom:20 }}>
        {/* Current Employee Duties */}
        <div className="card">
          <div className="section-title">👥 What Employees Are Doing Now</div>
          <p style={{ color:'#64748b', fontSize:11, marginBottom:12, fontFamily:'monospace' }}>
            Employee LEFT JOIN Duty_Assignment (active) + Duty
          </p>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Employee</th><th>Role</th><th>Duty</th><th>Shift</th></tr></thead>
              <tbody>
                {currentDuties.map(e => {
                  const rb = ROLE_BADGE[e.role] || { bg:'#f1f5f9', color:'#64748b' };
                  const sc = e.shift ? SHIFT_COLOR[e.shift] : null;
                  return (
                    <tr key={e.employee_id}>
                      <td style={{ fontWeight:600 }}>{e.employee_name}</td>
                      <td>
                        <span style={{ fontSize:11, fontWeight:600, padding:'1px 7px', borderRadius:4, background:rb.bg, color:rb.color }}>
                          {e.role?.replace('_',' ')}
                        </span>
                      </td>
                      <td>
                        {e.duty_name
                          ? <span className="tag">{e.duty_name}</span>
                          : <span style={{ color:'#94a3b8', fontSize:12, fontStyle:'italic' }}>Unassigned</span>}
                      </td>
                      <td>
                        {sc
                          ? <span style={{ fontSize:11, fontWeight:600, padding:'1px 7px', borderRadius:4, background:sc.bg, color:sc.color }}>{e.shift}</span>
                          : <span style={{ color:'#94a3b8' }}>—</span>}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Low Stock */}
        <div className="card" style={{ borderColor: lowStock.length>0?'#fca5a5':'#86efac' }}>
          <div className="section-title">⚠️ Low Stock Alert</div>
          <p style={{ color:'#64748b', fontSize:11, marginBottom:12, fontFamily:'monospace' }}>
            WHERE quantity_in_stock &lt;= reorder_level
          </p>
          {lowStock.length === 0 ? (
            <div className="alert alert-success">✅ All stock levels are healthy</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Product</th><th>Stock</th><th>Reorder At</th><th>Supplier</th></tr></thead>
                <tbody>
                  {lowStock.map(p => (
                    <tr key={p.product_id}>
                      <td style={{ fontWeight:600 }}>{p.product_name}</td>
                      <td><span className={`badge ${p.quantity_in_stock===0?'badge-red':'badge-orange'}`}>{p.quantity_in_stock}</span></td>
                      <td style={{ color:'#64748b' }}>{p.reorder_level}</td>
                      <td style={{ color:'#64748b', fontSize:12 }}>{p.supplier_name}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
