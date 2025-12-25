import React from 'react';

const SuccessModal = ({ isOpen, onClose, title, message, isError }) => {
  if (!isOpen) return null;

  return (
    // CONTENEDOR PRINCIPAL (Overlay)
    // Z-index muy alto (z-[9999]) para asegurar que tape el menú lateral y navbar
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      
      {/* Fondo oscuro con desenfoque (Backdrop) */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-40 backdrop-blur-sm transition-opacity" 
        onClick={onClose} // Cierra si clicas fuera
      ></div>

      {/* TARJETA DEL MODAL */}
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md relative z-10 overflow-hidden transform transition-all animate-[fadeIn_0.3s_ease-out]">
        
        {/* Barra superior de color */}
        <div className={`h-2 w-full ${isError ? 'bg-red-500' : 'bg-blue-500'}`}></div>

        <div className="p-6 text-center">
          {/* ICONO ANIMADO */}
          <div className={`mx-auto flex items-center justify-center h-16 w-16 rounded-full mb-4 ${isError ? 'bg-red-100' : 'bg-blue-100'}`}>
            {isError ? (
              // Icono X (Error)
              <svg className="h-8 w-8 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              // Icono Check (Éxito)
              <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>

          {/* TÍTULO Y MENSAJE */}
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            {title}
          </h3>
          <p className="text-gray-500 text-sm mb-6 whitespace-pre-line">
            {message}
          </p>

          {/* BOTÓN */}
          <button
            onClick={onClose}
            className={`w-full inline-flex justify-center rounded-lg px-4 py-3 text-white font-medium shadow-md transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 ${
              isError 
                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                : 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500'
            }`}
          >
            Aceptar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuccessModal;