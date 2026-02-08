# Socket.IO Events Documentation

## Overview

Real-time communication in Jam Literaria is powered by Socket.IO, enabling bidirectional event-based communication between the server and clients.

**Server Configuration**: [server/socket/index.js](../server/socket/index.js)
**Client Configuration**: [app/src/context/SocketContext.jsx](../app/src/context/SocketContext.jsx)

## Connection Architecture

```
Client (React)                    Server (Node.js)
     |                                   |
     |--WebSocket Handshake------------>|
     |   (auth: {userId})                |
     |                                   |
     |<--Authentication Check------------|
     |   (validate user exists)          |
     |                                   |
     |--Connection Established---------->|
     |                                   |
     |--join-session------------------>  |
     |   {sessionId}                     |
     |                                   |
     |   socket.join('session:ABC123')   |
     |                                   |
     |<--session-state------------------ |
     |   {session, participants, ...}    |
```

## Socket Server Configuration

**File**: [server/socket/index.js](../server/socket/index.js:12-71)

### Initialization

```javascript
export function setupSocketServer(httpServer) {
  const io = initSocketIO(httpServer, {
    cors: {
      origin: ['http://localhost:3000', 'http://localhost:5173'],
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  // Authentication middleware
  io.use((socket, next) => {
    const userId = socket.handshake.auth.userId;

    if (!userId) {
      return next(new Error('Authentication error'));
    }

    const user = userService.getUserById(userId);
    if (!user) {
      return next(new Error('Invalid user'));
    }

    socket.userId = userId;
    socket.user = user;
    return next();
  });

  // Connection handler
  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.userId}`);

    sessionHandlers(io, socket);
    ideaHandlers(io, socket);
    voteHandlers(io, socket);

    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.userId}`);
    });
  });

  return io;
}
```

### Key Features

1. **Authentication Middleware**: Validates user before allowing connection
2. **User Attachment**: `socket.userId` and `socket.user` available in all handlers
3. **Room-Based Broadcasting**: `io.to('session:ABC123').emit(...)`
4. **Auto-Reconnection**: Socket.IO client handles reconnection automatically

## Socket Client Configuration

**File**: [app/src/context/SocketContext.jsx](../app/src/context/SocketContext.jsx)

### Initialization

```javascript
const socket = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: true,
  auth: {
    userId: user.id
  }
});

socket.on('connect', () => {
  console.log('Socket connected successfully');
});

socket.on('connect_error', (error) => {
  console.error('Socket connection error:', error);
});
```

### Usage in Components

```javascript
import { useContext } from 'react';
import { SocketContext } from '../context/SocketContext';

function MyComponent() {
  const { socket } = useContext(SocketContext);

  useEffect(() => {
    socket.emit('join-session', { sessionId });

    socket.on('session-state', (data) => {
      // Handle session update
    });

    return () => {
      socket.off('session-state');
    };
  }, [socket, sessionId]);
}
```

---

## Event Categories

### 1. Session Events
### 2. Idea Events
### 3. Vote Events

---

## 1. Session Events

**Handler File**: [server/socket/sessionHandlers.js](../server/socket/sessionHandlers.js)

### join-session

**Direction**: Client → Server

**Emitted By**: All components when entering session view

**Payload**:
```javascript
{
  sessionId: 'uuid-string'
}
```

**Server Actions**:
1. Validate session exists
2. Verify user is participant
3. Join Socket.IO room: `session:${sessionId}`
4. Update user's last active time
5. Broadcast user-joined to other participants
6. Send session-state to requesting user

**Responds With**: `session-state` (to requester), `user-joined` (to others)

**Example**:
```javascript
// Client
socket.emit('join-session', { sessionId: 'abc-123' });

// Server response
socket.on('session-state', (data) => {
  console.log('Session:', data.session);
  console.log('Participants:', data.participants);
  console.log('Max ideas per user:', data.maxIdeasPerUser);
});
```

**Error Cases**:
- Session not found → `error` event
- User not participant → `error` event

---

### leave-session

**Direction**: Client → Server

**Emitted By**: Components on unmount or navigation away

**Payload**:
```javascript
{
  sessionId: 'uuid-string'
}
```

**Server Actions**:
1. Remove socket from room
2. Broadcast user-left to remaining participants

