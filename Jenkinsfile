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
            echo '🧹 Đang dọn dẹp và nén báo cáo...'

            // 1. Lưu lại screenshot và video
            archiveArtifacts artifacts: 'screenshots/**/*.png', allowEmptyArchive: true
            archiveArtifacts artifacts: 'videos/**/*.webm', allowEmptyArchive: true

            // 2. Nén thư mục allure-report thành file zip để đính kèm email
            script {
                try {
                    zip zipFile: 'Allure-Report.zip', dir: 'allure-report', archive: false
                } catch (Exception e) {
                    echo '⚠️ Không tìm thấy plugin zip, chuyển sang dùng lệnh tar...'
                    sh 'tar -czvf Allure-Report.tar.gz allure-report || true'
                }
            }

            // 3. Xóa Docker image để dọn rác
            sh "docker rmi ${TEST_IMAGE} || true"
        }

        success {
            echo '✅ Tests passed! Đang gửi Email...'

            emailext(
                subject: "[Job #${env.BUILD_NUMBER}] ✅ THÀNH CÔNG: Kết quả Test E2E Fahasa",
                body: """
                Kính gửi Team,

                Pipeline kiểm thử tự động (Fahasa E2E Tests) đã chạy THÀNH CÔNG. Dưới đây là thông tin chi tiết:

                📊 TỔNG QUAN KẾT QUẢ
                -------------------------------------------------
                • Trạng thái: PASSED ✅
                • Job Name: ${env.JOB_NAME}
                • Build Number: #${env.BUILD_NUMBER}
                • Môi trường: ${params.ENV}
                • Trình duyệt: ${params.BROWSER}
                • Tags filter: ${params.TAGS ?: 'Tất cả'}

                🔗 LINK XEM BÁO CÁO ALLURE TRỰC TUYẾN
                -------------------------------------------------
                Vui lòng xem Allure Report trực tiếp trên Jenkins tại:
                ${env.BUILD_URL}allure

                📁 TÀI LIỆU ĐÍNH KÈM
                -------------------------------------------------
                Đã đính kèm file nén của Allure Report. Bạn có thể tải về, giải nén và mở file index.html để xem offline.

                Trân trọng,
                Jenkins Automation System
                """.stripIndent(),
                to: 'LuanLB1@fpt.com', // Jenkins dùng Gmail gửi đi, nhưng sẽ gửi ĐẾN địa chỉ FPT này
                attachmentsPattern: 'Allure-Report.zip, Allure-Report.tar.gz'
            )
        }

        failure {
            echo '❌ Tests failed! Đang gửi Email...'
            emailext(
                subject: "[Job #${env.BUILD_NUMBER}] ❌ THẤT BẠI: Kết quả Test E2E Fahasa",
                body: """
                Kính gửi Team,

                Pipeline kiểm thử tự động (Fahasa E2E Tests) đã chạy THẤT BẠI.

                📊 TỔNG QUAN KẾT QUẢ
                -------------------------------------------------
                • Trạng thái: FAILED ❌ (Có Test Case bị lỗi)
                • Job Name: ${env.JOB_NAME}
                • Build Number: #${env.BUILD_NUMBER}
                • Môi trường: ${params.ENV}
                • Trình duyệt: ${params.BROWSER}

                🔗 LINK XEM CHI TIẾT LỖI VÀ VIDEO
                -------------------------------------------------
                Vui lòng check Allure Report (có chứa hình ảnh/video lúc lỗi) tại:
                ${env.BUILD_URL}allure

                📁 TÀI LIỆU ĐÍNH KÈM
                -------------------------------------------------
                Đã đính kèm file nén Allure Report.

                Trân trọng,
                Jenkins Automation System
                """.stripIndent(),
                to: 'LuanLB1@fpt.com',
                attachmentsPattern: 'Allure-Report.zip, Allure-Report.tar.gz'
            )
        }
    }
}

