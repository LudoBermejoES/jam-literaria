# Security Documentation

## Overview

This document outlines the security features, vulnerabilities, and best practices for Jam Literaria.

**Security Level**: Basic (suitable for trusted environments, educational use)
**Risk Profile**: Low to Medium (no sensitive data, minimal attack surface)

---

## Authentication & Authorization

### Authentication Model

**Type**: Session-based authentication with cookies

**Implementation**:
```javascript
// Session configuration
app.use(session({
  secret: process.env.SESSION_SECRET || 'jam-literaria-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',  // HTTPS only in prod
    httpOnly: true,                                  // No JavaScript access
    maxAge: 24 * 60 * 60 * 1000,                    // 24 hours
    sameSite: 'none' (prod) | 'lax' (dev)           // CSRF protection
  }
}));
```

**Location**: [server/app.js:60-70](../server/app.js:60-70)

### Cookie Security

**Protection Against**:
1. **XSS** (Cross-Site Scripting)
   - `httpOnly: true` → Cannot be accessed via JavaScript
   - Prevents `document.cookie` theft

2. **CSRF** (Cross-Site Request Forgery)
   - `sameSite: 'none'` (production with credentials)
   - `sameSite: 'lax'` (development)
   - Limits cross-origin cookie sending

3. **Man-in-the-Middle**
   - `secure: true` in production → HTTPS only
   - Cookie only transmitted over encrypted connections

### Session Storage

**Backend**:
- express-session stores session ID in cookie
- Session data stored in memory (default)
- User ID stored in session

**Weakness**: In-memory storage is lost on server restart

**Production Recommendation**:
```javascript
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

const redisClient = createClient({ url: 'redis://localhost:6379' });

app.use(session({
  store: new RedisStore({ client: redisClient }),
  // ... other options
}));
```

---

## User Authentication

### Login Process

**No Passwords**: Users identified by name only

**Security Implications**:
- ✅ Simple user experience
- ❌ No identity verification
- ❌ Anyone can impersonate by using same name
- ❌ Suitable only for trusted environments

**Code**: [server/api/controllers/authController.js](../server/api/controllers/authController.js)

```javascript
export const login = (req, res) => {
  const { name } = req.body;

  // Minimal validation (no password check)
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'Name is required' });
  }

  // Create user
  const user = userService.createUser(name.trim());

  // Store in session
  req.session.userId = user.id;

  res.json({ success: true, data: { user } });
};
```

### Recommended Improvements

**Phase 1**: Add password authentication
```javascript
// User model
{
  id: 'uuid',
  name: 'John',
  email: 'john@example.com',  // New: unique identifier
  passwordHash: 'bcrypt hash'  // New: encrypted password
}

// Login
const user = User.getByEmail(email);
const valid = await bcrypt.compare(password, user.passwordHash);
```

**Phase 2**: Add OAuth providers
```javascript
// Google, GitHub, Microsoft login
passport.use(new GoogleStrategy({
  clientID: process.env.GOOGLE_CLIENT_ID,
  clientSecret: process.env.GOOGLE_CLIENT_SECRET,
  callbackURL: '/auth/google/callback'
}, ...));
```

**Phase 3**: Add multi-factor authentication
```javascript
// TOTP (Time-based One-Time Password)
const secret = speakeasy.generateSecret();
const verified = speakeasy.totp.verify({
  secret: user.twoFactorSecret,
  encoding: 'base32',
  token: userToken
});
```

---

## Socket.IO Authentication

### Connection Authentication

**Implementation**: [server/socket/index.js:30-54](../server/socket/index.js:30-54)

```javascript
io.use((socket, next) => {
  const userId = socket.handshake.auth.userId;

  if (!userId) {
    return next(new Error('Authentication error'));
  }

  // Validate user exists in database
  const user = userService.getUserById(userId);

  if (!user) {
    return next(new Error('Invalid user'));
  }

  // Attach to socket for all handlers
  socket.userId = userId;
  socket.user = user;

  return next();
});
```

**Security Analysis**:
- ✅ Validates user exists before allowing connection
- ✅ Prevents unauthenticated socket connections
- ❌ No verification that userId belongs to requester
- ❌ Trusts client-provided userId

**Vulnerability**:
```javascript
// Malicious client could provide any userId
const socket = io({
  auth: {
    userId: 'someone-elses-uuid'  // ❌ No verification
  }
});
```

**Fix**: Verify session cookie on socket handshake

