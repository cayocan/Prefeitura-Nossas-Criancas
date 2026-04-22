FROM node:20-slim

WORKDIR /app

# Install global dependencies if necessary
RUN apt-get update && apt-get install -y python3 make g++

COPY package*.json ./
RUN npm install

COPY . .

EXPOSE 3001
CMD ["npm", "run", "dev"]