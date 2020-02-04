FROM node:10

WORKDIR /usr/local/bin/

RUN curl -LO https://storage.googleapis.com/kubernetes-release/release/`curl -s https://storage.googleapis.com/kubernetes-release/release/stable.txt`/bin/linux/amd64/kubectl

RUN chmod +x kubectl

RUN curl -L "https://get.helm.sh/helm-v2.14.3-linux-amd64.tar.gz" | tar xzv --strip-components=1 "linux-amd64/helm"

RUN curl -L "https://github.com/jenkins-x/jx/releases/download/$(curl --silent "https://github.com/jenkins-x/jx/releases/latest" | sed 's#.*tag/\(.*\)\".*#\1#')/jx-linux-amd64.tar.gz" | tar xzv "jx"

RUN mkdir /app

WORKDIR /app

COPY ./clone.sh .

CMD ["bash", "./clone.sh"]
