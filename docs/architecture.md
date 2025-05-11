# Arquitectura de la Aplicación de Jam Literaria

## Visión General
Desarrollaremos una aplicación web para organizar jams literarias donde múltiples escritores pueden proponer ideas, votar por ellas y seleccionar tres ideas finales mediante un proceso de votación estructurado.

## Stack Tecnológico
- **Frontend**: React.js con Next.js 14 (App Router)
- **Backend**: Node.js integrado con Next.js (API Routes)
- **Lenguaje**: TypeScript para todo el proyecto
- **Base de Datos**: SQLite con Prisma ORM
- **Tiempo Real**: Socket.io para actualización en tiempo real
- **Estilos**: Tailwind CSS con enfoque Mobile-First
- **Testing**: Jest y React Testing Library

## Estructura de Directorios
```
/
├── app/                    # Next.js App Router
│   ├── api/                # API Routes
│   ├── (auth)/             # Rutas de autenticación
│   │   ├── page.tsx        # Pantalla inicial (nombre)
│   │   └── join/[code]     # Unirse por código
│   ├── session/            # Rutas de sesión
│   │   ├── new/            # Crear sesión
│   │   ├── waiting/        # Sala de espera
│   │   ├── ideas/          # Envío de ideas
│   │   ├── voting/         # Votación de ideas
│   │   └── results/        # Resultados finales
├── components/             # Componentes reutilizables
├── lib/                    # Utilidades, hooks, constantes
├── prisma/                 # Esquema de Prisma y migraciones
├── public/                 # Archivos estáticos
├── __tests__/             # Tests con Jest
│   ├── unit/              # Tests unitarios
│   │   ├── lib/           # Tests de utilidades
│   │   ├── hooks/         # Tests de hooks
│   │   └── components/    # Tests de componentes
│   └── integration/       # Tests de integración
└── types/                  # Definiciones de TypeScript
```

## Modelo de Datos

### Esquema de la Base de Datos

```prisma
// schema.prisma
datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id           String     @id @default(uuid())
  name         String
  sessions     Session[]  @relation("SessionParticipants")
  ownedSessions Session[] @relation("SessionOwner")
  ideas        Idea[]
  votes        Vote[]
  createdAt    DateTime   @default(now())
  lastActive   DateTime   @default(now())  // Para gestionar reconexiones
}

model Session {
  id           String     @id @default(uuid())
  code         String     @unique // Código único para unirse (autor o libro famoso)
  status       String     @default("WAITING") // WAITING, COLLECTING_IDEAS, VOTING, REVOTING, FINISHED
  currentRound Int        @default(0)
  owner        User       @relation("SessionOwner", fields: [ownerId], references: [id])
  ownerId      String
  participants User[]     @relation("SessionParticipants")
  ideas        Idea[]
  votes        Vote[]
  createdAt    DateTime   @default(now())
  updatedAt    DateTime   @updatedAt
  // Las sesiones persisten a largo plazo
  // No hay automatización para eliminarlas
}

model Idea {
  id        String   @id @default(uuid())
  content   String   // Sin límite de longitud
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  session   Session  @relation(fields: [sessionId], references: [id])
  sessionId String
  votes     Vote[]
  createdAt DateTime @default(now())
}

model Vote {
  id        String   @id @default(uuid())
  user      User     @relation(fields: [userId], references: [id])
  userId    String
  idea      Idea     @relation(fields: [ideaId], references: [id])
  ideaId    String
  session   Session  @relation(fields: [sessionId], references: [id])
  sessionId String
  round     Int      // Para identificar la ronda de votación
  createdAt DateTime @default(now())

  @@unique([userId, ideaId, round, sessionId])
}
```

## Flujo de la Aplicación y Diseño de Pantallas

### 1. Pantalla de Introducción (Nombre)
- Campo para introducir nombre
- Botón para continuar
- Validaciones para evitar nombres vacíos
- Diseño minimalista, mobile-first

### 2. Pantalla de Selección de Sesión
- Dos opciones principales:
  - Crear nueva sesión
  - Unirse a una sesión existente (con campo para código)
- Si el usuario llega con un enlace directo, se salta esta pantalla
- Diseño con botones grandes para facilitar uso en móvil

### 3. Pantalla de Creación de Sesión (Maestro de Ceremonias)
- Muestra el código generado y enlace para compartir
- Lista de participantes que se van uniendo en tiempo real
- Botón para iniciar la sesión (habilitado cuando hay al menos 2 participantes)
- Opción para copiar enlace de invitación
- Interfaz adaptada a pantallas pequeñas

### 4. Pantalla de Espera (Participantes)
- Mensaje informativo
- Indicador visual de espera
- Actualización en tiempo real cuando el maestro inicia la sesión
- Diseño optimizado para móvil

### 5. Pantalla de Envío de Ideas
- Formulario para enviar 2-3 ideas (según número de participantes)
- Área de texto expandible (sin límite de caracteres)
- Botón para enviar ideas
- Interfaz adaptable a diferentes tamaños de pantalla

### 6. Pantalla de Espera Post-Ideas
- Para participantes: mensaje de espera
- Para maestro: visualización de quién ha enviado ideas, botón para iniciar votación
- Diseño responsive

### 7. Pantalla de Votación
- Visualización de todas las ideas en formato tarjeta
- Mecanismo para seleccionar exactamente 3 ideas
- Botón para enviar selección
- Diseño adaptado a móvil con scroll vertical para ideas largas

### 8. Pantalla de Espera/Control (Durante Conteo)
- Para participantes: mensaje de espera
- Para maestro: visualización en tiempo real del conteo, botones para:
  - Iniciar nueva ronda de votación (si hay empates)
  - Finalizar y mostrar resultados (cuando hay 3 ideas ganadoras)
