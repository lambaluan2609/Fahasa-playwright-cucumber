@search @regression
Feature: Fahasa Product Search
  As a Fahasa user
  I want to search for products by keyword
  So that I can find and browse books and merchandise

  Background:
    Given the user opens the Fahasa homepage

  # ── Scenario 4: Search returns results (PASS) ────────────────────
  @smoke @pass
  Scenario: TC04 - Search for an existing product returns results
    When the user searches for "Doraemon"
    Then the search results page should be displayed
    And the search results should contain the keyword "Doraemon"
    And the search results should have at least 1 product

  # ── Scenario 5: Search displays correct keyword (PASS) ───────────
  @pass
  Scenario: TC05 - Search results page displays the correct searched keyword
    When the user searches for "Sách Tô Màu"
    Then the search results page should be displayed
    And the search results should contain the keyword "Sách Tô Màu"
    And the search results should have at least 1 product

  # ── Scenario 6: Data-driven search (Scenario Outline — PASS) ─────
  @data-driven @pass
  Scenario Outline: TC06 - Search for various keywords returns expected results
    When the user searches for "<keyword>"
    Then the search results page should be displayed
    And the search results should have at least <minResults> product

    Examples:
      | keyword       | minResults |
      | Doraemon      | 1          |
      | Sách Tô Màu   | 1          |
      | Harry Potter  | 1          |
