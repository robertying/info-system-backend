pipeline {
  agent {
    docker {
      image 'node:10-alpine'
      args '-p 4001:4001'
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
        sh '''tar -xvzf build.tar.gz
rm build.tar.gz'''
      }
    }
    stage('Archive') {
      steps {
        sh 'tar czf build.tar.gz .'
        archiveArtifacts(artifacts: 'build.tar.gz', fingerprint: true, onlyIfSuccessful: true)
      }
    }
    stage('Deploy') {
      steps {
        sh '''rm build.tar.gz
rm -rf /home/express/info-system
mkdir /home/express/info-system
cp -r * /home/express/info-system/
'''
      }
    }
  }
}