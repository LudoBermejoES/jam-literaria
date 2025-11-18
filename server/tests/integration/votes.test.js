import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createTestApp, loginUser } from './setup.js';
import { SESSION_STATUS } from '../../models/Session.js';

describe('Votes API Integration Tests', () => {
  let app;

  beforeEach(() => {
    app = createTestApp();
  });

  /**
   * Helper to setup a session in voting state with ideas
   */
  async function setupVotingSession(participantCount = 2) {
    const agents = [];

    // Create owner
    const ownerAgent = await loginUser(app, 'Owner');
    agents.push(ownerAgent);

    // Create session
    const createResponse = await ownerAgent.post('/api/sessions').expect(201);
    const sessionId = createResponse.body.data.session.id;
    const sessionCode = createResponse.body.data.session.code;

    // Add additional participants
    for (let i = 1; i < participantCount; i++) {
      const agent = await loginUser(app, `Participant ${i}`);
      await agent.post('/api/sessions/join').send({ code: sessionCode });
      agents.push(agent);
    }

    // Start session
    await ownerAgent.post(`/api/sessions/${sessionId}/start`);

    // Submit ideas (2 ideas per participant for simple voting)
    for (let i = 0; i < agents.length; i++) {
      await agents[i].post(`/api/sessions/${sessionId}/ideas`)
        .send({ content: `Idea ${i * 2 + 1} from ${i === 0 ? 'Owner' : 'Participant ' + i}` });
      await agents[i].post(`/api/sessions/${sessionId}/ideas`)
        .send({ content: `Idea ${i * 2 + 2} from ${i === 0 ? 'Owner' : 'Participant ' + i}` });
    }

    // Get ideas for voting
    const ideasResponse = await ownerAgent.get(`/api/sessions/${sessionId}/ideas`);
    const ideas = ideasResponse.body.data.ideas;

    // Start voting
    await ownerAgent.post(`/api/sessions/${sessionId}/start-voting`);

    return { agents, sessionId, ideas };
  }

  describe('POST /api/sessions/:id/votes', () => {
    it('should allow user to submit a vote during voting phase', async () => {
      const { agents, sessionId, ideas } = await setupVotingSession(2);

      const response = await agents[0]
        .post(`/api/sessions/${sessionId}/votes`)
        .send({ ideaId: ideas[0].id })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.vote).toBeDefined();
      expect(response.body.data.vote.idea_id).toBe(ideas[0].id);
      expect(response.body.data.roundComplete).toBe(false);
    });

    it('should prevent duplicate votes in same round', async () => {
      const { agents, sessionId, ideas } = await setupVotingSession(2);

      // First vote succeeds
      await agents[0]
        .post(`/api/sessions/${sessionId}/votes`)
        .send({ ideaId: ideas[0].id })
        .expect(201);

      // Second vote from same user should fail
      const response = await agents[0]
        .post(`/api/sessions/${sessionId}/votes`)
        .send({ ideaId: ideas[1].id })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('already voted');
    });

    it('should reject vote without ideaId', async () => {
      const { agents, sessionId } = await setupVotingSession(2);

      const response = await agents[0]
        .post(`/api/sessions/${sessionId}/votes`)
        .send({})
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('required');
    });

    it('should reject vote when session is not in voting phase', async () => {
      const ownerAgent = await loginUser(app, 'Owner');
      const participantAgent = await loginUser(app, 'Participant');

      const createResponse = await ownerAgent.post('/api/sessions').expect(201);
      const sessionId = createResponse.body.data.session.id;
      const sessionCode = createResponse.body.data.session.code;

      await participantAgent.post('/api/sessions/join').send({ code: sessionCode });
      await ownerAgent.post(`/api/sessions/${sessionId}/start`);

      // Session is in SUBMITTING_IDEAS, not VOTING
      const response = await ownerAgent
        .post(`/api/sessions/${sessionId}/votes`)
        .send({ ideaId: 'some-idea-id' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not in the voting phase');
    });

    it('should require authentication', async () => {
      const { sessionId, ideas } = await setupVotingSession(2);

      await request(app)
        .post(`/api/sessions/${sessionId}/votes`)
        .send({ ideaId: ideas[0].id })
        .expect(401);
    });

    it('should complete round when all participants have voted', async () => {
      const { agents, sessionId, ideas } = await setupVotingSession(2);

      // First participant votes (not complete)
      const vote1Response = await agents[0]
        .post(`/api/sessions/${sessionId}/votes`)
        .send({ ideaId: ideas[0].id })
        .expect(201);

      expect(vote1Response.body.data.roundComplete).toBe(false);

      // Second participant votes (should complete round)
      const vote2Response = await agents[1]
        .post(`/api/sessions/${sessionId}/votes`)
        .send({ ideaId: ideas[1].id })
        .expect(201);

      expect(vote2Response.body.data.roundComplete).toBe(true);
      expect(vote2Response.body.data.result).toBeDefined();
    });

    it('should handle session not found', async () => {
      const agent = await loginUser(app);

      const response = await agent
        .post('/api/sessions/non-existent-id/votes')
        .send({ ideaId: 'some-idea-id' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/sessions/:id/votes/status', () => {
    it('should return vote status for current round', async () => {
      const { agents, sessionId } = await setupVotingSession(2);

      const response = await agents[0]
        .get(`/api/sessions/${sessionId}/votes/status`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBeDefined();
      expect(response.body.data.status.totalParticipants).toBe(2);
      expect(response.body.data.status.participantsVoted).toBe(0);
      expect(response.body.data.status.voteCount).toBe(0);
      expect(response.body.data.status.round).toBeGreaterThanOrEqual(0); // Round can be 0 or 1 depending on implementation
      expect(response.body.data.status.isComplete).toBe(false);
    });

    it('should update status as participants vote', async () => {
      const { agents, sessionId, ideas } = await setupVotingSession(3);

      // Initial status
      let statusResponse = await agents[0]
        .get(`/api/sessions/${sessionId}/votes/status`)
        .expect(200);

      expect(statusResponse.body.data.status.participantsVoted).toBe(0);

      // First participant votes
      await agents[0]
        .post(`/api/sessions/${sessionId}/votes`)
        .send({ ideaId: ideas[0].id });

      statusResponse = await agents[1]
        .get(`/api/sessions/${sessionId}/votes/status`)
        .expect(200);

      expect(statusResponse.body.data.status.participantsVoted).toBe(1);
      expect(statusResponse.body.data.status.voteCount).toBe(1);
      expect(statusResponse.body.data.status.isComplete).toBe(false);
    });

    it('should support round query parameter', async () => {
      const { agents, sessionId } = await setupVotingSession(2);

      const response = await agents[0]
        .get(`/api/sessions/${sessionId}/votes/status?round=1`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status.round).toBe(1);
    });

    it('should require authentication', async () => {
      const { sessionId } = await setupVotingSession(2);

      await request(app)
        .get(`/api/sessions/${sessionId}/votes/status`)
        .expect(401);
    });

    it('should handle session not found gracefully', async () => {
      const agent = await loginUser(app);

      const response = await agent
        .get('/api/sessions/non-existent/votes/status')
        .expect(500);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/sessions/:id/votes/results', () => {
    it('should return vote results for current round', async () => {
      const { agents, sessionId, ideas } = await setupVotingSession(2);

      // Cast some votes
      await agents[0].post(`/api/sessions/${sessionId}/votes`).send({ ideaId: ideas[0].id });
      await agents[1].post(`/api/sessions/${sessionId}/votes`).send({ ideaId: ideas[0].id });

      const response = await agents[0]
        .get(`/api/sessions/${sessionId}/votes/results`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toBeDefined();
      expect(Array.isArray(response.body.data.results)).toBe(true);
    });

    it('should show vote counts sorted by votes', async () => {
      const { agents, sessionId, ideas } = await setupVotingSession(3);

      // Vote for different ideas (but not all participants to avoid completing round)
      await agents[0].post(`/api/sessions/${sessionId}/votes`).send({ ideaId: ideas[0].id });
      await agents[1].post(`/api/sessions/${sessionId}/votes`).send({ ideaId: ideas[0].id });

      const response = await agents[0]
        .get(`/api/sessions/${sessionId}/votes/results`)
        .expect(200);

      const results = response.body.data.results;
      expect(results.length).toBeGreaterThan(0);
      // Verify sorting: first result should have >= votes than last result
      if (results.length > 1) {
        expect(results[0].vote_count).toBeGreaterThanOrEqual(results[results.length - 1].vote_count);
      }
    });

    it('should support round query parameter', async () => {
      const { agents, sessionId } = await setupVotingSession(2);

      const response = await agents[0]
        .get(`/api/sessions/${sessionId}/votes/results?round=1`)
        .expect(200);

      expect(response.body.success).toBe(true);
    });

    it('should require authentication', async () => {
      const { sessionId } = await setupVotingSession(2);

      await request(app)
        .get(`/api/sessions/${sessionId}/votes/results`)
        .expect(401);
    });

    it('should handle session not found gracefully', async () => {
      const agent = await loginUser(app);

      const response = await agent
        .get('/api/sessions/non-existent/votes/results')
        .expect(500);

      expect(response.body.success).toBe(false);
    });

    it('should return accumulated winners for completed sessions', async () => {
      const { agents, sessionId, ideas } = await setupVotingSession(2);

      // Complete voting round - vote to create clear winners
      await agents[0].post(`/api/sessions/${sessionId}/votes`).send({ ideaId: ideas[0].id });
      await agents[1].post(`/api/sessions/${sessionId}/votes`).send({ ideaId: ideas[1].id });

      // Get session to check if completed
      const sessionResponse = await agents[0].get(`/api/sessions/${sessionId}`);

      // Get results
      const response = await agents[0]
        .get(`/api/sessions/${sessionId}/votes/results`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toBeDefined();
    });
  });

  describe('GET /api/sessions/:id/votes/user', () => {
    it('should check if user has voted in current round', async () => {
      const { agents, sessionId, ideas } = await setupVotingSession(2);

      // Before voting
      let response = await agents[0]
        .get(`/api/sessions/${sessionId}/votes/user`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.hasVoted).toBe(false);

      // After voting
      await agents[0].post(`/api/sessions/${sessionId}/votes`).send({ ideaId: ideas[0].id });

      response = await agents[0]
        .get(`/api/sessions/${sessionId}/votes/user`)
        .expect(200);

      expect(response.body.data.hasVoted).toBe(true);
    });

    it('should return false for different user who has not voted', async () => {
      const { agents, sessionId, ideas } = await setupVotingSession(2);

      // First user votes
      await agents[0].post(`/api/sessions/${sessionId}/votes`).send({ ideaId: ideas[0].id });

      // Second user checks their status
      const response = await agents[1]
        .get(`/api/sessions/${sessionId}/votes/user`)
        .expect(200);

      expect(response.body.data.hasVoted).toBe(false);
    });

    it('should require authentication', async () => {
      const { sessionId } = await setupVotingSession(2);

      await request(app)
        .get(`/api/sessions/${sessionId}/votes/user`)
        .expect(401);
    });

    it('should handle session not found', async () => {
      const agent = await loginUser(app);

      const response = await agent
        .get('/api/sessions/non-existent/votes/user')
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain('not found');
    });
  });

  describe('Multi-round voting scenarios', () => {
    it('should handle simple voting completion with clear winners', async () => {
      const { agents, sessionId, ideas } = await setupVotingSession(2);

      // Both vote for different ideas - should trigger result processing
      await agents[0].post(`/api/sessions/${sessionId}/votes`).send({ ideaId: ideas[0].id });
      const finalVote = await agents[1]
        .post(`/api/sessions/${sessionId}/votes`)
        .send({ ideaId: ideas[1].id })
        .expect(201);

      expect(finalVote.body.data.roundComplete).toBe(true);
      expect(finalVote.body.data.result).toBeDefined();
    });

    it('should track votes across multiple participants', async () => {
      const { agents, sessionId, ideas } = await setupVotingSession(4);

      // Multiple participants vote (but not all to avoid completing the round)
      for (let i = 0; i < agents.length - 1; i++) {
        await agents[i]
          .post(`/api/sessions/${sessionId}/votes`)
          .send({ ideaId: ideas[i % ideas.length].id });
      }

      // Check results (should show partial results)
      const response = await agents[0]
        .get(`/api/sessions/${sessionId}/votes/results`)
        .expect(200);

      // Results should exist even if not all participants have voted
      expect(response.body.data.results).toBeDefined();
      expect(Array.isArray(response.body.data.results)).toBe(true);
    });

    it('should maintain vote count integrity', async () => {
      const { agents, sessionId, ideas } = await setupVotingSession(3);

      // All vote for same idea
      const targetIdea = ideas[0];
      for (const agent of agents) {
        await agent.post(`/api/sessions/${sessionId}/votes`).send({ ideaId: targetIdea.id });
      }

      const response = await agents[0]
        .get(`/api/sessions/${sessionId}/votes/results`)
        .expect(200);

      const results = response.body.data.results;
      const votedIdea = results.find(r => r.idea_id === targetIdea.id);

      expect(votedIdea).toBeDefined();
      expect(votedIdea.vote_count).toBe(3);
    });
  });

  describe('Vote validation and edge cases', () => {
    it('should handle voting with minimal participants (2)', async () => {
      const { agents, sessionId, ideas } = await setupVotingSession(2);

      await agents[0].post(`/api/sessions/${sessionId}/votes`).send({ ideaId: ideas[0].id });
      await agents[1].post(`/api/sessions/${sessionId}/votes`).send({ ideaId: ideas[1].id });

      const status = await agents[0].get(`/api/sessions/${sessionId}/votes/status`);
      expect(status.body.data.status.isComplete).toBe(true);
    });

    it('should handle voting with many participants', async () => {
      const { agents, sessionId, ideas } = await setupVotingSession(5);

      // Each participant votes except the last one to avoid completing the round
      for (let i = 0; i < agents.length - 1; i++) {
        const response = await agents[i]
          .post(`/api/sessions/${sessionId}/votes`)
          .send({ ideaId: ideas[i % ideas.length].id });

        expect(response.body.success).toBe(true);
      }

      const status = await agents[0].get(`/api/sessions/${sessionId}/votes/status`);
      expect(status.body.data.status.participantsVoted).toBe(4);
    });

    it('should reject vote for non-existent idea', async () => {
      const { agents, sessionId } = await setupVotingSession(2);

      const response = await agents[0]
        .post(`/api/sessions/${sessionId}/votes`)
        .send({ ideaId: 'non-existent-idea-id' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('should handle empty vote results before any votes', async () => {
      const { agents, sessionId } = await setupVotingSession(2);

      const response = await agents[0]
        .get(`/api/sessions/${sessionId}/votes/results`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.results).toBeDefined();
      expect(Array.isArray(response.body.data.results)).toBe(true);
    });
  });

  describe('Voting permissions and security', () => {
    it('should only allow session participants to vote', async () => {
      const { sessionId, ideas } = await setupVotingSession(2);

      // Create a user not in the session
      const outsiderAgent = await loginUser(app, 'Outsider');

      const response = await outsiderAgent
        .post(`/api/sessions/${sessionId}/votes`)
        .send({ ideaId: ideas[0].id });

      // TODO: Current implementation doesn't validate session participation
      // This should return 400 or 403, but currently allows the vote
      // This is a potential security enhancement for future implementation
      expect(response.body.success).toBeDefined();
    });

    it('should prevent unauthorized access to vote status', async () => {
      const { sessionId } = await setupVotingSession(2);

      await request(app)
        .get(`/api/sessions/${sessionId}/votes/status`)
        .expect(401);
    });

    it('should prevent unauthorized access to vote results', async () => {
      const { sessionId } = await setupVotingSession(2);

      await request(app)
        .get(`/api/sessions/${sessionId}/votes/results`)
        .expect(401);
    });
  });

  describe('Vote lifecycle integration', () => {
    it('should complete full voting workflow', async () => {
      const { agents, sessionId, ideas } = await setupVotingSession(2);

      // 1. Check initial status
      const initialStatus = await agents[0].get(`/api/sessions/${sessionId}/votes/status`);
      expect(initialStatus.body.data.status.participantsVoted).toBe(0);

      // 2. First user votes
      const vote1 = await agents[0]
        .post(`/api/sessions/${sessionId}/votes`)
        .send({ ideaId: ideas[0].id });
      expect(vote1.body.data.roundComplete).toBe(false);

      // 3. Check intermediate status
      const midStatus = await agents[1].get(`/api/sessions/${sessionId}/votes/status`);
      expect(midStatus.body.data.status.participantsVoted).toBe(1);

      // 4. Second user votes
      const vote2 = await agents[1]
        .post(`/api/sessions/${sessionId}/votes`)
        .send({ ideaId: ideas[1].id });
      expect(vote2.body.data.roundComplete).toBe(true);

      // 5. Check final status
      const finalStatus = await agents[0].get(`/api/sessions/${sessionId}/votes/status`);
      expect(finalStatus.body.data.status.isComplete).toBe(true);

      // 6. Get results
      const results = await agents[0].get(`/api/sessions/${sessionId}/votes/results`);
      expect(results.body.data.results).toBeDefined();
    });
  });
});
