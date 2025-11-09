interface TrackMetaEntry {
  drsZones?: number | null
  pitStopLoss?: number | null
  fuelDelta?: number | null
  ersNotes?: string[]
  details?: string[]
  tireStintLaps?: number | null
}

export const trackMetaData: Record<string, TrackMetaEntry> = {
  'australia': {
    fuelDelta: 0.3,
    drsZones: 2,
    pitStopLoss: 22,
    ersNotes: ['Nincs specifikus ERS stratégia megadva – irányított használat a második szektorban.'],
    details: [],
    tireStintLaps: 29
  },
  'china': {
    fuelDelta: 0.1,
    drsZones: 2,
    pitStopLoss: 21,
    ersNotes: ['Nincs adat'],
    details: [],
    tireStintLaps: 28
  },
  'japan': {
    fuelDelta: 0.1,
    drsZones: 2,
    pitStopLoss: 23,
    ersNotes: [
      'Rajtvonal előtt: Medium, 99%-tól Overtake; célvonal után None.',
      'T1 bejárat: Overtake 76%-ig, majd Medium, kijáraton None.',
      'T2 kijárat: 5% ERS, majd None a T3-T6 szakaszon.',
      'T6 kijárat – T9: 67%-ig Overtake, T8-ig Medium, utána None.',
      'T9 kijárat – T11: 67%-ig Overtake, T10-nél None, majd Medium.',
      'T11-T13: 45%-ig Overtake, féktáv előtt None.',
      'T13-T16: 5% ERS, alapértelmezett None.',
      'T18-tól célig: 9%-ig Overtake, utána Medium.'
    ],
    details: [],
    tireStintLaps: 27
  },
  'bahrain': {
    fuelDelta: 0.6,
    drsZones: 3,
    pitStopLoss: 24,
    ersNotes: ['Hátsó egyenesben ERS burn, kanyargós szakaszokon recharge.'],
    details: [],
    tireStintLaps: 29
  },
  'saudi-arabia': {
    fuelDelta: 0.5,
    drsZones: 3,
    pitStopLoss: 25,
    ersNotes: [
      'T27-D RS: Medium, vonalnál Overtake 85%-ig, majd Medium, féktáv előtt None.',
      'T1-T4: T2 kijáratán 87% Overtake, Medium a féktávig, majd None.',
      'T4-T8: Medium üzemmód.',
      'T8-T9: Apexnél None, kijárat után Medium.',
      'T10-T13: T10 közepétől Overtake 75%-ig, majd Medium, T13 féktáv után None.',
      'T13-T16: T13 kijáratán Overtake 68%-ig, Medium T16 féktávig, utána None.',
      'T16-T17: None, majd Medium a T17-hez.',
      'T17-T22: T17 apexnél Overtake 40%-ig, Medium a féktávig, majd None.',
      'T22-T27: T22-ben Medium, apex után Overtake 10%-ig, Medium a féktávig, majd None.',
      'T27-célig: folyamatos Overtake a célvonalig.'
    ],
    details: [],
    tireStintLaps: 25
  },
  'miami': {
    fuelDelta: 0.1,
    drsZones: 3,
    pitStopLoss: 24,
    ersNotes: ['Hátsó egyenesben burn, stadion szekcióban recharge.'],
    details: [],
    tireStintLaps: 29
  },
  'emilia-romagna': {
    fuelDelta: 0.4,
    drsZones: 1,
    pitStopLoss: 22,
    ersNotes: ['Alta sikán után közepes ERS, célegyenesben burn.'],
    details: [],
    tireStintLaps: 32
  },
  'monaco': {
    fuelDelta: 1.2,
    drsZones: 1,
    pitStopLoss: 25,
    ersNotes: ['ERS használat minimális, csak a célegyenesben.'],
    details: [],
    tireStintLaps: 39
  },
  'spain': {
    fuelDelta: 0.6,
    drsZones: 2,
    pitStopLoss: 22,
    ersNotes: ['ERS burn a hosszú 3-as kanyar utáni egyenesben.'],
    details: [],
    tireStintLaps: 33
  },
  'canada': {
    fuelDelta: 0.1,
    drsZones: 3,
    pitStopLoss: 22,
    ersNotes: ['Wall of Champions előtt ERS burn.'],
    details: [],
    tireStintLaps: 35
  },
  'austria': {
    fuelDelta: 0.1,
    drsZones: 3,
    pitStopLoss: 20,
    ersNotes: ['Felvezető emelkedőn burn, egyébként recharge.'],
    details: [],
    tireStintLaps: 36
  },
  'great-britain': {
    fuelDelta: 0.1,
    drsZones: 3,
    pitStopLoss: 23,
    ersNotes: ['Hangar Straight teljes ERS burn, Becketts után none.'],
    details: [],
    tireStintLaps: 26
  },
  'belgium': {
    fuelDelta: -0.2,
    drsZones: 2,
    pitStopLoss: 25,
    ersNotes: [
      'Rajt-cél szakasz: Overtake a vonalig, majd Medium, T1-ben None.',
      'T1 kijárat – T4: Overtake 78%-ig, majd Medium T4-ig.',
      'T4-T7: T5-től Overtake 50%-ig, Medium T7 féktávig.',
      'T7-T9: None.',
      'T9-T10: apex után 4% ERS, Medium a féktávig, T10-ben None.',
      'T10-T11: Rövid Medium, majd None és újra Medium gázadásnál.',
      'T11-T12: Overtake 60%-ig, Medium T13 féktávig.',
      'T13-T14: T13-ban None, T14 apex után Medium.',
      'T14-T15: Medium a féktávig, majd None.',
      'T15-T19: Overtake 10%-ig, Medium T19 féktávig, utána None.',
      'T19-T20: None; T20-tól a célig ami maradt ERS.'
    ],
    details: [],
    tireStintLaps: 22
  },
  'hungary': {
    fuelDelta: 1.2,
    drsZones: 1,
    pitStopLoss: 22,
    ersNotes: ['ERS használat limitált, főleg a célegyenesben.'],
    details: [],
    tireStintLaps: 35
  },
  'netherlands': {
    fuelDelta: 1.1,
    drsZones: 2,
    pitStopLoss: 22,
    ersNotes: ['Banked kanyar utáni egyenesben ERS burn.'],
    details: [],
    tireStintLaps: 36
  },
  'italy': {
    fuelDelta: 0.81,
    drsZones: 2,
    pitStopLoss: 21,
    ersNotes: ['ERS burn az első sikán utáni egyenesben.'],
    details: [],
    tireStintLaps: 27
  },
  'azerbaijan': {
    fuelDelta: 1.0,
    drsZones: 2,
    pitStopLoss: 24,
    ersNotes: ['Hosszú célegyenesben teljes ERS burn, vár a városi szekcióban.'],
    details: [],
    tireStintLaps: 26
  },
  'singapore': {
    fuelDelta: null,
    drsZones: 3,
    pitStopLoss: 26,
    ersNotes: ['Nincs adat'],
    details: [],
    tireStintLaps: 31
  },
  'usa': {
    fuelDelta: null,
    drsZones: 2,
    pitStopLoss: 25,
    ersNotes: ['Nincs adat'],
    details: [],
    tireStintLaps: 28
  },
  'mexico': {
    fuelDelta: -1.0,
    drsZones: 3,
    pitStopLoss: 22,
    ersNotes: ['Magaslati körülmények – ERS kezelése konzervatív.'],
    details: [],
    tireStintLaps: 36
  },
  'brazil': {
    fuelDelta: -0.2,
    drsZones: 2,
    pitStopLoss: 22,
    ersNotes: ['ERS burn a hátsó egyenesben, többi szakaszon recharge.'],
    details: [],
    tireStintLaps: 36
  },
  'las-vegas': {
    fuelDelta: null,
    drsZones: 2,
    pitStopLoss: 22,
    ersNotes: [
      'T16 előtt érdemes 92%-ig égetni, majd none.',
      'T17-től a 2. „Louis Vuitton” hídig full burn, majd start/finish után none.',
      'T2-T4: 96%-ig burn, majd none.',
      'T4-T5: apex után 76%-ig burn, majd medium T5 féktávig, utána none.',
      'T5-T9: 80%-ig burn T5 kijárat után, utána none.',
      'T9-T12: 78%-ig burn, majd medium T11-ig, utána none.',
      'T12-T14: 28%-ig burn, majd medium T14 féktávig, utána none.',
      'T16-line: all burn.'
    ],
    details: ['Speed Trap: célegyenes vége', 'DRS Detection Zone 1: kanyar 3 után', 'DRS Detection Zone 2: kanyar 13 után'],
    tireStintLaps: 25
  },
  'qatar': {
    fuelDelta: -0.2,
    drsZones: 1,
    pitStopLoss: 23,
    ersNotes: ['Célegyenesben burn, középső szektorban recharge.'],
    details: [],
    tireStintLaps: 29
  },
  'abu-dhabi': {
    fuelDelta: 0.2,
    drsZones: 2,
    pitStopLoss: 23,
    ersNotes: ['Hátsó egyenesekben ERS burn, stadion részben none.'],
    details: [],
    tireStintLaps: 29
  }
}

