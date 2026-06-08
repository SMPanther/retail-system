import React, { useEffect, useState } from 'react';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';

const fmt = n => n!=null ? `Rs. ${Number(n).toLocaleString()}` : '—';

export default function Products() {
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers,  setSuppliers]  = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [search,     setSearch]     = useState('');
  const [catFilter,  setCatFilter]  = useState('All');
  const [showAdd,    setShowAdd]    = useState(false);
  const [editModal,  setEditModal]  = useState(null);
  const [restockModal,    setRestockModal]    = useState(null);
  const [restockQty,      setRestockQty]      = useState('');
  const [restockSupplier, setRestockSupplier] = useState('');
  const [restockCost,     setRestockCost]     = useState('');
  const [msg,  setMsg]  = useState({ text:'', type:'' });
  const [form, setForm] = useState({ category_id:'', supplier_id:'', product_name:'', description:'', unit_price:'', cost_price:'', reorder_level:10 });
  const [editForm, setEditForm] = useState({});
  const { user } = useAuth();

  const flash = (text, type='success') => { setMsg({text,type}); setTimeout(()=>setMsg({text:'',type:''}),4000); };

  const load = async () => {
    const [p,c,s] = await Promise.all([api.get('/products'),api.get('/categories'),api.get('/suppliers')]);
    setProducts(p.data); setCategories(c.data); setSuppliers(s.data); setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const cats = ['All', ...new Set(products.map(p=>p.category_name))];
  const filtered = products.filter(p => {
    const ms = p.product_name.toLowerCase().includes(search.toLowerCase()) || p.supplier_name.toLowerCase().includes(search.toLowerCase());
    return ms && (catFilter==='All' || p.category_name===catFilter);
  });

  const addProduct = async e => {
    e.preventDefault();
    try { await api.post('/products',form); flash('Product added!'); setShowAdd(false); setForm({category_id:'',supplier_id:'',product_name:'',description:'',unit_price:'',cost_price:'',reorder_level:10}); load(); }
    catch(err) { flash(err.response?.data?.error||'Error','error'); }
  };

  const openEdit = p => { setEditModal(p); setEditForm({ product_name:p.product_name, unit_price:p.unit_price, cost_price:p.cost_price||0, description:p.description||'', reorder_level:p.reorder_level, category_id:p.category_id, supplier_id:p.supplier_id, discount_all:p.discount_all||0, discount_registered:p.discount_registered||0 }); };

  const saveEdit = async e => {
    e.preventDefault();
    try { await api.patch(`/products/${editModal.product_id}`,editForm); flash('Product updated!'); setEditModal(null); load(); }
    catch(err) { flash(err.response?.data?.error||'Error','error'); }
  };

  const openRestock = p => { setRestockModal(p); setRestockQty(''); setRestockCost(p.cost_price||''); setRestockSupplier(suppliers.find(s=>s.supplier_name===p.supplier_name)?.supplier_id||''); };

  const restock = async e => {
    e.preventDefault();
    try {
      const res = await api.patch(`/products/${restockModal.product_id}/restock`, { quantity:Number(restockQty), supplier_id:restockSupplier||undefined, unit_cost:restockCost||undefined });
      flash(res.data.message); setRestockModal(null); load();
    } catch(err) { flash(err.response?.data?.error||'Error','error'); }
  };

  const deleteProduct = async id => {
    if (!window.confirm('Delete this product?')) return;
    try { await api.delete(`/products/${id}`); flash('Deleted'); load(); }
    catch(err) { flash(err.response?.data?.error||'Error','error'); }
  };

  if (loading) return <div className="loading">Loading products...</div>;

  return (
    <div className="content">
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:4}}>
        <div><h1 className="page-title">Products</h1><p className="page-sub">{products.length} products — vw_product_details</p></div>
        {user?.role!=='cashier' && <button className="btn btn-primary" onClick={()=>setShowAdd(!showAdd)}>{showAdd?'✕ Cancel':'+ Add Product'}</button>}
      </div>

      {msg.text && <div className={`alert alert-${msg.type}`}>{msg.text}</div>}

      {showAdd && (
        <div className="card" style={{marginBottom:20,borderColor:'#bfdbfe'}}>
          <h3 style={{fontSize:15,fontWeight:700,marginBottom:14}}>Add Product</h3>
          <form onSubmit={addProduct}>
            <div className="form-grid">
              <div className="form-group"><label>Product Name</label><input className="form-input" value={form.product_name} onChange={e=>setForm({...form,product_name:e.target.value})} required/></div>
              <div className="form-group"><label>Selling Price (Rs.)</label><input className="form-input" type="number" step="0.01" value={form.unit_price} onChange={e=>setForm({...form,unit_price:e.target.value})} required/></div>
              <div className="form-group"><label>Cost Price (Rs.)</label><input className="form-input" type="number" step="0.01" value={form.cost_price} onChange={e=>setForm({...form,cost_price:e.target.value})} placeholder="Purchase cost"/></div>
              <div className="form-group"><label>Category</label>
                <select className="form-input" value={form.category_id} onChange={e=>setForm({...form,category_id:e.target.value})} required>
                  <option value="">Select...</option>{categories.map(c=><option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}</select></div>
              <div className="form-group"><label>Supplier</label>
                <select className="form-input" value={form.supplier_id} onChange={e=>setForm({...form,supplier_id:e.target.value})} required>
                  <option value="">Select...</option>{suppliers.map(s=><option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>)}</select></div>
              <div className="form-group"><label>Reorder Level</label><input className="form-input" type="number" value={form.reorder_level} onChange={e=>setForm({...form,reorder_level:e.target.value})}/></div>
            </div>
            <button type="submit" className="btn btn-primary btn-sm">Add Product</button>
          </form>
        </div>
      )}

      <div style={{display:'flex',gap:10,marginBottom:16,flexWrap:'wrap',alignItems:'center'}}>
        <input className="form-input" style={{maxWidth:260}} placeholder="Search products or supplier..." value={search} onChange={e=>setSearch(e.target.value)}/>
        <div style={{display:'flex',gap:6,flexWrap:'wrap'}}>
          {cats.map(c=>(
            <button key={c} onClick={()=>setCatFilter(c)}
              style={{padding:'5px 12px',borderRadius:20,fontSize:12,fontWeight:500,cursor:'pointer',background:catFilter===c?'#2563eb':'white',color:catFilter===c?'white':'#64748b',border:catFilter===c?'1px solid #2563eb':'1px solid #e2e8f0',transition:'all .2s'}}>
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="card" style={{padding:0,overflow:'hidden'}}>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Product</th><th>Category</th><th>Supplier</th><th>Cost</th><th>Price</th><th>Margin</th><th>Discount</th><th>Stock</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {filtered.map(p=>{
                const low = p.quantity_in_stock<=p.reorder_level;
                const margin = p.cost_price>0 ? ((p.unit_price-p.cost_price)/p.unit_price*100).toFixed(0) : null;
                return (
                  <tr key={p.product_id}>
                    <td style={{fontWeight:600}}>{p.product_name}</td>
                    <td><span className="tag">{p.category_name}</span></td>
                    <td style={{color:'#64748b',fontSize:12}}>{p.supplier_name}</td>
                    <td style={{color:'#dc2626',fontSize:12}}>{fmt(p.cost_price)}</td>
                    <td style={{fontWeight:600}}>{fmt(p.unit_price)}</td>
                    <td style={{color:'#16a34a',fontWeight:600}}>{margin?`${margin}%`:'—'}</td>
                    <td style={{fontSize:12}}>
                      {p.discount_all>0 && <div style={{color:'#ea580c'}}>All: {p.discount_all}%</div>}
                      {p.discount_registered>0 && <div style={{color:'#7c3aed'}}>Reg: +{p.discount_registered}%</div>}
                      {!p.discount_all && !p.discount_registered && <span style={{color:'#94a3b8'}}>—</span>}
                    </td>
                    <td style={{fontWeight:600,color:low?'#dc2626':'#16a34a'}}>{p.quantity_in_stock}</td>
                    <td><span className={`badge ${p.quantity_in_stock===0?'badge-red':low?'badge-orange':'badge-green'}`}>{p.quantity_in_stock===0?'Out':low?'Low':'OK'}</span></td>
                    <td>
                      <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                        {user?.role!=='cashier' && <button className="btn btn-outline btn-sm" onClick={()=>openEdit(p)}>✏️ Edit</button>}
                        {user?.role!=='cashier' && <button className="btn btn-success btn-sm" onClick={()=>openRestock(p)}>Restock</button>}
                        {user?.role==='admin' && <button className="btn btn-danger btn-sm" onClick={()=>deleteProduct(p.product_id)}>Del</button>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit Modal */}
      {editModal && (
        <div className="overlay" onClick={()=>setEditModal(null)}>
          <div className="modal" style={{maxWidth:560}} onClick={e=>e.stopPropagation()}>
            <h3>Edit Product</h3>
            <p className="modal-sub">{editModal.product_name}</p>
            <form onSubmit={saveEdit}>
              <div className="form-grid">
                <div className="form-group"><label>Product Name</label><input className="form-input" value={editForm.product_name} onChange={e=>setEditForm({...editForm,product_name:e.target.value})}/></div>
                <div className="form-group"><label>Selling Price (Rs.)</label><input className="form-input" type="number" step="0.01" value={editForm.unit_price} onChange={e=>setEditForm({...editForm,unit_price:e.target.value})}/></div>
                <div className="form-group"><label>Cost Price (Rs.)</label><input className="form-input" type="number" step="0.01" value={editForm.cost_price} onChange={e=>setEditForm({...editForm,cost_price:e.target.value})}/></div>
                <div className="form-group"><label>Reorder Level</label><input className="form-input" type="number" value={editForm.reorder_level} onChange={e=>setEditForm({...editForm,reorder_level:e.target.value})}/></div>
                <div className="form-group"><label>Category</label>
                  <select className="form-input" value={editForm.category_id} onChange={e=>setEditForm({...editForm,category_id:e.target.value})}>
                    {categories.map(c=><option key={c.category_id} value={c.category_id}>{c.category_name}</option>)}</select></div>
                <div className="form-group"><label>Supplier</label>
                  <select className="form-input" value={editForm.supplier_id} onChange={e=>setEditForm({...editForm,supplier_id:e.target.value})}>
                    {suppliers.map(s=><option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}</option>)}</select></div>
              </div>
              <div style={{background:'#eff6ff',borderRadius:8,padding:'12px 14px',marginBottom:14}}>
                <div style={{fontWeight:600,fontSize:13,marginBottom:10,color:'#1d4ed8'}}>🏷️ Discount Settings</div>
                <div className="form-grid">
                  <div className="form-group" style={{marginBottom:0}}>
                    <label>Discount for ALL customers (%)</label>
                    <input className="form-input" type="number" step="0.5" min="0" max="90" value={editForm.discount_all} onChange={e=>setEditForm({...editForm,discount_all:e.target.value})}/>
                    <p style={{fontSize:11,color:'#64748b',marginTop:4}}>Applied to every sale of this product</p>
                  </div>
                  <div className="form-group" style={{marginBottom:0}}>
                    <label>Extra discount for Registered customers (%)</label>
                    <input className="form-input" type="number" step="0.5" min="0" max="90" value={editForm.discount_registered} onChange={e=>setEditForm({...editForm,discount_registered:e.target.value})}/>
                    <p style={{fontSize:11,color:'#64748b',marginTop:4}}>Added on top of global registered discount</p>
                  </div>
                </div>
              </div>
              <div className="form-group"><label>Description</label><input className="form-input" value={editForm.description} onChange={e=>setEditForm({...editForm,description:e.target.value})}/></div>
              <div style={{display:'flex',gap:10}}>
                <button type="submit" className="btn btn-primary">Save Changes</button>
                <button type="button" className="btn btn-outline" onClick={()=>setEditModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Restock Modal */}
      {restockModal && (
        <div className="overlay" onClick={()=>setRestockModal(null)}>
          <div className="modal" onClick={e=>e.stopPropagation()}>
            <h3>Restock Product</h3>
            <p className="modal-sub">{restockModal.product_name} — Stock: {restockModal.quantity_in_stock}</p>
            <form onSubmit={restock}>
              <div className="form-group"><label>Select Supplier</label>
                <select className="form-input" value={restockSupplier} onChange={e=>setRestockSupplier(e.target.value)} required>
                  <option value="">Choose supplier...</option>
                  {suppliers.map(s=><option key={s.supplier_id} value={s.supplier_id}>{s.supplier_name}{s.categories?` — ${s.categories}`:''}</option>)}
                </select>
                <p style={{fontSize:11,color:'#64748b',marginTop:4}}>Current: {restockModal.supplier_name}</p>
              </div>
              <div className="form-group"><label>Unit Cost (Rs.) — will deduct from budget</label>
                <input className="form-input" type="number" step="0.01" value={restockCost} onChange={e=>setRestockCost(e.target.value)} placeholder={`Current: ${restockModal.cost_price||0}`}/></div>
              <div className="form-group"><label>Quantity to Add</label>
                <input className="form-input" type="number" min="1" value={restockQty} onChange={e=>setRestockQty(e.target.value)} required autoFocus/>
                {restockCost && restockQty && (
                  <p style={{fontSize:12,color:'#dc2626',marginTop:4,fontWeight:600}}>
                    Budget deduction: {fmt(restockCost*restockQty)}
                  </p>
                )}
              </div>
              <div style={{display:'flex',gap:10}}>
                <button type="submit" className="btn btn-success">✅ Confirm Restock</button>
                <button type="button" className="btn btn-outline" onClick={()=>setRestockModal(null)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
