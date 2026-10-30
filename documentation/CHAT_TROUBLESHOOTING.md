# 🔧 Chat Feature Troubleshooting Guide

## 🐛 Issue: Can't See Messages on Screen

### Quick Diagnosis Steps

1. **Open Debug Page**
   - Navigate to: `http://localhost:5173/chat-debug`
   - This page shows all connection and data status

2. **Check Connection Status**
   - Look for green "✅ Connected" indicator
   - If red "❌ Disconnected", see connection fixes below

3. **Verify User is Logged In**
   - Debug page should show user ID, name, email
   - If "No user logged in", login first

---

## ✅ Common Fixes

### Fix 1: Restart Development Server

**Problem**: Old code cached, socket not connecting

**Solution**:
```bash
# Stop server (Ctrl+C)
# Then restart
npm run dev
```

### Fix 2: Clear Browser Cache

**Problem**: Old JavaScript cached in browser

**Solution**:
1. Open DevTools (F12)
2. Right-click refresh button
3. Select "Empty Cache and Hard Reload"
4. Or use Ctrl+Shift+R

### Fix 3: Check Backend is Running

**Problem**: Backend not started or crashed

**Solution**:
```bash
# Check if you see this in terminal:
[0] Server running on port 5000
[0] WebSocket server initialized

# If not, restart:
npm run dev
```

### Fix 4: Verify Database Migration

**Problem**: Chat tables don't exist in database

**Solution**:
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

### Fix 5: Check Token

**Problem**: Invalid or missing JWT token

**Solution**:
1. Logout and login again
2. Check browser console for errors
3. Verify token exists: `localStorage.getItem('token')`

---

## 🔍 Detailed Debugging

### Step 1: Check Browser Console

Open DevTools (F12) → Console tab

**Look for**:
- ✅ "Socket connected"
- ✅ No red errors
- ❌ "Authentication error" → Token issue
- ❌ "Failed to connect" → Backend not running

### Step 2: Check Network Tab

Open DevTools (F12) → Network tab

