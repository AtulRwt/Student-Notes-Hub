# 🆓 FREE Deployment Guide - Student Notes Hub
**Render.com (Backend + Database) + Vercel (Frontend)**

---

## ✅ What You Get (100% FREE)

| Service | What | Free Tier Limits |
|---------|------|------------------|
| **Render** | Backend + PostgreSQL | ✅ 750 hours/month<br>⚠️ Sleeps after 15 min inactivity<br>⚠️ Database expires after 90 days |
| **Vercel** | Frontend | ✅ Unlimited bandwidth<br>✅ Fast CDN |

**Total Cost:** $0/month 💰

---

## ⚠️ FREE TIER LIMITATIONS

### Render.com Free Tier:
1. **Backend sleeps after 15 minutes** of inactivity
   - First request after sleep takes ~30 seconds to wake up
   - Subsequent requests are instant
   
2. **PostgreSQL database expires after 90 days**
   - You'll need to create a new database and migrate data
   - Export/import data every 3 months

3. **Limited resources**
   - 512MB RAM
   - Shared CPU
   - Good for personal projects, not production

### Vercel Free Tier:
1. **Generous limits** - Perfect for frontend
2. No major limitations for your use case

---

## 🚀 DEPLOYMENT STEPS

---

## PHASE 1: Deploy Backend to Render.com (20 min)

### Step 1.1: Create Render Account

1. Go to https://render.com
2. Click **"Get Started"**
3. Click **"Sign up with GitHub"**
4. Authorize Render
5. Complete signup (free tier, no credit card required!)

### Step 1.2: Create PostgreSQL Database

1. On Render dashboard, click **"New +"** (top right)
2. Select **"PostgreSQL"**
3. Fill in database details:
   - **Name:** `student-notes-db`
   - **Database:** `student_notes` (auto-filled)
   - **User:** `student_notes_user` (auto-filled)
   - **Region:** Choose closest to you
   - **PostgreSQL Version:** 15 (or latest)
4. Scroll down to **"Instance Type"**
5. Select **"Free"**
6. Click **"Create Database"**
7. Wait for database to provision (1-2 minutes)

### Step 1.3: Get Database Connection String

1. Click on your newly created database
2. Scroll down to **"Connections"** section
3. Find **"Internal Database URL"** (preferred) or **"External Database URL"**
4. Click **"Copy"** button
5. **Save this URL** - Example:
   ```
   postgresql://student_notes_user:password@dpg-xxx.oregon-postgres.render.com/student_notes
   ```

### Step 1.4: Create Web Service for Backend

1. Go back to Render dashboard
2. Click **"New +"** → **"Web Service"**
3. Click **"Build and deploy from a Git repository"**
4. Click **"Connect account"** if needed, or **"Configure account"**
5. Find your repository: **"Student-Notes-Hub"**
6. Click **"Connect"**

### Step 1.5: Configure Backend Service

Fill in the form:

**Basic Configuration:**
- **Name:** `student-notes-backend` (or your choice)
- **Region:** Same as database
- **Branch:** `main`
- **Root Directory:** `backend`
- **Runtime:** `Node`

**Build & Deploy:**
- **Build Command:**
  ```bash
  npm install && npx prisma generate && npm run build
  ```
- **Start Command:**
  ```bash
  npx prisma migrate deploy && npm start
  ```

**Instance Type:**
- Select **"Free"** (Important!)

### Step 1.6: Add Environment Variables

Scroll down to **"Environment Variables"** section.

Click **"Add Environment Variable"** for each:

| Key | Value |
|-----|-------|
| `DATABASE_URL` | Paste the URL from Step 1.3 |
| `JWT_SECRET` | `MyVerySecureRandomSecretKeyForJWTAuth2026StudentNotesHub!@#$%` |
| `PORT` | `10000` |
| `NODE_ENV` | `production` |
| `UPLOAD_DIR` | `/opt/render/project/src/uploads` |
| `CORS_ORIGIN` | `*` (will update after frontend) |

**Optional (AI features):**
| Key | Value |
|-----|-------|
| `GEMINI_API_KEY` | Your Google Gemini API key |

**Optional (Email):**
| Key | Value |
|-----|-------|
| `EMAIL_SERVICE` | `gmail` |
| `EMAIL_USER` | `your-email@gmail.com` |
| `EMAIL_PASSWORD` | Your Gmail app password |
| `EMAIL_FROM` | `Student Notes Hub <your-email@gmail.com>` |

### Step 1.7: File Upload Configuration (IMPORTANT!)

⚠️ **CRITICAL ISSUE:** Render's **FREE tier does NOT support Persistent Disks**!

**This means:**
- All uploaded files will be **deleted** when service sleeps or restarts
- You MUST use cloud storage for file uploads

