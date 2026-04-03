import { test, expect } from '@playwright/test';
import { generateProjects } from '../fixtures/test-data';

const projects25 = generateProjects(25);

function mockProjectsRoute(page: import('@playwright/test').Page) {
  return page.route('**/api/v1/projects?*', (route) => {
    const url = new URL(route.request().url());
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');
    const role = url.searchParams.get('role');
    const level = url.searchParams.get('level');
    const sortBy = url.searchParams.get('sort_by') || 'created_at';
    const order = url.searchParams.get('order') || 'desc';

    let filtered = [...projects25];

    if (role) {
      filtered = filtered.filter((p) =>
        p.positions.some((pos) => pos.role.toLowerCase() === role.toLowerCase())
      );
    }
    if (level) {
      filtered = filtered.filter((p) =>
        p.positions.some((pos) => pos.level.toLowerCase() === level.toLowerCase())
      );
    }

    filtered.sort((a, b) => {
      if (sortBy === 'created_at') {
        return order === 'asc'
          ? new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
          : new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
      if (sortBy === 'open_positions') {
        return order === 'asc'
          ? a.positions.length - b.positions.length
          : b.positions.length - a.positions.length;
      }
      return 0;
    });

    const total = filtered.length;
    const items = filtered.slice(offset, offset + limit);

    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ items, total }),
    });
  });
}

// Helper: click a dropdown item inside the filter section
// The dropdown items are <button> elements inside a dropdown div
async function selectDropdownItem(page: import('@playwright/test').Page, filterLabel: string, itemText: string) {
  // Click the filter button to open dropdown
  await page.locator('button').filter({ hasText: new RegExp(`^${filterLabel}`) }).first().click();
  // Click the dropdown item button (exact match)
  await page.locator('[class*="dropdown"] button').filter({ hasText: itemText }).first().click();
}

