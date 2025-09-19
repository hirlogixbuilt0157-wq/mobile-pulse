import { initCrashReporter } from './CrashReporter';
import { performanceMonitor } from './PerformanceMonitor';
import { networkTracker } from './NetworkTracker';
import { deviceSessionManager } from './DeviceSessionInfo';
import { offlineQueue, type UploadConfig } from './OfflineQueue';

interface SDKConfig {
  apiKey?: string;
  serverUrl?: string;
  enableCrashReporting?: boolean;
  enablePerformanceMonitoring?: boolean;
  enableNetworkTracking?: boolean;
  enableDeviceSessionTracking?: boolean;
  uploadInterval?: number;
  batchSize?: number;
  maxRetries?: number;
  debug?: boolean;
}

class MobilePulseSDK {
  private config: Required<SDKConfig>;
  private isInitialized = false;

  constructor(config: SDKConfig = {}) {
    this.config = {
      apiKey: '',
      serverUrl: 'https://your-server.com/upload',
      enableCrashReporting: true,
      enablePerformanceMonitoring: true,
      enableNetworkTracking: true,
      enableDeviceSessionTracking: true,
      uploadInterval: 30000, // 30 seconds
      batchSize: 50,
      maxRetries: 3,
      debug: false,
      ...config,
    };
  }

  async initialize() {
    if (this.isInitialized) {
      console.warn('MobilePulse SDK is already initialized');
      return;
    }

    try {
      this.log('Initializing MobilePulse SDK...');

      // Initialize device and session tracking first
      if (this.config.enableDeviceSessionTracking) {
        await deviceSessionManager.initialize();
        this.log('Device and session tracking initialized');
      }

      // Initialize crash reporting
      if (this.config.enableCrashReporting) {
        initCrashReporter();
        this.log('Crash reporting initialized');
      }

      // Initialize performance monitoring
      if (this.config.enablePerformanceMonitoring) {
        await performanceMonitor.startMonitoring();
        this.log('Performance monitoring initialized');
      }

      // Initialize network tracking
      if (this.config.enableNetworkTracking) {
        networkTracker.startTracking();
        this.log('Network tracking initialized');
      }

      // Configure offline queue
      this.configureOfflineQueue();

      // Start auto-upload
      offlineQueue.startAutoUpload(this.config.uploadInterval);

      this.isInitialized = true;
      this.log('MobilePulse SDK initialized successfully');

      // Send initialization event
      await this.trackEvent('sdk_initialized', {
        timestamp: Date.now(),
        config: {
          enableCrashReporting: this.config.enableCrashReporting,
          enablePerformanceMonitoring: this.config.enablePerformanceMonitoring,
          enableNetworkTracking: this.config.enableNetworkTracking,
          enableDeviceSessionTracking: this.config.enableDeviceSessionTracking,
        },
      });
    } catch (error) {
      console.error('Failed to initialize MobilePulse SDK:', error);
      throw error;
    }
  }

  private configureOfflineQueue() {
    const uploadConfig: Partial<UploadConfig> = {
      serverUrl: this.config.serverUrl,
      apiKey: this.config.apiKey,
      batchSize: this.config.batchSize,
      maxRetries: this.config.maxRetries,
    };

    // Recreate offline queue with new config
    Object.assign(
      offlineQueue,
      new (offlineQueue.constructor as any)(uploadConfig)
    );
  }

  async trackEvent(eventName: string, data: any = {}) {
    if (!this.isInitialized) {
      console.warn('MobilePulse SDK not initialized. Call initialize() first.');
      return;
    }

    try {
      await offlineQueue.saveEvent({
        type: 'custom',
        data: {
          eventName,
          timestamp: Date.now(),
          sessionId: deviceSessionManager.getSessionId(),
          ...data,
        },
      });

      this.log(`Custom event tracked: ${eventName}`);
    } catch (error) {
      console.error('Failed to track custom event:', error);
    }
  }

  async setUser(userId: string, attributes: Record<string, any> = {}) {
    if (!this.isInitialized) {
      console.warn('MobilePulse SDK not initialized. Call initialize() first.');
      return;
    }

    try {
      deviceSessionManager.updateCustomAttributes({
        userId,
        ...attributes,
      });

      await this.trackEvent('user_identified', {
        userId,
        attributes,
      });

      this.log(`User set: ${userId}`);
    } catch (error) {
      console.error('Failed to set user:', error);
    }
  }

  async uploadPendingEvents() {
    if (!this.isInitialized) {
      console.warn('MobilePulse SDK not initialized. Call initialize() first.');
      return;
    }

    try {
      await offlineQueue.uploadEvents();
      this.log('Pending events upload completed');
    } catch (error) {
      console.error('Failed to upload pending events:', error);
    }
  }

  async getQueueSize(): Promise<number> {
    return await offlineQueue.getQueueSize();
  }

  async clearQueue() {
    await offlineQueue.clearQueue();
    this.log('Event queue cleared');
  }

  // Getters for accessing monitoring data
  getPerformanceMetrics() {
    return performanceMonitor.getMetrics();
  }

  getNetworkStats() {
    return networkTracker.getNetworkStats();
  }

  getNetworkRequests() {
    return networkTracker.getRequests();
  }

  getDeviceInfo() {
    return deviceSessionManager.getDeviceInfo();
  }

  getCurrentSession() {
    return deviceSessionManager.getCurrentSession();
  }

  // Control methods
  startPerformanceMonitoring() {
    if (this.isInitialized) {
      performanceMonitor.startMonitoring();
    }
  }

  stopPerformanceMonitoring() {
    performanceMonitor.stopMonitoring();
  }

  startNetworkTracking() {
    if (this.isInitialized) {
      networkTracker.startTracking();
    }
  }

  stopNetworkTracking() {
    networkTracker.stopTracking();
  }

  async endSession() {
    if (this.isInitialized) {
      await deviceSessionManager.endSession();
      this.log('Session ended');
    }
  }

  private log(message: string) {
    if (this.config.debug) {
      console.log(`[MobilePulse] ${message}`);
    }
  }
}

// Create and export singleton instance
export const mobilePulse = new MobilePulseSDK();
export { MobilePulseSDK, type SDKConfig };
