# CLAUDE.md — Coding Racer

## Project Overview

Build a **TypeRacer-style competitive coding typing game** called "Coding Racer" using Next.js (App Router), Firebase, and Firebase Realtime Database for live multiplayer. Players race by typing code snippets from competitive programming libraries (KACTL and Arena folders). The app has Google Auth, solo/multiplayer races, a visual oval racetrack, and a TypeRacer-inspired UI with a blue/yellow/teal color scheme.

---

## Tech Stack

- **Frontend:** Next.js 14+ (App Router), React, Tailwind CSS
- **Backend / API Routes:** Next.js API routes (under `app/api/`) — these handle file serving, room creation, race history writes, and username validation
- **Auth:** Firebase Authentication (Google sign-in) with unique username selection on first login
- **Database:** Firebase Firestore (user profiles, race history, performance stats)
- **Realtime multiplayer:** Firebase Realtime Database for live race state (player positions, progress, CPM). Firebase RTDB has built-in realtime listeners (`onValue`, `onChildChanged`) that act as a WebSocket layer — no separate WebSocket server needed.
- **Deployment:** Vercel (free tier) — the developer will handle this manually

---

## Backend: Next.js API Routes

All backend logic lives in `app/api/`. Claude Code must create these API route files:

### `app/api/files/route.ts`
- **GET** `/api/files?source=kactl|arena` → returns list of all subfolders for that source
- **GET** `/api/files?source=kactl&subfolder=graph` → returns list of files in that subfolder
- **GET** `/api/files?source=kactl&subfolder=graph&file=Dinic.h` → returns full file content as text
- Reads from disk: `./kactl/` and `./arena/` directories relative to project root
- These directories contain subfolders → code files (`.h`, `.cpp`, etc.)
- Must handle "random" mode: pick N random files from a source (across any subfolder)

### `app/api/race/route.ts`
- **POST** `/api/race/create` → creates a new race room
  - Body: `{ source, subfolder, rounds, hostUid, hostUsername, hostColor }`
  - Generates a 6-char alphanumeric room code
  - Picks the race files (N random files from the specified source/subfolder)
  - Reads each file's content from disk
  - Writes initial room state to Firebase Realtime Database at `races/{roomCode}/`
  - Returns: `{ roomCode, files: [{ name, subfolder, content }] }`

### `app/api/race/join/route.ts`
- **POST** `/api/race/join` → joins an existing race room
  - Body: `{ roomCode, uid, username, color }`
  - Validates room exists in Realtime DB and status is "waiting"
  - Adds player to `races/{roomCode}/players/{uid}`
  - Returns: room config including file list

### `app/api/race/finish/route.ts`
- **POST** `/api/race/finish` → records race results
  - Body: `{ uid, username, source, subfolder, fileName, cpm, accuracy, timeSeconds, raceType, roomId }`
  - Writes to Firestore `raceHistory` collection
  - Updates user's `averageCPM` and `totalRaces` in Firestore `users/{uid}`

### `app/api/user/route.ts`
- **POST** `/api/user/create` → creates user profile on first login
  - Body: `{ uid, email, username }`
  - Checks Firestore for username uniqueness
  - Creates `users/{uid}` document with random avatar color
  - Returns: user profile object or error if username taken
- **GET** `/api/user?uid={uid}` → returns user profile
- **GET** `/api/user/stats?uid={uid}` → returns:
  - Last 10 race results (for graph)
  - Average CPM
  - Fastest subfolder (highest avg CPM over last 10 races on that subfolder)
  - Slowest subfolder (lowest avg CPM over last 10 races on that subfolder)

### `app/api/user/check-username/route.ts`
- **GET** `/api/user/check-username?username={name}` → returns `{ available: boolean }`

### Firebase Admin SDK Setup

Create `lib/firebase-admin.ts`:
- Initialize Firebase Admin SDK using environment variables (service account credentials)
- Export `adminDb` (Firestore), `adminRtdb` (Realtime Database), and `adminAuth`
- The API routes use the Admin SDK for privileged server-side access

Create `lib/firebase-client.ts`:
- Initialize Firebase client SDK for browser use
- Export `auth`, `db` (Firestore), `rtdb` (Realtime Database)
- Uses `NEXT_PUBLIC_FIREBASE_*` environment variables

---

## File Structure (Code Snippets)

The project already has two key folders containing code files for races:

