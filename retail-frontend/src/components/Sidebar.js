import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const role = user?.role;

  // Role-based nav
  const NAV = [
    // Admin + Manager see dashboard
    ...(role !== 'cashier' ? [
      { section: 'Overview' },
      { path: '/', label: '📊 Dashboard' },
    ] : []),
    // Admin + Manager see inventory
    ...(role !== 'cashier' ? [
      { section: 'Inventory' },
      { path: '/products',   label: '📦 Products'   },
      { path: '/categories', label: '🏷️ Categories'  },
      { path: '/suppliers',  label: '🏭 Suppliers'   },
    ] : []),
    // Everyone sees sales
    { section: 'Sales' },
    { path: '/sales',     label: '🧾 Sales History' },
    { path: '/new-sale',  label: '➕ New Sale'       },
    // Admin + Manager see customers
    ...(role !== 'cashier' ? [
      { section: 'Customers' },
      { path: '/customers', label: '👥 Customers' },
    ] : []),
  ];

  const roleColors = { admin:'#3b82f6', manager:'#16a34a', cashier:'#ea580c' };

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
        <div style={{ marginBottom:8 }}>
          <span style={{ color:'#fff', fontWeight:600, fontSize:13 }}>{user?.username}</span>
          <span style={{
            background: `${roleColors[role]}33`,
            color: roleColors[role],
            fontSize:10, padding:'1px 7px', borderRadius:4, marginLeft:6, fontWeight:700
          }}>
            {role?.toUpperCase()}
          </span>
        </div>
        <div style={{ color:'#64748b', fontSize:11, marginBottom:10 }}>
          {role === 'admin'   && '✅ Full access'}
          {role === 'manager' && '📋 Inventory + Sales'}
          {role === 'cashier' && '🧾 Sales only'}
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
