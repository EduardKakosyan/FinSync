# 🌐 LM Studio Network Configuration Guide

## 🔍 Problem Identified

Your LM Studio is currently running but only accessible on `localhost` (127.0.0.1). This means:
- ✅ LM Studio is working on your laptop
- ❌ Your iPhone can't connect over WiFi

## 📋 Step-by-Step Fix

### 1. Configure LM Studio for Network Access

**Current Issue:** LM Studio is binding to `localhost:1234` instead of `0.0.0.0:1234`

**Fix Steps:**
1. **Open LM Studio** on your laptop
2. **Stop the current server** if it's running
3. Go to **"Local Server"** tab
4. **CRITICAL**: Change **"Server Address"** from:
   - ❌ `localhost` or `127.0.0.1`
   - ✅ `0.0.0.0` (this allows network access)
5. Keep **"Port"** as `1234`
6. **Restart the server**

### 2. Verify Network Binding

After restarting LM Studio with `0.0.0.0`, you should see:
```bash
# This command should show LM Studio listening on 0.0.0.0:1234
lsof -i :1234
```

Expected output:
```
COMMAND   PID  USER   FD   TYPE  DEVICE  SIZE/OFF  NODE  NAME
LM Studio 1234 user   10u  IPv4  0x...   0t0       TCP   *:1234 (LISTEN)
```

### 3. Test Network Access

**From your laptop:**
```bash
# Should work (localhost)
curl -I http://localhost:1234/v1/models

# Should also work (your IP)
curl -I http://192.168.4.48:1234/v1/models
```

**From your iPhone browser:**
- Navigate to: `http://192.168.4.48:1234/v1/models`
- You should see a JSON response with available models

### 4. Firewall Configuration

**macOS (Your System):**
1. **System Preferences** → **Security & Privacy** → **Firewall**
2. Click **"Firewall Options"**
3. **Add LM Studio** to allowed apps OR
4. **Temporarily disable firewall** for testing

**Test Command:**
```bash
# Temporarily disable macOS firewall
sudo pfctl -d

# Re-enable after testing
sudo pfctl -e
```

### 5. Verify iPhone Connection

Once LM Studio is configured correctly:

1. **Open FinSync app** on iPhone
2. **Go to "Add Transaction"**
3. **Tap "Scan Receipt"** → **⚙️ Settings**
4. **Tap "Test Connection"**
5. Should show: ✅ **"Connected to OCR service at: http://192.168.4.48:1234"**

## 🔧 Troubleshooting Commands

**Check if LM Studio is running:**
```bash
lsof -i :1234
ps aux | grep -i "lm studio"
```

**Test network connectivity:**
```bash
# From laptop
curl -v http://192.168.4.48:1234/v1/models

# Check your current IP
ifconfig | grep "inet " | grep -v 127.0.0.1
```

**Check firewall status:**
```bash
# macOS firewall status
sudo pfctl -sr | grep -i block
```

## 🎯 Expected Results

**Before Fix:**
- LM Studio: `localhost:1234` ❌
- iPhone: Cannot connect ❌

**After Fix:**
- LM Studio: `0.0.0.0:1234` ✅
- iPhone: Connected via `192.168.4.48:1234` ✅

## 📱 App Behavior

Once fixed, your FinSync app will:
1. **Auto-detect** the LM Studio endpoint
2. **Show green status** in OCR settings
3. **Process receipts** wirelessly from iPhone to laptop
4. **Extract transaction data** using local AI

## 🚨 Security Note

Setting LM Studio to `0.0.0.0:1234` makes it accessible to any device on your WiFi network. This is safe for home networks but be cautious on public WiFi.

For additional security, you can:
- Use your laptop's specific IP (`192.168.4.48`) instead of `0.0.0.0`
- Set up a firewall rule to only allow your iPhone's IP
- Use LM Studio's authentication features if available