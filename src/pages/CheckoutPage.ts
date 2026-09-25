import { expect, Page, TestInfo } from '@playwright/test';
import { BasePage } from './BasePage';
import { CheckoutLocators } from '@locators/checkout.locators';
import { CheckoutInformation } from '@utils/types';

export class CheckoutPage extends BasePage {
  constructor(page: Page, testInfo?: TestInfo) {
    super(page, testInfo);
  }

  async enterCustomerInformation(info: CheckoutInformation): Promise<void> {
    await this.heal.fill(CheckoutLocators.firstName, info.firstName);
    await this.heal.fill(CheckoutLocators.lastName, info.lastName);
    await this.heal.fill(CheckoutLocators.postalCode, info.postalCode);
    await this.heal.click(CheckoutLocators.continueButton);
  }

  async finishOrder(): Promise<void> {
    await this.heal.click(CheckoutLocators.finishButton);
  }

  async expectOrderComplete(): Promise<void> {
    await expect(await this.heal.resolve(CheckoutLocators.completeHeader)).toHaveText('Thank you for your order!');
  }

  async expectError(expectedText: string | RegExp): Promise<void> {
    await expect(await this.heal.resolve(CheckoutLocators.error)).toContainText(expectedText);
  }

  async expectTotalVisible(): Promise<void> {
    await expect(await this.heal.resolve(CheckoutLocators.totalLabel)).toContainText('Total:');
  }
}
