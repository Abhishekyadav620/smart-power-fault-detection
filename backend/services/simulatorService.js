const Pole = require("../models/Pole");
const Transformer = require("../models/Transformer");
const Telemetry = require("../models/Telemetry");
const Incident = require("../models/Incident");
const { locateFaultSpans } = require("../algorithms/dfs");

const DEFAULT_VOLTAGE = 230;
const RESTORED_VOLTAGE = 230;

const FAULT_TYPES = [
    "span_fault",
    "transformer_failure",
    "feeder_failure",
    "sensor_failure",
    "load_shedding",
];

const generateUniqueId = (prefix) => {
    const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
    return `${prefix}-${Date.now().toString(36).toUpperCase()}-${randomPart}`;
};

const groupPolesByTopology = (poles) => {
    const poleMap = new Map();
    const childrenMap = new Map();
    const roots = [];

    poles.forEach((pole) => {
        poleMap.set(pole.poleId, pole);
    });

    poles.forEach((pole) => {
        const parentPoleId = pole.parentPoleId || null;

        if (parentPoleId && poleMap.has(parentPoleId)) {
            if (!childrenMap.has(parentPoleId)) {
                childrenMap.set(parentPoleId, []);
            }

            childrenMap.get(parentPoleId).push(pole);
            return;
        }

        roots.push(pole);
    });

    for (const children of childrenMap.values()) {
        children.sort((left, right) => {
            const leftSequence = left.sequenceOnLine ?? Number.MAX_SAFE_INTEGER;
            const rightSequence = right.sequenceOnLine ?? Number.MAX_SAFE_INTEGER;

            if (leftSequence !== rightSequence) {
                return leftSequence - rightSequence;
            }

            return left.poleId.localeCompare(right.poleId);
        });
    }

    roots.sort((left, right) => {
        const leftSequence = left.sequenceOnLine ?? Number.MAX_SAFE_INTEGER;
        const rightSequence = right.sequenceOnLine ?? Number.MAX_SAFE_INTEGER;

        if (leftSequence !== rightSequence) {
            return leftSequence - rightSequence;
        }

        return left.poleId.localeCompare(right.poleId);
    });

    return { poleMap, childrenMap, roots };
};

const collectDescendants = (startPoleId, childrenMap) => {
    const affectedPoleIds = new Set();
    const stack = [startPoleId];

    while (stack.length > 0) {
        const currentPoleId = stack.pop();
        if (affectedPoleIds.has(currentPoleId)) {
            continue;
        }

        affectedPoleIds.add(currentPoleId);

        const children = childrenMap.get(currentPoleId) || [];
        children.forEach((child) => stack.push(child.poleId));
    }

    return affectedPoleIds;
};

const estimateHouseholds = ({ affectedPoleIds, totalPoleCount, transformerHouseholds }) => {
    if (!totalPoleCount) {
        return transformerHouseholds;
    }

    const estimatedHouseholds = Math.round((affectedPoleIds.size / totalPoleCount) * transformerHouseholds);
    return Math.max(1, Math.min(transformerHouseholds, estimatedHouseholds));
};

const createIncidentDocument = async ({
    transformerId,
    feederId,
    fromPole,
    toPole,
    faultType,
    confidence,
    affectedHouseholds,
    coordinates,
    pincode,
    affectedPoles,
    detectionReason,
}) => {
    const incident = await Incident.create({
        incidentId: generateUniqueId("INC"),
        transformerId,
        feederId,
        suspectedLocation: {
            fromPole,
            toPole,
        },
        faultType,
        confidence,
        affectedHouseholds,
        coordinates,
        pincode,
        affectedPoles,
        detectionReason,
        status: "DETECTED",
    });

    return incident;
};

