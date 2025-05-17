import { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { determinarAccionSiguiente, prepararNuevaRonda, finalizarSeleccion } from '../../lib/votacion';
import { io } from '../../index'; // Importing socket.io instance from main index file

export async function procesarVotos(req: Request, res: Response): Promise<Response> {
  const { id } = req.params;
  const sessionId = id;
  
  try {
    // Obtener sesión actual con ideas y votos
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: {
        ideas: true,
        votes: true
      }
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Sesión no encontrada' });
    }
    
    // Filtrar votos por ronda actual
    const votosRondaActual = session.votes.filter(
      vote => vote.round === session.currentRound
    );
    
    // Contar votos para cada idea en la ronda actual
    const ideasConVotos = session.ideas.map(idea => {
      const votos = votosRondaActual.filter(vote => vote.ideaId === idea.id).length;
      
      return {
        id: idea.id,
        content: idea.content,
        authorId: idea.authorId,
        votos
      };
    });
    
    // Determinar siguiente acción basada en los votos
    const resultado = determinarAccionSiguiente(ideasConVotos);
    
    // Actualizar estado de la sesión según el resultado
    let sessionActualizada;
    
    if (resultado.accion === 'FINALIZAR') {
      // Guardar las 3 ideas finales
      sessionActualizada = await prisma.session.update({
        where: { id: sessionId },
        data: {
          status: 'FINISHED',
          // Guardar IDs de ideas finales en un campo JSON
          metadata: {
            ideasFinales: resultado.elegidas?.map(idea => idea.id),
            mensajeFinal: resultado.mensaje
          }
        }
      });
      
      // Notificar a todos los participantes
      io.to(`session-${sessionId}`).emit('voting-results', {
        action: 'FINALIZAR',
        elegidas: resultado.elegidas,
        mensaje: resultado.mensaje
      });
    } 
    else if (resultado.accion === 'NUEVA_RONDA') {
      // Preparar nueva ronda de votación
      sessionActualizada = await prisma.session.update({
        where: { id: sessionId },
        data: {
          status: 'REVOTING',
          currentRound: { increment: 1 },
          // Guardar información de la ronda
          metadata: {
            ideasElegidas: resultado.elegidas?.map(idea => idea.id) || [],
            ideasCandidatas: resultado.candidatas?.map(idea => idea.id),
            mensajeRonda: resultado.mensaje
          }
        }
      });
      
      // Notificar nueva ronda
      io.to(`session-${sessionId}`).emit('voting-results', {
        action: 'NUEVA_RONDA',
        round: sessionActualizada.currentRound,
        ideasElegidas: resultado.elegidas || [],
        ideasCandidatas: resultado.candidatas,
        mensaje: resultado.mensaje
      });
    }
    else {
      // Caso de error
      return res.status(400).json({ 
        error: resultado.mensaje,
        details: "No se pudieron determinar las ideas ganadoras con el patrón de votos actual."
      });
    }
    
    return res.status(200).json({
      success: true,
      accion: resultado.accion,
      session: sessionActualizada
    });
    
  } catch (error) {
    console.error('Error al procesar votos:', error);
    return res.status(500).json({ error: 'Error al procesar los votos' });
  }
} 