// This test file will test the voting logic described in the architecture document
// Implementation should follow the documentation in architecture.md

// Implementation of the voting logic function
interface Idea {
  id: string;
  content: string;
  authorId: string;
  votos: number;
}

interface ResultadoVotacion {
  accion: 'FINALIZAR' | 'NUEVA_RONDA';
  elegidas?: Idea[];
  candidatas?: Idea[];
}

// Function to determine the next action based on voting results
function determinarAccionSiguiente(ideas: Idea[]): ResultadoVotacion {
  // Sort ideas by votes in descending order
  const ideasOrdenadas = [...ideas].sort((a, b) => b.votos - a.votos);
  
  // Get unique vote counts in descending order
  const votosUnicos = Array.from(new Set(ideasOrdenadas.map(idea => idea.votos)))
    .sort((a, b) => b - a);
  
  // Get ideas with the highest vote count
  const ideasMasVotadas = ideasOrdenadas.filter(idea => idea.votos === votosUnicos[0]);
  
  // CASE 1: Exactly 3 ideas with the highest votes
  if (ideasMasVotadas.length === 3) {
    return {
      accion: 'FINALIZAR',
      elegidas: ideasMasVotadas
    };
  }
  
  // CASE 2: 2 ideas with the highest votes
  if (ideasMasVotadas.length === 2) {
    // Get ideas with the second highest vote count
    const ideasSegundoLugar = ideasOrdenadas.filter(idea => idea.votos === votosUnicos[1]);
    
    // If there's exactly 1 idea in second place, we can finalize
    if (ideasSegundoLugar.length === 1) {
      return {
        accion: 'FINALIZAR',
        elegidas: [...ideasMasVotadas, ideasSegundoLugar[0]]
      };
    } else {
      // Multiple ideas tied for second place, need another round
      return {
        accion: 'NUEVA_RONDA',
        elegidas: ideasMasVotadas,
        candidatas: ideasSegundoLugar
      };
    }
  }
  
  // CASE 3: 1 idea with the highest votes
  if (ideasMasVotadas.length === 1) {
    // Get ideas with the second highest vote count
    const ideasSegundoLugar = ideasOrdenadas.filter(idea => idea.votos === votosUnicos[1]);
    
    // If there are exactly 2 ideas in second place, we can finalize
    if (ideasSegundoLugar.length === 2) {
      return {
        accion: 'FINALIZAR',
        elegidas: [...ideasMasVotadas, ...ideasSegundoLugar]
      };
    }
    
    // If there's 1 idea in second place, check third place
    if (ideasSegundoLugar.length === 1) {
      const ideasTercerLugar = ideasOrdenadas.filter(idea => idea.votos === votosUnicos[2]);
      
      // If there's exactly 1 idea in third place, we can finalize
      if (ideasTercerLugar.length === 1) {
        return {
          accion: 'FINALIZAR',
          elegidas: [...ideasMasVotadas, ...ideasSegundoLugar, ideasTercerLugar[0]]
        };
      } else {
        // Multiple ideas tied for third place, need another round
        return {
          accion: 'NUEVA_RONDA',
          elegidas: [...ideasMasVotadas, ...ideasSegundoLugar],
          candidatas: ideasTercerLugar
        };
      }
    }
    
    // More than 2 ideas tied for second place, need another round
    return {
      accion: 'NUEVA_RONDA',
      elegidas: ideasMasVotadas,
      candidatas: ideasSegundoLugar
    };
  }
  
  // CASE 4: More than 3 ideas tied for the highest votes, need another round
  return {
    accion: 'NUEVA_RONDA',
    candidatas: ideasMasVotadas
  };
}

