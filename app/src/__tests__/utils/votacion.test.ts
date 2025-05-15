import { 
  determinarAccionSiguiente, 
  agruparIdeasPorVotos,
  prepararNuevaRonda,
  finalizarSeleccion
} from '../../utils/votacion';

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