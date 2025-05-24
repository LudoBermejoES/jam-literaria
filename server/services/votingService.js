import { Idea } from '../models/Idea.js';
import { Vote } from '../models/Vote.js';
import { Session, SESSION_STATUS } from '../models/Session.js';

/**
 * Calculate how many votes are required based on the number of ideas
 * @param {number} ideaCount - Number of ideas available
 * @returns {number} Number of votes required
 */
export function calculateRequiredVotes(ideaCount) {
  if (ideaCount >= 4) {
    return 3; // Normal voting: choose 3 out of many
  } else if (ideaCount === 3) {
    return 2; // Tiebreaker: choose 2 out of 3
  } else if (ideaCount === 2) {
    return 1; // Final tiebreaker: choose 1 out of 2
  } else {
    return 0; // No voting needed if only 1 idea
  }
}

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
  
  // Get current accumulated winners from session metadata
  const currentMetadata = Session.getSessionMetadata(sessionId);
  const accumulatedWinners = currentMetadata?.ideas_elegidas || [];
  
  // Transform vote results into the expected format
  const ideas = voteResults.map(result => ({
    id: result.idea_id,
    content: result.content,
    votos: result.vote_count,
    autorId: result.author_id
  }));
  
  // Process the vote results to determine the next action
  const action = determinarAccionSiguiente(ideas, accumulatedWinners.length);
  
  // Update the session metadata based on the action
  if (action.accion === 'FINALIZAR') {
    // Add the newly selected ideas to accumulated winners
    const newWinners = [...accumulatedWinners, ...action.ideasElegidas];
    
    // Get the ideas that were selected
    const selectedIdeas = Idea.getIdeasByIds(newWinners);
    
    // Update session status and metadata
    Session.updateSessionStatus(sessionId, SESSION_STATUS.COMPLETED);
    Session.updateSessionMetadata(sessionId, {
      ideas_elegidas: newWinners,
      mensaje_final: 'Las ideas ganadoras han sido seleccionadas'
    });
    
    return {
      action: 'COMPLETE',
      selectedIdeas,
      message: 'Las ideas ganadoras han sido seleccionadas'
    };
  } else if (action.accion === 'AGREGAR_GANADORES') {
    // Add winners from this round and continue to next round
    const newWinners = [...accumulatedWinners, ...action.ideasElegidas];
    
    // Prepare for a new voting round with remaining candidates
    const candidateIdeas = Idea.getIdeasByIds(action.ideasCandidatas);
    const newRound = round + 1;
    
    // Calculate how many votes are needed for this new round
    // Limited by remaining slots needed
    const remainingSlots = 3 - newWinners.length;
    const calculatedVotes = calculateRequiredVotes(candidateIdeas.length);
    const requiredVotes = Math.min(calculatedVotes, remainingSlots);
    
    console.log(`New round calculation: ${candidateIdeas.length} candidates, ${calculatedVotes} calculated votes, ${remainingSlots} remaining slots, final: ${requiredVotes}`);
    
    // Update session round and metadata
    Session.updateSessionRound(sessionId, newRound);
    Session.updateSessionMetadata(sessionId, {
      ideas_elegidas: newWinners, // Store accumulated winners
      ideas_candidatas: action.ideasCandidatas,
      mensaje_ronda: `Ronda ${newRound} de votación para desempate`,
      required_votes: requiredVotes
    });
    
    return {
      action: 'NEW_ROUND',
      round: newRound,
      candidateIdeas,
      requiredVotes,
      accumulatedWinners: newWinners, // Send accumulated winners to frontend
      message: `Ronda ${newRound} de votación para desempate`
    };
  } else if (action.accion === 'NUEVA_RONDA') {
    // Prepare for a new voting round (tiebreaker)
    const candidateIdeas = Idea.getIdeasByIds(action.ideasCandidatas);
    const newRound = round + 1;
    
    // Calculate how many votes are needed for this new round
    // Limited by remaining slots needed
    const remainingSlots = 3 - accumulatedWinners.length;
    const calculatedVotes = calculateRequiredVotes(candidateIdeas.length);
    const requiredVotes = Math.min(calculatedVotes, remainingSlots);
    
    console.log(`Tiebreaker round calculation: ${candidateIdeas.length} candidates, ${calculatedVotes} calculated votes, ${remainingSlots} remaining slots, final: ${requiredVotes}`);
    
    // Update session round and metadata
    Session.updateSessionRound(sessionId, newRound);
    Session.updateSessionMetadata(sessionId, {
      ideas_elegidas: accumulatedWinners, // Keep accumulated winners
      ideas_candidatas: action.ideasCandidatas,
      mensaje_ronda: `Ronda ${newRound} de votación para desempate`,
      required_votes: requiredVotes
    });
    
    return {
      action: 'NEW_ROUND',
      round: newRound,
      candidateIdeas,
      requiredVotes,
      accumulatedWinners, // Send accumulated winners to frontend
      message: `Ronda ${newRound} de votación para desempate`
    };
  }
  
  throw new Error('Invalid action determined');
}

