import React from 'react'
import { Link } from 'react-router-dom'
import { Target, ArrowUpRight, Flame } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import { useTrackData } from '../context/TrackDataContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { f1Tracks } from '../data/tracks'

const StrategyOverview: React.FC = () => {
  const { trackData, loading } = useTrackData()

  const trackLabelMap = React.useMemo(() => {
    const map = new Map<string, { name: string; country: string }>()
    f1Tracks.forEach((track) => {
      map.set(track.id, { name: track.name, country: track.country })
    })
    return map
  }, [])

  const renderStrategy = (strategy?: typeof trackData[number]['strategies'][number]) => {
    if (!strategy) {
      return (
        <p className="text-sm text-f1-text-secondary">
          Még nincs stratégiai adat ehhez a pályához. <span className="text-f1-text">Add hozzá az adatbevitel oldalon!</span>
        </p>
      )
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-f1-text-secondary uppercase text-xs tracking-wide">Undercut</span>
          <p className="text-f1-text font-semibold">{strategy.undercut}</p>
        </div>
        <div>
          <span className="text-f1-text-secondary uppercase text-xs tracking-wide">Ideal</span>
          <p className="text-f1-text font-semibold">{strategy.ideal}</p>
        </div>
        <div>
          <span className="text-f1-text-secondary uppercase text-xs tracking-wide">Overcut</span>
          <p className="text-f1-text font-semibold">{strategy.overcut}</p>
        </div>
        <div>
          <span className="text-f1-text-secondary uppercase text-xs tracking-wide">Undercut erőssége</span>
          <p className="text-f1-text font-semibold">{strategy.undercutStrength}</p>
        </div>
        <div>
          <span className="text-f1-text-secondary uppercase text-xs tracking-wide">Pit stop</span>
          <p className="text-f1-text font-semibold">{strategy.pitStop}</p>
        </div>
        <div>
          <span className="text-f1-text-secondary uppercase text-xs tracking-wide">ERS</span>
          <p className="text-f1-text font-semibold">{strategy.ers}</p>
        </div>
        <div className="md:col-span-2">
          <span className="text-f1-text-secondary uppercase text-xs tracking-wide">Optimális szektorok</span>
          <p className="text-f1-text font-semibold">{strategy.optimalSectors}</p>
        </div>
        {strategy.notes && (
          <div className="md:col-span-2">
            <span className="text-f1-text-secondary uppercase text-xs tracking-wide">Megjegyzések</span>
            <p className="text-f1-text-secondary">{strategy.notes}</p>
          </div>
        )}
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-10 fade-in">
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-f1-text">Stratégiai áttekintő</h1>
          <p className="text-f1-text-secondary max-w-2xl">
            Undercut / overcut lehetőségek, pit stop idők és ERS ajánlások minden pályára.
          </p>
        </div>
        <Link to="/data-entry">
          <Button variant="gold" className="inline-flex items-center space-x-2">
            <Target className="h-4 w-4" />
            <span>Stratégia rögzítése</span>
          </Button>
        </Link>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {trackData.map((entry) => {
          const strategy = entry.strategies[0]
          const labels = trackLabelMap.get(entry.trackId)

          return (
            <Card key={entry.trackId} className="space-y-6 border border-f1-light-gray/60 hover:border-f1-gold/40 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-f1-text-secondary uppercase tracking-wide">{labels?.country ?? entry.trackId}</p>
                  <h2 className="text-xl font-semibold text-f1-text">{labels?.name ?? entry.trackId}</h2>
                </div>
                <Target className="h-6 w-6 text-f1-gold" />
              </div>

              {renderStrategy(strategy)}

              <div className="flex items-center justify-between pt-2 border-t border-f1-light-gray/40">
                <div className="flex items-center space-x-2 text-sm text-f1-text-secondary">
                  <Flame className="h-4 w-4 text-f1-gold" />
                  <span>Pit stop: {strategy?.pitStop ?? 'Nincs adat'}</span>
                </div>
                <Link to={`/tracks/${entry.trackId}`} className="inline-flex items-center text-sm text-f1-gold hover:text-white transition-colors">
                  Részletek
                  <ArrowUpRight className="h-4 w-4 ml-1" />
                </Link>
              </div>
            </Card>
          )
        })}
      </div>
    </div>
  )
}

export default StrategyOverview

