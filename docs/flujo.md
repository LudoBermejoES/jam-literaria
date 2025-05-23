
Flujo de la Aplicación y Diseño de Pantallas
1. Pantalla de Introducción (Nombre)
Campo para introducir nombre
Botón para continuar
Validaciones para evitar nombres vacíos
Diseño minimalista, mobile-first
2. Pantalla de Selección de Sesión
Dos opciones principales:
Crear nueva sesión
Unirse a una sesión existente (con campo para código)
Si el usuario llega con un enlace directo, se salta esta pantalla
Diseño con botones grandes para facilitar uso en móvil
3. Pantalla de Creación de Sesión (Maestro de Ceremonias)
Muestra el código generado y enlace para compartir
Lista de participantes que se van uniendo en tiempo real
Botón para iniciar la sesión (habilitado cuando hay al menos 2 participantes)
Opción para copiar enlace de invitación
Interfaz adaptada a pantallas pequeñas
4. Pantalla de Espera (Participantes)
Mensaje informativo
Indicador visual de espera
Actualización en tiempo real cuando el maestro inicia la sesión
Diseño optimizado para móvil
5. Pantalla de Envío de Ideas
Formulario para enviar 2-3 ideas (según número de participantes)
Área de texto expandible (sin límite de caracteres)
Botón para enviar ideas
Interfaz adaptable a diferentes tamaños de pantalla
6. Pantalla de Espera Post-Ideas
Para participantes: mensaje de espera
Para maestro: visualización de quién ha enviado ideas, botón para iniciar votación
Diseño responsive
7. Pantalla de Votación
Visualización de todas las ideas en formato tarjeta
Mecanismo para seleccionar exactamente 3 ideas
Botón para enviar selección
Diseño adaptado a móvil con scroll vertical para ideas largas
8. Pantalla de Espera/Control (Durante Conteo)
Para participantes: mensaje de espera
Para maestro: visualización en tiempo real del conteo, botones para:
Iniciar nueva ronda de votación (si hay empates)
Finalizar y mostrar resultados (cuando hay 3 ideas ganadoras)
UI optimizada para dispositivos móviles
9. Pantalla de Resultados Finales
Visualización de las 3 ideas elegidas
Número de votos de cada idea
Opción para iniciar una nueva jam
Visualización adaptada a diferentes tamaños de pantalla
Lógica de Selección de Ideas y Desempates
Algoritmo de Selección
Recopilar votos:

Contar los votos para cada idea
Ordenar ideas por número de votos (descendente)
Analizar situación:

Identificar ideas con más votos y posibles empates
Determinar si hay 3 ideas claras o se necesita desempate
Escenarios de desempate detallados:

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