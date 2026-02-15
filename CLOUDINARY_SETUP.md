# 📦 Cloudinary Integration for File Uploads

**100% FREE File Storage Solution for Render.com**

---

## ⚠️ Why You Need This

Render's **FREE tier does NOT support persistent storage**. This means:
- ❌ Uploaded files are deleted when service sleeps
- ❌ Uploaded files are deleted on every deployment
- ❌ No way to store files permanently

**Solution:** Use Cloudinary (free 25GB storage!)

---

## 🚀 Quick Setup (15 minutes)

### Step 1: Create Cloudinary Account

1. Go to https://cloudinary.com
2. Click **"Sign Up Free"**
3. Fill in details (**NO credit card required!**)
4. Verify your email

### Step 2: Get Your Credentials

1. Go to Cloudinary Dashboard
2. You'll see your **Account Details**:
   - **Cloud Name:** `dxxxxxxxxxxxxx`
   - **API Key:** `123456789012345`
   - **API Secret:** `aBcDeFgHiJkLmNoPqRsTuVwXyZ`
3. **Copy these** - you'll need them!

### Step 3: Add to Render Environment Variables

1. Go to your Render backend service
2. Go to **"Environment"** tab
3. Add these 3 variables:

| Key | Value |
|-----|-------|
| `CLOUDINARY_CLOUD_NAME` | Your cloud name |
| `CLOUDINARY_API_KEY` | Your API key |
| `CLOUDINARY_API_SECRET` | Your API secret |

4. Save changes

---

## 💻 Update Backend Code

### Install Cloudinary Package

```bash
cd backend
npm install cloudinary multer-storage-cloudinary
```

### Update package.json Dependencies

This should be added automatically, but verify:

```json
{
  "dependencies": {
    "cloudinary": "^1.41.0",
    "multer-storage-cloudinary": "^4.0.0"
  }
}
```

### Create Cloudinary Config File

Create `backend/src/config/cloudinary.ts`:

```typescript
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export default cloudinary;
```

### Update Upload Route

Replace `backend/src/routes/upload.ts`:

```typescript
import express from 'express';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary';
import { authMiddleware } from '../middleware/auth';

const router = express.Router();

// Cloudinary storage configuration
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'student-notes-uploads',
    allowed_formats: ['jpg', 'png', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt'],
    resource_type: 'auto', // Automatically detect resource type
  } as any,
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

// Upload endpoint
router.post('/', authMiddleware, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    res.json({
      url: req.file.path, // Cloudinary URL
      fileName: req.file.originalname,
      fileType: req.file.mimetype,
      size: req.file.size,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'File upload failed' });
  }
});

export default router;
```

---

## 📝 Commit and Push Changes

```bash
git add .
git commit -m "Add Cloudinary integration for file uploads"
git push origin main
```

---

## 🔄 Redeploy on Render

1. Go to Render dashboard
2. Click on your backend service
3. Go to **"Manual Deploy"** tab
4. Click **"Deploy latest commit"**
5. Wait for deployment to complete

---

## ✅ Test File Upload

1. Open your frontend
2. Try uploading a note with a PDF
3. File should upload successfully
4. File URL will be from Cloudinary (e.g., `https://res.cloudinary.com/...`)

---

## 📊 Cloudinary Free Tier

✅ **What You Get:**
- 25GB storage
- 25GB monthly bandwidth
- 25,000 transformations/month
- **More than enough** for your app!

⚠️ **Limits:**
- Files over 10MB require paid plan
- Video uploads count as more storage

---

## 🔧 Troubleshooting

### Upload fails with "Invalid credentials"
- Double-check environment variables in Render
- Verify Cloud Name, API Key, and API Secret
- Redeploy after adding env vars

### Upload fails with "File too large"
- Current limit: 10MB (see multer config)
- Cloudinary free tier supports up to 100MB per file
- Increase multer limit if needed

### Files upload but don't display
- Check file URL format in database
- Verify Cloudinary URL is accessible
- Check CORS headers

---

## 🎯 Done!

Your file uploads now use **Cloudinary** instead of local storage.

**Benefits:**
- ✅ Files persist forever (no sleep/restart issues)
- ✅ 25GB free storage
- ✅ CDN delivery (fast worldwide)
- ✅ Image transformations available

**No more file loss on Render free tier!** 🎉

---

## 📚 Next Steps

- Test all upload features
- Monitor Cloudinary usage dashboard
- Upgrade Cloudinary if you need more storage (cheap plans available)

