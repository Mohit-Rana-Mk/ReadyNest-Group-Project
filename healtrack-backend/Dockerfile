FROM node:18-slim

WORKDIR /app

# Install native build tools for any packages that need them
RUN apt-get update && apt-get install -y --no-install-recommends python3 make g++ && rm -rf /var/lib/apt/lists/*

# Copy package configurations and install production dependencies
COPY package*.json ./
RUN npm ci --omit=dev

# Copy remaining source code
COPY . .

# Expose server port
EXPOSE 5001

# Start the application
CMD ["npm", "start"]
