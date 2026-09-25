export type LocatorDefinition = {
  description: string;
  primary: string;
  fallbacks?: string[];
};

export type InteractiveElementSnapshot = {
  tag: string;
  selectorHint: string;
  id?: string;
  name?: string;
  type?: string;
  role?: string;
  text?: string;
  placeholder?: string;
  ariaLabel?: string;
  dataAttributes?: Record<string, string>;
};

export type HealingProposal = {
  selector: string;
  reasoning: string;
};

export type HealingCacheEntry = HealingProposal & {
  description: string;
  primary: string;
  pageUrl: string;
  healedAt: string;
};

export type CheckoutInformation = {
  firstName: string;
  lastName: string;
  postalCode: string;
};
