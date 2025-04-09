const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const pool = require('../db');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');
const fs = require('fs');

// Middleware для аутентификации
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) {
    return res.status(401).json({ message: 'Токен не предоставлен' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_jwt_secret');
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ message: 'Недействительный токен' });
  }
};

// Middleware для проверки прав администратора
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Доступ запрещён: требуется роль администратора' });
  }
  next();
};

// --- Клиенты ---

// Получение списка клиентов (доступно только админу)
router.get('/customers', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name, email, phone FROM customers');
    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка при получении клиентов:', err);
    res.status(500).json({ message: 'Ошибка сервера: ' + err.message });
  }
});

// Получение истории клиента (доступно клиенту или админу)
router.get('/customers/:id/history', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    if (req.user.id !== parseInt(id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещён' });
    }
    const result = await pool.query(
      'SELECT * FROM customer_history WHERE customer_id = $1 ORDER BY interaction_date DESC',
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка при получении истории клиента:', err);
    res.status(500).json({ message: 'Ошибка сервера: ' + err.message });
  }
});

// Добавление отзыва
router.post('/feedbacks', authenticateToken, async (req, res) => {
  const { customer_id, rating, comment } = req.body;
  try {
    if (req.user.id !== parseInt(customer_id) && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Доступ запрещён' });
    }
    const result = await pool.query(
      'INSERT INTO feedbacks (customer_id, rating, comment) VALUES ($1, $2, $3) RETURNING *',
      [customer_id, rating, comment]
    );

    // Добавляем запись в историю
    await pool.query(
      'INSERT INTO customer_history (customer_id, interaction_type, interaction_id, description) VALUES ($1, $2, $3, $4)',
      [customer_id, 'feedback', result.rows[0].id, `Оставлен отзыв: ${rating}/5`]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при добавлении отзыва:', err);
    res.status(500).json({ message: 'Ошибка сервера: ' + err.message });
  }
});

// --- Услуги ---

// Получение списка услуг (доступно всем авторизованным)
router.get('/services', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT id, name FROM services');
    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка при получении услуг:', err);
    res.status(500).json({ message: 'Ошибка сервера: ' + err.message });
  }
});

// --- Заявки на услуги ---

// Получение списка заявок (доступно только админу)
router.get('/service-requests', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, startDate, endDate, search, sortBy = 'date', sortOrder = 'DESC', page = 1, limit = 10 } = req.query;

    let query = `
      SELECT sr.id, sr.customer_id, sr.service_id, sr.date, sr.status,
             c.name AS customer_name, s.name AS service_name
      FROM service_requests sr
      JOIN customers c ON sr.customer_id = c.id
      JOIN services s ON sr.service_id = s.id
    `;
    const queryParams = [];

    const conditions = [];
    if (status) {
      conditions.push(`sr.status = $${queryParams.length + 1}`);
      queryParams.push(status);
    }
    if (startDate && endDate) {
      conditions.push(`sr.date BETWEEN $${queryParams.length + 1} AND $${queryParams.length + 2}`);
      queryParams.push(startDate, endDate);
    }
    if (search) {
      conditions.push(`(c.name ILIKE $${queryParams.length + 1} OR s.name ILIKE $${queryParams.length + 1})`);
      queryParams.push(`%${search}%`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    const validSortFields = ['id', 'date', 'status'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'date';
    const sortDirection = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';
    query += ` ORDER BY sr.${sortField} ${sortDirection}`;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    query += ` LIMIT $${queryParams.length + 1} OFFSET $${queryParams.length + 2}`;
    queryParams.push(parseInt(limit), offset);

    const result = await pool.query(query, queryParams);
    console.log('Fetched service requests:', result.rows);

    const countQuery = `
      SELECT COUNT(*)
      FROM service_requests sr
      JOIN customers c ON sr.customer_id = c.id
      JOIN services s ON sr.service_id = s.id
      ${conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''}
    `;
    const countResult = await pool.query(countQuery, queryParams.slice(0, queryParams.length - 2));
    const totalRecords = parseInt(countResult.rows[0].count);

    res.json({
      requests: result.rows,
      totalRecords,
      currentPage: parseInt(page),
      totalPages: Math.ceil(totalRecords / parseInt(limit)),
    });
  } catch (err) {
    console.error('Ошибка при получении заявок:', err);
    res.status(500).json({ message: 'Ошибка сервера: ' + err.message });
  }
});

