import React, { useState } from 'react'

interface LogoProps {
  src: string
  alt: string
  className?: string
  fallback: React.ReactNode
}

const LogoWithFallback: React.FC<LogoProps> = ({ src, alt, className, fallback }) => {
  const [hasError, setHasError] = useState(false)

  if (hasError) {
    return <>{fallback}</>
  }

  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
      draggable={false}
    />
  )
}

export const F125Badge: React.FC = () => {
  return (
    <div className="flex items-center space-x-3">
      <LogoWithFallback
        src="/branding/f125-logo.png"
        alt="EA Sports F1 25"
        className="h-10 w-auto object-contain select-none"
        fallback={
          <div className="flex items-center space-x-3">
            <div className="relative flex items-center justify-center h-10 w-10 rounded-full bg-white text-black font-semibold text-xs tracking-tight shadow-lg shadow-black/50">
              EA
              <span className="absolute -bottom-1 text-[8px] font-black tracking-[0.3em]">SPORTS</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="flex items-end space-x-1">
                <span className="text-white font-black text-2xl tracking-tight leading-none">F1</span>
                <span className="text-white text-sm font-semibold leading-none translate-y-1">25</span>
              </div>
              <div className="text-black bg-white px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-[0.4em]">
                Licensed
              </div>
            </div>
          </div>
        }
      />
    </div>
  )
}

export const SimRacingBadge: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <LogoWithFallback
      src="/branding/f1-simracing-logo.png"
      alt="F1 SimRacing"
      className={`object-contain select-none ${className ?? 'h-10 w-auto'}`}
      fallback={
        <div className={`inline-flex items-center space-x-2 rounded-full bg-gradient-to-r from-red-600 via-red-500 to-amber-500 px-4 py-1 shadow-lg shadow-red-900/40 ${className ?? ''}`}>
          <span className="text-white font-black tracking-tight text-sm leading-none">F1</span>
          <span className="text-white uppercase text-xs tracking-[0.5em] leading-none">SimRacing</span>
        </div>
      }
    />
  )
}

