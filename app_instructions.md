# HealTrack AI — Complete Application Documentation

## Overview

HealTrack AI is a full-stack, multi-portal healthcare management platform. It connects patients, doctors, clinic administrators, receptionists, and a super-admin through role-based portals backed by a shared MySQL database, a Node.js/Express REST API, and a Python FastAPI machine learning microservice.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Vanilla CSS, Chart.js, Recharts, Lucide React |
| Backend API | Node.js, Express 4, Socket.io 4 (real-time) |
| Database | MySQL 8 (via mysql2) |
| ML Service | Python 3, FastAPI, scikit-learn, joblib, numpy, pandas |
| Auth | JWT (jsonwebtoken) — dev bypass enabled |
| File Uploads | Multer + Cloudinary |
| Real-time | Socket.io (WebSocket events: QUEUE_UPDATE, NEW_ALERT) |

---

## Repository Structure

```
ReadyNest-Group-Project/
├── healtrack-backend/          # Node.js Express API server
│   ├── config/db.js            # MySQL connection pool
│   ├── controllers/
│   │   ├── adminController.js
│   │   ├── doctorController.js
│   │   ├── patientController.js
│   │   ├── receptionController.js
│   │   ├── uploadController.js
│   │   └── clinic-admin/
│   │       ├── analyticsController.js
│   │       ├── departmentController.js
│   │       ├── operationsController.js
│   │       ├── reportsController.js
│   │       ├── settingsController.js
│   │       └── staffController.js
│   ├── middleware/
│   │   └── authMiddleware.js   # JWT verification (dev bypass)
│   ├── routes/
│   │   ├── adminRoutes.js
│   │   ├── clinicAdminRoutes.js
│   │   ├── doctorRoutes.js
│   │   ├── patientRoutes.js
│   │   ├── receptionRoutes.js
│   │   └── uploadRoutes.js
│   ├── services/
│   │   ├── outbreakNewsService.js   # WHO/CDC RSS aggregator
│   │   └── outbreakScheduler.js     # Cron: runs ML outbreak check every 20 min
│   ├── server.js               # Entry point, Socket.io setup
│   ├── seed.js                 # Seed users, clinics, services
│   ├── seed_dashboard_data.js  # Seed appointment/patient data
│   ├── migrate.js              # DB migration helper
│   └── .env                   # Environment variables
│
├── healtrack-frontend/         # React + Vite SPA
│   └── src/
│       ├── api/
│       │   ├── axiosClient.js  # Axios instance with JWT interceptor
│       │   ├── endpoints.js
│       │   └── patientApi.js
│       ├── components/ui/      # Shared UI primitives (Button, etc.)
│       ├── context/            # React context providers
│       ├── routes/
│       │   ├── AppRouter.jsx   # BrowserRouter with role-based routes
│       │   └── ProtectedRoute.jsx
│       └── portals/
│           ├── admin/          # /admin  — Super Admin
│           ├── clinic-admin/   # /clinic — Clinic Admin
│           ├── doctor/         # /doctor — Doctor Workstation
│           ├── patient/        # /patient — Patient Mobile App
│           └── reception/      # /reception — Reception Desk
│
├── healtrack-ml-service/       # Python FastAPI ML microservice
│   ├── app/
│   │   ├── main.py             # FastAPI app entry point
│   │   ├── api/prediction.py   # All ML endpoints
│   │   ├── services/
│   │   │   ├── triage_engine.py
│   │   │   ├── disease_prediction.py
│   │   │   ├── outbreak_prediction.py
│   │   │   ├── multi_disease_risk_engine.py
│   │   │   ├── recommendation_engine.py
│   │   │   ├── risk_tiers.py
│   │   │   └── explainability_engine.py
│   │   ├── validation/schemas.py
│   │   └── database/prediction_repository.py
│   ├── trained_models/         # Pre-trained .pkl scikit-learn models
│   ├── datasets/               # Training CSVs
│   ├── train_outbreak_model.py # Script to retrain outbreak model
│   └── requirements.txt
│
└── team_project.sql            # Full MySQL schema (source of truth)
```

---

## Database Schema (MySQL — `team_project`)

