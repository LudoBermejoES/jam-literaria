import { describe, it, expect } from 'vitest';
import {
  calculateRequiredVotes,
  determinarAccionSiguiente,
  agruparIdeasPorVotos
} from '../../services/votingService.js';

describe('Voting Service', () => {
  describe('calculateRequiredVotes', () => {
    it('should return 3 for 4 or more ideas', () => {
      expect(calculateRequiredVotes(4)).toBe(3);
      expect(calculateRequiredVotes(5)).toBe(3);
      expect(calculateRequiredVotes(10)).toBe(3);
      expect(calculateRequiredVotes(100)).toBe(3);
    });

    it('should return 2 for exactly 3 ideas', () => {
      expect(calculateRequiredVotes(3)).toBe(2);
    });

    it('should return 1 for exactly 2 ideas', () => {
      expect(calculateRequiredVotes(2)).toBe(1);
    });

    it('should return 0 for 1 or fewer ideas', () => {
      expect(calculateRequiredVotes(1)).toBe(0);
      expect(calculateRequiredVotes(0)).toBe(0);
    });
  });

  describe('agruparIdeasPorVotos', () => {
    it('should group ideas by vote count', () => {
      const ideas = [
        { id: '1', votos: 5 },
        { id: '2', votos: 3 },
        { id: '3', votos: 5 },
        { id: '4', votos: 2 },
        { id: '5', votos: 3 }
      ];

      const grupos = agruparIdeasPorVotos(ideas);

      expect(grupos[5]).toHaveLength(2);
      expect(grupos[3]).toHaveLength(2);
      expect(grupos[2]).toHaveLength(1);
    });

    it('should handle empty array', () => {
      const grupos = agruparIdeasPorVotos([]);
      expect(grupos).toEqual({});
    });

    it('should handle single idea', () => {
      const ideas = [{ id: '1', votos: 5 }];
      const grupos = agruparIdeasPorVotos(ideas);

      expect(grupos[5]).toHaveLength(1);
      expect(grupos[5][0].id).toBe('1');
    });

    it('should handle all ideas with same votes', () => {
      const ideas = [
        { id: '1', votos: 3 },
        { id: '2', votos: 3 },
        { id: '3', votos: 3 }
      ];

      const grupos = agruparIdeasPorVotos(ideas);
      expect(grupos[3]).toHaveLength(3);
    });
  });

  describe('determinarAccionSiguiente', () => {
    describe('FINALIZAR scenarios', () => {
      it('should finalize when exactly 3 clear winners (no ties)', () => {
        const ideas = [
          { id: '1', votos: 5, content: 'Idea 1' },
          { id: '2', votos: 4, content: 'Idea 2' },
          { id: '3', votos: 3, content: 'Idea 3' },
          { id: '4', votos: 2, content: 'Idea 4' },
          { id: '5', votos: 1, content: 'Idea 5' }
        ];

        const result = determinarAccionSiguiente(ideas, 0);

        expect(result.accion).toBe('FINALIZAR');
        expect(result.ideasElegidas).toHaveLength(3);
        expect(result.ideasElegidas).toContain('1');
        expect(result.ideasElegidas).toContain('2');
        expect(result.ideasElegidas).toContain('3');
      });

      it('should finalize when exactly 3 ideas with highest votes (all tied)', () => {
        const ideas = [
          { id: '1', votos: 5, content: 'Idea 1' },
          { id: '2', votos: 5, content: 'Idea 2' },
          { id: '3', votos: 5, content: 'Idea 3' },
          { id: '4', votos: 2, content: 'Idea 4' }
        ];

        const result = determinarAccionSiguiente(ideas, 0);

        expect(result.accion).toBe('FINALIZAR');
        expect(result.ideasElegidas).toHaveLength(3);
      });

      it('should finalize with 2 winners already selected and 1 clear winner', () => {
        const ideas = [
          { id: '3', votos: 4, content: 'Idea 3' },
          { id: '4', votos: 2, content: 'Idea 4' },
          { id: '5', votos: 1, content: 'Idea 5' }
        ];

        const result = determinarAccionSiguiente(ideas, 2);

        expect(result.accion).toBe('FINALIZAR');
        expect(result.ideasElegidas).toHaveLength(1);
        expect(result.ideasElegidas).toContain('3');
      });

      it('should finalize when only 3 ideas total', () => {
        const ideas = [
          { id: '1', votos: 3, content: 'Idea 1' },
          { id: '2', votos: 2, content: 'Idea 2' },
          { id: '3', votos: 1, content: 'Idea 3' }
        ];

        const result = determinarAccionSiguiente(ideas, 0);

        expect(result.accion).toBe('FINALIZAR');
        expect(result.ideasElegidas).toHaveLength(3);
      });
    });

    describe('NUEVA_RONDA scenarios', () => {
      it('should create new round when all top ideas are tied', () => {
        const ideas = [
          { id: '1', votos: 3, content: 'Idea 1' },
          { id: '2', votos: 3, content: 'Idea 2' },
          { id: '3', votos: 3, content: 'Idea 3' },
          { id: '4', votos: 3, content: 'Idea 4' }
        ];

        const result = determinarAccionSiguiente(ideas, 0);

        expect(result.accion).toBe('NUEVA_RONDA');
        expect(result.ideasCandidatas).toHaveLength(4);
      });

      it('should create new round when all remaining candidates are tied', () => {
        const ideas = [
          { id: '4', votos: 2, content: 'Idea 4' },
          { id: '5', votos: 2, content: 'Idea 5' },
          { id: '6', votos: 2, content: 'Idea 6' }
        ];

        const result = determinarAccionSiguiente(ideas, 2);

        expect(result.accion).toBe('NUEVA_RONDA');
        expect(result.ideasCandidatas).toHaveLength(3);
      });

      it('should create new round when 6 ideas tied for 3 slots', () => {
        const ideas = [
          { id: '1', votos: 2, content: 'Idea 1' },
          { id: '2', votos: 2, content: 'Idea 2' },
          { id: '3', votos: 2, content: 'Idea 3' },
          { id: '4', votos: 2, content: 'Idea 4' },
          { id: '5', votos: 2, content: 'Idea 5' },
          { id: '6', votos: 2, content: 'Idea 6' }
        ];

        const result = determinarAccionSiguiente(ideas, 0);

        expect(result.accion).toBe('NUEVA_RONDA');
        expect(result.ideasCandidatas).toHaveLength(6);
      });
    });

    describe('AGREGAR_GANADORES scenarios', () => {
      it('should add winners and create new round for ties', () => {
        const ideas = [
          { id: '1', votos: 5, content: 'Idea 1' },
          { id: '2', votos: 5, content: 'Idea 2' },
          { id: '3', votos: 3, content: 'Idea 3' },
          { id: '4', votos: 3, content: 'Idea 4' },
          { id: '5', votos: 3, content: 'Idea 5' }
        ];

        const result = determinarAccionSiguiente(ideas, 0);

        expect(result.accion).toBe('AGREGAR_GANADORES');
        expect(result.ideasElegidas).toHaveLength(2);
        expect(result.ideasElegidas).toContain('1');
        expect(result.ideasElegidas).toContain('2');
        expect(result.ideasCandidatas).toHaveLength(3);
        expect(result.ideasCandidatas).toContain('3');
        expect(result.ideasCandidatas).toContain('4');
        expect(result.ideasCandidatas).toContain('5');
      });

      it('should add 1 winner and create round for 4 tied candidates', () => {
        const ideas = [
          { id: '1', votos: 10, content: 'Idea 1' },
          { id: '2', votos: 5, content: 'Idea 2' },
          { id: '3', votos: 5, content: 'Idea 3' },
          { id: '4', votos: 5, content: 'Idea 4' },
          { id: '5', votos: 5, content: 'Idea 5' }
        ];

        const result = determinarAccionSiguiente(ideas, 0);

        expect(result.accion).toBe('AGREGAR_GANADORES');
        expect(result.ideasElegidas).toHaveLength(1);
        expect(result.ideasElegidas).toContain('1');
        expect(result.ideasCandidatas).toHaveLength(4);
      });

      it('should work with already selected winners', () => {
        const ideas = [
          { id: '3', votos: 8, content: 'Idea 3' },
          { id: '4', votos: 5, content: 'Idea 4' },
          { id: '5', votos: 5, content: 'Idea 5' },
          { id: '6', votos: 5, content: 'Idea 6' }
        ];

        const result = determinarAccionSiguiente(ideas, 1); // 1 winner already

        expect(result.accion).toBe('AGREGAR_GANADORES');
        expect(result.ideasElegidas).toHaveLength(1);
        expect(result.ideasElegidas).toContain('3');
        expect(result.ideasCandidatas).toHaveLength(3);
      });
    });

    describe('Edge cases', () => {
      it('should handle only 1 idea remaining', () => {
        const ideas = [
          { id: '1', votos: 5, content: 'Only idea' }
        ];

        const result = determinarAccionSiguiente(ideas, 2);

        expect(result.accion).toBe('FINALIZAR');
        expect(result.ideasElegidas).toHaveLength(1);
      });

      it('should handle 2 ideas for 1 remaining slot', () => {
        const ideas = [
          { id: '1', votos: 3, content: 'Idea 1' },
          { id: '2', votos: 2, content: 'Idea 2' }
        ];

        const result = determinarAccionSiguiente(ideas, 2);

        expect(result.accion).toBe('FINALIZAR');
        expect(result.ideasElegidas).toHaveLength(1);
        expect(result.ideasElegidas).toContain('1');
      });

      it('should handle 2 tied ideas for 1 remaining slot', () => {
        const ideas = [
          { id: '1', votos: 3, content: 'Idea 1' },
          { id: '2', votos: 3, content: 'Idea 2' }
        ];

        const result = determinarAccionSiguiente(ideas, 2);

        expect(result.accion).toBe('NUEVA_RONDA');
        expect(result.ideasCandidatas).toHaveLength(2);
      });

      it('should return FINALIZAR when already have 3 winners', () => {
        const ideas = [
          { id: '4', votos: 1, content: 'Idea 4' }
        ];

        const result = determinarAccionSiguiente(ideas, 3);

        expect(result.accion).toBe('FINALIZAR');
        expect(result.ideasElegidas).toHaveLength(0);
      });

      it('should handle ideas with 0 votes', () => {
        const ideas = [
          { id: '1', votos: 5, content: 'Idea 1' },
          { id: '2', votos: 3, content: 'Idea 2' },
          { id: '3', votos: 2, content: 'Idea 3' },
          { id: '4', votos: 0, content: 'Idea 4' },
          { id: '5', votos: 0, content: 'Idea 5' }
        ];

        const result = determinarAccionSiguiente(ideas, 0);

        expect(result.accion).toBe('FINALIZAR');
        expect(result.ideasElegidas).toHaveLength(3);
        expect(result.ideasElegidas).toContain('1');
        expect(result.ideasElegidas).toContain('2');
        expect(result.ideasElegidas).toContain('3');
      });
    });

    describe('Complex realistic scenarios', () => {
      it('Scenario 1: 8 ideas initial vote, top 2 clear, 4-way tie for 3rd', () => {
        const ideas = [
          { id: '1', votos: 4, content: 'Idea 1' },
          { id: '2', votos: 4, content: 'Idea 2' },
          { id: '3', votos: 2, content: 'Idea 3' },
          { id: '4', votos: 2, content: 'Idea 4' },
          { id: '5', votos: 2, content: 'Idea 5' },
          { id: '6', votos: 2, content: 'Idea 6' },
          { id: '7', votos: 1, content: 'Idea 7' },
          { id: '8', votos: 1, content: 'Idea 8' }
        ];

        const result = determinarAccionSiguiente(ideas, 0);

        expect(result.accion).toBe('AGREGAR_GANADORES');
        expect(result.ideasElegidas).toHaveLength(2);
        expect(result.ideasCandidatas).toHaveLength(4);
      });

      it('Scenario 2: Second round with 4 candidates for 1 slot', () => {
        const ideas = [
          { id: '3', votos: 3, content: 'Idea 3' },
          { id: '4', votos: 2, content: 'Idea 4' },
          { id: '5', votos: 1, content: 'Idea 5' },
          { id: '6', votos: 1, content: 'Idea 6' }
        ];

        const result = determinarAccionSiguiente(ideas, 2); // 2 winners already

        expect(result.accion).toBe('FINALIZAR');
        expect(result.ideasElegidas).toHaveLength(1);
        expect(result.ideasElegidas).toContain('3');
      });

      it('Scenario 3: Cascading tiebreakers', () => {
        // Round 1: Select 1 winner, 5 tied for remaining 2 slots
        const round1 = [
          { id: '1', votos: 10, content: 'Clear winner' },
          { id: '2', votos: 5, content: 'Tied 1' },
          { id: '3', votos: 5, content: 'Tied 2' },
          { id: '4', votos: 5, content: 'Tied 3' },
          { id: '5', votos: 5, content: 'Tied 4' },
          { id: '6', votos: 5, content: 'Tied 5' }
        ];

        const result1 = determinarAccionSiguiente(round1, 0);
        expect(result1.accion).toBe('AGREGAR_GANADORES');
        expect(result1.ideasElegidas).toHaveLength(1);
        expect(result1.ideasCandidatas).toHaveLength(5);

        // Round 2: 5 candidates for 2 slots, 2 clear winners
        const round2 = [
          { id: '2', votos: 4, content: 'Tied 1' },
          { id: '3', votos: 4, content: 'Tied 2' },
          { id: '4', votos: 2, content: 'Tied 3' },
          { id: '5', votos: 2, content: 'Tied 4' },
          { id: '6', votos: 1, content: 'Tied 5' }
        ];

        const result2 = determinarAccionSiguiente(round2, 1);
        expect(result2.accion).toBe('FINALIZAR');
        expect(result2.ideasElegidas).toHaveLength(2);
      });
    });
  });
});
