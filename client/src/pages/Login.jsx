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

  // Función para resetear formulario al voltear la tarjeta
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-blue-50 p-4">
      
      {/* Contenedor Principal con Perspectiva */}
      <div className="w-full max-w-md [perspective:1000px]">
        
        {/* Tarjeta Interna que Gira */}
        <div className={`relative w-full transition-all duration-700 [transform-style:preserve-3d] ${!isLogin ? '[transform:rotateY(180deg)]' : ''}`}>
          
          {/* ================= CARA FRONTAL (LOGIN) ================= */}
          <div className="w-full bg-white rounded-2xl shadow-2xl border-t-4 border-blue-600 p-8 [backface-visibility:hidden]">
            
            {/* Header Login */}
            <div className="text-center mb-8">
              <img src={logoSibci} alt="Logo SIBCI" className="w-20 h-20 mx-auto object-contain mb-4" />
              <h1 className="text-2xl font-extrabold text-blue-900">Bienvenido de nuevo</h1>
              <p className="text-gray-500 text-sm">Ingresa tus credenciales para continuar</p>
            </div>

            {/* Formulario Login */}
            <form onSubmit={handleSubmit} className="space-y-5">
              {error && isLogin && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm text-center border border-red-200 animate-pulse">
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
                <div className="relative">
                  <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    required={isLogin}
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="Tu usuario"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
                <div className="relative">
                  <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required={isLogin}
                    className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded border border-blue-100">
                <p>Credenciales demo: <strong>admin</strong> / <strong>admin123</strong></p>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg transform transition hover:-translate-y-1 flex justify-center items-center gap-2"
              >
                {loading ? <span className="animate-spin">⏳</span> : <><FaSignInAlt /> Iniciar Sesión</>}
              </button>
            </form>

            {/* Footer Login (Trigger para voltear) */}
            <div className="mt-8 text-center border-t pt-4">
              <p className="text-gray-600 text-sm">
                ¿No tienes una cuenta?{' '}
                <button 
                  onClick={toggleFlip}
                  className="text-blue-600 font-bold hover:underline focus:outline-none"
                >
                  Regístrate aquí
                </button>
              </p>
            </div>
          </div>

          {/* ================= CARA TRASERA (REGISTRO) ================= */}
          {/* Nota: rotateY(180deg) es necesario para que esta cara esté "detrás" inicialmente */}
          <div className="absolute top-0 left-0 w-full h-full bg-white rounded-2xl shadow-2xl border-t-4 border-blue-500 p-8 [backface-visibility:hidden] [transform:rotateY(180deg)]">
            
            <div className="text-center mb-9">
              <img src={logoSibci} alt="Logo SIBCI" className="w-20 h-20 mx-auto object-contain mb-4" />
              <h1 className="text-2xl font-extrabold text-blue-900">Crear Cuenta</h1>
              <p className="text-gray-500 text-sm">Únete al sistema SIBCI Guárico</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && !isLogin && (
                <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm text-center border border-red-200">
                  {error}
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div>
                    <div className="relative">
                    <FaIdCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        name="nombre"
                        value={formData.nombre}
                        onChange={handleChange}
                        required={!isLogin}
                        className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        placeholder="Nombre y Apellido"
                    />
                    </div>
                </div>

                <div>
                    <div className="relative">
                    <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required={!isLogin}
                        className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        placeholder="Correo Electrónico"
                    />
                    </div>
                </div>

                <div>
                    <div className="relative">
                    <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required={!isLogin}
                        className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        placeholder="Usuario"
                    />
                    </div>
                </div>

                <div>
                    <div className="relative">
                    <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required={!isLogin}
                        className="w-full pl-10 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                        placeholder="Contraseña"
                    />
                    </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg shadow-lg transform transition hover:-translate-y-1 flex justify-center items-center gap-2 mt-4"
              >
                {loading ? <span className="animate-spin">⏳</span> : <><FaUserPlus /> Registrarse</>}
              </button>
            </form>

            {/* Footer Registro (Trigger para volver) */}
            <div className="mt-6 text-center border-t pt-4">
              <button 
                onClick={toggleFlip}
                className="flex items-center justify-center gap-2 mx-auto text-gray-600 font-medium hover:text-blue-600 transition-colors"
              >
                <FaArrowLeft /> Volver al Login
              </button>
            </div>

          </div>

        </div>
      </div>
      
      {/* Footer General */}
      <div className="absolute bottom-4 text-center w-full">
         <p className="text-sm text-gray-500">SIBCI Guárico &copy; 2025</p>
      </div>
    </div>
  );
};

export default Login;