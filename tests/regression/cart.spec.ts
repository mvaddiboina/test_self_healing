import { test, expect } from '@fixtures/test-fixtures';
import { env } from '@utils/env';
import { Products } from '@data/products';
import { isAscending, isDescending } from '@utils/sort';

test.describe('Inventory and Cart', () => {
  test('@regression should add multiple products to cart', async ({ loginPage, inventoryPage, cartPage }) => {
    await loginPage.open('/');
    await loginPage.login(env.users.standard, env.password);

    await inventoryPage.addProductToCart(Products.backpack);
    await inventoryPage.addProductToCart(Products.bikeLight);
    await inventoryPage.expectCartBadgeCount(2);
    await inventoryPage.openCart();

    await cartPage.expectProductInCart(Products.backpack);
    await cartPage.expectProductInCart(Products.bikeLight);
  });

  test('@regression should sort products by price low to high and high to low', async ({ loginPage, inventoryPage }) => {
    await loginPage.open('/');
    await loginPage.login(env.users.standard, env.password);

    await inventoryPage.sortBy('lohi');
    expect(isAscending(await inventoryPage.getProductPrices())).toBeTruthy();

    await inventoryPage.sortBy('hilo');
    expect(isDescending(await inventoryPage.getProductPrices())).toBeTruthy();
  });
});
