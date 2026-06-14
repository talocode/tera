# Tera Mobile

Tera Mobile is the Android-first Expo app for TeraAI, an AI learning companion for learning deeply, researching clearly, and turning knowledge into action.

This app is not a web wrapper. It is the mobile foundation for a standalone Play Store product with a chat-first home, onboarding, auth flow, history, saved work, profile settings, and typed boundaries for real backend integration.

## Stack

- Expo React Native with TypeScript
- Expo Router for file-based navigation
- TanStack Query for server-state orchestration
- Zustand for small client state such as onboarding, mode, session, and preferences
- Expo SecureStore for sensitive session storage
- AsyncStorage for non-sensitive app state
- Zod for form validation
- Typed `fetch` boundary prepared for a real API

NativeWind is intentionally not included in this foundation. The app uses a typed theme and reusable primitives so the styling system stays small, explicit, and easy to scale.

## Project Structure

```text
mobile/
  app/              Expo Router routes and route groups
  components/ui/    Reusable UI primitives
  constants/        Theme, spacing, typography, layout constants
  docs/             Product and engineering docs
  features/         Feature-oriented UI, hooks, schemas, and data
  hooks/            Shared app hooks
  lib/              API and storage boundaries
  store/            Zustand client state
  types/            Shared domain types
  assets/           Expo icons and images
```

## Run Locally

```powershell
cd C:\Users\Hp\Documents\Github\Tera\mobile
pnpm install
pnpm start
```

Press `a` in the Expo terminal to open Android, or scan the QR code with Expo Go.

## Current Scope

This foundation includes:

- Onboarding for the TeraAI value proposition
- Mock sign in, sign up, and forgot password screens
- Chat-first home with Learn, Research, and Build modes
- Conversation detail screen with streaming-ready state shape
- History and saved screens backed by typed mock data
- Profile/settings screen with preferences and sign out
- Reusable design primitives and a calm Android-first theme
- Typed API, storage, and session boundaries

## Roadmap Summary

Next phases should connect real authentication, stream AI responses, sync conversations, add voice input, support file/image upload, introduce push notifications, and prepare subscriptions and Play Store release workflows.