**Responds With**: `user-left` (to others)

**Example**:
```javascript
// Client (cleanup)
return () => {
  socket.emit('leave-session', { sessionId });
};
```

---

### start-session

**Direction**: Client → Server

**Emitted By**: Session owner clicking "Start Session" button

**Payload**:
```javascript
{
  sessionId: 'uuid-string'
}
```

**Server Actions**:
1. Verify user is session owner
2. Check ≥2 participants
3. Update session status to `SUBMITTING_IDEAS`
4. Broadcast session-started to all participants

**Responds With**: `session-started` (to all in room)

**Example**:
```javascript
// Client (owner only)
socket.emit('start-session', { sessionId });

// All clients receive
socket.on('session-started', (data) => {
  navigate(`/session/${sessionId}/ideas`);
});
```

**Error Cases**:
- Not session owner → `error`
- Less than 2 participants → `error`
- Session already started → `error`

---

### start-ideation

**Direction**: Client → Server

**Emitted By**: Session owner (if needed to manually restart ideation)

**Payload**:
```javascript
{
  sessionId: 'uuid-string'
}
```

**Server Actions**:
1. Verify user is owner
2. Update session status to `SUBMITTING_IDEAS`
3. Broadcast ideation-started to all

**Responds With**: `ideation-started` (to all)

---

### start-voting

**Direction**: Client → Server

**Emitted By**: Session owner clicking "Start Voting" button

**Payload**:
```javascript
{
  sessionId: 'uuid-string'
}
```

**Server Actions**:
1. Verify user is owner
2. Get all session ideas
3. Calculate required votes for first round
4. Update session status to `VOTING`
5. Store required_votes in metadata
6. Broadcast voting-started with ideas

**Responds With**: `voting-started` (to all)

**Example**:
```javascript
// Client (owner)
socket.emit('start-voting', { sessionId });

// All clients receive
socket.on('voting-started', (data) => {
  console.log('Ideas to vote on:', data.ideas);
  console.log('Required votes:', data.requiredVotes);
  navigate(`/session/${sessionId}/voting`);
});
```

---

### session-state

**Direction**: Server → Client

**Emitted By**: Server in response to join-session or status changes

**Payload**:
```javascript
{
  id: 'session-uuid',
  code: 'ABC123',
  status: 'WAITING' | 'SUBMITTING_IDEAS' | 'VOTING' | 'COMPLETED',
  current_round: 0,
  owner_id: 'user-uuid',
  participants: [
    { id: 'user-uuid', name: 'John Doe' },
    // ...
  ],
  metadata: {
    ideas_elegidas: ['id1', 'id2'],
    ideas_candidatas: ['id3', 'id4'],
    required_votes: 2
  },
  maxIdeasPerUser: 3
}
```

**Received By**: Single client (targeted)

**Usage**: Initialize component state on mount

---

### user-joined

**Direction**: Server → Clients

**Emitted By**: Server when user joins session room

**Payload**:
```javascript
{
  userId: 'user-uuid',
  userName: 'John Doe'
}
```

**Received By**: All participants except the one who joined

**Usage**: Update participant list UI

**Example**:
```javascript
socket.on('user-joined', (data) => {
  setParticipants(prev => [...prev, { id: data.userId, name: data.userName }]);
  toast.success(`${data.userName} joined the session`);
});
```

---

### user-left

**Direction**: Server → Clients

**Emitted By**: Server when user leaves session room

**Payload**:
```javascript
{
  userId: 'user-uuid',
  userName: 'John Doe'
}
```

**Received By**: All remaining participants

**Usage**: Update participant list UI

**Example**:
```javascript
socket.on('user-left', (data) => {
  setParticipants(prev => prev.filter(p => p.id !== data.userId));
  toast.info(`${data.userName} left the session`);
});
```

---

### session-started

**Direction**: Server → Clients

**Emitted By**: Server when owner starts session

**Payload**:
```javascript
{
  session: { /* full session object */ },
  maxIdeasPerUser: 3
}
```

**Received By**: All participants in room

**Usage**: Navigate to idea submission screen

---

### ideation-started

**Direction**: Server → Clients

**Emitted By**: Server when ideation phase begins

