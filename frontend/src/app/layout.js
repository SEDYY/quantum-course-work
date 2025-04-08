'use client';

import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode'; // Используем именованный импорт
import Navbar from '../components/Navbar';
import LoginModal from '../components/LoginModal';
import './globals.css';

export default function RootLayout({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        jwtDecode(token); // Используем jwtDecode
        setIsAuthenticated(true);
        setShowLoginModal(false);
      } catch (err) {
        setIsAuthenticated(false);
        setShowLoginModal(true);
        localStorage.removeItem('token');
      }
    } else {
      setIsAuthenticated(false);
      setShowLoginModal(true);
    }
  }, []);

  const handleLoginSuccess = () => {
    setIsAuthenticated(true);
    setShowLoginModal(false);
  };

  return (
    <html lang="ru">
      <body>
        <Navbar />
        {showLoginModal && !isAuthenticated ? (
          <LoginModal onClose={handleLoginSuccess} />
        ) : (
          children
        )}
      </body>
    </html>
  );
}