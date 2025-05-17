# Arquitectura de la Aplicación de Jam Literaria

## Visión General
La aplicación Jam Literaria permite organizar sesiones de escritura colaborativa donde múltiples escritores proponen ideas, votan por ellas y seleccionan tres ideas finales mediante un proceso de votación estructurado. La aplicación utilizará un enfoque simplificado basado en Node.js con renderizado en servidor.

## Stack Tecnológico Simplificado
- **Backend y Frontend**: Node.js con Express
- **Renderizado**: EJS (Embedded JavaScript templates)
- **Lenguaje**: JavaScript (Node.js)
- **Base de Datos**: SQLite con mejor-sqlite3
- **Tiempo Real**: Socket.io integrado con Express
- **Estilos**: CSS con enfoque en simplicidad y Mobile-First
- **Testing**: Jest para tests unitarios y funcionales

## Ventajas del Nuevo Enfoque
- **Simplificación**: Un único codebase en lugar de separar frontend y backend
- **Menos Dependencias**: Eliminación de React y herramientas asociadas
- **Renderizado en Servidor**: Mejor rendimiento inicial y SEO
- **Menor Complejidad**: No requiere APIs REST separadas ni construcción compleja
- **Desarrollo más Rápido**: Menos overhead en el proceso de desarrollo

## Estructura de Directorios Simplificada
```
/
├── src/                    # Código fuente
│   ├── routes/             # Rutas y controladores Express
│   │   ├── auth.js         # Rutas de autenticación
│   │   ├── session.js      # Rutas de sesión
│   │   ├── ideas.js        # Rutas para gestión de ideas
│   │   └── voting.js       # Rutas para votación
│   ├── middleware/         # Middleware Express
│   │   ├── auth.js         # Middleware de autenticación
│   │   └── session.js      # Middleware de sesión
│   ├── models/             # Modelos de datos usando mejor-sqlite3
│   │   ├── User.js         # Modelo de usuario
│   │   ├── Session.js      # Modelo de sesión
│   │   ├── Idea.js         # Modelo de idea
│   │   └── Vote.js         # Modelo de voto
│   ├── views/              # Plantillas EJS
│   │   ├── layouts/        # Diseños compartidos
│   │   ├── partials/       # Componentes parciales
│   │   ├── auth/           # Vistas de autenticación
│   │   ├── sessions/       # Vistas de sesión
│   │   ├── ideas/          # Vistas de ideas
│   │   └── voting/         # Vistas de votación
│   ├── public/             # Archivos estáticos
│   │   ├── css/            # Hojas de estilo
│   │   ├── js/             # JavaScript del cliente
│   │   └── images/         # Imágenes
│   ├── lib/                # Utilidades
│   │   ├── db.js           # Configuración de la base de datos
│   │   ├── socket.js       # Configuración de Socket.io
│   │   └── utils.js        # Funciones útiles
│   └── app.js              # Punto de entrada de la aplicación
├── tests/                  # Tests con Jest
│   ├── unit/               # Tests unitarios
│   ├── integration/        # Tests de integración
│   └── e2e/                # Tests end-to-end
├── database/               # Archivos de base de datos
│   ├── schema.sql          # Esquema SQL
│   └── migrations/         # Migraciones SQL
└── config/                 # Archivos de configuración
    ├── app.js              # Configuración de la aplicación
    ├── session.js          # Configuración de sesión
    └── socket.js           # Configuración de Socket.io
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
);

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
);

-- Relación Usuarios-Sesiones (para participantes)
CREATE TABLE session_participants (
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  PRIMARY KEY (session_id, user_id),
  FOREIGN KEY (session_id) REFERENCES sessions(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Ideas
CREATE TABLE ideas (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  author_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id),
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

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
);

-- Sesión Metadata (para almacenar información adicional de sesión)
CREATE TABLE session_metadata (
  session_id TEXT PRIMARY KEY,
  ideas_elegidas TEXT, -- JSON array of idea IDs
  ideas_candidatas TEXT, -- JSON array of idea IDs
  mensaje_ronda TEXT,
  mensaje_final TEXT,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);
```

## Flujo de la Aplicación

### 1. Pantalla de Introducción (Nombre)
- Formulario simple de entrada de nombre de usuario
- Procesado en el servidor con validación
- Almacenamiento en sesión del navegador

### 2. Pantalla de Selección de Sesión
- Opciones para crear nueva sesión o unirse a existente
- Formularios simples procesados en el servidor

### 3. Pantalla de Creación/Espera de Sesión
- Vista para el Maestro de Ceremonias con lista de participantes en tiempo real
- Vista para participantes con estado de espera
- Actualización en tiempo real vía Socket.io

### 4. Pantalla de Envío de Ideas
- Formulario para enviar ideas
- Proceso de validación en servidor
- Estado en tiempo real de quién ha enviado ideas

### 5. Pantalla de Votación
- Presentación de ideas para votación
- Selección mediante formularios simples
- Actualización en tiempo real del estado de votación

### 6. Pantalla de Resultados
- Visualización de las ideas ganadoras
- Opción para iniciar nueva sesión

## Lógica de Selección de Ideas y Desempates

La lógica de selección permanece igual que en la arquitectura original, pero ahora se ejecuta completamente en el servidor:

```javascript
// lib/voting.js

/**
 * Determina la acción siguiente después de una ronda de votación
 * @param {Array} ideas - Array de objetos con formato {id, content, votos, autorId}
 * @returns {Object} - Acción a seguir y las ideas seleccionadas o candidatas
 */
function determinarAccionSiguiente(ideas) {
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
  // [... Resto del código igual que el original ...]
}
```

