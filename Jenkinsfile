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
    post {
        always {
            echo '🧹 Đang dọn dẹp...'

            // 1. Lưu lại screenshot và video
            archiveArtifacts artifacts: 'screenshots/**/*.png', allowEmptyArchive: true
            archiveArtifacts artifacts: 'videos/**/*.webm', allowEmptyArchive: true

            // 2. Xóa Docker image để dọn rác
            sh "docker rmi ${TEST_IMAGE} || true"
        }

        success {
            echo '✅ Tests passed! Đang gửi Email & MS Teams...'

            // --- 1. GỬI EMAIL (Đã gỡ file Zip) ---
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
                        <li><b>Trạng thái:</b> <span style="color: green;">PASSED ✅</span></li>
                        <li><b>Job Name:</b> ${env.JOB_NAME}</li>
                        <li><b>Build Number:</b> #${env.BUILD_NUMBER}</li>
                        <li><b>Môi trường:</b> ${params.ENV}</li>
                        <li><b>Trình duyệt:</b> ${params.BROWSER}</li>
                        <li><b>Tags filter:</b> ${params.TAGS ?: 'Tất cả'}</li>
                    </ul>

                    <h3 style="color: #2e6c80;">🔗 LINK XEM BÁO CÁO ALLURE</h3>
                    <hr style="border: 1px solid #eee;">
                    <p>Vui lòng xem Allure Report trực tiếp trên Jenkins tại:<br>
                    👉 <a href="${env.BUILD_URL}allure" style="color: #1a73e8;"><b>Mở Allure Report</b></a></p>

                    <p><i>Trân trọng,<br><b>Jenkins Automation System</b></i></p>
                </div>
                """,
                to: 'lambaluan2609@gmail.com'
            )

            // --- 2. GỬI MS TEAMS (Đã fix lỗi JSON schema) ---
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
                                        {
                                            "type": "TextBlock",
                                            "text": "✅ Automation Test Results",
                                            "weight": "Bolder",
                                            "size": "Medium",
                                            "color": "Good"
                                        },
                                        {
                                            "type": "FactSet",
                                            "facts": [
                                                { "title": "Job Number:", "value": "#${env.BUILD_NUMBER}" },
                                                { "title": "Environment:", "value": "${params.ENV}" },
                                                { "title": "Browser:", "value": "${params.BROWSER}" },
                                                { "title": "Status:", "value": "PASSED" }
                                            ]
                                        },
                                        {
                                            "type": "TextBlock",
                                            "text": "👉 Click the button below to view full details and evidence.",
                                            "wrap": true
                                        }
                                    ],
                                    "actions": [
                                        {
                                            "type": "Action.OpenUrl",
                                            "title": "🌐 View Allure Report",
                                            "url": "${env.BUILD_URL}allure"
                                        }
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

            // --- 1. GỬI EMAIL CẢNH BÁO (Đã gỡ file Zip) ---
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
                        <li><b>Trạng thái:</b> <span style="color: red;">FAILED ❌</span> (Có Test Case bị lỗi)</li>
                        <li><b>Job Name:</b> ${env.JOB_NAME}</li>
                        <li><b>Build Number:</b> #${env.BUILD_NUMBER}</li>
                        <li><b>Môi trường:</b> ${params.ENV}</li>
                        <li><b>Trình duyệt:</b> ${params.BROWSER}</li>
                    </ul>

                    <h3 style="color: #d93025;">🔗 LINK XEM CHI TIẾT LỖI VÀ VIDEO</h3>
                    <hr style="border: 1px solid #eee;">
                    <p>Vui lòng check Allure Report (có chứa hình ảnh/video lúc lỗi) tại:<br>
                    👉 <a href="${env.BUILD_URL}allure" style="color: #1a73e8;"><b>Mở Allure Report</b></a></p>

                    <p><i>Trân trọng,<br><b>Jenkins Automation System</b></i></p>
                </div>
                """,
                to: 'lambaluan2609@gmail.com'
            )

            // --- 2. GỬI MS TEAMS CẢNH BÁO (Đã fix lỗi JSON schema) ---
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
                                        {
                                            "type": "TextBlock",
                                            "text": "❌ Automation Test Results",
                                            "weight": "Bolder",
                                            "size": "Medium",
                                            "color": "Attention"
                                        },
                                        {
                                            "type": "FactSet",
                                            "facts": [
                                                { "title": "Job Number:", "value": "#${env.BUILD_NUMBER}" },
                                                { "title": "Environment:", "value": "${params.ENV}" },
                                                { "title": "Browser:", "value": "${params.BROWSER}" },
                                                { "title": "Status:", "value": "FAILED" }
                                            ]
                                        },
                                        {
                                            "type": "TextBlock",
                                            "text": "⚠️ Cảnh báo: Có test case bị lỗi. Bấm vào nút bên dưới để xem chi tiết log, screenshot và video lỗi.",
                                            "wrap": true
                                        }
                                    ],
                                    "actions": [
                                        {
                                            "type": "Action.OpenUrl",
                                            "title": "🌐 View Allure Report",
                                            "url": "${env.BUILD_URL}allure"
                                        }
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
