// app/admin/sales/page.js
'use client';

import { useState, useEffect } from 'react';

export default function Sales() {
  const [sales, setSales] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchSales = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Токен отсутствует. Пожалуйста, войдите в систему.');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/sales`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Ошибка загрузки продаж');
        setSales(data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchSales();
  }, []);

  return (
    <div>
      <h1>Продажи</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {sales.map((sale) => (
          <li key={sale.id}>
            Продажа #{sale.id} - {sale.total_amount} руб. (Клиент: {sale.customer_name || 'Не указан'})
          </li>
        ))}
      </ul>
    </div>
  );
}