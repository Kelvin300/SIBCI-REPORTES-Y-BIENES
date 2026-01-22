import React, { useState, useEffect } from 'react';
import { FaSearch, FaTrashAlt, FaLaptopMedical, FaBoxes, FaCheckCircle, FaClock, FaExclamationTriangle } from 'react-icons/fa';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../config/api';

const ListaReportes = () => {
  const { user } = useAuth();
  const userIsAdmin = user?.rol === 'admin';
  
  const [activeTab, setActiveTab] = useState('fallas'); 
  const [searchTerm, setSearchTerm] = useState('');
  
  // Inicializamos siempre como arrays vacíos
  const [listaReportes, setListaReportes] = useState([]);
  const [listaBienes, setListaBienes] = useState([]);
  const [loading, setLoading] = useState(true);

  // --- Departments management (admin) ---
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [deptForm, setDeptForm] = useState({ name: '', encargado: '' });
  const [editingDept, setEditingDept] = useState(false);

  // --- FETCH DATOS ---
  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      
      const resReportes = await fetch(apiUrl('/api/reports'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataReportes = await resReportes.json();
      
      // BLINDAJE 1: Verificamos si es un Array antes de guardar
      if (Array.isArray(dataReportes)) {
        setListaReportes(dataReportes);
      } else {
        setListaReportes([]);
      }

      const resBienes = await fetch(apiUrl('/api/assets'), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const dataBienes = await resBienes.json();
      
      // BLINDAJE 2: Verificamos si es un Array antes de guardar
      if (Array.isArray(dataBienes)) {
        setListaBienes(dataBienes);
      } else {
        console.error("El servidor no devolvió una lista de bienes:", dataBienes);
        setListaBienes([]);
      }

    } catch (error) {
      console.error("Error cargando datos:", error);
      // En caso de error, aseguramos que no quede undefined
      setListaReportes([]);
      setListaBienes([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const fetchDepartments = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl('/api/departments'), { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setDepartmentsList(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Error cargando departamentos:', err);
    }
  };

  const openDeptModal = async () => {
    await fetchDepartments();
    setShowDeptModal(true);
    setDeptForm({ name: '', encargado: '' });
    setEditingDept(false);
  };

  const handleDeptFormChange = (e) => setDeptForm({ ...deptForm, [e.target.name]: e.target.value });

  const handleDeptSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl('/api/departments'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(deptForm)
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error guardando departamento');
      }
      await fetchDepartments();
      setDeptForm({ name: '', encargado: '' });
      setEditingDept(false);
    } catch (err) {
      alert('Error: ' + (err.message || err));
    }
  };

  const handleDeptEdit = (dept) => {
    setDeptForm({ name: dept.name, encargado: dept.encargado });
    setEditingDept(true);
    setShowDeptModal(true);
  };

  const handleDeptDelete = async (name) => {
    if (!confirm(`Eliminar departamento '${name}'?`)) return;
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/api/departments/${encodeURIComponent(name)}`), {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Error eliminando departamento');
      }
      await fetchDepartments();
    } catch (err) {
      alert('Error: ' + (err.message || err));
    }
  };

  // --- ELIMINAR ---
  const handleDelete = async (id, tipo) => {
    if (!userIsAdmin) {
      alert('No tienes permisos para eliminar registros');
      return;
    }
    
    if(!confirm("¿Estás seguro de eliminar este registro permanentemente?")) return;

    try {
        const endpoint = tipo === 'fallas' 
            ? apiUrl(`/api/reports/${id}`)
            : apiUrl(`/api/assets/${id}`);
            
        await fetch(endpoint, { 
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });
        fetchData(); 
    } catch (error) {
        console.error("Error eliminando:", error);
        alert('Error al eliminar el registro');
    }
  };

  // --- CAMBIAR ESTADO ---
  const toggleEstado = async (id, estadoActual) => {
    if (!userIsAdmin) {
      alert('Solo los administradores pueden cambiar el estado de los reportes');
      return;
    }
    
    const nuevoEstado = estadoActual === 'Pendiente' ? 'Resuelto' : 'Pendiente';
    try {
        await fetch(apiUrl(`/api/reports/${id}`), {
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

  // Descargar PDF de reporte (incluye token de autorización)
  const handleDownloadPDF = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(apiUrl(`/api/reports/${id}/pdf`), {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || 'Error descargando PDF');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `reporte-${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error descargando PDF:', err);
      alert('No se pudo descargar el PDF');
    }
  };

  // Filtrado Seguro
  const dataActual = activeTab === 'fallas' ? listaReportes : listaBienes;
  
  // BLINDAJE 3: Evitar crash si dataActual es null/undefined
  const safeData = Array.isArray(dataActual) ? dataActual : [];
  
  const filteredData = safeData.filter(item => 
    Object.values(item).some(val => 
      String(val || '').toLowerCase().includes(searchTerm.toLowerCase())
    )
  );

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('es-VE');
  };

  return (
    <div className="flex flex-col h-full gap-6 animate-fade-in pb-8">
      
      {/* HEADER CORPORATIVO */}
      <div className="bg-[#172554] p-8 rounded-3xl shadow-lg border border-blue-900 flex flex-col md:flex-row justify-between items-center">
         <div>
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <span className="text-yellow-400 text-3xl">●</span> Gestión de Registros
            </h2>
            <p className="text-blue-200 text-sm mt-1 ml-8">Base de datos unificada SIBCI Guárico</p>
         </div>
         <div className="mt-4 md:mt-0 bg-white/10 backdrop-blur-md px-4 py-2 rounded-full border border-white/20">
            <span className="text-white text-sm font-medium">
              Total Registros: {filteredData.length}
            </span>
         </div>
         {userIsAdmin && (
           <div className="ml-4">
             <button onClick={openDeptModal} className="bg-white text-sm px-3 py-2 rounded-md text-[#172554] font-semibold">Gestionar Departamentos</button>
           </div>
         )}
      </div>

      {/* Modal / Gestión de Departamentos (Admin) */}
      {showDeptModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl p-6 w-full max-w-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Gestionar Departamentos</h3>
              <div className="flex items-center gap-2">
                <button onClick={() => { setShowDeptModal(false); setEditingDept(false); setDeptForm({ name:'', encargado:'' }); }} className="text-sm text-gray-500">Cerrar</button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-semibold mb-1">Nombre</label>
                <input name="name" value={deptForm.name} onChange={handleDeptFormChange} className="w-full p-2 border rounded" />
              </div>
              <div>
                <label className="block text-sm font-semibold mb-1">Encargado</label>
                <input name="encargado" value={deptForm.encargado} onChange={handleDeptFormChange} className="w-full p-2 border rounded" />
              </div>
            </div>
            <div className="flex gap-2 mb-4">
              <button onClick={handleDeptSubmit} className="bg-[#172554] text-white px-4 py-2 rounded">{editingDept ? 'Actualizar' : 'Crear'}</button>
              <button onClick={() => { setDeptForm({ name:'', encargado:''}); setEditingDept(false); }} className="px-4 py-2 rounded border">Limpiar</button>
            </div>

            <div>
              <h4 className="font-semibold mb-2">Departamentos existentes</h4>
              <div className="space-y-2 max-h-64 overflow-auto">
                {departmentsList.length === 0 ? (
                  <p className="text-sm text-gray-500">No hay departamentos registrados.</p>
                ) : (
                  departmentsList.map(d => (
                    <div key={d.name} className="flex justify-between items-center p-2 border rounded">
                      <div>
                        <div className="font-semibold">{d.name}</div>
                        <div className="text-sm text-gray-600">Encargado: {d.encargado}</div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleDeptEdit(d)} className="text-sm px-3 py-1 rounded border">Editar</button>
                        <button onClick={() => handleDeptDelete(d.name)} className="text-sm px-3 py-1 rounded bg-red-50 text-red-600">Eliminar</button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* CONTROLES Y TABS */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        
        {/* TABS */}
        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-xl">
          <button
            onClick={() => setActiveTab('fallas')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
              activeTab === 'fallas' 
              ? 'bg-white dark:bg-[#172554] text-blue-600 dark:text-white shadow-md' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <FaLaptopMedical /> Reportes
          </button>
          <button
            onClick={() => setActiveTab('bienes')}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-sm transition-all ${
              activeTab === 'bienes' 
              ? 'bg-white dark:bg-[#172554] text-blue-600 dark:text-white shadow-md' 
              : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200'
            }`}
          >
            <FaBoxes /> Inventario
          </button>
        </div>

        {/* BUSCADOR */}
        <div className="relative w-full md:w-auto min-w-[300px]">
            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 dark:text-white transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
        </div>
      </div>

      {/* TABLA */}
      <div className="overflow-hidden bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 min-h-[400px]">
        {loading ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-500 dark:text-gray-400">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600 mb-4"></div>
                <p>Cargando datos...</p>
            </div>
        ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase tracking-wider border-b border-gray-100 dark:border-gray-700">
                    {activeTab === 'fallas' ? (
                        <>
                    <th className="p-5 font-semibold">Solicitante</th>
                    <th className="p-5 font-semibold">Departamento</th>
                    <th className="p-5 font-semibold">Encargado</th>
                        <th className="p-5 font-semibold">Falla</th>
                        <th className="p-5 font-semibold">Fecha</th>
                        <th className="p-5 font-semibold">Estado</th>
                        </>
                    ) : (
                        <>
                        <th className="p-5 font-semibold">ID / Código</th>
                        <th className="p-5 font-semibold">Título</th>
                        <th className="p-5 font-semibold">Condición</th>
                        <th className="p-5 font-semibold">Fecha Registro</th>
                        </>
                    )}
                    <th className="p-5 text-center font-semibold">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-700 text-sm text-gray-700 dark:text-gray-300">
                    {filteredData.length > 0 ? (
                    filteredData.map((item) => (
                        <tr key={item.id} className="hover:bg-blue-50/50 dark:hover:bg-blue-900/20 transition-colors">
                        
                        {activeTab === 'fallas' ? (
                            <>
                                <td className="p-5 font-bold text-gray-900 dark:text-white">{item.solicitante}</td>
                                <td className="p-5">{item.departamento}</td>
                                <td className="p-5">{item.encargado || '-'}</td>
                                <td className="p-5">
                                    <span className="block font-semibold text-blue-600 dark:text-blue-400">{item.tipo_falla}</span>
                                    <span className="text-xs text-gray-500 dark:text-gray-500 truncate max-w-[200px] block" title={item.descripcion}>
                                        {item.descripcion}
                                    </span>
                                </td>
                                <td className="p-5">{formatDate(item.createdAt)}</td>
                                <td className="p-5">
                                    {userIsAdmin ? (
                                      <button 
                                          onClick={() => toggleEstado(item.id, item.estado)}
                                          className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold cursor-pointer transition-all hover:scale-105 ${
                                          item.estado === 'Resuelto' 
                                              ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                              : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                      }`}>
                                          {item.estado === 'Resuelto' ? <FaCheckCircle/> : <FaClock/>}
                                          {item.estado}
                                      </button>
                                    ) : (
                                      <span className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold ${
                                        item.estado === 'Resuelto' 
                                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                      }`}>
                                        {item.estado === 'Resuelto' ? <FaCheckCircle/> : <FaClock/>}
                                        {item.estado}
                                      </span>
                                    )}
                                </td>
                            </>
                        ) : (
                            // BIENES (CORREGIDO PARA EVITAR PANTALLA BLANCA)
                            <>
                                <td className="p-5 font-mono text-xs text-gray-500 dark:text-gray-400">
                                    <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded border dark:border-gray-600">
                                      {item.codigo || item.id_manual || item.id}
                                    </span>
                                </td>
                                <td className="p-5 font-bold text-gray-900 dark:text-white">
                                    {item.titulo || item.nombre || <span className="text-red-400 italic">Sin Título</span>}
                                </td>
                                <td className="p-5">
                                    <span className="bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wide">
                                        {item.condicion || item.ubicacion || '-'}
                                    </span>
                                </td>
                                <td className="p-5 text-gray-500">{formatDate(item.createdAt)}</td>
                            </>
                        )}
                        
                        <td className="p-5 text-center flex items-center justify-center gap-2">
                            {activeTab === 'fallas' && (
                              <button
                                onClick={() => handleDownloadPDF(item.id)}
                                className="p-2.5 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg transition-all shadow-sm"
                                title="Descargar PDF"
                              >
                                PDF
                              </button>
                            )}
                            {userIsAdmin ? (
                              <button 
                                  onClick={() => handleDelete(item.id, activeTab)} 
                                  className="p-2.5 bg-red-50 hover:bg-red-100 text-red-600 dark:bg-red-900/20 dark:hover:bg-red-900/40 dark:text-red-400 rounded-lg transition-all hover:scale-110 shadow-sm"
                                  title="Eliminar registro"
                              >
                                  <FaTrashAlt size={16} />
                              </button>
                            ) : (
                              <span className="text-gray-300 dark:text-gray-600 text-xs select-none">Solo lectura</span>
                            )}
                        </td>
                        </tr>
                    ))
                    ) : (
                        <tr>
                          <td colSpan="6" className="p-12 text-center">
                             <div className="flex flex-col items-center justify-center text-gray-400 dark:text-gray-500">
                                <FaExclamationTriangle className="text-4xl mb-3 opacity-20" />
                                <p>No se encontraron registros</p>
                             </div>
                          </td>
                        </tr>
                    )}
                </tbody>
              </table>
            </div>
        )}
      </div>
    </div>
  );
};

export default ListaReportes;