import React, { useState, useEffect } from 'react';
import './MisPedidos.css';
import { useNavigate } from "react-router-dom";

const MisPedidos = () => {
  const navigate = useNavigate();
  const [pedidos, setPedidos] = useState([]);
  const [loading, setLoading] = useState(true);

  const [query, setQuery] = useState("");
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("usuario")));
  const [cart, setCart] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);

  const idUsuario = user?.id_usuario;

  console.log("USUARIO DESDE LOCALSTORAGE → ", user);
  console.log("ID DETECTADO → ", idUsuario);


  useEffect(() => {
    if (!idUsuario) {
      console.warn("⚠ No hay usuario logueado");
      setLoading(false);
      return;
    }

    const fetchPedidos = async () => {
      try {
        const res = await fetch(`http://localhost:5000/mis_pedidos/${idUsuario}`);
        const data = await res.json();

        console.log("📦 Pedidos cargados:", data);
        setPedidos(data);
      } catch (error) {
        console.error("Error cargando pedidos:", error);
      }

      setLoading(false);
    };

    fetchPedidos();
  }, [idUsuario]);

  return (
    <div className="mis-pedidos-container">

      {/* NAV ALWAYS VISIBLE */}
      <header className="navbar">
        <div className="nav-left">
          <button className="logo" onClick={() => navigate('/inicio')}>TiendaTec</button>

          <nav className="nav-links">
            <button onClick={() => navigate("/inicio")}>Inicio</button>
            <button onClick={() => navigate("/inicio")}>Productos</button>
            <button onClick={() => navigate("/mispedidos")}>Mis pedidos</button>
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

          {user ? (
            <div className="user-info">
              <span>{user.nombre}</span>
              <button onClick={() => { localStorage.removeItem("usuario"); navigate('/'); }}>
                Cerrar sesión
              </button>
            </div>
          ) : (
            <button onClick={() => navigate('/')}>Perfil</button>
          )}

          <button className="cart-btn" onClick={() => setCartOpen(true)}>
            🛒 <span className="cart-count">{cart.reduce((s,i)=>s+i.qty,0)}</span>
          </button>
        </div>
      </header>

      {/* CONTENT */}
      <div className="contenido-pedidos">

        {loading ? (
          <p className="loading">Cargando pedidos...</p>
        ) : pedidos.length === 0 ? (
          <p className="sin-pedidos">No tienes pedidos realizados</p>
        ) : (
          <div className="pedidos-grid">
            {pedidos.map((pedido) => (
              <div key={pedido.id_orden} className="pedido-card">
                
                <div className="pedido-header">
                  <h3>Pedido #{pedido.id_orden}</h3>
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
        )}

      </div>
    </div>
  );
};

export default MisPedidos;
