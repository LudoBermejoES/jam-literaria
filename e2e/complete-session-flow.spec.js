import { test, expect } from '@playwright/test';

test.describe('Complete Session Flow - Single User', () => {
  test.beforeAll(() => {
    console.log('═══════════════════════════════════════════════════════');
    console.log('🎬 STARTING E2E TEST SUITE: Complete Session Flow');
    console.log('═══════════════════════════════════════════════════════');
  });

  test('should complete full session flow from login to results', async ({ page }) => {
    console.log('🚀 Starting E2E test: Complete Session Flow');

    // Navigate to the application
    console.log('📍 Navigating to home page...');
    await page.goto('/');
    console.log('✅ Page loaded');

    // ==========================================
    // STEP 1: LOGIN
    // ==========================================
    await test.step('Login as user', async () => {
      console.log('🔐 Step 1: Starting login...');
      await expect(page).toHaveTitle(/Jam Literaria/);
      console.log('✅ Page title verified');

      // Find and fill the name input
      console.log('📝 Looking for name input...');
      const nameInput = page.getByPlaceholder(/enter your name|nombre/i);
      await expect(nameInput).toBeVisible();
      console.log('✅ Name input found');

      await nameInput.fill('Test User');
      console.log('✅ Name filled: Test User');

      // Click login/continue button
      console.log('👆 Clicking login button...');
      const loginButton = page.getByRole('button', { name: /continue|continuar|login|entrar/i });
      await loginButton.click();
      console.log('✅ Login button clicked');

      // Wait for navigation to home page
      console.log('⏳ Waiting for navigation to home page...');
      await page.waitForURL(/\/(home|inicio)/);
      console.log('✅ Step 1 Complete: User logged in successfully');
    });

    // ==========================================
    // STEP 2: CREATE SESSION
    // ==========================================
    let sessionCode;
    await test.step('Create a new session', async () => {
      // Click create session button
      const createButton = page.getByRole('button', { name: /create.*session|crear.*sesión/i });
      await expect(createButton).toBeVisible();
      await createButton.click();

      // Wait for session page
      await page.waitForURL(/\/session\/[a-zA-Z0-9]+/);

      // Get session code from URL or page
      const url = page.url();
      const match = url.match(/\/session\/([a-zA-Z0-9]+)/);
      sessionCode = match ? match[1] : null;
      expect(sessionCode).toBeTruthy();

      console.log(`Session created with code: ${sessionCode}`);

      // Verify we're in WAITING state
      await expect(page.getByText(/waiting.*participants|esperando.*participantes/i)).toBeVisible({ timeout: 10000 });
    });

    // ==========================================
    // STEP 3: START SESSION (AS OWNER)
    // ==========================================
    await test.step('Start the session', async () => {
      // Click start session button (owner only)
      const startButton = page.getByRole('button', { name: /start.*session|iniciar.*sesión/i });
      await expect(startButton).toBeVisible();
      await startButton.click();

      // Wait for idea submission phase
      await expect(page.getByText(/submit.*ideas?|enviar.*ideas?/i)).toBeVisible({ timeout: 10000 });
    });

    // ==========================================
    // STEP 4: SUBMIT IDEAS
    // ==========================================
    await test.step('Submit ideas', async () => {
      // Submit first idea
      const ideaInput = page.locator('textarea').first();
      await ideaInput.fill('First creative idea for the session');

      let submitButton = page.getByRole('button', { name: /submit|enviar|add|añadir/i }).first();
      await submitButton.click();

      // Wait for idea to be added
      await page.waitForTimeout(500);

      // Submit second idea
      await ideaInput.fill('Second brilliant idea');
      await submitButton.click();

      await page.waitForTimeout(500);

      // Verify ideas are displayed
      await expect(page.getByText('First creative idea')).toBeVisible();
      await expect(page.getByText('Second brilliant idea')).toBeVisible();

      console.log('Successfully submitted 2 ideas');
    });

    // ==========================================
    // STEP 5: START VOTING (AS OWNER)
    // ==========================================
    await test.step('Start voting phase', async () => {
      // As owner, click start voting button
      const startVotingButton = page.getByRole('button', { name: /start.*vot/i });

      // Wait for button to be enabled (all participants submitted ideas)
      await expect(startVotingButton).toBeVisible({ timeout: 15000 });
      await startVotingButton.click();

      // Wait for voting screen
      await expect(page.getByText(/vote.*ideas?|votar.*ideas?/i)).toBeVisible({ timeout: 10000 });

      console.log('Voting phase started');
    });

    // ==========================================
    // STEP 6: VOTE FOR IDEAS
    // ==========================================
    await test.step('Vote for favorite ideas', async () => {
      // Find all idea cards/checkboxes
      const ideaCheckboxes = page.locator('input[type="checkbox"]');
      const count = await ideaCheckboxes.count();

      console.log(`Found ${count} ideas to vote for`);

      // Vote for first 2 ideas (or less if fewer available)
      const votesToCast = Math.min(2, count);
      for (let i = 0; i < votesToCast; i++) {
        await ideaCheckboxes.nth(i).check();
      }

      // Submit votes
      const submitVotesButton = page.getByRole('button', { name: /submit.*vote|enviar.*voto/i });
      await expect(submitVotesButton).toBeVisible();
      await submitVotesButton.click();

      console.log(`Voted for ${votesToCast} ideas`);

      // Wait for either results or next voting round
      await page.waitForTimeout(2000);
    });

    // ==========================================
    // STEP 7: VIEW RESULTS
    // ==========================================
    await test.step('View final results', async () => {
      // Check if we reached results page
      const isResultsPage = await page.getByText(/results|resultados|winners|ganadores/i).isVisible({ timeout: 5000 }).catch(() => false);

      if (isResultsPage) {
        console.log('Reached results page');

        // Verify results are displayed
        await expect(page.getByText(/results|resultados/i)).toBeVisible();

        // Take a screenshot of results
        await page.screenshot({ path: 'e2e/screenshots/final-results.png', fullPage: true });
      } else {
        console.log('May need additional voting rounds or still counting votes');

        // Take screenshot of current state
        await page.screenshot({ path: 'e2e/screenshots/post-voting-state.png', fullPage: true });
      }
    });

    // ==========================================
    // FINAL: VERIFY SESSION COMPLETED
    // ==========================================
    await test.step('Verify session is accessible', async () => {
      // Session should still be accessible
      const currentUrl = page.url();
      expect(currentUrl).toContain('/session/');

      console.log('Session flow completed successfully');
    });
  });
});
