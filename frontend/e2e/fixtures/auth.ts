import { test as base, Page } from '@playwright/test';
import { MOCK_TOKENS, MOCK_USER, MOCK_ADMIN } from './test-data';

type AuthFixtures = {
  loginAsUser: () => Promise<void>;
  loginAsAdmin: () => Promise<void>;
  setupAuthMocks: (user: typeof MOCK_USER) => Promise<void>;
};

export const test = base.extend<AuthFixtures>({
  loginAsUser: async ({ page }, use) => {
    const login = async () => {
      await setupAuthMocks(page, MOCK_USER);
    };
    await use(login);
  },

  loginAsAdmin: async ({ page }, use) => {
    const login = async () => {
      await setupAuthMocks(page, MOCK_ADMIN);
    };
    await use(login);
  },

  setupAuthMocks: async ({ page }, use) => {
    const setup = async (user: typeof MOCK_USER) => {
      await setupAuthMocks(page, user);
    };
    await use(setup);
  },
});

async function setupAuthMocks(page: Page, user: typeof MOCK_USER) {
  await page.route('**/api/v1/auth/login', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  );

  await page.route('**/api/v1/auth/verify', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_TOKENS),
    })
  );

  await page.route('**/api/v1/auth/refresh', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(MOCK_TOKENS),
    })
  );

  await page.route('**/api/v1/auth/logout', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
  );

  await page.route('**/api/v1/user', (route) => {
    if (route.request().method() === 'GET') {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(user),
      });
    }
    return route.continue();
  });

  await page.addInitScript((tokens) => {
    localStorage.setItem('auth.access_token', tokens.access_token);
    localStorage.setItem('auth.refresh_token', tokens.refresh_token);
  }, MOCK_TOKENS);
}

export { expect } from '@playwright/test';
