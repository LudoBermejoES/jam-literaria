# Architecture Documentation

## System Overview

Jam Literaria is a real-time collaborative brainstorming platform built with a modern client-server architecture using WebSocket communication for real-time updates.

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React Client  │────│   Express API   │────│   SQLite DB     │
│   (Frontend)    │    │   (Backend)     │    │   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         └───────────────────────┘
              Socket.io
           (Real-time Events)
```

## Technology Stack

### Backend
- **Runtime**: Node.js 22+ with ES Modules
- **Framework**: Express.js 4.18+
- **Real-time**: Socket.IO 4.7+
- **Database**: SQLite 5.0+ (embedded, ACID-compliant)
- **Process Manager**: PM2 (production)
- **Authentication**: express-session with cookie-parser
- **Security**: CORS, secure cookies, session management

### Frontend
- **UI Library**: React 19.1+ (latest features)
- **Build Tool**: Vite 6.3+ (fast HMR, optimized builds)
- **Routing**: React Router DOM 7.6+
- **Real-time Client**: Socket.IO Client 4.8+
- **HTTP Client**: Axios 1.9+
- **i18n**: react-i18next 15.5+ (English/Spanish support)
- **State Management**: React Context API

## Project Structure

```
jam-literaria/
├── server/                    # Backend Node.js application
│   ├── api/                  # REST API layer
│   │   ├── controllers/      # Business logic controllers
│   │   │   ├── authController.js
│   │   │   ├── sessionController.js
│   │   │   ├── ideaController.js
│   │   │   └── voteController.js
│   │   ├── middleware/       # Express middleware
│   │   │   └── auth.js
│   │   └── routes/          # API route definitions
│   │       ├── auth.js
│   │       ├── sessions.js
│   │       ├── ideas.js
│   │       └── votes.js
│   ├── socket/              # Socket.IO event handlers
│   │   ├── index.js         # Socket server setup
│   │   ├── io.js            # Socket.IO initialization
│   │   ├── sessionHandlers.js
│   │   ├── ideaHandlers.js
│   │   └── voteHandlers.js
│   ├── models/              # Database models & ORM
│   │   ├── db.js            # Database connection
│   │   ├── User.js
│   │   ├── Session.js
│   │   ├── Idea.js
│   │   └── Vote.js
│   ├── services/            # Business logic services
│   │   ├── userService.js
│   │   ├── sessionService.js
│   │   ├── ideaService.js
│   │   ├── voteService.js
│   │   └── votingService.js  # Core voting algorithm
│   ├── scripts/             # Utility scripts
│   │   └── reset-db.js
│   └── app.js              # Main server entry point
│
├── app/                     # Frontend React application
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── common/      # Reusable UI components
│   │   │   │   ├── Button.jsx
│   │   │   │   ├── TextArea.jsx
│   │   │   │   └── LoadingSpinner.jsx
│   │   │   ├── VotingScreen.jsx
│   │   │   ├── ResultsScreen.jsx
│   │   │   ├── VoteCountingScreen.jsx
│   │   │   ├── IdeaSubmission.jsx
│   │   │   ├── PostIdeasWaiting.jsx
│   │   │   └── ProtectedRoute.jsx
│   │   ├── pages/          # Page components
│   │   │   ├── Login.jsx
│   │   │   ├── Home.jsx
│   │   │   ├── Session.jsx
│   │   │   └── JoinSession.jsx
│   │   ├── context/        # React Context providers
│   │   │   ├── AuthContext.jsx
│   │   │   └── SocketContext.jsx
│   │   ├── services/       # API communication layer
│   │   │   ├── api.js
│   │   │   └── socketService.js
│   │   ├── i18n/           # Internationalization
│   │   │   ├── index.js
│   │   │   └── locales/
│   │   │       ├── en.json
│   │   │       └── es.json
│   │   ├── styles/         # CSS stylesheets
│   │   ├── App.jsx         # Main app component
│   │   └── main.jsx        # Entry point
│   └── public/             # Static assets
│
├── database/               # Database files
│   ├── schema.sql         # Database schema definition
│   └── jam_literaria.db   # SQLite database file
│
└── docs/                  # Documentation
    └── (this folder)