**FREE Cloud Storage Options:**

#### **Option A: Cloudinary (Recommended)** ⭐

1. Go to https://cloudinary.com
2. Sign up for FREE account (no credit card)
3. Get your credentials:
   - Cloud Name
   - API Key
   - API Secret
4. Add to Render environment variables:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
5. **You'll need to modify backend code** (see section below)

#### **Option B: AWS S3 Free Tier**

- 5GB storage free for 12 months
- Requires credit card
- More complex setup

#### **Option C: Accept File Loss (Demo Only)**

- For testing/demos only
- Files will be deleted on sleep/restart
- Set `UPLOAD_DIR=./uploads` (no persistent disk)
- **NOT recommended** for real use

**For now, click "Create Web Service" without adding a disk.**

> ⚠️ **We'll add Cloudinary integration after deployment** (see Phase 4 below)

### Step 1.8: Wait for Deployment

1. Render will start deploying
2. Watch the logs in real-time
3. Look for:
   - ✅ `Prisma schema loaded`
   - ✅ `Generated Prisma Client`
   - ✅ `Migration applied successfully`
   - ✅ `Server running on port 10000`
   - ✅ `WebSocket server initialized`

**First deploy takes 5-10 minutes.** ⏳

### Step 1.9: Get Backend URL

1. Once deployed, you'll see **"Your service is live 🎉"**
2. Find your URL at the top of the page
3. Example: `https://student-notes-backend.onrender.com`
4. **Copy this URL!**

### Step 1.10: Test Backend

Open in browser:
```
https://student-notes-backend.onrender.com/health
```

Expected response:
```json
{"status":"ok","timestamp":"2026-02-15T..."}
```

⚠️ **First request might take 30 seconds if service was sleeping.**

---

## PHASE 2: Deploy Frontend to Vercel (10 min)

### Step 2.1: Create Vercel Account

1. Go to https://vercel.com
2. Click **"Sign Up"**
3. Click **"Continue with GitHub"**
4. Authorize Vercel

### Step 2.2: Import Project

1. Click **"Add New..."** → **"Project"**
2. Find **"Student-Notes-Hub"**
3. Click **"Import"**

### Step 2.3: Configure Project

**Configuration:**
- **Project Name:** `student-notes-hub`
- **Framework Preset:** **Vite**
- **Root Directory:** Click **"Edit"** → Select **"frontend"**

**Build Settings** (auto-detected):
- Build Command: `npm run build`
- Output Directory: `dist`
- Install Command: `npm install`

### Step 2.4: Add Environment Variables

Add these TWO variables:

| Name | Value |
|------|-------|
| `VITE_API_URL` | `https://student-notes-backend-ecvx.onrender.com/api` |
| `VITE_WS_URL` | `https://student-notes-backend-ecvx.onrender.com` |

⚠️ **Replace with YOUR actual Render URL from Step 1.9!**

- `VITE_API_URL` has `/api` at the end
- `VITE_WS_URL` does NOT have `/api`

### Step 2.5: Deploy

1. Click **"Deploy"**
2. Wait for build (2-5 minutes)
3. Get your URL: `https://student-notes-hub.vercel.app`

---

## PHASE 3: Update CORS (2 min)

### Step 3.1: Update Backend Environment Variable

1. Go back to **Render dashboard**
2. Click on your backend service
3. Go to **"Environment"** tab
4. Find **CORS_ORIGIN**
5. Click **"Edit"**
6. Change value to your Vercel URL:
   ```
   https://student-notes-hub.vercel.app
   ```
7. Click **"Save Changes"**

### Step 3.2: Manual Deploy

1. Render doesn't auto-redeploy on env changes
2. Go to **"Manual Deploy"** tab
3. Click **"Deploy latest commit"**
4. Wait for redeployment (3-5 minutes)

---

## PHASE 4: Testing (10 min)

✅ Same testing steps as before:

1. [ ] Frontend loads
2. [ ] Sign up works
3. [ ] Login works  
4. [ ] File upload works
5. [ ] Chat shows "Connected"
6. [ ] Browser console - no errors

⚠️ **Note:** First request after 15 min might be slow (service waking up)

---

## 🔧 RENDER.COM SPECIFIC NOTES

### Important Differences from Railway:

1. **Service Sleeps:**
   - Free services sleep after 15 min inactivity
   - First wake-up request takes ~30 seconds
   - Use a service like **UptimeRobot** to ping every 14 min (keeps it awake)

2. **Database Expires:**
   - Free PostgreSQL databases expire after 90 days
   - **Before expiry:** Export your data
   - **After expiry:** Create new database, import data
   - **Automation:** Set calendar reminder for 85 days

