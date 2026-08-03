import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { shortPoleId } from '../../utils/topology'
import styles from './Topology.module.css'

function poleClass(state) {
  if (state === 'fault') return styles.poleFault
  if (state === 'warning') return styles.poleWarning
  return styles.poleHealthy
}

function spanClass(fromState, toState, isFaultSpan) {
  if (isFaultSpan) return styles.spanFault
  if (fromState === 'fault' || toState === 'fault') return styles.spanFault
  return styles.spanHealthy
}

export function HorizontalTopology({
  transformerId,
  poles,
  affectedSet,
  faultSpan,
  telemetryMap,
  compact = false,
}) {
  if (!poles.length) {
    return <p className={styles.empty}>No poles on this feeder</p>
  }

  return (
    <div className={`${styles.horizontal} ${compact ? styles.horizontalCompact : ''}`}>
      <div className={styles.transformerNode}>
        <span className={styles.transformerLabel}>Transformer</span>
        <span className={styles.transformerId}>{transformerId}</span>
      </div>
      <div className={styles.verticalLine} />
      <div className={styles.poleRow}>
        {poles.map((pole, i) => {
          const state = getState(pole.poleId, affectedSet, faultSpan, telemetryMap)
          const isFaultEdge =
            faultSpan &&
            i > 0 &&
            poles[i - 1].poleId === faultSpan.fromPole &&
            pole.poleId === faultSpan.toPole

          return (
            <div key={pole.poleId} className={styles.poleCell}>
              {i > 0 && (
                <div
                  className={`${styles.hSpan} ${spanClass(
                    getState(poles[i - 1].poleId, affectedSet, faultSpan, telemetryMap),
                    state,
                    isFaultEdge
                  )}`}
                >
                  {isFaultEdge && (
                    <motion.span
                      className={styles.faultMarker}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <X size={14} strokeWidth={3} />
                    </motion.span>
                  )}
                </div>
              )}
              <motion.div
                className={`${styles.poleNode} ${poleClass(state)}`}
                layout
                transition={{ duration: 0.25 }}
              >
                {shortPoleId(pole.poleId)}
              </motion.div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function VerticalTopology({
  transformerId,
  poles,
  affectedSet,
  faultSpan,
  telemetryMap,
}) {
  if (!poles.length) {
    return <p className={styles.empty}>Select a transformer to view network topology</p>
  }

  return (
    <div className={styles.vertical}>
      <div className={`${styles.vTransformer} ${styles.poleHealthy}`}>
        <span className={styles.vLabel}>Transformer</span>
        <span className={styles.vId}>{transformerId}</span>
      </div>

      {poles.map((pole, i) => {
        const state = getState(pole.poleId, affectedSet, faultSpan, telemetryMap)
        const isFaultEdge =
          faultSpan &&
          i > 0 &&
          poles[i - 1].poleId === faultSpan.fromPole &&
          pole.poleId === faultSpan.toPole
        const prevState =
          i > 0
            ? getState(poles[i - 1].poleId, affectedSet, faultSpan, telemetryMap)
            : 'healthy'

        return (
          <div key={pole.poleId} className={styles.vSegment}>
            <div
              className={`${styles.vLine} ${spanClass(prevState, state, isFaultEdge)}`}
            >
              {isFaultEdge && (
                <motion.span
                  className={styles.vFaultMarker}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                >
                  <X size={16} strokeWidth={3} />
                </motion.span>
              )}
            </div>
            <motion.div
              className={`${styles.vPole} ${poleClass(state)}`}
              layout
              transition={{ duration: 0.25 }}
            >
              {shortPoleId(pole.poleId)}
            </motion.div>
          </div>
        )
      })}
    </div>
  )
}

export function AffectedPolesChain({ poles, affectedSet }) {
  const affected = poles.filter((p) => affectedSet?.has(p.poleId))

  if (!affected.length) {
    return <p className={styles.empty}>No affected poles</p>
  }

  return (
    <div className={styles.affectedChain}>
      {affected.map((pole, i) => (
        <div key={pole.poleId} className={styles.affectedItem}>
          {i > 0 && <div className={styles.affectedArrow}>↓</div>}
          <div className={`${styles.affectedBox} ${styles.poleFault}`}>
            {shortPoleId(pole.poleId)}
          </div>
        </div>
      ))}
    </div>
  )
}

function getState(poleId, affectedSet, faultSpan, telemetryMap) {
  if (affectedSet?.has(poleId)) return 'fault'
  if (faultSpan?.toPole === poleId) return 'fault'

  const event = telemetryMap?.get(poleId)?.event
  if (event === 'power_lost') return 'fault'
  if (event === 'voltage_drop' || event === 'sensor_failure') return 'warning'
  return 'healthy'
}
