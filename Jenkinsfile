pipeline {
  agent {
    label "jenkins-nodejs"
  }
  environment {
    ORG = 'unalterable'
    APP_NAME = 'diamond-environment-controller'
    CHARTMUSEUM_CREDS = credentials('jenkins-x-chartmuseum')
    DOCKER_REGISTRY_ORG = 'yoshi-248909'
  }
  stages {
    stage('Build Prep') {
      steps {
        container('nodejs') {
          withCredentials( [file(credentialsId: 'GCP_SA', variable: 'GCP_SA')]) {
            sh script: "cat ${env.GCP_SA} > /home/jenkins/gcloud.json && gcloud auth activate-service-account --key-file=/home/jenkins/gcloud.json", label: 'Google Cloud Credentials'
          }
        }
      }
    }
    stage('CI Build and push snapshot') {
      when {
        branch 'PR-*'
      }
      environment {
        PREVIEW_VERSION = "0.0.0-SNAPSHOT-$BRANCH_NAME-$BUILD_NUMBER"
        PREVIEW_NAMESPACE = "$APP_NAME-$BRANCH_NAME".toLowerCase()
        HELM_RELEASE = "$PREVIEW_NAMESPACE".toLowerCase()
      }
      steps {
        container('nodejs') {
          sh "jx step credential -s npm-token -k file -f /builder/home/.npmrc --optional=true"
          sh "npm install"
          sh "CI=true DISPLAY=:99 npm test"
          sh script: "gcloud builds submit --substitutions=_APP_NAME='$APP_NAME',TAG_NAME='$PREVIEW_VERSION' .", label: 'Google Cloud Build'
          // dir('./charts/preview') {
          //   sh "make preview"
          //   sh "jx preview --app $APP_NAME --dir ../.."
          // }
        }
      }
    }
    stage('Build Release') {
      when {
        branch 'master'
      }
      steps {
        container('nodejs') {
          // ensure we're not on a detached head
          sh "git checkout master"
          sh "git config --global credential.helper store"
          sh "jx step git credentials"

          // so we can retrieve the version in later steps
          sh "echo \$(jx-release-version) > VERSION"
          sh "jx step tag --version \$(cat VERSION)"
          sh "jx step credential -s npm-token -k file -f /builder/home/.npmrc --optional=true"
          sh "npm install"
          sh "CI=true DISPLAY=:99 npm test"

          sh script: "gcloud builds submit --substitutions=_APP_NAME='$APP_NAME',TAG_NAME=\$(cat VERSION) .", label: 'Google Cloud Build'
          sh "jx step post build --image $DOCKER_REGISTRY/$ORG/$APP_NAME:\$(cat VERSION)"
        }
      }
    }
    stage('Promote to Environments') {
      when {
        branch 'master'
      }
      steps {
        container('nodejs') {
          dir('./charts/diamond-environment-controller') {
            sh "jx step changelog --batch-mode --version v\$(cat ../../VERSION)"

            // release the helm chart
            sh "jx step helm release"

            // promote through all 'Auto' promotion Environments
            sh "jx promote -b --timeout 1h --version \$(cat ../../VERSION) --env production"
          }
        }
      }
    }
  }
  post {
        always {
          cleanWs()
        }
  }
}