```javascript
io.use((socket, next) => {
  // Parse session cookie
  sessionMiddleware(socket.request, {}, () => {
    const userId = socket.request.session.userId;

    if (!userId) {
      return next(new Error('Not authenticated'));
    }

    socket.userId = userId;
    next();
  });
});
```

---

## Authorization

### Session Access Control

**Validation**: [server/services/userService.js](../server/services/userService.js)

```javascript
export function validateUserSessionAccess(userId, sessionId) {
  const participants = Session.getParticipants(sessionId);
  return participants.some(p => p.id === userId);
}
```

**Applied in**:
- Socket event handlers (before any operation)
- REST API endpoints

**Example** ([sessionHandlers.js:28-33](../server/socket/sessionHandlers.js:28-33)):
```javascript
socket.on('join-session', async ({ sessionId }) => {
  const isParticipant = userService.validateUserSessionAccess(socket.userId, sessionId);

  if (!isParticipant) {
    socket.emit('error', { message: 'Not a participant' });
    return;
  }
  // ...
});
```

### Owner-Only Operations

**Operations Requiring Ownership**:
- Start session
- Delete session
- Start voting
- Start ideation

**Validation Pattern**:
```javascript
const session = sessionService.getSessionById(sessionId);

if (session.owner_id !== socket.userId) {
  return socket.emit('error', { message: 'Only owner can perform this action' });
}

// Proceed with operation
```

**Locations**:
- [sessionHandlers.js:128-137](../server/socket/sessionHandlers.js:128-137) - start-ideation
- [sessionHandlers.js:164-172](../server/socket/sessionHandlers.js:164-172) - start-voting
- [sessionService.js:128-147](../server/services/sessionService.js:128-147) - startSession
- [sessionService.js:285-300](../server/services/sessionService.js:285-300) - deleteSession

---

## Input Validation

### SQL Injection Prevention

**Protection**: Prepared statements via better-sqlite3

**Safe**:
```javascript
const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
const user = stmt.get(userId);  // ✅ Parameterized
```

**Unsafe** (not used in codebase):
```javascript
const query = `SELECT * FROM users WHERE id = '${userId}'`;  // ❌ Injectable
```

**All database queries use prepared statements** → SQL injection NOT possible

### XSS Prevention

**Server-Side**:
- No HTML rendering on server (JSON API only)
- Data stored as-is in database

**Client-Side**:
- React automatically escapes content
- No `dangerouslySetInnerHTML` used
- No direct DOM manipulation with user data

**Example** (React escapes automatically):
```jsx
<div>{idea.content}</div>
// Even if content is "<script>alert('xss')</script>"
// React renders it as text, not HTML
```

**Vulnerability**: If adding rich text editor
```jsx
// ❌ Dangerous
<div dangerouslySetInnerHTML={{__html: idea.content}} />

// ✅ Safe
import DOMPurify from 'dompurify';
<div dangerouslySetInnerHTML={{__html: DOMPurify.sanitize(idea.content)}} />
```

### Input Length Limits

**Current State**:
- ❌ No length limits enforced
- Users can submit extremely long ideas
- Could cause UI/performance issues

**Recommendation**:
```javascript
// Server-side validation
if (content.length > 5000) {
  throw new Error('Idea too long (max 5000 characters)');
}

// Client-side UI
<textarea maxLength={5000} />
```

### Type Validation

**Database**: `STRICT` mode prevents type coercion

```sql
CREATE TABLE users (...) STRICT;
```

**Effect**:
```javascript
// ❌ Throws error (cannot insert number as TEXT)
db.prepare('INSERT INTO users (id, name) VALUES (?, ?)').run(123, 'John');

// ✅ Requires correct types
db.prepare('INSERT INTO users (id, name) VALUES (?, ?)').run('uuid', 'John');
```

---

## CORS Configuration

**Settings**: [server/app.js:33-48](../server/app.js:33-48)

```javascript
app.use(cors({
  origin: function(origin, callback) {
    const allowedOrigins = [
      process.env.CLIENT_URL || 'http://localhost:3000',
      'http://localhost:5173',
      'https://jam.ludobermejo.es'
    ];

    if (!origin) return callback(null, true);  // Allow requests with no origin

    if (allowedOrigins.indexOf(origin) !== -1) {
      return callback(null, true);
    }

    return callback(null, true);  // ⚠️ Currently allows all origins
  },
  credentials: true
}));
```

**Current Issue**: `return callback(null, true)` allows ALL origins

