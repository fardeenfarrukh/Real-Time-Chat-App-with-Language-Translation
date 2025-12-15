# Real-Time Chat App with Language Translation

## Overview
This project is a real-time chat platform that supports instant messaging with automatic language translation. Messages are translated into each user’s preferred language using the Microsoft Translator API. The app supports both guest sessions and registered users, with persistent chat rooms for registered users and ephemeral sessions for guests.

The system includes:
- Frontend (chat-app): React + Vite, Firebase Auth and Firestore, Microsoft Translator integration.
- Backend (chat-server): Node.js + Express + WebSocket server for real-time messaging and presence.

## Features
- Guest and registered user chat
- Real-time messaging with WebSockets
- Automatic translation of messages (English, French, and more)
- User profiles with avatar, display name, and preferred language
- Persistent chat rooms for registered users
- Ephemeral guest sessions (messages deleted at session end)
- Typing indicators and presence tracking
- Admin dashboard for user management, logs, and language configuration
- Responsive UI for desktop and mobile

## Project structure
```
Project 2/
├── chat-app/                          # Frontend (React + Vite)
│   ├── node_modules/
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── styles/
│   │   └── utils/
│   ├── .env                           # API keys (Translator + Firebase)
│   ├── index.html
│   ├── package.json
│   ├── package-lock.json
│   ├── README.md
│   └── vite.config.js
│
├── chat-server/                       # Backend (Node.js + WebSocket)
│   ├── node_modules/
│   ├── server.js
│   ├── package.json
│   └── package-lock.json
```
## Dependencies

### chat-server
- express ^5.1.0
- ws ^8.18.3
- cors ^2.8.5

### chat-app
- react
- react-dom
- firebase
- vite

## Prerequisites
- Node.js (>= 18)
- npm or yarn
- Firebase project (for Auth and Firestore)
- Microsoft Translator resource (Azure Cognitive Services)

## Environment variables
Create a `.env` file inside `chat-app/` with the following:
```
# Microsoft Translator
VITE_MS_TRANSLATOR_KEY=your-translator-key
VITE_MS_TRANSLATOR_REGION=your-region
VITE_MS_TRANSLATOR_ENDPOINT=https://api.cognitive.microsofttranslator.com/
```
```
# Firebase
VITE_FIREBASE_API_KEY=your-firebase-api-key
VITE_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
VITE_FIREBASE_APP_ID=your-app-id
```
## Installation and running locally

### 1. Clone the repository
git clone <your-repo-url>
cd Project-2

### 2. Install dependencies
For the server:
cd chat-server
npm install

For the client:
cd ../chat-app
npm install

### 3. Run the server
cd chat-server
node server.js
Server runs at http://localhost:3001.

### 4. Run the client
cd ../chat-app
npm run dev
Client runs at http://localhost:5173 (default Vite port).

## Deployment

### Frontend (Firebase Hosting)
cd chat-app
npm run build
firebase deploy

### Backend (Node hosting)
Deploy `chat-server` to a Node hosting service such as Render, Railway, Heroku, or Glitch.

## Deliverables
- Source code repository with README and setup guide
- Final paper (2–4 pages) covering design, implementation, testing, and future work
- Video presentation (5–10 minutes) demonstrating features and architecture

## Evaluation criteria
- Feature completeness
- Performance (low latency, concurrent sessions)
- Code quality and documentation
- User experience and responsive design
- Deliverable quality (paper and video) Video: (https://youtu.be/KthaXlWoBlY)
