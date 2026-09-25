import OpenAI from 'openai';
import { env } from '@utils/env';
import { HealingProposal, InteractiveElementSnapshot, LocatorDefinition } from '@utils/types';

let client: OpenAI | undefined;

function getClient(): OpenAI {
  if (!env.ai.apiKey) {
    throw new Error('OPENAI_API_KEY is not set. Set it to enable AI self-healing.');
  }
  client ??= new OpenAI({ apiKey: env.ai.apiKey });
  return client;
}

const SYSTEM_PROMPT = `You are a Playwright locator-healing agent. Given a description of the element a test
is trying to find, the selectors that already failed, and a snapshot of candidate interactive elements
currently on the page, propose ONE replacement CSS selector that most likely matches the intended element.

Rules:
- Respond ONLY with strict JSON: {"selector": string, "reasoning": string}.
- The selector must be a valid CSS selector usable with Playwright's page.locator().
- Prefer stable attributes (data-test, data-testid, data-qa, id, name, role) over text or position.
- Never invent an attribute value that isn't present in the provided snapshot.
- If nothing in the snapshot plausibly matches, respond with {"selector": "", "reasoning": "no plausible match"}.`;

export class HealingAgent {
  async proposeSelector(params: {
    definition: LocatorDefinition;
    failedSelectors: string[];
    snapshot: InteractiveElementSnapshot[];
    pageUrl: string;
  }): Promise<HealingProposal | null> {
    const { definition, failedSelectors, snapshot, pageUrl } = params;

    const userPrompt = JSON.stringify({
      pageUrl,
      elementDescription: definition.description,
      failedSelectors,
      candidateElements: snapshot
    });

    const response = await getClient().chat.completions.create({
      model: env.ai.model,
      temperature: 0,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt }
      ]
    });

    const raw = response.choices[0]?.message?.content;
    if (!raw) return null;

    let parsed: HealingProposal;
    try {
      parsed = JSON.parse(raw) as HealingProposal;
    } catch {
      return null;
    }

    if (!parsed.selector) return null;
    return parsed;
  }
}
