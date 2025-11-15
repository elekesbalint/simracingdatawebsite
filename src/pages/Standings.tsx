import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { BarChart3, Flag, Upload, Trash2, FileDown } from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Select from '../components/Select'
import LoadingSpinner from '../components/LoadingSpinner'
import { f1Tracks } from '../data/tracks'
import { teamOptions } from '../data/f1Teams'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { PitStopEntry, SessionType, StandingsEvent, StandingsResult, StoredFile } from '../types'

interface EventFormState {
  league: string
  round: string
  season: string
  telemetryFile: File | null
  notes: string
}

interface PitStopFormState {
  lap: string
  fromTyre: string
  toTyre: string
  fromCompound: string
  toCompound: string
}

interface ResultFormState {
  position: string
  driver: string
  team: string
  tyre: string
  tyreCompound: string
  lapTime: string
  gap: string
  startingPosition: string
  pitStopCount: string
  bestLap: string
  finishTime: string
  points: string
  notes: string
  pitStops: PitStopFormState[]
}

interface OCRSuggestion {
  position?: number | null
  driver?: string | null
  team?: string | null
  tyre?: string | null
  tyreCompound?: string | null
  lapTime?: string | null
  gap?: string | null
  startingPosition?: number | null
  pitStopCount?: number | null
  bestLap?: string | null
  finishTime?: string | null
  points?: number | null
}

const tyreOptions = [
  { value: 'soft', label: 'Soft (piros)' },
  { value: 'medium', label: 'Medium (sárga)' },
  { value: 'hard', label: 'Hard (fehér)' },
  { value: 'intermediate', label: 'Intermediate (zöld)' },
  { value: 'wet', label: 'Wet (kék)' }
]

const tyreValueList = ['soft', 'medium', 'hard', 'intermediate', 'wet'] as const
type TyreValue = (typeof tyreValueList)[number]

const isTyreValue = (value: string): value is TyreValue =>
  tyreValueList.includes(value as TyreValue)

const compoundOptions = ['C1', 'C2', 'C3', 'C4', 'C5', 'C6'].map((compound) => ({
  value: compound,
  label: compound
}))

const defaultPitStop = (): PitStopFormState => ({
  lap: '',
  fromTyre: '',
  toTyre: '',
  fromCompound: '',
  toCompound: ''
})

const defaultResultForm = (session: SessionType): ResultFormState => ({
  position: '',
  driver: '',
  team: teamOptions[0]?.value ?? '',
  tyre: session === 'qualifying' ? 'soft' : '',
  tyreCompound: '',
  lapTime: '',
  gap: '',
  startingPosition: '',
  pitStopCount: '',
  bestLap: '',
  finishTime: '',
  points: '',
  notes: '',
  pitStops: session === 'race' ? [defaultPitStop()] : []
})

const defaultEventForm: EventFormState = {
  league: '',
  round: '',
  season: '',
  telemetryFile: null,
  notes: ''
}

const mapResultToFormState = (entry: StandingsResult, session: SessionType): ResultFormState => ({
  position: entry.position ? String(entry.position) : '',
  driver: entry.driver ?? '',
  team: entry.team ?? teamOptions[0]?.value ?? '',
  tyre: entry.tyre ?? '',
  tyreCompound: entry.tyreCompound ?? '',
  lapTime: entry.lapTime ?? '',
  gap: entry.gap ?? '',
  startingPosition: entry.startingPosition ? String(entry.startingPosition) : '',
  pitStopCount: entry.pitStopCount ? String(entry.pitStopCount) : '',
  bestLap: entry.bestLap ?? '',
  finishTime: entry.finishTime ?? '',
  points: entry.points ? String(entry.points) : '',
  notes: entry.notes ?? '',
  pitStops:
    session === 'race'
      ? (entry.pitStops ?? []).map((stop) => ({
          lap: stop.lap ? String(stop.lap) : '',
          fromTyre: stop.fromTyre ?? '',
          toTyre: stop.toTyre ?? '',
          fromCompound: stop.fromCompound ?? '',
          toCompound: stop.toCompound ?? ''
        }))
      : []
})

const suggestionToFormState = (suggestion: OCRSuggestion, session: SessionType): ResultFormState => ({
  position: suggestion.position ? String(suggestion.position) : '',
  driver: suggestion.driver ?? '',
  team: suggestion.team ?? teamOptions[0]?.value ?? '',
  tyre: suggestion.tyre ?? (session === 'qualifying' ? 'soft' : ''),
  tyreCompound: suggestion.tyreCompound ?? '',
  lapTime: suggestion.lapTime ?? '',
  gap: suggestion.gap ?? '',
  startingPosition: suggestion.startingPosition ? String(suggestion.startingPosition) : '',
  pitStopCount: suggestion.pitStopCount ? String(suggestion.pitStopCount) : '',
  bestLap: suggestion.bestLap ?? '',
  finishTime: suggestion.finishTime ?? '',
  points: suggestion.points ? String(suggestion.points) : '',
  notes: '',
  pitStops: session === 'race' ? [] : []
})

const suggestionToPayload = (
  suggestion: OCRSuggestion,
  sessionType: SessionType,
  eventId: string
) => {
  const normalizeNumber = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(Number(value))) return null
    return Number(value)
  }

  return {
    event_id: eventId,
    session_type: sessionType,
    position: normalizeNumber(suggestion.position),
    driver: suggestion.driver?.trim() || '',
    team: suggestion.team?.trim() || '',
    tyre: suggestion.tyre?.trim() || null,
    tyre_compound: suggestion.tyreCompound?.trim().toUpperCase() || null,
    lap_time: suggestion.lapTime?.trim() || null,
    gap: suggestion.gap?.trim() || null,
    starting_position: sessionType === 'race' ? normalizeNumber(suggestion.startingPosition) : null,
    pit_stop_count: sessionType === 'race' ? normalizeNumber(suggestion.pitStopCount) : null,
    pit_stops: sessionType === 'race' ? null : null,
    best_lap: sessionType === 'race' ? suggestion.bestLap?.trim() || null : null,
    finish_time: sessionType === 'race' ? suggestion.finishTime?.trim() || null : null,
    points: sessionType === 'race' ? normalizeNumber(suggestion.points) : null,
    notes: null
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

const MAX_SCREENSHOT_DIMENSION = 1920

const loadImageFromDataUrl = (dataUrl: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = (err) => reject(err)
    image.crossOrigin = 'anonymous'
    image.src = dataUrl
  })
}

