const express = require("express");
const cors = require("cors");
require("dotenv").config();

const connectDB = require("./config/db");


const telemetryRoutes = require("./routes/telemetryRoutes");
const incidentRoutes = require("./routes/incidentRoutes");
const simulatorRoutes = require("./routes/simulatorRoutes");
const transformerRoutes = require("./routes/transformerRoutes");
const poleRoutes = require("./routes/poleRoutes");
const aiRoutes = require("./routes/aiRoutes");
const { startIncidentMonitor } = require("./services/incidentMonitor");

const app = express();


connectDB();
startIncidentMonitor();


app.use(cors({
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    credentials: true,
}));
app.use(express.json());

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "Electricity department software is running"
    });
});


app.use("/api/telemetry", telemetryRoutes);
app.use("/api/incidents", incidentRoutes);
app.use("/api/simulator", simulatorRoutes);
app.use("/api/transformers", transformerRoutes);
app.use("/api/poles", poleRoutes);
app.use("/api/ai", aiRoutes);


app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Route Not Found"
    });
});

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});