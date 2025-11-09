import React, { useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Search,
  MapPin,
  Clock,
  Flag,
  BarChart3,
  Filter,
  Grid,
  List
} from 'lucide-react'
import Card from '../components/Card'
import Button from '../components/Button'
import Input from '../components/Input'
import Select from '../components/Select'
import { f1Tracks } from '../data/tracks'
import { Track } from '../types'
import TrackMapImage from '../components/TrackMapImage'
import { useTrackData } from '../context/TrackDataContext'

const TrackList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedCountry, setSelectedCountry] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const { updateTrack } = useTrackData()

  const countries = useMemo(() => {
    const uniqueCountries = [...new Set(f1Tracks.map(track => track.country))]
    return uniqueCountries.map(country => ({ value: country, label: country }))
  }, [])

  const filteredTracks = useMemo(() => {
    return f1Tracks.filter(track => {
      const matchesSearch = track.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           track.country.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesCountry = !selectedCountry || track.country === selectedCountry
      return matchesSearch && matchesCountry
    })
  }, [searchTerm, selectedCountry])

  const handleTrackClick = (track: Track) => {
    void updateTrack(track.id, (current) => ({
      ...current,
      lastVisited: new Date()
    }))
  }

  const TrackCard: React.FC<{ track: Track }> = ({ track }) => (
    <Card 
      className="group cursor-pointer hover:scale-105 transition-all duration-500 slide-up hover:border-f1-gold/50 hover:shadow-f1-gold/20"
      onClick={() => handleTrackClick(track)}
    >
      <Link to={`/tracks/${track.id}`} className="block" onClick={() => handleTrackClick(track)}>
        <TrackMapImage
          src={track.mapImageUrl}
          alt={`${track.name} layout`}
          className="aspect-video mb-4 transition-transform duration-500 group-hover:scale-105"
          overlayClassName="flex flex-col justify-between p-4 pointer-events-none"
        >
          <div className="flex items-center justify-between">
            <span className="text-[0.65rem] uppercase tracking-[0.35em] text-white/70">
              Track Map
            </span>
            <div className="bg-gradient-to-r from-f1-gold to-f1-gold-dark text-f1-darker px-3 py-1 rounded-full text-xs font-semibold shadow-lg shadow-f1-gold/25">
              {track.country}
            </div>
          </div>
          <div className="text-xs text-white/70 uppercase tracking-widest">
            F1 · 2025 Season
          </div>
        </TrackMapImage>
        
        <div className="space-y-3">
          <h3 className="text-xl font-bold text-f1-text group-hover:text-f1-gold transition-colors duration-300">
            {track.name}
          </h3>
          
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-2">
              <Flag className="h-4 w-4 text-f1-text-secondary group-hover:text-f1-gold transition-colors duration-300" />
              <span className="text-f1-text-secondary group-hover:text-f1-text transition-colors duration-300">{track.country}</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-f1-text-secondary group-hover:text-f1-gold transition-colors duration-300" />
              <span className="text-f1-text-secondary group-hover:text-f1-text transition-colors duration-300">{track.length} km</span>
            </div>
          </div>
          
          <div className="pt-2 border-t border-f1-light-gray group-hover:border-f1-gold/30 transition-colors duration-300">
            <div className="flex items-center justify-between">
              <span className="text-sm text-f1-text-secondary group-hover:text-f1-text transition-colors duration-300">
                {track.laps} kör
              </span>
              <div className="flex items-center space-x-1 text-f1-blue group-hover:text-f1-gold transition-colors duration-300">
                <BarChart3 className="h-4 w-4 float-animation" />
                <span className="text-sm font-medium">Adatok</span>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </Card>
  )

  const TrackListItem: React.FC<{ track: Track }> = ({ track }) => (
    <div 
      className="flex items-center justify-between p-6 bg-f1-gray rounded-lg hover:bg-f1-light-gray transition-colors cursor-pointer group"
      onClick={() => handleTrackClick(track)}
    >
      <Link
        to={`/tracks/${track.id}`}
        className="flex-1 flex items-center space-x-6"
        onClick={() => handleTrackClick(track)}
      >
        <TrackMapImage
          src={track.mapImageUrl}
          alt={`${track.name} layout`}
          className="h-16 w-16 rounded-xl flex-shrink-0"
        />
        
        <div className="flex-1">
          <h3 className="text-lg font-bold text-f1-text group-hover:text-f1-blue transition-colors">
            {track.name}
          </h3>
          <p className="text-f1-text-secondary">{track.country}</p>
        </div>
        
        <div className="flex items-center space-x-6 text-sm text-f1-text-secondary">
          <div className="flex items-center space-x-2">
            <Flag className="h-4 w-4" />
            <span>{track.country}</span>
          </div>
          <div className="flex items-center space-x-2">
            <Clock className="h-4 w-4" />
            <span>{track.length} km</span>
          </div>
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-4 w-4" />
            <span>{track.laps} kör</span>
          </div>
        </div>
      </Link>
    </div>
  )

  return (
    <div className="space-y-8 fade-in">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 slide-down">
        <div>
          <h1 className="text-3xl font-bold gradient-text-gold">F1 Pályák</h1>
          <p className="text-f1-text-secondary mt-2">
            {filteredTracks.length} pálya elérhető az F1 2025 szezonban
          </p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button
            variant={viewMode === 'grid' ? 'gold' : 'secondary'}
            size="sm"
            onClick={() => setViewMode('grid')}
            className="scale-in"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={viewMode === 'list' ? 'gold' : 'secondary'}
            size="sm"
            onClick={() => setViewMode('list')}
            className="scale-in"
            style={{ animationDelay: '0.1s' }}
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-f1-text-secondary" />
            <Input
              placeholder="Pálya vagy ország keresése..."
              value={searchTerm}
              onChange={setSearchTerm}
              className="pl-10"
            />
          </div>
          
          <Select
            label="Ország szűrő"
            options={countries}
            value={selectedCountry}
            onChange={setSelectedCountry}
            placeholder="Minden ország"
          />
          
          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setSearchTerm('')
                setSelectedCountry('')
              }}
              className="w-full"
            >
              <Filter className="h-4 w-4 mr-2" />
              Szűrők törlése
            </Button>
          </div>
        </div>
      </Card>

      {/* Tracks Grid/List */}
      {filteredTracks.length > 0 ? (
        <div className={
          viewMode === 'grid' 
            ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6'
            : 'space-y-4'
        }>
          {filteredTracks.map((track) => (
            viewMode === 'grid' ? (
              <TrackCard key={track.id} track={track} />
            ) : (
              <TrackListItem key={track.id} track={track} />
            )
          ))}
        </div>
      ) : (
        <Card>
          <div className="text-center py-12">
            <MapPin className="h-16 w-16 text-f1-text-secondary mx-auto mb-4" />
            <h3 className="text-xl font-bold text-f1-text mb-2">Nincs találat</h3>
            <p className="text-f1-text-secondary mb-6">
              Próbálj meg más keresési feltételeket használni
            </p>
            <Button
              onClick={() => {
                setSearchTerm('')
                setSelectedCountry('')
              }}
            >
              Szűrők törlése
            </Button>
          </div>
        </Card>
      )}

      {/* Stats */}
      <Card>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-f1-text">{f1Tracks.length}</div>
            <div className="text-f1-text-secondary">Összes pálya</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-f1-text">
              {countries.length}
            </div>
            <div className="text-f1-text-secondary">Ország</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-f1-text">
              {Math.round(f1Tracks.reduce((acc, track) => acc + track.length, 0))}
            </div>
            <div className="text-f1-text-secondary">Összes hossz (km)</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-f1-text">
              {f1Tracks.reduce((acc, track) => acc + track.laps, 0)}
            </div>
            <div className="text-f1-text-secondary">Összes kör</div>
          </div>
        </div>
      </Card>
    </div>
  )
}

export default TrackList
