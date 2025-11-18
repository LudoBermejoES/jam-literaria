# Application Flow and Screens Documentation

## Overview

Jam Literaria guides users through a 9-screen journey from login to final results, with branching paths for session owners (admins) and participants.

```
     ┌─────────┐
     │ 1.Login │
     └────┬────┘
          │
     ┌────▼────┐
     │ 2. Home │
     └─┬─────┬─┘
       │     │
  Create  Join
       │     │
   ┌───▼─┐ ┌▼────┐
   │ 3a  │ │ 3b  │ Session
   │Admin│ │Part.│ Waiting
   └─┬───┘ └─┬───┘
     │       │
     └───┬───┘
         │
    ┌────▼────┐
    │ 4. Ideas│ Submission
    └────┬────┘
         │
    ┌────▼────┐
    │5.Post-  │ Ideas
    │  Ideas  │ Waiting
    └─┬─────┬─┘
      │     │
   Admin  Part.
      │     │
      └──┬──┘
         │
    ┌────▼────┐
    │6.Voting │
    └────┬────┘
         │
    ┌────▼────┐
    │7. Vote  │ Counting
    │ Counting│
    └─┬─────┬─┘
      │     │
   Round    │
   Again    │
      │     │
      └─────┤
            │
       ┌────▼────┐
       │8.Results│
       └────┬────┘
            │
       ┌────▼────┐
       │9. New   │ Session
       │ Session │ (Optional)
       └─────────┘
```

---

## 1. Login Screen

**File**: [app/src/pages/Login.jsx](../app/src/pages/Login.jsx)
**Route**: `/login`
**Access**: Public

### Purpose
Entry point for all users to identify themselves.

### UI Components
- App title and description
- Name input field
- "Continue" button
- Language selector (EN/ES)

### User Actions
1. Enter name in text field
2. Click "Continue"

### Validation
- Name must not be empty
- Name can be duplicated (UUIDs prevent conflicts)
- No special character restrictions

### State Management
```javascript
const [name, setName] = useState('');
const [error, setError] = useState('');
const [isLoading, setIsLoading] = useState(false);
```

### API Call
```javascript
POST /api/auth/login
Body: { name: "John Doe" }
Response: {
  success: true,
  data: {
    user: { id: "uuid", name: "John Doe", ... }
  }
}
```

### Success Flow
1. User created in database
2. User stored in AuthContext
3. Session cookie set
4. Redirect to `/` (Home)

### Error Handling
- Network errors → Show error message
- Empty name → Client-side validation
- Server errors → Display error, allow retry

### Code Reference
Key logic at [Login.jsx:45-75](../app/src/pages/Login.jsx)

---

## 2. Home Screen

**File**: [app/src/pages/Home.jsx](../app/src/pages/Home.jsx)
**Route**: `/`
**Access**: Protected (requires login)

### Purpose
Main navigation hub for creating or joining sessions.

### UI Components
- Welcome message with user name
- "Create New Session" button
- "Join Existing Session" section
  - Session code input
  - "Join" button
- List of user's active sessions (optional)

### User Actions

#### Option A: Create Session
1. Click "Create New Session"
2. API creates session
3. User becomes session owner
4. Navigate to session waiting room

#### Option B: Join Session
1. Enter 6-character session code
2. Click "Join"
3. Validate code exists
4. Add user as participant
5. Navigate to session waiting room

### State Management
```javascript
const [sessionCode, setSessionCode] = useState('');
const [isCreating, setIsCreating] = useState(false);
const [isJoining, setIsJoining] = useState(false);
const [error, setError] = useState('');
```

### API Calls

**Create Session**:
```javascript
POST /api/sessions
Response: {
  success: true,
  data: {
    session: { id: "uuid", code: "ABC123", ... }
  }
}
```

**Join Session**:
```javascript
POST /api/sessions/join
Body: { code: "ABC123" }
Response: {
  success: true,
  data: { session: { ... } }
}
```

### Success Flow

**After Create**:
```
Home → API call → Navigate to /session/:sessionId
```

**After Join**:
```
Home → Validate code → Join session → Navigate to /session/:sessionId
```

### Error Handling
- Invalid session code → "Session not found"
- Session already started → "Cannot join in-progress session"
- Network errors → Display error, allow retry

---

## 3. Session Waiting Room

