import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
// IMPORTANTE: Ajusta la ruta si tu carpeta components está en otro nivel
import SuccessModal from "../components/SuccessModal"; 
import { apiUrl } from '../config/api';

const Reports = () => {
  // Estado del Formulario
  const [formData, setFormData] = useState({
    solicitante: '',
    departamento: '',
    tipo_falla: 'Hardware',
    descripcion: ''
  });
  
  const [loading, setLoading] = useState(false);

  const { user } = useAuth();
  const [departments, setDepartments] = useState([]);
  const [selectedEncargado, setSelectedEncargado] = useState('');

  // Estado para controlar el Modal
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    isError: false 
  });

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  // Función auxiliar para cerrar el modal
  const closeModal = () => {
    setModalState({ ...modalState, isOpen: false });
  };

  useEffect(() => {
    const fetchDepartments = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(apiUrl('/api/departments'), {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        if (res.ok) {
          const data = await res.json() || [];
          // Si el usuario es jefe, mostrar solo su departamento
          if (user?.rol === 'jefe') {
            const filtered = data.filter(d => d.encargado === user.username || d.name === user.departamento);
            // Si no existe en la lista, crear un placeholder a partir del user.departamento
            const final = filtered.length ? filtered : (user.departamento ? [{ name: user.departamento, encargado: user.username }] : []);
            setDepartments(final);
            if (final[0]) {
              setFormData(prev => ({ ...prev, departamento: final[0].name }));
              setSelectedEncargado(final[0].encargado || '');
            }
          } else {
            setDepartments(data);
          }
        }
      } catch (err) {
        console.error('No se pudieron cargar departamentos:', err);
      }
    };
    fetchDepartments();
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post(apiUrl('/api/reports'), formData);
      const { emailSent, emailError } = response.data;
      
      // Lógica de respuesta exitosa
      if (emailSent) {
        setModalState({
          isOpen: true,
          title: '¡Reporte Enviado!',
          message: 'Tu reporte ha sido enviado con éxito y notificado al correo.',
          isError: false
        });
      } else if (emailError) {
        setModalState({
          isOpen: true,
          title: 'Reporte Guardado (Con Aviso)',
          message: `El reporte se guardó, pero hubo un problema al enviar el correo:\n${emailError}`,
          isError: true 
        });
        console.error('Error al enviar correo:', emailError);
      } else {
        setModalState({
          isOpen: true,
          title: 'Reporte Guardado',
          message: 'Reporte guardado correctamente.\nNota: El correo no pudo enviarse (falta configuración).',
          isError: false
        });
      }

      // Limpiar formulario al tener éxito
      setFormData({ solicitante: '', departamento: '', tipo_falla: 'Hardware', descripcion: '' });

    } catch (error) {
      console.error('Error completo:', error);
      
      let errorMsg = 'Ocurrió un error inesperado.';
      if (error.response) {
         errorMsg = `El servidor respondió: ${JSON.stringify(error.response.data)}`;
      }

      setModalState({
        isOpen: true,
        title: 'Error al Enviar',
        message: 'No se pudo enviar el reporte. Por favor, intenta nuevamente.\n' + errorMsg,
        isError: true
      });
    }
    
    setLoading(false);
  };

  return (
    <div className="space-y-6"> {/* Espacio vertical entre el header y el formulario */}
      
      {/* --- 1. HEADER / BANNER AZUL (Estilo Gestión) --- */}
      {/* Usamos un color arbitrario hex [#1e2538] similar a tu captura, o puedes usar bg-slate-900 */}
      <div className="bg-[#172554] rounded-2xl p-6 shadow-lg text-white flex flex-col md:flex-row md:justify-between md:items-center gap-4">
        
        {/* Lado Izquierdo: Título y Subtítulo */}
        <div className="flex items-center gap-3">
          <div>
            <h2 className="text-2xl font-bold text-white tracking-tight">
              <span className="text-yellow-400 text-3xl">●</span> Reportar Falla Técnica
            </h2>
            <p className="text-blue-200 text-sm mt-1 ml-6">
              Formulario de registro de incidencias SIBCI Guárico
            </p>
          </div>
        </div>

        {/* Lado Derecho: Badge (Estilo "Total Registros") */}
        <div>
          <span className="inline-block px-4 py-2 rounded-full border border-white/20 bg-white/10 text-sm text-gray-100 backdrop-blur-sm">
            Nuevo Ticket
          </span>
        </div>
      </div>


      {/* --- 2. TARJETA DEL FORMULARIO (Blanca) --- */}
      <div className="bg-white rounded-2xl shadow-md border border-gray-100 p-6 md:p-8">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Nombre */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Nombre del Solicitante</label>
            <input 
              required 
              name="solicitante" 
              value={formData.solicitante} 
              onChange={handleChange} 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e2538] focus:border-[#1e2538] outline-none transition-all" 
              placeholder="Ej: Juan Pérez" 
            />
          </div>

          {/* Departamento */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Departamento / Oficina</label>
            {departments.length > 0 ? (
              <>
                <select
                  required
                  name="departamento"
                  value={formData.departamento}
                  onChange={(e) => { handleChange(e); const sel = departments.find(d => d.name === e.target.value); setSelectedEncargado(sel ? sel.encargado : ''); }}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e2538] focus:border-[#1e2538] outline-none transition-all"
                >
                  <option value="">-- Selecciona un departamento --</option>
                  {departments.map(d => (
                    <option key={d.name} value={d.name}>{d.name}</option>
                  ))}
                </select>
                {selectedEncargado && (
                  <p className="text-sm text-gray-500 mt-2">Encargado: {selectedEncargado}</p>
                )}
              </>
            ) : (
              <input 
                required 
                name="departamento" 
                value={formData.departamento} 
                onChange={handleChange} 
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e2538] focus:border-[#1e2538] outline-none transition-all" 
                placeholder="Ej: Prensa" 
              />
            )}
          </div>

          {/* Tipo de Falla */}
          <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Tipo de Falla</label>
              <select 
                name="tipo_falla" 
                value={formData.tipo_falla} 
                onChange={handleChange} 
                className="w-full p-3 border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-[#1e2538] focus:border-[#1e2538] outline-none transition-all"
              >
                  <option value="Hardware">Hardware (Equipo físico)</option>
                  <option value="Software">Software (Programas/SO)</option>
                  <option value="Redes">Internet / Redes</option>
                  <option value="Electricidad">Eléctrico</option>
              </select>
          </div>

          {/* Descripción */}
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Descripción Detallada</label>
            <textarea 
              required 
              name="descripcion" 
              value={formData.descripcion} 
              onChange={handleChange} 
              rows="4" 
              className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#1e2538] focus:border-[#1e2538] outline-none transition-all resize-y" 
              placeholder="Describa el problema..."
            ></textarea>
          </div>

          {/* Botón de envío */}
          <div className="md:col-span-2 flex justify-end mt-4">
              <button 
                type="submit" 
                disabled={loading} 
                className="bg-[#172554]  hover:bg-[#2c365e] text-white font-medium px-8 py-3 rounded-lg shadow-md transition-colors duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
              >
                  {loading ? 'Enviando...' : 'Enviar Reporte'}
              </button>
          </div>
        </form>
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

export default Reports;