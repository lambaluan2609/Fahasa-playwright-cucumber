# =============================================================================
# Fahasa Playwright Test Suite — Docker Image
#
# Uses official Playwright image with pre-installed browsers (Chromium, Firefox, WebKit).
#
# Build:
#   docker build -t fahasa-tests .
#
# Run:
#   docker run --rm -e ENV=qa -e BROWSER=chrome fahasa-tests
#   docker run --rm -e ENV=stg -e BROWSER=firefox fahasa-tests --tags @smoke
#   docker run --rm -e ENV=dev -e BROWSER=safari fahasa-tests --tags @regression
# =============================================================================

FROM mcr.microsoft.com/playwright:v1.58.2-noble

WORKDIR /app

# Copy dependency files first for Docker layer caching
COPY package.json package-lock.json ./

# Install dependencies (clean install for reproducibility)
RUN npm ci

# Copy the rest of the project
COPY . .

# ── Default environment variables ────────────────────────────────────────────
# These can be overridden at runtime with -e or --env-file
ENV ENV=qa
ENV BROWSER=chrome
ENV HEADLESS=true
ENV SLOW_MO=0

# ── Entrypoint ───────────────────────────────────────────────────────────────
# Allows passing extra args like --tags @smoke
ENTRYPOINT ["npx","cucumber-js","--config","cucumber.js","--format","allure-cucumberjs/reporter","--format-options","{\"resultsDir\":\"allure-results\"}"]