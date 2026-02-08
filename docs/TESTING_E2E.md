# End-to-End Testing Documentation

Complete guide to E2E testing with Playwright for Jam Literaria.

---

## 📋 Table of Contents

- [Overview](#overview)
- [Setup](#setup)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Scenarios](#test-scenarios)
- [Best Practices](#best-practices)
- [Debugging](#debugging)
- [CI/CD Integration](#cicd-integration)

---

## Overview

### What is E2E Testing?

End-to-End testing validates the entire application flow from a user's perspective, testing real browser interactions, API calls, WebSocket connections, and database operations together.

### Why Playwright?

- **Multi-browser support**: Test on Chromium, Firefox, and WebKit
- **Auto-wait**: Automatically waits for elements to be ready
- **Powerful selectors**: CSS, XPath, text, accessibility roles
- **Parallel execution**: Run tests in parallel for speed
- **Video & screenshots**: Capture failures automatically
- **Network control**: Mock or intercept network requests
- **Multi-context**: Simulate multiple users simultaneously

### Test Coverage

| Test Suite | Description | Users | Scenarios |
|------------|-------------|-------|-----------|
| **complete-session-flow** | Full workflow from login to results | 1 | Login, create, ideas, vote, results |
| **multi-user-collaboration** | Real-time collaboration | 2 | Join session, sync, collaborative voting |
| **voting-tiebreaker** | Tiebreaker voting rounds | 3 | Strategic voting, multiple rounds |

---

## Setup

### Prerequisites

- Node.js 18+ installed
- Backend server available at `http://localhost:5000`
- Frontend dev server available at `http://localhost:5173`

### Installation

```bash
# Install Playwright and dependencies
npm install --save-dev @playwright/test playwright

# Install browsers (Chromium, Firefox, WebKit)
npx playwright install
```

### Configuration

The configuration is in `playwright.config.js` at the project root:

```javascript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false, // Sequential for session coordination
  workers: 1, // Single worker for multi-user tests

  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],

  // Auto-start servers
  webServer: [
    {
      command: 'cd server && npm start',
      url: 'http://localhost:5000',
      reuseExistingServer: !process.env.CI,
    },
    {
      command: 'cd app && npm run dev',
      url: 'http://localhost:5173',
      reuseExistingServer: !process.env.CI,
    },
  ],
});
```

---

## Test Structure

```
jam-literaria/
├── e2e/
│   ├── complete-session-flow.spec.js    # Single user flow
│   ├── multi-user-collaboration.spec.js  # Two users
│   ├── voting-tiebreaker.spec.js        # Three users, ties
│   └── screenshots/                      # Test screenshots
├── playwright.config.js                  # Playwright config
└── package.json                          # E2E scripts
```

---

## Running Tests

### All E2E Tests

```bash
npm run test:e2e
```

### Headed Mode (See Browser)

```bash
npm run test:e2e:headed
```

### Debug Mode (Step Through)

```bash
npm run test:e2e:debug
```

### Interactive UI Mode

```bash
npm run test:e2e:ui
```

### View Test Report

```bash
npm run test:e2e:report
```

### Run Specific Test

```bash
npx playwright test complete-session-flow
```

### Run with Different Browser

```bash
npx playwright test --project=firefox
```

---

## Test Scenarios

### 1. Complete Session Flow (Single User)

**File**: `e2e/complete-session-flow.spec.js`

**Flow**:
1. ✅ Login with username
2. ✅ Create new session
3. ✅ Start session (as owner)
4. ✅ Submit 2 ideas
5. ✅ Start voting phase
6. ✅ Vote for ideas
7. ✅ View results

**Key Assertions**:
- User can navigate through all phases
- Ideas are submitted and visible
- Voting interface appears
- Results are calculated

**Example**:
```javascript
await test.step('Login as user', async () => {
  await page.goto('/');

  const nameInput = page.getByPlaceholder(/enter your name/i);
  await nameInput.fill('Test User');

  const loginButton = page.getByRole('button', { name: /continue/i });
  await loginButton.click();

  await page.waitForURL(/\/home/);
});
```

### 2. Multi-User Collaboration (2 Users)

**File**: `e2e/multi-user-collaboration.spec.js`

**Flow**:
1. ✅ Owner creates session
2. ✅ Participant joins using code
3. ✅ Both users see each other
4. ✅ Owner starts session
5. ✅ Both submit ideas
6. ✅ All ideas visible to both
7. ✅ Both vote
8. ✅ Real-time synchronization verified

**Key Assertions**:
- Session code works for joining
- Real-time updates via WebSocket
- Both users see same data
- Votes are counted from both users

**Example**:
```javascript
// Create separate contexts for each user
const ownerContext = await browser.newContext();
const participantContext = await browser.newContext();

const ownerPage = await ownerContext.newPage();
const participantPage = await participantContext.newPage();

// Owner creates session
await ownerPage.goto('/');
// ... create session

// Participant joins
await participantPage.goto('/');
await participantPage.getByPlaceholder(/code/i).fill(sessionCode);
await participantPage.getByRole('button', { name: /join/i }).click();

// Verify both see each other
await expect(ownerPage.getByText(/Participant User/i)).toBeVisible();
await expect(participantPage.getByText(/Session Owner/i)).toBeVisible();
```

### 3. Voting and Tiebreaker (3 Users)

**File**: `e2e/voting-tiebreaker.spec.js`

**Flow**:
1. ✅ Three users join session
2. ✅ Each submits 3 ideas (9 total)
3. ✅ Strategic voting to create ties
4. ✅ Tiebreaker round triggered
5. ✅ Vote in tiebreaker
6. ✅ Final results with winners

**Key Assertions**:
- Multi-round voting logic works
- Ties are detected correctly
- Tiebreaker candidates are correct
- Final winners are selected

**Example**:
```javascript
// Create three users
const user1Context = await browser.newContext();
const user2Context = await browser.newContext();
const user3Context = await browser.newContext();

// Strategic voting to create ties
// User 1 votes for ideas 1, 2, 3
// User 2 votes for ideas 2, 3, 4
// User 3 votes for ideas 3, 4, 5
// Ideas 2, 3, 4 should tie

// Check for tiebreaker round
const isRound2 = await user1Page.getByText(/round.*2/i).isVisible();
if (isRound2) {
  console.log('Tiebreaker triggered!');
  // Vote in tiebreaker...
}
```

---

## Best Practices

### 1. Use Page Object Model

Create reusable page objects for common actions:

```javascript
class LoginPage {
  constructor(page) {
    this.page = page;
    this.nameInput = page.getByPlaceholder(/enter your name/i);
    this.continueButton = page.getByRole('button', { name: /continue/i });
  }

  async login(name) {
    await this.nameInput.fill(name);
    await this.continueButton.click();
    await this.page.waitForURL(/\/home/);
  }
}

// Usage
const loginPage = new LoginPage(page);
await loginPage.login('Test User');
```

### 2. Use test.step() for Organization

```javascript
await test.step('Login as user', async () => {
  // Login logic
});

await test.step('Create session', async () => {
  // Session creation
});
```

### 3. Wait for Network Idle

For WebSocket-heavy operations:

```javascript
await page.waitForLoadState('networkidle');
```

### 4. Use Descriptive Selectors

```javascript
// Good - by role and accessible name
page.getByRole('button', { name: 'Submit Ideas' })

// Good - by user-visible text
page.getByText(/waiting for participants/i)

// Avoid - by CSS class or ID
page.locator('.submit-btn')
```

### 5. Take Screenshots for Debugging

```javascript
await page.screenshot({
  path: 'e2e/screenshots/debug-state.png',
  fullPage: true
});
```

### 6. Clean Up Contexts

```javascript
try {
  // Test logic
} finally {
  await page.close();
  await context.close();
}
```

### 7. Use Timeouts Wisely

```javascript
// Increase timeout for slow operations
await expect(element).toBeVisible({ timeout: 15000 });

// Wait for specific duration
await page.waitForTimeout(1000); // Use sparingly
```

---

## Debugging

### Debug Mode

```bash
npm run test:e2e:debug
```

This opens Playwright Inspector where you can:
- Step through each action
- Inspect element selectors
- View console logs
- Modify selectors on the fly

### UI Mode

```bash
npm run test:e2e:ui
```

Interactive mode with:
- Watch tests run
- Time travel debugging
- View traces
- See screenshots/videos

### Console Logging

Add strategic console.logs:

```javascript
await test.step('Vote for ideas', async () => {
  const count = await checkboxes.count();
  console.log(`Found ${count} ideas to vote for`);

  // ... voting logic

  console.log('Voting completed');
});
```

### Screenshots on Failure

Automatically captured in `test-results/` directory.

### Video Recording

Videos saved in `test-results/` when tests fail.

### Trace Viewer

```bash
npx playwright show-trace test-results/trace.zip
```

Shows:
- Every action taken
- Network requests
- Console logs
- Screenshots at each step

---

## Common Issues

### 1. Servers Not Starting

**Problem**: Backend or frontend not running

**Solution**:
- Ensure both servers can start independently
- Check ports 5000 and 5173 are free
- Set `reuseExistingServer: true` if running manually

### 2. Timeouts

**Problem**: Elements not appearing in time

**Solution**:
```javascript
// Increase specific timeout
await element.waitFor({ timeout: 30000 });

// Or in config
use: {
  actionTimeout: 30000,
  navigationTimeout: 30000,
}
```

### 3. WebSocket Connection Issues

**Problem**: Real-time updates not working

**Solution**:
- Check WebSocket connection in Network tab
- Ensure backend WebSocket server is running
- Add delays after socket operations:
```javascript
await page.waitForTimeout(1000); // Let WebSocket sync
```

### 4. Session State Issues

**Problem**: Test creates session but can't interact

**Solution**:
- Clear browser storage between tests
- Use `storageState` to save/restore auth
- Ensure database is reset between tests

### 5. Multi-User Coordination

**Problem**: Users out of sync

**Solution**:
- Use sequential operations
- Add `waitForTimeout` between critical steps
- Verify state before proceeding:
```javascript
await expect(page.getByText(/expected state/i)).toBeVisible();
```

---

## CI/CD Integration

### GitHub Actions

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  e2e:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '22'

      - name: Install dependencies
        run: |
          npm ci
          npx playwright install --with-deps

      - name: Run E2E tests
        run: npm run test:e2e

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/

      - name: Upload screenshots
        if: failure()
        uses: actions/upload-artifact@v3
        with:
          name: screenshots
          path: e2e/screenshots/
```

### Environment Variables

```bash
# CI mode - no reuse of servers
CI=true npm run test:e2e

# Custom base URL
PLAYWRIGHT_BASE_URL=https://staging.example.com npm run test:e2e
```

---

## Test Metrics

### Expected Duration

| Test Suite | Duration | Users | Actions |
|------------|----------|-------|---------|
| complete-session-flow | ~30s | 1 | 7 steps |
| multi-user-collaboration | ~45s | 2 | 10 steps |
| voting-tiebreaker | ~60s | 3 | 12+ steps |

### Coverage

E2E tests cover:
- ✅ Full user authentication flow
- ✅ Session creation and joining
- ✅ Real-time WebSocket communication
- ✅ Idea submission with validation
- ✅ Multi-round voting algorithm
- ✅ Tiebreaker logic
- ✅ Results calculation
- ✅ Multi-user synchronization

---

## Related Documentation

- [TESTING_BACKEND.md](./TESTING_BACKEND.md) - Backend unit/integration tests
- [TESTING_FRONTEND.md](./TESTING_FRONTEND.md) - Frontend component tests
- [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
- [APPLICATION_FLOW.md](./APPLICATION_FLOW.md) - User flow details

---

<div align="center">

**Comprehensive E2E Test Coverage**

Full application flows tested from user login to final results with multi-user collaboration.

**Last Updated**: 2025-01-18

</div>
