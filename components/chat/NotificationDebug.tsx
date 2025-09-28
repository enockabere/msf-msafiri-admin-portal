"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useChatNotifications } from "@/hooks/useChatNotifications";
import { useWebSocketNotifications } from "@/hooks/useWebSocketNotifications";
import { useAuthenticatedApi } from "@/lib/auth";
import { 
  Bell, 
  BellOff, 
  Wifi, 
  WifiOff, 
  RefreshCw,
  MessageSquare,
  AlertCircle,
  CheckCircle
} from "lucide-react";

interface NotificationDebugProps {
  tenantSlug: string;
}

export default function NotificationDebug({ tenantSlug }: NotificationDebugProps) {
  const [debugInfo, setDebugInfo] = useState<any>({});
  const [testResults, setTestResults] = useState<string[]>([]);
  const { apiClient } = useAuthenticatedApi();
  
  const chatNotifications = useChatNotifications({ tenantSlug, enabled: true });
  const wsNotifications = useWebSocketNotifications({ tenantSlug, enabled: true });

  const addTestResult = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setTestResults(prev => [...prev, `[${timestamp}] ${type.toUpperCase()}: ${message}`]);
  };

  const testNotificationPermission = async () => {
    if (!("Notification" in window)) {
      addTestResult("Browser notifications not supported", 'error');
      return;
    }

    const permission = await Notification.requestPermission();
    addTestResult(`Notification permission: ${permission}`, permission === 'granted' ? 'success' : 'error');
    
    if (permission === 'granted') {
      new Notification("Test Notification", {
        body: "Notifications are working!",
        icon: "/icon/favicon.png"
      });
    }
  };

  const testApiConnection = async () => {
    try {
      const response = await apiClient.request("/chat/conversations/", {
        headers: { "X-Tenant-ID": tenantSlug },
      });
      addTestResult(`API connection successful - ${Array.isArray(response) ? response.length : 0} conversations`, 'success');
    } catch (error: any) {
      addTestResult(`API connection failed: ${error.message || error}`, 'error');
    }
  };

  const testWebSocketConnection = () => {
    const wsUrl = `${process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000"}/api/v1/chat/ws/notifications`;
    addTestResult(`Testing WebSocket connection to: ${wsUrl}`, 'info');
    
    try {
      const testWs = new WebSocket(`${wsUrl}?token=test&tenant=${tenantSlug}`);
      
      testWs.onopen = () => {
        addTestResult("WebSocket connection opened successfully", 'success');
        testWs.close();
      };
      
      testWs.onerror = (error) => {
        addTestResult(`WebSocket connection failed: ${error}`, 'error');
      };
      
      testWs.onclose = (event) => {
        addTestResult(`WebSocket closed with code: ${event.code}`, event.code === 1000 ? 'success' : 'error');
      };
    } catch (error: any) {
      addTestResult(`WebSocket test failed: ${error.message}`, 'error');
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  useEffect(() => {
    setDebugInfo({
      chatNotifications: {
        unreadCount: chatNotifications.unreadCount,
        isConnected: chatNotifications.isConnected,
      },
      wsNotifications: {
        isConnected: wsNotifications.isConnected,
        unreadChatCount: wsNotifications.unreadChatCount,
      },
      environment: {
        wsUrl: process.env.NEXT_PUBLIC_WS_URL,
        apiUrl: process.env.NEXT_PUBLIC_API_URL,
        tenantSlug,
      },
      browser: {
        notificationSupport: "Notification" in window,
        notificationPermission: "Notification" in window ? Notification.permission : "not supported",
      }
    });
  }, [chatNotifications, wsNotifications, tenantSlug]);

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Chat Notification Debug Panel
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Status Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-2">
            {chatNotifications.isConnected ? (
              <CheckCircle className="h-4 w-4 text-green-500" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm">Chat Polling</span>
          </div>
          
          <div className="flex items-center gap-2">
            {wsNotifications.isConnected ? (
              <Wifi className="h-4 w-4 text-green-500" />
            ) : (
              <WifiOff className="h-4 w-4 text-red-500" />
            )}
            <span className="text-sm">WebSocket</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Bell className="h-4 w-4" />
            <span className="text-sm">Unread: {chatNotifications.unreadCount}</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Badge variant={debugInfo.browser?.notificationPermission === 'granted' ? 'default' : 'destructive'}>
              {debugInfo.browser?.notificationPermission || 'unknown'}
            </Badge>
          </div>
        </div>

        {/* Test Buttons */}
        <div className="flex flex-wrap gap-2">
          <Button onClick={testNotificationPermission} variant="outline" size="sm">
            Test Browser Notifications
          </Button>
          <Button onClick={testApiConnection} variant="outline" size="sm">
            Test API Connection
          </Button>
          <Button onClick={testWebSocketConnection} variant="outline" size="sm">
            Test WebSocket
          </Button>
          <Button onClick={clearResults} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-1" />
            Clear Results
          </Button>
        </div>

        {/* Debug Information */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium mb-2">Debug Information</h4>
          <pre className="text-xs overflow-auto max-h-40">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="bg-black text-green-400 p-4 rounded-lg font-mono text-xs">
            <h4 className="text-white font-medium mb-2">Test Results</h4>
            <div className="max-h-60 overflow-auto">
              {testResults.map((result, index) => (
                <div key={index} className="mb-1">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}