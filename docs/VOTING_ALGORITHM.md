# Voting Algorithm Documentation

## Overview

The voting algorithm is the core of Jam Literaria's democratic idea selection process. It implements a sophisticated multi-round tiebreaker system that ensures exactly 3 ideas are selected fairly through iterative voting rounds.

**Location**: [server/services/votingService.js](../server/services/votingService.js)

## Algorithm Goals

1. Select exactly **3 winning ideas** from all submitted ideas
2. Handle ties democratically through additional voting rounds
3. Minimize the number of voting rounds needed
4. Ensure fairness by selecting clear winners first
5. Adapt vote requirements based on remaining candidates

## Core Functions

### 1. calculateRequiredVotes(ideaCount)

**Purpose**: Determine how many votes each participant must cast based on available ideas.

**Location**: [votingService.js:10-20](../server/services/votingService.js:10-20)

```javascript
function calculateRequiredVotes(ideaCount) {
  if (ideaCount >= 4) return 3;  // Normal voting: choose 3 out of many
  if (ideaCount === 3) return 2;  // Tiebreaker: choose 2 out of 3
  if (ideaCount === 2) return 1;  // Final tiebreaker: choose 1 out of 2
  return 0;                       // Only 1 idea left (no vote needed)
}
```

**Logic**:
- **≥4 ideas**: Vote for 3 (normal democratic process)
- **3 ideas**: Vote for 2 (prevents deadlock in tiebreaker)
- **2 ideas**: Vote for 1 (simple majority)
- **1 idea**: No vote needed (automatic selection)

**Important**: In subsequent rounds, this is limited by remaining winner slots:
```javascript
const requiredVotes = Math.min(calculateRequiredVotes(ideaCount), remainingSlots);
```

### 2. processVotingRound(sessionId, round)

**Purpose**: Process votes after a round completes and determine next action.

**Location**: [votingService.js:28-141](../server/services/votingService.js:28-141)

**Process**:
1. Get vote results for the current round
2. Transform into idea format with vote counts
3. Get accumulated winners from previous rounds
4. Call `determinarAccionSiguiente()` to determine next step
5. Update session status and metadata based on action

**Returns**:
```javascript
{
  action: 'COMPLETE' | 'NEW_ROUND',
  selectedIdeas: [...],           // Final winners (if COMPLETE)
  candidateIdeas: [...],          // Ideas for next round (if NEW_ROUND)
  requiredVotes: number,          // Votes needed in new round
  accumulatedWinners: [...],      // Winners selected so far
  message: string
}
```

### 3. determinarAccionSiguiente(ideas, currentWinnerCount)

**Purpose**: Core decision algorithm that determines whether voting is complete or needs another round.

**Location**: [votingService.js:149-229](../server/services/votingService.js:149-229)

**Parameters**:
- `ideas`: Array of `{id, content, votos, autorId}`
- `currentWinnerCount`: Number of winners already selected in previous rounds (0-2)

**Algorithm Flow**:

```
1. Calculate remaining slots (3 - currentWinnerCount)
   ↓
2. Group ideas by vote count (descending order)
   ↓
3. Iterate through vote groups, trying to fill slots
   ↓
4. For each group:
   - If entire group fits → Add as clear winners
   - If group exceeds slots → Mark as tied candidates, stop
   ↓
5. Determine action based on results:
   - Clear winners + tied candidates → AGREGAR_GANADORES
   - Clear winners, no ties → FINALIZAR
   - Only tied candidates → NUEVA_RONDA
```

**Possible Actions**:

1. **FINALIZAR** - Voting complete
   - All 3 winners selected
   - No more voting needed
   - Session status → COMPLETED

2. **AGREGAR_GANADORES** - Add winners, continue with new round
   - Some clear winners identified
   - Remaining ideas are tied
   - Add winners to accumulated list
   - New round with only tied candidates

3. **NUEVA_RONDA** - Tiebreaker round needed
   - All remaining candidates are tied
   - No clear winners in this round
   - Keep accumulated winners
   - Vote again on tied candidates

### 4. agruparIdeasPorVotos(ideas)

**Purpose**: Group ideas by their vote count for analysis.

**Location**: [votingService.js:236-244](../server/services/votingService.js:236-244)

```javascript
function agruparIdeasPorVotos(ideas) {
  return ideas.reduce((grupos, idea) => {
    if (!grupos[idea.votos]) {
      grupos[idea.votos] = [];
    }
    grupos[idea.votos].push(idea);
    return grupos;
  }, {});
}
```

**Returns**:
```javascript
{
  5: [idea1, idea2],      // 2 ideas with 5 votes each
  3: [idea3],             // 1 idea with 3 votes
  2: [idea4, idea5, idea6] // 3 ideas with 2 votes each
}
```

## Detailed Scenarios

### Scenario 1: Clear Winners (No Ties)

**Initial State**: 6 ideas submitted, 5 participants

**Round 1 Results**:
```
Idea A: 4 votes
Idea B: 3 votes
Idea C: 2 votes
Idea D: 1 vote
Idea E: 1 vote
Idea F: 0 votes
```

