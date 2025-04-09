'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../hooks/useAuth';
import styles from '../../../styles/Customer.module.css';

export default function CustomerPage({ params }) {
  const { id } = params;
  const { user } = useAuth();
  const router = useRouter();
  const [history, setHistory] = useState([]);
  const [newFeedback, setNewFeedback] = useState({ rating: '', comment: '' });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!user) {
      router.push('/login'); // Перенаправляем на страницу входа, если не авторизован
      return;
    }
    if (user.id !== parseInt(id) && user.role !== 'admin') {
      setError('Доступ запрещён');
      return;
    }
    fetchHistory();
  }, [id, user, router]);

  const fetchHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/customers/${id}/history`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`Ошибка HTTP: ${res.status}`);
      const data = await res.json();
      setHistory(data);
    } catch (err) {
      setError('Не удалось загрузить историю.');
    }
  };

  const handleFeedback = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/feedbacks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ customer_id: id, ...newFeedback }),
      });
      if (!res.ok) throw new Error(`Ошибка HTTP: ${res.status}`);
      setNewFeedback({ rating: '', comment: '' });
      fetchHistory();
    } catch (err) {
      setError(`Не удалось отправить отзыв: ${err.message}`);
    }
  };

  if (error) {
    return (
      <div className={styles.container}>
        <h1>Ошибка</h1>
        <p className={styles.error}>{error}</p>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1>Личный кабинет клиента</h1>
      <h2>История взаимодействий</h2>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Тип</th>
            <th>Описание</th>
            <th>Дата</th>
          </tr>
        </thead>
        <tbody>
          {history.map(item => (
            <tr key={item.id}>
              <td>{item.interaction_type}</td>
              <td>{item.description}</td>
              <td>{new Date(item.interaction_date).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2>Оставить отзыв</h2>
      <div className={styles.form}>
        <select
          value={newFeedback.rating}
          onChange={(e) => setNewFeedback({ ...newFeedback, rating: e.target.value })}
        >
          <option value="">Оценка</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5</option>
        </select>
        <textarea
          placeholder="Комментарий"
          value={newFeedback.comment}
          onChange={(e) => setNewFeedback({ ...newFeedback, comment: e.target.value })}
        />
        <button onClick={handleFeedback}>Отправить отзыв</button>
      </div>
    </div>
  );
}