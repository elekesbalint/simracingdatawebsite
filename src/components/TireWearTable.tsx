import React from 'react'
import { TrendingUp } from 'lucide-react'
import { TireData } from '../types'

interface TireWearTableProps {
  tireData: TireData[]
  trackName: string
}

const TireWearTable: React.FC<TireWearTableProps> = ({ tireData, trackName }) => {
  const getCompoundColor = (compound: string) => {
    switch (compound) {
      case 'soft': return 'text-red-400'
      case 'medium': return 'text-yellow-400'
      case 'hard': return 'text-white'
      case 'intermediate': return 'text-green-400'
      case 'wet': return 'text-blue-400'
      default: return 'text-f1-text'
    }
  }

  const getCompoundBgColor = (compound: string) => {
    switch (compound) {
      case 'soft': return 'bg-red-500/20 border-red-500/30'
      case 'medium': return 'bg-yellow-500/20 border-yellow-500/30'
      case 'hard': return 'bg-gray-500/20 border-gray-500/30'
      case 'intermediate': return 'bg-green-500/20 border-green-500/30'
      case 'wet': return 'bg-blue-500/20 border-blue-500/30'
      default: return 'bg-f1-gray border-f1-light-gray'
    }
  }

  const formatWear = (value: TireData['degradation']) => {
    if (value === null || value === undefined || value === '') return 'N/A'
    if (typeof value === 'number') {
      return `${value}%`
    }
    return value
  }

  if (tireData.length === 0) {
    return (
      <div className="text-center py-8">
        <TrendingUp className="h-12 w-12 text-f1-text-secondary mx-auto mb-4" />
        <p className="text-f1-text-secondary">Nincsenek gumikopás adatok ehhez a pályához</p>
      </div>
    )
  }

  const compoundSet = tireData[0]?.compoundSet

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold gradient-text-gold">
            {trackName} - Gumikopás adatok
          </h3>
          <p className="text-sm text-f1-text-secondary mt-1">
            {tireData.length} adatpont
          </p>
        </div>
        {compoundSet && (
          <div className="flex items-center space-x-2">
            <span className="text-sm text-f1-text-secondary">Gumikeverék:</span>
            <span className="px-3 py-1 rounded-full bg-f1-dark border border-f1-gold text-sm font-medium text-f1-text-gold">
              {compoundSet.replace(/-/g, ' • ')}
            </span>
          </div>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-f1-light-gray">
              <th className="text-left py-3 px-4 text-f1-text-secondary font-medium">Gumi típusa</th>
              <th className="text-left py-3 px-4 text-f1-text-secondary font-medium">Alap keverék</th>
              <th className="text-left py-3 px-4 text-f1-text-secondary font-medium">Kopás (%)</th>
            </tr>
          </thead>
          <tbody>
            {tireData.map((tire, index) => (
              <tr key={index} className="border-b border-f1-light-gray/50 hover:bg-f1-dark/50 transition-colors">
                <td className="py-4 px-4">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getCompoundBgColor(tire.compound)} ${getCompoundColor(tire.compound)}`}>
                    {tire.compound.toUpperCase()}
                  </div>
                </td>
                <td className="py-4 px-4 text-sm text-f1-text-secondary">
                  {tire.compoundVariant ?? '—'}
                </td>
                <td className="py-4 px-4">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-f1-red" />
                    <span className="text-f1-text font-semibold">
                      {formatWear(tire.degradation)}
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default TireWearTable