// Создание заявки (доступно только админу)
router.post('/service-requests', authenticateToken, requireAdmin, async (req, res) => {
  const { customer_id, service_id, date, status } = req.body;
  console.log('Request body:', req.body);
  try {
    const customerId = parseInt(customer_id, 10);
    const serviceId = parseInt(service_id, 10);

    if (isNaN(customerId) || isNaN(serviceId)) {
      return res.status(400).json({ message: 'customer_id и service_id должны быть числами' });
    }

    const customerCheck = await pool.query('SELECT 1 FROM customers WHERE id = $1', [customerId]);
    if (customerCheck.rowCount === 0) {
      return res.status(400).json({ message: `Клиент с ID ${customerId} не найден` });
    }

    const serviceCheck = await pool.query('SELECT 1 FROM services WHERE id = $1', [serviceId]);
    if (serviceCheck.rowCount === 0) {
      return res.status(400).json({ message: `Услуга с ID ${serviceId} не найдена` });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Неверный формат даты' });
    }

    const result = await pool.query(
      'INSERT INTO service_requests (customer_id, service_id, date, status) VALUES ($1, $2, $3, $4) RETURNING *',
      [customerId, serviceId, parsedDate, status]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при создании заявки:', err);
    res.status(500).json({ message: 'Ошибка сервера: ' + err.message });
  }
});

// Обновление заявки (доступно только админу)
router.put('/service-requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { customer_id, service_id, date, status } = req.body;
  try {
    const customerId = parseInt(customer_id, 10);
    const serviceId = parseInt(service_id, 10);

    if (isNaN(customerId) || isNaN(serviceId)) {
      return res.status(400).json({ message: 'customer_id и service_id должны быть числами' });
    }

    const customerCheck = await pool.query('SELECT 1 FROM customers WHERE id = $1', [customerId]);
    if (customerCheck.rowCount === 0) {
      return res.status(400).json({ message: `Клиент с ID ${customerId} не найден` });
    }

    const serviceCheck = await pool.query('SELECT 1 FROM services WHERE id = $1', [serviceId]);
    if (serviceCheck.rowCount === 0) {
      return res.status(400).json({ message: `Услуга с ID ${serviceId} не найдена` });
    }

    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      return res.status(400).json({ message: 'Неверный формат даты' });
    }

    const result = await pool.query(
      'UPDATE service_requests SET customer_id = $1, service_id = $2, date = $3, status = $4 WHERE id = $5 RETURNING *',
      [customerId, serviceId, parsedDate, status, id]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Заявка не найдена' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Ошибка при обновлении заявки:', err);
    res.status(500).json({ message: 'Ошибка сервера: ' + err.message });
  }
});

// Удаление заявки (доступно только админу)
router.delete('/service-requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query('DELETE FROM service_requests WHERE id = $1 RETURNING *', [id]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Заявка не найдена' });
    }
    res.json({ message: 'Заявка удалена' });
  } catch (err) {
    console.error('Ошибка при удалении заявки:', err);
    res.status(500).json({ message: 'Ошибка сервера: ' + err.message });
  }
});

// --- Продажа комплектующих ---

// Получение списка товаров
router.get('/products', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM products');
    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка при получении товаров:', err);
    res.status(500).json({ message: 'Ошибка сервера: ' + err.message });
  }
});

// Получение остатков на складе
router.get('/stock', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT s.id, s.product_id, s.quantity, s.reserved, p.name, p.price
      FROM stock s
      JOIN products p ON s.product_id = p.id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка при получении остатков:', err);
    res.status(500).json({ message: 'Ошибка сервера: ' + err.message });
  }
});

