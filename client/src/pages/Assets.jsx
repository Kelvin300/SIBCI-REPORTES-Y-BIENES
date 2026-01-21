import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FaEdit, FaTrashAlt, FaSave, FaTimes, FaLock } from 'react-icons/fa';
// Importamos el Modal
import SuccessModal from '../components/SuccessModal'; 
import { apiUrl } from '../config/api';

const Assets = () => {
  const { user } = useAuth();
  
  // Verificamos si es admin
  const userIsAdmin = user?.rol === 'admin';

  const [assets, setAssets] = useState([]);
  
  // ESTADO INICIAL FORMULARIO
  const [newAsset, setNewAsset] = useState({ id: '', titulo: '', condicion: '', estado: 'Operativo' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ id: '', titulo: '', condicion: '', estado: '' });

  // ESTADO PARA EL MODAL
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    isError: false
  });

  const closeModal = () => {
    setModalState({ ...modalState, isOpen: false });
  };

  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { 'Authorization': `Bearer ${token}` } };
  };

  const fetchAssets = async () => {
    try {
      const res = await axios.get(apiUrl('/api/assets'), getAuthHeaders());
      setAssets(res.data);
    } catch (error) {
      console.error("Error al obtener bienes:", error);
    }
  };

  useEffect(() => {
    // Solo buscamos datos si es admin
    if (userIsAdmin) {
        fetchAssets();
    }
  }, [userIsAdmin]); // Dependencia userIsAdmin

  // --- LOGICA DE AGREGAR, EDITAR, ELIMINAR (Igual que tenías) ---
  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      const assetParaEnviar = {
        codigo: newAsset.id,          
        id_manual: newAsset.id,
        nombre: newAsset.titulo,      
        titulo: newAsset.titulo,
        ubicacion: newAsset.condicion,     
        condicion: newAsset.condicion,
        estado: newAsset.estado
      };

      await axios.post(apiUrl('/api/assets'), assetParaEnviar, getAuthHeaders());
      
      setModalState({
        isOpen: true,
        title: '¡Bien Registrado!',
        message: 'El equipo ha sido añadido al inventario correctamente.',
        isError: false
      });

      setNewAsset({ id: '', titulo: '', condicion: '', estado: 'Operativo' });
      fetchAssets();
    } catch (error) {
      console.error(error);
      setModalState({
        isOpen: true,
        title: 'Error al Registrar',
        message: 'Verifique que el Código no esté repetido o falten datos.',
        isError: true
      });
    }
  };

  const handleEdit = (asset) => {
    setEditingId(asset.id); 
    setEditForm({
      id: asset.codigo || asset.id_manual || asset.id, 
      titulo: asset.titulo || asset.nombre, 
      condicion: asset.condicion || asset.ubicacion || '',
      estado: asset.estado || 'Operativo'
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ id: '', titulo: '', condicion: '', estado: '' });
  };

  const handleSaveEdit = async (id) => {
    try {
      const dataToUpdate = {
        codigo: editForm.id,
        nombre: editForm.titulo,
        titulo: editForm.titulo,
        ubicacion: editForm.condicion,
        condicion: editForm.condicion,
        estado: editForm.estado
      };

      await axios.put(apiUrl(`/api/assets/${id}`), dataToUpdate, getAuthHeaders());
      setEditingId(null);
      fetchAssets();
      
      setModalState({
        isOpen: true,
        title: 'Actualización Exitosa',
        message: 'Los datos del bien han sido actualizados.',
        isError: false
      });

    } catch (error) {
      console.error(error);
      setModalState({
        isOpen: true,
        title: 'Error al Actualizar',
        message: 'No se pudieron guardar los cambios.',
        isError: true
      });
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este bien?')) return;
    try {
      await axios.delete(apiUrl(`/api/assets/${id}`), getAuthHeaders());
      fetchAssets();
    } catch (error) {
      console.error(error);
      setModalState({
        isOpen: true,
        title: 'Error al Eliminar',
        message: 'No se pudo eliminar el registro.',
        isError: true
      });
    }
  };

  // --- 🔒 BLOQUEO DE SEGURIDAD VISUAL ---
  // Si el usuario no existe o NO es admin, mostramos pantalla de acceso denegado.
  if (!user || !userIsAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-96 bg-gray-50 rounded-2xl shadow-inner border border-gray-200 text-gray-500">
        <FaLock className="text-6xl mb-4 text-gray-300" />
        <h2 className="text-2xl font-bold text-gray-600">Acceso Restringido</h2>
        <p>Solo el administrador puede gestionar el Inventario de Bienes.</p>
      </div>
    );
  }

  // --- RENDERIZADO DEL ADMIN (Con el nuevo Diseño) ---
  return (
    <div className="space-y-6">
      
      {/* --- 1. HEADER / BANNER AZUL (Igual que Reportes y Gestión) --- */}
      <div className="bg-[#172554] rounded-2xl p-6 shadow-lg text-white flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        
        {/* Lado Izquierdo */}
        <div className="flex items-center gap-3">
           <div>
             <h2 className="text-2xl font-bold text-white tracking-tight">
              <span className="text-yellow-400 text-2xl leading-none">●</span> Inventario de Bienes Nacionales
             </h2>
             <p className="text-blue-200 text-sm mt-1 ml-5">
               Control y administración de equipos SIBCI
             </p>
           </div>
        </div>

        {/* Lado Derecho: Contador Dinámico */}
        <div>
          <span className="inline-block px-4 py-2 rounded-full border border-white/20 bg-white/10 text-sm text-gray-100 backdrop-blur-sm">
            Total Activos: {assets.length}
          </span>
        </div>
      </div>

      {/* --- 2. TARJETA DE REGISTRO (Ahora blanca y limpia) --- */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6">
          <h3 className="text-lg font-bold mb-4 text-gray-700 border-b pb-2">Registrar Nuevo Equipo</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <input 
                required 
                type="text" 
                placeholder="Código / ID Manual" 
                value={newAsset.id} 
                onChange={e => setNewAsset({...newAsset, id: e.target.value})} 
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e2538] focus:border-[#1e2538] outline-none font-mono text-sm" 
              />
              <input 
                required 
                type="text"
                placeholder="Título (Ej: Monitor)" 
                value={newAsset.titulo} 
                onChange={e => setNewAsset({...newAsset, titulo: e.target.value})} 
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e2538] focus:border-[#1e2538] outline-none" 
              />
              <input 
                required 
                type="text"
                placeholder="Condición (Ej: Bueno)" 
                value={newAsset.condicion} 
                onChange={e => setNewAsset({...newAsset, condicion: e.target.value})} 
                className="p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e2538] focus:border-[#1e2538] outline-none" 
              />
              <button type="submit" className="bg-green-600 text-white rounded-lg hover:bg-green-700 font-bold transition-colors shadow-sm">
                Agregar Equipo
              </button>
          </form>
      </div>

      {/* --- 3. TARJETA DE LA TABLA --- */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50 text-gray-700 text-sm uppercase tracking-wider border-b">
                        <th className="p-4 font-semibold">ID / Código</th>
                        <th className="p-4 font-semibold">Título</th>
                        <th className="p-4 font-semibold">Condición</th>
                        <th className="p-4 font-semibold">Estado</th>
                        <th className="p-4 font-semibold text-center">Acciones</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {assets.map(asset => (
                        <tr key={asset.id} className="hover:bg-gray-50 transition-colors">
                            {editingId === asset.id ? (
                                // MODO EDICIÓN
                                <>
                                    <td className="p-3"><input type="text" value={editForm.id} onChange={(e) => setEditForm({...editForm, id: e.target.value})} className="w-full p-2 border rounded bg-white text-sm font-mono"/></td>
                                    <td className="p-3"><input type="text" value={editForm.titulo} onChange={(e) => setEditForm({...editForm, titulo: e.target.value})} className="w-full p-2 border rounded text-sm"/></td>
                                    <td className="p-3"><input type="text" value={editForm.condicion} onChange={(e) => setEditForm({...editForm, condicion: e.target.value})} className="w-full p-2 border rounded text-sm"/></td>
                                    <td className="p-3">
                                        <select value={editForm.estado} onChange={(e) => setEditForm({...editForm, estado: e.target.value})} className="w-full p-2 border rounded text-sm">
                                            <option value="Operativo">Operativo</option>
                                            <option value="En Reparación">En Reparación</option>
                                            <option value="Fuera de Servicio">Fuera de Servicio</option>
                                        </select>
                                    </td>
                                    <td className="p-3">
                                        <div className="flex gap-2 justify-center">
                                            <button onClick={() => handleSaveEdit(asset.id)} className="p-2 bg-green-100 text-green-700 rounded hover:bg-green-200"><FaSave /></button>
                                            <button onClick={handleCancelEdit} className="p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"><FaTimes /></button>
                                        </div>
                                    </td>
                                </>
                            ) : (
                                // MODO VISUALIZACIÓN
                                <>
                                    <td className="p-4 font-mono font-bold text-[#1e2538] text-sm">
                                        {asset.codigo || asset.id_manual || asset.id}
                                    </td>
                                    <td className="p-4 font-medium text-gray-800">
                                        {asset.titulo || asset.nombre || '(Sin nombre)'}
                                    </td>
                                    <td className="p-4 text-sm text-gray-600">
                                        {asset.condicion || asset.ubicacion || '-'}
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 text-xs rounded-full font-semibold border ${
                                            asset.estado === 'Operativo' ? 'bg-green-50 text-green-700 border-green-200' : 
                                            asset.estado === 'En Reparación' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' : 'bg-red-50 text-red-700 border-red-200'
                                        }`}>
                                            {asset.estado}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex gap-3 justify-center">
                                            <button onClick={() => handleEdit(asset)} className="text-blue-600 hover:text-blue-800 transition-colors" title="Editar">
                                                <FaEdit size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(asset.id)} className="text-red-500 hover:text-red-700 transition-colors" title="Eliminar">
                                                <FaTrashAlt size={18} />
                                            </button>
                                        </div>
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
            {assets.length === 0 && (
                <div className="text-center p-12 text-gray-400">
                    <p>No hay bienes registrados en el inventario.</p>
                </div>
            )}
        </div>
      </div>

      {/* --- MODAL --- */}
      <SuccessModal 
        isOpen={modalState.isOpen}
        title={modalState.title}
        message={modalState.message}
        isError={modalState.isError}
        onClose={closeModal}
      />
    </div>
  );
};

export default Assets;