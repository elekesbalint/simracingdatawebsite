export interface F1Team {
  id: string
  name: string
}

export const f1Teams: F1Team[] = [
  { id: 'mercedes', name: 'Mercedes-AMG Petronas' },
  { id: 'red-bull', name: 'Oracle Red Bull Racing' },
  { id: 'ferrari', name: 'Scuderia Ferrari HP' },
  { id: 'mclaren', name: 'McLaren Formula 1 Team' },
  { id: 'aston-martin', name: 'Aston Martin Aramco' },
  { id: 'alpine', name: 'BWT Alpine F1 Team' },
  { id: 'williams', name: 'Williams Racing' },
  { id: 'rb', name: 'Visa Cash App RB' },
  { id: 'haas', name: 'MoneyGram Haas F1 Team' },
  { id: 'sauber', name: 'Stake F1 Team Kick Sauber' }
]

export const teamOptions = f1Teams.map((team) => ({
  value: team.name,
  label: team.name
}))