const convertScreenshotForUpload = async (file: File): Promise<string> => {
  try {
    const stored = await fileToStoredFile(file)
    if (!stored.type.startsWith('image/')) {
      return stored.data
    }

    const image = await loadImageFromDataUrl(stored.data)
    let { width, height } = image

    const exceedsLimit = width > MAX_SCREENSHOT_DIMENSION || height > MAX_SCREENSHOT_DIMENSION
    if (exceedsLimit) {
      const scale = Math.min(MAX_SCREENSHOT_DIMENSION / width, MAX_SCREENSHOT_DIMENSION / height)
      width = Math.round(width * scale)
      height = Math.round(height * scale)
    }

    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const ctx = canvas.getContext('2d')
    if (!ctx) {
      return stored.data
    }

    ctx.drawImage(image, 0, 0, width, height)
    const quality = file.size > 4 * 1024 * 1024 ? 0.7 : 0.85
    return canvas.toDataURL('image/jpeg', quality)
  } catch (error) {
    console.warn('Screenshot compression failed, sending original image.', error)
    const fallback = await fileToStoredFile(file)
    return fallback.data
  }
}

const Standings: React.FC = () => {
  const initialTrackId = f1Tracks[0]?.id ?? ''
  const [selectedTrackId, setSelectedTrackId] = useState(initialTrackId)
  const [events, setEvents] = useState<StandingsEvent[]>([])
  const [selectedEventId, setSelectedEventId] = useState<string>('')
  const [eventForm, setEventForm] = useState<EventFormState>(defaultEventForm)
  const [sessionForms, setSessionForms] = useState<Record<SessionType, ResultFormState>>({
    qualifying: defaultResultForm('qualifying'),
    race: defaultResultForm('race')
  })
  const [sessionResults, setSessionResults] = useState<Record<SessionType, StandingsResult[]>>({
    qualifying: [],
    race: []
  })
  const [loadingEvents, setLoadingEvents] = useState(false)
  const [loadingResults, setLoadingResults] = useState(false)
  const [savingEvent, setSavingEvent] = useState(false)
  const [sessionSaving, setSessionSaving] = useState<SessionType | null>(null)
  const [rowDeleting, setRowDeleting] = useState<string | null>(null)
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  )
  const [formVisibility, setFormVisibility] = useState<Record<SessionType, boolean>>({
    qualifying: false,
    race: false
  })
  const [formModes, setFormModes] = useState<Record<SessionType, 'create' | 'edit'>>({
    qualifying: 'create',
    race: 'create'
  })
  const [editingEntries, setEditingEntries] = useState<Record<SessionType, StandingsResult | null>>({
    qualifying: null,
    race: null
  })
  const [ocrProcessing, setOcrProcessing] = useState<Record<SessionType, boolean>>({
    qualifying: false,
    race: false
  })
  const [ocrSuggestions, setOcrSuggestions] = useState<Record<SessionType, OCRSuggestion[]>>({
    qualifying: [],
    race: []
  })
  const [ocrWarnings, setOcrWarnings] = useState<Record<SessionType, string[]>>({
    qualifying: [],
    race: []
  })
  const [bulkSaving, setBulkSaving] = useState<Record<SessionType, boolean>>({
    qualifying: false,
    race: false
  })
  const screenshotInputs = {
    qualifying: useRef<HTMLInputElement>(null),
    race: useRef<HTMLInputElement>(null)
  }

  const trackOptions = useMemo(
    () => f1Tracks.map((track) => ({ value: track.id, label: track.name })),
    []
  )

  const resetSessionForms = useCallback(() => {
    setSessionForms({
      qualifying: defaultResultForm('qualifying'),
      race: defaultResultForm('race')
    })
  }, [])

  const showFeedback = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message })
    setTimeout(() => setFeedback(null), 5000)
  }

  const openScreenshotPicker = (sessionType: SessionType) => {
    screenshotInputs[sessionType].current?.click()
  }

  const handleScreenshotInputChange = (sessionType: SessionType, fileList: FileList | null) => {
    const file = fileList?.[0]
    if (!file) {
      return
    }
    void handleScreenshotProcess(sessionType, file)
    if (screenshotInputs[sessionType].current) {
      screenshotInputs[sessionType].current!.value = ''
    }
  }

  const handleScreenshotProcess = async (sessionType: SessionType, file: File) => {
    if (!isSupabaseConfigured || !selectedEventId) {
      showFeedback('error', 'Válassz eseményt a feldolgozáshoz.')
      return
    }

    setOcrProcessing((prev) => ({ ...prev, [sessionType]: true }))
    try {
      const optimizedImage = await convertScreenshotForUpload(file)
      const response = await fetch('/api/standings/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          image: optimizedImage,
          sessionType
        })
      })

      let result: any = null
      try {
        result = await response.json()
      } catch (parseError) {
        const fallbackText = await response.text().catch(() => undefined)
        const message =
          fallbackText && fallbackText.length < 400
            ? fallbackText
            : 'Érvénytelen szerver válasz érkezett.'
        throw new Error(message)
      }
      if (!response.ok || !result.success) {
        throw new Error(result.message ?? 'Nem sikerült feldolgozni a képet.')
      }

      const suggestions: OCRSuggestion[] = Array.isArray(result.entries) ? result.entries : []
      if (!suggestions.length) {
        showFeedback('error', 'Nem találtunk feldolgozható sort a képen.')
        setOcrSuggestions((prev) => ({ ...prev, [sessionType]: [] }))
        return
      }

      setOcrSuggestions((prev) => ({ ...prev, [sessionType]: suggestions }))
      setOcrWarnings((prev) => ({ ...prev, [sessionType]: result.warnings ?? [] }))
      setFormVisibility((prev) => ({ ...prev, [sessionType]: true }))
      setFormModes((prev) => ({ ...prev, [sessionType]: 'create' }))
      setEditingEntries((prev) => ({ ...prev, [sessionType]: null }))
      showFeedback('success', `${suggestions.length} sor felismerve. Válaszd ki, melyiket szeretnéd betölteni.`)
    } catch (error: any) {
      console.error('Screenshot feldolgozás hiba:', error)
      showFeedback('error', error?.message ?? 'Nem sikerült feldolgozni a képet.')
    } finally {
      setOcrProcessing((prev) => ({ ...prev, [sessionType]: false }))
    }
  }

  const startEditingEntry = (sessionType: SessionType, entry: StandingsResult) => {
    setEditingEntries((prev) => ({ ...prev, [sessionType]: entry }))
    setSessionForms((prev) => ({
      ...prev,
      [sessionType]: mapResultToFormState(entry, sessionType)
    }))
    setFormModes((prev) => ({ ...prev, [sessionType]: 'edit' }))
    setFormVisibility((prev) => ({ ...prev, [sessionType]: true }))
  }

  const cancelEditingEntry = (sessionType: SessionType) => {
    setEditingEntries((prev) => ({ ...prev, [sessionType]: null }))
    setFormModes((prev) => ({ ...prev, [sessionType]: 'create' }))
    setSessionForms((prev) => ({
      ...prev,
      [sessionType]: defaultResultForm(sessionType)
    }))
  }

  const handleSessionFormSubmit = (sessionType: SessionType, event: React.FormEvent) => {
    if (formModes[sessionType] === 'edit') {
      void handleUpdateResult(sessionType, event)
    } else {
      void handleSubmitResult(sessionType, event)
    }
  }

  const fetchEvents = useCallback(
    async (trackId: string) => {
      if (!isSupabaseConfigured) {
        setEvents([])
        return
      }

      setLoadingEvents(true)
      const { data, error } = await supabase
        .from('standings_events')
        .select('*')
        .eq('track_id', trackId)
        .order('created_at', { ascending: false })

      if (error) {
        console.error('Standings events fetch failed:', error.message)
        showFeedback('error', 'Nem sikerült betölteni az eseményeket.')
        setEvents([])
      } else {
        const mapped: StandingsEvent[] =
          data?.map((row) => ({
            id: row.id,
            trackId: row.track_id,
            league: row.league,
            round: row.round,
            season: row.season,
            telemetryFile: row.telemetry_file ?? undefined,
            notes: row.notes,
            createdAt: row.created_at,
            updatedAt: row.updated_at
          })) ?? []
        setEvents(mapped)
      }

      setLoadingEvents(false)
    },
    []
  )

  const fetchResults = useCallback(
    async (eventId: string) => {
      if (!isSupabaseConfigured || !eventId) {
        setSessionResults({ qualifying: [], race: [] })
        return
      }

      setLoadingResults(true)
      const { data, error } = await supabase
        .from('standings_entries')
        .select('*')
        .eq('event_id', eventId)
        .order('position', { ascending: true })

      if (error) {
        console.error('Standings results fetch failed:', error.message)
        showFeedback('error', 'Nem sikerült betölteni az eredményeket.')
        setSessionResults({ qualifying: [], race: [] })
        setLoadingResults(false)
        return
      }

      const qualifying: StandingsResult[] = []
      const race: StandingsResult[] = []

      data?.forEach((row) => {
        const entry: StandingsResult = {
          id: row.id,
          eventId: row.event_id,
          sessionType: row.session_type,
          position: row.position,
          driver: row.driver,
          team: row.team,
          tyre: row.tyre ?? undefined,
          tyreCompound: row.tyre_compound ?? null,
          lapTime: row.lap_time ?? null,
          gap: row.gap ?? null,
          startingPosition: row.starting_position ?? null,
          pitStopCount: row.pit_stop_count ?? null,
          pitStops: row.pit_stops ?? [],
          bestLap: row.best_lap ?? null,
          finishTime: row.finish_time ?? null,
          points: row.points ?? null,
          notes: row.notes ?? null,
          createdAt: row.created_at
        }

        if (row.session_type === 'qualifying') {
          qualifying.push(entry)
        } else {
          race.push(entry)
        }
      })

      setSessionResults({ qualifying, race })
      setLoadingResults(false)
    },
    []
  )

  useEffect(() => {
    if (selectedTrackId) {
      setSelectedEventId('')
      setSessionResults({ qualifying: [], race: [] })
      resetSessionForms()
      setFormVisibility({ qualifying: false, race: false })
      setFormModes({ qualifying: 'create', race: 'create' })
      setEditingEntries({ qualifying: null, race: null })
      setOcrSuggestions({ qualifying: [], race: [] })
      setOcrWarnings({ qualifying: [], race: [] })
      setBulkSaving({ qualifying: false, race: false })
      fetchEvents(selectedTrackId)
    }
  }, [selectedTrackId, fetchEvents, resetSessionForms])

  useEffect(() => {
    if (selectedEventId) {
      fetchResults(selectedEventId)
    } else {
      setSessionResults({ qualifying: [], race: [] })
      resetSessionForms()
      setFormVisibility({ qualifying: false, race: false })
      setFormModes({ qualifying: 'create', race: 'create' })
      setEditingEntries({ qualifying: null, race: null })
      setOcrSuggestions({ qualifying: [], race: [] })
      setOcrWarnings({ qualifying: [], race: [] })
      setBulkSaving({ qualifying: false, race: false })
    }
  }, [selectedEventId, fetchResults, resetSessionForms])

  const handleCreateEvent = async (event: React.FormEvent) => {
    event.preventDefault()
    if (!isSupabaseConfigured || !selectedTrackId || !eventForm.league.trim()) {
      return
    }

    setSavingEvent(true)
    try {
      const telemetryFile = eventForm.telemetryFile
        ? await fileToStoredFile(eventForm.telemetryFile)
        : undefined

      const payload = {
        track_id: selectedTrackId,
        league: eventForm.league.trim(),
        round: eventForm.round.trim() || null,
        season: eventForm.season.trim() || null,
        telemetry_file: telemetryFile ?? null,
        notes: eventForm.notes.trim() || null
      }

      const { data, error } = await supabase
        .from('standings_events')
        .insert(payload)
        .select()
        .single()

      if (error) {
        throw error
      }

      const newEvent: StandingsEvent = {
        id: data.id,
        trackId: data.track_id,
        league: data.league,
        round: data.round,
        season: data.season,
        telemetryFile: data.telemetry_file ?? undefined,
        notes: data.notes,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      }

      setEvents((prev) => [newEvent, ...prev])
      setEventForm(defaultEventForm)
      setSelectedEventId(newEvent.id)
      showFeedback('success', 'Esemény sikeresen létrehozva.')
    } catch (error) {
      console.error(error)
      showFeedback('error', 'Nem sikerült létrehozni az eseményt.')
    } finally {
      setSavingEvent(false)
    }
  }

  const normalizePitStops = (stops: PitStopFormState[]): PitStopEntry[] => {
    return stops
      .map((stop) => ({
        lap: stop.lap ? Number(stop.lap) : null,
        fromTyre: stop.fromTyre && isTyreValue(stop.fromTyre) ? stop.fromTyre : undefined,
        toTyre: stop.toTyre && isTyreValue(stop.toTyre) ? stop.toTyre : undefined,
        fromCompound: stop.fromCompound?.toUpperCase() || null,
        toCompound: stop.toCompound?.toUpperCase() || null
      }))
      .filter(
        (stop) =>
          stop.lap !== null ||
          (stop.fromTyre && stop.toTyre) ||
          stop.fromCompound ||
          stop.toCompound
      )
  }

  const handleSubmitResult = async (sessionType: SessionType, event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedEventId || !isSupabaseConfigured) {
      return
    }

    const form = sessionForms[sessionType]
    if (!form.position || !form.driver.trim()) {
      showFeedback('error', 'Pozíció és pilóta megadása kötelező.')
      return
    }

    setSessionSaving(sessionType)

    try {
      const pitStops = sessionType === 'race' ? normalizePitStops(form.pitStops) : []
      const pitStopCount =
        sessionType === 'race'
          ? Number(form.pitStopCount || (pitStops.length ? pitStops.length : ''))
          : null

      const payload = {
        event_id: selectedEventId,
        session_type: sessionType,
        position: Number(form.position),
        driver: form.driver.trim(),
        team: form.team,
        tyre: form.tyre || null,
        tyre_compound: form.tyreCompound.trim().toUpperCase() || null,
        lap_time: form.lapTime.trim() || null,
        gap: form.gap.trim() || null,
        starting_position:
          sessionType === 'race' ? Number(form.startingPosition || null) || null : null,
        pit_stop_count: pitStopCount,
        pit_stops: sessionType === 'race' ? pitStops : null,
        best_lap: sessionType === 'race' ? form.bestLap.trim() || null : null,
        finish_time: sessionType === 'race' ? form.finishTime.trim() || null : null,
        points: sessionType === 'race' ? Number(form.points || null) || null : null,
        notes: form.notes.trim() || null
      }

      const { data, error } = await supabase
        .from('standings_entries')
        .insert(payload)
        .select()
        .single()

      if (error) {
        throw error
      }

      const newEntry: StandingsResult = {
        id: data.id,
        eventId: data.event_id,
        sessionType: data.session_type,
        position: data.position,
        driver: data.driver,
        team: data.team,
        tyre: data.tyre ?? undefined,
        tyreCompound: data.tyre_compound ?? null,
        lapTime: data.lap_time ?? null,
        gap: data.gap ?? null,
        startingPosition: data.starting_position ?? null,
        pitStopCount: data.pit_stop_count ?? null,
        pitStops: data.pit_stops ?? [],
        bestLap: data.best_lap ?? null,
        finishTime: data.finish_time ?? null,
        points: data.points ?? null,
        notes: data.notes ?? null,
        createdAt: data.created_at
      }

      setSessionResults((prev) => ({
        ...prev,
        [sessionType]: [...prev[sessionType], newEntry].sort((a, b) => a.position - b.position)
      }))
      setSessionForms((prev) => ({
        ...prev,
        [sessionType]: defaultResultForm(sessionType)
      }))
      showFeedback('success', 'Sor sikeresen hozzáadva.')
    } catch (error) {
      console.error(error)
      showFeedback('error', 'Nem sikerült menteni az eredményt.')
    } finally {
      setSessionSaving(null)
    }
  }

  const applySuggestionToForm = (sessionType: SessionType, suggestion: OCRSuggestion) => {
    setSessionForms((prev) => ({
      ...prev,
      [sessionType]: suggestionToFormState(suggestion, sessionType)
    }))
    setFormVisibility((prev) => ({ ...prev, [sessionType]: true }))
    setFormModes((prev) => ({ ...prev, [sessionType]: 'create' }))
    setEditingEntries((prev) => ({ ...prev, [sessionType]: null }))
    showFeedback('success', 'Sor betöltve az űrlapba. Ellenőrizd és mentsd el.')
  }

  const handleBulkImport = async (sessionType: SessionType) => {
    if (!isSupabaseConfigured || !selectedEventId) {
      showFeedback('error', 'Válassz eseményt, mielőtt importálsz.')
      return
    }

    const suggestions = ocrSuggestions[sessionType]
    if (!suggestions.length) {
      showFeedback('error', 'Nincs betölthető sor.')
      return
    }

    setBulkSaving((prev) => ({ ...prev, [sessionType]: true }))
    try {
      const payloads = suggestions.map((suggestion) =>
        suggestionToPayload(suggestion, sessionType, selectedEventId)
      )

      const { data, error } = await supabase.from('standings_entries').insert(payloads).select()

      if (error) {
        throw error
      }

      const newEntries: StandingsResult[] =
        data?.map((row) => ({
          id: row.id,
          eventId: row.event_id,
          sessionType: row.session_type,
          position: row.position,
          driver: row.driver,
          team: row.team,
          tyre: row.tyre ?? undefined,
          tyreCompound: row.tyre_compound ?? null,
          lapTime: row.lap_time ?? null,
          gap: row.gap ?? null,
          startingPosition: row.starting_position ?? null,
          pitStopCount: row.pit_stop_count ?? null,
          pitStops: row.pit_stops ?? [],
          bestLap: row.best_lap ?? null,
          finishTime: row.finish_time ?? null,
          points: row.points ?? null,
          notes: row.notes ?? null,
          createdAt: row.created_at
        })) ?? []

      setSessionResults((prev) => ({
        ...prev,
        [sessionType]: [...prev[sessionType], ...newEntries].sort((a, b) => a.position - b.position)
      }))

      setOcrSuggestions((prev) => ({ ...prev, [sessionType]: [] }))
      setOcrWarnings((prev) => ({ ...prev, [sessionType]: [] }))
      showFeedback('success', `${newEntries.length} sor automatikusan mentve.`)
    } catch (error) {
      console.error('Bulk import hiba:', error)
      showFeedback('error', 'Nem sikerült automatikusan menteni a sorokat.')
    } finally {
      setBulkSaving((prev) => ({ ...prev, [sessionType]: false }))
    }
  }

  const handleUpdateResult = async (sessionType: SessionType, event: React.FormEvent) => {
    event.preventDefault()
    if (!selectedEventId || !isSupabaseConfigured) {
      return
    }

    const editingEntry = editingEntries[sessionType]
    if (!editingEntry) return

    const form = sessionForms[sessionType]
    if (!form.position || !form.driver.trim()) {
      showFeedback('error', 'Pozíció és pilóta megadása kötelező.')
      return
    }

    setSessionSaving(sessionType)

    try {
      const pitStops = sessionType === 'race' ? normalizePitStops(form.pitStops) : []
      const pitStopCount =
        sessionType === 'race'
          ? Number(form.pitStopCount || (pitStops.length ? pitStops.length : ''))
          : null

      const payload = {
        session_type: sessionType,
        position: Number(form.position),
        driver: form.driver.trim(),
        team: form.team,
        tyre: form.tyre || null,
        tyre_compound: form.tyreCompound.trim().toUpperCase() || null,
        lap_time: form.lapTime.trim() || null,
        gap: form.gap.trim() || null,
        starting_position:
          sessionType === 'race' ? Number(form.startingPosition || null) || null : null,
        pit_stop_count: pitStopCount,
        pit_stops: sessionType === 'race' ? pitStops : null,
        best_lap: sessionType === 'race' ? form.bestLap.trim() || null : null,
        finish_time: sessionType === 'race' ? form.finishTime.trim() || null : null,
        points: sessionType === 'race' ? Number(form.points || null) || null : null,
        notes: form.notes.trim() || null
      }

      const { data, error } = await supabase
        .from('standings_entries')
        .update(payload)
        .eq('id', editingEntry.id)
        .select()
        .single()

      if (error) {
        throw error
      }

      const updatedEntry: StandingsResult = {
        id: data.id,
        eventId: data.event_id,
        sessionType: data.session_type,
        position: data.position,
        driver: data.driver,
        team: data.team,
        tyre: data.tyre ?? undefined,
        tyreCompound: data.tyre_compound ?? null,
        lapTime: data.lap_time ?? null,
        gap: data.gap ?? null,
        startingPosition: data.starting_position ?? null,
        pitStopCount: data.pit_stop_count ?? null,
        pitStops: data.pit_stops ?? [],
        bestLap: data.best_lap ?? null,
        finishTime: data.finish_time ?? null,
        points: data.points ?? null,
        notes: data.notes ?? null,
        createdAt: data.created_at
      }

      setSessionResults((prev) => ({
        ...prev,
        [sessionType]: prev[sessionType]
          .map((item) => (item.id === updatedEntry.id ? updatedEntry : item))
          .sort((a, b) => a.position - b.position)
      }))

      showFeedback('success', 'Sor frissítve.')
      cancelEditingEntry(sessionType)
    } catch (error) {
      console.error(error)
      showFeedback('error', 'Nem sikerült frissíteni az eredményt.')
    } finally {
      setSessionSaving(null)
    }
  }

  const handleDeleteResult = async (entry: StandingsResult) => {
    if (!isSupabaseConfigured) return

    setRowDeleting(entry.id)
    try {
      const { error } = await supabase.from('standings_entries').delete().eq('id', entry.id)
      if (error) {
        throw error
      }

      setSessionResults((prev) => ({
        ...prev,
        [entry.sessionType]: prev[entry.sessionType].filter((item) => item.id !== entry.id)
      }))
      if (editingEntries[entry.sessionType]?.id === entry.id) {
        cancelEditingEntry(entry.sessionType)
      }
      showFeedback('success', 'Sor törölve.')
    } catch (error) {
      console.error(error)
      showFeedback('error', 'Nem sikerült törölni a sort.')
    } finally {
      setRowDeleting(null)
    }
  }

  const updateSessionForm = (
    sessionType: SessionType,
    updater: (prev: ResultFormState) => ResultFormState
  ) => {
    setSessionForms((prev) => ({
      ...prev,
      [sessionType]: updater(prev[sessionType])
    }))
  }

  const renderPitStopEditors = (sessionType: SessionType) => {
    if (sessionType !== 'race') return null
    const form = sessionForms[sessionType]

    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold text-white">Kiállások</h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              updateSessionForm(sessionType, (prev) => ({
                ...prev,
                pitStops: [...prev.pitStops, defaultPitStop()]
              }))
            }
          >
            Új kiállás
          </Button>
        </div>

        {form.pitStops.length === 0 && (
          <p className="text-sm text-f1-text-secondary">
            Adj hozzá legalább egy kiállást a részletekhez.
          </p>
        )}

        <div className="space-y-4">
          {form.pitStops.map((stop, index) => (
            <div
              key={`pit-${index}`}
              className="grid grid-cols-1 md:grid-cols-5 gap-4 border border-f1-light-gray/30 rounded-lg p-4 bg-f1-dark/40"
            >
              <Input
                label="Kör"
                type="number"
                value={stop.lap}
                onChange={(value) =>
                  updateSessionForm(sessionType, (prev) => {
                    const next = [...prev.pitStops]
                    next[index] = { ...next[index], lap: value }
                    return { ...prev, pitStops: next }
                  })
                }
                placeholder="12"
              />
              <Select
                label="Gumi (ki)"
                options={[{ value: '', label: 'N/A' }, ...tyreOptions]}
                value={stop.fromTyre}
                onChange={(value) =>
                  updateSessionForm(sessionType, (prev) => {
                    const next = [...prev.pitStops]
                    next[index] = { ...next[index], fromTyre: value }
                    return { ...prev, pitStops: next }
                  })
                }
              />
              <Select
                label="Gumi (be)"
                options={[{ value: '', label: 'N/A' }, ...tyreOptions]}
                value={stop.toTyre}
                onChange={(value) =>
                  updateSessionForm(sessionType, (prev) => {
                    const next = [...prev.pitStops]
                    next[index] = { ...next[index], toTyre: value }
                    return { ...prev, pitStops: next }
                  })
                }
              />
              <Select
                label="Compound (ki)"
                options={[{ value: '', label: 'Nincs' }, ...compoundOptions]}
                value={stop.fromCompound}
                onChange={(value) =>
                  updateSessionForm(sessionType, (prev) => {
                    const next = [...prev.pitStops]
                    next[index] = { ...next[index], fromCompound: value }
                    return { ...prev, pitStops: next }
                  })
                }
              />
              <div className="flex items-end space-x-2">
                <div className="flex-1">
                  <Select
                    label="Compound (be)"
                    options={[{ value: '', label: 'Nincs' }, ...compoundOptions]}
                    value={stop.toCompound}
                    onChange={(value) =>
                      updateSessionForm(sessionType, (prev) => {
                        const next = [...prev.pitStops]
                        next[index] = { ...next[index], toCompound: value }
                        return { ...prev, pitStops: next }
                      })
                    }
                  />
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() =>
                    updateSessionForm(sessionType, (prev) => ({
                      ...prev,
                      pitStops: prev.pitStops.filter((_, i) => i !== index)
                    }))
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  const getPositionBadgeClass = (position: number) => {
    if (position === 1) return 'bg-gradient-to-r from-f1-gold via-yellow-400 to-f1-gold-light text-f1-dark'
    if (position === 2) return 'bg-gradient-to-r from-gray-300 via-gray-100 to-white text-f1-dark'
    if (position === 3) return 'bg-gradient-to-r from-amber-700 via-amber-500 to-amber-400 text-white'
    return 'bg-f1-dark/80 text-f1-text border border-f1-light-gray/30'
  }

  const getSessionAccent = (sessionType: SessionType) =>
    sessionType === 'qualifying'
      ? 'from-f1-blue via-f1-blue/70 to-f1-dark'
      : 'from-f1-red via-f1-red/70 to-f1-dark'

  const renderResultsTable = (sessionType: SessionType) => {
    const entries = sessionResults[sessionType]
    if (!entries.length) {
      return (
        <p className="text-f1-text-secondary text-sm">
          Még nincsenek mentett eredmények ehhez a szekcióhoz.
        </p>
      )
    }

    return (
      <div className="overflow-hidden rounded-2xl border border-f1-light-gray/30 bg-f1-dark/70 backdrop-blur">
        <div
          className={`h-2 w-full bg-gradient-to-r ${getSessionAccent(
            sessionType
          )} animate-pulse`}
        />
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-left">
            <thead className="bg-f1-dark/60">
              <tr className="text-[0.7rem] tracking-[0.3em] text-f1-text-secondary uppercase">
                <th className="px-4 py-3 font-semibold text-white/80">Pozíció</th>
                <th className="px-4 py-3 font-semibold text-white/80">Pilóta</th>
                <th className="px-4 py-3 font-semibold text-white/80">Csapat</th>
                <th className="px-4 py-3 font-semibold text-white/80">Gumi</th>
                {sessionType === 'qualifying' ? (
                  <>
                    <th className="px-4 py-3 font-semibold text-white/80">Köridő</th>
                    <th className="px-4 py-3 font-semibold text-white/80">Különbség</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3 font-semibold text-white/80">Rajthely</th>
                    <th className="px-4 py-3 font-semibold text-white/80">Kiállások</th>
                    <th className="px-4 py-3 font-semibold text-white/80">Legjobb kör</th>
                    <th className="px-4 py-3 font-semibold text-white/80">Idő</th>
                    <th className="px-4 py-3 font-semibold text-white/80">Pont</th>
                    <th className="px-4 py-3 font-semibold text-white/80">Kiállás részletek</th>
                  </>
                )}
                <th className="px-4 py-3 text-right font-semibold text-white/80">Műveletek</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((entry, index) => {
                const isRowEditing = editingEntries[sessionType]?.id === entry.id
                const baseRowColor = index % 2 === 0 ? 'bg-black/15' : 'bg-white/5'
                const rowHighlight = isRowEditing ? 'ring-1 ring-f1-gold/60 bg-f1-dark/70' : ''
                return (
                  <tr
                    key={entry.id}
                    className={`${baseRowColor} ${rowHighlight} border-t border-white/5 hover:bg-white/10 transition`}
                  >
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center justify-center min-w-[2.5rem] px-2 py-1 rounded-full text-xs font-bold shadow-md ${getPositionBadgeClass(
                        entry.position
                      )}`}
                    >
                      {entry.position}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-white font-semibold tracking-wide">{entry.driver}</td>
                  <td className="px-4 py-3 text-f1-text">{entry.team}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col">
                      <span className="text-white">
                        {entry.tyre ? tyreOptions.find((t) => t.value === entry.tyre)?.label : '—'}
                      </span>
                      {entry.tyreCompound && (
                        <span className="text-xs text-f1-text-secondary">{entry.tyreCompound}</span>
                      )}
                    </div>
                  </td>
                  {sessionType === 'qualifying' ? (
                    <>
                      <td className="px-4 py-3 font-mono text-lg text-f1-gold">{entry.lapTime || '—'}</td>
                      <td className="px-4 py-3 text-f1-text-secondary">{entry.gap || '—'}</td>
                    </>
                  ) : (
                    <>
                      <td className="px-4 py-3 text-white">{entry.startingPosition ?? '—'}</td>
                      <td className="px-4 py-3 text-white">{entry.pitStopCount ?? '—'}</td>
                      <td className="px-4 py-3 font-mono text-emerald-400">{entry.bestLap || '—'}</td>
                      <td className="px-4 py-3 font-mono text-white">{entry.finishTime || '—'}</td>
                      <td className="px-4 py-3 text-f1-gold font-semibold">{entry.points ?? '—'}</td>
                      <td className="px-4 py-3">
                        {entry.pitStops && entry.pitStops.length > 0 ? (
                          <ul className="space-y-1 text-xs font-mono text-f1-text-secondary">
                            {entry.pitStops.map((stop, index) => (
                              <li key={`${entry.id}-pit-${index}`}>
                                {stop.lap ? `${stop.lap}. kör ` : ''}
                                {stop.fromTyre ? stop.fromTyre.toUpperCase() : '—'}
                                {stop.fromCompound && ` (${stop.fromCompound})`} →{' '}
                                {stop.toTyre ? stop.toTyre.toUpperCase() : '—'}
                                {stop.toCompound && ` (${stop.toCompound})`}
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <span className="text-f1-text-secondary">—</span>
                        )}
                      </td>
                    </>
                  )}
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => startEditingEntry(sessionType, entry)}
                        >
                          {isRowEditing ? 'Szerkesztés alatt' : 'Szerkesztés'}
                        </Button>
                        <Button
                          variant="secondary"
                          size="sm"
                          disabled={rowDeleting === entry.id}
                          onClick={() => handleDeleteResult(entry)}
                        >
                          {rowDeleting === entry.id ? 'Törlés...' : 'Törlés'}
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  const renderSessionForm = (sessionType: SessionType) => {
    const form = sessionForms[sessionType]
    const disabled = !selectedEventId || !isSupabaseConfigured
    const isEditing = formModes[sessionType] === 'edit'
    const editingEntry = editingEntries[sessionType]
    const submitLabel = isEditing ? 'Sor frissítése' : 'Sor hozzáadása'
    const savingLabel = isEditing ? 'Frissítés...' : 'Mentés...'

    return (
      <form className="space-y-6" onSubmit={(e) => handleSessionFormSubmit(sessionType, e)}>
        {isEditing && editingEntry && (
          <div className="p-4 rounded-lg border border-f1-gold/40 bg-f1-dark/60 text-sm">
            <p className="text-f1-gold font-semibold">Sor szerkesztése</p>
            <p className="text-f1-text-secondary">
              {editingEntry.driver} • {editingEntry.team} • Pozíció: {editingEntry.position}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Pozíció"
            type="number"
            required
            value={form.position}
            onChange={(value) => updateSessionForm(sessionType, (prev) => ({ ...prev, position: value }))}
            disabled={disabled}
          />
          <Input
            label="Pilóta"
            value={form.driver}
            required
            onChange={(value) => updateSessionForm(sessionType, (prev) => ({ ...prev, driver: value }))}
            disabled={disabled}
          />
          <Select
            label="Csapat"
            value={form.team}
            options={teamOptions}
            onChange={(value) => updateSessionForm(sessionType, (prev) => ({ ...prev, team: value }))}
            disabled={disabled}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Select
            label="Gumi"
            value={form.tyre}
            options={[{ value: '', label: 'Nincs' }, ...tyreOptions]}
            onChange={(value) => updateSessionForm(sessionType, (prev) => ({ ...prev, tyre: value }))}
            disabled={disabled}
          />
          <Select
            label="Compound"
            value={form.tyreCompound}
            options={[{ value: '', label: 'Nincs' }, ...compoundOptions]}
            onChange={(value) =>
              updateSessionForm(sessionType, (prev) => ({ ...prev, tyreCompound: value }))
            }
            disabled={disabled}
          />
          <Input
            label={sessionType === 'qualifying' ? 'Köridő' : 'Befutási idő'}
            value={sessionType === 'qualifying' ? form.lapTime : form.finishTime}
            onChange={(value) =>
              updateSessionForm(sessionType, (prev) =>
                sessionType === 'qualifying' ? { ...prev, lapTime: value } : { ...prev, finishTime: value }
              )
            }
            disabled={disabled}
            placeholder={sessionType === 'qualifying' ? '1:11.603' : '43:55.822'}
          />
        </div>

        {sessionType === 'qualifying' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Különbség"
              value={form.gap}
              onChange={(value) => updateSessionForm(sessionType, (prev) => ({ ...prev, gap: value }))}
              disabled={disabled}
              placeholder="+0.007"
            />
            <Input
              label="Megjegyzés"
              value={form.notes}
              onChange={(value) => updateSessionForm(sessionType, (prev) => ({ ...prev, notes: value }))}
              disabled={disabled}
              placeholder="Opcionális"
            />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Input
                label="Rajthely"
                type="number"
                value={form.startingPosition}
                onChange={(value) =>
                  updateSessionForm(sessionType, (prev) => ({ ...prev, startingPosition: value }))
                }
                disabled={disabled}
              />
              <Input
                label="Legjobb kör"
                value={form.bestLap}
                onChange={(value) => updateSessionForm(sessionType, (prev) => ({ ...prev, bestLap: value }))}
                disabled={disabled}
                placeholder="1:15.831"
              />
              <Input
                label="Pontszám"
                type="number"
                value={form.points}
                onChange={(value) => updateSessionForm(sessionType, (prev) => ({ ...prev, points: value }))}
                disabled={disabled}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Kiállások száma"
                type="number"
                value={form.pitStopCount || String(form.pitStops.length || '')}
                onChange={(value) =>
                  updateSessionForm(sessionType, (prev) => ({ ...prev, pitStopCount: value }))
                }
                disabled={disabled}
              />
              <Input
                label="Megjegyzés"
                value={form.notes}
                onChange={(value) => updateSessionForm(sessionType, (prev) => ({ ...prev, notes: value }))}
                disabled={disabled}
                placeholder="Opcionális"
              />
            </div>

            {renderPitStopEditors(sessionType)}
          </>
        )}

        <div className="flex justify-end gap-3">
          {isEditing && (
            <Button
              type="button"
              variant="secondary"
              disabled={sessionSaving === sessionType}
              onClick={() => cancelEditingEntry(sessionType)}
            >
              Mégse
            </Button>
          )}
          <Button
            type="submit"
            disabled={disabled || sessionSaving === sessionType}
          >
            {sessionSaving === sessionType ? savingLabel : submitLabel}
          </Button>
        </div>
      </form>
    )
  }

  const toggleSessionForm = (sessionType: SessionType) => {
    setFormVisibility((prev) => ({
      ...prev,
      [sessionType]: !prev[sessionType]
    }))
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-f1-text-secondary uppercase tracking-wide">Standings</p>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-f1-gold" />
            Eredmények pályánként
          </h1>
          <p className="text-f1-text-secondary mt-2">
            Kezeld a ligás időmérő és verseny eredményeket, beleértve a boxkiállásokat és a telemetria fájlokat.
          </p>
        </div>
      </div>

      {!isSupabaseConfigured && (
        <Card className="border border-f1-red/60 bg-f1-red/10">
          <p className="text-sm text-f1-red font-semibold">
            A Supabase környezeti változók hiányoznak, ezért az eredmények nem menthetők. Állítsd be a
            VITE_SUPABASE_URL és VITE_SUPABASE_ANON_KEY értékeket.
          </p>
        </Card>
      )}

      {feedback && (
        <Card
          className={`border ${
            feedback.type === 'success' ? 'border-emerald-500/50 bg-emerald-500/10' : 'border-f1-red/50 bg-f1-red/10'
          }`}
        >
          <p className="text-sm">{feedback.message}</p>
        </Card>
      )}

      <Card>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Pálya"
              options={trackOptions}
              value={selectedTrackId}
              onChange={(value) => setSelectedTrackId(value)}
            />
            <form className="space-y-3" onSubmit={handleCreateEvent}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Input
                  label="Liga / esemény"
                  value={eventForm.league}
                  required
                  onChange={(value) => setEventForm((prev) => ({ ...prev, league: value }))}
                  disabled={!isSupabaseConfigured}
                  placeholder="Pl. PSGL"
                />
                <Input
                  label="Forduló"
                  value={eventForm.round}
                  onChange={(value) => setEventForm((prev) => ({ ...prev, round: value }))}
                  disabled={!isSupabaseConfigured}
                  placeholder="Pl. Futam 3"
                />
                <Input
                  label="Szezon"
                  value={eventForm.season}
                  onChange={(value) => setEventForm((prev) => ({ ...prev, season: value }))}
                  disabled={!isSupabaseConfigured}
                  placeholder="2025"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-f1-text mb-2">Telemetria (CSV - opcionális)</label>
                  <div className="flex items-center gap-3">
                    <label className="flex-1 border border-dashed border-f1-light-gray/60 rounded-lg px-4 py-3 cursor-pointer hover:border-f1-gold transition">
                      <div className="flex items-center gap-3 text-sm text-f1-text-secondary">
                        <Upload className="h-4 w-4" />
                        <span>{eventForm.telemetryFile ? eventForm.telemetryFile.name : 'Fájl kiválasztása'}</span>
                      </div>
                      <input
                        type="file"
                        accept=".csv"
                        className="hidden"
                        onChange={(e) =>
                          setEventForm((prev) => ({
                            ...prev,
                            telemetryFile: e.target.files?.[0] ?? null
                          }))
                        }
                        disabled={!isSupabaseConfigured}
                      />
                    </label>
                    {eventForm.telemetryFile && (
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setEventForm((prev) => ({
                            ...prev,
                            telemetryFile: null
                          }))
                        }
                      >
                        Törlés
                      </Button>
                    )}
                  </div>
                </div>
                <Input
                  label="Megjegyzés"
                  value={eventForm.notes}
                  onChange={(value) => setEventForm((prev) => ({ ...prev, notes: value }))}
                  disabled={!isSupabaseConfigured}
                  placeholder="Opcionális leírás"
                />
              </div>

              <div className="flex justify-end">
                <Button type="submit" disabled={!isSupabaseConfigured || savingEvent}>
                  {savingEvent ? 'Esemény mentése...' : 'Esemény létrehozása'}
                </Button>
              </div>
            </form>
          </div>

          <div className="border-t border-f1-light-gray/20 pt-6">
            <h3 className="text-xl font-semibold text-white flex items-center gap-2 mb-4">
              <Flag className="h-5 w-5 text-f1-gold" />
              Események ezen a pályán
            </h3>
            {loadingEvents ? (
              <div className="flex items-center justify-center py-8">
                <LoadingSpinner size="md" />
              </div>
            ) : events.length === 0 ? (
              <p className="text-sm text-f1-text-secondary">Még nincs mentett esemény ehhez a pályához.</p>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {events.map((event) => {
                  const isSelected = event.id === selectedEventId
                  return (
                    <Card
                      key={event.id}
                      className={`border ${
                        isSelected ? 'border-f1-gold bg-f1-dark/80' : 'border-f1-light-gray/30'
                      }`}
                      onClick={() => setSelectedEventId(event.id)}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-sm text-f1-text-secondary uppercase tracking-wide">
                            {event.league}
                          </p>
                          <h4 className="text-lg font-semibold text-white">
                            {event.round || 'Forduló megadása'}
                          </h4>
                          <p className="text-sm text-f1-text-secondary">
                            {event.season ? `${event.season} • ` : ''}
                            {new Date(event.createdAt).toLocaleString('hu-HU', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </p>
                          {event.notes && (
                            <p className="text-sm text-f1-text-secondary mt-2">{event.notes}</p>
                          )}
                        </div>
                        <Button variant={isSelected ? 'gold' : 'secondary'} size="sm">
                          {isSelected ? 'Kiválasztva' : 'Megnyitás'}
                        </Button>
                      </div>
                      {event.telemetryFile && (
                        <a
                          href={event.telemetryFile.data}
                          download={event.telemetryFile.name}
                          className="mt-4 inline-flex items-center gap-2 text-sm text-f1-gold hover:text-white transition"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <FileDown className="h-4 w-4" />
                          Telemetria letöltése ({event.telemetryFile.name})
                        </a>
                      )}
                    </Card>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </Card>

      {selectedEventId ? (
        <div className="space-y-6">
          {(['qualifying', 'race'] as SessionType[]).map((sessionType) => {
            const isFormVisible = formVisibility[sessionType]
            const isEditing = formModes[sessionType] === 'edit'
            const shouldShowForm = isFormVisible || isEditing

            return (
              <Card key={sessionType} className="space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-2xl font-semibold text-white flex items-center gap-2">
                      {sessionType === 'qualifying' ? 'Időmérő eredmény' : 'Verseny eredmény'}
                    </h3>
                    <p className="text-sm text-f1-text-secondary">
                      {sessionType === 'qualifying'
                        ? 'Pozíciók, köridők és gumiválasztások.'
                        : 'Teljes futameredmény boxkiállásokkal és pontokkal.'}
                    </p>
                  </div>
                  {selectedEventId && (
                    <div className="flex flex-wrap gap-2">
                      {isEditing ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => cancelEditingEntry(sessionType)}
                        >
                          Szerkesztés megszakítása
                        </Button>
                      ) : (
                        <Button variant="outline" size="sm" onClick={() => toggleSessionForm(sessionType)}>
                          {isFormVisible ? 'Űrlap elrejtése' : 'Új sor hozzáadása'}
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        size="sm"
                        disabled={ocrProcessing[sessionType]}
                        onClick={() => openScreenshotPicker(sessionType)}
                      >
                        {ocrProcessing[sessionType] ? 'Feldolgozás...' : 'Screenshot feldolgozása'}
                      </Button>
                      <input
                        ref={screenshotInputs[sessionType]}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(event) => handleScreenshotInputChange(sessionType, event.target.files)}
                      />
                    </div>
                  )}
                </div>

                {loadingResults ? (
                  <div className="flex items-center justify-center py-8">
                    <LoadingSpinner size="md" />
                  </div>
                ) : (
                  <>
                    {renderResultsTable(sessionType)}
                    {ocrSuggestions[sessionType].length > 0 && (
                      <div className="border border-f1-light-gray/30 rounded-xl p-4 bg-f1-dark/60 space-y-4">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div>
                            <h4 className="text-lg font-semibold text-white">Felismert sorok</h4>
                            {ocrWarnings[sessionType].length > 0 && (
                              <p className="text-xs text-amber-300">
                                {ocrWarnings[sessionType].join(' • ')}
                              </p>
                            )}
                            <p className="text-xs text-f1-text-secondary">
                              Kattints egy sorra a gyors kitöltéshez, majd ellenőrizd az űrlapban.
                            </p>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            <Button
                              variant="primary"
                              size="sm"
                              disabled={bulkSaving[sessionType]}
                              onClick={() => handleBulkImport(sessionType)}
                            >
                              {bulkSaving[sessionType]
                                ? 'Mentés folyamatban...'
                                : 'Összes sor mentése'}
                            </Button>
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() =>
                                setOcrSuggestions((prev) => ({ ...prev, [sessionType]: [] }))
                              }
                            >
                              Lista törlése
                            </Button>
                          </div>
                        </div>
                        <div className="overflow-x-auto">
                          <table className="min-w-full text-sm">
                            <thead className="text-xs uppercase text-f1-text-secondary border-b border-white/10">
                              <tr>
                                <th className="px-3 py-2">Poz.</th>
                                <th className="px-3 py-2">Pilóta</th>
                                <th className="px-3 py-2">Csapat</th>
                                {sessionType === 'qualifying' ? (
                                  <>
                                    <th className="px-3 py-2">Gumi</th>
                                    <th className="px-3 py-2">Köridő</th>
                                    <th className="px-3 py-2">Különbség</th>
                                  </>
                                ) : (
                                  <>
                                    <th className="px-3 py-2">Rajthely</th>
                                    <th className="px-3 py-2">Kiállások</th>
                                    <th className="px-3 py-2">Idő</th>
                                    <th className="px-3 py-2">Pont</th>
                                  </>
                                )}
                                <th className="px-3 py-2 text-right">Művelet</th>
                              </tr>
                            </thead>
                            <tbody>
                              {ocrSuggestions[sessionType].map((suggestion, index) => (
                                <tr
                                  key={`${sessionType}-suggestion-${index}`}
                                  className="border-b border-white/5 hover:bg-white/5 transition"
                                >
                                  <td className="px-3 py-2 text-white font-semibold">
                                    {suggestion.position ?? '—'}
                                  </td>
                                  <td className="px-3 py-2">{suggestion.driver ?? '—'}</td>
                                  <td className="px-3 py-2">{suggestion.team ?? '—'}</td>
                                  {sessionType === 'qualifying' ? (
                                    <>
                                      <td className="px-3 py-2">
                                        {suggestion.tyre ?? '—'}
                                        {suggestion.tyreCompound && (
                                          <span className="text-xs text-f1-text-secondary ml-1">
                                            ({suggestion.tyreCompound})
                                          </span>
                                        )}
                                      </td>
                                      <td className="px-3 py-2 font-mono">{suggestion.lapTime ?? '—'}</td>
                                      <td className="px-3 py-2">{suggestion.gap ?? '—'}</td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="px-3 py-2">{suggestion.startingPosition ?? '—'}</td>
                                      <td className="px-3 py-2">{suggestion.pitStopCount ?? '—'}</td>
                                      <td className="px-3 py-2 font-mono">{suggestion.finishTime ?? '—'}</td>
                                      <td className="px-3 py-2 text-f1-gold font-semibold">
                                        {suggestion.points ?? '—'}
                                      </td>
                                    </>
                                  )}
                                  <td className="px-3 py-2 text-right">
                                    <Button
                                      variant="outline"
                                      size="sm"
                                      onClick={() => applySuggestionToForm(sessionType, suggestion)}
                                    >
                                      Betöltés az űrlapba
                                    </Button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                    {shouldShowForm && (
                      <div className="border-t border-f1-light-gray/20 pt-6">
                        <h4 className="text-lg font-semibold text-white mb-4">
                          {isEditing ? 'Sor szerkesztése' : 'Új sor hozzáadása'}
                        </h4>
                        {renderSessionForm(sessionType)}
                      </div>
                    )}
                  </>
                )}
              </Card>
            )
          })}
        </div>
      ) : (
        <Card className="text-center py-12">
          <p className="text-f1-text-secondary">
            Válassz ki egy eseményt fent, hogy megjelenjen az időmérő és verseny szekció.
          </p>
        </Card>
      )}
    </div>
  )
}

export default Standings

