import { NavLink, Outlet } from 'react-router-dom'
import { Zap, LayoutDashboard, AlertTriangle, Radio, Network } from 'lucide-react'
import styles from './Layout.module.css'

const NAV = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/network', label: 'Network', icon: Network },
  { to: '/incidents', label: 'Incidents', icon: AlertTriangle },
  { to: '/telemetry', label: 'Telemetry', icon: Radio },
]

export default function Layout() {
  return (
    <div className={styles.shell}>
      <header className={styles.header}>
        <div className={styles.brand}>
          <div className={styles.logo}>
            <Zap size={18} strokeWidth={2.5} />
          </div>
          <div>
            <h1 className={styles.title}>Fault Localization</h1>
            <p className={styles.subtitle}>Electricity Distribution Control</p>
          </div>
        </div>
        <nav className={styles.nav}>
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `${styles.navLink} ${isActive ? styles.navLinkActive : ''}`
              }
            >
              <Icon size={16} />
              {label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  )
}
