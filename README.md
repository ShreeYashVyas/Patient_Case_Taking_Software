# CaseFlow — MERN Patient Case-Taking Demo

CaseFlow is an educational patient case-taking project with a React + Vite frontend and an Express + MongoDB API.

> **Clinical-data warning:** this is still a development prototype. Use fictional records only. It is not ready for real patient data or public deployment. Before real-world use, complete a privacy/security review and add audit logging, operational monitoring, secure deployment and backups.

## Requirements

- Node.js 22.12+ recommended
- npm
- MongoDB local instance or a MongoDB Atlas connection string

## 1. Run the frontend

From the project root:

```bash
npm install
npm run dev
```

Vite usually serves the frontend at `http://localhost:5173` and forwards `/api` requests to `http://localhost:5000`. The current frontend has not yet been connected to the new login flow, so protected patient/consultation requests will return `401` until the frontend authentication step is completed.

## 2. Configure and run the API

Open another terminal:

```bash
cd server
npm install
```

Copy the example environment file:

```powershell
Copy-Item .env.example .env
```

Edit `server/.env` and set `MONGO_URI` to your local MongoDB URI or Atlas connection string. Keep the real `.env` private; do not commit it or share its credentials. Keep `CLIENT_ORIGIN` matched to the browser origin used by your frontend.

Run the API:

```bash
npm run dev
```

The server runs on port 5000 after MongoDB connects. The health endpoint is `http://localhost:5000/api/health`.

## 3. Create an account

There is deliberately no public registration endpoint. Create an account from a trusted local terminal after configuring MongoDB and `AUTH_SECRET`.

Temporarily set these values in `server/.env`:

- `BOOTSTRAP_USER_NAME`
- `BOOTSTRAP_USER_EMAIL`
- `BOOTSTRAP_USER_PASSWORD` (at least 12 characters)
- `BOOTSTRAP_USER_ROLE` (`doctor`, `receptionist`, or `patient`)

For a patient account, also set `BOOTSTRAP_PATIENT_ID` to the existing MongoDB `_id` of that patient's record. The script checks that the linked record exists. For doctor and receptionist accounts, leave `BOOTSTRAP_PATIENT_ID` empty.

Run from the `server` folder:

```bash
node scripts/createUser.js
```

The script refuses to overwrite an existing account. After it succeeds, remove the temporary `BOOTSTRAP_USER_*` values and `BOOTSTRAP_PATIENT_ID` from `.env`. The password is stored as a salted scrypt hash, not plain text. Active sessions use random, HttpOnly cookies; only a SHA-256 hash of each session token is stored in MongoDB, allowing logout and account deactivation to revoke access immediately.

## 4. Authentication endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/auth/login` | Verify email/password and set an HttpOnly session cookie |
| POST | `/api/auth/logout` | Clear the session cookie |
| GET | `/api/auth/me` | Return the signed-in account |
| GET | `/api/auth/access` | Return the account role and a simple permission summary |
| GET | `/api/health` | Public server/database status |

Sessions expire after one hour. The server stores only a hash of each random session token and checks the live session on each request. The cookie is HttpOnly and SameSite=Strict, and Secure is enabled in production. Login uses a rate limit. State-changing API requests validate the browser origin.

## 5. Role permissions

- **Doctor:** list and manage patient demographics; read and create consultations.
- **Receptionist:** register patients and manage demographic details. Consultation endpoints and clinical notes are not available to this role.
- **Patient:** access only the linked patient record and completed/follow-up consultations associated with that record.

Roles come from the stored user account, not from a role field supplied by the browser. Patient account setup requires linking the account to an existing patient record. There is no public signup endpoint.

These permissions are a starting point for the demo, not a substitute for a complete clinical privacy and authorization review.

## Existing data API

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/patients` | List patients; doctor/receptionist only |
| POST | `/api/patients` | Create a patient; doctor/receptionist only |
| GET | `/api/patients/:id` | Authorized patient profile |
| PATCH | `/api/patients/:id` | Update patient demographics; doctor/receptionist only |
| GET | `/api/encounters` | List authorized consultations |
| POST | `/api/encounters` | Create a consultation; doctor only |
| GET | `/api/encounters/:id` | Read a consultation; doctor or linked patient for completed records |

Existing MongoDB patient and encounter records are preserved. Human-readable patient/case codes remain separate from MongoDB ObjectIds.

## Folder structure

```text
src/                         React + Vite frontend
server/
  scripts/createUser.js      Trusted local account setup
  src/config/db.js
  src/lib/password.js        Password hashing
  src/middleware/auth.js     Session and role checks
  src/models/Patient.js
  src/models/Encounter.js
  src/models/User.js
  src/routes/auth.js
  src/routes/patients.js
  src/routes/encounters.js
  src/server.js
```

## Next step

Connect the existing frontend to `/api/auth/login`, `/api/auth/me`, and `/api/auth/logout`, then add role-based redirects and the three role-appropriate workspaces. Do not use real patient data until the complete system is reviewed and tested.
