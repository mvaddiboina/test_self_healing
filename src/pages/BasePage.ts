import { expect, Page, TestInfo } from '@playwright/test';
import { SelfHealingLocator } from '@utils/SelfHealingLocator';

export abstract class BasePage {
  protected readonly heal: SelfHealingLocator;

  protected constructor(
    protected readonly page: Page,
    protected readonly testInfo?: TestInfo
  ) {
    this.heal = new SelfHealingLocator(page, testInfo);
  }

  async open(path = '/'): Promise<void> {
    await this.page.goto(path);
    await this.page.waitForLoadState('domcontentloaded');
  }

  async assertUrlContains(path: string | RegExp): Promise<void> {
    await expect(this.page).toHaveURL(path);
  }
}
