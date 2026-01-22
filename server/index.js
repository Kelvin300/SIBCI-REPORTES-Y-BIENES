const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// --- CONFIGURACIÓN BASE DE DATOS (SQLite) ---
const sequelize = new Sequelize({
  dialect: 'sqlite',
  // En Render: monta un disco persistente en /var/data y usa SQLITE_PATH=/var/data/sibci_database.sqlite
  storage: process.env.SQLITE_PATH || './sibci_database.sqlite',
  logging: false
});

// --- MODELOS ---

// 1. Modelo de Bienes (VERSIÓN ROBUSTA - Compatible con tu Frontend)
const Asset = sequelize.define('Asset', {
  id: {
    type: DataTypes.STRING, 
    primaryKey: true,       
    allowNull: false,
    unique: true
  },
  titulo: {  // Campo principal para el nombre del bien
    type: DataTypes.STRING,
    allowNull: false
  },
  nombre: { // Campo de respaldo (para evitar errores si el frontend envía 'nombre')
    type: DataTypes.STRING,
    allowNull: true
  },
  condicion: {
    type: DataTypes.STRING
  },
  ubicacion: { // Campo de respaldo
    type: DataTypes.STRING,
    allowNull: true
  },
  estado: {
    type: DataTypes.STRING,
    defaultValue: 'Operativo'
  }
});

// 2. Modelo de Reportes
const Report = sequelize.define('Report', {
  solicitante: { type: DataTypes.STRING, allowNull: false },
  departamento: { type: DataTypes.STRING, allowNull: false },
  tipo_falla: { type: DataTypes.STRING }, 
  descripcion: { type: DataTypes.TEXT },
  estado: { type: DataTypes.STRING, defaultValue: 'Pendiente' }
});

// 3. Modelo de Usuarios
const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  nombre: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  rol: { type: DataTypes.STRING, defaultValue: 'usuario', allowNull: false } 
});

// --- SINCRONIZACIÓN E INICIO ---
console.log('\n🔄 Inicializando base de datos...');

// Usamos { alter: true } para actualizar columnas sin borrar datos existentes (si los hubiera)
sequelize.sync({ alter: true })
  .then(async () => {
    console.log('✓ Base de datos SQLite sincronizada y actualizada correctamente.');
    console.log('✓ Tablas listas: Asset, Report, User');
    
    // Crear admin por defecto si no existe
    const adminExists = await User.findOne({ where: { username: 'admin' } });
    if (!adminExists) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await User.create({
        username: 'admin',
        password: hashedPassword,
        nombre: 'Administrador',
        email: 'admin@sibci.gob.ve',
        rol: 'admin'
      });
      console.log('✓ Usuario administrador creado por defecto:');
      console.log('  Usuario: admin');
      console.log('  Contraseña: admin123');
    }
  })
  .catch((error) => {
    console.error('✗ Error al sincronizar base de datos:', error);
  });

// --- CONFIGURACIÓN DE CORREO ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS
  }
});

// Verificar configuración de correo
const verifyEmailConfig = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.ADMIN_EMAIL) {
    console.warn('\n⚠️  ADVERTENCIA: Variables de correo no configuradas completamente en .env');
    return false;
  }
  return true;
};

// Verificar conexión del transporter
transporter.verify((error, success) => {
  if (error) {
    console.warn('⚠️  El servicio de correo no está disponible (revisa las variables de entorno y credenciales)');
    console.error(error);
  } else {
    console.log('✓ Servicio de correo verificado y listo');
    console.log(success);
  }
});

// --- MIDDLEWARES DE AUTENTICACIÓN ---

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Token de acceso requerido' });

  jwt.verify(token, process.env.JWT_SECRET || 'sibci-secret-key-change-in-production', (err, user) => {
    if (err) return res.status(403).json({ error: 'Token inválido o expirado' });
    req.user = user;
    next();
  });
};

const requireAdmin = (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador' });
  }
  next();
};

// --- RUTAS API ---

// Función para verificar reCAPTCHA
const verifyRecaptcha = async (token) => {
  if (!token) return false;
  
  // En modo desarrollo, si no hay clave secreta configurada, permitir pasar
  if (!process.env.RECAPTCHA_SECRET_KEY) {
    console.warn('⚠️  RECAPTCHA_SECRET_KEY no configurado. reCAPTCHA deshabilitado en desarrollo.');
    return true;
  }

  try {
    const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
      params: {
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: token
      }
    });

    return response.data.success === true;
  } catch (error) {
    console.error('Error verificando reCAPTCHA:', error);
    return false;
  }
};

// === AUTENTICACIÓN ===
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password, recaptchaToken } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Datos incompletos' });

    // Verificar reCAPTCHA
    const recaptchaValid = await verifyRecaptcha(recaptchaToken);
    if (!recaptchaValid) {
      return res.status(400).json({ error: 'Verificación reCAPTCHA fallida. Por favor, intenta nuevamente.' });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });

    const token = jwt.sign(
      { id: user.id, username: user.username, rol: user.rol, nombre: user.nombre },
      process.env.JWT_SECRET || 'sibci-secret-key-change-in-production',
      { expiresIn: '24h' }
    );

    res.json({ token, user: { id: user.id, username: user.username, nombre: user.nombre, rol: user.rol } });
  } catch (error) {
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, nombre, email, recaptchaToken } = req.body;
    if (!username || !password || !nombre || !email) return res.status(400).json({ error: 'Datos incompletos' });

    // Verificar reCAPTCHA
    const recaptchaValid = await verifyRecaptcha(recaptchaToken);
    if (!recaptchaValid) {
      return res.status(400).json({ error: 'Verificación reCAPTCHA fallida. Por favor, intenta nuevamente.' });
    }

    const userExists = await User.findOne({ where: { username } });
    if (userExists) return res.status(400).json({ error: 'El usuario ya existe' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, password: hashedPassword, nombre, email, rol: 'usuario' });

    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, rol: newUser.rol, nombre: newUser.nombre },
      process.env.JWT_SECRET || 'sibci-secret-key-change-in-production',
      { expiresIn: '24h' }
    );

    res.status(201).json({ token, user: { id: newUser.id, username: newUser.username, nombre: newUser.nombre, rol: newUser.rol } });
  } catch (error) {
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

app.get('/api/auth/verify', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ user: { id: user.id, username: user.username, nombre: user.nombre, email: user.email, rol: user.rol } });
  } catch (error) {
    res.status(500).json({ error: 'Error al verificar token' });
  }
});

