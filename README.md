# 🐾 Paw — Your Calm Video Editing Journal

A minimalist, zen-inspired daily video-editing tracker built for creative professionals. Log your editing sessions, track your creative flow, and find your rhythm.

## ✨ Features

- **Daily Logging** — Record minutes:seconds of video completed, topic, description, and time given
- **Real-time Dashboard** — Today's total, streak counter, weekly progress ring, and 30-day chart
- **History & Search** — Full history with search, topic filters, and card/table view toggle
- **Analytics & Insights** — Stats, trend charts, and top topics visualization
- **Export Suite** — CSV, PDF (formatted report), and Excel exports with date range presets
- **Goal Setting** — Daily target minutes with progress tracking
- **Streak System** — Motivational zen quotes that evolve with your streak
- **Personal Best Confetti** — Celebration animation when you break your record
- **Keyboard Shortcuts** — `Cmd+K` to quick-log from anywhere
- **PWA Ready** — Installable as a phone app with service worker caching
- **Real-time Sync** — Opens on multiple devices and stays in sync via Firestore

## 🛠 Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 + shadcn/ui |
| Auth | Firebase Auth (Google Sign-In) |
| Database | Cloud Firestore (real-time) |
| Charts | Recharts |
| Animations | Framer Motion |
| Exports | jsPDF + autoTable, xlsx |
| PWA | Custom service worker + manifest |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- A Firebase project with Authentication and Firestore enabled

### 1. Clone & Install

```bash
git clone <repo-url> paw
cd paw
npm install
```

### 2. Firebase Setup

1. Go to [Firebase Console](https://console.firebase.google.com)
2. Create a new project (or use an existing one)
3. Enable **Authentication** → **Google** sign-in provider
4. Enable **Cloud Firestore** in production mode
5. Go to Project Settings → General → Your apps → Add Web App
6. Copy the config values

### 3. Environment Variables

Copy `.env.local` and fill in your Firebase credentials:

```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 4. Firestore Security Rules

Deploy the included `firestore.rules` to your Firebase project:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /entries/{entryId} {
      allow read, write: if request.auth != null
        && request.auth.uid == resource.data.userId;
      allow create: if request.auth != null
        && request.auth.uid == request.resource.data.userId;
    }
    match /userSettings/{userId} {
      allow read, write: if request.auth != null
        && request.auth.uid == userId;
    }
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

### 5. Firestore Indexes

Create a composite index in Firestore:

- Collection: `entries`
- Fields: `userId` (Ascending), `date` (Descending)
- Query scope: Collection

### 6. Run Locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📱 PWA Installation

1. Open the app in Chrome/Safari
2. Click "Add to Home Screen" or the install prompt
3. Enjoy the native app experience

## 🚢 Deploy to Vercel

```bash
npx vercel
```

Or connect your GitHub repository to [Vercel](https://vercel.com) for automatic deployments.

Make sure to add your environment variables in the Vercel dashboard under Settings → Environment Variables.

## 📁 Project Structure

```
src/
├── app/
│   ├── layout.tsx          # Root layout with providers
│   ├── page.tsx            # Login page
│   ├── dashboard/page.tsx  # Dashboard / Home
│   ├── history/page.tsx    # All logs with search
│   ├── analytics/page.tsx  # Insights & charts
│   └── log/page.tsx        # Dedicated log entry page
├── components/
│   ├── ui/                 # shadcn components
│   ├── EntryCard.tsx       # Entry display card
│   ├── ExportButton.tsx    # Export dropdown menu
│   ├── GoalDialog.tsx      # Daily goal setting
│   ├── LogEntryForm.tsx    # Log entry modal form
│   ├── MiniChart.tsx       # Recharts wrapper
│   ├── Navbar.tsx          # Desktop + mobile nav
│   ├── RadialProgress.tsx  # SVG progress ring
│   └── ZenSkeleton.tsx     # Loading skeleton
├── contexts/
│   └── AuthContext.tsx     # Firebase Auth provider
├── lib/
│   ├── analytics.ts        # Stats & chart calculations
│   ├── exports.ts          # CSV, PDF, Excel exporters
│   ├── firebase.ts         # Firebase initialization
│   ├── firestore.ts        # CRUD + real-time listeners
│   ├── quotes.ts           # Streak-based motivational quotes
│   └── utils.ts            # shadcn utilities
└── types/
    └── index.ts            # TypeScript type definitions
```

## 🎨 Design Philosophy

- **True black** background (#000000) with crisp white text
- **Generous whitespace** — every element breathes
- **Inter font** — clean, modern, legible at all sizes
- **Italic elegance** — descriptions and quotes styled beautifully
- **Micro-animations** — Framer Motion for delightful interactions
- **Mobile-first** — designed for phones, scales up gracefully

---

*Built with ☁️ and calm energy.*