**Payload**:
```javascript
{
  session: { /* session with status: 'SUBMITTING_IDEAS' */ },
  maxIdeasPerUser: 3
}
```

**Received By**: All participants

---

### voting-started

**Direction**: Server → Clients

**Emitted By**: Server when voting phase begins

**Payload**:
```javascript
{
  session: { /* session with status: 'VOTING' */ },
  ideas: [
    { id: 'uuid', content: 'Idea text', author_id: 'uuid', author_name: 'John' },
    // ...
  ],
  requiredVotes: 3
}
```

**Received By**: All participants

**Usage**: Navigate to voting screen, display ideas

---

## 2. Idea Events

**Handler File**: [server/socket/ideaHandlers.js](../server/socket/ideaHandlers.js)

### submit-idea

**Direction**: Client → Server

**Emitted By**: User submitting an idea

**Payload**:
```javascript
{
  sessionId: 'uuid-string',
  content: 'My brilliant idea text'
}
```

**Server Actions**:
1. Validate session is in `SUBMITTING_IDEAS` status
2. Check user hasn't exceeded max ideas (3)
3. Create idea in database
4. Broadcast idea-submitted to all participants

**Responds With**: `idea-submitted` (to all)

**Example**:
```javascript
// Client
socket.emit('submit-idea', {
  sessionId,
  content: 'Build a collaborative brainstorming tool'
});

// All clients receive (anonymous)
socket.on('idea-submitted', (data) => {
  console.log('New idea submitted by:', data.userName);
  // Idea content not included in broadcast (privacy)
});
```

**Error Cases**:
- Session not in idea submission phase → `error`
- Max ideas reached → `error`
- Empty content → `error`

---

### get-ideas

**Direction**: Client → Server

**Emitted By**: Components needing to fetch all session ideas

**Payload**:
```javascript
{
  sessionId: 'uuid-string'
}
```

**Server Actions**:
1. Fetch all ideas for session
2. Send ideas to requesting user

**Responds With**: `ideas` (to requester only)

**Example**:
```javascript
// Client
socket.emit('get-ideas', { sessionId });

socket.on('ideas', (data) => {
  console.log('All ideas:', data.ideas);
  console.log('Session status:', data.sessionStatus);
  setIdeas(data.ideas);
});
```

---

### ideas

**Direction**: Server → Client

**Emitted By**: Server in response to get-ideas

**Payload**:
```javascript
{
  sessionId: 'uuid-string',
  ideas: [
    {
      id: 'idea-uuid',
      content: 'Idea text here',
      author_id: 'user-uuid',
      author_name: 'John Doe',  // Only if requester is owner
      created_at: '2024-01-01T12:00:00Z'
    },
    // ...
  ],
  round: 0,
  sessionStatus: 'VOTING'
}
```

**Received By**: Single client (targeted)

**Privacy Note**: `author_name` only included if requester is session owner

---

### idea-submitted

**Direction**: Server → Clients

**Emitted By**: Server when idea is successfully submitted

**Payload**:
```javascript
{
  sessionId: 'uuid-string',
  userId: 'user-uuid',
  userName: 'John Doe',
  ideaCount: 2  // Total ideas submitted by this user
}
```

**Received By**: All participants in room

**Usage**: Show notification, update submission progress UI

**Privacy**: Does not include idea content (anonymous until voting)

---

## 3. Vote Events

**Handler File**: [server/socket/voteHandlers.js](../server/socket/voteHandlers.js)

### submit-votes

**Direction**: Client → Server

**Emitted By**: User submitting their votes (multi-vote)

**Payload**:
```javascript
{
  sessionId: 'uuid-string',
  ideaIds: ['idea-uuid-1', 'idea-uuid-2', 'idea-uuid-3']
}
```

**Server Actions**:
1. Validate session is in `VOTING` status
2. Check user hasn't voted in current round
3. Validate vote count matches required_votes
4. Create all votes atomically in database
5. Emit vote-confirmed to user
6. Broadcast vote-submitted to all (anonymous)
7. Check if all participants voted
8. If round complete, process results:
   - Call voting algorithm
   - If complete: emit `voting-complete`
   - If new round needed: emit `new-voting-round`

