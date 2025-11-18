import { test, expect } from '@playwright/test';

test.describe('Multi-User Collaboration', () => {
  test('should handle multiple users in same session', async ({ browser }) => {
    // Create two browser contexts (two different users)
    const ownerContext = await browser.newContext();
    const participantContext = await browser.newContext();

    const ownerPage = await ownerContext.newPage();
    const participantPage = await participantContext.newPage();

    let sessionCode;

    try {
      // ==========================================
      // OWNER: LOGIN AND CREATE SESSION
      // ==========================================
      await test.step('Owner logs in and creates session', async () => {
        await ownerPage.goto('/');

        // Login as owner
        const nameInput = ownerPage.getByPlaceholder(/enter your name|nombre/i);
        await nameInput.fill('Session Owner');

        const loginButton = ownerPage.getByRole('button', { name: /continue|continuar/i });
        await loginButton.click();

        await ownerPage.waitForURL(/\/(home|inicio)/);

        // Create session
        const createButton = ownerPage.getByRole('button', { name: /create.*session|crear.*sesión/i });
        await createButton.click();

        await ownerPage.waitForURL(/\/session\/[a-zA-Z0-9]+/);

        // Get session code
        const url = ownerPage.url();
        const match = url.match(/\/session\/([a-zA-Z0-9]+)/);
        sessionCode = match ? match[1] : null;

        expect(sessionCode).toBeTruthy();
        console.log(`Owner created session: ${sessionCode}`);

        // Wait for waiting screen
        await expect(ownerPage.getByText(/waiting.*participants|esperando/i)).toBeVisible({ timeout: 10000 });
      });

      // ==========================================
      // PARTICIPANT: LOGIN AND JOIN SESSION
      // ==========================================
      await test.step('Participant logs in and joins session', async () => {
        await participantPage.goto('/');

        // Login as participant
        const nameInput = participantPage.getByPlaceholder(/enter your name|nombre/i);
        await nameInput.fill('Participant User');

        const loginButton = participantPage.getByRole('button', { name: /continue|continuar/i });
        await loginButton.click();

        await participantPage.waitForURL(/\/(home|inicio)/);

        // Join session using code
        const codeInput = participantPage.getByPlaceholder(/session.*code|código/i);
        await expect(codeInput).toBeVisible();
        await codeInput.fill(sessionCode);

        const joinButton = participantPage.getByRole('button', { name: /join|unirse/i });
        await joinButton.click();

        // Wait for session page
        await participantPage.waitForURL(/\/session\/[a-zA-Z0-9]+/, { timeout: 10000 });

        console.log('Participant joined session');

        // Both users should see waiting screen
        await expect(participantPage.getByText(/waiting.*participants|esperando/i)).toBeVisible();
      });

      // ==========================================
      // VERIFY BOTH USERS SEE EACH OTHER
      // ==========================================
      await test.step('Verify participants see each other', async () => {
        // Owner should see participant
        await expect(ownerPage.getByText(/Participant User/i)).toBeVisible({ timeout: 5000 });

        // Participant should see owner
        await expect(participantPage.getByText(/Session Owner/i)).toBeVisible({ timeout: 5000 });

        console.log('Both users can see each other in the session');
      });

      // ==========================================
      // OWNER STARTS SESSION
      // ==========================================
      await test.step('Owner starts the session', async () => {
        const startButton = ownerPage.getByRole('button', { name: /start.*session|iniciar/i });
        await expect(startButton).toBeVisible();
        await startButton.click();

        // Both users should transition to idea submission
        await expect(ownerPage.getByText(/submit.*ideas?|enviar.*ideas?/i)).toBeVisible({ timeout: 10000 });
        await expect(participantPage.getByText(/submit.*ideas?|enviar.*ideas?/i)).toBeVisible({ timeout: 10000 });

        console.log('Session started - both users in idea submission phase');
      });

      // ==========================================
      // BOTH USERS SUBMIT IDEAS
      // ==========================================
      await test.step('Both users submit ideas', async () => {
        // Owner submits ideas
        const ownerIdeaInput = ownerPage.locator('textarea').first();
        await ownerIdeaInput.fill('Owner idea 1: Build a time machine');
        await ownerPage.getByRole('button', { name: /submit|enviar|add/i }).first().click();
        await ownerPage.waitForTimeout(500);

        await ownerIdeaInput.fill('Owner idea 2: Create flying cars');
        await ownerPage.getByRole('button', { name: /submit|enviar|add/i }).first().click();
        await ownerPage.waitForTimeout(500);

        console.log('Owner submitted 2 ideas');

        // Participant submits ideas
        const participantIdeaInput = participantPage.locator('textarea').first();
        await participantIdeaInput.fill('Participant idea 1: Invent teleportation');
        await participantPage.getByRole('button', { name: /submit|enviar|add/i }).first().click();
        await participantPage.waitForTimeout(500);

        await participantIdeaInput.fill('Participant idea 2: Design space elevator');
        await participantPage.getByRole('button', { name: /submit|enviar|add/i }).first().click();
        await participantPage.waitForTimeout(500);

        console.log('Participant submitted 2 ideas');
      });

      // ==========================================
      // VERIFY ALL IDEAS ARE VISIBLE TO BOTH
      // ==========================================
      await test.step('Verify all ideas are visible', async () => {
        // Owner should see all 4 ideas
        await expect(ownerPage.getByText(/time machine/i)).toBeVisible();
        await expect(ownerPage.getByText(/flying cars/i)).toBeVisible();
        await expect(ownerPage.getByText(/teleportation/i)).toBeVisible();
        await expect(ownerPage.getByText(/space elevator/i)).toBeVisible();

        // Participant should see all 4 ideas
        await expect(participantPage.getByText(/time machine/i)).toBeVisible();
        await expect(participantPage.getByText(/flying cars/i)).toBeVisible();
        await expect(participantPage.getByText(/teleportation/i)).toBeVisible();
        await expect(participantPage.getByText(/space elevator/i)).toBeVisible();

        console.log('All ideas visible to both users');
      });

      // ==========================================
      // START VOTING
      // ==========================================
      await test.step('Owner starts voting phase', async () => {
        const startVotingButton = ownerPage.getByRole('button', { name: /start.*vot/i });
        await expect(startVotingButton).toBeVisible({ timeout: 15000 });
        await startVotingButton.click();

        // Both users transition to voting
        await expect(ownerPage.getByText(/vote.*ideas?|votar/i)).toBeVisible({ timeout: 10000 });
        await expect(participantPage.getByText(/vote.*ideas?|votar/i)).toBeVisible({ timeout: 10000 });

        console.log('Voting phase started for both users');
      });

      // ==========================================
      // BOTH USERS VOTE
      // ==========================================
      await test.step('Both users cast their votes', async () => {
        // Owner votes
        const ownerCheckboxes = ownerPage.locator('input[type="checkbox"]');
        const ownerCount = await ownerCheckboxes.count();
        const ownerVotes = Math.min(3, ownerCount);

        for (let i = 0; i < ownerVotes; i++) {
          await ownerCheckboxes.nth(i).check();
        }

        const ownerSubmitButton = ownerPage.getByRole('button', { name: /submit.*vote|enviar.*voto/i });
        await ownerSubmitButton.click();

        console.log(`Owner voted for ${ownerVotes} ideas`);

        // Participant votes
        const participantCheckboxes = participantPage.locator('input[type="checkbox"]');
        const participantCount = await participantCheckboxes.count();
        const participantVotes = Math.min(3, participantCount);

        for (let i = 0; i < participantVotes; i++) {
          await participantCheckboxes.nth(i).check();
        }

        const participantSubmitButton = participantPage.getByRole('button', { name: /submit.*vote|enviar.*voto/i });
        await participantSubmitButton.click();

        console.log(`Participant voted for ${participantVotes} ideas`);

        // Wait for vote processing
        await ownerPage.waitForTimeout(3000);
      });

      // ==========================================
      // VERIFY RESULTS OR NEXT ROUND
      // ==========================================
      await test.step('Verify both users see results or next round', async () => {
        // Check what state both users are in
        const ownerHasResults = await ownerPage.getByText(/results|resultados|winners/i).isVisible({ timeout: 5000 }).catch(() => false);
        const participantHasResults = await participantPage.getByText(/results|resultados|winners/i).isVisible({ timeout: 5000 }).catch(() => false);

        // Both should be in same state
        expect(ownerHasResults).toBe(participantHasResults);

        if (ownerHasResults) {
          console.log('Both users reached results page');

          // Take screenshots
          await ownerPage.screenshot({ path: 'e2e/screenshots/owner-results.png', fullPage: true });
          await participantPage.screenshot({ path: 'e2e/screenshots/participant-results.png', fullPage: true });
        } else {
          console.log('Both users may be in next voting round or waiting');

          // Take screenshots of current state
          await ownerPage.screenshot({ path: 'e2e/screenshots/owner-post-vote.png', fullPage: true });
          await participantPage.screenshot({ path: 'e2e/screenshots/participant-post-vote.png', fullPage: true });
        }
      });

      // ==========================================
      // VERIFY REAL-TIME SYNC
      // ==========================================
      await test.step('Verify real-time synchronization', async () => {
        // Both pages should have the same URL
        const ownerUrl = ownerPage.url();
        const participantUrl = participantPage.url();

        expect(ownerUrl).toBe(participantUrl);

        console.log('Both users synchronized on same page');
      });

    } finally {
      // Cleanup
      await ownerPage.close();
      await participantPage.close();
      await ownerContext.close();
      await participantContext.close();

      console.log('Multi-user collaboration test completed');
    }
  });
});
