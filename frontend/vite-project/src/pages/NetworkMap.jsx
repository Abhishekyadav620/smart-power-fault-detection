import { useFault } from '../context/FaultContext'
import Card from '../components/ui/Card'
import { VerticalTopology } from '../components/topology/Topology'
import { sortPolesLinear, buildTelemetryMap } from '../utils/topology'
import styles from './NetworkMap.module.css'

export default function NetworkMap() {
  const {
    selectedTransformerId,
    transformerPoles,
    faultResult,
    latestIncident,
    telemetry,
    transformers,
    setSelectedTransformerId,
  } = useFault()

  const linearPoles = sortPolesLinear(transformerPoles)
  const affectedSet = new Set(faultResult?.affectedPoles || [])
  const telemetryMap = buildTelemetryMap(telemetry)

  const faultSpan = faultResult?.faultLocation?.fromPole
    ? {
        fromPole: faultResult.faultLocation.fromPole,
        toPole: faultResult.faultLocation.toPole,
      }
    : latestIncident?.suspectedLocation &&
        latestIncident.status !== 'Resolved'
      ? latestIncident.suspectedLocation
      : null

  const healthyCount = linearPoles.filter(
    (p) => !affectedSet.has(p.poleId)
  ).length
  const faultCount = linearPoles.filter((p) => affectedSet.has(p.poleId)).length

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <label className={styles.select}>
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
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={`${styles.dot} ${styles.dotHealthy}`} />
            Healthy
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.dot} ${styles.dotFault}`} />
            Fault / Affected
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.dot} ${styles.dotWarning}`} />
            Warning
          </span>
        </div>
      </div>

      <div className={styles.layout}>
        <Card title="Electrical Topology" className={styles.topologyCard}>
          <VerticalTopology
            transformerId={selectedTransformerId}
            poles={linearPoles}
            affectedSet={affectedSet}
            faultSpan={faultSpan}
            telemetryMap={telemetryMap}
          />
        </Card>

        <div className={styles.sidePanel}>
          <Card title="Network Status">
            <div className={styles.statusGrid}>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Total Poles</span>
                <span className={styles.statusValue}>{linearPoles.length}</span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Healthy</span>
                <span className={`${styles.statusValue} ${styles.healthy}`}>
                  {healthyCount}
                </span>
              </div>
              <div className={styles.statusItem}>
                <span className={styles.statusLabel}>Affected</span>
                <span className={`${styles.statusValue} ${styles.fault}`}>
                  {faultCount}
                </span>
              </div>
            </div>
          </Card>

          <Card title="Legend">
            <ul className={styles.legendList}>
              <li>
                <strong>Green poles</strong> — Power is on, network is healthy
              </li>
              <li>
                <strong>Red span (❌)</strong> — Fault location between poles
              </li>
              <li>
                <strong>Red poles</strong> — Downstream, power lost
              </li>
              <li>
                <strong>Orange</strong> — Sensor failure or voltage drop
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </div>
  )
}
