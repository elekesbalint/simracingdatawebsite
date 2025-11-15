export interface Track {
  id: string
  name: string
  country: string
  length: number
  laps: number
  lastVisited?: Date
  imageUrl?: string
  mapImageUrl?: string
}

export interface StoredFile {
  name: string
  size: number
  type: string
  data: string
}

export interface TireData {
  compound: 'soft' | 'medium' | 'hard' | 'intermediate' | 'wet'
  degradation: number | string | null
  compoundSet?: string
  compoundVariant?: string | null
  laps?: number
  temperature?: number
  pressure?: number
  notes?: string
}

export interface Strategy {
  id: string
  trackId: string
  undercut: string
  ideal: string
  overcut: string
  undercutStrength: string
  pitStop: string
  ers: string
  optimalSectors: string
  notes?: string
  createdAt: Date
}

export interface HotlapEntry {
  id: string
  trackId: string
  lapTime: string
  setupName?: string
  notes?: string
  attachment?: StoredFile
  linkedSetupIds?: string[]
  createdAt: string
  createdBy?: string
}

export interface SetupEntry {
  id: string
  trackId: string
  title?: string
  configuration: string
  notes?: string
  attachment?: StoredFile
  linkedHotlapIds?: string[]
  createdAt: string
  createdBy?: string
}

export interface TrackData {
  trackId: string
  tireData: TireData[]
  strategies: Strategy[]
  bestLap?: number
  averageLap?: number
  fuelDelta?: number | null
  drsZones?: number | null
  pitStopLoss?: number | null
  ersNotes?: string[]
  details?: string[]
  tireStintLaps?: number | null
  notes?: string
  lastUpdated: Date
  lastVisited?: Date | null
  hotlaps?: HotlapEntry[]
  setups?: SetupEntry[]
}

export type SessionType = 'qualifying' | 'race'

export interface PitStopEntry {
  lap?: number | null
  fromTyre?: TireData['compound']
  toTyre?: TireData['compound']
  fromCompound?: string | null
  toCompound?: string | null
}

export interface StandingsEvent {
  id: string
  trackId: string
  league: string
  round?: string | null
  season?: string | null
  telemetryFile?: StoredFile
  notes?: string | null
  createdAt: string
  updatedAt?: string
}

export interface StandingsResult {
  id: string
  eventId: string
  sessionType: SessionType
  position: number
  driver: string
  team: string
  tyre?: TireData['compound']
  tyreCompound?: string | null
  lapTime?: string | null
  gap?: string | null
  startingPosition?: number | null
  pitStopCount?: number | null
  pitStops?: PitStopEntry[]
  bestLap?: string | null
  finishTime?: string | null
  points?: number | null
  notes?: string | null
  createdAt: string
}

export type UserStatus = 'pending' | 'approved' | 'rejected'
export type UserRole = 'admin' | 'user'

export interface AuthUser {
  id: string
  name: string
  email: string
  password: string
  status: UserStatus
  role: UserRole
  createdAt: string
  twoFactorEnabled?: boolean
}
