# 🎯 RENDER.COM QUICK REFERENCE

**Keep this open during deployment!**

---

## 🚂 RENDER BACKEND CONFIGURATION

### Root Directory
```
backend
```

### Build Command
```bash
npm install && npx prisma generate && npm run build
```

### Start Command
```bash
npx prisma migrate deploy && npm start
```

### Instance Type
```
FREE (Important!)
```

### Persistent Disk
```
Name: uploads
Mount Path: /opt/render/project/src/uploads
Size: 1 GB
```

---

## 📋 ENVIRONMENT VARIABLES (Render)

```env
DATABASE_URL=<copy from Render PostgreSQL>
JWT_SECRET=MyVerySecureRandomSecretKeyForJWTAuth2026StudentNotesHub!@#$%
PORT=10000
NODE_ENV=production
UPLOAD_DIR=/opt/render/project/src/uploads
CORS_ORIGIN=* (update after frontend deploy)
```

**Optional:**
```env
GEMINI_API_KEY=<your-key>
EMAIL_SERVICE=gmail
EMAIL_USER=<your-email>
EMAIL_PASSWORD=<app-password>
EMAIL_FROM=Student Notes Hub <your-email>
```

---

## ✈️ VERCEL FRONTEND CONFIGURATION

### Framework
```
Vite
```

### Root Directory
```
frontend
```

### Environment Variables (Vercel)
```env
VITE_API_URL=https://your-backend.onrender.com/api
VITE_WS_URL=https://your-backend.onrender.com
```

⚠️ **Important:**
- VITE_API_URL has `/api` at end
- VITE_WS_URL does NOT have `/api`

---

## 🔧 KEY DIFFERENCES FROM RAILWAY

| Item | Render | Railway |
|------|--------|---------|
| **Upload Path** | `/opt/render/project/src/uploads` | `/app/uploads` |
| **Port** | `10000` | `5000` |
| **Disk Config** | Persistent Disk | Volume |
| **Auto-deploy** | No (manual) | Yes |
| **Service Sleep** | Yes (15 min) | No |
| **DB Expiry** | 90 days | Never |

---

## ⚠️ FREE TIER NOTES

### Service Sleep (15 min)
- First request after sleep: ~30 seconds
- Subsequent requests: instant
- **Solution:** Use UptimeRobot (free) to ping every 14 min

### Database Expires (90 days)
- Set calendar reminder for day 85
- Backup command:
  ```bash
  pg_dump DATABASE_URL > backup.sql
  ```
- Create new database and restore

---

## ✅ HEALTH CHECK

```
https://your-backend.onrender.com/health
```

Expected:
```json
{"status":"ok","timestamp":"..."}
```

---

## 🐛 QUICK FIXES

### Service won't start
```
Check build logs
Verify DATABASE_URL
Check all env vars set
```

### Slow first request
```
Service was sleeping (normal for free tier)
Wait 30 seconds
Or use UptimeRobot to keep awake
```

### File upload fails
```
Check Persistent Disk mounted
Verify UPLOAD_DIR path correct
Check disk not full (1GB limit)
```

---

## 📚 FULL GUIDES

- **Complete Guide:** FREE_DEPLOYMENT_GUIDE.md
- **Options Comparison:** FREE_HOSTING_OPTIONS.md  
- **Checklist:** FREE_DEPLOYMENT_CHECKLIST.md

---

## 🔗 LINKS

**Render:** https://render.com  
**Vercel:** https://vercel.com  
**UptimeRobot:** https://uptimerobot.com (optional, keep service awake)

---

**Total Cost: $0/month** 🎉
