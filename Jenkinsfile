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
                echo '📥 Checking out source code...'
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

                sh 'rm -rf allure-results && mkdir -p allure-results screenshots videos'

                withCredentials([
                    string(credentialsId: 'FAHASA_USERNAME', variable: 'FAHASA_USERNAME'),
                    string(credentialsId: 'FAHASA_PASSWORD', variable: 'FAHASA_PASSWORD')
                ]) {
                    script {
                        def tagArg = params.TAGS ? "--tags ${params.TAGS}" : ''
                        def containerName = "fahasa-tests-${env.BUILD_NUMBER}"

                        try {
                            sh """
                                docker run --name ${containerName} \
                                    -e ENV=${params.ENV} \
                                    -e BROWSER=${params.BROWSER} \
                                    -e HEADLESS=true \
                                    -e SLOW_MO=0 \
                                    -e ALLURE_RESULTS_DIR=/app/allure-results \
                                    -e FAHASA_USERNAME=\$FAHASA_USERNAME \
                                    -e FAHASA_PASSWORD=\$FAHASA_PASSWORD \
                                    ${TEST_IMAGE} ${tagArg}
                            """
                        } catch (err) {
                            currentBuild.result = 'FAILURE'
                            echo '⚠️ Test có lỗi, đang tiến hành lấy report...'
                        } finally {
                            // Khối này đảm bảo luôn lấy file ra ngoài dù test pass hay fail
                            echo '📦 Đang copy kết quả từ Docker ra Jenkins Workspace...'

                            sh """
                                docker cp ${containerName}:/app/allure-results/. ./allure-results/ || echo "Không có file allure"
                                docker cp ${containerName}:/app/screenshots/. ./screenshots/ || echo "Không có file screenshot"
                                docker cp ${containerName}:/app/videos/. ./videos/ || echo "Không có file video"

                                echo "🧹 Đang xóa container test..."
                                docker rm -f ${containerName} || true
                            """
                        }

                        // Debug: Kiểm tra xem file đã ra ngoài an toàn chưa
                        sh 'echo "📂 Allure results contents:" && ls -la allure-results/ && echo "Total files: $(find allure-results -type f | wc -l)"'
                    }
                }
            }
        }

        // ── Stage 4: Publish Allure Report ──────────────────────────────────
        stage('Publish Report') {
            steps {
                allure(
                    includeProperties: false,
                    jdk: '',
                    results: [[path: 'allure-results']]
                )
            }
        }
    }

    // ── Post actions ────────────────────────────────────────────────────────
    post {
        always {
            echo '🧹 Cleaning up...'

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
            echo '❌ Tests failed! Check Allure report for details.'
        }
    }
}
