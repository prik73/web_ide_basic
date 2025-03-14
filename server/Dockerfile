FROM ubuntu:22.04


RUN apt-get update && apt-get install -y \
    curl \
    gnupg \
    bash \
    build-essential \
    gcc \
    g++ \
    make \
    python3 \
    vim \
    git \
    libutempter0 \  
    && curl -fsSL https://deb.nodesource.com/setup_18.x | bash - \
    && apt-get install -y nodejs \
    && apt-get clean \
    
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app/

COPY package*.json ./
RUN npm install 

COPY . ./

RUN npm rebuild node-pty

RUN useradd -m appuser
USER appuser

EXPOSE 9000



CMD ["node", "index.js"]