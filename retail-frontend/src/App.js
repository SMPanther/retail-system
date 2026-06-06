import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar    from './components/Sidebar';
import Login      from './pages/Login';
import Dashboard  from './pages/Dashboard';
import Products   from './pages/Products';
import Categories from './pages/Categories';
import Suppliers  from './pages/Suppliers';
import Sales      from './pages/Sales';
import NewSale    from './pages/NewSale';
import Customers  from './pages/Customers';

// Role guard component
function RequireRole({ allowed, children }) {
  const { user } = useAuth();
  if (!allowed.includes(user?.role)) return <Navigate to="/" replace />;
  return children;
}

const PAGE_TITLES = {
  '/': '📊 Dashboard', '/products': '📦 Products', '/categories': '🏷️ Categories',
  '/suppliers': '🏭 Suppliers', '/sales': '🧾 Sales History',
  '/new-sale': '➕ New Sale', '/customers': '👥 Customers',
};

function ProtectedLayout() {
  const { isLoggedIn, user } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  const path = window.location.pathname;
  const title = PAGE_TITLES[path] || 'RetailMS';

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <div style={{ fontWeight:600, fontSize:14 }}>{title}</div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ color:'#64748b', fontSize:13 }}>
              Welcome, <strong>{user?.username}</strong>
            </span>
            <span style={{
              background: user?.role==='admin'?'#eff6ff': user?.role==='manager'?'#f0fdf4':'#fff7ed',
              color:      user?.role==='admin'?'#2563eb': user?.role==='manager'?'#16a34a':'#ea580c',
              fontSize:11, padding:'2px 8px', borderRadius:4, fontWeight:600
            }}>
              {user?.role?.toUpperCase()}
            </span>
          </div>
        </div>
        <Routes>
          {/* Cashier can only access sales */}
          <Route path="/" element={
            <RequireRole allowed={['admin','manager']}>
              <Dashboard />
            </RequireRole>
          } />
          <Route path="/products" element={
            <RequireRole allowed={['admin','manager']}>
              <Products />
            </RequireRole>
          } />
          <Route path="/categories" element={
            <RequireRole allowed={['admin','manager']}>
              <Categories />
            </RequireRole>
          } />
          <Route path="/suppliers" element={
            <RequireRole allowed={['admin','manager']}>
              <Suppliers />
            </RequireRole>
          } />
          <Route path="/customers" element={
            <RequireRole allowed={['admin','manager']}>
              <Customers />
            </RequireRole>
          } />
          {/* Everyone can access sales */}
          <Route path="/sales"    element={<Sales />} />
          <Route path="/new-sale" element={<NewSale />} />
          {/* Cashier default page */}
          <Route path="*" element={<Navigate to="/new-sale" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*"     element={<ProtectedLayout />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
