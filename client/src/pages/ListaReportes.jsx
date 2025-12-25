import React, { useState, useEffect } from 'react';
import { FaSearch, FaEdit, FaTrashAlt, FaLaptopMedical, FaBoxes, FaCheckCircle, FaClock } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';

const ListaReportes = () => {
  const { isAdmin, user } = useAuth();
  
  // Verificar si es admin (usando directamente el rol del usuario)
  const userIsAdmin = user?.rol === 'admin';
  
  // Debug: Verificar que isAdmin funciona
  useEffect(() => {
    console.log('Usuario actual:', user);
    console.log('Rol del usuario:', user?.rol);
    console.log('¿Es admin? (isAdmin()):', isAdmin());
    console.log('¿Es admin? (userIsAdmin):', userIsAdmin);
  }, [user, isAdmin, userIsAdmin]);
  const [activeTab, setActiveTab] = useState('fallas'); // 'fallas' (Reports) o 'bienes' (Assets)
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para los datos
  const [listaReportes, setListaReportes] = useState([]);
  const [listaBienes, setListaBienes] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- FUNCIÓN PARA OBTENER DATOS (FETCH) ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      // Nota: Usamos el puerto 3001 según tu backend
      const resReportes = await fetch('http://localhost:3001/api/reports', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const dataReportes = await resReportes.json();
      setListaReportes(dataReportes || []);

      const resBienes = await fetch('http://localhost:3001/api/assets', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const dataBienes = await resBienes.json();
      setListaBienes(dataBienes || []);

    } catch (error) {
      console.error("Error cargando datos:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // --- FUNCIÓN PARA ELIMINAR (Solo admin) ---
  const handleDelete = async (id, tipo) => {
    if (!userIsAdmin) {
      alert('No tienes permisos para eliminar registros');
      return;
    }
    
    if(!confirm("¿Estás seguro de eliminar este registro permanentemente?")) return;

    try {
        const endpoint = tipo === 'fallas' 
            ? `http://localhost:3001/api/reports/${id}` 
            : `http://localhost:3001/api/assets/${id}`;
            
        await fetch(endpoint, { 
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        fetchData(); // Recargar la tabla
    } catch (error) {
        console.error("Error eliminando:", error);
        alert('Error al eliminar el registro');
    }
  };

  // --- FUNCIÓN PARA CAMBIAR ESTADO (Solo admin, solo reportes) ---
  const toggleEstado = async (id, estadoActual) => {
    if (!userIsAdmin) {
      alert('Solo los administradores pueden cambiar el estado de los reportes');
      return;
    }
    
    const nuevoEstado = estadoActual === 'Pendiente' ? 'Resuelto' : 'Pendiente';
    try {
        await fetch(`http://localhost:3001/api/reports/${id}`, {
            method: 'PUT',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ estado: nuevoEstado })
        });
        fetchData();
    } catch (error) {
        console.error("Error actualizando:", error);
        alert('Error al actualizar el estado');
    }
  };

  // Filtrado
  const dataActual = activeTab === 'fallas' ? listaReportes : listaBienes;
  const filteredData = dataActual.filter(item => 
    Object.values(item).some(val => 
      String(val).toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  // Formatear Fecha
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-VE');
  };

  return (
    <div className="flex flex-col h-full gap-6">
      
      {/* HEADER */}
      <div>
          <h2 className="text-2xl font-bold text-gray-700 mb-6 flex items-center gap-2">
        <span className="text-sibci-accent">●</span> Gestión de Reportes y Bienes
      </h2>
          <p className="text-gray-500 text-sm">Base de datos SIBCI Guárico</p>
      </div>

      {/* TABS */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('fallas')}
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-all relative ${
            activeTab === 'fallas' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500'
          }`}
        >
          <FaLaptopMedical /> Reportes Técnicos
        </button>
        <button
          onClick={() => setActiveTab('bienes')}
          className={`flex items-center gap-2 px-6 py-3 font-medium text-sm transition-all relative ${
            activeTab === 'bienes' ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50/50' : 'text-gray-500'
          }`}
        >
          <FaBoxes /> Inventario de Bienes
        </button>
      </div>

      {/* BUSCADOR */}
      <div className="relative">
          <FaSearch className="absolute left-3 top-3 text-gray-400" />
          <input 
            type="text" 
            placeholder="Buscar..." 
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
      </div>

      {/* TABLA */}
      <div className="overflow-x-auto bg-white rounded-lg shadow border border-gray-200 min-h-[300px]">
        {loading ? (
            <div className="p-8 text-center text-gray-500">Cargando datos...</div>
        ) : (
            <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-gray-100 text-gray-600 text-sm uppercase">
                {activeTab === 'fallas' ? (
                    <>
                    <th className="p-4">Solicitante</th>
                    <th className="p-4">Departamento</th>
                    <th className="p-4">Falla</th>
                    <th className="p-4">Fecha</th>
                    <th className="p-4">Estado</th>
                    </>
                ) : (
                    <>
                    <th className="p-4">Bienes</th>
                    <th className="p-4">Código</th>
                    <th className="p-4">Ubicación</th>
                    <th className="p-4">Fecha</th>
                    </>
                )}
                <th className="p-4 text-center">Acciones</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-700">
                {filteredData.length > 0 ? (
                filteredData.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                    
                    {/* COLUMNAS VARIABLES */}
                    {activeTab === 'fallas' ? (
                        <>
                            <td className="p-4 font-medium">{item.solicitante}</td>
                            <td className="p-4">{item.departamento}</td>
                            <td className="p-4">
                                <span className="block font-semibold text-gray-800">{item.tipo_falla}</span>
                                <span className="text-xs text-gray-500 truncate max-w-[200px] block" title={item.descripcion}>
                                    {item.descripcion}
                                </span>
                            </td>
                            <td className="p-4">{formatDate(item.createdAt)}</td>
                            <td className="p-4">
                                {userIsAdmin ? (
                                  <button 
                                      onClick={() => toggleEstado(item.id, item.estado)}
                                      className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition hover:opacity-80 hover:scale-105 ${
                                      item.estado === 'Resuelto' 
                                          ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                                          : 'bg-red-100 text-red-700 hover:bg-red-200'
                                  }`}>
                                      {item.estado === 'Resuelto' ? <FaCheckCircle/> : <FaClock/>}
                                      {item.estado}
                                  </button>
                                ) : (
                                  <span className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${
                                    item.estado === 'Resuelto' 
                                        ? 'bg-green-100 text-green-700' 
                                        : 'bg-red-100 text-red-700'
                                  }`}>
                                    {item.estado === 'Resuelto' ? <FaCheckCircle/> : <FaClock/>}
                                    {item.estado}
                                  </span>
                                )}
                            </td>
                        </>
                    ) : (
                        <>
                            <td className="p-4 font-medium">{item.nombre}</td>
                            <td className="p-4"><span className="bg-gray-100 px-2 py-1 rounded font-mono text-xs">{item.codigo}</span></td>
                            <td className="p-4">{item.ubicacion}</td>
                            <td className="p-4">{formatDate(item.createdAt)}</td>
                        </>
                    )}
                    
                    {/* ACCIONES - Solo visible para administradores */}
                    <td className="p-4 text-center flex justify-center gap-2">
                        {userIsAdmin ? (
                          <button 
                              onClick={() => handleDelete(item.id, activeTab)} 
                              className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition hover:scale-110"
                              title="Eliminar registro"
                          >
                              <FaTrashAlt size={18} />
                          </button>
                        ) : (
                          <span className="text-gray-400 text-sm">Solo lectura</span>
                        )}
                    </td>
                    </tr>
                ))
                ) : (
                    <tr><td colSpan="6" className="p-8 text-center text-gray-400">No hay datos registrados.</td></tr>
                )}
            </tbody>
            </table>
        )}
      </div>
    </div>
  );
};

export default ListaReportes;