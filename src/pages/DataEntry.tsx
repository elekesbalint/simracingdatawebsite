import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Save,
  X,
  MapPin,
  Clock,
  Thermometer,
  Target
} from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Select from '../components/Select'
import { f1Tracks } from '../data/tracks'
import { TrackData, TireData, Strategy } from '../types'
import { useTrackData } from '../context/TrackDataContext'
import LoadingSpinner from '../components/LoadingSpinner'

const DataEntry: React.FC = () => {
  const navigate = useNavigate()
  const { trackData, updateTrack, loading: trackLoading } = useTrackData()
  const [activeTab, setActiveTab] = useState<'tire' | 'strategy' | 'lap'>('tire')
  
  // Form states
  const [selectedTrack, setSelectedTrack] = useState('')
  const initialTireForm = {
    compoundSet: 'C3-C4-C5',
    soft: '',
    medium: '',
    hard: ''
  }
  const [tireForm, setTireForm] = useState(initialTireForm)
  const [strategyForm, setStrategyForm] = useState({
    undercut: '',
    ideal: '',
    overcut: '',
    undercutStrength: '',
    pitStop: '',
    ers: '',
    optimalSectors: '',
    notes: ''
  })
  const [lapForm, setLapForm] = useState({
    bestLap: '',
    averageLap: '',
    notes: ''
  })

  const trackOptions = f1Tracks.map(track => ({
    value: track.id,
    label: track.name
  }))

  const compoundSetOptions = [
    { value: 'C1-C2-C3', label: 'C1 • C2 • C3' },
    { value: 'C2-C3-C4', label: 'C2 • C3 • C4' },
    { value: 'C3-C4-C5', label: 'C3 • C4 • C5' }
  ]

  const handleTireSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTrack) return

    const softWear = tireForm.soft.trim()
    const mediumWear = tireForm.medium.trim()
    const hardWear = tireForm.hard.trim()

    if (!softWear || !mediumWear || !hardWear) {
      return
    }

    const normalize = (value: string) => value.trim()
    const compoundSet = tireForm.compoundSet as TireData['compoundSet']

    const newTireData: TireData[] = [
      {
        compound: 'soft',
        degradation: normalize(softWear),
        compoundSet
      },
      {
        compound: 'medium',
        degradation: normalize(mediumWear),
        compoundSet
      },
      {
        compound: 'hard',
        degradation: normalize(hardWear),
        compoundSet
      }
    ]

    await updateTrack(selectedTrack, (current) => ({
      ...current,
      tireData: newTireData,
      lastUpdated: new Date()
    }))
  }

  const handleStrategySubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTrack) return

    const newStrategy: Strategy = {
      id: Date.now().toString(),
      trackId: selectedTrack,
      undercut: strategyForm.undercut,
      ideal: strategyForm.ideal,
      overcut: strategyForm.overcut,
      undercutStrength: strategyForm.undercutStrength,
      pitStop: strategyForm.pitStop,
      ers: strategyForm.ers,
      optimalSectors: strategyForm.optimalSectors,
      notes: strategyForm.notes,
      createdAt: new Date()
    }

    await updateTrack(selectedTrack, (current) => ({
      ...current,
      strategies: [...current.strategies, newStrategy],
      lastUpdated: new Date()
    }))

    setStrategyForm({
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

  const handleLapSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedTrack) return

    const bestLapValueRaw = lapForm.bestLap ? parseInt(lapForm.bestLap, 10) : undefined
    const averageLapValueRaw = lapForm.averageLap ? parseInt(lapForm.averageLap, 10) : undefined

    const bestLapValue = Number.isNaN(bestLapValueRaw) ? undefined : bestLapValueRaw
    const averageLapValue = Number.isNaN(averageLapValueRaw) ? undefined : averageLapValueRaw

    await updateTrack(selectedTrack, (current) => ({
      ...current,
      bestLap: bestLapValue ?? current.bestLap,
      averageLap: averageLapValue ?? current.averageLap,
      notes: lapForm.notes || current.notes,
      lastUpdated: new Date()
    }))
  }

  useEffect(() => {
    if (!selectedTrack) {
      setTireForm(initialTireForm)
      setLapForm({ bestLap: '', averageLap: '', notes: '' })
      return
    }

    const entry = trackData.find((item) => item.trackId === selectedTrack)
    if (!entry) {
      setTireForm(initialTireForm)
      setLapForm({ bestLap: '', averageLap: '', notes: '' })
      return
    }

    const soft = entry.tireData.find((tire) => tire.compound === 'soft')
    const medium = entry.tireData.find((tire) => tire.compound === 'medium')
    const hard = entry.tireData.find((tire) => tire.compound === 'hard')

    const toInput = (value: TireData['degradation'] | undefined) => {
      if (value === null || value === undefined) return ''
      if (typeof value === 'number') return value.toString()
      return value
    }

    setTireForm({
      compoundSet: (soft?.compoundSet || medium?.compoundSet || hard?.compoundSet || 'C3-C4-C5'),
      soft: toInput(soft?.degradation),
      medium: toInput(medium?.degradation),
      hard: toInput(hard?.degradation)
    })

    setLapForm({
      bestLap: entry.bestLap !== undefined ? entry.bestLap.toString() : '',
      averageLap: entry.averageLap !== undefined ? entry.averageLap.toString() : '',
      notes: entry.notes ?? ''
    })
  }, [selectedTrack, trackData])
  }

  const tabs = [
    { id: 'tire', label: 'Gumikopás adatok', icon: Thermometer },
    { id: 'strategy', label: 'Stratégia', icon: Target },
    { id: 'lap', label: 'Kör információk', icon: Clock }
  ]

  if (trackLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between slide-down">
        <div>
          <h1 className="text-3xl font-bold gradient-text-gold">Adatbevitel</h1>
          <p className="text-f1-text-secondary mt-2">
            Új adatok hozzáadása a pályákhoz
          </p>
        </div>
        
        <Button variant="outline" onClick={() => navigate('/')}>
          <X className="h-4 w-4 mr-2" />
          Mégse
        </Button>
      </div>

      {/* Track Selection */}
      <Card>
        <h2 className="text-xl font-bold text-f1-text mb-4">Pálya kiválasztása</h2>
        <Select
          label="Pálya"
          options={trackOptions}
          value={selectedTrack}
          onChange={setSelectedTrack}
          placeholder="Válassz egy pályát..."
          required
        />
      </Card>

      {selectedTrack && (
        <>
          {/* Tabs */}
          <div className="border-b border-f1-light-gray">
            <nav className="flex space-x-8">
              {tabs.map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-f1-red text-f1-red'
                        : 'border-transparent text-f1-text-secondary hover:text-f1-text hover:border-f1-light-gray'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{tab.label}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          {/* Tab Content */}
          <div className="space-y-6">
            {activeTab === 'tire' && (
              <Card>
                <form onSubmit={handleTireSubmit} className="space-y-6">
                  <h3 className="text-xl font-bold text-f1-text mb-6">Gumikopás adatok hozzáadása</h3>

                  <Select
                    label="Gumikeverék"
                    options={compoundSetOptions}
                    value={tireForm.compoundSet}
                    onChange={(value) => setTireForm({ ...tireForm, compoundSet: value })}
                    required
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Input
                      label="Soft (S) kopás (%)"
                      type="text"
                      value={tireForm.soft}
                      onChange={(value) => setTireForm({ ...tireForm, soft: value })}
                      placeholder="Pl. 8-9%"
                      required
                    />

                    <Input
                      label="Medium (M) kopás (%)"
                      type="text"
                      value={tireForm.medium}
                      onChange={(value) => setTireForm({ ...tireForm, medium: value })}
                      placeholder="Pl. 6.5%"
                      required
                    />

                    <Input
                      label="Hard (H) kopás (%)"
                      type="text"
                      value={tireForm.hard}
                      onChange={(value) => setTireForm({ ...tireForm, hard: value })}
                      placeholder="Pl. 4%"
                      required
                    />
                  </div>

                  <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline" onClick={() => navigate('/')}>
                      Mégse
                    </Button>
                    <Button type="submit">
                      <Save className="h-4 w-4 mr-2" />
                      Mentés
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {activeTab === 'strategy' && (
              <Card>
                <form onSubmit={handleStrategySubmit} className="space-y-6">
                  <h3 className="text-xl font-bold text-f1-text mb-6">Stratégia hozzáadása</h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Undercut"
                      value={strategyForm.undercut}
                      onChange={(value) => setStrategyForm({ ...strategyForm, undercut: value })}
                      placeholder="Pl. MH kör 9"
                      required
                    />

                    <Input
                      label="Ideal"
                      value={strategyForm.ideal}
                      onChange={(value) => setStrategyForm({ ...strategyForm, ideal: value })}
                      placeholder="Pl. MH kör 10"
                      required
                    />

                    <Input
                      label="Overcut"
                      value={strategyForm.overcut}
                      onChange={(value) => setStrategyForm({ ...strategyForm, overcut: value })}
                      placeholder="Pl. MH kör 11"
                      required
                    />

                    <Input
                      label="Undercut erőssége"
                      value={strategyForm.undercutStrength}
                      onChange={(value) => setStrategyForm({ ...strategyForm, undercutStrength: value })}
                      placeholder="Pl. 1 sec"
                    />

                    <Input
                      label="Pit stop idő"
                      value={strategyForm.pitStop}
                      onChange={(value) => setStrategyForm({ ...strategyForm, pitStop: value })}
                      placeholder="Pl. 28 másodperc"
                    />

                    <Input
                      label="ERS"
                      value={strategyForm.ers}
                      onChange={(value) => setStrategyForm({ ...strategyForm, ers: value })}
                      placeholder="Pl. nincs adat"
                    />

                    <Input
                      label="Optimális szektorok"
                      value={strategyForm.optimalSectors}
                      onChange={(value) => setStrategyForm({ ...strategyForm, optimalSectors: value })}
                      placeholder="Pl. nincs adat"
                    />
                  </div>

                  <Input
                    label="Megjegyzések"
                    value={strategyForm.notes}
                    onChange={(value) => setStrategyForm({ ...strategyForm, notes: value })}
                    placeholder="További megjegyzések..."
                  />
                  
                  <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline" onClick={() => navigate('/')}>
                      Mégse
                    </Button>
                    <Button type="submit">
                      <Save className="h-4 w-4 mr-2" />
                      Mentés
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {activeTab === 'lap' && (
              <Card>
                <form onSubmit={handleLapSubmit} className="space-y-6">
                  <h3 className="text-xl font-bold text-f1-text mb-6">Kör adatok hozzáadása</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                      label="Legjobb kör (szám)"
                      type="number"
                      min={1}
                      value={lapForm.bestLap}
                      onChange={(value) => setLapForm({ ...lapForm, bestLap: value })}
                      placeholder="Pl. 23"
                    />
                    
                    <Input
                      label="Átlagos kör (szám)"
                      type="number"
                      min={1}
                      value={lapForm.averageLap}
                      onChange={(value) => setLapForm({ ...lapForm, averageLap: value })}
                      placeholder="Pl. 28"
                    />
                  </div>
                  
                  <Input
                    label="Megjegyzések"
                    value={lapForm.notes}
                    onChange={(value) => setLapForm({ ...lapForm, notes: value })}
                    placeholder="Lapidő adatokhoz kapcsolódó megjegyzések..."
                  />
                  
                  <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline" onClick={() => navigate('/')}>
                      Mégse
                    </Button>
                    <Button type="submit">
                      <Save className="h-4 w-4 mr-2" />
                      Mentés
                    </Button>
                  </div>
                </form>
              </Card>
            )}
          </div>
        </>
      )}

      {!selectedTrack && (
        <Card>
          <div className="text-center py-12">
            <MapPin className="h-16 w-16 text-f1-text-secondary mx-auto mb-4" />
            <h3 className="text-xl font-bold text-f1-text mb-2">Válassz egy pályát</h3>
            <p className="text-f1-text-secondary">
              Kezdéshez válassz ki egy pályát a fenti listából
            </p>
          </div>
        </Card>
      )}
    </div>
  )
}

export default DataEntry
