// Main SDK exports
export { MobilePulseSDK } from './MobilePulseSDK';
export type { SDKConfig } from './MobilePulseSDK';

// Individual module exports
export { initCrashReporter, saveCrash } from './CrashReporter';
export { performanceMonitor } from './PerformanceMonitor';
export type { PerformanceMetrics } from './PerformanceMonitor';
export { networkTracker } from './NetworkTracker';
export type { NetworkRequest, NetworkStats } from './NetworkTracker';
export { deviceSessionManager } from './DeviceSessionInfo';
export type { DeviceInfo, SessionInfo } from './DeviceSessionInfo';
export { offlineQueue, saveEvent, uploadEvents } from './OfflineQueue';
export type { OfflineQueue, QueuedEvent, UploadConfig } from './OfflineQueue';

// Native module exports (for backward compatibility)
import MobilePulse from './NativeMobilePulse';

export function multiply(a: number, b: number): number {
  return MobilePulse.multiply(a, b);
}

// Default export for easy importing
export { mobilePulse as default } from './MobilePulseSDK';
