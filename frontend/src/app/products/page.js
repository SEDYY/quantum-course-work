// app/products/page.js
'use client';

import { useState, useEffect } from 'react';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) throw new Error('Токен отсутствует. Пожалуйста, войдите в систему.');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/products`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || 'Ошибка загрузки товаров');
        setProducts(data);
      } catch (err) {
        setError(err.message);
      }
    };
    fetchProducts();
  }, []);

  return (
    <div>
      <h1>Товары</h1>
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <ul>
        {products.map((product) => (
          <li key={product.id}>
            {product.name} - {product.price} руб.
          </li>
        ))}
      </ul>
    </div>
  );
}