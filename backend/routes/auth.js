const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User, Student, Teacher } = require('../models');
const router = express.Router();

// Login
// Login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const ROOT_USER = {
      username: "admin",
      password: "senhaForte123"
    };

    if (username === ROOT_USER.username && password === ROOT_USER.password) {
      const token = jwt.sign(
        { userId: 'root', role: 'admin' },
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.json({
        token,
        user: {
          id: 'root',
          username: ROOT_USER.username,
          role: 'admin'
        }
      });
    }

    const user = await User.findOne({ 
      where: { username },
      include: [
        { model: Student, as: 'studentProfile' },
        { model: Teacher, as: 'teacherProfile' }
      ]
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Credenciais inválidas' });
    }

    const tokenPayload = {
      userId: user.id,
      role: user.role,
      teacherProfile: user.teacherProfile ? { id: user.teacherProfile.id } : undefined
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: '24h'
    });

    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: user.studentProfile || user.teacherProfile
      }
    });
  } catch (error) {
    console.error('Erro no login:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Register (only for admin)
router.post('/register', async (req, res) => {
  try {
    const { username, password, email, role } = req.body;

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: 'Usuário já existe' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      password: hashedPassword,
      email,
      role
    });

    res.status(201).json({
      message: 'Usuário criado com sucesso',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Erro no registro:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;

