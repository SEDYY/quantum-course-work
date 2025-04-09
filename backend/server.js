const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const app = express();
const port = 3001;
const apiRoutes = require('./routes/api');
const nodemailer = require('nodemailer');

app.use(cors());
app.use(express.json());

// Секретный ключ для JWT (в продакшене храните его в переменных окружения)
const JWT_SECRET = 'your_jwt_secret_key';

// Подключение к базе данных
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'quantum',
  password: '9292',
  port: 5432,
});

pool.connect((err) => {
  if (err) {
    console.error('Ошибка подключения к базе данных:', err);
  } else {
    console.log('Подключено к базе данных');
  }
});

// Middleware для проверки JWT-токена
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Формат: "Bearer <token>"

  if (!token) {
    return res.status(401).json({ message: 'Токен отсутствует' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Недействительный токен' });
    }
    req.user = user;
    next();
  });
};

// Маршрут для логина
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
    const user = result.rows[0];

    if (!user) {
      return res.status(401).json({ message: 'Неверное имя пользователя или пароль' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Неверное имя пользователя или пароль' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role }, // Убедитесь, что role добавляется
      JWT_SECRET,
      { expiresIn: '1h' }
    );
    res.json({ token });
  } catch (err) {
    res.status(500).json({ message: 'Ошибка сервера: ' + err.message });
  }
});


// Настройка транспортера для отправки email
const transporter = nodemailer.createTransport({
  host: 'smtp.example.com', // Замените на ваш SMTP-сервер
  port: 587,
  secure: false,
  auth: {
    user: 'your-email@example.com',
    pass: 'your-password',
  },
});

// Функция для отправки уведомления
const sendNotification = async (customerId, subject, message) => {
  try {
    const customer = await pool.query('SELECT email, name FROM customers WHERE id = $1', [customerId]);
    if (!customer.rows[0]?.email) {
      throw new Error('Email клиента не указан');
    }

    const mailOptions = {
      from: 'your-email@example.com',
      to: customer.rows[0].email,
      subject,
      text: `Уважаемый(ая) ${customer.rows[0].name},\n\n${message}\n\nС уважением,\nКоманда Компьютерного салона`,
    };

    await transporter.sendMail(mailOptions);
    await pool.query(
      'UPDATE customers SET last_notification = CURRENT_TIMESTAMP WHERE id = $1',
      [customerId]
    );
  } catch (err) {
    console.error('Ошибка при отправке уведомления:', err);
  }
};

// Защищаем все маршруты /api/*
app.use('/api', authenticateToken, apiRoutes);

app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});