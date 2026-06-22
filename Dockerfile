FROM node:18-alpine

# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
COPY package*.json ./

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
