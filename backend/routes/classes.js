const express = require("express");
const router = express.Router();
const { Class, Student, Teacher, Subject, TeacherClassSubject } = require("../models");
const auth = require("../middleware/auth");

// GET /api/classes - Listar todas as turmas
router.get("/", auth(), async (req, res) => {
  try {
    const classes = await Class.findAll({
      include: [
        {
          model: Student,
          as: "students",
          attributes: ["id", "fullName"],
          through: { attributes: [] },
        },
        {
          model: Teacher,
          as: "teachers",
          attributes: ["id", "fullName", "employeeNumber"],
          through: { attributes: [] },
        },
        {
          model: Subject,
          as: "subjects",
          attributes: ["id", "name", "code"],
          through: { attributes: [] },
        },
      ],
      order: [["year", "DESC"], ["name", "ASC"]],
    });

    res.json(classes);
  } catch (error) {
    console.error("Erro ao buscar turmas:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// GET /api/classes/:id - Buscar turma por ID
router.get("/:id", auth(), async (req, res) => {
  try {
    const { id } = req.params;

    const classItem = await Class.findByPk(id, {
      include: [
        {
          model: Student,
          as: "students",
          attributes: ["id", "fullName", "phone"],
          through: { attributes: [] },
        },
        {
          model: Teacher,
          as: "teachers",
          attributes: ["id", "fullName", "employeeNumber", "qualification"],
          through: { attributes: [] },
        },
        {
          model: Subject,
          as: "subjects",
          attributes: ["id", "name", "code", "workload"],
          through: { attributes: [] },
        },
      ],
    });

    if (!classItem) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }

    res.json(classItem);
  } catch (error) {
    console.error("Erro ao buscar turma:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// POST /api/classes - Criar nova turma
router.post("/", auth("admin"),  async (req, res) => {
  try {
    const { name, grade, shift, year, capacity } = req.body;

    // Verificar se já existe uma turma com o mesmo nome no mesmo ano
    const existingClass = await Class.findOne({
      where: { name, year },
    });

    if (existingClass) {
      return res
        .status(400)
        .json({ error: "Já existe uma turma com este nome neste ano" });
    }

    const newClass = await Class.create({
      name,
      grade,
      shift,
      year,
      capacity: capacity || null,
    });

    const classWithIncludes = await Class.findByPk(newClass.id, {
      include: [
        {
          model: Student,
          as: "students",
          attributes: ["id", "fullName"],
          through: { attributes: [] },
        },
        {
          model: Teacher,
          as: "teachers",
          attributes: ["id", "fullName", "employeeNumber"],
          through: { attributes: [] },
        },
        {
          model: Subject,
          as: "subjects",
          attributes: ["id", "name", "code"],
          through: { attributes: [] },
        },
      ],
    });

    res.status(201).json(classWithIncludes);
  } catch (error) {
    console.error("Erro ao criar turma:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// PUT /api/classes/:id - Atualizar turma
router.put("/:id", auth("admin"),  async (req, res) => {
  try {
    const { id } = req.params;
    const { name, grade, shift, year, capacity } = req.body;

    const classItem = await Class.findByPk(id);

    if (!classItem) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }

    // Verificar se já existe outra turma com o mesmo nome no mesmo ano
    const existingClass = await Class.findOne({
      where: {
        name,
        year,
        id: { [require("sequelize").Op.ne]: id },
      },
    });

    if (existingClass) {
      return res
        .status(400)
        .json({ error: "Já existe uma turma com este nome neste ano" });
    }

    await classItem.update({
      name,
      grade,
      shift,
      year,
      capacity: capacity || null,
    });

    const updatedClass = await Class.findByPk(id, {
      include: [
        {
          model: Student,
          as: "students",
          attributes: ["id", "fullName"],
          through: { attributes: [] },
        },
        {
          model: Teacher,
          as: "teachers",
          attributes: ["id", "fullName", "employeeNumber"],
          through: { attributes: [] },
        },
        {
          model: Subject,
          as: "subjects",
          attributes: ["id", "name", "code"],
          through: { attributes: [] },
        },
      ],
    });

    res.json(updatedClass);
  } catch (error) {
    console.error("Erro ao atualizar turma:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// DELETE /api/classes/:id - Desativar turma
router.delete("/:id", auth("admin"), async (req, res) => {
  try {
    const { id } = req.params;

    const classItem = await Class.findByPk(id);

    if (!classItem) {
      return res.status(404).json({ error: "Turma não encontrada" });
    }

    await classItem.update({ isActive: false });

    res.json({ message: "Turma desativada com sucesso" });
  } catch (error) {
    console.error("Erro ao desativar turma:", error);
    res.status(500).json({ error: "Erro interno do servidor" });
  }
});

// POST /api/classes/:id/students/:studentId - Adicionar aluno à turma
router.post(
  "/:id/students/:studentId",
  auth("admin"),
  async (req, res) => {
    try {
      const { id, studentId } = req.params;

      const classItem = await Class.findByPk(id);
      const student = await Student.findByPk(studentId);

      if (!classItem) {
        return res.status(404).json({ error: "Turma não encontrada" });
      }

      if (!student) {
        return res.status(404).json({ error: "Aluno não encontrado" });
      }

      if (!student.isActive) {
        return res.status(400).json({ error: "Aluno está inativo" });
      }

      // Verificar se o aluno já está na turma
      const isAlreadyInClass = await classItem.hasStudent(student);
      if (isAlreadyInClass) {
        return res
          .status(400)
          .json({ error: "Aluno já está matriculado nesta turma" });
      }

      // Verificar capacidade da turma
      const currentStudents = await classItem.countStudents();
      if (classItem.capacity && currentStudents >= classItem.capacity) {
        return res
          .status(400)
          .json({ error: "Turma já atingiu sua capacidade máxima" });
      }

      await classItem.addStudent(student);

      res.json({ message: "Aluno adicionado à turma com sucesso" });
    } catch (error) {
      console.error("Erro ao adicionar aluno à turma:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
);

// DELETE /api/classes/:id/students/:studentId - Remover aluno da turma
router.delete(
  "/:id/students/:studentId",
  auth("admin"),
  async (req, res) => {
    try {
      const { id, studentId } = req.params;

      const classItem = await Class.findByPk(id);
      const student = await Student.findByPk(studentId);

      if (!classItem) {
        return res.status(404).json({ error: "Turma não encontrada" });
      }

      if (!student) {
        return res.status(404).json({ error: "Aluno não encontrado" });
      }

      // Verificar se o aluno está na turma
      const isInClass = await classItem.hasStudent(student);
      if (!isInClass) {
        return res
          .status(400)
          .json({ error: "Aluno não está matriculado nesta turma" });
      }

      await classItem.removeStudent(student);

      res.json({ message: "Aluno removido da turma com sucesso" });
    } catch (error) {
      console.error("Erro ao remover aluno da turma:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
);

// POST /api/classes/:id/teachers/:teacherId - Adicionar professor à turma
router.post(
  "/:id/teachers/:teacherId",
  auth("admin"),
  async (req, res) => {
    try {
      const { id, teacherId } = req.params;

      const classItem = await Class.findByPk(id);
      const teacher = await Teacher.findByPk(teacherId);

      if (!classItem) {
        return res.status(404).json({ error: "Turma não encontrada" });
      }

      if (!teacher) {
        return res.status(404).json({ error: "Professor não encontrado" });
      }

      if (!teacher.isActive) {
        return res.status(400).json({ error: "Professor está inativo" });
      }

      // Verificar se o professor já está na turma
      const isAlreadyInClass = await classItem.hasTeacher(teacher);
      if (isAlreadyInClass) {
        return res
          .status(400)
          .json({ error: "Professor já está vinculado a esta turma" });
      }

      await classItem.addTeacher(teacher);

      res.json({ message: "Professor adicionado à turma com sucesso" });
    } catch (error) {
      console.error("Erro ao adicionar professor à turma:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
);

// DELETE /api/classes/:id/teachers/:teacherId - Remover professor da turma
router.delete(
  "/:id/teachers/:teacherId",
  auth("admin"),
  async (req, res) => {
    try {
      const { id, teacherId } = req.params;

      const classItem = await Class.findByPk(id);
      const teacher = await Teacher.findByPk(teacherId);

      if (!classItem) {
        return res.status(404).json({ error: "Turma não encontrada" });
      }

      if (!teacher) {
        return res.status(404).json({ error: "Professor não encontrado" });
      }

      // Verificar se o professor está na turma
      const isInClass = await classItem.hasTeacher(teacher);
      if (!isInClass) {
        return res
          .status(400)
          .json({ error: "Professor não está vinculado a esta turma" });
      }

      await classItem.removeTeacher(teacher);

      res.json({ message: "Professor removido da turma com sucesso" });
    } catch (error) {
      console.error("Erro ao remover professor da turma:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
);

// POST /api/classes/:id/subjects/:subjectId - Adicionar disciplina à turma
router.post(
  "/:id/subjects/:subjectId",
  auth("admin"),
  async (req, res) => {
    try {
      const { id, subjectId } = req.params;

      const classItem = await Class.findByPk(id);
      const subject = await Subject.findByPk(subjectId);

      if (!classItem) {
        return res.status(404).json({ error: "Turma não encontrada" });
      }

      if (!subject) {
        return res.status(404).json({ error: "Disciplina não encontrada" });
      }

      if (!subject.isActive) {
        return res.status(400).json({ error: "Disciplina está inativa" });
      }

      // Verificar se a disciplina já está na turma
      const isAlreadyInClass = await classItem.hasSubject(subject);
      if (isAlreadyInClass) {
        return res
          .status(400)
          .json({ error: "Disciplina já está vinculada a esta turma" });
      }

      await classItem.addSubject(subject);

      res.json({ message: "Disciplina adicionada à turma com sucesso" });
    } catch (error) {
      console.error("Erro ao adicionar disciplina à turma:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
);

// DELETE /api/classes/:id/subjects/:subjectId - Remover disciplina da turma
router.delete(
  "/:id/subjects/:subjectId",
  auth("admin"),
  async (req, res) => {
    try {
      const { id, subjectId } = req.params;

      const classItem = await Class.findByPk(id);
      const subject = await Subject.findByPk(subjectId);

      if (!classItem) {
        return res.status(404).json({ error: "Turma não encontrada" });
      }

      if (!subject) {
        return res.status(404).json({ error: "Disciplina não encontrada" });
      }

      // Verificar se a disciplina está na turma
      const isInClass = await classItem.hasSubject(subject);
      if (!isInClass) {
        return res
          .status(400)
          .json({ error: "Disciplina não está vinculada a esta turma" });
      }

      await classItem.removeSubject(subject);

      res.json({ message: "Disciplina removida da turma com sucesso" });
    } catch (error) {
      console.error("Erro ao remover disciplina da turma:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
);

// Rotas para vincular/desvincular professor a turma e disciplina
router.post(
  "/:classId/teachers/:teacherId/subjects/:subjectId",
  auth("admin"),
  async (req, res) => {
    try {
      const { classId, teacherId, subjectId } = req.params;

      const classItem = await Class.findByPk(classId);
      const teacher = await Teacher.findByPk(teacherId);
      const subject = await Subject.findByPk(subjectId);

      if (!classItem || !teacher || !subject) {
        return res.status(404).json({ error: "Turma, professor ou disciplina não encontrados" });
      }

      const [teacherClassSubject, created] = await TeacherClassSubject.findOrCreate({
        where: { teacherId, classId, subjectId },
        defaults: { teacherId, classId, subjectId },
      });

      if (!created) {
        return res.status(400).json({ error: "Professor já vinculado a esta turma e disciplina" });
      }

      res.status(201).json({ message: "Vínculo criado com sucesso", teacherClassSubject });
    } catch (error) {
      console.error("Erro ao vincular professor a turma e disciplina:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
);

router.delete(
  "/:classId/teachers/:teacherId/subjects/:subjectId",
  auth("admin"),
  async (req, res) => {
    try {
      const { classId, teacherId, subjectId } = req.params;

      const deletedCount = await TeacherClassSubject.destroy({
        where: { teacherId, classId, subjectId },
      });

      if (deletedCount === 0) {
        return res.status(404).json({ error: "Vínculo não encontrado" });
      }

      res.json({ message: "Vínculo removido com sucesso" });
    } catch (error) {
      console.error("Erro ao desvincular professor de turma e disciplina:", error);
      res.status(500).json({ error: "Erro interno do servidor" });
    }
  }
);

module.exports = router;


