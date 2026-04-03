# 🛡️ SecInsure Partner App

**AI-Powered Parametric Income Insurance for Delivery Partners**

SecInsure protects delivery partners against real-world disruptions—severe weather, traffic congestion, and extreme temperatures—by using real-time geolocation and AI to automatically trigger micro-insurance payouts. No manual claims. No waiting. Just protection.

---

## 🚀 Overview

The SecInsure Partner App is a sleek, fast mobile experience built for gig workers. Think Swiggy or Zomato's design language, but for income protection.

We respect delivery partners' time. The app gets out of the way: onboarding takes 5 minutes, your coverage activates instantly, and claims hit your UPI within minutes—not days.

**Core promise:**
- ✅ Protection against weather + traffic disruptions
- ✅ Automatic claims triggered by ML/AI (no paperwork)
- ✅ Instant micro-payouts (₹50–₹500 per event)
- ✅ Built for low-end Android + poor connectivity
- ✅ Swiggy Partner ID works as authentication

---

## 📱 App Experience

### Speed & Simplicity
- **Onboarding:** 11 steps but feels like 2 minutes
- **Dashboard:** One glance tells you everything—coverage status, premium, live alerts
- **Claims:** See exactly when your payout happened (timeline with timestamps)
- **Alerts:** Real-time disruption feed sorted by severity

### Design Language
- **Delivery App Aesthetic:** Orange, green, blue—colors matter. They mean status.
- **Card-Based Layout:** Information organized like delivery food items (quick scan)
- **Touch-Friendly:** Buttons are 44×44px minimum; inputs are forgiving
- **Low Data:** Heavy caching + works on 2G (future roadmap)
- **Dark Mode Ready:** Light theme now; dark mode in v2

---

## 👤 User Flows

### New Delivery Partner (Onboarding)

1. **Welcome Screen**
   - Hero with SecInsure logo + value prop ("AI-powered protection")
   - Feature pills: Weather Protection, Auto Claims, Instant Payouts
   - CTA buttons: "Get Started" vs "I already have an account"

2. **Onboarding Steps** (11-step wizard)
   - **Partner ID:** Swiggy Partner ID (e.g., SWG-12345)
   - **Mobile Number:** OTP verification
   - **Verify OTP:** 6-digit code
   - **Name:** Auto-prefilled from Swiggy if available
   - **Weekly Income:** Average earnings (slider or input)
   - **Work Type:** Full-time, Part-time, Casual
   - **Location:** Zone detection via GPS
   - **Aadhaar Verification:** Quick OTP-based KYC
   - **PAN Card:** Tax ID
   - **UPI ID:** Payout destination
   - **Review & Confirm:** One-tap policy activation

3. **Success State**
   - Coverage activates immediately
   - Redirects to Dashboard

### Existing Delivery Partner (Login)

1. **Login Screen**
   - Mobile number + Swiggy Partner ID
   - OTP verification
   - Direct navigation to Dashboard

---

## 🧭 Navigation Architecture

**State Machine (not React Router—simpler for RN)**

```
Welcome Screen
├── [New User] → Onboarding Flow
│   └── 11-step form → Dashboard
├── [Existing User] → Login Flow
│   └── Partner ID + OTP → Dashboard
└── Dashboard
    ├── Tab: Home (Dashboard Screen)
    ├── Tab: Activity (Claims Screen)
    ├── Tab: Alerts (Alerts Screen)
    └── Tab: Profile (Profile Screen)
```

**Navigation Library:** React Navigation (Stack navigator for auth flows, Tab navigator for bottom tabs)

**Key Screens:**
- `WelcomeScreen` - Entry point
- `OnboardingFlow` - Multi-step form (11 steps)
- `LoginFlow` - OTP + Partner ID verification
- `DashboardScreen` - Main hub (risk meter, premium, coverage)
- `ClaimsScreen` - Historical claims + payouts
- `AlertsScreen` - Real-time disruption feed
- `ProfileScreen` - Account settings + policy details
- `BottomNav` - 4 persistent tabs (Home, Activity, Alerts, Profile)

---

## 🖥️ Screens Breakdown

### **Welcome Screen**
Purpose: First impression + decision point
- Hero: SecInsure logo + tagline
- Feature list: Weather, Auto Claims, Instant Payouts
- CTAs: Get Started (Primary) | Already have account (Secondary)
- Action: Routes to Onboarding or Login

---

