import { useState } from "react";
import "./ChatBot.css";

const preguntas = [
  { q: "¿Cuál es el horario?", a: "Nuestro horario es de 9am a 6pm." },
  { q: "¿Qué métodos de pago aceptan?", a: "Aceptamos por el momento Paypal" },
  { q: "¿Hacen envíos?", a: "Sí, enviamos a todo el país en 3 a 5 días." },
  { q: "¿Qué productos venden?", a: "Vendemos una amplia gama de productos tecnológicos" },
  {q: "Politicas de privacidad", a: "Tu información está segura. Solo usamos tus datos para procesar pedidos y mejorar tu experiencia. No compartimos tu información con terceros."},
  {q: "Terminos y condiciones", a: "Al usar nuestra tienda aceptas nuestras políticas, precios, métodos de pago y condiciones de compra. Todos los pedidos están sujetos a disponibilidad."}
];

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [mostrarOpciones, setMostrarOpciones] = useState(true);

  const mostrarPreguntasEnChat = () => {
    setMessages(prev => [
      ...prev,
      { from: "bot", text: "Selecciona una pregunta:" }
    ]);
  };

  const seleccionarPregunta = (item) => {
    // Mensaje del usuario
    setMessages(prev => [
      ...prev,
      { from: "user", text: item.q }
    ]);

    // Respuesta del bot
    setTimeout(() => {
      setMessages(prev => [
        ...prev,
        { from: "bot", text: item.a },
        { from: "bot", text: "¿Quieres preguntar algo más?" }
      ]);
      setMostrarOpciones(false);
    }, 300);
  };

  const reiniciarPreguntas = () => {
    setMostrarOpciones(true);
    mostrarPreguntasEnChat();
  };

  const abrirChat = () => {
    setOpen(!open);
    if (!open && messages.length === 0) {
      setTimeout(() => mostrarPreguntasEnChat(), 300);
    }
  };

  return (
    <div className="chatbot-container">
      {open && (
        <div className="chat-window">
          <div className="chat-header">Chat de ayuda</div>

          <div className="chat-body">
            {messages.map((m, i) => (
              <div key={i} className={`msg ${m.from}`}>
                {m.text}
              </div>
            ))}

            {/* Opciones dentro del chat */}
            {mostrarOpciones && (
              <div className="opciones-container">
                {preguntas.map((item, index) => (
                  <button
                    key={index}
                    className="opcion-btn"
                    onClick={() => seleccionarPregunta(item)}
                  >
                    {item.q}
                  </button>
                ))}
              </div>
            )}

            {!mostrarOpciones && (
              <button className="volver-btn" onClick={reiniciarPreguntas}>
                🔄 Volver a preguntar
              </button>
            )}
          </div>
        </div>
      )}

      <button className="chatbot-btn" onClick={abrirChat}>
        💬
      </button>
    </div>
  );
}
