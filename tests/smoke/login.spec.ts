import { test } from '@fixtures/test-fixtures';
import { env } from '@utils/env';

test.describe('Authentication', () => {
  test('@smoke should login with standard user', async ({ loginPage, inventoryPage }) => {
    await loginPage.open('/');
    await loginPage.login(env.users.standard, env.password);
    await inventoryPage.expectLoaded();
  });

  test.skip('@regression should show error for locked out user', async ({ loginPage }) => {
    await loginPage.open('/');
    await loginPage.login(env.users.lockedOut, env.password);
    await loginPage.expectLoginError(/locked out/i);
  });
});