**Fix**:
```javascript
if (allowedOrigins.indexOf(origin) === -1) {
  return callback(new Error('CORS not allowed'));  // ✅ Reject unknown origins
}
```

---

## Data Privacy

### Anonymous Voting

**Implementation**:
- Ideas displayed without author names during voting
- `author_id` stored in database but not sent to clients
- Only session owner can see authors (moderation)

**Code**: [server/socket/ideaHandlers.js:39-49](../server/socket/ideaHandlers.js)

```javascript
socket.on('get-ideas', async ({ sessionId }) => {
  const ideas = ideaService.getIdeasBySessionId(sessionId);
  const session = sessionService.getSessionById(sessionId);

  // Only include author names if requester is owner
  const isOwner = session.owner_id === socket.userId;

  const ideasWithOptionalAuthors = ideas.map(idea => ({
    ...idea,
    author_name: isOwner ? idea.author_name : undefined  // ✅ Privacy
  }));

  socket.emit('ideas', { ideas: ideasWithOptionalAuthors });
});
```

### Vote Privacy

**Protected Information**:
- Who voted for which ideas (hidden from all participants)
- Only aggregate vote counts revealed

**Broadcast** (safe):
```javascript
io.to(`session:${sessionId}`).emit('vote-submitted', {
  userId: socket.userId,
  userName: socket.user.name,
  // ✅ No ideaIds included
});
```

**Personal** (to voter only):
```javascript
socket.emit('vote-confirmed', {
  ideaIds: [...]  // ✅ Only sent to voter
});
```

---

## Rate Limiting

**Current State**: ❌ No rate limiting implemented

**Vulnerabilities**:
- Spam idea submissions
- Rapid session creation
- Socket event flooding

**Recommendation**:

### HTTP Rate Limiting

```javascript
import rateLimit from 'express-rate-limit';

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,  // 15 minutes
  max: 100,  // Limit each IP to 100 requests per windowMs
  message: 'Too many requests, please try again later'
});

app.use('/api/', apiLimiter);
```

### Socket.IO Rate Limiting

```javascript
import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
  points: 10,  // Number of points
  duration: 1  // Per second
});

socket.on('submit-idea', async (data) => {
  try {
    await rateLimiter.consume(socket.userId);
    // Process idea submission
  } catch {
    socket.emit('error', { message: 'Too many requests' });
  }
});
```

---

## Vulnerability Analysis

### 1. User Impersonation (HIGH)

**Description**: No password authentication allows identity theft

**Impact**: Malicious user can impersonate others

**Attack**:
```javascript
// Attacker creates account with victim's name
POST /api/auth/login
{ "name": "Victim Name" }

// Now appears as "Victim Name" in sessions
```

**Mitigation**:
- Add password authentication
- Add email verification
- Add OAuth providers

---

### 2. Session Hijacking (MEDIUM)

**Description**: Session ID could be stolen if transmitted over HTTP

**Impact**: Attacker gains access to user's session

**Attack**:
```
1. Victim connects over HTTP (not HTTPS)
2. Attacker intercepts traffic (man-in-the-middle)
3. Attacker extracts session cookie
4. Attacker uses cookie to impersonate victim
```

**Mitigation**:
- ✅ Already enabled: `secure: true` in production
- ✅ Use HTTPS in production (enforced by nginx)
- Add HSTS header

```javascript
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});
```

---

### 3. Double Voting (FIXED)

**Description**: User could vote multiple times in same round

**Previous Vulnerability**:
```javascript
// No check for duplicate votes
socket.on('submit-votes', async ({ ideaIds }) => {
  await voteService.createVotes(userId, ideaIds, sessionId);  // ❌
});
```

**Fix** ([voteHandlers.js:79-87](../server/socket/voteHandlers.js:79-87)):
```javascript
const hasVoted = Vote.hasUserVotedInRound(socket.userId, sessionId, round);

if (hasVoted) {
  socket.emit('error', { message: 'Already voted in this round' });
  return;  // ✅ Prevent duplicate voting
}
```

**Database Constraint**:
```sql
UNIQUE (user_id, idea_id, round, session_id)  -- ✅ Extra protection
```

---

### 4. Voting for Own Ideas (LOW)

**Description**: Users can vote for their own ideas

**Impact**: Bias in results

**Current Behavior**: Allowed

**Recommendation**: Add validation

```javascript
const idea = Idea.getIdeaById(ideaId);

if (idea.author_id === socket.userId) {
  throw new Error('Cannot vote for your own idea');
}
```

---

### 5. Unauthorized Session Access (MEDIUM)

