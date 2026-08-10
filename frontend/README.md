# Real-Time Chat Application
-A real-time chat application built using React, Node.js, Express, Socket.io, and MongoDB.
The application allows multiple users to join the chat using a username, send messages, receive messages instantly without refreshing the page, and view previous chat history after refreshing the application.

## Core Features

- Real-time messaging using Socket.io
- Send and receive messages instantly
- Chat history stored in MongoDB
- Previous messages available after page refresh
- Message timestamps
- Username-based dummy login
- User logout
- Online connection status
- Responsive chat interface
- REST APIs for sending and fetching messages
- Error handling for API and Socket.io operations

## Bonus Features Implemented

- Username-based login
- MongoDB message storage
- Online connection status
- Responsive UI

## Technologies Used

## Frontend
- React
- Vite
- JavaScript
- CSS
- Socket.io Client

## Backend
- Node.js
- Express.js
- Socket.io
- Mongoose

## Database
- MongoDB Atlas

## How to run Project
- Follow the steps below to run the Real-Time Chat Application locally.
1. Clone the Repository
 - git clone YOUR_GITHUB_REPOSITORY_URL
 - cd Chat-App

2. Run the Backend
 - cd backend
 - npm install
 - Create .env file inside the backend folder:
   [  PORT=5000
      MONGODB_URI=your_mongodb_connection_string  
   ]
 - Start the Backend server 
   npm run dev

3. Run the Frontend
 - cd frontend
 - npm install
 - npm run dev 


- Make sure the following are installed on your system:
1. Node.js
2. npm
3. MongoDB Atlas account
4. Git

- You can verify Node.js and npm using:
1. node -v
2. npm -v

## Testing 
1. Open 2 tabs 
2. Enter different Name
3. Send Meassage and Check 