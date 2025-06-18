const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Class = sequelize.define('Class', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 100]
      }
    },
    grade: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [1, 50]
      }
    },
    shift: {
      type: DataTypes.ENUM('morning', 'afternoon', 'evening'),
      allowNull: false,
      defaultValue: 'morning'
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      validate: {
        min: 2020,
        max: 2030
      }
    },
    capacity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      validate: {
        min: 1
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'classes',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['name', 'year']
      }
    ]
  });

  Class.associate = (models) => {
    // Relacionamento many-to-many com Student
    Class.belongsToMany(models.Student, {
      through: 'ClassStudents',
      as: 'students',
      foreignKey: 'classId',
      otherKey: 'studentId'
    });

    // Relacionamento many-to-many com Teacher
    Class.belongsToMany(models.Teacher, {
      through: 'ClassTeachers',
      as: 'teachers',
      foreignKey: 'classId',
      otherKey: 'teacherId'
    });

    // Relacionamento many-to-many com Subject
    Class.belongsToMany(models.Subject, {
      through: 'ClassSubjects',
      as: 'subjects',
      foreignKey: 'classId',
      otherKey: 'subjectId'
    });

    // Relacionamento one-to-many com Attendance
    Class.hasMany(models.Attendance, {
      foreignKey: 'classId',
      as: 'attendanceRecords'
    });
  };

  return Class;
};

