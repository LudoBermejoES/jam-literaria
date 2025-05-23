# JAM LITERARIA SERVER DOCUMENTATION

## 1. System Overview

Jam Literaria is a collaborative writing platform that enables real-time brainstorming, idea sharing, and voting. The server is built with Node.js and Express, using SQLite for data storage and Socket.IO for real-time communication.

## 2. Architecture

The application follows a layered architecture:

```
┌─────────────────┐
│  API Endpoints  │
└────────┬────────┘
         │
┌────────▼────────┐     ┌─────────────┐
│   Controllers   │◄────►  Socket.IO  │
└────────┬────────┘     └─────┬───────┘
         │                    │
┌────────▼────────┐     ┌─────▼───────┐
│    Services     │◄────► Socket Handlers
└────────┬────────┘     └─────────────┘
         │
┌────────▼────────┐
│     Models      │
└────────┬────────┘
         │
┌────────▼────────┐
│    Database     │
└─────────────────┘
```

## 3. Technology Stack

- **Runtime**: Node.js with ECMAScript Modules (ESM)
- **API Framework**: Express.js
- **Database**: SQLite (via node:sqlite)
- **Real-time Communication**: Socket.IO
- **Process Manager**: PM2
- **Authentication**: Session-based authentication

## 4. Database Schema

The database consists of 5 main tables:

### users
- `id` (TEXT): Primary key
- `name` (TEXT): User's display name
- `created_at` (TEXT): Timestamp of user creation
- `last_active` (TEXT): Timestamp of last activity

### sessions
- `id` (TEXT): Primary key
- `code` (TEXT): Unique session code for joining
- `status` (TEXT): Session status (WAITING, ACTIVE, FINISHED)
- `current_round` (INTEGER): Current voting round
- `owner_id` (TEXT): Reference to the session creator
- `created_at` / `updated_at` (TEXT): Timestamps

### session_participants
- Junction table for many-to-many relationship between users and sessions
- `session_id` (TEXT): Foreign key to sessions
- `user_id` (TEXT): Foreign key to users
- Primary key is (session_id, user_id)

### ideas
- `id` (TEXT): Primary key
- `content` (TEXT): The idea text content
- `author_id` (TEXT): Reference to the idea creator
- `session_id` (TEXT): Reference to the associated session
- `created_at` (TEXT): Timestamp of creation

### votes
- `id` (TEXT): Primary key
- `user_id` (TEXT): Reference to the voter
- `idea_id` (TEXT): Reference to the voted idea
- `session_id` (TEXT): Reference to the session
- `round` (INTEGER): The voting round
- `created_at` (TEXT): Timestamp of the vote
- Unique constraint on (user_id, idea_id, round, session_id)

### session_metadata
- Additional data for sessions
- `session_id` (TEXT): Primary key
- `ideas_elegidas` (TEXT): JSON array of chosen ideas
- `ideas_candidatas` (TEXT): JSON array of candidate ideas
- `mensaje_ronda` (TEXT): Round message
- `mensaje_final` (TEXT): Final message

## 5. API Endpoints

### Authentication

- `POST /api/auth/register`: Register a new user
- `GET /api/auth/me`: Get current authenticated user
- `POST /api/auth/logout`: Log out the current user

### Sessions

- `POST /api/sessions`: Create a new session
- `GET /api/sessions`: Get all available sessions
- `GET /api/sessions/:id`: Get a specific session by ID
- `GET /api/sessions/:id/status`: Get the current status of a session
- `POST /api/sessions/:id/join`: Join an existing session
- `POST /api/sessions/:id/start`: Start a session (owner only)

### Ideas

- `POST /api/sessions/:id/ideas`: Create a new idea in a session
- `GET /api/sessions/:id/ideas`: Get all ideas for a session
- `GET /api/sessions/:id/ideas/mine`: Get current user's ideas for a session
- `GET /api/sessions/:id/ideas/candidates`: Get candidate ideas for voting
- `GET /api/sessions/:id/ideas/winners`: Get winning ideas for a session

### Votes

