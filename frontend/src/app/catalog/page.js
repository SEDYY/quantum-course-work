"use client"
import { useState, useEffect } from 'react';
import styles from '../styles/Catalog.module.css';

export default function Catalog() {
  const [products, setProducts] = useState([]);

  // Получаем продукты с бэкенда при загрузке страницы
  useEffect(() => {
    fetch('http://localhost:3001/api/products')
      .then((res) => res.json())
      .then((data) => setProducts(data))
      .catch((err) => console.error('Ошибка загрузки продуктов:', err));
  }, []);

  return (
    <div className={styles.container}>
      <h1>Каталог продуктов</h1>
      <div className={styles.productList}>
        {products.map((product) => (
          <div key={product.id} className={styles.productCard}>
            <h2>{product.name}</h2>
            <p>{product.description}</p>
            <p>Цена: {product.price} руб.</p>
          </div>
        ))}
      </div>
    </div>
  );
}