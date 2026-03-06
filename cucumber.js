/**
 * Cucumber.js configuration file
 *
 * Defines feature file paths, step definitions, hooks,
 * formatter (Allure), parallel workers, and timeout settings.
 */

// Set Allure results directory via environment variable 
process.env.ALLURE_RESULTS_DIR = process.env.ALLURE_RESULTS_DIR || 'allure-results';

module.exports = {
  default: {
    // Feature file locations
    paths: ['features/specs/**/*.feature'],

    // Step definitions & support files (TypeScript)
    require: [
      'features/support/**/*.ts',
      'features/step-definitions/**/*.ts',
    ],

    // Use ts-node to transpile TypeScript on-the-fly
    requireModule: ['ts-node/register'],

    // Allure reporter + console summary
    format: [
      'allure-cucumberjs/reporter',
      'summary',
      'progress-bar',
    ],

    // Format options passed to all formatters (including Allure)
    formatOptions: {
      resultsDir: 'allure-results',
    },

    // Default timeout per step (120 seconds — Fahasa pages load slowly)
    timeout: 120_000,

    worldParameters: {},

    // Parallel execution: set via --parallel flag or default to 1
    // Use `npm run test:parallel` for parallel mode
  },
};
