FROM node:20-slim

WORKDIR /app

# Install build dependencies for native modules
RUN apt-get update && apt-get install -y --no-install-recommends \
	build-essential \
	python3 \
	pkg-config \
	ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package*.json ./
# Install node dependencies
RUN npm install --unsafe-perm --loglevel=warn

COPY . .

# Normaliza line endings (CRLF → LF) caso o arquivo tenha sido criado no Windows
RUN sed -i 's/\r$//' entrypoint.sh

EXPOSE 3001
CMD ["sh", "entrypoint.sh"]