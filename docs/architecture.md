# Arquitectura de la Aplicación de Jam Literaria

## Visión General
La aplicación Jam Literaria permite organizar sesiones de escritura colaborativa donde múltiples escritores proponen ideas, votan por ellas y seleccionan tres ideas finales mediante un proceso de votación estructurado. La aplicación utilizará una arquitectura moderna con separación clara entre frontend y backend.

## Stack Tecnológico
- **Backend**: Node.js v22+ con Express
- **Frontend**: React con arquitectura de componentes
- **Lenguaje**: JavaScript moderno (ECMAScript)
- **Base de Datos**: SQLite utilizando el módulo nativo de Node.js (node:sqlite)
- **Tiempo Real**: Socket.io para comunicación bidireccional
- **Estilos**: Enfoque Mobile-First con un framework CSS ligero
- **Testing**: Jest para tests unitarios y funcionales

## Ventajas del Stack Moderno
- **Separación de Responsabilidades**: Clara división entre frontend y backend
- **Eficiencia en Desarrollo**: React para UI reactiva y modular
- **Rendimiento Optimizado**: Módulo nativo SQLite sin dependencias adicionales
- **Características Modernas**: Aprovechamiento de funcionalidades de Node.js v22
- **Escalabilidad**: Arquitectura que facilita la expansión de funcionalidades
- **Mantenibilidad**: Separación por servicios, modelos y componentes

## Estructura de Directorios
```
/
├── server/                     # Código del backend
│   ├── api/                    # API endpoints
│   │   ├── routes/             # Definiciones de rutas Express
│   │   │   ├── auth.js         # Rutas de autenticación
│   │   │   ├── sessions.js     # Rutas de sesión
│   │   │   ├── ideas.js        # Rutas para gestión de ideas
│   │   │   └── votes.js        # Rutas para votación
│   │   ├── controllers/        # Controladores de la API
│   │   │   ├── authController.js
│   │   │   ├── sessionController.js
│   │   │   ├── ideaController.js
│   │   │   └── voteController.js
│   │   └── middleware/         # Middleware Express
│   │       ├── auth.js         # Middleware de autenticación
│   │       └── validation.js   # Validación de entradas
│   ├── services/               # Lógica de negocio
│   │   ├── userService.js
│   │   ├── sessionService.js
│   │   ├── ideaService.js
│   │   ├── voteService.js
│   │   └── votingService.js    # Algoritmo de votación
│   ├── models/                 # Modelos de datos con SQLite
│   │   ├── db.js               # Configuración de base de datos
│   │   ├── User.js
│   │   ├── Session.js
│   │   ├── Idea.js
│   │   └── Vote.js
│   ├── socket/                 # Configuración tiempo real
│   │   ├── index.js            # Configuración general
│   │   ├── sessionHandlers.js  # Handlers para eventos de sesión
│   │   ├── ideaHandlers.js     # Handlers para eventos de ideas
│   │   └── voteHandlers.js     # Handlers para eventos de votación
│   ├── utils/                  # Utilidades
│   │   ├── errorHandler.js     # Manejo centralizado de errores
│   │   ├── validators.js       # Validaciones comunes
│   │   └── helpers.js          # Funciones auxiliares
│   ├── config/                 # Configuraciones
│   │   ├── app.js              # Configuración de aplicación
│   │   ├── db.js               # Configuración de base de datos
│   │   └── socket.js           # Configuración Socket.io
│   └── app.js                  # Punto de entrada del servidor
├── client/                     # Código del frontend (React)
│   ├── public/                 # Archivos estáticos
│   ├── src/                    # Código fuente React
│   │   ├── components/         # Componentes reutilizables
│   │   │   ├── common/         # Componentes comunes (botones, inputs, etc.)
│   │   │   ├── layout/         # Componentes de layout
│   │   │   ├── auth/           # Componentes de autenticación
│   │   │   ├── session/        # Componentes de sesión
│   │   │   ├── ideas/          # Componentes de ideas
│   │   │   └── voting/         # Componentes de votación
│   │   ├── pages/              # Páginas de la aplicación
│   │   │   ├── Auth/           # Páginas de autenticación
│   │   │   ├── Home/           # Página principal
│   │   │   ├── Session/        # Páginas de sesión
│   │   │   ├── Ideas/          # Páginas de ideas
│   │   │   └── Voting/         # Páginas de votación
│   │   ├── hooks/              # Custom hooks
│   │   │   ├── useAuth.js
│   │   │   ├── useSession.js
│   │   │   └── useSocket.js
│   │   ├── services/           # Servicios de cliente
│   │   │   ├── api.js          # Cliente API
│   │   │   └── socket.js       # Cliente Socket.io
│   │   ├── context/            # Contextos de React
│   │   │   ├── AuthContext.js
│   │   │   ├── SessionContext.js
│   │   │   └── SocketContext.js
│   │   ├── utils/              # Utilidades para frontend
│   │   │   ├── validators.js
│   │   │   └── helpers.js
│   │   ├── styles/             # Estilos CSS
│   │   │   ├── variables.css   # Variables CSS
│   │   │   ├── global.css      # Estilos globales
│   │   │   └── components/     # Estilos por componente
│   │   ├── App.js              # Componente principal
│   │   └── index.js            # Punto de entrada
│   ├── package.json            # Dependencias frontend
│   └── README.md               # Documentación frontend
├── tests/                      # Tests con Jest
│   ├── server/                 # Tests de backend
│   │   ├── unit/               # Tests unitarios
│   │   ├── integration/        # Tests de integración
│   │   └── e2e/                # Tests end-to-end
│   └── client/                 # Tests de frontend
│       ├── unit/               # Tests unitarios
│       └── integration/        # Tests de integración
├── database/                   # Archivos de base de datos
│   ├── schema.sql              # Esquema SQL
│   └── migrations/             # Migraciones SQL
├── package.json                # Dependencias generales
└── README.md                   # Documentación general
```

