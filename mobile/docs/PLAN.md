# Tera Mobile Product Plan

## Mission

Tera Mobile helps people learn deeply, research clearly, and turn knowledge into action from an Android-first mobile experience.

## User Problem

Students, self-learners, and builders often use general AI tools for learning, but the experience is rarely shaped around understanding. They need a fast mobile companion that can explain ideas clearly, structure research, and help convert learning into practical output.

## Target Users

- Students who need concepts explained in plain language.
- Self-learners researching complex topics.
- Builders learning while making projects, products, or study systems.
- Mobile-first users who want quick, conversational support.

## MVP Scope

- Onboarding that explains Tera without marketing clutter.
- Auth screens ready for real backend integration.
- Chat-first home with Learn, Research, and Build modes.
- Conversation detail screen with message states prepared for streaming.
- History and saved work surfaces.
- Profile/settings surface for preferences, billing, notifications, help, and sign out.
- Typed mock data and service boundaries.
- Reusable UI primitives and theme.

## Non-Goals

- No deep fake backend implementation.
- No production AI streaming yet.
- No voice, upload, subscription, or notification implementation yet.
- No NativeWind configuration until there is a clear team need.
- No root web app rewrite.

## Product Principles

- Learning-first: answers should explain, check understanding, and support action.
- Calm and credible: minimal chrome, strong hierarchy, no neon AI startup aesthetic.
- Mobile-native: thumb-friendly controls, clear navigation, keyboard-aware composition.
- Scalable foundations: separate UI, domain, state, and data access.
- Backend-ready: mock services must mirror real API boundaries without pretending to be the backend.

## Phased Roadmap

1. Foundation: navigation, docs, typed mocks, state, auth shell, chat shell.
2. Backend integration: real auth, conversation sync, profile persistence.
3. AI chat: streaming responses, mode-specific prompts, error recovery, citations for research.
4. Learning depth: quizzes, saved outputs, structured study plans, memory controls.
5. Mobile capabilities: voice input, image/file upload, push notifications.
6. Monetization and release: subscriptions, billing state, analytics, crash reporting, Play Store readiness.
