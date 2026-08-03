import { useState, useMemo } from 'react'
import { Search, Radio, Clock } from 'lucide-react'
import { useFault } from '../context/FaultContext'
import Card from '../components/ui/Card'
import TelemetryFeed, { TelemetryTimeline } from '../components/telemetry/TelemetryFeed'
import styles from './TelemetryPage.module.css'

const EVENT_FILTERS = [
  { value: 'all', label: 'All Events' },
  { value: 'power_on', label: 'Power ON' },
  { value: 'power_lost', label: 'Power LOST' },
  { value: 'voltage_drop', label: 'Voltage Drop' },
  { value: 'sensor_failure', label: 'Sensor Failure' },
]

export default function TelemetryPage() {
  const { telemetry, loading, transformers, selectedTransformerId } = useFault()
  const [search, setSearch] = useState('')
  const [eventFilter, setEventFilter] = useState('all')
  const [view, setView] = useState('feed')

  const filtered = useMemo(() => {
    let events = [...telemetry]
    if (search) {
      events = events.filter(
        (e) =>
          e.poleId.toLowerCase().includes(search.toLowerCase()) ||
          e.deviceId?.toLowerCase().includes(search.toLowerCase())
      )
    }
    if (eventFilter !== 'all') {
      events = events.filter((e) => e.event === eventFilter)
    }
    return events.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }, [telemetry, search, eventFilter])

  if (loading) {
    return <div className={styles.loading}>Loading telemetry…</div>
  }

  return (
    <div className={styles.page}>
      <div className={styles.toolbar}>
        <div className={styles.searchBox}>
          <Search size={16} />
          <input
            type="text"
            placeholder="Search by pole or device ID…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className={styles.filterSelect}
          value={eventFilter}
          onChange={(e) => setEventFilter(e.target.value)}
        >
          {EVENT_FILTERS.map((f) => (
            <option key={f.value} value={f.value}>
              {f.label}
            </option>
          ))}
        </select>
        <div className={styles.viewToggle}>
          <button
            type="button"
            className={view === 'feed' ? styles.viewActive : ''}
            onClick={() => setView('feed')}
          >
            <Radio size={14} />
            Live Feed
          </button>
          <button
            type="button"
            className={view === 'timeline' ? styles.viewActive : ''}
            onClick={() => setView('timeline')}
          >
            <Clock size={14} />
            Timeline
          </button>
        </div>
      </div>

      <div className={styles.stats}>
        <span>{filtered.length} events</span>
        <span>·</span>
        <span>{transformers.length} transformers monitored</span>
        {selectedTransformerId && (
          <>
            <span>·</span>
            <span>Active: {selectedTransformerId}</span>
          </>
        )}
      </div>

      <Card title={view === 'feed' ? 'Live Event Feed' : 'Event Timeline'}>
        {view === 'feed' ? (
          <TelemetryFeed
            events={filtered}
            filterPole={search}
            filterEvent={eventFilter}
          />
        ) : (
          <TelemetryTimeline events={filtered.slice().reverse()} />
        )}
      </Card>
    </div>
  )
}