| Table | Purpose |
|---|---|
| `users` | Core auth: Patients, Doctors, Admin, ClinicStaff |
| `patients` | Extended clinical profile (MRN, DOB, blood group) |
| `clinics` | Multi-tenant facility registry with geospatial (POINT) |
| `appointments` | OPD scheduler (status: Scheduled → Checked-In → Completed) |
| `prescriptions` | Clinical encounter master record per appointment |
| `prescription_items` | Line-by-line medication ledger |
| `clinic_reviews` | Patient ratings (1–5 stars), one per patient per clinic |
| `services` | Master dictionary of specialties/departments |
| `clinic_services` | Many-to-many: clinic ↔ service with consultation fee |
| `ai_triage_logs` | Symptom inputs + predicted risk from AI triage |
| `patient_vitals` | Weight, BP, pulse, blood sugar per appointment |
| `preventive_recommendations` | AI-generated or doctor-flagged health alerts |
| `doctor_schedules` | Shift availability per doctor per clinic |
| `notifications` | Patient push alert queue |
| `patient_reports` | Uploaded medical report file metadata (Cloudinary) |

---

## Setup & Installation

### Prerequisites

- **Node.js** v18+ and npm
- **MySQL** 8.0+
- **Python** 3.10+
- Git

---

### Step 1 — Clone the Repository

```bash
git clone <repository-url>
cd ReadyNest-Group-Project
```

---

### Step 2 — Set Up the Database

1. Open MySQL Workbench or the MySQL CLI.
2. Import the schema:

```sql
source team_project.sql;
```

This creates the `team_project` database and all 15 tables.

3. (Optional) Seed base data — users, clinics, and services:

```bash
cd healtrack-backend
node seed.js
```

---

### Step 3 — Configure the Backend

```bash
cd healtrack-backend
```

Create or edit `.env`:

```env
PORT=5001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=team_project
JWT_SECRET=secret
```

Install dependencies and start the server:

```bash
npm install
npm start
```

The server starts on **http://localhost:5001**.  
Console should print:  
`Server listening on port 5001`  
`✅ Successfully connected to the database.`

---

### Step 4 — Start the Frontend

```bash
cd healtrack-frontend
npm install
npm run dev
```

Vite starts the dev server. The default port is **http://localhost:5173**.  
If another app occupies 5173, Vite auto-increments to 5174, 5175, etc.

---

### Step 5 — Start the ML Service

