import { jest, describe, it, expect } from '@jest/globals';
import { 
  agruparIdeasPorVotos, 
  determinarAccionSiguiente,
  prepararNuevaRonda,
  Idea,
  Session
} from '../../../lib/votacion';

describe('Votacion Module', () => {
  describe('agruparIdeasPorVotos', () => {
    it('should group ideas by vote count', () => {
      const ideas: Idea[] = [
        { id: '1', content: 'Idea 1', authorId: 'user1', votos: 5 },
        { id: '2', content: 'Idea 2', authorId: 'user2', votos: 3 },
        { id: '3', content: 'Idea 3', authorId: 'user3', votos: 5 },
        { id: '4', content: 'Idea 4', authorId: 'user4', votos: 1 },
        { id: '5', content: 'Idea 5', authorId: 'user5', votos: 3 }
      ];

      const result = agruparIdeasPorVotos(ideas);

      expect(result['5']).toHaveLength(2);
      expect(result['3']).toHaveLength(2);
      expect(result['1']).toHaveLength(1);
      expect(result['5']).toContainEqual(ideas[0]);
      expect(result['5']).toContainEqual(ideas[2]);
    });

    it('should handle empty input', () => {
      const result = agruparIdeasPorVotos([]);
      expect(Object.keys(result)).toHaveLength(0);
    });
  });

  describe('determinarAccionSiguiente', () => {
    it('should finalize when exactly 3 ideas have the highest vote count', () => {
      const ideas: Idea[] = [
        { id: '1', content: 'Idea 1', authorId: 'user1', votos: 5 },
        { id: '2', content: 'Idea 2', authorId: 'user2', votos: 5 },
        { id: '3', content: 'Idea 3', authorId: 'user3', votos: 5 },
        { id: '4', content: 'Idea 4', authorId: 'user4', votos: 2 },
        { id: '5', content: 'Idea 5', authorId: 'user5', votos: 1 }
      ];

      const result = determinarAccionSiguiente(ideas);

      expect(result.accion).toBe('FINALIZAR');
      expect(result.elegidas).toHaveLength(3);
      expect(result.elegidas?.map(idea => idea.id)).toEqual(['1', '2', '3']);
    });

    it('should finalize when 2 ideas have the highest vote count and 1 idea has the second highest', () => {
      const ideas: Idea[] = [
        { id: '1', content: 'Idea 1', authorId: 'user1', votos: 5 },
        { id: '2', content: 'Idea 2', authorId: 'user2', votos: 5 },
        { id: '3', content: 'Idea 3', authorId: 'user3', votos: 3 },
        { id: '4', content: 'Idea 4', authorId: 'user4', votos: 2 },
        { id: '5', content: 'Idea 5', authorId: 'user5', votos: 1 }
      ];

      const result = determinarAccionSiguiente(ideas);

      expect(result.accion).toBe('FINALIZAR');
      expect(result.elegidas).toHaveLength(3);
      expect(result.elegidas?.map(idea => idea.id)).toEqual(['1', '2', '3']);
    });

    it('should request a new round when 1 idea has the highest vote count and multiple ideas are tied for second place', () => {
      const ideas: Idea[] = [
        { id: '1', content: 'Idea 1', authorId: 'user1', votos: 7 },
        { id: '2', content: 'Idea 2', authorId: 'user2', votos: 5 },
        { id: '3', content: 'Idea 3', authorId: 'user3', votos: 5 },
        { id: '4', content: 'Idea 4', authorId: 'user4', votos: 5 },
        { id: '5', content: 'Idea 5', authorId: 'user5', votos: 2 }
      ];

      const result = determinarAccionSiguiente(ideas);

      expect(result.accion).toBe('NUEVA_RONDA');
      expect(result.elegidas).toHaveLength(1);
      expect(result.candidatas).toHaveLength(3);
      expect(result.elegidas?.[0].id).toBe('1');
      expect(result.candidatas?.map(idea => idea.id)).toEqual(['2', '3', '4']);
    });

    it('should request a new round when more than 3 ideas are tied for the highest vote count', () => {
      const ideas: Idea[] = [
        { id: '1', content: 'Idea 1', authorId: 'user1', votos: 5 },
        { id: '2', content: 'Idea 2', authorId: 'user2', votos: 5 },
        { id: '3', content: 'Idea 3', authorId: 'user3', votos: 5 },
        { id: '4', content: 'Idea 4', authorId: 'user4', votos: 5 },
        { id: '5', content: 'Idea 5', authorId: 'user5', votos: 1 }
      ];

      const result = determinarAccionSiguiente(ideas);

      expect(result.accion).toBe('NUEVA_RONDA');
      expect(result.elegidas).toHaveLength(0);
      expect(result.candidatas).toHaveLength(4);
      expect(result.candidatas?.map(idea => idea.id)).toEqual(['1', '2', '3', '4']);
    });

    it('should handle empty ideas array', () => {
      const result = determinarAccionSiguiente([]);
      expect(result.accion).toBe('ERROR');
    });
  });

  describe('prepararNuevaRonda', () => {
    it('should prepare session for a new voting round', () => {
      const ideasElegidas: Idea[] = [
        { id: '1', content: 'Idea 1', authorId: 'user1', votos: 7 }
      ];

      const ideasCandidatas: Idea[] = [
        { id: '2', content: 'Idea 2', authorId: 'user2', votos: 5 },
        { id: '3', content: 'Idea 3', authorId: 'user3', votos: 5 }
      ];

      const session: Session = {
        id: 'session1',
        currentRound: 1,
        status: 'VOTING'
      };

      const result = prepararNuevaRonda(ideasElegidas, ideasCandidatas, session);

      expect(result.currentRound).toBe(2);
      expect(result.status).toBe('REVOTING');
      expect(result.ideasElegidas).toBe(ideasElegidas);
      expect(result.ideasCandidatas).toBe(ideasCandidatas);
      expect(result.votosNuevaRonda).toEqual({});
    });
  });
}); 