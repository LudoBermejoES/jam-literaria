# Jam Literaria Documentation

Welcome to the comprehensive documentation for **Jam Literaria** - a real-time collaborative brainstorming platform.

## 📚 Documentation Overview

This documentation provides complete coverage of the system architecture, implementation details, and deployment procedures.

---

## 🗂️ Table of Contents

### Core Documentation

1. **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System Architecture
   - Technology stack overview
   - Project structure
   - Core components and patterns
   - Data flow examples
   - Security architecture
   - Scalability considerations

2. **[VOTING_ALGORITHM.md](./VOTING_ALGORITHM.md)** - Voting Algorithm
   - Core algorithm functions
   - Multi-round tiebreaker logic
   - Detailed scenarios and examples
   - Vote validation
   - State management across rounds
   - Performance characteristics

3. **[DATABASE.md](./DATABASE.md)** - Database Schema & Models
   - Complete schema documentation
   - Table relationships
   - Model implementations (Active Record pattern)
   - Database queries and indexes
   - Transactions and migrations
   - Performance optimization

4. **[SOCKET_EVENTS.md](./SOCKET_EVENTS.md)** - Real-Time Communication
   - Socket.IO configuration
   - Complete event reference
   - Session, idea, and vote events
   - Room management
   - Event flow diagrams
   - Best practices and debugging

5. **[APPLICATION_FLOW.md](./APPLICATION_FLOW.md)** - Application Flow
   - Complete 9-screen journey
   - Screen-by-screen breakdown
   - User actions and validations
   - Real-time updates
   - Error scenarios
   - Mobile responsiveness

6. **[SECURITY.md](./SECURITY.md)** - Security Documentation
   - Authentication and authorization
   - Session security
   - Input validation
   - Vulnerability analysis
   - Security headers
   - Best practices and recommendations

7. **[API_REFERENCE.md](./API_REFERENCE.md)** - API Reference
   - REST API endpoints
   - Socket.IO events quick reference
   - Request/response formats
   - Authentication flow
   - Error codes
   - Testing examples

8. **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Deployment Guide
   - Prerequisites and setup
   - Development environment
   - Production deployment
   - Nginx configuration
   - SSL/TLS setup
   - Process management with PM2
   - Monitoring and logging
   - Backup and recovery

9. **[TESTING_BACKEND.md](./TESTING_BACKEND.md)** - Backend Testing
   - Test framework setup (Vitest)
   - Unit tests (models, services)
   - Integration tests (API endpoints)
   - Test utilities and helpers
   - Running and debugging tests
   - 460 tests with 100% pass rate

10. **[TESTING_FRONTEND.md](./TESTING_FRONTEND.md)** - Frontend Testing
   - Test framework setup (Vitest + React Testing Library)
   - Component tests (Button, TextArea, etc.)
   - Service tests (socketService)
   - Testing best practices
   - Running and debugging tests
   - 78 tests with 96.15% coverage

---

## 🚀 Quick Start Guides

### For Developers

**First Time Setup**:
```bash
# 1. Clone repository
git clone <repository-url>
cd jam-literaria

# 2. Install dependencies
cd server && npm install
cd ../app && npm install

# 3. Configure environment
cd ../server
cp .env.example .env
# Edit .env with your settings

# 4. Initialize database
npm run reset-db

# 5. Start servers
# Terminal 1
cd server && npm run dev

# Terminal 2
cd app && npm run dev

# 6. Access application
# Open http://localhost:5173
```

