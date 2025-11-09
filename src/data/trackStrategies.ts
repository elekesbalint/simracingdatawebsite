import { Strategy } from '../types'

const defaultCreatedAt = new Date('2025-01-01T00:00:00Z')

const makeStrategy = (
  trackId: string,
  props: Omit<Strategy, 'id' | 'trackId' | 'createdAt'>
): Strategy => ({
  id: `${trackId}-default`,
  trackId,
  createdAt: defaultCreatedAt,
  ...props
})

export const defaultTrackStrategies: Record<string, Strategy[]> = {
  'australia': [
    makeStrategy('australia', {
      undercut: 'M-H lap 9-10',
      ideal: 'M-H lap 11',
      overcut: 'H-M lap 18',
      undercutStrength: '0.5-1 sec',
      pitStop: '18 sec',
      ers: 'Nincs adat',
      optimalSectors: '0.7 / 0.7 / 0.6',
      notes: 'Megjegyzés: M-H a legjobb stratégia.'
    })
  ],
  'china': [
    makeStrategy('china', {
      undercut: 'M-H lap 10',
      ideal: 'M-H lap 11-12',
      overcut: 'H-M lap 17',
      undercutStrength: '1.5 sec',
      pitStop: '22 sec',
      ers: 'Nincs adat',
      optimalSectors: 'Nincs adat',
      notes: ''
    })
  ],
  'japan': [
    makeStrategy('japan', {
      undercut: 'M-H lap 9',
      ideal: 'M-H lap 10-11',
      overcut: 'H-M lap 16',
      undercutStrength: '1 sec',
      pitStop: '22 sec',
      ers: 'Lásd részletes ERS jegyzet',
      optimalSectors: '0.0 / 0.5 / 0.9',
      notes: ''
    })
  ],
  'bahrain': [
    makeStrategy('bahrain', {
      undercut: 'M-H lap 11',
      ideal: 'M-H lap 12-13',
      overcut: 'H-M lap 18',
      undercutStrength: '1.5 sec',
      pitStop: '23 sec',
      ers: 'Nincs adat',
      optimalSectors: 'Nincs adat',
      notes: ''
    })
  ],
  'saudi-arabia': [
    makeStrategy('saudi-arabia', {
      undercut: 'M-H lap 8',
      ideal: 'M-H lap 9-10',
      overcut: 'H-M lap 15',
      undercutStrength: '0.7-1 sec',
      pitStop: '18 sec',
      ers: 'Lásd részletes ERS jegyzet',
      optimalSectors: '0.5 / 0.8 / 0.4',
      notes: ''
    })
  ],
  'miami': [
    makeStrategy('miami', {
      undercut: 'M-H-H lap 6,17',
      ideal: 'M-H-H lap 7,18',
      overcut: 'Lap 8,19',
      undercutStrength: '1 sec',
      pitStop: '19 sec',
      ers: 'Nincs adat',
      optimalSectors: 'Nincs adat',
      notes: ''
    })
  ],
  'emilia-romagna': [
    makeStrategy('emilia-romagna', {
      undercut: 'M-H lap 9-10',
      ideal: 'M-H lap 11',
      overcut: 'H-M lap 18',
      undercutStrength: '0.5-1 sec',
      pitStop: '27 sec',
      ers: 'Nincs adat',
      optimalSectors: 'Nincs adat',
      notes: ''
    })
  ],
  'monaco': [
    makeStrategy('monaco', {
      undercut: 'M-H-H lap 1,20',
      ideal: 'M-H-H lap 6,24',
      overcut: 'M-H-M lap 11,26',
      undercutStrength: 'Nincs adat',
      pitStop: 'Nincs adat',
      ers: 'Nincs adat',
      optimalSectors: 'Nincs adat',
      notes: ''
    })
  ],
  'spain': [
    makeStrategy('spain', {
      undercut: 'M-H lap 14',
      ideal: 'M-H lap 15-16',
      overcut: 'H-M lap 20',
      undercutStrength: '1-1.5 sec',
      pitStop: '21 sec',
      ers: 'Nincs adat',
      optimalSectors: 'Nincs adat',
      notes: ''
    })
  ],
  'canada': [
    makeStrategy('canada', {
      undercut: 'M-H-H lap 7,20',
      ideal: 'M-H-H lap 9,22',
      overcut: 'M-H lap 13',
      undercutStrength: '1 sec',
      pitStop: '18 sec',
      ers: 'Nincs adat',
      optimalSectors: '0.0 / 0.4 / 0.5',
      notes: ''
    })
  ],
  'austria': [
    makeStrategy('austria', {
      undercut: 'M-H-H lap 9,22',
      ideal: 'M-H-H lap 10,23',
      overcut: 'M-H-H lap 11,24',
      undercutStrength: '1 sec',
      pitStop: '19 sec',
      ers: 'Nincs adat',
      optimalSectors: '0.6 / 0.0 / 0.9',
      notes: ''
    })
  ],
  'great-britain': [
    makeStrategy('great-britain', {
      undercut: 'M-H lap 9',
      ideal: 'M-H lap 10',
      overcut: 'M-H lap 11',
      undercutStrength: '1 sec',
      pitStop: '28 sec',
      ers: 'Nincs adat',
      optimalSectors: 'Nincs adat',
      notes: ''
    })
  ],
  'belgium': [
    makeStrategy('belgium', {
      undercut: 'M-H lap 8',
      ideal: 'M-H lap 9-10',
      overcut: 'H-M lap 15-16',
      undercutStrength: '0.5-1 sec',
      pitStop: '18 sec',
      ers: 'Lásd részletes ERS jegyzet',
      optimalSectors: '0.1 / 0.4 / 0.2',
      notes: ''
    })
  ],
  'hungary': [
    makeStrategy('hungary', {
      undercut: 'M-H lap 14',
      ideal: 'M-H lap 15',
      overcut: 'M-M-H lap 8,18',
      undercutStrength: 'Nincs adat',
      pitStop: 'Nincs adat',
      ers: 'Nincs adat',
      optimalSectors: 'Nincs adat',
      notes: ''
    })
  ],
  'netherlands': [
    makeStrategy('netherlands', {
      undercut: 'Lap 11 (M → H)',
      ideal: 'Lap 13 (M → H)',
      overcut: 'Lap 15 (M → H)',
      undercutStrength: '0.7 sec',
      pitStop: '22 seconds',
      ers: 'Banked kanyar kijáratánál burn',
      optimalSectors: 'S3',
      notes: ''
    })
  ],
  'italy': [
    makeStrategy('italy', {
      undercut: 'M-H lap 8',
      ideal: 'M-H lap 9',
      overcut: 'M-H lap 12',
      undercutStrength: '1 sec',
      pitStop: '24 sec',
      ers: 'Nincs adat',
      optimalSectors: 'Nincs adat',
      notes: ''
    })
  ],
  'azerbaijan': [
    makeStrategy('azerbaijan', {
      undercut: 'Lap 7 (S → M)',
      ideal: 'Lap 9 (S → M)',
      overcut: 'Lap 11 (S → M)',
      undercutStrength: '1.4 sec',
      pitStop: '24 seconds',
      ers: 'Célegyenes 2km – teljes burn',
      optimalSectors: 'S1 / S3',
      notes: ''
    })
  ],
  'singapore': [
    makeStrategy('singapore', {
      undercut: 'M-H lap 9',
      ideal: 'M-H lap 10',
      overcut: 'M-H lap 11',
      undercutStrength: '1 sec',
      pitStop: 'Nincs adat',
      ers: 'Nincs adat',
      optimalSectors: 'Nincs adat',
      notes: ''
    })
  ],
  'usa': [
    makeStrategy('usa', {
      undercut: 'M-H lap 9',
      ideal: 'M-H lap 10',
      overcut: 'M-H lap 11',
      undercutStrength: '1.5 sec',
      pitStop: 'Nincs adat',
      ers: 'Nincs adat',
      optimalSectors: '0.5 / 0.7 / 0.3',
      notes: ''
    })
  ],
  'mexico': [
    makeStrategy('mexico', {
      undercut: 'M-H lap 12',
      ideal: 'M-H lap 13',
      overcut: 'M-H lap 14',
      undercutStrength: 'Nincs adat',
      pitStop: 'Nincs adat',
      ers: 'Nincs adat',
      optimalSectors: 'Nincs adat',
      notes: ''
    })
  ],
  'brazil': [
    makeStrategy('brazil', {
      undercut: 'M-H lap 13',
      ideal: 'M-H lap 14-15',
      overcut: 'H-M lap 23',
      undercutStrength: '1.5 sec',
      pitStop: '20 sec',
      ers: 'Nincs adat',
      optimalSectors: '0.9 / 0.6 / 0.750',
      notes: ''
    })
  ],
  'las-vegas': [
    makeStrategy('las-vegas', {
      undercut: 'Lap 8 (M → H)',
      ideal: 'Lap 9-10 (M → H)',
      overcut: 'Lap 16-17 (M → H)',
      undercutStrength: '1.5 sec',
      pitStop: '22 seconds',
      ers: 'Lásd részletes ERS jegyzetek',
      optimalSectors: '0.7 / 0.8 / 0.5',
      notes: ''
    })
  ],
  'qatar': [
    makeStrategy('qatar', {
      undercut: 'M-H lap 11',
      ideal: 'M-H lap 12',
      overcut: 'H-M lap 18',
      undercutStrength: '2 sec',
      pitStop: '22 sec',
      ers: 'Nincs adat',
      optimalSectors: '0.3 / 0.5 / 0.7',
      notes: ''
    })
  ],
  'abu-dhabi': [
    makeStrategy('abu-dhabi', {
      undercut: 'M-H lap 11',
      ideal: 'M-H lap 12',
      overcut: 'M-H-H lap 6,17',
      undercutStrength: '2 sec',
      pitStop: '21 sec',
      ers: 'Nincs adat',
      optimalSectors: '0.9 / 0.5 / 0.7',
      notes: ''
    })
  ]
}

