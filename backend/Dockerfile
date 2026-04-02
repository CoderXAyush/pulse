# Use an official lightweight Node.js runtime image.
FROM node:20-alpine

# Set working directory inside container.
WORKDIR /app

# Copy package files first for better layer caching.
COPY package*.json ./

# Install only production dependencies.
RUN npm ci --omit=dev

# Copy source code.
COPY . .

# App listens on this port by default.
EXPOSE 5000

# Start the server.
CMD ["npm", "start"]