- UI optimizada para dispositivos móviles

### 9. Pantalla de Resultados Finales
- Visualización de las 3 ideas elegidas
- Número de votos de cada idea
- Opción para iniciar una nueva jam
- Visualización adaptada a diferentes tamaños de pantalla

## Lógica de Selección de Ideas y Desempates

### Algoritmo de Selección

1. **Recopilar votos**:
   - Contar los votos para cada idea
   - Ordenar ideas por número de votos (descendente)

2. **Analizar situación**:
   - Identificar ideas con más votos y posibles empates
   - Determinar si hay 3 ideas claras o se necesita desempate

3. **Escenarios de desempate detallados**:

```javascript
/**
 * Esta función analiza los resultados de la votación y determina la acción siguiente
 * @param {Array} ideas - Array de objetos con formato {id, content, votos, autorId}
 * @returns {Object} - Objeto con la acción a seguir y las ideas seleccionadas o candidatas
 */
function determinarAccionSiguiente(ideas) {
  // Ordenar ideas por número de votos (descendente)
  const ideasOrdenadas = [...ideas].sort((a, b) => b.votos - a.votos);
  
  // Agrupar ideas por cantidad de votos
  const gruposPorVotos = agruparIdeasPorVotos(ideasOrdenadas);
  
  // Array con los grupos de votos en orden descendente
  const gruposOrdenados = Object.entries(gruposPorVotos)
    .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
    .map(entry => ({
      votos: parseInt(entry[0]),
      ideas: entry[1]
    }));
  
  // Casos posibles basados en las reglas definidas
  
  // CASO 1: Hay exactamente 3 ideas con la mayor cantidad de votos (empatadas)
  if (gruposOrdenados[0]?.ideas.length === 3) {
    return { 
      accion: 'FINALIZAR', 
      elegidas: gruposOrdenados[0].ideas,
      mensaje: 'Tres ideas con la mayor cantidad de votos y empatadas.'
    };
  }
  
  // CASO 2: Hay exactamente 2 ideas con la mayor cantidad de votos
  // y una o más ideas empatadas en la segunda posición
  if (gruposOrdenados[0]?.ideas.length === 2 && gruposOrdenados[1]?.ideas.length > 0) {
    const ideasElegidas = [...gruposOrdenados[0].ideas];
    
    // Si solo hay 1 idea en segunda posición, tenemos las 3 elegidas
    if (gruposOrdenados[1].ideas.length === 1) {
      return {
        accion: 'FINALIZAR',
        elegidas: [...ideasElegidas, gruposOrdenados[1].ideas[0]],
        mensaje: 'Dos ideas con mayor cantidad de votos y una segunda con menos votos.'
      };
    }
    
    // Si hay múltiples ideas empatadas en segunda posición, necesitamos desempatar
    return {
      accion: 'NUEVA_RONDA',
      elegidas: ideasElegidas,
      candidatas: gruposOrdenados[1].ideas,
      mensaje: 'Dos ideas con mayor cantidad de votos, múltiples empatadas en segundo lugar.'
    };
  }
  
  // CASO 3: Hay exactamente 1 idea con la mayor cantidad de votos
  if (gruposOrdenados[0]?.ideas.length === 1) {
    const ideaConMasVotos = gruposOrdenados[0].ideas[0];
    
    // Subcaso 3.1: En segunda posición hay exactamente 2 ideas empatadas
    if (gruposOrdenados[1]?.ideas.length === 2) {
      return {
        accion: 'FINALIZAR',
        elegidas: [ideaConMasVotos, ...gruposOrdenados[1].ideas],
        mensaje: 'Una idea con mayor cantidad de votos, dos empatadas en segundo lugar.'
      };
    }
    
    // Subcaso 3.2: En segunda posición hay exactamente 1 idea
    if (gruposOrdenados[1]?.ideas.length === 1) {
      const ideaSegundoLugar = gruposOrdenados[1].ideas[0];
      
      // Si en tercera posición hay exactamente 1 idea, tenemos las 3 elegidas
      if (gruposOrdenados[2]?.ideas.length === 1) {
        return {
          accion: 'FINALIZAR',
          elegidas: [ideaConMasVotos, ideaSegundoLugar, gruposOrdenados[2].ideas[0]],
          mensaje: 'Una idea con mayor cantidad de votos, una segunda, una tercera.'
        };
      }
      
      // Si en tercera posición hay múltiples ideas empatadas, necesitamos desempatar
      if (gruposOrdenados[2]?.ideas.length > 1) {
        return {
          accion: 'NUEVA_RONDA',
          elegidas: [ideaConMasVotos, ideaSegundoLugar],
          candidatas: gruposOrdenados[2].ideas,
          mensaje: 'Una idea con mayor cantidad de votos, una segunda, múltiples empatadas en tercera posición.'
        };
      }
    }
    
    // Subcaso 3.3: En segunda posición hay más de 2 ideas empatadas
    if (gruposOrdenados[1]?.ideas.length > 2) {
      return {
        accion: 'NUEVA_RONDA',
        elegidas: [ideaConMasVotos],
        candidatas: gruposOrdenados[1].ideas,
        mensaje: 'Una idea con mayor cantidad de votos, más de dos empatadas en segunda posición.'
      };
    }
  }
  
  // CASO 4: Hay más de 3 ideas con la mayor cantidad de votos (todas empatadas)
  if (gruposOrdenados[0]?.ideas.length > 3) {
    return {
      accion: 'NUEVA_RONDA',
      elegidas: [],
      candidatas: gruposOrdenados[0].ideas,
      mensaje: 'Más de tres ideas empatadas con la mayor cantidad de votos.'
    };
  }
  
  // CASO 5: No hay votos suficientes o situación no contemplada
  return { 
    accion: 'ERROR', 
    mensaje: 'Situación no contemplada en las reglas o no hay suficientes votos.'
  };
}

/**
 * Agrupa las ideas por su número de votos
 * @param {Array} ideas - Array de objetos con formato {id, content, votos, autorId}
 * @returns {Object} - Objeto con formato { numeroVotos: [ideas con ese número de votos] }
 */
function agruparIdeasPorVotos(ideas) {
  return ideas.reduce((grupos, idea) => {
    const votos = idea.votos;
    if (!grupos[votos]) {
      grupos[votos] = [];
    }
    grupos[votos].push(idea);
    return grupos;
  }, {});
}

/**
 * Implementa la lógica para realizar una nueva ronda de votación
 * @param {Array} ideasElegidas - Ideas ya elegidas que no participan en la nueva ronda
 * @param {Array} ideasCandidatas - Ideas que participan en la nueva ronda
 * @param {Object} session - Objeto de sesión actual
 * @returns {Object} - Nueva configuración de la sesión
 */
function prepararNuevaRonda(ideasElegidas, ideasCandidatas, session) {
  const nuevaRonda = session.currentRound + 1;
  
  return {
    ...session,
    currentRound: nuevaRonda,
    status: 'REVOTING',
    ideasElegidas,
    ideasCandidatas,
    // Reiniciar votos para la nueva ronda
    votosNuevaRonda: {}
  };
}

/**
 * Procesa los resultados finales cuando ya hay 3 ideas elegidas
 * @param {Array} ideasElegidas - Las 3 ideas finalmente elegidas
 * @param {Object} session - Objeto de sesión actual
 * @returns {Object} - Configuración final de la sesión
 */
function finalizarSeleccion(ideasElegidas, session) {
  return {
    ...session,
    status: 'FINISHED',
    ideasFinales: ideasElegidas,
    fechaFinalizacion: new Date()
  };
}
```