describe('Lógica de selección de ideas', () => {
  // Helper functions to create test ideas
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

  describe('CASO 1: Tres ideas con mayor cantidad de votos empatadas', () => {
    it('debería finalizar cuando hay exactamente 3 ideas con el mismo número de votos y son las más votadas', () => {
      const ideas = crearIdeas([5, 5, 5, 2, 1]);
      const resultado = determinarAccionSiguiente(ideas);
      expect(resultado.accion).toBe('FINALIZAR');
      expect(resultado.elegidas?.length).toBe(3);
      expect(resultado.elegidas?.map(idea => idea.id).sort()).toEqual(['idea1', 'idea2', 'idea3'].sort());
    });
    
    it('debería finalizar incluso si hay más ideas con el mismo número de votos pero solo necesitamos 3', () => {
      const ideas = crearIdeas([5, 5, 5, 5, 5]);
      const resultado = determinarAccionSiguiente(ideas);
      expect(resultado.accion).toBe('NUEVA_RONDA');
      expect(resultado.candidatas?.length).toBe(5);
    });
  });

  describe('CASO 2: Dos ideas con mayor cantidad de votos', () => {
    it('debería finalizar cuando hay 2 ideas con más votos y 1 en segunda posición', () => {
      const ideas = crearIdeas([7, 7, 5, 3, 2]);
      const resultado = determinarAccionSiguiente(ideas);
      expect(resultado.accion).toBe('FINALIZAR');
      expect(resultado.elegidas?.length).toBe(3);
      expect(resultado.elegidas?.map(idea => idea.id).sort()).toEqual(['idea1', 'idea2', 'idea3'].sort());
    });

    it('debería iniciar una nueva ronda cuando hay 2 ideas con más votos y múltiples empatadas en segunda posición', () => {
      const ideas = crearIdeas([7, 7, 5, 5, 5]);
      const resultado = determinarAccionSiguiente(ideas);
      expect(resultado.accion).toBe('NUEVA_RONDA');
      expect(resultado.elegidas?.length).toBe(2);
      expect(resultado.candidatas?.length).toBe(3);
    });
  });
  
  describe('CASO 3: Una idea con mayor cantidad de votos', () => {
    it('debería finalizar cuando hay 1 idea con más votos y 2 en segunda posición', () => {
      const ideas = crearIdeas([10, 7, 7, 5, 3]);
      const resultado = determinarAccionSiguiente(ideas);
      expect(resultado.accion).toBe('FINALIZAR');
      expect(resultado.elegidas?.length).toBe(3);
      expect(resultado.elegidas?.map(idea => idea.id).sort()).toEqual(['idea1', 'idea2', 'idea3'].sort());
    });
    
    it('debería finalizar cuando hay 1 idea con más votos, 1 en segunda posición, y 1 en tercera posición', () => {
      const ideas = crearIdeas([10, 7, 5, 3, 1]);
      const resultado = determinarAccionSiguiente(ideas);
      expect(resultado.accion).toBe('FINALIZAR');
      expect(resultado.elegidas?.length).toBe(3);
      expect(resultado.elegidas?.map(idea => idea.id).sort()).toEqual(['idea1', 'idea2', 'idea3'].sort());
    });
    
    it('debería iniciar una nueva ronda cuando hay 1 idea con más votos, 1 en segunda posición, y múltiples empatadas en tercera posición', () => {
      const ideas = crearIdeas([10, 7, 5, 5, 5]);
      const resultado = determinarAccionSiguiente(ideas);
      expect(resultado.accion).toBe('NUEVA_RONDA');
      expect(resultado.elegidas?.length).toBe(2);
      expect(resultado.candidatas?.length).toBe(3);
    });
    
    it('debería iniciar una nueva ronda cuando hay 1 idea con más votos y múltiples empatadas en segunda posición', () => {
      const ideas = crearIdeas([10, 7, 7, 7, 5]);
      const resultado = determinarAccionSiguiente(ideas);
      expect(resultado.accion).toBe('NUEVA_RONDA');
      expect(resultado.elegidas?.length).toBe(1);
      expect(resultado.candidatas?.length).toBe(3);
    });
  });
  
  describe('CASO 4: Más de tres ideas empatadas con mayor cantidad de votos', () => {
    it('debería iniciar una nueva ronda cuando hay 4 o más ideas empatadas con la mayor cantidad de votos', () => {
      const ideas = crearIdeas([7, 7, 7, 7, 5]);
      const resultado = determinarAccionSiguiente(ideas);
      expect(resultado.accion).toBe('NUEVA_RONDA');
      expect(resultado.candidatas?.length).toBe(4);
    });
  });
}); 