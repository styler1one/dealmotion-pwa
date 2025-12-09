# DealMotion PWA

Mobile Progressive Web App for DealMotion - AI-powered sales enablement on the go.

## 🚀 Quick Start

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📱 Features

- **Home Dashboard** - Quick stats and today's meetings
- **Meetings** - View calendar with preparation status
- **Recording** - Record meetings using Web Audio API
- **Research** - View and create company research
- **Preparation** - Create and view meeting preparations
- **Prospects** - Browse and search prospects
- **Offline Support** - Service worker caching

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS + shadcn/ui inspired components
- **Auth**: Supabase
- **State**: SWR for data fetching
- **UI**: Radix UI primitives + Vaul for drawers
- **PWA**: Custom service worker

## 📁 Project Structure

```
dealmotion-pwa/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Home dashboard
│   ├── login/             # Authentication
│   ├── meetings/          # Meetings list
│   ├── prospects/         # Prospects list
│   ├── record/            # Recording page
│   ├── more/              # Settings menu
│   └── offline/           # Offline fallback
├── components/
│   ├── layout/            # App shell, navigation
│   ├── shared/            # Shared components
│   └── ui/                # Base UI components
├── lib/
│   ├── hooks/             # Custom React hooks
│   ├── supabase/          # Supabase clients
│   ├── api.ts             # API client
│   └── utils.ts           # Utility functions
└── public/
    ├── manifest.json      # PWA manifest
    ├── sw.js              # Service worker
    └── icons/             # App icons
```

## 🌐 Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
NEXT_PUBLIC_API_URL=https://api.dealmotion.ai
NEXT_PUBLIC_APP_URL=https://app.dealmotion.ai
```

## 🚀 Deployment

This app is deployed to Vercel at `app.dealmotion.ai`.

```bash
# Build for production
npm run build

# Push to main branch triggers auto-deploy
git push origin main
```

### Vercel Settings

- **Framework**: Next.js
- **Root Directory**: `./`
- **Build Command**: `npm run build`
- **Output Directory**: `.next`

## 📲 PWA Installation

### iOS Safari
1. Open `app.dealmotion.ai` in Safari
2. Tap Share button
3. Tap "Add to Home Screen"

### Android Chrome
1. Open `app.dealmotion.ai` in Chrome
2. Tap menu (⋮)
3. Tap "Add to Home screen" or "Install app"

## 🔊 Recording Feature

The PWA uses the Web Audio API for recording:

```typescript
const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm;codecs=opus' })
```

**Note**: Keep the browser tab open while recording. The screen can be off.

## 📋 Related Repositories

- [dealmotion-web](https://github.com/styler1one/dealmotion-web) - Main web app + backend
- [dealmotion-mobile](https://github.com/styler1one/dealmotion-mobile) - Flutter native app
- [dealmotion-docs](https://github.com/styler1one/dealmotion-docs) - Documentation (private)

## 📄 License

Private - DealMotion © 2025

