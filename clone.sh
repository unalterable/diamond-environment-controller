set -x
# ENV_REPO=$(kubectl get env this -o jsonpath='{.spec.source.url}')
# echo ENV_REPO: $ENV_REPO

GIT_URL=$(echo $ENV_REPO | sed -e "s/^https:\/\//https:\/\/$GITHUB_ACCESS_TOKEN@/")
echo GIT_URL: $GIT_URL

git clone $GIT_URL deployment
ls -latr

cd deployment/env
ls -latr

JX_LOG_LEVEL=debug jx step helm apply

cd ../../
ls -latr

rm -rf deployment
ls -latr
