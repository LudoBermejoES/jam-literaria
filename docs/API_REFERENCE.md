# API Reference Documentation

## Overview

Jam Literaria provides a RESTful API for HTTP operations and Socket.IO events for real-time communication.

**Base URL**: `http://localhost:5000` (development)
**Production**: `https://jam.ludobermejo.es`

**API Version**: 1.0
**Authentication**: Session-based with cookies

---

## REST API Endpoints

### Authentication

#### POST /api/auth/login

Create a new user session or log in existing user.

**Request**:
```http
POST /api/auth/login
Content-Type: application/json

{
  "name": "John Doe"
}
```

**Response Success** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "created_at": "2024-01-15T10:30:00.000Z",
      "last_active": "2024-01-15T10:30:00.000Z"
    }
  }
}
```

**Response Error** (400):
```json
{
  "success": false,
  "error": "Name is required"
}
```

**Side Effects**:
- Creates new user in database if name doesn't exist
- Sets session cookie with userId
- Updates last_active timestamp

**File**: [server/api/controllers/authController.js](../server/api/controllers/authController.js)

---

#### POST /api/auth/logout

End current user session.

**Request**:
```http
POST /api/auth/logout
```

**Response Success** (200):
```json
{
  "success": true,
  "message": "Logged out successfully"
}
```

**Side Effects**:
- Destroys session
- Clears session cookie

---

#### GET /api/auth/me

Get current authenticated user.

**Request**:
```http
GET /api/auth/me
```

**Response Success** (200):
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "name": "John Doe",
      "created_at": "2024-01-15T10:30:00.000Z",
      "last_active": "2024-01-15T12:45:00.000Z"
    }
  }
}
```

**Response Error** (401):
```json
{
  "success": false,
  "error": "Not authenticated"
}
```

---

### Sessions

#### POST /api/sessions

Create a new session.

**Authentication**: Required

**Request**:
```http
POST /api/sessions
```

**Response Success** (201):
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "code": "ABC123",
      "status": "WAITING",
      "current_round": 0,
      "owner_id": "550e8400-e29b-41d4-a716-446655440000",
      "owner_name": "John Doe",
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T10:30:00.000Z",
      "participant_count": 1
    }
  }
}
```

**Side Effects**:
- Creates session in database
- Generates unique 6-character code
- Adds creator as participant
- Creates session metadata entry

**File**: [server/api/controllers/sessionController.js:7-23](../server/api/controllers/sessionController.js)

---

#### GET /api/sessions/:sessionId

Get session details.

**Authentication**: Required
**Authorization**: Must be session participant

**Request**:
```http
GET /api/sessions/660e8400-e29b-41d4-a716-446655440000
```

**Response Success** (200):
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "code": "ABC123",
      "status": "VOTING",
      "current_round": 1,
      "owner_id": "550e8400-e29b-41d4-a716-446655440000",
      "owner_name": "John Doe",
      "participant_count": 5,
      "created_at": "2024-01-15T10:30:00.000Z",
      "updated_at": "2024-01-15T11:15:00.000Z"
    },
    "participants": [
      {
        "id": "550e8400-e29b-41d4-a716-446655440000",
        "name": "John Doe"
      },
      {
        "id": "660e8400-e29b-41d4-a716-446655440001",
        "name": "Jane Smith"
      }
    ],
    "metadata": {
      "session_id": "660e8400-e29b-41d4-a716-446655440000",
      "ideas_elegidas": ["id1", "id2"],
      "ideas_candidatas": ["id3", "id4", "id5"],
      "mensaje_ronda": "Ronda 2 de votación para desempate",
      "required_votes": 2
    }
  }
}
```

**Response Error** (404):
```json
{
  "success": false,
  "error": "Session not found"
}
```

**Response Error** (403):
```json
{
  "success": false,
  "error": "Not authorized to access this session"
}
```

---

#### POST /api/sessions/join

Join an existing session by code.

**Authentication**: Required

**Request**:
```http
POST /api/sessions/join
Content-Type: application/json

{
  "code": "ABC123"
}
```

