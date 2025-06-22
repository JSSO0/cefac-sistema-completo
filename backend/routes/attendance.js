const express = require('express');
const router = express.Router();
const {
  User,
  Student,
  Teacher,
  Subject,
  Class,
  Attendance,
  TeacherClassSubject
} = require("../models");
const auth = require('../middleware/auth');

// GET /api/attendance - Listar registros de frequência com filtros
router.get('/', auth(), async (req, res) => {
  try {
    const {
      classId,
      subjectId,
      studentId,
      date,
      startDate,
      endDate
    } = req.query;

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
      include: [{
          model: Student,
          attributes: ["id", "fullName"]
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
      order: [
        ['date', 'DESC'],
        ['createdAt', 'DESC']
      ]
    });

    res.json(attendanceRecords);
  } catch (error) {
    console.error('Erro ao buscar registros de frequência:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// REFATORADO - attendance.js (parcial)
router.post('/', auth('admin', 'coordenador', 'teacher'), async (req, res) => {
  try {
    const { studentId, classId, subjectId, date, present, justification } = req.body;

    let teacherId;
    if (req.user.role === 'teacher') {
      console.log(req.user);
      console.log(req.user.teacherProfile);
      console.log(req.user.teacherProfile.id);
      teacherId = req.user.teacherProfile?.id;
      if (!teacherId) {
        return res.status(403).json({ error: "Perfil de professor não encontrado para o usuário logado." });
      }
    } else if (req.user.role === 'admin') {
      // opcional: extraia teacherId de um campo do body para manter rastreabilidade
      teacherId = req.body.teacherId || null;
    } else {
      return res.status(403).json({ error: "Acesso não autorizado." });
    }

    const isAuthorized = await TeacherClassSubject.findOne({
      where: { teacherId, classId, subjectId }
    });

    if (!isAuthorized && req.user.role !== "admin") {
      return res.status(403).json({ error: "Professor não autorizado a registrar frequência para esta turma/disciplina" });
    }

    const existingRecord = await Attendance.findOne({ where: { studentId, classId, subjectId, date } });
    const values = { present, justification: justification || null };

    if (existingRecord) {
      await existingRecord.update(values);
      return res.json(await Attendance.findByPk(existingRecord.id));
    }

    const attendanceRecord = await Attendance.create({
      studentId,
      classId,
      subjectId,
      date,
      present,
      justification: justification || null,
      teacherId
    });

    return res.status(201).json(await Attendance.findByPk(attendanceRecord.id));
  } catch (error) {
    console.error('Erro ao criar registro de frequência:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.post('/bulk', auth('admin', 'teacher'), async (req, res) => {
  try {
    const { attendanceList } = req.body;

    if (!Array.isArray(attendanceList) || attendanceList.length === 0) {
      return res.status(400).json({ error: 'Lista de frequência é obrigatória' });
    }

    let teacherId;
    if (req.user.role === 'teacher') {
      teacherId = req.user.teacherProfile?.id;
      if (!teacherId) {
        return res.status(403).json({ error: "Perfil de professor não encontrado para o usuário logado." });
      }
    } else if (req.user.role === 'admin') {
      teacherId = req.body.teacherId || null; // opcional para admin
    } else {
      return res.status(403).json({ error: 'Acesso não autorizado' });
    }

    const results = [];

    for (const entry of attendanceList) {
      const { studentId, classId, subjectId, date, present, justification } = entry;

      const isAuthorized = await TeacherClassSubject.findOne({
        where: { teacherId, classId, subjectId }
      });

      if (!isAuthorized && req.user.role !== 'admin') continue;

      const existing = await Attendance.findOne({
        where: { studentId, classId, subjectId, date }
      });

      if (existing) {
        await existing.update({ present, justification: justification || null });
        results.push(existing);
      } else {
        const created = await Attendance.create({
          studentId,
          classId,
          subjectId,
          date,
          present,
          justification: justification || null,
          teacherId
        });
        results.push(created);
      }
    }

    res.json({ message: 'Frequência salva com sucesso', count: results.length, records: results });
  } catch (error) {
    console.error('Erro ao salvar frequência em lote:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

router.put('/:id', auth('admin', 'teacher'), async (req, res) => {
  try {
    const { id } = req.params;
    const { present, justification } = req.body;

    const attendanceRecord = await Attendance.findByPk(id);
    if (!attendanceRecord) {
      return res.status(404).json({ error: 'Registro de frequência não encontrado' });
    }

    let teacherId = null;
    if (req.user.role === 'teacher') {
      teacherId = req.user.teacherProfile?.id;
      if (!teacherId) {
        return res.status(403).json({ error: "Perfil de professor não encontrado para o usuário logado." });
      }
      if (attendanceRecord.teacherId !== teacherId) {
        return res.status(403).json({ error: "Você não tem permissão para atualizar este registro de frequência" });
      }
    }

    await attendanceRecord.update({
      present,
      justification: justification || null
    });

    const updatedRecord = await Attendance.findByPk(id, {
      include: [
        { model: Student, attributes: ["id", "fullName"] },
        { model: Class, attributes: ['id', 'name', 'grade'] },
        { model: Subject, attributes: ['id', 'name', 'code'] }
      ]
    });

    res.json(updatedRecord);
  } catch (error) {
    console.error('Erro ao atualizar registro de frequência:', error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

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
    const {
      studentId
    } = req.params;
    const {
      subjectId,
      classId,
      startDate,
      endDate
    } = req.query;

    let whereClause = {
      studentId
    };

    if (subjectId) whereClause.subjectId = subjectId;
    if (classId) whereClause.classId = classId;

    if (startDate && endDate) {
      whereClause.date = {
        [require('sequelize').Op.between]: [startDate, endDate]
      };
    }

    const attendanceRecords = await Attendance.findAll({
      where: whereClause,
      include: [{
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
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

// GET /api/attendance/report - Relatório de frequência
router.get('/report', auth('admin', 'teacher'), async (req, res) => {
  try {
    const {
      classId,
      subjectId,
      startDate,
      endDate
    } = req.query;

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
      include: [{
          model: Student,
          attributes: ["id", "fullName"]
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
      order: [
        ['date', 'ASC'],
        [Student, 'fullName', 'ASC']
      ]
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
        filters: {
          classId,
          subjectId,
          startDate,
          endDate
        }
      },
      students: Object.values(studentStats)
    });
  } catch (error) {
    console.error('Erro ao gerar relatório de frequência:', error);
    res.status(500).json({
      error: 'Erro interno do servidor'
    });
  }
});

router.get("/teacher-assignments", auth("teacher", "admin"), async (req, res) => {
  try {
    let teacherIdToQuery;

    if (req.user.role === "teacher") {
      console.log(req.user);
      console.log(req.user.teacherProfile);
      console.log(req.user.teacherProfile.id);
      teacherIdToQuery = req.user.id;
      if (!teacherIdToQuery) {
        return res.status(403).json({ error: "Perfil de professor não encontrado para o usuário logado." });
      }
    } else if (req.user.role === "admin") {
      const { teacherId } = req.query;
      if (!teacherId) {
        return res.status(400).json({ error: "Para administradores, o 'teacherId' deve ser fornecido como parâmetro de consulta (ex: /teacher-assignments?teacherId=XYZ)." });
      }
      teacherIdToQuery = teacherId;
    } else {
      return res.status(403).json({ error: "Acesso não autorizado ou perfil de usuário inválido para esta operação." });
    }

    const assignments = await TeacherClassSubject.findAll({
      where: { teacherId: req.user.id },
      include: [
        { model: Class, attributes: ["id", "name", "grade", "shift", "year"] },
        { model: Subject, attributes: ["id", "name", "code"] }
      ]
    });

    const formattedAssignments = assignments.map(assignment => ({
      class: assignment.Class,
      subject: assignment.Subject
    }));

    res.json(formattedAssignments);
  } catch (error) {
    console.error("Erro ao buscar atribuições do professor:", error);
    res.status(500).json({ error: 'Erro interno do servidor' });
  }
});

module.exports = router;