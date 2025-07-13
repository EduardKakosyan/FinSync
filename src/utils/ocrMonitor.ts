/**
 * OCR Processing Monitor for Ollama Integration
 * 
 * This utility provides real-time monitoring and troubleshooting for OCR operations
 * with enhanced logging and error handling for Ollama API responses.
 */

import { debugLogger } from './debugLogger';

export interface OCRMonitorEvent {
  timestamp: number;
  type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  data?: any;
}

export interface OCRProcessingStatus {
  stage: 'initializing' | 'connecting' | 'sending' | 'processing' | 'receiving' | 'parsing' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  events: OCRMonitorEvent[];
  startTime: number;
  endTime?: number;
}

class OCRMonitor {
  private currentStatus: OCRProcessingStatus | null = null;
  private listeners: ((status: OCRProcessingStatus) => void)[] = [];

  /**
   * Start monitoring a new OCR process
   */
  startMonitoring(imageSize: number): void {
    this.currentStatus = {
      stage: 'initializing',
      progress: 0,
      message: `Starting OCR processing for ${Math.round(imageSize / 1024)}KB image`,
      events: [],
      startTime: Date.now()
    };

    this.addEvent('info', 'OCR processing started', { imageSize });
    this.notifyListeners();

    debugLogger.log('🔍 OCR Monitor: Processing started', { 
      imageSize: `${Math.round(imageSize / 1024)}KB`,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Update the current processing stage
   */
  updateStage(stage: OCRProcessingStatus['stage'], message: string, data?: any): void {
    if (!this.currentStatus) return;

    const progressMap = {
      'initializing': 10,
      'connecting': 20,
      'sending': 40,
      'processing': 60,
      'receiving': 80,
      'parsing': 90,
      'complete': 100,
      'error': this.currentStatus.progress
    };

    this.currentStatus.stage = stage;
    this.currentStatus.progress = progressMap[stage];
    this.currentStatus.message = message;

    const eventType = stage === 'error' ? 'error' : stage === 'complete' ? 'success' : 'info';
    this.addEvent(eventType, message, data);

    if (stage === 'complete' || stage === 'error') {
      this.currentStatus.endTime = Date.now();
      const duration = this.currentStatus.endTime - this.currentStatus.startTime;
      debugLogger.log(`🔍 OCR Monitor: Processing ${stage}`, { 
        duration: `${duration}ms`,
        totalEvents: this.currentStatus.events.length
      });
    }

    this.notifyListeners();
  }

  /**
   * Add a monitoring event
   */
  addEvent(type: OCRMonitorEvent['type'], message: string, data?: any): void {
    if (!this.currentStatus) return;

    const event: OCRMonitorEvent = {
      timestamp: Date.now(),
      type,
      message,
      data
    };

    this.currentStatus.events.push(event);

    // Log important events
    if (type === 'error' || type === 'warning') {
      debugLogger.error(`🔍 OCR Monitor: ${message}`, data);
    } else {
      debugLogger.log(`🔍 OCR Monitor: ${message}`, data);
    }
  }

  /**
   * Monitor Ollama API response format
   */
  validateOllamaResponse(response: any): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    // Check basic response structure
    if (!response) {
      issues.push('Response is null or undefined');
      return { isValid: false, issues };
    }

    // Check for Ollama-specific format
    if (!response.message && !response.choices) {
      issues.push('Response missing both Ollama (message) and OpenAI (choices) format');
    }

    // Validate Ollama format
    if (response.message) {
      if (!response.message.content) {
        issues.push('Ollama response missing message.content');
      } else if (typeof response.message.content !== 'string') {
        issues.push('Ollama message.content is not a string');
      }
    }

    // Validate OpenAI-compatible format
    if (response.choices) {
      if (!Array.isArray(response.choices) || response.choices.length === 0) {
        issues.push('OpenAI choices is not a valid array');
      } else if (!response.choices[0].message?.content) {
        issues.push('OpenAI choices[0].message.content missing');
      }
    }

    // Check for common Ollama error indicators
    if (response.error) {
      issues.push(`Ollama error: ${response.error}`);
    }

    if (response.detail) {
      issues.push(`Ollama detail: ${response.detail}`);
    }

    const isValid = issues.length === 0;
    
    this.addEvent(
      isValid ? 'success' : 'warning',
      `Response validation: ${isValid ? 'passed' : 'found issues'}`,
      { issues, responseKeys: Object.keys(response) }
    );

    return { isValid, issues };
  }

  /**
   * Validate JSON parsing from OCR response
   */
  validateJSONExtraction(content: string): { isValid: boolean; extractedJSON?: any; issues: string[] } {
    const issues: string[] = [];
    let extractedJSON: any = null;

    if (!content || typeof content !== 'string') {
      issues.push('Content is empty or not a string');
      return { isValid: false, issues };
    }

    // Try direct JSON parsing first
    try {
      extractedJSON = JSON.parse(content.trim());
      this.addEvent('success', 'Direct JSON parsing successful', { content: content.substring(0, 200) });
    } catch (directError) {
      // Try to extract JSON from response using regex
      const jsonMatches = content.match(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g);
      
      if (jsonMatches && jsonMatches.length > 0) {
        try {
          extractedJSON = JSON.parse(jsonMatches[0]);
          this.addEvent('info', 'JSON extracted using regex', { 
            originalContent: content.substring(0, 200),
            extractedJSON: jsonMatches[0]
          });
        } catch (regexError) {
          issues.push(`Regex extraction failed: ${regexError.message}`);
        }
      } else {
        issues.push('No JSON pattern found in response');
      }

      if (!extractedJSON) {
        issues.push(`Direct parsing failed: ${directError.message}`);
      }
    }

    // Validate expected OCR fields
    if (extractedJSON) {
      const expectedFields = ['amount', 'date', 'description', 'category', 'merchant'];
      const missingFields = expectedFields.filter(field => !(field in extractedJSON));
      
      if (missingFields.length > 0) {
        this.addEvent('warning', 'Some expected fields missing', { 
          missingFields,
          presentFields: Object.keys(extractedJSON)
        });
      }

      // Validate field types
      if (extractedJSON.amount !== null && typeof extractedJSON.amount !== 'number') {
        issues.push('Amount field is not a number');
      }
      
      if (extractedJSON.date !== null && typeof extractedJSON.date !== 'string') {
        issues.push('Date field is not a string');
      }
    }

    const isValid = issues.length === 0 && extractedJSON !== null;
    
    return { isValid, extractedJSON, issues };
  }

  /**
   * Monitor network request/response
   */
  logNetworkRequest(url: string, payload: any): void {
    this.addEvent('info', 'Sending request to Ollama', {
      url,
      model: payload.model,
      messageCount: payload.messages?.length,
      hasImage: payload.messages?.some((msg: any) => msg.images?.length > 0),
      payloadSize: JSON.stringify(payload).length
    });
  }

  logNetworkResponse(response: Response, responseTime: number): void {
    this.addEvent('info', 'Received response from Ollama', {
      status: response.status,
      statusText: response.statusText,
      responseTime: `${responseTime}ms`,
      contentType: response.headers.get('content-type'),
      contentLength: response.headers.get('content-length')
    });
  }

  /**
   * Get current monitoring status
   */
  getCurrentStatus(): OCRProcessingStatus | null {
    return this.currentStatus;
  }

  /**
   * Subscribe to status updates
   */
  subscribe(listener: (status: OCRProcessingStatus) => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.listeners.indexOf(listener);
      if (index > -1) {
        this.listeners.splice(index, 1);
      }
    };
  }

  /**
   * Generate troubleshooting report
   */
  generateTroubleshootingReport(): string {
    if (!this.currentStatus) return 'No OCR process to report on';

    const { events, startTime, endTime, stage } = this.currentStatus;
    const duration = endTime ? endTime - startTime : Date.now() - startTime;

    const errors = events.filter(e => e.type === 'error');
    const warnings = events.filter(e => e.type === 'warning');

    const report = [
      '🔍 OCR Processing Report',
      `Stage: ${stage}`,
      `Duration: ${duration}ms`,
      `Events: ${events.length} total (${errors.length} errors, ${warnings.length} warnings)`,
      '',
      '📊 Timeline:'
    ];

    events.forEach((event, index) => {
      const relativeTime = event.timestamp - startTime;
      const icon = event.type === 'error' ? '❌' : event.type === 'warning' ? '⚠️' : event.type === 'success' ? '✅' : 'ℹ️';
      report.push(`${index + 1}. [+${relativeTime}ms] ${icon} ${event.message}`);
      
      if (event.data && Object.keys(event.data).length > 0) {
        report.push(`   Data: ${JSON.stringify(event.data, null, 2).substring(0, 200)}`);
      }
    });

    if (errors.length > 0) {
      report.push('', '🚨 Errors Detected:');
      errors.forEach((error, index) => {
        report.push(`${index + 1}. ${error.message}`);
        if (error.data) {
          report.push(`   Details: ${JSON.stringify(error.data, null, 2)}`);
        }
      });
    }

    if (warnings.length > 0) {
      report.push('', '⚠️ Warnings:');
      warnings.forEach((warning, index) => {
        report.push(`${index + 1}. ${warning.message}`);
      });
    }

    return report.join('\n');
  }

  /**
   * Reset monitor for new process
   */
  reset(): void {
    this.currentStatus = null;
    debugLogger.log('🔍 OCR Monitor: Reset for new process');
  }

  private notifyListeners(): void {
    if (!this.currentStatus) return;
    
    this.listeners.forEach(listener => {
      try {
        listener(this.currentStatus!);
      } catch (error) {
        debugLogger.error('OCR Monitor listener error', error);
      }
    });
  }
}

// Export singleton instance
export const ocrMonitor = new OCRMonitor();

// Export common error patterns and solutions
export const OLLAMA_TROUBLESHOOTING = {
  connectionErrors: {
    'Failed to fetch': {
      issue: 'Network connection failed',
      solutions: [
        'Check if Ollama is running on your laptop',
        'Verify the IP address is correct (currently: 192.168.4.48)',
        'Ensure both devices are on the same WiFi network',
        'Check firewall settings on your laptop'
      ]
    },
    'ECONNREFUSED': {
      issue: 'Connection refused by server',
      solutions: [
        'Start Ollama with: OLLAMA_HOST=0.0.0.0:11434 ollama serve',
        'Check if port 11434 is open',
        'Verify Ollama is listening on 0.0.0.0, not just localhost'
      ]
    }
  },
  
  responseErrors: {
    'model not found': {
      issue: 'OCR model is not available',
      solutions: [
        'Install the model: ollama pull benhaotang/Nanonets-OCR-s',
        'Verify model name matches: benhaotang/Nanonets-OCR-s:latest',
        'Check available models: ollama list'
      ]
    },
    'invalid JSON': {
      issue: 'Model response is not valid JSON',
      solutions: [
        'The model might be hallucinating or not following instructions',
        'Try with a clearer receipt image',
        'Check if the model is properly loaded'
      ]
    }
  },

  performanceIssues: {
    'slow response': {
      issue: 'Processing taking too long',
      solutions: [
        'Large images take longer to process',
        'Check laptop CPU usage',
        'Consider using a smaller image resolution',
        'Ensure laptop is not thermal throttling'
      ]
    }
  }
};