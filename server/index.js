const express = require('express');
const cors = require('cors');
const { Sequelize, DataTypes, Op } = require('sequelize');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const axios = require('axios');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors());
app.use(express.json());

// Servir archivos subidos
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// Multer para manejar uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const safe = file.originalname.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    cb(null, `${unique}-${safe}`);
  }
});
const upload = multer({ storage });

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
  departamento: { type: DataTypes.STRING, allowNull: true },
  aprobado: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  createdBy: { type: DataTypes.STRING, allowNull: true },
  documentPath: { type: DataTypes.STRING, allowNull: true },
  estado: {
    type: DataTypes.STRING,
    defaultValue: 'Operativo'
  }
});

// 2. Modelo de Reportes
const Report = sequelize.define('Report', {
  solicitante: { type: DataTypes.STRING, allowNull: false },
  departamento: { type: DataTypes.STRING, allowNull: false },
  encargado: { type: DataTypes.STRING, allowNull: true },
  tipo_falla: { type: DataTypes.STRING },
  descripcion: { type: DataTypes.TEXT },
  estado: { type: DataTypes.STRING, defaultValue: 'Pendiente' }
});

// Modelo de Departments (encargado por departamento)
const Department = sequelize.define('Department', {
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  encargado: { type: DataTypes.STRING, allowNull: false }
});

// Crear la tabla Department sólo si no existe (sin usar `alter` para evitar alteraciones sobre otras tablas)
Department.sync()
  .then(() => {
    console.log('✓ Tabla Department creada o ya existente');
  })
  .catch((err) => {
    console.error('✗ Error creando Department:', err);
  });

// 3. Modelo de Usuarios
const User = sequelize.define('User', {
  username: { type: DataTypes.STRING, allowNull: false, unique: true },
  password: { type: DataTypes.STRING, allowNull: false },
  nombre: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false },
  rol: { type: DataTypes.STRING, defaultValue: 'jefe', allowNull: false },
  departamento: { type: DataTypes.STRING, allowNull: true }
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
    // Crear superadmin por defecto si no existe
    const superExists = await User.findOne({ where: { username: 'superadmin' } });
    if (!superExists) {
      const hashedPassword = await bcrypt.hash('superadmin123', 10);
      await User.create({
        username: 'superadmin',
        password: hashedPassword,
        nombre: 'Super Administrador',
        email: 'superadmin@sibci.gob.ve',
        rol: 'superadmin'
      });
      console.log('✓ Usuario superadmin creado por defecto: superadmin / superadmin123');
    }

    // Normalizar roles antiguos 'usuario' -> 'jefe' (el rol público queda eliminado)
    await User.update({ rol: 'jefe' }, { where: { rol: 'usuario' } });
  })
  .catch((error) => {
    console.error('✗ Error al sincronizar base de datos:', error);
  });

// --- CONFIGURACIÓN DE CORREO ---
// Preferir configuración explícita por host/port en producción.
const smtpHost = process.env.SMTP_HOST || 'smtp.gmail.com';
const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;
const smtpSecure = (process.env.SMTP_SECURE === 'true');

console.log(`→ Configuración SMTP: host=${smtpHost} port=${smtpPort} secure=${smtpSecure}`);

