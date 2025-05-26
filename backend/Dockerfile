# Builder stage
FROM node:18-alpine AS builder
WORKDIR /app
RUN apk add --no-cache python3 make g++ linux-headers
COPY package*.json ./
RUN npm install
COPY . .
# Debug step: Print the contents of mint.service.ts
RUN cat src/mint/mint.service.ts
# Debug step: Print the specific line causing the error
RUN sed -n '65p' src/mint/mint.service.ts
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY package*.json ./
EXPOSE 3000
CMD ["npm", "run", "start:prod"]
