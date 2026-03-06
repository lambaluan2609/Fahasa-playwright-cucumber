@cart @regression
Feature: Fahasa Shopping Cart
  As a Fahasa user
  I want to add products to my shopping cart
  So that I can review items before purchasing

  # ── Scenario 7: Add product to cart (PASS) ───────────────────────
  @smoke @pass
  Scenario: TC07 - Add a product to the cart from search results
    Given the user opens the Fahasa homepage and logs in
    When the user searches for "Doraemon"
    And the user clicks the first product in the search results
    And the user adds the product to the cart
    And the user navigates to the cart page
    Then the cart should contain at least 1 item
    And the cart item name should not be empty

  # ── Scenario 8: Verify product price in cart (FAIL — intentional) ─
  @fail
  Scenario: TC08 - Verify cart displays product with expected price format
    Given the user opens the Fahasa homepage and logs in
    When the user searches for "Doraemon"
    And the user clicks the first product in the search results
    And the user adds the product to the cart
    And the user navigates to the cart page
    Then the cart item price should be "999.999 đ"