**File**: [app/src/pages/Session.jsx](../app/src/pages/Session.jsx)
**Route**: `/session/:sessionId`
**Access**: Protected (participants only)

### Purpose
Pre-session lobby where participants gather before starting.

### UI Components (Both Roles)
- Session code (prominent display)
- Participant list (real-time updates)
- "Back to Home" button

### UI Components (Admin Only)
- "Copy Session Link" button
- "Start Session" button (disabled until ≥2 participants)
- "Delete Session" button
- Participant count warning if < 2

### State Management
```javascript
const [session, setSession] = useState(null);
const [participants, setParticipants] = useState([]);
const [isAdmin, setIsAdmin] = useState(false);
const [isLoading, setIsLoading] = useState(true);
const [error, setError] = useState('');
```

### Real-Time Updates (Socket.IO)

**On Mount**:
```javascript
// Join session room
socket.emit('join-session', { sessionId });

// Listen for updates
socket.on('session-state', handleSessionState);
socket.on('user-joined', handleUserJoined);
socket.on('user-left', handleUserLeft);
socket.on('session-started', handleSessionStarted);
```

**Event Handlers**:
```javascript
handleUserJoined(data) {
  // Add to participants list
  setParticipants(prev => [...prev, { id: data.userId, name: data.userName }]);
}

handleUserLeft(data) {
  // Remove from participants list
  setParticipants(prev => prev.filter(p => p.id !== data.userId));
}

handleSessionStarted(data) {
  // Navigate to idea submission
  navigate(`/session/${sessionId}/ideas`);
}
```

### Admin Actions

#### Copy Session Link
```javascript
const shareUrl = `${window.location.origin}/join/${session.code}`;
await navigator.clipboard.writeText(shareUrl);
// Show success notification
```

#### Start Session
```javascript
// Validate ≥2 participants
if (participants.length < 2) return;

// API call
const response = await sessionService.startSession(sessionId);

// Socket will broadcast to all participants
// All users navigate to /session/:sessionId/ideas
```

#### Delete Session
```javascript
// Confirm with user
if (!confirm('Delete this session?')) return;

// API call
await sessionService.deleteSession(sessionId);

// Navigate to home
navigate('/');
```

### Participant Experience
- See participant list update in real-time
- Wait for admin to start
- Automatic navigation when session starts

### Code Reference
Session logic at [Session.jsx:22-78](../app/src/pages/Session.jsx)
Socket handlers at [Session.jsx:80-114](../app/src/pages/Session.jsx)
Admin controls at [Session.jsx:264-298](../app/src/pages/Session.jsx)

---

## 4. Idea Submission Screen

**File**: [app/src/components/IdeaSubmission.jsx](../app/src/components/IdeaSubmission.jsx)
**Route**: `/session/:sessionId/ideas`
**Access**: Protected (session participants, status: SUBMITTING_IDEAS)

### Purpose
Collect creative ideas from all participants.

### UI Components
- Instructions: "Submit 2-3 ideas"
- Multiple text areas (expandable)
- Character counter (optional)
- "Submit Idea" button for each
- Progress indicator: "2/3 ideas submitted"
- "Done Submitting" button (when min ideas reached)

### Constraints
- **Min Ideas**: 2 per user
- **Max Ideas**: 3 per user (configurable via `maxIdeasPerUser`)
- **Content**: Required, cannot be empty
- **Length**: Unlimited (frontend could add limit)

### State Management
```javascript
const [ideas, setIdeas] = useState(['', '', '']);
const [submittedCount, setSubmittedCount] = useState(0);
const [maxIdeas, setMaxIdeas] = useState(3);
const [isSubmitting, setIsSubmitting] = useState(false);
const [error, setError] = useState(null);
```

### User Flow
1. Type idea in text area
2. Click "Submit" for that idea
3. Idea grayed out/disabled
4. Repeat for 2-3 ideas total
5. Click "Done Submitting"

### Socket Events

**Submit Idea**:
```javascript
socket.emit('submit-idea', {
  sessionId,
  content: ideaText
});

// Success
socket.on('idea-submitted', (data) => {
  // Update submitted count
  // Show confirmation
});

// Error
socket.on('error', (error) => {
  // Show error message
  // Allow retry
});
```

