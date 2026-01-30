import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { FaLaptopMedical, FaBoxes, FaHome, FaBars, FaTimes, FaClipboardList, FaUser, FaSignOutAlt, FaShieldAlt, FaUsers } from 'react-icons/fa'; 
import { useAuth } from '../context/AuthContext';
// 1. IMPORTAMOS LA IMAGEN
import logoSibci from '../assets/logo-sibci.png'; 

const Layout = ({ children }) => {
  const [isOpen, setIsOpen] = useState(false); // Estado para controlar el menú
  const location = useLocation();
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const menuItems = [
    { path: '/', label: 'Inicio', icon: <FaHome/> },
    { path: '/reportes', label: 'Reporte de Fallas', icon: <FaLaptopMedical /> },
    { path: '/bienes', label: 'Control de Bienes', icon: <FaBoxes /> },
    { path: '/gestion', label: 'Gestión de Reportes', icon: <FaClipboardList /> }
  ];

  // Mostrar Gestión de Usuarios solo para admin/superadmin
  if (isAdmin()) {
    menuItems.push({ path: '/users', label: 'Usuarios', icon: <FaUsers /> });
  }

  return (
    // 'relative' es necesario para posicionar elementos absolutos/fijos dentro si fuera necesario, 
    // pero para el drawer usamos fixed respecto a la ventana.
    <div className="min-h-screen font-sans text-gray-800 bg-gray-100 relative overflow-x-hidden">
      
      {/* --- BOTÓN HAMBURGUESA (ABRIR) --- */}
      {/* Solo se muestra si el menú está cerrado para no superponerse con el botón de cerrar interno */}
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
      {/* Se muestra solo cuando isOpen es true. Al hacer clic, cierra el menú. */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        }`}
        onClick={() => setIsOpen(false)}
      />

      {/* --- MENÚ LATERAL DESPLEGABLE (DERECHA) --- */}
      <aside 
        className={`fixed top-0 right-0 h-full w-80 bg-sibci-primary text-white shadow-2xl z-50 
          transform transition-transform duration-300 ease-in-out 
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* CABECERA DEL MENÚ */}
        <div className="p-6 border-b border-blue-900/50 flex justify-between items-center bg-black/10">
            <h2 className="text-xl font-bold tracking-widest text-white">MENÚ</h2>
            <button 
              onClick={() => setIsOpen(false)}
              className="text-white/70 hover:text-white transition-colors"
            >
              <FaTimes size={24} />
            </button>
        </div>
        
        {/* NAVEGACIÓN */}
        <nav className="flex-1 py-6 overflow-y-auto">
          <ul className="space-y-3">
            {menuItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    onClick={() => setIsOpen(false)} // Cierra el menú al seleccionar una opción
                    className={`flex items-center gap-4 px-8 py-4 transition-all duration-300 relative overflow-hidden group ${
                      isActive 
                        ? 'bg-white/10 text-white' 
                        : 'text-gray-300 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    {/* Línea indicadora activa */}
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

        {/* FOOTER DEL MENÚ */}
        <div className="p-6 text-xs text-blue-200 text-center border-t border-blue-900/50 bg-black/10">
          <p className="font-semibold">SIBCI Guárico &copy; 2025</p>
          <p className="mt-1 opacity-70">Versión 1.0.2</p>
        </div>
      </aside>

      {/* --- CONTENIDO PRINCIPAL --- */}
      {/* Ya no usa flex-1 porque el sidebar no ocupa espacio en el flujo normal */}
      <main className="w-full p-8 min-h-screen transition-all duration-300">
        
        {/* HEADER CON LOGO */}
        <header className="mb-8 border-b border-gray-300 pb-6 flex items-center gap-6">
          <div className="w-24 h-24 flex-shrink-0">
            <img 
              src={logoSibci} 
              alt="Logo SIBCI Guárico" 
              className="w-full h-full object-contain drop-shadow-sm" 
            />
          </div>
          
          <div>
            <h1 className="text-4xl font-extrabold text-sibci-primary tracking-tight">
              SIBCI <span className="text-gray-600 font-light">Guárico</span>
            </h1>
            <p className="text-gray-500 font-medium mt-1">
              Sistema Integral de Gestión | San Juan de los Morros
            </p>
          </div>
        </header>

        {/* CARTA DE CONTENIDO */}
        <div className="bg-white p-8 rounded-xl shadow-lg min-h-[500px] border-t-4 border-blue-600">
            {children}
        </div>
      </main>

    </div>
  );
};

export default Layout;