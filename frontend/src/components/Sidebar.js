import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Sidebar.css';

const Sidebar = () => {
  const { user } = useAuth();
  const location = useLocation();

  const menuItems = [
    {
      path: '/dashboard',
      label: 'Dashboard',
      icon: '📊',
      roles: ['admin', 'teacher', 'student', 'parent']
    },
    {
      path: '/students',
      label: 'Alunos',
      icon: '👥',
      roles: ['admin', 'teacher']
    },
    {
      path: '/teachers',
      label: 'Professores',
      icon: '👨‍🏫',
      roles: ['admin']
    },
    {
      path: '/classes',
      label: 'Turmas',
      icon: '🏫',
      roles: ['admin', 'teacher']
    },
    {
      path: '/subjects',
      label: 'Disciplinas',
      icon: '📚',
      roles: ['admin', 'teacher']
    },
    {
      path: '/attendance',
      label: 'Frequência',
      icon: '✅',
      roles: ['admin', 'teacher', 'student', 'parent']
    },
    {
      path: '/users',
      label: 'Usuários',
      icon: '👤',
      roles: ['admin']
    }
  ];

  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(user?.role)
  );

  return (
    <aside className="sidebar">
      <nav className="sidebar-nav">
        <ul className="sidebar-menu">
          {filteredMenuItems.map((item) => (
            <li key={item.path} className="sidebar-item">
              <Link
                to={item.path}
                className={`sidebar-link ${
                  location.pathname === item.path ? 'active' : ''
                }`}
              >
                <span className="sidebar-icon">{item.icon}</span>
                <span className="sidebar-label">{item.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;

