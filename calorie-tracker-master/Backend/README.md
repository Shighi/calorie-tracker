Project Overview
The Calorie Tracker Backend is a comprehensive API for tracking nutritional intake, managing meals, and providing insights based on food consumption. It allows users to log their meals, create templates for easy meal planning, and retrieve food data for accurate nutrition tracking.

Features
User Authentication: Secure user login and registration using JWT tokens.


Meal Logging: Log meals with food details, meal types, and nutritional information.


Meal Template Management: Create, update, and delete meal templates.


Food Database Management: Maintain a database of foods, categories, and locales.


Locale-based Food Filtering: Search and filter foods based on locale and categories.


Nutritional Reporting: Provides detailed nutritional data for each logged meal.


Tech Stack
Node.js: Server-side runtime environment.


Express.js: Web framework for building the API.


PostgreSQL: Relational database for storing food, meal, and user data.


Sequelize ORM: Object-Relational Mapping for interacting with PostgreSQL.


JWT Authentication: Secure API access with JSON Web Tokens.


Redis: Caching layer for faster responses.


Prerequisites
Node.js (v16+)


PostgreSQL: A running instance of PostgreSQL.


Redis: For caching.


Installation
1. Clone the Repository
git clone https://github.com/Shighi/calorie-tracker.git
cd calorie-tracker/calorie-tracker-master/Backend

2. Install Dependencies
npm install

3. Setup Environment
Copy .env.example to .env


Update the environment variables (database credentials, JWT secret, etc.).


4. Database Setup
npm run db:migrate
npm run db:seed

5. Start the Server
# Development Mode
npm run dev

# Production Mode
npm start

API Documentation
Swagger UI: /api-docs


Postman Collection: docs/calorie-tracker-api.postman_collection.json


Endpoints
Meal Template Routes:
GET /api/meals/templates


Retrieve all meal templates (pagination).


POST /api/meals/templates


Create a new meal template.


GET /api/meals/templates/{id}


Retrieve a specific meal template by ID.


PUT /api/meals/templates/{id}


Update an existing meal template.


DELETE /api/meals/templates/{id}


Delete a meal template.


POST /api/meals/fromTemplate/{templateId}


Create a meal from a template.


Meal Routes:
GET /api/meals


Retrieve meals for the authenticated user (pagination, filters).


POST /api/meals


Create a new meal.


GET /api/meals/{id}


Retrieve a specific meal by ID.


PUT /api/meals/{id}


Update an existing meal.


DELETE /api/meals/{id}


Delete a meal.


DELETE /api/meals/{mealId}/foods/{foodId}


Remove a specific food from a meal.


Food Routes:
GET /api/foods/search


Search for foods with filters like query and locale.


GET /api/foods/categories


Get all food categories.


GET /api/foods/category/{category}


Get foods by category.


GET /api/foods/locale/{localeId}


Get foods based on locale.


GET /api/foods


Get all foods (optional filtering).


GET /api/foods/{id}


Retrieve food details by ID.


POST /api/foods


Create a new food (admin only).


PUT /api/foods/{id}


Update food (admin only).


DELETE /api/foods/{id}


Delete food (admin only).



Deployment
This project is compatible with Docker and can be deployed on cloud services such as:
Heroku


AWS


DigitalOcean


Contributing
Fork the repository.


Create a new feature branch (git checkout -b feature-branch).


Make changes and commit them (git commit -am 'Add new feature').


Push to the branch (git push origin feature-branch).


Create a pull request.


Related Projects
Calorie Tracker Frontend: The frontend application for interacting with this backend API.
License
This project is licensed under the MIT License 

Contact
Author: Daisy Mwambi


Email: daisyshighi@gmail.com


LinkedIn: https://www.linkedin.com/in/daisy-mwambi-684021203/


Project Link: https://github.com/Shighi/calorie-tracker/tree/master/calorie-tracker-master/Backend


Acknowledgements
Express.js: Web framework for building the API.


Sequelize ORM: For interacting with PostgreSQL.


PostgreSQL: Relational database for storing data.


JWT: For secure user authentication.


Redis: For caching and improving response times.




