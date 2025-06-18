import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Header.css';

const Header = () => {
  const { user, logout } = useAuth();

  const getRoleLabel = (role) => {
    switch (role) {
      case 'admin':
        return 'Administrador';
      case 'teacher':
        return 'Professor';
      case 'student':
        return 'Aluno';
      case 'parent':
        return 'Responsável';
      default:
        return role;
    }
  };

  return (
    <header className="header">
      <div className="container">
        <div className="header-content">
          <div className="header-left">
            <img 
              src="/logocefac.JPG" 
              alt="CEFAC Logo" 
              className="header-logo"
            />
            <div className="header-title">
              <h1>CEFAC</h1>
              <span>Sistema de Frequência</span>
            </div>
          </div>

          <div className="header-right">
            <div className="user-info">
              <span className="user-name">{user?.username}</span>
              <span className="user-role">{getRoleLabel(user?.role)}</span>
            </div>
            <button 
              onClick={logout}
              className="btn btn-outline logout-btn"
            >
              Sair
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;

