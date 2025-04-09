// app/admin/reports/page.js
'use client';

import { useState, useEffect } from 'react';

export default function Reports() {
  const [reports, setReports] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchReports = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Токен отсутствует. Пожалуйста, войдите в систему.');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/reports/sales?startDate=2025-01-01&endDate=2025-12-31`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Ошибка загрузки отчётов');
        setReports(data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchReports();
  }, []);

  return (
    <div>
      <h1>Отчёты по продажам</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {reports.map((report) => (
          <li key={report.id}>
            Продажа #{report.id} - {report.total_amount} руб. (Дата: {new Date(report.sale_date).toLocaleString()})
          </li>
        ))}
      </ul>
    </div>
  );
}