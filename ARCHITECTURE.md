# Architecture

## Data Sourcing and Ingestion
Telemetry is ingested from simulated devices into a MongoDB database. Since messages can arrive out of order, the `seq` number is stored to enforce ordering and drop duplicate messages within the backend controller. Polling intervals collect these telemetry events for bulk processing to avoid overloading the Node.js server. 

## Storage and Internal Model
The network topology relies on `Pole` and `Transformer` models. The topology is fundamentally represented as a Directed Acyclic Graph (DAG) starting at the Transformer root and progressing downwards through the `parent_pole_id` relationships. MongoDB is used for robust document storage and rapid geospatial queries.

## Localization Algorithm
The localization logic relies on deterministic Depth-First Search (DFS) graph traversals.
- **Fault Boundary Detection**: The algorithm traces the tree downwards from the root transformer. The edge between the last "live" pole and the first "dark" pole is identified as the fault span.
- **Grouping**: To prevent an avalanche of alerts, the DFS groups all downstream dark poles as a single incident mapped to the root cause span, consolidating 40 individual alerts into a single actionable ticket.
- **Missing Topology**: For the ~60% of transformers that lack explicit pole ordering, the system defaults to a coarser fallback: it identifies the fault at the Distribution Transformer (DT) level based on geospatial clustering, explicitly notifying the operator of the lower confidence score and coarser granularity. 

## Noise Handling
- **Dead Sensors**: An isolated dark pole with energized downstream children is immediately classified as a dead modem/sensor (not a true line fault), effectively preventing false positives. 
- **Load Shedding**: Polling ignores scheduled shutdown windows to prevent raising false tickets.

## AI Feature Justification
We deliberately avoided using LLMs for fault localization because it is a deterministic graph traversal problem—AI is unnecessary, costly, and hallucination-prone here. Instead, an LLM (`getAiExplanation`) is strategically implemented in the operator UI. At 2 a.m., an operator needs rapid, plain-English context. The LLM consumes the technical fault JSON and outputs a fast, human-readable summary ("A wire snapped between poles A and B affecting 500 homes") which vastly accelerates situational awareness.

## Ticket Workflow
The ticket pipeline (`DETECTED -> ACKNOWLEDGED -> CREW ASSIGNED -> RESOLVED -> VERIFIED -> CLOSED`) strictly adheres to the requirement that verification MUST be data-driven. When an operator marks a ticket "Resolved", the system actively polls the incoming telemetry stream. Only when `power_on` signals are physically detected downstream of the fault is the ticket moved to `VERIFIED` and auto-closed.
