# ✅ Chat Feature Testing Checklist

Use this checklist to verify all chat features are working correctly.

---

## 🚀 Before Testing

### Setup
- [ ] Backend server running (`npm run dev`)
- [ ] Frontend server running (same command)
- [ ] At least 2 user accounts created
- [ ] Logged in as User 1

---

## 🧪 Basic Features Test

### Starting a Chat
- [ ] Click "Messages" in navbar
- [ ] See chat page load
- [ ] See green "Connected" indicator
- [ ] Click "+ New Chat" button
- [ ] Modal opens
- [ ] Search bar appears
- [ ] Type user name/email
- [ ] See search results (debounced 300ms)
- [ ] Click on user
- [ ] Chat created successfully
- [ ] Chat appears in list

### Sending Messages
- [ ] Type a message
- [ ] Message input grows as you type
- [ ] Press Enter to send
- [ ] Message appears in chat
- [ ] Message saved (refresh page to verify)
- [ ] Timestamp shows correctly
- [ ] Your message on right (blue bubble)

### Receiving Messages
- [ ] Open second browser (or incognito)
- [ ] Login as User 2
- [ ] Go to Messages
- [ ] Chat from User 1 appears in list
- [ ] Open the chat
- [ ] User 1: Send a message
- [ ] User 2: See message appear instantly (no refresh!)
- [ ] Message on left (gray bubble)
- [ ] Avatar shows
- [ ] Sender name shows

---

## 😊 Emoji Features Test

### Emoji Picker
- [ ] Click 😊 button
- [ ] Emoji picker opens
- [ ] See 6 categories
- [ ] Click "Smileys" tab
- [ ] Click "Hearts" tab
- [ ] Click "Food" tab
- [ ] All tabs work
- [ ] Click an emoji
- [ ] Emoji inserted in input
- [ ] Picker closes
- [ ] Send message with emoji
- [ ] Emoji displays correctly

### Quick Reactions
- [ ] Hover over any message
- [ ] See quick reaction buttons (👍 ❤️ 😂 😮 🎉)
- [ ] Click 👍
- [ ] Reaction appears below message
- [ ] Click 👍 again
- [ ] Reaction removed
- [ ] Try other emojis
- [ ] All work correctly

---

## 🔔 Notification Features Test

### Sound Notifications
- [ ] User 2: Send message to User 1
- [ ] User 1: Hear sound notification
- [ ] Click ⚙️ settings button
- [ ] Toggle sound OFF
- [ ] User 2: Send another message
- [ ] User 1: No sound plays
- [ ] Toggle sound ON
- [ ] User 2: Send message
- [ ] User 1: Sound plays

### Browser Notifications
- [ ] Click ⚙️ settings
- [ ] Toggle browser notifications ON
- [ ] Allow permission if prompted
- [ ] Minimize browser or switch tab
- [ ] User 2: Send message
- [ ] User 1: See desktop notification
- [ ] Notification shows sender name
- [ ] Notification shows message preview
- [ ] Notification auto-closes after 5s

### Visual Notifications
- [ ] User 2: Send 3 messages
- [ ] User 1: See unread count in chat list (blue badge)
- [ ] Badge shows "3"
- [ ] Open chat
- [ ] Badge disappears (messages marked as read)
- [ ] Close chat
- [ ] User 2: Send another message
- [ ] Badge shows "1"

---

## 👥 Presence Features Test

### Online Status
- [ ] User 1: See green dot next to User 2
- [ ] Close User 2's browser
- [ ] Wait 3 seconds
- [ ] Green dot disappears on User 1's screen
- [ ] Open User 2's browser again
- [ ] Green dot reappears

