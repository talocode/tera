# Tera Mobile Tasklist

## Priority 0: Foundation Verification

- Run `pnpm install` in `mobile/`.
- Run `pnpm typecheck`.
- Start Expo and smoke-test onboarding, auth, tabs, conversation detail, and sign out.
- Replace placeholder PNG assets with production-ready app icons and splash assets.

## Priority 1: Auth and Backend

- Connect sign in and sign up to the production auth backend.
- Add token refresh and expired-session handling.
- Add account profile fetch and profile update endpoints.
- Add backend-backed password reset delivery.
- Add API response validation for auth/session payloads.

## Priority 2: Chat and AI

- Add real conversation creation from the home composer.
- Add streaming AI response support.
- Persist user and assistant messages remotely.
- Add mode-specific system prompts for Learn, Research, and Build.
- Add retry behavior for failed messages.
- Add citations and source handling for Research mode.

## Priority 3: History and Saved Work

- Sync history from the backend.
- Add server-backed search.
- Save and unsave conversations.
- Add saved output types beyond conversations.
- Add empty states for first-run and offline conditions.

## Priority 4: Mobile Capabilities

- Add voice input with explicit microphone permission flow.
- Add image and file upload with scoped permissions.
- Add push notification opt-in and reminder settings.
- Add offline indicators and reconnect behavior.

## Priority 5: Monetization and Release

- Add subscription plan screens and billing state.
- Add feature gates for paid capabilities.
- Add analytics and crash reporting.
- Add release profiles with EAS Build.
- Prepare Play Store screenshots, privacy labels, and QA checklist.