// Создание продажи (доступно только админу)
router.post('/sales', authenticateToken, requireAdmin, async (req, res) => {
  const { customer_id, items } = req.body;
  try {
    await pool.query('BEGIN');

    for (const item of items) {
      const stock = await pool.query('SELECT quantity, reserved FROM stock WHERE product_id = $1 FOR UPDATE', [item.product_id]);
      if (stock.rowCount === 0 || stock.rows[0].quantity - stock.rows[0].reserved < item.quantity) {
        throw new Error(`Недостаточно товара ${item.product_id} на складе`);
      }
    }

    const saleResult = await pool.query(
      'INSERT INTO sales (customer_id, total_amount) VALUES ($1, $2) RETURNING *',
      [customer_id || null, 0]
    );
    const saleId = saleResult.rows[0].id;
    let totalAmount = 0;

    for (const item of items) {
      const product = await pool.query('SELECT price FROM products WHERE id = $1', [item.product_id]);
      const price = product.rows[0].price;
      const itemTotal = price * item.quantity;

      await pool.query(
        'INSERT INTO sale_items (sale_id, product_id, quantity, price) VALUES ($1, $2, $3, $4)',
        [saleId, item.product_id, item.quantity, price]
      );

      await pool.query(
        'UPDATE stock SET quantity = quantity - $1 WHERE product_id = $2',
        [item.quantity, item.product_id]
      );

      await pool.query(
        'INSERT INTO stock_transactions (product_id, transaction_type, quantity, description) VALUES ($1, $2, $3, $4)',
        [item.product_id, 'outgoing', item.quantity, `Продажа #${saleId}`]
      );

      totalAmount += itemTotal;

      await pool.query(
        'INSERT INTO warranties (sale_item_id, warranty_period) VALUES ((SELECT id FROM sale_items WHERE sale_id = $1 AND product_id = $2), $3)',
        [saleId, item.product_id, 12]
      );
    }

    await pool.query('UPDATE sales SET total_amount = $1 WHERE id = $2', [totalAmount, saleId]);

    if (customer_id) {
      await pool.query(
        'INSERT INTO customer_history (customer_id, interaction_type, interaction_id, description) VALUES ($1, $2, $3, $4)',
        [customer_id, 'purchase', saleId, `Покупка на сумму ${totalAmount}`]
      );
    }

    await pool.query('COMMIT');
    res.status(201).json({ message: 'Продажа успешно оформлена', saleId });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Ошибка при создании продажи:', err);
    res.status(500).json({ message: 'Ошибка сервера: ' + err.message });
  }
});

// --- Ремонт и техническое обслуживание ---

// Создание ремонта (доступно только админу)
router.post('/repairs', authenticateToken, requireAdmin, async (req, res) => {
  const { service_request_id, device_description } = req.body;
  try {
    const repairResult = await pool.query(
      'INSERT INTO repairs (service_request_id, device_description) VALUES ($1, $2) RETURNING *',
      [service_request_id, device_description]
    );
    const repairId = repairResult.rows[0].id;

    await pool.query(
      'INSERT INTO repair_logs (repair_id, stage, description) VALUES ($1, $2, $3)',
      [repairId, 'accepted', 'Устройство принято на ремонт']
    );

    res.status(201).json(repairResult.rows[0]);
  } catch (err) {
    console.error('Ошибка при создании ремонта:', err);
    res.status(500).json({ message: 'Ошибка сервера: ' + err.message });
  }
});

// Обновление статуса ремонта (доступно только админу)
router.put('/repairs/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status, diagnosis, repair_cost } = req.body;
  try {
    await pool.query('BEGIN');

    const updateFields = [];
    const queryParams = [];
    if (status) {
      updateFields.push(`status = $${updateFields.length + 1}`);
      queryParams.push(status);
    }
    if (diagnosis) {
      updateFields.push(`diagnosis = $${updateFields.length + 1}`);
      queryParams.push(diagnosis);
    }
    if (repair_cost) {
      updateFields.push(`repair_cost = $${updateFields.length + 1}`);
      queryParams.push(repair_cost);
    }
    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    queryParams.push(id);

    await pool.query(
      `UPDATE repairs SET ${updateFields.join(', ')} WHERE id = $${queryParams.length}`,
      queryParams
    );

    await pool.query(
      'INSERT INTO repair_logs (repair_id, stage, description) VALUES ($1, $2, $3)',
      [id, status, `Статус изменён на ${status}${diagnosis ? `: ${diagnosis}` : ''}${repair_cost ? `, стоимость: ${repair_cost}` : ''}`]
    );

    if (status === 'issued') {
      const repair = await pool.query('SELECT service_request_id FROM repairs WHERE id = $1', [id]);
      const serviceRequest = await pool.query('SELECT customer_id FROM service_requests WHERE id = $1', [repair.rows[0].service_request_id]);
      const customerId = serviceRequest.rows[0].customer_id;
      if (customerId) {
        await pool.query(
          'INSERT INTO customer_history (customer_id, interaction_type, interaction_id, description) VALUES ($1, $2, $3, $4)',
          [customerId, 'repair', id, `Ремонт устройства завершён`]
        );
        // Уведомление клиенту (предполагается, что sendNotification настроена)
        // await sendNotification(customerId, 'Ваш ремонт завершён', 'Ваше устройство готово к выдаче.');
      }
    }

    await pool.query('COMMIT');
    res.json({ message: 'Ремонт обновлён' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Ошибка при обновлении ремонта:', err);
    res.status(500).json({ message: 'Ошибка сервера: ' + err.message });
  }
});

// Получение списка ремонтов (доступно только админу)
router.get('/repairs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT r.*, sr.customer_id, c.name AS customer_name
      FROM repairs r
      JOIN service_requests sr ON r.service_request_id = sr.id
      JOIN customers c ON sr.customer_id = c.id
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка при получении ремонтов:', err);
    res.status(500).json({ message: 'Ошибка сервера: ' + err.message });
  }
});