### Typing Indicators
- [ ] User 2: Start typing (don't send)
- [ ] User 1: See "typing..." indicator
- [ ] Indicator animates (pulsing)
- [ ] User 2: Stop typing
- [ ] Wait 1 second
- [ ] Indicator disappears
- [ ] User 2: Resume typing
- [ ] Indicator reappears

### Read Receipts
- [ ] User 1: Send message
- [ ] See single check ✓ (sent)
- [ ] User 2: Open chat
- [ ] User 1: See double check ✓✓ (read)
- [ ] User 1: Send another message
- [ ] User 2: Already in chat
- [ ] User 1: Immediately see ✓✓

---

## 🔍 Search Features Test

### Message Search
- [ ] Send 10+ messages
- [ ] Click 🔍 search button
- [ ] Search bar appears
- [ ] Type search query
- [ ] See filtered messages
- [ ] Count shows (e.g., "Found 3 messages")
- [ ] Clear search
- [ ] All messages reappear

---

## 📱 Mobile Test

### Mobile View
- [ ] Open DevTools (F12)
- [ ] Toggle device toolbar (mobile view)
- [ ] Select iPhone/Android
- [ ] Chat list shows full width
- [ ] Tap on a chat
- [ ] Chat window shows full width
- [ ] Tap back button (◀️)
- [ ] Return to chat list
- [ ] All buttons touch-friendly
- [ ] Keyboard doesn't hide content

---

## 🎨 UI Features Test

### Message Actions
- [ ] Hover over your own message
- [ ] See quick actions appear
- [ ] See 5 reaction emojis
- [ ] See copy button (📋)
- [ ] See delete button (🗑️)
- [ ] Click copy button
- [ ] Toast shows "Message copied"
- [ ] Paste somewhere to verify
- [ ] Click delete button
- [ ] Confirm deletion
- [ ] Message shows "This message was deleted"

### Date Separators
- [ ] Check messages from today
- [ ] See "Today" separator
- [ ] Check old messages
- [ ] See "Yesterday" or date separators
- [ ] Dates shown correctly

### Auto-Scroll
- [ ] Have 30+ messages
- [ ] Scroll up to old messages
- [ ] See "Scroll to bottom" button (⬇️)
- [ ] Click button
- [ ] Scrolls to latest message smoothly
- [ ] Receive new message
- [ ] Auto-scrolls to new message

### Message Input
- [ ] Type short message
- [ ] Input is 1 line
- [ ] Type long message (multiple lines)
- [ ] Input grows
- [ ] Input stops at max height
- [ ] Scrollbar appears in input
- [ ] Send message
- [ ] Input resets to 1 line

---

## ⚙️ Settings Test

### Chat Settings
- [ ] Click ⚙️ button
- [ ] Settings modal opens
- [ ] See chat name
- [ ] See sound toggle
- [ ] See notification toggle
- [ ] See "Clear chat history"
- [ ] Toggle sound ON/OFF
- [ ] Toggle works
- [ ] Setting persists
- [ ] Click "Done"
- [ ] Modal closes

---

## 🐛 Debug Tools Test

### Debug Page
- [ ] Navigate to `/chat-debug`
- [ ] See connection status (green ✅)
- [ ] See user information
- [ ] See chat count
- [ ] See message count
- [ ] Click "Refresh Chats"
- [ ] Data updates
- [ ] Click "Reconnect Socket"
- [ ] Socket reconnects
- [ ] Click "Log to Console"
- [ ] Check browser console
- [ ] See debug data

---

## 🎭 Theme Test

### Dark Theme
- [ ] All features work in dark theme
- [ ] Text readable
- [ ] Colors look good
- [ ] Glassmorphism works

### Light Theme
- [ ] Go to Settings → Appearance
- [ ] Switch to light theme
- [ ] Go to Messages
- [ ] All features work
- [ ] Text readable
- [ ] Colors adapted correctly

---

## ⚡ Performance Test

### Speed
- [ ] Send 100 messages quickly
- [ ] UI remains responsive
- [ ] No lag
- [ ] Smooth scrolling
- [ ] Fast search
- [ ] Quick emoji picker

### Reconnection
- [ ] Disconnect internet
- [ ] See "Disconnected" status (red ❌)
- [ ] Reconnect internet
- [ ] Wait 2 seconds
- [ ] See "Connected" (green ✅)
- [ ] Send message
- [ ] Works normally

---

## 🏆 Final Verification

### All Features Working
- [ ] Real-time messaging ✅
- [ ] Emoji picker ✅
- [ ] Quick reactions ✅
- [ ] Sound notifications ✅
- [ ] Browser notifications ✅
- [ ] Online status ✅
- [ ] Typing indicators ✅
- [ ] Read receipts ✅
- [ ] Message search ✅
- [ ] Copy messages ✅
- [ ] Delete messages ✅
- [ ] Settings panel ✅
- [ ] Mobile responsive ✅
- [ ] Theme support ✅
- [ ] Debug tools ✅

---

## 🎉 Test Complete!

If all checkboxes are ✅:

**🏆 Congratulations! Your chat system is working perfectly!**

### If Any Issues:
1. Check `/chat-debug` page
2. Check browser console (F12)
3. Check backend terminal
4. Read `CHAT_TROUBLESHOOTING.md`
5. Read `CHAT_QUICK_FIX.md`

---

**Status: [ ] All Tests Passed ✅**

**Date Tested: _______________**

**Tested By: _______________**

---

## 📊 Test Results

| Category | Status | Notes |
|----------|--------|-------|
| Basic Messaging | ⬜ | |
| Emojis | ⬜ | |
| Notifications | ⬜ | |
| Presence | ⬜ | |
| Search | ⬜ | |
| Mobile | ⬜ | |
| UI Features | ⬜ | |
| Settings | ⬜ | |
| Debug Tools | ⬜ | |
| Themes | ⬜ | |
| Performance | ⬜ | |

**Overall: ⬜ PASS / ⬜ FAIL**
