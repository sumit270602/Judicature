# Judicature Backend

This is the backend API for the Judicature legal case management system.

## Features
- User authentication (JWT, bcrypt, role-based)
- Case management (CRUD)
- Real-time chat (Socket.io)
- File upload (Cloudinary)
- AI-powered endpoints (OpenAI integration)
- PDF parsing and clause extraction

## Requirements
- Node.js 18+
- MongoDB
- Cloudinary account (for file uploads)
- OpenAI API key (for AI features)

## Setup

1. **Clone the repository**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**
   - Copy `.env.example` to `.env` and fill in your values:
     - `MONGO_URI`
     - `JWT_SECRET`
     - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
     - `OPENAI_API_KEY`

4. **Run the server (development)**
   ```bash
   npm run dev
   ```

5. **Run the server (production)**
   ```bash
   npm start
   ```

## API Endpoints
- `/api/auth` - Register, login, get current user
- `/api/users` - User management (admin)
- `/api/cases` - Case CRUD
- `/api/upload` - File upload
- `/api/chat` - Chat history
- `/api/ai` - AI endpoints (summarize, query, extract-clauses)

## WebSocket (Socket.io)
- Connect to the same host/port as the API
- Authenticate with JWT
- Join rooms by caseId

## License
MIT 