## Implementación de Socket.io

Socket.io se integra directamente con Express para proporcionar actualizaciones en tiempo real:

```javascript
// lib/socket.js
const socketIO = require('socket.io');

function setupSocket(server) {
  const io = socketIO(server);
  
  io.on('connection', (socket) => {
    // Unirse a una sesión
    socket.on('join-session', async (sessionId, userId) => {
      socket.join(`session-${sessionId}`);
      
      // Actualizar estado del usuario
      await db.updateUserLastActive(userId);
      
      // Notificar a otros participantes
      socket.to(`session-${sessionId}`).emit('user-joined', userId);
    });
    
    // Más eventos según sea necesario
  });
  
  return io;
}

module.exports = { setupSocket };
```

## Procesamiento de Plantillas EJS

Las vistas se renderizan con EJS, que permite la combinación de HTML con JavaScript del lado del servidor:

```javascript
// routes/session.js
const express = require('express');
const router = express.Router();
const { getSession, getParticipants } = require('../models/Session');

router.get('/session/:id', async (req, res) => {
  const sessionId = req.params.id;
  const user = req.session.user;
  
  if (!user) {
    return res.redirect('/auth');
  }
  
  try {
    const session = await getSession(sessionId);
    const participants = await getParticipants(sessionId);
    
    if (!session) {
      return res.status(404).render('error', { 
        message: 'Sesión no encontrada' 
      });
    }
    
    return res.render('sessions/detail', { 
      session, 
      participants,
      user,
      isOwner: session.owner_id === user.id
    });
  } catch (error) {
    console.error('Error al obtener sesión:', error);
    return res.status(500).render('error', { 
      message: 'Error al cargar la sesión' 
    });
  }
});

// Más rutas aquí...

module.exports = router;
```

## Ejemplo de Plantilla EJS

```html
<!-- views/sessions/detail.ejs -->
<%- include('../layouts/header') %>

<div class="session-container">
  <h1>Sesión: <%= session.code %></h1>
  
  <div class="participants-list">
    <h2>Participantes</h2>
    <ul>
      <% participants.forEach(function(participant) { %>
        <li class="participant <%= participant.id === user.id ? 'current-user' : '' %>">
          <%= participant.name %>
          <% if (participant.id === session.owner_id) { %>
            <span class="badge owner-badge">Maestro</span>
          <% } %>
        </li>
      <% }); %>
    </ul>
  </div>
  
  <% if (session.status === 'WAITING') { %>
    <% if (isOwner) { %>
      <div class="action-panel">
        <p>Como maestro de ceremonias, puedes iniciar la sesión cuando todos los participantes estén listos.</p>
        <button id="start-session" class="btn btn-primary" <%= participants.length < 2 ? 'disabled' : '' %>>
          Iniciar Sesión
        </button>
      </div>
    <% } else { %>
      <div class="waiting-message">
        <p>Esperando a que el maestro de ceremonias inicie la sesión...</p>
      </div>
    <% } %>
  <% } %>
</div>

<script src="/socket.io/socket.io.js"></script>
<script>
  const socket = io();
  
  // Conectar a la sala de la sesión
  socket.emit('join-session', '<%= session.id %>', '<%= user.id %>');
  
  // Escuchar eventos de Socket.io
  socket.on('user-joined', (userId) => {
    // Actualizar la interfaz cuando un usuario se une
    location.reload();
  });
  
  // Si es el maestro, configurar el botón para iniciar
  <% if (isOwner) { %>
    document.getElementById('start-session').addEventListener('click', () => {
      fetch('/api/session/<%= session.id %>/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      .then(response => {
        if (response.ok) {
          return response.json();
        }
        throw new Error('Error al iniciar sesión');
      })
      .then(data => {
        // El servidor notificará a través de Socket.io también
        console.log('Sesión iniciada:', data);
      })
      .catch(error => {
        console.error('Error:', error);
        alert('No se pudo iniciar la sesión');
      });
    });
  <% } %>
</script>

<%- include('../layouts/footer') %>
```

## Ventajas del Enfoque Simplificado

1. **Desarrollo más Rápido**: Menos conceptos y tecnologías para manejar.
2. **Menor Complejidad**: Sin necesidad de APIs RESTful separadas ni gestión de estado en el cliente.
3. **Rendimiento**: Renderizado más rápido y menor carga en el cliente.
4. **Mantenimiento**: Código más sencillo y directo de mantener.
5. **Menos Puntos de Fallo**: Al reducir la complejidad, hay menos puntos donde pueden ocurrir errores.

## Consideraciones para el Desarrollo

1. **Progressive Enhancement**: Comenzar con funcionalidad básica HTML y añadir JavaScript interactivo según sea necesario.
2. **Accesibilidad**: Asegurar que la aplicación funcione incluso sin JavaScript avanzado.
3. **Respuestas Rápidas**: Optimizar la carga y renderizado de páginas para evitar la percepción de lentitud.
4. **Patrones MVC**: Seguir el patrón Modelo-Vista-Controlador para una clara separación de responsabilidades.
5. **Seguridad**: Implementar todas las medidas de seguridad estándar (validación, sanitización, CSRF, etc.)

Con este enfoque simplificado, se reduce significativamente la complejidad técnica mientras se mantiene toda la funcionalidad requerida de la aplicación de Jam Literaria. 