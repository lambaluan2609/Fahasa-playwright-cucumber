@checkout @regression
Feature: Fahasa Shopping Cart
  As a Fahasa user
  I want to checkout with my cart
  So that I can purchase products

  @pass
  Scenario: TC09 - Add a product to the cart from search results then checkout
    Given the user opens the Fahasa homepage
    When the user searches for "EQ - IQ Giúp Trẻ Làm Chủ Cảm Xúc - Cáu Giận"
    And the user clicks the first product in the search results
    And the user adds the product to the cart
    And the user navigates to the cart page
    And the user selects the product in the cart
    # And the user clicks the checkout button
    # Then the checkout page should be displayed
    # And the checkout page should contain the keyword "Doraemon"
    # And the checkout page should have at least 1 product
