# 🩺 HealTrack – AI-Powered Smart Healthcare Management Ecosystem

> Official repository for the **ReadyNest Internship 2026** group project.

HealTrack is a modern, AI-powered healthcare management platform designed to streamline clinical operations, improve patient care, and assist healthcare professionals through intelligent disease prediction, risk assessment, real-time communication, and centralized healthcare management.

---

## 🚀 Project Overview

HealTrack combines Artificial Intelligence, cloud technologies, and modern web development to provide a complete digital healthcare ecosystem for multiple stakeholders, including:

- 👨‍⚕️ Patients
- 🩺 Doctors
- 🏥 Receptionists
- 🏢 Clinic Administrators
- 🌐 Super Administrators

The platform offers intelligent healthcare services such as:

- AI Disease Prediction
- Risk Assessment & Recommendation Engine
- Appointment Management
- Digital Prescriptions
- Medical History Management
- Live Queue Monitoring
- Healthcare Analytics
- Real-Time Notifications
- Progressive Web Application (PWA)

---

# 🏗️ System Architecture

```text
                React Frontend (PWA)
                        │
                        ▼
            Node.js + Express REST API
                        │
                        ▼
              MySQL (TiDB Serverless)
                        │
                        ▼
          Python FastAPI Machine Learning
                        │
                        ▼
     Disease Prediction • Risk Assessment
     Recommendation Engine • AI Analytics
```

---

# ✨ Core Features

### 🤖 Artificial Intelligence

- Disease Prediction
- Risk Classification
- Health Recommendation Engine
- Patient Medical History Analysis
- AI Decision Support

### 👨‍⚕️ Patient Portal

- Appointment Booking
- AI Symptom Checker
- Disease Prediction
- Medical Records
- Digital Prescriptions
- Family Profiles
- Health Recommendations
- Live Queue Status

### 🩺 Doctor Dashboard

- Patient Queue
- Medical History Review
- AI Prediction Review
- Prescription Management
- Laboratory Recommendations
- Consultation Notes

### 🏥 Reception Dashboard

- Patient Registration
- Appointment Scheduling
- Queue Management
- Billing
- Doctor Assignment

### 🏢 Clinic Admin Dashboard

- Doctor Management
- Receptionist Management
- Department Management
- Reports & Analytics
- Revenue Monitoring

### 🌐 Super Admin Dashboard

- Platform Monitoring
- Clinic Verification
- Disease Trends
- AI Usage Reports
- Global Analytics

---

# 🛠️ Technology Stack

## Frontend

- React 18
- Vite
- Tailwind CSS
- React Router
- Axios
- Socket.IO Client
- React Hook Form
- Recharts

## Backend

- Node.js
- Express.js
- REST APIs
- JWT Authentication
- bcrypt
- Socket.IO
- Multer

## AI & Machine Learning

- Python
- FastAPI
- Machine Learning
- Risk Prediction Engine
- Recommendation System

## Database

- MySQL
- TiDB Serverless

## Cloud

- Cloudinary
- Progressive Web App (PWA)

---

# 👥 Team

| Member | Role | Responsibility |
|---------|------|----------------|
| **Deepinder Singh** | Team Lead | Project Architecture, Data Analytics, Backend Development, Team Coordination |
| **Mohit Kumar Rana** | AI/ML | Risk Prediction Engine, Recommendation System, FastAPI ML Service, Patient Medical History Integration |
| **Richa Roy** | AI/ML | Patient Interface, UI Components, Disease Prediction, FastAPI ML Service |
| **Vemula Architha** | Data Analytics | Operational Dashboard, Predictive Analytics |
| **Maanas Krishana** | Full Stack Developer | Dashboard Development, Admin Modules, API Integration |
| **Karamveer Chaudhary** | Full Stack Developer | Feature Development, Backend Logic, System Integration |

---

# 📂 Project Structure

```text
ReadyNest-Group-Project/
│
├── healtrack-frontend/              # React.js Frontend (PWA)
│
├── healtrack-backend/               # Node.js + Express Backend APIs
│
├── healtrack-ml-service/            # FastAPI Machine Learning Service
│
├── healtrack-disease-prediction/    # ML Models & Disease Prediction Research
│
├── docker-compose.yml               # Multi-service Docker configuration
│
├── team_project.sql                 # Database schema & sample data
│
├── ReadyNest Team Project Report.pdf# Project documentation
│
├── app_instructions.md              # Application setup guide
│
├── README.md                        # Project overview
│
├── LICENSE                          # MIT License
│
└── .gitignore
```

# ⚙️ Getting Started

Clone the repository:

```bash
git clone https://github.com/Mohit-Rana-Mk/ReadyNest-Group-Project.git
cd ReadyNest-Group-Project
```

Install dependencies for each service.

Example:

```bash
npm install
```

For the Machine Learning service:

```bash
cd healtrack-ml-service
pip install -r requirements.txt
```

Run the development servers according to each module.

---

# 🌿 Git Workflow

1. Create a new feature branch.

```bash
git checkout -b feature/your-feature-name
```

2. Commit your changes.

```bash
git commit -m "feat: add new feature"
```

3. Push your branch.

```bash
git push origin feature/your-feature-name
```

4. Create a Pull Request for review.

---

# 📈 Current Status

- ✅ Project Architecture Completed
- ✅ Frontend Development
- ✅ Backend APIs
- ✅ Authentication System
- ✅ AI Risk Prediction Engine
- ✅ Recommendation System
- ✅ Database Integration
- ✅ Machine Learning Service
- 🚧 Continuous Improvements & Testing
- Enhancing AI Model & code readability 
---

# 🎯 Project Vision

To build a scalable, secure, and AI-powered healthcare ecosystem that enhances patient care, simplifies clinic management, and supports intelligent medical decision-making through predictive analytics and automation.

---

# 📄 License

This project is licensed under the **MIT License**.

---

## ⭐ Acknowledgements

Developed as part of the **ReadyNest Internship 2026** by **Team CODE TITANS**.
