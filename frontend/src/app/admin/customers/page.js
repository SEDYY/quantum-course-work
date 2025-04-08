'use client';

import { useState, useEffect } from 'react';
import styles from '../../styles/AdminCustomers.module.css';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [newCustomer, setNewCustomer] = useState({ name: '', email: '', phone: '' });
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/customers', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`Ошибка HTTP: ${res.status}`);
      const data = await res.json();
      setCustomers(data);
      setError(null);
    } catch (err) {
      console.error('Ошибка при загрузке клиентов:', err.message);
      setError('Не удалось загрузить клиентов. Проверьте подключение к серверу.');
    }
  };

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/customers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newCustomer),
      });
      if (!res.ok) throw new Error(`Ошибка HTTP: ${res.status}`);
      const createdCustomer = await res.json();
      setCustomers([...customers, createdCustomer]);
      setNewCustomer({ name: '', email: '', phone: '' });
      fetchCustomers();
    } catch (err) {
      console.error('Ошибка при создании клиента:', err.message);
      setError('Не удалось создать клиента.');
    }
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/customers/${editingCustomer.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editingCustomer),
      });
      if (!res.ok) throw new Error('Ошибка при обновлении клиента');
      const updatedCustomer = await res.json();
      setCustomers(customers.map((c) => (c.id === updatedCustomer.id ? updatedCustomer : c)));
      setEditingCustomer(null);
      fetchCustomers();
    } catch (err) {
      console.error('Ошибка при обновлении клиента:', err.message);
      setError('Не удалось обновить клиента.');
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/customers/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Ошибка при удалении клиента');
      setCustomers(customers.filter((c) => c.id !== id));
      fetchCustomers();
    } catch (err) {
      console.error('Ошибка при удалении клиента:', err.message);
      setError('Не удалось удалить клиента.');
    }
  };

  return (
    <div className={styles.container}>
      <h1>Управление клиентами</h1>
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.form}>
        <input
          type="text"
          placeholder="Имя"
          value={newCustomer.name}
          onChange={(e) => setNewCustomer({ ...newCustomer, name: e.target.value })}
        />
        <input
          type="email"
          placeholder="Email"
          value={newCustomer.email}
          onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
        />
        <input
          type="text"
          placeholder="Телефон"
          value={newCustomer.phone}
          onChange={(e) => setNewCustomer({ ...newCustomer, phone: e.target.value })}
        />
        <button onClick={handleCreate}>Добавить клиента</button>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Имя</th>
            <th>Email</th>
            <th>Телефон</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {customers.map((customer) => (
            <tr key={customer.id}>
              <td>{customer.name}</td>
              <td>{customer.email}</td>
              <td>{customer.phone}</td>
              <td>
                <button onClick={() => setEditingCustomer(customer)}>Редактировать</button>
                <button onClick={() => handleDelete(customer.id)}>Удалить</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingCustomer && (
        <div className={styles.form}>
          <h2>Редактировать клиента</h2>
          <input
            type="text"
            value={editingCustomer.name}
            onChange={(e) => setEditingCustomer({ ...editingCustomer, name: e.target.value })}
          />
          <input
            type="email"
            value={editingCustomer.email}
            onChange={(e) => setEditingCustomer({ ...editingCustomer, email: e.target.value })}
          />
          <input
            type="text"
            value={editingCustomer.phone}
            onChange={(e) => setEditingCustomer({ ...editingCustomer, phone: e.target.value })}
          />
          <button onClick={handleUpdate}>Сохранить изменения</button>
          <button onClick={() => setEditingCustomer(null)}>Отмена</button>
        </div>
      )}
    </div>
  );
}