- `POST /api/sessions/:id/votes`: Submit a vote
- `GET /api/sessions/:id/votes/status`: Get the voting status for a session
- `GET /api/sessions/:id/votes/results`: Get voting results for a session
- `GET /api/sessions/:id/votes/user`: Check if user has voted in current round

## 6. Authentication

The system uses session-based authentication:

1. User registers with a name via `/api/auth/register`
2. On successful registration, the user ID is stored in the session
3. Subsequent requests include this session cookie
4. The `authMiddleware` validates requests by checking:
   - If a user ID exists in the session
   - If the user exists in the database
   - Updates the user's last active timestamp

Additional middleware:
- `optionalAuthMiddleware`: Attaches user if authenticated but doesn't block unauthenticated requests
- `sessionOwnerMiddleware`: Ensures user is the owner of a session
- `sessionParticipantMiddleware`: Ensures user is a participant in a session

## 7. Real-time Communication

Socket.IO enables real-time updates through the following events:

### Session Events
- `session:join`: Join a specific session room
- `session:leave`: Leave a session room
- `session:status`: Receive updates on session status
- `session:participants`: Get real-time updates on session participants

### Idea Events
- `idea:new`: Receive notifications of new ideas
- `idea:list`: Get updates to the idea list
- `idea:candidates`: Receive candidate ideas for voting

### Vote Events
- `vote:submit`: Submit a vote
- `vote:status`: Receive updates on voting status
- `vote:results`: Get real-time voting results

## 8. Data Flow

### Session Flow
1. Owner creates a session (`POST /api/sessions`)
2. Participants join via session code (`POST /api/sessions/:id/join`)
3. Owner starts the session (`POST /api/sessions/:id/start`)
4. System transitions through phases (idea collection, voting, results)

### Idea Collection Phase
1. Users submit ideas (`POST /api/sessions/:id/ideas`)
2. Socket.IO broadcasts new ideas to all participants
3. When time expires or all users submit, system transitions to voting phase

### Voting Phase
1. System selects candidate ideas
2. Users submit votes (`POST /api/sessions/:id/votes`)
3. System collects votes until all participants vote or time expires
4. Results are calculated and broadcasted

## 9. Models

Models represent database entities and provide methods for interacting with the data:

### User
- Create, retrieve, update user information
- Track user activity
- Manage session participation

### Session
- Create, retrieve, update session information
- Manage session status and phases
- Track participants

### Idea
- Create, retrieve ideas
- Filter ideas by session, author
- Select candidate ideas for voting

### Vote
- Submit votes
- Track voting status
- Calculate voting results

## 10. Services

Services implement business logic on top of models:

### userService
- User creation and retrieval
- Session access validation

### sessionService
- Session creation, joining, starting
- Session phase management
- Session status tracking

### ideaService
- Idea creation and validation
- Idea selection for voting

### voteService
- Vote submission and validation
- Voting status tracking
- Result calculation

### votingService
- Advanced voting algorithms
- Vote result processing

## 11. Deployment

The application can be deployed in various environments:

### Development
- Run with PM2 in watch mode: `npm run dev`

### Production
- Set `NODE_ENV=production`
- Configure proper session secrets and database paths
- Start with PM2: `npm start`
- The server will serve the client build files in production mode

## 12. Error Handling

- API responses use a consistent format: `{ success: boolean, data?: any, error?: string }`
- Error middleware catches unhandled exceptions
- Detailed logging for debugging
- Graceful shutdown handling for SIGTERM and SIGINT signals

## 13. Security Considerations

- Sessions are HTTP-only with optional secure flag in production
- CORS is configured for proper client origin
- Input validation on all routes
- Authentication checks on sensitive operations
- Database uses foreign key constraints

## 14. Performance Considerations

- Synchronous SQLite operations for simplicity (could be a bottleneck at scale)
- In-memory session store (would need external store for multi-instance deployment)
- No connection pooling (SQLite limitation)

## 15. Known Issues and Limitations

- Double database initialization when starting the server (as seen in logs)
- Port 5000 conflicts - if the application fails to start with "address already in use", a previous instance might still be running. Use `pm2 list` to check and `pm2 delete app` to stop it
- SQLite is marked as an experimental feature in Node.js 