# Decisions & Assumptions Log

## 1. Top-Down Tree Topology Representation
**Decision**: Replaced a simple nested list with a robust top-down tree map visualization (using React Flow + Dagre).
**Reasoning**: Operators need immediate visual intuition of the physical network. A flat list fails to convey hierarchical branch dependencies. A tree instantly communicates where the "live vs dark" boundary sits.

## 2. Telemetry-Driven Automated Resolution
**Decision**: Enforced that tickets cannot be manually closed or verified by operators.
**Reasoning**: Strict adherence to the assignment mandate: "Restoration must be verified from telemetry, not from someone clicking a button." The background monitor polls telemetry streams to catch physical restorations.

## 3. Strict Deterministic Graph Traversal over AI
**Decision**: Rejected the use of LLMs for calculating fault coordinates.
**Reasoning**: Finding the exact span between a live and dead node is a deterministic operation. Graph traversals are mathematically precise, instantaneous, and explainable. LLMs hallucinate coordinates and edges.

## 4. Addressing Missing Topologies (The 60%)
**Assumption**: The prompt states 60% of transformers lack a recorded `seq_on_line`. 
**Decision**: Where topology is missing, we aggregate faults at the Transformer level rather than inventing inaccurate span boundaries. The operator is notified of the coarser location, preventing them from sending crews on wild goose chases for a specific pole that wasn't actually inferred correctly.

## 5. UI Conditional Workflows
**Decision**: The Incident Action panel explicitly hides and shows buttons depending on the precise stage (`DETECTED`, `ACKNOWLEDGED`, `CREW ASSIGNED`).
**Reasoning**: Operators shouldn't have to guess the next step. Poka-yoke design prevents an operator from clicking "Verify" manually or bypassing the crew dispatch stage.

## What we would do with two more weeks:
- Implement a physical map (e.g. Mapbox) overlapping the topological tree graph.
- Implement WebSockets for live incident/telemetry streaming instead of HTTP polling.
- Harden the ingestion pipeline using a robust message broker (e.g., MQTT / Kafka) to comfortably handle 5,000 bursts.
