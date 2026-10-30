@'
DATABASE_URL="postgresql://postgres:12345@localhost:5432/student_notes_db"
JWT_SECRET="your-secure-jwt-secret"
PORT=5000
UPLOAD_DIR="./uploads"
# Mailtrap SMTP Settings (if needed)
EMAIL_SERVICE="smtp"
EMAIL_HOST="sandbox.smtp.mailtrap.io"
EMAIL_PORT=2525
EMAIL_USER="86de467ca6dc5c"
EMAIL_PASSWORD="763e7d0a6517ab"
EMAIL_FROM="Student Notes Hub <noreply@studentnoteshub.com>"
FEEDBACK_EMAIL="studentnoteshub@gmail.com"

# IMPORTANT: Replace the value below with your actual Gemini API key
# Get a key from: https://makersuite.google.com/app/apikey
GEMINI_API_KEY="AIzaSyAdd-Your-Actual-Key-Here"
'@ | Out-File -FilePath .env -Encoding utf8

Write-Host "Created new .env file. Please edit it to add your real Gemini API key."
Write-Host "Then restart your server with 'npm run dev'" 