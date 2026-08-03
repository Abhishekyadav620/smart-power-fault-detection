import { motion, AnimatePresence } from 'framer-motion'
import { shortPoleId } from '../../utils/topology'
import { eventLabel, eventStatus } from '../../utils/labels'
import { Badge } from '../ui/Card'
import styles from './TelemetryFeed.module.css'

function formatTime(ts) {
  const d = new Date(ts)
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })
}

export default function TelemetryFeed({ events, limit, filterPole, filterEvent }) {
  let filtered = [...events].sort(
    (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
  )

  if (filterPole) {
    filtered = filtered.filter((e) =>
      e.poleId.toLowerCase().includes(filterPole.toLowerCase())
    )
  }
  if (filterEvent && filterEvent !== 'all') {
    filtered = filtered.filter((e) => e.event === filterEvent)
  }
  if (limit) filtered = filtered.slice(0, limit)

  if (!filtered.length) {
    return <p className={styles.empty}>No telemetry events</p>
  }

  return (
    <ul className={styles.feed}>
      <AnimatePresence initial={false}>
        {filtered.map((event) => {
          const status = eventStatus(event.event)
          return (
            <motion.li
              key={event._id || `${event.poleId}-${event.timestamp}`}
              className={styles.item}
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <span className={styles.time}>{formatTime(event.timestamp)}</span>
              <span className={styles.pole}>{shortPoleId(event.poleId)}</span>
              <span className={styles.event}>{eventLabel(event.event)}</span>
              <Badge variant={status}>{eventLabel(event.event)}</Badge>
            </motion.li>
          )
        })}
      </AnimatePresence>
    </ul>
  )
}

export function TelemetryTimeline({ events }) {
  const sorted = [...events].sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  )

  if (!sorted.length) {
    return <p className={styles.empty}>No events in timeline</p>
  }

  return (
    <div className={styles.timeline}>
      {sorted.map((event, i) => {
        const status = eventStatus(event.event)
        return (
          <div key={event._id || i} className={styles.timelineItem}>
            <div className={`${styles.timelineDot} ${styles[`dot_${status}`]}`} />
            {i < sorted.length - 1 && <div className={styles.timelineLine} />}
            <div className={styles.timelineContent}>
              <span className={styles.time}>{formatTime(event.timestamp)}</span>
              <span className={styles.pole}>{shortPoleId(event.poleId)}</span>
              <Badge variant={status}>{eventLabel(event.event)}</Badge>
            </div>
          </div>
        )
      })}
    </div>
  )
}
