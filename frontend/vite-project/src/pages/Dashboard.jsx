import { motion } from 'framer-motion'
import {
  Cpu,
  GitBranch,
  ShieldCheck,
  AlertTriangle,
  Home,
  Zap,
  RotateCcw,
  MapPin,
  Target,
  CheckCircle2,
} from 'lucide-react'
import { useFault } from '../context/FaultContext'
import Card, { StatCard, Badge } from '../components/ui/Card'
import { HorizontalTopology, AffectedPolesChain } from '../components/topology/Topology'
import TelemetryFeed from '../components/telemetry/TelemetryFeed'
import { sortPolesLinear, buildTelemetryMap, shortPoleId } from '../utils/topology'
import {
  faultTypeLabel,
  priorityFromHouseholds,
  statusColor,
  FAULT_TYPE_OPTIONS,
} from '../utils/labels'
import styles from './Dashboard.module.css'

export default function Dashboard() {
  const {
    stats,
    transformers,
    selectedTransformerId,
    setSelectedTransformerId,
    selectedFaultType,
    setSelectedFaultType,
    transformerPoles,
    faultResult,
    latestIncident,
    telemetry,
    simulating,
    injectFault,
    restoreNetwork,
    resolveIncident,
    loading,
  } = useFault()

  const linearPoles = sortPolesLinear(transformerPoles)
  const affectedSet = new Set(faultResult?.affectedPoles || [])
  const telemetryMap = buildTelemetryMap(telemetry)

  const faultSpan = faultResult?.faultLocation?.fromPole
    ? {
        fromPole: faultResult.faultLocation.fromPole,
        toPole: faultResult.faultLocation.toPole,
      }
    : latestIncident?.suspectedLocation
      ? {
          fromPole: latestIncident.suspectedLocation.fromPole,
          toPole: latestIncident.suspectedLocation.toPole,
        }
      : null

  const transformerTelemetry = telemetry.filter((t) =>
    transformerPoles.some((p) => p.poleId === t.poleId)
  )

  const displayIncident = latestIncident
  const hasActiveFault = faultResult || (displayIncident && displayIncident.status !== 'Resolved')

  if (loading) {
    return <div className={styles.loading}>Loading network data…</div>
  }

  return (
    <div className={styles.page}>
      {/* Row 1: Stats */}
      <motion.div
        className={styles.statsRow}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <StatCard label="Total Transformers" value={stats.transformers} icon={Cpu} />
        <StatCard label="Total Poles" value={stats.poles} icon={GitBranch} />
        <StatCard
          label="Healthy Devices"
          value={stats.healthyDevices}
          icon={ShieldCheck}
          variant="healthy"
        />
        <StatCard
          label="Active Incidents"
          value={stats.activeIncidents}
          icon={AlertTriangle}
          variant={stats.activeIncidents > 0 ? 'fault' : 'healthy'}
        />
        <StatCard
          label="Affected Households"
          value={stats.affectedHouseholds}
          icon={Home}
          variant={stats.affectedHouseholds > 0 ? 'fault' : 'default'}
        />
      </motion.div>

      {/* Row 2: Fault Simulation */}
      <div className={styles.simRow}>
        <Card title="Fault Simulation" className={styles.simPanel}>
          <div className={styles.simControls}>
            <label className={styles.field}>
              <span>Transformer</span>
              <select
                value={selectedTransformerId}
                onChange={(e) => setSelectedTransformerId(e.target.value)}
              >
                {transformers.map((t) => (
                  <option key={t.transformerId} value={t.transformerId}>
                    {t.transformerId} — Feeder {t.feederId}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.field}>
              <span>Fault Type</span>
              <select
                value={selectedFaultType}
                onChange={(e) => setSelectedFaultType(e.target.value)}
              >
                {FAULT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <div className={styles.simActions}>
              <button
                type="button"
                className={styles.btnPrimary}
                onClick={injectFault}
                disabled={simulating || !selectedTransformerId}
              >
                <Zap size={16} />
                {simulating ? 'Injecting…' : 'Inject Fault'}
              </button>
              <button
                type="button"
                className={styles.btnSecondary}
                onClick={restoreNetwork}
                disabled={simulating}
              >
                <RotateCcw size={16} />
                Restore Network
              </button>
            </div>
          </div>
        </Card>

        <Card title="Fault Preview" className={styles.previewPanel}>
          <HorizontalTopology
            transformerId={selectedTransformerId}
            poles={linearPoles.slice(0, 8)}
            affectedSet={affectedSet}
            faultSpan={faultSpan}
            telemetryMap={telemetryMap}
            compact
          />
          {!hasActiveFault && (
            <p className={styles.previewHint}>Inject a fault to see topology change</p>
          )}
        </Card>
      </div>

      {/* Row 3: Localization Result */}
      {hasActiveFault && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
        >
          <Card title="Localization Result">
            <div className={styles.localizationGrid}>
              <ResultField
                icon={AlertTriangle}
                label="Fault Type"
                value={faultTypeLabel(
                  faultResult?.faultType || displayIncident?.faultType
                )}
              />
              <ResultField
                icon={MapPin}
                label="Fault Between"
                value={
                  faultSpan
                    ? `${shortPoleId(faultSpan.fromPole)} and ${shortPoleId(faultSpan.toPole)}`
                    : '—'
                }
              />
              <ResultField
                icon={CheckCircle2}
                label="Last Live Pole"
                value={faultSpan ? shortPoleId(faultSpan.fromPole) : '—'}
                variant="healthy"
              />
              <ResultField
                icon={Target}
                label="First Dead Pole"
                value={faultSpan ? shortPoleId(faultSpan.toPole) : '—'}
                variant="fault"
              />
              <ResultField
                icon={Target}
                label="Confidence"
                value={
                  displayIncident?.confidence != null
                    ? `${displayIncident.confidence}%`
                    : '—'
                }
                variant="primary"
              />
            </div>
          </Card>
        </motion.div>
      )}

      {/* Row 4: Affected Poles */}
      {affectedSet.size > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, delay: 0.05 }}
        >
          <Card title="Affected Poles">
            <div className={styles.affectedLayout}>
              <AffectedPolesChain poles={linearPoles} affectedSet={affectedSet} />
              <div className={styles.affectedSummary}>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Affected Pole Count</span>
                  <span className={styles.summaryValue}>{affectedSet.size}</span>
                </div>
                <div className={styles.summaryItem}>
                  <span className={styles.summaryLabel}>Affected Households</span>
                  <span className={`${styles.summaryValue} ${styles.faultText}`}>
                    {faultResult?.affectedHouseholds ??
                      displayIncident?.affectedHouseholds ??
                      0}
                  </span>
                </div>
              </div>
            </div>
          </Card>
        </motion.div>
      )}

      {/* Row 5: Telemetry Timeline */}
      <Card title="Telemetry Timeline">
        <TelemetryFeed events={transformerTelemetry} limit={12} />
      </Card>

      {/* Row 6: Incident Card */}
      {displayIncident && (
        <Card title="Latest Incident">
          <div className={styles.incidentCard}>
            <div className={styles.incidentGrid}>
              <IncidentField label="Incident ID" value={displayIncident.incidentId} />
              <IncidentField label="Transformer" value={displayIncident.transformerId} />
              <IncidentField
                label="Fault Span"
                value={
                  displayIncident.suspectedLocation
                    ? `${shortPoleId(displayIncident.suspectedLocation.fromPole)} → ${shortPoleId(displayIncident.suspectedLocation.toPole)}`
                    : '—'
                }
              />
              <IncidentField
                label="Affected Houses"
                value={displayIncident.affectedHouseholds}
              />
              <IncidentField
                label="Priority"
                value={priorityFromHouseholds(displayIncident.affectedHouseholds)}
              />
              <IncidentField
                label="Status"
                badge={
                  <Badge variant={statusColor(displayIncident.status)}>
                    {displayIncident.status}
                  </Badge>
                }
              />
              <IncidentField
                label="Created"
                value={new Date(displayIncident.detectedAt).toLocaleString('en-IN')}
              />
            </div>
            {displayIncident.status !== 'Resolved' && (
              <button
                type="button"
                className={styles.btnResolve}
                onClick={() => resolveIncident(displayIncident.incidentId)}
              >
                <CheckCircle2 size={18} />
                Resolve Incident
              </button>
            )}
          </div>
        </Card>
      )}
    </div>
  )
}

function ResultField({ icon: Icon, label, value, variant }) {
  return (
    <div className={styles.resultField}>
      <div className={`${styles.resultIcon} ${variant ? styles[`icon_${variant}`] : ''}`}>
        <Icon size={16} />
      </div>
      <div>
        <span className={styles.resultLabel}>{label}</span>
        <span className={styles.resultValue}>{value}</span>
      </div>
    </div>
  )
}

function IncidentField({ label, value, badge }) {
  return (
    <div className={styles.incidentField}>
      <span className={styles.incidentLabel}>{label}</span>
      {badge || <span className={styles.incidentValue}>{value}</span>}
    </div>
  )
}
