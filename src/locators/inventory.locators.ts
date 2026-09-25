import { LocatorDefinition } from '@utils/types';

export const InventoryLocators = {
  title: { description: 'Products page title', primary: '[data-test="title"]', fallbacks: ['.title'] },
  cartBadge: { description: 'Shopping cart badge', primary: '[data-test="shopping-cart-badge"]', fallbacks: ['.shopping_cart_badge'] },
  cartLink: { description: 'Shopping cart link', primary: '[data-test="shopping-cart-link"]', fallbacks: ['.shopping_cart_link'] },
  sortDropdown: { description: 'Product sort dropdown', primary: '[data-test="product-sort-container"]', fallbacks: ['.product_sort_container'] },
  inventoryItem: { description: 'Inventory item card', primary: '[data-test="inventory-item"]', fallbacks: ['.inventory_item'] },
  itemName: { description: 'Inventory item name', primary: '[data-test="inventory-item-name"]', fallbacks: ['.inventory_item_name'] },
  itemPrice: { description: 'Inventory item price', primary: '[data-test="inventory-item-price"]', fallbacks: ['.inventory_item_price'] }
} satisfies Record<string, LocatorDefinition>;
