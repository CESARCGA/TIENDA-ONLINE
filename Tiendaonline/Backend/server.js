import express from "express";
import bcrypt from "bcrypt";
import cors from "cors";
import dotenv from "dotenv";
import pool from "./db.js";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";


dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

// Estas dos líneas son necesarias si usas módulos ES (import/export)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 👇 Esto hace pública la carpeta de imágenes
app.use("/imagenes", express.static(path.join(__dirname, "imagenes")));
// ✅ Ruta de registro (MySQL)
app.post("/register", async (req, res) => {
  const { nombre, correo, contrasena, id_rol } = req.body;

  if (!nombre || !correo || !contrasena || !id_rol) {
    return res.status(400).json({ message: "Faltan datos obligatorios" });
  }

  try {
    // 🔒 Encriptar la contraseña antes de guardar
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(contrasena, saltRounds);

    const [result] = await pool.query(
      "INSERT INTO usuarios (nombre, correo, contrasena, id_rol) VALUES (?, ?, ?, ?)",
      [nombre, correo, hashedPassword, id_rol]
    );

    console.log("✅ Usuario insertado con ID:", result.insertId);
    res.status(201).json({ message: "Usuario registrado correctamente", id_usuario: result.insertId });
  } catch (err) {
    console.error("❌ Error al registrar:", err);
    res.status(500).json({ message: "Error en el servidor", error: err.message });
  }
});

// Registro de usuario que inicia sesión con Google
app.post("/registerGoogle", async (req, res) => {
  const { nombre, correo, id_rol } = req.body;

  if (!nombre || !correo) {
    return res.status(400).json({ message: "Faltan datos obligatorios" });
  }

  try {
    // 1️⃣ Verificar si ya existe
    const [exists] = await pool.query("SELECT * FROM usuarios WHERE correo = ?", [correo]);
    if (exists.length > 0) {
      // Si ya existe, retornamos ese usuario
      return res.json({
        id_usuario: exists[0].id_usuario,
        nombre: exists[0].nombre,
        correo: exists[0].correo,
        id_rol: exists[0].id_rol,
        message: "Usuario ya existente",
      });
    }

    // 2️⃣ Si no existe, lo creamos
    const contrasenaFake = "google_oauth"; // contrasena simbólica (no se usa)
    const [result] = await pool.query(
      "INSERT INTO usuarios (nombre, correo, contrasena, id_rol) VALUES (?, ?, ?, ?)",
      [nombre, correo, contrasenaFake, id_rol || 2]
    );

    console.log("✅ Usuario Google insertado con ID:", result.insertId);

    res.status(201).json({
      id_usuario: result.insertId,
      nombre,
      correo,
      id_rol: id_rol || 2,
      message: "Usuario Google registrado correctamente",
    });
  } catch (err) {
    console.error("❌ Error al registrar usuario Google:", err);
    res.status(500).json({ message: "Error en el servidor", error: err.message });
  }
});


// Iniciar el sesion 
app.post("/login", async (req, res) => {
  const { correo, contrasena } = req.body;
  console.log("📥 Datos recibidos del frontend:", req.body); // 👈 Ver qué llega

  try {
    // Buscar usuario por correo
    const [rows] = await pool.query("SELECT * FROM usuarios WHERE correo = ?", [correo]);
    console.log("🔍 Resultado de la consulta:", rows); // 👈 Ver si encuentra algo

    if (rows.length === 0) {
      return res.status(400).json({ message: "Correo no encontrado" });
    }

    const user = rows[0];

    // Comparar contraseñas
    const passwordValida = await bcrypt.compare(contrasena, user.contrasena);
    console.log("✅ Contraseña válida:", passwordValida);

    if (!passwordValida) {
      return res.status(400).json({ message: "Contraseña incorrecta" });
    }

    res.json({
      id_usuario: user.id_usuario,
      nombre: user.nombre,
      correo: user.correo,
      rol: user.id_rol,
    });

  } catch (error) {
    console.error("❌ Error en el login:", error);
    res.status(500).json({ message: "Error en el servidor", error: error.message });
  }
});

//seleccinar categorias
app.get("/categorias", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM categorias");
    res.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener categorías:", error);
    res.status(500).json({ message: "Error en el servidor", error: error.message });
  }
});

