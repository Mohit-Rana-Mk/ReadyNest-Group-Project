# HealTrack AI Agent Handoff Document

## Overview
HealTrack is an AI-powered healthcare management platform developed as part of the ReadyNest Internship 2026. This repository holds a full-stack monorepo featuring a React.js (Vite) frontend, a Node.js (Express) backend, and a FastAPI machine learning service.

## Project Structure
- `/healtrack-frontend/` - React frontend (PWA, TailwindCSS)
- `/healtrack-backend/` - Node.js Express backend (MySQL database)
- `/healtrack-ml-service/` - Python FastAPI for ML models
- `/team_project.sql` - Database schema & sample data
- `appaudit.md` - Technical audit review of the system
- `changes_tracker.md` - A log of recent UI/UX and feature improvements

## Environment Setup

### Frontend (`healtrack-frontend`)
The frontend uses Vite and TailwindCSS.
- **Env file**: `.env` (contains Firebase config and `VITE_API_BASE_URL`)
- **Note on API URL**: By default, it might point to the production backend (Render). To run locally, ensure `VITE_API_BASE_URL=http://localhost:5050/api` is uncommented.

```bash
cd healtrack-frontend
npm install
npm run dev
```

### Backend (`healtrack-backend`)
The backend uses Node.js, Express, and MySQL2.
- **Env file**: `.env` (contains DB credentials `DB_HOST`, `DB_USER`, etc., and port info)
- **Database**: Needs a MySQL instance. The schema is in `team_project.sql` in the root folder.

```bash
cd healtrack-backend
npm install
npm start
```

### ML Service (`healtrack-ml-service`)
The machine learning service handles disease prediction and risk assessment.

```bash
cd healtrack-ml-service
pip install -r requirements.txt
python main.py  # or uvicorn main:app --reload
```

## Key Architectural Details

1. **Authentication**: Uses Firebase Authentication for passwordless Google login and email/password. The frontend sends the Firebase JWT to the backend, which verifies it.
2. **Database Schema**: A relational MySQL DB is used. Tables include `users`, `patients`, `clinics`, `appointments`, `prescriptions`, `patient_vitals`, etc. 
3. **Custom Components**: 
   - `CustomDropdown`: A custom Tailwind dropdown component replaced all native `<select>` tags.
   - `ToastContainer`: Replaced native `window.alert()`.
   - `ConfirmModal`: Replaced native `window.confirm()`.
4. **Routing**: Frontend is organized by portals (`/src/portals/`) for different user roles (Patient, Doctor, Reception, Clinic Admin, Super Admin).
5. **Recent Fixes**: 
   - Added fallback logic for Google Maps navigation coordinates.
   - Fixed Patient Queue sidebar spacing layout.
   - See `changes_tracker.md` for a full list of recent fixes.

## Next Steps / Active Tasks
- **Task 5 (Doctor Dashboard: Medicine autocomplete)**: The user requested implementing a medicine autocomplete feature with a knowledge base for the Doctor Dashboard. This was not yet started and is the immediate next priority.
- Review the `changes_tracker.md` to see what has been accomplished recently and maintain the formatting standards (Tailwind classes, custom components).

## Git Workflow
- **Branch**: Ensure you are working on the correct branch (currently `feat/skeleton-loading`).
- When changes are pushed, they may auto-deploy to Render if merged into `main`.

> [!TIP]
> Always verify which backend the frontend is hitting. If changes in the backend don't reflect on the frontend, check `healtrack-frontend/.env` to see if `VITE_API_BASE_URL` is pointing to `localhost` or the production Render URL.
