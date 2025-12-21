/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sibci: {
          // Azul Oscuro (Bordes del logo/Letras) - Para el menú lateral
          primary: '#172554', 
          // Azul Cielo (Centro de la estrella) - Para botones y acentos
          secondary: '#38bdf8', 
          // Amarillo (Punta de la estrella) - Para resaltar la opción activa
          accent: '#facc15',
          // Rojo (Detalle de la estrella) - Para errores o alertas
          danger: '#ef4444', 
        }
      }
    },
  },
  plugins: [],
}