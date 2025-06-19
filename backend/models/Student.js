const {
  DataTypes
} = require('sequelize');

module.exports = (sequelize) => {
  const Student = sequelize.define('Student', {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    fullName: {
      type: DataTypes.STRING,
      allowNull: false,
      validate: {
        notEmpty: true,
        len: [2, 255]
      }
    },
    birthDate: {
      type: DataTypes.DATEONLY,
      allowNull: true
    },
    phone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    address: {
      type: DataTypes.TEXT,
      allowNull: true
    },
    parentName: {
      type: DataTypes.STRING,
      allowNull: true,
      validate: {
        len: [0, 255]
      }
    },
    parentPhone: {
      type: DataTypes.STRING(20),
      allowNull: true
    },
    isActive: {
      type: DataTypes.BOOLEAN,
      defaultValue: true
    }
  }, {
    tableName: 'students',
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ['userId']
      }
    ]
  });

  Student.associate = (models) => {
    // Relacionamento one-to-one com User
    /*Student.belongsTo(models.User, {
      foreignKey: 'userId',
      as: 'user'
    });*/

    // Relacionamento many-to-many com Class
    Student.belongsToMany(models.Class, {
      through: 'ClassStudents',
      as: 'classes',
      foreignKey: 'studentId',
      otherKey: 'classId'
    });

    // Relacionamento one-to-many com Attendance
    Student.hasMany(models.Attendance, {
      foreignKey: 'studentId',
      as: 'attendanceRecords'
    });
  };

  return Student;
};