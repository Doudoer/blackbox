# Minimal Chat Blueprint (Next.js App Router + Supabase)

This folder contains a small blueprint with example files for a private one-to-one chat using Next.js App Router (14+), Tailwind CSS, TypeScript and Supabase (Realtime + Storage).

Files added (overview):

- `lib/supabase.ts` - Browser Supabase client factory
- `lib/supabase-server.ts` - Server factory (for server components/actions)
- `hooks/useRealtimeMessages.ts` - Hook to subscribe to INSERTs on `messages`
- `hooks/useAuth.ts` - Lightweight client auth hook
- `components/ChatMessage.tsx` - Message renderer
- `components/ChatInput.tsx` - Input with image upload
- `components/AppLock.tsx` - Privacy overlay (blurs when window loses focus)
- `app/chat/layout.tsx` - Wraps chat routes with `AppLock`
- `app/chat/page.tsx` - Client chat page example (hardcoded RECEIVER_ID)
- `.env.example` - env var placeholders

Scripts:

- `npm run create-test-users` - create two chat users (`alice`, `bob`) and one admin (`admin`) in `profiles` using the service role key and the database RPC `set_user_password`.

How to create test users (no email):

1. Copy `.env.example` to `.env.local` and fill in `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` and `AUTH_SECRET`.
2. Run:

```powershell
npm run create-test-users
```

This will insert three rows into `public.profiles` and call the `public.set_user_password` RPC to set their passwords.

Notes:

- These files are a blueprint and intentionally minimal. They assume you have a Next.js app, Tailwind and React set up. You may need to adapt import paths or add `tsconfig.json` path aliases if you prefer `@/...` imports.
- TypeScript/React types may show lint errors in this workspace until you install dependencies (`react`, `@types/react`, `next`, etc.).
- Replace `RECEIVER_ID` in `app/chat/page.tsx` with the ID of the contact you want to chat with.

Next steps (suggested):

1. Install peer deps for a Next app if you haven't already:

```powershell
npm install react react-dom next
npm install -D typescript @types/react @types/node
```

2. Add Tailwind and shadcn UI if desired.
3. Run `npm run dev` after configuring `next.config.js` and `tsconfig.json`.