**Look for**:
- ✅ WebSocket connection (ws://localhost:5000)
- ✅ Status 101 (Switching Protocols)
- ❌ Status 400/401 → Authentication failed
- ❌ Connection refused → Backend not running

### Step 3: Check Backend Logs

Look at terminal where backend is running

**Look for**:
- ✅ "User connected: [userId]"
- ✅ "Server running on port 5000"
- ❌ "Authentication error" → JWT issue
- ❌ Route errors → Code problem

---

## 🎯 Specific Issues & Solutions

### Issue: "Socket disconnected" message

**Causes**:
1. Backend crashed
2. Network issue
3. Invalid token

**Solutions**:
```bash
# 1. Check backend is running
# Look for: [0] Server running on port 5000

# 2. Check backend logs for errors

# 3. Re-login to get fresh token
```

### Issue: Chat list is empty

**Causes**:
1. No chats created yet
2. API request failed
3. Database empty

**Solutions**:
1. Click "+ New Chat" to create first chat
2. Check browser console for API errors
3. Verify database has data:
   ```bash
   cd backend
   npx prisma studio
   # Check Chat, ChatMember tables
   ```

### Issue: Can't send messages

**Causes**:
1. Socket not connected
2. Not a member of chat
3. Backend error

**Solutions**:
1. Check green "Connected" indicator
2. Verify you're in a valid chat
3. Check backend terminal for errors

### Issue: Messages not appearing in real-time

**Causes**:
1. Socket events not firing
2. State not updating
3. Component not re-rendering

**Solutions**:
1. Check browser console for socket events
2. Refresh page
3. Check debug page for message count

---

## 🧪 Testing Checklist

### Basic Functionality Test

- [ ] Backend running (port 5000)
- [ ] Frontend running (port 5173)
- [ ] User logged in
- [ ] Socket shows "Connected"
- [ ] Can open chat page
- [ ] Can see "+ New Chat" button
- [ ] Can search for users
- [ ] Can create new chat
- [ ] Can see chat in list
- [ ] Can open chat conversation
- [ ] Can type message
- [ ] Can send message (Enter key)
- [ ] Message appears in chat
- [ ] Message persists after refresh

### Two-User Test

1. **Setup**:
   - Open two browsers (Chrome + Incognito)
   - Create/login as User A in first browser
   - Create/login as User B in second browser

2. **Test**:
   - User A: Click Messages → New Chat → Search User B
   - User A: Send message to User B
   - User B: Should see chat appear in list
   - User B: Should see message instantly
   - User B: Reply to User A
   - User A: Should see reply instantly

3. **Expected Results**:
   - ✅ Messages appear instantly (no refresh needed)
   - ✅ Read receipts update (✓✓)
   - ✅ Typing indicators work
   - ✅ Online status shows green dot

---

## 📊 Debug Page Information

Visit `http://localhost:5173/chat-debug` to see:

### Connection Status
- Socket connection state
- Socket ID
- Connection errors

### User Information
- User ID, name, email
- Token presence
- Authentication status

### API Configuration
- API URL
- WebSocket URL
- Environment variables

### Chat Data
- Number of chats
- Current chat ID
- Message count
- Loading state
- Errors

### Test Actions
- Refresh Chats button
- Reconnect Socket button
- Log to Console button

---

## 🔧 Advanced Debugging

### Enable Verbose Logging

Add to `chatStore.ts`:
```typescript
socket.onAny((event, ...args) => {
  console.log('📡 Socket Event:', event, args);
});
```

### Check Database Directly

```bash
cd backend
npx prisma studio
```

Look at tables:
- `Chat` - Should have entries
- `ChatMember` - Should link users to chats
- `Message` - Should have messages

### Test API Endpoints Directly

```bash
# Get chats
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:5000/api/chat/chats

# Search users
curl -H "Authorization: Bearer YOUR_TOKEN" \
  "http://localhost:5000/api/chat/users/search?query=test"
```

---

## 🚨 Emergency Reset

If nothing works, nuclear option:

```bash
# 1. Stop all servers (Ctrl+C)

# 2. Reset database
cd backend
npx prisma migrate reset
npx prisma migrate dev
npx prisma generate

# 3. Clear node_modules
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../frontend
rm -rf node_modules package-lock.json
npm install

# 4. Clear browser data
# - Clear cache
# - Clear localStorage
# - Close all tabs

# 5. Restart everything
cd ..
npm run dev

# 6. Create fresh user accounts
# 7. Test chat again
```

---

## 📞 Still Not Working?

### Check These Files

1. **Backend**:
   - `backend/src/index.ts` - Server initialization
   - `backend/src/routes/chat.ts` - API routes
   - `backend/src/services/socket.ts` - WebSocket handlers

2. **Frontend**:
   - `frontend/src/store/chatStore.ts` - State management
   - `frontend/src/pages/ChatPage.tsx` - Main UI
   - `frontend/src/components/chat/` - Chat components

### Common Code Issues

**Issue**: `req.user is undefined`
**Fix**: Ensure `auth` middleware is used on all routes

**Issue**: `Cannot read property 'id' of undefined`
**Fix**: Check JWT token structure matches (`id` vs `userId`)

**Issue**: `Socket authentication error`
**Fix**: Verify JWT_SECRET matches in backend `.env`

---

## ✅ Success Indicators

You'll know chat is working when:

1. **Debug Page Shows**:
   - ✅ Connected (green dot)
   - ✅ User information present
   - ✅ Chats count > 0 (after creating chat)
   - ✅ No errors

2. **Chat Page Shows**:
   - ✅ "Messages" in navbar
   - ✅ Green "Connected" indicator
   - ✅ Chat list (after creating)
   - ✅ Message input box
   - ✅ Messages appear instantly

3. **Browser Console Shows**:
   - ✅ "Socket connected"
   - ✅ No red errors
   - ✅ Socket events logging

4. **Backend Console Shows**:
   - ✅ "User connected: [userId]"
   - ✅ "WebSocket server initialized"
   - ✅ No errors

---

## 🎉 Next Steps After Fix

Once chat is working:

1. **Test all features**:
   - Send messages
   - Add reactions
   - Delete messages
   - Check read receipts
   - Test typing indicators

2. **Test edge cases**:
   - Disconnect/reconnect
   - Multiple tabs
   - Slow network
   - Large messages

3. **Customize**:
   - Adjust colors in CSS
   - Add more emoji reactions
   - Customize notifications

---

**Remember**: The debug page (`/chat-debug`) is your best friend for troubleshooting!

Visit it first whenever you have issues.
