import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Classes.css';

const Classes = () => {
  const [classes, setClasses] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showStudentsModal, setShowStudentsModal] = useState(false);
  const [editingClass, setEditingClass] = useState(null);
  const [selectedClass, setSelectedClass] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    grade: '',
    shift: 'morning',
    year: new Date().getFullYear(),
    capacity: ''
  });

  const { user } = useAuth();

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
    fetchSubjects();
    fetchStudents();
  }, []);

  const fetchClasses = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/classes');
      setClasses(response.data);
    } catch (error) {
      setError('Erro ao carregar turmas');
      console.error('Erro ao carregar turmas:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/teachers');
      setTeachers(response.data.filter(t => t.isActive));
    } catch (error) {
      console.error('Erro ao carregar professores:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/subjects');
      setSubjects(response.data.filter(s => s.isActive));
    } catch (error) {
      console.error('Erro ao carregar disciplinas:', error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/students');
      setStudents(response.data.filter(s => s.isActive));
    } catch (error) {
      console.error('Erro ao carregar alunos:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingClass) {
        await axios.put(`http://localhost:3001/api/classes/${editingClass.id}`, formData);
      } else {
        await axios.post('http://localhost:3001/api/classes', formData);
      }
      
      fetchClasses();
      setShowModal(false);
      setEditingClass(null);
      resetForm();
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao salvar turma');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      grade: '',
      shift: 'morning',
      year: new Date().getFullYear(),
      capacity: ''
    });
  };

  const handleEdit = (classItem) => {
    setEditingClass(classItem);
    setFormData({
      name: classItem.name,
      grade: classItem.grade,
      shift: classItem.shift,
      year: classItem.year,
      capacity: classItem.capacity || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (classId) => {
    if (window.confirm('Tem certeza que deseja desativar esta turma?')) {
      try {
        await axios.delete(`http://localhost:3001/api/classes/${classId}`);
        fetchClasses();
      } catch (error) {
        setError('Erro ao desativar turma');
      }
    }
  };

  const handleManageStudents = (classItem) => {
    setSelectedClass(classItem);
    setShowStudentsModal(true);
  };

  const addStudentToClass = async (studentId) => {
    try {
      await axios.post(`http://localhost:3001/api/classes/${selectedClass.id}/students/${studentId}`);
      fetchClasses();
    } catch (error) {
      setError('Erro ao adicionar aluno à turma');
    }
  };

  const removeStudentFromClass = async (studentId) => {
    try {
      await axios.delete(`http://localhost:3001/api/classes/${selectedClass.id}/students/${studentId}`);
      fetchClasses();
    } catch (error) {
      setError('Erro ao remover aluno da turma');
    }
  };

  const getShiftLabel = (shift) => {
    switch (shift) {
      case 'morning':
        return 'Manhã';
      case 'afternoon':
        return 'Tarde';
      case 'evening':
        return 'Noite';
      default:
        return shift;
    }
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="classes-page">
      <div className="page-header">
        <h1>Gerenciamento de Turmas</h1>
        {user?.role === 'admin' && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            + Nova Turma
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="classes-table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Série/Ano</th>
              <th>Turno</th>
              <th>Ano Letivo</th>
              <th>Alunos</th>
              <th>Capacidade</th>
              <th>Status</th>
              {user?.role === 'admin' && <th>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {classes.map((classItem) => (
              <tr key={classItem.id}>
                <td>{classItem.name}</td>
                <td>{classItem.grade}</td>
                <td>{getShiftLabel(classItem.shift)}</td>
                <td>{classItem.year}</td>
                <td>{classItem.students?.length || 0}</td>
                <td>{classItem.capacity || '-'}</td>
                <td>
                  <span className={`status-badge ${classItem.isActive ? 'active' : 'inactive'}`}>
                    {classItem.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                {user?.role === 'admin' && (
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-sm btn-outline"
                        onClick={() => handleEdit(classItem)}
                      >
                        Editar
                      </button>
                      <button 
                        className="btn btn-sm btn-secondary"
                        onClick={() => handleManageStudents(classItem)}
                      >
                        Alunos
                      </button>
                      {classItem.isActive && (
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(classItem.id)}
                        >
                          Desativar
                        </button>
                      )}
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal de Turma */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingClass ? 'Editar Turma' : 'Nova Turma'}</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowModal(false);
                  setEditingClass(null);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nome da Turma *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: 1º A"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Série/Ano *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    placeholder="Ex: 1º Ano"
                    required
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Turno *</label>
                  <select
                    className="form-select"
                    value={formData.shift}
                    onChange={(e) => setFormData({ ...formData, shift: e.target.value })}
                    required
                  >
                    <option value="morning">Manhã</option>
                    <option value="afternoon">Tarde</option>
                    <option value="evening">Noite</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Ano Letivo *</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                    min="2020"
                    max="2030"
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Capacidade</label>
                <input
                  type="number"
                  className="form-input"
                  value={formData.capacity}
                  onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  placeholder="Número máximo de alunos"
                  min="1"
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => {
                    setShowModal(false);
                    setEditingClass(null);
                    resetForm();
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingClass ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Gerenciar Alunos */}
      {showStudentsModal && selectedClass && (
        <div className="modal-overlay">
          <div className="modal modal-large">
            <div className="modal-header">
              <h2>Gerenciar Alunos - {selectedClass.name}</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowStudentsModal(false);
                  setSelectedClass(null);
                }}
              >
                ×
              </button>
            </div>

            <div className="modal-content">
              <div className="students-management">
                <div className="students-section">
                  <h3>Alunos na Turma ({selectedClass.students?.length || 0})</h3>
                  <div className="students-list">
                    {selectedClass.students?.map((student) => (
                      <div key={student.id} className="student-item">
                        <span>{student.fullName} ({student.enrollmentNumber})</span>
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => removeStudentFromClass(student.id)}
                        >
                          Remover
                        </button>
                      </div>
                    ))}
                    {(!selectedClass.students || selectedClass.students.length === 0) && (
                      <p className="no-students">Nenhum aluno matriculado nesta turma.</p>
                    )}
                  </div>
                </div>

                <div className="students-section">
                  <h3>Alunos Disponíveis</h3>
                  <div className="students-list">
                    {students
                      .filter(student => !selectedClass.students?.some(s => s.id === student.id))
                      .map((student) => (
                        <div key={student.id} className="student-item">
                          <span>{student.fullName} ({student.enrollmentNumber})</span>
                          <button 
                            className="btn btn-sm btn-primary"
                            onClick={() => addStudentToClass(student.id)}
                          >
                            Adicionar
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Classes;

