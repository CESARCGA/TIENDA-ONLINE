import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import './register.css' // reuse the same styles

export default function Register() {
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleRegister(e) {
    e.preventDefault()
    setError(null)

    if (!name.trim() || !email.trim() || !password) {
      setError('Complete los campos requeridos')
      return
    }
    if (password !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('http://localhost:5000/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: name.trim(),
          correo: email.trim(),
          contrasena: password,
          id_rol: 2
        })
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        throw new Error(body.message || `Error ${res.status}`)
      }

      // obtener usuario creado (el backend debe devolver id del usuario)
      const createdUser = await res.json()

      // obtener id_usuario con varios posibles nombres de propiedad
      const userId = createdUser.id_usuario ?? createdUser.id ?? createdUser.insertId

      // intentar crear carrito en servidor si tenemos id_usuario
      if (userId) {
        try {
          const cartRes = await fetch('http://localhost:5000/carrito', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id_usuario: userId })
          })
          if (!cartRes.ok) {
            console.warn('No se pudo crear carrito en servidor:', await cartRes.text().catch(() => ''))
          } else {
            // opcional: leer respuesta del carrito si la necesitas
            await cartRes.json().catch(() => null)
          }
        } catch (err) {
          console.error('Error creando carrito en servidor:', err)
        }
      } else {
        console.warn('No se recibió id_usuario del backend al registrar.')
      }

      // guardar usuario en localStorage para sesión automática y navegar
      try {
        localStorage.setItem('usuario', JSON.stringify(createdUser))
      } catch (err) {
        console.warn('No se pudo guardar usuario en localStorage:', err)
      }

      alert('Registro exitoso')
      navigate('/inicio') // ir a la tienda
    } catch (err) {
      setError(err.message || 'Error al registrar')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <h1>Crear cuenta</h1>
          <p>Completa tus datos para registrarte</p>
        </div>

        <form onSubmit={handleRegister} className="login-form">
          <div className="form-group">
            <label htmlFor="name">Nombre</label>
            <div className="input-group">
              <input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                name="nombre"
                placeholder="Tu nombre completo"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <div className="input-group">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                name="correo"
                placeholder="tu@email.com"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="input-group">
              <i className="input-icon"></i>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                name="contrasena"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirm">Confirmar contraseña</label>
            <div className="input-group">
              <i className="input-icon"></i>
              <input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                placeholder="••••••••"
              />
            </div>
          </div>

          {error && (
            <div className="error-message">
              {error}
            </div>
          )}

          <button type="submit" className="login-button primary" disabled={loading}>
            {loading ? (
              <span className="loading-spinner"></span>
            ) : (
              "Crear cuenta"
            )}
          </button>

          <div className="divider">
            <span>o</span>
          </div>

          <button 
            type="button" 
            className="login-button google"
            onClick={() => alert('Google signup - por implementar')}
          >
            <img 
              src="https://www.google.com/favicon.ico" 
              alt="Google" 
              className="google-icon"
            />
            Registrarse con Google
          </button>

          <p className="register-text">
            ¿Ya tienes una cuenta?{" "}
            <button 
              type="button"
              onClick={() => navigate("/")}
              className="link-button"
              disabled={loading}
            >
              Inicia sesión aquí
            </button>
          </p>
        </form>
      </div>
    </div>
  )
}