FROM node:18-alpine

WORKDIR /app

# Copy package configurations and install production dependencies
COPY package*.json ./
RUN npm install --production

# Copy remaining source code
COPY . .

# Expose server port
EXPOSE 5001

# Start the application
CMD ["npm", "start"]