**Response Success** (200):
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "code": "ABC123",
      "status": "WAITING",
      ...
    }
  }
}
```

**Response Error** (404):
```json
{
  "success": false,
  "error": "Session not found with code: ABC123"
}
```

**Response Error** (400):
```json
{
  "success": false,
  "error": "Cannot join session in current state"
}
```

**Side Effects**:
- Adds user to session_participants table
- Only allowed if session status is WAITING

---

#### POST /api/sessions/:sessionId/start

Start a session (owner only).

**Authentication**: Required
**Authorization**: Must be session owner

**Request**:
```http
POST /api/sessions/660e8400-e29b-41d4-a716-446655440000/start
```

**Response Success** (200):
```json
{
  "success": true,
  "data": {
    "session": {
      "id": "660e8400-e29b-41d4-a716-446655440000",
      "status": "SUBMITTING_IDEAS",
      ...
    }
  }
}
```

**Response Error** (403):
```json
{
  "success": false,
  "error": "Only the session owner can start the session"
}
```

**Response Error** (400):
```json
{
  "success": false,
  "error": "Session needs at least 2 participants to start"
}
```

**Side Effects**:
- Updates session status to SUBMITTING_IDEAS
- Broadcasts session-started via Socket.IO

---

#### DELETE /api/sessions/:sessionId

Delete a session (owner only).

**Authentication**: Required
**Authorization**: Must be session owner

**Request**:
```http
DELETE /api/sessions/660e8400-e29b-41d4-a716-446655440000
```

**Response Success** (200):
```json
{
  "success": true,
  "message": "Session deleted successfully"
}
```

**Side Effects**:
- Deletes session and all related data (CASCADE):
  - session_participants
  - ideas
  - votes
  - session_metadata

---

### Ideas

#### POST /api/sessions/:sessionId/ideas

Submit an idea to a session.

**Authentication**: Required
**Authorization**: Must be session participant

**Request**:
```http
POST /api/sessions/660e8400-e29b-41d4-a716-446655440000/ideas
Content-Type: application/json

{
  "content": "Build a real-time collaborative brainstorming platform"
}
```

**Response Success** (201):
```json
{
  "success": true,
  "data": {
    "idea": {
      "id": "770e8400-e29b-41d4-a716-446655440000",
      "content": "Build a real-time collaborative brainstorming platform",
      "author_id": "550e8400-e29b-41d4-a716-446655440000",
      "session_id": "660e8400-e29b-41d4-a716-446655440000",
      "created_at": "2024-01-15T10:45:00.000Z"
    }
  }
}
```

**Response Error** (400):
```json
{
  "success": false,
  "error": "Maximum ideas per user reached (3)"
}
```

**Response Error** (400):
```json
{
  "success": false,
  "error": "Session is not in idea submission phase"
}
```

**Side Effects**:
- Creates idea in database
- Broadcasts idea-submitted event via Socket.IO

**File**: [server/api/controllers/ideaController.js](../server/api/controllers/ideaController.js)

---

#### GET /api/sessions/:sessionId/ideas

Get all ideas for a session.

**Authentication**: Required
**Authorization**: Must be session participant

**Request**:
```http
GET /api/sessions/660e8400-e29b-41d4-a716-446655440000/ideas
```

**Response Success** (200):
```json
{
  "success": true,
  "data": {
    "ideas": [
      {
        "id": "770e8400-e29b-41d4-a716-446655440000",
        "content": "Build a real-time collaborative brainstorming platform",
        "author_id": "550e8400-e29b-41d4-a716-446655440000",
        "author_name": "John Doe",
        "session_id": "660e8400-e29b-41d4-a716-446655440000",
        "created_at": "2024-01-15T10:45:00.000Z"
      }
    ]
  }
}
```

**Privacy Note**: `author_name` only included if requester is session owner

---

### Votes

#### POST /api/sessions/:sessionId/votes

Submit a vote (legacy endpoint, prefer Socket.IO).

**Authentication**: Required
**Authorization**: Must be session participant

**Request**:
```http
POST /api/sessions/660e8400-e29b-41d4-a716-446655440000/votes
Content-Type: application/json

