import { saveEvent } from './OfflineQueue';

interface CrashData {
  timestamp: number;
  stackTrace: string;
  isFatal: boolean;
  deviceInfo?: any;
  sessionId?: string;
}

export const initCrashReporter = () => {
  const defaultHandler = ErrorUtils.getGlobalHandler();

  ErrorUtils.setGlobalHandler((error, isFatal) => {
    const crashData: CrashData = {
      timestamp: Date.now(),
      stackTrace: error.stack || error.toString(),
      isFatal: isFatal ?? false,
    };

    saveCrash(crashData);
    defaultHandler(error, isFatal);
  });
};

export const saveCrash = async (crashData: CrashData) => {
  try {
    await saveEvent({
      type: 'crash',
      data: crashData,
    });
    console.log('Crash captured and queued:', crashData);
  } catch (error) {
    console.error('Failed to save crash data:', error);
  }
};