## Modelo de Datos

### Esquema de la Base de Datos (SQL)

```sql
-- Usuarios
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  last_active TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) STRICT;

-- Sesiones
CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'WAITING',
  current_round INTEGER DEFAULT 0,
  owner_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id)
) STRICT;

-- Relación Usuarios-Sesiones (para participantes)
CREATE TABLE session_participants (
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  PRIMARY KEY (session_id, user_id),
  FOREIGN KEY (session_id) REFERENCES sessions(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
) STRICT;

-- Ideas
CREATE TABLE ideas (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  author_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id),
  FOREIGN KEY (session_id) REFERENCES sessions(id)
) STRICT;

-- Votos
CREATE TABLE votes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  idea_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  round INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, idea_id, round, session_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (idea_id) REFERENCES ideas(id),
  FOREIGN KEY (session_id) REFERENCES sessions(id)
) STRICT;

-- Sesión Metadata (para almacenar información adicional de sesión)
CREATE TABLE session_metadata (
  session_id TEXT PRIMARY KEY,
  ideas_elegidas TEXT, -- JSON array of idea IDs
  ideas_candidatas TEXT, -- JSON array of idea IDs
  mensaje_ronda TEXT,
  mensaje_final TEXT,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
) STRICT;
```

## Configuración de la Base de Datos (SQLite)

Utilización del módulo nativo de SQLite en Node.js v22+:

```javascript
// server/models/db.js
import { DatabaseSync } from 'node:sqlite';

let database;

export function initDatabase() {
  try {
    database = new DatabaseSync('./database/jam_literaria.db', {
      enableForeignKeyConstraints: true
    });
    
    console.log('Base de datos SQLite inicializada correctamente');
    return database;
  } catch (error) {
    console.error('Error al inicializar la base de datos SQLite:', error);
    throw error;
  }
}

export function getDatabase() {
  if (!database) {
    return initDatabase();
  }
  return database;
}

export function closeDatabase() {
  if (database) {
    database.close();
    database = null;
    console.log('Conexión a la base de datos cerrada');
  }
}
```

## Ejemplo de Modelo (Utilizando el módulo nativo SQLite)

```javascript
// server/models/User.js
import { v4 as uuidv4 } from 'uuid';
import { getDatabase } from './db.js';

export class User {
  static createUser(name) {
    const db = getDatabase();
    const id = uuidv4();
    
    const stmt = db.prepare('INSERT INTO users (id, name) VALUES (?, ?)');
    stmt.run(id, name);
    
    return this.getUserById(id);
  }
  
  static getUserById(id) {
    const db = getDatabase();
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  }
  
  static updateUserLastActive(id) {
    const db = getDatabase();
    const stmt = db.prepare('UPDATE users SET last_active = CURRENT_TIMESTAMP WHERE id = ?');
    return stmt.run(id);
  }
  
  // Más métodos según sea necesario
}
```

