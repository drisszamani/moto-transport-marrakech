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
        archiveArtifacts artifacts: 'trivy-fs-report.sarif', allowEmptyArchive: true
    }
}
    stage('Install deps') {
      steps {
        // installe deps à la racine en utilisant pnpm (Corepack dans l'image Jenkins)
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
          echo "🔍 Lancement de l'analyse Trivy FS sur le workspace..."
          mkdir -p \$(pwd)/.trivy-cache

          docker run --rm \
            -v \$(pwd):/repo \
            -v \$(pwd)/.trivy-cache:/root/.cache/ \
            aquasec/trivy:latest fs \
              --scanners vuln,config \
              --severity HIGH,CRITICAL \
              --format sarif \
              --output /repo/trivy-fs-report.sarif \
              --no-progress \
              /repo

          echo "Analyse Trivy FS terminée avec succès"
        """
      }
      sh 'ls -l /repo || true'
      sh 'ls -l . || true' 
      archiveArtifacts artifacts: '**/trivy-fs-report.sarif', allowEmptyArchive: true
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

    // stage('Wait for SonarQube Quality Gate') {
    //     steps {
    //         waitForQualityGate abortPipeline: false
    //     }
    // }

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
            }
          }
        }
        stage('Build Web Docker') {
          when { expression { return fileExists('apps/web/Dockerfile') } }
          steps {
            script {
              def commitShort = sh(script: "git rev-parse --short=7 HEAD", returnStdout: true).trim()
              sh "docker build -t moto-web:${commitShort} -f apps/web/Dockerfile ."
            }
          }
        }
        stage('Build Admin Docker') {
          when { expression { return fileExists('apps/admin/Dockerfile') } }
          steps {
            script {
              def commitShort = sh(script: "git rev-parse --short=7 HEAD", returnStdout: true).trim()
              sh "docker build -t moto-admin:${commitShort} -f apps/admin/Dockerfile ."
            }
          }
        }
      }
    }

    stage('Trivy Image Scan') {
  parallel {

    stage('Scan Backend Image') {
      steps {
        script {
          def commitShort = sh(script: "git rev-parse --short=7 HEAD", returnStdout: true).trim()
          catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {
            sh """
              echo "🔍 Scanning moto-backend:${commitShort} with Trivy..."
              mkdir -p \$(pwd)/.trivy-cache
              docker run --rm \
              -v \$(pwd)/.trivy-cache:/root/.cache/ \
              -v \$(pwd):/repo \
              -v /var/run/docker.sock:/var/run/docker.sock \
                aquasec/trivy:latest image \
              --severity HIGH,CRITICAL \
              --format sarif \
              --output /repo/trivy-backend.sarif \
              --no-progress \
              moto-backend:${commitShort}
              echo "Trivy backend scan completed"
            """
          }
            sh 'ls -l /repo || true'
            sh 'ls -l . || true' 
          archiveArtifacts artifacts: 'trivy-fs-backend.sarif', allowEmptyArchive: true
        }
      }
    }

    stage('Scan Web Image') {
      steps {
        script {
          def commitShort = sh(script: "git rev-parse --short=7 HEAD", returnStdout: true).trim()
          catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {
            sh """
              echo "Scanning moto-web:${commitShort} with Trivy..."
              mkdir -p \$(pwd)/.trivy-cache
              docker run --rm \
              -v \$(pwd)/.trivy-cache:/root/.cache/ \
              -v \$(pwd):/repo \
              -v /var/run/docker.sock:/var/run/docker.sock \
                aquasec/trivy:latest image \
              --severity HIGH,CRITICAL \
              --format sarif \
              --output /repo/trivy-web.sarif \
              --no-progress \
              moto-web:${commitShort}
              echo "Trivy web scan completed"
            """
          }
          sh 'ls -l /repo || true'
          sh 'ls -l . || true' 
          archiveArtifacts artifacts: '**/trivy-web.sarif', allowEmptyArchive: true
        }
      }
    }

    stage('Scan Admin Image') {
      steps {
        script {
          def commitShort = sh(script: "git rev-parse --short=7 HEAD", returnStdout: true).trim()
          catchError(buildResult: 'UNSTABLE', stageResult: 'UNSTABLE') {
            sh """
              echo "Scanning moto-admin:${commitShort} with Trivy..."
              mkdir -p \$(pwd)/.trivy-cache
              docker run --rm \
                -v \$(pwd)/.trivy-cache:/root/.cache/ \
                -v \$(pwd):/repo \
                -v /var/run/docker.sock:/var/run/docker.sock \
                  aquasec/trivy:latest image \
              --severity HIGH,CRITICAL \
              --format sarif \
              --output /repo/trivy-admin.sarif \
              --no-progress \
              moto-admin:${commitShort}
              echo "Trivy admin scan completed"
            """
          }
          sh 'ls -l /repo || true'
          sh 'ls -l . || true' 
          archiveArtifacts artifacts: '**/trivy-admin.sarif', allowEmptyArchive: true
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
      slackSend channel: '#jenkins', message: 'Pipeline succeeded!'
    }
    failure {
      slackSend channel: '#jenkins', message: 'Pipeline failed!'
    }
}
}