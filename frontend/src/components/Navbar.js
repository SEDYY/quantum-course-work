'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { jwtDecode } from 'jwt-decode';
import styles from '../app/styles/Navbar.module.css';
import LoginModal from './LoginModal';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [userRole, setUserRole] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);

  const updateAuthState = () => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const decoded = jwtDecode(token);
        setUserRole(decoded.role);
        setIsAuthenticated(true);
      } catch (err) {
        setUserRole(null);
        setIsAuthenticated(false);
        localStorage.removeItem('token');
        setShowLoginModal(true);
      }
    } else {
      setUserRole(null);
      setIsAuthenticated(false);
      setShowLoginModal(true);
    }
  };

  useEffect(() => {
    updateAuthState();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    setUserRole(null);
    setIsAuthenticated(false);
    setShowLoginModal(true);
    router.refresh();
  };

  const handleLoginSuccess = () => {
    updateAuthState();
    setShowLoginModal(false);
  };

  return (
    <>
      <nav className={styles.navbar}>
        <div className={styles.logo}>
          <Link href="/">Компьютерный салон</Link>
        </div>
        <ul className={styles.navLinks}>
          <li>
            <Link href="/" className={pathname === '/' ? styles.active : ''}>
              Главная
            </Link>
          </li>
          <li>
            <Link href="/catalog" className={pathname === '/catalog' ? styles.active : ''}>
              Каталог
            </Link>
          </li>
          {isAuthenticated && userRole === 'admin' && (
            <li className={styles.dropdown}>
              <span>Админ-панель</span>
              <ul className={styles.dropdownMenu}>
                <li>
                  <Link
                    href="/admin/products"
                    className={pathname === '/admin/products' ? styles.active : ''}
                  >
                    Продукты
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/services"
                    className={pathname === '/admin/services' ? styles.active : ''}
                  >
                    Услуги
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/service-requests"
                    className={pathname === '/admin/service-requests' ? styles.active : ''}
                  >
                    Заявки
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/customers"
                    className={pathname === '/admin/customers' ? styles.active : ''}
                  >
                    Клиенты
                  </Link>
                </li>
                <li>
                  <Link
                    href="/admin/orders"
                    className={pathname === '/admin/orders' ? styles.active : ''}
                  >
                    Заказы
                  </Link>
                </li>
              </ul>
            </li>
          )}
          <li>
            {isAuthenticated ? (
              <button onClick={handleLogout} className={styles.logoutButton}>
                Выход
              </button>
            ) : (
              <button onClick={() => setShowLoginModal(true)} className={styles.loginButton}>
                Вход
              </button>
            )}
          </li>
        </ul>
      </nav>
      {showLoginModal && !isAuthenticated && (
        <LoginModal onClose={handleLoginSuccess} />
      )}
    </>
  );
}