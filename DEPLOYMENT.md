# 🐳 Deployment con Docker

## 🚀 Instrucciones de Despliegue

### Opción 1: Docker Compose (Recomendado)

```bash
# 1. Clona el repositorio
git clone <tu-repositorio>
cd whatsapp-template-messenger

# 2. Configura las variables de entorno
cp .env.example .env
# Edita .env con tus credenciales reales

# 3. Construye y ejecuta con Docker Compose
docker-compose up --build

# 4. La aplicación estará disponible en:
# http://localhost:5001
```

### Opción 2: Docker Manual

```bash
# 1. Construir la imagen
npm run docker:build

# 2. Ejecutar el contenedor
npm run docker:run

# O manualmente:
docker run -p 5001:5001 --env-file .env whatsapp-messenger
```

### Opción 3: Producción

```bash
# 1. Construir para producción
docker build -t whatsapp-messenger:prod .

# 2. Ejecutar en producción
docker run -d \
  --name whatsapp-messenger \
  -p 5001:5001 \
  --env-file .env \
  --restart unless-stopped \
  whatsapp-messenger:prod
```

## 🔧 Variables de Entorno Requeridas

Asegúrate de configurar estas variables en tu archivo `.env`:

```env
# Server
PORT=5001
NODE_ENV=production

# WhatsApp API
META_ACCESS_TOKEN=tu_token_aqui
FROM_PHONE_NUMBER_ID=tu_phone_number_id_aqui
WHATSAPP_BUSINESS_ACCOUNT_ID=tu_business_account_id_aqui
```

## 🌐 Despliegue en la Nube

### Railway
```bash
# 1. Instala Railway CLI
npm install -g @railway/cli

# 2. Login y deploy
railway login
railway init
railway up
```

### Heroku
```bash
# 1. Instala Heroku CLI
# 2. Login y crea app
heroku login
heroku create tu-app-name

# 3. Configura variables de entorno
heroku config:set META_ACCESS_TOKEN=tu_token
heroku config:set FROM_PHONE_NUMBER_ID=tu_id
heroku config:set WHATSAPP_BUSINESS_ACCOUNT_ID=tu_business_id

# 4. Deploy
git push heroku main
```

### DigitalOcean App Platform
1. Conecta tu repositorio GitHub
2. Configura las variables de entorno
3. Deploy automático

## 🔍 Verificación

Una vez desplegado, verifica que funciona:

```bash
# Health check
curl http://localhost:5001/health

# API endpoints
curl http://localhost:5001/api/templates
curl http://localhost:5001/api/users/pending
```

## 🐛 Troubleshooting

### Error de conexión MongoDB
- Verifica que tu IP esté en la whitelist de MongoDB Atlas
- Confirma las credenciales de MongoDB

### Error de WhatsApp API
- Verifica que el `FROM_PHONE_NUMBER_ID` sea correcto
- Confirma que el token tenga los permisos necesarios
- Asegúrate de que las plantillas estén aprobadas

### Puerto ocupado
```bash
# Encuentra el proceso usando el puerto
lsof -i :5001

# Mata el proceso
kill -9 <PID>
```

## 📊 Monitoreo

El contenedor incluye health checks automáticos. Puedes monitorear el estado:

```bash
# Ver logs
docker logs whatsapp-messenger

# Ver estado del contenedor
docker ps

# Estadísticas de uso
docker stats whatsapp-messenger
```