### **Onboarding Flow**
Purpose: Collect necessary info + KYC
- 11 sequential steps with progress bar
- Each step has icon, title, subtitle, and context-aware input
- Step types:
  - Text inputs (Partner ID, Name, UPI)
  - Phone input (Mobile Number)
  - OTP inputs (6 boxes)
  - Dropdowns/Toggles (Work Type)
  - GPS location picker (Location/Zone)
  - Summary review before confirmation
- Back button allows users to re-edit any step
- Smart validation (Aadhaar format, UPI pattern, mobile length)

---

### **Login Flow**
Purpose: Quick re-entry for existing users
- 3 steps:
  1. Mobile Number input
  2. OTP verification (6-digit)
  3. Partner ID confirmation
- Faster than onboarding (skips redundant KYC steps)

---

### **Dashboard Screen** ← Home Tab
Purpose: At-a-glance overview of coverage + earnings risk

| Section | What You See | What It Means |
|---------|-------------|-------------|
| **Greeting** | "Hello Raju 👋" + "Your coverage is active" | Immediate reassurance |
| **Alert Banner** | "Heavy Rain Alert" + threshold info | Active disruption affecting you now |
| **Live Data** | 4 cards: Temp, Rain, AQI, Traffic | Real-time conditions in your zone |
| **Protection Card** | ₹29/week premium + "Weather + Traffic" coverage + renewal date | Clear pricing + scope |
| **Quick Actions** | 4 buttons: Claims, Risk Score, Payments, Map | Fast access to key actions |
| **Risk Meter** | Circular gauge (0-100) showing current risk level | Visual risk indicator |
| **7-Day Forecast** | Weather symbols + risk per day | Plan your work week |
| **Recent Payouts** | 3 latest claims + amounts + dates | Proof of real payouts |

---

### **Claims Screen** ← Activity Tab
Purpose: See every claim + timeline proof

- **Header:** "Claims" + "Track your auto-triggered claims"
- **Stats Row:** Total Claims (3) | Amount Received (₹350) | Pending (1)
- **Claim Cards** (for each claim):
  - Reason (Heavy Rainfall | Extreme Heat | Traffic Disruption)
  - Date + Claim ID
  - Status badge (Paid ✓ | Processing ⏳ | Rejected ✗)
  - Amount (₹150, ₹80, etc.)
  - **Timeline** (most important):
    - Event Detected (2:30 PM) ✓
    - Claim Auto-Triggered (2:31 PM) ✓
    - Verified by AI (2:35 PM) ✓
    - Payout Sent (2:40 PM) ✓
  - "Details" link to drill down
- Scroll through claim history

---

### **Alerts Screen** ← Alerts Tab
Purpose: Real-time disruption feed (push notifications come here too)

- **Alert Cards** sorted by severity + recency:
  - **High:** Heavy Rain (40mm+), Flood Risk → Red badge
  - **Medium:** Heat Advisory, Poor AQI → Orange badge
  - **Low:** Traffic Congestion → Yellow badge
  - **Info:** Coverage milestones → Blue badge
- Each alert has:
  - Icon + color-coded background
  - Title + brief description
  - Time (2 min ago, 1 hr ago, Yesterday)
  - Severity label

---

### **Profile Screen** ← Profile Tab
Purpose: Account settings + policy management

- **Profile Header:**
  - Avatar (initials: RK)
  - Name: Raju Kumar
  - Meta: SWG-12345 · Full-time

- **Policy Details Card:**
  - Policy ID: SI-2026-00429
  - Plan: Weather + Traffic Shield
  - Weekly Premium: ₹29
  - Coverage Since: 15 Mar 2026
  - Total Claims: 3 (₹350 received)

- **Menu Items:**
  - Personal Details (icon + chevron)
  - Contact Info (icon + chevron)
  - Delivery Zone (icon + chevron)
  - KYC Documents (icon + chevron)
  - Payment Methods (icon + chevron)
  - Policy Documents (icon + chevron)
  - Help & Support (icon + chevron)

- **Logout Button** (red background)

---

## 🎨 UI/UX Design System

### **Color Palette**
Inspired by delivery apps (Swiggy/Zomato). Each color has purpose:

