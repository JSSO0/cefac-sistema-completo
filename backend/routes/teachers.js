const express = require('express');
const { Teacher, User, Class, Subject } = require('../models');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all teachers
router.get('/', auth(), async (req, res) => {
  try {
    const teachers = await Teacher.findAll({
      include: [
        { 
          model: User, 
          attributes: { exclude: ['password'] }
        },
        {
          model: Class,
          as: 'classes', // <-- Adicionado 'as: classes'
          through: { attributes: [] }
        }
      ],
      where: { isActive: true }
    });
    res.json(teachers);
  } catch (error) {
    console.error('Erro ao buscar professores:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Get teacher by ID
router.get('/:id', auth(), async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await Teacher.findByPk(id, {
      include: [
        { 
          model: User, 
          attributes: { exclude: ['password'] }
        },
        {
          model: Class,
          as: 'classes', // <-- Adicionado 'as: classes'
          through: { attributes: [] }
        }
      ]
    });

    if (!teacher) {
      return res.status(404).json({ error: 'Professor não encontrado' });
    }

    // Teachers can only access their own data unless requester is admin
    if (req.user.role === 'teacher' && teacher.userId !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    res.json(teacher);
  } catch (error) {
    console.error('Erro ao buscar professor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Create teacher (admin only)
router.post('/', auth('admin'), async (req, res) => {
  try {
    const {
      userId,
      fullName,
      birthDate,
      cpf,
      phone,
      address,
      qualification,
      specialization,
      employeeNumber
    } = req.body;

    const teacher = await Teacher.create({
      userId,
      fullName,
      birthDate,
      cpf,
      phone,
      address,
      qualification,
      specialization,
      employeeNumber
    });

    const teacherWithUser = await Teacher.findByPk(teacher.id, {
      include: [{ model: User, attributes: { exclude: ['password'] } }]
    });

    res.status(201).json({
      message: 'Professor criado com sucesso',
      teacher: teacherWithUser
    });
  } catch (error) {
    console.error('Erro ao criar professor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Update teacher
router.put('/:id', auth(), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      birthDate,
      cpf,
      phone,
      address,
      qualification,
      specialization,
      employeeNumber
    } = req.body;

    const teacher = await Teacher.findByPk(id);
    if (!teacher) {
      return res.status(404).json({ error: 'Professor não encontrado' });
    }

    // Only admin can update teacher data
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    await teacher.update({
      fullName,
      birthDate,
      cpf,
      phone,
      address,
      qualification,
      specialization,
      employeeNumber
    });

    const updatedTeacher = await Teacher.findByPk(id, {
      include: [{ model: User, attributes: { exclude: ['password'] } }]
    });

    res.json({
      message: 'Professor atualizado com sucesso',
      teacher: updatedTeacher
    });
  } catch (error) {
    console.error('Erro ao atualizar professor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Delete teacher (admin only)
router.delete('/:id', auth('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const teacher = await Teacher.findByPk(id);
    if (!teacher) {
      return res.status(404).json({ error: 'Professor não encontrado' });
    }

    await teacher.update({ isActive: false });

    res.json({ message: 'Professor desativado com sucesso' });
  } catch (error) {
    console.error('Erro ao desativar professor:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;