**See**: [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed setup

**Running Tests**:
```bash
# Backend tests (460 tests, 84% coverage)
cd server && npm test

# Frontend tests (78 tests, 96% coverage)
cd app && npm test

# Watch mode (for development)
npm run test:watch

# Coverage report
npm run test:coverage
```

**See**: [TESTING_BACKEND.md](./TESTING_BACKEND.md) and [TESTING_FRONTEND.md](./TESTING_FRONTEND.md) for complete testing guides

### For Operators

**Production Deployment**:
```bash
# See detailed deployment guide
# docs/DEPLOYMENT.md

# Quick overview:
1. Install Node.js 22+, Nginx, PM2
2. Clone repo to /var/www/jam-literaria
3. Build frontend (npm run build:production)
4. Configure Nginx reverse proxy
5. Setup SSL with Let's Encrypt
6. Start with PM2
7. Configure backups and monitoring
```

**See**: [DEPLOYMENT.md](./DEPLOYMENT.md) for complete guide

---

## 🏗️ Architecture at a Glance

```
┌─────────────────────────────────────────────────────────┐
│                      CLIENT (React)                      │
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │   Pages     │  │  Components  │  │    Context     │ │
│  │ - Login     │  │ - Voting     │  │ - Auth         │ │
│  │ - Home      │  │ - Results    │  │ - Socket       │ │
│  │ - Session   │  │ - Ideas      │  └────────────────┘ │
│  └─────────────┘  └──────────────┘                      │
│         │                  │                             │
│         └──────────┬───────┘                             │
│                    ▼                                     │
│         ┌─────────────────────┐                         │
│         │  Services (API)     │                         │
│         │  - axios            │                         │
│         │  - socket.io-client │                         │
│         └─────────────────────┘                         │
└─────────────────────┬───────────────────────────────────┘
                      │
                      │ HTTP/WebSocket
                      │
┌─────────────────────▼───────────────────────────────────┐
│                   SERVER (Node.js)                       │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐ │
│  │   Routes     │  │  Controllers │  │   Services    │ │
│  │ - /api/auth  │  │ - auth       │  │ - voting      │ │
│  │ - /api/sess  │  │ - session    │  │ - session     │ │
│  │ - /api/ideas │  │ - idea       │  │ - idea        │ │
│  │ - /api/votes │  │ - vote       │  │ - vote        │ │
│  └──────────────┘  └──────────────┘  └───────────────┘ │
│                                                          │
│  ┌──────────────────────────────────────────────────┐  │
│  │         Socket.IO Event Handlers                 │  │
│  │  - sessionHandlers  - ideaHandlers               │  │
│  │  - voteHandlers                                  │  │
│  └──────────────────────────────────────────────────┘  │
│                           │                             │
│                           ▼                             │
│  ┌──────────────────────────────────────────────────┐  │
│  │              Models (Active Record)              │  │
│  │  - User  - Session  - Idea  - Vote              │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────┐
         │   SQLite Database      │
         │  - users               │
         │  - sessions            │
         │  - ideas               │
         │  - votes               │
         │  - session_metadata    │
         └────────────────────────┘
```

**See**: [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed architecture

---

## 🔄 Application Flow Overview

```
1. Login              → User enters name
   ↓
2. Home               → Create or join session
   ↓
3. Session Waiting    → Participants gather
   ↓
4. Idea Submission    → Submit 2-3 ideas
   ↓
5. Post-Ideas Wait    → Admin reviews, starts voting
   ↓
6. Voting Screen      → Vote for best ideas
   ↓
   ├─→ Round Complete → Process votes
   │                    ↓
   │              ┌─────┴─────┐
   │              │           │
   │         Ties?            No Ties?
   │              │           │
   │              ▼           ▼
   │    7. New Round    8. Results
   │              │
   │              └─→ (Repeat until 3 winners)
   │
   └─→ 9. New Session (Optional)
```

**See**: [APPLICATION_FLOW.md](./APPLICATION_FLOW.md) for detailed flow

---

## 🗳️ Voting Algorithm Overview

The core innovation of Jam Literaria is its sophisticated multi-round voting algorithm:

**Goal**: Select exactly 3 winning ideas democratically

**Process**:
1. **Initial Round**: Vote for 3 ideas (typically)
2. **Process Results**: Identify clear winners and ties
3. **If Ties**: Create new round with only tied candidates
4. **Adjust Votes**: Calculate required votes based on candidates
5. **Repeat**: Until 3 winners are selected

**Example**:
```
Round 1: 8 ideas → Vote for 3
Results: Ideas A, B (3 votes each), C, D, E, F (2 votes each)

Action: Select A, B as winners
        New round with C, D, E, F (4 candidates, 1 slot remaining)

Round 2: 4 candidates → Vote for 1
Results: Idea C (3 votes), D, E, F (1 vote each)

Action: Select C as final winner
Final Winners: A, B, C ✅
```

**See**: [VOTING_ALGORITHM.md](./VOTING_ALGORITHM.md) for complete algorithm details

---

## 🔐 Security Overview

**Current Security Features**:
- ✅ Session-based authentication with HTTP-only cookies
- ✅ SQL injection prevention (prepared statements)
- ✅ XSS prevention (React auto-escaping)
- ✅ CORS configuration
- ✅ Anonymous voting (privacy)
- ✅ Double vote prevention
- ✅ Owner-only operations

**Known Limitations**:
- ❌ No password authentication (name-based only)
- ❌ No rate limiting
- ❌ Socket auth trusts client-provided userId
- ❌ No security headers (helmet.js)

**See**: [SECURITY.md](./SECURITY.md) for detailed security analysis

---

## 📊 Database Schema Overview

**Tables**:
1. **users** - User accounts
2. **sessions** - Session lifecycle
3. **session_participants** - User-session relationships
4. **ideas** - Submitted ideas
5. **votes** - Vote tracking (multi-round)
6. **session_metadata** - Additional session state

**Key Relationships**:
```
User (1) ──── owns ──────> Session (1)
User (N) ──── participates ──> Session (N)  [Many-to-Many]
User (1) ──── authors ────> Idea (N)
User (1) ──── casts ─────> Vote (N)
Idea (1) ──── receives ──> Vote (N)
Session (1) ──── has ────> Idea (N)
Session (1) ──── has ────> Vote (N)
```

**See**: [DATABASE.md](./DATABASE.md) for complete schema

---

## 🔌 API Overview

### REST API Endpoints

**Authentication**:
- `POST /api/auth/login` - Create session
- `POST /api/auth/logout` - End session
- `GET /api/auth/me` - Get current user

**Sessions**:
- `POST /api/sessions` - Create session
- `GET /api/sessions/:id` - Get session details
- `POST /api/sessions/join` - Join by code
- `POST /api/sessions/:id/start` - Start session
- `DELETE /api/sessions/:id` - Delete session

**Ideas**:
- `POST /api/sessions/:id/ideas` - Submit idea
- `GET /api/sessions/:id/ideas` - Get all ideas

**Votes**:
- `POST /api/sessions/:id/votes` - Submit vote
- `GET /api/sessions/:id/votes` - Get vote counts

### Socket.IO Events (Primary)

**Session**: `join-session`, `start-session`, `start-voting`
**Ideas**: `submit-idea`, `get-ideas`
**Votes**: `submit-votes`, `get-user-vote-status`

**See**: [API_REFERENCE.md](./API_REFERENCE.md) and [SOCKET_EVENTS.md](./SOCKET_EVENTS.md)

---

## 📦 Technology Stack Summary

| Layer | Technology | Version |
|-------|-----------|---------|
| **Frontend** | React | 19.1+ |
| **Build Tool** | Vite | 6.3+ |
| **Backend** | Node.js | 22+ |
| **Framework** | Express.js | 4.18+ |
| **Real-time** | Socket.IO | 4.7+ |
| **Database** | SQLite | 5.0+ |
| **Process Manager** | PM2 | Latest |
| **Web Server** | Nginx | Latest |
| **i18n** | react-i18next | 15.5+ |

**See**: [ARCHITECTURE.md](./ARCHITECTURE.md) for detailed tech stack

---

## 🎯 Use Cases

### Educational Settings
- Classroom brainstorming sessions
- Student project idea selection
- Workshop facilitation
- Creative writing exercises

### Business Applications
- Product ideation sessions
- Feature prioritization
- Team building activities
- Innovation workshops

### Event Management
- Conference session selection
- Hackathon idea voting
- Community decision making
- Game jam topic selection

---

## 🐛 Troubleshooting

### Common Issues

**Application won't start**:
→ See [DEPLOYMENT.md](./DEPLOYMENT.md#troubleshooting)

**WebSocket connection failed**:
→ See [DEPLOYMENT.md](./DEPLOYMENT.md#websocket-connection-failed)

**Double voting issue**:
→ See [SECURITY.md](./SECURITY.md#3-double-voting-fixed)

**Database locked error**:
→ See [DEPLOYMENT.md](./DEPLOYMENT.md#database-locked)

---

## 🤝 Contributing

### Development Workflow

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Read relevant documentation
4. Make changes following existing patterns
5. **Test thoroughly** (run `npm test` in server/)
6. Commit: `git commit -m 'Add amazing feature'`
7. Push: `git push origin feature/amazing-feature`
8. Create Pull Request

### Testing Requirements

All contributions must include tests:
- **Backend changes**: Add unit/integration tests
- **Frontend changes**: Add component/service tests
- **Run tests**: `cd server && npm test` or `cd app && npm test`
- **Ensure 100% pass rate**: All 538+ tests must pass
- **See**: [TESTING_BACKEND.md](./TESTING_BACKEND.md) and [TESTING_FRONTEND.md](./TESTING_FRONTEND.md) for testing guides

### Documentation Updates

When adding features, update relevant docs:
- Architecture changes → `ARCHITECTURE.md`
- New API endpoints → `API_REFERENCE.md`
- Database changes → `DATABASE.md`
- New screens → `APPLICATION_FLOW.md`
- Security impacts → `SECURITY.md`
- New tests → `TESTING_BACKEND.md`

---

## 📞 Support

**Documentation Issues**: Create issue with `documentation` label
**Bug Reports**: Use bug report template
**Feature Requests**: Use feature request template
**Security Issues**: See [SECURITY.md](./SECURITY.md#security-contact)

---

## 📜 License

ISC License - See [LICENSE](../LICENSE) file for details

---

## 🙏 Acknowledgments

Built with modern web technologies and best practices. Special thanks to:
- Socket.IO team for excellent real-time communication
- React team for the powerful UI framework
- SQLite team for the reliable embedded database
- All contributors and users of Jam Literaria

---

## 📚 Additional Resources

### External Documentation
- [React Documentation](https://react.dev/)
- [Vite Documentation](https://vitejs.dev/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [Express.js Documentation](https://expressjs.com/)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)

### Related Project Documentation
- Main README: [../README.md](../README.md)
- Frontend Deployment: [../app/DEPLOYMENT.md](../app/DEPLOYMENT.md)
- Vote State Recovery Fix: [../VOTE_STATE_RECOVERY_FIX.md](../VOTE_STATE_RECOVERY_FIX.md)

---

<div align="center">

**Complete Documentation Coverage**

This documentation set provides comprehensive coverage of all aspects of Jam Literaria, from high-level architecture to low-level implementation details.

**Last Updated**: 2025-01-18

</div>
