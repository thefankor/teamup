import { test, expect } from '../fixtures/auth';
import { MOCK_USER, MOCK_GITHUB_USER, MOCK_GITHUB_REPOS } from '../fixtures/test-data';

const userWithGithub = {
  ...MOCK_USER,
  contact_info: {
    ...MOCK_USER.contact_info,
    github_username: 'testuser',
  },
};

test.describe('4.5 Работа со сторонним API (GitHub)', () => {
  test.describe('Штатная работа', () => {
    test('Успешное получение GitHub профиля и репозиториев', async ({ page, loginAsUser }) => {
      await loginAsUser();

      await page.route('**/api/v1/user', (route) => {
        if (route.request().method() === 'GET') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(userWithGithub),
          });
        }
        return route.continue();
      });

      await page.route(`**/api/v1/user/${MOCK_USER.id}`, (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(userWithGithub),
        })
      );

      await page.route('**/api/v1/github/users/testuser', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_GITHUB_USER),
        })
      );

      await page.route('**/api/v1/github/users/testuser/top-repos*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_GITHUB_REPOS),
        })
      );

      await page.goto(`/user/${MOCK_USER.id}`);

      // Wait for GitHub data to load and check it's displayed
      await expect(page.getByText('testuser').first()).toBeVisible({ timeout: 10_000 });
    });

    test('Профиль без GitHub username не загружает GitHub API', async ({ page, loginAsUser }) => {
      await loginAsUser();

      const userNoGithub = {
        ...MOCK_USER,
        contact_info: { ...MOCK_USER.contact_info, github_username: null },
      };

      await page.route('**/api/v1/user', (route) => {
        if (route.request().method() === 'GET') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(userNoGithub),
          });
        }
        return route.continue();
      });

      await page.route(`**/api/v1/user/${MOCK_USER.id}`, (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(userNoGithub),
        })
      );

      let githubApiCalled = false;
      await page.route('**/api/v1/github/**', (route) => {
        githubApiCalled = true;
        return route.continue();
      });

      await page.goto(`/user/${MOCK_USER.id}`);
      await expect(page.getByText(MOCK_USER.first_name!)).toBeVisible();

      expect(githubApiCalled).toBe(false);
    });
  });

  test.describe('Обработка ошибок', () => {
    test('Rate limit (429): корректная обработка ограничения запросов', async ({ page, loginAsUser }) => {
      await loginAsUser();

      await page.route('**/api/v1/user', (route) => {
        if (route.request().method() === 'GET') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(userWithGithub),
          });
        }
        return route.continue();
      });

      await page.route(`**/api/v1/user/${MOCK_USER.id}`, (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(userWithGithub),
        })
      );

      await page.route('**/api/v1/github/users/testuser', (route) =>
        route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Rate limit exceeded' }),
        })
      );

      await page.route('**/api/v1/github/users/testuser/top-repos*', (route) =>
        route.fulfill({
          status: 429,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Rate limit exceeded' }),
        })
      );

      await page.goto(`/user/${MOCK_USER.id}`);

      // Page should still render without crashing
      await expect(page.getByText(MOCK_USER.first_name!)).toBeVisible();
    });

    test('Timeout (504): корректная обработка таймаута', async ({ page, loginAsUser }) => {
      await loginAsUser();

      await page.route('**/api/v1/user', (route) => {
        if (route.request().method() === 'GET') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(userWithGithub),
          });
        }
        return route.continue();
      });

      await page.route(`**/api/v1/user/${MOCK_USER.id}`, (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(userWithGithub),
        })
      );

      await page.route('**/api/v1/github/users/testuser', (route) =>
        route.fulfill({
          status: 504,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Gateway Timeout' }),
        })
      );

      await page.route('**/api/v1/github/users/testuser/top-repos*', (route) =>
        route.fulfill({
          status: 504,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Gateway Timeout' }),
        })
      );

      await page.goto(`/user/${MOCK_USER.id}`);
      await expect(page.getByText(MOCK_USER.first_name!)).toBeVisible();
    });

    test('Сетевая ошибка: обрыв соединения с GitHub API', async ({ page, loginAsUser }) => {
      await loginAsUser();

      await page.route('**/api/v1/user', (route) => {
        if (route.request().method() === 'GET') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(userWithGithub),
          });
        }
        return route.continue();
      });

      await page.route(`**/api/v1/user/${MOCK_USER.id}`, (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(userWithGithub),
        })
      );

      await page.route('**/api/v1/github/**', (route) => route.abort('connectionrefused'));

      await page.goto(`/user/${MOCK_USER.id}`);

      // Page should still render user profile without GitHub section
      await expect(page.getByText(MOCK_USER.first_name!)).toBeVisible();
    });

    test('Пользователь не найден (404): GitHub пользователь не существует', async ({ page, loginAsUser }) => {
      await loginAsUser();

      await page.route('**/api/v1/user', (route) => {
        if (route.request().method() === 'GET') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(userWithGithub),
          });
        }
        return route.continue();
      });

      await page.route(`**/api/v1/user/${MOCK_USER.id}`, (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(userWithGithub),
        })
      );

      await page.route('**/api/v1/github/users/testuser', (route) =>
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'GitHub user not found' }),
        })
      );

      await page.route('**/api/v1/github/users/testuser/top-repos*', (route) =>
        route.fulfill({
          status: 404,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'GitHub user not found' }),
        })
      );

      await page.goto(`/user/${MOCK_USER.id}`);

      // Page renders without crashing, user data still visible
      await expect(page.getByText(MOCK_USER.first_name!)).toBeVisible();
    });

    test('Сервер недоступен (502): Bad Gateway', async ({ page, loginAsUser }) => {
      await loginAsUser();

      await page.route('**/api/v1/user', (route) => {
        if (route.request().method() === 'GET') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(userWithGithub),
          });
        }
        return route.continue();
      });

      await page.route(`**/api/v1/user/${MOCK_USER.id}`, (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(userWithGithub),
        })
      );

      await page.route('**/api/v1/github/**', (route) =>
        route.fulfill({
          status: 502,
          contentType: 'application/json',
          body: JSON.stringify({ detail: 'Bad Gateway' }),
        })
      );

      await page.goto(`/user/${MOCK_USER.id}`);
      await expect(page.getByText(MOCK_USER.first_name!)).toBeVisible();
    });
  });
});
