# docker/jenkins/Dockerfile
FROM jenkins/jenkins:lts-jdk17

USER root

# outils de base + git + lsb-release pour nodesource
RUN apt-get update && apt-get install -y \
  ca-certificates curl gnupg2 lsb-release apt-transport-https \
  git sudo python3 python3-pip gpg \
  && rm -rf /var/lib/apt/lists/*

# Docker CLI & compose plugin (installe le client docker)
RUN curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg \
 && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" \
    > /etc/apt/sources.list.d/docker.list \
 && apt-get update \
 && apt-get install -y docker-ce-cli docker-compose-plugin

# Node 20 (pour pnpm / builds)
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - \
 && apt-get install -y nodejs

# Corepack + pnpm
RUN corepack enable \
 && corepack prepare pnpm@10.17.0 --activate

# add jenkins user to docker group (si possible)
RUN groupadd -f docker || true \
 && usermod -aG docker jenkins || true

USER jenkins
