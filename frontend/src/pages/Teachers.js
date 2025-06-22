import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Teachers.css';

const Teachers = () => {
  const [teachers, setTeachers] = useState([]);
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [formData, setFormData] = useState({
    userId: '',
    fullName: '',
    birthDate: '',
    cpf: '',
    phone: '',
    address: '',
    qualification: '',
    specialization: '',
    employeeNumber: ''
  });
  const [selectedAssignments, setSelectedAssignments] = useState([]); // Para armazenar as vinculações

  const { user } = useAuth();

  useEffect(() => {
    fetchTeachers();
    fetchUsers();
    fetchClasses();
    fetchSubjects();
  }, []);

  const fetchTeachers = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/teachers');
      setTeachers(response.data);
    } catch (error) {
      setError('Erro ao carregar professores');
      console.error('Erro ao carregar professores:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/users');
      setUsers(response.data.filter(u => u.role === 'teacher' && !u.teacherProfile));
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const fetchClasses = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/classes');
      setClasses(response.data);
    } catch (error) {
      console.error('Erro ao carregar turmas:', error);
    }
  };

  const fetchSubjects = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/subjects');
      setSubjects(response.data);
    } catch (error) {
      console.error('Erro ao carregar disciplinas:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingTeacher) {
        await axios.put(`http://localhost:3001/api/teachers/${editingTeacher.id}`, { ...formData, assignments: selectedAssignments });
      } else {
        await axios.post('http://localhost:3001/api/teachers', { ...formData, assignments: selectedAssignments });
      }
      
      fetchTeachers();
      fetchUsers();
      setShowModal(false);
      setEditingTeacher(null);
      resetForm();
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao salvar professor');
    }
  };

  const resetForm = () => {
    setFormData({
      userId: '',
      fullName: '',
      birthDate: '',
      cpf: '',
      phone: '',
      address: '',
      qualification: '',
      specialization: '',
      employeeNumber: ''
    });
    setSelectedAssignments([]);
  };

  const handleEdit = (teacher) => {
    setEditingTeacher(teacher);
    setFormData({
      userId: teacher.userId,
      fullName: teacher.fullName,
      birthDate: teacher.birthDate || '',
      cpf: teacher.cpf || '',
      phone: teacher.phone || '',
      address: teacher.address || '',
      qualification: teacher.qualification || '',
      specialization: teacher.specialization || '',
      employeeNumber: teacher.employeeNumber
    });
    // TODO: Carregar as atribuições existentes do professor para edição
    setSelectedAssignments([]); // Por enquanto, reseta para evitar erros
    setShowModal(true);
  };

  const handleDelete = async (teacherId) => {
    if (window.confirm('Tem certeza que deseja desativar este professor?')) {
      try {
        await axios.delete(`http://localhost:3001/api/teachers/${teacherId}`);
        fetchTeachers();
      } catch (error) {
        setError('Erro ao desativar professor');
      }
    }
  };

  const handleAssignmentChange = (e) => {
    const [classId, subjectId] = e.target.value.split('-');
    const existingIndex = selectedAssignments.findIndex(
      (assignment) => assignment.classId === parseInt(classId) && assignment.subjectId === parseInt(subjectId)
    );

    if (existingIndex > -1) {
      // Remove se já existe
      const updatedAssignments = [...selectedAssignments];
      updatedAssignments.splice(existingIndex, 1);
      setSelectedAssignments(updatedAssignments);
    } else {
      // Adiciona se não existe
      setSelectedAssignments([
        ...selectedAssignments,
        { classId: parseInt(classId), subjectId: parseInt(subjectId) },
      ]);
    }
  };

  const isAssignmentSelected = (classId, subjectId) => {
    return selectedAssignments.some(
      (assignment) => assignment.classId === classId && assignment.subjectId === subjectId
    );
  };

  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="teachers-page">
      <div className="page-header">
        <h1>Gerenciamento de Professores</h1>
        {user?.role === 'admin' && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            + Novo Professor
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="teachers-table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Matrícula</th>
              <th>Nome Completo</th>
              <th>Telefone</th>
              <th>Qualificação</th>
              <th>Especialização</th>
              <th>Status</th>
              {user?.role === 'admin' && <th>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {teachers.map((teacher) => (
              <tr key={teacher.id}>
                <td>{teacher.employeeNumber}</td>
                <td>{teacher.fullName}</td>
                <td>{teacher.phone || '-'}</td>
                <td>{teacher.qualification || '-'}</td>
                <td>{teacher.specialization || '-'}</td>
                <td>
                  <span className={`status-badge ${teacher.isActive ? 'active' : 'inactive'}`}>
                    {teacher.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                {user?.role === 'admin' && (
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-sm btn-outline"
                        onClick={() => handleEdit(teacher)}
                      >
                        Editar
                      </button>
                      {teacher.isActive && (
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(teacher.id)}
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

      {showModal && (
        <div className="modal-overlay">
          <div className="modal">
            <div className="modal-header">
              <h2>{editingTeacher ? 'Editar Professor' : 'Novo Professor'}</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowModal(false);
                  setEditingTeacher(null);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              {!editingTeacher && (
                <div className="form-group">
                  <label className="form-label">Usuário *</label>
                  <select
                    className="form-select"
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    required
                  >
                    <option value="">Selecione um usuário</option>
                    {users.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.username} ({user.email})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Nome Completo *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Número de Matrícula *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.employeeNumber}
                  onChange={(e) => setFormData({ ...formData, employeeNumber: e.target.value })}
                  required
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Data de Nascimento</label>
                  <input
                    type="date"
                    className="form-input"
                    value={formData.birthDate}
                    onChange={(e) => setFormData({ ...formData, birthDate: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">CPF</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.cpf}
                    onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                    placeholder="000.000.000-00"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Telefone</label>
                <input
                  type="tel"
                  className="form-input"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="(00) 00000-0000"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Endereço</label>
                <textarea
                  className="form-input"
                  rows="3"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Endereço completo"
                />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Qualificação</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    placeholder="Ex: Licenciatura em Matemática"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Especialização</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.specialization}
                    onChange={(e) => setFormData({ ...formData, specialization: e.target.value })}
                    placeholder="Ex: Mestrado em Educação"
                  />
                </div>
              </div>

              {/* Seção de Vinculação de Turmas e Disciplinas */}
              <div className="form-group">
                <label className="form-label">Vinculação de Turmas e Disciplinas</label>
                <div className="assignments-list">
                  {classes.map((cls) => (
                    <div key={cls.id} className="assignment-class-group">
                      <h4>{cls.name} ({cls.grade} - {cls.shift})</h4>
                      <div className="assignment-subjects">
                        {subjects.map((sub) => (
                          <label key={sub.id} className="checkbox-label">
                            <input
                              type="checkbox"
                              value={`${cls.id}-${sub.id}`}
                              checked={isAssignmentSelected(cls.id, sub.id)}
                              onChange={handleAssignmentChange}
                            />
                            {sub.name}
                          </label>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => {
                    setShowModal(false);
                    setEditingTeacher(null);
                    resetForm();
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingTeacher ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Teachers;