const simulatePowerFault = async (faultData = {}) => {
    const { transformerId, faultType: requestedFaultType } = faultData;

    if (!transformerId) {
        throw new Error("transformerId is required");
    }

    // Load the transformer first so feeder-wide simulations can expand correctly.
    const transformer = await Transformer.findOne({ transformerId });
    if (!transformer) {
        throw new Error("Transformer not found");
    }

    const faultType = FAULT_TYPES.includes(requestedFaultType)
        ? requestedFaultType
        : FAULT_TYPES[Math.floor(Math.random() * FAULT_TYPES.length)];

    const poles = faultType === "feeder_failure"
        ? await Pole.find({ feederId: transformer.feederId })
        : await Pole.find({ transformerId }).sort({ sequenceOnLine: 1, poleId: 1 });

    if (!poles.length) {
        throw new Error("No poles found for the selected network");
    }

    const { poleMap, childrenMap, roots } = groupPolesByTopology(poles);

    const telemetryRecords = [];
    let affectedPoleIds = new Set();
    let simulatedFaultLocation = null;
    let localizedFaultSpans = [];

    if (faultType === "transformer_failure") {
        // Entire transformer subtree loses power.
        const transformerRoots = roots.length ? roots : [poles[0]];
        const rootPole = transformerRoots[0];
        affectedPoleIds = collectDescendants(rootPole.poleId, childrenMap);
        affectedPoleIds.add(rootPole.poleId);
        simulatedFaultLocation = {
            type: "transformer_failure",
            transformerId,
            feederId: transformer.feederId,
            atPole: rootPole.poleId,
        };
    } else if (faultType === "feeder_failure") {
        // Every transformer on the feeder loses power.
        affectedPoleIds = new Set(poles.map((pole) => pole.poleId));
        const firstPole = poles[0];
        simulatedFaultLocation = {
            type: "feeder_failure",
            transformerId,
            feederId: transformer.feederId,
            atPole: firstPole.poleId,
        };
    } else if (faultType === "sensor_failure") {
        // A single sensor fails while the downstream network remains live.
        const sensorPole = poles.find((pole) => pole.hasDevice) || poles[0];
        simulatedFaultLocation = {
            type: "sensor_failure",
            transformerId,
            feederId: transformer.feederId,
            atPole: sensorPole.poleId,
        };
    } else if (faultType === "load_shedding") {
        // Load shedding lowers voltage but must not create outage incidents.
        affectedPoleIds = new Set();
        simulatedFaultLocation = {
            type: "load_shedding",
            transformerId,
            feederId: transformer.feederId,
            atPole: null,
        };
    } else {
        // Radial span fault: choose a downstream pole and darken its subtree.
        const candidatePokes = poles.filter((pole) => pole.parentPoleId && poleMap.has(pole.parentPoleId));
        const faultPole = candidatePokes.length
            ? candidatePokes[Math.floor(Math.random() * candidatePokes.length)]
            : poles[Math.floor(Math.random() * poles.length)];

        const upstreamPoleId = faultPole.parentPoleId || faultPole.poleId;
        affectedPoleIds = collectDescendants(faultPole.poleId, childrenMap);
        affectedPoleIds.add(faultPole.poleId);
        
        simulatedFaultLocation = {
            type: "span_fault",
            transformerId,
            feederId: transformer.feederId,
            fromPole: upstreamPoleId,
            toPole: faultPole.poleId,
        };
    }

    // Write telemetry for every device-equipped pole in the selected network.
    for (const pole of poles) {
        if (!pole.hasDevice || !pole.deviceId) {
            continue;
        }

        let event = "power_on";
        let voltage = DEFAULT_VOLTAGE;

        if (faultType === "sensor_failure" && simulatedFaultLocation.atPole === pole.poleId) {
            event = "sensor_failure";
            voltage = DEFAULT_VOLTAGE;
        } else if (faultType === "load_shedding") {
            event = "voltage_drop";
            voltage = 180;
        } else if (faultType === "transformer_failure" || faultType === "feeder_failure") {
            event = "power_lost";
            voltage = 0;
        } else if (affectedPoleIds.has(pole.poleId)) {
            event = "power_lost";
            voltage = 0;
        }

        telemetryRecords.push({
            poleId: pole.poleId,
            deviceId: pole.deviceId,
            event,
            voltage,
            timestamp: new Date(),
        });
    }

    if (telemetryRecords.length > 0) {
        await Telemetry.insertMany(telemetryRecords);
    }

    const localizedNetwork = faultType === "feeder_failure"
        ? await Pole.find({ feederId: transformer.feederId })
        : poles;

    if (faultType === "span_fault") {
        localizedFaultSpans = locateFaultSpans({
            topology: localizedNetwork,
            telemetry: telemetryRecords,
        });
    }

    const incidents = [];

    if (faultType === "span_fault") {
        const spans = localizedFaultSpans.length ? localizedFaultSpans : [{ upstreamPole: simulatedFaultLocation.fromPole, downstreamPole: simulatedFaultLocation.toPole }];

        for (const span of spans) {
            const upstreamPole = poleMap.get(span.upstreamPole);
            const downstreamPole = poleMap.get(span.downstreamPole);
            const downstreamAffected = downstreamPole
                ? collectDescendants(downstreamPole.poleId, childrenMap)
                : affectedPoleIds;

            let faultLat = transformer.latitude;
            let faultLng = transformer.longitude;
            let pincode = "N/A";
            
            if (upstreamPole && downstreamPole) {
                faultLat = (upstreamPole.latitude + downstreamPole.latitude) / 2;
                faultLng = (upstreamPole.longitude + downstreamPole.longitude) / 2;
                if (upstreamPole.pincode === downstreamPole.pincode) {
                    pincode = upstreamPole.pincode;
                } else if (upstreamPole.pincode) {
                    pincode = upstreamPole.pincode;
                } else if (downstreamPole.pincode) {
                    pincode = downstreamPole.pincode;
                }
            }

            const incident = await createIncidentDocument({
                transformerId,
                feederId: transformer.feederId,
                fromPole: span.upstreamPole,
                toPole: span.downstreamPole,
                faultType: "broken_edge",
                confidence: 96,
                affectedHouseholds: estimateHouseholds({
                    affectedPoleIds: downstreamAffected,
                    totalPoleCount: poles.length,
                    transformerHouseholds: transformer.householdsServed,
                }),
                coordinates: { latitude: faultLat, longitude: faultLng },
                pincode,
                affectedPoles: [...downstreamAffected],
                detectionReason: `Multiple downstream poles lost power while upstream poles remained energized, indicating a wire break between ${span.upstreamPole} and ${span.downstreamPole}.`,
            });

            incidents.push(incident);
        }
    } else if (faultType === "transformer_failure") {
        const rootPole = poles.length ? poles[0] : null;
        const incident = await createIncidentDocument({
            transformerId,
            feederId: transformer.feederId,
            fromPole: simulatedFaultLocation.atPole,
            toPole: simulatedFaultLocation.atPole,
            faultType: "transformer_failure",
            confidence: 100,
            affectedHouseholds: transformer.householdsServed,
            coordinates: { latitude: transformer.latitude, longitude: transformer.longitude },
            pincode: rootPole ? rootPole.pincode : "N/A",
            affectedPoles: [...affectedPoleIds],
            detectionReason: `Entire DT ${transformerId} cluster lost power instantaneously, indicating failure at the transformer level.`,
        });

        incidents.push(incident);
    } else if (faultType === "feeder_failure") {
        const transformersOnFeeder = await Transformer.find({ feederId: transformer.feederId });
        const totalHouseholds = transformersOnFeeder.reduce((sum, item) => sum + (item.householdsServed || 0), 0);
        const rootPole = poles.length ? poles[0] : null;

        const incident = await createIncidentDocument({
            transformerId,
            feederId: transformer.feederId,
            fromPole: simulatedFaultLocation.atPole,
            toPole: simulatedFaultLocation.atPole,
            faultType: "transformer_failure",
            confidence: 100,
            affectedHouseholds: Math.max(1, totalHouseholds),
            coordinates: { latitude: transformer.latitude, longitude: transformer.longitude },
            pincode: rootPole ? rootPole.pincode : "N/A",
            affectedPoles: [...affectedPoleIds],
            detectionReason: `Multiple DTs on feeder ${transformer.feederId} lost power simultaneously, indicating upstream feeder fault.`,
        });

        incidents.push(incident);
    }

    console.log("DEBUG affectedPoles:", [...affectedPoleIds]);

    return {
        faultType,
        faultLocation: simulatedFaultLocation,
        affectedPoles: [...affectedPoleIds],
        affectedHouseholds: incidents.reduce((sum, incident) => sum + (incident.affectedHouseholds || 0), 0),
        incidentId: incidents[0] ? incidents[0].incidentId : null,
        coordinates: incidents[0] ? incidents[0].coordinates : null,
        pincode: incidents[0] ? incidents[0].pincode : "N/A",
        confidence: incidents[0] ? incidents[0].confidence : 100,
        detectionReason: incidents[0] ? incidents[0].detectionReason : "Unknown",
        incidents: incidents.map((incident) => ({
            incidentId: incident.incidentId,
            faultType: incident.faultType,
            status: incident.status,
        })),
    };
};

const restoreNetwork = async () => {
    // Resolve all open incidents before restoring voltages across the network.
    // Incidents will now be automatically verified and closed by the background monitor
    // when it detects the power_on telemetry generated below.

    const poles = await Pole.find({ hasDevice: true, deviceId: { $ne: null } });
    const telemetryRecords = poles.map((pole) => ({
        poleId: pole.poleId,
        deviceId: pole.deviceId,
        event: "power_on",
        voltage: RESTORED_VOLTAGE,
        timestamp: new Date(),
    }));

    if (telemetryRecords.length > 0) {
        await Telemetry.insertMany(telemetryRecords);
    }

    return {
        success: true,
        restoredPoles: poles.length,
    };
};

module.exports = {
    simulatePowerFault,
    restoreNetwork,
};  