**Get Submission Count**:
```javascript
// Check how many ideas user has submitted
const count = await ideaService.getIdeaCountForUser(sessionId, userId);
setSubmittedCount(count);
```

### Validation
- **Client**: Check not empty before submit
- **Server**:
  - Validate session status
  - Check user hasn't exceeded max ideas
  - Check content is not empty

### Completion
When user clicks "Done Submitting":
1. Verify min ideas met (2)
2. Navigate to `/session/:sessionId/post-ideas`
3. Wait for other participants

### Anonymous Submission
- Ideas stored with `author_id` in database
- Not displayed with author during voting
- Admin can see authors for moderation

---

## 5. Post-Ideas Waiting Screen

**File**: [app/src/components/PostIdeasWaiting.jsx](../app/src/components/PostIdeasWaiting.jsx)
**Route**: `/session/:sessionId/post-ideas`
**Access**: Protected (participants only)

### Purpose
Transition phase between idea submission and voting.

### UI Components (Participants)
- "Waiting for voting to begin" message
- Loading indicator
- List of participants who submitted ideas (optional)

### UI Components (Admin)
- "Idea Submission Progress" display
  - "5/5 participants submitted ideas"
- Preview of all ideas (with authors)
- "Start Voting" button
- Option to review/moderate ideas

### State Management
```javascript
const [session, setSession] = useState(null);
const [ideas, setIdeas] = useState([]);
const [isOwner, setIsOwner] = useState(false);
const [allSubmitted, setAllSubmitted] = useState(false);
```

### Real-Time Updates
```javascript
socket.on('idea-submitted', (data) => {
  // Update progress: X/N participants submitted
  updateSubmissionProgress();
});

socket.on('voting-started', (data) => {
  // Navigate to voting screen
  navigate(`/session/${sessionId}/voting`);
});
```

### Admin Actions

#### Review Ideas
```javascript
// Get all ideas with authors
socket.emit('get-ideas', { sessionId });

socket.on('ideas', (data) => {
  setIdeas(data.ideas);  // Includes author_name for admin
});
```

#### Start Voting
```javascript
// Admin clicks "Start Voting"
socket.emit('start-voting', { sessionId });

// Server broadcasts to all
// All navigate to /session/:sessionId/voting
```

### Automatic Progression
Some implementations auto-start voting when all submit:
```javascript
if (allParticipantsSubmitted) {
  // Auto-trigger voting phase
  setTimeout(() => {
    startVoting();
  }, 2000);
}
```

---

## 6. Voting Screen

**File**: [app/src/components/VotingScreen.jsx](../app/src/components/VotingScreen.jsx)
**Route**: `/session/:sessionId/voting`
**Access**: Protected (participants only, session status: VOTING)

### Purpose
Democratic selection of best ideas through voting.

### UI Components
- Instructions: "Select exactly N ideas"
- Vote counter: "Selected 2/3"
- Idea cards (grid layout)
  - Idea content
  - Author name (admin only)
  - Selection indicator
  - Checkmark when selected
- "Submit Votes" button (disabled until exactly N selected)

### State Management
```javascript
const [sessionInfo, setSessionInfo] = useState(null);
const [ideas, setIdeas] = useState([]);
const [selectedIdeas, setSelectedIdeas] = useState(new Set());
const [requiredVotes, setRequiredVotes] = useState(3);
const [hasVoted, setHasVoted] = useState(false);
const [submitting, setSubmitting] = useState(false);
const [isOwner, setIsOwner] = useState(false);
```

### Dynamic Required Votes

**First Round**: Vote for 3 ideas (typically)

**Tiebreaker Rounds**: Adjusted based on candidates
- 4+ candidates → Vote for 3
- 3 candidates → Vote for 2
- 2 candidates → Vote for 1

**Received via Socket**:
```javascript
socket.on('voting-started', (data) => {
  setRequiredVotes(data.requiredVotes);
  setIdeas(data.ideas);
});

socket.on('new-voting-round', (data) => {
  setRequiredVotes(data.requiredVotes);  // Updated for new round
  setIdeas(data.candidateIdeas);         // Only tied ideas
  setSelectedIdeas(new Set());           // Reset selection
  setHasVoted(false);                    // Allow voting again
});
```

### Idea Selection Logic

