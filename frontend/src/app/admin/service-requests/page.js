// app/admin/service-requests/page.js
'use client';

import { useState, useEffect } from 'react';

export default function ServiceRequests() {
  const [requests, setRequests] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Токен отсутствует. Пожалуйста, войдите в систему.');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/service-requests`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Ошибка загрузки заявок');
        setRequests(data.requests);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchRequests();
  }, []);

  return (
    <div>
      <h1>Заявки на услуги</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <table border="1">
        <thead>
          <tr>
            <th>ID</th>
            <th>Клиент</th>
            <th>Услуга</th>
            <th>Дата</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id}>
              <td>{request.id}</td>
              <td>{request.customer_name}</td>
              <td>{request.service_name}</td>
              <td>{new Date(request.date).toLocaleString()}</td>
              <td>{request.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}