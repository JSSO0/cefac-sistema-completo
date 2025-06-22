import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Attendance.css';

const Attendance = () => {
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [attendanceData, setAttendanceData] = useState({});
  const [teacherAssignments, setTeacherAssignments] = useState([]);

  const { user } = useAuth();

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        if (user?.role === 'teacher') {
          const assignmentsResponse = await axios.get('http://localhost:3001/api/attendance/teacher-assignments', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          setTeacherAssignments(assignmentsResponse.data);

          const assignedClasses = assignmentsResponse.data.map(assignment => assignment.class);
          const uniqueClasses = Array.from(new Map(assignedClasses.map(item => [item['id'], item])).values());
          setClasses(uniqueClasses);

          const assignedSubjects = assignmentsResponse.data.map(assignment => assignment.subject);
          const uniqueSubjects = Array.from(new Map(assignedSubjects.map(item => [item['id'], item])).values());
          setSubjects(uniqueSubjects);

        } else if (user?.role === 'admin') {
          const classesResponse = await axios.get('http://localhost:3001/api/classes', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          setClasses(classesResponse.data.filter(c => c.isActive));

          const subjectsResponse = await axios.get('http://localhost:3001/api/subjects', {
            headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
          });
          setSubjects(subjectsResponse.data.filter(s => s.isActive));
        }
      } catch (err) {
        setError('Erro ao carregar dados iniciais: ' + err.message);
        console.error('Erro ao carregar dados iniciais:', err);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchInitialData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedClass) {
      fetchStudentsFromClass();
    }
  }, [selectedClass]);

  useEffect(() => {
    if (selectedClass && selectedSubject && selectedDate) {
      fetchAttendanceRecords();
    }
  }, [selectedClass, selectedSubject, selectedDate]);

  const fetchStudentsFromClass = async () => {
    try {
      const response = await axios.get(`http://localhost:3001/api/classes/${selectedClass}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      setStudents(response.data.students || []);
    } catch (err) {
      console.error('Erro ao carregar alunos da turma:', err);
      setError('Erro ao carregar alunos da turma.');
    }
  };

  const fetchAttendanceRecords = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/attendance', {
        params: {
          classId: selectedClass,
          subjectId: selectedSubject,
          date: selectedDate
        },
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });
      
      const records = response.data;
      const attendanceMap = {};
      
      records.forEach(record => {
        attendanceMap[record.studentId] = {
          present: record.status === 'present',
          justification: record.justification || '',
          id: record.id
        };
      });
      
      setAttendanceRecords(records);
      setAttendanceData(attendanceMap);
    } catch (err) {
      console.error('Erro ao carregar registros de frequência:', err);
      setError('Erro ao carregar registros de frequência.');
      setAttendanceRecords([]);
      setAttendanceData({});
    }
  };

  const handleAttendanceChange = (studentId, field, value) => {
    setAttendanceData(prev => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [field]: value
      }
    }));
  };

  const saveAttendance = async () => {
    if (!selectedClass || !selectedSubject || !selectedDate) {
      setError('Selecione turma, disciplina e data');
      return;
    }

    // Validar se o professor está autorizado para esta combinação (se for professor)
    if (user?.role === 'teacher') {
      const isAuthorized = teacherAssignments.some(assignment => 
        assignment.class.id === parseInt(selectedClass) && 
        assignment.subject.id === parseInt(selectedSubject)
      );
      if (!isAuthorized) {
        setError('Você não está autorizado a registrar frequência para esta turma e disciplina.');
        return;
      }
    }

    try {
      const attendanceList = students.map(student => ({
        studentId: student.id,
        classId: parseInt(selectedClass),
        subjectId: parseInt(selectedSubject),
        date: selectedDate,
        present: attendanceData[student.id]?.present ?? true,
        justification: attendanceData[student.id]?.justification || ''
      }));

      await axios.post('http://localhost:3001/api/attendance/bulk', {
        attendanceList
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
      });

      setError('');
      alert('Frequência salva com sucesso!');
      fetchAttendanceRecords();
    } catch (err) {
      setError('Erro ao salvar frequência: ' + (err.response?.data?.error || err.message));
      console.error('Erro ao salvar frequência:', err);
    }
  };

  const getAttendanceStats = () => {
    const total = students.length;
    const present = students.filter(student => 
      attendanceData[student.id]?.present !== false
    ).length;
    const absent = total - present;
    
    return { total, present, absent };
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="attendance-page">
      <div className="page-header">
        <h1>Registro de Frequência</h1>
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="attendance-filters">
        <div className="filter-group">
          <label className="form-label">Turma *</label>
          <select
            className="form-select"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">Selecione uma turma</option>
            {classes.map((classItem) => (
              <option key={classItem.id} value={classItem.id}>
                {classItem.name} - {classItem.grade}
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="form-label">Disciplina *</label>
          <select
            className="form-select"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="">Selecione uma disciplina</option>
            {subjects.map((subject) => (
              <option key={subject.id} value={subject.id}>
                {subject.name} ({subject.code})
              </option>
            ))}
          </select>
        </div>

        <div className="filter-group">
          <label className="form-label">Data *</label>
          <input
            type="date"
            className="form-input"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>
      </div>

      {selectedClass && selectedSubject && selectedDate && students.length > 0 && (
        <div className="attendance-content">
          <div className="attendance-stats">
            <div className="stat-card">
              <span className="stat-number">{getAttendanceStats().total}</span>
              <span className="stat-label">Total de Alunos</span>
            </div>
            <div className="stat-card present">
              <span className="stat-number">{getAttendanceStats().present}</span>
              <span className="stat-label">Presentes</span>
            </div>
            <div className="stat-card absent">
              <span className="stat-number">{getAttendanceStats().absent}</span>
              <span className="stat-label">Ausentes</span>
            </div>
          </div>

          <div className="attendance-form">
            <div className="form-header">
              <h3>Lista de Chamada</h3>
              <button 
                className="btn btn-primary"
                onClick={saveAttendance}
              >
                Salvar Frequência
              </button>
            </div>

            <div className="students-attendance-list">
              {students.map((student) => (
                <div key={student.id} className="student-attendance-item">
                  <div className="student-info">
                    <span className="student-name">{student.fullName}</span>
                    <span className="student-enrollment">Matrícula: {student.enrollmentNumber}</span>
                  </div>

                  <div className="attendance-controls">
                    <div className="attendance-toggle">
                      <label className="toggle-label">
                        <input
                          type="checkbox"
                          checked={attendanceData[student.id]?.present !== false}
                          onChange={(e) => handleAttendanceChange(student.id, 'present', e.target.checked)}
                        />
                        <span className="toggle-slider"></span>
                        <span className="toggle-text">
                          {attendanceData[student.id]?.present !== false ? 'Presente' : 'Ausente'}
                        </span>
                      </label>
                    </div>

                    {attendanceData[student.id]?.present === false && (
                      <div className="justification-input">
                        <input
                          type="text"
                          className="form-input"
                          placeholder="Justificativa (opcional)"
                          value={attendanceData[student.id]?.justification || ''}
                          onChange={(e) => handleAttendanceChange(student.id, 'justification', e.target.value)}
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {selectedClass && selectedSubject && selectedDate && students.length === 0 && (
        <div className="no-students">
          <p>Nenhum aluno encontrado nesta turma.</p>
        </div>
      )}

      {(!selectedClass || !selectedSubject || !selectedDate) && (
        <div className="no-selection">
          <p>Selecione uma turma, disciplina e data para registrar a frequência.</p>
        </div>
      )}
    </div>
  );
};

export default Attendance;


