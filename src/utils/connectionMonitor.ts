import { enableNetwork, disableNetwork } from 'firebase/firestore';
import { AppState, AppStateStatus } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

interface ConnectionState {
  isOnline: boolean;
  isFirestoreConnected: boolean;
  lastError?: string;
}

class ConnectionMonitor {
  private db: any;
  private listeners: ((state: ConnectionState) => void)[] = [];
  private state: ConnectionState = {
    isOnline: true,
    isFirestoreConnected: true,
  };
  private reconnectTimer?: NodeJS.Timeout;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private baseReconnectDelay = 1000;

  initialize(db: any) {
    this.db = db;
    this.setupNetworkListener();
    this.setupAppStateListener();
  }

  private setupNetworkListener() {
    // Monitor network connectivity
    NetInfo.addEventListener((state) => {
      const wasOnline = this.state.isOnline;
      this.state.isOnline = state.isConnected ?? false;

      if (!wasOnline && this.state.isOnline) {
        console.log('📶 Network connection restored');
        this.attemptReconnect();
      } else if (wasOnline && !this.state.isOnline) {
        console.log('📵 Network connection lost');
        this.state.isFirestoreConnected = false;
        this.notifyListeners();
      }
    });
  }

  private setupAppStateListener() {
    // Handle app foreground/background transitions
    AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('🔄 App returned to foreground, checking connection...');
        this.checkAndReconnect();
      }
    });
  }

  private async checkAndReconnect() {
    if (!this.db || !this.state.isOnline) return;

    try {
      // Test the connection by enabling network
      await enableNetwork(this.db);
      this.state.isFirestoreConnected = true;
      this.reconnectAttempts = 0;
      this.state.lastError = undefined;
      console.log('✅ Firestore connection verified');
      this.notifyListeners();
    } catch (error) {
      console.log('⚠️ Firestore connection check failed:', error);
      
      // Handle WebChannel RPC errors specifically
      if (error.message?.includes('WebChannelConnection') || error.message?.includes('RPC')) {
        this.state.lastError = 'WebChannel connection error - retrying...';
        console.log('🔄 WebChannel error detected, implementing graceful fallback');
      } else {
        this.state.lastError = error.message || 'Connection check failed';
      }
      
      this.state.isFirestoreConnected = false;
      this.notifyListeners();
      this.attemptReconnect();
    }
  }

  private async attemptReconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }

    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('❌ Max reconnection attempts reached');
      this.state.lastError = 'Unable to reconnect after multiple attempts';
      this.notifyListeners();
      return;
    }

    const delay = this.baseReconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`🔄 Attempting reconnect in ${delay}ms (attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);

    this.reconnectTimer = setTimeout(async () => {
      this.reconnectAttempts++;

      try {
        // Cycle the network connection to force reconnect
        await disableNetwork(this.db);
        await new Promise(resolve => setTimeout(resolve, 500));
        await enableNetwork(this.db);
        
        this.state.isFirestoreConnected = true;
        this.state.lastError = undefined;
        this.reconnectAttempts = 0;
        console.log('✅ Firestore reconnected successfully');
        this.notifyListeners();
      } catch (error) {
        console.log('❌ Reconnection attempt failed:', error);
        this.state.isFirestoreConnected = false;
        this.state.lastError = 'Reconnection failed';
        this.notifyListeners();
        
        // Try again if we haven't exceeded max attempts
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        }
      }
    }, delay);
  }

  subscribe(listener: (state: ConnectionState) => void) {
    this.listeners.push(listener);
    // Immediately notify the new listener of current state
    listener(this.state);
    
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener({ ...this.state }));
  }

  getState(): ConnectionState {
    return { ...this.state };
  }

  resetReconnectAttempts() {
    this.reconnectAttempts = 0;
  }

  cleanup() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.listeners = [];
  }

  // Helper method to check if we should retry operations
  shouldRetry(error: any): boolean {
    // Always retry WebChannel RPC errors
    if (error.message?.includes('WebChannelConnection') || error.message?.includes('RPC')) {
      return true;
    }
    
    // Retry network-related errors
    if (error.code === 'unavailable' || error.message?.includes('transport')) {
      return true;
    }
    
    return false;
  }

  // Force reconnection for WebChannel errors
  async forceReconnect(): Promise<void> {
    if (!this.db) return;
    
    try {
      console.log('🔄 Forcing Firestore reconnection...');
      await disableNetwork(this.db);
      await new Promise(resolve => setTimeout(resolve, 1000));
      await enableNetwork(this.db);
      
      this.state.isFirestoreConnected = true;
      this.state.lastError = undefined;
      this.reconnectAttempts = 0;
      console.log('✅ Forced reconnection successful');
      this.notifyListeners();
    } catch (error) {
      console.error('❌ Forced reconnection failed:', error);
      this.state.isFirestoreConnected = false;
      this.state.lastError = 'Force reconnection failed';
      this.notifyListeners();
      throw error;
    }
  }
}

export const connectionMonitor = new ConnectionMonitor();