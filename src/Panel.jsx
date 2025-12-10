import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import './panel.css'

export default function Panel() {
  const navigate = useNavigate()
  const [view, setView] = useState('categories') // 'categories' | 'payments'
  const [categories, setCategories] = useState([])
  const [paymentMethods, setPaymentMethods] = useState([])

  // Modals
  const [categoryModalOpen, setCategoryModalOpen] = useState(false)
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [editingPayment, setEditingPayment] = useState(null)

  // Forms
  const [categoryForm, setCategoryForm] = useState({
    nombre: '',
    descripcion: ''
  })

  const [paymentForm, setPaymentForm] = useState({
    nombre: '',
    descripcion: ''
  })

  useEffect(() => {
    fetchCategories()
    fetchPaymentMethods()
  }, [])

  async function fetchCategories() {
    try {
      const res = await fetch('http://localhost:5000/categorias')
      const data = await res.json()
      setCategories(data || [])
    } catch (error) {
      console.error('Error fetching categories:', error)
    }
  }

  async function fetchPaymentMethods() {
    try {
      const res = await fetch('http://localhost:5000/metodos_pago')
      const data = await res.json()
      setPaymentMethods(data || [])
    } catch (error) {
      console.error('Error fetching payment methods:', error)
    }
  }

  // Category handlers
  function openAddCategoryModal() {
    setEditingCategory(null)
    setCategoryForm({ nombre: '', descripcion: '' })
    setCategoryModalOpen(true)
  }

  function openEditCategoryModal(category) {
    setEditingCategory(category)
    setCategoryForm({
      nombre: category.nombre_categoria,
      descripcion: category.descripcion || ''
    })
    setCategoryModalOpen(true)
  }

  async function handleCategorySave(e) {
    e.preventDefault()
    if (!categoryForm.nombre.trim()) {
      alert('Ingrese el nombre de la categoría')
      return
    }

    try {
      if (editingCategory) {
        const payload = {
          nombre_categoria: categoryForm.nombre,
          descripcion: categoryForm.descripcion
        };

        const res = await fetch(`http://localhost:5000/UPcategorias/${editingCategory.id_categoria}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) throw new Error('Error actualizando categoría')
      } else {
        const payload = {
          nombre_categoria: categoryForm.nombre,
          descripcion: categoryForm.descripcion
        };

        const res = await fetch('http://localhost:5000/ADDcategorias', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) throw new Error('Error creando categoría')
      }

      await fetchCategories()
      setCategoryModalOpen(false)
      setEditingCategory(null)
    } catch (err) {
      console.error(err)
      alert(err.message)
    }
  }

  async function handleDeleteCategory(id) {
    if (!confirm('¿Eliminar esta categoría?')) return
    try {
      const res = await fetch(`http://localhost:5000/DELcategorias/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Error eliminando categoría')
      await fetchCategories()
    } catch (err) {
      console.error(err)
      alert('No se pudo eliminar la categoría')
    }
  }

  // Payment method handlers
  function openAddPaymentModal() {
    setEditingPayment(null)
    setPaymentForm({ nombre: '', descripcion: '' })
    setPaymentModalOpen(true)
  }

  function openEditPaymentModal(payment) {
    setEditingPayment(payment)
    setPaymentForm({
      nombre: payment.nombre_metodo,
      descripcion: payment.descripcion || ''
    })
    setPaymentModalOpen(true)
  }

  async function handlePaymentSave(e) {
    e.preventDefault()
    if (!paymentForm.nombre.trim()) {
      alert('Ingrese el nombre del método de pago')
      return
    }

    try {
      if (editingPayment) {
        const payload = {
          nombre_metodo: paymentForm.nombre,
          descripcion: paymentForm.descripcion
        };

        const res = await fetch(`http://localhost:5000/UPmetodos_pago/${editingPayment.id_metodo}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) throw new Error('Error actualizando método de pago')
      } else {
        const payload = {
          nombre_metodo: paymentForm.nombre,
          descripcion: paymentForm.descripcion
        };

        const res = await fetch('http://localhost:5000/ADDmetodos_pago', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        })
        if (!res.ok) throw new Error('Error creando método de pago')
      }

      await fetchPaymentMethods()
      setPaymentModalOpen(false)
      setEditingPayment(null)
    } catch (err) {
      console.error(err)
      alert(err.message)
    }
  }

  async function handleDeletePayment(id) {
    if (!confirm('¿Eliminar este método de pago?')) return
    try {
      const res = await fetch(`http://localhost:5000/DELmetodos_pago/${id}`, {
        method: 'DELETE'
      })
      if (!res.ok) throw new Error('Error eliminando método de pago')
      await fetchPaymentMethods()
    } catch (err) {
      console.error(err)
      alert('No se pudo eliminar el método de pago')
    }
  }

  return (
    <div className="panel-container">
      <header className="navbar">
        <div className="nav-left">
          <button className="logo" onClick={() => navigate('/admin')}>Panel de Control</button>
          <nav className="nav-links">
            <button 
              className={view === 'categories' ? 'active' : ''} 
              onClick={() => setView('categories')}
            >
              Categorías
            </button>
            <button 
              className={view === 'payments' ? 'active' : ''} 
              onClick={() => setView('payments')}
            >
              Métodos de Pago
            </button>
          </nav>
        </div>

        <div className="nav-right">
          <button 
            className="add-button" 
            onClick={view === 'categories' ? openAddCategoryModal : openAddPaymentModal}
          >
            + Agregar {view === 'categories' ? 'Categoría' : 'Método de Pago'}
          </button>
        </div>
      </header>

      <main className="main-content">
        {view === 'categories' ? (
          <section className="categories-section">
            <h2>Gestión de Categorías</h2>
            <div className="items-grid">
              {categories.map(cat => (
                <div key={cat.id_categoria} className="item-card">
                  <div className="item-body">
                    <h3>{cat.nombre_categoria}</h3>
                    {cat.descripcion && <p>{cat.descripcion}</p>}
                    <div className="item-actions">
                      <button onClick={() => openEditCategoryModal(cat)}>Editar</button>
                      <button className="danger" onClick={() => handleDeleteCategory(cat.id_categoria)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section className="payments-section">
            <h2>Gestión de Métodos de Pago</h2>
            <div className="items-grid">
              {paymentMethods.map(pay => (
                <div key={pay.id_metodo} className="item-card">
                  <div className="item-body">
                    <h3>{pay.nombre_metodo}</h3>
                    {pay.descripcion && <p>{pay.descripcion}</p>}
                    <div className="item-actions">
                      <button onClick={() => openEditPaymentModal(pay)}>Editar</button>
                      <button className="danger" onClick={() => handleDeletePayment(pay.id_metodo)}>
                        Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}
      </main>

      {/* Modal Categoría */}
      {categoryModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <header className="modal-header">
              <h3>{editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}</h3>
              <button className="close" onClick={() => setCategoryModalOpen(false)}>✕</button>
            </header>
            
            <form className="modal-body" onSubmit={handleCategorySave}>
              <div className="form-group">
                <label>Nombre de la categoría</label>
                <input
                  required
                  value={categoryForm.nombre}
                  onChange={e => setCategoryForm({ ...categoryForm, nombre: e.target.value })}
                  placeholder="Ej: Laptops"
                />
                <input
                  value={categoryForm.descripcion}
                  onChange={e => setCategoryForm({ ...categoryForm, descripcion: e.target.value })}
                  placeholder="Descripción (opcional)"
                />
              </div>

              <div className="form-actions">
                <button type="submit">
                  {editingCategory ? 'Guardar cambios' : 'Crear categoría'}
                </button>
                <button type="button" className="outline" onClick={() => setCategoryModalOpen(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Método de Pago */}
      {paymentModalOpen && (
        <div className="modal-overlay">
          <div className="modal">
            <header className="modal-header">
              <h3>{editingPayment ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}</h3>
              <button className="close" onClick={() => setPaymentModalOpen(false)}>✕</button>
            </header>
            
            <form className="modal-body" onSubmit={handlePaymentSave}>
              <div className="form-group">
                <label>Nombre del método</label>
                <input
                  required
                  value={paymentForm.nombre}
                  onChange={e => setPaymentForm({ ...paymentForm, nombre: e.target.value })}
                  placeholder="Ej: Tarjeta de crédito"
                />
              </div>

              <div className="form-group">
                <label>Descripción (opcional)</label>
                <textarea
                  value={paymentForm.descripcion}
                  onChange={e => setPaymentForm({ ...paymentForm, descripcion: e.target.value })}
                  placeholder="Detalles adicionales..."
                />
              </div>

              <div className="form-actions">
                <button type="submit">
                  {editingPayment ? 'Guardar cambios' : 'Crear método'}
                </button>
                <button type="button" className="outline" onClick={() => setPaymentModalOpen(false)}>
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}