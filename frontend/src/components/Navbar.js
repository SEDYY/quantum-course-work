'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from '../app/styles/Navbar.module.css';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <Link href="/">Компьютерный салон</Link>
      </div>
      <div className={styles.hamburger} onClick={toggleMenu}>
        <span></span>
        <span></span>
        <span></span>
      </div>
      <ul className={`${styles.navLinks} ${isOpen ? styles.active : ''}`}>
        <li>
          <Link href="/" className={pathname === '/' ? styles.active : ''}>
            Главная
          </Link>
        </li>
        {user ? (
          <>
            {user.role === 'customer' && (
              <li>
                <Link href={`/customer/${user.id}`} className={pathname.startsWith('/customer') ? styles.active : ''}>
                  Личный кабинет
                </Link>
              </li>
            )}
            {user.role === 'admin' && (
              <li className={styles.dropdown}>
                <span>Админ-панель</span>
                <ul className={styles.dropdownMenu}>
                  <li>
                    <Link href="/admin/sales" className={pathname === '/admin/sales' ? styles.active : ''}>
                      Продажи
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/service-requests" className={pathname === '/admin/service-requests' ? styles.active : ''}>
                      Заявки
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/stock" className={pathname === '/admin/stock' ? styles.active : ''}>
                      Склад
                    </Link>
                  </li>
                  <li>
                    <Link href="/admin/reports" className={pathname === '/admin/reports' ? styles.active : ''}>
                      Отчёты
                    </Link>
                  </li>
                </ul>
              </li>
            )}
            <li>
              <button onClick={logout} className={styles.logoutButton}>
                Выйти
              </button>
            </li>
          </>
        ) : (
          <>
            <li>
              <Link href="/login" className={pathname === '/login' ? styles.active : ''}>
                Вход
              </Link>
            </li>
            <li>
              <Link href="/register" className={pathname === '/register' ? styles.active : ''}>
                Регистрация
              </Link>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
}