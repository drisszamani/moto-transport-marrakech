pipeline {
  agent any

  triggers {
    githubPush()
  }
  parameters {
    booleanParam(name: 'RUN_TESTS', defaultValue: false, description: 'Exécuter les tests backend ?')
    booleanParam(name: 'RUN_LINT', defaultValue: false, description: 'Exécuter le lint monorepo ? (sinon ignoré)')
  }
  environment {
    CI = 'true'
    TRIVY_CACHE_DIR = "${WORKSPACE}/.trivy-cache"
  }
  stages {
    stage('Checkout') {
      steps {
        checkout scm
      }
    }

    stage('Gitleaks Scan') {
      steps {
        sh '''
          docker run --rm -v $PWD:/repo zricethezav/gitleaks:latest detect --source=/repo --no-git --report-path=gitleaks-report.json || true
        '''
        archiveArtifacts artifacts: 'gitleaks-report.json', allowEmptyArchive: true
      }
    }

    stage('Install deps') {
      steps {
        sh '''
          corepack enable && corepack prepare pnpm@10.17.0 --activate &&
          pnpm --version &&
          pnpm install -r
        '''
      }
    }

    stage('Lint (monorepo)') {
      when { expression { return params.RUN_LINT } }
      steps {
        script {
          catchError(buildResult: 'SUCCESS', stageResult: 'UNSTABLE') {
            sh '''
              corepack enable && corepack prepare pnpm@10.17.0 --activate &&
              pnpm lint
            '''
          }
        }
      }
    }

    stage('Typecheck (monorepo)') {
      steps {
        sh '''
          corepack enable && corepack prepare pnpm@10.17.0 --activate &&
          pnpm check-types
        '''
      }
    }

    stage('Trivy FS Scan') {
      steps {
        script {
          catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {
            sh """
              echo "Lancement de l'analyse Trivy FS sur le workspace..."
              mkdir -p ${TRIVY_CACHE_DIR}

              docker run --rm \
                -v ${WORKSPACE}:/repo \
                -v ${TRIVY_CACHE_DIR}:/root/.cache/ \
                aquasec/trivy:latest fs \
                  --scanners vuln,misconfig \
                  --severity HIGH,CRITICAL \
                  --format sarif \
                  --output /repo/trivy-fs-report.sarif \
                  --no-progress \
                  /repo

              echo "Analyse Trivy FS terminée"
            """
          }
          archiveArtifacts artifacts: 'trivy-fs-report.sarif', allowEmptyArchive: true
        }
      }
    }

    stage('SonarQube analysis') {
      steps {
        withSonarQubeEnv('O-Taxi') {
          sh '''
            export SONAR_SCANNER_OPTS="-Xmx1024m -XX:+UseSerialGC -XX:+ExitOnOutOfMemoryError" &&
            sonar-scanner \
              -Dsonar.projectKey=O-Taxi \
              -Dsonar.sources=. \
              -Dsonar.host.url=$SONAR_HOST_URL
          '''
        }
      }
    }

    stage('Backend: tests (optionnel)') {
      when { expression { return params.RUN_TESTS } }
      steps {
        sh '''
          corepack enable && corepack prepare pnpm@10.17.0 --activate &&
          pnpm --filter backend test
        '''
      }
    }

    stage('Build Apps') {
      steps {
        parallel (
          'Build Web App' : {
            sh '''
              corepack enable && corepack prepare pnpm@10.17.0 --activate &&
              pnpm --filter web build
            '''
          },
          'Build Admin App' : {
            sh '''
              corepack enable && corepack prepare pnpm@10.17.0 --activate &&
              pnpm --filter admin build
            '''
          },
          'Build Docs' : {
            sh '''
              corepack enable && corepack prepare pnpm@10.17.0 --activate &&
              pnpm --filter docs build
            '''
          },
          'Build Backend' : {
            sh '''
              corepack enable && corepack prepare pnpm@10.17.0 --activate &&
              pnpm --filter backend build
            '''
          }
        )
      }
    }

    stage('Build Docker Images') {
      parallel {
        stage('Build Backend Docker') {
          when { expression { return fileExists('apps/backend/Dockerfile') } }
          steps {
            script {
              def commitShort = sh(script: "git rev-parse --short=7 HEAD", returnStdout: true).trim()
              sh "docker build -t moto-backend:${commitShort} -f apps/backend/Dockerfile ."
              env.BACKEND_IMAGE = "moto-backend:${commitShort}"
            }
          }
        }
        stage('Build Web Docker') {
          when { expression { return fileExists('apps/web/Dockerfile') } }
          steps {
            script {
              def commitShort = sh(script: "git rev-parse --short=7 HEAD", returnStdout: true).trim()
              sh "docker build -t moto-web:${commitShort} -f apps/web/Dockerfile ."
              env.WEB_IMAGE = "moto-web:${commitShort}"
            }
          }
        }
        stage('Build Admin Docker') {
          when { expression { return fileExists('apps/admin/Dockerfile') } }
          steps {
            script {
              def commitShort = sh(script: "git rev-parse --short=7 HEAD", returnStdout: true).trim()
              sh "docker build -t moto-admin:${commitShort} -f apps/admin/Dockerfile ."
              env.ADMIN_IMAGE = "moto-admin:${commitShort}"
            }
          }
        }
      }
    }

    stage('Trivy Image Scan') {
      parallel {

        stage('Scan Backend Image') {
          when { expression { return env.BACKEND_IMAGE != null } }
          steps {
            script {
              catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {
                sh """
                  echo "Scanning ${env.BACKEND_IMAGE} with Trivy..."
                  mkdir -p ${TRIVY_CACHE_DIR}
                  
                  # Vérifier que l'image existe
                  docker images ${env.BACKEND_IMAGE}
                  
                  docker run --rm \
                    -v /var/run/docker.sock:/var/run/docker.sock \
                    -v ${TRIVY_CACHE_DIR}:/root/.cache/ \
                    -v ${WORKSPACE}:/repo \
                    aquasec/trivy:latest image \
                      --severity HIGH,CRITICAL \
                      --format sarif \
                      --output /repo/trivy-backend.sarif \
                      --no-progress \
                      ${env.BACKEND_IMAGE}
                  
                  echo "Trivy backend scan completed"
                """
              }
              archiveArtifacts artifacts: 'trivy-backend.sarif', allowEmptyArchive: true
            }
          }
        }

        stage('Scan Web Image') {
          when { expression { return env.WEB_IMAGE != null } }
          steps {
            script {
              catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {
                sh """
                  echo "Scanning ${env.WEB_IMAGE} with Trivy..."
                  mkdir -p ${TRIVY_CACHE_DIR}
                  
                  # Vérifier que l'image existe
                  docker images ${env.WEB_IMAGE}
                  
                  docker run --rm \
                    -v /var/run/docker.sock:/var/run/docker.sock \
                    -v ${TRIVY_CACHE_DIR}:/root/.cache/ \
                    -v ${WORKSPACE}:/repo \
                    aquasec/trivy:latest image \
                      --severity HIGH,CRITICAL \
                      --format sarif \
                      --output /repo/trivy-web.sarif \
                      --no-progress \
                      ${env.WEB_IMAGE}
                  
                  echo "Trivy web scan completed"
                """
              }
              archiveArtifacts artifacts: 'trivy-web.sarif', allowEmptyArchive: true
            }
          }
        }

        stage('Scan Admin Image') {
          when { expression { return env.ADMIN_IMAGE != null } }
          steps {
            script {
              catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {
                sh """
                  echo "Scanning ${env.ADMIN_IMAGE} with Trivy..."
                  mkdir -p ${TRIVY_CACHE_DIR}
                  
                  # Vérifier que l'image existe
                  docker images ${env.ADMIN_IMAGE}
                  
                  docker run --rm \
                    -v /var/run/docker.sock:/var/run/docker.sock \
                    -v ${TRIVY_CACHE_DIR}:/root/.cache/ \
                    -v ${WORKSPACE}:/repo \
                    aquasec/trivy:latest image \
                      --severity HIGH,CRITICAL \
                      --format sarif \
                      --output /repo/trivy-admin.sarif \
                      --no-progress \
                      ${env.ADMIN_IMAGE}
                  
                  echo "Trivy admin scan completed"
                """
              }
              archiveArtifacts artifacts: 'trivy-admin.sarif', allowEmptyArchive: true
            }
          }
        }
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'apps/backend/**/build/**,apps/web/.next/**', allowEmptyArchive: true
      junit allowEmptyResults: true, testResults: '**/test-results-*.xml'
    }
    success {
      slackSend channel: '#jenkins', message: "Pipeline succeeded! Commit: ${env.GIT_COMMIT?.take(7)}"
    }
    failure {
      slackSend channel: '#jenkins', message: "Pipeline failed! Commit: ${env.GIT_COMMIT?.take(7)}"
    }
  }
}