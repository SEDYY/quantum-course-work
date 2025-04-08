'use client';

import { useState, useEffect } from 'react';
import styles from '../styles/Catalog.module.css';

export default function Catalog() {
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/products', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error(`Ошибка HTTP: ${res.status}`);
      const data = await res.json();
      setProducts(data);
      setError(null);
    } catch (err) {
      console.error('Ошибка при загрузке продуктов:', err.message);
      setError('Не удалось загрузить продукты. Проверьте подключение к серверу.');
    }
  };

  return (
    <div className={styles.container}>
      <h1>Каталог продуктов</h1>
      {error && <p className={styles.error}>{error}</p>}
      <div className={styles.productList}>
        {products.map((product) => (
          <div key={product.id} className={styles.productCard}>
            <h2>{product.name}</h2>
            <p>{product.description}</p>
            <p>Цена: {product.price} руб.</p>
            <p>В наличии: {product.stock} шт.</p>
          </div>
        ))}
      </div>
    </div>
  );
}