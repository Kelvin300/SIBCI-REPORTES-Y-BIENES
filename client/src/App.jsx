import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Reports from './pages/Reports';
import Assets from './pages/Assets';
import ListaReportes from './pages/ListaReportes';
import Users from './pages/Users';
import Login from './pages/Login';
import { useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext'; 
import { Link } from 'react-router-dom';
import { FaLaptopMedical, FaBoxes, FaClipboardList, FaUsers, FaCheckDouble } from 'react-icons/fa';

// --- COMPONENTE HOME (DISEÑO CORPORATIVO SIBCI) ---
const Home = () => {
  // Estadísticas (KPIs)
  const stats = [
    { label: 'Bienes Totales', val: '142', icon: <FaBoxes />, color: 'bg-blue-500 shadow-blue-500/40' },
    { label: 'Reportes Hoy', val: '5', icon: <FaLaptopMedical />, color: 'bg-red-500 shadow-red-500/40' },
    { label: 'Usuarios', val: '8', icon: <FaUsers />, color: 'bg-purple-500 shadow-purple-500/40' },
    { label: 'Efectividad', val: '92%', icon: <FaCheckDouble />, color: 'bg-green-500 shadow-green-500/40' },
  ];

  return (
    <div className="flex flex-col h-full animate-fade-in gap-8 pb-8">
      
      {/* 1. HEADER DE BIENVENIDA - (Color Azul del Menú) */}
      <div className="relative overflow-hidden bg-[#172554] p-8 rounded-3xl shadow-xl flex flex-col md:flex-row justify-between items-center transition-all duration-300">
        
        {/* Decoración de fondo sutil */}
        <div className="absolute top-0 right-0 -mr-10 -mt-10 w-48 h-48 bg-white opacity-5 rounded-full blur-3xl"></div>
        
        <div className="relative z-10">
          <h1 className="text-3xl font-extrabold text-white mb-2 tracking-wide">
            Panel de Control <span className="text-blue-400">SIBCI</span>
          </h1>
          <p className="text-blue-200/80 text-lg">
            Sistema Integral de Gestión | San Juan de los Morros
          </p>
        </div>
        
        <div className="relative z-10 mt-4 md:mt-0">
           {/* Fecha con estilo vidrio */}
           <span className="px-5 py-2 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-full text-sm font-semibold shadow-sm">
             {new Date().toLocaleDateString('es-VE', { weekday: 'long', day: 'numeric', month: 'long' })}
           </span>
        </div>
      </div>

      {/* 3. TARJETAS DE ACCESO (Estilo Corporativo) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* TARJETA 1 */}
        <Link 
          to="/reportes" 
          className="group relative bg-white dark:bg-[#172554] p-8 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border-t-4 border-blue-400 hover:-translate-y-2 cursor-pointer flex flex-col items-center text-center dark:border-blue-500"
        >
          <div className="w-20 h-20 bg-blue-50 dark:bg-white/10 text-[#172554] dark:text-blue-400 rounded-full flex items-center justify-center mb-6 text-4xl group-hover:bg-[#172554] group-hover:text-white dark:group-hover:bg-blue-400 dark:group-hover:text-[#172554] transition-colors duration-300">
            <FaLaptopMedical />
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-[#172554] dark:group-hover:text-blue-400 transition-colors">
            Reportar Falla
          </h3>
          <p className="text-sm text-gray-500 dark:text-blue-200/70 mt-3 leading-relaxed">
            Registra incidencias técnicas y problemas de equipos.
          </p>
        </Link>

        {/* TARJETA 2 */}
        <Link 
          to="/bienes" 
          className="group relative bg-white dark:bg-[#172554] p-8 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border-t-4 border-blue-400 hover:-translate-y-2 cursor-pointer flex flex-col items-center text-center dark:border-blue-500"
        >
          <div className="w-20 h-20 bg-blue-50 dark:bg-white/10 text-[#172554] dark:text-blue-400 rounded-full flex items-center justify-center mb-6 text-4xl group-hover:bg-[#172554] group-hover:text-white dark:group-hover:bg-blue-400 dark:group-hover:text-[#172554] transition-colors duration-300">
            <FaBoxes />
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-[#172554] dark:group-hover:text-blue-400 transition-colors">
            Control de Bienes
          </h3>
          <p className="text-sm text-gray-500 dark:text-blue-200/70 mt-3 leading-relaxed">
            Administra el inventario, asignaciones y ubicación.
          </p>
        </Link>

        {/* TARJETA 3 */}
        <Link 
          to="/gestion" 
          className="group relative bg-white dark:bg-[#172554] p-8 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border-t-4 border-blue-400 hover:-translate-y-2 cursor-pointer flex flex-col items-center text-center dark:border-blue-500"
        >
          <div className="w-20 h-20 bg-blue-50 dark:bg-white/10 text-[#172554] dark:text-blue-400 rounded-full flex items-center justify-center mb-6 text-4xl group-hover:bg-[#172554] group-hover:text-white dark:group-hover:bg-blue-400 dark:group-hover:text-[#172554] transition-colors duration-300">
            <FaClipboardList />
          </div>
          <h3 className="text-xl font-bold text-gray-800 dark:text-white group-hover:text-[#172554] dark:group-hover:text-blue-400 transition-colors">
            Gestión de Reportes
          </h3>
          <p className="text-sm text-gray-500 dark:text-blue-200/70 mt-3 leading-relaxed">
            Historial completo. Editar, eliminar y filtrar reportes.
          </p>
        </Link>

      </div>
    </div>
  );
};

// Componente para proteger rutas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#172554] mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Cargando sistema...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
    <ThemeProvider> 
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/reportes" element={<Reports />} />
                    <Route path="/bienes" element={<Assets />} />
                    <Route path="/gestion" element={<ListaReportes />} />
                    <Route path="/users" element={<Users />} />
                  </Routes>
                </Layout>
              </ProtectedRoute>
            }
          />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;