import React, { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Trophy,
  Timer,
  Plus,
  Trash2,
  Layers,
  Paperclip,
  Download
} from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Select from '../components/Select'
import TrackMapImage from '../components/TrackMapImage'
import { useLocalStorage } from '../hooks/useLocalStorage'
import { f1Tracks } from '../data/tracks'
import {
  Track,
  TrackData,
  HotlapEntry,
  SetupEntry,
  StoredFile
} from '../types'
import { trackMetaData } from '../data/trackMeta'

interface HotlapFormState {
  lapTime: string
  setupName: string
  notes: string
  linkedSetupId: string
  createdBy: string
  attachment: File | null
}

interface SetupFormState {
  title: string
  configuration: string
  notes: string
  linkedHotlapId: string
  createdBy: string
  attachment: File | null
}

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

const createBaseTrackEntry = (trackId: string): TrackData => {
  const meta = trackMetaData[trackId] || {}
  return {
    trackId,
    tireData: [],
    strategies: [],
    bestLap: undefined,
    averageLap: undefined,
    fuelDelta: meta.fuelDelta ?? null,
    drsZones: meta.drsZones ?? null,
    pitStopLoss: meta.pitStopLoss ?? null,
    ersNotes: meta.ersNotes ?? [],
    details: meta.details ?? [],
    tireStintLaps: meta.tireStintLaps ?? null,
    notes: undefined,
    lastUpdated: new Date(),
    hotlaps: [],
    setups: []
  }
}

const fileToStoredFile = async (file: File): Promise<StoredFile> => {
  const data = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

  return {
    name: file.name,
    size: file.size,
    type: file.type,
    data
  }
}

const addUnique = (list: string[] = [], value: string): string[] =>
  list.includes(value) ? list : [...list, value]

const defaultHotlapForm: HotlapFormState = {
  lapTime: '',
  setupName: '',
  notes: '',
  linkedSetupId: '',
  createdBy: '',
  attachment: null
}

const defaultSetupForm: SetupFormState = {
  title: '',
  configuration: '',
  notes: '',
  linkedHotlapId: '',
  createdBy: '',
  attachment: null
}

