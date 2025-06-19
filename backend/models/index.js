const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    logging: false,
    pool: {
      max: 5,
      min: 0,
      acquire: 30000,
      idle: 10000
    }
  }
);

// Import models
const User = require('./User')(sequelize);
const Student = require('./Student')(sequelize);
const Teacher = require('./Teacher')(sequelize);
const Subject = require('./Subject')(sequelize);
const Class = require('./Class')(sequelize);
const Attendance = require('./Attendance')(sequelize);
const TeacherClassSubject = require("./TeacherClassSubject")(sequelize);


// Define associations
// User associations
User.hasOne(Student, { foreignKey: 'userId', as: 'studentProfile' });
User.hasOne(Teacher, { foreignKey: 'userId', as: 'teacherProfile' });
Student.belongsTo(User, { foreignKey: 'userId' });
Teacher.belongsTo(User, { foreignKey: 'userId' });

// Class associations
// Garanta que o 'as' seja consistente aqui com o que você usa nas consultas e no Class.js
Class.belongsToMany(Student, { through: 'ClassStudents', foreignKey: 'classId', as: 'students' }); // <--- Adicione ou ajuste o 'as' aqui!
Student.belongsToMany(Class, { through: 'ClassStudents', foreignKey: 'studentId', as: 'classes' }); // <--- Adicione ou ajuste o 'as' aqui!

Class.belongsToMany(Teacher, { through: 'ClassTeachers', foreignKey: 'classId', as: 'teachers' }); // <--- Adicione ou ajuste o 'as' aqui!
Teacher.belongsToMany(Class, { through: 'ClassTeachers', foreignKey: 'teacherId', as: 'classes' }); // <--- Adicione ou ajuste o 'as' aqui!

Class.belongsToMany(Subject, { through: 'ClassSubjects', foreignKey: 'classId', as: 'subjects' }); // <--- Adicione ou ajuste o 'as' aqui!
Subject.belongsToMany(Class, { through: 'ClassSubjects', foreignKey: 'subjectId', as: 'classes' }); // <--- Adicione ou ajuste o 'as' aqui!

Teacher.hasMany(TeacherClassSubject, { foreignKey: "teacherId" });
Class.hasMany(TeacherClassSubject, { foreignKey: "classId" });
Subject.hasMany(TeacherClassSubject, { foreignKey: "subjectId" });
TeacherClassSubject.belongsTo(Teacher, { foreignKey: "teacherId" });
TeacherClassSubject.belongsTo(Class, { foreignKey: "classId" });
TeacherClassSubject.belongsTo(Subject, { foreignKey: "subjectId" });

// Attendance associations
Attendance.belongsTo(Student, { foreignKey: 'studentId' });
Attendance.belongsTo(Class, { foreignKey: 'classId' });
Attendance.belongsTo(Subject, { foreignKey: 'subjectId' });
Attendance.belongsTo(Teacher, { foreignKey: 'teacherId' });

Student.hasMany(Attendance, { foreignKey: 'studentId' });
Class.hasMany(Attendance, { foreignKey: 'classId' });
Subject.hasMany(Attendance, { foreignKey: 'subjectId' });
Teacher.hasMany(Attendance, { foreignKey: 'teacherId' });

module.exports = {
  sequelize,
  User,
  Student,
  Teacher,
  Subject,
  Class,
  Attendance,
  TeacherClassSubject,
};