{
  "ideaId": "770e8400-e29b-41d4-a716-446655440000"
}
```

**Response Success** (201):
```json
{
  "success": true,
  "data": {
    "vote": {
      "id": "880e8400-e29b-41d4-a716-446655440000",
      "user_id": "550e8400-e29b-41d4-a716-446655440000",
      "idea_id": "770e8400-e29b-41d4-a716-446655440000",
      "session_id": "660e8400-e29b-41d4-a716-446655440000",
      "round": 0,
      "created_at": "2024-01-15T11:00:00.000Z"
    }
  }
}
```

**Note**: Modern clients use Socket.IO `submit-votes` event instead

---

#### GET /api/sessions/:sessionId/votes

Get vote counts for a session.

**Authentication**: Required
**Authorization**: Must be session participant

**Request**:
```http
GET /api/sessions/660e8400-e29b-41d4-a716-446655440000/votes
```

**Response Success** (200):
```json
{
  "success": true,
  "data": {
    "votes": [
      {
        "idea_id": "770e8400-e29b-41d4-a716-446655440000",
        "content": "Build a real-time collaborative brainstorming platform",
        "vote_count": 7
      },
      {
        "idea_id": "770e8400-e29b-41d4-a716-446655440001",
        "content": "Create multi-round tiebreaker system",
        "vote_count": 5
      }
    ]
  }
}
```

---

## Socket.IO Events

See [SOCKET_EVENTS.md](./SOCKET_EVENTS.md) for complete Socket.IO documentation.

### Quick Reference

**Session Events**:
- `join-session` - Join session room
- `leave-session` - Leave session room
- `start-session` - Start session (owner)
- `start-voting` - Begin voting phase (owner)
- `session-state` - Receive session state
- `user-joined` - User joined notification
- `user-left` - User left notification

**Idea Events**:
- `submit-idea` - Submit new idea
- `get-ideas` - Request all ideas
- `ideas` - Receive ideas list
- `idea-submitted` - Idea submission notification

**Vote Events**:
- `submit-votes` - Submit votes (multi-vote)
- `get-user-vote-status` - Request voting state
- `user-vote-status` - Receive voting state
- `vote-confirmed` - Vote submission confirmed
- `vote-submitted` - Vote notification
- `new-voting-round` - New tiebreaker round
- `voting-complete` - All winners selected

**Error Event**:
- `error` - Error notification

---

## Response Format

### Success Response

```json
{
  "success": true,
  "data": {
    // Response payload
  }
}
```

### Error Response

```json
{
  "success": false,
  "error": "Error message description"
}
```

---

## HTTP Status Codes

| Code | Meaning | Usage |
|------|---------|-------|
| 200 | OK | Successful GET, POST, PUT, DELETE |
| 201 | Created | Resource created successfully |
| 400 | Bad Request | Invalid input or validation error |
| 401 | Unauthorized | Not authenticated (no session) |
| 403 | Forbidden | Not authorized (not owner/participant) |
| 404 | Not Found | Resource doesn't exist |
| 500 | Internal Server Error | Server error occurred |

---

## Authentication Flow

### Session-Based Authentication

```
1. Client logs in
   POST /api/auth/login { name: "John" }
   ↓
2. Server creates user, sets session
   Response includes Set-Cookie header
   ↓
3. Client stores cookie automatically
   Browser handles cookie storage
   ↓
4. Subsequent requests include cookie
   GET /api/sessions/ABC123
   Cookie: connect.sid=...
   ↓
5. Server validates session
   req.session.userId exists?
   ↓
6. Request processed if authenticated
```

### Socket.IO Authentication

```
1. Client connects with userId
   io(url, { auth: { userId: 'uuid' } })
   ↓
2. Server middleware validates
   io.use((socket, next) => {
     validate userId exists in DB
   })
   ↓
3. Connection established if valid
   socket.userId = userId
   ↓
4. All events have authenticated context
   socket.on('event', (data) => {
     // socket.userId available
   })
```

---

## Rate Limiting

**Current Status**: ❌ Not implemented

**Recommended**:
```
- 100 requests per 15 minutes per IP (API)
- 10 Socket events per second per user
```

---

## CORS Policy

**Allowed Origins**:
- `http://localhost:3000` (dev)
- `http://localhost:5173` (Vite dev)
- `https://jam.ludobermejo.es` (production)

**Credentials**: Allowed (cookies sent)

