# KSPDB Fault Management System

Welcome to the Karnataka State Power Distribution Board (KSPDB) Fault Management System! 

This system ingests low-tension pole telemetry to instantly detect, localize, and track electrical faults across the distribution network. It reduces the time to locate a fault from two hours down to seconds, providing operators with actionable insights to deploy field crews efficiently.

## Quick Links
- **[Public URL]** [INSERT_PUBLIC_URL_HERE]
- **[Demo Video]** [INSERT_DEMO_VIDEO_HERE]

## Running the Application Locally
1. Clone this repository: \git clone <repo_url>\
2. Navigate to the project directory: \cd <repo_directory>\
3. Since Docker has not been setup yet, please start the system manually:
   - Run \
pm start\ in the \/backend\ directory.
   - Run \
pm run dev\ in the \/frontend\ directory.
4. Open your browser and navigate to \http://localhost:5173\

## Documentation Map
For a complete understanding of how this system was built, refer to the following documents:
- [\ARCHITECTURE.md\](./ARCHITECTURE.md): The technical heart of the system. Explains the localization algorithm, data flow, noise handling, and AI justification.
- [\DEPLOYMENT.md\](./DEPLOYMENT.md): A guide to running the system locally and troubleshooting common deployment errors.
- [\DECISIONS.md\](./DECISIONS.md): A log of product tradeoffs and assumptions made during development.
- [\AI-WORKFLOW.md\](./AI-WORKFLOW.md): Transparency into how AI tooling was utilized for this assignment.
