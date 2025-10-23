# 📦 Install Missing Packages

## Backend Packages Required

Run this command in the `backend` directory:

```bash
cd backend
npm install multer @types/multer
```

### What These Packages Do:
- **multer**: Handles file uploads in Express
- **@types/multer**: TypeScript types for multer

## After Installing

Restart the backend server:
```bash
npm run dev
```

## Verify Installation

Check that these appear in `backend/package.json`:
```json
{
  "dependencies": {
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "@types/multer": "^1.4.11"
  }
}
```

---

## ✅ All Packages Should Now Be Installed!
