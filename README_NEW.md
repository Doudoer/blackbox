# Blackbox Chat

A privacy-focused, real-time messaging application built with **Next.js**, **Supabase**, and **Tailwind CSS**.

## 🚀 Features

- **Private One-to-One Messaging**: Real-time chat powered by Supabase Postgres Changes.
- **Rich Media Support**: Send text, images, and stickers effortlessly.
- **Privacy First (App Lock)**: The interface blurs automatically when the window loses focus to hide sensitive content.
- **Custom Authentication**: Secure credential management using Bcrypt hashing within Supabase.
- **Optimistic UI**: Experience zero-latency messaging with local state updates.
- **Responsive Design**: Premium aesthetic with dark mode and smooth transitions.

## 🛠️ Technology Stack

- **Framework**: [Next.js 15+](https://nextjs.org/) (App Router)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Backend**: [Supabase](https://supabase.com/) (Auth, Realtime, DB, Storage)
- **Icons**: [React Feather](https://feathericons.com/)

## 📂 Project Structure

- `/app`: Next.js pages and API routes.
- `/components`: Reusable UI components (ChatInput, ChatMessage, AppLock).
- `/lib`: Supabase client and server-side configurations.
- `/hooks`: Custom React hooks for authentication and real-time synchronization.
- `/db`: SQL schema for profiles and messages.
- `/scripts`: Utility scripts for environment checks and test user creation.

## ⚙️ Setup Instructions

### 1. Prerequisites
- Node.js installed.
- A Supabase project.

### 2. Environment Configuration
Copy `.env.example` to `.env.local` and fill in your Supabase credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Database Initialization
Run the SQL found in `db/schema.sql` in your Supabase SQL Editor. This will:
- Create `profiles` and `messages` tables.
- Set up security policies (RLS).
- Enable Realtime replication.
- Create secure authentication helper functions.

### 4. Installation & Local Development
```bash
npm install
npm run dev
```

### 5. Create Test Users
Run the following command to initialize default users (`alice`, `bob`, `admin`):
```bash
npm run create-test-users
```

## 🔒 Security
The app uses **Row Level Security (RLS)** to ensure users can only access their own messages. Authentication is handled server-side with secure cookie management.

## 📄 License
This project is licensed under the ISC License.
