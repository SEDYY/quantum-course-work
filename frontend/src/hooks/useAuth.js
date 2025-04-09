import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; 
export const useAuth = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        const currentTime = Date.now() / 1000; // Текущее время в секундах
        if (decoded.exp < currentTime) {
          // Токен истёк
          localStorage.removeItem('token');
          setUser(null);
        } else {
          setUser(decoded);
        }
      } catch (err) {
        console.error('Ошибка декодирования токена:', err);
        localStorage.removeItem('token');
      }
    }
  }, []);
  
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return { user, logout };
};