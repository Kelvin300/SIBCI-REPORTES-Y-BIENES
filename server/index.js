const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes } = require('sequelize');
const nodemailer = require('nodemailer');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

const app = express();
const PORT = 3001; // Nota: Tu puerto es 3001

// Middlewares
app.use(cors());
app.use(express.json());

// --- CONFIGURACIÓN BASE DE DATOS (SQLite) ---
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './sibci_database.sqlite',
  logging: false
});

// --- MODELOS ---

// 1. Modelo de Bienes
const Asset = sequelize.define('Asset', {
  codigo: { type: DataTypes.STRING, allowNull: false, unique: true },
  nombre: { type: DataTypes.STRING, allowNull: false },
  marca: { type: DataTypes.STRING },
  serial: { type: DataTypes.STRING },
  ubicacion: { type: DataTypes.STRING },
  estado: { type: DataTypes.STRING, defaultValue: 'Operativo' }
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
  rol: { type: DataTypes.STRING, defaultValue: 'usuario', allowNull: false } // 'admin' o 'usuario'
});

// Sincronizar BD (crear tablas si no existen)
console.log('\n🔄 Inicializando base de datos...');
sequelize.sync({ force: false })
  .then(async () => {
    console.log('✓ Base de datos SQLite sincronizada correctamente.');
    console.log('✓ Tablas creadas: Asset, Report, User');
    
    // Crear usuario administrador por defecto si no existe
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
      console.log('  ⚠️  IMPORTANTE: Cambia esta contraseña después del primer inicio de sesión');
    }
  })
  .catch((error) => {
    console.error('✗ Error al sincronizar la base de datos:', error);
    console.error('  Stack:', error.stack);
    console.error('\n⚠️  El servidor continuará, pero puede haber problemas con la base de datos');
  });

// --- CONFIGURACIÓN DE CORREO ---
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS
  }
});

// Verificar configuración de correo al iniciar
const verifyEmailConfig = () => {
  console.log('\n🔍 Verificando configuración de correo...');
  console.log(`   EMAIL_USER: ${process.env.EMAIL_USER ? '✓ ' + process.env.EMAIL_USER : '✗ NO CONFIGURADO'}`);
  console.log(`   EMAIL_PASS: ${process.env.EMAIL_PASS ? '✓ Configurado (' + process.env.EMAIL_PASS.length + ' caracteres)' : '✗ NO CONFIGURADO'}`);
  console.log(`   ADMIN_EMAIL: ${process.env.ADMIN_EMAIL ? '✓ ' + process.env.ADMIN_EMAIL : '✗ NO CONFIGURADO'}`);
  
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('\n⚠️  ADVERTENCIA: Variables de correo no configuradas (EMAIL_USER, EMAIL_PASS)');
    console.warn('   El envío de correos no funcionará hasta configurar estas variables en .env');
    console.warn('   Asegúrate de que el archivo server/.env existe y tiene los valores correctos');
    return false;
  }
  if (!process.env.ADMIN_EMAIL) {
    console.warn('\n⚠️  ADVERTENCIA: ADMIN_EMAIL no configurado en .env');
    console.warn('   Los correos no sabrán a dónde enviarse');
    return false;
  }
  console.log('\n✓ Configuración de correo detectada:');
  console.log(`  - Usuario: ${process.env.EMAIL_USER}`);
  console.log(`  - Destinatario: ${process.env.ADMIN_EMAIL}`);
  return true;
};

// Verificar conexión del transporter (no bloquea el inicio del servidor)
transporter.verify((error, success) => {
  if (error) {
    console.error('✗ Error al verificar configuración de correo:', error.message);
    console.error('  Asegúrate de que EMAIL_USER y EMAIL_PASS estén correctos en .env');
    console.warn('  ⚠️  El servidor continuará, pero el envío de correos puede fallar');
  } else {
    console.log('✓ Servicio de correo verificado y listo');
  }
});

// --- MIDDLEWARES DE AUTENTICACIÓN ---

// Middleware para verificar token JWT
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Token de acceso requerido' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'sibci-secret-key-change-in-production', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }
    req.user = user;
    next();
  });
};

// Middleware para verificar que el usuario es administrador
const requireAdmin = (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador' });
  }
  next();
};

// --- RUTAS API ---

// === AUTENTICACIÓN ===

// Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    const user = await User.findOne({ where: { username } });
    if (!user) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, rol: user.rol, nombre: user.nombre },
      process.env.JWT_SECRET || 'sibci-secret-key-change-in-production',
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ error: 'Error al iniciar sesión' });
  }
});

// Registro (solo para crear usuarios normales, los admin se crean manualmente)
app.post('/api/auth/register', async (req, res) => {
  try {
    const { username, password, nombre, email } = req.body;

    if (!username || !password || !nombre || !email) {
      return res.status(400).json({ error: 'Todos los campos son requeridos' });
    }

    const userExists = await User.findOne({ where: { username } });
    if (userExists) {
      return res.status(400).json({ error: 'El usuario ya existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({
      username,
      password: hashedPassword,
      nombre,
      email,
      rol: 'usuario' // Siempre se crea como usuario normal
    });

    const token = jwt.sign(
      { id: newUser.id, username: newUser.username, rol: newUser.rol, nombre: newUser.nombre },
      process.env.JWT_SECRET || 'sibci-secret-key-change-in-production',
      { expiresIn: '24h' }
    );

    res.status(201).json({
      token,
      user: {
        id: newUser.id,
        username: newUser.username,
        nombre: newUser.nombre,
        email: newUser.email,
        rol: newUser.rol
      }
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ error: 'Error al registrar usuario' });
  }
});

// Verificar token (para mantener sesión activa)
app.get('/api/auth/verify', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.json({
      user: {
        id: user.id,
        username: user.username,
        nombre: user.nombre,
        email: user.email,
        rol: user.rol
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Error al verificar token' });
  }
});

// === BIENES (ASSETS) ===

// Obtener todos (público - usuarios y admin pueden ver)
app.get('/api/assets', authenticateToken, async (req, res) => {
  try {
    const assets = await Asset.findAll({ order: [['createdAt', 'DESC']] });
    res.json(assets);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Registrar (solo admin)
app.post('/api/assets', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const newAsset = await Asset.create(req.body);
    res.json(newAsset);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Eliminar Bien (solo admin)
app.delete('/api/assets/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await Asset.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Bien eliminado correctamente' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Editar Bien (solo admin)
app.put('/api/assets/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await Asset.update(req.body, { where: { id: req.params.id } });
    res.json({ message: 'Bien actualizado' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});


// === REPORTES (REPORTS) ===

// Obtener todos (público - usuarios y admin pueden ver)
app.get('/api/reports', authenticateToken, async (req, res) => {
  try {
    const reports = await Report.findAll({ order: [['createdAt', 'DESC']] });
    res.json(reports);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Crear Reporte y Enviar Correo (público - cualquier usuario autenticado puede crear)
app.post('/api/reports', authenticateToken, async (req, res) => {
  console.log('\n📥 Nueva petición POST /api/reports recibida');
  console.log('   Datos recibidos:', JSON.stringify(req.body, null, 2));
  
  try {
    const { solicitante, departamento, tipo_falla, descripcion } = req.body;
    
    // Crear el reporte en la base de datos
    console.log('💾 Guardando reporte en la base de datos...');
    const newReport = await Report.create(req.body);
    console.log('✓ Reporte guardado con ID:', newReport.id);

    // Verificar si hay configuración de correo
    console.log('\n🔍 Verificando configuración de correo...');
    console.log('   EMAIL_USER:', process.env.EMAIL_USER ? '✓ Configurado' : '✗ No configurado');
    console.log('   EMAIL_PASS:', process.env.EMAIL_PASS ? '✓ Configurado' : '✗ No configurado');
    console.log('   ADMIN_EMAIL:', process.env.ADMIN_EMAIL ? `✓ ${process.env.ADMIN_EMAIL}` : '✗ No configurado');
    
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS || !process.env.ADMIN_EMAIL) {
      console.warn('⚠️  Intento de envío de correo sin configuración completa');
      console.warn('   Reporte creado pero correo NO enviado');
      return res.json({ 
        message: 'Reporte creado (correo no enviado - falta configuración)', 
        report: newReport,
        emailSent: false,
        emailError: 'Configuración de correo incompleta'
      });
    }

    // Verificar que el transporter esté configurado
    if (!transporter) {
      console.error('✗ Transporter no está inicializado');
      return res.json({
        message: 'Reporte creado pero error en configuración de correo',
        report: newReport,
        emailSent: false,
        emailError: 'Transporter no inicializado'
      });
    }

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

    console.log('\n📧 Intentando enviar correo...');
    console.log(`   De: ${process.env.EMAIL_USER}`);
    console.log(`   Para: ${process.env.ADMIN_EMAIL}`);
    console.log(`   Asunto: ${mailOptions.subject}`);

    // Usar async/await para esperar el envío del correo
    let emailSent = false;
    let emailError = null;

    try {
      console.log('   Enviando correo...');
      const info = await transporter.sendMail(mailOptions);
      console.log('✓ Correo enviado exitosamente');
      console.log(`   Message ID: ${info.messageId}`);
      console.log(`   Respuesta: ${info.response}`);
      emailSent = true;
    } catch (emailErr) {
      emailError = emailErr;
      console.error('✗ Error al enviar correo:');
      console.error('   Mensaje:', emailErr.message);
      console.error('   Código:', emailErr.code);
      console.error('   Command:', emailErr.command);
      console.error('   Response:', emailErr.response);
      console.error('   Stack:', emailErr.stack);
    }

    // Responder con información sobre el envío del correo
    const responseMessage = emailSent 
      ? 'Reporte creado y correo enviado' 
      : 'Reporte creado pero correo no pudo enviarse';
    
    console.log(`\n📤 Enviando respuesta: ${responseMessage}`);
    console.log('   emailSent:', emailSent);
    
    res.json({ 
      message: responseMessage,
      report: newReport,
      emailSent: emailSent,
      emailError: emailError ? emailError.message : null
    });
  } catch (error) { 
    console.error('\n✗ Error al crear reporte:');
    console.error('   Mensaje:', error.message);
    console.error('   Stack:', error.stack);
    res.status(500).json({ error: error.message }); 
  }
});

// Eliminar Reporte (solo admin)
app.delete('/api/reports/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await Report.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Reporte eliminado' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Actualizar Estado (Para marcar como Resuelto - solo admin)
app.put('/api/reports/:id', authenticateToken, requireAdmin, async (req, res) => {
    try {
      await Report.update(req.body, { where: { id: req.params.id } });
      res.json({ message: 'Estado actualizado' });
    } catch (error) { res.status(500).json({ error: error.message }); }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log('\n' + '='.repeat(50));
  console.log(`🚀 Servidor SIBCI iniciado correctamente`);
  console.log(`📡 Escuchando en: http://localhost:${PORT}`);
  console.log(`📅 Iniciado: ${new Date().toLocaleString('es-VE')}`);
  console.log('='.repeat(50) + '\n');
  verifyEmailConfig();
  console.log('\n✅ Servidor listo para recibir peticiones');
  console.log('💡 El servidor está corriendo. Presiona Ctrl+C para detenerlo.\n');
}).on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`\n✗ ERROR: El puerto ${PORT} ya está en uso`);
    console.error('   Cierra el proceso que está usando el puerto o cambia el puerto en index.js');
    console.error('\n   Para encontrar el proceso:');
    console.error(`   netstat -ano | findstr :${PORT}`);
  } else {
    console.error('\n✗ ERROR al iniciar el servidor:', error.message);
    console.error('   Stack:', error.stack);
  }
  process.exit(1);
});

// Manejar errores no capturados (pero no terminar el proceso)
process.on('uncaughtException', (error) => {
  console.error('\n✗ Error no capturado:', error);
  console.error('Stack:', error.stack);
  console.error('⚠️  El servidor continuará ejecutándose, pero este error debe ser revisado');
  // No terminamos el proceso para que el servidor siga corriendo
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('\n✗ Promesa rechazada no manejada:', reason);
  console.error('Promise:', promise);
  console.error('⚠️  El servidor continuará ejecutándose, pero este error debe ser revisado');
  // No terminamos el proceso para que el servidor siga corriendo
});

// Manejar cierre del servidor
process.on('SIGTERM', () => {
  console.log('\n⚠️  Señal SIGTERM recibida. Cerrando servidor...');
  sequelize.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n⚠️  Señal SIGINT recibida (Ctrl+C). Cerrando servidor...');
  sequelize.close().then(() => {
    console.log('✓ Conexión a base de datos cerrada');
    process.exit(0);
  });
});