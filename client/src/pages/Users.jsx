import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { apiUrl } from '../config/api';

const Users = () => {
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [form, setForm] = useState({ username: '', password: '', nombre: '', email: '', rol: 'jefe', departamento: '' });
  const [loading, setLoading] = useState(false);

  const headers = { headers: { Authorization: `Bearer ${token}` } };

  const fetchUsers = async () => {
    try {
      const res = await axios.get(apiUrl('/api/users'), headers);
      setUsers(res.data || []);
    } catch (err) {
      console.error('Error listando usuarios', err);
      setUsers([]);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await axios.get(apiUrl('/api/departments'), headers);
      setDepartments(res.data || []);
    } catch (err) {
      setDepartments([]);
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchUsers();
    fetchDepartments();
  }, [user]);

  const roleOptions = () => {
    if (user?.rol === 'superadmin') return ['superadmin', 'admin', 'jefe'];
    if (user?.rol === 'admin') return ['jefe'];
    return [];
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      const res = await axios.post(apiUrl('/api/users'), payload, headers);
      // If creating a jefe, ensure department exists and set encargado
      if (form.rol === 'jefe' && form.departamento) {
        await axios.post(apiUrl('/api/departments'), { name: form.departamento, encargado: res.data.user.username }, headers);
      }
      setForm({ username: '', password: '', nombre: '', email: '', rol: 'jefe', departamento: '' });
      await fetchUsers();
      await fetchDepartments();
      alert('Usuario creado correctamente');
    } catch (err) {
      console.error('Error creando usuario', err);
      alert(err.response?.data?.error || 'Error creando usuario');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (id) => {
    if (!confirm('¿Eliminar usuario? Esta acción es irreversible.')) return;
    try {
      await axios.delete(apiUrl(`/api/users/${id}`), headers);
      await fetchUsers();
      alert('Usuario eliminado');
    } catch (err) {
      console.error('Error eliminando usuario', err);
      alert(err.response?.data?.error || 'Error eliminando usuario');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-[#172554] p-6 rounded-2xl text-white flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white tracking-tight">
              <span className="text-yellow-400 text-3xl">●</span> Gestión de Usuario
            </h2>
          <p className="text-sm mt-1 ml-6 text-blue-200">Crear y asignar jefes de departamento</p>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow border border-gray-100 dark:border-gray-700 transition-colors duration-300">
        <form onSubmit={handleCreate} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input required name="username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} placeholder="Usuario" className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          <input required name="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Contraseña" className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          <input required name="nombre" value={form.nombre} onChange={(e) => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre completo" className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          <input required name="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Correo" className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" />
          <select name="rol" value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })} className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            {roleOptions().map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select name="departamento" value={form.departamento} onChange={(e) => setForm({ ...form, departamento: e.target.value })} className="p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="">-- Departamento (opcional) --</option>
            {departments.map(d => <option key={d.name} value={d.name}>{d.name}</option>)}
          </select>
          <div className="md:col-span-3 flex gap-2">
            <button disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded">{loading ? 'Creando...' : 'Crear Usuario'}</button>
            <button type="button" onClick={() => setForm({ username: '', password: '', nombre: '', email: '', rol: 'jefe', departamento: '' })} className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700">Limpiar</button>
          </div>
        </form>
      </div>

      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow border border-gray-100 dark:border-gray-700 transition-colors duration-300">
        <h3 className="font-semibold mb-4 text-gray-900 dark:text-white">Usuarios existentes</h3>
        <div className="overflow-auto max-h-80">
          <table className="w-full text-left text-sm">
            <thead className="text-xs text-gray-500 dark:text-gray-400 uppercase">
              <tr>
                <th className="p-2">Usuario</th>
                <th>Nombre</th>
                <th>Rol</th>
                <th>Departamento</th>
                {user?.rol === 'superadmin' && <th>Acciones</th>}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-t border-gray-200 dark:border-gray-700">
                  <td className="p-2 font-mono text-gray-900 dark:text-white">{u.username}</td>
                  <td className="p-2 text-gray-900 dark:text-gray-200">{u.nombre}</td>
                  <td className="p-2 text-gray-900 dark:text-gray-200">{u.rol}</td>
                  <td className="p-2 text-gray-900 dark:text-gray-200">{u.departamento || '-'}</td>
                  {user?.rol === 'superadmin' && (
                    <td className="p-2">
                      {u.username !== user.username && (
                        <button onClick={() => handleDeleteUser(u.id)} className="text-sm text-red-600 hover:underline">Eliminar</button>
                      )}
                      {u.username === user.username && <span className="text-xs text-gray-400">(tú)</span>}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Users;