### Implementación en API Routes

```javascript
// app/api/session/[id]/procesar-votos/route.js
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { determinarAccionSiguiente, prepararNuevaRonda, finalizarSeleccion } from '@/lib/votacion';
import { io } from '@/lib/socket';

export async function POST(request, { params }) {
  const { id } = params;
  const sessionId = id;
  
  try {
    // Obtener sesión actual
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        ideas: true,
        votes: {
          where: { round: session.currentRound }
        }
      }
    });
    
    if (!session) {
      return NextResponse.json(
        { error: 'Sesión no encontrada' },
        { status: 404 }
      );
    }
    
    // Contar votos para cada idea en la ronda actual
    const ideasConVotos = session.ideas.map(idea => {
      const votos = session.votes.filter(
        vote => vote.ideaId === idea.id && vote.round === session.currentRound
      ).length;
      
      return {
        ...idea,
        votos
      };
    });
    
    // Determinar siguiente acción basada en los votos
    const resultado = determinarAccionSiguiente(ideasConVotos);
    
    // Actualizar estado de la sesión según el resultado
    let sessionActualizada;
    
    if (resultado.accion === 'FINALIZAR') {
      // Guardar las 3 ideas finales
      sessionActualizada = await prisma.session.update({
        where: { id: sessionId },
        data: {
          status: 'FINISHED',
          // Guardar IDs de ideas finales en un campo JSON
          metadata: {
            ideasFinales: resultado.elegidas.map(idea => idea.id),
            mensajeFinal: resultado.mensaje
          }
        }
      });
      
      // Notificar a todos los participantes
      io.to(`session-${sessionId}`).emit('voting-finished', {
        ideasFinales: resultado.elegidas,
        mensaje: resultado.mensaje
      });
    } 
    else if (resultado.accion === 'NUEVA_RONDA') {
      // Preparar nueva ronda de votación
      sessionActualizada = await prisma.session.update({
        where: { id: sessionId },
        data: {
          status: 'REVOTING',
          currentRound: { increment: 1 },
          // Guardar información de la ronda
          metadata: {
            ideasElegidas: resultado.elegidas?.map(idea => idea.id) || [],
            ideasCandidatas: resultado.candidatas.map(idea => idea.id),
            mensajeRonda: resultado.mensaje
          }
        }
      });
      
      // Notificar nueva ronda
      io.to(`session-${sessionId}`).emit('new-voting-round', {
        round: sessionActualizada.currentRound,
        ideasElegidas: resultado.elegidas || [],
        ideasCandidatas: resultado.candidatas,
        mensaje: resultado.mensaje
      });
    }
    else {
      // Caso de error
      return NextResponse.json(
        { error: resultado.mensaje },
        { status: 400 }
      );
    }
    
    return NextResponse.json({
      success: true,
      accion: resultado.accion,
      session: sessionActualizada
    });
    
  } catch (error) {
    console.error('Error al procesar votos:', error);
    return NextResponse.json(
      { error: 'Error al procesar los votos' },
      { status: 500 }
    );
  }
}
```

### Manejo de Estado en el Cliente

