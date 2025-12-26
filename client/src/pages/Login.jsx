import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaUser, FaLock, FaSignInAlt, FaUserPlus, FaEnvelope, FaIdCard, FaArrowLeft } from 'react-icons/fa';
import logoSibci from '../assets/logo-sibci.png';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    nombre: '',
    email: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const toggleFlip = () => {
    setError('');
    setFormData({ username: '', password: '', nombre: '', email: '' });
    setIsLogin(!isLogin);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let result;
      if (isLogin) {
        result = await login(formData.username, formData.password);
      } else {
        if (!formData.nombre || !formData.email) {
          setError('Todos los campos son requeridos');
          setLoading(false);
          return;
        }
        result = await register(
          formData.username,
          formData.password,
          formData.nombre,
          formData.email
        );
      }

      if (result.success) {
        navigate('/');
      } else {
        setError(result.error);
      }
    } catch (err) {
      setError('Error de conexión. Por favor, intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // FONDO MÁS PROFESIONAL (OSCURO CON GRADIENTE)
    <div className="min-h-screen flex items-center justify-center bg-slate-900 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-black p-4 overflow-hidden relative">
      
      {/* Elementos decorativos de fondo */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 opacity-20">
          <div className="absolute top-10 left-10 w-72 h-72 bg-blue-600 rounded-full mix-blend-multiply filter blur-xl animate-blob"></div>
          <div className="absolute bottom-10 right-10 w-72 h-72 bg-purple-600 rounded-full mix-blend-multiply filter blur-xl animate-blob animation-delay-2000"></div>
      </div>

      {/* Contenedor Principal con Perspectiva */}
      <div className="w-full max-w-md [perspective:1000px] z-10">
        
        {/* Tarjeta Interna que Gira */}
        <div className={`relative w-full transition-all duration-700 [transform-style:preserve-3d] ${!isLogin ? '[transform:rotateY(180deg)]' : ''}`}>
          
          {/* ================= CARA FRONTAL (LOGIN) ================= */}
          <div className="w-full bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 [backface-visibility:hidden]">
            
            <div className="text-center mb-8">
              {/* Logo con sombra */}
              <div className="bg-white rounded-full w-24 h-24 mx-auto flex items-center justify-center shadow-lg mb-4 p-2">
                 <img src={logoSibci} alt="Logo SIBCI" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-3xl font-bold text-slate-800">Bienvenido de Nuevo</h1>
              <p className="text-slate-500 text-sm">Ingresa tus credenciales para ingresar</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
              {error && isLogin && (
                <div className="bg-red-100 text-red-600 p-3 rounded-lg text-sm text-center border border-red-200 animate-pulse font-medium">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Usuario</label>
                <div className="relative group">
                  <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required={isLogin}
                    className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-slate-800"
                    placeholder="Ingrese su usuario"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Contraseña</label>
                <div className="relative group">
                  <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required={isLogin}
                    className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-slate-800"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="text-xs text-blue-600 text-center mt-2">
                <p>Credenciales demo: <strong>admin</strong> / <strong>admin123</strong></p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-xl shadow-lg transform transition hover:-translate-y-0.5 flex justify-center items-center gap-2 mt-2"
              >
                {loading ? <span className="animate-spin">⏳</span> : <><FaSignInAlt /> Iniciar Sesión</>}
              </button>
            </form>

            <div className="mt-8 text-center pt-4 border-t border-slate-100">
              <p className="text-slate-500 text-sm">
                ¿No tienes cuenta?{' '}
                <button 
                  onClick={toggleFlip}
                  className="text-blue-600 font-bold hover:text-blue-800 transition-colors"
                >
                  Regístrate
                </button>
              </p>
            </div>
          </div>

          {/* ================= CARA TRASERA (REGISTRO) ================= */}
          <div className="absolute top-0 left-0 w-full h-full bg-white/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-white/20 p-8 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            <div className="bg-white rounded-full w-24 h-24 mx-auto flex items-center justify-center shadow-lg mb-4 p-2">
                 <img src={logoSibci} alt="Logo SIBCI" className="w-full h-full object-contain" />
              </div>
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-slate-800">Crear Cuenta</h1>
              <p className="text-slate-500 text-sm">Únete al equipo SIBCI Guárico</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {error && !isLogin && (
                <div className="bg-red-50 text-red-600 p-2 rounded text-xs text-center border border-red-200">
                  {error}
                </div>
              )}

              <div className="space-y-3">
                <div className="relative">
                    <FaIdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        required={!isLogin}
                        className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all text-slate-800"
                        placeholder="Nombre Completo"
                    />
                </div>

                <div className="relative">
                    <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required={!isLogin}
                        className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        placeholder="Correo Electrónico"
                    />
                </div>

                <div className="relative">
                    <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                  <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required={!isLogin}
                        className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        placeholder="Usuario"
                    />
                </div>

                <div className="relative">
                    <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required={!isLogin}
                        className="w-full pl-10 p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        placeholder="Contraseña"
                    />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-xl shadow-lg transform transition hover:-translate-y-0.5 flex justify-center items-center gap-2 mt-2"
              >
                {loading ? <span className="animate-spin">⏳</span> : <><FaUserPlus /> Registrarse</>}
              </button>
            </form>

            <div className="mt-4 text-center">
              <button 
                onClick={toggleFlip}
                className="flex items-center justify-center gap-2 mx-auto text-slate-500 text-sm font-medium hover:text-blue-600 transition-colors"
              >
                <FaArrowLeft /> Volver al Login
              </button>
            </div>

          </div>

        </div>
      </div>
      
      {/* Footer General */}
      <div className="absolute bottom-4 text-center w-full z-10">
         <p className="text-xs text-slate-500 opacity-95">SIBCI Guárico &copy; 2025</p>
      </div>
    </div>
  );
};

export default Login;