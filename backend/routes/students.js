const express = require('express');
const { Student, User, Class } = require('../models');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all students
router.get('/', auth(), async (req, res) => {
  try {
    const students = await Student.findAll({
      include: [
        { 
          model: User, 
          attributes: { exclude: ['password'] }
        },
        {
          model: Class,
          through: { attributes: [] }
        }
      ],
      where: { isActive: true }
    });
    res.json(students);
  } catch (error) {
    console.error('Erro ao buscar estudantes:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Get student by ID
router.get('/:id', auth(), async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id, {
      include: [
        { 
          model: User, 
          attributes: { exclude: ['password'] }
        },
        {
          model: Class,
          through: { attributes: [] }
        }
      ]
    });

    if (!student) {
      return res.status(404).json({ error: 'Estudante não encontrado' });
    }

    // Students can only access their own data unless requester is admin/teacher
    if (req.user.role === 'student' && student.userId !== req.user.id) {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    res.json(student);
  } catch (error) {
    console.error('Erro ao buscar estudante:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Create student (admin only)
router.post('/', auth('admin'),  async (req, res) => {
  try {
    const {
      userId,
      fullName,
      birthDate,
      cpf,
      phone,
      address,
      parentName,
      parentPhone,
      enrollmentNumber
    } = req.body;

    const student = await Student.create({
      userId,
      fullName,
      birthDate,
      cpf,
      phone,
      address,
      parentName,
      parentPhone,
      enrollmentNumber
    });

    const studentWithUser = await Student.findByPk(student.id, {
      include: [{ model: User, attributes: { exclude: ['password'] } }]
    });

    res.status(201).json({
      message: 'Estudante criado com sucesso',
      student: studentWithUser
    });
  } catch (error) {
    console.error('Erro ao criar estudante:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Update student
router.put('/:id', auth(), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      fullName,
      birthDate,
      cpf,
      phone,
      address,
      parentName,
      parentPhone,
      enrollmentNumber
    } = req.body;

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ error: 'Estudante não encontrado' });
    }

    // Only admin can update student data
    if (req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Acesso negado' });
    }

    await student.update({
      fullName,
      birthDate,
      cpf,
      phone,
      address,
      parentName,
      parentPhone,
      enrollmentNumber
    });

    const updatedStudent = await Student.findByPk(id, {
      include: [{ model: User, attributes: { exclude: ['password'] } }]
    });

    res.json({
      message: 'Estudante atualizado com sucesso',
      student: updatedStudent
    });
  } catch (error) {
    console.error('Erro ao atualizar estudante:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Delete student (admin only)
router.delete('/:id', auth('admin'),  async (req, res) => {
  try {
    const { id } = req.params;

    const student = await Student.findByPk(id);
    if (!student) {
      return res.status(404).json({ error: 'Estudante não encontrado' });
    }

    await student.update({ isActive: false });

    res.json({ message: 'Estudante desativado com sucesso' });
  } catch (error) {
    console.error('Erro ao desativar estudante:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;

