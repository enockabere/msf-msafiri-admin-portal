// Simple test script to check notification system
// Run this in browser console on the chat page

console.log("=== MSF Chat Notification Test ===");

// Test 1: Check if notification APIs are accessible
async function testNotificationAPI() {
  try {
    const response = await fetch('/api/notifications');
    console.log("✅ Notification API accessible:", response.status);
    if (response.ok) {
      const data = await response.json();
      console.log("📊 Notification data:", data);
    }
  } catch (error) {
    console.error("❌ Notification API error:", error);
  }
}

// Test 2: Check WebSocket connection
function testWebSocket() {
  const wsUrl = `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host.replace('3000', '8000')}/api/v1/chat/ws/notifications`;
  console.log("🔌 Testing WebSocket:", wsUrl);
  
  const ws = new WebSocket(`${wsUrl}?token=test&tenant=test`);
  
  ws.onopen = () => {
    console.log("✅ WebSocket connection opened");
    ws.close();
  };
  
  ws.onerror = (error) => {
    console.error("❌ WebSocket error:", error);
  };
  
  ws.onclose = (event) => {
    console.log(`🔌 WebSocket closed with code: ${event.code}`);
  };
}

// Test 3: Check browser notification permission
function testBrowserNotifications() {
  if (!("Notification" in window)) {
    console.error("❌ Browser notifications not supported");
    return;
  }
  
  console.log("🔔 Notification permission:", Notification.permission);
  
  if (Notification.permission === "granted") {
    new Notification("Test Notification", {
      body: "MSF Chat notifications are working!",
      icon: "/icon/favicon.png"
    });
    console.log("✅ Test notification sent");
  } else if (Notification.permission === "default") {
    Notification.requestPermission().then(permission => {
      console.log("🔔 Permission result:", permission);
    });
  }
}

// Test 4: Check custom events
function testCustomEvents() {
  console.log("📡 Testing custom events...");
  
  window.addEventListener('refreshNotifications', () => {
    console.log("✅ refreshNotifications event received");
  });
  
  window.addEventListener('chatMessageSent', () => {
    console.log("✅ chatMessageSent event received");
  });
  
  // Trigger test events
  window.dispatchEvent(new CustomEvent('refreshNotifications'));
  window.dispatchEvent(new CustomEvent('chatMessageSent'));
}

// Run all tests
async function runAllTests() {
  console.log("🚀 Starting notification tests...");
  
  await testNotificationAPI();
  testWebSocket();
  testBrowserNotifications();
  testCustomEvents();
  
  console.log("✅ All tests completed. Check results above.");
}

// Auto-run tests
runAllTests();