```typescript
// hooks/useVotacion.ts
import { useState, useEffect } from 'react';
import { useSocket } from './useSocket';

type Idea = {
  id: string;
  content: string;
  authorId: string;
  votos?: number;
};

type VotacionState = {
  status: 'WAITING' | 'COLLECTING_IDEAS' | 'VOTING' | 'REVOTING' | 'FINISHED';
  currentRound: number;
  ideasDisponibles: Idea[];
  ideasElegidas: Idea[];
  ideasCandidatas: Idea[];
  ideasFinales: Idea[];
  mensaje: string;
  isLoading: boolean;
  error: string | null;
};

export function useVotacion(sessionId: string) {
  const [state, setState] = useState<VotacionState>({
    status: 'WAITING',
    currentRound: 0,
    ideasDisponibles: [],
    ideasElegidas: [],
    ideasCandidatas: [],
    ideasFinales: [],
    mensaje: '',
    isLoading: true,
    error: null
  });

  const { socket } = useSocket(sessionId);
  
  // Cargar estado inicial
  useEffect(() => {
    async function cargarEstadoInicial() {
      try {
        const response = await fetch(`/api/session/${sessionId}`);
        const data = await response.json();
        
        if (!response.ok) {
          throw new Error(data.error || 'Error al cargar la sesión');
        }
        
        // Actualizar estado
        setState(prev => ({
          ...prev,
          status: data.status,
          currentRound: data.currentRound,
          ideasDisponibles: data.ideas || [],
          isLoading: false,
          // Otros datos necesarios según el estado de la sesión
          ...(data.metadata || {})
        }));
      } catch (error) {
        setState(prev => ({
          ...prev,
          error: error.message,
          isLoading: false
        }));
      }
    }
    
    cargarEstadoInicial();
  }, [sessionId]);
  
  // Escuchar eventos del socket
  useEffect(() => {
    if (!socket) return;
    
    // Nueva ronda de votación
    socket.on('new-voting-round', (data) => {
      setState(prev => ({
        ...prev,
        status: 'REVOTING',
        currentRound: data.round,
        ideasElegidas: data.ideasElegidas || [],
        ideasCandidatas: data.ideasCandidatas || [],
        mensaje: data.mensaje || ''
      }));
    });
    
    // Votación finalizada
    socket.on('voting-finished', (data) => {
      setState(prev => ({
        ...prev,
        status: 'FINISHED',
        ideasFinales: data.ideasFinales || [],
        mensaje: data.mensaje || ''
      }));
    });
    
    return () => {
      socket.off('new-voting-round');
      socket.off('voting-finished');
    };
  }, [socket]);
  
  // Función para enviar votos
  const enviarVotos = async (ideasVotadas: string[]) => {
    if (ideasVotadas.length !== 3) {
      setState(prev => ({
        ...prev,
        error: 'Debes seleccionar exactamente 3 ideas'
      }));
      return;
    }
    
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch(`/api/session/${sessionId}/votar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          ideaIds: ideasVotadas,
          round: state.currentRound
        })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al enviar votos');
      }
      
      // Actualizar estado local
      setState(prev => ({
        ...prev,
        isLoading: false,
        // El usuario ya votó, pero esperando resultados
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message,
        isLoading: false
      }));
    }
  };
  
  // Función para procesar votos (solo para el maestro de ceremonias)
  const procesarVotos = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const response = await fetch(`/api/session/${sessionId}/procesar-votos`, {
        method: 'POST'
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Error al procesar votos');
      }
      
      // El estado se actualizará a través de eventos de socket
      setState(prev => ({
        ...prev,
        isLoading: false
      }));
      
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message,
        isLoading: false
      }));
    }
  };
  
  return {
    ...state,
    enviarVotos,
    procesarVotos
  };
}
```

## Manejo de Sesiones y Estado en Tiempo Real

### Gestión de Sesiones
- Utilizaremos Socket.io para mantener sincronizados a todos los participantes
- Cada sesión tendrá un canal dedicado (`session-${sessionId}`)
- Eventos principales:
  - `user-joined`: Cuando un nuevo usuario se une
  - `session-started`: Cuando el maestro inicia la sesión
  - `idea-submitted`: Cuando un usuario envía sus ideas
  - `voting-started`: Cuando comienza la fase de votación
  - `vote-submitted`: Cuando un usuario envía sus votos
  - `results-calculated`: Cuando se determinan los resultados
  - `new-round-started`: Cuando se inicia una nueva ronda
  - `user-reconnected`: Cuando un usuario se reconecta a la sesión

### Manejo de Reconexiones
- Implementaremos sistema para detectar cuando un usuario se desconecta y se reconecta
- Al reconectarse, el usuario recibe el estado actual de la sesión
- Sus ideas y votos previos se mantienen
- Si un usuario se desconecta durante votación y no vota, se continúa sin su voto
- Si se reconecta antes de finalizar la fase, podrá votar normalmente

### Implementación de Socket.io con Next.js
```javascript
// lib/socket.js
import { Server } from 'socket.io';

