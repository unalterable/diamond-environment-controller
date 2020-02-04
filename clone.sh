GIT_URL=$(echo $ENV_REPO | sed -e "s/^https:\/\//https:\/\/$GITHUB_ACCESS_TOKEN@/")

git clone $GIT_URL deployment

cd deployment/env

jx step helm apply

cd ../../

rm -rf deployment