test.describe('4.3 Фильтрация, сортировка и пагинация', () => {
  test.beforeEach(async ({ page }) => {
    await mockProjectsRoute(page);
  });

  test('Фильтр по позиции: выбор "Front-end"', async ({ page }) => {
    const requestPromise = page.waitForRequest((req) =>
      req.url().includes('/api/v1/projects') && req.url().includes('role=Front-end')
    );

    await page.goto('/search');
    await expect(page.getByRole('heading', { name: 'Проект 1', exact: true })).toBeVisible();
    await selectDropdownItem(page, 'Позиция', 'Front-end');

    const request = await requestPromise;
    expect(request.url()).toContain('role=Front-end');

    // Verify active filter tag appears
    await expect(page.locator('[class*="activeFilterTag"]').filter({ hasText: 'Позиция' })).toBeVisible();
  });

  test('Фильтр по уровню: выбор "JUNIOR"', async ({ page }) => {
    const requestPromise = page.waitForRequest((req) =>
      req.url().includes('/api/v1/projects') && req.url().includes('level=JUNIOR')
    );

    await page.goto('/search');
    await expect(page.getByRole('heading', { name: 'Проект 1', exact: true })).toBeVisible();
    await selectDropdownItem(page, 'Уровень', 'JUNIOR');

    const request = await requestPromise;
    expect(request.url()).toContain('level=JUNIOR');

    await expect(page.locator('[class*="activeFilterTag"]').filter({ hasText: 'Уровень' })).toBeVisible();
  });

  test('Сортировка: "Сначала старые"', async ({ page }) => {
    const requestPromise = page.waitForRequest((req) =>
      req.url().includes('/api/v1/projects') &&
      req.url().includes('sort_by=created_at') &&
      req.url().includes('order=asc')
    );

    await page.goto('/search');
    await expect(page.getByRole('heading', { name: 'Проект 1', exact: true })).toBeVisible();
    await selectDropdownItem(page, 'Сортировка', 'Сначала старые');

    const request = await requestPromise;
    expect(request.url()).toContain('sort_by=created_at');
    expect(request.url()).toContain('order=asc');
  });

  test('Сортировка: "Больше открытых позиций"', async ({ page }) => {
    const requestPromise = page.waitForRequest((req) =>
      req.url().includes('/api/v1/projects') &&
      req.url().includes('sort_by=open_positions') &&
      req.url().includes('order=desc')
    );

    await page.goto('/search');
    await expect(page.getByRole('heading', { name: 'Проект 1', exact: true })).toBeVisible();
    await selectDropdownItem(page, 'Сортировка', 'Больше открытых позиций');

    const request = await requestPromise;
    expect(request.url()).toContain('sort_by=open_positions');
    expect(request.url()).toContain('order=desc');
  });

  test('Пагинация: переход на следующую страницу', async ({ page }) => {
    await page.goto('/search');

    // Wait for first page to load
    await expect(page.getByRole('heading', { name: 'Проект 1', exact: true })).toBeVisible();

    // Verify pagination exists
    await expect(page.getByRole('button', { name: 'Вперед' })).toBeVisible();

    // Click next page
    const requestPromise = page.waitForRequest((req) =>
      req.url().includes('/api/v1/projects') && req.url().includes('offset=20')
    );
    await page.getByRole('button', { name: 'Вперед' }).click();

    const request = await requestPromise;
    expect(request.url()).toContain('offset=20');
  });

  test('Пагинация: кнопка "Назад" на первой странице заблокирована', async ({ page }) => {
    await page.goto('/search');
    await expect(page.getByRole('heading', { name: 'Проект 1', exact: true })).toBeVisible();

    const backButton = page.getByRole('button', { name: 'Назад' });
    await expect(backButton).toBeDisabled();
  });

  test('Изменение размера страницы на 5', async ({ page }) => {
    const requestPromise = page.waitForRequest((req) =>
      req.url().includes('/api/v1/projects') && req.url().includes('limit=5')
    );

    await page.goto('/search');
    await expect(page.getByRole('heading', { name: 'Проект 1', exact: true })).toBeVisible();

    await page.locator('select').selectOption('5');

    const request = await requestPromise;
    expect(request.url()).toContain('limit=5');
  });

  test('Комбинированные фильтры: позиция + уровень + сортировка', async ({ page }) => {
    await page.goto('/search');
    await expect(page.getByRole('heading', { name: 'Проект 1', exact: true })).toBeVisible();

    // Apply position filter
    await selectDropdownItem(page, 'Позиция', 'Front-end');
    await page.waitForTimeout(500);

    // Apply level filter
    await selectDropdownItem(page, 'Уровень', 'JUNIOR');
    await page.waitForTimeout(500);

    // Apply sort
    const requestPromise = page.waitForRequest((req) => {
      const url = req.url();
      return (
        url.includes('/api/v1/projects') &&
        url.includes('role=Front-end') &&
        url.includes('level=JUNIOR') &&
        url.includes('sort_by=created_at') &&
        url.includes('order=asc')
      );
    });

    await selectDropdownItem(page, 'Сортировка', 'Сначала старые');

    const request = await requestPromise;
    expect(request.url()).toContain('role=Front-end');
    expect(request.url()).toContain('level=JUNIOR');
    expect(request.url()).toContain('order=asc');
  });

  test('Сброс фильтра: удаление активного фильтра по позиции', async ({ page }) => {
    await page.goto('/search');
    await expect(page.getByRole('heading', { name: 'Проект 1', exact: true })).toBeVisible();

    // Apply position filter
    await selectDropdownItem(page, 'Позиция', 'Front-end');
    const activeTag = page.locator('[class*="activeFilterTag"]').filter({ hasText: 'Позиция' });
    await expect(activeTag).toBeVisible();

    // Remove filter by clicking X on the active filter tag
    await activeTag.locator('button').click();

    // Verify the filter tag is removed
    await expect(activeTag).not.toBeVisible();
  });

  test('Пустой результат: сообщение "Проекты не найдены"', async ({ page }) => {
    // Override the mock to return empty results
    await page.route('**/api/v1/projects?*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ items: [], total: 0 }),
      })
    );

    await page.goto('/search');
    await expect(page.getByText('Проекты не найдены')).toBeVisible();
  });
});