```
/kactl/          — Subfolders of competitive programming algorithms (from KACTL library)
  /data-structures/
  /graph/
  /numerical/
  /geometry/
  (etc. — each containing .h files)

/arena/          — Subfolders of competitive programming code
  /<subfolder>/
    <file>.cpp
  (etc.)
```

Each subfolder contains `.h`, `.cpp`, or similar code files. The **content of these files** is what players type during races.

**IMPORTANT:** Only use the `arena/` and `kactl/` directories for race content. Ignore all other project folders.

---

## Page Structure (3 Pages + Auth)

### 1. Login / Auth Flow (`/login`)
- Google Sign-In via Firebase Auth (client-side `signInWithPopup`)
- On first login, redirect to a username selection page/modal
- Call `POST /api/user/create` to register the username
- Show error if username is taken, let them try again
- Store in Firestore: `users/{uid}` → `{ username, email, avatarColor, createdAt, averageCPM, totalRaces }`

### 2. Main Page (`/`)
- **Navbar** (persistent across all pages, TypeRacer-style):
  - Left: App logo/name "Coding Racer"
  - Right: Username display, average CPM badge (e.g. "87 CPM"), profile link
  - Background: dark blue (`#2c3e50`), white/light text
- **Race Setup Panel:**
  - **Source selector:** Dropdown to pick `kactl` or `arena` (fetches subfolders from `/api/files`)
  - **Subfolder selector:** Dropdown of subfolders. Include a "Random" option.
  - **Race mode:** Two buttons — "Solo Race" (orange) and "Create Group Race" (teal)
  - **Round count:** Selector from 1 to 6 rounds. Each round = one code file to type.
  - For **group race**: calls `POST /api/race/create`, displays the room code prominently
  - **Join race:** Text input for entering a room code + "Join" button → calls `POST /api/race/join`
  - Host sees a lobby with connected players, clicks "Start Race" to begin
- **Style:** TypeRacer palette:
  - Primary buttons: orange/amber (`#e8a317`)
  - Secondary buttons: teal/green (`#2ecc71`)
  - Background: light gray (`#f5f5f5`), dark blue navbar
  - Cards: white with subtle shadow

### 3. Race Page (`/race/[roomId]`)

#### a. Navbar (same persistent navbar with username + CPM)

#### b. Racetrack (center of screen)
- **Oval/elliptical racetrack** drawn with SVG
- Track fill: **medium gray** (`#999`) with darker border (`#666`)
- White dashed lane markings
- Each player = **colored circle** on the track with:
  - Username label near the circle
  - Current lap shown (e.g., "Lap 2/4")
- Player position = progress through typing:
  - Position around the oval = % progress through current file
  - Completing a file = completing one lap
  - Total laps = number of rounds (files)
- Smooth CSS/JS animation as players progress
- Starting/finish line marked on the track

#### c. Code Typing Area (below racetrack)
- **Rectangular box**, dark background (`#1e1e1e`), monospace font (Fira Code or JetBrains Mono)
- Display full code snippet for current round
- **Text coloring system:**
  - **Correctly typed text:** green (`#4caf50`)
  - **Current cursor position:** blinking cursor or highlight
  - **Not yet typed text:** gray (`#666`)
  - **Error state:** when the player types a wrong character, start rendering all subsequent typed chars in **red** (`#f44336`). Red continues accumulating until the player **backspaces** to fix the mistake. They cannot advance past an error.
- Below the typing area show live stats:
  - Current CPM (characters per minute)
  - Current accuracy %
  - Current file name
  - Round progress ("File 2 of 4")

#### d. Race Flow
- **Pre-race:** "Waiting for players..." or countdown (3-2-1-GO!)
- **During race:** Firebase Realtime DB listeners sync all players' progress live. Each client writes their own progress to `races/{roomId}/players/{uid}/` (throttled to ~200ms).
- **Race complete (multiplayer):**
  - Show **rankings panel**: players in finishing order with CPM + accuracy
  - Show place labels (1st, 2nd, 3rd, etc.)
  - Two buttons: "Race Again" (teal) and "Main Menu (leave race)" (orange)
  - "Race Again" resets the room with new files, same settings
- **Race complete (solo):**
  - Show CPM, accuracy, time
  - "Race Again" and "Main Menu" buttons
- Call `POST /api/race/finish` to save each player's results

