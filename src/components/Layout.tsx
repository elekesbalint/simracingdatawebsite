import React, { useMemo } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import {
  Home,
  MapPin,
  PlusCircle,
  Gauge,
  Navigation2,
  Flame,
  Timer,
  ShieldCheck,
  LogOut,
  Settings
} from 'lucide-react'
import { F125Badge, SimRacingBadge } from './Branding'
import Button from './Button'
import { useAuth } from '../context/AuthContext'

interface LayoutProps {
  children: React.ReactNode
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation()
  const navigate = useNavigate()
  const { currentUser, logout } = useAuth()

  const navItems = useMemo(() => {
    const items = [
      { path: '/', icon: Home, label: 'Dashboard' },
      { path: '/tracks', icon: MapPin, label: 'Pályák' },
      { path: '/tyres', icon: Gauge, label: 'Tyre Wear' },
      { path: '/strategies', icon: Navigation2, label: 'Stratégia' },
      { path: '/fuel', icon: Flame, label: 'Fuel Data' },
      { path: '/hotlaps', icon: Timer, label: 'Hotlaps & Setups' },
      { path: '/data-entry', icon: PlusCircle, label: 'Adatbevitel' },
      { path: '/account', icon: Settings, label: 'Fiók' }
    ]

    if (currentUser?.role === 'admin') {
      items.splice(5, 0, { path: '/admin', icon: ShieldCheck, label: 'Admin panel' })
    }

    return items
  }, [currentUser])

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="min-h-screen bg-f1-dark">
      {/* Header */}
      <header className="bg-f1-gray border-b border-f1-light-gray">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <F125Badge />
              <SimRacingBadge className="h-12" />
            </div>

            <div className="flex items-center space-x-4">
              <div className="hidden md:flex flex-col text-right leading-tight">
                <span className="text-xs uppercase tracking-wide text-f1-text-secondary">
                  Bejelentkezve
                </span>
                <span className="text-sm font-semibold text-f1-text">
                  {currentUser?.name ?? 'Ismeretlen'}
                </span>
                <span className="text-xs text-f1-text-secondary capitalize">
                  {currentUser?.role === 'admin' ? 'admin' : 'pilóta'}
                </span>
              </div>
              <Button variant="secondary" size="sm" onClick={handleLogout} className="inline-flex items-center space-x-2">
                <LogOut className="h-4 w-4" />
                <span>Kijelentkezés</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row">
        {/* Sidebar */}
        <nav className="w-full lg:w-64 bg-f1-gray border-r border-f1-light-gray lg:min-h-screen">
          <div className="p-4 lg:p-6">
            <ul className="flex lg:flex-col space-x-2 lg:space-x-0 lg:space-y-2 overflow-x-auto lg:overflow-x-visible">
              {navItems.map((item) => {
                const Icon = item.icon
                const isActive =
                  location.pathname === item.path ||
                  (item.path !== '/' && location.pathname.startsWith(item.path))

                return (
                  <li key={item.path} className="flex-shrink-0">
                    <Link
                      to={item.path}
                      className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 whitespace-nowrap ${
                        isActive
                          ? 'bg-gradient-to-r from-f1-gold to-f1-gold-dark text-f1-darker font-semibold shadow-lg shadow-f1-gold/25'
                          : 'text-f1-text-secondary hover:text-f1-text hover:bg-f1-light-gray hover:border-f1-gold/30 hover:shadow-lg hover:shadow-f1-gold/10'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium hidden sm:inline">{item.label}</span>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        </nav>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8">
          {children}
        </main>
      </div>

      <footer className="border-t border-f1-light-gray bg-f1-gray py-4">
        <div className="max-w-7xl mx-auto px-4 text-sm text-f1-text-secondary text-center space-y-1">
          <div>
            © 2025{' '}
            <a
              href="https://balintelekes.hu"
              target="_blank"
              rel="noreferrer"
              className="text-f1-gold hover:text-white transition-colors"
            >
              Balint Elekes
            </a>
            . All rights reserved.
          </div>
          <div className="text-xs">
            Designed &amp; coded by{' '}
            <a
              href="https://balintelekes.hu"
              target="_blank"
              rel="noreferrer"
              className="text-f1-gold hover:text-white transition-colors"
            >
              Balint Elekes
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Layout
