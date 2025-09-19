# 📱 MobilePulse SDK - Usage Guide

## 🚀 Quick Start

### 1. Installation
```bash
npm install react-native-mobile-pulse
# or
yarn add react-native-mobile-pulse
```

### 2. Basic Setup
```typescript
import mobilePulse from 'react-native-mobile-pulse';

// Initialize the SDK
await mobilePulse.initialize({
  apiKey: 'your-api-key',
  serverUrl: 'https://your-server.com/api',
  debug: true, // Enable debug logs
});
```

## 📊 Core Features

### 🔥 Crash Reporting
Automatically captures and reports crashes with stack traces:

```typescript
import { initCrashReporter } from 'react-native-mobile-pulse';

// Initialize crash reporting (done automatically in mobilePulse.initialize())
initCrashReporter();
```

### ⚡ Performance Monitoring
Monitor CPU, memory, FPS, and startup time:

```typescript
import { performanceMonitor } from 'react-native-mobile-pulse';

// Start monitoring (done automatically in mobilePulse.initialize())
await performanceMonitor.startMonitoring();

// Get current metrics
const metrics = performanceMonitor.getMetrics();
console.log('Performance metrics:', metrics);
```

### 🌐 Network Tracking
Track network requests with latency and error rates:

```typescript
import { networkTracker } from 'react-native-mobile-pulse';

// Start tracking (done automatically in mobilePulse.initialize())
networkTracker.startTracking();

// Get network statistics
const stats = networkTracker.getNetworkStats();
console.log('Network stats:', {
  totalRequests: stats.totalRequests,
  errorPercentage: stats.errorPercentage,
  averageLatency: stats.averageLatency
});
```

### 📱 Device & Session Info
Collect comprehensive device and session data:

```typescript
import { deviceSessionManager } from 'react-native-mobile-pulse';

// Initialize (done automatically in mobilePulse.initialize())
await deviceSessionManager.initialize();

// Get device info
const deviceInfo = deviceSessionManager.getDeviceInfo();
console.log('Device info:', deviceInfo);

// Get current session
const session = deviceSessionManager.getCurrentSession();
console.log('Session:', session);
```

## 🎯 Advanced Usage

### Custom Event Tracking
```typescript
// Track custom events
await mobilePulse.trackEvent('user_login', {
  userId: '12345',
  loginMethod: 'email',
  timestamp: Date.now()
});

await mobilePulse.trackEvent('button_click', {
  buttonName: 'checkout',
  screen: 'product_page'
});
```

### User Identification
```typescript
// Set user information
await mobilePulse.setUser('user123', {
  email: 'user@example.com',
  plan: 'premium',
  signupDate: '2024-01-01'
});
```

### Offline Queue Management
```typescript
import { offlineQueue } from 'react-native-mobile-pulse';

// Check queue size
const queueSize = await offlineQueue.getQueueSize();
console.log('Pending events:', queueSize);

// Manually upload pending events
await mobilePulse.uploadPendingEvents();

// Clear the queue (use with caution)
await offlineQueue.clearQueue();
```

## ⚙️ Configuration Options

```typescript
import { MobilePulseSDK } from 'react-native-mobile-pulse';

const sdk = new MobilePulseSDK({
  // Required
  apiKey: 'your-api-key',
  serverUrl: 'https://your-server.com/api',
  
  // Optional
  enableCrashReporting: true,
  enablePerformanceMonitoring: true,
  enableNetworkTracking: true,
  enableDeviceSessionTracking: true,
  
  // Upload settings
  uploadInterval: 30000, // 30 seconds
  batchSize: 50,
  maxRetries: 3,
  
  // Debug
  debug: false
});

await sdk.initialize();
```

## 📱 React Native App Integration

### App.tsx Example
```typescript
import React, { useEffect } from 'react';
import { View, Text } from 'react-native';
import mobilePulse from 'react-native-mobile-pulse';

export default function App() {
  useEffect(() => {
    const initializeSDK = async () => {
      try {
        await mobilePulse.initialize({
          apiKey: 'your-api-key',
          serverUrl: 'https://your-server.com/api',
          debug: __DEV__, // Enable debug in development
        });
        
        // Set user if available
        await mobilePulse.setUser('user123', {
          email: 'user@example.com'
        });
        
        console.log('MobilePulse SDK initialized successfully');
      } catch (error) {
        console.error('Failed to initialize MobilePulse SDK:', error);
      }
    };

    initializeSDK();
  }, []);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>My App with MobilePulse Monitoring</Text>
    </View>
  );
}
```