**Responds With**:
- `vote-confirmed` (to requester)
- `vote-submitted` (to all)
- `voting-complete` OR `new-voting-round` (to all, if round complete)

**Example**:
```javascript
// Client
socket.emit('submit-votes', {
  sessionId,
  ideaIds: ['id-1', 'id-2', 'id-3']
});

// Confirmation to voter
socket.on('vote-confirmed', (data) => {
  console.log('Your votes:', data.ideaIds);
  console.log('Round:', data.round);
  setHasVoted(true);
});

// Broadcast to all (anonymous)
socket.on('vote-submitted', (data) => {
  console.log(`${data.userName} has voted in round ${data.round}`);
  updateVotingProgress();
});
```

**Error Cases**:
- Already voted in round → `error` with recovery message
- Wrong number of votes → `error`
- Session not in voting → `error`

---

### submit-vote

**Direction**: Client → Server

**Emitted By**: User submitting a single vote (legacy/alternative method)

**Payload**:
```javascript
{
  sessionId: 'uuid-string',
  ideaId: 'idea-uuid'
}
```

**Note**: Less commonly used than `submit-votes`. Similar server actions.

---

### get-user-vote-status

**Direction**: Client → Server

**Emitted By**: Components on mount to recover voting state

**Payload**:
```javascript
{
  sessionId: 'uuid-string'
}
```

**Server Actions**:
1. Get current round from session
2. Check if user voted in current round
3. If voted, get their specific votes
4. Get required_votes from metadata
5. Send user-vote-status back

**Responds With**: `user-vote-status` (to requester)

**Example**:
```javascript
// Client (on VotingScreen mount)
useEffect(() => {
  socket.emit('get-user-vote-status', { sessionId });
}, []);

socket.on('user-vote-status', (data) => {
  if (data.hasVoted) {
    setHasVoted(true);
    const votedIds = new Set(data.userVotes.map(v => v.ideaId));
    setSelectedIdeas(votedIds);
    console.log('Recovered voting state:', votedIds);
  }
  setRequiredVotes(data.requiredVotes);
});
```

**Critical for**:
- State recovery after page refresh
- Showing user their previous votes
- Preventing accidental re-voting

---

### user-vote-status

**Direction**: Server → Client

**Emitted By**: Server in response to get-user-vote-status

**Payload**:
```javascript
{
  sessionId: 'uuid-string',
  round: 0,
  hasVoted: true,
  userVotes: [
    { ideaId: 'uuid-1', ideaContent: 'Idea text 1' },
    { ideaId: 'uuid-2', ideaContent: 'Idea text 2' },
    { ideaId: 'uuid-3', ideaContent: 'Idea text 3' }
  ],
  requiredVotes: 3
}
```

**Received By**: Single client (targeted)

**Usage**: Restore voting UI state after refresh

---

### vote-confirmed

**Direction**: Server → Client

**Emitted By**: Server after successfully recording votes

**Payload**:
```javascript
{
  ideaIds: ['uuid-1', 'uuid-2', 'uuid-3'],
  round: 0,
  requiredVotes: 3
}
```

**Received By**: Voting user only

**Usage**: Update UI to "voted" state, show confirmation

---

### vote-submitted

**Direction**: Server → Clients

**Emitted By**: Server when any user submits votes

**Payload**:
```javascript
{
  userId: 'user-uuid',
  userName: 'John Doe',
  round: 0,
  requiredVotes: 3
}
```

**Received By**: All participants in room

**Usage**: Update voting progress indicator (e.g., "3/5 participants voted")

**Privacy**: Does not reveal which ideas were voted for

---

### new-voting-round

**Direction**: Server → Clients

**Emitted By**: Server when tiebreaker round is needed

**Payload**:
```javascript
{
  round: 1,
  candidateIdeas: [
    { id: 'uuid-3', content: 'Tied idea 1', ... },
    { id: 'uuid-4', content: 'Tied idea 2', ... },
    { id: 'uuid-5', content: 'Tied idea 3', ... }
  ],
  requiredVotes: 2,
  accumulatedWinners: ['uuid-1', 'uuid-2'],
  message: 'Ronda 2 de votación para desempate'
}
```

**Received By**: All participants

**Usage**:
- Reset voting UI
- Show only candidate ideas
- Update required votes
- Display accumulated winners (optional)

