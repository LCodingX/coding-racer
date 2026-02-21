# SETUP GUIDE — Coding Racer

Everything you need to do manually before and after Claude Code builds the app.

---

## STEP 1: Create a Firebase Project

1. Go to https://console.firebase.google.com/
2. Click **"Add project"** (or "Create a project")
3. Name it something like `coding-racer`
4. You can skip Google Analytics (optional) — click Continue → Create Project
5. Wait for it to finish, then click **Continue**

---

## STEP 2: Register a Web App in Firebase

1. On your Firebase project dashboard, click the **web icon** (looks like `</>`) to add a web app
2. Give it a nickname like `coding-racer-web`
3. **DO NOT** check "Also set up Firebase Hosting" (we'll use Vercel instead)
4. Click **Register app**
5. You'll see a code block with your Firebase config. **Copy these values** — you'll need them for `.env.local`:

```
apiKey: "AIza..."
authDomain: "coding-racer-XXXXX.firebaseapp.com"
projectId: "coding-racer-XXXXX"
storageBucket: "coding-racer-XXXXX.firebasestorage.app"
messagingSenderId: "123456789"
appId: "1:123456789:web:abcdef"
```

6. Click **Continue to console**

---

## STEP 3: Enable Google Authentication

1. In the Firebase console sidebar, click **Build → Authentication**
2. Click **Get started**
3. Go to the **Sign-in method** tab
4. Click on **Google**
5. Toggle the **Enable** switch ON
6. Select a support email (your email)
7. Click **Save**

---

## STEP 4: Create Firestore Database

1. In the sidebar, click **Build → Firestore Database**
2. Click **Create database**
3. Choose a location (pick one close to you, e.g., `us-central1` or `nam5`)
4. Select **"Start in test mode"** (we'll lock it down later)
5. Click **Create**

---

## STEP 5: Create Realtime Database

1. In the sidebar, click **Build → Realtime Database**
2. Click **Create Database**
3. Choose a location (e.g., United States `us-central1`)
4. Select **"Start in test mode"**
5. Click **Enable**
6. Note the **database URL** shown at the top — it looks like:
   `https://coding-racer-XXXXX-default-rtdb.firebaseio.com`
   You'll need this for `.env.local`

---

## STEP 6: Generate a Firebase Admin Service Account Key

This is for the backend (Next.js API routes) to access Firebase with full privileges.

1. In the Firebase console, click the **gear icon** (⚙️) next to "Project Overview" → **Project settings**
2. Go to the **Service accounts** tab
3. Make sure **"Firebase Admin SDK"** is selected
4. Click **"Generate new private key"**
5. Click **Generate key** — a `.json` file will download
6. Open the JSON file. You need three values from it:
   - `project_id`
   - `client_email` (looks like `firebase-adminsdk-xxxxx@coding-racer-XXXXX.iam.gserviceaccount.com`)
   - `private_key` (the long string starting with `-----BEGIN PRIVATE KEY-----`)

⚠️ **Keep this file safe and NEVER commit it to git.**

---

## STEP 7: Fill in `.env.local`

In your project root, create a file called `.env.local` and paste in your values:

```env
# Firebase Client SDK (public — used in browser)
NEXT_PUBLIC_FIREBASE_API_KEY=AIza...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=coding-racer-XXXXX.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=coding-racer-XXXXX
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=coding-racer-XXXXX.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef
NEXT_PUBLIC_FIREBASE_DATABASE_URL=https://coding-racer-XXXXX-default-rtdb.firebaseio.com

# Firebase Admin SDK (server-side only — used in API routes)
FIREBASE_PROJECT_ID=coding-racer-XXXXX
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@coding-racer-XXXXX.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nMIIE...your key here...\n-----END PRIVATE KEY-----\n"
```

**Important:** The `FIREBASE_PRIVATE_KEY` must be wrapped in double quotes and have `\n` for newlines (which is how it appears in the downloaded JSON file).

---

## STEP 8: Push to GitHub

1. If you haven't already, create a GitHub repo:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   ```
2. Create a new repo on https://github.com/new (name it `coding-racer` or whatever you like)
3. Push:
   ```bash
   git remote add origin https://github.com/YOUR_USERNAME/coding-racer.git
   git branch -M main
   git push -u origin main
   ```

Make sure `.env.local` is in your `.gitignore` (it should be by default with Next.js).

---

## STEP 9: Deploy to Vercel (Free)

1. Go to https://vercel.com and click **"Start Deploying"**
2. Sign up / log in with your **GitHub account**
3. Click **"Add New Project"**
4. It will show your GitHub repos — select your `coding-racer` repo
5. Vercel auto-detects it's a Next.js app. Leave the defaults.
6. **Before clicking Deploy**, expand **"Environment Variables"** and add ALL the same variables from your `.env.local`:
   - `NEXT_PUBLIC_FIREBASE_API_KEY` = your value
   - `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` = your value
   - `NEXT_PUBLIC_FIREBASE_PROJECT_ID` = your value
   - `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` = your value
   - `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` = your value
   - `NEXT_PUBLIC_FIREBASE_APP_ID` = your value
   - `NEXT_PUBLIC_FIREBASE_DATABASE_URL` = your value
   - `FIREBASE_PROJECT_ID` = your value
   - `FIREBASE_CLIENT_EMAIL` = your value
   - `FIREBASE_PRIVATE_KEY` = your value (paste the full key including BEGIN/END lines)
7. Click **Deploy**
8. Wait ~60 seconds. Vercel will give you a URL like `https://coding-racer-abc123.vercel.app`

---

## STEP 10: Add Your Vercel Domain to Firebase Auth

1. Copy your Vercel deployment URL (e.g., `coding-racer-abc123.vercel.app`)
2. Go back to the **Firebase console → Authentication → Settings**
3. Scroll down to **Authorized domains**
4. Click **Add domain**
5. Paste your Vercel domain (without `https://`)
6. Click **Add**

This allows Google sign-in to work from your deployed site.

---

## STEP 11: Test It

1. Open your Vercel URL in a browser
2. You should see the login page
3. Click "Sign in with Google"
4. Choose a username
5. You're in! Try creating a solo race.

---

## Ongoing: Redeploy

Every time you push to `main` on GitHub, Vercel automatically redeploys. Just:
```bash
git add .
git commit -m "your changes"
git push
```

---

## Optional: Custom Domain

If you buy a domain (e.g., `codingracergame.com`):
1. In Vercel → your project → Settings → Domains
2. Add your domain and follow the DNS instructions
3. Also add it to Firebase Auth → Authorized domains

---

## Security (Do Later)

The test mode rules expire after 30 days. Before that:

**Firestore rules** (Firebase console → Firestore → Rules):
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
    match /raceHistory/{docId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null;
    }
  }
}
```

**Realtime Database rules** (Firebase console → Realtime Database → Rules):
```json
{
  "rules": {
    "races": {
      "$roomId": {
        ".read": "auth != null",
        "config": {
          ".write": "auth != null"
        },
        "players": {
          "$uid": {
            ".write": "auth != null && auth.uid === $uid"
          }
        }
      }
    }
  }
}
```
