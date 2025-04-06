"use client"
import { useState, useEffect } from 'react';
import styles from '../../styles/AdminProducts.module.css';

export default function AdminProducts() {
  const [products, setProducts] = useState([]);
  const [newProduct, setNewProduct] = useState({ name: '', description: '', price: '', stock: '' });
  const [editingProduct, setEditingProduct] = useState(null);

  // Загрузка продуктов при монтировании компонента
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    const res = await fetch('http://localhost:3001/api/products');
    const data = await res.json();
    setProducts(data);
  };

  // Создание нового продукта
  const handleCreate = async () => {
    const res = await fetch('http://localhost:3001/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newProduct),
    });
    if (res.ok) {
      const createdProduct = await res.json();
      setProducts([...products, createdProduct]);
      setNewProduct({ name: '', description: '', price: '', stock: '' });
    }
  };

  // Обновление продукта
  const handleUpdate = async () => {
    const res = await fetch(`http://localhost:3001/api/products/${editingProduct.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editingProduct),
    });
    if (res.ok) {
      const updatedProduct = await res.json();
      setProducts(products.map((p) => (p.id === updatedProduct.id ? updatedProduct : p)));
      setEditingProduct(null);
    }
  };

  // Удаление продукта
  const handleDelete = async (id) => {
    const res = await fetch(`http://localhost:3001/api/products/${id}`, { method: 'DELETE' });
    if (res.ok) {
      setProducts(products.filter((p) => p.id !== id));
    }
  };

  return (
    <div className={styles.container}>
      <h1>Управление продуктами</h1>

      {/* Форма для добавления продукта */}
      <div className={styles.form}>
        <input
          type="text"
          placeholder="Название"
          value={newProduct.name}
          onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
        />
        <input
          type="text"
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
          placeholder="Запас"
          value={newProduct.stock}
          onChange={(e) => setNewProduct({ ...newProduct, stock: e.target.value })}
        />
        <button onClick={handleCreate}>Добавить продукт</button>
      </div>

      {/* Таблица продуктов */}
      <table className={styles.table}>
        <thead>
          <tr>
            <th>Название</th>
            <th>Описание</th>
            <th>Цена</th>
            <th>Запас</th>
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

      {/* Форма для редактирования продукта */}
      {editingProduct && (
        <div className={styles.form}>
          <h2>Редактировать продукт</h2>
          <input
            type="text"
            value={editingProduct.name}
            onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
          />
          <input
            type="text"
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