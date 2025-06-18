# Sistema de Frequência Escolar - CEFAC

## Descrição
Sistema web completo para gestão de frequência escolar do Centro Educacional Face de Cristo (CEFAC), desenvolvido com React (frontend) e Node.js (backend), integrado com banco de dados MySQL.

## Funcionalidades Principais

### 🔐 Autenticação e Controle de Acesso
- Login obrigatório com usuário e senha
- Usuário root fixo: `admin` / `senhaForte123`
- Controle de acesso baseado em perfis:
  - **Administrador**: acesso total ao sistema
  - **Professor**: acesso às turmas e disciplinas atribuídas
  - **Aluno/Responsável**: acesso à frequência individual
- Autenticação JWT com tokens seguros
- Hashing de senhas com bcrypt

### 📊 Módulos do Sistema

#### Gestão Acadêmica
- Cadastro de professores, alunos, disciplinas e turmas
- Vinculação de professores às turmas e disciplinas
- Vinculação de alunos às turmas
- Gerenciamento completo de usuários

#### Registro e Consulta de Presença
- Registro de presença/falta por aluno
- Inclusão de justificativas
- Consulta de frequência por aluno, turma e período
- Estatísticas de frequência
- Relatórios detalhados

### 🎨 Design e Interface
- Design responsivo para desktop e mobile
- Cores institucionais do CEFAC:
  - Primária: #06093E (azul escuro)
  - Destaque: #FFDE59 (amarelo)
  - Fundo: #FFFFFF (branco)
- Logo oficial do CEFAC integrada
- Interface moderna e intuitiva
- Navegação baseada no perfil do usuário

## Tecnologias Utilizadas

### Backend
- **Node.js** com Express.js
- **Sequelize ORM** para MySQL
- **JWT** para autenticação
- **bcryptjs** para hash de senhas
- **CORS** habilitado
- **dotenv** para variáveis de ambiente

### Frontend
- **React** com hooks
- **React Router DOM** para navegação
- **Axios** para requisições HTTP
- **Context API** para gerenciamento de estado
- **CSS3** com variáveis customizadas

### Banco de Dados
- **MySQL** hospedado em mysql.cefacfb.com.br
- Modelos relacionais completos
- Migrações automáticas com Sequelize

## Estrutura do Projeto

```
cefac-system/
├── backend/
│   ├── models/           # Modelos Sequelize
│   ├── routes/           # Rotas da API
│   ├── middleware/       # Middleware de autenticação
│   ├── server.js         # Servidor principal
│   └── .env             # Configurações
├── frontend/
│   ├── src/
│   │   ├── components/   # Componentes React
│   │   ├── pages/        # Páginas da aplicação
│   │   ├── contexts/     # Context API
│   │   ├── styles/       # Arquivos CSS
│   │   └── App.js        # Componente principal
│   ├── public/           # Arquivos estáticos
│   └── build/            # Build de produção
```

## Instalação e Execução

### Pré-requisitos
- Node.js 18+
- npm ou yarn
- Acesso ao banco MySQL

### Backend
```bash
cd backend
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm start        # Desenvolvimento
npm run build    # Produção
```

## Configuração

### Variáveis de Ambiente (.env)
```
DB_HOST=mysql.cefacfb.com.br
DB_USER=cefacfb
DB_PASSWORD=cefac2025
DB_NAME=cefacfb
JWT_SECRET=cefac_jwt_secret_key_2025_secure
PORT=3001
```

## API Endpoints

### Autenticação
- `POST /api/auth/login` - Login do usuário
- `POST /api/auth/register` - Registro de usuário (admin)

### Usuários
- `GET /api/users` - Listar usuários
- `POST /api/users` - Criar usuário
- `PUT /api/users/:id` - Atualizar usuário
- `DELETE /api/users/:id` - Desativar usuário

### Alunos
- `GET /api/students` - Listar alunos
- `POST /api/students` - Criar aluno
- `PUT /api/students/:id` - Atualizar aluno
- `DELETE /api/students/:id` - Desativar aluno

### Professores
- `GET /api/teachers` - Listar professores
- `POST /api/teachers` - Criar professor
- `PUT /api/teachers/:id` - Atualizar professor
- `DELETE /api/teachers/:id` - Desativar professor

### Turmas
- `GET /api/classes` - Listar turmas
- `POST /api/classes` - Criar turma
- `PUT /api/classes/:id` - Atualizar turma
- `POST /api/classes/:id/students/:studentId` - Adicionar aluno à turma
- `DELETE /api/classes/:id/students/:studentId` - Remover aluno da turma

### Disciplinas
- `GET /api/subjects` - Listar disciplinas
- `POST /api/subjects` - Criar disciplina
- `PUT /api/subjects/:id` - Atualizar disciplina
- `DELETE /api/subjects/:id` - Desativar disciplina

### Frequência
- `GET /api/attendance` - Listar registros de frequência
- `POST /api/attendance` - Criar registro de frequência
- `POST /api/attendance/bulk` - Criar registros em lote
- `PUT /api/attendance/:id` - Atualizar registro
- `GET /api/attendance/stats/:studentId` - Estatísticas do aluno

## Segurança

### Medidas Implementadas
- Senhas hasheadas com bcrypt (salt rounds: 10)
- Tokens JWT com expiração de 24 horas
- Middleware de autenticação em todas as rotas protegidas
- Validação de permissões baseada em roles
- CORS configurado adequadamente
- Sanitização de dados de entrada

### Controle de Acesso
- **Admin**: acesso completo a todas as funcionalidades
- **Professor**: acesso limitado às suas turmas e alunos
- **Aluno**: acesso apenas aos próprios dados de frequência
- **Responsável**: acesso aos dados do aluno vinculado

## Banco de Dados

### Tabelas Principais
- `users` - Usuários do sistema
- `students` - Dados dos alunos
- `teachers` - Dados dos professores
- `classes` - Turmas
- `subjects` - Disciplinas
- `attendance` - Registros de frequência
- `ClassStudents` - Relação alunos-turmas
- `ClassTeachers` - Relação professores-turmas
- `ClassSubjects` - Relação turmas-disciplinas

## Credenciais de Teste
- **Usuário**: admin
- **Senha**: senhaForte123
- **Perfil**: Administrador

## Status do Projeto
✅ **Concluído e Funcional**

### Funcionalidades Implementadas
- [x] Sistema de login e autenticação
- [x] Dashboard responsivo
- [x] Navegação baseada em perfis
- [x] API REST completa
- [x] Modelos de banco de dados
- [x] Middleware de segurança
- [x] Interface com design institucional
- [x] Integração frontend-backend
- [x] Build de produção

### Próximos Passos (Futuras Implementações)
- [ ] Páginas completas de CRUD para todas as entidades
- [ ] Relatórios em PDF/Excel
- [ ] Notificações por email
- [ ] Dashboard com gráficos e estatísticas
- [ ] Sistema de backup automático
- [ ] Logs de auditoria

## Suporte
Para suporte técnico ou dúvidas sobre o sistema, entre em contato com a equipe de desenvolvimento.

---

**CEFAC - Centro Educacional Face de Cristo**  
*"Sonhamos grande desde pequenos!"*

