import React from 'react'
import { Link } from 'react-router-dom'
import { Gauge, ArrowUpRight } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import { useTrackData } from '../context/TrackDataContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { f1Tracks } from '../data/tracks'

const TyreOverview: React.FC = () => {
  const { trackData, loading } = useTrackData()

  const splitCompoundSet = React.useCallback((value?: string | null): [string, string, string] => {
    if (!value) {
      return ['C3', 'C4', 'C5']
    }
    const tokens = value
      .split(/[-•|/]/)
      .map((token) => token.trim().toUpperCase())
      .filter(Boolean)
    return [tokens[0] ?? 'C3', tokens[1] ?? 'C4', tokens[2] ?? 'C5']
  }, [])

  const trackLabelMap = React.useMemo(() => {
    const map = new Map<string, { name: string; country: string }>()
    f1Tracks.forEach((track) => {
      map.set(track.id, { name: track.name, country: track.country })
    })
    return map
  }, [])

  const formatWear = (value: number | string | null | undefined) => {
    if (value === null || value === undefined || value === '') return '—'
    if (typeof value === 'number') {
      return `${value}%`
    }
    return value
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
          <h1 className="text-3xl font-bold text-f1-text">Tyre Wear Overview</h1>
          <p className="text-f1-text-secondary max-w-2xl">
            Keverékek és kopási százalékok minden pályához. Válaszd ki a pályát a részletes stratégiák
            és fuel ajánlások megtekintéséhez.
          </p>
        </div>
        <Link to="/data-entry">
          <Button variant="gold">
            Új gumiadat rögzítése
          </Button>
        </Link>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {trackData.map((entry) => {
          const soft = entry.tireData.find((tire) => tire.compound === 'soft')
          const medium = entry.tireData.find((tire) => tire.compound === 'medium')
          const hard = entry.tireData.find((tire) => tire.compound === 'hard')
          const compoundSet = soft?.compoundSet || medium?.compoundSet || hard?.compoundSet || 'C3-C4-C5'
          const [softCompound, mediumCompound, hardCompound] = splitCompoundSet(compoundSet)
          const labels = trackLabelMap.get(entry.trackId)

          return (
            <Card key={entry.trackId} className="space-y-6 border border-f1-light-gray/60 hover:border-f1-gold/40 transition-colors">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-f1-text-secondary uppercase tracking-wide">
                    {labels?.country ?? entry.trackId}
                  </p>
                  <h2 className="text-xl font-semibold text-f1-text">
                    {labels?.name ?? entry.trackId}
                  </h2>
                </div>
                <Gauge className="h-6 w-6 text-f1-gold" />
              </div>

              <div className="inline-flex items-center space-x-2 rounded-full border border-f1-gold/40 px-3 py-1 text-xs text-f1-text-secondary uppercase tracking-widest">
                <span className="text-f1-text font-semibold">Tyre Set</span>
                <span>{compoundSet.replace(/-/g, ' • ')}</span>
              </div>

              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-1">
                  <p className="text-xs text-f1-text-secondary uppercase tracking-wide">Soft</p>
                  <p className="text-xs text-f1-text-secondary">{soft?.compoundVariant ?? softCompound}</p>
                  <p className="text-2xl font-bold text-red-400">{formatWear(soft?.degradation)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-f1-text-secondary uppercase tracking-wide">Medium</p>
                  <p className="text-xs text-f1-text-secondary">{medium?.compoundVariant ?? mediumCompound}</p>
                  <p className="text-2xl font-bold text-amber-300">{formatWear(medium?.degradation)}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-f1-text-secondary uppercase tracking-wide">Hard</p>
                  <p className="text-xs text-f1-text-secondary">{hard?.compoundVariant ?? hardCompound}</p>
                  <p className="text-2xl font-bold text-white">{formatWear(hard?.degradation)}</p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-f1-light-gray/40">
                <div className="text-sm text-f1-text-secondary">
                  <p>
                    {entry.tireStintLaps ? `${entry.tireStintLaps} lap ajánlott stint` : 'Nincs ajánlott stint adat'}
                  </p>
                  <p className="text-xs opacity-70">
                    Frissítve: {entry.lastUpdated.toLocaleDateString('hu-HU')}
                  </p>
                </div>
                <Link
                  to={`/tracks/${entry.trackId}`}
                  className="inline-flex items-center text-sm text-f1-gold hover:text-white transition-colors"
                >
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

export default TyreOverview