| Color | HSL | Usage |
|-------|-----|-------|
| **Primary Blue** | hsl(217, 91%, 50%) | Buttons, links, active states |
| **Primary Foreground** | hsl(0, 0%, 100%) | Text on primary buttons |
| **Accent Green** | hsl(152, 60%, 45%) | Success, paid claims, positive states |
| **Destructive Red** | hsl(0, 72%, 55%) | Alerts, errors, rejected claims |
| **Warning Orange** | hsl(30, 95%, 55%) | Processing, pending, medium alerts |
| **Background** | hsl(210, 20%, 98%) | Page background (almost white) |
| **Foreground** | hsl(220, 20%, 10%) | Text (almost black) |
| **Border** | hsl(215, 20%, 92%) | Card borders, dividers |

### **Light Color Backgrounds**
- Blue-50: #dbeafe
- Green-50: #f0fdf4
- Orange-50: #fff7ed
- Red-50: #fef2f2
- Yellow-50: #fefce8

(Used for icon backgrounds, status badges)

### **Typography**
- Font: "Plus Jakarta Sans" (system fallback available)
- Sizes:
  - **32px / 800 weight:** Screen titles (Dashboard)
  - **20px / 800 weight:** Section titles
  - **16px / 600 weight:** Card titles
  - **14px / 500 weight:** Body text
  - **12px / 600 weight:** Labels
  - **10px / 500 weight:** Small captions

### **Spacing & Layout**
- Baseline: 4px grid
- Padding: 16px (card), 20px (screen edges), 24px (content blocks)
- Gap: 8px (between items), 16px (between sections)
- Border radius: 12px (cards), 16px (buttons), 24px (large components)

### **Card-Based Layout**
Every screen uses cards:
- White background (hsl(0, 0%, 100%))
- Border: 1px hsl(215, 20%, 92%)
- Rounded: 12–16px
- Shadow: soft (1–2px blur, 15% opacity)
- Padding: 16–20px

### **Micro-interactions**
- **Touch Feedback:** TouchableOpacity reduces opacity on press
- **Badges:** Color-coded by status + small icons
- **Progress Bar:** Animated fill on onboarding
- **Timeline:** Vertical line with dots (green = completed, gray = pending)

---

## 🛠️ Tech Stack

### Frontend
- **React Native 0.81.5** - Mobile framework
- **Expo 54.0.0** - SDK + managed hosting
- **TypeScript 5.9** - Type safety
- **React Navigation 6.1.9** - Navigation (Stack + Tab)
- **NativeWind 4.0.1** - Tailwind CSS for React Native
- **@tanstack/React Query 5.83** - Data fetching + caching
- **React Hook Form 7.61** - Form management
- **@expo/vector-icons 15.0.3** - Material Icons

### Build & Dev
- **Metro** - RN bundler
- **Babel 7.20** - JS transpiler
- **Tailwind CSS 3.4** - Utility-first styling

### Platforms
- **iOS 14+** (via Expo)
- **Android 6.0+** (via Expo)
- **Web** (experimental, via react-native-web)

---

## 📡 API Integration

### Expected Endpoint Structure
Backend is FastAPI-based. Partner app expects:

**Authentication**
- `POST /auth/otp-request` - Request OTP to mobile
- `POST /auth/otp-verify` - Verify OTP
- `POST /auth/register` - Complete partner onboarding
- `POST /auth/login` - Login (returns JWT token)

**Partner Profile**
- `GET /partner/profile` - Fetch partner details
- `PUT /partner/profile` - Update profile
- `POST /partner/kyc` - Submit KYC docs

**Coverage & Claims**
- `GET /partner/coverage` - Current coverage status
- `GET /partner/claims` - List all claims (paginated)
- `GET /partner/claims/{id}` - Claim details + timeline
- `GET /partner/risk-score` - Current risk meter value

**Alerts**
- `GET /partner/alerts` - Real-time disruption feed
- `POST /partner/alerts/{id}/read` - Mark alert as read

**Real-Time**
- WebSocket endpoint for live risk updates (future)

### Authentication
- JWT tokens stored in secure AsyncStorage
- Tokens included in all `Authorization: Bearer <token>` headers
- Auto-refresh on 401 responses

### Mock Data (Current)
App ships with hardcoded mock claims, alerts, and profiles for development. Replace `const claims = [...]` with API calls using React Query:

```typescript
// Example: Instead of hardcoded claims
const { data: claims } = useQuery({
  queryKey: ['claims'],
  queryFn: () => fetch(`${API_URL}/partner/claims`).then(r => r.json())
});
```

---

## 📂 Project Structure

