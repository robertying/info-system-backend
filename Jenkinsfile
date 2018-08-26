pipeline {
  agent {
    docker {
      image 'node:10-alpine'
      args '-p 3001:3001'
    }

  }
  stages {
    stage('Install') {
      steps {
        sh '''npm install
npm install -g forever'''
      }
    }
    stage('Build') {
      steps {
        copyArtifacts(projectName: 'info-system-web', excludes: 'pipeline.log', target: '.')
      }
    }
    stage('Deploy') {
      steps {
        sh 'NODE_ENV=production forever start bin/www'
      }
    }
  }
}