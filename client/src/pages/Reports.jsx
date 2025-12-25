import React, { useState } from 'react';
import axios from 'axios';
// IMPORTANTE: Ajusta la ruta si tu carpeta components está en otro nivel
import SuccessModal from "../components/SuccessModal"; // <-- Ajusta ruta si es necesario

const Reports = () => {
  // Estado del Formulario
  const [formData, setFormData] = useState({
    solicitante: '',
    departamento: '',
    tipo_falla: 'Hardware',
    descripcion: ''
  });
  
  const [loading, setLoading] = useState(false);

  // NUEVO: Estado para controlar el Modal
  const [modalState, setModalState] = useState({
    isOpen: false,
    title: '',
    message: '',
    isError: false // Para cambiar el color del icono
  });

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  // Función auxiliar para cerrar el modal
  const closeModal = () => {
    setModalState({ ...modalState, isOpen: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const response = await axios.post('http://localhost:3001/api/reports', formData);
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
          isError: true // Lo mostramos rojo o naranja por el error de correo
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
      // Lógica de error en la petición
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
    <div className="relative"> {/* relative ayuda al posicionamiento */}
      <h2 className="text-2xl font-bold text-gray-700 mb-6 flex items-center gap-2">
        <span className="text-sibci-accent">●</span> Reportar Falla Técnica
      </h2>
      
      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Nombre del Solicitante</label>
          <input required name="solicitante" value={formData.solicitante} onChange={handleChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: Juan Pérez" />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Departamento / Oficina</label>
          <input required name="departamento" value={formData.departamento} onChange={handleChange} className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Ej: Prensa" />
        </div>
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Falla</label>
            <select name="tipo_falla" value={formData.tipo_falla} onChange={handleChange} className="w-full p-2 border rounded bg-white">
                <option value="Hardware">Hardware (Equipo físico)</option>
                <option value="Software">Software (Programas/SO)</option>
                <option value="Redes">Internet / Redes</option>
                <option value="Electricidad">Eléctrico</option>
            </select>
        </div>
        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">Descripción Detallada</label>
          <textarea required name="descripcion" value={formData.descripcion} onChange={handleChange} rows="4" className="w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Describa el problema..."></textarea>
        </div>
        <div className="md:col-span-2 text-right">
            <button type="submit" disabled={loading} className="bg-sibci-primary hover:bg-sibci-secondary text-white px-6 py-2 rounded shadow transition-colors">
                {loading ? 'Enviando...' : 'Enviar Reporte'}
            </button>
        </div>
      </form>

      {/* AQUÍ ESTÁ LA MAGIA: El Modal se renderiza al final */}
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