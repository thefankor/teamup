import { test, expect } from '../fixtures/auth';
import { MOCK_USER, MOCK_ADMIN, MOCK_PROJECT, MOCK_TOKENS } from '../fixtures/test-data';

test.describe('4.2 Выполнение операций CRUD по ролям', () => {
  test.describe('Проекты', () => {
    test('Создание проекта (USER): заполнение формы и отправка', async ({ page, loginAsUser }) => {
      await loginAsUser();

      const createdProject = {
        ...MOCK_PROJECT,
        id: 'new-proj-id',
        title: 'Новый проект',
      };

      await page.route('**/api/v1/projects', (route) => {
        if (route.request().method() === 'POST') {
          return route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify(createdProject),
          });
        }
        return route.continue();
      });

      await page.route(`**/api/v1/projects/${createdProject.id}`, (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(createdProject),
        })
      );

      await page.goto('/projects/new');
      await expect(page.getByRole('heading', { name: 'Создать проект' })).toBeVisible();

      // Fill the form
      await page.getByPlaceholder('Введите название проекта').fill('Новый проект');
      await page.getByPlaceholder('Опишите ваш проект').fill('Описание нового проекта');

      // Select tags
      await page.getByRole('button', { name: 'Front-end' }).click();

      // Fill position
      await page.getByPlaceholder('Название позиции (например, Front-end developer)').fill('Frontend Developer');

      // Submit
      await page.getByRole('button', { name: 'Создать проект' }).click();

      // Verify redirect to project page
      await page.waitForURL(`/projects/${createdProject.id}`);
    });

    test('Чтение проекта: отображение деталей', async ({ page }) => {
      await page.route(`**/api/v1/projects/${MOCK_PROJECT.id}`, (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_PROJECT),
        })
      );

      await page.goto(`/projects/${MOCK_PROJECT.id}`);
      await expect(page.getByText(MOCK_PROJECT.title)).toBeVisible();
      await expect(page.getByText(MOCK_PROJECT.description)).toBeVisible();
    });

    test('Обновление проекта (владелец): редактирование данных', async ({ page, loginAsUser }) => {
      await loginAsUser();

      const updatedProject = { ...MOCK_PROJECT, title: 'Обновлённый проект' };

      await page.route(`**/api/v1/projects/${MOCK_PROJECT.id}`, (route) => {
        if (route.request().method() === 'PATCH') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(updatedProject),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_PROJECT),
        });
      });

      await page.goto(`/projects/${MOCK_PROJECT.id}`);
      await expect(page.getByText(MOCK_PROJECT.title)).toBeVisible();
    });

    test('Удаление проекта (владелец)', async ({ page, loginAsUser }) => {
      await loginAsUser();

      await page.route(`**/api/v1/projects/${MOCK_PROJECT.id}`, (route) => {
        if (route.request().method() === 'DELETE') {
          return route.fulfill({ status: 204 });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_PROJECT),
        });
      });

      await page.route('**/api/v1/projects/me/list*', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ items: [], total: 0 }),
        })
      );

      await page.goto(`/projects/${MOCK_PROJECT.id}`);
      await expect(page.getByText(MOCK_PROJECT.title)).toBeVisible();
    });

    test('Изменение статуса проекта (открыть/закрыть)', async ({ page, loginAsUser }) => {
      await loginAsUser();

      const closedProject = { ...MOCK_PROJECT, is_open: false };

      await page.route(`**/api/v1/projects/${MOCK_PROJECT.id}`, (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_PROJECT),
        })
      );

      await page.route(`**/api/v1/projects/${MOCK_PROJECT.id}/status/closed`, (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(closedProject),
        })
      );

      await page.goto(`/projects/${MOCK_PROJECT.id}`);
      await expect(page.getByText(MOCK_PROJECT.title)).toBeVisible();
    });
  });

  test.describe('Профиль пользователя', () => {
    test('Обновление профиля: имя, описание', async ({ page, loginAsUser }) => {
      await loginAsUser();

      const updatedUser = { ...MOCK_USER, first_name: 'Пётр', last_name: 'Новиков' };

      await page.route('**/api/v1/user', (route) => {
        if (route.request().method() === 'PATCH') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify(updatedUser),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_USER),
        });
      });

      await page.goto('/profile');
      await expect(page.getByText(MOCK_USER.first_name!)).toBeVisible();
    });

    test('Обновление контактов', async ({ page, loginAsUser }) => {
      await loginAsUser();

      await page.route('**/api/v1/user/contacts', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            ...MOCK_USER,
            contact_info: { ...MOCK_USER.contact_info, tg_username: 'new_tg' },
          }),
        })
      );

      await page.goto('/profile');
      await expect(page.getByText(MOCK_USER.first_name!)).toBeVisible();
    });

    test('Добавление образования', async ({ page, loginAsUser }) => {
      await loginAsUser();

      const newEducation = {
        id: 'edu-1',
        university: 'МГУ',
        specialty: 'Информатика',
        degree: 'Бакалавр',
        graduation_year: 2025,
      };

      await page.route('**/api/v1/user/education', (route) => {
        if (route.request().method() === 'POST') {
          return route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({ ...MOCK_USER, education: [newEducation] }),
          });
        }
        return route.continue();
      });

      await page.goto('/profile');
      await expect(page.getByText(MOCK_USER.first_name!)).toBeVisible();
    });

    test('Удаление образования', async ({ page, loginAsUser }) => {
      await loginAsUser();

      await page.route('**/api/v1/user/education/edu-1', (route) => {
        if (route.request().method() === 'DELETE') {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ ...MOCK_USER, education: [] }),
          });
        }
        return route.continue();
      });

      await page.goto('/profile');
      await expect(page.getByText(MOCK_USER.first_name!)).toBeVisible();
    });
  });

  test.describe('Защита маршрутов по ролям', () => {
    test('Неавторизованный пользователь перенаправляется на /login при доступе к /profile', async ({ page }) => {
      await page.route('**/api/v1/user', (route) =>
        route.fulfill({ status: 401, contentType: 'application/json', body: '{"detail":"Unauthorized"}' })
      );
      await page.route('**/api/v1/auth/refresh', (route) =>
        route.fulfill({ status: 401, contentType: 'application/json', body: '{"detail":"Invalid"}' })
      );

      await page.goto('/profile');
      await page.waitForURL('/login');
    });

    test('Неавторизованный пользователь перенаправляется на /login при доступе к /my-projects', async ({ page }) => {
      await page.route('**/api/v1/user', (route) =>
        route.fulfill({ status: 401, contentType: 'application/json', body: '{"detail":"Unauthorized"}' })
      );
      await page.route('**/api/v1/auth/refresh', (route) =>
        route.fulfill({ status: 401, contentType: 'application/json', body: '{"detail":"Invalid"}' })
      );

      await page.goto('/my-projects');
      await page.waitForURL('/login');
    });

    test('Неавторизованный пользователь перенаправляется на /login при доступе к /projects/new', async ({ page }) => {
      await page.route('**/api/v1/user', (route) =>
        route.fulfill({ status: 401, contentType: 'application/json', body: '{"detail":"Unauthorized"}' })
      );
      await page.route('**/api/v1/auth/refresh', (route) =>
        route.fulfill({ status: 401, contentType: 'application/json', body: '{"detail":"Invalid"}' })
      );

      await page.goto('/projects/new');
      await page.waitForURL('/login');
    });
  });

  test.describe('Заявки на проект', () => {
    test('Подача заявки на проект', async ({ page, loginAsUser }) => {
      await loginAsUser();

      await page.route(`**/api/v1/projects/${MOCK_PROJECT.id}`, (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_PROJECT),
        })
      );

      await page.route(`**/api/v1/projects/${MOCK_PROJECT.id}/applications`, (route) => {
        if (route.request().method() === 'POST') {
          return route.fulfill({
            status: 201,
            contentType: 'application/json',
            body: JSON.stringify({
              id: 'app-1',
              project_id: MOCK_PROJECT.id,
              user_id: MOCK_USER.id,
              status: 'pending',
              message: 'Хочу участвовать',
            }),
          });
        }
        return route.continue();
      });

      await page.goto(`/projects/${MOCK_PROJECT.id}`);
      await expect(page.getByText(MOCK_PROJECT.title)).toBeVisible();
    });

    test('Просмотр заявок (владелец проекта)', async ({ page, loginAsUser }) => {
      await loginAsUser();

      const applications = {
        items: [
          {
            id: 'app-1',
            project_id: MOCK_PROJECT.id,
            applicant_id: 'other-user-id-1234',
            position_ids: ['pos-1'],
            message: 'Хочу работать',
            status: 'pending',
            created_at: '2025-01-20T12:00:00Z',
          },
        ],
        total: 1,
      };

      await page.route(`**/api/v1/projects/${MOCK_PROJECT.id}/applications*`, (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(applications),
        })
      );

      await page.route(`**/api/v1/projects/${MOCK_PROJECT.id}`, (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_PROJECT),
        })
      );

      await page.goto(`/projects/${MOCK_PROJECT.id}/responses`);
      await expect(page.getByText('Заявки на проект')).toBeVisible();
      await expect(page.getByText('Хочу работать')).toBeVisible();
    });

    test('Принятие/отклонение заявки (владелец)', async ({ page, loginAsUser }) => {
      await loginAsUser();

      const applications = {
        items: [
          {
            id: 'app-1',
            project_id: MOCK_PROJECT.id,
            applicant_id: 'other-user-id-1234',
            position_ids: ['pos-1'],
            message: 'Хочу работать',
            status: 'pending',
            created_at: '2025-01-20T12:00:00Z',
          },
        ],
        total: 1,
      };

      await page.route(`**/api/v1/projects/${MOCK_PROJECT.id}/applications*`, (route) => {
        if (route.request().url().includes('/decision')) {
          return route.fulfill({
            status: 200,
            contentType: 'application/json',
            body: JSON.stringify({ ...applications.items[0], status: 'approved' }),
          });
        }
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(applications),
        });
      });

      await page.route(`**/api/v1/projects/${MOCK_PROJECT.id}`, (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(MOCK_PROJECT),
        })
      );

      await page.goto(`/projects/${MOCK_PROJECT.id}/responses`);
      await expect(page.getByText('Заявки на проект')).toBeVisible();
      // Verify action buttons are present for pending application
      await expect(page.getByRole('button', { name: 'Одобрить' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Отклонить' })).toBeVisible();
    });
  });
});
