import DeviceInfo from 'react-native-device-info';
import NetInfo from '@react-native-community/netinfo';
import { saveEvent } from './OfflineQueue';

interface DeviceInfo {
  deviceId: string;
  systemName: string;
  systemVersion: string;
  appVersion: string;
  uniqueId: string;
  brand: string;
  model: string;
  carrier?: string;
  isEmulator: boolean;
  hasNotch: boolean;
  screenWidth: number;
  screenHeight: number;
  timezone: string;
  locale: string;
  batteryLevel?: number;
  isCharging?: boolean;
  totalMemory?: number;
  usedMemory?: number;
  freeDiskStorage?: number;
  totalDiskCapacity?: number;
}

interface SessionInfo {
  sessionId: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  networkType?: string;
  isConnected: boolean;
  appState: string;
  userId?: string;
  customAttributes?: Record<string, any>;
}

class DeviceSessionManager {
  private sessionId: string;
  private sessionStartTime: number;
  private deviceInfo?: DeviceInfo;
  private currentSession?: SessionInfo;

  constructor() {
    this.sessionId = this.generateSessionId();
    this.sessionStartTime = Date.now();
  }

  async initialize() {
    this.deviceInfo = await this.collectDeviceInfo();
    this.currentSession = this.createSession();

    // Save initial session data
    await this.saveSessionData();

    // Monitor network changes
    this.monitorNetworkChanges();

    // Monitor app state changes
    this.monitorAppStateChanges();
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async collectDeviceInfo(): Promise<DeviceInfo> {
    try {
      const [
        deviceId,
        systemName,
        systemVersion,
        appVersion,
        uniqueId,
        brand,
        model,
        carrier,
        isEmulator,
        hasNotch,
        batteryLevel,
        isCharging,
        totalMemory,
        usedMemory,
        freeDiskStorage,
        totalDiskCapacity,
      ] = await Promise.all([
        DeviceInfo.getDeviceId(),
        DeviceInfo.getSystemName(),
        DeviceInfo.getSystemVersion(),
        DeviceInfo.getVersion(),
        DeviceInfo.getUniqueId(),
        DeviceInfo.getBrand(),
        DeviceInfo.getModel(),
        DeviceInfo.getCarrier().catch(() => undefined),
        DeviceInfo.isEmulator(),
        DeviceInfo.hasNotch(),
        DeviceInfo.getBatteryLevel().catch(() => undefined),
        DeviceInfo.isBatteryCharging().catch(() => undefined),
        DeviceInfo.getTotalMemory().catch(() => undefined),
        DeviceInfo.getUsedMemory().catch(() => undefined),
        DeviceInfo.getFreeDiskStorage().catch(() => undefined),
        DeviceInfo.getTotalDiskCapacity().catch(() => undefined),
      ]);

      return {
        deviceId,
        systemName,
        systemVersion,
        appVersion,
        uniqueId,
        brand,
        model,
        carrier,
        isEmulator,
        hasNotch,
        screenWidth: 0, // DeviceInfo.getScreenWidth() not available
        screenHeight: 0, // DeviceInfo.getScreenHeight() not available
        timezone: 'UTC', // DeviceInfo.getTimezone() not available
        locale: 'en-US', // DeviceInfo.getDeviceLocale() not available
        batteryLevel,
        isCharging,
        totalMemory,
        usedMemory,
        freeDiskStorage,
        totalDiskCapacity,
      };
    } catch (error) {
      console.error('Failed to collect device info:', error);
      throw error;
    }
  }

  private createSession(): SessionInfo {
    return {
      sessionId: this.sessionId,
      startTime: this.sessionStartTime,
      networkType: 'unknown', // Will be updated by network monitoring
      isConnected: false, // Will be updated by network monitoring
      appState: 'active',
    };
  }

  private async saveSessionData() {
    if (!this.currentSession || !this.deviceInfo) return;

    try {
      await saveEvent({
        type: 'session',
        data: {
          ...this.currentSession,
          deviceInfo: this.deviceInfo,
        },
      });
    } catch (error) {
      console.error('Failed to save session data:', error);
    }
  }

  private monitorNetworkChanges() {
    NetInfo.addEventListener((state) => {
      if (this.currentSession) {
        this.currentSession.networkType = state.type;
        this.currentSession.isConnected = state.isConnected ?? false;
        this.saveSessionData();
      }
    });
  }

  private monitorAppStateChanges() {
    // This would typically use AppState from React Native
    // For now, it's a placeholder
  }

  async endSession() {
    if (this.currentSession) {
      this.currentSession.endTime = Date.now();
      this.currentSession.duration =
        this.currentSession.endTime - this.currentSession.startTime;
      await this.saveSessionData();
    }
  }

  getDeviceInfo(): DeviceInfo | undefined {
    return this.deviceInfo;
  }

  getCurrentSession(): SessionInfo | undefined {
    return this.currentSession;
  }

  getSessionId(): string {
    return this.sessionId;
  }

  updateCustomAttributes(attributes: Record<string, any>) {
    if (this.currentSession) {
      this.currentSession.customAttributes = {
        ...this.currentSession.customAttributes,
        ...attributes,
      };
      this.saveSessionData();
    }
  }
}

export const deviceSessionManager = new DeviceSessionManager();
export type { DeviceInfo, SessionInfo };
