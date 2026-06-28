const BASE_URL = 'http://localhost:3000';

const testCases = [
  {
    name: 'Invalid URL format',
    endpoint: '/api/browser/page/summarize',
    body: { url: 'not-a-url', text: 'test content' },
    expectedStatus: 400,
    expectedError: true,
  },
  {
    name: 'Localhost URL rejection',
    endpoint: '/api/browser/page/summarize',
    body: { url: 'http://localhost:3000', text: 'test content' },
    expectedStatus: 400,
    expectedError: true,
  },
  {
    name: 'Private IP rejection',
    endpoint: '/api/browser/page/summarize',
    body: { url: 'http://192.168.1.1/page', text: 'test content' },
    expectedStatus: 400,
    expectedError: true,
  },
  {
    name: 'Missing text field',
    endpoint: '/api/browser/page/summarize',
    body: { url: 'https://example.com' },
    expectedStatus: 400,
    expectedError: true,
  },
];

async function runTests() {
  let failures = 0;
  
  for (const test of testCases) {
    try {
      const response = await fetch(`${BASE_URL}${test.endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(test.body),
      });
      
      const contentType = response.headers.get('content-type');
      if (!contentType?.includes('application/json')) {
        console.log(`FAIL: ${test.name} - Expected JSON, got ${contentType}`);
        failures++;
        continue;
      }
      
      const data = await response.json();
      
      if (test.expectedStatus && response.status !== test.expectedStatus) {
        console.log(`FAIL: ${test.name} - Expected status ${test.expectedStatus}, got ${response.status}`);
        failures++;
        continue;
      }
      
      if (test.expectedError && data.ok !== false) {
        console.log(`FAIL: ${test.name} - Expected error response, got ok: ${data.ok}`);
        failures++;
        continue;
      }
      
      console.log(`PASS: ${test.name}`);
    } catch (error) {
      console.log(`FAIL: ${test.name} - ${error.message}`);
      failures++;
    }
  }
  
  if (failures > 0) {
    console.log(`\n${failures} test(s) failed`);
    process.exit(1);
  } else {
    console.log('\nAll tests passed');
    process.exit(0);
  }
}

runTests();
