# Netlify Deploy Fix

## Root Cause

Netlify production deployments have been failing since June 17 because Netlify CLI v17+ scans the pnpm workspace and detects multiple projects:

```
Projects detected: tera-api, tera-mobile
```

The `pnpm-workspace.yaml` lists `backend-server` (name: `tera-api`) and `mobile` (name: `tera-mobile`) as workspace packages. When the CLI runs and finds multiple package.json files with distinct names in a workspace, it errors with "Projects detected" instead of deploying.

Even when specifying `--site` and `--dir` explicitly, the CLI scans the project root (detected from CWD or the `--dir` path's parent directory) for workspace configuration.

## Why Previous Fixes Failed

| Attempt | What | Why it failed |
|---------|------|---------------|
| Removed `render.yaml` | Deleted unrelated file | Not the cause |
| `--cwd .` | Added cwd flag | CLI still scanned workspace from `--dir` parent path |
| `--filter tera` | Added filter flag | Not a valid netlify-cli flag |
| `--no-build` | Skip build in CLI | Detection happens before deploy step |
| Pinned `@17.36.2` | Older CLI version | Detection existed in v17 too |
| Run from `/tmp` | Changed CWD | `--dir` still pointed to workspace `.next`; CLI walked up from `--dir` |

## Chosen Strategy

Two-phase deploy:

### Phase 1: CLI from isolated directory (preferred)

1. Copy `.next` build output + `netlify.toml` + root `package.json` to `/tmp/tera-deploy-<ts>/`
2. Run `npx netlify-cli@17.0.0 deploy --dir=.next --prod --site=$NETLIFY_SITE_ID` from that directory
3. The isolated directory has NO `pnpm-workspace.yaml`, NO `backend-server/`, NO `mobile/`
4. The CLI walks up from CWD (`/tmp/tera-deploy-<ts>/`) and finds no workspace — project detection passes

### Phase 2: Direct Netlify API (fallback)

If the CLI still fails (regardless of reason), fall back to the Netlify Deploy API:

1. Create a zip archive of `.next/` + `netlify.toml` + `package.json`
2. `POST https://api.netlify.com/api/v1/sites/{site_id}/deploys` with `Content-Type: application/zip`
3. No CLI involved — no project detection

## Files Changed

### `scripts/deploy-netlify.mjs` (new)
Deploy script that implements Phase 1 + Phase 2. Called by CI workflow.

### `.github/workflows/deploy-netlify.yml` (modified)
- Fixed duplicate `env:` block (syntax bug in previous version)
- Simplified deploy step to `node scripts/deploy-netlify.mjs`

### `scripts/check-codra-auth-route.mjs` (new)
Smoke test that calls `POST /api/codra/auth/device/start` and verifies JSON response.

### `supabase/migrations/20260619000000_create_codra_device_auth_sessions.sql` (new)
Creates the `codra_device_auth_sessions` table required by the device auth routes.

## How to Verify Production

Run the smoke test:

```bash
node scripts/check-codra-auth-route.mjs
```

Expected successful output:
```
Status: 200 OK
Content-Type: application/json
✓ Route returns JSON
  Keys: success, device_code, user_code, verification_url, ...
```

If the Supabase table is missing, it will still return JSON but with a DB error — this confirms the route exists.

## Supabase Migration

The `codra_device_auth_sessions` table must exist in production for device auth to work end-to-end.

To apply the migration:

```bash
npx supabase migration up --db-url "$SUPABASE_DB_URL"
```

Or run the SQL directly:

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/20260619000000_create_codra_device_auth_sessions.sql
```

## Rollback Plan

If the deploy breaks teraai.chat:

1. Revert the workflow change: `git revert <commit> && git push origin main`
2. Trigger a manual re-deploy with the old workflow from a working commit
3. Or use the Netlify UI to rollback to last known good deploy (commit `4399ba7`, June 17)
