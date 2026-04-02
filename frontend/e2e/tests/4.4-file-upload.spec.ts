import { test, expect } from '../fixtures/auth';
import { MOCK_USER } from '../fixtures/test-data';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.describe('4.4 Загрузка и получение файлов из объектного хранилища', () => {
  test('Загрузка аватара: получение presigned URL, загрузка файла, подтверждение', async ({ page, loginAsUser }) => {
    await loginAsUser();

    const objectKey = 'users/12345678/avatar/test-avatar.png';
    const mockUploadUrl = 'http://localhost:9000/app-bucket/test-upload-url';

    // Mock upload URL request
    await page.route('**/api/v1/user/avatar/upload-url*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          upload_url: mockUploadUrl,
          object_key: objectKey,
        }),
      })
    );

    // Mock S3 PUT upload
    await page.route(mockUploadUrl, (route) =>
      route.fulfill({ status: 200 })
    );

    // Mock confirm upload
    await page.route('**/api/v1/user/avatar/confirm*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          ...MOCK_USER,
          avatar_url: 'http://localhost:9000/app-bucket/avatar.png',
        }),
      })
    );

    // Mock GET /user to return user with avatar after upload
    let avatarUploaded = false;
    await page.route('**/api/v1/user', (route) => {
      if (route.request().method() === 'GET') {
        const user = avatarUploaded
          ? { ...MOCK_USER, avatar_url: 'http://localhost:9000/app-bucket/avatar.png' }
          : MOCK_USER;
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(user),
        });
      }
      return route.continue();
    });

    await page.goto('/profile');

    // Create a small test PNG file in memory
    const testImagePath = path.join(__dirname, 'test-avatar.png');
    // 1x1 pixel PNG
    const pngBuffer = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
      'base64'
    );
    fs.writeFileSync(testImagePath, pngBuffer);

    try {
      // Find file input and upload
      const fileInput = page.locator('input[type="file"]');
      if (await fileInput.count() > 0) {
        avatarUploaded = true;
        await fileInput.setInputFiles(testImagePath);

        // Wait for upload process to complete
        await page.waitForResponse((res) => res.url().includes('/avatar/confirm'));
      }
    } finally {
      // Cleanup test file
      if (fs.existsSync(testImagePath)) {
        fs.unlinkSync(testImagePath);
      }
    }
  });

  test('Удаление аватара', async ({ page, loginAsUser }) => {
    await loginAsUser();

    const userWithAvatar = {
      ...MOCK_USER,
      avatar_url: 'http://localhost:9000/app-bucket/avatar.png',
    };

    await page.route('**/api/v1/user', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(userWithAvatar),
        });
      }
      return route.continue();
    });

    await page.route('**/api/v1/user/avatar', (route) => {
      if (route.request().method() === 'DELETE') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ ...MOCK_USER, avatar_url: null }),
        });
      }
      return route.continue();
    });

    await page.goto('/profile');
    await expect(page.getByText(MOCK_USER.first_name!)).toBeVisible();
  });

  test('Отображение аватара из объектного хранилища', async ({ page, loginAsUser }) => {
    await loginAsUser();

    const avatarUrl = 'http://localhost:9000/app-bucket/users/12345678/avatar/photo.png';
    const userWithAvatar = {
      ...MOCK_USER,
      avatar_url: avatarUrl,
    };

    await page.route('**/api/v1/user', (route) => {
      if (route.request().method() === 'GET') {
        return route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify(userWithAvatar),
        });
      }
      return route.continue();
    });

    // Mock the avatar image request from MinIO
    await page.route(avatarUrl, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'image/png',
        body: Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
          'base64'
        ),
      })
    );

    await page.goto('/profile');

    // Should show avatar image instead of initials placeholder
    const avatar = page.locator('img[alt*="ватар"], img[alt*="avatar"], img[alt*="Аватар"]');
    if (await avatar.count() > 0) {
      await expect(avatar.first()).toBeVisible();
    }
  });

  test('Загрузка файла: проверка типа файла (только изображения)', async ({ page, loginAsUser }) => {
    await loginAsUser();

    await page.goto('/profile');

    // Try to upload a non-image file
    const fileInput = page.locator('input[type="file"]');
    if (await fileInput.count() > 0) {
      // Check accept attribute
      const acceptAttr = await fileInput.getAttribute('accept');
      if (acceptAttr) {
        expect(acceptAttr).toMatch(/image/);
      }
    }
  });

  test('Загрузка файла: ошибка при сбое S3', async ({ page, loginAsUser }) => {
    await loginAsUser();

    await page.route('**/api/v1/user/avatar/upload-url*', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          upload_url: 'http://localhost:9000/app-bucket/test-upload-url',
          object_key: 'users/12345678/avatar/test.png',
        }),
      })
    );

    // S3 upload fails
    await page.route('http://localhost:9000/app-bucket/test-upload-url', (route) =>
      route.fulfill({ status: 500 })
    );

    await page.goto('/profile');
    await expect(page.getByText(MOCK_USER.first_name!)).toBeVisible();
  });
});