### 4. Profile Page (`/profile`)
- **User info:** email, username, avatar color circle with initial
- **Performance graph:**
  - Line chart of **CPM over last 10 races** (use recharts)
  - X-axis: race number, Y-axis: CPM
  - Horizontal dashed line for average CPM
- **Stats:**
  - Average CPM
  - Total races
  - **Fastest subfolder:** subfolder with highest avg CPM (over last 10 races on that subfolder)
  - **Slowest subfolder:** subfolder with lowest avg CPM (over last 10 races on that subfolder)

---

## Firebase Data Model

### Firestore Collections

```
users/{uid}
  username: string (unique)
  email: string
  avatarColor: string (hex)
  averageCPM: number
  totalRaces: number
  createdAt: timestamp

raceHistory/{autoId}
  uid: string
  username: string
  source: "kactl" | "arena"
  subfolder: string
  fileName: string
  cpm: number
  accuracy: number
  timeSeconds: number
  completedAt: timestamp
  raceType: "solo" | "group"
  roomId: string | null
```

### Realtime Database (live race state)

```
races/{roomCode}/
  config/
    source: string
    subfolder: string
    files: [{name, subfolder, content}]
    totalRounds: number
    hostUid: string
    status: "waiting" | "countdown" | "racing" | "finished"
    currentRound: number
    createdAt: number
  players/{uid}/
    username: string
    color: string
    currentRound: number
    progress: number (0-100)
    cpm: number
    accuracy: number
    finished: boolean
    finishTime: number | null
    place: number | null
```

---

## Race Logic

### Typing Mechanics
- Capture keystrokes on the page (hidden input or `onKeyDown` handler)
- Compare each character against expected code snippet
- **Correct:** advance green cursor
- **Incorrect:** mark red, keep marking red for subsequent chars. Player MUST backspace to error point to continue.
- CPM = `(correct characters typed / elapsed minutes)`
- Accuracy = `(correct chars / total chars typed) * 100`

### Multiplayer Sync
- Each player writes to `races/{roomCode}/players/{uid}/` via Firebase RTDB
- All clients listen to `races/{roomCode}/players/` to render everyone's positions
- Throttle writes to ~200ms intervals
- Host sets `status: "countdown"` → clients show 3-2-1-GO → `status: "racing"`

### Room Code
- 6-char alphanumeric (uppercase + digits)
- Validate uniqueness in RTDB before creating
- Rooms auto-expire (set TTL or clean up stale rooms)

---

## Environment Variables

Create `.env.local` (the developer will fill these in):

```env
# Firebase Client SDK (public, used in browser)
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_DATABASE_URL=

# Firebase Admin SDK (server-side only, used in API routes)
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY=
```

---

## Styling Guidelines

- **Navbar:** `#2c3e50` background, white text, username + CPM badge on right
- **Body:** `#f5f5f5` background
- **Primary buttons:** orange `#e8a317` with white text
- **Secondary buttons:** teal `#2ecc71` with white text
- **Danger buttons:** red-orange `#e74c3c`
- **Racetrack:** gray `#999` fill, `#666` border, white dashed lanes
- **Code editor box:** `#1e1e1e` bg, monospace font
  - Green `#4caf50` for correct
  - Red `#f44336` for errors
  - Gray `#666` for untyped
- **Cards:** white bg, `border-radius: 8px`, subtle `box-shadow`
- **Font:** system sans-serif for UI, monospace (Fira Code / JetBrains Mono) for code

---

## Key Implementation Notes

1. **All backend logic goes in `app/api/` as Next.js API routes.** No separate backend server.
2. **Firebase Admin SDK** is used server-side in API routes. **Firebase Client SDK** is used in the browser.
3. **File reading** happens server-side in API routes using Node.js `fs` module.
4. **Auth guard:** Main page, race page, and profile page require authentication. Redirect to `/login` if not authenticated.
5. **Code display:** Preserve all whitespace, indentation, and line breaks exactly as in source files. Use `<pre>` styling.
6. **Round transitions:** When a player finishes a file in a multi-round race, auto-load the next file and start the next lap. Show brief "Round X complete!" indicator.
7. **Performance history:** After each race, call `/api/race/finish` to persist results. Profile page fetches stats from `/api/user/stats`.
8. **Responsive:** Target desktop screens. Mobile shouldn't completely break but isn't the priority.
9. Use `onDisconnect()` in Firebase RTDB to handle players dropping from races.
10. Install recharts for the profile page chart.
