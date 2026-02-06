#!/bin/bash

# Install Chat Feature Dependencies
echo "=================================="
echo "Installing Chat Feature Dependencies"
echo "=================================="
echo ""

# Backend dependencies
echo "1/3 Installing backend dependencies..."
cd backend
npm install socket.io @types/socket.io
echo "✓ Backend dependencies installed!"
echo ""

# Frontend dependencies
echo "2/3 Installing frontend dependencies..."
cd ../frontend
npm install socket.io-client
echo "✓ Frontend dependencies installed!"
echo ""

# Database migration
echo "3/3 Running database migration..."
cd ../backend
npx prisma migrate dev --name add_chat_system
npx prisma generate
echo "✓ Database migration completed!"
echo ""

cd ..

echo "=================================="
echo "✓ Installation Complete!"
echo "=================================="
echo ""
echo "Next steps:"
echo "1. Run: npm run dev"
echo "2. Open browser: http://localhost:5173"
echo "3. Click 'Messages' in the navigation"
echo ""
