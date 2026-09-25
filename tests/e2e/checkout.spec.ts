import { test } from '@fixtures/test-fixtures';
import { env } from '@utils/env';
import { Products } from '@data/products';
import { validCheckoutUser } from '@data/checkout-data';

test.describe('Checkout Journey', () => {
  test('@smoke should complete order for one product', async ({ loginPage, inventoryPage, cartPage, checkoutPage }) => {
    await loginPage.open('/');
    await loginPage.login(env.users.standard, env.password);

    await inventoryPage.addProductToCart(Products.backpack);
    await inventoryPage.expectCartBadgeCount(1);
    await inventoryPage.openCart();

    await cartPage.expectLoaded();
    await cartPage.expectProductInCart(Products.backpack);
    await cartPage.checkout();

    await checkoutPage.enterCustomerInformation(validCheckoutUser);
    await checkoutPage.expectTotalVisible();
    await checkoutPage.finishOrder();
    await checkoutPage.expectOrderComplete();
  });
});
