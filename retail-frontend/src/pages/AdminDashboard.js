import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const fmt  = n => n != null ? `Rs. ${Number(n).toLocaleString()}` : '—';
const fmtN = n => n != null ? Number(n).toFixed(1) : '—';

export default function AdminDashboard() {
  const [data,   setData]   = useState(null);
  const [budget, setBudget] = useState(null);
  const [depositModal, setDepositModal] = useState(false);
  const [depositForm,  setDepositForm]  = useState({ amount:'', description:'' });
  const [msg,    setMsg]    = useState({ text:'', type:'' });
  const [loading, setLoading] = useState(true);

  const flash = (text, type='success') => { setMsg({text,type}); setTimeout(()=>setMsg({text:'',type:''}),3000); };

  const load = async () => {
    const [d, b] = await Promise.all([api.get('/dashboard'), api.get('/budget')]);
    setData(d.data); setBudget(b.data); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const addDeposit = async e => {
    e.preventDefault();
    try {
      await api.post('/budget/deposit', depositForm);
      flash('Budget updated!'); setDepositModal(false);
      setDepositForm({ amount:'', description:'' }); load();
    } catch (err) { flash(err.response?.data?.error||'Error','error'); }
  };

  if (loading) return <div className="loading">Loading dashboard...</div>;
  if (!data)   return <div className="loading">Failed to load</div>;

  const { counts, lowStock, topCustomers, catRevenue, topProducts, salesSummary, profit } = data;
  const bal = budget?.balance;

  return (
    <div className="content">
      <h1 className="page-title">Admin Dashboard</h1>
      <p className="page-sub">Full system overview — Revenue, Profit, Budget, Views</p>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {/* Main stats */}
      <div className="stats-grid">
        {[
          { label:'Products',      val:counts.products,           color:'#2563eb', icon:'📦' },
          { label:'Customers',     val:counts.customers,          color:'#16a34a', icon:'👥' },
          { label:'Total Sales',   val:counts.sales,              color:'#7c3aed', icon:'🧾' },
          { label:'Total Revenue', val:fmt(counts.total_revenue), color:'#ca8a04', icon:'💰' },
          { label:'Gross Profit',  val:fmt(profit?.gross_profit), color:'#16a34a', icon:'📈' },
          { label:'Low Stock',     val:counts.low_stock,          color:counts.low_stock>0?'#dc2626':'#16a34a', icon:'⚠️' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize:22 }}>{s.icon}</div>
            <div className="stat-val" style={{ color:s.color }}>{s.val}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Profit + Budget row */}
      <div className="grid-2" style={{ marginBottom:20 }}>
        {/* Profit Summary */}
        <div className="card" style={{ borderColor:'#86efac' }}>
          <div className="section-title">📈 Profit Summary — vw_profit_summary</div>
          <p style={{ color:'#64748b', fontSize:11, marginBottom:14, fontFamily:'monospace' }}>
            SUM(sale_price) - SUM(cost_price) grouped across all sales
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[
              { label:'Total Revenue',    val:fmt(profit?.total_revenue),  color:'#2563eb' },
              { label:'Total Cost',       val:fmt(profit?.total_cost),      color:'#dc2626' },
              { label:'Gross Profit',     val:fmt(profit?.gross_profit),   color:'#16a34a' },
              { label:'Profit Margin',    val:`${fmtN(profit?.profit_margin_pct)}%`, color:'#ca8a04' },
            ].map(s => (
              <div key={s.label} style={{ padding:'10px 14px', background:'#f8fafc', borderRadius:8 }}>
                <div style={{ fontSize:11, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>{s.label}</div>
                <div style={{ fontSize:20, fontWeight:800, color:s.color, fontFamily:'Plus Jakarta Sans,sans-serif' }}>{s.val}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Store Budget */}
        <div className="card" style={{ borderColor: bal?.current_balance < 0 ? '#fca5a5':'#bfdbfe' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
            <div className="section-title" style={{ marginBottom:0 }}>🏦 Store Budget</div>
            <button className="btn btn-primary btn-sm" onClick={() => setDepositModal(true)}>+ Add Funds</button>
          </div>
          <p style={{ color:'#64748b', fontSize:11, marginBottom:14, fontFamily:'monospace' }}>
            SUM(deposits) - SUM(purchases) from Store_Budget table
          </p>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            {[
              { label:'Total Deposited', val:fmt(bal?.total_deposited), color:'#16a34a' },
              { label:'Total Spent',     val:fmt(bal?.total_spent),     color:'#dc2626' },
              { label:'Current Balance', val:fmt(bal?.current_balance),
                color: Number(bal?.current_balance) < 0 ? '#dc2626':'#2563eb' },
            ].map(s => (
              <div key={s.label} style={{ padding:'10px 14px', background:'#f8fafc', borderRadius:8 }}>
                <div style={{ fontSize:11, color:'#94a3b8', textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>{s.label}</div>
                <div style={{ fontSize:20, fontWeight:800, color:s.color, fontFamily:'Plus Jakarta Sans,sans-serif' }}>{s.val}</div>
              </div>
            ))}
          </div>
          {/* Recent budget entries */}
          {budget?.history?.length > 0 && (
            <div style={{ marginTop:12 }}>
              <div style={{ fontSize:12, fontWeight:600, color:'#64748b', marginBottom:6 }}>Recent Transactions</div>
              {budget.history.slice(0,4).map(h => (
                <div key={h.budget_id} style={{ display:'flex', justifyContent:'space-between', padding:'4px 0', borderBottom:'1px solid #f1f5f9', fontSize:12 }}>
                  <span style={{ color:'#64748b', flex:1 }} title={h.description}>{h.description?.slice(0,40)}{h.description?.length>40?'…':''}</span>
                  <span style={{ fontWeight:700, color: Number(h.amount)>0?'#16a34a':'#dc2626', marginLeft:8 }}>
                    {Number(h.amount)>0?'+':''}{fmt(h.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Low Stock */}
      <div className="card" style={{ marginBottom:20, borderColor:lowStock.length>0?'#fca5a5':'#86efac' }}>
        <div className="section-title">⚠️ Low Stock Alert</div>
        {lowStock.length===0
          ? <div className="alert alert-success">✅ All products are well stocked</div>
          : <div className="table-wrap"><table>
              <thead><tr><th>Product</th><th>Stock</th><th>Reorder At</th><th>Supplier</th><th>Contact</th></tr></thead>
              <tbody>{lowStock.map(p=>(
                <tr key={p.product_id}>
                  <td style={{ fontWeight:600 }}>{p.product_name}</td>
                  <td><span className={`badge ${p.quantity_in_stock===0?'badge-red':'badge-orange'}`}>{p.quantity_in_stock===0?'🚫 Out':'⚠️ '+p.quantity_in_stock}</span></td>
                  <td style={{ color:'#64748b' }}>{p.reorder_level}</td>
                  <td style={{ color:'#2563eb' }}>{p.supplier_name}</td>
                  <td style={{ color:'#64748b', fontSize:12 }}>{p.supplier_phone}</td>
                </tr>
              ))}</tbody>
            </table></div>}
      </div>

      <div className="grid-2" style={{ marginBottom:20 }}>
        <div className="card">
          <div className="section-title">💹 Revenue by Category</div>
          {catRevenue.length===0?<p style={{color:'#94a3b8'}}>No sales yet</p>:(
            <table><thead><tr><th>Category</th><th>Revenue</th></tr></thead>
              <tbody>{catRevenue.map(r=>(
                <tr key={r.category_name}><td><span className="tag">{r.category_name}</span></td>
                <td style={{fontWeight:700,color:'#16a34a'}}>{fmt(r.revenue)}</td></tr>
              ))}</tbody></table>
          )}
        </div>
        <div className="card">
          <div className="section-title">🏆 Top Products</div>
          {topProducts.length===0?<p style={{color:'#94a3b8'}}>No sales yet</p>:(
            <table><thead><tr><th>Product</th><th>Sold</th><th>Revenue</th></tr></thead>
              <tbody>{topProducts.map((p,i)=>(
                <tr key={p.product_name}>
                  <td><span style={{color:'#94a3b8',fontSize:11,marginRight:6}}>{i+1}.</span>{p.product_name}</td>
                  <td style={{fontWeight:600}}>{p.total_sold}</td>
                  <td style={{color:'#2563eb'}}>{fmt(p.revenue)}</td>
                </tr>
              ))}</tbody></table>
          )}
        </div>
      </div>

      {/* Deposit Modal */}
      {depositModal && (
        <div className="overlay" onClick={() => setDepositModal(false)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3>Add Budget Funds</h3>
            <p className="modal-sub">Current balance: {fmt(bal?.current_balance)}</p>
            <form onSubmit={addDeposit}>
              <div className="form-group"><label>Amount (Rs.)</label>
                <input className="form-input" type="number" min="1" value={depositForm.amount}
                  onChange={e=>setDepositForm({...depositForm,amount:e.target.value})} required /></div>
              <div className="form-group"><label>Description</label>
                <input className="form-input" placeholder="e.g. Monthly budget allocation"
                  value={depositForm.description}
                  onChange={e=>setDepositForm({...depositForm,description:e.target.value})} /></div>
              <div style={{display:'flex',gap:10}}>
                <button type="submit" className="btn btn-success">Add Funds</button>
                <button type="button" className="btn btn-outline" onClick={()=>setDepositModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
