// backend/routes/auth.js
router.post('/register', async (req, res) => {
    const { name, username, email, password, phone } = req.body;
  
    // Проверяем, что все обязательные поля присутствуют
    if (!name || !username || !email || !password) {
      return res.status(400).json({ message: 'Все обязательные поля (name, username, email, password) должны быть заполнены' });
    }
  
    try {
      // Проверяем, существует ли username
      const usernameCheck = await pool.query('SELECT 1 FROM customers WHERE username = $1', [username]);
      if (usernameCheck.rowCount > 0) {
        return res.status(400).json({ message: 'Логин уже занят' });
      }
  
      // Проверяем, существует ли email
      const emailCheck = await pool.query('SELECT 1 FROM customers WHERE email = $1', [email]);
      if (emailCheck.rowCount > 0) {
        return res.status(400).json({ message: 'Email уже зарегистрирован' });
      }
  
      const hashedPassword = await bcrypt.hash(password, 10);
      const result = await pool.query(
        'INSERT INTO customers (name, username, email, password, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id',
        [name, username, email, hashedPassword, phone]
      );
      const userId = result.rows[0].id;
      const token = jwt.sign({ id: userId, role: 'customer' }, process.env.JWT_SECRET || 'your_jwt_secret', { expiresIn: '1h' });
      res.status(201).json({ token });
    } catch (err) {
      console.error('Ошибка при регистрации:', err);
      res.status(500).json({ message: 'Ошибка сервера: ' + err.message });
    }
  });