// --- Учёт и работа со складом ---

// Принятие новой поставки (доступно только админу)
router.post('/stock/incoming', authenticateToken, requireAdmin, async (req, res) => {
  const { product_id, quantity, description } = req.body;
  try {
    await pool.query('BEGIN');

    const stock = await pool.query('SELECT quantity FROM stock WHERE product_id = $1 FOR UPDATE', [product_id]);
    if (stock.rowCount === 0) {
      await pool.query('INSERT INTO stock (product_id, quantity) VALUES ($1, $2)', [product_id, quantity]);
    } else {
      await pool.query('UPDATE stock SET quantity = quantity + $1 WHERE product_id = $2', [quantity, product_id]);
    }

    await pool.query(
      'INSERT INTO stock_transactions (product_id, transaction_type, quantity, description) VALUES ($1, $2, $3, $4)',
      [product_id, 'incoming', quantity, description || 'Поставка товара']
    );

    await pool.query('COMMIT');
    res.status(201).json({ message: 'Поставка принята' });
  } catch (err) {
    await pool.query('ROLLBACK');
    console.error('Ошибка при принятии поставки:', err);
    res.status(500).json({ message: 'Ошибка сервера: ' + err.message });
  }
});

// Получение транзакций склада (доступно только админу)
router.get('/stock/transactions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT st.*, p.name AS product_name
      FROM stock_transactions st
      JOIN products p ON st.product_id = p.id
      ORDER BY transaction_date DESC
    `);
    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка при получении транзакций склада:', err);
    res.status(500).json({ message: 'Ошибка сервера: ' + err.message });
  }
});

// --- Формирование отчётности ---

// Отчёт по продажам (доступно только админу)
router.get('/reports/sales', authenticateToken, requireAdmin, async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    const queryParams = [];
    let query = `
      SELECT s.id, s.sale_date, s.total_amount, c.name AS customer_name,
             json_agg(json_build_object('product_id', si.product_id, 'quantity', si.quantity, 'price', si.price)) AS items
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      JOIN sale_items si ON s.id = si.sale_id
    `;
    if (startDate && endDate) {
      query += ` WHERE s.sale_date BETWEEN $1 AND $2`;
      queryParams.push(startDate, endDate);
    }
    query += ' GROUP BY s.id, c.name';
    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка при получении отчёта по продажам:', err);
    res.status(500).json({ message: 'Ошибка сервера: ' + err.message });
  }
});

// Экспорт отчёта по продажам в PDF
router.get('/reports/sales/export/pdf', authenticateToken, requireAdmin, async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    const queryParams = [];
    let query = `
      SELECT s.id, s.sale_date, s.total_amount, c.name AS customer_name,
             json_agg(json_build_object('product_id', si.product_id, 'quantity', si.quantity, 'price', si.price)) AS items
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      JOIN sale_items si ON s.id = si.sale_id
    `;
    if (startDate && endDate) {
      query += ` WHERE s.sale_date BETWEEN $1 AND $2`;
      queryParams.push(startDate, endDate);
    }
    query += ' GROUP BY s.id, c.name';
    const result = await pool.query(query, queryParams);

    const doc = new PDFDocument();
    const filePath = `./sales-report-${Date.now()}.pdf`;
    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(16).text('Отчёт по продажам', { align: 'center' });
    doc.moveDown();

    result.rows.forEach((sale) => {
      doc.fontSize(12).text(`Продажа #${sale.id}`);
      doc.text(`Дата: ${new Date(sale.sale_date).toLocaleString()}`);
      doc.text(`Клиент: ${sale.customer_name || 'Не указан'}`);
      doc.text(`Сумма: ${sale.total_amount}`);
      doc.text('Товары:');
      sale.items.forEach((item) => {
        doc.text(`- Товар ID ${item.product_id}: ${item.quantity} шт. по ${item.price}`);
      });
      doc.moveDown();
    });

    doc.end();
    res.download(filePath, 'sales-report.pdf', (err) => {
      if (err) {
        console.error('Ошибка при скачивании PDF:', err);
        res.status(500).json({ message: 'Ошибка при скачивании файла' });
      }
      fs.unlinkSync(filePath);
    });
  } catch (err) {
    console.error('Ошибка при экспорте отчёта в PDF:', err);
    res.status(500).json({ message: 'Ошибка сервера: ' + err.message });
  }
});

