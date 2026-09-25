import { LocatorDefinition } from '@utils/types';

export const CheckoutLocators = {
  firstName: { description: 'First name input', primary: '[data-test="firstName"]', fallbacks: ['#first-name'] },
  lastName: { description: 'Last name input', primary: '[data-test="lastName"]', fallbacks: ['#last-name'] },
  postalCode: { description: 'Postal code input', primary: '[data-test="postalCode"]', fallbacks: ['#postal-code'] },
  continueButton: { description: 'Continue checkout button', primary: '[data-test="continue"]', fallbacks: ['#continue'] },
  finishButton: { description: 'Finish checkout button', primary: '[data-test="finish"]', fallbacks: ['#finish'] },
  error: { description: 'Checkout error', primary: '[data-test="error"]', fallbacks: ['.error-message-container h3'] },
  completeHeader: { description: 'Checkout complete header', primary: '[data-test="complete-header"]', fallbacks: ['.complete-header'] },
  totalLabel: { description: 'Checkout total label', primary: '[data-test="total-label"]', fallbacks: ['.summary_total_label'] }
} satisfies Record<string, LocatorDefinition>;
