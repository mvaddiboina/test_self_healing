import { Page, TestInfo, expect } from '@playwright/test';
import { BasePage } from './BasePage';
import { LoginLocators } from '@locators/login.locators';

export class LoginPage extends BasePage {
  constructor(page: Page, testInfo?: TestInfo) {
    super(page, testInfo);
  }

  async login(username: string, password: string): Promise<void> {
    await this.heal.fill(LoginLocators.username, username);
    await this.heal.fill(LoginLocators.password, password);
    await this.heal.click(LoginLocators.loginButton);
  }

  async expectLoginError(expectedText: string | RegExp): Promise<void> {
    await expect(await this.heal.resolve(LoginLocators.error)).toContainText(expectedText);
  }
}
