import React from 'react'
import { Link } from 'react-router-dom'
import {
  Clock,
  MapPin,
  TrendingUp,
  BarChart3,
  PlusCircle,
  Calendar,
  Flag
} from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import ProgressBar from '../components/ProgressBar'
import { SimRacingBadge } from '../components/Branding'
import { Track } from '../types'
import { f1Tracks } from '../data/tracks'
import TrackMapImage from '../components/TrackMapImage'
import { useLocalStorage } from '../hooks/useLocalStorage'
import LoadingSpinner from '../components/LoadingSpinner'
import { useTrackData } from '../context/TrackDataContext'

const Dashboard: React.FC = () => {
  const [recentTracks] = useLocalStorage<Track[]>('recentTracks', [])
  const { trackData, loading } = useTrackData()

  const tracksWithTireData = trackData.filter((td) => td.tireData.length > 0).length
  const totalTireData = trackData.reduce((acc, data) => acc + data.tireData.length, 0)

  const stats = {
    totalTracks: f1Tracks.length,
    tracksWithData: tracksWithTireData,
    totalStrategies: trackData.reduce((acc, data) => acc + data.strategies.length, 0),
    totalTireData,
    lastUpdated: new Date()
  }

  const recentActivities = [
    {
      id: 1,
      type: 'strategy',
      track: 'Bahrain International Circuit',
      action: 'Új stratégia hozzáadva',
      time: '2 órája',
      icon: BarChart3
    },
    {
      id: 2,
      type: 'tire',
      track: 'Silverstone Circuit',
      action: 'Gumikopás adatok frissítve',
      time: '1 napja',
      icon: TrendingUp
    },
    {
      id: 3,
      type: 'data',
      track: 'Monaco Circuit',
      action: 'Lapidő adatok importálva',
      time: '3 napja',
      icon: Clock
    }
  ]

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8 fade-in">
      {/* Welcome Section */}
      <div className="relative overflow-hidden rounded-3xl border border-f1-light-gray/40 bg-gradient-to-br from-[#0d0d0f] via-[#141216] to-[#2a0909] text-white p-6 lg:p-10">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top_left,rgba(241,33,33,0.45),transparent_60%)]" />
        <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_bottom_right,rgba(255,196,0,0.25),transparent_55%)]" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:justify-between lg:items-start gap-6">
          <div className="flex-1 space-y-4">
            <div className="inline-flex items-center space-x-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em]">
              <span>Welcome back</span>
            </div>
            <h1 className="text-3xl lg:text-4xl font-bold">
              Készen állsz a következő versenyre?
            </h1>
            <p className="text-lg text-white/70 max-w-2xl">
              Tekintsd át a legfrissebb stratégiákat, gumikopás adatokat és fuel ajánlásokat minden F1 25 pályához.
            </p>
            <div className="flex items-center space-x-4">
              <div className="inline-flex items-center space-x-2 text-sm text-white/70">
                <Flag className="h-4 w-4 text-f1-gold" />
                <span>SimRacing Operations Hub</span>
              </div>
            </div>
          </div>
          <div className="flex items-start justify-end">
            <SimRacingBadge className="h-20" />
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="slide-up hover:border-f1-gold/50">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-f1-text-secondary text-sm">Összes pálya</p>
              <p className="text-3xl font-bold text-f1-text-gold">{stats.totalTracks}</p>
            </div>
            <MapPin className="h-8 w-8 text-f1-blue float-animation" />
          </div>
        </Card>

        <Card className="slide-up hover:border-f1-gold/50" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-f1-text-secondary text-sm">Adatokkal rendelkező</p>
              <p className="text-3xl font-bold text-f1-text-gold">{stats.tracksWithData}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-f1-red float-animation" />
          </div>
        </Card>

        <Card className="slide-up hover:border-f1-gold/50" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-f1-text-secondary text-sm">Gumikopás adatok</p>
              <p className="text-3xl font-bold text-f1-text-gold">{stats.totalTireData}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-500 float-animation" />
          </div>
        </Card>

        <Card className="slide-up hover:border-f1-gold/50" style={{ animationDelay: '0.3s' }}>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-f1-text-secondary text-sm">Adatbázis teljesség</p>
                <p className="text-sm font-medium text-f1-text-gold">
                  {Math.round((stats.tracksWithData / stats.totalTracks) * 100)}%
                </p>
              </div>
              <Calendar className="h-8 w-8 text-f1-gold float-animation" />
            </div>
            <ProgressBar value={stats.tracksWithData} max={stats.totalTracks} className="mt-2" />
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Recently Seen Tracks */}
        <Card className="slide-left hover:border-f1-gold/50 hover:shadow-f1-gold/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold gradient-text-gold">Legutóbb megtekintett pályák</h2>
            <Link to="/tracks">
              <Button variant="gold" size="sm" className="scale-in">
                Összes megtekintése
              </Button>
            </Link>
          </div>

          {recentTracks.length > 0 ? (
            <div className="space-y-4">
              {recentTracks.slice(0, 5).map((track) => (
                <div key={track.id} className="flex items-center justify-between p-4 bg-f1-dark rounded-lg hover:bg-f1-light-gray transition-colors">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-5 w-5 text-f1-blue" />
                    <div>
                      <p className="font-medium text-f1-text">{track.name}</p>
                      <p className="text-sm text-f1-text-secondary">{track.country}</p>
                    </div>
                  </div>
                  <Link to={`/tracks/${track.id}`}>
                    <Button variant="outline" size="sm">
                      Megtekintés
                    </Button>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MapPin className="h-12 w-12 text-f1-text-secondary mx-auto mb-4" />
              <p className="text-f1-text-secondary">Még nincsenek megtekintett pályák</p>
              <Link to="/tracks" className="mt-4 inline-block">
                <Button>Pályák böngészése</Button>
              </Link>
            </div>
          )}
        </Card>

        {/* Recent Activities */}
        <Card className="slide-right hover:border-f1-gold/50 hover:shadow-f1-gold/20">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold gradient-text-gold">Legutóbbi tevékenységek</h2>
            <Button variant="gold" size="sm" className="scale-in">
              Részletek
            </Button>
          </div>

          <div className="space-y-4">
            {recentActivities.map((activity) => {
              const Icon = activity.icon
              return (
                <div key={activity.id} className="flex items-center space-x-4 p-4 bg-f1-dark rounded-lg">
                  <div className="p-2 bg-f1-light-gray rounded-lg">
                    <Icon className="h-5 w-5 text-f1-blue" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-f1-text">{activity.action}</p>
                    <p className="text-sm text-f1-text-secondary">{activity.track}</p>
                  </div>
                  <span className="text-xs text-f1-text-secondary">{activity.time}</span>
                </div>
              )
            })}
          </div>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="slide-up hover:border-f1-gold/50 hover:shadow-f1-gold/20">
        <h2 className="text-2xl font-bold gradient-text-gold mb-6">Gyors műveletek</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link to="/data-entry">
            <div className="p-6 bg-f1-dark rounded-lg hover:bg-f1-light-gray transition-all duration-300 cursor-pointer group hover:border-f1-gold/30 hover:shadow-f1-gold/10 relative overflow-hidden">
              <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex items-center space-x-4">
                <div className="p-3 bg-f1-red bg-opacity-20 rounded-lg group-hover:bg-opacity-30 transition-all group-hover:scale-110">
                  <PlusCircle className="h-6 w-6 text-f1-red group-hover:text-f1-gold transition-colors duration-300" />
                </div>
                <div>
                  <h3 className="font-medium text-f1-text group-hover:text-f1-gold transition-colors duration-300">Új adatok hozzáadása</h3>
                  <p className="text-sm text-f1-text-secondary group-hover:text-f1-text transition-colors duration-300">Gumikopás, stratégiák, lapidők</p>
                </div>
              </div>
            </div>
          </Link>

          <Link to="/tracks">
            <div className="p-6 bg-f1-dark rounded-lg hover:bg-f1-light-gray transition-all duration-300 cursor-pointer group hover:border-f1-gold/30 hover:shadow-f1-gold/10 relative overflow-hidden">
              <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="relative z-10 flex items-center space-x-4">
                <div className="p-3 bg-f1-blue bg-opacity-20 rounded-lg group-hover:bg-opacity-30 transition-all group-hover:scale-110">
                  <MapPin className="h-6 w-6 text-f1-blue group-hover:text-f1-gold transition-colors duration-300" />
                </div>
                <div>
                  <h3 className="font-medium text-f1-text group-hover:text-f1-gold transition-colors duration-300">Pályák böngészése</h3>
                  <p className="text-sm text-f1-text-secondary group-hover:text-f1-text transition-colors duration-300">Minden F1 pálya egy helyen</p>
                </div>
              </div>
            </div>
          </Link>

          <div className="p-6 bg-f1-dark rounded-lg hover:bg-f1-light-gray transition-all duration-300 cursor-pointer group hover:border-f1-gold/30 hover:shadow-f1-gold/10 relative overflow-hidden">
            <div className="absolute inset-0 shimmer opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
            <div className="relative z-10 flex items-center space-x-4">
              <div className="p-3 bg-green-500 bg-opacity-20 rounded-lg group-hover:bg-opacity-30 transition-all group-hover:scale-110">
                <Clock className="h-6 w-6 text-green-500 group-hover:text-f1-gold transition-colors duration-300" />
              </div>
              <div>
                <h3 className="font-medium text-f1-text group-hover:text-f1-gold transition-colors duration-300">Következő edzés tervezése</h3>
                <p className="text-sm text-f1-text-secondary group-hover:text-f1-text transition-colors duration-300">Hatékony program egy gombnyomásra</p>
              </div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default Dashboard