**Algorithm Decision**:
- Group by votes: {4: [A], 3: [B], 2: [C], 1: [D, E], 0: [F]}
- Select top 3: A (4), B (3), C (2)
- No ties for slots
- **Action**: FINALIZAR with [A, B, C]

**Result**: Voting complete in 1 round ✓

---

### Scenario 2: Simple Tie (3-way for 3rd place)

**Initial State**: 8 ideas, 5 participants

**Round 1 Results**:
```
Idea A: 3 votes
Idea B: 3 votes
Idea C: 2 votes
Idea D: 2 votes
Idea E: 2 votes
Idea F: 1 vote
Idea G: 1 vote
Idea H: 1 vote
```

**Algorithm Decision**:
- Group: {3: [A, B], 2: [C, D, E], 1: [F, G, H]}
- Top 2 winners: A, B (both have 3 votes)
- Remaining slot: 1
- Next group has 3 candidates (C, D, E) for 1 slot → TIE
- **Action**: AGREGAR_GANADORES
  - Winners: [A, B]
  - Candidates: [C, D, E]

**Round 2 Setup**:
- 3 candidates, 1 slot remaining
- Required votes: min(2, 1) = 1 vote per person

**Round 2 Results**:
```
Idea C: 3 votes
Idea D: 1 vote
Idea E: 1 vote
```

**Algorithm Decision**:
- Group: {3: [C], 1: [D, E]}
- Clear winner: C
- **Action**: FINALIZAR with [C] (added to [A, B])

**Final Winners**: A, B, C
**Total Rounds**: 2 ✓

---

### Scenario 3: Complete Tie (All Equal Votes)

**Initial State**: 6 ideas, 4 participants

**Round 1 Results**:
```
All ideas: 2 votes each
```

**Algorithm Decision**:
- Group: {2: [all 6 ideas]}
- Need 3 winners, but 6 candidates tied
- **Action**: NUEVA_RONDA
  - Candidates: all 6 ideas

**Round 2 Setup**:
- 6 candidates, 3 slots
- Required votes: 3

**Round 2 Results**:
```
Idea A: 3 votes
Idea B: 3 votes
Idea C: 2 votes
Idea D: 2 votes
Idea E: 1 vote
Idea F: 1 vote
```

**Algorithm Decision**:
- Group: {3: [A, B], 2: [C, D], 1: [E, F]}
- Top 2: A, B
- Remaining slot: 1
- Next group: [C, D] → 2 candidates for 1 slot → TIE
- **Action**: AGREGAR_GANADORES
  - Winners: [A, B]
  - Candidates: [C, D]

**Round 3 Setup**:
- 2 candidates, 1 slot
- Required votes: 1

**Round 3 Results**:
```
Idea C: 3 votes
Idea D: 1 vote
```

**Algorithm Decision**:
- Clear winner: C
- **Action**: FINALIZAR with [C]

**Final Winners**: A, B, C
**Total Rounds**: 3 ✓

---

### Scenario 4: Cascading Ties

**Initial State**: 10 ideas, 6 participants

**Round 1 Results**:
```
Idea A: 4 votes
Idea B: 2 votes
Idea C: 2 votes
Idea D: 2 votes
Idea E: 2 votes
(others: 1-0 votes)
```

**Algorithm Decision**:
- Group: {4: [A], 2: [B, C, D, E], ...}
- Top winner: A
- Remaining slots: 2
- Next group: 4 candidates for 2 slots → TIE
- **Action**: AGREGAR_GANADORES
  - Winners: [A]
  - Candidates: [B, C, D, E]

**Round 2 Setup**:
- 4 candidates, 2 slots
- Required votes: 2

**Round 2 Results**:
```
Idea B: 4 votes
Idea C: 3 votes
Idea D: 2 votes
Idea E: 2 votes
```

**Algorithm Decision**:
- Group: {4: [B], 3: [C], 2: [D, E]}
- Top 2 winners: B, C
- Remaining slots: 0
- **Action**: FINALIZAR with [B, C]

**Final Winners**: A, B, C
**Total Rounds**: 2 ✓

---

### Scenario 5: Edge Case - Exactly 3 Ideas

**Initial State**: 3 ideas, 5 participants

**Round 1 Results**:
```
Idea A: 3 votes
Idea B: 1 vote
Idea C: 1 vote
```

**Algorithm Decision**:
- Only 3 ideas total
- Group: {3: [A], 1: [B, C]}
- Top winner: A
- Remaining: 2 slots, but B and C are tied
- **Action**: AGREGAR_GANADORES
  - Winners: [A]
  - Candidates: [B, C]

**Round 2 Setup**:
- 2 candidates, 2 slots (but we only need to pick 2)
- Required votes: 1 (not 2, because only 2 candidates)

**Actually, if we have 2 candidates for 2 slots**:
- Both can be selected!
- **Action**: FINALIZAR with [B, C]

**Final Winners**: A, B, C
**Total Rounds**: 2 ✓

---

## Vote Validation

### Server-Side Checks

**Location**: [voteHandlers.js:18-141](../server/socket/voteHandlers.js:18-141)

1. **Session Validation**
   ```javascript
   const session = sessionService.getSessionById(sessionId);
   if (!session) throw new Error('Session not found');
   ```

