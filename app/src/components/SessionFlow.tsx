import React, { useState, useEffect } from 'react';
import useAuth from '../hooks/useAuth';
import useSession from '../hooks/useSession';

export const SessionFlow: React.FC = () => {
  const { user, session, registerUser, createSession, joinSession } = useAuth();
  const [view, setView] = useState<'welcome' | 'create' | 'join' | 'session'>('welcome');
  const [name, setName] = useState('');
  const [sessionCode, setSessionCode] = useState('');

  // If we have a session, load the session view
  useEffect(() => {
    if (session) {
      setView('session');
    }
  }, [session]);

  // Placeholder session view component
  const SessionView = () => {
    if (!session || !user) return null;

    const isOwner = session.ownerId === user.id;
    const {
      session: sessionData,
      isLoading,
      error,
      startSession,
      startVoting,
    } = useSession(session.id, user.id, isOwner);

    if (isLoading) return <div>Loading session...</div>;
    if (error) return <div>Error: {error}</div>;
    if (!sessionData) return <div>Session not found</div>;

    // Waiting room view
    if (sessionData.status === 'WAITING') {
      return (
        <div>
          <h2>Waiting Room</h2>
          <p>Código de sesión: {sessionData.code}</p>
          <p>Comparte este código o enlace con los participantes.</p>

          <h3>Participantes</h3>
          <ul>
            {sessionData.participants?.map((participant) => (
              <li key={participant.id}>{participant.name}</li>
            ))}
          </ul>

          {isOwner && (
            <button
              onClick={() => startSession && startSession()}
              disabled={!startSession || (sessionData.participants?.length || 0) < 2}
            >
              Iniciar Sesión
            </button>
          )}
        </div>
      );
    }

    // Ideas collection view
    if (sessionData.status === 'COLLECTING_IDEAS') {
      return (
        <div>
          <h2>Envía tus ideas</h2>
          <form onSubmit={(e) => e.preventDefault()}>
            <div>
              <input placeholder="Escribe tu idea aquí" aria-label="Idea 1" />
            </div>
            <div>
              <input placeholder="Escribe tu idea aquí" aria-label="Idea 2" />
            </div>
            <div>
              <input placeholder="Escribe tu idea aquí" aria-label="Idea 3" />
            </div>
            <button type="submit">Enviar Ideas</button>
          </form>

          {isOwner && (
            <div>
              <h3>Participantes que han enviado ideas</h3>
              <button onClick={() => startVoting && startVoting()}>Iniciar Votación</button>
            </div>
          )}
        </div>
      );
    }

    // Voting view
    if (sessionData.status === 'VOTING') {
      return (
        <div>
          <h2>Selecciona tres ideas</h2>
          <div>
            {sessionData.ideas?.map((idea) => (
              <div key={idea.id} data-testid="idea-card">
                <p>{idea.content}</p>
                <button>Seleccionar</button>
              </div>
            ))}
          </div>
          <button>Enviar Votación</button>

          {isOwner && (
            <div>
              <h3>Estado de la votación</h3>
            </div>
          )}
        </div>
      );
    }

    // Results view
    if (sessionData.status === 'FINISHED') {
      // Access the ideas from the correct property
      const selectedIdeas = (sessionData as any).ideasElegidas || [];

      return (
        <div>
          <h2>Ideas Seleccionadas</h2>
          <div>
            {selectedIdeas.map((idea: any) => (
              <div key={idea.id}>
                <p>{idea.content}</p>
                {idea.votos !== undefined && <span>{idea.votos} votos</span>}
              </div>
            ))}
          </div>
        </div>
      );
    }

    return <div>Sesión: {sessionData.status}</div>;
  };

  // Welcome view
  if (view === 'welcome' && user) {
    return (
      <div>
        <h1>¡Hola, {user.name}!</h1>
        <p>¿Qué te gustaría hacer?</p>
        <button onClick={() => createSession()}>Crear una nueva sesión</button>
        <button onClick={() => setView('join')}>Unirse a una sesión existente</button>
      </div>
    );
  }

  // Initial name input view
  if (!user) {
    return (
      <div>
        <h1>¡Bienvenido a la Jam Literaria!</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            registerUser(name.trim());
          }}
        >
          <div>
            <label htmlFor="name">Tu nombre</label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Escribe tu nombre aquí"
            />
          </div>
          <button type="submit">Continuar</button>
        </form>
      </div>
    );
  }

  // Join session view
  if (view === 'join') {
    return (
      <div>
        <h1>Unirse a una sesión</h1>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            joinSession(sessionCode.trim());
          }}
        >
          <div>
            <label htmlFor="sessionCode">Código de sesión</label>
            <input
              id="sessionCode"
              value={sessionCode}
              onChange={(e) => setSessionCode(e.target.value)}
              placeholder="Introduce el código de la sesión"
            />
          </div>
          <button type="submit">Unirse</button>
          <button type="button" onClick={() => setView('welcome')}>
            Volver
          </button>
        </form>
      </div>
    );
  }

  // Session view (once we have a session)
  return <SessionView />;
};
