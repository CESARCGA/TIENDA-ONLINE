import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './PedidosAdmin.css';

const PedidosAdmin = () => {
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('usuario')) || null; } catch { return null; }
  });

  const [cart, setCart] = useState(() => {
    try { return JSON.parse(localStorage.getItem('cart')) || []; } catch { return []; }
  });

  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🔥 AGREGADO: para menú hamburguesa
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fetchPedidos = async () => {
      try {
        const res = await fetch('http://localhost:5000/pedidosadmin');
        const data = await res.json();
        setPedidos(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Error cargando pedidos admin:", error);
      }
      setLoading(false);
    };

    fetchPedidos();
  }, []);

  // Agrupar pedidos por usuario
  const pedidosPorUsuario = pedidos;

  return (
    <div className="admin-pedidos-container">

      {/* NAV */}
      <header className="navbar">
        <div className="nav-left">
          <button className="logo" onClick={() => navigate('/admin')}>
            TiendaTec - Admin
          </button>

          <nav className="nav-links">
            <button onClick={() => navigate('/panel')}>Panel</button>
            <button onClick={() => navigate('/pedidosadmin')}>Pedidos</button>
            <button onClick={() => navigate('/')}>Ver tienda pública</button>
            <button onClick={() => { localStorage.removeItem("usuario"); navigate('/login'); }}>
              Cerrar sesión
            </button>
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

          {/* Hamburger menu */}
          <button className="hamburger-btn" onClick={() => setMenuOpen(!menuOpen)}>
            ☰
          </button>
        </div>
      </header>

      {/* CONTENIDO */}
      <main className="admin-content">
        <h1>Pedidos por usuario</h1>

        {loading ? (
            <p>Cargando pedidos...</p>
            ) : pedidosPorUsuario.length === 0 ? (
            <p>No hay pedidos registrados.</p>
            ) : (
            pedidosPorUsuario.map((u) => (
                <div key={u.id_usuario} className="usuario-block">
                    <h3>{u.nombre} — {u.pedidos.length} pedidos</h3>

                    <div className="usuario-pedidos">
                        {u.pedidos.map((pedido) => (
                        <div key={pedido.id_orden} className="pedido-card">

                            <div className="pedido-header">
                                <h4>Pedido #{pedido.id_orden}</h4>
                                <span className={`estado ${pedido.estado.toLowerCase()}`}>
                                    {pedido.estado}
                                </span>
                            </div>

                            <div className="pedido-productos">
                                {pedido.productos.map((prod, idx) => (
                                <div key={idx} className="producto-item">
                                    <img src={`http://localhost:5000${prod.imagen}`} alt={prod.nombre_producto} />
                                    <div className="producto-info">
                                    <p>{prod.nombre_producto}</p>
                                    <p>Cantidad: {prod.cantidad}</p>
                                    <p>${prod.subtotal}</p>
                                    </div>
                                </div>
                                ))}
                            </div>


                            <div className="pedido-footer">
                            <p>Fecha: {new Date(pedido.fecha_orden).toLocaleDateString()}</p>
                            <p>Total: ${pedido.total}</p>
                            </div>

                        </div>
                        ))}
                    </div>

                </div>
            ))
        )}
      </main>
    </div>
  );
};

export default PedidosAdmin;
