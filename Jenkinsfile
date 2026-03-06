// =============================================================================
// Jenkinsfile — Fahasa Playwright E2E Tests
//
// Parameterized pipeline for running Cucumber + Playwright tests in Docker.
// User selects Environment (QA/STG/DEV), Browser (Chrome/Firefox/Safari),
// and optional Cucumber tags via Jenkins UI.
//
// Prerequisites:
//   - Jenkins with Docker Pipeline plugin
//   - Docker installed on Jenkins agent
//   - Allure Jenkins Plugin (for report publishing)
//   - Jenkins Credentials: 'fahasa-credentials' (Secret file or env vars)
// =============================================================================

pipeline {
    agent any

    // ── Parameters — Shown in Jenkins UI ────────────────────────────────────
    parameters {
        choice(
            name: 'ENV',
            choices: ['qa', 'stg', 'dev'],
            description: 'Select test environment'
        )
        choice(
            name: 'BROWSER',
            choices: ['chrome', 'firefox', 'safari'],
            description: 'Select browser to run tests'
        )
        string(
            name: 'TAGS',
            defaultValue: '',
            description: 'Cucumber tags to filter tests (e.g., @smoke, @regression, @cart)'
        )
    }

    // ── Environment variables ───────────────────────────────────────────────
    environment {
        // Docker image name for the test suite
        TEST_IMAGE = 'fahasa-playwright-tests'
    }

    stages {
        // ── Stage 1: Checkout source code ───────────────────────────────────
        stage('Checkout') {
            steps {
                echo "📥 Checking out source code..."
                checkout scm
            }
        }

        // ── Stage 2: Build Docker image ─────────────────────────────────────
        stage('Build Docker Image') {
            steps {
                echo "🐳 Building Docker image: ${TEST_IMAGE}"
                sh "docker build -t ${TEST_IMAGE} ."
            }
        }

        // ── Stage 3: Run tests inside Docker container ──────────────────────
        stage('Run Tests') {
            steps {
                echo "🚀 Running tests — ENV: ${params.ENV} | Browser: ${params.BROWSER} | Tags: ${params.TAGS ?: 'all'}"

                // Clean previous results
                sh 'rm -rf allure-results && mkdir -p allure-results screenshots videos'

                script {
                    // Build the docker run command
                    def tagArg = params.TAGS ? "--tags ${params.TAGS}" : ""

                    sh """
                        docker run --rm \
                            -e ENV=${params.ENV} \
                            -e BROWSER=${params.BROWSER} \
                            -e HEADLESS=true \
                            -e SLOW_MO=0 \
                            -v \${WORKSPACE}/allure-results:/app/allure-results \
                            -v \${WORKSPACE}/screenshots:/app/screenshots \
                            -v \${WORKSPACE}/videos:/app/videos \
                            -v \${WORKSPACE}/env:/app/env:ro \
                            ${TEST_IMAGE} ${tagArg}
                    """
                }
            }
        }

        // ── Stage 4: Publish Allure Report ──────────────────────────────────
        stage('Publish Report') {
            steps {
allure includeProperties: false, installation: 'allure', jdk: '', properties: [], reportBuildPolicy: 'ALWAYS', results: [[path: 'allure-results']]            }
        }
    }

    // ── Post actions ────────────────────────────────────────────────────────
    post {
        always {
            echo "🧹 Cleaning up..."

            // Archive screenshots on failure
            archiveArtifacts artifacts: 'screenshots/**/*.png', allowEmptyArchive: true
            archiveArtifacts artifacts: 'videos/**/*.webm', allowEmptyArchive: true

            // Remove Docker image to save disk space (optional)
            sh "docker rmi ${TEST_IMAGE} || true"
        }

        success {
            echo "✅ Tests passed! ENV: ${params.ENV} | Browser: ${params.BROWSER}"
        }

        failure {
            echo "❌ Tests failed! Check Allure report for details."
        }
    }
}
