# Deployment Guide

## Prerequisites
- Node.js (v18+)
- MongoDB Atlas account or local MongoDB instance

## Setup Instructions

1. **Clone the Repository**
   ```bash
   git clone <repository-url>
   cd <repository-directory>
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```
   Create a `.env` file in the `backend` directory using the `.env.example` as a template:
   ```env
   MONGODB_URI=mongodb+srv://<your-cluster-url>
   PORT=5000
   GEMINI_API=<your-gemini-key>
   ```

3. **Frontend Setup**
   ```bash
   cd ../frontend
   npm install
   ```

4. **Running the System**
   Open two separate terminal windows.
   - Terminal 1 (Backend): `cd backend && npm start`
   - Terminal 2 (Frontend): `cd frontend && npm run dev`

5. **Verification**
   Navigate to `http://localhost:5173` in your browser. You should see the dashboard and network topologies loaded.

## Troubleshooting

- **MongoNetworkError (ENOTFOUND)**
  - *Symptom*: The backend crashes or the background Incident Monitor logs a network error.
  - *Fix*: Ensure your IP is whitelisted in MongoDB Atlas. Wait 30 seconds for transient DNS drops to resolve and try again.
- **Frontend Crash (Vite Exit Code 1)**
  - *Symptom*: The UI becomes unresponsive or white-screens during hot reloads.
  - *Fix*: Terminate the frontend process (`Ctrl+C`) and restart with `npm run dev`.
- **API Status Updates Failing**
  - *Symptom*: Clicking "Acknowledge Incident" shows an alert box saying "Failed to update status".
  - *Fix*: This indicates a database connection interruption. Wait 5 seconds and click the button again.
