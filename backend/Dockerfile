# Builder stage
FROM node:20-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++ linux-headers
COPY package*.json ./
RUN npm install && npm rebuild
COPY . .
RUN npm run build
# Copy the idl directory to dist/mint/idl/
RUN mkdir -p dist/mint/idl && cp src/mint/idl/mock-program.json dist/mint/idl/

# Production stage
FROM node:20-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 3000
CMD ["npm", "run", "start:prod"]

