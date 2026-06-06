import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const fmt = n => n != null ? `Rs. ${Number(n).toLocaleString()}` : '—';

export default function Products() {
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers,  setSuppliers]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [catFilter,  setCatFilter]  = useState('All');
  const [showAdd,    setShowAdd]    = useState(false);
  const [restockModal, setRestockModal] = useState(null);
  const [restockQty,   setRestockQty]   = useState('');
  const [restockSupplier, setRestockSupplier] = useState('');
  const [msg, setMsg] = useState({ text:'', type:'' });
  const [form, setForm] = useState({ category_id:'', supplier_id:'', product_name:'', description:'', unit_price:'', reorder_level:10 });
  const { user } = useAuth();

  const flash = (text, type='success') => { setMsg({text,type}); setTimeout(()=>setMsg({text:'',type:''}),4000); };

  const load = async () => {
    const [p, c, s] = await Promise.all([api.get('/products'), api.get('/categories'), api.get('/suppliers')]);
    setProducts(p.data); setCategories(c.data); setSuppliers(s.data); setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const cats = ['All', ...new Set(products.map(p => p.category_name))];

  const filtered = products.filter(p => {
    const ms = p.product_name.toLowerCase().includes(search.toLowerCase()) ||
               p.supplier_name.toLowerCase().includes(search.toLowerCase());
    const mc = catFilter === 'All' || p.category_name === catFilter;
    return ms && mc;
  });

  const addProduct = async e => {
    e.preventDefault();
    try {
      await api.post('/products', form);
      flash('Product added!');
      setShowAdd(false);
      setForm({ category_id:'', supplier_id:'', product_name:'', description:'', unit_price:'', reorder_level:10 });
      load();
    } catch (err) { flash(err.response?.data?.error || 'Error', 'error'); }
  };

  const openRestock = (product) => {
    setRestockModal(product);
    setRestockQty('');
    // Pre-select current supplier
    setRestockSupplier(
      suppliers.find(s => s.supplier_name === product.supplier_name)?.supplier_id || ''
    );
  };

  const restock = async e => {
    e.preventDefault();
    try {
      await api.patch(`/products/${restockModal.product_id}/restock`, {
        quantity: Number(restockQty),
        supplier_id: restockSupplier || undefined,
      });
      flash(`✅ Restocked ${restockQty} units of "${restockModal.product_name}"`);
      setRestockModal(null); setRestockQty(''); setRestockSupplier('');
      load();
    } catch (err) { flash(err.response?.data?.error || 'Error', 'error'); }
  };

  const deleteProduct = async id => {
    if (!window.confirm('Delete this product? This cannot be undone.')) return;
    try {
      await api.delete(`/products/${id}`);
      flash('Product deleted'); load();
    } catch (err) { flash(err.response?.data?.error || 'Error', 'error'); }
  };

  if (loading) return <div className="loading">Loading products...</div>;

  return (
    <div className="content">
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:4 }}>
        <div>
          <h1 className="page-title">Products</h1>
          <p className="page-sub">{products.length} products — vw_product_details view</p>
        </div>
        {user?.role !== 'cashier' && (
          <button className="btn btn-primary" onClick={() => setShowAdd(!showAdd)}>
            {showAdd ? '✕ Cancel' : '+ Add Product'}
          </button>
        )}
      </div>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {/* Add Product Form */}
      {showAdd && (
        <div className="card" style={{ marginBottom:20, borderColor:'#bfdbfe' }}>
          <h3 style={{ fontSize:15, fontWeight:700, marginBottom:14 }}>Add New Product</h3>
          <form onSubmit={addProduct}>
            <div className="form-grid">
              <div className="form-group">
                <label>Product Name</label>
                <input className="form-input" placeholder="e.g. Laptop"
                  value={form.product_name} onChange={e => setForm({...form, product_name:e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Unit Price (Rs.)</label>
                <input className="form-input" type="number" step="0.01" value={form.unit_price}
                  onChange={e => setForm({...form, unit_price:e.target.value})} required />
              </div>
              <div className="form-group">
                <label>Category</label>
                <select className="form-input" value={form.category_id}
                  onChange={e => setForm({...form, category_id:e.target.value})} required>
                  <option value="">Select category</option>
                  {categories.map(c => <option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Supplier</label>
                <select className="form-input" value={form.supplier_id}
                  onChange={e => setForm({...form, supplier_id:e.target.value})} required>
                  <option value="">Select supplier</option>
                  {suppliers.map(s => <option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>Reorder Level</label>
                <input className="form-input" type="number" value={form.reorder_level}
                  onChange={e => setForm({...form, reorder_level:e.target.value})} />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input className="form-input" placeholder="Optional"
                  value={form.description} onChange={e => setForm({...form, description:e.target.value})} />
              </div>
            </div>
            <button type="submit" className="btn btn-primary btn-sm">Insert into Database</button>
          </form>
        </div>
      )}

      {/* Filters */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <input className="form-input" style={{ maxWidth:260 }} placeholder="Search products or supplier..."
          value={search} onChange={e => setSearch(e.target.value)} />
        <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
          {cats.map(c => (
            <button key={c} onClick={() => setCatFilter(c)}
              style={{ padding:'5px 12px', borderRadius:20, fontSize:12, fontWeight:500, cursor:'pointer',
                background:catFilter===c?'#2563eb':'white', color:catFilter===c?'white':'#64748b',
                border:catFilter===c?'1px solid #2563eb':'1px solid #e2e8f0', transition:'all .2s' }}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Products Table */}
      <div className="card" style={{ padding:0, overflow:'hidden' }}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Product</th><th>Category</th><th>Supplier</th><th>Price</th><th>Stock</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const low = p.quantity_in_stock <= 10;
                return (
                  <tr key={p.product_id}>
                    <td><span style={{ fontWeight:600 }}>{p.product_name}</span></td>
                    <td><span className="tag">{p.category_name}</span></td>
                    <td style={{ color:'#64748b', fontSize:12 }}>{p.supplier_name}</td>
                    <td style={{ fontWeight:600 }}>{fmt(p.unit_price)}</td>
                    <td style={{ fontWeight:600, color:low?'#dc2626':'#16a34a' }}>{p.quantity_in_stock}</td>
                    <td>
                      <span className={`badge ${p.quantity_in_stock===0?'badge-red':low?'badge-orange':'badge-green'}`}>
                        {p.quantity_in_stock===0?'Out of Stock':low?'Low Stock':'In Stock'}
                      </span>
                    </td>
                    <td>
                      <div style={{ display:'flex', gap:6 }}>
                        {user?.role !== 'cashier' && (
                          <button className="btn btn-success btn-sm" onClick={() => openRestock(p)}>
                            Restock
                          </button>
                        )}
                        {user?.role === 'admin' && (
                          <button className="btn btn-danger btn-sm" onClick={() => deleteProduct(p.product_id)}>
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restock Modal */}
      {restockModal && (
        <div className="overlay" onClick={() => setRestockModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h3>Restock Product</h3>
            <p className="modal-sub">{restockModal.product_name} — Current stock: <strong>{restockModal.quantity_in_stock}</strong></p>
            <form onSubmit={restock}>
              <div className="form-group">
                <label>Select Supplier</label>
                <select className="form-input" value={restockSupplier}
                  onChange={e => setRestockSupplier(e.target.value)} required>
                  <option value="">Choose supplier</option>
                  {suppliers.map(s => (
                    <option key={s.supplier_id} value={s.supplier_id}>
                      {s.supplier_name} {s.categories ? `— ${s.categories}` : ''}
                    </option>
                  ))}
                </select>
                <p style={{ fontSize:11, color:'#64748b', marginTop:4 }}>
                  Current supplier: <strong>{restockModal.supplier_name}</strong>
                </p>
              </div>
              <div className="form-group">
                <label>Quantity to Add</label>
                <input className="form-input" type="number" min="1" placeholder="e.g. 50"
                  value={restockQty} onChange={e => setRestockQty(e.target.value)} required autoFocus />
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <button type="submit" className="btn btn-success">✅ Confirm Restock</button>
                <button type="button" className="btn btn-outline" onClick={() => setRestockModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
