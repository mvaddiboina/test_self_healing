import { LocatorDefinition } from '@utils/types';

export const CartLocators = {
  title: { description: 'Cart page title', primary: '[data-test="title"]', fallbacks: ['.title'] },
  cartItem: { description: 'Cart item', primary: '[data-test="inventory-item"]', fallbacks: ['.cart_item'] },
  checkoutButton: { description: 'Checkout button', primary: '[data-test="checkout"]', fallbacks: ['#checkout'] },
  continueShoppingButton: { description: 'Continue shopping button', primary: '[data-test="continue-shopping"]', fallbacks: ['#continue-shopping'] }
} satisfies Record<string, LocatorDefinition>;