```
secinsure-partner-app/
├── src/
│   ├── App.tsx                    # Main app shell + state machine
│   ├── main.tsx                   # RN entry point (AppRegistry)
│   ├── index.css                  # Global styles
│   ├── pages/
│   │   └── Index.tsx              # App state manager (Welcome → Onboarding → Dashboard)
│   ├── screens/
│   │   ├── WelcomeScreen.tsx      # Hero + CTAs
│   │   ├── OnboardingFlow.tsx     # 11-step form
│   │   ├── LoginFlow.tsx          # Quick re-entry (3 steps)
│   │   ├── DashboardScreen.tsx    # Main hub (home tab)
│   │   ├── ClaimsScreen.tsx       # Claim history + timeline
│   │   ├── AlertsScreen.tsx       # Real-time alerts feed
│   │   └── ProfileScreen.tsx      # Account settings
│   ├── components/
│   │   ├── BottomNav.tsx          # 4 persistent tabs
│   │   ├── Icon.tsx               # Icon wrapper
│   │   ├── MobileFrame.tsx        # (legacy, can remove)
│   │   └── ui/                    # (legacy shadcn/ui components, can remove)
│   ├── hooks/
│   │   ├── use-mobile.tsx         # Responsive utils
│   │   └── use-toast.ts           # Toast notifications
│   ├── lib/
│   │   └── utils.ts               # Utility functions
│   └── constants/
│       └── shadows.ts             # Shadow definitions
├── public/
│   └── robots.txt
├── assets/
│   ├── icon.png                   # App icon
│   ├── splash.png                 # Splash screen
│   ├── adaptive-icon.png          # Android adaptive icon
│   └── favicon.png                # Web favicon
├── app.json                        # Expo config
├── babel.config.js                # Babel setup (NativeWind preset)
├── tailwind.config.ts             # Tailwind theme + colors
├── tsconfig.json                  # TypeScript config
├── tsconfig.app.json              # App-specific TS config
├── tsconfig.node.json             # Node TS config
├── package.json                   # Dependencies
├── vite.config.ts                 # Vite config (legacy, web only)
├── metro.config.js                # Metro bundler config
├── postcss.config.js              # PostCSS config
├── playwright.config.ts           # (test automation, optional)
├── vitest.config.ts               # (unit tests, optional)
├── eslint.config.js               # Linting
└── README.md                       # This file
```

### Key Folders Explained

**`screens/`** - Full-screen experiences
- Each screen is a self-contained React component
- Handles its own state (form data, lists)
- Receives callbacks for navigation

**`components/`** - Reusable UI building blocks
- BottomNav: 4-tab navigation bar
- Icon: Wrapper around expo vector icons
- ui/: (can be deleted; contains old web components)

**`constants/`** - Shared data
- Color definitions, shadow styles, mock data

---

## ⚡ Setup Instructions

### Prerequisites
- Node.js 16+ (ideally 18 LTS)
- npm or yarn
- Expo CLI: `npm install -g expo-cli`
- Expo Go app (iOS App Store or Google Play)

### Installation

1. **Clone the repo**
   ```bash
   git clone <repo-url>
   cd secinsure-partner-app
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or if you prefer yarn
   yarn install
   ```

3. **Set env variables** (if backend is live)
   ```bash
   # Create .env file
   echo "REACT_APP_API_URL=https://api.secinsure.local" > .env
   ```

4. **Start dev server**
   ```bash
   npm start
   # or use Expo CLI directly
   expo start --clear
   ```

5. **Run on device**
   - **iOS:** Press `i` in terminal → opens on simulator
   - **Android:** Press `a` in terminal → opens on emulator/device
   - **Web:** Press `w` in terminal → opens at http://localhost:8081
   - **Expo Go:** Scan QR code with Expo Go app (iOS Camera or Android Expo Go)

### Available Scripts

| Command | Purpose |
|---------|---------|
| `npm start` | Start Expo dev server (all platforms) |
| `npm run android` | Run on Android emulator/device |
| `npm run ios` | Run on iOS simulator |
| `npm run web` | Run on web browser |
| `npm run dev` | (Legacy) Run Vite dev server |
| `npm run build` | (Legacy) Build for web |

---

## 🧪 Development Notes

### Known Issues & Solutions

**1. NativeWind `className` not recognized**
- **Issue:** TypeScript complains `className` doesn't exist on RN components
- **Fix:** Added `"types": ["nativewind/types"]` in tsconfig.json
- **Status:** ✅ Resolved

**2. Expo Go "incompatible version" error**
- **Issue:** App requires newer Expo Go / missing native modules
- **Fix:** Ensure `app.json` has valid icon paths; update Expo Go from Play Store
- **Status:** ✅ Resolved (missing assets created)