const SMTP_TIMEOUT = process.env.SMTP_TIMEOUT ? parseInt(process.env.SMTP_TIMEOUT, 10) : 7000;

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpSecure,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: { rejectUnauthorized: false },
  // Timeouts para evitar bloqueos largos en entornos que limitan SMTP
  connectionTimeout: SMTP_TIMEOUT,
  greetingTimeout: SMTP_TIMEOUT,
  socketTimeout: SMTP_TIMEOUT
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
// Verificar conexión del transporter con timeout protegido
(async () => {
  try {
    await Promise.race([
      transporter.verify(),
      new Promise((_, reject) => setTimeout(() => reject(new Error('transporter.verify timeout')), SMTP_TIMEOUT + 2000))
    ]);
    console.log('✓ Servicio de correo verificado y listo');
  } catch (error) {
    console.warn('⚠️  El servicio de correo no está disponible o la verificación excedió el tiempo:');
    console.error(error && error.message ? error.message : error);
  }
})();

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
  if (req.user.rol !== 'admin' && req.user.rol !== 'superadmin') {
    return res.status(403).json({ error: 'Acceso denegado. Se requiere rol de administrador o superadministrador' });
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

// Registro público eliminado. La creación de usuarios debe ser realizada por admin/superadmin.
// Endpoint para que admin o superadmin creen usuarios (asignar rol y departamento)
app.post('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { username, password, nombre, email, rol, departamento } = req.body;
    if (!username || !password || !nombre || !email || !rol) return res.status(400).json({ error: 'Datos incompletos' });

    const allowedRoles = ['admin', 'superadmin', 'jefe'];
    if (!allowedRoles.includes(rol)) return res.status(400).json({ error: 'Rol inválido' });

    const userExists = await User.findOne({ where: { username } });
    if (userExists) return res.status(400).json({ error: 'El usuario ya existe' });

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, password: hashedPassword, nombre, email, rol, departamento });

    res.status(201).json({ user: { id: newUser.id, username: newUser.username, nombre: newUser.nombre, rol: newUser.rol, departamento: newUser.departamento } });
  } catch (error) {
    console.error('Error creando usuario:', error);
    res.status(500).json({ error: 'Error al crear usuario' });
  }
});

app.get('/api/auth/verify', authenticateToken, async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id);
    if (!user) return res.status(404).json({ error: 'Usuario no encontrado' });
    res.json({ user: { id: user.id, username: user.username, nombre: user.nombre, email: user.email, rol: user.rol, departamento: user.departamento } });
  } catch (error) {
    res.status(500).json({ error: 'Error al verificar token' });
  }
});

