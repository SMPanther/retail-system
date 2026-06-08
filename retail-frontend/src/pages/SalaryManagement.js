import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const fmt = n => `Rs. ${Number(n).toLocaleString()}`;
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const ROLE_BADGE = {
  manager:      { bg:'#dbeafe', color:'#1d4ed8' },
  cashier:      { bg:'#dcfce7', color:'#16a34a' },
  stock_handler:{ bg:'#ffedd5', color:'#ea580c' },
  rack_manager: { bg:'#fef9c3', color:'#ca8a04' },
};

export default function SalaryManagement() {
  const [summary,   setSummary]   = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [payModal,  setPayModal]  = useState(null);
  const [deductModal, setDeductModal] = useState(null);
  const [msg,  setMsg]  = useState({ text:'', type:'' });
  const [payForm,   setPayForm]   = useState({ amount:'', month_year:'', payment_method:'cash', notes:'' });
  const [deductForm, setDeductForm] = useState({ amount:'', reason:'' });

  const flash = (text, type='success') => { setMsg({text,type}); setTimeout(()=>setMsg({text:'',type:''}),4000); };
  const year  = new Date().getFullYear();
  const monthOptions = MONTHS.map(m => `${m} ${year}`);
  const currentMonth = `${MONTHS[new Date().getMonth()]} ${year}`;

  const load = async () => {
    const [s, e] = await Promise.all([
      api.get('/employees/salary/summary'),
      api.get('/employees'),
    ]);
    setSummary(s.data); setEmployees(e.data); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const paySalary = async e => {
    e.preventDefault();
    try {
      await api.post(`/employees/${payModal.employee_id}/pay`, payForm);
      flash(`✅ Salary paid to ${payModal.employee_name}`);
      setPayModal(null); setPayForm({ amount:'', month_year:'', payment_method:'cash', notes:'' });
      load();
    } catch(err) { flash(err.response?.data?.error || 'Error', 'error'); }
  };

  const deductSalary = async e => {
    e.preventDefault();
    if (!deductForm.amount || deductForm.amount <= 0) { flash('Enter valid amount', 'error'); return; }
    try {
      // Deductions use a negative amount and bypass the duplicate check
      await api.post(`/employees/${deductModal.employee_id}/pay`, {
        amount: -Math.abs(Number(deductForm.amount)),
        month_year: currentMonth,
        payment_method: 'cash',
        notes: `DEDUCTION: ${deductForm.reason || 'Manual deduction'}`,
      });
      flash(`Deduction applied to ${deductModal.employee_name}`);
      setDeductModal(null); setDeductForm({ amount:'', reason:'' });
      load();
    } catch(err) { flash(err.response?.data?.error || 'Error', 'error'); }
  };

  if (loading) return <div className="loading">Loading salary data...</div>;

  const totalPayroll  = summary.reduce((s,e) => s + Number(e.base_salary), 0);
  const totalPaidEver = summary.reduce((s,e) => s + Number(e.total_paid),  0);
  const paidThisMonth = summary.filter(e => e.paid_this_month).length;

  return (
    <div className="content">
      <h1 className="page-title">💰 Salary Management</h1>
      <p className="page-sub">Pay and manage employee salaries — Admin only · Current month: <strong>{currentMonth}</strong></p>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:14, marginBottom:24 }}>
        {[
          { label:'Monthly Payroll',    val:fmt(totalPayroll),  color:'#2563eb' },
          { label:'Total Paid (Ever)',  val:fmt(totalPaidEver), color:'#16a34a' },
          { label:'Paid This Month',    val:paidThisMonth,      color:'#7c3aed' },
          { label:'Pending This Month', val:summary.length - paidThisMonth, color:'#ea580c' },
        ].map(s => (
          <div key={s.label} className="stat-card">
            <div style={{ fontSize:26, fontWeight:800, color:s.color, fontFamily:'Plus Jakarta Sans,sans-serif' }}>{s.val}</div>
            <div style={{ fontSize:11, color:'#64748b', fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div style={{ padding:'14px 20px', borderBottom:'1px solid #e2e8f0', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          <span style={{ fontWeight:700, fontSize:14 }}>Employee Salary — vw_salary_summary</span>
          <span style={{ fontSize:12, color:'#64748b' }}>
            {paidThisMonth}/{summary.length} paid for {currentMonth}
          </span>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Employee</th><th>Role</th><th>Base Salary</th><th>This Month</th><th>Total Paid</th><th>Last Payment</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {summary.map(e => {
                const rb  = ROLE_BADGE[e.role] || { bg:'#f1f5f9', color:'#64748b' };
                const emp = employees.find(em => em.employee_id === e.employee_id);
                return (
                  <tr key={e.employee_id}>
                    <td style={{ fontWeight:600 }}>{e.employee_name}</td>
                    <td>
                      <span style={{ fontSize:11, fontWeight:600, padding:'1px 8px', borderRadius:4, background:rb.bg, color:rb.color }}>
                        {e.role?.replace('_',' ')}
                      </span>
                    </td>
                    <td style={{ fontWeight:600 }}>{fmt(e.base_salary)}</td>
                    <td>
                      {e.paid_this_month
                        ? <span className="badge badge-green">✅ Paid</span>
                        : <span className="badge badge-orange">⏳ Pending</span>}
                    </td>
                    <td style={{ fontWeight:700, color:'#16a34a' }}>{fmt(e.total_paid)}</td>
                    <td style={{ color:'#64748b', fontSize:12 }}>
                      {e.last_payment_date
                        ? `${new Date(e.last_payment_date).toLocaleDateString()} (${e.last_month_paid})`
                        : 'Never'}
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        {e.paid_this_month ? (
                          <span style={{ fontSize:12, color:'#16a34a', fontWeight:600, padding:'4px 10px', background:'#dcfce7', borderRadius:6 }}>
                            ✅ Paid for {currentMonth}
                          </span>
                        ) : (
                          <button className="btn btn-success btn-sm" onClick={() => {
                            setPayModal(e);
                            setPayForm({ amount:e.base_salary, month_year:currentMonth, payment_method:'cash', notes:'' });
                          }}>Pay</button>
                        )}
                        <button className="btn btn-danger btn-sm" onClick={() => {
                          setDeductModal(e); setDeductForm({ amount:'', reason:'' });
                        }}>Deduct</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pay Modal */}
      {payModal && (
        <div className="overlay" onClick={() => setPayModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Pay Salary</h3>
            <p className="modal-sub">{payModal.employee_name} · Base: {fmt(payModal.base_salary)}</p>
            <form onSubmit={paySalary}>
              <div className="form-group">
                <label>Month</label>
                <select className="form-input" value={payForm.month_year}
                  onChange={e => setPayForm({...payForm, month_year:e.target.value})} required>
                  <option value="">Select month...</option>
                  {monthOptions.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Amount (Rs.)</label>
                <input className="form-input" type="number" value={payForm.amount}
                  onChange={e => setPayForm({...payForm, amount:e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Payment Method</label>
                <select className="form-input" value={payForm.payment_method}
                  onChange={e => setPayForm({...payForm, payment_method:e.target.value})}>
                  <option value="cash">💵 Cash</option>
                  <option value="bank_transfer">🏦 Bank Transfer</option>
                  <option value="cheque">📄 Cheque</option>
                </select>
              </div>
              <div className="form-group">
                <label>Notes</label>
                <input className="form-input" value={payForm.notes} placeholder="Optional"
                  onChange={e => setPayForm({...payForm, notes:e.target.value})} />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button type="submit" className="btn btn-success">💰 Pay Now</button>
                <button type="button" className="btn btn-outline" onClick={() => setPayModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deduct Modal */}
      {deductModal && (
        <div className="overlay" onClick={() => setDeductModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Deduct Salary</h3>
            <p className="modal-sub">{deductModal.employee_name} · Base: {fmt(deductModal.base_salary)}</p>
            <div className="alert alert-warning" style={{ marginBottom:14 }}>
              ⚠️ This records a negative payment (deduction) for this employee.
            </div>
            <form onSubmit={deductSalary}>
              <div className="form-group">
                <label>Deduction Amount (Rs.)</label>
                <input className="form-input" type="number" min="1" placeholder="e.g. 5000"
                  value={deductForm.amount} onChange={e => setDeductForm({...deductForm, amount:e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Reason</label>
                <input className="form-input" placeholder="e.g. Late arrivals, absent days"
                  value={deductForm.reason} onChange={e => setDeductForm({...deductForm, reason:e.target.value})} />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button type="submit" className="btn btn-danger" style={{ background:'#dc2626', color:'#fff', border:'none' }}>Apply Deduction</button>
                <button type="button" className="btn btn-outline" onClick={() => setDeductModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
