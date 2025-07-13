/**
 * OCR Configuration for Network Access
 * 
 * This configuration supports both local (localhost) and network (WiFi) access
 * to LM Studio running nanonets-ocr model.
 */

export interface NetworkOCRConfig {
  // Primary laptop IP (update this with your laptop's IP)
  laptopIP: string;
  
  // LM Studio port (default is 1234)
  port: number;
  
  // Fallback endpoints to try
  fallbackEndpoints: string[];
  
  // Connection timeout
  timeout: number;
  
  // Auto-detection settings
  autoDetect: boolean;
  networkRange: string;
}

// Default configuration for Ollama setup
export const DEFAULT_NETWORK_CONFIG: NetworkOCRConfig = {
  // Your laptop's current IP - update this if it changes
  laptopIP: '192.168.4.48',
  
  port: 11434, // Ollama default port
  
  // Multiple endpoints to try (laptop IP, localhost for development, common router IPs)
  fallbackEndpoints: [
    'http://192.168.4.48:11434',  // Your current laptop IP with Ollama port
    'http://localhost:11434',      // Local development
    'http://127.0.0.1:11434',     // Local fallback
    'http://192.168.1.1:11434',   // Common router IP range
    'http://192.168.0.1:11434',   // Another common range
    'http://10.0.0.1:11434'       // Another common range
  ],
  
  timeout: 10000, // 10 seconds timeout
  autoDetect: true,
  networkRange: '192.168.4' // Your network range
};

/**
 * Generate endpoint URLs for the current network configuration
 */
export const generateEndpoints = (config: NetworkOCRConfig): string[] => {
  const endpoints: string[] = [];
  
  // Primary laptop endpoint
  endpoints.push(`http://${config.laptopIP}:${config.port}`);
  
  // Add fallback endpoints
  endpoints.push(...config.fallbackEndpoints);
  
  // Remove duplicates
  return [...new Set(endpoints)];
};

/**
 * Auto-detect available OCR endpoints on the network
 */
export const detectAvailableEndpoints = async (config: NetworkOCRConfig): Promise<string[]> => {
  const endpoints = generateEndpoints(config);
  const availableEndpoints: string[] = [];
  
  console.log('🔍 Detecting available OCR endpoints...');
  
  // Test each endpoint
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing: ${endpoint}`);
      
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3 second timeout per endpoint
      
      // Try Ollama API first
      let response = await fetch(`${endpoint}/api/tags`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });
      
      let isOllama = false;
      let hasOCRModel = false;
      
      if (response.ok) {
        isOllama = true;
        const models = await response.json();
        hasOCRModel = models.models?.some((model: any) => 
          model.name?.toLowerCase().includes('ocr') || 
          model.name?.toLowerCase().includes('nanonets')
        );
      } else {
        // Try LM Studio/OpenAI-compatible API
        response = await fetch(`${endpoint}/v1/models`, {
          method: 'GET',
          headers: {
            'Authorization': 'Bearer lm-studio',
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });
        
        if (response.ok) {
          const models = await response.json();
          hasOCRModel = models.data?.some((model: any) => 
            model.id?.toLowerCase().includes('ocr') || 
            model.id?.toLowerCase().includes('nanonets')
          );
        }
      }
      
      clearTimeout(timeoutId);
      
      if (hasOCRModel) {
        console.log(`✅ Found OCR model at: ${endpoint} (${isOllama ? 'Ollama' : 'LM Studio'})`);
        availableEndpoints.push(endpoint);
      } else if (response.ok) {
        console.log(`⚠️ No OCR model found at: ${endpoint} (${isOllama ? 'Ollama' : 'LM Studio'})`);
      }
    } catch (error) {
      console.log(`❌ Failed to connect to: ${endpoint}`);
      // Continue to next endpoint
    }
  }
  
  console.log(`🎯 Discovered ${availableEndpoints.length} available OCR endpoints`);
  return availableEndpoints;
};

/**
 * Get the best available OCR endpoint
 */
export const getBestOCREndpoint = async (config: NetworkOCRConfig): Promise<string | null> => {
  const availableEndpoints = await detectAvailableEndpoints(config);
  
  if (availableEndpoints.length === 0) {
    console.error('❌ No OCR endpoints available');
    return null;
  }
  
  // Return the first available endpoint (usually the primary laptop IP)
  const bestEndpoint = availableEndpoints[0];
  console.log(`🚀 Using OCR endpoint: ${bestEndpoint}`);
  return bestEndpoint;
};

/**
 * Network setup instructions for LM Studio
 */
export const NETWORK_SETUP_INSTRUCTIONS = {
  ollama: {
    title: "Ollama Network Setup",
    steps: [
      "1. Install the nanonets OCR model: ollama pull benhaotang/Nanonets-OCR-s",
      "2. Set environment variable: export OLLAMA_HOST=0.0.0.0:11434",
      "3. Start Ollama: ollama serve",
      "4. Verify model is available: ollama list",
      "5. Test network access: curl http://your-ip:11434/api/tags",
      "6. Ensure your laptop firewall allows port 11434",
      "7. Your laptop and phone must be on the same WiFi network"
    ]
  },
  lmStudio: {
    title: "LM Studio Network Setup (Alternative)",
    steps: [
      "1. Open LM Studio on your laptop",
      "2. Load the 'nanonets/Nanonets-OCR-s' model",
      "3. Go to 'Local Server' tab",
      "4. Change 'Server Address' from 'localhost' to '0.0.0.0'",
      "5. Keep port as '1234' (or note if you change it)",
      "6. Click 'Start Server'",
      "7. Ensure your laptop firewall allows port 1234",
      "8. Your laptop and phone must be on the same WiFi network"
    ]
  },
  firewall: {
    title: "Firewall Configuration",
    macOS: [
      "1. System Preferences → Security & Privacy → Firewall",
      "2. Click 'Firewall Options'",
      "3. Add LM Studio app or allow port 1234",
      "4. Alternatively, temporarily disable firewall for testing"
    ],
    windows: [
      "1. Windows Security → Firewall & network protection",
      "2. Allow an app through firewall",
      "3. Add LM Studio or create rule for port 1234"
    ]
  },
  troubleshooting: {
    title: "Troubleshooting Tips",
    tips: [
      "• Ensure both devices are on the same WiFi network",
      "• Try disabling firewall temporarily to test",
      "• Check that LM Studio server is running on 0.0.0.0:1234",
      "• Use your laptop's browser to test: http://192.168.4.48:1234/v1/models",
      "• If IP changes, update the app configuration",
      "• For debugging, check laptop's current IP with: ifconfig (macOS) or ipconfig (Windows)"
    ]
  }
};