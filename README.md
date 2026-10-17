# CaseFlow — MERN Patient Case-Taking Demo

CaseFlow is a student/demo project for practicing a structured patient case-taking workflow. It contains a React + Vite frontend and an Express + MongoDB API starter.

> **Clinical-data warning:** this is an educational prototype. API endpoints are not authenticated yet. Use fictional records only. Do not connect real patient data or expose the API publicly. Before any real use, implement authentication, role-based authorization, audit logging, encryption and secure deployment/backups, and complete an appropriate privacy/security review.

## Requirements

- Node.js 22.12+ recommended
- npm
- MongoDB local instance or a MongoDB Atlas connection string

## 1. Run the frontend

Open a terminal in the `caseflow` root folder:

```bash
npm install
npm run dev
```

Vite usually serves the frontend at `http://localhost:5173`.

The current React UI still uses in-memory sample data. The API is not wired to the React state yet; that is the next integration task.

## 2. Configure MongoDB and run the API

Open a second terminal:

```bash
cd server
npm install
```

Copy `server/.env.example` to `server/.env`. On Windows PowerShell:

```powershell
Copy-Item .env.example .env
```

Edit `server/.env` and set `MONGO_URI` to your local MongoDB URI or MongoDB Atlas connection string. Keep `.env` private and never commit it or paste credentials into chat.

Start the API:

```bash
npm run dev
```

The API runs at `http://localhost:5000` after MongoDB connects. If using Atlas, make sure your database user and Network Access rules allow your development machine to connect. Do not use a broad public IP allowlist for production.

## 3. Test the API

Open `http://localhost:5000/api/health`. A running server returns JSON with its database connection state.

Available starter endpoints:

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/health` | Server/database status |
| GET | `/api/patients` | List patients (`?search=...` supported) |
| POST | `/api/patients` | Create a patient |
| GET | `/api/patients/:id` | Patient and consultation history |
| PATCH | `/api/patients/:id` | Update selected patient fields |
| GET | `/api/encounters` | List consultation records (`?patientId=...` supported) |
| POST | `/api/encounters` | Create a consultation and update the patient summary |
| GET | `/api/encounters/:id` | Get one consultation |

The API uses MongoDB ObjectIds in routes. Generated human-readable `patientCode` and `caseCode` values are separate display identifiers.

## Folder structure

```text
caseflow/
├── src/                    # React + Vite frontend (currently sample state)
├── package.json            # Frontend scripts and dependencies
└── server/
    ├── .env.example
    ├── package.json
    └── src/
        ├── config/db.js
        ├── middleware/errorHandler.js
        ├── models/Patient.js
        ├── models/Encounter.js
        ├── routes/patients.js
        ├── routes/encounters.js
        └── server.js
```

## Next milestone

Connect the React forms and lists to these endpoints through a frontend API service, add loading/error states, and remove the demo state as it is replaced. Then implement authentication and authorization before considering real clinical data.
