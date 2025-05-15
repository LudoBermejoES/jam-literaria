interface Idea {
  id: string;
  content: string;
  authorId: string;
  votos: number;
}

interface Session {
  id: string;
  currentRound: number;
  status: string;
  [key: string]: any;
}

interface ResultadoVotacion {
  accion: 'FINALIZAR' | 'NUEVA_RONDA' | 'ERROR';
  elegidas?: Idea[];
  candidatas?: Idea[];
  mensaje: string;
}

/**
 * Agrupa las ideas por su número de votos
 * @param ideas - Array de objetos con formato {id, content, votos, autorId}
 * @returns - Objeto con formato { numeroVotos: [ideas con ese número de votos] }
 */
export function agruparIdeasPorVotos(ideas: Idea[]): Record<string, Idea[]> {
  return ideas.reduce((grupos: Record<string, Idea[]>, idea: Idea) => {
    const votos = idea.votos.toString();
    if (!grupos[votos]) {
      grupos[votos] = [];
    }
    grupos[votos].push(idea);
    return grupos;
  }, {});
}

/**
 * Esta función analiza los resultados de la votación y determina la acción siguiente
 * @param ideas - Array de objetos con formato {id, content, votos, autorId}
 * @returns - Objeto con la acción a seguir y las ideas seleccionadas o candidatas
 */
export function determinarAccionSiguiente(ideas: Idea[]): ResultadoVotacion {
  // Ordenar ideas por número de votos (descendente)
  const ideasOrdenadas = [...ideas].sort((a, b) => b.votos - a.votos);

  // Agrupar ideas por cantidad de votos
  const gruposPorVotos = agruparIdeasPorVotos(ideasOrdenadas);

  // Array con los grupos de votos en orden descendente
  const gruposOrdenados = Object.entries(gruposPorVotos)
    .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
    .map((entry) => ({
      votos: parseInt(entry[0]),
      ideas: entry[1],
    }));

  // CASO 1: Hay exactamente 3 ideas con la mayor cantidad de votos (empatadas)
  if (gruposOrdenados[0]?.ideas.length === 3) {
    return {
      accion: 'FINALIZAR',
      elegidas: gruposOrdenados[0].ideas,
      mensaje: 'Tres ideas con la mayor cantidad de votos y empatadas.',
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
        mensaje: 'Dos ideas con mayor cantidad de votos y una segunda con menos votos.',
      };
    }

    // Si hay múltiples ideas empatadas en segunda posición, necesitamos desempatar
    return {
      accion: 'NUEVA_RONDA',
      elegidas: ideasElegidas,
      candidatas: gruposOrdenados[1].ideas,
      mensaje: 'Dos ideas con mayor cantidad de votos, múltiples empatadas en segundo lugar.',
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
        mensaje: 'Una idea con mayor cantidad de votos, dos empatadas en segundo lugar.',
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
          mensaje: 'Una idea con mayor cantidad de votos, una segunda, una tercera.',
        };
      }

      // Si en tercera posición hay múltiples ideas empatadas, necesitamos desempatar
      if (gruposOrdenados[2]?.ideas.length > 1) {
        return {
          accion: 'NUEVA_RONDA',
          elegidas: [ideaConMasVotos, ideaSegundoLugar],
          candidatas: gruposOrdenados[2].ideas,
          mensaje:
            'Una idea con mayor cantidad de votos, una segunda, múltiples empatadas en tercera posición.',
        };
      }
    }

    // Subcaso 3.3: En segunda posición hay más de 2 ideas empatadas
    if (gruposOrdenados[1]?.ideas.length > 2) {
      return {
        accion: 'NUEVA_RONDA',
        elegidas: [ideaConMasVotos],
        candidatas: gruposOrdenados[1].ideas,
        mensaje: 'Una idea con mayor cantidad de votos, más de dos empatadas en segunda posición.',
      };
    }
  }

  // CASO 4: Hay más de 3 ideas con la mayor cantidad de votos (todas empatadas)
  if (gruposOrdenados[0]?.ideas.length > 3) {
    return {
      accion: 'NUEVA_RONDA',
      elegidas: [],
      candidatas: gruposOrdenados[0].ideas,
      mensaje: 'Más de tres ideas empatadas con la mayor cantidad de votos.',
    };
  }

  // CASO 5: No hay votos suficientes o situación no contemplada
  return {
    accion: 'ERROR',
    mensaje: 'Situación no contemplada en las reglas o no hay suficientes votos.',
  };
}

/**
 * Implementa la lógica para realizar una nueva ronda de votación
 * @param ideasElegidas - Ideas ya elegidas que no participan en la nueva ronda
 * @param ideasCandidatas - Ideas que participan en la nueva ronda
 * @param session - Objeto de sesión actual
 * @returns - Nueva configuración de la sesión
 */
export function prepararNuevaRonda(
  ideasElegidas: Idea[],
  ideasCandidatas: Idea[],
  session: Session,
): Session {
  const nuevaRonda = session.currentRound + 1;

  return {
    ...session,
    currentRound: nuevaRonda,
    status: 'REVOTING',
    ideasElegidas,
    ideasCandidatas,
    // Reiniciar votos para la nueva ronda
    votosNuevaRonda: {},
  };
}

/**
 * Procesa los resultados finales cuando ya hay 3 ideas elegidas
 * @param ideasElegidas - Las 3 ideas finalmente elegidas
 * @param session - Objeto de sesión actual
 * @returns - Configuración final de la sesión
 */
export function finalizarSeleccion(ideasElegidas: Idea[], session: Session): Session {
  return {
    ...session,
    status: 'FINISHED',
    ideasFinales: ideasElegidas,
    fechaFinalizacion: new Date(),
  };
}
