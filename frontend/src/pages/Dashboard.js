import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import '../styles/Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();

  const getDashboardCards = () => {
    const baseCards = [
      {
        title: 'Bem-vindo!',
        content: `Olá, ${user?.username}! Você está logado como ${getRoleLabel(user?.role)}.`,
        icon: '👋',
        color: 'primary'
      }
    ];

    if (user?.role === 'admin') {
      return [
        ...baseCards,
        {
          title: 'Gestão de Usuários',
          content: 'Gerencie usuários, professores e alunos do sistema.',
          icon: '👥',
          color: 'accent',
          link: '/users'
        },
        {
          title: 'Turmas e Disciplinas',
          content: 'Configure turmas, disciplinas e vinculações.',
          icon: '🏫',
          color: 'info',
          link: '/classes'
        },
        {
          title: 'Relatórios de Frequência',
          content: 'Visualize relatórios completos de frequência.',
          icon: '📊',
          color: 'success',
          link: '/attendance'
        }
      ];
    }

    if (user?.role === 'teacher') {
      return [
        ...baseCards,
        {
          title: 'Minhas Turmas',
          content: 'Acesse suas turmas e registre a frequência dos alunos.',
          icon: '🏫',
          color: 'accent',
          link: '/classes'
        },
        {
          title: 'Registro de Frequência',
          content: 'Marque presença, faltas e justificativas.',
          icon: '✅',
          color: 'success',
          link: '/attendance'
        },
        {
          title: 'Meus Alunos',
          content: 'Visualize informações dos seus alunos.',
          icon: '👥',
          color: 'info',
          link: '/students'
        }
      ];
    }

    if (user?.role === 'student' || user?.role === 'parent') {
      return [
        ...baseCards,
        {
          title: 'Minha Frequência',
          content: 'Consulte seu histórico de frequência e faltas.',
          icon: '📋',
          color: 'accent',
          link: '/attendance'
        },
        {
          title: 'Minhas Turmas',
          content: 'Veja suas turmas e disciplinas.',
          icon: '🏫',
          color: 'info',
          link: '/classes'
        }
      ];
    }

    return baseCards;
  };

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

  const cards = getDashboardCards();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <p>Painel de controle do sistema de frequência escolar</p>
      </div>

      <div className="dashboard-grid">
        {cards.map((card, index) => (
          <div key={index} className={`dashboard-card ${card.color}`}>
            <div className="card-icon">{card.icon}</div>
            <div className="card-content">
              <h3>{card.title}</h3>
              <p>{card.content}</p>
              {card.link && (
                <a href={card.link} className="card-link">
                  Acessar →
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="dashboard-info">
        <div className="info-card">
          <h3>Sobre o Sistema</h3>
          <p>
            O Sistema de Frequência Escolar do CEFAC permite o controle completo 
            da presença dos alunos, facilitando o trabalho dos professores e 
            proporcionando transparência para alunos e responsáveis.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

