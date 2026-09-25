import { expect, Page, TestInfo } from '@playwright/test';
import { BasePage } from './BasePage';
import { CartLocators } from '@locators/cart.locators';

export class CartPage extends BasePage {
  constructor(page: Page, testInfo?: TestInfo) {
    super(page, testInfo);
  }

  async expectLoaded(): Promise<void> {
    await expect(await this.heal.resolve(CartLocators.title)).toHaveText('Your Cart');
  }

  async expectProductInCart(productName: string): Promise<void> {
    await expect(this.page.locator(CartLocators.cartItem.primary).filter({ hasText: productName })).toBeVisible();
  }

  async checkout(): Promise<void> {
    await this.heal.click(CartLocators.checkoutButton);
  }
}
