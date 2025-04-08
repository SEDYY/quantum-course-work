'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from '../app/styles/LoginModal.module.css';

export default function LoginModal({ onClose }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const router = useRouter();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Ошибка входа');
      }
      localStorage.setItem('token', data.token);
      onClose(); // Закрываем модальное окно
      router.refresh(); // Обновляем страницу
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className={styles.overlay}>
      <div className={styles.modal}>
        <h2>Вход</h2>
        {error && <p className={styles.error}>{error}</p>}
        <form onSubmit={handleLogin} className={styles.form}>
          <input
            type="text"
            placeholder="Имя пользователя"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Пароль"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Войти</button>
        </form>
      </div>
    </div>
  );
}