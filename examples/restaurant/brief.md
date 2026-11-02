# Lunch Desk

Build a responsive restaurant ordering app with Customer and Kitchen roles.
A clearly labeled demo role control is sufficient. Customers browse the menu,
filter by category, add items to a cart, change positive integer quantities,
and place an order with a pickup name. No online payment is requested.
The kitchen sees new orders and can mark them Preparing, Ready, or Collected.
The customer can see their order's current state. All changes persist.

Prices are USD. Order total is the sum of item price times quantity; no tax,
delivery, cleaning fee, or other fee is charged. Snapshot prices when an order
is placed, so future menu changes do not change existing order totals.

## Acceptance checks

ORDER-01: Add 2 Veggie Wraps and 1 Tomato Soup, enter a pickup name, and place
the order. The customer and kitchen see the same new order and quantities.

TOTAL1: Veggie Wrap costs $8.50 and Tomato Soup costs $6.00. The cart total for
2 wraps and 1 soup is exactly $23.00.

READY-01: The kitchen changes that order to Ready. The customer sees Ready,
including after refreshing the browser.
