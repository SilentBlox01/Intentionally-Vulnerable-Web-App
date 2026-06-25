FROM node:18-slim

# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

# Install build dependencies for native modules (better-sqlite3)
RUN apt-get update && apt-get install -y python3 make g++ && rm -rf /var/lib/apt/lists/*

# Install dependencies
RUN npm install

# Bundle app source
COPY . .

# Initialize config files from examples
RUN cp .env.example .env && cp config.js.example config.js

# Expose port 3000
EXPOSE 3000

# Start the application
CMD [ "npm", "start" ]
