<div align="center">

<img src="https://img.shields.io/badge/-%F0%9F%9B%B5%20SecInsure-FF6B35?style=for-the-badge&labelColor=0d0d1a" alt="SecInsure" height="50"/>

# SecInsure
### *AI-Powered Parametric Income Insurance for Swiggy Delivery Partners*

**The first fully automatic micro-insurance platform that pays out before you even think to file a claim.**

[![FastAPI](https://img.shields.io/badge/FastAPI-009688?style=flat-square&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React_18-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev)
[![Python](https://img.shields.io/badge/Python_3.11-3776AB?style=flat-square&logo=python&logoColor=white)](https://python.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![XGBoost](https://img.shields.io/badge/XGBoost-F7931E?style=flat-square&logo=scikitlearn&logoColor=white)](https://xgboost.readthedocs.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?style=flat-square&logo=postgresql&logoColor=white)](https://postgresql.org)
[![Razorpay](https://img.shields.io/badge/Razorpay-02042B?style=flat-square&logo=razorpay&logoColor=white)](https://razorpay.com)

<br/>

> **Delhi 2024** - temperatures crossed **49°C for 45 continuous days.**
> Over **40,000 heatstroke cases** reported nationwide.
> Swiggy delivery partners earned **₹0 on those days.**
> And received **₹0 in compensation.**

<br/>

[**📌 Problem**](#-problem-statement) · [**💡 Solution**](#-solution-overview) · [**✨ Features**](#-key-features) · [**🏗 Architecture**](#-system-architecture) · [**⚡ Quick Start**](#-quick-start) · [**🎬 Demo**](#-demo-scenarios)

---

</div>

## 📌 Table of Contents

1. [Problem Statement](#-problem-statement)
2. [Who We're Building For - Our User Personas](#-who-were-building-for---our-user-personas)
3. [Solution Overview](#-solution-overview)
4. [Key Features](#-key-features)
5. [System Architecture](#-system-architecture)
6. [Tech Stack](#-tech-stack)
7. [Module Breakdown](#-module-breakdown)
   - [Auth & Onboarding](#1-auth--onboarding)
   - [Risk Profiling & Premium Calculation](#2-risk-profiling--premium-calculation)
   - [Policy Management](#3-policy-management)
   - [Disruption Monitoring](#4-disruption-monitoring)
   - [Claim Trigger & Validation](#5-claim-trigger--validation)
   - [Fraud Detection](#6-fraud-detection)
   - [Automated Payout Processing](#7-automated-payout-processing)
   - [Analytics & Dashboard](#8-analytics--dashboard)
   - [Admin Dashboard System](#-admin-dashboard-system)
8. [Adversarial Defense & Anti-Spoofing Strategy](#️-adversarial-defense--anti-spoofing-strategy)
9. [Coverage Tiers & Pricing](#-coverage-tiers--pricing)
10. [User Privileges](#-user-privileges)
11. [API Reference](#-api-reference)
12. [Database Schema](#-database-schema)
13. [App Flow](#app-flow)
14. [Project Structure](#-project-structure)
15. [Quick Start](#-quick-start)
16. [Environment Variables](#-environment-variables)
17. [Compliance & Constraints](#-compliance--constraints)
18. [Go-To-Market & Platform Partnership Strategy](#-go-to-market--platform-partnership-strategy)
19. [Impact & Roadmap](#-impact--roadmap)

---

## 🚨 Problem Statement

India has **15 lakh+ active monthly delivery partners** across Swiggy and Zomato. A full-time Swiggy partner in Delhi earns approximately **₹25,000/month (~₹5,800/week)** - all of it variable, tied entirely to orders completed.

When external disruptions hit, income collapses immediately:

| Disruption | Real-World Income Impact | Source |
|:-----------|:------------------------|:-------|
| 🌡️ **Extreme Heat** (>42°C) | Earnings drop **40%** vs normal days | IEG Delhi Study, 2024 |
| 🌧️ **Heavy Rain / Floods** | Order demand collapses; riders can't work safely | Ground reports |
| 🏭 **Severe Pollution** (AQI >300) | Reduced hours, health-forced stoppages | CPCB data |
| 🚫 **Curfews / Zone Shutdowns** | Complete inability to access pickup/drop zones | DDMA records |

**The math is brutal:** A 1°C rise in wet-bulb temperature cuts outdoor worker income by **19%**. During Delhi 2024's 45-day heatwave, income dropped to **zero on peak days**.

### The Gap

| Current Reality | What SecInsure Provides |
|:----------------|:------------------------|
| No income protection for environmental disruptions | Parametric income insurance triggered by real data |
| Manual claim processes - weeks of waiting | Automated, event-triggered payouts in < 10 minutes |
| Fixed premiums unrelated to actual risk | Dynamic ML-based weekly premiums |
| No gig-specific insurance products | Weekly premium cycle aligned to Swiggy's payment schedule |
| No fraud safeguards | 3-layer AI-powered anomaly detection |

Swiggy already offers accident and medical insurance. There is **zero protection against income loss caused by uncontrollable external disruptions.** Workers bear 100% of this risk, alone.

---

## 👥 Who We're Building For - Our User Personas

These are the three riders SecInsure was designed around. Every product decision traces back to one of them.

<table>
<tr>
<td width="33%" valign="top">

### 🧑 Raju, 28
**Full-Time Partner**<br/>
*South Delhi - Hauz Khas / Saket*

- Works 10-12 hours/day, 6 days/week
- Weekly income: ₹5,500-₹7,000
- Migrated from Bihar; sends money home monthly
- **Pain:** Lost 3 full working days in July 2024 monsoon floods. Earned ₹0. Still paid rent.
- **Need:** Automatic rain-triggered payout with zero paperwork - he doesn't have time to file claims between shifts.

-> **SecInsure fit:** Basic tier at ₹52/week. Rain trigger covers his worst days.

</td>
<td width="33%" valign="top">

### 👩 Meena, 34
**Part-Time Partner · Single Mother**<br/>
*East Delhi - Laxmi Nagar*

- Works 5-6 hours/day around school timings
- Weekly income: ₹3,000-₹4,500
- Stops working when AQI crosses 350 to protect her health
- **Pain:** Delhi's winter AQI regularly hits 400+. She loses 2-3 work days a week for months. No one compensates her.
- **Need:** Pollution-triggered protection with a premium she can actually afford on a part-time income.

-> **SecInsure fit:** Basic tier at <=₹45/week. AQI trigger gives her a floor when she has to stop.

</td>
<td width="33%" valign="top">

### 👦 Vikram, 22
**New Joiner**<br/>
*North Delhi - Rohini*

- Works variable hours; still building order history
- Weekly income: ₹3,500-₹4,000
- No savings buffer, no family support network in Delhi
- **Pain:** Any disruption - even a single washed-out day - immediately means skipping a meal or missing rent. Zero tolerance for income gaps.
- **Need:** The cheapest possible entry-level coverage with a dead-simple onboarding flow. No documents, no friction.

-> **SecInsure fit:** Basic tier, 2-minute PWA signup, ₹52/week cap. First payout builds trust.

</td>
</tr>
</table>

---

## 💡 Solution Overview

**SecInsure** is a full-stack AI-enabled parametric micro-insurance platform built exclusively for **Swiggy food delivery partners in Delhi**.

### How It Works (60-Second Flow)

```
Rider registers in <2 min  ->  AI risk profile from 3-month Swiggy order history
         ↓
Weekly premium shown & auto-deducted from Swiggy payout (every Monday)
         ↓
SecInsure monitors weather, AQI, traffic & govt alerts 24/7
         ↓
Threshold crossed (e.g., rain > 40mm in 3 hours)
         ↓
Claim auto-triggered  ->  3-layer fraud pipeline  ->  UPI credit in < 10 minutes
```

**No claims. No paperwork. No delays. No questions asked.**

Parametric insurance works on a simple principle: instead of proving your loss, you prove a measurable event happened. Rain crossed 40mm? Payout fires. AQI crossed 300? Same. You focus on survival - we handle the rest.

---

## ✨ Key Features

### ✅ Core 

- **AI-Powered Risk Assessment** - Dynamic weekly premium based on zone, delivery history, and environmental risk index
- **5-Trigger Parametric Engine** - Real-time monitoring (rain, heat, AQI, curfew, traffic) with zero-touch claim initiation
- **3-Layer Fraud Detection** - Device signals, location consistency, geospatial ring detection
- **Instant UPI Payout** - Razorpay sandbox integration; < 10 min from trigger to credit
- **Dual Dashboard** - Rider live view + Admin ops panel (loss ratio, zone heatmap, 7-day ML forecast)

### 🚀 Differentiators

- **Shield Pool** - Ring-fenced corpus for sustained crisis payouts (20+ disruption days/month); zero cross-subsidisation
- **Pre-Trigger GPS Continuity** - Requires 20+ minutes of zone presence before trigger; blocks teleportation fraud
- **Trust Score System** - Cumulative clean-claim history raises fraud threshold; honest riders protected
- **Population-Level Ring Detection** - Flags coordinated fraud syndicates at the cohort level, not just individuals
- **PWA Architecture** - Works on low-end 4G Androids; no Play Store install; 2-minute setup

---

## 🏗 System Architecture

<img width="1024" height="1024" alt="image" src="https://github.com/user-attachments/assets/5cf7de72-cf3d-4184-9907-912ed56f487f" />

---

## 🛠️ Tech Stack

### Frontend

| Technology | Purpose |
|:-----------|:--------|
| React Native | Worker PWA and Admin Dashboard |
| Tailwind CSS | Utility-first styling |
| React-Leaflet + OpenStreetMap | Delhi zone map and disruption heatmap |
| Lucide React | Icon system |

### Backend

| Technology | Purpose |
|:-----------|:--------|
| FastAPI (Python 3.11) | AI/ML Risk Engine, Fraud Detection, Disruption Monitor |
| FastAPI | API Gateway, Auth, Swiggy platform simulator |
| PostgreSQL (Supabase) | Core data: users, policies, claims |
| Redis | Session cache, trigger deduplication (TTL 72h) |
| Kafka | High-throughput event streaming for trigger pipeline (planned - Phase 3) |

### AI / ML

| Technology | Purpose |
|:-----------|:--------|
| XGBoost Regressor | Dynamic premium risk scoring |
| XGBoost Classifier | Fraud probability (Stage 2 pipeline) |
| Isolation Forest (scikit-learn) | Behavioral fraud anomaly detection (Stage 1 pipeline) |
| NumPy / Pandas | Feature engineering, geospatial clustering variance |
| Rule-based disruption forecasting | 7-day zone risk prediction (ML upgrade in Phase 3) |

### Integrations

| Service | Usage |
|:--------|:------|
| [OpenWeatherMap](https://openweathermap.org/api) | Real-time weather (rain, temperature) |
| [OpenAQ](https://openaq.org) | PM2.5 / AQI levels (free, open-source) |
| [TomTom Traffic](https://developer.tomtom.com) | Zone-level traffic blockage detection |
| [data.gov.in / DDMA](https://data.gov.in) | Government curfew and emergency alerts |
| [Razorpay Sandbox](https://razorpay.com) | UPI and bank payout processing |

**Why PWA over native?** Swiggy partners already use mobile browsers. Zero Play Store friction. Runs on low-end 4G Androids with 2-minute setup.

---

## 🔬 Module Breakdown

### 1. Auth & Onboarding

**Purpose:** Register delivery workers in under 2 minutes with Swiggy ID and Aadhaar identity verification.

**Data Collected:**
- Swiggy Partner ID (verified against Swiggy's system via backend call)
- Aadhaar number + OTP (mock UIDAI verification)
- UPI ID linked to Swiggy bank account
- Bank account holder name

**System Actions:**

```
1. Swiggy Partner ID -> backend verification -> zone auto-detected from GPS history
2. Aadhaar OTP sent -> mock UIDAI validation -> identity confirmed
3. Session token issued via API Gateway
4. User & Policy Engine pulls 3-month order history from Swiggy Systems
5. Risk profile computed -> policy created -> stored in PostgreSQL
6. Weekly premium displayed in-app before first deduction
```

**Verification States:**

```
PENDING_OTP -> OTP_VERIFIED -> RISK_PROFILING -> POLICY_CREATED -> ACTIVE
                                                      ↓
                                               FAILED (with reason code)
```

**API Endpoints:**

```http
POST   /api/v1/register                  # Initiate registration + zone detection
POST   /api/v1/auth/verify-aadhaar       # OTP-based Aadhaar verify (mock UIDAI)
GET    /api/v1/auth/verification-status  # Poll onboarding status
```

---

### 2. Risk Profiling & Premium Calculation

**Purpose:** Build an AI-driven risk profile for each worker to compute fair, personalized weekly premiums.

**Risk Factors:**

| Factor | Weight | Data Source |
|:-------|:------:|:-----------|
| Delivery zone (location multiplier) | 25% | Swiggy GPS history |
| Historical rain frequency in zone | 20% | OpenWeatherMap historical |
| Average AQI in zone | 20% | OpenAQ |
| Extreme heat days per year | 20% | IMD climate data |
| Worker's 3-month order completion rate | 10% | Swiggy data pull |
| Curfew / strike frequency in zone | 5% | data.gov.in |

**Premium Formula:**

```python
# Disruption probability per zone (weighted composite)
Pd = (0.30 × P_rain) + (0.20 × P_heat) + (0.25 × P_aqi) + (0.15 × P_traffic) + (0.10 × P_curfew)

# Expected loss
EL = Weekly_Income × Coverage_Ratio × Pd

# Weekly premium per tier (hard-capped as % of weekly income)
Basic:   min(EL × location_multiplier × 1.4,  1.5% × Weekly_Income)  # -> cap ~₹63/week
Plus:    min(EL × location_multiplier × 1.6,  2.5% × Weekly_Income)  # -> cap ~₹105/week
Shield:  min(EL × location_multiplier × 1.8,  4.0% × Weekly_Income)  # -> cap ~₹168/week
```

**API Endpoints:**

```http
POST   /api/v1/risk/profile             # Generate risk profile from 3-month history
GET    /api/v1/risk/premium-quote       # Get per-tier premium recommendation
GET    /api/v1/admin/forecast/{zone}    # 7-day ML disruption probability forecast
GET    /api/v1/admin/premium-adjustments  # Recommended premium changes per zone
```

---

### 3. Policy Management

**Purpose:** Create, manage, renew, and suspend insurance policies aligned to Swiggy's Monday payment cycle.

**Policy Object:**

```json
{
  "policy_id": "SI-POL-2024-00892",
  "worker_id": "uuid",
  "tier": "Plus",
  "weekly_premium": 95.00,
  "coverage_ratio": 0.6,
  "location_multiplier": 1.1,
  "coverage_start": "2024-11-04",
  "renewal_day": "Monday",
  "covered_disruptions": ["heavy_rain", "extreme_heat", "severe_aqi", "curfew", "traffic_shutdown"],
  "status": "ACTIVE",
  "auto_renew": true,
  "shield_pool_contribution": 0.05
}
```

**Policy Lifecycle:**

```
DRAFT -> ACTIVATED -> ACTIVE -> SUSPENDED (payment failed -> 48h grace period)
                           ↓
                     REACTIVATED (within 30 days, no re-KYC)
                           ↓
                     TERMINATED
```

**Key Rules:**
- Tier can be upgraded or downgraded **once per billing cycle**
- Shield tier requires Shield pool corpus > **₹5L** before it unlocks (~12 weeks post-launch)
- Premium auto-deducted from Swiggy weekly payout with platform consent

**API Endpoints:**

```http
POST   /api/v1/policies/create           # Activate new policy
GET    /api/v1/policies/:workerId         # Get active policy details
PUT    /api/v1/policies/:id/upgrade       # Change tier (once per cycle)
GET    /api/v1/policies/:id/history       # Renewal and claim timeline
POST   /api/v1/admin/apply-premium-adjustment/{zone}  # Apply ML-recommended change
```

---

### 4. Disruption Monitoring

**Purpose:** Continuously poll real-world data sources and fire trigger events the moment thresholds are crossed.

**Monitored Parameters:**

| Disruption | Trigger Threshold | Data Source | Poll Interval |
|:-----------|:-----------------|:-----------|:-------------|
| 🌧️ Heavy Rainfall | >40mm in 3 hours | OpenWeatherMap | 15 min |
| 🌡️ Extreme Heat | >43°C wet-bulb adjusted | OpenWeatherMap | 15 min |
| 🏭 Severe Pollution | AQI >300 (PM2.5) | OpenAQ | 15 min |
| 🚫 Curfew / Emergency | DDMA alert issued | data.gov.in | 5 min |
| 🚦 Traffic Shutdown | Cluster blockage >2 hours | TomTom | 10 min |

**Disruption Event Object:**

```json
{
  "event_id": "EVT-2024-DL-004421",
  "disruption_type": "heavy_rain",
  "severity": "HIGH",
  "affected_zones": ["hauz_khas", "saket", "south_delhi"],
  "start_time": "2024-07-15T14:30:00Z",
  "end_time": null,
  "raw_value": "52.3mm in 3h",
  "data_source": "openweathermap",
  "status": "ACTIVE"
}
```

**Monitoring Cron (Python):**

```python
# scheduler.py - runs every 15 minutes
async def monitor_cycle():
    weather  = await fetch_weather_all_zones()   # OpenWeatherMap
    aqi      = await fetch_aqi_all_zones()       # OpenAQ
    curfew   = await fetch_ddma_alerts()         # data.gov.in
    traffic  = await fetch_tomtom_clusters()     # TomTom

    for zone in active_zones:
        events = evaluate_thresholds(zone, weather, aqi, curfew, traffic)
        for event in events:
            await claims_service.auto_trigger(event)  # fire claim pipeline
```

---

### 5. Claim Trigger & Validation

**Purpose:** Automatically trigger and validate claims the moment a covered disruption occurs - zero rider action required.

**Auto-Trigger Flow:**

```
DisruptionEvent fires
        ↓
Find all ACTIVE policies in affected zones
        ↓
For each eligible worker:
  -> Policy status = ACTIVE AND next_renewal >= CURRENT_DATE (premium is current)
  -> GPS continuity: rider in zone >=20 min pre-trigger
  -> No duplicate claim (Redis SET: claim:{worker_id}:{event_id}, TTL 72h)
  -> Worker not actively completing deliveries during trigger window
        ↓
ClaimRequest auto-created -> forward to Fraud Detection Pipeline
```

**Validation Checks:**

| Check | Method | Pass Condition |
|:------|:-------|:--------------|
| Event Active | Disruption event in DB with status=ACTIVE | Threshold confirmed |
| GPS Continuity | Pre-trigger 30-min GPS history | In zone >=20 min before trigger |
| Duplicate Guard | Redis TTL key lookup | Key absent (first claim for this event) |
| Policy Eligibility | PostgreSQL query | status=ACTIVE AND next_renewal >= CURRENT_DATE |
| Home Distance Score | Haversine(home_coords, gps_last) | Reasonable distance from home |

**Claim Object:**

```json
{
  "claim_id": "SI-CLM-2024-00041",
  "worker_id": "uuid",
  "policy_id": "SI-POL-2024-00892",
  "event_id": "EVT-2024-DL-004421",
  "disruption_type": "heavy_rain",
  "claim_date": "2024-07-15",
  "payout_amount": 150.00,
  "claim_status": "PENDING_FRAUD_CHECK",
  "auto_triggered": true,
  "created_at": "2024-07-15T14:31:00Z"
}
```

**API Endpoints:**

```http
POST   /api/v1/weather-trigger?user_id={uuid}  # System: check + trigger
GET    /api/v1/claims/:workerId                  # Rider's claim history
GET    /api/v1/claims/:id/status                 # Single claim status
PUT    /api/v1/claims/:id/review                 # Admin manual review
```

---

### 6. Fraud Detection

**Purpose:** Prevent fraudulent claims using a 3-layer sequential validation pipeline. Every claim passes all three layers before a single rupee moves.

A GPS-spoofing syndicate can fake coordinates inside a triggered zone. Simple coordinate checks can't stop this. Our defense operates at device, behavioral, and population levels simultaneously.

The fraud pipeline is a two-stage ML architecture: Stage 1 (Isolation Forest) computes a per-claim `anomaly_score` from device and GPS signals. That `anomaly_score` then feeds directly as an input feature into Stage 2 (XGBoost classifier), so individual device anomalies compound group-level ring signals into a single fraud probability. This means a rider whose device looks borderline suspicious AND whose peer cluster is behaving abnormally gets a higher combined score than either signal alone would produce.

<img width="1536" height="1024" alt="image" src="https://github.com/user-attachments/assets/841f491f-5a7a-4e21-ab1a-6727b35e3a39" />

#### Layer 1 - Device Signal Validator

```python
def validate_device_signals(device_data: DeviceData) -> LayerResult:
    flags = []

    # Android isFromMockProvider() / iOS CLLocation accuracy flags
    if device_data.is_mock_provider:
        flags.append("MOCK_GPS_DETECTED")

    # IMU stillness - real riders in storms have motion
    if device_data.accelerometer_variance < 0.02:
        flags.append("IMU_STILLNESS_DETECTED")

    # Battery delta - spoofing apps are power-hungry
    if device_data.battery_drain_per_hour > 18.0:
        flags.append("ELEVATED_BATTERY_DRAIN")

    return LayerResult(flags=flags, passed=len(flags) == 0)
```

#### Layer 2 - Location Consistency Check

```python
def validate_location_consistency(worker_id, claim_window) -> LayerResult:
    gps_trace   = get_gps_history(worker_id, minutes=30)
    cell_towers = get_cell_tower_ids(worker_id, claim_window)
    wifi_bssids = get_wifi_bssids(worker_id, claim_window)
    flags = []

    # Was the rider already in zone before the trigger fired?
    if not in_zone_20_min_pre_trigger(gps_trace, claim_window.zone):
        flags.append("NO_PRE_TRIGGER_CONTINUITY")   # teleported at trigger moment

    # Cell tower and Wi-Fi BSSID must match GPS coordinates
    if not towers_match_gps(cell_towers, gps_trace):
        flags.append("CELL_TOWER_MISMATCH")

    if not bssids_match_gps(wifi_bssids, gps_trace):
        flags.append("WIFI_BSSID_MISMATCH")

    # Stationary near home with no movement history today
    home_dist = haversine(worker.home_coords, gps_trace[-1])
    if home_dist < 0.5 and not has_movement_history_today(worker_id):
        flags.append("STATIONARY_NEAR_HOME")

    return LayerResult(flags=flags, passed=len(flags) == 0)
```

#### Layer 3 - Population Anomaly Model

```python
def detect_ring_fraud(event_id: str, claim_batch: List[Claim]) -> LayerResult:
    coords = [(c.lat, c.lon) for c in claim_batch]

    # Real crises: workers spread across routes - low geographic variance is a ring signal
    geo_std = np.std(coords, axis=0).mean()
    if geo_std < RING_CLUSTER_THRESHOLD:
        return LayerResult(flags=["GEOSPATIAL_RING_DETECTED"], passed=False)

    # Real workers get stranded at different moments; rings trigger simultaneously
    timestamps  = [c.created_at.timestamp() for c in claim_batch]
    sync_score  = detect_temporal_synchronisation(timestamps)
    if sync_score > 0.85:
        return LayerResult(flags=["TEMPORAL_SYNC_RING"], passed=False)

    # Referral chains, activation timestamp clusters, shared device fingerprints
    graph_score = score_social_graph(claim_batch)
    if graph_score > SOCIAL_GRAPH_THRESHOLD:
        return LayerResult(flags=["SOCIAL_GRAPH_RING"], passed=False)

    return LayerResult(flags=[], passed=True)
```

#### Decision Matrix

| Fraud Score | System Action | Rider Experience |
|:------------|:-------------|:----------------|
| ✅ Low (< 0.3) | Auto-approve -> payout | No disruption |
| 🟡 Medium (0.3-0.6) | Hold <=2h, passive re-verify | *"Payout processing - no action needed"* |
| 🚩 High (0.6-1.0) | Withheld, one-tap confirm | *"Signal issue - tap to confirm location"* |
| ❌ Confirmed fraud | Denied + manual review | Formal notification + 7-day appeal window |

**Key principles:** No silent denial. 5-minute GPS drop grace period (interpolation). Trust score cumulative - 6+ months clean history raises baseline.

---

### 7. Automated Payout Processing

**Purpose:** Credit approved claim amounts to the rider's UPI within < 10 minutes of trigger.

**Payout Amounts by Tier:**

| Trigger | Basic | Plus | Shield |
|:--------|:------|:-----|:-------|
| Heavy Rainfall | ₹120-₹150 | ₹150-₹200 | ₹150-₹200 |
| Extreme Heat | ₹80-₹120 | ₹120-₹160 | ₹120-₹160 |
| Severe Pollution | ₹80-₹120 | ₹120-₹160 | ₹120-₹160 |
| Curfew / Emergency | ₹150-₹200 | ₹200-₹250 | ₹200-₹250 |
| Traffic Shutdown | ₹100 | ₹130 | ₹130 |
| Extended disruption (2+ weeks) | ❌ | ₹500-₹800 one-time | ₹500-₹800 one-time |
| Sustained crisis (20+ days/30-day window) | ❌ | ❌ | ₹3,000-₹5,000 one-time |

**Payout Flow:**

```
Claim APPROVED (all 3 fraud layers passed)
        ↓
Validate UPI ID format (username@provider)
        ↓
Razorpay Payout API call -> UPI transfer to rider's linked account
        ↓
Update claim status -> PAID
        ↓
Redis: set dedup key (prevent double-payout for same worker + event)
        ↓
Notify rider: SMS + In-App AlertBanner + UPI credit notification
```

**API Endpoints:**

```http
GET    /api/v1/payout/:id/status        # Transaction status
POST   /api/v1/payout/:id/retry         # Retry failed payout
POST   /api/v1/payouts/webhook          # Razorpay payout webhook
```

---

### 8. Analytics & Dashboard

**Purpose:** Full operational visibility for admins; clear coverage status for riders.

#### Rider Dashboard

| Widget | Data Shown |
|:-------|:-----------|
| Coverage Status Card | Active tier, weekly premium, next Monday renewal |
| Protected Income | ₹ value covered this billing cycle |
| Live Risk Meter | Real-time zone risk score (0-100) |
| Claims Timeline | All claims with status, type, and payout |
| Disruption Feed | Active events in your delivery zone |
| 7-Day Forecast | ML disruption probability, day by day |

#### Admin Dashboard

| Widget | Data Shown |
|:-------|:-----------|
| Policy Count | Active, suspended, new this week |
| Claims Monitor | Auto vs manual breakdown, live status |
| Payout Disbursed | Daily / weekly / monthly totals |
| Loss Ratio | Premiums collected / payouts (target: 60-65%) |
| Fraud Alerts | Real-time flagged accounts, ring detection events |
| Zone Risk Heatmap | Leaflet.js zone-level disruption intensity |
| 7-Day Zone Forecasts | ML disruption prediction per zone |
| Premium Adjustments | Recommended changes based on forecast |

---

## 🛡️ Adversarial Defense & Anti-Spoofing Strategy

> **Threat context:** A coordinated syndicate of 500 workers, organizing via Telegram, uses GPS-spoofing apps to fake zone presence during red-alert weather events - draining the liquidity pool while sitting safely at home.

Our 3-layer fraud pipeline (Module 6) was already designed with this vector in mind. This section explains specifically how it defeats a **coordinated, app-level GPS spoof** - not just individual fraud.

---

### 1. Differentiation: Real Stranded Rider vs. Home Spoofer

A GPS coordinate is the easiest thing to fake. We don't trust it alone. We cross-validate it against signals that a spoofing app **cannot simultaneously fabricate**:

| Signal | Real Stranded Rider | Home Spoofer |
|:-------|:-------------------|:-------------|
| **Cell tower IDs** | Match delivery zone towers | Match home neighbourhood towers |
| **WiFi BSSIDs** | Unknown/changing access points | Home router BSSID (stable, known) |
| **IMU (accelerometer)** | Vehicle vibration, rain-motion profile | Flat - phone sitting on a table |
| **Swiggy app events** | Recent order attempts, rejections, navigation | No app activity - session idle |
| **GPS-to-cell delta** | < 300m variance | > 1km variance (GPS says Hauz Khas, cell says Rohini) |
| **Battery drain rate** | Normal | Elevated (spoofing apps run a second GPS process) |
| **Signal strength pattern** | Fluctuating (moving through zone) | Stable (stationary indoors) |

A spoofer can fake their GPS. They cannot simultaneously:
- Fake their cell tower handoffs
- Fake their home WiFi disappearing
- Fake IMU motion consistent with a vehicle in a storm
- Fake Swiggy session activity showing real order attempts

**Conviction requires corroboration across >=3 independent signal types.** Failing one signal triggers a hold, not a denial.

---

### 2. Data Points for Coordinated Ring Detection

Individual fraud checks miss syndicate-level attacks. Layer 3 operates at the **cohort level** for every trigger event:

**Signal A - Geospatial Clustering Variance**
Real workers caught in a disruption spread across delivery routes. A ring teleporting to the same zone shows abnormally low GPS coordinate variance. Threshold: `np.std(coords) < RING_CLUSTER_THRESHOLD` flags the batch.

**Signal B - Temporal Synchronisation Score**
Real workers get stranded at different moments. A Telegram-coordinated ring activates simultaneously. We compute a sync score across claim submission timestamps. Score > 0.85 = ring flag.

**Signal C - Social Graph Density**
- Shared device fingerprints across accounts
- Account activation timestamp clustering (bulk registrations within narrow windows)
- Referral chain depth (accounts that onboarded together)
- Shared IP subnet at registration time

**Signal D - Behavioural Baseline Deviation**
Workers in the ring are often **new or previously inactive**. A sudden first-ever claim from 200 accounts with no prior delivery activity in a triggered zone is a statistical anomaly scored by Isolation Forest.

**Signal E - Cross-Event Persistence**
If the same cluster of accounts appears across multiple unrelated trigger events in different zones over time, their combined social graph score compounds. One coincidence is noise. Three is a syndicate.

All five signals feed a single ring score per event batch. Partial ring matches (e.g., B + C positive but A negative) route to manual review rather than auto-denial.

---

### 3. UX Balance: Protecting Honest Workers During Network Drops

Bad weather causes real GPS degradation. A stranded worker in a storm **will** have signal drops. Our system is designed so that honest workers never experience this as punishment:

**Grace Period & Interpolation**
If GPS signal drops for <=5 minutes during an active trigger window, the system interpolates position from last known coordinates + cell tower fallback. No flag is raised. This is the expected behaviour in a storm.

**Transparent Hold, Not Silent Denial**
A medium fraud score (0.3-0.6) never shows "flagged" or "suspected fraud" to the rider. The message is: *"Payout processing - signal verification in progress. No action needed."* Hold window: <=2 hours.

**One-Tap Confirm for High Scores**
A high fraud score (0.6-1.0) asks for a single passive confirmation: *"Tap to confirm you're in [zone name]."* This is a 2-second action, not a paperwork request. It also generates a fresh GPS + cell tower sample at confirmation time - which a home spoofer cannot pass.

**Trust Score Protection**
Workers with 6+ months of clean claim history have a raised fraud threshold baseline. They are the least likely to be false-positived and the most protected against network-drop false flags.

**7-Day Appeal Window**
Any denied claim generates a plain-language notification and a one-tap appeal. Appeals go to admin review with the full signal log - not a black box.

**The principle:** A genuine worker in a storm should experience nothing except a payout arriving. Friction only appears when signals are genuinely inconsistent - and even then, it's a single tap, not a form.

---

## 💰 Coverage Tiers & Pricing

> **How premiums work:** There are no fixed prices. Every rider's premium is computed dynamically each Monday using the risk formula in [Module 2](#2-risk-profiling--premium-calculation), driven by their zone's real-time disruption probability and their own weekly income. The XGBoost model outputs a risk score (0-1) which maps to a base premium in the ₹49-₹89 range - ₹49 at minimum disruption risk, ₹89 at maximum. The tier then applies an **affordability ceiling** as a hard cap: if the model output exceeds it, the cap wins. A rider earning ₹3,000/week on Basic pays less than one earning ₹6,000/week - same tier, different formula output. In practice, most Delhi riders land in the ₹49-₹63 range on Basic, well below the cap.

```
┌────────────────────────────────────────────────────────────────────────────┐
│                            SECINSURE PLANS                                 │
├────────────────┬────────────────────┬────────────────────┬─────────────────┤
│ Feature        │  🟢 BASIC           │  🔵 PLUS            │  🛡️ SHIELD       │
├────────────────┼────────────────────┼────────────────────┼─────────────────┤
│ Weekly Premium │ Dynamic · cap <=₹63│ Dynamic · cap <=₹120│ Dynamic · cap <=₹200│
│ Affordability  │ 1.5% of income     │ 2.5% of income     │ 4% of income    │
│ Payout/Event   │ ₹80-₹200           │ ₹120-₹250          │ ₹120-₹250       │
│ Extended       │ ❌                  │ ₹500-₹800          │ ₹500-₹800       │
│ Crisis Lump    │ ❌                  │ ❌                  │ ₹3,000-₹5,000   │
│ Response       │ < 10 minutes       │ < 10 minutes       │ < 10 minutes    │
│ Pool           │ Main pool          │ Main pool          │ Ring-fenced     │
└────────────────┴────────────────────┴────────────────────┴─────────────────┘
```

**Example at ₹4,200/week income (typical Basic rider):**
- Formula output: `EL × 1.1 × 1.4 = ~₹52/week`
- Affordability cap: `1.5% × ₹4,200 = ₹63`
- Actual premium charged: **₹52** (formula wins - it's below the cap)

**Example at peak monsoon risk (same rider, high-risk week):**
- Formula output might rise to `~₹61/week`
- Cap is still ₹63 - premium adjusts up but stays affordable
- Rider sees the new amount in-app every Monday before deduction

**Shield Pool:** 5% of all Shield premiums ring-fenced. Tier unlocks only after corpus > ₹5L (~12 weeks). Zero cross-subsidisation.

**Sustained crisis trigger (Shield only):** 20+ disruption days in a 30-day window OR state-level emergency exceeding 15 continuous days. Fully parametric - no discretion, automatic.

---

## 👤 User Privileges

### 1. Delivery Worker (Rider)
- Self-registers via PWA (< 2 minutes)
- Verifies via Swiggy Partner ID + Aadhaar OTP
- Selects tier; premium auto-deducted from Swiggy weekly payout
- Views live risk score, disruption alerts, and claim timeline
- Receives automatic payouts - no action required
- Can dispute denied claims within 7-day appeal window

### 2. Insurance Admin
- Full system access and threshold configuration
- Sets zone-level risk parameters and premium bands
- Views all claims, payouts, fraud alerts, and loss ratios
- Reviews hard-flagged fraud cases and ring detections
- Manages Shield pool corpus visibility and tier unlock
- Generates actuarial and compliance reports

---

## 📡 API Reference

### Register a Partner

```http
POST /api/v1/register
Content-Type: application/json

{
  "name": "Raju Kumar",
  "swiggy_partner_id": "SGP123456",
  "aadhaar_number": "123412341234",
  "zone": "Delhi NCR",
  "weekly_income": 5500,
  "upi_id": "raju@paytm",
  "bank_account_holder_name": "Raju Kumar"
}
```

**Response:** User object with computed risk profile, risk category, and weekly premium per tier.

### Check Live Conditions + Trigger Claim

```http
POST /api/v1/weather-trigger?user_id={uuid}

# Response
{
  "user_id": "uuid",
  "risk_score": 74.2,
  "weather_data": {
    "temperature": 44.1,
    "rainfall": 0.0,
    "aqi": 180.0,
    "traffic": 0.3,
    "curfew_active": false
  },
  "triggered": true,
  "trigger_type": "extreme_heat",
  "payout_amount": 120.00,
  "payout_details": {
    "payout_id": "pout_abc123def456",
    "status": "processed",
    "upi_id": "raju@paytm",
    "processing_time_minutes": 4.7,
    "expected_completion": "2024-07-15T15:02:00Z",
    "reference_id": "secinsure_a1b2c3d4"
  }
}
```

### Admin Endpoints

```http
GET    /api/v1/admin/stats                             # Business KPIs (workers, revenue, loss ratio)
GET    /api/v1/admin/forecast/{zone}                   # 7-day ML disruption probability
GET    /api/v1/admin/fraud-alerts                      # Flagged accounts and ring events
GET    /api/v1/admin/premium-adjustments               # ML-recommended premium changes
POST   /api/v1/admin/apply-premium-adjustment/{zone}   # Apply adjustment to all zone policies
```

Full interactive docs at **`http://localhost:8000/docs`** (Swagger UI).

---

## 🗄 Database Schema

### Workers

```sql
CREATE TABLE workers (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  swiggy_partner_id        VARCHAR(20)   UNIQUE NOT NULL,
  name                     VARCHAR(100)  NOT NULL,
  aadhaar_hash             VARCHAR(64),          -- SHA-256, never plain text
  zone                     VARCHAR(50)   NOT NULL,
  weekly_income            DECIMAL(10,2) NOT NULL,
  upi_id                   VARCHAR(50),
  bank_account_holder_name VARCHAR(100),
  kyc_status               VARCHAR(20)   DEFAULT 'pending',
  current_status           VARCHAR(20)   DEFAULT 'Safe',
  risk_score               FLOAT,
  risk_profile             JSONB,                -- 3-month order analysis
  trust_score              FLOAT DEFAULT 0.5,    -- cumulative clean-claim bonus
  created_at               TIMESTAMP DEFAULT now()
);
```

### Policies

```sql
CREATE TABLE policies (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id            UUID REFERENCES workers(id),
  tier                 VARCHAR(10)  NOT NULL,    -- basic, plus, shield
  weekly_premium       DECIMAL(8,2) NOT NULL,
  coverage_ratio       FLOAT DEFAULT 0.6,
  location_multiplier  FLOAT DEFAULT 1.1,
  coverage_start       DATE NOT NULL,
  next_renewal         DATE NOT NULL,            -- always next Monday; used to verify premium is current
  status               VARCHAR(20) DEFAULT 'active',
  auto_renew           BOOLEAN DEFAULT TRUE,
  covered_disruptions  JSONB,
  shield_contribution  FLOAT DEFAULT 0.0,        -- set to 0.05 at policy creation for Shield tier; 0.0 for Basic/Plus
  created_at           TIMESTAMP DEFAULT now()
);
```

### Claims

```sql
CREATE TABLE claims (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id        UUID REFERENCES workers(id),
  policy_id        UUID REFERENCES policies(id),
  event_id         VARCHAR(50) NOT NULL,
  disruption_type  VARCHAR(50) NOT NULL,
  claim_date       DATE NOT NULL,
  payout_amount    DECIMAL(8,2),
  status           VARCHAR(30) DEFAULT 'triggered',
  -- status values: triggered, pending_fraud_check, approved, rejected, paid
  fraud_score      FLOAT,
  fraud_flags      JSONB,
  auto_triggered   BOOLEAN DEFAULT TRUE,
  payout_id        VARCHAR(50),                  -- Razorpay payout ID
  payout_status    VARCHAR(20) DEFAULT 'pending',
  upi_id           VARCHAR(50),
  processing_time_minutes FLOAT,
  expected_completion TIMESTAMP,
  completed_at     TIMESTAMP,
  failure_reason   TEXT,
  created_at       TIMESTAMP DEFAULT now()
);
```

### Disruption Events

```sql
CREATE TABLE disruption_events (
  id               VARCHAR(50) PRIMARY KEY,
  disruption_type  VARCHAR(50) NOT NULL,
  severity         VARCHAR(10),                  -- LOW, MEDIUM, HIGH
  affected_zones   JSONB,
  raw_value        VARCHAR(100),                 -- e.g. "52.3mm in 3h"
  data_source      VARCHAR(50),
  start_time       TIMESTAMP NOT NULL,
  end_time         TIMESTAMP,
  status           VARCHAR(20) DEFAULT 'active'
);
```

### Live Conditions (Redis-backed cache)

```sql
CREATE TABLE live_conditions (
  id            INTEGER PRIMARY KEY,
  temperature   FLOAT,
  rainfall      FLOAT,
  aqi           FLOAT,
  traffic       FLOAT,
  curfew_active BOOLEAN DEFAULT FALSE,
  risk_score    FLOAT,
  updated_at    TIMESTAMP DEFAULT now()
);
```

---

## ⚙️ App Flow

```
[CRON: Every 15 minutes]
          │
          ▼
┌───────────────────────────┐
│   DisruptionMonitor       │
│   fetch_weather()         │ <- OpenWeatherMap
│   fetch_aqi()             │ <- OpenAQ
│   fetch_ddma_alerts()     │ <- data.gov.in
│   fetch_tomtom_traffic()  │ <- TomTom
└──────────┬────────────────┘
           │ threshold crossed in zone
           ▼
┌───────────────────────────┐
│   Create DisruptionEvent  │
│   event_id, zones,        │
│   severity, raw_value     │
└──────────┬────────────────┘
           │
           ▼
┌───────────────────────────┐
│   Find Eligible Workers   │
│   • Active policy         │
│   • In affected zone      │
│   • GPS continuity >=20min│
│   • No Redis dedup key    │
└──────────┬────────────────┘
           │
           ▼
┌───────────────────────────┐     ┌───────────────────────────────────┐
│   ClaimsService           │────▶│  FraudDetector (3 Layers)         │
│   auto_trigger_claims()   │     │  L1: Device Signals               │
└───────────────────────────┘     │  L2: Location Consistency         │
                                  │  L3: Population Anomaly (ML)      │
                                  └────────────────┬──────────────────┘
                                                   │
                     ┌─────────────────────────────┼────────────────────────┐
                     │                             │                        │
               Score < 0.3                   Score 0.3-0.6           Score > 0.6
                     │                             │                        │
                     ▼                             ▼                        ▼
          ┌─────────────────┐          ┌────────────────────┐  ┌─────────────────────┐
          │  PayoutService  │          │  Hold <=2h          │  │  Block + Manual      │
          │  Razorpay UPI   │          │  Passive re-verify  │  │  Review + 7d Appeal  │
          │  < 10 minutes   │          └────────────────────┘  └─────────────────────┘
          └────────┬────────┘
                   │
                   ▼
          ┌─────────────────┐
          │  Notify Rider   │
          │  SMS + In-App   │
          │  UPI credit alrt│
          └─────────────────┘
```

---

## 🗂 Project Structure

```
secinsure/
├── project/
│   ├── src/                              # React TypeScript frontend
│   │   ├── components/
│   │   │   ├── Register.tsx              # 2-min onboarding (Swiggy ID + Aadhaar)
│   │   │   ├── Dashboard.tsx             # Rider live view (risk, claims, forecast)
│   │   │   ├── AdminDashboard.tsx        # Business intelligence panel
│   │   │   ├── AadhaarVerification.tsx   # OTP mock flow
│   │   │   ├── MapView.tsx               # Leaflet Delhi zone map
│   │   │   ├── RiskMeter.tsx             # Live 0-100 risk gauge
│   │   │   ├── MonitoringPanel.tsx       # Temp / rain / AQI / traffic readouts
│   │   │   ├── AlertBanner.tsx           # Instant payout notification banner
│   │   │   ├── PayoutHistory.tsx         # Claim timeline with amounts
│   │   │   └── PremiumPayment.tsx        # Razorpay mock payment UI
│   │   └── types/index.ts                # Shared TypeScript types
│   ├── public/
│   │   ├── manifest.json                 # PWA manifest
│   │   └── sw.js                         # Service worker (offline cache)
│   │
│   ├── python_backend/
│   │   └── app/
│   │   |   ├── main.py                   # FastAPI app + CORS middleware
│   │   |   ├── database.py               # SQLAlchemy models + get_db()
│   │   |   ├── models.py                 # Pydantic request/response schemas
│   │   |   ├── ml_service.py             # Risk scoring + trigger detection
│   │   |   ├── payout_service.py         # Razorpay UPI integration (mock)
│   │   |   ├── fraud_detection.py        # 3-layer fraud pipeline
│   │   |   ├── forecast_service.py       # 7-day ML disruption forecasting
│   │   |   └── routers/
│   │   |       ├── register.py           # POST /api/v1/register
│   │   |       ├── weather_trigger.py    # POST /api/v1/weather-trigger
│   │   |       ├── payout.py             # GET/POST /api/v1/payout
│   │   |       └── admin.py              # GET /api/v1/admin/*
│   │
│   ├── ml/
│   │   ├── data/                         # Datasets
│   │   |       ├── fraud_train.csv
│   │   |       ├── premium_train.csv            
│   │   ├── models/                       # Models
│   │   |       ├── fraud_isolation_forest.joblib
│   │   |       ├── fraud_scaler.joblib
│   │   |       ├── fraud_xgb.joblib
│   │   |       ├── premium_encoder.joblib
│   │   |       ├── premium_model.joblib
│   |   ├── data_generator.py
│   |   ├── fraud_model.py
│   |   ├── ml_router.py
│   |   ├── premium_model.py
│   |   └── requirements.txt
|   |
│   ├── delivery-api/
│   |   ├── index.js                      # Swiggy platform simulator (Express)
│   |   ├── package.json
│   |   ├── main.py
│   |   ├── server.js
│   |   └── requirements.txt
│   |
├── README.md
└── .gitignore
```

---

## ⚡ Quick Start

### Prerequisites

```
Node.js >= 18
Python >= 3.11
Redis (for caching & rate limiting)
Kafka (for event streaming)
PostgreSQL/Supabase (database)
```

### Running the Application

The application has two parts: **Backend API** and **Frontend Dashboard**. Each runs in its own terminal.

#### Terminal 1: Start the Backend Server

```bash
# Navigate to backend directory
cd backend

# Set Python path and start uvicorn server
# On Windows PowerShell:
$env:PYTHONPATH = "."
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000

# On macOS/Linux bash:
export PYTHONPATH=.
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

**Expected output:**
```
INFO:     Uvicorn running on http://127.0.0.1:8000
INFO:     Application startup complete.
```

**Available endpoints:**
- API Docs: http://localhost:8000/docs
- Swagger UI: http://localhost:8000/docs (interactive API testing)
- Admin API: http://localhost:8000/admin/*
- Partner API: http://localhost:8000/partner/*
- Health Check: http://localhost:8000/health

#### Terminal 2: Start the Frontend Dev Server

```bash
# Navigate to frontend directory (in a NEW terminal)
cd frontend

# Install dependencies (first time only)
npm install

# Start dev server
npm run dev
```

**Expected output:**
```
VITE v8.0.8 ready in XXX ms

➜  Local:   http://localhost:8080/
```

**Access the application:**
- **Partner App Home**: http://localhost:8080/
- **Admin Dashboard**: http://localhost:8080/admin (requires login)
  - **Email**: admin@secinsure.com
  - **Password**: admin123

### Admin Dashboard Access

The admin dashboard is protected and requires authentication:

1. Navigate to http://localhost:8080/admin
2. On the login screen, enter:
   - **Email**: `admin@secinsure.com`
   - **Password**: `admin123`
3. Click "Admin Login"
4. You'll now have access to:
   - **Overview Tab**: Real-time statistics and claim summaries
   - **Claims Tab**: View and manage all claims
   - **Fraud Detection Tab**: Monitor flagged suspicious claims
   - **Analytics Tab**: View charts and trends
5. To logout, click the "Logout" button in the header

### Testing the Partner App

Once the backend and frontend are running:

1. Visit http://localhost:8080
2. Click "Get Started" to begin onboarding
3. Use a valid 10-digit Indian mobile number (e.g., 9876543210)
   - **Must start with 6, 7, 8, or 9**
   - **Must be exactly 10 digits**
4. Enter your Swiggy partner ID (e.g., SWG-12345)
5. Complete the onboarding flow
6. Login with your credentials

### Troubleshooting

#### CORS Errors
If you see "CORS policy" errors in the browser console:
- Ensure backend is running on `http://localhost:8000`
- Ensure frontend is on `http://localhost:8080`
- Check that CORS middleware is loaded in backend (should see it in startup logs)
- Try clearing browser cache: `Ctrl+Shift+Delete` (Chrome) or `Cmd+Shift+Delete` (Mac)

#### API Connection Errors (422, 500)
- Check that both backend and frontend terminals show "running" status
- Verify mobile number format (10 digits, starts with 6-9)
- Try the API directly in Swagger UI: http://localhost:8000/docs
- Check browser DevTools Network tab to see actual request/response

#### Frontend Not Loading
- Ensure `npm install` completed without errors
- Clear node_modules: `rm -rf node_modules && npm install`
- Restart dev server: `npm run dev`

#### Backend Not Starting
- Check Python version: `python --version` (should be 3.11+)
- Install dependencies: `pip install -r requirements.txt`
- Check .env file exists in backend/ directory
- On Windows, ensure PowerShell execution policy allows scripts

#### Port Already in Use
If port 8000 or 8080 is already in use:
```bash
# Find and kill process on port 8000 (change for 8080 as needed)
# Windows: netstat -ano | findstr :8000
# Mac/Linux: lsof -i :8000
```

### Environment Setup

The `.env` file in the `backend/` directory already contains test credentials. If you need to update them:

```bash
# Edit backend/.env with your own credentials:
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
OPENWEATHER_API_KEY=your-openweather-key
RAZORPAY_KEY_ID=your-razorpay-key
RAZORPAY_KEY_SECRET=your-razorpay-secret
```

### Admin Dashboard Features

Once both servers are running and you access http://localhost:8080/admin, you'll see:

- **Overview Tab**: Real-time stats, claim volume, fraud detection summary
- **Claims Tab**: View all claims with status, approve/reject actions
- **Fraud Detection Tab**: View flagged claims and suspicious patterns
- **Analytics Tab**: Charts for claim trends, payout data, premium insights

### Stopping the Servers

Press `Ctrl+C` in each terminal to stop the servers.

---

## 🔧 Environment Variables

```env
# -- Python Backend (.env) --------------------------------------------------

# Database (omit entirely for SQLite local dev)
DATABASE_URL=postgresql://user:pass@localhost:5432/secinsure

# External APIs
OPENWEATHER_API_KEY=your_key_here
TOMTOM_API_KEY=your_key_here
DATA_GOV_IN_API_KEY=your_key_here

# Payments
RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret

# ML
MODEL_PATH=./app/models/
MODEL_RETRAIN_INTERVAL_DAYS=7

# Feature flags
ENABLE_AUTO_CLAIMS=true
ENABLE_FRAUD_DETECTION=true
ENABLE_AUTO_PAYOUT=true

# -- Frontend (.env) --------------------------------------------------------
VITE_PYTHON_API_URL=http://localhost:8000
```

---

## ✅ Compliance & Constraints

| Constraint | Implementation |
|:-----------|:--------------|
| ❌ No health/life/accident coverage | Trigger types hard-coded to income-loss events; enforced at claim API layer |
| ❌ No vehicle repair coverage | Disruption types explicitly exclude any vehicle-related events |
| ✅ Weekly premium model | All plans priced weekly; renewal every Monday; aligned to Swiggy's pay cycle |
| ✅ Income loss only | Payout is fixed parametric amount triggered by objective external data - not self-reported loss |
| ✅ Data privacy | Aadhaar never stored plain; bank details encrypted at rest; DPDP-aligned design |
| ✅ No silent denial | Every flagged claim generates a plain-language notification + 7-day appeal window |
| ✅ Deduplication | Redis TTL key (72h) prevents double-payout for same worker on same trigger event |
| ✅ Shield isolation | Shield pool ring-fenced from main pool; zero cross-subsidisation enforced at DB level |

---

## 🤝 Go-To-Market & Platform Partnership Strategy

SecInsure is currently built with a Swiggy integration assumption - Partner ID verification, 3-month order history, and premium deduction from weekly payouts. This section explains honestly where those assumptions stand today, and how we get them to production.

### Current Demo State (Hackathon)

| Integration Point | Production Vision | Demo Reality |
|:------------------|:-----------------|:-------------|
| Swiggy Partner ID verification | Real-time API call to Swiggy backend | Self-reported by rider; no verification |
| 3-month order history pull | Swiggy Partner Data API | Simulated via `delivery-api` mock server |
| Premium deduction from payout | Auto-debit from Swiggy weekly settlement | Manual UPI payment via Razorpay |
| Zone detection from GPS history | Swiggy internal GPS logs | Randomly assigned from known Delhi zones |

We're transparent about this. The full parametric trigger system, fraud pipeline, payout flow, and ML risk engine are all real and functional - the Swiggy data dependency is the one seam that requires a partnership to close.

---

### Why Swiggy Would Say Yes

This is not a cold ask. Swiggy has direct, quantifiable incentives to partner:

**1. Rider retention is Swiggy's biggest operational cost.**
Swiggy spends significantly on rider acquisition and onboarding. A rider who quits after a bad monsoon week costs more to replace than any partnership agreement. Income protection during disruptions directly reduces churn - especially among full-time partners who are the most delivery-efficient cohort.

**2. Swiggy already has insurance partnerships - the regulatory pathway exists.**
Swiggy partners with Bajaj Allianz for accident and medical coverage via the Swiggy app. The legal structure for a third-party insurer accessing partner data and offering financial products through the platform is already established. SecInsure is a product extension, not a novel regulatory category.

**3. The ask is minimal and one-directional.**
We are not asking Swiggy to build anything. The integration requires:
- Read-only API access to Partner ID validation
- Read-only access to 3-month order history (already exposed internally for partner dashboards)
- Optional: payroll deduction flag in the weekly settlement ledger

No write access. No liability transfer. No product changes on Swiggy's side.

**4. ESG and regulatory tailwinds.**
India's **Code on Social Security 2020** explicitly mandates platform companies to provide social security for gig workers. NITI Aayog's 2022 report on gig workers recommended income protection mechanisms. Swiggy partnering with SecInsure is a credible, low-cost way to demonstrate compliance before enforcement teeth arrive.

---

### The Pitch in One Slide

```
What we need from Swiggy:     What Swiggy gets back:

-> Partner ID verification     <- Reduced rider churn during disruptions
-> 3-month order history       <- Zero product dev cost on their end
-> Optional payroll deduction  <- ESG / CSR compliance narrative
                              <- Differentiation vs Zomato on rider welfare
                              <- Revenue share on premiums (negotiable)
```

---

### Fallback Strategy (If Swiggy Says No)

SecInsure does not die without Swiggy's cooperation. The product degrades gracefully:

**Tier 1 fallback - Self-reported income verification:**
Riders submit weekly Swiggy earnings screenshots. Our ML engine parses the screenshot (OCR + layout matching) to extract order count and earnings. Premium is computed from this. Fraud risk is higher but manageable - a rider who fakes income to get a lower premium ends up with a lower payout ceiling, which self-limits abuse.

**Tier 2 fallback - Bank statement income estimation:**
Riders link their bank account (AA framework / account aggregator). SecInsure reads weekly credit patterns from Swiggy's known bank transfer descriptions to infer earnings. No Swiggy API required.

**Tier 3 fallback - Flat-rate entry tier:**
Skip income verification entirely. Offer a single flat ₹49/week entry plan with fixed payouts. No personalisation, but full parametric trigger coverage. Expands the addressable market to any gig worker regardless of platform.

---

### Expansion Sequencing

```
Month 1-3   Delhi pilot, Swiggy self-reported model
            -> Prove loss ratio stays within 60-65%
            -> Build 6 months of clean claims data

Month 4-6   Approach Swiggy partnerships team with pilot data
            -> Negotiate read-only API access
            -> Frame as rider welfare / Code on SS 2020 compliance

Month 6-12  Swiggy integration live
            -> Auto-deduction from weekly settlement
            -> Zone detection from real GPS history
            -> Premium personalisation fully activated

Year 2      Expand to Zomato, Zepto using same self-reported fallback
            -> Cross-platform riders covered under one policy
            -> IRDAI micro-insurance sandbox license filing
```

---

## 🌍 Impact & Roadmap

### Direct Impact

| Metric | Value |
|:-------|:------|
| Eligible partners, Delhi | 80,000+ active |
| Eligible nationally | 6.9 lakh (Swiggy Q3 2024) |
| Avg income stabilised per worker/year | ₹3,000-₹6,000 |
| Target payout time | < 10 minutes |
| Heat-related labour-hour loss (since 1990s) | +124% |
| 1°C wet-bulb rise -> income drop | -19% |

### Phase 2

- [ ] Live Aadhaar OTP via UIDAI sandbox integration
- [ ] Swiggy Partner API production verification
- [ ] Kafka event streaming at scale (high-throughput trigger pipeline)
- [ ] Extended disruption payout live (Plus - 2+ consecutive trigger weeks)

### Phase 3

- [ ] Multi-city: Mumbai, Bangalore, Chennai, Hyderabad
- [ ] Expand to Zomato
- [ ] Satellite imagery for flood zone verification
- [ ] IRDAI micro-insurance regulatory filing

---

### PITCH DECK

https://drive.google.com/file/d/11X5YiwrqZLvJ2a-HrraWrtkI3qd8wKJL/view?usp=sharing

---

<div align="center">

**Built for the 6.9 lakh delivery partners who make every meal possible.**

*When the weather breaks, your income shouldn't.*

<br/>

⭐ Star this repo if you believe gig workers deserve a safety net.

</div>
