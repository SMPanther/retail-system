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

function ProtectedLayout() {
  const { isLoggedIn, user } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;

  return (
    <div className="layout">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <div>
            <span style={{ fontWeight:600, fontSize:14 }}>
              {window.location.pathname === '/' ? '📊 Dashboard' :
               window.location.pathname.slice(1).charAt(0).toUpperCase() + window.location.pathname.slice(2)}
            </span>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <span style={{ color:'#64748b', fontSize:13 }}>
              Welcome, <strong>{user?.username}</strong>
            </span>
            <span style={{ background:'#eff6ff', color:'#2563eb', fontSize:11, padding:'2px 8px', borderRadius:4, fontWeight:600 }}>
              {user?.role?.toUpperCase()}
            </span>
          </div>
        </div>
        <Routes>
          <Route path="/"           element={<Dashboard />} />
          <Route path="/products"   element={<Products />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/suppliers"  element={<Suppliers />} />
          <Route path="/sales"      element={<Sales />} />
          <Route path="/new-sale"   element={<NewSale />} />
          <Route path="/customers"  element={<Customers />} />
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
