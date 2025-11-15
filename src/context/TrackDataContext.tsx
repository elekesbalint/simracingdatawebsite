import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState
} from 'react'
import { TrackData, TireData, Strategy } from '../types'
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient'
import { f1Tracks } from '../data/tracks'
import { tireWearData } from '../data/tireWearData'
import { defaultTrackStrategies } from '../data/trackStrategies'
import { trackMetaData } from '../data/trackMeta'

interface TrackDataContextValue {
  trackData: TrackData[]
  loading: boolean
  refreshTrackData: () => Promise<void>
  updateTrack: (trackId: string, updater: (current: TrackData) => TrackData) => Promise<void>
}

const TrackDataContext = createContext<TrackDataContextValue | undefined>(undefined)

const COMPOUND_INDICES: Record<TireData['compound'], number> = {
  soft: 0,
  medium: 1,
  hard: 2,
  intermediate: 0,
  wet: 0
}

const splitCompoundSet = (value?: string | null): string[] => {
  if (!value) return []
  return value
    .split(/[-•|/]/)
    .map((token) => token.trim().toUpperCase())
    .filter(Boolean)
}

const normalizeTireEntry = (tire: TireData): TireData => {
  const tokens = splitCompoundSet(tire.compoundSet)
  const normalizedSet =
    tokens.length >= 3 ? tokens.slice(0, 3).join('-') : tokens.length > 0 ? tokens.join('-') : tire.compoundSet
  const rawVariant =
    typeof tire.compoundVariant === 'string'
      ? tire.compoundVariant.trim().toUpperCase()
      : tire.compoundVariant ?? undefined
  const variantFromSet = tokens[COMPOUND_INDICES[tire.compound] ?? 0]
  return {
    ...tire,
    compoundSet: (normalizedSet && normalizedSet.trim().toUpperCase()) || 'C3-C4-C5',
    compoundVariant: rawVariant && rawVariant.length ? rawVariant : variantFromSet ?? null
  }
}

const createDefaultTrackDataMap = () => {
  const map = new Map<string, TrackData>()
  const baseDate = new Date()

  f1Tracks.forEach((track) => {
    const meta = trackMetaData[track.id] || {}
    const normalizedTires: TireData[] = (tireWearData[track.id] || []).map((tire) => normalizeTireEntry(tire))

    const strategies: Strategy[] = (defaultTrackStrategies[track.id] || []).map((strategy) => ({
      ...strategy,
      createdAt: strategy.createdAt instanceof Date ? strategy.createdAt : new Date(strategy.createdAt || baseDate)
    }))

    map.set(track.id, {
      trackId: track.id,
      tireData: normalizedTires,
      strategies,
      bestLap: undefined,
      averageLap: undefined,
      fuelDelta: meta.fuelDelta ?? null,
      drsZones: meta.drsZones ?? null,
      pitStopLoss: meta.pitStopLoss ?? null,
      ersNotes: meta.ersNotes ?? [],
      details: meta.details ?? [],
      tireStintLaps: meta.tireStintLaps ?? null,
      notes: undefined,
      lastUpdated: baseDate,
      lastVisited: null,
      hotlaps: [],
      setups: []
    })
  })

  return map
}

const defaultTrackDataMap = createDefaultTrackDataMap()

const cloneStrategy = (strategy: Strategy): Strategy => ({
  ...strategy,
  createdAt: strategy.createdAt instanceof Date ? strategy.createdAt : new Date(strategy.createdAt)
})

const normalizeTrackData = (entry: Partial<TrackData> & { trackId: string; lastUpdated?: Date | string }): TrackData => {
  const base = defaultTrackDataMap.get(entry.trackId)
  const lastUpdated = entry.lastUpdated
    ? entry.lastUpdated instanceof Date
      ? entry.lastUpdated
      : new Date(entry.lastUpdated)
    : new Date()
  const lastVisited = entry.lastVisited
    ? entry.lastVisited instanceof Date
      ? entry.lastVisited
      : new Date(entry.lastVisited)
    : base?.lastVisited ?? null

  const tireData: TireData[] = (entry.tireData ?? base?.tireData ?? []).map((tire) => normalizeTireEntry(tire))

  const strategies: Strategy[] = (entry.strategies ?? base?.strategies ?? []).map((strategy) =>
    cloneStrategy(strategy)
  )

  return {
    ...(base ?? {
      trackId: entry.trackId,
      tireData: [],
      strategies: [],
      bestLap: undefined,
      averageLap: undefined,
      fuelDelta: null,
      drsZones: null,
      pitStopLoss: null,
      ersNotes: [],
      details: [],
      tireStintLaps: null,
      notes: undefined,
      lastUpdated: new Date(),
      hotlaps: [],
      setups: []
    }),
    ...entry,
    tireData,
    strategies,
    hotlaps: entry.hotlaps ?? base?.hotlaps ?? [],
    setups: entry.setups ?? base?.setups ?? [],
    lastUpdated,
    lastVisited
  }
}

