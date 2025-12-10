import {GoogleAuthProvider, signInWithPopup,  } from 'firebase/auth'
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./App.css";
import { auth } from './firebase'
//import { db } from './firebase'
//import { doc, setDoc, getDoc } from 'firebase/firestore'
import { googleProvider } from './firebase';


function App() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin(e) {
    e.preventDefault();

    if (!email || !password) {
      alert("Ingrese correo y contraseña");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ correo:email, contrasena:password }),
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Error al iniciar sesión");
        setLoading(false);
        return;
      }

      // Guardar usuario en localStorage
      localStorage.setItem("usuario", JSON.stringify(data));

      //alert(`Bienvenido, ${data.nombre}!`);
      //redirigir segun el rol
      if (data.rol === 1) {
        navigate("/admin");
      } else {
        navigate("/inicio");
      }

    } catch (error) {
      console.error("Error de conexión:", error);
      alert("No se pudo conectar con el servidor");
    } finally {
      setLoading(false);
    }
  }

  //funcion para login con google (por implementar)
  async function handleGoogleLogin() {
    try {
      setLoading(true);
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // datos del usuario
      const payload = {
        nombre: user.displayName || "Usuario sin nombre",
        correo: user.email,
        id_rol: 2, // cliente normal
      };

      // enviar al backend para registrar/verificar
      const res = await fetch("http://localhost:5000/registerGoogle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Error en servidor");

      // guardar sesión local
      localStorage.setItem("usuario", JSON.stringify(data));

      alert(`Bienvenido, ${data.nombre}!`);
      navigate("/inicio");
    } catch (err) {
      console.error("Error con Google Login:", err);
      alert("Error al iniciar sesión con Google");
    } finally {
      setLoading(false);
    }
  }


  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
  <div className="header-left">
    <h1>¡Bienvenido!</h1>
    <p>Inicia sesión para continuar</p>
  </div>

  <img src="/logo.png" alt="Logo" className="login-logo" />
</div>

        <form onSubmit={handleLogin} className="login-form">
          <div className="form-group">
            <label htmlFor="email">Correo electrónico</label>
            <div className="input-group">
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="tu@email.com"
                name="correo"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Contraseña</label>
            <div className="input-group">
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                name="contrasena"
              />
            </div>
          </div>

          <button type="submit" className="login-button primary" disabled={loading}>
            {loading ? (
              <span className="loading-spinner"></span>
            ) : (
              "Iniciar sesión"
            )}
          </button>

          <div className="divider">
            <span>o continuar con</span>
          </div>

          <button 
            type="button" 
            className="login-button google"
            onClick={handleGoogleLogin}
            disabled={loading}
          >
            <img 
              src="https://www.google.com/favicon.ico" 
              alt="Google" 
              className="google-icon"
            />
            Iniciar con Google
          </button>

          <p className="register-text">
            ¿No tienes una cuenta?{" "}
            <button 
              type="button"
              onClick={() => navigate("/register")}
              className="link-button"
              disabled={loading}
            >
              Regístrate aquí
            </button>
          </p>
        </form>
      </div>
    </div>
  );
}

export default App;
