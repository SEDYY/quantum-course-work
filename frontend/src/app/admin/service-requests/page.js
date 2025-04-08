'use client';

import { useState, useEffect } from 'react';
import styles from '../../styles/AdminServiceRequests.module.css';

export default function AdminServiceRequests() {
  const [requests, setRequests] = useState([]);
  const [newRequest, setNewRequest] = useState({ customer_id: '', service_id: '', date: '', status: '' });
  const [editingRequest, setEditingRequest] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/service-requests', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`Ошибка HTTP: ${res.status}`);
      const data = await res.json();
      setRequests(data);
      setError(null);
    } catch (err) {
      console.error('Ошибка при загрузке заявок:', err.message);
      setError('Не удалось загрузить заявки. Проверьте подключение к серверу.');
    }
  };

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/service-requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newRequest),
      });
      if (!res.ok) throw new Error(`Ошибка HTTP: ${res.status}`);
      const createdRequest = await res.json();
      setRequests([...requests, createdRequest]);
      setNewRequest({ customer_id: '', service_id: '', date: '', status: '' });
      fetchRequests();
    } catch (err) {
      console.error('Ошибка при создании заявки:', err.message);
      setError('Не удалось создать заявку.');
    }
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/service-requests/${editingRequest.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editingRequest),
      });
      if (!res.ok) throw new Error('Ошибка при обновлении заявки');
      const updatedRequest = await res.json();
      setRequests(requests.map((r) => (r.id === updatedRequest.id ? updatedRequest : r)));
      setEditingRequest(null);
      fetchRequests();
    } catch (err) {
      console.error('Ошибка при обновлении заявки:', err.message);
      setError('Не удалось обновить заявку.');
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/service-requests/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Ошибка при удалении заявки');
      setRequests(requests.filter((r) => r.id !== id));
      fetchRequests();
    } catch (err) {
      console.error('Ошибка при удалении заявки:', err.message);
      setError('Не удалось удалить заявку.');
    }
  };

  return (
    <div className={styles.container}>
      <h1>Управление заявками на услуги</h1>
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.form}>
        <input
          type="number"
          placeholder="ID клиента"
          value={newRequest.customer_id}
          onChange={(e) => setNewRequest({ ...newRequest, customer_id: e.target.value })}
        />
        <input
          type="number"
          placeholder="ID услуги"
          value={newRequest.service_id}
          onChange={(e) => setNewRequest({ ...newRequest, service_id: e.target.value })}
        />
        <input
          type="datetime-local"
          value={newRequest.date}
          onChange={(e) => setNewRequest({ ...newRequest, date: e.target.value })}
        />
        <select
          value={newRequest.status}
          onChange={(e) => setNewRequest({ ...newRequest, status: e.target.value })}
        >
          <option value="">Выберите статус</option>
          <option value="pending">Ожидает</option>
          <option value="completed">Завершена</option>
          <option value="cancelled">Отменена</option>
        </select>
        <button onClick={handleCreate}>Добавить заявку</button>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>ID</th>
            <th>ID клиента</th>
            <th>ID услуги</th>
            <th>Дата</th>
            <th>Статус</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id}>
              <td>{request.id}</td>
              <td>{request.customer_id}</td>
              <td>{request.service_id}</td>
              <td>{new Date(request.date).toLocaleString()}</td>
              <td>{request.status}</td>
              <td>
                <button onClick={() => setEditingRequest(request)}>Редактировать</button>
                <button onClick={() => handleDelete(request.id)}>Удалить</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingRequest && (
        <div className={styles.form}>
          <h2>Редактировать заявку</h2>
          <input
            type="number"
            value={editingRequest.customer_id}
            onChange={(e) => setEditingRequest({ ...editingRequest, customer_id: e.target.value })}
          />
          <input
            type="number"
            value={editingRequest.service_id}
            onChange={(e) => setEditingRequest({ ...editingRequest, service_id: e.target.value })}
          />
          <input
            type="datetime-local"
            value={editingRequest.date}
            onChange={(e) => setEditingRequest({ ...editingRequest, date: e.target.value })}
          />
          <select
            value={editingRequest.status}
            onChange={(e) => setEditingRequest({ ...editingRequest, status: e.target.value })}
          >
            <option value="pending">Ожидает</option>
            <option value="completed">Завершена</option>
            <option value="cancelled">Отменена</option>
          </select>
          <button onClick={handleUpdate}>Сохранить изменения</button>
          <button onClick={() => setEditingRequest(null)}>Отмена</button>
        </div>
      )}
    </div>
  );
}