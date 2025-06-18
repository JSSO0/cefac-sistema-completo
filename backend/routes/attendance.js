const express = require('express');
const router = express.Router();
const { User, Student, Teacher, Subject, Class, Attendance } = require('../models');
const auth = require('../middleware/auth');

// GET /api/attendance - Listar registros de frequência com filtros
router.get('/', auth(), async (req, res) => {
  try {
    const { classId, subjectId, studentId, date, startDate, endDate } = req.query;

    let whereClause = {};

    if (classId) whereClause.classId = classId;
    if (subjectId) whereClause.subjectId = subjectId;
    if (studentId) whereClause.studentId = studentId;
    if (date) whereClause.date = date;

    if (startDate && endDate) {
      whereClause.date = {
        [require('sequelize').Op.between]: [startDate, endDate]
      };
    }

    const attendanceRecords = await Attendance.findAll({
      where: whereClause,
      include: [
        {
          model: Student,
          attributes: ['id', 'fullName', 'enrollmentNumber']
        },
        {
          model: Class,
          attributes: ['id', 'name', 'grade']
        },
        {
          model: Subject,
          attributes: ['id', 'name', 'code']
        }
      ],
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });

    res.json(attendanceRecords);
  } catch (error) {
    console.error('Erro ao buscar registros de frequência:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/attendance - Criar registro individual de frequência
router.post('/', auth('admin', 'coordenador'), async (req, res) => {
  try {
    const { studentId, classId, subjectId, date, present, justification } = req.body;

    const existingRecord = await Attendance.findOne({
      where: { studentId, classId, subjectId, date }
    });

    if (existingRecord) {
      await existingRecord.update({
        present,
        justification: justification || null
      });

      const updatedRecord = await Attendance.findByPk(existingRecord.id, {
        include: [
          {
            model: Student,
            attributes: ['id', 'fullName', 'enrollmentNumber']
          },
          {
            model: Class,
            attributes: ['id', 'name', 'grade']
          },
          {
            model: Subject,
            attributes: ['id', 'name', 'code']
          }
        ]
      });

      return res.json(updatedRecord);
    }

    const attendanceRecord = await Attendance.create({
      studentId,
      classId,
      subjectId,
      date,
      present,
      justification: justification || null
    });

    const newRecord = await Attendance.findByPk(attendanceRecord.id, {
      include: [
        {
          model: Student,
          attributes: ['id', 'fullName', 'enrollmentNumber']
        },
        {
          model: Class,
          attributes: ['id', 'name', 'grade']
        },
        {
          model: Subject,
          attributes: ['id', 'name', 'code']
        }
      ]
    });

    res.status(201).json(newRecord);
  } catch (error) {
    console.error('Erro ao criar registro de frequência:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/attendance/bulk - Criar/atualizar registros em lote
router.post('/bulk', auth('admin', 'coordenador'), async (req, res) => {
  try {
    const { attendanceList } = req.body;

    if (!Array.isArray(attendanceList) || attendanceList.length === 0) {
      return res.status(400).json({ error: 'Lista de frequência é obrigatória' });
    }

    const results = [];

    for (const attendance of attendanceList) {
      const { studentId, classId, subjectId, date, present, justification } = attendance;

      const existingRecord = await Attendance.findOne({
        where: { studentId, classId, subjectId, date }
      });

      if (existingRecord) {
        await existingRecord.update({
          present,
          justification: justification || null
        });
        results.push(existingRecord);
      } else {
        const newRecord = await Attendance.create({
          studentId,
          classId,
          subjectId,
          date,
          present,
          justification: justification || null
        });
        results.push(newRecord);
      }
    }

    res.json({ 
      message: 'Frequência salva com sucesso',
      count: results.length,
      records: results
    });
  } catch (error) {
    console.error('Erro ao salvar frequência em lote:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/attendance/:id - Atualizar registro de frequência
router.put('/:id', auth('admin', 'coordenador'), async (req, res) => {
  try {
    const { id } = req.params;
    const { present, justification } = req.body;

    const attendanceRecord = await Attendance.findByPk(id);

    if (!attendanceRecord) {
      return res.status(404).json({ error: 'Registro de frequência não encontrado' });
    }

    await attendanceRecord.update({
      present,
      justification: justification || null
    });

    const updatedRecord = await Attendance.findByPk(id, {
      include: [
        {
          model: Student,
          attributes: ['id', 'fullName', 'enrollmentNumber']
        },
        {
          model: Class,
          attributes: ['id', 'name', 'grade']
        },
        {
          model: Subject,
          attributes: ['id', 'name', 'code']
        }
      ]
    });

    res.json(updatedRecord);
  } catch (error) {
    console.error('Erro ao atualizar registro de frequência:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/attendance/:id - Deletar registro de frequência
router.delete('/:id', auth('admin'), async (req, res) => {
  try {
    const { id } = req.params;

    const attendanceRecord = await Attendance.findByPk(id);

    if (!attendanceRecord) {
      return res.status(404).json({ error: 'Registro de frequência não encontrado' });
    }

    await attendanceRecord.destroy();

    res.json({ message: 'Registro de frequência deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar registro de frequência:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/attendance/stats/:studentId - Estatísticas de frequência do aluno
router.get('/stats/:studentId', auth(), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { subjectId, classId, startDate, endDate } = req.query;

    let whereClause = { studentId };

    if (subjectId) whereClause.subjectId = subjectId;
    if (classId) whereClause.classId = classId;

    if (startDate && endDate) {
      whereClause.date = {
        [require('sequelize').Op.between]: [startDate, endDate]
      };
    }

    const attendanceRecords = await Attendance.findAll({
      where: whereClause,
      include: [
        {
          model: Subject,
          attributes: ['id', 'name', 'code']
        },
        {
          model: Class,
          attributes: ['id', 'name', 'grade']
        }
      ]
    });

    const totalClasses = attendanceRecords.length;
    const presentClasses = attendanceRecords.filter(record => record.present).length;
    const absentClasses = totalClasses - presentClasses;
    const attendancePercentage = totalClasses > 0 ? ((presentClasses / totalClasses) * 100).toFixed(2) : 0;

    const subjectStats = {};
    attendanceRecords.forEach(record => {
      const subjectKey = record.Subject.id;
      if (!subjectStats[subjectKey]) {
        subjectStats[subjectKey] = {
          subject: record.Subject,
          total: 0,
          present: 0,
          absent: 0,
          percentage: 0
        };
      }

      subjectStats[subjectKey].total++;
      if (record.present) {
        subjectStats[subjectKey].present++;
      } else {
        subjectStats[subjectKey].absent++;
      }

      subjectStats[subjectKey].percentage = 
        ((subjectStats[subjectKey].present / subjectStats[subjectKey].total) * 100).toFixed(2);
    });

    res.json({
      general: {
        totalClasses,
        presentClasses,
        absentClasses,
        attendancePercentage: parseFloat(attendancePercentage)
      },
      bySubject: Object.values(subjectStats),
      records: attendanceRecords
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de frequência:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/attendance/report - Relatório de frequência
router.get('/report', auth('admin', 'coordenador'), async (req, res) => {
  try {
    const { classId, subjectId, startDate, endDate } = req.query;

    let whereClause = {};

    if (classId) whereClause.classId = classId;
    if (subjectId) whereClause.subjectId = subjectId;

    if (startDate && endDate) {
      whereClause.date = {
        [require('sequelize').Op.between]: [startDate, endDate]
      };
    }

    const attendanceRecords = await Attendance.findAll({
      where: whereClause,
      include: [
        {
          model: Student,
          attributes: ['id', 'fullName', 'enrollmentNumber']
        },
        {
          model: Class,
          attributes: ['id', 'name', 'grade']
        },
        {
          model: Subject,
          attributes: ['id', 'name', 'code']
        }
      ],
      order: [['date', 'ASC'], [Student, 'fullName', 'ASC']]
    });

    const studentStats = {};
    attendanceRecords.forEach(record => {
      const studentKey = record.Student.id;
      if (!studentStats[studentKey]) {
        studentStats[studentKey] = {
          student: record.Student,
          total: 0,
          present: 0,
          absent: 0,
          percentage: 0,
          records: []
        };
      }

      studentStats[studentKey].total++;
      studentStats[studentKey].records.push(record);

      if (record.present) {
        studentStats[studentKey].present++;
      } else {
        studentStats[studentKey].absent++;
      }

      studentStats[studentKey].percentage = 
        ((studentStats[studentKey].present / studentStats[studentKey].total) * 100).toFixed(2);
    });

    res.json({
      summary: {
        totalStudents: Object.keys(studentStats).length,
        totalRecords: attendanceRecords.length,
        filters: { classId, subjectId, startDate, endDate }
      },
      students: Object.values(studentStats)
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de frequência:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;

/*const express = require('express');
const router = express.Router();
const { User, Student, Teacher, Subject, Class, Attendance } = require('../models');
const auth = require('../middleware/auth');

// GET /api/attendance - Listar registros de frequência com filtros
router.get('/', auth, async (req, res) => {
  try {
    const { classId, subjectId, studentId, date, startDate, endDate } = req.query;
    
    let whereClause = {};
    
    if (classId) whereClause.classId = classId;
    if (subjectId) whereClause.subjectId = subjectId;
    if (studentId) whereClause.studentId = studentId;
    if (date) whereClause.date = date;
    
    if (startDate && endDate) {
      whereClause.date = {
        [require('sequelize').Op.between]: [startDate, endDate]
      };
    }

    const attendanceRecords = await Attendance.findAll({
      where: whereClause,
      include: [
        {
          model: Student,
          attributes: ['id', 'fullName', 'enrollmentNumber']
        },
        {
          model: Class,
          attributes: ['id', 'name', 'grade']
        },
        {
          model: Subject,
          attributes: ['id', 'name', 'code']
        }
      ],
      order: [['date', 'DESC'], ['createdAt', 'DESC']]
    });

    res.json(attendanceRecords);
  } catch (error) {
    console.error('Erro ao buscar registros de frequência:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/attendance - Criar registro individual de frequência
router.post('/', auth, async (req, res) => {
  try {
    const { studentId, classId, subjectId, date, present, justification } = req.body;

    // Verificar se já existe registro para esta combinação
    const existingRecord = await Attendance.findOne({
      where: { studentId, classId, subjectId, date }
    });

    if (existingRecord) {
      // Atualizar registro existente
      await existingRecord.update({
        present,
        justification: justification || null
      });
      
      const updatedRecord = await Attendance.findByPk(existingRecord.id, {
        include: [
          {
            model: Student,
            attributes: ['id', 'fullName', 'enrollmentNumber']
          },
          {
            model: Class,
            attributes: ['id', 'name', 'grade']
          },
          {
            model: Subject,
            attributes: ['id', 'name', 'code']
          }
        ]
      });
      
      return res.json(updatedRecord);
    }

    // Criar novo registro
    const attendanceRecord = await Attendance.create({
      studentId,
      classId,
      subjectId,
      date,
      present,
      justification: justification || null
    });

    const newRecord = await Attendance.findByPk(attendanceRecord.id, {
      include: [
        {
          model: Student,
          attributes: ['id', 'fullName', 'enrollmentNumber']
        },
        {
          model: Class,
          attributes: ['id', 'name', 'grade']
        },
        {
          model: Subject,
          attributes: ['id', 'name', 'code']
        }
      ]
    });

    res.status(201).json(newRecord);
  } catch (error) {
    console.error('Erro ao criar registro de frequência:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// POST /api/attendance/bulk - Criar/atualizar registros em lote
router.post('/bulk', auth, async (req, res) => {
  try {
    const { attendanceList } = req.body;

    if (!Array.isArray(attendanceList) || attendanceList.length === 0) {
      return res.status(400).json({ error: 'Lista de frequência é obrigatória' });
    }

    const results = [];

    for (const attendance of attendanceList) {
      const { studentId, classId, subjectId, date, present, justification } = attendance;

      // Verificar se já existe registro
      const existingRecord = await Attendance.findOne({
        where: { studentId, classId, subjectId, date }
      });

      if (existingRecord) {
        // Atualizar registro existente
        await existingRecord.update({
          present,
          justification: justification || null
        });
        results.push(existingRecord);
      } else {
        // Criar novo registro
        const newRecord = await Attendance.create({
          studentId,
          classId,
          subjectId,
          date,
          present,
          justification: justification || null
        });
        results.push(newRecord);
      }
    }

    res.json({ 
      message: 'Frequência salva com sucesso',
      count: results.length,
      records: results
    });
  } catch (error) {
    console.error('Erro ao salvar frequência em lote:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// PUT /api/attendance/:id - Atualizar registro de frequência
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const { present, justification } = req.body;

    const attendanceRecord = await Attendance.findByPk(id);

    if (!attendanceRecord) {
      return res.status(404).json({ error: 'Registro de frequência não encontrado' });
    }

    await attendanceRecord.update({
      present,
      justification: justification || null
    });

    const updatedRecord = await Attendance.findByPk(id, {
      include: [
        {
          model: Student,
          attributes: ['id', 'fullName', 'enrollmentNumber']
        },
        {
          model: Class,
          attributes: ['id', 'name', 'grade']
        },
        {
          model: Subject,
          attributes: ['id', 'name', 'code']
        }
      ]
    });

    res.json(updatedRecord);
  } catch (error) {
    console.error('Erro ao atualizar registro de frequência:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// DELETE /api/attendance/:id - Deletar registro de frequência
router.delete('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;

    const attendanceRecord = await Attendance.findByPk(id);

    if (!attendanceRecord) {
      return res.status(404).json({ error: 'Registro de frequência não encontrado' });
    }

    await attendanceRecord.destroy();

    res.json({ message: 'Registro de frequência deletado com sucesso' });
  } catch (error) {
    console.error('Erro ao deletar registro de frequência:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/attendance/stats/:studentId - Estatísticas de frequência do aluno
router.get('/stats/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    const { subjectId, classId, startDate, endDate } = req.query;

    let whereClause = { studentId };
    
    if (subjectId) whereClause.subjectId = subjectId;
    if (classId) whereClause.classId = classId;
    
    if (startDate && endDate) {
      whereClause.date = {
        [require('sequelize').Op.between]: [startDate, endDate]
      };
    }

    const attendanceRecords = await Attendance.findAll({
      where: whereClause,
      include: [
        {
          model: Subject,
          attributes: ['id', 'name', 'code']
        },
        {
          model: Class,
          attributes: ['id', 'name', 'grade']
        }
      ]
    });

    const totalClasses = attendanceRecords.length;
    const presentClasses = attendanceRecords.filter(record => record.present).length;
    const absentClasses = totalClasses - presentClasses;
    const attendancePercentage = totalClasses > 0 ? ((presentClasses / totalClasses) * 100).toFixed(2) : 0;

    // Estatísticas por disciplina
    const subjectStats = {};
    attendanceRecords.forEach(record => {
      const subjectKey = record.Subject.id;
      if (!subjectStats[subjectKey]) {
        subjectStats[subjectKey] = {
          subject: record.Subject,
          total: 0,
          present: 0,
          absent: 0,
          percentage: 0
        };
      }
      
      subjectStats[subjectKey].total++;
      if (record.present) {
        subjectStats[subjectKey].present++;
      } else {
        subjectStats[subjectKey].absent++;
      }
      
      subjectStats[subjectKey].percentage = 
        ((subjectStats[subjectKey].present / subjectStats[subjectKey].total) * 100).toFixed(2);
    });

    res.json({
      general: {
        totalClasses,
        presentClasses,
        absentClasses,
        attendancePercentage: parseFloat(attendancePercentage)
      },
      bySubject: Object.values(subjectStats),
      records: attendanceRecords
    });
  } catch (error) {
    console.error('Erro ao buscar estatísticas de frequência:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

// GET /api/attendance/report - Relatório de frequência
router.get('/report', auth, async (req, res) => {
  try {
    const { classId, subjectId, startDate, endDate } = req.query;

    let whereClause = {};
    
    if (classId) whereClause.classId = classId;
    if (subjectId) whereClause.subjectId = subjectId;
    
    if (startDate && endDate) {
      whereClause.date = {
        [require('sequelize').Op.between]: [startDate, endDate]
      };
    }

    const attendanceRecords = await Attendance.findAll({
      where: whereClause,
      include: [
        {
          model: Student,
          attributes: ['id', 'fullName', 'enrollmentNumber']
        },
        {
          model: Class,
          attributes: ['id', 'name', 'grade']
        },
        {
          model: Subject,
          attributes: ['id', 'name', 'code']
        }
      ],
      order: [['date', 'ASC'], [Student, 'fullName', 'ASC']]
    });

    // Agrupar por aluno
    const studentStats = {};
    attendanceRecords.forEach(record => {
      const studentKey = record.Student.id;
      if (!studentStats[studentKey]) {
        studentStats[studentKey] = {
          student: record.Student,
          total: 0,
          present: 0,
          absent: 0,
          percentage: 0,
          records: []
        };
      }
      
      studentStats[studentKey].total++;
      studentStats[studentKey].records.push(record);
      
      if (record.present) {
        studentStats[studentKey].present++;
      } else {
        studentStats[studentKey].absent++;
      }
      
      studentStats[studentKey].percentage = 
        ((studentStats[studentKey].present / studentStats[studentKey].total) * 100).toFixed(2);
    });

    res.json({
      summary: {
        totalStudents: Object.keys(studentStats).length,
        totalRecords: attendanceRecords.length,
        filters: { classId, subjectId, startDate, endDate }
      },
      students: Object.values(studentStats)
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de frequência:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;

*/