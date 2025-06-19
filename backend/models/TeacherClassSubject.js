const { DataTypes } = require("sequelize");

module.exports = (sequelize) => {
  const TeacherClassSubject = sequelize.define("TeacherClassSubject", {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    teacherId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "teachers",
        key: "id",
      },
    },
    classId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "classes",
        key: "id",
      },
    },
    subjectId: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "subjects",
        key: "id",
      },
    },
  }, {
    tableName: "teacher_class_subjects",
    timestamps: true,
    indexes: [
      {
        unique: true,
        fields: ["teacherId", "classId", "subjectId"],
      },
    ],
  });

  TeacherClassSubject.associate = (models) => {
    TeacherClassSubject.belongsTo(models.Teacher, { foreignKey: "teacherId" });
    TeacherClassSubject.belongsTo(models.Class, { foreignKey: "classId" });
    TeacherClassSubject.belongsTo(models.Subject, { foreignKey: "subjectId" });
  };

  return TeacherClassSubject;
};


