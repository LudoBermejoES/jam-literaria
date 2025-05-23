# Roadmap para la Aplicación de Jam Literaria

## PREVIO

Todos los comandos deberán ir con --yes o similar para que no se pida nada al usuario

## Fase 1: Configuración Inicial y Estructura del Proyecto

### 1.1 Configuración del Entorno de Desarrollo
- [ ] Instalar Node.js (v22+ recomendada)
- [ ] Instalar Git para control de versiones
- [ ] Configurar un editor de código (VS Code recomendado)
- [ ] Configurar estructura de directorios según arquitectura moderna:
  ```
  /
  ├── server/                 # Backend
  │   ├── api/                # API endpoints
  │   ├── services/           # Lógica de negocio
  │   ├── models/             # Modelos de datos
  │   ├── socket/             # Configuración Socket.io
  │   ├── utils/              # Utilidades
  │   ├── config/             # Configuraciones
  │   └── app.js              # Punto de entrada del servidor
  ├── client/                 # Frontend React
  │   ├── public/             # Archivos estáticos
  │   └── src/                # Código fuente React
  ├── tests/                  # Tests con Jest
  └── database/               # Archivos de base de datos
  ```
- [ ] Instalar extensiones recomendadas:
  - ESLint
  - Prettier
  - ES7+ React/Redux/React-Native snippets
  - SQLite Viewer

### 1.2 Inicialización del Proyecto
- [ ] Inicializar proyecto Node.js:
  ```bash
  npm init -y
  ```
- [ ] Crear aplicación React para el frontend:
  ```bash
  npx create-react-app client
  ```
- [ ] Configurar estructura del servidor:
  ```bash
  mkdir -p server/api/routes server/api/controllers server/api/middleware server/services server/models server/socket server/utils server/config
  ```
- [ ] Instalar dependencias del backend:
  ```bash
  cd server
  npm init -y
  npm install express cors express-session cookie-parser socket.io uuid
  npm install --save-dev nodemon jest supertest
  ```
- [ ] Configurar ESLint y Prettier para ambos proyectos
- [ ] Configurar scripts en package.json principal:
  ```json
  "scripts": {
    "client": "cd client && npm start",
    "server": "cd server && npm run dev",
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "test": "jest",
    "lint": "eslint ."
  }
  ```

### 1.3 Configuración de Base de Datos
- [ ] Crear directorio para base de datos
- [ ] Implementar conexión a SQLite usando el módulo nativo de Node.js v22+:
  ```javascript
  // server/models/db.js
  import { DatabaseSync } from 'node:sqlite';
  
  let database;
  
  export function initDatabase() {
    database = new DatabaseSync('./database/jam_literaria.db', {
      enableForeignKeyConstraints: true
    });
    return database;
  }
  
  export function getDatabase() {
    if (!database) {
      return initDatabase();
    }
    return database;
  }
  ```
- [ ] Crear esquema SQL inicial en database/schema.sql
- [ ] Implementar script de inicialización de base de datos

### 1.4 Configuración de Testing
- [ ] Instalar Jest y configurar para ambos proyectos
- [ ] Configurar entorno de pruebas para el backend
- [ ] Configurar entorno de pruebas para el frontend con React Testing Library
- [ ] Preparar base de datos de prueba
- [ ] Crear helpers para tests

## Fase 2: Implementación del Backend

### 2.1 Sistema de Autenticación
- [ ] Implementar modelo de Usuario en server/models/User.js
- [ ] Crear servicio de usuario en server/services/userService.js
- [ ] Implementar controlador de autenticación en server/api/controllers/authController.js
- [ ] Crear rutas de autenticación en server/api/routes/auth.js
- [ ] Implementar middleware de autenticación
- [ ] Crear tests para el sistema de autenticación

### 2.2 Sistema de Sesiones
- [ ] Implementar modelo de Sesión en server/models/Session.js
- [ ] Crear servicio de sesión en server/services/sessionService.js
- [ ] Implementar controlador de sesiones en server/api/controllers/sessionController.js
- [ ] Crear rutas para sesiones en server/api/routes/sessions.js
- [ ] Implementar generación de códigos únicos
- [ ] Crear tests para el sistema de sesiones

