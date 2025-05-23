-- Usuarios
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  last_active TEXT DEFAULT CURRENT_TIMESTAMP
) STRICT;

-- Sesiones
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  status TEXT DEFAULT 'WAITING',
  current_round INTEGER DEFAULT 0,
  owner_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (owner_id) REFERENCES users(id)
) STRICT;

-- Relación Usuarios-Sesiones (para participantes)
CREATE TABLE IF NOT EXISTS session_participants (
  session_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  PRIMARY KEY (session_id, user_id),
  FOREIGN KEY (session_id) REFERENCES sessions(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
) STRICT;

-- Ideas
CREATE TABLE IF NOT EXISTS ideas (
  id TEXT PRIMARY KEY,
  content TEXT NOT NULL,
  author_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users(id),
  FOREIGN KEY (session_id) REFERENCES sessions(id)
) STRICT;

-- Votos
CREATE TABLE IF NOT EXISTS votes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  idea_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  round INTEGER NOT NULL,
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, idea_id, round, session_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (idea_id) REFERENCES ideas(id),
  FOREIGN KEY (session_id) REFERENCES sessions(id)
) STRICT;

-- Sesión Metadata (para almacenar información adicional de sesión)
CREATE TABLE IF NOT EXISTS session_metadata (
  session_id TEXT PRIMARY KEY,
  ideas_elegidas TEXT, -- JSON array of idea IDs
  ideas_candidatas TEXT, -- JSON array of idea IDs
  mensaje_ronda TEXT,
  mensaje_final TEXT,
  required_votes INTEGER, -- Number of votes required for current round
  FOREIGN KEY (session_id) REFERENCES sessions(id)
) STRICT; 