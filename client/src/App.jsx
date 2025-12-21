import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Reports from './pages/Reports';
import Assets from './pages/Assets';
import ListaReportes from './pages/ListaReportes';
import Login from './pages/Login';
import { useAuth } from './context/AuthContext';
import { Link } from 'react-router-dom';
import { FaLaptopMedical, FaBoxes, FaClipboardList } from 'react-icons/fa';


const Home = () => (
  <div className="flex flex-col items-center justify-center h-full mt-10">
  
   {/* Texto de bienvenida */}
   <div className="text-center mb-12">
    <h1 className="text-4xl font-bold text-gray-800 mb-2">Bienvenido al Sistema SIBCI Guárico</h1>
    <p className="text-gray-500 text-lg">Sistema Integral de Gestión | San Juan de los Morros</p>
  </div>

  {/* Contenedor de Acciones Rápidas */}
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-4">
    
    {/* --- TARJETA 1: REPORTE DE FALLAS --- */}
        <Link 
          to="/reportes" 
          className="group relative bg-white p-6 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border-t-4 border-blue-600 hover:-translate-y-1 cursor-pointer flex flex-col items-center text-center"
        >
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 text-3xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
            <FaLaptopMedical />
          </div>
          <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-700 transition-colors">
            Reportar Falla
          </h3>
          <p className="text-sm text-gray-500 mt-2">
            Registra incidencias técnicas y problemas de equipos.
          </p>
        </Link>


    {/* --- TARJETA 2: CONTROL DE BIENES --- */}
        <Link 
          to="/bienes" 
          className="group relative bg-white p-6 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border-t-4 border-blue-600 hover:-translate-y-1 cursor-pointer flex flex-col items-center text-center"
        >
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 text-3xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
            <FaBoxes />
          </div>
          <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-700 transition-colors">
            Control de Bienes
          </h3>
          <p className="text-sm text-gray-500 mt-2">
            Administra el inventario, asignaciones y ubicación.
          </p>
        </Link>

    {/* --- TARJETA 3: GESTIÓN DE REPORTES (NUEVA) --- */}
        <Link 
          to="/gestion" 
          className="group relative bg-white p-6 rounded-2xl shadow-md hover:shadow-2xl transition-all duration-300 border-t-4 border-blue-600 hover:-translate-y-1 cursor-pointer flex flex-col items-center text-center"
        >
          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mb-4 text-3xl group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
            <FaClipboardList />
          </div>
          <h3 className="text-xl font-bold text-gray-800 group-hover:text-blue-700 transition-colors">
            Gestión de Reportes
          </h3>
          <p className="text-sm text-gray-500 mt-2">
            Historial completo. Editar, eliminar y filtrar reportes por fecha.
          </p>
        </Link>

  </div>
  
  {/* Fondo sutil */}
  <div className="absolute top-0 left-0 w-full h-full -z-10 bg-gradient-to-br from-white via-blue-50 to-white"></div>
  </div>
);

// Componente para proteger rutas
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando...</p>
        </div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

function App() {
  return (
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
                </Routes>
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;