// Экспорт отчёта по продажам в Excel
router.get('/reports/sales/export/excel', authenticateToken, requireAdmin, async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    const queryParams = [];
    let query = `
      SELECT s.id, s.sale_date, s.total_amount, c.name AS customer_name,
             json_agg(json_build_object('product_id', si.product_id, 'quantity', si.quantity, 'price', si.price)) AS items
      FROM sales s
      LEFT JOIN customers c ON s.customer_id = c.id
      JOIN sale_items si ON s.id = si.sale_id
    `;
    if (startDate && endDate) {
      query += ` WHERE s.sale_date BETWEEN $1 AND $2`;
      queryParams.push(startDate, endDate);
    }
    query += ' GROUP BY s.id, c.name';
    const result = await pool.query(query, queryParams);

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    worksheet.columns = [
      { header: 'ID', key: 'id', width: 10 },
      { header: 'Дата', key: 'sale_date', width: 20 },
      { header: 'Клиент', key: 'customer_name', width: 20 },
      { header: 'Сумма', key: 'total_amount', width: 15 },
      { header: 'Товары', key: 'items', width: 30 },
    ];

    result.rows.forEach((sale) => {
      worksheet.addRow({
        id: sale.id,
        sale_date: new Date(sale.sale_date).toLocaleString(),
        customer_name: sale.customer_name || 'Не указан',
        total_amount: sale.total_amount,
        items: sale.items.map(item => `Товар ID ${item.product_id}: ${item.quantity} шт. по ${item.price}`).join('; '),
      });
    });

    const filePath = `./sales-report-${Date.now()}.xlsx`;
    await workbook.xlsx.writeFile(filePath);

    res.download(filePath, 'sales-report.xlsx', (err) => {
      if (err) {
        console.error('Ошибка при скачивании Excel:', err);
        res.status(500).json({ message: 'Ошибка при скачивании файла' });
      }
      fs.unlinkSync(filePath);
    });
  } catch (err) {
    console.error('Ошибка при экспорте отчёта в Excel:', err);
    res.status(500).json({ message: 'Ошибка сервера: ' + err.message });
  }
});

// Отчёт по ремонтам (доступно только админу)
router.get('/reports/repairs', authenticateToken, requireAdmin, async (req, res) => {
  const { startDate, endDate } = req.query;
  try {
    const queryParams = [];
    let query = `
      SELECT r.*, sr.customer_id, c.name AS customer_name
      FROM repairs r
      JOIN service_requests sr ON r.service_request_id = sr.id
      JOIN customers c ON sr.customer_id = c.id
    `;
    if (startDate && endDate) {
      query += ` WHERE r.created_at BETWEEN $1 AND $2`;
      queryParams.push(startDate, endDate);
    }
    const result = await pool.query(query, queryParams);
    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка при получении отчёта по ремонтам:', err);
    res.status(500).json({ message: 'Ошибка сервера: ' + err.message });
  }
});


router.get('/stock', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM stock');
    res.json(result.rows);
  } catch (err) {
    console.error('Ошибка при получении данных склада:', err);
    res.status(500).json({ message: 'Ошибка сервера: ' + err.message });
  }
});

module.exports = router;