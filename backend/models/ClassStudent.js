// models/ClassStudent.js
const {
  DataTypes
} = require('sequelize');
module.exports = (sequelize, DataTypes) => {
  const ClassStudent = sequelize.define('ClassStudent', {
    classId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    studentId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      primaryKey: true
    },
    createdAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    },
    updatedAt: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW
    }
  }, {
    tableName: 'ClassStudents',
    timestamps: true
  });
  return ClassStudent;
};