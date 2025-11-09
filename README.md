# F1 Data Manager 2025

Egy modern, professzionális webalkalmazás az F1 2025 szezon adatainak kezelésére. Az alkalmazás lehetővé teszi a gumikopás adatok, stratégiák és lapidő adatok tárolását és kezelését minden F1 pályához.

## 🏎️ Funkciók

### Főbb funkciók
- **Dashboard**: Áttekintés a legutóbbi tevékenységekről és statisztikákról
- **Pálya lista**: Minden F1 2025 pálya részletes információkkal
- **Pálya részletek**: Részletes adatok, stratégiák és gumikopás adatok megtekintése
- **Adatbevitel**: Új adatok hozzáadása gumikopás, stratégiák és lapidő adatokhoz
- **Responsive design**: Minden eszközön tökéletesen működik

### Adatkezelés
- **Gumikopás adatok**: Típus, körök száma, kopás, hőmérséklet, nyomás
- **Stratégiák**: Pit stop tervezés, időjárási viszonyok, várható idő
- **Lapidő adatok**: Legjobb és átlagos lapidők
- **Local Storage**: Adatok helyi tárolása a böngészőben

## 🚀 Telepítés és futtatás

### Előfeltételek
- Node.js (v16 vagy újabb)
- npm vagy yarn

### Telepítés
```bash
# Függőségek telepítése
npm install

# Fejlesztői szerver indítása
npm run dev

# Build készítése
npm run build
```

### Elérhető parancsok
- `npm run dev` - Fejlesztői szerver indítása (http://localhost:3000)
- `npm run build` - Production build készítése
- `npm run preview` - Build előnézete

## 🎨 Dizájn

### Színséma
- **F1 Red**: #E10600 - Főbb akciók, kiemelések
- **F1 Blue**: #00D2BE - Másodlagos elemek, linkek
- **Dark**: #1A1A1A - Háttér
- **Gray**: #2A2A2A - Kártyák, panelek
- **Light Gray**: #3A3A3A - Hover állapotok

### Technológiai stack
- **React 18** - UI framework
- **TypeScript** - Típusbiztonság
- **Tailwind CSS** - Styling
- **React Router** - Navigáció
- **Lucide React** - Ikonok
- **Vite** - Build tool

## 📱 Responsive Design

Az alkalmazás teljes mértékben responsive, és minden eszközön optimálisan működik:
- **Mobile** (< 768px): Egyszerűsített layout, touch-friendly elemek
- **Tablet** (768px - 1024px): Közepes layout, adaptív grid
- **Desktop** (> 1024px): Teljes funkcionalitás, optimalizált layout

## 🗂️ Projekt struktúra

```
src/
├── components/          # Újrafelhasználható komponensek
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Layout.tsx
│   └── Select.tsx
├── data/               # Statikus adatok
│   └── tracks.ts
├── hooks/              # Custom React hookok
│   └── useLocalStorage.ts
├── pages/              # Oldal komponensek
│   ├── Dashboard.tsx
│   ├── TrackList.tsx
│   ├── TrackDetails.tsx
│   └── DataEntry.tsx
├── types/              # TypeScript típusok
│   └── index.ts
├── App.tsx
├── main.tsx
└── index.css
```

## 🔧 Fejlesztés

### Új funkciók hozzáadása
1. Komponens létrehozása a `src/components/` mappában
2. Típusok definiálása a `src/types/index.ts` fájlban
3. Oldal komponens létrehozása a `src/pages/` mappában
4. Routing hozzáadása az `App.tsx` fájlban

### Styling
- Tailwind CSS osztályok használata
- Custom CSS a `src/index.css` fájlban
- Komponens-specifikus stílusok a komponens fájlokban

## 📊 Adatstruktúra

### Track (Pálya)
```typescript
interface Track {
  id: string
  name: string
  country: string
  length: number
  laps: number
  lastVisited?: Date
  imageUrl?: string
}
```

### TireData (Gumikopás adatok)
```typescript
interface TireData {
  compound: 'soft' | 'medium' | 'hard' | 'intermediate' | 'wet'
  laps: number
  degradation: number
  temperature: number
  pressure: number
  notes?: string
}
```

### Strategy (Stratégia)
```typescript
interface Strategy {
  id: string
  name: string
  trackId: string
  totalLaps: number
  pitStops: PitStop[]
  expectedTime: number
  weather: 'dry' | 'wet' | 'mixed'
  notes?: string
  createdAt: Date
}
```

## 🎯 Jövőbeli fejlesztések

- [ ] Adatok exportálása/importálása (CSV, JSON)
- [ ] Grafikonok és diagramok hozzáadása
- [ ] Felhasználói profilok és beállítások
- [ ] Offline támogatás (PWA)
- [ ] Backend integráció
- [ ] Valós idejű adatszinkronizálás

## 📝 Licenc

Ez a projekt személyes használatra készült.

---

**F1 Data Manager 2025** - A versenyzési adatok kezelésének új szintje! 🏁
