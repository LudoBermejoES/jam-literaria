import { Idea } from '../models/Idea.js';
import { Vote } from '../models/Vote.js';
import { Session, SESSION_STATUS } from '../models/Session.js';

/**
 * Process votes and determine the action to take after a voting round
 * @param {string} sessionId - Session ID
 * @param {number} round - Current round number
 * @returns {Object} Action to take and related data
 */
export async function processVotingRound(sessionId, round) {
  if (!sessionId || round === undefined) {
    throw new Error('Session ID and round are required');
  }
  
  // Get the votes for this round
  const voteResults = Vote.getVoteCountsByIdea(sessionId, round);
  
  if (!voteResults || voteResults.length === 0) {
    throw new Error('No votes found for this round');
  }
  
  // Transform vote results into the expected format
  const ideas = voteResults.map(result => ({
    id: result.idea_id,
    content: result.content,
    votos: result.vote_count,
    autorId: result.author_id
  }));
  
  // Process the vote results to determine the next action
  const action = determinarAccionSiguiente(ideas);
  
  // Update the session metadata based on the action
  if (action.accion === 'FINALIZAR') {
    // Get the ideas that were selected
    const selectedIdeas = Idea.getIdeasByIds(action.ideasElegidas);
    
    // Update session status and metadata
    Session.updateSessionStatus(sessionId, SESSION_STATUS.COMPLETED);
    Session.updateSessionMetadata(sessionId, {
      ideas_elegidas: action.ideasElegidas,
      mensaje_final: 'Las ideas ganadoras han sido seleccionadas'
    });
    
    return {
      action: 'COMPLETE',
      selectedIdeas,
      message: 'Las ideas ganadoras han sido seleccionadas'
    };
  } else if (action.accion === 'NUEVA_RONDA') {
    // Prepare for a new voting round
    const candidateIdeas = Idea.getIdeasByIds(action.ideasCandidatas);
    const newRound = round + 1;
    
    // Update session round and metadata
    Session.updateSessionRound(sessionId, newRound);
    Session.updateSessionMetadata(sessionId, {
      ideas_candidatas: action.ideasCandidatas,
      mensaje_ronda: `Ronda ${newRound} de votación para desempate`
    });
    
    return {
      action: 'NEW_ROUND',
      round: newRound,
      candidateIdeas,
      message: `Ronda ${newRound} de votación para desempate`
    };
  }
  
  throw new Error('Invalid action determined');
}

/**
 * Determines the next action based on voting results
 * @param {Array} ideas - Array of objects with format {id, content, votos, autorId}
 * @returns {Object} Action to take and the selected or candidate ideas
 */
export function determinarAccionSiguiente(ideas) {
  // Group ideas by vote count
  const gruposPorVotos = agruparIdeasPorVotos(ideas);
  
  // Create an array with vote groups in descending order
  const gruposOrdenados = Object.entries(gruposPorVotos)
    .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
    .map(entry => ({
      votos: parseInt(entry[0]),
      ideas: entry[1]
    }));
  
  // Case 1: Exactly 3 ideas with the same highest vote count
  if (gruposOrdenados.length === 1 && gruposOrdenados[0].ideas.length === 3) {
    return {
      accion: 'FINALIZAR',
      ideasElegidas: gruposOrdenados[0].ideas.map(idea => idea.id)
    };
  }
  
  // Case 2: More than 3 ideas tied with the highest vote count
  if (gruposOrdenados.length === 1 && gruposOrdenados[0].ideas.length > 3) {
    return {
      accion: 'NUEVA_RONDA',
      ideasCandidatas: gruposOrdenados[0].ideas.map(idea => idea.id)
    };
  }
  
  // Case 3: Less than 3 ideas in the highest vote group
  if (gruposOrdenados[0].ideas.length < 3) {
    const ideasSeleccionadas = [...gruposOrdenados[0].ideas];
    let ideasRestantes = 3 - ideasSeleccionadas.length;
    
    // If we need more ideas and there are more vote groups
    if (ideasRestantes > 0 && gruposOrdenados.length > 1) {
      const segundoGrupo = gruposOrdenados[1].ideas;
      
      // Case 3.1: Exactly the right number of ideas in the second group
      if (segundoGrupo.length === ideasRestantes) {
        ideasSeleccionadas.push(...segundoGrupo);
        return {
          accion: 'FINALIZAR',
          ideasElegidas: ideasSeleccionadas.map(idea => idea.id)
        };
      }
      
      // Case 3.2: Too many ideas in the second group (need a tiebreaker)
      if (segundoGrupo.length > ideasRestantes) {
        return {
          accion: 'NUEVA_RONDA',
          ideasCandidatas: segundoGrupo.map(idea => idea.id)
        };
      }
      
      // Case 3.3: Not enough ideas in the second group, need to look at the third group
      ideasSeleccionadas.push(...segundoGrupo);
      ideasRestantes -= segundoGrupo.length;
      
      if (ideasRestantes > 0 && gruposOrdenados.length > 2) {
        const tercerGrupo = gruposOrdenados[2].ideas;
        
        // Case 3.3.1: Exactly the right number of ideas in the third group
        if (tercerGrupo.length === ideasRestantes) {
          ideasSeleccionadas.push(...tercerGrupo);
          return {
            accion: 'FINALIZAR',
            ideasElegidas: ideasSeleccionadas.map(idea => idea.id)
          };
        }
        
        // Case 3.3.2: Too many ideas in the third group (need a tiebreaker)
        if (tercerGrupo.length > ideasRestantes) {
          return {
            accion: 'NUEVA_RONDA',
            ideasCandidatas: tercerGrupo.map(idea => idea.id)
          };
        }
        
        // Case 3.3.3: Not enough ideas overall, just use what we have
        ideasSeleccionadas.push(...tercerGrupo);
      }
    }
    
    // If we have a complete set of 3 ideas, or we've used all available ideas
    if (ideasSeleccionadas.length === 3 || ideasSeleccionadas.length === ideas.length) {
      return {
        accion: 'FINALIZAR',
        ideasElegidas: ideasSeleccionadas.map(idea => idea.id)
      };
    }
  }
  
  // Default behavior: if no specific case matches, new voting round with all ideas
  return {
    accion: 'NUEVA_RONDA',
    ideasCandidatas: ideas.map(idea => idea.id)
  };
}

/**
 * Groups ideas by their vote count
 * @param {Array} ideas - Array of idea objects
 * @returns {Object} Object with vote counts as keys and arrays of ideas as values
 */
export function agruparIdeasPorVotos(ideas) {
  return ideas.reduce((grupos, idea) => {
    if (!grupos[idea.votos]) {
      grupos[idea.votos] = [];
    }
    grupos[idea.votos].push(idea);
    return grupos;
  }, {});
} 