pipeline {
  agent any
  parameters {
    booleanParam(name: 'RUN_TESTS', defaultValue: false, description: 'Exécuter les tests backend ?')
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
      steps {
        sh '''
          corepack enable && corepack prepare pnpm@10.17.0 --activate &&
          pnpm lint
        '''
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

    stage('Backend: tests (optionnel)') {
      when { expression { return params.RUN_TESTS } }
      steps {
        sh '''
          corepack enable && corepack prepare pnpm@10.17.0 --activate &&
          pnpm --filter backend test
        '''
      }
    }

    stage('Web: build') {
      steps {
        sh '''
          corepack enable && corepack prepare pnpm@10.17.0 --activate &&
          pnpm --filter web build
        '''
      }
    }

    stage('Admin: build') {
      steps {
        sh '''
          corepack enable && corepack prepare pnpm@10.17.0 --activate &&
          pnpm --filter admin build
        '''
      }
    }

    stage('Docs: build') {
      steps {
        sh '''
          corepack enable && corepack prepare pnpm@10.17.0 --activate &&
          pnpm --filter docs build
        '''
      }
    }

    stage('Backend: build') {
      steps {
        sh '''
          corepack enable && corepack prepare pnpm@10.17.0 --activate &&
          pnpm --filter backend build
        '''
      }
    }

    stage('Optional: Build backend Docker image') {
      when { expression { fileExists('apps/backend/Dockerfile') } }
      steps {
        script {
          commitShort = sh(script: "git rev-parse --short=7 HEAD", returnStdout: true).trim()
          sh "docker build -t moto-backend:${commitShort} -f apps/backend/Dockerfile ."
          // docker push ... (optionnel) -> nécessite cred
        }
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'apps/backend/**/build/**,apps/web/.next/**', allowEmptyArchive: true
      junit allowEmptyResults: true, testResults: '**/test-results-*.xml'
    }
  }
}
