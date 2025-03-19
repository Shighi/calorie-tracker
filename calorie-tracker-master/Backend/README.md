# Calorie Tracker Backend

## Project Overview
A comprehensive backend application for tracking nutritional intake, managing meals, and providing nutritional insights.

## Features
- User Authentication
- Meal Logging
- Nutritional Reporting
- Food Database Management
- Locale-based Food Filtering

## Tech Stack
- Node.js
- Express.js
- PostgreSQL
- Sequelize ORM
- JWT Authentication
- Redis Caching

## Prerequisites
- Node.js (v16+)
- PostgreSQL
- Redis

## Installation

### 1. Clone the Repository
```bash
git clone https://github.com/yourusername/calorie-tracker-backend.git
cd calorie-tracker-backend
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Setup Environment
1. Copy `.env.example` to `.env`
2. Update database and API credentials

### 4. Database Setup
```bash
npm run db:migrate
npm run db:seed
```

### 5. Start the Server
```bash
# Development
npm run dev

# Production
npm start
```

## API Documentation
- Swagger UI: `/api-docs`
- Postman Collection: `docs/calorie-tracker-api.postman_collection.json`

## Testing
```bash
npm test
npm run test:coverage
```

## Deployment
- Compatible with Docker
- Supports Heroku, AWS, DigitalOcean

## Contributing
1. Fork the repository
2. Create your feature branch
3. Commit changes
4. Push to the branch
5. Create a Pull Request

## License
MIT License
```

## Contact
- Your Name
- Email: your.email@example.com
- Project Link: https://github.com/yourusername/calorie-tracker-backend
```

## Acknowledgements
- Express.js
- Sequelize
- PostgreSQL
- JWT
- Redis