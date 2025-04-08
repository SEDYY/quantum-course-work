const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Настройка подключения к базе данных
const pool = require('../db');

// --- Продукты ---

// Получение списка продуктов
router.get('/products', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('Ошибка сервера: ' + err.message);
  }
});

// Создание продукта
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

// Обновление продукта
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

// Удаление продукта
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

// --- Услуги ---

// Получение списка услуг
router.get('/services', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM services');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('Ошибка сервера: ' + err.message);
  }
});

// Создание услуги
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

// Обновление услуги
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

// Удаление услуги
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

// --- Заявки ---

// Получение списка заявок
router.get('/service-requests', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM service_requests');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('Ошибка сервера: ' + err.message);
  }
});

// Создание заявки
router.post('/service-requests', async (req, res) => {
  const { customer_id, service_id, date, status } = req.body;
  console.log('Request body:', req.body);
  try {
    // Приводим customer_id и service_id к числам
    const customerId = parseInt(customer_id, 10);
    const serviceId = parseInt(service_id, 10);

    if (isNaN(customerId) || isNaN(serviceId)) {
      console.log('Validation failed: customer_id or service_id is not a number');
      return res.status(400).json({ message: 'customer_id и service_id должны быть числами' });
    }

    // Проверяем, существуют ли customer_id и service_id
    const customerCheck = await pool.query('SELECT 1 FROM customers WHERE id = $1', [customerId]);
    if (customerCheck.rowCount === 0) {
      console.log(`Customer with ID ${customerId} not found`);
      return res.status(400).json({ message: `Клиент с ID ${customerId} не найден` });
    }

    const serviceCheck = await pool.query('SELECT 1 FROM services WHERE id = $1', [serviceId]);
    if (serviceCheck.rowCount === 0) {
      console.log(`Service with ID ${serviceId} not found`);
      return res.status(400).json({ message: `Услуга с ID ${serviceId} не найдена` });
    }

    // Проверяем формат даты
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      console.log('Invalid date format:', date);
      return res.status(400).json({ message: 'Неверный формат даты' });
    }

    const result = await pool.query(
      'INSERT INTO service_requests (customer_id, service_id, date, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [customerId, serviceId, parsedDate, status]
    );
    console.log('Created service request:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при создании заявки:', err);
    res.status(500).json({ message: 'Ошибка сервера: ' + err.message });
  }
});

// --- Заказы ---

// Создание заказа
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

// --- Клиенты ---

// Получение списка клиентов
router.get('/customers', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM customers');
    res.json(result.rows);
  } catch (err) {
    res.status(500).send('Ошибка сервера: ' + err.message);
  }
});

// Создание клиента
router.post('/customers', async (req, res) => {
  const { name, email, phone } = req.body;
  try {
    const result = await pool.query(
      'INSERT INTO customers (name, email, phone) VALUES ($1, $2, $3) RETURNING *',
      [name, email, phone]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).send('Ошибка при создании клиента: ' + err.message);
  }
});

// Обновление клиента
router.put('/customers/:id', async (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;
  try {
    const result = await pool.query(
      'UPDATE customers SET name = $1, email = $2, phone = $3 WHERE id = $4 RETURNING *',
      [name, email, phone, id]
    );
    if (result.rowCount === 0) {
      res.status(404).send('Клиент не найден');
    } else {
      res.json(result.rows[0]);
    }
  } catch (err) {
    res.status(500).send('Ошибка при обновлении клиента: ' + err.message);
  }
});

// Удаление клиента
router.delete('/customers/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM customers WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      res.status(404).send('Клиент не найден');
    } else {
      res.status(204).send();
    }
  } catch (err) {
    res.status(500).send('Ошибка при удалении клиента: ' + err.message);
  }
});

router.get('/orders', async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT o.id, o.customer_id, o.total_amount, o.date, c.name AS customer_name
      FROM orders o
      JOIN customers c ON o.customer_id = c.id
      ORDER BY o.date DESC
    `);
    const orders = result.rows;

    // Для каждого заказа получаем элементы заказа
    for (let order of orders) {
      const itemsResult = await pool.query(
        'SELECT oi.product_id, oi.quantity, oi.price, p.name AS product_name FROM order_items oi JOIN products p ON oi.product_id = p.id WHERE oi.order_id = $1',
        [order.id]
      );
      order.items = itemsResult.rows;
    }

    res.json(orders);
  } catch (err) {
    res.status(500).send('Ошибка сервера: ' + err.message);
  }
});

router.put('/orders/:id', async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const result = await pool.query(
      'UPDATE orders SET status = $1 WHERE id = $2 RETURNING *',
      [status, id]
    );
    if (result.rowCount === 0) {
      res.status(404).send('Заказ не найден');
    } else {
      res.json(result.rows[0]);
    }
  } catch (err) {
    res.status(500).send('Ошибка при обновлении заказа: ' + err.message);
  }
});

router.delete('/orders/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM orders WHERE id = $1', [id]);
    if (result.rowCount === 0) {
      res.status(404).send('Заказ не найден');
    } else {
      res.status(204).send();
    }
  } catch (err) {
    res.status(500).send('Ошибка при удалении заказа: ' + err.message);
  }
});
module.exports = router;