**Example**:
```javascript
socket.on('new-voting-round', (data) => {
  console.log(`New round ${data.round}: ${data.candidateIdeas.length} candidates`);
  console.log(`Vote for ${data.requiredVotes} ideas`);
  console.log(`Already selected: ${data.accumulatedWinners.length} winners`);

  setIdeas(data.candidateIdeas);
  setRequiredVotes(data.requiredVotes);
  setSelectedIdeas(new Set());
  setHasVoted(false);

  // Request updated vote status for new round
  socket.emit('get-user-vote-status', { sessionId });
});
```

---

### voting-complete

**Direction**: Server → Clients

**Emitted By**: Server when all 3 winners are selected

**Payload**:
```javascript
{
  selectedIdeas: [
    {
      id: 'uuid-1',
      content: 'Winning idea 1',
      author_id: 'user-uuid-1',
      author_name: 'Jane Doe',
      vote_count: 5
    },
    {
      id: 'uuid-2',
      content: 'Winning idea 2',
      author_id: 'user-uuid-2',
      author_name: 'John Smith',
      vote_count: 4
    },
    {
      id: 'uuid-3',
      content: 'Winning idea 3',
      author_id: 'user-uuid-3',
      author_name: 'Alice Johnson',
      vote_count: 3
    }
  ],
  message: 'Las ideas ganadoras han sido seleccionadas'
}
```

**Received By**: All participants

**Usage**: Navigate to results screen, display winners

**Example**:
```javascript
socket.on('voting-complete', (data) => {
  console.log('Winners selected!', data.selectedIdeas);
  navigate(`/session/${sessionId}/results`);
});
```

---

### get-vote-status

**Direction**: Client → Server

**Emitted By**: Components checking overall voting progress

**Payload**:
```javascript
{
  sessionId: 'uuid-string'
}
```

**Server Actions**: Get voting progress for current round

**Responds With**: `vote-status`

---

### vote-status

**Direction**: Server → Client

**Emitted By**: Server in response to get-vote-status

**Payload**:
```javascript
{
  sessionId: 'uuid-string',
  status: {
    totalParticipants: 5,
    votedCount: 3,
    allVoted: false,
    currentRound: 0
  }
}
```

---

### get-vote-results

**Direction**: Client → Server

**Emitted By**: Results screen to fetch final results

**Payload**:
```javascript
{
  sessionId: 'uuid-string'
}
```

**Server Actions**:
1. Verify session is COMPLETED
2. Get final selected ideas with vote counts

**Responds With**: `vote-results`

---

### vote-results

**Direction**: Server → Client

**Emitted By**: Server with final voting results

**Payload**:
```javascript
{
  sessionId: 'uuid-string',
  results: {
    selectedIdeas: [ /* winners */ ],
    totalRounds: 2,
    totalVotes: 45
  }
}
```

---

## Error Event

**Direction**: Server → Client

**Emitted By**: Server when any operation fails

**Payload**:
```javascript
{
  message: 'Error description',
  code: 'ERROR_CODE',  // Optional
  details: { /* additional info */ }  // Optional
}
```

**Received By**: Client that triggered the error

**Example**:
```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error.message);
  toast.error(error.message);

  if (error.message.includes('already voted')) {
    // Refresh page to recover state
    socket.emit('get-user-vote-status', { sessionId });
  }
});
```

---

## Room Management

### Room Naming Convention

```
session:${sessionId}
```

**Example**: `session:550e8400-e29b-41d4-a716-446655440000`

### Joining a Room

```javascript
// Server side
socket.join(`session:${sessionId}`);
```

### Broadcasting to Room

```javascript
// To all in room
io.to(`session:${sessionId}`).emit('event-name', data);

// To all except sender
socket.to(`session:${sessionId}`).emit('event-name', data);
```

### Leaving a Room

```javascript
socket.leave(`session:${sessionId}`);
```

---

## Event Flow Diagrams

### Session Start Flow

```
Owner                     Server                    Participants
  |                          |                           |
  |--start-session---------> |                           |
  |                          |--Update DB--------------> |
  |                          |                           |
  |<-----session-started-----|                           |
  |                          |------session-started----> |
  |                          |                           |
  |--navigate to ideas       |                           |
  |                          |    navigate to ideas------|
```

