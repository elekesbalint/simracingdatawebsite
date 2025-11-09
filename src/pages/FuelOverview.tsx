import React from 'react'
import { fuelGroups } from '../data/fuelData'
import Card from '../components/Card'
import { useTrackData } from '../context/TrackDataContext'
import LoadingSpinner from '../components/LoadingSpinner'
import { f1Tracks } from '../data/tracks'

const formatDelta = (delta: number | null | undefined) => {
  if (delta === null || delta === undefined) {
    return '? LAPS'
  }
  const sign = delta > 0 ? '+' : ''
  return `${sign}${delta.toFixed(Math.abs(delta) < 1 ? 1 : 2)} LAPS`
}

const FuelOverview: React.FC = () => {
  const { trackData, loading } = useTrackData()

  const trackLookup = React.useMemo(() => {
    return trackData.reduce<Record<string, typeof trackData[number]>>((acc, value) => {
      acc[value.trackId] = value
      return acc
    }, {})
  }, [trackData])

  const getCountry = (trackId: string): string => {
    const track = f1Tracks.find((item) => item.id === trackId)
    return track ? track.country : ''
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
      <header className="space-y-2">
        <h1 className="text-3xl font-bold text-f1-text">2025 F1 Circuit Fuel Data</h1>
        <p className="text-f1-text-secondary max-w-3xl">
          Becsült körönkénti üzemanyag többlet vagy hiány. A pozitív érték azt jelzi, hogy extra kört visz a setup,
          negatív érték esetén spórolni kell a verseny során.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {fuelGroups.map((group) => (
          <Card key={group.title} className="border border-f1-light-gray/60 bg-f1-dark/80 space-y-4">
            <header className="border-b border-f1-light-gray/30 pb-3">
              <h2 className="text-lg font-semibold text-f1-gold uppercase tracking-wider">
                {group.title}
              </h2>
            </header>
            <ul className="space-y-3">
              {group.entries.map((entry) => {
                const meta = trackLookup[entry.trackId]
                return (
                  <li key={entry.trackId} className="flex items-center justify-between text-sm">
                    <div>
                      <p className="text-f1-text font-medium">{entry.label}</p>
                      <p className="text-xs text-f1-text-secondary">{getCountry(entry.trackId)}</p>
                    </div>
                    <div
                      className={`text-sm font-semibold ${
                        entry.delta && entry.delta > 0
                          ? 'text-emerald-400'
                          : entry.delta && entry.delta < 0
                          ? 'text-red-400'
                          : 'text-f1-text-secondary'
                      }`}
                    >
                      {formatDelta(entry.delta ?? meta?.fuelDelta ?? null)}
                    </div>
                  </li>
                )
              })}
            </ul>
            <footer className="pt-2 border-t border-f1-light-gray/20 text-xs text-f1-text-secondary">
              Fuel consumption estimates • 2025 Season
            </footer>
          </Card>
        ))}
      </div>
    </div>
  )
}

export default FuelOverview

