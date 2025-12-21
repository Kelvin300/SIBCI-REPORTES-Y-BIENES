import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { FaEdit, FaTrashAlt, FaSave, FaTimes } from 'react-icons/fa';

const Assets = () => {
  const { isAdmin, user } = useAuth();
  const userIsAdmin = user?.rol === 'admin';
  
  // Debug
  useEffect(() => {
    console.log('Assets - Usuario:', user);
    console.log('Assets - ¿Es admin?', userIsAdmin);
  }, [user, userIsAdmin]);
  const [assets, setAssets] = useState([]);
  const [newAsset, setNewAsset] = useState({ codigo: '', nombre: '', marca: '', ubicacion: '' });
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ codigo: '', nombre: '', marca: '', ubicacion: '', estado: '' });

  const fetchAssets = async () => {
    const res = await axios.get('http://localhost:3001/api/assets');
    setAssets(res.data);
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    try {
      await axios.post('http://localhost:3001/api/assets', newAsset);
      setNewAsset({ codigo: '', nombre: '', marca: '', ubicacion: '' });
      fetchAssets();
    } catch (error) {
      alert('Error: Verifique que el código no esté repetido');
    }
  };

  const handleEdit = (asset) => {
    setEditingId(asset.id);
    setEditForm({
      codigo: asset.codigo,
      nombre: asset.nombre,
      marca: asset.marca || '',
      ubicacion: asset.ubicacion || '',
      estado: asset.estado || 'Operativo'
    });
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditForm({ codigo: '', nombre: '', marca: '', ubicacion: '', estado: '' });
  };

  const handleSaveEdit = async (id) => {
    try {
      await axios.put(`http://localhost:3001/api/assets/${id}`, editForm);
      setEditingId(null);
      fetchAssets();
    } catch (error) {
      alert('Error al actualizar el bien');
      console.error(error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Estás seguro de eliminar este bien?')) return;
    try {
      await axios.delete(`http://localhost:3001/api/assets/${id}`);
      fetchAssets();
    } catch (error) {
      alert('Error al eliminar el bien');
      console.error(error);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-700 mb-6">
        <span className="text-sibci-accent">●</span> Inventario de Bienes Nacionales
      </h2>
      {/* Formulario Rápido - Solo visible para administradores */}
      {userIsAdmin && (
        <div className="bg-gray-50 p-4 rounded mb-8 border border-gray-200">
          <h3 className="text-lg font-semibold mb-3 text-sibci-primary">Registrar Nuevo Equipo</h3>
          <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-5 gap-3">
              <input required placeholder="Cód. Bien" value={newAsset.codigo} onChange={e => setNewAsset({...newAsset, codigo: e.target.value})} className="p-2 border rounded" />
              <input required placeholder="Nombre (Ej: Monitor)" value={newAsset.nombre} onChange={e => setNewAsset({...newAsset, nombre: e.target.value})} className="p-2 border rounded" />
              <input placeholder="Marca" value={newAsset.marca} onChange={e => setNewAsset({...newAsset, marca: e.target.value})} className="p-2 border rounded" />
              <input required placeholder="Ubicación" value={newAsset.ubicacion} onChange={e => setNewAsset({...newAsset, ubicacion: e.target.value})} className="p-2 border rounded" />
              <button type="submit" className="bg-green-600 text-white rounded hover:bg-green-700">Agregar</button>
          </form>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-gray-200 text-gray-700">
                    <th className="p-3 border-b">Código</th>
                    <th className="p-3 border-b">Equipo</th>
                    <th className="p-3 border-b">Marca</th>
                    <th className="p-3 border-b">Ubicación</th>
                    <th className="p-3 border-b">Estado</th>
                    {userIsAdmin && <th className="p-3 border-b text-center">Acciones</th>}
                </tr>
            </thead>
            <tbody>
                {assets.map(asset => (
                    <tr key={asset.id} className="hover:bg-gray-50 border-b">
                        {editingId === asset.id ? (
                            // Modo edición
                            <>
                                <td className="p-3">
                                    <input
                                        type="text"
                                        value={editForm.codigo}
                                        onChange={(e) => setEditForm({...editForm, codigo: e.target.value})}
                                        className="w-full p-1 border rounded text-sm font-mono"
                                    />
                                </td>
                                <td className="p-3">
                                    <input
                                        type="text"
                                        value={editForm.nombre}
                                        onChange={(e) => setEditForm({...editForm, nombre: e.target.value})}
                                        className="w-full p-1 border rounded text-sm"
                                    />
                                </td>
                                <td className="p-3">
                                    <input
                                        type="text"
                                        value={editForm.marca}
                                        onChange={(e) => setEditForm({...editForm, marca: e.target.value})}
                                        className="w-full p-1 border rounded text-sm"
                                    />
                                </td>
                                <td className="p-3">
                                    <input
                                        type="text"
                                        value={editForm.ubicacion}
                                        onChange={(e) => setEditForm({...editForm, ubicacion: e.target.value})}
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
                                        <button
                                            onClick={() => handleSaveEdit(asset.id)}
                                            className="p-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
                                            title="Guardar"
                                        >
                                            <FaSave size={16} />
                                        </button>
                                        <button
                                            onClick={handleCancelEdit}
                                            className="p-2 bg-gray-500 text-white rounded hover:bg-gray-600 transition"
                                            title="Cancelar"
                                        >
                                            <FaTimes size={16} />
                                        </button>
                                    </div>
                                </td>
                            </>
                        ) : (
                            // Modo visualización
                            <>
                                <td className="p-3 font-mono font-bold text-blue-600">{asset.codigo}</td>
                                <td className="p-3">{asset.nombre}</td>
                                <td className="p-3">{asset.marca || '-'}</td>
                                <td className="p-3">{asset.ubicacion || '-'}</td>
                                <td className="p-3">
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                        asset.estado === 'Operativo' 
                                            ? 'bg-green-100 text-green-800' 
                                            : asset.estado === 'En Reparación'
                                            ? 'bg-yellow-100 text-yellow-800'
                                            : 'bg-red-100 text-red-800'
                                    }`}>
                                        {asset.estado}
                                    </span>
                                </td>
                                {userIsAdmin && (
                                    <td className="p-3">
                                        <div className="flex gap-2 justify-center">
                                            <button
                                                onClick={() => handleEdit(asset)}
                                                className="p-2 text-blue-500 hover:bg-blue-50 rounded transition hover:scale-110"
                                                title="Editar"
                                            >
                                                <FaEdit size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(asset.id)}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded transition hover:scale-110"
                                                title="Eliminar"
                                            >
                                                <FaTrashAlt size={18} />
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
        {assets.length === 0 && <p className="text-center p-4 text-gray-500">No hay bienes registrados.</p>}
      </div>
    </div>
  );
};

export default Assets;