export const initSocket = (server) => {
  const io = new Server(server);
  
  io.on('connection', (socket) => {
    // Unirse a una sala específica (sesión)
    socket.on('join-session', (sessionId, userId) => {
      socket.join(`session-${sessionId}`);
      
      // Actualizar estado de actividad del usuario
      prisma.user.update({
        where: { id: userId },
        data: { lastActive: new Date() }
      });
      
      // Notificar a otros participantes
      socket.to(`session-${sessionId}`).emit('user-joined', userId);
    });
    
    // Manejo de reconexión
    socket.on('reconnect-session', async (sessionId, userId) => {
      socket.join(`session-${sessionId}`);
      
      // Actualizar estado y notificar
      await prisma.user.update({
        where: { id: userId },
        data: { lastActive: new Date() }
      });
      
      // Enviar estado actual de la sesión al usuario reconectado
      const sessionState = await getSessionState(sessionId);
      socket.emit('session-state-update', sessionState);
      
      // Notificar reconexión
      socket.to(`session-${sessionId}`).emit('user-reconnected', userId);
    });
    
    // Otros manejadores de eventos...
  });
  
  return io;
};
```

## Seguridad y Validaciones

### Protección Básica
- Validación del código de sesión
- Verificación de que un usuario pertenece a una sesión antes de permitir acciones
- Protección contra múltiples envíos de ideas/votos
- Validación del número correcto de ideas según participantes
- Validación del límite de 3 votos por usuario

### Persistencia de Datos
- Las sesiones y todos sus datos se almacenarán permanentemente
- No hay mecanismo de eliminación automática
- Los datos estarán disponibles para consulta histórica

## Optimización Mobile-First
- Utilización de Media Queries en Tailwind para adaptar UI a diferentes dispositivos
- Controles táctiles optimizados para móvil
- Diseño de componentes para maximizar espacio en pantallas pequeñas
- Navegación simplificada para experiencia móvil fluida
- Pruebas en múltiples tamaños de pantalla (pequeño, mediano, grande)

## Plan de Implementación

### Fase 1: Configuración y Estructura Básica
- Inicializar proyecto Next.js
- Configurar Prisma con SQLite
- Implementar estructura de directorios
- Crear modelos de datos
- Configurar Tailwind CSS con enfoque mobile-first

### Fase 2: Autenticación y Gestión de Sesiones
- Implementar pantalla de ingreso de nombre
- Desarrollar funcionalidad de crear/unirse a sesiones
- Configurar Socket.io para comunicación en tiempo real
- Implementar sistema de reconexión de usuarios

### Fase 3: Funcionalidad Core
- Implementar envío de ideas (sin límite de caracteres)
- Desarrollar sistema de votación
- Crear algoritmo de selección de ideas con todos los escenarios de desempate

### Fase 4: UI/UX y Refinamiento
- Diseñar interfaces responsivas con enfoque mobile-first
- Implementar retroalimentación visual
- Optimizar rendimiento y experiencia de usuario
- Pruebas en diferentes dispositivos móviles

### Fase 5: Pruebas y Despliegue
- Realizar pruebas end-to-end
- Verificar todos los escenarios de votación y desempate
- Probar reconexiones de usuarios
- Desplegar la aplicación 

## Estrategia de Testing

Implementaremos una completa suite de tests con Jest y React Testing Library para asegurar la calidad del código y la correcta implementación de la lógica de negocio, especialmente para la selección de ideas.

### Configuración de Jest

```typescript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@/components/(.*)$': '<rootDir>/components/$1',
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
    '^@/app/(.*)$': '<rootDir>/app/$1',
    '^@/types/(.*)$': '<rootDir>/types/$1',
  },
  testEnvironment: 'jest-environment-jsdom',
  collectCoverage: true,
  collectCoverageFrom: [
    'lib/**/*.{ts,tsx}',
    'components/**/*.{ts,tsx}',
    'app/**/*.{ts,tsx}',
    '!**/*.d.ts',
    '!**/node_modules/**',
  ],
};

module.exports = createJestConfig(customJestConfig);
```

### Tests Unitarios para la Lógica de Selección de Ideas

La lógica de selección de ideas es una parte crítica de la aplicación, por lo que crearemos tests exhaustivos para cada caso posible:

```typescript
// __tests__/unit/lib/votacion.test.ts
import { 
  determinarAccionSiguiente, 
  agruparIdeasPorVotos,
  prepararNuevaRonda,
  finalizarSeleccion
} from '@/lib/votacion';