## Implementación de API REST (Backend)

```javascript
// server/api/routes/sessions.js
import express from 'express';
import { 
  createSession, 
  getSession, 
  joinSession,
  startSession 
} from '../controllers/sessionController.js';
import { authMiddleware } from '../middleware/auth.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', createSession);
router.get('/:id', getSession);
router.post('/:id/join', joinSession);
router.post('/:id/start', startSession);

export default router;
```

```javascript
// server/api/controllers/sessionController.js
import { SessionService } from '../../services/sessionService.js';

export async function createSession(req, res) {
  try {
    const { userId } = req.user;
    const session = SessionService.createSession(userId);
    
    return res.status(201).json({
      success: true,
      data: {
        session
      }
    });
  } catch (error) {
    console.error('Error al crear sesión:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al crear sesión'
    });
  }
}

// Más controladores...
```

## Implementación de Componentes React (Frontend)

```jsx
// client/src/components/session/SessionCreate.jsx
import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { createSession } from '../../services/api';
import Button from '../common/Button';

function SessionCreate() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const handleCreateSession = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const { data } = await createSession();
      navigate(`/session/${data.session.id}`);
    } catch (err) {
      setError('Error al crear la sesión. Inténtalo de nuevo.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="session-create">
      <h2>Crear Nueva Sesión</h2>
      <p>Como maestro de ceremonias, podrás iniciar una nueva sesión de Jam Literaria.</p>
      
      {error && <div className="error-message">{error}</div>}
      
      <Button 
        onClick={handleCreateSession}
        disabled={loading}
        className="btn-primary"
      >
        {loading ? 'Creando...' : 'Crear Sesión'}
      </Button>
    </div>
  );
}

export default SessionCreate;
```

## Implementación de Socket.io (Tiempo Real)

```javascript
// server/socket/index.js
import { Server } from 'socket.io';
import { sessionHandlers } from './sessionHandlers.js';
import { ideaHandlers } from './ideaHandlers.js';
import { voteHandlers } from './voteHandlers.js';
import { UserService } from '../services/userService.js';

export function setupSocketServer(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      methods: ['GET', 'POST']
    }
  });
  
  io.on('connection', (socket) => {
    console.log('Usuario conectado:', socket.id);
    
    // Autenticación del socket
    socket.on('authenticate', async (userId) => {
      if (userId) {
        socket.userId = userId;
        await UserService.updateUserLastActive(userId);
        console.log(`Socket ${socket.id} autenticado como usuario ${userId}`);
      }
    });
    
    // Registrar handlers para diferentes eventos
    sessionHandlers(io, socket);
    ideaHandlers(io, socket);
    voteHandlers(io, socket);
    
    socket.on('disconnect', () => {
      console.log('Usuario desconectado:', socket.id);
    });
  });
  
  return io;
}
```

```javascript
// server/socket/sessionHandlers.js
import { SessionService } from '../services/sessionService.js';

export function sessionHandlers(io, socket) {
  // Unirse a una sala de sesión
  socket.on('join-session', async ({ sessionId, userId }) => {
    try {
      socket.join(`session-${sessionId}`);
      
      // Actualizar estado del usuario
      await UserService.updateUserLastActive(userId);
      
      // Notificar a otros participantes
      socket.to(`session-${sessionId}`).emit('user-joined', { userId });
      
      // Enviar estado actual de la sesión
      const sessionData = await SessionService.getSessionWithParticipants(sessionId);
      socket.emit('session-state', sessionData);
      
    } catch (error) {
      console.error('Error al unirse a la sesión:', error);
      socket.emit('error', { message: 'Error al unirse a la sesión' });
    }
  });
  
  // Más eventos según sea necesario...
}
```

## Lógica de Selección de Ideas y Desempates

