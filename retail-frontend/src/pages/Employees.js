import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const fmt = n => `Rs. ${Number(n).toLocaleString()}`;

const ROLE_BADGE = {
  manager:      { bg:'#dbeafe', color:'#1d4ed8', label:'Manager' },
  cashier:      { bg:'#dcfce7', color:'#16a34a', label:'Cashier' },
  stock_handler:{ bg:'#ffedd5', color:'#ea580c', label:'Stock Handler' },
  rack_manager: { bg:'#fef9c3', color:'#ca8a04', label:'Rack Manager' },
};

const SHIFT_COLORS = {
  morning: { bg:'#fef9c3', color:'#92400e' },
  evening: { bg:'#ede9fe', color:'#6d28d9' },
  night:   { bg:'#1e293b', color:'#94a3b8'  },
};

const MONTHS = [
  'January','February','March','April','May','June',
  'July','August','September','October','November','December'
];

export default function Employees() {
  const [employees,  setEmployees]  = useState([]);
  const [duties,     setDuties]     = useState([]);
  const [salarySummary, setSalarySummary] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [tab,        setTab]        = useState('employees');
  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [msg,        setMsg]        = useState({ text:'', type:'' });

  // Modals
  const [addModal,    setAddModal]    = useState(false);
  const [assignModal, setAssignModal] = useState(null); // employee object
  const [payModal,    setPayModal]    = useState(null); // employee object
  const [detailModal, setDetailModal] = useState(null); // full employee detail

  // Forms
  const [addForm,    setAddForm]    = useState({ first_name:'', last_name:'', email:'', phone:'', role:'cashier', base_salary:'', address:'' });
  const [assignForm, setAssignForm] = useState({ duty_id:'', shift:'morning', notes:'', manager_employee_id:'' });
  const [payForm,    setPayForm]    = useState({ amount:'', month_year:'', payment_method:'cash', notes:'' });

  const { user } = useAuth();
  const isAdmin   = user?.role === 'admin';
  const isManager = user?.role === 'manager';

  const flash = (text, type='success') => { setMsg({text,type}); setTimeout(()=>setMsg({text:'',type:''}),4000); };

  const load = async () => {
    try {
      const [e, d] = await Promise.all([api.get('/employees'), api.get('/employees/duties/list')]);
      setEmployees(e.data); setDuties(d.data);
      if (isAdmin) {
        const s = await api.get('/employees/salary/summary');
        setSalarySummary(s.data);
      }
    } catch(err) { console.error(err); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openDetail = async emp => {
    const res = await api.get(`/employees/${emp.employee_id}`);
    setDetailModal(res.data);
  };

  const addEmployee = async e => {
    e.preventDefault();
    try {
      await api.post('/employees', addForm);
      flash('Employee added!');
      setAddModal(false);
      setAddForm({ first_name:'', last_name:'', email:'', phone:'', role:'cashier', base_salary:'', address:'' });
      load();
    } catch(err) { flash(err.response?.data?.error || 'Error', 'error'); }
  };

  const assignDuty = async e => {
    e.preventDefault();
    try {
      await api.post(`/employees/${assignModal.employee_id}/assign`, assignForm);
      flash(`Duty assigned to ${assignModal.first_name}!`);
      setAssignModal(null);
      setAssignForm({ duty_id:'', shift:'morning', notes:'', manager_employee_id:'' });
      load();
    } catch(err) { flash(err.response?.data?.error || 'Error', 'error'); }
  };

  const paySalary = async e => {
    e.preventDefault();
    try {
      await api.post(`/employees/${payModal.employee_id}/pay`, payForm);
      flash(`Salary paid to ${payModal.first_name}!`);
      setPayModal(null);
      setPayForm({ amount:'', month_year:'', payment_method:'cash', notes:'' });
      load();
    } catch(err) { flash(err.response?.data?.error || 'Error', 'error'); }
  };

  const toggleStatus = async (emp) => {
    const newStatus = emp.status === 'active' ? 'inactive' : 'active';
    try {
      await api.patch(`/employees/${emp.employee_id}/status`, { status: newStatus });
      flash(`Employee marked ${newStatus}`);
      load();
    } catch(err) { flash(err.response?.data?.error || 'Error', 'error'); }
  };

  // Managers for assign dropdown
  const managers = employees.filter(e => e.role === 'manager');

  const filtered = employees.filter(e => {
    const name = `${e.first_name} ${e.last_name}`.toLowerCase();
    const matchSearch = name.includes(search.toLowerCase()) || (e.email||'').toLowerCase().includes(search.toLowerCase());
    const matchRole   = roleFilter === 'all' || e.role === roleFilter;
    return matchSearch && matchRole;
  });

  const currentYear = new Date().getFullYear();
  const monthOptions = MONTHS.map(m => `${m} ${currentYear}`);

  if (loading) return <div className="loading">Loading employees...</div>;

  const TABS = [
    { id:'employees', label:'👥 Employees' },
    ...(isAdmin ? [{ id:'salary', label:'💰 Salary Management' }] : []),
  ];

  return (
    <div className="content">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
        <div>
          <h1 className="page-title">HR Management</h1>
          <p className="page-sub">
            {isAdmin ? 'Manage employees, assign duties, pay salaries' : 'Assign duties to your team'}
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={() => setAddModal(true)}>+ Add Employee</button>
        )}
      </div>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, marginBottom:20 }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            style={{ padding:'7px 18px', borderRadius:8, fontSize:13, fontWeight:500, cursor:'pointer',
              background:tab===t.id?'#2563eb':'white', color:tab===t.id?'white':'#64748b',
              border:tab===t.id?'1px solid #2563eb':'1px solid #e2e8f0' }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── EMPLOYEES TAB ── */}
      {tab === 'employees' && (
        <>
          {/* Filters */}
          <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
            <input className="form-input" style={{ maxWidth:240 }} placeholder="Search employees..."
              value={search} onChange={e => setSearch(e.target.value)} />
            {['all','manager','cashier','stock_handler','rack_manager'].map(r => (
              <button key={r} onClick={() => setRoleFilter(r)}
                style={{ padding:'5px 12px', borderRadius:20, fontSize:12, fontWeight:500, cursor:'pointer',
                  background:roleFilter===r?'#2563eb':'white', color:roleFilter===r?'white':'#64748b',
                  border:roleFilter===r?'1px solid #2563eb':'1px solid #e2e8f0' }}>
                {r === 'all' ? 'All' : r.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}
              </button>
            ))}
          </div>

          {/* Stats row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(150px,1fr))', gap:12, marginBottom:20 }}>
            {[
              { label:'Total Staff',    val:employees.length,                            color:'#2563eb' },
              { label:'Managers',       val:employees.filter(e=>e.role==='manager').length, color:'#7c3aed' },
              { label:'Cashiers',       val:employees.filter(e=>e.role==='cashier').length, color:'#16a34a' },
              { label:'Stock Handlers', val:employees.filter(e=>e.role==='stock_handler').length, color:'#ea580c' },
              { label:'Rack Managers',  val:employees.filter(e=>e.role==='rack_manager').length, color:'#ca8a04' },
              { label:'Active',         val:employees.filter(e=>e.status==='active').length,  color:'#16a34a' },
            ].map(s => (
              <div key={s.label} className="stat-card" style={{ padding:'14px 16px' }}>
                <div style={{ fontSize:24, fontWeight:800, color:s.color, fontFamily:'Plus Jakarta Sans,sans-serif' }}>{s.val}</div>
                <div style={{ fontSize:11, color:'#64748b', fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Employee Cards */}
          <div className="grid-3">
            {filtered.map(emp => {
              const rb = ROLE_BADGE[emp.role] || { bg:'#f1f5f9', color:'#64748b', label:emp.role };
              const sc = emp.shift ? SHIFT_COLORS[emp.shift] : null;
              return (
                <div key={emp.employee_id} className="card"
                  style={{ display:'flex', flexDirection:'column', gap:10,
                    opacity: emp.status==='inactive' ? .6 : 1,
                    borderColor: emp.status==='inactive' ? '#e2e8f0' : undefined }}>
                  {/* Header */}
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start' }}>
                    <div style={{ display:'flex', gap:10, alignItems:'center' }}>
                      <div style={{ width:42, height:42, borderRadius:50, background:rb.bg,
                        display:'flex', alignItems:'center', justifyContent:'center',
                        fontSize:16, fontWeight:700, color:rb.color, flexShrink:0 }}>
                        {emp.first_name[0]}{emp.last_name[0]}
                      </div>
                      <div>
                        <div style={{ fontWeight:700, fontSize:14 }}>{emp.first_name} {emp.last_name}</div>
                        <span style={{ fontSize:11, fontWeight:600, padding:'1px 7px', borderRadius:4,
                          background:rb.bg, color:rb.color }}>
                          {rb.label}
                        </span>
                      </div>
                    </div>
                    <span className={`badge ${emp.status==='active'?'badge-green':'badge-gray'}`}>
                      {emp.status}
                    </span>
                  </div>

                  {/* Contact */}
                  <div style={{ display:'flex', flexDirection:'column', gap:3 }}>
                    {emp.email && <div style={{ fontSize:12, color:'#64748b' }}>✉️ {emp.email}</div>}
                    {emp.phone && <div style={{ fontSize:12, color:'#64748b' }}>📞 {emp.phone}</div>}
                    <div style={{ fontSize:12, color:'#16a34a', fontWeight:600 }}>💰 {fmt(emp.base_salary)}/month</div>
                  </div>

                  {/* Current Duty */}
                  <div style={{ paddingTop:8, borderTop:'1px solid #f1f5f9' }}>
                    {emp.duty_name ? (
                      <div>
                        <div style={{ fontSize:10, color:'#94a3b8', fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em', marginBottom:4 }}>
                          Current Duty
                        </div>
                        <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                          <span className="tag">{emp.duty_name}</span>
                          {sc && (
                            <span style={{ fontSize:10, padding:'1px 7px', borderRadius:4, fontWeight:600,
                              background:sc.bg, color:sc.color }}>
                              {emp.shift} shift
                            </span>
                          )}
                        </div>
                        {emp.manager_name && (
                          <div style={{ fontSize:11, color:'#94a3b8', marginTop:3 }}>
                            Assigned by: {emp.manager_name}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div style={{ color:'#94a3b8', fontSize:12, fontStyle:'italic' }}>No duty assigned</div>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:4 }}>
                    <button className="btn btn-outline btn-sm" onClick={() => openDetail(emp)}>
                      View
                    </button>
                    {(isAdmin || isManager) && emp.status === 'active' && (
                      <button className="btn btn-primary btn-sm" onClick={() => {
                        setAssignModal(emp);
                        setAssignForm({ duty_id:'', shift:'morning', notes:'', manager_employee_id: managers[0]?.employee_id || '' });
                      }}>
                        Assign Duty
                      </button>
                    )}
                    {isAdmin && (
                      <>
                        <button className="btn btn-success btn-sm" onClick={() => {
                          setPayModal(emp);
                          setPayForm({ amount: emp.base_salary, month_year: monthOptions[new Date().getMonth()], payment_method:'cash', notes:'' });
                        }}>
                          Pay Salary
                        </button>
                        <button className="btn btn-outline btn-sm"
                          style={{ color: emp.status==='active'?'#dc2626':'#16a34a',
                            borderColor: emp.status==='active'?'#dc2626':'#16a34a' }}
                          onClick={() => toggleStatus(emp)}>
                          {emp.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── SALARY TAB (admin only) ── */}
      {tab === 'salary' && isAdmin && (
        <>
          <div style={{ marginBottom:16 }}>
            <div style={{ fontWeight:700, fontSize:15, marginBottom:4 }}>
              💰 Salary Summary — vw_salary_summary
            </div>
            <p style={{ color:'#64748b', fontSize:11, fontFamily:'monospace' }}>
              VIEW: Employee LEFT JOIN Salary_Payment → SUM() + COUNT() + MAX()
            </p>
          </div>

          {/* Total payroll stat */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:12, marginBottom:20 }}>
            {[
              { label:'Total Employees', val:salarySummary.length, color:'#2563eb' },
              { label:'Monthly Payroll', val:fmt(salarySummary.reduce((s,e)=>s+Number(e.base_salary),0)), color:'#16a34a' },
              { label:'Total Paid (All Time)', val:fmt(salarySummary.reduce((s,e)=>s+Number(e.total_paid),0)), color:'#7c3aed' },
            ].map(s => (
              <div key={s.label} className="stat-card">
                <div style={{ fontSize:26, fontWeight:800, color:s.color, fontFamily:'Plus Jakarta Sans,sans-serif' }}>{s.val}</div>
                <div style={{ fontSize:11, color:'#64748b', fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em' }}>{s.label}</div>
              </div>
            ))}
          </div>

          <div className="card" style={{ padding:0, overflow:'hidden' }}>
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Employee</th><th>Role</th><th>Base Salary</th>
                    <th>Payments Made</th><th>Total Paid</th><th>Last Payment</th><th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {salarySummary.map(e => {
                    const rb = ROLE_BADGE[e.role] || { bg:'#f1f5f9', color:'#64748b', label:e.role };
                    const emp = employees.find(em => em.employee_id === e.employee_id);
                    return (
                      <tr key={e.employee_id}>
                        <td style={{ fontWeight:600 }}>{e.employee_name}</td>
                        <td>
                          <span style={{ fontSize:11, fontWeight:600, padding:'1px 8px', borderRadius:4,
                            background:rb.bg, color:rb.color }}>
                            {rb.label}
                          </span>
                        </td>
                        <td style={{ fontWeight:600 }}>{fmt(e.base_salary)}</td>
                        <td style={{ color:'#64748b' }}>{e.total_payments}</td>
                        <td style={{ fontWeight:700, color:'#16a34a' }}>{fmt(e.total_paid)}</td>
                        <td style={{ color:'#64748b', fontSize:12 }}>
                          {e.last_payment_date
                            ? `${new Date(e.last_payment_date).toLocaleDateString()} (${e.last_month_paid})`
                            : 'Never paid'}
                        </td>
                        <td>
                          {emp && (
                            <button className="btn btn-success btn-sm" onClick={() => {
                              setPayModal(emp);
                              setPayForm({ amount:emp.base_salary, month_year:monthOptions[new Date().getMonth()], payment_method:'cash', notes:'' });
                            }}>
                              Pay
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── ADD EMPLOYEE MODAL ── */}
      {addModal && (
        <div className="overlay" onClick={() => setAddModal(false)}>
          <div className="modal" style={{ maxWidth:540 }} onClick={e => e.stopPropagation()}>
            <h3>Add Employee</h3>
            <p className="modal-sub">New employee will be added to the HR system</p>
            <form onSubmit={addEmployee}>
              <div className="form-grid">
                <div className="form-group">
                  <label>First Name</label>
                  <input className="form-input" value={addForm.first_name}
                    onChange={e => setAddForm({...addForm, first_name:e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Last Name</label>
                  <input className="form-input" value={addForm.last_name}
                    onChange={e => setAddForm({...addForm, last_name:e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Role</label>
                  <select className="form-input" value={addForm.role}
                    onChange={e => setAddForm({...addForm, role:e.target.value})}>
                    <option value="cashier">Cashier</option>
                    <option value="manager">Manager</option>
                    <option value="stock_handler">Stock Handler</option>
                    <option value="rack_manager">Rack Manager</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Base Salary (Rs.)</label>
                  <input className="form-input" type="number" value={addForm.base_salary}
                    onChange={e => setAddForm({...addForm, base_salary:e.target.value})} required />
                </div>
                <div className="form-group">
                  <label>Email</label>
                  <input className="form-input" type="email" value={addForm.email}
                    onChange={e => setAddForm({...addForm, email:e.target.value})} />
                </div>
                <div className="form-group">
                  <label>Phone</label>
                  <input className="form-input" value={addForm.phone}
                    onChange={e => setAddForm({...addForm, phone:e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Address</label>
                <input className="form-input" value={addForm.address}
                  onChange={e => setAddForm({...addForm, address:e.target.value})} />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button type="submit" className="btn btn-primary">Add Employee</button>
                <button type="button" className="btn btn-outline" onClick={() => setAddModal(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ASSIGN DUTY MODAL ── */}
      {assignModal && (
        <div className="overlay" onClick={() => setAssignModal(null)}>
          <div className="modal" style={{ maxWidth:480 }} onClick={e => e.stopPropagation()}>
            <h3>Assign Duty</h3>
            <p className="modal-sub">
              Assigning duty to: <strong>{assignModal.first_name} {assignModal.last_name}</strong>
              {assignModal.duty_name && <span style={{ color:'#94a3b8' }}> · Currently: {assignModal.duty_name}</span>}
            </p>
            <form onSubmit={assignDuty}>
              <div className="form-group">
                <label>Select Duty</label>
                <select className="form-input" value={assignForm.duty_id}
                  onChange={e => setAssignForm({...assignForm, duty_id:e.target.value})} required>
                  <option value="">Choose duty...</option>
                  {Object.entries(
                    duties.reduce((acc, d) => { (acc[d.department] = acc[d.department]||[]).push(d); return acc; }, {})
                  ).map(([dept, ds]) => (
                    <optgroup key={dept} label={`── ${dept}`}>
                      {ds.map(d => <option key={d.duty_id} value={d.duty_id}>{d.duty_name}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Shift</label>
                <select className="form-input" value={assignForm.shift}
                  onChange={e => setAssignForm({...assignForm, shift:e.target.value})}>
                  <option value="morning">🌅 Morning</option>
                  <option value="evening">🌆 Evening</option>
                  <option value="night">🌙 Night</option>
                </select>
              </div>
              <div className="form-group">
                <label>Assigned By (Manager)</label>
                <select className="form-input" value={assignForm.manager_employee_id}
                  onChange={e => setAssignForm({...assignForm, manager_employee_id:e.target.value})} required>
                  <option value="">Select manager...</option>
                  {managers.map(m => (
                    <option key={m.employee_id} value={m.employee_id}>
                      {m.first_name} {m.last_name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Notes (optional)</label>
                <input className="form-input" placeholder="e.g. Handle electronics section"
                  value={assignForm.notes}
                  onChange={e => setAssignForm({...assignForm, notes:e.target.value})} />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button type="submit" className="btn btn-primary">✅ Assign Duty</button>
                <button type="button" className="btn btn-outline" onClick={() => setAssignModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── PAY SALARY MODAL ── */}
      {payModal && (
        <div className="overlay" onClick={() => setPayModal(null)}>
          <div className="modal" style={{ maxWidth:440 }} onClick={e => e.stopPropagation()}>
            <h3>Pay Salary</h3>
            <p className="modal-sub">
              Paying: <strong>{payModal.first_name} {payModal.last_name}</strong> · Base: {fmt(payModal.base_salary)}
            </p>
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
                <input className="form-input" type="number" step="0.01"
                  value={payForm.amount}
                  onChange={e => setPayForm({...payForm, amount:e.target.value})} required />
                <p style={{ fontSize:11, color:'#64748b', marginTop:4 }}>
                  Base salary: {fmt(payModal.base_salary)} — adjust if needed
                </p>
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
                <label>Notes (optional)</label>
                <input className="form-input" placeholder="e.g. June 2026 salary"
                  value={payForm.notes}
                  onChange={e => setPayForm({...payForm, notes:e.target.value})} />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button type="submit" className="btn btn-success">💰 Pay Salary</button>
                <button type="button" className="btn btn-outline" onClick={() => setPayModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EMPLOYEE DETAIL MODAL ── */}
      {detailModal && (
        <div className="overlay" onClick={() => setDetailModal(null)}>
          <div className="modal" style={{ maxWidth:580 }} onClick={e => e.stopPropagation()}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:16 }}>
              <div>
                <h3>{detailModal.first_name} {detailModal.last_name}</h3>
                <p className="modal-sub" style={{ marginBottom:0 }}>
                  {ROLE_BADGE[detailModal.role]?.label} · Joined {new Date(detailModal.join_date).toLocaleDateString()}
                </p>
              </div>
              <span className={`badge ${detailModal.status==='active'?'badge-green':'badge-gray'}`}>
                {detailModal.status}
              </span>
            </div>

            {/* Info */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8, marginBottom:16 }}>
              {[
                { label:'Email',       val: detailModal.email   || '—' },
                { label:'Phone',       val: detailModal.phone   || '—' },
                { label:'Base Salary', val: fmt(detailModal.base_salary) },
                { label:'Address',     val: detailModal.address || '—' },
              ].map(f => (
                <div key={f.label} style={{ padding:'8px 12px', background:'#f8fafc', borderRadius:6 }}>
                  <div style={{ fontSize:10, color:'#94a3b8', fontWeight:600, textTransform:'uppercase' }}>{f.label}</div>
                  <div style={{ fontSize:13, fontWeight:500, color:'#1e293b', marginTop:2 }}>{f.val}</div>
                </div>
              ))}
            </div>

            {/* Duty History */}
            <div style={{ marginBottom:16 }}>
              <div style={{ fontWeight:700, fontSize:13, marginBottom:8 }}>📋 Duty History</div>
              {!detailModal.duties?.length ? (
                <p style={{ color:'#94a3b8', fontSize:12 }}>No duties recorded</p>
              ) : (
                <table style={{ width:'100%', fontSize:12 }}>
                  <thead><tr><th>Duty</th><th>Shift</th><th>Status</th><th>Assigned By</th><th>Date</th></tr></thead>
                  <tbody>
                    {detailModal.duties.map(d => (
                      <tr key={d.assignment_id}>
                        <td style={{ fontWeight:600 }}>{d.duty_name}</td>
                        <td>{d.shift}</td>
                        <td><span className={`badge ${d.status==='active'?'badge-green':d.status==='completed'?'badge-blue':'badge-gray'}`}>{d.status}</span></td>
                        <td style={{ color:'#64748b' }}>{d.assigned_by_name}</td>
                        <td style={{ color:'#64748b' }}>{new Date(d.assigned_date).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Salary History */}
            {isAdmin && (
              <div>
                <div style={{ fontWeight:700, fontSize:13, marginBottom:8 }}>💰 Salary Payment History</div>
                {!detailModal.payments?.length ? (
                  <p style={{ color:'#94a3b8', fontSize:12 }}>No payments recorded</p>
                ) : (
                  <table style={{ width:'100%', fontSize:12 }}>
                    <thead><tr><th>Month</th><th>Amount</th><th>Method</th><th>Date</th></tr></thead>
                    <tbody>
                      {detailModal.payments.map(p => (
                        <tr key={p.payment_id}>
                          <td style={{ fontWeight:600 }}>{p.month_year}</td>
                          <td style={{ color:'#16a34a', fontWeight:700 }}>{fmt(p.amount)}</td>
                          <td>{p.payment_method}</td>
                          <td style={{ color:'#64748b' }}>{new Date(p.payment_date).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            <button className="btn btn-outline" style={{ marginTop:16 }} onClick={() => setDetailModal(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
