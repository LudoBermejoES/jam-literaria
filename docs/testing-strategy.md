# Estrategia de Testing para la Aplicación de Jam Literaria

## Configuración Tecnológica

- **Framework de Testing**: Jest
- **Testing de Componentes**: React Testing Library
- **Mocking**: jest.mock y node-mocks-http
- **Lenguaje**: TypeScript

## Estructura de Tests

```
/__tests__/
  /unit/                # Tests unitarios
    /lib/               # Tests de utilidades y funciones
      votacion.test.ts  # Tests para la lógica de selección de ideas
    /hooks/             # Tests de hooks personalizados
    /components/        # Tests de componentes React
  /integration/         # Tests de integración
    /api/               # Tests de API Routes
    /flow/              # Tests de flujos completos
```

## Tests Unitarios para la Lógica de Selección de Ideas

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

## Tests de Integración para la API de Procesamiento de Votos

```typescript
// __tests__/integration/api/session/procesar-votos.test.ts
import { createMocks } from 'node-mocks-http';
import { procesarVotos } from '@/server/api/session/[id]/procesar-votos';
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
    await procesarVotos(req, res);
    
    // Assert
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        success: true,
        accion: 'FINALIZAR'
      })
    );
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
        ideasElegidas: ['idea1'],
        ideasCandidatas: ['idea3', 'idea4'],
        mensajeRonda: expect.any(String)
      }
    });
    
    const { req, res } = createMocks({
      method: 'POST',
      params: { id: sessionId }
    });
    
    // Act
    await procesarVotos(req, res);
    
    // Assert
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res._getData())).toEqual(
      expect.objectContaining({
        success: true,
        accion: 'NUEVA_RONDA'
      })
    );
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

## Tests para el Componente de Votación

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

## Cobertura de Tests Completa

Nuestro objetivo es alcanzar una cobertura mínima del 80% en todos los módulos críticos:

1. **Lógica de selección de ideas**: 100% de cobertura
   - Todos los casos y subcasos 
   - Cada escenario de desempate

2. **Manejo de sesiones y votaciones**: 90% de cobertura
   - Creación y unión a sesiones
   - Gestión de participantes
   - Flujo completo de votación

3. **Comunicación en tiempo real**: 85% de cobertura
   - Eventos de Socket.io
   - Reconexiones
   - Sincronización de estado

## Pruebas End-to-End

Utilizaremos Playwright para crear pruebas end-to-end que simulen el flujo completo:

1. **Creación de sesión**
2. **Unión de participantes**
3. **Envío de ideas**
4. **Votación**
5. **Procesado de resultados**
6. **Rondas de desempate**
7. **Visualización de resultados finales**

## Casos de Test Específicos para la Lógica de Selección

| ID | Descripción del Caso | Resultado Esperado |
|----|----------------------|-------------------|
| T01 | 3 ideas con mismo número de votos (empatadas) | Finalizar con esas 3 ideas |
| T02 | 2 ideas con más votos, 1 idea en segunda posición | Finalizar con esas 3 ideas |
| T03 | 2 ideas con más votos, múltiples empatadas en segunda posición | Nueva ronda solo con las empatadas |
| T04 | 1 idea con más votos, 2 empatadas en segunda posición | Finalizar con esas 3 ideas |
| T05 | 1 idea con más votos, 1 en segunda, 1 en tercera | Finalizar con esas 3 ideas |
| T06 | 1 idea con más votos, 1 en segunda, múltiples en tercera | Nueva ronda para desempatar tercera posición |
| T07 | 1 idea con más votos, múltiples (>2) en segunda | Nueva ronda para desempatar segundas posiciones |
| T08 | Más de 3 ideas empatadas con mayor número de votos | Nueva ronda solo con esas ideas |
| T09 | Segunda ronda con ideas previamente elegidas | Combinar resultados correctamente |
| T10 | Tercera ronda para desempate final | Finalizar con 3 ideas correctas | 