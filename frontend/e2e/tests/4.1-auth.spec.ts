import { test, expect } from '../fixtures/auth';
import { MOCK_TOKENS, MOCK_USER } from '../fixtures/test-data';

test.describe('4.1 Вход/выход и восстановление сессии', () => {
  test('Вход: отправка email и ввод кода подтверждения', async ({ page }) => {
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
    await page.route('**/api/v1/user', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_USER),
      })
    );

    await page.goto('/login');
    await expect(page.getByRole('heading', { name: 'Вход' })).toBeVisible();

    // Step 1: enter email
    await page.getByPlaceholder('ivan@gmail.com').fill('test@example.com');
    await page.getByRole('button', { name: 'Продолжить' }).click();

    // Step 2: enter verification code
    await expect(page.getByRole('heading', { name: 'Введите код из почты' })).toBeVisible();
    await expect(page.getByText('test@example.com')).toBeVisible();
    await page.getByPlaceholder('12345').fill('99999');
    await page.getByRole('button', { name: 'Продолжить' }).click();

    // Verify redirected to home
    await page.waitForURL('/');
  });

  test('Вход: ошибка при неверном коде', async ({ page }) => {
    await page.route('**/api/v1/auth/login', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    );
    await page.route('**/api/v1/auth/verify', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ detail: 'Неверный код' }),
      })
    );
    // Mock user endpoint to prevent interference
    await page.route('**/api/v1/user', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: '{"detail":"Unauthorized"}' })
    );
    await page.route('**/api/v1/auth/refresh', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: '{"detail":"Invalid"}' })
    );

    await page.goto('/login');
    await page.getByPlaceholder('ivan@gmail.com').fill('test@example.com');
    await page.getByRole('button', { name: 'Продолжить' }).click();

    await expect(page.getByPlaceholder('12345')).toBeVisible();
    await page.getByPlaceholder('12345').fill('00000');
    await page.getByRole('button', { name: 'Продолжить' }).click();

    // After failed verify, the page stays on /login (does not redirect to home)
    await page.waitForTimeout(1000);
    expect(page.url()).toContain('/login');
    // Should still show the login form (not navigated away)
    await expect(page.getByRole('heading', { name: /Вход|Введите код/ })).toBeVisible();
  });

  test('Выход: очистка сессии и редирект на страницу входа', async ({ page, loginAsUser }) => {
    await loginAsUser();
    await page.goto('/');
    await expect(page.getByRole('link', { name: 'TeamUp' })).toBeVisible();

    // Open user menu and click logout
    await page.getByLabel('Открыть меню профиля').click();
    await page.getByRole('menuitem', { name: 'Выйти' }).click();

    // Verify redirected to login
    await page.waitForURL('/login');

    // Verify tokens cleared
    const accessToken = await page.evaluate(() => localStorage.getItem('auth.access_token'));
    const refreshToken = await page.evaluate(() => localStorage.getItem('auth.refresh_token'));
    expect(accessToken).toBeNull();
    expect(refreshToken).toBeNull();
  });

  test('Восстановление сессии: токены в localStorage позволяют доступ к защищённой странице', async ({ page, loginAsUser }) => {
    await loginAsUser();

    // Navigate to a protected page
    await page.goto('/profile');

    // Should NOT redirect to login
    await expect(page).toHaveURL('/profile');
    await expect(page.getByText(MOCK_USER.first_name!)).toBeVisible();
  });

  test('Сессия истекла: невалидный токен вызывает редирект на вход', async ({ page }) => {
    // Set invalid tokens
    await page.addInitScript(() => {
      localStorage.setItem('auth.access_token', 'invalid-token');
      localStorage.setItem('auth.refresh_token', 'invalid-refresh');
    });

    // Mock API to return 401 for both access and refresh
    await page.route('**/api/v1/user', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: '{"detail":"Unauthorized"}' })
    );
    await page.route('**/api/v1/auth/refresh', (route) =>
      route.fulfill({ status: 401, contentType: 'application/json', body: '{"detail":"Invalid token"}' })
    );

    await page.goto('/profile');

    // Should redirect to login page
    await page.waitForURL('/login');
  });

  test('Регистрация: переход по ссылке "Создать аккаунт"', async ({ page }) => {
    await page.route('**/api/v1/auth/login', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: '{}' })
    );

    await page.goto('/login?register=true');
    await expect(page.getByRole('heading', { name: 'Создать аккаунт' })).toBeVisible();
  });
});
