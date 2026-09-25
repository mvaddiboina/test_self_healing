import fs from 'fs';
import path from 'path';
import type { FullResult, Reporter, TestCase, TestResult } from '@playwright/test/reporter';

const ATTACHMENT_NAME = 'self-heal:data';
const OUTPUT_FILE = path.resolve(process.cwd(), 'reports/self-healing-report.html');

type HealMethod = 'fallback' | 'ai-cache' | 'ai';

type FailedAttempt = { selector: string; error: string };

type HealEvent = {
  description: string;
  method: HealMethod;
  failedAttempts: FailedAttempt[];
  healedSelector: string;
  reasoning?: string;
  pageUrl: string;
  healedAt: string;
};

type RecordedHeal = HealEvent & {
  testTitle: string;
  testFile: string;
  project: string;
};

const METHOD_META: Record<HealMethod, { label: string; badgeClass: string }> = {
  fallback: { label: 'Static Fallback', badgeClass: 'badge-fallback' },
  'ai-cache': { label: 'AI (cached)', badgeClass: 'badge-ai-cache' },
  ai: { label: 'AI (live)', badgeClass: 'badge-ai' }
};

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export default class HealingReporter implements Reporter {
  private heals: RecordedHeal[] = [];
  private totalTests = 0;
  private failedTests = 0;

  onTestEnd(test: TestCase, result: TestResult): void {
    this.totalTests += 1;
    if (result.status === 'failed' || result.status === 'timedOut') this.failedTests += 1;

    for (const attachment of result.attachments) {
      if (attachment.name !== ATTACHMENT_NAME || !attachment.body) continue;
      try {
        const event = JSON.parse(attachment.body.toString('utf-8')) as HealEvent;
        this.heals.push({
          ...event,
          testTitle: test.titlePath().slice(2).join(' › ') || test.title,
          testFile: path.relative(process.cwd(), test.location.file),
          project: test.titlePath()[1] ?? ''
        });
      } catch {
        // ignore malformed attachment
      }
    }
  }

  onEnd(result: FullResult): void {
    const html = this.buildHtml(result);
    fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true });
    fs.writeFileSync(OUTPUT_FILE, html, 'utf-8');

    const relPath = path.relative(process.cwd(), OUTPUT_FILE);
    console.log(`\n\x1b[35m✨ Self-healing report: \x1b[4m${relPath}\x1b[0m`);
  }

  private buildHtml(result: FullResult): string {
    const total = this.heals.length;
    const aiLive = this.heals.filter((h) => h.method === 'ai').length;
    const aiCache = this.heals.filter((h) => h.method === 'ai-cache').length;
    const fallback = this.heals.filter((h) => h.method === 'fallback').length;
    const uniqueElements = new Set(this.heals.map((h) => h.description)).size;
    const affectedTests = new Set(this.heals.map((h) => h.testTitle)).size;

    const groups = new Map<string, RecordedHeal[]>();
    for (const heal of this.heals) {
      const list = groups.get(heal.testTitle) ?? [];
      list.push(heal);
      groups.set(heal.testTitle, list);
    }

    const cards = [...groups.entries()]
      .map(([testTitle, heals]) => this.renderTestGroup(testTitle, heals))
      .join('\n');

    const emptyState = `
      <div class="empty-state">
        <div class="empty-icon">&#10003;</div>
        <h2>No self-healing needed</h2>
        <p>Every locator resolved on its primary or fallback selector this run. Nothing was sent to the AI healing agent.</p>
      </div>`;

    return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Self-Healing Locator Report</title>
<style>${this.css()}</style>
</head>
<body>
  <header class="hero">
    <div class="hero-inner">
      <div class="hero-title">
        <span class="hero-icon">&#129504;</span>
        <div>
          <h1>Self-Healing Locator Report</h1>
          <p class="hero-sub">Generated ${new Date().toLocaleString()} &middot; overall run: <span class="status-${result.status}">${result.status}</span></p>
        </div>
      </div>
    </div>
  </header>

  <main>
    <section class="stats">
      <div class="stat-card">
        <span class="stat-value">${this.totalTests}</span>
        <span class="stat-label">Tests run</span>
      </div>
      <div class="stat-card ${this.failedTests ? 'stat-bad' : 'stat-good'}">
        <span class="stat-value">${this.failedTests}</span>
        <span class="stat-label">Tests failed</span>
      </div>
      <div class="stat-card stat-accent">
        <span class="stat-value">${total}</span>
        <span class="stat-label">Elements healed</span>
      </div>
      <div class="stat-card stat-ai">
        <span class="stat-value">${aiLive}</span>
        <span class="stat-label">AI heals (live)</span>
      </div>
      <div class="stat-card stat-ai-cache">
        <span class="stat-value">${aiCache}</span>
        <span class="stat-label">AI heals (cached)</span>
      </div>
      <div class="stat-card stat-fallback">
        <span class="stat-value">${fallback}</span>
        <span class="stat-label">Static fallbacks used</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${uniqueElements}</span>
        <span class="stat-label">Unique elements</span>
      </div>
      <div class="stat-card">
        <span class="stat-value">${affectedTests}</span>
        <span class="stat-label">Tests affected</span>
      </div>
    </section>

    ${
      total > 0
        ? `
    <section class="toolbar">
      <input id="search" type="search" placeholder="Filter by test, element, or selector&hellip;" />
      <div class="chips" id="chips">
        <button class="chip active" data-filter="all">All</button>
        <button class="chip" data-filter="ai">AI (live)</button>
        <button class="chip" data-filter="ai-cache">AI (cached)</button>
        <button class="chip" data-filter="fallback">Static fallback</button>
      </div>
    </section>
    <section id="results">
      ${cards}
    </section>
    <p id="no-matches" class="empty-state" hidden>
      <span class="empty-icon">&#128269;</span>
      No heals match your filter.
    </p>`
        : emptyState
    }
  </main>

  <footer>
    <p>Generated by <strong>HealingReporter</strong> &middot; Self-Healing Agentic Framework</p>
  </footer>

  <script>${this.js()}</script>
</body>
</html>`;
  }

  private renderTestGroup(testTitle: string, heals: RecordedHeal[]): string {
    const items = heals.map((h) => this.renderHealCard(h)).join('\n');
    return `
      <details class="test-group" open data-search="${escapeHtml(testTitle.toLowerCase())}">
        <summary>
          <span class="test-title">${escapeHtml(testTitle)}</span>
          <span class="test-file">${escapeHtml(heals[0].testFile)}</span>
          <span class="test-count">${heals.length} healed</span>
        </summary>
        <div class="test-group-body">
          ${items}
        </div>
      </details>`;
  }

  private renderHealCard(heal: RecordedHeal): string {
    const meta = METHOD_META[heal.method];
    const failedList = heal.failedAttempts.length
      ? heal.failedAttempts
          .map(
            (f) => `
        <li>
          <code class="sel sel-fail">${escapeHtml(f.selector)}</code>
          <span class="fail-reason">${escapeHtml(f.error)}</span>
        </li>`
          )
          .join('')
      : '<li class="none">No prior selectors recorded</li>';

    const reasoning = heal.reasoning
      ? `<p class="reasoning"><span class="reasoning-label">AI reasoning</span>${escapeHtml(heal.reasoning)}</p>`
      : '';

    const searchBlob = [
      heal.description,
      heal.healedSelector,
      ...heal.failedAttempts.map((f) => f.selector)
    ]
      .join(' ')
      .toLowerCase();

    return `
      <article class="heal-card" data-method="${heal.method}" data-search="${escapeHtml(searchBlob)}">
        <div class="heal-card-head">
          <h3>${escapeHtml(heal.description)}</h3>
          <span class="badge ${meta.badgeClass}">${meta.label}</span>
        </div>
        <ul class="fail-list">${failedList}</ul>
        <div class="arrow-row">
          <span class="arrow">&#8595; healed to</span>
        </div>
        <code class="sel sel-heal">${escapeHtml(heal.healedSelector)}</code>
        ${reasoning}
        <p class="meta-row">
          <span title="${escapeHtml(heal.pageUrl)}">${escapeHtml(this.shortUrl(heal.pageUrl))}</span>
          <span>${escapeHtml(new Date(heal.healedAt).toLocaleString())}</span>
        </p>
      </article>`;
  }

  private shortUrl(url: string): string {
    try {
      const u = new URL(url);
      return `${u.hostname}${u.pathname}`;
    } catch {
      return url;
    }
  }

  private css(): string {
    return `
      :root {
        color-scheme: light dark;
        --bg: #f4f5fb;
        --surface: #ffffff;
        --border: #e2e4f0;
        --text: #1c1f2e;
        --muted: #6b7086;
        --green: #16a34a;
        --green-bg: #ecfdf3;
        --red: #dc2626;
        --red-bg: #fef2f2;
        --blue: #2563eb;
        --blue-bg: #eff6ff;
        --purple: #7c3aed;
        --purple-bg: #f3e8ff;
        --amber: #d97706;
        --amber-bg: #fffbeb;
        --shadow: 0 1px 2px rgba(20, 22, 40, 0.04), 0 8px 24px rgba(20, 22, 40, 0.06);
      }
      @media (prefers-color-scheme: dark) {
        :root {
          --bg: #0f1117;
          --surface: #171a24;
          --border: #2a2e3d;
          --text: #e7e9f5;
          --muted: #9498ac;
          --green-bg: rgba(22, 163, 74, 0.15);
          --red-bg: rgba(220, 38, 38, 0.15);
          --blue-bg: rgba(37, 99, 235, 0.18);
          --purple-bg: rgba(124, 58, 237, 0.2);
          --amber-bg: rgba(217, 119, 6, 0.18);
          --shadow: 0 1px 2px rgba(0, 0, 0, 0.3), 0 8px 24px rgba(0, 0, 0, 0.35);
        }
      }
      * { box-sizing: border-box; }
      body {
        margin: 0;
        background: var(--bg);
        color: var(--text);
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      }
      .hero {
        background: linear-gradient(135deg, #4c1d95 0%, #6d28d9 45%, #7c3aed 100%);
        color: #fff;
        padding: 40px 24px;
      }
      .hero-inner { max-width: 1080px; margin: 0 auto; }
      .hero-title { display: flex; align-items: center; gap: 16px; }
      .hero-icon { font-size: 40px; }
      .hero h1 { margin: 0; font-size: 26px; }
      .hero-sub { margin: 6px 0 0; opacity: 0.85; font-size: 14px; }
      .status-passed { color: #86efac; font-weight: 600; }
      .status-failed, .status-timedout { color: #fca5a5; font-weight: 600; }
      .status-interrupted { color: #fde68a; font-weight: 600; }
      main { max-width: 1080px; margin: -28px auto 40px; padding: 0 24px; }
      .stats {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
        gap: 12px;
        margin-bottom: 24px;
      }
      .stat-card {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 14px;
        padding: 16px;
        box-shadow: var(--shadow);
        display: flex;
        flex-direction: column;
        gap: 4px;
      }
      .stat-value { font-size: 26px; font-weight: 700; }
      .stat-label { font-size: 12px; color: var(--muted); text-transform: uppercase; letter-spacing: 0.04em; }
      .stat-good .stat-value { color: var(--green); }
      .stat-bad .stat-value { color: var(--red); }
      .stat-accent .stat-value { color: var(--purple); }
      .stat-ai .stat-value { color: var(--purple); }
      .stat-ai-cache .stat-value { color: var(--blue); }
      .stat-fallback .stat-value { color: var(--amber); }
      .toolbar {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        align-items: center;
        margin-bottom: 20px;
      }
      #search {
        flex: 1;
        min-width: 220px;
        padding: 10px 14px;
        border-radius: 10px;
        border: 1px solid var(--border);
        background: var(--surface);
        color: var(--text);
        font-size: 14px;
      }
      .chips { display: flex; gap: 8px; flex-wrap: wrap; }
      .chip {
        border: 1px solid var(--border);
        background: var(--surface);
        color: var(--muted);
        padding: 8px 14px;
        border-radius: 999px;
        font-size: 13px;
        cursor: pointer;
      }
      .chip.active { background: var(--purple); border-color: var(--purple); color: #fff; }
      .test-group {
        background: var(--surface);
        border: 1px solid var(--border);
        border-radius: 14px;
        margin-bottom: 14px;
        box-shadow: var(--shadow);
        overflow: hidden;
      }
      .test-group summary {
        list-style: none;
        cursor: pointer;
        padding: 14px 18px;
        display: flex;
        align-items: center;
        gap: 12px;
        flex-wrap: wrap;
      }
      .test-group summary::-webkit-details-marker { display: none; }
      .test-title { font-weight: 600; }
      .test-file { color: var(--muted); font-size: 12px; font-family: ui-monospace, SFMono-Regular, Menlo, monospace; }
      .test-count {
        margin-left: auto;
        font-size: 12px;
        color: var(--purple);
        background: var(--purple-bg);
        padding: 2px 10px;
        border-radius: 999px;
      }
      .test-group-body { padding: 0 18px 18px; display: grid; gap: 12px; }
      .heal-card {
        border: 1px solid var(--border);
        border-radius: 12px;
        padding: 14px 16px;
        background: var(--bg);
      }
      .heal-card-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
      .heal-card-head h3 { margin: 0; font-size: 15px; }
      .badge { font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 999px; white-space: nowrap; }
      .badge-fallback { background: var(--amber-bg); color: var(--amber); }
      .badge-ai-cache { background: var(--blue-bg); color: var(--blue); }
      .badge-ai { background: var(--purple-bg); color: var(--purple); }
      .fail-list { list-style: none; margin: 10px 0 0; padding: 0; display: grid; gap: 6px; }
      .fail-list .none { color: var(--muted); font-size: 13px; }
      .fail-list li { display: flex; flex-wrap: wrap; align-items: baseline; gap: 8px; }
      .fail-reason { color: var(--muted); font-size: 12px; }
      .sel { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 13px; padding: 3px 8px; border-radius: 6px; display: inline-block; }
      .sel-fail { background: var(--red-bg); color: var(--red); text-decoration: line-through; text-decoration-thickness: 1.5px; }
      .sel-heal { background: var(--green-bg); color: var(--green); font-weight: 600; }
      .arrow-row { margin: 8px 0 4px; }
      .arrow { font-size: 12px; color: var(--muted); font-weight: 600; }
      .reasoning {
        margin: 10px 0 0;
        padding: 10px 12px;
        background: var(--purple-bg);
        border-left: 3px solid var(--purple);
        border-radius: 6px;
        font-size: 13px;
        color: var(--text);
      }
      .reasoning-label { display: block; font-size: 11px; font-weight: 700; color: var(--purple); text-transform: uppercase; margin-bottom: 3px; }
      .meta-row { display: flex; justify-content: space-between; gap: 10px; color: var(--muted); font-size: 12px; margin: 10px 0 0; }
      .empty-state {
        background: var(--surface);
        border: 1px dashed var(--border);
        border-radius: 16px;
        padding: 48px 24px;
        text-align: center;
        color: var(--muted);
      }
      .empty-icon { font-size: 36px; display: block; margin-bottom: 8px; }
      .empty-state h2 { color: var(--text); margin: 0 0 6px; }
      footer { text-align: center; color: var(--muted); font-size: 12px; padding: 20px; }
    `;
  }

  private js(): string {
    return `
      const search = document.getElementById('search');
      const chips = document.querySelectorAll('.chip');
      const cards = document.querySelectorAll('.heal-card');
      const groups = document.querySelectorAll('.test-group');
      const noMatches = document.getElementById('no-matches');
      let activeFilter = 'all';

      function applyFilters() {
        const term = (search?.value || '').toLowerCase().trim();
        let anyVisible = false;
        groups.forEach((group) => {
          let groupHasVisible = false;
          group.querySelectorAll('.heal-card').forEach((card) => {
            const matchesMethod = activeFilter === 'all' || card.dataset.method === activeFilter;
            const matchesTerm = !term || card.dataset.search.includes(term) || group.dataset.search.includes(term);
            const visible = matchesMethod && matchesTerm;
            card.hidden = !visible;
            if (visible) groupHasVisible = true;
          });
          group.hidden = !groupHasVisible;
          if (groupHasVisible) anyVisible = true;
        });
        if (noMatches) noMatches.hidden = anyVisible || cards.length === 0;
      }

      search?.addEventListener('input', applyFilters);
      chips.forEach((chip) => {
        chip.addEventListener('click', () => {
          chips.forEach((c) => c.classList.remove('active'));
          chip.classList.add('active');
          activeFilter = chip.dataset.filter;
          applyFilters();
        });
      });
    `;
  }
}
