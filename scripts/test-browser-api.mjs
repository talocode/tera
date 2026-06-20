#!/usr/bin/env node

/**
 * Tera Browser API Smoke Test
 * 
 * Tests browser API routes to ensure they return JSON, not HTML.
 */

const BASE_URL = process.env.TERA_BASE_URL || 'http://localhost:3000';

async function testEndpoint(method, path, body = null) {
  const url = `${BASE_URL}${path}`;
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();
    
    console.log(`\n${method} ${path}`);
    console.log(`  Status: ${response.status}`);
    console.log(`  Content-Type: ${contentType}`);
    
    // Check for HTML responses
    if (contentType.includes('text/html')) {
      console.log(chalk.red('  FAIL: Response is HTML, not JSON'));
      return false;
    }
    
    // Check for HTML in body
    if (text.includes('<!DOCTYPE html>') || text.includes('self.__next_f.push')) {
      console.log(chalk.red('  FAIL: Body contains HTML'));
      return false;
    }
    
    // Try to parse as JSON
    try {
      const json = JSON.parse(text);
      console.log(`  Body: ${JSON.stringify(json).substring(0, 100)}...`);
      console.log(chalk.green('  PASS: Valid JSON response'));
      return true;
    } catch (e) {
      console.log(chalk.red('  FAIL: Invalid JSON'));
      return false;
    }
  } catch (e) {
    console.log(chalk.red(`  FAIL: ${e.message}`));
    return false;
  }
}

import chalk from 'chalk';

async function runTests() {
  console.log(chalk.cyan('\n=== Tera Browser API Smoke Test ===\n'));
  
  let passed = 0;
  let failed = 0;

  // Test session endpoint (should return 401 for unauthenticated)
  const sessionResult = await testEndpoint('GET', '/api/browser/session');
  if (sessionResult) passed++; else failed++;

  // Test usage endpoint (should return 401 for unauthenticated)
  const usageResult = await testEndpoint('GET', '/api/browser/usage');
  if (usageResult) passed++; else failed++;

  // Test summarize endpoint (should return 401 for unauthenticated)
  const summarizeResult = await testEndpoint('POST', '/api/browser/page/summarize', {
    url: 'https://example.com',
    title: 'Test',
    text: 'This is a test page.',
    mode: 'general'
  });
  if (summarizeResult) passed++; else failed++;

  // Test ask endpoint (should return 401 for unauthenticated)
  const askResult = await testEndpoint('POST', '/api/browser/page/ask', {
    url: 'https://example.com',
    title: 'Test',
    text: 'This is a test page.',
    question: 'What is this?',
    mode: 'general'
  });
  if (askResult) passed++; else failed++;

  // Test explain endpoint (should return 401 for unauthenticated)
  const explainResult = await testEndpoint('POST', '/api/browser/page/explain', {
    url: 'https://example.com',
    title: 'Test',
    text: 'This is a test page.',
    mode: 'general'
  });
  if (explainResult) passed++; else failed++;

  // Test save-page endpoint (should return 401 for unauthenticated)
  const saveResult = await testEndpoint('POST', '/api/browser/memory/save-page', {
    url: 'https://example.com',
    title: 'Test Page',
    summary: 'A test page'
  });
  if (saveResult) passed++; else failed++;

  console.log(chalk.cyan(`\n=== Results: ${passed} passed, ${failed} failed ===\n`));
  
  return failed === 0;
}

// Run tests
runTests().then(success => {
  process.exit(success ? 0 : 1);
}).catch(e => {
  console.error(chalk.red(`\nTest error: ${e.message}`));
  process.exit(1);
});
