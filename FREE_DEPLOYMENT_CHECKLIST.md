# ✅ FREE Deployment Checklist
**Render.com + Vercel - 100% Free**

---

## 🚂 RENDER BACKEND

### PostgreSQL Database
- [ ] Created Render account (no credit card!)
- [ ] Created PostgreSQL database (Free tier)
- [ ] Copied DATABASE_URL
- [ ] URL saved: _________________________________

### Web Service
- [ ] Created Web Service from GitHub
- [ ] Set root directory: `backend`
- [ ] Build command: `npm install && npx prisma generate && npm run build`
- [ ] Start command: `npx prisma migrate deploy && npm start`
- [ ] Selected **Free** instance type

### Environment Variables
- [ ] DATABASE_URL (from PostgreSQL)
- [ ] JWT_SECRET
- [ ] PORT=10000
- [ ] NODE_ENV=production
- [ ] UPLOAD_DIR=/opt/render/project/src/uploads
- [ ] CORS_ORIGIN=* (update later)

### Persistent Disk
- [ ] Added disk for uploads
- [ ] Mount path: `/opt/render/project/src/uploads`
- [ ] Size: 1GB

### Deployment
- [ ] Service deployed successfully
- [ ] Checked logs - no errors
- [ ] Got service URL: _________________________________
- [ ] Health check works: _________________________________/health

---

## ✈️ VERCEL FRONTEND

- [ ] Created Vercel account
- [ ] Imported GitHub repository
- [ ] Framework: Vite
- [ ] Root directory: `frontend`
- [ ] Added VITE_API_URL: _________________/api
- [ ] Added VITE_WS_URL: _________________
- [ ] Deployed successfully
- [ ] Frontend URL: _________________________________

---

## 🔄 UPDATE CORS

- [ ] Updated CORS_ORIGIN in Render
- [ ] Value: _________________________________
- [ ] Manually redeployed backend
- [ ] Redeployment successful

---

## ✅ TESTING

- [ ] Frontend loads
- [ ] Sign up works
- [ ] Login works
- [ ] File upload works
- [ ] Chat connected
- [ ] No console errors

---

## 📆 POST-DEPLOYMENT

- [ ] Set calendar reminder for day 85 (database backup)
- [ ] Optional: Set up UptimeRobot to prevent sleep
- [ ] Bookmarked Render dashboard
- [ ] Bookmarked Vercel dashboard

---

**Deployed:** _______________ 
**Status:** ⬜ Complete  ⬜ Issues

**Notes:**
_________________________________________________
