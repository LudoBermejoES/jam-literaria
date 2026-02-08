import { test, expect } from '@playwright/test';

test.describe('Complete Session Flow - Multi User', () => {
  test.beforeAll(() => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🎬 STARTING E2E TEST SUITE: Complete Session Flow (Multi-User)');
    console.log('═══════════════════════════════════════════════════════');
  });

  test('should complete full session flow with two users', async ({ browser }) => {
    console.log('🚀 Starting E2E test: Complete Multi-User Session Flow');

    // Create two browser contexts for two different users
    const ownerContext = await browser.newContext();
    const participantContext = await browser.newContext();

    const ownerPage = await ownerContext.newPage();
    const participantPage = await participantContext.newPage();

    let sessionCode;

    try {
      // ==========================================
      // STEP 1: OWNER LOGIN AND CREATE SESSION
      // ==========================================
      await test.step('Owner logs in and creates session', async () => {
        console.log('👤 Owner: Logging in...');
        await ownerPage.goto('/');

        await expect(ownerPage).toHaveTitle(/Jam Literaria/);

        const nameInput = ownerPage.getByPlaceholder(/enter your name|nombre/i);
        await nameInput.fill('Session Owner');

        const loginButton = ownerPage.getByRole('button', { name: /continue|continuar|join now/i });
        await loginButton.click();

        await ownerPage.waitForSelector('text=/Welcome to Jam Literaria/i');
        console.log('✅ Owner logged in');

        // Create session
        console.log('📝 Owner: Creating session...');
        const createButton = ownerPage.getByRole('button', { name: /create.*session|crear.*sesión/i });
        await createButton.click();

        await ownerPage.waitForURL(/\/session\/[a-zA-Z0-9]+/);

        // Get session code from page
        const sessionCodeElement = await ownerPage.locator('[class*="session-code"], [class*="code"]').first();
        sessionCode = await sessionCodeElement.textContent();
        sessionCode = sessionCode.trim();

        console.log(`✅ Session created with code: ${sessionCode}`);

        // Verify waiting for participants
        await expect(ownerPage.getByText(/waiting.*participants|esperando.*participantes/i)).toBeVisible({ timeout: 10000 });
      });

      // ==========================================
      // STEP 2: PARTICIPANT JOINS SESSION
      // ==========================================
      await test.step('Participant joins session', async () => {
        console.log('👤 Participant: Logging in...');
        await participantPage.goto('/');

        const nameInput = participantPage.getByPlaceholder(/enter your name|nombre/i);
        await nameInput.fill('Participant User');

        const loginButton = participantPage.getByRole('button', { name: /continue|continuar|join now/i });
        await loginButton.click();

        await participantPage.waitForSelector('text=/Welcome to Jam Literaria/i');
        console.log('✅ Participant logged in');

        // Join session using code
        console.log(`🔗 Participant: Joining session with code ${sessionCode}...`);
        const codeInput = participantPage.getByPlaceholder(/session.*code|código/i);
        await codeInput.fill(sessionCode);

        const joinButton = participantPage.getByRole('button', { name: /join.*session|unirse/i });
        await joinButton.click();

        // Wait for session page
        await participantPage.waitForURL(/\/session\/[a-zA-Z0-9]+/, { timeout: 10000 });
        console.log('✅ Participant joined session');

        // Verify participant sees waiting state
        await expect(participantPage.getByText(/waiting.*participants|esperando.*participantes/i)).toBeVisible({ timeout: 10000 });
      });

      // ==========================================
      // STEP 3: OWNER STARTS SESSION
      // ==========================================
      await test.step('Owner starts the session', async () => {
        console.log('▶️  Owner: Starting session...');

        // Wait a bit for participant to be registered
        await ownerPage.waitForTimeout(1000);

        const startButton = ownerPage.getByRole('button', { name: /start.*session|iniciar.*sesión/i });

        // Verify button is enabled (should be now with 2 participants)
        await expect(startButton).toBeEnabled({ timeout: 5000 });
        await startButton.click();

        console.log('✅ Session started');

        // Both users should see idea submission phase
        await expect(ownerPage.getByText(/submit.*ideas?|enviar.*ideas?/i)).toBeVisible({ timeout: 10000 });
        await expect(participantPage.getByText(/submit.*ideas?|enviar.*ideas?/i)).toBeVisible({ timeout: 10000 });
      });

      // ==========================================
      // STEP 4: BOTH USERS SUBMIT IDEAS
      // ==========================================
      await test.step('Both users submit ideas', async () => {
        console.log('💡 Users: Submitting ideas...');

        // Owner submits ideas
        const ownerIdeaInput = ownerPage.locator('textarea').first();
        await ownerIdeaInput.fill('Owner idea 1');
        let submitButton = ownerPage.getByRole('button', { name: /submit|enviar|add|añadir/i }).first();
        await submitButton.click();
        await ownerPage.waitForTimeout(500);

        await ownerIdeaInput.fill('Owner idea 2');
        submitButton = ownerPage.getByRole('button', { name: /submit|enviar|add|añadir/i }).first();
        await submitButton.click();
        await ownerPage.waitForTimeout(500);

        await ownerIdeaInput.fill('Owner idea 3');
        submitButton = ownerPage.getByRole('button', { name: /submit|enviar|add|añadir/i }).first();
        await submitButton.click();

        console.log('✅ Owner submitted 3 ideas');

        // Participant submits ideas
        const participantIdeaInput = participantPage.locator('textarea').first();
        await participantIdeaInput.fill('Participant idea 1');
        let participantSubmitButton = participantPage.getByRole('button', { name: /submit|enviar|add|añadir/i }).first();
        await participantSubmitButton.click();
        await participantPage.waitForTimeout(500);

        await participantIdeaInput.fill('Participant idea 2');
        participantSubmitButton = participantPage.getByRole('button', { name: /submit|enviar|add|añadir/i }).first();
        await participantSubmitButton.click();
        await participantPage.waitForTimeout(500);

        await participantIdeaInput.fill('Participant idea 3');
        participantSubmitButton = participantPage.getByRole('button', { name: /submit|enviar|add|añadir/i }).first();
        await participantSubmitButton.click();

        console.log('✅ Participant submitted 3 ideas');

        // Mark as done
        const ownerDoneButton = ownerPage.getByRole('button', { name: /done|listo|finish|finalizar/i });
        await ownerDoneButton.click();

        const participantDoneButton = participantPage.getByRole('button', { name: /done|listo|finish|finalizar/i });
        await participantDoneButton.click();

        console.log('✅ Both users marked ideas as done');
      });

      // ==========================================
      // STEP 5: VOTING PHASE
      // ==========================================
      await test.step('Voting phase', async () => {
        console.log('🗳️  Users: Voting on ideas...');

        // Wait for voting phase
        await expect(ownerPage.getByText(/vote|votar/i)).toBeVisible({ timeout: 15000 });
        await expect(participantPage.getByText(/vote|votar/i)).toBeVisible({ timeout: 15000 });

        // Vote on ideas (both users vote on first 3 ideas they see)
        const ownerVoteButtons = await ownerPage.getByRole('button', { name: /vote|votar/i }).all();
        for (let i = 0; i < Math.min(3, ownerVoteButtons.length); i++) {
          await ownerVoteButtons[i].click();
          await ownerPage.waitForTimeout(300);
        }

        const participantVoteButtons = await participantPage.getByRole('button', { name: /vote|votar/i }).all();
        for (let i = 0; i < Math.min(3, participantVoteButtons.length); i++) {
          await participantVoteButtons[i].click();
          await participantPage.waitForTimeout(300);
        }

        console.log('✅ Both users voted');
      });

      // ==========================================
      // STEP 6: RESULTS
      // ==========================================
      await test.step('View results', async () => {
        console.log('🏆 Checking results...');

        // Wait for results screen (timeout longer as counting might take time)
        await expect(ownerPage.getByText(/results|resultados|winners?|ganador/i)).toBeVisible({ timeout: 20000 });
        await expect(participantPage.getByText(/results|resultados|winners?|ganador/i)).toBeVisible({ timeout: 20000 });

        console.log('✅ Results displayed to both users');
      });

      console.log('✅ Complete multi-user session flow test passed!');

    } finally {
      // Cleanup
      await ownerPage.close();
      await participantPage.close();
      await ownerContext.close();
      await participantContext.close();
    }
  });
});