//Agregar nueva categoria
app.post("/ADDcategorias", async (req, res) => {
  const { nombre_categoria,descripcion } = req.body;
  if (!nombre_categoria) {
    return res.status(400).json({ message: "Falta el nombre de la categoría" });
  }
  try {
    const [result] = await pool.query(
      "INSERT INTO categorias (nombre_categoria, descripcion) VALUES (?, ?)",
      [nombre_categoria, descripcion]
    );
    console.log("✅ Categoría agregada con ID:", result.insertId);
    res.status(201).json({ message: "Categoría agregada correctamente", id: result.insertId });
  }
  catch (err) {
    console.error("❌ Error al agregar categoría:", err);
    res.status(500).json({ message: "Error en el servidor", error: err.message });
  }
});

//actualizar categoria
app.put("/UPcategorias/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre_categoria, descripcion } = req.body;
  try {
    const [result] = await pool.query(
      "UPDATE categorias SET nombre_categoria = ?, descripcion = ? WHERE id_categoria = ?",
      [nombre_categoria, descripcion, id]
    );
    console.log("✅ Categoría actualizada con ID:", id);
    res.json({ message: "Categoría actualizada correctamente" });
  }
  catch (err) {
    console.error("❌ Error al actualizar categoría:", err);
    res.status(500).json({ message: "Error en el servidor", error: err.message });
  }
});

//eliminar categoria
app.delete("/DELcategorias/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM categorias WHERE id_categoria = ?", [id]); 
    console.log("✅ Categoría eliminada con ID:", id);
    res.json({ message: "Categoría eliminada correctamente" });
  } catch (err) {
    console.error("❌ Error al eliminar categoría:", err);
    res.status(500).json({ message: "Error en el servidor", error: err.message });
  }
});

// 📂 Carpeta donde se guardarán las imágenes
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "imagenes/"); // ruta relativa desde el server.js
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + path.extname(file.originalname);
    cb(null, uniqueName); // ej. 1699384829012.jpg
  },
});

const upload = multer({ storage });

//ruta para recibir imagenes
app.post("/imagenes", upload.single("imagen"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No se subió ninguna imagen" });
  }

  const imageUrl = `/imagenes/${req.file.filename}`;
  res.json({ imageUrl });
});


//Agregar productos
app.post("/productos", async (req, res) => {
  const { nombre, descripcion, precio, stock, imagen, id_categoria } = req.body;

  console.log("📦 Datos recibidos:", req.body); // 👈 AGREGA ESTO

  if (!nombre || !descripcion || !precio || !stock || !imagen || !id_categoria) {
    console.log("⚠️ Faltan datos:", { nombre, descripcion, precio, stock, imagen, id_categoria });
    return res.status(400).json({ message: "Faltan datos obligatorios" });
  }

  try {
    const [result] = await pool.query(
      "INSERT INTO productos (nombre_producto, descripcion, precio, stock, imagen, id_categoria) VALUES (?, ?, ?, ?, ?, ?)",
      [nombre, descripcion, precio, stock, imagen, id_categoria]
    );

    console.log("✅ Producto insertado con ID:", result.insertId);
    res.status(201).json({ message: "Producto agregado correctamente", id: result.insertId });
  } catch (err) {
    console.error("❌ Error al agregar producto:", err);
    res.status(500).json({ message: "Error en el servidor", error: err.message });
  }
});

// Obtener productos
app.get("/OPproductos", async (req, res) => {
  try {
    const [rows] = await pool.query(`
      SELECT 
        p.id_producto,
        p.nombre_producto AS nombre, 
        p.descripcion, 
        p.precio, 
        p.stock,
        p.imagen As image,
        c.nombre_categoria AS categoria,
        p.id_categoria
      FROM productos p
      LEFT JOIN categorias c ON p.id_categoria = c.id_categoria
    `);
    res.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener productos:", error);
    res.status(500).json({ message: "Error en el servidor", error: error.message });
  }
});

//actualizar productos
app.put("/UPproductos/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio, stock, imagen, id_categoria } = req.body;
  try {
    const [result] = await pool.query(
      "UPDATE productos SET nombre_producto = ?, descripcion = ?, precio = ?, stock = ?, imagen = ?, id_categoria = ? WHERE id_producto = ?",
      [nombre, descripcion, precio, stock, imagen, id_categoria, id]
    );
    console.log("✅ Producto actualizado con ID:", id);
    res.json({ message: "Producto actualizado correctamente" });
  } catch (err) {
    console.error("❌ Error al actualizar producto:", err);
    res.status(500).json({ message: "Error en el servidor", error: err.message });
  }
});

