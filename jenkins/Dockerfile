# =============================================================================
# Custom Jenkins image with Docker CLI + Allure plugin pre-installed
#
# Based on official Jenkins LTS image.
# Adds:
#   - Docker CLI (to run test containers from Jenkins pipelines)
#   - Allure Jenkins Plugin (for Allure report publishing)
# =============================================================================

FROM jenkins/jenkins:lts

USER root

# Install Docker CLI inside Jenkins container
RUN apt-get update -qq && \
    apt-get install -y -qq docker.io && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

USER jenkins

# Pre-install Allure Jenkins Plugin
RUN jenkins-plugin-cli --plugins allure-jenkins-plugin
