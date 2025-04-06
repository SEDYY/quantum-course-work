'use client';

import { useState, useEffect } from 'react';
import styles from '../../styles/AdminServices.module.css'

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [newService, setNewService] = useState({ name: '', description: '', price: '' });
  const [editingService, setEditingService] = useState(null);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const res = await fetch('http://localhost:3001/api/services');
    const data = await res.json();
    setServices(data);
  };

  const handleCreate = async () => {
    const res = await fetch('http://localhost:3001/api/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newService),
    });
    if (res.ok) {
      const createdService = await res.json();
      setServices([...services, createdService]);
      setNewService({ name: '', description: '', price: '' });
    }
  };

  const handleUpdate = async () => {
    const res = await fetch(`http://localhost:3001/api/services/${editingService.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingService),
    });
    if (res.ok) {
      const updatedService = await res.json();
      setServices(services.map((s) => (s.id === updatedService.id ? updatedService : s)));
      setEditingService(null);
    }
  };

  const handleDelete = async (id) => {
    const res = await fetch(`http://localhost:3001/api/services/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setServices(services.filter((s) => s.id !== id));
    }
  };

  return (
    <div className={styles.container}>
      <h1>Управление услугами</h1>

      {/* Форма для добавления услуги */}
      <div className={styles.form}>
        <input
          type="text"
          placeholder="Название"
          value={newService.name}
          onChange={(e) => setNewService({ ...newService, name: e.target.value })}
        />
        <input
          type="text"
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

      {/* Таблица услуг */}
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

      {/* Форма для редактирования услуги */}
      {editingService && (
        <div className={styles.form}>
          <h2>Редактировать услугу</h2>
          <input
            type="text"
            value={editingService.name}
            onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
          />
          <input
            type="text"
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