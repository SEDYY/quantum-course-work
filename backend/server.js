const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');
const app = express();
const port = 3001;
const apiRoutes = require('./routes/api'); // Подключаем маршруты

// Настройка подключения к базе данных
const pool = new Pool({
  user: 'postgres',
  host: 'localhost',
  database: 'quantum',
  password: '9292',
  port: 5432,
});

app.use(cors());            // Разрешаем запросы с фронтенда
app.use(express.json());    // Парсим JSON в запросах

// Подключаем маршруты с префиксом /api
app.use('/api', apiRoutes);

// Проверка подключения к базе данных
pool.connect((err) => {
  if (err) {
    console.error('Ошибка подключения к базе данных:', err);
  } else {
    console.log('Подключено к базе данных');
  }
});

// Запуск сервера
app.listen(port, () => {
  console.log(`Сервер запущен на порту ${port}`);
});