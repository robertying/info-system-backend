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
        sh '''npm config set unsafe-perm true
npm install
npm install -g forever'''
      }
    }
    stage('Build') {
      steps {
        copyArtifacts(projectName: 'info-system-web/master', excludes: 'pipeline.log', fingerprintArtifacts: true)
      }
    }
    stage('Deploy') {
      steps {
        sh '''tar -xvzf build.tar.gz
NODE_ENV=production forever start bin/www'''
      }
    }
  }
}