#!/usr/bin/env node

const BASE_URL = process.env.CHECK_URL || 'https://teraai.chat';
const ENDPOINT = `${BASE_URL}/api/codra/auth/device/start`;

async function main() {
  console.log(`Checking: POST ${ENDPOINT}`);
  console.log('');

  try {
    const response = await fetch(ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: 'codra-code-check',
        cli_version: '0.2.4',
        platform: process.platform,
      }),
    });

    const contentType = response.headers.get('content-type') || '';
    const text = await response.text();
    const isJson = contentType.includes('application/json');
    const isHtml = contentType.includes('text/html');

    console.log(`Status: ${response.status} ${response.statusText}`);
    console.log(`Content-Type: ${contentType}`);
    console.log(`Body length: ${text.length} chars`);
    console.log('');

    if (isJson) {
      console.log('✓ Route returns JSON');
      try {
        const json = JSON.parse(text);
        const keys = Object.keys(json);
        console.log(`  Keys: ${keys.join(', ')}`);

        if (json.success) {
          console.log('✓ Device auth start succeeded (device_code present)');
        } else if (json.error) {
          console.log(`~ Route works but returned error: ${json.error}`);
          console.log('  (Expected if Supabase migration not applied)');
        }
      } catch {
        console.log('~ JSON parse failed on response body');
      }
      process.exit(0);
    } else if (isHtml) {
      console.log('✗ Route returned HTML — NOT DEPLOYED');
      console.log('  The deploy does not include these routes yet.');
      process.exit(1);
    } else {
      console.log(`~ Route returned ${contentType} — unexpected`);
      const preview = text.substring(0, 200);
      console.log(`  Body preview: ${preview}`);
      process.exit(1);
    }
  } catch (err) {
    console.log(`✗ Network error: ${err.message}`);
    console.log('  Cannot reach the endpoint. Check URL and network.');
    process.exit(1);
  }
}

main();
