# Smart-Power-Fault-Detection

This project was developed to help electricity distribution companies reduce fault identification time from hours to just a few minutes. The system continuously monitors telemetry from IoT-enabled electricity poles, automatically localizes faults, creates incident tickets, and verifies restoration using live telemetry without relying on manual confirmation.

---

# 1. Telemetry Ingestion

The first part of the system focuses on collecting telemetry from IoT-enabled electricity poles. Every pole periodically reports its power status to the backend, allowing the control room to continuously monitor the health of the electrical network.

To make the system reliable, incoming telemetry is validated before processing. Duplicate messages, delayed packets, and out-of-order events are handled so that the latest device state is always maintained accurately.

### What we implemented

- Real-time telemetry ingestion
- Duplicate message handling
- Sequence number validation
- Out-of-order message handling
- Device status tracking
- Telemetry history storage

---

# 2. Fault Detection & Localization

Once telemetry is received, the localization engine analyzes the electrical network to determine where the fault has occurred.

Instead of generating an alert for every dark pole, the system groups related telemetry events into a single incident and identifies the fault boundary by determining the last energized pole and the first de-energized pole.

For every detected fault, the system provides:

- Fault Type
- Fault Location
- Last Energized Pole
- First De-energized Pole
- Transformer ID
- Latitude & Longitude
- PIN Code
- Confidence Score
- Number of affected poles
- Number of affected households
- Detection Reason

This enables operators to immediately know where the fault occurred without waiting for customer complaints or manually inspecting the line.

### What we implemented

- Graph-based fault localization
- Fault span detection
- GPS coordinate generation
- PIN code identification
- Confidence score calculation
- Affected poles estimation
- Household impact calculation
- Incident grouping

---

# 3. Reducing False Alerts

A reliable fault detection system should not create incidents for every unusual event. During development, special attention was given to distinguishing genuine power outages from situations that do not require field intervention.

The system identifies scenarios such as scheduled outages, dead sensors, duplicate telemetry, and missing heartbeats, preventing unnecessary incident creation.

### What we implemented

- Scheduled outage detection
- Dead sensor identification
- Duplicate telemetry filtering
- Missing heartbeat monitoring
- False positive suppression

---

# 4. Incident Workflow

Whenever a genuine fault is detected, the system automatically creates an incident ticket and tracks it through its complete lifecycle.

The workflow follows:

Detected
→ Acknowledged
→ Crew Assigned
→ Resolved
→ Verified
→ Closed

One important feature is that restoration is never trusted purely based on operator input. After repair, the system waits for telemetry confirming that power has actually returned before automatically verifying and closing the incident.

### What we implemented

- Automatic incident creation
- Incident lifecycle management
- Status updates
- Restoration verification
- Automatic ticket closure

---

# 5. Operator Console

The operator console provides a centralized dashboard where the control room can monitor the complete electrical network.

The interface has been designed to provide the most important information at a glance, allowing operators to quickly identify ongoing outages and understand their impact.

The dashboard includes:

- Network overview
- Live topology visualization
- Active incidents
- Healthy devices
- Telemetry monitoring
- Fault statistics
- AI explanations
- Incident tracking

### What we implemented

- Dashboard
- Network visualization
- Transformer monitoring
- Pole monitoring
- Incident management
- Telemetry page
- Reports page
- AI Suggestions

---

# 6. Fault Simulator

Since a real electrical network is unavailable during evaluation, a complete fault simulator was developed.

The simulator allows reviewers to inject different fault types into the synthetic network and observe the complete workflow from detection to restoration.

Supported fault types include:

- Wire Break
- Distribution Transformer Failure
- Feeder Failure
- Scheduled Outage

After injecting a fault, the simulator automatically generates realistic telemetry, triggers localization, creates an incident ticket, and updates the dashboard.

Once the fault is repaired, restoration telemetry is generated and the ticket is automatically verified and closed.

### What we implemented

- Wire break simulation
- DT failure simulation
- Feeder failure simulation
- Scheduled outage simulation
- Network restoration simulation
- Realistic telemetry generation

---

# AI Integration

Artificial Intelligence is intentionally **not** used for fault localization because localization is deterministic and better solved using graph traversal algorithms.

Instead, AI is used where it adds value to the operator.

For every detected incident, Gemini generates:

- Plain-English fault explanation
- Root cause summary
- Recommended repair actions
- Estimated restoration guidance

This allows operators to understand incidents more quickly without replacing the deterministic localization algorithm.

---

# Deployment

The complete project has been containerized using Docker and can be started with a single command using Docker Compose.

The application has also been deployed publicly so reviewers can access it without any additional setup.

Deployment includes:

- Docker
- Docker Compose
- Netlify (Frontend)
- Render (Backend)
- MongoDB Atlas

---
# System Architecture



                          ┌────────────────────────────┐
                          │     IoT Pole Devices       │
                          │  (Heartbeat / Power Lost)  │
                          └──────────────┬─────────────┘
                                         │
                                         │ Telemetry
                                         ▼
                    ┌──────────────────────────────────┐
                    │        Telemetry API             │
                    │     (Express.js Backend)         │
                    └──────────────────────────────────┘
                                         │
                                         ▼
                    ┌──────────────────────────────────┐
                    │  Telemetry Processing Layer      │
                    │                                  │
                    │ • Duplicate Filtering            │
                    │ • Sequence Validation            │
                    │ • Out-of-order Handling          │
                    │ • Missing Heartbeat Detection    │
                    └──────────────────────────────────┘
                                         │
                                         ▼
                    ┌──────────────────────────────────┐
                    │    Fault Localization Engine     │
                    │                                  │
                    │ • DFS Traversal                 │
                    │ • Fault Span Detection          │
                    │ • Confidence Calculation        │
                    │ • GPS & Pincode Generation      │
                    │ • Household Estimation          │
                    └──────────────────────────────────┘
                                         │
                          ┌──────────────┴──────────────┐
                          │                             │
                          ▼                             ▼
          ┌────────────────────────┐     ┌────────────────────────┐
          │ Incident Management    │     │ Telemetry Database     │
          │                        │     │                        │
          │ • Create Incident      │     │ • Telemetry            │
          │ • Status Workflow      │     │ • Pole Status          │
          │ • Auto Verification    │     │ • Transformers         │
          │ • Auto Close           │     │ • Incident History     │
          └─────────────┬──────────┘     └────────────────────────┘
                        │
                        ▼
            ┌──────────────────────────────┐
            │      Gemini AI Service       │
            │                              │
            │ • Fault Explanation          │
            │ • Root Cause Summary         │
            │ • Repair Recommendation      │
            └──────────────┬───────────────┘
                           │
                           ▼
        ┌────────────────────────────────────────────┐
        │            React Frontend                  │
        │                                            │
        │ • Dashboard                               │
        │ • Network Topology                        │
        │ • Fault Simulator                         │
        │ • Telemetry                               │
        │ • Incidents                               │
        │ • AI Suggestions                          │
        │ • Reports                                 │
        └────────────────────────────────────────────┘


# Technology Stack

### Frontend

- React
- Tailwind CSS
- React Flow
- Axios

### Backend

- Node.js
- Express.js
- MongoDB
- Mongoose

### AI

- Google Gemini API

### Deployment

- Docker
- Docker Compose
- Netlify
- Render

---

# Key Highlights

- Real-time telemetry processing
- Automatic fault localization
- Graph-based fault detection
- Incident lifecycle management
- Automatic restoration verification
- AI-assisted explanations
- Interactive network visualization
- Fault simulation
- Dockerized deployment
- Publicly deployed application
