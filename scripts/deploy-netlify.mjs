#!/usr/bin/env node

import { existsSync, mkdirSync, cpSync, rmSync, readFileSync, writeFileSync } from 'fs';
import { join, resolve } from 'path';
import { tmpdir } from 'os';
import { execSync } from 'child_process';

const NETLIFY_AUTH_TOKEN = process.env.NETLIFY_AUTH_TOKEN;
const NETLIFY_SITE_ID = process.env.NETLIFY_SITE_ID;
const IS_PRODUCTION = process.env.NETLIFY_DEPLOY_ENV !== 'preview';
const WORKSPACE = resolve('.');

const REQUIRED = ['.next', 'netlify.toml', 'package.json'];

function checkEnv() {
  if (!NETLIFY_AUTH_TOKEN) { console.error('FATAL: NETLIFY_AUTH_TOKEN not set'); process.exit(1); }
  if (!NETLIFY_SITE_ID) { console.error('FATAL: NETLIFY_SITE_ID not set'); process.exit(1); }
}

function verifyBuild() {
  for (const f of REQUIRED) {
    if (!existsSync(join(WORKSPACE, f))) {
      console.error(`FATAL: ${f} not found. Run build first.`);
      process.exit(1);
    }
  }
  if (!existsSync(join(WORKSPACE, '.next', 'BUILD_ID'))) {
    console.error('FATAL: .next/BUILD_ID missing. Build incomplete.');
    process.exit(1);
  }
  console.log('[OK] Build output verified');
}

function prepareDeploy() {
  const dir = join(tmpdir(), `tera-deploy-${Date.now()}`);
  if (existsSync(dir)) rmSync(dir, { recursive: true });
  mkdirSync(dir, { recursive: true });
  mkdirSync(join(dir, '.next'), { recursive: true });

  cpSync(join(WORKSPACE, '.next'), join(dir, '.next'), { recursive: true });
  cpSync(join(WORKSPACE, 'netlify.toml'), join(dir, 'netlify.toml'));
  cpSync(join(WORKSPACE, 'package.json'), join(dir, 'package.json'));

  // Safety: remove any workspace files that may have been copied
  for (const unwanted of ['pnpm-workspace.yaml', 'backend-server', 'mobile']) {
    const p = join(dir, unwanted);
    if (existsSync(p)) rmSync(p, { recursive: true });
  }

  console.log(`[OK] Deploy directory: ${dir}`);
  return dir;
}

function deployCLI(dir) {
  const prodFlag = IS_PRODUCTION ? '--prod' : '';
  const cmd = `npx netlify-cli@17.0.0 deploy --dir=.next ${prodFlag} --site=${NETLIFY_SITE_ID} --json`;

  console.log(`[CLI] Running: ${cmd}`);
  console.log(`[CLI] CWD: ${dir} (no workspace files => no project detection)`);

  try {
    const out = execSync(cmd, {
      cwd: dir,
      encoding: 'utf-8',
      env: { ...process.env, NETLIFY_AUTH_TOKEN },
      timeout: 120_000,
      stdio: ['pipe', 'pipe', 'pipe'],
    });
    const trimmed = out.trim();
    const json = trimmed.split('\n').filter(l => l.startsWith('{')).pop();
    if (json) {
      const r = JSON.parse(json);
      console.log(`[CLI] OK: ${r.deploy_url || r.url || r.id}`);
    } else {
      console.log(`[CLI] OK: ${trimmed.substring(0, 200)}`);
    }
    return true;
  } catch (err) {
    const msg = (err.stderr || err.stdout || err.message || '').substring(0, 500);
    console.log(`[CLI] Failed: ${msg}`);
    return false;
  }
}

function deployAPI(dir) {
  console.log('[API] Using direct Netlify Deploy API...');

  const zipPath = join(tmpdir(), `tera-deploy-${Date.now()}.zip`);

  try {
    const archiveDir = join(tmpdir(), `tera-archive-${Date.now()}`);
    if (existsSync(archiveDir)) rmSync(archiveDir, { recursive: true });
    mkdirSync(archiveDir, { recursive: true });

    cpSync(join(dir, '.next'), join(archiveDir, '.next'), { recursive: true });
    cpSync(join(dir, 'netlify.toml'), join(archiveDir, 'netlify.toml'));
    cpSync(join(dir, 'package.json'), join(archiveDir, 'package.json'));

    console.log('[API] Creating zip...');
    execSync(`cd "${archiveDir}" && zip -qr "${zipPath}" .`, { timeout: 60_000 });
    const size = readFileSync(zipPath).length;
    console.log(`[API] Zip: ${(size / 1024 / 1024).toFixed(1)} MB`);

    console.log('[API] Uploading...');
    const apiUrl = `https://api.netlify.com/api/v1/sites/${NETLIFY_SITE_ID}/deploys`;
    const result = execSync(
      `curl -s -w "\\n%{http_code}" -X POST \\
        -H "Authorization: Bearer ${NETLIFY_AUTH_TOKEN}" \\
        -H "Content-Type: application/zip" \\
        --data-binary "@${zipPath}" \\
        "${apiUrl}"`,
      { encoding: 'utf-8', timeout: 180_000, maxBuffer: 10 * 1024 * 1024 }
    );

    const lines = result.trim().split('\n');
    const code = parseInt(lines.pop(), 10);
    const body = lines.join('\n');
    console.log(`[API] HTTP ${code}`);

    if (code >= 200 && code < 300) {
      try {
        const parsed = JSON.parse(body);
        console.log(`[API] OK: ${parsed.deploy_url || parsed.ssl_url || parsed.url || ''}`);
        console.log(`[API] State: ${parsed.state || 'processing'}`);
      } catch {
        console.log(`[API] OK (state unknown)`);
      }
      return true;
    }
    console.log(`[API] Failed: ${body.substring(0, 200)}`);
    return false;
  } catch (err) {
    console.log(`[API] Error: ${err.message}`);
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
  const dir = prepareDeploy();

  console.log('');
  let ok = deployCLI(dir);
  if (!ok) {
    console.log('\n--- CLI failed, trying API fallback ---\n');
    ok = deployAPI(dir);
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
