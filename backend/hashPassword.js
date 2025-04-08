const bcrypt = require('bcryptjs');

// Пароль, который вы хотите захешировать
const password = 'password'; // Замените на ваш пароль

bcrypt.hash(password, 5, (err, hash) => {
  if (err) {
    console.error('Ошибка хеширования:', err);
  } else {
    console.log('Захешированный пароль:', hash);
  }
});