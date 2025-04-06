const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Настройка подключения к базе данных
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'quantum',
  password: '9292',
  port: 5432,
});

// Маршрут для получения списка продуктов
router.get('/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('Ошибка сервера: ' + err.message);
  }
});

// Маршрут для создания заказа
router.post('/orders', async (req, res) => {
  const { customer_id, total_amount, items } = req.body;
  try {
    const orderResult = await pool.query(
      'INSERT INTO orders (customer_id, total_amount) VALUES ($1, $2) RETURNING id',
      [customer_id, total_amount]
    );
    const orderId = orderResult.rows[0].id;

    for (const item of items) {
      await pool.query(
        'INSERT INTO order_items (order_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [orderId, item.product_id, item.quantity, item.price]
      );
    }

    res.status(201).json({ message: 'Заказ успешно создан', orderId });
  } catch (err) {
    res.status(500).send('Ошибка при создании заказа: ' + err.message);
  }
});

// Маршрут для создания продукта
router.post('/products', async (req, res) => {
  const { name, description, price, stock } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO products (name, description, price, stock) VALUES ($1, $2, $3, $4) RETURNING *',
      [name, description, price, stock]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).send('Ошибка при создании продукта: ' + err.message);
  }
});

// Маршрут для обновления продукта
router.put('/products/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, price, stock } = req.body;
  try {
    const result = await pool.query(
      'UPDATE products SET name = $1, description = $2, price = $3, stock = $4 WHERE id = $5 RETURNING *',
      [name, description, price, stock, id]
    );
    if (result.rowCount === 0) {
      res.status(404).send('Продукт не найден');
    } else {
      res.json(result.rows[0]);
    }
  } catch (err) {
    res.status(500).send('Ошибка при обновлении продукта: ' + err.message);
  }
});

// Маршрут для удаления продукта
router.delete('/products/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM products WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      res.status(404).send('Продукт не найден');
    } else {
      res.status(204).send();
    }
  } catch (err) {
    res.status(500).send('Ошибка при удалении продукта: ' + err.message);
  }
});

router.get('/services', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM services');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('Ошибка сервера: ' + err.message);
  }
});

router.post('/services', async (req, res) => {
  const { name, description, price } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO services (name, description, price) VALUES ($1, $2, $3) RETURNING *',
      [name, description, price]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).send('Ошибка при создании услуги: ' + err.message);
  }
});

router.put('/services/:id', async (req, res) => {
  const { id } = req.params;
  const { name, description, price } = req.body;
  try {
    const result = await pool.query(
      'UPDATE services SET name = $1, description = $2, price = $3 WHERE id = $4 RETURNING *',
      [name, description, price, id]
    );
    if (result.rowCount === 0) {
      res.status(404).send('Услуга не найдена');
    } else {
      res.json(result.rows[0]);
    }
  } catch (err) {
    res.status(500).send('Ошибка при обновлении услуги: ' + err.message);
  }
});

router.delete('/services/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM services WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      res.status(404).send('Услуга не найдена');
    } else {
      res.status(204).send();
    }
  } catch (err) {
    res.status(500).send('Ошибка при удалении услуги: ' + err.message);
  }
});

router.get('/service-requests', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM service_requests');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('Ошибка сервера: ' + err.message);
  }
});

router.post('/service-requests', async (req, res) => {
  const { customer_id, service_id, date, status } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO service_requests (customer_id, service_id, date, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [customer_id, service_id, date, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).send('Ошибка при создании заявки: ' + err.message);
  }
});
module.exports = router;