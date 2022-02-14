# Shopping List
Backend for Shopping List application

Requirements: SQL Server for the backend database.

Database Setup:

1. Create a database named Shopping List in SQL Server.
1. Run each of the SQL files in dbschema to create the necessary database tables.
1. Create a user account and grant them access to this DB.

Docker Installation:

1. Build the backend image: `docker build docker/ -t shoppinglistbackend:latest`
1. Edit `shoppinglistbackend-compose.yml`
   - Replace NETWORKNAME with your own Docker network name
   - Replace YOUR_AUTH_KEY with a secure password. You will need to enter this in the front end app
   - Replace the DB related environment variables with your own DB settings. The backend must be a SQL Server database.
1. Build the backend container `docker-compose -f shoppinglistbackend-compose.yml up -d`

Non-Docker Installation:

1. Set the following environment variables on the Node server to configure the DB connection: ShoppingList_User, ShoppingList_Password, ShoppingList_Host and ShoppingList_DB
1. Set the environment variable AUTH_KEY to a password of your choice. You will need to enter this in the front end app
1. Run `node shoppinglistbackend.js`
