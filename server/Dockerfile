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

EXPOSE 3001
# Strip BOM and CRLF at runtime (after bind-mount overwrites build-time fixes on Windows hosts)
CMD ["sh", "-c", "sed -i '1s/^\\xEF\\xBB\\xBF//' entrypoint.sh && sed -i 's/\\r//' entrypoint.sh && exec sh entrypoint.sh"]