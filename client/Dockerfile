FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files first for better caching
COPY package.json package-lock.json* ./

# Install dependencies
RUN npm install

# Copy all remaining files
COPY . .

# Build the application
RUN npm run build

# Install a simple static file server
RUN npm install -g serve

# Expose port
EXPOSE 3000

# Serve the app (using 0.0.0.0 to bind to all network interfaces)
CMD ["serve", "-s", "dist", "-l", "3000", "-n"]