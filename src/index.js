require("dotenv").config();
const express = require("express");
const routes = require("./routes");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const fs = require("fs");
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/", routes);

// Ruta de autenticación
app.post("/login", (req, res) => {
  const { email, password } = req.body;
  const archivo = path.join(__dirname, '../data/users.txt');
  fs.readFile(archivo, "utf8", (err, data) => {
    if (err) {
      return res.status(500).json({ message: "Error al leer la base de datos" });
    }

    const users = JSON.parse(data); // Convertir JSON a objeto

    // Buscar usuario en el archivo
    const user = users.find((u) => u.email === email && u.password === password);

    if (!user) {
      return res.status(401).json({ message: "Credenciales incorrectas" });
    }

    // Crear el token JWT
    const token = jwt.sign({ email: user.email, password: user.password }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });

    res.json({ message: "Login exitoso", token, user });
  });
});


app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Ocurrió un error en el servidor" });
});

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
