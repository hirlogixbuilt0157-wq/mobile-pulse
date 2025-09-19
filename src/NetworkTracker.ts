// Using global fetch instead of importing from react-native
import { saveEvent } from './OfflineQueue';

interface NetworkRequest {
  timestamp: number;
  url: string;
  method: string;
  duration: number;
  statusCode?: number;
  isError: boolean;
  errorMessage?: string;
  requestSize?: number;
  responseSize?: number;
  sessionId?: string;
}

interface NetworkStats {
  totalRequests: number;
  errorCount: number;
  averageLatency: number;
  errorPercentage: number;
}

class NetworkTracker {
  private requests: NetworkRequest[] = [];
  private originalFetch = fetch;
  private isTracking = false;

  startTracking() {
    if (this.isTracking) return;

    this.isTracking = true;
    global.fetch = this.trackedFetch.bind(this);
  }

  stopTracking() {
    if (!this.isTracking) return;

    this.isTracking = false;
    global.fetch = this.originalFetch;
  }

  private async trackedFetch(
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    const startTime = Date.now();
    const url = input.toString();
    const method = init?.method || 'GET';

    try {
      const response = await this.originalFetch(input, init);
      const duration = Date.now() - startTime;

      const networkRequest: NetworkRequest = {
        timestamp: startTime,
        url,
        method,
        duration,
        statusCode: response.status,
        isError: response.status >= 400,
        requestSize: this.getRequestSize(init),
        responseSize: this.getResponseSize(response),
      };

      this.saveNetworkData(networkRequest);
      return response;
    } catch (error) {
      const duration = Date.now() - startTime;

      const networkRequest: NetworkRequest = {
        timestamp: startTime,
        url,
        method,
        duration,
        isError: true,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
      };

      this.saveNetworkData(networkRequest);
      throw error;
    }
  }

  private saveNetworkData = async (request: NetworkRequest) => {
    try {
      this.requests.push(request);

      // Save to offline queue
      await saveEvent({
        type: 'network',
        data: request,
      });

      // Keep only last 1000 requests in memory
      if (this.requests.length > 1000) {
        this.requests = this.requests.slice(-1000);
      }

      console.log('Network request tracked:', request);
    } catch (error) {
      console.error('Failed to save network data:', error);
    }
  };

  private getRequestSize(init?: RequestInit): number {
    if (!init?.body) return 0;

    if (typeof init.body === 'string') {
      return new Blob([init.body]).size;
    }

    return 0; // Placeholder for other body types
  }

  private getResponseSize(_response: Response): number {
    // This would need to be implemented with response headers or native modules
    return 0; // Placeholder
  }

  getNetworkStats(): NetworkStats {
    const totalRequests = this.requests.length;
    const errorCount = this.requests.filter((r) => r.isError).length;
    const totalLatency = this.requests.reduce((sum, r) => sum + r.duration, 0);
    const averageLatency = totalRequests > 0 ? totalLatency / totalRequests : 0;
    const errorPercentage =
      totalRequests > 0 ? (errorCount / totalRequests) * 100 : 0;

    return {
      totalRequests,
      errorCount,
      averageLatency,
      errorPercentage,
    };
  }

  getRequests(): NetworkRequest[] {
    return [...this.requests];
  }
}

export const networkTracker = new NetworkTracker();
export type { NetworkRequest, NetworkStats };
