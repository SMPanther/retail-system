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
  night:  { bg:'#1e293b', color:'#94a3b8'  },
};

export default function AssignDuties() {
  const [employees, setEmployees] = useState([]);
  const [duties,    setDuties]    = useState([]);
  const [managers,  setManagers]  = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [assignModal, setAssignModal] = useState(null);
  const [assignForm,  setAssignForm]  = useState({ duty_id:'', shift:'morning', notes:'', manager_employee_id:'' });
  const [msg, setMsg] = useState({ text:'', type:'' });
  const [search,     setSearch]     = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const flash = (text, type='success') => { setMsg({text,type}); setTimeout(()=>setMsg({text:'',type:''}),3500); };

  const load = async () => {
    const [e, d] = await Promise.all([api.get('/employees'), api.get('/employees/duties/list')]);
    setEmployees(e.data);
    setManagers(e.data.filter(em => em.role === 'manager'));
    setDuties(d.data);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openAssign = emp => {
    setAssignModal(emp);
    setAssignForm({ duty_id:'', shift:'morning', notes:'', manager_employee_id: managers[0]?.employee_id || '' });
  };

  const assignDuty = async e => {
    e.preventDefault();
    try {
      await api.post(`/employees/${assignModal.employee_id}/assign`, assignForm);
      flash(`Duty assigned to ${assignModal.first_name}!`);
      setAssignModal(null);
      load();
    } catch(err) { flash(err.response?.data?.error || 'Error', 'error'); }
  };

  const filtered = employees.filter(e => {
    const name = `${e.first_name} ${e.last_name}`.toLowerCase();
    const ms = name.includes(search.toLowerCase());
    const mr = roleFilter === 'all' || e.role === roleFilter;
    return ms && mr && e.status === 'active';
  });

  // Counts
  const assigned   = employees.filter(e => e.duty_name && e.status==='active').length;
  const unassigned = employees.filter(e => !e.duty_name && e.status==='active').length;

  if (loading) return <div className="loading">Loading...</div>;

  return (
    <div className="content">
      <h1 className="page-title">Assign Duties</h1>
      <p className="page-sub">Manage shift assignments for your team</p>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {/* Stats */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:20 }}>
        {[
          { label:'Active Staff',  val:employees.filter(e=>e.status==='active').length, color:'#2563eb' },
          { label:'On Duty',       val:assigned,   color:'#16a34a' },
          { label:'Unassigned',    val:unassigned, color:'#ea580c' },
          { label:'Total Duties',  val:duties.length, color:'#7c3aed' },
        ].map(s => (
          <div key={s.label} className="stat-card" style={{ padding:'14px 16px' }}>
            <div style={{ fontSize:24, fontWeight:800, color:s.color, fontFamily:'Plus Jakarta Sans,sans-serif' }}>{s.val}</div>
            <div style={{ fontSize:11, color:'#64748b', fontWeight:600, textTransform:'uppercase', letterSpacing:'.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <input className="form-input" style={{ maxWidth:240 }} placeholder="Search employees..."
          value={search} onChange={e => setSearch(e.target.value)} />
        {['all','cashier','stock_handler','rack_manager'].map(r => (
          <button key={r} onClick={() => setRoleFilter(r)}
            style={{ padding:'5px 12px', borderRadius:20, fontSize:12, fontWeight:500, cursor:'pointer',
              background:roleFilter===r?'#2563eb':'white', color:roleFilter===r?'white':'#64748b',
              border:roleFilter===r?'1px solid #2563eb':'1px solid #e2e8f0' }}>
            {r==='all'?'All':r.replace('_',' ').replace(/\b\w/g,c=>c.toUpperCase())}
          </button>
        ))}
      </div>

      {/* Employee duty cards */}
      <div className="grid-3">
        {filtered.map(emp => {
          const rb = ROLE_BADGE[emp.role] || { bg:'#f1f5f9', color:'#64748b' };
          const sc = emp.shift ? SHIFT_COLOR[emp.shift] : null;
          return (
            <div key={emp.employee_id} className="card" style={{ display:'flex', flexDirection:'column', gap:10 }}>
              {/* Header */}
              <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                <div style={{ width:40, height:40, borderRadius:50, background:rb.bg,
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontSize:15, fontWeight:700, color:rb.color, flexShrink:0 }}>
                  {emp.first_name[0]}{emp.last_name[0]}
                </div>
                <div style={{ flex:1 }}>
                  <div style={{ fontWeight:700, fontSize:14 }}>{emp.first_name} {emp.last_name}</div>
                  <span style={{ fontSize:11, fontWeight:600, padding:'1px 7px', borderRadius:4, background:rb.bg, color:rb.color }}>
                    {emp.role?.replace('_',' ')}
                  </span>
                </div>
              </div>

              {/* Current Duty */}
              <div style={{ padding:'10px 12px', borderRadius:8, background: emp.duty_name ? '#f0fdf4':'#fef2f2', border:`1px solid ${emp.duty_name?'#86efac':'#fca5a5'}` }}>
                {emp.duty_name ? (
                  <>
                    <div style={{ fontSize:11, color:'#94a3b8', marginBottom:4 }}>CURRENT DUTY</div>
                    <div style={{ fontWeight:700, fontSize:13 }}>{emp.duty_name}</div>
                    <div style={{ display:'flex', gap:6, marginTop:4, flexWrap:'wrap' }}>
                      {sc && <span style={{ fontSize:10, padding:'1px 7px', borderRadius:4, fontWeight:600, background:sc.bg, color:sc.color }}>{emp.shift} shift</span>}
                      {emp.manager_name && <span style={{ fontSize:11, color:'#64748b' }}>by {emp.manager_name}</span>}
                    </div>
                  </>
                ) : (
                  <div style={{ color:'#dc2626', fontSize:13, fontWeight:600 }}>⚠️ No duty assigned</div>
                )}
              </div>

              <button className="btn btn-primary btn-sm" style={{ justifyContent:'center' }} onClick={() => openAssign(emp)}>
                {emp.duty_name ? '🔄 Reassign Duty' : '➕ Assign Duty'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Assign Modal */}
      {assignModal && (
        <div className="overlay" onClick={() => setAssignModal(null)}>
          <div className="modal" style={{ maxWidth:480 }} onClick={e => e.stopPropagation()}>
            <h3>Assign Duty</h3>
            <p className="modal-sub">
              <strong>{assignModal.first_name} {assignModal.last_name}</strong>
              {assignModal.duty_name && <span style={{ color:'#94a3b8' }}> · Currently: {assignModal.duty_name} ({assignModal.shift})</span>}
            </p>
            <form onSubmit={assignDuty}>
              <div className="form-group">
                <label>Select Duty</label>
                <select className="form-input" value={assignForm.duty_id}
                  onChange={e => setAssignForm({...assignForm, duty_id:e.target.value})} required>
                  <option value="">Choose duty...</option>
                  {Object.entries(
                    duties.reduce((acc,d) => { (acc[d.department]=acc[d.department]||[]).push(d); return acc; },{})
                  ).map(([dept,ds]) => (
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
                    <option key={m.employee_id} value={m.employee_id}>{m.first_name} {m.last_name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Notes (optional)</label>
                <input className="form-input" placeholder="e.g. Handle electronics section"
                  value={assignForm.notes} onChange={e => setAssignForm({...assignForm, notes:e.target.value})} />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button type="submit" className="btn btn-primary">✅ Assign</button>
                <button type="button" className="btn btn-outline" onClick={() => setAssignModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
