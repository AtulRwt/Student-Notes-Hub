# Student Notes Platform

A modern web application for students to share and collaborate on educational resources.

## Features

- **Course-Based Organization**: Notes are categorized by courses and semesters
- **Resource Types**: Support for lecture notes, study guides, past exams, and more
- **PDF Upload**: Upload and share PDF documents
- **Social Features**: Follow users, create connections, and interact with notifications
- **Search & Tagging**: Find relevant content through powerful search and tag system
- **User Profiles**: Customizable profiles with academic interests and social links

## Tech Stack

- **Frontend**: React, TypeScript, Tailwind CSS
- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: JWT-based authentication

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

   # Install frontend dependencies
   cd ../frontend
   npm install
   ```

3. Set up environment variables:
   - Create a `.env` file in the backend directory
   - Add the following variables:
     ```
     DATABASE_URL="postgresql://username:password@localhost:5432/student_notes_db"
     JWT_SECRET="your-secret-key"
     PORT=5000
     UPLOAD_DIR="./uploads"
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

## Project Structure

```
student-notes-platform/
├── backend/              # Node.js backend
│   ├── prisma/           # Prisma schema and migrations
│   ├── src/              # Source code
│   │   ├── middleware/   # Express middleware
│   │   ├── routes/       # API routes
│   │   └── index.ts      # Entry point
│   └── uploads/          # User uploaded files
└── frontend/             # React frontend
    ├── public/           # Static assets
    └── src/              # Source code
        ├── components/   # React components
        ├── pages/        # Page components
        ├── store/        # State management
        ├── types/        # TypeScript interfaces
        └── utils/        # Utility functions
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

Distributed under the MIT License. See `LICENSE` for more information. 