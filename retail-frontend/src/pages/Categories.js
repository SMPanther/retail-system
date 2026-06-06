import React, { useEffect, useState } from 'react';
import api from '../api/axios';

const ICONS = ['Electronics','Clothing','Groceries','Home & Kitchen','Sports','Stationery'];
const ICON_MAP = { 'Electronics':'💻','Clothing':'👔','Groceries':'🛒','Home & Kitchen':'🏠','Sports':'⚽','Stationery':'📝' };

export default function Categories() {
  const [categories, setCategories] = useState([]);
  const [products,   setProducts]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [showAdd, setShowAdd]       = useState(false);
  const [msg, setMsg]               = useState({ text:'', type:'' });
  const [form, setForm]             = useState({ category_name:'', description:'' });

  const flash = (text, type='success') => { setMsg({text,type}); setTimeout(()=>setMsg({text:'',type:''}),3000); };

  const load = async () => {
    const [c, p] = await Promise.all([api.get('/categories'), api.get('/products')]);
    setCategories(c.data); setProducts(p.data); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const addCategory = async e => {
    e.preventDefault();
    try {
      await api.post('/categories', form);
      flash('Category added!');
      setShowAdd(false);
      setForm({ category_name:'', description:'' });
      load();
    } catch (err) { flash(err.response?.data?.error || 'Error', 'error'); }
  };

  const countFor = name => products.filter(p => p.category_name === name).length;

  if (loading) return <div className="loading">Loading categories...</div>;

  return (
    <div className="content">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
        <div>
          <h1 className="page-title">Categories</h1>
          <p className="page-sub">{categories.length} product categories</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
          {showAdd ? '✕ Cancel' : '+ Add Category'}
        </button>
      </div>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {showAdd && (
        <div className="card" style={{ marginBottom:16, borderColor:'#bfdbfe' }}>
          <h3 style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>Add Category</h3>
          <form onSubmit={addCategory}>
            <div className="form-grid">
              <div className="form-group">
                <label>Category Name</label>
                <input className="form-input" value={form.category_name}
                  onChange={e => setForm({...form, category_name:e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input className="form-input" value={form.description}
                  onChange={e => setForm({...form, description:e.target.value})} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-sm">Add Category</button>
          </form>
        </div>
      )}

      <div className="grid-3">
        {categories.map(c => (
          <div key={c.category_id} className="card" style={{ display:'flex', flexDirection:'column', gap:10 }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:46, height:46, borderRadius:12, background:'#eff6ff', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22 }}>
                {ICON_MAP[c.category_name] || '📦'}
              </div>
              <div>
                <div style={{ fontWeight:700, fontSize:15 }}>{c.category_name}</div>
                <div style={{ color:'#64748b', fontSize:12 }}>{c.description || 'No description'}</div>
              </div>
            </div>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', paddingTop:8, borderTop:'1px solid #f1f5f9' }}>
              <span style={{ color:'#64748b', fontSize:12 }}>Products</span>
              <span style={{ fontWeight:700, color:'#2563eb', fontSize:16 }}>{countFor(c.category_name)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
