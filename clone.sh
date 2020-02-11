ENV_REPO=$(kubectl get env this -o jsonpath='{.spec.source.url}')
echo ENV_REPO: $ENV_REPO

GIT_URL=$(echo $ENV_REPO | sed -e "s/^https:\/\//https:\/\/$GITHUB_ACCESS_TOKEN@/")
echo GIT_URL: $GIT_URL

git clone $GIT_URL deployment

cd deployment/env

jx step helm apply

cd ../../

rm -rf deployment
