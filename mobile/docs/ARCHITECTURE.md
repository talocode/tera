# Tera Mobile Architecture

## App Architecture

Tera Mobile is an Expo Router app organized around route groups and feature modules. Routes stay thin and compose feature components, hooks, state, and typed services.

The root layout owns app-wide providers:

- TanStack Query for server state and async service orchestration.
- Zustand for local app state.
- Session bootstrap from SecureStore.
- Dark Android-first status bar and background configuration.

## Folder Philosophy

```text
app/          navigation entrypoints only
components/   shared primitives without product-specific business logic
features/     product areas such as auth, onboarding, chat, saved, profile
lib/          external boundaries like API and storage
store/        lightweight client state
types/        cross-feature domain types
constants/    theme and app constants
```

Feature code should own product-specific components and hooks. Shared primitives should remain small and generic.

## Navigation Model

- `app/index.tsx` decides the first destination after hydration.
- `(onboarding)` introduces Tera before auth.
- `(auth)` contains sign in, sign up, and password reset.
- `(tabs)` is the main signed-in app shell with Home, History, Saved, and Profile.
- `conversation/[id]` is a stack route above tabs for focused chat detail.

This structure supports future additions such as upload flows, voice settings, subscription screens, and notification permissions without flattening route logic.

## State Management Model

TanStack Query handles async server-shaped data:

- Conversations
- Conversation detail
- Saved items
- Future profile and subscription data

Zustand handles local client state:

- Session object after bootstrap
- Onboarding completion
- Selected chat mode
- Lightweight preferences

SecureStore stores sensitive auth session data. AsyncStorage stores non-sensitive onboarding and preference data.

## API Boundary Design

`lib/api/client.ts` exposes the app API boundary. Today it points to typed mock services in `lib/api/mock.ts`. The mock implementation is intentionally shallow and mirrors future backend behavior without becoming an in-app backend.

When a real backend is ready:

- Keep route screens and feature components unchanged where possible.
- Replace mock service calls with typed `fetch` calls.
- Add auth headers from SecureStore/session state.
- Validate important response payloads with Zod at the boundary.

## Auth and Session Approach

Auth screens validate user input with Zod and call auth actions. Successful mock auth writes an `AuthSession` to SecureStore and updates Zustand. Sign out clears SecureStore, clears React Query cache, and returns to auth.

This prepares the app for real token-based auth, refresh handling, and account profile sync later.

## Scaling Strategy

- Keep route files thin.
- Put product behavior in feature modules.
- Add shared primitives only after repeated UI needs emerge.
- Keep domain types central and explicit.
- Use React Query keys consistently by product area.
- Avoid broad dependencies unless they remove real implementation risk.
- Keep native permissions minimal until a feature needs them.