const HotlapsAndSetups: React.FC = () => {
  const [trackData, setTrackData] = useLocalStorage<TrackData[]>('trackData', [])
  const initialTrack = f1Tracks[0]?.id ?? ''
  const [selectedTrackId, setSelectedTrackId] = useState<string>(initialTrack)
  const [hotlapForm, setHotlapForm] = useState<HotlapFormState>(defaultHotlapForm)
  const [setupForm, setSetupForm] = useState<SetupFormState>(defaultSetupForm)

  useEffect(() => {
    if (!selectedTrackId && f1Tracks.length) {
      setSelectedTrackId(f1Tracks[0].id)
    }
  }, [selectedTrackId])

  useEffect(() => {
    setHotlapForm(defaultHotlapForm)
    setSetupForm(defaultSetupForm)
  }, [selectedTrackId])

  const trackOptions = useMemo(
    () =>
      f1Tracks.map((track) => ({
        value: track.id,
        label: track.name
      })),
    []
  )

  const currentTrack: Track | undefined = f1Tracks.find((track) => track.id === selectedTrackId)
  const currentEntry = trackData.find((entry) => entry.trackId === selectedTrackId)
  const hotlaps = useMemo(() => {
    const entries = currentEntry?.hotlaps ?? []
    return [...entries].sort((a, b) => parseLapTime(a.lapTime) - parseLapTime(b.lapTime))
  }, [currentEntry])
  const setups = currentEntry?.setups ?? []

  const setupOptions = useMemo(
    () =>
      setups.map((setup, index) => ({
        value: setup.id,
        label: setup.title || `Setup #${index + 1}`
      })),
    [setups]
  )

  const hotlapOptions = useMemo(
    () =>
      hotlaps.map((entry, index) => ({
        value: entry.id,
        label: `Hotlap #${index + 1} • ${entry.lapTime}`
      })),
    [hotlaps]
  )

  const setupsById = useMemo(() => {
    const map = new Map<string, SetupEntry>()
    setups.forEach((setup) => map.set(setup.id, setup))
    return map
  }, [setups])

  const hotlapsById = useMemo(() => {
    const map = new Map<string, HotlapEntry>()
    hotlaps.forEach((entry) => map.set(entry.id, entry))
    return map
  }, [hotlaps])

  const updateTrackEntry = (trackId: string, transform: (entry: TrackData) => TrackData) => {
    setTrackData((prev) => {
      const index = prev.findIndex((item) => item.trackId === trackId)
      if (index !== -1) {
        const baseEntry = {
          ...prev[index],
          hotlaps: prev[index].hotlaps ?? [],
          setups: prev[index].setups ?? []
        }
        const updated = transform(baseEntry)
        const next = [...prev]
        next[index] = updated
        return next
      }

      const base = createBaseTrackEntry(trackId)
      return [...prev, transform(base)]
    })
  }

  const handleAddHotlap = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedTrackId || !hotlapForm.lapTime.trim()) return

    const attachment = hotlapForm.attachment
      ? await fileToStoredFile(hotlapForm.attachment)
      : undefined
    const linkedSetupId = hotlapForm.linkedSetupId || undefined

    updateTrackEntry(selectedTrackId, (entry) => {
      const linkedSetup = linkedSetupId ? setupsById.get(linkedSetupId) : undefined

      const newHotlap: HotlapEntry = {
        id: Date.now().toString(),
        trackId: selectedTrackId,
        lapTime: hotlapForm.lapTime.trim(),
        setupName: hotlapForm.setupName.trim() || linkedSetup?.title,
        notes: hotlapForm.notes.trim() || undefined,
        attachment,
        linkedSetupIds: linkedSetupId ? [linkedSetupId] : undefined,
        createdAt: new Date().toISOString(),
        createdBy: hotlapForm.createdBy.trim() || undefined
      }

      const updatedHotlaps = [...(entry.hotlaps ?? []), newHotlap]
      const updatedSetups = (entry.setups ?? []).map((setup) =>
        setup.id === linkedSetupId
          ? {
              ...setup,
              linkedHotlapIds: addUnique(setup.linkedHotlapIds, newHotlap.id)
            }
          : setup
      )

      return {
        ...entry,
        hotlaps: updatedHotlaps,
        setups: updatedSetups,
        lastUpdated: new Date()
      }
    })

    setHotlapForm(defaultHotlapForm)
  }

  const handleAddSetup = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedTrackId || !setupForm.configuration.trim()) return

    const attachment = setupForm.attachment
      ? await fileToStoredFile(setupForm.attachment)
      : undefined
    const linkedHotlapId = setupForm.linkedHotlapId || undefined

    updateTrackEntry(selectedTrackId, (entry) => {
      const newSetup: SetupEntry = {
        id: Date.now().toString(),
        trackId: selectedTrackId,
        title: setupForm.title.trim() || undefined,
        configuration: setupForm.configuration.replace(/\r\n/g, '\n'),
        notes: setupForm.notes.trim() || undefined,
        attachment,
        linkedHotlapIds: linkedHotlapId ? [linkedHotlapId] : undefined,
        createdAt: new Date().toISOString(),
        createdBy: setupForm.createdBy.trim() || undefined
      }

      const updatedSetups = [...(entry.setups ?? []), newSetup]
      const updatedHotlaps = (entry.hotlaps ?? []).map((hotlap) =>
        hotlap.id === linkedHotlapId
          ? {
              ...hotlap,
              linkedSetupIds: addUnique(hotlap.linkedSetupIds, newSetup.id),
              setupName: hotlap.setupName || newSetup.title
            }
          : hotlap
      )

      return {
        ...entry,
        setups: updatedSetups,
        hotlaps: updatedHotlaps,
        lastUpdated: new Date()
      }
    })

    setSetupForm(defaultSetupForm)
  }

  const handleDeleteHotlap = (hotlapId: string) => {
    if (!selectedTrackId) return

    updateTrackEntry(selectedTrackId, (entry) => {
      const filteredHotlaps = (entry.hotlaps ?? []).filter((hotlap) => hotlap.id !== hotlapId)
      const filteredSetups = (entry.setups ?? []).map((setup) => ({
        ...setup,
        linkedHotlapIds: setup.linkedHotlapIds?.filter((id) => id !== hotlapId)
      }))

      return {
        ...entry,
        hotlaps: filteredHotlaps,
        setups: filteredSetups,
        lastUpdated: new Date()
      }
    })
  }

  const handleDeleteSetup = (setupId: string) => {
    if (!selectedTrackId) return

    updateTrackEntry(selectedTrackId, (entry) => {
      const filteredSetups = (entry.setups ?? []).filter((setup) => setup.id !== setupId)
      const filteredHotlaps = (entry.hotlaps ?? []).map((hotlap) => ({
        ...hotlap,
        linkedSetupIds: hotlap.linkedSetupIds?.filter((id) => id !== setupId)
      }))

      return {
        ...entry,
        setups: filteredSetups,
        hotlaps: filteredHotlaps,
        lastUpdated: new Date()
      }
    })
  }

  return (
    <div className="space-y-10 fade-in">
      <header className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 slide-down">
        <div>
          <h1 className="text-3xl font-bold gradient-text-gold">Hotlaps & Setups</h1>
          <p className="text-f1-text-secondary max-w-3xl">
            Rögzítsd a legjobb köreidet és a hozzájuk tartozó beállításokat, hogy mindig kéznél
            legyen a leggyorsabb kombináció minden pályához.
          </p>
        </div>
        <Link to="/tracks">
          <Button variant="secondary">Vissza a pályákhoz</Button>
        </Link>
      </header>

      <Card className="space-y-6 slide-up">
        <div className="grid grid-cols-1 xl:grid-cols-[320px,1fr] gap-6">
          <div className="space-y-4">
            <Select
              label="Pálya"
              options={trackOptions}
              value={selectedTrackId}
              onChange={setSelectedTrackId}
              placeholder="Válassz pályát..."
              required
            />

            {currentTrack ? (
              <TrackMapImage
                src={currentTrack.mapImageUrl}
                alt={`${currentTrack.name} map`}
                className="h-48 border border-f1-light-gray/40"
                fit="contain"
                showOverlay={false}
              />
            ) : (
              <div className="h-48 rounded-2xl border border-dashed border-f1-light-gray/40 flex items-center justify-center text-f1-text-secondary">
                Válassz pályát a listából
              </div>
            )}
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-semibold text-f1-text mb-4 flex items-center space-x-2">
                <Timer className="h-5 w-5 text-f1-gold" />
                <span>Új hotlap</span>
              </h2>
              <form onSubmit={handleAddHotlap} className="space-y-4">
                <Input
                  label="Köridő"
                  placeholder="Pl. 1:26.745"
                  value={hotlapForm.lapTime}
                  onChange={(value) => setHotlapForm((prev) => ({ ...prev, lapTime: value }))}
                  required
                />

                <Select
                  label="Kapcsolódó setup"
                  options={[{ value: 'none', label: 'Nincs hozzárendelve' }, ...setupOptions]}
                  value={hotlapForm.linkedSetupId || 'none'}
                  onChange={(value) =>
                    setHotlapForm((prev) => ({
                      ...prev,
                      linkedSetupId: value === 'none' ? '' : value
                    }))
                  }
                />

                <Input
                  label="Setup neve / kulcsszavai"
                  placeholder="Pl. Time Trial • Medium Downforce"
                  value={hotlapForm.setupName}
                  onChange={(value) => setHotlapForm((prev) => ({ ...prev, setupName: value }))}
                />

                <Input
                  label="Feltöltő neve"
                  placeholder="Pl. Driver"
                  value={hotlapForm.createdBy}
                  onChange={(value) => setHotlapForm((prev) => ({ ...prev, createdBy: value }))}
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-f1-text">Megjegyzések</label>
                  <textarea
                    className="input-field min-h-[120px] resize-y"
                    placeholder="ERS stratégia, gumihőmérséklet, TC/ABS, stb."
                    value={hotlapForm.notes}
                    onChange={(event) =>
                      setHotlapForm((prev) => ({ ...prev, notes: event.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-f1-text">Hotlap fájl (opcionális)</label>
                  <input
                    type="file"
                    accept=".txt,.pdf,.json,.zip,.csv,.png,.jpg,.jpeg"
                    onChange={(event) =>
                      setHotlapForm((prev) => ({
                        ...prev,
                        attachment: event.target.files?.[0] ?? null
                      }))
                    }
                    className="block w-full text-sm text-f1-text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-f1-light-gray file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-f1-gray transition-colors"
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" variant="gold" className="inline-flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Hotlap mentése</span>
                  </Button>
                </div>
              </form>
            </div>

            <div>
              <h2 className="text-xl font-semibold text-f1-text mb-4 flex items-center space-x-2">
                <Layers className="h-5 w-5 text-f1-gold" />
                <span>Új setup</span>
              </h2>
              <form onSubmit={handleAddSetup} className="space-y-4">
                <Input
                  label="Setup neve"
                  placeholder="Pl. Race • Balanced"
                  value={setupForm.title}
                  onChange={(value) => setSetupForm((prev) => ({ ...prev, title: value }))}
                />

                <Select
                  label="Kapcsolódó hotlap"
                  options={[{ value: 'none', label: 'Nincs hozzárendelve' }, ...hotlapOptions]}
                  value={setupForm.linkedHotlapId || 'none'}
                  onChange={(value) =>
                    setSetupForm((prev) => ({
                      ...prev,
                      linkedHotlapId: value === 'none' ? '' : value
                    }))
                  }
                />

                <Input
                  label="Feltöltő neve"
                  placeholder="Pl. Driver"
                  value={setupForm.createdBy}
                  onChange={(value) => setSetupForm((prev) => ({ ...prev, createdBy: value }))}
                />

                <div className="space-y-2">
                  <label className="text-sm font-medium text-f1-text">Setup felépítés</label>
                  <textarea
                    className="input-field min-h-[160px] font-mono whitespace-pre resize-y"
                    placeholder="30-15\n100-25\nLLLL\n41-1-1-21-21-40\n100-55\nmax min"
                    value={setupForm.configuration}
                    onChange={(event) =>
                      setSetupForm((prev) => ({ ...prev, configuration: event.target.value }))
                    }
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-f1-text">Megjegyzések</label>
                  <textarea
                    className="input-field min-h-[120px] resize-y"
                    placeholder="Plusz részletek, guminyomás, diff értékek stb."
                    value={setupForm.notes}
                    onChange={(event) =>
                      setSetupForm((prev) => ({ ...prev, notes: event.target.value }))
                    }
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-f1-text">Setup fájl (opcionális)</label>
                  <input
                    type="file"
                    accept=".txt,.pdf,.json,.zip,.csv"
                    onChange={(event) =>
                      setSetupForm((prev) => ({
                        ...prev,
                        attachment: event.target.files?.[0] ?? null
                      }))
                    }
                    className="block w-full text-sm text-f1-text-secondary file:mr-3 file:rounded-md file:border-0 file:bg-f1-light-gray file:px-3 file:py-2 file:text-sm file:font-medium hover:file:bg-f1-gray transition-colors"
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" variant="gold" className="inline-flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>Setup mentése</span>
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </Card>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-f1-text flex items-center space-x-2">
            <Trophy className="h-6 w-6 text-f1-gold" />
            <span>Mentett hotlapok</span>
          </h2>
          {currentTrack && (
            <span className="text-sm text-f1-text-secondary">
              {currentTrack.name} • {hotlaps.length} hotlap
            </span>
          )}
        </div>

        {currentTrack ? (
          hotlaps.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {hotlaps.map((entry, index) => {
                const linkedSetups = (entry.linkedSetupIds || [])
                  .map((id) => setupsById.get(id))
                  .filter(Boolean) as SetupEntry[]

                return (
                  <Card
                    key={entry.id}
                    className="space-y-4 border border-f1-light-gray/50 hover:border-f1-gold/40 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-f1-text-secondary uppercase tracking-wide">
                          Hotlap #{index + 1}
                        </p>
                        <p className="text-2xl font-bold text-f1-text-gold mt-1">{entry.lapTime}</p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteHotlap(entry.id)}
                        className="border-f1-light-gray/40 hover:border-f1-red/40 hover:text-f1-red"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid gap-2 text-sm">
                      <div className="text-f1-text-secondary">
                        Feltöltő:{' '}
                        <span className="text-f1-text font-medium">
                          {entry.createdBy || 'Driver'}
                        </span>
                      </div>
                      <div className="text-f1-text-secondary">
                        Mentve:{' '}
                        <span className="text-f1-text font-medium">
                          {new Date(entry.createdAt).toLocaleString('hu-HU')}
                        </span>
                      </div>
                    </div>

                    {linkedSetups.length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-f1-text-secondary">
                          Kapcsolt setupok
                        </p>
                        <ul className="mt-1 space-y-1 text-sm text-f1-text">
                          {linkedSetups.map((setup) => (
                            <li key={setup.id}>{setup.title || 'Megnevezetlen setup'}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {entry.setupName && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-f1-text-secondary">
                          Setup név
                        </p>
                        <p className="text-sm text-f1-text">{entry.setupName}</p>
                      </div>
                    )}

                    {entry.notes && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-f1-text-secondary">
                          Megjegyzések
                        </p>
                        <p className="text-sm text-f1-text-secondary leading-relaxed">
                          {entry.notes}
                        </p>
                      </div>
                    )}

                    {entry.attachment && (
                      <a
                        href={entry.attachment.data}
                        download={entry.attachment.name}
                        className="inline-flex items-center space-x-2 text-sm text-f1-gold hover:text-white transition-colors"
                      >
                        <Paperclip className="h-4 w-4" />
                        <span>{entry.attachment.name}</span>
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="text-center py-12 border border-dashed border-f1-light-gray/40 space-y-4">
              <Timer className="h-10 w-10 text-f1-text-secondary mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-f1-text">Még nincs hotlap mentve</h3>
                <p className="text-sm text-f1-text-secondary max-w-md mx-auto">
                  Add hozzá az első köridődet, és csatold hozzá a setupot, hogy legközelebb is
                  reprodukálni tudd a tempót.
                </p>
              </div>
            </Card>
          )
        ) : (
          <Card className="text-center py-12 border border-dashed border-f1-light-gray/40 text-f1-text-secondary">
            Válassz egy pályát a hotlapok kezeléséhez.
          </Card>
        )}
      </section>

      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-f1-text flex items-center space-x-2">
            <Layers className="h-6 w-6 text-f1-gold" />
            <span>Mentett setupok</span>
          </h2>
          {currentTrack && (
            <span className="text-sm text-f1-text-secondary">
              {currentTrack.name} • {setups.length} setup
            </span>
          )}
        </div>

        {currentTrack ? (
          setups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {setups.map((setup, index) => {
                const linkedHotlaps = (setup.linkedHotlapIds || [])
                  .map((id) => hotlapsById.get(id))
                  .filter(Boolean) as HotlapEntry[]

                return (
                  <Card
                    key={setup.id}
                    className="space-y-4 border border-f1-light-gray/50 hover:border-f1-gold/40 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm text-f1-text-secondary uppercase tracking-wide">
                          Setup #{index + 1}
                        </p>
                        <p className="text-lg font-semibold text-f1-text mt-1">
                          {setup.title || 'Megnevezetlen setup'}
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteSetup(setup.id)}
                        className="border-f1-light-gray/40 hover:border-f1-red/40 hover:text-f1-red"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid gap-2 text-sm">
                      <div className="text-f1-text-secondary">
                        Feltöltő:{' '}
                        <span className="text-f1-text font-medium">
                          {setup.createdBy || 'Driver'}
                        </span>
                      </div>
                      <div className="text-f1-text-secondary">
                        Mentve:{' '}
                        <span className="text-f1-text font-medium">
                          {new Date(setup.createdAt).toLocaleString('hu-HU')}
                        </span>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs uppercase tracking-wide text-f1-text-secondary">
                        Konfiguráció
                      </p>
                      <pre className="mt-2 rounded-lg bg-f1-dark/70 border border-f1-light-gray/30 p-3 text-sm font-mono text-f1-text whitespace-pre-wrap">
                        {setup.configuration}
                      </pre>
                    </div>

                    {setup.notes && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-f1-text-secondary">
                          Megjegyzések
                        </p>
                        <p className="text-sm text-f1-text-secondary leading-relaxed">
                          {setup.notes}
                        </p>
                      </div>
                    )}

                    {linkedHotlaps.length > 0 && (
                      <div>
                        <p className="text-xs uppercase tracking-wide text-f1-text-secondary">
                          Kapcsolt hotlapok
                        </p>
                        <ul className="mt-1 space-y-1 text-sm text-f1-text">
                          {linkedHotlaps.map((hotlap) => (
                            <li key={hotlap.id}>{hotlap.lapTime}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {setup.attachment && (
                      <a
                        href={setup.attachment.data}
                        download={setup.attachment.name}
                        className="inline-flex items-center space-x-2 text-sm text-f1-gold hover:text-white transition-colors"
                      >
                        <Paperclip className="h-4 w-4" />
                        <span>{setup.attachment.name}</span>
                        <Download className="h-4 w-4" />
                      </a>
                    )}
                  </Card>
                )
              })}
            </div>
          ) : (
            <Card className="text-center py-12 border border-dashed border-f1-light-gray/40 space-y-4">
              <Layers className="h-10 w-10 text-f1-text-secondary mx-auto" />
              <div>
                <h3 className="text-lg font-semibold text-f1-text">Még nincs setup mentve</h3>
                <p className="text-sm text-f1-text-secondary max-w-md mx-auto">
                  Írd le a teljes beállítást soronként, ahogy a csapat használja, és opcionálisan
                  csatolj hotlapot is hozzá.
                </p>
              </div>
            </Card>
          )
        ) : (
          <Card className="text-center py-12 border border-dashed border-f1-light-gray/40 text-f1-text-secondary">
            Válassz egy pályát a setupok kezeléséhez.
          </Card>
        )}
      </section>
    </div>
  )
}

export default HotlapsAndSetups
