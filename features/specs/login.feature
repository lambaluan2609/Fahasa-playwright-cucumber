@login @regression
Feature: Fahasa Login Functionality
  As a Fahasa user
  I want to log in to my account
  So that I can access personalized features and make purchases

  Background:
    Given the user opens the Fahasa homepage

  # ── Scenario 1: Successful login (PASS) ──────────────────────────
  @smoke @pass
  Scenario: TC01 - Successful login with valid credentials
    When the user clicks the account button
    And the user logs in with valid credentials
    Then the user should be redirected to the account page
    And the page title should contain "Fahasa"

  # ── Scenario 2: Failed login with invalid credentials (FAIL) ─────
  @fail
  Scenario: TC02 - Login fails with invalid credentials
    When the user clicks the account button
    And the user logs in with username "0868470229" and password "WrongPass123!"
    Then the login should fail with an error message

  # ── Scenario 3: Data-driven login (Scenario Outline) ─────────────
  @data-driven @pass
  Scenario Outline: TC03 - Login with multiple credential sets
    When the user clicks the account button
    And the user logs in with username "<username>" and password "<password>"
    Then the login result should be "<expectedResult>"
    Then the user opens the Fahasa homepage

    Examples:
      | username      | password          | expectedResult |
      | 0868470229    | lAMBALU@N2609     | success        |
      | 0868470229 | wrongpassword     | failure        |
