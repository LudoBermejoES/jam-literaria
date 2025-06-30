# Jam Literaria - Project Discovery Document

## 🎯 Project Overview

**Jam Literaria** is a sophisticated real-time collaborative writing platform designed for creative brainstorming sessions, writing workshops, and idea generation activities. The platform enables groups to collaboratively submit ideas, vote on them through multiple democratic rounds, and select winning concepts through an advanced tie-breaking algorithm.

### Key Characteristics
- **Purpose**: Democratic idea selection through collaborative voting
- **Target**: Writing groups, creative workshops, brainstorming sessions
- **Core Value**: Fair, transparent, and engaging idea selection process
- **Philosophy**: Anonymous voting to prevent bias, real-time collaboration for engagement

## 🏗️ Technical Architecture

### Stack Overview
```
Frontend (React + Vite) ←→ Real-time (Socket.IO) ←→ Backend (Node.js + Express) ←→ Database (SQLite)
```

### Technology Stack
- **Frontend**: React 19+ with Vite build system
- **Backend**: Node.js 22+ with Express.js framework
- **Database**: SQLite with native Node.js integration (`node:sqlite`)
- **Real-time**: Socket.IO 4.8+ for bidirectional communication
- **Internationalization**: React i18next (English/Spanish)
- **Process Management**: PM2 for production deployment
- **Security**: Express sessions, CORS, cookie management

### Project Structure
```
jam/
├── app/                          # React Frontend
│   ├── src/
│   │   ├── components/          # React components
│   │   │   ├── common/         # Reusable UI (Button, TextArea, LoadingSpinner)
│   │   │   ├── VotingScreen.jsx       # Core voting interface
│   │   │   ├── ResultsScreen.jsx      # Final results display
│   │   │   ├── VoteCountingScreen.jsx # Admin vote control
│   │   │   ├── IdeaSubmission.jsx     # Idea input form
│   │   │   └── PostIdeasWaiting.jsx   # Pre-voting waiting room
│   │   ├── context/            # React Context providers
│   │   ├── pages/              # Main application pages
│   │   ├── services/           # API communication layer
│   │   └── i18n/               # Internationalization files
│
├── server/                       # Node.js Backend
│   ├── api/                    # REST API layer
│   │   ├── controllers/        # Business logic controllers
│   │   ├── middleware/         # Express middleware (auth, validation)
│   │   └── routes/             # API route definitions
│   ├── socket/                 # Socket.IO event handlers
│   ├── models/                 # Database models & operations
│   ├── services/               # Core business logic
│   │   └── votingService.js    # Complex voting algorithm
│   └── utils/                  # Utility functions
│
├── database/                     # Database files and schema
└── docs/                        # Comprehensive documentation
```

## 📊 Database Schema

### Core Tables
1. **users** - User management and authentication
2. **sessions** - Session lifecycle and metadata
3. **session_participants** - Many-to-many user-session relationship
4. **ideas** - Submitted ideas with authorship
5. **votes** - Vote tracking with round support
6. **session_metadata** - Complex session state (JSON fields)

### Key Relationships
- Sessions have one owner (users) but many participants
- Ideas belong to sessions and users (authors)
- Votes link users to ideas within specific sessions and rounds
- Session metadata stores algorithm state (winners, candidates, messages)

## 🔄 Application Flow

### 9-Screen User Journey
1. **Login** - Name entry and authentication
2. **Home** - Create session or join existing
3. **Session Lobby** - Participant gathering and session start
4. **Idea Submission** - Submit 2-3 creative ideas
5. **Post-Ideas Waiting** - Wait for all participants to submit
6. **Voting** - Democratic selection of best ideas
7. **Vote Counting** - Real-time results and tie-breaking control
8. **Results** - Final winners display and session statistics
9. **New Session** - Option to start fresh

### Session States
- `WAITING` - Lobby phase, gathering participants
- `SUBMITTING_IDEAS` - Idea collection phase  
- `VOTING` - Active voting rounds
- `COMPLETED` - Final results available

## ⚡ Real-Time Features (Socket.IO)

### Event Categories
1. **Session Management**
   - `join-session` - User joins session room
   - `session-state` - Session status updates
   - `participant-joined` - New participant notifications

2. **Idea Management**
   - `submit-idea` - Idea submission
   - `ideas` - Ideas broadcast to participants
   - `ideas-submission-complete` - All ideas collected

