# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
# Install build dependencies for native bindings
RUN apk add --no-cache python3 make g++ linux-headers
COPY package*.json ./
RUN npm install
COPY . .
# Debug step: Print the contents of mint.service.ts
RUN cat src/mint/mint.service.ts
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY package*.json ./
RUN apk add --no-cache python3 make g++ linux-headers
RUN npm install --production
EXPOSE 3000
RUN addgroup -S scoutxgroup && adduser -S scoutxuser -G scoutxgroup
USER scoutxuser
CMD ["npm", "run", "start:prod"]