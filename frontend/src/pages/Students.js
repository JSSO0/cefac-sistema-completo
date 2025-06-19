import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Students.css';

const Students = () => {
  const [students, setStudents] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    //userId: '',
    fullName: '',
    birthDate: '',
    phone: '',
    address: '',
    parentName: '',
    parentPhone: ''
  });

  const { user } = useAuth();

  useEffect(() => {
    fetchStudents();
    fetchUsers();
  }, []);

  const fetchStudents = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/students');
      setStudents(response.data);
    } catch (error) {
      setError('Erro ao carregar alunos');
      console.error('Erro ao carregar alunos:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/users');
      setUsers(response.data.filter(u => u.role === 'student' && !u.studentProfile));
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingStudent) {
        await axios.put(`http://localhost:3001/api/students/${editingStudent.id}`, formData);
      } else {
        await axios.post('http://localhost:3001/api/students', formData);
      }
      
      fetchStudents();
      fetchUsers();
      setShowModal(false);
      setEditingStudent(null);
      resetForm();
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao salvar aluno');
    }
  };

  const resetForm = () => {
    setFormData({
      //userId: '',
      fullName: '',
      birthDate: '',
      phone: '',
      address: '',
      parentName: '',
      parentPhone: ''
    });
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      //userId: student.userId,
      fullName: student.fullName,
      birthDate: student.birthDate || '',
      phone: student.phone || '',
      address: student.address || '',
      parentName: student.parentName || '',
      parentPhone: student.parentPhone || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (studentId) => {
    if (window.confirm('Tem certeza que deseja desativar este aluno?')) {
      try {
        await axios.delete(`http://localhost:3001/api/students/${studentId}`);
        fetchStudents();
      } catch (error) {
        setError('Erro ao desativar aluno');
      }
    }
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
    <div className="students-page">
      <div className="page-header">
        <h1>Gerenciamento de Alunos</h1>
        {user?.role === 'admin' && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            + Novo Aluno
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="students-table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Matrícula</th>
              <th>Nome Completo</th>
              <th>Data Nascimento</th>
              <th>Telefone</th>
              <th>Responsável</th>
              <th>Status</th>
              {user?.role === 'admin' && <th>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {students.map((student) => (
              <tr key={student.id}>
                <td>{student.enrollmentNumber}</td>
                <td>{student.fullName}</td>
                <td>{formatDate(student.birthDate)}</td>
                <td>{student.phone || '-'}</td>
                <td>{student.parentName || '-'}</td>
                <td>
                  <span className={`status-badge ${student.isActive ? 'active' : 'inactive'}`}>
                    {student.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                {user?.role === 'admin' && (
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-sm btn-outline"
                        onClick={() => handleEdit(student)}
                      >
                        Editar
                      </button>
                      {student.isActive && (
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(student.id)}
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
              <h2>{editingStudent ? 'Editar Aluno' : 'Novo Aluno'}</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowModal(false);
                  setEditingStudent(null);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">


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
                  <label className="form-label">Nome do Responsável</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Telefone do Responsável</label>
                  <input
                    type="tel"
                    className="form-input"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    placeholder="(00) 00000-0000"
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => {
                    setShowModal(false);
                    setEditingStudent(null);
                    resetForm();
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingStudent ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Students;

