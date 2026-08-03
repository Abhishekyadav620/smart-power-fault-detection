import styles from './Card.module.css'

export default function Card({ title, children, className = '', action }) {
  return (
    <section className={`${styles.card} ${className}`}>
      {(title || action) && (
        <div className={styles.header}>
          {title && <h2 className={styles.title}>{title}</h2>}
          {action}
        </div>
      )}
      <div className={styles.body}>{children}</div>
    </section>
  )
}

export function StatCard({ label, value, icon: Icon, variant = 'default' }) {
  return (
    <div className={`${styles.stat} ${styles[`stat_${variant}`]}`}>
      <div className={styles.statContent}>
        <span className={styles.statLabel}>{label}</span>
        <span className={styles.statValue}>{value ?? '—'}</span>
      </div>
      {Icon && (
        <div className={styles.statIcon}>
          <Icon size={18} />
        </div>
      )}
    </div>
  )
}

export function Badge({ children, variant = 'default' }) {
  return (
    <span className={`${styles.badge} ${styles[`badge_${variant}`]}`}>
      {children}
    </span>
  )
}
