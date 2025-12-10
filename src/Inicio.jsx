import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './Inicio.css'
import PayPalButton from './PaypalButton.jsx'

export default function Inicio() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState('Todos')
  const [cartOpen, setCartOpen] = useState(false)
  const [cart, setCart] = useState([])

  // Nuevo estado para productos, categorías y usuario
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [user, setUser] = useState(null)
  const [serverCartId, setServerCartId] = useState(null)

  // Pago / checkout
  const [paymentMethods, setPaymentMethods] = useState([])
  const [checkoutOpen, setCheckoutOpen] = useState(false)
  const [selectedPayment, setSelectedPayment] = useState('')

  // Fetch data on component mount
  useEffect(() => {
    // cargar usuario desde localStorage
    try {
      const stored = localStorage.getItem('usuario')
      if (stored) {
        const u = JSON.parse(stored)
        setUser(u)
        // intentar obtener carrito del servidor
        fetchServerCart(u)
      }
    } catch (err) {
      console.error('Error leyendo usuario:', err)
    }

    //carga el usuario desde Registro
    try {
      const stored = localStorage.getItem('nuevoUsuario')
      if (stored) {
        const u = JSON.parse(stored)
        setUser(u)
        // intentar obtener carrito del servidor
        fetchServerCart(u)
        localStorage.removeItem('Usuario')
      }
    } catch (err) {
      console.error('Error leyendo nuevo usuario:', err)
    } 

    fetchProducts()
    fetchCategories()
    fetchPaymentMethods()
  }, [])

  async function fetchProducts() {
    try {
      const res = await fetch('http://localhost:5000/OPproductos')
      const data = await res.json()
      setProducts(data || [])
    } catch (error) {
      console.error('Error fetching products:', error)
      setProducts([])
    }
  }

  async function fetchCategories() {
    try {
      const res = await fetch('http://localhost:5000/categorias')
      const data = await res.json()
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories([])
    }
  }

  async function fetchPaymentMethods() {
    try {
      const res = await fetch('http://localhost:5000/metodos_pago')
      const data = await res.json()
      // normalizar posibles campos
      const normalized = (data || []).map(m => ({
        id: m.id ?? m.id_metodo ?? m.id_metodo_pago,
        nombre: m.nombre ?? m.nombre_metodo ?? m.nombre_metodo_pago,
        descripcion: m.descripcion ?? m.detalle ?? ''
      }))
      setPaymentMethods(normalized)
    } catch (err) {
      console.error('Error fetching payment methods:', err)
      setPaymentMethods([])
    }
  }

  // intenta obtener el carrito activo del usuario y cargar sus items locales
  async function fetchServerCart(u) {
    if (!u) return
    try {
      // intenta obtener carrito por usuario (ajusta endpoint a tu backend)
      const res = await fetch(`http://localhost:5000/carrito?usuario=${u.id_usuario}`)
      if (!res.ok) return
      const cartObj = await res.json()
      const id = cartObj.id_carrito ?? cartObj.id ?? cartObj.idCarrito
      setServerCartId(id)

      // si vienen detalles, mapear al estado local (espera array cartObj.detalles)
      const detalles = cartObj.detalles ?? cartObj.detalle ?? cartObj.items
      if (Array.isArray(detalles)) {
        const mapped = detalles.map(d => {
          return {
            id: d.id_producto ?? d.producto_id ?? d.id,
            id_detalle: d.id_detalle ?? d.idDetalle,
            qty: d.cantidad ?? d.cantidad_producto ?? 1,
            price: d.subtotal && d.cantidad ? Number(d.subtotal) / Number(d.cantidad) : (d.precio ?? d.price ?? 0),
            // intenta incluir imagen/nombre si el backend lo envía
            nombre: d.nombre_producto ?? d.producto?.nombre ?? d.nombre,
            imagen: d.imagen_producto ?? d.producto?.imagen ?? d.imagen,
            subtotal: d.subtotal ?? d.subtotal_producto ?? ( (d.precio ?? 0) * (d.cantidad ?? 1) )
          }
        })
        setCart(mapped)
      }
    } catch (err) {
      console.error('Error fetching server cart:', err)
    }
  }

  // crea o devuelve id de carrito en servidor
  async function ensureServerCart() {
    if (!user) return null
    if (serverCartId) return serverCartId
    try {
      const res = await fetch('http://localhost:5000/carrito', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id_usuario: user.id_usuario })
      })
      if (!res.ok) throw new Error('No se pudo crear carrito')
      const data = await res.json()
      const id = data.id_carrito ?? data.id ?? data.carritoId
      setServerCartId(id)
      return id
    } catch (err) {
      console.error('Error creating cart:', err)
      return null
    }
  }

  // Añadir al carrito: actualiza UI local y también crea/actualiza en BD
  async function addToCart(p) {
    // requiere login para guardar en BD
    if (!user) {
      alert('Debes iniciar sesión para agregar al carrito')
      navigate('/login')
      return
    }

    // actualizar visual local
    setCart((prev) => {
      const exist = prev.find((i) => String(i.id) === String(p.id ?? p.id_producto))
      if (exist) return prev.map((i) => (String(i.id) === String(p.id ?? p.id_producto) ? { ...i, qty: i.qty + 1 } : i))
      return [...prev, { id: p.id ?? p.id_producto, qty: 1, price: p.price ?? p.precio ?? 0, nombre: p.name ?? p.nombre, imagen: p.image ?? p.imagen }]
    })

    // enviar al servidor
    try {
      const idCar = await ensureServerCart()
      if (!idCar) return
      const productId = p.id ?? p.id_producto
      const cantidad = 1
      const precio = p.price ?? p.precio ?? 0
      const subtotal = Number(precio) * cantidad

      // endpoint que inserte detalle de carrito (ajusta según tu backend)
      const res = await fetch('http://localhost:5000/carrito_detalle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id_carrito: idCar,
          id_producto: productId,
          cantidad,
          subtotal
        })
      })

      if (!res.ok) {
        // opcional: revertir UI o mostrar aviso
        console.error('No se pudo agregar al carrito en el servidor')
      } else {
        // si el servidor devuelve el detalle actualizado podríamos sincronizar ids
        const detail = await res.json().catch(() => null)
        if (detail && detail.id_detalle) {
          setCart(prev => prev.map(item => {
            if (String(item.id) === String(productId)) return { ...item, id_detalle: detail.id_detalle }
            return item
          }))
        }
      }
    } catch (err) {
      console.error('Error enviando al carrito en servidor:', err)
    }
  }

  function removeFromCart(id) {
    // eliminar localmente
    setCart((prev) => prev.filter((i) => String(i.id) !== String(id)));

    // eliminar del servidor si existe id_detalle o si serverCartId está definido
    (async () => {
      try {
        if (!serverCartId) return
        const res = await fetch('http://localhost:5000/DELcarrito_detalle', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id_carrito: serverCartId, id_producto: id })
        })

        if (!res.ok) throw new Error('Error al eliminar en el servidor')

        console.log(`🗑️ Producto ${id} eliminado del carrito ${serverCartId}`)
      } catch (err) {
        console.error('Error eliminando detalle en servidor:', err)
      }
    })()
  }

  function total() {
    return cart.reduce((s, i) => s + (i.price ?? i.precio ?? 0) * i.qty, 0)
  }

  // Helpers para mostrar datos seguros
  function prodName(p) { return p.name ?? p.nombre ?? p.nombre_producto ?? 'Producto' }
  function prodPrice(p) { return p.price ?? p.precio ?? p.precio_producto ?? 0 }
  function prodImg(p) {
    const path = p.image ?? p.imagen ?? p.imagen_producto
    if (!path) return 'https://via.placeholder.com/420x260?text=Sin+imagen'
    if (path.startsWith('http')) return path
    return `http://localhost:5000${path}`
  }
  function prodCategoryName(p) {
    const prodCatId = p.id_categoria ?? p.id_categoria_producto ?? p.categoria_id ?? ''
    return categories.find(c => String(c.id_categoria) === String(prodCatId))?.nombre_categoria ?? (p.categoria ?? p.category ?? '')
  }

  // Filtrado modificado para usar los datos del backend
  const filtered = products.filter((p) => {
    const name = prodName(p).toLowerCase()
    const matchesQuery = name.includes(query.trim().toLowerCase())
    if (category === 'Todos') return matchesQuery

    const prodCategory = prodCategoryName(p)
    return matchesQuery && prodCategory === category
  })

  // Abrir modal de pago
  function openCheckout() {
    if (cart.length === 0) {
      alert('Tu carrito está vacío')
      return
    }
    // aseguramos tener métodos de pago cargados
    if (paymentMethods.length === 0) {
      fetchPaymentMethods()
    }
    setCheckoutOpen(true)
  }

  // Confirmar compra -> crea un pedido en el backend (ajusta endpoint si es necesario)
  async function confirmPurchase() {
    if (!user) {
      alert('Debes iniciar sesión para continuar')
      navigate('/')
      return
    }
    if (!selectedPayment) {
      alert('Selecciona un método de pago')
      return
    }

    try {
      // preparar items para enviar
      const items = cart.map(it => ({
        id_producto: it.id,
        cantidad: it.qty,
        subtotal: (it.price ?? prodPrice(it)) * it.qty
      }))

      const payload = {
        id_usuario: user.id_usuario,
        id_carrito: serverCartId,
        id_metodo_pago: selectedPayment,
        total: total(),
        items
      }

      console.log("🧾 Enviando orden:", payload);


      const res = await fetch('http://localhost:5000/crear_orden', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      })

      if (!res.ok) {
        const body = await res.text().catch(() => '')
        throw new Error(body || 'Error creando pedido')
      }

      await res.json().catch(() => null)
      alert('Compra realizada con éxito')
      // limpiar estado local del carrito (opcional: también podrías solicitar al servidor el carrito actualizado)
      setCart([])
      setCheckoutOpen(false)
    } catch (err) {
      console.error('Error al confirmar compra:', err)
      alert('No se pudo completar la compra')
    }
  }

  return (
    <div className="inicio-container">
      <header className="navbar">
        <div className="nav-left">
          <button className="logo" onClick={() => navigate('/inicio')}>
  <img src="/logo.png" alt="Logo" />
</button>

          <nav className="nav-links">
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>Inicio</button>
            <button onClick={() => document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })}>Productos</button>
            <button onClick={() => document.getElementById('ofertas')?.scrollIntoView({ behavior: 'smooth' })}>Ofertas</button>
            <button onClick={() => document.getElementById('contacto')?.scrollIntoView({ behavior: 'smooth' })}>Contacto</button>
            <button onClick={() => navigate("/mispedidos")}>Mis pedidos </button>
          </nav>
        </div>

        <div className="nav-right">
          <div className="search">
            <input
              placeholder="Buscar productos, marcas..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {user ? (
              <div className="user-info" style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ fontWeight: 600 }}>{user.nombre}</span>
                <button onClick={() => { localStorage.removeItem('usuario'); setUser(null); navigate('/') }}>Cerrar sesión</button>
              </div>
            ) : (
              <button className="profile-btn" onClick={() => navigate('/')}>Perfil</button>
            )}

            <button className="cart-btn" onClick={() => setCartOpen(true)} aria-label="Abrir carrito">
              🛒 <span className="cart-count">{cart.reduce((s,i)=>s+i.qty,0)}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="main-content">
        <section className="hero">
          <div>
            <h1>Lo mejor en tecnología</h1>
            <p>Ofertas exclusivas en portátiles, smartphones y accesorios. Envios a todo el país.</p>
            <div className="hero-actions">
              <button onClick={() => document.getElementById('productos')?.scrollIntoView({ behavior: 'smooth' })}>Comprar ahora</button>
              <button className="outline" onClick={() => navigate('/register')}>Crear cuenta</button>
            </div>
          </div>
         
        </section>

        <section className="categories">
          <button
            className={category === 'Todos' ? 'active' : ''}
            onClick={() => setCategory('Todos')}
          >
            Todos
          </button>
          {categories.map((c) => (
            <button
              key={c.id_categoria}
              className={c.nombre_categoria === category ? 'active' : ''}
              onClick={() => setCategory(c.nombre_categoria)}
            >
              {c.nombre_categoria}
            </button>
          ))}
        </section>

        <section id="productos" className="products-section">
          <h2>Productos</h2>
          <div className="products-grid">
            {filtered.map((p) => (
              <article key={p.id ?? p.id_producto} className="product-card">
                <img src={prodImg(p)} alt={prodName(p)} />
                <div className="product-body">
                  <h3>{prodName(p)}</h3>
                  <p className="cat">{prodCategoryName(p)}</p>
                  <div className="product-footer">
                    <strong>${prodPrice(p)}</strong>
                    <div className="actions">
                      <button className="small" onClick={() => addToCart(p)}>Añadir</button>
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="ofertas" className="offers">
          <h2>Ofertas destacadas</h2>
          <div className="offers-grid">
            <div className="offer-card">-20% en portátiles seleccionados</div>
            <div className="offer-card">Envío gratis por compras mayores a $200</div>
            <div className="offer-card">Financiación disponible</div>
          </div>
        </section>

        <section id="contacto" className="contact">
          <h2>Contacto</h2>
          <p>¿Dudas? Escríbenos a soporte@tiendatec.example o llama al +00 1234 5678</p>
        </section>
      </main>

      <footer className="footer">
        <div>TiendaTec © {new Date().getFullYear()}</div>
        <div>Política de privacidad · Términos · Soporte</div>
      </footer>

      {cartOpen && (
        <aside className="cart-drawer" role="dialog" aria-modal="true">
          <div className="cart-header">
            <h3>Carrito</h3>
            <button onClick={() => setCartOpen(false)}>Cerrar</button>
          </div>
          <div className="cart-items">
            {cart.length === 0 && <div className="empty">Tu carrito está vacío</div>}
            {cart.map((it) => (
              <div className="cart-item" key={it.id ?? it.id_producto}>
                <img src={it.imagen ? (it.imagen.startsWith('http') ? it.imagen : `http://localhost:5000${it.imagen}`) : prodImg(it)} alt={it.nombre ?? prodName(it)} />
                <div className="ci-body">
                  <div className="ci-title">{it.nombre ?? prodName(it)}</div>
                  <div className="ci-qty">Cantidad: {it.qty}</div>
                </div>
                <div className="ci-actions">
                  <div className="ci-price">${(it.price ?? prodPrice(it)) * it.qty}</div>
                  <button onClick={() => removeFromCart(it.id ?? it.id_producto)}>Eliminar</button>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-footer">
            <div>Total: <strong>${total()}</strong></div>
            <div>
              <button onClick={openCheckout}>Pagar</button>
              <button className="outline" onClick={() => { setCart([]); setCartOpen(false); }}>Vaciar</button>
            </div>
          </div>
        </aside>
      )}

      {/* Modal de Checkout */}
      {checkoutOpen && (
        <div className="modal-overlay" role="dialog" aria-modal="true">
          <div className="modal">
            <header className="modal-header">
              <h3>Resumen de compra</h3>
              <button className="close" onClick={() => setCheckoutOpen(false)}>✕</button>
            </header>

            <div className="modal-body">
              <div style={{ marginBottom: 12 }}>
                {cart.map(it => (
                  <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <img src={it.imagen ? (it.imagen.startsWith('http') ? it.imagen : `http://localhost:5000${it.imagen}`) : prodImg(it)} alt={it.nombre ?? prodName(it)} style={{ width: 56, height: 42, objectFit: 'cover', borderRadius: 6 }} />
                      <div>
                        <div style={{ fontWeight: 600 }}>{it.nombre ?? prodName(it)}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>x{it.qty} · ${it.price ?? prodPrice(it)}</div>
                      </div>
                    </div>
                    <div style={{ fontWeight: 700 }}>${((it.price ?? prodPrice(it)) * it.qty).toFixed(2)}</div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 8 }}>
                <label style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>Método de pago</label>
                <select value={selectedPayment} onChange={e => setSelectedPayment(e.target.value)} style={{ width: '100%', padding: 8, borderRadius: 8, border: '1px solid #e2e8f0' }}>
                  <option value="">Seleccionar método...</option>
                  {paymentMethods.map(pm => (
                    <option key={pm.id} value={pm.id}>{pm.nombre}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
                <div>Total a pagar:</div>
                <div style={{ fontSize: 18, fontWeight: 700 }}>${total().toFixed(2)}</div>
              </div>

              <div className="form-actions" style={{ marginTop: 18 }}>
                {selectedPayment === '2' ? (
                  <div style={{ textAlign: 'center' }}>
                    {/*<button
                      onClick={() => {
                        // Simula que se abre la ventana de PayPal
                        alert('Simulando pago con PayPal...\nPor favor espera un momento.');
                        setTimeout(async () => {
                          alert('✅ Pago simulado aprobado por PayPal');
                          await confirmPurchase(); // Aquí se registra la orden en tu backend
                        }, 2000);
                      }}
                      style={{
                        backgroundColor: '#0070BA',
                        color: 'white',
                        border: 'none',
                        borderRadius: '6px',
                        padding: '12px 24px',
                        fontSize: '16px',
                        fontWeight: 600,
                        cursor: 'pointer',
                        width: '100%',
                        maxWidth: 250
                      }}
                    >
                      💳 Pagar con PayPal
                    </button>*/}
                    {/*<p style={{ marginTop: 10, fontSize: 13, color: '#64748b' }}>
                      (Pago simulado sin conexión real con PayPal)
                    </p>*/}
                    <PayPalButton
                      amount={total()} 
                      onSuccess={async () => {
                        // Cuando el pago se confirma, registramos la orden en el backend
                        await confirmPurchase();
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <button onClick={confirmPurchase}>Confirmar y pagar</button>
                    <button className="outline" onClick={() => setCheckoutOpen(false)}>Cancelar</button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}