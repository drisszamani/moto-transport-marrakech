# docker/jenkins/Dockerfile
FROM jenkins/jenkins:lts-jdk21

USER root

# outils de base + git + lsb-release pour nodesource
RUN for i in $(seq 1 5); do apt-get update && break || sleep 1; done \
  && apt-get install -y \
  ca-certificates curl gnupg lsb-release \
  git sudo python3 python3-pip \
  && rm -rf /var/lib/apt/lists/*

# Docker CLI & compose plugin (installe le client docker)
RUN curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg \
 && echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/debian $(lsb_release -cs) stable" \
    > /etc/apt/sources.list.d/docker.list \
 && apt-get update \
 && apt-get install -y docker-ce-cli docker-compose-plugin

RUN curl -fsSL -o /usr/local/bin/sonar-scanner-cli.zip https://binaries.sonarsource.com/Distribution/sonar-scanner-cli/sonar-scanner-cli-5.0.1.3006-linux.zip \
 && unzip /usr/local/bin/sonar-scanner-cli.zip -d /opt \
 && ln -s /opt/sonar-scanner-*/bin/sonar-scanner /usr/local/bin/sonar-scanner \
 && rm /usr/local/bin/sonar-scanner-cli.zip

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