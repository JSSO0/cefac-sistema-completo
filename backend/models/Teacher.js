const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
  const Teacher = sequelize.define('Teacher', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    userId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      unique: true,
      references: {
        model: 'users',
        key: 'id'
      }
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 255]
      }
    },
    employeeNumber: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
      validate: {
        notEmpty: true,
        len: [1, 50]
      }
    },
    birthDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    cpf: {
      type: DataTypes.STRING(14),
      allowNull: true,
      validate: {
        len: [11, 14]
      }
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    qualification: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 255]
      }
    },
    specialization: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 255]
      }
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'teachers',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['employeeNumber']
      },
      {
        unique: true,
        fields: ['userId']
      }
    ]
  });

  Teacher.associate = (models) => {
    // Relacionamento one-to-one com User
    Teacher.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });

    // Relacionamento many-to-many com Class
    Teacher.belongsToMany(models.Class, {
      through: 'ClassTeachers',
      as: 'classes',
      foreignKey: 'teacherId',
      otherKey: 'classId'
    });

    // Relacionamento many-to-many com Subject
    Teacher.belongsToMany(models.Subject, {
      through: 'TeacherSubjects',
      as: 'subjects',
      foreignKey: 'teacherId',
      otherKey: 'subjectId'
    });
  };

  return Teacher;
};

