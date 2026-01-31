import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaLaptopMedical, FaBoxes, FaHome, FaBars, FaTimes, FaClipboardList, FaUser, FaSignOutAlt, FaShieldAlt, FaUsers, FaSun, FaMoon } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
// 1. IMPORTAMOS LA IMAGEN
import logoSibci from '../assets/logo-sibci.png';

const Layout = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false); // Estado para controlar el menú
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', label: 'Inicio', icon: <FaHome /> },
    { path: '/reportes', label: 'Reporte de Fallas', icon: <FaLaptopMedical /> },
    { path: '/bienes', label: 'Control de Bienes', icon: <FaBoxes /> },
    { path: '/gestion', label: 'Gestión de Reportes', icon: <FaClipboardList /> }
  ];

  // Mostrar Gestión de Usuarios solo para admin/superadmin
  if (isAdmin()) {
    menuItems.push({ path: '/users', label: 'Usuarios', icon: <FaUsers /> });
  }

  return (
    <div className="min-h-screen font-sans text-gray-800 dark:text-gray-100 bg-gray-100 dark:bg-gray-900 relative overflow-x-hidden transition-colors duration-300">

      {/* --- BOTÓN HAMBURGUESA (ABRIR) --- */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed top-6 right-6 z-30 p-3 bg-sibci-primary text-white rounded-lg shadow-lg hover:bg-blue-800 transition-all duration-300 hover:scale-105"
          aria-label="Abrir menú"
        >
          <FaBars size={24} />
        </button>
      )}

      {/* --- OVERLAY (FONDO OSCURO) --- */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
          }`}
        onClick={() => setIsOpen(false)}
      />

      {/* --- MENÚ LATERAL DESPLEGABLE (DERECHA) --- */}
      <aside
        className={`fixed top-0 right-0 h-full w-80 bg-sibci-primary text-white shadow-2xl z-50 
          transform transition-transform duration-300 ease-in-out flex flex-col
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* CABECERA DEL MENÚ */}
        <div className="p-6 border-b border-blue-900/50 flex justify-between items-center bg-black/10 flex-shrink-0">
          <h2 className="text-xl font-bold tracking-widest text-white">MENÚ</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="text-white/70 hover:text-white transition-colors"
          >
            <FaTimes size={24} />
          </button>
        </div>

        {/* Contenedor scrollable para todo el contenido del menú */}
        <div className="flex-1 overflow-y-auto">
          {/* NAVEGACIÓN */}
          <nav className="py-6">
            <ul className="space-y-3">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <Link
                      to={item.path}
                      onClick={() => setIsOpen(false)}
                      className={`flex items-center gap-4 px-8 py-4 transition-all duration-300 relative overflow-hidden group ${isActive
                        ? 'bg-white/10 text-white'
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                        }`}
                    >
                      {isActive && (
                        <span className="absolute left-0 top-0 bottom-0 w-2 bg-sibci-accent shadow-[0_0_10px_rgba(250,204,21,0.5)]"></span>
                      )}
                      <span className={`text-2xl transition-transform duration-300 ${isActive ? 'text-sibci-secondary scale-110' : 'group-hover:text-sibci-secondary'}`}>
                        {item.icon}
                      </span>
                      <span className="font-medium tracking-wide">{item.label}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>

          {/* BOTÓN DE CAMBIO DE TEMA */}
          <div className="px-6 py-4">
            <button
              onClick={toggleTheme}
              className="w-full flex items-center justify-between px-6 py-4 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-300 group border border-white/20"
              aria-label="Cambiar tema"
            >
              <div className="flex items-center gap-3">
                <FaSun className={`text-xl transition-all duration-300 ${theme === 'light' ? 'text-yellow-400 scale-110' : 'text-gray-400'}`} />
                <span className="text-sm font-medium text-white">
                  {theme === 'light' ? 'Modo Claro' : 'Modo Oscuro'}
                </span>
                <FaMoon className={`text-xl transition-all duration-300 ${theme === 'dark' ? 'text-blue-300 scale-110' : 'text-gray-400'}`} />
              </div>
              <div className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${theme === 'dark' ? 'bg-blue-600' : 'bg-yellow-400'}`}>
                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform duration-300 ${theme === 'dark' ? 'translate-x-7' : 'translate-x-1'}`}></div>
              </div>
            </button>
          </div>

          {/* INFORMACIÓN DEL USUARIO */}
          <div className="p-6 border-t border-blue-900/50 bg-black/10">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                <FaUser className="text-white" />
              </div>
              <div className="flex-1">
                <p className="text-white font-semibold text-sm">{user?.nombre || user?.username}</p>
                <p className="text-blue-200 text-xs flex items-center gap-1">
                  {isAdmin() && <FaShieldAlt className="text-yellow-400" />}
                  {user?.rol === 'superadmin' ? 'Superadministrador' : user?.rol === 'admin' ? 'Administrador' : user?.rol === 'jefe' ? 'Jefe de Departamento' : 'Usuario'}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-2 px-4 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-200 rounded-lg transition-colors text-sm font-medium"
            >
              <FaSignOutAlt />
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* FOOTER DEL MENÚ */}
        <div className="p-6 text-xs text-blue-200 text-center border-t border-blue-900/50 bg-black/10 flex-shrink-0">
          <p className="font-semibold">SIBCI Guárico &copy; 2025</p>
          <p className="mt-1 opacity-70">Versión 1.0.2</p>
        </div>
      </aside>

      {/* --- CONTENIDO PRINCIPAL --- */}
      <main className="w-full p-8 min-h-screen transition-all duration-300">

        {/* HEADER CON LOGO */}
        <header className="mb-8 border-b border-gray-300 dark:border-gray-700 pb-6 flex items-center gap-6 relative overflow-hidden bg-gradient-to-r from-blue-50 to-yellow-50 dark:from-gray-800 dark:to-gray-800 p-6 rounded-2xl shadow-md transition-colors duration-300">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400/10 dark:bg-yellow-400/5 rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-blue-400/10 dark:bg-blue-400/5 rounded-full blur-3xl"></div>

          <div className="w-24 h-24 flex-shrink-0 relative z-10">
            <img
              src={logoSibci}
              alt="Logo SIBCI Guárico"
              className="w-full h-full object-contain drop-shadow-md"
            />
          </div>

          <div className="relative z-10 flex-1">
            <h1 className="text-4xl font-extrabold text-sibci-primary dark:text-blue-400 tracking-tight">
              SIBCI <span className="text-gray-600 dark:text-gray-400 font-light">Guárico</span>
            </h1>
            <p className="text-gray-500 dark:text-gray-400 font-medium mt-1">
              Sistema Integral de Gestión | San Juan de los Morros
            </p>
          </div>

          {/* Additional info badge */}
          <div className="hidden md:block relative z-10">
            <div className="px-4 py-2 bg-white/80 dark:bg-gray-700/80 backdrop-blur-sm rounded-lg shadow-sm border border-gray-200 dark:border-gray-600">
              <p className="text-xs text-gray-500 dark:text-gray-400 font-semibold">Estado</p>
              <p className="text-sm font-bold text-green-600 dark:text-green-400">Sistema Activo</p>
            </div>
          </div>
        </header>

        {/* CARTA DE CONTENIDO */}
        <div className="bg-white dark:bg-gray-800 p-8 rounded-xl shadow-lg min-h-[500px] border-t-4 border-blue-600 dark:border-blue-500 transition-colors duration-300">
          {children}
        </div>
      </main>

    </div>
  );
};

export default Layout;