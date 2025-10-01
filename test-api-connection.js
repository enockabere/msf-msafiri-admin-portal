#!/usr/bin/env node
/**
 * Test API connectivity from the server
 */

const API_URL = 'http://192.168.200.66:8000';

async function testApiConnection() {
  console.log('🔍 Testing API connection...');
  console.log('API URL:', API_URL);
  
  try {
    // Test 1: Health check
    console.log('\n1. Testing health endpoint...');
    const healthResponse = await fetch(`${API_URL}/health`);
    console.log('Health check:', {
      status: healthResponse.status,
      ok: healthResponse.ok,
      statusText: healthResponse.statusText
    });
    
    if (healthResponse.ok) {
      const healthData = await healthResponse.text();
      console.log('Health response:', healthData);
    }
    
    // Test 2: Login endpoint structure
    console.log('\n2. Testing login endpoint (OPTIONS)...');
    const optionsResponse = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'OPTIONS'
    });
    console.log('OPTIONS check:', {
      status: optionsResponse.status,
      ok: optionsResponse.ok,
      headers: Object.fromEntries(optionsResponse.headers.entries())
    });
    
    // Test 3: Actual login attempt (replace with your credentials)
    console.log('\n3. Testing actual login...');
    const loginResponse = await fetch(`${API_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        username: 'your-email@example.com', // Replace with actual email
        password: 'your-password', // Replace with actual password
      }),
    });
    
    console.log('Login attempt:', {
      status: loginResponse.status,
      ok: loginResponse.ok,
      statusText: loginResponse.statusText,
      headers: Object.fromEntries(loginResponse.headers.entries())
    });
    
    const loginText = await loginResponse.text();
    console.log('Login response body:', loginText);
    
  } catch (error) {
    console.error('❌ Connection test failed:', {
      message: error.message,
      code: error.code,
      stack: error.stack
    });
  }
}

testApiConnection();