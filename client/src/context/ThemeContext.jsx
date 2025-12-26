import React, { createContext, useContext, useEffect, useState } from 'react';

// 1. Creamos el contexto
const ThemeContext = createContext();

// 2. Exportamos el hook personalizado (Ojo con el 'export')
export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme debe usarse dentro de un ThemeProvider");
  }
  return context;
};

// 3. Exportamos el componente proveedor (Ojo con el 'export')
export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    // Leemos del localStorage o usamos 'light' por defecto
    return localStorage.getItem('theme') || 'light';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    // Lógica para añadir/quitar la clase 'dark' al HTML
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};