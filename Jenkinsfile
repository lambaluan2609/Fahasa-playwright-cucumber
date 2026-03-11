pipeline {
    agent any

    parameters {
        choice(name: 'ENV', choices: ['qa', 'stg', 'dev'], description: 'Select test environment')
        choice(name: 'BROWSER', choices: ['chrome', 'firefox', 'safari'], description: 'Select browser')
        string(name: 'TAGS', defaultValue: '', description: 'Cucumber tags (e.g., @smoke, @regression)')
    }

    environment {
        TEST_IMAGE = 'fahasa-playwright-tests'
    }

    stages {
        stage('Checkout') {
            steps {
                echo '📥 Checking out source code...'
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                echo "🐳 Building Docker image: ${TEST_IMAGE}"
                sh "docker build -t ${TEST_IMAGE} ."
            }
        }

        stage('Run Tests') {
            steps {
                echo "🚀 Running tests — ENV: ${params.ENV} | Browser: ${params.BROWSER}"
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
                                    -e ALLURE_RESULTS_DIR=/app/allure-results \
                                    -e FAHASA_USERNAME=\$FAHASA_USERNAME \
                                    -e FAHASA_PASSWORD=\$FAHASA_PASSWORD \
                                    ${TEST_IMAGE} ${tagArg}
                            """
                        } catch (err) {
                            currentBuild.result = 'FAILURE'
                            echo '⚠️ Test có lỗi...'
                        } finally {
                            sh """
                                docker cp ${containerName}:/app/allure-results/. ./allure-results/ || echo "No allure"
                                docker cp ${containerName}:/app/screenshots/. ./screenshots/ || echo "No images"
                                docker cp ${containerName}:/app/videos/. ./videos/ || echo "No video"
                                docker rm -f ${containerName} || true
                            """
                        }
                    }
                }
            }
        }

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

    post {
        always {
            echo '🧹 Cleanup and Statistics...'
            archiveArtifacts artifacts: 'screenshots/**/*.png', allowEmptyArchive: true
            archiveArtifacts artifacts: 'videos/**/*.webm', allowEmptyArchive: true
            sh "docker rmi ${TEST_IMAGE} || true"

            script {
                try {
                    def summaryText = readFile('allure-report/widgets/summary.json')
                    def summary = new groovy.json.JsonSlurperClassic().parseText(summaryText)

                    env.TOTAL_TESTS = summary.statistic.total ?: 0
                    env.PASSED_TESTS = summary.statistic.passed ?: 0
                    env.FAILED_TESTS = (summary.statistic.failed ?: 0) + (summary.statistic.broken ?: 0)
                    env.SKIPPED_TESTS = summary.statistic.skipped ?: 0

                    if (env.FAILED_TESTS.toInteger() > 0) {
                        env.MSG_COLOR = 'Attention'
                        env.MSG_ICON = '❌'
                    } else {
                        env.MSG_COLOR = 'Good'
                        env.MSG_ICON = '✅'
                    }
                } catch (Exception e) {
                    echo "⚠️ Allure Read Error: ${e.message}"
                    env.TOTAL_TESTS = 'N/A'
                    env.PASSED_TESTS = 'N/A'
                    env.FAILED_TESTS = 'N/A'
                    env.SKIPPED_TESTS = 'N/A'
                    env.MSG_COLOR = 'Default'
                    env.MSG_ICON = '📊'
                }
            }
        }

        success {
            emailext(
                subject: "[Job #${env.BUILD_NUMBER}] ✅ THÀNH CÔNG: Fahasa E2E",
                mimeType: 'text/html',
                body: "<h3>✅ PASS: ${env.TOTAL_TESTS} cases</h3>" +
                      "<p>Link: <a href='${env.BUILD_URL}allure'>Report</a></p>",
                to: 'lambaluan2609@gmail.com'
            )
            sendTeamsNotification('SUCCESS')
        }

        failure {
            emailext(
                subject: "[Job #${env.BUILD_NUMBER}] ❌ THẤT BẠI: Fahasa E2E",
                mimeType: 'text/html',
                body: "<h3>❌ FAIL: ${env.FAILED_TESTS} cases</h3>" +
                      "<p>Link: <a href='${env.BUILD_URL}allure'>Report</a></p>",
                to: 'lambaluan2609@gmail.com'
            )
            sendTeamsNotification('FAILURE')
        }
    }
}

def sendTeamsNotification(String status) {
    def logoUrl = 'https://raw.githubusercontent.com/allure-framework/allure2/master/allure-brand/allure-logo.png'
    withCredentials([string(credentialsId: 'TEAMS_WEBHOOK_URL', variable: 'WEBHOOK')]) {
        sh '''
            curl -H "Content-Type: application/json" -d "{
                \\"type\\": \\"message\\",
                \\"attachments\\": [
                    {
                        \\"contentType\\": \\"application/vnd.microsoft.card.adaptive\\",
                        \\"content\\": {
                            \\"\$schema\\": \\"http://adaptivecards.io/schemas/adaptive-card.json\\",
                            \\"type\\": \\"AdaptiveCard\\",
                            \\"version\\": \\"1.2\\",
                            \\"body\\": [
                                {
                                    \\"type\\": \\"Image\\",
                                    \\"url\\": \\"''' + logoUrl + '''\\",
                                    \\"size\\": \\"Stretch\\"
                                },
                                {
                                    \\"type\\": \\"TextBlock\\",
                                    \\"text\\": \\"''' + env.MSG_ICON + ''' FAHASA REPORT: ''' + status + '''\\",
                                    \\"weight\\": \\"Bolder\\",
                                    \\"size\\": \\"Large\\",
                                    \\"color\\": \\"''' + env.MSG_COLOR + '''\\"
                                },
                                {
                                    \\"type\\": \\"FactSet\\",
                                    \\"facts\\": [
                                        { \\"title\\": \\"Env:\\", \\"value\\": \\"''' + params.ENV + '''\\" },
                                        { \\"title\\": \\"Total:\\", \\"value\\": \\"''' + env.TOTAL_TESTS + '''\\" },
                                        { \\"title\\": \\"Passed:\\", \\"value\\": \\"''' + env.PASSED_TESTS + '''\\" },
                                        { \\"title\\": \\"Failed:\\", \\"value\\": \\"''' + env.FAILED_TESTS + '''\\" }
                                    ]
                                }
                            ],
                            \\"actions\\": [
                                {
                                    \\"type\\": \\"Action.OpenUrl\\",
                                    \\"title\\": \\"🌐 View Allure\\",
                                    \\"url\\": \\"''' + env.BUILD_URL + '''allure\\"
                                }
                            ]
                        }
                    }
                ]
            }" $WEBHOOK
        '''
    }
}