const serializeTrackData = (entry: TrackData) => ({
  ...entry,
  lastUpdated: entry.lastUpdated instanceof Date ? entry.lastUpdated.toISOString() : entry.lastUpdated,
  lastVisited:
    entry.lastVisited instanceof Date
      ? entry.lastVisited.toISOString()
      : entry.lastVisited ?? null,
  strategies: entry.strategies.map((strategy) => ({
    ...strategy,
    createdAt: strategy.createdAt instanceof Date ? strategy.createdAt.toISOString() : strategy.createdAt
  }))
})

const deserializeTrackData = (row: any): TrackData => {
  const payload = row.payload ?? {}
  return normalizeTrackData({
    ...payload,
    trackId: row.track_id,
    lastUpdated: payload.lastUpdated ?? row.updated_at ?? new Date().toISOString()
  })
}

export const TrackDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [trackData, setTrackData] = useState<TrackData[]>([])
  const [loading, setLoading] = useState<boolean>(true)

  const fetchTrackData = useCallback(async () => {
    if (!isSupabaseConfigured) {
      const defaults = f1Tracks.map((track) => defaultTrackDataMap.get(track.id)!)
      setTrackData(defaults)
      setLoading(false)
      return
    }

    setLoading(true)

    const { data, error } = await supabase
      .from('track_data')
      .select('track_id, payload, updated_at')

    if (error) {
      console.error('Supabase track data fetch failed:', error.message)
      const defaults = f1Tracks.map((track) => defaultTrackDataMap.get(track.id)!)
      setTrackData(defaults)
      setLoading(false)
      return
    }

    const map = new Map<string, TrackData>()
    if (data) {
      data.forEach((row: any) => {
        const record = deserializeTrackData(row)
        map.set(record.trackId, record)
      })
    }

    const missingRecords: TrackData[] = []

    const combined = f1Tracks.map((track) => {
      const existing = map.get(track.id)
      if (existing) {
        return existing
      }
      const defaults = defaultTrackDataMap.get(track.id)!
      missingRecords.push(defaults)
      return defaults
    })

    if (missingRecords.length > 0 && isSupabaseConfigured) {
      const nowIso = new Date().toISOString()
      await supabase.from('track_data').upsert(
        missingRecords.map((record) => ({
          track_id: record.trackId,
          payload: serializeTrackData(record),
          updated_at: nowIso
        }))
      )
    }

    setTrackData(combined)
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchTrackData()
  }, [fetchTrackData])

  const updateTrack = useCallback<TrackDataContextValue['updateTrack']>(
    async (trackId, updater) => {
      let nextRecord: TrackData | null = null
      let previousRecord: TrackData | null = null
      let insertedNewRecord = false

      setTrackData((prev) => {
        const existingIndex = prev.findIndex((item) => item.trackId === trackId)
        const current = existingIndex !== -1 ? prev[existingIndex] : defaultTrackDataMap.get(trackId)!

        previousRecord = existingIndex !== -1 ? prev[existingIndex] : null

        const updatedDraft = updater({ ...current, lastUpdated: new Date() })
        nextRecord = normalizeTrackData({ ...updatedDraft, trackId, lastUpdated: new Date() })

        if (existingIndex !== -1) {
          return prev.map((item, index) => (index === existingIndex ? nextRecord! : item))
        }

        insertedNewRecord = true
        return [...prev, nextRecord!]
      })

      if (!nextRecord) {
        return
      }

      if (isSupabaseConfigured) {
        const { error } = await supabase
          .from('track_data')
          .upsert({
            track_id: trackId,
            payload: serializeTrackData(nextRecord),
            updated_at: new Date().toISOString()
          })

        if (error) {
          console.error('Supabase track data update failed:', error.message)

          setTrackData((prev) => {
            if (insertedNewRecord) {
              return prev.filter((item) => item.trackId !== trackId)
            }

            if (previousRecord) {
              return prev.map((item) => (item.trackId === trackId ? previousRecord! : item))
            }

            return prev
          })

          throw new Error('Nem sikerült menteni a pálya adatait. Próbáld újra később.')
        }
      }
    },
    []
  )

  const value = useMemo<TrackDataContextValue>(
    () => ({
      trackData,
      loading,
      refreshTrackData: fetchTrackData,
      updateTrack
    }),
    [trackData, loading, fetchTrackData, updateTrack]
  )

  return <TrackDataContext.Provider value={value}>{children}</TrackDataContext.Provider>
}

export const useTrackData = () => {
  const context = useContext(TrackDataContext)
  if (!context) {
    throw new Error('useTrackData must be used within a TrackDataProvider')
  }
  return context
}
