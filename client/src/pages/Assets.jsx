import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FaEdit, FaTrashAlt, FaSave, FaTimes } from 'react-icons/fa';
// Importamos el Modal (Asegúrate que la ruta sea correcta)
import SuccessModal from '../components/SuccessModal'; 

const Assets = () => {
  const { user } = useAuth();
  const userIsAdmin = user?.rol === 'admin';
  
  // Debug
  useEffect(() => {
    console.log('Assets - Usuario:', user);
  }, [user]);

  const [assets, setAssets] = useState([]);
  
  // ESTADO INICIAL
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

  // Función para cerrar modal
  const closeModal = () => {
    setModalState({ ...modalState, isOpen: false });
  };

  // --- OBTENER TOKEN ---
  const getAuthHeaders = () => {
    const token = localStorage.getItem('token');
    return { headers: { 'Authorization': `Bearer ${token}` } };
  };

  // --- FETCH DATOS ---
  const fetchAssets = async () => {
    try {
      const res = await axios.get('http://localhost:3001/api/assets', getAuthHeaders());
      setAssets(res.data);
    } catch (error) {
      console.error("Error al obtener bienes:", error);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  // --- AGREGAR (ADD) ---
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

      await axios.post('http://localhost:3001/api/assets', assetParaEnviar, getAuthHeaders());
      
      // ÉXITO
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
      // ERROR
      setModalState({
        isOpen: true,
        title: 'Error al Registrar',
        message: 'Verifique que el Código no esté repetido o falten datos.',
        isError: true
      });
    }
  };

  // --- PREPARAR EDICIÓN ---
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

  // --- GUARDAR EDICIÓN ---
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

      await axios.put(`http://localhost:3001/api/assets/${id}`, dataToUpdate, getAuthHeaders());
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

  // --- ELIMINAR ---
  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este bien?')) return; // Confirmación nativa (opcional cambiarla también)
    try {
      await axios.delete(`http://localhost:3001/api/assets/${id}`, getAuthHeaders());
      fetchAssets();
      // Opcional: Mostrar modal de eliminado
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

  return (
    <div className="relative">
      <h2 className="text-2xl font-bold text-gray-700 mb-6">
        <span className="text-sibci-accent">●</span> Inventario de Bienes Nacionales
      </h2>

      {/* Formulario Rápido */}
      {userIsAdmin && (
        <div className="bg-gray-50 p-4 rounded mb-8 border border-gray-200">
          <h3 className="text-lg font-semibold mb-3 text-sibci-primary">Registrar Nuevo Equipo</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input 
                required 
                type="text" 
                placeholder="Código / ID Manual" 
                value={newAsset.id} 
                onChange={e => setNewAsset({...newAsset, id: e.target.value})} 
                className="p-2 border rounded font-mono" 
              />
              <input 
                required 
                type="text"
                placeholder="Título (Ej: Monitor)" 
                value={newAsset.titulo} 
                onChange={e => setNewAsset({...newAsset, titulo: e.target.value})} 
                className="p-2 border rounded" 
              />
              <input 
                required 
                type="text"
                placeholder="Condición (Ej: Bueno)" 
                value={newAsset.condicion} 
                onChange={e => setNewAsset({...newAsset, condicion: e.target.value})} 
                className="p-2 border rounded" 
              />
              <button type="submit" className="bg-green-600 text-white rounded hover:bg-green-700 font-bold">
                Agregar
              </button>
          </form>
        </div>
      )}

      {/* Tabla */}
      <div className="tablas overflow-x-auto">
        <table className="w-full text-left border-collapse bg-white rounded shadow">
            <thead>
                <tr className="bg-gray-200 text-gray-700">
                    <th className="p-3 border-b">ID</th>
                    <th className="p-3 border-b">Titulo</th>
                    <th className="p-3 border-b">Condición</th>
                    <th className="p-3 border-b">Estado</th>
                    {userIsAdmin && <th className="p-3 border-b text-center">Acciones</th>}
                </tr>
            </thead>
            <tbody>
                {assets.map(asset => (
                    <tr key={asset.id} className="hover:bg-gray-50 border-b">
                        {editingId === asset.id ? (
                            // MODO EDICIÓN
                            <>
                                <td className="p-3">
                                    <input
                                        type="text"
                                        value={editForm.id}
                                        onChange={(e) => setEditForm({...editForm, id: e.target.value})}
                                        className="w-full p-1 border rounded text-sm font-mono bg-white"
                                    />
                                </td>
                                <td className="p-3">
                                    <input
                                        type="text"
                                        value={editForm.titulo}
                                        onChange={(e) => setEditForm({...editForm, titulo: e.target.value})}
                                        className="w-full p-1 border rounded text-sm"
                                    />
                                </td>
                                <td className="p-3">
                                    <input
                                        type="text"
                                        value={editForm.condicion}
                                        onChange={(e) => setEditForm({...editForm, condicion: e.target.value})}
                                        className="w-full p-1 border rounded text-sm"
                                    />
                                </td>
                                <td className="p-3">
                                    <select
                                        value={editForm.estado}
                                        onChange={(e) => setEditForm({...editForm, estado: e.target.value})}
                                        className="w-full p-1 border rounded text-sm"
                                    >
                                        <option value="Operativo">Operativo</option>
                                        <option value="En Reparación">En Reparación</option>
                                        <option value="Fuera de Servicio">Fuera de Servicio</option>
                                    </select>
                                </td>
                                <td className="p-3">
                                    <div className="flex gap-2 justify-center">
                                        <button onClick={() => handleSaveEdit(asset.id)} className="p-2 bg-green-500 text-white rounded hover:bg-green-600">
                                            <FaSave />
                                        </button>
                                        <button onClick={handleCancelEdit} className="p-2 bg-gray-500 text-white rounded hover:bg-gray-600">
                                            <FaTimes />
                                        </button>
                                    </div>
                                </td>
                            </>
                        ) : (
                            // MODO VISUALIZACIÓN
                            <>
                                <td className="p-3 font-mono font-bold text-blue-600">
                                    {asset.codigo || asset.id_manual || asset.id}
                                </td>
                                <td className="p-3 font-medium text-gray-900">
                                    {asset.titulo || asset.nombre || '(Sin nombre)'}
                                </td>
                                <td className="p-3">
                                    <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-semibold">
                                        {asset.condicion || asset.ubicacion || '-'}
                                    </span>
                                </td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 text-xs rounded-full font-semibold ${
                                        asset.estado === 'Operativo' ? 'bg-green-100 text-green-800' : 
                                        asset.estado === 'En Reparación' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {asset.estado}
                                    </span>
                                </td>
                                {userIsAdmin && (
                                    <td className="p-3">
                                        <div className="flex gap-2 justify-center">
                                            <button onClick={() => handleEdit(asset)} className="p-2 text-blue-500 hover:bg-blue-50 rounded">
                                                <FaEdit />
                                            </button>
                                            <button onClick={() => handleDelete(asset.id)} className="p-2 text-red-500 hover:bg-red-50 rounded">
                                                <FaTrashAlt />
                                            </button>
                                        </div>
                                    </td>
                                )}
                            </>
                        )}
                    </tr>
                ))}
            </tbody>
        </table>
        {assets.length === 0 && <p className="text-center p-8 text-gray-500">No hay bienes registrados en el inventario.</p>}
      </div>

      {/* --- AQUÍ SE RENDERIZA EL MODAL --- */}
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