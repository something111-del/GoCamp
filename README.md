# 🏕️ GoCamp - Campground Discovery Platform

A full-stack web application for discovering and managing campgrounds with real-time live chat support. Built with a modern microservices architecture using React, Node.js, Go, and MongoDB.

![GoCamp Banner](https://img.shields.io/badge/Status-Production%20Ready-brightgreen) ![License](https://img.shields.io/badge/License-MIT-blue)

## 🌟 Features

### Core Functionality
- **Interactive Map Interface**: Explore campgrounds on an interactive Mapbox GL map with custom markers
- **Campground Management**: Full CRUD operations for campgrounds with image uploads (Cloudinary integration)
- **Advanced Search**: Filter campgrounds by name, location, and amenities
- **User Authentication**: Secure JWT-based authentication with role-based access control (Users, Consultants, Admins)

### Real-Time Live Chat
- **WebSocket Communication**: Real-time bidirectional chat between users and consultants
- **Smart Timeout Handling**: 300-second timeout with automatic fallback to query submission
- **Email Notifications**: Automated SMTP notifications when users request live support
- **Chat History**: Persistent chat sessions with search functionality for consultants
- **Optimistic UI Updates**: Instant message feedback with server-side deduplication

### UI/UX Optimizations
- **Responsive Design**: Mobile-first approach with seamless desktop experience
- **Performance Optimized**: Minimal animations, optimized marker rendering (3px markers)
- **Visual Stability**: No marker drift during zoom, reduced repaints/reflows
- **Glassmorphism Effects**: Modern, premium aesthetic with smooth transitions

## 🏗️ Architecture

### Microservices Design
```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   React SPA     │────▶│   Node.js API   │────▶│    MongoDB      │
│   (Frontend)    │     │   (Backend)     │     │   (Database)    │
│   Port: 3000    │     │   Port: 5001    │     │   Port: 27017   │
└─────────────────┘     └─────────────────┘     └─────────────────┘
         │                                                ▲
         │              ┌─────────────────┐              │
         └─────────────▶│  Go WebSocket   │──────────────┘
                        │   (Chatbot)     │
                        │   Port: 8080    │
                        └─────────────────┘
```

### Tech Stack

**Frontend**
- React 18.2
- React Router DOM 6.18
- Mapbox GL 2.15
- Axios for API calls
- WebSocket client for real-time chat

**Backend (Node.js)**
- Express 4.18
- Mongoose 7.6 (MongoDB ODM)
- JWT authentication
- Bcrypt password hashing
- Cloudinary image storage
- Multer file uploads

**Backend (Go)**
- Gorilla WebSocket
- MongoDB Go Driver
- Gomail v2 (SMTP)
- UUID generation
- Hub pattern for WebSocket management

**Database**
- MongoDB 6

**DevOps**
- Docker & Docker Compose
- Multi-container orchestration
- Volume persistence

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose installed
- Mapbox API token ([Get one here](https://www.mapbox.com/))
- Gmail account for SMTP (or other SMTP provider)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/gocamp.git
   cd gocamp
   ```

2. **Create environment file**
   Create a `.env` file in the root directory:
   ```env
   # MongoDB
   MONGO_URI=mongodb://mongo:27017/gocamp
   
   # JWT Secret
   JWT_SECRET=super_secret_jwt_key_
   
   # Cloudinary (for image uploads)
   CLOUDINARY_CLOUD_NAME=cloudinary_cloud_name
   CLOUDINARY_API_KEY=cloudinary_api_key
   CLOUDINARY_API_SECRET=cloudinary_api_secret
   
   # Mapbox
   REACT_APP_MAPBOX_TOKEN=mapbox_access_token
   
   # SMTP Configuration (for live chat notifications)
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   SMTP_USER=email@gmail.com
   SMTP_PASS=gmail_app_password
   ADMIN_EMAIL=admin@gocamp.com
   ```

3. **Build and run with Docker Compose**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:3000
   - Node.js API: http://localhost:5001
   - Go Chatbot: http://localhost:8080
   - MongoDB: localhost:27017

### Development Mode

**Frontend**
```bash
cd frontend
npm install
npm start
```

**Backend (Node.js)**
```bash
cd backend
npm install
npm run dev
```

**Backend (Go)**
```bash
cd go-chatbot
go mod download
go run main.go
```

## 📁 Project Structure

```
GoCamp/
├── frontend/                 # React application
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── CampgroundList.js
│   │   │   ├── CampgroundForm.js
│   │   │   ├── LiveChat.js
│   │   │   ├── AdminChatDashboard.js
│   │   │   └── ...
│   │   ├── services/        # API service layer
│   │   └── index.css        # Global styles
│   └── Dockerfile
│
├── backend/                  # Node.js Express API
│   ├── models/              # Mongoose schemas
│   │   ├── Campground.js
│   │   └── User.js
│   ├── routes/              # API routes
│   │   ├── campgrounds.js
│   │   ├── auth.js
│   │   └── queries.js
│   ├── middleware/          # Auth middleware
│   ├── app.js               # Express app
│   └── Dockerfile
│
├── go-chatbot/              # Go WebSocket service
│   ├── handlers/
│   │   ├── websocketHandler.go
│   │   ├── chatbotHandler.go
│   │   └── emailHandler.go
│   ├── models/
│   │   ├── chatSession.go
│   │   └── query.go
│   ├── main.go
│   ├── go.mod
│   └── Dockerfile
│
├── docker-compose.yml       # Multi-container orchestration
├── .env                     # Environment variables
└── README.md
```

## 🔑 Key Features Explained

### 1. Real-Time Chat System
The live chat uses WebSocket connections managed by a Go service:
- **Hub Pattern**: Centralized client management with concurrent-safe operations
- **Session Management**: Each chat session is uniquely identified and persisted
- **Sender Exclusion**: Messages are broadcast to all clients except the sender (prevents duplicates)
- **Race Condition Handling**: Strategic delays ensure proper client registration
- **Timeout Mechanism**: 300-second countdown with automatic query submission fallback

### 2. Authentication & Authorization
- **JWT Tokens**: Stateless authentication with 24-hour expiration
- **Role-Based Access**: Three roles (user, consultant, admin) with protected routes
- **Password Security**: Bcrypt hashing with salt rounds
- **Protected Endpoints**: Middleware validation on sensitive routes

### 3. Performance Optimizations
- **Optimistic UI**: Instant message display with server-side deduplication
- **Minimal Animations**: Reduced CSS transforms for better performance
- **Small Markers**: 3px map markers for reduced DOM footprint
- Lazy Loading: Components loaded on-demand with React Router

### 4. Admin Invite System
Secure invitation system for onboarding new administrators:
- **Token-Based Invitations**: Generates unique UUID tokens for invite links
- **Expiration Handling**: Invitations automatically expire after 24 hours
- **Role Verification**: Strict middleware checks to ensure only existing admins can send invites
- **Status Tracking**: Ability to view pending invitations and their status
- **Secure Registration**: Dedicated flow for invited admins to set up their credentials

## 🧪 Testing

## UAT
User registration and login
Campground CRUD operations
Map interactions (zoom, pan, marker clicks)
Live chat initiation and message exchange
Chat timeout and fallback to query form
Email notifications for live chat requests
Chat history search functionality
Role-based access control

## 🔒 Security Considerations

## 🚢 Deployment

This project is configured for automated deployment using **GitHub Actions**, **Google Cloud Run**, and **Firebase Hosting**.

### Architecture
- **Backend (Node.js)**: Deployed to Google Cloud Run (Serverless Container)
- **Frontend (React)**: Deployed to Firebase Hosting (CDN)
- **Database**: MongoDB Atlas (Cloud)
- **Chatbot (Go)**: *Pending deployment*

### CI/CD Pipeline
Every push to the `main` branch triggers the following workflow:
1. **Backend Build**: Docker image is built and pushed to Google Container Registry (GCR).
2. **Backend Deploy**: Image is deployed to Cloud Run.
3. **Frontend Build**: React app is built, injecting the new Backend URL.
4. **Frontend Deploy**: Static assets are deployed to Firebase Hosting.

### Setup Requirements
To deploy own instance,set the following **GitHub Secrets**:
- `GCP_PROJECT_ID`: Google Cloud Project ID
- `GCP_SA_KEY`: Google Cloud Service Account JSON Key
- `FIREBASE_SERVICE_ACCOUNT`: Same as GCP_SA_KEY (with Firebase Admin role)
- `MONGO_URI`: MongoDB Atlas connection string
- `JWT_SECRET`: Secret key for authentication
- `CLOUD_NAME`, `CLOUD_API_KEY`, `CLOUD_API_SECRET`: Cloudinary credentials
- `REACT_APP_MAPBOX_TOKEN`: Mapbox API token

## 🤝 Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License.

## 👨‍💻 Author

- GitHub: (https://github.com/something111-del) 

## 🙏 Acknowledgments
- Mapbox for the interactive map API
- Cloudinary for image hosting
- MongoDB for flexible data storage
- Docker for containerization

---

**Built with ❤️ using React, Node.js, Go, and MongoDB**
