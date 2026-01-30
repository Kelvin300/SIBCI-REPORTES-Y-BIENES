import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ReCAPTCHA from 'react-google-recaptcha';
import { FaUser, FaLock, FaSignInAlt } from 'react-icons/fa';
import logoSibci from '../assets/logo-sibci.png';

const Login = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [recaptchaToken, setRecaptchaToken] = useState(null);
  const recaptchaRefLogin = useRef(null);
  const { login } = useAuth();
  const navigate = useNavigate();

  const RECAPTCHA_SITE_KEY = import.meta.env.VITE_RECAPTCHA_SITE_KEY || '6LeIxAcTAAAAAJcZVRqyHh71UMIEGNQ_MXjiZKhI';

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleRecaptchaChange = (token) => {
    setRecaptchaToken(token);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!recaptchaToken) {
      setError('Por favor, completa el reCAPTCHA para continuar');
      return;
    }
    setLoading(true);
    try {
      const result = await login(formData.username, formData.password, recaptchaToken);
      if (result.success) {
        if (recaptchaRefLogin.current) recaptchaRefLogin.current.reset();
        setRecaptchaToken(null);
        navigate('/');
      } else {
        setError(result.error);
        if (recaptchaRefLogin.current) recaptchaRefLogin.current.reset();
        setRecaptchaToken(null);
      }
    } catch (err) {
      setError('Error de conexión. Por favor, intenta nuevamente.');
      if (recaptchaRefLogin.current) recaptchaRefLogin.current.reset();
      setRecaptchaToken(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="w-full max-w-md z-10">
        <div className="w-full bg-white/90 rounded-2xl shadow-2xl border border-white/20 p-8">
          <div className="text-center mb-8">
            <div className="bg-white rounded-full w-24 h-24 mx-auto flex items-center justify-center shadow-lg mb-4 p-2">
              <img src={logoSibci} alt="Logo SIBCI" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-3xl font-bold text-slate-800">Iniciar Sesión</h1>
            <p className="text-slate-500 text-sm">Ingresa tus credenciales</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <div className="bg-red-100 text-red-600 p-3 rounded-lg text-sm text-center border border-red-200">{error}</div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Usuario</label>
              <div className="relative group">
                <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="text" name="username" value={formData.username} onChange={handleChange} className="w-full pl-10 p-3 bg-slate-50 border rounded-xl" placeholder="Ingrese su usuario" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1 ml-1">Contraseña</label>
              <div className="relative group">
                <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="password" name="password" value={formData.password} onChange={handleChange} className="w-full pl-10 p-3 bg-slate-50 border rounded-xl" placeholder="••••••••" />
              </div>
            </div>

            <div className="flex justify-center mt-4">
              <ReCAPTCHA ref={recaptchaRefLogin} sitekey={RECAPTCHA_SITE_KEY} onChange={handleRecaptchaChange} />
            </div>

            <button
              type="submit"
              disabled={loading || !recaptchaToken}
              className={`w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 ${loading || !recaptchaToken ? 'opacity-60 cursor-not-allowed' : 'hover:from-blue-700 hover:to-purple-700'}`}>
              {loading ? '⏳' : (<><FaSignInAlt /> <span>Iniciar Sesión</span></>)}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;