```javascript
const handleIdeaSelect = (ideaId) => {
  if (hasVoted) return;  // Can't change votes

  const newSelection = new Set(selectedIdeas);

  if (newSelection.has(ideaId)) {
    // Deselect if already selected
    newSelection.delete(ideaId);
  } else if (newSelection.size < requiredVotes) {
    // Select if under limit
    newSelection.add(ideaId);
  } else {
    // At limit, can't select more (could implement toggle)
    return;
  }

  setSelectedIdeas(newSelection);
};
```

### Vote Submission

```javascript
const handleSubmitVotes = () => {
  // Validate exact count
  if (selectedIdeas.size !== requiredVotes) return;
  if (hasVoted) return;

  setSubmitting(true);

  // Submit all votes atomically
  const ideaIds = Array.from(selectedIdeas);
  socket.emit('submit-votes', { sessionId, ideaIds });
};

// Server response
socket.on('vote-confirmed', (data) => {
  setHasVoted(true);
  setSubmitting(false);
  // UI changes to "waiting" state
});
```

### State Recovery (Critical!)

**On Mount**:
```javascript
useEffect(() => {
  // Request voting status to recover state
  socket.emit('get-user-vote-status', { sessionId });
}, []);

socket.on('user-vote-status', (data) => {
  setRequiredVotes(data.requiredVotes);

  if (data.hasVoted) {
    // Recover voted state
    setHasVoted(true);
    const votedIds = new Set(data.userVotes.map(v => v.ideaId));
    setSelectedIdeas(votedIds);
  }
});
```

**Why This Matters**:
- User refreshes page during voting
- Socket disconnects and reconnects
- Prevents accidental re-voting
- Shows user their previous selections

### After Voting

**Waiting State UI**:
```javascript
if (hasVoted) {
  return (
    <div className="voted-state">
      <h2>Vote Submitted!</h2>
      <p>Waiting for other participants...</p>
      <div className="your-votes">
        {/* Show selected ideas for confirmation */}
      </div>
    </div>
  );
}
```

### Round Completion

**When all participants vote**, server emits one of:

**A. Voting Complete** (3 winners selected):
```javascript
socket.on('voting-complete', (data) => {
  // Navigate to results
  navigate(`/session/${sessionId}/results`);
});
```

**B. New Round** (tiebreaker needed):
```javascript
socket.on('new-voting-round', (data) => {
  console.log(`Round ${data.round}: ${data.candidateIdeas.length} candidates`);

  // Reset UI for new round
  setIdeas(data.candidateIdeas);
  setRequiredVotes(data.requiredVotes);
  setSelectedIdeas(new Set());
  setHasVoted(false);

  // Show accumulated winners (optional)
  console.log('Winners so far:', data.accumulatedWinners);
});
```

### Admin View

**Additional Info for Admin**:
- See idea authors
- View voting progress
- Cannot skip or force finish

### Code Reference
State recovery: [VotingScreen.jsx:38-135](../app/src/components/VotingScreen.jsx:38-135)
Vote submission: [VotingScreen.jsx:173-181](../app/src/components/VotingScreen.jsx:173-181)

---

## 7. Vote Counting Screen

**File**: [app/src/components/VoteCountingScreen.jsx](../app/src/components/VoteCountingScreen.jsx)
**Route**: `/session/:sessionId/counting`
**Access**: Protected (participants only)

### Purpose
Display voting progress and admin controls for vote processing.

**Note**: This screen is **optional** - many implementations skip directly from voting to results.

### UI Components (Participants)
- "Counting votes..." message
- Progress indicator
- Number of participants who voted

### UI Components (Admin)
- Vote tallies (preliminary results)
- "Process Results" button
- Option to start new round manually
- Option to finalize results

### State Management
```javascript
const [voteCounts, setVoteCounts] = useState([]);
const [votingProgress, setVotingProgress] = useState({ voted: 0, total: 0 });
const [isProcessing, setIsProcessing] = useState(false);
```

### Real-Time Updates
```javascript
socket.on('vote-submitted', (data) => {
  // Update progress counter
  setVotingProgress(prev => ({
    ...prev,
    voted: prev.voted + 1
  }));
});
```

### Admin Actions

**View Results**:
```javascript
socket.emit('get-vote-status', { sessionId });

socket.on('vote-status', (data) => {
  setVoteCounts(data.voteCounts);
  setVotingProgress(data.progress);
});
```

