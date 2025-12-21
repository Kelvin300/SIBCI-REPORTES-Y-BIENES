import React, { useState } from 'react';
import axios from 'axios';

const Reports = () => {
  const [formData, setFormData] = useState({
    solicitante: '',
    departamento: '',
    tipo_falla: 'Hardware',
    descripcion: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      // axios ya tiene el token configurado en AuthContext
      const response = await axios.post('http://localhost:3001/api/reports', formData);
      const { emailSent, emailError } = response.data;
      
      if (emailSent) {
        alert('✅ Reporte enviado con éxito y notificado al correo.');
      } else if (emailError) {
        alert(`⚠️ Reporte guardado correctamente, pero hubo un problema al enviar el correo:\n${emailError}\n\nRevisa la consola del servidor para más detalles.`);
        console.error('Error al enviar correo:', emailError);
      } else {
        alert('✅ Reporte guardado correctamente.\n⚠️ El correo no pudo enviarse (falta configuración).');
      }
      setFormData({ solicitante: '', departamento: '', tipo_falla: 'Hardware', descripcion: '' });
    } catch (error) {
      alert('❌ Error al enviar reporte. Por favor, intenta nuevamente.');
      console.error('Error completo:', error);
      if (error.response) {
        console.error('Respuesta del servidor:', error.response.data);
      }
    }
    setLoading(false);
  };

  return (
    <div>
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
    </div>
  );
};

export default Reports;