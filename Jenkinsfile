// CI frontend SamaFile : oxlint, npm audit, build Vite, image Docker, Trivy, Docker Hub.
// Job Jenkins : Pipeline script from SCM, script path Jenkinsfile.
// Credential : dockerhub-credentials (utilisateur + jeton Docker Hub).

pipeline {
    agent any

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    parameters {
        booleanParam(name: 'PUBLISH', defaultValue: false, description: 'Publier l image sur Docker Hub après les scans')
    }

    environment {
        LOCAL_IMAGE = 'samafile-frontend:ci'
        TRIVY_IMAGE = 'aquasec/trivy:0.58.1'
        NODE_IMAGE = 'node:22-alpine'
    }

    stages {
        stage('Dépendances npm') {
            steps {
                sh '''
                    set -eu
                    mkdir -p reports
                    docker run --rm -v "$PWD":/app -w /app "$NODE_IMAGE" npm ci
                '''
            }
        }

        stage('Lint oxlint') {
            steps {
                sh 'docker run --rm -v "$PWD":/app -w /app "$NODE_IMAGE" npm run lint'
            }
        }

        stage('Audit npm') {
            steps {
                sh '''
                    set -eu
                    docker run --rm -v "$PWD":/app -w /app "$NODE_IMAGE" sh -c '
                        set +e
                        npm audit --audit-level=high --json > reports/npm-audit.json
                        code=$?
                        npm audit --audit-level=high || true
                        exit "$code"
                    '
                '''
            }
        }

        stage('Build Vite') {
            steps {
                sh 'docker run --rm -v "$PWD":/app -w /app -e VITE_API_URL= "$NODE_IMAGE" npm run build'
            }
        }

        stage('Hadolint') {
            steps {
                sh '''
                    set -eu
                    docker run --rm -i hadolint/hadolint:v2.12.0-alpine --failure-threshold error - < Dockerfile
                '''
            }
        }

        stage('Image Docker') {
            steps {
                sh 'docker build -t "$LOCAL_IMAGE" .'
            }
        }

        stage('Trivy image et sources') {
            steps {
                sh '''
                    set -eu
                    run_trivy() {
                        set +e
                        docker run --rm "$@"
                        code=$?
                        set -e
                        return "$code"
                    }
                    set +e
                    run_trivy \
                        -v /var/run/docker.sock:/var/run/docker.sock \
                        -v "$PWD:/src" \
                        -v "$PWD/reports:/reports" \
                        "$TRIVY_IMAGE" image \
                        --severity HIGH,CRITICAL --ignore-unfixed --exit-code 1 \
                        --format table --output /reports/trivy-image.txt \
                        "$LOCAL_IMAGE"
                    image_code=$?
                    set -e
                    echo "----- Trivy image -----"
                    cat reports/trivy-image.txt || true
                    set +e
                    run_trivy \
                        -v "$PWD:/src" \
                        -v "$PWD/reports:/reports" \
                        "$TRIVY_IMAGE" fs \
                        --scanners vuln,secret,misconfig \
                        --severity HIGH,CRITICAL --ignore-unfixed --exit-code 1 \
                        --skip-dirs /src/node_modules --skip-dirs /src/dist --skip-dirs /src/.git \
                        --format table --output /reports/trivy-fs.txt \
                        /src
                    fs_code=$?
                    set -e
                    echo "----- Trivy fs -----"
                    cat reports/trivy-fs.txt || true
                    test "$image_code" = 0
                    test "$fs_code" = 0
                '''
            }
        }

        stage('Publication Docker Hub') {
            when {
                expression { return params.PUBLISH }
            }
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'dockerhub-credentials',
                    usernameVariable: 'DOCKERHUB_USER',
                    passwordVariable: 'DOCKERHUB_TOKEN'
                )]) {
                    sh '''
                        set -eu
                        echo "$DOCKERHUB_TOKEN" | docker login -u "$DOCKERHUB_USER" --password-stdin
                        image="${DOCKERHUB_USER}/samafile-frontend"
                        docker tag "$LOCAL_IMAGE" "${image}:${BUILD_NUMBER}"
                        docker push "${image}:${BUILD_NUMBER}"
                        sha="$(git rev-parse --short HEAD 2>/dev/null || true)"
                        if [ -n "$sha" ]; then
                            docker tag "$LOCAL_IMAGE" "${image}:${sha}"
                            docker push "${image}:${sha}"
                        fi
                        branch="${BRANCH_NAME:-${GIT_BRANCH:-}}"
                        if printf '%s' "$branch" | grep -Eq '(^|/)(main|master|develop)$'; then
                            docker tag "$LOCAL_IMAGE" "${image}:latest"
                            docker push "${image}:latest"
                        fi
                        docker logout
                    '''
                }
            }
        }
    }

    post {
        always {
            archiveArtifacts artifacts: 'reports/**', allowEmptyArchive: true
        }
    }
}
