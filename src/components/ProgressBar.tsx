import React from 'react'

interface ProgressBarProps {
  value: number
  max?: number
  label?: string
  showPercentage?: boolean
  className?: string
}

const ProgressBar: React.FC<ProgressBarProps> = ({ 
  value, 
  max = 100, 
  label, 
  showPercentage = true,
  className = '' 
}) => {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <div className="flex justify-between items-center">
          <span className="text-sm font-medium text-f1-text">{label}</span>
          {showPercentage && (
            <span className="text-sm text-f1-text-gold font-mono">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      <div className="w-full bg-f1-dark rounded-full h-2 overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-f1-gold to-f1-gold-light rounded-full transition-all duration-500 ease-out relative"
          style={{ width: `${percentage}%` }}
        >
          <div className="absolute inset-0 shimmer"></div>
        </div>
      </div>
    </div>
  )
}

export default ProgressBar
