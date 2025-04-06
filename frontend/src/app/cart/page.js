"use client"
import { useState } from 'react';

export default function Cart() {
  const [order, setOrder] = useState({
    customer_id: 1, // Пример ID клиента
    total_amount: 15000,
    items: [{ product_id: 1, quantity: 2, price: 7500 }],
  });

  const handleOrderSubmit = async () => {
    const response = await fetch('http://localhost:3001/api/orders', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(order),
    });
    if (response.ok) {
      alert('Заказ успешно создан!');
    } else {
      alert('Ошибка при создании заказа');
    }
  };

  return (
    <div>
      <h1>Корзина</h1>
      <button onClick={handleOrderSubmit}>Оформить заказ</button>
    </div>
  );
}