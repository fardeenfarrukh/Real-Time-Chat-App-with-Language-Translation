# **Final Project Report: Real-Time Chat App with Language Translation**

**Syed Fardeen**  
**McMaster University**

---

## 1. Introduction

### 1.1 Project Overview
In an increasingly connected world, language remains a significant barrier to communication. The **Real-Time Chat App with Language Translation** is a web-based platform designed to break down this barrier. It allows users to engage in instant text communication, where each message is automatically translated into the recipient's preferred language. The system supports both registered users with persistent accounts and guests who can join temporary chat sessions. The core of the application is its ability to provide a seamless, multi-lingual conversation experience in real-time.

### 1.2 Problem Statement
This project was assigned by the university, but its real-world application was immediately apparent. When I first saw the requirements, my mind went straight to the live translation features in modern tech, like what Apple is doing with their AirPods. The idea of building a chat-based version of that was exciting. The challenge wasn't just to build another chat app, but to integrate a complex feature like live translation in a way that felt intuitive and fast. I realized I could have some fun with this and build something genuinely useful for connecting people from different backgrounds. That personal interest made the project far more engaging than a simple academic exercise.

### 1.3 Goals and Objectives
The main goal was to build a full-featured chat platform that met all the specifications in the scope document. The key objectives included:

- A publicly accessible web interface for both guest and registered users.
- Integration of a WebSocket backend for low-latency, real-time messaging.
- Integration of the Microsoft Translator API for automatic language translation.
- User profile management for registered users (username, avatar, language preference).
- Persistent chat history for registered users and ephemeral sessions for guests.
- An admin dashboard for user management and language configuration.

Beyond the requirements, my personal goal was to deepen my skills in building a full-stack application from the ground up, specifically focusing on the complexities of real-time communication which I hadn't tackled before.

---

## 2. Design and Architecture

### 2.1 UI/UX Design
I aimed for a clean, modern, and intuitive interface. I personally prefer dark mode because it provides a more calming ambiance and is easier on the eyes, so I chose that as the default aesthetic. I’ve always believed that every app should have a theme option. I first dabbled with a theme-switcher in Project 1 and really enjoyed implementing it. Although I wanted to include it here, the complexity and sheer number of files in Project 2 meant I had to prioritize the core features.

Instead, I settled on a single dark theme using my favorite color, celeste, which was fun to implement. My passion for theming came back in full force in Projects 3 and 4, where I made sure to integrate a full dark mode feature, making those projects feel more complete in my eyes. If I had more time, I would definitely go back and add that feature to this project.

- **Layout:** The application uses a multi-page layout managed by React Router. The `ChatPage` features a classic chat interface with a user/message list, a main message window, and an input form at the bottom, designed to be instantly familiar to anyone who has used a chat app.
- **Components:** The frontend is built with modular React components. Reusable elements like `LanguageSelector` and `AvatarUploader` are kept separate, making the code clean and maintainable. This component-based structure was crucial for managing the different parts of the UI.
- **Feedback:** To ensure a smooth user experience, the app provides constant feedback. This includes typing indicators ("...is typing"), online presence status, and simple alerts for actions like saving a profile or creating a room.

### 2.2 System Architecture
The application is architected as a client-server model, with a clear separation between the frontend and backend.

- **Frontend:** A Single-Page Application (SPA) built with **React** and **Vite**. This provided a fast and modern development workflow. **React Router** handles all client-side navigation, and the **Firebase SDK** is used to communicate with the authentication and database services.
- **Backend:** A **Node.js** server using **Express** and the **`ws`** library for WebSocket communication. Its primary role is to act as a real-time message broker—it doesn't handle business logic or data persistence. It simply receives messages, presence updates, and typing indicators from one client and broadcasts them to all other connected clients.
- **Database & Services:**
    - **Firebase Firestore:** Acts as the primary database for persisting user profiles, room information (including members), and message history for registered users.
    - **Firebase Authentication:** Manages user sign-up and login, with support for both email/password and Google single sign-on.
    - **Microsoft Translator API:** The client-side application directly calls this API to perform language translation, offloading the work from my backend server.

---

## 3. Implementation

### 3.1 Real-Time Core
The WebSocket server was the heart of the project's real-time functionality. It maintains a map of connected users and broadcasts data packets based on their `type` (`presence`, `typing`, or a chat message). A heartbeat interval is set up to periodically ping clients and terminate any unresponsive connections, ensuring the online user list remains accurate. This was my first time implementing a WebSocket server from scratch, and it was a fantastic learning experience in managing persistent connections.

### 3.2 Technical Challenges and Growth
While this was my second project using React, it was my first time using it with **Vite**, and it was also my first time ever using **Firebase**. I had zero idea how to use Firebase and had to do a lot of research just to figure out the basics.

