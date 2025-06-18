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

// Define associations
// User associations
User.hasOne(Student, { foreignKey: 'userId', as: 'studentProfile' });
User.hasOne(Teacher, { foreignKey: 'userId', as: 'teacherProfile' });
Student.belongsTo(User, { foreignKey: 'userId' });
Teacher.belongsTo(User, { foreignKey: 'userId' });

// Class associations
Class.belongsToMany(Student, { through: 'ClassStudents', foreignKey: 'classId' });
Student.belongsToMany(Class, { through: 'ClassStudents', foreignKey: 'studentId' });

Class.belongsToMany(Teacher, { through: 'ClassTeachers', foreignKey: 'classId' });
Teacher.belongsToMany(Class, { through: 'ClassTeachers', foreignKey: 'teacherId' });

Class.belongsToMany(Subject, { through: 'ClassSubjects', foreignKey: 'classId' });
Subject.belongsToMany(Class, { through: 'ClassSubjects', foreignKey: 'subjectId' });

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
  Attendance
};

