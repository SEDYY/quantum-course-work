'use client';

import { useState, useEffect } from 'react';
import styles from '../../styles/AdminServices.module.css';

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({ name: '', description: '', price: '' });
  const [editingService, setEditingService] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/services', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`Ошибка HTTP: ${res.status}`);
      const data = await res.json();
      setServices(data);
      setError(null);
    } catch (err) {
      console.error('Ошибка при загрузке услуг:', err.message);
      setError('Не удалось загрузить услуги. Проверьте подключение к серверу.');
    }
  };

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/services', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newService),
      });
      if (!res.ok) throw new Error(`Ошибка HTTP: ${res.status}`);
      const createdService = await res.json();
      setServices([...services, createdService]);
      setNewService({ name: '', description: '', price: '' });
      fetchServices();
    } catch (err) {
      console.error('Ошибка при создании услуги:', err.message);
      setError('Не удалось создать услугу.');
    }
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/services/${editingService.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editingService),
      });
      if (!res.ok) throw new Error('Ошибка при обновлении услуги');
      const updatedService = await res.json();
      setServices(services.map((s) => (s.id === updatedService.id ? updatedService : s)));
      setEditingService(null);
      fetchServices();
    } catch (err) {
      console.error('Ошибка при обновлении услуги:', err.message);
      setError('Не удалось обновить услугу.');
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/services/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Ошибка при удалении услуги');
      setServices(services.filter((s) => s.id !== id));
      fetchServices();
    } catch (err) {
      console.error('Ошибка при удалении услуги:', err.message);
      setError('Не удалось удалить услугу.');
    }
  };

  return (
    <div className={styles.container}>
      <h1>Управление услугами</h1>
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.form}>
        <input
          type="text"
          placeholder="Название"
          value={newService.name}
          onChange={(e) => setNewService({ ...newService, name: e.target.value })}
        />
        <textarea
          placeholder="Описание"
          value={newService.description}
          onChange={(e) => setNewService({ ...newService, description: e.target.value })}
        />
        <input
          type="number"
          placeholder="Цена"
          value={newService.price}
          onChange={(e) => setNewService({ ...newService, price: e.target.value })}
        />
        <button onClick={handleCreate}>Добавить услугу</button>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Название</th>
            <th>Описание</th>
            <th>Цена</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {services.map((service) => (
            <tr key={service.id}>
              <td>{service.name}</td>
              <td>{service.description}</td>
              <td>{service.price}</td>
              <td>
                <button onClick={() => setEditingService(service)}>Редактировать</button>
                <button onClick={() => handleDelete(service.id)}>Удалить</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingService && (
        <div className={styles.form}>
          <h2>Редактировать услугу</h2>
          <input
            type="text"
            value={editingService.name}
            onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
          />
          <textarea
            value={editingService.description}
            onChange={(e) => setEditingService({ ...editingService, description: e.target.value })}
          />
          <input
            type="number"
            value={editingService.price}
            onChange={(e) => setEditingService({ ...editingService, price: e.target.value })}
          />
          <button onClick={handleUpdate}>Сохранить изменения</button>
          <button onClick={() => setEditingService(null)}>Отмена</button>
        </div>
      )}
    </div>
  );
}