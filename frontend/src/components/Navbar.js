'use client';

import Link from 'next/link';
import styles from '../app/styles/Navbar.module.css'
export default function Navbar() {
  return (
    <nav className={styles.navbar}>
      <div className={styles.logo}>
        <Link href="/">Компьютерный салон</Link>
      </div>
      <ul className={styles.navLinks}>
        <li>
          <Link href="/">Главная</Link>
        </li>
        <li>
          <Link href="/catalog">Каталог</Link>
        </li>
        <li className={styles.dropdown}>
          <span>Админ-панель</span>
          <ul className={styles.dropdownMenu}>
            <li>
              <Link href="/admin/products">Продукты</Link>
            </li>
            <li>
              <Link href="/admin/services">Услуги</Link>
            </li>
            <li>
              <Link href="/admin/service-requests">Заявки</Link>
            </li>
          </ul>
        </li>
      </ul>
    </nav>
  );
}