### 2.3 Sistema de Ideas
- [ ] Implementar modelo de Idea en server/models/Idea.js
- [ ] Crear servicio de ideas en server/services/ideaService.js
- [ ] Implementar controlador de ideas en server/api/controllers/ideaController.js
- [ ] Crear rutas para gestión de ideas en server/api/routes/ideas.js
- [ ] Implementar validaciones para ideas
- [ ] Crear tests para el sistema de ideas

### 2.4 Sistema de Votación
- [ ] Implementar modelo de Voto en server/models/Vote.js
- [ ] Crear servicio de votación en server/services/voteService.js
- [ ] Implementar lógica de selección en server/services/votingService.js
- [ ] Implementar controlador de votación en server/api/controllers/voteController.js
- [ ] Crear rutas para sistema de votación en server/api/routes/votes.js
- [ ] Crear tests para el sistema de votación

### 2.5 Implementación de Socket.io
- [ ] Configurar servidor Socket.io en server/socket/index.js
- [ ] Implementar handlers para eventos de sesión en server/socket/sessionHandlers.js
- [ ] Implementar handlers para eventos de ideas en server/socket/ideaHandlers.js
- [ ] Implementar handlers para eventos de votación en server/socket/voteHandlers.js
- [ ] Crear tests para comunicación en tiempo real

## Fase 3: Implementación del Frontend (React)

### 3.1 Configuración y Estructura
- [ ] Configurar React Router para navegación
- [ ] Implementar estructura de componentes
- [ ] Configurar contextos para estado global
- [ ] Implementar cliente para API en client/src/services/api.js
- [ ] Configurar cliente Socket.io en client/src/services/socket.js

### 3.2 Componentes Comunes
- [ ] Implementar componentes UI comunes:
  - Botones
  - Inputs
  - Cards
  - Layouts
  - Loaders
  - Notificaciones
- [ ] Crear estilos para componentes comunes
- [ ] Implementar sistema de temas

### 3.3 Pantalla de Introducción (Nombre)
- [ ] Implementar componente de entrada de nombre
- [ ] Crear página de autenticación
- [ ] Implementar validación de formulario
- [ ] Integrar con API de autenticación
- [ ] Implementar almacenamiento de sesión

### 3.4 Pantalla de Selección de Sesión
- [ ] Implementar componente para crear sesión
- [ ] Implementar componente para unirse a sesión
- [ ] Crear página de selección de sesión
- [ ] Integrar con API de sesiones
- [ ] Implementar redirección basada en respuesta de API

### 3.5 Pantalla de Creación/Espera de Sesión
- [ ] Implementar componente de lista de participantes
- [ ] Crear página de sala de espera
- [ ] Implementar vista para el Maestro de Ceremonias
- [ ] Implementar vista para participantes
- [ ] Integrar con Socket.io para actualizaciones en tiempo real

### 3.6 Pantalla de Envío de Ideas
- [ ] Implementar componente de formulario de ideas
- [ ] Crear página de envío de ideas
- [ ] Implementar validación de ideas
- [ ] Implementar contador de ideas enviadas
- [ ] Integrar con API y Socket.io

### 3.7 Pantalla de Votación
- [ ] Implementar componente de tarjeta de idea
- [ ] Implementar componente de selección para votación
- [ ] Crear página de votación
- [ ] Implementar sistema de contador de votos
- [ ] Integrar con API y Socket.io

### 3.8 Pantalla de Resultados
- [ ] Implementar componente de visualización de resultados
- [ ] Crear página de resultados finales
- [ ] Implementar animaciones para resultados
- [ ] Implementar botón para nueva sesión
- [ ] Integrar con API y Socket.io

## Fase 4: Optimización y Testing Avanzado

### 4.1 Optimización de Frontend
- [ ] Implementar lazy loading para componentes grandes
- [ ] Optimizar bundles con code splitting
- [ ] Implementar memoización donde sea necesario
- [ ] Optimizar renderizado de listas
- [ ] Implementar estrategias de caching

### 4.2 Optimización de Backend
- [ ] Optimizar consultas SQL
- [ ] Implementar mecanismos de caché
- [ ] Optimizar manejo de conexiones de Socket.io
- [ ] Implementar rate limiting
- [ ] Optimizar validación de datos