**Process Round**:
- Automatically triggered when all vote
- Admin can view results before finalizing
- System determines if new round needed

---

## 8. Results Screen

**File**: [app/src/components/ResultsScreen.jsx](../app/src/components/ResultsScreen.jsx)
**Route**: `/session/:sessionId/results`
**Access**: Protected (participants only, session status: COMPLETED)

### Purpose
Display final winning ideas with celebration!

### UI Components
- Congratulations message
- Top 3 winning ideas (podium style)
  - 1st place (gold)
  - 2nd place (silver)
  - 3rd place (bronze)
- Each idea shows:
  - Idea content
  - Author name (now revealed)
  - Vote count
  - Placement badge
- "Start New Session" button (admin)
- "Back to Home" button

### State Management
```javascript
const [results, setResults] = useState(null);
const [winningIdeas, setWinningIdeas] = useState([]);
const [isOwner, setIsOwner] = useState(false);
const [loading, setLoading] = useState(true);
```

### Data Fetching

**On Mount**:
```javascript
useEffect(() => {
  // Get final results
  socket.emit('get-vote-results', { sessionId });
}, []);

socket.on('vote-results', (data) => {
  setWinningIdeas(data.results.selectedIdeas);
  setLoading(false);
});
```

**Results Data Structure**:
```javascript
{
  results: {
    selectedIdeas: [
      {
        id: 'uuid-1',
        content: 'Build a real-time voting system',
        author_id: 'user-uuid',
        author_name: 'Jane Doe',
        vote_count: 7
      },
      {
        id: 'uuid-2',
        content: 'Create collaborative brainstorming tool',
        author_id: 'user-uuid-2',
        author_name: 'John Smith',
        vote_count: 5
      },
      {
        id: 'uuid-3',
        content: 'Design multi-round tiebreaker algorithm',
        author_id: 'user-uuid-3',
        author_name: 'Alice Johnson',
        vote_count: 4
      }
    ],
    totalRounds: 2,
    totalVotes: 45
  }
}
```

### UI Layout Example

```
┌───────────────────────────────────────┐
│         🎉 Winners Selected! 🎉       │
├───────────────────────────────────────┤
│                                       │
│           ┌─────────┐                 │
│           │  🥇 #1  │                 │
│           ├─────────┤                 │
│           │ Idea A  │   7 votes       │
│           │ by Jane │                 │
│           └─────────┘                 │
│                                       │
│    ┌─────────┐       ┌─────────┐     │
│    │  🥈 #2  │       │  🥉 #3  │     │
│    ├─────────┤       ├─────────┤     │
│    │ Idea B  │       │ Idea C  │     │
│    │by John  │       │by Alice │     │
│    │ 5 votes │       │ 4 votes │     │
│    └─────────┘       └─────────┘     │
│                                       │
│    [Start New Session] [Back Home]   │
└───────────────────────────────────────┘
```

### Celebration Effects (Optional)
- Confetti animation
- Sound effects
- Animated entrance for winners
- Social sharing options

### Admin Actions

**Start New Session**:
```javascript
const handleNewSession = async () => {
  // Create new session
  const response = await sessionService.createSession();

  // Navigate to new session
  navigate(`/session/${response.data.session.id}`);

  // Optionally invite same participants
};
```

### Statistics Display (Optional)
- Total voting rounds
- Total votes cast
- Participation rate
- Time to completion

---

## 9. New Session (Restart)

**Not a separate screen** - triggered from Results screen

### Purpose
Allow quick restart with same or new participants.

### Options

**Option A**: Create brand new session
```javascript
// Fresh session, new code
const newSession = await sessionService.createSession();
navigate(`/session/${newSession.id}`);
```

**Option B**: Reset current session (not implemented)
```javascript
// Same code, reset state (would need new API)
await sessionService.resetSession(sessionId);
```

---

## Alternative Flows

### Join via Direct Link

**Route**: `/join/:code`
**File**: [app/src/pages/JoinSession.jsx](../app/src/pages/JoinSession.jsx)

**Flow**:
```
User clicks link
  ↓
Extract code from URL
  ↓
Check if logged in
  ↓
If not → Login screen (with code preserved)
  ↓
After login → Auto-join session
  ↓
Navigate to session waiting room
```

### Error Recovery Flows

