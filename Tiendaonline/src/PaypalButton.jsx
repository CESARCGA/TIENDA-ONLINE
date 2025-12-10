import { useEffect, useRef } from "react";

export default function PayPalButton({ amount, onSuccess }) {
  const paypalRef = useRef();

  useEffect(() => {
    if (window.paypal && paypalRef.current) {
      paypalRef.current.innerHTML = "";

      window.paypal.Buttons({
        createOrder: (data, actions) => {
          return actions.order.create({
            purchase_units: [{ amount: { value: amount.toFixed(2) } }]
          });
        },
        onApprove: async (data, actions) => {
            return actions.order.capture().then(async (details) => {
                //alert("✅ Pago completado por " + details.payer.name.given_name);

                // Enviar datos al backend
                try {
                const response = await fetch("http://localhost:5000/crear_orden", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                    orderId: data.orderID,
                    payer: details.payer,
                    amount: details.purchase_units[0].amount.value,
                    status: details.status,
                    }),
                });

                const result = await response.json();
                console.log("Orden registrada:", result);

                if (onSuccess) onSuccess(details);
                } catch (error) {
                console.error("Error al registrar la orden:", error);
                alert("⚠️ Pago completado pero no se pudo registrar la orden.");
                }
            });
        },

        onError: (err) => {
          console.error(err);
          alert("❌ Error con el pago");
        }
      }).render(paypalRef.current);
    }
  }, [amount]);

  return <div ref={paypalRef}></div>;
}
