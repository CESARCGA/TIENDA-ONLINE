// ...existing code...
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Admin.css'

export default function Admin() {
  const navigate = useNavigate()
  const [view, setView] = useState('products')
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])

  // Search / filtro (igual que Inicio.jsx)
  const [query, setQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('Todos')

  // Modal y edición / creación
  const [modalOpen, setModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState('add') // 'add' | 'edit'
  const [editingProduct, setEditingProduct] = useState(null)

  const [productForm, setProductForm] = useState({
    name: '',
    price: '',
    stock: '',
    category: '',
    description: '',
    image: ''
  })

  const [promotionForm, setPromotionForm] = useState({
    title: '',
    description: '',
    discount: '',
    validUntil: ''
  })

  // NEW: menú hamburguesa + modal método de pago
  const [menuOpen, setMenuOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [paymentForm, setPaymentForm] = useState({
    nombre: '',
    descripcion: '' 
  })

  useEffect(() => {
    fetchProducts()
    fetchCategories()
  }, [])

  async function fetchCategories() {
    try {
      const res = await fetch('http://localhost:5000/categorias')
      if (!res.ok) throw new Error('Error al obtener categorías')
      const data = await res.json()
      // esperamos objetos con { id_categoria, nombre_categoria }
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories([])
    }
  }

  async function fetchProducts() {
    try {
      const res = await fetch('http://localhost:5000/OPproductos')
      const data = await res.json()
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
    }
  }

  // Abrir modal para agregar
  function openAddModal() {
    setMenuOpen(false)
    setModalMode('add')
    setEditingProduct(null)
    setProductForm({ name: '', price: '', stock:'', category: '', description: '', image: '' })
    setModalOpen(true)
  }

  // Abrir modal para método de pago
  function openAddPaymentModal() {
    setMenuOpen(false)
    setPaymentForm({ nombre: '', descripcion: '' })
    setPaymentModalOpen(true)
  }

  // Abrir modal para editar (rellenar formulario)
  function openEditModal(prod) {
    const id = prod.id ?? prod.id_producto
    setEditingProduct(prod)
    setModalMode('edit')
    setProductForm({
      id: id,
      name: prod.name ?? prod.nombre ?? '',
      price: prod.price ?? prod.precio ?? '',
      stock: prod.stock ?? prod.stock ?? '',
      category: prod.id_categoria ?? prod.id_categoria_producto ?? prod.categoria_id ?? '',
      description: prod.description ?? prod.descripcion ?? '',
      image: prod.image ?? prod.imagen ?? ''
    })
    setModalOpen(true)
  }

  async function handleModalSave(e) {
    e.preventDefault()
    // Validaciones básicas
    if (!productForm.name || !productForm.price || !productForm.category) {
      alert('Complete nombre, precio y categoría')
      return
    }

    try {
      const payload = {
        id: productForm.id,
        nombre: productForm.name,
        precio: Number(productForm.price),
        stock : Number(productForm.stock),
        id_categoria: productForm.category,
        descripcion: productForm.description,
        imagen: productForm.image
      }

      if (modalMode === 'add') {
        const res = await fetch('http://localhost:5000/productos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) throw new Error('Error creando producto')
      } else if (modalMode === 'edit' && editingProduct) {
        const id = editingProduct.id ?? editingProduct.id_producto
        const res = await fetch(`http://localhost:5000/UPproductos/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) throw new Error('Error actualizando producto')
      }

      await fetchProducts()
      setModalOpen(false)
      setEditingProduct(null)
    } catch (err) {
      console.error(err)
      alert(err.message || 'Error guardando producto')
    }
  }

  // NEW: guardar método de pago
  async function handlePaymentSave(e) {
    e.preventDefault()
    if (!paymentForm.nombre) {
      alert('Ingrese el nombre del método de pago')
      return
    }
    try {
      const payload = {
        nombre_metodo: paymentForm.nombre,
        descripcion: paymentForm.descripcion
      }

      const res = await fetch('http://localhost:5000/ADDmetodos_pago', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })
      if (!res.ok) throw new Error('Error creando método de pago')
      // opcional: refrescar listados si los tienes
      setPaymentModalOpen(false)
      alert('Método de pago creado')
    } catch (err) {
      console.error(err)
      alert(err.message || 'Error guardando método de pago')
    }
  }

  async function handleDeleteProduct(idCandidate) {
    const id = idCandidate.id ?? idCandidate.id_producto ?? idCandidate
    if (!confirm('¿Eliminar este producto?')) return
    try {
      const res = await fetch(`http://localhost:5000/DPproductos/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Error eliminando producto')
      await fetchProducts()
    } catch (err) {
      console.error(err)
      alert('No se pudo eliminar el producto')
    }
  }

  // Products list filtrada (igual que Inicio)
  const filtered = products.filter(p => {
    const name = (p.name ?? p.nombre ?? '').toString().toLowerCase()
    const matchesQuery = name.includes(query.trim().toLowerCase())
    if (categoryFilter === 'Todos' || !categoryFilter) return matchesQuery
    const prodCatId = p.id_categoria ?? p.id_categoria_producto ?? p.categoria_id ?? p.category ?? ''
    const catObj = categories.find(c => String(c.id_categoria) === String(prodCatId))
    const catName = catObj?.nombre_categoria ?? p.category ?? p.categoria ?? ''
    return matchesQuery && (catName === categoryFilter || String(prodCatId) === String(categoryFilter))
  })

  // Helpers para mostrar datos seguros en tarjeta
  function prodName(p) { return p.name ?? p.nombre ?? 'Producto' }
  function prodPrice(p) { return p.price ?? p.precio ?? 0 }
  function prodImg(p) {
    const path = p.image ?? p.imagen;
    if (!path) return 'https://via.placeholder.com/420x260?text=Sin+imagen';
    
    // Si ya incluye la URL completa, la usamos tal cual
    if (path.startsWith('http')) return path;
    
    // Si solo es la ruta relativa, le agregamos el backend
    return `http://localhost:5000${path}`;
  }

  function prodCategoryName(p) {
    const prodCatId = p.id_categoria ?? p.id_categoria_producto ?? p.categoria_id ?? ''
    return categories.find(c => String(c.id_categoria) === String(prodCatId))?.nombre_categoria ?? (p.categoria ?? p.category ?? '')
  }

  //subir imagen al backend
  async function handleImageUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('imagen', file);

    try {
      const res = await fetch('http://localhost:5000/imagenes', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) throw new Error('Error al subir imagen');
      const data = await res.json();

      // Guardamos la URL que devolvió el backend
      setProductForm(prev => ({ ...prev, image: data.imageUrl }));
    } catch (error) {
      console.error('Error subiendo imagen:', error);
      alert('No se pudo subir la imagen');
    }
  }


  return (
    <div className="admin-store">
      {/* Nav fijo similar a Inicio */}
      <header className="navbar">
        <div className="nav-left">
          <button className="logo" onClick={() => navigate('/')}>TiendaTec - Admin</button>
          <nav className="nav-links">
            <button onClick={() => setView('products')}>Tienda</button>
            <button onClick={() => navigate('/panel')}>Panel</button>
            <button onClick={() => navigate('/')}>Ver tienda pública</button>
            <button onClick={() => navigate('/pedidosadmin')}>Pedidos</button>
            <button onClick={() => { localStorage.removeItem('usuario'); navigate('/login'); }}>Cerrar sesión</button>
          </nav>
        </div>

        <div className="nav-right">
          <div className="search">
            <input
              placeholder="Buscar productos..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* REPLACED: hamburguesa menu en lugar de add-btn */}
          <div className="hamburger-menu">
            <button className="hamburger-btn" onClick={() => setMenuOpen(!menuOpen)} aria-expanded={menuOpen}>
              ☰
            </button>
            {menuOpen && (
              <div className="hamburger-dropdown">
                <button className="dropdown-item" onClick={openAddModal}>+ Agregar producto</button>
                <button className="dropdown-item" onClick={openAddPaymentModal}>+ Agregar método de pago</button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="main-content2">
        <section className="hero small">
          <div>
            <h1>Panel de Administración — Tienda</h1>
            <p>Visualiza la tienda como un usuario y gestiona productos desde aquí.</p>
          </div>
          
        </section>

        <section className="categories admin-cats">
          <button className={categoryFilter === 'Todos' ? 'active' : ''} onClick={() => setCategoryFilter('Todos')}>Todos</button>
          {categories.map(cat => (
            <button
              key={cat.id_categoria}
              className={String(categoryFilter) === String(cat.nombre_categoria) || String(categoryFilter) === String(cat.id_categoria) ? 'active' : ''}
              onClick={() => setCategoryFilter(cat.nombre_categoria ?? cat.id_categoria)}
            >
              {cat.nombre_categoria}
            </button>
          ))}
        </section>

        <section id="productos" className="products-section admin-products">
          <h2>Productos</h2>
          <div className="products-grid2">
            {filtered.map(p => (
              <article key={p.id ?? p.id_producto} className="product-card admin-card">
                <img src={prodImg(p)} />
                <div className="product-body">
                  <h3>{prodName(p)}</h3>
                  <p className="cat">{prodCategoryName(p)}</p>
                  <div className="product-footer">
                    <strong>${prodPrice(p)}</strong>
                    <div className="actions">
                      <button className="small" onClick={() => openEditModal(p)}>Actualizar</button>
                      <button className="small outline danger" onClick={() => handleDeleteProduct(p)}>Eliminar</button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* Promociones: reutiliza el form ya existente */}
        {view === 'promotions' && (
          <section className="promotions-admin">
            <h2>Promociones</h2>
            <form onSubmit={e => { e.preventDefault(); alert('Gestionar promociones (por implementar)') }} className="admin-form">
              {/* Puedes mantener el form de promociones aquí o reutilizar promotionForm y su handler */}
              <div className="form-group">
                <label>Título</label>
                <input value={promotionForm.title} onChange={e => setPromotionForm({ ...promotionForm, title: e.target.value })} />
              </div>
              <div className="form-actions">
                <button type="submit">Guardar promoción</button>
              </div>
            </form>
          </section>
        )}
      </main>

      {/* Modal para Crear/Actualizar producto */}
      {/*{modalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <header className="modal-header">
              <h3>{modalMode === 'add' ? 'Agregar Producto' : 'Actualizar Producto'}</h3>
              <button className="close" onClick={() => { setModalOpen(false); setEditingProduct(null) }}>✕</button>
            </header>

            <form className="modal-body" onSubmit={handleModalSave}>
              <label>Nombre</label>
              <input required value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} />

              <label>Precio</label>
              <input required type="number" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} />

              <label>Stock</label>
              <input required type="number" value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: e.target.value })} />

              <label>Categoría</label>
              <select required value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })}>
                <option value="">Seleccionar...</option>
                {categories.map(cat => (
                  <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nombre_categoria}</option>
                ))}
              </select>

              <label>Descripción</label>
              <textarea value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} />

              <label>Imagen del producto</label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
              />
              {productForm.image && (
                <div className="preview-container" style={{ marginTop: '10px' }}>
                  <img
                    src={productForm.image.startsWith('http') ? productForm.image : `http://localhost:5000${productForm.image}`}
                    alt="Vista previa"
                    style={{ width: '120px', borderRadius: '8px', border: '1px solid #ccc' }}
                  />
                </div>
              )}


              <div className="form-actions" style={{ marginTop: 12 }}>
                <button type="submit">{modalMode === 'add' ? 'Crear Producto' : 'Guardar cambios'}</button>
                <button type="button" className="outline" onClick={() => { setModalOpen(false); setEditingProduct(null) }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}*/}
      {modalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal2">
            <header className="modal-header">
              <h3>{modalMode === 'add' ? 'Agregar Producto' : 'Actualizar Producto'}</h3>
              <button className="close" onClick={() => { setModalOpen(false); setEditingProduct(null) }}>✕</button>
            </header>

            <form className="modal-body grid-modal" onSubmit={handleModalSave}>
              <div className="form-main">
                <div className="row two">
                  <div className="form-group">
                    <label>Nombre</label>
                    <input required value={productForm.name} onChange={e => setProductForm({ ...productForm, name: e.target.value })} />
                  </div>

                  <div className="form-group">
                    <label>Precio</label>
                    <input required type="number" value={productForm.price} onChange={e => setProductForm({ ...productForm, price: e.target.value })} />
                  </div>
                </div>

                <div className="row two">
                  <div className="form-group">
                    <label>Stock</label>
                    <input required type="number" value={productForm.stock} onChange={e => setProductForm({ ...productForm, stock: e.target.value })} />
                  </div>

                  <div className="form-group">
                    <label>Categoría</label>
                    <select required value={productForm.category} onChange={e => setProductForm({ ...productForm, category: e.target.value })}>
                      <option value="">Seleccionar...</option>
                      {categories.map(cat => (
                        <option key={cat.id_categoria} value={cat.id_categoria}>{cat.nombre_categoria}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Descripción</label>
                  <textarea value={productForm.description} onChange={e => setProductForm({ ...productForm, description: e.target.value })} />
                </div>
              </div>

              <aside className="form-aside">
                <label>Imagen del producto</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                />
                {productForm.image && (
                  <div className="preview-container">
                    <img
                      src={productForm.image.startsWith('http') ? productForm.image : `http://localhost:5000${productForm.image}`}
                      alt="Vista previa"
                    />
                  </div>
                )}
              </aside>

              <div className="form-actions modal-actions">
                <button type="submit">{modalMode === 'add' ? 'Crear Producto' : 'Guardar cambios'}</button>
                <button type="button" className="outline" onClick={() => { setModalOpen(false); setEditingProduct(null) }}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal para Agregar método de pago */}
      {paymentModalOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <header className="modal-header">
              <h3>Agregar método de pago</h3>
              <button className="close" onClick={() => setPaymentModalOpen(false)}>✕</button>
            </header>

            <form className="modal-body" onSubmit={handlePaymentSave}>
              <label>Nombre del método</label>
              <input required value={paymentForm.nombre} onChange={e => setPaymentForm({ ...paymentForm, nombre: e.target.value })} />

              <label>Descripción</label>
              <textarea value={paymentForm.descripcion} onChange={e => setPaymentForm({ ...paymentForm, descripcion: e.target.value })} />

              <div className="form-actions" style={{ marginTop: 12 }}>
                <button type="submit">Crear método</button>
                <button type="button" className="outline" onClick={() => setPaymentModalOpen(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
