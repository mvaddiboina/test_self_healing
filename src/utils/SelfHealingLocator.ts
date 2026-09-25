import { expect, Locator, Page, TestInfo } from '@playwright/test';
import { LocatorDefinition } from './types';
import { env } from './env';
import { captureInteractiveSnapshot } from '@agent/DomSnapshot';
import { HealingAgent } from '@agent/HealingAgent';
import { cacheKey, getCachedHeal, saveHeal } from '@agent/HealingCache';

const agent = new HealingAgent();

type FailedAttempt = { selector: string; error: string };

type HealEvent = {
  description: string;
  method: 'fallback' | 'ai-cache' | 'ai';
  failedAttempts: FailedAttempt[];
  healedSelector: string;
  reasoning?: string;
  pageUrl: string;
  healedAt: string;
};

/** Attachment name the HealingReporter dashboard scans for. Keep in sync with src/agent/HealingReporter.ts. */
export const HEAL_EVENT_ATTACHMENT_NAME = 'self-heal:data';

export class SelfHealingLocator {
  constructor(
    private readonly page: Page,
    private readonly testInfo?: TestInfo
  ) {}

  async resolve(definition: LocatorDefinition, timeout = 2500): Promise<Locator> {
    const selectors = [definition.primary, ...(definition.fallbacks ?? [])];
    const failures: string[] = [];
    const failedAttempts: FailedAttempt[] = [];

    for (const selector of selectors) {
      const locator = this.page.locator(selector).first();
      try {
        await expect(locator, `Resolving ${definition.description}`).toBeVisible({ timeout });
        if (selector !== definition.primary) {
          await this.reportHeal({
            description: definition.description,
            method: 'fallback',
            failedAttempts: [...failedAttempts],
            healedSelector: selector,
            pageUrl: this.page.url(),
            healedAt: new Date().toISOString()
          });
        }
        return locator;
      } catch (error) {
        const message = (error as Error).message.split('\n')[0];
        failures.push(`${selector} -> ${message}`);
        failedAttempts.push({ selector, error: message });
      }
    }

    if (env.ai.enabled) {
      const aiHealed = await this.tryAiHeal(definition, selectors, failures, failedAttempts, timeout);
      if (aiHealed) return aiHealed;
    }

    throw new Error(`Unable to resolve locator: ${definition.description}\nTried:\n${failures.join('\n')}`);
  }

  private async tryAiHeal(
    definition: LocatorDefinition,
    triedSelectors: string[],
    failures: string[],
    failedAttempts: FailedAttempt[],
    timeout: number
  ): Promise<Locator | undefined> {
    const pageUrl = this.page.url();
    const key = cacheKey(definition.description, definition.primary, pageUrl);

    const cached = getCachedHeal(key);
    if (cached && !triedSelectors.includes(cached.selector)) {
      const locator = await this.verifySelector(cached.selector, definition.description, timeout);
      if (locator) {
        await this.reportHeal({
          description: definition.description,
          method: 'ai-cache',
          failedAttempts,
          healedSelector: cached.selector,
          reasoning: cached.reasoning,
          pageUrl,
          healedAt: new Date().toISOString()
        });
        return locator;
      }
      failures.push(`${cached.selector} (cached) -> no longer resolves`);
    }

    try {
      const snapshot = await captureInteractiveSnapshot(this.page);
      const proposal = await agent.proposeSelector({
        definition,
        failedSelectors: triedSelectors,
        snapshot,
        pageUrl
      });

      if (!proposal?.selector) {
        failures.push('AI agent -> no plausible match found');
        return undefined;
      }

      const locator = await this.verifySelector(proposal.selector, definition.description, timeout);
      if (!locator) {
        failures.push(`${proposal.selector} (AI-proposed) -> did not resolve`);
        return undefined;
      }

      saveHeal(key, {
        ...proposal,
        description: definition.description,
        primary: definition.primary,
        pageUrl,
        healedAt: new Date().toISOString()
      });

      await this.reportHeal({
        description: definition.description,
        method: 'ai',
        failedAttempts,
        healedSelector: proposal.selector,
        reasoning: proposal.reasoning,
        pageUrl,
        healedAt: new Date().toISOString()
      });
      return locator;
    } catch (error) {
      failures.push(`AI agent -> ${(error as Error).message}`);
      return undefined;
    }
  }

  private async verifySelector(selector: string, description: string, timeout: number): Promise<Locator | undefined> {
    const locator = this.page.locator(selector).first();
    try {
      await expect(locator, `Verifying AI-proposed locator for ${description}`).toBeVisible({ timeout });
      return locator;
    } catch {
      return undefined;
    }
  }

  private async reportHeal(event: HealEvent): Promise<void> {
    const statusLabel =
      event.method === 'ai' ? 'AI self-healed (live)' : event.method === 'ai-cache' ? 'AI self-healed (cache)' : 'Fallback locator used';

    const failedLines =
      event.failedAttempts.length > 0
        ? event.failedAttempts.map((f, i) => `  ${i + 1}. ${f.selector}\n     -> ${f.error}`).join('\n')
        : '  (none recorded)';

    const proposedLabel = event.method === 'fallback' ? 'Fallback locator used' : 'AI-proposed locator';

    const lines = [
      `Self-Healing Report: ${event.description}`,
      '-'.repeat(40),
      `Status: ${statusLabel}`,
      `Page URL: ${event.pageUrl}`,
      '',
      'Failed locator(s):',
      failedLines,
      '',
      `${proposedLabel}: ${event.healedSelector}`
    ];

    if (event.reasoning) {
      lines.push('', `AI reasoning: ${event.reasoning}`);
    }

    const message = lines.join('\n');
    console.warn(message);

    await this.testInfo?.attach(`self-heal - ${event.description}`, {
      body: message,
      contentType: 'text/plain'
    });

    await this.testInfo?.attach(HEAL_EVENT_ATTACHMENT_NAME, {
      body: JSON.stringify(event),
      contentType: 'application/json'
    });

    this.testInfo?.annotations.push({
      type: 'self-healed',
      description: `${event.description}: [${event.failedAttempts.map((f) => f.selector).join(', ') || 'n/a'}] -> ${event.healedSelector}`
    });
  }

  async click(definition: LocatorDefinition): Promise<void> {
    await (await this.resolve(definition)).click();
  }

  async fill(definition: LocatorDefinition, value: string): Promise<void> {
    await (await this.resolve(definition)).fill(value);
  }

  async text(definition: LocatorDefinition): Promise<string> {
    return (await this.resolve(definition)).innerText();
  }
}
