interface FuelEntry {
  trackId: string
  label: string
  delta: number | null
}

interface FuelGroup {
  title: string
  entries: FuelEntry[]
}

export const fuelGroups: FuelGroup[] = [
  {
    title: 'Circuits 1-8',
    entries: [
      { trackId: 'australia', label: 'Australia', delta: 0.3 },
      { trackId: 'china', label: 'China', delta: 0.1 },
      { trackId: 'japan', label: 'Japan', delta: 0.1 },
      { trackId: 'bahrain', label: 'Bahrain', delta: 0.6 },
      { trackId: 'saudi-arabia', label: 'Saudi Arabia', delta: 0.5 },
      { trackId: 'miami', label: 'Miami', delta: 0.1 },
      { trackId: 'emilia-romagna', label: 'Imola', delta: 0.4 },
      { trackId: 'monaco', label: 'Monaco', delta: 1.2 }
    ]
  },
  {
    title: 'Circuits 9-16',
    entries: [
      { trackId: 'spain', label: 'Spain', delta: 0.6 },
      { trackId: 'canada', label: 'Canada', delta: 0.1 },
      { trackId: 'austria', label: 'Austria', delta: 0.1 },
      { trackId: 'great-britain', label: 'Great Britain', delta: 0.1 },
      { trackId: 'belgium', label: 'Belgium', delta: -0.2 },
      { trackId: 'hungary', label: 'Hungary', delta: 1.2 },
      { trackId: 'netherlands', label: 'Netherlands', delta: 1.1 },
      { trackId: 'italy', label: 'Monza', delta: 0.81 }
    ]
  },
  {
    title: 'Circuits 17-24',
    entries: [
      { trackId: 'azerbaijan', label: 'Azerbaijan', delta: 1.0 },
      { trackId: 'singapore', label: 'Singapore', delta: null },
      { trackId: 'usa', label: 'United States', delta: null },
      { trackId: 'mexico', label: 'Mexico', delta: -1.0 },
      { trackId: 'brazil', label: 'Brazil', delta: -0.2 },
      { trackId: 'las-vegas', label: 'Las Vegas', delta: null },
      { trackId: 'qatar', label: 'Qatar', delta: -0.2 },
      { trackId: 'abu-dhabi', label: 'Abu Dhabi', delta: 0.2 }
    ]
  }
]

