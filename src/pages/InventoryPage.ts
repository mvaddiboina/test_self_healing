import { expect, Locator, Page, TestInfo } from '@playwright/test';
import { BasePage } from './BasePage';
import { InventoryLocators } from '@locators/inventory.locators';

export class InventoryPage extends BasePage {
  constructor(page: Page, testInfo?: TestInfo) {
    super(page, testInfo);
  }

  async expectLoaded(): Promise<void> {
    await expect(await this.heal.resolve(InventoryLocators.title)).toHaveText('Products');
  }

  async addProductToCart(productName: string): Promise<void> {
    const product = this.productCard(productName);
    await product.locator('button').click();
  }

  async removeProductFromCart(productName: string): Promise<void> {
    const product = this.productCard(productName);
    await product.locator('button').click();
  }

  async openCart(): Promise<void> {
    await this.heal.click(InventoryLocators.cartLink);
  }

  async expectCartBadgeCount(count: number): Promise<void> {
    await expect(await this.heal.resolve(InventoryLocators.cartBadge)).toHaveText(String(count));
  }

  async sortBy(value: 'az' | 'za' | 'lohi' | 'hilo'): Promise<void> {
    await (await this.heal.resolve(InventoryLocators.sortDropdown)).selectOption(value);
  }

  async getProductPrices(): Promise<number[]> {
    const prices = await this.page.locator(InventoryLocators.itemPrice.primary).allInnerTexts();
    return prices.map(price => Number(price.replace('$', '')));
  }

  async getProductNames(): Promise<string[]> {
    return this.page.locator(InventoryLocators.itemName.primary).allInnerTexts();
  }

  private productCard(productName: string): Locator {
    return this.page.locator(InventoryLocators.inventoryItem.primary).filter({ hasText: productName });
  }
}