### 4.3 Testing Completo
- [ ] Completar tests unitarios para todos los servicios
- [ ] Implementar tests de integración para todas las API
- [ ] Crear tests para componentes React
- [ ] Implementar tests end-to-end con Cypress o Playwright
- [ ] Verificar cobertura de tests

### 4.4 Optimización Mobile
- [ ] Verificar responsive design en múltiples dispositivos
- [ ] Optimizar experiencia táctil
- [ ] Mejorar tiempos de carga en conexiones lentas
- [ ] Implementar service workers para offline capabilities
- [ ] Probar en diferentes navegadores móviles

## Fase 5: Despliegue y Documentación

### 5.1 Preparación para Producción
- [ ] Configurar variables de entorno
- [ ] Implementar logging apropiado
- [ ] Configurar manejo de errores para producción
- [ ] Optimizar build de React
- [ ] Crear scripts de despliegue

### 5.2 Documentación
- [ ] Crear documentación técnica
- [ ] Documentar API con Swagger o similar
- [ ] Crear guía de usuario
- [ ] Documentar proceso de instalación y configuración
- [ ] Crear README detallado

### 5.3 Despliegue
- [ ] Elegir plataforma de hosting
- [ ] Configurar dominio
- [ ] Implementar SSL
- [ ] Configurar CI/CD
- [ ] Realizar despliegue inicial

## Fase 6: Implementación del Algoritmo de Votación

### 6.1 Diseño del Algoritmo
- [ ] Definir todos los casos posibles de votación
- [ ] Diseñar algoritmo para manejo de empates
- [ ] Implementar función de agrupación de ideas por votos
- [ ] Desarrollar lógica para múltiples rondas
- [ ] Crear sistema de selección final

### 6.2 Implementación del Algoritmo
- [ ] Desarrollar la función determinarAccionSiguiente() en server/services/votingService.js
- [ ] Implementar la función agruparIdeasPorVotos()
- [ ] Crear función prepararNuevaRonda() para manejo de desempates
- [ ] Desarrollar función finalizarSeleccion() para finalizar el proceso
- [ ] Integrar con el sistema de sesiones

### 6.3 Testing del Algoritmo
- [ ] Implementar tests para todos los escenarios de votación:
  - [ ] T01: 3 ideas con mismo número de votos (empatadas)
  - [ ] T02: 2 ideas con más votos, 1 idea en segunda posición
  - [ ] T03: 2 ideas con más votos, múltiples empatadas en segunda posición
  - [ ] T04: 1 idea con más votos, 2 empatadas en segunda posición
  - [ ] T05: 1 idea con más votos, 1 en segunda, 1 en tercera
  - [ ] T06: 1 idea con más votos, 1 en segunda, múltiples en tercera
  - [ ] T07: 1 idea con más votos, múltiples (>2) en segunda
  - [ ] T08: Más de 3 ideas empatadas con mayor número de votos
  - [ ] T09: Segunda ronda con ideas previamente elegidas
  - [ ] T10: Tercera ronda para desempate final

## Hitos y Deadlines

| Fase | Descripción | Deadline |
|------|-------------|----------|
| 1    | Configuración inicial y estructura | Semana 1 |
| 2    | Implementación del backend | Semana 3 |
| 3    | Implementación del frontend | Semana 5 |
| 4    | Optimización y testing | Semana 6 |
| 5    | Despliegue y documentación | Semana 7 |
| 6    | Algoritmo de votación | Semana 8 |
| -    | **Lanzamiento** | Semana 9 |

## Tecnologías Clave

- **Node.js v22+**: Para aprovechar el módulo nativo SQLite y otras mejoras
- **Express**: Framework para el backend
- **React**: Biblioteca para el frontend
- **SQLite (node:sqlite)**: Base de datos ligera integrada
- **Socket.io**: Comunicación en tiempo real
- **Jest**: Testing
- **ESM**: ECMAScript Modules para una sintaxis moderna

## Consideraciones Adicionales

1. **Performance**: Monitorizar rendimiento en clientes de baja potencia
2. **Accesibilidad**: Asegurar que la aplicación sea usable para todos
3. **Internacionalización**: Preparar la aplicación para futura traducción
4. **Escalabilidad**: Diseñar para permitir crecimiento futuro
5. **Mantenibilidad**: Código limpio, bien documentado y testeado 