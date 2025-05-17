import { useState, useEffect, useCallback } from 'react';
import { useSocket } from './useSocket';

// Types
interface Idea {
  id: string;
  content: string;
  authorId: string;
  votos?: number;
}

interface Session {
  id: string;
  status: string;
  currentRound: number;
}

interface VotingState {
  status: string;
  currentRound: number;
  ideasDisponibles: Idea[];
  ideasElegidas: Idea[];
  ideasCandidatas: Idea[];
  ideasFinales: Idea[];
  mensaje: string;
  isLoading: boolean;
  error: string | null;
}

/**
 * Custom hook para manejar la lógica de votación
 * @param sessionId - ID de la sesión actual
 * @param userId - ID del usuario actual
 * @param isOwner - Si el usuario es el propietario de la sesión
 */
export function useVotacion(sessionId: string, userId: string, isOwner: boolean) {
  const [state, setState] = useState<VotingState>({
    status: 'WAITING',
    currentRound: 1,
    ideasDisponibles: [],
    ideasElegidas: [],
    ideasCandidatas: [],
    ideasFinales: [],
    mensaje: '',
    isLoading: true,
    error: null
  });

  // Socket para eventos en tiempo real
  const { socket } = useSocket(sessionId, userId);

  // Cargar ideas disponibles para votar
  const cargarIdeas = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch(`/api/sessions/${sessionId}/ideas`);
      
      if (!response.ok) {
        throw new Error('Error al cargar las ideas');
      }

      const data = await response.json();
      
      setState(prev => ({ 
        ...prev, 
        ideasDisponibles: data.ideas,
        isLoading: false 
      }));
    } catch (e) {
      setState(prev => ({ 
        ...prev, 
        error: e instanceof Error ? e.message : 'Error desconocido', 
        isLoading: false 
      }));
    }
  }, [sessionId]);

  // Enviar votos del usuario
  const enviarVotos = useCallback(async (ideasSeleccionadas: string[]) => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Validar que sean exactamente 3 votos
      if (ideasSeleccionadas.length !== 3) {
        throw new Error('Debes seleccionar exactamente 3 ideas');
      }

      const response = await fetch(`/api/sessions/${sessionId}/votar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          ideaIds: ideasSeleccionadas,
          round: state.currentRound
        })
      });

      if (!response.ok) {
        throw new Error('Error al enviar los votos');
      }

      setState(prev => ({ 
        ...prev, 
        isLoading: false 
      }));

      return true;
    } catch (e) {
      setState(prev => ({ 
        ...prev, 
        error: e instanceof Error ? e.message : 'Error desconocido', 
        isLoading: false 
      }));
      return false;
    }
  }, [sessionId, userId, state.currentRound]);

  // Procesar votos (solo para el propietario)
  const procesarVotos = useCallback(async () => {
    try {
      if (!isOwner) {
        throw new Error('Solo el propietario puede procesar los votos');
      }

      setState(prev => ({ ...prev, isLoading: true, error: null }));

      const response = await fetch(`/api/sessions/${sessionId}/procesar-votos`, {
        method: 'POST'
      });

      if (!response.ok) {
        throw new Error('Error al procesar los votos');
      }

      const data = await response.json();
      
      return data;
    } catch (e) {
      setState(prev => ({ 
        ...prev, 
        error: e instanceof Error ? e.message : 'Error desconocido', 
        isLoading: false 
      }));
      return null;
    }
  }, [sessionId, isOwner]);

  // Escuchar eventos del socket
  useEffect(() => {
    if (!socket) return;

    // Escuchar resultados de votación
    const handleVotingResults = (data: any) => {
      if (data.action === 'FINALIZAR') {
        setState(prev => ({
          ...prev,
          status: 'FINISHED',
          ideasFinales: data.elegidas || [],
          mensaje: data.mensaje,
          isLoading: false
        }));
      } 
      else if (data.action === 'NUEVA_RONDA') {
        setState(prev => ({
          ...prev,
          status: 'REVOTING',
          currentRound: data.round,
          ideasElegidas: data.ideasElegidas || [],
          ideasCandidatas: data.ideasCandidatas || [],
          mensaje: data.mensaje,
          isLoading: false
        }));
      }
    };

    // Escuchar cuando un usuario envía un voto
    const handleVoteSubmitted = (data: { userId: string, timestamp: string }) => {
      console.log(`Usuario ${data.userId} ha votado en ${data.timestamp}`);
    };

    socket.on('voting-results', handleVotingResults);
    socket.on('vote-submitted', handleVoteSubmitted);

    return () => {
      socket.off('voting-results', handleVotingResults);
      socket.off('vote-submitted', handleVoteSubmitted);
    };
  }, [socket]);

  // Cargar estado inicial
  useEffect(() => {
    cargarIdeas();
  }, [cargarIdeas]);

  return {
    ...state,
    enviarVotos,
    ...(isOwner ? { procesarVotos } : {}),
    cargarIdeas
  };
} 