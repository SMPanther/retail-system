import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const NAV = [
  { section: 'Overview' },
  { path: '/',           label: '📊 Dashboard',  },
  { section: 'Inventory' },
  { path: '/products',   label: '📦 Products'    },
  { path: '/categories', label: '🏷️ Categories'  },
  { path: '/suppliers',  label: '🏭 Suppliers'   },
  { section: 'Sales' },
  { path: '/sales',      label: '🧾 Sales'       },
  { path: '/new-sale',   label: '➕ New Sale'     },
  { section: 'Customers' },
  { path: '/customers',  label: '👥 Customers'   },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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

      <div style={{ flex: 1 }} />
      <div style={{ padding: '16px 20px', borderTop: '1px solid rgba(255,255,255,.08)' }}>
        <div style={{ color: '#94a3b8', fontSize: 12, marginBottom: 8 }}>
          <span style={{ color: '#fff', fontWeight: 600 }}>{user?.username}</span>
          <span style={{ background: 'rgba(37,99,235,.3)', color: '#93c5fd', fontSize: 10, padding: '1px 6px', borderRadius: 4, marginLeft: 6 }}>
            {user?.role}
          </span>
        </div>
        <button className="btn btn-outline btn-sm" style={{ width: '100%', justifyContent: 'center', color: '#94a3b8', borderColor: 'rgba(255,255,255,.15)' }}
          onClick={() => { logout(); navigate('/login'); }}>
          Logout
        </button>
      </div>
    </div>
  );
}
