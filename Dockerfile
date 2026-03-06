  # Stage 1: Build Stage
FROM node:20-alpine AS build

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install all dependencies (including dev)
RUN npm ci

# Copy source code
COPY . .

# Lint and build TypeScript using npx
RUN npm run lint && npx tsc

# Stage 2: Production Stage
FROM node:20-alpine AS production

WORKDIR /app

# Set NODE_ENV
ENV NODE_ENV=production

# Copy production-ready files from build stage
COPY --from=build /app/dist ./dist
COPY --from=build /app/package*.json ./

COPY --from=build /app/views ./views


# Install only production dependencies
RUN npm ci --omit=dev

# Expose application port
EXPOSE 3000

# Run the server
CMD ["node", "./dist/server.js"]
