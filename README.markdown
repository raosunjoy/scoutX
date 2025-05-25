# ScoutX

ScoutX is a platform for sports academies to tokenize talent cohorts, enabling fans to trade tokens and engage with cohort data. This repository contains the backend (NestJS) and frontend (React Native) code for the ScoutX application.

## Directory Structure

- `backend/`: NestJS backend with API endpoints for authentication, cohort data, portfolio, and more.
- `frontend/`: React Native frontend with fan UI features like cohort data display, trade initiation, portfolio tracking, and trade history charts.

## Prerequisites

- Node.js (v18.x or later)
- MongoDB
- Redis
- Docker (for MongoDB and Redis)

## Setup Instructions

### Backend

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set environment variables in a `.env` file:
   ```
   MONGO_URI=mongodb://localhost:27017/scoutx
   REDIS_URL=redis://localhost:6379
   JWT_SECRET=your_jwt_secret
   ```
4. Start MongoDB and Redis using Docker:
   ```bash
   docker-compose up
   ```
5. Start the backend:
   ```bash
   npm run start:dev
   ```
6. Setup admin user:
   ```bash
   npm run setup-admin
   ```
7. Fetch real data and train models:
   ```bash
   npm run fetch-real-data
   npm run train-models
   ```

### Frontend

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the React Native app:
   ```bash
   npm run start
   ```
4. Run on an emulator:
   ```bash
   npm run android
   # or
   npm run ios
   ```

## Features

- **Admin Authentication**: Secure login with MongoDB and JWT.
- **Fan UI**:
  - Display cohort data (stats, highlights, Success Scores).
  - Real-time price updates via WebSocket.
  - Trade initiation with Web3Auth wallet integration.
  - Portfolio tracking to view token holdings.
  - Historical trade charts with time range filters.
- **Multi-Sport Support**: Cricket, football, and basketball stats (e.g., batting average, passing accuracy, shooting accuracy).
- **AI Predictions**: TensorFlow models for Success Scores, trained with real Wyscout/Catapult data.

## Contributing

Feel free to open issues or submit pull requests to improve ScoutX!

## License

MIT License
© 2025 ScoutX Team