**Connection Lost**:
```
Socket disconnects
  ↓
Socket.IO auto-reconnect
  ↓
Component re-mounts
  ↓
join-session emitted
  ↓
get-user-vote-status emitted
  ↓
State recovered
```

**Page Refresh**:
```
User refreshes page
  ↓
Protected route checks auth
  ↓
If authenticated → Allow access
  ↓
Component mounts
  ↓
Fetch current session state
  ↓
Recover user's voting status
  ↓
Resume from current state
```

**Session Ended**:
```
Session status changes to COMPLETED
  ↓
Redirect to results screen
  ↓
If results not available → Error screen
```

---

## Navigation Guards

### Protected Routes

**File**: [app/src/components/ProtectedRoute.jsx](../app/src/components/ProtectedRoute.jsx)

```javascript
const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;

  if (!user) {
    // Not authenticated → redirect to login
    return <Navigate to="/login" replace />;
  }

  // Authenticated → allow access
  return <Outlet />;
};
```

### Session Status Guards

**Implemented in components**:

```javascript
useEffect(() => {
  if (session.status === 'WAITING') {
    navigate(`/session/${sessionId}`);
  } else if (session.status === 'SUBMITTING_IDEAS') {
    navigate(`/session/${sessionId}/ideas`);
  } else if (session.status === 'VOTING') {
    navigate(`/session/${sessionId}/voting`);
  } else if (session.status === 'COMPLETED') {
    navigate(`/session/${sessionId}/results`);
  }
}, [session.status]);
```

---

## Mobile Responsiveness

All screens are **mobile-first** designed:

### Key Adaptations

1. **Single Column Layouts**: Stack elements vertically on mobile
2. **Touch-Friendly Targets**: Minimum 44x44px tap targets
3. **Responsive Grids**: Idea cards wrap to single column
4. **Sticky Headers**: Keep session code visible while scrolling
5. **Bottom Navigation**: Action buttons at thumb-reach
6. **Minimal Text Input**: Use textareas for ideas, avoid many form fields

### Breakpoints (Typical)

```css
/* Mobile-first base styles */

@media (min-width: 640px) {
  /* Tablet styles */
}

@media (min-width: 1024px) {
  /* Desktop styles */
  /* Multi-column layouts */
}
```

---

## Internationalization

All text is internationalized via react-i18next:

```javascript
import { useTranslation } from 'react-i18next';

function VotingScreen() {
  const { t } = useTranslation();

  return (
    <div>
      <h2>{t('voting.title')}</h2>
      <p>{t('voting.instructions', { count: requiredVotes })}</p>
    </div>
  );
}
```

**Translation Files**:
- [app/src/i18n/locales/en.json](../app/src/i18n/locales/en.json)
- [app/src/i18n/locales/es.json](../app/src/i18n/locales/es.json)

---

## Error Scenarios

### Session Not Found
```
User navigates to /session/invalid-id
  ↓
API returns 404
  ↓
Show "Session not found" message
  ↓
Provide "Back to Home" button
```

### Not a Participant
```
User tries to access session they didn't join
  ↓
Socket auth fails
  ↓
Show "Access denied" message
  ↓
Redirect to home
```

### Session Already Started
```
User tries to join mid-session
  ↓
API rejects join request
  ↓
Show "Session in progress" message
  ↓
Cannot join
```

### Network Errors
```
API/Socket call fails
  ↓
Show error message
  ↓
Provide "Retry" button
  ↓
Attempt reconnection
```

---

## Performance Optimizations

### Code Splitting

```javascript
import { lazy, Suspense } from 'react';

const VotingScreen = lazy(() => import('./components/VotingScreen'));

<Suspense fallback={<LoadingSpinner />}>
  <VotingScreen />
</Suspense>
```

### Memoization

```javascript
const IdeaCard = React.memo(({ idea, isSelected, onSelect }) => {
  // Only re-render if props change
});
```

### Debouncing Real-Time Updates

```javascript
const debouncedUpdate = useMemo(
  () => debounce((data) => setParticipants(data), 300),
  []
);
```

### Virtual Scrolling (for many ideas)

```javascript
import { FixedSizeList } from 'react-window';

<FixedSizeList
  height={600}
  itemCount={ideas.length}
  itemSize={120}
>
  {({ index, style }) => (
    <IdeaCard idea={ideas[index]} style={style} />
  )}
</FixedSizeList>
```