2. **Status Check**
   ```javascript
   if (session.status !== SESSION_STATUS.VOTING)
     throw new Error('Not in voting phase');
   ```

3. **Duplicate Vote Prevention**
   ```javascript
   const hasVoted = Vote.hasUserVotedInRound(userId, sessionId, round);
   if (hasVoted) throw new Error('Already voted');
   ```

4. **Vote Count Validation**
   ```javascript
   if (ideaIds.length !== requiredVotes)
     throw new Error(`Must select exactly ${requiredVotes} ideas`);
   ```

5. **Idea Existence**
   - Implicitly checked by database foreign key constraint
   - Ideas must belong to the session

### Client-Side Validation

**Location**: [VotingScreen.jsx](../app/src/components/VotingScreen.jsx)

1. **Selection Limit**
   ```javascript
   if (newSelection.size < requiredVotes) {
     newSelection.add(ideaId);
   }
   ```

2. **Submit Button State**
   ```javascript
   disabled={selectedIdeas.size !== requiredVotes || submitting}
   ```

3. **Post-Vote State**
   ```javascript
   if (hasVoted) {
     // Show waiting screen, prevent re-voting
   }
   ```

## State Management Across Rounds

### Session Metadata

**Stored in** `session_metadata` **table**:

```javascript
{
  ideas_elegidas: [id1, id2],        // Accumulated winners
  ideas_candidatas: [id3, id4, id5], // Current round candidates
  mensaje_ronda: "Round 2 tiebreaker",
  required_votes: 2                   // Votes needed this round
}
```

**Updated After Each Round**:
- `ideas_elegidas`: Append new winners
- `ideas_candidatas`: Set to tied candidates
- `required_votes`: Calculate for new candidate set
- `mensaje_ronda`: Update with round info

### Round Tracking

**In** `sessions` **table**:
```javascript
{
  current_round: 0  // Incremented for each new voting round
}
```

**Vote Table**:
```javascript
{
  round: 0,  // Links vote to specific round
  // Unique constraint: (user_id, idea_id, round, session_id)
}
```

This ensures:
- Users can vote again in new rounds
- Previous round votes are preserved
- Vote history is maintained

## Algorithm Guarantees

### Termination Guarantee

The algorithm **always terminates** because:

1. **Decreasing Candidate Pool**: Each round reduces or maintains candidate count
2. **Vote Differentiation**: Statistical likelihood of different vote distributions
3. **Minimum Viable Round**: 2 candidates with 1 vote each → 1 winner selected
4. **Maximum Rounds**: Theoretically unbounded, practically ≤ 3-4 rounds

### Fairness Guarantee

The algorithm is **fair** because:

1. **Democratic**: All participants vote equally
2. **Anonymous**: Ideas evaluated on merit, not author
3. **Transparent**: Clear winners selected before tiebreakers
4. **Consistent**: Same rules applied to all ideas
5. **No Bias**: Deterministic algorithm based solely on votes

### Correctness Guarantee

The algorithm **always selects exactly 3 ideas** because:

1. **Accumulation**: Winners are accumulated across rounds
2. **Remaining Slots**: Always tracked (3 - accumulated)
3. **Termination Condition**: Stops when 3 winners selected
4. **Exhaustive Coverage**: All voting scenarios handled

## Performance Characteristics

### Time Complexity

**Per Vote**:
- O(1) - Insert into database
- O(N) - Check if all participants voted (N = participant count)

**Per Round Processing**:
- O(M) - Get vote counts (M = idea count)
- O(M log M) - Sort ideas by votes
- O(M) - Group ideas by vote count
- O(G) - Iterate through vote groups (G = unique vote counts, G ≤ M)

**Overall**: O(M log M) per round

### Space Complexity

**Vote Storage**:
- O(N × V) where N = participants, V = votes per participant
- Typical: 5 participants × 3 votes = 15 vote records per round

**Metadata Storage**:
- O(M) for storing idea IDs in candidates/winners arrays
- Stored as JSON strings in database

## Future Enhancements

### Potential Improvements

1. **Weighted Voting**: Give more weight to certain participants
2. **Ranked Choice**: Allow ranking ideas instead of binary selection
3. **Threshold-Based**: Auto-select ideas above certain vote threshold
4. **Time Limits**: Auto-finalize if voting takes too long
5. **Partial Results**: Show anonymized progress during voting
6. **Vote Delegation**: Allow participants to delegate their votes
7. **Multiple Winner Sets**: Select top N idea sets, not just 3 ideas

### Algorithm Variants

1. **Approval Voting**: Vote for any number of ideas
2. **Borda Count**: Rank all ideas, points based on position
3. **Condorcet Method**: Pairwise comparisons between ideas
4. **Score Voting**: Rate each idea on a scale
5. **STAR Voting**: Score then automatic runoff

### Performance Optimizations

1. **Caching**: Cache vote counts during active voting
2. **Incremental Processing**: Update results as votes come in
3. **Predictive Termination**: Predict if ties are likely, adjust requiredVotes
4. **Parallel Processing**: Process multiple sessions concurrently
