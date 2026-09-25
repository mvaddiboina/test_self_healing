import { Page } from '@playwright/test';
import { InteractiveElementSnapshot } from '@utils/types';

const MAX_ELEMENTS = 150;
const MAX_TEXT_LENGTH = 60;

/**
 * Collects a compact description of interactive/candidate elements instead of raw HTML,
 * keeping the payload small and relevant for selector proposal.
 */
export async function captureInteractiveSnapshot(page: Page): Promise<InteractiveElementSnapshot[]> {
  return page.evaluate(
    ({ maxElements, maxTextLength }) => {
      const selector = [
        'input',
        'button',
        'a',
        'select',
        'textarea',
        '[role]',
        '[data-test]',
        '[data-testid]',
        '[data-qa]'
      ].join(',');

      const nodes = Array.from(document.querySelectorAll(selector)).slice(0, maxElements);

      const buildSelectorHint = (el: Element): string => {
        const tag = el.tagName.toLowerCase();
        if (el.id) return `#${el.id}`;
        const dataTest = el.getAttribute('data-test') ?? el.getAttribute('data-testid') ?? el.getAttribute('data-qa');
        if (dataTest) {
          const attr = el.getAttribute('data-test') ? 'data-test' : el.getAttribute('data-testid') ? 'data-testid' : 'data-qa';
          return `[${attr}="${dataTest}"]`;
        }
        const name = el.getAttribute('name');
        if (name) return `${tag}[name="${name}"]`;
        return tag;
      };

      return nodes.map((el) => {
        const dataAttributes: Record<string, string> = {};
        Array.from(el.attributes)
          .filter((attr) => attr.name.startsWith('data-'))
          .forEach((attr) => {
            dataAttributes[attr.name] = attr.value;
          });

        const text = (el.textContent ?? '').trim().slice(0, maxTextLength);

        return {
          tag: el.tagName.toLowerCase(),
          selectorHint: buildSelectorHint(el),
          id: el.id || undefined,
          name: el.getAttribute('name') ?? undefined,
          type: el.getAttribute('type') ?? undefined,
          role: el.getAttribute('role') ?? undefined,
          text: text || undefined,
          placeholder: el.getAttribute('placeholder') ?? undefined,
          ariaLabel: el.getAttribute('aria-label') ?? undefined,
          dataAttributes: Object.keys(dataAttributes).length ? dataAttributes : undefined
        };
      });
    },
    { maxElements: MAX_ELEMENTS, maxTextLength: MAX_TEXT_LENGTH }
  );
}
