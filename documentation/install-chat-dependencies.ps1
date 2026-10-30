# Install Chat Feature Dependencies
Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Installing Chat Feature Dependencies" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Backend dependencies
Write-Host "1/3 Installing backend dependencies..." -ForegroundColor Yellow
Set-Location backend
npm install socket.io @types/socket.io
Write-Host "✓ Backend dependencies installed!" -ForegroundColor Green
Write-Host ""

# Frontend dependencies
Write-Host "2/3 Installing frontend dependencies..." -ForegroundColor Yellow
Set-Location ..\frontend
npm install socket.io-client
Write-Host "✓ Frontend dependencies installed!" -ForegroundColor Green
Write-Host ""

# Database migration
Write-Host "3/3 Running database migration..." -ForegroundColor Yellow
Set-Location ..\backend
npx prisma migrate dev --name add_chat_system
npx prisma generate
Write-Host "✓ Database migration completed!" -ForegroundColor Green
Write-Host ""

Set-Location ..

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "✓ Installation Complete!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Run: npm run dev" -ForegroundColor White
Write-Host "2. Open browser: http://localhost:5173" -ForegroundColor White
Write-Host "3. Click 'Messages' in the navigation" -ForegroundColor White
Write-Host ""
