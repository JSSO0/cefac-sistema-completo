const express = require('express');
const { Subject, Class } = require('../models');
const auth = require('../middleware/auth');
const router = express.Router();

// Get all subjects
router.get('/', auth(), async (req, res) => {
  try {
    const subjects = await Subject.findAll({
      include: [
        {
          model: Class,
          through: { attributes: [] }
        }
      ],
      where: { isActive: true }
    });
    res.json(subjects);
  } catch (error) {
    console.error('Erro ao buscar disciplinas:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Get subject by ID
router.get('/:id', auth(), async (req, res) => {
  try {
    const { id } = req.params;

    const subject = await Subject.findByPk(id, {
      include: [
        {
          model: Class,
          through: { attributes: [] }
        }
      ]
    });

    if (!subject) {
      return res.status(404).json({ error: 'Disciplina não encontrada' });
    }

    res.json(subject);
  } catch (error) {
    console.error('Erro ao buscar disciplina:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Create subject (admin only)
router.post('/', auth('admin'), async (req, res) => {
  try {
    const { name, code, description, workload } = req.body;

    const existingSubject = await Subject.findOne({ where: { code } });
    if (existingSubject) {
      return res.status(400).json({ error: 'Código da disciplina já existe' });
    }

    const subject = await Subject.create({
      name,
      code,
      description,
      workload
    });

    res.status(201).json({
      message: 'Disciplina criada com sucesso',
      subject
    });
  } catch (error) {
    console.error('Erro ao criar disciplina:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Update subject (admin only)
router.put('/:id', auth('admin'),  async (req, res) => {
  try {
    const { id } = req.params;
    const { name, code, description, workload } = req.body;

    const subject = await Subject.findByPk(id);
    if (!subject) {
      return res.status(404).json({ error: 'Disciplina não encontrada' });
    }

    // Check if code is unique (excluding current subject)
    if (code !== subject.code) {
      const existingSubject = await Subject.findOne({ where: { code } });
      if (existingSubject) {
        return res.status(400).json({ error: 'Código da disciplina já existe' });
      }
    }

    await subject.update({
      name,
      code,
      description,
      workload
    });

    res.json({
      message: 'Disciplina atualizada com sucesso',
      subject
    });
  } catch (error) {
    console.error('Erro ao atualizar disciplina:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// Delete subject (admin only)
router.delete('/:id', auth('admin'),  async (req, res) => {
  try {
    const { id } = req.params;

    const subject = await Subject.findByPk(id);
    if (!subject) {
      return res.status(404).json({ error: 'Disciplina não encontrada' });
    }

    await subject.update({ isActive: false });

    res.json({ message: 'Disciplina desativada com sucesso' });
  } catch (error) {
    console.error('Erro ao desativar disciplina:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;

