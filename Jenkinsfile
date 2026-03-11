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
//   - Jenkins Credentials: 'fahasa-credentials', 'TEAMS_WEBHOOK_URL'
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
    // ── Post actions ────────────────────────────────────────────────────────
    post {
        always {
            echo '🧹 Đang dọn dẹp và lấy số liệu thống kê...'

            // 1. Lưu lại screenshot và video
            archiveArtifacts artifacts: 'screenshots/**/*.png', allowEmptyArchive: true
            archiveArtifacts artifacts: 'videos/**/*.webm', allowEmptyArchive: true

            // 2. Xóa Docker image
            sh "docker rmi ${TEST_IMAGE} || true"

            // 3. ĐỌC FILE ALLURE SUMMARY ĐỂ LẤY SỐ LIỆU TEST (PASS/FAIL)
            script {
                try {
                    // Đọc file json báo cáo của Allure
                    def summaryText = readFile('allure-report/widgets/summary.json')
                    // Dùng JsonSlurperClassic có sẵn của Groovy để parse JSON
                    def summary = new groovy.json.JsonSlurperClassic().parseText(summaryText)

                    // Gán vào biến môi trường để dùng ở khối success/failure bên dưới
                    env.TOTAL_TESTS = summary.statistic.total ?: 0
                    env.PASSED_TESTS = summary.statistic.passed ?: 0
                    env.FAILED_TESTS = (summary.statistic.failed ?: 0) + (summary.statistic.broken ?: 0)
                    env.SKIPPED_TESTS = summary.statistic.skipped ?: 0
                } catch (Exception e) {
                    echo "⚠️ Không thể đọc số liệu từ Allure: ${e.message}"
                    env.TOTAL_TESTS = 'N/A'; env.PASSED_TESTS = 'N/A'; env.FAILED_TESTS = 'N/A'; env.SKIPPED_TESTS = 'N/A'
                }
            }
        }

        success {
            echo '✅ Tests passed! Đang gửi Email & MS Teams...'

            emailext(
                subject: "[Job #${env.BUILD_NUMBER}] ✅ THÀNH CÔNG: Kết quả Test E2E Fahasa",
                mimeType: 'text/html',
                body: """
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <p>Kính gửi Team,</p>
                    <p>Pipeline kiểm thử tự động (Fahasa E2E Tests) đã chạy <b style="color: green;">THÀNH CÔNG</b>. Dưới đây là thông tin chi tiết:</p>

                    <h3 style="color: #2e6c80;">📊 TỔNG QUAN KẾT QUẢ</h3>
                    <hr style="border: 1px solid #eee;">
                    <ul>
                        <li><b>Môi trường:</b> ${params.ENV} | <b>Trình duyệt:</b> ${params.BROWSER}</li>
                        <li><b>Tổng số Test Cases:</b> ${env.TOTAL_TESTS}</li>
                        <li><b>PASSED:</b> <span style="color: green;">${env.PASSED_TESTS} ✅</span></li>
                        <li><b>FAILED:</b> <span style="color: red;">${env.FAILED_TESTS} ❌</span></li>
                        <li><b>SKIPPED:</b> <span style="color: orange;">${env.SKIPPED_TESTS} ⚠️</span></li>
                    </ul>

                    <h3 style="color: #2e6c80;">🔗 LINK XEM BÁO CÁO ALLURE</h3>
                    <hr style="border: 1px solid #eee;">
                    <p>👉 <a href="${env.BUILD_URL}allure" style="color: #1a73e8;"><b>Mở Allure Report Chi Tiết</b></a></p>

                    <p><i>Trân trọng,<br><b>Jenkins Automation System</b></i></p>
                </div>
                """,
                to: 'lambaluan2609@gmail.com'
            )

            withCredentials([string(credentialsId: 'TEAMS_WEBHOOK_URL', variable: 'WEBHOOK')]) {
                sh """
                    curl -H "Content-Type: application/json" -d '{
                        "type": "message",
                        "attachments": [
                            {
                                "contentType": "application/vnd.microsoft.card.adaptive",
                                "content": {
                                    "\$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                                    "type": "AdaptiveCard",
                                    "version": "1.2",
                                    "body": [
                                        { "type": "TextBlock", "text": "✅ Automation Test Results", "weight": "Bolder", "size": "Medium", "color": "Good" },
                                        {
                                            "type": "FactSet",
                                            "facts": [
                                                { "title": "Environment:", "value": "${params.ENV} (${params.BROWSER})" },
                                                { "title": "Total Tests:", "value": "${env.TOTAL_TESTS}" },
                                                { "title": "Passed:", "value": "✅ ${env.PASSED_TESTS}" },
                                                { "title": "Failed:", "value": "❌ ${env.FAILED_TESTS}" }
                                            ]
                                        }
                                    ],
                                    "actions": [
                                        { "type": "Action.OpenUrl", "title": "🌐 View Allure Report", "url": "${env.BUILD_URL}allure" }
                                    ]
                                }
                            }
                        ]
                    }' \$WEBHOOK
                """
            }
        }

        failure {
            echo '❌ Tests failed! Đang gửi Email & MS Teams...'

            emailext(
                subject: "[Job #${env.BUILD_NUMBER}] ❌ THẤT BẠI: Kết quả Test E2E Fahasa",
                mimeType: 'text/html',
                body: """
                <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
                    <p>Kính gửi Team,</p>
                    <p>Pipeline kiểm thử tự động (Fahasa E2E Tests) đã chạy <b style="color: red;">THẤT BẠI</b>.</p>

                    <h3 style="color: #d93025;">📊 TỔNG QUAN KẾT QUẢ</h3>
                    <hr style="border: 1px solid #eee;">
                    <ul>
                        <li><b>Môi trường:</b> ${params.ENV} | <b>Trình duyệt:</b> ${params.BROWSER}</li>
                        <li><b>Tổng số Test Cases:</b> ${env.TOTAL_TESTS}</li>
                        <li><b>PASSED:</b> <span style="color: green;">${env.PASSED_TESTS} ✅</span></li>
                        <li><b>FAILED:</b> <span style="color: red;"><b>${env.FAILED_TESTS} ❌</b></span> (Có lỗi, cần kiểm tra gấp)</li>
                        <li><b>SKIPPED:</b> <span style="color: orange;">${env.SKIPPED_TESTS} ⚠️</span></li>
                    </ul>

                    <h3 style="color: #d93025;">🔗 LINK XEM CHI TIẾT LỖI VÀ VIDEO</h3>
                    <hr style="border: 1px solid #eee;">
                    <p>👉 <a href="${env.BUILD_URL}allure" style="color: #1a73e8;"><b>Mở Allure Report</b></a></p>

                    <p><i>Trân trọng,<br><b>Jenkins Automation System</b></i></p>
                </div>
                """,
                to: 'lambaluan2609@gmail.com'
            )

            withCredentials([string(credentialsId: 'TEAMS_WEBHOOK_URL', variable: 'WEBHOOK')]) {
                sh """
                    curl -H "Content-Type: application/json" -d '{
                        "type": "message",
                        "attachments": [
                            {
                                "contentType": "application/vnd.microsoft.card.adaptive",
                                "content": {
                                    "\$schema": "http://adaptivecards.io/schemas/adaptive-card.json",
                                    "type": "AdaptiveCard",
                                    "version": "1.2",
                                    "body": [
                                        { "type": "TextBlock", "text": "❌ Automation Test Results", "weight": "Bolder", "size": "Medium", "color": "Attention" },
                                        {
                                            "type": "FactSet",
                                            "facts": [
                                                { "title": "Environment:", "value": "${params.ENV} (${params.BROWSER})" },
                                                { "title": "Total Tests:", "value": "${env.TOTAL_TESTS}" },
                                                { "title": "Passed:", "value": "✅ ${env.PASSED_TESTS}" },
                                                { "title": "Failed:", "value": "❌ ${env.FAILED_TESTS}" }
                                            ]
                                        },
                                        { "type": "TextBlock", "text": "⚠️ Cảnh báo: Có ${env.FAILED_TESTS} test case bị lỗi. Bấm vào nút bên dưới để xem video lỗi.", "wrap": true, "color": "Attention" }
                                    ],
                                    "actions": [
                                        { "type": "Action.OpenUrl", "title": "🌐 View Allure Report", "url": "${env.BUILD_URL}allure" }
                                    ]
                                }
                            }
                        ]
                    }' \$WEBHOOK
                """
            }
        }
    }
}
