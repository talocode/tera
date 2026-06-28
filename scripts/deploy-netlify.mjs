#!/usr/bin/env node

import { existsSync, mkdirSync, cpSync, rmSync, readFileSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';
import { execSync, spawnSync } from 'child_process';

const NETLIFY_AUTH_TOKEN = process.env.NETLIFY_AUTH_TOKEN;
const NETLIFY_SITE_ID = process.env.NETLIFY_SITE_ID;
const IS_PRODUCTION = process.env.NETLIFY_DEPLOY_ENV !== 'preview';
const WORKSPACE = resolve('.');

const NETLIFY_CLI = '/usr/bin/netlify';
const REQUIRED = ['.next', 'netlify.toml', 'package.json'];

function abort(msg) {
  console.error(`\nFATAL: ${msg}`);
  process.exit(1);
}

function checkEnv() {
  if (!NETLIFY_AUTH_TOKEN) abort('NETLIFY_AUTH_TOKEN is not set');
  if (!NETLIFY_SITE_ID) abort('NETLIFY_SITE_ID is not set');
  console.log('[OK] Environment variables present');
}

function verifyBuild() {
  for (const f of REQUIRED) {
    if (!existsSync(join(WORKSPACE, f))) abort(`"${f}" not found. Did you run "pnpm build" first?`);
  }
  if (!existsSync(join(WORKSPACE, '.next', 'BUILD_ID'))) {
    abort('.next/BUILD_ID missing — build may be incomplete');
  }
  console.log('[OK] Build output verified');
}

function prepareIsolatedDir() {
  const dir = join(tmpdir(), `tera-deploy-${Date.now()}`);
  if (existsSync(dir)) rmSync(dir, { recursive: true });
  mkdirSync(dir, { recursive: true });
  mkdirSync(join(dir, '.next'), { recursive: true });
  cpSync(join(WORKSPACE, '.next'), join(dir, '.next'), { recursive: true });
  cpSync(join(WORKSPACE, 'netlify.toml'), join(dir, 'netlify.toml'));
  cpSync(join(WORKSPACE, 'package.json'), join(dir, 'package.json'));
  // Purge any workspace files that may have leaked in
  for (const p of ['pnpm-workspace.yaml', 'backend-server', 'mobile']) {
    const fp = join(dir, p);
    if (existsSync(fp)) rmSync(fp, { recursive: true });
  }
  console.log(`[OK] Isolated deploy directory: ${dir}`);
  return dir;
}

/**
 * Phase 1 — Deploy via Netlify CLI v25 from an isolated directory.
 * The isolated directory has NO pnpm-workspace.yaml / backend-server / mobile,
 * so project detection finds nothing and passes.
 */
function tryCLI(dir) {
  if (!existsSync(NETLIFY_CLI)) {
    console.log('[CLI] netlify CLI not found at', NETLIFY_CLI);
    return false;
  }

  const prodFlag = IS_PRODUCTION ? '--prod' : '';
  const args = [
    'deploy',
    '--dir=.next',
    prodFlag,
    `--site=${NETLIFY_SITE_ID}`,
    '--json',
  ].filter(Boolean);

  console.log(`[CLI] ${NETLIFY_CLI} ${args.join(' ')}`);
  console.log(`[CLI] CWD: ${dir} (workspace-free directory)`);

  const result = spawnSync(NETLIFY_CLI, args, {
    cwd: dir,
    encoding: 'utf-8',
    env: { ...process.env, NETLIFY_AUTH_TOKEN, NETLIFY_SITE_ID },
    timeout: 120_000,
    stdio: ['pipe', 'pipe', 'pipe'],
  });

  const stdout = (result.stdout || '').trim();
  const stderr = (result.stderr || '').trim();
  const combined = stdout + '\n' + stderr;

  if (result.status === 0) {
    const jsonLine = stdout.split('\n').filter(l => l.startsWith('{')).pop();
    if (jsonLine) {
      try {
        const r = JSON.parse(jsonLine);
        console.log(`[CLI] Deploy created: ${r.deploy_url || r.url || r.id}`);
        if (r.deploy_url) return true;
      } catch {}
    }
    console.log(`[CLI] Deploy output: ${stdout.substring(0, 300)}`);
    return true;
  }

  // Detect known failure modes
  if (combined.includes('Projects detected') || combined.includes('tera-api') || combined.includes('tera-mobile')) {
    console.log('[CLI] Project detection triggered (should not happen from isolated dir — investigate)');
  } else if (combined.includes('Forbidden') || combined.includes('403')) {
    console.log('[CLI] Authentication error (403 Forbidden). The token may be expired or lack scopes.');
    console.log('[CLI] Falling back to direct API…');
  } else if (combined.includes('credit')) {
    console.log('[CLI] Netlify account credit issue detected.');
    console.log('[CLI] Falling back to direct API for more detail…');
  } else {
    console.log(`[CLI] Failed (exit ${result.status}): ${combined.substring(0, 400)}`);
  }
  return false;
}

/**
 * Phase 2 — Deploy via the Netlify Deploy API (curl).
 * No CLI involved, so no project detection at all.
 */
function tryAPI(dir) {
  console.log('\n[API] Deploying via Netlify Deploy API…');

  const zipPath = join(tmpdir(), `tera-deploy-${Date.now()}.zip`);

  try {
    // Stage files in a clean archive directory
    const archiveDir = join(tmpdir(), `tera-archive-${Date.now()}`);
    if (existsSync(archiveDir)) rmSync(archiveDir, { recursive: true });
    mkdirSync(archiveDir, { recursive: true });
    cpSync(join(dir, '.next'), join(archiveDir, '.next'), { recursive: true });
    cpSync(join(dir, 'netlify.toml'), join(archiveDir, 'netlify.toml'));
    cpSync(join(dir, 'package.json'), join(archiveDir, 'package.json'));

    console.log('[API] Creating zip archive…');
    execSync(`cd "${archiveDir}" && zip -qr "${zipPath}" .`, {
      timeout: 60_000, stdio: ['pipe', 'pipe', 'pipe'],
    });
    const sizeMB = (readFileSync(zipPath).length / 1024 / 1024).toFixed(1);
    console.log(`[API] Archive: ${sizeMB} MB`);

    console.log('[API] Uploading…');
    const apiUrl = `https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}/deploys`;
    const result = execSync(
      `curl -s -w "\\n%{http_code}" -X POST \
        -H "Authorization: Bearer ${NETLIFY_AUTH_TOKEN}" \
        -H "Content-Type: application/zip" \
        --data-binary "@${zipPath}" \
        "${apiUrl}"`,
      { encoding: 'utf-8', timeout: 180_000, maxBuffer: 10 * 1024 * 1024 }
    );

    const lines = result.trim().split('\n');
    const httpCode = parseInt(lines.pop(), 10);
    const body = lines.join('\n');
    console.log(`[API] HTTP ${httpCode}`);

    if (httpCode >= 200 && httpCode < 300) {
      try {
        const parsed = JSON.parse(body);
        console.log(`[API] Deploy created: ${parsed.deploy_url || parsed.ssl_url || parsed.url || ''}`);
        console.log(`[API] ID: ${parsed.id || 'unknown'}  State: ${parsed.state || 'processing'}`);
      } catch {
        console.log('[API] Deploy accepted (response parsing skipped)');
      }
      return true;
    }

    // Surface the API error clearly
    let errMsg = body.substring(0, 300);
    if (httpCode === 403 && body.includes('credit')) {
      errMsg = 'Netlify account credit usage exceeded — new deploys blocked until credits are added.';
      console.log(`[API] ${errMsg}`);
    } else if (httpCode === 401) {
      errMsg = 'NETLIFY_AUTH_TOKEN is invalid or expired. Generate a new one at:';
      errMsg += '\n       https://app.netlify.com/user/applications/personal';
      console.log(`[API] ${errMsg}`);
    } else {
      console.log(`[API] Error: ${errMsg}`);
    }
    return false;
  } catch (err) {
    console.log(`[API] Failed: ${err.message}`);
    return false;
  } finally {
    try { rmSync(zipPath, { force: true }); } catch {}
  }
}

function cleanup(dir) {
  try { rmSync(dir, { recursive: true, force: true }); } catch {}
}

function main() {
  console.log('=== Tera Netlify Deploy ===\n');

  checkEnv();
  verifyBuild();

  const dir = prepareIsolatedDir();
  console.log('');

  // Phase 1: CLI (fast, avoids large zip upload)
  let ok = tryCLI(dir);
  if (!ok) {
    // Phase 2: API fallback (more reliable, but slower)
    ok = tryAPI(dir);
  }

  cleanup(dir);
  console.log('');

  if (ok) {
    console.log('=== DEPLOY SUCCEEDED ===');
    process.exit(0);
  } else {
    console.log('=== DEPLOY FAILED ===');
    process.exit(1);
  }
}

main();