// === BIENES (ASSETS) - LÓGICA MEJORADA ===
app.get('/api/assets', authenticateToken, async (req, res) => {
  try {
    const assets = await Asset.findAll({ order: [['createdAt', 'DESC']] });
    res.json(assets);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/assets', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // Recibimos cualquier variación de nombre que envíe el frontend
    const { codigo, id_manual, nombre, titulo, condicion, ubicacion, estado } = req.body;
    
    // Guardamos duplicado para asegurar compatibilidad
    const newAsset = await Asset.create({
      id: codigo || id_manual, // ID prioritario
      titulo: titulo || nombre, // Titulo o nombre
      nombre: nombre || titulo, // Respaldo en columna nombre
      condicion: condicion,
      ubicacion: ubicacion || condicion, // Respaldo en ubicacion
      estado: estado
    });
    res.json(newAsset);
  } catch (error) { 
    console.error("Error guardando bien:", error);
    res.status(500).json({ error: error.message }); 
  }
});

app.delete('/api/assets/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await Asset.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Bien eliminado correctamente' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/assets/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await Asset.update(req.body, { where: { id: req.params.id } });
    res.json({ message: 'Bien actualizado' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// === REPORTES (REPORTS) - CON ENVÍO DE CORREO ===
app.get('/api/reports', authenticateToken, async (req, res) => {
  try {
    const reports = await Report.findAll({ order: [['createdAt', 'DESC']] });
    res.json(reports);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/reports', authenticateToken, async (req, res) => {
  console.log('\n📥 Creando nuevo reporte...');
  try {
    const { solicitante, departamento, tipo_falla, descripcion } = req.body;
    const newReport = await Report.create(req.body);
    
    let emailSent = false;
    let emailError = null;

    // Intentar enviar correo si está configurado
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.ADMIN_EMAIL) {
        const mailOptions = {
          from: process.env.EMAIL_USER,
          to: process.env.ADMIN_EMAIL,
          subject: `🚨 Nuevo Reporte SIBCI: ${tipo_falla} - ${departamento}`,
          html: `
            <h3>Nuevo Reporte de Soporte Técnico</h3>
            <p><strong>Solicitante:</strong> ${solicitante}</p>
            <p><strong>Departamento:</strong> ${departamento}</p>
            <p><strong>Falla:</strong> ${tipo_falla}</p>
            <p><strong>Descripción:</strong> ${descripcion}</p>
            <hr>
            <p><small>Fecha: ${new Date().toLocaleString('es-VE')}</small></p>
          `
        };
        
        try {
            await transporter.sendMail(mailOptions);
            console.log('✓ Correo de notificación enviado.');
            emailSent = true;
        } catch (err) {
            console.error('✗ Error enviando correo:', err.message);
            emailError = err.message;
        }
    } else {
        console.log('⚠️ Correo no enviado: Falta configuración en .env');
    }

    res.json({ 
        message: emailSent ? 'Reporte creado y notificado' : 'Reporte creado (sin notificación)', 
        report: newReport, 
        emailSent,
        emailError
    });

  } catch (error) { 
      console.error('✗ Error creando reporte en BD:', error);
      res.status(500).json({ error: error.message }); 
  }
});

app.delete('/api/reports/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await Report.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Reporte eliminado' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/reports/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      await Report.update(req.body, { where: { id: req.params.id } });
      res.json({ message: 'Estado actualizado' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log(`🚀 Servidor SIBCI iniciado en http://localhost:${PORT}`);
  console.log(`📅 Fecha: ${new Date().toLocaleString('es-VE')}`);
  verifyEmailConfig();
  console.log('='.repeat(50) + '\n');
});

// Endpoint de diagnóstico para probar configuración de correo desde producción (Render)
app.get('/api/test-email', async (req, res) => {
  try {
    const envInfo = {
      EMAIL_USER_set: !!process.env.EMAIL_USER,
      EMAIL_PASS_set: !!process.env.EMAIL_PASS,
      ADMIN_EMAIL_set: !!process.env.ADMIN_EMAIL
    };

    // Intentar verificar transporter
    let verifyResult = null;
    try {
      await transporter.verify();
      verifyResult = { ok: true, message: 'transporter verified' };
    } catch (err) {
      verifyResult = { ok: false, message: err.message, stack: err.stack };
    }

    // Intentar enviar correo de prueba sólo si las vars están presentes
    let sendResult = null;
    if (process.env.EMAIL_USER && process.env.EMAIL_PASS && process.env.ADMIN_EMAIL) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: 'SIBCI - Prueba de correo desde servidor',
        text: `Prueba enviada desde servidor en ${new Date().toLocaleString()}`
      };

      try {
        const info = await transporter.sendMail(mailOptions);
        sendResult = { ok: true, info };
      } catch (err) {
        sendResult = { ok: false, message: err.message, stack: err.stack };
      }
    } else {
      sendResult = { ok: false, message: 'Faltan variables de entorno para enviar correo' };
    }

    res.json({ envInfo, verifyResult, sendResult });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});