/**
 * Determines the next action based on voting results
 * @param {Array} ideas - Array of objects with format {id, content, votos, autorId}
 * @param {number} currentWinnerCount - Number of winners already selected in previous rounds
 * @returns {Object} Action to take and the selected or candidate ideas
 */
export function determinarAccionSiguiente(ideas, currentWinnerCount = 0) {
  const remainingSlots = 3 - currentWinnerCount;
  
  // If we already have 3 winners, we shouldn't be here
  if (remainingSlots <= 0) {
    return {
      accion: 'FINALIZAR',
      ideasElegidas: []
    };
  }
  
  // Group ideas by vote count
  const gruposPorVotos = agruparIdeasPorVotos(ideas);
  
  // Create an array with vote groups in descending order
  const gruposOrdenados = Object.entries(gruposPorVotos)
    .sort((a, b) => parseInt(b[0]) - parseInt(a[0]))
    .map(entry => ({
      votos: parseInt(entry[0]),
      ideas: entry[1]
    }));
  
  console.log(`Determining action: ${remainingSlots} slots remaining, vote groups:`, 
    gruposOrdenados.map(g => `${g.votos} votes: ${g.ideas.length} ideas`));
  
  // Strategy: Try to select clear winners first, then handle ties
  const clearWinners = [];
  const tiedCandidates = [];
  let slotsToFill = remainingSlots;
  
  for (let i = 0; i < gruposOrdenados.length; i++) {
    const grupo = gruposOrdenados[i];
    
    if (slotsToFill <= 0) break;
    
    // Check if this group can fit entirely in remaining slots
    if (grupo.ideas.length <= slotsToFill) {
      // This entire group are clear winners
      clearWinners.push(...grupo.ideas);
      slotsToFill -= grupo.ideas.length;
      console.log(`Selected ${grupo.ideas.length} clear winners with ${grupo.votos} votes each`);
    } else {
      // This group has more ideas than remaining slots - they are tied candidates
      tiedCandidates.push(...grupo.ideas);
      console.log(`Found ${grupo.ideas.length} tied candidates with ${grupo.votos} votes each for ${slotsToFill} remaining slots`);
      break; // No need to check lower vote groups
    }
  }
  
  // Decision logic based on what we found
  if (clearWinners.length > 0 && tiedCandidates.length > 0) {
    // We have some clear winners and some tied candidates
    console.log(`AGREGAR_GANADORES: ${clearWinners.length} winners, ${tiedCandidates.length} candidates for ${slotsToFill} slots`);
    return {
      accion: 'AGREGAR_GANADORES',
      ideasElegidas: clearWinners.map(idea => idea.id),
      ideasCandidatas: tiedCandidates.map(idea => idea.id)
    };
  } else if (clearWinners.length > 0 && tiedCandidates.length === 0) {
    // We have clear winners and no ties - we're done
    console.log(`FINALIZAR: ${clearWinners.length} clear winners selected`);
    return {
      accion: 'FINALIZAR',
      ideasElegidas: clearWinners.map(idea => idea.id)
    };
  } else if (clearWinners.length === 0 && tiedCandidates.length > 0) {
    // All remaining ideas are tied - need a tiebreaker round
    console.log(`NUEVA_RONDA: ${tiedCandidates.length} tied candidates need tiebreaker`);
    return {
      accion: 'NUEVA_RONDA',
      ideasCandidatas: tiedCandidates.map(idea => idea.id)
    };
  } else {
    // Edge case: no clear winners and no candidates (shouldn't happen)
    console.log(`Edge case: no winners or candidates found, finalizing with all ideas`);
    return {
      accion: 'FINALIZAR',
      ideasElegidas: ideas.slice(0, remainingSlots).map(idea => idea.id)
    };
  }
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