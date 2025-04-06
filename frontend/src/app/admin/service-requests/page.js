'use client';

import { useState, useEffect } from 'react';
import styles from '../../styles/AdminServiceRequests.module.css'

export default function AdminServiceRequests() {
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    const res = await fetch('http://localhost:3001/api/service-requests');
    const data = await res.json();
    setRequests(data);
  };

  return (
    <div className={styles.container}>
      <h1>Заявки на услуги</h1>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Клиент</th>
            <th>Услуга</th>
            <th>Дата</th>
            <th>Статус</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => (
            <tr key={request.id}>
              <td>{request.customer_id}</td>
              <td>{request.service_id}</td>
              <td>{new Date(request.date).toLocaleDateString()}</td>
              <td>{request.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}