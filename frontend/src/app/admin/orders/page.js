'use client';

import { useState, useEffect } from 'react';
import styles from '../../styles/AdminOrders.module.css';

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [error, setError] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/orders', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`Ошибка HTTP: ${res.status}`);
      const data = await res.json();
      setOrders(data);
      setError(null);
    } catch (err) {
      console.error('Ошибка при загрузке заказов:', err.message);
      setError('Не удалось загрузить заказы. Проверьте подключение к серверу.');
    }
  };

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/orders/${orderId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error('Ошибка при обновлении статуса заказа');
      fetchOrders(); // Обновляем список после изменения
    } catch (err) {
      console.error('Ошибка при обновлении статуса:', err.message);
      setError('Не удалось обновить статус заказа.');
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/orders/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Ошибка при удалении заказа');
      fetchOrders(); // Обновляем список после удаления
    } catch (err) {
      console.error('Ошибка при удалении заказа:', err.message);
      setError('Не удалось удалить заказ.');
    }
  };

  return (
    <div className={styles.container}>
      <h1>Управление заказами</h1>
      {error && <p className={styles.error}>{error}</p>}

      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>Клиент</th>
            <th>Сумма</th>
            <th>Дата</th>
            <th>Статус</th>
            <th>Детали</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((order) => (
            <tr key={order.id}>
              <td>{order.id}</td>
              <td>{order.customer_name}</td>
              <td>{order.total_amount}</td>
              <td>{new Date(order.date).toLocaleDateString()}</td>
              <td>
                {editingOrder === order.id ? (
                  <select
                    value={order.status || 'pending'}
                    onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                  >
                    <option value="pending">Ожидает</option>
                    <option value="completed">Завершён</option>
                    <option value="cancelled">Отменён</option>
                  </select>
                ) : (
                  <span>{order.status || 'pending'}</span>
                )}
              </td>
              <td>
                <details>
                  <summary>Показать детали</summary>
                  <ul>
                    {order.items.map((item) => (
                      <li key={item.product_id}>
                        {item.product_name} - Кол-во: {item.quantity}, Цена: {item.price}
                      </li>
                    ))}
                  </ul>
                </details>
              </td>
              <td>
                <button onClick={() => setEditingOrder(order.id)}>Изменить статус</button>
                <button onClick={() => handleDelete(order.id)}>Удалить</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}