describe('Lógica de selección de ideas', () => {
  // Funciones auxiliares para crear ideas de prueba
  const crearIdea = (id: string, votos: number) => ({
    id,
    content: `Idea ${id}`,
    authorId: 'user1',
    votos
  });
  
  const crearIdeas = (cantidades: number[]) => {
    return cantidades.map((votos, index) => 
      crearIdea(`idea${index + 1}`, votos)
    );
  };

  describe('agruparIdeasPorVotos', () => {
    it('debería agrupar correctamente las ideas por su número de votos', () => {
      // Arrange
      const ideas = crearIdeas([5, 3, 5, 2, 3, 1]);
      
      // Act
      const resultado = agruparIdeasPorVotos(ideas);
      
      // Assert
      expect(resultado['5'].length).toBe(2);
      expect(resultado['3'].length).toBe(2);
      expect(resultado['2'].length).toBe(1);
      expect(resultado['1'].length).toBe(1);
    });
  });

  describe('determinarAccionSiguiente - CASO 1: Tres ideas con mayor cantidad de votos empatadas', () => {
    it('debería finalizar cuando hay exactamente 3 ideas con el mismo número de votos y son las más votadas', () => {
      // Arrange
      const ideas = crearIdeas([5, 5, 5, 2, 1]);
      
      // Act
      const resultado = determinarAccionSiguiente(ideas);
      
      // Assert
      expect(resultado.accion).toBe('FINALIZAR');
      expect(resultado.elegidas.length).toBe(3);
      expect(resultado.elegidas.map(i => i.id)).toEqual(['idea1', 'idea2', 'idea3']);
    });
  });

  describe('determinarAccionSiguiente - CASO 2: Dos ideas con mayor cantidad de votos', () => {
    it('debería finalizar cuando hay 2 ideas con más votos y 1 en segunda posición', () => {
      // Arrange
      const ideas = crearIdeas([7, 7, 5, 3, 2]);
      
      // Act
      const resultado = determinarAccionSiguiente(ideas);
      
      // Assert
      expect(resultado.accion).toBe('FINALIZAR');
      expect(resultado.elegidas.length).toBe(3);
      expect(resultado.elegidas.map(i => i.id)).toEqual(['idea1', 'idea2', 'idea3']);
    });

    it('debería iniciar una nueva ronda cuando hay 2 ideas con más votos y múltiples empatadas en segunda posición', () => {
      // Arrange
      const ideas = crearIdeas([7, 7, 5, 5, 5, 3]);
      
      // Act
      const resultado = determinarAccionSiguiente(ideas);
      
      // Assert
      expect(resultado.accion).toBe('NUEVA_RONDA');
      expect(resultado.elegidas.length).toBe(2);
      expect(resultado.elegidas.map(i => i.id)).toEqual(['idea1', 'idea2']);
      expect(resultado.candidatas.length).toBe(3);
      expect(resultado.candidatas.map(i => i.id)).toEqual(['idea3', 'idea4', 'idea5']);
    });
  });

  describe('determinarAccionSiguiente - CASO 3: Una idea con mayor cantidad de votos', () => {
    it('debería finalizar cuando hay 1 idea con más votos y exactamente 2 empatadas en segundo lugar', () => {
      // Arrange
      const ideas = crearIdeas([8, 6, 6, 4, 2]);
      
      // Act
      const resultado = determinarAccionSiguiente(ideas);
      
      // Assert
      expect(resultado.accion).toBe('FINALIZAR');
      expect(resultado.elegidas.length).toBe(3);
      expect(resultado.elegidas.map(i => i.id)).toEqual(['idea1', 'idea2', 'idea3']);
    });

    it('debería finalizar cuando hay 1 idea con más votos, 1 en segundo lugar, y 1 en tercer lugar', () => {
      // Arrange
      const ideas = crearIdeas([10, 7, 5, 3, 2]);
      
      // Act
      const resultado = determinarAccionSiguiente(ideas);
      
      // Assert
      expect(resultado.accion).toBe('FINALIZAR');
      expect(resultado.elegidas.length).toBe(3);
      expect(resultado.elegidas.map(i => i.id)).toEqual(['idea1', 'idea2', 'idea3']);
    });

    it('debería iniciar una nueva ronda cuando hay 1 idea con más votos, 1 en segundo lugar, y múltiples empatadas en tercera posición', () => {
      // Arrange
      const ideas = crearIdeas([10, 7, 5, 5, 5, 2]);
      
      // Act
      const resultado = determinarAccionSiguiente(ideas);
      
      // Assert
      expect(resultado.accion).toBe('NUEVA_RONDA');
      expect(resultado.elegidas.length).toBe(2);
      expect(resultado.elegidas.map(i => i.id)).toEqual(['idea1', 'idea2']);
      expect(resultado.candidatas.length).toBe(3);
      expect(resultado.candidatas.map(i => i.id)).toEqual(['idea3', 'idea4', 'idea5']);
    });

    it('debería iniciar una nueva ronda cuando hay 1 idea con más votos y más de 2 empatadas en segunda posición', () => {
      // Arrange
      const ideas = crearIdeas([10, 6, 6, 6, 4, 2]);
      
      // Act
      const resultado = determinarAccionSiguiente(ideas);
      
      // Assert
      expect(resultado.accion).toBe('NUEVA_RONDA');
      expect(resultado.elegidas.length).toBe(1);
      expect(resultado.elegidas[0].id).toBe('idea1');
      expect(resultado.candidatas.length).toBe(3);
      expect(resultado.candidatas.map(i => i.id)).toEqual(['idea2', 'idea3', 'idea4']);
    });
  });

  describe('determinarAccionSiguiente - CASO 4: Más de tres ideas empatadas con mayor cantidad de votos', () => {
    it('debería iniciar una nueva ronda cuando hay más de 3 ideas empatadas con la mayor cantidad de votos', () => {
      // Arrange
      const ideas = crearIdeas([5, 5, 5, 5, 3, 2]);
      
      // Act
      const resultado = determinarAccionSiguiente(ideas);
      
      // Assert
      expect(resultado.accion).toBe('NUEVA_RONDA');
      expect(resultado.elegidas.length).toBe(0);
      expect(resultado.candidatas.length).toBe(4);
      expect(resultado.candidatas.map(i => i.id)).toEqual(['idea1', 'idea2', 'idea3', 'idea4']);
    });
  });

  describe('prepararNuevaRonda', () => {
    it('debería preparar correctamente una nueva ronda', () => {
      // Arrange
      const ideasElegidas = [crearIdea('idea1', 10), crearIdea('idea2', 8)];
      const ideasCandidatas = [crearIdea('idea3', 5), crearIdea('idea4', 5)];
      const session = {
        id: 'session1',
        currentRound: 1,
        status: 'VOTING'
      };
      
      // Act
      const resultado = prepararNuevaRonda(ideasElegidas, ideasCandidatas, session);
      
      // Assert
      expect(resultado.currentRound).toBe(2);
      expect(resultado.status).toBe('REVOTING');
      expect(resultado.ideasElegidas).toEqual(ideasElegidas);
      expect(resultado.ideasCandidatas).toEqual(ideasCandidatas);
      expect(resultado.votosNuevaRonda).toEqual({});
    });
  });

  describe('finalizarSeleccion', () => {
    it('debería preparar correctamente la configuración final', () => {
      // Arrange
      const ideasElegidas = [
        crearIdea('idea1', 10), 
        crearIdea('idea2', 8),
        crearIdea('idea3', 6)
      ];
      const session = {
        id: 'session1',
        currentRound: 2,
        status: 'VOTING'
      };
      
      // Act
      const resultado = finalizarSeleccion(ideasElegidas, session);
      
      // Assert
      expect(resultado.status).toBe('FINISHED');
      expect(resultado.ideasFinales).toEqual(ideasElegidas);
      expect(resultado.fechaFinalizacion).toBeInstanceOf(Date);
    });
  });
});
```

### Tests de Integración para API Routes

```typescript
// __tests__/integration/api/session/procesar-votos.test.ts
import { createMocks } from 'node-mocks-http';
import { POST } from '@/app/api/session/[id]/procesar-votos/route';
import { prisma } from '@/lib/prisma';
import { io } from '@/lib/socket';

