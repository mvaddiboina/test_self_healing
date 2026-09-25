import { test as base } from '@playwright/test';
import { LoginPage } from '@pages/LoginPage';
import { InventoryPage } from '@pages/InventoryPage';
import { CartPage } from '@pages/CartPage';
import { CheckoutPage } from '@pages/CheckoutPage';

type AppPages = {
  loginPage: LoginPage;
  inventoryPage: InventoryPage;
  cartPage: CartPage;
  checkoutPage: CheckoutPage;
};

export const test = base.extend<AppPages>({
  loginPage: async ({ page }, use, testInfo) => {
    await use(new LoginPage(page, testInfo));
  },
  inventoryPage: async ({ page }, use, testInfo) => {
    await use(new InventoryPage(page, testInfo));
  },
  cartPage: async ({ page }, use, testInfo) => {
    await use(new CartPage(page, testInfo));
  },
  checkoutPage: async ({ page }, use, testInfo) => {
    await use(new CheckoutPage(page, testInfo));
  }
});

export { expect } from '@playwright/test';
