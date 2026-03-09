/**
 * Cucumber.js configuration file
 *
 * Defines feature file paths, step definitions, hooks,
 * formatter (Allure), parallel workers, and timeout settings.
 */

// Set Allure results directory via environment variable
process.env.ALLURE_RESULTS_DIR =
  process.env.ALLURE_RESULTS_DIR || "allure-results";

module.exports = {
  default: {
    paths: ["features/specs/**/*.feature"],

    require: ["features/support/**/*.ts", "features/step-definitions/**/*.ts"],

    requireModule: ["ts-node/register"],

    format: ["allure-cucumberjs/reporter", "summary", "progress"],

    formatOptions: {
      resultsDir: process.env.ALLURE_RESULTS_DIR,
    },

    timeout: 120000,
  },
};