**Description**: Socket auth trusts client-provided userId

**Attack**:
```javascript
// Attacker connects with victim's userId
const socket = io({
  auth: {
    userId: 'victims-uuid'  // ❌ No verification
  }
});

// Now can access victim's sessions
socket.emit('join-session', { sessionId });
```

**Mitigation**: Verify userId against session cookie (see Socket.IO Authentication section above)

---

### 6. Session Code Enumeration (LOW)

**Description**: 6-character codes are guessable

**Keyspace**: 32^6 = 1,073,741,824 combinations

**Attack**:
```javascript
// Brute force session codes
for (let code of possibleCodes) {
  const result = await joinSession(code);
  if (result.success) {
    // Found active session
  }
}
```

**Mitigation**:
- ✅ Large keyspace (1B+ combinations)
- Add rate limiting on join attempts
- Add session expiration (auto-delete old sessions)
- Increase code length (6 → 8 characters)

---

### 7. No Input Sanitization (MEDIUM)

**Description**: Idea content not sanitized

**Impact**: If rich text editing added later, XSS risk

**Current**: Safe (React escapes by default)

**Future Risk**: Adding `dangerouslySetInnerHTML` without sanitization

**Mitigation**:
```javascript
import DOMPurify from 'isomorphic-dompurify';

// Before storing
const sanitized = DOMPurify.sanitize(ideaContent, {
  ALLOWED_TAGS: ['b', 'i', 'u', 'p', 'br'],
  ALLOWED_ATTR: []
});
```

---

## Security Headers

**Current State**: ❌ No security headers configured

**Recommendation**: Add helmet.js

```javascript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],  // Adjust for React
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "wss:", "ws:"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));
```

**Headers Added**:
- `Strict-Transport-Security` - Force HTTPS
- `X-Content-Type-Options` - Prevent MIME sniffing
- `X-Frame-Options` - Prevent clickjacking
- `Content-Security-Policy` - XSS protection
- `Referrer-Policy` - Control referrer information

---

## Data Retention

**Current State**: ❌ No data deletion policy

**Concerns**:
- Sessions never deleted (even old/abandoned)
- User accounts never removed
- Database grows indefinitely

**Recommendation**:

### Auto-Delete Old Sessions

```javascript
// Cron job (daily)
import cron from 'node-cron';

cron.schedule('0 0 * * *', () => {
  // Delete sessions completed > 30 days ago
  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  db.prepare(`
    DELETE FROM sessions
    WHERE status = 'COMPLETED'
      AND updated_at < ?
  `).run(cutoff.toISOString());
});
```

### User Data Export

```javascript
// GDPR compliance: allow users to export their data
app.get('/api/users/me/export', async (req, res) => {
  const data = {
    user: User.getUserById(req.session.userId),
    sessions: Session.getSessionsByParticipant(req.session.userId),
    ideas: Idea.getIdeasByAuthor(req.session.userId),
    votes: Vote.getVotesByUser(req.session.userId)
  };

  res.json(data);
});
```

---

## Audit Logging

**Current State**: ❌ No audit logs

**Recommendation**: Log sensitive operations

```javascript
import winston from 'winston';

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'logs/audit.log' })
  ]
});

// Log important events
logger.info('session_created', {
  sessionId,
  userId,
  timestamp: new Date(),
  ip: req.ip
});

logger.warn('unauthorized_access_attempt', {
  userId,
  sessionId,
  action: 'join-session',
  timestamp: new Date()
});
```

---

## Production Security Checklist

- [ ] **Environment Variables**: Secrets in `.env`, not hardcoded
- [ ] **HTTPS**: Enforce in production (nginx config)
- [ ] **Session Secret**: Strong random secret (32+ characters)
- [ ] **CORS**: Restrict to known origins
- [ ] **Rate Limiting**: Implement on API and Socket.IO
- [ ] **Input Validation**: Length limits on all user input
- [ ] **Security Headers**: Add helmet.js
- [ ] **Audit Logging**: Log sensitive operations
- [ ] **Data Retention**: Auto-delete old data
- [ ] **Dependency Scanning**: `npm audit` regularly
- [ ] **Error Handling**: Don't leak stack traces to clients
- [ ] **Database Backups**: Automated daily backups
- [ ] **Monitoring**: Set up alerts for suspicious activity

---

## Security Contact

For security issues, contact: [security@example.com]

**Responsible Disclosure**:
1. Email security issue details privately
2. Allow 90 days for fix before public disclosure
3. Receive credit in security acknowledgments