3. **Persistent Disk:**
   - Mount path: `/opt/render/project/src/uploads`
   - Different from Railway's `/app/uploads`
   - Already configured in guide above

4. **Port:**
   - Render uses port `10000` by default
   - Our app reads from `PORT` env var, so it works

### Keeping Service Awake (Optional):

**Use UptimeRobot (Free):**

1. Go to https://uptimerobot.com
2. Sign up (free)
3. Create new monitor:
   - Type: HTTP(s)
   - URL: `https://your-backend.onrender.com/health`
   - Interval: 14 minutes
4. This pings your backend every 14 min, preventing sleep

**Pros:** No cold starts, instant response  
**Cons:** Uses free tier hours (750/month, this uses ~744)

---

## 📊 FREE TIER SUMMARY

### What You Get:

✅ **Completely Free Deployment**
- No credit card required
- No time limit (as long as you maintain it)
- Suitable for portfolio projects, demos, learning

### What You Need to Manage:

⚠️ **Database Expiry (Every 90 Days):**
```bash
# Before expiry, backup database:
pg_dump DATABASE_URL > backup.sql

# After creating new database, restore:
psql NEW_DATABASE_URL < backup.sql
```

⚠️ **Service Sleep (Optional):**
- Use UptimeRobot to keep awake
- Or accept 30s cold start on first request

---

## 🆚 Comparison: Render vs Railway

| Feature | Render (Free) | Railway (Paid) |
|---------|---------------|----------------|
| **Cost** | $0 | ~$5-10/month |
| **PostgreSQL** | 90 day expiry | Permanent |
| **Service Sleep** | Yes (15 min) | No |
| **Storage** | 1GB disk | Volume pricing |
| **Performance** | Slower | Faster |
| **Best For** | Learning, demos | Production |

---

## 🔄 Alternative: Render Paid Plan

If you want to upgrade later:

**Starter Plan ($7/month):**
- ✅ No service sleep
- ✅ Permanent database
- ✅ Better performance
- ✅ More resources

**When to upgrade:**
- You have active users
- Need reliability
- Can't manage 90-day database refresh

---

## 📝 Environment Variables Reference

### Render Backend:
```env
DATABASE_URL=postgresql://user:pass@host/db (from Render PostgreSQL)
JWT_SECRET=MyVerySecureRandomSecretKeyForJWTAuth2026StudentNotesHub!@#$%
PORT=10000
NODE_ENV=production
UPLOAD_DIR=/opt/render/project/src/uploads
CORS_ORIGIN=https://your-frontend.vercel.app
GEMINI_API_KEY=optional
EMAIL_SERVICE=gmail (optional)
EMAIL_USER=your@email.com (optional)
EMAIL_PASSWORD=app-password (optional)
EMAIL_FROM=Student Notes Hub <your@email.com> (optional)
```

### Vercel Frontend:
```env
VITE_API_URL=https://your-backend.onrender.com/api
VITE_WS_URL=https://your-backend.onrender.com
```

---

## 🎯 QUICK START SUMMARY

1. **Render:**
   - Create PostgreSQL (Free)
   - Create Web Service (Free)
   - Add persistent disk for uploads
   - Deploy backend

2. **Vercel:**
   - Import repository
   - Set root to `frontend`
   - Add environment variables
   - Deploy

3. **Update CORS:**
   - Update `CORS_ORIGIN` in Render
   - Manual redeploy

4. **Test:**
   - Sign up, login, upload, chat

**Total Time:** ~30-40 minutes  
**Total Cost:** $0 🎉

---

## 🆘 Troubleshooting

### Service won't start:
- Check build logs for errors
- Verify all environment variables are set
- Check `DATABASE_URL` is correct

### Database connection failed:
- Verify `DATABASE_URL` is the **Internal URL** from Render
- Check database is active (not expired)

### File upload fails:
- Verify persistent disk is mounted
- Check `UPLOAD_DIR=/opt/render/project/src/uploads`
- Check disk isn't full (1GB limit)

### Service is slow/times out:
- Service was sleeping (first request is slow)
- Use UptimeRobot to keep awake
- Or wait 30s for wake-up

---

## ✅ Deployment Complete!

Your Student Notes Hub is now live on 100% free hosting! 🎉

**Your URLs:**
- Frontend: `https://student-notes-hub.vercel.app`
- Backend: `https://student-notes-backend.onrender.com`
- Health: `https://student-notes-backend.onrender.com/health`

**Remember:**
- ⏰ Database expires in 90 days
- 💤 Service sleeps after 15 min (30s wake-up)
- 📊 Monitor usage in Render dashboard

**Next Steps:**
- Set calendar reminder for database backup (85 days)
- Optional: Set up UptimeRobot to prevent sleep
- Share your app with users!

---

**Happy deploying! 🚀**
