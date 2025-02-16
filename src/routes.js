const { Router } = require("express");
const fs = require('fs');
const path = require('path');
const jwt = require("jsonwebtoken");

const routes = Router();

// Middleware para verificar el token
function verifyToken(req, res, next) {
  const token = req.headers["authorization"];
  
  if (!token) {
    return res.status(403).json({ message: "Token requerido" });
  }

  jwt.verify(token.replace("Bearer ", ""), process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: "Token inválido" });
    }
    req.user = decoded; // Guardamos los datos del usuario autenticado
    next();
  });
}

function getUsersFromFile() {
  const archivo = path.join(__dirname, '../data/users.txt');
  
  if (!fs.existsSync(archivo)) {
    fs.writeFileSync(archivo, JSON.stringify([]));
  }
  
  const archivodata = fs.readFileSync(archivo);
  return JSON.parse(archivodata);
}

function saveUsersToFile(users) {
  const archivo = path.join(__dirname, '../data/users.txt');
  fs.writeFileSync(archivo, JSON.stringify(users, null, 2));  // Guardar en formato legible
}


//Lista de usuarios
routes.get('/users',verifyToken, (req, res) => {
  const users = getUsersFromFile();
  res.json(users);
});

//Lista de usuarios por id
routes.get('/users/:id',verifyToken, (req, res) => {
  const users = getUsersFromFile();
  const user = users.find(u => u.id === parseInt(req.params.id));

  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }
  
  res.json(user);
});

//registro de usuario
routes.post('/users/store',verifyToken, (req, res) => {
  const { name, email, type, password } = req.body;

  let users = getUsersFromFile();

  if (!Array.isArray(users)) {
    return res.status(500).json({ message: 'Error al cargar los usuarios, el formato no es válido' });
  }
  //consultar si el usuario con email ya existe
  const existingUser = users.find(u => u.email === email);
  if (existingUser) {
    return res.status(400).json({ message: 'El correo ya está registrado' });
  }

  //verificacion de id para asignar al nuevo usuario
  const validUsers = users.filter(u => u && u.id !== undefined);
  const newId = validUsers.length > 0 ? Math.max(...validUsers.map(u => u.id)) + 1 : 1;

  const newUser = {
    id: newId,
    name,
    email,
    type,
    password
  };

  console.log("Nuevo usuario:", newUser);  // Verifica el nuevo usuario

  //cargar nuevo usuario
  users.push(newUser);
  saveUsersToFile(users);

  res.status(201).json({ message: 'Usuario registrado', user: newUser });
});

routes.put('/users/update/:id', verifyToken,(req, res) => {
  const { name, email, type, password } = req.body;
  const users = getUsersFromFile();
  const user = users.find(u => u.id === parseInt(req.params.id));

  if (!user) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  // Modificar los datos del usuario
  user.name = name || user.name;
  user.email = email || user.email;
  user.type = type || user.type;
  user.password = password || user.password;

  saveUsersToFile(users);

  res.json( { message: 'Usuario Modificado', user: user });
});

routes.delete('/:id', verifyToken,(req, res) => {
  const users = getUsersFromFile();
  const userIndex = users.findIndex(u => u.id === parseInt(req.params.id));

  if (userIndex === -1) {
    return res.status(404).json({ message: 'Usuario no encontrado' });
  }

  const deletedUser = users.splice(userIndex, 1);
  saveUsersToFile(users);

  res.json({ message: 'Usuario eliminado', user: deletedUser });
});

module.exports = routes;
