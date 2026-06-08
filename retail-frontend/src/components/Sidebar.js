import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ROLE_COLOR = { admin:'#3b82f6', manager:'#16a34a', cashier:'#ea580c' };

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate  = useNavigate();
  const location  = useLocation();
  const role = user?.role;

  const NAV_ADMIN = [
    { section:'Overview' },
    { path:'/',           label:'📊 Dashboard'        },
    { section:'Inventory' },
    { path:'/products',   label:'📦 Products'         },
    { path:'/categories', label:'🏷️ Categories'       },
    { path:'/suppliers',  label:'🏭 Suppliers'         },
    { section:'Customers & Sales' },
    { path:'/customers',  label:'👥 Customers'         },
    { path:'/sales',      label:'🧾 Sales History'     },
    { section:'HR' },
    { path:'/employees',  label:'👤 Employees'         },
    { path:'/salary',     label:'💰 Salary Management' },
  ];

  const NAV_MANAGER = [
    { section:'Overview' },
    { path:'/',           label:'📋 My Dashboard'     },
    { section:'Inventory' },
    { path:'/products',   label:'📦 Products'         },
    { path:'/categories', label:'🏷️ Categories'       },
    { path:'/suppliers',  label:'🏭 Suppliers'         },
    { section:'Sales' },
    { path:'/new-sale',   label:'➕ New Sale'          },
    { path:'/sales',      label:'🧾 Sales History'     },
    { section:'HR' },
    { path:'/employees',  label:'👤 Employees'         },
    { path:'/duties',     label:'📋 Assign Duties'    },
  ];

  const NAV_CASHIER = [
    { section:'Sales' },
    { path:'/new-sale',   label:'➕ New Sale'          },
    { path:'/sales',      label:'🧾 Sales History'     },
  ];

  const NAV = role === 'admin' ? NAV_ADMIN : role === 'manager' ? NAV_MANAGER : NAV_CASHIER;

  return (
    <div className="sidebar">
      <div className="sidebar-logo">
        <h2>🏪 RetailMS</h2>
        <p>Retail Management System</p>
      </div>

      {NAV.map((item, i) =>
        item.section ? (
          <div key={i} className="nav-section">{item.section}</div>
        ) : (
          <div key={i}
            className={`nav-item ${location.pathname === item.path ? 'active' : ''}`}
            onClick={() => navigate(item.path)}>
            {item.label}
          </div>
        )
      )}

      <div style={{ flex:1 }} />
      <div style={{ padding:'16px 20px', borderTop:'1px solid rgba(255,255,255,.08)' }}>
        <div style={{ marginBottom:6 }}>
          <span style={{ color:'#fff', fontWeight:600, fontSize:13 }}>{user?.username}</span>
          <span style={{ background:`${ROLE_COLOR[role]}33`, color:ROLE_COLOR[role],
            fontSize:10, padding:'1px 7px', borderRadius:4, marginLeft:6, fontWeight:700 }}>
            {role?.toUpperCase()}
          </span>
        </div>
        <div style={{ color:'#475569', fontSize:11, marginBottom:10 }}>
          {role==='admin'   && 'Full system access'}
          {role==='manager' && 'Inventory + HR + Sales'}
          {role==='cashier' && 'Sales only'}
        </div>
        <button className="btn btn-outline btn-sm"
          style={{ width:'100%', justifyContent:'center', color:'#94a3b8', borderColor:'rgba(255,255,255,.15)' }}
          onClick={() => { logout(); navigate('/login'); }}>
          Logout
        </button>
      </div>
    </div>
  );
}
