import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Subjects.css';

const Subjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSubject, setEditingSubject] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    workload: ''
  });

  const { user } = useAuth();

  useEffect(() => {
    fetchSubjects();
  }, []);

  const fetchSubjects = async () => {
    try {
      const response = await axios.get('http://localhost:3001/api/subjects');
      setSubjects(response.data);
    } catch (error) {
      setError('Erro ao carregar disciplinas');
      console.error('Erro ao carregar disciplinas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (editingSubject) {
        await axios.put(`http://localhost:3001/api/subjects/${editingSubject.id}`, formData);
      } else {
        await axios.post('http://localhost:3001/api/subjects', formData);
      }
      
      fetchSubjects();
      setShowModal(false);
      setEditingSubject(null);
      resetForm();
    } catch (error) {
      setError(error.response?.data?.error || 'Erro ao salvar disciplina');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      code: '',
      description: '',
      workload: ''
    });
  };

  const handleEdit = (subject) => {
    setEditingSubject(subject);
    setFormData({
      name: subject.name,
      code: subject.code,
      description: subject.description || '',
      workload: subject.workload || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (subjectId) => {
    if (window.confirm('Tem certeza que deseja desativar esta disciplina?')) {
      try {
        await axios.delete(`http://localhost:3001/api/subjects/${subjectId}`);
        fetchSubjects();
      } catch (error) {
        setError('Erro ao desativar disciplina');
      }
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
    <div className="subjects-page">
      <div className="page-header">
        <h1>Gerenciamento de Disciplinas</h1>
        {user?.role === 'admin' && (
          <button 
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            + Nova Disciplina
          </button>
        )}
      </div>

      {error && (
        <div className="alert alert-error">
          {error}
        </div>
      )}

      <div className="subjects-table-container">
        <table className="table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>Descrição</th>
              <th>Carga Horária</th>
              <th>Status</th>
              {user?.role === 'admin' && <th>Ações</th>}
            </tr>
          </thead>
          <tbody>
            {subjects.map((subject) => (
              <tr key={subject.id}>
                <td>{subject.code}</td>
                <td>{subject.name}</td>
                <td>{subject.description || '-'}</td>
                <td>{subject.workload ? `${subject.workload}h` : '-'}</td>
                <td>
                  <span className={`status-badge ${subject.isActive ? 'active' : 'inactive'}`}>
                    {subject.isActive ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                {user?.role === 'admin' && (
                  <td>
                    <div className="action-buttons">
                      <button 
                        className="btn btn-sm btn-outline"
                        onClick={() => handleEdit(subject)}
                      >
                        Editar
                      </button>
                      {subject.isActive && (
                        <button 
                          className="btn btn-sm btn-danger"
                          onClick={() => handleDelete(subject.id)}
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
              <h2>{editingSubject ? 'Editar Disciplina' : 'Nova Disciplina'}</h2>
              <button 
                className="modal-close"
                onClick={() => {
                  setShowModal(false);
                  setEditingSubject(null);
                  resetForm();
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit} className="modal-form">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Código *</label>
                  <input
                    type="text"
                    className="form-input"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    placeholder="Ex: MAT001"
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Carga Horária</label>
                  <input
                    type="number"
                    className="form-input"
                    value={formData.workload}
                    onChange={(e) => setFormData({ ...formData, workload: e.target.value })}
                    placeholder="Horas"
                    min="1"
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Nome da Disciplina *</label>
                <input
                  type="text"
                  className="form-input"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Matemática"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Descrição</label>
                <textarea
                  className="form-input"
                  rows="4"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Descrição da disciplina, objetivos, conteúdo programático..."
                />
              </div>

              <div className="modal-actions">
                <button 
                  type="button" 
                  className="btn btn-outline"
                  onClick={() => {
                    setShowModal(false);
                    setEditingSubject(null);
                    resetForm();
                  }}
                >
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingSubject ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Subjects;