3. **Voting System**
   - `submit-votes` - Multiple vote submission
   - `vote-confirmed` - Vote acknowledgment
   - `new-voting-round` - Tie-breaker round initiation
   - `voting-complete` - Final results ready

### Socket Authentication
- Middleware validates user ID from handshake
- User object attached to socket for authorization
- Room-based communication (`session:${sessionId}`)

## 🗳️ Sophisticated Voting Algorithm

### Core Logic (`votingService.js`)
The voting system implements a complex democratic algorithm to select exactly 3 winning ideas:

#### Required Votes Calculation
```javascript
function calculateRequiredVotes(ideaCount) {
  if (ideaCount >= 4) return 3;     // Normal: choose 3 of many
  else if (ideaCount === 3) return 2; // Tiebreaker: choose 2 of 3  
  else if (ideaCount === 2) return 1; // Final: choose 1 of 2
  else return 0;                    // Single idea, no voting needed
}
```

#### Tie-Breaking Scenarios
1. **Clear Winners**: When vote counts clearly identify 3 winners
2. **Partial Winners**: Some clear winners + tied candidates requiring additional rounds
3. **Full Ties**: All candidates tied, requiring complete re-voting
4. **Progressive Selection**: Accumulate winners across multiple rounds

#### Multi-Round Process
- Track accumulated winners across rounds
- Calculate remaining slots (3 - current_winners)
- Adjust required votes based on remaining candidates and slots
- Maintain session metadata for algorithm state

## 🎨 User Interface Design

### Design Principles
- **Mobile-First**: Responsive design optimized for touch devices
- **Real-Time Feedback**: Live updates on all state changes
- **Anonymous Voting**: Ideas shown without author attribution
- **Progressive Disclosure**: Information revealed as needed
- **Accessibility**: ARIA-compliant components and keyboard navigation

### Key Components
- **VotingScreen**: Main voting interface with idea cards and selection logic
- **VoteCountingScreen**: Admin control panel for tie-breaking decisions
- **ResultsScreen**: Beautiful results display with statistics
- **IdeaSubmission**: Clean idea input with validation
- **PostIdeasWaiting**: Elegant waiting states with progress indicators

### Internationalization
- Full English/Spanish support via react-i18next
- Language detection and switching
- Localized error messages and UI text
- Cultural considerations for different markets

## 🔧 Development Environment

### Setup Requirements
- Node.js 22+ (native SQLite support)
- npm/yarn package manager
- Modern browser with WebSocket support

### Development Scripts
```bash
# Backend
cd server && npm run dev    # PM2 watch mode
cd server && npm start      # Production mode
cd server && npm run reset-db # Database reset

# Frontend  
cd app && npm run dev       # Vite dev server
cd app && npm run build     # Production build
```

### Environment Configuration
- CORS setup for development/production
- Session security configuration
- Socket.IO origin validation
- Database path configuration

## 🚀 Deployment Architecture

### Production Setup
- **Frontend**: Static files served by Nginx or Express
- **Backend**: PM2 process management with clustering
- **Database**: SQLite file with proper permissions
- **SSL/HTTPS**: Full SSL termination support
- **Domain**: Configured for `jam.ludobermejo.es`

### Deployment Scripts
- Automated SSL certificate setup
- Nginx configuration templates
- Database migration scripts
- Process management with PM2

## 🔒 Security Considerations

### Authentication & Authorization
- Session-based authentication with secure cookies
- User ID validation on all operations
- Socket.IO authentication middleware
- Session ownership verification