//eleminar productos
app.delete("/DPproductos/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM productos WHERE id_producto = ?", [id]); 
    console.log("✅ Producto eliminado con ID:", id);
    res.json({ message: "Producto eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error al eliminar producto:", err);
    res.status(500).json({ message: "Error en el servidor", error: err.message });
  }
});

//crear el carrito del usuario
app.post("/carrito", async (req, res) => {
  const { id_usuario } = req.body;
  if (!id_usuario) {
    return res.status(400).json({ message: "Falta el ID del usuario" });
  }
  try {
    const [result] = await pool.query(
      "INSERT INTO carrito (id_usuario) VALUES (?)",
      [id_usuario] 
    );
    console.log("✅ Carrito creado con ID:", result.insertId);
    res.status(201).json({ message: "Carrito creado correctamente", id: result.insertId });
  } catch (err) {
    console.error("❌ Error al crear carrito:", err);
    res.status(500).json({ message: "Error en el servidor", error: err.message });
  }
});



//detalles del carrito
app.post("/carrito_detalle", async (req, res) => {
  const { id_carrito, id_producto, cantidad, subtotal } = req.body;

  if (!id_carrito || !id_producto || !cantidad || !subtotal) {
    return res.status(400).json({ message: "Faltan datos obligatorios" });
  }

  try {
    const [result] = await pool.query(
      `INSERT INTO carrito_detalle (id_carrito, id_producto, cantidad, subtotal)
       VALUES (?, ?, ?, ?)`,
      [id_carrito, id_producto, cantidad, subtotal]
    );

    console.log("🛒 Producto agregado al carrito:", {
      id_detalle: result.insertId,
      id_carrito,
      id_producto,
      cantidad,
      subtotal
    });

    res.status(201).json({
      message: "Producto agregado al carrito correctamente",
      id_detalle: result.insertId
    });
  } catch (err) {
    console.error("❌ Error al insertar en detalle_carrito:", err);
    res.status(500).json({ message: "Error al agregar producto al carrito", error: err.message });
  }
});;

//obtener detalles de carrito al entrar 
app.get("/carrito", async (req, res) => {
  const { usuario } = req.query;

  try {
    // Buscar carrito del usuario
    const [carritos] = await pool.query("SELECT * FROM carrito WHERE id_usuario = ?", [usuario]);
    if (carritos.length === 0) {
      return res.status(404).json({ message: "Carrito no encontrado" });
    }

    const carrito = carritos[0];

    // Buscar detalles del carrito
    const [detalles] = await pool.query(
      `SELECT dc.id_detalle, dc.id_producto, dc.cantidad, dc.subtotal,
              p.nombre_producto AS nombre, p.precio, p.imagen
       FROM carrito_detalle dc
       JOIN productos p ON dc.id_producto = p.id_producto
       WHERE dc.id_carrito = ?`,
      [carrito.id_carrito]
    );

    res.json({
      id_carrito: carrito.id_carrito,
      id_usuario: carrito.id_usuario,
      detalles
    });
  } catch (err) {
    console.error("❌ Error al obtener carrito:", err);
    res.status(500).json({ message: "Error en el servidor", error: err.message });
  }
});

//eleimitar detalles del carrito dependiendo del id del producto y del id del carrito
app.delete("/DELcarrito_detalle", async (req, res) => {
  const { id_carrito, id_producto } = req.body; 
  if (!id_carrito || !id_producto) {
    return res.status(400).json({ message: "Faltan datos obligatorios" });
  }
  try {
    const [result] = await pool.query(
      "DELETE FROM carrito_detalle WHERE id_carrito = ? AND id_producto = ?",
      [id_carrito, id_producto]
    );
    console.log("🗑️ Detalle del carrito eliminado:", { id_carrito, id_producto });
    res.json({ message: "Detalle del carrito eliminado correctamente" });
  } catch (err) {
    console.error("❌ Error al eliminar detalle del carrito:", err);
    res.status(500).json({ message: "Error en el servidor", error: err.message });
  }
});

