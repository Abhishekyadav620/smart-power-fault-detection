const buildTopology = (topology) => {
  const poleMap = new Map();
  const childrenMap = new Map();
  const roots = [];

  topology.forEach((pole) => {
    poleMap.set(pole.poleId, pole);
  });

  topology.forEach((pole) => {
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

const normalizeTelemetry = (telemetry = []) => {
  const latestByPole = new Map();

  telemetry.forEach((record, index) => {
    if (!record || !record.poleId) {
      return;
    }

    const current = latestByPole.get(record.poleId);
    const currentTimestamp = current ? new Date(current.timestamp || 0).getTime() : -1;
    const nextTimestamp = new Date(record.timestamp || 0).getTime();

    if (!current || nextTimestamp > currentTimestamp || (nextTimestamp === currentTimestamp && index > current.index)) {
      latestByPole.set(record.poleId, { ...record, index });
    }
  });

  return latestByPole;
};

const classifyPoleState = (pole, telemetryMap) => {
  const telemetry = telemetryMap.get(pole.poleId);

  if (!telemetry) {
    return {
      state: "missing",
      telemetry: null,
    };
  }

  if (telemetry.event === "sensor_failure") {
    return {
      state: "sensor_failure",
      telemetry,
    };
  }

  if (telemetry.event === "power_lost" || telemetry.voltage === 0) {
    return {
      state: "dark",
      telemetry,
    };
  }

  if (telemetry.event === "voltage_drop") {
    return {
      state: "live",
      telemetry,
    };
  }

  return {
    state: "live",
    telemetry,
  };
};

const locateFaultSpans = ({ topology = [], telemetry = [] }) => {
  if (!topology.length) {
    return [];
  }

  const { childrenMap, roots } = buildTopology(topology);
  const telemetryMap = normalizeTelemetry(telemetry);
  const spans = [];
  const visited = new Set();

  const traverse = (pole, upstreamPoleId, upstreamState) => {
    if (!pole || visited.has(pole.poleId)) {
      return;
    }

    visited.add(pole.poleId);

    const { state } = classifyPoleState(pole, telemetryMap);
    const effectiveState = state === "sensor_failure" ? "live" : state;

    if (state === "dark" && upstreamState !== "dark") {
      spans.push({
        upstreamPole: upstreamPoleId || pole.parentPoleId || pole.poleId,
        downstreamPole: pole.poleId,
      });
    }

    const nextUpstreamState = effectiveState === "dark" ? "dark" : "live";
    const children = childrenMap.get(pole.poleId) || [];

    children.forEach((child) => {
      traverse(child, pole.poleId, nextUpstreamState);
    });
  };

  roots.forEach((root) => {
    traverse(root, root.parentPoleId || null, "live");
  });

  return spans;
};

module.exports = {
  locateFaultSpans,
};