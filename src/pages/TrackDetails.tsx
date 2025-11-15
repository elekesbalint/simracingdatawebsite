import React, { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft,
  Clock,
  Flag,
  BarChart3,
  PlusCircle,
  Edit,
  Trash2,
  TrendingUp,
  Target,
  Timer
} from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import TireWearTable from '../components/TireWearTable'
import { SimRacingBadge } from '../components/Branding'
import { f1Tracks } from '../data/tracks'
import { Strategy, TireData, HotlapEntry } from '../types'
import TrackMapImage from '../components/TrackMapImage'
import LoadingSpinner from '../components/LoadingSpinner'
import { useTrackData } from '../context/TrackDataContext'
import Input from '../components/Input'

const TrackDetails: React.FC = () => {
  const { trackId } = useParams<{ trackId: string }>()
  const { trackData, updateTrack, loading: trackDataLoading } = useTrackData()
  const track = f1Tracks.find(t => t.id === trackId)
  const currentTrackData = trackData.find(td => td.trackId === trackId)
  const [selectedCompoundSet, setSelectedCompoundSet] = useState<TireData['compoundSet'] | null>(null)

  const parseLapTime = (value: string): number => {
    const trimmed = value.trim()
    if (!trimmed) return Number.POSITIVE_INFINITY
    const parts = trimmed.split(':')
    if (parts.length === 1) {
      const seconds = parseFloat(parts[0])
      return Number.isNaN(seconds) ? Number.POSITIVE_INFINITY : seconds
    }
    if (parts.length === 2) {
      const minutes = parseInt(parts[0], 10)
      const seconds = parseFloat(parts[1])
      if (Number.isNaN(minutes) || Number.isNaN(seconds)) {
        return Number.POSITIVE_INFINITY
      }
      return minutes * 60 + seconds
    }
    return Number.POSITIVE_INFINITY
  }

  const formatFuelDelta = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '? laps'
    const sign = value > 0 ? '+' : ''
    return `${sign}${value.toFixed(Math.abs(value) < 1 ? 1 : 2)} laps`
  }

  useEffect(() => {
    if (!selectedCompoundSet && currentTrackData?.tireData.length) {
      setSelectedCompoundSet(
        (currentTrackData.tireData[0].compoundSet ?? 'C3-C4-C5') as TireData['compoundSet']
      )
    }
  }, [selectedCompoundSet, currentTrackData])

  useEffect(() => {
    if (!trackId) return
    void updateTrack(trackId, (current) => ({
      ...current,
      lastVisited: new Date()
    }))
  }, [trackId, updateTrack])

  if (trackDataLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  if (!track) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold text-f1-text mb-4">Pálya nem található</h1>
        <Link to="/tracks">
          <Button>Vissza a pályákhoz</Button>
        </Link>
      </div>
    )
  }

  const [editingStrategyId, setEditingStrategyId] = useState<string | null>(null)
  const [strategyDraft, setStrategyDraft] = useState({
    undercut: '',
    ideal: '',
    overcut: '',
    undercutStrength: '',
    pitStop: '',
    ers: '',
    optimalSectors: '',
    notes: ''
  })
  const [savingStrategyId, setSavingStrategyId] = useState<string | null>(null)
  const [strategyFeedback, setStrategyFeedback] = useState<
    { type: 'success' | 'error'; message: string } | null
  >(null)

  const handleAddStrategy = async () => {
    if (!trackId || !track) return

    const defaultValue = 'Nincs adat'
    const newStrategy: Strategy = {
      id: Date.now().toString(),
      trackId: track.id,
      undercut: defaultValue,
      ideal: defaultValue,
      overcut: defaultValue,
      undercutStrength: defaultValue,
      pitStop: defaultValue,
      ers: defaultValue,
      optimalSectors: defaultValue,
      notes: '',
      createdAt: new Date()
    }

    await updateTrack(track.id, (current) => ({
      ...current,
      strategies: [...current.strategies, newStrategy],
      lastUpdated: new Date()
    }))
  }

  const handleDeleteStrategy = async (strategyId: string) => {
    if (!trackId || !track) return

    await updateTrack(track.id, (current) => ({
      ...current,
      strategies: current.strategies.filter((s) => s.id !== strategyId),
      lastUpdated: new Date()
    }))
  }

  const beginEditStrategy = (strategy: Strategy) => {
    setStrategyFeedback(null)
    setEditingStrategyId(strategy.id)
    setStrategyDraft({
      undercut: strategy.undercut,
      ideal: strategy.ideal,
      overcut: strategy.overcut,
      undercutStrength: strategy.undercutStrength,
      pitStop: strategy.pitStop,
      ers: strategy.ers,
      optimalSectors: strategy.optimalSectors,
      notes: strategy.notes ?? ''
    })
  }

  const cancelEditStrategy = (preserveFeedback = false) => {
    if (!preserveFeedback) {
      setStrategyFeedback(null)
    }
    setEditingStrategyId(null)
    setSavingStrategyId(null)
    setStrategyDraft({
      undercut: '',
      ideal: '',
      overcut: '',
      undercutStrength: '',
      pitStop: '',
      ers: '',
      optimalSectors: '',
      notes: ''
    })
  }

  const handleUpdateStrategy = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!track || !editingStrategyId) return

    setStrategyFeedback(null)
    setSavingStrategyId(editingStrategyId)

    try {
      await updateTrack(track.id, (current) => ({
        ...current,
        strategies: current.strategies.map((strategy) =>
          strategy.id === editingStrategyId
            ? {
                ...strategy,
                undercut: strategyDraft.undercut,
                ideal: strategyDraft.ideal,
                overcut: strategyDraft.overcut,
                undercutStrength: strategyDraft.undercutStrength,
                pitStop: strategyDraft.pitStop,
                ers: strategyDraft.ers,
                optimalSectors: strategyDraft.optimalSectors,
                notes: strategyDraft.notes.trim() ? strategyDraft.notes.trim() : undefined
              }
            : strategy
        ),
        lastUpdated: new Date()
      }))

      setStrategyFeedback({ type: 'success', message: 'Stratégia sikeresen frissítve.' })
      cancelEditStrategy(true)
    } catch (error) {
      setStrategyFeedback({
        type: 'error',
        message:
          error instanceof Error ? error.message : 'Nem sikerült frissíteni a stratégiát. Próbáld újra.'
      })
    } finally {
      setSavingStrategyId(null)
    }
  }

  useEffect(() => {
    cancelEditStrategy()
  }, [trackId])

  const compoundOptions: TireData['compoundSet'][] = Array.from(
    new Set(
      (currentTrackData?.tireData || []).map((t) => (t.compoundSet ?? 'C3-C4-C5') as TireData['compoundSet'])
    )
  )
  const activeCompoundSet: TireData['compoundSet'] | null =
    compoundOptions.length === 0
      ? null
      : selectedCompoundSet && compoundOptions.includes(selectedCompoundSet)
      ? selectedCompoundSet
      : compoundOptions[0]

  const displayedTires = (currentTrackData?.tireData || []).filter((tire) =>
    activeCompoundSet ? (tire.compoundSet ?? 'C3-C4-C5') === activeCompoundSet : true
  )
  const strategies = currentTrackData?.strategies || []
  const ersNotes = currentTrackData?.ersNotes || []
  const details = currentTrackData?.details || []
  const hotlaps = currentTrackData?.hotlaps || []
  const setups = currentTrackData?.setups || []
  const setupsById = new Map(setups.map((setup) => [setup.id, setup]))
  const topHotlaps: HotlapEntry[] = [...hotlaps]
    .sort((a, b) => parseLapTime(a.lapTime) - parseLapTime(b.lapTime))
    .slice(0, 3)

  return (
    <div className="space-y-10 fade-in">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link to="/tracks">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Vissza
            </Button>
          </Link>
          <span className="text-sm text-f1-text-secondary">
            {track.country} • {track.length} km • {track.laps} laps
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <Link to="/tyres">
            <Button variant="secondary" size="sm">Tyre overview</Button>
          </Link>
          <Link to="/strategies">
            <Button variant="secondary" size="sm">Strategy overview</Button>
          </Link>
          <Link to="/fuel">
            <Button variant="secondary" size="sm">Fuel data</Button>
          </Link>
          <Link to="/data-entry">
            <Button variant="gold" size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              Adat bevitel
            </Button>
          </Link>
        </div>
      </div>

      <section className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 relative overflow-hidden rounded-3xl border border-f1-light-gray/40 bg-gradient-to-br from-[#101016] via-[#09090c] to-[#1f0202]">
          <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top_left,rgba(241,33,33,0.45),transparent_60%)]" />
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_bottom_right,rgba(255,196,0,0.25),transparent_55%)]" />
          <div className="relative z-10 p-8 space-y-8">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
              <div className="space-y-4">
                <div className="inline-flex items-center space-x-2 rounded-full bg-white/10 px-3 py-1 text-xs uppercase tracking-[0.3em] text-white/70">
                  <span>Track Insight</span>
                </div>
                <h1 className="text-3xl lg:text-4xl font-bold text-white">
                  {track.name}
                </h1>
                <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
                  <div className="flex items-center space-x-2">
                    <Flag className="h-4 w-4 text-f1-gold" />
                    <span>{track.country}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4 text-f1-gold" />
                    <span>{track.length} km</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Target className="h-4 w-4 text-f1-gold" />
                    <span>{track.laps} lap</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <BarChart3 className="h-4 w-4 text-f1-gold" />
                    <span>{strategies.length} stratégia</span>
                  </div>
                </div>
              </div>
              <SimRacingBadge />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <span className="text-[11px] uppercase text-white/60 tracking-[0.25em]">Fuel delta</span>
                <p className="text-lg font-semibold text-white mt-1">{formatFuelDelta(currentTrackData?.fuelDelta)}</p>
                <p className="text-xs text-white/50 mt-1.5 leading-relaxed">Pozitív érték esetén több üzemanyagot visz a setup.</p>
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <span className="text-[11px] uppercase text-white/60 tracking-[0.25em]">DRS zones</span>
                <p className="text-lg font-semibold text-white mt-1">{currentTrackData?.drsZones ?? '—'}</p>
                <p className="text-xs text-white/50 mt-1.5 leading-relaxed">Aktív DRS szektorok száma a versenyen.</p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-2">
              <TrackMapImage
                src={track.mapImageUrl}
                alt={`${track.name} track map`}
                className="h-52 md:h-60 bg-black/40"
                fit="contain"
                showOverlay={false}
              />
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-white/60 mt-3 px-2">
                <span>Sector overview</span>
                <span>{track.country}</span>
              </div>
              <div className="text-[11px] text-white/50 mt-1 px-2">
                Frissítve • {new Date().getFullYear()}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Card className="space-y-4">
            <header className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-f1-text">Verseny paraméterek</h3>
            </header>
            <div className="space-y-3 text-sm text-f1-text-secondary">
              <div className="flex justify-between">
                <span>Pit-stop time loss</span>
                <span className="text-f1-text font-medium">
                  {currentTrackData?.pitStopLoss ? `${currentTrackData.pitStopLoss} s` : 'Nincs adat'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Legjobb kör</span>
                <span className="text-f1-text font-medium">
                  {typeof currentTrackData?.bestLap === 'number' ? `${currentTrackData.bestLap}. kör` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Átlagos kör</span>
                <span className="text-f1-text font-medium">
                  {typeof currentTrackData?.averageLap === 'number' ? `${currentTrackData.averageLap}. kör` : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Ajánlott gumistint</span>
                <span className="text-f1-text font-medium">
                  {currentTrackData?.tireStintLaps ? `${currentTrackData.tireStintLaps} lap` : 'Nincs adat'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Utolsó frissítés</span>
                <span className="text-f1-text font-medium">
                  {currentTrackData ? new Date(currentTrackData.lastUpdated).toLocaleDateString('hu-HU') : '—'}
                </span>
              </div>
            </div>
          </Card>

          <Card className="space-y-3">
            <h3 className="text-lg font-semibold text-f1-text">Gyors műveletek</h3>
            <div className="grid grid-cols-1 gap-2 text-sm">
              <Link to="/data-entry" className="rounded-lg border border-f1-light-gray/40 px-3 py-2 hover:border-f1-gold/50 transition-colors">
                Új adat rögzítése
              </Link>
              <Link to="/strategies" className="rounded-lg border border-f1-light-gray/40 px-3 py-2 hover:border-f1-gold/50 transition-colors">
                Stratégia áttekintése
              </Link>
              <Link to="/fuel" className="rounded-lg border border-f1-light-gray/40 px-3 py-2 hover:border-f1-gold/50 transition-colors">
                Fuel táblázat megnyitása
              </Link>
            </div>
          </Card>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-f1-text">Stratégia</h3>
            <Button variant="gold" size="sm" onClick={handleAddStrategy}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Új stratégia
            </Button>
          </div>

          {strategyFeedback && (
            <div
              className={`rounded-lg px-4 py-3 text-sm ${
                strategyFeedback.type === 'success'
                  ? 'border border-emerald-400/40 bg-emerald-400/10 text-emerald-300'
                  : 'border border-f1-red/40 bg-f1-red/10 text-f1-red'
              }`}
            >
              {strategyFeedback.message}
            </div>
          )}

          {strategies.length === 0 ? (
            <div className="text-center py-10 text-f1-text-secondary">
              <Target className="h-10 w-10 mx-auto mb-3" />
              Még nincs stratégiai adat ehhez a pályához.
            </div>
          ) : (
            <div className="space-y-4">
              {strategies.map((strategy, index) => (
                <div key={strategy.id} className="rounded-2xl border border-f1-light-gray/40 bg-f1-dark/60 p-4 space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-f1-text-secondary uppercase tracking-wide">Stratégia #{index + 1}</p>
                      <p className="text-xs text-f1-text-secondary">
                        {new Date(strategy.createdAt).toLocaleDateString('hu-HU')}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => beginEditStrategy(strategy)}
                        disabled={savingStrategyId !== null && savingStrategyId !== strategy.id}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteStrategy(strategy.id)}
                        disabled={savingStrategyId === strategy.id}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {editingStrategyId === strategy.id ? (
                    <form className="space-y-4" onSubmit={handleUpdateStrategy}>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <Input
                          label="Undercut"
                          value={strategyDraft.undercut}
                          onChange={(value) => setStrategyDraft((draft) => ({ ...draft, undercut: value }))}
                          required
                        />
                        <Input
                          label="Ideal"
                          value={strategyDraft.ideal}
                          onChange={(value) => setStrategyDraft((draft) => ({ ...draft, ideal: value }))}
                          required
                        />
                        <Input
                          label="Overcut"
                          value={strategyDraft.overcut}
                          onChange={(value) => setStrategyDraft((draft) => ({ ...draft, overcut: value }))}
                          required
                        />
                        <Input
                          label="Undercut erőssége"
                          value={strategyDraft.undercutStrength}
                          onChange={(value) =>
                            setStrategyDraft((draft) => ({ ...draft, undercutStrength: value }))
                          }
                        />
                        <Input
                          label="Pit stop"
                          value={strategyDraft.pitStop}
                          onChange={(value) => setStrategyDraft((draft) => ({ ...draft, pitStop: value }))}
                        />
                        <Input
                          label="ERS"
                          value={strategyDraft.ers}
                          onChange={(value) => setStrategyDraft((draft) => ({ ...draft, ers: value }))}
                        />
                        <Input
                          label="Optimális szektorok"
                          value={strategyDraft.optimalSectors}
                          onChange={(value) =>
                            setStrategyDraft((draft) => ({ ...draft, optimalSectors: value }))
                          }
                        />
                        <div className="md:col-span-2">
                          <label className="block text-xs font-medium text-f1-text mb-1">
                            Megjegyzések
                          </label>
                          <textarea
                            className="input-field w-full min-h-[80px]"
                            value={strategyDraft.notes}
                            onChange={(event) =>
                              setStrategyDraft((draft) => ({ ...draft, notes: event.target.value }))
                            }
                            placeholder="További megjegyzések..."
                          />
                        </div>
                      </div>
                      <div className="flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={cancelEditStrategy}
                          disabled={savingStrategyId === strategy.id}
                        >
                          Mégse
                        </Button>
                        <Button type="submit" variant="gold" disabled={savingStrategyId === strategy.id}>
                          Mentés
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div>
                          <span className="text-f1-text-secondary uppercase text-xs tracking-wide">
                            Undercut
                          </span>
                          <p className="text-f1-text font-semibold">{strategy.undercut}</p>
                        </div>
                        <div>
                          <span className="text-f1-text-secondary uppercase text-xs tracking-wide">
                            Ideal
                          </span>
                          <p className="text-f1-text font-semibold">{strategy.ideal}</p>
                        </div>
                        <div>
                          <span className="text-f1-text-secondary uppercase text-xs tracking-wide">
                            Overcut
                          </span>
                          <p className="text-f1-text font-semibold">{strategy.overcut}</p>
                        </div>
                        <div>
                          <span className="text-f1-text-secondary uppercase text-xs tracking-wide">
                            Undercut erőssége
                          </span>
                          <p className="text-f1-text font-semibold">{strategy.undercutStrength}</p>
                        </div>
                        <div>
                          <span className="text-f1-text-secondary uppercase text-xs tracking-wide">
                            Pit stop
                          </span>
                          <p className="text-f1-text font-semibold">{strategy.pitStop}</p>
                        </div>
                        <div>
                          <span className="text-f1-text-secondary uppercase text-xs tracking-wide">
                            ERS
                          </span>
                          <p className="text-f1-text font-semibold">{strategy.ers}</p>
                        </div>
                        <div className="md:col-span-2">
                          <span className="text-f1-text-secondary uppercase text-xs tracking-wide">
                            Optimális szektorok
                          </span>
                          <p className="text-f1-text font-semibold">{strategy.optimalSectors}</p>
                        </div>
                      </div>

                      {strategy.notes && (
                        <p className="text-sm text-f1-text-secondary">{strategy.notes}</p>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-semibold text-f1-text">Tyre wear</h3>
            {compoundOptions.length > 1 && (
              <div className="inline-flex rounded-full bg-f1-dark/80 border border-f1-light-gray/40 p-1">
                {compoundOptions.map((compoundValue) => {
                  const rawValue = compoundValue ?? 'C3-C4-C5'
                  const payload = rawValue as TireData['compoundSet']
                  return (
                    <button
                      key={payload}
                      onClick={() => setSelectedCompoundSet(payload)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                        payload === activeCompoundSet
                          ? 'bg-f1-gold text-f1-darker'
                          : 'text-f1-text-secondary hover:text-f1-text'
                      }`}
                    >
                      {rawValue.replace(/-/g, ' • ')}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {displayedTires.length ? (
            <TireWearTable tireData={displayedTires} trackName={track.name} />
          ) : (
            <div className="text-center py-10 text-f1-text-secondary">
              <TrendingUp className="h-10 w-10 mx-auto mb-3" />
              Nincs gumiadat ehhez a keverékhez.
            </div>
          )}
        </Card>
      </section>

      <Card className="space-y-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-f1-text">Hotlaps & Setups</h3>
            <p className="text-sm text-f1-text-secondary">
              Legjobb köreink röviden – részletes lista és új hotlap felvitele a külön oldalon.
            </p>
          </div>
          <Link to="/hotlaps">
            <Button variant="secondary" size="sm" className="inline-flex items-center space-x-2">
              <Timer className="h-4 w-4" />
              <span>Összes megnyitása</span>
            </Button>
          </Link>
        </div>

        {topHotlaps.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topHotlaps.map((entry) => {
              const linkedSetupNames = (entry.linkedSetupIds || [])
                .map((id) => setupsById.get(id)?.title || 'Megnevezetlen setup')

              return (
                <div
                  key={entry.id}
                  className="rounded-2xl border border-f1-light-gray/40 bg-f1-dark/60 p-4 space-y-3"
                >
                  <div>
                    <p className="text-xs uppercase tracking-wide text-f1-text-secondary">
                      Köridő
                    </p>
                    <p className="text-2xl font-bold text-f1-text-gold">{entry.lapTime}</p>
                  </div>

                  <div className="grid gap-2 text-xs text-f1-text-secondary">
                    <span>
                      Feltöltő:{' '}
                      <span className="text-f1-text font-medium">{entry.createdBy || 'Driver'}</span>
                    </span>
                    <span>
                      Mentve:{' '}
                      <span className="text-f1-text font-medium">
                        {new Date(entry.createdAt).toLocaleDateString('hu-HU')}
                      </span>
                    </span>
                  </div>

                  {entry.setupName && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-f1-text-secondary">
                        Setup név
                      </p>
                      <p className="text-sm text-f1-text">{entry.setupName}</p>
                    </div>
                  )}

                  {linkedSetupNames.length > 0 && (
                    <div>
                      <p className="text-xs uppercase tracking-wide text-f1-text-secondary">
                        Kapcsolt setupok
                      </p>
                      <ul className="mt-1 space-y-1 text-sm text-f1-text">
                        {linkedSetupNames.map((name, idx) => (
                          <li key={`${entry.id}-setup-${idx}`}>{name}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {entry.notes && (
                    <p className="text-sm text-f1-text-secondary leading-relaxed">{entry.notes}</p>
                  )}
                </div>
              )
            })}
          </div>
        ) : (
          <p className="text-sm text-f1-text-secondary">
            Még nincs mentett hotlap ehhez a pályához. Rögzítsd az első köridőt a Hotlaps & Setups
            oldalon!
          </p>
        )}

        {hotlaps.length > 3 && (
          <p className="text-xs text-f1-text-secondary">
            Összesen {hotlaps.length} hotlap mentve ehhez a pályához.
          </p>
        )}
      </Card>

      <section className="grid gap-6 lg:grid-cols-2">
        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-f1-text">ERS jegyzetek</h3>
          {ersNotes.length === 0 ? (
            <p className="text-sm text-f1-text-secondary">Nincs ERS jegyzet megadva ehhez a pályához.</p>
          ) : (
            <ul className="space-y-2 text-sm text-f1-text-secondary list-disc list-inside">
              {ersNotes.map((note, index) => (
                <li key={index}>{note}</li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="space-y-4">
          <h3 className="text-lg font-semibold text-f1-text">Pálya részletek</h3>
          {details.length === 0 ? (
            <p className="text-sm text-f1-text-secondary">Nincs extra részlet rögzítve.</p>
          ) : (
            <ul className="space-y-2 text-sm text-f1-text-secondary list-disc list-inside">
              {details.map((detail, index) => (
                <li key={index}>{detail}</li>
              ))}
            </ul>
          )}
        </Card>
      </section>

      <Card className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-semibold text-f1-text">Mentett setupok</h3>
          <Link to={`/hotlaps/${trackId}`}>
            <Button variant="gold" size="sm">
              <PlusCircle className="h-4 w-4 mr-2" />
              Setup hozzáadása
            </Button>
          </Link>
        </div>

        {setups.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {setups.map((setup) => (
              <div
                key={setup.id}
                className="rounded-xl border border-f1-light-gray/40 bg-f1-dark/60 p-4 space-y-3"
              >
                <div className="flex items-start justify-between">
                  <h4 className="text-lg font-semibold text-f1-text">{setup.title || 'Setup'}</h4>
                </div>

                <div className="space-y-2 text-sm">
                  <p className="text-f1-text-secondary font-mono text-xs">{setup.configuration}</p>
                  
                  {setup.notes && (
                    <p className="text-f1-text-secondary text-xs">{setup.notes}</p>
                  )}
                  
                  <div className="flex items-center justify-between text-xs text-f1-text-secondary">
                    <span>Mentve: {new Date(setup.createdAt).toLocaleDateString('hu-HU')}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-f1-text-secondary">
            Még nincs mentett setup ehhez a pályához. Rögzítsd az első setupot a Hotlaps & Setups
            oldalon!
          </p>
        )}
      </Card>
    </div>
  )
}

export default TrackDetails