### Component with Event Tracking
```typescript
import React from 'react';
import { TouchableOpacity, Text } from 'react-native';
import mobilePulse from 'react-native-mobile-pulse';

export default function MyButton() {
  const handlePress = async () => {
    // Track button press
    await mobilePulse.trackEvent('button_pressed', {
      buttonName: 'my_button',
      screen: 'home'
    });
    
    // Your button logic here
    console.log('Button pressed!');
  };

  return (
    <TouchableOpacity onPress={handlePress}>
      <Text>Press Me</Text>
    </TouchableOpacity>
  );
}
```

## 🔧 Manual Control

### Start/Stop Monitoring
```typescript
// Performance monitoring
mobilePulse.startPerformanceMonitoring();
mobilePulse.stopPerformanceMonitoring();

// Network tracking
mobilePulse.startNetworkTracking();
mobilePulse.stopNetworkTracking();

// End session
await mobilePulse.endSession();
```

### Get Monitoring Data
```typescript
// Get all monitoring data
const performanceMetrics = mobilePulse.getPerformanceMetrics();
const networkStats = mobilePulse.getNetworkStats();
const networkRequests = mobilePulse.getNetworkRequests();
const deviceInfo = mobilePulse.getDeviceInfo();
const currentSession = mobilePulse.getCurrentSession();

console.log('All monitoring data:', {
  performance: performanceMetrics,
  network: networkStats,
  device: deviceInfo,
  session: currentSession
});
```

## 🚨 Error Handling

```typescript
try {
  await mobilePulse.initialize({
    apiKey: 'your-api-key',
    serverUrl: 'https://your-server.com/api'
  });
} catch (error) {
  console.error('SDK initialization failed:', error);
  // Handle initialization failure
}

// Check if SDK is ready
if (mobilePulse.isInitialized) {
  await mobilePulse.trackEvent('app_ready');
}
```

## 📊 Data Structure Examples

### Crash Data
```typescript
{
  type: 'crash',
  data: {
    timestamp: 1640995200000,
    stackTrace: 'Error: Something went wrong\n    at App.js:10:5',
    isFatal: true,
    sessionId: 'session_1640995200000_abc123'
  }
}
```

### Performance Data
```typescript
{
  type: 'performance',
  data: {
    timestamp: 1640995200000,
    cpuUsage: 45.2,
    memoryUsage: 128.5,
    fps: 58.3,
    startupTime: 1250,
    sessionId: 'session_1640995200000_abc123'
  }
}
```

### Network Data
```typescript
{
  type: 'network',
  data: {
    timestamp: 1640995200000,
    url: 'https://api.example.com/users',
    method: 'GET',
    duration: 250,
    statusCode: 200,
    isError: false,
    requestSize: 0,
    responseSize: 1024,
    sessionId: 'session_1640995200000_abc123'
  }
}
```

## 🔍 Debugging

Enable debug mode to see detailed logs:

```typescript
await mobilePulse.initialize({
  debug: true, // Enable debug logs
  // ... other config
});
```

Debug logs will show:
- SDK initialization steps
- Event tracking
- Upload attempts
- Error messages

## 📝 Best Practices

1. **Initialize Early**: Initialize the SDK as early as possible in your app lifecycle
2. **Handle Errors**: Always wrap SDK calls in try-catch blocks
3. **User Context**: Set user information for better analytics
4. **Custom Events**: Track important user actions and business events
5. **Offline Support**: The SDK automatically handles offline scenarios
6. **Performance**: The SDK is designed to have minimal performance impact

## 🆘 Troubleshooting

### Common Issues

1. **SDK not initializing**: Check your API key and server URL
2. **Events not uploading**: Check network connectivity and server endpoint
3. **Performance impact**: Disable unnecessary monitoring features
4. **Storage issues**: The SDK automatically manages storage limits

### Support
For issues and questions, please check the documentation or contact support.