```bash
cd healtrack-ml-service
python -m venv .venv
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

The ML service starts on **http://localhost:8000**.  
Interactive API docs: **http://localhost:8000/docs**

---

### Step 6 — (Optional) Retrain the Outbreak Model

```bash
cd healtrack-ml-service
python train_outbreak_model.py
```

This regenerates `trained_models/outbreak_model.pkl`.

---

## Running All Three Services (Summary)

| Service | Command | Port |
|---|---|---|
| Backend API | `cd healtrack-backend && npm start` | 5001 |
| Frontend | `cd healtrack-frontend && npm run dev` | 5173 |
| ML Service | `uvicorn app.main:app --port 8000` | 8000 |

---

## Portal URLs

| Portal | URL | Role |
|---|---|---|
| Super Admin | http://localhost:5173/admin | admin |
| Clinic Admin | http://localhost:5173/clinic | admin |
| Doctor | http://localhost:5173/doctor | doctor |
| Patient App | http://localhost:5173/patient | patient |
| Reception Desk | http://localhost:5173/reception | reception |

> **Note:** Auth middleware is in development-bypass mode. All portals are accessible without a token. Role enforcement via `ProtectedRoute` reads from `localStorage` key `role`.

---

## Authentication

- JWT-based. Token stored in `localStorage` under key `token`.
- `authMiddleware.js` verifies the token. If missing or invalid, it falls back to a default admin user (`id: 1, role: admin`) for development.
- To enable strict auth, remove the bypass blocks in `authMiddleware.js` and each route file (`router.use(authMiddleware)` comments).

---

## Portal Features

### 1. Super Admin Portal (`/admin`)
**File:** `src/portals/admin/AdminDashboard.jsx`

The platform owner's control center. Has 5 tabs:

#### Tab 1 — Onboarding & Queue (`ClinicOnboarding.jsx`)
- Lists all clinics with `verification_status = 'Pending'` from the database.
- Admin can **Approve** or **Delist** a clinic via `POST /api/admin/verify-clinic`.
- **Direct Onboard** form lets the admin register a brand-new clinic directly via `POST /api/admin/create-clinic`.
- Empty state message shown when no pending clinics exist.

#### Tab 2 — Epidemiology Map (`EpidemiologyMap.jsx`)
- Fetches disease outbreak location data from `GET /api/admin/epidemiology`.
- Visualizes geographic outbreak trends and prescription diagnosis frequency.
- Data is sourced live from the `prescriptions` and `ai_triage_logs` tables.

#### Tab 3 — AI System Health (`AiHealthLogs.jsx`)
- Fetches AI model performance data from `GET /api/admin/ai-health`.
- Shows triage risk ratios (Low / Medium / High predictions) and count of preventive recommendations dispatched.

#### Tab 4 — Ecosystem Analytics (`EcosystemAnalytics.jsx`)
- Fetches platform-wide KPIs from `GET /api/admin/ecosystem-kpis`.
- Displays total clinics, total appointments, total patients, and recent clinic reviews.

#### Tab 5 — AuraCare Predictive AI (`AuraCareDashboard.jsx` + `AuraCareDashboard.css`)
The flagship ML command center. 90KB component with full Chart.js integration.

**KPI Cards (live from DB):**
- Expected Volume (total appointments)
- No-Show Risk % (cancelled/total ratio)
- Medication Demand % (prescription item count vs inventory)
- Outbreak Index % (recent prescription diagnosis activity)

**Sections:**
- **ML Outbreak Prediction & Awareness Dispatcher** — lists diseases pulled from WHO/CDC live RSS feeds via `outbreakNewsService.js`. Each disease card shows velocity %, active cases, trend, recommended doctors (fetched from DB), and a **Broadcast Awareness** button that mass-inserts `preventive_recommendations` for all patients and emits a `NEW_ALERT` Socket.io event.
- **Auto-Send Scheduler** — configurable 20m/30m/custom interval to auto-dispatch outbreak alerts.
- **Disease Spread Analysis** — Radar (probability), Donut (risk tiers), Line (7-day trend), Bar (case velocity) charts built with Chart.js.
- **High-Risk Patient Cards** — patients flagged based on prescription diagnoses.
- **Appointment Volume Chart** — actual vs. AI forecast line chart.
- **No-Show Rate Trend** — weekly no-show percentage chart.
- **Medication Demand & Inventory** — medicine demand vs. stock levels.
- **Disease Heatmap** — risk score grid per disease category.
- **Stock Alerts Table** — medicines with low inventory flagged.
- **Department Utilization Rankings** — ranked by appointment load.
- **AI Insights Panel** — generated recommendations from the ML model.
- **AI Terminal Log** — live event stream of ML actions, socket events, and scheduler activity.

**API Endpoint:** `GET /api/admin/auracare-stats?dept=all&time=weekly`  
**Outbreak News:** `GET /api/admin/outbreak-news`  
**Broadcast:** `POST /api/admin/broadcast-awareness`

---

### 2. Clinic Admin Portal (`/clinic`)
**File:** `src/portals/clinic-admin/ClinicManagementPortal.jsx`

Clinic-level management panel with 6 tabs. Listens on Socket.io `QUEUE_UPDATE` events to auto-refresh.

#### Tab 1 — Dashboard (`AnalyticsDashboard.jsx`)
- **Operational Dashboard** — 4 KPI cards: No-Show Rate, Appointments, Revenue, Active Doctors.
- **Doctor Utilization Bar Chart** — appointment count per doctor (Recharts).
- **Appointments Overview Horizontal Bar** — appointment count per department.
- **Department Revenue Donut Chart** — revenue split by department.
- **Recent Appointments Table** — last 10 appointments with patient, doctor, department, fee, status.
- **API:** `GET /api/clinic-admin/:clinicId/operational-dashboard`

#### Tab 2 — Staff Management (`StaffManagement.jsx`)
- Table of all staff (doctors, nurses, admin) for the clinic.
- Add new staff member form (name, role, department, email).
- Inline edit existing staff records.
- **API:** `GET/POST/PUT /api/clinic-admin/:clinicId/staff`

#### Tab 3 — Departments (`DepartmentManager.jsx`)
- View all active departments (services) offered by the clinic.
- Add or remove departments from the global services dictionary.
- Set/update consultation fees per department.
- **API:** `GET/POST/PUT/DELETE /api/clinic-admin/:clinicId/departments`

#### Tab 4 — Operations (`OperationsOverview.jsx`)
- Today's operational summary — queue counts, wait times.
- **API:** `GET /api/clinic-admin/:clinicId/operations`

#### Tab 5 — Reports & Logs (`ReportsAndLogs.jsx`)
- Financial report download.
- Audit log of clinic actions.
- **API:** `GET /api/clinic-admin/:clinicId/logs`, `GET /api/clinic-admin/:clinicId/reports/financial`

#### Tab 6 — Settings (`ClinicSettings.jsx`)
- Update clinic opening/closing times, operational days, address.
- **API:** `GET/PUT /api/clinic-admin/:clinicId/settings`

---

### 3. Doctor Workstation (`/doctor`)
**File:** `src/portals/doctor/DoctorWorkstation.jsx`

Two-tab layout. Listens on Socket.io `QUEUE_UPDATE` to refresh the patient queue in real time.

#### Tab 1 — Workstation
**Left panel — Patient Queue (`PatientQueue.jsx`):**
- Filter by Today / Week / All.
- Lists appointments with patient name, MRN, status badge, appointment time.
- Selecting a patient loads their full consultation workspace.
- **API:** `GET /api/doctor/appointments?date=today`

**Right panel (active consultation):**

- **Vitals Card (`VitalsCard.jsx`):** Input fields for weight, height, systolic/diastolic BP, pulse rate. Pre-fills from last recorded vitals.
- **History Timeline (`HistoryTimeline.jsx`):** Scrollable chronological list of all past appointments, diagnoses, and prescriptions for the selected patient.
  - **API:** `GET /api/doctor/patient-history/:patientId`
- **Prescription Builder (`PrescriptionBuilder.jsx`):** Dynamic form to add multiple medication rows (medicine name, dosage, frequency, duration). Supports "Add Row" and "Remove" per item.
- **Report Upload (`ReportUpload.jsx`):** Drag-and-drop or file-picker to upload lab reports (PDF/image). Uploads to Cloudinary via `POST /api/upload/report`.
- **Complete Consultation button:** Atomic transaction — saves vitals, creates prescription + prescription_items, updates appointment status to "Completed".
  - **API:** `POST /api/doctor/complete-consultation`

#### Tab 2 — Patient Analytics (`PatientAnalytics.jsx`)
- **Total Patients** and **Repeat Patients** KPI cards.
- **Filters:** Gender, Department, Age Range slider.
- **Age/Gender Analysis Chart** — histogram of patient ages split by gender (Recharts BarChart).
- **Patient Demographics Pie Chart** — gender distribution.
- **Disease Distribution Bar Chart** — top diagnoses from prescriptions with distinct colors per disease.
- **API:** `GET /api/doctor/patient-analytics`

---

### 4. Patient App (`/patient`)
**File:** `src/portals/patient/PatientApp.jsx`

Mobile-first layout (max-width 448px). Bottom navigation bar. Listens for Socket.io `QUEUE_UPDATE`.

#### Tab 1 — Home
- Welcome banner with quick-action buttons: **Check Symptoms** and **Find a Clinic**.
- **Preventive Alert Banner (`PreventiveAlertBanner.jsx`):** Shows AI-generated health alerts from `preventive_recommendations` table for the logged-in patient.
- Quick stats: Total Visits and Pending Alerts counts.
- Preview of recent appointments (last 3).

#### Tab 2 — Find Care (`ClinicDiscovery.jsx`)
- Search clinics by city or filter by specialty.
- **Nearby Clinics** — fetched from DB using geospatial MySQL queries (`ST_Distance_Sphere`).
- Each clinic card shows: name, address, distance, wait time, rating, available doctors.
- **Book Appointment** modal — select doctor, date/time, then `POST /api/patient/appointments`.
- **Cancel/Reschedule** existing appointments.
- **Submit Review** (1–5 stars) for completed appointments.
- **API:** `GET /api/patient/clinics/nearby`, `GET /api/patient/clinics/:clinicId/doctors`, `POST /api/patient/appointments`

#### Tab 3 — AI Triage (`AiTriageAssistant.jsx`)
- Natural language symptom input or checkbox symptom selector.
- Calls the ML service via the backend `POST /api/patient/triage`.
- Returns: predicted disease name, confidence %, risk tier (Low/Medium/High), description, precautions.
- Recommends a specialist department and shows a "Book Appointment" CTA.

#### Tab 4 — Records (`AppointmentHistory.jsx`)
- Full paginated list of all past and upcoming appointments.
- Each card shows: clinic name, doctor name, date, diagnosis, status badge.
- Cancel or reschedule future appointments inline.

---

### 5. Reception Desk (`/reception`)
**File:** `src/portals/reception/ReceptionDesk.jsx`

OPD queue management for front-desk staff. Listens on Socket.io `QUEUE_UPDATE` for live updates.

#### KPI Banner (`KpiBanner.jsx`)
- Total patients in queue, average wait time, active doctors count.

#### OPD Queue Table (`OpdQueueTable.jsx`)
- Table of today's appointments with columns: Token #, Patient Name, Doctor, Department, Status, Actions.
- Status dropdown per row: Scheduled → Checked-In → In Consultation → Completed / Cancelled.
- **API:** `PUT /api/reception/:clinicId/appointments/:appointmentId/status`

#### Walk-In Registration (`WalkInModal.jsx`)
- Modal form to register a walk-in patient (name, phone, doctor selection, reason).
- Looks up existing patient by phone or creates a new record.
- Adds to live OPD queue immediately.
- **API:** `POST /api/reception/:clinicId/walk-in`

---

## Backend API Reference

### Admin Routes — `/api/admin/*` (JWT Protected)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/pending-clinics` | Clinics awaiting verification |
| POST | `/verify-clinic` | Approve or delist a clinic |
| POST | `/create-clinic` | Direct clinic onboarding |
| GET | `/epidemiology` | Outbreak trends from prescriptions |
| GET | `/ai-health` | AI triage stats and risk ratios |
| GET | `/ecosystem-kpis` | Platform-wide KPIs and reviews |
| GET | `/auracare-stats` | Full ML dashboard data (charts, KPIs) |
| POST | `/broadcast-awareness` | Mass-send preventive alerts to all patients |
| GET | `/outbreak-news` | Live WHO/CDC disease outbreak feed |

### Doctor Routes — `/api/doctor/*`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/appointments` | Today's patient queue |
| GET | `/patient-analytics` | Aggregated patient stats |
| GET | `/patient-history/:id` | Full longitudinal patient history |
| POST | `/complete-consultation` | Save vitals, prescription, update appointment |

### Patient Routes — `/api/patient/*`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/:patientId/recommendations` | AI preventive alerts |
| GET | `/services` | Global specialty list |
| GET | `/clinics/cities` | Available clinic cities |
| GET | `/clinics/nearby` | Geospatially filtered clinics |
| GET | `/clinics/:clinicId/doctors` | Doctors at a clinic |
| GET | `/clinics/:clinicId/wait-time` | Estimated wait time |
| POST | `/triage` | Submit symptoms → ML prediction |
| GET | `/:patientId/appointments` | Appointment history |
| POST | `/appointments` | Book an appointment |
| PUT | `/appointments/:id/cancel` | Cancel appointment |
| PUT | `/appointments/:id/reschedule` | Reschedule appointment |
| POST | `/reviews` | Submit clinic review |
| GET | `/family` | List family members |
| POST | `/family` | Add family member |

### Reception Routes — `/api/reception/*`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/:clinicId/lookup` | Search patient by phone/MRN |
| GET | `/:clinicId/queue` | Today's OPD queue |
| PUT | `/:clinicId/appointments/:id/check-in` | Mark patient as checked-in |
| PUT | `/:clinicId/appointments/:id/status` | Update appointment status |
| POST | `/:clinicId/walk-in` | Register walk-in patient |

### Clinic Admin Routes — `/api/clinic-admin/:clinicId/*`

| Method | Endpoint | Description |
|---|---|---|
| GET | `/analytics` | Revenue and footfall charts |
| GET | `/operational-dashboard` | KPIs and operational charts |
| GET/POST/PUT | `/staff` | Staff CRUD |
| GET/POST/PUT/DELETE | `/departments` | Department CRUD |
| GET | `/operations` | Today's queue stats |
| GET/PUT | `/settings` | Clinic settings |
| GET | `/logs` | Audit logs |
| GET | `/reports/financial` | Financial report |

### Upload Routes — `/api/upload/*`

| Method | Endpoint | Description |
|---|---|---|
| POST | `/report` | Upload patient report to Cloudinary |

---

## ML Service API Reference (`http://localhost:8000`)

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | Health check |
| POST | `/api/v1/predict` | Full triage: risks, alerts, recommendations |
| POST | `/api/v1/predict/disease` | Disease prediction from symptom list |
| POST | `/api/v1/predict/outbreak` | Outbreak risk classification |
| GET | `/api/v1/symptoms` | Full list of recognized symptoms |
| GET | `/api/v1/diseases` | Full list of known diseases |
| GET | `/docs` | Interactive Swagger UI |

### Disease Prediction Input (`POST /api/v1/predict/disease`)
```json
{
  "symptoms": ["fever", "headache", "fatigue"]
}
```

### Outbreak Prediction Input (`POST /api/v1/predict/outbreak`)
```json
{
  "disease_cases": [
    { "disease": "Dengue", "recent_cases": 12, "prior_cases": 6 }
  ],
  "season_index": 2,
  "density_score": 7
}
```

---

## Real-Time Events (Socket.io)

The backend emits events from `http://localhost:5001` via Socket.io.

| Event | Direction | Trigger | Listeners |
|---|---|---|---|
| `QUEUE_UPDATE` | Server → Clients | Walk-in registered, status updated, consultation completed | Reception, Doctor, Patient, Clinic portals |
| `NEW_ALERT` | Server → Clients | Outbreak broadcast sent or scheduled auto-send fires | Admin AuraCare dashboard |

---

## Background Services

### Outbreak News Aggregator (`outbreakNewsService.js`)
- Pulls live RSS/API data from **WHO Disease Outbreak News**, **CDC Flu Updates**, and **ReliefWeb**.
- Results cached for **30 minutes** to avoid rate limits.
- For each disease, recommends doctors by querying the `users` table by specialty.
- Falls back to on-call virtual doctor placeholders when DB has no doctors.

### Outbreak Monitoring Scheduler (`outbreakScheduler.js`)
- Initialized on server startup via `initOutbreakScheduler(io)`.
- Runs every **20 minutes**.
- Queries recent (0–7 days) and prior (7–14 days) case counts from `prescriptions`.
- Calls the ML service `POST /api/v1/predict/outbreak` with the case counts.
- If a **High risk** tier is returned, emits a `NEW_ALERT` Socket.io event to all connected clients.

---

## ML Models (Trained — `healtrack-ml-service/trained_models/`)

| File | Purpose |
|---|---|
| `disease_model.pkl` | Multi-class Random Forest for disease classification |
| `label_encoder.pkl` | Sklearn LabelEncoder for disease class names |
| `symptom_list.pkl` | Ordered list of all recognized symptom features |
| `symptom_weights.pkl` | Weighted importance scores per symptom |
| `disease_descriptions.pkl` | Plain-language disease descriptions dict |
| `disease_precautions.pkl` | Precaution list per disease dict |
| `outbreak_model.pkl` | Gradient Boosted classifier for outbreak risk (Low/Medium/High) |

---

## Environment Variables

### `healtrack-backend/.env`

```env
PORT=5001
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=<your_mysql_password>
DB_NAME=team_project
JWT_SECRET=secret
```

---

## Known Dev Notes

1. **Auth bypass is active** — `authMiddleware.js` and most route files have `router.use(authMiddleware)` commented out for testing. Enable for production.
2. **Clinic ID hardcoded** — `ClinicManagementPortal.jsx` and `ReceptionDesk.jsx` use `clinicId = 1`. Connect to session/auth when multi-tenant support is needed.
3. **Patient ID hardcoded** — `PatientApp.jsx` calls patient APIs without a dynamic patient ID. Connect to auth-derived user session for production.
4. **ML Service is optional** — The Node backend's outbreak scheduler gracefully handles ML service unavailability. Patient triage will fail if the ML service is not running.
5. **Database is empty by default** — After running `team_project.sql`, all transactional tables (appointments, patients, prescriptions) start empty. Dashboards will show zero metrics until real data is entered.
6. **Seeding** — Run `node seed.js` to insert base users (15), one clinic, and the services dictionary. Run `node seed_dashboard_data.js` to populate appointment and patient records for dashboard testing.
