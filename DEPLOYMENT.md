# Instruções de Implantação - Sistema CEFAC

## Pré-requisitos do Servidor

### Software Necessário
- **Node.js** versão 18 ou superior
- **npm** (incluído com Node.js)
- **PM2** para gerenciamento de processos (opcional, mas recomendado)
- **Nginx** para proxy reverso (recomendado para produção)

### Banco de Dados
- Acesso ao MySQL configurado com as credenciais fornecidas
- Conexão de rede liberada para o servidor de aplicação

## Instalação

### 1. Preparação do Ambiente

```bash
# Instalar Node.js (Ubuntu/Debian)
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Instalar PM2 globalmente
sudo npm install -g pm2

# Criar diretório da aplicação
sudo mkdir -p /var/www/cefac-system
sudo chown $USER:$USER /var/www/cefac-system
```

### 2. Deploy do Backend

```bash
# Navegar para o diretório
cd /var/www/cefac-system

# Copiar arquivos do backend
cp -r /caminho/para/backend ./

# Instalar dependências
cd backend
npm install --production

# Configurar variáveis de ambiente
cp .env.example .env
nano .env
```

**Configurar o arquivo .env:**
```
DB_HOST=mysql.cefacfb.com.br
DB_USER=cefacfb
DB_PASSWORD=cefac2025
DB_NAME=cefacfb
JWT_SECRET=cefac_jwt_secret_key_2025_secure
PORT=3001
NODE_ENV=production
```

### 3. Deploy do Frontend

```bash
# Voltar ao diretório principal
cd /var/www/cefac-system

# Copiar build do frontend
cp -r /caminho/para/frontend/build ./frontend-build

# Ou fazer build no servidor
cp -r /caminho/para/frontend ./frontend
cd frontend
npm install
npm run build
mv build ../frontend-build
cd ..
rm -rf frontend
```

### 4. Configuração do PM2

Criar arquivo `ecosystem.config.js`:

```javascript
module.exports = {
  apps: [{
    name: 'cefac-backend',
    script: './backend/server.js',
    cwd: '/var/www/cefac-system',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production',
      PORT: 3001
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

```bash
# Criar diretório de logs
mkdir logs

# Iniciar aplicação com PM2
pm2 start ecosystem.config.js

# Salvar configuração do PM2
pm2 save

# Configurar PM2 para iniciar no boot
pm2 startup
```

### 5. Configuração do Nginx

Criar arquivo `/etc/nginx/sites-available/cefac-system`:

```nginx
server {
    listen 80;
    server_name seu-dominio.com;

    # Frontend (React build)
    location / {
        root /var/www/cefac-system/frontend-build;
        index index.html index.htm;
        try_files $uri $uri/ /index.html;
    }

    # API Backend
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Logs
    access_log /var/log/nginx/cefac-system.access.log;
    error_log /var/log/nginx/cefac-system.error.log;
}
```

```bash
# Ativar site
sudo ln -s /etc/nginx/sites-available/cefac-system /etc/nginx/sites-enabled/

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 6. SSL com Let's Encrypt (Opcional)

```bash
# Instalar Certbot
sudo apt install certbot python3-certbot-nginx

# Obter certificado SSL
sudo certbot --nginx -d seu-dominio.com

# Renovação automática
sudo crontab -e
# Adicionar linha:
# 0 12 * * * /usr/bin/certbot renew --quiet
```

## Configuração de Firewall

```bash
# UFW (Ubuntu)
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# Ou iptables
sudo iptables -A INPUT -p tcp --dport 22 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 80 -j ACCEPT
sudo iptables -A INPUT -p tcp --dport 443 -j ACCEPT
```

## Monitoramento e Manutenção

### Comandos PM2 Úteis

```bash
# Ver status das aplicações
pm2 status

# Ver logs
pm2 logs cefac-backend

# Reiniciar aplicação
pm2 restart cefac-backend

# Parar aplicação
pm2 stop cefac-backend

# Monitoramento em tempo real
pm2 monit
```

### Backup do Banco de Dados

```bash
# Script de backup (criar em /var/www/cefac-system/backup.sh)
#!/bin/bash
DATE=$(date +%Y%m%d_%H%M%S)
mysqldump -h mysql.cefacfb.com.br -u cefacfb -pcefac2025 cefacfb > /var/www/cefac-system/backups/backup_$DATE.sql
find /var/www/cefac-system/backups -name "backup_*.sql" -mtime +7 -delete

# Tornar executável
chmod +x backup.sh

# Agendar no crontab (backup diário às 2h)
0 2 * * * /var/www/cefac-system/backup.sh
```

### Logs e Monitoramento

```bash
# Ver logs do Nginx
sudo tail -f /var/log/nginx/cefac-system.access.log
sudo tail -f /var/log/nginx/cefac-system.error.log

# Ver logs da aplicação
pm2 logs cefac-backend --lines 100

# Monitorar recursos do sistema
htop
df -h
free -h
```

## Atualizações

### Atualizar Backend

```bash
cd /var/www/cefac-system/backend

# Backup da versão atual
cp -r . ../backend-backup-$(date +%Y%m%d)

# Atualizar código
# (copiar novos arquivos)

# Instalar novas dependências
npm install --production

# Reiniciar aplicação
pm2 restart cefac-backend
```

### Atualizar Frontend

```bash
cd /var/www/cefac-system

# Backup da versão atual
cp -r frontend-build frontend-build-backup-$(date +%Y%m%d)

# Substituir build
# (copiar novo build)

# Não é necessário reiniciar nada para o frontend
```

## Solução de Problemas

### Aplicação não inicia
```bash
# Verificar logs
pm2 logs cefac-backend

# Verificar se a porta está em uso
sudo netstat -tlnp | grep :3001

# Verificar conexão com banco
cd /var/www/cefac-system/backend
node -e "require('./models').sequelize.authenticate().then(() => console.log('OK')).catch(console.error)"
```

### Problemas de conexão
```bash
# Verificar status do Nginx
sudo systemctl status nginx

# Testar configuração
sudo nginx -t

# Verificar logs
sudo tail -f /var/log/nginx/error.log
```

### Performance
```bash
# Monitorar recursos
pm2 monit

# Verificar logs de erro
pm2 logs cefac-backend --err

# Analisar queries lentas no MySQL
# (configurar slow query log no MySQL)
```

## Contatos de Suporte

- **Desenvolvedor**: [Informações de contato]
- **Administrador do Sistema**: [Informações de contato]
- **Suporte MySQL**: [Informações do provedor]

---

**Importante**: Sempre faça backup antes de qualquer atualização ou manutenção!

