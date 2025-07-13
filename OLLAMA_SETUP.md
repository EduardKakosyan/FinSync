# 🚀 Ollama Network Configuration for iPhone OCR

## 🎯 Current Status
- ✅ Ollama is running on your laptop
- ✅ `benhaotang/Nanonets-OCR-s:latest` model is installed
- ❌ Ollama is only accessible on `localhost` (not network)

## 🔧 Quick Fix: Enable Network Access

### 1. Stop Current Ollama Instance
```bash
# Kill current ollama process
pkill ollama
```

### 2. Set Network Environment Variable
```bash
# Set Ollama to listen on all network interfaces
export OLLAMA_HOST=0.0.0.0:11434

# Make it permanent (add to ~/.zshrc or ~/.bashrc)
echo 'export OLLAMA_HOST=0.0.0.0:11434' >> ~/.zshrc
```

### 3. Start Ollama with Network Access
```bash
# Start Ollama server
ollama serve
```

### 4. Verify Network Access
```bash
# Should show Ollama listening on 0.0.0.0:11434
lsof -i :11434

# Test from laptop
curl http://192.168.4.48:11434/api/tags

# Should show your models including:
# "benhaotang/Nanonets-OCR-s:latest"
```

## 📱 Test iPhone Connection

Once Ollama is configured for network access:

1. **Open FinSync app** on iPhone
2. **Go to "Add Transaction"** → **"Scan Receipt"** → **⚙️ Settings**
3. **Tap "Test Connection"**
4. Should show: ✅ **"Connected to OCR service at: http://192.168.4.48:11434"**

## 🐛 Troubleshooting

### If Connection Still Fails:

**Check Firewall:**
```bash
# Temporarily disable macOS firewall for testing
sudo pfctl -d

# Test connection
curl http://192.168.4.48:11434/api/tags

# Re-enable firewall
sudo pfctl -e
```

**Verify Ollama Process:**
```bash
# Check if Ollama is running with network access
ps aux | grep ollama
lsof -i :11434
```

**Test from iPhone Browser:**
- Navigate to: `http://192.168.4.48:11434/api/tags`
- Should see JSON with your models

### Expected Success Output:

**lsof -i :11434:**
```
COMMAND   PID  USER   FD   TYPE  DEVICE  SIZE/OFF  NODE  NAME
ollama   1234  user    3u  IPv4  0x...    0t0     TCP   *:11434 (LISTEN)
```

**curl http://192.168.4.48:11434/api/tags:**
```json
{
  "models": [
    {
      "name": "benhaotang/Nanonets-OCR-s:latest",
      "model": "benhaotang/Nanonets-OCR-s:latest",
      "size": 4575357124,
      ...
    }
  ]
}
```

## 🎉 What Changes Were Made

The app has been updated to work with Ollama:

### ✅ **Updated Configurations:**
- **Default port**: `1234` → `11434` (Ollama default)
- **API endpoints**: LM Studio format → Ollama format
- **Model detection**: Both Ollama and LM Studio support
- **Authentication**: Removed API key requirement for Ollama

### ✅ **New Features:**
- **Dual compatibility**: Supports both Ollama and LM Studio
- **Auto-detection**: Tries Ollama API first, falls back to LM Studio
- **Better error handling**: Clear messages for each service type

### ✅ **API Changes:**
- **Ollama format**: `/api/chat` with `images` array
- **LM Studio format**: `/v1/chat/completions` with `image_url`
- **Response parsing**: Handles both response formats

## 🚀 Next Steps

1. **Configure Ollama** (set `OLLAMA_HOST=0.0.0.0:11434`)
2. **Restart Ollama** (`ollama serve`)
3. **Test connection** from iPhone app
4. **Scan your first receipt!** 📱📸

Your iPhone will now wirelessly send receipt images to Ollama running on your laptop for AI processing! 🎯