### Voting Round Flow

```
User A          User B          Server              Database
  |               |                |                    |
  |--submit-votes----------------> |                    |
  |               |                |--INSERT votes----> |
  |<--vote-confirmed-------------- |                    |
  |               |<--vote-submitted--(broadcast)       |
  |               |                |                    |
  |               |--submit-votes->|                    |
  |               |                |--INSERT votes----> |
  |               |<-vote-confirmed|                    |
  |<--vote-submitted-------------- |                    |
  |               |                |                    |
  |               |                |--All voted?------> |
  |               |                |--Process round---> |
  |               |                |<--Results--------- |
  |               |                |                    |
  |<--new-voting-round------------ |                    |
  |               |<--new-voting-round (broadcast)     |
```

### State Recovery Flow

```
Client                    Server                Database
  |                          |                      |
  |--Page Refresh            |                      |
  |                          |                      |
  |--Socket Reconnect------> |                      |
  |                          |                      |
  |--join-session----------> |                      |
  |<--session-state--------- |                      |
  |                          |                      |
  |--get-user-vote-status--> |                      |
  |                          |--Query votes-------> |
  |                          |<--User's votes------ |
  |<--user-vote-status------ |                      |
  |                          |                      |
  |  [UI restored with       |                      |
  |   hasVoted=true,         |                      |
  |   selectedIdeas=[...]]   |                      |
```

---

## Best Practices

### 1. Always Clean Up Listeners

```javascript
useEffect(() => {
  socket.on('event-name', handler);

  return () => {
    socket.off('event-name', handler);  // Important!
  };
}, [socket]);
```

### 2. Handle Errors Gracefully

```javascript
socket.on('error', (error) => {
  console.error('Socket error:', error);
  // Show user-friendly message
  // Attempt recovery if possible
});
```

### 3. Implement State Recovery

```javascript
// On mount, always check current state
useEffect(() => {
  socket.emit('join-session', { sessionId });
  socket.emit('get-user-vote-status', { sessionId });
}, []);
```

### 4. Use Rooms for Isolation

```javascript
// Don't broadcast globally
io.emit('event');  // ❌ Sends to ALL connected clients

// Broadcast to specific room
io.to(`session:${sessionId}`).emit('event');  // ✅ Only session participants
```

### 5. Validate on Server

```javascript
// Never trust client data
socket.on('submit-votes', ({ sessionId, ideaIds }) => {
  // ✅ Validate session exists
  // ✅ Validate user is participant
  // ✅ Validate vote count
  // ✅ Check if already voted
});
```

---

## Performance Considerations

### Connection Pooling

**Current**: One persistent connection per client

**Scaling**: Use Socket.IO Redis adapter for multi-server

```javascript
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';

const pubClient = createClient({ url: 'redis://localhost:6379' });
const subClient = pubClient.duplicate();

io.adapter(createAdapter(pubClient, subClient));
```

### Message Size Optimization

**Current**: Full session objects sent

**Optimization**: Send only changed fields

```javascript
// Instead of
io.emit('session-state', fullSession);  // 5KB

// Send deltas
io.emit('session-update', { status: 'VOTING' });  // 50 bytes
```

### Acknowledgments for Critical Operations

```javascript
// Client
socket.emit('submit-votes', { sessionId, ideaIds }, (response) => {
  if (response.success) {
    console.log('Votes recorded!');
  }
});

// Server
socket.on('submit-votes', (data, callback) => {
  // Process votes...
  callback({ success: true });
});
```

---

## Debugging Tools

### Enable Debug Logging

**Client**:
```javascript
localStorage.debug = 'socket.io-client:socket';
```

**Server**:
```bash
DEBUG=socket.io:* node app.js
```

### Monitor Connected Sockets

```javascript
// Get all connected sockets
const sockets = await io.fetchSockets();
console.log(`${sockets.length} connected sockets`);

// Get sockets in specific room
const roomSockets = await io.in(`session:${sessionId}`).fetchSockets();
console.log(`${roomSockets.length} in session`);
```

### Event Logging

```javascript
// Log all incoming events (dev only)
socket.onAny((eventName, ...args) => {
  console.log(`[${eventName}]`, args);
});
```
