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
  compoundSet?: 'C1-C2-C3' | 'C2-C3-C4' | 'C3-C4-C5'
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
}