// Mock de Prisma y Socket.io
jest.mock('@/lib/prisma', () => ({
  prisma: {
    session: {
      findUnique: jest.fn(),
      update: jest.fn()
    }
  }
}));

jest.mock('@/lib/socket', () => ({
  io: {
    to: jest.fn().mockReturnThis(),
    emit: jest.fn()
  }
}));

describe('API: procesar-votos', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería procesar correctamente los votos y finalizar cuando hay 3 ideas claras', async () => {
    // Arrange
    const sessionId = 'session-123';
    const ideas = [
      { id: 'idea1', content: 'Idea 1', authorId: 'user1', sessionId },
      { id: 'idea2', content: 'Idea 2', authorId: 'user2', sessionId },
      { id: 'idea3', content: 'Idea 3', authorId: 'user3', sessionId },
      { id: 'idea4', content: 'Idea 4', authorId: 'user4', sessionId },
      { id: 'idea5', content: 'Idea 5', authorId: 'user5', sessionId }
    ];
    
    const votes = [
      { id: 'vote1', ideaId: 'idea1', userId: 'user1', sessionId, round: 1 },
      { id: 'vote2', ideaId: 'idea1', userId: 'user2', sessionId, round: 1 },
      { id: 'vote3', ideaId: 'idea1', userId: 'user3', sessionId, round: 1 },
      { id: 'vote4', ideaId: 'idea2', userId: 'user1', sessionId, round: 1 },
      { id: 'vote5', ideaId: 'idea2', userId: 'user2', sessionId, round: 1 },
      { id: 'vote6', ideaId: 'idea3', userId: 'user3', sessionId, round: 1 }
    ];
    
    const session = {
      id: sessionId,
      code: 'code-123',
      status: 'VOTING',
      currentRound: 1,
      ownerId: 'user1',
      ideas,
      votes
    };
    
    prisma.session.findUnique.mockResolvedValue(session);
    prisma.session.update.mockResolvedValue({
      ...session,
      status: 'FINISHED',
      metadata: {
        ideasFinales: ['idea1', 'idea2', 'idea3'],
        mensajeFinal: expect.any(String)
      }
    });
    
    const { req, res } = createMocks({
      method: 'POST',
      params: { id: sessionId }
    });
    
    // Act
    const response = await POST(req, { params: { id: sessionId } });
    const data = await response.json();
    
    // Assert
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.accion).toBe('FINALIZAR');
    expect(prisma.session.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: sessionId },
      data: expect.objectContaining({
        status: 'FINISHED'
      })
    }));
    expect(io.to).toHaveBeenCalledWith(`session-${sessionId}`);
    expect(io.emit).toHaveBeenCalledWith('voting-finished', expect.any(Object));
  });

  it('debería iniciar una nueva ronda cuando hay empate', async () => {
    // Arrange
    const sessionId = 'session-123';
    const ideas = [
      { id: 'idea1', content: 'Idea 1', authorId: 'user1', sessionId },
      { id: 'idea2', content: 'Idea 2', authorId: 'user2', sessionId },
      { id: 'idea3', content: 'Idea 3', authorId: 'user3', sessionId },
      { id: 'idea4', content: 'Idea 4', authorId: 'user4', sessionId },
      { id: 'idea5', content: 'Idea 5', authorId: 'user5', sessionId }
    ];
    
    const votes = [
      { id: 'vote1', ideaId: 'idea1', userId: 'user1', sessionId, round: 1 },
      { id: 'vote2', ideaId: 'idea1', userId: 'user2', sessionId, round: 1 },
      { id: 'vote3', ideaId: 'idea1', userId: 'user3', sessionId, round: 1 },
      { id: 'vote4', ideaId: 'idea2', userId: 'user1', sessionId, round: 1 },
      { id: 'vote5', ideaId: 'idea3', userId: 'user2', sessionId, round: 1 },
      { id: 'vote6', ideaId: 'idea3', userId: 'user3', sessionId, round: 1 },
      { id: 'vote7', ideaId: 'idea4', userId: 'user1', sessionId, round: 1 },
      { id: 'vote8', ideaId: 'idea4', userId: 'user2', sessionId, round: 1 },
      { id: 'vote9', ideaId: 'idea4', userId: 'user3', sessionId, round: 1 }
    ];
    
    const session = {
      id: sessionId,
      code: 'code-123',
      status: 'VOTING',
      currentRound: 1,
      ownerId: 'user1',
      ideas,
      votes
    };
    
    prisma.session.findUnique.mockResolvedValue(session);
    prisma.session.update.mockResolvedValue({
      ...session,
      status: 'REVOTING',
      currentRound: 2,
      metadata: {
        ideasElegidas: ['idea1', 'idea4'],
        ideasCandidatas: ['idea2', 'idea3'],
        mensajeRonda: expect.any(String)
      }
    });
    
    const { req, res } = createMocks({
      method: 'POST',
      params: { id: sessionId }
    });
    
    // Act
    const response = await POST(req, { params: { id: sessionId } });
    const data = await response.json();
    
    // Assert
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.accion).toBe('NUEVA_RONDA');
    expect(prisma.session.update).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: sessionId },
      data: expect.objectContaining({
        status: 'REVOTING',
        currentRound: { increment: 1 }
      })
    }));
    expect(io.to).toHaveBeenCalledWith(`session-${sessionId}`);
    expect(io.emit).toHaveBeenCalledWith('new-voting-round', expect.any(Object));
  });
});
```

### Tests de Componentes

```typescript
// __tests__/unit/components/VotingScreen.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { VotingScreen } from '@/components/VotingScreen';
import { useVotacion } from '@/hooks/useVotacion';

