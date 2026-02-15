# Student Notes Platform

A modern web application for students to share and collaborate on educational resources.

## Sample Image


## Features

- **Course-Based Organization**: Notes are categorized by courses and semesters
- **Resource Types**: Support for lecture notes, study guides, past exams, and more
- **PDF Upload**: Upload and share PDF documents
- **Social Features**: Follow users, create connections, and interact with notifications
- **Search & Tagging**: Find relevant content through powerful search and tag system
- **User Profiles**: Customizable profiles with academic interests and social links
- **Feedback System**: Built-in feedback form that sends notifications to administrators

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript, multer, @types/multer
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based authentication
- **Email**: Nodemailer for feedback notifications

## Getting Started

### Prerequisites

- Node.js (v14+)
- PostgreSQL
- npm or yarn

### Installation

1. Clone the repository:
   ```
   git clone https://github.com/yourusername/student-notes-platform.git
   cd student-notes-platform
   ```

2. Install dependencies:
   ```
   # Install backend dependencies
   cd backend
   npm install
   # New: install file upload dependencies
   npm install multer @types/multer
   # Additional dependencies for AI features (text extraction, Gemini API)
   npm install @google/generative-ai pdf.js-extract mammoth jsdom @types/jsdom

   # Install frontend dependencies
   cd ../frontend
   npm install
   # Additional dependencies for UI enhancements
   npm install framer-motion
   ```

3. Set up environment variables:
   - Create a `.env` file in the `backend` directory
   - Add the following variables:
     ```
     DATABASE_URL="postgresql://username:password@localhost:5432/student_notes_db"
     JWT_SECRET="your-secret-key"
     PORT=5000
     UPLOAD_DIR="./uploads"
     
     # Gemini API Key (REQUIRED for AI features)
     GEMINI_API_KEY="your-gemini-api-key-here" 
     
     # Optional email settings for feedback notifications
     EMAIL_SERVICE="gmail"
     EMAIL_USER="your-email@gmail.com"
     EMAIL_PASSWORD="your-app-password"
     EMAIL_FROM="Student Notes Hub <your-email@gmail.com>"
     ```

4. Run database migrations:
   ```
   cd backend
   npx prisma migrate dev
   ```

5. Start the application:
   ```
   # Start backend (from backend directory)
   npm run dev

   # Start frontend (from frontend directory)
   npm run dev
   ```

### New Dependencies

- Backend: `multer` (file upload middleware) and `@types/multer` (TypeScript types)

### New/Updated Backend Endpoints

- `POST /api/upload` — authenticated file upload. Returns JSON with `url`, `fileName`, `fileType`, `size`.
- `DELETE /api/chat/chats/:chatId/messages` — clear all messages in a chat (members only).

### Notes on File Uploads

- Uploaded files are stored under `backend/uploads/` and served via `GET /uploads/*`.
- Max file size: 10MB.
- Allowed types: images (jpg, png, gif, webp, bmp, svg), PDF, Word (`.doc/.docx`), Excel (`.xls/.xlsx`), and text files.

### Frontend Configuration

Ensure the frontend points to the backend API and WebSocket URLs (defaults are used if not set):

```
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=http://localhost:5000
```

These may already default correctly in code; set explicitly if your ports differ.

## Chat Feature Setup

Follow these steps to enable the real‑time chat, file sharing, and note sharing features.

### Dependencies

- **Backend**:
  - `socket.io`
  - `@types/socket.io`
  - `multer`
  - `@types/multer`
- **Frontend**:
  - `socket.io-client`

Install manually:

```bash
# Backend
cd backend
npm install socket.io @types/socket.io multer @types/multer

# Frontend
cd ../frontend
npm install socket.io-client
```

Or run the provided installer scripts from the repo root:

```bash
# macOS/Linux
bash ./install-chat-dependencies.sh

# Windows (PowerShell)
./install-chat-dependencies.ps1
```

### Database Migration (Chat Models)

Run the Prisma migration to create chat tables if you haven’t already:

```bash
cd backend
npx prisma migrate dev --name add_chat_system
npx prisma generate
```

### Environment Variables

Backend `.env` already includes common vars. Ensure these are set as needed:

```env
PORT=5000
UPLOAD_DIR="./uploads"
JWT_SECRET="your-secret-key"
DATABASE_URL="postgresql://username:password@localhost:5432/student_notes_db"
```

Frontend (optional overrides in `.env`):

```env
VITE_API_URL=http://localhost:5000/api
VITE_WS_URL=http://localhost:5000
```

### Start Dev Servers

```bash
# In repo root
npm run dev
```

This runs backend (Express + Socket.io) and frontend (Vite).

### Verify Chat Feature

- **Socket connection**: green "Connected" dot on `Messages` page.
- **Create chat**: click "+ New Chat", search a user, send a message.
- **File sending**: click 📎, select image/PDF/Doc/XLS, send. File appears in chat.
- **Note sharing**: open a note → Share → select chat → message shows a clickable note card.
- **Clear chat**: Chat settings → Clear Chat History.

### Troubleshooting

- If upload fails, ensure the `uploads/` directory exists at `backend/uploads/` and the server serves `/uploads/*`.
- If Socket shows "Disconnected", verify `VITE_WS_URL` and backend `PORT` match and CORS allows your origin.
- If Prisma errors, re‑run `npx prisma migrate dev` and `npx prisma generate` in `backend/`.
- If file preview doesn’t render, hard refresh the frontend and re‑send the file (images open in new tab on click).

## Project Structure

```
student-notes-platform/
├── backend/              # Node.js backend
│   ├── prisma/           # Prisma schema and migrations
│   ├── src/              # Source code
│   │   ├── middleware/   # Express middleware
│   │   ├── routes/       # API routes
│   │   ├── services/     # Service modules
│   │   └── index.ts      # Entry point
│   └── uploads/          # User uploaded files
└── frontend/             # React frontend
    ├── public/           # Static assets
    └── src/              # Source code
        ├── components/   # React components
        │   ├── auth/     # Authentication components
        │   ├── layout/   # Layout components
        │   ├── notes/    # Note-related components
        │   ├── shared/   # Shared/common components
        │   └── ui/       # UI components
        ├── pages/        # Page components
        ├── services/     # API services
        ├── store/        # State management
        ├── types/        # TypeScript interfaces
        └── utils/        # Utility functions
```

## Feedback System

The platform includes a dedicated feedback system that allows users to:

- Submit feedback directly from the application
- Rate their experience on a scale of 1-5
- Categorize their feedback (bug report, feature request, general feedback, etc.)
- Send feedback notifications to administrators

All feedback is stored in the database and can be accessed by administrators. Email notifications are sent to the configured email address when feedback is submitted.

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information.

## AI Features Setup

### Gemini API Setup
1. Obtain an API key from [Google Gemini AI](https://makersuite.google.com/app/apikey)
2. Create or edit the `.env` file in the backend directory and add:
   ```
   GEMINI_API_KEY="your-gemini-api-key-here"
   ```
3. Restart the backend server

### Available AI Features
- **Note Summarization**: Automatically generates summaries of uploaded notes using Google's Gemini AI
  - View these summaries in the note details page for any note with an attached file
  - Click "Generate Summary" to create a new summary 
