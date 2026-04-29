# Stage 1: Build the frontend
FROM node:18-alpine AS build
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# Stage 2: Install production dependencies (including native modules)
FROM node:18-alpine AS deps
RUN apk add --no-cache python3 make g++
WORKDIR /app
COPY package*.json ./
RUN npm ci --omit=dev

# Stage 3: Final runtime image
FROM node:18-alpine AS run
WORKDIR /app
ENV NODE_ENV=production

RUN apk add --no-cache libc6-compat

# Copy production dependencies
COPY --from=deps /app/node_modules ./node_modules
# Copy built backend
COPY --from=build /app/server.js ./server.js
# Copy built frontend assets
COPY --from=build /app/dist ./dist
# Copy public folder if it exists (for static assets not handled by vite)
COPY --from=build /app/public ./public

# Cloud Run injects PORT, so we don't hardcode it.
# We also use npm start for production.
CMD ["npm", "start"]