// === BIENES (ASSETS) - LÓGICA MEJORADA ===
app.get('/api/assets', authenticateToken, async (req, res) => {
  try {
    // Si es jefe, devolver solo bienes aprobados de su(s) departamento(s)
    let assets = [];
    if (req.user.rol === 'jefe') {
      const depts = await Department.findAll({ where: { encargado: req.user.username } });
      const deptNames = depts.map(d => d.name);
      // Jefe ve bienes aprobados de su departamento y sus propias solicitudes (pendientes)
      assets = await Asset.findAll({
        where: {
          [Op.or]: [
            { aprobado: true, departamento: deptNames.length ? deptNames : null },
            { createdBy: req.user.username }
          ]
        },
        order: [['createdAt', 'DESC']]
      });
    } else {
      // Admin y superadmin ven todo
      assets = await Asset.findAll({ order: [['createdAt', 'DESC']] });
    }

    // Enriquecer con nombre del creador (si existe)
    const creators = Array.from(new Set(assets.map(a => a.createdBy).filter(Boolean)));
    let users = [];
    if (creators.length > 0) {
      users = await User.findAll({ where: { username: creators } });
    }
    const userMap = {};
    users.forEach(u => { userMap[u.username] = u.nombre; });

    const enriched = assets.map(a => {
      const plain = a.get ? a.get({ plain: true }) : a;
      return { ...plain, creatorNombre: userMap[plain.createdBy] || plain.createdBy || null };
    });

    res.json(enriched);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Crear bien: admin/superadmin crean directamente (aprobado=true), jefe crea solicitud (aprobado=false)
app.post('/api/assets', authenticateToken, async (req, res) => {
  try {
    const { codigo, id_manual, nombre, titulo, condicion, ubicacion, estado, departamento } = req.body;

    if (req.user.rol === 'admin' || req.user.rol === 'superadmin') {
      const newAsset = await Asset.create({
        id: codigo || id_manual,
        titulo: titulo || nombre,
        nombre: nombre || titulo,
        condicion: condicion,
        ubicacion: ubicacion || condicion,
        estado: estado,
        departamento: departamento || null,
        aprobado: true,
        createdBy: req.user.username
      });
      return res.json(newAsset);
    }

    if (req.user.rol === 'jefe') {
      // Obtener departamento(s) que encabeza el usuario
      const depts = await Department.findAll({ where: { encargado: req.user.username } });
      if (!depts || depts.length === 0) return res.status(400).json({ error: 'No está asignado como encargado de ningún departamento' });
      const deptName = depts[0].name;

      const newAsset = await Asset.create({
        id: codigo || id_manual,
        titulo: titulo || nombre,
        nombre: nombre || titulo,
        condicion: condicion,
        ubicacion: ubicacion || condicion,
        estado: estado,
        departamento: deptName,
        aprobado: false,
        createdBy: req.user.username
      });
      return res.json({ message: 'Solicitud creada. Debe ser aprobada por admin o superadmin', asset: newAsset });
    }

    return res.status(403).json({ error: 'Acceso denegado' });
  } catch (error) {
    console.error('Error guardando bien:', error);
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/assets/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await Asset.destroy({ where: { id: req.params.id } });
    res.json({ message: 'Bien eliminado correctamente' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.put('/api/assets/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const id = req.params.id;
    const asset = await Asset.findByPk(id);
    if (!asset) return res.status(404).json({ error: 'Bien no encontrado' });
    asset.aprobado = true;
    await asset.save();
    res.json({ message: 'Bien aprobado', asset });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/assets/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await Asset.update(req.body, { where: { id: req.params.id } });
    res.json({ message: 'Bien actualizado' });
  } catch (error) { res.status(500).json({ error: error.message }); }
});

// Subir documento asociado a un bien (puede subirlo el creador o un admin)
app.post('/api/assets/:id/upload', authenticateToken, upload.single('file'), async (req, res) => {
  try {
    const id = req.params.id;
    const asset = await Asset.findByPk(id);
    if (!asset) return res.status(404).json({ error: 'Bien no encontrado' });

    // Permisos: admin/superadmin o creador
    if (req.user.rol !== 'admin' && req.user.rol !== 'superadmin' && req.user.username !== asset.createdBy) {
      return res.status(403).json({ error: 'No autorizado para subir documento' });
    }

    if (!req.file) return res.status(400).json({ error: 'Archivo no recibido' });

    // Guardar ruta relativa para servir desde /uploads
    asset.documentPath = `/uploads/${req.file.filename}`;
    await asset.save();

    res.json({ message: 'Documento adjuntado', asset });
  } catch (error) {
    console.error('Error subiendo documento:', error);
    res.status(500).json({ error: error.message });
  }
});

// === REPORTES (REPORTS) - CON ENVÍO DE CORREO ===
app.get('/api/reports', authenticateToken, async (req, res) => {
  try {
    // Si es jefe, devolver solo reportes del/los departamento(s) que encabeza
    if (req.user.rol === 'jefe') {
      const depts = await Department.findAll({ where: { encargado: req.user.username } });
      const deptNames = depts.map(d => d.name);
      const reports = await Report.findAll({ where: { departamento: deptNames.length ? deptNames : req.user.departamento }, order: [['createdAt', 'DESC']] });
      return res.json(reports);
    }

    const reports = await Report.findAll({ order: [['createdAt', 'DESC']] });
    res.json(reports);
  } catch (error) { res.status(500).json({ error: error.message }); }
});

app.post('/api/reports', authenticateToken, async (req, res) => {
  console.log('\n📥 Creando nuevo reporte...');
  try {
    const { solicitante, departamento, tipo_falla, descripcion } = req.body;
    // Verificar que el departamento exista y tenga encargado
    const dept = await Department.findOne({ where: { name: departamento } });
    if (!dept) {
      return res.status(400).json({ error: 'Departamento no encontrado. Contacte al administrador para asignar un encargado.' });
    }
    if (!dept.encargado) {
      return res.status(400).json({ error: 'El departamento seleccionado no tiene un encargado asignado. Contacte al administrador.' });
    }
    const newReport = await Report.create({ solicitante, departamento, encargado: dept.encargado, tipo_falla, descripcion });

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

// --- DEPARTMENTS ---
app.get('/api/departments', authenticateToken, async (req, res) => {
  try {
    const departments = await Department.findAll({ order: [['name', 'ASC']] });
    res.json(departments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/departments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, encargado } = req.body;
    if (!name || !encargado) return res.status(400).json({ error: 'Nombre y encargado son requeridos' });
    const [dept, created] = await Department.upsert({ name, encargado }, { returning: true });
    res.json({ department: dept, created });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/departments/:name', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const name = req.params.name;
    const deleted = await Department.destroy({ where: { name } });
    if (deleted) {
      res.json({ message: 'Department eliminado' });
    } else {
      res.status(404).json({ error: 'Department no encontrado' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- PDF EXPORT ---
app.get('/api/reports/:id/pdf', authenticateToken, async (req, res) => {
  try {
    const id = req.params.id;
    const report = await Report.findByPk(id);
    if (!report) return res.status(404).json({ error: 'Reporte no encontrado' });

    // Generar PDF en memoria
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="reporte-${id}.pdf"`);

    // --- 1. MARCA DE AGUA (FONDO) ---
    const logoPath = path.join(__dirname, 'assets', 'logo.png');
    if (fs.existsSync(logoPath)) {
      doc.save();
      doc.opacity(0.1);
      const pageWidth = doc.page.width;
      const pageHeight = doc.page.height;
      const imageSize = 400;
      doc.image(logoPath, (pageWidth - imageSize) / 2, (pageHeight - imageSize) / 2, {
        width: imageSize,
        align: 'center',
        valign: 'center'
      });
      doc.restore();
    }

    // --- 2. ENCABEZADO FORMAL ---
    // Logo pequeño arriba a la izquierda
    if (fs.existsSync(logoPath)) {
      doc.image(logoPath, 50, 40, { width: 60 });
    }

    // Texto de la institución
    const headerX = 120;
    doc.font('Helvetica-Bold').fontSize(14).fillColor('#172554').text('SIBCI GUÁRICO', headerX, 45);
    doc.font('Helvetica').fontSize(10).fillColor('#000000').text('Sistema de Bienes y Control Interno', headerX, 65);
    doc.text('Gobernación del Estado Guárico', headerX, 80);

    // Línea separadora
    doc.moveTo(50, 110).lineTo(562, 110).lineWidth(2).strokeColor('#172554').stroke();

    // --- 3. TÍTULO DEL REPORTE ---
    doc.moveDown(5); // Espacio después del header
    doc.font('Helvetica-Bold').fontSize(22).fillColor('#172554').text('REPORTE DE SOPORTE TÉCNICO', { align: 'center' });
    doc.fontSize(12).fillColor('#555555').text(`ID: #${report.id.toString().padStart(6, '0')}`, { align: 'center' });

    doc.moveDown(2);

    // --- 4. DETALLES DEL REPORTE (LAYOUT EN COLUMNAS) ---
    const startY = doc.y;
    const col1X = 60;
    const col2X = 320;
    const rowHeight = 40;

    // Caja contenedora de info
    doc.rect(50, startY - 10, 512, 140).lineWidth(1).strokeColor('#e5e7eb').stroke();

    // Fila 1
    doc.font('Helvetica-Bold').fontSize(10).fillColor('#000000').text('SOLICITANTE:', col1X, startY);
    doc.font('Helvetica').text(report.solicitante, col1X, startY + 15);

    doc.font('Helvetica-Bold').text('DEPARTAMENTO:', col2X, startY);
    doc.font('Helvetica').text(report.departamento, col2X, startY + 15);

    // Fila 2
    const row2Y = startY + rowHeight;
    doc.font('Helvetica-Bold').text('ENCARGADO:', col1X, row2Y);
    doc.font('Helvetica').text(report.encargado || 'Sin asignar', col1X, row2Y + 15);

    doc.font('Helvetica-Bold').text('FECHA DE REGISTRO:', col2X, row2Y);
    doc.font('Helvetica').text(new Date(report.createdAt).toLocaleString('es-VE'), col2X, row2Y + 15);

    // Fila 3
    const row3Y = row2Y + rowHeight;
    doc.font('Helvetica-Bold').text('TIPO DE FALLA:', col1X, row3Y);
    doc.font('Helvetica').fillColor('#ef4444').text(report.tipo_falla || 'No especificado', col1X, row3Y + 15);

    doc.font('Helvetica-Bold').fillColor('#000000').text('ESTADO ACTUAL:', col2X, row3Y);
    const estadoColor = report.estado === 'Resuelto' ? '#16a34a' : '#ca8a04';
    doc.font('Helvetica-Bold').fillColor(estadoColor).text(report.estado, col2X, row3Y + 15);

    // --- 5. DESCRIPCIÓN ---
    doc.y = startY + 150; // Mover cursor abajo de la caja
    doc.moveDown(2);

    doc.font('Helvetica-Bold').fontSize(12).fillColor('#172554').text('DESCRIPCIÓN DETALLADA', 50);
    doc.moveTo(50, doc.y).lineTo(250, doc.y).lineWidth(1).strokeColor('#172554').stroke(); // Subrayado corto
    doc.moveDown(1);

    // Fondo gris suave para la descripción
    const descY = doc.y;
    doc.rect(50, descY, 512, 100).fillColor('#f9fafb').fill();
    doc.fillColor('#374151');
    doc.fontSize(11).font('Helvetica').text(report.descripcion || 'Sin descripción proporcionada.', 60, descY + 10, {
      width: 490,
      align: 'justify'
    });

    // --- 6. PIE DE PÁGINA (FOOTER) ---
    const bottomY = doc.page.height - 80;
    doc.moveTo(50, bottomY).lineTo(562, bottomY).lineWidth(1).strokeColor('#e5e7eb').stroke();

    doc.fontSize(9).fillColor('#9ca3af').text('SIBCI - Sistema de Bienes y Control Interno', 50, bottomY + 10, { align: 'center' });
    doc.text('Este documento es un reporte generado automáticamente.', { align: 'center' });
    doc.text(`Generado el: ${new Date().toLocaleString('es-VE')}`, { align: 'center' });

    doc.end();
    doc.pipe(res);
  } catch (err) {
    console.error('Error generando PDF:', err);
    res.status(500).json({ error: err.message });
  }
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

    // Intentar verificar transporter con timeout para evitar que la petición quede colgada
    let verifyResult = null;
    try {
      await Promise.race([
        transporter.verify(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('verify timeout')), SMTP_TIMEOUT + 2000))
      ]);
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

// Listar usuarios (solo admin/superadmin)
app.get('/api/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const users = await User.findAll({ order: [['username', 'ASC']] });
    const sanitized = users.map(u => ({ id: u.id, username: u.username, nombre: u.nombre, email: u.email, rol: u.rol, departamento: u.departamento }));
    res.json(sanitized);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Eliminar usuario (solo superadmin)
app.delete('/api/users/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.rol !== 'superadmin') return res.status(403).json({ error: 'Acceso denegado. Solo superadministrador puede eliminar usuarios.' });
    const id = req.params.id;
    const userToDelete = await User.findByPk(id);
    if (!userToDelete) return res.status(404).json({ error: 'Usuario no encontrado' });
    // Prevención simple: no permitir eliminar al propio superadmin logged si quiere evitar lockout (opcional)
    if (userToDelete.username === req.user.username) return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
    await User.destroy({ where: { id } });
    res.json({ message: 'Usuario eliminado correctamente' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});