**3. Web bundling shows "MIME type" error**
- **Issue:** Metro bundler fails with `shadow*` deprecation warnings
- **Fix:** Moved `nativewind/babel` from plugins to presets; installed `react-native-worklets`
- **Status:** ✅ Resolved

**4. react-native-web shadow warnings**
- **Issue:** Console logs "shadow* style props are deprecated. Use boxShadow"
- **Fix:** (Visual only) Not breaking; ignore or replace `shadowColor/Offset` with `boxShadow` in future
- **Status:** ⚠️ Non-blocking

### Performance Tips

1. **Lazy load screens:** Use React.lazy() for off-screen tabs (future optimization)
2. **Memoize callbacks:** Wrap navigation handlers with useCallback
3. **Image optimization:** Use Expo Image component instead of Image
4. **Reduce re-renders:** Move BottomNav outside of conditional render chain

### Testing

Run tests (minimal setup currently):
```bash
npm test  # or vitest
```

---

## 🔮 Future Improvements

### Phase 2 (Months 3–6)
- [ ] **Push Notifications:** Real-time alerts via Firebase Cloud Messaging
- [ ] **Offline Mode:** Cache claims/alerts; sync when online
- [ ] **Dark Mode:** Full dark theme + toggle in settings
- [ ] **Analytics:** Mixpanel / Amplitude for user behavior tracking
- [ ] **A/B Testing:** Feature flags for onboarding variants

### Phase 3 (Months 6–12)
- [ ] **Live Risk Updates:** WebSocket for real-time risk meter changes
- [ ] **Admin Panel:** Partner support portal (separate web app)
- [ ] **Multi-Language:** Hindi + regional languages
- [ ] **Fingerprint Auth:** Biometric login on returning users
- [ ] **Payment Gateway Integration:** Direct Razorpay UPI linking in app

### Phase 4+ (Long-Term)
- [ ] **ML Personalization:** Customized alerts based on work patterns
- [ ] **Social Proofing:** See other partners' claims in your zone (anonymized)
- [ ] **Referral Program:** Invite friends → earn bonus weeks
- [ ] **Micro-Lending:** Short-term loans against future claims
- [ ] **Partner Community:** In-app chat/forums for delivery workers

---

## 🤝 Relation to Backend

### SecInsure Backend (FastAPI)
This app connects to a Python FastAPI backend that handles:

**1. Authentication**
- OTP generation/verification via SMS
- Partner ID validation against Swiggy DB
- JWT token generation

**2. ML Risk Engine**
- Real-time weather/traffic API calls (OpenWeatherMap, Google Maps)
- ML model: predicts if conditions meet claim threshold
- Auto-triggers claims when thresholds exceeded

**3. Fraud Detection**
- Detects suspicious claim patterns
- Validates partner location matches claimed incident zone
- Rate limiting (max 1 claim per hour per partner)

**4. Payout System**
- Validates UPI ID format + limits
- Integrates with Razorpay API for instant transfers
- Handles retry logic for failed payouts

**5. Data Storage**
- PostgreSQL: Partners, claims, policies, transactions
- Redis: Session cache, real-time alert subscriptions
- S3: KYC documents (PAN, Aadhaar digests)

### Data Flow

```
Partner App
    ↓
[Onboarding] → FastAPI /auth/register
    ↓ (stores profile, KYC)
[Dashboard] ← API /partner/claims (fetches history)
    ↓ (renders claims)
[Alerts Screen] ← WebSocket connection (real-time risk updates)
    ↓ (listens for threshold breaches)
[Claim Triggered] ← Backend ML engine detects weather event
    ↓
Razorpay Payout → Partner UPI account
    ↓
App shows "Payout Sent ✓" in Claims timeline
```

---

## 🚀 Deployment

### Expo Managed Hosting
```bash
# Build + submit to App Stores
eas build --platform ios
eas build --platform android
eas submit                    # (requires EAS plan)
```

### Self-Hosted Web
```bash
# Build for web
npm run build
# Deploy to Vercel / Netlify
vercel deploy
```

---

## 📞 Support & Contact

**For backend API issues:** Contact SecInsure backend team (@backend)
**For design/UX feedback:** Reach out to product team (@product)
**For deployment help:** DevOps team (@devops)

---

## 📄 License

Proprietary - SecInsure Inc. All rights reserved.

---

**Built with ❤️ for the delivery community.**
