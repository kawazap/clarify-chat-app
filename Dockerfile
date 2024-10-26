FROM node:20-slim

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package.json first (pnpm-lock.yaml is optional)
COPY package.json ./

# Install dependencies
RUN pnpm install

# Copy the rest of the application
COPY . .

# Expose port 3000
EXPOSE 3000

# Start the development server with host option
CMD ["sh", "-c", "pnpm install && pnpm dev"]