# 🔧 Firebase Connection Troubleshooting Guide

## 🚨 Current Issue: WebChannelConnection Transport Errors

You're seeing Firebase Firestore connection warnings that typically indicate:

### Root Causes:
1. **Network connectivity issues**
2. **Firestore security rules blocking access**
3. **Development environment configuration**
4. **Firebase project billing/quota limits**

---

## 🛠️ Step-by-Step Fix:

### 1. **Check Firebase Project Status**
```bash
# Visit Firebase Console
https://console.firebase.google.com/project/finsync-v2
```
- ✅ Verify project is active
- ✅ Check billing status (Firestore requires Blaze plan for production)
- ✅ Verify Firestore database is created

### 2. **Update Firestore Security Rules**
In Firebase Console → Firestore → Rules:
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow all reads and writes for development
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```
⚠️ **Note**: This is for development only. Use proper auth rules in production.

### 3. **Check Network Configuration**
```bash
# Test Firebase connectivity
curl -I https://firestore.googleapis.com/
```

### 4. **Verify Project Configuration**
Check your `.env.local` file:
```
FIRESTORE_PROJECT_ID=finsync-v2
FIRESTORE_API_KEY=AIzaSyDFNvw_YWXaJXiwZu66-GACR-_JyDsVJgs
```

---

## 🚀 Quick Solutions:

### Solution A: Enable Offline Persistence
Already implemented in the updated Firebase service with:
- ✅ Automatic retry with exponential backoff
- ✅ Better error handling and logging
- ✅ Offline-first data persistence

### Solution B: Test with Emulator (Development)
```bash
# Install Firebase CLI if needed
npm install -g firebase-tools

# Start Firestore emulator
firebase emulators:start --only firestore
```

### Solution C: Network Troubleshooting
1. **Check internet connection**
2. **Disable VPN/proxy if active**
3. **Try different network (mobile hotspot)**
4. **Check firewall/corporate network restrictions**

---

## 📱 Testing Steps:

### 1. **Restart the App**
```bash
# Kill and restart Expo
npm start -- --clear
```

### 2. **Check Console Logs**
Look for these success messages:
```
✅ Firebase network enabled successfully
✅ Transaction added successfully: [transaction-id]
```

### 3. **Test Offline Mode**
- Disable internet
- Add transactions (should work offline)
- Re-enable internet (should sync automatically)

---

## 🆘 If Problems Persist:

### Check Firebase Console Logs:
1. Go to Firebase Console → Functions/Firestore
2. Check usage metrics and error logs
3. Verify your project hasn't exceeded quotas

### Billing Check:
- Firestore requires **Blaze (Pay-as-you-go)** plan for production
- Development usage should be free within limits

### Alternative: Use Local Storage Temporarily
If Firebase issues persist, we can implement local AsyncStorage as backup:
```typescript
// Fallback to local storage
import AsyncStorage from '@react-native-async-storage/async-storage';
```

---

## 💡 Expected Behavior:

**Normal Operation:**
- Transactions save instantly
- Real-time updates across views
- Offline support with automatic sync

**Warning Messages are Often Safe:**
- Firebase retries connections automatically
- Offline persistence keeps app functional
- Most "transport errors" are recoverable

---

## 🎯 Next Steps:

1. **Check your Firebase Console** for project status
2. **Update Firestore rules** to allow access
3. **Test the updated Firebase service** with better error handling
4. **Monitor console logs** for success messages

The updated Firebase service now includes robust error handling and retry logic that should resolve most connection issues automatically! 🚀