//agragear metodos de pago
app.post("/ADDmetodos_pago", async (req, res) => {
  const { nombre_metodo, descripcion } = req.body;
  if (!nombre_metodo) {
    return res.status(400).json({ message: "Falta el nombre del método de pago" });
  }
  try {
    const [result] = await pool.query(
      "INSERT INTO metodos_pago (nombre_metodo, descripcion) VALUES (?,?)",
      [nombre_metodo, descripcion]
    );
    console.log("✅ Método de pago agregado con ID:", result.insertId);
    res.status(201).json({ message: "Método de pago agregado correctamente", id: result.insertId });
  }
  catch (err) {
    console.error("❌ Error al agregar método de pago:", err);
    res.status(500).json({ message: "Error en el servidor", error: err.message });
  }
});

//actualizar metodos de pago
app.put("/UPmetodos_pago/:id", async (req, res) => {
  const { id } = req.params;
  const { nombre_metodo, descripcion } = req.body;
  try {
    const [result] = await pool.query(
      "UPDATE metodos_pago SET nombre_metodo = ?, descripcion = ? WHERE id_metodo = ?",
      [nombre_metodo, descripcion, id]
    );
    console.log("✅ Método de pago actualizado con ID:", id);
    res.json({ message: "Método de pago actualizado correctamente" });
  } catch (err) {
    console.error("❌ Error al actualizar método de pago:", err);
    res.status(500).json({ message: "Error en el servidor", error: err.message });
  }
});

//eliminar metodos de pago
app.delete("/DELmetodos_pago/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query("DELETE FROM metodos_pago WHERE id_metodo = ?", [id]); 
    console.log("✅ Método de pago eliminado con ID:", id);
    res.json({ message: "Método de pago eliminado correctamente", id });
  } catch (err) {
    console.error("❌ Error al eliminar método de pago:", err);
    res.status(500).json({ message: "Error en el servidor", error: err.message });
  }
});

// mostrar me todos de pagos
app.get("/metodos_pago", async (req, res) => {
  try {
    const [rows] = await pool.query("SELECT * FROM metodos_pago");
    res.json(rows);
  } catch (error) {
    console.error("❌ Error al obtener métodos de pago:", error);
    res.status(500).json({ message: "Error en el servidor", error: error.message });
  }
});

// Crear una nueva orden desde el carrito
app.post("/crear_orden", async (req, res) => {
  const { id_usuario, id_carrito, id_metodo_pago, total, items } = req.body;

  if (!id_usuario || !id_metodo_pago || !Array.isArray(items)) {
    return res.status(400).json({ message: "Faltan datos obligatorios o items inválidos" });
  }

  try {

    //metodo de paypal para marcar como pagado
    const estado = id_metodo_pago === 2 ? 'pagado' : 'pendiente';

    // 1️⃣ Crear la orden
    const [orden] = await pool.query(
      "INSERT INTO ordenes (id_usuario, total, estado) VALUES (?, ?, 'pendiente')",
      [id_usuario, total]
    );
    const id_orden = orden.insertId;

    // 2️⃣ Insertar detalles
    for (const item of items) {
      await pool.query(
        "INSERT INTO orden_detalle (id_orden, id_producto, cantidad, subtotal) VALUES (?, ?, ?, ?)",
        [id_orden, item.id_producto, item.cantidad, item.subtotal]
      );
    }

    // 3️⃣ Registrar pago simulado
    const referencia = `PAYPAL_SIMULADO_${Date.now()}`;
    await pool.query(
      "INSERT INTO pagos (id_orden, id_metodo, monto, referencia) VALUES (?, ?, ?, ?)",
      [id_orden, id_metodo_pago, total, referencia]
    );

    // 4️⃣ Cambiar estado de la orden a 'pagado'
    await pool.query("UPDATE ordenes SET estado = 'pagado' WHERE id_orden = ?", [id_orden]);
    
    console.log("🛒 Intentando vaciar carrito con id:", id_carrito);

    // 5️⃣ Vaciar carrito si existe
    if (id_carrito) {
      await pool.query("DELETE FROM carrito_detalle WHERE id_carrito = ?", [id_carrito]);
    }

    res.json({
      message: "✅ Orden creada y pago simulado registrado correctamente",
      id_orden,
      referencia
    });
  } catch (error) {
    console.error("❌ Error al crear orden:", error);
    res.status(500).json({ message: "Error en el servidor", error: error.message });
  }
});


app.use("/imagenes", express.static("imagenes"));


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
