const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Subject = sequelize.define('Subject', {
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
        len: [1, 255]
      }
    },
    code: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [1, 20]
      }
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    workload: {
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
    tableName: 'subjects',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['code']
      }
    ]
  });

  Subject.associate = (models) => {
    // Relacionamento many-to-many com Class
    Subject.belongsToMany(models.Class, {
      through: 'ClassSubjects',
      as: 'classes',
      foreignKey: 'subjectId',
      otherKey: 'classId'
    });

    // Relacionamento many-to-many com Teacher
    Subject.belongsToMany(models.Teacher, {
      through: 'TeacherSubjects',
      as: 'teachers',
      foreignKey: 'subjectId',
      otherKey: 'teacherId'
    });

    // Relacionamento one-to-many com Attendance
    Subject.hasMany(models.Attendance, {
      foreignKey: 'subjectId',
      as: 'attendanceRecords'
    });
  };

  return Subject;
};