One of the biggest challenges—and a crucial learning moment—came after I had finished the initial implementation. When I tried uploading the project to GitHub, I realized I had made a major security mistake: I had hardcoded the Firebase config and API keys directly into the `firebase.js` file. I didn't know at the time that this was the wrong way to do it. It was through this mistake that I learned the importance of environment variables. I moved all the sensitive keys to a `.env` file and used `import.meta.env` to access them, ensuring they wouldn't be exposed in the repository. That fix gave me a real sense of accomplishment because it was a tangible lesson in building secure applications.

After that experience, Firebase integration became much easier in my future projects. This initial struggle in Project 2 was crucial; it laid the foundation for a much smoother setup in Projects 3 and 4. I also grew to love the Vite development environment. It's so simple and fast that I now feel like with React and Vite, I can build almost any project.

### 3.3 Translation and Data Flow
When a client receives a message from the WebSocket server, it triggers the `handleIncomingMessage` helper function. This function enriches the message data (e.g., fetching a user's profile from a cache or Firestore) and then calls the `translateText` utility. This utility sends the message text to the Microsoft Translator API. The final message object, now containing both the original text and the translated version, is added to the React state, causing the UI to re-render and display the new message.

---

## 4. Testing

My testing process was primarily manual, focusing on simulating real-world use cases to ensure all features worked as intended.

- **Authentication:** Tested signup, login (email and Google), and guest flows. I made sure that deactivated users were properly blocked from logging in or sending messages.
- **Multi-User Simulation:** I opened the application in multiple browsers (Chrome, Firefox) and on different devices to test the real-time functionality. I verified that messages, typing indicators, and the online user list updated instantly across all clients.
- **Translation:** I set one user's language to English and another to French and confirmed that each user saw incoming messages translated into their chosen language.
- **Admin Panel:** I manually set the `isAdmin` flag to `true` for my user in the Firestore console and verified that I could access the dashboard, deactivate/reactivate user accounts, and manage the list of supported languages.
- **Room Functionality:** Tested the creation of private rooms, inviting users, and ensuring only members could see and join them. I also tested the cascade delete feature to ensure that deleting a room also deleted all messages within it.

### 4.1 Personal Testing Experience

During testing, I encountered a significant challenge with the real-time presence tracking. While testing with two separate Chrome windows and two different accounts, I noticed that the "Online Users" counter wasn't behaving correctly. When a user logged off and then logged back on, instead of the count remaining the same, it would sometimes increment, inaccurately inflating the number of online users.

It was an annoying bug, and I spent some time trying to resolve it. I managed to get it to a point where it correctly counted unique users logging in, but the issue of it double-counting upon a quick logout/login cycle remained. Due to time constraints and the need to complete all the other core features of the project, I had to make a compromise. I decided to leave the feature in its partially working state and prioritize finishing the rest of the application. While the project was successfully completed with all major features implemented, my biggest regret is not having enough time to perfect the online presence counter. It's a clear area I would revisit.

---

## 5. Future Work

Given more time, I would expand the project with the following features:

- **Perfect the Presence System:** The first priority would be to revisit and fix the bug in the online user counter, ensuring it accurately reflects the number of unique users at all times, even with rapid connections and disconnections.
- **Group Chat Enhancements**: Improve the group chat functionality with features like adding/removing users from existing rooms and assigning room administrators.
- **File & Image Sharing:** Allow users to upload and share images or other files, which would involve integrating with a service like Firebase Storage.
- **Private One-to-One Messaging:** A dedicated system for users to start private conversations outside of the main rooms.
- **CI/CD Pipeline:** Using GitHub Actions to automate testing and deployment, something I became more familiar with in later projects.

---

## 6. Conclusion

Building the Real-Time Chat App with Language Translation was a challenging but incredibly rewarding experience. The final application successfully meets all the requirements laid out in the scope document, combining a React frontend, a Node.js WebSocket backend, and Firebase services to create a functional and modern web app.

On a personal level, this project was a huge step forward. The single biggest skill I gained was the discovery of and proficiency with **React & Vite**. I absolutely love this framework now; it has become my go-to for any project. Its speed and simplicity make me feel like I can build almost any project. This project also gave me my first real experience with **Firebase**, and the knowledge I gained came in very handy for my later work. Before these graduation projects, I had never deployed an application, and learning how to do so here has opened the door for me to build better and more functional websites and apps in the future.

Project 2 truly set the stage for Projects 3 and 4 by expanding my knowledge of React, Vite, and the fundamentals of Firebase. It moved me beyond basic applications and into the complexities of real-time systems. Most importantly, it was exciting to build a tool that has clear real-world value, and it has inspired me to continue exploring how technology can be used to bring people closer together.

---