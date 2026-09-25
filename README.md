# SauceDemo Enterprise Playwright TypeScript Framework

Production-ready automation framework for https://www.saucedemo.com using Playwright, TypeScript, Page Object Model, centralized locators, self-healing selector fallback, fixtures, reporting, and CI.

## Tech Stack

- Playwright Test
- TypeScript strict mode
- Page Object Model
- Centralized locator repository
- Self-healing locator fallback utility
- HTML, list, and JUnit reports
- Screenshots, videos, and traces on failure
- GitHub Actions CI

## Install

```bash
npm install
npx playwright install
cp .env.example .env
```

## Run Tests

```bash
npm test
npm run test:smoke
npm run test:regression
npm run test:headed
npm run report
```

## AI Self-Healing (opt-in)

When every `primary`/`fallbacks` selector for an element fails, the framework can fall back to an
OpenAI-powered agent that looks at the live page and proposes a replacement selector, verifies it
actually resolves before using it, and caches it so the API is only called once per element/page.

1. Set in `.env`:
   ```
   ENABLE_AI_HEALING=true
   OPENAI_API_KEY=sk-...
   OPENAI_MODEL=gpt-4o-mini
   ```
2. Run tests as usual (`npm test`). Healing only kicks in when the static selector chain is exhausted.
3. Successful heals are written to `.healing-cache.json` (gitignored by default), attached per-element to
   the Playwright HTML report, and summarized in a standalone colorized dashboard at
   `reports/self-healing-report.html`. Review healed selectors periodically and promote durable ones into
   the relevant file under `src/locators/` as a real `fallback`.

How it works (`src/agent/`):
- `DomSnapshot.ts` — collects a compact JSON summary of interactive elements on the page (not raw HTML)
  to keep prompts small and cheap.
- `HealingAgent.ts` — sends the element description, failed selectors, and DOM snapshot to OpenAI and
  gets back a single proposed CSS selector as strict JSON.
- `HealingCache.ts` — persists verified heals keyed by description + primary selector + page path.
- `SelfHealingLocator.ts` — orchestrates: static chain → cache → live AI proposal → verify → use/persist.
  Every heal (static fallback or AI) is reported to the Playwright report as a per-element attachment
  (failed selector(s) with their errors, the selector that fixed it, and — for AI heals — the model's
  reasoning) plus a one-line test annotation, so it's visible without digging through logs.
- `HealingReporter.ts` — a custom Playwright reporter that collects every heal event across the whole
  run and renders `reports/self-healing-report.html`: a self-contained, color-coded dashboard (light/dark
  theme aware) with summary stat cards, a searchable/filterable list grouped by test, failed selectors
  shown struck through in red, the healed selector in green, and AI reasoning called out in a highlighted
  box. Open it directly in a browser after any run — no extra flags needed, it's wired into
  `playwright.config.ts` as an always-on reporter.

The agent never acts on the page directly; it only proposes a selector string, which is verified for
visibility before use, same as any other fallback.

## Framework Rules

1. Do not keep locators inside tests.
2. Keep all locators in `src/locators`.
3. Keep business actions in `src/pages`.
4. Keep assertions mainly in tests or page-level expectation methods.
5. Prefer `data-test` selectors first.
6. Use fallback locators only for controlled self-healing, not as a replacement for stable attributes.

## Included Test Coverage

- Login success
- Locked-out login validation
- Add product to cart
- Multi-product cart validation
- Price sorting validation
- End-to-end checkout order completion

## Recommended CI Command

```bash
npm ci
npx playwright install --with-deps
npm test
```

## Notes

SauceDemo is a JavaScript app. Browser execution is required for real tests. This framework is ready to run locally or in CI after dependencies are installed.
