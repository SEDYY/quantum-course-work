'use client';

import { useState, useEffect } from 'react';
import styles from '../../styles/AdminProducts.module.css';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', stock: '' });
  const [editingProduct, setEditingProduct] = useState(null);
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

  const handleCreate = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:3001/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newProduct),
      });
      if (!res.ok) throw new Error(`Ошибка HTTP: ${res.status}`);
      const createdProduct = await res.json();
      setProducts([...products, createdProduct]);
      setNewProduct({ name: '', description: '', price: '', stock: '' });
      fetchProducts();
    } catch (err) {
      console.error('Ошибка при создании продукта:', err.message);
      setError('Не удалось создать продукт.');
    }
  };

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(editingProduct),
      });
      if (!res.ok) throw new Error('Ошибка при обновлении продукта');
      const updatedProduct = await res.json();
      setProducts(products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
      setEditingProduct(null);
      fetchProducts();
    } catch (err) {
      console.error('Ошибка при обновлении продукта:', err.message);
      setError('Не удалось обновить продукт.');
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`http://localhost:3001/api/products/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!res.ok) throw new Error('Ошибка при удалении продукта');
      setProducts(products.filter((p) => p.id !== id));
      fetchProducts();
    } catch (err) {
      console.error('Ошибка при удалении продукта:', err.message);
      setError('Не удалось удалить продукт.');
    }
  };

  return (
    <div className={styles.container}>
      <h1>Управление продуктами</h1>
      {error && <p className={styles.error}>{error}</p>}

      <div className={styles.form}>
        <input
          type="text"
          placeholder="Название"
          value={newProduct.name}
          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
        />
        <textarea
          placeholder="Описание"
          value={newProduct.description}
          onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
        />
        <input
          type="number"
          placeholder="Цена"
          value={newProduct.price}
          onChange={(e) => setNewProduct({ ...newProduct, price: e.target.value })}
        />
        <input
          type="number"
          placeholder="Количество на складе"
          value={newProduct.stock}
          onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
        />
        <button onClick={handleCreate}>Добавить продукт</button>
      </div>

      <table className={styles.table}>
        <thead>
          <tr>
            <th>Название</th>
            <th>Описание</th>
            <th>Цена</th>
            <th>Склад</th>
            <th>Действия</th>
          </tr>
        </thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id}>
              <td>{product.name}</td>
              <td>{product.description}</td>
              <td>{product.price}</td>
              <td>{product.stock}</td>
              <td>
                <button onClick={() => setEditingProduct(product)}>Редактировать</button>
                <button onClick={() => handleDelete(product.id)}>Удалить</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {editingProduct && (
        <div className={styles.form}>
          <h2>Редактировать продукт</h2>
          <input
            type="text"
            value={editingProduct.name}
            onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
          />
          <textarea
            value={editingProduct.description}
            onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
          />
          <input
            type="number"
            value={editingProduct.price}
            onChange={(e) => setEditingProduct({ ...editingProduct, price: e.target.value })}
          />
          <input
            type="number"
            value={editingProduct.stock}
            onChange={(e) => setEditingProduct({ ...editingProduct, stock: e.target.value })}
          />
          <button onClick={handleUpdate}>Сохранить изменения</button>
          <button onClick={() => setEditingProduct(null)}>Отмена</button>
        </div>
      )}
    </div>
  );
}