```

## Core Components

### 1. Backend Server (server/app.js)

**Responsibilities:**
- Initialize Express application
- Configure middleware (CORS, sessions, cookies)
- Set up REST API routes
- Initialize Socket.IO server
- Manage database connection
- Handle graceful shutdown

**Key Middleware:**
- `cors()` - Cross-origin resource sharing
- `express.json()` - JSON body parsing
- `express-session` - Session management
- `cookieParser()` - Cookie parsing

**Configuration:**
- Environment-based settings via `.env`
- Trust proxy in production for HTTPS
- Secure cookies in production
- 24-hour session lifetime

### 2. Database Layer (server/models/)

**Pattern**: Active Record pattern with static methods

**Models:**
- `User` - User account management
- `Session` - Session lifecycle and metadata
- `Idea` - Idea storage and retrieval
- `Vote` - Vote tracking across rounds

**Features:**
- Prepared statements for SQL injection protection
- Transaction support for atomic operations
- JSON serialization for metadata
- Automatic timestamp management

### 3. Service Layer (server/services/)

**Purpose**: Encapsulate business logic separate from HTTP/WebSocket handlers

**Services:**
- `userService` - User creation, validation, activity tracking
- `sessionService` - Session CRUD, participant management, status updates
- `ideaService` - Idea submission, retrieval, validation
- `voteService` - Vote submission, counting, status tracking
- `votingService` - **Core voting algorithm and tiebreaker logic**

**Benefits:**
- Reusable across REST and WebSocket handlers
- Centralized validation
- Easier testing
- Clear separation of concerns

### 4. Real-time Communication (server/socket/)

**Architecture:**
- Socket.IO server with authentication middleware
- Room-based message broadcasting (`session:${sessionId}`)
- Event-driven architecture
- User authentication on handshake

**Event Categories:**
- Session events (join, leave, start)
- Idea events (submit, get)
- Vote events (submit, status, results)

**See [SOCKET_EVENTS.md](./SOCKET_EVENTS.md) for detailed event documentation**

### 5. Frontend Application (app/src/)

**Architecture**: Component-based with React hooks and Context API

**Key Patterns:**
- **Context Providers**: AuthContext, SocketContext for global state
- **Protected Routes**: Authentication-gated pages
- **Real-time Updates**: Socket event listeners in useEffect hooks
- **Optimistic UI**: Immediate feedback before server confirmation

**State Management:**
- Local state with `useState` for component-specific data
- Context API for global state (user, socket)
- No external state management library (Redux, etc.)

**Routing Strategy:**
- Client-side routing with React Router
- Protected routes require authentication
- Dynamic session-based routes (`/session/:sessionId/*`)

## Data Flow Examples

### Creating and Joining a Session

```
User (Client)                Server                    Database
     |                          |                          |
     |--POST /api/auth/login--> |                          |
     |                          |--INSERT INTO users-----> |
     |<----{user}-------------- |<---user------------------|
     |                          |                          |
     |--POST /api/sessions----> |                          |
     |                          |--INSERT INTO sessions--> |
     |                          |--INSERT participants---> |
     |<----{session}----------- |<---session---------------|
     |                          |                          |
     |--emit('join-session')--> |                          |
     |                          |--JOIN room-------------> |
     |                          |--SELECT session/users--> |
     |<--emit('session-state')- |<---session data----------|
     |                          |                          |
```

### Voting Flow with Tiebreaker

```
User (Client)                Server                    Database
     |                          |                          |
     |--emit('submit-votes')--> |                          |
     |                          |--Validate session------> |
     |                          |--Check if voted--------> |
     |                          |--INSERT votes----------> |
     |<--emit('vote-confirmed') |                          |
     |                          |                          |
     |                          |--Check if round done---> |
     |                          |--Process results-------> |
     |                          |--determineAction()-----> |
     |                          |                          |
     |                (if ties) |--UPDATE metadata-------> |
     |                          |--UPDATE current_round--> |
     |<--emit('new-voting-round)|                          |
     |   {candidates,           |                          |
     |    requiredVotes}        |                          |
     |                          |                          |
```

## Security Architecture

### Authentication
- Session-based authentication (not JWT)
- HTTP-only cookies prevent XSS attacks
- Secure flag in production (HTTPS only)
- SameSite cookie attribute for CSRF protection

### Authorization
- Socket authentication middleware validates user on connect
- User-session access validation before operations
- Owner-only operations (start session, delete, etc.)
- Vote validation prevents double voting

### Input Validation
- Server-side validation for all inputs
- Prepared SQL statements prevent injection
- Type checking with database STRICT mode
- Rate limiting potential (not implemented)

### Data Privacy
- Anonymous voting (ideas shown without authors)
- Admin can see authors for moderation
- Vote details hidden from participants
- Session isolation (users can't access other sessions)

## Scalability Considerations

### Current Limitations (SQLite)
- Single file database
- Write serialization (one writer at a time)
- Limited concurrent connections
- No built-in replication

### Scaling Path
1. **Horizontal scaling**: Redis for session state
2. **Database migration**: PostgreSQL for production
3. **Load balancing**: Nginx for multiple server instances
4. **WebSocket clustering**: Socket.IO Redis adapter
5. **CDN**: Static asset delivery
6. **Caching**: Redis for frequently accessed data

### Performance Optimizations
- Database indexes on foreign keys
- Connection pooling (when migrating to PostgreSQL)
- Efficient SQL queries with JOINs
- Client-side caching of session data
- Optimistic UI updates

## Deployment Architecture

### Development
```
localhost:5173 (Vite dev server)
      ↓
localhost:5000 (Express + Socket.IO)
      ↓
./database/jam_literaria.db
```

### Production
```
nginx (reverse proxy)
  ↓
  ├─→ Static files (/var/www/jam-client)
  └─→ API + WebSocket (/var/www/jam-server)
       ↓
       PM2 (process manager)
         ↓
         Node.js server
           ↓
           SQLite database
```

**Production Configuration:**
- Nginx handles SSL/TLS termination
- PM2 manages Node.js process (auto-restart, clustering)
- Static files served by Nginx (not Node.js)
- Environment-specific configuration via `.env`

## Error Handling Strategy

### Backend
- Try-catch blocks in all async operations
- Centralized error handling middleware
- Error logging to console (production: use logging service)
- Graceful degradation for database errors

### Frontend
- Error boundaries for React component errors
- Socket error event handlers
- User-friendly error messages
- Fallback UI for error states

### Real-time Communication
- Connection error handling
- Automatic reconnection (Socket.IO built-in)
- State recovery after reconnection
- Timeout handling for long operations

## Monitoring and Observability

### Current Implementation
- Console logging for events and errors
- PM2 status monitoring
- Socket connection/disconnection logging

### Recommended Additions
- Application Performance Monitoring (APM)
- Error tracking (Sentry, Rollbar)
- User analytics
- Database query performance monitoring
- Real-time dashboard for active sessions

## Future Architecture Improvements

1. **Microservices**: Separate voting service, session service
2. **Message Queue**: RabbitMQ/Kafka for asynchronous processing
3. **GraphQL**: Consider GraphQL for flexible API queries
4. **TypeScript**: Type safety across codebase
5. **Testing**: Comprehensive unit, integration, e2e tests
6. **CI/CD Pipeline**: Automated testing and deployment
7. **Containerization**: Docker for consistent deployments
8. **Kubernetes**: Orchestration for production scaling
