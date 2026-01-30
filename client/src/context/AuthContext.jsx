import React, { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { apiUrl } from '../config/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem('token'));

  // Configurar axios para incluir el token en todas las peticiones
  useEffect(() => {
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      verifyToken();
    } else {
      setLoading(false);
    }
  }, [token]);

  const verifyToken = async () => {
    try {
      const response = await axios.get(apiUrl('/api/auth/verify'));
      setUser(response.data.user);
    } catch (error) {
      // Token inválido, limpiar
      logout();
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password, recaptchaToken) => {
    try {
      const response = await axios.post(apiUrl('/api/auth/login'), {
        username,
        password,
        recaptchaToken
      });
      
      const { token: newToken, user: userData } = response.data;
      setToken(newToken);
      setUser(userData);
      localStorage.setItem('token', newToken);
      axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
      
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Error al iniciar sesión'
      };
    }
  };

  const register = async (username, password, nombre, email, recaptchaToken) => {
    // Registro público eliminado — creación de usuarios por admin/superadmin
    return { success: false, error: 'Registro deshabilitado. Contacte al administrador.' };
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    delete axios.defaults.headers.common['Authorization'];
  };

  const isAdmin = () => {
    return user?.rol === 'admin' || user?.rol === 'superadmin';
  };

  const value = {
    user,
    loading,
    login,
    // register kept for compatibility but disabled; UI should be removed
    register,
    logout,
    isAdmin,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