**Methods**: GET, POST, PUT, DELETE

---

## Pagination

**Current Status**: ❌ Not implemented

**Future Enhancement**:
```http
GET /api/sessions/:sessionId/ideas?page=1&limit=20
```

```json
{
  "success": true,
  "data": {
    "ideas": [...],
    "pagination": {
      "page": 1,
      "limit": 20,
      "total": 156,
      "pages": 8
    }
  }
}
```

---

## Filtering & Sorting

**Current Status**: ❌ Not implemented

**Future Enhancement**:
```http
GET /api/sessions?status=WAITING&sort=-created_at
```

---

## Webhooks

**Current Status**: ❌ Not implemented

**Future Enhancement**:
```javascript
// Register webhook
POST /api/webhooks
{
  "url": "https://myapp.com/webhooks/jam",
  "events": ["session.started", "voting.complete"]
}

// Webhook payload
POST https://myapp.com/webhooks/jam
{
  "event": "voting.complete",
  "data": {
    "sessionId": "uuid",
    "selectedIdeas": [...]
  },
  "timestamp": "2024-01-15T12:00:00.000Z"
}
```

---

## API Versioning

**Current**: No versioning

**Future Strategy**:
```
Option 1: URL versioning
/api/v1/sessions
/api/v2/sessions

Option 2: Header versioning
Accept: application/vnd.jam.v1+json
```

---

## Error Codes

| Code | Message | Description |
|------|---------|-------------|
| AUTH_001 | Not authenticated | No active session |
| AUTH_002 | Invalid credentials | Login failed |
| AUTH_003 | Not authorized | Insufficient permissions |
| SESS_001 | Session not found | Invalid session ID/code |
| SESS_002 | Cannot join session | Session not in WAITING state |
| SESS_003 | Not a participant | User not in session |
| IDEA_001 | Max ideas reached | User submitted max allowed |
| IDEA_002 | Invalid session status | Not in SUBMITTING_IDEAS |
| VOTE_001 | Already voted | Duplicate vote attempt |
| VOTE_002 | Invalid vote count | Wrong number of votes |
| VOTE_003 | Not in voting phase | Session not in VOTING state |

**Usage**:
```json
{
  "success": false,
  "error": "Session not found",
  "code": "SESS_001"
}
```

---

## Client Libraries

### JavaScript/TypeScript

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  withCredentials: true  // Important for cookies
});

// Login
const { data } = await api.post('/auth/login', { name: 'John' });

// Create session
const session = await api.post('/sessions');

// Join session
await api.post('/sessions/join', { code: 'ABC123' });
```

### Socket.IO Client

```javascript
import { io } from 'socket.io-client';

const socket = io('http://localhost:5000', {
  withCredentials: true,
  auth: {
    userId: user.id
  }
});

socket.on('connect', () => {
  console.log('Connected');
});

socket.emit('join-session', { sessionId });

socket.on('session-state', (data) => {
  console.log('Session:', data);
});
```

---

## Testing

### Example Test (Jest + Supertest)

```javascript
import request from 'supertest';
import app from '../app.js';

describe('POST /api/auth/login', () => {
  it('should create user and return session', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ name: 'Test User' })
      .expect(200);

    expect(res.body.success).toBe(true);
    expect(res.body.data.user.name).toBe('Test User');
    expect(res.headers['set-cookie']).toBeDefined();
  });

  it('should reject empty name', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ name: '' })
      .expect(400);

    expect(res.body.success).toBe(false);
    expect(res.body.error).toContain('required');
  });
});
```

---

## API Changelog

### Version 1.0.0 (Current)

**Released**: 2024-01-15

**Features**:
- Basic authentication (name-based)
- Session management (create, join, start, delete)
- Idea submission
- Multi-round voting system
- Real-time updates via Socket.IO

**Known Limitations**:
- No pagination
- No rate limiting
- No API versioning
- No webhooks
- Session-based auth only (no OAuth)

---

## Support & Feedback

**Issues**: [GitHub Issues](https://github.com/yourrepo/jam-literaria/issues)
**Documentation**: [https://docs.jam-literaria.com](https://docs.jam-literaria.com)
**Email**: support@jam-literaria.com
