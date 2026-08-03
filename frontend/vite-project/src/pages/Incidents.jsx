import { motion } from 'framer-motion'
import {
  FileWarning,
  Users,
  Wrench,
  Zap,
  CheckCircle2,
} from 'lucide-react'
import { useFault } from '../context/FaultContext'
import Card, { Badge } from '../components/ui/Card'
import { shortPoleId } from '../utils/topology'
import {
  faultTypeLabel,
  priorityFromHouseholds,
  statusColor,
} from '../utils/labels'
import styles from './Incidents.module.css'

const TIMELINE_STEPS = [
  { key: 'created', label: 'Incident Created', icon: FileWarning },
  { key: 'assigned', label: 'Crew Assigned', icon: Users },
  { key: 'repair', label: 'Repair Started', icon: Wrench },
  { key: 'restored', label: 'Power Restored', icon: Zap },
  { key: 'closed', label: 'Closed', icon: CheckCircle2 },
]

function getStepIndex(status) {
  if (status === 'Resolved') return 4
  if (status === 'Assigned') return 1
  return 0
}

export default function Incidents() {
  const { incidents, loading, resolveIncident } = useFault()

  if (loading) {
    return <div className={styles.loading}>Loading incidents…</div>
  }

  if (!incidents.length) {
    return (
      <Card title="Incidents">
        <p className={styles.empty}>No incidents recorded yet. Inject a fault from the Dashboard.</p>
      </Card>
    )
  }

  return (
    <div className={styles.page}>
      {incidents.map((incident, idx) => {
        const activeStep = getStepIndex(incident.status)
        return (
          <motion.div
            key={incident.incidentId}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: idx * 0.05 }}
          >
            <Card
              title={incident.incidentId}
              action={
                <Badge variant={statusColor(incident.status)}>
                  {incident.status}
                </Badge>
              }
            >
              <div className={styles.incidentMeta}>
                <MetaItem label="Transformer" value={incident.transformerId} />
                <MetaItem
                  label="Fault Span"
                  value={`${shortPoleId(incident.suspectedLocation?.fromPole)} → ${shortPoleId(incident.suspectedLocation?.toPole)}`}
                />
                <MetaItem label="Fault Type" value={faultTypeLabel(incident.faultType)} />
                <MetaItem label="Confidence" value={`${incident.confidence}%`} />
                <MetaItem label="Affected Houses" value={incident.affectedHouseholds} />
                <MetaItem
                  label="Priority"
                  value={priorityFromHouseholds(incident.affectedHouseholds)}
                />
                <MetaItem
                  label="Detected"
                  value={new Date(incident.detectedAt).toLocaleString('en-IN')}
                />
              </div>

              <div className={styles.timeline}>
                {TIMELINE_STEPS.map((step, i) => {
                  const Icon = step.icon
                  const isComplete = i <= activeStep
                  const isCurrent = i === activeStep
                  return (
                    <div key={step.key} className={styles.timelineStep}>
                      <div
                        className={`${styles.stepNode} ${
                          isComplete ? styles.stepComplete : ''
                        } ${isCurrent ? styles.stepCurrent : ''}`}
                      >
                        <Icon size={16} />
                      </div>
                      {i < TIMELINE_STEPS.length - 1 && (
                        <div
                          className={`${styles.stepLine} ${
                            i < activeStep ? styles.stepLineComplete : ''
                          }`}
                        />
                      )}
                      <span
                        className={`${styles.stepLabel} ${
                          isComplete ? styles.stepLabelComplete : ''
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                  )
                })}
              </div>

              {incident.status !== 'Resolved' && (
                <button
                  type="button"
                  className={styles.resolveBtn}
                  onClick={() => resolveIncident(incident.incidentId)}
                >
                  <CheckCircle2 size={16} />
                  Resolve
                </button>
              )}
            </Card>
          </motion.div>
        )
      })}
    </div>
  )
}

function MetaItem({ label, value }) {
  return (
    <div className={styles.metaItem}>
      <span className={styles.metaLabel}>{label}</span>
      <span className={styles.metaValue}>{value}</span>
    </div>
  )
}