### Data Protection
- Vote anonymity preserved (admins see authors, participants don't)
- Session isolation (participants only see their session data)
- Input validation and sanitization
- SQL injection prevention through prepared statements

## 📈 Performance Characteristics

### Scalability Features
- Lightweight SQLite database for single-server deployment
- Efficient Socket.IO room-based communication
- Minimal memory footprint with native SQLite
- Fast startup times with modern ES modules

### Optimization Strategies
- Connection pooling for database operations
- Event-driven architecture reduces blocking operations
- Minimal client-side bundle with modern React
- Progressive loading of session data

## 🧪 Testing Strategy

### Test Coverage
- Server-side unit tests for business logic
- Socket.IO event testing
- Database operation testing
- Frontend component testing with React Testing Library

### Quality Assurance
- ESLint configuration for code quality
- Prettier for consistent formatting
- Jest testing framework setup
- Integration test capabilities

## 🗺️ Future Development Roadmap

### Planned Features (from ROADMAP.md)
1. **Enhanced UI Components** - Advanced theming and accessibility
2. **Extended Voting Algorithms** - Additional democratic selection methods
3. **Session Templates** - Pre-configured session types
4. **Analytics Dashboard** - Session statistics and insights
5. **Export Capabilities** - Results export in various formats
6. **Multi-language Expansion** - Additional language support

### Technical Improvements
1. **Database Migrations** - Automated schema evolution
2. **Caching Layer** - Redis integration for session data
3. **API Rate Limiting** - Enhanced security measures
4. **Monitoring Integration** - Application performance monitoring
5. **Automated Testing** - CI/CD pipeline enhancements

## 💡 Key Implementation Insights

### Critical Success Factors
1. **Real-Time Synchronization**: Socket.IO events must be precisely coordinated
2. **Voting Algorithm Integrity**: The tie-breaking logic is the core value proposition
3. **User Experience Flow**: The 9-screen journey must be seamless and intuitive
4. **Session State Management**: Complex state transitions require careful handling

### Technical Challenges Solved
1. **Complex Voting Logic**: Multi-round democratic selection with tie-breaking
2. **Real-Time Coordination**: Synchronized state across multiple participants
3. **Anonymous Voting**: Hiding authorship while maintaining admin oversight
4. **Mobile-First Design**: Touch-friendly interface for collaborative sessions

### Business Logic Complexity
- **Session Lifecycle Management**: Multiple states and transitions
- **Participant Coordination**: Real-time updates across all connected users
- **Vote Validation**: Ensuring democratic integrity and preventing manipulation
- **Results Calculation**: Complex algorithms for winner selection

## 📚 Essential Documentation References

### Key Files for Understanding
1. `docs/architecture.md` - Detailed technical architecture
2. `docs/flujo.md` - Complete application flow with algorithm details
3. `server/services/votingService.js` - Core voting algorithm implementation
4. `database/schema.sql` - Complete database structure
5. `README.md` - Comprehensive setup and usage guide

### Critical Implementation Files
1. `server/socket/voteHandlers.js` - Real-time voting logic
2. `app/src/components/VotingScreen.jsx` - Primary user interface
3. `server/models/Session.js` - Session management operations
4. `app/src/context/SocketContext.jsx` - Real-time state management

## 🔗 Advanced Session & WebSocket Management

### WebSocket Architecture Deep Dive

The Jam Literaria platform implements a sophisticated dual-communication model combining REST API calls with real-time WebSocket events. This hybrid approach ensures both reliable data persistence and instant collaboration feedback.

#### Socket.IO Server Setup (`server/socket/`)
```javascript
// Centralized Socket.IO instance management
export function setupSocketServer(httpServer) {
  const io = initSocketIO(httpServer, corsConfig);
  
  // Authentication middleware for every connection
  io.use((socket, next) => {
    const userId = socket.handshake.auth.userId;
    const user = userService.getUserById(userId);
    
    socket.userId = userId;
    socket.user = user;  // Attach full user object
    return next();
  });
}
```

#### Client-Side Socket Context (`app/src/context/SocketContext.jsx`)
```javascript
// Authenticated connection with user credentials
const socketInstance = io(SOCKET_URL, {
  withCredentials: true,
  autoConnect: true,
  auth: { userId: user.id }  // Pass user ID in handshake
});
```

### Session State Management Strategy

#### Room-Based Communication Model
- **Session Rooms**: `session:${sessionId}` namespace isolation
- **Authenticated Membership**: Only verified participants can join rooms
- **Selective Broadcasting**: Messages sent only to relevant participants

#### State Synchronization Pattern
```javascript
// 1. REST API Call (Persistence)
const response = await sessionService.startSession(sessionId);

// 2. WebSocket Broadcast (Real-time Updates)
io.to(`session:${sessionId}`).emit('session-started', { session });

// 3. Client State Update (UI Reactivity)
setSession(updatedSession);
```

### Critical Event Flow Analysis

#### Session Lifecycle Events
1. **`join-session`** - Participant authentication and room joining
   - Validates user session access
   - Adds to Socket.IO room
   - Broadcasts participant join to others
   - Sends current session state to new participant

2. **`start-session`** - Admin-triggered session initiation
   - Owner authorization check
   - Minimum participant validation
   - Status transition to `SUBMITTING_IDEAS`
   - Global broadcast with navigation triggers

3. **`start-voting`** - Voting phase initiation
   - Ideas collection and validation
   - Required votes calculation
   - Session metadata update
   - Synchronized voting UI activation

#### Real-Time Voting Coordination
```javascript
// Multi-step voting event flow
socket.emit('submit-votes', { sessionId, ideaIds });  // Submit
socket.emit('vote-confirmed', { ideaIds, round });    // Acknowledge
io.to(sessionId).emit('vote-submitted', { userId });  // Notify others
io.to(sessionId).emit('new-voting-round', { round }); // Tie-breaker
```

### Authentication & Security Model

#### WebSocket Authentication Chain
1. **Initial Handshake**: User ID passed in connection auth
2. **Middleware Validation**: Server validates user existence
3. **Socket Enhancement**: User object attached to socket instance
4. **Room Authorization**: Session participant verification before joining

#### Access Control Implementation
```javascript
// Session access validation
const isParticipant = userService.validateUserSessionAccess(userId, sessionId);
if (!isParticipant) {
  socket.emit('error', { message: 'Not a participant' });
  return;
}

// Owner-only operations
if (session.owner_id !== socket.userId) {
  socket.emit('error', { message: 'Owner only operation' });
  return;
}
```

### Hybrid Communication Architecture

#### REST API Responsibilities
- **Session CRUD Operations**: Create, read, update, delete sessions
- **Persistent Data Storage**: Database operations and validation
- **Authentication Management**: User registration and session management
- **Historical Data Retrieval**: Past sessions and results

#### WebSocket Responsibilities  
- **Real-Time State Sync**: Live session status updates
- **Participant Coordination**: Join/leave notifications
- **Voting Orchestration**: Live vote submission and counting
- **Instant Navigation**: Synchronized screen transitions

#### Coordination Pattern Example
```javascript
// Frontend coordination of REST + WebSocket
const handleStartSession = async () => {
  // 1. Persist state change via REST
  const response = await sessionService.startSession(sessionId);
  
  // 2. WebSocket automatically broadcasts to all participants
  // 3. All clients receive 'session-started' event
  // 4. Automatic navigation triggered on all devices
};
```

### Advanced State Management Features

#### Session Metadata Persistence
The system uses JSON fields in SQLite to store complex session state:
```sql
CREATE TABLE session_metadata (
  session_id TEXT PRIMARY KEY,
  ideas_elegidas TEXT,      -- JSON array of selected idea IDs
  ideas_candidatas TEXT,    -- JSON array of tie-breaker candidates
  mensaje_ronda TEXT,       -- Round-specific messaging
  required_votes INTEGER    -- Dynamic vote requirements
);
```

#### Multi-Round Voting State
```javascript
// Complex state tracking across voting rounds
sessionService.updateSessionMetadata(sessionId, {
  ideas_elegidas: accumulatedWinners,      // Progressive accumulation
  ideas_candidatas: tieBreakingCandidates, // Round-specific candidates
  required_votes: dynamicVoteCount,        // Adaptive voting requirements
  mensaje_ronda: `Round ${newRound} voting` // User communication
});
```

### Error Handling & Connection Resilience

#### Client-Side Error Management
```javascript
// Comprehensive error event handling
socket.on('connect_error', (error) => {
  console.error('Connection failed:', error);
  // Trigger reconnection or fallback UI
});

socket.on('error', (error) => {
  setError(error.message);
  // Display user-friendly error messages
});
```

#### Server-Side Error Boundaries
```javascript
// Graceful error handling in socket handlers
try {
  const result = await voteService.createVotes(userId, ideaIds, sessionId);
  socket.emit('vote-confirmed', result);
} catch (error) {
  socket.emit('error', { message: error.message });
}
```

### Performance & Scalability Considerations

#### Connection Optimization
- **Conditional Connections**: WebSocket only established when authenticated
- **Automatic Cleanup**: Connection cleanup on component unmount
- **Room-Based Broadcasting**: Targeted message delivery to reduce bandwidth

#### Memory Management
```javascript
// Proper cleanup in React components
useEffect(() => {
  return () => {
    socketService.leaveSession(sessionId);
    socketService.disconnect();
  };
}, [sessionId]);
```

### Development Patterns & Best Practices

#### Event Handler Organization
The codebase separates WebSocket handlers by domain:
- **`sessionHandlers.js`** - Session lifecycle and participant management
- **`ideaHandlers.js`** - Idea submission and collection
- **`voteHandlers.js`** - Voting process and result calculation

#### Client-Side Abstraction
```javascript
// Singleton pattern for WebSocket management
class SocketService {
  init(userId) { /* connection setup */ }
  joinSession(sessionId) { /* room management */ }
  on(event, callback) { /* event delegation */ }
}
```

#### Type Safety & Validation
All WebSocket events include comprehensive parameter validation:
```javascript
socket.on('submit-votes', async ({ sessionId, ideaIds }) => {
  if (!sessionId || !Array.isArray(ideaIds)) {
    socket.emit('error', { message: 'Invalid parameters' });
    return;
  }
  // ... process valid request
});
```

This sophisticated session and WebSocket management system enables seamless real-time collaboration while maintaining data integrity and user security. The hybrid REST+WebSocket approach provides both immediate feedback and reliable persistence, creating a robust foundation for collaborative creative sessions.

## 🚨 Critical Issues & Browser Refresh Problems

### Major Session & WebSocket Vulnerabilities

After deep analysis, several critical issues have been identified that could cause significant problems, especially during browser refresh scenarios:

#### 1. **Vote State Recovery Failure** 🗳️💥
**Problem**: When users refresh during voting, there's no mechanism to recover their voting state.
```javascript
// VotingScreen.jsx - No vote state recovery
const [hasVoted, setHasVoted] = useState(false);  // Lost on refresh!
const [selectedIdeas, setSelectedIdeas] = useState(new Set()); // Lost on refresh!

// Server has vote records, but client never checks on mount
```
**Impact**: Users can accidentally vote multiple times or lose their selections, compromising voting integrity.

#### 2. **Socket Connection Race Conditions** 🔄⚡
**Problem**: Multiple socket connection attempts and competing authentication flows.
```javascript
// SocketContext.jsx - Creates new connection each time
useEffect(() => {
  if (isAuthenticated && user?.id) {
    socketInstance = io(SOCKET_URL, { auth: { userId: user.id } });
  }
}, [isAuthenticated, user?.id]); // Recreates on every auth change

// SessionPage.jsx - Manual connection override
if (!socket.connected) {
  socket.connect(); // Can create duplicate connections
}
```
**Impact**: Multiple socket instances, memory leaks, and inconsistent state synchronization.

#### 3. **Authentication-Socket Timing Issues** 🔐⚰️
**Problem**: Socket connection attempts before authentication verification.
```javascript
// Critical flaw: Socket connects before checking if user session is valid
// No validation that the user is still a participant in the session after refresh
const isParticipant = userService.validateUserSessionAccess(userId, sessionId);
// This check only happens AFTER socket joins the room
```
**Impact**: Unauthorized users can join socket rooms, potential security breach.

#### 4. **Session State Synchronization Failures** 📊💔
**Problem**: Multiple components managing session state independently without coordination.
```javascript
// Session.jsx
const [session, setSession] = useState(null);

// SessionPage.jsx 
// No session state - just navigation logic

// VotingScreen.jsx
const [sessionInfo, setSessionInfo] = useState(null);

// All components get 'session-state' events but handle them differently
```
**Impact**: UI inconsistencies, users seeing different session states simultaneously.

#### 5. **Navigation Conflict Chaos** 🧭💥
**Problem**: Multiple components attempting navigation simultaneously, causing routing conflicts.
```javascript
// SessionPage.jsx - Aggressive navigation
socket.on('session-state', (data) => {
  // Immediate navigation without checking current route context
  navigate(`/session/${sessionId}/ideas`, { replace: true });
});

// VotingScreen.jsx - Competing navigation
socket.on('session-state', (data) => {
  if (data.status !== 'VOTING') {
    navigate(`/session/${sessionId}`); // CONFLICTS with SessionPage!
  }
});
```
**Impact**: Users get stuck in navigation loops, browser history corruption, poor UX.

#### 6. **Memory Leaks & Event Handler Pollution** 🧠💧
**Problem**: Improper socket event cleanup and multiple event listener registration.
```javascript
// VotingScreen.jsx - Event cleanup issues
useEffect(() => {
  // Registers new listeners every time dependencies change
  socket.on('session-state', handleSessionState);
  socket.on('voting-started', handleVotingStarted);
  
  return () => {
    // Cleanup may not catch all listeners if socket reference changes
    socket.off('session-state');
  };
}, [socket, sessionId, user?.id, navigate]); // Too many dependencies!
```
**Impact**: Performance degradation, duplicate event handling, unpredictable behavior.

#### 7. **Voting Round State Corruption** 🔄🗳️
**Problem**: No server-side validation of client voting state during reconnection.
```javascript
// Server never validates if user has already voted in current round
socket.on('submit-votes', async ({ sessionId, ideaIds }) => {
  // Should check: Has this user already voted in this round?
  // Vote.hasUserVotedInRound(userId, sessionId, round) exists but isn't used!
  
  const result = await voteService.createVotes(userId, ideaIds, sessionId);
  // Could allow double voting if client state is lost
});
```
**Impact**: Vote manipulation, integrity violations, unfair election results.

#### 8. **Session Metadata Race Conditions** 📝⚡
**Problem**: Complex session metadata updates without proper transaction handling.
```javascript
// sessionService.js - Non-atomic metadata updates
sessionService.updateSessionMetadata(sessionId, {
  ideas_elegidas: accumulatedWinners,      // Update 1
  ideas_candidatas: tieBreakingCandidates, // Update 2  
  required_votes: dynamicVoteCount,        // Update 3
});
// If client refreshes between updates, inconsistent state!
```
**Impact**: Corrupted session state, algorithm failures, deadlocked voting rounds.

#### 9. **No Offline/Connection Failure Handling** 📡❌
**Problem**: Zero graceful degradation when WebSocket connection fails.
```javascript
// SocketContext.jsx - No reconnection strategy
socketInstance.on('disconnect', (reason) => {
  console.log('Socket disconnected:', reason);
  // No reconnection logic!
  // No fallback to REST API!
  // No user notification!
});
```
**Impact**: Users lose real-time updates permanently, sessions become unusable.

#### 10. **Critical Session Access Validation Gap** 🔓⚠️
**Problem**: Socket room joining happens before proper session access validation.
```javascript
// sessionHandlers.js - Security vulnerability
socket.on('join-session', async ({ sessionId }) => {
  // Validates session exists
  const session = sessionService.getSessionById(sessionId);
  
  // Validates user is participant - BUT this can be bypassed
  const isParticipant = userService.validateUserSessionAccess(socket.userId, sessionId);
  
  // CRITICAL: What if user was removed from session while offline?
  // What if session was deleted?
  // What if user's authentication expired?
  
  socket.join(`session:${sessionId}`); // Joins room anyway!
});
```
**Impact**: Unauthorized access to private sessions, data leakage, security breach.

### Browser Refresh Scenario Analysis

#### **Refresh During Voting** 💀
1. User selects ideas and refreshes browser
2. `hasVoted` state resets to `false`
3. `selectedIdeas` state becomes empty
4. Socket reconnects and joins session room
5. **No server-side check if user already voted**
6. User can vote again, breaking election integrity
7. Vote counting becomes corrupted

#### **Refresh During Session Transition** 🔄💀
1. Admin starts voting phase
2. User refreshes during transition
3. Multiple components receive `session-state` events
4. Competing navigation calls trigger route conflicts
5. User ends up on wrong screen or navigation loop
6. Session becomes unusable

#### **Refresh After Disconnection** 📡💀
1. User loses internet connection
2. Socket disconnects silently
3. User refreshes page when connection returns
4. Multiple socket instances may be created
5. Event handlers multiply, causing duplicate responses
6. UI becomes unpredictable and chaotic

### Recommended Critical Fixes

#### **Immediate Priority Fixes:**
1. **Vote State Recovery**: Query server for existing votes on VotingScreen mount
2. **Socket Connection Management**: Implement singleton pattern with proper cleanup
3. **Authentication Validation**: Re-validate session access on every socket connection
4. **Transaction-Safe Metadata Updates**: Atomic session state changes
5. **Navigation Coordination**: Single source of truth for navigation decisions

#### **High Priority Security Fixes:**
1. **Session Access Re-validation**: Check session membership on reconnection
2. **Vote Duplication Prevention**: Server-side voting state validation
3. **Connection State Management**: Proper reconnection logic with exponential backoff
4. **Memory Leak Prevention**: Comprehensive event listener cleanup
5. **Error Boundary Implementation**: Graceful fallback when WebSocket fails

This analysis reveals that while the WebSocket architecture is sophisticated, it has critical vulnerabilities that could compromise session integrity, especially during browser refresh scenarios. These issues require immediate attention to ensure reliable collaborative sessions.

This discovery document provides comprehensive context for future development, maintenance, and enhancement of the Jam Literaria platform. The project represents a sophisticated real-time collaborative application with complex democratic algorithms and polished user experience design. 