// Mock del hook useVotacion
jest.mock('@/hooks/useVotacion', () => ({
  useVotacion: jest.fn()
}));

describe('VotingScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('debería mostrar correctamente las ideas disponibles para votar', () => {
    // Arrange
    const mockIdeas = [
      { id: 'idea1', content: 'Idea 1', authorId: 'user1' },
      { id: 'idea2', content: 'Idea 2', authorId: 'user2' },
      { id: 'idea3', content: 'Idea 3', authorId: 'user3' },
      { id: 'idea4', content: 'Idea 4', authorId: 'user4' },
      { id: 'idea5', content: 'Idea 5', authorId: 'user5' }
    ];
    
    (useVotacion as jest.Mock).mockReturnValue({
      status: 'VOTING',
      currentRound: 1,
      ideasDisponibles: mockIdeas,
      ideasElegidas: [],
      ideasCandidatas: [],
      ideasFinales: [],
      mensaje: '',
      isLoading: false,
      error: null,
      enviarVotos: jest.fn()
    });
    
    // Act
    render(<VotingScreen sessionId="session-123" isOwner={false} />);
    
    // Assert
    expect(screen.getByText('Idea 1')).toBeInTheDocument();
    expect(screen.getByText('Idea 2')).toBeInTheDocument();
    expect(screen.getByText('Idea 3')).toBeInTheDocument();
    expect(screen.getByText('Idea 4')).toBeInTheDocument();
    expect(screen.getByText('Idea 5')).toBeInTheDocument();
  });

  it('debería permitir seleccionar exactamente 3 ideas', async () => {
    // Arrange
    const mockIdeas = [
      { id: 'idea1', content: 'Idea 1', authorId: 'user1' },
      { id: 'idea2', content: 'Idea 2', authorId: 'user2' },
      { id: 'idea3', content: 'Idea 3', authorId: 'user3' },
      { id: 'idea4', content: 'Idea 4', authorId: 'user4' },
      { id: 'idea5', content: 'Idea 5', authorId: 'user5' }
    ];
    
    const mockEnviarVotos = jest.fn();
    
    (useVotacion as jest.Mock).mockReturnValue({
      status: 'VOTING',
      currentRound: 1,
      ideasDisponibles: mockIdeas,
      ideasElegidas: [],
      ideasCandidatas: [],
      ideasFinales: [],
      mensaje: '',
      isLoading: false,
      error: null,
      enviarVotos: mockEnviarVotos
    });
    
    // Act
    render(<VotingScreen sessionId="session-123" isOwner={false} />);
    
    // Seleccionar 3 ideas
    fireEvent.click(screen.getByText('Idea 1'));
    fireEvent.click(screen.getByText('Idea 3'));
    fireEvent.click(screen.getByText('Idea 5'));
    
    // Intentar seleccionar una cuarta idea (no debería permitirlo)
    fireEvent.click(screen.getByText('Idea 2'));
    
    // Enviar votos
    fireEvent.click(screen.getByText('Enviar Votación'));
    
    // Assert
    await waitFor(() => {
      expect(mockEnviarVotos).toHaveBeenCalledWith(['idea1', 'idea3', 'idea5']);
    });
  });

  it('debería mostrar la pantalla de resultados cuando la votación ha finalizado', () => {
    // Arrange
    const mockIdeasFinales = [
      { id: 'idea1', content: 'Idea 1', authorId: 'user1', votos: 5 },
      { id: 'idea3', content: 'Idea 3', authorId: 'user3', votos: 4 },
      { id: 'idea5', content: 'Idea 5', authorId: 'user5', votos: 3 }
    ];
    
    (useVotacion as jest.Mock).mockReturnValue({
      status: 'FINISHED',
      currentRound: 2,
      ideasDisponibles: [],
      ideasElegidas: [],
      ideasCandidatas: [],
      ideasFinales: mockIdeasFinales,
      mensaje: '¡Votación finalizada!',
      isLoading: false,
      error: null,
      enviarVotos: jest.fn()
    });
    
    // Act
    render(<VotingScreen sessionId="session-123" isOwner={false} />);
    
    // Assert
    expect(screen.getByText('¡Votación finalizada!')).toBeInTheDocument();
    expect(screen.getByText('Idea 1')).toBeInTheDocument();
    expect(screen.getByText('Idea 3')).toBeInTheDocument();
    expect(screen.getByText('Idea 5')).toBeInTheDocument();
    expect(screen.getByText('5 votos')).toBeInTheDocument();
    expect(screen.getByText('4 votos')).toBeInTheDocument();
    expect(screen.getByText('3 votos')).toBeInTheDocument();
  });
});
```

### Cobertura de Pruebas

Nuestro objetivo es alcanzar una cobertura mínima del 80% en todos los módulos críticos, con especial énfasis en:

1. La lógica de selección de ideas (100% de cobertura)
2. La gestión de sesiones y votaciones (90% de cobertura)
3. La comunicación en tiempo real (85% de cobertura)

Mediante esta estrategia de pruebas exhaustiva, garantizaremos que todos los escenarios posibles de selección de ideas estén correctamente implementados y funcionen según lo esperado. 