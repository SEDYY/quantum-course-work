// app/admin/stock/page.js
'use client';

import { useState, useEffect } from 'react';

export default function Stock() {
  const [stock, setStock] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStock = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Токен отсутствует. Пожалуйста, войдите в систему.');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/stock`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Ошибка загрузки данных склада');
        setStock(data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchStock();
  }, []);

  return (
    <div>
      <h1>Склад</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <table border="1">
        <thead>
          <tr>
            <th>Товар</th>
            <th>Количество</th>
          </tr>
        </thead>
        <tbody>
          {stock.map((item) => (
            <tr key={item.id}>
              <td>{item.product_id}</td>
              <td>{item.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}