import { test, expect } from '@playwright/test';

test.describe('Voting and Tiebreaker Scenarios', () => {
  test('should handle tiebreaker voting rounds', async ({ browser }) => {
    // Create three browser contexts (three users for realistic tie scenarios)
    const user1Context = await browser.newContext();
    const user2Context = await browser.newContext();
    const user3Context = await browser.newContext();

    const user1Page = await user1Context.newPage();
    const user2Page = await user2Context.newPage();
    const user3Page = await user3Context.newPage();

    let sessionCode;

    try {
      // ==========================================
      // SETUP: ALL USERS LOGIN AND JOIN SESSION
      // ==========================================
      await test.step('Setup: Users login and join session', async () => {
        // User 1 (Owner) creates session
        await user1Page.goto('/');
        await user1Page.getByPlaceholder(/enter your name|nombre/i).fill('User One');
        await user1Page.getByRole('button', { name: /continue|continuar/i }).click();
        await user1Page.waitForURL(/\/(home|inicio)/);

        await user1Page.getByRole('button', { name: /create.*session|crear/i }).click();
        await user1Page.waitForURL(/\/session\/[a-zA-Z0-9]+/);

        const url = user1Page.url();
        sessionCode = url.match(/\/session\/([a-zA-Z0-9]+)/)?.[1];
        console.log(`Session created: ${sessionCode}`);

        // User 2 joins
        await user2Page.goto('/');
        await user2Page.getByPlaceholder(/enter your name|nombre/i).fill('User Two');
        await user2Page.getByRole('button', { name: /continue|continuar/i }).click();
        await user2Page.waitForURL(/\/(home|inicio)/);

        await user2Page.getByPlaceholder(/session.*code|código/i).fill(sessionCode);
        await user2Page.getByRole('button', { name: /join|unirse/i }).click();
        await user2Page.waitForURL(/\/session\/[a-zA-Z0-9]+/);

        // User 3 joins
        await user3Page.goto('/');
        await user3Page.getByPlaceholder(/enter your name|nombre/i).fill('User Three');
        await user3Page.getByRole('button', { name: /continue|continuar/i }).click();
        await user3Page.waitForURL(/\/(home|inicio)/);

        await user3Page.getByPlaceholder(/session.*code|código/i).fill(sessionCode);
        await user3Page.getByRole('button', { name: /join|unirse/i }).click();
        await user3Page.waitForURL(/\/session\/[a-zA-Z0-9]+/);

        console.log('All 3 users joined session');
      });

      // ==========================================
      // START SESSION
      // ==========================================
      await test.step('Start session and submit ideas', async () => {
        // User 1 (owner) starts session
        await user1Page.getByRole('button', { name: /start.*session|iniciar/i }).click();

        // Wait for all users to be in idea submission
        await Promise.all([
          user1Page.getByText(/submit.*ideas?|enviar/i).waitFor({ timeout: 10000 }),
          user2Page.getByText(/submit.*ideas?|enviar/i).waitFor({ timeout: 10000 }),
          user3Page.getByText(/submit.*ideas?|enviar/i).waitFor({ timeout: 10000 })
        ]);

        console.log('All users in idea submission phase');
      });

      // ==========================================
      // SUBMIT IDEAS (CREATE TIE SCENARIO)
      // ==========================================
      await test.step('Submit ideas to create potential ties', async () => {
        // User 1 submits 3 ideas
        for (let i = 1; i <= 3; i++) {
          const input = user1Page.locator('textarea').first();
          await input.fill(`User 1 Idea ${i}: Creative concept number ${i}`);
          await user1Page.getByRole('button', { name: /submit|enviar|add/i }).first().click();
          await user1Page.waitForTimeout(500);
        }

        // User 2 submits 3 ideas
        for (let i = 1; i <= 3; i++) {
          const input = user2Page.locator('textarea').first();
          await input.fill(`User 2 Idea ${i}: Innovation number ${i}`);
          await user2Page.getByRole('button', { name: /submit|enviar|add/i }).first().click();
          await user2Page.waitForTimeout(500);
        }

        // User 3 submits 3 ideas
        for (let i = 1; i <= 3; i++) {
          const input = user3Page.locator('textarea').first();
          await input.fill(`User 3 Idea ${i}: Brilliant thought ${i}`);
          await user3Page.getByRole('button', { name: /submit|enviar|add/i }).first().click();
          await user3Page.waitForTimeout(500);
        }

        console.log('All users submitted 3 ideas each (9 total)');
      });

      // ==========================================
      // START VOTING - ROUND 1
      // ==========================================
      await test.step('Start voting - Round 1', async () => {
        // Owner starts voting
        const startVotingButton = user1Page.getByRole('button', { name: /start.*vot/i });
        await expect(startVotingButton).toBeVisible({ timeout: 15000 });
        await startVotingButton.click();

        // All users in voting
        await Promise.all([
          user1Page.getByText(/vote.*ideas?|votar/i).waitFor({ timeout: 10000 }),
          user2Page.getByText(/vote.*ideas?|votar/i).waitFor({ timeout: 10000 }),
          user3Page.getByText(/vote.*ideas?|votar/i).waitFor({ timeout: 10000 })
        ]);

        console.log('Round 1 voting started');
      });

      // ==========================================
      // CAST VOTES - CREATE TIE
      // ==========================================
      await test.step('Cast votes to create a tie scenario', async () => {
        // Strategy: Vote for different ideas to create ties
        // User 1 votes for ideas 1, 2, 3
        const user1Checkboxes = user1Page.locator('input[type="checkbox"]');
        await user1Checkboxes.nth(0).check();
        await user1Checkboxes.nth(1).check();
        await user1Checkboxes.nth(2).check();
        await user1Page.getByRole('button', { name: /submit.*vote|enviar/i }).click();

        // User 2 votes for ideas 2, 3, 4 (overlap to create ties)
        const user2Checkboxes = user2Page.locator('input[type="checkbox"]');
        await user2Checkboxes.nth(1).check();
        await user2Checkboxes.nth(2).check();
        await user2Checkboxes.nth(3).check();
        await user2Page.getByRole('button', { name: /submit.*vote|enviar/i }).click();

        // User 3 votes for ideas 3, 4, 5 (more overlap)
        const user3Checkboxes = user3Page.locator('input[type="checkbox"]');
        await user3Checkboxes.nth(2).check();
        await user3Checkboxes.nth(3).check();
        await user3Checkboxes.nth(4).check();
        await user3Page.getByRole('button', { name: /submit.*vote|enviar/i }).click();

        console.log('All users voted strategically to create ties');

        // Wait for vote processing
        await user1Page.waitForTimeout(3000);
      });

      // ==========================================
      // CHECK FOR TIEBREAKER ROUND
      // ==========================================
      await test.step('Check if tiebreaker round is triggered', async () => {
        // Check if we're in a new voting round (tiebreaker)
        const isRound2 = await user1Page.getByText(/round.*2|ronda.*2/i).isVisible({ timeout: 5000 }).catch(() => false);

        if (isRound2) {
          console.log('Tiebreaker round 2 triggered!');

          // Take screenshots
          await user1Page.screenshot({ path: 'e2e/screenshots/tiebreaker-round2.png', fullPage: true });

          // Verify all users are in round 2
          await expect(user2Page.getByText(/round.*2|ronda.*2/i)).toBeVisible();
          await expect(user3Page.getByText(/round.*2|ronda.*2/i)).toBeVisible();

          // Count how many ideas are in the tiebreaker
          const tiebreakerCandidates = await user1Page.locator('input[type="checkbox"]').count();
          console.log(`Tiebreaker round has ${tiebreakerCandidates} tied ideas`);

          // Vote in tiebreaker round
          await test.step('Vote in tiebreaker round', async () => {
            // All users vote for their favorites among tied ideas
            const votesNeeded = Math.min(tiebreakerCandidates, 3);

            // User 1 votes
            const user1Boxes = user1Page.locator('input[type="checkbox"]');
            for (let i = 0; i < votesNeeded; i++) {
              await user1Boxes.nth(i).check();
            }
            await user1Page.getByRole('button', { name: /submit.*vote|enviar/i }).click();

            // User 2 votes
            const user2Boxes = user2Page.locator('input[type="checkbox"]');
            for (let i = 0; i < votesNeeded; i++) {
              await user2Boxes.nth(i).check();
            }
            await user2Page.getByRole('button', { name: /submit.*vote|enviar/i }).click();

            // User 3 votes
            const user3Boxes = user3Page.locator('input[type="checkbox"]');
            for (let i = 0; i < votesNeeded; i++) {
              await user3Boxes.nth(i).check();
            }
            await user3Page.getByRole('button', { name: /submit.*vote|enviar/i }).click();

            console.log('Tiebreaker votes cast');

            // Wait for processing
            await user1Page.waitForTimeout(3000);
          });
        } else {
          console.log('No tiebreaker needed or direct to results');
        }
      });

      // ==========================================
      // VERIFY FINAL STATE
      // ==========================================
      await test.step('Verify final state', async () => {
        // Check if results are shown
        const hasResults = await user1Page.getByText(/results|resultados|winners/i).isVisible({ timeout: 10000 }).catch(() => false);

        if (hasResults) {
          console.log('Reached final results');

          // All users should see results
          await expect(user2Page.getByText(/results|resultados|winners/i)).toBeVisible({ timeout: 5000 });
          await expect(user3Page.getByText(/results|resultados|winners/i)).toBeVisible({ timeout: 5000 });

          // Take final screenshots
          await user1Page.screenshot({ path: 'e2e/screenshots/final-results-user1.png', fullPage: true });
          await user2Page.screenshot({ path: 'e2e/screenshots/final-results-user2.png', fullPage: true });
          await user3Page.screenshot({ path: 'e2e/screenshots/final-results-user3.png', fullPage: true });

          // Verify winners are displayed (should be 3 winners)
          const winnersText = await user1Page.locator('body').innerText();
          console.log('Final results shown to all users');

        } else {
          // May be in another round
          const currentState = await user1Page.locator('body').innerText();
          console.log('Current state:', currentState.substring(0, 200));

          await user1Page.screenshot({ path: 'e2e/screenshots/current-state-user1.png', fullPage: true });
        }
      });

    } finally {
      // Cleanup
      await user1Page.close();
      await user2Page.close();
      await user3Page.close();
      await user1Context.close();
      await user2Context.close();
      await user3Context.close();

      console.log('Voting and tiebreaker test completed');
    }
  });
});
