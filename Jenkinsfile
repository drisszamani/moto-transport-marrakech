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

    stage ('Gitleaks Scan') {
        steps {
          touch gitleaks-report.json
            // Scanner tout le repo à la recherche de secrets avec l'image Docker Gitleaks
            sh '''
                docker run --rm -v $PWD:/repo zricethezav/gitleaks:latest detect --source=/repo --no-git --report-path=gitleaks-report.json || true
            '''
            // Optionnellement, archiver le rapport
            archiveArtifacts artifacts: 'gitleaks-report.json', allowEmptyArchive: true
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