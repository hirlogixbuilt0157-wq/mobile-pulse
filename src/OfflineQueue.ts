import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

interface QueuedEvent {
  id: string;
  timestamp: number;
  type: 'crash' | 'performance' | 'network' | 'session' | 'custom';
  data: any;
  retryCount: number;
  maxRetries: number;
}

interface UploadConfig {
  serverUrl: string;
  apiKey?: string;
  batchSize: number;
  maxRetries: number;
  retryDelay: number;
}

class OfflineQueue {
  private config: UploadConfig;
  private uploadInterval?: NodeJS.Timeout;
  private isUploading = false;

  constructor(config: Partial<UploadConfig> = {}) {
    this.config = {
      serverUrl: 'https://your-server.com/upload',
      batchSize: 50,
      maxRetries: 3,
      retryDelay: 5000,
      ...config,
    };
  }

  async saveEvent(
    event: Omit<QueuedEvent, 'id' | 'timestamp' | 'retryCount' | 'maxRetries'>
  ) {
    try {
      const queuedEvent: QueuedEvent = {
        id: this.generateEventId(),
        timestamp: Date.now(),
        retryCount: 0,
        maxRetries: this.config.maxRetries,
        ...event,
      };

      const events = await this.getStoredEvents();
      events.push(queuedEvent);

      // Keep only last 1000 events to prevent storage bloat
      if (events.length > 1000) {
        events.splice(0, events.length - 1000);
      }

      await AsyncStorage.setItem('events', JSON.stringify(events));
      console.log('Event saved to offline queue:', queuedEvent.type);

      // Try to upload immediately if online
      this.tryUpload();
    } catch (error) {
      console.error('Failed to save event to offline queue:', error);
    }
  }

  async uploadEvents() {
    if (this.isUploading) return;

    this.isUploading = true;

    try {
      const events = await this.getStoredEvents();
      if (events.length === 0) return;

      const isConnected = await this.isOnline();
      if (!isConnected) {
        console.log('No internet connection, skipping upload');
        return;
      }

      // Process events in batches
      const batches = this.createBatches(events, this.config.batchSize);

      for (const batch of batches) {
        await this.uploadBatch(batch);
      }

      console.log(`Successfully uploaded ${events.length} events`);
    } catch (error) {
      console.error('Failed to upload events:', error);
    } finally {
      this.isUploading = false;
    }
  }

  private async uploadBatch(batch: QueuedEvent[]) {
    try {
      const response = await fetch(this.config.serverUrl, {
        method: 'POST',
        body: JSON.stringify({
          events: batch,
          timestamp: Date.now(),
        }),
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && {
            Authorization: `Bearer ${this.config.apiKey}`,
          }),
        },
      });

      if (!response.ok) {
        throw new Error(`Upload failed with status: ${response.status}`);
      }

      // Remove successfully uploaded events
      await this.removeUploadedEvents(batch);
    } catch (error) {
      console.error('Batch upload failed:', error);

      // Increment retry count for failed events
      await this.handleUploadFailure(batch);
    }
  }

  private async handleUploadFailure(batch: QueuedEvent[]) {
    const events = await this.getStoredEvents();

    for (const failedEvent of batch) {
      const eventIndex = events.findIndex((e) => e.id === failedEvent.id);
      if (eventIndex !== -1 && events[eventIndex]) {
        events[eventIndex].retryCount++;

        // Remove events that have exceeded max retries
        if (events[eventIndex].retryCount >= events[eventIndex].maxRetries) {
          events.splice(eventIndex, 1);
          console.log(
            `Event ${failedEvent.id} exceeded max retries, removing from queue`
          );
        }
      }
    }

    await AsyncStorage.setItem('events', JSON.stringify(events));
  }

  private async removeUploadedEvents(uploadedBatch: QueuedEvent[]) {
    const events = await this.getStoredEvents();
    const uploadedIds = new Set(uploadedBatch.map((e) => e.id));
    const remainingEvents = events.filter((e) => !uploadedIds.has(e.id));

    await AsyncStorage.setItem('events', JSON.stringify(remainingEvents));
  }

  private createBatches(
    events: QueuedEvent[],
    batchSize: number
  ): QueuedEvent[][] {
    const batches: QueuedEvent[][] = [];
    for (let i = 0; i < events.length; i += batchSize) {
      batches.push(events.slice(i, i + batchSize));
    }
    return batches;
  }

  private async getStoredEvents(): Promise<QueuedEvent[]> {
    try {
      const stored = await AsyncStorage.getItem('events');
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('Failed to get stored events:', error);
      return [];
    }
  }

  private async isOnline(): Promise<boolean> {
    try {
      const netInfo = await NetInfo.fetch();
      return netInfo.isConnected ?? false;
    } catch (error) {
      return false;
    }
  }

  private generateEventId(): string {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private async tryUpload() {
    // Debounce upload attempts
    if (this.uploadInterval) {
      clearTimeout(this.uploadInterval);
    }

    this.uploadInterval = setTimeout(() => {
      this.uploadEvents();
    }, 2000); // Wait 2 seconds before attempting upload
  }

  startAutoUpload(intervalMs: number = 30000) {
    setInterval(() => {
      this.uploadEvents();
    }, intervalMs);
  }

  async getQueueSize(): Promise<number> {
    const events = await this.getStoredEvents();
    return events.length;
  }

  async clearQueue() {
    await AsyncStorage.removeItem('events');
  }
}

// Create singleton instance
export const offlineQueue = new OfflineQueue();

// Export convenience functions for backward compatibility
export const saveEvent = (
  event: Omit<QueuedEvent, 'id' | 'timestamp' | 'retryCount' | 'maxRetries'>
) => offlineQueue.saveEvent(event);

export const uploadEvents = () => offlineQueue.uploadEvents();

export type { OfflineQueue, QueuedEvent, UploadConfig };