```javascript
// server/services/votingService.js
/**
 * Determina la acción siguiente después de una ronda de votación
 * @param {Array} ideas - Array de objetos con formato {id, content, votos, autorId}
 * @returns {Object} - Acción a seguir y las ideas seleccionadas o candidatas
 */
export function determinarAccionSiguiente(ideas) {
  // Ordena ideas por número de votos (descendente)
  const ideasOrdenadas = [...ideas].sort((a, b) => b.votos - a.votos);
  
  // Agrupa ideas por cantidad de votos
  const gruposPorVotos = agruparIdeasPorVotos(ideasOrdenadas);
  
  // Array con los grupos de votos en orden descendente
  const gruposOrdenados = Object.entries(gruposPorVotos)
    .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
    .map(entry => ({
      votos: parseInt(entry[0]),
      ideas: entry[1]
    }));
  
  // Implementación de los casos de selección
  // Análisis de diferentes escenarios de votación
  if (gruposOrdenados.length === 1 && gruposOrdenados[0].ideas.length === 3) {
    // Caso 1: Exactamente 3 ideas empatadas con la mayor cantidad de votos
    return {
      accion: 'FINALIZAR',
      ideasElegidas: gruposOrdenados[0].ideas.map(idea => idea.id)
    };
  } else if (gruposOrdenados.length === 1 && gruposOrdenados[0].ideas.length > 3) {
    // Caso 2: Más de 3 ideas empatadas con la mayor cantidad de votos
    return {
      accion: 'NUEVA_RONDA',
      ideasCandidatas: gruposOrdenados[0].ideas.map(idea => idea.id)
    };
  }
  
  // Más casos según la lógica del juego...
}

function agruparIdeasPorVotos(ideas) {
  return ideas.reduce((grupos, idea) => {
    if (!grupos[idea.votos]) {
      grupos[idea.votos] = [];
    }
    grupos[idea.votos].push(idea);
    return grupos;
  }, {});
}
```

## Implementación del Cliente API (Frontend)

```javascript
// client/src/services/api.js
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true
});

// Interceptores para manejar errores y tokens
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response && error.response.status === 401) {
      // Redirigir a login si es necesario
    }
    return Promise.reject(error);
  }
);

// API de sesiones
export const createSession = () => api.post('/sessions');
export const getSession = (sessionId) => api.get(`/sessions/${sessionId}`);
export const joinSession = (sessionId, code) => api.post(`/sessions/${sessionId}/join`, { code });
export const startSession = (sessionId) => api.post(`/sessions/${sessionId}/start`);

// API de ideas
export const submitIdea = (sessionId, content) => api.post(`/sessions/${sessionId}/ideas`, { content });
export const getIdeas = (sessionId) => api.get(`/sessions/${sessionId}/ideas`);

// API de votos
export const submitVote = (sessionId, ideaId) => api.post(`/sessions/${sessionId}/votes`, { ideaId });
export const getResults = (sessionId) => api.get(`/sessions/${sessionId}/results`);

// Exportación por defecto
export default api;
```

## Ventajas del Nuevo Enfoque

1. **Arquitectura Moderna**: Separación clara entre frontend y backend para un desarrollo más organizado.
2. **Escalabilidad**: La estructura por servicios facilita la expansión y mantenimiento.
3. **Rendimiento Optimizado**: Uso del módulo nativo SQLite para operaciones de base de datos eficientes.
4. **Experiencia de Usuario Mejorada**: React proporciona una UI reactiva y fluida.
5. **Mantenibilidad**: Código organizado con responsabilidades claramente definidas.
6. **Mobile-First**: Diseño adaptativo que funciona bien en todos los dispositivos.
7. **Testing Robusto**: Estructura organizada para tests completos.

## Consideraciones Técnicas

1. **Node.js v22 Features**: Aprovechar las últimas características como:
   - Módulo nativo SQLite
   - Mejoras en ESM (ECMAScript Modules)
   - Mejoras de rendimiento del motor V8
   - WebStreams API
   - Mejoras en el sistema de módulos

2. **Seguridad**:
   - Validación de entradas en frontend y backend
   - Protección contra inyección SQL usando parámetros preparados
   - Manejo adecuado de autenticación y sesiones
   - Implementación de CORS para API

3. **Optimización**:
   - Lazy loading de componentes React
   - Agrupación eficiente de assets
   - Optimización de consultas SQLite
   - Estructura de datos eficiente

4. **Testing**:
   - Tests unitarios para lógica de negocio crítica
   - Tests de integración para APIs
   - Tests de componentes React
   - Tests end-to-end para flujos completos

Con esta arquitectura moderna, la aplicación de Jam Literaria tendrá una base sólida, mantenible y escalable, aprovechando lo mejor de las tecnologías web actuales. 